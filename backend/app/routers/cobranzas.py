from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Purchase, Sale, Payment, AccountingEntry
from ..schemas import PaymentCreate, PaymentOut, PayableOut, ReceivableOut
from datetime import datetime

router = APIRouter(prefix="/api/cobranzas", tags=["cobranzas"])


def _purchase_paid(p: Purchase) -> float:
    return sum(pay.amount for pay in p.payments)


def _sale_paid(s: Sale) -> float:
    return sum(pay.amount for pay in s.payments)


# ── Cuentas por Pagar (compras a crédito) ────────────────────────────

@router.get("/payables", response_model=List[PayableOut])
def list_payables(db: Session = Depends(get_db)):
    purchases = db.query(Purchase).filter(Purchase.is_credit == True).order_by(Purchase.purchase_date.desc()).all()
    result = []
    for p in purchases:
        paid = _purchase_paid(p)
        balance = round(p.total_cost - paid, 2)
        result.append(PayableOut(
            id=p.id,
            purchase_date=p.purchase_date,
            credit_days=p.credit_days,
            credit_due_date=p.credit_due_date,
            total_cost=p.total_cost,
            amount_paid=round(paid, 2),
            balance=balance,
            status=p.status,
            notes=p.notes,
            supplier=p.supplier,
            payments=[PaymentOut.model_validate(pay) for pay in p.payments],
        ))
    return result


@router.post("/payables/{purchase_id}/pay", response_model=PayableOut)
def pay_purchase(purchase_id: int, data: PaymentCreate, db: Session = Depends(get_db)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p or not p.is_credit:
        raise HTTPException(status_code=404, detail="Compra a crédito no encontrada")

    paid_so_far = _purchase_paid(p)
    balance = p.total_cost - paid_so_far
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    if round(data.amount, 2) > round(balance, 2):
        raise HTTPException(status_code=400, detail=f"El abono (S/ {data.amount:.2f}) supera el saldo pendiente (S/ {balance:.2f})")

    payment = Payment(
        amount=data.amount,
        notes=data.notes or "",
        purchase_id=purchase_id,
        payment_date=datetime.now(),
    )
    db.add(payment)
    db.flush()

    # Asiento contable: Cuentas por Pagar / Efectivo
    db.add(AccountingEntry(
        purchase_id=purchase_id,
        entry_type="pago_proveedor",
        description=f"Abono compra #{purchase_id} — {data.notes or 'pago parcial'}",
        debit_account="Cuentas por Pagar",
        credit_account="Efectivo",
        amount=data.amount,
    ))

    # Actualizar estado
    new_paid = paid_so_far + data.amount
    new_balance = round(p.total_cost - new_paid, 2)
    if new_balance <= 0:
        p.status = "pagado"
    else:
        p.status = "parcial"

    db.commit()
    db.refresh(p)

    paid_final = _purchase_paid(p)
    return PayableOut(
        id=p.id,
        purchase_date=p.purchase_date,
        credit_days=p.credit_days,
        credit_due_date=p.credit_due_date,
        total_cost=p.total_cost,
        amount_paid=round(paid_final, 2),
        balance=round(p.total_cost - paid_final, 2),
        status=p.status,
        notes=p.notes,
        supplier=p.supplier,
        payments=[PaymentOut.model_validate(pay) for pay in p.payments],
    )


# ── Cuentas por Cobrar (ventas a crédito) ────────────────────────────

@router.get("/receivables", response_model=List[ReceivableOut])
def list_receivables(db: Session = Depends(get_db)):
    sales = db.query(Sale).filter(Sale.is_credit == True).order_by(Sale.sale_date.desc()).all()
    result = []
    for s in sales:
        paid = _sale_paid(s)
        balance = round(s.total - paid, 2)
        result.append(ReceivableOut(
            id=s.id,
            sale_date=s.sale_date,
            credit_days=s.credit_days,
            credit_due_date=s.credit_due_date,
            invoice_number=s.invoice_number,
            customer_name=s.customer_name,
            customer_phone=s.customer_phone,
            total=s.total,
            amount_paid=round(paid, 2),
            balance=balance,
            status=s.status,
            notes=s.notes,
            payments=[PaymentOut.model_validate(pay) for pay in s.payments],
        ))
    return result


@router.post("/receivables/{sale_id}/collect", response_model=ReceivableOut)
def collect_sale(sale_id: int, data: PaymentCreate, db: Session = Depends(get_db)):
    s = db.query(Sale).filter(Sale.id == sale_id).first()
    if not s or not s.is_credit:
        raise HTTPException(status_code=404, detail="Venta a crédito no encontrada")

    paid_so_far = _sale_paid(s)
    balance = s.total - paid_so_far
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    if round(data.amount, 2) > round(balance, 2):
        raise HTTPException(status_code=400, detail=f"El cobro (S/ {data.amount:.2f}) supera el saldo pendiente (S/ {balance:.2f})")

    payment = Payment(
        amount=data.amount,
        notes=data.notes or "",
        sale_id=sale_id,
        payment_date=datetime.now(),
    )
    db.add(payment)
    db.flush()

    # Asiento contable: Efectivo / Cuentas por Cobrar
    db.add(AccountingEntry(
        sale_id=sale_id,
        entry_type="cobro_cliente",
        description=f"Cobro venta {s.invoice_number} — {data.notes or 'cobro parcial'}",
        debit_account="Efectivo",
        credit_account="Cuentas por Cobrar",
        amount=data.amount,
    ))

    # Actualizar estado
    new_paid = paid_so_far + data.amount
    new_balance = round(s.total - new_paid, 2)
    if new_balance <= 0:
        s.status = "cobrado"
    else:
        s.status = "parcial"

    db.commit()
    db.refresh(s)

    paid_final = _sale_paid(s)
    return ReceivableOut(
        id=s.id,
        sale_date=s.sale_date,
        credit_days=s.credit_days,
        credit_due_date=s.credit_due_date,
        invoice_number=s.invoice_number,
        customer_name=s.customer_name,
        customer_phone=s.customer_phone,
        total=s.total,
        amount_paid=round(paid_final, 2),
        balance=round(s.total - paid_final, 2),
        status=s.status,
        notes=s.notes,
        payments=[PaymentOut.model_validate(pay) for pay in s.payments],
    )

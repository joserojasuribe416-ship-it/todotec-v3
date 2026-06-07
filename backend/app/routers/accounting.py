from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models import AccountingEntry, CapitalContribution, Sale, Purchase, SaleItem, PurchaseItem, CompanyConfig
from ..schemas import CapitalCreate, CapitalOut, AccountingEntryOut

router = APIRouter(prefix="/api/accounting", tags=["accounting"])


def get_available_cash(db: Session) -> float:
    cash_in = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.debit_account == "Efectivo"
    ).scalar() or 0
    cash_out = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.credit_account == "Efectivo"
    ).scalar() or 0
    return round(cash_in - cash_out, 2)


@router.get("/entries", response_model=List[AccountingEntryOut])
def list_entries(db: Session = Depends(get_db)):
    return db.query(AccountingEntry).order_by(AccountingEntry.entry_date.desc()).all()


@router.get("/cash")
def available_cash(db: Session = Depends(get_db)):
    return {"cash": get_available_cash(db)}


# ── Capital ───────────────────────────────────────────────────────────
@router.get("/capital", response_model=List[CapitalOut])
def list_capital(db: Session = Depends(get_db)):
    return db.query(CapitalContribution).order_by(CapitalContribution.contribution_date.desc()).all()


@router.post("/capital", response_model=CapitalOut, status_code=201)
def add_capital(data: CapitalCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    cap = CapitalContribution(
        contributor=data.contributor or "Socio",
        amount=data.amount,
        description=data.description or "",
        contribution_date=data.contribution_date or datetime.now(),
    )
    db.add(cap)
    db.flush()
    db.add(AccountingEntry(
        capital_id=cap.id,
        entry_type="capital",
        description=f"Aporte de capital — {cap.contributor}",
        debit_account="Efectivo",
        credit_account="Capital Social",
        amount=data.amount,
    ))
    db.commit()
    db.refresh(cap)
    return cap


@router.delete("/capital/{capital_id}")
def delete_capital(capital_id: int, db: Session = Depends(get_db)):
    cap = db.query(CapitalContribution).filter(CapitalContribution.id == capital_id).first()
    if cap:
        db.delete(cap)
        db.commit()
    return {"ok": True}


# ── Reset Balance ─────────────────────────────────────────────────────
@router.post("/reset")
def reset_balance(db: Session = Depends(get_db)):
    """Elimina todos los asientos contables y aportes de capital. Reinicia el correlativo de facturas."""
    db.query(AccountingEntry).delete()
    db.query(CapitalContribution).delete()
    config = db.query(CompanyConfig).first()
    if config:
        config.invoice_correlativo = 1
    db.commit()
    return {"ok": True, "message": "Balance reseteado correctamente"}


# ── Financial Statements ──────────────────────────────────────────────
@router.get("/income-statement")
def income_statement(db: Session = Depends(get_db)):
    sales_total = db.query(func.sum(Sale.total)).scalar() or 0
    cogs = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.entry_type == "cogs"
    ).scalar() or 0
    gross_profit = sales_total - cogs
    expenses = 0.0
    net_income = gross_profit - expenses
    return {
        "ventas": round(sales_total, 2),
        "costo_ventas": round(cogs, 2),
        "utilidad_bruta": round(gross_profit, 2),
        "gastos": round(expenses, 2),
        "utilidad_neta": round(net_income, 2),
    }


@router.get("/balance-sheet")
def balance_sheet(db: Session = Depends(get_db)):
    cash = get_available_cash(db)

    inv_in = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.debit_account == "Inventarios"
    ).scalar() or 0
    inv_out = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.credit_account == "Inventarios"
    ).scalar() or 0
    inventory = inv_in - inv_out

    ar_in = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.debit_account == "Cuentas por Cobrar"
    ).scalar() or 0
    ar_out = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.credit_account == "Cuentas por Cobrar"
    ).scalar() or 0
    accounts_receivable = ar_in - ar_out

    total_assets = max(cash, 0) + max(inventory, 0) + max(accounts_receivable, 0)

    capital = db.query(func.sum(CapitalContribution.amount)).scalar() or 0

    ap_in = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.credit_account == "Cuentas por Pagar"
    ).scalar() or 0

    sales_total = db.query(func.sum(Sale.total)).scalar() or 0
    cogs = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.entry_type == "cogs"
    ).scalar() or 0
    retained_earnings = sales_total - cogs

    return {
        "activos": {
            "efectivo": round(max(cash, 0), 2),
            "inventarios": round(max(inventory, 0), 2),
            "cuentas_por_cobrar": round(max(accounts_receivable, 0), 2),
            "total": round(total_assets, 2),
        },
        "pasivos": {
            "cuentas_por_pagar": round(ap_in, 2),
        },
        "patrimonio": {
            "capital_social": round(capital, 2),
            "utilidades_acumuladas": round(retained_earnings, 2),
            "total": round(capital + retained_earnings, 2),
        },
    }

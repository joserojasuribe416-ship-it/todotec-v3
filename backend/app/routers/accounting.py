from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models import AccountingEntry, CapitalContribution, Sale, Purchase, SaleItem, PurchaseItem, CompanyConfig
from ..schemas import CapitalCreate, CapitalOut, AccountingEntryOut

router = APIRouter(prefix="/api/accounting", tags=["accounting"])


def get_available_cash(db: Session) -> float:
    return round(_account(db, "Efectivo"), 2)


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


# ── Saldo neto de una cuenta contable (débitos − créditos) ───────────
def _account(db, name: str) -> float:
    """
    Retorna el saldo neto de una cuenta.
    Cuentas de activo/gasto: saldo deudor  (+débitos − créditos)
    Cuentas de pasivo/patrimonio/ingreso: se usa con signo negativo en quien llama
    Por construcción de partida doble, Activo = Pasivo + Patrimonio siempre.
    """
    deb = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.debit_account == name
    ).scalar() or 0
    cre = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.credit_account == name
    ).scalar() or 0
    return deb - cre


# ── Financial Statements ──────────────────────────────────────────────
@router.get("/income-statement")
def income_statement(db: Session = Depends(get_db)):
    # Ingresos: cuenta "Ventas" es acreedora → saldo crédito = -_account
    sales_total = -_account(db, "Ventas")
    # COGS: cuenta deudora
    cogs = _account(db, "Costo de Ventas")
    gross_profit = sales_total - cogs
    expenses = 0.0
    net_income = gross_profit - expenses
    return {
        "ventas": round(max(sales_total, 0), 2),
        "costo_ventas": round(max(cogs, 0), 2),
        "utilidad_bruta": round(gross_profit, 2),
        "gastos": round(expenses, 2),
        "utilidad_neta": round(net_income, 2),
    }


@router.get("/balance-sheet")
def balance_sheet(db: Session = Depends(get_db)):
    # ── Activos (cuentas deudoras) ──────────────────────────────────
    efectivo          = _account(db, "Efectivo")
    inventarios       = _account(db, "Inventarios")
    cuentas_cobrar    = _account(db, "Cuentas por Cobrar")
    total_activos     = max(efectivo, 0) + max(inventarios, 0) + max(cuentas_cobrar, 0)

    # ── Pasivos (cuentas acreedoras → saldo crédito = -_account) ───
    cuentas_pagar     = -_account(db, "Cuentas por Pagar")
    total_pasivos     = max(cuentas_pagar, 0)

    # ── Patrimonio ──────────────────────────────────────────────────
    capital           = db.query(func.sum(CapitalContribution.amount)).scalar() or 0
    # Utilidades = Ingresos − Gastos (desde saldos de cuentas)
    ingresos          = -_account(db, "Ventas")          # cuenta acreedora
    gastos            = _account(db, "Costo de Ventas")  # cuenta deudora
    utilidades        = ingresos - gastos
    total_patrimonio  = capital + utilidades

    # ── Verificación de ecuación fundamental ───────────────────────
    ecuacion_ok = round(total_activos, 2) == round(total_pasivos + total_patrimonio, 2)

    return {
        "activos": {
            "efectivo":           round(max(efectivo, 0), 2),
            "inventarios":        round(max(inventarios, 0), 2),
            "cuentas_por_cobrar": round(max(cuentas_cobrar, 0), 2),
            "total":              round(total_activos, 2),
        },
        "pasivos": {
            "cuentas_por_pagar": round(max(cuentas_pagar, 0), 2),
            "total":             round(total_pasivos, 2),
        },
        "patrimonio": {
            "capital_social":        round(capital, 2),
            "utilidades_acumuladas": round(utilidades, 2),
            "total":                 round(total_patrimonio, 2),
        },
        "ecuacion_ok":         ecuacion_ok,
        "pasivo_mas_patrimonio": round(total_pasivos + total_patrimonio, 2),
    }

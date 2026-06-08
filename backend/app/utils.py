from sqlalchemy.orm import Session
from .models import AccountingEntry


def create_reversal_entries(entries: list, db: Session, label: str = ""):
    """
    Genera asientos de reversión (partida doble inversa) para cada entrada recibida.
    Los asientos originales quedan en el historial; los nuevos los anulan.
    """
    for entry in entries:
        prefix = f"ANULACIÓN{' ' + label if label else ''}: "
        reversal_type = f"anulacion_{entry.entry_type}" if not entry.entry_type.startswith("anulacion_") else entry.entry_type
        db.add(AccountingEntry(
            entry_type=reversal_type,
            description=prefix + entry.description,
            debit_account=entry.credit_account,   # invertido
            credit_account=entry.debit_account,   # invertido
            amount=entry.amount,
        ))

"""
Módulo Clientes del admin: lista de cuentas de clientes con sus estadísticas
de compra (pedidos pagados vinculados a la cuenta o al mismo email).
Solo accesible para usuarios del admin (token JWT de admin).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import Customer, Coupon, Order
from .customers import generate_coupon_code

router = APIRouter(prefix="/api/clients", tags=["clients"])

PAID_STATUSES = ("paid", "shipped")


@router.get("")
def list_clients(db: Session = Depends(get_db)):
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    result = []
    for c in customers:
        # Pedidos pagados: vinculados a la cuenta O hechos como invitado con el mismo email
        orders = db.query(Order).filter(
            or_(Order.customer_id == c.id, func.lower(Order.customer_email) == c.email),
            Order.status.in_(PAID_STATUSES),
        ).all()
        total_spent = float(sum((o.total or 0) for o in orders))
        last_order = max((o.created_at for o in orders if o.created_at), default=None)
        coupons = [
            {"code": cp.code, "percent": float(cp.percent or 0), "is_used": cp.is_used}
            for cp in c.coupons
        ]
        result.append({
            "id": c.id,
            "email": c.email,
            "nombre": c.nombre,
            "apellido": c.apellido,
            "dni": c.dni,
            "celular": c.celular,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "purchases": len(orders),
            "total_spent": round(total_spent, 2),
            "last_order": last_order.isoformat() if last_order else None,
            "coupons": coupons,
            "is_active": c.is_active,
        })
    return result


class GrantCouponIn(BaseModel):
    percent: float
    description: Optional[str] = ""


@router.post("/{customer_id}/coupons", status_code=201)
def grant_coupon(customer_id: int, data: GrantCouponIn, db: Session = Depends(get_db)):
    """El admin regala un cupón a un cliente (porcentaje libre, un solo uso)."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if not (1 <= data.percent <= 100):
        raise HTTPException(status_code=400, detail="El porcentaje debe estar entre 1 y 100")
    coupon = Coupon(
        code=generate_coupon_code(db).replace("GLOWI30-", f"GLOWI{int(data.percent)}-"),
        customer_id=customer.id,
        percent=data.percent,
        description=data.description or f"{int(data.percent)}% de descuento — regalo de Glowi Skin",
    )
    db.add(coupon)
    db.commit()
    return {"code": coupon.code, "percent": float(coupon.percent), "description": coupon.description}


@router.delete("/coupons/{code}")
def revoke_coupon(code: str, db: Session = Depends(get_db)):
    """Elimina un cupón NO usado (los usados se conservan como historial)."""
    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    if coupon.is_used:
        raise HTTPException(status_code=400, detail="No se puede eliminar un cupón ya usado")
    db.delete(coupon)
    db.commit()
    return {"ok": True}


@router.get("/summary")
def clients_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(Customer.id)).scalar() or 0
    coupons_used = db.query(func.count(Coupon.id)).filter(Coupon.is_used == True).scalar() or 0
    coupons_pending = db.query(func.count(Coupon.id)).filter(Coupon.is_used == False).scalar() or 0
    return {"total_clients": total, "coupons_used": coupons_used, "coupons_pending": coupons_pending}

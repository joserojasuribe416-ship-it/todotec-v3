import os
import mercadopago
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..models import Order

router = APIRouter(prefix="/api/orders", tags=["orders"])


def get_mp_sdk():
    token = os.getenv("MP_ACCESS_TOKEN", "")
    if not token:
        raise HTTPException(status_code=500, detail="MP_ACCESS_TOKEN no configurado")
    return mercadopago.SDK(token)


# ── Schemas ───────────────────────────────────────────────────────────────────

class OrderItemIn(BaseModel):
    product_id: int
    name: str
    quantity: int
    price: float
    variant_color: Optional[str] = ""
    image: Optional[str] = ""

class CustomerIn(BaseModel):
    nombre: str
    apellido: str
    email: str
    dni: str
    celular: str

class DeliveryIn(BaseModel):
    type: str  # "pickup" | "delivery"
    point_name: Optional[str] = ""
    point_address: Optional[str] = ""
    department: Optional[str] = ""
    province: Optional[str] = ""
    district: Optional[str] = ""
    address: Optional[str] = ""

class CreatePreferenceIn(BaseModel):
    items: List[OrderItemIn]
    customer: CustomerIn
    delivery: DeliveryIn
    subtotal: float
    shipping_cost: float
    total: float

class StatusUpdate(BaseModel):
    status: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/create-preference")
def create_preference(data: CreatePreferenceIn, db: Session = Depends(get_db)):
    sdk = get_mp_sdk()
    store_url = os.getenv("STORE_URL", "http://localhost:3000").rstrip("/")
    backend_url = os.getenv("BACKEND_URL", os.getenv("RAILWAY_PUBLIC_DOMAIN", "http://localhost:8000")).rstrip("/")
    if backend_url and not backend_url.startswith("http"):
        backend_url = f"https://{backend_url}"
    sandbox = os.getenv("MP_SANDBOX", "true").lower() == "true"

    # Guardar orden en DB (pending)
    order = Order(
        status="pending_payment",
        customer_nombre=data.customer.nombre,
        customer_apellido=data.customer.apellido,
        customer_email=data.customer.email,
        customer_dni=data.customer.dni,
        customer_celular=data.customer.celular,
        delivery_type=data.delivery.type,
        delivery_data=data.delivery.model_dump(),
        items=[i.model_dump() for i in data.items],
        subtotal=data.subtotal,
        shipping_cost=data.shipping_cost,
        total=data.total,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Construir items para MP
    mp_items = [
        {
            "id": str(item.product_id),
            "title": item.name + (f" – {item.variant_color}" if item.variant_color else ""),
            "quantity": item.quantity,
            "unit_price": round(item.price, 2),
            "currency_id": "PEN",
        }
        for item in data.items
    ]

    igv = round(data.subtotal * 0.18, 2)
    if igv > 0:
        mp_items.append({"id": "igv", "title": "IGV 18%", "quantity": 1, "unit_price": igv, "currency_id": "PEN"})
    if data.shipping_cost > 0:
        mp_items.append({"id": "envio", "title": "Costo de envío", "quantity": 1, "unit_price": round(data.shipping_cost, 2), "currency_id": "PEN"})

    preference_data = {
        "items": mp_items,
        "payer": {
            "name": data.customer.nombre,
            "surname": data.customer.apellido,
            "email": data.customer.email,
        },
        "back_urls": {
            "success": f"{store_url}/checkout/success",
            "failure": f"{store_url}/checkout",
            "pending": f"{store_url}/checkout/success",
        },
        "auto_return": "approved",
        "external_reference": str(order.id),
        "notification_url": f"{backend_url}/api/orders/webhook",
        "statement_descriptor": "Glowi Skin",
    }

    response = sdk.preference().create(preference_data)

    if response["status"] not in [200, 201]:
        db.delete(order)
        db.commit()
        raise HTTPException(status_code=502, detail=f"Error MercadoPago: {response.get('response', {})}")

    pref = response["response"]
    order.mp_preference_id = pref["id"]
    db.commit()

    checkout_url = pref.get("sandbox_init_point") if sandbox else pref.get("init_point")
    if not checkout_url:
        checkout_url = pref.get("init_point") or pref.get("sandbox_init_point")

    return {
        "order_id": order.id,
        "order_number": 10000 + order.id,
        "checkout_url": checkout_url,
    }


@router.post("/webhook")
async def mp_webhook(request: Request, db: Session = Depends(get_db)):
    """IPN / Webhook de MercadoPago"""
    try:
        data = await request.json()
    except Exception:
        data = {}

    topic = data.get("type") or request.query_params.get("topic")
    resource_id = (data.get("data") or {}).get("id") or request.query_params.get("id")

    if topic == "payment" and resource_id:
        try:
            sdk = get_mp_sdk()
            payment_info = sdk.payment().get(resource_id)
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                ext_ref = payment.get("external_reference")
                status = payment.get("status")
                if ext_ref and status == "approved":
                    order = db.query(Order).filter(Order.id == int(ext_ref)).first()
                    if order and order.status == "pending_payment":
                        order.status = "paid"
                        order.mp_payment_id = str(resource_id)
                        db.commit()
        except Exception:
            pass

    return {"ok": True}


@router.post("/{order_id}/verify")
def verify_payment(order_id: int, payment_id: Optional[str] = None, db: Session = Depends(get_db)):
    """El success page llama esto para confirmar el pago"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if payment_id and order.status == "pending_payment":
        try:
            sdk = get_mp_sdk()
            payment_info = sdk.payment().get(payment_id)
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                if payment.get("status") == "approved":
                    order.status = "paid"
                    order.mp_payment_id = str(payment_id)
                    db.commit()
                    db.refresh(order)
        except Exception:
            pass

    return {
        "id": order.id,
        "order_number": 10000 + order.id,
        "status": order.status,
        "customer_nombre": order.customer_nombre,
        "customer_apellido": order.customer_apellido,
        "customer_email": order.customer_email,
        "total": order.total,
        "items": order.items,
        "delivery_type": order.delivery_type,
        "delivery_data": order.delivery_data,
    }


@router.get("")
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "order_number": 10000 + o.id,
            "status": o.status,
            "customer_nombre": o.customer_nombre,
            "customer_apellido": o.customer_apellido,
            "customer_email": o.customer_email,
            "customer_celular": o.customer_celular,
            "customer_dni": o.customer_dni,
            "delivery_type": o.delivery_type,
            "delivery_data": o.delivery_data,
            "items": o.items,
            "subtotal": o.subtotal,
            "shipping_cost": o.shipping_cost,
            "total": o.total,
            "mp_preference_id": o.mp_preference_id,
            "mp_payment_id": o.mp_payment_id,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.put("/{order_id}/status")
def update_order_status(order_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order.status = data.status
    db.commit()
    return {"ok": True, "status": data.status}

import os
import logging
import mercadopago
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..models import Order, Sale, SaleItem, Product, ProductVariant, AccountingEntry, CompanyConfig, Coupon
from ..utils import create_reversal_entries
from .auth import get_current_user
from .customers import get_optional_customer
from datetime import datetime

router = APIRouter(prefix="/api/orders", tags=["orders"])
logger = logging.getLogger("todotec.orders")


# ── Auto-venta al pagar ───────────────────────────────────────────────────────

def _create_sale_from_order(order: Order, db: Session):
    """Crea un registro Sale con stock y contabilidad cuando el pedido se paga."""
    # Config de empresa (número de factura, IGV)
    config = db.query(CompanyConfig).first()
    if not config:
        config = CompanyConfig(id=1)
        db.add(config)
        db.flush()

    subtotal = 0.0
    sale_items_data = []

    # Si el pedido tiene descuento por cupón, se reparte proporcionalmente
    # entre los ítems: catalog_price = precio original, sale_price = con descuento.
    order_subtotal = float(order.subtotal or 0)
    order_discount = float(order.discount or 0)
    discount_factor = 1.0
    if order_discount > 0 and order_subtotal > 0:
        discount_factor = max(0.0, 1.0 - order_discount / order_subtotal)

    for item_json in (order.items or []):
        product_id = item_json.get("product_id")
        quantity = int(item_json.get("quantity", 1))
        price = float(item_json.get("price", 0.0))
        variant_color = item_json.get("variant_color", "")

        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            continue

        # Buscar variante por color — with_for_update bloquea la fila mientras
        # se descuenta el stock (evita que dos pagos simultáneos tomen la misma unidad)
        variant = None
        if variant_color:
            variant = db.query(ProductVariant).filter(
                ProductVariant.product_id == product_id,
                ProductVariant.color == variant_color,
            ).with_for_update().first()
        if not variant and product.variants:
            variant = db.query(ProductVariant).filter(
                ProductVariant.product_id == product_id,
            ).with_for_update().first()

        final_price = round(price * discount_factor, 2)
        item_subtotal = round(final_price * quantity, 2)
        subtotal += item_subtotal
        sale_items_data.append({
            "product": product,
            "variant": variant,
            "quantity": quantity,
            "price": final_price,
            "catalog_price": price,
            "subtotal": item_subtotal,
        })

    if not sale_items_data:
        return None  # Nada que registrar

    tax_rate = float(getattr(config, "tax_rate", 0.18) or 0.18)
    tax_amount = round(subtotal * tax_rate, 2)
    total = round(subtotal + tax_amount, 2)

    invoice_series = getattr(config, "invoice_series", "B001") or "B001"
    correlativo = getattr(config, "invoice_correlativo", 1) or 1
    invoice_number = f"{invoice_series}-{str(correlativo).zfill(8)}"
    config.invoice_correlativo = correlativo + 1

    # Dirección de entrega
    if order.delivery_type == "pickup":
        delivery_address = (order.delivery_data or {}).get("point_address", "")
    else:
        dd = order.delivery_data or {}
        parts = [dd.get("address", ""), dd.get("district", ""), dd.get("province", ""), dd.get("department", "")]
        delivery_address = ", ".join(p for p in parts if p)

    order_number = 10000 + order.id
    sale = Sale(
        customer_name=f"{order.customer_nombre} {order.customer_apellido}".strip() or "Cliente Web",
        customer_email=order.customer_email or "",
        customer_phone=order.customer_celular or "",
        customer_address=delivery_address,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=total,
        is_credit=False,
        status="cobrado",
        invoice_number=invoice_number,
        notes=f"Pedido web #{order_number} · MP {order.mp_payment_id or ''}",
        sale_type="retail",
    )
    db.add(sale)
    db.flush()

    cogs = 0.0
    for item_data in sale_items_data:
        product = item_data["product"]
        variant = item_data["variant"]
        unit_cost = float(product.unit_cost or 0.0)

        db.add(SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            variant_id=variant.id if variant else None,
            quantity=item_data["quantity"],
            catalog_price=item_data.get("catalog_price", item_data["price"]),
            sale_price=item_data["price"],
            unit_cost=unit_cost,
            subtotal=item_data["subtotal"],
        ))

        # Descontar stock — si no alcanza (caso límite: el pago ya se hizo),
        # se descuenta lo que hay y queda registrado en la bitácora para reponer
        if variant:
            if variant.stock < item_data["quantity"]:
                logger.warning(
                    "SOBREVENTA en pedido #%s: %s (%s) pedido x%s pero stock era %s — reponer y contactar al cliente",
                    10000 + order.id, product.name, variant.color, item_data["quantity"], variant.stock,
                )
            variant.stock = max(0, variant.stock - item_data["quantity"])
        elif product.variants:
            for v in product.variants:
                if v.stock >= item_data["quantity"]:
                    v.stock -= item_data["quantity"]
                    break

        cogs += unit_cost * item_data["quantity"]

    # Asiento contable — ingresos
    db.add(AccountingEntry(
        sale_id=sale.id,
        entry_type="venta",
        description=f"Venta web {invoice_number} — Pedido #{order_number}",
        debit_account="Efectivo",
        credit_account="Ventas",
        amount=total,
    ))
    # Asiento contable — costo de ventas
    if cogs > 0:
        db.add(AccountingEntry(
            sale_id=sale.id,
            entry_type="cogs",
            description=f"Costo de ventas web {invoice_number}",
            debit_account="Costo de Ventas",
            credit_account="Inventarios",
            amount=round(cogs, 2),
        ))

    return sale.id


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
    coupon_code: Optional[str] = ""

class CreateManualOrderIn(BaseModel):
    items: List[OrderItemIn]
    customer: CustomerIn
    delivery: DeliveryIn
    subtotal: float
    shipping_cost: float
    total: float
    notes: Optional[str] = ""

class StatusUpdate(BaseModel):
    status: str

class CreateQROrderIn(BaseModel):
    items: List[OrderItemIn]
    customer: CustomerIn
    delivery: DeliveryIn
    subtotal: float
    shipping_cost: float
    total: float
    coupon_code: Optional[str] = ""


def _validate_stock(items, db: Session):
    """Rechaza el pedido ANTES de cobrar si no hay stock suficiente."""
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"El producto '{item.name}' ya no está disponible")
        if item.variant_color:
            variant = db.query(ProductVariant).filter(
                ProductVariant.product_id == item.product_id,
                ProductVariant.color == item.variant_color,
            ).first()
            available = variant.stock if variant else product.total_stock
            label = f"{product.name} ({item.variant_color})"
        else:
            available = product.total_stock
            label = product.name
        if available < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {label}: quedan {available} unidad(es) y pediste {item.quantity}",
            )


def _release_coupon(order: Order, db: Session):
    """Devuelve el cupón al cliente cuando su pedido se cancela o elimina."""
    if order.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == order.coupon_code).first()
        if coupon and coupon.is_used:
            coupon.is_used = False
            coupon.used_at = None
            coupon.order_id = None
            logger.info("Cupón %s liberado (pedido #%s cancelado/eliminado)", coupon.code, 10000 + order.id)


def _resolve_coupon_and_customer(data, request: Request, db: Session):
    """Identifica al cliente (si hay sesión) y valida/consume el cupón.
    Devuelve (customer_id, coupon, discount). El descuento se calcula
    SIEMPRE en el servidor — nunca se confía en el monto del navegador."""
    customer = get_optional_customer(request, db)
    coupon = None
    discount = 0.0
    code = (data.coupon_code or "").strip().upper()
    if code:
        coupon = db.query(Coupon).filter(Coupon.code == code, Coupon.is_used == False).first()
        if not coupon:
            raise HTTPException(status_code=400, detail="Cupón inválido o ya utilizado")
        if not customer or coupon.customer_id != customer.id:
            raise HTTPException(status_code=400, detail="Inicia sesión con la cuenta dueña del cupón")
        discount = round(data.subtotal * float(coupon.percent) / 100, 2)
    return (customer.id if customer else None), coupon, discount


def _consume_coupon(coupon, order_id: int):
    if coupon:
        coupon.is_used = True
        coupon.used_at = datetime.now()
        coupon.order_id = order_id


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/create-preference")
def create_preference(data: CreatePreferenceIn, request: Request, db: Session = Depends(get_db)):
    sdk = get_mp_sdk()
    store_url = os.getenv("STORE_URL", "http://localhost:3000").rstrip("/")
    backend_url = os.getenv("BACKEND_URL", os.getenv("RAILWAY_PUBLIC_DOMAIN", "http://localhost:8000")).rstrip("/")
    if backend_url and not backend_url.startswith("http"):
        backend_url = f"https://{backend_url}"
    sandbox = os.getenv("MP_SANDBOX", "true").lower() == "true"

    # Stock validado ANTES de mandar al cliente a pagar
    _validate_stock(data.items, db)
    # Cliente registrado + cupón (validado y calculado en el servidor)
    customer_id, coupon, discount = _resolve_coupon_and_customer(data, request, db)
    discounted_subtotal = round(data.subtotal - discount, 2)
    total = round(discounted_subtotal * 1.18 + data.shipping_cost, 2)
    factor = (discounted_subtotal / data.subtotal) if data.subtotal > 0 else 1.0

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
        total=total,
        customer_id=customer_id,
        coupon_code=coupon.code if coupon else "",
        discount=discount,
    )
    db.add(order)
    db.flush()
    _consume_coupon(coupon, order.id)
    db.commit()
    db.refresh(order)

    # Construir items para MP (precios con descuento proporcional si hay cupón)
    mp_items = [
        {
            "id": str(item.product_id),
            "title": item.name + (f" – {item.variant_color}" if item.variant_color else ""),
            "quantity": item.quantity,
            "unit_price": round(item.price * factor, 2),
            "currency_id": "PEN",
        }
        for item in data.items
    ]

    igv = round(discounted_subtotal * 0.18, 2)
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
                        db.flush()
                        sale_id = _create_sale_from_order(order, db)
                        if sale_id:
                            order.sale_id = sale_id
                        db.commit()
                        logger.info("Webhook MP: pedido #%s pagado, venta %s creada", 10000 + order.id, sale_id)
            else:
                logger.warning("Webhook MP: consulta del pago %s devolvió status %s", resource_id, payment_info["status"])
        except Exception:
            db.rollback()
            # Registrar el error y responder 500: MercadoPago reintenta el aviso
            # automáticamente, así el pago no se pierde por una falla momentánea.
            logger.exception("Webhook MP: error procesando pago %s — MP reintentará", resource_id)
            raise HTTPException(status_code=500, detail="Error procesando webhook, reintentar")

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
                    db.flush()
                    sale_id = _create_sale_from_order(order, db)
                    if sale_id:
                        order.sale_id = sale_id
                    db.commit()
                    db.refresh(order)
                    logger.info("Verify: pedido #%s confirmado, venta %s creada", 10000 + order.id, sale_id)
        except Exception:
            db.rollback()
            logger.exception("Verify: error verificando pago %s del pedido %s", payment_id, order_id)

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


@router.get("", dependencies=[Depends(get_current_user)])
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
            "source": o.source or "web",
            "payment_method": o.payment_method or "mercadopago",
            "payment_screenshot_url": o.payment_screenshot_url or "",
            "whatsapp_notified": o.whatsapp_notified or False,
            "mp_preference_id": o.mp_preference_id,
            "mp_payment_id": o.mp_payment_id,
            "sale_id": o.sale_id,
            "customer_id": o.customer_id,
            "coupon_code": o.coupon_code or "",
            "discount": float(o.discount or 0),
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.post("/create-qr")
def create_qr_order(data: CreateQROrderIn, request: Request, db: Session = Depends(get_db)):
    """Crea un pedido con pago por QR (pendiente de confirmación por admin)."""
    _validate_stock(data.items, db)
    customer_id, coupon, discount = _resolve_coupon_and_customer(data, request, db)
    discounted_subtotal = round(data.subtotal - discount, 2)
    total = round(discounted_subtotal * 1.18 + data.shipping_cost, 2)

    order = Order(
        source="web",
        payment_method="qr",
        status="pending_confirmation",
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
        total=total,
        mp_preference_id="",
        mp_payment_id="",
        customer_id=customer_id,
        coupon_code=coupon.code if coupon else "",
        discount=discount,
    )
    db.add(order)
    db.flush()
    _consume_coupon(coupon, order.id)
    db.commit()
    db.refresh(order)
    return {"order_id": order.id, "order_number": 10000 + order.id, "total": float(order.total), "discount": float(order.discount or 0)}


@router.post("/{order_id}/screenshot")
async def upload_payment_screenshot(order_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Sube la captura de pago QR del cliente a Cloudinary."""
    from ..cloudinary_client import upload_image as cloudinary_upload
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    url = await cloudinary_upload(file, folder="glowi-skin/payment-screenshots", public_id=f"screenshot-order-{order_id}")
    order.payment_screenshot_url = url
    db.commit()
    return {"screenshot_url": url}


@router.put("/{order_id}/whatsapp-notified", dependencies=[Depends(get_current_user)])
def mark_whatsapp_notified(order_id: int, db: Session = Depends(get_db)):
    """Marca que el admin ya envió la notificación de WhatsApp."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        order.whatsapp_notified = True
        db.commit()
    return {"ok": True}


@router.post("/manual", dependencies=[Depends(get_current_user)])
def create_manual_order(data: CreateManualOrderIn, db: Session = Depends(get_db)):
    order = Order(
        source="manual",
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
        mp_preference_id="",
        mp_payment_id="",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "order_number": 10000 + order.id,
    }


@router.put("/{order_id}/status", dependencies=[Depends(get_current_user)])
def update_order_status(order_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    prev_status = order.status
    order.status = data.status

    # Pedido cancelado: el cupón vuelve a estar disponible para el cliente
    if data.status == "cancelled" and prev_status != "cancelled":
        _release_coupon(order, db)

    # Si se marca como pagado y aún no tiene venta, generarla
    if data.status == "paid" and prev_status != "paid" and not order.sale_id:
        db.flush()
        sale_id = _create_sale_from_order(order, db)
        if sale_id:
            order.sale_id = sale_id

    db.commit()
    return {"ok": True, "status": data.status}


@router.delete("/{order_id}", dependencies=[Depends(get_current_user)])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # Si tiene venta enlazada, eliminarla y revertir stock
    if order.sale_id:
        sale = db.query(Sale).filter(Sale.id == order.sale_id).first()
        if sale:
            # Revertir stock
            for item in sale.items:
                if item.variant_id:
                    variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
                    if variant:
                        variant.stock += item.quantity
                elif item.product:
                    for v in item.product.variants:
                        v.stock += item.quantity
                        break
            # Asientos de reversión (historial contable)
            entries = db.query(AccountingEntry).filter(AccountingEntry.sale_id == sale.id).all()
            create_reversal_entries(entries, db, label=f"Pedido #{10000 + order.id}")
            db.delete(sale)

    # El cupón usado en este pedido vuelve al cliente
    _release_coupon(order, db)

    db.delete(order)
    db.commit()
    return {"ok": True}

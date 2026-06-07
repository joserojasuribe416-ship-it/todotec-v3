from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models import Purchase, PurchaseItem, Product, ProductVariant, AccountingEntry
from ..schemas import PurchaseCreate, PurchaseOut, PurchaseRectify
import random, string
from datetime import datetime

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


def make_sku(db: Session) -> str:
    while True:
        sku = "TT-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=7))
        if not db.query(Product).filter(Product.sku == sku).first():
            return sku


@router.get("", response_model=List[PurchaseOut])
def list_purchases(db: Session = Depends(get_db)):
    return db.query(Purchase).order_by(Purchase.purchase_date.desc()).all()


@router.get("/{purchase_id}", response_model=PurchaseOut)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    return p


@router.post("", response_model=PurchaseOut, status_code=201)
def create_purchase(data: PurchaseCreate, db: Session = Depends(get_db)):
    # Calculate proportional cost allocation
    products_cost = sum(item.unit_cost * item.quantity for item in data.items)
    total_extra = data.shipping_cost + data.taxes
    total_qty = sum(item.quantity for item in data.items)

    # Validate cash if paying in cash (not credit)
    if not data.is_credit:
        cash_in = db.query(func.sum(AccountingEntry.amount)).filter(
            AccountingEntry.debit_account == "Efectivo"
        ).scalar() or 0
        cash_out = db.query(func.sum(AccountingEntry.amount)).filter(
            AccountingEntry.credit_account == "Efectivo"
        ).scalar() or 0
        available_cash = cash_in - cash_out
        estimated_total = sum(
            (item.unit_cost * item.quantity) for item in data.items
        ) + data.shipping_cost + data.taxes
        if available_cash < estimated_total:
            raise HTTPException(
                status_code=400,
                detail=f"Efectivo insuficiente. Disponible: S/ {available_cash:.2f} — Requerido: S/ {estimated_total:.2f}. Registra un aporte de capital o usa compra a crédito."
            )

    purchase = Purchase(
        supplier_id=data.supplier_id,
        purchase_date=data.purchase_date or datetime.now(),
        shipping_cost=data.shipping_cost,
        taxes=data.taxes,
        notes=data.notes or "",
        is_credit=data.is_credit,
        credit_due_date=data.credit_due_date,
        status="credito" if data.is_credit else "pagado",
    )
    db.add(purchase)
    db.flush()

    total_cost = 0.0
    for item_data in data.items:
        # Get or create product
        if item_data.product_id:
            product = db.query(Product).filter(Product.id == item_data.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Producto {item_data.product_id} no encontrado")
        else:
            # Create new product
            product = Product(
                sku=make_sku(db),
                name=item_data.product_name or "Producto sin nombre",
                category=item_data.category or "",
                description=item_data.description or "",
                sale_price=item_data.sale_price or 0.0,
            )
            db.add(product)
            db.flush()

        # Proportional extra cost per unit
        extra_per_unit = (total_extra / total_qty) if total_qty > 0 else 0
        real_unit_cost = item_data.unit_cost + extra_per_unit
        subtotal = real_unit_cost * item_data.quantity
        total_cost += subtotal

        pi = PurchaseItem(
            purchase_id=purchase.id,
            product_id=product.id,
            quantity=item_data.quantity,
            unit_cost=real_unit_cost,
            subtotal=subtotal,
            variants_data=[v.model_dump() for v in item_data.variants],
        )
        db.add(pi)

        # Update/create variants stock
        if item_data.variants:
            for v_data in item_data.variants:
                variant = db.query(ProductVariant).filter(
                    ProductVariant.product_id == product.id,
                    ProductVariant.color == v_data.color
                ).first()
                if variant:
                    variant.stock += v_data.qty
                else:
                    db.add(ProductVariant(product_id=product.id, color=v_data.color, stock=v_data.qty))
        else:
            # No variants: use default stock on first variant or create one
            default = db.query(ProductVariant).filter(
                ProductVariant.product_id == product.id,
                ProductVariant.color == "Estándar"
            ).first()
            if default:
                default.stock += item_data.quantity
            else:
                db.add(ProductVariant(product_id=product.id, color="Estándar", stock=item_data.quantity))

    purchase.total_cost = total_cost

    # Accounting entries
    if data.is_credit:
        # Inventario / Cuentas por Pagar
        db.add(AccountingEntry(
            purchase_id=purchase.id,
            entry_type="compra",
            description=f"Compra #{purchase.id} — crédito",
            debit_account="Inventarios",
            credit_account="Cuentas por Pagar",
            amount=total_cost,
        ))
    else:
        # Inventario / Efectivo
        db.add(AccountingEntry(
            purchase_id=purchase.id,
            entry_type="compra",
            description=f"Compra #{purchase.id} — contado",
            debit_account="Inventarios",
            credit_account="Efectivo",
            amount=total_cost,
        ))

    db.commit()
    db.refresh(purchase)
    return purchase


@router.patch("/{purchase_id}/rectify", response_model=PurchaseOut)
def rectify_purchase(purchase_id: int, data: PurchaseRectify, db: Session = Depends(get_db)):
    """Rectificar una compra: ajusta cantidades/costos, inventario y contabilidad."""
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    new_total = 0.0

    for upd in data.items:
        item = db.query(PurchaseItem).filter(PurchaseItem.id == upd.purchase_item_id).first()
        if not item:
            continue

        old_qty = item.quantity
        new_qty = upd.new_quantity
        diff_qty = new_qty - old_qty

        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            if item.variants_data and len(item.variants_data) > 0:
                # Use provided variants if given, otherwise adjust proportionally
                if upd.new_variants:
                    # Reverse old variants
                    for v in item.variants_data:
                        variant = db.query(ProductVariant).filter(
                            ProductVariant.product_id == product.id,
                            ProductVariant.color == v.get("color")
                        ).first()
                        if variant:
                            variant.stock = max(0, variant.stock - v.get("qty", 0))
                    # Apply new variants
                    for v in upd.new_variants:
                        variant = db.query(ProductVariant).filter(
                            ProductVariant.product_id == product.id,
                            ProductVariant.color == v.get("color")
                        ).first()
                        if variant:
                            variant.stock += v.get("qty", 0)
                        else:
                            db.add(ProductVariant(product_id=product.id, color=v.get("color"), stock=v.get("qty", 0)))
                    item.variants_data = upd.new_variants
                else:
                    # Adjust each variant proportionally
                    ratio = (new_qty / old_qty) if old_qty > 0 else 1
                    new_variants_data = []
                    for v in item.variants_data:
                        variant = db.query(ProductVariant).filter(
                            ProductVariant.product_id == product.id,
                            ProductVariant.color == v.get("color")
                        ).first()
                        if variant:
                            old_v_qty = v.get("qty", 0)
                            new_v_qty = max(0, round(old_v_qty * ratio))
                            variant.stock = max(0, variant.stock - old_v_qty + new_v_qty)
                            new_variants_data.append({"color": v.get("color"), "qty": new_v_qty})
                    item.variants_data = new_variants_data
            else:
                default = db.query(ProductVariant).filter(
                    ProductVariant.product_id == product.id
                ).first()
                if default:
                    default.stock = max(0, default.stock + diff_qty)

        new_subtotal = new_qty * upd.new_unit_cost
        item.quantity = new_qty
        item.unit_cost = upd.new_unit_cost
        item.subtotal = new_subtotal
        new_total += new_subtotal

    p.total_cost = new_total
    if data.notes is not None:
        p.notes = data.notes

    # Reverse old accounting entries and create new ones
    old_entries = db.query(AccountingEntry).filter(AccountingEntry.purchase_id == purchase_id).all()
    for entry in old_entries:
        db.delete(entry)

    credit_account = "Cuentas por Pagar" if p.is_credit else "Efectivo"
    db.add(AccountingEntry(
        purchase_id=purchase_id,
        entry_type="compra",
        description=f"Compra #{purchase_id} — rectificada",
        debit_account="Inventarios",
        credit_account=credit_account,
        amount=new_total,
    ))

    db.commit()
    db.refresh(p)
    return p


@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    # Reverse stock
    for item in p.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and item.variants_data:
            for v in item.variants_data:
                variant = db.query(ProductVariant).filter(
                    ProductVariant.product_id == product.id,
                    ProductVariant.color == v.get("color")
                ).first()
                if variant:
                    variant.stock = max(0, variant.stock - v.get("qty", 0))
        elif product:
            default = db.query(ProductVariant).filter(
                ProductVariant.product_id == product.id
            ).first()
            if default:
                default.stock = max(0, default.stock - item.quantity)
    db.delete(p)
    db.commit()
    return {"ok": True}

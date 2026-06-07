from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Sale, SaleItem, Product, ProductVariant, AccountingEntry, CompanyConfig
from ..schemas import SaleCreate, SaleOut
from datetime import datetime

router = APIRouter(prefix="/api/sales", tags=["sales"])


def get_config(db: Session) -> CompanyConfig:
    config = db.query(CompanyConfig).first()
    if not config:
        config = CompanyConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("", response_model=List[SaleOut])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(Sale.sale_date.desc()).all()


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    s = db.query(Sale).filter(Sale.id == sale_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return s


@router.post("", response_model=SaleOut, status_code=201)
def create_sale(data: SaleCreate, db: Session = Depends(get_db)):
    config = get_config(db)

    subtotal = 0.0
    sale_items_data = []

    for item_data in data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item_data.product_id} no encontrado")

        # Check stock
        if item_data.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item_data.variant_id).first()
            if not variant:
                raise HTTPException(status_code=404, detail="Variante no encontrada")
            if variant.stock < item_data.quantity:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name} - {variant.color}")
        else:
            if product.total_stock < item_data.quantity:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")

        item_subtotal = item_data.sale_price * item_data.quantity
        subtotal += item_subtotal
        sale_items_data.append((item_data, product, item_subtotal))

    tax_amount = subtotal * config.tax_rate
    total = subtotal + tax_amount

    # Invoice number
    invoice_number = f"{config.invoice_series}-{str(config.invoice_correlativo).zfill(8)}"
    config.invoice_correlativo += 1

    sale = Sale(
        sale_date=datetime.now(),
        customer_name=data.customer_name or "Cliente",
        customer_email=data.customer_email or "",
        customer_phone=data.customer_phone or "",
        customer_address=data.customer_address or "",
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=total,
        is_credit=data.is_credit,
        credit_due_date=data.credit_due_date,
        status="credito" if data.is_credit else "cobrado",
        invoice_number=invoice_number,
        notes=data.notes or "",
        sale_type=data.sale_type or "retail",
    )
    db.add(sale)
    db.flush()

    for item_data, product, item_subtotal in sale_items_data:
        unit_cost = product.unit_cost

        si = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            variant_id=item_data.variant_id,
            quantity=item_data.quantity,
            catalog_price=item_data.catalog_price,
            sale_price=item_data.sale_price,
            unit_cost=unit_cost,
            subtotal=item_subtotal,
        )
        db.add(si)

        # Reduce stock
        if item_data.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item_data.variant_id).first()
            variant.stock -= item_data.quantity
        else:
            # Reduce from first variant with enough stock
            for v in product.variants:
                if v.stock >= item_data.quantity:
                    v.stock -= item_data.quantity
                    break

    # Accounting entry
    if data.is_credit:
        db.add(AccountingEntry(
            sale_id=sale.id,
            entry_type="venta",
            description=f"Venta {invoice_number} — crédito",
            debit_account="Cuentas por Cobrar",
            credit_account="Ventas",
            amount=total,
        ))
    else:
        db.add(AccountingEntry(
            sale_id=sale.id,
            entry_type="venta",
            description=f"Venta {invoice_number} — contado",
            debit_account="Efectivo",
            credit_account="Ventas",
            amount=total,
        ))

    # COGS entry
    cogs = sum(product.unit_cost * item_data.quantity for item_data, product, _ in sale_items_data)
    if cogs > 0:
        db.add(AccountingEntry(
            sale_id=sale.id,
            entry_type="cogs",
            description=f"Costo de ventas {invoice_number}",
            debit_account="Costo de Ventas",
            credit_account="Inventarios",
            amount=cogs,
        ))

    db.commit()
    db.refresh(sale)
    return sale


@router.delete("/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    s = db.query(Sale).filter(Sale.id == sale_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    # Reverse stock
    for item in s.items:
        if item.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            if variant:
                variant.stock += item.quantity
        elif item.product:
            for v in item.product.variants:
                v.stock += item.quantity
                break
    db.delete(s)
    db.commit()
    return {"ok": True}

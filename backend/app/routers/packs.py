import re
import unicodedata
import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, selectinload

from ..cloudinary_client import delete_image, upload_image
from ..database import get_db
from ..models import Pack, PackItem, Product, ProductVariant
from .auth import get_current_user

router = APIRouter(prefix="/api/packs", tags=["packs"])


def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_text).strip("-") or "pack"


def unique_slug(db: Session, value: str, pack_id: Optional[int] = None) -> str:
    base = slugify(value)
    candidate = base
    suffix = 2
    while True:
        query = db.query(Pack).filter(Pack.slug == candidate)
        if pack_id:
            query = query.filter(Pack.id != pack_id)
        if not query.first():
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1


class PackItemIn(BaseModel):
    product_id: int
    variant_id: int
    quantity: int = Field(default=1, ge=1)


class PackCreate(BaseModel):
    name: str
    slug: Optional[str] = ""
    subtitle: Optional[str] = ""
    description: Optional[str] = ""
    target_audience: Optional[str] = ""
    benefits: Optional[str] = ""
    usage_guide: Optional[str] = ""
    recommendations: Optional[str] = ""
    discount_percent: float = Field(default=0, ge=0, le=95)
    is_active: bool = True
    show_in_store: bool = True
    items: List[PackItemIn]


class PackUpdate(PackCreate):
    pass


def pack_query(db: Session):
    return db.query(Pack).options(
        selectinload(Pack.items).selectinload(PackItem.product).selectinload(Product.images),
        selectinload(Pack.items).selectinload(PackItem.product).selectinload(Product.variants),
        selectinload(Pack.items).selectinload(PackItem.variant),
    )


def pack_payload(pack: Pack):
    regular = Decimal("0.00")
    final = Decimal("0.00")
    discount = Decimal(str(pack.discount_percent or 0))
    discount_factor = Decimal("1") - discount / Decimal("100")
    stock_values = []
    items = []
    for item in sorted(pack.items, key=lambda row: (row.order, row.id)):
        product = item.product
        variant = item.variant
        unit_price = money(product.sale_price if product else 0)
        regular += unit_price * item.quantity
        discounted_unit = (unit_price * discount_factor).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        final += discounted_unit * item.quantity
        available = variant.stock if variant else 0
        stock_values.append(available // item.quantity)
        product_image = ""
        if variant and variant.image_url:
            product_image = variant.image_url
        elif product:
            primary = next((img for img in product.images if img.is_primary), None)
            product_image = (primary or (product.images[0] if product.images else None)).url if (primary or product.images) else ""
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "order": item.order,
            "product_name": product.name if product else "",
            "variant_color": variant.color if variant else "",
            "unit_price": float(unit_price),
            "stock": available,
            "image_url": product_image,
        })
    return {
        "id": pack.id,
        "name": pack.name,
        "slug": pack.slug,
        "subtitle": pack.subtitle or "",
        "description": pack.description or "",
        "target_audience": pack.target_audience or "",
        "benefits": pack.benefits or "",
        "usage_guide": pack.usage_guide or "",
        "recommendations": pack.recommendations or "",
        "image_url": pack.image_url or "",
        "discount_percent": float(discount),
        "regular_price": float(regular),
        "pack_price": float(final),
        "savings": float(regular - final),
        "available_stock": min(stock_values) if stock_values else 0,
        "is_active": pack.is_active,
        "show_in_store": pack.show_in_store,
        "items": items,
        "created_at": pack.created_at.isoformat() if pack.created_at else None,
    }


def validate_items(db: Session, items: List[PackItemIn]):
    if not items:
        raise HTTPException(status_code=400, detail="El pack debe incluir al menos un producto")
    seen = set()
    validated = []
    for index, item in enumerate(items):
        key = (item.product_id, item.variant_id)
        if key in seen:
            raise HTTPException(status_code=400, detail="No repitas la misma variante dentro del pack")
        seen.add(key)
        product = db.query(Product).filter(Product.id == item.product_id).first()
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == item.variant_id,
            ProductVariant.product_id == item.product_id,
        ).first()
        if not product or not variant:
            raise HTTPException(status_code=400, detail="Producto o variante inválida en el pack")
        validated.append(PackItem(
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            order=index,
        ))
    return validated


@router.get("")
def list_packs(db: Session = Depends(get_db)):
    rows = pack_query(db).filter(Pack.is_active == True, Pack.show_in_store == True).order_by(Pack.created_at.desc()).all()
    return [pack_payload(pack) for pack in rows]


@router.get("/all", dependencies=[Depends(get_current_user)])
def list_all_packs(db: Session = Depends(get_db)):
    return [pack_payload(pack) for pack in pack_query(db).order_by(Pack.created_at.desc()).all()]


@router.get("/{slug}")
def get_pack(slug: str, db: Session = Depends(get_db)):
    pack = pack_query(db).filter(Pack.slug == slug).first()
    if not pack or not pack.is_active or not pack.show_in_store:
        raise HTTPException(status_code=404, detail="Pack no encontrado")
    return pack_payload(pack)


@router.post("", status_code=201, dependencies=[Depends(get_current_user)])
def create_pack(data: PackCreate, db: Session = Depends(get_db)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    pack = Pack(
        name=name,
        slug=unique_slug(db, data.slug or name),
        subtitle=data.subtitle or "",
        description=data.description or "",
        target_audience=data.target_audience or "",
        benefits=data.benefits or "",
        usage_guide=data.usage_guide or "",
        recommendations=data.recommendations or "",
        discount_percent=money(data.discount_percent),
        is_active=data.is_active,
        show_in_store=data.show_in_store,
    )
    pack.items = validate_items(db, data.items)
    db.add(pack)
    db.commit()
    return pack_payload(pack_query(db).filter(Pack.id == pack.id).first())


@router.put("/{pack_id}", dependencies=[Depends(get_current_user)])
def update_pack(pack_id: int, data: PackUpdate, db: Session = Depends(get_db)):
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack no encontrado")
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    pack.name = name
    pack.slug = unique_slug(db, data.slug or name, pack_id)
    for field in (
        "subtitle", "description", "target_audience", "benefits",
        "usage_guide", "recommendations",
    ):
        setattr(pack, field, getattr(data, field) or "")
    pack.is_active = data.is_active
    pack.show_in_store = data.show_in_store
    pack.discount_percent = money(data.discount_percent)
    pack.items.clear()
    db.flush()
    pack.items = validate_items(db, data.items)
    db.commit()
    return pack_payload(pack_query(db).filter(Pack.id == pack.id).first())


@router.post("/{pack_id}/image", dependencies=[Depends(get_current_user)])
async def upload_pack_image(pack_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack no encontrado")
    delete_image(pack.image_url)
    pack.image_url = await upload_image(
        file, folder="glowi-skin/packs", public_id=f"pack_{pack_id}_{uuid.uuid4().hex[:6]}"
    )
    db.commit()
    return {"image_url": pack.image_url}


@router.delete("/{pack_id}/image", dependencies=[Depends(get_current_user)])
def delete_pack_image(pack_id: int, db: Session = Depends(get_db)):
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack no encontrado")
    delete_image(pack.image_url)
    pack.image_url = ""
    db.commit()
    return {"ok": True}


@router.delete("/{pack_id}", dependencies=[Depends(get_current_user)])
def delete_pack(pack_id: int, db: Session = Depends(get_db)):
    pack = db.query(Pack).filter(Pack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack no encontrado")
    delete_image(pack.image_url)
    db.delete(pack)
    db.commit()
    return {"ok": True}

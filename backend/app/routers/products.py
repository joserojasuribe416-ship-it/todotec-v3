from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Product, ProductVariant, ProductImage
from ..schemas import ProductCreate, ProductUpdate, ProductOut, VariantCreate, VariantOut
from ..cloudinary_client import upload_image as cld_upload, delete_image as cld_delete
import uuid

router = APIRouter(prefix="/api/products", tags=["products"])



def make_sku(db: Session) -> str:
    import random, string
    while True:
        sku = "TT-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=7))
        if not db.query(Product).filter(Product.sku == sku).first():
            return sku


@router.get("", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    active_only: bool = Query(False),
    store_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    q = db.query(Product)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(Product.category == category)
    if active_only:
        q = q.filter(Product.is_active == True)
    if store_only:
        q = q.filter(Product.show_in_store == True, Product.is_active == True)
    return q.order_by(Product.created_at.desc()).all()


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Product.category).distinct().all()
    return [r[0] for r in rows if r[0]]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return p


@router.post("", response_model=ProductOut, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    product = Product(
        sku=make_sku(db),
        **data.model_dump()
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(p)
    db.commit()
    return {"ok": True}


# ── Variants ──────────────────────────────────────────────────────────
@router.get("/{product_id}/variants", response_model=List[VariantOut])
def list_variants(product_id: int, db: Session = Depends(get_db)):
    return db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()


@router.post("/{product_id}/variants", response_model=VariantOut, status_code=201)
def add_variant(product_id: int, data: VariantCreate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    v = ProductVariant(product_id=product_id, **data.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.put("/variants/{variant_id}", response_model=VariantOut)
def update_variant(variant_id: int, data: VariantCreate, db: Session = Depends(get_db)):
    v = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(v, field, value)
    db.commit()
    db.refresh(v)
    return v


@router.post("/variants/{variant_id}/image")
async def upload_variant_image(variant_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    v = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    cld_delete(v.image_url)
    v.image_url = await cld_upload(file, folder="glowi-skin/variants", public_id=f"variant_{variant_id}")
    db.commit()
    return {"id": variant_id, "image_url": v.image_url}


@router.delete("/variants/{variant_id}/image")
def delete_variant_image(variant_id: int, db: Session = Depends(get_db)):
    v = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    cld_delete(v.image_url)
    v.image_url = ""
    db.commit()
    return {"ok": True}


@router.delete("/variants/{variant_id}")
def delete_variant(variant_id: int, db: Session = Depends(get_db)):
    v = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    db.delete(v)
    db.commit()
    return {"ok": True}


# ── Images ────────────────────────────────────────────────────────────
@router.post("/{product_id}/images")
async def upload_product_image(product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    public_id = f"product_{product_id}_{uuid.uuid4().hex[:6]}"
    url = await cld_upload(file, folder="glowi-skin/products", public_id=public_id)
    is_primary = len(p.images) == 0
    order = len(p.images)
    img = ProductImage(
        product_id=product_id,
        filename=public_id,
        url=url,
        is_primary=is_primary,
        order=order
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return {"id": img.id, "url": img.url, "is_primary": img.is_primary}


@router.delete("/images/{image_id}")
def delete_product_image(image_id: int, db: Session = Depends(get_db)):
    img = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    cld_delete(img.url)
    db.delete(img)
    db.commit()
    return {"ok": True}

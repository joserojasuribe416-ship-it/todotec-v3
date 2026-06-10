from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Brand, Product
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/brands", tags=["brands"])

DEFAULT_BRANDS = [
    "COSRX", "Laneige", "Innisfree", "Some By Mi",
    "Etude House", "Missha", "The Face Shop", "Klairs",
]


class BrandCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    order: Optional[int] = 0

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

class BrandOut(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool
    order: int
    class Config:
        from_attributes = True


def seed_defaults(db: Session):
    if db.query(Brand).count() == 0:
        for i, name in enumerate(DEFAULT_BRANDS):
            db.add(Brand(name=name, description="", is_active=True, order=i))
        db.commit()


@router.get("", response_model=List[BrandOut])
def list_brands(db: Session = Depends(get_db)):
    seed_defaults(db)
    return db.query(Brand).filter(Brand.is_active == True).order_by(Brand.order, Brand.name).all()


@router.get("/all", response_model=List[BrandOut])
def list_all_brands(db: Session = Depends(get_db)):
    seed_defaults(db)
    return db.query(Brand).order_by(Brand.order, Brand.name).all()


@router.post("", response_model=BrandOut, status_code=201)
def create_brand(data: BrandCreate, db: Session = Depends(get_db)):
    exists = db.query(Brand).filter(Brand.name == data.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe una marca con ese nombre")
    brand = Brand(name=data.name, description=data.description or "", order=data.order or 0)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.put("/{brand_id}", response_model=BrandOut)
def update_brand(brand_id: int, data: BrandUpdate, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    old_name = brand.name
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(brand, field, value)
    # Propagar el renombre a los productos que usaban el nombre anterior
    if data.name and data.name != old_name:
        db.query(Product).filter(Product.brand == old_name).update({"brand": data.name})
    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    # Los productos que usaban esta marca quedan "sin marca" (no apuntando a un nombre fantasma)
    db.query(Product).filter(Product.brand == brand.name).update({"brand": ""})
    db.delete(brand)
    db.commit()
    return {"ok": True}

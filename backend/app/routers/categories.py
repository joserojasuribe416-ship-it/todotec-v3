from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Category, Product
from .auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/categories", tags=["categories"])

DEFAULT_CATEGORIES = [
    "Monitores", "Laptops", "Periféricos", "Audio",
    "Gaming", "Accesorios", "Cables", "Gadgets",
]


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    order: Optional[int] = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool
    order: int
    class Config:
        from_attributes = True


def seed_defaults(db: Session):
    if db.query(Category).count() == 0:
        for i, name in enumerate(DEFAULT_CATEGORIES):
            db.add(Category(name=name, description="", is_active=True, order=i))
        db.commit()


@router.get("", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    seed_defaults(db)
    return db.query(Category).filter(Category.is_active == True).order_by(Category.order, Category.name).all()


@router.get("/all", response_model=List[CategoryOut])
def list_all_categories(db: Session = Depends(get_db)):
    seed_defaults(db)
    return db.query(Category).order_by(Category.order, Category.name).all()


@router.post("", response_model=CategoryOut, status_code=201, dependencies=[Depends(get_current_user)])
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    exists = db.query(Category).filter(Category.name == data.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
    cat = Category(name=data.name, description=data.description or "", order=data.order or 0)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryOut, dependencies=[Depends(get_current_user)])
def update_category(cat_id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    old_name = cat.name
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    # Propagar el renombre a los productos que usaban el nombre anterior
    if data.name and data.name != old_name:
        db.query(Product).filter(Product.category == old_name).update({"category": data.name})
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", dependencies=[Depends(get_current_user)])
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    # Los productos que usaban esta categoría quedan "sin categoría"
    db.query(Product).filter(Product.category == cat.name).update({"category": ""})
    db.delete(cat)
    db.commit()
    return {"ok": True}

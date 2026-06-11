from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Necessity, Product
from .auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/necessities", tags=["necessities"])

DEFAULT_NECESSITIES = [
    "Anti-manchas",
    "Hidratación",
    "Anti-edad",
    "Tratamiento acné",
    "Sensibilidad",
    "Luminosidad",
    "Firmeza",
]


class NecessityCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    order: Optional[int] = 0

class NecessityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

class NecessityOut(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool
    order: int
    class Config:
        from_attributes = True


def seed_defaults(db: Session):
    if db.query(Necessity).count() == 0:
        for i, name in enumerate(DEFAULT_NECESSITIES):
            db.add(Necessity(name=name, description="", is_active=True, order=i))
        db.commit()


@router.get("", response_model=List[NecessityOut])
def list_necessities(db: Session = Depends(get_db)):
    seed_defaults(db)
    return db.query(Necessity).filter(Necessity.is_active == True).order_by(Necessity.order, Necessity.name).all()


@router.get("/all", response_model=List[NecessityOut])
def list_all_necessities(db: Session = Depends(get_db)):
    seed_defaults(db)
    return db.query(Necessity).order_by(Necessity.order, Necessity.name).all()


@router.post("", response_model=NecessityOut, status_code=201, dependencies=[Depends(get_current_user)])
def create_necessity(data: NecessityCreate, db: Session = Depends(get_db)):
    exists = db.query(Necessity).filter(Necessity.name == data.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe una necesidad con ese nombre")
    necessity = Necessity(name=data.name, description=data.description or "", order=data.order or 0)
    db.add(necessity)
    db.commit()
    db.refresh(necessity)
    return necessity


@router.put("/{necessity_id}", response_model=NecessityOut, dependencies=[Depends(get_current_user)])
def update_necessity(necessity_id: int, data: NecessityUpdate, db: Session = Depends(get_db)):
    necessity = db.query(Necessity).filter(Necessity.id == necessity_id).first()
    if not necessity:
        raise HTTPException(status_code=404, detail="Necesidad no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(necessity, field, value)
    db.commit()
    db.refresh(necessity)
    return necessity


@router.delete("/{necessity_id}", dependencies=[Depends(get_current_user)])
def delete_necessity(necessity_id: int, db: Session = Depends(get_db)):
    necessity = db.query(Necessity).filter(Necessity.id == necessity_id).first()
    if not necessity:
        raise HTTPException(status_code=404, detail="Necesidad no encontrada")
    # Los productos que usaban esta necesidad quedan sin necesidad asignada
    db.query(Product).filter(Product.necessity_id == necessity_id).update({"necessity_id": None})
    db.delete(necessity)
    db.commit()
    return {"ok": True}

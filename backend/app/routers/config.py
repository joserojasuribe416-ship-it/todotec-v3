from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CompanyConfig
from ..schemas import ConfigOut, ConfigUpdate
import os, shutil, uuid

router = APIRouter(prefix="/api/config", tags=["config"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


def get_or_create_config(db: Session) -> CompanyConfig:
    config = db.query(CompanyConfig).first()
    if not config:
        config = CompanyConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("", response_model=ConfigOut)
def get_config(db: Session = Depends(get_db)):
    return get_or_create_config(db)


@router.put("", response_model=ConfigOut)
def update_config(data: ConfigUpdate, db: Session = Depends(get_db)):
    config = get_or_create_config(db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.post("/logo")
async def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"logo_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    url = f"/uploads/{filename}"
    config = get_or_create_config(db)
    config.logo_url = url
    db.commit()
    return {"url": url}

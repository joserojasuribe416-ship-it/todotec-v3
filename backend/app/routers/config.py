from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CompanyConfig
from ..schemas import ConfigOut, ConfigUpdate
from ..cloudinary_client import upload_image, delete_image
from .auth import get_current_user

router = APIRouter(prefix="/api/config", tags=["config"])


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


@router.put("", response_model=ConfigOut, dependencies=[Depends(get_current_user)])
def update_config(data: ConfigUpdate, db: Session = Depends(get_db)):
    config = get_or_create_config(db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.post("/logo", dependencies=[Depends(get_current_user)])
async def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    config = get_or_create_config(db)
    delete_image(config.logo_url)
    url = await upload_image(file, folder="glowi-skin/logo", public_id="logo")
    config.logo_url = url
    db.commit()
    return {"url": url}

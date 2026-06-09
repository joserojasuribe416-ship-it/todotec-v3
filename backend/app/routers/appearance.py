from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel
from ..database import get_db
from ..models import Banner, HomepageSection, CompanyConfig, Product
from ..cloudinary_client import upload_image, delete_image
import uuid

router = APIRouter(prefix="/api/appearance", tags=["appearance"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class BannerUpdate(BaseModel):
    tag: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    cta: Optional[str] = None
    href: Optional[str] = None
    bg: Optional[str] = None
    accent: Optional[str] = None
    text_bg: Optional[str] = None
    text_color: Optional[str] = None
    tag_color: Optional[str] = None
    cta_bg: Optional[str] = None
    cta_color: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class BannerOut(BaseModel):
    id: int
    tag: str
    title: str
    subtitle: str
    cta: str
    href: str
    image_url: str
    bg: str
    accent: str
    text_bg: str
    text_color: str
    tag_color: str
    cta_bg: str
    cta_color: str
    order: int
    is_active: bool
    class Config:
        from_attributes = True

class SectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    product_ids: Optional[List[int]] = None
    max_items: Optional[int] = None
    is_active: Optional[bool] = None

class SectionOut(BaseModel):
    id: int
    key: str
    title: str
    subtitle: str
    product_ids: Optional[Any] = []
    max_items: int
    is_active: bool
    class Config:
        from_attributes = True

class AnnouncementUpdate(BaseModel):
    announcement_text: str


# ── Default data ──────────────────────────────────────────────────────────────

DEFAULT_BANNERS = [
    {"tag": "Korean Skincare", "title": "Tu rutina\ncoreana", "subtitle": "Importado directamente desde Corea del Sur.", "cta": "Ver catálogo", "href": "/catalog", "bg": "#1E1A1A", "accent": "#EEC5C5", "text_bg": "#1E1A1A", "text_color": "#FAF7F4", "tag_color": "#EEC5C5", "cta_bg": "#EEC5C5", "cta_color": "#1E1A1A", "order": 0},
    {"tag": "Ofertas especiales", "title": "Hasta 30%\ndescuento", "subtitle": "Serums, toners y más productos seleccionados.", "cta": "Ver ofertas", "href": "/catalog", "bg": "linear-gradient(135deg, #EEC5C5 0%, #C49A8A 100%)", "accent": "#fff", "text_bg": "#fff", "text_color": "#1E1A1A", "tag_color": "#C49A8A", "cta_bg": "#1E1A1A", "cta_color": "#EEC5C5", "order": 1},
    {"tag": "Protección solar", "title": "SPF Coreano\nesencial", "subtitle": "Protege tu piel todos los días.", "cta": "Ver SPF", "href": "/catalog", "bg": "linear-gradient(135deg, #B5C4B1 0%, #8aa385 100%)", "accent": "#fff", "text_bg": "#F4F7F4", "text_color": "#1E1A1A", "tag_color": "#8aa385", "cta_bg": "#1E1A1A", "cta_color": "#fff", "order": 2},
    {"tag": "Recién llegados", "title": "Nuevos\nproductos", "subtitle": "Las últimas novedades acaban de llegar.", "cta": "Descubrir", "href": "/catalog", "bg": "linear-gradient(135deg, #C49A8A 0%, #a07060 100%)", "accent": "#FAF7F4", "text_bg": "#FAF7F4", "text_color": "#1E1A1A", "tag_color": "#C49A8A", "cta_bg": "#1E1A1A", "cta_color": "#FAF7F4", "order": 3},
    {"tag": "Serums & Esencias", "title": "Hidratación\nprofunda", "subtitle": "Activos coreanos de alta concentración.", "cta": "Ver serums", "href": "/catalog", "bg": "linear-gradient(135deg, #EDE8E4 0%, #EEC5C5 100%)", "accent": "#C49A8A", "text_bg": "#fff", "text_color": "#1E1A1A", "tag_color": "#C49A8A", "cta_bg": "#1E1A1A", "cta_color": "#EEC5C5", "order": 4},
    {"tag": "Cuidado nocturno", "title": "Repara mientras\nduermes", "subtitle": "Rutina de noche para piel transformada.", "cta": "Ver noche", "href": "/catalog", "bg": "linear-gradient(135deg, #2D2040 0%, #1E1A1A 100%)", "accent": "#EEC5C5", "text_bg": "#2D2040", "text_color": "#FAF7F4", "tag_color": "#EEC5C5", "cta_bg": "#EEC5C5", "cta_color": "#1E1A1A", "order": 5},
]

DEFAULT_SECTIONS = [
    {"key": "favoritos", "title": "Los favoritos", "subtitle": "✦ más vendidos", "product_ids": [], "max_items": 10},
    {"key": "nuevos",    "title": "Lo más nuevo",  "subtitle": "✦ recién llegados", "product_ids": [], "max_items": 10},
]


def seed_banners(db: Session):
    if db.query(Banner).count() == 0:
        for b in DEFAULT_BANNERS:
            db.add(Banner(**b))
        db.commit()

def seed_sections(db: Session):
    if db.query(HomepageSection).count() == 0:
        for s in DEFAULT_SECTIONS:
            db.add(HomepageSection(**s))
        db.commit()


# ── Announcement ──────────────────────────────────────────────────────────────

@router.get("/announcement")
def get_announcement(db: Session = Depends(get_db)):
    cfg = db.query(CompanyConfig).first()
    return {"announcement_text": getattr(cfg, "announcement_text", "Envío gratis por compras desde S/200") or "Envío gratis por compras desde S/200"}

@router.put("/announcement")
def update_announcement(data: AnnouncementUpdate, db: Session = Depends(get_db)):
    cfg = db.query(CompanyConfig).first()
    if cfg:
        cfg.announcement_text = data.announcement_text
        db.commit()
    return {"announcement_text": data.announcement_text}


# ── QR de Pago ────────────────────────────────────────────────────────────────

@router.get("/qr-image")
def get_qr_image(db: Session = Depends(get_db)):
    cfg = db.query(CompanyConfig).first()
    return {"qr_image_url": getattr(cfg, "qr_image_url", "") or ""}

@router.post("/qr-image")
async def upload_qr_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    url = await upload_image(file, folder="glowi-skin/qr", public_id="payment-qr")
    cfg = db.query(CompanyConfig).first()
    if cfg:
        cfg.qr_image_url = url
        db.commit()
    return {"qr_image_url": url}


# ── Banners ───────────────────────────────────────────────────────────────────

@router.get("/banners", response_model=List[BannerOut])
def list_banners(db: Session = Depends(get_db)):
    seed_banners(db)
    return db.query(Banner).filter(Banner.is_active == True).order_by(Banner.order).all()

@router.get("/banners/all", response_model=List[BannerOut])
def list_all_banners(db: Session = Depends(get_db)):
    seed_banners(db)
    return db.query(Banner).order_by(Banner.order).all()

@router.put("/banners/{banner_id}", response_model=BannerOut)
def update_banner(banner_id: int, data: BannerUpdate, db: Session = Depends(get_db)):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner no encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(banner, field, value)
    db.commit()
    db.refresh(banner)
    return banner

@router.post("/banners/{banner_id}/image", response_model=BannerOut)
async def upload_banner_image(banner_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner no encontrado")
    delete_image(banner.image_url)
    banner.image_url = await upload_image(
        file, folder="glowi-skin/banners",
        public_id=f"banner_{banner_id}"
    )
    db.commit()
    db.refresh(banner)
    return banner

@router.delete("/banners/{banner_id}/image", response_model=BannerOut)
def delete_banner_image(banner_id: int, db: Session = Depends(get_db)):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner no encontrado")
    delete_image(banner.image_url)
    banner.image_url = ""
    db.commit()
    db.refresh(banner)
    return banner


# ── Homepage sections ─────────────────────────────────────────────────────────

@router.get("/sections", response_model=List[SectionOut])
def list_sections(db: Session = Depends(get_db)):
    seed_sections(db)
    return db.query(HomepageSection).order_by(HomepageSection.id).all()

@router.put("/sections/{key}", response_model=SectionOut)
def update_section(key: str, data: SectionUpdate, db: Session = Depends(get_db)):
    section = db.query(HomepageSection).filter(HomepageSection.key == key).first()
    if not section:
        raise HTTPException(status_code=404, detail="Sección no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(section, field, value)
    db.commit()
    db.refresh(section)
    return section

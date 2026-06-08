from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import config, suppliers, products, purchases, sales, accounting, dashboard, categories, cobranzas
import os

# Create tables
Base.metadata.create_all(bind=engine)

# Auto-migrate: add new columns if they don't exist (safe for existing DBs)
def _run_migrations():
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS primary_color VARCHAR DEFAULT '#1E3A8A'",
        "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS secondary_color VARCHAR DEFAULT '#FFD100'",
        "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS banner_title VARCHAR DEFAULT 'Todo lo que necesitas, en un solo lugar.'",
        "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS banner_subtitle VARCHAR DEFAULT 'Importamos directamente los mejores productos tecnológicos.'",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email2 VARCHAR DEFAULT ''",
        "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone2 VARCHAR DEFAULT ''",
        "ALTER TABLE purchases ADD COLUMN IF NOT EXISTS credit_days INTEGER DEFAULT 0",
        "ALTER TABLE sales ADD COLUMN IF NOT EXISTS credit_days INTEGER DEFAULT 0",
        "CREATE TABLE IF NOT EXISTS payments (id SERIAL PRIMARY KEY, payment_date TIMESTAMP DEFAULT NOW(), amount FLOAT NOT NULL, notes VARCHAR DEFAULT '', purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE, sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW())",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception:
                pass
        conn.commit()

try:
    _run_migrations()
except Exception:
    pass

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="TodoTec API",
    version="3.0.0",
    description="ERP + E-commerce API para TodoTec"
)

# CORS — acepta localhost en dev y dominios de producción
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Agregar URLs de producción desde variables de entorno
ADMIN_URL = os.environ.get("ADMIN_URL", "")
STORE_URL = os.environ.get("STORE_URL", "")
if ADMIN_URL:
    ALLOWED_ORIGINS.append(ADMIN_URL)
if STORE_URL:
    ALLOWED_ORIGINS.append(STORE_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Routers
app.include_router(config.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(purchases.router)
app.include_router(sales.router)
app.include_router(accounting.router)
app.include_router(dashboard.router)
app.include_router(categories.router)
app.include_router(cobranzas.router)


@app.get("/")
def root():
    return {"message": "TodoTec API v2.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/reset-total")
def reset_total(db=None):
    """Elimina TODOS los registros operacionales. Mantiene config y categorías."""
    from .database import SessionLocal
    from .models import (
        Sale, SaleItem, Purchase, PurchaseItem,
        Product, ProductVariant, ProductImage,
        Supplier, AccountingEntry, CapitalContribution, CompanyConfig
    )
    import os, shutil
    db = SessionLocal()
    try:
        # Delete in order (foreign keys)
        db.query(AccountingEntry).delete()
        db.query(CapitalContribution).delete()
        db.query(SaleItem).delete()
        db.query(Sale).delete()
        db.query(PurchaseItem).delete()
        db.query(Purchase).delete()
        db.query(ProductImage).delete()
        db.query(ProductVariant).delete()
        db.query(Product).delete()
        db.query(Supplier).delete()
        # Reset invoice correlativo
        config = db.query(CompanyConfig).first()
        if config:
            config.invoice_correlativo = 1
        db.commit()
        # Clear uploaded images
        uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        if os.path.exists(uploads_dir):
            for f in os.listdir(uploads_dir):
                if f != ".gitkeep" and not f.startswith("logo_"):
                    try:
                        os.remove(os.path.join(uploads_dir, f))
                    except:
                        pass
        return {"ok": True, "message": "Reset total completado"}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()

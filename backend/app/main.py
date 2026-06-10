from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import config, suppliers, products, purchases, sales, accounting, dashboard, categories, cobranzas, brands, appearance, revalidate, orders, auth
from .routers.auth import get_current_user, require_master
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
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR DEFAULT ''",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS benefit VARCHAR DEFAULT ''",
        "CREATE TABLE IF NOT EXISTS brands (id SERIAL PRIMARY KEY, name VARCHAR UNIQUE NOT NULL, description VARCHAR DEFAULT '', is_active BOOLEAN DEFAULT TRUE, \"order\" INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())",
        "CREATE TABLE IF NOT EXISTS banners (id SERIAL PRIMARY KEY, tag VARCHAR DEFAULT '', title VARCHAR DEFAULT '', subtitle VARCHAR DEFAULT '', cta VARCHAR DEFAULT 'Ver catálogo', href VARCHAR DEFAULT '/catalog', image_url VARCHAR DEFAULT '', bg VARCHAR DEFAULT '#1E1A1A', accent VARCHAR DEFAULT '#EEC5C5', text_bg VARCHAR DEFAULT '#1E1A1A', text_color VARCHAR DEFAULT '#FAF7F4', tag_color VARCHAR DEFAULT '#EEC5C5', cta_bg VARCHAR DEFAULT '#EEC5C5', cta_color VARCHAR DEFAULT '#1E1A1A', \"order\" INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW())",
        "CREATE TABLE IF NOT EXISTS homepage_sections (id SERIAL PRIMARY KEY, key VARCHAR UNIQUE NOT NULL, title VARCHAR DEFAULT '', subtitle VARCHAR DEFAULT '', product_ids JSON DEFAULT '[]', max_items INTEGER DEFAULT 10, is_active BOOLEAN DEFAULT TRUE)",
        "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS announcement_text VARCHAR DEFAULT 'Envío gratis por compras desde S/200'",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS ref_cost FLOAT DEFAULT 0",
        "CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, status VARCHAR DEFAULT 'pending_payment', customer_nombre VARCHAR DEFAULT '', customer_apellido VARCHAR DEFAULT '', customer_email VARCHAR DEFAULT '', customer_dni VARCHAR DEFAULT '', customer_celular VARCHAR DEFAULT '', delivery_type VARCHAR DEFAULT 'pickup', delivery_data JSON DEFAULT '{}', items JSON DEFAULT '[]', subtotal FLOAT DEFAULT 0, shipping_cost FLOAT DEFAULT 0, total FLOAT DEFAULT 0, mp_preference_id VARCHAR DEFAULT '', mp_payment_id VARCHAR DEFAULT '', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS sale_id INTEGER",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'web'",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR DEFAULT 'mercadopago'",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot_url VARCHAR DEFAULT ''",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_notified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE company_config ADD COLUMN IF NOT EXISTS qr_image_url VARCHAR DEFAULT ''",
        "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR UNIQUE NOT NULL, full_name VARCHAR DEFAULT '', password_hash VARCHAR NOT NULL, role VARCHAR DEFAULT 'standard', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW())",
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
# Routers de solo-admin: protegidos completos con JWT
ADMIN_ONLY = [Depends(get_current_user)]
app.include_router(suppliers.router, dependencies=ADMIN_ONLY)
app.include_router(purchases.router, dependencies=ADMIN_ONLY)
app.include_router(sales.router, dependencies=ADMIN_ONLY)
app.include_router(accounting.router, dependencies=ADMIN_ONLY)
app.include_router(dashboard.router, dependencies=ADMIN_ONLY)
app.include_router(cobranzas.router, dependencies=ADMIN_ONLY)
app.include_router(brands.router, dependencies=ADMIN_ONLY)
app.include_router(revalidate.router, dependencies=ADMIN_ONLY)
# Routers mixtos: la tienda usa los GET públicos; las mutaciones se
# protegen endpoint por endpoint dentro de cada router
app.include_router(config.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(appearance.router)
app.include_router(orders.router)
app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "TodoTec API v2.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/reset-total", dependencies=[Depends(require_master)])
def reset_total(db=None):
    """Elimina TODOS los registros operacionales. Mantiene config y categorías.
    SOLO accesible para cuentas master autenticadas."""
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

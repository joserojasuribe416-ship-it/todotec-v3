from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import config, suppliers, products, purchases, sales, accounting, dashboard, categories, cobranzas, brands, necessities, appearance, revalidate, orders, auth, customers, clients
from .routers.auth import get_current_user, require_master, require_owner
import os
import logging

# ── Bitácora (logging) ────────────────────────────────────────────────
# Todos los errores quedan registrados y son visibles en Railway → Logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("todotec")

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
        # Rol Owner: jose pasa a owner (solo si aún no existe ningún owner)
        "UPDATE users SET role = 'owner' WHERE username = 'jose' AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'owner')",
        # ── Dinero en decimal exacto (NUMERIC) en vez de FLOAT ──
        "ALTER TABLE products ALTER COLUMN sale_price TYPE NUMERIC(12,2) USING ROUND(sale_price::numeric, 2), ALTER COLUMN ref_cost TYPE NUMERIC(12,2) USING ROUND(ref_cost::numeric, 2)",
        "ALTER TABLE purchases ALTER COLUMN shipping_cost TYPE NUMERIC(12,2) USING ROUND(shipping_cost::numeric, 2), ALTER COLUMN taxes TYPE NUMERIC(12,2) USING ROUND(taxes::numeric, 2), ALTER COLUMN total_cost TYPE NUMERIC(12,2) USING ROUND(total_cost::numeric, 2)",
        "ALTER TABLE purchase_items ALTER COLUMN unit_cost TYPE NUMERIC(12,2) USING ROUND(unit_cost::numeric, 2), ALTER COLUMN subtotal TYPE NUMERIC(12,2) USING ROUND(subtotal::numeric, 2)",
        "ALTER TABLE sales ALTER COLUMN subtotal TYPE NUMERIC(12,2) USING ROUND(subtotal::numeric, 2), ALTER COLUMN tax_amount TYPE NUMERIC(12,2) USING ROUND(tax_amount::numeric, 2), ALTER COLUMN total TYPE NUMERIC(12,2) USING ROUND(total::numeric, 2)",
        "ALTER TABLE sale_items ALTER COLUMN catalog_price TYPE NUMERIC(12,2) USING ROUND(catalog_price::numeric, 2), ALTER COLUMN sale_price TYPE NUMERIC(12,2) USING ROUND(sale_price::numeric, 2), ALTER COLUMN unit_cost TYPE NUMERIC(12,2) USING ROUND(unit_cost::numeric, 2), ALTER COLUMN subtotal TYPE NUMERIC(12,2) USING ROUND(subtotal::numeric, 2)",
        "ALTER TABLE accounting_entries ALTER COLUMN amount TYPE NUMERIC(12,2) USING ROUND(amount::numeric, 2)",
        "ALTER TABLE capital_contributions ALTER COLUMN amount TYPE NUMERIC(12,2) USING ROUND(amount::numeric, 2)",
        "ALTER TABLE payments ALTER COLUMN amount TYPE NUMERIC(12,2) USING ROUND(amount::numeric, 2)",
        "ALTER TABLE orders ALTER COLUMN subtotal TYPE NUMERIC(12,2) USING ROUND(subtotal::numeric, 2), ALTER COLUMN shipping_cost TYPE NUMERIC(12,2) USING ROUND(shipping_cost::numeric, 2), ALTER COLUMN total TYPE NUMERIC(12,2) USING ROUND(total::numeric, 2)",
        "ALTER TABLE company_config ALTER COLUMN exchange_rate TYPE NUMERIC(10,4) USING ROUND(exchange_rate::numeric, 4), ALTER COLUMN tax_rate TYPE NUMERIC(6,4) USING ROUND(tax_rate::numeric, 4)",
        # ── Cuentas de clientes de la tienda + cupones ──
        "CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, email VARCHAR UNIQUE NOT NULL, password_hash VARCHAR NOT NULL, nombre VARCHAR DEFAULT '', apellido VARCHAR DEFAULT '', dni VARCHAR DEFAULT '', celular VARCHAR DEFAULT '', delivery_data JSON DEFAULT '{}', cart JSON DEFAULT '[]', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW())",
        "CREATE TABLE IF NOT EXISTS coupons (id SERIAL PRIMARY KEY, code VARCHAR UNIQUE NOT NULL, customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE, percent NUMERIC(5,2) DEFAULT 30, description VARCHAR DEFAULT '30% de descuento por crear tu cuenta', is_used BOOLEAN DEFAULT FALSE, used_at TIMESTAMP, order_id INTEGER, created_at TIMESTAMP DEFAULT NOW())",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR DEFAULT ''",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0",
        "CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id)",
        "CREATE INDEX IF NOT EXISTS idx_coupons_customer ON coupons (customer_id)",
        # ── Índices para acelerar las consultas frecuentes ──
        "CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (sale_date)",
        "CREATE INDEX IF NOT EXISTS idx_sales_credit ON sales (is_credit)",
        "CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases (purchase_date)",
        "CREATE INDEX IF NOT EXISTS idx_purchases_credit ON purchases (is_credit)",
        "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)",
        "CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at)",
        "CREATE INDEX IF NOT EXISTS idx_acc_debit ON accounting_entries (debit_account)",
        "CREATE INDEX IF NOT EXISTS idx_acc_credit ON accounting_entries (credit_account)",
        "CREATE INDEX IF NOT EXISTS idx_acc_type ON accounting_entries (entry_type)",
        "CREATE INDEX IF NOT EXISTS idx_acc_sale ON accounting_entries (sale_id)",
        "CREATE INDEX IF NOT EXISTS idx_acc_purchase ON accounting_entries (purchase_id)",
        "CREATE INDEX IF NOT EXISTS idx_saleitems_sale ON sale_items (sale_id)",
        "CREATE INDEX IF NOT EXISTS idx_saleitems_product ON sale_items (product_id)",
        "CREATE INDEX IF NOT EXISTS idx_purchitems_purchase ON purchase_items (purchase_id)",
        "CREATE INDEX IF NOT EXISTS idx_purchitems_product ON purchase_items (product_id)",
        "CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants (product_id)",
        "CREATE INDEX IF NOT EXISTS idx_images_product ON product_images (product_id)",
        "CREATE INDEX IF NOT EXISTS idx_products_category ON products (category)",
        "CREATE INDEX IF NOT EXISTS idx_products_store ON products (is_active, show_in_store)",
        "CREATE INDEX IF NOT EXISTS idx_payments_purchase ON payments (purchase_id)",
        "CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments (sale_id)",
        # ── Necesidades (reemplaza campo benefit) ──
        "CREATE TABLE IF NOT EXISTS necessities (id SERIAL PRIMARY KEY, name VARCHAR UNIQUE NOT NULL, description VARCHAR DEFAULT '', is_active BOOLEAN DEFAULT TRUE, \"order\" INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS necessity_id INTEGER REFERENCES necessities(id) ON DELETE SET NULL",
        # ── Migración: mapear valores actuales de benefit a necessity_id ──
        # Anti-manchas → id 1, Hidratación → id 2, Anti-edad → id 3, etc.
        "INSERT INTO necessities (name, description, is_active, \"order\") VALUES ('Anti-manchas', '', TRUE, 0) ON CONFLICT DO NOTHING",
        "INSERT INTO necessities (name, description, is_active, \"order\") VALUES ('Hidratación', '', TRUE, 1) ON CONFLICT DO NOTHING",
        "INSERT INTO necessities (name, description, is_active, \"order\") VALUES ('Anti-edad', '', TRUE, 2) ON CONFLICT DO NOTHING",
        "INSERT INTO necessities (name, description, is_active, \"order\") VALUES ('Tratamiento acné', '', TRUE, 3) ON CONFLICT DO NOTHING",
        "INSERT INTO necessities (name, description, is_active, \"order\") VALUES ('Sensibilidad', '', TRUE, 4) ON CONFLICT DO NOTHING",
        "INSERT INTO necessities (name, description, is_active, \"order\") VALUES ('Luminosidad', '', TRUE, 5) ON CONFLICT DO NOTHING",
        "INSERT INTO necessities (name, description, is_active, \"order\") VALUES ('Firmeza', '', TRUE, 6) ON CONFLICT DO NOTHING",
        # Mapear productos: si benefit = 'Anti-manchas', asignar necessity_id = (SELECT id FROM necessities WHERE name = 'Anti-manchas')
        "UPDATE products SET necessity_id = (SELECT id FROM necessities WHERE name = 'Anti-manchas') WHERE benefit = 'Anti-manchas' AND necessity_id IS NULL",
        "UPDATE products SET necessity_id = (SELECT id FROM necessities WHERE name = 'Hidratación') WHERE benefit = 'Hidratación' AND necessity_id IS NULL",
        "UPDATE products SET necessity_id = (SELECT id FROM necessities WHERE name = 'Anti-edad') WHERE benefit = 'Anti-edad' AND necessity_id IS NULL",
        "UPDATE products SET necessity_id = (SELECT id FROM necessities WHERE name = 'Tratamiento acné') WHERE benefit = 'Tratamiento acné' AND necessity_id IS NULL",
        "UPDATE products SET necessity_id = (SELECT id FROM necessities WHERE name = 'Sensibilidad') WHERE benefit = 'Sensibilidad' AND necessity_id IS NULL",
        "UPDATE products SET necessity_id = (SELECT id FROM necessities WHERE name = 'Luminosidad') WHERE benefit = 'Luminosidad' AND necessity_id IS NULL",
        "UPDATE products SET necessity_id = (SELECT id FROM necessities WHERE name = 'Firmeza') WHERE benefit = 'Firmeza' AND necessity_id IS NULL",
        # Para valores de benefit que no coincidan con las predeterminadas, dejar en NULL (el usuario puede asignar manualmente)
        "CREATE INDEX IF NOT EXISTS idx_products_necessity ON products (necessity_id)",
    ]
    # Cada migración en su propia transacción: si una falla, las demás
    # se ejecutan igual y el error queda registrado en la bitácora.
    for sql in migrations:
        try:
            with engine.begin() as conn:
                conn.execute(text(sql))
        except Exception as e:
            logger.warning("Migración falló (%s...): %s", sql[:60], e)

try:
    _run_migrations()
except Exception:
    logger.exception("Error general al ejecutar migraciones")

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
app.include_router(necessities.router, dependencies=ADMIN_ONLY)
app.include_router(revalidate.router, dependencies=ADMIN_ONLY)
app.include_router(clients.router, dependencies=ADMIN_ONLY)
# Routers mixtos: la tienda usa los GET públicos; las mutaciones se
# protegen endpoint por endpoint dentro de cada router
app.include_router(config.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(appearance.router)
app.include_router(orders.router)
app.include_router(auth.router)
# Cuentas de clientes de la tienda (auth propia, separada del admin)
app.include_router(customers.router)


@app.get("/")
def root():
    return {"message": "TodoTec API v2.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/reset-total", dependencies=[Depends(require_owner)])
def reset_total(db=None):
    """Elimina TODOS los registros operacionales. Mantiene config y categorías.
    SOLO accesible para la cuenta owner."""
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
                    except Exception as e:
                        logger.warning("Reset: no se pudo borrar archivo %s: %s", f, e)
        return {"ok": True, "message": "Reset total completado"}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()

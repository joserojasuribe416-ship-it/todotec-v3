from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import uuid


def generate_sku():
    return f"TT-{str(uuid.uuid4())[:8].upper()}"


class CompanyConfig(Base):
    __tablename__ = "company_config"

    id = Column(Integer, primary_key=True, default=1)
    company_name = Column(String, default="Glowi Skin")
    razon_social = Column(String, default="")
    ruc = Column(String, default="")
    address = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    logo_url = Column(String, default="")
    currency = Column(String, default="PEN")
    exchange_rate = Column(Float, default=3.75)
    tax_rate = Column(Float, default=0.18)
    invoice_series = Column(String, default="F001")
    invoice_correlativo = Column(Integer, default=1)
    whatsapp = Column(String, default="")
    instagram = Column(String, default="")
    facebook = Column(String, default="")
    tiktok = Column(String, default="")
    primary_color = Column(String, default="#1E1A1A")
    secondary_color = Column(String, default="#EEC5C5")
    banner_title = Column(String, default="Tu rutina coreana,\nen un solo lugar.")
    banner_subtitle = Column(String, default="Korean skincare importado directamente desde Corea del Sur. Rutinas reales, resultados visibles.")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, default="")
    email2 = Column(String, default="")
    phone = Column(String, default="")
    phone2 = Column(String, default="")
    description = Column(Text, default="")
    city = Column(String, default="")
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    purchases = relationship("Purchase", back_populates="supplier")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, default="")
    brand = Column(String, default="")
    benefit = Column(String, default="")
    description = Column(Text, default="")
    sale_price = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    show_in_store = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    purchase_items = relationship("PurchaseItem", back_populates="product")
    sale_items = relationship("SaleItem", back_populates="product")

    @property
    def total_stock(self):
        return sum(v.stock for v in self.variants)

    @property
    def unit_cost(self):
        items = [i for i in self.purchase_items if i.quantity > 0]
        if not items:
            return 0
        total_cost = sum(i.unit_cost * i.quantity for i in items)
        total_qty = sum(i.quantity for i in items)
        return total_cost / total_qty if total_qty else 0


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    color = Column(String, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String, default="")

    product = relationship("Product", back_populates="variants")
    sale_items = relationship("SaleItem", back_populates="variant")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    order = Column(Integer, default=0)

    product = relationship("Product", back_populates="images")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    purchase_date = Column(DateTime, server_default=func.now())
    shipping_cost = Column(Float, default=0.0)
    taxes = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    notes = Column(Text, default="")
    is_credit = Column(Boolean, default=False)
    credit_days = Column(Integer, default=0)
    credit_due_date = Column(DateTime, nullable=True)
    status = Column(String, default="pagado")  # pagado, credito, parcial
    created_at = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    accounting_entries = relationship("AccountingEntry", back_populates="purchase")
    payments = relationship("Payment", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)  # costo unitario (incluye proporción de envío/impuestos)
    subtotal = Column(Float, nullable=False)
    variants_data = Column(JSON, default=list)  # [{"color": "Negro", "qty": 5}, ...]

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product", back_populates="purchase_items")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sale_date = Column(DateTime, server_default=func.now())
    customer_name = Column(String, default="Cliente")
    customer_email = Column(String, default="")
    customer_phone = Column(String, default="")
    customer_address = Column(String, default="")
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    is_credit = Column(Boolean, default=False)
    credit_days = Column(Integer, default=0)
    credit_due_date = Column(DateTime, nullable=True)
    status = Column(String, default="cobrado")  # cobrado, credito, parcial
    invoice_number = Column(String, default="")
    notes = Column(Text, default="")
    sale_type = Column(String, default="retail")  # retail, wholesale
    created_at = Column(DateTime, server_default=func.now())

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    accounting_entries = relationship("AccountingEntry", back_populates="sale")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    catalog_price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=False)
    unit_cost = Column(Float, default=0.0)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")
    variant = relationship("ProductVariant", back_populates="sale_items")


class AccountingEntry(Base):
    __tablename__ = "accounting_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entry_date = Column(DateTime, server_default=func.now())
    entry_type = Column(String, nullable=False)  # compra, venta, capital
    description = Column(String, nullable=False)
    debit_account = Column(String, nullable=False)
    credit_account = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    capital_id = Column(Integer, ForeignKey("capital_contributions.id"), nullable=True)

    purchase = relationship("Purchase", back_populates="accounting_entries")
    sale = relationship("Sale", back_populates="accounting_entries")
    capital = relationship("CapitalContribution", back_populates="accounting_entries")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, default="")
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, default="")
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class CapitalContribution(Base):
    __tablename__ = "capital_contributions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contribution_date = Column(DateTime, server_default=func.now())
    contributor = Column(String, default="Socio")
    amount = Column(Float, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())

    accounting_entries = relationship("AccountingEntry", back_populates="capital")


class Payment(Base):
    """Registro de abonos sobre compras o ventas a crédito."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_date = Column(DateTime, server_default=func.now())
    amount = Column(Float, nullable=False)
    notes = Column(String, default="")
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    purchase = relationship("Purchase", back_populates="payments")
    sale = relationship("Sale", back_populates="payments")

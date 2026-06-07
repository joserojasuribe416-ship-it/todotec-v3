from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ── Config ──────────────────────────────────────────────────────────
class ConfigUpdate(BaseModel):
    company_name: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    tax_rate: Optional[float] = None
    invoice_series: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    tiktok: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    banner_title: Optional[str] = None
    banner_subtitle: Optional[str] = None

class ConfigOut(BaseModel):
    id: int
    company_name: str
    razon_social: str
    ruc: str
    address: str
    phone: str
    email: str
    logo_url: str
    currency: str
    exchange_rate: float
    tax_rate: float
    invoice_series: str
    invoice_correlativo: int
    whatsapp: str
    instagram: str
    facebook: str
    tiktok: str
    primary_color: str
    secondary_color: str
    banner_title: str
    banner_subtitle: str
    class Config:
        from_attributes = True


# ── Supplier ─────────────────────────────────────────────────────────
class SupplierCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    email2: Optional[str] = ""
    phone: Optional[str] = ""
    phone2: Optional[str] = ""
    description: Optional[str] = ""
    city: Optional[str] = ""
    rating: Optional[float] = 5.0

class SupplierUpdate(SupplierCreate):
    name: Optional[str] = None

class SupplierOut(BaseModel):
    id: int
    name: str
    email: str
    email2: str
    phone: str
    phone2: str
    description: str
    city: str
    rating: float
    created_at: Optional[datetime]
    class Config:
        from_attributes = True


# ── Product Images ───────────────────────────────────────────────────
class ProductImageOut(BaseModel):
    id: int
    filename: str
    url: str
    is_primary: bool
    order: int
    class Config:
        from_attributes = True


# ── Product Variant ──────────────────────────────────────────────────
class VariantCreate(BaseModel):
    color: str
    stock: int = 0

class VariantOut(BaseModel):
    id: int
    color: str
    stock: int
    image_url: Optional[str] = ""
    class Config:
        from_attributes = True


# ── Product ──────────────────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    category: Optional[str] = ""
    description: Optional[str] = ""
    sale_price: float = 0.0
    show_in_store: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    sale_price: Optional[float] = None
    is_active: Optional[bool] = None
    show_in_store: Optional[bool] = None

class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    category: str
    description: str
    sale_price: float
    is_active: bool
    show_in_store: bool
    total_stock: int
    unit_cost: float
    variants: List[VariantOut] = []
    images: List[ProductImageOut] = []
    created_at: Optional[datetime]
    class Config:
        from_attributes = True


# ── Purchase ─────────────────────────────────────────────────────────
class PurchaseVariantData(BaseModel):
    color: str
    qty: int

class PurchaseItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    category: Optional[str] = ""
    description: Optional[str] = ""
    sale_price: float = 0.0
    quantity: int
    unit_cost: float
    variants: List[PurchaseVariantData] = []

class PurchaseCreate(BaseModel):
    supplier_id: Optional[int] = None
    purchase_date: Optional[datetime] = None
    shipping_cost: float = 0.0
    taxes: float = 0.0
    notes: Optional[str] = ""
    is_credit: bool = False
    credit_due_date: Optional[datetime] = None
    items: List[PurchaseItemCreate]

class PurchaseItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: float
    subtotal: float
    variants_data: Optional[Any] = []
    product: Optional[ProductOut] = None
    class Config:
        from_attributes = True

class PurchaseOut(BaseModel):
    id: int
    supplier_id: Optional[int]
    purchase_date: Optional[datetime]
    shipping_cost: float
    taxes: float
    total_cost: float
    notes: str
    is_credit: bool
    status: str
    items: List[PurchaseItemOut] = []
    supplier: Optional[SupplierOut] = None
    created_at: Optional[datetime]
    class Config:
        from_attributes = True


# ── Sale ─────────────────────────────────────────────────────────────
class SaleItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    catalog_price: float
    sale_price: float

class SaleCreate(BaseModel):
    customer_name: Optional[str] = "Cliente"
    customer_email: Optional[str] = ""
    customer_phone: Optional[str] = ""
    customer_address: Optional[str] = ""
    is_credit: bool = False
    credit_due_date: Optional[datetime] = None
    notes: Optional[str] = ""
    sale_type: Optional[str] = "retail"
    items: List[SaleItemCreate]

class SaleItemOut(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int]
    quantity: int
    catalog_price: float
    sale_price: float
    unit_cost: float
    subtotal: float
    product: Optional[ProductOut] = None
    variant: Optional[VariantOut] = None
    class Config:
        from_attributes = True

class SaleOut(BaseModel):
    id: int
    sale_date: Optional[datetime]
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_address: str
    subtotal: float
    tax_amount: float
    total: float
    is_credit: bool
    status: str
    invoice_number: str
    notes: str
    sale_type: str
    items: List[SaleItemOut] = []
    created_at: Optional[datetime]
    class Config:
        from_attributes = True


# ── Capital ──────────────────────────────────────────────────────────
class CapitalCreate(BaseModel):
    contributor: Optional[str] = "Socio"
    amount: float
    description: Optional[str] = ""
    contribution_date: Optional[datetime] = None

class CapitalOut(BaseModel):
    id: int
    contribution_date: Optional[datetime]
    contributor: str
    amount: float
    description: str
    created_at: Optional[datetime]
    class Config:
        from_attributes = True


# ── Purchase Rectify ─────────────────────────────────────────────────
class RectifyItem(BaseModel):
    purchase_item_id: int
    new_quantity: int
    new_unit_cost: float
    new_variants: Optional[List[Any]] = None

class PurchaseRectify(BaseModel):
    items: List[RectifyItem]
    notes: Optional[str] = None


# ── Accounting ───────────────────────────────────────────────────────
class AccountingEntryOut(BaseModel):
    id: int
    entry_date: Optional[datetime]
    entry_type: str
    description: str
    debit_account: str
    credit_account: str
    amount: float
    class Config:
        from_attributes = True

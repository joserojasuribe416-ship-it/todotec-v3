"""
Cuentas de clientes de la tienda online.
Completamente separadas de los usuarios del admin:
- Tokens JWT con typ="customer" (un cliente nunca puede usar el panel admin).
- Al registrarse se genera automáticamente un cupón de 30% (visible en Mi Perfil).
"""
import logging
import random
import string
from datetime import datetime, timedelta
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError, jwt
from ..database import get_db
from ..models import Customer, Coupon
from .auth import SECRET_KEY, ALGORITHM, hash_password, verify_password

router = APIRouter(prefix="/api/customers", tags=["customers"])
logger = logging.getLogger("todotec.customers")

TOKEN_EXPIRE_DAYS = 30  # sesión larga: es una tienda, no un banco
oauth2_customer = OAuth2PasswordBearer(tokenUrl="/api/customers/login", auto_error=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def create_customer_token(customer: Customer) -> str:
    payload = {
        "sub": str(customer.id),
        "typ": "customer",
        "exp": datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_customer(token: str = Depends(oauth2_customer), db: Session = Depends(get_db)) -> Customer:
    error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o expirada")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("typ") != "customer":
            raise error
        customer_id = int(payload.get("sub", 0))
    except (JWTError, ValueError):
        raise error
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_active == True).first()
    if not customer:
        raise error
    return customer


def get_optional_customer(request: Request, db: Session) -> Optional[Customer]:
    """Para endpoints públicos (checkout): identifica al cliente si envía token, sin exigirlo."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(auth[7:], SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("typ") != "customer":
            return None
        return db.query(Customer).filter(Customer.id == int(payload["sub"]), Customer.is_active == True).first()
    except Exception:
        return None


def generate_coupon_code(db: Session) -> str:
    while True:
        code = "GLOWI30-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        if not db.query(Coupon).filter(Coupon.code == code).first():
            return code


def _customer_out(c: Customer) -> dict:
    return {
        "id": c.id, "email": c.email, "nombre": c.nombre, "apellido": c.apellido,
        "dni": c.dni, "celular": c.celular, "delivery_data": c.delivery_data or {},
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    email: str
    password: str
    nombre: str = ""
    apellido: str = ""
    accept_privacy: bool = False

class LoginIn(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    dni: Optional[str] = None
    celular: Optional[str] = None
    delivery_data: Optional[dict] = None

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

class CartIn(BaseModel):
    cart: List[Any] = []

class CouponCheckIn(BaseModel):
    code: str
    subtotal: float = 0


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    if not data.accept_privacy:
        raise HTTPException(status_code=400, detail="Debes aceptar la política de privacidad")
    email = data.email.lower().strip()
    if "@" not in email or "." not in email.split("@")[-1] or len(email) < 6:
        raise HTTPException(status_code=400, detail="Ingresa un correo válido")
    if db.query(Customer).filter(Customer.email == email).first():
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")

    customer = Customer(
        email=email,
        password_hash=hash_password(data.password),
        nombre=data.nombre.strip(),
        apellido=data.apellido.strip(),
    )
    db.add(customer)
    db.flush()

    # Cupón de bienvenida: 30% en una compra
    coupon = Coupon(code=generate_coupon_code(db), customer_id=customer.id, percent=30)
    db.add(coupon)
    db.commit()
    db.refresh(customer)
    logger.info("Nuevo cliente registrado: %s (cupón %s)", email, coupon.code)

    return {
        "access_token": create_customer_token(customer),
        "token_type": "bearer",
        "customer": _customer_out(customer),
        "coupon": coupon.code,
    }


@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(
        Customer.email == data.email.lower().strip(), Customer.is_active == True
    ).first()
    if not customer or not verify_password(data.password, customer.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    return {
        "access_token": create_customer_token(customer),
        "token_type": "bearer",
        "customer": _customer_out(customer),
    }


@router.get("/me")
def me(customer: Customer = Depends(get_current_customer)):
    return _customer_out(customer)


@router.put("/me")
def update_me(data: ProfileUpdate, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return _customer_out(customer)


@router.post("/change-password")
def change_password(data: ChangePasswordIn, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, customer.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    customer.password_hash = hash_password(data.new_password)
    db.commit()
    return {"ok": True}


# ── Mis cupones ───────────────────────────────────────────────────────────────

@router.get("/me/coupons")
def my_coupons(customer: Customer = Depends(get_current_customer)):
    return [
        {
            "code": cp.code, "percent": float(cp.percent or 0), "description": cp.description,
            "is_used": cp.is_used, "used_at": cp.used_at.isoformat() if cp.used_at else None,
        }
        for cp in sorted(customer.coupons, key=lambda x: x.id, reverse=True)
    ]


@router.post("/check-coupon")
def check_coupon(data: CouponCheckIn, request: Request, db: Session = Depends(get_db)):
    """Valida un cupón en el checkout y devuelve el descuento calculado."""
    coupon = db.query(Coupon).filter(Coupon.code == data.code.strip().upper()).first()
    if not coupon or coupon.is_used:
        raise HTTPException(status_code=400, detail="Cupón inválido o ya utilizado")
    # Si hay sesión de cliente, el cupón debe ser suyo
    customer = get_optional_customer(request, db)
    if customer and coupon.customer_id != customer.id:
        raise HTTPException(status_code=400, detail="Este cupón pertenece a otra cuenta")
    if not customer:
        raise HTTPException(status_code=401, detail="Inicia sesión para usar tu cupón")
    discount = round(data.subtotal * float(coupon.percent) / 100, 2)
    return {"code": coupon.code, "percent": float(coupon.percent), "discount": discount}


# ── Carrito persistente ───────────────────────────────────────────────────────

@router.get("/me/cart")
def get_cart(customer: Customer = Depends(get_current_customer)):
    return {"cart": customer.cart or []}


@router.put("/me/cart")
def save_cart(data: CartIn, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    customer.cart = data.cart
    db.commit()
    return {"ok": True}

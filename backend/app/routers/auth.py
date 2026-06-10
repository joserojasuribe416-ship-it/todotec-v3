import os
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Config ────────────────────────────────────────────────────────────────────
# JWT_SECRET debe estar definido como variable de entorno (Railway → Variables).
# Si falta, se genera uno aleatorio por arranque: el sistema funciona pero las
# sesiones se invalidan en cada redeploy — señal clara de que falta configurarlo.
import secrets as _secrets
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    SECRET_KEY = _secrets.token_hex(32)
    print("⚠️  JWT_SECRET no configurado: usando clave aleatoria temporal. "
          "Definir JWT_SECRET en las variables de entorno para sesiones persistentes.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_hours: int = ACCESS_TOKEN_EXPIRE_HOURS) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=expires_hours)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesión inválida o expirada",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise credentials_error
    except JWTError:
        raise credentials_error
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user:
        raise credentials_error
    return user

def require_master(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "master":
        raise HTTPException(status_code=403, detail="Se requiere cuenta master para esta acción")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────
class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    class Config:
        from_attributes = True

class CreateUserIn(BaseModel):
    username: str
    full_name: str
    password: str
    role: str = "standard"  # master | standard

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


# ── Seed inicial ──────────────────────────────────────────────────────────────
# Sin contraseñas en el código. Si la tabla users está vacía (instalación nueva
# o reset), se crea UNA cuenta master con credenciales tomadas de variables de
# entorno: INITIAL_ADMIN_USER e INITIAL_ADMIN_PASSWORD.

def seed_users(db: Session):
    if db.query(User).count() > 0:
        return  # ya existen usuarios — no sembrar nada
    username = os.getenv("INITIAL_ADMIN_USER", "")
    password = os.getenv("INITIAL_ADMIN_PASSWORD", "")
    if not username or not password:
        print("⚠️  Tabla users vacía y sin INITIAL_ADMIN_USER/INITIAL_ADMIN_PASSWORD "
              "configurados: no se creó ninguna cuenta inicial.")
        return
    db.add(User(
        username=username.lower(),
        full_name=username,
        password_hash=hash_password(password),
        role="master",
    ))
    db.commit()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    seed_users(db)  # garantiza que existen las cuentas iniciales
    user = db.query(User).filter(User.username == form.username, User.is_active == True).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "full_name": user.full_name, "role": user.role},
    }


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "full_name": current_user.full_name, "role": current_user.role}


@router.get("/users", response_model=List[UserOut])
def list_users(current_user: User = Depends(require_master), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(data: CreateUserIn, current_user: User = Depends(require_master), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Ese nombre de usuario ya existe")
    user = User(
        username=data.username,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(require_master), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"ok": True}


@router.post("/change-password")
def change_password(data: ChangePasswordIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"ok": True}

"""
Pruebas vitales de TodoTec v3.

Cómo ejecutarlas (desde la carpeta backend/):
    pip install pytest
    python -m pytest tests/ -v

Cubren lo más delicado del sistema:
  1. Seguridad: endpoints protegidos y jerarquía de roles
  2. Flujo de negocio: compra → venta → contabilidad cuadrada
  3. Pedidos web: confirmación de pago genera venta y descuenta stock
  4. Categorías/marcas: renombrar propaga a productos
"""
import os
import pathlib

# Base de datos limpia para cada corrida (SQLite local, no toca producción)
_db = pathlib.Path(__file__).resolve().parent.parent / "todotec.db"
if _db.exists():
    _db.unlink()
os.environ.pop("DATABASE_URL", None)
os.environ["INITIAL_ADMIN_USER"] = "jose"
os.environ["INITIAL_ADMIN_PASSWORD"] = "TestOwner123!"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)


def _login(username, password):
    r = client.post("/api/auth/login", data={"username": username, "password": password})
    assert r.status_code == 200, f"Login falló para {username}"
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _owner():
    return _login("jose", "TestOwner123!")


# ── 1. Seguridad ──────────────────────────────────────────────────────

def test_endpoints_admin_requieren_token():
    assert client.get("/api/sales").status_code == 401
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/dashboard").status_code == 401
    assert client.post("/api/reset-total").status_code == 401
    assert client.put("/api/config", json={}).status_code == 401


def test_endpoints_de_tienda_son_publicos():
    assert client.get("/api/products").status_code == 200
    assert client.get("/api/categories").status_code == 200
    assert client.get("/api/config").status_code == 200
    assert client.get("/api/appearance/banners").status_code == 200
    # Filtros del catálogo: marcas y necesidades deben ser públicos
    assert client.get("/api/brands").status_code == 200
    assert client.get("/api/necessities").status_code == 200
    # ...pero sus mutaciones siguen protegidas
    assert client.post("/api/brands", json={"name": "X"}).status_code == 401
    assert client.post("/api/necessities", json={"name": "X"}).status_code == 401


def test_jerarquia_de_roles():
    H = _owner()
    # owner crea un master y un standard
    r = client.post("/api/auth/users", json={
        "username": "master1", "full_name": "M", "password": "Master123", "role": "master"}, headers=H)
    assert r.status_code == 201
    r = client.post("/api/auth/users", json={
        "username": "standard1", "full_name": "S", "password": "Stand123", "role": "standard"}, headers=H)
    assert r.status_code == 201
    sid = r.json()["id"]

    HM = _login("master1", "Master123")
    HS = _login("standard1", "Stand123")

    # master NO puede: borrar usuarios, reset-total, cambiar contraseñas ajenas
    assert client.delete(f"/api/auth/users/{sid}", headers=HM).status_code == 403
    assert client.post("/api/reset-total", headers=HM).status_code == 403
    assert client.put(f"/api/auth/users/{sid}/password",
                      json={"new_password": "Hack1234"}, headers=HM).status_code == 403
    # standard NO puede ver usuarios
    assert client.get("/api/auth/users", headers=HS).status_code == 403
    # owner SÍ puede borrar
    assert client.delete(f"/api/auth/users/{sid}", headers=H).status_code == 200


# ── 2. Flujo de negocio y contabilidad ────────────────────────────────

def test_flujo_completo_y_contabilidad_cuadra():
    H = _owner()
    # capital → compra → venta
    assert client.post("/api/accounting/capital",
                       json={"contributor": "Jose", "amount": 1000.00}, headers=H).status_code == 201

    r = client.post("/api/purchases", json={
        "supplier_id": None, "shipping_cost": 10.50, "taxes": 0, "is_credit": False,
        "items": [{"product_id": None, "product_name": "Serum Test", "category": "Serums",
                   "sale_price": 49.90, "unit_cost": 19.90, "quantity": 10,
                   "variants": [{"color": "Estándar", "qty": 10}]}]}, headers=H)
    assert r.status_code == 201
    pid = r.json()["items"][0]["product_id"]
    assert float(r.json()["total_cost"]) == 209.50  # 10×19.90 + 10.50 exacto

    r = client.post("/api/sales", json={
        "customer_name": "Cliente", "is_credit": False,
        "items": [{"product_id": pid, "variant_id": None, "quantity": 3,
                   "catalog_price": 49.90, "sale_price": 49.90}]}, headers=H)
    assert r.status_code == 201
    assert float(r.json()["subtotal"]) == 149.70
    assert float(r.json()["tax_amount"]) == 26.95  # IGV redondeado exacto

    # la ecuación contable debe cuadrar siempre
    bs = client.get("/api/accounting/balance-sheet", headers=H).json()
    assert bs["ecuacion_ok"] is True

    # venta sin stock suficiente debe rechazarse
    r = client.post("/api/sales", json={
        "customer_name": "X", "is_credit": False,
        "items": [{"product_id": pid, "variant_id": None, "quantity": 9999,
                   "catalog_price": 49.90, "sale_price": 49.90}]}, headers=H)
    assert r.status_code == 400


def test_pedido_web_qr_genera_venta_y_descuenta_stock():
    H = _owner()
    pid = client.get("/api/products").json()[0]["id"]
    stock_antes = sum(v["stock"] for v in client.get(f"/api/products/{pid}").json()["variants"])

    r = client.post("/api/orders/create-qr", json={
        "items": [{"product_id": pid, "name": "Serum Test", "quantity": 1,
                   "price": 49.90, "variant_color": "Estándar"}],
        "customer": {"nombre": "Web", "apellido": "C", "email": "w@c.com",
                     "dni": "12345678", "celular": "999888777"},
        "delivery": {"type": "pickup", "point_address": "Tienda"},
        "subtotal": 49.90, "shipping_cost": 0, "total": 58.88})
    assert r.status_code == 200
    oid = r.json()["order_id"]

    # admin confirma el pago → venta automática + stock − 1
    assert client.put(f"/api/orders/{oid}/status",
                      json={"status": "paid"}, headers=H).status_code == 200
    stock_despues = sum(v["stock"] for v in client.get(f"/api/products/{pid}").json()["variants"])
    assert stock_despues == stock_antes - 1

    orden = [o for o in client.get("/api/orders", headers=H).json() if o["id"] == oid][0]
    assert orden["sale_id"] is not None  # venta enlazada creada


def test_pedido_sin_stock_se_rechaza():
    """El checkout rechaza pedidos que superan el stock ANTES de cobrar."""
    pid = client.get("/api/products").json()[0]["id"]
    r = client.post("/api/orders/create-qr", json={
        "items": [{"product_id": pid, "name": "Serum", "quantity": 99999, "price": 49.90}],
        "customer": {"nombre": "X", "apellido": "Y", "email": "x@y.com", "dni": "1", "celular": "9"},
        "delivery": {"type": "pickup"},
        "subtotal": 100, "shipping_cost": 0, "total": 118})
    assert r.status_code == 400
    assert "Stock insuficiente" in r.json()["detail"]


def test_cupon_se_libera_al_cancelar_pedido():
    """Si el pedido se cancela, el cliente recupera su cupón."""
    H = _owner()
    pid = client.get("/api/products").json()[0]["id"]
    r = client.post("/api/customers/register", json={
        "email": "libera@glowi.pe", "password": "clave123", "accept_privacy": True})
    HC = {"Authorization": f"Bearer {r.json()['access_token']}"}
    cupon = r.json()["coupon"]

    r = client.post("/api/orders/create-qr", json={
        "items": [{"product_id": pid, "name": "Serum", "quantity": 1, "price": 49.90}],
        "customer": {"nombre": "L", "apellido": "G", "email": "libera@glowi.pe", "dni": "1", "celular": "9"},
        "delivery": {"type": "pickup"},
        "subtotal": 49.90, "shipping_cost": 0, "total": 58.88,
        "coupon_code": cupon}, headers=HC)
    assert r.status_code == 200
    oid = r.json()["order_id"]

    # usado: no se puede aplicar de nuevo
    assert client.post("/api/customers/check-coupon",
                       json={"code": cupon, "subtotal": 100}, headers=HC).status_code == 400
    # admin cancela el pedido → el cupón vuelve a estar disponible
    assert client.put(f"/api/orders/{oid}/status",
                      json={"status": "cancelled"}, headers=H).status_code == 200
    assert client.post("/api/customers/check-coupon",
                       json={"code": cupon, "subtotal": 100}, headers=HC).status_code == 200


# ── 3. Categorías y marcas propagan cambios ───────────────────────────

def test_cliente_cupon_30_y_total_descontado():
    """Registro → cupón GLOWI30 → pedido con total ya descontado → admin lo ve en Clientes."""
    H = _owner()
    pid = client.get("/api/products").json()[0]["id"]

    r = client.post("/api/customers/register", json={
        "email": "test@glowi.pe", "password": "clave123",
        "nombre": "Test", "apellido": "Glowi", "accept_privacy": True})
    assert r.status_code == 201
    HC = {"Authorization": f"Bearer {r.json()['access_token']}"}
    cupon = r.json()["coupon"]
    assert cupon.startswith("GLOWI30-")

    # token de cliente NO sirve en el admin
    assert client.get("/api/sales", headers=HC).status_code == 401

    # pedido QR con cupón: el servidor recalcula el total con descuento
    r = client.post("/api/orders/create-qr", json={
        "items": [{"product_id": pid, "name": "Serum", "quantity": 2, "price": 100.00}],
        "customer": {"nombre": "T", "apellido": "G", "email": "test@glowi.pe", "dni": "1", "celular": "9"},
        "delivery": {"type": "pickup"},
        "subtotal": 200.00, "shipping_cost": 0, "total": 236.00,
        "coupon_code": cupon}, headers=HC)
    assert r.status_code == 200
    assert r.json()["total"] == 165.20   # (200 − 60) × 1.18
    assert r.json()["discount"] == 60.0

    # el cupón no se puede reutilizar
    assert client.post("/api/customers/check-coupon",
                       json={"code": cupon, "subtotal": 100}, headers=HC).status_code == 400

    # módulo Clientes del admin lo lista
    clientes = client.get("/api/clients", headers=H).json()
    assert any(c["email"] == "test@glowi.pe" for c in clientes)


def test_renombrar_categoria_actualiza_productos():
    H = _owner()
    r = client.post("/api/categories", json={"name": "CatTemp"}, headers=H)
    cat_id = r.json()["id"]
    r = client.post("/api/products", json={"name": "Prod Cat", "category": "CatTemp"}, headers=H)
    pid = r.json()["id"]

    client.put(f"/api/categories/{cat_id}", json={"name": "CatNueva"}, headers=H)
    assert client.get(f"/api/products/{pid}").json()["category"] == "CatNueva"

    client.delete(f"/api/categories/{cat_id}", headers=H)
    assert client.get(f"/api/products/{pid}").json()["category"] == ""


def test_pack_recalcula_precio_y_exige_composicion_completa():
    H = _owner()
    product = next(
        product
        for product in client.get("/api/products").json()
        if product["variants"]
    )
    variant = product["variants"][0]

    r = client.post("/api/packs", json={
        "name": "Pack Test",
        "subtitle": "Oferta segura",
        "description": "Descripción",
        "target_audience": "Piel de prueba",
        "benefits": "Beneficios",
        "usage_guide": "Paso 1 y paso 2",
        "recommendations": "Usar diariamente",
        "discount_percent": 20,
        "items": [{
            "product_id": product["id"],
            "variant_id": variant["id"],
            "quantity": 2,
        }],
    }, headers=H)
    assert r.status_code == 201
    pack = r.json()
    assert pack["pack_price"] == round(float(product["sale_price"]) * 2 * 0.8, 2)

    # El navegador intenta mandar precio cero: el backend lo reemplaza por el precio real.
    payload = {
        "items": [{
            "product_id": product["id"],
            "name": "Nombre manipulado",
            "quantity": 2,
            "price": 0,
            "variant_color": variant["color"],
            "pack_id": pack["id"],
            "pack_name": pack["name"],
        }],
        "customer": {"nombre": "Pack", "apellido": "Test", "email": "pack@test.pe", "dni": "12345678", "celular": "999999999"},
        "delivery": {"type": "pickup"},
        "subtotal": 0,
        "shipping_cost": 0,
        "total": 0,
    }
    r = client.post("/api/orders/create-qr", json=payload)
    assert r.status_code == 200
    assert r.json()["total"] == round(pack["pack_price"] * 1.18, 2)

    # No se puede comprar media composición y conservar el descuento.
    payload["items"][0]["quantity"] = 1
    r = client.post("/api/orders/create-qr", json=payload)
    assert r.status_code == 400
    assert "Cantidad inválida" in r.json()["detail"]

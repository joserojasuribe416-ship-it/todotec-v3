# TodoTec v2 — ERP + Tienda Online

> Sistema integrado de gestión y e-commerce para TodoTec.

## Módulos

| Módulo | URL | Descripción |
|--------|-----|-------------|
| 🏪 Tienda | http://localhost:3000 | Tienda online (clientes) |
| ⚙️ Admin | http://localhost:5173 | Panel de gestión interno |
| 📡 API | http://localhost:8000 | Backend FastAPI (+ docs en /docs) |

---

## Requisitos

- **Python 3.10+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)

---

## Inicio rápido (Fase 1 — Local)

### Opción A: Script automático (recomendado)
```bash
# Doble clic en:
"Iniciar TodoTec.command"
```
Este script instala dependencias la primera vez y levanta los 3 servicios automáticamente.

### Opción B: Manual

**Terminal 1 — Backend:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Admin:**
```bash
cd admin
npm install
npm run dev
```

**Terminal 3 — Tienda:**
```bash
cd store
npm install
npm run dev
```

---

## Estructura del proyecto

```
todotec_v2/
├── backend/                 # FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── main.py          # Entry point
│   │   ├── database.py      # Conexión SQLite
│   │   ├── models.py        # Modelos ORM
│   │   ├── schemas.py       # Schemas Pydantic
│   │   └── routers/         # Endpoints por módulo
│   │       ├── config.py    # Configuración empresa
│   │       ├── suppliers.py # Proveedores CRUD
│   │       ├── products.py  # Productos + imágenes + variantes
│   │       ├── purchases.py # Compras → actualiza inventario
│   │       ├── sales.py     # Ventas → actualiza inventario
│   │       ├── accounting.py# P&L, Balance, Capital
│   │       └── dashboard.py # KPIs ejecutivos
│   ├── uploads/             # Imágenes de productos
│   ├── todotec.db           # Base de datos (se crea al iniciar)
│   └── requirements.txt
│
├── admin/                   # React 18 + Vite + Tailwind CSS
│   └── src/pages/
│       ├── Dashboard.jsx    # KPIs + gráficos
│       ├── Proveedores.jsx  # CRUD proveedores
│       ├── Inventario.jsx   # Catálogo de productos
│       ├── Compras.jsx      # Registro de compras
│       ├── Ventas.jsx       # Registro de ventas + factura
│       ├── Contabilidad.jsx # P&L, Balance, Capital
│       └── Configuracion.jsx# Parámetros del sistema
│
└── store/                   # Next.js 14 + Tailwind CSS
    └── app/
        ├── page.js          # Home
        ├── catalog/         # Catálogo con filtros
        ├── product/[id]/    # Detalle de producto
        ├── cart/            # Carrito de compras
        └── contact/         # Contacto + WhatsApp
```

---

## Funcionalidades

### Admin Dashboard
- **Dashboard**: KPIs de ventas (diario/semanal/mensual/anual), inventario, top productos, gráficos de tendencia
- **Proveedores**: CRUD completo con búsqueda y rating
- **Inventario**: Vista de productos con stock por color, margen, imágenes; edición inline
- **Compras**: Registro de compras multi-producto con variantes de color. Actualiza stock automáticamente. Soporte crédito.
- **Ventas**: Carrito de venta con productos múltiples, precios ajustables, comprobante imprimible. Soporte crédito.
- **Contabilidad**: P&L, Balance General (Activos/Patrimonio), registro de aportes de capital, libro de asientos
- **Configuración**: Datos empresa, logo, parámetros financieros, serie de facturación, redes sociales

### Tienda Online
- Catálogo con búsqueda y filtros por categoría
- Detalle de producto con galería de imágenes y selector de variante de color
- Carrito con gestión de cantidad
- Pedido por WhatsApp (mensaje automático con detalle del carrito)
- Página de contacto
- Sincronización automática con admin (misma base de datos)

---

## Contabilidad automática

| Operación | Débito | Crédito |
|-----------|--------|---------|
| Compra contado | Inventarios | Efectivo |
| Compra crédito | Inventarios | Cuentas por Pagar |
| Venta contado | Efectivo | Ventas |
| Venta crédito | Cuentas por Cobrar | Ventas |
| COGS (costo de venta) | Costo de Ventas | Inventarios |
| Aporte de capital | Efectivo | Capital Social |

---

## Fase 2 — Migración Online

### Cuando estés listo para subir a producción:

1. **Base de datos**: Crear cuenta en [Supabase](https://supabase.com) (PostgreSQL gratis)
2. **Backend**: Deploy en [Railway](https://railway.app) ($5/mes)
3. **Admin**: Deploy en [Vercel](https://vercel.com) (gratis)
4. **Tienda**: Deploy en [Vercel](https://vercel.com) (gratis)

### Cambio de SQLite → PostgreSQL:
```python
# backend/app/database.py — cambiar:
DATABASE_URL = "sqlite:///./todotec.db"
# por:
DATABASE_URL = "postgresql://user:pass@host:5432/todotec"
```
SQLAlchemy soporta ambos sin cambiar los modelos.

### Variables de entorno para producción:
```env
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=https://admin.todotec.pe,https://www.todotec.pe
```

---

## API Docs

Con el backend corriendo, visita: **http://localhost:8000/docs**

Todos los endpoints están documentados automáticamente por FastAPI.

---

## Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Backend | FastAPI + SQLAlchemy | Python, async, Swagger automático |
| Base de datos (Fase 1) | SQLite | Sin instalación extra |
| Base de datos (Fase 2) | PostgreSQL / Supabase | Sin cambios en código |
| Admin | React 18 + Vite | Hot reload, rápido |
| UI | Tailwind CSS | Amarillo #FFD100 + Azul #1E3A8A |
| Tienda | Next.js 14 | SSR, SEO optimizado |
| Imágenes | Local (uploads/) → Cloudinary | Fase 2: migración sin trauma |
| Pagos (Fase 2) | Culqi + PayPal | Perú-native |

---

*TodoTec v2 — Junio 2026*

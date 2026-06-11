#!/bin/bash
# ╔══════════════════════════════════════════════╗
# ║   TodoTec v2 — Instalador / Setup Inicial    ║
# ║   Ejecuta este script UNA VEZ en la primera  ║
# ║   vez. Después usa "Iniciar TodoTec.command" ║
# ╚══════════════════════════════════════════════╝

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║        TodoTec v2 — Instalación              ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() { echo -e "${YELLOW}▶ $1${NC}"; }
print_ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
print_err()  { echo -e "${RED}  ❌ $1${NC}"; }

print_header

# ── 1. Verificar Python 3 ───────────────────────────────────────────────
print_step "Verificando Python 3..."
if ! command -v python3 &>/dev/null; then
  print_err "Python 3 no encontrado."
  echo ""
  echo "  Instálalo desde: https://www.python.org/downloads/"
  echo "  (Versión mínima recomendada: 3.10)"
  echo ""
  read -p "Presiona Enter para salir..."
  exit 1
fi
PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
print_ok "Python $PY_VER encontrado"

# ── 2. Verificar Node.js ────────────────────────────────────────────────
print_step "Verificando Node.js..."
if ! command -v node &>/dev/null; then
  print_err "Node.js no encontrado."
  echo ""
  echo "  Instálalo desde: https://nodejs.org/  (versión LTS recomendada)"
  echo ""
  read -p "Presiona Enter para salir..."
  exit 1
fi
NODE_VER=$(node -v)
print_ok "Node.js $NODE_VER encontrado"

# ── 3. Backend — entorno virtual Python ────────────────────────────────
print_step "Instalando dependencias del Backend (Python)..."
cd "$DIR/backend"

if [ -d ".venv" ]; then
  echo "  (entorno virtual ya existe, actualizando deps...)"
fi

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
print_ok "Dependencias Python instaladas"

# ── 4. Migración de base de datos ──────────────────────────────────────
print_step "Verificando y migrando base de datos..."
python3 - <<'PYEOF'
import sqlite3, os, sys

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "todotec.db")

# Si no existe la DB, SQLAlchemy la creará sola al arrancar — no hacemos nada
if not os.path.exists(db_path):
    print("  DB nueva — se creará al iniciar el backend.")
    sys.exit(0)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Columnas a verificar/agregar: tabla, columna, definición
migrations = [
    ("product_variants", "image_url", "TEXT DEFAULT ''"),
]

for table, col, definition in migrations:
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    if col not in columns:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {definition}")
        print(f"  ✅ Columna '{col}' agregada a '{table}'")
    else:
        print(f"  ✅ Columna '{col}' ya existe en '{table}'")

conn.commit()
conn.close()
print("  Base de datos al día.")
PYEOF

deactivate
print_ok "Base de datos verificada"

# ── 5. Admin — npm install ──────────────────────────────────────────────
print_step "Instalando dependencias del Admin (React/Vite)..."
cd "$DIR/admin"
npm install --silent
print_ok "Dependencias Admin instaladas"

# ── 6. Store — npm install ─────────────────────────────────────────────
print_step "Instalando dependencias de la Tienda (Next.js)..."
cd "$DIR/store"
npm install --silent
print_ok "Dependencias Tienda instaladas"

# ── Listo ──────────────────────────────────────────────────────────────
cd "$DIR"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅  Instalación completada              ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Ahora ejecuta: Iniciar TodoTec.command      ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║  URLs cuando esté corriendo:                 ║${NC}"
echo -e "${GREEN}║  🏪 Tienda:  http://localhost:3000           ║${NC}"
echo -e "${GREEN}║  ⚙️  Admin:   http://localhost:5173           ║${NC}"
echo -e "${GREEN}║  📡 API:     http://localhost:8000           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Preguntar si abrir el iniciador
read -p "¿Iniciar TodoTec ahora? (s/n): " RESP
if [[ "$RESP" == "s" || "$RESP" == "S" || "$RESP" == "si" || "$RESP" == "Si" ]]; then
  bash "$DIR/Iniciar TodoTec.command"
fi

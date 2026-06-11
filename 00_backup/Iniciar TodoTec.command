#!/bin/bash
# ╔══════════════════════════════════════╗
# ║   TodoTec v2 — Iniciar Sistema       ║
# ╚══════════════════════════════════════╝

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         TodoTec v2 — Iniciando       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Backend ─────────────────────────────
echo "🐍 Iniciando Backend (FastAPI)..."
cd "$DIR/backend"

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python3 no encontrado. Instálalo desde python.org"
  read -p "Presiona Enter para salir..."
  exit 1
fi

# Install deps if needed
if [ ! -d ".venv" ]; then
  echo "📦 Primera vez: instalando dependencias Python..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt --quiet
else
  source .venv/bin/activate
fi

# Start backend in background
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend corriendo en http://localhost:8000"
echo ""

# ── Admin ──────────────────────────────
echo "⚛️  Iniciando Admin Dashboard (React)..."
cd "$DIR/admin"

if ! command -v node &>/dev/null; then
  echo "❌ Node.js no encontrado. Instálalo desde nodejs.org"
  kill $BACKEND_PID 2>/dev/null
  read -p "Presiona Enter para salir..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📦 Primera vez: instalando dependencias Admin..."
  npm install --silent
fi

npm run dev &
ADMIN_PID=$!
echo "✅ Admin corriendo en http://localhost:5173"
echo ""

# ── Store ──────────────────────────────
echo "🛍️  Iniciando Tienda Online (Next.js)..."
cd "$DIR/store"

if [ ! -d "node_modules" ]; then
  echo "📦 Primera vez: instalando dependencias Store..."
  npm install --silent
fi

npm run dev &
STORE_PID=$!
echo "✅ Tienda corriendo en http://localhost:3000"
echo ""

# ── Wait for services ──────────────────
sleep 4

echo "╔══════════════════════════════════════╗"
echo "║         TodoTec v2 — Activo          ║"
echo "╠══════════════════════════════════════╣"
echo "║  🏪 Tienda:    http://localhost:3000  ║"
echo "║  ⚙️  Admin:     http://localhost:5173  ║"
echo "║  📡 API:       http://localhost:8000  ║"
echo "╠══════════════════════════════════════╣"
echo "║  Ctrl+C para detener todo            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Open browser
sleep 2
open "http://localhost:5173" 2>/dev/null || xdg-open "http://localhost:5173" 2>/dev/null

# Wait for Ctrl+C
trap "echo ''; echo 'Deteniendo TodoTec...'; kill $BACKEND_PID $ADMIN_PID $STORE_PID 2>/dev/null; exit 0" INT

wait

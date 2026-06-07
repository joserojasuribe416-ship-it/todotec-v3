#!/bin/bash
# ╔══════════════════════════════════════════════╗
# ║   TodoTec v2 — Compartir con ngrok           ║
# ╚══════════════════════════════════════════════╝

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        TodoTec — Compartir Online            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Verificar / instalar ngrok ──────────────────
if ! command -v ngrok &>/dev/null; then
  echo "▶ ngrok no encontrado. Instalando con Homebrew..."
  if ! command -v brew &>/dev/null; then
    echo "  Instalando Homebrew primero (puede tardar unos minutos)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  brew install ngrok
fi
echo "✅ ngrok listo"

# ── 2. Configurar authtoken ────────────────────────
NGROK_CONFIG="$HOME/.config/ngrok/ngrok.yml"
if [ ! -f "$NGROK_CONFIG" ] || ! grep -q "authtoken" "$NGROK_CONFIG" 2>/dev/null; then
  echo ""
  echo "══════════════════════════════════════════════"
  echo "  Necesitas tu authtoken de ngrok."
  echo "  1. Ve a: https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  2. Copia el token y pégalo aquí:"
  echo "══════════════════════════════════════════════"
  read -p "  Token: " NGROK_TOKEN
  ngrok config add-authtoken "$NGROK_TOKEN"
fi
echo "✅ Authtoken configurado"

# ── 3. Verificar que TodoTec esté corriendo ────────
echo ""
echo "▶ Verificando que TodoTec esté corriendo..."
sleep 1
if ! curl -s http://localhost:8000/health &>/dev/null; then
  echo ""
  echo "⚠️  El backend no está corriendo."
  echo "   Abre 'Iniciar TodoTec.command' primero y vuelve a ejecutar este script."
  echo ""
  read -p "Presiona Enter para salir..."
  exit 1
fi
echo "✅ TodoTec está corriendo"

# ── 4. Crear configuración ngrok para los 3 servicios ──
NGROK_YML="/tmp/todotec_ngrok.yml"
cat > "$NGROK_YML" <<EOF
version: "2"
tunnels:
  api:
    addr: 8000
    proto: http
    bind_tls: true
  admin:
    addr: 5173
    proto: http
    bind_tls: true
  store:
    addr: 3000
    proto: http
    bind_tls: true
EOF

# ── 5. Iniciar ngrok en background ────────────────
echo ""
echo "▶ Iniciando túneles ngrok..."
ngrok start --all --config "$NGROK_YML" --log /tmp/todotec_ngrok.log &
NGROK_PID=$!

# Esperar a que los túneles estén listos
sleep 5

# ── 6. Obtener las URLs ───────────────────────────
URLS=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)

if [ -z "$URLS" ]; then
  echo "❌ No se pudo obtener las URLs. Verifica que ngrok esté funcionando."
  echo "   Log: /tmp/todotec_ngrok.log"
  kill $NGROK_PID 2>/dev/null
  read -p "Presiona Enter para salir..."
  exit 1
fi

# Extraer URLs con python3
PARSED=$(python3 -c "
import json, sys
data = json.loads('''$URLS''')
tunnels = {t['name']: t['public_url'] for t in data.get('tunnels', [])}
print('STORE=' + tunnels.get('store', 'N/A'))
print('ADMIN=' + tunnels.get('admin', 'N/A'))
print('API='   + tunnels.get('api',   'N/A'))
" 2>/dev/null)

eval "$PARSED"

# ── 7. Mostrar resultados ─────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         ✅  TodoTec está disponible online               ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║"
echo "║  🏪 TIENDA (comparte esta al cliente):                  "
echo "║     $STORE"
echo "║"
echo "║  ⚙️  ADMIN (solo para ti):                               "
echo "║     $ADMIN"
echo "║"
echo "║  📡 API:                                                 "
echo "║     $API"
echo "║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  ⚠️  Las URLs cambian cada vez que reinicias ngrok       ║"
echo "║  ⚠️  Válidas mientras esta ventana esté abierta          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Copiar URL de la tienda al portapapeles
echo "$STORE" | pbcopy
echo "  ✅ URL de la Tienda copiada al portapapeles."
echo ""
echo "  Ctrl+C para detener y cerrar los túneles."
echo ""

# Mantener vivo hasta Ctrl+C
trap "kill $NGROK_PID 2>/dev/null; echo 'Túneles cerrados.'; exit 0" INT
wait $NGROK_PID

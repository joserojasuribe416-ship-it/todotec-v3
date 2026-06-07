#!/bin/bash
# ╔══════════════════════════════════════════════╗
# ║   TodoTec v2 — Crear paquete para compartir  ║
# ║   Genera un ZIP limpio sin node_modules,     ║
# ║   .venv ni archivos temporales.              ║
# ╚══════════════════════════════════════════════╝

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT="$(dirname "$DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M")
ZIP_NAME="TodoTec_v2_${TIMESTAMP}.zip"
ZIP_PATH="$PARENT/$ZIP_NAME"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        TodoTec v2 — Empaquetando             ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "▶ Creando ZIP limpio (sin node_modules, .venv, caché)..."
echo "  Destino: $ZIP_PATH"
echo ""

cd "$PARENT"

zip -r "$ZIP_PATH" "todotec_v2" \
  --exclude "*/node_modules/*" \
  --exclude "*/.venv/*" \
  --exclude "*/__pycache__/*" \
  --exclude "*/.next/*" \
  --exclude "*/dist/*" \
  --exclude "*/build/*" \
  --exclude "*/.git/*" \
  --exclude "*/*.pyc" \
  --exclude "*/.DS_Store" \
  -q

if [ $? -eq 0 ]; then
  SIZE=$(du -sh "$ZIP_PATH" | cut -f1)
  echo "╔══════════════════════════════════════════════╗"
  echo "║      ✅  Paquete creado exitosamente         ║"
  echo "╠══════════════════════════════════════════════╣"
  echo "║  Archivo: $ZIP_NAME"
  echo "║  Tamaño:  $SIZE"
  echo "║  Ubicación: $PARENT"
  echo "╠══════════════════════════════════════════════╣"
  echo "║  INSTRUCCIONES PARA TU AMIGO:                ║"
  echo "║  1. Descomprime el ZIP                       ║"
  echo "║  2. Entra a la carpeta todotec_v2            ║"
  echo "║  3. Doble clic en Instalar_TodoTec.command   ║"
  echo "║  4. Luego doble clic en Iniciar TodoTec.cmd  ║"
  echo "╚══════════════════════════════════════════════╝"
  echo ""
  # Abrir el Finder en la carpeta destino
  open "$PARENT"
else
  echo "❌ Error al crear el ZIP. Verifica permisos."
fi

echo ""
read -p "Presiona Enter para cerrar..."

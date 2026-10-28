#!/usr/bin/env bash
# Render completo de la escena de una página de servicio (escritorio + móvil) y empaquetado.
# Uso: bash scripts/hero/render-service.sh <slug> [samples]
#   slug: mvp | software-a-medida | automatizacion-ia | productos-creativos
set -euo pipefail
cd "$(dirname "$0")/../.."
SLUG="$1"; S="${2:-48}"
[ -f "scripts/hero/textures/$SLUG.mjs" ] && node "scripts/hero/textures/$SLUG.mjs"
for CAM in desktop mobile; do
  blender -b --factory-startup --python "scripts/hero/scenes/$SLUG.py" -- --cam "$CAM" --frames all --out "assets/frames_src/$SLUG" --samples "$S" 2>&1 | grep --line-buffered "\[$SLUG\]\|Error\|Traceback"
done
node scripts/build-sequence.mjs "$SLUG"
node scripts/check-white.mjs "public/sequence/$SLUG/v1/desktop" "public/sequence/$SLUG/v1/mobile"
echo "[$SLUG] RENDER DONE"

#!/usr/bin/env bash
# Render de todos los objetos de las secciones de la home (o los indicados) y empaquetado.
# Uso: bash scripts/hero/render-props.sh [prop ...]
set -uo pipefail
cd "$(dirname "$0")/../.."
PROPS="${*:-pencil bead idea puzzle ai-sphere ring float-glass float-card float-sheet float-ring float-cube}"
for P in $PROPS; do
  rm -rf "assets/props_src/$P"
  blender -b --factory-startup --python scripts/hero/props.py -- --prop "$P" --samples 32 2>&1 | grep --line-buffered "DONE\|Error\|Traceback"
done
node scripts/build-props.mjs $PROPS
echo "[props] ALL DONE"

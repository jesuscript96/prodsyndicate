#!/usr/bin/env bash
# Render completo del hero (escritorio + móvil). Uso: bash scripts/hero/render-all.sh [samples]
set -euo pipefail
cd "$(dirname "$0")/../.."
S="${1:-48}"
node scripts/hero/make-textures.mjs
blender -b --factory-startup --python scripts/hero/scene.py -- --cam desktop --frames all --out assets/frames_src --samples "$S" 2>&1 | grep --line-buffered "\[hero\]\|Error\|Traceback"
blender -b --factory-startup --python scripts/hero/scene.py -- --cam mobile --frames all --out assets/frames_src --samples "$S" 2>&1 | grep --line-buffered "\[hero\]\|Error\|Traceback"
echo "[hero] ALL DONE"

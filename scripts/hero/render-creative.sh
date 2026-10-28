#!/usr/bin/env bash
# Render completo de «Productos creativos»: historia por scroll (escritorio + móvil), rejilla de
# puntos de vista para la demo «Pruébalo» y las piezas sueltas que acompañan a las secciones.
# Después empaqueta todo para la web. Uso: bash scripts/hero/render-creative.sh [samples]
set -uo pipefail
cd "$(dirname "$0")/../.."
S="${1:-40}"
SCENE=scripts/hero/scenes/productos-creativos.py
OUT=assets/frames_src/productos-creativos
FRAGS="9 10 16 7 12"   # una pieza por material salvo la naranja, que solo sale en el hero y la demo (ver --mode pieces)
run() { blender -b --factory-startup --python "$SCENE" -- "$@" 2>&1 | grep --line-buffered "DONE\|done\|Error\|Traceback"; }

rm -rf "$OUT"
run --cam desktop --frames all --out "$OUT" --samples "$S"
# Móvil: solo los 72 frames que publica la web (mismo submuestreo que build-sequence)
MOBILE=$(node -e "console.log(Array.from({length:72},(_,i)=>Math.round(i*119/71)+1).join(','))")
run --cam mobile --frames "$MOBILE" --out "$OUT" --samples "$S"
run --mode grid --out "$OUT" --samples 32
for i in $FRAGS; do
  rm -rf "assets/props_src/frag-$i"
  run --mode frag --frag "$i" --samples 28
done

node scripts/build-sequence.mjs productos-creativos
node scripts/check-white.mjs public/sequence/productos-creativos/v2/desktop public/sequence/productos-creativos/v2/mobile
node scripts/build-props.mjs $(for i in $FRAGS; do printf 'frag-%s ' "$i"; done)
echo "[productos-creativos] ALL DONE"

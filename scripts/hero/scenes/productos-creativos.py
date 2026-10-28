"""
Escena «Identidad que se mueve» — página de servicio «Productos creativos e interactivos» (§8.3.4).

Guion (N = 120, misma partitura que la home):
  01 Lienzo (reposo 11–15)      ventana de navegador vacía, inclinada, en la mitad inferior.
  02 Identidad (reposo 45–49)   dentro de la ventana surgen la marca: anillo ultramar, barras
                                tipográficas de tinta, muestras de color y una retícula.
  03 Movimiento (reposo 77–80)  el anillo rompe el plano hacia la cámara, una cinta lo atraviesa y
                                las tarjetas de contenido se separan en profundidad (parallax).
  04 Publicación (reposo 108–120) la ventana publicada + móvil con la misma experiencia; el anillo
                                flota delante, medio fuera del marco; punto «live» en el móvil.

Uso (desde la raíz del proyecto):
  node scripts/hero/textures/productos-creativos.mjs
  blender -b --factory-startup --python scripts/hero/scenes/productos-creativos.py -- \
      --cam desktop|mobile --frames all|1,47,120 [--out assets/frames_src/productos-creativos] \
      [--samples 48] [--scale 1.0]
"""
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts/hero'))
import studio as S
import bpy, math
from mathutils import Vector, Matrix, Euler, Quaternion

A = S.parse_args(default_frames=120, default_out='assets/frames_src/productos-creativos')
S.reset_scene(A.n)
S.set_texture_dir('assets/hero/textures/productos-creativos')

seg, ease_io, ease_out, lerp, norm, clamp = S.seg, S.ease_io, S.ease_out, S.lerp, S.norm, S.clamp
rad = math.radians

# ───────────────────────── Helpers propios ─────────────────────────

def mat4(pos, rot):
    """Matriz mundo a partir de posición y Euler XYZ (grados)."""
    return Matrix.Translation(Vector(pos)) @ Euler((rad(rot[0]), rad(rot[1]), rad(rot[2])), 'XYZ').to_matrix().to_4x4()


def place(o, m):
    o.matrix_world = m


def quat_from_axis(n):
    """Cuaternión que lleva el eje local +Z al vector n (para anillo y discos)."""
    return Vector(n).normalized().to_track_quat('Z', 'Y')


def cr3(points, samples=90):
    """Catmull-Rom 3D por una lista de puntos → polilínea densa."""
    keys = [(i, tuple(p)) for i, p in enumerate(points)]
    n = len(points) - 1
    return [S.catmull(keys, n * i / samples) for i in range(samples + 1)]


def vis(o, on):
    S.set_hidden(o, not on)

# ───────────────────────── Materiales ─────────────────────────

M = {}
M['win_body'] = S.principled_mat('win_body', '#E8E8E3', rough=0.36, coat=0.45)
M['canvas'] = S.screen_mat('canvas', ['canvas_blank.png', 'canvas_grid.png', 'canvas_ui.png'], lit=0.35, rough=0.42)
M['dot'] = S.principled_mat('dot', '#6B6B76', rough=0.5)
M['ultra'] = S.principled_mat('ultra', '#2B3BFF', rough=0.32, coat=0.65)          # ultramar satinado con coat
M['ink'] = [S.principled_mat(f'ink_{i}', '#0B0B0F', rough=0.55) for i in range(3)]  # tinta mate (uno por barra)
M['sw'] = [S.principled_mat(f'sw_{i}', c, rough=0.38, coat=0.5) for i, c in enumerate(['#2B3BFF', '#0B0B0F', '#6B6B76', '#E8E8E3'])]
M['ribbon'] = S.principled_mat('ribbon', '#0B0B0F', rough=0.5)
M['card_body'] = [S.principled_mat(f'card_body_{i}', '#FFFFFF', rough=0.4, coat=0.35) for i in (0, 2)]
M['frost'] = S.glass_mat('frost', rough=0.34)                                     # único vidrio esmerilado
M['card_face'] = {
    'a': S.screen_mat('card_face_a', ['card_a.png'], lit=0.85, rough=0.35),
    'b': S.screen_mat('card_face_b', ['card_b.png'], lit=0.9, rough=0.3, alpha_from_image=True),
    'c': S.screen_mat('card_face_c', ['card_c.png'], lit=0.85, rough=0.35),
}
M['phone_screen'] = S.screen_mat('phone_screen', ['phone_ui.png'], lit=0.97, rough=0.15)
M['live'] = S.principled_mat('live', '#FF5A1F', rough=0.3, emission='#FF5A1F', emit=1.6)
M['live_halo'] = S.principled_mat('live_halo', '#FF5A1F', rough=0.5, emission='#FF5A1F', emit=1.0)

# ───────────────────────── Objetos ─────────────────────────

S.studio_world()
S.studio_lights(target=(0, 0, 0.8))
S.shadow_floor()

# Ventana de navegador: losa + lienzo + tres puntos
WW, WH, WT = 1.4, 1.0, 0.03
win = S.empty('win')
S.rr_box('win_body', WW, WH, WT, 0.06, M['win_body'], win, edge=0.006)
canvas = S.rr_plane('canvas', 1.36, 0.86, 0.045, M['canvas'], win, z=WT / 2 + 0.0008)
canvas.location.y = -0.05
dots = []
for i in range(3):
    d = S.cylinder(f'dot_{i}', 0.017, 0.006, M['dot'], win, verts=32, z0=WT / 2)
    d.location = (-0.62 + i * 0.052, 0.445, 0)
    dots.append(d)

# Marca: anillo (protagonista), barras tipográficas, muestras de color
ring = S.torus('ring', 0.2, 0.07, M['ultra'], segs=128, rings=40)
ring.rotation_mode = 'QUATERNION'
BAR_L = [0.56, 0.42, 0.30]
bars = [S.rr_box(f'bar_{i}', L, 0.08, 0.05, 0.04, M['ink'][i], edge=0.004) for i, L in enumerate(BAR_L)]
swatches = [S.cylinder(f'sw_{i}', 0.056, 0.028, M['sw'][i], verts=48) for i in range(4)]

# Tarjetas de contenido (parallax). B es vidrio esmerilado con impresión RGBA.
card_a = S.card('card_a', 0.72, 0.50, 0.024, 0.036, M['card_body'][0], M['card_face']['a'], edge=0.005)
card_b = S.card('card_b', 0.52, 0.36, 0.02, 0.03, M['frost'], M['card_face']['b'], edge=0.004, inset=0.03)
card_c = S.card('card_c', 0.44, 0.30, 0.024, 0.03, M['card_body'][1], M['card_face']['c'], edge=0.005)
cards = [card_a, card_b, card_c]

# Móvil (pantalla mirando a -Y tras rotar X 90°)
phone = S.build_phone('phone', M['phone_screen'])
live_dot = S.sphere('live_dot', 0.017, M['live'], phone['live'], segs=24, rings=12)
halo = S.rr_plane('live_halo', 0.07, 0.07, 0.035, M['live_halo'], phone['live'], z=-0.004)

# ───────────────────────── Posiciones clave ─────────────────────────
# Ventana por capítulo: (pos, rot XYZ°). Rot X 90 = de pie mirando a la cámara (-Y).
WIN_00 = ((0.0, 0.0, 0.5), (46, 0, -9))   # frame 1: algo más tumbada y baja
WIN_01 = ((0.0, 0.0, 0.56), (52, 0, -7))
WIN_02 = ((0.0, 0.0, 0.88), (90, 0, 0))
WIN_03 = ((0.15, 0.55, 0.92), (90, 0, 0))
WIN_04 = ((0.05, 0.35, 0.86), (90, 0, 0))

# Elementos de marca en coordenadas locales de la ventana (x derecha, y arriba, z hacia la cámara)
RING_LOCAL = Vector((0.27, -0.02, 0.22))
RING_AXIS_LOCAL = Vector((0.5, -0.18, 1.0)).normalized()
BAR_LOCAL = [Vector((-0.63 + BAR_L[i] / 2, 0.25 - i * 0.12, 0.07 + i * 0.015)) for i in range(3)]
SW_LOCAL = [Vector((-0.52 + i * 0.145, -0.24, 0.06)) for i in range(4)]
CARD_LOCAL = [Vector((-0.3, 0.05, 0.03)), Vector((0.32, 0.1, 0.03)), Vector((0.25, -0.22, 0.03))]

# Capítulo 03 (mundo): anillo delante, tarjetas a distintas profundidades
RING_03 = Vector((-0.12, -1.0, 0.6))
RING_AXIS_03 = Vector((0.45, -0.82, 0.2)).normalized()
CARD_03 = [((-0.62, 0.0, 1.1), (90, 0, -8)), ((0.45, -0.1, 1.18), (90, 0, 6)), ((0.7, -0.3, 0.45), (90, 0, -3))]

# Capítulo 04 (mundo)
RING_04 = Vector((-0.66, -0.55, 0.42))
RING_AXIS_04 = Vector((-0.3, -0.85, 0.42)).normalized()
PHONE_04 = ((0.86, -0.2, 0.5), (90, 0, -10))
PHONE_SCALE = 0.8

# Cinta: Catmull-Rom que atraviesa el anillo del cap. 03 a lo largo de su eje
_n = RING_AXIS_03
RIBBON_PTS = cr3([
    Vector((-0.6, 0.25, 0.95)),                # nace oculta tras la tarjeta A
    Vector((-0.82, -0.12, 0.84)),              # asoma bajo su esquina izquierda
    RING_03 - _n * 0.5 + Vector((0, 0, 0.03)),
    RING_03,                                   # atraviesa el anillo por su eje
    RING_03 + _n * 0.5,
    RING_03 + _n * 0.64 + Vector((0.03, 0.0, 0.1)),    # sale corta, hacia la derecha
], samples=100)
ribbon = S.polyline('ribbon', RIBBON_PTS, M['ribbon'], thick=0.0095)
ribbon.data.bevel_factor_mapping_start = 'SPLINE'
ribbon.data.bevel_factor_mapping_end = 'SPLINE'
ribbon.data.bevel_resolution = 4

# ───────────────────────── Coreografía ─────────────────────────

def win_matrix(f):
    bob = 0.004 * math.sin(f * 0.21)
    t01 = seg(f, 1, 11, ease_out)
    t12 = seg(f, 15, 42)
    t23 = seg(f, 49, 70)
    t34 = seg(f, 84, 104)
    pos = Vector(WIN_00[0]).lerp(Vector(WIN_01[0]), t01).lerp(Vector(WIN_02[0]), t12)
    pos = pos.lerp(Vector(WIN_03[0]), t23)
    pos = pos.lerp(Vector(WIN_04[0]), t34)
    rot = Vector(WIN_00[1]).lerp(Vector(WIN_01[1]), t01).lerp(Vector(WIN_02[1]), t12)
    rot = rot.lerp(Vector(WIN_03[1]), t23)
    rot = rot.lerp(Vector(WIN_04[1]), t34)
    return mat4(pos + Vector((0, 0, bob)), rot)


def pose(f):
    t = f
    W = win_matrix(f)
    Wrot = W.to_3x3()
    place(win, W)

    # ── Ventana: puntos que nacen uno a uno, lienzo (blanco → retícula → UI publicada) ──
    for i, d in enumerate(dots):
        s = ease_out(norm(f, 2 + i * 2.5, 8 + i * 2.5))
        S.set_scale(d, s)
    S.set_mix(M['canvas'], 1, seg(f, 24, 36))                      # retícula
    S.set_mix(M['canvas'], 2, seg(f, 94, 104))                     # experiencia publicada
    S.set_lit(M['canvas'], lerp(0.35, 0.93, seg(f, 96, 108)))

    # ── Barras tipográficas: entran desde la izquierda (cap. 02), se funden en el cap. 03 ──
    for i, b in enumerate(bars):
        a_in = seg(f, 26 + i * 3, 36 + i * 3, ease_out)
        a_out = 1 - seg(f, 52, 62)
        a = a_in * a_out
        S.set_alpha(M['ink'][i], a)
        vis(b, a > 0.002)
        loc = BAR_LOCAL[i] + Vector((-0.35 * (1 - a_in), 0, 0.12 * (1 - a_in))) + Vector((0, 0, 0.1 * (1 - a_out)))
        place(b, W @ Matrix.Translation(loc))

    # ── Muestras de color: aparecen con escala (cap. 02), se funden en el cap. 03 ──
    for i, sw in enumerate(swatches):
        s_in = ease_out(norm(f, 33 + i * 2.5, 42 + i * 2.5))
        s_out = 1 - seg(f, 53, 61)
        s = s_in * s_out
        vis(sw, s > 0.002)
        place(sw, W @ Matrix.Translation(SW_LOCAL[i] + Vector((0, 0, 0.08 * (1 - s_in)))))
        S.set_scale(sw, s)

    # ── Anillo: nace dentro de la ventana, rompe el plano (cap. 03) y se posa delante (cap. 04) ──
    r_in = ease_out(norm(f, 28, 44))
    t23 = seg(f, 49, 67)
    t34 = seg(f, 86, 106)
    p_local = W @ RING_LOCAL
    p = p_local.lerp(RING_03, t23).lerp(RING_04, t34)
    p.z += 0.008 * math.sin(t * 0.19 + 1.0)
    q_local = quat_from_axis(Wrot @ RING_AXIS_LOCAL)
    # giro de entrada: el eje se endereza mientras crece
    q_spin = Quaternion(Wrot @ Vector((0, 1, 0)), rad(70) * (1 - r_in))
    q = (q_spin @ q_local).slerp(quat_from_axis(RING_AXIS_03), t23).slerp(quat_from_axis(RING_AXIS_04), t34)
    ring.location = p
    ring.rotation_quaternion = q
    S.set_scale(ring, r_in)
    vis(ring, r_in > 0.002)

    # ── Cinta: se dibuja atravesando el anillo (cap. 03) y recoge la cola al publicar ──
    end = seg(f, 62, 77)
    start = seg(f, 82, 96)
    ribbon.data.bevel_factor_end = end
    ribbon.data.bevel_factor_start = min(start, end)
    vis(ribbon, end > 0.002 and start < 0.998)

    # ── Tarjetas: salen del lienzo en profundidad (cap. 03) y vuelven a él al publicar (cap. 04) ──
    for i, (root, body, face) in enumerate(cards):
        o_in = seg(f, 54 + i * 4, 70 + i * 4)
        o_out = seg(f, 84 + i * 3, 98 + i * 3)
        a = seg(f, 54 + i * 4, 60 + i * 4) * (1 - seg(f, 92 + i * 2, 100 + i * 2))
        m_local = W @ Matrix.Translation(CARD_LOCAL[i])
        m_world = mat4(*CARD_03[i])
        pos = m_local.to_translation().lerp(m_world.to_translation(), o_in)
        pos = pos.lerp(m_local.to_translation() + Vector((0, 0, 0.02)), o_out)
        pos.z += 0.006 * math.sin(t * 0.23 + i)
        q0 = m_local.to_quaternion(); q1 = m_world.to_quaternion()
        q = q0.slerp(q1, o_in).slerp(q0, o_out)
        root.matrix_world = Matrix.Translation(pos) @ q.to_matrix().to_4x4()
        s = lerp(0.78, 1.0, o_in) * lerp(1.0, 0.9, o_out)
        S.set_scale(root, s)
        bm = M['frost'] if i == 1 else M['card_body'][0 if i == 0 else 1]
        S.set_alpha(bm, a)
        S.set_alpha(M['card_face']['abc'[i]], a)
        vis(root, a > 0.002)

    # ── Móvil: entra desde la derecha y abajo al publicar; punto live ──
    ph = ease_out(norm(f, 94, 110))
    pm = mat4(Vector(PHONE_04[0]) + Vector((0.5 * (1 - ph), -0.2 * (1 - ph), -0.3 * (1 - ph))), PHONE_04[1])
    phone['root'].matrix_world = pm
    S.set_scale(phone['root'], ph * PHONE_SCALE)
    vis(phone['root'], ph > 0.002)
    pulse = 0.5 + 0.5 * math.sin(t * 0.55)
    live_on = seg(f, 110, 116)
    S.set_scale(live_dot, live_on * (1 + 0.25 * pulse))
    S.set_scale(halo, live_on * (1 + 1.0 * pulse))
    S.set_alpha(M['live_halo'], 0.28 * (1 - pulse) * live_on)
    vis(live_dot, live_on > 0.002); vis(halo, live_on > 0.002)


# (frame, (az°, el°, dist, tx, ty, tz, shift_y, lens))
CAM_KEYS = {
    'desktop': [
        (1, (5, 31, 4.4, 0.0, 0.0, 0.5, 0.22, 50)),
        (13, (6, 30, 4.3, 0.0, 0.0, 0.5, 0.22, 50)),
        (20, (6, 29, 4.28, 0.0, 0.0, 0.52, 0.215, 50)),
        (45, (-14, 12, 3.9, 0.0, 0.0, 0.88, 0.0, 50)),
        (49, (-15, 12, 3.9, 0.0, 0.0, 0.88, 0.0, 50)),
        (77, (-30, 15, 4.7, 0.0, -0.15, 0.85, 0.0, 50)),
        (80, (-30, 15, 4.7, 0.0, -0.15, 0.85, 0.0, 50)),
        (108, (0, 9, 4.35, 0.12, 0.0, 0.76, 0.0, 50)),
        (120, (0, 9, 4.35, 0.12, 0.0, 0.76, 0.0, 50)),
    ],
}
CAM_KEYS['mobile'] = S.mobile_keys(CAM_KEYS['desktop'], lens_k=1.0, shift_k=0.85, dist_k=1.12)

S.run(A, pose, CAM_KEYS, label='productos-creativos')

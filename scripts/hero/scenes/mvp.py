"""
Escena «Lo mínimo que importa» — página de servicio «MVP para emprendedores» (§8.3.1).

Guion (N = 120, misma partitura que la home):
  01 Descubrimiento (1–15)   nube de tarjetas de idea flotando en la mitad inferior del encuadre
                             (el 45 % superior queda libre para el titular).
  02 Alcance (15–49)         las tarjetas se ordenan en tres filas en profundidad sobre un tablero
                             invisible: esencial (delante, borde ultramar que se enciende) · deseable
                             (detrás, agrisada) · futuro (al fondo, desvanecida).
  03 Construcción (49–80)    las cuatro esenciales vuelan y se ensamblan como bloques de la pantalla
                             de un móvil; el móvil se materializa a su alrededor.
  04 Lanzamiento (80–120)    los bloques se funden en la pantalla; el móvil de pie, flotando; avatares
                             de usuarios conectados por hilos finos y un gráfico de barras que crece;
                             punto «live» naranja en la gráfica.

Uso (desde la raíz del proyecto), tras `node scripts/hero/textures/mvp.mjs`:
    blender -b --factory-startup --python scripts/hero/scenes/mvp.py -- \
        --cam desktop|mobile --frames all|1,47,120 [--out assets/frames_src/mvp] [--samples 48] [--scale 1.0]
    [--probe 1] imprime la posición (% del lienzo) de las piezas que nombran los chips en cada frame.
"""
import os, sys, json, math
import bpy
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts/hero'))
import studio as S
from mathutils import Vector, Euler, Matrix

A = S.parse_args(default_frames=120, default_out='assets/frames_src/mvp')
PROBE = S.arg('probe', '0') == '1'
S.reset_scene(A.n)
TEX_DIR = 'assets/hero/textures/mvp'
S.set_texture_dir(TEX_DIR)
with open(os.path.join(os.getcwd(), TEX_DIR, 'cards.json')) as fh:
    CATALOG = json.load(fh)['cards']

P = S.PALETTE
seg, ease_io, ease_out, lerp, norm, clamp = S.seg, S.ease_io, S.ease_out, S.lerp, S.norm, S.clamp
rad = math.radians

# ───────────────────────── Utilidades propias ─────────────────────────

class Rnd:
    """LCG con semilla fija: misma f → misma imagen."""
    def __init__(self, seed):
        self.s = seed

    def __call__(self):
        self.s = (self.s * 16807) % 2147483647
        return self.s / 2147483647


R = Rnd(11)


def jit(a):
    return (R() - 0.5) * 2 * a


def vl(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def tl(a, b, t):
    """Lerp de tuplas (ángulos de Euler, colores…)."""
    return tuple(lerp(x, y, t) for x, y in zip(a, b))


def shuffled(items, rnd):
    items = list(items)
    for i in range(len(items) - 1, 0, -1):
        j = int(rnd() * (i + 1))
        items[i], items[j] = items[j], items[i]
    return items


# ───────────────────────── Estudio ─────────────────────────
S.studio_world()
S.studio_lights(target=(0, 0.3, 0.6))
S.shadow_floor()

# ───────────────────────── Tarjetas ─────────────────────────
CARD_T = 0.012
cards_root = S.empty('cards')
LIN_GREY = S.lin('#E8E8E3')


class Card:
    pass


cards, ess, ideas = [], [], []
for i, c in enumerate(CATALOG):
    k = Card()
    k.i, k.name, k.w, k.h, k.r, k.ess = i, c['name'], c['w'], c['h'], c['r'], c['essential']
    k.bg = S.lin(c['bg'])
    k.body_m = S.principled_mat(f'body_{i}', c['bg'], rough=0.45, coat=0.25)
    k.face_m = S.screen_mat(f'face_{i}', [c['file']], lit=0.0, rough=0.55)
    k.root, k.body, k.face = S.card(f'card_{i}', k.w, k.h, CARD_T, k.r, k.body_m, k.face_m, cards_root, edge=0.0035)
    if k.ess:
        k.edge_m = S.principled_mat(f'edge_{i}', P['accent'], rough=0.35, emission=P['accent'], emit=0.0)
        k.edge = S.rr_outline(f'edge_{i}', k.w + 0.003, k.h + 0.003, k.r + 0.0015, k.edge_m, k.root, thick=0.0028)
        k.block = Vector((c['block'][0], c['block'][1], 0.0))
    (ess if k.ess else ideas).append(k)
    cards.append(k)

# Nube (cap. 01): rejilla 4×5 (18 de 20 celdas) con jitter, asignación barajada con semilla fija
CLOUD_ROWS = [(-0.45, 0.18), (-0.10, 0.44), (0.25, 0.70), (0.60, 0.96)]   # (y, z) de cada fila, de delante a atrás
cells = shuffled([(r, c) for r in range(4) for c in range(5)], Rnd(7))[:len(cards)]
for k, (r, c) in zip(shuffled(cards, Rnd(3)), cells):
    y0, z0 = CLOUD_ROWS[r]
    x = -1.06 + c * 0.47 + (r % 2) * 0.22 - 0.11
    k.cloud_pos = Vector((x + jit(0.09), y0 + jit(0.14), z0 + jit(0.11)))
    k.cloud_rot = (rad(60 + jit(10)), rad(jit(8)), rad(jit(9)))
    k.phase = R() * 6.2832
    k.delay = R() * 3.0

# Matriz (cap. 02): tres filas en profundidad. (y, z, inclinación°)
MAT_E, MAT_D, MAT_F = (0.0, 0.40, 70), (0.85, 0.66, 66), (1.70, 0.92, 62)


def row_layout(ks, row, gap):
    y, z, tilt = row
    total = sum(k.w for k in ks) + gap * (len(ks) - 1)
    x = -total / 2
    for k in ks:
        k.mat_pos = Vector((x + k.w / 2, y, z))
        k.mat_rot = (rad(tilt), 0.0, 0.0)
        x += k.w + gap


row_layout(ess, MAT_E, 0.07)
D_ROW, F_ROW = ideas[0::2], ideas[1::2]
row_layout(D_ROW, MAT_D, 0.05)
row_layout(F_ROW, MAT_F, 0.05)
for k in D_ROW:
    k.tier = 1
for k in F_ROW:
    k.tier = 2

# ───────────────────────── Móvil, avatares, gráfico (cap. 03–04) ─────────────────────────
stage = S.empty('stage')
phone_m = S.screen_mat('phone_screen', ['phone_base.png', 'phone_ui.png'], lit=0.97, rough=0.15)
phone = S.build_phone('phone', phone_m, stage)
PH_W, PH_H, PH_T = phone['size']
PHONE_POS = Vector((0.0, 0.0, 0.80))
PHONE_ROT = (rad(90), 0.0, 0.0)
DM = S.device_mats()

live = phone['live']
live.location = (0.165, 0.19, PH_T / 2 + 0.006)   # esquina superior derecha de la gráfica
live_m = S.emissive_mat('live', P['signal'], 1.6)
halo_m = S.emissive_mat('live_halo', P['signal'], 1.0)
live_dot = S.sphere('live_dot', 0.016, live_m, live, segs=24, rings=12)
halo = S.rr_plane('live_halo', 0.064, 0.064, 0.032, halo_m, live, z=-0.004)

AV_MATS = {
    'accent': S.principled_mat('av_accent', P['accent'], rough=0.35, coat=0.3),
    'ink': S.principled_mat('av_ink', P['ink'], rough=0.3, coat=0.5),
    'grey': S.principled_mat('av_grey', P['ink3'], rough=0.4, coat=0.2),
}
RING_MATS = {'ink': S.principled_mat('ring_ink', P['ink'], rough=0.35), 'accent': S.principled_mat('ring_accent', P['accent'], rough=0.35)}
thread_m = S.principled_mat('thread', P['ink3'], rough=0.5)
# (posición, cuerpo, anillo, anclaje en el canto del móvil, curvatura del hilo)
AVATARS = [
    ((-0.80, 0.14, 1.30), 'accent', 'ink', (-0.27, 0.05, 1.06), 0.35),
    ((-0.98, 0.10, 0.82), 'ink', 'accent', (-0.27, 0.05, 0.82), 0.35),
    ((0.84, 0.14, 1.34), 'grey', 'ink', (0.27, 0.05, 1.08), -0.35),
    ((0.98, 0.10, 0.88), 'accent', 'ink', (0.27, 0.05, 0.88), -0.35),
    ((0.80, 0.06, 0.34), 'ink', 'accent', (0.27, 0.05, 0.42), -0.35),
]


class Avatar:
    pass


avatars = []
for i, (pos, fill, rg, anchor, bend) in enumerate(AVATARS):
    av = Avatar()
    av.pos = Vector(pos)
    av.root = S.empty(f'avatar_{i}', stage)
    av.root.location = av.pos
    S.sphere(f'avatar_{i}_body', 0.06, AV_MATS[fill], av.root)
    ring = S.torus(f'avatar_{i}_ring', 0.088, 0.0045, RING_MATS[rg], av.root, segs=64, rings=12)
    ring.rotation_euler.x = rad(90)
    d = (Vector(anchor) - av.pos).normalized()
    av.thread = S.bezier_tube(f'thread_{i}', av.pos + d * 0.105, anchor, thread_m, stage, thick=0.003, bend=bend, samples=32, axis='x')
    avatars.append(av)

chart = S.empty('chart', stage)
chart.location = (-0.78, 0.08, 0.22)
BAR_H = [0.13, 0.21, 0.17, 0.29, 0.35, 0.47]
BAR_W, BAR_PITCH = 0.068, 0.094
bar_grey_m = S.principled_mat('bar_grey', '#A9A9AD', rough=0.45, coat=0.2)
bar_acc_m = S.principled_mat('bar_accent', P['accent'], rough=0.4, coat=0.3)
base_m = S.principled_mat('chart_base', P['ink3'], rough=0.5)
bars = []
for i, h in enumerate(BAR_H):
    b = S.rr_box(f'bar_{i}', BAR_W, h, 0.03, 0.02, bar_acc_m if i == len(BAR_H) - 1 else bar_grey_m, chart, edge=0.004)
    b.rotation_euler.x = rad(90)
    b.location.x = -BAR_PITCH * (len(BAR_H) - 1) / 2 + i * BAR_PITCH
    bars.append(b)
chart_base = S.polyline('chart_base', [(-0.31, 0, 0), (0.31, 0, 0)], base_m, chart, thick=0.0025)

# ───────────────────────── Cámara ─────────────────────────
# Poses (frame, (az°, el°, dist, tx, ty, tz, shift_y, lens)). Dentro de cada transición se interpola con
# Catmull-Rom entre sus claves y el tiempo suavizado (cúbica in-out); en los reposos la cámara está quieta.
RESTS = [(11, 15), (45, 49), (77, 80), (108, 120)]
POSES = {
    'desktop': [
        (1, (8, 42, 5.4, 0.0, 0.10, 0.55, 0.21, 50)),
        (11, (10, 41, 5.25, 0.0, 0.10, 0.55, 0.21, 50)),
        (30, (2, 33, 5.2, 0.0, 0.45, 0.58, 0.10, 50)),
        (45, (-6, 24, 4.9, -0.04, 0.70, 0.60, 0.00, 50)),
        (62, (-16, 18, 4.3, 0.0, 0.10, 0.74, 0.00, 50)),
        (77, (-8, 12, 3.5, 0.0, 0.00, 0.80, 0.00, 50)),
        (94, (2, 14, 4.2, 0.0, 0.00, 0.80, 0.00, 50)),
        (108, (-6, 9, 4.5, 0.0, 0.00, 0.80, 0.00, 50)),
    ],
}
POSES['mobile'] = [(f, (az, el, d * 1.06, tx, ty, tz, sy * 1.15, lens * 1.1)) for f, (az, el, d, tx, ty, tz, sy, lens) in POSES['desktop']]


def cam_at(poses, f):
    for a, b in RESTS:
        if a <= f <= b:
            return S.catmull(poses, a)
    bounds = [1] + [x for ab in RESTS for x in ab]
    a = max(x for x in bounds if x <= f)
    b = min(x for x in bounds if x > f)
    u = ease_io(norm(f, a, b))
    sub = [(fr, v) for fr, v in poses if a <= fr <= b]
    if sub[0][0] != a:
        sub.insert(0, (a, S.catmull(poses, a)))
    if sub[-1][0] != b:
        sub.append((b, S.catmull(poses, b)))
    return S.catmull(sub, a + u * (b - a))


CAM_KEYS = {cam: [(f, cam_at(poses, f)) for f in range(1, A.n + 1)] for cam, poses in POSES.items()}

# ───────────────────────── Coreografía ─────────────────────────
PROBE_POINTS = {}


def phone_matrix(f):
    ph_in = ease_out(norm(f, 64, 76))
    sc = lerp(0.9, 1.0, ph_in)
    bob = 0.008 * math.sin(0.17 * f) * seg(f, 77, 90)
    return Matrix.Translation(PHONE_POS + Vector((0, 0, bob))) @ Euler(PHONE_ROT).to_matrix().to_4x4() @ Matrix.Diagonal((sc, sc, sc, 1)), sc


def pose(f):
    t = float(f)
    pm, sc = phone_matrix(f)
    PROBE_POINTS.clear()

    # ── Tarjetas ──
    for k in cards:
        a = seg(f, 15 + k.delay, 42 + k.delay)                      # nube → matriz
        bob = Vector((0, 0, 0.022 * math.sin(0.19 * t + k.phase))) * (1 - a)
        wob = (rad(2.5) * math.sin(0.15 * t + k.phase), rad(2.0) * math.cos(0.13 * t + k.phase * 1.3), 0.0)
        pos = vl(k.cloud_pos, k.mat_pos, a) + bob
        pos.z += 0.12 * math.sin(math.pi * a)                      # arco suave en el viaje
        rot = tuple(r + w * (1 - a) for r, w in zip(tl(k.cloud_rot, k.mat_rot, a), wob))
        alpha, face_a, lit = 1.0, 1.0, 0.0
        S.set_color(k.body_m, k.bg)
        if k.ess:
            j = ess.index(k)
            g = seg(f, 34, 46)                                      # se iluminan (02)
            S.set_emit(k.edge_m, 3.0 * g * (1 - seg(f, 84, 92)))
            S.set_alpha(k.edge_m, 1 - seg(f, 82, 90))
            lit = 0.35 * g
            b = seg(f, 53 + 2.5 * j, 69 + 2.5 * j)                  # vuelo al móvil (03)
            if b > 0:
                lift = lerp(0.02, 0.0071, seg(f, 82, 92))
                tgt = pm @ (k.block + Vector((0, 0, PH_T / 2 + 0.0012 + lift / max(sc, 1e-3))))
                pos = vl(pos, tgt, b)
                pos.z += 0.22 * math.sin(math.pi * b) * (1 - b)
                pos.y -= 0.35 * math.sin(math.pi * b)
                rot = tl(rot, PHONE_ROT, b)
                lit = lerp(lit, 0.97, seg(f, 60, 76))
            sink = seg(f, 82, 92)                                   # se funden en la pantalla (04)
            k.body.scale.z = lerp(1.0, 0.12, sink)
            k.face.location.z = CARD_T / 2 * k.body.scale.z + 0.0008
            alpha = 1 - seg(f, 90, 98)
        else:
            g = seg(f, 30 + k.delay * 0.6, 45)                      # deseable / futuro se agrisan (02)
            S.set_color(k.body_m, tl(k.bg, LIN_GREY, g))
            face_a = 1 - (0.55 if k.tier == 1 else 0.7) * g
            alpha = 1 - (0.10 if k.tier == 1 else 0.32) * g
            away = seg(f, 49 + k.delay * 1.6, 61 + k.delay * 1.6)   # se van (03)
            pos += Vector((0, 0.9, 0.5)) * away
            alpha *= 1 - away
        k.root.location = pos
        k.root.rotation_euler = rot
        S.set_alpha(k.body_m, alpha)
        S.set_alpha(k.face_m, alpha * face_a)
        S.set_lit(k.face_m, lit)
        S.set_hidden(k.root, alpha <= 0.002)

    # ── Móvil ──
    ph_a = seg(f, 64, 74)
    phone['root'].location = pm.to_translation()
    phone['root'].rotation_euler = PHONE_ROT
    phone['root'].scale = (sc,) * 3
    for m in (DM['alu'], DM['black_glass'], phone_m):
        S.set_alpha(m, ph_a)
    S.set_mix(phone_m, 1, seg(f, 84, 92))
    S.set_hidden(phone['root'], ph_a <= 0.002)
    pulse = 0.5 + 0.5 * math.sin(0.55 * t)
    lo = seg(f, 100, 106)
    S.set_scale(live, lo * (1 + 0.25 * pulse))
    S.set_scale(halo, lo * (1 + 1.0 * pulse))
    S.set_alpha(halo_m, 0.28 * (1 - pulse) * lo)
    S.set_hidden(live, lo <= 0.002)

    # ── Avatares e hilos ──
    for i, av in enumerate(avatars):
        s = ease_out(norm(f, 90 + 2.5 * i, 99 + 2.5 * i))
        S.set_scale(av.root, s)
        S.set_hidden(av.root, s <= 0.002)
        d = seg(f, 94 + 2 * i, 103 + 2 * i, ease_out)
        av.thread.data.bevel_factor_end = max(d, 1e-3)
        S.set_hidden(av.thread, d <= 0.002)

    # ── Gráfico ──
    c_in = seg(f, 92, 98)
    S.set_alpha(base_m, c_in)
    S.set_hidden(chart, c_in <= 0.002)
    for i, b in enumerate(bars):
        s = ease_out(norm(f, 94 + 1.4 * i, 102 + 1.4 * i))
        b.scale.y = max(s, 1e-4)
        b.location.z = BAR_H[i] * s / 2
        b.hide_render = s <= 0.002

    if PROBE:
        probe(f, pm)


def probe(f, pm):
    """Imprime la posición en % del lienzo (x desde la izquierda, y desde arriba) de las piezas con chip."""
    from bpy_extras.object_utils import world_to_camera_view
    S.pose_camera(CAM_KEYS.get(A.cam) or S.mobile_keys(CAM_KEYS['desktop']), f)
    bpy.context.view_layer.update()
    pts = {
        'nube': sum((k.root.location for k in cards), Vector()) / len(cards),
        'esencial': sum((k.mat_pos for k in ess), Vector()) / len(ess),
        'esencial_izq': ess[0].mat_pos, 'esencial_der': ess[-1].mat_pos,
        'deseable_izq': D_ROW[0].mat_pos, 'deseable_der': D_ROW[-1].mat_pos,
        'futuro_izq': F_ROW[0].mat_pos, 'futuro_der': F_ROW[-1].mat_pos,
        'movil_centro': pm.to_translation(), 'movil_top': pm @ Vector((0, PH_H / 2, 0)), 'movil_bottom': pm @ Vector((0, -PH_H / 2, 0)),
        'movil_izq': pm @ Vector((-PH_W / 2, 0, 0)), 'movil_der': pm @ Vector((PH_W / 2, 0, 0)),
        'bloque_header': pm @ ess[0].block, 'bloque_cta': pm @ ess[3].block,
        'grafico': chart.location + Vector((0, 0, 0.25)), 'grafico_top': chart.location + Vector((0, 0, BAR_H[-1])),
    }
    for i, av in enumerate(avatars):
        pts[f'avatar_{i}'] = av.pos
    out = []
    for name, p in pts.items():
        v = world_to_camera_view(S.scene, S._cam['obj'], Vector(p))
        out.append(f'{name}=({100 * v.x:.1f},{100 * (1 - v.y):.1f})')
    print(f'[mvp-probe] {A.cam} f{f:03d} ' + ' '.join(out), flush=True)


S.run(A, pose, CAM_KEYS, label='mvp')

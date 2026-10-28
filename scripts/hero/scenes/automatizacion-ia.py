"""
Escena «Procesos que se hacen solos» (servicio Automatización e IA), 100 % procedural.

Guion (120 frames, misma partitura que la home):
  01 Mapa (1–15)         pila de documentos y un cursor que los mueve uno a uno, en bucle.
  02 Conexión (15–49)    los documentos vuelan y se convierten en nodos de un editor de flujos;
                         los tubos se dibujan entre ellos.
  03 IA (49–80)          el nodo central se convierte en una esfera de vidrio con núcleo ultramar;
                         paquetes de datos recorren el flujo y salen clasificados por ramas.
  04 Monitorización (80–120)  los destinos se tumban como bandejas, los paquetes se apilan
                         ordenados con una marca de «hecho»; aparece el panel de monitorización.

Uso (desde la raíz del proyecto):
  node scripts/hero/textures/automatizacion-ia.mjs
  blender -b --factory-startup --python scripts/hero/scenes/automatizacion-ia.py -- \
      --cam desktop|mobile --frames all|1,13,47 [--out assets/frames_src/automatizacion-ia] \
      [--samples 48] [--scale 1.0]
"""
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts/hero'))
import studio as S
import bpy, bmesh, math
from mathutils import Vector, Euler

A = S.parse_args(default_frames=120, default_out='assets/frames_src/automatizacion-ia')
S.reset_scene(A.n)
S.set_texture_dir('assets/hero/textures/automatizacion-ia')

# ───────────────────────── Helpers propios ─────────────────────────

def bez(p0, c0, c1, p1, t):
    a = p0.lerp(c0, t); b = c0.lerp(c1, t); c = c1.lerp(p1, t)
    return a.lerp(b, t).lerp(b.lerp(c, t), t)


class Path:
    """Bezier cúbica entre dos puntos con tiradores horizontales (como un editor de flujos),
    muestreada y reparametrizada por longitud de arco: at(s) con s ∈ 0..1 a velocidad uniforme."""

    def __init__(self, p0, p1, bend=0.5, n=48):
        p0, p1 = Vector(p0), Vector(p1)
        d = abs(p1.x - p0.x) * bend
        c0 = p0 + Vector((d, 0, 0)); c1 = p1 - Vector((d, 0, 0))
        self.pts = [bez(p0, c0, c1, p1, i / n) for i in range(n + 1)]
        self.cum = [0.0]
        for i in range(1, n + 1):
            self.cum.append(self.cum[-1] + (self.pts[i] - self.pts[i - 1]).length)
        self.length = self.cum[-1]

    def at(self, s):
        target = S.clamp(s) * self.length
        for i in range(1, len(self.cum)):
            if self.cum[i] >= target:
                L = self.cum[i] - self.cum[i - 1]
                k = (target - self.cum[i - 1]) / L if L > 0 else 0.0
                return self.pts[i - 1].lerp(self.pts[i], k)
        return self.pts[-1].copy()


class Chain:
    """Varias Path encadenadas; at(s) a velocidad uniforme sobre la longitud total."""

    def __init__(self, paths):
        self.paths = paths
        self.length = sum(p.length for p in paths)
        self.starts = []
        acc = 0.0
        for p in paths:
            self.starts.append(acc / self.length); acc += p.length

    def at(self, s):
        s = S.clamp(s)
        for i in range(len(self.paths) - 1, -1, -1):
            if s >= self.starts[i]:
                frac = self.paths[i].length / self.length
                return self.paths[i].at((s - self.starts[i]) / frac if frac > 0 else 0.0)
        return self.paths[0].at(0)


def prism(name, pts2d, t, mat, parent=None):
    """Prisma fino a partir de un polígono 2D (caras ±Z)."""
    area2 = sum(pts2d[i][0] * pts2d[(i + 1) % len(pts2d)][1] - pts2d[(i + 1) % len(pts2d)][0] * pts2d[i][1] for i in range(len(pts2d)))
    if area2 < 0:
        pts2d = list(reversed(pts2d))
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    top = [bm.verts.new((x, y, t / 2)) for x, y in pts2d]
    bot = [bm.verts.new((x, y, -t / 2)) for x, y in pts2d]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    n = len(pts2d)
    for i in range(n):
        bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = S.link(bpy.data.objects.new(name, me), parent)
    me.materials.append(mat)
    bv = o.modifiers.new('bevel', 'BEVEL'); bv.width = t * 0.3; bv.segments = 2
    return o


def hide(o, hidden):
    S.set_hidden(o, hidden)


# ───────────────────────── Materiales ─────────────────────────
M = {}
M['tube'] = S.principled_mat('tube', '#6B6B76', rough=0.45)
M['port'] = S.principled_mat('port', '#0B0B0F', rough=0.4)
M['glass'] = S.glass_mat('ai_glass', rough=0.26)
M['core'] = S.emissive_mat('ai_core', '#2B3BFF', strength=0.0)
M['pk_pre'] = S.principled_mat('pk_pre', '#E8E8E3', rough=0.35, coat=0.3)
M['pk_b1'] = S.principled_mat('pk_b1', '#0B0B0F', rough=0.35, coat=0.3)
M['pk_b2'] = S.principled_mat('pk_b2', '#2B3BFF', rough=0.35, coat=0.3)
M['pk_b3'] = S.principled_mat('pk_b3', '#6B6B76', rough=0.35, coat=0.3)
M['cursor'] = S.principled_mat('cursor', '#0B0B0F', rough=0.3, coat=0.5)
M['check'] = S.emissive_mat('check', '#2B3BFF', strength=1.4)
M['panel_body'] = S.principled_mat('panel_body', '#F6F6F3', rough=0.35, coat=0.4)
M['panel_screen'] = S.screen_mat('panel_screen', ['monitor.png'], lit=0.7, rough=0.18)
M['live'] = S.emissive_mat('live', '#FF5A1F', 1.6)
M['live_halo'] = S.emissive_mat('live_halo', '#FF5A1F', 1.0)

# ───────────────────────── Escenario ─────────────────────────
S.studio_world()
S.studio_lights(target=(0, 0, 0.9))
S.shadow_floor()

# ───────────────────────── Tarjetas / nodos ─────────────────────────
CW, CH, CT, CR = 0.44, 0.30, 0.016, 0.03
NODE_POS = {
    'a1': (-1.36, 0.22, 1.52), 'a2': (-1.36, 0.22, 0.95), 'a3': (-1.36, 0.22, 0.38),
    'hub': (-0.58, 0.10, 0.95), 'router': (0.24, 0.0, 0.95),
    'b1': (1.14, -0.12, 1.52), 'b2': (1.14, -0.12, 0.95), 'b3': (1.14, -0.12, 0.38),
}
NODE_TILT = math.radians(78)
N_A, N_B = 13, 5  # tarjetas iniciales en cada pila (A: 0..12, B: 13..17)
CARD_NODE = {10: 'hub', 11: 'a1', 12: 'a2', 17: 'a3', 9: 'router', 16: 'b1', 8: 'b2', 15: 'b3'}  # el resto se desvanece
FLIGHT = {'hub': 18, 'a1': 19.5, 'a2': 21, 'a3': 22.5, 'router': 24, 'b1': 25.5, 'b2': 27, 'b3': 28.5}
FLIGHT_D = 11
TRAY_START = {'b2': 80, 'b1': 83, 'b3': 86}
TRAY_D = 11

cards = {}
for k in range(N_A + N_B):
    imgs = [f'doc_{k % 3}.png'] + ([f'node_{CARD_NODE[k]}.png'] if k in CARD_NODE else [])
    fm = S.screen_mat(f'face_{k}', imgs, lit=0.1, rough=0.4)
    bm_ = S.principled_mat(f'card_body_{k}', '#F6F6F3', rough=0.35, coat=0.4)
    root, body, face = S.card(f'card_{k}', CW, CH, CT, CR, bm_, fm, edge=0.004)
    cards[k] = dict(root=root, body=body, face=face, face_mat=fm, body_mat=bm_)
NODE_CARD = {v: k for k, v in CARD_NODE.items()}

# Pilas del capítulo 01
PA = Vector((-0.36, 0.0, 0.0)); PB = Vector((0.36, 0.0, 0.0))
CYCLE = 7


def pile_pose(pile, level, k):
    base = PA if pile == 'A' else PB
    jx = 0.012 * math.sin(k * 2.3); jy = 0.008 * math.cos(k * 1.7)
    rz = math.radians(3.5 * math.sin(k * 3.1))
    return base + Vector((jx, jy, CT / 2 + level * (CT + 0.0015))), (0.0, 0.0, rz)


def ch01_card(k, f):
    """Estado de la tarjeta k en el bucle del cursor (cap. 01)."""
    if k >= N_A:
        return pile_pose('B', k - N_A, k)
    c = N_A - 1 - k  # ciclo en el que el cursor mueve esta tarjeta (de arriba abajo)
    f0 = 1 + CYCLE * c
    if c > 2 or f < f0:
        return pile_pose('A', k, k)
    u = (f - f0) / CYCLE
    pa, ra = pile_pose('A', k, k); pb, rb = pile_pose('B', N_B + c, k)
    if u >= 1:
        return pb, rb
    m = S.ease_io(S.norm(u, 0.14, 0.86))
    pos = pa.lerp(pb, m) + Vector((0, 0, 0.13 * math.sin(math.pi * m)))
    return pos, (0.0, 0.0, S.lerp(ra[2], rb[2], m))


def card_pose(k, f):
    """Posición, rotación y progreso de morfado (0 doc → 1 nodo) de la tarjeta k."""
    if k not in CARD_NODE:
        p, r = ch01_card(k, f)
        return p, r, 0.0
    key = CARD_NODE[k]; s0 = FLIGHT[key]
    if f < s0:
        p, r = ch01_card(k, f)
        return p, r, 0.0
    tt = S.ease_io(S.norm(f, s0, s0 + FLIGHT_D))
    p0, r0 = ch01_card(k, s0); p1 = Vector(NODE_POS[key])
    pos = p0.lerp(p1, tt) + Vector((0, 0, 0.3 * math.sin(math.pi * tt)))
    rx = NODE_TILT * tt
    if key in TRAY_START:  # cap. 04: se tumba como bandeja
        rx *= 1 - S.ease_io(S.norm(f, TRAY_START[key], TRAY_START[key] + TRAY_D))
    return pos, (rx, 0.0, r0[2] * (1 - tt)), tt


def tray_flat(key, f):
    return S.ease_io(S.norm(f, TRAY_START[key], TRAY_START[key] + TRAY_D))


# Cursor (prisma fino de tinta, forma de puntero clásico)
PTR = [(0, 0), (0, -0.62), (0.15, -0.47), (0.25, -0.69), (0.33, -0.65), (0.23, -0.44), (0.42, -0.44)]
cursor = prism('cursor', [(x * 0.24, y * 0.24) for x, y in PTR], 0.012, M['cursor'])


def cursor_pose(f):
    c = int(min(max((f - 1) // CYCLE, 0), 2))
    f0 = 1 + CYCLE * c; u = (f - f0) / CYCLE
    k = N_A - 1 - c
    pa, _ = pile_pose('A', k, k); pb, _ = pile_pose('B', N_B + c, k)
    prev = pile_pose('B', N_B - 1 + c, k + 1)[0] if c > 0 else pb + Vector((0.12, -0.22, 0.2))
    hover = Vector((0.07, -0.05, CT / 2 + 0.03))
    if u < 0.14:
        w = S.ease_io(u / 0.14)
        return (prev + hover + Vector((0, 0, 0.04))).lerp(pa + hover, w)
    return ch01_card(k, f)[0] + hover


# ───────────────────────── Tubos, puertos y caminos ─────────────────────────
EDGES = [('a1', 'hub'), ('a2', 'hub'), ('a3', 'hub'), ('hub', 'router'), ('router', 'b1'), ('router', 'b2'), ('router', 'b3')]
TUBE_START = {e: 31 + i * 1.3 for i, e in enumerate(EDGES)}
TUBE_D = 6
PORT = CW / 2 + 0.004


def port_pos(key, side):
    x, y, z = NODE_POS[key]
    return Vector((x + (PORT if side == 'out' else -PORT), y, z))


paths = {}
tubes = {}
ports = {}
for e in EDGES:
    a, b = e
    paths[e] = Path(port_pos(a, 'out'), port_pos(b, 'in'), bend=0.5)
    tubes[e] = S.polyline(f'tube_{a}_{b}', [tuple(p) for p in paths[e].pts], M['tube'], thick=0.0075)
    for key, side in ((a, 'out'), (b, 'in')):
        if (key, side) not in ports:
            p = S.sphere(f'port_{key}_{side}', 0.016, M['port'], segs=24, rings=12)
            p.location = port_pos(key, side)
            ports[(key, side)] = p
through = Path(port_pos('router', 'in'), port_pos('router', 'out'), bend=0.0, n=8)
LANES = ['a1', 'a2', 'a3']; OUTS = ['b1', 'b2', 'b3']
chains = {(l, b): Chain([paths[(LANES[l], 'hub')], paths[('hub', 'router')], through, paths[('router', OUTS[b])]]) for l in range(3) for b in range(3)}
ROUTER_C = Vector(NODE_POS['router'])
S_CORE = {}
for key, ch in chains.items():  # s en el que el paquete pasa por el centro de la esfera
    best = min(range(201), key=lambda i: (ch.at(i / 200) - ROUTER_C).length)
    S_CORE[key] = best / 200

# ───────────────────────── Esfera IA ─────────────────────────
ai = S.empty('ai'); ai.location = ROUTER_C
AI_R = 0.27
ai_glass = S.sphere('ai_glass', AI_R, M['glass'], ai, segs=64, rings=32)
ai_core = S.sphere('ai_core', 0.09, M['core'], ai, segs=40, rings=20)

# ───────────────────────── Paquetes ─────────────────────────
PK_W, PK_H, PK_T = 0.1, 0.07, 0.012
SP, TT, P0 = 10, 30, 52  # espaciado por carril, duración del recorrido, primer frame
K_PK = 8
packets = []
for l in range(3):
    for k in range(K_PK):
        b = (l + k) % 3
        root = S.empty(f'pk_{l}_{k}')
        pre = S.rr_box(f'pk_{l}_{k}_pre', PK_W, PK_H, PK_T, 0.012, M['pk_pre'], root, edge=0.003)
        post = S.rr_box(f'pk_{l}_{k}_post', PK_W, PK_H, PK_T, 0.012, M[f'pk_{OUTS[b]}'], root, edge=0.003)
        root.rotation_euler = (NODE_TILT, 0, 0)
        packets.append(dict(l=l, k=k, b=b, f0=P0 + l * 3.3 + k * SP, root=root, pre=pre, post=post))

# Pilas de paquetes recibidos en las bandejas + marca de hecho
STACK_MAX = 6
stacks = {}
checks = {}
for j, key in enumerate(OUTS):
    x, y, z = NODE_POS[key]
    stacks[key] = []
    for n in range(STACK_MAX):
        o = S.rr_box(f'stack_{key}_{n}', PK_W, PK_H, PK_T, 0.012, M[f'pk_{key}'], edge=0.003)
        o.location = (x + 0.004 * math.sin(n * 2.4), y + 0.02 + 0.003 * math.cos(n * 1.9), z + CT / 2 + PK_T / 2 + 0.0008 + n * (PK_T + 0.0015))
        o.rotation_euler = (0, 0, math.radians(2.5 * math.sin(n * 2.1)))
        stacks[key].append(o)
    ck = S.polyline(f'check_{key}', [(-0.04, 0, 0.004), (-0.01, 0, -0.03), (0.05, 0, 0.045)], M['check'], thick=0.0085)
    ck.location = (x + 0.15, y - 0.02, z + 0.15)
    checks[key] = ck


def stack_pos(key, n):
    return Vector(stacks[key][n].location)


def arrivals(key, f):
    """Paquetes (ordenados por llegada) que han aterrizado en la bandeja `key` hasta el frame f."""
    j = OUTS.index(key)
    flat_at = TRAY_START[key] + TRAY_D
    out = sorted(p['f0'] + TT for p in packets if p['b'] == j and p['f0'] + TT >= flat_at and p['f0'] + TT <= f)
    return out


# ───────────────────────── Panel de monitorización ─────────────────────────
panel = S.empty('panel')
PW, PH, PT = 0.56, 0.40, 0.02
S.card('panel_card', PW, PH, PT, 0.04, M['panel_body'], M['panel_screen'], parent=panel, edge=0.004)
live = S.empty('live', panel); live.location = (PW / 2 - 0.062, PH / 2 - 0.062, PT / 2 + 0.006)
live_dot = S.sphere('live_dot', 0.014, M['live'], live, segs=24, rings=12)
live_halo = S.rr_plane('live_halo', 0.06, 0.06, 0.03, M['live_halo'], live, z=-0.004)
PANEL_POS = Vector((0.02, -0.36, 2.0))
PANEL_ROT = (math.radians(72), 0, math.radians(-4))

# ───────────────────────── Cámara ─────────────────────────
# (frame, (az°, el°, dist, tx, ty, tz, shift_y, lens))
CAM_KEYS = {
    'desktop': [
        (1, (4, 50, 3.5, 0.0, 0.05, 0.04, 0.22, 50)),
        (13, (6, 49, 3.45, 0.0, 0.05, 0.04, 0.215, 50)),
        (20, (6, 47, 3.55, 0.0, 0.05, 0.08, 0.2, 50)),
        (45, (-8, 18, 5.7, -0.05, 0.0, 0.98, 0.0, 50)),
        (49, (-8, 18, 5.7, -0.05, 0.0, 0.98, 0.0, 50)),
        (77, (6, 14, 5.6, 0.0, 0.0, 0.95, 0.0, 50)),
        (80, (6, 14, 5.6, 0.0, 0.0, 0.95, 0.0, 50)),
        (108, (-14, 28, 6.0, -0.08, 0.0, 1.18, 0.0, 50)),
        (120, (-15, 28, 6.0, -0.08, 0.0, 1.18, 0.0, 50)),
    ],
}
CAM_KEYS['mobile'] = S.mobile_keys(CAM_KEYS['desktop'], lens_k=1.0, shift_k=0.85)

# ───────────────────────── Coreografía ─────────────────────────

def pose(f):
    t = float(f)
    breathe = math.sin(t * 0.21)

    # ── Cursor (cap. 01) ──
    ca = 1 - S.seg(f, 15, 21)
    cp = cursor_pose(f) + Vector((0, 0, 0.08 * (1 - ca)))
    cursor.location = cp
    cursor.rotation_euler = (math.radians(-18), 0, math.radians(-8))
    S.set_alpha(M['cursor'], ca)
    hide(cursor, ca <= 0.001)

    # ── Tarjetas → nodos ──
    router_gone = S.seg(f, 50, 60)
    for k, c in cards.items():
        pos, rot, morph = card_pose(k, f)
        alpha = 1.0
        if k not in CARD_NODE:
            alpha = 1 - S.seg(f, 24 + (k % 5) * 1.2, 34 + (k % 5) * 1.2)
            pos = pos + Vector((0, 0, -0.03 * (1 - alpha)))
        key = CARD_NODE.get(k)
        if key == 'router':
            alpha = 1 - router_gone
            S.set_scale(c['root'], 1 - 0.6 * router_gone)
        if morph >= 1 and key not in TRAY_START and key != 'router':
            pos = pos + Vector((0, 0, 0.006 * math.sin(t * 0.21 + k)))
        c['root'].location = pos
        c['root'].rotation_euler = rot
        if key:
            S.set_mix(c['face_mat'], 1, S.ease_io(S.norm(f, FLIGHT[key] + 3, FLIGHT[key] + 8)))
        S.set_alpha(c['face_mat'], alpha); S.set_alpha(c['body_mat'], alpha)
        hide(c['root'], alpha <= 0.001)

    # ── Tubos y puertos (cap. 02) ──
    for e, tube in tubes.items():
        d = S.ease_io(S.norm(f, TUBE_START[e], TUBE_START[e] + TUBE_D))
        tube.data.bevel_factor_end = max(d, 0.002)
        hide(tube, d <= 0.002)
    for (key, side), p in ports.items():
        starts = [TUBE_START[e] for e in EDGES if (side == 'out' and e[0] == key) or (side == 'in' and e[1] == key)]
        s = S.ease_out(S.norm(f, min(starts) - 1, min(starts) + 3))
        if key == 'router':
            s *= 1 - router_gone
        S.set_scale(p, s)

    # ── Esfera IA (cap. 03) ──
    ai_s = S.ease_out(S.norm(f, 53, 66))
    S.set_scale(ai, ai_s)
    ai.location = ROUTER_C + Vector((0, 0, 0.006 * breathe * (ai_s >= 1)))
    hide(ai, ai_s <= 0.001)
    glow = ai_s * S.seg(f, 56, 68)
    flash = 0.0

    # ── Paquetes ──
    for p in packets:
        s = (t - p['f0']) / TT
        active = 0 <= s <= 1
        if not active:
            S.set_scale(p['root'], 0.0)
            continue
        ch = chains[(p['l'], p['b'])]
        sc = S_CORE[(p['l'], p['b'])]
        pos = ch.at(s)
        key = OUTS[p['b']]
        # salto final a la bandeja (si ya está tumbada)
        if s > 0.92 and tray_flat(key, f) > 0.5:
            before = [a for a in arrivals(key, 120) if a < p['f0'] + TT]
            n = len(before)
            if n < STACK_MAX:
                w = S.ease_io((s - 0.92) / 0.08) * tray_flat(key, f)
                pos = ch.at(0.92).lerp(stack_pos(key, n), w) + Vector((0, 0, 0.07 * math.sin(math.pi * w)))
        inside = abs(s - sc) < 0.028
        near = abs(s - sc) < 0.06
        if near:
            flash += 1 - abs(s - sc) / 0.06
        p['root'].location = pos
        S.set_scale(p['root'], 0.0 if inside else 1.0)
        pre = s < sc
        S.set_scale(p['pre'], 1.0 if pre else 0.0)
        S.set_scale(p['post'], 0.0 if pre else 1.0)
        # tumbado como la bandeja al aterrizar
        if s > 0.92:
            p['root'].rotation_euler = (NODE_TILT * (1 - S.ease_io((s - 0.92) / 0.08) * tray_flat(key, f)), 0, 0)
        else:
            p['root'].rotation_euler = (NODE_TILT, 0, 0)
    S.set_emit(M['core'], 0.6 * ai_s + glow * (1.6 + 0.4 * math.sin(t * 0.5)) + 1.8 * min(flash, 1.0) * glow)

    # ── Bandejas, pilas y marcas (cap. 04) ──
    for key in OUTS:
        arr = arrivals(key, f)
        n = min(len(arr), STACK_MAX)
        for i, o in enumerate(stacks[key]):
            S.set_scale(o, 1.0 if i < n else 0.0)
        ck = checks[key]
        cs = S.ease_out(S.norm(f, arr[0] + 1, arr[0] + 7)) if arr else 0.0
        S.set_scale(ck, cs)
        hide(ck, cs <= 0.001)
        if cs > 0:
            x, y, z = NODE_POS[key]
            ck.location = (x + 0.15, y - 0.02, z + 0.14 + 0.01 * math.sin(t * 0.3 + OUTS.index(key)))

    # ── Panel de monitorización ──
    ps = S.ease_out(S.norm(f, 94, 106))
    S.set_scale(panel, ps)
    panel.location = PANEL_POS + Vector((0, 0, 0.1 * (1 - ps) + 0.006 * breathe))
    panel.rotation_euler = PANEL_ROT
    hide(panel, ps <= 0.001)
    pulse = 0.5 + 0.5 * math.sin(t * 0.55)
    live_on = S.seg(f, 104, 110)
    S.set_scale(live_dot, live_on * (1 + 0.2 * pulse))
    S.set_scale(live_halo, live_on * (1 + 1.0 * pulse))
    S.set_alpha(M['live_halo'], 0.28 * (1 - pulse) * live_on)


# ───────────────────────── Sonda de posiciones (--probe 1): % de lienzo de piezas clave ─────────────────────────
if S.arg('probe'):
    from bpy_extras.object_utils import world_to_camera_view as w2c
    PROBE = {
        13: {'pila_A': lambda: PA + Vector((0, 0, 0.2)), 'pila_B': lambda: PB + Vector((0, 0, 0.12)), 'cursor': lambda: Vector(cursor.location)},
        47: {'a1': lambda: Vector(NODE_POS['a1']), 'a3': lambda: Vector(NODE_POS['a3']), 'hub': lambda: Vector(NODE_POS['hub']), 'router': lambda: Vector(NODE_POS['router']), 'b1': lambda: Vector(NODE_POS['b1']), 'b3': lambda: Vector(NODE_POS['b3'])},
        79: {'esfera': lambda: ROUTER_C.copy(), 'esfera_top': lambda: ROUTER_C + Vector((0, 0, AI_R)), 'hub': lambda: Vector(NODE_POS['hub']), 'a1': lambda: Vector(NODE_POS['a1']), 'b1': lambda: Vector(NODE_POS['b1']), 'b3': lambda: Vector(NODE_POS['b3'])},
        120: {'panel': lambda: PANEL_POS.copy(), 'esfera': lambda: ROUTER_C.copy(), 'hub': lambda: Vector(NODE_POS['hub']), 'a1': lambda: Vector(NODE_POS['a1']), 'a3': lambda: Vector(NODE_POS['a3']), 'b1': lambda: Vector(NODE_POS['b1']), 'b3': lambda: Vector(NODE_POS['b3']), 'check_b1': lambda: Vector(checks['b1'].location), 'check_b3': lambda: Vector(checks['b3'].location)},
    }
    for prof in ('desktop', 'mobile'):
        cam = S.make_camera(prof, 1.0)
        keys = CAM_KEYS[prof]
        for f, pts in PROBE.items():
            S.scene.frame_set(f); pose(f); S.pose_camera(keys, f)
            bpy.context.view_layer.update()
            out = []
            for name, fn in pts.items():
                v = w2c(S.scene, cam, fn())
                out.append(f'{name}=({100 * v.x:.0f},{100 * (1 - v.y):.0f})')
            print(f'[probe] {prof} f{f}: ' + ' '.join(out), flush=True)
        bpy.data.objects.remove(cam, do_unlink=True)

S.run(A, pose, CAM_KEYS, label='automatizacion-ia')

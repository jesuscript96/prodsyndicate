"""
Escena «Una pieza que encaja» — scroll storytelling de la página «Software a medida» (§8.3.2).

Guion (120 frames, misma partitura que la home):
  01 Análisis  (1–15)    herramientas sueltas (hoja de cálculo, sobre, documentos, ventanas de app,
                         mensajes, carpeta, nota) flotando inclinadas en la mitad inferior.
  02 Flujos    (15–49)   se alinean sobre un plano técnico como diagrama de flujo (vista iso), las
                         líneas se dibujan y en el centro se abre un hueco con forma de pieza.
  03 A medida  (49–80)   una pieza con borde ultramar desciende y encaja en el hueco; los objetos se
                         recogen sobre ella como módulos y tres conectores (integraciones) se acoplan.
  04 En uso    (80–120)  la pieza se levanta, sus pestañas se recogen y se convierte en la pantalla de
                         un monitor con un panel de gestión; tres insignias de rol se conectan.

Uso (desde la raíz del proyecto):
    node scripts/hero/textures/software-a-medida.mjs
    blender -b --factory-startup --python scripts/hero/scenes/software-a-medida.py -- \
        --cam desktop|mobile --frames all|1,13,47|1-120 [--out assets/frames_src/software-a-medida] \
        [--samples 48] [--scale 1.0]
"""
import os, sys; sys.path.insert(0, os.path.join(os.getcwd(), 'scripts/hero')); import studio as S
import bpy, bmesh, math
from mathutils import Vector, Matrix, Euler

A = S.parse_args(default_frames=120, default_out='assets/frames_src/software-a-medida')
S.reset_scene(A.n)
S.set_texture_dir('assets/hero/textures/software-a-medida')

seg, ease_io, ease_out, lerp, clamp, norm = S.seg, S.ease_io, S.ease_out, S.lerp, S.clamp, S.norm
rad = math.radians

# ───────────────────────── Helpers propios ─────────────────────────

def knob_local(knob_r, neck_w, neck_len, base=0.0, arc_n=18):
    """Perfil de una pestaña de puzle en el marco (s, n): s a lo largo del lado, n hacia fuera.
    Empieza en (-neck_w, -base) y acaba en (neck_w, -base)."""
    d = neck_len + math.sqrt(knob_r ** 2 - neck_w ** 2)
    a0 = math.atan2(neck_len - d, -neck_w) + 2 * math.pi
    a1 = math.atan2(neck_len - d, neck_w)
    pts = [(-neck_w, -base), (-neck_w, neck_len)]
    for k in range(arc_n + 1):
        a = a0 + (a1 - a0) * k / arc_n
        pts.append((knob_r * math.cos(a), d + knob_r * math.sin(a)))
    pts += [(neck_w, neck_len), (neck_w, -base)]
    return pts


def puzzle_points(w, h, r, knob_r, neck_w, neck_len, sides=(1, 1, 0, 0), seg_n=10):
    """Contorno de pieza de puzle (CCW). sides = (arriba, izquierda, abajo, derecha): 1 pestaña, 0 nada."""
    corners = [((w / 2 - r, h / 2 - r), 0), ((-w / 2 + r, h / 2 - r), 90), ((-w / 2 + r, -h / 2 + r), 180), ((w / 2 - r, -h / 2 + r), 270)]
    frames = [((-1, 0), (0, 1)), ((0, -1), (-1, 0)), ((1, 0), (0, -1)), ((0, 1), (1, 0))]
    centers = [(0, h / 2), (-w / 2, 0), (0, -h / 2), (w / 2, 0)]
    pts = []
    for i, ((cx, cy), a0) in enumerate(corners):
        for k in range(seg_n + 1):
            a = rad(a0 + 90 * k / seg_n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        if sides[i]:
            (dx, dy), (nx, ny) = frames[i]
            ccx, ccy = centers[i]
            for s_, n_ in knob_local(knob_r, neck_w, neck_len):
                pts.append((ccx + s_ * dx + n_ * nx, ccy + s_ * dy + n_ * ny))
    return pts


def profile_box(name, pts, t, mat, parent=None, edge=0.005):
    """Prisma de grosor t (caras ±Z) con un contorno 2D cualquiera; UV por caja envolvente."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    top = [bm.verts.new((x, y, t / 2)) for x, y in pts]
    bot = [bm.verts.new((x, y, -t / 2)) for x, y in pts]
    ftop = bm.faces.new(top); fbot = bm.faces.new(list(reversed(bot)))
    n = len(pts)
    sides = [bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i])) for i in range(n)]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    uv = bm.loops.layers.uv.new()
    for f in [ftop, fbot] + sides:
        for lp in f.loops:
            x, y, _ = lp.vert.co
            lp[uv].uv = ((x - x0) / (x1 - x0), (y - y0) / (y1 - y0))
    for f in sides:
        f.smooth = True
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = S.link(bpy.data.objects.new(name, me), parent)
    me.materials.append(mat)
    if edge > 0:
        bv = o.modifiers.new('bevel', 'BEVEL')
        bv.width = min(edge, t * 0.45); bv.segments = 3; bv.limit_method = 'ANGLE'
        bv.angle_limit = rad(40); bv.harden_normals = True
    return o


def xform(loc, rot_deg=(0, 0, 0), scale=1.0):
    s = max(scale, 1e-4)
    return Matrix.Translation(Vector(loc)) @ Euler(tuple(rad(a) for a in rot_deg), 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((s, s, s, 1.0))


def tube_draw(o, start=0.0, end=1.0):
    o.data.bevel_factor_start = clamp(start); o.data.bevel_factor_end = clamp(end)
    o.hide_render = end - start <= 0.002


def alpha_hide(mat, o, a):
    S.set_alpha(mat, a); S.set_hidden(o, a <= 0.001)

# ───────────────────────── Materiales ─────────────────────────

M = {}
M['card'] = S.principled_mat('card_body', '#F4F4F1', rough=0.38, coat=0.35)
M['board'] = S.screen_mat('board', ['board.png'], lit=0.0, rough=0.85)
M['piece'] = S.principled_mat('piece_body', '#F8F8F5', rough=0.3, coat=0.5)
M['face'] = S.screen_mat('piece_face', ['piece_face.png', 'dashboard.png'], lit=0.12, rough=0.3)
M['rim'] = S.emissive_mat('rim', '#2B3BFF', strength=0.0)
M['hole_rim'] = S.emissive_mat('hole_rim', '#2B3BFF', strength=0.0)
M['line'] = S.principled_mat('line', '#6B6B76', rough=0.5)
M['plug'] = S.principled_mat('plug', '#0B0B0F', rough=0.35, coat=0.5)
M['plug_dot'] = S.emissive_mat('plug_dot', '#2B3BFF', strength=2.5)
M['pin'] = S.principled_mat('pin', '#C9C9CF', rough=0.3, metal=0.9)
M['badge'] = S.principled_mat('badge', '#FFFFFF', rough=0.3, coat=0.5)
M['ring'] = S.emissive_mat('ring', '#2B3BFF', strength=1.2)
M['pill_a'] = S.principled_mat('pill_a', '#2B3BFF', rough=0.4)
M['pill_b'] = S.principled_mat('pill_b', '#6B6B76', rough=0.4)
M['pill_c'] = S.principled_mat('pill_c', '#E8E8E3', rough=0.5)
M['screen'] = S.screen_mat('screen', ['dashboard.png'], lit=0.97, rough=0.15)
M['live'] = S.emissive_mat('live', '#FF5A1F', strength=1.6)
M['live_halo'] = S.emissive_mat('live_halo', '#FF5A1F', strength=1.0)
M['link'] = S.principled_mat('link', '#6B6B76', rough=0.5)

# ───────────────────────── Dimensiones ─────────────────────────

BOARD_W, BOARD_H, BOARD_T = 2.0, 1.5, 0.03
NODE_S = 0.8                         # las herramientas se reducen al convertirse en nodos del mapa
BOARD_TOP = BOARD_T
PIECE_W, PIECE_H, PIECE_T, PIECE_R = 0.88, 0.565, 0.06, 0.05
FACE_W, FACE_H = 0.84, 0.525
KNOB_R, NECK_W, NECK_L = 0.09, 0.055, 0.03
KNOB_EXT = NECK_L + math.sqrt(KNOB_R ** 2 - NECK_W ** 2) + KNOB_R
CARD_T = 0.012
MON_Z = 1.06
PIECE_S_END = 1.9 / FACE_W           # la cara de la pieza pasa a medir lo que la pantalla del monitor
PIECE_Y_END = -0.0205 + (PIECE_T + 0.0008) * PIECE_S_END
# ranuras de módulos en la cara (coinciden con las tarjetas del panel; ver textures/software-a-medida.mjs)
SLOT_X = [(x - 420) / 1000 for x in (218, 391, 564, 737)]
SLOT_Y = [(262.5 - y) / 1000 for y in (150, 330)]
SLOTS = [(x, y) for y in SLOT_Y for x in SLOT_X]

# ───────────────────────── Escenario ─────────────────────────

S.studio_world()
S.studio_lights(target=(0, 0, 0.45))
S.shadow_floor()

# Plano técnico con el hueco (booleano con un cortador invisible)
board = S.rr_box('board', BOARD_W, BOARD_H, BOARD_T, 0.08, M['board'], edge=0.006)
board.location.z = BOARD_T / 2
HOLE_PTS = puzzle_points(PIECE_W, PIECE_H, PIECE_R, KNOB_R, NECK_W, NECK_L, sides=(1, 1, 0, 0))
cutter = profile_box('cutter', HOLE_PTS, 0.4, M['piece'], edge=0)
cutter.location.z = BOARD_T / 2
cutter.hide_render = True; cutter.display_type = 'WIRE'
hole_mod = board.modifiers.new('hole', 'BOOLEAN')
hole_mod.operation = 'DIFFERENCE'; hole_mod.object = cutter; hole_mod.solver = 'EXACT'
board.modifiers.move(1, 0)
hole_rim = S.polyline('hole_rim', [(x, y, BOARD_TOP) for x, y in HOLE_PTS], M['hole_rim'], None, 0.004, cyclic=True)
hole_rim.data.bevel_factor_mapping_end = 'SPLINE'; hole_rim.data.bevel_factor_mapping_start = 'SPLINE'

# Tarjetas (herramientas sueltas → nodos del flujo → módulos)
class Card:
    pass

CARD_SPECS = [
    # key, w, h, textura, lit, pose caos (loc, rot°), posición en el flujo
    ('sheet',  0.56, 0.40, 'sheet.png',  0.10, ((-0.80, 0.30, 0.40), (18, -8, 22)),   (-0.72, -0.52)),
    ('email',  0.46, 0.31, 'email.png',  0.10, ((0.62, -0.50, 0.26), (-12, 15, -30)), (-0.77, -0.065)),
    ('docs',   0.36, 0.46, 'doc.png',    0.10, ((0.20, 0.55, 0.16), (8, 4, 14)),      (-0.80, 0.46)),
    ('appA',   0.60, 0.42, 'appA.png',   0.55, ((-0.12, -0.25, 0.60), (22, -14, -9)), (0.74, 0.30)),
    ('appB',   0.48, 0.36, 'appB.png',   0.55, ((0.85, 0.40, 0.52), (-10, 20, 35)),   (0.73, -0.38)),
    ('chat',   0.40, 0.28, 'chat.png',   0.25, ((-0.95, -0.62, 0.14), (14, 10, -20)), (-0.30, 0.62)),
    ('folder', 0.42, 0.32, 'folder.png', 0.10, ((0.35, 0.0, 0.06), (3, -2, 8)),       (0.41, 0.57)),
    ('postit', 0.24, 0.24, 'postit.png', 0.10, ((-0.42, 0.85, 0.32), (-25, 8, 40)),   (-0.18, -0.57)),
]
SLOT_OF = {'appA': 0, 'sheet': 1, 'appB': 2, 'docs': 3, 'email': 4, 'chat': 5, 'folder': 6, 'postit': 7}
CARDS = []
for key, w, h, tex, lit, (cloc, crot), flow in CARD_SPECS:
    c = Card(); c.key, c.w, c.h = key, w, h
    c.face_mat = S.screen_mat(f'face_{key}', [tex], lit=lit, rough=0.55)
    c.root = S.empty(f'card_{key}')
    if key == 'docs':  # pila de tres documentos ligeramente abanicados
        for k in range(3):
            r, body, face = S.card(f'{key}_{k}', w, h, CARD_T, 0.02, M['card'], c.face_mat, c.root, edge=0.004)
            r.location = (0.018 * k, -0.012 * k, (CARD_T + 0.003) * k); r.rotation_euler.z = rad(-3 + 3 * k)
    else:
        S.card(key, w, h, CARD_T, 0.022 if key != 'postit' else 0.008, M['card'], c.face_mat, c.root, edge=0.004)
    c.chaos_loc, c.chaos_rot, c.flow = Vector(cloc), Vector(crot), flow
    c.slot = SLOTS[SLOT_OF[key]]
    c.slot_scale = min(0.155 / w, 0.095 / h)
    CARDS.append(c)

# Líneas del flujo (sobre el plano). dir=+1 se dibuja hacia el hueco y se recoge desde el nodo; -1 al revés.
LINE_SPECS = [
    ((-0.66, 0.44), (-0.46, 0.20), 'x', +1),
    ((-0.59, -0.10), (-0.46, -0.16), 'x', +1),
    ((-0.52, -0.40), (-0.44, -0.25), 'y', +1),
    ((-0.30, 0.50), (-0.24, 0.30), 'y', +1),
    ((-0.18, -0.47), (-0.14, -0.30), 'y', +1),
    ((0.46, 0.14), (0.50, 0.28), 'x', -1),
    ((0.46, -0.17), (0.54, -0.38), 'x', -1),
    ((0.30, 0.30), (0.41, 0.45), 'y', -1),
]
LINES = []
for i, (p0, p1, ax, d) in enumerate(LINE_SPECS):
    z = BOARD_TOP + 0.004
    o = S.bezier_tube(f'flow_{i}', (p0[0], p0[1], z), (p1[0], p1[1], z), M['line'], None, 0.006, bend=0.42, axis=ax)
    o.data.bevel_factor_mapping_end = 'SPLINE'; o.data.bevel_factor_mapping_start = 'SPLINE'
    LINES.append((o, d))

# La pieza a medida: cuerpo + dos pestañas (arriba e izquierda) + cara + borde ultramar
piece = S.empty('piece')
p_body = S.rr_box('piece_body', PIECE_W, PIECE_H, PIECE_T, PIECE_R, M['piece'], piece, edge=0.006)
p_body.location.z = PIECE_T / 2
p_face = S.rr_plane('piece_face', FACE_W, FACE_H, 0.03, M['face'], piece, z=PIECE_T + 0.0008)
p_rim = S.rr_outline('piece_rim', PIECE_W + 0.002, PIECE_H + 0.002, PIECE_R + 0.001, M['rim'], piece, thick=0.0035)
p_rim.location.z = PIECE_T - 0.004
KNOBS = []
for name, loc, rz in (('knob_top', (0, PIECE_H / 2, 0), 0), ('knob_left', (-PIECE_W / 2, 0, 0), 90)):
    k = S.empty(name, piece); k.location = loc; k.rotation_euler.z = rad(rz)
    kb = profile_box(f'{name}_body', knob_local(KNOB_R, NECK_W, NECK_L, base=0.04), PIECE_T, M['piece'], k, edge=0.006)
    kb.location.z = PIECE_T / 2
    kr = S.polyline(f'{name}_rim', [(x, y, PIECE_T - 0.004) for x, y in knob_local(KNOB_R, NECK_W, NECK_L, base=-0.004)], M['rim'], k, 0.0035)
    KNOBS.append(k)
live = S.empty('live', piece); live.location = (0.463 * FACE_W, 0.424 * FACE_H, PIECE_T + 0.006)
live_dot = S.sphere('live_dot', 0.008, M['live'], live, segs=24, rings=12)
live_halo = S.rr_plane('live_halo', 0.034, 0.034, 0.017, M['live_halo'], live, z=-0.004)

# Conectores (integraciones): caja de tinta con pin metálico y punto ultramar
PLUG_SPECS = [  # (acople en coords de la pieza, punto de partida, rotación de llegada)
    ((-0.21, -PIECE_H / 2 - 0.075, 0.0), (-0.55, -1.0, 0.45), 0),
    ((0.21, -PIECE_H / 2 - 0.075, 0.0), (0.45, -1.05, 0.40), 0),
    ((PIECE_W / 2 + 0.075, 0.0, 0.0), (1.3, -0.1, 0.42), 90),
]
PLUGS = []
for i, (dock, start, rz) in enumerate(PLUG_SPECS):
    r = S.empty(f'plug_{i}')
    b = S.rr_box(f'plug_{i}_body', 0.11, 0.09, 0.05, 0.016, M['plug'], r, edge=0.005); b.location.z = 0.025
    pin = S.cylinder(f'plug_{i}_pin', 0.009, 0.05, M['pin'], r, verts=16)
    pin.rotation_euler.x = rad(-90); pin.location = (0, 0.04, 0.025)
    pin2 = S.cylinder(f'plug_{i}_pin2', 0.009, 0.05, M['pin'], r, verts=16)
    pin2.rotation_euler.x = rad(-90); pin2.location = (0.028, 0.04, 0.025)
    pin.location.x = -0.028
    d = S.sphere(f'plug_{i}_dot', 0.009, M['plug_dot'], r, segs=20, rings=10); d.location = (0, -0.012, 0.052)
    PLUGS.append((r, Vector(dock), Vector(start), rz))

# Monitor (su pantalla propia va oculta: la cara de la pieza hace de pantalla)
mon = S.build_monitor('monitor', M['screen'])
mon['root'].location = (0, 0, MON_Z)
mon['screen'].hide_render = True
DEV = S.device_mats()

# Insignias de rol (disco + anillo ultramar + avatar) con su píldora de permiso y su enlace al monitor
BADGE_SPECS = [
    ((-1.30, -0.10, 1.44), 'role_a.png', 'pill_a', (-0.985, 0.0, 1.32)),
    ((-1.36, -0.10, 0.74), 'role_b.png', 'pill_b', (-0.985, 0.0, 0.84)),
    ((1.28, -0.10, 1.10), 'role_c.png', 'pill_c', (0.985, 0.0, 1.05)),
]
BADGES = []
for i, (pos, tex, pill, anchor) in enumerate(BADGE_SPECS):
    r = S.empty(f'badge_{i}'); r.location = pos; r.rotation_euler.x = rad(90)
    S.cylinder(f'badge_{i}_disc', 0.125, 0.03, M['badge'], r, verts=48, z0=-0.015)
    S.torus(f'badge_{i}_ring', 0.128, 0.007, M['ring'], r, segs=72, rings=12)
    fm = S.screen_mat(f'badge_{i}_face', [tex], lit=0.25, rough=0.5)
    S.rr_plane(f'badge_{i}_face', 0.22, 0.22, 0.11, fm, r, z=0.0158)
    p = S.rr_box(f'badge_{i}_pill', 0.15, 0.04, 0.012, 0.02, M[pill], r, edge=0.003); p.location = (0, -0.185, 0.0)
    e = Vector(pos); sgn = -1 if pos[0] > 0 else 1
    ln = S.bezier_tube(f'badge_{i}_link', (e.x + 0.135 * sgn, e.y + 0.04, e.z), anchor, M['link'], None, 0.004, bend=0.4, axis='x')
    ln.data.bevel_factor_mapping_end = 'SPLINE'
    BADGES.append((r, ln, fm))

# ───────────────────────── Coreografía ─────────────────────────

def piece_matrix(f):
    """Estado de la pieza: descenso y encaje (49–64), elevación + giro hacia la cámara + escala (80–102)."""
    d = seg(f, 49, 64)
    tilt = 1 - seg(f, 49, 60)
    loc = Vector((0.0, 0.0, lerp(1.2, 0.0, d)))
    rot = Vector((-7 * tilt, 5 * tilt, 4 * tilt))
    u = seg(f, 80, 96)
    loc = loc.lerp(Vector((0.0, PIECE_Y_END, MON_Z)), u)
    rot = rot.lerp(Vector((90.0, 0.0, 0.0)), seg(f, 82, 97))
    s = lerp(1.0, PIECE_S_END, seg(f, 88, 102))
    return xform(loc, tuple(rot), s), s


def pose(f):
    t = float(f)
    pm, ps = piece_matrix(f)
    piece.matrix_world = pm

    # ── Plano técnico, hueco y líneas (cap. 02) ──
    b_a = seg(f, 15, 24) * (1 - seg(f, 80, 87))
    alpha_hide(M['board'], board, b_a)
    bs = lerp(0.9, 1.0, seg(f, 15, 27))
    board.scale = (bs, bs, 1.0)
    hole_mod.show_render = f >= 34
    hs = lerp(0.1, 1.0, seg(f, 34, 44))
    cutter.scale = (hs * 1.012, hs * 1.012, 1.0)
    hole_rim.scale = (hs * 1.012, hs * 1.012, 1.0)
    hr_a = b_a * (1 - seg(f, 60, 64))
    alpha_hide(M['hole_rim'], hole_rim, hr_a)
    tube_draw(hole_rim, 0.0, seg(f, 35, 45, ease_out))
    S.set_emit(M['hole_rim'], 2.2 + 0.6 * math.sin(t * 0.5))
    hole_rim.hide_render = hole_rim.hide_render or hr_a <= 0.001
    S.set_alpha(M['line'], b_a)
    for i, (o, d) in enumerate(LINES):
        draw = seg(f, 26 + i * 1.2, 35 + i * 1.2, ease_out)
        pull = seg(f, 63 + i * 0.5, 70 + i * 0.5)
        if d > 0:
            tube_draw(o, pull, draw)
        else:
            tube_draw(o, 0.0, draw * (1 - pull))
        o.hide_render = o.hide_render or b_a <= 0.001

    # ── Tarjetas: caos → flujo → módulos sobre la pieza ──
    for i, c in enumerate(CARDS):
        bob = 0.018 * math.sin(t * 0.17 + i * 1.3)
        wob = 1.6 * math.sin(t * 0.13 + i * 0.7)
        loc = c.chaos_loc + Vector((0, 0, bob))
        rot = c.chaos_rot + Vector((wob, -wob * 0.6, 0))
        a = seg(f, 16 + i * 1.3, 38 + i * 0.9)
        loc = loc.lerp(Vector((c.flow[0], c.flow[1], BOARD_TOP + 0.045 + 0.006 * math.sin(t * 0.19 + i))), a)
        loc.z += 0.10 * math.sin(math.pi * a)
        rot = rot.lerp(Vector((0, 0, 0)), a)
        sc = lerp(1.0, NODE_S, a)
        slot = Vector((c.slot[0], c.slot[1], PIECE_T + 0.0008 + CARD_T / 2 * c.slot_scale + (0.004 if c.key == 'docs' else 0)))
        g = seg(f, 64 + i * 0.7, 73 + i * 0.4)
        if g > 0:
            loc = loc.lerp(slot, g); loc.z += 0.14 * math.sin(math.pi * g)
            sc = lerp(sc, c.slot_scale, g)
        mat = xform(loc, tuple(rot), sc)
        if f >= 76:
            mat = pm @ xform(slot, (0, 0, 0), c.slot_scale)
        c.root.matrix_world = mat
        ca = 1 - seg(f, 95, 103)
        S.set_alpha(c.face_mat, ca)
        S.set_hidden(c.root, ca <= 0.001)
    S.set_alpha(M['card'], 1 - seg(f, 95, 103))

    # ── Pieza ──
    p_on = f >= 48
    p_in = seg(f, 48, 52)
    pa = p_in * (1 - seg(f, 97, 105)) if p_on else 0.0
    S.set_alpha(M['piece'], pa)
    body_hidden = (not p_on) or pa <= 0.001
    p_body.hide_render = body_hidden
    for k in KNOBS:
        S.set_hidden(k, body_hidden)
    S.set_alpha(M['face'], p_in if p_on else 0.0)
    p_face.hide_render = not p_on
    ra = pa * (1 - seg(f, 99, 106))
    S.set_alpha(M['rim'], ra)
    p_rim.hide_render = (not p_on) or ra <= 0.001
    lock = seg(f, 63.5, 65, ease_out)
    S.set_emit(M['rim'], lerp(4.5, 2.0, seg(f, 65, 72)) * lock)
    S.set_mix(M['face'], 1, seg(f, 93, 103))
    S.set_lit(M['face'], lerp(0.12, 0.97, seg(f, 95, 105)))
    kr = seg(f, 84, 94)
    for k in KNOBS:
        k.scale = (1.0, lerp(1.0, 0.0001, kr), 1.0)

    # ── Conectores (integraciones) ──
    for i, (r, dock, start, rz) in enumerate(PLUGS):
        ap = ease_out(norm(f, 64 + i * 2, 68 + i * 2))
        m = seg(f, 65 + i * 2, 73 + i * 2)
        loc = start.lerp(dock, m); loc.z += 0.12 * math.sin(math.pi * m)
        rot = (10 * (1 - m), 0, rz + 22 * (1 - m))
        mat = xform(loc, rot, ap)
        if f >= 80:
            w = seg(f, 82, 92)
            inner = dock.lerp(Vector((0, 0, PIECE_T / 2)), w)
            mat = pm @ xform(inner, (0, 0, rz), 1 - w)
            ap = 1 - w
        r.matrix_world = mat
        S.set_hidden(r, ap <= 0.001)

    # ── Monitor ──
    ma = seg(f, 95, 103)
    for k in ('alu', 'alu_dark', 'black_glass'):
        S.set_alpha(DEV[k], ma)
    S.set_hidden(mon['root'], ma <= 0.001)
    mon['screen'].hide_render = True

    # ── Insignias de rol ──
    for i, (r, ln, fm) in enumerate(BADGES):
        bsc = ease_out(norm(f, 98 + i * 2, 104 + i * 2))
        S.set_scale(r, bsc)
        S.set_hidden(r, bsc <= 0.001)
        tube_draw(ln, 0.0, seg(f, 100 + i * 1.5, 105 + i * 1.5, ease_out))
    # ── Punto "live" ──
    pulse = 0.5 + 0.5 * math.sin(t * 0.55)
    lv = ease_out(norm(f, 108, 114))
    S.set_scale(live, lv * (1 + 0.25 * pulse))
    live_halo.scale = (max(lv * (1 + 1.0 * pulse), 1e-4),) * 3
    S.set_alpha(M['live_halo'], 0.28 * (1 - pulse) * lv)
    S.set_hidden(live, lv <= 0.001)


# (frame, (az°, el°, dist, tx, ty, tz, shift_y, lens))
CAM_KEYS = {
    'desktop': [
        (1,   (9, 44, 5.2, 0.0, 0.0, 0.26, 0.175, 50)),
        (11,  (8, 44, 5.15, 0.0, 0.0, 0.26, 0.17, 50)),
        (15,  (7, 44, 5.15, 0.0, 0.0, 0.26, 0.17, 50)),
        (45,  (-30, 42, 5.2, 0.0, 0.0, 0.06, 0.0, 50)),
        (49,  (-31, 42, 5.2, 0.0, 0.0, 0.06, 0.0, 50)),
        (64,  (-24, 41, 4.6, 0.0, 0.0, 0.1, 0.0, 50)),
        (77,  (-18, 42, 4.6, 0.0, 0.0, 0.1, 0.0, 50)),
        (80,  (-17, 42, 4.6, 0.0, 0.0, 0.1, 0.0, 50)),
        (108, (-6, 11, 6.3, 0.08, 0.0, 0.98, 0.0, 50)),
        (120, (-5, 10, 6.3, 0.08, 0.0, 0.98, 0.0, 50)),
    ],
}
CAM_KEYS['mobile'] = S.mobile_keys(CAM_KEYS['desktop'], lens_k=1.05, shift_k=0.95, dist_k=1.12)

S.run(A, pose, CAM_KEYS, label='software-a-medida')

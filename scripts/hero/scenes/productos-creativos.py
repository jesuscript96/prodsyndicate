"""
Escena «Punto de vista» — página de servicio «Productos creativos e interactivos» (§8.3.4).

Una anamorfosis tipográfica: un «&» en la serif cursiva de la web (Instrument Serif Italic) se
dibuja a lápiz, se recorta en piezas que se levantan del papel con su material, y la cámara
recorre la escultura hasta el único punto de vista desde el que todas encajan.

Cada pieza i se aleja o se acerca a lo largo de su rayo desde ese punto P y se escala por el
mismo factor k_i (homotecia de centro P): vista desde P su proyección no cambia; desde cualquier
otro punto, las piezas aparecen dispersas en profundidad. Su sombra nunca forma el «&».

Guion (N = 120, partitura común):
  01 Boceto (reposo 11–15)          hoja con el «&» a lápiz, líneas guía y el lápiz.
  02 Piezas (reposo 45–49)          el boceto se recorta: las piezas se levantan, ganan grosor y material.
  03 Movimiento (reposo 77–80)      la cámara rodea la escultura; las piezas giran sobre sí mismas.
  04 Punto de vista (104–120)       la cámara llega a P, los giros se deshacen y el «&» encaja.

Modos (desde la raíz del proyecto):
  blender -b --factory-startup --python scripts/hero/scenes/productos-creativos.py -- \
      [--mode story] --cam desktop|mobile --frames all|1,47,120 [--samples 48] [--scale 1.0]
  ... -- --mode grid [--samples 32]      rejilla de puntos de vista alrededor de P (demo «Pruébalo»)
                                         → assets/frames_src/productos-creativos/grid/r<fila>_c<col>.png
  ... -- --mode frag --frag <i>          una pieza aislada girando (48 frames) para las secciones
                                         → assets/props_src/frag-<i>/NNNN.png + meta.json
  ... -- --mode pieces                   lista las piezas (índice, material, tamaño)
"""
import os, sys, math, json, time
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts/hero'))
import studio as S
import bpy, bmesh
from mathutils import Vector, Matrix, Quaternion

MODE = S.arg('mode', 'story')
A = S.parse_args(default_frames=120, default_out='assets/frames_src/productos-creativos')
S.reset_scene(A.n)

seg, ease_io, ease_out, lerp, norm, clamp = S.seg, S.ease_io, S.ease_out, S.lerp, S.norm, S.clamp
rad = math.radians
FONT = os.path.join(os.getcwd(), 'scripts/hero/fonts/InstrumentSerif-Italic.woff2')

# ───────────────────────── Punto de vista final ─────────────────────────
# (az°, el°, dist, tx, ty, tz, shift_y, lens). P = posición de la cámara = centro de la homotecia.
FINAL = (0.0, 8.0, 4.6, 0.0, 0.0, 1.15, -0.02, 62.0)  # focal larga: la hoja queda por debajo del CTA final
ALIGN_AT = 104  # desde este frame la cámara está exactamente en P y el «&» encaja


def cam_loc(az, el, dist, tx, ty, tz):
    a, e = rad(az), rad(el)
    return Vector((tx, ty, tz)) + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * dist


G = Vector(FINAL[3:6])
P = cam_loc(*FINAL[:6])

# ───────────────────────── Materiales ─────────────────────────

PAPER = dict(color='#F7F6F2', rough=0.92, transmission=0.0, coat=0.0)
LOOKS = {
    'ultra': dict(color='#2B3BFF', rough=0.2, transmission=0.0, coat=0.7),
    'white': dict(color='#ECECE8', rough=0.42, transmission=0.0, coat=0.25),
    'soft': dict(color='#AEB8FF', rough=0.34, transmission=0.0, coat=0.4),
    'glass': dict(color='#FFFFFF', rough=0.16, transmission=1.0, coat=0.0),
    'ink': dict(color='#0F0F13', rough=0.28, transmission=0.0, coat=0.6),
    'signal': dict(color='#FF5A1F', rough=0.3, transmission=0.0, coat=0.5),
}


def bsdf(mat):
    return next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')


def set_look(mat, a, b, t):
    """Mezcla dos «looks» (color en lineal, rugosidad, transmisión, barniz)."""
    n = bsdf(mat)
    ca, cb = S.lin(a['color']), S.lin(b['color'])
    n.inputs['Base Color'].default_value = tuple(lerp(x, y, t) for x, y in zip(ca, cb))
    n.inputs['Roughness'].default_value = lerp(a['rough'], b['rough'], t)
    n.inputs['Transmission Weight'].default_value = lerp(a['transmission'], b['transmission'], t)
    n.inputs['Coat Weight'].default_value = lerp(a['coat'], b['coat'], t)


M_PAPER = S.principled_mat('paper', PAPER['color'], rough=PAPER['rough'])
M_GRAPHITE = S.principled_mat('graphite', '#4A4A52', rough=0.65, metal=0.15)
M_GUIDE = S.principled_mat('guide', '#9A9AA3', rough=0.7)
S.set_alpha(M_GUIDE, 0.75)

# ───────────────────────── El «&» y sus piezas ─────────────────────────

GLYPH_H = 1.3        # alto del «&» montado (unidades de escena)
EXTRUDE = 0.06       # medio grosor (la fuente extruye hacia ambos lados)
BEVEL = 0.012


def font_curve(name, size, extrude=0.0, bevel=0.0, fill='BOTH'):
    font = bpy.data.fonts.load(FONT, check_existing=True)
    cu = bpy.data.curves.new(name, 'FONT')
    cu.font = font; cu.body = '&'; cu.size = size
    cu.extrude = extrude; cu.bevel_depth = bevel; cu.bevel_resolution = 3
    cu.resolution_u = 20; cu.fill_mode = fill
    return cu


def eval_mesh(cu):
    ob = bpy.data.objects.new('_tmp', cu); S.scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    return me


def glyph():
    """Malla cerrada del «&» en el plano XY local, centrada en su caja. Devuelve (bmesh, tamaño, centro)."""
    probe = eval_mesh(font_curve('probe', 1.0))
    ys = [v.co.y for v in probe.vertices]
    size = GLYPH_H / (max(ys) - min(ys))
    me = eval_mesh(font_curve('amp', size, EXTRUDE, BEVEL))
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]
    c = Vector(((max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, 0))
    bmesh.ops.translate(bm, verts=bm.verts, vec=-c)
    return bm, size, c


def seeds_for(bm):
    """Semillas de Voronoi en una rejilla con jitter determinista sobre la caja del glifo."""
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    out, cols, rows = [], 4, 5
    for r in range(rows):
        for c in range(cols):
            i = r * cols + c
            jx = math.sin(i * 12.9898 + 1.3) * 0.32
            jy = math.sin(i * 78.233 + 0.7) * 0.32
            out.append(Vector((x0 + (x1 - x0) * (c + 0.5 + jx) / cols, y0 + (y1 - y0) * (r + 0.5 + jy) / rows, 0)))
    return out


def voronoi(bm_src, seeds):
    """Corta el glifo en celdas de Voronoi; cada corte se tapa con una cara plana."""
    pieces = []
    for i, si in enumerate(seeds):
        bm = bm_src.copy()
        for j, sj in enumerate(seeds):
            if i == j or not bm.verts:
                continue
            n = (sj - si).normalized()
            bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-6,
                                   plane_co=(si + sj) / 2, plane_no=n, clear_outer=True)
            edges = [e for e in bm.edges if e.is_boundary]
            if edges:
                bmesh.ops.holes_fill(bm, edges=edges, sides=0)
        if len(bm.faces) < 8:
            bm.free(); continue
        pieces.append(bm)
    return pieces


def face_basis(n):
    """Rotación que lleva el plano XY local a mirar en la dirección n (eje Z local = n, Y local ≈ arriba)."""
    n = n.normalized()
    up = (Vector((0, 0, 1)) - n * n.z).normalized()
    x = up.cross(n)
    return Matrix((x, up, n)).transposed().to_4x4()


GLYPH_ROT = face_basis(P - G)
GLYPH_M = Matrix.Translation(G) @ GLYPH_ROT

bm_glyph, GLYPH_SIZE, GLYPH_C = glyph()
GX = [v.co.x for v in bm_glyph.verts]; GY = [v.co.y for v in bm_glyph.verts]
GBOX = (min(GX), max(GX), min(GY), max(GY))

pieces = []
for i, bm in enumerate(voronoi(bm_glyph, seeds_for(bm_glyph))):
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]
    c = Vector(((max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, 0))
    area = (max(xs) - min(xs)) * (max(ys) - min(ys))
    bmesh.ops.translate(bm, verts=bm.verts, vec=-c)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if e.is_manifold and e.calc_face_angle(0) > rad(32):
            e.smooth = False
    me = bpy.data.meshes.new(f'piece_{i}'); bm.to_mesh(me); bm.free()
    pieces.append(dict(mesh=me, c=c, area=area))

# Material de cada pieza: una pequeña es la única naranja; el resto, reparto espacial alterno
order = sorted(range(len(pieces)), key=lambda i: (pieces[i]['c'].y * 3 + pieces[i]['c'].x))
CYCLE = ['ultra', 'glass', 'soft', 'ultra', 'ink', 'white', 'ultra', 'glass', 'soft', 'ultra', 'ink', 'ultra']
# (la menor de las que se ven: las astillas de los cortes no cuentan)
smallest = min((i for i in range(len(pieces)) if pieces[i]['area'] > 0.012), key=lambda i: pieces[i]['area'])
k = 0
for i in order:
    if i == smallest:
        pieces[i]['look'] = 'signal'
    else:
        pieces[i]['look'] = CYCLE[k % len(CYCLE)]; k += 1

# Profundidad de cada pieza (factor de la homotecia), giro propio y orden de despegue
for n, i in enumerate(order):
    p = pieces[i]
    p['k'] = 0.72 + 0.53 * ((i * 0.618034 + 0.31) % 1.0)  # 0.72–1.25: la más lejana no toca el suelo
    ax = Vector((math.sin(i * 2.1 + 0.4), math.cos(i * 1.7 + 0.9), math.sin(i * 0.9 + 2.0) * 0.6)).normalized()
    p['axis'] = ax
    p['spin0'] = rad(28 + 36 * ((i * 0.41 + 0.2) % 1.0)) * (1 if i % 2 else -1)
    p['spin_extra'] = rad(40 + 30 * ((i * 0.73) % 1.0)) * (1 if i % 3 else -1)
    p['lift_at'] = 16 + 14 * n / max(1, len(pieces) - 1)
    p['asm'] = GLYPH_M @ Matrix.Translation(p['c'])           # pieza montada (en el plano del «&»)
    kk = p['k']
    p['sc'] = Matrix.Translation(P) @ Matrix.Scale(kk, 4) @ Matrix.Translation(-P) @ p['asm']  # dispersa en profundidad


def build_pieces():
    for i, p in enumerate(pieces):
        mat = S.principled_mat(f'm_piece_{i}', PAPER['color'], rough=PAPER['rough'])
        p['mesh'].materials.append(mat)
        p['mat'] = mat
        p['obj'] = S.link(bpy.data.objects.new(f'piece_{i}', p['mesh']))
        p['obj'].rotation_mode = 'QUATERNION'

# ───────────────────────── Hoja, boceto y lápiz ─────────────────────────

PAPER_C = Vector((0.08, -0.3, 0.0))
PAPER_ROT = rad(-5)
PAPER_W, PAPER_H = 1.62, 1.16
FLAT_S = 0.6  # escala del «&» dibujado sobre la hoja respecto al montado
FLAT_M = (Matrix.Translation(PAPER_C + Vector((0, 0.02, 0.0045))) @ Matrix.Rotation(PAPER_ROT, 4, 'Z')
          @ Matrix.Scale(FLAT_S, 4))


def build_paper():
    sheet = S.rr_plane('sheet', PAPER_W, PAPER_H, 0.012, M_PAPER)
    sheet.matrix_world = Matrix.Translation(PAPER_C + Vector((0, 0, 0.002))) @ Matrix.Rotation(PAPER_ROT, 4, 'Z')
    root = S.empty('sketch_root'); root.matrix_world = FLAT_M
    # Contorno del «&» a lápiz (dos pasadas ligeramente desplazadas, como un trazo real)
    for k, (dx, dy, rot, mat) in enumerate([(0, 0, 0, M_GRAPHITE), (0.006, -0.004, 0.5, M_GUIDE)]):
        cu = font_curve(f'sketch_{k}', GLYPH_SIZE, 0.0, 0.0028 / FLAT_S, fill='NONE')
        ob = S.link(bpy.data.objects.new(f'sketch_{k}', cu), root)
        ob.location = (-GLYPH_C.x + dx, -GLYPH_C.y + dy, 0)
        ob.rotation_euler = (0, 0, rad(rot))
        cu.materials.append(mat)
    # Líneas guía: base, altura, inclinación de la cursiva y el círculo del ojal superior
    x0, x1, y0, y1 = GBOX
    t = 0.0018 / FLAT_S
    for name, pts in [
        ('base', [(x0 - 0.3, y0 + 0.01, 0), (x1 + 0.34, y0 + 0.01, 0)]),
        ('cap', [(x0 - 0.22, y1 - 0.01, 0), (x1 + 0.28, y1 - 0.01, 0)]),
        ('slant', [(x0 + 0.05, y0 - 0.12, 0), (x0 + 0.05 + (y1 - y0 + 0.24) * math.tan(rad(13)), y1 + 0.12, 0)]),
    ]:
        S.polyline(f'guide_{name}', pts, M_GUIDE, root, t)
    cx, cy, r = x0 + (x1 - x0) * 0.58, y0 + (y1 - y0) * 0.74, (y1 - y0) * 0.2
    S.polyline('guide_bowl', [(cx + r * math.cos(a * math.tau / 64), cy + r * math.sin(a * math.tau / 64), 0) for a in range(65)],
               M_GUIDE, root, t)
    # Lápiz apoyado en la hoja, en diagonal a la derecha del boceto
    pen = S.empty('pencil')
    body = S.cylinder('pen_body', 0.017, 0.5, S.principled_mat('pen_body', '#121216', rough=0.35, coat=0.5), pen, verts=6, smooth_shade=False)
    S.cylinder('pen_wood', 0.017, 0.07, S.principled_mat('pen_wood', '#E6D3B0', rough=0.8), pen, verts=6, r2=0.0045, z0=0.5, smooth_shade=False)
    S.cylinder('pen_lead', 0.0045, 0.016, M_GRAPHITE, pen, verts=12, r2=0.0006, z0=0.57)
    S.cylinder('pen_cap', 0.0172, 0.03, S.principled_mat('pen_cap', '#D9D9DE', rough=0.25, metal=0.8), pen, verts=24, z0=-0.03)
    # Tumbado (eje +Z del lápiz → horizontal) y apoyado en una cara del hexágono
    pen.matrix_world = (Matrix.Translation(PAPER_C + Vector((0.6, -0.36, 0.017))) @ Matrix.Rotation(rad(118), 4, 'Z')
                        @ Matrix.Rotation(rad(90), 4, 'Y') @ Matrix.Rotation(rad(30), 4, 'Z'))
    return body

# ───────────────────────── Pose por frame ─────────────────────────


def decompose(m):
    loc, q, sc = m.decompose()
    return loc, q, sc


def piece_pose(p, f, i):
    """Matriz mundo y mezcla de material de una pieza en el frame f."""
    unwind = seg(f, 82, ALIGN_AT - 2)
    spin = (p['spin0'] + p['spin_extra'] * seg(f, 49, 79)) * (1 - unwind)
    target = p['sc'] @ Quaternion(p['axis'], spin).to_matrix().to_4x4()
    t = clamp((f - p['lift_at']) / 14.0)
    if t <= 0:
        return None, 0.0
    e = ease_io(t)
    l0, q0, s0 = decompose(FLAT_M @ Matrix.Translation(p['c']))
    s0 = Vector((s0.x, s0.y, s0.z * 0.1))        # recorte de papel: casi sin grosor
    l1, q1, s1 = decompose(target)
    loc = l0.lerp(l1, e) + Vector((0, 0, 0.28 * math.sin(math.pi * e)))
    bob = 0.022 * math.sin(f * 0.13 + i * 1.7) * seg(f, 40, 50) * (1 - unwind)
    loc.z += bob
    q = q0.slerp(q1, e)
    sc = s0.lerp(s1, ease_out(t))
    m = Matrix.Translation(loc) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((sc.x, sc.y, sc.z, 1))
    return m, ease_io(clamp((t - 0.15) / 0.6))


def pose(f):
    for i, p in enumerate(pieces):
        m, look = piece_pose(p, f, i)
        o = p['obj']
        if m is None:
            S.set_hidden(o, True); continue
        S.set_hidden(o, False)
        loc, q, sc = m.decompose()
        o.location = loc; o.rotation_quaternion = q; o.scale = sc
        set_look(p['mat'], PAPER, LOOKS[p['look']], look)

# ───────────────────────── Cámara ─────────────────────────

CAM_KEYS = {
    'desktop': [
        # Las piezas se apartan del lado del texto de cada capítulo (izquierda, derecha, izquierda, derecha)
        (1, (12, 57, 4.0, -0.27, -0.33, 0.0, 0.0, 50)),
        (13, (10, 56, 3.95, -0.27, -0.33, 0.0, 0.0, 50)),
        (22, (2, 46, 3.6, -0.05, -0.2, 0.2, 0.0, 50)),
        (45, (-36, 19, 5.2, 0.3, -0.15, 1.0, 0.0, 50)),
        (49, (-37, 19, 5.2, 0.3, -0.15, 1.0, 0.0, 50)),
        (77, (54, 13, 5.6, -0.25, -0.25, 1.0, 0.0, 50)),
        (80, (55, 13, 5.6, -0.25, -0.25, 1.0, 0.0, 50)),
        (ALIGN_AT, FINAL),
        (120, FINAL),
    ],
}
MOBILE_LENS_K = 0.84         # retrato: más campo para la escultura dispersa
MOBILE_FINAL_LENS_K = 1.1    # el «&» montado es alto: algo más cerca, y la hoja queda bajo el texto
# Desde ALIGN_AT, la misma focal que usa camera(): sin salto de zoom en el momento del encaje
CAM_KEYS['mobile'] = [
    (f, (az, el, d, tx, ty, tz, sy, lens * (MOBILE_FINAL_LENS_K if f >= ALIGN_AT else MOBILE_LENS_K)))
    for f, (az, el, d, tx, ty, tz, sy, lens) in CAM_KEYS['desktop']
]


def camera(cam_profile, f):
    """Recorrido por claves; desde ALIGN_AT, exactamente en P (solo cambia la focal: el «&» sigue encajado)."""
    if f < ALIGN_AT:
        S.pose_camera(CAM_KEYS[cam_profile], f)
        return
    cam, cd = S._cam['obj'], S._cam['data']
    cam.location = P
    cam.rotation_euler = (G - P).to_track_quat('-Z', 'Y').to_euler()
    lens = FINAL[7] * (MOBILE_FINAL_LENS_K if cam_profile == 'mobile' else 1.0)
    cd.lens = lens * (1 + 0.04 * ease_out(norm(f, ALIGN_AT, 120)))
    cd.shift_y = FINAL[6]


def render_to(path):
    S.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

# ───────────────────────── Modos ─────────────────────────


def setup_studio(shadow=True):
    S.studio_world(0.44)
    S.studio_lights(target=(0, 0, 0.7))
    if shadow:
        S.shadow_floor(0)


if MODE == 'pieces':
    for i, p in enumerate(pieces):
        print(f"[pieces] {i:2d} look={p['look']:6s} area={p['area']:.3f} k={p['k']:.2f} c=({p['c'].x:+.2f},{p['c'].y:+.2f})")
    print(f'[pieces] total {len(pieces)}')

elif MODE == 'story':
    setup_studio()
    build_pieces(); build_paper()
    S.make_camera(A.cam, A.scale)
    S.setup_render(A.samples, A.engine)
    out_dir = os.path.join(A.out, A.cam); os.makedirs(out_dir, exist_ok=True)
    t0 = time.time()
    for n, f in enumerate(A.frames):
        S.scene.frame_set(f)
        pose(f); camera(A.cam, f)
        ts = time.time()
        render_to(os.path.join(out_dir, f'{f:04d}.png'))
        print(f'[productos-creativos] {A.cam} frame {f:03d} ({n + 1}/{len(A.frames)}) {time.time() - ts:.1f}s', flush=True)
    print(f'[productos-creativos] done {len(A.frames)} frames in {time.time() - t0:.1f}s', flush=True)

elif MODE == 'grid':
    # Rejilla de 11 × 7 puntos de vista alrededor del «&» montado (la celda central es P)
    setup_studio()
    build_pieces(); build_paper()
    pose(120)
    S.make_camera('desktop', A.scale)
    S.scene.render.resolution_x = S.scene.render.resolution_y = 720
    S.setup_render(A.samples, A.engine)
    cam, cd = S._cam['obj'], S._cam['data']
    out_dir = os.path.join(A.out, 'grid'); os.makedirs(out_dir, exist_ok=True)
    COLS, ROWS, DAZ, DEL = 11, 7, 5.0, 4.0
    for r in range(ROWS):
        for c in range(COLS):
            az = FINAL[0] + (c - COLS // 2) * DAZ
            el = FINAL[1] + (ROWS // 2 - r) * DEL
            cam.location = cam_loc(az, el, *FINAL[2:6])
            cam.rotation_euler = (G - cam.location).to_track_quat('-Z', 'Y').to_euler()
            cd.lens = 46; cd.shift_y = 0
            render_to(os.path.join(out_dir, f'r{r}_c{c:02d}.png'))
            print(f'[productos-creativos] grid r{r} c{c}', flush=True)
    with open(os.path.join(out_dir, 'meta.json'), 'w') as fh:
        json.dump({'cols': COLS, 'rows': ROWS, 'dAz': DAZ, 'dEl': DEL, 'size': 720}, fh)
    print('[productos-creativos] grid DONE', flush=True)

elif MODE == 'frag':
    # Una pieza aislada, sin suelo, girando sobre sí misma (hoja de sprites para las secciones)
    idx = int(S.arg('frag', '0'))
    p = pieces[idx]
    S.scene.frame_start, S.scene.frame_end = 1, 48
    setup_studio(shadow=False)
    build_pieces()
    for j, q in enumerate(pieces):
        S.set_hidden(q['obj'], j != idx)
    o = p['obj']
    set_look(p['mat'], PAPER, LOOKS[p['look']], 1.0)
    radius = max((v.co.length for v in p['mesh'].vertices), default=0.3)
    S.make_camera('desktop', A.scale)
    S.scene.render.resolution_x = S.scene.render.resolution_y = int(S.arg('res', '512'))
    S.setup_render(A.samples, A.engine)
    cam, cd = S._cam['obj'], S._cam['data']
    cd.lens = 50
    dist = radius / math.tan(math.atan(18 / 50)) * 1.25
    cam.location = Vector((0, -dist, 0.0)); cam.rotation_euler = (rad(90), 0, 0)
    out_dir = os.path.join(os.getcwd(), 'assets/props_src', f'frag-{idx}'); os.makedirs(out_dir, exist_ok=True)
    for f in range(1, 49):
        t = (f - 1) / 48
        o.location = (0, 0, 0)
        o.rotation_quaternion = (Matrix.Rotation(rad(360 * t), 4, 'Z') @ Matrix.Rotation(rad(18 + 14 * math.sin(math.tau * t)), 4, 'X')
                                 @ Matrix.Rotation(rad(90), 4, 'X')).to_quaternion()
        o.scale = (1, 1, 1)
        render_to(os.path.join(out_dir, f'{f:04d}.png'))
        print(f'[props] frag-{idx} {f}/48', flush=True)
    with open(os.path.join(out_dir, 'meta.json'), 'w') as fh:
        json.dump({'name': f'frag-{idx}', 'frames': 48, 'size': S.scene.render.resolution_x, 'look': p['look']}, fh)
    print(f'[props] frag-{idx} DONE', flush=True)

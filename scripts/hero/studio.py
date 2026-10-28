"""
Estudio compartido para las escenas de scroll storytelling (§6, §7).

Todo lo que no es coreografía: argumentos, easing, materiales, geometría redondeada,
dispositivos genéricos, luz de estudio sobre blanco, shadow catcher, cámara con
claves Catmull-Rom y bucle de render (Cycles + Metal).

Uso desde una escena (scripts/hero/scenes/<slug>.py):

    import os, sys
    sys.path.insert(0, os.path.join(os.getcwd(), 'scripts/hero'))
    import studio as S

    A = S.parse_args(default_frames=120)          # --cam --frames --out --samples --scale
    S.reset_scene(A.n)
    S.set_texture_dir('assets/hero/textures/<slug>')
    ...                                          # objetos con S.rr_box, S.screen_mat…
    def pose(f): ...                             # estado determinista para el frame f
    CAM_KEYS = {'desktop': [(frame, (az, el, dist, tx, ty, tz, shift_y, lens)), ...]}
    S.run(A, pose, CAM_KEYS, label='<slug>')

Ejecutar (desde la raíz del proyecto):
    blender -b --factory-startup --python scripts/hero/scenes/<slug>.py -- \
        --cam desktop|mobile --frames all|1,30,60|1-120 [--out assets/frames_src/<slug>] \
        [--samples 48] [--scale 1.0]

Reglas de imagen (§7.2): fondo blanco puro (film transparente + shadow catcher, se
aplana sobre #FFFFFF al empaquetar), el objeto nunca toca el borde (margen ≥ 8 %),
paleta limitada (blancos, grises cálidos, tinta #0B0B0F, ultramar #2B3BFF; el naranja
#FF5A1F solo para un punto "live"), sin texto legible ni logos.
"""
import bpy, bmesh, math, os, sys, time
from mathutils import Vector, Matrix, Euler

# ───────────────────────── Argumentos ─────────────────────────

class Args:
    pass


def _argv():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default=None):
    a = _argv()
    if f'--{name}' in a:
        return a[a.index(f'--{name}') + 1]
    return default


def parse_frames(s, n):
    if s in (None, 'all'):
        return list(range(1, n + 1))
    out = []
    for part in s.split(','):
        if '-' in part:
            a, b = part.split('-')
            out += list(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return out


def parse_args(default_frames=120, default_out='assets/frames_src'):
    A = Args()
    A.n = int(arg('n', str(default_frames)))
    A.cam = arg('cam', 'desktop')
    A.out = os.path.abspath(arg('out', default_out))
    A.samples = int(arg('samples', '48'))
    A.scale = float(arg('scale', '1.0'))
    A.engine = arg('engine', 'cycles')
    A.frames = parse_frames(arg('frames', 'all'), A.n)
    return A

# ───────────────────────── Color y easing ─────────────────────────

PALETTE = {
    'white': '#FFFFFF', 'paper': '#F7F6F2', 'paper2': '#F6F6F3', 'line': '#E8E8E3',
    'ink': '#0B0B0F', 'ink2': '#3A3A42', 'ink3': '#6B6B76', 'accent': '#2B3BFF',
    'accent_soft': '#EEF0FF', 'signal': '#FF5A1F',
}


def lin(h):
    """Hex sRGB → RGBA lineal (lo que esperan los nodos de color)."""
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (f(c[0]), f(c[1]), f(c[2]), 1.0)


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def lerp(a, b, t):
    return a + (b - a) * t


def norm(f, a, b):
    return clamp((f - a) / (b - a)) if b != a else (1.0 if f >= b else 0.0)


def ease_io(t):  # cúbica in-out
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out(t):  # expo out
    return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)


def ease_in(t):
    return t ** 3


def smooth(t):
    return t * t * (3 - 2 * t)


def seg(f, a, b, fn=ease_io):
    """Progreso 0..1 entre los frames a y b con easing (por defecto in-out)."""
    return fn(norm(f, a, b))


def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def catmull(keys, f):
    """keys: [(frame, tuple)] → tupla interpolada con Catmull-Rom por segmentos."""
    fs = [k[0] for k in keys]
    if f <= fs[0]:
        return keys[0][1]
    if f >= fs[-1]:
        return keys[-1][1]
    i = max(j for j in range(len(fs) - 1) if fs[j] <= f)
    t = (f - fs[i]) / (fs[i + 1] - fs[i])
    p0 = keys[max(i - 1, 0)][1]; p1 = keys[i][1]; p2 = keys[i + 1][1]; p3 = keys[min(i + 2, len(keys) - 1)][1]
    out = []
    for a, b, c, d in zip(p0, p1, p2, p3):
        out.append(0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3))
    return tuple(out)

# ───────────────────────── Escena ─────────────────────────

scene = None


def reset_scene(n):
    global scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, n
    return scene


def link(obj, parent=None):
    scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def empty(name, parent=None):
    return link(bpy.data.objects.new(name, None), parent)


def set_hidden(o, hidden):
    o.hide_render = hidden
    for c in o.children_recursive:
        c.hide_render = hidden


def set_scale(o, s):
    """Escala uniforme sin llegar a 0 (Cycles no admite matrices degeneradas)."""
    o.scale = (max(s, 1e-4),) * 3

# ───────────────────────── Materiales ─────────────────────────

def node(nt, kind, loc=(0, 0), **props):
    n = nt.nodes.new(kind); n.location = loc
    for k, v in props.items():
        setattr(n, k, v)
    return n


def sock(coll, ident):
    for s in coll:
        if s.identifier == ident:
            return s
    return coll[ident]


def _fresh(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    return m, nt


def finish_material(mat, shader_out):
    """Control de opacidad por material: Mix(Transparent, shader, ALPHA). set_alpha(mat, a)."""
    nt = mat.node_tree
    out = nt.nodes.get('Material Output') or node(nt, 'ShaderNodeOutputMaterial', (900, 0))
    alpha = node(nt, 'ShaderNodeValue', (500, 250)); alpha.name = 'ALPHA'; alpha.outputs[0].default_value = 1.0
    tr = node(nt, 'ShaderNodeBsdfTransparent', (500, 120))
    mix = node(nt, 'ShaderNodeMixShader', (700, 0))
    nt.links.new(alpha.outputs[0], mix.inputs[0])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(shader_out, mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    mat.surface_render_method = 'DITHERED'
    return mat


def principled_mat(name, color, rough=0.4, metal=0.0, coat=0.0, transmission=0.0, ior=1.45, emission=None, emit=0.0):
    m, nt = _fresh(name)
    b = node(nt, 'ShaderNodeBsdfPrincipled', (200, 0))
    b.inputs['Base Color'].default_value = lin(color) if isinstance(color, str) else color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Transmission Weight'].default_value = transmission
    b.inputs['IOR'].default_value = ior
    if emission:
        b.inputs['Emission Color'].default_value = lin(emission)
        b.inputs['Emission Strength'].default_value = emit
    return finish_material(m, b.outputs[0])


def glass_mat(name, rough=0.2, tint='#FFFFFF'):
    """Vidrio esmerilado (como las capas de la home)."""
    return principled_mat(name, tint, rough=rough, transmission=1.0, ior=1.45)


def emissive_mat(name, color, strength=2.0):
    """Superficie que emite luz propia (bordes iluminados, núcleos, el punto "live")."""
    return principled_mat(name, color, rough=0.3, emission=color, emit=strength)


_TEX_DIR = [os.path.join(os.getcwd(), 'assets/hero/textures')]
IMAGES = {}


def set_texture_dir(path):
    _TEX_DIR[0] = path if os.path.isabs(path) else os.path.join(os.getcwd(), path)


def img(name):
    full = name if os.path.isabs(name) else os.path.join(_TEX_DIR[0], name)
    if full not in IMAGES:
        IMAGES[full] = bpy.data.images.load(full, check_existing=True)
    return IMAGES[full]


def screen_mat(name, images, lit=0.97, rough=0.22, alpha_from_image=False):
    """Pantalla / impresión con textura.

    images: lista de PNG (en el directorio de texturas); se mezclan en cadena con
    set_mix(mat, 1..n-1, v). `lit` mezcla difuso (0, papel iluminado por la escena) con
    emisión pura (1, pantalla encendida con el color exacto de la textura): set_lit(mat, v).
    alpha_from_image: transparente donde el PNG no tiene alfa (impresiones sobre vidrio).
    """
    m, nt = _fresh(name)
    texs = []
    for i, im in enumerate(images):
        t = node(nt, 'ShaderNodeTexImage', (-700, -i * 300)); t.image = img(im); t.name = f'TEX_{i}'
        t.interpolation = 'Cubic'
        texs.append(t)
    col = texs[0].outputs['Color']
    for i in range(1, len(texs)):
        mx = node(nt, 'ShaderNodeMix', (-400 + i * 120, -i * 150)); mx.data_type = 'RGBA'; mx.name = f'MIX_{i}'
        sock(mx.inputs, 'Factor_Float').default_value = 0.0
        nt.links.new(col, sock(mx.inputs, 'A_Color'))
        nt.links.new(texs[i].outputs['Color'], sock(mx.inputs, 'B_Color'))
        col = sock(mx.outputs, 'Result_Color')
    b = node(nt, 'ShaderNodeBsdfPrincipled', (200, 0))
    nt.links.new(col, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    em = node(nt, 'ShaderNodeEmission', (200, -250))
    nt.links.new(col, em.inputs['Color']); em.inputs['Strength'].default_value = 1.0
    litn = node(nt, 'ShaderNodeValue', (0, 250)); litn.name = 'LIT'; litn.outputs[0].default_value = lit
    ms = node(nt, 'ShaderNodeMixShader', (420, 0))
    nt.links.new(litn.outputs[0], ms.inputs[0]); nt.links.new(b.outputs[0], ms.inputs[1]); nt.links.new(em.outputs[0], ms.inputs[2])
    gl = node(nt, 'ShaderNodeBsdfGlossy', (420, -250)) if hasattr(bpy.types, 'ShaderNodeBsdfGlossy') else node(nt, 'ShaderNodeBsdfAnisotropic', (420, -250))
    gl.inputs['Color'].default_value = (0.035, 0.035, 0.035, 1); gl.inputs['Roughness'].default_value = 0.12
    add = node(nt, 'ShaderNodeAddShader', (600, 0))
    nt.links.new(ms.outputs[0], add.inputs[0]); nt.links.new(gl.outputs[0], add.inputs[1])
    shader = add.outputs[0]
    if alpha_from_image:
        tr = node(nt, 'ShaderNodeBsdfTransparent', (600, 200))
        mx = node(nt, 'ShaderNodeMixShader', (780, 100))
        nt.links.new(texs[0].outputs['Alpha'], mx.inputs[0])
        nt.links.new(tr.outputs[0], mx.inputs[1])
        nt.links.new(add.outputs[0], mx.inputs[2])
        shader = mx.outputs[0]
    return finish_material(m, shader)


def set_alpha(mat, a):
    mat.node_tree.nodes['ALPHA'].outputs[0].default_value = clamp(a)


def set_mix(mat, i, v):
    sock(mat.node_tree.nodes[f'MIX_{i}'].inputs, 'Factor_Float').default_value = clamp(v)


def set_lit(mat, v):
    mat.node_tree.nodes['LIT'].outputs[0].default_value = clamp(v)


def set_image(mat, name, i=0):
    """Cambia la imagen de la textura i (p. ej. un PNG distinto por frame)."""
    mat.node_tree.nodes[f'TEX_{i}'].image = img(name)


def set_emit(mat, v):
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            n.inputs['Emission Strength'].default_value = v


def set_color(mat, hex_or_rgba):
    c = lin(hex_or_rgba) if isinstance(hex_or_rgba, str) else hex_or_rgba
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            n.inputs['Base Color'].default_value = c

# ───────────────────────── Geometría ─────────────────────────

def rr_points(w, h, r, seg=10):
    """Rectángulo redondeado (w×h, radio r) como lista de puntos 2D centrada."""
    r = min(r, w / 2 - 1e-5, h / 2 - 1e-5)
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def rr_plane(name, w, h, r, mat, parent=None, z=0.0):
    """Plano redondeado con UV 0..1 (para pantallas e impresiones). Normal +Z."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new((x, y, 0)) for x, y in rr_points(w, h, r)]
    f = bm.faces.new(vs)
    uv = bm.loops.layers.uv.new()
    for lp in f.loops:
        x, y, _ = lp.vert.co
        lp[uv].uv = ((x + w / 2) / w, (y + h / 2) / h)
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), parent)
    o.location.z = z
    me.materials.append(mat)
    return o


def rr_box(name, w, h, t, r, mat, parent=None, edge=0.006):
    """Losa redondeada w×h de grosor t (centrada; caras ±Z) con bisel fino en los cantos."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    pts = rr_points(w, h, r)
    top = [bm.verts.new((x, y, t / 2)) for x, y in pts]
    bot = [bm.verts.new((x, y, -t / 2)) for x, y in pts]
    ftop = bm.faces.new(top); fbot = bm.faces.new(list(reversed(bot)))
    n = len(pts)
    sides = [bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i])) for i in range(n)]
    uv = bm.loops.layers.uv.new()
    for f in [ftop, fbot] + sides:
        for lp in f.loops:
            x, y, _ = lp.vert.co
            lp[uv].uv = ((x + w / 2) / w, (y + h / 2) / h)
    for f in sides:
        f.smooth = True
    bm.normal_update(); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), parent)
    me.materials.append(mat)
    if edge > 0:
        bv = o.modifiers.new('bevel', 'BEVEL')
        bv.width = min(edge, t * 0.45); bv.segments = 3; bv.limit_method = 'ANGLE'
        bv.angle_limit = math.radians(40); bv.harden_normals = True
    return o


def rr_outline(name, w, h, r, mat, parent=None, thick=0.0035):
    """Contorno redondeado (tubo fino) para bordes iluminados."""
    return polyline(name, [(x, y, 0) for x, y in rr_points(w, h, r, 12)], mat, parent, thick, cyclic=True)


def polyline(name, points, mat, parent=None, thick=0.004, cyclic=False):
    """Tubo que pasa por una lista de puntos 3D. Para trazos progresivos usa
    `obj.data.bevel_factor_end = v` (0..1)."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY')
    sp.points.add(len(points) - 1)
    for p, (x, y, z) in zip(sp.points, points):
        p.co = (x, y, z, 1)
    sp.use_cyclic_u = cyclic
    cu.bevel_depth = thick; cu.bevel_resolution = 3; cu.fill_mode = 'FULL'
    cu.use_fill_caps = True
    o = link(bpy.data.objects.new(name, cu), parent)
    cu.materials.append(mat)
    return o


def bezier_tube(name, p0, p1, mat, parent=None, thick=0.006, bend=0.35, samples=24, axis='z'):
    """Conector curvo entre dos puntos (tubería de nodos). `bend` separa los tiradores
    a lo largo de `axis` ('x', 'y' o 'z')."""
    p0, p1 = Vector(p0), Vector(p1)
    d = (p1 - p0).length * bend
    off = {'x': Vector((d, 0, 0)), 'y': Vector((0, d, 0)), 'z': Vector((0, 0, d))}[axis]
    c0, c1 = p0 + off, p1 - off
    pts = []
    for i in range(samples + 1):
        t = i / samples
        a = p0.lerp(c0, t); b = c0.lerp(c1, t); c = c1.lerp(p1, t)
        pts.append(tuple(a.lerp(b, t).lerp(b.lerp(c, t), t)))
    return polyline(name, pts, mat, parent, thick)


def cylinder(name, r, depth, mat, parent=None, verts=32, r2=None, z0=0.0, smooth_shade=True):
    """Cilindro / cono a lo largo de +Z desde z0 (r2: radio superior)."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, z0 + depth / 2))
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), parent)
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = smooth_shade and verts > 8
    return o


def sphere(name, r, mat, parent=None, segs=48, rings=24):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r)
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = link(bpy.data.objects.new(name, me), parent)
    me.materials.append(mat)
    return o


def torus(name, major, minor, mat, parent=None, segs=96, rings=24):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    verts = []
    for i in range(segs):
        u = 2 * math.pi * i / segs
        row = []
        for j in range(rings):
            v = 2 * math.pi * j / rings
            row.append(bm.verts.new(((major + minor * math.cos(v)) * math.cos(u), (major + minor * math.cos(v)) * math.sin(u), minor * math.sin(v))))
        verts.append(row)
    for i in range(segs):
        for j in range(rings):
            bm.faces.new((verts[i][j], verts[(i + 1) % segs][j], verts[(i + 1) % segs][(j + 1) % rings], verts[i][(j + 1) % rings]))
    bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = link(bpy.data.objects.new(name, me), parent)
    me.materials.append(mat)
    return o


def card(name, w, h, t, r, body_mat, face_mat=None, parent=None, edge=0.006, inset=0.0):
    """Tarjeta: losa redondeada + cara impresa (face_mat) sobre +Z. Devuelve (root, body, face)."""
    root = empty(name, parent)
    body = rr_box(f'{name}_body', w, h, t, r, body_mat, root, edge=edge)
    face = None
    if face_mat is not None:
        face = rr_plane(f'{name}_face', w - 2 * inset - 0.002, h - 2 * inset - 0.002, max(r - inset, 0.002), face_mat, root, z=t / 2 + 0.0008)
    return root, body, face

# ───────────────────────── Dispositivos genéricos (sin marcas) ─────────────────────────

_MATS = {}


def device_mats():
    if not _MATS:
        _MATS['alu'] = principled_mat('dev_alu', '#D5D6DB', rough=0.3, metal=0.85)
        _MATS['alu_dark'] = principled_mat('dev_alu_dark', '#B9BBC2', rough=0.35, metal=0.85)
        _MATS['black_glass'] = principled_mat('dev_black_glass', '#0B0B0F', rough=0.12, coat=0.6)
        _MATS['deck'] = principled_mat('dev_deck', '#2A2A30', rough=0.55)
        _MATS['trackpad'] = principled_mat('dev_trackpad', '#C5C6CC', rough=0.25, metal=0.6)
    return _MATS


def build_phone(name, screen_material, parent=None):
    """Móvil 0.52×1.06×0.05, pantalla mirando a +Z (rota X 90° para ponerlo de pie mirando a -Y).
    Devuelve dict(root, screen, live) — `live` es un empty en la esquina superior de la pantalla."""
    m = device_mats()
    root = empty(name, parent)
    W, H, T = 0.52, 1.06, 0.05
    rr_box(f'{name}_body', W, H, T, 0.085, m['alu'], root, edge=0.012)
    rr_plane(f'{name}_glass', W - 0.012, H - 0.012, 0.08, m['black_glass'], root, z=T / 2 + 0.0006)
    scr = rr_plane(f'{name}_screen', 0.475, 1.03, 0.066, screen_material, root, z=T / 2 + 0.0012)
    live = empty(f'{name}_live', root); live.location = (0.12, 0.39, T / 2 + 0.006)
    return {'root': root, 'screen': scr, 'live': live, 'size': (W, H, T)}


def build_laptop(name, screen_material, parent=None):
    """Portátil 1.62×1.08 (base en XY, bisagra al fondo +Y). hinge.rotation_euler.x = radians(-105) abre la tapa.
    Pantalla 16:10 (textura 1600×1000). Devuelve dict(root, hinge, screen)."""
    m = device_mats()
    root = empty(name, parent)
    BW, BD, BT = 1.62, 1.08, 0.034
    rr_box(f'{name}_base', BW, BD, BT, 0.05, m['alu'], root, edge=0.008)
    deck = rr_plane(f'{name}_deck', 1.42, 0.5, 0.03, m['deck'], root, z=BT / 2 + 0.0006); deck.location.y = 0.2
    pad = rr_plane(f'{name}_pad', 0.52, 0.3, 0.03, m['trackpad'], root, z=BT / 2 + 0.0006); pad.location.y = -0.28
    hinge = empty(f'{name}_hinge', root); hinge.location = (0, BD / 2 - 0.01, BT / 2)
    lid = empty(f'{name}_lid', hinge)
    LH = 1.04
    lb = rr_box(f'{name}_lid_body', BW, LH, 0.022, 0.05, m['alu_dark'], lid, edge=0.006); lb.location = (0, -LH / 2, 0.011)
    bez = rr_plane(f'{name}_bezel', BW - 0.04, LH - 0.04, 0.035, m['black_glass'], lid, z=-0.0005); bez.location.y = -LH / 2
    bez.rotation_euler.x = math.pi
    scr = rr_plane(f'{name}_screen', 1.5, 0.9375, 0.012, screen_material, lid, z=-0.0012); scr.location.y = -LH / 2 - 0.01
    scr.rotation_euler.x = math.pi
    hinge.rotation_euler.x = math.radians(-105)
    return {'root': root, 'hinge': hinge, 'screen': scr}


def build_monitor(name, screen_material, parent=None, w=1.9, h=1.1875):
    """Monitor de sobremesa genérico 16:10, pantalla mirando a -Y, con pie.
    El centro de la pantalla queda en el origen del root. Devuelve dict(root, screen, panel)."""
    m = device_mats()
    root = empty(name, parent)
    panel = empty(f'{name}_panel', root)
    body = rr_box(f'{name}_body', w + 0.06, h + 0.06, 0.035, 0.04, m['alu_dark'], panel, edge=0.006)
    body.rotation_euler.x = math.radians(90)
    bez = rr_plane(f'{name}_bezel', w + 0.03, h + 0.03, 0.03, m['black_glass'], panel)
    bez.rotation_euler.x = math.radians(90); bez.location.y = -0.0185
    scr = rr_plane(f'{name}_screen', w, h, 0.012, screen_material, panel)
    scr.rotation_euler.x = math.radians(90); scr.location.y = -0.0195
    neck = rr_box(f'{name}_neck', 0.16, 0.5, 0.03, 0.012, m['alu'], root, edge=0.004)
    neck.rotation_euler.x = math.radians(90); neck.location = (0, 0.06, -h / 2 - 0.2)
    foot = rr_box(f'{name}_foot', 0.62, 0.36, 0.022, 0.06, m['alu'], root, edge=0.006)
    foot.location = (0, 0.06, -h / 2 - 0.45)
    return {'root': root, 'screen': scr, 'panel': panel}

# ───────────────────────── Luz de estudio, mundo y suelo ─────────────────────────

def studio_world(light_strength=0.42):
    """Blanco 1.0 para la cámara y la transmisión (el vidrio se ve blanco); `light_strength` ilumina."""
    world = bpy.data.worlds.new('studio'); scene.world = world; world.use_nodes = True
    wn = world.node_tree
    for n in list(wn.nodes):
        if n.type != 'OUTPUT_WORLD':
            wn.nodes.remove(n)
    lp = node(wn, 'ShaderNodeLightPath', (-600, 0))
    mx = node(wn, 'ShaderNodeMath', (-350, 100), operation='MAXIMUM')
    wn.links.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wn.links.new(lp.outputs['Is Transmission Ray'], mx.inputs[1])
    bl = node(wn, 'ShaderNodeBackground', (-200, -100)); bl.inputs['Color'].default_value = lin('#FFFFFF'); bl.inputs['Strength'].default_value = light_strength
    bc = node(wn, 'ShaderNodeBackground', (-200, 150)); bc.inputs['Color'].default_value = (1, 1, 1, 1); bc.inputs['Strength'].default_value = 1.0
    wm = node(wn, 'ShaderNodeMixShader', (100, 0))
    wn.links.new(mx.outputs[0], wm.inputs[0]); wn.links.new(bl.outputs[0], wm.inputs[1]); wn.links.new(bc.outputs[0], wm.inputs[2])
    wn.links.new(wm.outputs[0], wn.nodes['World Output'].inputs['Surface'])
    return world


def area(name, loc, energy, size, size_y=None, target=(0, 0, 0.5), shadow=True):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy
    if hasattr(ld, 'use_shadow'): ld.use_shadow = shadow
    if hasattr(ld, 'cycles') and hasattr(ld.cycles, 'cast_shadow'): ld.cycles.cast_shadow = shadow
    ld.shape = 'RECTANGLE' if size_y else 'SQUARE'; ld.size = size
    if size_y: ld.size_y = size_y
    o = link(bpy.data.objects.new(name, ld)); o.location = loc
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o


def studio_lights(key=360, fill=90, rim=160, target=(0, 0, 0.5)):
    """Key cenital grande (única que proyecta sombra) + relleno y contra sin sombra."""
    return {
        'key': area('key', (-1.8, -1.6, 6.0), key, 6.5, target=target),
        'fill': area('fill', (4.0, -3.6, 2.2), fill, 6.0, target=target, shadow=False),
        'rim': area('rim', (1.5, 4.5, 3.2), rim, 3.0, 1.2, target=target, shadow=False),
    }


def shadow_floor(z=0.0, size=12):
    """Suelo invisible que solo recoge sombras (shadow catcher)."""
    me = bpy.data.meshes.new('floor'); bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size); bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new('floor', me))
    o.location.z = z
    o.is_shadow_catcher = True
    me.materials.append(principled_mat('floor', '#FFFFFF', rough=1.0))
    return o

# ───────────────────────── Cámara ─────────────────────────

_cam = {}


def make_camera(cam_profile, scale=1.0):
    """Cámara cuadrada 1200² (desktop) o retrato 720×900 (mobile, ajuste horizontal)."""
    cd = bpy.data.cameras.new('cam'); cam = link(bpy.data.objects.new('cam', cd)); scene.camera = cam
    cd.sensor_width = 36; cd.clip_start = 0.05; cd.clip_end = 100
    if cam_profile == 'mobile':
        cd.sensor_fit = 'HORIZONTAL'
        scene.render.resolution_x, scene.render.resolution_y = 720, 900
    else:
        cd.sensor_fit = 'AUTO'
        scene.render.resolution_x, scene.render.resolution_y = 1200, 1200
    scene.render.resolution_percentage = int(round(100 * scale))
    _cam['obj'] = cam; _cam['data'] = cd
    return cam


def mobile_keys(desktop_keys, lens_k=1.1, shift_k=0.8, dist_k=1.0):
    """Recorrido móvil derivado del de escritorio (mismo guion, encuadre retrato)."""
    return [(f, (az, el, d * dist_k, tx, ty, tz, sy * shift_k, lens * lens_k)) for f, (az, el, d, tx, ty, tz, sy, lens) in desktop_keys]


def pose_camera(keys, f):
    """keys: [(frame, (az°, el°, dist, tx, ty, tz, shift_y, lens))]. az 0 = cámara en -Y mirando a +Y."""
    az, el, dist, tx, ty, tz, sy, lens = catmull(keys, f)
    a, e = math.radians(az), math.radians(el)
    target = Vector((tx, ty, tz))
    loc = target + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * dist
    cam, cd = _cam['obj'], _cam['data']
    cam.location = loc
    cam.rotation_euler = (target - loc).to_track_quat('-Z', 'Y').to_euler()
    cd.lens = lens
    cd.shift_y = sy

# ───────────────────────── Render ─────────────────────────

def setup_render(samples=48, engine='cycles'):
    r = scene.render
    r.film_transparent = True
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA'
    r.image_settings.color_depth = '8'
    try:
        scene.view_settings.view_transform = arg('view', 'Khronos PBR Neutral')
    except TypeError:
        scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = float(arg('exposure', '0.0'))
    r.use_persistent_data = True
    if engine == 'cycles':
        r.engine = 'CYCLES'
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.refresh_devices()
        for dv in prefs.devices:
            dv.use = dv.type == 'METAL'
        c = scene.cycles
        c.device = 'GPU'
        c.samples = samples
        c.use_adaptive_sampling = True
        c.adaptive_threshold = 0.02
        c.use_denoising = True
        c.denoiser = 'OPENIMAGEDENOISE'
        c.max_bounces = 8; c.diffuse_bounces = 3; c.glossy_bounces = 4; c.transmission_bounces = 8; c.transparent_max_bounces = 16
        c.caustics_reflective = False; c.caustics_refractive = False
        c.film_transparent_glass = False
        c.blur_glossy = 1.0
    else:
        r.engine = 'BLENDER_EEVEE'
        scene.eevee.taa_render_samples = samples
        scene.eevee.use_raytracing = True


def run(A, pose, cam_keys, label='story'):
    """Bucle de render: para cada frame aplica pose(f) y la cámara, y escribe <out>/<cam>/NNNN.png."""
    make_camera(A.cam, A.scale)
    keys = cam_keys.get(A.cam) or mobile_keys(cam_keys['desktop'])
    setup_render(A.samples, A.engine)
    out_dir = os.path.join(A.out, A.cam)
    os.makedirs(out_dir, exist_ok=True)
    r = scene.render
    t0 = time.time()
    for i, f in enumerate(A.frames):
        scene.frame_set(f)
        pose(f)
        pose_camera(keys, f)
        r.filepath = os.path.join(out_dir, f'{f:04d}.png')
        ts = time.time()
        bpy.ops.render.render(write_still=True)
        print(f'[{label}] {A.cam} frame {f:03d} ({i + 1}/{len(A.frames)}) {time.time() - ts:.1f}s', flush=True)
    print(f'[{label}] done {len(A.frames)} frames in {time.time() - t0:.1f}s', flush=True)

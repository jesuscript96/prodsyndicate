"""
Escena del hero «Del boceto al producto» (§6.2, §7.3), 100 % procedural.

Uso (desde la raíz del proyecto):
  blender -b --factory-startup --python scripts/hero/scene.py -- \
      --cam desktop|mobile --frames all|1,19,56|1-150 --out assets/frames_src \
      [--samples 64] [--scale 1.0] [--engine cycles|eevee]

Genera PNG RGBA (fondo transparente + sombras del shadow catcher) en <out>/<cam>/NNNN.png.
`npm run sequence:build` los aplana sobre blanco puro y los convierte a WebP.
Requiere antes: node scripts/hero/make-textures.mjs
"""
import bpy, bmesh, math, json, sys, os, time
from mathutils import Vector

# ───────────────────────── Argumentos ─────────────────────────
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    if f'--{name}' in argv:
        return argv[argv.index(f'--{name}') + 1]
    return default

CAM = arg('cam', 'desktop')
OUT = os.path.abspath(arg('out', 'assets/frames_src'))
SAMPLES = int(arg('samples', '64'))
SCALE = float(arg('scale', '1.0'))
ENGINE = arg('engine', 'cycles')
FR = arg('frames', 'all')
N = 150
def parse_frames(s):
    if s == 'all':
        return list(range(1, N + 1))
    out = []
    for part in s.split(','):
        if '-' in part:
            a, b = part.split('-'); out += list(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return out
FRAMES = parse_frames(FR)

ROOT = os.getcwd()
TEX = os.path.join(ROOT, 'assets/hero/textures')
SKETCH = json.load(open(os.path.join(TEX, 'sketch.json')))

# ───────────────────────── Utilidades ─────────────────────────
def lin(h):
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
def seg(f, a, b, fn=ease_io):
    return fn(norm(f, a, b))
def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)

def catmull(keys, f):
    """keys: [(frame, tuple)] → tupla interpolada (Catmull-Rom uniforme por segmento)."""
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
        # Catmull-Rom con tangentes escaladas por la duración de los segmentos vecinos
        out.append(0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3))
    return tuple(out)

# ───────────────────────── Escena limpia ─────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, N

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

def finish_material(mat, shader_out):
    """Añade control de opacidad: Mix(Transparent, shader, ALPHA)."""
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
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
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

IMAGES = {}
def img(name):
    if name not in IMAGES:
        IMAGES[name] = bpy.data.images.load(os.path.join(TEX, name), check_existing=True)
    return IMAGES[name]

def screen_mat(name, images, emit=0.35, rough=0.22, alpha_from_image=False):
    """Material de pantalla. images: lista de nombres; se mezclan en cadena con nodos MIX_1, MIX_2…"""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
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
    lit = node(nt, 'ShaderNodeValue', (0, 250)); lit.name = 'LIT'; lit.outputs[0].default_value = emit
    ms = node(nt, 'ShaderNodeMixShader', (420, 0))
    nt.links.new(lit.outputs[0], ms.inputs[0]); nt.links.new(b.outputs[0], ms.inputs[1]); nt.links.new(em.outputs[0], ms.inputs[2])
    gl = node(nt, 'ShaderNodeBsdfGlossy', (420, -250)) if hasattr(bpy.types, 'ShaderNodeBsdfGlossy') else node(nt, 'ShaderNodeBsdfAnisotropic', (420, -250))
    gl.inputs['Color'].default_value = (0.035, 0.035, 0.035, 1); gl.inputs['Roughness'].default_value = 0.12
    add = node(nt, 'ShaderNodeAddShader', (600, 0))
    nt.links.new(ms.outputs[0], add.inputs[0]); nt.links.new(gl.outputs[0], add.inputs[1])
    shader = add.outputs[0]
    if alpha_from_image:
        # Impresión sobre vidrio: transparente donde la imagen no tiene alfa
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
def set_emit(mat, v):
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            n.inputs['Emission Strength'].default_value = v

# ───────────────────────── Geometría ─────────────────────────
def rr_points(w, h, r, seg=10):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def link(obj, parent=None):
    scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj

def empty(name, parent=None):
    return link(bpy.data.objects.new(name, None), parent)

def rr_plane(name, w, h, r, mat, parent=None, z=0.0):
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
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY'); pts = rr_points(w, h, r, 12)
    sp.points.add(len(pts) - 1)
    for p, (x, y) in zip(sp.points, pts):
        p.co = (x, y, 0, 1)
    sp.use_cyclic_u = True
    cu.bevel_depth = thick; cu.bevel_resolution = 3; cu.fill_mode = 'FULL'
    o = link(bpy.data.objects.new(name, cu), parent)
    cu.materials.append(mat)
    return o

# ───────────────────────── Paleta y materiales ─────────────────────────
M = {}
M['paper'] = screen_mat('paper', ['sheet_01.png'], emit=0.0, rough=0.85)
M['slab_body'] = principled_mat('slab_body', '#F4F4F1', rough=0.38, coat=0.35)
M['slab_screen'] = screen_mat('slab_screen', ['slab_graphite.png', 'slab_ink.png', 'ui_slab.png'], emit=0.0, rough=0.4)
M['pencil_body'] = principled_mat('pencil_body', '#0B0B0F', rough=0.42, coat=0.6)
M['pencil_wood'] = principled_mat('pencil_wood', '#E7E0D2', rough=0.7)
M['pencil_lead'] = principled_mat('pencil_lead', '#2A2A30', rough=0.35, metal=0.4)
M['pencil_band'] = principled_mat('pencil_band', '#C9C9CF', rough=0.3, metal=0.9)
M['alu'] = principled_mat('alu', '#D5D6DB', rough=0.3, metal=0.85)
M['alu_dark'] = principled_mat('alu_dark', '#B9BBC2', rough=0.35, metal=0.85)
M['black_glass'] = principled_mat('black_glass', '#0B0B0F', rough=0.12, coat=0.6)
M['deck'] = principled_mat('deck', '#2A2A30', rough=0.55)
M['trackpad'] = principled_mat('trackpad', '#C5C6CC', rough=0.25, metal=0.6)
M['phone_screen'] = screen_mat('phone_screen', ['phone_ui.png'], emit=0.97, rough=0.15)
M['laptop_screen'] = screen_mat('laptop_screen', ['laptop_ui.png'], emit=0.97, rough=0.15)
M['live'] = principled_mat('live', '#FF5A1F', rough=0.3, emission='#FF5A1F', emit=1.6)
M['live_halo'] = principled_mat('live_halo', '#FF5A1F', rough=0.5, emission='#FF5A1F', emit=1.0)

LAYER_KEYS = ['ui', 'logic', 'data', 'auto']
for i, k in enumerate(LAYER_KEYS):
    M[f'glass_{i}'] = principled_mat(f'glass_{i}', '#FFFFFF', rough=0.2, transmission=1.0, ior=1.45)
    M[f'print_{i}'] = screen_mat(f'print_{i}', [f'layer_{k}.png'], emit=0.92, rough=0.3, alpha_from_image=True)
    M[f'edge_{i}'] = principled_mat(f'edge_{i}', '#2B3BFF', rough=0.3, emission='#2B3BFF', emit=0.0)

# ───────────────────────── Objetos ─────────────────────────
SHEET_W, SHEET_H = 1.5, 2.0
SX, SY, SW, SH = SKETCH['screen']
SCREEN_CENTER = Vector(((SX + SW / 2) / 1000 - SHEET_W / 2, SHEET_H / 2 - (SY + SH / 2) / 1000, 0))
SLAB_W, SLAB_H, SLAB_T, SLAB_R = 0.9, 1.2, 0.04, 0.064

# Suelo invisible que solo recoge sombras
floor_me = bpy.data.meshes.new('floor'); bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=12); bm.to_mesh(floor_me); bm.free()
floor = link(bpy.data.objects.new('floor', floor_me))
floor.is_shadow_catcher = True
floor_me.materials.append(principled_mat('floor', '#FFFFFF', rough=1.0))

# Hoja
sheet = rr_plane('sheet', SHEET_W, SHEET_H, 0.004, M['paper'])
sheet.location.z = 0.0012
sol = sheet.modifiers.new('solid', 'SOLIDIFY'); sol.thickness = 0.0025; sol.offset = -1

# Lápiz (eje local +Z desde la punta)
pencil = empty('pencil')
def cyl(name, r, depth, verts, mat, z0, cone_r2=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    if cone_r2 is None:
        bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=depth)
    else:
        bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=cone_r2, depth=depth)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, z0 + depth / 2))
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me), pencil)
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = verts > 8
    return o
from mathutils import Matrix as _Mx
_flip = _Mx.Rotation(math.pi, 4, 'X')
lead = cyl('pencil_lead', 0.0045, 0.012, 16, M['pencil_lead'], 0.0, cone_r2=0.0)
lead.data.transform(_flip); lead.location.z = 0.012
wood = cyl('pencil_wood', 0.0165, 0.05, 32, M['pencil_wood'], 0.012, cone_r2=0.0045)
wood.data.transform(_flip); wood.location.z = 0.012 + 0.05 + 0.012
cyl('pencil_body', 0.0165, 0.62, 6, M['pencil_body'], 0.062, None)
cyl('pencil_band', 0.0168, 0.03, 32, M['pencil_band'], 0.682, None)

# Losa
slab = empty('slab')
slab_body = rr_box('slab_body', SLAB_W, SLAB_H, SLAB_T, SLAB_R, M['slab_body'], slab, edge=0.008)
slab_screen = rr_plane('slab_screen', SLAB_W - 0.002, SLAB_H - 0.002, SLAB_R, M['slab_screen'], slab, z=SLAB_T / 2 + 0.0008)

# Capas
layers_root = empty('layers_root')
layers = []
LAYER_T = 0.022
for i, k in enumerate(LAYER_KEYS):
    g = empty(f'layer_{k}', layers_root)
    rr_box(f'glass_{k}', SLAB_W, SLAB_H, LAYER_T, SLAB_R, M[f'glass_{i}'], g, edge=0.005)
    rr_plane(f'print_{k}', SLAB_W - 0.06, SLAB_H - 0.06, SLAB_R - 0.02, M[f'print_{i}'], g, z=LAYER_T / 2 + 0.0012)
    rr_outline(f'edge_{k}', SLAB_W + 0.004, SLAB_H + 0.004, SLAB_R + 0.002, M[f'edge_{i}'], g)
    layers.append(g)

# Dispositivos
devices = empty('devices')
# Portátil
laptop = empty('laptop', devices)
LB_W, LB_D, LB_T = 1.62, 1.08, 0.034
rr_box('laptop_base', LB_W, LB_D, LB_T, 0.05, M['alu'], laptop, edge=0.008)
deck = rr_plane('laptop_deck', 1.42, 0.5, 0.03, M['deck'], laptop, z=LB_T / 2 + 0.0006); deck.location.y = 0.2
pad = rr_plane('laptop_pad', 0.52, 0.3, 0.03, M['trackpad'], laptop, z=LB_T / 2 + 0.0006); pad.location.y = -0.28
hinge = empty('laptop_hinge', laptop); hinge.location = (0, LB_D / 2 - 0.01, LB_T / 2)
lid = empty('laptop_lid', hinge)
LL_H = 1.04
lid_body = rr_box('laptop_lid_body', LB_W, LL_H, 0.022, 0.05, M['alu_dark'], lid, edge=0.006); lid_body.location = (0, -LL_H / 2, 0.011)
bez = rr_plane('laptop_bezel', LB_W - 0.04, LL_H - 0.04, 0.035, M['black_glass'], lid, z=-0.0005); bez.location.y = -LL_H / 2
bez.rotation_euler.x = math.pi
lscr = rr_plane('laptop_screen', 1.5, 0.9375, 0.012, M['laptop_screen'], lid, z=-0.0012); lscr.location.y = -LL_H / 2 - 0.01
lscr.rotation_euler.x = math.pi
# Móvil
phone = empty('phone', devices)
PH_W, PH_H, PH_T = 0.52, 1.06, 0.05
rr_box('phone_body', PH_W, PH_H, PH_T, 0.085, M['alu'], phone, edge=0.012)
rr_plane('phone_glass', PH_W - 0.012, PH_H - 0.012, 0.08, M['black_glass'], phone, z=PH_T / 2 + 0.0006)
rr_plane('phone_screen', 0.475, 1.03, 0.066, M['phone_screen'], phone, z=PH_T / 2 + 0.0012)
live = empty('live', phone); live.location = (0.12, 0.39, PH_T / 2 + 0.006)
me = bpy.data.meshes.new('live_dot'); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=0.017); bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
live_dot = link(bpy.data.objects.new('live_dot', me), live); me.materials.append(M['live'])
halo = rr_plane('live_halo', 0.07, 0.07, 0.035, M['live_halo'], live, z=-0.004)

# ───────────────────────── Luz y mundo ─────────────────────────
world = bpy.data.worlds.new('studio'); scene.world = world; world.use_nodes = True
wn = world.node_tree
for n in list(wn.nodes):
    if n.type != 'OUTPUT_WORLD':
        wn.nodes.remove(n)
lp = node(wn, 'ShaderNodeLightPath', (-600, 0))
mx = node(wn, 'ShaderNodeMath', (-350, 100), operation='MAXIMUM')
wn.links.new(lp.outputs['Is Camera Ray'], mx.inputs[0]); wn.links.new(lp.outputs['Is Transmission Ray'], mx.inputs[1])
bg_light = node(wn, 'ShaderNodeBackground', (-200, -100)); bg_light.inputs['Color'].default_value = lin('#FFFFFF'); bg_light.inputs['Strength'].default_value = 0.42
bg_cam = node(wn, 'ShaderNodeBackground', (-200, 150)); bg_cam.inputs['Color'].default_value = (1, 1, 1, 1); bg_cam.inputs['Strength'].default_value = 1.0
wmix = node(wn, 'ShaderNodeMixShader', (100, 0))
wn.links.new(mx.outputs[0], wmix.inputs[0]); wn.links.new(bg_light.outputs[0], wmix.inputs[1]); wn.links.new(bg_cam.outputs[0], wmix.inputs[2])
wn.links.new(wmix.outputs[0], wn.nodes['World Output'].inputs['Surface'])

def area(name, loc, energy, size, size_y=None, target=(0, 0, 0.5), shadow=True):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = energy
    if hasattr(ld, 'use_shadow'): ld.use_shadow = shadow
    if hasattr(ld, 'cycles') and hasattr(ld.cycles, 'cast_shadow'): ld.cycles.cast_shadow = shadow
    ld.shape = 'RECTANGLE' if size_y else 'SQUARE'; ld.size = size
    if size_y: ld.size_y = size_y
    o = link(bpy.data.objects.new(name, ld)); o.location = loc
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o
key = area('key', (-1.8, -1.6, 6.0), float(arg('key', '360')), 6.5)
fill = area('fill', (4.0, -3.6, 2.2), float(arg('fill', '90')), 6.0, shadow=False)
rim = area('rim', (1.5, 4.5, 3.2), float(arg('rim', '160')), 3.0, 1.2, shadow=False)

# ───────────────────────── Cámara ─────────────────────────
cam_data = bpy.data.cameras.new('cam'); cam = link(bpy.data.objects.new('cam', cam_data)); scene.camera = cam
cam_data.sensor_width = 36; cam_data.clip_start = 0.05; cam_data.clip_end = 100
if CAM == 'mobile':
    cam_data.sensor_fit = 'HORIZONTAL'
    scene.render.resolution_x, scene.render.resolution_y = 720, 900
else:
    cam_data.sensor_fit = 'AUTO'
    scene.render.resolution_x, scene.render.resolution_y = 1200, 1200
scene.render.resolution_percentage = int(100 * SCALE)

# (frame, (az°, el°, dist, tx, ty, tz, shift_y, lens))
CAM_KEYS = {
    'desktop': [
        (1, (3, 58, 6.7, 0.0, 0.0, 0.0, 0.21, 50)),
        (14, (5, 56, 6.45, 0.0, 0.0, 0.0, 0.205, 50)),
        (19, (6, 55, 6.3, 0.0, 0.0, 0.02, 0.2, 50)),
        (36, (3, 30, 3.85, 0.0, 0.0, 0.55, 0.06, 50)),
        (56, (-2, 11, 3.3, 0.0, 0.0, 0.93, 0.0, 50)),
        (61, (-3, 11, 3.28, 0.0, 0.0, 0.93, 0.0, 50)),
        (80, (-15, 25, 4.0, 0.0, 0.0, 0.95, 0.0, 50)),
        (96, (-25, 31, 4.75, 0.0, 0.0, 1.0, 0.0, 50)),
        (99, (-26, 31, 4.75, 0.0, 0.0, 1.0, 0.0, 50)),
        (118, (-11, 19, 4.45, 0.0, 0.05, 0.8, 0.0, 50)),
        (135, (0, 13, 4.4, 0.0, 0.05, 0.78, 0.0, 50)),
        (150, (0, 12, 4.3, 0.0, 0.05, 0.78, 0.0, 50)),
    ],
}
# Móvil: mismo recorrido, algo más lejos para el ancho y encuadre centrado arriba
CAM_KEYS['mobile'] = [(f, (az, el, d, tx, ty, tz, sy * 0.8, lens * 1.1)) for f, (az, el, d, tx, ty, tz, sy, lens) in CAM_KEYS['desktop']]

def pose_camera(f):
    az, el, dist, tx, ty, tz, sy, lens = catmull(CAM_KEYS[CAM], f)
    a, e = math.radians(az), math.radians(el)
    target = Vector((tx, ty, tz))
    loc = target + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * dist
    cam.location = loc
    cam.rotation_euler = (target - loc).to_track_quat('-Z', 'Y').to_euler()
    cam_data.lens = lens
    cam_data.shift_y = sy

# ───────────────────────── Coreografía (§7.3) ─────────────────────────
PENCIL_DIR = Vector((0.5, 0.42, 0.76)).normalized()
SHEET_IMAGES = [img(f'sheet_{i:02d}.png') for i in range(1, 20)]

def sheet_uv_to_world(u, v):
    return Vector(((u - 0.5) * SHEET_W, (0.5 - v) * SHEET_H, 0.0037))

def set_hidden(o, hidden):
    o.hide_render = hidden
    for c in o.children_recursive:
        c.hide_render = hidden

def pose(f):
    t = f  # tiempo en frames
    breathe = math.sin(t * 0.21)

    # ── Hoja y boceto (S1–S3) ──
    k = int(clamp(round(f), 1, 19))
    M['paper'].node_tree.nodes['TEX_0'].image = SHEET_IMAGES[k - 1]
    sheet_a = 1 - seg(f, 24, 38, ease_io)
    set_alpha(M['paper'], sheet_a)
    set_hidden(sheet, sheet_a <= 0.001)

    # ── Lápiz ──
    uv = SKETCH['pencil'][str(k)]
    tip = sheet_uv_to_world(uv['u'], uv['v'])
    lift = seg(f, 19, 27, ease_io)
    wob = Vector((math.sin(t * 1.3) * 0.004, math.cos(t * 1.7) * 0.004, 0))
    pencil.location = tip + wob * (1 - lift) + Vector((0.55, 0.25, 0.65)) * lift
    tilt = PENCIL_DIR.lerp(Vector((0.35, 0.3, 0.88)).normalized(), lift).normalized()
    pencil.rotation_euler = tilt.to_track_quat('Z', 'Y').to_euler()
    pa = 1 - seg(f, 22, 27, ease_io)
    for mk in ('pencil_body', 'pencil_wood', 'pencil_lead', 'pencil_band'):
        set_alpha(M[mk], pa)
    set_hidden(pencil, pa <= 0.001)

    # ── Losa (S3–S4) ──
    s_on = f >= 19 and f < 72
    set_hidden(slab, not s_on)
    rise = seg(f, 19, 56, ease_io)
    p0 = SCREEN_CENTER + Vector((0, 0, 0.0035 + SLAB_T * 0.5 * 0.06))
    p1 = Vector((0, 0, 0.95))
    pos = p0.lerp(p1, rise)
    pos.z += 0.18 * math.sin(math.pi * rise) * 0.35  # arco suave al elevarse
    if f >= 56:
        pos.z += 0.008 * breathe
    slab.location = pos
    slab.rotation_euler = (math.radians(80) * seg(f, 21, 54, ease_io), 0, math.radians(-3) * seg(f, 30, 56, ease_io))
    thick = lerp(0.06, 1.0, seg(f, 19, 30, ease_io))
    slab_body.scale.z = thick
    slab_screen.location.z = SLAB_T / 2 * thick + 0.0008
    set_mix(M['slab_screen'], 1, seg(f, 24, 33, ease_io))  # grafito → tinta
    set_mix(M['slab_screen'], 2, seg(f, 31, 50, ease_io))  # tinta → interfaz
    set_lit(M['slab_screen'], 0.97 * seg(f, 33, 50, ease_io))
    slab_a = 1 - seg(f, 61, 70, ease_io)
    set_alpha(M['slab_body'], slab_a); set_alpha(M['slab_screen'], slab_a)

    # ── Capas (S5–S7) ──
    l_on = f >= 61 and f < 126
    set_hidden(layers_root, not l_on)
    open_ = seg(f, 61, 93, ease_io) * (1 - seg(f, 99, 113, ease_io))
    to_phone = seg(f, 108, 124, ease_io)
    base_rot = Vector((math.radians(80), 0, math.radians(-3)))
    iso_rot = Vector((math.radians(24), 0, math.radians(-30)))
    rot = base_rot.lerp(iso_rot, seg(f, 61, 95, ease_io))
    rot = rot.lerp(base_rot, seg(f, 99, 116, ease_io))
    lpos = Vector((0, 0, 0.95 + 0.008 * breathe))
    # Hacia el móvil: posición/escala del móvil dentro de "devices"
    dev_m = devices_matrix(f)
    phone_world = dev_m @ PHONE_LOCAL
    lpos = lpos.lerp(phone_world.to_translation(), to_phone)
    layers_root.location = lpos
    if to_phone > 0:
        pe = phone_world.to_euler()
        rot = Vector(rot).lerp(Vector((pe.x, pe.y, pe.z)), to_phone)
    layers_root.rotation_euler = tuple(rot)
    sc = Vector((1, 1, 1)).lerp(Vector((PH_W / SLAB_W, PH_H / SLAB_H, 1)), to_phone)
    layers_root.scale = sc
    sep = 0.42 * open_
    for i, g in enumerate(layers):
        g.location = (0, (1.5 - i) * 0.22 * open_, (1.5 - i) * (LAYER_T + 0.004 + sep))
    g_in = seg(f, 61, 66, ease_io)
    g_out = 1 - seg(f, 116, 125, ease_io)
    for i in range(4):
        a = g_in * g_out
        set_alpha(M[f'glass_{i}'], a)
        set_alpha(M[f'print_{i}'], a * (1.0 if i == 0 else seg(f, 66, 84, ease_io)))
        set_alpha(M[f'edge_{i}'], a)
        # borde ultramar que se ilumina capa a capa (S6)
        glow = seg(f, 82 + i * 3, 90 + i * 3, ease_io) * (1 - seg(f, 104, 112, ease_io))
        set_emit(M[f'edge_{i}'], 3.5 * glow + 0.6 * glow * (0.5 + 0.5 * math.sin(t * 0.6 + i)))

    # ── Dispositivos (S7–S8) ──
    d_on = f >= 104
    set_hidden(devices, not d_on)
    devices.matrix_world = dev_m
    lap_s = ease_out(norm(f, 104, 122))
    laptop.scale = (max(lap_s, 1e-4),) * 3
    hinge.rotation_euler.x = math.radians(lerp(-20, -105, seg(f, 106, 130, ease_io)))
    ph_s = ease_out(norm(f, 112, 127))
    phone.scale = (max(ph_s, 1e-4),) * 3
    # Punto "live"
    pulse = 0.5 + 0.5 * math.sin(t * 0.55)
    live_on = seg(f, 132, 140, ease_io)
    live.scale = (max(live_on * (1 + 0.25 * pulse), 1e-4),) * 3
    halo.scale = (max(live_on * (1 + 1.0 * pulse), 1e-4),) * 3
    set_alpha(M['live_halo'], 0.28 * (1 - pulse) * live_on)

from mathutils import Matrix, Euler
PHONE_LOCAL = Matrix.Translation((0.78, -0.42, 0.06)) @ Euler((math.radians(78), 0, math.radians(-14)), 'XYZ').to_matrix().to_4x4()
LAPTOP_LOCAL = Matrix.Translation((-0.28, 0.3, -0.34)) @ Euler((math.radians(8), 0, math.radians(6)), 'XYZ').to_matrix().to_4x4()

def devices_matrix(f):
    spin = math.radians(lerp(-38, -6, seg(f, 104, 140, ease_io)))
    bob = 0.01 * math.sin(f * 0.21)
    return Matrix.Translation((0.0, 0.0, 0.74 + bob)) @ Matrix.Rotation(spin, 4, 'Z')

phone.matrix_parent_inverse = Matrix.Identity(4)
laptop.matrix_parent_inverse = Matrix.Identity(4)
phone.location = PHONE_LOCAL.to_translation(); phone.rotation_euler = PHONE_LOCAL.to_euler()
laptop.location = LAPTOP_LOCAL.to_translation(); laptop.rotation_euler = LAPTOP_LOCAL.to_euler()

# ───────────────────────── Render ─────────────────────────
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

if ENGINE == 'cycles':
    r.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.refresh_devices()
    for dv in prefs.devices:
        dv.use = dv.type == 'METAL'
    c = scene.cycles
    c.device = 'GPU'
    c.samples = SAMPLES
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
    scene.eevee.taa_render_samples = SAMPLES
    scene.eevee.use_raytracing = True

out_dir = os.path.join(OUT, CAM)
os.makedirs(out_dir, exist_ok=True)
t0 = time.time()
for i, f in enumerate(FRAMES):
    scene.frame_set(f)
    pose(f)
    pose_camera(f)
    r.filepath = os.path.join(out_dir, f'{f:04d}.png')
    ts = time.time()
    bpy.ops.render.render(write_still=True)
    print(f'[hero] {CAM} frame {f:03d} ({i + 1}/{len(FRAMES)}) {time.time() - ts:.1f}s', flush=True)
print(f'[hero] done {len(FRAMES)} frames in {time.time() - t0:.1f}s', flush=True)

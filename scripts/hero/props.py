"""
Objetos animados por scroll para las secciones de la home (después del hero).
Cada objeto se renderiza aislado, con fondo transparente, como una secuencia corta.

Uso (desde la raíz del proyecto):
  blender -b --factory-startup --python scripts/hero/props.py -- --prop <nombre> [--samples 32] [--res 640]
  blender -b --factory-startup --python scripts/hero/props.py -- --list

Salida: assets/props_src/<nombre>/NNNN.png (RGBA) + meta.json. `node scripts/build-props.mjs` los
convierte a WebP con alfa en public/props/<nombre>/.

Trazo del lápiz (Para quién, Manifiesto, Proceso y Tecnología): pencil (temblor, en bucle), bead.
Iconos de servicio (01 — Servicios): idea, puzzle, ai-sphere, ring.
Profundidad (02 — Proyectos, 05 — Laboratorio y 06 — Preguntas): float-glass, float-card,
float-sheet, float-ring, float-cube.
"""
import os, sys, math, json
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts/hero'))
import studio as S
import bpy
from mathutils import Vector, Euler

PROPS = {}


def prop(name, frames, res=640, shadow=True, tex='assets/hero/textures'):
    def deco(fn):
        PROPS[name] = dict(build=fn, frames=frames, res=res, shadow=shadow, tex=tex)
        return fn
    return deco


TAU = 2 * math.pi
R = math.radians

# ───────────────────────── Trazo del lápiz ─────────────────────────

@prop('pencil', frames=24, res=512)
def build_pencil():
    """Lápiz de la home apoyado en la punta (origen), inclinado hacia arriba-derecha. Temblor en bucle."""
    m = {
        'body': S.principled_mat('p_body', '#0B0B0F', rough=0.42, coat=0.6),
        'wood': S.principled_mat('p_wood', '#E7E0D2', rough=0.7),
        'lead': S.principled_mat('p_lead', '#2A2A30', rough=0.35, metal=0.4),
        'band': S.principled_mat('p_band', '#C9C9CF', rough=0.3, metal=0.9),
    }
    root = S.empty('pencil')
    from mathutils import Matrix
    flip = Matrix.Rotation(math.pi, 4, 'X')
    lead = S.cylinder('lead', 0.0045, 0.012, m['lead'], root, verts=16, r2=0.0)
    lead.data.transform(flip); lead.location.z = 0.012
    wood = S.cylinder('wood', 0.0165, 0.05, m['wood'], root, verts=32, r2=0.0045, z0=0.012)
    wood.data.transform(flip); wood.location.z = 0.012 + 0.05 + 0.012
    S.cylinder('body', 0.0165, 0.62, m['body'], root, verts=6, z0=0.062, smooth_shade=False)
    S.cylinder('band', 0.0168, 0.03, m['band'], root, verts=32, z0=0.682)
    S.shadow_floor(0)

    def pose(f):
        t = TAU * (f - 1) / 24
        d = Vector((0.5 + 0.035 * math.sin(t), 0.42 + 0.03 * math.cos(t), 0.76)).normalized()
        root.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        root.location = (0.002 * math.sin(2 * t), 0.002 * math.cos(t), 0)
    # Encuadre: punta abajo-izquierda, cuerpo hacia arriba-derecha
    keys = [(1, (6, 52, 1.55, 0.2, 0.17, 0.27, 0.0, 50))]
    anchor = Vector((0, 0, 0))
    return pose, keys, anchor


@prop('bead', frames=1, res=256)
def build_bead():
    S.sphere('bead', 0.05, S.principled_mat('bead', '#2B3BFF', rough=0.18, coat=1.0), None).location = (0, 0, 0.05)
    S.shadow_floor(0)
    return (lambda f: None), [(1, (0, 34, 0.42, 0, 0, 0.045, 0.0, 50))], None


# ───────────────────────── Iconos de servicio (giran) ─────────────────────────

def _turntable_keys(dist=2.0, tz=0.0, el=18):
    return [(1, (0, el, dist, 0, 0, tz, 0.0, 50))]


@prop('idea', frames=36)
def build_idea():
    """Tarjeta de idea (MVP) girando."""
    S.set_texture_dir('assets/hero/textures/mvp')
    root = S.empty('idea_root')
    S.card('idea', 0.62, 0.44, 0.03, 0.05, S.principled_mat('ib', '#FFFFFF', rough=0.4, coat=0.3), S.screen_mat('if', ['idea_04.png'], lit=0.9), root)
    S.rr_outline('iedge', 0.624, 0.444, 0.052, S.emissive_mat('ie', '#2B3BFF', 1.2), root, thick=0.003).location.z = 0.0
    S.shadow_floor(-0.45)

    def pose(f):
        t = (f - 1) / 36
        root.rotation_euler = (R(72), 0, R(360 * t))
    return pose, _turntable_keys(2.1, -0.05, 14), None


@prop('puzzle', frames=36)
def build_puzzle():
    """Pieza de puzle (software a medida) girando."""
    white = S.principled_mat('pz', '#FFFFFF', rough=0.35, coat=0.3)
    root = S.empty('pz_root')
    S.rr_box('pz_base', 0.48, 0.48, 0.09, 0.05, white, root, edge=0.01)
    for name, (x, y) in {'k1': (0.29, 0.0), 'k2': (0.0, 0.29)}.items():
        k = S.cylinder(name, 0.085, 0.09, white, root, verts=48, z0=-0.045); k.location = (x, y, 0)
    S.rr_outline('pz_edge', 0.484, 0.484, 0.052, S.emissive_mat('pze', '#2B3BFF', 1.6), root, thick=0.004).location.z = 0.046
    S.shadow_floor(-0.42)

    def pose(f):
        t = (f - 1) / 36
        root.rotation_euler = (R(28), 0, R(360 * t))
    return pose, _turntable_keys(2.0, -0.05, 26), None


@prop('ai-sphere', frames=36)
def build_ai_sphere():
    """Esfera de IA (automatización): vidrio esmerilado, núcleo ultramar y datos en órbita."""
    S.sphere('glass', 0.3, S.glass_mat('aig', rough=0.24), None)
    core_m = S.emissive_mat('core', '#2B3BFF', 3.0)
    S.sphere('core', 0.11, core_m, None)
    packets = []
    for i, col in enumerate(('#0B0B0F', '#2B3BFF', '#B9BBC2')):
        p = S.rr_box(f'pk{i}', 0.08, 0.06, 0.012, 0.012, S.principled_mat(f'pk{i}', col, rough=0.35), None, edge=0.003)
        packets.append(p)
    S.shadow_floor(-0.52)

    def pose(f):
        t = (f - 1) / 36
        S.set_emit(core_m, 2.6 + 1.2 * (0.5 + 0.5 * math.sin(TAU * t * 2)))
        for i, p in enumerate(packets):
            a = TAU * (t + i / 3)
            v = Vector((0.5 * math.cos(a), 0.5 * math.sin(a), 0))
            v.rotate(Euler((R(68), 0, R(-15))))
            p.location = v
            p.rotation_euler = (R(68), 0, a + R(90))
    return pose, _turntable_keys(2.2, -0.02, 14), None


@prop('ring', frames=36)
def build_ring():
    """Anillo ultramar satinado (productos creativos) girando."""
    root = S.empty('ring_root')
    S.torus('ring', 0.32, 0.085, S.principled_mat('ringm', '#2B3BFF', rough=0.25, coat=0.6), root)
    S.shadow_floor(-0.5)

    def pose(f):
        t = (f - 1) / 36
        root.rotation_euler = (R(72 + 14 * math.sin(TAU * t)), R(10), R(360 * t))
    return pose, _turntable_keys(2.0, -0.04, 12), None


# ───────────────────────── Profundidad (sin suelo: flotan) ─────────────────────────

def _tumble(root, f, n=48, ax=(25, 360, 12), phase=0.0):
    t = (f - 1) / n
    root.rotation_euler = (R(ax[0] + 18 * math.sin(TAU * (t + phase))), R(ax[1] * t), R(ax[2] + 10 * math.cos(TAU * (t + phase))))


@prop('float-glass', frames=48, res=512, shadow=False)
def build_float_glass():
    root = S.empty('fg')
    S.rr_box('fg_glass', 0.6, 0.8, 0.02, 0.045, S.glass_mat('fgm', rough=0.18), root, edge=0.004)
    S.rr_plane('fg_print', 0.56, 0.76, 0.03, S.screen_mat('fgp', ['layer_ui.png'], lit=0.92, alpha_from_image=True), root, z=0.012)
    S.rr_outline('fg_edge', 0.604, 0.804, 0.047, S.emissive_mat('fge', '#2B3BFF', 1.2), root, thick=0.003)
    return (lambda f: _tumble(root, f)), _turntable_keys(2.3, 0, 8), None


@prop('float-card', frames=48, res=512, shadow=False)
def build_float_card():
    root = S.empty('fc')
    S.card('fc_card', 0.6, 0.8, 0.025, 0.045, S.principled_mat('fcb', '#FFFFFF', rough=0.38, coat=0.3), S.screen_mat('fcf', ['ui_slab.png'], lit=0.95), root)
    return (lambda f: _tumble(root, f, ax=(-20, 360, -10), phase=0.3)), _turntable_keys(2.3, 0, 8), None


@prop('float-sheet', frames=48, res=512, shadow=False)
def build_float_sheet():
    root = S.empty('fs')
    sh = S.rr_plane('fs_sheet', 0.6, 0.8, 0.004, S.screen_mat('fsm', ['sheet_19.png'], lit=0.0, rough=0.85), root)
    sol = sh.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.003

    def pose(f):
        t = (f - 1) / 48
        root.rotation_euler = (R(40 + 20 * math.sin(TAU * t)), R(360 * t), R(15 * math.sin(TAU * t + 1)))
    return pose, _turntable_keys(2.3, 0, 8), None


@prop('float-ring', frames=48, res=512, shadow=False)
def build_float_ring():
    root = S.empty('fr')
    S.torus('fr_ring', 0.3, 0.08, S.principled_mat('frm', '#2B3BFF', rough=0.25, coat=0.6), root)
    return (lambda f: _tumble(root, f, ax=(60, 360, 20), phase=0.6)), _turntable_keys(2.1, 0, 8), None


@prop('float-cube', frames=48, res=512, shadow=False)
def build_float_cube():
    root = S.empty('fk')
    S.rr_box('fk_cube', 0.34, 0.34, 0.34, 0.07, S.principled_mat('fkm', '#0B0B0F', rough=0.3, coat=0.7), root, edge=0.04)

    def pose(f):
        t = (f - 1) / 48
        root.rotation_euler = (R(360 * t), R(30), R(360 * t))
    return pose, _turntable_keys(1.9, 0, 8), None

# ───────────────────────── Render ─────────────────────────

def main():
    if '--list' in sys.argv:
        print('[props]', ' '.join(PROPS)); return
    name = S.arg('prop')
    if name not in PROPS:
        raise SystemExit(f'--prop debe ser uno de: {", ".join(PROPS)}')
    spec = PROPS[name]
    samples = int(S.arg('samples', '32'))
    res = int(S.arg('res', str(spec['res'])))
    out_dir = os.path.abspath(os.path.join(S.arg('out', 'assets/props_src'), name))
    os.makedirs(out_dir, exist_ok=True)

    S.reset_scene(spec['frames'])
    S.set_texture_dir(spec['tex'])
    S.studio_world(0.5 if not spec['shadow'] else 0.42)
    S.studio_lights(target=(0, 0, 0.2))
    pose, keys, anchor = spec['build']()

    S.make_camera('desktop')
    sc = S.scene
    sc.render.resolution_x = sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    S.setup_render(samples)

    meta = {'name': name, 'frames': spec['frames'], 'size': res}
    from bpy_extras.object_utils import world_to_camera_view
    frames = S.parse_frames(S.arg('frames', 'all'), spec['frames'])
    for f in frames:
        sc.frame_set(f)
        pose(f)
        S.pose_camera(keys, f)
        bpy.context.view_layer.update()
        if anchor is not None and 'anchor' not in meta:
            # Punto de anclaje (p. ej. la punta del lápiz) en coordenadas de imagen 0..1
            p = sc.objects['pencil'].matrix_world @ anchor if name == 'pencil' else anchor
            uv = world_to_camera_view(sc, sc.camera, p)
            meta['anchor'] = [round(uv.x, 4), round(1 - uv.y, 4)]
        sc.render.filepath = os.path.join(out_dir, f'{f:04d}.png')
        bpy.ops.render.render(write_still=True)
        print(f'[props] {name} {f}/{spec["frames"]}', flush=True)
    if len(frames) == spec['frames']:
        with open(os.path.join(out_dir, 'meta.json'), 'w') as fh:
            json.dump(meta, fh)
    print(f'[props] {name} DONE', flush=True)


main()

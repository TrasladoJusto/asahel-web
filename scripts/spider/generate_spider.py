"""ARAÑA DEV - Fase C - Blender 5.2 headless.
Uso: blender --background --python generate_spider.py [--render-only]
Contrato three.js: Spider_Root, Abdomen, Cephalothorax, Eye_L/R(+Pupil),
MinorEye_i, Fang_L/R, Pedipalp_L/R, Leg_{L|R}{i}_Root->_Femur->_Knee->_Tibia.
Materiales neutros BODY/LEG/DARK/EYE_GLOW -> runtime los tine.
"""
import bpy, os, sys, math

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
RENDER_ONLY = "--render-only" in argv
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_GLB = os.path.abspath(os.path.join(HERE, "..", "..", "public", "models", "arana-dev.glb"))
PREVIEWS = "/tmp/spider_previews"
os.makedirs(PREVIEWS, exist_ok=True)
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def mat_p(name, color, metallic=0.0, roughness=0.5, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1.0)
        b.inputs["Emission Strength"].default_value = strength
    return m

MAT_BODY = mat_p("BODY", (0.88, 0.90, 0.92), 0.45, 0.28)
MAT_LEG  = mat_p("LEG",  (0.70, 0.73, 0.77), 0.50, 0.32)
MAT_DARK = mat_p("DARK", (0.055, 0.06, 0.075), 0.2, 0.45)
MAT_EYE  = mat_p("EYE_GLOW", (1, 1, 1), 0.0, 0.2, (1, 1, 1), 3.0)

def link(parent, child):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()

def new_empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    scene.collection.objects.link(e)
    return e

def smooth_sphere(name, r, loc, scale=(1, 1, 1), mat=MAT_BODY, segs=24, rings=14):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    return o

def skin_limb(name, points, radii, mat=MAT_LEG):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points, [(i, i + 1) for i in range(len(points) - 1)], [])
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    sk_mod = obj.modifiers.new("Skin", 'SKIN')
    for i, r in enumerate(radii):
        obj.data.skin_vertices[0].data[i].radius = (r, r)
    sub = obj.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 1
    dec = obj.modifiers.new("Decimate", 'DECIMATE')
    dec.ratio = 0.65
    obj.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    from mathutils import Matrix, Vector
    p0 = Vector(points[0])
    obj.data.transform(Matrix.Translation(-p0))
    obj.location = points[0]
    return obj

if not RENDER_ONLY:
    root = new_empty("Spider_Root", (0, 0, 0))

    abdomen = smooth_sphere("Abdomen", 0.9, (0, -0.52, 1.06), (0.98, 0.92, 1.10))
    link(root, abdomen)
    pedicel = smooth_sphere("Pedicel", 0.22, (0, 0.18, 1.02), (0.8, 1.0, 0.7), MAT_DARK)
    link(root, pedicel)
    cephalo = smooth_sphere("Cephalothorax", 0.62, (0, 0.52, 1.06), (1.0, 1.05, 0.82))
    link(root, cephalo)

    for s, sx in (("L", -1), ("R", 1)):
        eye = smooth_sphere("Eye_" + s, 0.21, (sx * 0.235, 0.95, 1.26), (1, 0.9, 1), MAT_EYE)
        link(root, eye)
        pupil = smooth_sphere("Pupil_" + s, 0.105, (sx * 0.235, 1.10, 1.265), (1, 0.6, 1), MAT_DARK, segs=14, rings=10)
        pupil.parent = eye
        pupil.matrix_parent_inverse = eye.matrix_world.inverted()

    for i in range(6):
        a = math.radians(-58 + i * (116 / 5))
        mx = math.sin(a) * 0.55
        mz = 1.42 + math.cos(a) * 0.16
        m = smooth_sphere("MinorEye_%d" % i, 0.055, (mx, 0.98, mz), (1, 1, 1), MAT_EYE, segs=10, rings=8)
        link(root, m)

    for s, sx in (("L", -1), ("R", 1)):
        fang = skin_limb("Fang_" + s,
            [(sx * 0.17, 0.98, 0.92), (sx * 0.21, 0.86, 0.66)],
            [0.075, 0.02], MAT_DARK)
        link(root, fang)
        pp = skin_limb("Pedipalp_" + s,
            [(sx * 0.40, 0.88, 0.88), (sx * 0.52, 0.78, 0.60), (sx * 0.48, 0.72, 0.46)],
            [0.09, 0.07, 0.05], MAT_BODY)
        link(root, pp)

    # PATAS x8: Root(empty@ancla) > Femur(mesh) > Knee(empty@codo) > Tibia(mesh)
    ANCH_Y  = [0.34, 0.10, -0.16, -0.38]
    KNEE_OUT = [1.05, 1.30, 1.45, 1.35]
    KNEE_Z   = [2.00, 2.00, 1.82, 1.70]
    FOOT_X   = [1.85, 2.30, 2.55, 2.45]
    FOOT_Y   = [0.95, 0.45, -0.15, -0.80]

    for side in ("L", "R"):
        sx = -1 if side == "L" else 1
        for i in range(4):
            ax = sx * 0.48
            ay = ANCH_Y[i]
            az = 1.08
            knee = (sx * KNEE_OUT[i], AY := ANCH_Y[i] * 0.35, KNEE_Z[i])
            foot = (sx * FOOT_X[i], FOOT_Y[i], 0.03)

            r_empty = new_empty("Leg_%s%d_Root" % (side, i), (ax, ay, az))
            link(root, r_empty)

            femur_mid = ((ax + knee[0]) / 2 + sx * 0.14,
                         (ay + knee[1]) / 2,
                         (az + knee[2]) / 2 + 0.12)
            femur = skin_limb("Leg_%s%d_Femur" % (side, i),
                              [(ax, ay, az), femur_mid, list(knee)],
                              [0.105, 0.13, 0.085])
            link(r_empty, femur)

            k_empty = new_empty("Leg_%s%d_Knee" % (side, i), knee)
            k_empty.parent = r_empty
            k_empty.matrix_parent_inverse = r_empty.matrix_world.inverted()

            tib_mid = ((knee[0] + foot[0]) / 2,
                       (knee[1] + foot[1]) / 2 - sx * 0.06,
                       (knee[2] + foot[2]) / 2 + 0.04)
            tibia = skin_limb("Leg_%s%d_Tibia" % (side, i),
                              [list(knee), tib_mid, list(foot)],
                              [0.075, 0.045, 0.016])
            link(k_empty, tibia)

    _legs = [o for o in scene.objects if o.name.startswith('Leg_')]
    print("LEG_COUNT:", len(_legs))
    for _o in _legs[:6]:
        print("LEGNODE:", _o.name, "PARENT:", _o.parent.name if _o.parent else "NONE",
              "LOC:", tuple(round(v,2) for v in _o.location))
    print("ROOT_CHILDREN_N:", len(bpy.data.objects["Spider_Root"].children))

    # Estadisticas de triangulos (mesh evaluado)
    deps = bpy.context.evaluated_depsgraph_get()
    tris = 0
    for ob in scene.objects:
        if ob.type == 'MESH':
            ev = ob.evaluated_get(deps)
            me = ev.to_mesh()
            tris += len(me.loop_triangles) if me.loop_triangles else sum(max(0, len(p.vertices) - 2) for p in me.polygons)
            ev.to_mesh_clear()
    print("TRIS:", tris)

# ── Export GLB ──
if not RENDER_ONLY:
    for ob in scene.objects:
        ob.select_set(False)
    _dbg = []
    def dbg_tree(o, d=0):
        _dbg.append('  '*d + o.name + (' [mesh:' + o.data.name + ']' if o.type=='MESH' else ' [empty]'))
        for c in o.children: dbg_tree(c, d+1)
    dbg_tree(bpy.data.objects["Spider_Root"])
    print("TREE_BEGIN"); [print("TREE|"+l) for l in _dbg]; print("TREE_END")
    print("TOTAL_OBJS:", len(scene.objects))
    def select_hierarchy(obj):
        obj.select_set(True)
        for c in obj.children:
            select_hierarchy(c)
    select_hierarchy(bpy.data.objects["Spider_Root"])
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        use_selection=True,
    )
    print("GLB_OK:", OUT_GLB, os.path.getsize(OUT_GLB), "bytes")

# ── Previews (Cycles CPU, fondo transparente) ──
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 60
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

def look_at(obj_c, target):
    d = target - obj_c.location
    import mathutils
    obj_c.rotation_euler = mathutils.Vector(d).to_track_quat('-Z', 'Y').to_euler()

key = bpy.data.objects.new("Key", bpy.data.lights.new("Key", 'AREA'))
key.data.energy = 900
key.data.size = 6
key.location = (-3, -5, 5)
scene.collection.objects.link(key)
rim = bpy.data.objects.new("Rim", bpy.data.lights.new("Rim", 'AREA'))
rim.data.energy = 500
rim.data.size = 5
rim.location = (4, 3, 3)
scene.collection.objects.link(rim)
world = bpy.data.worlds.new("W")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.06, 0.06, 0.08, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
scene.world = world

center = __import__('mathutils').Vector((0, 0.1, 1.0))
for tag, loc in (("front", (0, 7.4, 1.35)), ("quarter", (-5.0, 5.6, 2.8))):
    cam.location = loc
    look_at(cam, center)
    scene.render.filepath = os.path.join(PREVIEWS, "spider_" + tag + ".png")
    bpy.ops.render.render(write_still=True)
    print("PREVIEW:", scene.render.filepath)
print("DONE")

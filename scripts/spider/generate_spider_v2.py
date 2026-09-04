"""ARAÑA REALISTA v2 - Blender headless.
Anatomia: femur/patella/tibia/metatarso por pata, pose de alerta,
cuerpo carbon con marcas dorsales (material MARK = color de seccion).
Contrato: Leg_{L|R}{i}_Root->_Femur->_Knee->_Tibia (runtime solo deltas).
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

# Cuerpo oscuro realista; MARK neutra clara -> runtime la tine con la seccion
MAT_BODY = mat_p("BODY", (0.075, 0.08, 0.09), 0.28, 0.46)
MAT_LEG  = mat_p("LEG",  (0.055, 0.06, 0.07), 0.32, 0.5)
MAT_MARK = mat_p("MARK", (0.85, 0.86, 0.88), 0.35, 0.38)
MAT_DARK = mat_p("DARK", (0.03, 0.032, 0.04), 0.15, 0.55)
MAT_EYE  = mat_p("EYE_GLOW", (1.0, 0.96, 0.9), 0.0, 0.25, (1.0, 0.95, 0.88), 1.7)

def link(parent, child):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()

def new_empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    scene.collection.objects.link(e)
    return e

def smooth_sphere(name, r, loc, scale=(1, 1, 1), mat=MAT_BODY, segs=22, rings=13):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    return o

def skin_limb(name, points, radii, mat=MAT_LEG, dec=0.68):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points, [(i, i + 1) for i in range(len(points) - 1)], [])
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.modifiers.new("Skin", 'SKIN')
    for i, r in enumerate(radii):
        obj.data.skin_vertices[0].data[i].radius = (r, r)
    sub = obj.modifiers.new("Subsurf", 'SUBSURF')
    sub.levels = 1
    sub.render_levels = 1
    dm = obj.modifiers.new("Decimate", 'DECIMATE')
    dm.ratio = dec
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

    # Abdomen realista: ovoide esbelto, ligeramente elevado y trasero
    abdomen = smooth_sphere("Abdomen", 0.66, (0, -0.78, 1.00), (0.88, 1.32, 0.9))
    link(root, abdomen)
    # Marca dorsal (franja lobular tipo araña lobo) - material MARK
    for ci, cy in enumerate((0.05, -0.42, -0.88)):
        chev = smooth_sphere("Mark_Chev_%d" % ci, 0.19,
                             (0, -0.55 + cy * 0.0 - cy, 1.60 - abs(ci) * 0.0),
                             (0.74 - ci * 0.10, 0.42, 0.12), MAT_MARK, segs=16, rings=8)
        chev.rotation_euler = (0, 0.5, 0.9)
        link(root, chev)

    pedicel = smooth_sphere("Pedicel", 0.15, (0, 0.02, 1.00), (0.85, 1.2, 0.7), MAT_DARK, segs=16, rings=10)
    link(root, pedicel)
    cephalo = smooth_sphere("Cephalothorax", 0.40, (0, 0.36, 1.06), (1.02, 1.3, 0.7))
    link(root, cephalo)
    # Surco foveal oscuro
    groove = smooth_sphere("Ceph_Groove", 0.09, (0, 0.22, 1.36), (0.5, 1.6, 0.35), MAT_DARK, segs=12, rings=8)
    link(root, groove)

    # Ojos: 2 mayores + 6 menores (filas reales de saltarido)
    for s, sx in (("L", -1), ("R", 1)):
        eye = smooth_sphere("Eye_" + s, 0.095, (sx * 0.145, 0.70, 1.26), (1, 0.92, 1), MAT_DARK, segs=18, rings=10)
        link(root, eye)
        pupil = smooth_sphere("Pupil_" + s, 0.032, (sx * 0.150, 0.765, 1.335), (1, 0.6, 1), MAT_EYE, segs=10, rings=8)
        pupil.parent = eye
        pupil.matrix_parent_inverse = eye.matrix_world.inverted()

    minor_pos = [(-0.26, 0.60, 1.28), (-0.13, 0.66, 1.33), (0.0, 0.70, 1.345),
                 (0.13, 0.66, 1.33), (0.26, 0.60, 1.28), (-0.055, 0.60, 1.315)]
    for i, (mx, my, mz) in enumerate(minor_pos):
        m = smooth_sphere("MinorEye_%d" % i, 0.026, (mx, my, mz), (1, 1, 1), MAT_EYE, segs=10, rings=8)
        link(root, m)

    # Queliceros robustos + colmillos + pedipalpos
    for s, sx in (("L", -1), ("R", 1)):
        chel = smooth_sphere("Chelicera_" + s, 0.11, (sx * 0.115, 0.52, 0.86), (0.75, 1.5, 1.0), MAT_DARK, segs=14, rings=9)
        link(root, chel)
        fang = skin_limb("Fang_" + s,
            [(sx * 0.115, 0.50, 0.80), (sx * 0.145, 0.44, 0.60), (sx * 0.125, 0.42, 0.46)],
            [0.055, 0.035, 0.012], MAT_DARK)
        link(root, fang)
        pp = skin_limb("Pedipalp_" + s,
            [(sx * 0.28, 0.50, 0.88), (sx * 0.40, 0.42, 0.66), (sx * 0.38, 0.38, 0.48)],
            [0.075, 0.06, 0.045], MAT_BODY)
        link(root, pp)

    # Hileras
    for sx in (-1, 1):
        sp = smooth_sphere("Spinneret_%s" % ('L' if sx < 0 else 'R'), 0.055,
                           (sx * 0.09, -1.55, 0.72), (1, 1, 0.8), MAT_DARK, segs=10, rings=8)
        link(root, sp)

    # ── PATAS x8 realistas: femur-arco / patella / tibia larga / metatarso ──
    # Pose de alerta: delanteras altas al frente, medias extendidas, traseras abajo-atras.
    # Anclas (x,y) sobre cefalotórax; z base ~1.05
    ANCH_Y = [0.30, 0.08, -0.14, -0.34]
    def leg_targets(i, sx):
        # arco realista: codo(femur alto), rodilla(patella apex), tobillo, pie (adentro-abajo)
        if i == 0:   return [(sx*1.70, 1.10, 2.30), (sx*2.00, 0.78, 1.45), (sx*2.08, 0.60, 0.66), (sx*1.84, 0.52, 0.04)]
        if i == 1:   return [(sx*2.05, 0.15, 2.00), (sx*2.55,-0.25, 1.10), (sx*2.62,-0.42, 0.50), (sx*2.38,-0.48, 0.04)]
        if i == 2:   return [(sx*1.72,-0.78, 1.60), (sx*2.18,-1.28, 0.88), (sx*2.22,-1.46, 0.44), (sx*2.00,-1.56, 0.04)]
        return [     (sx*1.28,-1.42, 1.40), (sx*1.66,-2.16, 0.74), (sx*1.70,-2.36, 0.36), (sx*1.50,-2.44, 0.03)]

    for side in ("L", "R"):
        sx = -1 if side == "L" else 1
        for i in range(4):
            ax = sx * (0.40 if i < 2 else 0.36)
            ay = ANCH_Y[i]
            az = 1.06
            tgt = leg_targets(i, sx)
            knee = tgt[1]           # fin de patella (nodo articulado)
            r_empty = new_empty("Leg_%s%d_Root" % (side, i), (ax, ay, az))
            link(root, r_empty)

            # Femur: ancla -> arco alto -> codo
            f_mid = ((ax + tgt[0][0]) / 2 + sx * 0.16,
                     (ay + tgt[0][1]) / 2,
                     (az + tgt[0][2]) / 2 + 0.22)
            femur = skin_limb("Leg_%s%d_Femur" % (side, i),
                [(ax, ay, az), f_mid, list(tgt[0])],
                [0.075, 0.095, 0.07])
            link(r_empty, femur)

            k_empty = new_empty("Leg_%s%d_Knee" % (side, i), list(knee))
            k_empty.parent = r_empty
            k_empty.matrix_parent_inverse = r_empty.matrix_world.inverted()

            # Tibia+metatarso: codo -> tobillo -> punta fina
            t_mid1 = ((knee[0] + tgt[2][0]) / 2 + sx * 0.05,
                      (knee[1] + tgt[2][1]) / 2,
                      (knee[2] + tgt[2][2]) / 2 + 0.05)
            tibia = skin_limb("Leg_%s%d_Tibia" % (side, i),
                [list(knee), list(tgt[1]), t_mid1, list(tgt[2]), list(tgt[3])],
                [0.062, 0.055, 0.042, 0.03, 0.010])
            link(k_empty, tibia)

    deps = bpy.context.evaluated_depsgraph_get()
    tris = 0
    for ob in scene.objects:
        if ob.type == 'MESH':
            ev = ob.evaluated_get(deps)
            me = ev.to_mesh()
            tris += sum(max(0, len(p.vertices) - 2) for p in me.polygons)
            ev.to_mesh_clear()
    print("TRIS:", tris)

if not RENDER_ONLY:
    for ob in scene.objects:
        ob.select_set(False)
    def selh(o):
        o.select_set(True)
        for c in o.children: selh(c)
    selh(bpy.data.objects["Spider_Root"])
    bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB',
        export_yup=True, export_apply=True, use_selection=True)
    print("GLB_OK:", os.path.getsize(OUT_GLB))

scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 55
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam); scene.camera = cam
def look_at(c, target):
    import mathutils
    d = target - c.location
    c.rotation_euler = mathutils.Vector(d).to_track_quat('-Z','Y').to_euler()
key = bpy.data.objects.new("Key", bpy.data.lights.new("K",'AREA'))
key.data.energy = 1300; key.data.size = 6; key.location=(-4,-6,6)
scene.collection.objects.link(key)
rim = bpy.data.objects.new("Rim", bpy.data.lights.new("R",'AREA'))
rim.data.energy=650; rim.data.size=5; rim.location=(4,4,2)
scene.collection.objects.link(rim)
w = bpy.data.worlds.new("W"); w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(0.05,0.05,0.07,1)
w.node_tree.nodes["Background"].inputs[1].default_value=0.5
scene.world = w
center = __import__('mathutils').Vector((0,0,0.9))
for tag, loc in (("front",(0,7.6,1.5)), ("quarter",(-5.2,5.4,3.0))):
    cam.location = loc; look_at(cam, center)
    scene.render.filepath = os.path.join(PREVIEWS, "v2_" + tag + ".png")
    bpy.ops.render.render(write_still=True)
print("DONE")

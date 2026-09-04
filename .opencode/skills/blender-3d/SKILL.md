---
name: blender-3d
description: Control experto de Blender headless (CLI + bpy) para modelado procedural, materiales PBR, render de previews y exportación glTF/GLB hacia three.js. Use when asked to "modelar en blender", "crear modelo 3D", "exportar glb", "renderizar preview blender", o integrar activos 3D con three.js/GLTFLoader.
---

# Blender Headless Expert — Guía operativa (validada en Blender 5.2 LTS / Arch)

## Entorno verificado
- Binario: `/usr/bin/blender` · `blender --background --python script.py`
- Python embebido: 3.14 · bpy 5.2 LTS
- Ruido benigno en background: `ModuleNotFoundError: cattrs` (addon externo, ignorar)
- Instalación/actualización: `sudo pacman -Syu blender` (si falta un .so → upgrade completo, nunca parcial)

## API crítica (nombres EXACTOS en 5.x)
Principled BSDF inputs: `Base Color`, `Metallic`, `Roughness`, `IOR`, `Alpha`,
`Emission Color`, `Emission Strength`, `Coat Weight`, `Sheen Weight`.
⚠️ Ya NO existen `Specular` ni `Emission` (renombrados desde 4.x).

Export glTF: `bpy.ops.export_scene.gltf(filepath='x.glb', export_format='GLB',
export_yup=True, export_apply=True, use_selection=True)`.

## Técnica pro: extremidades orgánicas con Skin Modifier
Cadena de vértices + aristas → `Skin Modifier` (radios por vértice:
`obj.data.skin_vertices[0].data[i].radius = (r, r)`) → `Subdivision Surface`
nivel 1-2 → `shade_smooth()`. Da tubos orgánicos cónicos sin esculpir.
Exportar con `export_apply=True` para hornear modificadores.

## Mapeo de ejes (crítico three.js ↔ Blender)
Export `yup=True`: `(x, y, z)_blend → (x, z, -y)_gltf`. Estrategia robusta:
autorar la pose de descanso EN BLENDER, y en three.js aplicar SOLO deltas de
animación multiplicando cuaterniones sobre el reposo importado (nunca re-posear
desde cero). Guardar quaternion inicial de cada nodo articulado al cargar.

## Contrato de nombres nodo↔runtime (proyecto araña asahel-web)
`Spider_Root`(Empty) · `Abdomen` · `Cephalothorax` · `Eye_L/R`(+hijo `Pupil_L/R`)
· `MinorEye_i` · `Fang_L/R` · `Pedipalp_L/R` · por pata i∈0..3 lado L/R:
`Leg_{L|R}{i}_Root`(Empty) → hijo `…_Femur`(mesh) → hijo `…_Knee`(Empty) → hijo `…_Tibia`.
Materiales: `BODY`, `LEG` (neutros claros ⇒ se tiñen en runtime),
`EYE_GLOW` (emisión blanca), `DARK`.

## Pipeline de auto-crítica visual
Render headless con **Cycles CPU** (EEVEE requiere contexto GL):
`scene.render.engine='CYCLES'; cycles.samples=24; film_transparent=True`;
cámara ortográfica frontal y 3/4; guardar PNG en /tmp y LEER la imagen para
auto-evaluar silueta antes de integrar. Iterar ≤2 veces.

## Presupuesto web
Objetivo <500KB GLB · <80k tris · `Decimate` si excede · sin texturas
(colores planos PBR) · sin Draco (evita decoder extra en three).

## Integración three.js (patrón usado en src/components/mascot/Spider3D.tsx)
GLTFLoader dinámico desde `three/addons/loaders/GLTFLoader.js`; al cargar:
ocultar grupo procedural, escalar por bbox a altura objetivo, mapear nodos por
nombre, animación por deltas sobre reposo, tintar BODY/LEG con lerp hacia
--mascot-color, fallback automático si falla la carga.

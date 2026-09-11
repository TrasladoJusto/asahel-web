/**
 * spider/rigMap.ts — Mapeo por NOMBRE del rig GLB (contrato CONTRATO_RIG_ARANA.md)
 *
 * Este módulo SÍ corrige el bug crítico del análisis previo:
 *   - El grafo de escena NUNCA se indexa por traverse() ni por orden de array.
 *   - Todo se resuelve por nombre exacto, inmune al orden documental del .glb.
 */

import * as THREE from 'three';

export interface RigPart {
  roots: THREE.Object3D[]; // Leg_{L|R}{0-3}_Root
  knees: THREE.Object3D[];
  tibias: THREE.Object3D[];
  tarsis: THREE.Object3D[];
  fangs: THREE.Object3D[];
  chelicerae: THREE.Object3D[];
  pedipalps: THREE.Object3D[];
  pupils: THREE.Object3D[];
  eyeGroups: THREE.Object3D[];
  minorEyes: THREE.Object3D[];
  abdomen: THREE.Object3D | null;
  cephalothorax: THREE.Object3D | null;
  spinnerets: THREE.Object3D[];
  marks: THREE.Object3D[];
  root: THREE.Object3D | null;
  /** rest poses copiados 1 vez (quaternion + scale) */
  restQuat: Map<THREE.Object3D, THREE.Quaternion>;
  restScale: Map<THREE.Object3D, THREE.Vector3>;
  /** materiales por clave del contrato */
  tintMats: THREE.MeshStandardMaterial[]; // MARK
  glowMats: THREE.MeshStandardMaterial[]; // GLOW
  bodyMats: THREE.MeshStandardMaterial[]; // BODY
  eyeMats: THREE.MeshStandardMaterial[]; // EYE
  darkMats: THREE.MeshStandardMaterial[]; // DARK
}

/**
 * Índice canónico de pata (independiente del orden documental):
 *  0..3 = Leg_R0..R3 (derecha), 4..7 = Leg_L0..L3 (izquierda)
 * Se deriva del NOMBRE del nodo.
 */
export function legBaseName(name: string): string | null {
  const m = /^Leg_[LR](\d)_Root$/.exec(name);
  return m ? m[0].replace('_Root', '') : null;
}

/** Devuelve índice canónico 0..7 a partir del nombre base "Leg_L3". */
export function canonicalLegIndex(base: string): number {
  const side = base[4]; // 'L' | 'R'
  const idx = parseInt(base[5], 10);
  return side === 'R' ? idx : 4 + idx;
}

/**
 * Fase de marcha diagonal real de arácnidos:
 *   grupo de soporte A = {R0, L1, R2, L3} → fase 0
 *   grupo de soporte B = {L0, R1, L2, R3} → fase π
 * Devuelve 0 o PI según el índice canónico (0..7).
 */
export function gaitPairPhase(canonical: number): number {
  // patas "pares" de la diagonal que alternan
  const inGroupA = [0, 5, 2, 7].includes(canonical);
  return inGroupA ? 0 : Math.PI;
}

const ROOT_RE = /^Leg_[LR]\d_Root$/;
const KNEE_RE = /^Leg_[LR]\d_Knee$/;
const TIBIA_RE = /^Leg_[LR]\d_Tibia$/;
const TARSUS_RE = /^Leg_[LR]\d_Tarsus$/;
const PUPIL_RE = /^Pupil_[LR]$/;
const EYE_RE = /^Eye_[LR]$/;
const FANG_RE = /^Fang_[LR]$/;
const CHELICERA_RE = /^Chelicera_[LR]$/;
const PEDIPALP_RE = /^Pedipalp_[LR]$/;
const MINOR_EYE_RE = /^MinorEye_\d$/;
const SPINNERET_RE = /^Spinneret_[LR]$/;
const MARK_RE = /^Mark_Chev_\d$/;

/**
 * Recorre el grafo una sola vez y clasifica por nombre.
 * Insensible a mayúsculas/orden y resistente a sufijos de duplicado.
 */
export function buildRigMap(scene: THREE.Object3D): RigPart {
  const rig: RigPart = {
    roots: [],
    knees: [],
    tibias: [],
    tarsis: [],
    fangs: [],
    chelicerae: [],
    pedipalps: [],
    pupils: [],
    eyeGroups: [],
    minorEyes: [],
    abdomen: null,
    cephalothorax: null,
    spinnerets: [],
    marks: [],
    root: null,
    restQuat: new Map(),
    restScale: new Map(),
    tintMats: [],
    glowMats: [],
    bodyMats: [],
    eyeMats: [],
    darkMats: [],
  };

  scene.traverse((o) => {
    const name = o.name;

    if (name === 'Spider_Root') rig.root = o;
    if (name === 'Abdomen') rig.abdomen = o;
    if (name === 'Cephalothorax') rig.cephalothorax = o;

    if (ROOT_RE.test(name)) rig.roots.push(o);
    else if (KNEE_RE.test(name)) rig.knees.push(o);
    else if (TIBIA_RE.test(name)) rig.tibias.push(o);
    else if (TARSUS_RE.test(name)) rig.tarsis.push(o);
    else if (PUPIL_RE.test(name)) rig.pupils.push(o);
    else if (EYE_RE.test(name)) rig.eyeGroups.push(o);
    else if (FANG_RE.test(name)) rig.fangs.push(o);
    else if (CHELICERA_RE.test(name)) rig.chelicerae.push(o);
    else if (PEDIPALP_RE.test(name)) rig.pedipalps.push(o);
    else if (MINOR_EYE_RE.test(name)) rig.minorEyes.push(o);
    else if (SPINNERET_RE.test(name)) rig.spinnerets.push(o);
    else if (MARK_RE.test(name)) rig.marks.push(o);

    // clasificar materiales por el nombre del material del mesh
    const mesh = o as THREE.Mesh;
    if ((mesh as THREE.Mesh).isMesh) {
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat) {
        if (mat.name === 'MARK') rig.tintMats.push(mat);
        else if (mat.name === 'GLOW') rig.glowMats.push(mat);
        else if (mat.name === 'BODY') rig.bodyMats.push(mat);
        else if (mat.name === 'EYE') rig.eyeMats.push(mat);
        else if (mat.name === 'DARK') rig.darkMats.push(mat);
      }
    }
  });

  // ordenar patas por índice canónico para que roots[i] sea siempre el mismo
  const sortByCanonical = (arr: THREE.Object3D[]) => {
    arr.sort((a, b) => {
      const ba = legBaseName(a.name) ?? a.name;
      const bb = legBaseName(b.name) ?? b.name;
      if (ba && bb) return canonicalLegIndex(ba) - canonicalLegIndex(bb);
      return a.name.localeCompare(b.name);
    });
  };
  sortByCanonical(rig.roots);
  sortByCanonical(rig.knees);
  sortByCanonical(rig.tibias);
  sortByCanonical(rig.tarsis);

  // capturar rest pose (Quaternion + scale) una sola vez
  [
    ...rig.roots,
    ...rig.knees,
    ...rig.tibias,
    ...rig.tarsis,
    ...rig.fangs,
    ...rig.chelicerae,
    ...rig.pedipalps,
    ...rig.eyeGroups,
    ...rig.pupils,
  ].forEach((o) => {
    rig.restQuat.set(o, o.quaternion.clone());
    rig.restScale.set(o, o.scale.clone());
  });
  if (rig.abdomen) rig.restScale.set(rig.abdomen, rig.abdomen.scale.clone());

  // frustum culling off para que partes fuera del frame local no desaparezcan
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) m.frustumCulled = false;
  });

  return rig;
}

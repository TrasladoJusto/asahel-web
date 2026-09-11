/**
 * spider/gait.ts — Marcha arácnida realista con IK de 2 huesos + transferencia de peso.
 *
 * Enfoque:
 *   - Cada pata es una cadena de 2 segmentos (femur + tibia) resuelta por
 *     cinemática inversa analítica de 2 brazos sobre el pie (target).
 *   - El pie sigue una trayectoria de "paso" (foot placement) con fase de
 *     balanceo (swing) elíptica y fase de apoyo (stance) con deslizamiento
 *     opuesto al avance — esto es lo que produce contacto real con el suelo.
 *   - Transferencia de peso: el abdomen/cuerpo se desplaza lateral y
 *     verticalmente según qué diagonal está en el suelo.
 *
 * Determinista, sin mutación de estado global: recibe (t, speed, dir) y
 * devuelve los ángulos por pata. Testeable sin DOM ni WebGL.
 */

export interface LegTargets {
  /** ángulo del Root (coxea) en radianes — cabeceo/lift frontal */
  rootPitch: number;
  /** rotación Y del Root (abducción/aducción lateral) */
  rootYaw: number;
  /** ángulo del Knee (flexión de la tibia relativa al femur) */
  kneeFlex: number;
  /** elevación del pie sobre el suelo (para el swing) */
  footLift: number;
}

const LEG_COUNT = 8;

// Posiciones de anclaje de la coxea (local al cuerpo, metros).
// índice canónico 0..7. Y-up (el motor ya asume glTF Y-up).
interface Anchors {
  x: number;
  y: number;
  z: number;
}
const ANCHORS: Anchors[] = [
  { x: 1.15, y: 0.3, z: -1.25 }, // R0 frontal
  { x: 1.05, y: 0.0, z: -0.65 }, // R1
  { x: 0.95, y: -0.3, z: 0.05 }, // R2
  { x: 0.9, y: -0.55, z: 0.85 }, // R3
  { x: -1.15, y: 0.3, z: -1.25 }, // L0 frontal
  { x: -1.05, y: 0.0, z: -0.65 }, // L1
  { x: -0.95, y: -0.3, z: 0.05 }, // L2
  { x: -0.9, y: -0.55, z: 0.85 }, // L3
];

// Longitudes de segmento (metros) — femur + tibia
const FEMUR = 1.45;
const TIBIA = 1.85;

/**
 * IK analítica de 2 brazos en el plano vertical (resuelve ángulos para
 * alcanzar un punto objetivo (dx, dy) relativo a la coxea).
 * Devuelve {shoulder, elbow} en radianes o null si inalcanzable.
 */
export function solve2BoneIK(
  dx: number,
  dy: number,
  l1: number,
  l2: number
): { shoulder: number; elbow: number } | null {
  const dist = Math.hypot(dx, dy);
  if (dist > l1 + l2) {
    // clamp a alcance máximo
    const scale = (l1 + l2 - 0.001) / dist;
    dx *= scale;
    dy *= scale;
  }
  const d2 = Math.hypot(dx, dy);
  // ley de cosenos
  const cosElbow = (d2 * d2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  const elbow = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
  const shoulder = Math.atan2(dy, dx) - Math.atan2(l2 * Math.sin(elbow), l1 + l2 * Math.cos(elbow));
  return { shoulder, elbow };
}

export interface GaitParams {
  /** tiempo absoluto (s) */
  t: number;
  /** velocidad de marcha 0..1 */
  speed: number;
  /** dirección de avance en radianes (0 = +X) */
  heading: number;
  /** amplitud de paso (metros), escalada por velocidad */
  stride: number;
}

export interface GaitResult {
  legs: LegTargets[];
  /** desplazamiento vertical del cuerpo (m) por transferencia de peso */
  bodyLift: number;
  /** desplazamiento lateral del cuerpo (m) */
  bodySway: number;
  /** pitch del cuerpo (rad) */
  bodyPitch: number;
  /** rotación Z del cuerpo (rad) */
  bodyRoll: number;
  /** progreso global del ciclo 0..1 */
  cyclePhase: number;
}

const TWO_PI = Math.PI * 2;

export function computeGait(p: GaitParams): GaitResult {
  const { t, speed, heading, stride } = p;
  // frecuencia de paso ligada a la velocidad
  const gaitFreq = 1.2 + speed * 2.6; // Hz
  const raw = (t * gaitFreq) % 1.0; // 0..1 ciclo
  const phase = raw * TWO_PI;

  const legs: LegTargets[] = [];
  for (let i = 0; i < LEG_COUNT; i++) {
    const anchor = ANCHORS[i];
    const pairPhase = gaitPairPhase(i);
    const swingPhase = Math.sin(phase + pairPhase);

    // swing (pie en el aire) si sin > 0 → avanza; stance (apoyo) si sin <= 0
    const isSwing = swingPhase > 0;
    const swingT = swingPhase; // 0..1 en subida/bajada

    // foot target relativo a la coxea (en el plano ground = XZ; Y = altura)
    // dirección de avance: el pie se desplaza según heading
    const advance = Math.cos(heading) * stride * speed;
    const lateral = Math.sin(heading) * stride * speed;

    let footDX: number;
    let footDZ: number;
    let footDY: number;

    if (isSwing) {
      // arco elíptico de balanceo: sube y avanza
      const liftArc = Math.sin(swingT * Math.PI); // 0→1→0
      footDX = anchor.x + advance * (swingT - 0.5) * 2;
      footDZ = anchor.z + lateral * (swingT - 0.5) * 2;
      footDY = Math.max(0, -anchor.y) + liftArc * (0.35 + speed * 0.25); // elevación
    } else {
      // apoyo: pie fijo al suelo, el cuerpo avanza → deslizamiento aparente opuesto
      const stanceT = (-swingPhase + 1) / 2; // 0..1 durante stance
      footDX = anchor.x - advance * (stanceT - 0.5) * 2;
      footDZ = anchor.z - lateral * (stanceT - 0.5) * 2;
      footDY = Math.max(0, -anchor.y); // contacto con suelo
    }

    // resolver IK para alcanzar el foot target desde la coxea
    const relY = footDY - anchor.y;
    // proyectar al plano vertical (aproximación: resolver en el plano de la pata)
    const horiz = Math.hypot(footDX, footDZ);
    const ik = solve2BoneIK(horiz, relY, FEMUR, TIBIA);
    if (ik) {
      legs.push({
        rootPitch: ik.shoulder,
        rootYaw: Math.atan2(footDZ, footDX),
        kneeFlex: ik.elbow,
        footLift: isSwing ? 1.0 : 0.0,
      });
    } else {
      legs.push({ rootPitch: 0, rootYaw: 0, kneeFlex: 0.4, footLift: 0 });
    }
  }

  // transferencia de peso: según qué diagonal está en stance
  const aPhase = Math.sin(phase); // grupo A elevación
  const bPhase = Math.sin(phase + Math.PI);
  const bodyLift = 0.06 + 0.04 * Math.max(0, aPhase) + 0.04 * Math.max(0, bPhase);
  const bodySway = Math.sin(phase * 2) * 0.02 * speed;
  const bodyPitch = Math.sin(phase) * 0.015 * speed;
  const bodyRoll = Math.sin(phase * 2) * 0.012 * speed;

  return {
    legs,
    bodyLift,
    bodySway,
    bodyPitch,
    bodyRoll,
    cyclePhase: raw,
  };
}

// re-export para conveniencia de otros módulos sin importar rigMap
import { gaitPairPhase } from './rigMap';
export { gaitPairPhase };

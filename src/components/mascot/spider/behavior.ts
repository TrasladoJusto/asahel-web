/**
 * spider/behavior.ts — Gatillos de comportamiento biológico.
 *
 * Sistema determinístico (seedable para tests) que decide, a lo largo del
 * tiempo, qué "estado emocional" adopta la araña y cuándo ejecuta
 * micro-gestos: mirar al cursor, curiosidad hacia una tarjeta, parpadeo,
 * sacadas oculares. Separado del render para poder testear sin DOM/GPU.
 */

export type BehaviorState = 'patrol' | 'lookAtCursor' | 'curious' | 'rest' | 'startle';

export interface BehaviorInputs {
  /** tiempo (s) */
  t: number;
  /** ¿el cursor está cerca? (distancia normalizada 0..1, 1 = pegado) */
  cursorProximity: number;
  /** ¿hay un elemento interactivo bajo hover? */
  hoveringInteractive: boolean;
  /** ¿el chat está abierto? */
  chatOpen: boolean;
  /** ¿la araña está caminando? */
  walking: boolean;
}

export interface BehaviorOutput {
  state: BehaviorState;
  /** 0..1 intensidad de mirada al cursor (pupilas + yaw corporal) */
  gazeIntensity: number;
  /** -1..1 inclinación lateral hacia el interés */
  lean: number;
  /** ¿parpadeo en este frame? (señal corta) */
  blink: boolean;
  /** offset de sacada (x,y) en unidades locales */
  saccade: { x: number; y: number };
  /** velocidad de micro-gestos (scale para idle) */
  microSpeed: number;
}

interface Seq {
  state: BehaviorState;
}

let _seed = 12345;
export function setSeed(s: number) {
  _seed = s;
}
function rand(): number {
  // LCG determinista
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}

// estado persistente entre frames (módulo-level, por demo; en runtime se
// instancia por araña — ver Spider3D que mantiene su propia copia)
const blinkTimer = { next: 1.5, progress: 0, active: false };
const saccadeTimer = { next: 3.0, progress: 0, active: false, tx: 0, ty: 0 };

export function resetBehavior() {
  blinkTimer.next = 1.5 + rand() * 2;
  blinkTimer.progress = 0;
  blinkTimer.active = false;
  saccadeTimer.next = 3.0;
  saccadeTimer.progress = 0;
  saccadeTimer.active = false;
}

const seq: Seq = { state: 'patrol' };

/**
 * Determina el comportamiento del frame a partir de entradas.
 * Puro salvo por los timers internos de parpadeo/sacada.
 */
export function computeBehavior(inp: BehaviorInputs): BehaviorOutput {
  const { t, cursorProximity, hoveringInteractive, chatOpen, walking } = inp;

  // prioridad de estados
  if (chatOpen) {
    seq.state = 'lookAtCursor';
  } else if (hoveringInteractive && cursorProximity > 0.4) {
    seq.state = 'curious';
  } else if (cursorProximity > 0.75 && !walking) {
    seq.state = 'lookAtCursor';
  } else if (!walking && cursorProximity < 0.15) {
    seq.state = 'rest';
  } else if (walking) {
    seq.state = 'patrol';
  } else {
    seq.state = 'rest';
  }

  // parpadeo
  let blink = false;
  if (!blinkTimer.active && t >= blinkTimer.next) {
    blinkTimer.active = true;
    blinkTimer.progress = 0;
    blinkTimer.next = t + 2 + rand() * 6;
  }
  if (blinkTimer.active) {
    blinkTimer.progress += 1 / 60 / 0.15;
    blink = Math.sin(Math.min(1, blinkTimer.progress) * Math.PI) > 0.5;
    if (blinkTimer.progress >= 1) blinkTimer.active = false;
  }

  // sacadas
  let saccade = { x: 0, y: 0 };
  if (!saccadeTimer.active && t >= saccadeTimer.next) {
    saccadeTimer.active = true;
    saccadeTimer.progress = 0;
    saccadeTimer.tx = (rand() - 0.5) * 0.08;
    saccadeTimer.ty = (rand() - 0.5) * 0.06;
    saccadeTimer.next = t + 3 + rand() * 5;
  }
  if (saccadeTimer.active) {
    saccadeTimer.progress += 1 / 60 / 0.08;
    const p = Math.min(1, saccadeTimer.progress);
    saccade = { x: saccadeTimer.tx * p, y: saccadeTimer.ty * p };
    if (p >= 1) saccadeTimer.active = false;
  }

  const gazeIntensity = seq.state === 'lookAtCursor' ? 1 : seq.state === 'curious' ? 0.7 : 0.25;
  const lean = seq.state === 'curious' ? 0.6 : seq.state === 'lookAtCursor' ? 0.3 : 0;
  const microSpeed = seq.state === 'rest' ? 0.4 : 1.0;

  return { state: seq.state, gazeIntensity, lean, blink, saccade, microSpeed };
}

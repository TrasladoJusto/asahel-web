/**
 * spider/silk.ts — Física de la seda: catenaria + inercia amortiguada.
 *
 * Produce un hilo que "cuelga" y "columpia" realistamente:
 *   - Catenaria dinámica (no una curva fija) cuyo sag responde a la gravedad.
 *   - Inercia angular: la araña oscila como péndulo al desplazarse; el
 *     movimiento se amortigua con fricción (no se queda balanceando para siempre).
 *   - Resolvible por frame de forma barata (sin solver físico externo).
 */

export interface SilkState {
  /** posición horizontal actual de la araña (m) */
  x: number;
  /** posición vertical actual (m) */
  y: number;
  /** velocidad horizontal (m/s) */
  vx: number;
  /** velocidad vertical (m/s) */
  vy: number;
  /** ángulo de péndulo actual (rad) */
  theta: number;
  /** velocidad angular (rad/s) */
  omega: number;
  /** tiempo interno (s) */
  t: number;
}

export const SILK_LENGTH = 9.0; // longitud de la seda (m)
export const SILK_GRAVITY = -3.2; // gravedad "escénica" (m/s²) — suave para que sea visible
export const SILK_DAMPING = 0.985; // amortiguación por frame (fricción)
export const SILK_STIFFNESS = 4.0; // restitución elástica del hilo

export function createSilkState(x = 0, y = 6.4): SilkState {
  return { x, y, vx: 0, vy: 0, theta: 0, omega: 0, t: 0 };
}

export interface SilkFrame {
  /** puntos de la catenaria (x,y en el espacio de escena) */
  points: Array<{ x: number; y: number }>;
  /** sag máximo (m) */
  sag: number;
  /** ángulo del hilo en el anclaje (rad) */
  anchorAngle: number;
  /** opacidad sugerida (0..1) */
  opacity: number;
}

/**
 * Avanza la física de la seda un paso dt y devuelve la catenaria actual.
 * El anclaje superior está fijo en (anchorX, anchorY); la araña cuelga del
 * extremo inferior como un péndulo con resorte.
 */
export function stepSilk(
  st: SilkState,
  dt: number,
  anchorX: number,
  anchorY: number,
  spiderAccelX: number,
  spiderAccelY: number
): SilkFrame {
  st.t += dt;

  // fuerzas sobre el péndulo
  const ax = SILK_STIFFNESS * (anchorX - st.x) + spiderAccelX;
  const ay = SILK_GRAVITY + SILK_STIFFNESS * 0.0 + spiderAccelY;

  st.vx += ax * dt;
  st.vy += ay * dt;
  st.vx *= SILK_DAMPING;
  st.vy *= SILK_DAMPING;

  st.x += st.vx * dt;
  st.y += st.vy * dt;

  // péndulo angular (oscilación lateral)
  const dx = st.x - anchorX;
  const dy = st.y - anchorY;
  const length = Math.hypot(dx, dy) || 1;
  const gravityTorque = (Math.sin(Math.atan2(dx, -dy)) * SILK_GRAVITY) / length;
  st.omega += gravityTorque * dt - st.omega * 0.05;
  st.omega *= SILK_DAMPING;
  st.theta += st.omega * dt;

  // restricción: la longitud no puede superar SILK_LENGTH
  if (length > SILK_LENGTH) {
    const s = SILK_LENGTH / length;
    st.x = anchorX + dx * s;
    st.y = anchorY + dy * s;
  }

  // generar catenaria (N puntos entre anclaje y araña)
  const N = 24;
  const points: Array<{ x: number; y: number }> = [];
  const sagBase = Math.max(0, SILK_LENGTH - length) * 0.35 + Math.abs(st.theta) * 0.5;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x =
      anchorX +
      (st.x - anchorX) * u +
      Math.sin(u * Math.PI) * sagBase * 0.3 * Math.sign(st.theta || 1);
    const y = anchorY + (st.y - anchorY) * u + Math.sin(u * Math.PI) * sagBase;
    points.push({ x, y });
  }

  const sag = sagBase;
  const anchorAngle = Math.atan2(st.x - anchorX, anchorY - st.y);
  const opacity = Math.max(0, Math.min(1, 1 - (SILK_LENGTH - length) * 0.15));

  return { points, sag, anchorAngle, opacity };
}

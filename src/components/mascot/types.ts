/**
 * Spider 3D v4 — Type Definitions
 * Skill: spec-driven-development
 */

export type SpiderState = 'entering' | 'walking' | 'idle' | 'inspecting' | 'chat';

export interface SpiderProps {
  mousePos: { x: number; y: number };
  isOpen: boolean;
  state: SpiderState;
  mascotColor: string;
  onReady?: () => void;
}

export interface BlinkController {
  update(t: number): number; // Returns blink amount (0 = open, 1 = closed)
}

export interface SaccadeController {
  update(t: number, dt: number, baseTarget: { x: number; y: number }): { x: number; y: number };
}

export interface GaitPhase {
  phase: number;
  amplitude: number;
  speed: number;
}

export interface LegConfig {
  x: number;
  y: number;
  baseZ: number;
  phase: number;
}

export interface LegState {
  root: { rotation: { x: number; y: number; z: number } };
  upper: { rotation: { x: number; y: number; z: number } };
  lower: { rotation: { x: number; y: number; z: number } };
  mat: { color: { lerp: (color: unknown, t: number) => void } };
  phase: number;
  baseLowerZ: number;
}

// Easing functions
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

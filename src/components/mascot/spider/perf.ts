/**
 * spider/perf.ts — Métricas de rendimiento y observabilidad de la araña.
 *
 * Objetivo: dar visibilidad al coste real de la mascota en producción
 * (FPS, tiempo de frame, draw calls, memoria GPU aproximada, tiempo de carga
 * del GLB) SIN penalizar el runtime: muestreo barato, sin allocs por frame,
 * y gate por flag para no ensuciar los logs de producción.
 *
 * Integración:
 *   - Se instancia en Spider3D y se alimenta por frame.
 *   - Publica un resumen a Sentry (si hay DSN) o a console en dev.
 *   - Expone `window.__spiderPerf` para inspección manual.
 */

export interface PerfSnapshot {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  glbLoadMs: number;
  /** % de frames que superaron el presupuesto de 16.7ms */
  overBudgetPct: number;
  droppedFrames: number;
}

interface Ring {
  idx: number;
  samples: number[];
}

export class SpiderPerf {
  private frames = 0;
  private lastFpsSample = 0;
  private fps = 0;
  private frameTimes: Ring = { idx: 0, samples: new Array(60).fill(0) };
  private overBudget = 0;
  private dropped = 0;
  /** tiempo de inicio (ms) — público para leer el tiempo de carga del GLB */
  startTime = 0;
  glbLoadMs = 0;

  constructor() {
    this.startTime = performance.now();
    if (typeof window !== 'undefined') {
      (window as unknown as { __spiderPerf?: SpiderPerf }).__spiderPerf = this;
    }
  }

  /** número de frames renderizados (público para triggers de reporte) */
  get frameCount(): number {
    return this.frames;
  }

  /** Llamar al INICIO de cada frame con el renderer.stats o info. */
  frame(dtMs: number, drawCalls: number, triangles: number): void {
    this.frames++;
    this.frameTimes.samples[this.frameTimes.idx] = dtMs;
    this.frameTimes.idx = (this.frameTimes.idx + 1) % this.frameTimes.samples.length;
    if (dtMs > 16.7) this.overBudget++;
    if (dtMs > 33.4) this.dropped++;

    const now = performance.now();
    if (now - this.lastFpsSample >= 1000) {
      const elapsed = (now - this.lastFpsSample) / 1000;
      const framesThisSecond = this.frames - this.frameBase;
      this.fps = elapsed > 0 ? Math.round(framesThisSecond / elapsed) : 0;
      this.lastFpsSample = now;
      this.frameBase = this.frames;
    }

    this.drawCalls = drawCalls;
    this.triangles = triangles;
  }

  private drawCalls = 0;
  private triangles = 0;
  private frameBase = 0;

  snapshot(): PerfSnapshot {
    const avg = this.frameTimes.samples.reduce((a, b) => a + b, 0) / this.frameTimes.samples.length;
    const overBudgetPct = (this.overBudget / Math.max(1, this.frames)) * 100;
    return {
      fps: this.fps,
      frameMs: avg,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      glbLoadMs: this.glbLoadMs,
      overBudgetPct,
      droppedFrames: this.dropped,
    };
  }

  /**
   * Publica el resumen una sola vez (al salir de la marcha o tras N segundos).
   */
  report(reason: string): void {
    const snap = this.snapshot();
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[spider:perf]', reason, snap);
    }
    // Sentry opcional (solo si hay DSN): métrica de rendimiento como breadcrumb
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = (globalThis as { __SENTRY__?: { addBreadcrumb?: (b: unknown) => void } })
        .__SENTRY__;
      Sentry?.addBreadcrumb?.({
        category: 'spider.perf',
        level: 'info',
        data: snap,
      });
    } catch {
      /* sin Sentry */
    }
  }
}

/** Presupuesto de frame objetivo (16.7ms a 60fps). */
export const FRAME_BUDGET_MS = 16.7;

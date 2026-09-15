'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type SpiderState = 'entering' | 'walking' | 'idle';

interface Spider3DProps {
  mousePos: { x: number; y: number };
  isOpen: boolean;
  state: SpiderState;
  mascotColor: string;
  onReady?: () => void;
}

/**
 * ARAÑA DEV — Spider 3D v3 · Natural Animation
 *
 * Mejoras vs v2:
 *  - Marcha tetrapoda: 4 patas se mueven en sincronía (diagonal pairs)
 *  - Cuerpo: lean al caminar, pitch dinámico, weight shift en idle
 *  - Ojos: parpadeo aleatorio + saccades + tracking suave
 *  - Abdomen: respiración más visible con expansión lateral
 *  - Pedipalpos: reactivos al mouse como antenas sensoriales
 *  - Colmillos: ritmo más natural al tipear
 *  - Entrada: péndulo 3D descendente en vez de CSS
 */

// Tetrapod gait pairs: front-right + back-left move together
//                      front-left + back-right move together
const GAIT_PAIRS = [
  [0, 5], // Leg_R1 + Leg_L3
  [3, 4], // Leg_R4 + Leg_L1 (reversed for mirror)
  [1, 6], // Leg_R2 + Leg_L2
  [2, 7], // Leg_R3 + Leg_L4 (reversed)
];

// Anclajes de patas sobre el cefalotórax
const LEGS: Array<{ x: number; y: number; baseZ: number; phase: number }> = [
  { x: 0.9, y: 0.55, baseZ: -1.25, phase: 0 }, // R1 front
  { x: 1.15, y: 0.25, baseZ: -0.65, phase: Math.PI }, // R2 mid-front
  { x: 1.15, y: -0.1, baseZ: 0.05, phase: 0 }, // R3 mid-back
  { x: 0.95, y: -0.4, baseZ: 0.85, phase: Math.PI }, // R4 back
];

const L_UPPER = 1.45;
const L_LOWER = 1.85;

// ── Easing functions ─────────────────────────────────────────
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Blink controller ─────────────────────────────────────────
class BlinkController {
  private nextBlinkTime = 0;
  private blinkProgress = 0;
  private isBlinking = false;
  private blinkDuration = 0.15; // seconds

  update(t: number): number {
    if (!this.isBlinking && t >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      // Random next blink: 2-8 seconds
      this.nextBlinkTime = t + 2 + Math.random() * 6;
    }

    if (this.isBlinking) {
      this.blinkProgress += 1 / 60 / this.blinkDuration;
      if (this.blinkProgress >= 1) {
        this.isBlinking = false;
        this.blinkProgress = 0;
      }
      // Bell curve: close → open
      const p = this.blinkProgress;
      return Math.sin(p * Math.PI);
    }
    return 0;
  }
}

// ── Saccade controller ───────────────────────────────────────
class SaccadeController {
  private nextSaccadeTime = 0;
  private saccadeTarget = new THREE.Vector2(0, 0);
  private saccadeProgress = 0;
  private isSaccading = false;
  private saccadeDuration = 0.08;
  private currentOffset = new THREE.Vector2(0, 0);

  update(t: number, dt: number, baseTarget: THREE.Vector2): THREE.Vector2 {
    if (!this.isSaccading && t >= this.nextSaccadeTime) {
      this.isSaccading = true;
      this.saccadeProgress = 0;
      this.saccadeTarget.set((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.03);
      this.nextSaccadeTime = t + 3 + Math.random() * 5;
    }

    if (this.isSaccading) {
      this.saccadeProgress += dt / this.saccadeDuration;
      if (this.saccadeProgress >= 1) {
        this.isSaccading = false;
        this.saccadeProgress = 0;
      }
      const p = easeInOutCubic(this.saccadeProgress);
      this.currentOffset.lerp(this.saccadeTarget, p * 0.3);
    } else {
      this.currentOffset.lerp(baseTarget, 0.08);
    }

    return this.currentOffset;
  }
}

function buildLeg(side: 1 | -1, cfg: (typeof LEGS)[number]) {
  const root = new THREE.Group();
  root.position.set(cfg.x * side, cfg.y, 0);
  root.rotation.z = cfg.baseZ;
  root.rotation.x = side === 1 ? -0.35 : 0.35;

  const mat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.35,
    metalness: 0.55,
  });

  // Coxa
  const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.22, 8), mat);
  coxa.position.y = 0.11;
  root.add(coxa);

  const upper = new THREE.Group();
  upper.position.y = 0.22;
  const upperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.105, L_UPPER, 8), mat);
  upperMesh.position.y = L_UPPER / 2;
  upper.add(upperMesh);
  root.add(upper);

  const lower = new THREE.Group();
  lower.position.y = L_UPPER;
  const tibiaAbs = [1.75, 2.05, 2.35, 2.7][LEGS.indexOf(cfg)] ?? 2.2;
  const baseLowerZ = tibiaAbs - cfg.baseZ;
  lower.rotation.z = baseLowerZ;
  const lowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, L_LOWER, 8), mat);
  lowerMesh.position.y = L_LOWER / 2;
  lower.add(lowerMesh);
  // Tarso (pie)
  const tarso = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), mat);
  tarso.position.y = L_LOWER;
  lower.add(tarso);
  upper.add(lower);

  return { root, upper, lower, mat, phase: cfg.phase, baseLowerZ };
}

export default function Spider3D({ mousePos, isOpen, state, mascotColor, onReady }: Spider3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ mousePos, isOpen, state, mascotColor });

  // Sincronizar props tras el render (regla React 19: no escribir refs en render)
  useEffect(() => {
    propsRef.current = { mousePos, isOpen, state, mascotColor };
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 64;
    const height = mount.clientHeight || 64;

    // ── Renderer / escena / cámara ──────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      onReady?.();
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 12.6);
    camera.lookAt(0, -0.3, 0);

    // ── Luces ────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(-2.5, 3.5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(3, -1, -3);
    scene.add(rim);
    const accent = new THREE.PointLight(new THREE.Color(propsRef.current.mascotColor), 6, 14);
    accent.position.set(1.6, 2.2, 3.2);
    scene.add(accent);

    // ── Materiales del cuerpo ────────────────────────────────────
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(propsRef.current.mascotColor),
      roughness: 0.28,
      metalness: 0.45,
      emissive: new THREE.Color(propsRef.current.mascotColor),
      emissiveIntensity: 0.12,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: '#101214',
      roughness: 0.4,
      metalness: 0.3,
    });

    // ── Grupo araña ──────────────────────────────────────────────
    const spider = new THREE.Group();
    scene.add(spider);

    // Abdomen (volumen trasero) — más grande para respiración visible
    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), bodyMat);
    abdomen.scale.set(1.0, 0.92, 1.18);
    abdomen.position.set(0, -1.05, 0.35);
    spider.add(abdomen);

    // Brillo especular fake
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
    );
    shine.position.set(-0.5, -0.55, 1.15);
    spider.add(shine);

    // Pedicelo + cefalotórax
    const pedicel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 10), darkMat);
    pedicel.position.set(0, -0.05, 0.1);
    spider.add(pedicel);
    const cephalo = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), bodyMat);
    cephalo.position.set(0, 0.65, -0.15);
    spider.add(cephalo);

    // ── Ojos con parpadeo y saccades ─────────────────────────────
    const eyeMat = new THREE.MeshStandardMaterial({
      color: '#0d1117',
      roughness: 0.15,
      metalness: 0.1,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: '#eaf6ff',
      emissive: 0xeaf6ff,
      emissiveIntensity: 0.85,
    });
    const eyeGroups: THREE.Group[] = [];
    const pupils: THREE.Mesh[] = [];
    const eyeLids: THREE.Mesh[] = [];

    for (const ex of [-0.34, 0.34]) {
      const g = new THREE.Group();
      g.position.set(ex, 0.82, 0.62);

      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 20), eyeMat);
      const ringMat = bodyMat.clone();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.045, 10, 24), ringMat);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), glowMat);
      pupil.position.z = 0.19;
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      spark.position.set(-0.06, 0.07, 0.26);

      // Párpado superior (semiesfera invertida)
      const lidGeo = new THREE.SphereGeometry(0.29, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const lidMat = new THREE.MeshStandardMaterial({
        color: '#101214',
        roughness: 0.4,
        metalness: 0.3,
        side: THREE.DoubleSide,
      });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.set(0, 0.12, 0);
      lid.rotation.x = Math.PI; // initially open (up)
      lid.scale.y = 0; // fully open

      g.add(ball, ring, pupil, spark, lid);
      spider.add(g);
      eyeGroups.push(g);
      pupils.push(pupil);
      eyeLids.push(lid);
    }

    // Ocelos menores (6 puntos emisivos)
    const minors: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 1,
        })
      );
      const a = Math.PI * (0.15 + (i / 5) * 0.7);
      m.position.set(Math.cos(a) * 0.72, 0.98 + Math.sin(a) * 0.28, 0.52);
      spider.add(m);
      minors.push(m);
    }

    // Colmillos
    const fangs: THREE.Mesh[] = [];
    for (const fx of [-0.18, 0.18]) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 10), darkMat);
      f.position.set(fx, 0.28, 0.68);
      f.rotation.x = Math.PI - 0.35;
      f.rotation.z = fx < 0 ? 0.18 : -0.18;
      spider.add(f);
      fangs.push(f);
    }

    // Pedipalpos (reactivos al mouse)
    const pedipalps: THREE.Mesh[] = [];
    for (const px of [-0.42, 0.42]) {
      const pp = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 8), bodyMat.clone());
      pp.position.set(px, 0.22, 0.66);
      pp.rotation.x = 0.9;
      pp.rotation.z = px < 0 ? 0.5 : -0.5;
      spider.add(pp);
      pedipalps.push(pp);
    }

    // Patas ×8 (espejo lado izquierdo)
    const legs: Array<ReturnType<typeof buildLeg>> = [];
    for (const side of [1, -1] as const) {
      LEGS.forEach((cfg) => {
        const leg = buildLeg(side, cfg);
        if (side === -1) leg.root.scale.x = -1;
        spider.add(leg.root);
        legs.push(leg);
      });
    }

    // Hilo de seda
    const threadGeo = new THREE.CylinderGeometry(0.02, 0.02, 9, 6);
    const thread = new THREE.Mesh(
      threadGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(mascotColor),
        transparent: true,
        opacity: 0.55,
      })
    );
    thread.position.set(0, 6.4, 0.2);
    scene.add(thread);

    // ── Blink & Saccade controllers ─────────────────────────────
    const blinkCtrl = new BlinkController();
    const saccadeCtrl = new SaccadeController();

    // ── FASE C: modelo GLB artist-made ─────────────────────────
    const model = {
      ready: false,
      group: null as THREE.Group | null,
      legRoots: [] as THREE.Object3D[],
      knees: [] as THREE.Object3D[],
      fangs: [] as THREE.Object3D[],
      abdomen: null as THREE.Object3D | null,
      pupils: [] as THREE.Object3D[],
      eyeGroups: [] as THREE.Object3D[],
      tintMats: [] as THREE.MeshStandardMaterial[],
      glowMats: [] as THREE.MeshStandardMaterial[],
      rest: new Map<THREE.Object3D, THREE.Quaternion>(),
      restScale: new Map<THREE.Object3D, THREE.Vector3>(),
      pedipalps: [] as THREE.Object3D[],
    };

    new GLTFLoader().load(
      '/models/arana-dev.glb',
      (gltf) => {
        const g = gltf.scene;
        const box = new THREE.Box3().setFromObject(g);
        const size = box.getSize(new THREE.Vector3());
        const s = 7.0 / Math.max(size.x, size.y, size.z);
        g.scale.setScalar(s);
        g.rotation.y = Math.PI;
        g.updateMatrixWorld(true);
        const nb = new THREE.Box3().setFromObject(g);
        const c = nb.getCenter(new THREE.Vector3());
        g.position.set(-c.x, -nb.min.y - 2.05, -c.z);
        g.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) mesh.frustumCulled = false;
          if (/^Leg_[LR]\d_Root$/.test(o.name)) model.legRoots.push(o);
          if (/^Leg_[LR]\d_Knee$/.test(o.name)) model.knees.push(o);
          if (/^Fang_/.test(o.name)) model.fangs.push(o);
          if (o.name === 'Abdomen') model.abdomen = o;
          if (/^Pupil_/.test(o.name)) model.pupils.push(o);
          if (/^Eye_/.test(o.name)) model.eyeGroups.push(o);
          if (/^Pedipalp_/.test(o.name)) model.pedipalps.push(o);
          const m = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
          if (m && m.name === 'MARK') model.tintMats.push(m);
          if (m && m.name === 'BODY') {
            m.emissiveIntensity = 0.055;
            model.glowMats.push(m);
          }
        });
        [
          ...model.legRoots,
          ...model.knees,
          ...model.fangs,
          ...model.eyeGroups,
          ...model.pedipalps,
        ].forEach((o) => model.rest.set(o, o.quaternion.clone()));
        if (model.abdomen) model.restScale.set(model.abdomen, model.abdomen.scale.clone());
        scene.add(g);
        model.group = g;
        model.ready = true;
        spider.visible = false;
      },
      undefined,
      () => {
        /* fallo → procedural sigue */
      }
    );

    // ── Loop de animación ──────────────────────────────────────
    const targetColor = new THREE.Color(mascotColor);
    const clock = new THREE.Clock();
    let running = !document.hidden;
    let raf = 0;
    let readyFired = false;
    let prevState: SpiderState = 'idle';
    let stateTime = 0;
    const visHandler = () => {
      running = !document.hidden;
    };
    document.addEventListener('visibilitychange', visHandler);

    const tmpDir = new THREE.Vector3();
    const tmpVec2 = new THREE.Vector2();
    let elapsed = 0;

    function tick() {
      raf = requestAnimationFrame(tick);
      if (!running) {
        clock.getDelta();
        return;
      } // drain delta even when hidden
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const t = elapsed;
      const p = propsRef.current;

      if (!readyFired && t > 0.05) {
        readyFired = true;
        onReady?.();
      }

      // Track state transitions
      if (p.state !== prevState) {
        stateTime = t;
        prevState = p.state;
      }
      const stateDt = t - stateTime;

      // ── Transición de color suave ───────────────────────────────
      targetColor.set(p.mascotColor);
      bodyMat.color.lerp(targetColor, 0.08);
      bodyMat.emissive.lerp(targetColor, 0.08);
      accent.color.lerp(targetColor, 0.08);
      (thread.material as THREE.MeshBasicMaterial).color.lerp(targetColor, 0.08);
      legs.forEach((l) => l.mat.color.lerp(targetColor, 0.08));
      model.tintMats.forEach((m) => m.color.lerp(targetColor, 0.06));
      model.glowMats.forEach((m) => m.emissive.lerp(targetColor, 0.05));

      const walking = p.state === 'walking';
      const entering = p.state === 'entering';

      // ── ENTRADA: péndulo descendente ───────────────────────────
      if (entering) {
        const pendulum = Math.min(stateDt / 2.5, 1); // 2.5s entrance
        const eased = easeInOutCubic(pendulum);
        // Descend from above
        spider.position.y = THREE.MathUtils.lerp(8, 0, eased);
        // Pendulum swing (damped)
        const swing = Math.sin(stateDt * 4) * (1 - eased) * 0.5;
        spider.rotation.z = swing;
        // Thread opacity fades in
        (thread.material as THREE.MeshBasicMaterial).opacity = eased * 0.55;
        thread.position.y = THREE.MathUtils.lerp(12, 6.4, eased);
        // Legs: spread out gradually
        legs.forEach((leg) => {
          leg.upper.rotation.x = 0;
          leg.root.rotation.y = 0;
          leg.lower.rotation.z = THREE.MathUtils.lerp(leg.baseLowerZ - 0.5, leg.baseLowerZ, eased);
        });
      } else {
        // Ocultar hilo completamente después de la entrada
        if (thread.visible) {
          thread.visible = false;
        }
        spider.rotation.z = 0;
      }

      // ── RESPIRACIÓN / BOB según estado ─────────────────────────
      if (!entering) {
        if (walking) {
          // Walking: stronger bob + forward lean + body sway
          const walkCycle = t * 7;
          const bobAmount = Math.abs(Math.sin(walkCycle)) * 0.22;
          spider.position.y = bobAmount;
          // Forward lean when walking (more visible pitch)
          spider.rotation.x = Math.sin(walkCycle * 0.5) * 0.1;
          // Body sway — lateral weight shift
          spider.rotation.z = Math.sin(walkCycle) * 0.06;
        } else {
          // Idle: gentle breathing + weight shifts
          spider.position.y = Math.sin(t * 1.8) * 0.05;
          spider.rotation.x = Math.sin(t * 0.9) * 0.01; // subtle pitch
          spider.rotation.z = Math.sin(t * 1.2) * 0.015;
        }
      }

      // ── Abdomen: respiración más visible ───────────────────────
      const breatheAmp = walking ? 0.06 : 0.04;
      const breatheSpeed = walking ? 5 : 1.8;
      const breathe = 1 + Math.sin(t * breatheSpeed) * breatheAmp;
      // Lateral expansion (wider when breathing in)
      const lateralBreathe = 1 + Math.sin(t * breatheSpeed + 0.3) * (breatheAmp * 0.6);
      abdomen.scale.set(lateralBreathe, 0.92 * breathe, 1.18 * breathe);

      // ── PATAS: Marcha tetrapoda natural ────────────────────────
      legs.forEach((leg, i) => {
        if (entering) return; // skip during entrance

        // Determine which gait pair this leg belongs to
        const pairIdx = GAIT_PAIRS.findIndex((pair) => pair.includes(i));
        const pairPhase = pairIdx >= 0 ? (pairIdx < 2 ? 0 : Math.PI) : 0;

        if (walking) {
          // Tetrapod gait: legs in same pair move together
          const walkT = t * 7;
          const wave = Math.sin(walkT + pairPhase);
          const liftPhase = Math.max(0, wave); // positive = lifting

          // Upper leg: lift + forward
          leg.upper.rotation.x = wave * 0.35;
          leg.root.rotation.y = wave * 0.3;

          // Lower leg: bend more during lift phase
          const kneeLift = easeInOutCubic(liftPhase) * 0.25;
          leg.lower.rotation.z = leg.baseLowerZ - kneeLift;

          // Micro life
          leg.root.rotation.x += Math.sin(t * 0.7 + i) * 0.003;
        } else {
          // Idle: very subtle micro-movements with occasional twitches
          const idlePhase = t * 1.5 + i * 0.8;
          const micro = Math.sin(idlePhase) * 0.015;
          leg.upper.rotation.x = micro;

          // Occasional twitch (random per leg)
          const twitchChance = Math.sin(t * 0.3 + i * 2.1);
          if (twitchChance > 0.97) {
            leg.upper.rotation.x += 0.08;
          }

          // Subtle weight shift
          leg.root.rotation.y = Math.sin(t * 0.6 + i * 0.5) * 0.02;
          leg.lower.rotation.z = leg.baseLowerZ + Math.sin(t * 0.9 + i) * 0.02;
        }
      });

      // ── FASE C: animación del modelo GLB ──────────────────────
      if (model.ready && model.group) {
        // GLB legs: tetrapod gait
        model.legRoots.forEach((n, idx) => {
          const rest = model.rest.get(n)!;
          const pairIdx = GAIT_PAIRS.findIndex((pair) => pair.includes(idx));
          const pairPhase = pairIdx >= 0 ? (pairIdx < 2 ? 0 : Math.PI) : 0;

          if (walking) {
            const walkT = t * 7;
            const wave = Math.sin(walkT + pairPhase);
            n.quaternion.copy(rest);
            n.rotateY(wave * 0.12);
            n.rotateX(Math.sin(t * 0.8 + idx) * 0.02);
          } else {
            n.quaternion.copy(rest);
            const micro = Math.sin(t * 1.5 + idx * 0.8) * 0.02;
            n.rotateY(micro);
            n.rotateX(Math.sin(t * 0.3 + idx * 2.1) > 0.97 ? 0.06 : 0);
          }
        });

        model.knees.forEach((n, idx) => {
          const rest = model.rest.get(n)!;
          if (walking) {
            const kneeLift = Math.max(0, Math.sin(t * 7 + (idx % 2 === 0 ? 0 : Math.PI))) * 0.2;
            n.quaternion.copy(rest);
            n.rotateZ(-kneeLift);
          } else {
            n.quaternion.copy(rest);
            n.rotateZ(Math.sin(t * 0.9 + idx) * 0.03);
          }
        });

        if (model.abdomen) {
          const rs = model.restScale.get(model.abdomen)!;
          const b = 1 + Math.sin(t * (walking ? 5 : 1.8)) * (walking ? 0.05 : 0.04);
          const lateral = 1 + Math.sin(t * (walking ? 5 : 1.8) + 0.3) * (walking ? 0.03 : 0.025);
          model.abdomen.scale.set(rs.x * lateral, rs.y * b, rs.z * b);
        }

        // Fang typing: slower, more natural rhythm
        model.fangs.forEach((f, i) => {
          const rest = model.rest.get(f)!;
          f.quaternion.copy(rest);
          if (p.isOpen) {
            // Slower typing: 3-4 Hz instead of 14 Hz
            const typePhase = Math.sin(t * 3.5 + i * Math.PI * 0.7);
            const typeAmount = typePhase > 0.3 ? typePhase * 0.3 : 0;
            f.rotateX(0.2 + typeAmount);
          }
        });

        // Pupil tracking with saccade
        const mx = p.mousePos.x - (window.innerWidth - 40);
        const my = p.mousePos.y - (window.innerHeight - 40);
        tmpVec2.set(mx * 0.001, my * 0.001);
        const tracked = saccadeCtrl.update(t, dt, tmpVec2);
        model.pupils.forEach((pu) => {
          pu.position.x = THREE.MathUtils.clamp(tracked.x * 0.9, -0.09, 0.09);
          pu.position.y = THREE.MathUtils.clamp(-tracked.y * 0.9, -0.07, 0.07);
        });

        // Eye blink for GLB model
        const blinkAmount = blinkCtrl.update(t);
        model.eyeGroups.forEach((eyeG) => {
          // Scale Y of eye group to simulate blink
          const s = 1 - blinkAmount * 0.85;
          eyeG.scale.y = Math.max(0.15, s);
        });

        // Pedipalps: react to mouse like feelers
        model.pedipalps.forEach((pp, i) => {
          const rest = model.rest.get(pp)!;
          pp.quaternion.copy(rest);
          // Tilt toward mouse
          const feelerAngle = (mx / window.innerWidth) * 0.3 * (i === 0 ? 1 : -1);
          pp.rotateZ(feelerAngle);
          // Subtle pulse
          pp.rotateX(Math.sin(t * 2 + i * Math.PI) * 0.05);
        });
      }

      // ── PROCEDURAL EYES: tracking + blink + saccade ────────────
      const mxP = p.mousePos.x - (window.innerWidth - 40);
      const myP = p.mousePos.y - (window.innerHeight - 40);
      tmpDir.set(mxP, myP, 300).normalize().multiplyScalar(0.09);

      const blinkAmt = blinkCtrl.update(t);
      const trackedProc = saccadeCtrl.update(t, dt, tmpVec2.set(tmpDir.x, tmpDir.y));

      eyeGroups.forEach((g, i) => {
        const pupil = pupils[i];
        const lid = eyeLids[i];

        // Pupil tracking
        pupil.position.x += (trackedProc.x - pupil.position.x) * 0.15;
        pupil.position.y += (-trackedProc.y - pupil.position.y) * 0.15;

        // Eye group look direction
        g.lookAt(trackedProc.x * 8, trackedProc.y * 8 + 0.8, 6);

        // Blink via lid scale
        const lidScale = blinkAmt * 1.2;
        lid.scale.y = lidScale;
        lid.position.y = 0.12 - blinkAmt * 0.25;
      });

      // ── Ocelos: pulso desfasado ────────────────────────────────
      minors.forEach((m, i) => {
        const s = 0.75 + Math.abs(Math.sin(t * 2.2 + i * 0.9)) * 0.5;
        m.scale.setScalar(s);
      });

      // ── Colmillos procedentes: ritmo natural ───────────────────
      fangs.forEach((f, i) => {
        const target = p.isOpen ? 0.25 + Math.sin(t * 3.5 + i * Math.PI * 0.7) * 0.15 : 0;
        f.rotation.x += (Math.PI - 0.35 - target - f.rotation.x) * 0.15;
      });

      // ── Pedipalpos procedentes: reactivos al mouse ──────────────
      pedipalps.forEach((pp, i) => {
        const baseRotZ = i === 0 ? 0.5 : -0.5;
        const feelerTilt = (mxP / window.innerWidth) * 0.25 * (i === 0 ? 1 : -1);
        const pulse = Math.sin(t * 2 + i * Math.PI) * 0.04;
        pp.rotation.z += (baseRotZ + feelerTilt + pulse - pp.rotation.z) * 0.08;
        pp.rotation.x = 0.9 + Math.sin(t * 1.5 + i) * 0.03;
      });

      // ── Hilo: balanceo + brillo del acento orbitando ────────────
      if (!entering) {
        thread.rotation.z = Math.sin(t * 0.8) * 0.03;
      }
      accent.position.x = Math.sin(t * 1.1) * 1.8;
      accent.position.y = 2.2 + Math.cos(t * 0.9) * 0.8;
      (shine.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 1.5) * 0.05;

      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visHandler);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mm = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mm)) mm.forEach((m) => m.dispose());
        else mm?.dispose();
      });
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />;
}

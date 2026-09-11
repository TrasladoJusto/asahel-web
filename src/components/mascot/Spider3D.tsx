'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRigMap } from './spider/rigMap';
import { computeGait } from './spider/gait';
import { computeBehavior, resetBehavior, setSeed } from './spider/behavior';
import { createSilkState, stepSilk } from './spider/silk';
import { applySectionTint, parseHexColor, buildContractMaterials } from './spider/colors';
import { SpiderPerf } from './spider/perf';

export type SpiderState = 'entering' | 'walking' | 'idle';

interface Spider3DProps {
  mousePos: { x: number; y: number };
  isOpen: boolean;
  state: SpiderState;
  mascotColor: string;
  onReady?: () => void;
}

/**
 * ARAÑA DEV — Spider 3D v5 · Realistic locomotion
 *
 * Novedades vs v4:
 *  - Mapeo por NOMBRE del rig (rigMap.ts) — corrige el bug de índice del GLB.
 *  - Marcha arácnida con IK de 2 huesos + transferencia de peso (gait.ts).
 *  - Seda con catenaria + inercia amortiguada (silk.ts).
 *  - Gatillos de comportamiento biológico (behavior.ts).
 *  - Backend procedural y GLB comparten el MISMO contrato → animación única.
 */

export default function Spider3D({ mousePos, isOpen, state, mascotColor, onReady }: Spider3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ mousePos, isOpen, state, mascotColor });
  propsRef.current = { mousePos, isOpen, state, mascotColor };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 64;
    const height = mount.clientHeight || 64;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
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
    camera.position.set(0, 0.6, 12.6);
    camera.lookAt(0, 0, 4);

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

    setSeed(12345);
    resetBehavior();

    // ── Observabilidad / rendimiento ────────────────────────────
    const perf = new SpiderPerf();

    // ── Seda (física) ───────────────────────────────────────────
    const silkState = createSilkState(0, 6.4);
    const silkTargetGeo = new THREE.BufferGeometry();
    const silkPositions = new Float32Array(25 * 3);
    silkTargetGeo.setAttribute('position', new THREE.BufferAttribute(silkPositions, 3));
    const silkLine = new THREE.Line(
      silkTargetGeo,
      new THREE.LineBasicMaterial({
        color: new THREE.Color(mascotColor),
        transparent: true,
        opacity: 0.55,
      })
    );
    silkLine.frustumCulled = false;
    scene.add(silkLine);

    // ── Contenedor de la araña (procedural + GLB coexisten) ──────
    const spiderGroup = new THREE.Group();
    scene.add(spiderGroup);

    // ── Procedural rig (fallback) ────────────────────────────────
    // (Se construye SIEMPRE como base; si carga el GLB se oculta y reemplaza.)
    const procedural = buildProceduralRig(propsRef.current.mascotColor);
    spiderGroup.add(procedural.group);

    // ── GLB artístico ────────────────────────────────────────────
    let glbRig: ReturnType<typeof buildRigMap> | null = null;

    new GLTFLoader().load(
      '/models/arana-dev.glb',
      (gltf) => {
        perf.glbLoadMs = performance.now() - perf.startTime;
        const g = gltf.scene;
        const box = new THREE.Box3().setFromObject(g);
        const size = box.getSize(new THREE.Vector3());
        const s = 7.0 / Math.max(size.x, size.y, size.z);
        g.scale.setScalar(s);
        g.updateMatrixWorld(true);
        const nb = new THREE.Box3().setFromObject(g);
        const c = nb.getCenter(new THREE.Vector3());
        g.position.set(-c.x, -nb.min.y - 2.05, -c.z);
        spiderGroup.add(g);
        glbRig = buildRigMap(g);
        // ocultar procedural cuando el GLB real está listo
        procedural.group.visible = false;
      },
      undefined,
      () => {
        /* fallo → procedural sigue visible */
      }
    );

    // ── Loop de animación ───────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    let elapsed = 0;
    let readyFired = false;
    let running = !document.hidden;
    const visHandler = () => (running = !document.hidden);
    document.addEventListener('visibilitychange', visHandler);

    const targetColor = parseHexColor(mascotColor);
    let prevState: SpiderState = 'idle';
    let stateTime = 0;

    function tick() {
      raf = requestAnimationFrame(tick);
      if (!running) {
        clock.getDelta();
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const t = elapsed;
      const p = propsRef.current;

      if (!readyFired && t > 0.05) {
        readyFired = true;
        onReady?.();
      }

      if (p.state !== prevState) {
        stateTime = t;
        prevState = p.state;
      }
      const stateDt = t - stateTime;

      // color de sección
      targetColor.set(p.mascotColor);
      accent.color.lerp(targetColor, 0.08);
      (silkLine.material as THREE.LineBasicMaterial).color.lerp(targetColor, 0.08);

      const walking = p.state === 'walking';
      const entering = p.state === 'entering';

      // comportamiento
      const mx = p.mousePos.x - (window.innerWidth - 40);
      const my = p.mousePos.y - (window.innerHeight - 40);
      const prox = Math.max(0, Math.min(1, 1 - Math.hypot(mx, my) / (window.innerWidth / 2)));
      const behavior = computeBehavior({
        t,
        cursorProximity: prox,
        hoveringInteractive: false,
        chatOpen: p.isOpen,
        walking,
      });

      // seleccionar el rig activo
      const rig = glbRig ?? procedural.rig;

      // ── ENTRADA (péndulo descendente) ──────────────────────────
      let spiderY = 0;
      if (entering) {
        const pendulum = Math.min(stateDt / 2.5, 1);
        const eased = 1 - Math.pow(1 - pendulum, 3);
        spiderY = THREE.MathUtils.lerp(8, 0, eased);
        const swing = Math.sin(stateDt * 4) * (1 - eased) * 0.5;
        spiderGroup.rotation.z = swing;
        (silkLine.material as THREE.LineBasicMaterial).opacity = eased * 0.55;
      } else {
        spiderGroup.rotation.z = 0;
        (silkLine.material as THREE.LineBasicMaterial).opacity = 0;
      }

      // ── MARCHA IK + peso ───────────────────────────────────────
      const gait = computeGait({
        t,
        speed: walking ? 1 : 0,
        heading: 0,
        stride: 0.5,
      });

      if (walking || entering) {
        // body lift/sway
        spiderY += gait.bodyLift * (walking ? 1 : 0.2);
        spiderGroup.position.y = spiderY;
        spiderGroup.rotation.x = gait.bodyPitch;
        spiderGroup.rotation.z += gait.bodyRoll;
      } else {
        // idle: respiración
        spiderGroup.position.y = Math.sin(t * 1.8) * 0.05;
        spiderGroup.rotation.x = Math.sin(t * 0.9) * 0.01;
        spiderGroup.rotation.z = Math.sin(t * 1.2) * 0.015;
      }

      // aplicar IK a las patas del rig activo
      rig.roots.forEach((root, i) => {
        const g = gait.legs[i];
        if (!g) return;
        // root: rotación para alcanzar (pitch = shoulder, yaw = dirección)
        root.quaternion.copy(rig.restQuat.get(root)!);
        root.rotateY(g.rootYaw);
        root.rotateX(g.rootPitch);
      });
      rig.knees.forEach((knee, i) => {
        const g = gait.legs[i];
        if (!g) return;
        knee.quaternion.copy(rig.restQuat.get(knee)!);
        knee.rotateX(g.kneeFlex);
        knee.rotateY(0);
      });

      // abdomen: respiración
      if (rig.abdomen) {
        const rs = rig.restScale.get(rig.abdomen) ?? new THREE.Vector3(1, 1, 1);
        const breatheAmp = walking ? 0.06 : 0.04;
        const breathe = 1 + Math.sin(t * (walking ? 5 : 1.8)) * breatheAmp;
        const lateral = 1 + Math.sin(t * (walking ? 5 : 1.8) + 0.3) * (breatheAmp * 0.6);
        rig.abdomen.scale.set(rs.x * lateral, rs.y * breathe, rs.z * breathe);
      }

      // pupilas + parpadeo + sacadas
      rig.pupils.forEach((pu) => {
        const track = behavior.saccade;
        pu.position.x = THREE.MathUtils.clamp(mx * 0.0009 + track.x, -0.09, 0.09);
        pu.position.y = THREE.MathUtils.clamp(-my * 0.0009 + track.y, -0.07, 0.07);
      });
      const blinkScale = behavior.blink ? 0.15 : 1;
      rig.eyeGroups.forEach((eye) => {
        eye.scale.y = blinkScale;
      });

      // colmillos al teclear (chat abierto)
      rig.fangs.forEach((f, i) => {
        const rest = rig.restQuat.get(f)!;
        f.quaternion.copy(rest);
        if (p.isOpen) {
          const typePhase = Math.sin(t * 3.5 + i * Math.PI * 0.7);
          f.rotateX(0.2 + (typePhase > 0.3 ? typePhase * 0.3 : 0));
        }
      });

      // pedipalpos reactivos
      rig.pedipalps.forEach((pp, i) => {
        const rest = rig.restQuat.get(pp)!;
        pp.quaternion.copy(rest);
        const feel = (mx / window.innerWidth) * 0.3 * (i === 0 ? 1 : -1);
        pp.rotateZ(feel);
        pp.rotateX(Math.sin(t * 2 + i * Math.PI) * 0.05);
      });

      // tilt corporal hacia el interés
      spiderGroup.rotation.z += behavior.lean * 0.04;

      // ── SEDA física ────────────────────────────────────────────
      const anchorX = 0;
      const anchorY = 12;
      // la aceleración de la araña se aproxima por su velocidad de fase
      const frame = stepSilk(silkState, dt, anchorX, anchorY, gait.bodySway * 20, 0);
      const pts = frame.points;
      silkPositions[0] = anchorX;
      silkPositions[1] = anchorY;
      silkPositions[2] = 0;
      for (let i = 1; i < 24; i++) {
        silkPositions[i * 3] = pts[Math.min(i, pts.length - 1)].x;
        silkPositions[i * 3 + 1] = pts[Math.min(i, pts.length - 1)].y + spiderY;
        silkPositions[i * 3 + 2] = 0;
      }
      // último punto en la araña
      silkPositions[24 * 3] = spiderGroup.position.x;
      silkPositions[24 * 3 + 1] = spiderGroup.position.y;
      silkPositions[24 * 3 + 2] = 0;
      silkTargetGeo.attributes.position.needsUpdate = true;
      if (entering) {
        (silkLine.material as THREE.LineBasicMaterial).opacity = frame.opacity;
      }

      // tint de materiales
      const bodyMats = rig.bodyMats;
      const tintMats = rig.tintMats;
      const glowMats = rig.glowMats;
      applySectionTint(bodyMats, tintMats, glowMats, targetColor, 0.06);

      accent.position.x = Math.sin(t * 1.1) * 1.8;
      accent.position.y = 2.2 + Math.cos(t * 0.9) * 0.8;

      renderer.render(scene, camera);
      const info = renderer.info.render;
      perf.frame(dt * 1000, info.calls, info.triangles);
      if (perf.frameCount === 300 && process.env.NODE_ENV !== 'production') {
        perf.report('after-300-frames');
      }
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

/**
 * Construye un rig procedural que cumple EXACTAMENTE el contrato de
 * CONTRATO_RIG_ARANA.md (mismos nombres y estructura), para que el loop de
 * animación único funcione igual si el .glb no carga.
 */
function buildProceduralRig(color: string) {
  const { body, dark, eye, glow, mark } = buildSectionMaterials(color);

  const group = new THREE.Group();
  const rig = {
    roots: [] as THREE.Object3D[],
    knees: [] as THREE.Object3D[],
    tibias: [] as THREE.Object3D[],
    tarsis: [] as THREE.Object3D[],
    fangs: [] as THREE.Object3D[],
    chelicerae: [] as THREE.Object3D[],
    pedipalps: [] as THREE.Object3D[],
    pupils: [] as THREE.Object3D[],
    eyeGroups: [] as THREE.Object3D[],
    minorEyes: [] as THREE.Object3D[],
    abdomen: null as THREE.Object3D | null,
    cephalothorax: null as THREE.Object3D | null,
    spinnerets: [] as THREE.Object3D[],
    marks: [] as THREE.Object3D[],
    restQuat: new Map<THREE.Object3D, THREE.Quaternion>(),
    restScale: new Map<THREE.Object3D, THREE.Vector3>(),
    bodyMats: [] as THREE.MeshStandardMaterial[],
    tintMats: [] as THREE.MeshStandardMaterial[],
    glowMats: [] as THREE.MeshStandardMaterial[],
    eyeMats: [] as THREE.MeshStandardMaterial[],
    darkMats: [] as THREE.MeshStandardMaterial[],
  };
  rig.bodyMats = [body];
  rig.eyeMats = [eye];
  rig.tintMats = [mark];
  rig.glowMats = [glow];
  rig.darkMats = [dark];

  const cap = (o: THREE.Object3D) => {
    rig.restQuat.set(o, o.quaternion.clone());
    rig.restScale.set(o, o.scale.clone());
  };

  // cefalotórax
  const cephalo = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), body);
  cephalo.name = 'Cephalothorax';
  cephalo.position.set(0, 0.65, -0.15);
  group.add(cephalo);
  rig.cephalothorax = cephalo;

  // abdomen
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), body);
  abdomen.name = 'Abdomen';
  abdomen.scale.set(1.0, 0.92, 1.18);
  abdomen.position.set(0, -1.05, 0.35);
  group.add(abdomen);
  rig.abdomen = abdomen;
  rig.restScale.set(abdomen, abdomen.scale.clone());

  // pedicel
  const pedicel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 10), dark);
  pedicel.position.set(0, -0.05, 0.1);
  group.add(pedicel);

  // ojos
  const eyeGroups: THREE.Group[] = [];
  const pupils: THREE.Mesh[] = [];
  for (const ex of [-0.22, 0.22]) {
    const eg = new THREE.Group();
    eg.name = ex < 0 ? 'Eye_L' : 'Eye_R';
    eg.position.set(ex, 0.82, 0.62);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 16), eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), glow);
    pupil.name = ex < 0 ? 'Pupil_L' : 'Pupil_R';
    pupil.position.z = 0.18;
    eg.add(ball);
    eg.add(pupil);
    group.add(eg);
    eyeGroups.push(eg);
    pupils.push(pupil);
    rig.eyeGroups.push(eg);
    rig.pupils.push(pupil);
    cap(eg);
    cap(pupil);
  }

  // colmillos
  for (const fx of [-0.18, 0.18]) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 10), dark);
    f.name = fx < 0 ? 'Fang_L' : 'Fang_R';
    f.position.set(fx, 0.28, 0.68);
    f.rotation.x = Math.PI - 0.35;
    group.add(f);
    rig.fangs.push(f);
    cap(f);
  }

  // pedipalpos
  for (const px of [-0.42, 0.42]) {
    const pp = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 8), body);
    pp.name = px < 0 ? 'Pedipalp_L' : 'Pedipalp_R';
    pp.position.set(px, 0.22, 0.66);
    pp.rotation.x = 0.9;
    group.add(pp);
    rig.pedipalps.push(pp);
    cap(pp);
  }

  // patas ×8
  const legCfg = [
    { x: 1.15, y: 0.3, z: -1.25 },
    { x: 1.05, y: 0.0, z: -0.65 },
    { x: 0.95, y: -0.3, z: 0.05 },
    { x: 0.9, y: -0.55, z: 0.85 },
  ];
  for (const side of [1, -1] as const) {
    for (let i = 0; i < 4; i++) {
      const cfg = legCfg[i];
      const sideL = side === -1 ? 'L' : 'R';
      const root = new THREE.Group();
      root.name = `Leg_${sideL}${i}_Root`;
      root.position.set(cfg.x * side, cfg.y, cfg.z);
      const knee = new THREE.Group();
      knee.name = `Leg_${sideL}${i}_Knee`;
      knee.position.set(0, 1.45, 0);
      // femur
      const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.105, 1.45, 8), body);
      femur.name = `Leg_${sideL}${i}_Femur`;
      femur.position.set(0, 0.72, 0);
      // tibia
      const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 1.85, 8), body);
      tibia.name = `Leg_${sideL}${i}_Tibia`;
      tibia.position.set(0, 0.9, 0);
      const tarsus = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), dark);
      tarsus.name = `Leg_${sideL}${i}_Tarsus`;
      tarsus.position.set(0, 1.85, 0);

      knee.add(tibia);
      knee.add(tarsus);
      root.add(femur);
      root.add(knee);
      group.add(root);
      rig.roots.push(root);
      rig.knees.push(knee);
      rig.tibias.push(tibia);
      rig.tarsis.push(tarsus);
      cap(root);
      cap(knee);
    }
  }

  return { group, rig };
}

function buildSectionMaterials(color: string) {
  const m = buildContractMaterials();
  m.body.color.set(color);
  m.body.emissive.set(color);
  m.body.emissiveIntensity = 0.12;
  return m;
}

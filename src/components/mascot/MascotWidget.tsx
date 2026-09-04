'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChatBubble } from './ChatBubble';
import { Tooltip } from './Tooltip';
import { useMousePosition } from './useMousePosition';
import { useSectionColor } from './useSectionColor';
import { useMascotState } from './useMascotState';
import type { SpiderState } from './Spider3D';
import './spider.css';

const Spider3D = dynamic(() => import('./Spider3D'), { ssr: false });

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function canRun3D(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return hasWebGL();
}

function useDynamicAccent(sectionColor: string) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', sectionColor);
    root.style.setProperty('--accent-hover', sectionColor);
    root.style.setProperty('--focus', sectionColor);
  }, [sectionColor]);
}

// ── Easing ────────────────────────────────────────────────────
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ── Noise ─────────────────────────────────────────────────────
function pseudoNoise(x: number): number {
  const s = Math.sin(x * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

type Phase = 'entry' | 'walking' | 'pausing' | 'looking' | 'dock' | 'docked' | 'undocking';

/**
 * Spider mascot — patrulla orgánicamente, dock a esquina, abre chat DESPUÉS de llegar.
 *
 * FLUJO CORRECTO:
 *   Click → phase='dock' (araña camina a esquina)
 *   Dock completa → phase='docked' + dispatch('expanding') → chat abre
 *   Close (X/Esc/outside) → dispatch('idle') → chat cierra → phase='undocking'
 *   Undock completa → phase='walking' (reanuda patrulla)
 */
export function MascotWidget() {
  const [isReady, setIsReady] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [enable3D, setEnable3D] = useState(false);
  const [ready3D, setReady3D] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const isDockedRef = useRef(false);
  const isOpenRef = useRef(false);
  const pendingChatOpenRef = useRef(false);
  const closingRef = useRef(false);

  const [spiderStyle, setSpiderStyle] = useState<React.CSSProperties>({
    transform: 'translate(50vw, 15vh)',
    opacity: 0,
  });

  const mousePos = useMousePosition();
  const sectionColor = useSectionColor();
  useDynamicAccent(sectionColor);

  const { isWalking, isOpen, isEntering, dispatch, finishEntering } =
    useMascotState();

  // Store dispatch in ref so RAF loop can call it
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // Keep refs in sync
  useEffect(() => { isDockedRef.current = isDocked; }, [isDocked]);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const btnWrapRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef(mousePos);
  mousePosRef.current = mousePos;

  // ── Movement state ─────────────────────────────────────────
  const s = useRef({
    x: 50, y: 15,
    targetX: 50, targetY: 15,
    cp1x: 50, cp1y: 15,
    cp2x: 50, cp2y: 15,
    progress: 0,
    totalDuration: 2500,
    phase: 'entry' as Phase,
    pauseEnd: 0,
    walkStartX: 50,
    walkStartY: 15,
    rotation: 0,
    targetRotation: 0,
    scaleX: 1, scaleY: 1,
    entryStart: 0,
    entryDone: false,
    dockTargetX: 0,
    dockTargetY: 0,
    lastWaypointX: 50,
    lastWaypointY: 15,
    smoothRotation: 0,
    smoothScaleX: 1,
    smoothScaleY: 1,
  });

  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    if (canRun3D()) setEnable3D(true);
  }, []);

  // Mount sequence
  useEffect(() => {
    const t1 = setTimeout(() => {
      setIsReady(true);
      s.current.entryStart = performance.now();
    }, 800);
    const t2 = setTimeout(() => {
      finishEntering();
      s.current.entryDone = true;
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [finishEntering]);

  // ── CLICK: toggle dock/patrol ──────────────────────────────
  const handleClick = useCallback(() => {
    setShowTooltip(false);
    const st = s.current;
    const docked = isDockedRef.current;
    const opened = isOpenRef.current;
    const closing = closingRef.current;

    // Si está cerrando, ignorar click
    if (closing) return;

    if (docked || opened) {
      // CERRAR: primero cierra chat, luego araña se va
      closingRef.current = true;
      isOpenRef.current = false;
      dispatch('idle'); // Cierra chat

      // Pequeña pausa para que el cierre se vea, luego undock
      setTimeout(() => {
        setIsDocked(false);
        isDockedRef.current = false;
        st.phase = 'undocking';
        st.walkStartX = st.x;
        st.walkStartY = st.y;
        st.progress = 0;
        // Destino: posición aleatoria visible, evitando CTA y navbar
        const vw = window.innerWidth;
        const isDesktop = vw >= 768;
        // Safe zones: top area (Y 8-48%) or bottom area (Y 70-85%)
        const useTop = Math.random() > 0.4;
        const minX = isDesktop ? 12 : 8;
        const maxX = isDesktop ? 72 : 62;
        st.targetX = minX + Math.random() * (maxX - minX);
        st.targetY = useTop
          ? 10 + Math.random() * 36   // 10-46%
          : 70 + Math.random() * 13;   // 70-83%
        closingRef.current = false;
      }, 300);
    } else {
      // ABRIR: araña camina a la esquina PRIMERO
      setIsDocked(true);
      isDockedRef.current = true;
      pendingChatOpenRef.current = true;
      st.phase = 'dock';
      const vw = window.innerWidth;
      const isDesktop = vw >= 768;
      // Dock profundo — siempre en la esquina más lejana
      st.dockTargetX = isDesktop ? 93 : 80;
      st.dockTargetY = isDesktop ? 88 : 82;
      st.walkStartX = st.x;
      st.walkStartY = st.y;
      st.progress = 0;
      st.smoothRotation = 0;
      // Activar animación de caminar para el dock
      dispatchRef.current('walking');
    }
  }, [dispatch]);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    isOpenRef.current = false;
    dispatch('idle');

    const st = s.current;
    setTimeout(() => {
      setIsDocked(false);
      isDockedRef.current = false;
      st.phase = 'undocking';
      st.walkStartX = st.x;
      st.walkStartY = st.y;
      st.progress = 0;
      // Random destination across the full page
      const vw = window.innerWidth;
      const isDesktop = vw >= 768;
      st.targetX = (isDesktop ? 8 : 5) + Math.random() * (isDesktop ? 80 : 75);
      st.targetY = 12 + Math.random() * 70;
      // Ensure not in exclusion zone
      if (isInExclusionZone(st.targetX, st.targetY)) {
        st.targetX = isDesktop ? 15 + Math.random() * 65 : 10 + Math.random() * 60;
        st.targetY = Math.random() > 0.5 ? 15 + Math.random() * 30 : 72 + Math.random() * 12;
      }
      dispatchRef.current('walking');
      closingRef.current = false;
    }, 300);
  }, [dispatch]);

  // ── EXCLUSION ZONES (percent of viewport) ──────────────────
  // CTA buttons area: Y ≈ 52-68%, X ≈ 18-68%
  // Navbar: Y ≈ 0-7%
  // Widened slightly to account for bob (±0.1vh) and Bezier curve overshoot
  function isInExclusionZone(x: number, y: number): boolean {
    // Navbar zone
    if (y < 8) return true;
    // Hero CTA buttons zone (widened by 2% each side for bob safety)
    if (y > 50 && y < 70 && x > 16 && x < 70) return true;
    // Email button zone (widened)
    if (y > 59 && y < 69 && x > 53 && x < 80) return true;
    return false;
  }

  // ── GENERATE RANDOM WANDERING WAYPOINT ──────────────────────
  // Truly random path: the spider drifts in semi-random directions
  // across the ENTIRE page, not just between fixed positions.
  // ── MAIN LOOP ──────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    let running = true;
    lastFrameRef.current = performance.now();

    let wanderAngle = Math.random() * Math.PI * 2;

    function generateWaypoint() {
    const st = s.current;
    const vw = window.innerWidth;
    const isDesktop = vw >= 768;

    // Full page range (the spider roams EVERYWHERE except exclusion zones)
    const minX = isDesktop ? 4 : 3;
    const maxX = isDesktop ? 92 : 85;
    const minY = isDesktop ? 10 : 10;
    const maxY = isDesktop ? 88 : 85;

    // Wander: rotate angle randomly + drift forward
    // This creates organic, non-repetitive paths
    wanderAngle += (Math.random() - 0.5) * 1.8; // ±52° random turn
    const stepDist = 15 + Math.random() * 25; // 15-40% of viewport as step

    let newX = st.x + Math.cos(wanderAngle) * stepDist;
    let newY = st.y + Math.sin(wanderAngle) * stepDist;

    // Bounce off page edges (like a screen saver)
    if (newX < minX) { newX = minX + Math.random() * 10; wanderAngle = Math.random() * Math.PI - Math.PI / 2; }
    if (newX > maxX) { newX = maxX - Math.random() * 10; wanderAngle = Math.PI + (Math.random() * Math.PI - Math.PI / 2); }
    if (newY < minY) { newY = minY + Math.random() * 10; wanderAngle = Math.random() * Math.PI; }
    if (newY > maxY) { newY = maxY - Math.random() * 10; wanderAngle = -Math.random() * Math.PI; }

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

    // If landed in exclusion zone, deflect angle and retry
    let attempts = 0;
    while (isInExclusionZone(newX, newY) && attempts < 12) {
      wanderAngle += Math.PI * 0.6; // turn 108° away
      newX = st.x + Math.cos(wanderAngle) * stepDist * 0.6;
      newY = st.y + Math.sin(wanderAngle) * stepDist * 0.6;
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      attempts++;
    }

    // Safety fallback: random safe spot
    if (isInExclusionZone(newX, newY)) {
      const safe = [
        { x: 15, y: 20 }, { x: 75, y: 20 },
        { x: 15, y: 75 }, { x: 75, y: 75 },
        { x: 50, y: 25 }, { x: 50, y: 80 },
      ];
      const s = safe[Math.floor(Math.random() * safe.length)];
      newX = s.x; newY = s.y;
    }

    st.lastWaypointX = newX;
    st.lastWaypointY = newY;

    // Bezier curvature — more curved for longer distances
    const dist = Math.hypot(newX - st.x, newY - st.y);
    const curvature = dist * 0.22;
    const angle = Math.atan2(newY - st.y, newX - st.x);
    const perpAngle = angle + Math.PI / 2;
    const dir = pseudoNoise(Date.now()) > 0.5 ? 1 : -1;
    const midX = (st.x + newX) / 2;
    const midY = (st.y + newY) / 2;

    st.cp1x = st.x + (midX - st.x) * 0.4 + Math.cos(perpAngle) * curvature * dir;
    st.cp1y = st.y + (midY - st.y) * 0.4 + Math.sin(perpAngle) * curvature * dir;
    st.cp2x = st.x + (newX - st.x) * 0.7 + Math.cos(perpAngle) * curvature * dir * 0.6;
    st.cp2y = st.y + (newY - st.y) * 0.7 + Math.sin(perpAngle) * curvature * dir * 0.6;

    st.targetX = newX;
    st.targetY = newY;
    st.walkStartX = st.x;
    st.walkStartY = st.y;
    st.progress = 0;
    // Speed: slower for short hops, faster for long walks
    st.totalDuration = Math.max(1200, Math.min(6000, dist * 22));

    const rawAngle = Math.atan2(newY - st.y, newX - st.x) * (180 / Math.PI);
    st.targetRotation = Math.max(-8, Math.min(8, rawAngle * 0.04));

    // Signal walking state to Spider3D for leg animation
    dispatchRef.current('walking');
  }

    function evalBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
      const mt = 1 - t;
      return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
    }

    const tick = (now: number) => {
      if (!running) return;
      rafRef.current = requestAnimationFrame(tick);
      if (document.hidden) return;

      const dt = Math.min(50, now - lastFrameRef.current);
      lastFrameRef.current = now;
      const st = s.current;
      const mp = mousePosRef.current;

      // ── ENTRY ─────────────────────────────────────────────
      if (!st.entryDone) {
        const elapsed = now - st.entryStart;
        const progress = Math.min(1, elapsed / 2800);
        const eased = easeOutQuart(progress);
        st.x = 50 + Math.sin(progress * Math.PI * 2) * 3 * (1 - eased);
        st.y = eased * 15;
        setSpiderStyle({
          transform: `translate(${st.x}vw, ${st.y}vh)`,
          opacity: Math.min(1, progress * 3),
        });
        return;
      }

      // ── DOCKED: micro-breathe, ABRE CHAT ─────────────────
      if (st.phase === 'docked') {
        // Abrir chat la PRIMERA VEZ que llega a docked
        if (pendingChatOpenRef.current) {
          pendingChatOpenRef.current = false;
          isOpenRef.current = true;
          dispatchRef.current('expanding');
        }
        // Ultra-subtle breathing — almost imperceptible
        const breathe = Math.sin(now * 0.0012) * 0.005;
        st.smoothScaleX = lerp(st.smoothScaleX, 1, 0.04);
        st.smoothScaleY = lerp(st.smoothScaleY, 1 + breathe, 0.04);
        st.smoothRotation = lerp(st.smoothRotation, 0, 0.04);
        setSpiderStyle({
          transform: `translate(${st.x}vw, ${st.y}vh) rotate(${st.smoothRotation}deg) scale(${st.smoothScaleX}, ${st.smoothScaleY})`,
          opacity: 1,
        });
        return;
      }

      // ── DOCK: animar hacia esquina ────────────────────────
      if (st.phase === 'dock') {
        st.progress += dt / 1000; // 1s — natural pace
        if (st.progress >= 1) {
          st.progress = 1;
          st.x = st.dockTargetX;
          st.y = st.dockTargetY;
          st.phase = 'docked';
          st.smoothRotation = 0;
          st.smoothScaleX = 1;
          st.smoothScaleY = 1;
        } else {
          const eased = easeOutBack(Math.min(1, st.progress));
          st.x = lerp(st.walkStartX, st.dockTargetX, eased);
          st.y = lerp(st.walkStartY, st.dockTargetY, eased);
          // Smoothly settle rotation and scale
          st.smoothRotation = lerp(st.smoothRotation, 0, 0.08);
          st.smoothScaleX = lerp(st.smoothScaleX, 1, 0.08);
          st.smoothScaleY = lerp(st.smoothScaleY, 1, 0.08);
        }
        setSpiderStyle({
          transform: `translate(${st.x}vw, ${st.y}vh) rotate(${st.smoothRotation}deg) scale(${st.smoothScaleX}, ${st.smoothScaleY})`,
          opacity: 1,
        });
        return;
      }

      // ── UNDOCKING: volver a área de patrulla ──────────────
      if (st.phase === 'undocking') {
        st.progress += dt / 1100; // 1.1s — leisurely return
        if (st.progress >= 1) {
          st.progress = 1;
          st.x = st.targetX;
          st.y = st.targetY;
          st.phase = 'pausing';
          st.pauseEnd = now + 400 + Math.random() * 800;
          // Generate next waypoint while we're here
          generateWaypoint();
        } else {
          const eased = easeInOutCubic(st.progress);
          st.x = lerp(st.walkStartX, st.targetX, eased);
          st.y = lerp(st.walkStartY, st.targetY, eased);
          st.smoothRotation = lerp(st.smoothRotation, 0, 0.06);
          // Gentle acceleration curve
          const bounce = Math.sin(st.progress * Math.PI) * 0.012;
          st.smoothScaleX = lerp(st.smoothScaleX, 1 - bounce, 0.07);
          st.smoothScaleY = lerp(st.smoothScaleY, 1 + bounce, 0.07);
        }
        setSpiderStyle({
          transform: `translate(${st.x}vw, ${st.y}vh) rotate(${st.smoothRotation}deg) scale(${st.smoothScaleX}, ${st.smoothScaleY})`,
          opacity: 1,
        });
        return;
      }

      // ── PAUSE ─────────────────────────────────────────────
      if (st.phase === 'pausing') {
        if (now > st.pauseEnd) {
          st.phase = 'walking';
          generateWaypoint();
        }
        // Organic breathing: slow, subtle
        const breath = Math.sin(now * 0.0018) * 0.12;
        st.smoothRotation = lerp(st.smoothRotation, 0, 0.025);
        st.smoothScaleX = lerp(st.smoothScaleX, 1, 0.035);
        st.smoothScaleY = lerp(st.smoothScaleY, 1, 0.035);
        setSpiderStyle({
          transform: `translate(${st.x}vw, ${st.y + breath}vh) rotate(${st.smoothRotation}deg) scale(${st.smoothScaleX}, ${st.smoothScaleY})`,
          opacity: 1,
        });
        return;
      }

      // ── LOOK ──────────────────────────────────────────────
      if (st.phase === 'looking') {
        if (now > st.pauseEnd) {
          st.phase = 'walking';
          generateWaypoint();
        }
        // Smoothly track mouse — feels alive
        const mouseVw = (mp.x / window.innerWidth) * 100;
        const mouseVh = (mp.y / window.innerHeight) * 100;
        const lookAngle = Math.max(-5, Math.min(5,
          Math.atan2(mouseVh - st.y, mouseVw - st.x) * (180 / Math.PI) * 0.08
        ));
        st.smoothRotation = lerp(st.smoothRotation, lookAngle, 0.05);
        // Slight lean toward mouse
        st.smoothScaleX = lerp(st.smoothScaleX, 1.008, 0.04);
        st.smoothScaleY = lerp(st.smoothScaleY, 0.992, 0.04);
        setSpiderStyle({
          transform: `translate(${st.x}vw, ${st.y}vh) rotate(${st.smoothRotation}deg) scale(${st.smoothScaleX}, ${st.smoothScaleY})`,
          opacity: 1,
        });
        return;
      }

      // ── WALKING ───────────────────────────────────────────
      st.progress += dt / st.totalDuration;

      if (st.progress >= 1) {
        st.x = st.targetX;
        st.y = st.targetY;
        st.progress = 1;
        // Stop walking animation — legs go idle
        dispatchRef.current('idle');
        const roll = Math.random();
        if (roll < 0.15) {
          // Look at mouse briefly
          st.pauseEnd = now + 600 + Math.random() * 800;
          st.phase = 'looking';
        } else if (roll < 0.55) {
          // Pause — longer pauses feel more natural
          st.pauseEnd = now + 1200 + Math.random() * 2500;
          st.phase = 'pausing';
        } else {
          // Quick rest then continue
          st.pauseEnd = now + 200 + Math.random() * 400;
          st.phase = 'pausing';
        }
      } else {
        const easedProgress = easeInOutCubic(st.progress);
        st.x = evalBezier(easedProgress, st.walkStartX, st.cp1x, st.cp2x, st.targetX);
        st.y = evalBezier(easedProgress, st.walkStartY, st.cp1y, st.cp2y, st.targetY);

        // MID-WALK AVOIDANCE: if Bezier path crosses exclusion zone, skip ahead
        if (isInExclusionZone(st.x, st.y)) {
          // Fast-forward 15% to push past the zone
          st.progress = Math.min(0.99, st.progress + 0.15);
          const easedSkip = easeInOutCubic(st.progress);
          st.x = evalBezier(easedSkip, st.walkStartX, st.cp1x, st.cp2x, st.targetX);
          st.y = evalBezier(easedSkip, st.walkStartY, st.cp1y, st.cp2y, st.targetY);
        }

        // Organic bob — 5 cycles per walk, subtle amplitude
        const bobFreq = 5;
        const bobAmount = Math.sin(st.progress * Math.PI * bobFreq) * 0.1;
        st.y += bobAmount;

        // Rotation: smooth toward movement direction, capped ±6°
        const dx = st.targetX - st.walkStartX;
        const dy = st.targetY - st.walkStartY;
        const moveAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        st.targetRotation = Math.max(-6, Math.min(6, moveAngle * 0.035));
        // Higher lerp = snappier follow, but still smooth
        st.smoothRotation = lerp(st.smoothRotation, st.targetRotation, 0.06);

        // Squash/stretch: subtle, tied to walk cycle
        const walkCycle = Math.sin(st.progress * Math.PI * bobFreq);
        st.smoothScaleX = lerp(st.smoothScaleX, 1 - walkCycle * 0.018, 0.08);
        st.smoothScaleY = lerp(st.smoothScaleY, 1 + walkCycle * 0.022, 0.08);
      }

      // Hover reaction — only when close, subtle dodge + SLOW DOWN
      if (st.phase === 'walking' || st.phase === 'pausing') {
        const mouseVw = (mp.x / window.innerWidth) * 100;
        const mouseVh = (mp.y / window.innerHeight) * 100;
        const distToMouse = Math.hypot(mouseVw - st.x, mouseVh - st.y);

        if (distToMouse < 10) {
          // Slow down approach — makes spider feel more alive and easier to click
          if (st.phase === 'walking') {
            st.totalDuration *= 1.02; // Gradually slow down
          }
          const awayAngle = Math.atan2(st.y - mouseVh, st.x - mouseVw);
          st.smoothRotation += Math.sin(awayAngle) * 0.06;
        }
        st.smoothRotation = Math.max(-6, Math.min(6, st.smoothRotation));
      }

      setSpiderStyle({
        transform: `translate(${st.x}vw, ${st.y}vh) rotate(${st.smoothRotation}deg) scale(${st.smoothScaleX}, ${st.smoothScaleY})`,
        opacity: 1,
      });
    };

    rafRef.current = requestAnimationFrame(tick);
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        lastFrameRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isReady]);

  // ── Tooltip ────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || isEntering || isOpen || isDocked) return;
    const hasVisited = localStorage.getItem('asahel-mascot-seen');
    if (!hasVisited) {
      const showTimer = setTimeout(() => {
        setShowTooltip(true);
        localStorage.setItem('asahel-mascot-seen', 'true');
      }, 6000);
      const hideTimer = setTimeout(() => setShowTooltip(false), 12000);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
  }, [isReady, isEntering, isOpen, isDocked]);

  // ── HOVER REACTION ─────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    let hoverTimeout: ReturnType<typeof setTimeout>;
    const onHover = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest?.('.card, section h2, .btn-primary');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const cardCenterX = r.left + r.width / 2;
      const direction = cardCenterX < (s.current.x / 100) * window.innerWidth ? -1 : 1;
      if (btnWrapRef.current) {
        btnWrapRef.current.style.setProperty('--face-yaw', `${direction * 25}deg`);
      }
      clearTimeout(hoverTimeout);
    };
    const onLeave = () => {
      hoverTimeout = setTimeout(() => {
        btnWrapRef.current?.style.setProperty('--face-yaw', '0deg');
      }, 300);
    };
    document.addEventListener('mouseover', onHover);
    document.addEventListener('mouseout', onLeave);
    return () => {
      clearTimeout(hoverTimeout);
      document.removeEventListener('mouseover', onHover);
      document.removeEventListener('mouseout', onLeave);
    };
  }, [isReady]);

  // ── ESC + outside click ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const kd = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', kd);
    return () => document.removeEventListener('keydown', kd);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    const pd = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.mascot-container') && !t.closest('[role="dialog"]')) handleClose();
    };
    document.addEventListener('pointerdown', pd);
    return () => document.removeEventListener('pointerdown', pd);
  }, [isOpen, handleClose]);

  if (!isReady) return null;

  const animationState: SpiderState = isEntering
    ? 'entering'
    : isWalking || s.current.phase === 'pausing' || s.current.phase === 'looking'
      ? 'walking'
      : 'idle';

  // Chat se muestra SOLO cuando isOpen es true (después de llegar a esquina)
  const showChat = isOpen;

  return (
    <>
      {showChat && <ChatBubble onClose={handleClose} spiderX={s.current.x} spiderY={s.current.y} />}

      <div
        className="mascot-container"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          '--mascot-color': sectionColor,
          ...spiderStyle,
        } as React.CSSProperties}
      >
        {showTooltip && !isOpen && !isDocked && (
          <Tooltip
            text="¡Hola! Preguntame lo que quieras 👋"
            onClose={() => setShowTooltip(false)}
          />
        )}

        <button
          onClick={handleClick}
          className="mascot-btn relative w-[96px] h-[96px] md:w-[120px] md:h-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-full transition-shadow duration-200"
          aria-label={isOpen ? 'Cerrar chat de WhatsApp' : 'Abrir chat de WhatsApp'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <div
            ref={btnWrapRef}
            className="mascot-anim-wrapper relative w-full h-full"
            style={{ '--face-yaw': '0deg' } as React.CSSProperties}
          >
            {enable3D && (
              <div
                className="absolute inset-0 transition-opacity duration-700 spider-face-turn"
                style={{ opacity: ready3D ? 1 : 0 }}
              >
                <Spider3D
                  mousePos={mousePos}
                  isOpen={isOpen}
                  state={animationState}
                  mascotColor={sectionColor}
                  onReady={() => setReady3D(true)}
                />
              </div>
            )}
            {!enable3D && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full"
                  style={{ backgroundColor: sectionColor, opacity: 0.7 }}
                />
              </div>
            )}
          </div>
        </button>
      </div>
    </>
  );
}

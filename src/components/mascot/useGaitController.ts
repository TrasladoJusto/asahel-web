'use client';

import type { GaitPhase } from './types';

/**
 * Gait Controller — Natural walking patterns
 * Skill: frontend-ui-engineering
 * 
 * Produces natural tetrapod gait:
 * - 4 legs move in sync (diagonal pairs)
 * - Acceleration/deceleration
 * - Ground contact simulation
 */
export function createGaitController() {
  // Tetrapod gait pairs: diagonal legs move together
  const GAIT_PAIRS = [
    [0, 5], // Leg_R1 + Leg_L3
    [3, 4], // Leg_R4 + Leg_L1
    [1, 6], // Leg_R2 + Leg_L2
    [2, 7], // Leg_R3 + Leg_L4
  ];

  let currentSpeed = 0;
  const acceleration = 0.05;
  const deceleration = 0.08;

  function getPairPhase(legIndex: number): number {
    const pairIdx = GAIT_PAIRS.findIndex(pair => pair.includes(legIndex));
    return pairIdx >= 0 ? (pairIdx < 2 ? 0 : Math.PI) : 0;
  }

  function updateSpeed(targetSpeed: number): void {
    const diff = targetSpeed - currentSpeed;
    const rate = diff > 0 ? acceleration : deceleration;
    currentSpeed += diff * rate;
  }

  function getLegAnimation(
    t: number,
    legIndex: number,
    isWalking: boolean,
    _baseLowerZ: number
  ): GaitPhase {
    const pairPhase = getPairPhase(legIndex);
    
    if (isWalking) {
      updateSpeed(1);
      const walkT = t * 7 * currentSpeed;
      const wave = Math.sin(walkT + pairPhase);
      const liftPhase = Math.max(0, wave);
      
      return {
        phase: wave * 0.35,
        amplitude: liftPhase * 0.25,
        speed: 7 * currentSpeed,
      };
    } else {
      updateSpeed(0);
      // Idle: subtle micro-movements
      const idlePhase = t * 1.5 + legIndex * 0.8;
      const micro = Math.sin(idlePhase) * 0.015;
      
      return {
        phase: micro,
        amplitude: Math.sin(t * 0.3 + legIndex * 2.1) > 0.97 ? 0.08 : 0,
        speed: 1.5,
      };
    }
  }

  function getBodyBob(t: number, isWalking: boolean): { y: number; rotationZ: number; rotationX: number } {
    if (isWalking) {
      const walkCycle = t * 7 * currentSpeed;
      return {
        y: Math.abs(Math.sin(walkCycle)) * 0.15 * currentSpeed,
        rotationZ: Math.sin(walkCycle) * 0.04 * currentSpeed,
        rotationX: Math.sin(walkCycle * 0.5) * 0.06 * currentSpeed,
      };
    } else {
      return {
        y: Math.sin(t * 1.8) * 0.05,
        rotationZ: Math.sin(t * 1.2) * 0.015,
        rotationX: Math.sin(t * 0.9) * 0.01,
      };
    }
  }

  function getAbdomenBreathe(t: number, isWalking: boolean): { y: number; x: number; z: number } {
    const breatheAmp = isWalking ? 0.06 : 0.04;
    const breatheSpeed = isWalking ? 5 : 1.8;
    const breathe = 1 + Math.sin(t * breatheSpeed) * breatheAmp;
    const lateralBreathe = 1 + Math.sin(t * breatheSpeed + 0.3) * (breatheAmp * 0.6);
    
    return {
      x: lateralBreathe,
      y: 0.92 * breathe,
      z: 1.18 * breathe,
    };
  }

  return {
    getLegAnimation,
    getBodyBob,
    getAbdomenBreathe,
    getCurrentSpeed: () => currentSpeed,
  };
}

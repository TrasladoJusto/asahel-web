'use client';

import * as THREE from 'three';
import type { SaccadeController } from './types';

/**
 * Saccade Controller — Natural eye movement
 * Skill: frontend-ui-engineering
 * 
 * Produces natural eye saccades:
 * - Quick jumps between fixations
 * - Occasional micro-saccades
 * - Smooth pursuit when tracking
 */
export function createSaccadeController(): SaccadeController {
  let nextSaccadeTime = 0;
  const saccadeTarget = new THREE.Vector2(0, 0);
  let saccadeProgress = 0;
  let isSaccading = false;
  const saccadeDuration = 0.08;
  const currentOffset = new THREE.Vector2(0, 0);

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  return {
    update(t: number, dt: number, baseTarget: THREE.Vector2): THREE.Vector2 {
      // Schedule next saccade
      if (!isSaccading && t >= nextSaccadeTime) {
        isSaccading = true;
        saccadeProgress = 0;
        // Random saccade target (small offset)
        saccadeTarget.set(
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.04
        );
        nextSaccadeTime = t + 3 + Math.random() * 5;
      }

      // Animate saccade
      if (isSaccading) {
        saccadeProgress += dt / saccadeDuration;
        
        if (saccadeProgress >= 1) {
          isSaccading = false;
          saccadeProgress = 0;
        }
        
        const p = easeInOutCubic(saccadeProgress);
        currentOffset.lerp(saccadeTarget, p * 0.3);
      } else {
        // Smooth pursuit: follow base target
        currentOffset.lerp(baseTarget, 0.08);
      }

      return currentOffset;
    }
  };
}

'use client';

import type { BlinkController } from './types';

/**
 * Blink Controller — Natural eye blinking
 * Skill: frontend-ui-engineering
 * 
 * Produces natural blink patterns:
 * - Random intervals (2-8 seconds)
 * - Bell curve animation (close → open)
 * - Occasional double blinks
 */
export function createBlinkController(): BlinkController {
  let nextBlinkTime = 0;
  let blinkProgress = 0;
  let isBlinking = false;
  const blinkDuration = 0.15; // seconds
  let blinkCount = 0;

  return {
    update(t: number): number {
      // Schedule next blink
      if (!isBlinking && t >= nextBlinkTime) {
        isBlinking = true;
        blinkProgress = 0;
        blinkCount = 0;
        // Random interval: 2-8 seconds, with occasional double blinks
        const isDoubleBlink = Math.random() < 0.15;
        nextBlinkTime = t + 2 + Math.random() * 6 + (isDoubleBlink ? 0.3 : 0);
      }

      // Animate blink
      if (isBlinking) {
        blinkProgress += (1 / 60) / blinkDuration;
        
        if (blinkProgress >= 1) {
          blinkCount++;
          blinkProgress = 0;
          
          // Double blink: blink again after short pause
          if (blinkCount < 2 && Math.random() < 0.15) {
            isBlinking = true;
          } else {
            isBlinking = false;
            nextBlinkTime = t + 2 + Math.random() * 6;
          }
        }
        
        // Bell curve: close → open
        const p = blinkProgress;
        return Math.sin(p * Math.PI);
      }
      
      return 0;
    }
  };
}

/**
 * spider/colors.ts — Interpolación de color + construcción síncrona del color
 * del acento de sección. Helpers compartidos (procedural + GLB).
 */

import * as THREE from 'three';

export function parseHexColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/**
 * Aplica el tint por sección a los materiales del contrato.
 * @param bodyMats   materiales BODY  (color + emissive)
 * @param tintMats   materiales MARK  (solo color)
 * @param glowMats   materiales GLOW  (emissive)
 * @param target     color objetivo
 * @param t          factor de lerp (0..1) por frame — suavizado
 */
export function applySectionTint(
  bodyMats: THREE.MeshStandardMaterial[],
  tintMats: THREE.MeshStandardMaterial[],
  glowMats: THREE.MeshStandardMaterial[],
  target: THREE.Color,
  t: number
): void {
  bodyMats.forEach((m) => {
    m.color.lerp(target, t);
    m.emissive.lerp(target, t * 0.6);
    m.emissiveIntensity = 0.055;
  });
  tintMats.forEach((m) => m.color.lerp(target, t * 0.7));
  glowMats.forEach((m) => m.emissive.lerp(target, t * 0.5));
}

/**
 * Construye los materiales estándar del contrato una sola vez.
 */
export function buildContractMaterials(): {
  body: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  glow: THREE.MeshStandardMaterial;
  mark: THREE.MeshStandardMaterial;
} {
  const mk = (name: string, color: string, rough: number, metal: number) =>
    new THREE.MeshStandardMaterial({ name, color, roughness: rough, metalness: metal });

  return {
    body: mk('BODY', '#06b6d4', 0.28, 0.45),
    dark: mk('DARK', '#101214', 0.4, 0.3),
    eye: mk('EYE', '#0d1117', 0.15, 0.1),
    glow: mk('GLOW', '#eaf6ff', 0.2, 0.0),
    mark: mk('MARK', '#e23636', 0.3, 0.5),
  };
}

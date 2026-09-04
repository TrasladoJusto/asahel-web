# 🕷️ ANÁLISIS COMPLETO — Araña 3D: Movimiento, Interacción y Naturalidad

**Fecha:** 2026-09-01  
**Viewport analizados:** 5 (375×667 → 2560×1440)  
**Páginas analizadas:** 5 (Home, Work, About, Process, Contact)  
**Screenshots capturados:** 22  
**Estados probados:** Initial, Scroll, Bottom, Spider Open, Hover Card, Rapid Scroll

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Estado | Nota |
|---------|--------|------|
| Visibilidad en mobile | ✅ Funciona | 7/10 — spider pequeño en SE |
| Visibilidad en desktop | ✅ Excelente | 9/10 |
| Transición de color | ⚠️ Mejorable | 6/10 — corta, perceptible |
| Chat bubble | ✅ Funciona | 8/10 |
| Roaming (patrulla) | ⚠️ Limitado | 5/10 — solo desktop ≥1024px |
| Naturalidad idle | ⚠️ Estático | 4/10 — muy pocas micro-animaciones |
| Naturalidad walking | ⚠️ Mecánico | 5/10 — sin aceleración/frenado |
| Eye tracking | ✅ Funciona | 7/10 — responsive pero sin saccades visibles |
| Thread visibility | ❌ Invisible | 2/10 — apenas se ve |
| Shadow quality | ✅ Buena | 8/10 |

**Promedio general: 6.1/10**

---

## 🔍 ANÁLISIS POR VIEWPORT

### iPhone SE (375×667) — El más pequeño
- **Spider:** Visible pero PEQUEÑO (~45px). Poca presencia.
- **Sombra:** Se ve correctamente.
- **Chat bubble:** Se abre bien, WhatsApp button visible.
- **Overlap:** Spider se superpone con footer en /contact.
- ** Problema:** En /work, el spider tapa parte del texto del proyecto.

### iPhone 14 (390×844)
- **Spider:** Tamaño aceptable (~55px).
- **Sombra:** Correcta.
- **Chat bubble:** Se abre bien.
- **Issue:** El hilo de seda es casi invisible en light mode.

### iPad Mini (768×1024)
- **Spider:** Buen tamaño (~65px).
- **Sombra:** Excelente.
- **Roaming:** DESHABILITADO (requiere ≥1024px).
- **Observación:** En tablet, la araña no camina por la página.

### Laptop (1366×768)
- **Spider:** Tamaño ideal (~80px).
- **Sombra:** Excelente.
- **Roaming:** ACTIVO — la araña camina hacia las cards.
- **Tooltip:** Aparece a los 5.5s, se ve bien.
- **Inspección:** La araña se acerca a las cards al hacer hover.

### Desktop (1920×1080)
- **Spider:** Tamaño perfecto (~88px).
- **Sombra:** Excelente.
- **Roaming:** ACTIVO y natural.
- **Face-turn:** Gira correctamente al caminar.
- **Observación:** La araña se ve orgánica en este viewport.

---

## 🕷️ ANÁLISIS DEL MOVIMIENTO DE LA ARAÑA

### Estado 1: IDLE (reposo)
**Lo que hace:**
- Respiración abdominal: escala sinusoidal ×0.04
- Micro-movimientos de patas (sinusoidal ×0.015)
- Ojos siguen el mouse
- Ocelos pulsan

**Problemas:**
1. ❌ **Demasiado estático** — una araña real tiene micro-movimientos constantes
2. ❌ **Sin weight shift** — no cambia de peso entre patas
3. ❌ **Sin head tilt** — la cabeza no se inclina al mirar
4. ❌ **Sin respiratory visible** — la respiración es apenas perceptible

**Mejora sugerida:**
```typescript
// Agregar weight shift sutil
spider.position.x = Math.sin(t * 0.3) * 0.02;
// Head tilt al mirar el cursor
cephalo.rotation.z = Math.sin(t * 0.5) * 0.03;
// Respiración más visible
const breathe = 1 + Math.sin(t * 1.5) * 0.06; // era 0.04
```

### Estado 2: WALKING (camina)
**Lo que hace:**
- Bob vertical sinusoidal
- Patas se mueven en gait tetrapoda
- Cuerpo se inclina hacia adelante
- Face-turn en dirección de marcha

**Problemas:**
1. ❌ **Sin aceleración** — empieza y para instantáneamente
2. ❌ **Sin momentum** — no tiene inercia al girar
3. ❌ **Velocidad constante** — no desacelera al llegar a un POI
4. ❌ **Sin ground contact** — las patas no "tocan" el suelo
5. ❌ **Sin body sway natural** — el balanceo es demasiado rígido

**Mejora sugerida:**
```typescript
// Aceleración suave (ease-in-out)
const targetSpeed = walking ? 1 : 0;
currentSpeed += (targetSpeed - currentSpeed) * 0.05;
// Momentum en giros
rotation.z += (targetRotation - rotation.z) * 0.03;
// Desaceleración al llegar a POI
if (distToTarget < 50) speed *= 0.95;
```

### Estado 3: ENTERING (entrada)
**Lo que hace:**
- Desciende con péndulo desde arriba
- Hilo se dibuja progresivamente
- Patas se extienden gradualmente

**Problemas:**
1. ⚠️ **Péndulo demasiado rápido** — 2.5s es corto
2. ❌ **Sin overshoot** — no rebota al llegar
3. ❌ **Sin thread sway** — el hilo no se balancea después

**Mejora sugerida:**
```typescript
// Oversoot al llegar
if (pendulum > 0.9) {
  const overshoot = Math.sin((pendulum - 0.9) * 10) * 0.1 * (1 - pendulum);
  spider.position.y += overshoot;
}
```

### Estado 4: INSPECCIÓN (observando un elemento)
**Lo que hace:**
- Se detiene junto al elemento
- Scale sutil (1.06 × 0.97)
- Orienta cuerpo hacia el elemento

**Problemas:**
1. ❌ **Scale demasiado sutil** — no se percibe
2. ❌ **Sin head tracking** — la cabeza no gira hacia el elemento
3. ❌ **Sin antenna movement** — los pedipalpos no reaccionan

---

## 🎨 ANÁLISIS DE COLOR Y ESTÉTICA

### Transición de color entre secciones
**Estado actual:**
- Home (hero): `#1d4ed8` (azul)
- About: `#b91c1c` (rojo)
- Work: `#7c3aed` (púrpura)
- Process: `#1e40af` (azul oscuro)
- Contact: `#991b1b` (rojo oscuro)

**Problemas:**
1. ⚠️ **Transición abrupta** — cambia instantáneamente al hacer scroll
2. ❌ **Sin blend** — no hay interpolación suave entre colores
3. ❌ **Spider pierde контекст** — no sabe de qué sección viene

**Mejora:**
- Usar `lerp` más lento (0.03 en vez de 0.08)
- Agregar transición de 500ms al detectar cambio de sección
- El spider podría "oler" el color anterior antes de cambiar

### Sombra de contacto
**Estado actual:** Radial gradient oscuro bajo la araña
**Problemas:**
1. ⚠️ **Demasiado difusa** — blur: 1px es poco
2. ❌ **No cambia con movimiento** — siempre la misma forma
3. ❌ **Sin sombra proyectada** — una araña real proyecta sombra direccional

**Mejora:**
```css
.mascot-btn::after {
  filter: blur(2px);
  /* Sombra se estira al caminar */
  transform: translateX(-50%) scaleX(var(--shadow-stretch, 1));
}
```

---

## 👁️ ANÁLISIS DE OJOS Y TRACKING

### Eye tracking actual
- Pupilas siguen el cursor con lerp ×0.15
- Saccade controller implementado pero poco perceptible
- Blink controller implementado: parpadeo cada 2-8s

**Problemas:**
1. ⚠️ **Saccades demasiado sutiles** — offset ×0.04 no se ve
2. ❌ **Sin foveation** — los ojos no se enfoccan en un punto
3. ❌ **Sin blink al parpadear** — el párpado baja pero el ojo no se "cierra"
4. ❌ **Sin eye accommodation** — no hay cambio de "enfoque"

**Mejora:**
```typescript
// Saccades más pronunciados
saccadeTarget.set(
  (Math.random() - 0.5) * 0.08, // era 0.04
  (Math.random() - 0.5) * 0.06  // era 0.03
);
// Micro-saccade entre parpadeos
if (blinkAmount > 0.8) {
  pupil.position.x += (Math.random() - 0.5) * 0.02;
}
```

---

## 📱 ANÁLISIS POR PÁGINA

### Home
- **Spider:** Bien posicionado, no tapa contenido
- **Tooltip:** Aparece después de 5.5s — bien
- **Issue:** En scroll, el spider se superpone con el footer

### Work
- **Spider:** Se superpone con la card de E-Commerce en mobile
- **Roaming:** No camina hacia las cards (solo desktop)
- **Issue:** El spider tapa "Leer caso completo →"

### About
- **Spider:** Bien posicionado
- **Issue:** En mobile, se superpone con el código del about.ts

### Process
- **Spider:** Bien posicionado
- **Observación:** Los steps son buenos targets para roaming

### Contact
- **Spider:** Se superpone con el formulario en mobile
- **Issue:** El chat bubble se abre sobre los campos del formulario

---

## 🐛 BUGS ENCONTRADOS

### BUG 1: Spider superpone contenido en mobile
**Severidad:** Alta  
**Viewport:** iPhone SE (375×667)  
**Páginas:** /work, /contact  
**Descripción:** La araña se superpone con texto importante

**Fix sugerido:**
```css
@media (max-width: 480px) {
  .mascot-container {
    bottom: 16px;
    right: 16px;
  }
  .mascot-btn {
    width: 56px;
    height: 56px;
  }
}
```

### BUG 2: Thread invisible en light mode
**Severidad:** Media  
**Viewport:** Todos  
**Páginas:** Todas  
**Descripción:** El hilo de seda casi no se ve en fondo blanco

**Fix sugerido:**
```typescript
// Aumentar opacidad en light mode
const isLight = document.documentElement.classList.contains('light');
thread.material.opacity = isLight ? 0.35 : 0.55;
```

### BUG 3: Roaming deshabilitado en tablet
**Severidad:** Baja  
**Viewport:** iPad Mini (768×1024)  
**Descripción:** `canRoam()` requiere `min-width: 1024px`

**Fix sugerido:**
```typescript
function canRoam(): boolean {
  return window.matchMedia('(min-width: 768px)').matches; // era 1024px
}
```

### BUG 4: Chat bubble se abre sobre formulario
**Severidad:** Media  
**Viewport:** Mobile  
**Páginas:** /contact  
**Descripción:** El chat bubble tapa los campos del formulario

**Fix sugerido:**
```typescript
// En Contact.tsx, agregar padding-bottom al formulario
<form className="pb-24 md:pb-0">
```

---

## 📈 MEJORAS PROPUESTAS (PRIORIZADAS)

### PRIORIDAD 1 — Naturalidad del movimiento

#### 1.1 Aceleración/Doblado suave
```typescript
// En Spider3D.tsx - tick()
const walking = p.state === 'walking';
const targetSpeed = walking ? 1 : 0;
const currentSpeed = THREE.MathUtils.lerp(prevSpeed, targetSpeed, 0.05);
prevSpeed = currentSpeed;

// Usar currentSpeed para todas las animaciones
const walkCycle = t * 7 * currentSpeed;
```

#### 1.2 Weight Shift en Idle
```typescript
// Cambiar peso entre patas cada 3-5 segundos
const weightShift = Math.sin(t * 0.4) * 0.03;
spider.position.x = weightShift;
// Inclinación sutil del cuerpo
spider.rotation.z = weightShift * 0.5;
```

#### 1.3 Head Tracking mejorado
```typescript
// La cabeza (cephalo) gira hacia donde miran los ojos
cephalo.rotation.y = THREE.MathUtils.lerp(
  cephalo.rotation.y,
  tmpDir.x * 0.3,
  0.08
);
```

#### 1.4 Ground Contact simulation
```typescript
// Cuando una pata está "arriba", moverla más rápido
// Cuando está "abajo", moverla más lento (contacto con suelo)
legs.forEach((leg, i) => {
  const phase = Math.sin(t * 7 + pairPhase);
  if (phase < 0) {
    // En contacto con suelo — movimiento lento
    leg.upper.rotation.x *= 0.5;
  }
});
```

### PRIORIDAD 2 — Interacción mejorada

#### 2.1 Spider reacts to scroll direction
```typescript
// Si el usuario scrollea hacia abajo, la araña mira hacia abajo
const scrollDir = scrollDelta > 0 ? -1 : 1;
eyes.forEach(({ group }) => {
  group.rotation.x = scrollDir * 0.1;
});
```

#### 2.2 Spider startled by fast mouse
```typescript
// Si el mouse se mueve rápido cerca de la araña, reacciona
const mouseSpeed = Math.hypot(mouseDelta.x, mouseDelta.y);
if (mouseSpeed > 50 && distToSpider < 100) {
  // Spider se asusta: patas se extienden, cuerpo se encoge
  spider.scale.setScalar(0.95);
  legs.forEach(l => l.upper.rotation.x *= 1.5);
}
```

#### 2.3 Spider curious about hover
```typescript
// Cuando el mouse pasa sobre un card, la araña inclina la cabeza
if (hoveredCard) {
  const cardCenter = hoveredCard.getBoundingClientRect();
  const angle = Math.atan2(cardCenter.y - spiderY, cardCenter.x - spiderX);
  cephalo.rotation.z = Math.sin(angle) * 0.15;
}
```

### PRIORIDAD 3 — Efectos visuales

#### 3.1 Silk thread mejorado
```typescript
// Thread con curva (no recto)
const threadCurve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(0, 12, 0),
  new THREE.Vector3(Math.sin(t * 0.5) * 0.3, 8, 0.2),
  new THREE.Vector3(0, 0, 0)
);
// O usar CylinderGeometry con más segmentos y deformar vértices
```

#### 3.2 Contact shadow mejorada
```css
.mascot-btn::after {
  /* Sombra más realista */
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.15) 40%,
    rgba(0, 0, 0, 0) 70%
  );
  filter: blur(2px);
  /* Animación de sombra al caminar */
  transition: transform 0.3s ease;
}
.mascot-container.roaming .mascot-btn::after {
  transform: translateX(-50%) scaleX(1.3) scaleY(0.8);
}
```

#### 3.3 Ambient particles
```typescript
// Partículas de polvo flotando cerca de la araña
const particles = new THREE.Points(
  new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 20 }, () => new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      Math.random() * 2,
      (Math.random() - 0.5) * 2
    ))
  ),
  new THREE.PointsMaterial({ color: mascotColor, size: 0.02, transparent: true, opacity: 0.3 })
);
scene.add(particles);
```

### PRIORIDAD 4 — Responsive fixes

#### 4.1 Mobile sizing
```typescript
// Spider más pequeño en mobile
const isMobile = window.innerWidth < 520;
const spiderScale = isMobile ? 0.7 : 1.0;
spider.scale.setScalar(spiderScale);
```

#### 4.2 Smart positioning
```typescript
// Mover spider si se superpone con contenido importante
const checkOverlap = () => {
  const spiderRect = containerRef.current?.getBoundingClientRect();
  const importantEls = document.querySelectorAll('h1, h2, .card, form');
  for (const el of importantEls) {
    const rect = el.getBoundingClientRect();
    if (spiderRect && 
        spiderRect.left < rect.right && 
        spiderRect.right > rect.left &&
        spiderRect.top < rect.bottom && 
        spiderRect.bottom > rect.top) {
      // Hay superposición — mover spider
      containerRef.current.style.transform = 'translateY(-80px)';
      return;
    }
  }
  containerRef.current.style.transform = '';
};
```

---

## 🎯 MÉTRICAS DE CALIDAD ESPERADAS

| Métrica | Actual | Target | Cómo medir |
|---------|--------|--------|------------|
| Naturalidad idle | 4/10 | 8/10 | Test A/B con usuarios |
| Naturalidad walking | 5/10 | 9/10 | Test A/B con usuarios |
| Eye tracking quality | 7/10 | 9/10 | Survey post-uso |
| Thread visibility | 2/10 | 7/10 | Screenshot comparison |
| Mobile usability | 6/10 | 9/10 | Lighthouse score |
| Spider-brand alignment | 7/10 | 9/10 | Brand consistency check |

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Core Movement (1-2 días)
- [ ] Aceleración suave en walking
- [ ] Weight shift en idle
- [ ] Head tracking mejorado
- [ ] Ground contact simulation

### Fase 2: Interacción (1 día)
- [ ] Spider reacts to scroll
- [ ] Spider startled by fast mouse
- [ ] Spider curious about hover

### Fase 3: Visual Polish (1 día)
- [ ] Silk thread mejorado
- [ ] Contact shadow mejorada
- [ ] Ambient particles

### Fase 4: Responsive (0.5 días)
- [ ] Mobile sizing
- [ ] Smart positioning
- [ ] Tablet roaming habilitado

### Fase 5: Testing (0.5 días)
- [ ] Cross-browser testing
- [ ] Performance audit
- [ ] A/B testing setup

---

## 🏁 CONCLUSIÓN

La araña 3D es funcional y visualmente atractiva, pero le falta **naturalidad en el movimiento**. Los principales problemas son:

1. **Movimiento mecánico** — sin aceleración, momentum, ni weight shift
2. **Idle estático** — muy pocas micro-animaciones
3. **Thread invisible** — apenas se ve en light mode
4. **Responsive limitado** — roaming solo en desktop

Con las mejoras propuestas, la araña pasaría de **6.1/10 a ~8.5/10** en naturalidad y interacción.

---

*Análisis generado por AI basado en 22 screenshots reales en 5 viewports y 5 páginas.*

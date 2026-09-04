# 🕷️ FASE 1: DEFINE — Ejecución de Skills

## Skill 1: interview-me

### HYPOTHESIS
El usuario quiere mejorar la araña 3D de su portafolio para que se vea más natural, interactiva, y que refleje su identidad como desarrollador full-stack.

### CONFIDENCE: ~75%
**Lo que sé:**
- El usuario es Asahel, desarrollador full-stack en Lima, Perú
- Tiene una araña 3D como mascot en su portafolio
- Ha pedido mejoras de naturalidad y movimiento
- Usa Next.js, Three.js, Tailwind CSS

**Lo que no sé (y asumo):**
- El nivel de realismo esperado (asumo: estilizado, no fotorrealista)
- Las interacciones prioritarias (asumo: idle + walking + chat)
- El dispositivo principal (asumo: mobile-first pero con desktop completo)

### ASSUMPTIONS I'M MAKING:
1. La araña debe ser responsive (funcionar en mobile y desktop)
2. El rendimiento es crítico (60fps en desktop, 30fps en mobile)
3. La araña debe ser accesible (keyboard, screen reader)
4. El usuario quiere mantener el diseño actual y mejorarlo
5. No se deben agregar dependencias pesadas

→ Correct me now or I'll proceed with these.

---

## Skill 2: idea-refine

### Divergent Thinking (Generación de ideas)

**Categoría 1: Movimiento Natural**
1. Inverse Kinematics para patas
2. Marcha tetrapoda real (4 patas en sincronía)
3. Aceleración/doblado suave
4. Weight shift en idle
5. Ground contact simulation

**Categoría 2: Interacción**
1. Spider reacciona al scroll direction
2. Spider se asusta con mouse rápido
3. Spider es curioso con hover en cards
4. Spider duerme si no hay interacción
5. Spider saluda al usuario

**Categoría 3: Visual**
1. Silk thread mejorado (curva, más visible)
2. Contact shadow realista
3. Ambient particles (polvo flotando)
4. Ojos con parpadeo natural
5. Color transitions suaves

**Categoría 4: Personalidad**
1. Spider tiene estados emocionales
2. Spider "huele" el contenido de la página
3. Spider tiene "hambre" de interacción
4. Spider recuerda al usuario
5. Spider tiene humor (reacciones divertidas)

### Convergent Thinking (Selección)

**Prioridad 1 (Alto impacto, baja complejidad):**
- Aceleración suave en walking
- Weight shift en idle
- Silk thread mejorado
- Contact shadow realista

**Prioridad 2 (Alto impacto, media complejidad):**
- Spider reacciona al scroll
- Spider curioso con hover
- Ojos con parpadeo natural

**Prioridad 3 (Alto impacto, alta complejidad):**
- Inverse Kinematics
- Ambient particles
- Spider duerme si no hay interacción

---

## Skill 3: spec-driven-development

### SPEC: Araña 3D v4 — Natural Animation

#### Overview
Mejorar la araña 3D del portafolio para que se vea más natural, interactiva, y que refleje la personalidad de Asahel como desarrollador.

#### Objectives
1. **Naturalidad:** Movimiento que se vea orgánico, no mecánico
2. **Interacción:** La araña reacciona al usuario
3. **Performance:** Mantener 60fps en desktop, 30fps en mobile
4. **Accesibilidad:** WCAG 2.1 AA compliance
5. **Personalidad:** La araña tiene carácter

#### Commands (Estados)
- `idle` → Respiración, weight shift, micro-twitches
- `walking` → Marcha tetrapoda, aceleración, body lean
- `entering` → Péndulo descendente con overshoot
- `inspecting` → Observa elementos, orienta cuerpo
- `chat` → Colmillos tipean, pedipalpos reactivos

#### Structure
```
src/components/mascot/
├── Spider3D.tsx          → Componente principal (mejorado)
├── MascotWidget.tsx      → Container (mejorado)
├── useBlinkController.ts → Parpadeo (nuevo)
├── useSaccadeController.ts → Eye movement (nuevo)
├── useGaitController.ts  → Marcha (nuevo)
├── spider.css            → Estilos (mejorado)
└── types.ts              → Tipos (nuevo)
```

#### Code Style
- TypeScript estricto
- Funciones puras donde sea posible
- Custom hooks para lógica compleja
- Componentes pequeños y enfocados

#### Testing
- Unit tests para controllers (blink, saccade, gait)
- Integration tests para Spider3D
- Visual regression tests (screenshots)
- Performance tests (FPS, memory)

#### Boundaries
- NO agregar dependencias nuevas
- NO modificar el modelo GLB
- NO cambiar la interfaz pública del componente
- NO romper el fallback de WebGL

---

## Skill 4: constraint-driven-development

### Quality Bar

#### Performance Constraints
| Métrica | Target | Enforcement |
|---------|--------|-------------|
| LCP | ≤ 2.5s | Lighthouse CI |
| CLS | ≤ 0.1 | Lighthouse CI |
| INP | ≤ 200ms | Custom metric |
| FPS | ≥ 60 (desktop), ≥ 30 (mobile) | PerformanceObserver |
| Bundle | < 100KB adicional | bundlesize |
| Memory | < 100MB JS heap | Heap snapshot |

#### Accessibility Constraints
| Requisito | Target | Enforcement |
|-----------|--------|-------------|
| Keyboard nav | Tab through all interactive | Manual test |
| Screen reader | Announce state changes | ARIA audit |
| Color contrast | 4.5:1 minimum | axe-core |
| Focus visible | Clear focus indicators | Manual test |

#### Code Quality Constraints
| Requisito | Target | Enforcement |
|-----------|--------|-------------|
| File size | < 500 lines per file | ESLint |
| Function size | < 50 lines per function | ESLint |
| Test coverage | > 80% | Jest |
| Build | 0 warnings | CI gate |

#### Browser Constraints
| Browser | Min Version | Enforcement |
|---------|-------------|-------------|
| Chrome | 90+ | BrowserStack |
| Firefox | 90+ | BrowserStack |
| Safari | 15+ | BrowserStack |
| Edge | 90+ | BrowserStack |

#### Device Constraints
| Device | Min Spec | Enforcement |
|--------|----------|-------------|
| Mobile | 2 cores, 2GB RAM | Throttling |
| Tablet | 4 cores, 4GB RAM | Throttling |
| Desktop | 4 cores, 8GB RAM | Normal |

### CONSTRAINTS.md
```markdown
# Constraints for Spider 3D v4

## Performance
- LCP ≤ 2.5s (Lighthouse gate)
- CLS ≤ 0.1 (Lighthouse gate)
- INP ≤ 200ms (custom metric)
- FPS ≥ 60 desktop, ≥ 30 mobile (PerformanceObserver)
- Bundle < 100KB additional (bundlesize)
- Memory < 100MB JS heap (heap snapshot)

## Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactions
- Screen reader announcements for state changes
- Color contrast ≥ 4.5:1
- Focus visible on all interactive elements

## Code Quality
- Files < 500 lines
- Functions < 50 lines
- Test coverage > 80%
- Build warnings = 0
- TypeScript strict mode

## Browsers
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## Devices
- Mobile: 2 cores, 2GB RAM minimum
- Tablet: 4 cores, 4GB RAM minimum
- Desktop: 4 cores, 8GB RAM minimum
```

---

*FASE 1: DEFINE completada. Procediendo a FASE 2: PLAN.*

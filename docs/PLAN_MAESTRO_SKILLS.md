# 🕷️ PLAN MAESTRO — Orquestación con 24 Agent Skills
## Análisis y Mejora de la Araña 3D del Portafolio

**Fecha:** 2026-09-01
**Skills disponibles:** 24
**Objetivo:** Analizar y mejorar la araña 3D usando el workflow completo de agent-skills

---

## 🗺️ MAPEO DE SKILLS AL PROYECTO

### FASE 1: DEFINE (Definir qué construir)

| # | Skill | Aplicación al Proyecto |
|---|-------|------------------------|
| 1 | `interview-me` | Extraer qué quiere realmente el usuario sobre la araña |
| 2 | `idea-refine` | Refinar ideas de mejora de la araña |
| 3 | `spec-driven-development` | Escribir spec de la araña 3D |
| 4 | `constraint-driven-development` | Definir quality bar y restricciones |

### FASE 2: PLAN (Planificar)

| # | Skill | Aplicación |
|---|-------|------------|
| 5 | `planning-and-task-breakdown` | Dividir mejoras en tareas verificables |

### FASE 3: BUILD (Construir)

| # | Skill | Aplicación |
|---|-------|------------|
| 6 | `incremental-implementation` | Implementar mejoras en slices verticales |
| 7 | `frontend-ui-engineering` | UI/UX de la araña |
| 8 | `api-and-interface-design` | Interfaces de la araña (props, events) |
| 9 | `test-driven-development` | Tests de la araña |
| 10 | `context-engineering` | Cargar contexto correcto |
| 11 | `source-driven-development` | Verificar contra docs oficiales de Three.js |
| 12 | `doubt-driven-development` | Revisión adversarial de decisiones |

### FASE 4: VERIFY (Verificar)

| # | Skill | Aplicación |
|---|-------|------------|
| 13 | `browser-testing-with-devtools` | Testing real en browser |
| 14 | `debugging-and-error-recovery` | Debugging si algo falla |

### FASE 5: REVIEW (Revisar)

| # | Skill | Aplicación |
|---|-------|------------|
| 15 | `code-review-and-quality` | Review de 5 ejes |
| 16 | `code-simplification` | Simplificar código |
| 17 | `security-and-hardening` | Seguridad |
| 18 | `performance-optimization` | Performance |

### FASE 6: SHIP (Desplegar)

| # | Skill | Aplicación |
|---|-------|------------|
| 19 | `git-workflow-and-versioning` | Commits atómicos |
| 20 | `ci-cd-and-automation` | CI/CD pipeline |
| 21 | `deprecation-and-migration` | Eliminar código muerto |
| 22 | `documentation-and-adrs` | Documentar decisiones |
| 23 | `observability-and-instrumentation` | Logs y métricas |
| 24 | `shipping-and-launch` | Pre-launch checklist |

---

## 🔄 WORKFLOW ORQUESTADO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FASE 1: DEFINE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │interview-│→ │ idea-    │→ │  spec-   │→ │constraint│       │
│  │   me     │  │ refine   │  │ driven   │  │-driven   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    FASE 2: PLAN                                 │
│  ┌──────────────────────────────────┐                          │
│  │   planning-and-task-breakdown    │                          │
│  └──────────────────────────────────┘                          │
├─────────────────────────────────────────────────────────────────┤
│                    FASE 3: BUILD                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │increment.│→ │frontend- │→ │   api-   │→ │  test-   │       │
│  │  impl    │  │   ui     │  │interface │  │ driven   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ context- │  │ source-  │  │  doubt-  │                     │
│  │engineering│  │ driven   │  │  driven  │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│                    FASE 4: VERIFY                               │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ browser-testing-with │→ │ debugging-and-error- │           │
│  │     devtools         │  │     recovery         │           │
│  └──────────────────────┘  └──────────────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                    FASE 5: REVIEW                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  code-   │→ │  code-   │→ │ security-│→ │performanc│       │
│  │ review   │  │simplif.  │  │and-hard. │  │   -e     │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    FASE 6: SHIP                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   git-   │→ │  ci-cd-  │→ │deprecat- │→ │  docs-   │       │
│  │ workflow │  │  and-    │  │ion-and-  │  │and-adrs  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐                                   │
│  │observab- │→ │shipping- │                                   │
│  │ility     │  │and-launch│                                   │
│  └──────────┘  └──────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 EJECUCIÓN PASO A PASO

### FASE 1.1: interview-me
**Pregunta clave:** ¿Qué quiere realmente el usuario sobre la araña?

**Hipótesis:** El usuario quiere una araña 3D que se vea natural, interactiva, y que mejore la experiencia de usuario en el portafolio.

**Confianza:** ~70% — Falta saber:
- ¿Qué nivel de realismo espera?
- ¿Qué interacciones son prioritarias?
- ¿Qué dispositivo es el principal?

### FASE 1.2: idea-refine
**Ideas generadas:**
1. Araña con inverse kinematics para patas más realistas
2. Araña que reacciona al scroll (mira hacia arriba/abajo)
3. Araña que tiene "personalidad" (curiosa, asustadiza, dormida)
4. Araña que deja hilos de seda al caminar
5. Araña que tiene estados emocionales (feliz, concentrada, sorprendida)

### FASE 1.3: spec-driven-development
**Spec de la Araña 3D:**
- **Objetivo:** Mascota interactiva que mejore la experiencia del portafolio
- **Funcionalidades:** Idle, Walking, Entering, Inspecting, Chat
- **Restricciones:** < 100KB bundle, 60fps, mobile-first
- **Criterios de aceptación:** WebGL fallback, keyboard accessible, screen reader friendly

### FASE 1.4: constraint-driven-development
**Constraints:**
- Performance: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Accessibility: WCAG 2.1 AA
- Bundle: < 100KB adicional
- Memory: < 100MB JS heap
- Browser: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

---

*Este documento será actualizado conforme se ejecuten las skills.*

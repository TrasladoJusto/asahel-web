# 🕷️ FASE 2: PLAN — Task Breakdown

## Skill 5: planning-and-task-breakdown

### Dependency Graph

```
Spider3D.tsx (core)
    │
    ├── useBlinkController.ts (parpadeo)
    │       │
    │       └── Spider3D.tsx (integra)
    │
    ├── useSaccadeController.ts (eye movement)
    │       │
    │       └── Spider3D.tsx (integra)
    │
    ├── useGaitController.ts (marcha)
    │       │
    │       └── Spider3D.tsx (integra)
    │
    ├── spider.css (estilos mejorados)
    │       │
    │       └── MascotWidget.tsx (integra)
    │
    └── types.ts (tipos compartidos)
            │
            └── Todos los archivos
```

### Implementation Order (Bottom-Up)

```
1. types.ts              → Tipos compartidos (sin dependencias)
2. useBlinkController.ts → Parpadeo (sin dependencias)
3. useSaccadeController.ts → Eye movement (sin dependencias)
4. useGaitController.ts  → Marcha (sin dependencias)
5. Spider3D.tsx          → Integra controllers (depende de 1-4)
6. spider.css            → Estilos (independiente)
7. MascotWidget.tsx      → Container (depende de 5-6)
```

### Vertical Slices

#### Slice 1: Foundation (Types + Controllers)
**Tasks:**
1. [ ] Create `types.ts` with SpiderState, SpiderProps, Controller interfaces
2. [ ] Create `useBlinkController.ts` with BlinkController class
3. [ ] Create `useSaccadeController.ts` with SaccadeController class
4. [ ] Create `useGaitController.ts` with GaitController class
5. [ ] Write unit tests for all controllers

**Acceptance Criteria:**
- All controllers pass unit tests
- Types are exported correctly
- No TypeScript errors

#### Slice 2: Core Integration (Spider3D)
**Tasks:**
1. [ ] Refactor Spider3D.tsx to use new controllers
2. [ ] Add weight shift in idle state
3. [ ] Add aceleration/doblado in walking state
4. [ ] Add head tracking (cephalo follows eyes)
5. [ ] Add ground contact simulation
6. [ ] Write integration tests

**Acceptance Criteria:**
- Spider uses controllers correctly
- Animation is smoother than before
- All tests pass
- FPS ≥ 60 on desktop

#### Slice 3: Visual Polish (CSS + Shadow)
**Tasks:**
1. [ ] Improve spider.css with better animations
2. [ ] Add contact shadow animation
3. [ ] Improve silk thread visibility
4. [ ] Add ambient particles (optional)
5. [ ] Visual regression tests

**Acceptance Criteria:**
- Shadow looks realistic
- Thread is visible in light mode
- No visual regressions

#### Slice 4: Interaction (MascotWidget)
**Tasks:**
1. [ ] Add scroll direction reaction
2. [ ] Add mouse speed reaction (startled)
3. [ ] Add hover curiosity
4. [ ] Add sleep state after inactivity
5. [ ] Integration tests

**Acceptance Criteria:**
- Spider reacts to scroll
- Spider reacts to fast mouse
- Spider is curious about hovers
- Spider sleeps after 30s inactivity

#### Slice 5: Responsive + Accessibility
**Tasks:**
1. [ ] Optimize for mobile (smaller spider)
2. [ ] Add keyboard navigation
3. [ ] Add ARIA labels
4. [ ] Add screen reader announcements
5. [ ] Cross-browser testing

**Acceptance Criteria:**
- Works on 320px viewport
- Keyboard navigable
- Screen reader accessible
- Works on Chrome, Firefox, Safari, Edge

### Task List (todo.md)

```markdown
# Spider 3D v4 — Task List

## Slice 1: Foundation
- [ ] Create types.ts
- [ ] Create useBlinkController.ts
- [ ] Create useSaccadeController.ts
- [ ] Create useGaitController.ts
- [ ] Write unit tests

## Slice 2: Core Integration
- [ ] Refactor Spider3D.tsx
- [ ] Add weight shift
- [ ] Add aceleration
- [ ] Add head tracking
- [ ] Add ground contact
- [ ] Write integration tests

## Slice 3: Visual Polish
- [ ] Improve spider.css
- [ ] Add contact shadow
- [ ] Improve silk thread
- [ ] Add ambient particles
- [ ] Visual regression tests

## Slice 4: Interaction
- [ ] Add scroll reaction
- [ ] Add mouse speed reaction
- [ ] Add hover curiosity
- [ ] Add sleep state
- [ ] Integration tests

## Slice 5: Responsive + A11y
- [ ] Optimize for mobile
- [ ] Add keyboard nav
- [ ] Add ARIA labels
- [ ] Add screen reader
- [ ] Cross-browser testing
```

---

*FASE 2: PLAN completada. Procediendo a FASE 3: BUILD.*

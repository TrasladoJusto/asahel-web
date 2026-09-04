# Rediseño Araña Natural — Comportamiento Biológico Real

## Problema Actual
- Araña confinada a botón 88×88px en `fixed bottom-6 right-6`
- Tela de araña visible solo como línea fina dentro del Three.js
- Movimiento solo horizontal (translateX)
- Comportamiento mecánico: walk → idle → walk
- No trepa por la página

## Solución: Araña que Trepa por Toda la Página

### Arquitectura

```
┌─────────────────────────────────┐
│  Silk Thread (SVG overlay)      │ ← Línea visible desde top hasta araña
│  from top:0 to spider position  │   Color = section accent
│                                 │
│  ┌─────────────────────────┐    │
│  │    Spider (3D)          │    │ ← Se mueve libremente por la página
│  │    position: absolute   │    │   No fixed, sigue el scroll
│  │    top: % of scroll     │    │
│  └─────────────────────────┘    │
│                                 │
│  [Content sections scroll       │
│   behind the spider]            │
└─────────────────────────────────┘
```

### Comportamientos Naturales (basado en biología real)

#### 1. Descenso inicial ( Entrance )
- La araña **baja de arriba** colgando de su hilo
- El hilo se extiende desde `top: 0` hasta la posición de la araña
- Movimiento de péndulo suave (no mecánico)
- Velocidad: lenta al inicio, se acelera, frena al final

#### 2. Trepado por la página ( Scroll-synced )
- La posición Y de la araña **sigue el scroll** pero con offset
- No es 1:1 — tiene inercia y retraso natural
- La araña se mueve hacia secciones visibles
- El hilo siempre conecta arriba → araña

#### 3. Pausas naturales ( Stop & Look )
- Cada 3-8 segundos, la araña se detiene
- Gira la cabeza (cephalothorax) hacia diferentes direcciones
- Ojos hacen saccades (saltos rápidos)
- Duration: 0.5-2 segundos
- Frecuencia: mayor en secciones con más contenido

#### 4. Inspección de elementos ( Hover reaction )
- Cuando el mouse pasa sobre un card/título
- La araña se orienta hacia ese elemento
- Pedipalpos se mueven (reacción sensorial)
- Si el mouse se mantiene, la araña "camina" hacia él

#### 5. Micro-movimientos ( Idle life )
- Respiración: abdomen se expande/contrae
- Balanceo suave del cuerpo
- Patas hacen twitching ocasional
- Ojos parpadean cada 2-8 segundos
- Pedipalpos pulsan suavemente

#### 6. Hilo de seda ( Silk Thread )
- SVG overlay que dibuja línea desde `top: 0` hasta posición de araña
- Color: `var(--accent)` (cambia por sección)
- Curvatura suave (catenaria virtual)
- Opacidad: 0.3-0.6 (visible pero no opresivo)
- Se balancea ligeramente con el movimiento

### Implementación Técnica

#### Archivos a modificar:
1. **MascotWidget.tsx** — Cambiar de fixed a absolute, agregar silk thread SVG
2. **Spider3D.tsx** — Agregar estados `climbing`, `inspecting`, mejorar naturalidad
3. **spider.css** — Nuevas animaciones para silk thread y transiciones
4. **Nuevo: SilkThread.tsx** — Componente SVG para el hilo

#### Estados de la araña:
```
entering → climbing → idle → inspecting → climbing → ...
```

- `entering`: Desciende del top con péndulo
- `climbing`: Se mueve hacia una sección
- `idle`: Pausa natural, micro-movimientos
- `inspecting`: Observa un elemento específico

#### Posicionamiento:
- Container: `position: absolute` (no fixed)
- Top: calculado desde scroll position
- Right: fijo en borde derecho
- Z-index: 50 (sobre contenido pero bajo nav)

#### Silk Thread:
- SVG path desde `top: 0, right: X` hasta `spider.y, spider.x`
- Usar `requestAnimationFrame` para actualizar
- Curvatura: punto de control intermedio con offset X

# SurfaceManager Stack Policy

Ab `WP-SM-15` besitzt `x-surface-manager` den Contract `xtend.surface.stack-policy.v1` fuer gemischte Surface-Stacks aus Windows, SidePanels, Dialogen, Modals und Drawern.

## Ziel

`modal-policy` wird produktiv auf Manager-Ebene ausgewertet. Der SurfaceController bleibt die Registry-Quelle, waehrend der Manager die UI-nahe Stack-Policy auf vorhandene XTend-Komponenten anwendet:

- `snapshotStackPolicy()` liefert den aktuellen Report `xtend.surface.stack-policy-report.v1`.
- `applyStackPolicy()` wendet Layer Tokens, aktive Modalitaet, Inert, `aria-hidden`, `aria-modal`, Focus Trap, Focus Restore, Escape-Prioritaet und Scroll Lock an.
- bestehende Overlay-Komponenten behalten ihre lokalen APIs und Focus-/Escape-Implementierungen.

## Modal Policies

| Policy | Wirkung |
|--------|---------|
| `topmost` | die oberste modale Surface erhaelt aktive Modalitaet |
| `none` | keine Manager-Modalitaet, keine Inert- oder Scroll-Lock-Regel |
| `all-modal` | jede offene Surface kann als modal behandelt werden, aktiv ist die oberste |
| `surface-modal` | alle als modal deklarierten Surfaces werden erkannt, aktiv ist die oberste modale Surface |

## Laufzeitregeln

- Focus Restore: Beim Aktivieren einer modalen Surface merkt sich der Manager das vorherige Fokusziel und stellt es nach Close wieder her.
- Inert: Hintergrund-Surfaces erhalten `data-surface-inert="manager"`, `inert` und `aria-hidden`, solange eine aktive modale Surface existiert.
- Escape: Ein dokumentweiter Capture-Handler schliesst die aktive modale Surface oder sonst die oberste schliessbare Surface.
- Scroll Lock: Aktive Modalitaet setzt `data-xtend-surface-scroll-lock` auf `html` und `body`.
- Layer Tokens: Jede Surface erhaelt `data-surface-layer-token`, `--surface-layer-z` und kompatible Komponenten-Z-Variablen.
- Diagnostics: fehlende Labels, fehlende Fokusziele und Modalitaet unterhalb nicht-modaler Surfaces werden im Stack-Policy-Report sichtbar.

## Boundary

Die Stack Policy ist eine unterstuetzende XTend-UI-Schicht. Sie erzeugt keine zweite Registry, ersetzt weder Fabric noch den RMT Kernel und veraendert nicht die SurfaceController-Wahrheit. RMT kann `modal-policy` deklarieren, aber die Laufzeitentscheidung bleibt beim `x-surface-manager`.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js surface-stack-policy --json
```

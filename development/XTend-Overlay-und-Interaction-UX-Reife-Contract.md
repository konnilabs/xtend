# XTend Overlay und Interaction UX Reife Contract

- Schema: `xtend.component.overlay-interaction-ux.v1`
- Report Schema: `xtend.component.overlay-interaction-ux-report.v1`
- Runtime Profil: `xtendOverlayInteractionUxProfile`
- Workpackage: `WP-E11-11`
- Fixture: `tests/fixtures/rmt-overlay-interaction-ux.rmt`
- Suite: `tests/components/overlay_interaction_ux_suite.js`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

`WP-E11-11` vereinheitlicht Overlays und Interactions fuer `x-modal`, `x-dialog`, `x-popover`, `x-tooltip` und `x-drawer`. Die Komponenten bleiben XTend Custom Elements, RMT beschreibt Shell, Events, Commands und Schedules, und Host-Adapter fuehren DOM-nahe Regeln wie Focus Trap, Inert und Scroll Lock aus.

## Overlay Stack

Alle Zielkomponenten deklarieren `xtend.component.overlay-interaction-ux-profile.v1`. Der gemeinsame Stack-Contract verlangt:

- Escape schliesst nur das oberste aktive Overlay
- Open/Close laufen ueber `overlay.stack.open` und `overlay.stack.close`
- `x-modal`, `x-dialog` und modale `x-drawer` nutzen eine host-lokale Fixed-Layer-Strategie
- `x-popover` und `x-tooltip` bleiben anchor-lokal und koennen Positionierung ueber `overlay.position.update` schedulen

## Focus Trap

Modale Overlays muessen Fokus im Surface halten und den Fokus nach dem Schliessen zum zuletzt aktiven Element zurueckgeben. Popover und Drawer aktivieren die Fokusfalle nur bei modalem Betrieb; Tooltip bleibt nicht modal und beschreibt sein Ziel ueber `aria-describedby`.

## Inert

RMT darf Background-Inert deklarieren, fuehrt aber keine DOM-Mutation selbst aus. Die Umsetzung bleibt Host-Adapterarbeit. Pflichtregeln:

- `x-modal` und `x-dialog`: Background-Inert erforderlich
- `x-drawer`: Background-Inert nur bei modalem Betrieb
- `x-popover`: kein Inert per Default
- `x-tooltip`: nicht anwendbar

## Scroll Lock

Scroll Lock ist balanced: jede Lock-Operation muss wieder aufgehoben werden und darf die Scroll-Position nicht verlieren. `x-modal`, `x-dialog` und modale Drawer deklarieren `overlay.scroll.lock`; leichte Overlays bleiben scroll-neutral.

## Portal

Die Portal-Strategie bleibt host-neutral. RMT beschreibt stabile Container und Schedules, aber der RMT-Kernel importiert keine XTend-Typen und erzeugt keine XTend-spezifischen DOM-Helfer.

## RMT

Das Fixture `tests/fixtures/rmt-overlay-interaction-ux.rmt` nutzt:

- Adapter `xtend.component`
- Adapter `rmt.overlay-stack`
- Adapter `rmt.state-scheduler-diagnostics`
- Schedules `overlay.stack.open`, `overlay.stack.close`, `overlay.focus.trap`, `overlay.inert.apply`, `overlay.scroll.lock`, `overlay.position.update`, `a11y.announce` und `diagnostics.snapshot`

## Fabric

Overlay-Interaktionen sind Fabric-kompatibel:

- User Blocking Lane fuer Open/Close und Scroll Lock
- A11y Lane fuer Focus Trap und Inert
- Visible Lane fuer Tooltip/Popover-Positionierung und Drawer-Hydration
- Diagnostics Lane fuer `snapshot()`

## Testing

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js overlay-interaction-ux --json
```

Die Suite prueft Contract, Fixture, Komponentenprofile, Public Types, Docs, Package-Metadaten, Scaffold-Konfiguration und Backlog-/Epic-Status.

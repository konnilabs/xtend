# WP-E11-11 - Overlay und Interaction UX-Reife umsetzen

- Status: `completed`
- Epic: `EPIC-11`
- Schema: `xtend.epic11.wp11.overlay-interaction-ux.v1`
- Contract: `development/XTend-Overlay-und-Interaction-UX-Reife-Contract.md`
- Fixture: `tests/fixtures/rmt-overlay-interaction-ux.rmt`
- Suite: `tests/components/overlay_interaction_ux_suite.js`
- Local Gate: `node scripts/run_xtend_tests.js overlay-interaction-ux --json`

## Ziel

Dieses Paket vereinheitlicht die Overlay- und Interaction-Familie von XTend. `x-modal`, `x-dialog`, `x-popover`, `x-tooltip` und `x-drawer` erhalten einen gemeinsamen UX-Contract fuer Overlay Stack, Escape, Focus Trap, Rueckfokus, Inert, Scroll Lock, Portal-Verhalten, RMT Shell-first Authoring und Fabric-Lanes.

## Umgesetzte Arbeitsschritte

1. Contract-Modul `xtend-builder/typing/overlay-interaction-ux-contract.js` angelegt.
2. RMT-Fixture `tests/fixtures/rmt-overlay-interaction-ux.rmt` fuer Shell-first Overlay Authoring angelegt.
3. Suite `overlay-interaction-ux` in den lokalen Runner und die Package-Scripts eingebunden.
4. `xtendOverlayInteractionUxProfile` fuer `x-modal`, `x-dialog`, `x-popover`, `x-tooltip` und `x-drawer` ergaenzt.
5. `x-modal` und `x-dialog` auf explizite Component-, RMT-, A11y-, Performance- und Telemetry-Profile gehoben.
6. Public Types um `XtendOverlayInteractionUxProfile` und komponentenspezifische Snapshot-Typen erweitert.
7. Komponentendokumentation, Typing-README, Referenzpfade, Epic und Backlog auf den neuen Stand gezogen.

## Architekturentscheidungen

- RMT bleibt host-neutral und beschreibt nur Overlay-Semantik, Commands und Schedules.
- DOM-nahe Operationen wie `inert`, `aria-hidden` Fallback, Scroll Lock, Focus Trap und Portal-Materialisierung bleiben XTend Host Adapter-Verantwortung.
- `x-tooltip` bleibt bewusst nicht modal und bekommt kein Inert-/Scroll-Lock-Verhalten.
- `x-popover` und `x-drawer` aktivieren Focus Trap nur in modalem Betrieb.
- `snapshot()` ist der gemeinsame Diagnostics-Einstieg fuer Overlay-Zustand und Fabric-Korrelation.

## Akzeptanzkriterien

- `xtend.component.overlay-interaction-ux.v1` validiert gegen Factory und Validator.
- Alle Zielkomponenten deklarieren `xtend.component.overlay-interaction-ux-profile.v1`.
- RMT-Fixture enthaelt `rmt.overlay-stack`, Overlay-Schedules und komponentenspezifische Commands.
- Public Types exponieren Overlay-Profile und Snapshot-Rueckgaben.
- `x-modal` und `x-dialog` steigen in der Component Catalog Coverage Matrix auf `enterprise-ready`.
- `WP-E11-11` ist in Epic und Backlog `completed`, `WP-E11-12` ist `ready`.

## Tests

```bash
node scripts/run_xtend_tests.js overlay-interaction-ux --json
npm test -- --json
```

## Handoff

`WP-E11-12` kann nun Layout-, Display- und Media-Shell-Reife auf eine stabilere Overlay-Schicht aufsetzen. Besonders wichtig sind responsive Slots, Lazy Loading, Media-Portale und Docs-App-Kompatibilitaet fuer RMT-first App-Shells.

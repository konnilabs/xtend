# SurfaceManager Native RMT Surfaces

`WP-SM-08` fuehrt `xtend.rmt.surfaces-domain.v1` und den Adapter-Handoff `xtend.surface.adapter.v1` ein.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js surface-native-rmt --json
npm run test:surface-native-rmt
```

## Domain

`surfaces` ist eine optionale Top-Level-Domain in `.rmt` Dokumenten. Ein Surface Record referenziert weiter normale RMT-Domains:

- `adapter`: `xtend.surface`
- `manager`: `x-surface-manager` Component Record
- `component`: sichtbare Surface-Komponente, zum Beispiel `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog` oder `x-drawer`
- `route`: Route Record
- `schedule`: Schedule Record

Die Fixture `tests/fixtures/rmt-surface-native-domain.rmt` zeigt sechs Surface Records: zwei Windows, ein SidePanel, Modal, Dialog und Drawer.

## Adapter

`xtend.surface` ist als `surface_adapter` registrierbar. In `WP-SM-08` war `runtimeImplemented: false` Absicht und der Adapter blieb ein Handoff-Contract. Seit `WP-SM-19` ist die produktive Runtime-Linie im [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md) gatebar: Die Runtime konsumiert `surfaces[*]`, ruft den SurfaceController und haelt DOM, xstate und Fabric ausserhalb des RMT Kernels.

## Migration

Bestehende Component Records mit `metadata.surface` bleiben gueltig. Neue native Records koennen parallel gefuehrt werden, solange `id`, `type`, `manager`, `component`, `route`, `schedule` und `stateKey` stabil zusammenpassen.

## Tooling

Schema, Type Artifact, Normalizer, Semantic Graph, Completion Provider und Linter kennen `surfaces`. Damit kann der Language Server Surface Records referenzieren und Completion fuer `surfaces[*].component`, `surfaces[*].adapter`, `surfaces[*].route`, `surfaces[*].schedule` und `surfaces[*].type` anbieten.

## Handoff

`WP-SM-09` finalisiert Docs, Component Lab und Migration Guide auf dieser Contract-Basis. Der Abschluss liegt in [SurfaceManager Release Handoff](./surface-manager-release-handoff.md) (`docs/surface-manager-release-handoff.md`) und wird ueber `node scripts/run_xtend_tests.js surface-release-handoff --json` geprueft.

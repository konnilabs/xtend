# WP-SM-11 - Native `surfaces[*]` in XTend-UI-Komponenten materialisieren

Status: `completed`

## Ziel

`WP-SM-11` schliesst die Luecke zwischen dem produktiven `xtend.surface` Adapter aus `WP-SM-10` und einer wirklich nativen RMT-App-Shell. RMT-Templates koennen Surfaces jetzt in `surfaces[*]` deklarieren; der Host-Adapter materialisiert daraus `x-surface-manager`, `x-surface-window`, `x-side-panel` und Overlay-kompatible XTend-UI-Komponenten.

Die `components[*]` Records bleiben dabei Content-, Manager- und Fallback-Bindings. Es muessen keine parallelen Surface-Komponentenrecords fuer jedes Window, Panel oder Overlay gepflegt werden.

## Contract

| Feld | Wert |
| --- | --- |
| Schema | `xtend.surface.native-materialization.v1` |
| Runtime-Ergebnis | `xtend.surface.materialization.v1` |
| Adapter | `xtend.surface` |
| Factory | `createRmtSurfaceAdapter` |
| Gate | `node scripts/run_xtend_tests.js surface-native-materialization --json` |
| Package Script | `npm run test:surface-native-materialization` |

## Umsetzung

- `createRmtSurfaceAdapter()` stellt `materializeSurfaces()` bereit.
- `surfaces[*].type` bestimmt den sichtbaren XTend-UI-Wrapper:
  - `window` -> `x-surface-window`
  - `side-panel` -> `x-side-panel`
  - `modal` -> `x-modal`
  - `dialog` -> `x-dialog`
  - `drawer` -> `x-drawer`
  - `popover` -> `x-popover`
  - `tooltip` -> `x-tooltip`
- `surfaces[*].component` bleibt der Content-Ref und wird als Kind des Surface-Wrappers materialisiert.
- `surfaces[*].manager` erzeugt oder bindet einen `x-surface-manager`.
- Bounds, Placement, Mode, Open/Active-State, A11y-Label, Modalitaet, Route-, Schedule-, State- und Content-Refs werden als stabile Attribute an die erzeugten Elemente gebunden.
- Bestehende Surface-Elemente werden anhand `surface-id`/`data-rmt-surface` gebunden statt dupliziert.
- Registrierung laeuft gegen den vorhandenen `x-surface-manager`; es entsteht keine zweite Registry (`no-second-surface-registry`).

## Artefakte

| Artefakt | Rolle |
| --- | --- |
| `xtendrmt/rmt-core.esm.js` | Core Runtime mit `materializeSurfaces()` |
| `xtendrmt/rmt-runtime.esm.js` | ESM Runtime mit gleicher Adapteroberflaeche |
| `xtendrmt/rmt-runtime.browser.js` | Browser Runtime mit gleicher Adapteroberflaeche |
| `xtendrmt/rmt-core.d.ts` | Public Types fuer Materialization Handles |
| `catalog/surface-manager-materialization.js` | Maschinenlesbarer WP-SM-11 Contract |
| `tests/fixtures/rmt-surface-materialization-shell.rmt` | Native surfaces Fixture ohne parallele Surface-Komponentenrecords |
| `tests/rmt/surface_manager_materialization_suite.js` | Lokaler Gate |

## Abnahme

- Native `surfaces[*]` erzeugen eine lauffaehige App-Shell mit `x-surface-manager`.
- Surface Wrapper werden aus dem Surface-Typ abgeleitet.
- Content-Komponenten bleiben Content-Bindings.
- Existing DOM wird gebunden und nicht gedoppelt.
- `materializeSurfaces()` meldet `xtend.surface.materialization.v1`.
- Die Runtime ersetzt weder Fabric noch RMT-Kernel noch SurfaceController.
- Keine Doku-App-Sonderloesung, kein Monkeypatch, kein zweites Registry-Modell.

## Folge

`WP-SM-12` kann auf dieser Basis Shell-Layouts, Surface-Zonen, responsive Policies und staerkere Shell-first Skeleton-Strategien spezifizieren, ohne die RMT-Kernelgrenze aufzubrechen.

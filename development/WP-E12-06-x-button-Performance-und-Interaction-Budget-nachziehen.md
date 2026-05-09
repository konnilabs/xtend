# WP-E12-06 - x-button Performance und Interaction Budget nachziehen

- Status: `completed`
- Datum: 7. Mai 2026
- Workpackage Contract: `xtend.epic12.wp06.xbutton-performance-interaction-budget.v1`
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js components catalog-coverage component-long-tail-migration regression-priority epic11-enterprise-ux-handoff references --json`

## Ziel

`WP-E12-06` schliesst die Performance-Restdimension von `x-button`. Der Button ist ein interaktiver Grundbaustein, deshalb reicht ein statisches Profil nicht aus: Click, Keyboard, Busy/Loading, Touch Target und State-Sync muessen als Budget- und Measurement-Oberflaeche verfuegbar sein.

## Scope

| Bereich | Umsetzung |
|---------|-----------|
| Runtime Performance | `xtendScaffoldPerformanceProfile` mit `interactive-small`, `user-blocking`, `visible` |
| Interaction Budget | Click-, Keyboard-, Busy-, Render- und State-Sync-Budgets |
| Fabric Measurements | `button-interaction`, `button-performance-measured`, `snapshotPerformance()` |
| Busy/Disabled Guards | `loading` blockiert Interaktion, `aria-busy` bleibt explizit spiegelbar |
| Touch Target | Token `--xtend-button-min-touch-target` mit 44px Default |
| RMT Boundary | `xtendRmtMetadata` mit `no-rmt-kernel-import-of-xtend-types` |
| Typen | Public Types fuer Budget, Snapshot, Measurement und neue Events |
| Docs/Fixture | Fixture prueft State, Snapshot, Budget und Interaktionsmessung |

## Runtime Contract

`components/xbutton.js` stellt nun bereit:

- `xtendComponentContract`
- `xtendRmtMetadata`
- `xtendComponentLifecycleTelemetry`
- `xtendScaffoldPerformanceProfile`
- `getPerformanceBudget()`
- `getInteractionBudget()`
- `snapshotPerformance()`
- `setLoading(loading, options?)`

Das Performance-Profil nutzt:

- Schema: `xtend.performance.component-profile.v1`
- `componentRef`: `x-button`
- `budgetClass`: `interactive-small`
- `lane`: `user-blocking`
- `hydrationPolicy`: `visible`
- kritische Messpunkte:
  - `xtend.component.hydrate`
  - `xtend.component.render`
  - `xtend.component.update`
  - `xtend.event.handler`
  - `xtend.interaction.click`
  - `xtend.interaction.keyboard`

## Interaction Budget

| Budget Key | Ziel |
|------------|------|
| `hydrate` | sichtbare Button-Hydration |
| `renderUpdate` | Attribut-, Label-, Icon-, Variant- und Size-Updates |
| `eventAction` | Click-Interaktion |
| `keyboardAction` | Enter-/Space-Interaktion |
| `busyToggle` | Wechsel von `loading` oder `aria-busy` |
| `stateSync` | Spiegelung nach `xbutton-state-<id>` |

Busy und Disabled bleiben getrennt:

- `disabled` sperrt Interaktion und spiegelt `aria-disabled`.
- `loading` setzt Busy, zeigt den Spinner und sperrt Interaktion.
- `aria-busy="true"` kann Busy signalisieren, ohne zwingend den Loading-Spinner zu erzwingen.

## Fabric und RMT

Fabric kann die Runtime ueber folgende Oberflaechen anbinden:

- Event `button-interaction`
- Event `button-performance-measured`
- API `snapshotPerformance()`
- State-Key `xbutton-state-<id>`

RMT sieht nur deklarative Metadaten:

- Adapter: `xtend.component`
- Template Mode: `dom_descriptor`
- Event Binding Mode: `dom-event-to-rmt-command`
- Schedule Refs: `component.visible.hydrate`, `ui.user-blocking.interaction`, `diagnostics.snapshot`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

Der RMT Kernel importiert weiterhin keine XTend-Komponente, keinen `xstate`-Typ und keine Fabric Runtime.

## Katalogwirkung

- `x-button` wechselt von `typed-contract-gated` zu `enterprise-ready`.
- Die Performance-Coverage steigt auf `34/37`.
- Die offenen Performance-Restpunkte sinken auf `3`: `xstate`, `x-menu` und `x-utils`.
- Der offene Long-Tail sinkt auf `3` Manifest-Eintraege: `x-menu`, `xstate`, `x-utils`.

## Geaenderte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `components/xbutton.js` | Runtime-Profil, Budgets, Measurements und RMT-Metadaten |
| `components/xbutton.d.ts` | Public Types fuer Budgets, Snapshots und Events |
| `tests/components/priority_component_contracts.js` | Contract Assertions fuer `x-button` erweitert |
| `tests/components/fixtures/xbutton.component.html` | State-, Snapshot- und Interaktionsprobe |
| `docs/components/xbutton.md` | Performance-, Fabric- und RMT-Dokumentation |
| `tests/catalog/*` | neue Long-Tail-, Coverage- und Regression-Zaehler |
| `package.json` | offene Long-Tail-Zielmenge aktualisiert |
| `xtend-builder/scaffold.config.js` | Scaffold-Handoff der offenen Restpunkte aktualisiert |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| `x-button` besitzt `xtendScaffoldPerformanceProfile` | erfuellt |
| Click/Keyboard/Busy Budgets sind dokumentiert | erfuellt |
| Fabric Measurement Events sind vorhanden | erfuellt |
| Public Types sind erweitert | erfuellt |
| Fixture validiert Snapshot und Interaction Budget | erfuellt |
| `catalog-coverage` klassifiziert `x-button` als `enterprise-ready` | erfuellt |
| `component-long-tail-migration` entfernt `x-button` | erfuellt |
| `WP-E12-07` startbar | erfuellt |

## Verifikation

```bash
node --check components/xbutton.js
node --check components/xbutton.d.ts
node scripts/run_xtend_tests.js components --json
node scripts/run_xtend_tests.js catalog-coverage component-long-tail-migration regression-priority epic11-enterprise-ux-handoff --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E12-06` ist abgeschlossen. `x-button` ist nun als sichtbare P1-Interaktionskomponente performance-, Fabric-, RMT-, Typen-, Fixture- und Doku-seitig `enterprise-ready`. Der naechste primaere Epic-12-Pfad ist `WP-E12-07` fuer `x-menu`.

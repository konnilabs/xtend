# WP-E12-07 - x-menu Performance, Keyboard und Router-Kompatibilitaet haerten

- Status: `completed`
- Datum: 7. Mai 2026
- Workpackage Contract: `xtend.epic12.wp07.xmenu-performance-keyboard-router.v1`
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js components catalog-coverage component-long-tail-migration regression-priority epic11-enterprise-ux-handoff references --json`

## Ziel

`WP-E12-07` schliesst die sichtbare P1-Restdimension von `x-menu`. Die Komponente ist ein Navigation-/Interaction-Baustein und muss daher mehr koennen als ein statisches Performance-Profil: Keyboard-Fokus, Active-State-Sync, `x-link`-/`x-router`-Kompatibilitaet, Fabric-Messpunkte und RMT Route Schedule Metadata muessen als stabiler Runtime-Contract verfuegbar sein.

## Scope

| Bereich | Umsetzung |
|---------|-----------|
| Runtime Performance | `xtendScaffoldPerformanceProfile` mit `navigation-small`, `user-blocking`, `visible` |
| Keyboard Budget | Arrow-, Home-/End-, Enter-/Space-Handling mit Roving `tabindex` |
| Router-Kompatibilitaet | interne `href`-Aktivierung ueber `router-navigate` und `x-navigate` |
| Fabric Measurements | `menu-keyboard-navigation`, `menu-navigate`, `menu-performance-measured`, `snapshotPerformance()` |
| Active State | `xmenu-active` und `xmenu-state-<id>` mit `aria-current="page"` |
| RMT Boundary | `xtendRmtMetadata` mit `no-rmt-kernel-import-of-xtend-types` |
| Typen | Public Types fuer Navigation, Keyboard, Snapshot, Measurement und neue Events |
| Docs/Fixture | Fixture prueft State, Snapshot, Interaction Budget, Keyboard- und Router-Signale |

## Runtime Contract

`components/xmenu.js` stellt nun bereit:

- `xtendComponentContract`
- `xtendRmtMetadata`
- `xtendComponentLifecycleTelemetry`
- `xtendScaffoldA11yProfile`
- `xtendScaffoldPerformanceProfile`
- `xtendNavigationRoutingUxProfile`
- `getPerformanceBudget()`
- `getInteractionBudget()`
- `snapshotPerformance()`

Das Performance-Profil nutzt:

- Schema: `xtend.performance.component-profile.v1`
- `componentRef`: `x-menu`
- `budgetClass`: `navigation-small`
- `lane`: `user-blocking`
- `hydrationPolicy`: `visible`
- kritische Messpunkte:
  - `xtend.component.hydrate`
  - `xtend.component.render`
  - `xtend.component.slotchange`
  - `xtend.interaction.keyboard`
  - `xtend.route.navigate`
  - `xtend.state.sync`

## Keyboard und Routing

| Pfad | Ziel |
|------|------|
| `ArrowRight` / `ArrowDown` | Fokus auf naechsten Menueintrag |
| `ArrowLeft` / `ArrowUp` | Fokus auf vorherigen Menueintrag |
| `Home` / `End` | Fokus auf ersten oder letzten Menueintrag |
| `Enter` / `Space` | aktiviert den aktuellen Eintrag |
| interne `href` | schreibt `router-navigate` und emittiert `x-navigate` |
| `xrouter-after-navigate` | synchronisiert `aria-current` und `xmenu-active` |

Slotted `a`, `button`, `x-link` und `[role="menuitem"]` werden als `menuitem` gefuehrt. Listener werden bei `slotchange` bereinigt und neu gesetzt, damit keine mehrfachen Handler entstehen.

## Fabric und RMT

Fabric kann die Runtime ueber folgende Oberflaechen anbinden:

- Event `menu-item-clicked`
- Event `menu-navigate`
- Event `menu-keyboard-navigation`
- Event `menu-performance-measured`
- API `snapshotPerformance()`
- State-Key `xmenu-state-<id>`

RMT sieht nur deklarative Metadaten:

- Adapter: `xtend.component`
- Template Mode: `dom_descriptor`
- Event Binding Mode: `dom-event-to-rmt-command`
- Schedule Refs: `component.visible.hydrate`, `ui.user-blocking.navigation`, `route.transition.navigate`, `diagnostics.snapshot`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

Der RMT Kernel importiert weiterhin keine XTend-Komponente, keinen XRouter-Typ, keinen `xstate`-Typ und keine Fabric Runtime.

## Katalogwirkung

- `x-menu` wechselt von `typed-contract-gated` zu `enterprise-ready`.
- Die Performance-Coverage steigt auf `35/37`.
- Die offenen Performance-Restpunkte sinken auf `2`: `xstate` und `x-utils`.
- Der offene Long-Tail sinkt auf `2` Manifest-Eintraege: `xstate` und `x-utils`.

## Geaenderte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `components/xmenu.js` | Runtime-Profil, Budgets, Keyboard, Routing und RMT-Metadaten |
| `components/xmenu.d.ts` | Public Types fuer Navigation, Keyboard, Budgets, Snapshots und Events |
| `tests/components/priority_component_contracts.js` | Contract Assertions fuer `x-menu` erweitert |
| `tests/components/fixtures/xmenu.component.html` | State-, Snapshot-, Keyboard- und Routing-Probe |
| `docs/components/xmenu.md` | Performance-, Fabric-, RMT- und Routing-Dokumentation |
| `tests/catalog/*` | neue Long-Tail-, Coverage- und Regression-Zaehler |
| `package.json` | offene Long-Tail-Zielmenge aktualisiert |
| `xtend-builder/scaffold.config.js` | Scaffold-Handoff der offenen Restpunkte aktualisiert |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| `x-menu` besitzt `xtendScaffoldPerformanceProfile` | erfuellt |
| Keyboard-, Route- und State-Sync-Budgets sind dokumentiert | erfuellt |
| Fabric Measurement Events sind vorhanden | erfuellt |
| `x-link` und `x-router` sind kompatible Navigation Hosts | erfuellt |
| Public Types sind erweitert | erfuellt |
| Fixture validiert Snapshot, Budget, Keyboard und Navigation | erfuellt |
| `catalog-coverage` klassifiziert `x-menu` als `enterprise-ready` | erfuellt |
| `component-long-tail-migration` entfernt `x-menu` | erfuellt |
| `WP-E12-08` startbar | erfuellt |

## Verifikation

```bash
node --check components/xmenu.js
node --check components/xmenu.d.ts
node scripts/run_xtend_tests.js components --json
node scripts/run_xtend_tests.js catalog-coverage component-long-tail-migration regression-priority epic11-enterprise-ux-handoff --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E12-07` ist abgeschlossen. `x-menu` ist nun als sichtbare P1-Navigation-/Interaktionskomponente performance-, keyboard-, router-, Fabric-, RMT-, Typen-, Fixture- und Doku-seitig `enterprise-ready`. Der naechste primaere Epic-12-Pfad ist `WP-E12-08` fuer `xstate`.

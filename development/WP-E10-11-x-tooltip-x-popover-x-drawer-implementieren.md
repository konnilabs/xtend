# WP-E10-11 - x-tooltip, x-popover, x-drawer implementieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps`
- Contract: `xtend.epic10.overlay-navigation-controls.v1`
- Bezug:
  - `development/XTend-Overlay-Navigation-Controls-TypeScript-RMT-Contract.md`
  - `development/XTend-P0-Komponentenwelle-und-Contract-Stubs.md`
  - `components/manifest.json`
  - `tests/components/component_suite.js`
  - `tests/catalog/component_catalog_coverage_suite.js`

## Ziel

WP-E10-11 schliesst die erste Epic-10-Komponentenwelle ab. `x-tooltip`, `x-popover` und `x-drawer` liefern Overlay- und Navigationsmuster fuer RMT-first XTend-Apps. Sie sind TypeScript-first geplant, lokal als ESM lauffaehig, public typisiert, RMT-authorbar, Fabric-kompatibel, telemetry-faehig, A11y-by-design und Performance-by-design vorbereitet.

## Umgesetzte Komponenten

| Komponente | Runtime | TypeScript Source | Public Types | Suite |
|------------|---------|-------------------|--------------|-------|
| `x-tooltip` | `components/xtooltip.js` | `src/components/x-tooltip/x-tooltip.ts` | `components/xtooltip.d.ts` | `tests/components/xtooltip.component_suite.js` |
| `x-popover` | `components/xpopover.js` | `src/components/x-popover/x-popover.ts` | `components/xpopover.d.ts` | `tests/components/xpopover.component_suite.js` |
| `x-drawer` | `components/xdrawer.js` | `src/components/x-drawer/x-drawer.ts` | `components/xdrawer.d.ts` | `tests/components/xdrawer.component_suite.js` |

## Entscheidungen

- Runtime bleibt ESM und lokal unter `components/`.
- TypeScript Source bleibt Source-of-Truth unter `src/components/<tag>/`.
- Runtime-Dateinamen folgen der bestehenden Manifest-Konvention ohne Bindestrich: `x-tooltip` -> `xtooltip.js`.
- `x-tooltip` ist das leichte, nicht modale Kontext-Hilfe-Control mit `aria-describedby`.
- `x-popover` ist das interaktive Anchor-Overlay fuer Menues, Filter und Aktionen.
- `x-drawer` ist das Shell-/Navigations-Overlay fuer RMT-first App-Strukturen und route-aware Flows.
- RMT sieht die Komponenten als `xtend.component` Records mit `dom_descriptor`-Authoring, nicht als Kernel-Abhaengigkeit.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Public API

| Komponente | Attribute | Events | State Keys |
|------------|-----------|--------|------------|
| `x-tooltip` | `for`, `placement`, `open`, `delay`, `label` | `tooltip-opened`, `tooltip-closed` | `xtooltip-open-<id>` |
| `x-popover` | `open`, `placement`, `modal`, `anchor`, `label` | `popover-opened`, `popover-closed` | `xpopover-open-<id>` |
| `x-drawer` | `open`, `placement`, `modal`, `label`, `route-aware` | `drawer-opened`, `drawer-closed`, `drawer-route-selected` | `xdrawer-open-<id>` |

## A11y und Performance

- `x-tooltip` nutzt `role="tooltip"`, `aria-describedby`, Hover/Fokus-Open und Escape-Close.
- `x-popover` nutzt `role="dialog"`, `aria-expanded`, `aria-controls`, optional `aria-modal`, Outside Click, Escape und Focus Return.
- `x-drawer` nutzt `role="dialog"`, `aria-modal`, `aria-expanded`, Focus Trap, Focus Return und route-change-announcement.
- Alle drei Komponenten deklarieren `xtend.performance.component-profile.v1`.
- Die drei Controls erweitern die `enterprise-ready` Linie im Component Catalog auf neun Komponenten.

## Gate

```bash
node scripts/run_xtend_tests.js components --json
node scripts/run_xtend_tests.js catalog-coverage --json
node scripts/run_xtend_tests.js regression-priority --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

Der Manifest-Catalog steigt auf 37 Komponenten. Component-Suites, Fixtures und Public Types steigen auf 27. `x-tooltip`, `x-popover` und `x-drawer` sind im Catalog `enterprise-ready`; die offenen Performance-Luecken der Legacy-Komponenten bleiben als 28 Warnungen sichtbar.

## Handoff

`WP-E10-12` kann starten und das Component Lab mit RMT Inspector Pilot auf der vollstaendigen ersten Epic-10-Komponentenwelle aufbauen.

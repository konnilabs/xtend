# XTend RMT DSL Authoring Polish fuer Component Shells

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.rmt.dsl-authoring-polish.v1`
- Report: `xtend.rmt.dsl-authoring-polish-report.v1`
- Fixture: `xtend.rmt.dsl-authoring-polish-fixture.v1`
- Workpackage: `WP-E12-13`
- Gate: `node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

Dieses Dokument friert die XTend-seitige Vorbereitung fuer eine freundlichere RMT-DSL ein. Ziel ist, dass Component Shells, Styles, A11y, Events, Slots und XRouter-Routen kuerzer authorbar werden, waehrend die normalisierten RMT Records weiterhin host-neutral bleiben.

XTend liefert dafuer keinen Parser und keine Kernel-Erweiterung. XTend liefert einen Alias-, Diagnose-, Beispiel- und Handoff-Contract, den XTendRMT upstream spaeter in Syntax, Editor-Hints und Parser-Diagnostik ueberfuehren kann.

## Source Contracts

- `xtend.rmt.shell-authoring.v1`
- `xtend.rmt.style-authoring.v1`
- `xtend.rmt.first-class-app-authoring.v1`
- `xtend.rmt.xrouter-adapter.v1`
- `xtend.component.network.v1`
- `xtend.design-tokens.product-contract.v1`

## Alias-Plan

| Alias | Normalisiertes Ziel | Zweck |
|-------|---------------------|-------|
| `component` | `components[]` | XTend Component Record mit Shell, Style, A11y, Events, Commands, Hydration und Fabric |
| `shell` | `components[].shell` | Shell-Zustand, Slots, Parts, Fokus und Attribute |
| `slot` | `components[].shell.slots` | benannte Template-, Component- oder Text-Slots |
| `style` | `components[].style` | Variant, Size, Theme, Density, Tokens und Parts |
| `token` | `components[].style.tokens` | produktive `--xtend-*` Token-Bindings |
| `theme` | `components[].style.theme` | Theme Pack Auswahl |
| `density` | `components[].style.density` | Density Pack Auswahl |
| `a11y` | `components[].a11y` | Role, Label, Live Region, Keyboard und Announcements |
| `on` | `components[].events` | DOM-/Component-Event zu RMT Command |
| `command` | `components[].commands` | Command zu Schedule und Payload |
| `hydrate` | `components[].hydration` | Host-Hydration-Policy und Schedule |
| `lane` | `components[].fabric.lane` | Fabric Lane, Fiber und Telemetry-Korrelation |
| `route` | `routes[]` | XRouter Route als Adapterdaten |
| `link` | `components[] + routes[]` | XLink-kompatibles Routing-Sugar |
| `outlet` | `templates[].nodes[]` | Routen-Outlet in Shell-first Templates |

Alle Aliase sind Sugar. Sie duerfen im RMT Kernel nicht sichtbar als XTend-Typen landen.

## Diagnostik

Der Polish-Contract verlangt Diagnostics-first Validation:

- `rmt.dsl.alias.unknown`
- `rmt.dsl.alias.required-field-missing`
- `rmt.dsl.token.unknown`
- `rmt.dsl.route.target-unresolved`
- `rmt.dsl.link.route-unresolved`
- `rmt.dsl.slot.target-unresolved`
- `rmt.dsl.schedule.unresolved`
- `rmt.dsl.inline-runtime-code-refused`
- `rmt.dsl.kernel-boundary.refused`

Diese Codes sind bewusst upstream-sicher formuliert. Sie beschreiben RMT-Dokumentprobleme und keine XTend Runtime-Exceptions.

## XRouter- und XLink-Sugar

`route`, `link` und `outlet` sind die zentrale UX-Verbesserung fuer RMT-first Apps:

```json
{
  "route": "/settings",
  "component": "settings.shell",
  "link": {
    "label": "Settings",
    "href": "/settings",
    "active": "aria-current"
  },
  "outlet": "primary"
}
```

Der normalisierte Output bleibt `routes[]`, `components[]` und `templates[]` mit Adapter `xtend.xrouter`. Navigation, Fokus-Wiederherstellung und Route Announcements bleiben Host-Aufgabe.

## Token Bridge

WP-E12-13 baut direkt auf `xtend.design-tokens.product-contract.v1` auf. RMT DSL Authoring sollte mindestens diese produktiven Tokens erkennen:

- `--xtend-surface`
- `--xtend-text`
- `--xtend-color-primary`
- `--xtend-density-spacing`
- `--xtend-radius`

Theme Packs sind `light`, `dark`, `high-contrast` und `forced-colors`. Density Packs sind `comfortable`, `compact` und `dense`.

## Kernel Boundary

Der Contract ist gueltig, wenn alle folgenden Punkte halten:

- `no-rmt-kernel-import-of-xtend-types`
- keine inline JavaScript Handler in RMT Templates
- keine `<script>` Nodes in autorisierten Template-Beispielen
- RMT normalisiert vor Runtime-Ausfuehrung
- XTend bleibt Host Adapter fuer Components, XRouter, Fabric und Telemetry

## Artefakte

- Modul: `xtend-builder/typing/rmt-dsl-authoring-polish.js`
- Fixture: `tests/fixtures/rmt-dsl-authoring-polish.rmt`
- Suite: `tests/rmt/rmt_dsl_authoring_polish_suite.js`
- Docs: `docs/rmt-dsl-authoring-polish.md`
- Workpackage: `development/WP-E12-13-RMT-DSL-Authoring-Polish-fuer-Component-Shells-vorbereiten.md`

## Upstream-Handoff

XTendRMT upstream kann auf diesen stabilen Inputs aufsetzen:

- Alias-Plan fuer Shell, Style, A11y, Events, Commands, Slots und Routing
- Diagnosecodes mit Repair-Hints
- normalisierte Beispiel-Templates
- Token Bridge fuer produktive `--xtend-*` Namen

Nicht-Ziele bleiben: XTend Component Classes in den RMT Kernel importieren, DOM-Event-Handler in RMT ausfuehren oder Host Adapter ersetzen.

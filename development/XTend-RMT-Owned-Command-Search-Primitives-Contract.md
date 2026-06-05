# XTend RMT Owned Command Search Primitives Contract

- Status: `accepted`
- Datum: 4. Juni 2026
- Contract: `xtend.rmt-ui-maximality-owned-command-search-primitives.v1`
- Matrix Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives-matrix.v1`
- Fixture Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives-fixtures.v1`
- RMT Fixture Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives.rmt-fixture.v1`
- Report Schema: `xtend.rmt-ui-maximality-owned-command-search-primitives-report.v1`
- Workpackage: `WP-RMO-04`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-owned-command-search-primitives --json`
- Package Script: `npm run test:rmt-owned-command-search-primitives`
- Bezug:
  - `development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md`
  - `development/XTend-RMT-Owned-Command-Search-Primitives-Matrix.md`
  - `development/WP-RMO-04-Owned-Command-Search-Primitive-Package-schneiden.md`
  - `tests/fixtures/native-first/rmt-owned-command-search-primitives-fixtures.json`
  - `tests/fixtures/rmt-owned-command-search-primitives.rmt`
  - `tests/native-first/rmt_owned_command_search_primitives_suite.js`

## Zweck

`WP-RMO-04` schneidet Command Palette, Search, Autocomplete und Combobox als eigenes XTend-Primitive-Paket, ohne `cmdk`, Headless-UI-Comboboxen oder Framework-spezifische APIs zu emulieren. Der erste akzeptierte Scope ist ein deklarativer Command/Search-Authoring-Pfad: vorhandene XTend Controls, Overlay/Focus-Primitives und RMT Action-/Effect-/Resource-Records bilden die sichere Foundation.

## Paketgrenzen

- `owned-command-search-foundation`: `x-input`, `x-button`, `x-menu`, `x-popover`, `x-dialog`, `x-status`, `x-progress`, `x-alert` und `x-icon` sind die vorhandene Owned Surface.
- `command-source-record`: RMT beschreibt registrierte Commands, Trigger, Keyboard Shortcuts, Action-Refs, disabled State, Result State und Source Maps als Records.
- `search-source-resource-binding`: RMT beschreibt Query State, Resource Binding, async Loading/Error/Empty State, debounce policy und result selection als Records.
- `overlay-focus-policy`: Command/Search nutzt bestehende Overlay-, Popover-, Escape-, Focus-Restore- und ARIA-Primitives statt einer zweiten Surface Registry.
- `x-command-palette`, `x-autocomplete` und `x-combobox`: explizite Deferrals mit Owner, Keyboard-/ARIA-Modell, Browser-Lab- und Visual-Evidence-Anforderungen.
- Keine Runtime-Dependency, keine externe UI-Framework-Kopplung und keine RMT-Kernel-Kopplung an XTend-Komponententypen.
- Boundary Literal: `no-runtime-dependency`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Nicht-Ziele

- `command-palette-full-parity`
- `framework-command-api-copy`
- `rich-combobox-autocomplete-parity`
- `unregistered-command-execution`
- `free-command-execution-without-action-ref`
- `manual-html-command-renderer`
- `free-search-result-render-function`

## Source Gates

| Gate | Zweck |
|------|-------|
| `rmt-owned-command-search-primitives` | lokaler WP-RMO-04 Gate |
| `rmt-ui-primitive-gap` | Quelle fuer `NFM-RUG-12` |
| `native-first-market-pattern-parity` | negative Command/Search Claims |
| `rmt-action-effect-data-resource-primitives` | Action-, Effect-, Resource- und Command-Policy |
| `rmt-event-routing-runtime` | deklaratives Event-to-Action Routing |
| `native-first-overlay-focus` | Popover, Focus Restore, Escape und Stack Policy |
| `native-first-form-navigation-media` | Input-, Select- und Menu-Grenzen |
| `rmt-complete-ui-recipes` | Command/Search Workflow-Handoff |
| `catalog-coverage` | vorhandene Control-, Overlay- und Feedback-Komponenten |
| `references` | stabile Pfade |

## Claim-Regeln

| Claim | Entscheidung |
|-------|--------------|
| RMT kann registrierte Commands mit Trigger, Action-Refs, Policy und Result State als Records ausdruecken | `allowed-with-contract-evidence` |
| RMT kann Search Query, async Resource, Loading, Empty, Error und Selection als Records ausdruecken | `allowed-with-contract-evidence` |
| XTend besitzt eine eigene Control-, Overlay- und Feedback-Foundation fuer Command/Search UIs | `allowed-with-owned-foundation` |
| XTend hat fertige Command Palette-, Autocomplete- und rich Combobox-Paritaet | `blocked-negative-claim` |
| Commands duerfen ohne registrierte Action-Ref oder Effect Policy ausgefuehrt werden | `blocked-negative-claim` |
| Framework-spezifische Command-/Combobox-APIs sind Produktvertrag | `blocked-negative-claim` |

## Handoff

`command-search-parity` wird nicht als vollstaendig geschlossen markiert, sondern als `scoped-owned-command-search-package` eingegrenzt. `WP-RMO-05` darf die RMT Complete-UI-Recipes auf `commandSources[]` und `searchSources[]` umstellen. `WP-RMO-06` und `WP-RMO-07` behalten Browser-Lab-, Visual-, Keyboard-, ARIA- und Budget-Evidence fuer physische `x-command-palette`, `x-autocomplete` und `x-combobox`.

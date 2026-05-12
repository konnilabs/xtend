# WP-E15-08 - Surface-Orchestrierung und Host-neutral Surface Registry bauen

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Core Contract: `xtend.rmt.core-format.vnext.v1`
- Surface Registry Contract: `xtend.rmt.vnext-surface-registry.v1`
- Surface Contract: `xtend.rmt.vnext-surface.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-vnext-surfaces --json`
- Package Script: `npm run test:rmt-vnext-surfaces`
- Zielzustand: `rmt-vnext-surface-registry-ready`

## Ziel

`WP-E15-08` modelliert Surfaces als eigenstaendige Orchestrierungsziele und erzeugt daraus einen host-neutralen Registry-Snapshot. Lanes und Operations werden eindeutig einer Surface zugeordnet, ohne DOM-, Component- oder Runtime-Abhaengigkeiten einzufuehren.

## Umgesetzt

- `tools/rmt-language/vnext-surfaces.js` als Surface-Registry-Modul angelegt
- Contract-Schema `xtend.rmt.vnext-surface-registry.v1` eingefuehrt
- Surface-Schema `xtend.rmt.vnext-surface.v1` eingefuehrt
- Surface Types `root`, `modal`, `panel`, `overlay`, `workspace`, `portal` definiert
- Authoring-Prefixes wie `dialog`, `drawer`, `toast`, `workbench` auf Canonical Surface Types gemappt
- host-neutrale `hostBinding`-Metadaten fuer Host-Rolle, Stack, Modalitaet und Portalverhalten erzeugt
- Beziehungen Surface -> Lane -> Operation gegen Core-Refs validiert
- Diagnostics fuer unknown surface kinds, duplicate surface IDs, missing lane refs, lane scope mismatches, missing operation refs, operation scope mismatches und missing template refs umgesetzt
- `tests/rmt-language/fixtures/vnext-surfaces-valid.rmt` als Multi-Surface-Fixture angelegt
- `tests/rmt-language/rmt_vnext_surface_registry_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` um `rmt-vnext-surfaces` erweitert
- `package.json` um Export, Metadaten und Script fuer den Surface Registry Contract erweitert
- Epic-Backlog aktualisiert: `WP-E15-08` completed, `WP-E15-09` bleibt ready

## Implementierungsentscheidung

Der Surface Registry Contract ist eine host-neutrale Snapshot-Schicht ueber dem Core-Compiler:

- `tools/rmt-language/vnext-surfaces.js`

Er liest:

- `coreDocument.surfaces[]`
- `coreDocument.lanes[]`
- `coreDocument.operations[]`
- `coreDocument.templates[]`
- `coreDocument.sourceMap[]`

Er erzeugt:

- Surface Registry Snapshot
- normalisierte Surface Records
- Type- und HostBinding-Metadaten
- Lane- und Operation-Relationen
- Source-map-faehige Diagnostics

Er importiert keine DOM-, Surface-Manager-, Component- oder Runtime-Module.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Surfaces sind ohne DOM-Kopplung beschreibbar | erfuellt: `hostBinding.domCoupled` bleibt `false` |
| Operationen koennen eindeutig einer Surface zugeordnet werden | erfuellt: Lane- und Operation-Refs werden gegen Core-Scope geprueft |
| Surface-Typen sind normalisiert | erfuellt: `root`, `modal`, `panel`, `overlay`, `workspace`, `portal` |
| Konflikte sind diagnostizierbar | erfuellt: duplicate IDs, unknown kinds, missing refs und scope mismatches |
| Registry-Snapshot ist host-neutral | erfuellt: keine Runtime- oder DOM-Imports |
| lokaler Surface-Gate vorhanden | erfuellt: `rmt-vnext-surfaces` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `74`
- Failures: `0`
- Warnings: `0`

Zusaetzliche Regression-Gates:

```bash
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-parser --json
node scripts/run_xtend_tests.js rmt-parser --json
node scripts/run_xtend_tests.js references --json
```

Ergebnisse:

- `rmt-vnext-scheduler`: `passed`, `68` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-lifecycle`: `passed`, `75` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-compiler`: `passed`, `65` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-parser`: `passed`, `57` Passes, `0` Failures, `0` Warnings
- `rmt-parser`: `passed`, `84` Passes, `0` Failures, `0` Warnings
- `references`: `passed`, `7472` Passes, `0` Failures, `0` Warnings
- `package.json` JSON parse: `passed`

## Handoff

`WP-E15-08` ist abgeschlossen. `WP-E15-09` kann Conditions und Expression Subset weiterhin auf Core-Operations beziehen; `WP-E15-10` kann Component Binding gegen stabile Surface- und Slot-Beziehungen aufbauen.

Noch nicht Teil von `WP-E15-08`:

- Component Binding
- Slot Composition
- echte Surface Manager Runtime
- Browser-Smokes
- Event-/Action-Execution
- Streaming Runtime

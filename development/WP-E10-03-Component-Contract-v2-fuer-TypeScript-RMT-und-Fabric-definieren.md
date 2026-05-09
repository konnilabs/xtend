# WP-E10-03 - Component Contract v2 fuer TypeScript, RMT und Fabric definieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Backlog: `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Contract: `xtend.epic10.wp03.component-contract-v2.v1`
- Component Contract: `xtend.component.contract.v2`
- Bezug:
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-TypeScript-Component-Source-Strategie.md`
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `xtend-builder/typing/component-contract-v2.js`
  - `tests/components/component_contract_v2_suite.js`
  - `xtend-builder/scaffold.config.js`
  - `package.json`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E10-03` definiert den Component Contract v2 als gemeinsame Abnahmeflaeche fuer TypeScript Source, Public Types, RMT Component Metadata, Fabric Boundary, Telemetry, Lanes/Fibers, A11y, Performance, Tests, Docs und Maturity.

Das Paket schliesst die Luecke zwischen:

- TypeScript Source-Strategie aus `WP-E10-02`
- RMT Component Contract v1 aus Epic 04/05
- Fabric-, Telemetry-, Lane-, A11y- und Performance-Contracts aus dem Enterprise-Reife-Lauf
- Component-Maturity-Modell v2 aus `WP-E10-01`

## Umsetzung

Erstellt wurden:

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Component-Contract-v2.md` | akzeptierter Architektur- und Component-Contract |
| `xtend-builder/typing/component-contract-v2.js` | generator-only Factory und Validator fuer Contract v2 |
| `tests/components/component_contract_v2_suite.js` | lokaler Gate fuer Contract Factory, Validator, Metadaten und Dokuanker |

Aktualisiert wurden:

- `package.json` mit `xtend.componentContractV2`
- `xtend-builder/scaffold.config.js` mit `componentContractV2`
- Epic 10 und Backlog mit abgeschlossenem `WP-E10-03`
- Referenzregister und Reference-Gate
- Test-Runner und Package Script fuer `component-contract-v2`

## Contract-Entscheidungen

Pflichtdomains fuer `xtend.component.contract.v2`:

- `source`
- `runtime`
- `publicApi`
- `rmt`
- `fabric`
- `telemetry`
- `lanes`
- `a11y`
- `performance`
- `tests`
- `docs`
- `maturity`

Die Lifecycle-Operationen fuer Fabric und Telemetry sind:

- `mount`
- `hydrate`
- `render`
- `update`
- `event`
- `error`
- `unmount`

Die Lane-Precedence bleibt:

1. `rmt.schedule-record`
2. `rmt.component-metadata`
3. `fabric.runtime-override`
4. `component.static-contract`
5. `scaffold.blueprint-default`

## Kernel Boundary

Der Contract v2 macht XTend-Komponenten RMT-authorbar, aber nicht RMT-kernelgebunden.

Verbindliche Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

Der RMT Kernel sieht Component Records, Adapter IDs, Schedule- und Metadata-Felder. XTend-spezifische Source, Custom Elements, `.d.ts`, `xstate`, XRouter und Fabric-Ausfuehrung bleiben Host-/Adapter-Verantwortung.

## Nicht umgesetzt in diesem Paket

- keine produktive Migration bestehender Komponenten
- keine TypeScript-Compiler-Einfuehrung
- keine RMT-App-DSL-Erweiterung
- keine Fabric Runtime-Aenderung
- keine vollstaendige Component-Contract-v2-Pflicht fuer alle bestehenden Komponenten

Diese Punkte folgen in `WP-E10-05`, `WP-E10-06`, `WP-E10-07`, `WP-E10-08` und `WP-E10-15`.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Component Contract v2 liegt vor | erfuellt: `development/XTend-Component-Contract-v2.md` |
| Contract ist maschinenlesbar angebunden | erfuellt: `xtend-builder/typing/component-contract-v2.js` |
| Public API, RMT, Fabric, Telemetry, Lanes, A11y und Performance sind Pflichtdomains | erfuellt |
| RMT Kernel Boundary ist sichtbar | erfuellt: `no-rmt-kernel-import-of-xtend-types` |
| Package- und Scaffold-Metadaten referenzieren Contract v2 | erfuellt |
| lokaler Gate ist vorhanden | erfuellt: `component-contract-v2` |

## Verifikation

Durchgefuehrte lokale Gates:

```bash
node --check xtend-builder/typing/component-contract-v2.js
node --check tests/components/component_contract_v2_suite.js
node --check scripts/run_xtend_tests.js
node --check xtend-builder/scaffold.config.js
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
```

Ergebnis: alle Gates bestanden.

## Ergebnis

`WP-E10-03` ist abgeschlossen. XTend besitzt nun einen Component Contract v2, der TypeScript Source, RMT Authoring, Fabric Boundary, Telemetry, Lanes/Fibers, A11y, Performance, Tests, Docs und Maturity als gemeinsame Plattformflaeche definiert.

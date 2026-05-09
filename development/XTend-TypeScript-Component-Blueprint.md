# XTend TypeScript Component Blueprint

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.scaffold.typescript-component-blueprint.v1`
- Workpackage: `WP-E10-07`
- Bezug:
  - `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/XTend-TypeScript-Component-Source-Strategie.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-Fabric-Component-Compatibility-v2.md`
  - `development/XTend-Component-Lifecycle-Telemetry-Contract.md`
  - `xtend-builder/blueprints/component-blueprint.contract.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/templates/registry.js`
  - `tests/builder/typescript_component_blueprint_suite.js`

## Zweck

Dieser Contract macht den `xtend-builder` fuer neue TypeScript-first Komponenten scaffoldbar. Der Builder bleibt ein Dry-Run- und Contract-Werkzeug, erzeugt aber ab jetzt alle Source-of-Truth-Artefakte, die spaeter fuer produktive TypeScript-Komponenten gebraucht werden.

Die Grenze bleibt verbindlich:

```text
no-rmt-kernel-import-of-xtend-types
```

RMT kann XTend-Komponenten planen und beschreiben. Der RMT Kernel importiert keine XTend-Komponenten, keine DOM APIs und keine Fabric Runtime.

## Artefaktmatrix

| Artefakt | Zielpfad | Pflicht | Zweck |
|----------|----------|---------|-------|
| `ts-source` | `src/components/<tag>/<tag>.ts` | ja | TypeScript Custom Element Source mit statischen Contracts |
| `ts-contract` | `src/components/<tag>/<tag>.contract.ts` | ja | Component Contract v2 als maschinenlesbarer Source-Artefakt |
| `ts-rmt` | `src/components/<tag>/<tag>.rmt.ts` | ja | RMT Component Metadata fuer `xtend.component` |
| `ts-a11y` | `src/components/<tag>/<tag>.a11y.ts` | ja | A11y Profil, Screenreader und Motion/Contrast Defaults |
| `ts-performance` | `src/components/<tag>/<tag>.performance.ts` | ja | Performance Profil, Budget Class, Lane und Hydration Policy |
| `ts-fixture` | `src/components/<tag>/<tag>.fixture.ts` | ja | typed Fixture Data fuer Tests, Component Lab und RMT Previews |

Die bisherigen Runtime- und Begleitartefakte bleiben erhalten:

- `component` -> `components/<tag>.js`
- `types` -> `components/<tag>.d.ts`
- `manifest` -> `components/manifest.json`
- `docs`, `tests`, `fixtures` und `demo`

## Template-IDs

| Template | Artefakt |
|----------|----------|
| `component.ts-source` | `ts-source` |
| `component.ts-contract` | `ts-contract` |
| `component.ts-rmt` | `ts-rmt` |
| `component.ts-a11y` | `ts-a11y` |
| `component.ts-performance` | `ts-performance` |
| `component.ts-fixture` | `ts-fixture` |

Alle Templates tragen `implemented-WP-E10-07` und liegen unter `xtend-builder/templates/component/`.

## Contract-Bindings

Der Blueprint verbindet diese bestehenden Contracts:

| Domain | Contract |
|--------|----------|
| Source Strategy | `xtend.typescript.component-source-strategy.v1` |
| Component Contract | `xtend.component.contract.v2` |
| RMT Component | `xtend.rmt.component-contract.v1` |
| Fabric Boundary | `xtend.component.fabric-boundary.v2` |
| Fabric/Lane Ingestion | `xtend.component.fabric-lane-ingestion.v2` |
| Lifecycle Telemetry | `xtend.component.lifecycle-telemetry.v1` |
| Fabric Snapshot | `xtend.fabric.telemetry-snapshot.v1` |
| A11y | `xtend.a11y.component-contract.v1` und `xtend.a11y.profile.v1` |
| Performance | `xtend.performance.component-profile.v1` |

## Generator-Ausgabe

`xtend-builder/generators/component-files.js` rendert neben den bisherigen Artefakten jetzt auch die TypeScript-Gruppe. Die Ausgabe enthaelt zusaetzlich:

- `wiring.componentContractV2`
- `wiring.componentContractV2Report`
- `wiring.typescript`
- RMT Component Metadata mit Schedule-, Hydration-, Fabric-, Telemetry-, A11y- und Performance-Sektion

Beispiel:

```bash
node xtend-builder/scaffold.js component-files --tag x-example --profile display --feature state --json
```

## Nicht-Ziele

- kein produktiver TypeScript Compiler
- keine automatische Datei-Ausgabe
- keine neuen Komponenten
- keine RMT Kernel-Kopplung an XTend-Typen
- kein Bundler- oder CDN-Pfad

## Gate

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
```

Der Gate prueft Blueprint, Template Registry, Template-Dateien, Plan-Aufloesung, Generator-Ausgabe, Package-Metadaten, Epic-/Backlog-Status und Reference Registry.

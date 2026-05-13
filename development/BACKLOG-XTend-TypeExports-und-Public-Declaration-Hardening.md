# Backlog - XTend TypeExports und Public Declaration Hardening

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.type-exports.backlog.v1`
- Zielzustand: `typed-public-package-surface`
- Folge auf:
  - `ER-WP-34` Public Component Types
  - `WP-E10-02` TypeScript Source und Build Strategie
  - `WP-SM-19` Surface Runtime Release Handoff
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`
- TypeExports Contract: `xtend.type-exports.plan.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js type-exports --json`

## Zweck

Dieses Backlog ueberfuehrt die TypeScript-Findings aus der Projektanalyse in startbare Workpackages. Die Public Components sind bereits sehr gut typisiert: fast alle `components/*.js` besitzen passende `components/*.d.ts`, und der Gate `component-public-types` deckt Event- und Element-Contracts ab.

Der verbleibende Type-Gap liegt nicht primaer bei Komponenten, sondern bei exportierten Framework-Modulen, Tooling-APIs, globalen Browser-Namespace-APIs und Package-Exports. Ziel ist deshalb keine Big-Bang-Portierung nach TypeScript, sondern ein deklarativer TypeExports-Hardening-Pfad: `.d.ts` fuer oeffentliche Entry Points, `package.json` `types`-Conditions, Gates gegen Drift und klare Priorisierung.

## Findings

| Bereich | Stand | Gap |
| --- | --- | --- |
| Public Components | fast vollstaendig `.d.ts`-abgedeckt | nur `components/prism.js` und `components/turndown.js` ohne Declaration, eher Vendor-/Utility-Grenze |
| Loader | `xtend-loader.js` ist Package-Root und Browser-Entry; `WP-TypeExports-02` liefert `xtend-loader.d.ts` und `xtend-dev.d.ts` | Loader-Gap geschlossen; Drift bleibt ueber `type-exports-loader` gatebar |
| Core API | `api.js` ist exportiert; `WP-TypeExports-03` liefert `api.d.ts` | Core-API-Gap geschlossen; Drift bleibt ueber `type-exports-api` gatebar |
| XTendRMT | `xtendrmt/rmt-core.d.ts` existiert; `WP-TypeExports-04` liefert RMT-Language-/Tooling-Facades | RMT-TypeExports-Gap geschlossen; Drift bleibt ueber `type-exports-rmt` gatebar |
| Fabric/A11y/Security | Module sind exportiert und programmatisch nutzbar; `WP-TypeExports-05` liefert Policy-Facades | Policy-Gap geschlossen; Drift bleibt ueber `type-exports-policy` gatebar |
| Builder/Scaffold | viele Contracts sind Node-API-faehig; `WP-TypeExports-06` liefert Builder-Facades | Builder-Gap geschlossen; Drift bleibt ueber `type-exports-builder` gatebar |
| Catalog | viele Catalog-Module sind exportiert; `WP-TypeExports-07` liefert Catalog-Facades | Catalog-Gap geschlossen; Drift bleibt ueber `type-exports-catalog` gatebar |
| Package Exports | sehr breite Export Surface; WP-TypeExports-02 bis -08 liefern die Declaration-Packs | produktives Drift-Handoff noch offen |

## Leitplanken

- Declarations beschreiben bestehende JS-Runtime. Sie duerfen keine neue Runtime-Abhaengigkeit einfuehren.
- Package-Exports muessen Consumer-Types liefern, ohne Browser-Bundles oder Loader-Verhalten zu veraendern.
- RMT-Kernel bleibt typfrei gegenueber XTend UI: keine XTend-Typen als Runtime-Import im Kernel.
- Typisierung darf Vendor-Dateien wie Prism/Turndown nur als Rand-Facade behandeln.
- Neue Type-Gates pruefen Drift zwischen `package.json`, `.d.ts`, Docs und existierenden JS-Exports.

## Priorisierungslogik

- `P0`: oeffentliche Package-Entry-Points, Root-Loader, Core API, Package `types`-Conditions
- `P1`: programmatische Integrations-APIs fuer RMT-Tooling, Fabric, A11y und Security
- `P2`: Catalog-, Builder-, Vendor- und Komfort-Typisierung

## Statuslogik

- `ready`: kann sofort gestartet werden
- `planned`: sinnvoll, aber nach einem P0/P1-Vorgaenger
- `blocked`: benoetigt Tooling- oder Export-Entscheidung
- `completed`: Zielartefakt ist erstellt und gatebar

## Naechste startbare Workpackages

| ID | Grund |
| --- | --- |
| - | Keine offenen TypeExports-Workpackages |

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
| --- | --- | --- | --- | --- | --- |
| `WP-TypeExports-01` | P0 | completed | WS1 | Public Package Entry Points und `types`-Conditions haerten | `ER-WP-34` |
| `WP-TypeExports-02` | P0 | completed | WS1 | XTendLoader, StyleRegistry und SkeletonLoader typisieren | `WP-TypeExports-01` |
| `WP-TypeExports-03` | P0 | completed | WS1 | `api.js` und `window.XTend.*` Namespace typisieren | `WP-TypeExports-01` |
| `WP-TypeExports-04` | P1 | completed | WS2 | XTendRMT Runtime-, Browser- und RMT-Language-Exports typisieren | `WP-TypeExports-01` |
| `WP-TypeExports-05` | P1 | completed | WS3 | Fabric-, A11y- und Security-Policy-APIs typisieren | `WP-TypeExports-01` |
| `WP-TypeExports-06` | P1 | completed | WS4 | Builder-, Scaffold- und Component-Lab-Programm-APIs typisieren | `WP-TypeExports-01` |
| `WP-TypeExports-07` | P2 | completed | WS5 | Catalog Declaration Pattern fuer Plan-/Report-Module einfuehren | `WP-TypeExports-01` |
| `WP-TypeExports-08` | P2 | completed | WS6 | Vendor-/Utility-Facades fuer Prism, Turndown und Design Tokens ergaenzen | `WP-TypeExports-01` |
| `WP-TypeExports-09` | P1 | completed | WS7 | TypeExports Gate, Drift-Report und Docs-Handoff produktisieren | `WP-TypeExports-01` bis `WP-TypeExports-08` |

## Workstreams

| Workstream | Zweck |
| --- | --- |
| WS1 | Public Package Entry Points und globale Browser APIs |
| WS2 | XTendRMT und RMT-Language Programmatic API |
| WS3 | Fabric, A11y, Security und Policy-Contracts |
| WS4 | Builder, Scaffold, Component Lab und Developer Workflow APIs |
| WS5 | Catalog- und Release-Plan-Module |
| WS6 | Vendor-/Utility-Grenzen und Design Token Facades |
| WS7 | TypeExports Gate, Docs und Package-Handoff |

## Workpackages im Detail

### WP-TypeExports-01 - Public Package Entry Points und `types`-Conditions haerten

- Prioritaet: `P0`
- Status: `ready`
- Ziel:
  - Alle oeffentlichen Package Entry Points liefern TypeScript-Declarations oder bewusst dokumentierte `types-not-exported` Boundaries.
- Scope:
  - `package.json` Export-Matrix analysieren
  - `types`-Conditions fuer Root, Loader, API, RMT, Builder, Fabric, Security, A11y und Component-Exports vorbereiten
  - Drift zwischen JS-Export und `.d.ts` sichtbar machen
  - Package-Export-Lock um TypeExports-Kriterien erweitern
- Zielartefakte:
  - TypeExports Plan/Catalog
  - Package `types`-Condition-Matrix
  - lokaler Gate fuer fehlende Declarations
- Ergebnis:
  - `catalog/type-exports.js`
  - `tests/types/type_exports_suite.js`
  - `docs/type-exports.md`
  - `development/WP-TypeExports-01-Public-Package-Entry-Points-und-types-Conditions-haerten.md`
  - `package.json#xtend.typeExports`
  - `node scripts/run_xtend_tests.js type-exports --json`
- Definition of Done:
  - alle Public Exports sind klassifiziert
  - P0-Exports haben `types`-Pfad oder begruendete Ausnahme
  - lokaler Gate schlaegt bei neuem untypisierten Public Export fehl

### WP-TypeExports-02 - XTendLoader, StyleRegistry und SkeletonLoader typisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `xtend-loader.d.ts` beschreibt die offizielle Loader-Oberflaeche.
- Scope:
  - `window.XTendLoader`
  - `window.XTendStyleRegistry`
  - `window.XTendSkeletonLoader`
  - Loader Diagnostics und Performance Events
  - `ensureComponent`, `hydrateTree`, `showSkeleton`, `hideSkeleton`, `ensureRuntimeStyles`, `defineComponentStyle`, `adoptStyle`
- Zielartefakte:
  - `xtend-loader.d.ts`
  - Loader Type Docs
  - Gate gegen Runtime-/Declaration-Drift
- Ergebnis:
  - `xtend-loader.d.ts`
  - `xtend-dev.d.ts`
  - `catalog/type-exports-loader.js`
  - `tests/types/loader_type_exports_suite.js`
  - `docs/xtend-loader-types.md`
  - `development/WP-TypeExports-02-XTendLoader-StyleRegistry-und-SkeletonLoader-typisieren.md`
  - `node scripts/run_xtend_tests.js type-exports-loader --json`
- Definition of Done:
  - Loader-Consumer koennen Skeleton-/Hydration-/StyleRegistry-APIs typisiert nutzen
  - keine Veraenderung am Loader-Bootpfad
  - `xtend.css` bleibt optionales Theme-Artefakt, nicht Type-Abhaengigkeit

### WP-TypeExports-03 - `api.js` und `window.XTend.*` Namespace typisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Die Core API und globale XTend-Komfortoberflaeche werden fuer App-Code typisiert.
- Scope:
  - `initXTendAPI(manifest)`
  - `window.XTend.compliance`
  - `window.XTend.theme`
  - `window.XTend.toast`
  - `window.XTend.alert`
  - `window.XTend.dialog`
  - `window.XTend.modal`
  - `xtend-api-ready` Event Detail
- Zielartefakte:
  - `api.d.ts`
  - globale `Window`-Augmentations
  - API-Type smoke fixture
- Ergebnis:
  - `api.d.ts`
  - `catalog/type-exports-api.js`
  - `tests/types/api_type_exports_suite.js`
  - `docs/xtend-api-types.md`
  - `development/WP-TypeExports-03-api-js-und-window-XTend-Namespace-typisieren.md`
  - `node scripts/run_xtend_tests.js type-exports-api --json`
- Definition of Done:
  - App-Code kann `initXTendAPI` und `window.XTend.*` ohne `any` nutzen
  - bestehende globale Legacy-Aliase bleiben typisiert dokumentiert

### WP-TypeExports-04 - XTendRMT Runtime-, Browser- und RMT-Language-Exports typisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - RMT Runtime und RMT-Language Tooling sind fuer Integrationen typisiert importierbar.
- Scope:
  - `./rmt` und `./rmt/browser` auf `xtendrmt/rmt-core.d.ts` oder spezialisierte Declarations mappen
  - `tools/rmt-language/source-model.d.ts`
  - `parser`, `vnext-parser`, `vnext-compiler`, `semantic-graph`, `diagnostics`, `completions`, `hover`, `symbols`, `definitions`, `code-actions`
  - LSP-/Editor-Protokolltypen
- Zielartefakte:
  - RMT-Language Declaration Set
  - Package `types`-Conditions fuer `./rmt-language/*`
  - Tooling Type Gate
- Ergebnis:
  - `xtendrmt/rmt-core.d.ts` ist Type-Ziel fuer `./rmt` und `./rmt/browser`
  - `tools/rmt-language/rmt-tooling-public-types.d.ts`
  - RMT-Language-, LSP-, Linter- und Editor-Facades unter `tools/**/*.d.ts`
  - `catalog/type-exports-rmt.js`
  - `tests/types/rmt_type_exports_suite.js`
  - `docs/xtend-rmt-types.md`
  - `development/WP-TypeExports-04-XTendRMT-Runtime-Browser-und-RMT-Language-Exports-typisieren.md`
  - `node scripts/run_xtend_tests.js type-exports-rmt --json`
- Definition of Done:
  - Programmatic RMT-Tooling-Consumer erhalten stabile Return-/Diagnostic-/Edit-Typen
  - RMT-Kernel importiert weiterhin keine XTend-UI-Typen zur Laufzeit

### WP-TypeExports-05 - Fabric-, A11y- und Security-Policy-APIs typisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Policy- und Integrationsmodule sind typisiert nutzbar.
- Scope:
  - `fabric/xtend-fabric.d.ts`
  - `fabric/rmt-lane-mapping.d.ts`
  - `fabric/hydration-policy.d.ts`
  - `a11y/screenreader-signals.d.ts`
  - `a11y/motion-contrast-policy.d.ts`
  - `a11y/runtime-a11y-contract.d.ts`
  - `security/manifest-import-policy.d.ts`
  - `security/trusted-dom-policy.d.ts`
  - `security/supply-chain-gate-policy.d.ts`
- Zielartefakte:
  - Policy Declaration Pack
  - Diagnostics-/Report-Typen
  - Fabric/A11y/Security Type Gate
- Ergebnis:
  - `fabric/xtend-policy-public-types.d.ts`
  - `fabric/xtend-fabric.d.ts`
  - `fabric/rmt-lane-mapping.d.ts`
  - `fabric/hydration-policy.d.ts`
  - `a11y/screenreader-signals.d.ts`
  - `a11y/motion-contrast-policy.d.ts`
  - `a11y/runtime-a11y-contract.d.ts`
  - `security/manifest-import-policy.d.ts`
  - `security/trusted-dom-policy.d.ts`
  - `security/supply-chain-gate-policy.d.ts`
  - `catalog/type-exports-policy.js`
  - `tests/types/policy_type_exports_suite.js`
  - `docs/xtend-policy-types.md`
  - `development/WP-TypeExports-05-Fabric-A11y-und-Security-Policy-APIs-typisieren.md`
  - `node scripts/run_xtend_tests.js type-exports-policy --json`
- Definition of Done:
  - Host-Integrationen koennen Policies, Reports und Diagnostics ohne untyped JS-Contracts konsumieren
  - keine Policy fuehrt Runtime-Abhaengigkeiten in Komponenten oder RMT-Kernel ein

### WP-TypeExports-06 - Builder-, Scaffold- und Component-Lab-Programm-APIs typisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - XTend Builder APIs werden fuer Tooling-Consumer typisiert.
- Scope:
  - `xtend-builder/scaffold.d.ts`
  - Generator APIs fuer Component Plan und Component Files
  - Blueprint Contracts
  - Component Lab Preview APIs
  - Typing Contract Generatoren
  - Developer Workflow und Verify Plan
- Zielartefakte:
  - Builder Declaration Pack
  - Builder API Docs
  - Scaffold Type Gate
- Ergebnis:
  - `xtend-builder/builder-public-types.d.ts`
  - `xtend-builder/scaffold.d.ts`
  - `xtend-builder/lib/cli.d.ts`
  - `xtend-builder/blueprints/component-blueprint.contract.d.ts`
  - `xtend-builder/generators/component-plan.d.ts`
  - `xtend-builder/generators/component-files.d.ts`
  - `xtend-builder/generators/registry.d.ts`
  - `xtend-builder/preview/component-lab.d.ts`
  - `xtend-builder/preview/component-lab-ux-inspector.d.ts`
  - `xtend-builder/workflows/developer-workflow.d.ts`
  - `xtend-builder/typing/**/*.d.ts`
  - `catalog/type-exports-builder.js`
  - `tests/types/builder_type_exports_suite.js`
  - `docs/xtend-builder-types.md`
  - `development/WP-TypeExports-06-Builder-Scaffold-und-Component-Lab-Programm-APIs-typisieren.md`
  - `node scripts/run_xtend_tests.js type-exports-builder --json`
- Definition of Done:
  - externe oder interne Builder-Aufrufer koennen Generatoren typisiert nutzen
  - CLI bleibt kompatibel und muss nicht nach TypeScript portiert werden

### WP-TypeExports-07 - Catalog Declaration Pattern fuer Plan-/Report-Module einfuehren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Catalog-Module erhalten ein generisches, wartbares Declaration-Pattern.
- Scope:
  - gemeinsame Typen fuer `createPlan`, `validatePlan`, `createReport`
  - Schema-Konstanten und Statusfelder
  - SurfaceManager-Catalogs, Epic-Catalogs und Release-Catalogs klassifizieren
  - keine manuelle Volltypisierung jeder einzelnen Property, wenn ein Basistyp reicht
- Zielartefakte:
  - `catalog/catalog-public-types.d.ts`
  - `.d.ts` fuer alle oeffentlichen Catalog Package Exports
  - `.d.ts` fuer interne SurfaceManager-Catalogs
  - `catalog/type-exports-catalog.js`
  - `tests/types/catalog_type_exports_suite.js`
  - `docs/xtend-catalog-types.md`
  - `development/WP-TypeExports-07-Catalog-Declaration-Pattern-fuer-Plan-und-Report-Module-einfuehren.md`
  - `node scripts/run_xtend_tests.js type-exports-catalog --json`
- Definition of Done:
  - neue Catalog-Module koennen ohne Copy-Paste-Typwucher typisiert werden
  - Report-/Validation-Shape ist fuer Tests und Tools stabil

### WP-TypeExports-08 - Vendor-/Utility-Facades fuer Prism, Turndown und Design Tokens ergaenzen

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - verbleibende Randmodule erhalten leichte Facade-Typen.
- Scope:
  - `components/prism.d.ts`
  - `components/turndown.d.ts`
  - `design-tokens/xtend-design-tokens.d.ts`
  - Theme JSON Import-/Export-Hinweise
- Zielartefakte:
  - Vendor Facade Declarations
  - Design Token Declaration
  - Dokumentierte Nicht-Ziele fuer Vendor-Interna
  - `catalog/type-exports-vendor.js`
  - `tests/types/vendor_type_exports_suite.js`
  - `docs/xtend-vendor-types.md`
  - `development/WP-TypeExports-08-Vendor-Utility-Facades-fuer-Prism-Turndown-und-Design-Tokens-ergaenzen.md`
  - `node scripts/run_xtend_tests.js type-exports-vendor --json`
- Definition of Done:
  - Komponentenverzeichnis hat keinen unbegruendeten `.js` ohne Type-Facade-Gap mehr
  - Vendor-Facades bleiben schmal und kopieren keine fremden Typwelten

### WP-TypeExports-09 - TypeExports Gate, Drift-Report und Docs-Handoff produktisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - TypeExports werden dauerhaft als Release-Qualitaetskriterium pruefbar.
- Scope:
  - lokaler Gate `type-exports`
  - Drift-Report fuer `exports` -> `.d.ts`
  - Docs Update in `docs/public-component-types.md`, `docs/typescript-components.md` und Package Export Strategie
  - Package-Metadaten fuer TypeExports
  - Release-Handoff an Package Export Lock
- Zielartefakte:
  - `catalog/type-exports.js`
  - `tests/types/type_exports_suite.js`
  - `docs/type-exports.md`
  - `.xtend-test-results/xtend-type-exports-report.json`
- Ergebnis:
  - `catalog/type-exports.js` erzeugt nun einen Drift-Report mit `xtend.type-exports.drift-report.v1`
  - `tests/types/type_exports_suite.js` prueft Declaration Drift, Package `types`-Condition Drift, Release-Gate-Bundle und Artifact-Checklist
  - `docs/type-exports.md`, `docs/public-component-types.md`, `docs/typescript-components.md` und `docs/package-export-lock.md` dokumentieren den produktiven Handoff
  - `package.json#xtend.typeExports` markiert `WP-TypeExports-09` als abgeschlossen und enthaelt das Release-Gate `npm run test:type-exports:release`
  - `development/WP-TypeExports-09-TypeExports-Gate-Drift-Report-und-Docs-Handoff-produktisieren.md`
  - `node scripts/run_xtend_tests.js type-exports --json`
- Definition of Done:
  - neue Public Exports ohne Type-Entscheidung schlagen lokal fehl
  - P0/P1 Declaration Packs sind in Docs und Package-Metadaten sichtbar
  - Release Owner sieht TypeExports als eigenes Artefakt im Handoff

## Empfohlene Sequenz

1. `WP-TypeExports-01`
2. `WP-TypeExports-02`
3. `WP-TypeExports-03`
4. `WP-TypeExports-04`
5. `WP-TypeExports-05`
6. `WP-TypeExports-06`
7. `WP-TypeExports-07`
8. `WP-TypeExports-08`
9. `WP-TypeExports-09`

Die Sequenz ist absichtlich types-only. Eine spaetere echte TS-Portierung einzelner JS-Module sollte erst nach dem TypeExports-Gate entschieden werden.

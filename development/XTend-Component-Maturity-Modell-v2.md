# XTend Component Maturity Modell v2

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.maturity-model.v2`
- Workpackage: `WP-E10-01`
- Bezug:
  - `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-Component-Fiber-Instrumentierung.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `docs/component-catalog-coverage.md`
  - `components/manifest.json`

## Zweck

Dieses Modell definiert die Reifegrade fuer XTend-Komponenten ab Epic 10. Es erweitert die bisherige Catalog-Coverage-Sicht um TypeScript Source, RMT First-Class Metadata, Fabric-Kompatibilitaet, Telemetry, Fiber/Lane-Ingestion, A11y, Performance und Release-Faehigkeit.

Das Modell ist bewusst produktorientiert: Eine Komponente ist nicht deshalb reif, weil sie im Browser rendert. Sie ist reif, wenn sie authorbar, testbar, typisiert, schedulable, beobachtbar, barrierearm und releasefaehig ist.

## Reifegrade

| Maturity | Bedeutung | Einsatz |
|----------|-----------|---------|
| `experimental` | lauffaehiger Spike oder Prototyp mit klarer Nicht-Stabilitaet | Forschung, interne Exploration |
| `preview` | nutzbare Komponente mit dokumentiertem Contract, aber noch nicht vollstaendig enterprise-gatebar | fruehe App-Integration und Feedback |
| `stable` | produktiv nutzbare Komponente mit TypeScript-/Types-, RMT-, Fabric-, A11y-, Performance-, Docs- und Testabdeckung | Default fuer Enterprise-Apps |
| `core` | stabile, infrastrukturnahe oder breit kritische Komponente mit verschärften Compatibility- und Regression-Gates | Loader-, Router-, State-, Form-, Overlay- oder App-Shell-Pfade |
| `deprecated` | bewusst abgeloeste Komponente oder API-Flaeche mit Migrationspfad | Bestandsschutz und kontrollierte Entfernung |

## Mindestanforderungen je Reifegrad

| Dimension | `experimental` | `preview` | `stable` | `core` |
|-----------|----------------|-----------|----------|--------|
| Source | lokale Source | lokale Source | TypeScript-first oder akzeptierter JS-Migrationsvertrag | TypeScript-first oder dokumentierter Core-Ausnahmevertrag |
| Runtime | lokales ESM | lokales ESM | lokales ESM mit Manifest-Eintrag | lokales ESM mit Compatibility-Gate |
| Types | optional | `.d.ts` oder typed Contract Stub | vollstaendige Public Types und Event Payloads | vollstaendige Public Types mit Compatibility-Pruefung |
| RMT | optionaler Beispielrecord | RMT Component Metadata Stub | vollstaendige RMT Metadata fuer Props, Slots, Events, Hydration und Schedule | vollstaendige RMT Metadata plus Route/App-Shell-Relevanz falls zutreffend |
| Fabric | optional | Lifecycle-Hook geplant | Mount/Hydrate/Render/Event/Error Boundary vorhanden | Fabric Boundary und Diagnostics regression-gatebar |
| Telemetry | optional | Messpunkte geplant | Lifecycle Measurements und Snapshot-Anschluss vorhanden | Measurements mit Budget- und Backpressure-Handoff |
| Lanes/Fibers | optional | Default-Lane dokumentiert | Lane/Fiber-Ingestion aus RMT oder Fabric dokumentiert | deterministische Precedence und Conflict Diagnostics |
| A11y | keine Garantie | Grundsemantik dokumentiert | A11y Contract, Keyboard und Screenreader-Signale erfuellt | A11y Regression in Kernflows |
| Performance | keine Garantie | Budgetklasse geplant | Performance-Profil und Budget vorhanden | Regression-Budget und kritische Phase messbar |
| Tests | Smoke oder Syntax | Component Suite Stub | Component Suite, Fixture, Browser/A11y/Performance-Anschluss | schnelle und volle Regression-Gates |
| Docs | optional | Component Docs vorhanden | Docs, API, Events, RMT und A11y dokumentiert | Migration, Compatibility und App-Authoring dokumentiert |

## Pflichtartefakte fuer `stable`

Eine `stable` Komponente benoetigt:

- Source und lokales ESM-Artefakt
- Manifest-Eintrag in `components/manifest.json`
- Public Type Contract
- Component Contract v2
- RMT Component Metadata
- Fabric Lifecycle Boundary
- Telemetry Measurement Mapping
- Lane/Fiber Metadata oder Ingestion-Regeln
- A11y Profile
- Performance Profile
- Component-Level Suite
- Browser- oder Fixture-Smoke
- Docs unter `docs/components/`
- Reference- oder Catalog-Gate-Anschluss

## Pflichtartefakte fuer `core`

Eine `core` Komponente erfuellt alle `stable` Anforderungen und zusaetzlich:

- explizite Compatibility Policy
- Migration- und Deprecation-Regeln
- schnelle PR-Gate-Abdeckung
- volle Release-Gate-Abdeckung
- RMT-First-Class Authoring-Beispiel
- Fabric Diagnostics in Fehlerfaellen
- Performance-Budget fuer kritische Lifecycle-Phasen
- A11y-Regression fuer Keyboard, Fokus und Screenreader, falls interaktiv

## Component Contract v2 Abnahmeformat

Jede Komponente soll perspektivisch gegen dieses Abnahmeformat auswertbar sein:

```json
{
  "schema": "xtend.component.maturity-report.v2",
  "tag": "x-select",
  "maturity": "stable",
  "source": {
    "typescript": true,
    "esm": true,
    "manifest": true
  },
  "contracts": {
    "publicTypes": true,
    "componentContractV2": true,
    "rmtMetadata": true,
    "fabric": true,
    "a11y": true,
    "performance": true
  },
  "runtime": {
    "fabricBoundary": true,
    "telemetry": true,
    "laneIngestion": true,
    "fiberMapping": true
  },
  "tests": {
    "componentSuite": true,
    "fixture": true,
    "browserSmoke": true,
    "a11y": true,
    "performance": true
  },
  "docs": {
    "componentGuide": true,
    "rmtAuthoring": true,
    "events": true,
    "a11y": true
  }
}
```

## Maturity Precedence

Die Reife einer Komponente wird durch die niedrigste kritische Pflichtdimension begrenzt.

Beispiele:

- Eine Komponente mit guter UI, aber ohne RMT Metadata, ist hoechstens `preview`.
- Eine TypeScript-Komponente ohne A11y-Contract ist hoechstens `preview`.
- Eine Komponente mit RMT Metadata, aber ohne Fabric Boundary, ist hoechstens `preview`.
- Eine produktive Form- oder Overlay-Komponente ohne Keyboard-Smoke ist nicht `stable`.
- Eine infrastrukturnahe Komponente ohne Compatibility Policy ist nicht `core`.

## Lane- und Fiber-Ingestion-Regeln

Epic 10 fuehrt keine isolierte Component-Lane-Logik ein. Komponenten nehmen Lane- und Fiber-Informationen aus bestehenden Plattformquellen auf.

Precedence-Zielmodell:

| Prioritaet | Quelle | Bedeutung |
|------------|--------|-----------|
| 1 | expliziter RMT Schedule Record | App-Authoring entscheidet fuer konkreten Einsatz |
| 2 | RMT Component Metadata | komponentennahe Default-Absicht |
| 3 | Fabric Runtime Override | Host- oder Enterprise-Policy |
| 4 | Component Static Metadata | sichere Default-Werte |
| 5 | Scaffold Blueprint Defaults | Fallback fuer neue Komponenten |

Konflikte werden nicht stillschweigend ignoriert. Sie muessen als Fabric/RMT Diagnostics sichtbar werden.

## Reifeziel fuer Epic 10

Epic 10 soll folgende Mindestziele erreichen:

| Bereich | Ziel |
|---------|------|
| neue P0-Komponenten | mindestens `stable`, bewusst begruendete Ausnahmen `preview` |
| bestehende priorisierte Komponenten | RMT/Fabric Metadata mindestens `preview`, Kernpfade schrittweise `stable` |
| `x-router`, `x-link`, `x-input`, `x-form`, `x-modal`, `x-dialog` | Zielstatus `core` oder dokumentierter Core-Ausnahmevertrag |
| Component Lab und RMT Inspector | mindestens `preview` |
| RMT-first Demo-App | Gatebar und als Referenz fuer App Authoring nutzbar |

## Verifikation

Initiale Gates fuer das Modell:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
```

Spaetere Workpackages sollen daraus dedizierte Gates ableiten:

- `component-contract-v2`
- `component-maturity`
- `rmt-first-app-authoring`
- `fabric-component-compatibility`
- `typescript-component-blueprint`

## Handoff

Dieses Modell ist der Startcontract fuer:

- `WP-E10-02` TypeScript Source- und Build-Strategie
- `WP-E10-03` Component Contract v2
- `WP-E10-05` Fabric/Lane-Ingestion
- `WP-E10-07` TypeScript Blueprint
- `WP-E10-08` P0-Komponentenwelle
- `WP-E10-15` neue Gates

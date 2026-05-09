# WP-E10-01 - Epic-10-Backlog und Component-Maturity-Modell anlegen

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Backlog: `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Contract: `xtend.epic10.wp01.backlog-and-maturity.v1`
- Bezug:
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `development/XTend-Component-Catalog-Naming-Konvention.md`
  - `development/XTend-Component-Fiber-Instrumentierung.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `docs/component-catalog-coverage.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E10-01` macht Epic 10 startbar. Das Paket zerlegt den Epic in konkrete Workpackages und legt ein Component-Maturity-Modell v2 fest, das als gemeinsame Abnahmebasis fuer TypeScript-first Komponenten, RMT First-Class Support, Fabric-Kompatibilitaet, Telemetry, Fibers, Lanes, A11y und Performance dient.

Das Paket erzeugt bewusst noch keine neue Komponente. Es verhindert, dass die naechste Komponentenwelle ohne einheitliche Plattformregeln startet.

## Ausgangslage

Epic 10 wurde als naechster Produktreife-Epic angelegt. Die vorhandene Enterprise-Reife-Arbeit hat bereits wichtige Einzelcontracts geschaffen:

- Component Catalog Coverage
- Public Types und Event Contracts
- Fabric Runtime, Diagnostics und Reporter
- Fibers und Lanes
- RMT Lane Mapping
- Component Mount/Hydration Instrumentierung
- Telemetry Snapshots
- Performance Budget Matrix
- A11y Component Contract
- Browser-, A11y- und Reference-Gates

Diese Bausteine waren bisher stark, aber noch nicht als ein einheitliches Reife- und Abnahmeformat fuer neue Komponenten zusammengefuehrt. Genau diese Luecke schliesst `WP-E10-01`.

## Backlog-Entscheidung

Epic 10 wird in 16 Workpackages zerlegt.

Die Startlogik lautet:

- `WP-E10-02`, `WP-E10-03` und `WP-E10-04` sind die naechsten startbaren Fundamentpakete.
- `WP-E10-05`, `WP-E10-06` und `WP-E10-07` bauen auf diesen Fundamenten auf.
- die P0-Komponentenwelle startet erst nach TypeScript-, Component-Contract- und Builder-Entscheidung.
- die RMT-first Demo-App folgt erst, wenn Authoring Contract, Adapter/Fabric-Ingestion und erste Referenzkomponenten bereitstehen.

Damit bleibt der Epic phasenfaehig:

| Phase | Zweck |
|-------|-------|
| WS0 | Backlog und Maturity |
| WS1 | TypeScript und Component Contract |
| WS2 | RMT-first App Authoring |
| WS3 | Fabric, Telemetry, Lanes und Fibers |
| WS4 | Component Catalog Ausbau |
| WS5 | Tooling und Developer Experience |
| WS6 | Regression, Docs und Handoff |

## Component-Maturity-Entscheidung

Das neue Modell `xtend.component.maturity-model.v2` wird akzeptiert.

Die Reifegrade sind:

- `experimental`
- `preview`
- `stable`
- `core`
- `deprecated`

Wichtige Entscheidung:

Eine Komponente ist ab Epic 10 nicht mehr allein durch Source, Docs und einfache Component-Suite reif. `stable` setzt zusaetzlich TypeScript- oder akzeptierten Migrationsvertrag, Public Types, RMT Metadata, Fabric Boundary, Telemetry-Anschluss, Lane/Fiber-Regeln, A11y-Profil, Performance-Profil, Tests und Docs voraus.

`core` verschaerft diese Anforderungen fuer zentrale Infrastruktur-, Routing-, Form-, Overlay- und App-Shell-Pfade.

## Startbare Folgepakete

### WP-E10-02

`WP-E10-02` darf sofort starten und entscheidet TypeScript Source, Build, ESM Output und Migration Guard fuer bestehende JavaScript-Komponenten.

### WP-E10-03

`WP-E10-03` darf sofort starten und definiert Component Contract v2 fuer TypeScript, RMT, Fabric, A11y, Performance, Types und Events.

### WP-E10-04

`WP-E10-04` darf sofort starten und beschreibt, wie vollstaendige XTend-Apps in RMT authored werden.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Backlog liegt vor | erfuellt: `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md` |
| Maturity-Modell v2 liegt vor | erfuellt: `development/XTend-Component-Maturity-Modell-v2.md` |
| Workpackages sind priorisiert | erfuellt: `WP-E10-01` bis `WP-E10-16` mit P0/P1/P2 |
| naechste Pakete sind startbar | erfuellt: `WP-E10-02`, `WP-E10-03`, `WP-E10-04` |
| TypeScript-, RMT-, Fabric-, A11y- und Performance-Pflichten sind sichtbar | erfuellt |
| keine RMT-Kernelkopplung an XTend | erfuellt: RMT bleibt Adapter-/Metadata-Pfad |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E10-01` ist abgeschlossen. Epic 10 besitzt ein startbares Backlog, ein akzeptiertes Component-Maturity-Modell v2 und eine klare Folge-Sequenz fuer TypeScript Source, Component Contract v2 und RMT-first App Authoring.

# XTend TypeScript Component Source Strategie

- Status: Accepted
- Datum: 7. Mai 2026
- Typ: Architekturentscheidung / Build- und Source-Contract
- Contract: `xtend.typescript.component-source-strategy.v1`
- Workpackage: `development/WP-E10-02-TypeScript-Source-und-Build-Strategie-entscheiden.md`
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Bezug:
  - `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/XTend-Component-Maturity-Modell-v2.md`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `xtend-builder/scaffold.config.js`
  - `package.json`

## Entscheidung

Neue XTend-Komponenten werden ab Epic 10 TypeScript-first geplant und gebaut. Die Browser-Runtime bleibt weiterhin lokales ESM unter `components/`, geladen ueber `xtend-loader.js` und `components/manifest.json`.

TypeScript ist damit Source, nicht Runtime-Zwang. Produktive Browser-Artefakte bleiben `.js` und `.d.ts`; bestehende JavaScript-Komponenten bleiben lauffaehig und werden nicht per Big-Bang migriert.

Der akzeptierte Zielpfad lautet:

```text
src/
  components/
    x-select/
      x-select.ts
      x-select.contract.ts
      x-select.rmt.ts
      x-select.a11y.ts
      x-select.performance.ts
      x-select.fixture.ts
components/
  xselect.js
  xselect.d.ts
```

## Grundsaetze

- TypeScript ist fuehrender Source-Pfad fuer neue Komponenten.
- ESM bleibt das einzige Browser-Runtime-Format fuer Core-Komponenten.
- `components/*.js` sind fuer TypeScript-first Komponenten Build-Artefakte.
- `components/*.d.ts` bleiben der Public-Type-Contract fuer Host-Apps.
- `components/manifest.json` bleibt der Loader- und Discovery-Contract.
- RMT-, Fabric-, A11y- und Performance-Metadaten werden source-nah gepflegt und spaeter build- oder scaffoldseitig in Artefakte ueberfuehrt.
- Core-Komponenten bekommen keine CDN-, Cloud-, Bundler- oder Runtime-Dependency-Pflicht.
- XTendRMT bleibt framework-agnostisch; TypeScript-Contracts duerfen nicht in den RMT Kernel importiert werden.

## Source- und Artefaktrollen

| Pfad | Rolle | Status |
|------|-------|--------|
| `src/components/<tag>/<tag>.ts` | fuehrende Implementierung neuer Komponenten | Source |
| `src/components/<tag>/<tag>.contract.ts` | Component Contract v2 fuer Props, Attributes, Slots, Events, State und Theme | Source |
| `src/components/<tag>/<tag>.rmt.ts` | RMT Component Metadata, Adapter- und Authoring-Hints | Source |
| `src/components/<tag>/<tag>.a11y.ts` | A11y-Profil, Screenreader-Signale, Fokus- und Keyboard-Regeln | Source |
| `src/components/<tag>/<tag>.performance.ts` | Performance-Profil, Hydration Policy, Budget-Klasse und Messpunkte | Source |
| `src/components/<tag>/<tag>.fixture.ts` | typed Test- und Demo-Fixture-Daten | Source |
| `components/<basename>.js` | lokales ESM Runtime-Artefakt fuer Browser | Artefakt |
| `components/<basename>.d.ts` | Public Type Contract fuer Host-Apps | Artefakt |
| `components/manifest.json` | Loader-, Catalog- und Metadata-Discovery | Artefakt / Registry |
| `docs/components/<name>.md` | Entwicklerdokumentation | Artefakt / Review-Dokument |
| `tests/components/<tag>.component_suite.js` | lokaler Component Gate | Artefakt / Gate |

`<basename>` folgt weiterhin der bestehenden Manifest-Konvention ohne Bindestrich, also zum Beispiel `x-select` -> `xselect.js`. Diese Entscheidung verhindert Loader-Drift und schuetzt bestehende Manifest- und Browserpfade.

## Build-Strategie

Epic 10 fuehrt mit `WP-E10-02` noch keinen produktiven TypeScript Build ein. Das Paket entscheidet den Zielvertrag, den `WP-E10-07` im `xtend-builder` als Blueprint und Build-Plan operationalisiert.

Der Build-Contract lautet:

| Feld | Entscheidung |
|------|--------------|
| Contract | `xtend.typescript.component-source-strategy.v1` |
| Build Mode | `ts-source-to-local-esm-artifacts` |
| Runtime Format | `esm` |
| Source Root | `src/components/` |
| Runtime Output Root | `components/` |
| Declaration Output Root | `components/` |
| Core Bundler Policy | `no-bundler-required-for-core-components` |
| Runtime Dependency Policy | `no-new-runtime-dependencies` |
| Network Policy | `no-cdn-no-remote-runtime-imports` |
| Migration Policy | `new-components-typescript-first-existing-js-incremental` |

Der spaetere lokale Build darf einen TypeScript-Compiler nutzen, aber keine Browser-Runtime-Abhaengigkeit einfuehren. Ein Bundler ist fuer Core-Komponenten nicht Pflicht und darf hoechstens als optionaler App-Host- oder Lab-Pfad eingefuehrt werden.

Der erwartete Build-Ablauf:

1. TypeScript Source unter `src/components/<tag>/` lesen.
2. Component Contract v2, RMT Metadata, A11y-Profil und Performance-Profil validieren.
3. ESM-Artefakt fuer `components/<basename>.js` erzeugen.
4. Public Types fuer `components/<basename>.d.ts` erzeugen oder validieren.
5. Manifest-Patch-Plan erzeugen, aber produktive Manifest-Aenderungen reviewbar halten.
6. Component-, A11y-, Performance-, RMT-Compatibility- und Reference-Gates ausfuehren.

## Empfohlene Compiler-Leitplanken

Der spaetere `tsconfig` fuer Komponenten soll mindestens diese Leitplanken abbilden:

| Bereich | Vorgabe |
|---------|---------|
| `target` | moderne Browser-ES-Version, mindestens `ES2022` |
| `module` | native ESM-Ausgabe |
| `declaration` | `true` |
| `sourceMap` | lokal erlaubt, Release-Policy spaeter entscheiden |
| DOM Types | Pflicht, da Custom Elements native Browser APIs nutzen |
| Strictness | `strict` als Ziel, Migrationsausnahmen dokumentiert |
| Runtime Imports | keine Remote-URLs, keine CDN-Fallbacks |
| Kernel Boundary | keine Imports aus dem RMT Kernel in Component Source |

## Migration Guard fuer bestehende Komponenten

Bestehende JavaScript-Komponenten bleiben bis zu einer expliziten Migration Source of Truth. `components/*.js` darf daher nicht pauschal als generiertes Artefakt behandelt werden.

Der Migration Guard unterscheidet:

| Zustand | Bedeutung |
|---------|-----------|
| `js-legacy` | bestehende Komponente, JavaScript bleibt Source |
| `ts-planned` | Migration geplant, aber JS bleibt Source |
| `ts-source` | TypeScript Source ist fuehrend |
| `ts-generated-esm` | ESM Artefakt wurde aus TypeScript erzeugt |
| `contract-only` | nur Metadata/Types wurden nachgezogen, Implementierung bleibt JS |

Eine Migration ist erst akzeptiert, wenn:

- `src/components/<tag>/` vorhanden ist,
- `components/<basename>.js` als Artefakt reproduzierbar ist,
- `components/<basename>.d.ts` zum Contract passt,
- `components/manifest.json` den Source- und Maturity-Status ausweist oder ein Patch-Plan vorliegt,
- Component-, A11y-, Performance-, RMT-Compatibility- und Reference-Gates gruen sind.

## RMT-, Fabric- und Telemetry-Anschluss

TypeScript Source ist nicht nur syntaktischer Komfort. Der Source-Pfad muss die spaeteren Epic-10-Pflichten aufnehmen:

- RMT Component Metadata fuer `adapter: "xtend.component"`, Props, Slots, Events, Commands und Hydration Policies
- Fabric Boundary fuer Mount, Hydration, Render, Update, Event, Error und Unmount
- Lane- und Fiber-Hints fuer sichtbare, idle, user-blocking, transition und background UI-Arbeit
- Telemetry Snapshot Anschluss fuer Dauer, Status, Diagnostics und Backpressure
- A11y Profile fuer Role, Accessible Name, Keyboard, Focus, Live Regions und Screenreader-Signale
- Performance Profile fuer Budget-Klasse, Messpunkte, Hydration Policy und Cleanup-Pflichten

Diese Metadaten gehoeren source-nah in TypeScript-Dateien, werden aber adapter- und buildseitig so verarbeitet, dass XTendRMT keinen XTend-spezifischen Kernel-Code importiert.

## Lokale Entwicklung

Die lokale Entwicklung bleibt an die Enterprise-Reife-Entscheidungen gebunden:

- Entwicklungsserver: `npm run dev:local`
- Loader: `xtend-loader.js`
- Manifest: `components/manifest.json`
- keine CDN-Fallbacks in Default- oder Testpfaden
- ES6/ESM als Basistechnologie
- Tests ueber `node scripts/run_xtend_tests.js ...`

## Handoff an Folgepakete

| Paket | Ableitung aus dieser Strategie |
|-------|--------------------------------|
| `WP-E10-03` | definiert Component Contract v2 als TypeScript-, RMT- und Fabric-Contract |
| `WP-E10-07` | baut daraus den `xtend-builder` TypeScript Blueprint und den lokalen Build-/Patch-Plan |
| `WP-E10-08` | priorisiert Komponenten nach Maturity- und Migration-Zustand |
| `WP-E10-09` | nutzt `x-select`, `x-checkbox`, `x-radio` als erste TypeScript-first Referenzlinie |

## Akzeptanzkriterien

- neue Komponenten koennen TypeScript-first geplant werden
- bestehende JavaScript-Komponenten bleiben lauffaehig
- Source und Runtime-Artefakte sind eindeutig getrennt
- ESM-, Manifest- und Loader-Vertraege bleiben kompatibel
- keine CDN- oder neue Runtime-Dependency-Pflicht entsteht
- RMT Kernel bleibt frei von XTend-spezifischen TypeScript-Imports
- `WP-E10-03` und `WP-E10-07` koennen konkrete Contracts und Builder-Blueprints ableiten


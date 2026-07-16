# XTend Maraca CSS Provider Contract

- Status: `accepted-by-XTM-01`
- Datum: 2026-07-16
- Workpackage: `XTM-01`
- Contract: `xtend.maraca.css-provider.v1`
- Request Schema: `xtend.maraca.css-build-request.v1`
- Inspection Schema: `xtend.maraca.css-provider-inspection.v1`
- Plan Schema: `xtend.maraca.css-build-plan.v1`
- Artifact Schema: `xtend.maraca.css-artifact.v1`
- Evidence Schema: `xtend.maraca.css-build-evidence.v1`
- Lifecycle Result Schema: `xtend.maraca.css-provider-lifecycle-result.v1`
- Diagnostic Schema: `xtend.maraca.css-provider-diagnostic.v1`
- Module: `xtend-maraca/css-provider.js`
- Types: `xtend-maraca/css-provider.d.ts`
- Suite: `tests/maraca/maraca_css_provider_contract_suite.js`
- Local Gate: `node scripts/run_xtend_tests.js maraca-css-provider --json`
- Depends on: `XTM-00`
- Boundary: `provider-neutral-contract`
- Boundary: `build-time-only`
- Boundary: `no-provider-runtime-in-rmt-kernel`
- Boundary: `no-network-required-by-contract`
- Boundary: `native-provider-remains-fallback`

## Zweck

Der CSS Provider Contract trennt Maracas CSS-Planung von einer konkreten CSS-Toolchain. Der bestehende native CSS-Generator, Test-Doubles und spaetere Adapter wie Tailwind implementieren denselben Lifecycle und erzeugen dieselben serialisierbaren Plan-, Artefakt-, Evidence- und Diagnostic-Records.

XTM-01 definiert und implementiert den Provider-Vertrag. XTM-02 hat die produktive Auswahl und Ausfuehrung des Providers durch `xt maraca plan`, `build` und `tune` integriert.

## Leitentscheidung

Maraca kennt CSS Provider als lokale Build-Adapter. RMT Kernel, Component Loader und Browser Runtime kennen keine Provider-Objekte und importieren keine Provider-Toolchains.

Ein Provider besteht aus zwei getrennten Flaechen:

1. einem serialisierbaren Contract Snapshot mit ID, Version, Capabilities, Source Policy und Fingerprint;
2. einer lokalen Implementierung der Lifecycle-Methoden.

Functions, Toolchain-Objekte oder nicht serialisierbare Handles gelangen nicht in Build Reports.

## Lifecycle

Der kanonische Lifecycle ist geschlossen und geordnet:

```text
inspect -> plan -> build -> report -> dispose
```

| Phase | Verantwortung |
|-------|----------------|
| `inspect` | Verfuegbarkeit und lokale Toolchain feststellen, ohne CSS zu bauen |
| `plan` | Request in deterministische Schritte, Output und Metadaten ueberfuehren |
| `build` | CSS-Artefakt im Speicher erzeugen; Dateischreiben bleibt beim aufrufenden Build |
| `report` | serialisierbare Evidence aus Contract, Request, Plan und Artefakt erzeugen |
| `dispose` | Temp-, Cache- und Toolchain-Ressourcen auch nach Fehlern freigeben |

`dispose` ist fuer jede Provider-Implementierung Pflicht und wird durch den Lifecycle Runner auch nach einem Buildfehler ausgefuehrt.

## Statusmodell

| Status | Bedeutung |
|--------|-----------|
| `ready` | Provider kann den Request planmaessig bearbeiten |
| `unavailable` | lokale Toolchain oder Capability fehlt |
| `blocked` | Policy oder Request verhindert die Ausfuehrung |
| `failed` | Provider-Lifecycle oder Build ist fehlgeschlagen |
| `degraded` | explizit dokumentierter, nicht stiller eingeschraenkter Build |

Ein fehlender Provider darf nicht still in einen anderen Provider wechseln. XTM-02 entscheidet anhand Strict-/Fallback-Policy, ob ein expliziter nativer Fallback zulaessig ist.

## Build Request

Ein Request enthaelt ausschliesslich serialisierbare Builddaten:

```js
{
  schema: 'xtend.maraca.css-build-request.v1',
  provider: 'maraca-native',
  mode: 'external',
  input: 'app.css',
  output: 'dist/xtend.maraca.css',
  profile: 'production',
  minify: true,
  sourceMaps: false,
  strict: true,
  sources: [
    { path: 'app.rmt', kind: 'rmt', fingerprint: '...' }
  ],
  sourcePolicy: {
    root: '.',
    allow: ['app.rmt'],
    deny: [],
    automaticDiscovery: false
  },
  metadata: {},
  fingerprint: '...'
}
```

Source-Fingerprints werden vom aufrufenden Planer geliefert oder bleiben bis zur produktiven Source-Inventarisierung `null`. Der Provider darf keine nicht deklarierte Netzquelle oder versteckte automatische Suche voraussetzen.

## Contract Snapshot

Der Snapshot beschreibt:

- stabile Provider-ID und Version;
- Lifecycle `inspect`, `plan`, `build`, `report`, `dispose`;
- Capabilities fuer `inline`, `external`, `minify` und `sourceMaps`;
- Source Policy fuer explizite Quellen, automatische Discovery und Netzwerk;
- Diagnostic Schema und unterstuetzte Fehlercodes;
- Boundary `build-time-only`;
- stabilen SHA256-Fingerprint.

Der Snapshot enthaelt keine Functions. Dadurch kann Maraca ihn spaeter unveraendert in Plan, Tune Config und Bundle Report uebernehmen.

## Artifact und Evidence

Das CSS Artifact darf waehrend des Builds `cssText` und optional eine Source Map enthalten. Es dokumentiert Mode, Dateiname, Bytes, Output-Fingerprint, Status und Diagnostics.

Die Evidence enthaelt keinen CSS-Text. Sie dokumentiert:

- Provider Contract Snapshot;
- Request- und Plan-Fingerprint;
- Output Mode und Dateiname;
- CSS Bytes und Output-Fingerprint;
- deklarierte Source-Fingerprints;
- Status und Diagnostics;
- eigenen Evidence-Fingerprint.

Das Schreiben, Inlining, Precache-Anmelden und Budgetieren des Artefakts ist durch XTM-02 Aufgabe der Maraca Pipeline.

## Referenzprovider

### Native Provider

`createNativeMaracaCssProvider()` repraesentiert den bestehenden Maraca CSS Generator. Er unterstuetzt `inline` und `external`, benoetigt keine externe Toolchain und bleibt die Fallback-Baseline.

XTM-02 bindet die produktive `createCssText()`-Implementierung an diesen Provider. XTM-01 stellt bereits den vollstaendigen Contract und einen deterministischen In-Memory-Build bereit.

### Dummy Provider

`createDummyCssProvider()` ist ein deterministisches Test-Double. Es zaehlt Lifecycle-Aufrufe, kann Buildfehler simulieren und prueft, dass `dispose` in Erfolgs- und Fehlerpfaden ausgefuehrt wird.

Dummy Provider sind nicht fuer Package- oder Browser-Runtime vorgesehen.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `xtend.maraca.css_provider.invalid` | Contract, Request oder Lifecycle ist unvollstaendig |
| `xtend.maraca.css_provider.unavailable` | Provider oder lokale Toolchain ist nicht verfuegbar |
| `xtend.maraca.css_provider.source_blocked` | eine Quelle verletzt die Source Policy |
| `xtend.maraca.css_provider.build_failed` | Build, Report oder Dispose ist fehlgeschlagen |
| `xtend.maraca.css_provider.output_missing` | Provider hat kein CSS-Artefakt erzeugt |

Diagnostics sind strukturierte Records mit Schema, Code, Severity und Message. Provider duerfen Details ergaenzen, aber keine Secrets, Toolchain-Handles oder nicht serialisierbare Fehlerobjekte ausgeben.

## Public API

Der Contract ist verfuegbar ueber:

```js
const cssProvider = require('@ccslabs/xtend-maraca/css-provider');
const cssProviderFromStack = require('@ccslabs/xtend/maraca/css-provider');
```

Wichtige Exports:

- `createCssProviderContract()` und `validateCssProviderContract()`;
- `createCssBuildRequest()` und `validateCssBuildRequest()`;
- `createCssProvider()` und `validateCssProvider()`;
- `createCssArtifact()` und `createCssBuildEvidence()`;
- `createNativeMaracaCssProvider()`;
- `createDummyCssProvider()`;
- `runCssProviderLifecycle()`.

## XTM-02 Integration

XTM-02 integriert:

- Maraca CLI- und Config-Optionen;
- Provider Registry beziehungsweise explizite Provider-Aufloesung;
- Anbindung des nativen Providers an `createCssText()`;
- Plan-, Bundle-, Tune-, Size- und PWA-Report-Integration;
- Dateischreiben und Inline-Injektion;
- Strict-/Fallback-Policy auf Pipeline-Ebene.

Der Provider Contract oder seine Diagnostics muessen dafuer nicht erneut umgeschnitten werden.

## Verification

```bash
node scripts/run_xtend_tests.js maraca-css-provider --json
npm run test:maraca-css-provider
node scripts/run_xtend_tests.js maraca-package-exports references --json
```

Der Gate prueft Contract-, Request-, Plan-, Artifact- und Evidence-Schemas, deterministische Fingerprints, Native-/Dummy-Paritaet, Fehler und Dispose, TypeScript Surface, Package Exports, Metadaten, Runner und den abgeschlossenen XTM-01-Status.

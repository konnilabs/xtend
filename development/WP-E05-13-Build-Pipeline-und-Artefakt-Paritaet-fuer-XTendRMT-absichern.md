# WP-E05-13 - Build-Pipeline und Artefakt-Paritaet fuer XTendRMT absichern

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
- Backlog: `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`
- Bezug:
  - `development/WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md`
  - `development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md`
  - `development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `scripts/verify_xtendrmt_artifact_parity.js`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-manifest.json`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `tests/rmt/rmt_compatibility_suite.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-13` sichert die Build-Pipeline- und Artefakt-Paritaet fuer `xtendrmt/` ab. Das Paket baut noch keine neue upstream Build-Pipeline in diesem Repository, verhindert aber, dass die lokale Build-Artefaktversion still zwischen Schema, Manifest, Typen und Runtime-Bundles auseinanderlaeuft.

Damit bleibt die Entscheidung aus `WP-E05-01` erhalten: upstream RMT Source ist Source-of-Truth. `xtendrmt/` ist Build-Output, Demo-Basis und Regression-Referenz. Wenn diese Artefakte im Repository bewusst synchronisiert werden, muss ein Gate pruefen, dass die synchronisierte Oberflaeche zusammenpasst.

## Artifact Parity Contract

Der Contract traegt die stabile ID:

```text
xtend.rmt.artifact-parity.v1
```

Der Contract ist in `xtendrmt/rmt.schema.json` unter `artifactParityContracts` und in `xtendrmt/rmt-manifest.json` unter `artifactParityContracts` sichtbar.

Der dedizierte Gate-Befehl lautet:

```bash
node scripts/verify_xtendrmt_artifact_parity.js --json
```

Als NPM Shortcut steht bereit:

```bash
npm run test:rmt-artifact-parity
```

## Synchronisierte Artefakte

Der Gate prueft die aktuelle synchronisierte Regressionsebene:

- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `xtendrmt/rmt.schema.json`
- `xtendrmt/rmt-manifest.json`

Diese Dateien bleiben Output oder bewusst synchronisierte Regression-Referenz. Der Gate ersetzt keine upstream Source-Struktur, macht Drift aber lokal reproduzierbar sichtbar.

## Parity-Regeln

Der Artifact-Parity-Gate prueft:

- alle synchronisierten Artefakte existieren
- `rmt.schema.json`, `rmt-manifest.json` und `package.json` parsen als JSON
- Schema und Manifest deklarieren `xtend.rmt.artifact-parity.v1`
- Schema enthaelt die relevanten Folgecontracts:
  - `xtend.rmt.runtime-registry.v1`
  - `xtend.rmt.xrouter-adapter.v1`
  - `xtend.rmt.xtend-component-adapter.v1`
  - `xtend.rmt.state-scheduler-diagnostics-bridge.v1`
  - `xtend.rmt.artifact-parity.v1`
- `rmt-manifest.json` und die aus den ESM-Bundles erzeugten Product-Manifeste enthalten die produktiven Factories:
  - `createRmtFormat`
  - `createRmtXRouterAdapter`
  - `createRmtXtendComponentAdapter`
  - `createRmtStateSchedulerDiagnosticsBridge`
- ESM-Exportbloecke enthalten alle `namedExports` aus dem Manifest
- `rmt-core.d.ts` deklariert die oeffentlichen Factories und `RmtArtifactParityContract`
- das Browser-Bundle enthaelt die produktiven Factory-Surfaces und den Artifact-Parity-Contract

## Gefundener Drift

Beim Einfuehren des Gates wurde ein echter Drift sichtbar: `rmt-manifest.json` enthielt bereits die produktiven Adapter-/Bridge-Factories aus `WP-10` bis `WP-12`, waehrend die in `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` erzeugten Product-Manifeste diese Factory-Eintraege noch nicht vollstaendig abbildeten.

Der Drift wurde synchronisiert:

- `createRmtXRouterAdapter`
- `createRmtXtendComponentAdapter`
- `createRmtStateSchedulerDiagnosticsBridge`
- `createRmtFormat`

Damit stimmen Manifest-Datei, generated Product Manifest, ESM-Exports, Browser-Artefakt und Typoberflaeche wieder ueberein.

## Kernel Boundary

Der Artifact-Parity-Gate darf:

- Artefakt-Drift melden
- Bundle-Syntax pruefen
- Product-Manifeste aus lokalen ESM-Artefakten evaluieren
- Factories, Named Exports, Typen und Contract-IDs vergleichen
- synchronisierte Regression-Referenzen fuer Folgepakete absichern

Der Artifact-Parity-Gate darf nicht:

- XTend, XRouter, `xstate` oder DOM-Arbeit in den RMT Kernel einfuehren
- upstream Source-of-Truth ersetzen
- Demo-Code zur produktiven Architekturquelle machen
- manuelles Bundle-Patching als Dauerpfad legitimieren

## Handoff an Folgepakete

- `WP-14` kann die Bestcase-Demo nun auf native `routes`, `components`, produktive Adapter und Bridge-Pfade migrieren, weil die Runtime-Artefakte nicht still gegen Manifest oder Typen driften.
- `WP-15` kann Contract-, Schema- und Runtime-Tests auf dem Artifact-Parity-Gate aufbauen.
- `WP-16` kann Browser-Smokes gegen die synchronisierten produktiven Surfaces laufen lassen.
- `WP-17` kann Authoring-Beispiele auf die stabilen Produktartefakte beziehen.

## Verifikation

Mindestgates:

```bash
node scripts/verify_xtendrmt_artifact_parity.js --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
npm test
```

Die RMT-Kompatibilitaetssuite fuehrt den Artifact-Parity-Gate direkt aus. Dadurch kann ein Drift in `xtendrmt/` nicht unbemerkt bleiben, wenn der normale RMT-Gate laeuft.

## Ergebnis

`WP-13` ist abgeschlossen. `xtendrmt/` ist weiterhin Build-Artefakt, Demo-Basis und Regression-Referenz, aber Schema, Manifest, Typen, ESM-Bundles und Browser-Bundle werden durch `xtend.rmt.artifact-parity.v1` und `scripts/verify_xtendrmt_artifact_parity.js` zusammengehalten. `WP-14` ist dadurch startbereit.

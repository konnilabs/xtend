# WP-E17-04 - RMT vNext App Build Pipeline und 1.0 Gate

- Status: `implemented`
- Datum: 16. Mai 2026
- Epic: `development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md`
- Contract: `xtend.scaffold.rmt-app-build.v1`
- Report Contract: `xtend.scaffold.rmt-app-build-report.v1`
- Browser Smoke Contract: `xtend.scaffold.rmt-app-browser-smoke.v1`
- Depends on: `WP-E17-01`, `WP-E17-02`, `WP-E17-03`
- Lokaler Gate: `node scripts/run_xtend_tests.js scaffold-rmt-build --json`
- Primaere Artefakte:
  - `xtend-builder/generators/rmt-build.js`
  - `xtend-builder/generators/registry.js`
  - `xtend-builder/lib/cli.js`
  - `xtend-builder/scaffold.config.js`
  - `tests/builder/scaffold_rmt_build_suite.js`
  - `package.json`
  - `scripts/run_xtend_tests.js`

## Ziel

Dieses Workpackage hebt den bisherigen RMT Lifecycle Demo Sonderpfad auf einen allgemeinen Scaffold-Buildpfad.

Der neue Befehl:

```bash
node xtend-builder/scaffold.js rmt-build --source xtendrmt/rmt-lifecycle-demo.rmt --write --json
```

liest ein `.rmt` vNext Template, kompiliert es in Core JSON und erzeugt daraus testbare XTend-Artefakte. Der Pfad bleibt dry-run-first und nutzt dieselben Sicherheitsbausteine wie `component-files`: zentraler `WritePlan`, Ownership-Sidecar und strukturierter Manifest-Patcher.

## Build-Outputs

Fuer ein Source-Template `xtendrmt/<name>.rmt` erzeugt `rmt-build` standardmaessig eigene `*.rmt-build.*` Artefakte, damit der generische Build bestehende Spezialdemos nicht ueberschreibt:

- `xtendrmt/<name>.rmt-build.core.json`
- `components/x-<name>-build.js`
- `xtendrmt/<name>.rmt-build.app.js`
- `xtendrmt-<name>-rmt-build.html`
- `tests/browser/fixtures/<name>-rmt-build-smoke.html`
- `xtendrmt/<name>.rmt-build.scaffold.json`
- strukturierter Patch auf `components/manifest.json`

Explizite Pfade koennen per CLI-Optionen wie `--core-output`, `--app-output`, `--host`, `--browser-smoke`, `--scaffold-report` und `--tag` gesetzt werden.

## Pipeline

1. RMT vNext Source wird gelesen und mit `compileRmtVNextSource` kompiliert.
2. `component-files` rendert den XTend Custom Element Blueprint fuer den abgeleiteten Component Tag.
3. `manifest-patcher` erzeugt einen deterministischen Patch fuer `components/manifest.json`.
4. `rmt-build` erzeugt App-Modul, HTTP-Host, Browser-Smoke-Fixture und Scaffold Report.
5. `WritePlan` plant oder schreibt alle Artefakte mit Ownership-Metadaten.
6. `--check` prueft, ob Core, Manifest, Component, App, Host, Smoke und Report aktuell sind.

## Contracts

Der Build selbst nutzt:

```text
xtend.scaffold.rmt-app-build.v1
```

Der dauerhafte Build Report nutzt:

```text
xtend.scaffold.rmt-app-build-report.v1
```

Das Browser-Smoke-Fixture nutzt:

```text
xtend.scaffold.rmt-app-browser-smoke.v1
```

Der Report referenziert ausserdem:

- `xtend.scaffold.write-plan.v1`
- `xtend.scaffold.generated-ownership.v1`
- `xtend.scaffold.manifest-patcher.v1`
- `xtend.rmt.core-format.vnext.v1`

## 1.0 Gate

Der lokale Gate lautet:

```bash
node scripts/run_xtend_tests.js scaffold-rmt-build --json
```

Der Gate prueft in einem Temp-Workspace:

- Dry-Run ohne Dateioperationen
- produktiven Write aller erwarteten Artefakte
- echten Manifest-JSON-Patch
- Build Report mit App-, Host- und Smoke-Verweisen
- Ownership fuer Manifest, Component und Report
- idempotenten zweiten Write
- erfolgreichen `--check`
- Compile-Fehlerpfad ohne Writes

## Handoff

Mit `WP-E17-04` ist der allgemeine RMT Authoring-to-App Lifecycle fuer 1.0 gatebar: vNext Template rein, Core JSON und XTend App-Artefakte raus, lokal per HTTP-Host und Browser-Smoke pruefbar.

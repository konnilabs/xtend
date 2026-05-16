# WP-E17-02 - Ownership, Konfliktmodell und component-files write

- Status: `implemented`
- Datum: 16. Mai 2026
- Epic: `development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md`
- Contract: `xtend.scaffold.generated-ownership.v1`
- Build Contract: `xtend.scaffold.component-files.v1`
- Depends on: `WP-E17-01`
- Lokaler Gate: `node scripts/run_xtend_tests.js scaffold-component-write --json`
- Primaere Artefakte:
  - `xtend-builder/writing/write-plan.js`
  - `xtend-builder/writing/write-plan.d.ts`
  - `xtend-builder/generators/component-files.js`
  - `tests/builder/scaffold_component_write_suite.js`
  - `package.json`
  - `scripts/run_xtend_tests.js`

## Ziel

Dieses Workpackage macht aus dem WritePlan eine sichere produktive Schreibschicht fuer generierte Komponentenartefakte.

Scaffold darf Dateien erzeugen und eigene generierte Dateien aktualisieren. Es darf aber keine manuell gepflegten Dateien still ueberschreiben. Deshalb fuehrt `WP-E17-02` ein Sidecar-basiertes Ownership-Modell ein und bindet `component-files --write` an den zentralen Writer.

## Ownership-Modell

Scaffold schreibt Ownership-Metadaten in:

```text
.xtend-build/scaffold-ownership.json
```

Der Contract des Sidecars ist:

```text
xtend.scaffold.generated-ownership.v1
```

Pro Datei werden gespeichert:

- `owner`
- `generator`
- `kind`
- `path`
- `sha256`
- `bytes`
- `templateId`
- `templatePath`
- `sourceSha256`
- `buildSha256`

Das Sidecar ist bewusst strukturierte JSON-Metadaten statt Kommentar-Header. Dadurch bleiben JSON-, HTML-, Markdown-, TypeScript- und JavaScript-Artefakte in ihrem nativen Format valide.

## Konfliktregeln

Der Writer entscheidet fuer bestehende Dateien nach diesen Regeln:

- gleicher Inhalt: `skip`
- Datei fehlt: `create`
- Datei ist im Ownership-Sidecar registriert und der aktuelle Hash passt: `update`
- Datei ist im Ownership-Sidecar registriert, aber der aktuelle Hash driftet: `conflict`
- Datei existiert ohne Scaffold-Ownership: `conflict`
- `--force` ersetzt einen Konflikt bewusst als `force-update`

`--force` ist kein Default und wird im WritePlan sichtbar.

## component-files --write

`xtend-builder/generators/component-files.js` unterstuetzt nun:

```bash
node xtend-builder/scaffold.js component-files --tag x-demo --profile display --feature state --write --json
node xtend-builder/scaffold.js component-files --tag x-demo --profile display --feature state --check --json
node xtend-builder/scaffold.js component-files --tag x-demo --profile display --feature state --write --force --json
```

Der Dry-Run bleibt unveraendert der Default. Erst `--write` fuehrt Dateioperationen aus. `--check` prueft CI-faehig, ob der Output aktuell waere.

## Akzeptanzkriterien

- `component-files --write` schreibt in einem Temp-Workspace alle gerenderten Artefakte.
- Das Ownership-Sidecar wird erzeugt und enthaelt Owner, Generator, Template- und Build-Hashes.
- Wiederholter Write ist idempotent und meldet `skip`.
- `component-files --check` meldet `current`, wenn alle Artefakte aktuell sind.
- Drift in generierten Dateien wird ohne `--force` blockiert.
- Bestehende unowned Dateien werden ohne `--force` blockiert.
- `--force` ersetzt bewusst und protokolliert `force-update`.
- Der lokale Gate `node scripts/run_xtend_tests.js scaffold-component-write --json` prueft diese Regeln.

## Handoff an WP-E17-03

`WP-E17-03` kann auf diesem Ownership-Modell aufbauen und strukturierte Patch-Operationen fuer Manifest, Registry, Docs-Menue und Testpfade einfuehren.

Offene Folgepunkte:

- echte JSON-Merge-Patcher statt Manifest-Patch-Plan als Dateiinhalt
- Registry-spezifische Patch-Aktionen
- Build-Report-Verknuepfung mit Ownership-Sidecar
- Policy fuer Loeschoperationen oder verwaiste generated files


# WP-E17-03 - Manifest, Registry und Build-Report Patcher

- Status: `implemented`
- Datum: 16. Mai 2026
- Epic: `development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md`
- Contract: `xtend.scaffold.patchers.v1`
- Manifest Contract: `xtend.scaffold.manifest-patcher.v1`
- Build Report Contract: `xtend.scaffold.build-report.v1`
- Depends on: `WP-E17-01`, `WP-E17-02`
- Lokaler Gate: `node scripts/run_xtend_tests.js scaffold-manifest-patch --json`
- Primaere Artefakte:
  - `xtend-builder/writing/manifest-patcher.js`
  - `xtend-builder/writing/manifest-patcher.d.ts`
  - `xtend-builder/writing/write-plan.js`
  - `xtend-builder/generators/component-files.js`
  - `tests/builder/scaffold_manifest_patch_suite.js`
  - `tests/builder/scaffold_component_write_suite.js`
  - `package.json`
  - `scripts/run_xtend_tests.js`

## Ziel

Dieses Workpackage macht aus dem bisherigen Manifest-Patch-Plan einen produktiven, strukturierten JSON-Patch.

`component-files` rendert den alten Patch-Plan weiter im Dry-Run, damit Reviews den geplanten Manifest-Eingriff sehen. Im `--write`- und `--check`-Pfad wird `components/manifest.json` aber nicht mehr durch diesen Plan ersetzt. Stattdessen liest `xtend-builder/writing/manifest-patcher.js` das bestehende Manifest, fuegt den Component-Eintrag deterministisch ein oder aktualisiert ihn und schreibt wieder echtes Manifest-JSON.

## Patcher-Vertrag

Der Patcher erzeugt Entscheidungen nach:

```text
xtend.scaffold.manifest-patcher.v1
```

Die Entscheidung enthaelt:

- `operation`
- `targetPath`
- `tag`
- `source`
- `previousSource`
- `decision`
- `changed`
- `policies`
- `diagnostics`

Der Umbrella-Contract fuer kuenftige strukturierte Patcher ist:

```text
xtend.scaffold.patchers.v1
```

## Manifest-Regeln

- Manifest-Quellen bleiben repo-lokal.
- CDN- und Remote-Quellen werden verweigert.
- `components/<tag>.js` wird fuer `components/manifest.json` als `./<tag>.js` gespeichert.
- Bestehende fremde Eintraege bleiben erhalten.
- Eintraege werden sortiert, damit Writes deterministisch bleiben.
- Existiert der gleiche Tag mit anderer Quelle, wird kontrolliert aktualisiert und diagnostiziert.
- Ungueltiges Manifest-JSON blockiert den Build vor Dateioperationen.

## Build Report

Jeder produktive `component-files` Build schreibt zusaetzlich:

```text
.xtend-build/component-files/<tag>.scaffold-build.json
```

Der Contract lautet:

```text
xtend.scaffold.build-report.v1
```

Der Report enthaelt Inputs, Outputs, Contract-Referenzen, Manifest-Patches, lokale Gates und Policies. Er ist bewusst stabil ueber wiederholte Writes, damit `--check` und Idempotenz nicht durch transienten Ausfuehrungsstatus driften.

## Registry-Handoff

`WP-E17-03` fuehrt den Patcher-Umbrella `xtend.scaffold.patchers.v1` ein, haengt aber fuer `component-files` bewusst nur den Manifest-Patcher produktiv ein. Scaffold-Generator-Registry, Package-Scripts und Test-Runner werden in diesem Workpackage als statische Build-Registry aktualisiert. Ein produktiver Registry- oder Docs-Menue-Patcher wird erst aktiviert, wenn ein Generator fachlich wirklich ein Registry-Ziel veraendern muss.

## WritePlan-Integration

Der zentrale Writer kennt nun strukturierte Patches fuer vorhandene JSON-Ziele. Ein Patch-Eintrag darf ein bestehendes unowned Manifest kontrolliert patchen, ohne die allgemeinen Ownership-Regeln fuer generierte Dateien aufzuweichen. Diese Entscheidung wird im WritePlan als `patch` und mit der Warn-Diagnose `structured-patch-existing-target` sichtbar.

Generierte Dateien bleiben weiterhin geschuetzt:

- normale unowned Dateien werden blockiert
- generated drift wird blockiert
- `--force` bleibt explizit
- Manifest-Patches werden ueber den Patcher und nicht ueber Stringersetzung angewendet

## Akzeptanzkriterien

- `component-files --write` schreibt ein echtes `components/manifest.json`, kein Patch-Plan-JSON.
- Bestehende Manifest-Eintraege bleiben erhalten.
- Manifest-Eintraege werden deterministisch sortiert.
- Bestehende Tag-Eintraege koennen kontrolliert aktualisiert werden.
- Der Build Report wird unter `.xtend-build/component-files/` geschrieben.
- Wiederholter Write bleibt idempotent.
- `component-files --check` prueft Manifest und Build Report gegen Drift.
- Der lokale Gate `node scripts/run_xtend_tests.js scaffold-manifest-patch --json` prueft diese Regeln.

## Handoff an WP-E17-04

`WP-E17-04` kann den gleichen Patcher- und Report-Pfad fuer RMT vNext App Builds nutzen. Der noch offene Schritt ist die Generalisierung von RMT-Template -> Core JSON -> App-Artefakte -> Manifest/Host/Smoke-Fixture ueber denselben Writer und dieselben Build Reports.

# XTendRMT vNext Import Resolver Contract

- Status: `accepted by WP-E15-11`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-import-resolver.v1`
- Module Graph: `xtend.rmt.vnext-module-graph.v1`
- Module Record: `xtend.rmt.vnext-module-record.v1`
- Import Edge: `xtend.rmt.vnext-import-edge.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-module-graph-ready`
- Folgepakete: `WP-E15-12`, `WP-E15-15`, `WP-E15-16`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-import-resolver.v1"
```

Dieser Contract beschreibt die gemeinsame Modulaufloesung fuer vNext-RMT-Dateien. Bundler, CLI und LSP sollen denselben Module Graph lesen koennen, ohne eigene Import-Semantik oder dynamische Codeausfuehrung einzufuehren.

## Erlaubte Importformen

| Form | Mode | Bedeutung |
|------|------|-----------|
| `./file.rmt` | `static_file` | relative lokale Datei |
| `../file.rmt` | `static_file` | relative Datei innerhalb erlaubter Roots |
| `./dir/*.rmt` | `static_glob` | flacher statischer Glob |
| `./dir/**/*.rmt` | `static_glob` | rekursiver statischer Glob |

Bare package specifier, Remote URLs, dynamische Ausdruecke, `.json`-Globs und Host-Imports sind nicht Teil des vNext-MVP.

## Package Boundaries

Der Resolver erhaelt explizite `roots`. Jeder Import muss nach Normalisierung innerhalb mindestens eines Roots liegen. Verlaesst ein Import den Root, blockiert der Module Graph mit `rmt.vnext.import.boundary.violation`.

## Module Graph Snapshot

```json
{
  "schema": "xtend.rmt.vnext-module-graph.v1",
  "resolverSchema": "xtend.rmt.vnext-import-resolver.v1",
  "status": "ready",
  "entryModule": "module:app.rmt",
  "allowedImportModes": [
    "static_file",
    "static_glob"
  ],
  "moduleCount": 5,
  "edgeCount": 3,
  "loadOrder": [
    "module:app.rmt",
    "module:shared/footer.rmt",
    "module:shared/header.rmt"
  ],
  "merge": {
    "strategy": "dependency-first-postorder",
    "order": [
      "module:shared/footer.rmt",
      "module:shared/header.rmt",
      "module:app.rmt"
    ]
  },
  "modules": [],
  "edges": [],
  "diagnostics": []
}
```

## Merge-Regeln

- Import-Aufloesung folgt Authoring-Reihenfolge.
- Glob-Ergebnisse werden nach stabiler POSIX-Pfadform sortiert.
- Merge-Reihenfolge ist `dependency-first-postorder`.
- Zyklen blockieren den Graph und werden nicht automatisch aufgeloest.
- Module behalten ihre Core-Dokumente; spaetere Bundler koennen daraus einen Merge bauen, ohne erneut Source zu parsen.

## Import Edge

```json
{
  "schema": "xtend.rmt.vnext-import-edge.v1",
  "id": "module:app.rmt#import:0",
  "importer": "module:app.rmt",
  "importPath": "./shared/*.rmt",
  "mode": "static_glob",
  "resolvedPaths": [
    "/repo/tests/rmt-language/fixtures/vnext-modules/shared/footer.rmt",
    "/repo/tests/rmt-language/fixtures/vnext-modules/shared/header.rmt"
  ],
  "status": "ready",
  "diagnostics": []
}
```

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.import.path.missing` | Import-Record hat keinen statischen Pfad |
| `rmt.vnext.import.path.unsupported` | Import-Pfad oder Mode ist nicht statisch erlaubt |
| `rmt.vnext.import.glob.unsupported` | Glob-Form ist nicht Teil des vNext-MVP |
| `rmt.vnext.import.glob.empty` | Glob ergibt keine `.rmt`-Module |
| `rmt.vnext.import.boundary.violation` | Import verlaesst konfigurierte Package Roots |
| `rmt.vnext.import.file.missing` | Datei fehlt |
| `rmt.vnext.import.file.read_failed` | Datei konnte nicht gelesen werden |
| `rmt.vnext.import.file.compile_failed` | Zielmodul kompiliert nicht als vNext-RMT |
| `rmt.vnext.import.cycle` | Statischer Import-Zyklus erkannt |
| `rmt.vnext.import.module.duplicate` | Module ID ist im Snapshot doppelt |

Alle Diagnostics behalten `sourceRef`, Core Pointer und Source Range, sofern sie im Core-SourceMap vorhanden sind.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-imports --json
```

Fixtures:

- `tests/rmt-language/fixtures/vnext-modules/app.rmt`
- `tests/rmt-language/fixtures/vnext-modules-cycle/a.rmt`
- `tests/rmt-language/fixtures/vnext-modules-missing/app.rmt`
- `tests/rmt-language/fixtures/vnext-modules-boundary/app.rmt`
- `tests/rmt-language/fixtures/vnext-modules-invalid-glob/app.rmt`

Modul:

- `tools/rmt-language/vnext-import-resolver.js`

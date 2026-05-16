# WP-E17-01 - WritePlan und zentraler Scaffold Writer

- Status: `implemented`
- Datum: 16. Mai 2026
- Epic: `development/EPIC-17-XTend-Scaffold-Produktive-Builds-und-Dateischreibpfade.md`
- Contract: `xtend.scaffold.write-plan.v1`
- Report Contract: `xtend.scaffold.write-report.v1`
- Ziel: demo-lokale Dateischreiblogik durch einen zentralen, wiederverwendbaren Scaffold Writer ersetzen
- Lokaler Gate: `node scripts/run_xtend_tests.js scaffold-write-plan --json`
- Primaere Artefakte:
  - `xtend-builder/writing/write-plan.js`
  - `xtend-builder/writing/write-plan.d.ts`
  - `tests/builder/scaffold_write_plan_suite.js`
  - `xtend-builder/generators/rmt-lifecycle-demo.js`
  - `xtend-builder/scaffold.config.js`
  - `xtend-builder/README.md`

## Ausgangspunkt

Vor diesem Workpackage konnte die RMT Lifecycle Demo Dateien ueber eine lokale `writeFileIfChanged`-Hilfsfunktion schreiben. Das war fuer den Demo-Vertikalschnitt ausreichend, aber kein Scaffold-Contract:

- kein gemeinsames `WritePlan` Schema
- keine zentrale Root- und Pfadpruefung
- kein wiederverwendbarer Write Report
- keine einheitliche Idempotenzsemantik
- keine klare API fuer spaetere `component-build` und RMT Build-Pipelines

## Umsetzung

`xtend-builder/writing/write-plan.js` fuehrt die zentrale Writer-Schicht ein.

Die API besteht aus:

- `createWritePlan(entries, options)`
- `applyWritePlan(plan, options)`
- `writeScaffoldFiles(entries, options)`
- `summarizeWritePlan(plan)`
- `normalizeRelativePath(relativePath)`
- `sha256(value)`

Ein WritePlan beschreibt fuer jedes Zielartefakt:

- normalisierten Repo-relativen Pfad
- erlaubte Output-Roots
- Aktion `create`, `update`, `skip` oder `conflict`
- bestehenden und neuen Hash
- Byte-Laenge
- Generated-/Owner-Fakten
- strukturierte Diagnosen

Der Writer schreibt nur, wenn `write: true` gesetzt ist. Ohne `write` bleibt er im Dry-Run. Mit `check: true` prueft er, ob die Outputs aktuell waeren, ohne Dateien zu veraendern.

## Grenzen

Dieses Workpackage fuehrt noch kein vollstaendiges Ownership-Modell fuer manuell bearbeitete Dateien ein. Das folgt in `WP-E17-02`.

`WP-E17-01` schuetzt bereits:

- absolute Pfade
- `..`-Escapes
- Pfade ausserhalb erlaubter Output-Roots
- Directory Targets
- Schreibfehler mit strukturiertem Report

## Integration

Die RMT Lifecycle Demo nutzt den zentralen Writer fuer ihre produktiven `--write` Ausgaben. Damit bleibt der bestehende Demo-Build kompatibel, aber die Schreibsemantik liegt nicht mehr im Demo-Generator selbst.

`xtend-builder/scaffold.config.js` deklariert die neue Modulgrenze `xtend-builder/writing/` und die Schemas:

- `xtend.scaffold.write-plan.v1`
- `xtend.scaffold.write-report.v1`

## Akzeptanzkriterien

- Dry-Run erzeugt einen stabilen WritePlan und schreibt keine Datei.
- Write fuehrt denselben Plan aus und erzeugt Dateien unter erlaubten Roots.
- Wiederholter Write ist idempotent und meldet `skip` / `changed: false`.
- Check-Modus meldet `current` oder `outdated`, ohne zu schreiben.
- Pfade ausserhalb des Repo-Roots werden verweigert.
- Pfade ausserhalb erlaubter Output-Roots werden verweigert.
- Directory Targets werden verweigert.
- Die RMT Lifecycle Demo nutzt den zentralen Writer.
- Der lokale Gate `node scripts/run_xtend_tests.js scaffold-write-plan --json` prueft das Verhalten.

## Handoff an WP-E17-02

`WP-E17-02` baut auf dieser Schicht auf und fuegt das Generated-Ownership- und Konfliktmodell hinzu:

- Generated Header oder Sidecar-Metadaten
- Source-, Template- und Build-Hashes pro Datei
- Verweigerung nicht-generierter bestehender Dateien ohne `--force`
- produktiver `component-files --write` oder `component-build`


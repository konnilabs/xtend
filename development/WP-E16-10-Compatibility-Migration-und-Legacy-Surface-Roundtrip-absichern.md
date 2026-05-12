# WP-E16-10: Compatibility, Migration und Legacy Surface Roundtrip absichern

- Status: `completed`
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-compatibility --json`

## Ergebnis

WP-E16-10 sichert den Uebergang von bestehenden SurfaceManager- und nativen
RMT-Surface-Dokumenten in die Remote-Surface-Welt ab. Die Migration bleibt
standardmaessig report-only. Remote Authoring Previews entstehen nur fuer
Kandidaten, die bereits alle Remote-, Owner-, Version-, Integrity-, Fallback-
und ShellTarget-Fakten enthalten.

## Implementierung

- Remote Compatibility Adapter:
  - `tools/rmt-language/vnext-remote-compatibility.js`
  - Migration Report: `xtend.rmt.vnext-remote-migration-report.v1`
  - Matrix: `xtend.rmt.vnext-remote-compatibility-matrix.v1`
  - Roundtrip: `xtend.rmt.vnext-remote-roundtrip-report.v1`
  - Preview: `xtend.rmt.vnext-remote-authoring-preview.v1`
- Report-only Diagnostics:
  - fehlende Remote Surface Pflichtfakten
  - nicht migrierbare Runtime-Fakten aus SurfaceManager und Surface Records
  - klare SurfaceManager Host-Grenze
  - Native Surface Domain Roundtrip
- Preview-Projektion:
  - nur opt-in via `migrationMode: "preview"`
  - nur fuer sichere Kandidaten mit expliziten Remote-Fakten
  - Validierung ueber `compileRmtVNextRemoteSource()`

## Nachweis

- Legacy Fixture: `tests/rmt-language/fixtures/vnext-remote-compatibility-legacy-surface.rmt`
- Preview Fixture: `tests/rmt-language/fixtures/vnext-remote-compatibility-preview.rmt`
- Remote vNext Fixture: `tests/rmt-language/fixtures/vnext-remote-compiler-valid.rmt`
- Suite: `tests/rmt-language/rmt_vnext_remote_compatibility_suite.js`

`WP-E16-10` ist abgeschlossen. `WP-E16-11` bleibt startbar; `WP-E16-12` bleibt
bis zum Abschluss von `WP-E16-11` blockiert.

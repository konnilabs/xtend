# XTend SurfaceManager RMT Workbench Fixture Contract

- Status: `accepted-rmt-first-workbench-fixture`
- Datum: 9. Mai 2026
- Workpackage: `WP-SM-05`
- Contract: `xtend.surface.workbench-fixture.v1`
- Report: `xtend.surface.workbench-fixture-report.v1`
- Authoring-Basis: `xtend.rmt.surface-authoring.v1`
- Runtime-Basis: `xtend.surface.manager.v1`, `xtend.surface.record.v1`, `xtend.surface.controller.v1`, `xtend.surface.snapshot.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Ziel

`WP-SM-05` macht aus dem statischen Surface Authoring Model eine RMT-first Workbench, die im Browser aus einem RMT-Dokument materialisiert werden kann. Das Fixture ist die erste App-Shell-nahe Referenz fuer zwei parallele Windows, ein SidePanel, route-bound Content und einen shared Surface Snapshot.

## Artefakte

| Pfad | Rolle |
|------|------|
| `xtendrmt/surface-workbench.rmt` | RMT-first Workbench Fixture |
| `xtendrmt-surface-workbench.html` | generischer Host ohne manuelle Surface-Markup |
| `xtendrmt/surface-workbench.js` | kleiner DOM-Descriptor Renderer fuer die Workbench |
| `tests/browser/fixtures/rmt-surface-workbench-smoke.html` | vorbereitete browsernahe Smoke-Fixture |
| `catalog/surface-manager-workbench-fixture.js` | maschinenlesbarer Contract |
| `tests/rmt/surface_manager_workbench_fixture_suite.js` | lokaler Gate |

## Mindestmodell

Das RMT-Dokument muss diese Struktur tragen:

- `app.shell` als shell-first Einstieg
- `app.router` als route-bound Surface Outlet
- `workbench.manager` als `x-surface-manager`
- zwei `x-surface-window` Records: `workbench.inspector`, `workbench.editor`
- ein `x-side-panel` Record: `workbench.properties`
- `metadata.surfaceManager.snapshotKey = "xtend.surface.snapshot"`
- Surface Records mit `metadata.surface.route = "workbench"`
- `dom_descriptor` Templates, keine `html_fragment` Boundary
- Events ausschliesslich als `dom-event-to-rmt-command`

## Host Boundary

Der Host darf keine manuelle App Shell und keine statischen Surface-Komponenten enthalten. Er stellt nur den Root bereit:

```html
<div
  data-rmt-host="surface-workbench"
  data-rmt-document-src="xtendrmt/surface-workbench.rmt"></div>
```

Der XTendLoader bleibt die einzige Komponentensicherstellung:

```html
<script type="module" src="xtend-loader.js" data-manifest="components/manifest.json"></script>
```

## Runtime Boundary

`xtendrmt/surface-workbench.js` darf DOM materialisieren, aber keine neue RMT-Kernel-Abhaengigkeit erzeugen. Er nutzt, falls vorhanden, `AppModules.createRmtFormat()` fuer Parsing und Registries. Der Renderer darf kein `innerHTML` verwenden und setzt den Shell-Inhalt ueber DOM Nodes und `root.replaceChildren(shellFragment)`.

## Snapshot

Der shared Surface Snapshot wird ueber `x-surface-manager.snapshot()` gelesen, sobald die Custom Elements bereit sind. Falls die Custom Elements in einer statischen Umgebung nicht definiert sind, liefert der Renderer einen `dom-fallback` Snapshot aus den gerenderten `x-surface-window` und `x-side-panel` Knoten. Beide Formen behalten das Schema `xtend.surface.snapshot.v1`.

## Done Criteria

- RMT-Dokument normalisiert ueber `xtendrmt/rmt-core.esm.js`
- Host enthaelt keine statische Surface-Shell
- Runtime rendert `app.shell.template` und bindet `workbench` als Route
- DOM enthaelt zwei Windows und ein SidePanel aus Component Records
- Route bindet alle drei Surfaces und den shared Snapshot Key
- Package, Scaffold, Docs und Runner kennen den Gate
- Lokaler Gate:

```bash
node scripts/run_xtend_tests.js surface-workbench-fixture --json
```

## Handoff

`WP-SM-06` kann auf dieser Fixture die Overlay-Kompatibilitaet und Stack-Bridge vorbereiten. Die Workbench bleibt bewusst RMT-first und komponentennah; eine native RMT `surfaces` Domain bleibt fuer `WP-SM-08` reserviert.

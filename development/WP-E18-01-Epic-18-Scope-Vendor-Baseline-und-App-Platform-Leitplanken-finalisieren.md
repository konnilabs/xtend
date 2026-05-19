# WP-E18-01 - Epic-18-Scope, Vendor-Baseline und App-Platform-Leitplanken finalisieren

- Status: `completed`
- Datum: 2026-05-19
- Epic Docs: `docs/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- WP Contract: `xtend.epic18.wp01.scope-vendor-baseline-app-platform-guardrails.v1`
- Zielzustand: `epic18-startable-with-rmt-app-platform-guardrails`
- Boundary: `no-media-manager-product-surface-copy`
- Boundary: `no-unreviewed-vendor-directory-copy`
- Boundary: `normal-app-ui-must-not-require-external-innerhtml-hosts`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js references --json`

## Ziel

`WP-E18-01` macht Epic 18 operativ startbar. Das Paket friert ein, welche
Vendor-Deltas kurzfristig in main zurueckfliessen sollen und welche groesseren
Lessons Learned als generische RMT-App-Platform-Anforderungen gelten.

Die wichtigste Entscheidung:

- Die Media-Manager-Vendor-Version ist eine Bugfix-Quelle, aber keine
  unkontrollierte Kopiervorlage.
- Der Media Manager ist ein Proof-of-Need fuer App-Platform-Faehigkeiten, aber
  keine Ziel-App, die 1:1 in XTend nachgebaut wird.
- RMT soll Entwickler befähigen, eigene App-Strukturen, Komponentenfamilien,
  Datenquellen, Actions, Events, Resources und dynamische Layouts nativ zu
  modellieren.
- Normale App-UI darf nicht darauf angewiesen sein, dass Produktcode grosse
  `innerHTML`-Renderer, manuelle Event-Delegation oder eigene Mini-Runtimes
  neben XTend betreibt.

## Source-of-Truth

| Artefakt | Rolle |
|----------|-------|
| `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/xtend-component-bugfixes.md` | Bugfix- und Lessons-Learned-Quelle |
| `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/vendor-build.md` | Vendor Snapshot, Package-Metadaten und Build-Befehle |
| `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/architecture.md` | Produktnahe RMT-/Shell-/Surface-Probe |
| `/home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend` | Vendor-Dateibaum fuer Paritaetsvergleich |
| `docs/epic18-media-manager-vendor-upstream.md` | oeffentliche Epic-18-Dokumentation |
| `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md` | operative Workpackage-Reihenfolge |

## Vendor-Baseline

Der aktuelle Vergleich von XTend main gegen den Vendor-Baum ergibt genau fuenf
fachliche Komponentenabweichungen:

| Datei | Delta | Bedeutung fuer Epic 18 |
|-------|-------|------------------------|
| `components/xplayer.js` | `145` Zeilen Delta | ES-Modul-Importfix, Containment, ResizeObserver, Titel-Ellipsis, Volume-Hover, native Playback-Events |
| `components/xtooltip.js` | `112` Zeilen Delta | `viewport-fixed-layer`, Scroll-/Resize-Repositionierung, Anti-Clipping in Surface/Shell-Containern |
| `components/xsidepanel.js` | `12` Zeilen Delta | horizontale Scrollbar-Grenze und placement-abhaengiges Collapse-Icon |
| `components/xsurfacemanager-controller.js` | `10` Zeilen Delta | Re-Register bewahrt Runtime-Bounds, Status und Placement |
| `components/xsurfacewindow.js` | `3` Zeilen Delta | vertikales Content-Scrolling ohne horizontale Surface-Scrollbar |

Statistik:

```text
5 files changed, 241 insertions(+), 41 deletions(-)
```

Nicht-fachliche Abweichungen:

| Bereich | Ergebnis |
|---------|----------|
| `xtend-builder/` | nur lokale `.DS_Store` |
| `tools/` | nur lokale `.DS_Store` |
| `xtendrmt/` | nur lokale `.DS_Store` |
| `fabric/` | deckungsgleich |
| `a11y/` | deckungsgleich |
| `security/` | deckungsgleich |
| `catalog/` | deckungsgleich |

Damit ist `WP-E18-02` eng genug geschnitten: keine Vendor-Komplettkopie,
sondern ein gezielter Backport der fuenf Komponenten.

## App-Platform-Leitplanken

Epic 18 fuehrt die Lessons Learned in generische RMT-Faehigkeiten ueber:

- App Authoring Model fuer `app`, `route`, `surface`, `slot`, `template`,
  `component`, `state`, `selector`, `derive`, `repeat`, `when`, `bind`,
  `action`, `effect`, `datasource`, `resource` und `event`
- sicherer DOM Descriptor Renderer statt externer HTML-String-Renderer
- Component-native Template Primitives fuer beliebige XTend Custom Elements
- Typed State, Selectors, derived Values und XState Bridge
- Actions, Effects, DataSources und Resource Ownership
- deklaratives Event Routing mit Payload Contracts
- generischer Surface-, Overlay-, Portal- und Resource-Graph
- Scaffold-, Linter-, LSP- und Diagnostics-Unterstuetzung
- domain-neutrale App-Platform-Fixture statt Media-Manager-Kopie

## Nicht-Ziele

- Kein 1:1-Nachbau der Media-Manager-Surfaces als XTend-Default-App.
- Keine MediaRecord-Pflicht fuer RMT-App-Platform-Fixtures.
- Keine produktlokalen Theme- oder Shadow-DOM-Monkeypatches als globale
  XTend Defaults.
- Keine ungepruefte Kopie des gesamten Vendor-Verzeichnisses.
- Keine harte XTend-Komponenten-Kopplung im RMT Kernel.
- Kein produktiver Electron-/Node-Backend-Adapter im XTend Framework.

## Startfreigabe

`WP-E18-01` gibt zwei parallele Linien frei:

| Paket | Status nach WP-E18-01 | Startgrund |
|-------|------------------------|------------|
| `WP-E18-02` | `ready` | Die fuenf Vendor-Komponenten-Deltas sind konkret und regressionsrelevant. |
| `WP-E18-04` | `ready` | Das RMT App Platform Authoring Model kann konzeptionell starten, ohne den Bugfix-Backport zu blockieren. |

`WP-E18-03` bleibt `next`, weil es sinnvoll auf den konkreten Backport aus
`WP-E18-02` folgt.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Vendor-Baseline ist erfasst | erfuellt: fuenf Komponenten-Deltas, Rest nur `.DS_Store` oder deckungsgleich |
| Bugfix-Linie ist startbar | erfuellt: `WP-E18-02` ist `ready` |
| RMT-App-Platform-Linie ist startbar | erfuellt: `WP-E18-04` ist `ready` |
| Media Manager bleibt Proof-of-Need | erfuellt: kein Produkt-Surface-Klon als Ziel-API |
| Trusted-DOM-Boundary bleibt explizit | erfuellt: normale App-UI soll ueber DOM Descriptoren laufen |
| RMT-Kernel-Boundary bleibt intakt | erfuellt: `no-rmt-kernel-import-of-xtend-types` bleibt Leitplanke |

## Verifikation

Baseline-Befehle:

```bash
git diff --no-index --stat components /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/components
diff -qr components /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/components
diff -qr xtend-builder /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/xtend-builder
diff -qr tools /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/tools
diff -qr xtendrmt /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/xtendrmt
diff -qr fabric /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/fabric
diff -qr a11y /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/a11y
diff -qr security /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/security
diff -qr catalog /home/konni/Dokumente/net.ccs.cloud/media-manager/vendor/xtend/catalog
```

Lokaler Referenz-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

## Handoff

`WP-E18-01` ist abgeschlossen. Der naechste Implementierungsschritt kann
entweder die konkrete Bugfix-Linie (`WP-E18-02`) oder die Plattform-
Authoring-Linie (`WP-E18-04`) starten.

Empfohlene Reihenfolge fuer den naechsten Code-Slice:

1. `WP-E18-02` fuer die fuenf Komponenten-Fixes.
2. `WP-E18-03` fuer Regression-Smokes.
3. `WP-E18-04` parallel oder direkt danach fuer das RMT App Platform Authoring
   Model.


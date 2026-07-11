# Backlog - XTend SurfaceManager App Shell und RMT Surface Runtime

- Status: `ready`
- Datum: 13. Mai 2026
- Contract: `xtend.surface-manager.runtime-backlog.v1`
- Zielzustand: `rmt-native-app-shell-surface-runtime`
- Folge auf: `WP-SM-09`
- Boundary: `no-public-runtime-claim-for-xtend.surface-adapter-until-WP-SM-10`
- Boundary: `no-second-surface-registry`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `surface-manager-supports-xtend-ui-does-not-replace-fabric`
- Bezug:
  - `development/XTend-SurfaceManager-und-Multi-Window-Plan.md`
  - `development/XTend-SurfaceManager-Release-Handoff-Contract.md`
  - `development/XTend-SurfaceManager-Native-RMT-Surfaces-Domain-Contract.md`
  - `development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md`
  - `development/XTendRMT-vNext-Surface-Registry-Contract.md`
  - `development/XTendRMT-vNext-Remote-Surface-Manifest-Contract.md`
  - `development/XTendRMT-vNext-Remote-Surfaces-Threat-Model-Contract.md`
  - `development/docs-evidence/root/surface-manager-release-handoff.md`
  - `docs/en/surface-manager-authoring-guide.md`
  - `docs/surface-manager-native-rmt-surfaces.md`
  - `components/xsurfacemanager.js`
  - `components/xsurfacemanager-controller.js`
  - `components/xsurfacewindow.js`
  - `components/xsidepanel.js`
  - `components/xsurfaceoverlay-bridge.js`
  - `catalog/surface-manager-native-rmt-surfaces.js`
  - `xtendrmt/surface-workbench.rmt`

## Zweck

Dieses Backlog fuehrt die nach `WP-SM-09` offenen SurfaceManager-Scopes in startbare Arbeitspakete. Die erste SurfaceManager-Linie ist authoring- und gatebereit: App Shells koennen mit `x-surface-manager`, `x-surface-window`, `x-side-panel` und Overlay-Bridge betrieben und ueber RMT-Komponentenmetadata beschrieben werden.

Der naechste Reifegrad ist eine produktive, shell-first Runtime fuer native RMT `surfaces[*]`. Diese Runtime darf keine neue Plattform neben XTend UI, Fabric oder dem RMT Kernel bilden. Sie ist eine Adapter- und Materialisierungsschicht, die deklarative Surface Records in bestehende XTend-Komponenten, SurfaceController-Operationen, Loader-Hydration, xstate-Spiegelung und Fabric-Diagnostics uebersetzt.

## Leitplanken

- `x-surface-manager` bleibt die UI-nahe Orchestrierungsschicht fuer App Shells.
- Der SurfaceController bleibt die einzige Surface-Registry innerhalb der XTend-UI-Runtime.
- `xtend.surface` ist ein Host-/Adapterpfad ueber bestehende XTend-Komponenten, keine zweite Runtime.
- RMT beschreibt Surface-Intent, Komponentenbindung, Route, Schedule, Policy und Fallback, fuehrt aber keine XTend- oder Remote-Runtime aus.
- Fabric bleibt fuer Fibers, Lanes, Diagnostics, Error Boundary, Telemetry und Backpressure zustaendig.
- XTendLoader bleibt fuer Komponentenauflosung, CSS-/StyleRegistry, Hydration Policies, Lazy Loading und Skeleton Loading zustaendig.
- Remote Surfaces muessen explizite Owner-, Version-, Integrity-, Capability-, Trust- und Degradation-Records besitzen.
- Shell-first ist ein Abnahmekriterium: App Shell und Surface Chrome duerfen nicht durch Content-Hydration blockieren.
- Ungestylter Surface-Content darf nicht aufpoppen. Im Zweifel gewinnt stabile Hydration gegen fruehere FCP.

## Nicht-Ziele

- Kein globaler `window.XTendSurfaceManager` als neue Infrastrukturquelle.
- Kein Import von XTend-Komponenten in den RMT Kernel.
- Keine direkte Remote-Code-Ausfuehrung aus RMT Records.
- Keine Ablosung von Fabric durch Surface-spezifische Telemetry.
- Keine Monkeypatch-Loesung fuer die Doku-App als Ersatz fuer framework-native Loader-, Router- oder Surface-Policies.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- betroffene Runtime-, RMT-, Loader-, Router-, Fabric- und Testpfade benannt sind
- die Kernel Boundary explizit unveraendert bleibt
- die Beziehung zum SurfaceController und zu `xstate` geklaert ist
- Shell-first, Skeleton Loading und ungestylter Content als Akzeptanzkriterien beruecksichtigt sind
- lokale Gates oder bewusstes Handoff definiert sind
- keine Netzwerk- oder CDN-Abhaengigkeit fuer lokale Tests entsteht
- Migration von bestehender Komponentenmetadata zu nativen `surfaces[*]` nicht gebrochen wird

## Priorisierungslogik

- `P0`: schafft den produktiven Runtime-Pfad fuer native `surfaces[*]` oder verhindert Shell-/Hydration-Regressionen
- `P1`: haertet App-Shell-Verhalten, Persistenz, Routing, Focus, Layout und Remote-Boundaries
- `P2`: erweitert Surface-Typen, Doku, Migration, Browser-Lab und Release-Handoff

## Statuslogik

- `ready`: kann sofort gestartet werden
- `next`: fachlich naechster Schritt, braucht aber einen kurzen Vorgaenger
- `planned`: Teil des Zielbilds, aber noch nicht unmittelbar startbar
- `blocked`: benoetigt benannte Vorarbeit
- `completed`: Zielartefakt ist erstellt und gatebar

## Naechste startbare Workpackages

| ID | Grund |
|----|-------|
| `surface-runtime-maintenance` | Surface Runtime ist nach `WP-SM-19` releasefaehig; naechste Schritte sind projektbezogene Haertung oder Release-Owner-Signoff |

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-SM-10` | P0 | completed | WS1 | Produktive `xtend.surface` Adapter Runtime bauen | `WP-SM-09` |
| `WP-SM-11` | P0 | completed | WS1/WS2 | Native `surfaces[*]` in XTend-UI-Komponenten materialisieren | `WP-SM-10` |
| `WP-SM-12` | P0 | completed | WS3 | Persistenz, `restore-key` und Snapshot-Hydration implementieren | `WP-SM-10`, `WP-SM-11` |
| `WP-SM-13` | P0 | completed | WS4 | Shell-first Lazy Surface Loading mit Skeleton-Hydration bauen | `WP-SM-10` |
| `WP-SM-14` | P1 | completed | WS5 | XRouter-gebundene Surface Lifecycles definieren und umsetzen | `WP-SM-10`, `WP-SM-11` |
| `WP-SM-15` | P1 | completed | WS6 | Modal-, Focus-, Inert- und Mixed-Stack-Policy haerten | `WP-SM-10` |
| `WP-SM-16` | P1 | completed | WS7 | Docking, Split Panes, Tiling und weitere Layout Engines ergaenzen | `WP-SM-12`, `WP-SM-15` |
| `WP-SM-17` | P1 | completed | WS8 | Remote Surface Trust, Ownership und Capability Policies anbinden | `WP-SM-10`, `WP-E16-03`, `WP-E16-05` |
| `WP-SM-18` | P2 | completed | WS9 | Browser-Lab, Pixel-Baselines und echte App-Shell-Projektproben ausbauen | `WP-SM-13`, `WP-SM-15` |
| `WP-SM-19` | P2 | completed | WS10 | Migration, Doku und Release-Handoff fuer Surface Runtime finalisieren | `WP-SM-10` bis `WP-SM-18` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS1 | `xtend.surface` Adapter Runtime und Controller-Bruecke |
| WS2 | RMT Surface Template Materialisierung |
| WS3 | Snapshot Persistenz und Restore |
| WS4 | Shell-first Lazy Loading, Hydration und Skeletons |
| WS5 | Route-aware Surface Lifecycles |
| WS6 | Focus, Modalitaet, Inert und Stack-Policies |
| WS7 | Layout Engines fuer produktive App Shells |
| WS8 | Remote Surface Trust und Enterprise Registry |
| WS9 | Browsernahe Qualitaetsgates |
| WS10 | Doku, Migration und Release-Handoff |

## Workpackages im Detail

### WP-SM-10 - Produktive `xtend.surface` Adapter Runtime bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Den bisherigen Handoff-Contract `xtend.surface.adapter.v1` als produktiven Host-Adapter ueber der bestehenden XTend-UI-Surface-Familie implementieren
- Scope:
  - Adapter-Registration im RMT-/XTend-Hostpfad
  - Konsum von normalisierten `surfaces[*]`
  - Mapping auf SurfaceController-Operationen `register`, `open`, `close`, `focus`, `move`, `resize`, `update`, `snapshot`
  - Fabric-Diagnostics ueber bestehende Boundary, nicht als eigene Telemetry
  - xstate-Spiegelung ueber bestehenden SurfaceController
  - Fehler- und Capability-Diagnostics bei ungueltigen Surface Records
- Nicht im Scope:
  - neue globale Registry
  - RMT-Kernel-Importe von XTend-Komponenten
  - Remote Runtime Execution
- Zielartefakte:
  - Runtime Adapter fuer `xtend.surface`
  - aktualisierte Adapter-Contract-Doku
  - Contract-/Runtime-Suite fuer produktiven Adapterpfad
- Definition of Done:
  - `runtimeImplemented: true` ist nur fuer den produktiven Host-Adapter gesetzt
  - bestehende Component-Metadata-Authoring-Pfade bleiben kompatibel
  - `surface-native-rmt` erhaelt eine Runtime-Probe statt reinem Handoff-Check

### WP-SM-11 - Native `surfaces[*]` in XTend-UI-Komponenten materialisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - RMT Templates koennen eine App Shell mit mehreren Surfaces deklarieren, ohne manuell jede Surface-Komponente als parallelen Component Record pflegen zu muessen
- Scope:
  - Materialisierung von `surfaces[*].manager`, `component`, `route`, `schedule`, `bounds`, `placement`, `mode`, `capabilities`, `a11y`, `persistence`
  - Generierung oder Bindung von `x-surface-manager`, `x-surface-window`, `x-side-panel` und Overlay-Kompatibilitaetsflaechen
  - stabile Identity zwischen `surfaces[*].id`, DOM-Attributen und Controller Records
  - Migration von `components[*].metadata.surface` zu nativen Surface Records
  - Authoring-Diagnostics bei widerspruechlichen Component-/Surface-Records
- Zielartefakte:
  - `materializeSurfaces()` im `xtend.surface` Adapter
  - `catalog/surface-manager-materialization.js`
  - `tests/fixtures/rmt-surface-materialization-shell.rmt`
  - `tests/rmt/surface_manager_materialization_suite.js`
  - `development/WP-SM-11-Native-surfaces-in-XTend-UI-Komponenten-materialisieren.md`
- Definition of Done:
  - ein natives `surfaces[*]` Fixture rendert live eine Surface App Shell
  - keine zweite Registry entsteht
  - Component Records bleiben als Content- und Fallback-Bindung nutzbar
  - bestehende Surface-DOM-Elemente werden gebunden statt dupliziert
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-native-materialization --json`

### WP-SM-12 - Persistenz, `restore-key` und Snapshot-Hydration implementieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Surface Layouts und Lifecycle-Zustaende koennen kontrolliert gespeichert, geladen und invalidiert werden
- Scope:
  - `restore-key` am `x-surface-manager`
  - `persistence.mode`: `none`, `memory`, `session`, `local`
  - Snapshot-Versionierung und Schema-Migration
  - Restore-Reihenfolge fuer Manager, Surfaces, Bounds, Stack, Active Surface und Panel Modes
  - Opt-out und Reset-Verhalten fuer App Shells
  - Diagnostics bei inkompatiblen Snapshots
- Zielartefakte:
  - Persistenzadapter ausserhalb des Controller-Kerns in `components/xsurfacemanager.js`
  - Public Types in `components/xsurfacemanager.d.ts`
  - `catalog/surface-manager-persistence.js`
  - Browsernahe Fixture `tests/components/fixtures/xsurfacemanager-persistence.component.html`
  - Gate `tests/components/surface_manager_persistence_suite.js`
  - Doku `docs/surface-manager-persistence.md`
  - Workpackage-Doku `development/WP-SM-12-Persistenz-restore-key-und-Snapshot-Hydration-implementieren.md`
- Definition of Done:
  - Reload mit `restore-key` stellt ein Surface Layout wieder her
  - ungueltige Snapshots fuehren zu kontrolliertem Fallback
  - keine Persistenz erfolgt ohne explizite Policy
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-persistence --json`

### WP-SM-13 - Shell-first Lazy Surface Loading mit Skeleton-Hydration bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Surface Chrome und App Shell laden sofort, waehrend teure Surface-Inhalte lazy, route- oder intent-gesteuert geladen und bis zur Hydration skeletonisiert werden
- Scope:
  - Loader-Integration fuer Surface Content Refs
  - `XTendLoader.ensureComponent` und `hydrateTree` fuer Surface-Scopes
  - SkeletonLoader fuer Surface Content, Parsedown-Container und remote/faehige Content Slots
  - Hydration-Policy pro Surface: `eager`, `visible`, `open`, `idle`, `route`
  - Schutz gegen ungestylten Pop-In durch StyleRegistry-/Component-Ready-Gates
  - Diagnostics fuer Ladezeit, Hydration, Fallback und Timeout
- Zielartefakte:
  - Surface Loading Policy Contract `xtend.surface.loading-policy.v1`
  - Runtime-Unterstuetzung in Loader/SurfaceManager
  - Workbench-Fixture mit lazy Surface Content
  - `catalog/surface-manager-lazy-loading.js`
  - `tests/components/surface_manager_lazy_hydration_suite.js`
  - `tests/components/fixtures/xsurfacemanager-lazy-hydration.component.html`
  - `development/docs-evidence/root/surface-manager-lazy-hydration.md`
  - `development/WP-SM-13-Shell-first-Lazy-Surface-Loading-mit-Skeleton-Hydration-bauen.md`
- Definition of Done:
  - Shell-first bleibt auch bei schweren Surface-Inhalten stabil
  - kein ungestylter Content poppt vor Hydration sichtbar auf
  - Surface-Gates pruefen Skeleton-Zustaende und hydrated-Zustaende
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-lazy-hydration --json`

### WP-SM-14 - XRouter-gebundene Surface Lifecycles definieren und umsetzen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Surfaces koennen an Routen, Subrouten und Route-Scopes gebunden werden, ohne Shell und Stack-Zustand zu zerreissen
- Scope:
  - `route-aware` auf Manager-Ebene
  - Route-bound open/close/collapse/restore Policies
  - Lazy Route Payloads fuer Surface Content
  - Cleanup bei Routewechsel, Back/Forward und Redirect
  - optional persistente, route-unabhaengige Surfaces
  - Integration mit XRouter Events und RMT Route Records
- Zielartefakte:
  - Route Surface Lifecycle Contract `xtend.surface.route-lifecycle.v1`
  - Router-Smoke mit mehreren Surface-Zonen
  - Authoring Guide fuer route-bound und global surfaces
  - `catalog/surface-manager-route-lifecycle.js`
  - `tests/components/surface_manager_route_lifecycle_suite.js`
  - `tests/components/fixtures/xsurfacemanager-route-lifecycle.component.html`
  - `development/docs-evidence/root/surface-manager-route-lifecycle.md`
  - `development/WP-SM-14-XRouter-gebundene-Surface-Lifecycles-definieren-und-umsetzen.md`
- Definition of Done:
  - route-bound Surfaces werden reproduzierbar geladen, geschlossen und wiederhergestellt
  - globale Surfaces bleiben routewechselstabil
  - Router und SurfaceManager besitzen keine konkurrierenden Lifecycle-Quellen
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-route-lifecycle --json`

### WP-SM-15 - Modal-, Focus-, Inert- und Mixed-Stack-Policy haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Gemischte Surface-Stacks aus Windows, SidePanels, Dialogen, Modals und Drawern erhalten konsistente Focus-, Escape-, Inert- und Layer-Regeln
- Scope:
  - `modal-policy` am Manager produktiv nutzen
  - Focus Trap und Focus Restore ueber Surface-Grenzen
  - Inert/aria-hidden fuer Hintergrundbereiche
  - Escape- und Close-Prioritaet im gemischten Stack
  - Scroll Lock und Layer Tokens
  - A11y Diagnostics fuer fehlende Labels oder blockierte Focus-Ziele
- Zielartefakte:
  - Stack Policy Contract `xtend.surface.stack-policy.v1`
  - `catalog/surface-manager-stack-policy.js`
  - `tests/components/surface_manager_stack_policy_suite.js`
  - `tests/components/fixtures/xsurfacemanager-stack-policy.component.html`
  - `docs/surface-manager-stack-policy.md`
  - `development/WP-SM-15-Modal-Focus-Inert-und-Mixed-Stack-Policy-haerten.md`
- Definition of Done:
  - Modalitaet ist im Manager und in Overlays konsistent
  - bestehende Overlay-Komponenten bleiben kompatibel
  - Tastatur- und Screenreader-Verhalten ist gatebar
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-stack-policy --json`

### WP-SM-16 - Docking, Split Panes, Tiling und weitere Layout Engines ergaenzen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - App Shells koennen neben freien Fenstern auch docked Workspaces, Split Panes, Command Palettes und tiled Layouts ausdruecken
- Scope:
  - Layout Engine Contract fuer `freeform`, `docked`, `split`, `tile`, `stacked`
  - Dock/Undock-Operationen als Controller- oder Adapter-Contract
  - Bounds-Normalisierung mit Viewport-Constraints
  - Collision-/Snap-Regeln
  - Responsive Fallbacks fuer mobile Viewports
  - Snapshot-Kompatibilitaet mit Persistenz
- Zielartefakte:
  - Layout Engine Contract `xtend.surface.layout-engine.v1`
  - `catalog/surface-manager-layout-engines.js`
  - `tests/components/surface_manager_layout_engines_suite.js`
  - `tests/components/fixtures/xsurfacemanager-layout-engines.component.html`
  - `docs/surface-manager-layout-engines.md`
  - `development/WP-SM-16-Docking-Split-Panes-Tiling-und-Layout-Engines-ergaenzen.md`
- Definition of Done:
  - Layout-Wechsel sind snapshotbar
  - Docking ist nicht nur Metadata, sondern sichtbares Runtime-Verhalten
  - mobile und desktop Viewports besitzen stabile Fallbacks
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-layout-engines --json`

### WP-SM-17 - Remote Surface Trust, Ownership und Capability Policies anbinden

- Prioritaet: `P1`
- Status: `planned`
- Ziel:
  - SurfaceManager und `xtend.surface` Adapter koennen E16 Remote-Surface-Records sicher konsumieren, ohne Remote Runtime im RMT Kernel auszufuehren
- Scope:
  - Owner-, Version-, Integrity-, Origin- und Capability-Pruefung
  - Enterprise Surface Registry Lookup
  - Trust Boundary und Sandbox Policy als Host-Entscheidung
  - Degradation und Fallback Surface bei Policy-Verletzung
  - Capability Refusal Diagnostics am SurfaceManager
  - Event-Governance-Anbindung fuer Cross-Surface Events
- Zielartefakte:
  - Remote Surface Policy Bridge
  - Enterprise MFE Surface Fixture
  - Security-/Degradation-Smoke
- Umgesetzte Artefakte:
  - `catalog/surface-manager-remote-policy.js`
  - `tests/components/surface_manager_remote_policy_suite.js`
  - `tests/components/fixtures/xsurfacemanager-remote-policy.component.html`
  - `development/docs-evidence/root/surface-manager-remote-policy.md`
  - `development/WP-SM-17-Remote-Surface-Trust-Ownership-und-Capability-Policies-anbinden.md`
- Definition of Done:
  - Remote Surface Records koennen sicher abgelehnt, degradiert oder gemountet werden
  - alle Entscheidungen sind diagnostizierbar
  - der RMT Kernel bleibt deklarativ und remote-runtime-frei
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-remote-policy --json`

### WP-SM-18 - Browser-Lab, Pixel-Baselines und echte App-Shell-Projektproben ausbauen

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Die Surface Runtime wird gegen echte App-Shell-Nutzung und visuelle Stabilitaet abgesichert
- Scope:
  - Browser-Lab Fixture fuer Multi Surface Shell
  - Pixel-Baselines fuer Kaltstart, Skeleton, hydrated, route-change, modal-stack
  - Layout Shift und ungestylter Content als Regression-Kriterium
  - Performance Budgets fuer open/focus/route/hydrate
  - Smoke gegen Docs-App oder Referenz-Workbench
- Zielartefakte:
  - Browser-Lab-Gate
  - visuelle Snapshot-Artefakte
  - Performance- und CLS-Report
- Umgesetzte Artefakte:
  - `catalog/surface-manager-browser-lab.js`
  - `tests/browser/surface_manager_browser_lab_suite.js`
  - `tests/browser/fixtures/surface-manager-browser-lab.html`
  - `tests/browser/visual-baselines/surface-manager-browser-lab.dom-baseline.json`
  - `development/docs-evidence/root/surface-manager-browser-lab.md`
  - `development/WP-SM-18-Browser-Lab-Pixel-Baselines-und-App-Shell-Projektproben-ausbauen.md`
- Definition of Done:
  - Surface-Shell-Kaltstart ist visuell gatebar
  - Skeleton- und Hydration-Zustaende sind reproduzierbar
  - Regressionen gegen Pop-In und Layout Shift schlagen lokal fehl
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-browser-lab --json`

### WP-SM-19 - Migration, Doku und Release-Handoff fuer Surface Runtime finalisieren

- Prioritaet: `P2`
- Status: `planned`
- Ziel:
  - Die produktive Surface Runtime wird dokumentiert, migrierbar und releasefaehig
- Scope:
  - Authoring Guide fuer native `surfaces[*]`
  - Migration von Component Metadata zu Surface Records
  - Adapter Runtime Handoff
  - Compatibility Notes fuer bestehende SurfaceManager-Fixtures
  - Release-Gate-Matrix
  - Known Residuals und SemVer-Hinweise
- Zielartefakte:
  - aktualisierte `docs/surface-manager-*`
  - Release Handoff Contract
  - Migration Guide Update
- Umgesetzte Artefakte:
  - `catalog/surface-manager-runtime-release-handoff.js`
  - `tests/rmt/surface_manager_runtime_release_handoff_suite.js`
  - `development/XTend-SurfaceManager-Runtime-Release-Handoff-Contract.md`
  - `development/WP-SM-19-Migration-Doku-und-Release-Handoff-fuer-Surface-Runtime-finalisieren.md`
  - `development/docs-evidence/root/surface-manager-runtime-release-handoff.md`
  - Updates in `docs/en/surface-manager-authoring-guide.md`, `docs/en/surface-manager-migration-guide.md` und `development/docs-evidence/root/surface-manager-release-handoff.md`
- Definition of Done:
  - produktiver Runtime-Claim ist dokumentiert und gatebar
  - Handoff benennt offene Scopes explizit
  - bestehende SurfaceManager-Demos und Fixtures bleiben lauffaehig
  - lokaler Gate: `node scripts/run_xtend_tests.js surface-runtime-release-handoff --json`

## Gate-Kandidaten

```bash
node scripts/run_xtend_tests.js surface-adapter-runtime --json
node scripts/run_xtend_tests.js surface-native-materialization --json
node scripts/run_xtend_tests.js surface-persistence --json
node scripts/run_xtend_tests.js surface-lazy-hydration --json
node scripts/run_xtend_tests.js surface-route-lifecycle --json
node scripts/run_xtend_tests.js surface-stack-policy --json
node scripts/run_xtend_tests.js surface-layout-engines --json
node scripts/run_xtend_tests.js surface-remote-policy --json
node scripts/run_xtend_tests.js surface-browser-lab --json
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

Bestehende Gates bleiben Baseline:

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring surface-controller surface-manager surface-side-panel surface-workbench-fixture surface-overlay-bridge surface-manager-quality surface-native-rmt surface-release-handoff --json
```

## Abnahmekriterien fuer den Zielzustand

- Ein natives RMT-Dokument mit `surfaces[*]` materialisiert eine funktionale App Shell.
- Surface Chrome ist shell-first sichtbar und bleibt interaktiv, waehrend Content lazy hydriert.
- Ungestylter Content ist vor Hydration nicht sichtbar.
- SurfaceController bleibt die einzige Runtime-Registry.
- `xstate` enthaelt nachvollziehbare Snapshot-, Active- und Lifecycle-Spiegelungen.
- Fabric erhaelt Diagnostics/Fibers, wird aber nicht durch SurfaceManager ersetzt.
- Route-bound, persistent und remote-faehige Surfaces koennen koexistieren.
- Migration von Component Metadata zu nativen Surface Records ist dokumentiert und testbar.

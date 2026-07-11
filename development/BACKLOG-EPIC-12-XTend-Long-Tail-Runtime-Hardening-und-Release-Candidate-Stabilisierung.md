# Backlog zu Epic 12 - Long-Tail Runtime Hardening und Release Candidate Stabilisierung

- Status: Completed
- Datum: 7. Mai 2026
- Contract: `xtend.epic12.backlog.v1`
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Bezug:
  - `development/XTend-Epic11-Abschluss-und-Enterprise-UX-Handoff.md`
  - `development/WP-E11-18-Epic-11-Abschlussreview-und-Enterprise-UX-Handoff.md`
  - `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`
  - `development/XTend-Release-Checklist-und-SemVer-Policy.md`
  - `development/XTend-CI-Gate-Matrix.md`
  - `development/XTend-Epic12-RC-Hardening-Modell.md`
  - `development/WP-E12-01-Epic-12-Backlog-und-RC-Hardening-Modell-anlegen.md`
  - `development/WP-E12-02-x-tabs-Performance-Profile-und-Runtime-Budget-finalisieren.md`
  - `development/WP-E12-03-x-tabs-Browser-Keyboard-A11y-und-Theme-Smokes-haerten.md`
  - `development/WP-E12-04-x-theme-A11y-High-Contrast-und-Reduced-Motion-haerten.md`
  - `development/WP-E12-05-x-theme-Performance-Theme-Propagation-und-Density-Boundary-finalisieren.md`
  - `development/WP-E12-06-x-button-Performance-und-Interaction-Budget-nachziehen.md`
  - `development/WP-E12-07-x-menu-Performance-Keyboard-und-Router-Kompatibilitaet-haerten.md`
  - `development/WP-E12-08-xstate-Adapter-Typing-und-Lifecycle-Boundary-Probe-bauen.md`
  - `development/WP-E12-09-xutils-Utility-Import-Policy-und-Fixture-Probe-bauen.md`
  - `development/XTend-Visual-Snapshot-Automation-Contract.md`
  - `development/WP-E12-10-Visual-Snapshot-Automation-Contract-definieren.md`
  - `development/WP-E12-11-Snapshot-Fixture-und-lokalen-Diff-Runner-vorbereiten.md`
  - `development/XTend-Enterprise-Design-System-Token-Contract.md`
  - `development/WP-E12-12-Enterprise-Design-System-Token-Productization-vorbereiten.md`
  - `development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md`
  - `development/WP-E12-13-RMT-DSL-Authoring-Polish-fuer-Component-Shells-vorbereiten.md`
  - `development/XTend-RC0-Gate-Matrix.md`
  - `development/WP-E12-14-Release-Candidate-Gate-Matrix-fuer-RC0-schneiden.md`
  - `development/XTend-Epic12-Docs-Migration-und-Adoption-Guide.md`
  - `development/WP-E12-15-Docs-Migration-Notes-und-Enterprise-Adoption-Guide-aktualisieren.md`
  - `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md`
  - `development/WP-E12-16-Epic-12-Abschlussreview-und-RC0-Handoff.md`
  - `docs/design-tokens.md`
  - `docs/rmt-dsl-authoring-polish.md`
  - `docs/rc0-gate-matrix.md`
  - `docs/rc0-adoption-guide.md`
  - `development/docs-evidence/legacy-routes/en/epic12-rc0-handoff.md`
  - `docs/epic11-enterprise-ux-handoff.md`
  - `docs/en/component-long-tail-migration.md`
  - `docs/visual-browser-regression.md`
  - `docs/visual-snapshot-automation.md`
  - `development/docs-evidence/root/component-ux-gates.md`
  - `docs/enterprise-adoption.md`
  - `catalog/epic11-enterprise-ux-handoff.js`
  - `catalog/component-long-tail-migration.js`
  - `catalog/component-catalog-coverage.js`
  - `catalog/component-regression-priority.js`
  - `tests/platform/epic11_enterprise_ux_handoff_suite.js`
  - `tests/catalog/component_long_tail_migration_suite.js`
  - `tests/catalog/component_catalog_coverage_suite.js`
  - `tests/catalog/component_regression_priority_suite.js`

## Zweck

Dieses Backlog zerlegt Epic 12 in konkrete Workpackages. Epic 12 setzt den Handoff aus Epic 11 um: Die akzeptierten Long-Tail-Restpunkte werden nicht laenger nur geplant, sondern runtime-seitig, visuell, dokumentarisch und release-nah gehaertet.

Epic 11 hat XTend sichtbar enterprise-reif gemacht und den Abschlussmodus `completed-with-accepted-long-tail-handoff` gesetzt. Epic 12 schliesst diese Luecke produktorientiert:

- `x-tabs` erhaelt als P0-Restpunkt vollstaendige Performance- und Browser-Reife.
- `x-theme` wird fuer A11y, Performance, Theme Propagation und High-Contrast stabilisiert.
- `x-button` und `x-menu` werden als interaktive P1-Bausteine runtime-seitig abgeschlossen.
- `xstate` und `x-utils` erhalten Boundary-Probes statt kuenstlicher UI-Shells.
- Die bisher contract-basierte Theme-Matrix wird um echte visuelle Snapshot-Automation vorbereitet.
- Release Candidate Readiness wird erst nach Long-Tail- und Snapshot-Haertung bewertet.

## Leitplanken

- XTend-Komponenten bleiben native Web Components.
- XTendRMT bleibt framework-agnostisch; der RMT Kernel importiert keine XTend-Typen.
- Long-Tail-Haertung erfolgt inkrementell, nicht per Big-Bang-Refactor.
- Performance Profile, A11y Profile, Public Types, Fixtures und Component-Level-Suites werden pro Zielkomponente nachgezogen.
- Infrastrukturmodule wie `xstate` und `x-utils` werden als Adapter-/Boundary-Flaechen geprueft, nicht zu visuellen Komponenten umdefiniert.
- Visual Snapshot Automation baut auf `component-shell-theme-matrix` auf und ersetzt diese nicht.
- Release Candidate Packaging bleibt blockiert, bis die Epic-12-Gates gruen sind.
- `private: true` bleibt bis Release Owner Acceptance bestehen.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- Zielkomponente oder Gate-Flaeche klar benannt ist
- Restdimension aus Epic 11 sichtbar ist
- erwartete Runtime-, A11y-, Performance-, Type-, Fixture- und Docs-Aenderungen benannt sind
- RMT-, Fabric- und Component-Network-Grenzen explizit bleiben
- lokale Gates oder bewusstes Handoff definiert sind
- keine CDN- oder Netzwerk-Abhaengigkeit fuer lokale Tests entsteht
- keine harte XTend-Kopplung in XTendRMT eingefuehrt wird

## Priorisierungslogik

- `P0`: beseitigt Epic-11-P0-Restpunkte oder blockiert Release Candidate Readiness
- `P1`: haertet sichtbare interaktive P1-Komponenten und visuelle Qualitaetsgates
- `P2`: ergaenzt Docs, Migration Notes, RC-Checklisten und Handoff

## Statuslogik

- `ready`: kann sofort gestartet werden
- `in_progress`: ist fachlich und technisch in Bearbeitung
- `completed`: Zielartefakt ist erstellt und fuer den Epic wirksam
- `next`: ist als naechstes fachlich sinnvoll, braucht aber einen kurzen Vorgaenger
- `blocked`: sollte erst nach den benannten Abhaengigkeiten gestartet werden
- `planned`: ist Teil des Epics, aber noch nicht unmittelbar startbar

## Naechste startbare Workpackages

| ID | Grund |
|----|-------|
| - | Epic 12 ist abgeschlossen; naechste Entscheidung ist `release-owner-acceptance` ausserhalb dieses Backlogs |

`WP-E12-01` bis `WP-E12-16` sind abgeschlossen. Epic 12 endet mit dem Status `ready-for-release-owner-review-not-publish`: RC0 ist entscheidungsreif, aber Publishing bleibt bis Release Owner Acceptance blockiert.

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-E12-01` | P0 | completed | WS0 | Epic-12-Backlog und RC-Hardening-Modell anlegen | `WP-E11-18` |
| `WP-E12-02` | P0 | completed | WS1 | `x-tabs` Performance Profile und Runtime-Budget finalisieren | `WP-E12-01` |
| `WP-E12-03` | P0 | completed | WS1 | `x-tabs` Browser-, Keyboard-, A11y- und Theme-Matrix-Smokes haerten | `WP-E12-02` |
| `WP-E12-04` | P0 | completed | WS2 | `x-theme` A11y-, High-Contrast- und Reduced-Motion-Verhalten haerten | `WP-E12-01` |
| `WP-E12-05` | P0 | completed | WS2 | `x-theme` Performance Profile, Theme Propagation und Density Boundary finalisieren | `WP-E12-04` |
| `WP-E12-06` | P1 | completed | WS3 | `x-button` Performance Profile und Interaction Budget nachziehen | `WP-E12-02` |
| `WP-E12-07` | P1 | completed | WS3 | `x-menu` Performance Profile, Keyboard Navigation und Router-Kompatibilitaet haerten | `WP-E12-03` |
| `WP-E12-08` | P1 | completed | WS4 | `xstate` Adapter-, Typing- und Lifecycle-Boundary-Probe bauen | `WP-E12-01` |
| `WP-E12-09` | P1 | completed | WS4 | `x-utils` Utility-, Import-Policy- und Fixture-Probe bauen | `WP-E12-08` |
| `WP-E12-10` | P1 | completed | WS5 | Visual Snapshot Automation Contract definieren | `WP-E12-03`, `WP-E12-05`, `WP-E12-09` |
| `WP-E12-11` | P1 | completed | WS5 | Snapshot Fixture und lokaler Pixel-/DOM-Diff-Runner vorbereiten | `WP-E12-10` |
| `WP-E12-12` | P1 | completed | WS6 | Enterprise Design System Token Productization vorbereiten | `WP-E12-05`, `WP-E12-11` |
| `WP-E12-13` | P2 | completed | WS7 | RMT DSL Authoring Polish fuer Component Shells vorbereiten | `WP-E12-03`, `WP-E12-07`, `WP-E12-12` |
| `WP-E12-14` | P2 | completed | WS8 | Release Candidate Gate Matrix fuer RC0 schneiden | `WP-E12-11`, `WP-E12-12`, `WP-E12-13` |
| `WP-E12-15` | P2 | completed | WS9 | Docs, Migration Notes und Enterprise Adoption Guide aktualisieren | `WP-E12-14` |
| `WP-E12-16` | P2 | completed | WS10 | Epic-12-Abschlussreview und RC0-Handoff | `WP-E12-14`, `WP-E12-15` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Backlog, Hardening-Modell und RC-Readiness-Regeln |
| WS1 | `x-tabs` P0 Runtime Closure |
| WS2 | `x-theme` A11y, Performance und Theme Boundary |
| WS3 | `x-button` und `x-menu` interaktive P1-Haertung |
| WS4 | `xstate` und `x-utils` Adapter-/Boundary-Probes |
| WS5 | visuelle Snapshot-Automation |
| WS6 | Enterprise Design System Token Productization |
| WS7 | RMT DSL Authoring Polish |
| WS8 | Release Candidate Gate Matrix |
| WS9 | Docs, Migration Notes und Adoption |
| WS10 | Handoff und RC0-Abnahme |

## Workpackages im Detail

### WP-E12-01 - Epic-12-Backlog und RC-Hardening-Modell anlegen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Epic 12 in startbare Workpackages schneiden und ein RC-Hardening-Modell als Abnahmebasis definieren
- Scope:
  - Long-Tail-Restpunkte aus Epic 11
  - KPI-Entscheidungen aus `xtend.epic11.enterprise-ux-handoff.v1`
  - Zielreife `runtime-ready`, `visual-ready`, `rc-candidate-ready`
  - Gate-Reihenfolge fuer P0, P1, Boundary-Probes und RC0
  - Dokumentations- und Release-Handoff-Regeln
- Zielartefakte:
  - `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
  - `development/XTend-Epic12-RC-Hardening-Modell.md`
  - `development/WP-E12-01-Epic-12-Backlog-und-RC-Hardening-Modell-anlegen.md`
- Definition of Done:
  - Backlog liegt vor
  - RC-Hardening-Modell liegt vor
  - `WP-E12-02` ist startbar
  - Long-Tail-Komponenten sind mit Zielreife, Gate und Reihenfolge markiert

## Handoff nach WP-E12-01

`WP-E12-01` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.rc-hardening-model.v1`.

Erledigt:

- Backlog liegt in `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
- RC-Hardening-Modell liegt in `development/XTend-Epic12-RC-Hardening-Modell.md`
- Workpackage-Abnahme liegt in `development/WP-E12-01-Epic-12-Backlog-und-RC-Hardening-Modell-anlegen.md`
- `x-tabs`, `x-theme`, `x-button`, `x-menu`, `xstate` und `x-utils` sind mit Zielreife und Gate-Reihenfolge markiert
- `WP-E12-02` ist `ready`

Naechstes primaeres Paket:

- `WP-E12-02` `x-tabs` Performance Profile und Runtime-Budget finalisieren

### WP-E12-02 - `x-tabs` Performance Profile und Runtime-Budget finalisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - den P0-Restpunkt `x-tabs` aus Epic 11 auf Performance-Profile-Reife heben
- Scope:
  - `xtendScaffoldPerformanceProfile`
  - Hydration Policy und Lane-Ableitung
  - Tab-Switch-, Keyboard- und Render-Budget
  - Fabric Measurement und Regression Priority
  - RMT Shell Authoring Metadata
- Zielartefakte:
  - aktualisiertes `components/xtabs.js`
  - aktualisierte `components/xtabs.d.ts`
  - aktualisierte `tests/components/xtabs.component_suite.js`
  - aktualisierte `tests/components/fixtures/xtabs.component.html`
  - Workpackage-Doku `development/WP-E12-02-x-tabs-Performance-Profile-und-Runtime-Budget-finalisieren.md`
- Definition of Done:
  - `x-tabs` verliert die Restdimension `performance`
  - `catalog-coverage` markiert `x-tabs` als `enterprise-ready`
  - `component-ux-performance`, `component-long-tail-migration`, `regression-priority` und `references` bleiben gruen

## Handoff nach WP-E12-02

`WP-E12-02` ist abgeschlossen und hebt `x-tabs` auf `runtime-ready`.

Erledigt:

- `components/xtabs.js` enthaelt `xtendComponentContract`, `xtendRmtMetadata`, `xtendComponentLifecycleTelemetry` und `xtendScaffoldPerformanceProfile`
- Tab-Switch, Keyboard Action, Render Update und Hydration besitzen explizite Budgets
- `snapshotPerformance()` stellt lokale Messpunkte fuer Fabric-/Reporter-Adapter bereit
- `components/xtabs.d.ts` beschreibt Performance-Budget, Measurement und Snapshot-Typen
- `catalog-coverage` klassifiziert `x-tabs` als `enterprise-ready`
- `component-long-tail-migration` entfernt `x-tabs` aus den offenen Restpunkten

Naechstes primaeres Paket:

- `WP-E12-03` `x-tabs` Browser-, Keyboard-, A11y- und Theme-Matrix-Smokes haerten

### WP-E12-03 - `x-tabs` Browser-, Keyboard-, A11y- und Theme-Matrix-Smokes haerten

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `x-tabs` nicht nur contract-seitig, sondern in realen User Journeys stabilisieren
- Scope:
  - Arrow-Key Navigation
  - Home/End Verhalten
  - Focus Visible
  - `aria-selected`, `aria-controls`, `role=tablist`
  - Theme-, Density-, Motion- und Viewport-Szenarien
  - Browser-Smoke-Erweiterung
- Zielartefakte:
  - erweiterte Browser-Smoke-Fixtures
  - erweiterte Theme-Matrix-Ziele
  - Workpackage-Doku `development/WP-E12-03-x-tabs-Browser-Keyboard-A11y-und-Theme-Smokes-haerten.md`
- Definition of Done:
  - `component-ux-browser-smokes` deckt `x-tabs` explizit ab
  - `component-shell-theme-matrix` enthaelt `x-tabs` als P0 Journey
  - kein neues RMT-Kernel-Coupling entsteht

## Handoff nach WP-E12-03

`WP-E12-03` ist abgeschlossen und hebt `x-tabs` auf die browser- und theme-gehaertete P0-Linie.

Erledigt:

- `components/xtabs.js` verbindet Tabs und Panels ueber `aria-controls`, `aria-labelledby`, `role=tabpanel`, `aria-hidden` und roving `tabindex`
- Keyboard-Navigation umfasst `ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter` und `Space`
- `component-ux-browser-smokes` enthaelt `x-tabs` in der Navigation/Routing-Journey mit Arrow-, Home-/End- und ARIA-Checks
- `component-shell-theme-matrix` enthaelt `x-tabs` in der Navigation/Routing-Familie mit `tab-selected` und `tab-focus-visible`
- `browser` validiert beide Fixture-Contracts lokal ohne CDN- oder Importmap-Pfad

Naechstes primaeres Paket:

- `WP-E12-04` `x-theme` A11y-, High-Contrast- und Reduced-Motion-Verhalten haerten

### WP-E12-04 - `x-theme` A11y-, High-Contrast- und Reduced-Motion-Verhalten haerten

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `x-theme` als zentrale Theme Boundary fuer echte A11y stabilisieren
- Scope:
  - `forced-colors`
  - `prefers-reduced-motion`
  - Live Theme Change Announcements, falls sichtbar
  - System Preference Sync
  - `x-theme` als Provider statt visuelle Shell
- Zielartefakte:
  - aktualisiertes `components/xtheme.js`
  - aktualisierte `tests/components/xtheme.component_suite.js`
  - Workpackage-Doku `development/WP-E12-04-x-theme-A11y-High-Contrast-und-Reduced-Motion-haerten.md`
- Definition of Done:
  - `x-theme` verliert die Restdimension `a11y`
  - `screenreader-signals`, `motion-contrast`, `catalog-coverage` und `references` bleiben gruen

## Handoff nach WP-E12-04

`WP-E12-04` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.wp04.xtheme-a11y-motion-contrast.v1`.

Erledigt:

- `components/xtheme.js` enthaelt `xtendScaffoldA11yProfile` und `xtendMotionContrastPolicy`
- Reduced Motion wird ueber `prefers-reduced-motion`, `data-xtend-motion` und Motion-Tokens gespiegelt
- Forced Colors wird ueber `forced-colors`, `data-xtend-contrast`, `data-xtend-forced-colors` und System Color Tokens gespiegelt
- Theme- und Preference-Wechsel erzeugen `theme-preference-changed` und `theme-a11y-announcement`
- `components/xtheme.d.ts` beschreibt A11y Preferences, Motion-/Contrast-Policy und neue Document-Events
- `catalog-coverage` klassifiziert `x-theme` nun als `typed-contract-gated`
- `component-long-tail-migration` fuehrt `x-theme` nur noch mit Restdimension `performance`

Naechstes primaeres Paket:

- `WP-E12-05` `x-theme` Performance Profile, Theme Propagation und Density Boundary finalisieren

### WP-E12-05 - `x-theme` Performance Profile, Theme Propagation und Density Boundary finalisieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - `x-theme` auf Performance- und Propagation-Reife heben
- Scope:
  - Performance Profile
  - Theme/Density Propagation
  - Component Network Theme Context
  - RMT Shell Authoring Theme Metadata
  - Fabric Diagnostics fuer Theme-Wechsel
- Zielartefakte:
  - aktualisierte `x-theme` Runtime
  - Theme Propagation Fixture
  - Workpackage-Doku `development/WP-E12-05-x-theme-Performance-Theme-Propagation-und-Density-Boundary-finalisieren.md`
- Definition of Done:
  - `x-theme` ist nicht mehr `contract-gated`
  - `catalog-coverage` hebt `x-theme` auf `enterprise-ready`

## Handoff nach WP-E12-05

`WP-E12-05` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.wp05.xtheme-performance-propagation-density.v1`.

Erledigt:

- `components/xtheme.js` enthaelt `xtendScaffoldPerformanceProfile`, `xtendRmtMetadata` und `xtendComponentNetworkContract`
- Theme-, Density- und Preference-Kontext wird als `xtend.theme.context.v1` propagiert
- Density wird ueber `setDensity()`, `getDensity()`, `data-xtend-density` und Density Tokens stabilisiert
- Fabric Diagnostics liegen ueber `snapshotPerformance()` und `theme-performance-measured` vor
- `components/xtheme.d.ts` beschreibt Performance Profile, RMT Metadata, Component Network Context, Theme Context und neue Events
- `catalog-coverage` klassifiziert `x-theme` nun als `enterprise-ready`
- `component-long-tail-migration` entfernt `x-theme` aus den offenen Restpunkten

Naechstes primaeres Paket:

- `WP-E12-06` `x-button` Performance Profile und Interaction Budget nachziehen

### WP-E12-06 - `x-button` Performance Profile und Interaction Budget nachziehen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - `x-button` als interaktiven Grundbaustein performance-seitig abschliessen
- Scope:
  - Click/Keyboard Event Budget
  - Disabled/Busy States
  - Touch Target und Focus Visible
  - Fabric Interaction Measurement
- Zielartefakte:
  - aktualisiertes `components/xbutton.js`
  - aktualisierte Tests und Fixture
  - Workpackage-Doku `development/WP-E12-06-x-button-Performance-und-Interaction-Budget-nachziehen.md`
- Definition of Done:
  - `x-button` verliert die Restdimension `performance`
  - `x-button` ist `enterprise-ready`

## Handoff nach WP-E12-06

`WP-E12-06` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.wp06.xbutton-performance-interaction-budget.v1`.

Erledigt:

- `components/xbutton.js` enthaelt `xtendComponentContract`, `xtendRmtMetadata`, `xtendComponentLifecycleTelemetry` und `xtendScaffoldPerformanceProfile`
- Click-, Keyboard-, Busy- und Render-Pfade besitzen explizite Budgets unter `xtend.performance.component-profile.v1`
- `button-interaction` und `button-performance-measured` liefern Fabric-kompatible Interaktions- und Performance-Messpunkte
- `snapshotPerformance()`, `getPerformanceBudget()`, `getInteractionBudget()` und `setLoading()` machen das Runtime-Budget testbar
- `components/xbutton.d.ts` beschreibt Interaction Budget, Performance Snapshot, Measurement und neue Events
- `catalog-coverage` klassifiziert `x-button` nun als `enterprise-ready`
- `component-long-tail-migration` entfernt `x-button` aus den offenen Restpunkten

Naechstes primaeres Paket:

- `WP-E12-07` `x-menu` Performance Profile, Keyboard Navigation und Router-Kompatibilitaet haerten

### WP-E12-07 - `x-menu` Performance Profile, Keyboard Navigation und Router-Kompatibilitaet haerten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - `x-menu` als Navigation-/Interaction-Baustein stabilisieren
- Scope:
  - Keyboard Navigation
  - Active Item State
  - `x-link` und `x-router` Kompatibilitaet
  - Performance Profile
  - RMT Route Schedule Metadata
- Zielartefakte:
  - aktualisiertes `components/xmenu.js`
  - erweiterte `x-menu` Tests und Fixture
  - Workpackage-Doku `development/WP-E12-07-x-menu-Performance-Keyboard-und-Router-Kompatibilitaet-haerten.md`
- Definition of Done:
  - `x-menu` verliert die Restdimension `performance`
  - Navigation/Routing-Gates bleiben gruen

## Handoff nach WP-E12-07

`WP-E12-07` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.wp07.xmenu-performance-keyboard-router.v1`.

Erledigt:

- `components/xmenu.js` enthaelt `xtendComponentContract`, `xtendRmtMetadata`, `xtendComponentLifecycleTelemetry`, `xtendScaffoldA11yProfile`, `xtendScaffoldPerformanceProfile` und `xtendNavigationRoutingUxProfile`
- Keyboard-, Slotchange-, State-Sync- und Route-Activation-Pfade besitzen explizite Budgets unter `xtend.performance.component-profile.v1`
- `menu-item-clicked`, `menu-navigate`, `menu-keyboard-navigation` und `menu-performance-measured` liefern Fabric-kompatible Navigations- und Performance-Messpunkte
- `snapshotPerformance()`, `getPerformanceBudget()` und `getInteractionBudget()` machen das Runtime-Budget testbar
- `components/xmenu.d.ts` beschreibt Navigation, Keyboard, Performance Snapshot, Measurement und neue Events
- `catalog-coverage` klassifiziert `x-menu` nun als `enterprise-ready`
- `component-long-tail-migration` entfernt `x-menu` aus den offenen Restpunkten

Naechstes primaeres Paket:

- `WP-E12-08` `xstate` Adapter-, Typing- und Lifecycle-Boundary-Probe bauen

### WP-E12-08 - `xstate` Adapter-, Typing- und Lifecycle-Boundary-Probe bauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - `xstate` als Infrastrukturmodul sauber gatebar machen, ohne es zu einer visuellen Komponente umzudeuten
- Scope:
  - Public Types
  - Component-Level Boundary Suite
  - Lifecycle Events
  - Fabric Diagnostics
  - RMT State Scheduler Compatibility
- Zielartefakte:
  - `components/xstate.d.ts`
  - `tests/components/xstate.component_suite.js`
  - `tests/components/fixtures/xstate.component.html`
  - Workpackage-Doku `development/WP-E12-08-xstate-Adapter-Typing-und-Lifecycle-Boundary-Probe-bauen.md`
- Definition of Done:
  - `xstate` hat Suite, Fixture und Types
  - `xstate` bleibt als Boundary-Probe klassifiziert

## Handoff nach WP-E12-08

`WP-E12-08` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.wp08.xstate-adapter-typing-lifecycle-boundary.v1`.

Erledigt:

- `components/xstate.js` enthaelt `xtendStateBoundaryContract`, `xtendRmtMetadata` und `xtendComponentLifecycleTelemetry`
- `subscribeLifecycle(fn)`, `snapshot()`, `snapshotDiagnostics()` und `createRmtStateAdapter(options?)` machen die State-Boundary fuer Fabric und RMT Host Bridges testbar
- `components/xstate.d.ts` beschreibt State API, Boundary Contract, RMT Adapter, Diagnostics Snapshot und Lifecycle Events
- `tests/components/xstate.component_suite.js` und `tests/components/fixtures/xstate.component.html` pruefen `xstate` als nicht-visuelle Boundary-Probe
- `component-public-types` fuehrt `xstate` als Public-Type-Artefakt
- `catalog-coverage` hebt `componentSuite`, `fixture` und `types` auf `36/37`
- `catalog-coverage` klassifiziert `xstate` als `contract-gated`, nicht als visuelles Custom Element
- `component-long-tail-migration` fuehrt `xstate` weiterhin als Adapter-Boundary-Probe mit offenen A11y-/Performance-Entscheidungen

Naechstes primaeres Paket:

- `WP-E12-09` `x-utils` Utility-, Import-Policy- und Fixture-Probe bauen

### WP-E12-09 - `x-utils` Utility-, Import-Policy- und Fixture-Probe bauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - `x-utils` als Utility-Oberflaeche testbar und import-policy-sicher machen
- Scope:
  - Public Types
  - Utility Function Contract
  - Import Policy Probe
  - Fixture fuer nicht-visuelle Validierung
  - Docs und Examples
- Zielartefakte:
  - `components/xutils.d.ts`
  - `tests/components/xutils.component_suite.js`
  - `tests/components/fixtures/xutils.component.html`
  - Workpackage-Doku `development/WP-E12-09-xutils-Utility-Import-Policy-und-Fixture-Probe-bauen.md`
- Definition of Done:
  - `x-utils` hat Suite, Fixture und Types
  - Security- und Reference-Gates bleiben gruen

## Handoff nach WP-E12-09

`WP-E12-09` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.wp09.xutils-utility-import-policy-boundary.v1`.

Erledigt:

- `components/xutils.js` enthaelt `xtendUtilityContract`, `xtendImportPolicy`, `assertLocalImport(specifier)` und `snapshotUtilityContract()`
- `components/xutils.d.ts` beschreibt Utility Contract, Import Policy, Boundary Snapshot, Template API und das Event `xutils:import-policy-check`
- `tests/components/xutils.component_suite.js` und `tests/components/fixtures/xutils.component.html` pruefen `x-utils` als nicht-visuelle Utility-Boundary ohne CDN- oder Custom-Element-Zwang
- `component-public-types` fuehrt `x-utils` als Public-Type-Artefakt
- `catalog-coverage` hebt `componentSuite`, `fixture` und `types` auf `37/37`
- `catalog-coverage` klassifiziert `x-utils` als `typed-contract-gated`
- `component-long-tail-migration` fuehrt `x-utils` nur noch mit offener Performance-Boundary-Entscheidung

Naechstes primaeres Paket:

- `WP-E12-10` Visual Snapshot Automation Contract definieren

### WP-E12-10 - Visual Snapshot Automation Contract definieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - aus der Theme-Matrix einen echten Snapshot-Automation-Contract ableiten
- Scope:
  - Snapshot-Scopes
  - Viewport Matrix
  - Theme/Density/Motion Matrix
  - Toleranzen und Diff-Strategie
  - lokale-only Ausfuehrung
- Zielartefakte:
  - `development/XTend-Visual-Snapshot-Automation-Contract.md`
  - `tests/browser/visual-snapshot-automation-plan.js`
  - `tests/browser/visual_snapshot_automation_suite.js`
  - Workpackage-Doku `development/WP-E12-10-Visual-Snapshot-Automation-Contract-definieren.md`
- Definition of Done:
  - Contract ist akzeptiert
  - Snapshot Runner darf in `WP-E12-11` implementiert werden

## Handoff nach WP-E12-10

`WP-E12-10` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.visual-snapshot-automation-contract.v1`.

Erledigt:

- `development/XTend-Visual-Snapshot-Automation-Contract.md` definiert Snapshot Scopes, Matrix, Diff-Strategie, Toleranzen, Artefaktpolitik und lokale-only Ausfuehrung
- `tests/browser/visual-snapshot-automation-plan.js` leitet 5 UX-Familien, 17 Komponenten und 360 Matrix-Kombinationen aus `xtend.epic11.component-shell-theme-matrix.v1` ab
- `tests/browser/visual_snapshot_automation_suite.js` validiert Contract, Package-/Scaffold-Metadaten, Docs, Backlog und `WP-E12-11` Handoff
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `visualSnapshotAutomation`
- `docs/visual-snapshot-automation.md` und `docs/visual-browser-regression.md` dokumentieren den Snapshot-Contract
- Binary Baselines bleiben in `WP-E12-10` bewusst ausgeschlossen ueber `no-binary-baselines-in-WP-E12-10`

Naechstes primaeres Paket:

- `WP-E12-11` Snapshot Fixture und lokaler Pixel-/DOM-Diff-Runner vorbereiten

### WP-E12-11 - Snapshot Fixture und lokaler Pixel-/DOM-Diff-Runner vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - erste lokale Snapshot-Gates fuer priorisierte Komponenten schaffen
- Scope:
  - lokale Fixture
  - deterministische Rendering States
  - Pixel- oder DOM-Diff je nach verfuegbarer Umgebung
  - JSON Report
  - CI-Handoff ohne externen Dienst
- Zielartefakte:
  - Snapshot-Fixture `tests/browser/fixtures/visual-snapshots-fixture.html`
  - DOM-Baseline `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`
  - Runner `tests/browser/visual-snapshots-runner.js`
  - Test-Suite `visual-snapshots`
  - Package Script `test:visual-snapshots`
  - Workpackage-Doku `development/WP-E12-11-Snapshot-Fixture-und-lokalen-Diff-Runner-vorbereiten.md`
- Definition of Done:
  - Snapshot Gate ist lokal ausfuehrbar
  - Theme-Matrix bleibt Quelle fuer Kombinationen

## Handoff nach WP-E12-11

`WP-E12-11` ist abgeschlossen und akzeptiert den Runner Contract `xtend.epic12.visual-snapshot-runner.v1`.

Erledigt:

- `tests/browser/fixtures/visual-snapshots-fixture.html` stellt 5 Snapshot-Familien und 17 repraesentative Komponenten shell-first bereit
- `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json` fuehrt eine textuelle DOM-Baseline ohne Binary-Artefakte
- `tests/browser/visual-snapshots-runner.js` erzeugt Snapshot Records aus dem `WP-E12-10` Contract und vergleicht diese gegen die JSON-Baseline
- `tests/browser/visual_snapshots_suite.js` registriert den lokalen Gate `visual-snapshots`
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `visualSnapshots`
- Pixel-Diff ist als `optional-local-pixel-diff` vorbereitet, bleibt aber ausserhalb des Node-Contract-Gates

Naechstes primaeres Paket:

- `WP-E12-12` Enterprise Design System Token Productization vorbereiten

### WP-E12-12 - Enterprise Design System Token Productization vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - Styling Contracts in eine produktnaehe Design-System-Token-Schicht ueberfuehren
- Scope:
  - Token-Naming
  - Theme Packs
  - Density Packs
  - High-Contrast Tokens
  - Dokumentierte CSS Custom Properties und CSS Parts
- Zielartefakte:
  - Design Token Contract
  - Token-Doku
  - Beispiel-Theme
  - Workpackage-Doku `development/WP-E12-12-Enterprise-Design-System-Token-Productization-vorbereiten.md`
- Definition of Done:
  - Tokens sind dokumentiert
  - `x-theme` und Component Shell Theme Matrix nutzen dieselben Token-Namen

## Handoff nach WP-E12-12

`WP-E12-12` ist abgeschlossen und akzeptiert den Product Contract `xtend.design-tokens.product-contract.v1`.

Erledigt:

- `development/XTend-Enterprise-Design-System-Token-Contract.md` beschreibt Namespace, Theme Packs, Density Packs, High-Contrast/Forced-Colors und CSS Parts
- `design-tokens/xtend-design-tokens.js` stellt den maschinenlesbaren Contract bereit
- `design-tokens/themes/enterprise-light.json` ist als lokales Beispiel-Theme angelegt
- `docs/design-tokens.md` dokumentiert die produktiven `--xtend-*` Tokens
- `components/xtheme.js` stellt `getDesignTokenContract()` bereit und nutzt `compact`, `comfortable`, `dense`
- `tests/browser/fixtures/epic11-theme-matrix-smoke.html` und `tests/browser/fixtures/visual-snapshots-fixture.html` nutzen keine `--matrix-*` oder `--snapshot-*` Tokens mehr
- `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json` trackt Produkt-Tokens
- `tests/tokens/design_token_contract_suite.js` registriert den lokalen Gate `design-tokens`
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `designTokens`

Naechstes primaeres Paket:

- `WP-E12-13` RMT DSL Authoring Polish fuer Component Shells vorbereiten

### WP-E12-13 - RMT DSL Authoring Polish fuer Component Shells vorbereiten

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - die RMT Authoring Experience fuer Shell, Style, A11y, Events und Slots benutzerfreundlicher vorbereiten
- Scope:
  - DSL-Alias-Plan
  - Validierungsdiagnostik
  - Template Authoring Examples
  - XRouter-/XLink-Routing-Sugar
  - keine XTend-Kernel-Importe in RMT
- Zielartefakte:
  - RMT DSL Polish Plan `xtend.rmt.dsl-authoring-polish.v1`
  - Beispiel-Templates in `tests/fixtures/rmt-dsl-authoring-polish.rmt`
  - Contract-Doku `development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md`
  - Docs-App-Seite `docs/rmt-dsl-authoring-polish.md`
  - Gate `node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json`
  - Workpackage-Doku `development/WP-E12-13-RMT-DSL-Authoring-Polish-fuer-Component-Shells-vorbereiten.md`
- Definition of Done:
  - Upstream-RMT-Handoff ist klar
  - XTend bleibt Adapter-Produkt, nicht RMT-Kernel-Abhaengigkeit

#### Handoff nach WP-E12-13

`WP-E12-13` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.dsl-authoring-polish.v1`.

Umgesetzt:

- `xtend-builder/typing/rmt-dsl-authoring-polish.js` stellt Factory und Validator bereit
- `tests/fixtures/rmt-dsl-authoring-polish.rmt` dokumentiert Aliase, Diagnosefixtures und normalisierte Beispiele
- `tests/rmt/rmt_dsl_authoring_polish_suite.js` prueft Contract, Fixture, Package, Scaffold, Docs, Backlog und RC-Modell
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `rmtDslAuthoringPolish`
- `docs/rmt-dsl-authoring-polish.md` dokumentiert Authoring-Aliase, XRouter-/XLink-Sugar und Diagnostics

Startbar danach:

- `WP-E12-14` Release Candidate Gate Matrix fuer RC0 schneiden

### WP-E12-14 - Release Candidate Gate Matrix fuer RC0 schneiden

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - die Gates fuer einen ersten Release Candidate `RC0` definieren
- Scope:
  - PR Fast Gate
  - Full Release Gate
  - Snapshot Gate
  - Conditional Network Gates
  - Package Dry Run
  - Known Residual Policy
- Zielartefakte:
  - RC0 Gate Matrix `xtend.epic12.rc0-gate-matrix.v1`
  - aktualisierte Package-/Scaffold-Metadaten `rc0GateMatrix`
  - Contract-Doku `development/XTend-RC0-Gate-Matrix.md`
  - Docs-App-Seite `docs/rc0-gate-matrix.md`
  - Gate `node scripts/run_xtend_tests.js rc0-gate-matrix --json`
  - Workpackage-Doku `development/WP-E12-14-Release-Candidate-Gate-Matrix-fuer-RC0-schneiden.md`
- Definition of Done:
  - RC0 Gate Chain ist dokumentiert
  - Publish bleibt blockiert bis Owner Acceptance

#### Handoff nach WP-E12-14

`WP-E12-14` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.rc0-gate-matrix.v1`.

Umgesetzt:

- `catalog/epic12-rc0-gate-matrix.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic12_rc0_gate_matrix_suite.js` prueft Contract, Package, Scaffold, Runner, Docs, Backlog, RC-Modell und Registry
- `package.json` und `xtend-builder/scaffold.config.js` fuehren `rc0GateMatrix`
- `docs/rc0-gate-matrix.md` dokumentiert PR Fast, Full Release, Snapshot, RMT Authoring, Conditional Network, Package Dry Run und Known Residual Policy
- Publish bleibt durch `private-until-release-owner-approval` gesperrt

Startbar danach:

- `WP-E12-15` Docs, Migration Notes und Enterprise Adoption Guide aktualisieren

### WP-E12-15 - Docs, Migration Notes und Enterprise Adoption Guide aktualisieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - die offizielle Dokumentation auf Epic-12-Stand bringen
- Scope:
  - Long-Tail Migration Status
  - Snapshot Automation
  - Design Tokens
  - RC0 Readiness
  - Migration Notes fuer Component Authors
- Zielartefakte:
  - aktualisierte `docs/*`
  - aktualisierte `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - Workpackage-Doku `development/WP-E12-15-Docs-Migration-Notes-und-Enterprise-Adoption-Guide-aktualisieren.md`
  - Contract-Doku `development/XTend-Epic12-Docs-Migration-und-Adoption-Guide.md`
  - oeffentliche Doku `docs/rc0-adoption-guide.md`
  - maschinenlesbares Modul `catalog/epic12-docs-adoption.js`
  - Suite `tests/docs/epic12_docs_adoption_suite.js`
- Definition of Done:
  - Docs-App-Menue kennt neue Seiten
  - Reference-Gate prueft die neuen Pfade

#### Handoff nach WP-E12-15

`WP-E12-15` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.docs-adoption.v1`.

Umgesetzt:

- `docs/rc0-adoption-guide.md` fuehrt Long-Tail Runtime Closure, DOM-first Visual Snapshots, Design Token Productization, RMT DSL Authoring Polish, RC0 Gate Matrix, Known Residual Policy und Publish Boundary zusammen
- `docs/enterprise-adoption.md` enthaelt den Epic-12-RC0-Adoption-Abschnitt
- `docs/menu.json` und `docs/en/README.md` verlinken den neuen Guide
- `package.json` und `xtend-builder/scaffold.config.js` spiegeln die Adoption-Flaeche unter `epic12DocsAdoption`
- `tests/docs/epic12_docs_adoption_suite.js` prueft Docs, Package, Scaffold, Backlog, RC-Modell und Referenzregister

Startbar danach:

- `WP-E12-16` Epic-12-Abschlussreview und RC0-Handoff

### WP-E12-16 - Epic-12-Abschlussreview und RC0-Handoff

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic 12 abschliessen und den RC0-Handoff fuer Release Owner vorbereiten
- Scope:
  - KPI-Abnahme
  - Long-Tail-Status
  - Snapshot-Status
  - RC0 Gate Matrix
  - Restrisiken
  - Publish Boundary
- Zielartefakte:
  - `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md`
  - `development/WP-E12-16-Epic-12-Abschlussreview-und-RC0-Handoff.md`
  - maschinenlesbarer Handoff-Plan `catalog/epic12-rc0-handoff.js`
  - Handoff-Suite `tests/platform/epic12_rc0_handoff_suite.js`
  - oeffentliche Doku `development/docs-evidence/legacy-routes/en/epic12-rc0-handoff.md`
- Definition of Done:
  - Epic 12 ist fachlich abgeschlossen
  - RC0-Freigabe ist entscheidungsreif, aber Publish bleibt bis Owner Acceptance blockiert

#### Handoff nach WP-E12-16

`WP-E12-16` ist abgeschlossen und akzeptiert den Contract `xtend.epic12.rc0-handoff.v1`.

Umgesetzt:

- `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md` dokumentiert KPI-Abnahme, Long-Tail-Status, Snapshot-Status, RC0 Gate Matrix, Restrisiken und Publish Boundary
- `catalog/epic12-rc0-handoff.js` stellt Factory, Validator und Report Factory bereit
- `tests/platform/epic12_rc0_handoff_suite.js` prueft Handoff, Package, Scaffold, Runner, Docs, Backlog, RC-Modell und Referenzregister
- `development/docs-evidence/legacy-routes/en/epic12-rc0-handoff.md` macht den Owner-Handoff in der Docs-App sichtbar
- `package.json` und `xtend-builder/scaffold.config.js` spiegeln den Handoff unter `epic12Rc0Handoff`

Abschluss:

- Epic 12 abgeschlossen
- Status: `ready-for-release-owner-review-not-publish`
- Naechste Entscheidung: `release-owner-acceptance`

## KPI-Ziele

| KPI | Zielwert nach Epic 12 |
|-----|-----------------------|
| `x-tabs` Performance Profile | `enterprise-ready` |
| `x-tabs` Browser UX Coverage | explizit in Browser-Smokes und Theme-Matrix enthalten |
| `x-theme` A11y Coverage | Restdimension geschlossen |
| `x-theme` Performance Profile | Restdimension geschlossen |
| `x-button` Performance Profile | Restdimension geschlossen |
| `x-menu` Performance Profile | Restdimension geschlossen |
| `xstate` Boundary Probe | Suite, Fixture und Types vorhanden |
| `x-utils` Boundary Probe | Suite, Fixture und Types vorhanden |
| Catalog Component Suite Coverage | 37/37 oder begruendete Boundary-Ausnahme |
| Catalog Fixture Coverage | 37/37 oder begruendete Boundary-Ausnahme |
| Catalog Types Coverage | 37/37 oder begruendete Boundary-Ausnahme |
| Performance Profile Coverage | 37/37 oder begruendete Boundary-Ausnahme |
| Visual Snapshot Gate | lokaler Contract und Runner vorhanden |
| RC0 Gate Matrix | dokumentiert und lokal ausfuehrbar |

## Handoff-Erwartung

Nach Epic 12 soll XTend nicht nur enterprise-adoptionsfaehig und gatebar sein, sondern einen konkreten Release-Candidate-Pfad besitzen:

- Long-Tail-Restpunkte aus Epic 11 sind runtime-seitig bearbeitet.
- Visuelle Regression hat einen echten Snapshot-Pfad.
- Design Tokens sind produktnaeher dokumentiert.
- RMT DSL Polish ist als Upstream-Handoff vorbereitet.
- RC0 ist entscheidungsreif, ohne die Publish Boundary zu ueberspringen.

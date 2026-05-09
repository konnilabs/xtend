# XTend Performance Budget Matrix

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.performance.budget-matrix.v1`
- Component Profile Contract: `xtend.performance.component-profile.v1`
- Measurement Contract: `xtend.performance.measurement.v1`
- Roadmap-Paket: `ER-WP-17`
- Bezug:
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `xtend-builder/scaffold.config.js`

## Zweck

Performance wird in XTend ab Enterprise-Reife nicht als spaeteres Tuning behandelt, sondern als Contract pro Component-Profil.

Diese Matrix definiert:

- welche Budgetprofile neue Komponenten deklarieren muessen
- welche Messpunkte spaeter durch `ER-WP-18` eingefuehrt werden
- welche Grenzwerte `ER-WP-19` als Regression-Gate auswerten kann
- welche Hydration- und Scheduling-Policy je Profil erwartet wird

Die Zahlen sind Initialbudgets fuer lokale Entwicklungs- und CI-Gates. Sie sind bewusst konservativ und sollen spaeter anhand echter Telemetry aus XTend-Fabric, Browser-Smokes und RMT Scheduler-Snapshots kalibriert werden.

## Nicht-Ziele

Dieser Contract implementiert noch keine Messpunkte und keine Performance-Suite.

Nicht Teil von `ER-WP-17`:

- `performance.mark` oder `performance.measure` im Runtime-Code
- Browser-Automation fuer Performance
- Baseline-Dateien fuer CI
- harte Release-Blocker
- Bundle- oder Build-System-Umbau

Diese Punkte starten in `ER-WP-18`, `ER-WP-19`, `ER-WP-20` und `ER-WP-21`.

## Messmodell

Der stabile Measurement Contract lautet:

```text
xtend.performance.measurement.v1
```

Mindestfelder fuer spaetere Messwerte:

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `schema` | ja | `xtend.performance.measurement.v1` |
| `id` | ja | lokale Mess-ID |
| `profile` | ja | Component-Profil |
| `componentRef` | nein | Custom Element Tag, Manifest-ID oder RMT Component Ref |
| `fiberId` | nein | Bezug auf `xtend.fabric.fiber.v1` |
| `lane` | nein | Bezug auf `xtend.fabric.lane.v1` |
| `phase` | ja | `load`, `define`, `mount`, `hydrate`, `render`, `update`, `event`, `route`, `teardown` |
| `durationMs` | ja | gemessene Dauer |
| `budgetMs` | ja | erwarteter Grenzwert |
| `status` | ja | `pass`, `warn` oder `fail` |
| `sampleKind` | ja | `local`, `browser-smoke`, `ci`, `manual` oder `telemetry` |
| `metadata` | nein | redigierte Zusatzdaten |

## Budgetklassen

XTend nutzt diese Performance-Budgetklassen:

| Budgetklasse | Zweck | Fabric/RMT Naehe |
|--------------|-------|------------------|
| `critical` | Eingabe, Fokus, Navigation, A11y-Reparatur | `user-blocking`, `a11y` |
| `interactive` | sichtbare UI-Arbeit mit direkter Nutzerwirkung | `visible`, `transition` |
| `background` | nicht sichtbare Hydration, Prefetch, Cleanup | `idle`, `background` |
| `diagnostics` | Messung, Snapshot, Reporter-Vorbereitung | `diagnostics` |
| `best_effort` | optionale Preview-, Docs- oder Komfortarbeit | `background` |

## Kernmatrix

Alle Werte sind Initialbudgets pro Component-Instanz auf lokalem Entwicklungsrechner und muessen in `ER-WP-19` als `warn` statt sofortiger Release-Blocker starten.

| Profil | Default-Lane | Budgetklasse | Load/Define | Mount | Hydrate | Render/Update | Event/Action | Hydration Policy |
|--------|--------------|--------------|-------------|-------|---------|---------------|--------------|------------------|
| `display` | `visible` | `interactive` | 40 ms | 24 ms | 32 ms | 24 ms | n/a | `visible` |
| `interactive` | `user-blocking` | `critical` | 50 ms | 28 ms | 36 ms | 28 ms | 16 ms | `visible` |
| `overlay` | `user-blocking` | `critical` | 60 ms | 32 ms | 40 ms | 32 ms | 16 ms | `visible` |
| `routing` | `transition` | `interactive` | 70 ms | 36 ms | 48 ms | 48 ms | 24 ms | `visible` |
| `form` | `user-blocking` | `critical` | 60 ms | 32 ms | 44 ms | 36 ms | 16 ms | `visible` |
| `media` | `visible` | `interactive` | 90 ms | 48 ms | 80 ms | 48 ms | 24 ms | `visible-or-idle` |

## Erweiterungsprofile

Diese Profile existieren bereits in Scaffold- und Teststandards. Sie bleiben eigene Budgetprofile, bauen aber auf den Kernprofilen auf.

| Profil | Basis | Default-Lane | Budgetklasse | Zusatzbudget | Pflicht |
|--------|-------|--------------|--------------|--------------|---------|
| `stateful` | `interactive` oder `display` | `user-blocking` | `critical` | State Sync max. 12 ms | keine unbounded State-Subscriber |
| `feedback` | `display` | `a11y` | `critical` | Announcement max. 16 ms | Timer-Cleanup und Live-Region duerfen Render nicht blockieren |
| `theme` | `display` | `visible` | `interactive` | Theme Apply max. 24 ms | keine globalen Layout-Thrash-Schleifen |

Komponenten mit mehreren Profilen verwenden die strengste relevante Budgetklasse und das niedrigste relevante Event-/Action-Budget.

## Globale Performance-Regeln

Neue oder geaenderte Komponenten muessen diese Regeln einhalten:

- keine unbounded DOM-Scans im Default-Pfad
- keine wiederholten Layout-Reads nach Layout-Writes in derselben Sync-Phase
- keine globalen `querySelectorAll`-Loops ohne Scope und Budget
- keine Timer- oder Observer-Leaks nach `disconnectedCallback`
- Animationen muessen `prefers-reduced-motion` respektieren
- teure nicht sichtbare Arbeit muss `idle`, `background` oder `diagnostics` verwenden
- sichtbare Arbeit muss mit `componentRef`, `fiberId`, `lane` und `phase` korrelierbar werden
- externe Netzwerkannahmen sind kein Performance-Default

## Messpunkte fuer ER-WP-18

`ER-WP-18` muss mindestens diese Marks vorbereiten:

| Mark/Measure | Phase | Beschreibung |
|--------------|-------|--------------|
| `xtend.loader.manifest` | `load` | Manifest laden und aufloesen |
| `xtend.loader.module` | `load` | Modulimport oder Component Load |
| `xtend.component.define` | `define` | Custom Element Definition |
| `xtend.component.mount` | `mount` | Element erzeugen oder verbinden |
| `xtend.component.hydrate` | `hydrate` | bestehendes Markup aktivieren |
| `xtend.component.render` | `render` | sichtbaren DOM-Zustand schreiben |
| `xtend.component.update` | `update` | Attribute/Props/State anwenden |
| `xtend.event.handler` | `event` | User-Event synchron verarbeiten |
| `xtend.route.navigate` | `route` | Navigation starten |
| `xtend.route.render` | `route` | Route-Inhalt rendern |
| `xtend.diagnostics.snapshot` | `diagnostics` | lokale Snapshot-Arbeit |

## Gate-Modus fuer ER-WP-19

`ER-WP-19` soll Budgetverletzungen in Stufen ausgeben:

| Status | Bedingung | Wirkung |
|--------|-----------|---------|
| `pass` | `durationMs <= budgetMs` | keine Aktion |
| `warn` | `durationMs <= budgetMs * 1.5` | im Report sichtbar, noch kein harter Blocker |
| `fail` | `durationMs > budgetMs * 1.5` | lokaler Gate-Fail fuer priorisierte Kernpfade |

Die erste Suite soll als lokale Regression starten und erst nach stabilen Baselines zu Release-Gates hochgestuft werden.

## Scaffold-Pflichten

Scaffold und Component-Docs muessen spaeter pro Komponente ausweisen:

- `performanceProfile`
- relevante `budgetClass`
- erwartete Fabric-Lane
- Hydration Policy
- kritische Messphasen
- ob `idle` oder `background` Arbeit erlaubt ist
- ob A11y-Arbeit eigene `a11y` Fiber braucht

Der Component Profile Contract lautet:

```text
xtend.performance.component-profile.v1
```

## RMT- und Fabric-Anschluss

Performance-Budgets sind host-nah, aber RMT-kompatibel:

- Fabric-Fibers tragen `budgetClass`, `deadlineMs`, `lane`, `phase` und `durationMs`.
- RMT Schedule Policies koennen `budgetClass`, `deadlineMs`, `preferIdle` und `coalesceKey` nutzen.
- `ER-WP-13` mappt Fabric-Lanes auf RMT Schedule Records.
- `ER-WP-16` darf lokale Telemetry und Backpressure-Signale auf diese Matrix beziehen.

Nicht erlaubt:

- RMT Kernel importiert XTend Performance Runtime
- Performance-Matrix schreibt RMT Scheduler-Implementierung vor
- Komponenten umgehen Fabric-Diagnostics fuer budgetrelevante Arbeit

## Handoff an Folgepakete

- `ER-WP-18` fuehrt Loader- und Hydration-Messpunkte ein.
- `ER-WP-19` legt eine Performance Regression Suite an.
- `ER-WP-20` haertet Lazy/Idle/Visible Hydration Policies.
- `ER-WP-21` schreibt die Performance-Doku fuer Komponentenautoren und ist abgeschlossen.
- `ER-WP-23` kann Scaffold-Blueprints spaeter um Performance-Profilfelder erweitern.

## Verifikation

Mindestgate fuer diesen Contract:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`xtend.performance.budget-matrix.v1` ist akzeptiert. XTend hat damit eine initiale, gatebare Budgetmatrix fuer Component-Profile, Messphasen, Hydration Policies und spaetere Fabric-/RMT-Telemetry-Korrelation.

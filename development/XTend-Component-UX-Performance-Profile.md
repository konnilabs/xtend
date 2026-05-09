# XTend Component UX Performance Profile

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.ux-performance.v1`
- Report: `xtend.component.ux-performance-report.v1`
- Workpackage: `WP-E11-05`
- Bezug:
  - `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/WP-E11-05-Component-Performance-Profiles-und-Budgets-erweitern.md`
  - `development/XTend-Component-Shell-Contract.md`
  - `development/XTend-Component-Styling-Token-und-Part-Contract.md`
  - `development/XTend-Runtime-A11y-UX-Contract.md`
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-Performance-Regression-Gate.md`
  - `development/XTend-Hydration-Policy-Contract.md`
  - `docs/performance.md`
  - `fabric/hydration-policy.js`
  - `fabric/xtend-fabric.js`
  - `xtend-builder/performance/component-performance-profile.js`
  - `xtend-builder/performance/component-ux-performance-contract.js`
  - `tests/performance/component_ux_performance_contract_suite.js`

## Zweck

`WP-E11-05` hebt die bestehenden Performance-Bausteine in den Epic-11-UX-Contract. Die vorhandene Scaffold-Policy `xtend.performance.component-profile.v1`, die Budget-Matrix `xtend.performance.budget-matrix.v1`, Fabric-Messungen, Regression-Gate und Hydration-Policy bleiben die technischen Quellen. Der neue Contract `xtend.component.ux-performance.v1` beschreibt daraus eine stabile Pflichtoberflaeche fuer Enterprise-Komponenten.

Damit wird Performance nicht als nachtraegliches Tuning behandelt, sondern als Teil der sichtbaren Component Experience:

- Shell-Mount, Hydration, Render, Update und Event-Pfade werden budgetiert.
- Interaktive, Form-, Overlay-, Routing-, Feedback-, Media- und Display-Komponenten erhalten unterschiedliche Lanes und Budgets.
- A11y-Arbeit, Fokus, Screenreader-Signale, Theme-Wechsel und Motion/Contrast bleiben messbar.
- RMT kann Performance-Daten deklarieren, ohne XTend in den RMT Kernel zu importieren.
- Fabric verbindet Budgets mit Fibers, Lanes, Telemetry, Backpressure und Reporter-Adaptern.

## Contract-Oberflaeche

```ts
export interface XtendComponentUxPerformanceContract {
  schema: 'xtend.component.ux-performance.v1';
  status: 'contract-draft' | 'accepted-contract';
  workpackage: 'WP-E11-05';
  tag: string;
  profiles: Array<'display' | 'interactive' | 'form' | 'feedback' | 'overlay' | 'routing' | 'media' | 'stateful' | 'theme'>;
  primaryProfile: string;
  budgetClass: 'critical' | 'interactive' | 'background' | 'diagnostics' | 'best_effort';
  lane: 'user-blocking' | 'a11y' | 'transition' | 'visible' | 'idle' | 'background' | 'diagnostics';
  hydrationPolicy: 'visible' | 'idle' | 'lazy' | 'visible-or-idle';
  profile: XtendUxPerformanceProfileSource;
  budgets: XtendUxPerformanceBudgetContract;
  measurements: XtendUxPerformanceMeasurementContract;
  hydration: XtendUxPerformanceHydrationContract;
  lanes: XtendUxPerformanceLaneContract;
  scheduling: XtendUxPerformanceScheduleContract;
  backpressure: XtendUxPerformanceBackpressureContract;
  interaction: XtendUxPerformanceInteractionContract;
  overlays: XtendUxPerformanceOverlayContract;
  forms: XtendUxPerformanceFormContract;
  routing: XtendUxPerformanceRoutingContract;
  a11y: XtendUxPerformanceA11yContract;
  styling: XtendUxPerformanceStylingContract;
  rmt: XtendRmtPerformanceAuthoringContract;
  fabric: XtendFabricPerformanceBoundary;
}
```

## Pflichtdomains

`xtend.component.ux-performance.v1` ist nur gueltig, wenn diese Domains vorhanden sind:

| Domain | Pflicht |
|--------|---------|
| `profile` | Bezug auf `xtend.performance.component-profile.v1`, Profile, Primary Profile und Scaffold-Status |
| `budgets` | Budgetklasse, konkrete ms-Werte, Warn-/Fail-Modus und Budget-Matrix |
| `measurements` | kritische Messpunkte, Phasen und Korrelationsfelder |
| `hydration` | visible/idle/lazy/visible-or-idle Policy und RMT Schedule Refs |
| `lanes` | Fabric-Lane, RMT-Mapping und user-blocking-Grenzen |
| `scheduling` | RMT Schedule Authoring, Deadlines, Prefer-Idle und Coalescing |
| `backpressure` | Deferral-Regeln fuer neutrale Arbeit unter Last |
| `interaction` | Event-/Action-Budgets und high-frequency Event Regeln |
| `overlays` | Open/Close, Focus Work und Scroll Lock Budgets |
| `forms` | Input Event, Validation und First Invalid Focus Budgets |
| `routing` | Route Navigate/Render Messpunkte und Focus-Restore-Korrelation |
| `a11y` | A11y-Fiber, Announcement Budget und Reduced-Motion-Sicherheit |
| `styling` | Theme Apply Budget und Token-Update-Regeln |
| `rmt` | host-neutrale RMT-Performance-Autorisierung |
| `fabric` | Telemetry-Korrelation, Fiber-Kinds und Diagnostics |
| `compatibility` | Framework-agnostische Nutzung ohne CDN- oder Wrapper-Pflicht |
| `docs` | Autorendoku, Budget-Matrix und Pflichtsektionen |
| `tests` | lokale Gates und Assertions |

## Profile und Budgets

Die Profile stammen aus der bestehenden Budget-Matrix und werden als UX-Pflicht interpretiert:

| Profil | Default Lane | Budgetklasse | Hydration | Kernrisiko |
|--------|--------------|--------------|-----------|------------|
| `display` | `visible` | `interactive` | `visible` | unnoetige Voll-Renderings |
| `interactive` | `user-blocking` | `critical` | `visible` | Event Handler ueber 16 ms |
| `form` | `user-blocking` | `critical` | `visible` | ungebundene Validation oder Input-Scans |
| `feedback` | `a11y` | `critical` | `visible` | blockierende Live-Region/Timer-Arbeit |
| `overlay` | `user-blocking` | `critical` | `visible` | Focus Trap, Scroll Lock und Open/Close-Reflows |
| `routing` | `transition` | `interactive` | `visible` | Route Render und Focus Restore ohne Korrelation |
| `media` | `visible` | `interactive` | `visible-or-idle` | Asset-Setup blockiert Controls |
| `stateful` | `user-blocking` | `critical` | `visible` | unbounded Subscriber und State-Sync |
| `theme` | `visible` | `interactive` | `visible` | globale Theme-Layout-Schleifen |

Komponenten mit mehreren Profilen nutzen die strengste Budgetklasse, die hoechstpriorisierte Lane und die niedrigsten relevanten Event-/Interaction-Budgets.

## Pflichtassertions

Die Suite `component-ux-performance` prueft diese Contract-Assertions:

- `budget-class-derived`
- `lane-derived`
- `hydration-policy-derived`
- `critical-measurements-present`
- `event-budget-bounded`
- `no-layout-thrashing`
- `observer-cleanup`
- `reduced-motion-safe`
- `telemetry-correlation`
- `regression-gate-linked`

## RMT Authoring

RMT darf Performance-Informationen deklarieren, ohne den XTend-Performance-Code zu importieren. Der Authoring-Handoff lautet:

```text
xtend.rmt.performance-authoring.v1
```

Erlaubte Felder:

- `performance`
- `budgetClass`
- `lane`
- `hydrationPolicy`
- `scheduleRef`
- `deadlineMs`
- `preferIdle`
- `coalesceKey`

Die Kernel-Grenze bleibt:

```text
no-rmt-kernel-import-of-xtend-types
```

## Fabric und Telemetry

Fabric ist die operative Mess- und Schutzschicht:

- `component.mount`, `component.hydrate`, `component.render`, `component.update`, `event.handler` und `route.render` muessen als Fiber-Kinds korrelierbar bleiben.
- Measurements nutzen `xtend.performance.measurement.v1`.
- Telemetry-Snapshots muessen `componentRef`, `fiberId`, `lane`, `phase`, `durationMs` und `budgetMs` transportieren koennen.
- Backpressure darf neutrale Hydration auf `idle` oder `lazy` verschieben.
- A11y- und User-Input-Pfade bleiben `critical` und duerfen nicht hinter Hintergrundarbeit verschwinden.

## Kompatibilitaetsgrenzen

Der Contract gilt fuer:

- XTend-only
- RMT-first
- Vanilla JS
- React
- Vue
- Custom Shells

Nicht erlaubt:

- Framework-spezifischer Wrapper als Performance-Pflicht
- CDN-Abhaengigkeit fuer Profil- oder Budgetdaten
- globale DOM-Scans ohne Budget und Ausnahme
- nicht sichtbare Arbeit auf `user-blocking`
- RMT-Kernel-Importe aus XTend-Performance-Modulen

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js component-ux-performance --json
```

Der Gate haengt die vorhandenen Performance-Gates nicht ab, sondern verbindet sie mit dem Epic-11-UX-Contract:

- `fabric-performance-measurements`
- `performance-regression`
- `hydration-policy`
- `references`

## Handoff

`WP-E11-05` bereitet `WP-E11-06` und `WP-E11-07` vor:

- `WP-E11-06` kann Forms, Overlays, Router und Feedback nun mit gemeinsamen Performance-Budgets vernetzen.
- `WP-E11-07` kann RMT Shell Authoring um `performance`, `budgetClass`, `lane`, `hydrationPolicy`, `deadlineMs` und `coalesceKey` erweitern.

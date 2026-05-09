# XTend RMT Shell Authoring fuer Component UX

- Status: Accepted
- Datum: 7. Mai 2026
- Workpackage: `WP-E11-07`
- Contract: `xtend.rmt.shell-authoring.v1`
- Report: `xtend.rmt.shell-authoring-report.v1`
- Fixture: `tests/fixtures/rmt-shell-authoring-component-ux.rmt`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json`

## Zweck

Dieser Contract macht die Epic-11-Foundation-Contracts in RMT deklarierbar. RMT-first Apps koennen Component Shell, Styling, Runtime-A11y, Events, Commands, Hydration, Schedule und Fabric-Daten beschreiben, ohne XTend in den RMT Kernel einzubetten.

Die Aufgabe von RMT ist Authoring und Scheduling. Die Ausfuehrung von Custom Elements, XRouter, Fabric und DOM-Materialisierung bleibt in Host-Adaptern.

## Eingebundene Contracts

| Contract | Zweck |
|----------|-------|
| `xtend.component.contract.v2` | Component Public API und Runtime Boundary |
| `xtend.component.shell.v1` | Shell, States, Slots, Parts und Focus |
| `xtend.component.styling.v1` | Tokens, CSS Parts, Variants, Sizes, Density und Theme |
| `xtend.component.runtime-a11y.v1` | echte A11y-Flows fuer Keyboard, Focus und Screenreader |
| `xtend.component.ux-performance.v1` | Lanes, Budgets, Hydration und Backpressure |
| `xtend.component.network.v1` | Events, Commands, Contexts, Forms, Overlays und Routing |
| `xtend.component.fabric-boundary.v2` | Fabric Lanes, Fibers, Telemetry und Diagnostics |

## Leitentscheidung

`xtend.rmt.shell-authoring.v1` ist ein Authoring Contract, kein Runtime-Kernel.

RMT darf deklarieren:

- `shell`
- `style`
- `a11y`
- `commands`
- `events`
- `variants`
- `density`
- `hydration`
- `schedule`
- `fabric`

RMT darf nicht ausfuehren:

- Custom-Element-Lifecycle
- XRouter-Registration
- Fabric-Fiber-Implementierung
- DOM-spezifische Eventhandler
- XTend-Komponententypen im Kernel

## TypeScript Interface

```ts
interface XtendRmtShellAuthoringContract {
  schema: 'xtend.rmt.shell-authoring.v1';
  workpackage: 'WP-E11-07';
  manifest: XtendRmtShellManifest;
  adapters: XtendRmtShellAdapter[];
  components: XtendRmtComponentAuthoringRules;
  templates: XtendRmtTemplateAuthoringRules;
  shell: XtendRmtShellFields;
  style: XtendRmtStyleFields;
  a11y: XtendRmtA11yFields;
  variants: XtendRmtVariantPolicy;
  density: XtendRmtDensityPolicy;
  events: XtendRmtEventBindingPolicy;
  commands: XtendRmtCommandPolicy;
  hydration: XtendRmtHydrationPolicy;
  schedules: XtendRmtSchedulePolicy;
  fabric: XtendRmtFabricPolicy;
  compatibility: XtendRmtShellCompatibility;
  docs: XtendRmtShellDocs;
  tests: XtendRmtShellTests;
}
```

## Required Domains

| Domain | Pflicht |
|--------|---------|
| `manifest` | `shell-first` Render Mode und Kernel Boundary |
| `adapters` | host-neutrale Adapter fuer XTend, XRouter und Scheduler Diagnostics |
| `components` | Component Records mit Shell-, Style-, A11y-, Event- und Command-Daten |
| `templates` | `dom_descriptor` Templates ohne Script Nodes |
| `shell` | DOM-Modus, States, Slots, Parts, Focus und Attribute |
| `style` | Tokens, Parts, Variants, Size, Density, Theme, Motion und Contrast |
| `a11y` | Role, Name, Description, Live Regions, Keyboard und Announcements |
| `variants` | bekannte Varianten plus Diagnose fuer unbekannte Werte |
| `density` | `comfortable`, `compact`, `dense` mit Theme-Kontext-Propagation |
| `events` | DOM Event zu RMT Command Binding |
| `commands` | RMT Command zu Host Adapter Invocation |
| `hydration` | Policy, Ownership Mode und Schedule Ref |
| `schedules` | Lanes und Endpoint-Hints |
| `fabric` | Lane, Fiber, Telemetry und Diagnostics |
| `compatibility` | XTend-only, RMT-first, Vanilla, React, Vue und Custom Hosts |
| `docs` | Contract- und Fixture-Dokumentation |
| `tests` | lokaler Gate und Referenzsuite |

## Adapter

Pflichtadapter:

- `xtend.component`
- `xtend.xrouter`
- `rmt.state-scheduler-diagnostics`

Alle drei Adapter sind `kernelVisible: false`. Der RMT Kernel sieht Records, Schedules und Metadaten, aber keine XTend-Klassen, keine XRouter-Instanz und keine Fabric-Runtime.

## Component Record

Ein Component Record fuer RMT Shell Authoring muss diese Felder tragen:

- `id`
- `adapter`
- `tag`
- `template`
- `schedule`
- `shell`
- `style`
- `a11y`
- `events`
- `commands`
- `hydration`
- `fabric`

Das Feld `shell` beschreibt die sichtbare Struktur. `style`, `a11y`, `events`, `commands`, `hydration` und `fabric` sind Adapterdaten fuer den XTend Host.

## Shell

RMT darf folgende Shell-Daten deklarieren:

- `domMode`
- `state`
- `slots`
- `parts`
- `focus`
- `attributes`

Slot-Referenzen muessen auf Templates oder Component IDs zeigen. Cross-Component-Slot-Mutation ist kein Authoring-Pfad.

## Style

Style Authoring bindet an `xtend.rmt.style-authoring.v1`.

RMT darf deklarieren:

- `tokens`
- `parts`
- `variant`
- `size`
- `density`
- `theme`
- `motion`
- `contrast`

Inline Styling ist auf Token-Werte begrenzt. Ad-hoc CSS und Script-getriebene Styling-Logik gehoeren nicht in den RMT Record.

## A11y

A11y Authoring bindet an `xtend.rmt.a11y-authoring.v1`.

RMT darf deklarieren:

- `role`
- `label`
- `description`
- `live`
- `keyboard`
- `focus`
- `announcements`

Diese Daten ersetzen kein Browser-Verhalten. Der Host-Adapter muss sie gegen `xtend.component.runtime-a11y.v1` ausfuehren.

## Events Und Commands

Events nutzen `dom-event-to-rmt-command`.

Commands nutzen `rmt-command-to-host-adapter`.

Pflichten:

- Events bleiben DOM-kompatibel und nutzen `bubbles-composed`.
- Commands sind diagnostics-first.
- Fehler duerfen nicht roh ueber die RMT/XTend-Grenze laufen.
- Network-Daten bleiben kompatibel zu `xtend.rmt.component-network-authoring.v1`.

## Hydration

Hydration Authoring erlaubt:

- `visible`
- `idle`
- `lazy`
- `visible-or-idle`

Jeder Component Record benoetigt einen Schedule Ref. Ownership Modes sind `managed_subtree` und `adapter_owned_dom`.

## Schedules

Pflichtschedules:

- `component.shell.render`
- `component.visible.mount`
- `ui.user-blocking.input`
- `route.transition.render`
- `a11y.announce`
- `diagnostics.snapshot`

Diese Schedules sind Authoring- und Endpoint-Hints. Die konkrete Runtime-Ausfuehrung bleibt Host-/Scheduler-Adapterarbeit.

## Fabric

Fabric Authoring bindet an `xtend.component.fabric-boundary.v2`.

Pflichtfelder:

- `lane`
- `fiber`
- `telemetry`

Diagnostics:

- `rmt.shell.field.missing`
- `rmt.shell.event.unbound`
- `rmt.shell.schedule.unresolved`
- `rmt.shell.kernel-boundary.refused`

## Assertions

Pflichtassertions:

- `shell-first-authoring`
- `style-token-authoring`
- `runtime-a11y-authoring`
- `command-event-network-binding`
- `schedule-fabric-lane-binding`
- `kernel-boundary-preserved`
- `host-neutral-adapters`
- `no-inline-runtime-code`
- `density-theme-propagation`
- `validation-fixture-resolves`

## Fixture

Das Referenzfixture liegt in:

```text
tests/fixtures/rmt-shell-authoring-component-ux.rmt
```

Es enthaelt:

- App Shell `x-section`
- Navigation `x-link`
- Form Control `x-input`
- Feedback `x-toast`
- Overlay `x-dialog`
- `dom_descriptor` Templates
- Shell-, Style-, A11y-, Event-, Command-, Hydration- und Fabric-Daten

## Lokale Abnahme

```bash
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
```

Die Suite prueft:

- Contract Factory und Validator
- Fixture-Aufloesung fuer Component-, Template- und Schedule-Refs
- Adapter-Kernel-Boundary
- Package-, Scaffold-, Runner- und Referenzanker
- Epic- und Backlog-Status

## Handoff

`WP-E11-07` macht `WP-E11-08` startbar.

Nach diesem Paket koennen Form Controls, Feedback, Navigation und Overlays nicht nur gegen einzelne Component-Contracts, sondern gegen ein RMT-first authorbares UX-Shell-Modell umgesetzt werden.

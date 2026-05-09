# XTend Component Network Compatibility Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Workpackage: `WP-E11-06`
- Contract: `xtend.component.network.v1`
- Report: `xtend.component.network-report.v1`
- RMT Authoring: `xtend.rmt.component-network-authoring.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js component-network-contract --json`

## Zweck

Der Component Network Contract definiert, wie XTend-Komponenten miteinander arbeiten, ohne globalen Magic State, Framework-spezifische Wrapper oder harte XTendRMT-Kernelkopplung einzufuehren.

Er verbindet die bisherigen Epic-11-Foundation-Contracts:

- `xtend.component.contract.v2`
- `xtend.component.shell.v1`
- `xtend.component.styling.v1`
- `xtend.component.runtime-a11y.v1`
- `xtend.component.ux-performance.v1`
- `xtend.component.fabric-boundary.v2`

Das Ziel ist ein belastbares Netzwerk fuer Forms, Validation, Feedback, Overlays, Routing, Theme, State, Fabric und RMT-first Authoring.

## Leitentscheidung

XTend-Komponenten kommunizieren ueber dokumentierte Events, Commands und Contexts.

Nicht erlaubt sind:

- implizite globale Mutable Singletons
- ein globaler Event Bus als Pflichtpfad
- Framework-spezifische Host Wrapper als Voraussetzung
- XTend-Typen im RMT Kernel
- CDN-Abhaengigkeiten fuer Network-Kompatibilitaet

## TypeScript Interface

```ts
interface XtendComponentNetworkContract {
  schema: 'xtend.component.network.v1';
  workpackage: 'WP-E11-06';
  tag: `x-${string}`;
  profiles: XtendComponentNetworkProfile[];
  primaryProfile: XtendComponentNetworkProfile;
  lane: 'user-blocking' | 'a11y' | 'transition' | 'visible' | 'diagnostics';
  events: XtendComponentNetworkEvents;
  commands: XtendComponentNetworkCommands;
  contexts: XtendComponentNetworkContexts;
  forms: XtendComponentNetworkForms;
  validation: XtendComponentNetworkValidation;
  feedback: XtendComponentNetworkFeedback;
  overlays: XtendComponentNetworkOverlays;
  routing: XtendComponentNetworkRouting;
  theme: XtendComponentNetworkTheme;
  state: XtendComponentNetworkState;
  slots: XtendComponentNetworkSlots;
  focus: XtendComponentNetworkFocus;
  a11y: XtendComponentNetworkA11y;
  performance: XtendComponentNetworkPerformance;
  rmt: XtendComponentNetworkRmt;
  fabric: XtendComponentNetworkFabric;
  compatibility: XtendComponentNetworkCompatibility;
  docs: XtendComponentNetworkDocs;
  tests: XtendComponentNetworkTests;
}
```

## Required Domains

| Domain | Pflicht |
|--------|---------|
| `events` | DOM-kompatible Events mit `bubbles: true` und `composed: true` |
| `commands` | Host- oder RMT-ausloesbare Commands mit Diagnostics-first Result |
| `contexts` | lokale Provider/Adapter statt impliziter globaler State |
| `forms` | Form Association, Submit, Reset und Value Change |
| `validation` | Validity State, Feedback Link und First Invalid Focus |
| `feedback` | Live Region, Status Components und A11y Lane |
| `overlays` | Stack Context, Escape, Inert und Focus Restore |
| `routing` | XRouter Context, Navigate Command und Route Event |
| `theme` | Theme-, Token- und Density-Propagation |
| `state` | Local-first Snapshot statt globalem Mutable Singleton |
| `slots` | lokale Projection ohne Cross-Component Mutation |
| `focus` | Focus Command, Restore Events und lokale Roving Scopes |
| `a11y` | Runtime-A11y- und Screenreader-Signal-Bindung |
| `performance` | Lane, Event Budget und Backpressure Awareness |
| `rmt` | host-neutrales RMT Authoring ohne Kernel-Import von XTend |
| `fabric` | Diagnostics, Reporter Fields und Lane-Korrelation |
| `compatibility` | XTend-only, RMT-first, Vanilla, React, Vue und Custom Hosts |
| `docs` | Contract- und Authoring-Dokumentation |
| `tests` | lokaler Gate und Referenzsuite |

## Profiles

| Profile | Typische Komponenten | Lane |
|---------|----------------------|------|
| `form-control` | `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea` | `user-blocking` |
| `form-container` | `x-form` | `user-blocking` |
| `feedback-source` | `x-alert`, `x-toast`, `x-status` | `a11y` |
| `feedback-consumer` | Shells und Statusregionen | `a11y` |
| `overlay-trigger` | Buttons, Links, Menus | `user-blocking` |
| `overlay-surface` | `x-dialog`, `x-popover`, `x-drawer` | `user-blocking` |
| `router-link` | `x-link` | `transition` |
| `router-outlet` | `x-router` und Route Shells | `transition` |
| `theme-provider` | `x-theme` | `visible` |
| `state-source` | lokale Stores und Diagnostics | `diagnostics` |
| `display-consumer` | Display-, Layout- und Media-Komponenten | `visible` |

## Events

Pflichtevents:

- `xtend:value-change`
- `xtend:validation-change`
- `xtend:form-submit`
- `xtend:feedback-request`
- `xtend:overlay-open`
- `xtend:overlay-close`
- `xtend:route-change`
- `xtend:theme-change`
- `xtend:network-diagnostic`

Assertions:

- `events-composed-bubbling`
- jedes Event nutzt ein `detailSchema`
- `xtend:*` Naming ist Pflicht
- Komponenten duerfen Events konsumieren, ohne einen globalen Bus zu erzwingen

## Commands

Pflichtcommands:

- `focus`
- `validate`
- `reset`
- `submit`
- `announce`
- `open`
- `close`
- `navigate`
- `apply-theme`
- `snapshot`

Assertions:

- `commands-diagnostics-first`
- Commands werfen keine rohen Fehler ueber Component-, Fabric- oder RMT-Grenzen
- asynchrone Commands liefern Result Records mit `correlationId`

## Contexts

Pflichtcontexts:

- `form`
- `validation`
- `feedback`
- `overlay`
- `router`
- `theme`
- `state`
- `diagnostics`

Resolution-Reihenfolge:

1. RMT Component Record
2. Host Context
3. Component Property
4. Default Contract

Assertions:

- `fabric-context-resolved`
- `no-global-magic-state`
- Contexts duerfen ueberschrieben werden, ohne den Component-Code zu forken

## Forms Und Validation

Form Controls und Form Container nutzen:

- `xtend:value-change`
- `xtend:validation-change`
- `xtend:form-submit`
- `validate`
- `reset`
- `submit`

Validierungszustand benoetigt die Felder:

- `valid`
- `invalid`
- `required`
- `message`
- `controlRef`

`validation-feedback-linked` verlangt, dass Validation ueber `xtend:feedback-request` mit Status-, Toast- oder Alert-Komponenten verbunden werden kann.

## Feedback Und A11y

Feedback nutzt die A11y Lane und bindet an `xtend.a11y.screenreader-signals.v1` an.

Statuskomponenten:

- `x-alert`
- `x-toast`
- `x-status`
- `x-progress`

Feedback muss Screenreader-Signale erzeugen koennen, ohne selbst eine App-weite Toast-Registry zu erzwingen.

## Overlays

Overlay-Komponenten teilen den Stack Context `xtend.overlay.stack.v1`.

Pflichten:

- `xtend:overlay-open`
- `xtend:overlay-close`
- `open`
- `close`
- `focus`
- Escape nur auf dem obersten dismissiblen Overlay
- Background inert waehrend modaler Overlays
- Focus Restore nach Close

Assertion: `overlay-stack-coordinated`

## Routing

Routing bindet XRouter nativ ueber Adapterdaten an:

- Context: `xtend.router.context.v1`
- Adapter: `xtend.xrouter`
- Event: `xtend:route-change`
- Command: `navigate`
- Active State: `aria-current` und `data-active`
- Focus Restore: verpflichtend

Assertion: `router-context-stable`

## Theme Und State

Theme/Density-Propagation nutzt:

- Context: `xtend.theme.context.v1`
- Event: `xtend:theme-change`
- Command: `apply-theme`
- Token Propagation
- Density Propagation

State bleibt local-first. Externe State Bridges sind erlaubt, aber ein globaler Mutable Singleton ist nicht Teil des Contracts.

Assertion: `theme-density-propagated`

## RMT Authoring

RMT kann Component Network Daten deklarieren, ohne XTend in den RMT Kernel einzubetten.

Schema:

```json
{
  "schema": "xtend.rmt.component-network-authoring.v1",
  "adapter": "xtend.component",
  "fields": [
    "events",
    "commands",
    "contexts",
    "form",
    "validation",
    "feedback",
    "overlay",
    "router",
    "theme",
    "state"
  ],
  "kernelBoundary": "no-rmt-kernel-import-of-xtend-types"
}
```

Assertion: `rmt-authoring-host-neutral`

RMT beschreibt nur Adapterdaten. Ausfuehrung, DOM und XTend-spezifische Typen bleiben ausserhalb des RMT Kernels.

## Fabric Diagnostics

Fabric muss folgende Diagnostics transportieren koennen:

- `network.event.unhandled`
- `network.command.failed`
- `network.context.missing`
- `network.global-state.refused`

Reporter Fields:

- `componentRef`
- `eventName`
- `commandName`
- `context`
- `lane`
- `correlationId`

## Lokale Abnahme

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js component-network-contract --json
```

Die Suite prueft:

- Factory und Validator fuer `xtend.component.network.v1`
- Event-, Command-, Context- und Profile-Defaults
- Form-, Validation-, Feedback-, Overlay-, Router-, Theme- und State-Policies
- RMT Kernel Boundary
- Package-, Scaffold-, Runner- und Referenzanker

## Handoff

`WP-E11-06` macht `WP-E11-07` startbar.

`WP-E11-07` soll Shell, Styling, Runtime-A11y, Performance und Component Network in RMT Shell Authoring zusammenfuehren. Danach koennen die P1-Komponentenfamilien Forms, Feedback, Navigation, Overlays und Layout/Media gegen ein gemeinsames Enterprise-UX-Netz umgesetzt werden.

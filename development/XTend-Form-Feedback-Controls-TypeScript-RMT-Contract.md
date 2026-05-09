# XTend Form Feedback Controls TypeScript RMT Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic10.form-feedback-controls.v1`
- Workpackage: `WP-E10-10`
- Bezug:
  - `components/xtextarea.js`
  - `components/xstatus.js`
  - `components/xprogress.js`
  - `src/components/x-textarea/`
  - `src/components/x-status/`
  - `src/components/x-progress/`
  - `components/xform.js`

## Zweck

Dieser Contract beschreibt die zweite produktive Epic-10-Komponentenlinie fuer Long-Form Input und Feedback Controls. Die Linie beweist, dass XTend-Komponenten TypeScript-first vorbereitet, lokal als ESM ausgeliefert, in RMT App Templates beschrieben und ueber Fabric/Lanes/Telemetry sicher betrieben werden koennen.

## Component Contract

| Feld | Vorgabe |
|------|---------|
| Component Contract | `xtend.component.contract.v2` |
| RMT Contract | `xtend.rmt.component-contract.v1` |
| Adapter | `xtend.component` |
| Kernel Boundary | `no-rmt-kernel-import-of-xtend-types` |
| Runtime Format | lokale ESM-Datei unter `components/` |
| Source Strategy | `xtend.typescript.component-source-strategy.v1` |
| A11y Profile | `xtend.a11y.profile.v1` |
| Performance Profile | `xtend.performance.component-profile.v1` |

## Komponenten

| Tag | Rolle | Default Lane | Hydration Policy | Budget |
|-----|-------|--------------|------------------|--------|
| `x-textarea` | `textbox` | `user-blocking` | `visible` | `interactive-medium` |
| `x-status` | `status` | `feedback` | `visible` | `feedback-small` |
| `x-progress` | `progressbar` | `background` | `visible` | `feedback-small` |

## RMT Authoring

RMT darf die Controls als DOM-Descriptoren beschreiben:

```json
{
  "kind": "component",
  "adapter": "xtend.component",
  "tag": "x-progress",
  "attrs": {
    "value": 64,
    "max": 100,
    "status": "Hydrating route"
  },
  "events": {
    "progress-complete": "route.hydration.completed"
  },
  "schedule": "feedback.progress.update"
}
```

RMT konstruiert Attribute, Slots und Events. XTend fuehrt das Custom Element aus. Der RMT-Kernel importiert keine XTend-Klassen, Typen oder Component-Source.

## Form und Feedback Aggregation

`x-form` sammelt `x-textarea` als String-Wert ueber `value` und aktualisiert `xform-data-<id>` bei `textarea-changed`. `x-status` und `x-progress` sind keine Formularwerte, sondern Feedback-Records fuer Shells, Scheduler-Tasks, Validierung und Hydration.

Die Events `status-changed`, `status-dismissed`, `progress-changed` und `progress-complete` koennen spaeter von RMT Commands oder Fabric Telemetry aufgenommen werden.

## Abnahme

- Manifest enthaelt `x-textarea`, `x-status`, `x-progress`.
- Public Types existieren fuer alle drei Komponenten.
- Component-Level Suites und Fixtures existieren fuer alle drei Komponenten.
- Docs existieren unter `docs/components/`.
- Component Catalog Coverage klassifiziert alle drei Komponenten als `enterprise-ready`.
- Regression Priority klassifiziert `x-textarea` als `p0-browser-critical` und `x-status`/`x-progress` als `p1-visual-performance`.

## Nicht-Ziele

- Kein globaler RMT-Kernel-Import von XTend-Typen.
- Kein produktiver TypeScript Compiler in diesem Paket.
- Keine Migration bestehender JS-Komponenten.
- Keine echte Browser-Screenshot-Automation; das bleibt Handoff an spaetere Visual Gates.

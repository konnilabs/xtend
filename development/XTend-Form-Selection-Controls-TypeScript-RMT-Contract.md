# XTend Form Selection Controls TypeScript RMT Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic10.form-selection-controls.v1`
- Workpackage: `WP-E10-09`
- Bezug:
  - `components/xselect.js`
  - `components/xcheckbox.js`
  - `components/xradio.js`
  - `src/components/x-select/`
  - `src/components/x-checkbox/`
  - `src/components/x-radio/`
  - `components/xform.js`

## Zweck

Dieser Contract beschreibt die erste produktive Epic-10-Komponentenlinie fuer Form Selection Controls. Die Linie beweist, dass XTend-Komponenten TypeScript-first vorbereitet, lokal als ESM ausgeliefert, in RMT App Templates beschrieben und ueber Fabric/Lanes/Telemetry sicher betrieben werden koennen.

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
| `x-select` | `combobox` | `user-blocking` | `visible` | `interactive-medium` |
| `x-checkbox` | `checkbox` | `user-blocking` | `visible` | `interactive-small` |
| `x-radio` | `radio` | `user-blocking` | `visible` | `interactive-small` |

## RMT Authoring

RMT darf die Controls als DOM-Descriptoren beschreiben:

```json
{
  "kind": "component",
  "adapter": "xtend.component",
  "tag": "x-select",
  "attrs": {
    "name": "plan",
    "value": "pro",
    "required": true
  },
  "events": {
    "select-changed": "form.plan.changed"
  },
  "schedule": "component.visible.mount"
}
```

RMT konstruiert Attribute, Slots und Events. XTend fuehrt das Custom Element aus. Der RMT-Kernel importiert keine XTend-Klassen, Typen oder Component-Source.

## Form Aggregation

`x-form` sammelt:

- `x-select` als String oder String-Liste ueber `value` und `values`
- `x-checkbox` als Boolean ueber `checked`
- `x-radio` als Gruppenwert des aktivierten Controls

Die Events `select-changed`, `checkbox-changed` und `radio-changed` aktualisieren `xform-data-<id>` und koennen spaeter von RMT Commands oder Fabric Telemetry aufgenommen werden.

## Abnahme

- Manifest enthaelt `x-select`, `x-checkbox`, `x-radio`.
- Public Types existieren fuer alle drei Komponenten.
- Component-Level Suites und Fixtures existieren fuer alle drei Komponenten.
- Docs existieren unter `docs/components/`.
- Component Catalog Coverage klassifiziert alle drei Komponenten als `enterprise-ready`.
- Regression Priority klassifiziert alle drei Komponenten als `p0-browser-critical`.

## Nicht-Ziele

- Kein globaler RMT-Kernel-Import von XTend-Typen.
- Kein produktiver TypeScript Compiler in diesem Paket.
- Keine Migration bestehender JS-Komponenten.
- Keine echte Browser-Screenshot-Automation; das bleibt Handoff an spaetere Visual Gates.

# XTend Form Controls UX Reife Contract

Status: `accepted`

Schema: `xtend.component.form-controls-ux.v1`

Report-Schema: `xtend.component.form-controls-ux-report.v1`

Workpackage: `WP-E11-08`

## Ziel

Dieser Contract macht die Form-Control-Familie zur ersten sichtbaren Enterprise-Grade-Komponentenlinie aus Epic 11. Die Controls werden gegen die bereits akzeptierten Foundation-Contracts umgesetzt:

- `xtend.component.shell.v1`
- `xtend.component.styling.v1`
- `xtend.component.runtime-a11y.v1`
- `xtend.component.ux-performance.v1`
- `xtend.component.network.v1`
- `xtend.rmt.shell-authoring.v1`
- `xtend.component.fabric-boundary.v2`

Die Grenze zu XTendRMT bleibt `no-rmt-kernel-import-of-xtend-types`. RMT darf Form Controls beschreiben, schedulen und verdrahten, importiert aber keine XTend-Typen in den Kernel.

## Zielkomponenten

P0/P1 Form Controls dieses Pakets:

- `x-input`
- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-calendar`
- `x-form`
- `x-writer`

`x-form` ist der Form Host. `x-writer` bleibt Rich-Text-Control und wird nicht als klassisches Form-Associated Element erzwungen, muss aber State, Events, A11y, Fabric und RMT Authoring kompatibel bereitstellen.

## Pflichtdomains

Jede Zielkomponente wird ueber folgende Domains bewertet:

- Shell
- Style
- A11y
- Validation
- Form Association
- Events
- Commands
- State
- RMT
- Fabric
- Performance
- Docs
- Tests

## Runtime-Profil

Jede Zielkomponente muss ein statisches Profil `xtendFormControlUxProfile` bereitstellen. Dieses Profil beschreibt mindestens:

- `schema: "xtend.component.form-control-ux-profile.v1"`
- `componentRef`
- `family`
- `role`
- `valueMode`
- `slots`
- `parts`
- `events`
- `commands`
- `stateKey`
- `schedule`
- `fabric`
- `rmt`
- `validation`

Das Profil ist bewusst leichtgewichtig. Es ist keine zweite Runtime, sondern ein deklarativer Anker fuer Builder, Component Lab, RMT Shell Authoring und zukuenftige Browser-Gates.

## Shell

Form Controls muessen eine stabile Shell-Oberflaeche anbieten:

- Label Slot oder Label-Attribut
- Help/Hint Slot
- Error Slot
- stabile Parts: `root`, `control`, `label`, `helper`, `error`
- States: `ready`, `invalid`, `disabled`, `required`, `busy`

Legacy-Fallbacks bleiben erlaubt, solange neue Shell-Felder nicht gebrochen werden.

## Style

Form Controls muessen tokenisiert und themefaehig sein:

- `--xtend-control-bg`
- `--xtend-control-border`
- `--xtend-control-color`
- `--xtend-control-radius`
- `--xtend-control-focus`

Bestehende Legacy-Variablen wie `--input-bg`, `--border-color`, `--primary-color` duerfen als Fallback erhalten bleiben.

## A11y

Pflichtverhalten:

- Accessible Name fuer jedes interaktive Control
- sichtbarer Fokus
- Keyboard-Pfad ohne Maus
- nicht rein farbbasierte Fehlerkommunikation
- Error Region mit `role="alert"` und `aria-live="assertive"`
- Status Region mit `role="status"` fuer Aggregation und Fortschritt
- Reduced Motion und Forced Colors sicher

## Validation

Text-, Auswahl- und Datumskontrollen muessen Validity APIs oder dokumentierte Validation-Commands anbieten:

- `checkValidity()`
- `reportValidity()`
- `validate()` wenn das Control einen expliziten Command-Layer nutzt
- Error Events wie `validation-failed`, `select-invalid`, `checkbox-invalid`, `radio-invalid`, `textarea-invalid`

`x-form` aggregiert Validierung und meldet `invalid` mit einer Liste der fehlgeschlagenen Controls.

## Events

Pflichtevents der Familie:

- `input-changed`
- `select-changed`
- `checkbox-changed`
- `radio-changed`
- `textarea-changed`
- `date-select`
- `writer:change`
- `submit`
- `invalid`
- `reset`

Events sollen fuer Composition geeignet sein: `bubbles: true` und `composed: true`, wenn sie komponentenuebergreifend durch `x-form`, RMT oder Fabric verarbeitet werden.

## RMT

Die Referenzdatei `tests/fixtures/rmt-form-controls-ux.rmt` zeigt Shell-first Authoring fuer die gesamte Form-Familie. Sie enthaelt:

- `x-form` als Shell-Host
- `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-calendar`, `x-writer`
- `x-status` als Fehler- und A11y-Announcement Surface
- Schedules fuer `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `a11y.announce` und `diagnostics.snapshot`

## Fabric

Jedes Profil muss eine Lane und einen Fiber-Hinweis liefern:

- Eingabe und Validation: `user-blocking`
- A11y Announcements: `a11y`
- Diagnostics: `diagnostics`
- Rich Text Lazy Hydration: `idle`

Diese Daten werden fuer Telemetry, Backpressure und spaetere RMT Scheduling-Optimierung verwendet.

## Testing

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js form-controls-ux --json
```

Pflichtassertions:

- `form-associated-or-form-host`
- `accessible-name-required`
- `help-and-error-regions`
- `runtime-validation-events`
- `form-data-aggregation`
- `keyboard-path-documented`
- `style-token-surface`
- `fabric-lane-profile`
- `rmt-shell-authoring-ready`
- `kernel-boundary-preserved`

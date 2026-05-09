# WP-E11-08 - Form Controls UX-Reife umsetzen

Status: `completed`

Schema: `xtend.epic11.wp08.form-controls-ux.v1`

## Ziel

`WP-E11-08` ueberfuehrt die Form-Control-Familie aus den Foundation-Contracts in sichtbare, testbare Enterprise-UX-Reife. Die Umsetzung verbindet Shell, Styling, Runtime-A11y, Performance, Component Network, RMT Shell Authoring und Fabric-Felder in einem gemeinsamen Form-Control-Profil.

## Scope

Zielkomponenten:

- `x-input`
- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-calendar`
- `x-form`
- `x-writer`

## Umgesetzte Artefakte

- Contract: `development/XTend-Form-Controls-UX-Reife-Contract.md`
- Factory und Validator: `xtend-builder/typing/form-controls-ux-contract.js`
- RMT Referenzfixture: `tests/fixtures/rmt-form-controls-ux.rmt`
- Lokaler Gate: `tests/components/form_controls_ux_suite.js`
- Runner-Suite: `form-controls-ux`
- Package-Script: `npm run test:form-controls-ux`

## Runtime-Entscheidungen

- Jede Zielkomponente bietet `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1`.
- `x-input`, `x-form`, `x-calendar` und `x-writer` erhalten die bisher fehlenden RMT/Fabric/A11y/Performance-Metadaten direkt in der lokalen ESM-Runtime.
- `x-form` aggregiert nun auch `date-select` und `writer:change` und kann damit `x-calendar` und `x-writer` in `xform-data-<id>` aufnehmen.
- `x-input`, `x-calendar` und `x-writer` senden ihre neuen UX-relevanten Events bubbles/composed, damit `x-form`, RMT-Adapter und Fabric-Diagnostics sie ohne versteckte Kopplung verarbeiten koennen.
- `x-writer` erhaelt `value`, `reset()` und `focus()` als Form-Control-nahe API.
- `x-form` erhaelt `validate()`, `submit()` und `reset()` als explizite Commands.

## RMT-Entscheidungen

- Die Fixture `tests/fixtures/rmt-form-controls-ux.rmt` beschreibt eine Shell-first Form-App mit `x-form` als Host.
- RMT nutzt weiterhin `xtend.component` als Adapter und bleibt an der Grenze `no-rmt-kernel-import-of-xtend-types`.
- Schedules sind `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `a11y.announce` und `diagnostics.snapshot`.
- `x-status` wird als Fehler- und Announcement-Surface fuer Form-Validation eingebunden.

## Tests

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js form-controls-ux --json
```

Erwartete Anschluss-Gates:

```bash
node scripts/run_xtend_tests.js components form-controls-ux references --json
node scripts/run_xtend_tests.js --json
```

## Definition of Done

- `xtend.component.form-controls-ux.v1` ist akzeptiert.
- Alle Zielkomponenten besitzen ein Form-Control-UX-Profil.
- RMT Fixture validiert Shell, Style, A11y, Validation, Events, Commands, Fabric und Schedule-Referenzen.
- Package, Scaffold, Runner, Epic, Backlog und Referenzregister kennen den neuen Gate.
- `WP-E11-09` ist startbar.

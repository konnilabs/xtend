# WP-E11-07 - RMT Shell Authoring fuer Component UX erweitern

- Status: `completed`
- Datum: 7. Mai 2026
- Workpackage Contract: `xtend.epic11.wp07.rmt-shell-authoring-component-ux.v1`
- Zielcontract: `xtend.rmt.shell-authoring.v1`
- Report: `xtend.rmt.shell-authoring-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json`

## Ziel

`WP-E11-07` fuehrt die Foundation-Contracts aus `WP-E11-02` bis `WP-E11-06` in ein RMT Authoring Modell zusammen. RMT-first Apps koennen damit Shell, Style, A11y, Events, Commands, Variants, Density, Hydration, Schedule und Fabric fuer XTend-Komponenten deklarieren.

## Scope

- Shell-first RMT Authoring
- Component Records mit Shell-, Style-, A11y-, Event-, Command-, Hydration- und Fabric-Feldern
- `dom_descriptor` Templates ohne Script Nodes
- Adapterdaten fuer `xtend.component`, `xtend.xrouter` und `rmt.state-scheduler-diagnostics`
- Schedule- und Lane-Hints fuer Component-, Route-, A11y- und Diagnostics-Pfade
- Fixture als Referenz fuer P1-Komponentenfamilien
- Package-, Scaffold-, Runner- und Reference-Wiring

## Artefakte

| Artefakt | Status | Zweck |
|----------|--------|-------|
| `development/XTend-RMT-Shell-Authoring-fuer-Component-UX.md` | completed | akzeptierter RMT Shell Authoring Contract |
| `development/WP-E11-07-RMT-Shell-Authoring-fuer-Component-UX-erweitern.md` | completed | Workpackage-Abnahme |
| `xtend-builder/typing/rmt-shell-authoring-contract.js` | completed | Factory, Validator und stabile Konstanten |
| `tests/fixtures/rmt-shell-authoring-component-ux.rmt` | completed | RMT Shell Authoring Referenzfixture |
| `tests/rmt/rmt_shell_authoring_component_ux_suite.js` | completed | lokaler Gate `rmt-shell-authoring-ux` |
| `package.json` | completed | Export, Script, Metadata und PR-Fast-Gate |
| `xtend-builder/scaffold.config.js` | completed | Scaffold-Metadaten fuer RMT Shell Authoring |
| `scripts/run_xtend_tests.js` | completed | Suite-Entry `rmt-shell-authoring-ux` |
| `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` | completed | Referenzpfad fuer Contract, Fixture, Suite und Workpackage |

## Entscheidungen

### Canonical Schema

Das kanonische Schema bleibt:

```text
xtend.rmt.shell-authoring.v1
```

Dieses Schema wird in Epic 11 konkretisiert und verbindet:

- `xtend.component.shell.v1`
- `xtend.component.styling.v1`
- `xtend.component.runtime-a11y.v1`
- `xtend.component.ux-performance.v1`
- `xtend.component.network.v1`

### Authoring Fields

Pflichtfelder:

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

### Adapter Boundary

Pflichtadapter:

- `xtend.component`
- `xtend.xrouter`
- `rmt.state-scheduler-diagnostics`

Alle Pflichtadapter bleiben `kernelVisible: false`.

### Kernel Boundary

Die Grenze bleibt:

```text
no-rmt-kernel-import-of-xtend-types
```

RMT deklariert Records, Templates, Schedules und Metadaten. XTend-Komponentenausfuehrung, XRouter-Registrierung, Fabric und DOM-Materialisierung bleiben Host-Adapterarbeit.

## Definition Of Done

- [x] Contract `xtend.rmt.shell-authoring.v1` ist fuer Component UX konkretisiert
- [x] Report Schema `xtend.rmt.shell-authoring-report.v1` ist gatebar
- [x] Factory und Validator liegen vor
- [x] Referenzfixture liegt vor
- [x] Package exportiert das Contract-Modul
- [x] Package, Scaffold und Runner kennen `rmt-shell-authoring-ux`
- [x] PR-Fast-Gate enthaelt `rmt-shell-authoring-ux`
- [x] `WP-E11-07` ist `completed`
- [x] `WP-E11-08` ist startbar

## Lokale Abnahme

```bash
node --check xtend-builder/typing/rmt-shell-authoring-contract.js
node --check tests/rmt/rmt_shell_authoring_component_ux_suite.js
node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

Nach `WP-E11-07` ist `WP-E11-08` startbar.

Die Umsetzung der Form Controls kann nun gegen einen vollstaendigen RMT-first Component-UX-Authoring-Contract erfolgen, statt Shell, Styling, A11y, Performance und Network einzeln zusammenzuziehen.

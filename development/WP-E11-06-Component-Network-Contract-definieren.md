# WP-E11-06 - Component Network Contract definieren

- Status: `completed`
- Datum: 7. Mai 2026
- Workpackage Contract: `xtend.epic11.wp06.component-network-contract.v1`
- Zielcontract: `xtend.component.network.v1`
- Report: `xtend.component.network-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js component-network-contract --json`

## Ziel

`WP-E11-06` definiert die Cross-Component-Kompatibilitaet fuer XTend-Komponenten. Forms, Validation, Feedback, Overlays, Routing, Theme und State sollen zusammenarbeiten, ohne globale Kopplung oder Framework-spezifische Wrapper zu erzwingen.

## Scope

- DOM Events mit `bubbles` und `composed`
- Commands mit Diagnostics-first Result Records
- Context Resolution fuer Form, Validation, Feedback, Overlay, Router, Theme, State und Diagnostics
- Form Association und Validation/Feedback-Link
- Overlay Stack Coordination
- XRouter Context und Route Navigation
- Theme-, Token- und Density-Propagation
- Fabric Diagnostics und Lanes
- RMT Authoring Boundary fuer Component Network Daten

## Artefakte

| Artefakt | Status | Zweck |
|----------|--------|-------|
| `development/XTend-Component-Network-Compatibility-Contract.md` | completed | akzeptierter Contract und RMT-Handoff |
| `development/WP-E11-06-Component-Network-Contract-definieren.md` | completed | Workpackage-Abnahme |
| `xtend-builder/typing/component-network-contract.js` | completed | Factory, Validator und stabile Konstanten |
| `tests/components/component_network_contract_suite.js` | completed | lokaler Gate `component-network-contract` |
| `package.json` | completed | Export, Script, Metadata und PR-Fast-Gate |
| `xtend-builder/scaffold.config.js` | completed | Scaffold-Metadaten fuer Component Network |
| `scripts/run_xtend_tests.js` | completed | Suite-Entry `component-network-contract` |
| `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` | completed | Referenzpfad fuer Contract, Suite und Workpackage |

## Entscheidungen

### Events

Alle Component-Network-Events nutzen das `xtend:*` Naming, muessen `bubbles: true` und `composed: true` setzen und besitzen ein Detail Schema.

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

### Commands

Commands sind Host- oder RMT-ausloesbar und geben Diagnostics-first Result Records zurueck.

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

### Contexts

Component Network nutzt lokale Contexts statt globalem Magic State.

Pflichtcontexts:

- `form`
- `validation`
- `feedback`
- `overlay`
- `router`
- `theme`
- `state`
- `diagnostics`

### Profile

Profile:

- `form-control`
- `form-container`
- `feedback-source`
- `feedback-consumer`
- `overlay-trigger`
- `overlay-surface`
- `router-link`
- `router-outlet`
- `theme-provider`
- `state-source`
- `display-consumer`

### RMT Boundary

RMT Authoring nutzt `xtend.rmt.component-network-authoring.v1`.

Der Kernel Boundary bleibt:

```text
no-rmt-kernel-import-of-xtend-types
```

RMT beschreibt Adapterdaten fuer `events`, `commands`, `contexts`, `form`, `validation`, `feedback`, `overlay`, `router`, `theme` und `state`, importiert aber keine XTend-Typen in den Kernel.

## Definition Of Done

- [x] Contract `xtend.component.network.v1` ist dokumentiert
- [x] Report Schema `xtend.component.network-report.v1` ist dokumentiert
- [x] Factory und Validator liegen vor
- [x] Package exportiert das Contract-Modul
- [x] Package, Scaffold und Runner kennen `component-network-contract`
- [x] RMT Authoring Boundary ist als `xtend.rmt.component-network-authoring.v1` festgelegt
- [x] Fabric Diagnostics sind benannt
- [x] Referenzpfade sind aktualisiert
- [x] `WP-E11-06` ist `completed`
- [x] `WP-E11-07` ist startbar

## Lokale Abnahme

```bash
node --check xtend-builder/typing/component-network-contract.js
node --check tests/components/component_network_contract_suite.js
node scripts/run_xtend_tests.js component-network-contract --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

Nach `WP-E11-06` liegen alle Foundation-Contracts fuer Epic 11 vor:

- `xtend.component.shell.v1`
- `xtend.component.styling.v1`
- `xtend.component.runtime-a11y.v1`
- `xtend.component.ux-performance.v1`
- `xtend.component.network.v1`

Damit ist `WP-E11-07` startbar. Das naechste Paket soll diese Foundation in RMT Shell Authoring zusammenfuehren.

# WP-E15-10 - Slots, Composition und Component Binding integrieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS3`
- Prioritaet: `P1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-composition --json`
- Contract: `xtend.rmt.vnext-composition.v1`

## Ziel

WP-E15-10 integriert `slot`-Composition als deklarative Orchestrierung ueber Component Adapter. Nested Operations werden nicht als HTML interpretiert, sondern als OperationRefs mit Component Bindings, Scope-Bezug und Adapter-Capability-Checks normalisiert.

## Umgesetzte Artefakte

- `tools/rmt-language/vnext-composition.js`
  - Composition Graph Contract
  - Slot Binding Records
  - Component Binding Records
  - Component Catalog Normalisierung mit Alias-Aufloesung
  - Component Adapter Stub mit Capability-Pruefung
- `tests/rmt-language/fixtures/vnext-composition-valid.rmt`
  - verschachtelte `slot`-Struktur mit Alias `shell`
  - Nested `mount` und `hydrate` Operations
- `tests/rmt-language/rmt_vnext_composition_suite.js`
  - Golden-Test fuer Slots und Nested Operations
  - Negative Gates fuer fehlende Owner, fehlende OperationRefs, Duplicate Slots, Scope-Mismatches, unbekannte Components, unsupported Slots, fehlende Adapter-Capabilities und unsupported Targets
- `development/XTendRMT-vNext-Composition-Component-Binding-Contract.md`
  - Slot-/Component-Binding-Contract mit Diagnostics

## Contract-Entscheidungen

- Composition Mode ist `component-orchestration`.
- `markupCoupled` ist explizit `false`.
- Operation Targets bleiben deklarative Component Refs.
- Lokale Aliasnamen werden ueber den Component Catalog aufgeloest, damit die Sprache JSON-nah bleibt und keine imperative Importlogik braucht.
- Slots validieren gegen Component Contract v2 / RMT Component Metadata, wenn Slots dort explizit deklariert sind.
- Adapter muessen `component.binding` und fuer Slots `component.slot` oder `component.slot.<name>` bereitstellen.

## Definition of Done

- Composition bleibt Orchestrierung, nicht HTML-Markup.
- Component Binding funktioniert ueber Adapter-Contracts.
- Slot Binding behaelt SourceRefs und Core-Beziehungen.
- Nested Operations bleiben im Scope von Template, Surface und Lane des Owner-Operations.
- `package.json` exportiert `./rmt-language/vnext-composition` und `npm run test:rmt-vnext-composition`.
- `scripts/run_xtend_tests.js` kennt `rmt-vnext-composition`.

## Gate-Ergebnis

Bestanden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-composition --json
```

- Ergebnis: `passed`
- Checks: `76`
- Suiten: `1`

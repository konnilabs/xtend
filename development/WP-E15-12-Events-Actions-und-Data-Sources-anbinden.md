# WP-E15-12 - Events, Actions und Data Sources anbinden

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS3`
- Prioritaet: `P1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-events --json`
- Contract: `xtend.rmt.vnext-event-action-contract.v1`

## Ziel

WP-E15-12 bindet Events, Actions und Data Sources referenziell an, ohne imperative Handler oder Runtime-Eval in die Sprache einzufuehren.

## Umgesetzte Artefakte

- `tools/rmt-language/vnext-events.js`
  - Event/Action Contract
  - Action Ref Records mit Payload- und Result-Shapes
  - Data Source Records fuer `endpoint`, `sse` und `worker`
  - Capability Validation fuer Event-, Action- und DataSource-Adapter
  - Diagnostics fuer unbekannte Refs, Kind-Mismatches, fehlende Adapter und fehlende Payload Shapes
- `tests/rmt-language/fixtures/vnext-events-valid.rmt`
  - `on submit -> action settings.save`
  - `on cancel -> action settings.cancel when ...`
  - `from endpoint settings.load`
  - `from sse notifications.feed`
  - `from worker preview.render`
- `tests/rmt-language/rmt_vnext_events_suite.js`
  - Contract-Tests mit Adapter-Stubs
  - negative Referenz- und Capability-Faelle
- `development/XTendRMT-vNext-Event-Action-DataSource-Contract.md`

## Contract-Entscheidungen

- Events nutzen `event.bind`.
- Actions nutzen `action.invoke`.
- Data Sources sind auf `endpoint`, `sse` und `worker` begrenzt.
- Data Source Capabilities sind `data.endpoint.fetch`, `data.sse.subscribe` und `data.worker.invoke`.
- Payload-/Result-Shapes kommen aus Action- und DataSource-Catalogs.
- `declarative: true` und `runtimeEval: false` sind Contract-Bestandteile.

## Definition of Done

- Event-Bindings sind referenziell pruefbar.
- Data Sources bleiben deklarative Capabilities.
- `package.json` exportiert `./rmt-language/vnext-events` und `npm run test:rmt-vnext-events`.
- `scripts/run_xtend_tests.js` kennt `rmt-vnext-events`.
- Der Gate prueft Endpoint-, SSE- und Worker-Quellen mit Adapter-Stubs.

## Gate-Ergebnis

Bestanden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-events --json
```

- Ergebnis: `passed`
- Checks: `90`
- Suiten: `1`

# XTendRMT vNext Event, Action and Data Source Contract

- Status: `accepted by WP-E15-12`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-event-action-contract.v1`
- Event Binding: `xtend.rmt.vnext-event-binding.v1`
- Action Ref: `xtend.rmt.vnext-action-ref.v1`
- Data Source: `xtend.rmt.vnext-data-source.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-events-data-sources-ready`
- Folgepakete: `WP-E15-13`, `WP-E15-14`, `WP-E15-15`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-event-action-contract.v1"
```

Dieser Contract macht `on ... -> action ...` und `from endpoint|sse|worker ...` referenziell pruefbar. Events, Actions und Data Sources bleiben deklarative Capabilities; die vNext-Sprache fuehrt keine Handler-Funktionen, Runtime-Eval oder Host-spezifischen Imports ein.

## Event Binding

```json
{
  "schema": "xtend.rmt.vnext-event-binding.v1",
  "eventId": "event:interactions.page/root/critical/0/submit",
  "event": "submit",
  "ownerOperation": "operation:interactions.page/root/critical/0",
  "ownerComponentRef": "settings-card",
  "action": {
    "schema": "xtend.rmt.vnext-action-ref.v1",
    "ref": "settings.save",
    "resolvedActionId": "settings.save",
    "adapterId": "xtend.action",
    "capability": "action.invoke",
    "payloadShape": {
      "type": "object"
    }
  },
  "declarative": true,
  "runtimeEval": false,
  "status": "ready",
  "diagnostics": []
}
```

## Data Source

```json
{
  "schema": "xtend.rmt.vnext-data-source.v1",
  "dataSourceId": "dataSource:interactions.page/root/critical/0/body/0",
  "kind": "endpoint",
  "target": "settings.load",
  "ownerOperation": "operation:interactions.page/root/critical/0/body/0",
  "adapterId": "xtend.data.endpoint",
  "capability": "data.endpoint.fetch",
  "resultShape": {
    "type": "object"
  },
  "declarative": true,
  "runtimeEval": false,
  "status": "ready",
  "diagnostics": []
}
```

## Required Capabilities

| Contract Surface | Capability |
|------------------|------------|
| Event Binding | `event.bind` |
| Action Ref | `action.invoke` |
| `from endpoint ...` | `data.endpoint.fetch` |
| `from sse ...` | `data.sse.subscribe` |
| `from worker ...` | `data.worker.invoke` |

## Payload Shapes

Actions koennen `payloadShape` und `resultShape` deklarieren. Data Sources koennen `payloadShape` fuer Requests und `resultShape` fuer Antworten/Events deklarieren. Im strikten Modus blockiert der Contract fehlende Shapes, damit Tooling und Adapter keine impliziten Payloads erfinden.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.event.owner_missing` | Event verweist auf fehlende Owner-Operation |
| `rmt.vnext.event.name_missing` | Event-Name fehlt |
| `rmt.vnext.event.action_ref_missing` | Action-Ref fehlt |
| `rmt.vnext.event.action.unknown` | Action ist im Catalog unbekannt |
| `rmt.vnext.event.action.adapter_missing` | Action Adapter oder `action.invoke` fehlt |
| `rmt.vnext.event.binding.adapter_missing` | Event Adapter oder `event.bind` fehlt |
| `rmt.vnext.event.payload_shape.missing` | Action-Payload-Shape fehlt im strikten Modus |
| `rmt.vnext.event.duplicate` | Owner-Operation deklariert dasselbe Event mehrfach |
| `rmt.vnext.data_source.owner_missing` | Data Source verweist auf fehlende Owner-Operation |
| `rmt.vnext.data_source.target_missing` | Data Source Target fehlt |
| `rmt.vnext.data_source.unknown` | Data Source ist im Catalog unbekannt |
| `rmt.vnext.data_source.kind.unsupported` | Data Source Kind ist nicht `endpoint`, `sse` oder `worker` |
| `rmt.vnext.data_source.kind.mismatch` | Catalog-Kind und Nutzung stimmen nicht ueberein |
| `rmt.vnext.data_source.adapter_missing` | Data Source Adapter oder Capability fehlt |
| `rmt.vnext.data_source.payload_shape.missing` | Data Source Result Shape fehlt im strikten Modus |
| `rmt.vnext.data_source.operation_ref.mismatch` | Operation zeigt nicht auf den DataSource-Record zurueck |

Alle Diagnostics behalten `sourceRef`, Core Pointer und Source Range, sofern sie im Core-SourceMap vorhanden sind.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-events --json
```

Fixture:

- `tests/rmt-language/fixtures/vnext-events-valid.rmt`

Modul:

- `tools/rmt-language/vnext-events.js`

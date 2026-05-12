# XTendRMT vNext Streaming Contract

- Status: `accepted by WP-E15-14`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-streaming-contract.v1`
- Stream Operation: `xtend.rmt.vnext-stream-operation.v1`
- Runtime Probe: `xtend.rmt.vnext-stream-runtime-probe.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Uses: `xtend.rmt.vnext-scheduler-policy.v1`
- Uses: `xtend.rmt.vnext-event-action-contract.v1`
- Uses: `xtend.rmt.vnext-security-policy-contract.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-streaming-ready`
- Folgepakete: `WP-E15-15`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-streaming-contract.v1"
```

Dieser Contract macht Streaming, Chunked Hydration und Incremental Rendering als deklarative, host-neutrale Records sichtbar. Die Sprache bleibt JSON-nah: `stream ... from ...` und `hydrate ... from ...` werden im Core als Operationen mit Data Source, Scheduler Lane, Chunking, Backpressure, Completion, Error Path und Security Posture beschrieben.

## Stream Operation

```json
{
  "schema": "xtend.rmt.vnext-stream-operation.v1",
  "operationId": "operation:streaming.page/root/critical/1/slot/body/0",
  "operationKind": "stream",
  "op": "stream",
  "target": "hero-fragments",
  "variant": "ssr",
  "capability": "stream.ssr.incremental",
  "dataSource": {
    "kind": "endpoint",
    "target": "ssr.fragments",
    "capability": "data.endpoint.fetch"
  },
  "chunking": {
    "mode": "incremental-stream",
    "strategy": "cooperative",
    "maxChunkMs": 8,
    "yieldAfterMs": 12
  },
  "backpressure": {
    "signal": "rmt.vnext.backpressure.critical",
    "behavior": "shed-deferred-work"
  },
  "completion": {
    "signal": "rmt.vnext.ssr.complete",
    "source": "response:eof",
    "terminal": true
  },
  "errorPath": {
    "signal": "rmt.vnext.ssr.error",
    "behavior": "abort-fragment"
  },
  "security": {
    "required": true,
    "visible": true,
    "boundaryIds": ["xtend.security.streaming-boundary.v1"],
    "sanitizeFormats": ["html"]
  }
}
```

## Varianten und Capabilities

| Variante | Capability | Quelle |
|----------|------------|--------|
| `sse` | `stream.sse.incremental` | `stream ... from sse ...` |
| `worker` | `stream.worker.incremental` | `stream ... from worker ...` |
| `ssr` | `stream.ssr.incremental` | `stream ... from endpoint ...` |
| `hydration` | `stream.hydration.chunked` | `hydrate ... from ...` |

SSR wird bewusst als Endpoint-basierte Stream-Variante modelliert. Host-Runtimes duerfen das auf HTTP, Server Components oder Framework-spezifische Pipelines mappen; der RMT-Kernel bleibt beim Capability-Contract.

## Host-neutrale Runtime Probe

```json
{
  "schema": "xtend.rmt.vnext-stream-runtime-probe.v1",
  "hostCoupled": false,
  "domRequired": false,
  "operationCount": 5,
  "operations": [
    {
      "operationId": "operation:streaming.page/root/critical/1/slot/body/1",
      "variant": "sse",
      "capability": "stream.sse.incremental",
      "chunkingVisible": true,
      "backpressureVisible": true,
      "completionVisible": true,
      "errorPathVisible": true,
      "securityVisible": true
    }
  ]
}
```

Die Probe prueft nur Contract-Fakten, keine DOM-, Browser- oder Framework-API. Dadurch kann dieselbe Ausgabe in SSR-, SSE-, Worker- und Hydration-Hosts gelesen werden.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.streaming.operation.source_missing` | Stream Operation hat keine `from`-Quelle |
| `rmt.vnext.streaming.data_source.missing` | Operation verweist auf fehlende Core Data Source |
| `rmt.vnext.streaming.data_source.kind_unsupported` | Data Source Kind ist nicht streamfaehig |
| `rmt.vnext.streaming.scheduler.missing` | Operation ist keiner Scheduler Lane zugeordnet |
| `rmt.vnext.streaming.backpressure.missing` | Chunking oder Backpressure ist nicht sichtbar |
| `rmt.vnext.streaming.security.missing` | erforderliche Security Posture fehlt oder ist blockiert |
| `rmt.vnext.streaming.completion.missing` | Variante hat kein Completion-Signal |
| `rmt.vnext.streaming.error_path.missing` | Variante hat keinen Fehlerpfad |
| `rmt.vnext.streaming.capability.missing` | Host-neutrale Capability fehlt |
| `rmt.vnext.streaming.runtime_probe.host_coupled` | Runtime Probe ist host- oder DOM-gekoppelt |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-streaming --json
```

Fixture:

- `tests/rmt-language/fixtures/vnext-streaming-progressive.rmt`

Modul:

- `tools/rmt-language/vnext-streaming.js`

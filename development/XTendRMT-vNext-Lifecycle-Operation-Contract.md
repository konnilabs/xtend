# XTendRMT vNext Lifecycle Operation Contract

- Status: `accepted by WP-E15-06`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-lifecycle.v1`
- Operation Contract: `xtend.rmt.vnext-lifecycle-operation.v1`
- Result Contract: `xtend.rmt.vnext-lifecycle-result.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-lifecycle-contract-ready`
- Folgepakete: `WP-E15-07`, `WP-E15-10`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-lifecycle.v1"
```

Dieser Contract haertet die Lifecycle-Semantik fuer RMT vNext nach der Compilation in das Core-Format. Er legt fest, welche Lifecycle-Operationen gueltig sind, welche Zieltypen sie akzeptieren, welche Adapter-Capabilities sie benoetigen und welche Result-Shape ein host-neutraler Adapter zurueckmelden muss.

Die Sprache bleibt deklarativ: Lifecycle-Statements beschreiben Absicht. Adapter verhandeln Capabilities explizit. Fehlende Capabilities erzeugen Diagnostics und duerfen nicht still auf eine andere Operation oder einen impliziten Fallback ausweichen.

## Eingabe

Lifecycle-Validation liest ausschliesslich Core-Operationen:

```json
{
  "schema": "xtend.rmt.core-format.vnext.v1",
  "operations": [
    {
      "id": "operation:lifecycle.page/root/critical/0",
      "kind": "lifecycle",
      "op": "hydrate",
      "target": {
        "kind": "ref",
        "ref": "app-shell"
      },
      "scope": {
        "template": "template:lifecycle.page",
        "surface": "surface:lifecycle.page/root",
        "lane": "lane:lifecycle.page/root/critical"
      },
      "sourceRef": "src:operation:lifecycle.page/root/critical/0"
    }
  ],
  "sourceMap": []
}
```

Streams, data sources, slots, events und security policies bleiben ausserhalb dieses Contracts. Sie koennen Lifecycle-Operationen referenzieren, aber nicht deren Semantik veraendern.

## Semantikmatrix

| Operation | Phase | erlaubter Target Type | Adapter-Capability | Idempotency |
|-----------|-------|-----------------------|--------------------|-------------|
| `mount` | `attach` | `ref` | `lifecycle.mount` | `idempotent-by-target-phase` |
| `hydrate` | `interactive` | `ref` | `lifecycle.hydrate` | `idempotent-by-target-version` |
| `suspend` | `quiesce` | `ref` | `lifecycle.suspend` | `idempotent-by-target-phase` |
| `resume` | `interactive` | `ref` | `lifecycle.resume` | `idempotent-by-target-phase` |
| `invalidate` | `refresh` | `ref` | `lifecycle.invalidate` | `coalesced-by-target` |
| `dispose` | `release` | `ref` | `lifecycle.dispose` | `terminal-idempotent` |
| `prewarm` | `prepare` | `ref` | `lifecycle.prewarm` | `cache-key-idempotent` |
| `recycle` | `reuse` | `ref` | `lifecycle.recycle` | `pool-key-idempotent` |
| `detach` | `detach` | `ref` | `lifecycle.detach` | `idempotent-by-target-phase` |
| `reattach` | `attach` | `ref` | `lifecycle.reattach` | `idempotent-by-target-phase` |

## Operation Plan

Eine validierte Operation erzeugt einen Plan:

```json
{
  "schema": "xtend.rmt.vnext-lifecycle-operation.v1",
  "operationId": "operation:lifecycle.page/root/critical/0",
  "op": "hydrate",
  "phase": "interactive",
  "target": {
    "kind": "ref",
    "ref": "app-shell"
  },
  "requiredCapability": "lifecycle.hydrate",
  "adapterCandidates": [
    "adapter.lifecycle.all"
  ],
  "adapterId": "adapter.lifecycle.all",
  "idempotency": {
    "mode": "idempotent-by-target-version",
    "key": "hydrate:interactive:lane:lifecycle.page/root/critical:app-shell"
  },
  "status": "ready",
  "diagnostics": []
}
```

`adapterId` darf nur gesetzt werden, wenn der Adapter die benoetigte Capability deklariert. Wenn kein Adapter passt, bleibt `adapterId` `null` und der Plan wird `blocked`.

## Result Contract

Jede Adapter-Ausfuehrung muss auf diese Shape normalisiert werden:

```json
{
  "schema": "xtend.rmt.vnext-lifecycle-result.v1",
  "ok": true,
  "status": "ok",
  "operationId": "operation:lifecycle.page/root/critical/0",
  "op": "hydrate",
  "phase": "interactive",
  "target": {
    "kind": "ref",
    "ref": "app-shell"
  },
  "adapterId": "adapter.lifecycle.all",
  "idempotencyKey": "hydrate:interactive:lane:lifecycle.page/root/critical:app-shell",
  "diagnostics": [],
  "metadata": {}
}
```

Erlaubte `status`-Werte:

- `ok`
- `skipped`
- `failed`
- `degraded`

Unbekannte Statuswerte werden zu `failed` normalisiert.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.lifecycle.operation.unsupported` | Core enthaelt eine Lifecycle-Operation ausserhalb der Semantikmatrix |
| `rmt.vnext.lifecycle.target.missing` | Operation hat kein deklaratives `ref` Target |
| `rmt.vnext.lifecycle.target.unsupported` | Target-Kind ist nicht im Contract erlaubt |
| `rmt.vnext.lifecycle.adapter.missing` | Es wurde kein host-neutraler Adapter-Stub uebergeben |
| `rmt.vnext.lifecycle.capability.missing` | Kein Adapter deklariert die benoetigte Lifecycle-Capability |

Diagnostics verwenden `sourceRef` und `sourceMap`, damit Linter, LSP und AI-Reports zur Authoring-Quelle zurueckspringen koennen.

## Gate

Das lokale Gate prueft den Contract mit host-neutralen Adapter-Stubs:

```bash
node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json
```

Fixture:

- `tests/rmt-language/fixtures/vnext-lifecycle-valid.rmt`

Modul:

- `tools/rmt-language/vnext-lifecycle.js`

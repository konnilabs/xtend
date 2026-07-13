# XSurface Shard

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-xsurface-shard` provides server-side XSurface Shard orchestration for XTend Remote Surfaces. It consumes RMT vNext remote-surface records, Enterprise Registry snapshots, Degradation reports, and Remote Security reports, then emits deterministic shards, server-owned lifecycle state, XScaler ATC-compatible handoffs, and JSON-safe stream fragments.

It does not load remote bundles, call `fetch()`, execute dynamic imports, or move remote runtime execution into the RMT kernel.

### Installation

```bash
npm install @ccslabs/xtend-xsurface-shard
```

Node.js 18 or newer is required. XTend, the compiler, and the RMT runtime are optional peers for integrated flows.

### Schemas

- `xtend.xsurface.shard-plan.v1` as `XSURFACE_SHARD_PLAN_SCHEMA`
- `xtend.xsurface.shard-snapshot.v1` as `XSURFACE_SHARD_SNAPSHOT_SCHEMA`
- `xtend.xsurface.shard-atc-handoff.v1` as `XSURFACE_SHARD_HANDOFF_SCHEMA`
- `xtend.xsurface.shard-stream-fragment.v1` as `XSURFACE_SHARD_FRAGMENT_SCHEMA`
- `xtend.xsurface.shard-surface.v1` as `XSURFACE_SHARD_SURFACE_SCHEMA`
- `xtend.xsurface.shard.v1` as `XSURFACE_SHARD_RECORD_SCHEMA`
- `xtend.xscaler.atc-handoff.v1` as `XSCALER_ATC_HANDOFF_SCHEMA`, the compatibility shape carried by handoff records

### API

```js
const {
  createXSurfaceShardPlan,
  createXSurfaceShardServer,
  createXSurfaceStreamFragment
} = require('@ccslabs/xtend-xsurface-shard');

const plan = createXSurfaceShardPlan({
  enterpriseRegistry,
  degradationReport,
  remoteSecurityReport
});

const server = createXSurfaceShardServer({ input: {
  enterpriseRegistry,
  degradationReport,
  remoteSecurityReport
}});

const handoff = server.attach('remoteSurface:checkout.cart');
const fragment = createXSurfaceStreamFragment({
  surfaceId: 'remoteSurface:checkout.cart',
  shardId: handoff.shardId,
  sequence: 1,
  payload: { type: 'surface.patch', records: [] }
});
```

Additional public helpers partition surfaces, create standalone ATC handoffs, and serialize plans.

### Decisions

- Remote Security errors produce `refused`.
- Degradation errors produce `refused`.
- Degraded surfaces with a fallback produce `degraded`.
- Valid remote surfaces produce `ready`.

The default shard key is `owner + primary shellTarget`. Incomplete but non-blocking owner or target facts fall back to the deterministic `default` segment instead of creating an implicit global registry.

### Server lifecycle

`createXSurfaceShardServer()` exposes:

- `plan()`
- `attach()`
- `detach()`
- `cancel()`
- `activateFallback()`
- `publishFragment()`
- `snapshot()`
- `dispose()`

Invalid lifecycle transitions return a handoff with `xsurface.shard.lifecycle_invalid_transition`. Non-serializable stream payloads return `xsurface.shard.non_serializable_payload`; a disposed server refuses later operations.

### Runtime boundary

- Security and degradation decisions happen before attachment.
- Handoffs preserve `remoteRuntimeExecution: false` and `kernelRemoteExecution: false`.
- Stream fragments must be JSON-serializable.
- XScaler ATC compatibility does not grant permission to execute remote code.

### Verification

```bash
npm run test:xsurface-shard
npm run test:xscaler-protocol
npm run test:xscaler-source-to-sea
npm run test:scoped-package-readmes
```

### License

Licensed under the Apache License 2.0. See [LICENSE](../LICENSE).

[Back to top](#xsurface-shard) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

`@ccslabs/xtend-xsurface-shard` stellt serverseitige XSurface-Shard-Orchestrierung für XTend Remote Surfaces bereit. Das Paket konsumiert RMT-vNext-Remote-Surface-Records, Enterprise-Registry-Snapshots, Degradation Reports und Remote Security Reports und erzeugt daraus deterministische Shards, serverseitig verwalteten Lifecycle-State, XScaler-ATC-kompatible Handoffs und JSON-sichere Stream-Fragmente.

Es lädt keine Remote-Bundles, ruft kein `fetch()` auf, führt keine dynamischen Imports aus und verlagert keine Remote-Runtime-Ausführung in den RMT-Kernel.

### Installation

```bash
npm install @ccslabs/xtend-xsurface-shard
```

Node.js 18 oder neuer wird benötigt. XTend, der Compiler und die RMT-Runtime sind optionale Peers für integrierte Abläufe.

### Schemas

- `xtend.xsurface.shard-plan.v1` als `XSURFACE_SHARD_PLAN_SCHEMA`
- `xtend.xsurface.shard-snapshot.v1` als `XSURFACE_SHARD_SNAPSHOT_SCHEMA`
- `xtend.xsurface.shard-atc-handoff.v1` als `XSURFACE_SHARD_HANDOFF_SCHEMA`
- `xtend.xsurface.shard-stream-fragment.v1` als `XSURFACE_SHARD_FRAGMENT_SCHEMA`
- `xtend.xsurface.shard-surface.v1` als `XSURFACE_SHARD_SURFACE_SCHEMA`
- `xtend.xsurface.shard.v1` als `XSURFACE_SHARD_RECORD_SCHEMA`
- `xtend.xscaler.atc-handoff.v1` als `XSCALER_ATC_HANDOFF_SCHEMA`, das Kompatibilitätsformat innerhalb der Handoff-Records

### API

```js
const {
  createXSurfaceShardPlan,
  createXSurfaceShardServer,
  createXSurfaceStreamFragment
} = require('@ccslabs/xtend-xsurface-shard');

const plan = createXSurfaceShardPlan({
  enterpriseRegistry,
  degradationReport,
  remoteSecurityReport
});

const server = createXSurfaceShardServer({ input: {
  enterpriseRegistry,
  degradationReport,
  remoteSecurityReport
}});

const handoff = server.attach('remoteSurface:checkout.cart');
const fragment = createXSurfaceStreamFragment({
  surfaceId: 'remoteSurface:checkout.cart',
  shardId: handoff.shardId,
  sequence: 1,
  payload: { type: 'surface.patch', records: [] }
});
```

Weitere öffentliche Helfer partitionieren Surfaces, erzeugen eigenständige ATC-Handoffs und serialisieren Pläne.

### Entscheidungen

- Remote-Security-Fehler ergeben `refused`.
- Degradation-Fehler ergeben `refused`.
- Degradierte Surfaces mit Fallback ergeben `degraded`.
- Gültige Remote Surfaces ergeben `ready`.

Der Standard-Shard-Key ist `owner + primary shellTarget`. Unvollständige, aber nicht blockierende Owner- oder Target-Fakten fallen auf das deterministische Segment `default` zurück, statt eine implizite globale Registry zu erzeugen.

### Server-Lifecycle

`createXSurfaceShardServer()` stellt bereit:

- `plan()`
- `attach()`
- `detach()`
- `cancel()`
- `activateFallback()`
- `publishFragment()`
- `snapshot()`
- `dispose()`

Ungültige Lifecycle-Übergänge liefern ein Handoff mit `xsurface.shard.lifecycle_invalid_transition`. Nicht serialisierbare Stream-Payloads liefern `xsurface.shard.non_serializable_payload`; ein beendeter Server lehnt spätere Operationen ab.

### Runtime-Grenze

- Security- und Degradation-Entscheidungen erfolgen vor dem Attach.
- Handoffs bewahren `remoteRuntimeExecution: false` und `kernelRemoteExecution: false`.
- Stream-Fragmente müssen JSON-serialisierbar sein.
- XScaler-ATC-Kompatibilität erteilt keine Erlaubnis zur Ausführung von Remote-Code.

### Verifikation

```bash
npm run test:xsurface-shard
npm run test:xscaler-protocol
npm run test:xscaler-source-to-sea
npm run test:scoped-package-readmes
```

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../LICENSE).

[Nach oben](#xsurface-shard) · [English](#english)

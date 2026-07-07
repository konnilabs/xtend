# @ccslabs/xtend-xsurface-shard

Server-side XSurface Shard orchestration for XTend Remote Surfaces.

XSurface Shard consumes existing RMT vNext Remote Surface records, Enterprise
Registry snapshots, Degradation reports and Remote Security reports. It
partitions accepted remote surfaces into deterministic shards, tracks
server-owned lifecycle state and emits XScaler ATC-compatible handoff records
and JSON-safe stream fragments.

It does not load remote bundles, call `fetch()`, execute dynamic imports or move
remote runtime execution into the RMT kernel.

## Schemas

- `xtend.xsurface.shard-plan.v1`
- `xtend.xsurface.shard-snapshot.v1`
- `xtend.xsurface.shard-atc-handoff.v1`
- `xtend.xsurface.shard-stream-fragment.v1`
- `xtend.xscaler.atc-handoff.v1` as the ATC compatibility shape carried inside handoff records

## API

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

## Decisions

- Remote Security errors produce `refused`.
- Degradation errors produce `refused`.
- Degraded surfaces with fallback produce `degraded`.
- Valid remote surfaces produce `ready`.

The default shard key is `owner + primary shellTarget`. Incomplete but
non-blocking owner or target facts fall back to the deterministic `default`
segment instead of creating an implicit global registry.

## Server Lifecycle

`createXSurfaceShardServer()` exposes:

- `plan()`
- `attach()`
- `detach()`
- `cancel()`
- `activateFallback()`
- `publishFragment()`
- `snapshot()`
- `dispose()`

Invalid lifecycle transitions return a handoff with
`xsurface.shard.lifecycle_invalid_transition`; non-serializable stream payloads
return `xsurface.shard.non_serializable_payload`.

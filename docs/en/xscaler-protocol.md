# XScaler Protocol

XScaler is the public preflight protocol that lets XTend hosts decide whether a remote surface, SSR adapter and XTension deployment can be scaled into a runtime slot before any remote code executes.

## Layer boundary

XScaler is split into two layers with different responsibilities:

1. **XScaler Preflight** makes a static accept/reject decision before any remote bundle, SSR adapter extension or XTension code executes. It compares host capabilities, manifest facts, integrity metadata, fallback availability, lane placement and policy requirements, then returns the accepted plan or the rejection reason. Preflight is deliberately side-effect free: it does not open a flight session, stream UI, execute actions or materialize a surface.
2. **XScaler ATC (Air Traffic Control)** owns the runtime flight session after Preflight accepts the plan. ATC coordinates client/server communication, session identifiers, handoff from the accepted plan to the runtime host, lifecycle transitions, cancellation, fallback activation and diagnostics. ATC may orchestrate when a remote surface is asked to board or leave a slot, but it still does not turn the RMT kernel into a private remote-code executor.

Downstream layers keep the same boundary. Maraca Runtime processes accepted streams on the client, executes declared actions and materializes surfaces. XSurface Shard Server layers may orchestrate server-side remote surfaces. Generic server endpoints remain the fallback path when no remote surface orchestration is available. RMT Kernel/Fabric keeps scheduling, lanes, diagnostics and policy evaluation, but never performs private remote execution.

## Schemas

XScaler fixtures and handoff records use five stable schema names:

- `xtend.xscaler.preflight-request.v1` for host capability requests.
- `xtend.xscaler.preflight-response.v1` for acceptance, rejection and required follow-up anchors.
- `xtend.xscaler.remote-surface-plan.v1` for owner, origin, integrity, fallback and lane placement.
- `xtend.xscaler.xtension-deployment.v1` for gated XTension rollout metadata.
- `xtend.xscaler.atc-handoff.v1` for ATC-compatible session, lifecycle, fallback and runtime-boundary handoff facts.

## Preflight flow

1. The host creates an `xscaler-preflight-request` with SSR and XTension capabilities.
2. Tooling returns an `xscaler-preflight-response` that states whether the surface is accepted.
3. Accepted surfaces attach an `xscaler-remote-surface-plan` and, when needed, an `xscaler-xtension-deployment`.
4. ATC-compatible servers emit an `xscaler-atc-handoff` shape with session, signal, lifecycle and runtime-boundary facts.

## Remote surface plan

The plan mirrors the RMT remote-surface contract: owner, origin, integrity, fallback surface and lane target are static facts. XScaler does not load or execute the remote bundle during validation.

## SSR compatibility

SSR adapters must treat XScaler as a preflight-only contract. A compatible plan sets `networkDuringRender` to `false`, keeps remote execution out of the server render path and hydrates only after the preflight response is accepted.

## XTensions deployment

XTensions may use XScaler to roll out framework islands behind a gated deployment record. Deployment records must name the XTension, surface, rollout strategy and SSR hydration behavior.

## ATC handoff

An ATC handoff carries the accepted surface, session identifier, handoff signal, lifecycle state and runtime boundary. Compatible handoffs keep `remoteRuntimeExecution` and `kernelRemoteExecution` false.

## Fixtures

The minimal fixture family lives under `tests/rmt/fixtures/xscaler/` and covers preflight request, preflight response, remote-surface plan, XTension deployment and ATC handoff compatibility records.

## Related reading

Hydration policies explain when XScaler preflight data affects resume or hydrate behavior. [Related article](./hydration-policies.md)

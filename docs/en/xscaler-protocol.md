# XScaler Protocol

XScaler is the public preflight protocol that lets XTend hosts decide whether a remote surface, SSR adapter and XTension deployment can be scaled into a runtime slot before any remote code executes.

## Schemas

XScaler fixtures use four stable schema names:

- `xtend.xscaler.preflight-request.v1` for host capability requests.
- `xtend.xscaler.preflight-response.v1` for acceptance, rejection and required follow-up anchors.
- `xtend.xscaler.remote-surface-plan.v1` for owner, origin, integrity, fallback and lane placement.
- `xtend.xscaler.xtension-deployment.v1` for gated XTension rollout metadata.

## Preflight flow

1. The host creates an `xscaler-preflight-request` with SSR and XTension capabilities.
2. Tooling returns an `xscaler-preflight-response` that states whether the surface is accepted.
3. Accepted surfaces attach an `xscaler-remote-surface-plan` and, when needed, an `xscaler-xtension-deployment`.

## Remote surface plan

The plan mirrors the RMT remote-surface contract: owner, origin, integrity, fallback surface and lane target are static facts. XScaler does not load or execute the remote bundle during validation.

## SSR compatibility

SSR adapters must treat XScaler as a preflight-only contract. A compatible plan sets `networkDuringRender` to `false`, keeps remote execution out of the server render path and hydrates only after the preflight response is accepted.

## XTensions deployment

XTensions may use XScaler to roll out framework islands behind a gated deployment record. Deployment records must name the XTension, surface, rollout strategy and SSR hydration behavior.

## Fixtures

The minimal fixture family lives under `tests/rmt/fixtures/xscaler/` and covers preflight request, preflight response, remote-surface plan and XTension deployment records.

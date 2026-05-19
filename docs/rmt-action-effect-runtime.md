# RMT Action Effect Runtime

- Contract: `xtend.epic18.rmt-action-effect-runtime.v1`
- Workpackage: `WP-E18-08`
- Runtime: `xtendrmt/rmt-action-effect-runtime.js`
- Types: `xtendrmt/rmt-action-effect-runtime.d.ts`
- Fixture: `tests/fixtures/rmt-action-effect-runtime.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-action-effect-runtime --json`
- Next: `WP-E18-09`

## Purpose

The Action Effect Runtime turns common app flows into native RMT platform
primitives. Apps can load fixture, REST, SSR or host-adapter data; update typed
state; publish feedback; navigate; focus controls; lazy-load modules; and own
resources without product-local action frameworks.

The runtime is deliberately domain-neutral. It does not define product surfaces
or record taxonomies. Developers provide their own actions, contracts, adapters,
effects and resources.

## DataSources

Supported datasource kinds:

- `fixture`: returns static fixture records for local app fixtures and tests.
- `rest`: calls an injected adapter with an endpoint and payload.
- `ssr`: reads a prehydrated payload and can project it with `resultPath`.
- `host`: calls an explicit host adapter for mutations or platform commands.

Runtime code never reaches for global network APIs directly. REST and host work
through injected adapters so browser, server, test and shell environments can
choose their own transport policy.

## Actions

An action can declare:

- `datasource`
- `resultState`
- `loadingState`
- `statusState`
- `effects`
- `resources`
- `resourceOwner`
- `cancelable`

`runAction(id, payload)` moves the action through loading, success, error or
cancelled states. If a typed state runtime is passed in, loading and status are
written through `setState` and `patchState`, while datasource results can be
stored in `resultState`.

## Effects

Supported effect kinds:

- `toast` and `feedback`
- `navigation`
- `focus`
- `lazy-import`
- `side-effect`

Feedback, navigation, focus and custom side effects use injected adapters.
Lazy imports are modeled as resources, which means they can share the same
ownership and cleanup model as other runtime resources.

## Resource Ownership

Supported resource kinds:

- `object-url`
- `stream`
- `observer`
- `timer`
- `lazy-import`

Resources are acquired under an owner, normally the action id. The resource
manager exposes `releaseOwner(ownerId)` so surface destroy, render-unit destroy
or action cancel can clean up only the resources they own.

## Diagnostics

The runtime emits diagnostics with
`xtend.epic18.rmt-action-effect-diagnostic.v1` on the
`rmt.app_platform.action_effect` channel. Loading, success, error and cancel
are all visible in the local runtime history and in an optional diagnostics hub.

## Boundaries

- The RMT kernel imports no XTend UI components.
- Data access goes through injected adapters.
- Product-local action frameworks are not part of the platform contract.
- Product flow names remain app code, not framework defaults.
- Normal app UI still uses RMT templates and DOM descriptors instead of HTML
  string renderers.

## Handoff

`WP-E18-09` builds on this runtime by connecting declarative DOM and custom
events to actions. The event layer should reuse the Action Effect Runtime
instead of creating another action execution path.

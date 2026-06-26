# XTend Maraca Orchestration

This deep dive describes loaderless Maraca app bundles that do more than select components from an RMT source. They materialize a runnable, kernel-orchestrated application. The RMT file remains the source of truth for state, actions, events, resources, surfaces, hydration, validation and surface transitions.

## Build Modes

Maraca exposes five independent but coordinated orchestration switches. `auto` is the compatible default, `strict` is the CI and production hardening mode, and `off` keeps the legacy build without this layer.

```bash
xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
xt rmt build app.rmt --bundle maraca --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
```

`orchestration` enables the `xtend.rmt.app-orchestration.v1` artifact. `kernel` bundles real RMT kernel and scheduler instances. `hydration` coordinates runtime render, prerender/hydrate, lazy, visible, idle, manual, none and insular hydration through the same plan. `validation` consumes `xtend.rmt.form-validation.v1` and blocks actions when a group is invalid. `transitions` consumes `xtend.rmt.surface-transitions.v1` and runs surface changes through the existing `x-utils`/`xt-ui-effects` path.

## RMT Authoring

Validation and transitions are native RMT primitives. A typical form step declares fields, rules, a target action and the surface transition that follows the successful action.

```rmt
validation product.service.contact {
  mode blocking
  target action product.service.nextContact
  field product.service.name required message "Enter your full name."
  field product.service.email required email message "Enter a valid email address."
  field product.service.channel required message "Choose a support area."
}

transition product.service.contactToIssue {
  trigger action product.service.nextContact
  from surfaces [product.service.name product.service.email product.service.channel product.service.nextContact]
  to surfaces [product.service.subject product.service.priority product.service.details product.service.backContact product.service.nextIssue]
  effect crossfade
  durationMs 240
  easing "ease-out"
  lane transition
}
```

The compiler turns this into action gates, scheduler targets, patch plans and source maps. Strict mode fails when payload contracts, resource ownership, hydration policy, component capabilities, transition targets or validation messages are missing.

## Runtime Graph

The boot path creates the browser/host adapter, kernel runtime, core, performance runtime and scheduler diagnostics bridge. Then it starts state, resource, validation, transition, action, event, surface and renderer in that order. Maraca is the host adapter; the orchestration semantics live in the reusable XTendRMT runtime layer.

DOM is materialized only through the DOM descriptor renderer or structured `createElement` fallbacks. There is no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` or access to private ShadowRoot internals. Components are connected only through public attributes, properties, events, slots, CSS parts and design tokens.

## Runtime layer responsibilities

Maraca Runtime is the client-side execution layer in the architecture. It receives only streams and plans that have already passed XScaler Preflight and, when present, XScaler ATC handoff. Its responsibilities are to accept the stream, normalize it into runtime records, run declared actions through the public action/effect pipeline, route events, update state and materialize surfaces through safe renderers.

Maraca does not make the static accept/reject decision, does not own server-side remote-surface orchestration and does not provide generic server endpoints. If a remote surface is backed by an XSurface Shard Server, Maraca consumes the handed-off client stream and lifecycle signals. If the server only exposes generic endpoints, Maraca treats them as fallback data/action endpoints without remote surface orchestration semantics. Scheduling, lanes, diagnostics and policy evaluation are delegated to RMT Kernel/Fabric signals, while private remote execution remains outside the kernel.

## Reports And Bridges

`xtend.maraca.report.json` contains sections for `orchestration`, `kernel`, `hydration`, `validation` and `transitions`. Important fields include `planStatus`, `runtimeExpectedStatus`, `fallbackCount`, `scheduledEndpointCount`, `strictViolations`, `hydrationPolicyCount`, `insularIslandCount`, `effectCounts`, `durationRange`, `runtimeModules` and redacted `diagnostics`.

The browser exposes redacted debug bridges:

```js
window.XTendMaraca.orchestration.snapshot();
window.XTendMaraca.kernel.listScheduledEndpoints();
window.XTendMaraca.hydration.snapshot();
window.XTendMaraca.validation.evaluateGroup("product.service.contact");
window.XTendMaraca.transitions.listActiveTransitions();
```

The key custom events are `xtend-maraca:orchestration-boot`, `xtend-maraca:kernel-boot`, `xtend-maraca:kernel-schedule`, `xtend-maraca:state-change`, `xtend-maraca:validation-boot`, `xtend-maraca:validation-change`, `xtend-maraca:validation-blocked`, `xtend-maraca:surface-transition-start`, `xtend-maraca:surface-transition-complete`, `xtend-maraca:surface-transition-cancel` and `xtend-maraca:surface-transition-error`.

## Effects And Motion Policy

Surface transitions support `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale` and `none`. The duration comes from `durationMs`, but the host policy may cap it. `xt-ui-effects="none"` on `body` and `prefers-reduced-motion` win over the RMT duration and produce instant transitions with telemetry.

The transition runtime reserves the outgoing surface geometry, runs the effect and materializes the new surface at the same place only after completion. That keeps layout shifts out of the normal flow.

## Demo And Local Checks

The real-system demo is `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`. It models a multi-step customer service form with `x-input`, `x-select`, `x-textarea`, `x-button`, validation gates, kernel scheduling and surface transitions.

```bash
xt maraca build products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt --out products/rmt-maraca-kernel-orchestration/dist --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
node scripts/run_xtend_tests.js maraca-orchestration maraca-kernel-orchestration maraca-validation maraca-transitions --json
```

Use this page together with [XTend Maraca](./xtend-maraca.md), [RMT Authoring Guide](./rmt-vnext-authoring.md) and [RMT Language Server](./rmt-language-server.md).

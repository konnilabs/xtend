# Hydration Policies

Hydration connects existing markup to XTend runtime state, events, and lifecycle. It is not a synonym for rendering or resumability: rendering creates DOM, hydration adopts existing DOM, and resume additionally restores previously serialized execution state.

You therefore make three separate decisions in XTend. The **execution mode** determines where the markup comes from. The **Fabric policy** determines when and on which lane work runs. The **ownership mode** defines how much of the existing DOM the runtime may own. A sound configuration names all three axes instead of using terms such as `lazy` and `server_prerender_hydrate` interchangeably.

## Quick decision guide

| Situation | Execution mode | Fabric policy | Why |
| --- | --- | --- | --- |
| Client-only surface without existing markup | `runtime_render` | `visible` or `idle` | The runtime must create the DOM first. |
| Server-rendered or static markup that is immediately visible | `hydrate_prerendered` or `server_prerender_hydrate` | `visible` | Existing markup becomes interactive promptly. |
| Prerendered content below the viewport | `server_prerender_hydrate` | `lazy` | FCP remains independent of non-visible interactivity. |
| Returning surface with reusable state | suitable render/hydrate mode | `warm` | Preparation runs opportunistically after visible work is safe. |
| Speculative preparation for a possible next route | suitable render/hydrate mode | `prewarm` | Work may be reduced or paused under pressure. |
| Serializable preparation in a worker | `worker_prerender_hydrate` | `worker_prerender_hydrate` | The worker computes a chunk; the main thread validates and commits it. |
| Full SSR state handoff with event replay | `server_prerender_resume` plus a resumability policy | usually `visible` | The client adopts a snapshot and intents instead of binding markup only. |
| Static output with no planned interactivity | `prerender_only` | no automatic hydration | The browser receives markup without starting a binding session. |

When uncertain, start visible SSR content with `server_prerender_hydrate` plus `visible`. Choose resume only when server, integrity verification, and event replay contract are all available.

## Execution modes

The template execution path and `RmtTemplateExecutionMode` define five baseline modes:

| Mode | Phases | Default ownership | Suitable for |
| --- | --- | --- | --- |
| `runtime_render` | `main_render` | `replace_children` | Client-only UI or missing prerendered markup |
| `hydrate_prerendered` | `client_hydrate` | `hydrate_existing` | Structurally matching markup that already exists locally |
| `worker_prerender_hydrate` | worker prerender, transfer, main-thread hydration | `hydrate_existing` | Expensive serializable preparation without worker DOM ownership |
| `server_prerender_hydrate` | server prerender, HTML delivery, client hydration | `hydrate_existing` | Conventional SSR followed by interactivity |
| `prerender_only` | prerender on the selected transport | `hydrate_existing` | Static or deliberately non-interactive output |

`client_hydrate` is a runtime phase name, not a value for `hydration mode`. An unknown template mode falls back to `runtime_render` in the execution path. Do not rely on free-form names merely because the higher-level orchestration plan recognizes additional signals.

The app orchestration compiler also accepts `server_prerender_resume`, `worker_prerender_resume`, `warm`, `prewarm`, `visible`, `idle`, `lazy`, `eager`, `open`, `route`, `manual`, `none`, and `insular`. These values do not all belong to the same runtime layer. `visible` through `prewarm` are scheduling signals, `manual`, `open`, and `route` describe host triggers, and `insular` is a lifecycle boundary. `worker_prerender_resume` currently exists in the compiler and tooling catalog but does not have the same product-backed path as `server_prerender_resume`; do not treat it as a production default without a dedicated runtime smoke.

## Declare policy and mode together

The following document shows two independent combinations. The summary adopts existing markup immediately. The insights surface uses the server path but remains deferred until visibility or idle time.

```rmt
template docs.hydrationDashboard {
  state docs.hydrationSummary type object preserve {
    initial {
      id "summary"
      text "Ready"
    }
  }

  selector docs.hydrationSummary from state docs.hydrationSummary {
    output HydrationSummary
  }

  selector docs.hydrationInsights from state docs.hydrationSummary {
    output HydrationInsights
  }

  surface docs.hydrationSummary kind card component x-section {
    source selector docs.hydrationSummary
    lane visible weight 80 {
      hydrate dashboard-summary from selector docs.hydrationSummary {
        hydration policy visible
        hydration mode hydrate_prerendered
        hydration insular true
      }
    }
  }

  surface docs.hydrationInsights kind panel component x-section {
    source selector docs.hydrationInsights
    lane idle weight 30 {
      hydrate dashboard-insights from selector docs.hydrationInsights {
        hydration policy lazy
        hydration mode server_prerender_hydrate
        hydration insular true
      }
    }
  }
}
```

`hydration insular true` gives each surface an independent hydration lifecycle. It does not create a security sandbox or transfer canonical state ownership to the island. Public component contracts, Trusted DOM rules, and the host remain authoritative.

## Fabric policies in detail

`fabric/hydration-policy.js` exposes six canonical policies. Deadlines are framework defaults and may be overridden by an explicit host policy.

| Policy | Trigger | Lane | Deadline | Budget class | Behavior |
| --- | --- | --- | ---: | --- | --- |
| `visible` | `immediate-visible` | `visible` | 160 ms | `interactive` | Visible, focus-relevant, or accessibility-critical work; does not prefer idle. |
| `idle` | `idle-callback` | `idle` | 500 ms | `background` | Default for non-critical hydration without another signal. |
| `lazy` | `visible-or-idle` | `idle` | 750 ms | `background` | Waits for visibility or an idle slot and never blocks input. |
| `warm` | `warm-reentry` | `idle` | 900 ms | `opportunistic` | Prepares reusable state for a returning surface. |
| `prewarm` | `prewarm-opportunity` | `background` | 1200 ms | `best_effort` | Speculative preparation that may be dropped under load. |
| `worker_prerender_hydrate` | `worker-prerender-response` | `background` | 1200 ms | `best_effort` | Processes validated worker output and commits on the main thread only. |

Without an explicit policy, the resolver chooses `visible` for visible, focus-required, critical, or accessibility repair work. `loading: "lazy"`, a non-visible surface, or `deferUntilVisible` selects `lazy`; otherwise the default is `idle`. An explicit valid policy takes precedence over this derivation.

`warm` and `prewarm` are not alternative DOM renderers. They prepare resources, templates, or serializable data. The later visible hydration remains a separate controlled step.

## SSR hydration and resume

`server_prerender_hydrate` delivers markup and a hydration envelope. The client then performs a normal binding session. `server_prerender_resume` goes further: snapshot, event replay strategy, and integrity evidence compile into a separate resumability contract.

```rmt
template docs.hydrationResume {
  state docs.hydrationStatus type object preserve {
    initial {
      text "Ready"
    }
  }

  selector docs.hydrationStatus from state docs.hydrationStatus {
    output HydrationStatus
  }

  surface docs.hydrationShell kind page component x-section {
    source selector docs.hydrationStatus
    lane visible weight 80 {
      hydrate hydration-shell from selector docs.hydrationStatus {
        hydration mode server_prerender_resume
        resumability mode server_prerender_resume
        resumability snapshot surface_state
        resumability event replay intent_queue
        resumability integrity signed_manifest
      }
      resume hydration-shell {
        resumability mode server_prerender_resume
        resumability snapshot surface_state
        resumability event replay intent_queue
        resumability integrity signed_manifest
      }
    }
  }
}
```

Choose this path only when the server creates the snapshot, the client understands its schema, and integrity verification succeeds before resume. Resume tokens belong in telemetry only after redaction; raw tokens, user payloads, and credentials must never enter the DEV API snapshot.

## Worker prerender and prewarm

A worker may prepare serializable chunks but may not own DOM, host services, or canonical state. Generations protect against stale responses; the Trusted DOM commit occurs on the main thread.

```rmt
template docs.hydrationWorker {
  state docs.hydrationPreview type object preserve {
    initial {
      id "preview"
      text "Prepared"
    }
  }

  selector docs.hydrationPreview from state docs.hydrationPreview {
    output HydrationPreview
  }

  surface docs.hydrationPreview kind panel component x-section {
    source selector docs.hydrationPreview
    lane idle weight 30 {
      hydrate hydration-preview from selector docs.hydrationPreview {
        hydration policy worker_prerender_hydrate
        hydration mode worker_prerender_hydrate
        hydration insular true
      }
      prewarm hydration-preview from worker docs.prepareHydration
    }
  }
}
```

The compiler emits the Fabric `background` lane, the `component.worker_prerender_hydrate` fiber kind, and the `component.worker_prerender_hydrate` schedule. If the host lacks worker capability, the build or runtime report must degrade visibly; a silent remote-code fallback is not allowed.

## Use policies directly from JavaScript

Host adapters can consume the same decisions without creating parallel scheduling logic:

```js
const {
  createHydrationPolicyController,
  resolveHydrationPolicy
} = require('@ccslabs/xtend/fabric/hydration-policy');

const visible = resolveHydrationPolicy({
  componentRef: 'x-order-summary',
  isVisible: true
});

const deferred = resolveHydrationPolicy({
  componentRef: 'x-recommendations',
  loading: 'lazy',
  streamPressureLevel: 'high'
});

console.log(visible.policy, visible.lane, visible.scheduleRef);
// visible visible component.visible.hydrate

console.log(deferred.policy, deferred.status, deferred.scheduleRef);
// lazy throttled component.lazy.hydrate

const controller = createHydrationPolicyController('x-recommendations', {
  loading: 'lazy'
});
```

`controller.hydrate()` expects component fiber instrumentation. Lane, schedule, deadline, and diagnostics then appear in the same Fabric telemetry as other RMT work.

## Backpressure and priority

High general or stream backpressure changes a neutral decision to `lazy`. Lazy work then reports `throttled` and remains behind visible work. `warm`, `prewarm`, and worker prerender become `reduced` under high pressure; critical pressure completely pauses `prewarm` and worker prerender and redirects the schedule to `diagnostics.snapshot`.

A hidden or non-visibility-critical surface may not force the `user-blocking` lane. The resolver falls back to the policy lane and reports `xtend.fabric.hydration_policy.user_blocking_refused`. Visible hydration remains on the `visible` lane but may not bypass private kernel priority either.

## Verify build and report

Compile the RMT source without output first, then build with strict hydration:

```bash
xt rmt lint app.rmt --json
xt maraca plan app.rmt --orchestration strict --kernel strict --hydration strict --json
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --out dist --json
node scripts/run_xtend_tests.js hydration-policy --json
```

The plan must contain `xtend.rmt.app-hydration-plan.v1`. Inspect `policy`, `mode`, `lane`, `fabricSchedule`, `insularHydration`, and `workerPrerender` for every record. Relevant Maraca report fields also include `hydrationPolicyCount`, `insularIslandCount`, `strictViolations`, and redacted diagnostics.

At runtime, Maraca and the optional XTend DEV API expose two different views:

```js
const runtime = window.XTendMaraca?.hydration?.snapshot();
const devtools = window.__XTEND_DEV_API__?.getHydrationSnapshot?.();

console.table(runtime?.records || []);
console.table(devtools?.surfaces || []);
console.log(devtools?.strategy, devtools?.timing, devtools?.xscaler);
```

The Maraca snapshot exposes plan records and hydration history. The DEV API snapshot adds strategy, resume timing, XScaler, and per-surface state for XTend Dev Surface. Timing fields must contain elapsed durations, not absolute `performance.now()` timestamps.

## Troubleshooting

| Diagnostic or signal | Cause | Resolution |
| --- | --- | --- |
| `rmt.app_orchestration.hydration_policy_missing` | A surface has no lifecycle hydration record. | Declare `hydrate`, `mount`, or `prewarm` with a suitable policy and inspect the plan again. |
| `xtend.fabric.hydration_policy.user_blocking_refused` | Non-visible hydration requests `user-blocking`. | Use `visible` only for genuinely visible work; otherwise choose `idle` or `lazy`. |
| `xtend.fabric.hydration_policy.backpressure_deferred` | High pressure defers neutral hydration. | Treat `lazy` as expected degradation and preserve visible priorities. |
| `xtend.fabric.hydration_policy.stream_pressure_deferred` | A stream is under high pressure. | Reduce stream production or keep the surface deferred until visible. |
| `xtend.fabric.hydration_policy.lazy_stream_pressure_throttled` | Lazy work is waiting behind visible work. | Do not reschedule aggressively; observe status and lane in Fabric. |
| `xtend.fabric.hydration_policy.prewarm_paused` | Critical backpressure pauses best-effort work. | Skip prewarm and evaluate it again after pressure subsides. |
| `xtend.fabric.hydration_policy.worker_prerender_paused` | Worker prerender is paused under critical pressure. | Do not replace it with an unvalidated worker-to-DOM fallback. |
| `xtend.maraca.hydration_error` | Component loading or hydration failed at runtime. | Inspect Maraca diagnostics, the component export, and the affected hydration record. |

## Related reading

- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [XTend Maraca Orchestration](./xtend-maraca-orchestration.md)
- [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md)
- [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md)
- [XScaler Protocol](./xscaler-protocol.md)
- [XTend DEV API](./xtend-dev-api.md)
- [XTend Dev Surface](./xtend-dev-surface.md)

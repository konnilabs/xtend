# XTensions Migration and Coexistence

XTensions support incremental integration of existing UI islands. An application does not need to migrate completely away from React, Vue or an imperative library before it can use RMT, Fabric or the XTend shell.

The goal is not a second application runtime. Each island receives a bounded HostController responsibility while navigation, cross-surface communication, policy and diagnostics remain outside the framework.
The executable contract lives in `tools/xtensions/host-controller-contract.js`; adapters implement that boundary instead of inventing lifecycle names.

## The coexistence model

Native XTend components, framework XTensions and custom hosts can live in the same shell. Their boundaries differ:

| Surface | Runtime ownership | Appropriate use |
| --- | --- | --- |
| Native XTend | Host and XTend Web Components | New product UI under long-term control |
| Framework XTension | Host supplies peer runtime; adapter owns one island | Existing domain surface with a clear owner and fallback |
| Custom host | Integrator implements HostController | Specialized runtime such as Canvas, maps or a proprietary SDK |
| Remote XTension | Host policy plus integrity and fallback | Controlled, separately versioned artifact delivery |

Fabric is the shared communication boundary. Islands do not call each other through framework contexts or global event buses.

## Choose a migration surface

Start with a surface that has a clear domain owner, few cross-surface dependencies and a visible fallback. Avoid using global navigation, authentication or a region that reads many untyped globals as the first pilot.

Record the following before changing it:

- mount and unmount timing;
- incoming props, signals and resources;
- outgoing events;
- global listeners, timers, observers and network access;
- public URL and focus ownership;
- behavior when the peer runtime is missing.

This inventory becomes the first adapter contract and prevents hidden side effects from disappearing during the move.

## Migrate incrementally

1. Place the existing surface behind a host element without changing behavior.
2. Describe lifecycle, capabilities, signals, events, cleanup and fallback as a HostController contract.
3. Register a project-local manifest with version, entry, integrity and peer classification.
4. Route cross-surface messages through Fabric.
5. Verify `ready`, `degraded`, error and unmount paths in local suites and a browser smoke.
6. Only then move additional state or navigation ownership from the island into the shell.

A React example therefore does not start with a rewrite. The host can create the existing root component in `mount()`, forward props in `update()` and remove it completely in `unmount()`. Individual domain components can become native later without changing the Fabric contract.

## Separate state and routing

Framework-local UI state may stay inside the island. State required by multiple surfaces, deep links or server resume payloads belongs at the explicit XTend or RMT boundary.

The same rule applies to routing. An island may manage internal tabs. Changes to the canonical application route must be visible as a host event or action so browser history, focus and other surfaces remain consistent.

## Measure success

A coexistence migration succeeds when:

- the surface starts deterministically with and without its peer runtime;
- missing capabilities degrade only the affected island;
- no listener or render loop survives `unmount()`;
- events and signals are serializable and have an owner;
- performance, kernel and Fabric diagnostics identify the island;
- fallback can render without framework code.

Verify the shared contracts with:

```bash
node scripts/run_xtend_tests.js xtensions-host-controller xtensions-signal-bridge xtensions-runtime-capability-registry --json
```

## Common mistakes

An XTension is not a reason to move new domain logic into an external framework. Use it for existing or specialized islands and prefer native surfaces for new owned components.

Do not hide a peer runtime in the adapter bundle. The host must be able to inspect its version and availability before `mount()` runs.

Do not share framework contexts between islands. That couples lifecycle and versions while bypassing Fabric diagnostics, backpressure and security policy.

## Next steps

- [XTensions Authoring Guide](./xtensions-authoring-guide.md)
- [XTensions Security Checklist](./xtensions-security-checklist.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [XTend Fabric](./xtend-fabric.md)

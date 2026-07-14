# Best Practices

Robust XTend applications come from clear ownership, small public contracts, and observable failure behavior. The following rules apply to XTend Classic hosts and Maraca/RMT app shells alike.

## Start with public contracts

Integrate components through tags registered in `components/manifest.json` and their `.d.ts` declarations. Use attributes, properties, events, slots, CSS parts, and tokens; do not reach into private shadow DOM or internal state objects. A wrapper may translate a contract, but should not extend it silently.

Keep IDs, state keys, and event names stable. A change to a schema such as `xtend.rmt.component-contract.v1` needs a migration or a new version, not merely an updated example.

## Give work to the right owner

Canonical state belongs to the application or its responsible controller. Fabric lanes schedule work but do not own business state. A worker may normalize snapshots or prepare data, but must not take ownership of DOM or host services. For XTensions, runtime, container, and CSS remain host-owned.

## Load locally and explicitly

Use [XTend Classic](./xtend-classic.md) with `xtend-loader.js` and a local manifest for directly authored HTML and JavaScript. Remote surfaces require an origin allowlist, integrity, capability policy, and a local fallback. Dynamic imports may resolve known modules only; a URL supplied by a user is not a module reference.

## Measure rather than guess

Set budgets for mount, hydration, and interaction, then run the corresponding gates. The [XTend Dev Surface](./xtend-dev-surface.md) makes performance, kernel, and Fabric state visible, but it does not replace a reproducible CI report. Diagnostic snapshots should identify their time base, schema, and status explicitly.

## Degrade visibly

An optional adapter may fail without taking down its host. Its fallback must name the missing capability. Security, integrity, and kernel failures remain blocking; they must not be relabeled as a generic warning.

Start a new integration with the [Quick Start](./quick-start-guide.md). Before publishing, inspect the commands and reports in [Release Verification](./release-verification.md).

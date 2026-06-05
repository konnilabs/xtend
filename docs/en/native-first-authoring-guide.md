# Native-First Authoring Guide

This guide is the entry point for authors who build XTend components or app building blocks. The stable path is: check browser primitives first, use owned XTend primitives next, express the surface through RMT, and tie every product claim to a registered contract.

## Decision Order

| Question | Expectation |
| --- | --- |
| Is there a browser primitive? | Use it directly, or through a thin XTend primitive when security, scheduling or fallback rules are needed. |
| Does the surface need framework capability? | Use owned XTend primitives for theme, state, events, slots, scheduler, dialogs, focus, forms, navigation and media. |
| Can RMT describe it? | Describe the UI as RMT records so source maps, diagnostics, actions, resources and DOM descriptor rendering stay available. |
| Is the product claim proven? | Reference a registered contract ID and the matching local check. |
| Does it add a runtime dependency? | Treat it as an exception with audit evidence, an exit plan and budget evidence. |

## Native-First Definition

A Native-First XTend building block meets these conditions:

- It prefers browser-native primitives such as Custom Elements, DOM Events, Form APIs, Dialog, Popover, CSS Containment, URL, Fetch and standard focus rules.
- It wraps browser complexity only where XTend adds a clear lever: contracts, scheduler lanes, security boundaries, source maps or reusable UI primitives.
- It does not add a production UI framework runtime.
- It remains discoverable through the Contract Registry.
- It can be described as an RMT-first surface or derived from an RMT recipe.

Relevant contracts:

- `xtend.native-first.mission-source-of-truth.v1`
- `xtend.native-first.dependency-diet-policy.v1`
- `xtend.native-first.contract-registry.v1`
- `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- `xtend.native-first.docs-authoring-guides.v1`

## Component Authoring

Start with the smallest visible surface. A button, form control, navigation item, dialog or media preview should stay controllable through browser events, attributes, properties and CSS. Owned XTend wrappers are useful when they collect repeated accessibility rules, focus management, scheduler lanes or Trusted DOM boundaries.

The default for DOM output is the DOM Descriptor Renderer. It makes tags, attributes, properties, URL fields, text and event routing explicit. Free HTML sinks, inline JavaScript and direct host-shell workarounds are not authoring convenience. When HTML must be processed intentionally, use Trusted DOM and sanitizing.

Read next:

- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [RMT Component Template Primitives](./rmt-component-template-primitives.md)

## App Authoring

For app shells, dashboards, forms, overlays, navigation, data display, command/search, media and docs flow, start from RMT recipes. The recipe describes structure, state, actions, effects, data sources, resources, slots, regions and surfaces. The renderer turns that into DOM descriptor records so the surface stays auditable.

Use the [Native-First RMT Recipes](./native-first-rmt-recipes.md) guide when a UI spans multiple surfaces or when a manual host shell looks tempting. For existing vendor-backed, legacy or non-native paths, the [Native-First Migration Guide](./native-first-migration-guide.md) walks through alternative, check and SemVer rule. Only when a recipe exposes a real gap should a new XTend primitive or syntax extension be evaluated.

## Evidence Before Release

Before a production Native-First claim, these signals must exist:

- The contract ID is discoverable in the registry.
- The local check is named, such as `contract-registry`, `native-first-budget-gates`, `rmt-complete-ui-recipes` or `rmt-renderer-dom-descriptor-proofs`.
- Bundle, performance, interaction and visual claims have budget evidence.
- Browser-lab or visual claims name an artifact or remain visible as a residual.
- Dependency exceptions include security, supply-chain and exit-plan evidence.

For release-facing verification, use [Native-First Release Review](./native-first-release-review.md).

## Blocked Claims

- An external UI framework runtime is not the default.
- Runtime dependencies without an exit plan are blocked.
- Unsafe HTML, inline JavaScript, eval and manual raw-DOM sinks are blocked.
- A visual browser claim without an artifact is blocked.
- A contract claim without a registry entry is blocked.

## Minimal Check

```bash
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js docs-public-quality --json
```

Expected signal: Guides, contract IDs, menu entries and budget or registry duties remain synchronized.

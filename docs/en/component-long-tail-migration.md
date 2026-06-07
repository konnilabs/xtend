# Component Long-Tail Migration

This page explains how XTend evaluates remaining helper and infrastructure surfaces without turning them into a broad rewrite of visual components. The focus is on verifiable checks, stable types, clear integration probes and a neutral RMT boundary.

## When To Use This Page

Use this page when you need to decide whether a helper surface should become a visual component, an integration probe or a narrow public contract. `xstate` and `x-utils` represent this kind of boundary: they matter for applications, but they should not be forced into visual shells.

## Local Check

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
```

The check reads the local catalog, evaluates the remaining entries and confirms that RMT does not gain a hard dependency on XTend types.

## Decision Rules

- Visual components need usability, styling, keyboard behavior and measurable runtime profiles.
- Helper surfaces need a narrow public contract and an integration probe.
- RMT describes connections and behavior declaratively, but does not import component types.
- New product claims wait until the matching local check is stable.

## Review Flow

The migration starts with a catalog read. An entry does not become a component just because it is frequently used by product code; it becomes a component when it owns a visible surface, user interaction, state transitions or semantic behavior. `xstate` remains a runtime contract: it synchronizes canonical keys, events and subscriptions without presenting UI. `x-utils` remains a helper surface as long as its API is pure utility, formatting or a narrow integration point. Only helpers that start owning focus, roles, layout or user-triggered behavior move into component review.

Every candidate needs the smallest stable evidence that proves its boundary. A visual entry needs a loader fixture, a manifest entry, keyboard coverage and public docs. A helper surface usually needs a focused integration probe that verifies export names, error behavior and RMT neutrality. The `component-long-tail-migration` gate collects those decisions so reviewers can see why a remaining entry is accepted, deferred or blocked.

## Owner Evidence

An owner should be able to answer three questions during handoff: which user or host action is protected, which local test proves the claim, and which boundary prevents a later dependency on RMT or framework types. For `xstate`, that boundary is the canonical store contract. For `x-utils`, it is the absence of DOM and browser side effects. Both can be referenced by guides, recipes and fixtures, but neither creates product claims such as dragging, popover behavior or surface orchestration.

If a candidate is promoted later, it needs a new contract with clear user impact. That includes a manifest entry, placement in `docs/menu.json`, German and English authoring docs, and a local gate that makes the migration reproducible. Without that evidence the entry intentionally stays narrow. This keeps internal helpers from becoming public components by accident.

## Release Decision

For releases this page acts as both a positive and negative filter. The positive filter says the long tail has been inventoried, remaining helpers have accepted boundaries, and new component claims have their own tests. The negative filter says a release must not claim a helper is a full UI component until usability, styling, accessibility and runtime evidence exist. That distinction protects Native-First and RMT handoffs from unclear dependencies.

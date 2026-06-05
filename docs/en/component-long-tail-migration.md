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


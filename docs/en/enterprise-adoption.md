# Enterprise Adoption

This guide helps an external team introduce XTend into an existing web product under controlled conditions. The goal is a small, reversible pilot with explicit ownership boundaries, not an immediate rewrite of the current frontend.

## Before technical integration

Identify the problem XTend should solve: local Web Components, RMT authoring, schedulable hydration, a surface runtime, or browser diagnostics. Select only the packages and public subpaths required for that problem from `package.json#exports`.

Record the following for the pilot:

- domain and technical owner;
- browser and CSP requirements;
- allowed local and optional remote sources;
- state, routing, and focus ownership;
- performance and accessibility budgets;
- fallback and rollback path.

## Choose a pilot

A suitable surface has few global dependencies, visible failure behavior, and a realistic user interaction. Global navigation, authentication, and a silently shared event bus are poor first candidates. Start with the [Quick Start](./quick-start-guide.md) when you need components only, or [Learn RMT](./learn-rmt.md) for a declarative application boundary.

Keep `components/manifest.json` and `xtend-loader.js` local. Attach a framework island through a HostController; do not hide its peer runtime inside an XTension bundle. Route cross-surface communication through typed events or Fabric rather than framework contexts.

## Acceptance criteria

The pilot succeeds only when development and production boot the same way, no CDN is required, and missing optional capabilities degrade visibly. Mount and unmount must not retain listeners, timers, or resource handles. Keyboard behavior, screen-reader signals, reduced motion, and performance budgets are acceptance work, not later polish.

The [XTend Dev Surface](./xtend-dev-surface.md) helps with local observation. Reproducible decisions come from JSON reports produced by the relevant gates and the sequence in [Release Verification](./release-verification.md).

## Operations and upgrades

Pin a tested package version and import documented exports only. Before upgrading, inspect the changelog, migration notes, type exports, and affected component contracts. When a schema or default changes, update source, fixtures, and runbook together.

Before handing the pilot to another team, verify its published entry points with the [Package Export Lock](./package-export-lock.md) and capture the package evidence with `npm run pack:dry-run:report`.

Keep a working fallback until the new surface has demonstrated its failure and recovery paths in the product. A successful happy path alone is not sufficient adoption evidence.

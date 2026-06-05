# RMT App Platform Authoring

RMT App Platform Authoring beschreibt die generischen Records fuer App Shell, Templates, Komponenten, Events, Actions, DataSources, Resources und Surfaces.

- Contract: `xtend.epic18.rmt-app-platform-authoring.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-app-platform-authoring --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Authoring Boundaries

- App-Records bleiben domain-neutral.
- DOM-Ausgabe laeuft ueber DOM Descriptor Records.
- Host Adapter sind injizierte Grenzen und keine Kernel-Typen.
- Event- und Action-Payloads brauchen deklarative Contracts.
- Resource Lifecycle braucht Owner, Cleanup und Diagnostics.

## Handoff

Diese Doku ist Teil des Epic18 Release Handoffs und wird durch `epic18-rmt-app-platform` als required doc referenziert.

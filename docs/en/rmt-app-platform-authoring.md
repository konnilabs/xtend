# RMT App Platform Authoring

- Contract: `xtend.epic18.rmt-app-platform-authoring.v1`
- Fixture: `tests/fixtures/rmt-app-platform-authoring.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-app-platform-authoring --json`
- Workpackage: `WP-E18-04`

## Purpose

This authoring model defines RMT as a generic app platform. It is not a port of a concrete product surface. Developers can combine their own app domains, record contracts, component families, surfaces, state graphs, actions, datasources, resources and events.

## Primitives

| Primitive | Purpose |
|-----------|---------|
| `app` | app metadata, shell, domain, record contract and entry points |
| `route` | maps URL or navigation state to surface and template |
| `surface` | keyed app areas with lifecycle, placement, state and persistence |
| `slot` | named composition points between templates and components |
| `template` | structured UI as DOM Descriptor, not as HTML string |
| `component` | binds arbitrary custom elements through a capability catalog |
| `state` | typed app state for collections, selection, filters and form values |
| `selector` | derived read views on state |
| `derive` | computed values with clear output type |
| `repeat` | keyed lists without product renderer |
| `when` | declarative conditions, empty and fallback states |
| `bind` | maps state, selectors or derived values to attributes/properties |
| `action` | declarative commands for app flows |
| `effect` | async execution with lanes and feedback |
| `datasource` | fixture, REST, SSR or later host data adapters |
| `resource` | lazy/preload/cleanup resources including trusted-HTML special case |
| `event` | scoped event routing without an implicit global event bus |

## Boundaries

- `no-media-manager-product-surface-clone`
- `no-product-record-contract-required`
- `structured-ui-before-trusted-html`
- `trusted-html-explicit-boundary-only`
- `no-rmt-kernel-import-of-xtend-types`
- `no-external-innerhtml-helper-required`

Normal app UI must be modelable through structured templates. HTML remains an explicit Trusted DOM boundary for special cases and is not the default path for component development.

## Handoff

`WP-E18-04` only defines the authoring model. `WP-E18-05` then builds the safe DOM Descriptor Renderer and No-Manual-HTML gate. `WP-E18-06` implements the component-native template primitives on top of that.

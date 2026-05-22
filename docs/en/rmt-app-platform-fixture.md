# RMT App Platform Fixture

WP-E18-12 delivers the generic reference fixture for the RMT App Platform. It proves that the Epic 18 primitives are not coupled to a product surface: the same RMT building blocks carry a `generic-catalog`, an `admin-queue` and a `content-board`.

## Contract

- Schema: `xtend.epic18.rmt-app-platform-fixture.v1`
- Fixture schema: `xtend.epic18.rmt-app-platform-fixture-source.v1`
- Local gate: `node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`
- Package script: `npm run test:rmt-app-platform-fixture`
- Handoff: `WP-E18-13`

## Covered Platform Capabilities

- configurable record contracts without a fixed record class
- list, detail, toolbar, feedback and overlay composition with DOM Descriptor templates
- actions with fixture, REST, SSR and host datasources
- feedback, navigation, focus, lazy-import and side-effect flows
- dynamic surfaces for multiple domains from the same primitives
- portals and overlays including stack behavior
- resource ownership and cleanup for streams, observers, timers, object URLs and lazy imports
- scaffold build evidence through the RMT App Platform generator

## Boundaries

Normal RMT UI remains declarative. `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write` do not belong in the app fixture; the No-Manual-HTML gate checks this explicitly. Product-bound surface lists are avoided as well. Developers should be able to build in XTend app structures without external shell renderers or local registry rewrites.

## Fixture Artifacts

- `catalog/epic18-rmt-app-platform-fixture.js`
- `tests/fixtures/rmt-app-platform-fixture.rmt`
- `tests/rmt/rmt_app_platform_fixture_suite.js`
- `development/WP-E18-12-Generische-RMT-App-Platform-Fixture-bauen.md`

The gate renders the fixture with the DOM Descriptor Renderer, routes events into actions, swaps datasources, materializes surfaces, opens overlays and proves cleanup through resource disposals.

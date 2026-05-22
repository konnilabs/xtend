# XTendRMT Parsedown Scheduling Pilot

- Status: active Docs App pilot since `ER-WP-40`, shell-first refactor active
- Contract: `xtend.docs.parsedown-rmt-scheduling.v1`
- Pilot Contract: `xtend.docs.parsedown-rmt-pilot.v1`
- Production-Hardening Contract: `xtend.epic13.docs-rmt-production-hardening.v1`
- Pilot document: `docs/xtendrmt-parsedown-docs.rmt`
- Current runtime: `docs/index.php` + `docs/utils/parsedown.php` + `docs/utils/pageloader.js`

## Purpose

The official XTend documentation is itself an XTend app. Markdown files in the `docs` folder are converted to HTML server-side through Parsedown and displayed client-side as an SPA through XRouter. The host now mirrors only the initially required HTML page into `window.xtendDocsPages`; additional Parsedown payloads are loaded per route through `window.xtendDocsPageEndpoint`.

The current state is shell-first: the visible page shell is no longer built purely imperatively in PageLoader, but rendered as a `dom_descriptor` from `docs.app.shell` in the RMT pilot document. Parsedown remains the host adapter and only fills the content slot. This lets the Docs App later load rich HTML or XPlayer tutorial content alongside Markdown as RMT-planned slots; the machine-readable content kind for this is `xplayerTutorial`. Parsedown and XTend are not embedded into the RMT kernel.

## ER-WP-40 Pilot Artifacts

| Artifact | Role |
|----------|------|
| `docs/xtendrmt-parsedown-docs.rmt` | RMT pilot document for shell-first templates, docs routes, Parsedown templates, schedules, rich-content slots and host adapter |
| `docs/index.php` | active parser host, sets `Parsedown::setSafeMode(true)` and mirrors `window.xtendDocsRmtDocument`, `window.xtendDocsRmtPilot` and `window.xtendDocsPagesMeta` |
| `docs/utils/pageloader.js` | renders `docs.app.shell` and `docs.header.search` from RMT `dom_descriptor` templates, marks content slots with `data-rmt-template`, `data-rmt-parse-schedule`, `data-rmt-trust-boundary` and `xtend.docs.parsedown-rmt-render.v1` |
| `tests/rmt/docs_rmt_pilot_suite.js` | gate for RMT normalization, runtime registry, Trusted DOM boundary and Docs App wiring |
| `package.json` | metadata under `xtend.docsRmtPilot` and script `npm run test:docs-rmt-pilot` |

The pilot is deliberately host-neutral: `docs/index.php` remains the parser host while RMT describes the shell, search UI, schedules and future content slots. PageLoader is therefore a host adapter for RMT descriptors.

Starting with `WP-E13-10`, the same path also has the production-hardening layer `xtend.epic13.docs-rmt-production-hardening.v1`. It stabilizes `docs.slot.content`, `docs.slot.rich-content`, `docs.slot.media` and `docs.slot.diagnostics` so Parsedown HTML, rich HTML through `docs.rich-content.prepare`, XPlayer tutorials through `docs.media.lazy` and diagnostics can be scheduled separately. The gate is `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`.

Since skeleton hardening, the pilot uses the native `xtend.loader.skeleton-loader.v1` and `xtend.loader.style-registry.v1`: the loader registry covers undefined XTend Custom Elements with declarative skeletons or hidden Light DOM, XRouter shows a per-route skeleton fallback during import and hydration, and `xtend-doc-page` uses the same loader for the Parsedown content slot. This keeps the app shell visible and stable while the heavy HTML commit happens only after first paint. `xtend.css` remains usable as the standard file name for host theming, but it is no longer a hard requirement for this FOUC protection.

## Current Docs App Flow

1. `docs/index.php` finds all `.md` files recursively.
2. `docs/utils/parsedown.php` converts only the initial or route-requested Markdown file to HTML.
3. `window.xtendDocsPagesMeta` contains SEO, schedule and RMT metadata by slug; `window.xtendDocsPages` contains only existing HTML payloads.
4. `<x-router mode="hash" skeleton="article">` routes to `xtend-doc-page`, lazy-loads its module and hydrates the route subtree through the loader.
5. `docs/utils/pageloader.js` reads `window.xtendDocsRmtDocument` and renders `docs.app.shell` shell-first.
6. The `data-rmt-slot="content"` slot shows a native SkeletonLoader until Parsedown HTML has been sanitized and inserted after first paint.
7. `docs.header.search` provides header search as an RMT descriptor for the `search` slot of `x-header`.
8. `docs/menu.json` defines the visible navigation hierarchy; `pageloader.js` groups and prioritizes it for drawer navigation.

Since the document-title rewrite, additional RMT route records are generated for every Markdown file and mirrored into `window.xtendDocsRmtDocument.routes`. `docs/index.php` extracts the first H1 as `title`, creates `documentTitle`, `titleTemplate`, `metaDescription` and `metaKeywords`, and renders the visible `<x-route>` attributes `title`, `document-title`, `title-template`, `meta-description` and `meta-keywords` from them. XRouter then performs the actual writes to `document.title` and the SEO meta tags. This keeps the use case declarative in RMT while browser side effects remain in the XRouter adapter.

This flow remains a host flow. RMT provides the shell and schedule records; DOM sinks, Parsedown and concrete event bindings remain in the Docs host adapter.

After sanitizing, the host adapter also normalizes inline code from Parsedown SafeMode. SafeMode escapes backtick content such as `` `<x-code>` `` twice in some cases (`&amp;lt;...&amp;gt;`). `pageloader.js` decodes these entities only inside `<code>` nodes and writes them back as `textContent`. This keeps the Trusted DOM boundary intact while component and API names remain readable in the documentation.

## Navigation Hierarchy

Since hierarchy hardening, docs navigation uses stable metadata per article:

- `id`: canonical article ID, for example `docs.components.xcode`
- `group`: visible navigation area such as `core`, `components`, `rmt` or `release`
- `parent`: optional parent slug for deep-dive branches
- `tier`: classification such as `basic`, `deep-dive`, `component-reference` or `release-deep-dive`
- `rank`: PageRank-like visibility value where high values appear first and directly visible

This means users first see foundations such as the start page, manifest, API, component overview or XTendRMT overview. Specific articles are offered cascaded under the respective entry point as deep dives.

## RMT Target Shape

Parsedown is described as its own host adapter:

```json
{
  "id": "docs.parsedown",
  "kind": "template_adapter",
  "runtimeSurface": ["server", "browser_classic"],
  "providedCapabilities": ["markdown", "htmlFragments", "slugIndex", "scheduleRefs"],
  "kernelVisible": false
}
```

The Docs App remains XTend UI:

```json
{
  "id": "docs.page",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "xtend-doc-page",
  "schedule": "docs.page.hydrate"
}
```

The shell itself is an RMT template:

```json
{
  "id": "docs.app.shell",
  "mode": "dom_descriptor",
  "schedule": "docs.shell.render",
  "nodes": [
    {
      "tag": "x-section",
      "attributes": {
        "data-rmt-shell": "docs.app.shell",
        "data-rmt-shell-mode": "shell-first"
      }
    }
  ]
}
```

Parsedown work is planned as a schedule policy:

```json
{
  "id": "docs.markdown.parse",
  "endpointName": "xtendrmt.docs.parsedown.parse",
  "scope": "docs.markdown",
  "lane": "background",
  "priority": 35,
  "preferIdle": true,
  "budgetClass": "background"
}
```

## Pilot Document

The production pilot document lives at `docs/xtendrmt-parsedown-docs.rmt`. It contains three real docs routes:

- `/readme`
- `/enterprise-adoption`
- `/xtendrmt-parsedown-scheduling`

Abbreviated structure:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "documentId": "docs.xtend.developer-center",
  "namespace": "docs",
  "adapters": [
    {
      "id": "docs.parsedown",
      "kind": "template_adapter",
      "runtimeSurface": ["server"],
      "providedCapabilities": ["markdown", "htmlFragments", "slugIndex", "scheduleRefs"],
      "kernelVisible": false
    },
    {
      "id": "xtend.xrouter",
      "kind": "router_adapter",
      "runtimeSurface": ["browser_classic"],
      "providedCapabilities": ["routes", "navigation", "scheduleRefs"],
      "kernelVisible": false
    },
    {
      "id": "xtend.component",
      "kind": "component_adapter",
      "runtimeSurface": ["browser_classic"],
      "providedCapabilities": ["components", "customElements", "hydration", "scheduleRefs"],
      "kernelVisible": false
    }
  ],
  "components": [
    {
      "id": "docs.page",
      "kind": "custom_element",
      "adapter": "xtend.component",
      "tag": "xtend-doc-page",
      "schedule": "docs.page.hydrate"
    },
    {
      "id": "docs.shell",
      "kind": "template_component",
      "adapter": "docs.rich-content",
      "tag": "x-section",
      "schedule": "docs.shell.render"
    },
    {
      "id": "docs.media.player",
      "kind": "custom_element",
      "adapter": "xtend.component",
      "tag": "x-player",
      "schedule": "docs.media.lazy"
    }
  ],
  "routes": [
    {
      "id": "docs.readme",
      "path": "/readme",
      "router": "xtend.xrouter",
      "component": "docs.page",
      "title": "XTend Developer Documentation",
      "documentTitle": "XTend Developer Documentation | XTend Dokumentation",
      "titleTemplate": "{{title}} | XTend Dokumentation",
      "metaDescription": "Developer Documentation fuer XTend UI und XTendRMT.",
      "template": "docs.readme.markdown",
      "schedule": "docs.route.render"
    }
  ],
  "schedules": [
    {
      "id": "docs.shell.render",
      "endpointName": "xtendrmt.shell.render",
      "scope": "docs.shell",
      "lane": "visible",
      "priority": 90
    },
    {
      "id": "docs.markdown.parse",
      "endpointName": "xtendrmt.docs.parsedown.parse",
      "scope": "docs.markdown",
      "lane": "background",
      "priority": 35,
      "preferIdle": true
    },
    {
      "id": "docs.route.render",
      "endpointName": "xtendrmt.route.render",
      "scope": "docs.route.render",
      "lane": "visible",
      "priority": 80
    },
    {
      "id": "docs.page.hydrate",
      "endpointName": "xtendrmt.component.hydrate",
      "scope": "docs.page.hydrate",
      "lane": "idle",
      "priority": 40,
      "preferIdle": true
    },
    {
      "id": "docs.media.lazy",
      "endpointName": "xtendrmt.docs.media.lazy",
      "scope": "docs.media",
      "lane": "idle",
      "preferIdle": true
    }
  ],
  "templates": [
    {
      "id": "docs.readme.markdown",
      "mode": "html_fragment",
      "source": "docs/README.md",
      "adapter": "docs.parsedown",
      "security": {
        "markupClass": "parsedownHtml",
        "trustBoundary": "xtend.security.sanitizing-boundary.v1",
        "sink": "trustedDomBoundary"
      },
      "hydration": {
        "mode": "hydrate_prerendered",
        "metadata": {
          "endpointHint": "xtendrmt.docs.parsedown.parse"
        }
      }
    }
  ]
}
```

## Responsibility Boundaries

| Responsibility | Location |
|----------------|----------|
| Read Markdown | Docs App or Docs host adapter |
| Execute Parsedown | `docs.parsedown` adapter |
| Provide HTML fragments | Docs App host boundary with `xtend.security.sanitizing-boundary.v1` |
| Render shell-first app shell | `docs.app.shell` through Docs host adapter |
| Render header search | `docs.header.search` through Docs host adapter |
| Prepare rich HTML and tutorial videos | `docs.rich-content` and `docs.media.lazy` |
| Register routes | `createRmtXRouterAdapter` |
| Hydrate page | `createRmtXtendComponentAdapter` |
| Mirror scheduling and diagnostics | `createRmtStateSchedulerDiagnosticsBridge` |

The RMT kernel receives only records, policies and diagnostics. It parses no Markdown, calls no PHP and sanitizes no HTML. Parsedown output counts as `parsedownHtml` despite `Parsedown::setSafeMode(true)` and must pass through the Trusted DOM policy from [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md).

## Implemented Pilot Steps

| Step | Status |
|------|--------|
| Convert Docs App flow to shell-first RMT shell | `done` |
| Create `.rmt` pilot for docs routes and Parsedown schedules | `done` |
| Describe `docs.parsedown` adapter as host layer | `done` |
| Render `docs.app.shell` as production RMT app shell | `done` |
| Render `docs.header.search` as RMT header-search template | `done` |
| Prepare rich-content and `x-player` slots as future-ready RMT schedules | `done` |
| Prove `xtend.security.sanitizing-boundary.v1` for Parsedown HTML in the host adapter | `done` |
| Use `createRmtFormat().normalizeDocument(...)` and `createRuntimeRegistries(...)` for docs routes | `done` |
| Add per-page RMT metadata to the Docs App | `done` |
| Make Parsedown parse jobs schedulable through `xtendrmt.docs.parsedown.parse` | `done` |
| Extend reference and RMT pilot gates | `done` |

Not yet part of the pilot: production XRouter routes are not registered from the RMT document. That remains a later runtime expansion. Also not active yet: rich HTML and XPlayer content are only prepared as slots and schedules, but not filled with external tutorial payloads.

## Minimum Gates

```bash
php -l docs/index.php
node scripts/run_xtend_tests.js docs-rmt-pilot --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js rmt-compatibility --json
```

The pilot is shell-first, but remains framework-agnostic. Until a production `docs.parsedown` runtime adapter replaces the PHP side, `docs/index.php` remains the active parser host.

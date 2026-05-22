# XTend Architecture Decision Record

- Status: Accepted
- Date: May 8, 2026
- Contract: `xtend.docs.architecture-decision-record.v2`
- Type: product architecture baseline for XTend UI, XTend-Fabric and XTendRMT

## Purpose

This ADR replaces the earlier architecture snapshot from the first epics. The old version still described a platform in transition: Core consolidation, loader rename, RMT fusion, test harness and component coverage were partly still target states at that time.

Today's decision describes the current architecture contract for XTend as an enterprise web framework:

- XTend UI is the Web Component and UI Builder product.
- XTendRMT is scheduler, runtime kernel, templating engine and native `.rmt` authoring language.
- XTend-Fabric is the host-near protection, telemetry, lane and reporter layer.
- The Docs App is an XTend app with an RMT-generated shell and Parsedown as a scheduled content component.
- RMT tooling, linter and language server are part of the authoring platform.

## Decision

XTend continues as a **manifest- and state-centered Web Components framework** with RMT-first app authoring, Fabric boundary and TypeScript-first Component Platform.

Documentation, manifest and runtime APIs must be maintained as one connected contract going forward.

The architecture deliberately separates five responsibilities:

| Layer | Responsibility | May know about | Must not do |
|-------|----------------|----------------|-------------|
| XTend UI | Custom Elements, shells, styling, a11y, UX and host components | Manifest, Loader, Component Contracts, Fabric Context | implement RMT kernel semantics |
| XTend Loader | local ESM imports, manifest policy, bootstrap, component loading | Manifest, Import Policy, Runtime API | force CDN fallbacks or silently load external sources |
| XTend-Fabric | error boundaries, telemetry, reporter adapters, fibers, lanes, backpressure | XTend Runtime, optional RMT Adapter Results | parse RMT documents or replace XTendRMT |
| XTendRMT | `.rmt` source, DSL domains, scheduling, templates, routes, diagnostics | neutral adapter records and host capabilities | directly import XTend, XRouter, DOM, React, Vue or `xstate` |
| Tooling | linter, LSP, snippets, reports, editor bridges | RMT Source Model, Parser, Rule Engine, Schema | maintain separate semantics beside the RMT language core |

## Architecture Principles

### 1. Native Web Standards Remain the Core

XTend is based on Custom Elements, Shadow DOM, slots, CSS Custom Properties and ES modules. Build and TypeScript artifacts must not hide this runtime behind a proprietary abstraction model.

Components remain real Web Components. Integrations for React, Vue or custom hosts are adapters or host conventions, not replacements for the native surface.

### 2. State-Centered UI

`xstate` remains the host-near state boundary for XTend UI. State is the observable truth for UI states, route mirrors, theme context, feedback, component states and diagnostics.

The **Digital Twin Principle** remains binding: relevant UI actions must write back into a traceable state, event or diagnostic record. Local flags may only be derived render caches.

### 3. RMT-First, but Framework-Agnostic

New app shells, routes, templates and scheduling policies should primarily be described in native `.rmt` documents. `.rmt.json` remains only an edge-case fallback for hosts without a suitable MIME type or for legacy paths.

RMT is still not an XTend submodule. XTend is a first-class host, but not a required host. The RMT kernel sees adapter records such as `xtend.component` or `xtend.xrouter`, but imports no XTend components and performs no DOM work itself.

### 4. Shell-First Rendering

App shells should render stably first. Content, Markdown, rich HTML, media and heavy components are scheduled or lazily loaded afterward.

The Docs App is the reference path: RMT creates the shell, Parsedown is a scheduled content component. Later content such as XPlayer tutorials or rich-content blocks can be added to the same scheduling structure.

### 5. Fabric as Safety and Telemetry Layer

XTend-Fabric is the global host safety layer for error boundaries, reporter adapters, telemetry, lane/fiber context, backpressure and quality signals.

Fabric may ingest RMT adapter results and scheduler signals, but it must not replace the RMT kernel. This keeps the boundary clear:

```text
RMT Kernel -> Adapter / Bridge Result -> XTend-Fabric -> XTend UI / Reporter
```

### 6. Performance by Design

Performance is not a later optimization step. Components must declare their hydration, visibility, idle, busy and measurement profiles. Loader, Fabric and RMT may use these profiles for scheduling and diagnostics.

The accepted baselines are:

- local ESM instead of CDN dependency
- manifest-based import policy
- lazy, idle and visible hydration policies
- performance regression gates
- component-level performance profiles
- shell-first rendering for initial app setup

### 7. A11y by Design

A11y is part of the Component Contract. New components must treat keyboard behavior, focus, ARIA, screen-reader signals, reduced motion, contrast and visible states as product surface.

RMT may describe a11y-relevant shell and component metadata. Concrete execution remains with XTend UI and the host adapters.

### 8. Tooling Is Part of the Product

RMT is not only a runtime format, but an authoring language. Therefore linter, AI-agent repair report, snippets, LSP, editor bridges and release gates belong to the platform.

The language server uses the same semantics as `xt rmt lint`; editor integrations must not maintain a second RMT rule world.

## System View

```text
App / Host
  |
  | local ESM + manifest policy
  v
XTend Loader
  |
  +-- XTend UI Components
  |     +-- x-router / x-link
  |     +-- x-header / x-menu / x-icon / x-hero / ...
  |     +-- form, feedback, overlay, media and layout components
  |
  +-- xstate / xtheme / api.js
  |
  +-- XTend-Fabric
        |
        +-- telemetry, fibers, lanes, reporter adapters
        |
        +-- optional RMT adapter results

XTendRMT
  |
  +-- .rmt source model
  +-- templates, routes, components, schedules, adapters
  +-- linter, language server, snippets, diagnostics
  |
  +-- host adapters: xtend.component, xtend.xrouter, docs.parsedown, custom hosts
```

## Runtime Decisions

### Loader and Manifest

The canonical loader is `xtend-loader.js`. It is local, ESM-based and manifest-driven. External CDNs are not the normal path. Manifest URLs and component imports are subject to the import policy.

### Components

Components follow Component Contract v2 and the Epic 11 UX shell line:

- TypeScript-first source when new components are created
- public types
- RMT metadata
- Fabric boundary
- a11y and performance profile
- component fixture
- component suite
- docs page

`x-icon` is the reference case for a framework-agnostic extension: internal Core icon pack, local Lucide extension, pack registry and RMT-compatible adapter without a CDN requirement.

### Routing

`x-router` remains the XTend UI routing component. RMT can declare routes and pass them to XRouter through the `xtend.xrouter` adapter. Page titles, route metadata and shell-near navigation may be described in RMT.

### Docs App

The Docs App is not only documentation, but a product example. It should show:

- shell-first rendering with RMT
- Parsedown as a scheduled content component
- stable navigation with `x-router`
- Quick Start, RMT Authoring, linter and LSP as the official developer journey
- no app-specific parallel logic when a missing capability belongs in XTend components

## Non-Goals

This decision explicitly does not mean:

- XTend becomes a React/Vue replacement with its own virtual DOM.
- RMT becomes bound to XTend.
- Fabric becomes the parser, router or scheduler kernel.
- `.rmt.json` is promoted as the preferred authoring format.
- Editor plugins may introduce their own RMT semantics.
- Components may treat a11y or performance as optional polish for later.

## Consequences

1. New architecture work must first be assigned to a layer: Loader, XTend UI, Fabric, RMT, Tooling or Docs.
2. When XTend-specific behavior is needed in RMT, an adapter contract is created, not a kernel special case.
3. When an app needs special logic, first check whether a generic Component, Fabric or RMT capability is missing.
4. New documentation must recommend native `.rmt` files. `.rmt.json` may only be described as a fallback.
5. Every new first-class component needs RMT, Fabric, a11y, performance, type and test coverage.
6. Release and reference gates remain part of the architecture contract.

## Binding Gates

The architecture baseline is protected by local gates:

```bash
node scripts/run_xtend_tests.js architecture
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js epic14-lsp-handoff --json
npm run test:release:full:report
```

For focused work, the specialized gates remain authoritative:

| Area | Gate |
|------|------|
| Core architecture | `node scripts/run_xtend_tests.js architecture` |
| Component Catalog | `npm run test:catalog-coverage` |
| RMT Tooling | `npm run test:rmt-tooling` |
| LSP Handoff | `npm run test:epic14-lsp-handoff` |
| Docs references | `node scripts/run_xtend_tests.js references --json` |

## Accepted Follow-up Decisions

This ADR integrates the results of the previous individual decisions:

- Loader and local development: `xtend.loader.local-development.adr.v1`
- XTend-Fabric: `xtend.fabric.adr.v1`
- Security Trust Boundaries: `xtend.security.trust-boundaries.adr.v1`
- XTendRMT First-Class Fusion: `development/ADR-XTendRMT-First-Class-Fusion.md`
- RMT Tooling and LSP Handoff: `xtend.epic14.lsp-handoff.v1`

The individual ADRs remain valid as detail sources. This document is the current Docs App baseline for the overall picture.

## Conclusion

XTend is no longer a loose component package, but a connected platform made of Web Components, loader, state, Fabric, RMT and authoring tooling.

The most important product path is no longer just broadening the surface, but consistently maturing this platform: native `.rmt` authoring experience, better editor support, stable component shells, a11y, performance, security and traceable release gates.

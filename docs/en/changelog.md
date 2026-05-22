# XTend Changelog

This article collects the historical Epic, workpackage, handoff, and gate
notes that previously lived in many individual developer articles. The normal
guides can therefore stay focused on product usage and developer experience;
this changelog is the canonical place for progress, release signals, and
technical history.

## RMT vNext and App Shell Authoring

- `RMT-VNEXT-PRIM-01` through `RMT-VNEXT-PRIM-04` built the grammar, parser,
  semantic graph, and lowering path for RMT vNext primitives.
- `RMT-VNEXT-PRIM-05` added Fabric lane and fiber evidence for vNext-authored
  lanes, route fibers, and component fibers.
- `RMT-VNEXT-PRIM-06` introduced the source-to-sea gate: vNext source, kernel
  records, Fabric telemetry, UI markers, and browser evidence are correlated by
  primitive IDs.
- `RMT-VNEXT-PRIM-07` completed the authoring DX: completions, hover, symbols,
  code actions, Safe Fix-All, and the VS Code bridge work from real RMT vNext
  sources.
- `RMT-VNEXT-PRIM-08` completed migration and legacy backgrounding:
  App-Platform Primitive JSON remains a mirror/compiler target while vNext is
  the authoring path.
- `WP-E15-18` bundled the vNext release handoff. The reference demo lives in
  `xtendrmt/rmt-vnext-reference-demo.rmt`, and the stable core output lives in
  `xtendrmt/rmt-vnext-reference-demo.core.json`.

## RMT Tooling, LSP, and Editor Integration

- `WP-E14-02` through `WP-E14-04` stabilized the source model,
  parser/format adapter, and semantic graph for native `.rmt` documents.
- `WP-E14-05` through `WP-E14-10` added the linter, CLI, completion, hover,
  document symbols, definition support, and safe code actions.
- `WP-E14-11` introduced AI-agent repair reports with `repairPlan`, `fixOrder`,
  `confidence`, `impact`, and no-op explanations.
- `WP-E14-12` prepared snippets, editor packaging, and the VS Code bridge.
- `WP-E14-14` consolidated the Quick Start, linter, and Language Server docs.
  The contract remains `xtend.rmt.tooling-docs.v1`; the local gate remains
  `node scripts/run_xtend_tests.js rmt-tooling-docs --json`.
- `WP-E14-15` and `WP-E14-16` completed the RMT Tooling release gates and the
  LSP handoff.

## XTendRMT Runtime, Kernel, and Fabric

- Epic 05 established XTendRMT as the productive scheduler, runtime, and
  templating path: native `.rmt` domains, Runtime Registry, XRouter Adapter,
  XTend Component Adapter, and State/Scheduler/Diagnostics Bridge.
- `ER-WP-08` through `ER-WP-21` built Fabric as the host core, including
  Component Lifecycle Error Boundary, Reporter Adapter, Diagnostics Bridge,
  component and route fibers, telemetry snapshots, performance measurements,
  regression checks, and hydration policies.
- `ER-WP-13` mapped Fabric lanes to host-neutral RMT schedule records. The RMT
  kernel boundary remains framework-neutral.
- `RKSH-WP-11` documented kernel migration, trusted output authoring, and the
  panic/recovery incident handoff.

## Component Platform and App Surfaces

- Epic 10 built TypeScript-first components, Component Contract v2,
  RMT-first apps, and platform gates.
- Epic 11 prepared Component UX, shell styling, accessibility, visual
  regression, enterprise UX handoff, and long-tail migration.
- SurfaceManager packages `WP-SM-01` through `WP-SM-19` built RMT authoring,
  controller, window runtime, side panel, workbench fixture, overlay bridge,
  native RMT surfaces, route lifecycles, persistence, layout engines,
  component lab, and runtime release handoff.
- Epic 18 moved App-Platform primitives, Media Manager lessons learned,
  vendor bugfix backports, and generic RMT App-Platform fixtures into the
  upstream state.

## Quality, Security, and Release

- Epic 12 bundled RC0 hardening, visual snapshot automation, design token
  productization, RMT DSL authoring polish, and adoption guides.
- Epic 13 consolidated RC1 readiness, release owner acceptance, conditional
  network evidence, package export lock, Trusted DOM, RMT production readiness,
  visual owner artifacts, and CI handoff.
- `DPF-WP-02` and `DPF-WP-03` productized the release report, pack dry-run
  evidence, and conditional network evidence CI.
- `WP-TypeExports-01` through `WP-TypeExports-09` secured package `types`
  conditions, RMT/Loader/API/Policy/Builder/Catalog/Vendor facades, and drift
  reports.

## What No Longer Belongs in Individual Articles?

Developer guides should not read like release logs. New or revised articles
should:

- explain productive usage, syntax, and architecture;
- mention local commands only where they are needed for the workflow;
- keep Epic, WP, status, and handoff history in this changelog;
- link to `development/` only when an internal detail truly needs to be traced.

## Related Release-Oriented Articles

- [RMT vNext Release Handoff](./rmt-vnext-release-handoff.md)
- [RMT vNext Source-to-Sea Gate](./rmt-vnext-source-to-sea-gate.md)
- [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- [RMT vNext Primitive Authoring Tooling](./rmt-vnext-primitive-authoring-tooling.md)
- [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- [RC1 Readiness](./rc1-readiness.md)
- [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md)
- [Release Report and Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md)
- [TypeExports](./type-exports.md)

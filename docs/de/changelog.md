# XTend Changelog

Dieser Artikel sammelt die historischen Epic-, Workpackage-, Handoff- und
Gate-Notizen, die frueher in vielen einzelnen Developer-Artikeln standen. Die
normalen Guides bleiben dadurch auf Produktnutzung und Developer Experience
fokussiert; dieser Changelog ist der kanonische Ort fuer Fortschritt,
Release-Signale und technische Historie.

## RMT vNext und App-Shell-Authoring

- `RMT-VNEXT-PRIM-01` bis `RMT-VNEXT-PRIM-04` haben Grammar, Parser, Semantic
  Graph und Lowering fuer RMT-vNext-Primitives aufgebaut.
- `RMT-VNEXT-PRIM-05` hat Fabric Lane/Fiber Evidence fuer vNext-authorierte
  Lanes, Route-Fibers und Component-Fibers nachgezogen.
- `RMT-VNEXT-PRIM-06` hat das Source-to-Sea-Gate aufgebaut: vNext Source,
  Kernel Records, Fabric Telemetry, UI-Marker und Browser-Evidence werden
  ueber Primitive IDs korreliert.
- `RMT-VNEXT-PRIM-07` hat die Authoring-DX abgeschlossen: Completions, Hover,
  Symbols, Code Actions, Safe Fix-All und VS-Code-Bridge arbeiten aus echten
  RMT-vNext-Quellen.
- `RMT-VNEXT-PRIM-08` hat Migration und Legacy-Backgrounding abgeschlossen:
  App-Platform-Primitive-JSON bleibt Mirror/Compiler-Target, waehrend vNext
  der Authoring-Pfad ist.
- `WP-E15-18` hat den vNext Release Handoff gebuendelt. Die Reference Demo
  liegt in `xtendrmt/rmt-vnext-reference-demo.rmt`, der stabile Core-Output in
  `xtendrmt/rmt-vnext-reference-demo.core.json`.

## RMT Tooling, LSP und Editor-Integration

- `WP-E14-02` bis `WP-E14-04` haben Source Model, Parser/Format Adapter und
  Semantic Graph fuer native `.rmt` Dokumente stabilisiert.
- `WP-E14-05` bis `WP-E14-10` haben Linter, CLI, Completion, Hover, Document
  Symbols, Definition und sichere Code Actions aufgebaut.
- `WP-E14-11` hat AI-Agent Repair Reports mit `repairPlan`, `fixOrder`,
  `confidence`, `impact` und No-Op-Erklaerungen eingefuehrt.
- `WP-E14-12` hat Snippets, Editor Packaging und die VS-Code-Bridge
  vorbereitet.
- `WP-E14-14` hat Quick Start, Linter- und Language-Server-Dokumentation
  konsolidiert. Der Contract bleibt `xtend.rmt.tooling-docs.v1`; der lokale
  Gate bleibt `node scripts/run_xtend_tests.js rmt-tooling-docs --json`.
- `WP-E14-15` und `WP-E14-16` haben RMT Tooling Release Gates und den LSP
  Handoff abgeschlossen.

## XTendRMT Runtime, Kernel und Fabric

- Epic 05 hat XTendRMT als produktiven Scheduler-, Runtime- und
  Templating-Pfad etabliert: native `.rmt` Domains, Runtime Registry, XRouter
  Adapter, XTend Component Adapter und State-/Scheduler-/Diagnostics Bridge.
- `ER-WP-08` bis `ER-WP-21` haben Fabric als Host-Kern, Component
  Lifecycle Error Boundary, Reporter Adapter, Diagnostics Bridge, Component
  und Route Fibers, Telemetry Snapshots, Performance Measurements, Regression
  und Hydration Policies aufgebaut.
- `ER-WP-13` hat Fabric-Lanes auf host-neutrale RMT Schedule Records
  abgebildet. Die RMT-Kernel-Grenze bleibt framework-neutral.
- `RKSH-WP-11` hat Kernel-Migration, Trusted Output Authoring sowie Panic- und
  Recovery-Incident-Handoff dokumentiert.

## Component Platform und App-Surfaces

- Epic 10 hat TypeScript-first Components, Component Contract v2,
  RMT-first Apps und Platform Gates aufgebaut.
- Epic 11 hat Component UX, Shell Styling, A11y, Visual Regression,
  Enterprise UX Handoff und Long-Tail-Migration vorbereitet.
- SurfaceManager-Pakete `WP-SM-01` bis `WP-SM-19` haben RMT Authoring,
  Controller, Window Runtime, SidePanel, Workbench Fixture, Overlay Bridge,
  Native RMT Surfaces, Route Lifecycles, Persistence, Layout Engines,
  Component Lab und Runtime Release Handoff aufgebaut.
- Epic 18 hat App-Platform-Primitives, Media-Manager-Lessons-Learned,
  Vendor-Bugfix-Backports und generische RMT App-Platform-Fixtures in den
  Upstream-Stand ueberfuehrt.

## Quality, Security und Release

- Epic 12 hat RC0-Hardening, Visual Snapshot Automation, Design Token
  Productization, RMT DSL Authoring Polish und Adoption Guides gebuendelt.
- Epic 13 hat RC1 Readiness, Release Owner Acceptance, Conditional Network
  Evidence, Package Export Lock, Trusted DOM, RMT Production Readiness,
  Visual Owner Artifacts und CI-Handoff konsolidiert.
- `DPF-WP-02` und `DPF-WP-03` haben Release Report, Pack Dry Run Evidence und
  Conditional Network Evidence CI produktisiert.
- `WP-TypeExports-01` bis `WP-TypeExports-09` haben Package `types`
  Conditions, RMT-/Loader-/API-/Policy-/Builder-/Catalog-/Vendor-Facades und
  Drift Reports abgesichert.

## Was gehoert nicht mehr in Einzelartikel?

Developer Guides sollen nicht mehr als Release-Protokoll gelesen werden. Neue
oder ueberarbeitete Artikel sollen:

- produktive Nutzung, Syntax und Architektur erklaeren;
- lokale Befehle nur dort nennen, wo sie fuer den Arbeitsfluss gebraucht
  werden;
- Epic-, WP-, Status- und Handoff-Historie hier im Changelog ablegen;
- auf `development/` nur verweisen, wenn ein internes Detail wirklich
  nachvollzogen werden muss.

## Relevante Release-nahe Artikel

- [RMT vNext Release Handoff](./rmt-vnext-release-handoff.md)
- [RMT vNext Source-to-Sea Gate](./rmt-vnext-source-to-sea-gate.md)
- [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- [RMT vNext Primitive Authoring Tooling](./rmt-vnext-primitive-authoring-tooling.md)
- [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- [RC1 Readiness](./rc1-readiness.md)
- [RC1 Gate Matrix und CI-Handoff](./rc1-gate-matrix-ci-handoff.md)
- [Release Report und Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md)
- [TypeExports](./type-exports.md)

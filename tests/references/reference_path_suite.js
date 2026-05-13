const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');

const REFERENCE_REGISTRY_PATH = 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md';
const UPSTREAM_HANDOFF_SCHEMA = 'xtend.rmt.upstream-handoff.v1';
const RMT_COMPATIBILITY_GATE = 'node scripts/run_xtend_tests.js rmt-compatibility --json';
const REFERENCES_GATE = 'node scripts/run_xtend_tests.js references --json';

const TEST_OBLIGATION_REFERENCE_CONTRACTS = [
  {
    path: 'development/XTend-Testpflicht-und-Scaffold-Anschluss.md',
    label: 'XTend test obligation',
    contracts: [
      { pattern: 'Mindestartefakte', message: 'defines minimum artifacts' },
      { pattern: '`component`', message: 'requires component artifact' },
      { pattern: '`docs`', message: 'requires docs artifact' },
      { pattern: '`tests`', message: 'requires tests artifact' },
      { pattern: '`fixtures`', message: 'requires fixture artifact' },
      { pattern: '`types`', message: 'requires type artifact' },
      { pattern: '`manifest`', message: 'requires manifest artifact' },
      { pattern: 'Review-Kriterien', message: 'defines review criteria' },
      { pattern: 'AI-Agenten', message: 'covers AI-agent review use' },
      { pattern: 'node scripts/run_xtend_tests.js --report', message: 'documents report command' }
    ]
  },
  {
    path: 'development/XTend-Component-Level-Teststandard.md',
    label: 'Component standard test obligation link',
    contracts: [
      { pattern: 'XTend-Testpflicht-und-Scaffold-Anschluss.md', message: 'links the WP-13 obligation document' },
      { pattern: 'Verbindliche Testpflicht ab WP-13', message: 'contains WP-13 obligation section' }
    ]
  },
  {
    path: 'development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md',
    label: 'Epic 03 scaffold obligation link',
    contracts: [
      { pattern: 'XTend-Testpflicht-und-Scaffold-Anschluss.md', message: 'links the WP-13 obligation document' },
      { pattern: 'Scaffold-Artefakte erfuellen die Epic-02-Testpflicht', message: 'requires scaffold artifacts to satisfy test obligation' }
    ]
  },
  {
    path: 'docs/best-practices.md',
    label: 'Best practices test obligation',
    contracts: [
      { pattern: 'Testpflicht fuer neue Komponenten', message: 'documents test obligation for components' },
      { pattern: 'XTend-Testpflicht-und-Scaffold-Anschluss.md', message: 'links the WP-13 obligation document' },
      { pattern: 'Keine Platzhaltertests', message: 'rejects placeholder tests' }
    ]
  },
  {
    path: 'tests/components/README.md',
    label: 'Component tests scaffold obligation',
    contracts: [
      { pattern: 'Test obligation and scaffold contract', message: 'documents scaffold obligation in component tests' },
      { pattern: 'XTend-Testpflicht-und-Scaffold-Anschluss.md', message: 'links the WP-13 obligation document' },
      { pattern: 'placeholder test files do not satisfy the contract', message: 'rejects placeholder tests' }
    ]
  },
  {
    path: 'tests/rmt/README.md',
    label: 'RMT compatibility tests',
    contracts: [
      { pattern: 'XTendRMT Compatibility Tests', message: 'documents RMT compatibility test heading' },
      { pattern: 'xtend.scaffold.rmt-compatibility-binding.v1', message: 'documents compatibility binding schema' },
      { pattern: 'xtend.rmt.template-pilot-flow.v1', message: 'documents template pilot flow schema' },
      { pattern: 'xtend.rmt.upstream-handoff.v1', message: 'documents upstream handoff schema' },
      { pattern: 'xtend.rmt.dsl-normalization.v1', message: 'documents DSL normalization schema' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'documents runtime registry schema' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'documents XRouter adapter schema' },
      { pattern: 'xtend.rmt.xtend-component-adapter.v1', message: 'documents XTend component adapter schema' },
      { pattern: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', message: 'documents State/Scheduler/Diagnostics bridge schema' },
      { pattern: 'xtend.rmt.wp15.native-bridge-fixture.v1', message: 'documents WP-15 native bridge fixture schema' },
      { pattern: 'xtend.rmt.wp16.browser-smoke-fixture.v1', message: 'documents WP-16 browser smoke fixture schema' },
      { pattern: 'xtend.docs.parsedown-rmt-pilot.v1', message: 'documents Docs-App Parsedown RMT pilot schema' },
      { pattern: 'xtend.rmt.first-class-app-authoring.v1', message: 'documents Epic 10 RMT-first app authoring schema' },
      { pattern: 'xtend.epic10.release-handoff.v1', message: 'documents Epic 10 release handoff schema' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility', message: 'documents runner command' },
      { pattern: 'npm run test:rmt-compatibility', message: 'documents package script' },
      { pattern: 'npm run test:docs-rmt-pilot', message: 'documents Docs RMT pilot package script' },
      { pattern: 'npm run test:epic10-release-handoff', message: 'documents Epic 10 Release Handoff package script' },
      { pattern: 'validates the productive XRouter adapter contract', message: 'documents productive XRouter adapter validation' },
      { pattern: 'fake `xstate`, scheduler and diagnostics targets', message: 'documents bridge fake host validation' }
    ]
  }
];

const EPIC_CLOSURE_REFERENCE_CONTRACTS = [
  {
    path: 'development/XTend-Produktreife-Checkpoint-nach-Epic-05.md',
    label: 'XTend product maturity checkpoint after Epic 05',
    contracts: [
      { pattern: 'xtend.product-maturity.checkpoint.epic05.v1', message: 'declares product maturity checkpoint contract' },
      { pattern: '6.8 / 10 Enterprise-Reife', message: 'documents maturity score' },
      { pattern: 'produktreifer Framework-Kern mit Beta-/Pre-Enterprise-Reife', message: 'states current maturity classification' },
      { pattern: 'Component Catalog Breitenhaertung', message: 'identifies component catalog gap' },
      { pattern: 'Distribution, Versionierung und Release Engineering', message: 'identifies release engineering gap' },
      { pattern: 'Aktive CI/CD und Release Gates', message: 'identifies CI/CD gap' },
      { pattern: 'Security und Trust Boundary', message: 'identifies security gap' },
      { pattern: 'Observability, Diagnostics und Runtime Betrieb', message: 'identifies observability gap' },
      { pattern: 'XTendRMT Upstream-Produktisierung', message: 'identifies XTendRMT upstream gap' },
      { pattern: 'EPIC 06 - Enterprise Hardening und Release Readiness', message: 'proposes enterprise hardening follow-up' },
      { pattern: 'EPIC 07 - Component Catalog Completion', message: 'proposes component completion follow-up' },
      { pattern: 'EPIC 10 - XTendRMT Upstream und Multi-Host Ausbau', message: 'proposes XTendRMT follow-up' }
    ]
  },
  {
    path: 'development/XTend-Enterprise-Reife-Implementierungsplan.md',
    label: 'XTend enterprise readiness implementation plan',
    contracts: [
      { pattern: 'xtend.enterprise-readiness.implementation-plan.v1', message: 'declares enterprise readiness implementation plan contract' },
      { pattern: 'xtend-loader.js', message: 'requires the canonical loader rename target' },
      { pattern: 'CDN ist kein Default- oder Testpfad mehr', message: 'removes CDN from default and test paths' },
      { pattern: 'lokaler Server', message: 'requires local server based development and testing' },
      { pattern: '@xtend-fabric', message: 'defines the XTend-Fabric API surface' },
      { pattern: 'XTend-Fabric', message: 'defines the global safety and telemetry layer' },
      { pattern: 'Fiber', message: 'defines UI work fibers' },
      { pattern: 'Lane', message: 'defines UI scheduler lanes' },
      { pattern: 'user-blocking', message: 'defines required scheduler lane' },
      { pattern: 'Performance-by-design', message: 'makes performance a design obligation' },
      { pattern: 'A11y-by-design', message: 'makes accessibility a design obligation' },
      { pattern: 'Screenreader', message: 'covers screenreader readiness' },
      { pattern: 'Security Trust Boundary ist entschieden', message: 'confirms security boundary in Phase 0 exit criteria' },
      { pattern: 'Aktueller Workpackage-Stand nach ER-WP-40', message: 'documents current workpackage checkpoint' },
      { pattern: '| `completed` | `ER-WP-01`, `ER-WP-02`, `ER-WP-03`, `ER-WP-04`, `ER-WP-05`, `ER-WP-06`, `ER-WP-07`, `ER-WP-08`, `ER-WP-09`, `ER-WP-10`, `ER-WP-11`, `ER-WP-12`, `ER-WP-13`, `ER-WP-14`, `ER-WP-15`, `ER-WP-16`, `ER-WP-17`, `ER-WP-18`, `ER-WP-19`, `ER-WP-20`, `ER-WP-21`, `ER-WP-22`, `ER-WP-23`, `ER-WP-24`, `ER-WP-25`, `ER-WP-26`, `ER-WP-27`, `ER-WP-28`, `ER-WP-29`, `ER-WP-30`, `ER-WP-31`, `ER-WP-32`, `ER-WP-33`, `ER-WP-34`, `ER-WP-35`, `ER-WP-36`, `ER-WP-37`, `ER-WP-38`, `ER-WP-39`, `ER-WP-40` |', message: 'lists completed enterprise workpackages' },
      { pattern: '| `ready` | - |', message: 'shows no separate ready queue after ER-WP-32' },
      { pattern: '| `next` | - |', message: 'shows no next enterprise workpackage after ER-WP-40' },
      { pattern: 'xtend.ci.default-gates.v1', message: 'documents CI default gates contract' },
      { pattern: 'xtend.ci.gate-matrix.v1', message: 'documents CI gate matrix contract' },
      { pattern: 'xtend.release.checklist-semver-policy.v1', message: 'documents release checklist and SemVer policy contract' },
      { pattern: 'xtend.docs.enterprise-adoption.v1', message: 'documents enterprise adoption guide contract' },
      { pattern: 'xtend.docs.parsedown-rmt-pilot.v1', message: 'documents Docs-App Parsedown RMT pilot contract' },
      { pattern: 'xtend.catalog.component-coverage-matrix.v1', message: 'documents catalog coverage matrix gate' },
      { pattern: 'xtend.catalog.naming-convention.v1', message: 'documents catalog naming convention' },
      { pattern: 'ER-WP-01', message: 'defines the first implementation workpackage' },
      { pattern: 'ER-WP-40', message: 'defines the final implementation workpackage' },
      { pattern: 'EPIC 06 - Enterprise Runtime, Loader und Local Development', message: 'proposes the runtime and loader follow-up Epic' },
      { pattern: 'EPIC 07 - XTend-Fabric, Telemetry und UI Scheduler Lanes', message: 'proposes the Fabric and telemetry follow-up Epic' },
      { pattern: 'EPIC 08 - Performance und A11y by Design', message: 'proposes the performance and accessibility follow-up Epic' }
    ]
  },
  {
    path: 'development/ROADMAP-XTend-Enterprise-Reife.md',
    label: 'XTend enterprise readiness roadmap',
    contracts: [
      { pattern: 'xtend.enterprise-readiness.roadmap.v1', message: 'declares enterprise readiness roadmap contract' },
      { pattern: 'EPIC 06', message: 'maps runtime and loader work to Epic 06' },
      { pattern: 'EPIC 07', message: 'maps Fabric and telemetry work to Epic 07' },
      { pattern: 'EPIC 08', message: 'maps performance and A11y work to Epic 08' },
      { pattern: 'EPIC 09', message: 'maps catalog, security and release work to Epic 09' },
      { pattern: 'ER-WP-01', message: 'defines roadmap workpackage ER-WP-01' },
      { pattern: 'ER-WP-40', message: 'defines roadmap workpackage ER-WP-40' },
      { pattern: 'Loader-Contract und Rename-ADR fuer `xtend-loader.js`', message: 'prioritizes loader rename ADR' },
      { pattern: 'XTend-Fabric ADR und API Surface', message: 'prioritizes Fabric ADR' },
      { pattern: 'Fiber- und Lane-Contract', message: 'prioritizes Fiber and Lane contract' },
      { pattern: 'Performance Budget Matrix', message: 'prioritizes performance budgets' },
      { pattern: 'A11y Component Contract 1.0', message: 'prioritizes accessibility contract' },
      { pattern: 'Security ADR fuer Loader, Manifest, Templates und Events', message: 'prioritizes security ADR' },
      { pattern: 'Naechste startbare Workpackages', message: 'documents immediately startable packages' },
      { pattern: '| `ER-WP-01` | P0 | completed | Phase 0 | EPIC 06 | Loader-Contract und Rename-ADR fuer `xtend-loader.js` erstellen |', message: 'marks ER-WP-01 completed' },
      { pattern: '| `ER-WP-02` | P0 | completed | Phase 1 | EPIC 06 | `xtend-loader.js` als kanonischen ESM-Loader einfuehren |', message: 'marks ER-WP-02 completed' },
      { pattern: '| `ER-WP-03` | P0 | completed | Phase 1 | EPIC 06 | CDN-Fallbacks aus Core-Pfaden entfernen |', message: 'marks ER-WP-03 completed' },
      { pattern: '| `ER-WP-04` | P0 | completed | Phase 1 | EPIC 06 | lokalen Dev-/Test-Server produktisieren |', message: 'marks ER-WP-04 completed' },
      { pattern: '| `ER-WP-05` | P1 | completed | Phase 1 | EPIC 06 | Demo- und Fixture-Pfade auf neuen Loader migrieren |', message: 'marks ER-WP-05 completed' },
      { pattern: '| `ER-WP-06` | P1 | completed | Phase 1 | EPIC 06 | Package-Export- und Release-Strategie festlegen |', message: 'marks ER-WP-06 completed' },
      { pattern: '| `ER-WP-07` | P0 | completed | Phase 0 | EPIC 07 | XTend-Fabric ADR und API Surface definieren |', message: 'marks ER-WP-07 completed' },
      { pattern: '| `ER-WP-08` | P0 | completed | Phase 2 | EPIC 07 | Fabric Runtime Skeleton implementieren |', message: 'marks ER-WP-08 completed' },
      { pattern: '| `ER-WP-09` | P0 | completed | Phase 2 | EPIC 07 | Component Lifecycle Error Boundary einfuehren |', message: 'marks ER-WP-09 completed' },
      { pattern: '| `ER-WP-10` | P1 | completed | Phase 2 | EPIC 07 | Reporter Adapter Contract vorbereiten |', message: 'marks ER-WP-10 completed' },
      { pattern: '| `ER-WP-11` | P1 | completed | Phase 2 | EPIC 07 | Fabric an `xstate`, API und XTendRMT Diagnostics anbinden |', message: 'marks ER-WP-11 completed' },
      { pattern: '| `ER-WP-12` | P0 | completed | Phase 0 | EPIC 07 | Fiber- und Lane-Contract spezifizieren |', message: 'marks ER-WP-12 completed' },
      { pattern: '| `ER-WP-13` | P0 | completed | Phase 2 | EPIC 07 | Lane Mapping auf RMT Schedules definieren |', message: 'marks ER-WP-13 completed' },
      { pattern: '| `ER-WP-14` | P1 | completed | Phase 2 | EPIC 07 | Component Mount/Hydration als Fibers instrumentieren |', message: 'marks ER-WP-14 completed' },
      { pattern: '| `ER-WP-15` | P1 | completed | Phase 2 | EPIC 07 | Route Render und XRouter Navigation als Fibers instrumentieren |', message: 'marks ER-WP-15 completed' },
      { pattern: '| `ER-WP-16` | P1 | completed | Phase 2 | EPIC 07 | Telemetry Snapshots und Backpressure Signale integrieren |', message: 'marks ER-WP-16 completed' },
      { pattern: '| `ER-WP-17` | P0 | completed | Phase 0 | EPIC 08 | Performance Budget Matrix fuer Component-Profile erstellen |', message: 'marks ER-WP-17 completed' },
      { pattern: '| `ER-WP-18` | P0 | completed | Phase 3 | EPIC 08 | Loader- und Hydration-Messpunkte einfuehren |', message: 'marks ER-WP-18 completed' },
      { pattern: '| `ER-WP-19` | P1 | completed | Phase 3 | EPIC 08 | Performance Regression Suite anlegen |', message: 'marks ER-WP-19 completed' },
      { pattern: '| `ER-WP-20` | P1 | completed | Phase 3 | EPIC 08 | Lazy/Idle/Visible Hydration Policies haerten |', message: 'marks ER-WP-20 completed' },
      { pattern: '| `ER-WP-21` | P1 | completed | Phase 3 | EPIC 08 | Performance-Doku fuer Komponentenautoren schreiben |', message: 'marks ER-WP-21 completed' },
      { pattern: '| `ER-WP-22` | P0 | completed | Phase 0 | EPIC 08 | A11y Component Contract 1.0 definieren |', message: 'marks ER-WP-22 completed' },
      { pattern: '| `ER-WP-23` | P0 | completed | Phase 3 | EPIC 08 | Scaffold-Blueprints um A11y-Pflichten erweitern |', message: 'marks ER-WP-23 completed' },
      { pattern: '| `ER-WP-24` | P1 | completed | Phase 3 | EPIC 08 | Browsernahe Fokus- und Keyboard-Smokes ausbauen |', message: 'marks ER-WP-24 completed' },
      { pattern: '| `ER-WP-25` | P1 | completed | Phase 3 | EPIC 08 | Screenreader-Signal-Contracts einfuehren |', message: 'marks ER-WP-25 completed' },
      { pattern: '| `ER-WP-26` | P1 | completed | Phase 3 | EPIC 08 | Reduced-Motion und High-Contrast Regeln gatebar machen |', message: 'marks ER-WP-26 completed' },
      { pattern: '| `ER-WP-31` | P0 | completed | Phase 4 | EPIC 09 | Component Catalog Coverage Matrix erzeugen |', message: 'marks ER-WP-31 completed' },
      { pattern: '| `ER-WP-32` | P0 | completed | Phase 4 | EPIC 09 | Naming- und Doku-Luecken im Component Catalog schliessen |', message: 'marks ER-WP-32 completed' },
      { pattern: '| `ER-WP-33` | P1 | completed | Phase 4 | EPIC 09 | Component-Level-Suites fuer priorisierte Komponenten nachziehen |', message: 'marks ER-WP-33 completed' },
      { pattern: '| `ER-WP-34` | P1 | completed | Phase 4 | EPIC 09 | Types und Public Event Contracts vervollstaendigen |', message: 'marks ER-WP-34 completed' },
      { pattern: '| `ER-WP-35` | P2 | completed | Phase 4 | EPIC 09 | visuelle und browsernahe Regression priorisieren |', message: 'marks ER-WP-35 completed' },
      { pattern: '| `ER-WP-36` | P0 | completed | Phase 4 | EPIC 09 | CI Workflow fuer Default Gates anlegen |', message: 'marks ER-WP-36 completed' },
      { pattern: '| `ER-WP-37` | P1 | completed | Phase 4 | EPIC 09 | schnelle PR-Gates und volle Release-Gates trennen |', message: 'marks ER-WP-37 completed' },
      { pattern: '| `ER-WP-38` | P1 | completed | Phase 4 | EPIC 09 | Release Checklist und SemVer Policy schreiben |', message: 'marks ER-WP-38 completed' },
      { pattern: '| `ER-WP-39` | P1 | completed | Phase 4 | EPIC 09 | Enterprise Adoption Guide schreiben |', message: 'marks ER-WP-39 completed' },
      { pattern: '| `ER-WP-40` | P2 | completed | Phase 4 | EPIC 09 | Docs-App mit RMT Parsedown Scheduling pilotieren |', message: 'marks ER-WP-40 completed' },
      { pattern: '| `ER-WP-27` | P0 | completed | Phase 0 | EPIC 09 | Security ADR fuer Loader, Manifest, Templates und Events schreiben |', message: 'marks ER-WP-27 completed' },
      { pattern: '| `ER-WP-28` | P1 | completed | Phase 4 | EPIC 09 | Manifest- und Dynamic-Import-Policy haerten |', message: 'marks ER-WP-28 completed' },
      { pattern: '| `ER-WP-29` | P1 | completed | Phase 4 | EPIC 09 | Sanitizing-/Trusted-DOM-Policy fuer RMT und Docs vorbereiten |', message: 'marks ER-WP-29 completed' },
      { pattern: '| `ER-WP-30` | P1 | completed | Phase 4 | EPIC 09 | Dependency-, License- und Vulnerability-Gates planen |', message: 'marks ER-WP-30 completed' },
      { pattern: 'ADR-XTend-Loader-und-Lokale-Entwicklung.md', message: 'links the loader ADR' },
      { pattern: 'ER-WP-01-Loader-Contract-und-Rename-ADR-fuer-xtend-loader-js.md', message: 'links the ER-WP-01 workpackage document' },
      { pattern: 'ER-WP-02-xtend-loader-js-als-kanonischen-ESM-Loader-einfuehren.md', message: 'links the ER-WP-02 workpackage document' },
      { pattern: 'ER-WP-03-CDN-Fallbacks-aus-Core-Pfaden-entfernen.md', message: 'links the ER-WP-03 workpackage document' },
      { pattern: 'ER-WP-05-Demo-und-Fixture-Pfade-auf-neuen-Loader-migrieren.md', message: 'links the ER-WP-05 workpackage document' },
      { pattern: 'XTend-Package-Export-und-Release-Strategie.md', message: 'links the package export strategy' },
      { pattern: 'ER-WP-06-Package-Export-und-Release-Strategie-festlegen.md', message: 'links the ER-WP-06 workpackage document' },
      { pattern: 'ADR-XTend-Fabric.md', message: 'links the Fabric ADR' },
      { pattern: 'ER-WP-07-XTend-Fabric-ADR-und-API-Surface-definieren.md', message: 'links the ER-WP-07 workpackage document' },
      { pattern: 'ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md', message: 'links the ER-WP-08 workpackage document' },
      { pattern: 'XTend-Component-Lifecycle-Error-Boundary.md', message: 'links the lifecycle boundary contract' },
      { pattern: 'ER-WP-09-Component-Lifecycle-Error-Boundary-einfuehren.md', message: 'links the ER-WP-09 workpackage document' },
      { pattern: 'XTend-Fabric-Reporter-Adapter-Contract.md', message: 'links the reporter adapter contract' },
      { pattern: 'ER-WP-10-Reporter-Adapter-Contract-vorbereiten.md', message: 'links the ER-WP-10 workpackage document' },
      { pattern: 'XTend-Fabric-Runtime-Diagnostics-Bridge.md', message: 'links the runtime diagnostics bridge contract' },
      { pattern: 'ER-WP-11-Fabric-an-xstate-API-und-XTendRMT-Diagnostics-anbinden.md', message: 'links the ER-WP-11 workpackage document' },
      { pattern: 'XTend-Telemetry-Snapshot-und-Backpressure-Contract.md', message: 'links the telemetry snapshot contract' },
      { pattern: 'ER-WP-16-Telemetry-Snapshots-und-Backpressure-Signale-integrieren.md', message: 'links the ER-WP-16 workpackage document' },
      { pattern: 'XTend-Fiber-und-Lane-Contract.md', message: 'links the Fiber/Lane contract' },
      { pattern: 'ER-WP-12-Fiber-und-Lane-Contract-spezifizieren.md', message: 'links the ER-WP-12 workpackage document' },
      { pattern: 'XTend-Fabric-RMT-Lane-Mapping.md', message: 'links the Fabric RMT Lane Mapping contract' },
      { pattern: 'ER-WP-13-Lane-Mapping-auf-RMT-Schedules-definieren.md', message: 'links the ER-WP-13 workpackage document' },
      { pattern: 'XTend-Component-Fiber-Instrumentierung.md', message: 'links the component fiber instrumentation contract' },
      { pattern: 'ER-WP-14-Component-Mount-Hydration-als-Fibers-instrumentieren.md', message: 'links the ER-WP-14 workpackage document' },
      { pattern: 'XTend-Route-Fiber-Instrumentierung.md', message: 'links the route fiber instrumentation contract' },
      { pattern: 'ER-WP-15-Route-Render-und-XRouter-Navigation-als-Fibers-instrumentieren.md', message: 'links the ER-WP-15 workpackage document' },
      { pattern: 'XTend-Performance-Budget-Matrix.md', message: 'links the Performance Budget Matrix' },
      { pattern: 'ER-WP-17-Performance-Budget-Matrix-fuer-Component-Profile-erstellen.md', message: 'links the ER-WP-17 workpackage document' },
      { pattern: 'XTend-Performance-Messpunkte-und-Snapshots.md', message: 'links the Performance Measurements contract' },
      { pattern: 'ER-WP-18-Loader-und-Hydration-Messpunkte-einfuehren.md', message: 'links the ER-WP-18 workpackage document' },
      { pattern: 'tests/fabric/fabric_performance_measurement_suite.js', message: 'links the performance measurement suite' },
      { pattern: 'docs/performance-measurements.md', message: 'links the performance measurement docs' },
      { pattern: 'XTend-Performance-Regression-Gate.md', message: 'links the Performance Regression Gate contract' },
      { pattern: 'ER-WP-19-Performance-Regression-Suite-anlegen.md', message: 'links the ER-WP-19 workpackage document' },
      { pattern: 'tests/performance/performance_regression_suite.js', message: 'links the performance regression suite' },
      { pattern: 'tests/performance/baselines/local-performance-baseline.json', message: 'links the performance regression baseline' },
      { pattern: 'docs/performance-regression.md', message: 'links the performance regression docs' },
      { pattern: 'XTend-Hydration-Policy-Contract.md', message: 'links the Hydration Policy contract' },
      { pattern: 'ER-WP-20-Lazy-Idle-Visible-Hydration-Policies-haerten.md', message: 'links the ER-WP-20 workpackage document' },
      { pattern: 'ER-WP-21-Performance-Doku-fuer-Komponentenautoren-schreiben.md', message: 'links the ER-WP-21 workpackage document' },
      { pattern: 'docs/performance.md', message: 'links the Performance author docs' },
      { pattern: 'fabric/hydration-policy.js', message: 'links the hydration policy runtime module' },
      { pattern: 'tests/performance/hydration_policy_suite.js', message: 'links the hydration policy suite' },
      { pattern: 'docs/hydration-policies.md', message: 'links the hydration policy docs' },
      { pattern: 'XTend-A11y-Component-Contract.md', message: 'links the A11y Component Contract' },
      { pattern: 'ER-WP-22-A11y-Component-Contract-1-0-definieren.md', message: 'links the ER-WP-22 workpackage document' },
      { pattern: 'XTend-Scaffold-A11y-Profile-Plan.md', message: 'links the Scaffold A11y Profile Plan' },
      { pattern: 'ER-WP-23-Scaffold-Blueprints-um-A11y-Pflichten-erweitern.md', message: 'links the ER-WP-23 workpackage document' },
      { pattern: 'XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md', message: 'links the browser-near A11y keyboard smoke plan' },
      { pattern: 'ER-WP-24-Browsernahe-Fokus-und-Keyboard-Smokes-ausbauen.md', message: 'links the ER-WP-24 workpackage document' },
      { pattern: 'docs/a11y-keyboard-smokes.md', message: 'links the A11y keyboard smoke docs' },
      { pattern: 'XTend-Screenreader-Signal-Contract.md', message: 'links the Screenreader Signal Contract' },
      { pattern: 'ER-WP-25-Screenreader-Signal-Contracts-einfuehren.md', message: 'links the ER-WP-25 workpackage document' },
      { pattern: 'a11y/screenreader-signals.js', message: 'links the Screenreader Signal module' },
      { pattern: 'tests/a11y/screenreader_signal_suite.js', message: 'links the Screenreader Signal suite' },
      { pattern: 'docs/screenreader-signals.md', message: 'links the Screenreader Signal docs' },
      { pattern: 'XTend-Motion-und-Contrast-Policy.md', message: 'links the Motion and Contrast Policy contract' },
      { pattern: 'ER-WP-26-Reduced-Motion-und-High-Contrast-Regeln-gatebar-machen.md', message: 'links the ER-WP-26 workpackage document' },
      { pattern: 'a11y/motion-contrast-policy.js', message: 'links the Motion and Contrast Policy module' },
      { pattern: 'tests/a11y/motion_contrast_suite.js', message: 'links the Motion and Contrast suite' },
      { pattern: 'docs/motion-contrast.md', message: 'links the Motion and Contrast docs' },
      { pattern: 'ADR-XTend-Security-Trust-Boundaries.md', message: 'links the Security Trust Boundary ADR' },
      { pattern: 'ER-WP-27-Security-ADR-fuer-Loader-Manifest-Templates-und-Events-schreiben.md', message: 'links the ER-WP-27 workpackage document' },
      { pattern: 'XTend-Trusted-DOM-und-Sanitizing-Policy.md', message: 'links the Trusted DOM policy' },
      { pattern: 'ER-WP-29-Sanitizing-und-Trusted-DOM-Policy-fuer-RMT-und-Docs-vorbereiten.md', message: 'links the ER-WP-29 workpackage document' },
      { pattern: 'XTend-Supply-Chain-Gate-Plan.md', message: 'links the supply-chain gate plan' },
      { pattern: 'ER-WP-30-Dependency-License-und-Vulnerability-Gates-planen.md', message: 'links the ER-WP-30 workpackage document' },
      { pattern: 'security/supply-chain-gate-policy.js', message: 'links the supply-chain policy module' },
      { pattern: 'scripts/verify_supply_chain_policy.js', message: 'links the supply-chain verify script' },
      { pattern: 'tests/security/supply_chain_policy_suite.js', message: 'links the supply-chain suite' },
      { pattern: 'docs/supply-chain-gates.md', message: 'links supply-chain developer docs' },
      { pattern: 'XTend-Component-Catalog-Coverage-Matrix.md', message: 'links Component Catalog Coverage Matrix' },
      { pattern: 'ER-WP-31-Component-Catalog-Coverage-Matrix-erzeugen.md', message: 'links the ER-WP-31 workpackage document' },
      { pattern: 'XTend-Component-Catalog-Naming-Konvention.md', message: 'links Component Catalog Naming convention' },
      { pattern: 'ER-WP-32-Naming-und-Doku-Luecken-im-Component-Catalog-schliessen.md', message: 'links the ER-WP-32 workpackage document' },
      { pattern: 'catalog/component-catalog-coverage.js', message: 'links the component catalog coverage module' },
      { pattern: 'tests/catalog/component_catalog_coverage_suite.js', message: 'links the component catalog coverage suite' },
      { pattern: 'docs/component-catalog-coverage.md', message: 'links component catalog coverage docs' },
      { pattern: 'catalog/component-regression-priority.js', message: 'links the regression priority module' },
      { pattern: 'tests/catalog/component_regression_priority_suite.js', message: 'links the regression priority suite' },
      { pattern: 'XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md', message: 'links the visual/browser regression plan' },
      { pattern: 'ER-WP-35-Visuelle-und-browsernahe-Regression-priorisieren.md', message: 'links the ER-WP-35 workpackage document' },
      { pattern: 'docs/visual-browser-regression.md', message: 'links visual/browser regression docs' },
      { pattern: 'XTend-CI-Default-Gates-Workflow.md', message: 'links the CI Default Gates workflow contract' },
      { pattern: 'ER-WP-36-CI-Workflow-fuer-Default-Gates-anlegen.md', message: 'links the ER-WP-36 workpackage document' },
      { pattern: 'XTend-CI-Gate-Matrix.md', message: 'links the CI Gate Matrix contract' },
      { pattern: 'ER-WP-37-Schnelle-PR-Gates-und-volle-Release-Gates-trennen.md', message: 'links the ER-WP-37 workpackage document' },
      { pattern: 'XTend-Release-Checklist-und-SemVer-Policy.md', message: 'links the release checklist and SemVer policy' },
      { pattern: 'ER-WP-38-Release-Checklist-und-SemVer-Policy-schreiben.md', message: 'links the ER-WP-38 workpackage document' },
      { pattern: 'docs/enterprise-adoption.md', message: 'links the Enterprise Adoption guide' },
      { pattern: 'ER-WP-39-Enterprise-Adoption-Guide-schreiben.md', message: 'links the ER-WP-39 workpackage document' },
      { pattern: 'xtend.docs.enterprise-adoption.v1', message: 'documents Enterprise Adoption guide contract' },
      { pattern: 'xtend.enterpriseAdoption', message: 'documents Enterprise Adoption package metadata' },
      { pattern: '.github/workflows/xtend-default-gates.yml', message: 'links the active GitHub Actions default gate workflow' },
      { pattern: 'XTend-Test-Reporting-und-CI-Vorbereitung.md', message: 'links the test reporting and CI docs' },
      { pattern: 'docs/components/xsummary.md', message: 'links x-summary docs' },
      { pattern: 'docs/components/xutils.md', message: 'links x-utils docs' },
      { pattern: 'security/trusted-dom-policy.js', message: 'links the Trusted DOM machine-readable module' },
      { pattern: 'docs/trusted-dom-sanitizing.md', message: 'links the Trusted DOM developer docs' },
      { pattern: 'Phase 0', message: 'documents phase roadmap' },
      { pattern: 'node scripts/run_xtend_tests.js browser --json', message: 'documents browser validation gate' }
    ]
  },
  {
    path: 'development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md',
    label: 'Epic 12 long-tail RC hardening backlog',
    contracts: [
      { pattern: 'xtend.epic12.backlog.v1', message: 'declares Epic 12 backlog contract' },
      { pattern: '- Status: Completed', message: 'marks Epic 12 completed after WP-E12-16' },
      { pattern: 'XTend-Epic12-RC-Hardening-Modell.md', message: 'links Epic 12 RC hardening model' },
      { pattern: 'WP-E12-01-Epic-12-Backlog-und-RC-Hardening-Modell-anlegen.md', message: 'links WP-E12-01 acceptance document' },
      { pattern: 'WP-E12-02-x-tabs-Performance-Profile-und-Runtime-Budget-finalisieren.md', message: 'links WP-E12-02 acceptance document' },
      { pattern: 'WP-E12-03-x-tabs-Browser-Keyboard-A11y-und-Theme-Smokes-haerten.md', message: 'links WP-E12-03 acceptance document' },
      { pattern: 'WP-E12-04-x-theme-A11y-High-Contrast-und-Reduced-Motion-haerten.md', message: 'links WP-E12-04 acceptance document' },
      { pattern: 'WP-E12-05-x-theme-Performance-Theme-Propagation-und-Density-Boundary-finalisieren.md', message: 'links WP-E12-05 acceptance document' },
      { pattern: 'WP-E12-06-x-button-Performance-und-Interaction-Budget-nachziehen.md', message: 'links WP-E12-06 acceptance document' },
      { pattern: 'WP-E12-07-x-menu-Performance-Keyboard-und-Router-Kompatibilitaet-haerten.md', message: 'links WP-E12-07 acceptance document' },
      { pattern: 'WP-E12-08-xstate-Adapter-Typing-und-Lifecycle-Boundary-Probe-bauen.md', message: 'links WP-E12-08 acceptance document' },
      { pattern: 'WP-E12-09-xutils-Utility-Import-Policy-und-Fixture-Probe-bauen.md', message: 'links WP-E12-09 acceptance document' },
      { pattern: 'XTend-Visual-Snapshot-Automation-Contract.md', message: 'links WP-E12-10 Snapshot contract document' },
      { pattern: 'WP-E12-10-Visual-Snapshot-Automation-Contract-definieren.md', message: 'links WP-E12-10 acceptance document' },
      { pattern: 'WP-E12-11-Snapshot-Fixture-und-lokalen-Diff-Runner-vorbereiten.md', message: 'links WP-E12-11 acceptance document' },
      { pattern: 'XTend-Enterprise-Design-System-Token-Contract.md', message: 'links WP-E12-12 Design Token contract document' },
      { pattern: 'WP-E12-12-Enterprise-Design-System-Token-Productization-vorbereiten.md', message: 'links WP-E12-12 acceptance document' },
      { pattern: 'XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md', message: 'links WP-E12-13 RMT DSL Authoring Polish contract document' },
      { pattern: 'WP-E12-13-RMT-DSL-Authoring-Polish-fuer-Component-Shells-vorbereiten.md', message: 'links WP-E12-13 acceptance document' },
      { pattern: 'XTend-RC0-Gate-Matrix.md', message: 'links WP-E12-14 RC0 Gate Matrix contract document' },
      { pattern: 'WP-E12-14-Release-Candidate-Gate-Matrix-fuer-RC0-schneiden.md', message: 'links WP-E12-14 acceptance document' },
      { pattern: 'XTend-Epic12-Docs-Migration-und-Adoption-Guide.md', message: 'links WP-E12-15 docs adoption contract document' },
      { pattern: 'WP-E12-15-Docs-Migration-Notes-und-Enterprise-Adoption-Guide-aktualisieren.md', message: 'links WP-E12-15 acceptance document' },
      { pattern: 'docs/rc0-adoption-guide.md', message: 'links RC0 Adoption Guide docs' },
      { pattern: 'XTend-Epic12-Abschluss-und-RC0-Handoff.md', message: 'links WP-E12-16 RC0 handoff contract document' },
      { pattern: 'WP-E12-16-Epic-12-Abschlussreview-und-RC0-Handoff.md', message: 'links WP-E12-16 acceptance document' },
      { pattern: 'docs/epic12-rc0-handoff.md', message: 'links Epic 12 RC0 Handoff docs' },
      { pattern: '| `WP-E12-01` | P0 | completed | WS0 | Epic-12-Backlog und RC-Hardening-Modell anlegen | `WP-E11-18` |', message: 'marks WP-E12-01 completed in overview' },
      { pattern: '| `WP-E12-02` | P0 | completed | WS1 | `x-tabs` Performance Profile und Runtime-Budget finalisieren | `WP-E12-01` |', message: 'marks WP-E12-02 completed in overview' },
      { pattern: '| `WP-E12-03` | P0 | completed | WS1 | `x-tabs` Browser-, Keyboard-, A11y- und Theme-Matrix-Smokes haerten | `WP-E12-02` |', message: 'marks WP-E12-03 completed in overview' },
      { pattern: '| `WP-E12-04` | P0 | completed | WS2 | `x-theme` A11y-, High-Contrast- und Reduced-Motion-Verhalten haerten | `WP-E12-01` |', message: 'marks WP-E12-04 completed in overview' },
      { pattern: '| `WP-E12-05` | P0 | completed | WS2 | `x-theme` Performance Profile, Theme Propagation und Density Boundary finalisieren | `WP-E12-04` |', message: 'marks WP-E12-05 completed in overview' },
      { pattern: '| `WP-E12-06` | P1 | completed | WS3 | `x-button` Performance Profile und Interaction Budget nachziehen | `WP-E12-02` |', message: 'marks WP-E12-06 completed in overview' },
      { pattern: '| `WP-E12-07` | P1 | completed | WS3 | `x-menu` Performance Profile, Keyboard Navigation und Router-Kompatibilitaet haerten | `WP-E12-03` |', message: 'marks WP-E12-07 completed in overview' },
      { pattern: '| `WP-E12-08` | P1 | completed | WS4 | `xstate` Adapter-, Typing- und Lifecycle-Boundary-Probe bauen | `WP-E12-01` |', message: 'marks WP-E12-08 completed in overview' },
      { pattern: '| `WP-E12-09` | P1 | completed | WS4 | `x-utils` Utility-, Import-Policy- und Fixture-Probe bauen | `WP-E12-08` |', message: 'marks WP-E12-09 completed in overview' },
      { pattern: '| `WP-E12-10` | P1 | completed | WS5 | Visual Snapshot Automation Contract definieren |', message: 'marks WP-E12-10 completed in overview' },
      { pattern: '| `WP-E12-11` | P1 | completed | WS5 | Snapshot Fixture und lokaler Pixel-/DOM-Diff-Runner vorbereiten |', message: 'marks WP-E12-11 completed in overview' },
      { pattern: '| `WP-E12-12` | P1 | completed | WS6 | Enterprise Design System Token Productization vorbereiten |', message: 'marks WP-E12-12 completed in overview' },
      { pattern: '| `WP-E12-13` | P2 | completed | WS7 | RMT DSL Authoring Polish fuer Component Shells vorbereiten |', message: 'marks WP-E12-13 completed in overview' },
      { pattern: '| `WP-E12-14` | P2 | completed | WS8 | Release Candidate Gate Matrix fuer RC0 schneiden |', message: 'marks WP-E12-14 completed in overview' },
      { pattern: '| `WP-E12-15` | P2 | completed | WS9 | Docs, Migration Notes und Enterprise Adoption Guide aktualisieren |', message: 'marks WP-E12-15 completed in overview' },
      { pattern: '| `WP-E12-16` | P2 | completed | WS10 | Epic-12-Abschlussreview und RC0-Handoff |', message: 'marks WP-E12-16 completed in overview' },
      { pattern: 'xtend.epic12.rc-hardening-model.v1', message: 'accepts the RC hardening model contract' },
      { pattern: 'Handoff nach WP-E12-01', message: 'contains WP-E12-01 handoff' },
      { pattern: 'Handoff nach WP-E12-02', message: 'contains WP-E12-02 handoff' },
      { pattern: 'Handoff nach WP-E12-03', message: 'contains WP-E12-03 handoff' },
      { pattern: 'Handoff nach WP-E12-04', message: 'contains WP-E12-04 handoff' },
      { pattern: 'Handoff nach WP-E12-08', message: 'contains WP-E12-08 handoff' },
      { pattern: 'Handoff nach WP-E12-09', message: 'contains WP-E12-09 handoff' },
      { pattern: 'Handoff nach WP-E12-10', message: 'contains WP-E12-10 handoff' },
      { pattern: 'Handoff nach WP-E12-11', message: 'contains WP-E12-11 handoff' },
      { pattern: 'Handoff nach WP-E12-12', message: 'contains WP-E12-12 handoff' },
      { pattern: 'Handoff nach WP-E12-13', message: 'contains WP-E12-13 handoff' },
      { pattern: 'Handoff nach WP-E12-14', message: 'contains WP-E12-14 handoff' },
      { pattern: 'Handoff nach WP-E12-15', message: 'contains WP-E12-15 handoff' },
      { pattern: 'Handoff nach WP-E12-16', message: 'contains WP-E12-16 handoff' },
      { pattern: '`WP-E12-15` ist abgeschlossen', message: 'hands off WP-E12-15 as completed' },
      { pattern: '`WP-E12-16` ist abgeschlossen', message: 'hands off WP-E12-16 as completed' },
      { pattern: 'xtend.rmt.dsl-authoring-polish.v1', message: 'documents RMT DSL Authoring Polish contract' },
      { pattern: 'xtend.epic12.rc0-gate-matrix.v1', message: 'documents RC0 Gate Matrix contract' },
      { pattern: 'xtend.epic12.docs-adoption.v1', message: 'documents Epic 12 docs adoption contract' },
      { pattern: 'xtend.epic12.rc0-handoff.v1', message: 'documents Epic 12 RC0 Handoff contract' }
    ]
  },
  {
    path: 'development/XTend-Epic12-RC-Hardening-Modell.md',
    label: 'Epic 12 RC hardening model',
    contracts: [
      { pattern: 'xtend.epic12.rc-hardening-model.v1', message: 'declares Epic 12 RC hardening model contract' },
      { pattern: 'Status: Accepted', message: 'accepts the RC hardening model' },
      { pattern: '`handoff-accepted`', message: 'defines handoff accepted maturity' },
      { pattern: '`runtime-ready`', message: 'defines runtime ready maturity' },
      { pattern: '`visual-ready`', message: 'defines visual ready maturity' },
      { pattern: '`rc-candidate-ready`', message: 'defines RC candidate ready maturity' },
      { pattern: '`deferred-with-owner`', message: 'defines deferred maturity with owner' },
      { pattern: '`x-tabs`', message: 'tracks x-tabs as P0 hardening target' },
      { pattern: '`WP-E12-02` bis `WP-E12-16` sind abgeschlossen', message: 'documents WP-E12-02 to WP-E12-16 closure' },
      { pattern: 'Epic 12 ist abgeschlossen', message: 'documents Epic 12 closure' },
      { pattern: 'xtend.design-tokens.product-contract.v1', message: 'documents Design Token Product Contract' },
      { pattern: 'xtend.rmt.dsl-authoring-polish.v1', message: 'documents RMT DSL Authoring Polish Contract' },
      { pattern: 'xtend.epic12.rc0-gate-matrix.v1', message: 'documents RC0 Gate Matrix Contract' },
      { pattern: 'xtend.epic12.docs-adoption.v1', message: 'documents Epic 12 docs adoption contract' },
      { pattern: 'xtend.epic12.rc0-handoff.v1', message: 'documents Epic 12 RC0 Handoff contract' },
      { pattern: '`private: true` bis Release Owner Acceptance bestehen bleibt', message: 'keeps private package boundary before release owner acceptance' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents references gate' }
    ]
  },
  {
    path: 'development/WP-E12-01-Epic-12-Backlog-und-RC-Hardening-Modell-anlegen.md',
    label: 'WP-E12-01 backlog and RC hardening model workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp01.backlog-and-rc-hardening.v1', message: 'declares WP-E12-01 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-01 completed' },
      { pattern: 'xtend.epic12.rc-hardening-model.v1', message: 'accepts RC hardening model contract' },
      { pattern: 'Epic 12 wird in 16 Workpackages zerlegt', message: 'defines Epic 12 workpackage split' },
      { pattern: '`WP-E12-02` darf sofort starten', message: 'hands off WP-E12-02 as immediately startable' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents references verification gate' },
      { pattern: '`WP-E12-01` ist abgeschlossen', message: 'closes WP-E12-01 explicitly' }
    ]
  },
  {
    path: 'development/WP-E12-02-x-tabs-Performance-Profile-und-Runtime-Budget-finalisieren.md',
    label: 'WP-E12-02 x-tabs performance runtime budget workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp02.xtabs-performance-runtime-budget.v1', message: 'declares WP-E12-02 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-02 completed' },
      { pattern: 'xtendScaffoldPerformanceProfile', message: 'documents x-tabs performance profile' },
      { pattern: 'Tab-Switch Budget', message: 'documents tab switch budget' },
      { pattern: 'Keyboard Budget', message: 'documents keyboard budget' },
      { pattern: 'snapshotPerformance()', message: 'documents performance snapshot API' },
      { pattern: '`x-tabs` ist `enterprise-ready`', message: 'documents x-tabs enterprise-ready result' },
      { pattern: '`WP-E12-03` startbar', message: 'hands off WP-E12-03' },
      { pattern: 'node scripts/run_xtend_tests.js components catalog-coverage component-long-tail-migration regression-priority epic11-enterprise-ux-handoff references --json', message: 'documents verification gate' }
    ]
  },
  {
    path: 'development/WP-E12-03-x-tabs-Browser-Keyboard-A11y-und-Theme-Smokes-haerten.md',
    label: 'WP-E12-03 x-tabs browser keyboard a11y theme smoke workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp03.xtabs-browser-keyboard-a11y-theme-smokes.v1', message: 'declares WP-E12-03 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-03 completed' },
      { pattern: '`aria-controls`', message: 'documents x-tabs ARIA controls' },
      { pattern: '`ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter`, `Space`', message: 'documents x-tabs keyboard scope' },
      { pattern: 'tabs arrow key selected next tab', message: 'documents browser smoke arrow check' },
      { pattern: 'navigation tabs aria states covered', message: 'documents theme matrix ARIA check' },
      { pattern: 'repraesentative Komponentenabdeckung steigt von `16` auf `17`', message: 'documents component count increase' },
      { pattern: '`WP-E12-04` startbar', message: 'hands off WP-E12-04' },
      { pattern: 'node scripts/run_xtend_tests.js components component-ux-browser-smokes component-shell-theme-matrix browser references --json', message: 'documents verification gate' }
    ]
  },
  {
    path: 'development/WP-E12-04-x-theme-A11y-High-Contrast-und-Reduced-Motion-haerten.md',
    label: 'WP-E12-04 x-theme a11y motion contrast workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp04.xtheme-a11y-motion-contrast.v1', message: 'declares WP-E12-04 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-04 completed' },
      { pattern: '`xtendScaffoldA11yProfile`', message: 'documents x-theme A11y profile' },
      { pattern: '`xtendMotionContrastPolicy`', message: 'documents x-theme Motion/Contrast policy' },
      { pattern: '`theme-preference-changed`', message: 'documents preference event' },
      { pattern: '`theme-a11y-announcement`', message: 'documents A11y announcement event' },
      { pattern: '`x-theme` wechselt von `contract-gated` zu `typed-contract-gated`', message: 'documents catalog status transition' },
      { pattern: '`WP-E12-05` startbar', message: 'hands off WP-E12-05' },
      { pattern: 'node scripts/run_xtend_tests.js components motion-contrast catalog-coverage component-long-tail-migration regression-priority references --json', message: 'documents verification gate' }
    ]
  },
  {
    path: 'development/WP-E12-05-x-theme-Performance-Theme-Propagation-und-Density-Boundary-finalisieren.md',
    label: 'WP-E12-05 x-theme performance propagation density workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp05.xtheme-performance-propagation-density.v1', message: 'declares WP-E12-05 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-05 completed' },
      { pattern: '`xtendScaffoldPerformanceProfile`', message: 'documents x-theme performance profile' },
      { pattern: '`xtendRmtMetadata`', message: 'documents x-theme RMT metadata' },
      { pattern: '`xtendComponentNetworkContract`', message: 'documents x-theme component network contract' },
      { pattern: '`x-theme` wechselt von `typed-contract-gated` zu `enterprise-ready`', message: 'documents catalog status transition' },
      { pattern: '`WP-E12-06` startbar', message: 'hands off WP-E12-06' }
    ]
  },
  {
    path: 'development/WP-E12-06-x-button-Performance-und-Interaction-Budget-nachziehen.md',
    label: 'WP-E12-06 x-button performance interaction budget workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp06.xbutton-performance-interaction-budget.v1', message: 'declares WP-E12-06 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-06 completed' },
      { pattern: '`xtendScaffoldPerformanceProfile`', message: 'documents x-button performance profile' },
      { pattern: '`button-interaction`', message: 'documents x-button interaction event' },
      { pattern: '`button-performance-measured`', message: 'documents x-button performance event' },
      { pattern: '`snapshotPerformance()`', message: 'documents x-button performance snapshot API' },
      { pattern: '`x-button` wechselt von `typed-contract-gated` zu `enterprise-ready`', message: 'documents catalog status transition' },
      { pattern: '`WP-E12-07` startbar', message: 'hands off WP-E12-07' }
    ]
  },
  {
    path: 'development/WP-E12-07-x-menu-Performance-Keyboard-und-Router-Kompatibilitaet-haerten.md',
    label: 'WP-E12-07 x-menu performance keyboard router workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp07.xmenu-performance-keyboard-router.v1', message: 'declares WP-E12-07 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-07 completed' },
      { pattern: '`xtendScaffoldPerformanceProfile`', message: 'documents x-menu performance profile' },
      { pattern: '`menu-navigate`', message: 'documents x-menu navigation event' },
      { pattern: '`menu-keyboard-navigation`', message: 'documents x-menu keyboard event' },
      { pattern: '`menu-performance-measured`', message: 'documents x-menu performance event' },
      { pattern: '`snapshotPerformance()`', message: 'documents x-menu performance snapshot API' },
      { pattern: '`x-menu` wechselt von `typed-contract-gated` zu `enterprise-ready`', message: 'documents catalog status transition' },
      { pattern: '`WP-E12-08` startbar', message: 'hands off WP-E12-08' }
    ]
  },
  {
    path: 'development/WP-E12-08-xstate-Adapter-Typing-und-Lifecycle-Boundary-Probe-bauen.md',
    label: 'WP-E12-08 xstate adapter typing lifecycle boundary workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp08.xstate-adapter-typing-lifecycle-boundary.v1', message: 'declares WP-E12-08 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-08 completed' },
      { pattern: '`xtend.state.boundary-probe.v1`', message: 'documents xstate boundary schema' },
      { pattern: '`xtend.rmt.state-scheduler-compatibility.v1`', message: 'documents RMT state adapter schema' },
      { pattern: '`subscribeLifecycle(fn)`', message: 'documents xstate lifecycle subscription API' },
      { pattern: '`snapshotDiagnostics()`', message: 'documents Fabric diagnostics snapshot API' },
      { pattern: '`createRmtStateAdapter(options?)`', message: 'documents RMT state adapter API' },
      { pattern: '`componentSuite` steigt auf `36/37`', message: 'documents component-suite coverage increase' },
      { pattern: '`xstate` wechselt von `documented` zu `contract-gated`', message: 'documents catalog status transition' },
      { pattern: '`WP-E12-09` ist startbar', message: 'hands off WP-E12-09' }
    ]
  },
  {
    path: 'development/WP-E12-09-xutils-Utility-Import-Policy-und-Fixture-Probe-bauen.md',
    label: 'WP-E12-09 xutils utility import policy boundary workpackage',
    contracts: [
      { pattern: 'xtend.epic12.wp09.xutils-utility-import-policy-boundary.v1', message: 'declares WP-E12-09 contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-09 completed' },
      { pattern: '`xtend.utility.module-contract.v1`', message: 'documents x-utils utility contract schema' },
      { pattern: '`xtend.utility.import-policy.v1`', message: 'documents x-utils import policy schema' },
      { pattern: '`xtend.utility.ui-effects.v1`', message: 'documents x-utils UI effects schema' },
      { pattern: '`assertLocalImport(specifier)`', message: 'documents x-utils import policy API' },
      { pattern: '`snapshotUtilityContract()`', message: 'documents x-utils boundary snapshot API' },
      { pattern: '`resolveUiEffects()`', message: 'documents x-utils UI effects resolver' },
      { pattern: '`xutils:import-policy-check`', message: 'documents x-utils policy event' },
      { pattern: '`xutils:ui-effects-change`', message: 'documents x-utils UI effects event' },
      { pattern: '`componentSuite` steigt auf `37/37`', message: 'documents complete component-suite coverage' },
      { pattern: '`x-utils` wechselt von `documented` zu `typed-contract-gated`', message: 'documents catalog status transition' },
      { pattern: '`WP-E12-10` ist startbar', message: 'hands off WP-E12-10' }
    ]
  },
  {
    path: 'development/XTend-Visual-Snapshot-Automation-Contract.md',
    label: 'XTend Visual Snapshot Automation Contract',
    contracts: [
      { pattern: 'xtend.epic12.visual-snapshot-automation-contract.v1', message: 'declares Visual Snapshot Automation contract' },
      { pattern: 'Status: Accepted', message: 'accepts Visual Snapshot Automation contract' },
      { pattern: 'xtend.epic12.visual-snapshot-automation-entry.v1', message: 'declares Visual Snapshot entry contract' },
      { pattern: 'xtend.epic12.visual-snapshot-automation-report.v1', message: 'declares Visual Snapshot report contract' },
      { pattern: 'node scripts/run_xtend_tests.js visual-snapshot-automation --json', message: 'documents Visual Snapshot Automation gate' },
      { pattern: 'xtend.epic11.component-shell-theme-matrix.v1', message: 'links Component Shell Theme Matrix source' },
      { pattern: 'xtend.catalog.component-regression-priority-plan.v1', message: 'links Regression Priority source' },
      { pattern: 'dom-first-pixel-ready', message: 'documents DOM-first pixel-ready diff strategy' },
      { pattern: 'no-binary-baselines-in-WP-E12-10', message: 'keeps binary baselines deferred' },
      { pattern: 'WP-E12-11', message: 'hands off Snapshot runner implementation' },
      { pattern: 'no-rmt-kernel-import-of-xtend-types', message: 'keeps RMT kernel boundary' }
    ]
  },
  {
    path: 'development/WP-E12-10-Visual-Snapshot-Automation-Contract-definieren.md',
    label: 'WP-E12-10 Visual Snapshot Automation Contract workpackage',
    contracts: [
      { pattern: 'xtend.epic12.visual-snapshot-automation-contract.v1', message: 'declares WP-E12-10 accepted contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-10 completed' },
      { pattern: 'tests/browser/visual-snapshot-automation-plan.js', message: 'documents machine-readable Snapshot plan' },
      { pattern: 'tests/browser/visual_snapshot_automation_suite.js', message: 'documents Snapshot suite' },
      { pattern: '360 Matrix-Kombinationen', message: 'documents Theme Matrix combination count' },
      { pattern: 'dom-first-pixel-ready', message: 'documents diff strategy' },
      { pattern: 'no-binary-baselines-in-WP-E12-10', message: 'documents baseline boundary' },
      { pattern: '`WP-E12-11` startbar', message: 'hands off WP-E12-11' },
      { pattern: 'node scripts/run_xtend_tests.js visual-snapshot-automation --json', message: 'documents verification gate' }
    ]
  },
  {
    path: 'docs/visual-snapshot-automation.md',
    label: 'Visual Snapshot Automation developer docs',
    contracts: [
      { pattern: 'xtend.epic12.visual-snapshot-automation-contract.v1', message: 'declares Snapshot docs contract' },
      { pattern: 'xtend.epic12.visual-snapshot-runner.v1', message: 'declares Snapshot runner docs contract' },
      { pattern: 'xtend.epic12.visual-snapshot-fixture.v1', message: 'declares Snapshot fixture docs contract' },
      { pattern: 'node scripts/run_xtend_tests.js visual-snapshot-automation --json', message: 'documents Snapshot local gate' },
      { pattern: 'node scripts/run_xtend_tests.js visual-snapshots --json', message: 'documents Snapshot runner gate' },
      { pattern: 'tests/browser/visual-baselines/visual-snapshots.dom-baseline.json', message: 'documents Snapshot DOM baseline' },
      { pattern: 'dom-first-pixel-ready', message: 'documents Snapshot diff strategy' },
      { pattern: 'optional-local-pixel-diff', message: 'documents optional pixel diff' },
      { pattern: 'no-rmt-kernel-import-of-xtend-types', message: 'keeps RMT kernel boundary in docs' }
    ]
  },
  {
    path: 'development/WP-E12-11-Snapshot-Fixture-und-lokalen-Diff-Runner-vorbereiten.md',
    label: 'WP-E12-11 Visual Snapshots runner workpackage',
    contracts: [
      { pattern: 'xtend.epic12.visual-snapshot-runner.v1', message: 'declares WP-E12-11 runner contract' },
      { pattern: 'xtend.epic12.visual-snapshot-fixture.v1', message: 'declares WP-E12-11 fixture contract' },
      { pattern: 'xtend.epic12.visual-snapshot-runner-report.v1', message: 'declares WP-E12-11 report contract' },
      { pattern: 'Status: `completed`', message: 'marks WP-E12-11 completed' },
      { pattern: 'tests/browser/fixtures/visual-snapshots-fixture.html', message: 'documents Snapshot fixture' },
      { pattern: 'tests/browser/visual-baselines/visual-snapshots.dom-baseline.json', message: 'documents Snapshot DOM baseline' },
      { pattern: 'tests/browser/visual-snapshots-runner.js', message: 'documents Snapshot runner' },
      { pattern: 'tests/browser/visual_snapshots_suite.js', message: 'documents Snapshot suite' },
      { pattern: 'node scripts/run_xtend_tests.js visual-snapshots --json', message: 'documents Snapshot verification gate' },
      { pattern: '`WP-E12-12` startbar', message: 'hands off WP-E12-12' }
    ]
  },
  {
    path: 'development/ADR-XTend-Loader-und-Lokale-Entwicklung.md',
    label: 'XTend loader and local development ADR',
    contracts: [
      { pattern: 'xtend.loader.local-development.adr.v1', message: 'declares loader ADR contract' },
      { pattern: 'Status: Accepted', message: 'accepts the loader decision' },
      { pattern: 'xtend-loader.js', message: 'defines canonical loader file' },
      { pattern: 'xtend-dev.js', message: 'documents legacy loader file' },
      { pattern: 'ES6-/ESM-Module bleiben die Basistechnologie', message: 'keeps ESM as baseline technology' },
      { pattern: 'CDN ist kein Default- oder Testpfad', message: 'rejects CDN as default or test path' },
      { pattern: 'data-manifest', message: 'documents manifest override attribute' },
      { pattern: 'meta[name="xtend-preload"]', message: 'keeps preload convention' },
      { pattern: 'xtend.loader.contract.v1', message: 'declares loader contract id' },
      { pattern: 'npm run dev:local', message: 'documents local dev server script target' },
      { pattern: 'ER-WP-02', message: 'hands off to loader implementation' },
      { pattern: 'ER-WP-04', message: 'hands off to local server package' }
    ]
  },
  {
    path: 'development/ER-WP-01-Loader-Contract-und-Rename-ADR-fuer-xtend-loader-js.md',
    label: 'ER-WP-01 loader contract workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-01.loader-contract.v1', message: 'declares ER-WP-01 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-01 completed' },
      { pattern: 'ADR-XTend-Loader-und-Lokale-Entwicklung.md', message: 'links loader ADR' },
      { pattern: 'xtend-loader.js', message: 'documents canonical loader target' },
      { pattern: 'xtend-dev.js', message: 'documents legacy strategy' },
      { pattern: 'xtend.loader.contract.v1', message: 'documents loader contract' },
      { pattern: 'data-manifest', message: 'requires manifest override support' },
      { pattern: 'meta[name="xtend-preload"]', message: 'requires preload support' },
      { pattern: 'keine CDN-Fallbacks', message: 'rejects CDN fallbacks' },
      { pattern: '| `ER-WP-02` | ready |', message: 'hands off ER-WP-02 as ready' },
      { pattern: '| `ER-WP-04` | ready |', message: 'hands off ER-WP-04 as ready' },
      { pattern: '`ER-WP-01` ist abgeschlossen', message: 'closes ER-WP-01 explicitly' }
    ]
  },
  {
    path: 'development/ER-WP-02-xtend-loader-js-als-kanonischen-ESM-Loader-einfuehren.md',
    label: 'ER-WP-02 canonical loader workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-02.canonical-loader.v1', message: 'declares ER-WP-02 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-02 completed' },
      { pattern: 'xtend.loader.contract.v1', message: 'documents loader contract' },
      { pattern: 'xtend-loader.js', message: 'documents canonical loader entry' },
      { pattern: 'xtend-dev.js', message: 'documents legacy stub' },
      { pattern: 'window.XTendLoader', message: 'documents browser loader namespace' },
      { pattern: 'window.__XTendLoaderBootPromise', message: 'documents loader boot promise' },
      { pattern: 'data-manifest', message: 'documents manifest override support' },
      { pattern: 'meta[name="xtend-preload"]', message: 'documents preload support' },
      { pattern: 'api.initXTendAPI(manifest)', message: 'documents API initialization' },
      { pattern: '| `ER-WP-03` | ready |', message: 'hands off ER-WP-03 as ready' },
      { pattern: '| `ER-WP-18` | completed |', message: 'marks ER-WP-18 completed after measurement implementation' },
      { pattern: '`ER-WP-02` ist abgeschlossen', message: 'closes ER-WP-02 explicitly' }
    ]
  },
  {
    path: 'development/ER-WP-03-CDN-Fallbacks-aus-Core-Pfaden-entfernen.md',
    label: 'ER-WP-03 CDN fallback removal workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-03.cdn-fallback-removal.v1', message: 'declares ER-WP-03 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-03 completed' },
      { pattern: 'api.js', message: 'documents API core path migration' },
      { pattern: 'components/manifest.json', message: 'documents manifest migration' },
      { pattern: 'components/turndown.js', message: 'documents local writer helper' },
      { pattern: 'tests/browser/fixtures/core-flows-smoke.html', message: 'documents core browser fixture migration' },
      { pattern: 'docs/index.php', message: 'documents docs app local asset migration' },
      { pattern: 'rg "https://cdn.ccs-networks.de/xtend" api.js components tests/browser/fixtures index.html', message: 'documents CDN removal gate' },
      { pattern: 'ER-WP-05', message: 'hands off ER-WP-05 as ready' },
      { pattern: '`ER-WP-03` ist abgeschlossen', message: 'closes ER-WP-03 explicitly' }
    ]
  },
  {
    path: 'development/ER-WP-04-Lokalen-Dev-Test-Server-produktisieren.md',
    label: 'ER-WP-04 local dev server workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-04.local-dev-server.v1', message: 'declares ER-WP-04 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-04 completed' },
      { pattern: 'xtend.local-dev-server.v1', message: 'documents local dev server contract' },
      { pattern: 'scripts/serve_xtend_dev.js', message: 'documents local dev server entry' },
      { pattern: 'npm run dev:local', message: 'documents local development script' },
      { pattern: 'npm run test:browser:local', message: 'documents browser local test script' },
      { pattern: 'Port `0`', message: 'documents test-mode ephemeral port' },
      { pattern: 'MIME Types', message: 'documents MIME type support' },
      { pattern: 'Path-Traversal-Schutz', message: 'documents path traversal protection' },
      { pattern: '| `ER-WP-03` | ready |', message: 'hands off ER-WP-03 as ready' },
      { pattern: '| `ER-WP-05` | blocked |', message: 'keeps ER-WP-05 blocked until CDN removal' },
      { pattern: '`ER-WP-04` ist abgeschlossen', message: 'closes ER-WP-04 explicitly' }
    ]
  },
  {
    path: 'development/ER-WP-05-Demo-und-Fixture-Pfade-auf-neuen-Loader-migrieren.md',
    label: 'ER-WP-05 demo and fixture loader migration workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-05.demo-fixture-loader-migration.v1', message: 'declares ER-WP-05 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-05 completed' },
      { pattern: 'xtendrmt-bestcase.html', message: 'documents XTendRMT bestcase migration' },
      { pattern: 'xtend-loader.js', message: 'documents canonical loader usage' },
      { pattern: 'components/manifest.json', message: 'documents local manifest usage' },
      { pattern: 'window.__XTendLoaderBootPromise', message: 'documents loader boot sequencing' },
      { pattern: 'tests/browser/fixtures/core-flows-smoke.html', message: 'documents core browser fixture' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'documents RMT browser special fixture' },
      { pattern: 'xstatetest.html', message: 'documents migrated manual demo' },
      { pattern: 'ER-WP-06', message: 'hands off ER-WP-06 as ready' },
      { pattern: '`ER-WP-05` ist abgeschlossen', message: 'closes ER-WP-05 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Package-Export-und-Release-Strategie.md',
    label: 'XTend package export and release strategy',
    contracts: [
      { pattern: 'xtend.package-export.release-strategy.v1', message: 'declares package export strategy contract' },
      { pattern: 'Status: Accepted', message: 'accepts the package export strategy' },
      { pattern: '`private: true`', message: 'keeps package publishing blocked' },
      { pattern: 'xtend-loader.js', message: 'documents canonical loader export' },
      { pattern: 'xtend-dev.js', message: 'documents legacy loader export' },
      { pattern: '`xtend/fabric`', message: 'documents Fabric export path' },
      { pattern: '`xtend/catalog/component-catalog-coverage`', message: 'documents Component Catalog Coverage export path' },
      { pattern: '`xtend/rmt`', message: 'documents RMT export path' },
      { pattern: '`xtend/security/trusted-dom-policy`', message: 'documents security policy export path' },
      { pattern: '`xtend/security/supply-chain-gate-policy`', message: 'documents supply-chain policy export path' },
      { pattern: 'npm run test:supply-chain', message: 'documents supply-chain release gate' },
      { pattern: 'npm run test:catalog-coverage', message: 'documents catalog coverage release gate' },
      { pattern: 'npm run pack:dry-run', message: 'documents package dry-run gate' },
      { pattern: 'xtend.release.checklist-semver-policy.v1', message: 'documents release checklist and SemVer policy' },
      { pattern: 'development/XTend-Release-Checklist-und-SemVer-Policy.md', message: 'links release checklist policy' },
      { pattern: 'xtend.releaseChecklist', message: 'documents package release checklist metadata' },
      { pattern: 'publishConfig.provenance', message: 'documents provenance setup' },
      { pattern: '`ER-WP-30` | completed', message: 'marks ER-WP-30 completed' },
      { pattern: '`ER-WP-38` | completed', message: 'marks ER-WP-38 completed' },
      { pattern: 'EPIC 06 fachlich ab', message: 'closes Epic 06 in strategy' }
    ]
  },
  {
    path: 'development/ER-WP-06-Package-Export-und-Release-Strategie-festlegen.md',
    label: 'ER-WP-06 package export and release strategy workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-06.package-export-release-strategy.v1', message: 'declares ER-WP-06 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-06 completed' },
      { pattern: 'development/XTend-Package-Export-und-Release-Strategie.md', message: 'links package strategy' },
      { pattern: 'package.json', message: 'documents package metadata changes' },
      { pattern: 'README.md', message: 'documents root README' },
      { pattern: 'CHANGELOG.md', message: 'documents changelog' },
      { pattern: 'private: true', message: 'keeps publish boundary visible' },
      { pattern: '`ER-WP-30` | completed', message: 'marks ER-WP-30 completed after supply-chain gates' },
      { pattern: 'EPIC 06 ist damit fachlich vollstaendig', message: 'closes Epic 06 explicitly' }
    ]
  },
  {
    path: 'README.md',
    label: 'XTend package README',
    contracts: [
      { pattern: 'xtend.package-export.release-strategy.v1', message: 'documents package export contract' },
      { pattern: 'xtend-loader.js', message: 'documents canonical loader' },
      { pattern: 'xtendrmt/rmt-runtime.esm.js', message: 'documents RMT ESM runtime' },
      { pattern: 'fabric/xtend-fabric.js', message: 'documents Fabric runtime' },
      { pattern: 'docs/performance.md', message: 'documents Performance authoring docs' },
      { pattern: 'docs/performance-regression.md', message: 'documents Performance Regression docs' },
      { pattern: 'docs/hydration-policies.md', message: 'documents Hydration Policy docs' },
      { pattern: 'docs/motion-contrast.md', message: 'documents Motion and Contrast docs' },
      { pattern: 'XTend-Performance-Regression-Gate.md', message: 'documents Performance Regression gate plan' },
      { pattern: 'XTend-Hydration-Policy-Contract.md', message: 'documents Hydration Policy contract' },
      { pattern: 'docs/a11y-keyboard-smokes.md', message: 'documents A11y keyboard smoke docs' },
      { pattern: 'XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md', message: 'documents A11y keyboard smoke plan' },
      { pattern: 'XTend-Motion-und-Contrast-Policy.md', message: 'documents Motion and Contrast policy' },
      { pattern: 'security/manifest-import-policy.js', message: 'documents Manifest Import policy entry' },
      { pattern: 'XTend-Manifest-und-Dynamic-Import-Policy.md', message: 'documents Manifest Import policy plan' },
      { pattern: 'security/supply-chain-gate-policy.js', message: 'documents Supply-Chain policy entry' },
      { pattern: 'catalog/component-catalog-coverage.js', message: 'documents Component Catalog Coverage entry' },
      { pattern: 'XTend-Component-Catalog-Coverage-Matrix.md', message: 'documents Component Catalog Coverage Matrix' },
      { pattern: 'XTend-CI-Default-Gates-Workflow.md', message: 'documents CI default gates workflow' },
      { pattern: 'XTend-CI-Gate-Matrix.md', message: 'documents CI gate matrix' },
      { pattern: 'XTend-Release-Checklist-und-SemVer-Policy.md', message: 'documents release checklist policy' },
      { pattern: 'xtend.release.checklist-semver-policy.v1', message: 'documents release checklist contract' },
      { pattern: 'xtend.releaseChecklist', message: 'documents release checklist metadata' },
      { pattern: 'docs/enterprise-adoption.md', message: 'documents Enterprise Adoption guide' },
      { pattern: 'xtend.docs.enterprise-adoption.v1', message: 'documents Enterprise Adoption guide contract' },
      { pattern: 'xtend.enterpriseAdoption', message: 'documents Enterprise Adoption metadata' },
      { pattern: '.github/workflows/xtend-default-gates.yml', message: 'documents active CI workflow path' },
      { pattern: 'xtend-pr-gate-report-node-26', message: 'documents PR gate report artifact' },
      { pattern: 'xtend-release-gate-report-node-26', message: 'documents release gate report artifact' },
      { pattern: 'npm run dev:local', message: 'documents local dev command' },
      { pattern: 'npm run test:report', message: 'documents CI report gate command' },
      { pattern: 'npm run test:pr', message: 'documents PR fast gate command' },
      { pattern: 'npm run test:release:full', message: 'documents full release gate command' },
      { pattern: 'npm run test:performance', message: 'documents Performance regression gate command' },
      { pattern: 'npm run test:hydration-policy', message: 'documents Hydration Policy gate command' },
      { pattern: 'npm run test:catalog-coverage', message: 'documents Catalog Coverage gate command' },
      { pattern: 'npm run test:manifest-policy', message: 'documents Manifest Import policy gate command' },
      { pattern: 'npm run test:supply-chain', message: 'documents Supply-Chain gate command' },
      { pattern: 'npm run pack:dry-run', message: 'documents pack dry-run command' },
      { pattern: '`private: true`', message: 'documents private package boundary' }
    ]
  },
  {
    path: 'CHANGELOG.md',
    label: 'XTend package changelog',
    contracts: [
      { pattern: '0.0.0-enterprise-readiness', message: 'documents enterprise readiness version' },
      { pattern: 'xtend.package-export.release-strategy.v1', message: 'documents package export strategy' },
      { pattern: 'xtend.security.supply-chain-gate-plan.v1', message: 'documents supply-chain gate plan' },
      { pattern: 'xtend.scaffold.performance-policy.v1', message: 'documents Performance scaffold policy' },
      { pattern: 'xtend.performance.regression-gate.v1', message: 'documents Performance Regression gate contract' },
      { pattern: 'xtend.fabric.hydration-policy.v1', message: 'documents Hydration Policy contract' },
      { pattern: 'xtend.a11y.browser-keyboard-smoke.v1', message: 'documents A11y keyboard smoke contract' },
      { pattern: 'xtend.a11y.motion-contrast-policy.v1', message: 'documents Motion and Contrast contract' },
      { pattern: 'xtend.security.manifest-import-gate.v1', message: 'documents Manifest Import policy contract' },
      { pattern: 'xtend.catalog.component-coverage-matrix.v1', message: 'documents Component Catalog Coverage contract' },
      { pattern: 'xtend.ci.default-gates.v1', message: 'documents CI default gates contract' },
      { pattern: 'xtend.ci.gate-matrix.v1', message: 'documents CI gate matrix contract' },
      { pattern: 'xtend.release.checklist-semver-policy.v1', message: 'documents release checklist and SemVer policy' },
      { pattern: 'xtend.docs.enterprise-adoption.v1', message: 'documents Enterprise Adoption guide contract' },
      { pattern: 'Release-Gates', message: 'documents release gate changes' },
      { pattern: 'Provenance', message: 'documents provenance preparation' },
      { pattern: 'private: true', message: 'documents private package boundary' }
    ]
  },
  {
    path: 'scripts/serve_xtend_dev.js',
    label: 'XTend local dev server module',
    contracts: [
      { pattern: 'xtend.local-dev-server.v1', message: 'declares local server contract' },
      { pattern: 'createXtendDevServer', message: 'exports server factory' },
      { pattern: 'listenXtendDevServer', message: 'exports listen helper' },
      { pattern: 'resolveSafePath', message: 'exports path safety helper' },
      { pattern: "'.mjs'", message: 'supports ESM MIME type' },
      { pattern: "'.wasm'", message: 'supports WebAssembly MIME type' },
      { pattern: 'x-xtend-dev-server', message: 'sends server contract header' },
      { pattern: '--port', message: 'supports configurable port' },
      { pattern: '--check', message: 'supports startup check mode' }
    ]
  },
  {
    path: 'package.json',
    label: 'XTend enterprise package scripts',
    contracts: [
      { pattern: '"version": "0.0.0-enterprise-readiness"', message: 'declares enterprise readiness package version' },
      { pattern: '"browser": "./xtend-loader.js"', message: 'declares canonical browser loader' },
      { pattern: '"exports"', message: 'declares package exports map' },
      { patterns: ['"./loader": "./xtend-loader.js"', '"./loader": {\n      "types": "./xtend-loader.d.ts",\n      "browser": "./xtend-loader.js",\n      "default": "./xtend-loader.js"\n    }'], message: 'exports canonical loader' },
      { patterns: ['"./legacy-loader": "./xtend-dev.js"', '"./legacy-loader": {\n      "types": "./xtend-dev.d.ts",\n      "browser": "./xtend-dev.js",\n      "default": "./xtend-dev.js"\n    }'], message: 'exports legacy loader' },
      { patterns: ['"./api": "./api.js"', '"./api": {\n      "types": "./api.d.ts",\n      "browser": "./api.js",\n      "default": "./api.js"\n    }'], message: 'exports API module' },
      { pattern: '"./manifest": "./components/manifest.json"', message: 'exports default manifest' },
      { patterns: ['"./a11y/screenreader-signals": "./a11y/screenreader-signals.js"', '"./a11y/screenreader-signals": {\n      "types": "./a11y/screenreader-signals.d.ts",\n      "default": "./a11y/screenreader-signals.js"\n    }'], message: 'exports Screenreader signal contract module' },
      { patterns: ['"./a11y/motion-contrast-policy": "./a11y/motion-contrast-policy.js"', '"./a11y/motion-contrast-policy": {\n      "types": "./a11y/motion-contrast-policy.d.ts",\n      "default": "./a11y/motion-contrast-policy.js"\n    }'], message: 'exports Motion and Contrast contract module' },
      { patterns: ['"./fabric": "./fabric/xtend-fabric.js"', '"./fabric": {\n      "types": "./fabric/xtend-fabric.d.ts",\n      "default": "./fabric/xtend-fabric.js"\n    }'], message: 'exports Fabric runtime' },
      { patterns: ['"./fabric/rmt-lane-mapping": "./fabric/rmt-lane-mapping.js"', '"./fabric/rmt-lane-mapping": {\n      "types": "./fabric/rmt-lane-mapping.d.ts",\n      "default": "./fabric/rmt-lane-mapping.js"\n    }'], message: 'exports Fabric RMT lane mapping' },
      { patterns: ['"./fabric/hydration-policy": "./fabric/hydration-policy.js"', '"./fabric/hydration-policy": {\n      "types": "./fabric/hydration-policy.d.ts",\n      "default": "./fabric/hydration-policy.js"\n    }'], message: 'exports Fabric hydration policy' },
      { patterns: ['"./catalog/component-catalog-coverage": "./catalog/component-catalog-coverage.js"', '"./catalog/component-catalog-coverage": {\n      "types": "./catalog/component-catalog-coverage.d.ts",\n      "default": "./catalog/component-catalog-coverage.js"\n    }'], message: 'exports Component Catalog Coverage module' },
      { patterns: ['"./catalog/component-regression-priority": "./catalog/component-regression-priority.js"', '"./catalog/component-regression-priority": {\n      "types": "./catalog/component-regression-priority.d.ts",\n      "default": "./catalog/component-regression-priority.js"\n    }'], message: 'exports Component Regression Priority module' },
      { patterns: ['"./catalog/epic10-release-handoff": "./catalog/epic10-release-handoff.js"', '"./catalog/epic10-release-handoff": {\n      "types": "./catalog/epic10-release-handoff.d.ts",\n      "default": "./catalog/epic10-release-handoff.js"\n    }'], message: 'exports Epic 10 Release Handoff module' },
      { pattern: '"./rmt"', message: 'exports RMT runtime entry' },
      { patterns: ['"./rmt/browser": "./xtendrmt/rmt-runtime.browser.js"', '"./rmt/browser": {\n      "types": "./xtendrmt/rmt-core.d.ts",\n      "browser": "./xtendrmt/rmt-runtime.browser.js",\n      "default": "./xtendrmt/rmt-runtime.browser.js"\n    }'], message: 'exports RMT browser runtime' },
      { patterns: ['"./security/manifest-import-policy": "./security/manifest-import-policy.js"', '"./security/manifest-import-policy": {\n      "types": "./security/manifest-import-policy.d.ts",\n      "default": "./security/manifest-import-policy.js"\n    }'], message: 'exports Manifest Import policy' },
      { patterns: ['"./security/trusted-dom-policy": "./security/trusted-dom-policy.js"', '"./security/trusted-dom-policy": {\n      "types": "./security/trusted-dom-policy.d.ts",\n      "default": "./security/trusted-dom-policy.js"\n    }'], message: 'exports Trusted DOM policy' },
      { patterns: ['"./security/supply-chain-gate-policy": "./security/supply-chain-gate-policy.js"', '"./security/supply-chain-gate-policy": {\n      "types": "./security/supply-chain-gate-policy.d.ts",\n      "default": "./security/supply-chain-gate-policy.js"\n    }'], message: 'exports Supply-Chain policy' },
      { pattern: '"provenance": true', message: 'prepares npm provenance' },
      { pattern: '"schema": "xtend.package-export.release-strategy.v1"', message: 'declares package export strategy schema' },
      { pattern: '"schema": "xtend.performance.regression-gate.v1"', message: 'declares performance regression gate schema' },
      { pattern: '"reportSchema": "xtend.performance.regression-report.v1"', message: 'declares performance regression report schema' },
      { pattern: '"schema": "xtend.fabric.hydration-policy.v1"', message: 'declares hydration policy schema' },
      { pattern: '"schema": "xtend.a11y.screenreader-signals.v1"', message: 'declares Screenreader signal metadata schema' },
      { pattern: '"signalSchema": "xtend.a11y.screenreader-signal.v1"', message: 'declares Screenreader signal record metadata schema' },
      { pattern: '"schema": "xtend.a11y.motion-contrast-policy.v1"', message: 'declares Motion and Contrast metadata schema' },
      { pattern: '"motionSchema": "xtend.a11y.motion-policy.v1"', message: 'declares Motion policy metadata schema' },
      { pattern: '"schema": "xtend.catalog.component-regression-priority-plan.v1"', message: 'declares regression priority metadata schema' },
      { pattern: '"schema": "xtend.ci.default-gates.v1"', message: 'declares CI default gates metadata schema' },
      { pattern: '"workflow": ".github/workflows/xtend-default-gates.yml"', message: 'declares CI workflow path metadata' },
      { pattern: '"artifactName": "xtend-test-report-node-26"', message: 'declares CI report artifact metadata' },
      { pattern: '"ciGateMatrix"', message: 'declares CI gate matrix metadata' },
      { pattern: '"schema": "xtend.ci.gate-matrix.v1"', message: 'declares CI gate matrix metadata schema' },
      { pattern: '"schema": "xtend.ci.pr-fast-gate.v1"', message: 'declares PR fast gate metadata schema' },
      { pattern: '"schema": "xtend.ci.full-release-gate.v1"', message: 'declares full release gate metadata schema' },
      { pattern: '"schema": "xtend.ci.nightly-gate.v1"', message: 'declares nightly gate metadata schema' },
      { pattern: '"artifactName": "xtend-pr-gate-report-node-26"', message: 'declares PR gate report artifact metadata' },
      { pattern: '"artifactName": "xtend-release-gate-report-node-26"', message: 'declares release gate report artifact metadata' },
      { pattern: '"releaseChecklist"', message: 'declares release checklist metadata' },
      { pattern: '"schema": "xtend.release.checklist-semver-policy.v1"', message: 'declares release checklist metadata schema' },
      { pattern: '"policy": "development/XTend-Release-Checklist-und-SemVer-Policy.md"', message: 'declares release checklist policy path' },
      { pattern: '"currentPhase": "0.x-enterprise-readiness"', message: 'declares pre-1.0 release phase' },
      { pattern: '"publishBoundary": "private-until-release-owner-approval"', message: 'declares release owner publish boundary' },
      { pattern: '"completedRun": "ER-WP-40"', message: 'declares completed enterprise run' },
      { pattern: '"nextWorkpackage": null', message: 'declares no next enterprise workpackage' },
      { pattern: '"enterpriseAdoption"', message: 'declares Enterprise Adoption metadata' },
      { pattern: '"schema": "xtend.docs.enterprise-adoption.v1"', message: 'declares Enterprise Adoption schema' },
      { pattern: '"guide": "docs/enterprise-adoption.md"', message: 'declares Enterprise Adoption guide path' },
      { pattern: '"workpackage": "ER-WP-39"', message: 'declares Enterprise Adoption workpackage' },
      { pattern: '"status": "active"', message: 'declares Enterprise Adoption status' },
      { pattern: '"docsRmtPilot"', message: 'declares Docs RMT Pilot metadata' },
      { pattern: '"schema": "xtend.docs.parsedown-rmt-pilot.v1"', message: 'declares Docs RMT Pilot metadata schema' },
      { pattern: '"document": "docs/xtendrmt-parsedown-docs.rmt"', message: 'declares Docs RMT Pilot document path' },
      { pattern: '"renderMode": "shell-first"', message: 'declares Docs RMT shell-first mode' },
      { pattern: '"shellTemplate": "docs.app.shell"', message: 'declares Docs RMT shell template' },
      { pattern: '"searchTemplate": "docs.header.search"', message: 'declares Docs RMT search template' },
      { pattern: '"xplayerTutorial"', message: 'declares future XPlayer Docs content kind' },
      { pattern: '"test:docs-rmt-pilot": "node scripts/run_xtend_tests.js docs-rmt-pilot"', message: 'exposes Docs RMT pilot test script' },
      { pattern: '"contrastSchema": "xtend.a11y.contrast-policy.v1"', message: 'declares Contrast policy metadata schema' },
      { pattern: '"schema": "xtend.catalog.component-coverage-matrix.v1"', message: 'declares Component Catalog Coverage metadata schema' },
      { pattern: '"entrySchema": "xtend.catalog.component-coverage-entry.v1"', message: 'declares Component Catalog entry metadata schema' },
      { pattern: '"gateSchema": "xtend.catalog.component-coverage-gate.v1"', message: 'declares Component Catalog gate metadata schema' },
      { pattern: '"schema": "xtend.security.manifest-import-gate.v1"', message: 'declares manifest import gate schema' },
      { pattern: '"schema": "xtend.security.supply-chain-gate-plan.v1"', message: 'declares supply-chain gate plan schema' },
      { pattern: '"epic10ReleaseHandoff"', message: 'declares Epic 10 Release Handoff metadata' },
      { pattern: '"schema": "xtend.epic10.release-handoff.v1"', message: 'declares Epic 10 Release Handoff schema' },
      { pattern: '"dev:local": "node scripts/serve_xtend_dev.js --port 4173"', message: 'exposes local dev server script' },
      { pattern: '"test:browser:local": "node scripts/run_xtend_tests.js browser"', message: 'exposes browser local test script' },
      { pattern: '"test:fabric": "node scripts/run_xtend_tests.js fabric"', message: 'exposes Fabric runtime test script' },
      { pattern: '"test:fabric-lanes": "node scripts/run_xtend_tests.js fabric-lane-mapping"', message: 'exposes Fabric RMT lane mapping test script' },
      { pattern: '"test:fabric-lifecycle": "node scripts/run_xtend_tests.js fabric-lifecycle-boundary"', message: 'exposes Fabric lifecycle boundary test script' },
      { pattern: '"test:fabric-reporters": "node scripts/run_xtend_tests.js fabric-reporters"', message: 'exposes Fabric reporter adapter test script' },
      { pattern: '"test:fabric-runtime-bridge": "node scripts/run_xtend_tests.js fabric-runtime-bridge"', message: 'exposes Fabric runtime diagnostics bridge test script' },
      { pattern: '"test:fabric-component-fibers": "node scripts/run_xtend_tests.js fabric-component-fibers"', message: 'exposes Fabric component fiber test script' },
      { pattern: '"test:fabric-route-fibers": "node scripts/run_xtend_tests.js fabric-route-fibers"', message: 'exposes Fabric route fiber test script' },
      { pattern: '"test:fabric-telemetry": "node scripts/run_xtend_tests.js fabric-telemetry-snapshot"', message: 'exposes Fabric telemetry snapshot test script' },
      { pattern: '"test:fabric-performance": "node scripts/run_xtend_tests.js fabric-performance-measurements"', message: 'exposes Fabric performance measurement test script' },
      { pattern: '"test:performance": "node scripts/run_xtend_tests.js performance-regression"', message: 'exposes Performance regression test script' },
      { pattern: '"test:hydration-policy": "node scripts/run_xtend_tests.js hydration-policy"', message: 'exposes Hydration Policy test script' },
      { pattern: '"test:screenreader-signals": "node scripts/run_xtend_tests.js screenreader-signals"', message: 'exposes Screenreader signal test script' },
      { pattern: '"test:motion-contrast": "node scripts/run_xtend_tests.js motion-contrast"', message: 'exposes Motion and Contrast test script' },
      { pattern: '"test:catalog-coverage": "node scripts/run_xtend_tests.js catalog-coverage"', message: 'exposes Component Catalog Coverage test script' },
      { pattern: '"test:regression-priority": "node scripts/run_xtend_tests.js regression-priority"', message: 'exposes Component Regression Priority test script' },
      { pattern: '"test:epic10-platform-gates": "node scripts/run_xtend_tests.js epic10-platform-gates"', message: 'exposes Epic 10 Platform Gates test script' },
      { pattern: '"test:epic10-release-handoff": "node scripts/run_xtend_tests.js epic10-release-handoff"', message: 'exposes Epic 10 Release Handoff test script' },
      { pattern: '"test:component-ux-browser-smokes": "node scripts/run_xtend_tests.js component-ux-browser-smokes"', message: 'exposes Epic 11 Component UX browser smoke test script' },
      { pattern: '"test:component-shell-theme-matrix": "node scripts/run_xtend_tests.js component-shell-theme-matrix"', message: 'exposes Epic 11 Component Shell Theme Matrix test script' },
      { pattern: '"visualSnapshotAutomation"', message: 'declares Visual Snapshot Automation metadata' },
      { pattern: '"schema": "xtend.epic12.visual-snapshot-automation-contract.v1"', message: 'declares Visual Snapshot Automation schema' },
      { pattern: '"suite": "tests/browser/visual_snapshot_automation_suite.js"', message: 'declares Visual Snapshot Automation suite path' },
      { pattern: '"runnerImplementation": "deferred-to-WP-E12-11"', message: 'defers Visual Snapshot runner implementation' },
      { pattern: '"baselineCommitPolicy": "no-binary-baselines-in-WP-E12-10"', message: 'declares Visual Snapshot baseline policy' },
      { pattern: '"test:visual-snapshot-automation": "node scripts/run_xtend_tests.js visual-snapshot-automation"', message: 'exposes Epic 12 Visual Snapshot Automation test script' },
      { pattern: '"visualSnapshots"', message: 'declares Visual Snapshots runner metadata' },
      { pattern: '"schema": "xtend.epic12.visual-snapshot-runner.v1"', message: 'declares Visual Snapshots runner schema' },
      { pattern: '"fixtureSchema": "xtend.epic12.visual-snapshot-fixture.v1"', message: 'declares Visual Snapshots fixture schema' },
      { pattern: '"baseline": "tests/browser/visual-baselines/visual-snapshots.dom-baseline.json"', message: 'declares Visual Snapshots baseline path' },
      { pattern: '"domDiffMode": "dom-structure-and-state-diff"', message: 'declares Visual Snapshots DOM diff mode' },
      { pattern: '"pixelDiffMode": "optional-local-pixel-diff"', message: 'declares Visual Snapshots optional pixel diff mode' },
      { pattern: '"test:visual-snapshots": "node scripts/run_xtend_tests.js visual-snapshots"', message: 'exposes Epic 12 Visual Snapshots test script' },
      { patterns: ['"./catalog/epic12-docs-adoption": "./catalog/epic12-docs-adoption.js"', '"./catalog/epic12-docs-adoption": {\n      "types": "./catalog/epic12-docs-adoption.d.ts",\n      "default": "./catalog/epic12-docs-adoption.js"\n    }'], message: 'exports Epic 12 docs adoption module' },
      { pattern: '"epic12DocsAdoption"', message: 'declares Epic 12 docs adoption metadata' },
      { pattern: '"schema": "xtend.epic12.docs-adoption.v1"', message: 'declares Epic 12 docs adoption schema' },
      { pattern: '"docs": "docs/rc0-adoption-guide.md"', message: 'declares RC0 Adoption Guide docs path' },
      { pattern: '"test:epic12-docs-adoption": "node scripts/run_xtend_tests.js epic12-docs-adoption"', message: 'exposes Epic 12 docs adoption test script' },
      { pattern: '"test:component-ux-authoring-docs": "node scripts/run_xtend_tests.js component-ux-authoring-docs"', message: 'exposes Epic 11 Component UX Authoring Docs test script' },
      { pattern: '"test:component-long-tail-migration": "node scripts/run_xtend_tests.js component-long-tail-migration"', message: 'exposes Epic 11 Legacy Long-Tail Migration test script' },
      { pattern: '"test:epic11-enterprise-ux-handoff": "node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff"', message: 'exposes Epic 11 Enterprise UX Handoff test script' },
      { pattern: '"test:report": "node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json"', message: 'exposes CI report gate script' },
      { pattern: '"test:pr": "node scripts/run_xtend_tests.js core architecture components component-contract-v2 component-shell-contract component-styling-contract builder-typescript-blueprint epic10-p0-component-wave component-lab-rmt-inspector component-lab-ux-inspector component-ux-browser-smokes component-shell-theme-matrix component-ux-authoring-docs component-long-tail-migration epic11-enterprise-ux-handoff rmt-first-demo-app existing-component-metadata epic10-platform-gates epic10-release-handoff browser a11y-hydration screenreader-signals motion-contrast runtime-a11y-contract component-ux-performance component-network-contract rmt-shell-authoring-ux form-controls-ux feedback-status-ux navigation-routing-ux overlay-interaction-ux layout-display-media-ux catalog-coverage regression-priority fabric fabric-lane-mapping fabric-lifecycle-boundary fabric-reporters fabric-runtime-bridge references supply-chain manifest-import-policy docs-rmt-pilot"', message: 'exposes PR fast gate script' },
      { pattern: '"test:pr:report": "node scripts/run_xtend_tests.js core architecture components component-contract-v2 component-shell-contract component-styling-contract builder-typescript-blueprint epic10-p0-component-wave component-lab-rmt-inspector component-lab-ux-inspector component-ux-browser-smokes component-shell-theme-matrix component-ux-authoring-docs component-long-tail-migration epic11-enterprise-ux-handoff rmt-first-demo-app existing-component-metadata epic10-platform-gates epic10-release-handoff browser a11y-hydration screenreader-signals motion-contrast runtime-a11y-contract component-ux-performance component-network-contract rmt-shell-authoring-ux form-controls-ux feedback-status-ux navigation-routing-ux overlay-interaction-ux layout-display-media-ux catalog-coverage regression-priority fabric fabric-lane-mapping fabric-lifecycle-boundary fabric-reporters fabric-runtime-bridge references supply-chain manifest-import-policy docs-rmt-pilot --report .xtend-test-results/xtend-pr-gate-report.json"', message: 'exposes PR fast report gate script' },
      { pattern: '"test:release:full": "node scripts/run_xtend_tests.js"', message: 'exposes full release gate script' },
      { pattern: '"test:release:full:report": "node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-release-gate-report.json"', message: 'exposes full release report gate script' },
      { pattern: '"test:manifest-policy": "node scripts/run_xtend_tests.js manifest-import-policy"', message: 'exposes Manifest Import policy test script' },
      { pattern: '"test:supply-chain": "node scripts/run_xtend_tests.js supply-chain"', message: 'exposes Supply-Chain test script' },
      { pattern: '"security:manifest-policy": "node scripts/verify_manifest_import_policy.js"', message: 'exposes Manifest Import policy verify script' },
      { pattern: '"supply-chain:verify": "node scripts/verify_supply_chain_policy.js"', message: 'exposes Supply-Chain verify script' },
      { pattern: '"release:check": "npm test"', message: 'exposes release check script' },
      { pattern: '"release:report": "node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-release-report.json"', message: 'exposes release report script' },
      { pattern: '"pack:dry-run": "npm pack --dry-run"', message: 'exposes package dry-run script' }
    ]
  },
  {
    path: 'development/ADR-XTend-Fabric.md',
    label: 'XTend-Fabric ADR',
    contracts: [
      { pattern: 'xtend.fabric.adr.v1', message: 'declares Fabric ADR contract' },
      { pattern: 'Status: Accepted', message: 'accepts the Fabric decision' },
      { pattern: 'xtend.fabric.api.v1', message: 'declares Fabric API contract' },
      { pattern: '@xtend-fabric', message: 'defines canonical Fabric API name' },
      { pattern: 'window.XTendFabric', message: 'defines browser namespace' },
      { pattern: 'fabric/xtend-fabric.js', message: 'defines first runtime path' },
      { pattern: 'createXtendFabric(options)', message: 'defines Fabric factory' },
      { pattern: 'wrapComponent', message: 'defines component wrapping API' },
      { pattern: 'runFiber', message: 'defines fiber execution API' },
      { pattern: 'emitDiagnostic', message: 'defines diagnostic API' },
      { pattern: 'registerReporter', message: 'defines reporter API' },
      { pattern: 'xtend.fabric.diagnostic.v1', message: 'declares diagnostic contract' },
      { pattern: 'xtend.fabric.reporter.v1', message: 'declares reporter contract' },
      { pattern: 'xtend.fabric.redaction.v1', message: 'declares redaction contract' },
      { pattern: 'rmt.state-scheduler-diagnostics', message: 'documents RMT diagnostics bridge source' },
      { pattern: 'ER-WP-08', message: 'hands off to Fabric runtime skeleton' }
    ]
  },
  {
    path: 'development/ER-WP-07-XTend-Fabric-ADR-und-API-Surface-definieren.md',
    label: 'ER-WP-07 Fabric API surface workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-07.fabric-api-surface.v1', message: 'declares ER-WP-07 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-07 completed' },
      { pattern: 'ADR-XTend-Fabric.md', message: 'links Fabric ADR' },
      { pattern: '@xtend-fabric', message: 'documents canonical API name' },
      { pattern: 'window.XTendFabric', message: 'documents browser namespace' },
      { pattern: 'xtend.fabric.api.v1', message: 'documents API contract' },
      { pattern: 'xtend.fabric.diagnostic.v1', message: 'documents diagnostic contract' },
      { pattern: 'xtend.fabric.reporter.v1', message: 'documents reporter contract' },
      { pattern: 'xtend.fabric.redaction.v1', message: 'documents redaction contract' },
      { pattern: '| `ER-WP-08` | ready |', message: 'hands off ER-WP-08 as ready' },
      { pattern: '`ER-WP-07` ist abgeschlossen', message: 'closes ER-WP-07 explicitly' }
    ]
  },
  {
    path: 'development/ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md',
    label: 'ER-WP-08 Fabric runtime skeleton workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-08.fabric-runtime-skeleton.v1', message: 'declares ER-WP-08 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-08 completed' },
      { pattern: 'fabric/xtend-fabric.js', message: 'documents Fabric runtime entry' },
      { pattern: 'tests/fabric/fabric_runtime_suite.js', message: 'documents Fabric runtime suite' },
      { pattern: 'docs/xtend-fabric.md', message: 'links Fabric docs' },
      { pattern: 'xtend.fabric.api.v1', message: 'documents API contract' },
      { pattern: 'xtend.fabric.diagnostic.v1', message: 'documents diagnostic contract' },
      { pattern: 'xtend.fabric.reporter.v1', message: 'documents reporter contract' },
      { pattern: 'xtend.fabric.redaction.v1', message: 'documents redaction contract' },
      { pattern: 'xtend.fabric.fiber.v1', message: 'documents fiber contract' },
      { pattern: 'xtend.fabric.lane.v1', message: 'documents lane contract' },
      { pattern: 'createXtendFabric(options)', message: 'documents Fabric factory' },
      { pattern: 'connectRmtDiagnostics', message: 'documents RMT diagnostics consumption' },
      { pattern: '| `ER-WP-09` | completed |', message: 'marks ER-WP-09 completed after lifecycle implementation' },
      { pattern: '| `ER-WP-10` | completed |', message: 'marks ER-WP-10 completed after reporter implementation' },
      { pattern: '| `ER-WP-11` | completed |', message: 'marks ER-WP-11 completed after runtime bridge implementation' },
      { pattern: '`ER-WP-08` ist abgeschlossen', message: 'closes ER-WP-08 explicitly' }
    ]
  },
  {
    path: 'fabric/xtend-fabric.js',
    label: 'XTend-Fabric runtime module',
    contracts: [
      { pattern: 'xtend.fabric.api.v1', message: 'declares Fabric API contract' },
      { pattern: 'xtend.fabric.diagnostic.v1', message: 'declares Fabric diagnostic contract' },
      { pattern: 'xtend.fabric.reporter.v1', message: 'declares Fabric reporter contract' },
      { pattern: 'xtend.fabric.redaction.v1', message: 'declares Fabric redaction contract' },
      { pattern: 'xtend.fabric.fiber.v1', message: 'declares Fabric fiber contract' },
      { pattern: 'xtend.fabric.lane.v1', message: 'declares Fabric lane contract' },
      { pattern: 'xtend.fabric.lifecycle-error-boundary.v1', message: 'declares lifecycle error boundary contract' },
      { pattern: 'xtend.fabric.runtime-diagnostics-bridge.v1', message: 'declares runtime diagnostics bridge contract' },
      { pattern: 'xtend.fabric.telemetry-snapshot.v1', message: 'declares telemetry snapshot contract' },
      { pattern: 'xtend.fabric.backpressure-signal.v1', message: 'declares backpressure signal contract' },
      { pattern: 'xtend.performance.measurement.v1', message: 'declares performance measurement contract' },
      { pattern: 'xtend.fabric.component-fiber-instrumentation.v1', message: 'declares component fiber instrumentation contract' },
      { pattern: 'xtend.fabric.route-fiber-instrumentation.v1', message: 'declares route fiber instrumentation contract' },
      { pattern: 'window.XTendFabric', message: 'exposes browser namespace' },
      { pattern: 'createXtendFabric', message: 'exposes Fabric factory' },
      { pattern: 'createNoopReporter', message: 'exposes noop reporter factory' },
      { pattern: 'createReporterAdapter', message: 'exposes reporter adapter factory' },
      { pattern: 'createConsoleReporter', message: 'exposes console reporter factory' },
      { pattern: 'createTestReporter', message: 'exposes test reporter factory' },
      { pattern: 'createComponentLifecycleBoundary', message: 'exposes component lifecycle boundary factory' },
      { pattern: 'createComponentFiberInstrumentation', message: 'exposes component fiber instrumentation factory' },
      { pattern: 'createRouteFiberInstrumentation', message: 'exposes route fiber instrumentation factory' },
      { pattern: 'createRuntimeDiagnosticsBridge', message: 'exposes runtime diagnostics bridge factory' },
      { pattern: 'createTelemetrySnapshot', message: 'exposes telemetry snapshot factory' },
      { pattern: 'publishTelemetrySnapshot', message: 'exposes telemetry snapshot publisher' },
      { pattern: 'createBackpressureSignal', message: 'exposes backpressure signal factory' },
      { pattern: 'connectXState', message: 'exposes xstate runtime diagnostics bridge connector' },
      { pattern: 'connectApi', message: 'exposes API runtime diagnostics bridge connector' },
      { pattern: 'createRmtDiagnosticsHub', message: 'exposes RMT diagnostics hub factory' },
      { pattern: 'wrapEventHandler', message: 'exposes event handler wrapper' },
      { pattern: 'wrapComponent', message: 'exposes component wrapper' },
      { pattern: 'runFiber', message: 'exposes fiber runner' },
      { pattern: 'emitDiagnostic', message: 'exposes diagnostic emitter' },
      { pattern: 'registerReporter', message: 'exposes reporter registration' },
      { pattern: 'createBoundary', message: 'exposes boundary factory' },
      { pattern: 'captureError', message: 'exposes error capture' },
      { pattern: 'connectRmtDiagnostics', message: 'exposes RMT diagnostic connector' },
      { pattern: 'xtend.fabric.component.lifecycle.failed', message: 'emits stable lifecycle failure code' },
      { pattern: 'xtend.fabric.component.hydrate.failed', message: 'emits stable component hydration failure code' },
      { pattern: 'xtend.fabric.route.render.failed', message: 'emits stable route render failure code' },
      { pattern: 'xtend.fabric.reporter.failed', message: 'emits stable reporter failure code' },
      { pattern: 'xtend.fabric.xstate.connected', message: 'emits stable xstate bridge diagnostic code' },
      { pattern: 'xtend.fabric.api.connected', message: 'emits stable API bridge diagnostic code' },
      { pattern: 'xtend.fabric.rmt.connected', message: 'emits stable RMT bridge diagnostic code' },
      { pattern: 'xtend.fabric.telemetry.snapshot', message: 'emits stable telemetry snapshot diagnostic code' },
      { pattern: 'LIFECYCLE_PHASES', message: 'keeps lifecycle phase mapping visible' },
      { pattern: 'COMPONENT_FIBER_OPERATION_PROFILES', message: 'keeps component fiber operation profiles visible' },
      { pattern: 'ROUTE_FIBER_OPERATION_PROFILES', message: 'keeps route fiber operation profiles visible' },
      { pattern: 'PERFORMANCE_MEASURE_PHASES', message: 'keeps performance phase mapping visible' },
      { pattern: 'PERFORMANCE_MEASURE_NAME_BY_FIBER_KIND', message: 'keeps performance fiber mapping visible' },
      { pattern: 'PERFORMANCE_BUDGET_MS_BY_MEASURE', message: 'keeps performance budgets visible' },
      { pattern: 'REPORTER_LEVEL_ORDER', message: 'keeps reporter severity ordering visible' },
      { pattern: 'SENSITIVE_KEY_PATTERN', message: 'keeps redaction policy visible' },
      { pattern: 'DEFAULT_LANE_BY_KIND', message: 'keeps lane inference table visible' }
    ]
  },
  {
    path: 'tests/fabric/fabric_runtime_suite.js',
    label: 'XTend-Fabric runtime suite',
    contracts: [
      { pattern: 'XTend-Fabric runtime skeleton', message: 'declares Fabric suite label' },
      { pattern: 'createXtendFabric', message: 'tests Fabric factory' },
      { pattern: 'createNoopReporter', message: 'tests noop reporter factory' },
      { pattern: 'runFiber', message: 'tests fiber runner' },
      { pattern: 'wrapComponent', message: 'tests component wrapper' },
      { pattern: 'connectRmtDiagnostics', message: 'tests RMT diagnostics connector' },
      { pattern: 'redact', message: 'tests redaction behaviour' }
    ]
  },
  {
    path: 'development/XTend-Component-Lifecycle-Error-Boundary.md',
    label: 'XTend Component Lifecycle Error Boundary contract',
    contracts: [
      { pattern: 'xtend.fabric.lifecycle-error-boundary.v1', message: 'declares lifecycle boundary contract' },
      { pattern: 'Status: Accepted', message: 'accepts lifecycle boundary decision' },
      { pattern: 'xtend.fabric.component.lifecycle.failed', message: 'documents lifecycle failure code' },
      { pattern: 'connectedCallback', message: 'covers connectedCallback phase' },
      { pattern: 'attributeChangedCallback', message: 'covers attributeChangedCallback phase' },
      { pattern: 'render', message: 'covers render phase' },
      { pattern: 'hydrate', message: 'covers hydrate phase' },
      { pattern: 'disconnectedCallback', message: 'covers disconnectedCallback phase' },
      { pattern: 'eventHandler', message: 'covers event handler phase' },
      { pattern: '`component.disconnect` | `background`', message: 'maps disconnect to background lane' },
      { pattern: '`event.handler` | `user-blocking`', message: 'maps events to user-blocking lane' },
      { pattern: '| `component` | ja |', message: 'documents component diagnostic field' },
      { pattern: '| `fiberId` | ja |', message: 'documents fiber diagnostic field' },
      { pattern: '| `severity` | ja |', message: 'documents severity diagnostic field' },
      { pattern: '| `cause` | ja |', message: 'documents cause diagnostic field' },
      { pattern: '`ER-WP-10` | completed', message: 'marks ER-WP-10 completed after reporter implementation' },
      { pattern: '`ER-WP-14` | completed', message: 'marks ER-WP-14 completed after component fiber implementation' },
      { pattern: '`ER-WP-15` | completed', message: 'marks ER-WP-15 completed after route fiber implementation' }
    ]
  },
  {
    path: 'development/ER-WP-09-Component-Lifecycle-Error-Boundary-einfuehren.md',
    label: 'ER-WP-09 lifecycle error boundary workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-09.lifecycle-error-boundary.v1', message: 'declares ER-WP-09 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-09 completed' },
      { pattern: 'xtend.fabric.lifecycle-error-boundary.v1', message: 'documents runtime contract' },
      { pattern: 'fabric/xtend-fabric.js', message: 'links Fabric runtime' },
      { pattern: 'tests/fabric/fabric_lifecycle_boundary_suite.js', message: 'links lifecycle boundary suite' },
      { pattern: 'tests/fabric/fixtures/broken-lifecycle.component.js', message: 'links broken lifecycle fixture' },
      { pattern: 'npm run test:fabric-lifecycle', message: 'documents lifecycle test script' },
      { pattern: 'Fehler enthalten Component', message: 'checks component field acceptance' },
      { pattern: 'Fehler enthalten Phase', message: 'checks phase field acceptance' },
      { pattern: 'Fehler enthalten Fiber', message: 'checks fiber field acceptance' },
      { pattern: 'Fehler enthalten Lane', message: 'checks lane field acceptance' },
      { pattern: 'Fehler enthalten Severity', message: 'checks severity field acceptance' },
      { pattern: 'Fehler enthalten Cause', message: 'checks cause field acceptance' },
      { pattern: '`ER-WP-09` ist abgeschlossen', message: 'closes ER-WP-09 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Component-Fiber-Instrumentierung.md',
    label: 'XTend Component Fiber Instrumentierung contract',
    contracts: [
      { pattern: 'xtend.fabric.component-fiber-instrumentation.v1', message: 'declares component fiber instrumentation contract' },
      { pattern: 'Status: Accepted', message: 'accepts component fiber instrumentation decision' },
      { pattern: 'createComponentFiberInstrumentation', message: 'documents component fiber instrumentation factory' },
      { pattern: '`mount` | `component.mount` | `visible` | `component.visible.mount` | `xtendrmt.component.mount`', message: 'documents mount operation profile' },
      { pattern: '`hydrate` | `component.hydrate` | `idle` | `component.idle.hydrate` | `xtendrmt.component.hydrate`', message: 'documents hydration operation profile' },
      { pattern: '`preload` | `loader.module` | `visible` | `component.visible.mount` | `xtendrmt.component.mount`', message: 'documents preload operation profile' },
      { pattern: 'xtend.fabric.component.mount.failed', message: 'documents mount failure diagnostic' },
      { pattern: 'xtend.fabric.component.hydrate.failed', message: 'documents hydration failure diagnostic' },
      { pattern: 'xtend.fabric.component.preload.failed', message: 'documents preload failure diagnostic' },
      { pattern: 'RMT Kernel wird nicht importiert', message: 'keeps RMT kernel boundary visible' },
      { pattern: '| `ER-WP-15` | completed |', message: 'marks ER-WP-15 completed after route fiber implementation' }
    ]
  },
  {
    path: 'development/ER-WP-14-Component-Mount-Hydration-als-Fibers-instrumentieren.md',
    label: 'ER-WP-14 component fiber instrumentation workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-14.component-fiber-instrumentation.v1', message: 'declares ER-WP-14 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-14 completed' },
      { pattern: 'xtend.fabric.component-fiber-instrumentation.v1', message: 'documents runtime contract' },
      { pattern: 'createComponentFiberInstrumentation(componentRef, options)', message: 'documents component fiber API' },
      { pattern: 'component.visible.mount', message: 'documents mount scheduleRef' },
      { pattern: 'component.idle.hydrate', message: 'documents idle hydration scheduleRef' },
      { pattern: 'xtend.fabric.component.hydrate.failed', message: 'documents hydration failure diagnostic' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-component-fibers --json', message: 'documents component fiber gate' },
      { pattern: '| `ER-WP-15` | completed |', message: 'marks ER-WP-15 completed after route fiber implementation' },
      { pattern: '`ER-WP-14` ist abgeschlossen', message: 'closes ER-WP-14 explicitly' }
    ]
  },
  {
    path: 'tests/fabric/fabric_component_fiber_suite.js',
    label: 'XTend-Fabric component fiber suite',
    contracts: [
      { pattern: 'XTend-Fabric component mount and hydration fibers', message: 'declares component fiber suite label' },
      { pattern: 'xtend.fabric.component-fiber-instrumentation.v1', message: 'tests component fiber contract' },
      { pattern: 'createComponentFiberInstrumentation', message: 'tests component fiber factory' },
      { pattern: 'COMPONENT_FIBER_OPERATION_PROFILES', message: 'tests operation profile export' },
      { pattern: 'component.visible.mount', message: 'tests mount scheduleRef' },
      { pattern: 'component.idle.hydrate', message: 'tests idle hydration scheduleRef' },
      { pattern: 'xtendrmt.component.hydrate', message: 'tests hydration endpoint hint' },
      { pattern: 'durationMs', message: 'tests component fiber duration' },
      { pattern: 'xtend.fabric.component.hydrate.failed', message: 'tests hydration failure diagnostics' },
      { pattern: 'rmt-runtime', message: 'guards against RMT runtime imports' }
    ]
  },
  {
    path: 'development/XTend-Route-Fiber-Instrumentierung.md',
    label: 'XTend Route Fiber Instrumentierung contract',
    contracts: [
      { pattern: 'xtend.fabric.route-fiber-instrumentation.v1', message: 'declares route fiber instrumentation contract' },
      { pattern: 'Status: Accepted', message: 'accepts route fiber instrumentation decision' },
      { pattern: 'createRouteFiberInstrumentation', message: 'documents route fiber instrumentation factory' },
      { pattern: '`navigate` | `route.navigate` | `user-blocking` | `ui.user-blocking.input` | `xtendrmt.ui.user-blocking`', message: 'documents navigation operation profile' },
      { pattern: '`render` | `route.render` | `transition` | `route.transition.render` | `xtendrmt.route.render`', message: 'documents render operation profile' },
      { pattern: 'xtend.fabric.route.navigate.failed', message: 'documents navigation failure diagnostic' },
      { pattern: 'xtend.fabric.route.render.failed', message: 'documents render failure diagnostic' },
      { pattern: 'router-navigate', message: 'documents XRouter/xstate integration signal' },
      { pattern: 'RMT Kernel', message: 'keeps RMT kernel boundary visible' },
      { pattern: '| `ER-WP-16` | completed |', message: 'marks ER-WP-16 completed after telemetry snapshot implementation' }
    ]
  },
  {
    path: 'development/ER-WP-15-Route-Render-und-XRouter-Navigation-als-Fibers-instrumentieren.md',
    label: 'ER-WP-15 route fiber instrumentation workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-15.route-fiber-instrumentation.v1', message: 'declares ER-WP-15 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-15 completed' },
      { pattern: 'xtend.fabric.route-fiber-instrumentation.v1', message: 'documents runtime contract' },
      { pattern: 'createRouteFiberInstrumentation(routerRef, options)', message: 'documents route fiber API' },
      { pattern: 'ui.user-blocking.input', message: 'documents navigation scheduleRef' },
      { pattern: 'route.transition.render', message: 'documents transition route scheduleRef' },
      { pattern: 'xtend.fabric.route.render.failed', message: 'documents render failure diagnostic' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-route-fibers --json', message: 'documents route fiber gate' },
      { pattern: '| `ER-WP-16` | completed |', message: 'marks ER-WP-16 completed after telemetry snapshot implementation' },
      { pattern: '`ER-WP-15` ist abgeschlossen', message: 'closes ER-WP-15 explicitly' }
    ]
  },
  {
    path: 'tests/fabric/fabric_route_fiber_suite.js',
    label: 'XTend-Fabric route fiber suite',
    contracts: [
      { pattern: 'XTend-Fabric route navigation and render fibers', message: 'declares route fiber suite label' },
      { pattern: 'xtend.fabric.route-fiber-instrumentation.v1', message: 'tests route fiber contract' },
      { pattern: 'createRouteFiberInstrumentation', message: 'tests route fiber factory' },
      { pattern: 'ROUTE_FIBER_OPERATION_PROFILES', message: 'tests operation profile export' },
      { pattern: 'ui.user-blocking.input', message: 'tests navigation scheduleRef' },
      { pattern: 'route.transition.render', message: 'tests transition route scheduleRef' },
      { pattern: 'xtendrmt.route.render', message: 'tests route render endpoint hint' },
      { pattern: 'durationMs', message: 'tests route fiber duration' },
      { pattern: 'xtend.fabric.route.render.failed', message: 'tests render failure diagnostics' },
      { pattern: 'rmt-runtime', message: 'guards against RMT runtime imports' }
    ]
  },
  {
    path: 'development/XTend-Fabric-Reporter-Adapter-Contract.md',
    label: 'XTend-Fabric Reporter Adapter Contract',
    contracts: [
      { pattern: 'xtend.fabric.reporter.v1', message: 'declares reporter adapter contract' },
      { pattern: 'Status: Accepted', message: 'accepts reporter adapter decision' },
      { pattern: 'createReporterAdapter(options)', message: 'documents generic reporter adapter factory' },
      { pattern: 'createConsoleReporter(options)', message: 'documents console reporter factory' },
      { pattern: 'createTestReporter(options)', message: 'documents test reporter factory' },
      { pattern: 'createNoopReporter()', message: 'documents noop reporter factory' },
      { pattern: 'Reporter werden nur durch `fabric.registerReporter(reporter)` aktiv', message: 'keeps reporter delivery opt-in' },
      { pattern: 'Default `noop` sendet nichts extern', message: 'keeps default reporter external-free' },
      { pattern: 'minimumLevel', message: 'documents severity gate' },
      { pattern: 'filter(event, context)', message: 'documents reporter filter hook' },
      { pattern: 'mapEvent(event, context)', message: 'documents reporter mapping hook' },
      { pattern: 'xtend.fabric.reporter.failed', message: 'documents reporter failure diagnostic' },
      { pattern: '`ER-WP-11` | completed', message: 'marks ER-WP-11 completed after runtime bridge implementation' }
    ]
  },
  {
    path: 'development/ER-WP-10-Reporter-Adapter-Contract-vorbereiten.md',
    label: 'ER-WP-10 reporter adapter workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-10.reporter-adapter-contract.v1', message: 'declares ER-WP-10 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-10 completed' },
      { pattern: 'xtend.fabric.reporter.v1', message: 'documents reporter contract' },
      { pattern: 'createReporterAdapter(options)', message: 'documents generic reporter adapter factory' },
      { pattern: 'createConsoleReporter(options)', message: 'documents console reporter factory' },
      { pattern: 'createTestReporter(options)', message: 'documents test reporter factory' },
      { pattern: 'Reporter sind opt-in', message: 'checks reporter opt-in acceptance' },
      { pattern: 'Default sendet nichts extern', message: 'checks noop default acceptance' },
      { pattern: 'xtend.fabric.reporter.failed', message: 'checks reporter failure handling' },
      { pattern: '| `ER-WP-11` | completed |', message: 'marks ER-WP-11 completed after runtime bridge implementation' },
      { pattern: '`ER-WP-10` ist abgeschlossen', message: 'closes ER-WP-10 explicitly' }
    ]
  },
  {
    path: 'tests/fabric/fabric_reporter_adapter_suite.js',
    label: 'XTend-Fabric reporter adapter suite',
    contracts: [
      { pattern: 'XTend-Fabric reporter adapter contract', message: 'declares reporter adapter suite label' },
      { pattern: 'xtend.fabric.reporter.v1', message: 'tests reporter contract' },
      { pattern: 'createReporterAdapter', message: 'tests generic reporter adapter factory' },
      { pattern: 'createConsoleReporter', message: 'tests console reporter factory' },
      { pattern: 'createTestReporter', message: 'tests test reporter factory' },
      { pattern: 'minimumLevel', message: 'tests severity filtering' },
      { pattern: 'external', message: 'tests enterprise reporter metadata' },
      { pattern: 'capabilities', message: 'tests reporter capability metadata' },
      { pattern: 'xtend.fabric.reporter.failed', message: 'tests reporter failure diagnostics' }
    ]
  },
  {
    path: 'development/XTend-Fabric-Runtime-Diagnostics-Bridge.md',
    label: 'XTend-Fabric Runtime Diagnostics Bridge contract',
    contracts: [
      { pattern: 'xtend.fabric.runtime-diagnostics-bridge.v1', message: 'declares runtime diagnostics bridge contract' },
      { pattern: 'Status: Accepted', message: 'accepts runtime diagnostics bridge decision' },
      { pattern: 'createRuntimeDiagnosticsBridge', message: 'documents runtime diagnostics bridge factory' },
      { pattern: 'connectXState', message: 'documents xstate bridge connector' },
      { pattern: 'connectApi', message: 'documents API bridge connector' },
      { pattern: 'createRmtDiagnosticsHub', message: 'documents RMT diagnostics hub factory' },
      { pattern: 'xtend.fabric.xstate.connected', message: 'documents xstate connected diagnostic' },
      { pattern: 'xtend.fabric.api.connected', message: 'documents API connected diagnostic' },
      { pattern: 'xtend.rmt.bridge.adapter.result.degraded', message: 'documents normalized RMT diagnostic code' },
      { pattern: 'RMT Kernel wird nicht importiert', message: 'keeps RMT kernel boundary visible' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-runtime-bridge --json', message: 'documents runtime bridge gate' }
    ]
  },
  {
    path: 'development/ER-WP-11-Fabric-an-xstate-API-und-XTendRMT-Diagnostics-anbinden.md',
    label: 'ER-WP-11 runtime diagnostics bridge workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-11.runtime-diagnostics-bridge.v1', message: 'declares ER-WP-11 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-11 completed' },
      { pattern: 'xtend.fabric.runtime-diagnostics-bridge.v1', message: 'documents runtime bridge contract' },
      { pattern: 'fabric/xtend-fabric.js', message: 'links Fabric runtime' },
      { pattern: 'tests/fabric/fabric_runtime_diagnostics_bridge_suite.js', message: 'links runtime bridge suite' },
      { pattern: 'npm run test:fabric-runtime-bridge', message: 'documents package script' },
      { pattern: '| `ER-WP-16` | completed |', message: 'marks ER-WP-16 completed after telemetry snapshot implementation' },
      { pattern: '`ER-WP-11` ist abgeschlossen', message: 'closes ER-WP-11 explicitly' }
    ]
  },
  {
    path: 'tests/fabric/fabric_runtime_diagnostics_bridge_suite.js',
    label: 'XTend-Fabric runtime diagnostics bridge suite',
    contracts: [
      { pattern: 'XTend-Fabric xstate API and RMT diagnostics bridge', message: 'declares runtime bridge suite label' },
      { pattern: 'xtend.fabric.runtime-diagnostics-bridge.v1', message: 'tests runtime bridge contract' },
      { pattern: 'createRuntimeDiagnosticsBridge', message: 'tests runtime bridge factory' },
      { pattern: 'connectXState', message: 'tests xstate connector' },
      { pattern: 'connectApi', message: 'tests API connector' },
      { pattern: 'createRmtDiagnosticsHub', message: 'tests RMT diagnostics hub' },
      { pattern: 'xtend.fabric.bridge.ready', message: 'tests xstate ready mirror' },
      { pattern: 'xtend.fabric.diagnostics.last', message: 'tests xstate diagnostic mirror' },
      { pattern: 'xtend.rmt.bridge.adapter.result.degraded', message: 'tests normalized RMT diagnostic' },
      { pattern: 'rmt-runtime', message: 'guards against RMT runtime imports' }
    ]
  },
  {
    path: 'development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md',
    label: 'XTend Telemetry Snapshot and Backpressure contract',
    contracts: [
      { pattern: 'xtend.fabric.telemetry-snapshot.v1', message: 'declares telemetry snapshot contract' },
      { pattern: 'xtend.fabric.backpressure-signal.v1', message: 'declares backpressure signal contract' },
      { pattern: 'Status: Accepted', message: 'accepts telemetry snapshot decision' },
      { pattern: 'createTelemetrySnapshot', message: 'documents telemetry snapshot factory' },
      { pattern: 'publishTelemetrySnapshot', message: 'documents telemetry snapshot publisher' },
      { pattern: 'createBackpressureSignal', message: 'documents backpressure signal factory' },
      { pattern: 'Performance Runtime Anschluss', message: 'documents performance runtime connection' },
      { pattern: 'xtend.fabric.telemetry.snapshot', message: 'documents telemetry snapshot diagnostic' },
      { pattern: 'RMT Kernel wird nicht importiert', message: 'keeps RMT kernel boundary visible' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json', message: 'documents telemetry snapshot gate' }
    ]
  },
  {
    path: 'development/ER-WP-16-Telemetry-Snapshots-und-Backpressure-Signale-integrieren.md',
    label: 'ER-WP-16 telemetry snapshot workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-16.telemetry-snapshot-backpressure.v1', message: 'declares ER-WP-16 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-16 completed' },
      { pattern: 'xtend.fabric.telemetry-snapshot.v1', message: 'documents telemetry snapshot contract' },
      { pattern: 'xtend.fabric.backpressure-signal.v1', message: 'documents backpressure signal contract' },
      { pattern: 'tests/fabric/fabric_telemetry_snapshot_suite.js', message: 'links telemetry snapshot suite' },
      { pattern: 'npm run test:fabric-telemetry', message: 'documents package script' },
      { pattern: '| `ER-WP-18` | completed |', message: 'marks ER-WP-18 completed after performance measurements' },
      { pattern: '`ER-WP-16` ist abgeschlossen', message: 'closes ER-WP-16 explicitly' }
    ]
  },
  {
    path: 'tests/fabric/fabric_telemetry_snapshot_suite.js',
    label: 'XTend-Fabric telemetry snapshot suite',
    contracts: [
      { pattern: 'XTend-Fabric telemetry snapshots and backpressure', message: 'declares telemetry snapshot suite label' },
      { pattern: 'xtend.fabric.telemetry-snapshot.v1', message: 'tests telemetry snapshot contract' },
      { pattern: 'xtend.fabric.backpressure-signal.v1', message: 'tests backpressure signal contract' },
      { pattern: 'createTelemetrySnapshot', message: 'tests telemetry snapshot factory' },
      { pattern: 'publishTelemetrySnapshot', message: 'tests telemetry snapshot publisher' },
      { pattern: 'createBackpressureSignal', message: 'tests backpressure signal factory' },
      { pattern: 'xtend.fabric.telemetry.snapshot', message: 'tests telemetry snapshot diagnostic' },
      { pattern: 'xtend.route.render', message: 'tests performance runtime entries' },
      { pattern: 'rmt-runtime', message: 'guards against RMT runtime imports' }
    ]
  },
  {
    path: 'tests/fabric/fabric_lifecycle_boundary_suite.js',
    label: 'XTend-Fabric lifecycle boundary suite',
    contracts: [
      { pattern: 'XTend-Fabric component lifecycle error boundary', message: 'declares suite label' },
      { pattern: 'xtend.fabric.lifecycle-error-boundary.v1', message: 'tests lifecycle boundary contract' },
      { pattern: 'createComponentLifecycleBoundary', message: 'tests lifecycle boundary factory' },
      { pattern: 'wrapEventHandler', message: 'tests event handler wrapping' },
      { pattern: 'connectedCallback', message: 'tests connectedCallback failure' },
      { pattern: 'hydrate', message: 'tests hydrate failure' },
      { pattern: 'disconnectedCallback', message: 'tests disconnect failure' },
      { pattern: 'event.handler', message: 'tests event handler fiber' },
      { pattern: 'severity', message: 'tests severity field' },
      { pattern: 'cause', message: 'tests cause field' }
    ]
  },
  {
    path: 'tests/fabric/fixtures/broken-lifecycle.component.js',
    label: 'Broken lifecycle component fixture',
    contracts: [
      { pattern: 'xtend.fabric.lifecycle-error-boundary.fixture.v1', message: 'declares broken lifecycle fixture contract' },
      { pattern: 'BrokenLifecycleComponent', message: 'exports broken lifecycle component' },
      { pattern: 'connectedCallback', message: 'fixture throws in connectedCallback' },
      { pattern: 'attributeChangedCallback', message: 'fixture throws in attributeChangedCallback' },
      { pattern: 'render', message: 'fixture throws in render' },
      { pattern: 'hydrate', message: 'fixture rejects in hydrate' },
      { pattern: 'disconnectedCallback', message: 'fixture throws in disconnectedCallback' },
      { pattern: 'handleClick', message: 'fixture throws in event handler' }
    ]
  },
  {
    path: 'development/XTend-Fiber-und-Lane-Contract.md',
    label: 'XTend Fiber and Lane contract',
    contracts: [
      { pattern: 'xtend.fabric.fiber-lane-contract.v1', message: 'declares combined Fiber/Lane contract' },
      { pattern: 'Status: Accepted', message: 'accepts the Fiber/Lane decision' },
      { pattern: 'xtend.fabric.fiber.v1', message: 'declares Fabric Fiber contract' },
      { pattern: 'xtend.fabric.lane.v1', message: 'declares Fabric Lane contract' },
      { pattern: 'user-blocking', message: 'defines user-blocking lane' },
      { pattern: 'a11y', message: 'defines a11y lane' },
      { pattern: 'visible', message: 'defines visible lane' },
      { pattern: 'transition', message: 'defines transition lane' },
      { pattern: 'idle', message: 'defines idle lane' },
      { pattern: 'background', message: 'defines background lane' },
      { pattern: 'diagnostics', message: 'defines diagnostics lane' },
      { pattern: 'component.hydrate', message: 'defines component hydration fiber kind' },
      { pattern: 'route.navigate', message: 'defines route navigation fiber kind' },
      { pattern: 'a11y.announce', message: 'defines accessibility announcement fiber kind' },
      { pattern: 'rmt.adapter-result', message: 'defines RMT adapter result fiber kind' },
      { pattern: 'endpointNameHint', message: 'prepares RMT endpoint mapping hint' },
      { pattern: 'scheduleRef', message: 'prepares RMT schedule reference' },
      { pattern: 'xtend.fabric.diagnostic.v1', message: 'links Fabric diagnostic contract' },
      { pattern: 'ER-WP-13', message: 'hands off to RMT lane mapping' }
    ]
  },
  {
    path: 'development/ER-WP-12-Fiber-und-Lane-Contract-spezifizieren.md',
    label: 'ER-WP-12 Fiber and Lane workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-12.fiber-lane-contract.v1', message: 'declares ER-WP-12 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-12 completed' },
      { pattern: 'XTend-Fiber-und-Lane-Contract.md', message: 'links Fiber/Lane contract' },
      { pattern: 'xtend.fabric.fiber.v1', message: 'documents Fiber contract' },
      { pattern: 'xtend.fabric.lane.v1', message: 'documents Lane contract' },
      { pattern: 'user-blocking', message: 'documents user-blocking lane' },
      { pattern: 'a11y', message: 'documents a11y lane' },
      { pattern: 'visible', message: 'documents visible lane' },
      { pattern: 'transition', message: 'documents transition lane' },
      { pattern: 'idle', message: 'documents idle lane' },
      { pattern: 'background', message: 'documents background lane' },
      { pattern: 'diagnostics', message: 'documents diagnostics lane' },
      { pattern: '| `ER-WP-13` | ready |', message: 'hands off ER-WP-13 as ready' },
      { pattern: '`ER-WP-12` ist abgeschlossen', message: 'closes ER-WP-12 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Fabric-RMT-Lane-Mapping.md',
    label: 'XTend-Fabric RMT Lane Mapping contract',
    contracts: [
      { pattern: 'xtend.fabric.rmt-lane-mapping.v1', message: 'declares Fabric RMT lane mapping contract' },
      { pattern: 'Status: Accepted', message: 'accepts the lane mapping decision' },
      { pattern: 'xtend.fabric.rmt-lane-schedule.v1', message: 'declares schedule wrapper contract' },
      { pattern: 'xtend.rmt.schedules-domain.v1', message: 'links RMT schedules domain' },
      { pattern: 'a11y` | `user-blocking', message: 'maps a11y to user-blocking' },
      { pattern: 'route.transition.render', message: 'defines transition route schedule' },
      { pattern: 'component.idle.hydrate', message: 'defines idle hydration schedule' },
      { pattern: 'RMT Kernel', message: 'keeps RMT kernel boundary visible' },
      { pattern: '| `ER-WP-14` | completed |', message: 'marks ER-WP-14 completed after component fiber implementation' },
      { pattern: '| `ER-WP-15` | completed |', message: 'marks ER-WP-15 completed after route fiber implementation' }
    ]
  },
  {
    path: 'development/ER-WP-13-Lane-Mapping-auf-RMT-Schedules-definieren.md',
    label: 'ER-WP-13 RMT lane mapping workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-13.rmt-lane-mapping.v1', message: 'declares ER-WP-13 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-13 completed' },
      { pattern: 'fabric/rmt-lane-mapping.js', message: 'documents Fabric RMT lane mapping entry' },
      { pattern: 'tests/fabric/fabric_rmt_lane_mapping_suite.js', message: 'documents Fabric RMT lane mapping suite' },
      { pattern: 'docs/xtend-fabric-rmt-lane-mapping.md', message: 'links lane mapping docs' },
      { pattern: 'xtend.fabric.rmt-lane-mapping.v1', message: 'documents mapping contract' },
      { pattern: 'xtend.fabric.rmt-lane-schedule.v1', message: 'documents schedule wrapper contract' },
      { pattern: 'a11y` | `user-blocking', message: 'documents a11y mapping' },
      { pattern: '| `ER-WP-14` | completed |', message: 'marks ER-WP-14 completed after component fiber implementation' },
      { pattern: '| `ER-WP-15` | completed |', message: 'marks ER-WP-15 completed after route fiber implementation' },
      { pattern: '`ER-WP-13` ist abgeschlossen', message: 'closes ER-WP-13 explicitly' }
    ]
  },
  {
    path: 'fabric/rmt-lane-mapping.js',
    label: 'XTend-Fabric RMT lane mapping module',
    contracts: [
      { pattern: 'xtend.fabric.rmt-lane-mapping.v1', message: 'declares mapping contract' },
      { pattern: 'xtend.fabric.rmt-lane-schedule.v1', message: 'declares schedule wrapper contract' },
      { pattern: 'xtend.rmt.schedules-domain.v1', message: 'references RMT schedules domain' },
      { pattern: 'window.XTendFabricRmtLaneMapping', message: 'exposes browser namespace' },
      { pattern: 'createFabricRmtLaneMapping', message: 'exports mapping factory' },
      { pattern: 'createRmtScheduleRecords', message: 'exports schedule record factory' },
      { pattern: 'resolveRmtScheduleForFiber', message: 'exports fiber resolver' },
      { pattern: 'normalizeFabricLaneForRmt', message: 'exports lane normalizer' },
      { pattern: 'a11y.user-blocking.announce', message: 'defines a11y schedule' },
      { pattern: 'route.transition.render', message: 'defines route transition schedule' },
      { pattern: 'RMT sees schedule policy records only', message: 'keeps RMT kernel boundary visible' }
    ]
  },
  {
    path: 'tests/fabric/fabric_rmt_lane_mapping_suite.js',
    label: 'XTend-Fabric RMT lane mapping suite',
    contracts: [
      { pattern: 'XTend-Fabric RMT lane mapping', message: 'declares suite label' },
      { pattern: 'createFabricRmtLaneMapping', message: 'tests mapping factory' },
      { pattern: 'createRmtScheduleRecords', message: 'tests schedule records' },
      { pattern: 'resolveRmtScheduleForFiber', message: 'tests fiber resolver' },
      { pattern: 'A11y lane resolves to user-blocking', message: 'tests a11y mapping' },
      { pattern: 'rmt-runtime', message: 'guards against RMT runtime imports' }
    ]
  },
  {
    path: 'development/XTend-Performance-Budget-Matrix.md',
    label: 'XTend Performance Budget Matrix',
    contracts: [
      { pattern: 'xtend.performance.budget-matrix.v1', message: 'declares Performance Budget Matrix contract' },
      { pattern: 'Status: Accepted', message: 'accepts the performance budget decision' },
      { pattern: 'xtend.performance.component-profile.v1', message: 'declares component profile contract' },
      { pattern: 'xtend.performance.measurement.v1', message: 'declares performance measurement contract' },
      { pattern: 'display', message: 'documents display profile budget' },
      { pattern: 'interactive', message: 'documents interactive profile budget' },
      { pattern: 'overlay', message: 'documents overlay profile budget' },
      { pattern: 'routing', message: 'documents routing profile budget' },
      { pattern: 'form', message: 'documents form profile budget' },
      { pattern: 'media', message: 'documents media profile budget' },
      { pattern: 'stateful', message: 'documents stateful extension profile' },
      { pattern: 'feedback', message: 'documents feedback extension profile' },
      { pattern: 'theme', message: 'documents theme extension profile' },
      { pattern: 'xtend.loader.manifest', message: 'defines loader manifest mark' },
      { pattern: 'xtend.component.hydrate', message: 'defines component hydration mark' },
      { pattern: 'xtend.route.render', message: 'defines route render mark' },
      { pattern: 'pass', message: 'defines pass gate status' },
      { pattern: 'warn', message: 'defines warn gate status' },
      { pattern: 'fail', message: 'defines fail gate status' },
      { pattern: 'ER-WP-18', message: 'hands off to measurement workpackage' },
      { pattern: 'ER-WP-19', message: 'hands off to performance regression suite' }
    ]
  },
  {
    path: 'development/ER-WP-17-Performance-Budget-Matrix-fuer-Component-Profile-erstellen.md',
    label: 'ER-WP-17 Performance Budget Matrix workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-17.performance-budget-matrix.v1', message: 'declares ER-WP-17 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-17 completed' },
      { pattern: 'XTend-Performance-Budget-Matrix.md', message: 'links performance budget matrix' },
      { pattern: 'xtend.performance.budget-matrix.v1', message: 'documents budget matrix contract' },
      { pattern: 'xtend.performance.component-profile.v1', message: 'documents component profile contract' },
      { pattern: 'xtend.performance.measurement.v1', message: 'documents measurement contract' },
      { pattern: 'display', message: 'documents display profile' },
      { pattern: 'interactive', message: 'documents interactive profile' },
      { pattern: 'overlay', message: 'documents overlay profile' },
      { pattern: 'routing', message: 'documents routing profile' },
      { pattern: 'form', message: 'documents form profile' },
      { pattern: 'media', message: 'documents media profile' },
      { pattern: '| `ER-WP-18` | completed |', message: 'marks ER-WP-18 completed after performance measurements' },
      { pattern: '| `ER-WP-19` | ready |', message: 'hands off ER-WP-19 as ready' },
      { pattern: '`ER-WP-17` ist abgeschlossen', message: 'closes ER-WP-17 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Performance-Messpunkte-und-Snapshots.md',
    label: 'XTend Performance Measurements and Snapshots',
    contracts: [
      { pattern: 'xtend.performance.measurement.v1', message: 'declares performance measurement contract' },
      { pattern: 'Status: Accepted', message: 'accepts performance measurement decision' },
      { pattern: 'xtend.loader.manifest', message: 'documents loader manifest measure' },
      { pattern: 'xtend.loader.module', message: 'documents loader module measure' },
      { pattern: 'xtend.component.define', message: 'documents component define measure' },
      { pattern: 'xtend.component.hydrate', message: 'documents hydration measure' },
      { pattern: 'xtend.route.render', message: 'documents route render measure' },
      { pattern: 'xtend-loader-performance', message: 'documents loader performance event' },
      { pattern: 'performance.measurements', message: 'documents snapshot measurements' },
      { pattern: 'performance.phaseSummary', message: 'documents snapshot phase summary' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-performance-measurements --json', message: 'documents performance measurement gate' }
    ]
  },
  {
    path: 'development/ER-WP-18-Loader-und-Hydration-Messpunkte-einfuehren.md',
    label: 'ER-WP-18 Performance Measurements workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-18.performance-measurements.v1', message: 'declares ER-WP-18 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-18 completed' },
      { pattern: 'XTend-Performance-Messpunkte-und-Snapshots.md', message: 'links performance measurement contract' },
      { pattern: 'xtend.performance.measurement.v1', message: 'documents performance measurement contract' },
      { pattern: 'xtend-loader.js', message: 'documents loader changes' },
      { pattern: 'fabric/xtend-fabric.js', message: 'documents Fabric changes' },
      { pattern: 'tests/fabric/fabric_performance_measurement_suite.js', message: 'links performance measurement suite' },
      { pattern: 'npm run test:fabric-performance', message: 'documents package script' },
      { pattern: '| `ER-WP-19` | ready |', message: 'hands off ER-WP-19 as ready' },
      { pattern: '`ER-WP-18` ist abgeschlossen', message: 'closes ER-WP-18 explicitly' }
    ]
  },
  {
    path: 'tests/fabric/fabric_performance_measurement_suite.js',
    label: 'XTend-Fabric performance measurement suite',
    contracts: [
      { pattern: 'XTend-Fabric loader and hydration performance measurements', message: 'declares performance suite label' },
      { pattern: 'xtend.performance.measurement.v1', message: 'tests performance measurement contract' },
      { pattern: 'PERFORMANCE_MEASURE_PHASES', message: 'tests phase mapping' },
      { pattern: 'xtend.loader.manifest', message: 'tests loader manifest measure' },
      { pattern: 'xtend.component.hydrate', message: 'tests hydration measure' },
      { pattern: 'xtend.route.render', message: 'tests route render measure' },
      { pattern: 'phaseSummary', message: 'tests phase summary' }
    ]
  },
  {
    path: 'docs/performance-measurements.md',
    label: 'Performance measurement developer docs',
    contracts: [
      { pattern: 'Performance Measurements', message: 'declares performance docs heading' },
      { pattern: 'xtend.performance.measurement.v1', message: 'documents measurement contract' },
      { pattern: 'xtend-loader-performance', message: 'documents loader performance event' },
      { pattern: 'window.__XTendLoaderBootPromise', message: 'documents loader boot measurements' },
      { pattern: 'createTelemetrySnapshot', message: 'documents telemetry snapshot usage' },
      { pattern: 'npm run test:fabric-performance', message: 'documents package gate' },
      { pattern: 'npm run test:performance', message: 'links performance regression gate' }
    ]
  },
  {
    path: 'development/XTend-Performance-Regression-Gate.md',
    label: 'XTend Performance Regression Gate',
    contracts: [
      { pattern: 'xtend.performance.regression-gate.v1', message: 'declares Performance Regression Gate contract' },
      { pattern: 'Status: Accepted', message: 'accepts performance regression decision' },
      { pattern: 'xtend.performance.regression-baseline.v1', message: 'declares regression baseline contract' },
      { pattern: 'xtend.performance.regression-report.v1', message: 'declares regression report schema' },
      { pattern: 'xtend.performance.measurement.v1', message: 'builds on performance measurements' },
      { pattern: 'tests/performance/baselines/local-performance-baseline.json', message: 'links local baseline' },
      { pattern: 'node scripts/run_xtend_tests.js performance-regression --json', message: 'documents performance regression gate' },
      { pattern: '| `ER-WP-20` | completed |', message: 'marks ER-WP-20 completed after hydration policy implementation' },
      { pattern: '| `ER-WP-21` | completed |', message: 'marks ER-WP-21 completed' }
    ]
  },
  {
    path: 'development/ER-WP-19-Performance-Regression-Suite-anlegen.md',
    label: 'ER-WP-19 Performance Regression workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-19.performance-regression-suite.v1', message: 'declares ER-WP-19 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-19 completed' },
      { pattern: 'XTend-Performance-Regression-Gate.md', message: 'links performance regression contract' },
      { pattern: 'xtend.performance.regression-gate.v1', message: 'documents regression gate contract' },
      { pattern: 'xtend.performance.regression-report.v1', message: 'documents regression report schema' },
      { pattern: 'tests/performance/performance_regression_suite.js', message: 'links performance regression suite' },
      { pattern: 'tests/performance/baselines/local-performance-baseline.json', message: 'links deterministic baseline' },
      { pattern: 'npm run test:performance', message: 'documents package script' },
      { pattern: '| `ER-WP-20` | completed |', message: 'marks ER-WP-20 completed after hydration policy implementation' },
      { pattern: '| `ER-WP-21` | completed |', message: 'marks ER-WP-21 completed' },
      { pattern: '`ER-WP-19` ist abgeschlossen', message: 'closes ER-WP-19 explicitly' }
    ]
  },
  {
    path: 'tests/performance/performance_regression_suite.js',
    label: 'XTend Performance regression suite',
    contracts: [
      { pattern: 'XTend Performance regression gates', message: 'declares suite label' },
      { pattern: 'xtend.performance.regression-report.v1', message: 'declares report schema' },
      { pattern: 'xtend.performance.regression-gate.v1', message: 'declares gate contract' },
      { pattern: 'createTelemetrySnapshot', message: 'builds on Fabric telemetry snapshots' },
      { pattern: 'classifyRegressionStatus', message: 'tests deterministic budget classification' },
      { pattern: 'xtend.component.hydrate', message: 'keeps hydration warning fixture' }
    ]
  },
  {
    path: 'tests/performance/baselines/local-performance-baseline.json',
    label: 'XTend local performance regression baseline',
    contracts: [
      { pattern: 'xtend.performance.regression-baseline.v1', message: 'declares baseline contract' },
      { pattern: 'xtend.performance.regression-gate.v1', message: 'links gate contract' },
      { pattern: 'xtend.loader.manifest', message: 'covers manifest load' },
      { pattern: 'xtend.component.hydrate', message: 'covers hydration' },
      { pattern: 'xtend.route.render', message: 'covers route render' }
    ]
  },
  {
    path: 'tests/performance/README.md',
    label: 'XTend Performance regression test docs',
    contracts: [
      { pattern: 'xtend.performance.regression-gate.v1', message: 'documents gate contract' },
      { pattern: 'node scripts/run_xtend_tests.js performance-regression', message: 'documents runner command' },
      { pattern: 'npm run test:performance', message: 'documents package command' },
      { pattern: 'ER-WP-20', message: 'hands off hydration policy package' }
    ]
  },
  {
    path: 'docs/performance-regression.md',
    label: 'Performance Regression docs',
    contracts: [
      { pattern: 'xtend.docs.performance-regression.v1', message: 'declares docs contract' },
      { pattern: 'xtend.performance.regression-gate.v1', message: 'documents gate contract' },
      { pattern: 'xtend.performance.regression-report.v1', message: 'documents report schema' },
      { pattern: 'tests/performance/baselines/local-performance-baseline.json', message: 'links deterministic baseline' },
      { pattern: 'npm run test:performance', message: 'documents package script' },
      { pattern: './performance-measurements.md', message: 'links Performance Measurements docs' }
    ]
  },
  {
    path: 'development/XTend-Hydration-Policy-Contract.md',
    label: 'XTend Hydration Policy Contract',
    contracts: [
      { pattern: 'xtend.fabric.hydration-policy.v1', message: 'declares Hydration Policy contract' },
      { pattern: 'xtend.fabric.hydration-decision.v1', message: 'declares Hydration Decision contract' },
      { pattern: 'Status: Accepted', message: 'accepts the hydration policy decision' },
      { pattern: '`visible`', message: 'documents visible hydration policy' },
      { pattern: '`idle`', message: 'documents idle hydration policy' },
      { pattern: '`lazy`', message: 'documents lazy hydration policy' },
      { pattern: 'component.lazy.hydrate', message: 'documents lazy hydration scheduleRef' },
      { pattern: 'user-blocking', message: 'documents user-blocking guard' },
      { pattern: 'node scripts/run_xtend_tests.js hydration-policy --json', message: 'documents hydration policy gate' }
    ]
  },
  {
    path: 'development/ER-WP-20-Lazy-Idle-Visible-Hydration-Policies-haerten.md',
    label: 'ER-WP-20 Hydration Policy workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-20.hydration-policy.v1', message: 'declares ER-WP-20 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-20 completed' },
      { pattern: 'development/XTend-Hydration-Policy-Contract.md', message: 'links hydration policy contract' },
      { pattern: 'fabric/hydration-policy.js', message: 'links hydration policy runtime module' },
      { pattern: 'tests/performance/hydration_policy_suite.js', message: 'links hydration policy suite' },
      { pattern: 'docs/hydration-policies.md', message: 'links hydration policy docs' },
      { pattern: 'npm run test:hydration-policy', message: 'documents package script' },
      { pattern: '| `ER-WP-21` | completed |', message: 'marks ER-WP-21 completed' },
      { pattern: '`ER-WP-20` ist abgeschlossen', message: 'closes ER-WP-20 explicitly' }
    ]
  },
  {
    path: 'development/ER-WP-21-Performance-Doku-fuer-Komponentenautoren-schreiben.md',
    label: 'ER-WP-21 Performance authoring docs workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-21.performance-authoring-docs.v1', message: 'declares ER-WP-21 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-21 completed' },
      { pattern: 'xtend.docs.performance-authoring.v1', message: 'links Performance authoring docs contract' },
      { pattern: 'xtend.scaffold.performance-policy.v1', message: 'links Scaffold Performance policy' },
      { pattern: 'xtend.performance.component-profile.v1', message: 'links Component Performance profile contract' },
      { pattern: 'docs/performance.md', message: 'links Performance docs' },
      { pattern: 'xtend-builder/performance/component-performance-profile.js', message: 'links Performance profile module' },
      { pattern: '| `ER-WP-25` | completed |', message: 'marks screenreader follow-up completed' },
      { pattern: '| `ER-WP-26` | completed |', message: 'marks motion and contrast follow-up completed' },
      { pattern: '`ER-WP-21` ist abgeschlossen', message: 'closes ER-WP-21 explicitly' }
    ]
  },
  {
    path: 'fabric/hydration-policy.js',
    label: 'XTend-Fabric hydration policy module',
    contracts: [
      { pattern: 'xtend.fabric.hydration-policy.v1', message: 'declares hydration policy contract' },
      { pattern: 'xtend.fabric.hydration-decision.v1', message: 'declares hydration decision contract' },
      { pattern: 'visible', message: 'defines visible hydration policy' },
      { pattern: 'idle', message: 'defines idle hydration policy' },
      { pattern: 'lazy', message: 'defines lazy hydration policy' },
      { pattern: 'component.lazy.hydrate', message: 'defines lazy hydration scheduleRef' },
      { pattern: 'createHydrationPolicyController', message: 'exports hydration policy controller factory' },
      { pattern: 'createHydrationScheduleRecords', message: 'exports hydration schedule records factory' }
    ]
  },
  {
    path: 'tests/performance/hydration_policy_suite.js',
    label: 'XTend Hydration Policy suite',
    contracts: [
      { pattern: 'XTend Lazy/Idle/Visible hydration policy gates', message: 'declares hydration policy suite label' },
      { pattern: 'xtend.fabric.hydration-policy.v1', message: 'tests hydration policy contract' },
      { pattern: 'user_blocking_refused', message: 'tests user-blocking refusal diagnostic' },
      { pattern: 'backpressure_deferred', message: 'tests backpressure deferral diagnostic' },
      { pattern: 'component.lazy.hydrate', message: 'tests lazy hydration scheduleRef' },
      { pattern: 'rmt-runtime', message: 'guards against RMT runtime imports' }
    ]
  },
  {
    path: 'development/XTend-A11y-Component-Contract.md',
    label: 'XTend A11y Component Contract',
    contracts: [
      { pattern: 'xtend.a11y.component-contract.v1', message: 'declares A11y Component Contract' },
      { pattern: 'Status: Accepted', message: 'accepts the A11y decision' },
      { pattern: 'xtend.a11y.profile.v1', message: 'declares A11y profile contract' },
      { pattern: 'xtend.a11y.test-contract.v1', message: 'declares A11y test contract' },
      { pattern: 'display', message: 'documents display profile' },
      { pattern: 'interactive', message: 'documents interactive profile' },
      { pattern: 'feedback', message: 'documents feedback profile' },
      { pattern: 'overlay', message: 'documents overlay profile' },
      { pattern: 'routing', message: 'documents routing profile' },
      { pattern: 'form', message: 'documents form profile' },
      { pattern: 'media', message: 'documents media profile' },
      { pattern: 'zugaenglicher Name', message: 'requires accessible name' },
      { pattern: 'Fokusstrategie', message: 'requires focus strategy' },
      { pattern: 'Keyboard Contract', message: 'requires keyboard contract' },
      { pattern: 'ARIA-State', message: 'requires ARIA state contract' },
      { pattern: 'Screenreader', message: 'requires screenreader strategy' },
      { pattern: 'prefers-reduced-motion', message: 'requires reduced motion support' },
      { pattern: 'xtend.a11y.motion-contrast-policy.v1', message: 'links Motion and Contrast policy contract' },
      { pattern: 'xtend.a11y.motion-policy.v1', message: 'links Motion policy contract' },
      { pattern: 'xtend.a11y.contrast-policy.v1', message: 'links Contrast policy contract' },
      { pattern: 'a11y.user-blocking.preference', message: 'links A11y preference schedule' },
      { pattern: 'node scripts/run_xtend_tests.js motion-contrast', message: 'documents Motion and Contrast gate' },
      { pattern: 'a11y.announce', message: 'links A11y fiber kind' },
      { pattern: 'node scripts/run_xtend_tests.js a11y-hydration', message: 'documents A11y gate' },
      { pattern: 'ER-WP-23', message: 'hands off to scaffold A11y package' }
    ]
  },
  {
    path: 'development/ER-WP-22-A11y-Component-Contract-1-0-definieren.md',
    label: 'ER-WP-22 A11y Component Contract workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-22.a11y-component-contract.v1', message: 'declares ER-WP-22 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-22 completed' },
      { pattern: 'XTend-A11y-Component-Contract.md', message: 'links A11y Component Contract' },
      { pattern: 'xtend.a11y.component-contract.v1', message: 'documents A11y contract' },
      { pattern: 'xtend.a11y.profile.v1', message: 'documents A11y profile contract' },
      { pattern: 'xtend.a11y.test-contract.v1', message: 'documents A11y test contract' },
      { pattern: 'Rolle/Semantik', message: 'documents role/semantics dimension' },
      { pattern: 'zugaenglicher Name', message: 'documents accessible name dimension' },
      { pattern: 'Fokusstrategie', message: 'documents focus strategy dimension' },
      { pattern: 'Keyboard Contract', message: 'documents keyboard dimension' },
      { pattern: 'ARIA-State', message: 'documents ARIA dimension' },
      { pattern: 'Screenreader', message: 'documents screenreader dimension' },
      { pattern: '| `ER-WP-23` | ready |', message: 'hands off ER-WP-23 as ready' },
      { pattern: '`ER-WP-22` ist abgeschlossen', message: 'closes ER-WP-22 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Scaffold-A11y-Profile-Plan.md',
    label: 'XTend Scaffold A11y Profile Plan',
    contracts: [
      { pattern: 'xtend.scaffold.a11y-profile-plan.v1', message: 'declares scaffold A11y profile plan' },
      { pattern: 'Status: Accepted', message: 'accepts the scaffold A11y plan' },
      { pattern: 'xtend.a11y.profile.v1', message: 'links the A11y profile contract' },
      { pattern: 'xtend.a11y.screenreader-signals.v1', message: 'links the Screenreader signal contract' },
      { pattern: 'xtend.a11y.screenreader-signal.v1', message: 'links the Screenreader signal record contract' },
      { pattern: 'xtend.a11y.motion-contrast-policy.v1', message: 'links the Motion and Contrast policy contract' },
      { pattern: 'xtend.a11y.motion-policy.v1', message: 'links the Motion policy contract' },
      { pattern: 'xtend.a11y.contrast-policy.v1', message: 'links the Contrast policy contract' },
      { pattern: 'xtend.a11y.test-contract.v1', message: 'links the A11y test contract' },
      { pattern: 'xtendScaffoldA11yProfile', message: 'requires source static getter' },
      { pattern: 'A11y-Profil', message: 'requires docs section' },
      { pattern: 'Screenreader-Signale', message: 'requires Screenreader docs section' },
      { pattern: 'Motion-und-Contrast-Policy', message: 'requires Motion and Contrast docs section' },
      { pattern: 'aria-label', message: 'requires fixture accessible name' },
      { pattern: 'X<Component>A11yProfile', message: 'requires generated type contract' },
      { pattern: 'X<Component>ScreenreaderSignalContract', message: 'requires generated Screenreader type contract' },
      { pattern: 'X<Component>MotionContrastPolicy', message: 'requires generated Motion and Contrast type contract' },
      { pattern: 'a11yProfile', message: 'requires manifest key' },
      { pattern: 'screenreaderSignals', message: 'requires Screenreader manifest key' },
      { pattern: 'motionContrastPolicy', message: 'requires Motion and Contrast manifest key' },
      { pattern: 'node scripts/run_xtend_tests.js screenreader-signals', message: 'documents Screenreader signal gate' },
      { pattern: 'node scripts/run_xtend_tests.js motion-contrast', message: 'documents Motion and Contrast gate' },
      { pattern: 'ER-WP-24', message: 'hands off to browser A11y smokes' }
    ]
  },
  {
    path: 'development/ER-WP-23-Scaffold-Blueprints-um-A11y-Pflichten-erweitern.md',
    label: 'ER-WP-23 scaffold A11y workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-23.scaffold-a11y-profile.v1', message: 'declares ER-WP-23 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-23 completed' },
      { pattern: 'XTend-Scaffold-A11y-Profile-Plan.md', message: 'links scaffold A11y plan' },
      { pattern: 'xtend-builder/a11y/component-a11y-profile.js', message: 'links A11y scaffold module' },
      { pattern: 'xtend.a11y.profile.v1', message: 'documents A11y profile contract' },
      { pattern: 'xtend.a11y.test-contract.v1', message: 'documents A11y test contract' },
      { pattern: 'xtendScaffoldA11yProfile', message: 'documents source getter' },
      { pattern: 'a11yProfile', message: 'documents manifest key' },
      { pattern: '`ER-WP-24` ist nach Abschluss dieses Pakets startbereit', message: 'hands off ER-WP-24 as ready' }
    ]
  },
  {
    path: 'development/XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md',
    label: 'XTend browser-near A11y keyboard smoke plan',
    contracts: [
      { pattern: 'xtend.a11y.browser-keyboard-smoke.v1', message: 'declares browser A11y smoke contract' },
      { pattern: 'Status: Accepted', message: 'accepts the browser A11y smoke plan' },
      { pattern: 'tests/browser/fixtures/a11y-focus-keyboard-smoke.html', message: 'links browser fixture' },
      { pattern: 'window.__xtendA11yKeyboardSmokeResult', message: 'documents result key' },
      { pattern: '`x-link` + `x-router`', message: 'documents routing scope' },
      { pattern: '`x-input` + `x-form`', message: 'documents form scope' },
      { pattern: '`x-tabs`', message: 'documents tabs scope' },
      { pattern: '`x-modal`', message: 'documents overlay scope' },
      { pattern: 'node scripts/run_xtend_tests.js browser --json', message: 'documents browser gate' },
      { pattern: 'ER-WP-25', message: 'hands off to screenreader signals' },
      { pattern: 'ER-WP-26', message: 'hands off to reduced motion and contrast' }
    ]
  },
  {
    path: 'development/ER-WP-24-Browsernahe-Fokus-und-Keyboard-Smokes-ausbauen.md',
    label: 'ER-WP-24 browser-near A11y keyboard workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-24.a11y-keyboard-smokes.v1', message: 'declares ER-WP-24 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-24 completed' },
      { pattern: 'xtend.a11y.browser-keyboard-smoke.v1', message: 'documents browser A11y smoke contract' },
      { pattern: 'tests/browser/fixtures/a11y-focus-keyboard-smoke.html', message: 'links browser fixture' },
      { pattern: 'tests/browser/browser_smoke_suite.js', message: 'links browser suite' },
      { pattern: 'tests/components/accessibility_hydration_suite.js', message: 'links A11y hydration suite' },
      { pattern: 'docs/a11y-keyboard-smokes.md', message: 'links developer docs' },
      { pattern: '`ER-WP-25` | completed |', message: 'marks ER-WP-25 completed after screenreader implementation' },
      { pattern: '`ER-WP-26` | completed |', message: 'marks ER-WP-26 completed after motion and contrast implementation' }
    ]
  },
  {
    path: 'development/XTend-Screenreader-Signal-Contract.md',
    label: 'XTend Screenreader Signal Contract',
    contracts: [
      { pattern: 'xtend.a11y.screenreader-signals.v1', message: 'declares Screenreader signal contract' },
      { pattern: 'Status: Accepted', message: 'accepts the Screenreader signal decision' },
      { pattern: 'xtend.a11y.screenreader-signal.v1', message: 'declares Screenreader signal record contract' },
      { pattern: 'aria-live', message: 'documents aria-live scope' },
      { pattern: 'Statusregionen', message: 'documents status region scope' },
      { pattern: 'Errorregionen', message: 'documents error region scope' },
      { pattern: 'a11y.user-blocking.announce', message: 'maps announcements to RMT A11y schedule' },
      { pattern: 'node scripts/run_xtend_tests.js screenreader-signals --json', message: 'documents Screenreader signal gate' }
    ]
  },
  {
    path: 'development/ER-WP-25-Screenreader-Signal-Contracts-einfuehren.md',
    label: 'ER-WP-25 Screenreader signal workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-25.screenreader-signals.v1', message: 'declares ER-WP-25 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-25 completed' },
      { pattern: 'XTend-Screenreader-Signal-Contract.md', message: 'links Screenreader Signal Contract' },
      { pattern: 'a11y/screenreader-signals.js', message: 'links Screenreader signal module' },
      { pattern: 'tests/a11y/screenreader_signal_suite.js', message: 'links Screenreader signal suite' },
      { pattern: 'docs/screenreader-signals.md', message: 'links Screenreader signal docs' },
      { pattern: 'xtend.a11y.screenreader-signals.v1', message: 'documents Screenreader signal contract' },
      { pattern: '| `ER-WP-26` | completed |', message: 'marks ER-WP-26 completed after motion and contrast implementation' },
      { pattern: '`ER-WP-25` ist abgeschlossen', message: 'closes ER-WP-25 explicitly' }
    ]
  },
  {
    path: 'a11y/screenreader-signals.js',
    label: 'XTend Screenreader signal module',
    contracts: [
      { pattern: 'xtend.a11y.screenreader-signals.v1', message: 'declares Screenreader signal contract' },
      { pattern: 'xtend.a11y.screenreader-signal.v1', message: 'declares Screenreader signal record contract' },
      { pattern: 'LIVE_REGION_POLICIES', message: 'defines live-region policies' },
      { pattern: 'SCREENREADER_SIGNAL_DEFINITIONS', message: 'defines signal registry' },
      { pattern: 'createScreenreaderSignalContract', message: 'exports contract factory' },
      { pattern: 'validateScreenreaderSignalContract', message: 'exports validator' },
      { pattern: 'a11y.user-blocking.announce', message: 'maps A11y announcements to RMT schedule' }
    ]
  },
  {
    path: 'tests/a11y/screenreader_signal_suite.js',
    label: 'XTend Screenreader signal suite',
    contracts: [
      { pattern: 'Screenreader signal contract gates', message: 'declares Screenreader suite label' },
      { pattern: 'xtend.a11y.screenreader-signals.v1', message: 'tests Screenreader signal contract' },
      { pattern: 'status-announcement', message: 'tests feedback status signal' },
      { pattern: 'validation-error-summary', message: 'tests form error signal' },
      { pattern: 'dialog-context', message: 'tests overlay context signal' },
      { pattern: 'screenreaderSignals', message: 'tests scaffold manifest output' }
    ]
  },
  {
    path: 'development/XTend-Motion-und-Contrast-Policy.md',
    label: 'XTend Motion and Contrast Policy',
    contracts: [
      { pattern: 'xtend.a11y.motion-contrast-policy.v1', message: 'declares Motion and Contrast policy contract' },
      { pattern: 'Status: Accepted', message: 'accepts Motion and Contrast policy' },
      { pattern: 'xtend.a11y.motion-policy.v1', message: 'declares Motion policy contract' },
      { pattern: 'xtend.a11y.contrast-policy.v1', message: 'declares Contrast policy contract' },
      { pattern: 'xtend.a11y.motion-contrast-test.v1', message: 'declares Motion and Contrast test contract' },
      { pattern: 'prefers-reduced-motion', message: 'documents reduced motion media query' },
      { pattern: 'forced-colors', message: 'documents forced colors media query' },
      { pattern: 'High Contrast', message: 'documents High Contrast policy' },
      { pattern: 'a11y.user-blocking.preference', message: 'maps preference work to A11y schedule' },
      { pattern: 'node scripts/run_xtend_tests.js motion-contrast --json', message: 'documents Motion and Contrast gate' }
    ]
  },
  {
    path: 'development/ER-WP-26-Reduced-Motion-und-High-Contrast-Regeln-gatebar-machen.md',
    label: 'ER-WP-26 Motion and Contrast workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-26.motion-contrast-gates.v1', message: 'declares ER-WP-26 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-26 completed' },
      { pattern: 'XTend-Motion-und-Contrast-Policy.md', message: 'links Motion and Contrast policy' },
      { pattern: 'a11y/motion-contrast-policy.js', message: 'links Motion and Contrast module' },
      { pattern: 'tests/a11y/motion_contrast_suite.js', message: 'links Motion and Contrast suite' },
      { pattern: 'docs/motion-contrast.md', message: 'links Motion and Contrast docs' },
      { pattern: 'xtend.a11y.motion-contrast-policy.v1', message: 'documents Motion and Contrast contract' },
      { pattern: 'ER-WP-31', message: 'hands off to component catalog coverage' }
    ]
  },
  {
    path: 'a11y/motion-contrast-policy.js',
    label: 'XTend Motion and Contrast policy module',
    contracts: [
      { pattern: 'xtend.a11y.motion-contrast-policy.v1', message: 'declares Motion and Contrast policy contract' },
      { pattern: 'xtend.a11y.motion-policy.v1', message: 'declares Motion policy contract' },
      { pattern: 'xtend.a11y.contrast-policy.v1', message: 'declares Contrast policy contract' },
      { pattern: 'createMotionContrastPolicy', message: 'exports Motion and Contrast policy factory' },
      { pattern: 'validateMotionContrastPolicy', message: 'exports Motion and Contrast validator' },
      { pattern: 'prefers-reduced-motion', message: 'defines reduced motion media query' },
      { pattern: 'forced-colors', message: 'defines forced colors media query' },
      { pattern: 'a11y.user-blocking.preference', message: 'maps preferences to A11y schedule' }
    ]
  },
  {
    path: 'tests/a11y/motion_contrast_suite.js',
    label: 'XTend Motion and Contrast suite',
    contracts: [
      { pattern: 'Reduced Motion and High Contrast gates', message: 'declares Motion and Contrast suite label' },
      { pattern: 'MOTION_CONTRAST_POLICY_SCHEMA', message: 'tests Motion and Contrast policy contract' },
      { pattern: 'x-spinner', message: 'tests motion-sensitive component' },
      { pattern: 'forced-colors', message: 'tests forced colors CSS' },
      { pattern: 'motionContrastPolicy', message: 'tests scaffold manifest output' }
    ]
  },
  {
    path: 'development/ADR-XTend-Security-Trust-Boundaries.md',
    label: 'XTend Security Trust Boundaries ADR',
    contracts: [
      { pattern: 'xtend.security.trust-boundaries.adr.v1', message: 'declares Security Trust Boundary ADR contract' },
      { pattern: 'Status: Accepted', message: 'accepts the Security decision' },
      { pattern: 'xtend.security.loader-policy.v1', message: 'declares loader policy contract' },
      { pattern: 'xtend.security.manifest-policy.v1', message: 'declares manifest policy contract' },
      { pattern: 'xtend.security.trusted-dom-policy.v1', message: 'declares trusted DOM policy contract' },
      { pattern: 'xtend.security.event-policy.v1', message: 'declares event policy contract' },
      { pattern: 'Supply Chain', message: 'covers Supply Chain boundary' },
      { pattern: 'Trust Boundary Matrix', message: 'documents trust boundary matrix' },
      { pattern: 'Dynamic Imports', message: 'covers dynamic imports' },
      { pattern: 'RMT Templates', message: 'covers RMT templates' },
      { pattern: 'Parsedown Docs', message: 'covers Parsedown docs' },
      { pattern: 'html_fragment', message: 'covers RMT html fragments' },
      { pattern: 'innerHTML', message: 'classifies innerHTML sink' },
      { pattern: 'eval', message: 'forbids eval path' },
      { pattern: 'xtend.security.loader.refused', message: 'defines loader refusal diagnostic' },
      { pattern: 'CSP', message: 'documents CSP direction' },
      { pattern: 'ER-WP-29', message: 'hands off to Trusted DOM package' },
      { pattern: 'ER-WP-30` | completed', message: 'marks ER-WP-30 completed in Security ADR' }
    ]
  },
  {
    path: 'development/ER-WP-27-Security-ADR-fuer-Loader-Manifest-Templates-und-Events-schreiben.md',
    label: 'ER-WP-27 Security Trust Boundaries workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-27.security-trust-boundaries.v1', message: 'declares ER-WP-27 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-27 completed' },
      { pattern: 'ADR-XTend-Security-Trust-Boundaries.md', message: 'links Security ADR' },
      { pattern: 'xtend.security.trust-boundaries.adr.v1', message: 'documents Security contract' },
      { pattern: 'xtend.security.loader-policy.v1', message: 'documents loader policy contract' },
      { pattern: 'xtend.security.manifest-policy.v1', message: 'documents manifest policy contract' },
      { pattern: 'xtend.security.trusted-dom-policy.v1', message: 'documents trusted DOM policy contract' },
      { pattern: 'xtend.security.event-policy.v1', message: 'documents event policy contract' },
      { pattern: 'Dynamic Imports', message: 'documents dynamic import boundary' },
      { pattern: 'Parsedown Docs', message: 'documents Parsedown docs boundary' },
      { pattern: 'Erlaubte Sinks', message: 'documents allowed sinks' },
      { pattern: '| `ER-WP-29` | ready |', message: 'keeps historical ER-WP-29 handoff visible' },
      { pattern: '| `ER-WP-30` | completed |', message: 'marks ER-WP-30 completed after supply-chain gates' },
      { pattern: '`ER-WP-27` ist abgeschlossen', message: 'closes ER-WP-27 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Manifest-und-Dynamic-Import-Policy.md',
    label: 'XTend Manifest and Dynamic Import policy',
    contracts: [
      { pattern: 'xtend.security.loader-policy.v1', message: 'declares loader policy contract' },
      { pattern: 'xtend.security.manifest-policy.v1', message: 'declares manifest policy contract' },
      { pattern: 'xtend.security.import-policy.v1', message: 'declares import policy contract' },
      { pattern: 'xtend.security.manifest-import-gate.v1', message: 'declares manifest import gate contract' },
      { pattern: 'security/manifest-import-policy.js', message: 'links machine-readable policy module' },
      { pattern: 'scripts/verify_manifest_import_policy.js', message: 'links verify script' },
      { pattern: 'tests/security/manifest_import_policy_suite.js', message: 'links test suite' },
      { pattern: 'xtend.security.loader.refused', message: 'documents loader refusal diagnostic' },
      { pattern: 'xtend.security.manifest.invalid', message: 'documents manifest invalid diagnostic' },
      { pattern: 'xtend.security.import.refused', message: 'documents import refusal diagnostic' },
      { pattern: 'npm run test:manifest-policy', message: 'documents package gate' }
    ]
  },
  {
    path: 'development/ER-WP-28-Manifest-und-Dynamic-Import-Policy-haerten.md',
    label: 'ER-WP-28 Manifest and Dynamic Import policy workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-28.manifest-import-policy.v1', message: 'declares ER-WP-28 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-28 completed' },
      { pattern: 'XTend-Manifest-und-Dynamic-Import-Policy.md', message: 'links Manifest Import policy' },
      { pattern: 'security/manifest-import-policy.js', message: 'links machine-readable policy module' },
      { pattern: 'scripts/verify_manifest_import_policy.js', message: 'links verify script' },
      { pattern: 'tests/security/manifest_import_policy_suite.js', message: 'links suite' },
      { pattern: 'docs/manifest-import-policy.md', message: 'links developer docs' },
      { pattern: 'xtend.security.import-policy.v1', message: 'documents import policy contract' },
      { pattern: 'npm run test:manifest-policy', message: 'documents package script' },
      { pattern: '`ER-WP-28` ist abgeschlossen', message: 'closes ER-WP-28 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Trusted-DOM-und-Sanitizing-Policy.md',
    label: 'XTend Trusted DOM and Sanitizing policy',
    contracts: [
      { pattern: 'xtend.security.trusted-dom-policy.v1', message: 'declares Trusted DOM policy contract' },
      { pattern: 'xtend.security.sanitizing-boundary.v1', message: 'declares Sanitizing Boundary contract' },
      { pattern: 'xtend.security.markup-classification.v1', message: 'declares Markup Classification contract' },
      { pattern: 'xtend.security.trusted-dom-sink.v1', message: 'declares Trusted DOM Sink contract' },
      { pattern: 'RMT `html_fragment`', message: 'covers RMT html_fragment records' },
      { pattern: '`dom_descriptor`', message: 'prefers structured RMT templates' },
      { pattern: '`htmlFragment`', message: 'classifies HTML fragments' },
      { pattern: '`parsedownHtml`', message: 'classifies Parsedown HTML' },
      { pattern: '`innerHTML`', message: 'restricts innerHTML sink' },
      { pattern: '`insertAdjacentHTML`', message: 'restricts insertAdjacentHTML sink' },
      { pattern: '`template.innerHTML`', message: 'restricts template.innerHTML sink' },
      { pattern: '`eval` / `new Function`', message: 'forbids dynamic code sinks' },
      { pattern: 'xtend.security.sanitizer.missing', message: 'defines sanitizer missing diagnostic' },
      { pattern: 'security/trusted-dom-policy.js', message: 'links machine-readable policy module' },
      { pattern: 'ER-WP-40', message: 'hands off to Docs-App RMT pilot' }
    ]
  },
  {
    path: 'development/ER-WP-29-Sanitizing-und-Trusted-DOM-Policy-fuer-RMT-und-Docs-vorbereiten.md',
    label: 'ER-WP-29 Trusted DOM and Sanitizing workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-29.trusted-dom-sanitizing.v1', message: 'declares ER-WP-29 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-29 completed' },
      { pattern: 'XTend-Trusted-DOM-und-Sanitizing-Policy.md', message: 'links Trusted DOM policy' },
      { pattern: 'security/trusted-dom-policy.js', message: 'links machine-readable policy module' },
      { pattern: 'docs/trusted-dom-sanitizing.md', message: 'links developer docs' },
      { pattern: 'xtend.security.sanitizing-boundary.v1', message: 'documents Sanitizing Boundary contract' },
      { pattern: 'RMT `html_fragment`', message: 'documents RMT html_fragment boundary' },
      { pattern: 'Parsedown HTML', message: 'documents Parsedown HTML boundary' },
      { pattern: 'Reference-Gates pruefen Policy', message: 'requires reference gate coverage' },
      { pattern: '`ER-WP-29` ist abgeschlossen', message: 'closes ER-WP-29 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Supply-Chain-Gate-Plan.md',
    label: 'XTend Supply-Chain Gate Plan',
    contracts: [
      { pattern: 'xtend.security.supply-chain-gate-plan.v1', message: 'declares Supply-Chain gate plan contract' },
      { pattern: 'xtend.security.dependency-audit-gate.v1', message: 'declares dependency audit contract' },
      { pattern: 'xtend.security.license-policy.v1', message: 'declares license policy contract' },
      { pattern: 'xtend.security.vulnerability-policy.v1', message: 'declares vulnerability policy contract' },
      { pattern: 'xtend.security.release-supply-chain-gate.v1', message: 'declares release supply-chain gate contract' },
      { pattern: 'node scripts/verify_supply_chain_policy.js --json', message: 'documents offline verify gate' },
      { pattern: 'npm run test:supply-chain', message: 'documents package supply-chain gate' },
      { pattern: 'npm audit --audit-level=moderate', message: 'documents CI audit gate' },
      { pattern: 'npm sbom --json', message: 'documents CI SBOM gate' },
      { pattern: 'private: true', message: 'keeps private package boundary' },
      { pattern: 'UNLICENSED', message: 'documents current private license boundary' }
    ]
  },
  {
    path: 'development/ER-WP-30-Dependency-License-und-Vulnerability-Gates-planen.md',
    label: 'ER-WP-30 Supply-Chain workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-30.supply-chain-gates.v1', message: 'declares ER-WP-30 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-30 completed' },
      { pattern: 'XTend-Supply-Chain-Gate-Plan.md', message: 'links Supply-Chain plan' },
      { pattern: 'security/supply-chain-gate-policy.js', message: 'links machine-readable policy module' },
      { pattern: 'scripts/verify_supply_chain_policy.js', message: 'links offline verify script' },
      { pattern: 'tests/security/supply_chain_policy_suite.js', message: 'links Supply-Chain suite' },
      { pattern: 'docs/supply-chain-gates.md', message: 'links developer docs' },
      { pattern: 'npm run test:supply-chain', message: 'documents package script' },
      { pattern: '`ER-WP-30` ist abgeschlossen', message: 'closes ER-WP-30 explicitly' }
    ]
  },
  {
    path: 'security/supply-chain-gate-policy.js',
    label: 'Supply-Chain policy module',
    contracts: [
      { pattern: 'xtend.security.supply-chain-gate-plan.v1', message: 'exports Supply-Chain gate plan contract' },
      { pattern: 'xtend.security.dependency-audit-gate.v1', message: 'exports dependency audit contract' },
      { pattern: 'xtend.security.license-policy.v1', message: 'exports license policy contract' },
      { pattern: 'xtend.security.vulnerability-policy.v1', message: 'exports vulnerability policy contract' },
      { pattern: 'xtend.security.release-supply-chain-gate.v1', message: 'exports release supply-chain gate contract' },
      { pattern: 'createSupplyChainGatePlan', message: 'exports plan factory' },
      { pattern: 'classifyPackageSupplyChain', message: 'exports package classifier' },
      { pattern: 'npm audit --audit-level=moderate', message: 'plans audit gate' },
      { pattern: 'npm sbom --json', message: 'plans SBOM gate' }
    ]
  },
  {
    path: 'scripts/verify_supply_chain_policy.js',
    label: 'Supply-Chain verify script',
    contracts: [
      { pattern: 'xtend.security.supply-chain-report.v1', message: 'declares report schema' },
      { pattern: 'runSupplyChainVerification', message: 'exports verify function' },
      { pattern: 'test:supply-chain', message: 'checks package script' },
      { pattern: 'publishConfig.provenance', message: 'checks provenance' },
      { pattern: 'dependency inventory is lockfile-safe', message: 'checks dependency inventory' }
    ]
  },
  {
    path: 'tests/security/supply_chain_policy_suite.js',
    label: 'Supply-Chain policy suite',
    contracts: [
      { pattern: 'XTend Supply-Chain policy gates', message: 'declares Supply-Chain suite label' },
      { pattern: 'xtend.security.supply-chain-gate-plan.v1', message: 'tests Supply-Chain plan contract' },
      { pattern: 'xtend.security.dependency-audit-gate.v1', message: 'tests dependency audit contract' },
      { pattern: 'xtend.security.license-policy.v1', message: 'tests license policy contract' },
      { pattern: 'xtend.security.vulnerability-policy.v1', message: 'tests vulnerability policy contract' },
      { pattern: 'runSupplyChainVerification', message: 'executes offline verify script' }
    ]
  },
  {
    path: 'development/XTend-Component-Catalog-Coverage-Matrix.md',
    label: 'XTend Component Catalog Coverage Matrix',
    contracts: [
      { pattern: 'xtend.catalog.component-coverage-matrix.v1', message: 'declares coverage matrix contract' },
      { pattern: 'xtend.catalog.component-coverage-entry.v1', message: 'declares coverage entry contract' },
      { pattern: 'xtend.catalog.component-coverage-gate.v1', message: 'declares coverage gate contract' },
      { pattern: '41 | 0 | 100', message: 'documents complete source coverage' },
      { pattern: '| `docs` | 41 | 0 | 100 |', message: 'documents complete docs coverage' },
      { pattern: '`documented` | 0', message: 'documents current documented status count after WP-E12-09' },
      { pattern: '`contract-gated` | 1', message: 'documents current contract-gated status count after WP-E12-09' },
      { pattern: '`typed-contract-gated` | 1', message: 'documents current typed-contract-gated status count after WP-E12-09' },
      { pattern: '`enterprise-ready` | 39', message: 'documents current enterprise-ready status count after SurfaceManager side-panel runtime' },
      { pattern: '| `x-summary` | `display, stateful` | `enterprise-ready` |', message: 'documents x-summary enterprise-ready row' },
      { pattern: '| `x-router` | `routing` | `enterprise-ready` |', message: 'documents x-router enterprise-ready row' },
      { pattern: '| `x-utils` | `utility` | `typed-contract-gated` |', message: 'documents x-utils typed-contract-gated row' },
      { pattern: 'xtend.catalog.component-regression-priority-plan.v1', message: 'documents regression priority plan contract' },
      { pattern: 'npm run test:regression-priority', message: 'documents regression priority package gate' },
      { pattern: 'npm run test:catalog-coverage', message: 'documents package gate' },
      { pattern: 'ER-WP-32` | abgeschlossen', message: 'marks naming and docs gaps closed' },
      { pattern: 'ER-WP-33` | abgeschlossen', message: 'marks component-suite priority work completed' },
      { pattern: 'ER-WP-34` | abgeschlossen', message: 'marks public types work completed' },
      { pattern: 'ER-WP-35` | abgeschlossen', message: 'marks visual regression priority completed' }
    ]
  },
  {
    path: 'development/ER-WP-31-Component-Catalog-Coverage-Matrix-erzeugen.md',
    label: 'ER-WP-31 Component Catalog Coverage workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-31.component-catalog-coverage.v1', message: 'declares ER-WP-31 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-31 completed' },
      { pattern: 'catalog/component-catalog-coverage.js', message: 'links coverage module' },
      { pattern: 'tests/catalog/component_catalog_coverage_suite.js', message: 'links coverage suite' },
      { pattern: 'docs/component-catalog-coverage.md', message: 'links developer docs' },
      { pattern: 'npm run test:catalog-coverage', message: 'documents package gate' },
      { pattern: '| `ER-WP-32` | `next` |', message: 'hands off ER-WP-32 as next' },
      { pattern: 'Fortschreibung nach `ER-WP-32`', message: 'records post-ER-WP-32 docs closure' },
      { pattern: '`ER-WP-31` ist abgeschlossen', message: 'closes ER-WP-31 explicitly' }
    ]
  },
  {
    path: 'development/XTend-Component-Catalog-Naming-Konvention.md',
    label: 'XTend Component Catalog Naming convention',
    contracts: [
      { pattern: 'xtend.catalog.naming-convention.v1', message: 'declares naming convention contract' },
      { pattern: 'Manifest-Key', message: 'defines manifest key rule' },
      { pattern: 'Custom Element Tag', message: 'defines custom element tag rule' },
      { pattern: 'Source-Basename', message: 'defines source basename rule' },
      { pattern: 'components-xsummary', message: 'documents x-summary menu slug' },
      { pattern: '`x-utils`', message: 'documents x-utils utility exception' },
      { pattern: '`xstate`', message: 'documents xstate exception' },
      { pattern: '`x-theme`', message: 'documents canonical x-theme exception' },
      { pattern: '`ER-WP-33`', message: 'hands off component-suite follow-up' }
    ]
  },
  {
    path: 'development/ER-WP-32-Naming-und-Doku-Luecken-im-Component-Catalog-schliessen.md',
    label: 'ER-WP-32 Component Catalog naming docs workpackage',
    contracts: [
      { pattern: 'xtend.enterprise.er-wp-32.catalog-naming-docs.v1', message: 'declares ER-WP-32 contract' },
      { pattern: 'Status: `completed`', message: 'marks ER-WP-32 completed' },
      { pattern: 'XTend-Component-Catalog-Naming-Konvention.md', message: 'links naming convention' },
      { pattern: 'docs/components/xsummary.md', message: 'links x-summary docs' },
      { pattern: 'docs/components/xutils.md', message: 'links x-utils docs' },
      { pattern: '| `docs` | 28 | 0 |', message: 'documents closed docs coverage' },
      { pattern: '| `ER-WP-33` | `next` |', message: 'hands off ER-WP-33 as next' },
      { pattern: '`ER-WP-32` ist abgeschlossen', message: 'closes ER-WP-32 explicitly' }
    ]
  },
  {
    path: 'catalog/component-catalog-coverage.js',
    label: 'Component Catalog Coverage module',
    contracts: [
      { pattern: 'xtend.catalog.component-coverage-matrix.v1', message: 'exports coverage matrix contract' },
      { pattern: 'xtend.catalog.component-coverage-entry.v1', message: 'exports coverage entry contract' },
      { pattern: 'xtend.catalog.component-coverage-gate.v1', message: 'exports coverage gate contract' },
      { pattern: 'EXPECTED_PROFILES_BY_TAG', message: 'defines expected profiles by tag' },
      { pattern: 'createComponentCatalogCoverageReport', message: 'exports report factory' },
      { pattern: 'createComponentCatalogCoverageGate', message: 'exports local gate factory' },
      { pattern: 'createMarkdownMatrix', message: 'exports markdown matrix factory' },
      { pattern: 'missingByDimension', message: 'tracks missing coverage dimensions' },
      { pattern: 'ER-WP-32', message: 'routes docs naming gaps' },
      { pattern: 'ER-WP-33', message: 'routes component suite gaps' },
      { pattern: 'ER-WP-34', message: 'routes type gaps' }
    ]
  },
  {
    path: 'tests/catalog/component_catalog_coverage_suite.js',
    label: 'Component Catalog Coverage suite',
    contracts: [
      { pattern: 'XTend Component Catalog Coverage Matrix', message: 'declares suite label' },
      { pattern: 'xtend.catalog.component-coverage-matrix.v1', message: 'tests coverage matrix contract' },
      { pattern: 'x-alert', message: 'tests typed-contract-gated pilot component' },
      { pattern: 'x-router', message: 'tests typed documented routing component' },
      { pattern: 'x-utils', message: 'tests documented utility component' },
      { pattern: 'npm run test:catalog-coverage', message: 'tests package script metadata' },
      { pattern: 'XTend-Component-Catalog-Naming-Konvention.md', message: 'tests naming convention doc reference' }
    ]
  },
  {
    path: 'development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md',
    label: 'XTend visual and browser regression priority plan',
    contracts: [
      { pattern: 'xtend.catalog.component-regression-priority-plan.v1', message: 'declares regression priority plan contract' },
      { pattern: 'xtend.catalog.component-regression-priority-entry.v1', message: 'declares regression priority entry contract' },
      { pattern: 'xtend.catalog.component-regression-priority-gate.v1', message: 'declares regression priority gate contract' },
      { pattern: 'desktop-1280', message: 'documents desktop viewport' },
      { pattern: 'mobile-390', message: 'documents mobile viewport' },
      { pattern: 'P0 browser-critical regression baseline', message: 'documents P0 regression wave' },
      { pattern: 'node scripts/run_xtend_tests.js regression-priority --json', message: 'documents JSON gate' },
      { pattern: 'ER-WP-36', message: 'hands off to CI workflow' }
    ]
  },
  {
    path: 'development/ER-WP-35-Visuelle-und-browsernahe-Regression-priorisieren.md',
    label: 'ER-WP-35 visual and browser regression priority workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks ER-WP-35 completed' },
      { pattern: 'xtend.catalog.component-regression-priority-plan.v1', message: 'declares ER-WP-35 contract' },
      { pattern: 'catalog/component-regression-priority.js', message: 'links regression priority module' },
      { pattern: 'tests/catalog/component_regression_priority_suite.js', message: 'links regression priority suite' },
      { pattern: 'docs/visual-browser-regression.md', message: 'links developer docs' },
      { pattern: '| `ER-WP-36` | `completed` |', message: 'marks ER-WP-36 completed after CI implementation' },
      { pattern: '| `ER-WP-37` | `completed` |', message: 'marks ER-WP-37 completed after gate matrix implementation' },
      { pattern: '| `ER-WP-38` | `completed` |', message: 'marks ER-WP-38 completed after release checklist implementation' },
      { pattern: '| `ER-WP-39` | `completed` |', message: 'marks ER-WP-39 completed after Enterprise Adoption guide implementation' },
      { pattern: '| `ER-WP-40` | `completed` |', message: 'marks ER-WP-40 completed' }
    ]
  },
  {
    path: 'catalog/component-regression-priority.js',
    label: 'Component regression priority module',
    contracts: [
      { pattern: 'xtend.catalog.component-regression-priority-plan.v1', message: 'exports regression priority plan contract' },
      { pattern: 'PROFILE_BROWSER_SMOKES', message: 'defines profile browser smoke mapping' },
      { pattern: 'CORE_VIEWPORTS', message: 'defines core viewports' },
      { pattern: 'createComponentRegressionPriorityPlan', message: 'exports plan factory' },
      { pattern: 'createComponentRegressionPriorityGate', message: 'exports gate factory' },
      { pattern: 'ER-WP-35', message: 'documents workpackage ownership' }
    ]
  },
  {
    path: 'tests/catalog/component_regression_priority_suite.js',
    label: 'Component regression priority suite',
    contracts: [
      { pattern: 'XTend visual and browser regression priority plan', message: 'declares suite label' },
      { pattern: 'xtend.catalog.component-regression-priority-plan.v1', message: 'tests regression priority schema' },
      { pattern: 'x-router', message: 'tests routing priority' },
      { pattern: 'x-modal', message: 'tests overlay priority' },
      { pattern: 'x-utils', message: 'tests long-tail utility priority' },
      { pattern: 'test:regression-priority', message: 'tests package script metadata' }
    ]
  },
  {
    path: 'development/XTend-CI-Default-Gates-Workflow.md',
    label: 'XTend CI Default Gates workflow contract',
    contracts: [
      { pattern: 'xtend.ci.default-gates.v1', message: 'declares CI default gates contract' },
      { pattern: 'xtend.ci.gate-matrix.v1', message: 'documents CI gate matrix extension' },
      { pattern: '.github/workflows/xtend-default-gates.yml', message: 'links active workflow path' },
      { pattern: 'npm run test:report', message: 'documents report-capable default gate' },
      { pattern: 'npm run test:pr:report', message: 'documents PR fast gate command' },
      { pattern: 'npm run test:release:full:report', message: 'documents full release gate command' },
      { pattern: '.xtend-test-results/xtend-test-report.json', message: 'documents JSON report path' },
      { pattern: 'xtend-test-report-node-26', message: 'documents report artifact name' },
      { pattern: 'xtend-pr-gate-report-node-26', message: 'documents PR report artifact name' },
      { pattern: 'xtend-release-gate-report-node-26', message: 'documents release report artifact name' },
      { pattern: '26.x', message: 'documents Node version' },
      { pattern: 'ER-WP-38', message: 'documents release policy handoff completion' },
      { pattern: 'Conditional Network Gates', message: 'documents release checklist boundary' }
    ]
  },
  {
    path: 'development/ER-WP-36-CI-Workflow-fuer-Default-Gates-anlegen.md',
    label: 'ER-WP-36 CI default gates workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks ER-WP-36 completed' },
      { pattern: 'xtend.enterprise.er-wp-36.ci-default-gates.v1', message: 'declares ER-WP-36 contract' },
      { pattern: '.github/workflows/xtend-default-gates.yml', message: 'links active workflow' },
      { pattern: 'development/XTend-CI-Default-Gates-Workflow.md', message: 'links CI workflow contract' },
      { pattern: 'npm run test:report', message: 'documents CI gate command' },
      { pattern: 'xtend-test-report-node-26', message: 'documents artifact name' },
      { pattern: '| `ER-WP-37` | `completed` |', message: 'marks ER-WP-37 completed' },
      { pattern: '| `ER-WP-38` | `completed` |', message: 'marks ER-WP-38 completed' },
      { pattern: '| `ER-WP-39` | `completed` |', message: 'marks ER-WP-39 completed' },
      { pattern: '| `ER-WP-40` | `completed` |', message: 'marks ER-WP-40 completed' }
    ]
  },
  {
    path: 'development/XTend-CI-Gate-Matrix.md',
    label: 'XTend CI Gate Matrix contract',
    contracts: [
      { pattern: 'xtend.ci.gate-matrix.v1', message: 'declares CI gate matrix contract' },
      { pattern: 'xtend.ci.pr-fast-gate.v1', message: 'declares PR fast gate contract' },
      { pattern: 'xtend.ci.full-release-gate.v1', message: 'declares full release gate contract' },
      { pattern: 'xtend.ci.nightly-gate.v1', message: 'declares nightly gate contract' },
      { pattern: 'npm run test:pr:report', message: 'documents PR fast report command' },
      { pattern: '.xtend-test-results/xtend-pr-gate-report.json', message: 'documents PR report path' },
      { pattern: 'xtend-pr-gate-report-node-26', message: 'documents PR artifact name' },
      { pattern: 'npm run test:release:full:report', message: 'documents release report command' },
      { pattern: '.xtend-test-results/xtend-release-gate-report.json', message: 'documents release report path' },
      { pattern: 'xtend-release-gate-report-node-26', message: 'documents release artifact name' },
      { pattern: '| `ER-WP-38` | `completed` |', message: 'marks ER-WP-38 completed' },
      { pattern: '| `ER-WP-39` | `completed` |', message: 'marks ER-WP-39 completed' },
      { pattern: '| `ER-WP-40` | `completed` |', message: 'marks ER-WP-40 completed' }
    ]
  },
  {
    path: 'development/ER-WP-37-Schnelle-PR-Gates-und-volle-Release-Gates-trennen.md',
    label: 'ER-WP-37 CI gate matrix workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks ER-WP-37 completed' },
      { pattern: 'xtend.enterprise.er-wp-37.ci-gate-matrix.v1', message: 'declares ER-WP-37 contract' },
      { pattern: 'development/XTend-CI-Gate-Matrix.md', message: 'links CI gate matrix contract' },
      { pattern: '.github/workflows/xtend-default-gates.yml', message: 'links active workflow' },
      { pattern: 'package.json', message: 'links package metadata and scripts' },
      { pattern: 'npm run test:pr:report', message: 'documents PR fast gate command' },
      { pattern: 'npm run test:release:full:report', message: 'documents full release gate command' },
      { pattern: 'xtend-pr-gate-report-node-26', message: 'documents PR artifact name' },
      { pattern: 'xtend-release-gate-report-node-26', message: 'documents release artifact name' },
      { pattern: '| `ER-WP-38` | `completed` |', message: 'marks ER-WP-38 completed' },
      { pattern: '| `ER-WP-39` | `completed` |', message: 'marks ER-WP-39 completed' },
      { pattern: '| `ER-WP-40` | `completed` |', message: 'marks ER-WP-40 completed' }
    ]
  },
  {
    path: 'development/XTend-Release-Checklist-und-SemVer-Policy.md',
    label: 'XTend release checklist and SemVer policy',
    contracts: [
      { pattern: 'xtend.release.checklist-semver-policy.v1', message: 'declares release checklist and SemVer policy contract' },
      { pattern: 'Release-Kandidat', message: 'defines release candidate checklist' },
      { pattern: '`private: true`', message: 'keeps package publishing blocked' },
      { pattern: '0.x', message: 'documents pre-1.0 SemVer phase' },
      { pattern: '1.0.0', message: 'documents post-1.0 SemVer boundary' },
      { pattern: 'Breaking-Change-Definition', message: 'defines breaking changes' },
      { pattern: 'npm run test:release:full:report', message: 'requires full release report gate' },
      { pattern: 'npm run test:docs-rmt-pilot', message: 'requires Docs RMT pilot gate' },
      { pattern: 'npm run release:report', message: 'requires local release report' },
      { pattern: 'npm run pack:dry-run', message: 'requires pack dry run' },
      { pattern: 'npm audit --audit-level=moderate', message: 'documents conditional audit gate' },
      { pattern: 'npm sbom --json', message: 'documents conditional SBOM gate' },
      { pattern: 'xtend.releaseChecklist', message: 'documents package metadata surface' },
      { pattern: '| `ER-WP-39` | `completed` |', message: 'marks ER-WP-39 completed' },
      { pattern: '| `ER-WP-40` | `completed` |', message: 'marks ER-WP-40 completed' }
    ]
  },
  {
    path: 'development/ER-WP-38-Release-Checklist-und-SemVer-Policy-schreiben.md',
    label: 'ER-WP-38 release checklist and SemVer policy workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks ER-WP-38 completed' },
      { pattern: 'xtend.enterprise.er-wp-38.release-checklist-semver-policy.v1', message: 'declares ER-WP-38 contract' },
      { pattern: 'development/XTend-Release-Checklist-und-SemVer-Policy.md', message: 'links release checklist policy' },
      { pattern: 'package.json', message: 'links package metadata changes' },
      { pattern: 'xtend.releaseChecklist', message: 'documents release checklist metadata' },
      { pattern: '| `ER-WP-39` | `completed` |', message: 'marks ER-WP-39 completed' },
      { pattern: '| `ER-WP-40` | `completed` |', message: 'marks ER-WP-40 completed' }
    ]
  },
  {
    path: 'development/ER-WP-39-Enterprise-Adoption-Guide-schreiben.md',
    label: 'ER-WP-39 Enterprise Adoption Guide workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks ER-WP-39 completed' },
      { pattern: 'xtend.enterprise.er-wp-39.enterprise-adoption-guide.v1', message: 'declares ER-WP-39 contract' },
      { pattern: 'xtend.docs.enterprise-adoption.v1', message: 'declares Enterprise Adoption docs contract' },
      { pattern: 'docs/enterprise-adoption.md', message: 'links Enterprise Adoption guide' },
      { pattern: 'xtend.enterpriseAdoption', message: 'documents Enterprise Adoption package metadata' },
      { pattern: '| `ER-WP-40` | `completed` |', message: 'marks ER-WP-40 completed' }
    ]
  },
  {
    path: 'development/ER-WP-40-Docs-App-mit-RMT-Parsedown-Scheduling-pilotieren.md',
    label: 'ER-WP-40 Docs-App RMT Parsedown pilot workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks ER-WP-40 completed' },
      { pattern: 'xtend.enterprise.er-wp-40.docs-rmt-parsedown-pilot.v1', message: 'declares ER-WP-40 contract' },
      { pattern: 'xtend.docs.parsedown-rmt-pilot.v1', message: 'declares Docs RMT pilot contract' },
      { pattern: 'docs/xtendrmt-parsedown-docs.rmt', message: 'links Docs RMT pilot document' },
      { pattern: 'tests/rmt/docs_rmt_pilot_suite.js', message: 'links Docs RMT pilot suite' },
      { pattern: 'xtend.docsRmtPilot', message: 'documents package metadata surface' },
      { pattern: 'node scripts/run_xtend_tests.js docs-rmt-pilot --json', message: 'documents Docs RMT pilot gate' },
      { pattern: 'Enterprise-Reife-Paketlauf `ER-WP-01` bis `ER-WP-40`', message: 'declares completed enterprise run' }
    ]
  },
  {
    path: '.github/workflows/xtend-default-gates.yml',
    label: 'XTend GitHub Actions CI gate matrix workflow',
    contracts: [
      { pattern: 'XTend CI Gates', message: 'declares workflow name' },
      { pattern: 'pr-fast-gates', message: 'declares PR fast gate job' },
      { pattern: 'full-release-gates', message: 'declares full release gate job' },
      { pattern: 'actions/checkout@v6', message: 'checks out repository' },
      { pattern: 'actions/setup-node@v6', message: 'sets up Node' },
      { pattern: 'node-version: 26.x', message: 'pins Node 26.x' },
      { pattern: 'npm run test:pr:report', message: 'runs PR fast report gate' },
      { pattern: 'npm run test:release:full:report', message: 'runs full release report gate' },
      { pattern: "cron: '17 3 * * *'", message: 'declares nightly schedule' },
      { pattern: 'actions/upload-artifact@v7', message: 'uploads report artifact' },
      { pattern: '.xtend-test-results/xtend-pr-gate-report.json', message: 'uploads PR JSON report path' },
      { pattern: '.xtend-test-results/xtend-release-gate-report.json', message: 'uploads release JSON report path' },
      { pattern: 'xtend-pr-gate-report-node-26', message: 'uses stable PR artifact name' },
      { pattern: 'xtend-release-gate-report-node-26', message: 'uses stable release artifact name' }
    ]
  },
  {
    path: 'development/WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md',
    label: 'Epic 02 closure review',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-14 as completed' },
      { pattern: 'KPI-Bewertung', message: 'contains KPI assessment' },
      { pattern: 'Akzeptanzkriterien-Check', message: 'contains acceptance criteria check' },
      { pattern: 'Risikoabdeckung', message: 'contains risk coverage' },
      { pattern: 'Restrisiken und Folgepunkte', message: 'documents residual risks and follow-ups' },
      { pattern: 'Epic 02 ist abgeschlossen', message: 'closes Epic 02 explicitly' },
      { pattern: 'Epic 03', message: 'declares next Epic 03 path' },
      { pattern: 'Epic 05', message: 'keeps XTendRMT bridge follow-up visible' }
    ]
  },
  {
    path: 'development/EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md',
    label: 'Epic 02 final status',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 02 as completed' },
      { pattern: 'WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the WP-14 closure document' },
      { pattern: '`WP-14`: Epic-Abschlussreview und KPI-Abnahme ist `completed`', message: 'marks WP-14 completed in Epic state' },
      { pattern: 'Epic 02 ist abgeschlossen', message: 'declares Epic 02 closure' }
    ]
  },
  {
    path: 'development/BACKLOG-EPIC-02-XTend-Test-Suite-und-Qualitaetsbarrieren.md',
    label: 'Epic 02 backlog final status',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 02 backlog as completed' },
      { pattern: 'Keine offenen Workpackages innerhalb Epic 02.', message: 'declares no open workpackages' },
      { pattern: '| `WP-14` | P2 | completed | WS5 | Epic-Abschlussreview und KPI-Abnahme |', message: 'marks WP-14 completed in backlog table' },
      { pattern: 'WP-E02-14-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the WP-14 closure document' }
    ]
  }
];

const EPIC_03_SCAFFOLD_REFERENCE_CONTRACTS = [
  {
    path: 'development/XTend-Scaffold-Architektur-und-Tooling-Entscheidung.md',
    label: 'XTend Scaffold architecture decision',
    contracts: [
      { pattern: 'Status: Verbindliche Architekturentscheidung ab Epic 03 / WP-01', message: 'marks WP-01 architecture decision as binding' },
      { pattern: 'repo-lokales Node.js mit CommonJS-Modulen', message: 'documents Node/CommonJS tooling decision' },
      { pattern: 'Dry-Run zuerst', message: 'documents dry-run-first strategy' },
      { pattern: 'Generatoren duerfen nicht', message: 'defines generator boundaries' },
      { pattern: 'Epic 04 und Epic 05', message: 'keeps later Epic boundaries visible' }
    ]
  },
  {
    path: 'development/WP-E03-01-Scaffold-Architektur-Scope-und-Tooling-Entscheidung-festlegen.md',
    label: 'Epic 03 WP-01 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-01 as completed' },
      { pattern: 'Minimal-Tooling bleibt repo-lokales Node.js mit CommonJS', message: 'records tooling decision' },
      { pattern: '`WP-E03-02` kann', message: 'hands off to WP-E03-02' }
    ]
  },
  {
    path: 'development/WP-E03-02-Projektlayout-Modulgrenzen-und-lokale-CLI-Entry-Points-definieren.md',
    label: 'Epic 03 WP-02 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-02 as completed' },
      { pattern: 'xtend-builder/scaffold.js', message: 'documents local CLI entry point' },
      { pattern: 'xtend-builder/lib/layout.js', message: 'documents layout contract module' },
      { pattern: '`WP-E03-03` kann', message: 'hands off to WP-E03-03' }
    ]
  },
  {
    path: 'development/WP-E03-03-Komponenten-Blueprint-und-Artefaktcontract-entwerfen.md',
    label: 'Epic 03 WP-03 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-03 as completed' },
      { pattern: 'xtend.scaffold.component-blueprint.v1', message: 'documents component blueprint schema' },
      { pattern: 'Artefaktmatrix', message: 'documents artifact matrix' },
      { pattern: '`WP-E03-04` kann', message: 'hands off to WP-E03-04' }
    ]
  },
  {
    path: 'development/WP-E03-04-Generator-Grundgeruest-und-Template-Ladepfad-anlegen.md',
    label: 'Epic 03 WP-04 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-04 as completed' },
      { pattern: 'xtend.scaffold.generator-registry.v1', message: 'documents generator registry schema' },
      { pattern: 'xtend.scaffold.template-registry.v1', message: 'documents template registry schema' },
      { pattern: 'xtend.scaffold.component-plan.v1', message: 'documents component plan schema' },
      { pattern: '`WP-E03-05` kann', message: 'hands off to WP-E03-05' }
    ]
  },
  {
    path: 'development/WP-E03-05-Pflichtartefakt-Generatoren-fuer-Komponente-Doku-Tests-Fixtures-und-Types-umsetzen.md',
    label: 'Epic 03 WP-05 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-05 as completed' },
      { pattern: 'xtend.scaffold.component-files.v1', message: 'documents component files schema' },
      { pattern: 'Component-Level-Suite mit echten Assertions', message: 'requires real test assertions' },
      { pattern: '`WP-E03-06` hat', message: 'records WP-E03-06 follow-up completion' }
    ]
  },
  {
    path: 'development/WP-E03-06-Manifest-und-Hydrations-Wiring-in-den-Scaffold-Workflow-integrieren.md',
    label: 'Epic 03 WP-06 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-06 as completed' },
      { pattern: 'xtend.scaffold.manifest-wiring.v1', message: 'documents manifest wiring schema' },
      { pattern: 'xtend.scaffold.hydration-wiring.v1', message: 'documents hydration wiring schema' },
      { pattern: 'data-xtend-hydrated', message: 'documents hydration state marker' },
      { pattern: '`WP-E03-07` kann', message: 'hands off to WP-E03-07' }
    ]
  },
  {
    path: 'development/WP-E03-07-State-API-und-Feature-Wiring-Patterns-vorbereiten.md',
    label: 'Epic 03 WP-07 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-07 as completed' },
      { pattern: 'xtend.scaffold.feature-wiring.v1', message: 'documents feature wiring schema' },
      { pattern: 'xstate.subscribe(fn, keyFilter?)', message: 'documents canonical subscription path' },
      { pattern: 'derived-render-cache-only', message: 'documents local UI policy' },
      { pattern: '`WP-E03-08` kann', message: 'hands off to WP-E03-08' }
    ]
  },
  {
    path: 'development/WP-E03-08-Lokale-Developer-Workflows-und-Verifikation-standardisieren.md',
    label: 'Epic 03 WP-08 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-08 as completed' },
      { pattern: 'xtend.scaffold.developer-workflow.v1', message: 'documents developer workflow schema' },
      { pattern: 'xtend.scaffold.verify-plan.v1', message: 'documents verify plan schema' },
      { pattern: 'npm run scaffold:verify', message: 'documents scaffold verify script' },
      { pattern: '`WP-E03-09` kann', message: 'hands off to WP-E03-09' }
    ]
  },
  {
    path: 'development/WP-E03-09-Typisierungsstrategie-und-Template-RMT-Anschluss-vorbereiten.md',
    label: 'Epic 03 WP-09 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-09 as completed' },
      { pattern: 'xtend.scaffold.component-typing.v1', message: 'documents component typing schema' },
      { pattern: 'xtend.scaffold.rmt-attachment.v1', message: 'documents RMT attachment schema' },
      { pattern: 'types-only-no-runtime-imports', message: 'documents type/runtime boundary' },
      { pattern: '`WP-E03-10` kann', message: 'hands off to WP-E03-10' }
    ]
  },
  {
    path: 'development/WP-E03-10-Demo-Preview-und-Referenzpfade-an-die-Test-Suite-anbinden.md',
    label: 'Epic 03 WP-10 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-10 as completed' },
      { pattern: 'xtend.scaffold.component-preview.v1', message: 'documents component preview schema' },
      { pattern: 'docs/previews/<name>.preview.md', message: 'documents preview path pattern' },
      { pattern: 'externalNetworkAllowed: false', message: 'documents local-only preview contract' },
      { pattern: '`WP-E03-11` kann', message: 'hands off to WP-E03-11' }
    ]
  },
  {
    path: 'development/WP-E03-11-Extension-Punkte-fuer-Templating-Rendering-und-Root-Lifecycle-vorbereiten.md',
    label: 'Epic 03 WP-11 workpackage',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-11 as completed' },
      { pattern: 'xtend.scaffold.component-extension-points.v1', message: 'documents component extension schema' },
      { pattern: 'xtend.scaffold.root-lifecycle.v1', message: 'documents root lifecycle schema' },
      { pattern: 'xtendScaffoldExtensionPoints', message: 'documents source static getter' },
      { pattern: '`WP-E03-12` kann', message: 'hands off to WP-E03-12' }
    ]
  },
  {
    path: 'development/WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md',
    label: 'Epic 03 WP-12 closure review',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E03-12 as completed' },
      { pattern: 'KPI-Bewertung', message: 'contains KPI assessment' },
      { pattern: 'Akzeptanzkriterien-Check', message: 'contains acceptance criteria check' },
      { pattern: 'Risikoabdeckung', message: 'contains risk coverage' },
      { pattern: 'Restrisiken und Folgepunkte', message: 'documents residual risks and follow-ups' },
      { pattern: 'Epic 03 ist abgeschlossen', message: 'closes Epic 03 explicitly' },
      { pattern: 'Epic 04', message: 'declares next Epic 04 path' },
      { pattern: 'Epic 05', message: 'keeps XTendRMT bridge follow-up visible' }
    ]
  },
  {
    path: 'development/XTend-Scaffold-Extension-Points.md',
    label: 'XTend Scaffold extension point contract',
    contracts: [
      { pattern: 'xtend.scaffold.component-extension-points.v1', message: 'documents component extension schema' },
      { pattern: 'beforeHydrate', message: 'documents beforeHydrate hook' },
      { pattern: 'xtend.rmt.root-handshake.v1', message: 'documents root handshake contract' },
      { pattern: 'xtendrmt.component.hydrate', message: 'documents scheduler hydrate endpoint' },
      { pattern: 'xtend.template', message: 'documents template adapter' },
      { pattern: 'component.visible.mount', message: 'documents component schedule hint' },
      { pattern: 'no-template-runtime-in-scaffold', message: 'documents template runtime boundary' }
    ]
  },
  {
    path: 'xtend-builder/README.md',
    label: 'XTend Scaffold README',
    contracts: [
      { pattern: 'node xtend-builder/scaffold.js --help', message: 'documents help command' },
      { pattern: 'node xtend-builder/scaffold.js layout --json', message: 'documents JSON layout command' },
      { pattern: 'WP-E03-03', message: 'keeps blueprint follow-up visible' },
      { pattern: 'WP-E03-06', message: 'keeps wiring stage visible' },
      { pattern: 'WP-E03-07', message: 'keeps feature wiring stage visible' },
      { pattern: 'WP-E03-08', message: 'keeps workflow stage visible' },
      { pattern: 'WP-E03-09', message: 'keeps typing stage visible' },
      { pattern: 'WP-E03-10', message: 'keeps preview stage visible' },
      { pattern: 'WP-E03-11', message: 'keeps extension stage visible' },
      { pattern: 'WP-E03-12', message: 'keeps closure stage visible' },
      { pattern: 'generator-only', message: 'keeps generator-only boundary visible' }
    ]
  },
  {
    path: 'xtend-builder/blueprints/README.md',
    label: 'XTend Scaffold component blueprint README',
    contracts: [
      { pattern: 'xtend.scaffold.component-blueprint.v1', message: 'documents blueprint schema' },
      { pattern: 'Artefaktmatrix', message: 'documents artifact matrix' },
      { pattern: 'Profilmapping', message: 'documents profile mapping' },
      { pattern: 'Ausnahmeprozess', message: 'documents exception policy' }
    ]
  },
  {
    path: 'development/EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md',
    label: 'Epic 03 final state',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 03 as completed' },
      { pattern: 'WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the WP-12 closure document' },
      { pattern: '`WP-01`: Scaffold-Architektur, Scope und Tooling-Entscheidung festlegen ist `completed`', message: 'marks WP-01 completed in Epic state' },
      { pattern: '`WP-02`: Projektlayout, Modulgrenzen und lokale CLI-Entry-Points definieren ist `completed`', message: 'marks WP-02 completed in Epic state' },
      { pattern: '`WP-03`: Komponenten-Blueprint und Artefaktcontract entwerfen ist `completed`', message: 'marks WP-03 completed in Epic state' },
      { pattern: '`WP-04`: Generator-Grundgeruest und Template-Ladepfad anlegen ist `completed`', message: 'marks WP-04 completed in Epic state' },
      { pattern: '`WP-05`: Pflichtartefakt-Generatoren fuer Komponente, Doku, Tests, Fixtures und Types umsetzen ist `completed`', message: 'marks WP-05 completed in Epic state' },
      { pattern: '`WP-06`: Manifest- und Hydrations-Wiring in den Scaffold-Workflow integrieren ist `completed`', message: 'marks WP-06 completed in Epic state' },
      { pattern: '`WP-07`: State-, API- und Feature-Wiring-Patterns vorbereiten ist `completed`', message: 'marks WP-07 completed in Epic state' },
      { pattern: '`WP-08`: Lokale Developer-Workflows und Verifikation standardisieren ist `completed`', message: 'marks WP-08 completed in Epic state' },
      { pattern: '`WP-09`: Typisierungsstrategie und Template-/RMT-Anschluss vorbereiten ist `completed`', message: 'marks WP-09 completed in Epic state' },
      { pattern: '`WP-10`: Demo-/Preview- und Referenzpfade an die Test-Suite anbinden ist `completed`', message: 'marks WP-10 completed in Epic state' },
      { pattern: '`WP-11`: Extension-Punkte fuer Templating, Rendering und Root-Lifecycle vorbereiten ist `completed`', message: 'marks WP-11 completed in Epic state' },
      { pattern: '`WP-12`: Epic-Abschlussreview und KPI-Abnahme ist `completed`', message: 'marks WP-12 completed in Epic state' },
      { pattern: 'Epic 03 ist abgeschlossen', message: 'declares Epic 03 closure' },
      { pattern: 'XTend-Scaffold-Architektur-und-Tooling-Entscheidung.md', message: 'links scaffold architecture decision' }
    ]
  },
  {
    path: 'development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md',
    label: 'Epic 03 backlog final state',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 03 backlog as completed' },
      { pattern: 'Keine offenen Workpackages innerhalb Epic 03.', message: 'declares no open workpackages' },
      { pattern: '| `WP-01` | P0 | completed | WS1 | Scaffold-Architektur, Scope und Tooling-Entscheidung festlegen |', message: 'marks WP-01 completed in backlog table' },
      { pattern: '| `WP-02` | P0 | completed | WS1 | Projektlayout, Modulgrenzen und lokale CLI-Entry-Points definieren |', message: 'marks WP-02 completed in backlog table' },
      { pattern: '| `WP-03` | P0 | completed | WS2 | Komponenten-Blueprint und Artefaktcontract entwerfen |', message: 'marks WP-03 completed in backlog table' },
      { pattern: '| `WP-04` | P0 | completed | WS2 | Generator-Grundgeruest und Template-Ladepfad anlegen |', message: 'marks WP-04 completed in backlog table' },
      { pattern: '| `WP-05` | P1 | completed | WS2 | Pflichtartefakt-Generatoren fuer Komponente, Doku, Tests, Fixtures und Types umsetzen |', message: 'marks WP-05 completed in backlog table' },
      { pattern: '| `WP-06` | P1 | completed | WS3 | Manifest- und Hydrations-Wiring in den Scaffold-Workflow integrieren |', message: 'marks WP-06 completed in backlog table' },
      { pattern: '| `WP-07` | P1 | completed | WS3 | State-, API- und Feature-Wiring-Patterns vorbereiten |', message: 'marks WP-07 completed in backlog table' },
      { pattern: '| `WP-08` | P1 | completed | WS4 | Lokale Developer-Workflows und Verifikation standardisieren |', message: 'marks WP-08 completed in backlog table' },
      { pattern: '| `WP-09` | P1 | completed | WS4 | Typisierungsstrategie und Template-/RMT-Anschluss vorbereiten |', message: 'marks WP-09 completed in backlog table' },
      { pattern: '| `WP-10` | P2 | completed | WS4 | Demo-/Preview- und Referenzpfade an die Test-Suite anbinden |', message: 'marks WP-10 completed in backlog table' },
      { pattern: '| `WP-11` | P2 | completed | WS5 | Extension-Punkte fuer Templating, Rendering und Root-Lifecycle vorbereiten |', message: 'marks WP-11 completed in backlog table' },
      { pattern: '| `WP-12` | P2 | completed | WS5 | Epic-Abschlussreview und KPI-Abnahme |', message: 'marks WP-12 completed in backlog table' },
      { pattern: 'WP-E03-12-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the WP-12 closure document' },
      { pattern: 'XTend-Scaffold-Architektur-und-Tooling-Entscheidung.md', message: 'links scaffold architecture decision' }
    ]
  }
];

const EPIC_04_RMT_TEMPLATE_REFERENCE_CONTRACTS = [
  {
    path: 'development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md',
    label: 'Epic 04 RMT templating start',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 04 as completed' },
      { pattern: 'BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md', message: 'links the Epic 04 backlog' },
      { pattern: 'XTend UI', message: 'names XTend UI product role' },
      { pattern: 'UI Builder / Web Component Produkt', message: 'defines XTend UI as UI builder and Web Component product' },
      { pattern: 'XTendRMT', message: 'names XTendRMT product role' },
      { pattern: 'Scheduler und Templating Engine', message: 'defines XTendRMT as scheduler and templating engine' },
      { pattern: 'RMT ist als kanonischer XTend-Templating-Pfad festgelegt', message: 'anchors RMT as templating path' },
      { pattern: 'XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen', message: 'documents the scheduler without XTend knowledge tension' },
      { pattern: 'RMT kann XTend-Templates konstruieren und XRouter-Routen bauen', message: 'documents template and route construction through RMT' },
      { pattern: 'ohne dass XTend in RMT eingebettet ist', message: 'keeps XTend out of the RMT kernel' },
      { pattern: 'XRouter selbst bleibt Adapter-Implementierung, nicht Kernel-Wissen', message: 'keeps XRouter in the adapter layer' },
      { pattern: 'framework-agnostisch', message: 'keeps RMT framework agnostic' },
      { pattern: 'upstream', message: 'keeps upstream handoff visible' },
      { pattern: 'Epic 05', message: 'keeps productive bridge boundary visible' },
      { pattern: 'WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md', message: 'links the WP-01 document' },
      { pattern: 'WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md', message: 'links the WP-02 document' },
      { pattern: 'WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md', message: 'links the WP-03 document' },
      { pattern: 'WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md', message: 'links the WP-04 document' },
      { pattern: 'WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md', message: 'links the WP-05 document' },
      { pattern: 'WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md', message: 'links the WP-06 document' },
      { pattern: 'WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md', message: 'links the WP-07 document' },
      { pattern: 'WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md', message: 'links the WP-08 document' },
      { pattern: 'WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md', message: 'links the WP-09 document' },
      { pattern: 'WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md', message: 'links the WP-10 document' },
      { pattern: 'WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md', message: 'links the WP-11 document' },
      { pattern: 'WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the WP-12 closure document' },
      { pattern: 'XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md', message: 'links the template pilot reference document' },
      { pattern: 'XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md', message: 'links the migration guardrails document' },
      { pattern: 'XTendRMT-Upstream-Handoff-Spezifikation.md', message: 'links the upstream handoff document' },
      { pattern: '`WP-01`: Produktmodell, Scope und RMT-Templating-Zielbild festlegen ist `completed`', message: 'marks WP-01 completed in Epic state' },
      { pattern: '`WP-02`: RMT-Schema-, Demo- und DSL-Gap-Analyse erstellen ist `completed`', message: 'marks WP-02 completed in Epic state' },
      { pattern: '`WP-03`: XTend Component Contract fuer RMT-Kompatibilitaet definieren ist `completed`', message: 'marks WP-03 completed in Epic state' },
      { pattern: '`WP-04`: RMT Template Authoring Model fuer XTend UI vorbereiten ist `completed`', message: 'marks WP-04 completed in Epic state' },
      { pattern: '`WP-05`: Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots standardisieren ist `completed`', message: 'marks WP-05 completed in Epic state' },
      { pattern: '`WP-06`: XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben ist `completed`', message: 'marks WP-06 completed in Epic state' },
      { pattern: '`WP-07`: Scaffold-, Typing- und Extension-Contracts an RMT-Kompatibilitaet anbinden ist `completed`', message: 'marks WP-07 completed in Epic state' },
      { pattern: '`WP-08`: Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern ist `completed`', message: 'marks WP-08 completed in Epic state' },
      { pattern: '`WP-09`: Pilot-Flow fuer RMT-basiertes XTend-Templating vorbereiten ist `completed`', message: 'marks WP-09 completed in Epic state' },
      { pattern: '`WP-10`: Migrations- und Framework-Agnostik-Leitplanken dokumentieren ist `completed`', message: 'marks WP-10 completed in Epic state' },
      { pattern: '`WP-11`: Upstream-Handoff-Spezifikation fuer XTendRMT DSL und Bridge vorbereiten ist `completed`', message: 'marks WP-11 completed in Epic state' },
      { pattern: '`WP-12`: Epic-Abschlussreview und KPI-Abnahme ist `completed`', message: 'marks WP-12 completed in Epic state' },
      { pattern: 'xtend.scaffold.rmt-compatibility-binding.v1', message: 'documents the scaffold RMT compatibility binding schema' },
      { pattern: 'xtend.rmt.template-pilot-flow.v1', message: 'documents the RMT template pilot flow schema' },
      { pattern: 'xtend.rmt.upstream-handoff.v1', message: 'documents the upstream handoff schema' },
      { pattern: 'demo.templating.pilot', message: 'documents the RMT template pilot record' },
      { pattern: 'Opt-in-Migration', message: 'documents RMT opt-in migration guardrail' },
      { pattern: 'Parallelbetrieb', message: 'documents multi-host parallel operation' },
      { pattern: 'rmt-compatibility', message: 'documents the dedicated RMT compatibility gate' },
      { pattern: 'Epic 04 ist abgeschlossen', message: 'declares Epic 04 closure' }
    ]
  },
  {
    path: 'development/BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md',
    label: 'Epic 04 backlog final state',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 04 backlog as completed' },
      { pattern: 'Keine offenen Workpackages innerhalb Epic 04.', message: 'declares no open workpackages' },
      { pattern: 'XTend UI ist das UI Builder / Web Component Produkt', message: 'records XTend UI product model' },
      { pattern: 'XTendRMT ist Scheduler und Templating Engine', message: 'records XTendRMT product model' },
      { pattern: 'XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen', message: 'records scheduler without XTend knowledge tension' },
      { pattern: 'RMT kann XTend-Templates konstruieren und XRouter-Routen bauen', message: 'records RMT construction capability' },
      { pattern: 'Die Loesung liegt in neutralen RMT-Records plus XTend Host Adapter', message: 'keeps the adapter-based solution visible' },
      { pattern: 'Kernel-Wissen, DSL-Record und Host-Adapter-Ausfuehrung', message: 'requires gap analysis to split kernel, DSL and adapter responsibilities' },
      { pattern: 'framework-agnostisch', message: 'preserves framework agnosticism' },
      { pattern: 'WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md', message: 'links the WP-01 document' },
      { pattern: 'WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md', message: 'links the WP-02 document' },
      { pattern: 'WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md', message: 'links the WP-03 document' },
      { pattern: 'WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md', message: 'links the WP-04 document' },
      { pattern: 'WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md', message: 'links the WP-05 document' },
      { pattern: 'WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md', message: 'links the WP-06 document' },
      { pattern: 'WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md', message: 'links the WP-07 document' },
      { pattern: 'WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md', message: 'links the WP-08 document' },
      { pattern: 'WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md', message: 'links the WP-09 document' },
      { pattern: 'WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md', message: 'links the WP-10 document' },
      { pattern: 'WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md', message: 'links the WP-11 document' },
      { pattern: 'WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the WP-12 closure document' },
      { pattern: 'XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md', message: 'links the template pilot reference document' },
      { pattern: 'XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md', message: 'links the migration guardrails document' },
      { pattern: 'XTendRMT-Upstream-Handoff-Spezifikation.md', message: 'links the upstream handoff document' },
      { pattern: '| `WP-01` | P0 | completed | WS1 | Produktmodell, Scope und RMT-Templating-Zielbild festlegen |', message: 'marks WP-01 completed in backlog table' },
      { pattern: '| `WP-02` | P0 | completed | WS1 | RMT-Schema-, Demo- und DSL-Gap-Analyse erstellen |', message: 'marks WP-02 completed in backlog table' },
      { pattern: '| `WP-03` | P0 | completed | WS2 | XTend Component Contract fuer RMT-Kompatibilitaet definieren |', message: 'marks WP-03 completed in backlog table' },
      { pattern: '| `WP-04` | P0 | completed | WS2 | RMT Template Authoring Model fuer XTend UI vorbereiten |', message: 'marks WP-04 completed in backlog table' },
      { pattern: '| `WP-05` | P1 | completed | WS3 | Root-Lifecycle- und Scheduler-Handshakes fuer XTend Roots standardisieren |', message: 'marks WP-05 completed in backlog table' },
      { pattern: '| `WP-06` | P1 | completed | WS3 | XTend Host Capabilities fuer Manifest, State, Theme, API und Hydration beschreiben |', message: 'marks WP-06 completed in backlog table' },
      { pattern: '| `WP-07` | P1 | completed | WS4 | Scaffold-, Typing- und Extension-Contracts an RMT-Kompatibilitaet anbinden |', message: 'marks WP-07 completed in backlog table' },
      { pattern: '| `WP-08` | P1 | completed | WS4 | Test- und Referenzgates fuer RMT-kompatible XTend-Artefakte erweitern |', message: 'marks WP-08 completed in backlog table' },
      { pattern: '| `WP-09` | P2 | completed | WS5 | Pilot-Flow fuer RMT-basiertes XTend-Templating vorbereiten |', message: 'marks WP-09 completed in backlog table' },
      { pattern: '| `WP-10` | P2 | completed | WS5 | Migrations- und Framework-Agnostik-Leitplanken dokumentieren |', message: 'marks WP-10 completed in backlog table' },
      { pattern: '| `WP-11` | P2 | completed | WS5 | Upstream-Handoff-Spezifikation fuer XTendRMT DSL und Bridge vorbereiten |', message: 'marks WP-11 completed in backlog table' },
      { pattern: '| `WP-12` | P2 | completed | WS5 | Epic-Abschlussreview und KPI-Abnahme |', message: 'marks WP-12 completed in backlog table' },
      { pattern: 'xtend.scaffold.rmt-compatibility-binding.v1', message: 'documents the scaffold RMT compatibility binding schema' },
      { pattern: 'xtend.rmt.template-pilot-flow.v1', message: 'documents the template pilot flow schema' },
      { pattern: 'xtend.rmt.upstream-handoff.v1', message: 'documents the upstream handoff schema' },
      { pattern: 'demo.templating.pilot', message: 'documents the pilot template record' },
      { pattern: 'Opt-in-Migration', message: 'documents opt-in migration guardrail' },
      { pattern: 'Parallelbetrieb mit anderen Hosts ist explizit geschuetzt', message: 'documents multi-host protection acceptance criterion' },
      { pattern: 'tests/rmt/rmt_compatibility_suite.js', message: 'links the RMT compatibility suite' },
      { pattern: 'produktive XTendRMT Bridge', message: 'keeps bridge work out of scope' },
      { pattern: 'Epic 05', message: 'links the bridge follow-up Epic' },
      { pattern: 'Epic 04 ist abgeschlossen', message: 'declares Epic 04 closure' }
    ]
  },
  {
    path: 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md',
    label: 'Epic 04 reference registry',
    contracts: [
      { pattern: 'EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md', message: 'registers the Epic 04 plan' },
      { pattern: 'BACKLOG-EPIC-04-XTendRMT-DSL-Templating-und-Kompatibilitaetsvorbereitung.md', message: 'registers the Epic 04 backlog' },
      { pattern: 'WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md', message: 'registers the WP-01 product model document' },
      { pattern: 'WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md', message: 'registers the WP-02 gap analysis document' },
      { pattern: 'WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md', message: 'registers the WP-03 component contract document' },
      { pattern: 'WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md', message: 'registers the WP-04 template authoring document' },
      { pattern: 'WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md', message: 'registers the WP-05 root handshake document' },
      { pattern: 'WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md', message: 'registers the WP-06 host capabilities document' },
      { pattern: 'WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md', message: 'registers the WP-07 scaffold RMT compatibility document' },
      { pattern: 'WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md', message: 'registers the WP-08 RMT compatibility gate document' },
      { pattern: 'WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md', message: 'registers the WP-09 RMT template pilot document' },
      { pattern: 'WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md', message: 'registers the WP-10 migration guardrails document' },
      { pattern: 'WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md', message: 'registers the WP-11 upstream handoff document' },
      { pattern: 'WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'registers the WP-12 closure document' },
      { pattern: 'XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md', message: 'registers the RMT template pilot reference document' },
      { pattern: 'XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md', message: 'registers the RMT migration guardrails reference document' },
      { pattern: 'XTendRMT-Upstream-Handoff-Spezifikation.md', message: 'registers the upstream handoff reference document' },
      { pattern: 'xtend.scaffold.rmt-compatibility-binding.v1', message: 'documents scaffold RMT compatibility binding schema' },
      { pattern: 'xtend.rmt.template-pilot-flow.v1', message: 'documents RMT template pilot flow schema' },
      { pattern: 'xtend.rmt.upstream-handoff.v1', message: 'documents RMT upstream handoff schema' },
      { pattern: 'RMT-Templating-Opt-in-Migration', message: 'documents core migration guide RMT opt-in reference' },
      { pattern: 'rmt-compatibility', message: 'documents dedicated RMT compatibility gate' },
      { pattern: 'XTendRMT Upstream-Handoff', message: 'documents upstream handoff reference section' },
      { pattern: 'Epic-04-Abschlussreview', message: 'documents Epic 04 closure reference section' },
      { pattern: 'RMT-Kompatibilitaetsvorbereitung', message: 'documents Epic 04 reference purpose' }
    ]
  },
  {
    path: 'development/WP-E04-01-Produktmodell-Scope-und-RMT-Templating-Zielbild-festlegen.md',
    label: 'Epic 04 WP-01 product model',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-01 as completed' },
      { pattern: 'Produktentscheidung', message: 'contains product decision' },
      { pattern: 'XTend UI', message: 'names XTend UI product role' },
      { pattern: 'XTendRMT', message: 'names XTendRMT product role' },
      { pattern: 'RMT ist damit der kanonische Template-Pfad fuer XTend', message: 'anchors RMT as canonical template path' },
      { pattern: 'Kernspannungsfeld', message: 'documents the central architecture tension' },
      { pattern: 'XTendRMT weiss nichts von XTend, kann XTend-Arbeit aber schedulen', message: 'keeps scheduler without XTend knowledge visible' },
      { pattern: 'RMT kann XTend-Templates konstruieren und XRouter-Routen bauen', message: 'keeps RMT construction capability visible' },
      { pattern: 'Scope-Entscheidung', message: 'contains scope decision' },
      { pattern: 'Templating-Zielbild', message: 'contains templating target model' },
      { pattern: '`WP-E04-02` kann', message: 'hands off to WP-E04-02' }
    ]
  },
  {
    path: 'development/WP-E04-02-RMT-Schema-Demo-und-DSL-Gap-Analyse-erstellen.md',
    label: 'Epic 04 WP-02 RMT DSL gap analysis',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-02 as completed' },
      { pattern: 'Analysierte Artefakte', message: 'contains analyzed artifacts' },
      { pattern: 'Messbarer Iststand', message: 'contains measured current state' },
      { pattern: 'Gap-Matrix', message: 'contains gap matrix' },
      { pattern: 'Kernel-Wissen', message: 'splits kernel responsibility' },
      { pattern: 'Fehlender DSL-Record', message: 'splits DSL record responsibility' },
      { pattern: 'Host-Adapter-Ausfuehrung', message: 'splits host adapter responsibility' },
      { pattern: '`manifest.metadata` bleibt fuer Demo und Regression akzeptiert', message: 'marks metadata as accepted fallback only' },
      { pattern: 'native Top-Level `adapters`, `components`, `routes` und robuste `schedules` im RMT Schema', message: 'hands native domains to Epic 05' },
      { pattern: '`WP-E04-03` kann', message: 'hands off to WP-E04-03' }
    ]
  },
  {
    path: 'development/WP-E04-03-XTend-Component-Contract-fuer-RMT-Kompatibilitaet-definieren.md',
    label: 'Epic 04 WP-03 XTend component contract',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-03 as completed' },
      { pattern: 'xtend.rmt.component-contract.v1', message: 'defines the component contract version' },
      { pattern: 'Neutraler RMT Component Record', message: 'documents the neutral component record' },
      { pattern: '`adapter`', message: 'documents adapter field' },
      { pattern: '`tag`', message: 'documents tag as data field' },
      { pattern: '`attributes`', message: 'documents attributes field' },
      { pattern: '`hydration`', message: 'documents hydration field' },
      { pattern: '`diagnostics`', message: 'documents diagnostics field' },
      { pattern: 'Manifest Lookup ist Host-Adapter-Arbeit', message: 'keeps manifest lookup in host adapter' },
      { pattern: 'Verboten fuer den RMT Kernel', message: 'documents kernel prohibitions' },
      { pattern: 'ohne dass der RMT Kernel XTend-Tags', message: 'keeps XTend tags out of kernel' },
      { pattern: '`WP-E04-04` kann', message: 'hands off to WP-E04-04' }
    ]
  },
  {
    path: 'development/WP-E04-04-RMT-Template-Authoring-Model-fuer-XTend-UI-vorbereiten.md',
    label: 'Epic 04 WP-04 RMT template authoring model',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-04 as completed' },
      { pattern: 'xtend.rmt.template-authoring.v1', message: 'defines the template authoring contract version' },
      { pattern: 'RMT Template Authoring Model', message: 'documents the authoring model' },
      { pattern: '`templateRef`', message: 'documents template refs' },
      { pattern: '`componentRef`', message: 'documents component refs' },
      { pattern: '`slots`', message: 'documents slot authoring' },
      { pattern: '`events`', message: 'documents event authoring' },
      { pattern: 'dom-event-to-rmt-command', message: 'documents event command binding' },
      { pattern: 'keine neue XTend-eigene Template-Syntax', message: 'rejects a second XTend template syntax' },
      { pattern: 'Der XTend Host Adapter materialisiert', message: 'keeps materialization in host adapter' },
      { pattern: 'Upstream-Syntaxbedarf', message: 'separates upstream DSL ergonomics' },
      { pattern: '`WP-E04-05` kann', message: 'hands off to WP-E04-05' }
    ]
  },
  {
    path: 'development/WP-E04-05-Root-Lifecycle-und-Scheduler-Handshakes-fuer-XTend-Roots-standardisieren.md',
    label: 'Epic 04 WP-05 root lifecycle scheduler handshakes',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-05 as completed' },
      { pattern: 'xtend.rmt.root-handshake.v1', message: 'defines the root handshake contract version' },
      { pattern: 'Scheduler-Endpoint-Hint-Matrix', message: 'documents endpoint hint matrix' },
      { pattern: '`create`', message: 'documents create phase' },
      { pattern: '`mount`', message: 'documents mount phase' },
      { pattern: '`hydrate`', message: 'documents hydrate phase' },
      { pattern: '`activate`', message: 'documents activate phase' },
      { pattern: '`unmount`', message: 'documents unmount phase' },
      { pattern: 'xtendrmt.component.hydrate', message: 'documents component hydrate endpoint' },
      { pattern: 'RMT Scheduler', message: 'documents scheduler planner role' },
      { pattern: 'XTend Host Adapter', message: 'documents host adapter executor role' },
      { pattern: 'Digital-Twin- und SSOT-Regeln', message: 'documents Digital Twin policy' },
      { pattern: '`WP-E04-06` kann', message: 'hands off to WP-E04-06' }
    ]
  },
  {
    path: 'development/WP-E04-06-XTend-Host-Capabilities-fuer-Manifest-State-Theme-API-und-Hydration-beschreiben.md',
    label: 'Epic 04 WP-06 XTend host capabilities',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-06 as completed' },
      { pattern: 'xtend.rmt.host-capabilities.v1', message: 'defines the host capabilities contract version' },
      { pattern: 'Host-Capability-Matrix', message: 'documents the host capability matrix' },
      { pattern: '`manifest`', message: 'documents manifest capability' },
      { pattern: '`customElements`', message: 'documents custom elements capability' },
      { pattern: '`stateBridge`', message: 'documents state bridge capability' },
      { pattern: '`hydration`', message: 'documents hydration capability' },
      { pattern: '`schedulerEndpoints`', message: 'documents scheduler endpoint capability' },
      { pattern: '`theme`', message: 'documents theme capability' },
      { pattern: '`api`', message: 'documents API capability' },
      { pattern: '`router`', message: 'documents router capability' },
      { pattern: '`diagnostics`', message: 'documents diagnostics capability' },
      { pattern: 'Capability Negotiation', message: 'documents capability negotiation' },
      { pattern: 'Parallelbetrieb', message: 'documents multi-framework parallel operation' },
      { pattern: 'Der RMT Kernel darf `xstate.set` nicht direkt aufrufen', message: 'keeps xstate writes out of the kernel' },
      { pattern: '`WP-E04-07` kann', message: 'hands off to WP-E04-07' }
    ]
  },
  {
    path: 'development/WP-E04-07-Scaffold-Typing-und-Extension-Contracts-an-RMT-Kompatibilitaet-anbinden.md',
    label: 'Epic 04 WP-07 scaffold RMT compatibility binding',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-07 as completed' },
      { pattern: 'xtend.scaffold.rmt-compatibility-binding.v1', message: 'defines the scaffold RMT compatibility binding schema' },
      { pattern: 'RMT-Kompatibilitaets-Binding', message: 'documents the compatibility binding concept' },
      { pattern: 'Typing', message: 'covers typing surface' },
      { pattern: 'Manifest-Plan', message: 'covers manifest plan surface' },
      { pattern: 'Preview-Plan', message: 'covers preview plan surface' },
      { pattern: 'Extension-Punkte', message: 'covers extension point surface' },
      { pattern: 'Component-Files', message: 'covers component files surface' },
      { pattern: 'Workflow', message: 'covers workflow surface' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'declares dedicated RMT compatibility gate' },
      { pattern: 'reserved-for-Epic-05', message: 'keeps bridge runtime out of WP-07' },
      { pattern: '`WP-E04-08` kann', message: 'hands off to WP-E04-08' }
    ]
  },
  {
    path: 'development/WP-E04-08-Test-und-Referenzgates-fuer-RMT-kompatible-XTend-Artefakte-erweitern.md',
    label: 'Epic 04 WP-08 RMT compatibility gates',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-08 as completed' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility', message: 'documents dedicated runner gate' },
      { pattern: 'npm run test:rmt-compatibility', message: 'documents package script' },
      { pattern: 'tests/rmt/rmt_compatibility_suite.js', message: 'links RMT compatibility suite' },
      { pattern: 'xtend.scaffold.rmt-compatibility-binding.v1', message: 'documents compatibility binding schema' },
      { pattern: 'Scaffold Config', message: 'covers scaffold config checks' },
      { pattern: 'Typing', message: 'covers typing checks' },
      { pattern: 'Preview', message: 'covers preview checks' },
      { pattern: 'Extension-Punkte', message: 'covers extension checks' },
      { pattern: 'Component-Files', message: 'covers component files checks' },
      { pattern: 'RMT Schema', message: 'covers RMT schema checks' },
      { pattern: 'RMT Demo', message: 'covers RMT demo checks' },
      { pattern: 'reserved-for-Epic-05', message: 'keeps bridge runtime out of WP-08' },
      { pattern: '`WP-E04-09` kann', message: 'hands off to WP-E04-09' }
    ]
  },
  {
    path: 'development/WP-E04-09-Pilot-Flow-fuer-RMT-basiertes-XTend-Templating-vorbereiten.md',
    label: 'Epic 04 WP-09 RMT template pilot flow',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-09 as completed' },
      { pattern: 'xtend.rmt.template-pilot-flow.v1', message: 'defines the template pilot flow schema' },
      { pattern: 'demo.templating.pilot', message: 'documents the pilot template record' },
      { pattern: '/templating', message: 'documents the pilot route' },
      { pattern: 'xtend.template', message: 'documents the XTend template adapter' },
      { pattern: 'xtend.component', message: 'documents the XTend component attachment adapter' },
      { pattern: 'template.visible.inspect', message: 'documents the scheduler inspection hint' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents the dedicated RMT compatibility gate' },
      { pattern: 'reserved-for-Epic-05', message: 'keeps bridge runtime out of WP-09' },
      { pattern: 'framework-agnostisch', message: 'keeps the pilot framework agnostic' },
      { pattern: '`WP-E04-10` kann', message: 'hands off to WP-E04-10' }
    ]
  },
  {
    path: 'development/XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md',
    label: 'Epic 04 RMT template pilot reference',
    contracts: [
      { pattern: 'xtend.rmt.template-pilot-flow.v1', message: 'documents the pilot flow contract' },
      { pattern: 'xtend.rmt.component-contract.v1', message: 'links component contract dependency' },
      { pattern: 'xtend.rmt.template-authoring.v1', message: 'links template authoring dependency' },
      { pattern: 'xtend.rmt.root-handshake.v1', message: 'links root handshake dependency' },
      { pattern: 'xtend.rmt.host-capabilities.v1', message: 'links host capabilities dependency' },
      { pattern: 'xtend.scaffold.rmt-compatibility-binding.v1', message: 'links scaffold compatibility dependency' },
      { pattern: 'manifest.metadata.pilotFlow', message: 'documents the pilot metadata field' },
      { pattern: 'demo.templating.pilot', message: 'documents the pilot template' },
      { pattern: 'xtend.rmt.templating.pilot', message: 'documents the pilot diagnostics state key' },
      { pattern: 'reserved-for-Epic-05', message: 'keeps bridge runtime reserved' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents the compatibility gate' }
    ]
  },
  {
    path: 'development/WP-E04-10-Migrations-und-Framework-Agnostik-Leitplanken-dokumentieren.md',
    label: 'Epic 04 WP-10 migration and framework guardrails',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-10 as completed' },
      { pattern: 'XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md', message: 'links the guardrails guide' },
      { pattern: 'docs/core-migration-guide.md', message: 'links the core migration guide' },
      { pattern: 'ADR-XTendRMT-First-Class-Fusion.md', message: 'links the fusion ADR' },
      { pattern: 'XTend-Core-Compliance-Checklist.md', message: 'links the compliance checklist' },
      { pattern: 'RMT-Templating ist additiv und opt-in', message: 'documents additive opt-in migration' },
      { pattern: 'React, Vue, Vanilla JS und Custom Hosts', message: 'protects non-XTend hosts' },
      { pattern: 'reserved-for-Epic-05', message: 'keeps productive bridge reserved' },
      { pattern: 'Review-Checkliste', message: 'contains review checklist' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference gate' },
      { pattern: '`WP-E04-11` kann', message: 'hands off to WP-E04-11' }
    ]
  },
  {
    path: 'development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md',
    label: 'Epic 04 RMT migration and framework guardrails reference',
    contracts: [
      { pattern: 'Verbindlich fuer Epic 04 ab `WP-E04-10`', message: 'marks guide as WP-10 baseline' },
      { pattern: 'RMT wird als Opt-in Scheduler und Templating Engine eingefuehrt', message: 'documents opt-in RMT introduction' },
      { pattern: 'XTend UI wird First-Class Host, aber nicht Pflicht-Host', message: 'keeps XTend first-class but optional' },
      { pattern: 'Bestehende XTend-Komponenten und bestehende HTML-/JS-Integrationen bleiben gueltig', message: 'protects existing XTend usage' },
      { pattern: 'XTend-only App', message: 'covers XTend-only migration path' },
      { pattern: 'React', message: 'covers React host parallel operation' },
      { pattern: 'Vue', message: 'covers Vue host parallel operation' },
      { pattern: 'Vanilla JS', message: 'covers Vanilla host parallel operation' },
      { pattern: 'Custom Host', message: 'covers custom host parallel operation' },
      { pattern: 'Keine XTend-Sonderlogik im RMT Kernel', message: 'keeps XTend logic out of kernel' },
      { pattern: 'Keine Migration bestehender Apps ohne Opt-in', message: 'rejects forced migration' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility gate' },
      { pattern: 'Die Migrationsfrage ist fuer Epic 04 damit beantwortet', message: 'hands migration question to WP-11 as resolved' }
    ]
  },
  {
    path: 'development/WP-E04-11-Upstream-Handoff-Spezifikation-fuer-XTendRMT-DSL-und-Bridge-vorbereiten.md',
    label: 'Epic 04 WP-11 upstream handoff',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-11 as completed' },
      { pattern: 'XTendRMT-Upstream-Handoff-Spezifikation.md', message: 'links the upstream handoff specification' },
      { pattern: 'xtend.rmt.upstream-handoff.v1', message: 'documents the upstream handoff schema' },
      { pattern: 'Epic-05-Startkriterien', message: 'contains Epic 05 start criteria' },
      { pattern: '`xtendrmt/` bleiben Build-Output', message: 'keeps build artifacts as output' },
      { pattern: 'adapters`, `components`, `routes`, `schedules` und `templates', message: 'names required native domains' },
      { pattern: 'xtend.component', message: 'keeps XTend component adapter visible' },
      { pattern: 'xtend.xrouter', message: 'keeps XRouter adapter visible' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference gate' },
      { pattern: '`WP-E04-12` kann', message: 'hands off to WP-E04-12' }
    ]
  },
  {
    path: 'development/XTendRMT-Upstream-Handoff-Spezifikation.md',
    label: 'Epic 04 upstream handoff specification',
    contracts: [
      { pattern: 'Verbindlich fuer Epic 04 ab `WP-E04-11`', message: 'marks specification as WP-11 baseline' },
      { pattern: 'xtend.rmt.upstream-handoff.v1', message: 'defines the upstream handoff schema' },
      { pattern: 'Build-Artefakte in `xtendrmt/` bleiben Output', message: 'keeps build artifacts out of source-of-truth role' },
      { pattern: 'Source-of-Truth-Regel', message: 'contains source-of-truth rule' },
      { pattern: '`rmt-kernel`', message: 'names kernel module responsibility' },
      { pattern: '`rmt-dsl`', message: 'names DSL module responsibility' },
      { pattern: '`rmt-routing`', message: 'names routing module responsibility' },
      { pattern: '`rmt-components`', message: 'names component module responsibility' },
      { pattern: '`rmt-adapter-xtend`', message: 'names XTend adapter module responsibility' },
      { pattern: '`rmt-adapter-xrouter`', message: 'names XRouter adapter module responsibility' },
      { pattern: '`adapters`', message: 'documents adapters domain' },
      { pattern: '`components`', message: 'documents components domain' },
      { pattern: '`routes`', message: 'documents routes domain' },
      { pattern: '`schedules`', message: 'documents schedules domain' },
      { pattern: '`templates`', message: 'documents templates domain' },
      { pattern: 'Capability Negotiation', message: 'requires capability negotiation' },
      { pattern: 'xtend.component', message: 'documents XTend component adapter id' },
      { pattern: 'xtend.template', message: 'documents XTend template adapter id' },
      { pattern: 'xtend.xrouter', message: 'documents XRouter adapter id' },
      { pattern: 'der Kernel importiert keine XTend-, XRouter- oder `xstate`-Runtime', message: 'keeps kernel host neutral' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference gate' }
    ]
  },
  {
    path: 'development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md',
    label: 'Epic 04 WP-12 closure review',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-E04-12 as completed' },
      { pattern: 'KPI-Bewertung', message: 'contains KPI assessment' },
      { pattern: 'Akzeptanzkriterien-Check', message: 'contains acceptance criteria check' },
      { pattern: 'Risikoabdeckung', message: 'contains risk coverage' },
      { pattern: 'Restrisiken und Folgepunkte', message: 'documents residual risks and follow-ups' },
      { pattern: 'Epic 04 ist abgeschlossen', message: 'closes Epic 04 explicitly' },
      { pattern: '12` von `12` Epic-04-Workpackages sind abgeschlossen', message: 'measures completed workpackages' },
      { pattern: '7` relevante Epic-04-Contract-Schemas', message: 'measures Epic 04 contract schemas' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference gate' },
      { pattern: 'npm test', message: 'documents final npm test gate' },
      { pattern: '/private/tmp/xtend-e04-final-report.json', message: 'documents final JSON report path' },
      { pattern: 'Epic 05', message: 'declares next Epic 05 path' }
    ]
  },
  {
    path: 'development/ADR-XTendRMT-First-Class-Fusion.md',
    label: 'Epic 04 XTendRMT fusion ADR migration guardrails',
    contracts: [
      { pattern: 'XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md', message: 'links migration guardrails from ADR' },
      { pattern: 'XTendRMT-Upstream-Handoff-Spezifikation.md', message: 'links upstream handoff from ADR' },
      { pattern: 'Phase 0 - Opt-in und Parallelbetrieb absichern', message: 'adds phase zero migration guardrails' },
      { pattern: 'RMT-Templating bleibt additiv und opt-in', message: 'documents opt-in migration in ADR' },
      { pattern: 'bestehende XTend-, React-, Vue-, Vanilla-JS- und Custom-Host-Anwendungen', message: 'protects mixed host apps in ADR' },
      { pattern: 'reserved-for-Epic-05', message: 'keeps bridge runtime reserved in ADR' },
      { pattern: 'Migrations- und Framework-Agnostik-Leitplanken', message: 'contains dedicated guardrails section' },
      { pattern: 'XTend wird First-Class Host, aber nicht Pflicht-Host', message: 'keeps XTend optional in ADR' },
      { pattern: 'Upstream-Handoff ab WP-E04-11', message: 'contains upstream handoff section' },
      { pattern: 'xtend.component', message: 'keeps XTend component adapter id visible in ADR' },
      { pattern: 'xtend.xrouter', message: 'keeps XRouter adapter id visible in ADR' }
    ]
  },
  {
    path: 'development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md',
    label: 'Epic 05 upstream handoff intake',
    contracts: [
      { pattern: 'XTendRMT-Upstream-Handoff-Spezifikation.md', message: 'links upstream handoff specification' },
      { pattern: 'Epic-04-Handoff-Status', message: 'contains Epic 04 handoff intake section' },
      { pattern: 'Build-Artefakte in `xtendrmt/` bleiben Output', message: 'keeps build artifacts as output' },
      { pattern: '`adapters`, `components`, `routes`, `schedules` und `templates`', message: 'accepts required native domains' },
      { pattern: '`xtend.component`, `xtend.template` und `xtend.xrouter`', message: 'accepts stable adapter IDs' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference gate' },
      { pattern: '`E05-000`: Epic-04-Handoff-Spezifikation akzeptieren und upstream Source-of-Truth festlegen.', message: 'adds handoff intake workpackage' }
    ]
  },
  {
    path: 'development/XTend-Core-Compliance-Checklist.md',
    label: 'Epic 04 compliance checklist migration guardrails',
    contracts: [
      { pattern: 'XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md', message: 'links migration guardrails from compliance checklist' },
      { pattern: 'RMT- und Framework-Agnostik', message: 'adds RMT framework agnosticism review section' },
      { pattern: 'RMT-Templating bleibt additiv und opt-in', message: 'requires additive opt-in RMT templating' },
      { pattern: 'bestehende XTend-Apps bleiben ohne `.rmt` Opt-in stabil', message: 'protects existing XTend apps' },
      { pattern: 'React, Vue, Vanilla JS und Custom Hosts', message: 'protects mixed host apps' },
      { pattern: 'XRouter bleibt Adapter-Aufgabe', message: 'keeps XRouter out of kernel requirements' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'requires RMT compatibility gate for RMT changes' }
    ]
  }
];

const EPIC_05_BRIDGE_REFERENCE_CONTRACTS = [
  {
    path: 'development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md',
    label: 'Epic 05 bridge and native routing start',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 05 as completed' },
      { pattern: 'BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md', message: 'links the Epic 05 backlog' },
      { pattern: 'WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md', message: 'links the WP-01 source-of-truth decision' },
      { pattern: 'WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md', message: 'links the WP-02 host adapter contract' },
      { pattern: 'WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md', message: 'links the WP-03 adapter registry contract' },
      { pattern: 'WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md', message: 'links the WP-04 native adapters domain' },
      { pattern: 'WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md', message: 'links the WP-05 native components domain' },
      { pattern: 'WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md', message: 'links the WP-06 native routes domain' },
      { pattern: 'WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md', message: 'links the WP-07 native schedules policy domain' },
      { pattern: 'WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md', message: 'links the WP-08 DSL normalization contract' },
      { pattern: 'WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md', message: 'links the WP-09 runtime registry contract' },
      { pattern: 'WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md', message: 'links the WP-10 XRouter adapter contract' },
      { pattern: 'WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md', message: 'links the WP-11 XTend component adapter contract' },
      { pattern: 'WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md', message: 'links the WP-12 State/Scheduler/Diagnostics bridge contract' },
      { pattern: 'WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md', message: 'links the WP-13 artifact parity contract' },
      { pattern: 'WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md', message: 'links the WP-14 native demo migration contract' },
      { pattern: 'WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md', message: 'links the WP-15 runtime test hardening contract' },
      { pattern: 'WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md', message: 'links the WP-16 browser smoke regression contract' },
      { pattern: 'WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md', message: 'links the WP-17 authoring documentation contract' },
      { pattern: 'WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the WP-18 closure review' },
      { pattern: 'WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'links the Epic 04 closure handoff' },
      { pattern: 'XTendRMT-Upstream-Handoff-Spezifikation.md', message: 'links upstream handoff specification' },
      { pattern: 'Epic-04-Handoff-Status', message: 'contains Epic 04 handoff intake section' },
      { pattern: 'Build-Artefakte in `xtendrmt/` bleiben Output', message: 'keeps build artifacts as output' },
      { pattern: 'RMT Kernel bleibt Host-neutral', message: 'keeps kernel host-neutral' },
      { pattern: 'Routing wird native RMT Domain', message: 'defines routing as native RMT domain' },
      { pattern: 'XRouter Adapter', message: 'names XRouter adapter work' },
      { pattern: 'XTend Component Adapter', message: 'names XTend component adapter work' },
      { pattern: '`adapters`, `components`, `routes`, `schedules` und `templates`', message: 'names required native domains' },
      { pattern: '`WP-01`: Epic-04-Handoff akzeptieren und Upstream-Source-of-Truth festlegen ist `completed`', message: 'marks WP-01 completed' },
      { pattern: '`WP-02`: Host Adapter Contract und Adapter Lifecycle definieren ist `completed`', message: 'marks WP-02 completed' },
      { pattern: '`WP-03`: Adapter Registry und Capability Negotiation modellieren ist `completed`', message: 'marks WP-03 completed' },
      { pattern: '`WP-04`: Native `adapters` Domain im RMT Schema entwerfen ist `completed`', message: 'marks WP-04 completed' },
      { pattern: '`WP-05`: Native `components` Domain im RMT Schema entwerfen ist `completed`', message: 'marks WP-05 completed' },
      { pattern: '`WP-06`: Native `routes` Domain im RMT Schema entwerfen ist `completed`', message: 'marks WP-06 completed' },
      { pattern: '`WP-07`: `schedules` Domain als referenzierbare Policy haerten ist `completed`', message: 'marks WP-07 completed' },
      { pattern: '`WP-08`: DSL Normalisierung und Backward Compatibility fuer alte und neue `.rmt` Dokumente sichern ist `completed`', message: 'marks WP-08 completed' },
      { pattern: '`WP-09`: Route Registry und Component Registry im RMT Runtime-Modell vorbereiten ist `completed`', message: 'marks WP-09 completed' },
      { pattern: '`WP-10`: XRouter Adapter produktfaehig implementieren ist `completed`', message: 'marks WP-10 completed' },
      { pattern: '`WP-11`: XTend Component Adapter produktfaehig implementieren ist `completed`', message: 'marks WP-11 completed' },
      { pattern: '`WP-12`: State-, Scheduler- und Diagnostics Bridge anbinden ist `completed`', message: 'marks WP-12 completed' },
      { pattern: '`WP-13`: Build-Pipeline und Artefakt-Paritaet fuer `xtendrmt/` absichern ist `completed`', message: 'marks WP-13 completed' },
      { pattern: '`WP-14`: Bestcase-Demo auf native `routes` und `components` migrieren ist `completed`', message: 'marks WP-14 completed' },
      { pattern: '`WP-15`: Contract-, Schema- und Runtime-Tests erweitern ist `completed`', message: 'marks WP-15 completed' },
      { pattern: '`WP-16`: Browser-Smokes und Multi-Host-Regression fuer RMT/XRouter/XTend absichern ist `completed`', message: 'marks WP-16 completed' },
      { pattern: '`WP-17`: Dokumentation und Authoring-Beispiele fuer native RMT Routes und XTend Components schreiben ist `completed`', message: 'marks WP-17 completed' },
      { pattern: '`WP-18`: Epic-Abschlussreview und KPI-Abnahme ist `completed`', message: 'marks WP-18 completed' },
      { pattern: '### WP-14 Ergebnis', message: 'documents WP-14 result section' },
      { pattern: '### WP-15 Ergebnis', message: 'documents WP-15 result section' },
      { pattern: '### WP-16 Ergebnis', message: 'documents WP-16 result section' },
      { pattern: '### WP-17 Ergebnis', message: 'documents WP-17 result section' },
      { pattern: '### WP-18 Ergebnis', message: 'documents WP-18 result section' },
      { pattern: '### WP-01 Ergebnis', message: 'documents WP-01 result section' },
      { pattern: '### WP-02 Ergebnis', message: 'documents WP-02 result section' },
      { pattern: '### WP-03 Ergebnis', message: 'documents WP-03 result section' },
      { pattern: '### WP-04 Ergebnis', message: 'documents WP-04 result section' },
      { pattern: '### WP-05 Ergebnis', message: 'documents WP-05 result section' },
      { pattern: '### WP-06 Ergebnis', message: 'documents WP-06 result section' },
      { pattern: '### WP-07 Ergebnis', message: 'documents WP-07 result section' },
      { pattern: '### WP-08 Ergebnis', message: 'documents WP-08 result section' },
      { pattern: '### WP-09 Ergebnis', message: 'documents WP-09 result section' },
      { pattern: '### WP-10 Ergebnis', message: 'documents WP-10 result section' },
      { pattern: '### WP-11 Ergebnis', message: 'documents WP-11 result section' },
      { pattern: '### WP-12 Ergebnis', message: 'documents WP-12 result section' },
      { pattern: '### WP-13 Ergebnis', message: 'documents WP-13 result section' },
      { pattern: '`xtendrmt/` Build-Artefakt, Demo-Basis und Regression-Referenz', message: 'keeps xtendrmt as artifact and regression reference after WP-01' },
      { pattern: 'xtend.rmt.host-adapter-lifecycle.v1', message: 'documents host adapter lifecycle contract id' },
      { pattern: 'RmtHostAdapterRuntimeBridge', message: 'documents synchronized host adapter type surface' },
      { pattern: 'xtend.rmt.adapter-registry.v1', message: 'documents adapter registry contract id' },
      { pattern: 'RmtCapabilityNegotiationResult', message: 'documents synchronized capability negotiation type surface' },
      { pattern: 'xtend.rmt.adapters-domain.v1', message: 'documents native adapters domain contract id' },
      { pattern: 'RmtAdapterDomainRecord', message: 'documents synchronized adapters domain type surface' },
      { pattern: 'xtend.rmt.components-domain.v1', message: 'documents native components domain contract id' },
      { pattern: 'RmtComponentDomainRecord', message: 'documents synchronized components domain type surface' },
      { pattern: 'xtend.rmt.routes-domain.v1', message: 'documents native routes domain contract id' },
      { pattern: 'RmtRouteDomainRecord', message: 'documents synchronized routes domain type surface' },
      { pattern: 'xtend.rmt.schedules-domain.v1', message: 'documents native schedules domain contract id' },
      { pattern: 'RmtScheduleDomainRecord', message: 'documents synchronized schedules domain type surface' },
      { pattern: 'xtend.rmt.dsl-normalization.v1', message: 'documents DSL normalization contract id' },
      { pattern: 'RmtDslNormalizationSummary', message: 'documents synchronized DSL normalization type surface' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'documents runtime registry contract id' },
      { pattern: 'RmtRuntimeRegistrySnapshot', message: 'documents synchronized runtime registry type surface' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'documents XRouter adapter contract id' },
      { pattern: 'RmtXRouterAdapter', message: 'documents synchronized XRouter adapter type surface' },
      { pattern: 'xtend.rmt.xtend-component-adapter.v1', message: 'documents XTend component adapter contract id' },
      { pattern: 'RmtXtendComponentAdapter', message: 'documents synchronized XTend component adapter type surface' },
      { pattern: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', message: 'documents State/Scheduler/Diagnostics bridge contract id' },
      { pattern: 'RmtStateSchedulerDiagnosticsBridge', message: 'documents synchronized bridge type surface' },
      { pattern: 'xtend.rmt.artifact-parity.v1', message: 'documents artifact parity contract id' },
      { pattern: 'RmtArtifactParityContract', message: 'documents synchronized artifact parity type surface' },
      { pattern: 'scripts/verify_xtendrmt_artifact_parity.js', message: 'documents artifact parity gate script' },
      { pattern: 'xtend.rmt.wp15.native-bridge-fixture.v1', message: 'documents WP-15 native bridge fixture contract id' },
      { pattern: 'xtend.rmt.wp16.browser-smoke-fixture.v1', message: 'documents WP-16 browser smoke fixture contract id' },
      { pattern: 'xtend.rmt.native-authoring-guide.v1', message: 'documents WP-17 native authoring guide contract id' },
      { pattern: 'xtend.rmt.native-migration-guide.v1', message: 'documents WP-17 native migration guide contract id' },
      { pattern: 'xtend.rmt.epic05-closure.v1', message: 'documents WP-18 closure contract id' },
      { pattern: 'Epic 05 ist abgeschlossen', message: 'declares Epic 05 closure' },
      { pattern: 'Die operative Zerlegung liegt in `development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md`.', message: 'declares operative backlog path' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference gate' }
    ]
  },
  {
    path: 'development/BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md',
    label: 'Epic 05 backlog start state',
    contracts: [
      { pattern: 'Status: Completed', message: 'marks Epic 05 backlog as completed' },
      { pattern: 'XTendRMT Bridge und natives RMT Routing', message: 'names Epic 05 backlog scope' },
      { pattern: 'RMT Kernel bleibt host-neutral', message: 'keeps kernel host-neutral in backlog' },
      { pattern: 'XTend UI wird First-Class Host ueber Adapterqualitaet', message: 'keeps XTend first-class through adapters' },
      { pattern: 'Build-Artefakte in `xtendrmt/` bleiben Output', message: 'keeps build artifacts as output' },
      { pattern: 'Naechste startbare Workpackages', message: 'contains startable workpackage section' },
      { pattern: 'Keine offenen Workpackages innerhalb Epic 05.', message: 'declares no open Epic 05 workpackages' },
      { pattern: '`WP-01` ist abgeschlossen und akzeptiert den Epic-04-Handoff', message: 'documents WP-01 handoff acceptance' },
      { pattern: '`WP-02` ist abgeschlossen und definiert den host-neutralen Adapter Contract', message: 'documents WP-02 contract completion' },
      { pattern: '`WP-03` ist abgeschlossen und modelliert Adapter Registry', message: 'documents WP-03 registry completion' },
      { pattern: '`WP-04` ist abgeschlossen und fuehrt `adapters` als optionale native Top-Level-Domain ein', message: 'documents WP-04 adapters domain completion' },
      { pattern: '`WP-05` ist abgeschlossen und fuehrt `components` als optionale native Top-Level-Domain ein', message: 'documents WP-05 components domain completion' },
      { pattern: '`WP-06` ist abgeschlossen und fuehrt `routes` als optionale native Top-Level-Domain ein', message: 'documents WP-06 routes domain completion' },
      { pattern: '`WP-07` ist abgeschlossen und fuehrt `schedules` als optionale native Top-Level-Policy-Domain ein', message: 'documents WP-07 schedules domain completion' },
      { pattern: '`WP-08` ist abgeschlossen und sichert die DSL-Normalisierung fuer Template-only-, native App-DSL- und Legacy-Metadata-Dokumente', message: 'documents WP-08 normalization completion' },
      { pattern: '`WP-09` ist abgeschlossen und stellt Route Registry sowie Component Registry als host-neutrale Runtime-Snapshots bereit', message: 'documents WP-09 runtime registry completion' },
      { pattern: '`WP-10` ist abgeschlossen und macht XRouter als ersten produktiven Router Adapter fuer native RMT Routes nutzbar', message: 'documents WP-10 XRouter adapter completion' },
      { pattern: '`WP-11` ist abgeschlossen und macht XTend UI als ersten produktiven Component Adapter fuer native RMT Components nutzbar', message: 'documents WP-11 XTend component adapter completion' },
      { pattern: '`WP-12` ist abgeschlossen und bindet Adapter Results, Schedule Policies', message: 'documents WP-12 bridge completion' },
      { pattern: '`WP-13` ist abgeschlossen und sichert Schema, Manifest, Typen, ESM-Bundles und Browser-Bundle', message: 'documents WP-13 artifact parity completion' },
      { pattern: '`WP-15` ist abgeschlossen und erweitert die RMT-Kompatibilitaetssuite um eine native Bridge-Fixture', message: 'documents WP-15 test hardening completion' },
      { pattern: '`WP-16` ist abgeschlossen und fuegt eine browsernahe RMT/XRouter/XTend/Vanilla-Smoke-Fixture', message: 'documents WP-16 browser smoke completion' },
      { pattern: '`WP-17` ist abgeschlossen und fuehrt die Guides `docs/xtendrmt-native-authoring.md`', message: 'documents WP-17 authoring docs completion' },
      { pattern: '`WP-18` ist abgeschlossen und nimmt Epic 05 final gegen KPI', message: 'documents WP-18 closure completion' },
      { pattern: '| `WP-01` | P0 | completed | WS6 | Epic-04-Handoff akzeptieren und Upstream-Source-of-Truth festlegen |', message: 'marks WP-01 completed in backlog table' },
      { pattern: '| `WP-02` | P0 | completed | WS1 | Host Adapter Contract und Adapter Lifecycle definieren |', message: 'marks WP-02 completed in backlog table' },
      { pattern: '| `WP-03` | P0 | completed | WS1 | Adapter Registry und Capability Negotiation modellieren |', message: 'marks WP-03 completed in backlog table' },
      { pattern: '| `WP-04` | P0 | completed | WS2 | Native `adapters` Domain im RMT Schema entwerfen |', message: 'marks WP-04 adapters domain completed' },
      { pattern: '| `WP-05` | P0 | completed | WS4 | Native `components` Domain im RMT Schema entwerfen |', message: 'marks WP-05 components domain completed' },
      { pattern: '| `WP-06` | P0 | completed | WS2 | Native `routes` Domain im RMT Schema entwerfen |', message: 'marks WP-06 routes domain completed' },
      { pattern: '| `WP-07` | P1 | completed | WS5 | `schedules` Domain als referenzierbare Policy haerten |', message: 'marks WP-07 schedules work completed' },
      { pattern: '| `WP-08` | P1 | completed | WS2 | DSL Normalisierung und Backward Compatibility fuer alte und neue `.rmt` Dokumente sichern |', message: 'marks WP-08 DSL normalization completed' },
      { pattern: '| `WP-09` | P1 | completed | WS2/WS4 | Route Registry und Component Registry im RMT Runtime-Modell vorbereiten |', message: 'marks WP-09 registry work completed' },
      { pattern: '| `WP-10` | P1 | completed | WS3 | XRouter Adapter produktfaehig implementieren |', message: 'marks WP-10 XRouter adapter completed' },
      { pattern: '| `WP-11` | P1 | completed | WS4 | XTend Component Adapter produktfaehig implementieren |', message: 'marks WP-11 XTend adapter completed' },
      { pattern: '| `WP-12` | P1 | completed | WS5 | State-, Scheduler- und Diagnostics Bridge anbinden |', message: 'marks WP-12 bridge work completed' },
      { pattern: '| `WP-13` | P1 | completed | WS6 | Build-Pipeline und Artefakt-Paritaet fuer `xtendrmt/` absichern |', message: 'marks WP-13 build pipeline completed' },
      { pattern: '| `WP-14` | P2 | completed | WS7 | Bestcase-Demo auf native `routes` und `components` migrieren |', message: 'marks WP-14 demo migration completed' },
      { pattern: '| `WP-15` | P2 | completed | WS7 | Contract-, Schema- und Runtime-Tests erweitern |', message: 'marks WP-15 test hardening completed' },
      { pattern: '| `WP-16` | P2 | completed | WS7 | Browser-Smokes und Multi-Host-Regression fuer RMT/XRouter/XTend absichern |', message: 'marks WP-16 completed' },
      { pattern: '| `WP-17` | P2 | completed | WS7 | Dokumentation und Authoring-Beispiele fuer native RMT Routes und XTend Components schreiben |', message: 'marks WP-17 completed' },
      { pattern: '| `WP-18` | P2 | completed | WS7 | Epic-Abschlussreview und KPI-Abnahme |', message: 'marks WP-18 closure completed' },
      { pattern: 'WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md', message: 'declares WP-14 target document' },
      { pattern: 'WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md', message: 'declares WP-15 target document' },
      { pattern: 'WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md', message: 'declares WP-16 target document' },
      { pattern: 'WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md', message: 'declares WP-17 target document' },
      { pattern: 'WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'declares WP-18 target document' },
      { pattern: 'Workpackages im Detail', message: 'contains detailed workpackage split' },
      { pattern: 'WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md', message: 'declares WP-01 target document' },
      { pattern: 'WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md', message: 'declares WP-02 target document' },
      { pattern: 'WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md', message: 'declares WP-03 target document' },
      { pattern: 'WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md', message: 'declares WP-04 target document' },
      { pattern: 'WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md', message: 'declares WP-05 target document' },
      { pattern: 'WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md', message: 'declares WP-06 target document' },
      { pattern: 'WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md', message: 'declares WP-07 target document' },
      { pattern: 'WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md', message: 'declares WP-08 target document' },
      { pattern: 'WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md', message: 'declares WP-09 target document' },
      { pattern: 'WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md', message: 'declares WP-10 target document' },
      { pattern: 'WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md', message: 'declares WP-11 target document' },
      { pattern: 'WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md', message: 'declares WP-12 target document' },
      { pattern: 'WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md', message: 'declares WP-13 target document' },
      { pattern: 'WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md', message: 'declares WP-14 target document in details' },
      { pattern: 'WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md', message: 'declares WP-15 target document in details' },
      { pattern: 'WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md', message: 'declares WP-16 target document in details' },
      { pattern: 'WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md', message: 'declares WP-17 target document in details' },
      { pattern: 'WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'declares WP-18 target document in details' },
      { pattern: 'Definition of Done', message: 'contains Epic 05 definition of done' }
    ]
  },
  {
    path: 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md',
    label: 'Epic 05 reference registry',
    contracts: [
      { pattern: 'EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md', message: 'registers the Epic 05 plan' },
      { pattern: 'BACKLOG-EPIC-05-XTendRMT-Bridge-und-Natives-RMT-Routing.md', message: 'registers the Epic 05 backlog' },
      { pattern: 'WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md', message: 'registers the WP-01 source-of-truth decision' },
      { pattern: 'WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md', message: 'registers the WP-02 host adapter lifecycle contract' },
      { pattern: 'WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md', message: 'registers the WP-03 adapter registry contract' },
      { pattern: 'WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md', message: 'registers the WP-04 native adapters domain' },
      { pattern: 'WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md', message: 'registers the WP-05 native components domain' },
      { pattern: 'WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md', message: 'registers the WP-06 native routes domain' },
      { pattern: 'WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md', message: 'registers the WP-07 native schedules policy domain' },
      { pattern: 'WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md', message: 'registers the WP-08 DSL normalization contract' },
      { pattern: 'WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md', message: 'registers the WP-09 runtime registry contract' },
      { pattern: 'WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md', message: 'registers the WP-10 XRouter adapter contract' },
      { pattern: 'WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md', message: 'registers the WP-11 XTend component adapter contract' },
      { pattern: 'WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md', message: 'registers the WP-12 State/Scheduler/Diagnostics bridge contract' },
      { pattern: 'WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md', message: 'registers the WP-13 artifact parity contract' },
      { pattern: 'WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md', message: 'registers the WP-14 native demo migration contract' },
      { pattern: 'WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md', message: 'registers the WP-15 runtime test hardening contract' },
      { pattern: 'WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md', message: 'registers the WP-16 browser smoke regression contract' },
      { pattern: 'WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md', message: 'registers the WP-17 authoring documentation contract' },
      { pattern: 'WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md', message: 'registers the WP-18 closure review' },
      { pattern: 'docs/xtendrmt-native-authoring.md', message: 'registers the native authoring guide' },
      { pattern: 'docs/xtendrmt-migration-guide.md', message: 'registers the native migration guide' },
      { pattern: 'Epic-05-Startreferenzen', message: 'documents Epic 05 start references section' },
      { pattern: 'Produktive XTendRMT Bridge', message: 'documents productive bridge scope' },
      { pattern: 'native RMT Routing-Domain', message: 'documents native routing scope' },
      { pattern: 'XTend Component Adapter', message: 'documents XTend component adapter scope' },
      { pattern: 'XRouter Adapter', message: 'documents XRouter adapter scope' },
      { pattern: 'xtend.rmt.schedules-domain.v1', message: 'documents native schedules policy domain' },
      { pattern: 'xtend.rmt.dsl-normalization.v1', message: 'documents DSL normalization contract' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'documents runtime registry contract' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'documents XRouter adapter contract' },
      { pattern: 'xtend.rmt.xtend-component-adapter.v1', message: 'documents XTend component adapter contract' },
      { pattern: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', message: 'documents State/Scheduler/Diagnostics bridge contract' },
      { pattern: 'xtend.rmt.artifact-parity.v1', message: 'documents artifact parity contract' },
      { pattern: 'xtend.rmt.wp15.native-bridge-fixture.v1', message: 'documents WP-15 native bridge fixture contract' },
      { pattern: 'xtend.rmt.wp16.browser-smoke-fixture.v1', message: 'documents WP-16 browser smoke fixture contract' },
      { pattern: 'xtend.rmt.native-authoring-guide.v1', message: 'documents native authoring guide contract' },
      { pattern: 'xtend.rmt.native-migration-guide.v1', message: 'documents native migration guide contract' },
      { pattern: 'xtend.rmt.epic05-closure.v1', message: 'documents Epic 05 closure contract' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'documents WP-16 browser smoke fixture path' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference gate' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility gate' }
    ]
  },
  {
    path: 'development/WP-E05-01-Epic-04-Handoff-akzeptieren-und-Upstream-Source-of-Truth-festlegen.md',
    label: 'Epic 05 WP-01 source-of-truth decision',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-01 completed' },
      { pattern: 'Epic 04 ist mit `development/WP-E04-12-Epic-Abschlussreview-und-KPI-Abnahme.md` abgeschlossen', message: 'accepts Epic 04 closure' },
      { pattern: 'Source-of-Truth-Entscheidung', message: 'contains source-of-truth decision' },
      { pattern: 'Die Source-of-Truth fuer Epic 05 ist die upstream RMT-Quellstruktur.', message: 'declares upstream RMT source as source of truth' },
      { pattern: '`xtendrmt/` bleibt Build-Artefakt, Demo-Basis und Regression-Referenz', message: 'keeps xtendrmt as artifact layer' },
      { pattern: 'Modulverantwortungsmatrix', message: 'contains module responsibility matrix' },
      { pattern: '`rmt-kernel`', message: 'assigns rmt-kernel responsibility' },
      { pattern: '`rmt-dsl`', message: 'assigns rmt-dsl responsibility' },
      { pattern: '`rmt-routing`', message: 'assigns rmt-routing responsibility' },
      { pattern: '`rmt-components`', message: 'assigns rmt-components responsibility' },
      { pattern: '`rmt-adapters`', message: 'assigns rmt-adapters responsibility' },
      { pattern: '`rmt-adapter-xtend`', message: 'assigns XTend adapter responsibility' },
      { pattern: '`rmt-adapter-xrouter`', message: 'assigns XRouter adapter responsibility' },
      { pattern: '`rmt-tests`', message: 'assigns test responsibility' },
      { pattern: 'Build-Artefakt-Grenze fuer `xtendrmt/`', message: 'documents build artifact boundary' },
      { pattern: '`WP-02` darf jetzt starten', message: 'unblocks WP-02' },
      { pattern: 'XTend, XRouter, React, Vue, Vanilla JS und Custom Hosts muessen denselben Host Adapter Contract nutzen koennen', message: 'keeps host adapter contract framework agnostic' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference verification gate' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-02-Host-Adapter-Contract-und-Adapter-Lifecycle-definieren.md',
    label: 'Epic 05 WP-02 host adapter lifecycle contract',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-02 completed' },
      { pattern: 'Host Adapter Contract', message: 'names host adapter contract' },
      { pattern: 'Der Host Adapter Contract ist host-neutral.', message: 'keeps contract host-neutral' },
      { pattern: 'Adapter-Klassen', message: 'contains adapter classes section' },
      { pattern: '`host_adapter`', message: 'documents host adapter kind' },
      { pattern: '`component_adapter`', message: 'documents component adapter kind' },
      { pattern: '`router_adapter`', message: 'documents router adapter kind' },
      { pattern: '`state_adapter`', message: 'documents state adapter kind' },
      { pattern: '`scheduler_adapter`', message: 'documents scheduler adapter kind' },
      { pattern: 'Lifecycle-Phasen', message: 'contains lifecycle phases section' },
      { pattern: '`register`', message: 'documents register phase' },
      { pattern: '`negotiate`', message: 'documents negotiate phase' },
      { pattern: '`mount`', message: 'documents mount phase' },
      { pattern: '`hydrate`', message: 'documents hydrate phase' },
      { pattern: '`route`', message: 'documents route phase' },
      { pattern: 'Operations-Matrix', message: 'contains operations matrix' },
      { pattern: '`registerAdapter(definition, options)`', message: 'documents registerAdapter operation' },
      { pattern: '`negotiateCapabilities(requirements, options)`', message: 'documents negotiateCapabilities operation' },
      { pattern: '`mountComponent(target, componentRef, model, options)`', message: 'documents mountComponent operation' },
      { pattern: '`hydrateComponent(target, componentRef, model, options)`', message: 'documents hydrateComponent operation' },
      { pattern: '`registerRoutes(routes, options)`', message: 'documents registerRoutes operation' },
      { pattern: '`navigate(to, options)`', message: 'documents navigate operation' },
      { pattern: '`emitDiagnostic(event, payload)`', message: 'documents emitDiagnostic operation' },
      { pattern: 'Runtime-Surfaces', message: 'contains runtime surfaces section' },
      { pattern: '`esm`', message: 'documents ESM surface' },
      { pattern: '`browser_classic`', message: 'documents browser classic surface' },
      { pattern: 'Result- und Diagnostics-Contract', message: 'documents result and diagnostics contract' },
      { pattern: 'Capability-Vorbereitung fuer WP-03', message: 'prepares WP-03 capability negotiation' },
      { pattern: 'xtend.rmt.host-adapter-lifecycle.v1', message: 'declares host adapter lifecycle contract id' },
      { pattern: '`WP-03` fuer Adapter Registry und Capability Negotiation startbereit', message: 'unblocks WP-03' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-03-Adapter-Registry-und-Capability-Negotiation-modellieren.md',
    label: 'Epic 05 WP-03 adapter registry and capability negotiation',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-03 completed' },
      { pattern: 'Adapter Registry Contract', message: 'documents adapter registry contract' },
      { pattern: 'Capability Request Contract', message: 'documents capability request contract' },
      { pattern: 'Negotiation Flow', message: 'documents negotiation flow' },
      { pattern: 'Negotiation Result', message: 'documents negotiation result' },
      { pattern: 'Diagnostics-Codes', message: 'documents diagnostics codes' },
      { pattern: '`rmt.adapter.missing`', message: 'documents missing adapter diagnostic' },
      { pattern: '`rmt.capability.required_missing`', message: 'documents required capability diagnostic' },
      { pattern: '`rmt.capability.preferred_missing`', message: 'documents preferred capability diagnostic' },
      { pattern: '`rmt.adapter.surface_mismatch`', message: 'documents surface mismatch diagnostic' },
      { pattern: '`xtend`', message: 'documents XTend host adapter id' },
      { pattern: '`xtend.component`', message: 'documents XTend component adapter id' },
      { pattern: '`xtend.template`', message: 'documents XTend template adapter id' },
      { pattern: '`xtend.xrouter`', message: 'documents XRouter adapter id' },
      { pattern: 'Ein Template-only-`.rmt` Dokument ohne Adapter-Anforderungen bleibt gueltig', message: 'keeps template-only documents valid' },
      { pattern: '`WP-04` kann `adapters` als native Top-Level-Domain modellieren', message: 'unblocks WP-04' },
      { pattern: '`WP-05` kann `components` an Adapter- und Capability-Requirements anbinden', message: 'unblocks WP-05' },
      { pattern: '`WP-06` kann `routes` an Router Adapter und Navigation Capabilities anbinden', message: 'unblocks WP-06' },
      { pattern: 'xtend.rmt.adapter-registry.v1', message: 'declares adapter registry contract id' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-04-Native-Adapters-Domain-im-RMT-Schema-entwerfen.md',
    label: 'Epic 05 WP-04 native adapters domain',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-04 completed' },
      { pattern: 'Native Domain Shape', message: 'documents native domain shape' },
      { pattern: '`adapters` ist eine deklarative Domain', message: 'keeps adapters declarative' },
      { pattern: 'Ein Adapter Record besitzt mindestens', message: 'documents adapter record fields' },
      { pattern: '`host_adapter`', message: 'documents host adapter kind' },
      { pattern: '`component_adapter`', message: 'documents component adapter kind' },
      { pattern: '`router_adapter`', message: 'documents router adapter kind' },
      { pattern: '`state_adapter`', message: 'documents state adapter kind' },
      { pattern: '`scheduler_adapter`', message: 'documents scheduler adapter kind' },
      { pattern: 'XTend-Beispiel', message: 'contains XTend adapter example' },
      { pattern: '`xtend.component`', message: 'documents XTend component adapter id' },
      { pattern: 'Nicht-XTend-Beispiel', message: 'contains non-XTend adapter example' },
      { pattern: '`custom.router`', message: 'documents non-XTend router adapter id' },
      { pattern: 'Dokumente ohne `adapters` bleiben gueltig', message: 'keeps documents without adapters valid' },
      { pattern: 'Top-Level-Property `adapters`', message: 'documents top-level adapters property' },
      { pattern: 'xtend.rmt.adapters-domain.v1', message: 'declares native adapters domain contract id' },
      { pattern: '`WP-05` kann `components[*].adapter` gegen `adapters[*].id`', message: 'unblocks WP-05 component adapter refs' },
      { pattern: '`WP-06` kann `routes[*].router` gegen `router_adapter` Records', message: 'unblocks WP-06 route adapter refs' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-05-Native-Components-Domain-im-RMT-Schema-entwerfen.md',
    label: 'Epic 05 WP-05 native components domain',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-05 completed' },
      { pattern: 'Native Domain Shape', message: 'documents native domain shape' },
      { pattern: '`components` ist eine deklarative Domain', message: 'keeps components declarative' },
      { pattern: 'Ein Component Record besitzt mindestens', message: 'documents component record fields' },
      { pattern: '`custom_element`', message: 'documents custom element kind' },
      { pattern: '`web_component`', message: 'documents web component kind' },
      { pattern: '`host_component`', message: 'documents host component kind' },
      { pattern: '`template_component`', message: 'documents template component kind' },
      { pattern: '`fragment`', message: 'documents fragment kind' },
      { pattern: 'XTend-Beispiel', message: 'contains XTend component example' },
      { pattern: '`xtend.component`', message: 'documents XTend component adapter id' },
      { pattern: 'Nicht-XTend-Beispiel', message: 'contains non-XTend component example' },
      { pattern: '`custom.element`', message: 'documents non-XTend component adapter id' },
      { pattern: 'Dokumente ohne `components` bleiben gueltig', message: 'keeps documents without components valid' },
      { pattern: 'Top-Level-Property `components`', message: 'documents top-level components property' },
      { pattern: 'xtend.rmt.components-domain.v1', message: 'declares native components domain contract id' },
      { pattern: '`WP-06` kann `routes[*].component` gegen `components[*].id`', message: 'unblocks WP-06 component refs' },
      { pattern: '`WP-11` kann den produktiven XTend Component Adapter', message: 'unblocks WP-11 XTend adapter' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-06-Native-Routes-Domain-im-RMT-Schema-entwerfen.md',
    label: 'Epic 05 WP-06 native routes domain',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-06 completed' },
      { pattern: 'Native Domain Shape', message: 'documents native domain shape' },
      { pattern: '`routes` ist eine deklarative Navigationsdomain', message: 'keeps routes declarative' },
      { pattern: 'Ein Route Record besitzt mindestens', message: 'documents route record fields' },
      { pattern: '`id`', message: 'documents route id field' },
      { pattern: '`path`', message: 'documents route path field' },
      { pattern: '`router`', message: 'documents route router field' },
      { pattern: '`component`', message: 'documents route component field' },
      { pattern: '`template`', message: 'documents route template field' },
      { pattern: '`schedule`', message: 'documents route schedule field' },
      { pattern: '`params`', message: 'documents route params field' },
      { pattern: '`query`', message: 'documents route query field' },
      { pattern: '`lifecycle`', message: 'documents route lifecycle field' },
      { pattern: 'XRouter-Beispiel', message: 'contains XRouter route example' },
      { pattern: '`xtend.xrouter`', message: 'documents XRouter adapter id' },
      { pattern: 'Nicht-XTend-Beispiel', message: 'contains non-XTend route example' },
      { pattern: '`custom.router`', message: 'documents non-XTend router adapter id' },
      { pattern: 'Dokumente ohne `routes` bleiben gueltig', message: 'keeps documents without routes valid' },
      { pattern: 'Top-Level-Property `routes`', message: 'documents top-level routes property' },
      { pattern: 'xtend.rmt.routes-domain.v1', message: 'declares native routes domain contract id' },
      { pattern: '`WP-07` kann `routes[*].schedule`', message: 'unblocks WP-07 schedule refs' },
      { pattern: '`WP-10` kann den produktiven XRouter Adapter', message: 'unblocks WP-10 XRouter adapter' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md',
    label: 'Epic 05 WP-07 native schedules policy domain',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-07 completed' },
      { pattern: 'Native Domain Shape', message: 'documents native domain shape' },
      { pattern: '`schedules` ist eine deklarative Policy-Domain', message: 'keeps schedules declarative' },
      { pattern: 'Ein Schedule Record besitzt mindestens', message: 'documents schedule record fields' },
      { pattern: '`id`', message: 'documents schedule id field' },
      { pattern: '`endpointName`', message: 'documents endpointName field' },
      { pattern: '`scope`', message: 'documents scope field' },
      { pattern: '`lane`', message: 'documents lane field' },
      { pattern: '`priority`', message: 'documents priority field' },
      { pattern: '`deadlineMs`', message: 'documents deadline field' },
      { pattern: '`preferIdle`', message: 'documents preferIdle field' },
      { pattern: '`coalesceKey`', message: 'documents coalesce key field' },
      { pattern: '`budgetClass`', message: 'documents budget class field' },
      { pattern: 'Route Visible Render', message: 'contains route render schedule example' },
      { pattern: 'Component Idle Hydrate', message: 'contains component idle hydrate schedule example' },
      { pattern: 'Diagnostics Snapshot', message: 'contains diagnostics schedule example' },
      { pattern: 'Dokumente ohne `schedules` bleiben gueltig', message: 'keeps documents without schedules valid' },
      { pattern: 'Top-Level-Property `schedules`', message: 'documents top-level schedules property' },
      { pattern: 'xtend.rmt.schedules-domain.v1', message: 'declares native schedules domain contract id' },
      { pattern: '`WP-08` kann', message: 'unblocks WP-08 normalization' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md',
    label: 'Epic 05 WP-08 DSL normalization and compatibility',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-08 completed' },
      { pattern: 'xtend.rmt.dsl-normalization.v1', message: 'declares DSL normalization contract id' },
      { pattern: 'Normalisierungscontract', message: 'documents normalization contract section' },
      { pattern: '`template-only`', message: 'documents template-only input mode' },
      { pattern: '`native-app-dsl`', message: 'documents native app DSL input mode' },
      { pattern: '`legacy-manifest-metadata`', message: 'documents legacy metadata input mode' },
      { pattern: 'Legacy Promotion', message: 'documents legacy promotion section' },
      { pattern: '`manifest.metadata.routes` -> `routes`', message: 'documents route metadata promotion' },
      { pattern: 'Referenzaufloesung', message: 'documents reference resolution section' },
      { pattern: '`routes[*].component` -> `components[*].id`', message: 'documents route component reference check' },
      { pattern: '`routes[*].template` -> `templates[*].id`', message: 'documents route template reference check' },
      { pattern: '`routes[*].schedule` -> `schedules[*].id`', message: 'documents route schedule reference check' },
      { pattern: 'Diagnostic Codes', message: 'documents diagnostic codes section' },
      { pattern: 'rmt.dsl.reference.missing_adapter', message: 'documents missing adapter diagnostic' },
      { pattern: 'rmt.dsl.reference.missing_component', message: 'documents missing component diagnostic' },
      { pattern: 'rmt.dsl.reference.missing_template', message: 'documents missing template diagnostic' },
      { pattern: 'rmt.dsl.reference.missing_schedule', message: 'documents missing schedule diagnostic' },
      { pattern: 'tests/fixtures/rmt-template-only.legacy.rmt', message: 'documents template-only fixture' },
      { pattern: 'tests/fixtures/rmt-app-dsl.normalized.rmt', message: 'documents normalized app DSL fixture' },
      { pattern: 'tests/fixtures/rmt-app-dsl.missing-refs.rmt', message: 'documents missing refs fixture' },
      { pattern: '`WP-09` kann', message: 'unblocks WP-09 registry preparation' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md',
    label: 'Epic 05 WP-09 route and component runtime registries',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-09 completed' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'declares runtime registry contract id' },
      { pattern: 'Registry Contract', message: 'documents registry contract section' },
      { pattern: 'xtend.rmt.dsl-normalization.v1', message: 'builds on DSL normalization contract' },
      { pattern: 'Route Registry', message: 'documents route registry section' },
      { pattern: '`routeRegistry.byId`', message: 'documents route by id index' },
      { pattern: '`routeRegistry.byPath`', message: 'documents route by path index' },
      { pattern: '`routeRegistry.byRouter`', message: 'documents route by router index' },
      { pattern: '`routeRegistry.byComponent`', message: 'documents route by component index' },
      { pattern: 'Component Registry', message: 'documents component registry section' },
      { pattern: '`componentRegistry.byId`', message: 'documents component by id index' },
      { pattern: '`componentRegistry.byTag`', message: 'documents component by tag index' },
      { pattern: '`componentRegistry.byAdapter`', message: 'documents component by adapter index' },
      { pattern: 'Lifecycle Events', message: 'documents lifecycle section' },
      { pattern: '`create`', message: 'documents create lifecycle event' },
      { pattern: '`mount`', message: 'documents mount lifecycle event' },
      { pattern: '`hydrate`', message: 'documents hydrate lifecycle event' },
      { pattern: '`update`', message: 'documents update lifecycle event' },
      { pattern: '`dispose`', message: 'documents dispose lifecycle event' },
      { pattern: 'Runtime Diagnostics', message: 'documents runtime diagnostics section' },
      { pattern: 'rmt.runtime.registry.missing_route', message: 'documents missing route diagnostic' },
      { pattern: 'rmt.runtime.registry.missing_component', message: 'documents missing component diagnostic' },
      { pattern: 'rmt.runtime.registry.duplicate_route', message: 'documents duplicate route diagnostic' },
      { pattern: 'rmt.runtime.registry.duplicate_component', message: 'documents duplicate component diagnostic' },
      { pattern: 'createRmtFormat().createRuntimeRegistries', message: 'documents runtime registry artifact surface' },
      { pattern: 'RmtRuntimeRegistrySnapshot', message: 'documents runtime registry type surface' },
      { pattern: 'XTend, XRouter, DOM oder `xstate`', message: 'keeps host runtimes out of kernel' },
      { pattern: '`WP-10` kann', message: 'unblocks WP-10 XRouter adapter' },
      { pattern: '`WP-11` kann', message: 'unblocks WP-11 XTend component adapter' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md',
    label: 'Epic 05 WP-10 productive XRouter adapter',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-10 completed' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'declares XRouter adapter contract id' },
      { pattern: '`xtend.xrouter`', message: 'documents stable XRouter adapter id' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'builds on runtime registry contract' },
      { pattern: '`routeRegistry.byRouter["xtend.xrouter"]`', message: 'consumes XRouter route registry index' },
      { pattern: '`registerRoutes`', message: 'documents registerRoutes operation' },
      { pattern: '`navigate`', message: 'documents navigate operation' },
      { pattern: '`emitDiagnostic`', message: 'documents emitDiagnostic operation' },
      { pattern: '`createRmtXRouterAdapter`', message: 'documents primary adapter factory' },
      { pattern: '`createRenderManXRouterAdapter`', message: 'documents compatibility adapter factory' },
      { pattern: '`RmtXRouterAdapter`', message: 'documents adapter type surface' },
      { pattern: '`RmtXRouterMappedRoute`', message: 'documents mapped route type surface' },
      { pattern: '`XRouter.registerRoutes(routes, options)`', message: 'documents XRouter registration target surface' },
      { pattern: '`XRouter.navigate(to, options)`', message: 'documents XRouter navigation target surface' },
      { pattern: '`data-rmt-schedule`', message: 'documents schedule ref forwarding' },
      { pattern: 'rmt.xrouter.route.missing_path', message: 'documents missing path diagnostic' },
      { pattern: 'rmt.xrouter.route.missing_component', message: 'documents missing component diagnostic' },
      { pattern: 'rmt.xrouter.target.missing', message: 'documents missing target diagnostic' },
      { pattern: 'rmt.xrouter.navigation.skipped', message: 'documents skipped navigation diagnostic' },
      { pattern: 'XRouter bleibt Adapter, nicht Kernelwissen', message: 'keeps XRouter out of kernel' },
      { pattern: '`WP-11` kann', message: 'unblocks WP-11 XTend component adapter' },
      { pattern: '`WP-12` kann', message: 'unblocks WP-12 state scheduler diagnostics bridge' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md',
    label: 'Epic 05 WP-11 productive XTend component adapter',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-11 completed' },
      { pattern: 'xtend.rmt.xtend-component-adapter.v1', message: 'declares XTend component adapter contract id' },
      { pattern: '`xtend.component`', message: 'documents stable XTend component adapter id' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'builds on runtime registry contract' },
      { pattern: '`componentRegistry.byAdapter["xtend.component"]`', message: 'consumes XTend component registry index' },
      { pattern: '`registerComponent`', message: 'documents registerComponent operation' },
      { pattern: '`mountComponent`', message: 'documents mountComponent operation' },
      { pattern: '`hydrateComponent`', message: 'documents hydrateComponent operation' },
      { pattern: '`emitDiagnostic`', message: 'documents emitDiagnostic operation' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'documents primary adapter factory' },
      { pattern: '`createRenderManXtendComponentAdapter`', message: 'documents compatibility adapter factory' },
      { pattern: '`RmtXtendComponentAdapter`', message: 'documents adapter type surface' },
      { pattern: '`RmtXtendMappedComponent`', message: 'documents mapped component type surface' },
      { pattern: '`data-rmt-component-id`', message: 'documents component id forwarding' },
      { pattern: '`data-rmt-schedule`', message: 'documents schedule ref forwarding' },
      { pattern: '`data-xtend-hydrated="true"`', message: 'documents hydration marker' },
      { pattern: 'rmt.xtend.component.missing_tag', message: 'documents missing tag diagnostic' },
      { pattern: 'rmt.xtend.component.target.missing', message: 'documents missing target diagnostic' },
      { pattern: 'rmt.xtend.component.manifest.missing', message: 'documents missing manifest diagnostic' },
      { pattern: 'rmt.xtend.component.custom_element.unregistered', message: 'documents unregistered custom element diagnostic' },
      { pattern: 'rmt.xtend.component.mount.skipped', message: 'documents skipped mount diagnostic' },
      { pattern: 'rmt.xtend.component.hydration.skipped', message: 'documents skipped hydration diagnostic' },
      { pattern: 'XTend bleibt Adapter, nicht Kernelwissen', message: 'keeps XTend out of kernel' },
      { pattern: '`WP-12` kann', message: 'unblocks WP-12 state scheduler diagnostics bridge' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md',
    label: 'Epic 05 WP-12 State Scheduler Diagnostics bridge',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-12 completed' },
      { pattern: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', message: 'declares bridge contract id' },
      { pattern: '`rmt.state-scheduler-diagnostics`', message: 'documents stable bridge adapter id' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'builds on runtime registry contract' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'builds on XRouter adapter contract' },
      { pattern: 'xtend.rmt.xtend-component-adapter.v1', message: 'builds on XTend component adapter contract' },
      { pattern: 'xtend.rmt.schedules-domain.v1', message: 'builds on schedules domain contract' },
      { pattern: '`createStateBridge`', message: 'documents createStateBridge operation' },
      { pattern: '`scheduleEndpoint`', message: 'documents scheduleEndpoint operation' },
      { pattern: '`emitDiagnostic`', message: 'documents emitDiagnostic operation' },
      { pattern: '`recordAdapterResult`', message: 'documents recordAdapterResult operation' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'documents primary bridge factory' },
      { pattern: '`createRenderManStateSchedulerDiagnosticsBridge`', message: 'documents compatibility bridge factory' },
      { pattern: '`RmtStateSchedulerDiagnosticsBridge`', message: 'documents bridge type surface' },
      { pattern: '`RmtStateBridgeHandle`', message: 'documents state bridge handle type surface' },
      { pattern: '`RmtBridgeSchedulePolicy`', message: 'documents bridge schedule policy type surface' },
      { pattern: '`rmt.adapter.lastResult`', message: 'documents adapter result state mirror' },
      { pattern: '`rmt.scheduler.lastEndpoint`', message: 'documents scheduler state mirror' },
      { pattern: '`rmt.diagnostics.last`', message: 'documents diagnostics state mirror' },
      { pattern: '`rmt.bridge.scheduler.endpoint.scheduled`', message: 'documents scheduled endpoint diagnostic' },
      { pattern: '`rmt.bridge.scheduler.endpoint.queued`', message: 'documents queued endpoint diagnostic' },
      { pattern: '`rmt.bridge.adapter.result.degraded`', message: 'documents degraded adapter result diagnostic' },
      { pattern: '`xstate` importieren', message: 'keeps xstate out of kernel' },
      { pattern: '`WP-13` kann', message: 'unblocks WP-13 build parity' },
      { pattern: '`WP-14` kann', message: 'unblocks WP-14 demo migration after parity' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md',
    label: 'Epic 05 WP-13 artifact parity',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-13 completed' },
      { pattern: 'xtend.rmt.artifact-parity.v1', message: 'declares artifact parity contract id' },
      { pattern: '`artifactParityContracts`', message: 'documents schema and manifest artifact parity placement' },
      { pattern: 'node scripts/verify_xtendrmt_artifact_parity.js --json', message: 'documents dedicated artifact parity gate' },
      { pattern: 'npm run test:rmt-artifact-parity', message: 'documents npm shortcut' },
      { pattern: '`xtendrmt/rmt-core.esm.js`', message: 'documents core ESM artifact' },
      { pattern: '`xtendrmt/rmt-runtime.esm.js`', message: 'documents runtime ESM artifact' },
      { pattern: '`xtendrmt/rmt-runtime.browser.js`', message: 'documents browser runtime artifact' },
      { pattern: '`xtendrmt/rmt-core.d.ts`', message: 'documents type artifact' },
      { pattern: '`xtendrmt/rmt.schema.json`', message: 'documents schema artifact' },
      { pattern: '`xtendrmt/rmt-manifest.json`', message: 'documents manifest artifact' },
      { pattern: '`createRmtFormat`', message: 'documents format factory parity' },
      { pattern: '`createRmtXRouterAdapter`', message: 'documents XRouter factory parity' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'documents XTend component factory parity' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'documents bridge factory parity' },
      { pattern: '`RmtArtifactParityContract`', message: 'documents artifact parity type surface' },
      { pattern: 'Build-Artefakt, Demo-Basis und Regression-Referenz', message: 'keeps xtendrmt as artifact layer' },
      { pattern: '`WP-14` ist dadurch startbereit', message: 'unblocks WP-14 demo migration' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference verification gate' }
    ]
  },
  {
    path: 'development/WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md',
    label: 'Epic 05 WP-15 contract schema runtime tests',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-15 completed' },
      { pattern: 'xtend.rmt.wp15.native-bridge-fixture.v1', message: 'declares native bridge fixture contract id' },
      { pattern: 'tests/fixtures/rmt-app-dsl.native-bridge.rmt', message: 'documents native bridge fixture path' },
      { pattern: '`createRmtFormat`', message: 'documents RMT format factory under test' },
      { pattern: '`createRuntimeRegistries`', message: 'documents runtime registry factory under test' },
      { pattern: '`createRmtXRouterAdapter`', message: 'documents XRouter adapter factory under test' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'documents XTend component adapter factory under test' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'documents bridge factory under test' },
      { pattern: 'Fake XRouter Target', message: 'keeps XRouter test target fake' },
      { pattern: 'Fake DOM Target', message: 'keeps DOM test target fake' },
      { pattern: 'Fake Scheduler', message: 'keeps scheduler test target fake' },
      { pattern: 'ESM Runtime Bundle', message: 'documents ESM runtime probe' },
      { pattern: 'Browser-Bundle', message: 'documents browser-near runtime probe' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference verification gate' },
      { pattern: '`WP-16` und `WP-17` koennen darauf aufbauen', message: 'unblocks WP-16 and WP-17' }
    ]
  },
  {
    path: 'development/WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md',
    label: 'Epic 05 WP-16 browser smokes and multi-host regression',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-16 completed' },
      { pattern: 'xtend.rmt.wp16.browser-smoke-fixture.v1', message: 'declares browser smoke fixture contract id' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'documents browser smoke fixture path' },
      { pattern: 'window.__xtendRmtBrowserSmokeResult', message: 'documents browser result key' },
      { pattern: '`createRmtFormat`', message: 'documents RMT format factory under browser smoke' },
      { pattern: '`createRuntimeRegistries`', message: 'documents runtime registry factory under browser smoke' },
      { pattern: '`createRmtXRouterAdapter`', message: 'documents XRouter adapter factory under browser smoke' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'documents XTend component adapter factory under browser smoke' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'documents bridge factory under browser smoke' },
      { pattern: '`vanilla.component`', message: 'documents non-XTend adapter id' },
      { pattern: '`xtendrmt.vanilla.mount`', message: 'documents vanilla scheduler endpoint' },
      { pattern: 'data-rmt-browser-smoke="wp-16"', message: 'documents bestcase smoke marker' },
      { pattern: 'XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js browser', message: 'documents optional Safari browser smoke command' },
      { pattern: 'node scripts/run_xtend_tests.js browser --json', message: 'documents browser verification gate' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference verification gate' },
      { pattern: 'npm test', message: 'documents final default gate' },
      { pattern: '`WP-17` kann', message: 'unblocks WP-17 authoring documentation' }
    ]
  },
  {
    path: 'development/WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md',
    label: 'Epic 05 WP-17 authoring and migration documentation',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-17 completed' },
      { pattern: 'xtend.rmt.native-authoring-guide.v1', message: 'declares native authoring guide contract id' },
      { pattern: 'xtend.rmt.native-migration-guide.v1', message: 'declares native migration guide contract id' },
      { pattern: 'docs/xtendrmt-native-authoring.md', message: 'documents native authoring guide path' },
      { pattern: 'docs/xtendrmt-migration-guide.md', message: 'documents native migration guide path' },
      { pattern: '`manifest.metadata.routes -> routes`', message: 'documents route metadata migration' },
      { pattern: '`manifest.metadata.components -> components`', message: 'documents component metadata migration' },
      { pattern: '`manifest.metadata.schedules -> schedules`', message: 'documents schedule metadata migration' },
      { pattern: '`xtend.xrouter`', message: 'documents XRouter adapter id' },
      { pattern: '`xtend.component`', message: 'documents XTend component adapter id' },
      { pattern: '`vanilla.component`', message: 'documents non-XTend adapter id' },
      { pattern: '`createRmtXRouterAdapter`', message: 'documents XRouter adapter factory' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'documents XTend component adapter factory' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'documents bridge factory' },
      { pattern: 'node scripts/run_xtend_tests.js references --json', message: 'documents reference verification gate' },
      { pattern: 'node scripts/run_xtend_tests.js rmt-compatibility --json', message: 'documents RMT compatibility verification gate' },
      { pattern: 'node scripts/run_xtend_tests.js browser --json', message: 'documents browser verification gate' },
      { pattern: '`WP-18` kann', message: 'unblocks WP-18 closure review' }
    ]
  },
  {
    path: 'development/WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md',
    label: 'Epic 05 WP-18 closure review',
    contracts: [
      { pattern: 'Status: `completed`', message: 'marks WP-18 completed' },
      { pattern: 'xtend.rmt.epic05-closure.v1', message: 'declares Epic 05 closure contract id' },
      { pattern: 'KPI-Bewertung', message: 'contains KPI assessment' },
      { pattern: 'Akzeptanzkriterien-Check', message: 'contains acceptance criteria check' },
      { pattern: 'Risikoabdeckung', message: 'contains risk coverage' },
      { pattern: 'Gemessener Iststand', message: 'contains measured state' },
      { pattern: '`18` von `18` Epic-05-Workpackages sind abgeschlossen', message: 'documents all workpackages completed' },
      { pattern: '`createRmtXRouterAdapter`', message: 'mentions productive XRouter adapter factory' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'mentions productive XTend component adapter factory' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'mentions productive bridge factory' },
      { pattern: 'tests/fixtures/rmt-app-dsl.native-bridge.rmt', message: 'documents native bridge fixture' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'documents browser smoke fixture' },
      { pattern: 'docs/xtendrmt-native-authoring.md', message: 'documents native authoring guide' },
      { pattern: 'docs/xtendrmt-migration-guide.md', message: 'documents native migration guide' },
      { pattern: 'node scripts/run_xtend_tests.js --report /private/tmp/xtend-e05-final-report.json', message: 'documents final report command' },
      { pattern: '`7` von `7` Runner-Suites passed', message: 'documents final suite count' },
      { pattern: 'Epic 05 ist abgeschlossen', message: 'declares Epic 05 closed' }
    ]
  },
  {
    path: 'xtendrmt/rmt.schema.json',
    label: 'RMT schema host adapter, registry and adapters domain metadata',
    contracts: [
      { pattern: 'hostAdapterLifecycleContracts', message: 'exposes host adapter lifecycle metadata' },
      { pattern: 'xtend.rmt.host-adapter-lifecycle.v1', message: 'exposes host adapter lifecycle schema id' },
      { pattern: 'epic-05-wp-02-contract', message: 'marks host adapter lifecycle as WP-02 contract' },
      { pattern: 'adapterRegistryContracts', message: 'exposes adapter registry metadata' },
      { pattern: 'xtend.rmt.adapter-registry.v1', message: 'exposes adapter registry schema id' },
      { pattern: 'epic-05-wp-03-contract', message: 'marks adapter registry as WP-03 contract' },
      { pattern: 'nativeDomainContracts', message: 'exposes native domain metadata' },
      { pattern: 'dslNormalizationContracts', message: 'exposes DSL normalization metadata' },
      { pattern: 'runtimeRegistryContracts', message: 'exposes runtime registry metadata' },
      { pattern: 'xrouterAdapterContracts', message: 'exposes XRouter adapter metadata' },
      { pattern: 'xtendComponentAdapterContracts', message: 'exposes XTend component adapter metadata' },
      { pattern: 'stateSchedulerDiagnosticsBridgeContracts', message: 'exposes State/Scheduler/Diagnostics bridge metadata' },
      { pattern: 'artifactParityContracts', message: 'exposes artifact parity metadata' },
      { pattern: 'xtend.rmt.adapters-domain.v1', message: 'exposes native adapters domain id' },
      { pattern: 'epic-05-wp-04-contract', message: 'marks native adapters domain as WP-04 contract' },
      { pattern: 'xtend.rmt.components-domain.v1', message: 'exposes native components domain id' },
      { pattern: 'epic-05-wp-05-contract', message: 'marks native components domain as WP-05 contract' },
      { pattern: 'xtend.rmt.routes-domain.v1', message: 'exposes native routes domain id' },
      { pattern: 'epic-05-wp-06-contract', message: 'marks native routes domain as WP-06 contract' },
      { pattern: 'xtend.rmt.schedules-domain.v1', message: 'exposes native schedules domain id' },
      { pattern: 'epic-05-wp-07-contract', message: 'marks native schedules domain as WP-07 contract' },
      { pattern: 'xtend.rmt.dsl-normalization.v1', message: 'exposes DSL normalization contract id' },
      { pattern: 'epic-05-wp-08-contract', message: 'marks DSL normalization as WP-08 contract' },
      { pattern: 'xtend.rmt.runtime-registry.v1', message: 'exposes runtime registry contract id' },
      { pattern: 'epic-05-wp-09-contract', message: 'marks runtime registry as WP-09 contract' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'exposes XRouter adapter contract id' },
      { pattern: 'epic-05-wp-10-contract', message: 'marks XRouter adapter as WP-10 contract' },
      { pattern: 'xtend.rmt.xtend-component-adapter.v1', message: 'exposes XTend component adapter contract id' },
      { pattern: 'epic-05-wp-11-contract', message: 'marks XTend component adapter as WP-11 contract' },
      { pattern: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', message: 'exposes State/Scheduler/Diagnostics bridge contract id' },
      { pattern: 'epic-05-wp-12-contract', message: 'marks State/Scheduler/Diagnostics bridge as WP-12 contract' },
      { pattern: 'xtend.rmt.artifact-parity.v1', message: 'exposes artifact parity contract id' },
      { pattern: 'epic-05-wp-13-contract', message: 'marks artifact parity as WP-13 contract' },
      { pattern: '"adapters": {', message: 'exposes top-level adapters property' },
      { pattern: '"$ref": "#/$defs/adapters"', message: 'points top-level adapters to adapters definition' },
      { pattern: '"components": {', message: 'exposes top-level components property' },
      { pattern: '"$ref": "#/$defs/components"', message: 'points top-level components to components definition' },
      { pattern: '"routes": {', message: 'exposes top-level routes property' },
      { pattern: '"$ref": "#/$defs/routes"', message: 'points top-level routes to routes definition' },
      { pattern: '"schedules": {', message: 'exposes top-level schedules property' },
      { pattern: '"$ref": "#/$defs/schedules"', message: 'points top-level schedules to schedules definition' },
      { pattern: '"adapterKind"', message: 'defines adapter kind schema' },
      { pattern: '"componentKind"', message: 'defines component kind schema' },
      { pattern: '"routeParam"', message: 'defines route param schema' },
      { pattern: '"routeLifecycle"', message: 'defines route lifecycle schema' },
      { pattern: '"scheduleLane"', message: 'defines schedule lane schema' },
      { pattern: '"scheduleBudgetClass"', message: 'defines schedule budget class schema' },
      { pattern: '"scheduleRefOrInline"', message: 'defines reusable schedule ref or inline schema' },
      { pattern: '"custom_element"', message: 'defines custom element component kind' },
      { pattern: '"web_component"', message: 'defines web component kind' },
      { pattern: '"host_component"', message: 'defines host component kind' },
      { pattern: '"template_component"', message: 'defines template component kind' },
      { pattern: '"fragment"', message: 'defines fragment component kind' },
      { pattern: '"runtimeSurface"', message: 'defines runtime surface schema' },
      { pattern: '"capabilityList"', message: 'defines capability list schema' },
      { pattern: '"adapterStatus"', message: 'defines adapter status schema' },
      { pattern: 'registerAdapter', message: 'exposes registerAdapter operation' },
      { pattern: 'negotiateCapabilities', message: 'exposes negotiateCapabilities operation' },
      { pattern: 'mountComponent', message: 'exposes mountComponent operation' },
      { pattern: 'hydrateComponent', message: 'exposes hydrateComponent operation' },
      { pattern: 'registerRoutes', message: 'exposes registerRoutes operation' },
      { pattern: 'navigate', message: 'exposes navigate operation' },
      { pattern: 'recordAdapterResult', message: 'exposes recordAdapterResult operation' },
      { pattern: 'emitDiagnostic', message: 'exposes emitDiagnostic operation' },
      { pattern: 'outside kernel imports', message: 'keeps host runtimes outside kernel imports' },
      { pattern: 'rmt.capability.required_missing', message: 'exposes required capability diagnostic' },
      { pattern: 'rmt.adapter.surface_mismatch', message: 'exposes surface mismatch diagnostic' },
      { pattern: 'templateOnlyCompatibility', message: 'documents template-only compatibility' },
      { pattern: 'legacyPromotionPaths', message: 'documents legacy metadata promotion paths' },
      { pattern: 'referenceChecks', message: 'documents DSL reference checks' },
      { pattern: 'rmt.dsl.reference.missing_schedule', message: 'documents missing schedule DSL diagnostic' },
      { pattern: 'createRmtFormat().normalizeDocument', message: 'documents normalizeDocument artifact surface' },
      { pattern: 'routeRegistry.byRouter', message: 'documents route registry router index' },
      { pattern: 'componentRegistry.byAdapter', message: 'documents component registry adapter index' },
      { pattern: 'routeRegistry.byRouter[\\"xtend.xrouter\\"]', message: 'documents XRouter adapter route index consumption' },
      { pattern: 'componentRegistry.byAdapter[\\"xtend.component\\"]', message: 'documents XTend component adapter index consumption' },
      { pattern: 'RmtHostAdapterOperationResult', message: 'documents bridge adapter result consumption' },
      { pattern: 'RmtRouteRegistryEntry.scheduleRef', message: 'documents bridge route schedule consumption' },
      { pattern: 'RmtComponentRegistryEntry.scheduleRef', message: 'documents bridge component schedule consumption' },
      { pattern: 'rmt.runtime.registry.missing_route', message: 'documents missing route registry diagnostic' },
      { pattern: 'rmt.runtime.registry.missing_component', message: 'documents missing component registry diagnostic' },
      { pattern: 'rmt.xrouter.navigation.skipped', message: 'documents XRouter navigation diagnostic' },
      { pattern: 'rmt.xtend.component.hydration.skipped', message: 'documents XTend component hydration diagnostic' },
      { pattern: 'rmt.bridge.scheduler.endpoint.scheduled', message: 'documents bridge scheduled endpoint diagnostic' },
      { pattern: 'rmt.bridge.adapter.result.degraded', message: 'documents bridge degraded result diagnostic' },
      { pattern: 'createRmtFormat().createRuntimeRegistries', message: 'documents runtime registry artifact surface' },
      { pattern: 'createRmtXRouterAdapter', message: 'documents XRouter adapter factory surface' },
      { pattern: 'RmtXRouterAdapter', message: 'documents XRouter adapter type surface' },
      { pattern: 'createRmtXtendComponentAdapter', message: 'documents XTend component adapter factory surface' },
      { pattern: 'RmtXtendComponentAdapter', message: 'documents XTend component adapter type surface' },
      { pattern: 'createRmtStateSchedulerDiagnosticsBridge', message: 'documents State/Scheduler/Diagnostics bridge factory surface' },
      { pattern: 'RmtStateSchedulerDiagnosticsBridge', message: 'documents State/Scheduler/Diagnostics bridge type surface' },
      { pattern: 'scripts/verify_xtendrmt_artifact_parity.js', message: 'documents artifact parity gate script' },
      { pattern: 'createRmtFormat', message: 'documents format factory surface' },
      { pattern: 'RmtArtifactParityContract', message: 'documents artifact parity type surface' },
      { pattern: '"id": "xtend.component"', message: 'includes XTend component adapter example' },
      { pattern: '"id": "custom.router"', message: 'includes non-XTend router adapter example' },
      { pattern: '"id": "pages.overview"', message: 'includes XTend component record example' },
      { pattern: '"adapter": "xtend.component"', message: 'includes XTend component adapter ref example' },
      { pattern: '"id": "shared.badge"', message: 'includes generic component record example' },
      { pattern: '"adapter": "custom.element"', message: 'includes non-XTend component adapter ref example' },
      { pattern: '"id": "overview"', message: 'includes XRouter route record example' },
      { pattern: '"router": "xtend.xrouter"', message: 'includes XRouter adapter route ref example' },
      { pattern: '"id": "search"', message: 'includes generic route record example' },
      { pattern: '"router": "custom.router"', message: 'includes non-XTend router route ref example' },
      { pattern: '"id": "route.visible.render"', message: 'includes visible route schedule example' },
      { pattern: '"id": "component.idle.hydrate"', message: 'includes idle component schedule example' },
      { pattern: '"id": "diagnostics.snapshot"', message: 'includes diagnostics schedule example' }
    ]
  },
  {
    path: 'xtendrmt/rmt-core.d.ts',
    label: 'RMT type host adapter lifecycle, registry and adapters domain surface',
    contracts: [
      { pattern: 'RmtHostAdapterDefinition', message: 'exposes host adapter definition type' },
      { pattern: 'RmtHostAdapterLifecycleContract', message: 'exposes host adapter lifecycle contract type' },
      { pattern: 'RmtHostAdapterRuntimeBridge', message: 'exposes host adapter runtime bridge type' },
      { pattern: 'RmtAdapterRegistryRecord', message: 'exposes adapter registry record type' },
      { pattern: 'RmtCapabilityRequest', message: 'exposes capability request type' },
      { pattern: 'RmtCapabilityNegotiationResult', message: 'exposes capability negotiation result type' },
      { pattern: 'RmtAdapterRegistryContract', message: 'exposes adapter registry contract type' },
      { pattern: 'RmtNativeDomainContract', message: 'exposes native domain contract type' },
      { pattern: 'RmtAdapterDomainRecord', message: 'exposes adapter domain record type' },
      { pattern: 'adapters?: RmtAdapterDomainRecord[]', message: 'exposes optional adapters domain on document type' },
      { pattern: 'RmtComponentDomainKind', message: 'exposes component domain kind type' },
      { pattern: 'RmtComponentDomainRecord', message: 'exposes component domain record type' },
      { pattern: 'components?: RmtComponentDomainRecord[]', message: 'exposes optional components domain on document type' },
      { pattern: 'RmtRouteDomainRecord', message: 'exposes route domain record type' },
      { pattern: 'routes?: RmtRouteDomainRecord[]', message: 'exposes optional routes domain on document type' },
      { pattern: 'RmtScheduleDomainRecord', message: 'exposes schedule domain record type' },
      { pattern: 'RmtScheduleLane', message: 'exposes schedule lane type' },
      { pattern: 'RmtScheduleBudgetClass', message: 'exposes schedule budget class type' },
      { pattern: 'schedules?: RmtScheduleDomainRecord[]', message: 'exposes optional schedules domain on document type' },
      { pattern: 'RmtDslNormalizationContract', message: 'exposes DSL normalization contract type' },
      { pattern: 'RmtDslNormalizationSummary', message: 'exposes DSL normalization summary type' },
      { pattern: 'RmtDslDiagnostic', message: 'exposes DSL diagnostic type' },
      { pattern: 'normalization?: RmtDslNormalizationSummary', message: 'exposes optional normalization summary on document type' },
      { pattern: 'diagnostics?: RmtDslDiagnostic[]', message: 'exposes optional diagnostics on document type' },
      { pattern: 'normalizeDslDomains', message: 'types normalizeDslDomains operation' },
      { pattern: 'listDslDiagnosticCodes', message: 'types DSL diagnostic code listing' },
      { pattern: 'RmtRuntimeRegistryContract', message: 'exposes runtime registry contract type' },
      { pattern: 'RmtRuntimeRegistrySnapshot', message: 'exposes runtime registry snapshot type' },
      { pattern: 'RmtRouteRegistryEntry', message: 'exposes route registry entry type' },
      { pattern: 'RmtComponentRegistryEntry', message: 'exposes component registry entry type' },
      { pattern: 'createRuntimeRegistries', message: 'types runtime registry creation' },
      { pattern: 'listRuntimeRegistryDiagnosticCodes', message: 'types runtime registry diagnostic listing' },
      { pattern: 'RmtXRouterAdapterContract', message: 'exposes XRouter adapter contract type' },
      { pattern: 'RmtXRouterAdapter', message: 'exposes XRouter adapter type' },
      { pattern: 'RmtXRouterMappedRoute', message: 'exposes XRouter mapped route type' },
      { pattern: 'RmtXRouterRouteMapping', message: 'exposes XRouter route mapping type' },
      { pattern: 'RmtXRouterNavigationTarget', message: 'exposes XRouter navigation target type' },
      { pattern: 'createRmtXRouterAdapter', message: 'types XRouter adapter factory' },
      { pattern: 'RmtXtendComponentAdapterContract', message: 'exposes XTend component adapter contract type' },
      { pattern: 'RmtXtendComponentAdapter', message: 'exposes XTend component adapter type' },
      { pattern: 'RmtXtendMappedComponent', message: 'exposes XTend mapped component type' },
      { pattern: 'RmtXtendComponentMapping', message: 'exposes XTend component mapping type' },
      { pattern: 'createRmtXtendComponentAdapter', message: 'types XTend component adapter factory' },
      { pattern: 'RmtStateSchedulerDiagnosticsBridgeContract', message: 'exposes State/Scheduler/Diagnostics bridge contract type' },
      { pattern: 'RmtStateSchedulerDiagnosticsBridge', message: 'exposes State/Scheduler/Diagnostics bridge type' },
      { pattern: 'RmtStateBridgeHandle', message: 'exposes State Bridge handle type' },
      { pattern: 'RmtBridgeSchedulePolicy', message: 'exposes Bridge schedule policy type' },
      { pattern: 'createRmtStateSchedulerDiagnosticsBridge', message: 'types State/Scheduler/Diagnostics bridge factory' },
      { pattern: 'RmtArtifactParityContract', message: 'exposes artifact parity contract type' },
      { pattern: 'artifactParityContracts?: RmtArtifactParityContract[]', message: 'types artifact parity contracts on product manifest' },
      { pattern: 'format: string;', message: 'types format factory manifest entry' },
      { pattern: 'recordAdapterResult', message: 'types bridge adapter result operation' },
      { pattern: 'registerAdapter(definition: RmtHostAdapterDefinition', message: 'types registerAdapter operation' },
      { pattern: 'negotiateCapabilities(requirements: RmtHostAdapterCapabilities', message: 'types negotiateCapabilities operation' },
      { pattern: 'mountComponent?', message: 'types mountComponent operation' },
      { pattern: 'hydrateComponent?', message: 'types hydrateComponent operation' },
      { pattern: 'registerRoutes?', message: 'types registerRoutes operation' },
      { pattern: 'navigate?', message: 'types navigate operation' },
      { pattern: 'emitDiagnostic(event: RmtHostAdapterDiagnosticEvent', message: 'types emitDiagnostic operation' },
      { pattern: 'missingRequiredCapabilities', message: 'types missing required capabilities' },
      { pattern: 'missingPreferredCapabilities', message: 'types missing preferred capabilities' }
    ]
  }
];

const DOC_REFERENCE_CONTRACTS = [
  {
    path: 'docs/README.md',
    label: 'Docs overview',
    contracts: [
      { pattern: 'XTend Dokumentation', message: 'contains documentation overview heading' },
      { pattern: './components/xmodal.md', message: 'links x-modal component docs' },
      { pattern: './components/xsummary.md', message: 'links x-summary component docs' },
      { pattern: './components/xutils.md', message: 'links x-utils utility docs' },
      { pattern: './components/xrouter.md', message: 'links x-router component docs' },
      { pattern: './xtend-loader.md', message: 'links XTend Loader docs' },
      { pattern: './manifest.md', message: 'links manifest docs' },
      { pattern: './core-migration-guide.md', message: 'links core migration guide' },
      { pattern: './xtend-fabric.md', message: 'links XTend-Fabric runtime guide' },
      { pattern: './xtend-fabric-rmt-lane-mapping.md', message: 'links XTend-Fabric RMT lane mapping guide' },
      { pattern: './performance.md', message: 'links Performance authoring guide' },
      { pattern: './performance-measurements.md', message: 'links Performance Measurements guide' },
      { pattern: './performance-regression.md', message: 'links Performance Regression guide' },
      { pattern: './hydration-policies.md', message: 'links Hydration Policies guide' },
      { pattern: './a11y-keyboard-smokes.md', message: 'links A11y Keyboard Smokes guide' },
      { pattern: './screenreader-signals.md', message: 'links Screenreader Signals guide' },
      { pattern: './motion-contrast.md', message: 'links Motion and Contrast guide' },
      { pattern: './manifest-import-policy.md', message: 'links Manifest Import Policy guide' },
      { pattern: './trusted-dom-sanitizing.md', message: 'links Trusted DOM and Sanitizing guide' },
      { pattern: './supply-chain-gates.md', message: 'links Supply-Chain gates guide' },
      { pattern: './component-catalog-coverage.md', message: 'links Component Catalog Coverage guide' },
      { pattern: './public-component-types.md', message: 'links Public Component Types guide' },
      { pattern: './visual-browser-regression.md', message: 'links Visual Browser Regression guide' },
      { pattern: './visual-snapshot-automation.md', message: 'links Visual Snapshot Automation guide' },
      { pattern: './epic11-enterprise-ux-handoff.md', message: 'links Epic 11 Enterprise UX Handoff guide' },
      { pattern: './enterprise-adoption.md', message: 'links Enterprise Adoption guide' },
      { pattern: './xtendrmt-overview.md', message: 'links XTendRMT overview' },
      { pattern: './xtendrmt-native-authoring.md', message: 'links XTendRMT native authoring guide' },
      { pattern: './xtendrmt-app-dsl.md', message: 'links XTendRMT App-DSL reference' },
      { pattern: './xtendrmt-runtime-bridge.md', message: 'links XTendRMT runtime bridge' },
      { pattern: './xtendrmt-migration-guide.md', message: 'links XTendRMT migration guide' },
      { pattern: './xtendrmt-parsedown-scheduling.md', message: 'links XTendRMT Parsedown scheduling pilot' },
      { pattern: 'xtend.docs.parsedown-rmt-pilot.v1', message: 'documents Docs RMT pilot contract' },
      { pattern: 'npm run test:docs-rmt-pilot', message: 'documents Docs RMT pilot gate' }
    ]
  },
  {
    path: 'docs/enterprise-adoption.md',
    label: 'Enterprise Adoption documentation',
    contracts: [
      { pattern: 'XTend Enterprise Adoption Guide', message: 'contains Enterprise Adoption heading' },
      { pattern: 'xtend.docs.enterprise-adoption.v1', message: 'declares Enterprise Adoption docs contract' },
      { pattern: 'xtend.enterpriseAdoption', message: 'documents package metadata surface' },
      { pattern: 'xtend-loader.js', message: 'documents canonical loader' },
      { pattern: 'xtend-dev.js', message: 'documents legacy loader boundary' },
      { pattern: 'npm run dev:local', message: 'documents local dev server command' },
      { pattern: 'XTend UI bleibt das Web-Component- und UI-Builder-Produkt', message: 'positions XTend UI as product surface' },
      { pattern: 'XTendRMT bleibt Scheduler, Runtime Bridge und Templating-Kernel', message: 'positions XTendRMT as scheduler and templating kernel' },
      { pattern: 'XTend-Fabric ist die lokale Safety-, Diagnostics-, Telemetry- und Reporter-Schicht', message: 'positions XTend-Fabric as safety layer' },
      { pattern: 'Manifest Import Policy', message: 'links manifest import policy' },
      { pattern: 'Trusted DOM und Sanitizing', message: 'links Trusted DOM policy' },
      { pattern: 'Supply-Chain Gates', message: 'links supply-chain gates' },
      { pattern: 'Performance-by-design', message: 'requires performance by design' },
      { pattern: 'Accessibility als Designpflicht', message: 'requires A11y by design' },
      { pattern: 'npm run test:pr:report', message: 'documents PR fast report gate' },
      { pattern: 'npm run test:release:full:report', message: 'documents full release report gate' },
      { pattern: 'npm run test:docs-rmt-pilot', message: 'documents Docs RMT pilot gate' },
      { pattern: 'Epic 11 Enterprise UX Handoff', message: 'documents Epic 11 handoff' },
      { pattern: 'npm run pack:dry-run', message: 'documents package dry-run gate' },
      { pattern: 'private: true', message: 'keeps publish boundary visible' },
      { pattern: 'ER-WP-40` ist ebenfalls abgeschlossen', message: 'records completed Docs-App RMT pilot' },
      { pattern: 'WP-E11-18` ist abgeschlossen', message: 'records completed Epic 11 Enterprise UX Handoff' }
    ]
  },
  {
    path: 'docs/manifest.md',
    label: 'Manifest documentation',
    contracts: [
      { pattern: 'components/manifest.json', message: 'documents default manifest path' },
      { pattern: '"xstate": "./xstate.js"', message: 'uses local xstate manifest example' },
      { pattern: '"x-theme": "./xtheme.js"', message: 'uses local theme manifest example' },
      { pattern: 'CDN-URLs sind kein Standard- oder Testpfad', message: 'documents CDN removal from default paths' },
      { pattern: 'xtend.security.manifest-policy.v1', message: 'documents manifest security policy' },
      { pattern: 'xtend.security.import-policy.v1', message: 'documents import security policy' },
      { pattern: 'node scripts/run_xtend_tests.js manifest-import-policy --json', message: 'documents manifest policy gate' },
      { pattern: './xtend-loader.md', message: 'links loader docs' }
    ]
  },
  {
    path: 'docs/xtend-loader.md',
    label: 'XTend Loader documentation',
    contracts: [
      { pattern: 'xtend-loader.js', message: 'documents canonical loader' },
      { pattern: 'xtend-dev.js', message: 'documents legacy stub' },
      { pattern: 'data-manifest', message: 'documents manifest override' },
      { pattern: 'window.__XTendLoaderBootPromise', message: 'documents loader boot promise' },
      { pattern: '"xstate": "./xstate.js"', message: 'uses local manifest example' },
      { pattern: 'Seit `ER-WP-03`', message: 'documents ER-WP-03 CDN removal' },
      { pattern: 'Seit `ER-WP-05`', message: 'documents ER-WP-05 demo and fixture migration' },
      { pattern: 'Seit `ER-WP-28`', message: 'documents ER-WP-28 manifest import hardening' },
      { pattern: 'xtend.security.import-policy.v1', message: 'documents import policy contract' },
      { pattern: 'xtend.security.import.refused', message: 'documents import refusal diagnostic' },
      { pattern: 'node scripts/run_xtend_tests.js manifest-import-policy --json', message: 'documents manifest policy gate' },
      { pattern: 'Core-Komponenten und Browser-Fixtures repo-lokale XTend-Pfade', message: 'documents local core paths' }
    ]
  },
  {
    path: 'docs/api.md',
    label: 'API documentation',
    contracts: [
      { pattern: 'window.XTend.compliance', message: 'documents compliance API' },
      { pattern: 'xstate.get(\'ui\')', message: 'documents UI state aggregate' },
      { pattern: 'xtend.component.x-dialog.<id>.open', message: 'documents canonical dialog key' },
      { pattern: 'xtend.component.x-modal.<id>.open', message: 'documents canonical modal key' },
      { pattern: 'createRmtFormat', message: 'documents XTendRMT format factory' },
      { pattern: 'createRmtStateSchedulerDiagnosticsBridge', message: 'documents XTendRMT bridge factory' },
      { pattern: './xtendrmt-runtime-bridge.md', message: 'links runtime bridge guide' }
    ]
  },
  {
    path: 'docs/core-migration-guide.md',
    label: 'Core migration guide',
    contracts: [
      { pattern: 'Legacy zu kanonisch', message: 'documents legacy-to-canonical mapping' },
      { pattern: 'window.XTend.*', message: 'prefers namespaced XTend APIs' },
      { pattern: 'development/XTend-Core-Compliance-Checklist.md', message: 'links compliance checklist' },
      { pattern: 'RMT-Templating-Migration ab Epic 04', message: 'documents RMT templating migration section' },
      { pattern: 'RMT-Templating ist additiv und opt-in', message: 'documents additive opt-in migration' },
      { pattern: 'development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md', message: 'links RMT migration guardrails' },
      { pattern: 'docs/xtendrmt-overview.md', message: 'links XTendRMT overview' },
      { pattern: 'docs/xtendrmt-native-authoring.md', message: 'links native RMT authoring guide' },
      { pattern: 'docs/xtendrmt-app-dsl.md', message: 'links App-DSL reference' },
      { pattern: 'docs/xtendrmt-runtime-bridge.md', message: 'links runtime bridge guide' },
      { pattern: 'docs/xtendrmt-migration-guide.md', message: 'links native RMT migration guide' },
      { pattern: 'docs/xtendrmt-parsedown-scheduling.md', message: 'links Parsedown scheduling pilot' },
      { pattern: 'XTend neben React/Vue', message: 'covers mixed host migration path' },
      { pattern: 'bridgeRuntime: reserved-for-Epic-05', message: 'keeps historical bridge runtime note in migration guide' },
      { pattern: 'Native RMT Routes und Components ab Epic 05', message: 'documents native Epic 05 migration target' },
      { pattern: 'manifest.metadata.routes -> routes', message: 'documents route metadata migration' }
    ]
  },
  {
    path: 'docs/xtend-fabric.md',
    label: 'XTend-Fabric runtime docs',
    contracts: [
      { pattern: 'xtend.docs.xtend-fabric.v1', message: 'declares Fabric docs contract' },
      { pattern: 'fabric/xtend-fabric.js', message: 'documents Fabric runtime entry' },
      { pattern: 'window.XTendFabric', message: 'documents browser namespace' },
      { pattern: 'createXtendFabric', message: 'documents Fabric factory' },
      { pattern: 'runFiber', message: 'documents fiber runner' },
      { pattern: 'emitDiagnostic', message: 'documents diagnostic emitter' },
      { pattern: 'wrapComponent', message: 'documents component wrapper' },
      { pattern: 'registerReporter', message: 'documents reporter opt-in' },
      { pattern: 'createReporterAdapter(options)', message: 'documents reporter adapter factory' },
      { pattern: 'createConsoleReporter(options)', message: 'documents console reporter factory' },
      { pattern: 'createTestReporter(options)', message: 'documents test reporter factory' },
      { pattern: 'createRuntimeDiagnosticsBridge(options)', message: 'documents runtime diagnostics bridge factory' },
      { pattern: 'createComponentFiberInstrumentation(componentRef, options)', message: 'documents component fiber instrumentation factory' },
      { pattern: 'createRouteFiberInstrumentation(routerRef, options)', message: 'documents route fiber instrumentation factory' },
      { pattern: 'createTelemetrySnapshot(options)', message: 'documents telemetry snapshot factory' },
      { pattern: 'publishTelemetrySnapshot(snapshotOrOptions, options)', message: 'documents telemetry snapshot publisher' },
      { pattern: 'createBackpressureSignal(signal, defaults)', message: 'documents backpressure signal factory' },
      { pattern: 'connectRmtDiagnostics', message: 'documents RMT diagnostics connector' },
      { pattern: 'createComponentLifecycleBoundary', message: 'documents lifecycle boundary factory' },
      { pattern: 'wrapEventHandler', message: 'documents event handler wrapper' },
      { pattern: 'xtend.fabric.api.v1', message: 'documents Fabric API contract' },
      { pattern: 'xtend.fabric.diagnostic.v1', message: 'documents Fabric diagnostic contract' },
      { pattern: 'xtend.fabric.reporter.v1', message: 'documents Fabric reporter contract' },
      { pattern: 'xtend.fabric.redaction.v1', message: 'documents Fabric redaction contract' },
      { pattern: 'xtend.fabric.fiber.v1', message: 'documents Fabric fiber contract' },
      { pattern: 'xtend.fabric.lane.v1', message: 'documents Fabric lane contract' },
      { pattern: 'xtend.fabric.lifecycle-error-boundary.v1', message: 'documents lifecycle boundary contract' },
      { pattern: 'xtend.fabric.runtime-diagnostics-bridge.v1', message: 'documents runtime diagnostics bridge contract' },
      { pattern: 'xtend.fabric.component-fiber-instrumentation.v1', message: 'documents component fiber instrumentation contract' },
      { pattern: 'xtend.fabric.route-fiber-instrumentation.v1', message: 'documents route fiber instrumentation contract' },
      { pattern: 'xtend.fabric.telemetry-snapshot.v1', message: 'documents telemetry snapshot contract' },
      { pattern: 'xtend.fabric.backpressure-signal.v1', message: 'documents backpressure signal contract' },
      { pattern: 'xtend.fabric.hydration-policy.v1', message: 'documents Hydration Policy contract' },
      { pattern: 'xtend.performance.measurement.v1', message: 'documents performance measurement contract' },
      { pattern: 'xtend.fabric.component.lifecycle.failed', message: 'documents lifecycle diagnostic code' },
      { pattern: 'xtend.fabric.component.hydrate.failed', message: 'documents hydration diagnostic code' },
      { pattern: 'xtend.fabric.route.render.failed', message: 'documents route render diagnostic code' },
      { pattern: 'xtend.fabric.reporter.failed', message: 'documents reporter failure diagnostic code' },
      { pattern: 'xtend.fabric.xstate.connected', message: 'documents xstate bridge diagnostic code' },
      { pattern: 'xtend.fabric.api.connected', message: 'documents API bridge diagnostic code' },
      { pattern: 'xtend.rmt.bridge.adapter.result.degraded', message: 'documents normalized RMT bridge diagnostic code' },
      { pattern: 'xtend.fabric.telemetry.snapshot', message: 'documents telemetry snapshot diagnostic code' },
      { pattern: 'component.idle.hydrate', message: 'documents idle hydration schedule' },
      { pattern: 'component.lazy.hydrate', message: 'documents lazy hydration schedule' },
      { pattern: 'ui.user-blocking.input', message: 'documents route navigation schedule' },
      { pattern: 'route.transition.render', message: 'documents transition route render schedule' },
      { pattern: 'xtend.fabric.rmt-lane-mapping.v1', message: 'links Fabric RMT lane mapping contract' },
      { pattern: './xtend-fabric-rmt-lane-mapping.md', message: 'links Fabric RMT lane mapping docs' },
      { pattern: './performance.md', message: 'links Performance authoring docs' },
      { pattern: './performance-measurements.md', message: 'links Performance Measurements docs' },
      { pattern: './performance-regression.md', message: 'links Performance Regression docs' },
      { pattern: './hydration-policies.md', message: 'links Hydration Policies docs' },
      { pattern: 'performance.phaseSummary', message: 'documents performance phase summary' },
      { pattern: 'node scripts/run_xtend_tests.js fabric --json', message: 'documents Fabric gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-lane-mapping --json', message: 'documents Fabric lane mapping gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-lifecycle-boundary --json', message: 'documents lifecycle boundary gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-reporters --json', message: 'documents reporter adapter gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-runtime-bridge --json', message: 'documents runtime bridge gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-component-fibers --json', message: 'documents component fiber gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-route-fibers --json', message: 'documents route fiber gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json', message: 'documents telemetry snapshot gate' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-performance-measurements --json', message: 'documents performance measurement gate' },
      { pattern: 'node scripts/run_xtend_tests.js performance-regression --json', message: 'documents performance regression gate' },
      { pattern: 'node scripts/run_xtend_tests.js hydration-policy --json', message: 'documents hydration policy gate' },
      { pattern: 'npm run test:fabric', message: 'documents package script' },
      { pattern: 'npm run test:fabric-lifecycle', message: 'documents lifecycle package script' },
      { pattern: 'npm run test:fabric-reporters', message: 'documents reporter package script' },
      { pattern: 'npm run test:fabric-runtime-bridge', message: 'documents runtime bridge package script' },
      { pattern: 'npm run test:fabric-component-fibers', message: 'documents component fiber package script' },
      { pattern: 'npm run test:fabric-route-fibers', message: 'documents route fiber package script' },
      { pattern: 'npm run test:fabric-telemetry', message: 'documents telemetry snapshot package script' },
      { pattern: 'npm run test:fabric-performance', message: 'documents performance measurement package script' },
      { pattern: 'npm run test:performance', message: 'documents performance regression package script' },
      { pattern: 'npm run test:hydration-policy', message: 'documents hydration policy package script' }
    ]
  },
  {
    path: 'docs/performance.md',
    label: 'Performance authoring docs',
    contracts: [
      { pattern: 'Performance fuer Komponentenautoren', message: 'declares performance authoring docs heading' },
      { pattern: 'xtend.docs.performance-authoring.v1', message: 'declares docs contract' },
      { pattern: 'xtend.scaffold.performance-policy.v1', message: 'documents scaffold performance policy' },
      { pattern: 'xtend.performance.component-profile.v1', message: 'documents component performance profile contract' },
      { pattern: 'xtend.performance.budget-matrix.v1', message: 'documents budget matrix contract' },
      { pattern: 'xtend.performance.measurement.v1', message: 'documents measurement contract' },
      { pattern: 'xtend.performance.regression-gate.v1', message: 'documents regression gate contract' },
      { pattern: 'xtend.fabric.hydration-policy.v1', message: 'documents hydration policy contract' },
      { pattern: 'DOM-Regeln', message: 'documents DOM performance rules' },
      { pattern: 'Event-Regeln', message: 'documents event performance rules' },
      { pattern: 'Shadow DOM', message: 'documents Shadow DOM performance rules' },
      { pattern: 'Layout und Animation', message: 'documents layout and animation rules' },
      { pattern: 'xtendScaffoldPerformanceProfile', message: 'documents source performance getter' },
      { pattern: 'performanceProfile', message: 'documents manifest performance key' },
      { pattern: 'node scripts/run_xtend_tests.js performance-regression --json', message: 'documents performance regression gate' }
    ]
  },
  {
    path: 'docs/performance-measurements.md',
    label: 'Performance Measurements docs',
    contracts: [
      { pattern: 'Performance Measurements', message: 'declares performance docs heading' },
      { pattern: 'xtend.performance.measurement.v1', message: 'documents performance measurement contract' },
      { pattern: 'xtend.loader.manifest', message: 'documents loader manifest measure' },
      { pattern: 'xtend.component.hydrate', message: 'documents hydration measure' },
      { pattern: 'xtend.route.render', message: 'documents route render measure' },
      { pattern: 'xtend-loader-performance', message: 'documents loader performance event' },
      { pattern: 'window.__XTendLoaderBootPromise', message: 'documents boot promise measurements' },
      { pattern: 'createTelemetrySnapshot', message: 'documents snapshot usage' },
      { pattern: 'phaseSummary', message: 'documents phase summary' },
      { pattern: 'npm run test:fabric-performance', message: 'documents package script' },
      { pattern: 'npm run test:performance', message: 'documents performance regression package script' }
    ]
  },
  {
    path: 'docs/performance-regression.md',
    label: 'Performance Regression docs',
    contracts: [
      { pattern: 'Performance Regression', message: 'declares performance regression docs heading' },
      { pattern: 'xtend.docs.performance-regression.v1', message: 'declares docs contract' },
      { pattern: 'xtend.performance.regression-gate.v1', message: 'documents gate contract' },
      { pattern: 'xtend.performance.regression-baseline.v1', message: 'documents baseline contract' },
      { pattern: 'xtend.performance.regression-report.v1', message: 'documents report schema' },
      { pattern: 'xtend.performance.measurement.v1', message: 'documents measurement source' },
      { pattern: 'tests/performance/baselines/local-performance-baseline.json', message: 'links deterministic baseline' },
      { pattern: 'npm run test:performance', message: 'documents package script' },
      { pattern: './performance-measurements.md', message: 'links Performance Measurements docs' }
    ]
  },
  {
    path: 'docs/hydration-policies.md',
    label: 'Hydration Policies docs',
    contracts: [
      { pattern: 'xtend.docs.hydration-policies.v1', message: 'declares Hydration Policies docs contract' },
      { pattern: 'xtend.fabric.hydration-policy.v1', message: 'documents Hydration Policy contract' },
      { pattern: 'xtend.fabric.hydration-decision.v1', message: 'documents Hydration Decision contract' },
      { pattern: '`visible`', message: 'documents visible hydration policy' },
      { pattern: '`idle`', message: 'documents idle hydration policy' },
      { pattern: '`lazy`', message: 'documents lazy hydration policy' },
      { pattern: 'component.lazy.hydrate', message: 'documents lazy hydration scheduleRef' },
      { pattern: 'npm run test:hydration-policy', message: 'documents package script' }
    ]
  },
  {
    path: 'docs/a11y-keyboard-smokes.md',
    label: 'A11y Keyboard Smokes docs',
    contracts: [
      { pattern: 'xtend.docs.a11y-keyboard-smokes.v1', message: 'declares A11y keyboard docs contract' },
      { pattern: 'xtend.a11y.browser-keyboard-smoke.v1', message: 'documents browser keyboard smoke contract' },
      { pattern: 'tests/browser/fixtures/a11y-focus-keyboard-smoke.html', message: 'links browser fixture' },
      { pattern: 'window.__xtendA11yKeyboardSmokeResult', message: 'documents browser result key' },
      { pattern: '`Enter` und `Space` navigieren', message: 'documents routing keyboard path' },
      { pattern: 'Initialfokus, Fokusfalle, `Escape` und Fokusrestore', message: 'documents overlay keyboard path' },
      { pattern: 'node scripts/run_xtend_tests.js browser --json', message: 'documents browser gate' },
      { pattern: 'node scripts/run_xtend_tests.js a11y-hydration --json', message: 'documents A11y hydration gate' }
    ]
  },
  {
    path: 'docs/screenreader-signals.md',
    label: 'Screenreader Signals docs',
    contracts: [
      { pattern: 'xtend.docs.screenreader-signals.v1', message: 'declares Screenreader docs contract' },
      { pattern: 'xtend.a11y.screenreader-signals.v1', message: 'documents Screenreader signal contract' },
      { pattern: 'xtend.a11y.screenreader-signal.v1', message: 'documents Screenreader signal record contract' },
      { pattern: '`status-announcement`', message: 'documents status announcement signal' },
      { pattern: '`validation-error-summary`', message: 'documents validation error signal' },
      { pattern: '`dialog-context`', message: 'documents overlay dialog context signal' },
      { pattern: 'a11y.user-blocking.announce', message: 'documents A11y announcement schedule' },
      { pattern: 'npm run test:screenreader-signals', message: 'documents package gate' }
    ]
  },
  {
    path: 'docs/motion-contrast.md',
    label: 'Motion and Contrast docs',
    contracts: [
      { pattern: 'xtend.docs.motion-contrast.v1', message: 'declares Motion and Contrast docs contract' },
      { pattern: 'xtend.a11y.motion-contrast-policy.v1', message: 'documents Motion and Contrast policy contract' },
      { pattern: 'xtend.a11y.motion-policy.v1', message: 'documents Motion policy contract' },
      { pattern: 'xtend.a11y.contrast-policy.v1', message: 'documents Contrast policy contract' },
      { pattern: 'prefers-reduced-motion', message: 'documents reduced motion media query' },
      { pattern: 'forced-colors', message: 'documents forced colors media query' },
      { pattern: 'a11y.user-blocking.preference', message: 'documents A11y preference schedule' },
      { pattern: 'npm run test:motion-contrast', message: 'documents package gate' }
    ]
  },
  {
    path: 'docs/manifest-import-policy.md',
    label: 'Manifest Import Policy docs',
    contracts: [
      { pattern: 'xtend.docs.manifest-import-policy.v1', message: 'declares Manifest Import docs contract' },
      { pattern: 'xtend.security.loader-policy.v1', message: 'documents loader policy contract' },
      { pattern: 'xtend.security.manifest-policy.v1', message: 'documents manifest policy contract' },
      { pattern: 'xtend.security.import-policy.v1', message: 'documents import policy contract' },
      { pattern: 'xtend.security.manifest-import-gate.v1', message: 'documents manifest import gate contract' },
      { pattern: 'security/manifest-import-policy.js', message: 'links machine-readable policy module' },
      { pattern: 'xtend.security.import.refused', message: 'documents import refusal diagnostic' },
      { pattern: 'node scripts/verify_manifest_import_policy.js --json', message: 'documents verify gate' },
      { pattern: 'npm run test:manifest-policy', message: 'documents package script' }
    ]
  },
  {
    path: 'docs/xtend-fabric-rmt-lane-mapping.md',
    label: 'XTend-Fabric RMT lane mapping docs',
    contracts: [
      { pattern: 'xtend.docs.xtend-fabric-rmt-lane-mapping.v1', message: 'declares lane mapping docs contract' },
      { pattern: 'fabric/rmt-lane-mapping.js', message: 'documents mapping runtime entry' },
      { pattern: 'xtend.fabric.rmt-lane-mapping.v1', message: 'documents mapping contract' },
      { pattern: 'xtend.fabric.rmt-lane-schedule.v1', message: 'documents schedule wrapper contract' },
      { pattern: 'a11y` | `user-blocking', message: 'documents a11y to user-blocking mapping' },
      { pattern: 'metadata.fabricLane = "a11y"', message: 'documents preserved Fabric a11y metadata' },
      { pattern: 'component.lazy.hydrate', message: 'documents lazy hydration schedule' },
      { pattern: 'resolveRmtScheduleForFiber', message: 'documents fiber resolver API' },
      { pattern: 'node scripts/run_xtend_tests.js fabric-lane-mapping --json', message: 'documents lane mapping gate' },
      { pattern: 'node scripts/run_xtend_tests.js hydration-policy --json', message: 'documents hydration policy gate' },
      { pattern: 'npm run test:fabric-lanes', message: 'documents package script' },
      { pattern: 'npm run test:hydration-policy', message: 'documents hydration policy package script' }
    ]
  },
  {
    path: 'docs/trusted-dom-sanitizing.md',
    label: 'Trusted DOM and Sanitizing docs',
    contracts: [
      { pattern: 'xtend.docs.trusted-dom-sanitizing.v1', message: 'declares Trusted DOM docs contract' },
      { pattern: 'xtend.security.trusted-dom-policy.v1', message: 'documents Trusted DOM policy contract' },
      { pattern: 'xtend.security.sanitizing-boundary.v1', message: 'documents Sanitizing Boundary contract' },
      { pattern: 'security/trusted-dom-policy.js', message: 'links machine-readable policy module' },
      { pattern: '`htmlFragment`', message: 'classifies HTML fragments' },
      { pattern: '`parsedownHtml`', message: 'classifies Parsedown HTML' },
      { pattern: '`innerHTML`', message: 'restricts innerHTML sink' },
      { pattern: '`insertAdjacentHTML`', message: 'restricts insertAdjacentHTML sink' },
      { pattern: '`template.innerHTML`', message: 'restricts template.innerHTML sink' },
      { pattern: 'xtend.security.sanitizer.missing', message: 'documents sanitizer missing diagnostic' },
      { pattern: './xtendrmt-native-authoring.md', message: 'links native authoring guide' },
      { pattern: './xtendrmt-parsedown-scheduling.md', message: 'links Parsedown scheduling guide' },
      { pattern: './xtendrmt-app-dsl.md', message: 'links App-DSL reference' }
    ]
  },
  {
    path: 'docs/supply-chain-gates.md',
    label: 'Supply-Chain gates docs',
    contracts: [
      { pattern: 'xtend.docs.supply-chain-gates.v1', message: 'declares Supply-Chain docs contract' },
      { pattern: 'xtend.security.supply-chain-gate-plan.v1', message: 'documents Supply-Chain plan contract' },
      { pattern: 'xtend.security.dependency-audit-gate.v1', message: 'documents dependency audit gate' },
      { pattern: 'xtend.security.license-policy.v1', message: 'documents license policy' },
      { pattern: 'xtend.security.vulnerability-policy.v1', message: 'documents vulnerability policy' },
      { pattern: 'xtend.security.release-supply-chain-gate.v1', message: 'documents release gate' },
      { pattern: 'node scripts/verify_supply_chain_policy.js --json', message: 'documents offline verify command' },
      { pattern: 'npm run test:supply-chain', message: 'documents package script' },
      { pattern: 'npm audit --audit-level=moderate', message: 'documents audit CI handoff' },
      { pattern: 'npm sbom --json', message: 'documents SBOM CI handoff' },
      { pattern: 'security/supply-chain-gate-policy.js', message: 'links machine-readable policy module' }
    ]
  },
  {
    path: 'docs/component-catalog-coverage.md',
    label: 'Component Catalog Coverage docs',
    contracts: [
      { pattern: 'xtend.docs.component-catalog-coverage.v1', message: 'declares Component Catalog Coverage docs contract' },
      { pattern: 'xtend.catalog.component-coverage-matrix.v1', message: 'documents coverage matrix contract' },
      { pattern: 'xtend.catalog.component-coverage-gate.v1', message: 'documents coverage gate contract' },
      { pattern: 'npm run test:catalog-coverage', message: 'documents package gate' },
      { pattern: 'node scripts/run_xtend_tests.js catalog-coverage --json', message: 'documents JSON runner gate' },
      { pattern: '41 Komponenten-Dokumente', message: 'documents complete docs coverage' },
      { pattern: '41 Component-Level-Suites', message: 'documents component-suite coverage after SurfaceManager side-panel runtime' },
      { pattern: '41 Public-Type-Artefakte', message: 'documents public type coverage after SurfaceManager side-panel runtime' },
      { pattern: '`xstate` ist als nicht-visuelle Boundary-Probe `contract-gated`', message: 'documents xstate contract-gated catalog status after WP-E12-08' },
      { pattern: 'x-summary', message: 'documents x-summary catalog status' },
      { pattern: '`x-utils` ist als Utility-Boundary `typed-contract-gated`', message: 'documents x-utils typed-contract-gated catalog status after WP-E12-09' },
      { pattern: 'ER-WP-32` | abgeschlossen', message: 'marks naming and docs gaps closed' },
      { pattern: 'ER-WP-33` | abgeschlossen', message: 'marks component-suite priority work completed' },
      { pattern: 'ER-WP-34` | abgeschlossen', message: 'marks public types work completed' },
      { pattern: 'catalog/component-catalog-coverage.js', message: 'links machine-readable module' }
    ]
  },
  {
    path: 'docs/public-component-types.md',
    label: 'Public Component Types docs',
    contracts: [
      { pattern: 'xtend.docs.public-component-types.v1', message: 'declares Public Component Types docs contract' },
      { pattern: 'xtend.enterprise.er-wp-34.public-component-types.v1', message: 'documents ER-WP-34 type contract' },
      { pattern: 'components/xtend-public-types.d.ts', message: 'documents shared public type helpers' },
      { pattern: 'components/xrouter.d.ts', message: 'documents x-router public type artifact' },
      { pattern: 'component-public-types', message: 'documents component public types gate' },
      { pattern: '41 priorisierten `.d.ts`', message: 'documents priority type artifact count after SurfaceManager side-panel runtime' }
    ]
  },
  {
    path: 'docs/visual-browser-regression.md',
    label: 'Visual browser regression docs',
    contracts: [
      { pattern: 'xtend.docs.visual-browser-regression.v1', message: 'declares Visual Browser Regression docs contract' },
      { pattern: 'xtend.catalog.component-regression-priority-plan.v1', message: 'documents regression priority plan contract' },
      { pattern: 'node scripts/run_xtend_tests.js regression-priority --json', message: 'documents regression priority JSON gate' },
      { pattern: 'xtend.epic12.visual-snapshot-automation-contract.v1', message: 'documents Visual Snapshot Automation contract' },
      { pattern: 'node scripts/run_xtend_tests.js visual-snapshot-automation --json', message: 'documents Visual Snapshot Automation gate' },
      { pattern: 'dom-first-pixel-ready', message: 'documents DOM-first Snapshot strategy' },
      { pattern: 'desktop-1280', message: 'documents desktop viewport' },
      { pattern: 'mobile-390', message: 'documents mobile viewport' },
      { pattern: 'forced-colors', message: 'documents forced-colors theme variant' },
      { pattern: 'ER-WP-36', message: 'documents CI handoff' }
    ]
  },
  {
    path: 'docs/xtendrmt-overview.md',
    label: 'XTendRMT overview',
    contracts: [
      { pattern: 'xtend.docs.xtendrmt-overview.v1', message: 'declares overview docs contract' },
      { pattern: 'XTend UI', message: 'documents XTend UI product role' },
      { pattern: 'XTendRMT', message: 'documents XTendRMT product role' },
      { pattern: 'createRmtXRouterAdapter', message: 'documents XRouter adapter factory' },
      { pattern: 'createRmtXtendComponentAdapter', message: 'documents XTend component adapter factory' },
      { pattern: 'createRmtStateSchedulerDiagnosticsBridge', message: 'documents bridge factory' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'links browser smoke fixture' },
      { pattern: 'node scripts/verify_xtendrmt_artifact_parity.js --json', message: 'documents artifact parity gate' },
      { pattern: 'framework-agnostisch', message: 'keeps framework agnostic boundary visible' }
    ]
  },
  {
    path: 'docs/xtendrmt-native-authoring.md',
    label: 'XTendRMT native authoring guide',
    contracts: [
      { pattern: 'xtend.rmt.native-authoring-guide.v1', message: 'declares native authoring guide contract' },
      { pattern: '`adapters`', message: 'documents adapters domain' },
      { pattern: '`components`', message: 'documents components domain' },
      { pattern: '`routes`', message: 'documents routes domain' },
      { pattern: '`schedules`', message: 'documents schedules domain' },
      { pattern: '`xtend.xrouter`', message: 'documents XRouter adapter id' },
      { pattern: '`xtend.component`', message: 'documents XTend component adapter id' },
      { pattern: '`vanilla.component`', message: 'documents non-XTend host adapter id' },
      { pattern: '`createRmtXRouterAdapter`', message: 'documents XRouter adapter factory' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'documents XTend component adapter factory' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'documents bridge factory' },
      { pattern: '`route.visible.render`', message: 'documents route schedule policy' },
      { pattern: '`component.idle.hydrate`', message: 'documents component hydrate policy' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'links browser smoke fixture' },
      { pattern: 'Kernel Boundary', message: 'documents kernel boundary section' },
      { pattern: 'xtend.security.sanitizing-boundary.v1', message: 'documents Trusted DOM boundary' },
      { pattern: 'node scripts/run_xtend_tests.js browser --json', message: 'documents browser gate' },
      { pattern: './xtendrmt-overview.md', message: 'links overview guide' },
      { pattern: './xtendrmt-app-dsl.md', message: 'links App-DSL reference' },
      { pattern: './xtendrmt-runtime-bridge.md', message: 'links runtime bridge guide' },
      { pattern: './trusted-dom-sanitizing.md', message: 'links Trusted DOM docs' }
    ]
  },
  {
    path: 'docs/xtendrmt-app-dsl.md',
    label: 'XTendRMT App-DSL reference',
    contracts: [
      { pattern: 'xtend.docs.xtendrmt-app-dsl.v1', message: 'declares App-DSL docs contract' },
      { pattern: '`adapters`', message: 'documents adapters domain' },
      { pattern: '`components`', message: 'documents components domain' },
      { pattern: '`routes`', message: 'documents routes domain' },
      { pattern: '`schedules`', message: 'documents schedules domain' },
      { pattern: '`templates`', message: 'documents templates domain' },
      { pattern: '`dom_descriptor`', message: 'documents structured template path' },
      { pattern: '`html_fragment`', message: 'documents HTML fragment path' },
      { pattern: 'xtend.security.sanitizing-boundary.v1', message: 'documents Sanitizing Boundary' },
      { pattern: './trusted-dom-sanitizing.md', message: 'links Trusted DOM docs' },
      { pattern: 'componentRegistry.byAdapter["xtend.component"]', message: 'documents component registry index' },
      { pattern: 'routeRegistry.byRouter["xtend.xrouter"]', message: 'documents route registry index' },
      { pattern: 'xtendrmt.component.hydrate', message: 'documents component hydrate endpoint' },
      { pattern: 'rmt.bridge.*', message: 'documents bridge diagnostics group' }
    ]
  },
  {
    path: 'docs/xtendrmt-runtime-bridge.md',
    label: 'XTendRMT runtime bridge',
    contracts: [
      { pattern: 'xtend.docs.xtendrmt-runtime-bridge.v1', message: 'declares runtime bridge docs contract' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'documents XRouter adapter contract' },
      { pattern: 'xtend.rmt.xtend-component-adapter.v1', message: 'documents component adapter contract' },
      { pattern: 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', message: 'documents bridge contract' },
      { pattern: 'xtendrmt/rmt-runtime.browser.js', message: 'documents browser runtime artifact' },
      { pattern: 'window.xtend.rmt', message: 'documents browser classic surface' },
      { pattern: 'createRmtFormat', message: 'documents format factory' },
      { pattern: 'createRmtXRouterAdapter', message: 'documents XRouter adapter factory' },
      { pattern: 'createRmtXtendComponentAdapter', message: 'documents XTend component adapter factory' },
      { pattern: 'createRmtStateSchedulerDiagnosticsBridge', message: 'documents bridge factory' },
      { pattern: 'node scripts/verify_xtendrmt_artifact_parity.js --json', message: 'documents artifact parity gate' }
    ]
  },
  {
    path: 'docs/xtendrmt-migration-guide.md',
    label: 'XTendRMT native migration guide',
    contracts: [
      { pattern: 'xtend.rmt.native-migration-guide.v1', message: 'declares native migration guide contract' },
      { pattern: '`manifest.metadata.routes -> routes`', message: 'documents route metadata migration' },
      { pattern: '`manifest.metadata.components -> components`', message: 'documents component metadata migration' },
      { pattern: '`manifest.metadata.schedules -> schedules`', message: 'documents schedule metadata migration' },
      { pattern: '`createRmtXRouterAdapter`', message: 'documents XRouter factory replacement' },
      { pattern: '`createRmtXtendComponentAdapter`', message: 'documents XTend component factory replacement' },
      { pattern: '`createRmtStateSchedulerDiagnosticsBridge`', message: 'documents bridge factory replacement' },
      { pattern: '`componentRegistry.byAdapter["xtend.component"]`', message: 'documents component registry migration target' },
      { pattern: '`routeRegistry.byRouter["xtend.xrouter"]`', message: 'documents route registry migration target' },
      { pattern: 'Template-only-Dokumente bleiben kompatibel', message: 'keeps template-only compatibility' },
      { pattern: 'React, Vue, Vanilla JS und Custom Hosts', message: 'keeps framework agnostic migration' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'links browser smoke regression' },
      { pattern: './xtendrmt-overview.md', message: 'links overview guide' },
      { pattern: './xtendrmt-app-dsl.md', message: 'links App-DSL reference' },
      { pattern: './xtendrmt-runtime-bridge.md', message: 'links runtime bridge guide' },
      { pattern: './xtendrmt-parsedown-scheduling.md', message: 'links Parsedown scheduling pilot' }
    ]
  },
  {
    path: 'docs/xtendrmt-parsedown-scheduling.md',
    label: 'XTendRMT Parsedown scheduling pilot',
    contracts: [
      { pattern: 'xtend.docs.parsedown-rmt-scheduling.v1', message: 'declares Parsedown scheduling docs contract' },
      { pattern: 'xtend.docs.parsedown-rmt-pilot.v1', message: 'declares Parsedown scheduling pilot contract' },
      { pattern: 'docs/xtendrmt-parsedown-docs.rmt', message: 'documents pilot RMT file' },
      { pattern: 'docs/index.php', message: 'documents docs app PHP host' },
      { pattern: 'docs/utils/parsedown.php', message: 'documents Parsedown parser' },
      { pattern: 'docs/utils/pageloader.js', message: 'documents docs page loader' },
      { pattern: 'tests/rmt/docs_rmt_pilot_suite.js', message: 'documents Docs RMT pilot suite' },
      { pattern: 'window.xtendDocsRmtPilot', message: 'documents host pilot metadata' },
      { pattern: 'window.xtendDocsPagesMeta', message: 'documents per-page metadata' },
      { pattern: 'xtend.docs.parsedown-rmt-render.v1', message: 'documents render metadata contract' },
      { pattern: 'Shell-first', message: 'documents Shell-first Docs render mode' },
      { pattern: 'docs.app.shell', message: 'documents RMT app shell template' },
      { pattern: 'docs.header.search', message: 'documents RMT search template' },
      { pattern: 'window.xtendDocsRmtDocument', message: 'documents embedded RMT document' },
      { pattern: 'docs.media.lazy', message: 'documents lazy media schedule' },
      { pattern: 'xplayerTutorial', message: 'documents future XPlayer tutorial content kind' },
      { pattern: 'docs.parsedown', message: 'documents Parsedown adapter id' },
      { pattern: 'xtendrmt.docs.parsedown.parse', message: 'documents Parsedown scheduler endpoint' },
      { pattern: 'createRmtXRouterAdapter', message: 'documents XRouter adapter boundary' },
      { pattern: 'createRmtXtendComponentAdapter', message: 'documents XTend component adapter boundary' },
      { pattern: 'createRmtStateSchedulerDiagnosticsBridge', message: 'documents bridge boundary' },
      { pattern: 'xtend.security.sanitizing-boundary.v1', message: 'documents Sanitizing Boundary' },
      { pattern: '`parsedownHtml`', message: 'classifies Parsedown HTML output' },
      { pattern: './trusted-dom-sanitizing.md', message: 'links Trusted DOM docs' },
      { pattern: 'Parsedown::setSafeMode(true)', message: 'requires Parsedown SafeMode' },
      { pattern: 'node scripts/run_xtend_tests.js docs-rmt-pilot --json', message: 'documents Docs RMT pilot gate' }
    ]
  },
  {
    path: 'docs/xtendrmt-parsedown-docs.rmt',
    label: 'Docs-App Parsedown RMT pilot document',
    contracts: [
      { pattern: 'xtend.docs.parsedown-rmt-pilot.v1', message: 'declares Docs RMT pilot schema' },
      { pattern: 'docs.xtend.parsedown-pilot', message: 'declares pilot document id' },
      { pattern: 'ER-WP-40', message: 'declares ER-WP-40 ownership' },
      { pattern: 'docs.parsedown', message: 'declares Parsedown adapter' },
      { pattern: 'docs.rich-content', message: 'declares rich content adapter' },
      { pattern: 'docs.page', message: 'declares docs page component' },
      { pattern: 'docs.app.shell', message: 'declares shell template' },
      { pattern: 'docs.header.search', message: 'declares search template' },
      { pattern: 'xtendrmt.shell.render', message: 'declares shell render endpoint' },
      { pattern: 'docs.media.lazy', message: 'declares lazy media schedule' },
      { pattern: 'xplayerTutorial', message: 'declares future XPlayer tutorial content kind' },
      { pattern: 'xtendrmt.docs.parsedown.parse', message: 'declares Parsedown parse endpoint' },
      { pattern: 'xtend.security.sanitizing-boundary.v1', message: 'declares Sanitizing Boundary' },
      { pattern: 'Parsedown::setSafeMode(true)', message: 'documents Parsedown SafeMode host boundary' },
      { pattern: '/enterprise-adoption', message: 'documents Enterprise Adoption route' },
      { pattern: '/xtendrmt-parsedown-scheduling', message: 'documents Parsedown scheduling route' }
    ]
  },
  {
    path: 'docs/XTend-ADR.md',
    label: 'ADR documentation',
    contracts: [
      { pattern: 'node scripts/run_xtend_tests.js architecture', message: 'documents architecture gate' },
      { pattern: 'Digital Twin Principle', message: 'keeps Digital Twin as architecture principle' }
    ]
  },
  {
    path: 'docs/components/xrouter.md',
    label: 'x-router docs',
    contracts: [
      { pattern: 'router-navigate', message: 'documents xstate navigation input' },
      { pattern: 'xtend.router.lastRendered', message: 'documents canonical rendered-route key' },
      { pattern: 'route-changed', message: 'documents canonical route event' },
      { pattern: 'RMT / XTendRMT Adapter', message: 'documents RMT adapter section' },
      { pattern: 'xtend.rmt.xrouter-adapter.v1', message: 'documents XRouter adapter schema' },
      { pattern: 'createRmtXRouterAdapter', message: 'documents XRouter adapter factory' },
      { pattern: 'routeRegistry.byRouter["xtend.xrouter"]', message: 'documents RMT route registry consumption' },
      { pattern: 'registerRoutes', message: 'documents adapter route registration' },
      { pattern: 'data-rmt-schedule', message: 'documents schedule metadata forwarding' }
    ]
  },
  {
    path: 'docs/components/xlink.md',
    label: 'x-link docs',
    contracts: [
      { pattern: 'x-link', message: 'documents x-link component' },
      { pattern: 'href', message: 'documents href contract' },
      { pattern: 'before-navigate', message: 'documents navigation event contract' }
    ]
  },
  {
    path: 'docs/components/xtheme.md',
    label: 'x-theme docs',
    contracts: [
      { pattern: 'window.XTend.theme', message: 'documents namespaced theme API' },
      { pattern: 'window.XTheme', message: 'documents compatibility facade' },
      { pattern: 'xtend.theme.current', message: 'documents canonical theme state key' }
    ]
  },
  {
    path: 'docs/components/xstate.md',
    label: 'xstate docs',
    contracts: [
      { pattern: 'subscribe(fn, keyFilter?)', message: 'documents canonical subscribe contract' },
      { pattern: 'on/off', message: 'documents legacy listener facade' },
      { pattern: 'Boundary-Probe', message: 'documents xstate as a non-visual boundary probe' },
      { pattern: 'xtend.state.boundary-probe.v1', message: 'documents xstate boundary schema' },
      { pattern: 'snapshotDiagnostics()', message: 'documents Fabric diagnostics snapshot API' },
      { pattern: 'createRmtStateAdapter(options?)', message: 'documents RMT state adapter API' },
      { pattern: 'no-rmt-kernel-import-of-xtend-types', message: 'keeps xstate out of the RMT kernel' }
    ]
  },
  {
    path: 'docs/components/xalert.md',
    label: 'x-alert docs',
    contracts: [
      { pattern: 'xtend.component.x-alert.<id>', message: 'documents canonical alert state key' },
      { pattern: 'alert-dismissed', message: 'documents dismiss event' }
    ]
  },
  {
    path: 'docs/components/xtoast.md',
    label: 'x-toast docs',
    contracts: [
      { pattern: 'toast-dismissed', message: 'documents dismiss event' },
      { pattern: 'window.XToast.show()', message: 'documents API entry point' }
    ]
  },
  {
    path: 'docs/components/xdialog.md',
    label: 'x-dialog docs',
    contracts: [
      { pattern: 'xtend.component.x-dialog.<id>.open', message: 'documents canonical dialog state key' },
      { pattern: 'dialog-opened', message: 'documents open event' }
    ]
  },
  {
    path: 'docs/components/xmodal.md',
    label: 'x-modal docs',
    contracts: [
      { pattern: 'xtend.component.x-modal.<id>.open', message: 'documents canonical modal state key' },
      { pattern: 'modal-action', message: 'documents action event' }
    ]
  },
  {
    path: 'docs/components/xsummary.md',
    label: 'x-summary docs',
    contracts: [
      { pattern: '<x-summary>', message: 'documents x-summary element' },
      { pattern: 'xsummary-open-<id>', message: 'documents x-summary state key' },
      { pattern: '`open`', message: 'documents open attribute' },
      { pattern: '`type`', message: 'documents type attribute' },
      { pattern: 'aria-expanded', message: 'documents expanded state' },
      { pattern: 'ER-WP-33', message: 'hands off suite hardening' }
    ]
  },
  {
    path: 'docs/components/xutils.md',
    label: 'x-utils docs',
    contracts: [
      { pattern: 'x-utils', message: 'documents x-utils utility module' },
      { pattern: 'window.XUtils', message: 'documents browser utility surface' },
      { pattern: 'focusTrap', message: 'documents focus helper' },
      { pattern: 'xtend.utility.ui-effects.v1', message: 'documents UI effects contract' },
      { pattern: 'xt-ui-effects="fade-in"', message: 'documents body UI effects control' },
      { pattern: 'tag": "ui-effects"', message: 'documents RMT UI effects tag' },
      { pattern: 'XTemplate', message: 'documents template recipes' },
      { pattern: 'registriert kein `customElements.define()`', message: 'documents non-custom-element contract' },
      { pattern: 'ER-WP-35', message: 'hands off long-tail follow-up' }
    ]
  },
  {
    path: 'docs/previews/README.md',
    label: 'Scaffold preview docs',
    contracts: [
      { pattern: 'XTend Scaffold Previews', message: 'documents scaffold preview heading' },
      { pattern: 'docs/previews/<name>.preview.md', message: 'documents preview path pattern' },
      { pattern: 'External network dependencies are not allowed', message: 'documents local-only preview rule' },
      { pattern: 'node xtend-builder/scaffold.js preview', message: 'documents preview command' }
    ]
  }
];

const DEMO_REFERENCE_CONTRACTS = [
  {
    path: 'index.html',
    label: 'XTend landing demo',
    status: 'automated-static',
    contracts: [
      { pattern: 'type="module" src="xtend-loader.js"', message: 'uses repo-local XTend loader' },
      { pattern: 'href="xtend.css"', message: 'uses repo-local XTend CSS' },
      { pattern: '<x-header', message: 'contains x-header reference' },
      { pattern: '<x-hero', message: 'contains x-hero reference' },
      { pattern: '<x-section', message: 'contains x-section reference' },
      { pattern: '<x-footer', message: 'contains x-footer reference' }
    ]
  },
  {
    path: 'xtendrmt-bestcase.html',
    label: 'XTendRMT bestcase demo',
    status: 'automated-static',
    contracts: [
      { pattern: 'XTendRMT BestCase Demo', message: 'declares bestcase demo title' },
      { pattern: 'type="module" src="xtend-loader.js"', message: 'uses repo-local XTend loader' },
      { pattern: 'data-manifest="components/manifest.json"', message: 'uses repo-local XTend manifest' },
      { pattern: 'name="xtend-preload"', message: 'preloads XTend components through the loader' },
      { pattern: 'window.__XTendLoaderBootPromise', message: 'waits for canonical loader boot before demo runtime' },
      { pattern: "import('./xtendrmt/xtendrmt-bestcase-demo.js')", message: 'loads XTendRMT demo runtime after loader boot' },
      { pattern: '<x-router id="rmt-demo-router"', message: 'contains XRouter reference' },
      { pattern: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', message: 'links the WP-16 browser smoke fixture' },
      { pattern: 'data-rmt-browser-smoke="wp-16"', message: 'marks the WP-16 browser smoke router' },
      { pattern: 'Run cycle', message: 'contains scheduler action reference' }
    ]
  },
  {
    path: 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html',
    label: 'XTendRMT XRouter XTend browser smoke fixture',
    status: 'browser-smoke',
    contracts: [
      { pattern: 'XTendRMT XRouter XTend Browser Smoke Fixture', message: 'declares fixture title' },
      { pattern: 'xtend.rmt.wp16.browser-smoke-fixture.v1', message: 'declares WP-16 browser smoke schema' },
      { pattern: '__xtendRmtBrowserSmokeResult', message: 'exposes browser smoke result key' },
      { pattern: '/xtendrmt/rmt-runtime.browser.js', message: 'loads browser runtime bundle' },
      { pattern: '/components/xrouter.js', message: 'loads XRouter' },
      { pattern: '/components/xsection.js', message: 'loads x-section' },
      { pattern: '/components/xcards.js', message: 'loads x-card' },
      { pattern: 'createRmtXRouterAdapter', message: 'uses productive XRouter adapter' },
      { pattern: 'createRmtXtendComponentAdapter', message: 'uses productive XTend component adapter' },
      { pattern: 'createRmtStateSchedulerDiagnosticsBridge', message: 'uses productive bridge' },
      { pattern: 'vanilla.component', message: 'declares non-XTend component adapter' },
      { pattern: 'xtendrmt.vanilla.mount', message: 'declares vanilla scheduler endpoint' }
    ]
  },
  {
    path: 'xstatetest.html',
    label: 'xstate legacy demo',
    status: 'manual-legacy',
    contracts: [
      { pattern: 'type="module" src="xtend-loader.js"', message: 'uses the local canonical loader even as manual demo' },
      { pattern: 'href="xtend.css"', message: 'uses repo-local XTend CSS' },
      { pattern: 'xstate.subscribe', message: 'demonstrates subscribe path' },
      { pattern: 'xstate.set', message: 'demonstrates set path' },
      { pattern: 'xstate.clear', message: 'demonstrates clear path' }
    ]
  },
  {
    path: 'x-grid-test.html',
    label: 'x-section beta grid demo',
    status: 'manual-legacy',
    contracts: [
      { pattern: './xsection-beta.js', message: 'declares beta local component file' },
      { pattern: '<x-section', message: 'contains x-section references' },
      { pattern: 'toggleTheme()', message: 'contains manual theme toggle reference' }
    ]
  }
];

function assertContracts(context, content, contracts, prefix) {
  contracts.forEach((contract) => {
    const patterns = Array.isArray(contract.patterns) ? contract.patterns : [contract.pattern];
    if (patterns.length === 1) {
      context.assertIncludes(content, patterns[0], `${prefix}: ${contract.message}`);
      return;
    }
    context.assert(
      patterns.some((pattern) => content.includes(pattern)),
      `${prefix}: ${contract.message}`
    );
  });
}

function assertFileExists(context, relativePath, rootDir, message) {
  const fs = require('fs');
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertNoXtendCdnInDefaultCorePaths(context, rootDir) {
  const fs = require('fs');
  const componentDir = resolveRepoPath('components', rootDir);
  const componentFiles = fs.readdirSync(componentDir)
    .filter((file) => /\.(?:js|json)$/.test(file))
    .map((file) => `components/${file}`);
  const defaultPaths = [
    'api.js',
    'index.html',
    'xtendrmt-bestcase.html',
    'docs/index.php',
    'tests/browser/fixtures/core-flows-smoke.html',
    'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html',
    ...componentFiles
  ];

  defaultPaths.forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    context.assert(
      !content.includes('https://cdn.ccs-networks.de/xtend'),
      `Default core path has no XTend CDN dependency: ${relativePath}`
    );
  });

  ['index.html', 'xtendrmt-bestcase.html', 'docs/index.php', 'tests/browser/fixtures/core-flows-smoke.html', 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html'].forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    context.assert(
      !content.includes('xtend-dev.js'),
      `Default browser path does not load legacy xtend-dev.js: ${relativePath}`
    );
  });
}

function assertDemoAndFixtureLoaderMigration(context, rootDir) {
  const canonicalLoaderPaths = [
    'index.html',
    'xtendrmt-bestcase.html',
    'docs/index.php',
    'tests/browser/fixtures/core-flows-smoke.html'
  ];
  const migratedManualDemos = [
    'xstatetest.html',
    'hero.html',
    'masonry.html',
    'xplayerdemo.html',
    'xmasonry.html'
  ];
  const legacyManualReferences = [
    'x-grid-test.html',
    'xcode.html'
  ];

  canonicalLoaderPaths.forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    context.assert(content.includes('xtend-loader.js'), `Default demo or fixture uses canonical xtend-loader.js: ${relativePath}`);
    context.assert(!content.includes('xtend-dev.js'), `Default demo or fixture avoids legacy xtend-dev.js: ${relativePath}`);
    context.assert(!content.includes('https://cdn.ccs-networks.de/xtend'), `Default demo or fixture avoids XTend CDN: ${relativePath}`);
  });

  migratedManualDemos.forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    context.assert(content.includes('xtend-loader.js'), `Migrated manual demo uses canonical xtend-loader.js: ${relativePath}`);
    context.assert(!content.includes('xtend-dev.js'), `Migrated manual demo avoids legacy xtend-dev.js: ${relativePath}`);
    context.assert(!content.includes('https://cdn.ccs-networks.de/xtend'), `Migrated manual demo avoids XTend CDN: ${relativePath}`);
  });

  legacyManualReferences.forEach((relativePath) => {
    const content = readText(relativePath, rootDir);
    context.assert(!content.includes('xtend-dev.js'), `Manual legacy reference avoids legacy loader default: ${relativePath}`);
    context.assert(!content.includes('https://cdn.ccs-networks.de/xtend'), `Manual legacy reference avoids XTend CDN default: ${relativePath}`);
  });
}

function resolveMenuSlugPath(slug) {
  if (slug === 'readme') return 'docs/README.md';
  if (slug === 'components') return 'docs/components.md';
  if (slug === 'xtend-adr') return 'docs/XTend-ADR.md';
  if (slug.startsWith('components-')) {
    return `docs/components/${slug.slice('components-'.length)}.md`;
  }
  return `docs/${slug}.md`;
}

function assertDocsMenuReferences(context, rootDir) {
  const menu = readJson('docs/menu.json', rootDir);
  const slugs = new Set();
  const ids = new Set();

  context.assert(Array.isArray(menu), 'Docs menu is a JSON array');
  menu.forEach((entry) => {
    context.assert(typeof entry.slug === 'string' && entry.slug.length > 0, `Docs menu entry has slug: ${entry.label || 'unlabelled'}`);
    context.assert(typeof entry.id === 'string' && entry.id.startsWith('docs.'), `Docs menu entry has hierarchy id: ${entry.slug}`);
    context.assert(typeof entry.group === 'string' && entry.group.length > 0, `Docs menu entry has group: ${entry.slug}`);
    context.assert(typeof entry.tier === 'string' && entry.tier.length > 0, `Docs menu entry has tier: ${entry.slug}`);
    context.assert(Number.isFinite(Number(entry.rank)), `Docs menu entry has numeric rank: ${entry.slug}`);
    context.assert(!slugs.has(entry.slug), `Docs menu slug is unique: ${entry.slug}`);
    context.assert(!ids.has(entry.id), `Docs menu id is unique: ${entry.id}`);
    slugs.add(entry.slug);
    ids.add(entry.id);
    assertFileExists(context, resolveMenuSlugPath(entry.slug), rootDir, `Docs menu target exists: ${entry.slug}`);
  });
  context.assert(menu.some((entry) => entry.parent), 'Docs menu has parent-child hierarchy metadata');
  context.assert(menu.some((entry) => entry.rank >= 90), 'Docs menu has first-glance high-rank articles');
  context.assert(menu.some((entry) => entry.tier && entry.tier.includes('deep-dive')), 'Docs menu has deep-dive article tiers');
  context.assert(menu.find((entry) => entry.slug === 'components-xcode' && entry.parent === 'components'), 'Docs menu nests component docs under components');
  context.assert(menu.find((entry) => entry.slug === 'xtendrmt-app-dsl' && entry.parent === 'xtendrmt-overview'), 'Docs menu nests RMT deep dives under XTendRMT overview');

  [
    'api',
    'manifest',
    'xtend-loader',
    'core-migration-guide',
    'xtend-fabric',
    'xtend-fabric-rmt-lane-mapping',
    'performance',
    'performance-measurements',
    'performance-regression',
    'hydration-policies',
    'a11y-keyboard-smokes',
    'screenreader-signals',
    'motion-contrast',
    'manifest-import-policy',
    'trusted-dom-sanitizing',
    'supply-chain-gates',
	    'component-catalog-coverage',
	    'public-component-types',
	    'visual-browser-regression',
	    'visual-snapshot-automation',
	    'component-long-tail-migration',
	    'epic11-enterprise-ux-handoff',
	    'enterprise-adoption',
	    'xtendrmt-overview',
    'xtendrmt-native-authoring',
    'xtendrmt-app-dsl',
    'xtendrmt-runtime-bridge',
    'xtendrmt-migration-guide',
    'xtendrmt-parsedown-scheduling',
    'components-xrouter',
    'components-xlink',
    'components-xstate',
    'components-xtheme',
    'components-xselect',
    'components-xcheckbox',
    'components-xradio',
    'components-xtextarea',
    'components-xstatus',
    'components-xprogress',
    'components-xalert',
    'components-xtoast',
    'components-xdialog',
    'components-xmodal',
    'components-xsummary',
    'components-xutils'
  ].forEach((slug) => {
    context.assert(slugs.has(slug), `Docs menu includes prioritized reference slug: ${slug}`);
  });
}

function assertDocumentationReferences(context, rootDir) {
  DOC_REFERENCE_CONTRACTS.forEach((reference) => {
    assertFileExists(context, reference.path, rootDir, `${reference.label} file exists`);
    assertContracts(context, readText(reference.path, rootDir), reference.contracts, reference.label);
  });
}

function assertDemoReferences(context, rootDir) {
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);

  DEMO_REFERENCE_CONTRACTS.forEach((reference) => {
    assertFileExists(context, reference.path, rootDir, `${reference.label} file exists`);
    assertContracts(context, readText(reference.path, rootDir), reference.contracts, reference.label);
    context.assertIncludes(registry, `| \`${reference.path}\` |`, `${reference.label} is listed in reference registry`);
    context.assertIncludes(registry, `| \`${reference.path}\` | ${reference.status} |`, `${reference.label} registry declares ${reference.status} status`);
  });

  assertFileExists(context, 'xsection-beta.js', rootDir, 'x-section beta demo dependency exists');
  context.assertIncludes(registry, '| `docs/previews/README.md` | automated-static |', 'Scaffold preview docs are listed as automated static reference');
  context.assertIncludes(registry, '| `docs/previews/<name>.preview.md` | automated-static-candidate |', 'Scaffold preview path pattern is listed as automated static candidate');
  context.assertIncludes(registry, 'xtend.scaffold.component-preview.v1', 'Reference registry documents scaffold preview schema');
  context.assertIncludes(registry, 'externalNetworkAllowed: false', 'Reference registry documents local-only preview rule');
  context.assertIncludes(registry, 'xtend.scaffold.component-extension-points.v1', 'Reference registry documents scaffold extension schema');
  context.assertIncludes(registry, 'noRuntimeImports', 'Reference registry documents extension runtime boundary');
  context.assertIncludes(registry, 'xtend.scaffold.rmt-compatibility-binding.v1', 'Reference registry documents scaffold RMT compatibility binding schema');
}

function assertRmtReference(context, rootDir) {
  const rmtSchema = readJson('xtendrmt/rmt.schema.json', rootDir);
  const rmt = readJson('xtendrmt/xtendrmt-bestcase-demo.rmt', rootDir);
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const scaffoldBindings = rmtSchema['x-xtendrmt'] && rmtSchema['x-xtendrmt'].scaffoldCompatibilityBindings;
  const pilotModels = rmtSchema['x-xtendrmt'] && rmtSchema['x-xtendrmt'].templatePilotFlowModels;
  const upstreamHandoff = rmtSchema['x-xtendrmt'] && rmtSchema['x-xtendrmt'].upstreamHandoff;
  const adapters = rmt.adapters;
  const routes = rmt.routes;
  const components = rmt.components;
  const schedules = rmt.schedules;
  const templateAuthoring = rmt.manifest && rmt.manifest.metadata && rmt.manifest.metadata.templateAuthoring;
  const rootLifecycle = rmt.manifest && rmt.manifest.metadata && rmt.manifest.metadata.rootLifecycle;
  const hostCapabilities = rmt.manifest && rmt.manifest.metadata && rmt.manifest.metadata.hostCapabilities;
  const scaffoldCompatibility = rmt.manifest && rmt.manifest.metadata && rmt.manifest.metadata.scaffoldCompatibility;
  const pilotFlow = rmt.manifest && rmt.manifest.metadata && rmt.manifest.metadata.pilotFlow;
  const nativeDemoMigration = rmt.manifest && rmt.manifest.metadata && rmt.manifest.metadata.nativeDemoMigration;
  const templates = rmt.templates;
  const templatingRoute = Array.isArray(routes) ? routes.find((route) => route.path === '/templating') : null;
  const templatingRouteComponent = Array.isArray(components) ? components.find((component) => component.id === 'x-rmt-route-template-pilot') : null;
  const pilotSchedule = Array.isArray(schedules) ? schedules.find((schedule) => schedule.id === 'template.visible.inspect') : null;
  const pilotTemplate = Array.isArray(templates) ? templates.find((template) => template.id === 'demo.templating.pilot') : null;
  const pilotAuthoring = pilotTemplate && pilotTemplate.metadata && pilotTemplate.metadata.authoring
    ? pilotTemplate.metadata.authoring
    : {};
  const pilotAttachment = pilotFlow && pilotFlow.componentAttachment ? pilotFlow.componentAttachment : {};

  context.assert(rmt.documentId === 'xtendrmt.bestcase.demo', 'XTendRMT demo document id is stable');
  context.assert(
    Array.isArray(scaffoldBindings) && scaffoldBindings.some((entry) => entry.id === 'xtend.scaffold.rmt-compatibility-binding.v1'),
    'XTendRMT schema documents scaffold RMT compatibility binding reference'
  );
  context.assert(
    Array.isArray(pilotModels) && pilotModels.some((entry) => entry.id === 'xtend.rmt.template-pilot-flow.v1'),
    'XTendRMT schema documents template pilot flow reference'
  );
  context.assert(upstreamHandoff && upstreamHandoff.id === UPSTREAM_HANDOFF_SCHEMA, 'XTendRMT schema documents upstream handoff reference');
  context.assert(upstreamHandoff && upstreamHandoff.sourceOfTruth === 'upstream-rmt-source', 'XTendRMT schema marks upstream source as architecture source of truth');
  context.assert(upstreamHandoff && upstreamHandoff.buildArtifactsAreOutput === true, 'XTendRMT schema keeps build artifacts as output');
  context.assert(upstreamHandoff && upstreamHandoff.handoffSpec === 'development/XTendRMT-Upstream-Handoff-Spezifikation.md', 'XTendRMT schema links upstream handoff specification');
  context.assert(upstreamHandoff && upstreamHandoff.epic === 'development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md', 'XTendRMT schema links Epic 05 handoff target');
  ['adapters', 'components', 'routes', 'schedules', 'templates'].forEach((domain) => {
    context.assert(
      upstreamHandoff && Array.isArray(upstreamHandoff.requiredDomains) && upstreamHandoff.requiredDomains.includes(domain),
      `XTendRMT schema upstream handoff requires ${domain} domain`
    );
  });
  ['host-adapter-contract', 'xtend.component', 'xtend.template', 'xtend.xrouter'].forEach((adapter) => {
    context.assert(
      upstreamHandoff && Array.isArray(upstreamHandoff.requiredAdapters) && upstreamHandoff.requiredAdapters.includes(adapter),
      `XTendRMT schema upstream handoff requires ${adapter} adapter`
    );
  });
  context.assert(
    upstreamHandoff && Array.isArray(upstreamHandoff.requiredGates) && upstreamHandoff.requiredGates.includes(RMT_COMPATIBILITY_GATE),
    'XTendRMT schema upstream handoff requires RMT compatibility gate'
  );
  context.assert(
    upstreamHandoff && Array.isArray(upstreamHandoff.requiredGates) && upstreamHandoff.requiredGates.includes(REFERENCES_GATE),
    'XTendRMT schema upstream handoff requires references gate'
  );
  context.assert(upstreamHandoff && upstreamHandoff.bridgeRuntime === 'reserved-for-Epic-05', 'XTendRMT schema upstream handoff keeps bridge runtime reserved');
  context.assert(
    upstreamHandoff && typeof upstreamHandoff.kernelBoundary === 'string' && upstreamHandoff.kernelBoundary.includes('host-neutral'),
    'XTendRMT schema upstream handoff keeps kernel host-neutral'
  );
  context.assert(nativeDemoMigration && nativeDemoMigration.usesTopLevelDomains === true, 'XTendRMT demo declares native top-level domain migration');
  context.assert(Array.isArray(adapters) && adapters.some((entry) => entry.id === 'xtend.xrouter'), 'XTendRMT demo exposes native XRouter adapter domain record');
  context.assert(Array.isArray(adapters) && adapters.some((entry) => entry.id === 'xtend.component'), 'XTendRMT demo exposes native XTend component adapter domain record');
  context.assert(Array.isArray(adapters) && adapters.some((entry) => entry.id === 'rmt.state-scheduler-diagnostics'), 'XTendRMT demo exposes native State/Scheduler/Diagnostics bridge adapter record');
  context.assert(Array.isArray(routes) && routes.length >= 5, 'XTendRMT demo exposes native route domain');
  context.assert(Array.isArray(routes) && routes.every((entry) => entry.router === 'xtend.xrouter'), 'XTendRMT demo routes target native XRouter adapter');
  context.assert(Array.isArray(components) && components.some((entry) => entry.adapter === 'xtend.component'), 'XTendRMT demo exposes native XTend component domain');
  context.assert(templatingRouteComponent && templatingRouteComponent.tag === 'x-rmt-route-template-pilot', 'XTendRMT demo exposes native templating route component record');
  context.assert(Array.isArray(schedules) && schedules.some((entry) => entry.id === 'route.visible.render'), 'XTendRMT demo exposes native route scheduling policy');
  context.assert(templateAuthoring && templateAuthoring.contractVersion === 'xtend.rmt.template-authoring.v1', 'XTendRMT demo exposes template authoring contract metadata');
  context.assert(templateAuthoring && templateAuthoring.adapter === 'xtend.template', 'XTendRMT demo exposes XTend template adapter metadata');
  context.assert(rootLifecycle && rootLifecycle.contractVersion === 'xtend.rmt.root-handshake.v1', 'XTendRMT demo exposes root handshake contract metadata');
  context.assert(rootLifecycle && rootLifecycle.planner === 'rmt-scheduler' && rootLifecycle.executor === 'xtend-host-adapter', 'XTendRMT demo splits scheduler planner and host executor roles');
  context.assert(
    rootLifecycle && Array.isArray(rootLifecycle.schedulerEndpointHints) && rootLifecycle.schedulerEndpointHints.some((entry) => entry.endpointName === 'xtendrmt.component.hydrate'),
    'XTendRMT demo exposes component hydration endpoint hint'
  );
  context.assert(hostCapabilities && hostCapabilities.contractVersion === 'xtend.rmt.host-capabilities.v1', 'XTendRMT demo exposes host capabilities contract metadata');
  context.assert(
    hostCapabilities && Array.isArray(hostCapabilities.requiredCapabilities) && hostCapabilities.requiredCapabilities.includes('stateBridge'),
    'XTendRMT demo declares required state bridge capability'
  );
  context.assert(
    hostCapabilities && Array.isArray(hostCapabilities.optionalCapabilities) && hostCapabilities.optionalCapabilities.includes('router'),
    'XTendRMT demo declares optional router capability'
  );
  context.assert(
    hostCapabilities && Array.isArray(hostCapabilities.capabilityRefs) && hostCapabilities.capabilityRefs.includes('xtend.hydration'),
    'XTendRMT demo declares hydration capability ref'
  );
  context.assert(hostCapabilities && hostCapabilities.kernelVisible === false, 'XTendRMT demo keeps host capabilities out of kernel visibility');
  context.assert(scaffoldCompatibility && scaffoldCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1', 'XTendRMT demo exposes scaffold RMT compatibility metadata');
  context.assert(
    scaffoldCompatibility && Array.isArray(scaffoldCompatibility.requiredContracts) && scaffoldCompatibility.requiredContracts.includes('xtend.rmt.host-capabilities.v1'),
    'XTendRMT demo scaffold compatibility requires host capabilities contract'
  );
  context.assert(
    scaffoldCompatibility && Array.isArray(scaffoldCompatibility.surfaces) && scaffoldCompatibility.surfaces.includes('preview-plan'),
    'XTendRMT demo scaffold compatibility covers preview plan surface'
  );
  context.assert(scaffoldCompatibility && scaffoldCompatibility.kernelVisible === false, 'XTendRMT demo keeps scaffold compatibility out of kernel visibility');
  context.assert(Array.isArray(templates) && templates.every((entry) => entry.hydration && entry.hydration.mode === 'runtime_render'), 'XTendRMT templates declare runtime hydration');
  context.assert(
    Array.isArray(templates) && templates.every((entry) => entry.metadata && entry.metadata.authoring && entry.metadata.authoring.kernelVisible === false),
    'XTendRMT templates keep XTend authoring metadata out of kernel visibility'
  );
  context.assert(pilotFlow && pilotFlow.contractVersion === 'xtend.rmt.template-pilot-flow.v1', 'XTendRMT demo exposes template pilot flow metadata');
  context.assert(pilotFlow && pilotFlow.status === 'reference-only', 'XTendRMT demo marks template pilot as reference-only');
  context.assert(pilotFlow && pilotFlow.templateRef === 'demo.templating.pilot', 'XTendRMT demo pilot points to stable template ref');
  context.assert(pilotFlow && pilotFlow.bridgeRuntime === 'reserved-for-Epic-05', 'XTendRMT demo pilot keeps bridge runtime reserved');
  context.assert(pilotAttachment.adapter === 'xtend.template', 'XTendRMT demo pilot uses XTend template adapter');
  context.assert(pilotAttachment.componentAdapter === 'xtend.component', 'XTendRMT demo pilot uses XTend component adapter');
  context.assert(Array.isArray(pilotAttachment.componentRefs) && pilotAttachment.componentRefs.includes('pilot.shell'), 'XTendRMT demo pilot attaches pilot shell component ref');
  context.assert(templatingRoute && templatingRoute.component === 'x-rmt-route-template-pilot', 'XTendRMT demo exposes templating route component');
  context.assert(templatingRoute && templatingRoute.template === 'demo.templating.pilot', 'XTendRMT demo templating route points to pilot template');
  context.assert(pilotSchedule && pilotSchedule.endpointName === 'xtendrmt.template.inspect', 'XTendRMT demo exposes template inspect scheduler endpoint');
  context.assert(pilotTemplate && pilotTemplate.mode === 'dom_descriptor', 'XTendRMT demo pilot template uses DOM descriptor mode');
  context.assert(pilotAuthoring.contractVersion === 'xtend.rmt.template-authoring.v1', 'XTendRMT demo pilot template keeps authoring contract');
  context.assert(pilotAuthoring.bridgeRuntime === 'reserved-for-Epic-05', 'XTendRMT demo pilot template keeps bridge runtime reserved');
  context.assertIncludes(registry, '| `xtendrmt/xtendrmt-bestcase-demo.rmt` | automated-static |', 'XTendRMT RMT document is listed as automated static reference');
  context.assertIncludes(registry, 'XTendRMT-Pilot-Flow-RMT-basiertes-XTend-Templating.md', 'XTendRMT template pilot reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.template-pilot-flow.v1', 'Reference registry documents template pilot flow schema');
  context.assertIncludes(registry, 'XTendRMT-Upstream-Handoff-Spezifikation.md', 'XTendRMT upstream handoff reference is listed');
  context.assertIncludes(registry, UPSTREAM_HANDOFF_SCHEMA, 'Reference registry documents upstream handoff schema');
  context.assertIncludes(registry, 'WP-E05-07-Schedules-Domain-als-referenzierbare-Policy-haerten.md', 'XTendRMT schedules policy reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.schedules-domain.v1', 'Reference registry documents schedules domain schema');
  context.assertIncludes(registry, 'WP-E05-08-DSL-Normalisierung-und-Backward-Compatibility-sichern.md', 'XTendRMT DSL normalization reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.dsl-normalization.v1', 'Reference registry documents DSL normalization schema');
  context.assertIncludes(registry, 'WP-E05-09-Route-Registry-und-Component-Registry-vorbereiten.md', 'XTendRMT runtime registry reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.runtime-registry.v1', 'Reference registry documents runtime registry schema');
  context.assertIncludes(registry, 'WP-E05-10-XRouter-Adapter-produktfaehig-implementieren.md', 'XTendRMT XRouter adapter reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.xrouter-adapter.v1', 'Reference registry documents XRouter adapter schema');
  context.assertIncludes(registry, 'WP-E05-11-XTend-Component-Adapter-produktfaehig-implementieren.md', 'XTendRMT XTend component adapter reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.xtend-component-adapter.v1', 'Reference registry documents XTend component adapter schema');
  context.assertIncludes(registry, 'WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md', 'XTendRMT State/Scheduler/Diagnostics bridge reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.state-scheduler-diagnostics-bridge.v1', 'Reference registry documents State/Scheduler/Diagnostics bridge schema');
  context.assertIncludes(registry, 'WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md', 'XTendRMT artifact parity reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.artifact-parity.v1', 'Reference registry documents artifact parity schema');
  context.assertIncludes(registry, 'scripts/verify_xtendrmt_artifact_parity.js', 'Reference registry documents artifact parity gate script');
  context.assertIncludes(registry, 'WP-E05-14-Bestcase-Demo-auf-native-Routes-und-Components-migrieren.md', 'XTendRMT native demo migration reference is listed');
  context.assertIncludes(registry, 'Native RMT-Domains fuer Routen, XTend-Components, Adapter, Schedules', 'Reference registry documents native demo domains');
  context.assertIncludes(registry, 'WP-E05-15-Contract-Schema-und-Runtime-Tests-erweitern.md', 'XTendRMT WP-15 runtime test reference is listed');
  context.assertIncludes(registry, 'tests/fixtures/rmt-app-dsl.native-bridge.rmt', 'Reference registry documents native bridge fixture path');
  context.assertIncludes(registry, 'xtend.rmt.wp15.native-bridge-fixture.v1', 'Reference registry documents native bridge fixture schema');
  context.assertIncludes(registry, 'WP-E05-16-Browser-Smokes-und-Multi-Host-Regression-absichern.md', 'XTendRMT WP-16 browser smoke reference is listed');
  context.assertIncludes(registry, 'tests/browser/fixtures/rmt-xrouter-xtend-smoke.html', 'Reference registry documents WP-16 browser smoke fixture path');
  context.assertIncludes(registry, 'xtend.rmt.wp16.browser-smoke-fixture.v1', 'Reference registry documents WP-16 browser smoke fixture schema');
  context.assertIncludes(registry, 'WP-E05-17-Dokumentation-und-Authoring-Beispiele-schreiben.md', 'XTendRMT WP-17 authoring documentation reference is listed');
  context.assertIncludes(registry, 'docs/xtendrmt-overview.md', 'Reference registry documents XTendRMT overview path');
  context.assertIncludes(registry, 'docs/xtendrmt-native-authoring.md', 'Reference registry documents native authoring guide path');
  context.assertIncludes(registry, 'docs/xtendrmt-app-dsl.md', 'Reference registry documents App-DSL reference path');
  context.assertIncludes(registry, 'docs/xtendrmt-runtime-bridge.md', 'Reference registry documents runtime bridge guide path');
  context.assertIncludes(registry, 'docs/xtendrmt-migration-guide.md', 'Reference registry documents native migration guide path');
  context.assertIncludes(registry, 'docs/xtendrmt-parsedown-scheduling.md', 'Reference registry documents Parsedown scheduling guide path');
  context.assertIncludes(registry, 'docs/xtendrmt-parsedown-docs.rmt', 'Reference registry documents Docs RMT pilot document path');
  context.assertIncludes(registry, 'tests/rmt/docs_rmt_pilot_suite.js', 'Reference registry documents Docs RMT pilot suite path');
  context.assertIncludes(registry, 'xtend.docs.xtendrmt-overview.v1', 'Reference registry documents XTendRMT overview contract');
  context.assertIncludes(registry, 'xtend.docs.xtendrmt-app-dsl.v1', 'Reference registry documents App-DSL docs contract');
  context.assertIncludes(registry, 'xtend.docs.xtendrmt-runtime-bridge.v1', 'Reference registry documents runtime bridge docs contract');
  context.assertIncludes(registry, 'xtend.rmt.native-authoring-guide.v1', 'Reference registry documents native authoring guide contract');
  context.assertIncludes(registry, 'xtend.rmt.native-migration-guide.v1', 'Reference registry documents native migration guide contract');
  context.assertIncludes(registry, 'xtend.docs.parsedown-rmt-scheduling.v1', 'Reference registry documents Parsedown scheduling docs contract');
  context.assertIncludes(registry, 'xtend.docs.parsedown-rmt-pilot.v1', 'Reference registry documents Parsedown scheduling pilot contract');
  context.assertIncludes(registry, 'WP-E05-18-Epic-Abschlussreview-und-KPI-Abnahme.md', 'XTendRMT WP-18 closure review reference is listed');
  context.assertIncludes(registry, 'xtend.rmt.epic05-closure.v1', 'Reference registry documents Epic 05 closure contract');
  context.assertIncludes(registry, 'XTend-Produktreife-Checkpoint-nach-Epic-05.md', 'Reference registry documents product maturity checkpoint path');
  context.assertIncludes(registry, 'xtend.product-maturity.checkpoint.epic05.v1', 'Reference registry documents product maturity checkpoint contract');
  context.assertIncludes(registry, 'XTend-Enterprise-Reife-Implementierungsplan.md', 'Reference registry documents enterprise readiness implementation plan path');
  context.assertIncludes(registry, 'xtend.enterprise-readiness.implementation-plan.v1', 'Reference registry documents enterprise readiness implementation plan contract');
  context.assertIncludes(registry, 'ROADMAP-XTend-Enterprise-Reife.md', 'Reference registry documents enterprise readiness roadmap path');
  context.assertIncludes(registry, 'xtend.enterprise-readiness.roadmap.v1', 'Reference registry documents enterprise readiness roadmap contract');
  context.assertIncludes(registry, 'docs/xtend-fabric.md', 'Reference registry documents XTend-Fabric docs path');
  context.assertIncludes(registry, 'xtend.docs.xtend-fabric.v1', 'Reference registry documents XTend-Fabric docs contract');
  context.assertIncludes(registry, 'docs/xtend-fabric-rmt-lane-mapping.md', 'Reference registry documents XTend-Fabric RMT lane mapping docs path');
  context.assertIncludes(registry, 'xtend.docs.xtend-fabric-rmt-lane-mapping.v1', 'Reference registry documents XTend-Fabric RMT lane mapping docs contract');
  context.assertIncludes(registry, 'docs/manifest.md', 'Reference registry documents manifest docs path');
  context.assertIncludes(registry, 'docs/xtend-loader.md', 'Reference registry documents XTend Loader docs path');
  context.assertIncludes(registry, 'ADR-XTend-Loader-und-Lokale-Entwicklung.md', 'Reference registry documents loader ADR path');
  context.assertIncludes(registry, 'xtend.loader.local-development.adr.v1', 'Reference registry documents loader ADR contract');
  context.assertIncludes(registry, 'ER-WP-01-Loader-Contract-und-Rename-ADR-fuer-xtend-loader-js.md', 'Reference registry documents ER-WP-01 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-01.loader-contract.v1', 'Reference registry documents ER-WP-01 contract');
  context.assertIncludes(registry, 'ER-WP-02-xtend-loader-js-als-kanonischen-ESM-Loader-einfuehren.md', 'Reference registry documents ER-WP-02 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-02.canonical-loader.v1', 'Reference registry documents ER-WP-02 contract');
  context.assertIncludes(registry, 'ER-WP-03-CDN-Fallbacks-aus-Core-Pfaden-entfernen.md', 'Reference registry documents ER-WP-03 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-03.cdn-fallback-removal.v1', 'Reference registry documents ER-WP-03 contract');
  context.assertIncludes(registry, 'ER-WP-04-Lokalen-Dev-Test-Server-produktisieren.md', 'Reference registry documents ER-WP-04 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-04.local-dev-server.v1', 'Reference registry documents ER-WP-04 contract');
  context.assertIncludes(registry, 'xtend.local-dev-server.v1', 'Reference registry documents local dev server contract');
  context.assertIncludes(registry, 'ER-WP-05-Demo-und-Fixture-Pfade-auf-neuen-Loader-migrieren.md', 'Reference registry documents ER-WP-05 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-05.demo-fixture-loader-migration.v1', 'Reference registry documents ER-WP-05 contract');
  context.assertIncludes(registry, 'XTend-Package-Export-und-Release-Strategie.md', 'Reference registry documents package export strategy path');
  context.assertIncludes(registry, 'xtend.package-export.release-strategy.v1', 'Reference registry documents package export strategy contract');
  context.assertIncludes(registry, 'ER-WP-06-Package-Export-und-Release-Strategie-festlegen.md', 'Reference registry documents ER-WP-06 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-06.package-export-release-strategy.v1', 'Reference registry documents ER-WP-06 contract');
  context.assertIncludes(registry, 'README.md', 'Reference registry documents root README path');
  context.assertIncludes(registry, 'CHANGELOG.md', 'Reference registry documents changelog path');
  context.assertIncludes(registry, 'ADR-XTend-Fabric.md', 'Reference registry documents Fabric ADR path');
  context.assertIncludes(registry, 'xtend.fabric.adr.v1', 'Reference registry documents Fabric ADR contract');
  context.assertIncludes(registry, 'ER-WP-07-XTend-Fabric-ADR-und-API-Surface-definieren.md', 'Reference registry documents ER-WP-07 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-07.fabric-api-surface.v1', 'Reference registry documents ER-WP-07 contract');
  context.assertIncludes(registry, 'ER-WP-08-Fabric-Runtime-Skeleton-implementieren.md', 'Reference registry documents ER-WP-08 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-08.fabric-runtime-skeleton.v1', 'Reference registry documents ER-WP-08 contract');
  context.assertIncludes(registry, 'fabric/xtend-fabric.js', 'Reference registry documents Fabric runtime path');
  context.assertIncludes(registry, 'tests/fabric/fabric_runtime_suite.js', 'Reference registry documents Fabric runtime suite path');
  context.assertIncludes(registry, 'XTend-Component-Lifecycle-Error-Boundary.md', 'Reference registry documents lifecycle boundary contract path');
  context.assertIncludes(registry, 'xtend.fabric.lifecycle-error-boundary.v1', 'Reference registry documents lifecycle boundary contract');
  context.assertIncludes(registry, 'ER-WP-09-Component-Lifecycle-Error-Boundary-einfuehren.md', 'Reference registry documents ER-WP-09 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-09.lifecycle-error-boundary.v1', 'Reference registry documents ER-WP-09 contract');
  context.assertIncludes(registry, 'tests/fabric/fabric_lifecycle_boundary_suite.js', 'Reference registry documents lifecycle boundary suite path');
  context.assertIncludes(registry, 'tests/fabric/fixtures/broken-lifecycle.component.js', 'Reference registry documents broken lifecycle fixture path');
  context.assertIncludes(registry, 'XTend-Fabric-Reporter-Adapter-Contract.md', 'Reference registry documents reporter adapter contract path');
  context.assertIncludes(registry, 'xtend.fabric.reporter.v1', 'Reference registry documents reporter adapter contract');
  context.assertIncludes(registry, 'ER-WP-10-Reporter-Adapter-Contract-vorbereiten.md', 'Reference registry documents ER-WP-10 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-10.reporter-adapter-contract.v1', 'Reference registry documents ER-WP-10 contract');
  context.assertIncludes(registry, 'tests/fabric/fabric_reporter_adapter_suite.js', 'Reference registry documents reporter adapter suite path');
  context.assertIncludes(registry, 'XTend-Fabric-Runtime-Diagnostics-Bridge.md', 'Reference registry documents runtime diagnostics bridge contract path');
  context.assertIncludes(registry, 'xtend.fabric.runtime-diagnostics-bridge.v1', 'Reference registry documents runtime diagnostics bridge contract');
  context.assertIncludes(registry, 'ER-WP-11-Fabric-an-xstate-API-und-XTendRMT-Diagnostics-anbinden.md', 'Reference registry documents ER-WP-11 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-11.runtime-diagnostics-bridge.v1', 'Reference registry documents ER-WP-11 contract');
  context.assertIncludes(registry, 'tests/fabric/fabric_runtime_diagnostics_bridge_suite.js', 'Reference registry documents runtime diagnostics bridge suite path');
  context.assertIncludes(registry, 'XTend-Telemetry-Snapshot-und-Backpressure-Contract.md', 'Reference registry documents telemetry snapshot contract path');
  context.assertIncludes(registry, 'xtend.fabric.telemetry-snapshot.v1', 'Reference registry documents telemetry snapshot contract');
  context.assertIncludes(registry, 'xtend.fabric.backpressure-signal.v1', 'Reference registry documents backpressure signal contract');
  context.assertIncludes(registry, 'ER-WP-16-Telemetry-Snapshots-und-Backpressure-Signale-integrieren.md', 'Reference registry documents ER-WP-16 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-16.telemetry-snapshot-backpressure.v1', 'Reference registry documents ER-WP-16 contract');
  context.assertIncludes(registry, 'tests/fabric/fabric_telemetry_snapshot_suite.js', 'Reference registry documents telemetry snapshot suite path');
  context.assertIncludes(registry, 'XTend-Fiber-und-Lane-Contract.md', 'Reference registry documents Fiber/Lane contract path');
  context.assertIncludes(registry, 'xtend.fabric.fiber-lane-contract.v1', 'Reference registry documents Fiber/Lane contract id');
  context.assertIncludes(registry, 'ER-WP-12-Fiber-und-Lane-Contract-spezifizieren.md', 'Reference registry documents ER-WP-12 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-12.fiber-lane-contract.v1', 'Reference registry documents ER-WP-12 contract');
  context.assertIncludes(registry, 'XTend-Fabric-RMT-Lane-Mapping.md', 'Reference registry documents Fabric RMT lane mapping contract path');
  context.assertIncludes(registry, 'xtend.fabric.rmt-lane-mapping.v1', 'Reference registry documents Fabric RMT lane mapping contract');
  context.assertIncludes(registry, 'ER-WP-13-Lane-Mapping-auf-RMT-Schedules-definieren.md', 'Reference registry documents ER-WP-13 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-13.rmt-lane-mapping.v1', 'Reference registry documents ER-WP-13 contract');
  context.assertIncludes(registry, 'fabric/rmt-lane-mapping.js', 'Reference registry documents Fabric RMT lane mapping runtime path');
  context.assertIncludes(registry, 'tests/fabric/fabric_rmt_lane_mapping_suite.js', 'Reference registry documents Fabric RMT lane mapping suite path');
  context.assertIncludes(registry, 'XTend-Component-Fiber-Instrumentierung.md', 'Reference registry documents component fiber instrumentation contract path');
  context.assertIncludes(registry, 'xtend.fabric.component-fiber-instrumentation.v1', 'Reference registry documents component fiber instrumentation contract');
  context.assertIncludes(registry, 'ER-WP-14-Component-Mount-Hydration-als-Fibers-instrumentieren.md', 'Reference registry documents ER-WP-14 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-14.component-fiber-instrumentation.v1', 'Reference registry documents ER-WP-14 contract');
  context.assertIncludes(registry, 'tests/fabric/fabric_component_fiber_suite.js', 'Reference registry documents component fiber suite path');
  context.assertIncludes(registry, 'XTend-Route-Fiber-Instrumentierung.md', 'Reference registry documents route fiber instrumentation contract path');
  context.assertIncludes(registry, 'xtend.fabric.route-fiber-instrumentation.v1', 'Reference registry documents route fiber instrumentation contract');
  context.assertIncludes(registry, 'ER-WP-15-Route-Render-und-XRouter-Navigation-als-Fibers-instrumentieren.md', 'Reference registry documents ER-WP-15 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-15.route-fiber-instrumentation.v1', 'Reference registry documents ER-WP-15 contract');
  context.assertIncludes(registry, 'tests/fabric/fabric_route_fiber_suite.js', 'Reference registry documents route fiber suite path');
  context.assertIncludes(registry, 'XTend-Performance-Budget-Matrix.md', 'Reference registry documents Performance Budget Matrix path');
  context.assertIncludes(registry, 'xtend.performance.budget-matrix.v1', 'Reference registry documents Performance Budget Matrix contract');
  context.assertIncludes(registry, 'ER-WP-17-Performance-Budget-Matrix-fuer-Component-Profile-erstellen.md', 'Reference registry documents ER-WP-17 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-17.performance-budget-matrix.v1', 'Reference registry documents ER-WP-17 contract');
  context.assertIncludes(registry, 'XTend-Performance-Messpunkte-und-Snapshots.md', 'Reference registry documents Performance Measurements contract path');
  context.assertIncludes(registry, 'xtend.performance.measurement.v1', 'Reference registry documents Performance Measurement contract');
  context.assertIncludes(registry, 'ER-WP-18-Loader-und-Hydration-Messpunkte-einfuehren.md', 'Reference registry documents ER-WP-18 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-18.performance-measurements.v1', 'Reference registry documents ER-WP-18 contract');
  context.assertIncludes(registry, 'tests/fabric/fabric_performance_measurement_suite.js', 'Reference registry documents performance measurement suite path');
  context.assertIncludes(registry, 'docs/performance-measurements.md', 'Reference registry documents performance measurement docs path');
  context.assertIncludes(registry, 'XTend-Performance-Regression-Gate.md', 'Reference registry documents Performance Regression Gate path');
  context.assertIncludes(registry, 'xtend.performance.regression-gate.v1', 'Reference registry documents Performance Regression Gate contract');
  context.assertIncludes(registry, 'ER-WP-19-Performance-Regression-Suite-anlegen.md', 'Reference registry documents ER-WP-19 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-19.performance-regression-suite.v1', 'Reference registry documents ER-WP-19 contract');
  context.assertIncludes(registry, 'tests/performance/performance_regression_suite.js', 'Reference registry documents performance regression suite path');
  context.assertIncludes(registry, 'tests/performance/baselines/local-performance-baseline.json', 'Reference registry documents performance regression baseline path');
  context.assertIncludes(registry, 'docs/performance-regression.md', 'Reference registry documents performance regression docs path');
  context.assertIncludes(registry, 'XTend-Hydration-Policy-Contract.md', 'Reference registry documents Hydration Policy contract path');
  context.assertIncludes(registry, 'xtend.fabric.hydration-policy.v1', 'Reference registry documents Hydration Policy contract');
  context.assertIncludes(registry, 'ER-WP-20-Lazy-Idle-Visible-Hydration-Policies-haerten.md', 'Reference registry documents ER-WP-20 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-20.hydration-policy.v1', 'Reference registry documents ER-WP-20 contract');
  context.assertIncludes(registry, 'fabric/hydration-policy.js', 'Reference registry documents hydration policy runtime path');
  context.assertIncludes(registry, 'tests/performance/hydration_policy_suite.js', 'Reference registry documents hydration policy suite path');
  context.assertIncludes(registry, 'docs/hydration-policies.md', 'Reference registry documents hydration policy docs path');
  context.assertIncludes(registry, 'docs/performance.md', 'Reference registry documents Performance authoring docs path');
  context.assertIncludes(registry, 'xtend.docs.performance-authoring.v1', 'Reference registry documents Performance authoring docs contract');
  context.assertIncludes(registry, 'ER-WP-21-Performance-Doku-fuer-Komponentenautoren-schreiben.md', 'Reference registry documents ER-WP-21 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-21.performance-authoring-docs.v1', 'Reference registry documents ER-WP-21 contract');
  context.assertIncludes(registry, 'xtend-builder/performance/component-performance-profile.js', 'Reference registry documents Scaffold Performance module path');
  context.assertIncludes(registry, 'xtend.scaffold.performance-policy.v1', 'Reference registry documents Scaffold Performance policy');
  context.assertIncludes(registry, 'XTend-A11y-Component-Contract.md', 'Reference registry documents A11y Component Contract path');
  context.assertIncludes(registry, 'xtend.a11y.component-contract.v1', 'Reference registry documents A11y Component Contract id');
  context.assertIncludes(registry, 'ER-WP-22-A11y-Component-Contract-1-0-definieren.md', 'Reference registry documents ER-WP-22 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-22.a11y-component-contract.v1', 'Reference registry documents ER-WP-22 contract');
  context.assertIncludes(registry, 'XTend-Scaffold-A11y-Profile-Plan.md', 'Reference registry documents Scaffold A11y Profile Plan path');
  context.assertIncludes(registry, 'xtend.scaffold.a11y-profile-plan.v1', 'Reference registry documents Scaffold A11y Profile Plan contract');
  context.assertIncludes(registry, 'ER-WP-23-Scaffold-Blueprints-um-A11y-Pflichten-erweitern.md', 'Reference registry documents ER-WP-23 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-23.scaffold-a11y-profile.v1', 'Reference registry documents ER-WP-23 contract');
  context.assertIncludes(registry, 'xtend-builder/a11y/component-a11y-profile.js', 'Reference registry documents Scaffold A11y module path');
  context.assertIncludes(registry, 'XTend-Browsernaher-Fokus-und-Keyboard-Smoke-Plan.md', 'Reference registry documents browser-near A11y smoke plan path');
  context.assertIncludes(registry, 'xtend.a11y.browser-keyboard-smoke.v1', 'Reference registry documents browser-near A11y smoke contract');
  context.assertIncludes(registry, 'ER-WP-24-Browsernahe-Fokus-und-Keyboard-Smokes-ausbauen.md', 'Reference registry documents ER-WP-24 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-24.a11y-keyboard-smokes.v1', 'Reference registry documents ER-WP-24 contract');
  context.assertIncludes(registry, 'tests/browser/fixtures/a11y-focus-keyboard-smoke.html', 'Reference registry documents A11y keyboard browser fixture path');
  context.assertIncludes(registry, 'docs/a11y-keyboard-smokes.md', 'Reference registry documents A11y keyboard docs path');
  context.assertIncludes(registry, 'xtend.docs.a11y-keyboard-smokes.v1', 'Reference registry documents A11y keyboard docs contract');
  context.assertIncludes(registry, 'XTend-Screenreader-Signal-Contract.md', 'Reference registry documents Screenreader Signal Contract path');
  context.assertIncludes(registry, 'xtend.a11y.screenreader-signals.v1', 'Reference registry documents Screenreader Signal contract');
  context.assertIncludes(registry, 'ER-WP-25-Screenreader-Signal-Contracts-einfuehren.md', 'Reference registry documents ER-WP-25 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-25.screenreader-signals.v1', 'Reference registry documents ER-WP-25 contract');
  context.assertIncludes(registry, 'a11y/screenreader-signals.js', 'Reference registry documents Screenreader Signal module');
  context.assertIncludes(registry, 'tests/a11y/screenreader_signal_suite.js', 'Reference registry documents Screenreader Signal suite');
  context.assertIncludes(registry, 'docs/screenreader-signals.md', 'Reference registry documents Screenreader Signal docs path');
  context.assertIncludes(registry, 'xtend.docs.screenreader-signals.v1', 'Reference registry documents Screenreader Signal docs contract');
  context.assertIncludes(registry, 'XTend-Motion-und-Contrast-Policy.md', 'Reference registry documents Motion and Contrast policy path');
  context.assertIncludes(registry, 'xtend.a11y.motion-contrast-policy.v1', 'Reference registry documents Motion and Contrast policy contract');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-26.motion-contrast-gates.v1', 'Reference registry documents ER-WP-26 contract');
  context.assertIncludes(registry, 'a11y/motion-contrast-policy.js', 'Reference registry documents Motion and Contrast module');
  context.assertIncludes(registry, 'tests/a11y/motion_contrast_suite.js', 'Reference registry documents Motion and Contrast suite');
  context.assertIncludes(registry, 'docs/motion-contrast.md', 'Reference registry documents Motion and Contrast docs path');
  context.assertIncludes(registry, 'xtend.docs.motion-contrast.v1', 'Reference registry documents Motion and Contrast docs contract');
  context.assertIncludes(registry, 'ADR-XTend-Security-Trust-Boundaries.md', 'Reference registry documents Security Trust Boundary ADR path');
  context.assertIncludes(registry, 'xtend.security.trust-boundaries.adr.v1', 'Reference registry documents Security Trust Boundary contract');
  context.assertIncludes(registry, 'ER-WP-27-Security-ADR-fuer-Loader-Manifest-Templates-und-Events-schreiben.md', 'Reference registry documents ER-WP-27 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-27.security-trust-boundaries.v1', 'Reference registry documents ER-WP-27 contract');
  context.assertIncludes(registry, 'XTend-Manifest-und-Dynamic-Import-Policy.md', 'Reference registry documents Manifest Import policy path');
  context.assertIncludes(registry, 'xtend.security.manifest-import-gate.v1', 'Reference registry documents Manifest Import gate contract');
  context.assertIncludes(registry, 'xtend.security.import-policy.v1', 'Reference registry documents Import policy contract');
  context.assertIncludes(registry, 'ER-WP-28-Manifest-und-Dynamic-Import-Policy-haerten.md', 'Reference registry documents ER-WP-28 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-28.manifest-import-policy.v1', 'Reference registry documents ER-WP-28 contract');
  context.assertIncludes(registry, 'security/manifest-import-policy.js', 'Reference registry documents Manifest Import policy module');
  context.assertIncludes(registry, 'scripts/verify_manifest_import_policy.js', 'Reference registry documents Manifest Import verify script');
  context.assertIncludes(registry, 'tests/security/manifest_import_policy_suite.js', 'Reference registry documents Manifest Import policy suite');
  context.assertIncludes(registry, 'docs/manifest-import-policy.md', 'Reference registry documents Manifest Import docs path');
  context.assertIncludes(registry, 'xtend.docs.manifest-import-policy.v1', 'Reference registry documents Manifest Import docs contract');
  context.assertIncludes(registry, 'XTend-Trusted-DOM-und-Sanitizing-Policy.md', 'Reference registry documents Trusted DOM policy path');
  context.assertIncludes(registry, 'xtend.security.trusted-dom-policy.v1', 'Reference registry documents Trusted DOM policy contract');
  context.assertIncludes(registry, 'xtend.security.sanitizing-boundary.v1', 'Reference registry documents Sanitizing Boundary contract');
  context.assertIncludes(registry, 'xtend.security.markup-classification.v1', 'Reference registry documents Markup Classification contract');
  context.assertIncludes(registry, 'xtend.security.trusted-dom-sink.v1', 'Reference registry documents Trusted DOM Sink contract');
  context.assertIncludes(registry, 'ER-WP-29-Sanitizing-und-Trusted-DOM-Policy-fuer-RMT-und-Docs-vorbereiten.md', 'Reference registry documents ER-WP-29 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-29.trusted-dom-sanitizing.v1', 'Reference registry documents ER-WP-29 contract');
  context.assertIncludes(registry, 'security/trusted-dom-policy.js', 'Reference registry documents Trusted DOM policy module');
  context.assertIncludes(registry, 'docs/trusted-dom-sanitizing.md', 'Reference registry documents Trusted DOM docs path');
  context.assertIncludes(registry, 'xtend.docs.trusted-dom-sanitizing.v1', 'Reference registry documents Trusted DOM docs contract');
  context.assertIncludes(registry, 'XTend-Supply-Chain-Gate-Plan.md', 'Reference registry documents Supply-Chain plan path');
  context.assertIncludes(registry, 'xtend.security.supply-chain-gate-plan.v1', 'Reference registry documents Supply-Chain plan contract');
  context.assertIncludes(registry, 'xtend.security.dependency-audit-gate.v1', 'Reference registry documents dependency audit contract');
  context.assertIncludes(registry, 'xtend.security.license-policy.v1', 'Reference registry documents license policy contract');
  context.assertIncludes(registry, 'xtend.security.vulnerability-policy.v1', 'Reference registry documents vulnerability policy contract');
  context.assertIncludes(registry, 'xtend.security.release-supply-chain-gate.v1', 'Reference registry documents release Supply-Chain gate contract');
  context.assertIncludes(registry, 'ER-WP-30-Dependency-License-und-Vulnerability-Gates-planen.md', 'Reference registry documents ER-WP-30 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-30.supply-chain-gates.v1', 'Reference registry documents ER-WP-30 contract');
  context.assertIncludes(registry, 'security/supply-chain-gate-policy.js', 'Reference registry documents Supply-Chain policy module');
  context.assertIncludes(registry, 'scripts/verify_supply_chain_policy.js', 'Reference registry documents Supply-Chain verify script');
  context.assertIncludes(registry, 'tests/security/supply_chain_policy_suite.js', 'Reference registry documents Supply-Chain suite');
  context.assertIncludes(registry, 'docs/supply-chain-gates.md', 'Reference registry documents Supply-Chain docs path');
  context.assertIncludes(registry, 'xtend.docs.supply-chain-gates.v1', 'Reference registry documents Supply-Chain docs contract');
  context.assertIncludes(registry, 'XTend-Component-Catalog-Coverage-Matrix.md', 'Reference registry documents Component Catalog Coverage Matrix path');
  context.assertIncludes(registry, 'xtend.catalog.component-coverage-matrix.v1', 'Reference registry documents Component Catalog Coverage contract');
  context.assertIncludes(registry, 'xtend.catalog.component-coverage-entry.v1', 'Reference registry documents Component Catalog entry contract');
  context.assertIncludes(registry, 'xtend.catalog.component-coverage-gate.v1', 'Reference registry documents Component Catalog gate contract');
  context.assertIncludes(registry, 'ER-WP-31-Component-Catalog-Coverage-Matrix-erzeugen.md', 'Reference registry documents ER-WP-31 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-31.component-catalog-coverage.v1', 'Reference registry documents ER-WP-31 contract');
  context.assertIncludes(registry, 'XTend-Component-Catalog-Naming-Konvention.md', 'Reference registry documents Component Catalog Naming convention path');
  context.assertIncludes(registry, 'xtend.catalog.naming-convention.v1', 'Reference registry documents Component Catalog Naming convention contract');
  context.assertIncludes(registry, 'ER-WP-32-Naming-und-Doku-Luecken-im-Component-Catalog-schliessen.md', 'Reference registry documents ER-WP-32 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-32.catalog-naming-docs.v1', 'Reference registry documents ER-WP-32 contract');
  context.assertIncludes(registry, 'catalog/component-catalog-coverage.js', 'Reference registry documents Component Catalog module');
  context.assertIncludes(registry, 'tests/catalog/component_catalog_coverage_suite.js', 'Reference registry documents Component Catalog suite');
  context.assertIncludes(registry, 'docs/component-catalog-coverage.md', 'Reference registry documents Component Catalog docs path');
  context.assertIncludes(registry, 'xtend.docs.component-catalog-coverage.v1', 'Reference registry documents Component Catalog docs contract');
  context.assertIncludes(registry, 'docs/components/xsummary.md', 'Reference registry documents x-summary docs path');
  context.assertIncludes(registry, 'docs/components/xutils.md', 'Reference registry documents x-utils docs path');
  context.assertIncludes(registry, 'ER-WP-34-Types-und-Public-Event-Contracts-vervollstaendigen.md', 'Reference registry documents ER-WP-34 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-34.public-component-types.v1', 'Reference registry documents ER-WP-34 contract');
  context.assertIncludes(registry, 'components/xtend-public-types.d.ts', 'Reference registry documents shared public type helper');
  context.assertIncludes(registry, 'tests/components/component_public_types_suite.js', 'Reference registry documents public types suite');
  context.assertIncludes(registry, 'docs/public-component-types.md', 'Reference registry documents public types docs path');
  context.assertIncludes(registry, 'xtend.docs.public-component-types.v1', 'Reference registry documents public types docs contract');
  context.assertIncludes(registry, 'XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md', 'Reference registry documents visual/browser regression plan path');
  context.assertIncludes(registry, 'xtend.catalog.component-regression-priority-plan.v1', 'Reference registry documents regression priority plan contract');
  context.assertIncludes(registry, 'xtend.catalog.component-regression-priority-entry.v1', 'Reference registry documents regression priority entry contract');
  context.assertIncludes(registry, 'xtend.catalog.component-regression-priority-gate.v1', 'Reference registry documents regression priority gate contract');
  context.assertIncludes(registry, 'ER-WP-35-Visuelle-und-browsernahe-Regression-priorisieren.md', 'Reference registry documents ER-WP-35 path');
  context.assertIncludes(registry, 'catalog/component-regression-priority.js', 'Reference registry documents regression priority module');
  context.assertIncludes(registry, 'tests/catalog/component_regression_priority_suite.js', 'Reference registry documents regression priority suite');
  context.assertIncludes(registry, 'docs/visual-browser-regression.md', 'Reference registry documents visual/browser regression docs path');
  context.assertIncludes(registry, 'xtend.docs.visual-browser-regression.v1', 'Reference registry documents visual/browser regression docs contract');
  context.assertIncludes(registry, 'XTend-Visual-Snapshot-Automation-Contract.md', 'Reference registry documents Visual Snapshot Automation contract path');
  context.assertIncludes(registry, 'xtend.epic12.visual-snapshot-automation-contract.v1', 'Reference registry documents Visual Snapshot Automation schema');
  context.assertIncludes(registry, 'tests/browser/visual-snapshot-automation-plan.js', 'Reference registry documents Visual Snapshot Automation plan');
  context.assertIncludes(registry, 'tests/browser/visual_snapshot_automation_suite.js', 'Reference registry documents Visual Snapshot Automation suite');
  context.assertIncludes(registry, 'docs/visual-snapshot-automation.md', 'Reference registry documents Visual Snapshot Automation docs path');
  context.assertIncludes(registry, 'WP-E12-11-Snapshot-Fixture-und-lokalen-Diff-Runner-vorbereiten.md', 'Reference registry documents WP-E12-11 path');
  context.assertIncludes(registry, 'xtend.epic12.visual-snapshot-runner.v1', 'Reference registry documents Visual Snapshots runner schema');
  context.assertIncludes(registry, 'tests/browser/fixtures/visual-snapshots-fixture.html', 'Reference registry documents Visual Snapshots fixture');
  context.assertIncludes(registry, 'tests/browser/visual-baselines/visual-snapshots.dom-baseline.json', 'Reference registry documents Visual Snapshots baseline');
  context.assertIncludes(registry, 'tests/browser/visual_snapshots_suite.js', 'Reference registry documents Visual Snapshots suite');
  context.assertIncludes(registry, '.github/workflows/xtend-default-gates.yml', 'Reference registry documents active CI default gates workflow');
  context.assertIncludes(registry, 'XTend-CI-Default-Gates-Workflow.md', 'Reference registry documents CI default gates workflow contract');
  context.assertIncludes(registry, 'xtend.ci.default-gates.v1', 'Reference registry documents CI default gates contract');
  context.assertIncludes(registry, 'ER-WP-36-CI-Workflow-fuer-Default-Gates-anlegen.md', 'Reference registry documents ER-WP-36 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-36.ci-default-gates.v1', 'Reference registry documents ER-WP-36 contract');
  context.assertIncludes(registry, 'XTend-CI-Gate-Matrix.md', 'Reference registry documents CI gate matrix contract');
  context.assertIncludes(registry, 'xtend.ci.gate-matrix.v1', 'Reference registry documents CI gate matrix schema');
  context.assertIncludes(registry, 'ER-WP-37-Schnelle-PR-Gates-und-volle-Release-Gates-trennen.md', 'Reference registry documents ER-WP-37 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-37.ci-gate-matrix.v1', 'Reference registry documents ER-WP-37 contract');
  context.assertIncludes(registry, 'XTend-Release-Checklist-und-SemVer-Policy.md', 'Reference registry documents release checklist policy path');
  context.assertIncludes(registry, 'xtend.release.checklist-semver-policy.v1', 'Reference registry documents release checklist policy schema');
  context.assertIncludes(registry, 'ER-WP-38-Release-Checklist-und-SemVer-Policy-schreiben.md', 'Reference registry documents ER-WP-38 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-38.release-checklist-semver-policy.v1', 'Reference registry documents ER-WP-38 contract');
  context.assertIncludes(registry, 'xtend.releaseChecklist', 'Reference registry documents release checklist package metadata');
  context.assertIncludes(registry, 'docs/enterprise-adoption.md', 'Reference registry documents Enterprise Adoption guide path');
  context.assertIncludes(registry, 'xtend.docs.enterprise-adoption.v1', 'Reference registry documents Enterprise Adoption guide contract');
  context.assertIncludes(registry, 'XTend-Epic12-Docs-Migration-und-Adoption-Guide.md', 'Reference registry documents Epic 12 docs adoption contract path');
  context.assertIncludes(registry, 'xtend.epic12.docs-adoption.v1', 'Reference registry documents Epic 12 docs adoption schema');
  context.assertIncludes(registry, 'catalog/epic12-docs-adoption.js', 'Reference registry documents Epic 12 docs adoption module');
  context.assertIncludes(registry, 'docs/rc0-adoption-guide.md', 'Reference registry documents RC0 Adoption Guide docs path');
  context.assertIncludes(registry, 'tests/docs/epic12_docs_adoption_suite.js', 'Reference registry documents Epic 12 docs adoption suite');
  context.assertIncludes(registry, 'ER-WP-39-Enterprise-Adoption-Guide-schreiben.md', 'Reference registry documents ER-WP-39 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-39.enterprise-adoption-guide.v1', 'Reference registry documents ER-WP-39 contract');
  context.assertIncludes(registry, 'xtend.enterpriseAdoption', 'Reference registry documents Enterprise Adoption package metadata');
  context.assertIncludes(registry, 'ER-WP-40-Docs-App-mit-RMT-Parsedown-Scheduling-pilotieren.md', 'Reference registry documents ER-WP-40 path');
  context.assertIncludes(registry, 'xtend.enterprise.er-wp-40.docs-rmt-parsedown-pilot.v1', 'Reference registry documents ER-WP-40 contract');
  context.assertIncludes(registry, 'xtend.docsRmtPilot', 'Reference registry documents Docs RMT pilot package metadata');
  context.assertIncludes(registry, 'XTend-Test-Reporting-und-CI-Vorbereitung.md', 'Reference registry documents test reporting CI docs');
  context.assertIncludes(registry, 'xtend-pr-gate-report-node-26', 'Reference registry documents PR gate report artifact');
  context.assertIncludes(registry, 'xtend-release-gate-report-node-26', 'Reference registry documents release gate report artifact');
}

function assertScaffoldConfigReference(context, rootDir) {
  const configPath = 'xtend-builder/scaffold.config.js';
  const absoluteConfigPath = resolveRepoPath(configPath, rootDir);

  assertFileExists(context, configPath, rootDir, 'Scaffold config file exists');

  let config;
  try {
    delete require.cache[require.resolve(absoluteConfigPath)];
    config = require(absoluteConfigPath);
    context.pass('Scaffold config loads through CommonJS');
  } catch (error) {
    context.fail(`Scaffold config loads through CommonJS (${error.message})`);
    return;
  }

  const requiredArtifacts = Array.isArray(config.requiredArtifacts) ? config.requiredArtifacts : [];
  const profiles = Array.isArray(config.componentTestProfiles) ? config.componentTestProfiles : [];
  const obligation = config.testObligation || {};
  const requiredSuites = Array.isArray(obligation.requiredSuites) ? obligation.requiredSuites : [];
  const coreSuites = Array.isArray(obligation.coreSuitesForRuntimeChanges) ? obligation.coreSuitesForRuntimeChanges : [];
  const reviewActors = Array.isArray(obligation.reviewActors) ? obligation.reviewActors : [];
  const tooling = config.tooling || {};
  const entryPoints = config.entryPoints || {};
  const binAliases = Array.isArray(entryPoints.binAliases) ? entryPoints.binAliases : [];
  const moduleLayout = config.moduleLayout || {};
  const namingConventions = config.namingConventions || {};
  const commandNames = Array.isArray(namingConventions.commandNames) ? namingConventions.commandNames : [];
  const commandAliases = namingConventions.commandAliases || {};
  const componentBlueprint = config.blueprints && config.blueprints.component ? config.blueprints.component : {};
  const componentBlueprintArtifacts = Array.isArray(componentBlueprint.requiredArtifacts) ? componentBlueprint.requiredArtifacts : [];
  const generatorConfig = config.generators || {};
  const templateLoader = config.templateLoader || {};
  const typingConfig = config.typing || {};
  const typescriptBlueprintConfig = config.typescriptComponentBlueprint || {};
  const previewConfig = config.preview || {};
  const rmtCompatibilityConfig = config.rmtCompatibility || {};
  const extensionsConfig = config.extensions || {};
  const a11yConfig = config.a11y || {};
  const performanceConfig = config.performance || {};
  const workflowConfig = config.workflows || {};
  const workflowCommands = Array.isArray(workflowConfig.commands) ? workflowConfig.commands : [];
  const workflowScripts = Array.isArray(workflowConfig.npmScripts) ? workflowConfig.npmScripts : [];
  const workflowOutputModes = Array.isArray(workflowConfig.outputModes) ? workflowConfig.outputModes : [];
  const wiringConfig = config.wiring || {};
  const manifestWiring = wiringConfig.manifest || {};
  const hydrationWiring = wiringConfig.hydration || {};
  const featureWiring = wiringConfig.features || {};
  const hydrationCallbacks = Array.isArray(hydrationWiring.lifecycleCallbacks) ? hydrationWiring.lifecycleCallbacks : [];
  const hydrationMethods = Array.isArray(hydrationWiring.minimumMethods) ? hydrationWiring.minimumMethods : [];
  const featureForbiddenState = Array.isArray(featureWiring.forbiddenStateFacades) ? featureWiring.forbiddenStateFacades : [];
  const featureForbiddenGlobals = Array.isArray(featureWiring.forbiddenGlobalHelpers) ? featureWiring.forbiddenGlobalHelpers : [];
  const scope = config.scope || {};
  const inScope = Array.isArray(scope.inScope) ? scope.inScope : [];
  const outOfScope = Array.isArray(scope.outOfScope) ? scope.outOfScope : [];

  context.assert(config.scaffoldName === 'XTend-Scaffold', 'Scaffold config declares canonical product name');
  context.assert(config.scaffoldRole === 'repo-local-build-environment', 'Scaffold config declares build-environment role');
  context.assert(config.runtimeBoundary === 'generator-only', 'Scaffold config keeps runtime boundary generator-only');
  context.assert(tooling.runtime === 'node', 'Scaffold config declares Node tooling runtime');
  context.assert(tooling.moduleSystem === 'commonjs', 'Scaffold config declares CommonJS module system');
  context.assert(tooling.writeStrategy === 'dry-run-first', 'Scaffold config declares dry-run-first write strategy');
  context.assert(entryPoints.cli === 'xtend-builder/scaffold.js', 'Scaffold config declares CLI entry point');
  context.assert(entryPoints.cliModule === 'xtend-builder/lib/cli.js', 'Scaffold config declares CLI module');
  context.assert(entryPoints.layoutContract === 'xtend-builder/lib/layout.js', 'Scaffold config declares layout contract module');
  context.assert(binAliases.includes('xt'), 'Scaffold config declares xt bin alias');
  context.assert(binAliases.includes('xtend'), 'Scaffold config declares xtend bin alias');
  context.assert(binAliases.includes('xtend-scaffold'), 'Scaffold config declares legacy xtend-scaffold bin alias');
  context.assert(entryPoints.npmScript === 'npm run scaffold', 'Scaffold config declares NPM script entry point');
  context.assert(moduleLayout.blueprints === 'xtend-builder/blueprints/', 'Scaffold config declares blueprints directory');
  context.assert(moduleLayout.generators === 'xtend-builder/generators/', 'Scaffold config declares generators directory');
  context.assert(moduleLayout.templates === 'xtend-builder/templates/', 'Scaffold config declares templates directory');
  context.assert(moduleLayout.wiring === 'xtend-builder/wiring/', 'Scaffold config declares wiring directory');
  context.assert(moduleLayout.typing === 'xtend-builder/typing/', 'Scaffold config declares typing directory');
  context.assert(moduleLayout.preview === 'xtend-builder/preview/', 'Scaffold config declares preview directory');
  context.assert(moduleLayout.extensions === 'xtend-builder/extensions/', 'Scaffold config declares extensions directory');
  context.assert(moduleLayout.a11y === 'xtend-builder/a11y/', 'Scaffold config declares A11y directory');
  context.assert(moduleLayout.performance === 'xtend-builder/performance/', 'Scaffold config declares Performance directory');
  context.assert(moduleLayout.workflows === 'xtend-builder/workflows/', 'Scaffold config declares workflows directory');
  context.assert(moduleLayout.utils === 'xtend-builder/utils/', 'Scaffold config declares utils directory');
  context.assert(namingConventions.componentTagPattern === '^x-[a-z0-9]+(?:-[a-z0-9]+)*$', 'Scaffold config declares component tag naming pattern');
  context.assert(commandNames.includes('layout'), 'Scaffold config declares layout command');
  context.assert(commandNames.includes('blueprint'), 'Scaffold config declares blueprint command');
  context.assert(commandNames.includes('generators'), 'Scaffold config declares generators command');
  context.assert(commandNames.includes('templates'), 'Scaffold config declares templates command');
  context.assert(commandNames.includes('component-plan'), 'Scaffold config declares component-plan command');
  context.assert(commandNames.includes('component-files'), 'Scaffold config declares component-files command');
  context.assert(commandNames.includes('typing'), 'Scaffold config declares typing command');
  context.assert(commandNames.includes('preview'), 'Scaffold config declares preview command');
  context.assert(commandNames.includes('extensions'), 'Scaffold config declares extensions command');
  context.assert(commandNames.includes('workflow'), 'Scaffold config declares workflow command');
  context.assert(commandNames.includes('verify'), 'Scaffold config declares verify command');
  context.assert(commandNames.includes('validate'), 'Scaffold config declares validate command alias');
  context.assert(commandAliases.validate === 'verify', 'Scaffold config maps validate command to verify');
  context.assert(componentBlueprint.schema === 'xtend.scaffold.component-blueprint.v1', 'Scaffold config declares component blueprint schema');
  context.assert(componentBlueprint.contract === 'xtend-builder/blueprints/component-blueprint.contract.js', 'Scaffold config links component blueprint contract');
  context.assert(componentBlueprint.exceptionPolicy === 'documented-exception-required', 'Scaffold config declares documented blueprint exception policy');
  context.assert(generatorConfig.schema === 'xtend.scaffold.generator-registry.v1', 'Scaffold config declares generator registry schema');
  context.assert(generatorConfig.registry === 'xtend-builder/generators/registry.js', 'Scaffold config links generator registry');
  context.assert(generatorConfig.componentFiles === 'xtend-builder/generators/component-files.js', 'Scaffold config links component-files generator');
  context.assert(generatorConfig.componentTyping === 'xtend-builder/typing/component-types.js', 'Scaffold config links component typing generator');
  context.assert(generatorConfig.componentPreview === 'xtend-builder/preview/component-preview.js', 'Scaffold config links component preview generator');
  context.assert(generatorConfig.componentExtensions === 'xtend-builder/extensions/component-extension-points.js', 'Scaffold config links component extension generator');
  context.assert(generatorConfig.componentA11y === 'xtend-builder/a11y/component-a11y-profile.js', 'Scaffold config links component A11y profile generator');
  context.assert(generatorConfig.componentPerformance === 'xtend-builder/performance/component-performance-profile.js', 'Scaffold config links component Performance profile generator');
  context.assert(generatorConfig.mode === 'plan-dry-run-render-type-preview-and-extension-contract', 'Scaffold config exposes plan, render, type, preview and extension contract mode');
  context.assert(generatorConfig.fileOutputMode === 'dry-run-render-with-feature-type-preview-and-extension-wiring', 'Scaffold config keeps component file output dry-run render-only with feature, type, preview and extension wiring');
  context.assert(templateLoader.schema === 'xtend.scaffold.template-registry.v1', 'Scaffold config declares template registry schema');
  context.assert(templateLoader.registry === 'xtend-builder/templates/registry.js', 'Scaffold config links template registry');
  context.assert(templateLoader.loader === 'xtend-builder/templates/loader.js', 'Scaffold config links template loader');
  context.assert(templateLoader.mode === 'render-only-with-WP-E03-11-extension-contract', 'Scaffold config keeps template loader render-only with extension contract');
  context.assert(templateLoader.implementedArtifacts.includes('demo'), 'Scaffold config marks demo template implemented');
  context.assert(templateLoader.implementedArtifacts.includes('ts-source'), 'Scaffold config marks TypeScript source template implemented');
  context.assert(typingConfig.schema === 'xtend.scaffold.component-typing.v1', 'Scaffold config declares component typing schema');
  context.assert(typingConfig.module === 'xtend-builder/typing/component-types.js', 'Scaffold config links component typing module');
  context.assert(typingConfig.rmtAttachmentSchema === 'xtend.scaffold.rmt-attachment.v1', 'Scaffold config declares RMT attachment schema');
  context.assert(typingConfig.mode === 'types-only-no-runtime-imports', 'Scaffold config keeps typing types-only');
  context.assert(typingConfig.exceptionPolicy === 'documented-type-exception-required', 'Scaffold config requires documented type exceptions');
  context.assert(typingConfig.rmtAttachment && typingConfig.rmtAttachment.adapter === 'xtend.component', 'Scaffold config declares XTend component RMT adapter');
  context.assert(typingConfig.rmtAttachment && typingConfig.rmtAttachment.routerAdapter === 'xtend.xrouter', 'Scaffold config declares XRouter RMT adapter');
  context.assert(typingConfig.rmtAttachment && typingConfig.rmtAttachment.templateAdapter === 'xtend.template', 'Scaffold config declares XTend template RMT adapter');
  context.assert(typingConfig.rmtAttachment && typingConfig.rmtAttachment.templateAuthoringContractVersion === 'xtend.rmt.template-authoring.v1', 'Scaffold config declares template authoring contract version');
  context.assert(typingConfig.rmtAttachment && typingConfig.rmtAttachment.rootHandshakeContractVersion === 'xtend.rmt.root-handshake.v1', 'Scaffold config declares root handshake contract version');
  context.assert(typingConfig.rmtAttachment && typingConfig.rmtAttachment.hostCapabilitiesContractVersion === 'xtend.rmt.host-capabilities.v1', 'Scaffold config declares host capabilities contract version');
  context.assert(
    typingConfig.rmtAttachment
      && typingConfig.rmtAttachment.hostCapabilities
      && Array.isArray(typingConfig.rmtAttachment.hostCapabilities.required)
      && typingConfig.rmtAttachment.hostCapabilities.required.includes('stateBridge'),
    'Scaffold config declares required state bridge host capability'
  );
  context.assert(previewConfig.schema === 'xtend.scaffold.component-preview.v1', 'Scaffold config declares component preview schema');
  context.assert(previewConfig.module === 'xtend-builder/preview/component-preview.js', 'Scaffold config links component preview module');
  context.assert(previewConfig.artifact === 'docs/previews/<name>.preview.md', 'Scaffold config declares preview artifact path');
  context.assert(previewConfig.registry === 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md', 'Scaffold config links reference registry');
  context.assert(previewConfig.externalNetworkAllowed === false, 'Scaffold config keeps preview references local-only');
  context.assert(previewConfig.referenceGate === 'node scripts/run_xtend_tests.js references', 'Scaffold config declares preview reference gate');
  context.assert(rmtCompatibilityConfig.schema === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Scaffold config declares RMT compatibility binding schema');
  context.assert(Array.isArray(rmtCompatibilityConfig.surfaces) && rmtCompatibilityConfig.surfaces.includes('workflow'), 'Scaffold config includes workflow in RMT compatibility surfaces');
  context.assert(Array.isArray(rmtCompatibilityConfig.surfaces) && rmtCompatibilityConfig.surfaces.includes('manifest-plan'), 'Scaffold config includes manifest plan in RMT compatibility surfaces');
  context.assert(
    Array.isArray(rmtCompatibilityConfig.requiredContracts) && rmtCompatibilityConfig.requiredContracts.includes('xtend.rmt.root-handshake.v1'),
    'Scaffold config requires root handshake contract for RMT compatibility'
  );
  context.assert(
    Array.isArray(rmtCompatibilityConfig.requiredContracts) && rmtCompatibilityConfig.requiredContracts.includes('xtend.rmt.host-capabilities.v1'),
    'Scaffold config requires host capabilities contract for RMT compatibility'
  );
  context.assert(rmtCompatibilityConfig.minimumGate === 'node scripts/run_xtend_tests.js rmt-compatibility --json', 'Scaffold config declares RMT compatibility minimum gate');
  context.assert(rmtCompatibilityConfig.fullGate === 'npm test', 'Scaffold config declares RMT compatibility full gate');
  context.assert(rmtCompatibilityConfig.noRuntimeImports === true, 'Scaffold config rejects runtime imports for RMT compatibility');
  context.assert(rmtCompatibilityConfig.noProductiveWrites === true, 'Scaffold config rejects productive writes for RMT compatibility');
  context.assert(rmtCompatibilityConfig.noRmtKernelCoupling === true, 'Scaffold config rejects RMT kernel coupling for RMT compatibility');
  context.assert(rmtCompatibilityConfig.bridgeRuntime === 'reserved-for-Epic-05', 'Scaffold config reserves productive bridge runtime for Epic 05');
  context.assert(extensionsConfig.schema === 'xtend.scaffold.component-extension-points.v1', 'Scaffold config declares component extension schema');
  context.assert(extensionsConfig.module === 'xtend-builder/extensions/component-extension-points.js', 'Scaffold config links component extension module');
  context.assert(extensionsConfig.rootLifecycleSchema === 'xtend.scaffold.root-lifecycle.v1', 'Scaffold config declares root lifecycle schema');
  context.assert(extensionsConfig.rootHandshakeContractVersion === 'xtend.rmt.root-handshake.v1', 'Scaffold config declares root handshake extension contract');
  context.assert(Array.isArray(extensionsConfig.rootLifecyclePhases) && extensionsConfig.rootLifecyclePhases.includes('diagnostics'), 'Scaffold config declares root lifecycle phases');
  context.assert(Array.isArray(extensionsConfig.schedulerEndpointHints) && extensionsConfig.schedulerEndpointHints.includes('component.idle.hydrate'), 'Scaffold config declares scheduler endpoint hints');
  context.assert(extensionsConfig.hostCapabilitiesContractVersion === 'xtend.rmt.host-capabilities.v1', 'Scaffold config declares host capabilities extension contract');
  context.assert(Array.isArray(extensionsConfig.hostCapabilities) && extensionsConfig.hostCapabilities.includes('hydration'), 'Scaffold config declares hydration host capability');
  context.assert(extensionsConfig.templateExtensionSchema === 'xtend.scaffold.template-extension.v1', 'Scaffold config declares template extension schema');
  context.assert(extensionsConfig.renderingExtensionSchema === 'xtend.scaffold.rendering-extension.v1', 'Scaffold config declares rendering extension schema');
  context.assert(extensionsConfig.sourceStaticGetter === 'xtendScaffoldExtensionPoints', 'Scaffold config declares extension static getter');
  context.assert(extensionsConfig.templateAdapter === 'xtend.template', 'Scaffold config declares template adapter');
  context.assert(extensionsConfig.templateAuthoringContractVersion === 'xtend.rmt.template-authoring.v1', 'Scaffold config declares template authoring extension contract');
  context.assert(Array.isArray(extensionsConfig.templateAuthoringModes) && extensionsConfig.templateAuthoringModes.includes('dom_descriptor'), 'Scaffold config declares template authoring modes');
  context.assert(extensionsConfig.componentAdapter === 'xtend.component', 'Scaffold config declares extension component adapter');
  context.assert(extensionsConfig.routerAdapter === 'xtend.xrouter', 'Scaffold config declares extension router adapter');
  context.assert(extensionsConfig.noRuntimeImports === true, 'Scaffold config rejects runtime imports for extension points');
  context.assert(extensionsConfig.noRmtKernelCoupling === true, 'Scaffold config rejects RMT kernel coupling for extension points');
  context.assert(a11yConfig.schema === 'xtend.scaffold.a11y-profile-plan.v1', 'Scaffold config declares A11y profile plan schema');
  context.assert(a11yConfig.module === 'xtend-builder/a11y/component-a11y-profile.js', 'Scaffold config links A11y profile module');
  context.assert(a11yConfig.screenreaderSignalsModule === 'a11y/screenreader-signals.js', 'Scaffold config links Screenreader signal module');
  context.assert(a11yConfig.motionContrastModule === 'a11y/motion-contrast-policy.js', 'Scaffold config links Motion and Contrast policy module');
  context.assert(a11yConfig.componentContract === 'xtend.a11y.component-contract.v1', 'Scaffold config declares A11y component contract');
  context.assert(a11yConfig.profileContract === 'xtend.a11y.profile.v1', 'Scaffold config declares A11y profile contract');
  context.assert(a11yConfig.screenreaderSignalsContract === 'xtend.a11y.screenreader-signals.v1', 'Scaffold config declares Screenreader signal contract');
  context.assert(a11yConfig.motionContrastContract === 'xtend.a11y.motion-contrast-policy.v1', 'Scaffold config declares Motion and Contrast policy contract');
  context.assert(a11yConfig.motionPolicyContract === 'xtend.a11y.motion-policy.v1', 'Scaffold config declares Motion policy contract');
  context.assert(a11yConfig.contrastPolicyContract === 'xtend.a11y.contrast-policy.v1', 'Scaffold config declares Contrast policy contract');
  context.assert(a11yConfig.testContract === 'xtend.a11y.test-contract.v1', 'Scaffold config declares A11y test contract');
  context.assert(a11yConfig.sourceStaticGetter === 'xtendScaffoldA11yProfile', 'Scaffold config declares A11y source getter');
  context.assert(a11yConfig.manifestKey === 'a11yProfile', 'Scaffold config declares A11y manifest key');
  context.assert(a11yConfig.screenreaderManifestKey === 'screenreaderSignals', 'Scaffold config declares Screenreader manifest key');
  context.assert(a11yConfig.motionContrastManifestKey === 'motionContrastPolicy', 'Scaffold config declares Motion and Contrast manifest key');
  context.assert(Array.isArray(a11yConfig.requiredDocsSections) && a11yConfig.requiredDocsSections.includes('Screenreader-Signale'), 'Scaffold config requires Screenreader docs section');
  context.assert(Array.isArray(a11yConfig.requiredDocsSections) && a11yConfig.requiredDocsSections.includes('Motion-und-Contrast-Policy'), 'Scaffold config requires Motion and Contrast docs section');
  context.assert(Array.isArray(a11yConfig.requiredFixtureAttributes) && a11yConfig.requiredFixtureAttributes.includes('aria-label'), 'Scaffold config requires A11y fixture attributes');
  context.assert(Array.isArray(a11yConfig.requiredSuites) && a11yConfig.requiredSuites.includes('a11y-hydration'), 'Scaffold config requires A11y hydration suite');
  context.assert(Array.isArray(a11yConfig.requiredSuites) && a11yConfig.requiredSuites.includes('screenreader-signals'), 'Scaffold config requires Screenreader signal suite');
  context.assert(Array.isArray(a11yConfig.requiredSuites) && a11yConfig.requiredSuites.includes('motion-contrast'), 'Scaffold config requires Motion and Contrast suite');
  context.assert(a11yConfig.forcedColors === 'required', 'Scaffold config requires forced-colors support');
  context.assert(a11yConfig.highContrast === 'required', 'Scaffold config requires high contrast support');
  context.assert(performanceConfig.schema === 'xtend.scaffold.performance-policy.v1', 'Scaffold config declares Performance policy schema');
  context.assert(performanceConfig.module === 'xtend-builder/performance/component-performance-profile.js', 'Scaffold config links Performance profile module');
  context.assert(performanceConfig.componentProfileContract === 'xtend.performance.component-profile.v1', 'Scaffold config declares Component Performance profile contract');
  context.assert(performanceConfig.budgetMatrix === 'development/XTend-Performance-Budget-Matrix.md', 'Scaffold config links Performance budget matrix');
  context.assert(performanceConfig.authorGuide === 'docs/performance.md', 'Scaffold config links Performance author guide');
  context.assert(performanceConfig.measurementContract === 'xtend.performance.measurement.v1', 'Scaffold config declares Performance measurement contract');
  context.assert(performanceConfig.regressionGate === 'xtend.performance.regression-gate.v1', 'Scaffold config declares Performance regression gate');
  context.assert(performanceConfig.hydrationPolicyContract === 'xtend.fabric.hydration-policy.v1', 'Scaffold config declares Hydration policy contract for Performance');
  context.assert(performanceConfig.sourceStaticGetter === 'xtendScaffoldPerformanceProfile', 'Scaffold config declares Performance source getter');
  context.assert(performanceConfig.manifestKey === 'performanceProfile', 'Scaffold config declares Performance manifest key');
  context.assert(typescriptBlueprintConfig.schema === 'xtend.scaffold.typescript-component-blueprint.v1', 'Scaffold config declares TypeScript Component Blueprint schema');
  context.assert(typescriptBlueprintConfig.componentContract === 'xtend.component.contract.v2', 'Scaffold config binds TypeScript Blueprint to Component Contract v2');
  context.assert(typescriptBlueprintConfig.rmtComponentContract === 'xtend.rmt.component-contract.v1', 'Scaffold config binds TypeScript Blueprint to RMT component contract');
  context.assert(typescriptBlueprintConfig.lifecycleTelemetry === 'xtend.component.lifecycle-telemetry.v1', 'Scaffold config binds TypeScript Blueprint to lifecycle telemetry');
  context.assert(typescriptBlueprintConfig.localGate === 'node scripts/run_xtend_tests.js builder-typescript-blueprint --json', 'Scaffold config declares TypeScript Blueprint local gate');
  context.assert(Array.isArray(performanceConfig.requiredDocsSections) && performanceConfig.requiredDocsSections.includes('Performance-Profil'), 'Scaffold config requires Performance docs section');
  context.assert(Array.isArray(performanceConfig.requiredSuites) && performanceConfig.requiredSuites.includes('performance-regression'), 'Scaffold config requires Performance regression suite');
  context.assert(workflowConfig.schema === 'xtend.scaffold.developer-workflow.v1', 'Scaffold config declares developer workflow schema');
  context.assert(workflowConfig.module === 'xtend-builder/workflows/developer-workflow.js', 'Scaffold config links developer workflow module');
  context.assert(workflowConfig.verifySchema === 'xtend.scaffold.verify-plan.v1', 'Scaffold config declares verify plan schema');
  context.assert(workflowCommands.includes('workflow'), 'Scaffold config exposes workflow command');
  context.assert(workflowCommands.includes('verify'), 'Scaffold config exposes verify command');
  context.assert(workflowScripts.includes('scaffold:workflow'), 'Scaffold config declares scaffold workflow NPM script');
  context.assert(workflowScripts.includes('scaffold:verify'), 'Scaffold config declares scaffold verify NPM script');
  context.assert(workflowScripts.includes('scaffold:dry-run'), 'Scaffold config declares scaffold dry-run NPM script');
  context.assert(workflowScripts.includes('scaffold:typing'), 'Scaffold config declares scaffold typing NPM script');
  context.assert(workflowScripts.includes('scaffold:preview'), 'Scaffold config declares scaffold preview NPM script');
  context.assert(workflowScripts.includes('scaffold:extensions'), 'Scaffold config declares scaffold extensions NPM script');
  context.assert(workflowConfig.fullVerificationCommand === 'npm test', 'Scaffold config declares full verification command');
  context.assert(workflowConfig.reportCommand === 'npm run test:report', 'Scaffold config declares scaffold report command');
  ['text', 'json', 'json-report'].forEach((mode) => {
    context.assert(workflowOutputModes.includes(mode), `Scaffold config declares ${mode} workflow output mode`);
  });
  context.assert(manifestWiring.schema === 'xtend.scaffold.manifest-wiring.v1', 'Scaffold config declares manifest wiring schema');
  context.assert(manifestWiring.module === 'xtend-builder/wiring/manifest.js', 'Scaffold config links manifest wiring module');
  context.assert(manifestWiring.patchPlanSchema === 'xtend.scaffold.manifest-patch-plan.v1', 'Scaffold config declares manifest patch-plan schema');
  context.assert(manifestWiring.importMode === 'repo-local', 'Scaffold config keeps manifest imports repo-local');
  context.assert(manifestWiring.localImportOnly === true, 'Scaffold config requires local manifest imports');
  context.assert(manifestWiring.cdnAllowed === false, 'Scaffold config rejects CDN manifest imports by default');
  context.assert(hydrationWiring.schema === 'xtend.scaffold.hydration-wiring.v1', 'Scaffold config declares hydration wiring schema');
  context.assert(hydrationWiring.module === 'xtend-builder/wiring/hydration.js', 'Scaffold config links hydration wiring module');
  context.assert(hydrationWiring.stateAttribute === 'data-xtend-hydrated', 'Scaffold config declares hydration state marker');
  context.assert(hydrationWiring.fixtureScriptPattern === '../../../components/<tag>.js', 'Scaffold config declares local fixture script pattern');
  ['connectedCallback', 'attributeChangedCallback', 'disconnectedCallback'].forEach((callback) => {
    context.assert(hydrationCallbacks.includes(callback), `Scaffold config requires ${callback} hydration callback`);
  });
  ['hydrate', 'render'].forEach((method) => {
    context.assert(hydrationMethods.includes(method), `Scaffold config requires ${method} hydration method`);
  });
  context.assert(featureWiring.schema === 'xtend.scaffold.feature-wiring.v1', 'Scaffold config declares feature wiring schema');
  context.assert(featureWiring.module === 'xtend-builder/wiring/features.js', 'Scaffold config links feature wiring module');
  context.assert(featureWiring.statePrefixPattern === 'xtend.component.<tag>.<id>.', 'Scaffold config declares canonical component state prefix pattern');
  context.assert(featureWiring.stateApi === 'xstate.subscribe(fn, keyFilter?)', 'Scaffold config declares canonical xstate subscription API');
  context.assert(featureWiring.writeApi === 'xstate.set(key, value)', 'Scaffold config declares canonical xstate write API');
  context.assert(featureWiring.namespaceRoot === 'window.XTend', 'Scaffold config declares XTend API namespace root');
  context.assert(featureWiring.localUiPolicy === 'derived-render-cache-only', 'Scaffold config declares derived local UI policy');
  context.assert(featureForbiddenState.includes('xstate.on'), 'Scaffold config forbids xstate.on in generated patterns');
  context.assert(featureForbiddenState.includes('xstate.off'), 'Scaffold config forbids xstate.off in generated patterns');
  context.assert(featureForbiddenGlobals.includes('window.show*'), 'Scaffold config forbids new global helper patterns');
  context.assert(featureWiring.profileDriven === true, 'Scaffold config keeps feature wiring profile-driven');
  context.assert(inScope.includes('component-blueprints'), 'Scaffold config scopes component blueprints in');
  context.assert(inScope.includes('feature-wiring'), 'Scaffold config scopes feature wiring in');
  context.assert(inScope.includes('type-contract'), 'Scaffold config scopes type contract in');
  context.assert(inScope.includes('rmt-attachment-plan'), 'Scaffold config scopes RMT attachment plan in');
  context.assert(inScope.includes('rmt-compatibility-binding'), 'Scaffold config scopes RMT compatibility binding in');
  context.assert(inScope.includes('reference-gate-plan'), 'Scaffold config scopes reference gate plan in');
  context.assert(inScope.includes('extension-point-contract'), 'Scaffold config scopes extension point contract in');
  context.assert(inScope.includes('a11y-profile-plan'), 'Scaffold config scopes A11y profile plan in');
  context.assert(inScope.includes('screenreader-signal-contract'), 'Scaffold config scopes Screenreader signal contract in');
  context.assert(inScope.includes('motion-contrast-policy'), 'Scaffold config scopes Motion and Contrast policy in');
  context.assert(inScope.includes('performance-policy'), 'Scaffold config scopes Performance policy in');
  context.assert(inScope.includes('typescript-component-blueprint'), 'Scaffold config scopes TypeScript Component Blueprint in');
  context.assert(inScope.includes('component-lifecycle-telemetry'), 'Scaffold config scopes Component Lifecycle Telemetry in');
  context.assert(outOfScope.includes('runtime-engine'), 'Scaffold config scopes runtime engine out');
  context.assert(outOfScope.includes('rmt-bridge-runtime'), 'Scaffold config scopes RMT bridge runtime out');
  context.assert(outOfScope.includes('route-registration-runtime'), 'Scaffold config scopes route registration runtime out');
  context.assert(outOfScope.includes('template-parser-runtime'), 'Scaffold config scopes template parser runtime out');
  context.assert(outOfScope.includes('browser-automation-for-every-preview'), 'Scaffold config scopes broad browser preview automation out');

  ['component', 'docs', 'tests', 'fixtures', 'types', 'manifest', 'ts-source', 'ts-contract', 'ts-rmt', 'ts-a11y', 'ts-performance', 'ts-fixture'].forEach((artifact) => {
    context.assert(requiredArtifacts.includes(artifact), `Scaffold config requires ${artifact} artifact`);
    context.assert(componentBlueprintArtifacts.includes(artifact), `Scaffold component blueprint requires ${artifact} artifact`);
  });

  ['display', 'stateful', 'overlay', 'routing'].forEach((profile) => {
    context.assert(profiles.includes(profile), `Scaffold config declares ${profile} component profile`);
  });

  context.assert(obligation.required === true, 'Scaffold config marks test obligation as required');
  context.assert(obligation.standard === 'development/XTend-Testpflicht-und-Scaffold-Anschluss.md', 'Scaffold config links the WP-13 obligation standard');
  context.assert(obligation.componentStandard === 'development/XTend-Component-Level-Teststandard.md', 'Scaffold config links the component-level standard');
  context.assert(obligation.runner === 'node scripts/run_xtend_tests.js', 'Scaffold config declares the local test runner');
  context.assert(typeof obligation.reportCommand === 'string' && obligation.reportCommand.includes('--report'), 'Scaffold config declares report command');

  ['components', 'a11y-hydration', 'references', 'rmt-compatibility'].forEach((suite) => {
    context.assert(requiredSuites.includes(suite), `Scaffold config requires ${suite} suite`);
  });

  ['core', 'architecture', 'browser'].forEach((suite) => {
    context.assert(coreSuites.includes(suite), `Scaffold config declares ${suite} suite for runtime changes`);
  });

  ['human', 'ai-agent'].forEach((actor) => {
    context.assert(reviewActors.includes(actor), `Scaffold config supports ${actor} review actor`);
  });

  context.assert(
    config.artifactPaths && config.artifactPaths.tests === 'tests/components/<tag>.component_suite.js',
    'Scaffold config maps component suite artifact path'
  );
  context.assert(
    config.artifactPaths && config.artifactPaths.fixtures === 'tests/components/fixtures/<tag>.component.html',
    'Scaffold config maps component fixture artifact path'
  );
  context.assert(
    config.artifactPaths && config.artifactPaths.demo === 'docs/previews/<name>.preview.md',
    'Scaffold config maps component preview artifact path'
  );
}

function assertScaffoldComponentBlueprintReference(context, rootDir) {
  const config = readJson('package.json', rootDir);
  context.assert(
    config.scripts && config.scripts.scaffold === 'node xtend-builder/scaffold.js',
    'Scaffold package script remains available for blueprint output'
  );

  const blueprintModulePath = resolveRepoPath('xtend-builder/blueprints/component-blueprint.contract.js', rootDir);
  const cliModulePath = resolveRepoPath('xtend-builder/lib/cli.js', rootDir);
  const configModulePath = resolveRepoPath('xtend-builder/scaffold.config.js', rootDir);
  delete require.cache[require.resolve(blueprintModulePath)];
  delete require.cache[require.resolve(cliModulePath)];
  delete require.cache[require.resolve(configModulePath)];

  const blueprintModule = require(blueprintModulePath);
  const cliModule = require(cliModulePath);
  const scaffoldConfig = require(configModulePath);
  const blueprint = blueprintModule.getComponentBlueprintContract();
  const artifactIds = Array.isArray(blueprint.artifacts) ? blueprint.artifacts.map((artifact) => artifact.id) : [];
  const profiles = Array.isArray(blueprint.profiles) ? blueprint.profiles : [];
  const profileNames = profiles.map((profile) => profile.profile);

  context.assert(blueprint.schema === 'xtend.scaffold.component-blueprint.v1', 'Component blueprint exposes stable schema');
  context.assert(blueprint.status === 'binding-from-WP-E03-03', 'Component blueprint marks WP-E03-03 binding status');

  ['component', 'docs', 'tests', 'fixtures', 'types', 'manifest'].forEach((artifact) => {
    context.assert(artifactIds.includes(artifact), `Component blueprint contains ${artifact} artifact`);
  });
  ['ts-source', 'ts-contract', 'ts-rmt', 'ts-a11y', 'ts-performance', 'ts-fixture'].forEach((artifact) => {
    context.assert(artifactIds.includes(artifact), `Component blueprint contains ${artifact} artifact`);
  });
  context.assert(artifactIds.includes('demo'), 'Component blueprint contains conditional demo artifact');
  context.assert(
    blueprint.typescriptBlueprint && blueprint.typescriptBlueprint.schema === 'xtend.scaffold.typescript-component-blueprint.v1',
    'Component blueprint exposes TypeScript Component Blueprint contract'
  );
  context.assert(
    blueprint.typescriptBlueprint && blueprint.typescriptBlueprint.componentContract === 'xtend.component.contract.v2',
    'Component blueprint binds TypeScript Blueprint to Component Contract v2'
  );
  context.assert(
    blueprint.typescriptBlueprint && blueprint.typescriptBlueprint.lifecycleTelemetry === 'xtend.component.lifecycle-telemetry.v1',
    'Component blueprint binds TypeScript Blueprint to Lifecycle Telemetry'
  );
  context.assert(
    blueprint.a11yProfile && blueprint.a11yProfile.profileContract === 'xtend.a11y.profile.v1',
    'Component blueprint exposes A11y profile contract'
  );
  context.assert(
    blueprint.a11yProfile && blueprint.a11yProfile.testContract === 'xtend.a11y.test-contract.v1',
    'Component blueprint exposes A11y test contract'
  );
  context.assert(
    blueprint.a11yProfile && blueprint.a11yProfile.screenreaderSignalsContract === 'xtend.a11y.screenreader-signals.v1',
    'Component blueprint exposes Screenreader signal contract'
  );
  context.assert(
    blueprint.a11yProfile && blueprint.a11yProfile.motionContrastContract === 'xtend.a11y.motion-contrast-policy.v1',
    'Component blueprint exposes Motion and Contrast policy contract'
  );
  context.assert(
    blueprint.a11yProfile && blueprint.a11yProfile.motionPolicyContract === 'xtend.a11y.motion-policy.v1',
    'Component blueprint exposes Motion policy contract'
  );
  context.assert(
    blueprint.a11yProfile && blueprint.a11yProfile.contrastPolicyContract === 'xtend.a11y.contrast-policy.v1',
    'Component blueprint exposes Contrast policy contract'
  );
  context.assert(
    blueprint.a11yProfile && blueprint.a11yProfile.sourceStaticGetter === 'xtendScaffoldA11yProfile',
    'Component blueprint requires A11y source getter'
  );
  context.assert(
    blueprint.a11yProfile && Array.isArray(blueprint.a11yProfile.requiredGates) && blueprint.a11yProfile.requiredGates.includes('a11y-hydration'),
    'Component blueprint requires A11y hydration gate'
  );
  context.assert(
    blueprint.a11yProfile && Array.isArray(blueprint.a11yProfile.requiredGates) && blueprint.a11yProfile.requiredGates.includes('screenreader-signals'),
    'Component blueprint requires Screenreader signal gate'
  );
  context.assert(
    blueprint.a11yProfile && Array.isArray(blueprint.a11yProfile.requiredGates) && blueprint.a11yProfile.requiredGates.includes('motion-contrast'),
    'Component blueprint requires Motion and Contrast gate'
  );
  context.assert(
    blueprint.performancePolicy && blueprint.performancePolicy.policyContract === 'xtend.scaffold.performance-policy.v1',
    'Component blueprint exposes Performance scaffold policy contract'
  );
  context.assert(
    blueprint.performancePolicy && blueprint.performancePolicy.componentProfileContract === 'xtend.performance.component-profile.v1',
    'Component blueprint exposes Component Performance profile contract'
  );
  context.assert(
    blueprint.performancePolicy && blueprint.performancePolicy.sourceStaticGetter === 'xtendScaffoldPerformanceProfile',
    'Component blueprint requires Performance source getter'
  );
  context.assert(
    blueprint.performancePolicy && Array.isArray(blueprint.performancePolicy.requiredGates) && blueprint.performancePolicy.requiredGates.includes('performance-regression'),
    'Component blueprint requires Performance regression gate'
  );

  Object.keys(scaffoldConfig.artifactPaths || {}).forEach((artifact) => {
    const contract = blueprintModule.getArtifactContract(artifact);
    context.assert(
      contract && contract.pathTemplate === scaffoldConfig.artifactPaths[artifact],
      `Component blueprint path matches scaffold config for ${artifact}`
    );
  });

  ['display', 'interactive', 'stateful', 'feedback', 'overlay', 'routing', 'theme', 'form', 'media'].forEach((profile) => {
    context.assert(profileNames.includes(profile), `Component blueprint contains ${profile} profile`);
  });

  const routingProfile = blueprintModule.getProfileContract('routing');
  context.assert(
    routingProfile && routingProfile.requiredChecks.includes('xstate-bridge'),
    'Component blueprint routing profile requires xstate bridge'
  );
  context.assert(
    routingProfile && routingProfile.a11y && routingProfile.a11y.role === 'navigation',
    'Component blueprint routing profile includes A11y navigation role'
  );
  context.assert(
    routingProfile && routingProfile.performance && routingProfile.performance.lane === 'transition',
    'Component blueprint routing profile includes Performance transition lane'
  );
  context.assert(
    blueprintModule.getArtifactContract('docs').minimumContract.includes('a11y-profile'),
    'Component blueprint docs artifact requires A11y profile'
  );
  context.assert(
    blueprintModule.getArtifactContract('docs').minimumContract.includes('screenreader-signal-contract'),
    'Component blueprint docs artifact requires Screenreader signal contract'
  );
  context.assert(
    blueprintModule.getArtifactContract('docs').minimumContract.includes('motion-contrast-policy'),
    'Component blueprint docs artifact requires Motion and Contrast policy'
  );
  context.assert(
    blueprintModule.getArtifactContract('docs').minimumContract.includes('performance-profile'),
    'Component blueprint docs artifact requires Performance profile'
  );
  context.assert(
    blueprintModule.getArtifactContract('tests').minimumContract.includes('a11y-profile-contract'),
    'Component blueprint tests artifact requires A11y profile contract'
  );
  context.assert(
    blueprintModule.getArtifactContract('tests').minimumContract.includes('screenreader-signal-contract'),
    'Component blueprint tests artifact requires Screenreader signal contract'
  );
  context.assert(
    blueprintModule.getArtifactContract('tests').minimumContract.includes('motion-contrast-policy-contract'),
    'Component blueprint tests artifact requires Motion and Contrast policy contract'
  );
  context.assert(
    blueprintModule.getArtifactContract('tests').minimumContract.includes('performance-profile-contract'),
    'Component blueprint tests artifact requires Performance profile contract'
  );
  context.assert(
    blueprintModule.getArtifactContract('fixtures').minimumContract.includes('a11y-fixture-attributes'),
    'Component blueprint fixtures artifact requires A11y fixture attributes'
  );
  context.assert(
    blueprintModule.getArtifactContract('fixtures').minimumContract.includes('screenreader-signal-result'),
    'Component blueprint fixtures artifact requires Screenreader signal result'
  );
  context.assert(
    blueprintModule.getArtifactContract('fixtures').minimumContract.includes('motion-contrast-result'),
    'Component blueprint fixtures artifact requires Motion and Contrast result'
  );
  context.assert(
    blueprintModule.getArtifactContract('types').minimumContract.includes('motion-contrast-policy-types'),
    'Component blueprint types artifact requires Motion and Contrast policy types'
  );
  context.assert(
    blueprintModule.getArtifactContract('manifest').minimumContract.includes('a11y-profile-plan'),
    'Component blueprint manifest artifact requires A11y profile plan'
  );
  context.assert(
    blueprintModule.getArtifactContract('manifest').minimumContract.includes('screenreader-signals-plan'),
    'Component blueprint manifest artifact requires Screenreader signal plan'
  );
  context.assert(
    blueprintModule.getArtifactContract('manifest').minimumContract.includes('motion-contrast-policy-plan'),
    'Component blueprint manifest artifact requires Motion and Contrast policy plan'
  );
  context.assert(
    blueprintModule.getArtifactContract('manifest').minimumContract.includes('performance-profile-plan'),
    'Component blueprint manifest artifact requires Performance profile plan'
  );
  context.assert(
    blueprint.exceptionPolicy && blueprint.exceptionPolicy.mode === 'documented-exception-required',
    'Component blueprint requires documented exceptions'
  );
  context.assert(
    blueprint.exceptionPolicy && blueprint.exceptionPolicy.forbidden.includes('empty-test-file'),
    'Component blueprint forbids empty test files'
  );

  const blueprintOutput = [];
  const blueprintExitCode = cliModule.runCli(['blueprint', '--json'], {
    stdout: { write: (value) => blueprintOutput.push(value) },
    stderr: { write: () => {} }
  });
  let blueprintJson = null;
  try {
    blueprintJson = JSON.parse(blueprintOutput.join(''));
  } catch (error) {
    context.fail(`Scaffold CLI blueprint JSON parses (${error.message})`);
  }

  context.assert(blueprintExitCode === 0, 'Scaffold CLI blueprint JSON exits successfully');
  context.assert(blueprintJson && blueprintJson.schema === 'xtend.scaffold.component-blueprint.v1', 'Scaffold CLI blueprint exposes stable schema');
  context.assert(blueprintJson && Array.isArray(blueprintJson.artifacts), 'Scaffold CLI blueprint exposes artifact matrix');
}

function assertScaffoldProjectLayoutReference(context, rootDir) {
  [
    'xtend-builder/README.md',
    'xtend-builder/scaffold.js',
    'xtend-builder/lib/cli.js',
    'xtend-builder/lib/layout.js',
    'xtend-builder/blueprints/component-blueprint.contract.js',
    'xtend-builder/blueprints/README.md',
    'xtend-builder/generators/registry.js',
    'xtend-builder/generators/component-plan.js',
    'xtend-builder/generators/component-files.js',
    'xtend-builder/generators/README.md',
    'xtend-builder/templates/registry.js',
    'xtend-builder/templates/loader.js',
    'xtend-builder/templates/component/source.template.js',
    'xtend-builder/templates/component/docs.template.md',
    'xtend-builder/templates/component/component-suite.template.js',
    'xtend-builder/templates/component/fixture.template.html',
    'xtend-builder/templates/component/types.template.d.ts',
    'xtend-builder/templates/component/manifest-plan.template.json',
    'xtend-builder/templates/component/source.template.ts',
    'xtend-builder/templates/component/contract.template.ts',
    'xtend-builder/templates/component/rmt.template.ts',
    'xtend-builder/templates/component/a11y.template.ts',
    'xtend-builder/templates/component/performance.template.ts',
    'xtend-builder/templates/component/fixture-data.template.ts',
    'xtend-builder/templates/README.md',
    'xtend-builder/wiring/manifest.js',
    'xtend-builder/wiring/hydration.js',
    'xtend-builder/wiring/features.js',
    'xtend-builder/wiring/README.md',
    'xtend-builder/typing/component-types.js',
    'xtend-builder/typing/README.md',
    'xtend-builder/preview/component-preview.js',
    'xtend-builder/preview/README.md',
    'xtend-builder/extensions/component-extension-points.js',
    'xtend-builder/extensions/README.md',
    'xtend-builder/a11y/component-a11y-profile.js',
    'xtend-builder/a11y/README.md',
    'xtend-builder/performance/component-performance-profile.js',
    'xtend-builder/performance/README.md',
    'xtend-builder/workflows/developer-workflow.js',
    'xtend-builder/workflows/README.md',
    'xtend-builder/utils/naming.js',
    'xtend-builder/utils/validation.js',
    'xtend-builder/utils/README.md',
    'tests/builder/typescript_component_blueprint_suite.js'
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `Scaffold layout file exists: ${relativePath}`);
  });

  const packageJson = readJson('package.json', rootDir);
  context.assert(
    packageJson.scripts && packageJson.scripts.scaffold === 'node xtend-builder/scaffold.js',
    'Package scripts expose npm run scaffold'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['scaffold:workflow'] === 'node xtend-builder/scaffold.js workflow --json',
    'Package scripts expose npm run scaffold:workflow'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['scaffold:verify'] === 'node xtend-builder/scaffold.js verify --json',
    'Package scripts expose npm run scaffold:verify'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['scaffold:dry-run'] === 'node xtend-builder/scaffold.js component-files --tag x-example --profile display --feature state --json',
    'Package scripts expose npm run scaffold:dry-run'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['scaffold:typing'] === 'node xtend-builder/scaffold.js typing --tag x-example --profile display --feature state --json',
    'Package scripts expose npm run scaffold:typing'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['scaffold:preview'] === 'node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json',
    'Package scripts expose npm run scaffold:preview'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['scaffold:extensions'] === 'node xtend-builder/scaffold.js extensions --tag x-example --profile display --feature state --json',
    'Package scripts expose npm run scaffold:extensions'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['test:rmt-compatibility'] === 'node scripts/run_xtend_tests.js rmt-compatibility',
    'Package scripts expose npm run test:rmt-compatibility'
  );
  context.assert(
    packageJson.scripts && packageJson.scripts['test:rmt-artifact-parity'] === 'node scripts/verify_xtendrmt_artifact_parity.js',
    'Package scripts expose npm run test:rmt-artifact-parity'
  );
  context.assert(
    packageJson.bin && packageJson.bin.xt === './xtend-builder/scaffold.js',
    'Package bin exposes xt shortcut'
  );
  context.assert(
    packageJson.bin && packageJson.bin.xtend === './xtend-builder/scaffold.js',
    'Package bin exposes xtend command'
  );
  context.assert(
    packageJson.bin && packageJson.bin['xtend-scaffold'] === './xtend-builder/scaffold.js',
    'Package bin keeps legacy xtend-scaffold command'
  );

  const layoutModulePath = resolveRepoPath('xtend-builder/lib/layout.js', rootDir);
  const cliModulePath = resolveRepoPath('xtend-builder/lib/cli.js', rootDir);
  delete require.cache[require.resolve(layoutModulePath)];
  delete require.cache[require.resolve(cliModulePath)];

  const layoutModule = require(layoutModulePath);
  const cliModule = require(cliModulePath);
  const layout = layoutModule.getScaffoldLayout();

  context.assert(Array.isArray(layout) && layout.length >= 8, 'Scaffold layout module exposes layout entries');
  context.assert(layout.some((entry) => entry.id === 'cli' && entry.path === 'xtend-builder/scaffold.js'), 'Scaffold layout contains CLI entry');
  context.assert(layout.some((entry) => entry.id === 'generators' && entry.owner === 'WP-E03-04'), 'Scaffold layout reserves generator boundary');
  context.assert(layout.some((entry) => entry.id === 'wiring' && entry.owner === 'WP-E03-06'), 'Scaffold layout exposes wiring contract boundary');
  context.assert(layout.some((entry) => entry.id === 'workflows' && entry.owner === 'WP-E03-08'), 'Scaffold layout exposes workflow contract boundary');
  context.assert(layout.some((entry) => entry.id === 'typing' && entry.owner === 'WP-E03-09'), 'Scaffold layout exposes typing contract boundary');
  context.assert(layout.some((entry) => entry.id === 'preview' && entry.owner === 'WP-E03-10'), 'Scaffold layout exposes preview contract boundary');
  context.assert(layout.some((entry) => entry.id === 'extensions' && entry.owner === 'WP-E03-11'), 'Scaffold layout exposes extensions contract boundary');
  context.assert(layout.some((entry) => entry.id === 'a11y' && entry.owner === 'ER-WP-23'), 'Scaffold layout exposes A11y contract boundary');
  context.assert(layout.some((entry) => entry.id === 'performance' && entry.owner === 'ER-WP-21'), 'Scaffold layout exposes Performance contract boundary');

  const helpOutput = [];
  const helpExitCode = cliModule.runCli(['--help'], {
    stdout: { write: (value) => helpOutput.push(value) },
    stderr: { write: () => {} }
  });
  context.assert(helpExitCode === 0, 'Scaffold CLI help exits successfully');
  context.assert(helpOutput.join('').includes('XTend-Scaffold CLI'), 'Scaffold CLI help prints product name');
  context.assert(helpOutput.join('').includes('xt validate --json'), 'Scaffold CLI help documents xt validate shortcut');
  context.assert(helpOutput.join('').includes('validate  Alias for verify.'), 'Scaffold CLI help documents validate alias');
  context.assert(cliModule.COMMAND_ALIASES && cliModule.COMMAND_ALIASES.validate === 'verify', 'Scaffold CLI exports validate command alias');
  context.assert(cliModule.normalizeCommand('validate') === 'verify', 'Scaffold CLI normalizes validate to verify');

  const layoutOutput = [];
  const layoutExitCode = cliModule.runCli(['layout', '--json'], {
    stdout: { write: (value) => layoutOutput.push(value) },
    stderr: { write: () => {} }
  });
  let layoutJson = null;
  try {
    layoutJson = JSON.parse(layoutOutput.join(''));
  } catch (error) {
    context.fail(`Scaffold CLI layout JSON parses (${error.message})`);
  }

  context.assert(layoutExitCode === 0, 'Scaffold CLI layout JSON exits successfully');
  context.assert(layoutJson && layoutJson.schema === 'xtend.scaffold.layout.v1', 'Scaffold CLI layout exposes stable schema');
  context.assert(layoutJson && Array.isArray(layoutJson.layout), 'Scaffold CLI layout exposes layout array');
}

function assertScaffoldGeneratorReference(context, rootDir) {
  const generatorModulePath = resolveRepoPath('xtend-builder/generators/registry.js', rootDir);
  const templateModulePath = resolveRepoPath('xtend-builder/templates/registry.js', rootDir);
  const componentPlanPath = resolveRepoPath('xtend-builder/generators/component-plan.js', rootDir);
  const componentFilesPath = resolveRepoPath('xtend-builder/generators/component-files.js', rootDir);
  const manifestWiringPath = resolveRepoPath('xtend-builder/wiring/manifest.js', rootDir);
  const hydrationWiringPath = resolveRepoPath('xtend-builder/wiring/hydration.js', rootDir);
  const featureWiringPath = resolveRepoPath('xtend-builder/wiring/features.js', rootDir);
  const componentTypingPath = resolveRepoPath('xtend-builder/typing/component-types.js', rootDir);
  const componentPreviewPath = resolveRepoPath('xtend-builder/preview/component-preview.js', rootDir);
  const componentExtensionsPath = resolveRepoPath('xtend-builder/extensions/component-extension-points.js', rootDir);
  const componentA11yPath = resolveRepoPath('xtend-builder/a11y/component-a11y-profile.js', rootDir);
  const screenreaderSignalsPath = resolveRepoPath('a11y/screenreader-signals.js', rootDir);
  const motionContrastPolicyPath = resolveRepoPath('a11y/motion-contrast-policy.js', rootDir);
  const componentPerformancePath = resolveRepoPath('xtend-builder/performance/component-performance-profile.js', rootDir);
  const cliModulePath = resolveRepoPath('xtend-builder/lib/cli.js', rootDir);
  delete require.cache[require.resolve(generatorModulePath)];
  delete require.cache[require.resolve(templateModulePath)];
  delete require.cache[require.resolve(componentPlanPath)];
  delete require.cache[require.resolve(componentFilesPath)];
  delete require.cache[require.resolve(manifestWiringPath)];
  delete require.cache[require.resolve(hydrationWiringPath)];
  delete require.cache[require.resolve(featureWiringPath)];
  delete require.cache[require.resolve(componentTypingPath)];
  delete require.cache[require.resolve(componentPreviewPath)];
  delete require.cache[require.resolve(componentExtensionsPath)];
  delete require.cache[require.resolve(componentA11yPath)];
  delete require.cache[require.resolve(screenreaderSignalsPath)];
  delete require.cache[require.resolve(motionContrastPolicyPath)];
  delete require.cache[require.resolve(componentPerformancePath)];
  delete require.cache[require.resolve(cliModulePath)];

  const generatorModule = require(generatorModulePath);
  const templateModule = require(templateModulePath);
  const componentPlanModule = require(componentPlanPath);
  const componentFilesModule = require(componentFilesPath);
  const manifestWiringModule = require(manifestWiringPath);
  const hydrationWiringModule = require(hydrationWiringPath);
  const featureWiringModule = require(featureWiringPath);
  const componentTypingModule = require(componentTypingPath);
  const componentPreviewModule = require(componentPreviewPath);
  const componentExtensionsModule = require(componentExtensionsPath);
  const componentA11yModule = require(componentA11yPath);
  const screenreaderSignalsModule = require(screenreaderSignalsPath);
  const motionContrastPolicyModule = require(motionContrastPolicyPath);
  const componentPerformanceModule = require(componentPerformancePath);
  const cliModule = require(cliModulePath);
  const generatorRegistry = generatorModule.getGeneratorRegistry();
  const templateRegistry = templateModule.getTemplateRegistry();

  context.assert(generatorRegistry.schema === 'xtend.scaffold.generator-registry.v1', 'Generator registry exposes stable schema');
  context.assert(
    generatorRegistry.generators.some((generator) => generator.command === 'component-plan' && generator.status === 'plan-only'),
    'Generator registry exposes plan-only component-plan command'
  );
  context.assert(
    generatorRegistry.generators.some((generator) => generator.command === 'component-files' && generator.status === 'template-render-with-feature-type-preview-and-extension-wiring'),
    'Generator registry exposes template-render-with-feature-type-preview-and-extension-wiring component-files command'
  );
  context.assert(
    generatorRegistry.generators.some((generator) => generator.command === 'typing' && generator.status === 'type-contract-and-rmt-attachment'),
    'Generator registry exposes type contract and RMT attachment command'
  );
  context.assert(
    generatorRegistry.generators.some((generator) => generator.command === 'preview' && generator.status === 'preview-reference-contract'),
    'Generator registry exposes preview reference contract command'
  );
  context.assert(
    generatorRegistry.generators.some((generator) => generator.command === 'extensions' && generator.status === 'extension-point-contract'),
    'Generator registry exposes extension point contract command'
  );
  context.assert(templateRegistry.schema === 'xtend.scaffold.template-registry.v1', 'Template registry exposes stable schema');
  context.assert(
    templateRegistry.templates.some((template) => template.artifact === 'tests' && template.status === 'implemented-WP-E03-07'),
    'Template registry implements tests template for WP-E03-07'
  );
  context.assert(
    templateRegistry.templates.some((template) => template.artifact === 'types' && template.status === 'implemented-WP-E03-09'),
    'Template registry implements types template for WP-E03-09'
  );
  context.assert(
    templateRegistry.templates.some((template) => template.artifact === 'demo' && template.status === 'implemented-WP-E03-10'),
    'Template registry implements demo template for WP-E03-10'
  );
  ['ts-source', 'ts-contract', 'ts-rmt', 'ts-a11y', 'ts-performance', 'ts-fixture'].forEach((artifact) => {
    context.assert(
      templateRegistry.templates.some((template) => template.artifact === artifact && template.status === 'implemented-WP-E10-07'),
      `Template registry implements ${artifact} template for WP-E10-07`
    );
  });
  context.assert(manifestWiringModule.MANIFEST_WIRING_SCHEMA === 'xtend.scaffold.manifest-wiring.v1', 'Manifest wiring module exposes stable schema constant');
  context.assert(hydrationWiringModule.HYDRATION_WIRING_SCHEMA === 'xtend.scaffold.hydration-wiring.v1', 'Hydration wiring module exposes stable schema constant');
  context.assert(featureWiringModule.FEATURE_WIRING_SCHEMA === 'xtend.scaffold.feature-wiring.v1', 'Feature wiring module exposes stable schema constant');
  context.assert(componentTypingModule.COMPONENT_TYPING_SCHEMA === 'xtend.scaffold.component-typing.v1', 'Component typing module exposes stable schema constant');
  context.assert(componentTypingModule.RMT_ATTACHMENT_SCHEMA === 'xtend.scaffold.rmt-attachment.v1', 'Component typing module exposes RMT attachment schema constant');
  context.assert(componentTypingModule.RMT_ROOT_HANDSHAKE_CONTRACT_VERSION === 'xtend.rmt.root-handshake.v1', 'Component typing module exposes RMT root handshake contract constant');
  context.assert(componentTypingModule.RMT_HOST_CAPABILITIES_CONTRACT_VERSION === 'xtend.rmt.host-capabilities.v1', 'Component typing module exposes RMT host capabilities contract constant');
  context.assert(componentTypingModule.RMT_COMPATIBILITY_BINDING_SCHEMA === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Component typing module exposes RMT compatibility binding schema constant');
  context.assert(componentPreviewModule.COMPONENT_PREVIEW_SCHEMA === 'xtend.scaffold.component-preview.v1', 'Component preview module exposes stable schema constant');
  context.assert(componentPreviewModule.RMT_COMPATIBILITY_BINDING_SCHEMA === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Component preview module exposes RMT compatibility binding schema constant');
  context.assert(componentExtensionsModule.COMPONENT_EXTENSION_POINTS_SCHEMA === 'xtend.scaffold.component-extension-points.v1', 'Component extensions module exposes stable schema constant');
  context.assert(componentExtensionsModule.ROOT_LIFECYCLE_SCHEMA === 'xtend.scaffold.root-lifecycle.v1', 'Component extensions module exposes root lifecycle schema constant');
  context.assert(componentExtensionsModule.ROOT_HANDSHAKE_CONTRACT_VERSION === 'xtend.rmt.root-handshake.v1', 'Component extensions module exposes root handshake contract constant');
  context.assert(componentExtensionsModule.HOST_CAPABILITIES_CONTRACT_VERSION === 'xtend.rmt.host-capabilities.v1', 'Component extensions module exposes host capabilities contract constant');
  context.assert(componentExtensionsModule.TEMPLATE_EXTENSION_SCHEMA === 'xtend.scaffold.template-extension.v1', 'Component extensions module exposes template extension schema constant');
  context.assert(componentExtensionsModule.RENDERING_EXTENSION_SCHEMA === 'xtend.scaffold.rendering-extension.v1', 'Component extensions module exposes rendering extension schema constant');
  context.assert(componentExtensionsModule.RMT_COMPATIBILITY_BINDING_SCHEMA === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Component extensions module exposes RMT compatibility binding schema constant');
  context.assert(componentA11yModule.A11Y_PROFILE_SCHEMA === 'xtend.a11y.profile.v1', 'Component A11y module exposes stable profile schema constant');
  context.assert(componentA11yModule.A11Y_SCREENREADER_SIGNALS_SCHEMA === 'xtend.a11y.screenreader-signals.v1', 'Component A11y module exposes Screenreader signal schema constant');
  context.assert(componentA11yModule.A11Y_SCREENREADER_SIGNAL_RECORD_SCHEMA === 'xtend.a11y.screenreader-signal.v1', 'Component A11y module exposes Screenreader signal record constant');
  context.assert(componentA11yModule.A11Y_MOTION_CONTRAST_POLICY_SCHEMA === 'xtend.a11y.motion-contrast-policy.v1', 'Component A11y module exposes Motion and Contrast policy schema constant');
  context.assert(componentA11yModule.A11Y_MOTION_POLICY_SCHEMA === 'xtend.a11y.motion-policy.v1', 'Component A11y module exposes Motion policy schema constant');
  context.assert(componentA11yModule.A11Y_CONTRAST_POLICY_SCHEMA === 'xtend.a11y.contrast-policy.v1', 'Component A11y module exposes Contrast policy schema constant');
  context.assert(componentA11yModule.A11Y_MOTION_CONTRAST_TEST_SCHEMA === 'xtend.a11y.motion-contrast-test.v1', 'Component A11y module exposes Motion and Contrast test schema constant');
  context.assert(componentA11yModule.A11Y_TEST_CONTRACT_SCHEMA === 'xtend.a11y.test-contract.v1', 'Component A11y module exposes stable test contract constant');
  context.assert(componentA11yModule.SCAFFOLD_A11Y_PROFILE_PLAN_SCHEMA === 'xtend.scaffold.a11y-profile-plan.v1', 'Component A11y module exposes scaffold plan constant');
  context.assert(screenreaderSignalsModule.SCREENREADER_SIGNALS_SCHEMA === 'xtend.a11y.screenreader-signals.v1', 'Screenreader signal module exposes stable schema constant');
  context.assert(screenreaderSignalsModule.SCREENREADER_SIGNAL_RECORD_SCHEMA === 'xtend.a11y.screenreader-signal.v1', 'Screenreader signal module exposes stable record schema constant');
  context.assert(typeof screenreaderSignalsModule.createScreenreaderSignalContract === 'function', 'Screenreader signal module exposes contract factory');
  context.assert(typeof screenreaderSignalsModule.validateScreenreaderSignalContract === 'function', 'Screenreader signal module exposes validator');
  context.assert(motionContrastPolicyModule.MOTION_CONTRAST_POLICY_SCHEMA === 'xtend.a11y.motion-contrast-policy.v1', 'Motion and Contrast module exposes stable schema constant');
  context.assert(motionContrastPolicyModule.MOTION_POLICY_SCHEMA === 'xtend.a11y.motion-policy.v1', 'Motion and Contrast module exposes Motion schema constant');
  context.assert(motionContrastPolicyModule.CONTRAST_POLICY_SCHEMA === 'xtend.a11y.contrast-policy.v1', 'Motion and Contrast module exposes Contrast schema constant');
  context.assert(typeof motionContrastPolicyModule.createMotionContrastPolicy === 'function', 'Motion and Contrast module exposes policy factory');
  context.assert(typeof motionContrastPolicyModule.validateMotionContrastPolicy === 'function', 'Motion and Contrast module exposes validator');
  context.assert(componentPerformanceModule.PERFORMANCE_COMPONENT_PROFILE_SCHEMA === 'xtend.performance.component-profile.v1', 'Component Performance module exposes stable profile schema constant');
  context.assert(componentPerformanceModule.PERFORMANCE_POLICY_SCHEMA === 'xtend.scaffold.performance-policy.v1', 'Component Performance module exposes scaffold policy constant');
  context.assert(componentPerformanceModule.PERFORMANCE_REGRESSION_GATE_SCHEMA === 'xtend.performance.regression-gate.v1', 'Component Performance module exposes regression gate constant');

  const plan = componentPlanModule.createComponentPlan({
    tag: 'x-example',
    profile: 'display',
    feature: 'state'
  });
  context.assert(plan.ok === true, 'Component plan validates a display component input');
  context.assert(plan.schema === 'xtend.scaffold.component-plan.v1', 'Component plan exposes stable schema');
  context.assert(plan.mode === 'dry-run', 'Component plan remains dry-run');
  context.assert(plan.writeStrategy === 'dry-run-first', 'Component plan preserves dry-run-first strategy');
  context.assert(plan.a11yProfile && plan.a11yProfile.schema === 'xtend.a11y.profile.v1', 'Component plan includes A11y profile');
  context.assert(plan.a11yProfile && plan.a11yProfile.testContract === 'xtend.a11y.test-contract.v1', 'Component plan includes A11y test contract');
  context.assert(plan.a11yProfile && plan.a11yProfile.screenreader && plan.a11yProfile.screenreader.contract === 'xtend.a11y.screenreader-signals.v1', 'Component plan includes Screenreader signal contract');
  context.assert(plan.a11yProfile && plan.a11yProfile.motionContrast && plan.a11yProfile.motionContrast.contract === 'xtend.a11y.motion-contrast-policy.v1', 'Component plan includes Motion and Contrast policy contract');
  context.assert(plan.a11yProfile && plan.a11yProfile.motionContrast && plan.a11yProfile.motionContrast.fabric && plan.a11yProfile.motionContrast.fabric.scheduleRef === 'a11y.user-blocking.preference', 'Component plan maps Motion and Contrast policy to A11y schedule');
  context.assert(plan.a11yProfile && plan.a11yProfile.scaffold && plan.a11yProfile.scaffold.requiredGates.includes('a11y-hydration'), 'Component plan includes A11y hydration gate');
  context.assert(plan.a11yProfile && plan.a11yProfile.scaffold && plan.a11yProfile.scaffold.requiredGates.includes('screenreader-signals'), 'Component plan includes Screenreader signal gate');
  context.assert(plan.a11yProfile && plan.a11yProfile.scaffold && plan.a11yProfile.scaffold.requiredGates.includes('motion-contrast'), 'Component plan includes Motion and Contrast gate');
  context.assert(plan.performanceProfile && plan.performanceProfile.schema === 'xtend.performance.component-profile.v1', 'Component plan includes Performance profile');
  context.assert(plan.performanceProfile && plan.performanceProfile.policySchema === 'xtend.scaffold.performance-policy.v1', 'Component plan includes Performance policy');
  context.assert(
    plan.artifacts.some((artifact) => artifact.id === 'ts-source' && artifact.targetPath === 'src/components/x-example/x-example.ts'),
    'Component plan resolves TypeScript source artifact'
  );
  context.assert(plan.performanceProfile && plan.performanceProfile.scaffold && plan.performanceProfile.scaffold.requiredGates.includes('performance-regression'), 'Component plan includes Performance regression gate');
  context.assert(
    plan.artifacts.some((artifact) => artifact.id === 'tests' && artifact.targetPath === 'tests/components/x-example.component_suite.js'),
    'Component plan resolves component suite target path'
  );
  context.assert(
    plan.artifacts.some((artifact) => artifact.id === 'demo' && artifact.targetPath === 'docs/previews/example.preview.md'),
    'Component plan resolves component preview target path'
  );

  const invalidPlan = componentPlanModule.createComponentPlan({
    tag: 'bad-example',
    profile: 'display'
  });
  context.assert(invalidPlan.ok === false, 'Component plan rejects invalid tag input');
  context.assert(Array.isArray(invalidPlan.errors) && invalidPlan.errors.length > 0, 'Component plan reports deterministic validation errors');

  const componentPlanOutput = [];
  const componentPlanExitCode = cliModule.runCli(['component-plan', '--tag', 'x-example', '--profile', 'display', '--json'], {
    stdout: { write: (value) => componentPlanOutput.push(value) },
    stderr: { write: () => {} }
  });
  let componentPlanJson = null;
  try {
    componentPlanJson = JSON.parse(componentPlanOutput.join(''));
  } catch (error) {
    context.fail(`Scaffold CLI component-plan JSON parses (${error.message})`);
  }

  context.assert(componentPlanExitCode === 0, 'Scaffold CLI component-plan JSON exits successfully');
  context.assert(componentPlanJson && componentPlanJson.schema === 'xtend.scaffold.component-plan.v1', 'Scaffold CLI component-plan exposes stable schema');
  context.assert(componentPlanJson && componentPlanJson.ok === true, 'Scaffold CLI component-plan returns ok true for valid input');

  const invalidOutput = [];
  const invalidExitCode = cliModule.runCli(['component-plan', '--tag', 'bad-example', '--profile', 'display', '--json'], {
    stdout: { write: (value) => invalidOutput.push(value) },
    stderr: { write: () => {} }
  });
  let invalidJson = null;
  try {
    invalidJson = JSON.parse(invalidOutput.join(''));
  } catch (error) {
    context.fail(`Scaffold CLI invalid component-plan JSON parses (${error.message})`);
  }

  context.assert(invalidExitCode === 1, 'Scaffold CLI component-plan rejects invalid input with exit code 1');
  context.assert(invalidJson && invalidJson.ok === false, 'Scaffold CLI invalid component-plan returns ok false');

  const generatorsOutput = [];
  const generatorsExitCode = cliModule.runCli(['generators', '--json'], {
    stdout: { write: (value) => generatorsOutput.push(value) },
    stderr: { write: () => {} }
  });
  const generatorsJson = JSON.parse(generatorsOutput.join(''));
  context.assert(generatorsExitCode === 0, 'Scaffold CLI generators JSON exits successfully');
  context.assert(generatorsJson.schema === 'xtend.scaffold.generator-registry.v1', 'Scaffold CLI generators exposes stable schema');

  const templatesOutput = [];
  const templatesExitCode = cliModule.runCli(['templates', '--json'], {
    stdout: { write: (value) => templatesOutput.push(value) },
    stderr: { write: () => {} }
  });
  const templatesJson = JSON.parse(templatesOutput.join(''));
  context.assert(templatesExitCode === 0, 'Scaffold CLI templates JSON exits successfully');
  context.assert(templatesJson.schema === 'xtend.scaffold.template-registry.v1', 'Scaffold CLI templates exposes stable schema');

  const a11yProfile = componentA11yModule.createComponentA11yProfile({
    tag: 'x-example',
    name: 'example',
    className: 'XExample',
    profiles: ['routing']
  });
  context.assert(a11yProfile.schema === 'xtend.a11y.profile.v1', 'Component A11y profile exposes stable schema');
  context.assert(a11yProfile.role === 'navigation', 'Component A11y profile derives routing role');
  context.assert(a11yProfile.accessibleName && a11yProfile.accessibleName.source === 'aria-label', 'Component A11y profile requires accessible name source');
  context.assert(a11yProfile.focusStrategy && a11yProfile.focusStrategy.focusVisible === 'required', 'Component A11y profile requires focus visible strategy');
  context.assert(Array.isArray(a11yProfile.keyboard) && a11yProfile.keyboard.includes('Enter'), 'Component A11y profile includes keyboard contract');
  context.assert(Array.isArray(a11yProfile.ariaStates) && a11yProfile.ariaStates.includes('aria-current'), 'Component A11y profile includes ARIA state contract');
  context.assert(a11yProfile.screenreader && a11yProfile.screenreader.signalContract && a11yProfile.screenreader.signalContract.schema === 'xtend.a11y.screenreader-signals.v1', 'Component A11y profile derives Screenreader signal contract');
  context.assert(a11yProfile.screenreader && a11yProfile.screenreader.signalContract && a11yProfile.screenreader.signalContract.fabric && a11yProfile.screenreader.signalContract.fabric.scheduleRef === 'a11y.user-blocking.announce', 'Component A11y profile maps Screenreader signals to A11y schedule');
  context.assert(a11yProfile.motionContrast && a11yProfile.motionContrast.policy && a11yProfile.motionContrast.policy.schema === 'xtend.a11y.motion-contrast-policy.v1', 'Component A11y profile derives Motion and Contrast policy');
  context.assert(a11yProfile.motionContrast && a11yProfile.motionContrast.policy && a11yProfile.motionContrast.policy.contrast && a11yProfile.motionContrast.policy.contrast.mediaQuery === '(forced-colors: active)', 'Component A11y profile requires forced-colors media query');
  context.assert(Array.isArray(a11yProfile.testRefs) && a11yProfile.testRefs.includes('a11y-hydration'), 'Component A11y profile includes A11y hydration test ref');
  context.assert(Array.isArray(a11yProfile.testRefs) && a11yProfile.testRefs.includes('screenreader-signals'), 'Component A11y profile includes Screenreader signal test ref');
  context.assert(Array.isArray(a11yProfile.testRefs) && a11yProfile.testRefs.includes('motion-contrast'), 'Component A11y profile includes Motion and Contrast test ref');

  const performanceProfile = componentPerformanceModule.createComponentPerformanceProfile({
    tag: 'x-example',
    name: 'example',
    className: 'XExample',
    profiles: ['routing']
  });
  context.assert(performanceProfile.schema === 'xtend.performance.component-profile.v1', 'Component Performance profile exposes stable schema');
  context.assert(performanceProfile.policySchema === 'xtend.scaffold.performance-policy.v1', 'Component Performance profile exposes scaffold policy');
  context.assert(performanceProfile.lane === 'transition', 'Component Performance profile derives routing lane');
  context.assert(performanceProfile.budgetClass === 'interactive', 'Component Performance profile derives routing budget class');
  context.assert(Array.isArray(performanceProfile.criticalMeasurements) && performanceProfile.criticalMeasurements.includes('xtend.route.render'), 'Component Performance profile includes route render measurement');
  context.assert(performanceProfile.scaffold && performanceProfile.scaffold.authorGuide === 'docs/performance.md', 'Component Performance profile links author guide');

  const typing = componentTypingModule.createComponentTypingContract({
    tag: 'x-example',
    profile: 'routing',
    feature: 'state'
  });
  context.assert(typing.ok === true, 'Component typing contract validates a routing component input');
  context.assert(typing.schema === 'xtend.scaffold.component-typing.v1', 'Component typing contract exposes stable schema');
  context.assert(typing.runtimeBoundary === 'types-only-no-runtime-imports', 'Component typing contract keeps runtime boundary types-only');
  context.assert(typing.artifact && typing.artifact.targetPath === 'components/x-example.d.ts', 'Component typing contract resolves type artifact target path');
  context.assert(
    typing.declarations && typing.declarations.rmtComponentAttachmentInterface === 'XExampleRmtComponentAttachment',
    'Component typing contract declares RMT component attachment interface'
  );
  context.assert(
    typing.declarations && typing.declarations.rmtTemplateAttachmentInterface === 'XExampleRmtTemplateAttachment',
    'Component typing contract declares RMT template attachment interface'
  );
  context.assert(
    typing.declarations && typing.declarations.rmtRootAttachmentInterface === 'XExampleRmtRootAttachment',
    'Component typing contract declares RMT root attachment interface'
  );
  context.assert(
    typing.declarations && typing.declarations.rmtHostCapabilitiesInterface === 'XExampleRmtHostCapabilities',
    'Component typing contract declares RMT host capabilities interface'
  );
  context.assert(
    typing.declarations && typing.declarations.rmtCompatibilityBindingInterface === 'XExampleRmtCompatibilityBinding',
    'Component typing contract declares RMT compatibility binding interface'
  );
  context.assert(
    typing.attributes && typing.attributes.some((entry) => entry.name === 'variant' && entry.type === 'string | null'),
    'Component typing contract declares variant attribute type'
  );
  context.assert(
    typing.events && typing.events.some((entry) => entry.name === 'route-changed' && entry.bubbles === true && entry.composed === true),
    'Component typing contract declares route event metadata'
  );
  context.assert(
    typing.rmtAttachment && typing.rmtAttachment.adapter === 'xtend.component',
    'Component typing contract prepares XTend component adapter attachment'
  );
  context.assert(
    typing.rmtAttachment && typing.rmtAttachment.routerAdapter === 'xtend.xrouter',
    'Component typing contract prepares XRouter adapter attachment'
  );
  context.assert(
    typing.rmtAttachment && typing.rmtAttachment.kernelBoundary.includes('must not import XTend'),
    'Component typing contract preserves RMT kernel boundary'
  );
  context.assert(
    typing.rmtAttachment && typing.rmtAttachment.contractVersion === 'xtend.rmt.component-contract.v1',
    'Component typing contract exposes Epic 04 component contract version'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.templateAuthoring
      && typing.rmtAttachment.templateAuthoring.contractVersion === 'xtend.rmt.template-authoring.v1',
    'Component typing contract exposes Epic 04 template authoring contract version'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.templateAuthoring
      && typing.rmtAttachment.templateAuthoring.adapter === 'xtend.template',
    'Component typing contract prepares XTend template adapter attachment'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.templateAuthoring
      && typing.rmtAttachment.templateAuthoring.componentRef === 'example.<id>',
    'Component typing contract links template authoring to the component ref'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.templateAuthoring
      && typing.rmtAttachment.templateAuthoring.allowedModes.includes('html_fragment'),
    'Component typing contract declares template authoring modes'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.rootLifecycle
      && typing.rmtAttachment.rootLifecycle.contractVersion === 'xtend.rmt.root-handshake.v1',
    'Component typing contract exposes Epic 04 root handshake contract version'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.rootLifecycle
      && typing.rmtAttachment.rootLifecycle.phaseSequence.includes('hydrate'),
    'Component typing contract declares root lifecycle phases'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.rootLifecycle
      && typing.rmtAttachment.rootLifecycle.schedulerEndpointHints.some((entry) => entry.endpointName === 'xtendrmt.component.hydrate'),
    'Component typing contract declares root scheduler endpoint hints'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.rootLifecycle
      && typing.rmtAttachment.rootLifecycle.boundaries
      && typing.rmtAttachment.rootLifecycle.boundaries.forbidden.includes('direct-xstate-mutation-by-kernel'),
    'Component typing contract forbids kernel state mutation in root handshakes'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.hostCapabilities
      && typing.rmtAttachment.hostCapabilities.contractVersion === 'xtend.rmt.host-capabilities.v1',
    'Component typing contract exposes Epic 04 host capabilities contract version'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.hostCapabilities
      && typing.rmtAttachment.hostCapabilities.requiredCapabilities.includes('stateBridge'),
    'Component typing contract declares required state bridge capability'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.hostCapabilities
      && typing.rmtAttachment.hostCapabilities.optionalCapabilities.includes('router'),
    'Component typing contract declares optional router capability'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.hostCapabilities
      && typing.rmtAttachment.hostCapabilities.capabilities
      && typing.rmtAttachment.hostCapabilities.capabilities.hydration
      && typing.rmtAttachment.hostCapabilities.capabilities.hydration.stateAttribute === 'data-xtend-hydrated',
    'Component typing contract declares host hydration capability'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.hostCapabilities
      && typing.rmtAttachment.hostCapabilities.boundaries
      && typing.rmtAttachment.hostCapabilities.boundaries.forbidden.includes('kernel-calls-window-XTend'),
    'Component typing contract forbids kernel XTend API calls'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.componentDefinition
      && typing.rmtAttachment.componentDefinition.manifestLookup
      && typing.rmtAttachment.componentDefinition.manifestLookup.kernelVisible === false,
    'Component typing contract keeps manifest lookup in the host adapter'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.componentDefinition
      && typing.rmtAttachment.componentDefinition.attributes === 'Record<string, string | boolean | number | null>',
    'Component typing contract declares component attributes record'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.componentDefinition
      && typing.rmtAttachment.componentDefinition.hydration
      && typing.rmtAttachment.componentDefinition.hydration.mode === 'custom-element',
    'Component typing contract declares custom element hydration metadata'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.componentDefinition
      && typing.rmtAttachment.componentDefinition.diagnostics
      && typing.rmtAttachment.componentDefinition.diagnostics.reportToRmt === true,
    'Component typing contract declares RMT diagnostics metadata'
  );
  context.assert(
    typing.rmtAttachment
      && typing.rmtAttachment.boundaries
      && typing.rmtAttachment.boundaries.kernelForbidden.includes('xstate-keys'),
    'Component typing contract forbids xstate keys in the RMT kernel'
  );
  context.assert(
    typing.rmtAttachment && typing.rmtAttachment.routeAttachment && typing.rmtAttachment.routeAttachment.routeFields.includes('template'),
    'Component typing contract prepares route template field'
  );
  context.assert(
    typing.rmtCompatibility && typing.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component typing contract exposes RMT compatibility binding schema'
  );
  context.assert(
    typing.rmtCompatibility && typing.rmtCompatibility.contractRefs && typing.rmtCompatibility.contractRefs.hostCapabilities === 'xtend.rmt.host-capabilities.v1',
    'Component typing contract binds host capabilities contract ref'
  );
  context.assert(
    typing.rmtCompatibility && typing.rmtCompatibility.artifactBinding && typing.rmtCompatibility.artifactBinding.preview === 'docs/previews/example.preview.md',
    'Component typing contract binds preview artifact reference'
  );
  context.assert(
    typing.rmtCompatibility && Array.isArray(typing.rmtCompatibility.dryRunSurfaces) && typing.rmtCompatibility.dryRunSurfaces.includes('manifest-plan'),
    'Component typing contract binds manifest plan dry-run surface'
  );
  context.assert(
    typing.rmtCompatibility && typing.rmtCompatibility.manifestPlanRequirements && typing.rmtCompatibility.manifestPlanRequirements.localImportOnly === true,
    'Component typing contract requires local manifest imports for RMT compatibility'
  );
  context.assert(
    typing.rmtCompatibility && typing.rmtCompatibility.boundaries && typing.rmtCompatibility.boundaries.noRuntimeImports === true,
    'Component typing contract keeps RMT compatibility types/runtime boundary'
  );
  context.assert(
    typing.exceptionPolicy && typing.exceptionPolicy.forbidden.includes('runtime-import-from-d.ts'),
    'Component typing contract forbids runtime imports from type files'
  );

  const typingOutput = [];
  const typingExitCode = cliModule.runCli(['typing', '--tag', 'x-example', '--profile', 'routing', '--feature', 'state', '--json'], {
    stdout: { write: (value) => typingOutput.push(value) },
    stderr: { write: () => {} }
  });
  const typingJson = JSON.parse(typingOutput.join(''));
  context.assert(typingExitCode === 0, 'Scaffold CLI typing JSON exits successfully');
  context.assert(typingJson.schema === 'xtend.scaffold.component-typing.v1', 'Scaffold CLI typing exposes stable schema');
  context.assert(typingJson.rmtAttachment && typingJson.rmtAttachment.adapter === 'xtend.component', 'Scaffold CLI typing exposes RMT component adapter');
  context.assert(typingJson.rmtCompatibility && typingJson.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Scaffold CLI typing exposes RMT compatibility binding');

  const preview = componentPreviewModule.createComponentPreviewContract({
    tag: 'x-example',
    profile: 'routing',
    feature: 'state'
  });
  context.assert(preview.ok === true, 'Component preview contract validates a routing component input');
  context.assert(preview.schema === 'xtend.scaffold.component-preview.v1', 'Component preview contract exposes stable schema');
  context.assert(preview.artifact && preview.artifact.targetPath === 'docs/previews/example.preview.md', 'Component preview contract resolves preview target path');
  context.assert(preview.preview && preview.preview.externalNetworkAllowed === false, 'Component preview contract rejects external network dependencies');
  context.assert(preview.preview && preview.preview.localOnly === true, 'Component preview contract stays repo-local');
  context.assert(preview.registry && preview.registry.document === 'development/XTend-Dokumentations-und-Demo-Referenzpfade.md', 'Component preview contract links reference registry');
  context.assert(preview.registry && preview.registry.entry && preview.registry.entry.status === 'automated-static-candidate', 'Component preview contract prepares automated-static candidate status');
  context.assert(preview.verification && preview.verification.requiredCommands.includes('node scripts/run_xtend_tests.js references --json'), 'Component preview contract declares references JSON gate');
  context.assert(preview.verification && preview.verification.requiredCommands.includes('node scripts/run_xtend_tests.js rmt-compatibility --json'), 'Component preview contract declares RMT compatibility JSON gate');
  context.assert(preview.contracts && preview.contracts.requiresRegistryEntry === true, 'Component preview contract requires registry entry');
  context.assert(preview.contracts && preview.contracts.requiresRmtCompatibilityBinding === true, 'Component preview contract requires RMT compatibility binding');
  context.assert(
    preview.rmtCompatibility && preview.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component preview contract exposes RMT compatibility binding schema'
  );
  context.assert(preview.rmtCompatibility && preview.rmtCompatibility.localOnly === true, 'Component preview contract keeps RMT compatibility local-only');
  context.assert(
    preview.signals && preview.signals.rmtCompatibilityBinding === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component preview contract exposes RMT compatibility signal'
  );
  context.assert(preview.upstreamBoundaries && preview.upstreamBoundaries.bridgeImplementation === 'reserved-for-Epic-05', 'Component preview contract keeps bridge implementation out of scope');

  const previewOutput = [];
  const previewExitCode = cliModule.runCli(['preview', '--tag', 'x-example', '--profile', 'routing', '--feature', 'state', '--json'], {
    stdout: { write: (value) => previewOutput.push(value) },
    stderr: { write: () => {} }
  });
  const previewJson = JSON.parse(previewOutput.join(''));
  context.assert(previewExitCode === 0, 'Scaffold CLI preview JSON exits successfully');
  context.assert(previewJson.schema === 'xtend.scaffold.component-preview.v1', 'Scaffold CLI preview exposes stable schema');
  context.assert(previewJson.registry && previewJson.registry.entry && previewJson.registry.entry.path === 'docs/previews/example.preview.md', 'Scaffold CLI preview exposes registry path');

  const extensions = componentExtensionsModule.createComponentExtensionPoints({
    tag: 'x-example',
    profile: 'routing',
    feature: 'state'
  });
  context.assert(extensions.ok === true, 'Component extension contract validates a routing component input');
  context.assert(extensions.schema === 'xtend.scaffold.component-extension-points.v1', 'Component extension contract exposes stable schema');
  context.assert(extensions.rootLifecycle && extensions.rootLifecycle.schema === 'xtend.scaffold.root-lifecycle.v1', 'Component extension contract exposes root lifecycle schema');
  context.assert(
    extensions.rootLifecycle && extensions.rootLifecycle.hooks.some((hook) => hook.name === 'beforeHydrate'),
    'Component extension contract exposes beforeHydrate hook'
  );
  context.assert(
    extensions.rootLifecycle && extensions.rootLifecycle.contractVersion === 'xtend.rmt.root-handshake.v1',
    'Component extension contract exposes root handshake contract'
  );
  context.assert(
    extensions.rootLifecycle && extensions.rootLifecycle.phaseSequence.includes('activate'),
    'Component extension contract exposes root lifecycle phase sequence'
  );
  context.assert(
    extensions.rootLifecycle && extensions.rootLifecycle.schedulerEndpointHints.some((hint) => hint.schedule === 'component.idle.hydrate'),
    'Component extension contract exposes scheduler endpoint hints'
  );
  context.assert(
    extensions.templating && extensions.templating.adapter === 'xtend.template',
    'Component extension contract exposes template adapter'
  );
  context.assert(
    extensions.templating && extensions.templating.contractVersion === 'xtend.rmt.template-authoring.v1',
    'Component extension contract exposes template authoring contract'
  );
  context.assert(
    extensions.templating && extensions.templating.componentRef === 'example.<id>',
    'Component extension contract exposes template component ref'
  );
  context.assert(
    extensions.templating && extensions.templating.eventBindingMode === 'dom-event-to-rmt-command',
    'Component extension contract exposes template event binding mode'
  );
  context.assert(
    extensions.rendering && extensions.rendering.scheduleHint === 'route.visible.render',
    'Component extension contract derives routing schedule hint'
  );
  context.assert(
    extensions.schedulerHandshake && extensions.schedulerHandshake.executor === 'xtend-host-adapter',
    'Component extension contract exposes scheduler handshake executor'
  );
  context.assert(
    extensions.schedulerHandshake && extensions.schedulerHandshake.statePolicy === 'digital-twin-ssot-xstate',
    'Component extension contract exposes scheduler handshake state policy'
  );
  context.assert(
    extensions.hostCapabilities && extensions.hostCapabilities.contractVersion === 'xtend.rmt.host-capabilities.v1',
    'Component extension contract exposes host capabilities contract'
  );
  context.assert(
    extensions.hostCapabilities && extensions.hostCapabilities.requiredCapabilities.includes('manifest'),
    'Component extension contract exposes required manifest capability'
  );
  context.assert(
    extensions.hostCapabilities
      && extensions.hostCapabilities.capabilities
      && extensions.hostCapabilities.capabilities.stateBridge
      && extensions.hostCapabilities.capabilities.stateBridge.subscribe === 'xstate.subscribe(fn, keyFilter?)',
    'Component extension contract exposes xstate host capability'
  );
  context.assert(
    extensions.rmtBridge && extensions.rmtBridge.routerAdapter === 'xtend.xrouter',
    'Component extension contract exposes XRouter adapter'
  );
  context.assert(
    extensions.rmtCompatibilityBinding && extensions.rmtCompatibilityBinding.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component extension contract exposes RMT compatibility binding schema'
  );
  context.assert(
    extensions.rmtCompatibilityBinding && Array.isArray(extensions.rmtCompatibilityBinding.dryRunSurfaces) && extensions.rmtCompatibilityBinding.dryRunSurfaces.includes('manifest-plan'),
    'Component extension contract binds manifest plan dry-run surface'
  );
  context.assert(
    extensions.rmtCompatibilityBinding && extensions.rmtCompatibilityBinding.boundaries && extensions.rmtCompatibilityBinding.boundaries.noRmtKernelCoupling === true,
    'Component extension contract keeps RMT compatibility out of kernel coupling'
  );
  context.assert(
    extensions.boundaries && extensions.boundaries.noRuntimeImports === true && extensions.boundaries.noTemplateParsing === true,
    'Component extension contract preserves runtime and template parser boundaries'
  );

  const extensionsOutput = [];
  const extensionsExitCode = cliModule.runCli(['extensions', '--tag', 'x-example', '--profile', 'routing', '--feature', 'state', '--json'], {
    stdout: { write: (value) => extensionsOutput.push(value) },
    stderr: { write: () => {} }
  });
  const extensionsJson = JSON.parse(extensionsOutput.join(''));
  context.assert(extensionsExitCode === 0, 'Scaffold CLI extensions JSON exits successfully');
  context.assert(extensionsJson.schema === 'xtend.scaffold.component-extension-points.v1', 'Scaffold CLI extensions exposes stable schema');
  context.assert(extensionsJson.integration && extensionsJson.integration.sourceStaticGetter === 'xtendScaffoldExtensionPoints', 'Scaffold CLI extensions exposes source getter');
  context.assert(extensionsJson.rmtCompatibilityBinding && extensionsJson.rmtCompatibilityBinding.schema === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Scaffold CLI extensions exposes RMT compatibility binding');

  const files = componentFilesModule.createComponentFiles({
    tag: 'x-example',
    profile: 'stateful',
    feature: 'events'
  });
  const fileIds = Array.isArray(files.files) ? files.files.map((file) => file.id) : [];
  context.assert(files.ok === true, 'Component files generator validates a display component input');
  context.assert(files.schema === 'xtend.scaffold.component-files.v1', 'Component files generator exposes stable schema');
  context.assert(files.mode === 'dry-run', 'Component files generator remains dry-run');
  context.assert(files.wiring && files.wiring.manifest && files.wiring.manifest.schema === 'xtend.scaffold.manifest-wiring.v1', 'Component files generator exposes manifest wiring schema');
  context.assert(files.wiring && files.wiring.hydration && files.wiring.hydration.schema === 'xtend.scaffold.hydration-wiring.v1', 'Component files generator exposes hydration wiring schema');
  context.assert(files.wiring && files.wiring.features && files.wiring.features.schema === 'xtend.scaffold.feature-wiring.v1', 'Component files generator exposes feature wiring schema');
  context.assert(files.wiring && files.wiring.typing && files.wiring.typing.schema === 'xtend.scaffold.component-typing.v1', 'Component files generator exposes typing schema');
  context.assert(files.wiring && files.wiring.preview && files.wiring.preview.schema === 'xtend.scaffold.component-preview.v1', 'Component files generator exposes preview schema');
  context.assert(files.wiring && files.wiring.extensions && files.wiring.extensions.schema === 'xtend.scaffold.component-extension-points.v1', 'Component files generator exposes extension schema');
  context.assert(files.wiring && files.wiring.a11y && files.wiring.a11y.schema === 'xtend.a11y.profile.v1', 'Component files generator exposes A11y profile schema');
  context.assert(files.wiring && files.wiring.a11y && files.wiring.a11y.testContract === 'xtend.a11y.test-contract.v1', 'Component files generator exposes A11y test contract');
  context.assert(files.wiring && files.wiring.a11y && files.wiring.a11y.screenreader && files.wiring.a11y.screenreader.contract === 'xtend.a11y.screenreader-signals.v1', 'Component files generator exposes Screenreader signal contract');
  context.assert(files.wiring && files.wiring.a11y && files.wiring.a11y.motionContrast && files.wiring.a11y.motionContrast.contract === 'xtend.a11y.motion-contrast-policy.v1', 'Component files generator exposes Motion and Contrast policy contract');
  context.assert(files.wiring && files.wiring.performance && files.wiring.performance.schema === 'xtend.performance.component-profile.v1', 'Component files generator exposes Performance profile schema');
  context.assert(files.wiring && files.wiring.performance && files.wiring.performance.policySchema === 'xtend.scaffold.performance-policy.v1', 'Component files generator exposes Performance policy schema');
  context.assert(files.wiring && files.wiring.componentContractV2 && files.wiring.componentContractV2.schema === 'xtend.component.contract.v2', 'Component files generator exposes Component Contract v2 wiring');
  context.assert(files.wiring && files.wiring.componentContractV2Report && files.wiring.componentContractV2Report.ok === true, 'Component files generator validates Component Contract v2 wiring');
  context.assert(files.wiring && files.wiring.typescript && files.wiring.typescript.schema === 'xtend.scaffold.typescript-component-blueprint.v1', 'Component files generator exposes TypeScript Component Blueprint wiring');
  context.assert(files.rmtCompatibility && files.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Component files generator exposes top-level RMT compatibility binding');
  context.assert(
    files.wiring && files.wiring.typing && files.wiring.typing.rmtCompatibility && files.wiring.typing.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component files generator exposes typing RMT compatibility binding'
  );
  context.assert(
    files.wiring && files.wiring.preview && files.wiring.preview.rmtCompatibility && files.wiring.preview.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component files generator exposes preview RMT compatibility binding'
  );
  context.assert(
    files.wiring && files.wiring.extensions && files.wiring.extensions.rmtCompatibilityBinding && files.wiring.extensions.rmtCompatibilityBinding.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component files generator exposes extension RMT compatibility binding'
  );
  context.assert(
    files.wiring && files.wiring.manifest && files.wiring.manifest.patchPlan.source === 'components/x-example.js',
    'Component files generator creates deterministic manifest source path'
  );
  context.assert(
    files.wiring && files.wiring.manifest && files.wiring.manifest.patchPlan.localImportOnly === true,
    'Component files generator keeps manifest imports local-only'
  );
  context.assert(
    files.wiring && files.wiring.manifest && files.wiring.manifest.patchPlan.cdnAllowed === false,
    'Component files generator rejects CDN manifest imports'
  );
  context.assert(
    files.wiring && files.wiring.hydration && files.wiring.hydration.fixture.scriptPath === '../../../components/x-example.js',
    'Component files generator creates repo-local hydration fixture path'
  );
  context.assert(
    files.wiring && files.wiring.hydration && files.wiring.hydration.fixture.resultObject === 'window.__XExampleFixtureResult',
    'Component files generator creates stable hydration fixture result object'
  );
  context.assert(
    files.wiring && files.wiring.features && files.wiring.features.state.prefix === 'xtend.component.x-example.<id>.',
    'Component files generator creates canonical component state prefix'
  );
  context.assert(
    files.wiring && files.wiring.features && files.wiring.features.state.keys.includes('xtend.component.x-example.<id>.value'),
    'Component files generator creates canonical value state key'
  );
  context.assert(
    files.wiring && files.wiring.features && files.wiring.features.events.names.includes('example-changed'),
    'Component files generator creates profile event name'
  );
  context.assert(
    files.wiring && files.wiring.features && files.wiring.features.state.subscribe === 'xstate.subscribe(fn, keyFilter?)',
    'Component files generator prefers canonical xstate subscription API'
  );
  context.assert(
    files.wiring && files.wiring.features && files.wiring.features.state.forbidden.includes('xstate.on'),
    'Component files generator marks xstate.on as forbidden'
  );
  context.assert(
    files.wiring && files.wiring.features && files.wiring.features.api.forbiddenGlobals.includes('window.showXExample'),
    'Component files generator marks unnamespaced helper as forbidden'
  );
  ['component', 'docs', 'tests', 'fixtures', 'types', 'manifest', 'demo', 'ts-source', 'ts-contract', 'ts-rmt', 'ts-a11y', 'ts-performance', 'ts-fixture'].forEach((artifact) => {
    context.assert(fileIds.includes(artifact), `Component files generator renders ${artifact} artifact`);
  });
  const testFile = files.files.find((file) => file.id === 'tests');
  context.assert(testFile && testFile.content.includes('context.assert('), 'Component files generator renders test suite with assertions');
  context.assert(testFile && !testFile.content.includes('TODO'), 'Component files generator renders test suite without TODO placeholder');
  const sourceFile = files.files.find((file) => file.id === 'component');
  context.assert(sourceFile && sourceFile.content.includes("customElements.define('x-example'"), 'Component files generator renders Custom Element registration');
  context.assert(sourceFile && sourceFile.content.includes('hydrate()'), 'Component files generator renders explicit hydration method');
  context.assert(sourceFile && sourceFile.content.includes('disconnectedCallback'), 'Component files generator renders disconnect cleanup');
  context.assert(sourceFile && sourceFile.content.includes('data-xtend-hydrated'), 'Component files generator renders hydration marker');
  context.assert(sourceFile && sourceFile.content.includes('xtendScaffoldWiring'), 'Component files generator renders feature wiring metadata');
  context.assert(sourceFile && sourceFile.content.includes('xtendScaffoldExtensionPoints'), 'Component files generator renders extension point metadata');
  context.assert(sourceFile && sourceFile.content.includes('xtendScaffoldA11yProfile'), 'Component files generator renders A11y profile metadata');
  context.assert(sourceFile && sourceFile.content.includes('xtend.a11y.profile.v1'), 'Component files generator renders A11y profile schema in source');
  context.assert(sourceFile && sourceFile.content.includes('xtend.a11y.test-contract.v1'), 'Component files generator renders A11y test contract in source');
  context.assert(sourceFile && sourceFile.content.includes('xtend.a11y.screenreader-signals.v1'), 'Component files generator renders Screenreader signal schema in source');
  context.assert(sourceFile && sourceFile.content.includes('a11y.user-blocking.announce'), 'Component files generator renders Screenreader A11y schedule in source');
  context.assert(sourceFile && sourceFile.content.includes('xtend.a11y.motion-contrast-policy.v1'), 'Component files generator renders Motion and Contrast policy schema in source');
  context.assert(sourceFile && sourceFile.content.includes('a11y.user-blocking.preference'), 'Component files generator renders Motion and Contrast A11y schedule in source');
  context.assert(sourceFile && sourceFile.content.includes('@media (prefers-reduced-motion: reduce)'), 'Component files generator renders reduced-motion CSS in source');
  context.assert(sourceFile && sourceFile.content.includes('@media (forced-colors: active)'), 'Component files generator renders forced-colors CSS in source');
  context.assert(sourceFile && sourceFile.content.includes('xtendScaffoldPerformanceProfile'), 'Component files generator renders Performance profile metadata');
  context.assert(sourceFile && sourceFile.content.includes('xtend.performance.component-profile.v1'), 'Component files generator renders Performance profile schema in source');
  context.assert(sourceFile && sourceFile.content.includes('xtend.scaffold.performance-policy.v1'), 'Component files generator renders Performance policy schema in source');
  context.assert(sourceFile && sourceFile.content.includes("'aria-label'"), 'Component files generator observes accessible name attribute');
  context.assert(sourceFile && sourceFile.content.includes('role="${role}"'), 'Component files generator renders role semantics');
  context.assert(sourceFile && sourceFile.content.includes('beforeHydrate()'), 'Component files generator renders beforeHydrate hook');
  context.assert(sourceFile && sourceFile.content.includes('afterRender()'), 'Component files generator renders afterRender hook');
  context.assert(sourceFile && sourceFile.content.includes('onDisconnect()'), 'Component files generator renders onDisconnect hook');
  context.assert(sourceFile && sourceFile.content.includes('xtend.scaffold.component-extension-points.v1'), 'Component files generator renders extension schema in source');
  context.assert(sourceFile && sourceFile.content.includes('xtend.component.x-example.<id>.'), 'Component files generator renders canonical state prefix metadata');
  context.assert(sourceFile && sourceFile.content.includes('example-changed'), 'Component files generator renders profile event metadata');
  context.assert(sourceFile && !sourceFile.content.includes('xstate.on(') && !sourceFile.content.includes('xstate.off('), 'Component files generator avoids legacy xstate listener calls');
  context.assert(sourceFile && !sourceFile.content.includes('window.show'), 'Component files generator avoids unnamespaced global helpers in source');
  try {
    new Function(sourceFile.content);
    context.pass('Component files generator renders syntactically valid component source');
  } catch (error) {
    context.fail(`Component files generator renders syntactically valid component source (${error.message})`);
  }
  try {
    new Function(testFile.content);
    context.pass('Component files generator renders syntactically valid component suite');
  } catch (error) {
    context.fail(`Component files generator renders syntactically valid component suite (${error.message})`);
  }
  const fixtureFile = files.files.find((file) => file.id === 'fixtures');
  context.assert(fixtureFile && fixtureFile.content.includes('../../../components/x-example.js'), 'Component files generator renders repo-local fixture script');
  context.assert(fixtureFile && fixtureFile.content.includes('window.__XExampleFixtureResult'), 'Component files generator renders stable fixture result object');
  context.assert(fixtureFile && fixtureFile.content.includes('hydrated:'), 'Component files generator renders hydration fixture check');
  context.assert(fixtureFile && fixtureFile.content.includes('aria-label="XExample component"'), 'Component files generator renders fixture accessible name');
  context.assert(fixtureFile && fixtureFile.content.includes('a11yProfile:'), 'Component files generator renders fixture A11y profile check');
  context.assert(fixtureFile && fixtureFile.content.includes('screenreaderSignals:'), 'Component files generator renders fixture Screenreader signal result');
  context.assert(fixtureFile && fixtureFile.content.includes('motionContrastPolicy:'), 'Component files generator renders fixture Motion and Contrast result');
  context.assert(fixtureFile && fixtureFile.content.includes('accessibleName:'), 'Component files generator renders fixture accessible name result');
  context.assert(fixtureFile && fixtureFile.content.includes('cdnFree: true'), 'Component files generator renders CDN-free fixture marker');
  context.assert(fixtureFile && !fixtureFile.content.includes('https://') && !fixtureFile.content.includes('http://'), 'Component files generator avoids external fixture imports');
  const manifestFile = files.files.find((file) => file.id === 'manifest');
  context.assert(manifestFile && manifestFile.content.includes('"operation": "add-component"'), 'Component files generator renders manifest patch plan');
  let manifestPlan = null;
  try {
    manifestPlan = JSON.parse(manifestFile.content);
    context.pass('Component files generator renders parseable manifest patch plan');
  } catch (error) {
    context.fail(`Component files generator renders parseable manifest patch plan (${error.message})`);
  }
  context.assert(manifestPlan && manifestPlan.source === 'components/x-example.js', 'Component files generator renders deterministic manifest source');
  context.assert(manifestPlan && manifestPlan.importMode === 'repo-local', 'Component files generator renders repo-local manifest import mode');
  context.assert(manifestPlan && manifestPlan.hydrationMode === 'custom-element', 'Component files generator renders custom-element hydration mode');
  context.assert(manifestPlan && manifestPlan.localImportOnly === true, 'Component files generator renders local-only manifest flag');
  context.assert(manifestPlan && manifestPlan.cdnAllowed === false, 'Component files generator renders CDN rejection flag');
  context.assert(manifestPlan && manifestPlan.featureWiring && manifestPlan.featureWiring.schema === 'xtend.scaffold.feature-wiring.v1', 'Component files generator renders feature wiring manifest plan');
  context.assert(manifestPlan && manifestPlan.a11yProfile && manifestPlan.a11yProfile.schema === 'xtend.a11y.profile.v1', 'Component files generator renders A11y profile manifest plan');
  context.assert(manifestPlan && manifestPlan.screenreaderSignals && manifestPlan.screenreaderSignals.schema === 'xtend.a11y.screenreader-signals.v1', 'Component files generator renders Screenreader signal manifest plan');
  context.assert(manifestPlan && manifestPlan.motionContrastPolicy && manifestPlan.motionContrastPolicy.schema === 'xtend.a11y.motion-contrast-policy.v1', 'Component files generator renders Motion and Contrast manifest plan');
  context.assert(manifestPlan && manifestPlan.performanceProfile && manifestPlan.performanceProfile.schema === 'xtend.performance.component-profile.v1', 'Component files generator renders Performance profile manifest plan');
  context.assert(manifestPlan && manifestPlan.performanceProfile && manifestPlan.performanceProfile.policySchema === 'xtend.scaffold.performance-policy.v1', 'Component files generator renders Performance policy manifest plan');
  context.assert(
    manifestPlan && manifestPlan.performanceProfile && Array.isArray(manifestPlan.performanceProfile.criticalMeasurements) && manifestPlan.performanceProfile.criticalMeasurements.includes('xtend.event.handler'),
    'Component files generator renders Performance critical measurements in manifest plan'
  );
  context.assert(
    manifestPlan && manifestPlan.a11yProfile && manifestPlan.a11yProfile.testPlan && manifestPlan.a11yProfile.testPlan.schema === 'xtend.a11y.test-contract.v1',
    'Component files generator renders A11y test contract manifest plan'
  );
  context.assert(
    manifestPlan && manifestPlan.a11yProfile && manifestPlan.a11yProfile.scaffold && manifestPlan.a11yProfile.scaffold.requiredFixtureAttributes.includes('aria-label'),
    'Component files generator renders A11y fixture obligation in manifest plan'
  );
  context.assert(
    manifestPlan && manifestPlan.featureWiring && manifestPlan.featureWiring.stateKeys.includes('xtend.component.x-example.<id>.value'),
    'Component files generator renders feature state keys in manifest plan'
  );
  context.assert(
    manifestPlan && manifestPlan.featureWiring && manifestPlan.featureWiring.events.includes('example-changed'),
    'Component files generator renders feature events in manifest plan'
  );
  context.assert(
    manifestPlan && manifestPlan.featureWiring && manifestPlan.featureWiring.localUiPolicy === 'derived-render-cache-only',
    'Component files generator renders local UI policy in manifest plan'
  );
  context.assert(manifestPlan && manifestPlan.typing && manifestPlan.typing.schema === 'xtend.scaffold.component-typing.v1', 'Component files generator renders typing manifest plan');
  context.assert(
    manifestPlan && manifestPlan.typing && manifestPlan.typing.rmtAttachment && manifestPlan.typing.rmtAttachment.adapter === 'xtend.component',
    'Component files generator renders RMT component adapter typing plan'
  );
  context.assert(
    manifestPlan && manifestPlan.typing && manifestPlan.typing.rmtAttachment && manifestPlan.typing.rmtAttachment.routerAdapter === 'xtend.xrouter',
    'Component files generator renders XRouter adapter typing plan'
  );
  context.assert(
    manifestPlan && manifestPlan.typing && manifestPlan.typing.rmtAttachment && manifestPlan.typing.rmtAttachment.templateAuthoring && manifestPlan.typing.rmtAttachment.templateAuthoring.contractVersion === 'xtend.rmt.template-authoring.v1',
    'Component files generator renders RMT template authoring typing plan'
  );
  context.assert(
    manifestPlan && manifestPlan.typing && manifestPlan.typing.rmtAttachment && manifestPlan.typing.rmtAttachment.rootLifecycle && manifestPlan.typing.rmtAttachment.rootLifecycle.contractVersion === 'xtend.rmt.root-handshake.v1',
    'Component files generator renders RMT root handshake typing plan'
  );
  context.assert(
    manifestPlan && manifestPlan.typing && manifestPlan.typing.rmtAttachment && manifestPlan.typing.rmtAttachment.hostCapabilities && manifestPlan.typing.rmtAttachment.hostCapabilities.contractVersion === 'xtend.rmt.host-capabilities.v1',
    'Component files generator renders RMT host capabilities typing plan'
  );
  context.assert(
    manifestPlan && manifestPlan.typing && manifestPlan.typing.rmtCompatibility && manifestPlan.typing.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component files generator renders typing RMT compatibility plan'
  );
  context.assert(manifestPlan && manifestPlan.preview && manifestPlan.preview.schema === 'xtend.scaffold.component-preview.v1', 'Component files generator renders preview manifest plan');
  context.assert(
    manifestPlan && manifestPlan.preview && manifestPlan.preview.preview && manifestPlan.preview.preview.externalNetworkAllowed === false,
    'Component files generator renders local-only preview manifest plan'
  );
  context.assert(
    manifestPlan && manifestPlan.preview && manifestPlan.preview.rmtCompatibility && manifestPlan.preview.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component files generator renders preview RMT compatibility plan'
  );
  context.assert(manifestPlan && manifestPlan.extensions && manifestPlan.extensions.schema === 'xtend.scaffold.component-extension-points.v1', 'Component files generator renders extension manifest plan');
  context.assert(
    manifestPlan && manifestPlan.extensions && manifestPlan.extensions.templating && manifestPlan.extensions.templating.adapter === 'xtend.template',
    'Component files generator renders template adapter extension plan'
  );
  context.assert(
    manifestPlan && manifestPlan.extensions && manifestPlan.extensions.templating && manifestPlan.extensions.templating.contractVersion === 'xtend.rmt.template-authoring.v1',
    'Component files generator renders template authoring extension plan'
  );
  context.assert(
    manifestPlan && manifestPlan.extensions && manifestPlan.extensions.schedulerHandshake && manifestPlan.extensions.schedulerHandshake.contractVersion === 'xtend.rmt.root-handshake.v1',
    'Component files generator renders scheduler handshake extension plan'
  );
  context.assert(
    manifestPlan && manifestPlan.extensions && manifestPlan.extensions.hostCapabilities && manifestPlan.extensions.hostCapabilities.contractVersion === 'xtend.rmt.host-capabilities.v1',
    'Component files generator renders host capabilities extension plan'
  );
  context.assert(
    manifestPlan && manifestPlan.extensions && manifestPlan.extensions.rmtCompatibilityBinding && manifestPlan.extensions.rmtCompatibilityBinding.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component files generator renders extension RMT compatibility binding plan'
  );
  context.assert(
    manifestPlan && manifestPlan.extensions && manifestPlan.extensions.boundaries && manifestPlan.extensions.boundaries.noRuntimeImports === true,
    'Component files generator renders extension runtime boundary'
  );
  context.assert(
    manifestPlan && manifestPlan.rmtCompatibility && manifestPlan.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Component files generator renders manifest RMT compatibility binding'
  );
  context.assert(
    manifestPlan && manifestPlan.rmtCompatibility && manifestPlan.rmtCompatibility.contractRefs && manifestPlan.rmtCompatibility.contractRefs.hostCapabilities === 'xtend.rmt.host-capabilities.v1',
    'Component files generator renders manifest host capabilities contract ref'
  );
  context.assert(
    manifestPlan && manifestPlan.rmtCompatibility && manifestPlan.rmtCompatibility.manifestPlanRequirements && manifestPlan.rmtCompatibility.manifestPlanRequirements.localImportOnly === true,
    'Component files generator renders manifest RMT compatibility local import requirement'
  );
  const typesFile = files.files.find((file) => file.id === 'types');
  context.assert(typesFile && typesFile.content.includes('XExampleEventName'), 'Component files generator renders event name type');
  context.assert(typesFile && typesFile.content.includes('XExampleEventDetail'), 'Component files generator renders event detail type');
  context.assert(typesFile && typesFile.content.includes('xtend.enterprise.er-wp-34.public-component-types.v1'), 'Component files generator renders public component type schema');
  context.assert(typesFile && typesFile.content.includes('XExamplePublicEventContract'), 'Component files generator renders public event contract type');
  context.assert(typesFile && typesFile.content.includes('XExampleScaffoldWiring'), 'Component files generator renders scaffold wiring type');
  context.assert(typesFile && typesFile.content.includes('XExampleAttributeMap'), 'Component files generator renders attribute map type');
  context.assert(typesFile && typesFile.content.includes('XExampleRmtComponentAttachment'), 'Component files generator renders RMT component attachment type');
  context.assert(typesFile && typesFile.content.includes('XExampleRmtTemplateAttachment'), 'Component files generator renders RMT template attachment type');
  context.assert(typesFile && typesFile.content.includes('XExampleRmtRootAttachment'), 'Component files generator renders RMT root attachment type');
  context.assert(typesFile && typesFile.content.includes('XExampleRmtHostCapabilities'), 'Component files generator renders RMT host capabilities type');
  context.assert(typesFile && typesFile.content.includes('XExampleRmtCompatibilityBinding'), 'Component files generator renders RMT compatibility binding type');
  context.assert(typesFile && typesFile.content.includes('XExampleA11yProfile'), 'Component files generator renders A11y profile type');
  context.assert(typesFile && typesFile.content.includes('XExampleScreenreaderSignalContract'), 'Component files generator renders Screenreader signal contract type');
  context.assert(typesFile && typesFile.content.includes('XExampleScreenreaderSignalRecord'), 'Component files generator renders Screenreader signal record type');
  context.assert(typesFile && typesFile.content.includes('XExampleMotionContrastPolicy'), 'Component files generator renders Motion and Contrast policy type');
  context.assert(typesFile && typesFile.content.includes('XExamplePerformanceProfile'), 'Component files generator renders Performance profile type');
  context.assert(typesFile && typesFile.content.includes('XExampleA11yKeyboardKey'), 'Component files generator renders A11y keyboard type');
  context.assert(typesFile && typesFile.content.includes('xtendScaffoldA11yProfile'), 'Component files generator renders A11y getter type');
  context.assert(typesFile && typesFile.content.includes('xtendScaffoldPerformanceProfile'), 'Component files generator renders Performance getter type');
  context.assert(typesFile && typesFile.content.includes("schema: 'xtend.a11y.profile.v1'"), 'Component files generator renders A11y profile schema type');
  context.assert(typesFile && typesFile.content.includes("testContract: 'xtend.a11y.test-contract.v1'"), 'Component files generator renders A11y test contract type');
  context.assert(typesFile && typesFile.content.includes("schema: 'xtend.a11y.screenreader-signals.v1'"), 'Component files generator renders Screenreader signal schema type');
  context.assert(typesFile && typesFile.content.includes("schema: 'xtend.a11y.screenreader-signal.v1'"), 'Component files generator renders Screenreader signal record schema type');
  context.assert(typesFile && typesFile.content.includes("schema: 'xtend.a11y.motion-contrast-policy.v1'"), 'Component files generator renders Motion and Contrast schema type');
  context.assert(typesFile && typesFile.content.includes("schema: 'xtend.a11y.motion-policy.v1'"), 'Component files generator renders Motion policy schema type');
  context.assert(typesFile && typesFile.content.includes("schema: 'xtend.a11y.contrast-policy.v1'"), 'Component files generator renders Contrast policy schema type');
  context.assert(typesFile && typesFile.content.includes("schema: 'xtend.performance.component-profile.v1'"), 'Component files generator renders Performance profile schema type');
  context.assert(typesFile && typesFile.content.includes("policySchema: 'xtend.scaffold.performance-policy.v1'"), 'Component files generator renders Performance policy schema type');
  context.assert(typesFile && typesFile.content.includes('xtend.scaffold.rmt-compatibility-binding.v1'), 'Component files generator renders RMT compatibility schema type');
  context.assert(typesFile && typesFile.content.includes("contractVersion?: 'xtend.rmt.component-contract.v1'"), 'Component files generator renders RMT component contract version');
  context.assert(typesFile && typesFile.content.includes("contractVersion?: 'xtend.rmt.template-authoring.v1'"), 'Component files generator renders RMT template authoring contract version');
  context.assert(typesFile && typesFile.content.includes("contractVersion?: 'xtend.rmt.root-handshake.v1'"), 'Component files generator renders RMT root handshake contract version');
  context.assert(typesFile && typesFile.content.includes("contractVersion?: 'xtend.rmt.host-capabilities.v1'"), 'Component files generator renders RMT host capabilities contract version');
  context.assert(typesFile && typesFile.content.includes("adapter: 'xtend.template'"), 'Component files generator renders XTend template adapter type');
  context.assert(typesFile && typesFile.content.includes("source: 'xtend.manifest'"), 'Component files generator renders XTend manifest lookup type');
  context.assert(typesFile && typesFile.content.includes("stateAttribute: 'data-xtend-hydrated'"), 'Component files generator renders RMT hydration metadata type');
  context.assert(typesFile && typesFile.content.includes('XExampleExtensionPoints'), 'Component files generator renders extension points type');
  context.assert(typesFile && typesFile.content.includes('XExampleRootLifecycleHookName'), 'Component files generator renders lifecycle hook union type');
  context.assert(typesFile && typesFile.content.includes('xtendScaffoldExtensionPoints'), 'Component files generator renders extension getter type');
  context.assert(typesFile && typesFile.content.includes("adapter: 'xtend.component'"), 'Component files generator renders XTend component adapter type');
  context.assert(typesFile && typesFile.content.includes("adapter: 'xtend.xrouter'"), 'Component files generator renders XRouter adapter type');
  context.assert(typesFile && !typesFile.content.includes("from '") && !typesFile.content.includes('from "'), 'Component files generator renders types without runtime imports');
  const docsFile = files.files.find((file) => file.id === 'docs');
  context.assert(docsFile && docsFile.content.includes('API- und Feature-Wiring'), 'Component files generator renders feature wiring docs');
  context.assert(docsFile && docsFile.content.includes('xstate.subscribe(fn, keyFilter?)'), 'Component files generator renders canonical xstate subscription docs');
  context.assert(docsFile && docsFile.content.includes('Typisierung und RMT-Anschluss'), 'Component files generator renders typing and RMT attachment docs');
  context.assert(docsFile && docsFile.content.includes('A11y-Profil'), 'Component files generator renders A11y profile docs');
  context.assert(docsFile && docsFile.content.includes('xtend.a11y.profile.v1'), 'Component files generator renders A11y profile schema docs');
  context.assert(docsFile && docsFile.content.includes('xtend.a11y.test-contract.v1'), 'Component files generator renders A11y test contract docs');
  context.assert(docsFile && docsFile.content.includes('Screenreader-Signale'), 'Component files generator renders Screenreader signal docs');
  context.assert(docsFile && docsFile.content.includes('xtend.a11y.screenreader-signals.v1'), 'Component files generator renders Screenreader signal schema docs');
  context.assert(docsFile && docsFile.content.includes('a11y.user-blocking.announce'), 'Component files generator renders Screenreader schedule docs');
  context.assert(docsFile && docsFile.content.includes('Motion-und-Contrast-Policy'), 'Component files generator renders Motion and Contrast docs section');
  context.assert(docsFile && docsFile.content.includes('xtend.a11y.motion-contrast-policy.v1'), 'Component files generator renders Motion and Contrast schema docs');
  context.assert(docsFile && docsFile.content.includes('node scripts/run_xtend_tests.js motion-contrast'), 'Component files generator renders Motion and Contrast gate docs');
  context.assert(docsFile && docsFile.content.includes('Performance-Profil'), 'Component files generator renders Performance profile docs');
  context.assert(docsFile && docsFile.content.includes('Performance-Regeln'), 'Component files generator renders Performance rules docs');
  context.assert(docsFile && docsFile.content.includes('xtend.scaffold.performance-policy.v1'), 'Component files generator renders Performance policy docs');
  context.assert(docsFile && docsFile.content.includes('docs/performance.md'), 'Component files generator renders Performance author guide link');
  context.assert(docsFile && docsFile.content.includes('node scripts/run_xtend_tests.js performance-regression'), 'Component files generator renders Performance regression gate docs');
  context.assert(docsFile && docsFile.content.includes('Keyboard Contract'), 'Component files generator renders A11y keyboard docs');
  context.assert(docsFile && docsFile.content.includes('ARIA-State-Liste'), 'Component files generator renders A11y ARIA state docs');
  context.assert(docsFile && docsFile.content.includes('RMT Template Authoring'), 'Component files generator renders RMT template authoring docs');
  context.assert(docsFile && docsFile.content.includes('Root-Lifecycle- und Scheduler-Handschlag'), 'Component files generator renders RMT root handshake docs');
  context.assert(docsFile && docsFile.content.includes('XTend Host Capabilities'), 'Component files generator renders RMT host capabilities docs');
  context.assert(docsFile && docsFile.content.includes('RMT-Kompatibilitaets-Binding'), 'Component files generator renders RMT compatibility binding docs');
  context.assert(docsFile && docsFile.content.includes('Extension-Punkte'), 'Component files generator renders extension point docs');
  context.assert(docsFile && docsFile.content.includes('xtend.scaffold.component-extension-points.v1'), 'Component files generator renders extension schema docs');
  const demoFile = files.files.find((file) => file.id === 'demo');
  context.assert(demoFile && demoFile.targetPath === 'docs/previews/example.preview.md', 'Component files generator renders preview target path');
  context.assert(demoFile && demoFile.content.includes('xtend.scaffold.component-preview.v1'), 'Component files generator renders preview schema in demo plan');
  context.assert(demoFile && demoFile.content.includes('development/XTend-Dokumentations-und-Demo-Referenzpfade.md'), 'Component files generator renders reference registry path in demo plan');
  context.assert(demoFile && demoFile.content.includes('node scripts/run_xtend_tests.js references --json'), 'Component files generator renders references JSON gate in demo plan');
  context.assert(demoFile && demoFile.content.includes('node scripts/run_xtend_tests.js rmt-compatibility --json'), 'Component files generator renders RMT compatibility JSON gate in demo plan');
  context.assert(demoFile && demoFile.content.includes('External network allowed: `false`'), 'Component files generator renders local-only preview flag');
  context.assert(demoFile && demoFile.content.includes('xtend.scaffold.component-extension-points.v1'), 'Component files generator renders extension schema in demo plan');
  context.assert(demoFile && demoFile.content.includes('RMT Compatibility Binding'), 'Component files generator renders RMT compatibility binding in demo plan');
  context.assert(
    files.files
      .filter((file) => file.id !== 'tests')
      .every((file) => !file.content.includes('https://') && !file.content.includes('http://')),
    'Component files generator output avoids accidental external URLs'
  );
  context.assert(
    Array.isArray(files.exceptions) && !files.exceptions.some((entry) => entry.artifact === 'demo'),
    'Component files generator renders demo artifact instead of leaving a demo exception'
  );

  const filesOutput = [];
  const filesExitCode = cliModule.runCli(['component-files', '--tag', 'x-example', '--profile', 'display', '--json'], {
    stdout: { write: (value) => filesOutput.push(value) },
    stderr: { write: () => {} }
  });
  let filesJson = null;
  try {
    filesJson = JSON.parse(filesOutput.join(''));
  } catch (error) {
    context.fail(`Scaffold CLI component-files JSON parses (${error.message})`);
  }

  context.assert(filesExitCode === 0, 'Scaffold CLI component-files JSON exits successfully');
  context.assert(filesJson && filesJson.schema === 'xtend.scaffold.component-files.v1', 'Scaffold CLI component-files exposes stable schema');
  context.assert(filesJson && Array.isArray(filesJson.files) && filesJson.files.length >= 6, 'Scaffold CLI component-files exposes rendered files');
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.manifest && filesJson.wiring.manifest.schema === 'xtend.scaffold.manifest-wiring.v1',
    'Scaffold CLI component-files exposes manifest wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.hydration && filesJson.wiring.hydration.schema === 'xtend.scaffold.hydration-wiring.v1',
    'Scaffold CLI component-files exposes hydration wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.features && filesJson.wiring.features.schema === 'xtend.scaffold.feature-wiring.v1',
    'Scaffold CLI component-files exposes feature wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.typing && filesJson.wiring.typing.schema === 'xtend.scaffold.component-typing.v1',
    'Scaffold CLI component-files exposes typing wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.preview && filesJson.wiring.preview.schema === 'xtend.scaffold.component-preview.v1',
    'Scaffold CLI component-files exposes preview wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.extensions && filesJson.wiring.extensions.schema === 'xtend.scaffold.component-extension-points.v1',
    'Scaffold CLI component-files exposes extension wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.a11y && filesJson.wiring.a11y.schema === 'xtend.a11y.profile.v1',
    'Scaffold CLI component-files exposes A11y profile wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.a11y && filesJson.wiring.a11y.screenreader && filesJson.wiring.a11y.screenreader.contract === 'xtend.a11y.screenreader-signals.v1',
    'Scaffold CLI component-files exposes Screenreader signal wiring'
  );
  context.assert(
    filesJson && filesJson.wiring && filesJson.wiring.a11y && filesJson.wiring.a11y.motionContrast && filesJson.wiring.a11y.motionContrast.contract === 'xtend.a11y.motion-contrast-policy.v1',
    'Scaffold CLI component-files exposes Motion and Contrast wiring'
  );
  context.assert(
    filesJson && filesJson.rmtCompatibility && filesJson.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1',
    'Scaffold CLI component-files exposes RMT compatibility binding'
  );
}

function assertScaffoldWorkflowReference(context, rootDir) {
  const workflowModulePath = resolveRepoPath('xtend-builder/workflows/developer-workflow.js', rootDir);
  const cliModulePath = resolveRepoPath('xtend-builder/lib/cli.js', rootDir);
  delete require.cache[require.resolve(workflowModulePath)];
  delete require.cache[require.resolve(cliModulePath)];

  const workflowModule = require(workflowModulePath);
  const cliModule = require(cliModulePath);
  const workflow = workflowModule.createDeveloperWorkflow({
    tag: 'x-example',
    profile: 'stateful',
    feature: 'events'
  });
  const verifyPlan = workflowModule.createVerifyPlan({
    suite: 'references'
  });
  const workflowCommands = Array.isArray(workflow.entryPoints) ? workflow.entryPoints.map((entry) => entry.id) : [];
  const verifyCommands = Array.isArray(verifyPlan.commands) ? verifyPlan.commands.map((entry) => entry.id) : [];

  context.assert(workflowModule.DEVELOPER_WORKFLOW_SCHEMA === 'xtend.scaffold.developer-workflow.v1', 'Workflow module exposes stable developer workflow schema');
  context.assert(workflowModule.VERIFY_PLAN_SCHEMA === 'xtend.scaffold.verify-plan.v1', 'Workflow module exposes stable verify plan schema');
  context.assert(workflow.schema === 'xtend.scaffold.developer-workflow.v1', 'Developer workflow exposes stable schema');
  context.assert(workflow.mode === 'dry-run-first', 'Developer workflow keeps dry-run-first mode');
  context.assert(workflowCommands.includes('component-plan'), 'Developer workflow contains component-plan step');
  context.assert(workflowCommands.includes('component-files'), 'Developer workflow contains component-files step');
  context.assert(workflowCommands.includes('typing'), 'Developer workflow contains typing step');
  context.assert(workflowCommands.includes('preview'), 'Developer workflow contains preview step');
  context.assert(workflowCommands.includes('extensions'), 'Developer workflow contains extensions step');
  context.assert(workflowCommands.includes('verify'), 'Developer workflow contains verify step');
  context.assert(
    workflow.entryPoints.some((entry) => entry.command.includes('--tag x-example') && entry.command.includes('--profile stateful')),
    'Developer workflow renders example scaffold command'
  );
  context.assert(workflow.npmScripts && workflow.npmScripts.scaffoldVerify === 'npm run scaffold:verify', 'Developer workflow exposes scaffold verify NPM script');
  context.assert(workflow.npmScripts && workflow.npmScripts.scaffoldTyping === 'npm run scaffold:typing', 'Developer workflow exposes scaffold typing NPM script');
  context.assert(workflow.npmScripts && workflow.npmScripts.scaffoldPreview === 'npm run scaffold:preview', 'Developer workflow exposes scaffold preview NPM script');
  context.assert(workflow.npmScripts && workflow.npmScripts.scaffoldExtensions === 'npm run scaffold:extensions', 'Developer workflow exposes scaffold extensions NPM script');
  context.assert(workflow.rmtCompatibility && workflow.rmtCompatibility.schema === 'xtend.scaffold.rmt-compatibility-binding.v1', 'Developer workflow exposes RMT compatibility binding schema');
  context.assert(
    workflow.rmtCompatibility && Array.isArray(workflow.rmtCompatibility.requiredContracts) && workflow.rmtCompatibility.requiredContracts.includes('xtend.rmt.host-capabilities.v1'),
    'Developer workflow exposes RMT compatibility host capabilities requirement'
  );
  context.assert(workflow.rmtCompatibility && workflow.rmtCompatibility.minimumGate === 'node scripts/run_xtend_tests.js rmt-compatibility --json', 'Developer workflow exposes RMT compatibility minimum gate');
  context.assert(workflow.rmtCompatibility && workflow.rmtCompatibility.bridgeRuntime === 'reserved-for-Epic-05', 'Developer workflow reserves RMT bridge runtime for Epic 05');
  context.assert(Array.isArray(workflow.reviewChecklist) && workflow.reviewChecklist.some((entry) => entry.includes('npm test')), 'Developer workflow requires full suite before handoff');
  context.assert(
    Array.isArray(workflow.reviewChecklist) && workflow.reviewChecklist.some((entry) => entry.includes('rmtCompatibility')),
    'Developer workflow requires RMT compatibility binding review'
  );
  context.assert(
    Array.isArray(workflow.reviewChecklist) && workflow.reviewChecklist.some((entry) => entry.includes('.d.ts') && entry.includes('XTendRMT')),
    'Developer workflow requires type and XTendRMT attachment review'
  );
  context.assert(
    Array.isArray(workflow.reviewChecklist) && workflow.reviewChecklist.some((entry) => entry.includes('preview') && entry.includes('reference-registry')),
    'Developer workflow requires preview registry review'
  );
  context.assert(
    Array.isArray(workflow.reviewChecklist) && workflow.reviewChecklist.some((entry) => entry.includes('extension points') && entry.includes('no-op')),
    'Developer workflow requires no-op extension point review'
  );

  context.assert(verifyPlan.schema === 'xtend.scaffold.verify-plan.v1', 'Verify plan exposes stable schema');
  context.assert(verifyPlan.runner === 'node scripts/run_xtend_tests.js', 'Verify plan uses local XTend test runner');
  context.assert(verifyPlan.selectedSuites.includes('references'), 'Verify plan selects references suite by default request');
  context.assert(verifyPlan.requiredSuites.includes('references'), 'Verify plan includes references required suite');
  context.assert(verifyPlan.coreSuitesForRuntimeChanges.includes('architecture'), 'Verify plan includes architecture suite for runtime changes');
  context.assert(verifyCommands.includes('selected-json'), 'Verify plan contains selected JSON command');
  context.assert(verifyCommands.includes('rmt-compatibility'), 'Verify plan contains RMT compatibility command');
  context.assert(verifyCommands.includes('full'), 'Verify plan contains full test command');
  context.assert(verifyCommands.includes('report'), 'Verify plan contains report command');
  context.assert(verifyPlan.reportPath === '.xtend-test-results/xtend-test-report.json', 'Verify plan declares report path');

  const workflowOutput = [];
  const workflowExitCode = cliModule.runCli(['workflow', '--tag', 'x-example', '--profile', 'stateful', '--feature', 'events', '--json'], {
    stdout: { write: (value) => workflowOutput.push(value) },
    stderr: { write: () => {} }
  });
  const workflowJson = JSON.parse(workflowOutput.join(''));
  context.assert(workflowExitCode === 0, 'Scaffold CLI workflow JSON exits successfully');
  context.assert(workflowJson.schema === 'xtend.scaffold.developer-workflow.v1', 'Scaffold CLI workflow exposes stable schema');
  context.assert(Array.isArray(workflowJson.entryPoints), 'Scaffold CLI workflow exposes entry points');

  const verifyOutput = [];
  const verifyExitCode = cliModule.runCli(['verify', '--suite', 'references', '--json'], {
    stdout: { write: (value) => verifyOutput.push(value) },
    stderr: { write: () => {} }
  });
  const verifyJson = JSON.parse(verifyOutput.join(''));
  context.assert(verifyExitCode === 0, 'Scaffold CLI verify JSON exits successfully');
  context.assert(verifyJson.schema === 'xtend.scaffold.verify-plan.v1', 'Scaffold CLI verify exposes stable schema');
  context.assert(verifyJson.commands.some((entry) => entry.command.includes('node scripts/run_xtend_tests.js references')), 'Scaffold CLI verify exposes references command');

  const validateOutput = [];
  const validateExitCode = cliModule.runCli(['validate', '--suite', 'references', '--json'], {
    stdout: { write: (value) => validateOutput.push(value) },
    stderr: { write: () => {} }
  });
  const validateJson = JSON.parse(validateOutput.join(''));
  context.assert(validateExitCode === 0, 'Scaffold CLI validate alias exits successfully');
  context.assert(validateJson.schema === 'xtend.scaffold.verify-plan.v1', 'Scaffold CLI validate aliases verify plan');
  context.assert(validateJson.commands.some((entry) => entry.command.includes('node scripts/run_xtend_tests.js references')), 'Scaffold CLI validate exposes references command');
}

function assertTestObligationReferences(context, rootDir) {
  TEST_OBLIGATION_REFERENCE_CONTRACTS.forEach((reference) => {
    assertFileExists(context, reference.path, rootDir, `${reference.label} file exists`);
    assertContracts(context, readText(reference.path, rootDir), reference.contracts, reference.label);
  });

  assertScaffoldConfigReference(context, rootDir);
}

function assertEpicClosureReferences(context, rootDir) {
  EPIC_CLOSURE_REFERENCE_CONTRACTS.forEach((reference) => {
    assertFileExists(context, reference.path, rootDir, `${reference.label} file exists`);
    assertContracts(context, readText(reference.path, rootDir), reference.contracts, reference.label);
  });
}

function assertTrustedDomPolicyReference(context, rootDir) {
  const policyPath = 'security/trusted-dom-policy.js';
  const absolutePolicyPath = resolveRepoPath(policyPath, rootDir);

  assertFileExists(context, policyPath, rootDir, 'Trusted DOM policy module exists');

  let policyModule;
  try {
    delete require.cache[require.resolve(absolutePolicyPath)];
    policyModule = require(absolutePolicyPath);
    context.pass('Trusted DOM policy module loads through CommonJS');
  } catch (error) {
    context.fail(`Trusted DOM policy module loads through CommonJS (${error.message})`);
    return;
  }

  const policy = policyModule.getTrustedDomPolicy();
  const missingBoundary = policyModule.classifyTrustedDomUse({
    markupClass: 'htmlFragment',
    sink: 'innerHTML'
  });
  const sanitizedFragment = policyModule.classifyTrustedDomUse({
    markupClass: 'htmlFragment',
    sink: 'innerHTML',
    boundary: 'xtend.security.sanitizing-boundary.v1'
  });
  const structuredTemplate = policyModule.classifyTrustedDomUse({
    markupClass: 'structuredTemplate',
    sink: 'replaceChildren'
  });
  const parsedownHtml = policyModule.classifyTrustedDomUse({
    markupClass: 'parsedownHtml',
    sink: 'innerHTML'
  });

  context.assert(policyModule.TRUSTED_DOM_POLICY_CONTRACT === 'xtend.security.trusted-dom-policy.v1', 'Trusted DOM module exports policy contract id');
  context.assert(policyModule.SANITIZING_BOUNDARY_CONTRACT === 'xtend.security.sanitizing-boundary.v1', 'Trusted DOM module exports sanitizing boundary id');
  context.assert(policyModule.MARKUP_CLASSIFICATION_CONTRACT === 'xtend.security.markup-classification.v1', 'Trusted DOM module exports markup classification id');
  context.assert(policyModule.TRUSTED_DOM_SINK_CONTRACT === 'xtend.security.trusted-dom-sink.v1', 'Trusted DOM module exports sink contract id');
  context.assert(policy.schema === 'xtend.security.trusted-dom-policy.v1', 'Trusted DOM policy exposes stable schema');
  context.assert(policy.markupClasses.htmlFragment.sanitizerRequired === true, 'Trusted DOM policy requires sanitizer for htmlFragment');
  context.assert(policy.markupClasses.parsedownHtml.sanitizerRequired === true, 'Trusted DOM policy requires sanitizer for parsedownHtml');
  context.assert(policy.markupClasses.structuredTemplate.defaultSink === 'replaceChildren', 'Trusted DOM policy keeps structured templates on replaceChildren');
  context.assert(policy.sinks.innerHTML.status === 'restricted', 'Trusted DOM policy restricts innerHTML');
  context.assert(policy.sinks.eval.status === 'forbidden', 'Trusted DOM policy forbids eval');
  context.assert(missingBoundary.ok === false, 'Trusted DOM classification refuses htmlFragment innerHTML without boundary');
  context.assert(missingBoundary.diagnostics.includes('xtend.security.sanitizer.missing'), 'Trusted DOM classification reports missing sanitizer');
  context.assert(sanitizedFragment.ok === true, 'Trusted DOM classification accepts htmlFragment innerHTML with boundary');
  context.assert(structuredTemplate.ok === true, 'Trusted DOM classification accepts structuredTemplate replaceChildren');
  context.assert(parsedownHtml.requiredBoundary === 'xtend.security.sanitizing-boundary.v1', 'Trusted DOM classification requires boundary for Parsedown HTML');
}

function assertSupplyChainPolicyReference(context, rootDir) {
  const policyPath = 'security/supply-chain-gate-policy.js';
  const verifyPath = 'scripts/verify_supply_chain_policy.js';
  const absolutePolicyPath = resolveRepoPath(policyPath, rootDir);
  const absoluteVerifyPath = resolveRepoPath(verifyPath, rootDir);
  const packageManifest = readJson('package.json', rootDir);

  assertFileExists(context, policyPath, rootDir, 'Supply-Chain policy module exists');
  assertFileExists(context, verifyPath, rootDir, 'Supply-Chain verify script exists');

  let policyModule;
  let verifyModule;
  try {
    delete require.cache[require.resolve(absolutePolicyPath)];
    policyModule = require(absolutePolicyPath);
    context.pass('Supply-Chain policy module loads through CommonJS');
  } catch (error) {
    context.fail(`Supply-Chain policy module loads through CommonJS (${error.message})`);
    return;
  }

  try {
    delete require.cache[require.resolve(absoluteVerifyPath)];
    verifyModule = require(absoluteVerifyPath);
    context.pass('Supply-Chain verify script loads through CommonJS');
  } catch (error) {
    context.fail(`Supply-Chain verify script loads through CommonJS (${error.message})`);
    return;
  }

  const plan = policyModule.createSupplyChainGatePlan();
  const classification = policyModule.classifyPackageSupplyChain(packageManifest, []);
  const report = verifyModule.runSupplyChainVerification({ rootDir });

  context.assert(policyModule.SUPPLY_CHAIN_GATE_PLAN_CONTRACT === 'xtend.security.supply-chain-gate-plan.v1', 'Supply-Chain module exports plan contract id');
  context.assert(policyModule.DEPENDENCY_AUDIT_GATE_CONTRACT === 'xtend.security.dependency-audit-gate.v1', 'Supply-Chain module exports dependency audit contract id');
  context.assert(policyModule.LICENSE_POLICY_CONTRACT === 'xtend.security.license-policy.v1', 'Supply-Chain module exports license policy contract id');
  context.assert(policyModule.VULNERABILITY_POLICY_CONTRACT === 'xtend.security.vulnerability-policy.v1', 'Supply-Chain module exports vulnerability policy contract id');
  context.assert(policyModule.RELEASE_SUPPLY_CHAIN_GATE_CONTRACT === 'xtend.security.release-supply-chain-gate.v1', 'Supply-Chain module exports release gate contract id');
  context.assert(plan.localGate === 'node scripts/verify_supply_chain_policy.js --json', 'Supply-Chain plan exposes offline local gate');
  context.assert(plan.packageScript === 'npm run test:supply-chain', 'Supply-Chain plan exposes package script');
  context.assert(plan.ciNetworkGates.includes('npm audit --audit-level=moderate'), 'Supply-Chain plan includes npm audit CI handoff');
  context.assert(plan.ciNetworkGates.includes('npm sbom --json'), 'Supply-Chain plan includes npm SBOM CI handoff');
  context.assert(classification.ok === true, 'Supply-Chain classifier accepts current package inventory');
  context.assert(report.schema === 'xtend.security.supply-chain-report.v1', 'Supply-Chain verify emits stable report schema');
  context.assert(report.ok === true, 'Supply-Chain verify passes for current package');
}

function assertComponentCatalogCoverageReference(context, rootDir) {
  const modulePath = 'catalog/component-catalog-coverage.js';
  const absoluteModulePath = resolveRepoPath(modulePath, rootDir);
  const packageManifest = readJson('package.json', rootDir);

  assertFileExists(context, modulePath, rootDir, 'Component Catalog Coverage module exists');

  let catalogModule;
  try {
    delete require.cache[require.resolve(absoluteModulePath)];
    catalogModule = require(absoluteModulePath);
    context.pass('Component Catalog Coverage module loads through CommonJS');
  } catch (error) {
    context.fail(`Component Catalog Coverage module loads through CommonJS (${error.message})`);
    return;
  }

  const report = catalogModule.createComponentCatalogCoverageReport({ rootDir });
  const gate = catalogModule.createComponentCatalogCoverageGate({ rootDir });
  const markdown = catalogModule.createMarkdownMatrix(report);
  const byTag = new Map(report.entries.map((entry) => [entry.tag, entry]));

  context.assert(catalogModule.COMPONENT_CATALOG_COVERAGE_SCHEMA === 'xtend.catalog.component-coverage-matrix.v1', 'Catalog module exports coverage matrix schema');
  context.assert(catalogModule.COMPONENT_CATALOG_ENTRY_SCHEMA === 'xtend.catalog.component-coverage-entry.v1', 'Catalog module exports entry schema');
  context.assert(catalogModule.COMPONENT_CATALOG_GATE_SCHEMA === 'xtend.catalog.component-coverage-gate.v1', 'Catalog module exports gate schema');
  context.assert(report.schema === 'xtend.catalog.component-coverage-matrix.v1', 'Catalog report exposes coverage matrix schema');
  context.assert(report.entries.length === 41, 'Catalog report covers all 41 manifest entries');
  context.assert(report.entries.every((entry) => entry.coverage.source === true), 'Catalog report resolves every manifest source');
  context.assert(report.summary.byDimension.docs.covered === 41, 'Catalog report tracks complete docs coverage');
  context.assert(!report.summary.missingByDimension.docs, 'Catalog report has no docs missing dimension after ER-WP-32');
  context.assert(report.summary.byDimension.componentSuite.covered === 41, 'Catalog report tracks complete component-suite coverage after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.fixture.covered === 41, 'Catalog report tracks complete fixture coverage after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.types.covered === 41, 'Catalog report tracks complete type coverage after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.a11y.covered === 40, 'Catalog report tracks SurfaceManager side-panel A11y coverage');
  context.assert(report.summary.byDimension.performance.missing === 2, 'Catalog report tracks current performance profile gap after WP-E12-07');
  context.assert(gate.ok === true, 'Catalog gate passes while exposing open dimensions as warnings');
  context.assert(gate.warnings.some((warning) => warning.dimension === 'performance'), 'Catalog gate exposes performance warning');
  context.assert(byTag.get('x-alert') && byTag.get('x-alert').status === 'enterprise-ready', 'Catalog report classifies x-alert as enterprise-ready');
  context.assert(byTag.get('x-router') && byTag.get('x-router').coverage.types === true, 'Catalog report detects x-router type artifact');
  context.assert(byTag.get('x-tabs') && byTag.get('x-tabs').status === 'enterprise-ready', 'Catalog report classifies x-tabs as enterprise-ready after WP-E12-02');
  context.assert(byTag.get('x-theme') && byTag.get('x-theme').status === 'enterprise-ready', 'Catalog report classifies x-theme as enterprise-ready after WP-E12-05');
  context.assert(byTag.get('x-button') && byTag.get('x-button').status === 'enterprise-ready', 'Catalog report classifies x-button as enterprise-ready after WP-E12-06');
  context.assert(byTag.get('x-icon') && byTag.get('x-icon').status === 'enterprise-ready', 'Catalog report classifies x-icon as enterprise-ready');
  context.assert(byTag.get('x-menu') && byTag.get('x-menu').status === 'enterprise-ready', 'Catalog report classifies x-menu as enterprise-ready after WP-E12-07');
  context.assert(byTag.get('xstate') && byTag.get('xstate').status === 'contract-gated', 'Catalog report classifies xstate as contract-gated after WP-E12-08');
  context.assert(byTag.get('xstate') && byTag.get('xstate').coverage.componentSuite === true, 'Catalog report detects xstate boundary suite after WP-E12-08');
  context.assert(byTag.get('xstate') && byTag.get('xstate').coverage.types === true, 'Catalog report detects xstate public types after WP-E12-08');
  context.assert(byTag.get('x-theme') && byTag.get('x-theme').coverage.a11y === true, 'Catalog report detects x-theme A11y coverage after WP-E12-04');
  context.assert(byTag.get('x-select') && byTag.get('x-select').status === 'enterprise-ready', 'Catalog report classifies x-select as enterprise-ready');
  context.assert(byTag.get('x-checkbox') && byTag.get('x-checkbox').status === 'enterprise-ready', 'Catalog report classifies x-checkbox as enterprise-ready');
  context.assert(byTag.get('x-radio') && byTag.get('x-radio').status === 'enterprise-ready', 'Catalog report classifies x-radio as enterprise-ready');
  context.assert(byTag.get('x-textarea') && byTag.get('x-textarea').status === 'enterprise-ready', 'Catalog report classifies x-textarea as enterprise-ready');
  context.assert(byTag.get('x-status') && byTag.get('x-status').status === 'enterprise-ready', 'Catalog report classifies x-status as enterprise-ready');
  context.assert(byTag.get('x-progress') && byTag.get('x-progress').status === 'enterprise-ready', 'Catalog report classifies x-progress as enterprise-ready');
  context.assert(byTag.get('x-modal') && byTag.get('x-modal').status === 'enterprise-ready', 'Catalog report classifies x-modal as enterprise-ready');
  context.assert(byTag.get('x-dialog') && byTag.get('x-dialog').status === 'enterprise-ready', 'Catalog report classifies x-dialog as enterprise-ready');
  context.assert(byTag.get('x-summary') && byTag.get('x-summary').status === 'enterprise-ready', 'Catalog report classifies x-summary as enterprise-ready');
  context.assert(byTag.get('x-summary') && byTag.get('x-summary').nextAction.includes('release-candidate'), 'Catalog report routes x-summary to release-candidate hardening');
  context.assert(byTag.get('x-utils') && byTag.get('x-utils').status === 'typed-contract-gated', 'Catalog report classifies x-utils as typed-contract-gated after WP-E12-09');
  context.assert(byTag.get('x-utils') && byTag.get('x-utils').coverage.componentSuite === true, 'Catalog report detects x-utils utility suite after WP-E12-09');
  context.assert(byTag.get('x-utils') && byTag.get('x-utils').coverage.types === true, 'Catalog report detects x-utils public types after WP-E12-09');
  context.assert(markdown.includes('| `x-modal` | `overlay` | `enterprise-ready` |'), 'Catalog markdown matrix includes x-modal enterprise-ready row');
  context.assert(markdown.includes('| `x-dialog` | `overlay` | `enterprise-ready` |'), 'Catalog markdown matrix includes x-dialog enterprise-ready row');
  context.assert(markdown.includes('| `x-select` | `form, interactive, stateful` | `enterprise-ready` |'), 'Catalog markdown matrix includes x-select enterprise-ready row');
  context.assert(markdown.includes('| `x-textarea` | `form, stateful` | `enterprise-ready` |'), 'Catalog markdown matrix includes x-textarea enterprise-ready row');
  context.assert(markdown.includes('| `x-status` | `feedback, stateful` | `enterprise-ready` |'), 'Catalog markdown matrix includes x-status enterprise-ready row');
  context.assert(markdown.includes('| `x-progress` | `feedback, stateful` | `enterprise-ready` |'), 'Catalog markdown matrix includes x-progress enterprise-ready row');
  context.assert(markdown.includes('| `x-utils` | `utility` | `typed-contract-gated` |'), 'Catalog markdown matrix includes x-utils typed-contract-gated row');
  context.assert((packageManifest.exports['./catalog/component-catalog-coverage'] === './catalog/component-catalog-coverage.js' || (packageManifest.exports['./catalog/component-catalog-coverage'] && packageManifest.exports['./catalog/component-catalog-coverage'].default === './catalog/component-catalog-coverage.js')), 'Package exports Component Catalog Coverage module');
  context.assert(packageManifest.scripts['test:catalog-coverage'] === 'node scripts/run_xtend_tests.js catalog-coverage', 'Package exposes Component Catalog Coverage script');
  context.assert(packageManifest.xtend.componentCatalogCoverage.schema === 'xtend.catalog.component-coverage-matrix.v1', 'Package metadata exposes catalog coverage schema');
  context.assert(packageManifest.xtend.componentPublicTypes.schema === 'xtend.enterprise.er-wp-34.public-component-types.v1', 'Package metadata exposes public component types schema');
  context.assert(packageManifest.xtend.componentPublicTypes.typedPriorityComponents === 41, 'Package metadata exposes public component type coverage count after SurfaceManager side-panel runtime');
  context.assert(packageManifest.xtend.epic10FormSelectionControls.schema === 'xtend.epic10.form-selection-controls.v1', 'Package metadata exposes form selection controls schema');
  context.assert(packageManifest.xtend.epic10FormFeedbackControls.schema === 'xtend.epic10.form-feedback-controls.v1', 'Package metadata exposes form feedback controls schema');
  context.assert((packageManifest.exports['./catalog/component-regression-priority'] === './catalog/component-regression-priority.js' || (packageManifest.exports['./catalog/component-regression-priority'] && packageManifest.exports['./catalog/component-regression-priority'].default === './catalog/component-regression-priority.js')), 'Package exports Component Regression Priority module');
  context.assert(packageManifest.scripts['test:regression-priority'] === 'node scripts/run_xtend_tests.js regression-priority', 'Package exposes Component Regression Priority script');
  context.assert(packageManifest.xtend.componentRegressionPriority.schema === 'xtend.catalog.component-regression-priority-plan.v1', 'Package metadata exposes regression priority schema');
}

function assertComponentRegressionPriorityReference(context, rootDir) {
  const modulePath = 'catalog/component-regression-priority.js';
  const absoluteModulePath = resolveRepoPath(modulePath, rootDir);
  const packageManifest = readJson('package.json', rootDir);

  assertFileExists(context, modulePath, rootDir, 'Component Regression Priority module exists');

  let priorityModule;
  try {
    delete require.cache[require.resolve(absoluteModulePath)];
    priorityModule = require(absoluteModulePath);
    context.pass('Component Regression Priority module loads through CommonJS');
  } catch (error) {
    context.fail(`Component Regression Priority module loads through CommonJS (${error.message})`);
    return;
  }

  const plan = priorityModule.createComponentRegressionPriorityPlan({ rootDir });
  const gate = priorityModule.createComponentRegressionPriorityGate({ rootDir });
  const byTag = new Map(plan.entries.map((entry) => [entry.tag, entry]));

  context.assert(priorityModule.COMPONENT_REGRESSION_PRIORITY_SCHEMA === 'xtend.catalog.component-regression-priority-plan.v1', 'Regression priority module exports plan schema');
  context.assert(priorityModule.COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA === 'xtend.catalog.component-regression-priority-entry.v1', 'Regression priority module exports entry schema');
  context.assert(priorityModule.COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA === 'xtend.catalog.component-regression-priority-gate.v1', 'Regression priority module exports gate schema');
  context.assert(plan.schema === 'xtend.catalog.component-regression-priority-plan.v1', 'Regression priority plan exposes schema');
  context.assert(plan.entries.length === 41, 'Regression priority plan covers all 41 manifest entries');
  context.assert(plan.summary.requiresPerformanceProfile === 2, 'Regression priority plan tracks performance authoring for remaining legacy entries after WP-E12-07');
  context.assert(plan.summary.requiresA11yRemediation === 1, 'Regression priority plan tracks remaining A11y remediation count after WP-E12-04');
  context.assert(plan.summary.requiresLongTailSuite === 0, 'Regression priority plan closes long-tail suite count after WP-E12-09');
  context.assert(gate.ok === true, 'Regression priority gate passes');
  context.assert(gate.warnings.some((warning) => warning.dimension === 'performance'), 'Regression priority gate exposes performance warning');
  context.assert(byTag.get('x-router') && byTag.get('x-router').tier === 'p0-browser-critical', 'Regression priority plan classifies x-router as P0 browser-critical');
  context.assert(byTag.get('x-select') && byTag.get('x-select').tier === 'p0-browser-critical', 'Regression priority plan classifies x-select as P0 browser-critical');
  context.assert(byTag.get('x-textarea') && byTag.get('x-textarea').tier === 'p0-browser-critical', 'Regression priority plan classifies x-textarea as P0 browser-critical');
  context.assert(byTag.get('x-status') && byTag.get('x-status').tier === 'p1-visual-performance', 'Regression priority plan classifies x-status as P1 visual/performance');
  context.assert(byTag.get('x-progress') && byTag.get('x-progress').tier === 'p1-visual-performance', 'Regression priority plan classifies x-progress as P1 visual/performance');
  context.assert(byTag.get('x-router') && byTag.get('x-router').browserSmokes.includes('rmt-route-adapter'), 'Regression priority plan includes x-router RMT route adapter smoke');
  context.assert(byTag.get('x-modal') && byTag.get('x-modal').browserSmokes.includes('focus-trap'), 'Regression priority plan includes x-modal focus trap smoke');
  context.assert(byTag.get('x-theme') && !byTag.get('x-theme').remediation.includes('a11y-profile-remediation'), 'Regression priority plan closes x-theme A11y remediation after WP-E12-04');
  context.assert(byTag.get('x-utils') && byTag.get('x-utils').browserSmokes.includes('utility-integration-probe'), 'Regression priority plan keeps x-utils utility probe visible');
  context.assert(packageManifest.xtend.componentRegressionPriority.localGate === 'node scripts/run_xtend_tests.js regression-priority --json', 'Package metadata exposes regression priority local gate');
}

function assertCiDefaultGatesReference(context, rootDir) {
  const workflowPath = '.github/workflows/xtend-default-gates.yml';
  const packageManifest = readJson('package.json', rootDir);
  const workflow = readText(workflowPath, rootDir);
  const ciMetadata = packageManifest.xtend && packageManifest.xtend.ciDefaultGates;
  const gateMatrix = packageManifest.xtend && packageManifest.xtend.ciGateMatrix;
  const prFastGate = (gateMatrix && gateMatrix.prFastGate) || {};
  const fullReleaseGate = (gateMatrix && gateMatrix.fullReleaseGate) || {};
  const nightlyGate = (gateMatrix && gateMatrix.nightlyGate) || {};

  assertFileExists(context, workflowPath, rootDir, 'CI default gates workflow exists');
  context.assertIncludes(workflow, 'name: XTend CI Gates', 'CI workflow declares stable name');
  context.assertIncludes(workflow, 'pull_request:', 'CI workflow runs on pull requests');
  context.assertIncludes(workflow, 'push:', 'CI workflow runs full gates on push');
  context.assertIncludes(workflow, 'schedule:', 'CI workflow supports nightly schedule');
  context.assertIncludes(workflow, "cron: '17 3 * * *'", 'CI workflow declares stable nightly cron');
  context.assertIncludes(workflow, 'workflow_dispatch:', 'CI workflow supports manual dispatch');
  context.assertIncludes(workflow, 'pr-fast-gates:', 'CI workflow declares PR fast gate job');
  context.assertIncludes(workflow, 'full-release-gates:', 'CI workflow declares full release gate job');
  context.assertIncludes(workflow, 'actions/setup-node@v6', 'CI workflow uses setup-node action');
  context.assertIncludes(workflow, 'node-version: 26.x', 'CI workflow pins Node 26.x');
  context.assertIncludes(workflow, 'npm run test:pr:report', 'CI workflow runs PR report gate');
  context.assertIncludes(workflow, 'npm run test:release:full:report', 'CI workflow runs full release report gate');
  context.assertIncludes(workflow, 'actions/upload-artifact@v7', 'CI workflow uploads report artifact');
  context.assertIncludes(workflow, '.xtend-test-results/xtend-pr-gate-report.json', 'CI workflow uploads PR JSON report');
  context.assertIncludes(workflow, '.xtend-test-results/xtend-release-gate-report.json', 'CI workflow uploads full release JSON report');
  context.assertIncludes(workflow, 'xtend-pr-gate-report-node-26', 'CI workflow uses stable PR report artifact name');
  context.assertIncludes(workflow, 'xtend-release-gate-report-node-26', 'CI workflow uses stable release report artifact name');

  context.assert(ciMetadata && ciMetadata.schema === 'xtend.ci.default-gates.v1', 'Package metadata exposes CI default gates schema');
  context.assert(ciMetadata.workflow === workflowPath, 'Package metadata exposes CI workflow path');
  context.assert(ciMetadata.nodeVersion === '26.x', 'Package metadata exposes CI Node version');
  context.assert(ciMetadata.defaultGate === 'npm run test:report', 'Package metadata exposes CI default gate command');
  context.assert(ciMetadata.reportPath === '.xtend-test-results/xtend-test-report.json', 'Package metadata exposes CI report path');
  context.assert(ciMetadata.artifactName === 'xtend-test-report-node-26', 'Package metadata exposes CI report artifact name');
  context.assert(packageManifest.scripts['test:report'] === 'node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json', 'Package exposes report gate script');
  context.assert(gateMatrix && gateMatrix.schema === 'xtend.ci.gate-matrix.v1', 'Package metadata exposes CI gate matrix schema');
  context.assert(gateMatrix.workflow === workflowPath, 'Package gate matrix exposes CI workflow path');
  context.assert(gateMatrix.nodeVersion === '26.x', 'Package gate matrix exposes CI Node version');
  context.assert(prFastGate.schema === 'xtend.ci.pr-fast-gate.v1', 'Package metadata exposes PR fast gate schema');
  context.assert(prFastGate.command === 'npm run test:pr:report', 'Package metadata exposes PR fast report command');
  context.assert(prFastGate.reportPath === '.xtend-test-results/xtend-pr-gate-report.json', 'Package metadata exposes PR fast report path');
  context.assert(prFastGate.artifactName === 'xtend-pr-gate-report-node-26', 'Package metadata exposes PR fast artifact name');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('core'), 'PR fast gate includes core suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-contract-v2'), 'PR fast gate includes Component Contract v2 suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-lab-rmt-inspector'), 'PR fast gate includes Component Lab suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-lab-ux-inspector'), 'PR fast gate includes Component Lab UX Inspector suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('rmt-first-demo-app'), 'PR fast gate includes RMT-first demo suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('existing-component-metadata'), 'PR fast gate includes Existing Component Metadata suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('epic10-platform-gates'), 'PR fast gate includes Epic 10 Platform Gates suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('epic10-release-handoff'), 'PR fast gate includes Epic 10 Release Handoff suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('browser'), 'PR fast gate includes browser suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('runtime-a11y-contract'), 'PR fast gate includes Runtime A11y Contract suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-ux-performance'), 'PR fast gate includes Component UX Performance suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-network-contract'), 'PR fast gate includes Component Network suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('rmt-shell-authoring-ux'), 'PR fast gate includes RMT Shell Authoring UX suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('form-controls-ux'), 'PR fast gate includes Form Controls UX suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('feedback-status-ux'), 'PR fast gate includes Feedback Status UX suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('navigation-routing-ux'), 'PR fast gate includes Navigation Routing UX suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('overlay-interaction-ux'), 'PR fast gate includes Overlay Interaction UX suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-ux-browser-smokes'), 'PR fast gate includes Component UX browser smoke suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-shell-theme-matrix'), 'PR fast gate includes Component Shell Theme Matrix suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-ux-authoring-docs'), 'PR fast gate includes Component UX Authoring Docs suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('component-long-tail-migration'), 'PR fast gate includes Component Long-Tail Migration suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('epic11-enterprise-ux-handoff'), 'PR fast gate includes Epic 11 Enterprise UX Handoff suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('manifest-import-policy'), 'PR fast gate includes manifest import policy suite');
  context.assert(Array.isArray(prFastGate.suites) && prFastGate.suites.includes('docs-rmt-pilot'), 'PR fast gate includes Docs RMT pilot suite');
  context.assert(Array.isArray(prFastGate.suites) && !prFastGate.suites.includes('performance-regression'), 'PR fast gate excludes performance regression suite');
  context.assert(fullReleaseGate.schema === 'xtend.ci.full-release-gate.v1', 'Package metadata exposes full release gate schema');
  context.assert(fullReleaseGate.command === 'npm run test:release:full:report', 'Package metadata exposes full release report command');
  context.assert(fullReleaseGate.reportPath === '.xtend-test-results/xtend-release-gate-report.json', 'Package metadata exposes full release report path');
  context.assert(fullReleaseGate.artifactName === 'xtend-release-gate-report-node-26', 'Package metadata exposes full release artifact name');
  context.assert(Array.isArray(fullReleaseGate.suites) && fullReleaseGate.suites.includes('all'), 'Full release gate runs all suites');
  context.assert(nightlyGate.schema === 'xtend.ci.nightly-gate.v1', 'Package metadata exposes nightly gate schema');
  context.assert(nightlyGate.cron === '17 3 * * *', 'Package metadata exposes nightly cron');
  context.assert(nightlyGate.command === 'npm run test:release:full:report', 'Package metadata exposes nightly full release command');
  context.assert(packageManifest.scripts['test:pr:report'] === 'node scripts/run_xtend_tests.js core architecture components component-contract-v2 component-shell-contract component-styling-contract builder-typescript-blueprint epic10-p0-component-wave component-lab-rmt-inspector component-lab-ux-inspector component-ux-browser-smokes component-shell-theme-matrix component-ux-authoring-docs component-long-tail-migration epic11-enterprise-ux-handoff rmt-first-demo-app existing-component-metadata epic10-platform-gates epic10-release-handoff browser a11y-hydration screenreader-signals motion-contrast runtime-a11y-contract component-ux-performance component-network-contract rmt-shell-authoring-ux form-controls-ux feedback-status-ux navigation-routing-ux overlay-interaction-ux layout-display-media-ux catalog-coverage regression-priority fabric fabric-lane-mapping fabric-lifecycle-boundary fabric-reporters fabric-runtime-bridge references supply-chain manifest-import-policy docs-rmt-pilot --report .xtend-test-results/xtend-pr-gate-report.json', 'Package exposes PR fast report gate script');
  context.assert(packageManifest.scripts['test:release:full:report'] === 'node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-release-gate-report.json', 'Package exposes full release report gate script');
}

function assertReleaseChecklistReference(context, rootDir) {
  const policyPath = 'development/XTend-Release-Checklist-und-SemVer-Policy.md';
  const packageManifest = readJson('package.json', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const policy = readText(policyPath, rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.releaseChecklist;

  assertFileExists(context, policyPath, rootDir, 'Release checklist policy exists');
  context.assertIncludes(policy, 'xtend.release.checklist-semver-policy.v1', 'Release checklist declares stable schema');
  context.assertIncludes(policy, 'Release-Kandidat', 'Release checklist defines release candidate flow');
  context.assertIncludes(policy, 'Breaking-Change-Definition', 'Release checklist defines breaking changes');
  context.assertIncludes(policy, 'npm audit --audit-level=moderate', 'Release checklist documents conditional audit gate');
  context.assertIncludes(policy, 'npm sbom --json', 'Release checklist documents conditional SBOM gate');
  context.assert(metadata && metadata.schema === 'xtend.release.checklist-semver-policy.v1', 'Package metadata exposes release checklist schema');
  context.assert(metadata.workpackage === 'ER-WP-38', 'Package metadata exposes release checklist workpackage');
  context.assert(metadata.policy === policyPath, 'Package metadata exposes release checklist policy path');
  context.assert(metadata.semver && metadata.semver.currentPhase === '0.x-enterprise-readiness', 'Package metadata exposes current release phase');
  context.assert(metadata.semver && metadata.semver.pre1MinorMayBreak === true, 'Package metadata exposes pre-1.0 breaking-minor rule');
  context.assert(Array.isArray(metadata.semver && metadata.semver.breakingChangeRequires) && metadata.semver.breakingChangeRequires.includes('release-owner-signoff'), 'Package metadata requires release owner signoff for breaking changes');
  context.assert(Array.isArray(metadata.candidateGates) && metadata.candidateGates.includes('npm run test:release:full:report'), 'Release checklist requires full release report gate');
  context.assert(Array.isArray(metadata.candidateGates) && metadata.candidateGates.includes('npm run test:docs-rmt-pilot'), 'Release checklist requires Docs RMT pilot gate');
  context.assert(Array.isArray(metadata.candidateGates) && metadata.candidateGates.includes('npm run pack:dry-run'), 'Release checklist requires pack dry run');
  context.assert(Array.isArray(metadata.conditionalNetworkGates) && metadata.conditionalNetworkGates.includes('npm audit --audit-level=moderate'), 'Release checklist exposes audit as conditional network gate');
  context.assert(Array.isArray(metadata.conditionalNetworkGates) && metadata.conditionalNetworkGates.includes('npm sbom --json'), 'Release checklist exposes SBOM as conditional network gate');
  context.assert(Array.isArray(metadata.artifactChecklist) && metadata.artifactChecklist.includes('CHANGELOG.md'), 'Release checklist requires changelog artifact');
  context.assert(Array.isArray(metadata.artifactChecklist) && metadata.artifactChecklist.includes(policyPath), 'Release checklist requires policy artifact');
  context.assert(metadata.publishBoundary === 'private-until-release-owner-approval', 'Release checklist keeps release-owner publish boundary');
  context.assert(metadata.completedRun === 'ER-WP-40', 'Release checklist records completed ER-WP-40 run');
  context.assert(metadata.nextWorkpackage === null, 'Release checklist has no next ER workpackage');
  context.assert(packageManifest.private === true, 'Package remains private while release checklist is policy-only');
  context.assertIncludes(readme, 'xtend.release.checklist-semver-policy.v1', 'README documents release checklist schema');
  context.assertIncludes(readme, 'xtend.releaseChecklist', 'README documents release checklist metadata');
  context.assertIncludes(changelog, 'xtend.release.checklist-semver-policy.v1', 'Changelog records release checklist schema');
  context.assertIncludes(policy, 'npm run test:docs-rmt-pilot', 'Release checklist documents Docs RMT pilot gate');
}

function assertEnterpriseAdoptionReference(context, rootDir) {
  const guidePath = 'docs/enterprise-adoption.md';
  const packageManifest = readJson('package.json', rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const guide = readText(guidePath, rootDir);
  const menu = readJson('docs/menu.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.enterpriseAdoption;
  const menuSlugs = Array.isArray(menu) ? menu.map((entry) => entry.slug) : [];

  assertFileExists(context, guidePath, rootDir, 'Enterprise Adoption guide exists');
  context.assertIncludes(guide, 'xtend.docs.enterprise-adoption.v1', 'Enterprise Adoption guide declares stable docs schema');
  context.assertIncludes(guide, 'xtend.enterpriseAdoption', 'Enterprise Adoption guide documents package metadata');
  context.assertIncludes(guide, 'xtend-loader.js', 'Enterprise Adoption guide requires canonical loader');
  context.assertIncludes(guide, 'npm run dev:local', 'Enterprise Adoption guide requires local dev server');
  context.assertIncludes(guide, 'XTend UI bleibt das Web-Component- und UI-Builder-Produkt', 'Enterprise Adoption guide positions XTend UI');
  context.assertIncludes(guide, 'XTendRMT bleibt Scheduler, Runtime Bridge und Templating-Kernel', 'Enterprise Adoption guide positions XTendRMT');
  context.assertIncludes(guide, 'XTend-Fabric ist die lokale Safety-', 'Enterprise Adoption guide positions XTend-Fabric');
  context.assertIncludes(guide, 'npm run test:pr:report', 'Enterprise Adoption guide documents PR fast gate');
  context.assertIncludes(guide, 'npm run test:release:full:report', 'Enterprise Adoption guide documents full release gate');
  context.assertIncludes(guide, 'npm run test:docs-rmt-pilot', 'Enterprise Adoption guide documents Docs RMT pilot gate');
  context.assertIncludes(guide, 'npm run pack:dry-run', 'Enterprise Adoption guide documents package dry run');
  context.assertIncludes(guide, 'private: true', 'Enterprise Adoption guide keeps publish boundary visible');
  context.assertIncludes(guide, 'ER-WP-40` ist ebenfalls abgeschlossen', 'Enterprise Adoption guide records completed ER-WP-40');
  context.assert(metadata && metadata.schema === 'xtend.docs.enterprise-adoption.v1', 'Package metadata exposes Enterprise Adoption schema');
  context.assert(metadata.workpackage === 'ER-WP-39', 'Package metadata exposes Enterprise Adoption workpackage');
  context.assert(metadata.guide === guidePath, 'Package metadata exposes Enterprise Adoption guide path');
  context.assert(metadata.status === 'active', 'Package metadata exposes Enterprise Adoption active status');
  context.assert(Array.isArray(metadata.scope) && metadata.scope.includes('xtend-fabric'), 'Package metadata scopes XTend-Fabric');
  context.assert(Array.isArray(metadata.scope) && metadata.scope.includes('xtendrmt'), 'Package metadata scopes XTendRMT');
  context.assert(Array.isArray(metadata.requiredGates) && metadata.requiredGates.includes('npm run test:release:full:report'), 'Package metadata requires full release gate');
  context.assert(Array.isArray(metadata.requiredGates) && metadata.requiredGates.includes('npm run test:docs-rmt-pilot'), 'Package metadata requires Docs RMT pilot gate');
  context.assert(Array.isArray(metadata.requiredGates) && metadata.requiredGates.includes('npm run pack:dry-run'), 'Package metadata requires package dry run');
  context.assert(metadata.publishBoundary === 'private-until-release-owner-approval', 'Package metadata keeps release owner publish boundary');
  context.assert(metadata.completedRun === 'ER-WP-40', 'Package metadata records completed ER-WP-40 run');
  context.assert(metadata.nextWorkpackage === null, 'Package metadata has no next ER workpackage');
  context.assert(menuSlugs.includes('enterprise-adoption'), 'Docs menu exposes Enterprise Adoption guide');
  context.assertIncludes(readme, guidePath, 'README links Enterprise Adoption guide');
  context.assertIncludes(readme, 'xtend.docs.enterprise-adoption.v1', 'README documents Enterprise Adoption schema');
  context.assertIncludes(changelog, 'xtend.docs.enterprise-adoption.v1', 'Changelog records Enterprise Adoption schema');
}

function assertDocsRmtPilotReference(context, rootDir) {
  const pilotPath = 'docs/xtendrmt-parsedown-docs.rmt';
  const docsPath = 'docs/xtendrmt-parsedown-scheduling.md';
  const workpackagePath = 'development/ER-WP-40-Docs-App-mit-RMT-Parsedown-Scheduling-pilotieren.md';
  const packageManifest = readJson('package.json', rootDir);
  const pilot = readJson(pilotPath, rootDir);
  const readme = readText('README.md', rootDir);
  const changelog = readText('CHANGELOG.md', rootDir);
  const docs = readText(docsPath, rootDir);
  const workpackage = readText(workpackagePath, rootDir);
  const indexPhp = readText('docs/index.php', rootDir);
  const pageLoader = readText('docs/utils/pageloader.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.docsRmtPilot;

  assertFileExists(context, pilotPath, rootDir, 'Docs RMT pilot document exists');
  assertFileExists(context, 'tests/rmt/docs_rmt_pilot_suite.js', rootDir, 'Docs RMT pilot suite exists');
  assertFileExists(context, workpackagePath, rootDir, 'ER-WP-40 workpackage exists');
  context.assert(pilot.kind === 'rmt_document', 'Docs RMT pilot is an RMT document');
  context.assert(pilot.manifest && pilot.manifest.metadata && pilot.manifest.metadata.contractVersion === 'xtend.docs.parsedown-rmt-pilot.v1', 'Docs RMT pilot declares stable schema');
  context.assert(pilot.manifest.metadata.workpackage === 'ER-WP-40', 'Docs RMT pilot is owned by ER-WP-40');
  context.assert(pilot.manifest.metadata.renderMode === 'shell-first', 'Docs RMT pilot declares shell-first mode');
  context.assert(pilot.manifest.metadata.shellTemplate === 'docs.app.shell', 'Docs RMT pilot declares shell template');
  context.assert(Array.isArray(pilot.adapters) && pilot.adapters.some((adapter) => adapter.id === 'docs.parsedown'), 'Docs RMT pilot declares Parsedown adapter');
  context.assert(Array.isArray(pilot.adapters) && pilot.adapters.some((adapter) => adapter.id === 'docs.rich-content'), 'Docs RMT pilot declares rich content adapter');
  context.assert(Array.isArray(pilot.components) && pilot.components.some((component) => component.id === 'docs.shell'), 'Docs RMT pilot declares shell component');
  context.assert(Array.isArray(pilot.templates) && pilot.templates.some((template) => template.id === 'docs.app.shell' && template.mode === 'dom_descriptor'), 'Docs RMT pilot declares dom_descriptor shell template');
  context.assert(Array.isArray(pilot.templates) && pilot.templates.some((template) => template.id === 'docs.header.search' && template.mode === 'dom_descriptor'), 'Docs RMT pilot declares dom_descriptor search template');
  context.assert(Array.isArray(pilot.routes) && pilot.routes.some((route) => route.path === '/enterprise-adoption'), 'Docs RMT pilot exposes Enterprise Adoption route');
  context.assert(Array.isArray(pilot.schedules) && pilot.schedules.some((schedule) => schedule.endpointName === 'xtendrmt.shell.render'), 'Docs RMT pilot exposes shell render endpoint');
  context.assert(Array.isArray(pilot.schedules) && pilot.schedules.some((schedule) => schedule.endpointName === 'xtendrmt.docs.parsedown.parse'), 'Docs RMT pilot exposes Parsedown schedule endpoint');
  context.assert(Array.isArray(pilot.schedules) && pilot.schedules.some((schedule) => schedule.id === 'docs.media.lazy'), 'Docs RMT pilot exposes lazy media schedule');
  context.assert(metadata && metadata.schema === 'xtend.docs.parsedown-rmt-pilot.v1', 'Package metadata exposes Docs RMT pilot schema');
  context.assert(metadata.document === pilotPath, 'Package metadata exposes Docs RMT pilot path');
  context.assert(metadata.activeHost === 'docs/index.php', 'Package metadata exposes Docs host path');
  context.assert(metadata.pageLoader === 'docs/utils/pageloader.js', 'Package metadata exposes Docs page loader path');
  context.assert(metadata.renderMode === 'shell-first', 'Package metadata exposes Docs RMT shell-first mode');
  context.assert(metadata.shellTemplate === 'docs.app.shell', 'Package metadata exposes Docs RMT shell template');
  context.assert(Array.isArray(metadata.futureContentKinds) && metadata.futureContentKinds.includes('xplayerTutorial'), 'Package metadata exposes future XPlayer content kind');
  context.assert(Array.isArray(metadata.requiredGates) && metadata.requiredGates.includes('npm run test:docs-rmt-pilot'), 'Package metadata requires Docs RMT pilot gate');
  context.assert(packageManifest.scripts['test:docs-rmt-pilot'] === 'node scripts/run_xtend_tests.js docs-rmt-pilot', 'Package exposes Docs RMT pilot script');
  context.assertIncludes(indexPhp, 'window.xtendDocsRmtPilot', 'Docs host exposes RMT pilot metadata');
  context.assertIncludes(indexPhp, 'window.xtendDocsRmtDocument', 'Docs host exposes embedded RMT document');
  context.assertIncludes(indexPhp, '<body xt-ui-effects="none">', 'Docs host explicitly disables shell-blocking UI effects');
  context.assertIncludes(indexPhp, "schema: 'xtend.docs.viewport-overflow.v1'", 'Docs host exposes viewport overflow diagnostics');
  context.assertIncludes(indexPhp, 'window.xtendDocsCheckViewportOverflow', 'Docs host exposes viewport overflow check API');
  context.assertIncludes(indexPhp, 'window.xtendDocsPagesMeta', 'Docs host exposes page metadata');
  context.assertIncludes(indexPhp, 'src="/xtend-loader.js?v=', 'Docs host uses versioned root-local canonical loader URL');
  context.assertIncludes(indexPhp, 'data-manifest="/components/manifest.json?v=', 'Docs host uses versioned loader-policy compatible manifest URL');
  context.assertIncludes(indexPhp, 'data-module-cache-bust=', 'Docs host forwards module cache busting to the loader');
  context.assertIncludes(indexPhp, 'x-link,x-input,x-form,x-header,x-hero,x-router,x-footer', 'Docs host preloads shell components without stale x-tabs preload');
  context.assert(!indexPhp.includes('data-manifest="../components/manifest.json"'), 'Docs host avoids traversal-like manifest URL');
  context.assertIncludes(pageLoader, 'xtend.docs.parsedown-rmt-render.v1', 'Page loader exposes render metadata');
  context.assertIncludes(pageLoader, '#md-content {\n    min-width: 0;\n    max-width: 100%;', 'Page loader keeps Markdown content viewport-bound');
  context.assertIncludes(pageLoader, 'createRmtDocsShell', 'Page loader renders RMT shell');
  context.assertIncludes(pageLoader, 'renderRmtDomTemplate', 'Page loader renders RMT DOM descriptor templates');
  context.assertIncludes(docs, 'node scripts/run_xtend_tests.js docs-rmt-pilot --json', 'Docs document pilot gate');
  context.assertIncludes(docs, 'docs.app.shell', 'Docs document the shell template');
  context.assertIncludes(workpackage, 'Enterprise-Reife-Paketlauf `ER-WP-01` bis `ER-WP-40`', 'ER-WP-40 records completed enterprise run');
  context.assertIncludes(readme, 'xtend.docs.parsedown-rmt-pilot.v1', 'README documents Docs RMT pilot schema');
  context.assertIncludes(changelog, 'xtend.docs.parsedown-rmt-pilot.v1', 'Changelog records Docs RMT pilot schema');
}

function assertEpic10TypeScriptSourceStrategyReference(context, rootDir) {
  const epicPath = 'development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const backlogPath = 'development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const wpPath = 'development/WP-E10-02-TypeScript-Source-und-Build-Strategie-entscheiden.md';
  const strategyPath = 'development/XTend-TypeScript-Component-Source-Strategie.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText(epicPath, rootDir);
  const backlog = readText(backlogPath, rootDir);
  const workpackage = readText(wpPath, rootDir);
  const strategy = readText(strategyPath, rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.typescriptComponentSource;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-02 workpackage exists');
  assertFileExists(context, strategyPath, rootDir, 'TypeScript component source strategy exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-02');
  context.assertIncludes(registry, strategyPath, 'Reference registry links TypeScript source strategy');
  context.assertIncludes(epic, '| `WP-E10-02` | P0 | completed |', 'Epic 10 marks WP-E10-02 completed');
  context.assertIncludes(epic, 'src/components/<tag>/', 'Epic 10 records TypeScript source layout decision');
  context.assertIncludes(backlog, '| `WP-E10-02` | P0 | completed |', 'Epic 10 backlog marks WP-E10-02 completed');
  context.assertIncludes(backlog, '| `WP-E10-03` | P0 | completed |', 'Epic 10 backlog records completed WP-E10-03 after TypeScript strategy');
  context.assertIncludes(backlog, '| `WP-E10-04` | P0 | completed |', 'Epic 10 backlog records completed WP-E10-04 after TypeScript strategy');
  context.assertIncludes(workpackage, 'xtend.epic10.wp02.typescript-source-build-strategy.v1', 'WP-E10-02 declares workpackage contract');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-02 is completed');
  context.assertIncludes(workpackage, 'no-new-runtime-dependencies', 'WP-E10-02 keeps runtime dependency policy visible');
  context.assertIncludes(strategy, 'xtend.typescript.component-source-strategy.v1', 'TypeScript source strategy declares stable contract');
  context.assertIncludes(strategy, 'src/components/<tag>/', 'TypeScript source strategy defines source root');
  context.assertIncludes(strategy, 'components/<basename>.js', 'TypeScript source strategy defines ESM artifact path');
  context.assertIncludes(strategy, 'components/<basename>.d.ts', 'TypeScript source strategy defines declaration artifact path');
  context.assertIncludes(strategy, 'no-bundler-required-for-core-components', 'TypeScript source strategy keeps core bundler policy visible');
  context.assertIncludes(strategy, 'no-cdn-no-remote-runtime-imports', 'TypeScript source strategy keeps network policy visible');
  context.assertIncludes(strategy, 'no-new-runtime-dependencies', 'TypeScript source strategy keeps runtime dependency policy visible');
  context.assertIncludes(strategy, 'js-legacy', 'TypeScript source strategy defines JS legacy migration state');
  context.assertIncludes(strategy, 'ts-source', 'TypeScript source strategy defines TS source migration state');
  context.assertIncludes(strategy, 'WP-E10-03', 'TypeScript source strategy hands off to WP-E10-03');
  context.assertIncludes(strategy, 'WP-E10-07', 'TypeScript source strategy hands off to WP-E10-07');
  context.assertIncludes(scaffoldConfig, 'typescriptSource', 'Scaffold config exposes TypeScript source strategy section');
  context.assertIncludes(scaffoldConfig, 'xtend.scaffold.typescript-source-strategy.v1', 'Scaffold config declares TypeScript strategy schema');
  context.assertIncludes(scaffoldConfig, 'productiveCompilerIntroduced: false', 'Scaffold config keeps compiler introduction out of WP-E10-02');
  context.assert(metadata && metadata.schema === 'xtend.typescript.component-source-strategy.v1', 'Package metadata exposes TypeScript source strategy schema');
  context.assert(metadata.workpackage === 'WP-E10-02', 'Package metadata exposes WP-E10-02 owner');
  context.assert(metadata.strategy === strategyPath, 'Package metadata points at TypeScript source strategy');
  context.assert(metadata.sourceRoot === 'src/components/', 'Package metadata exposes TypeScript source root');
  context.assert(metadata.runtimeOutputRoot === 'components/', 'Package metadata exposes ESM output root');
  context.assert(metadata.declarationOutputRoot === 'components/', 'Package metadata exposes declaration output root');
  context.assert(metadata.runtimeFormat === 'esm', 'Package metadata keeps ESM runtime format');
  context.assert(metadata.loader === 'xtend-loader.js', 'Package metadata keeps canonical loader');
  context.assert(metadata.manifest === 'components/manifest.json', 'Package metadata keeps manifest contract');
  context.assert(metadata.bundlerPolicy === 'no-bundler-required-for-core-components', 'Package metadata exposes bundler policy');
  context.assert(metadata.runtimeDependencyPolicy === 'no-new-runtime-dependencies', 'Package metadata exposes dependency policy');
  context.assert(metadata.networkPolicy === 'no-cdn-no-remote-runtime-imports', 'Package metadata exposes network policy');
  context.assert(Array.isArray(metadata.migrationStates) && metadata.migrationStates.includes('js-legacy'), 'Package metadata exposes JS legacy migration state');
  context.assert(Array.isArray(metadata.followUps) && metadata.followUps.includes('WP-E10-03'), 'Package metadata hands off to WP-E10-03');
  context.assert(Array.isArray(metadata.followUps) && metadata.followUps.includes('WP-E10-07'), 'Package metadata hands off to WP-E10-07');
}

function assertEpic10ComponentContractV2Reference(context, rootDir) {
  const epicPath = 'development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const backlogPath = 'development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const wpPath = 'development/WP-E10-03-Component-Contract-v2-fuer-TypeScript-RMT-und-Fabric-definieren.md';
  const contractPath = 'development/XTend-Component-Contract-v2.md';
  const modulePath = 'xtend-builder/typing/component-contract-v2.js';
  const suitePath = 'tests/components/component_contract_v2_suite.js';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText(epicPath, rootDir);
  const backlog = readText(backlogPath, rootDir);
  const workpackage = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const moduleSource = readText(modulePath, rootDir);
  const suiteSource = readText(suitePath, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentContractV2;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-03 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Component Contract v2 document exists');
  assertFileExists(context, modulePath, rootDir, 'Component Contract v2 module exists');
  assertFileExists(context, suitePath, rootDir, 'Component Contract v2 suite exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-03');
  context.assertIncludes(registry, contractPath, 'Reference registry links Component Contract v2');
  context.assertIncludes(registry, modulePath, 'Reference registry links Component Contract v2 module');
  context.assertIncludes(registry, suitePath, 'Reference registry links Component Contract v2 suite');
  context.assertIncludes(epic, '| `WP-E10-03` | P0 | completed |', 'Epic 10 marks WP-E10-03 completed');
  context.assertIncludes(epic, 'xtend.component.contract.v2', 'Epic 10 records Component Contract v2 schema');
  context.assertIncludes(backlog, '| `WP-E10-03` | P0 | completed |', 'Epic 10 backlog marks WP-E10-03 completed');
  context.assertIncludes(backlog, '| `WP-E10-07` | P0 | completed |', 'Epic 10 backlog marks WP-E10-07 completed after Contract v2');
  context.assertIncludes(workpackage, 'xtend.epic10.wp03.component-contract-v2.v1', 'WP-E10-03 declares workpackage contract');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-03 is completed');
  context.assertIncludes(workpackage, 'no-rmt-kernel-import-of-xtend-types', 'WP-E10-03 keeps RMT kernel boundary visible');
  context.assertIncludes(contract, 'xtend.component.contract.v2', 'Component Contract v2 document declares schema');
  context.assertIncludes(contract, 'XtendComponentContractV2', 'Component Contract v2 document declares TypeScript interface');
  context.assertIncludes(contract, '`publicApi`', 'Component Contract v2 document defines publicApi domain');
  context.assertIncludes(contract, '`rmt`', 'Component Contract v2 document defines RMT domain');
  context.assertIncludes(contract, '`fabric`', 'Component Contract v2 document defines Fabric domain');
  context.assertIncludes(contract, '`telemetry`', 'Component Contract v2 document defines Telemetry domain');
  context.assertIncludes(contract, '`lanes`', 'Component Contract v2 document defines Lane domain');
  context.assertIncludes(contract, '`a11y`', 'Component Contract v2 document defines A11y domain');
  context.assertIncludes(contract, '`performance`', 'Component Contract v2 document defines Performance domain');
  context.assertIncludes(contract, 'xtend-builder/typing/component-contract-v2.js', 'Component Contract v2 document links builder module');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Component Contract v2 document keeps RMT kernel boundary visible');
  context.assertIncludes(moduleSource, "const COMPONENT_CONTRACT_V2_SCHEMA = 'xtend.component.contract.v2'", 'Component Contract v2 module declares schema constant');
  context.assertIncludes(moduleSource, 'createComponentContractV2', 'Component Contract v2 module exposes factory');
  context.assertIncludes(moduleSource, 'validateComponentContractV2', 'Component Contract v2 module exposes validator');
  context.assertIncludes(moduleSource, 'CONTRACT_V2_REQUIRED_DOMAINS', 'Component Contract v2 module exposes required domains');
  context.assertIncludes(moduleSource, 'no-rmt-kernel-import-of-xtend-types', 'Component Contract v2 module keeps RMT boundary');
  context.assertIncludes(suiteSource, 'runComponentContractV2Suite', 'Component Contract v2 suite exports runner');
  context.assertIncludes(runner, "id: 'component-contract-v2'", 'XTend test runner registers component-contract-v2 suite');
  context.assert(packageManifest.scripts['test:component-contract-v2'] === 'node scripts/run_xtend_tests.js component-contract-v2', 'Package exposes Component Contract v2 test script');
  context.assertIncludes(scaffoldConfig, 'componentContractV2', 'Scaffold config exposes Component Contract v2 section');
  context.assertIncludes(scaffoldConfig, 'xtend.component.contract.v2', 'Scaffold config declares Component Contract v2 schema');
  context.assertIncludes(scaffoldConfig, 'xtend-builder/typing/component-contract-v2.js', 'Scaffold config references Component Contract v2 module');
  context.assert(metadata && metadata.schema === 'xtend.component.contract.v2', 'Package metadata exposes Component Contract v2 schema');
  context.assert(metadata.reportSchema === 'xtend.component.contract-report.v2', 'Package metadata exposes Component Contract v2 report schema');
  context.assert(metadata.workpackage === 'WP-E10-03', 'Package metadata exposes WP-E10-03 owner');
  context.assert(metadata.contract === contractPath, 'Package metadata points at Component Contract v2 document');
  context.assert(metadata.module === modulePath, 'Package metadata points at Component Contract v2 module');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('publicApi'), 'Package metadata requires publicApi domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('rmt'), 'Package metadata requires RMT domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('fabric'), 'Package metadata requires Fabric domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('telemetry'), 'Package metadata requires Telemetry domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('lanes'), 'Package metadata requires Lanes domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('a11y'), 'Package metadata requires A11y domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('performance'), 'Package metadata requires Performance domain');
  context.assert(metadata.rmtAdapter === 'xtend.component', 'Package metadata exposes XTend component adapter');
  context.assert(metadata.fabricApi === '@xtend-fabric', 'Package metadata exposes Fabric API name');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps RMT kernel boundary');
  context.assert(Array.isArray(metadata.followUps) && metadata.followUps.includes('WP-E10-07'), 'Package metadata hands off to WP-E10-07');
  context.assert(Array.isArray(metadata.followUps) && metadata.followUps.includes('WP-E10-15'), 'Package metadata hands off to WP-E10-15');
}

function assertEpic10RmtFirstClassAppAuthoringReference(context, rootDir) {
  const epicPath = 'development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const backlogPath = 'development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const wpPath = 'development/WP-E10-04-RMT-App-Authoring-Contract-fuer-vollstaendige-XTend-Apps-spezifizieren.md';
  const contractPath = 'development/XTend-RMT-First-Class-App-Authoring.md';
  const fixturePath = 'tests/fixtures/rmt-first-class-xtend-app.rmt';
  const suitePath = 'tests/rmt/rmt_first_class_app_authoring_suite.js';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText(epicPath, rootDir);
  const backlog = readText(backlogPath, rootDir);
  const workpackage = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const fixture = readJson(fixturePath, rootDir);
  const suiteSource = readText(suitePath, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtFirstClassAppAuthoring;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-04 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'RMT-first app authoring contract exists');
  assertFileExists(context, fixturePath, rootDir, 'RMT-first XTend app fixture exists');
  assertFileExists(context, suitePath, rootDir, 'RMT-first app authoring suite exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-04');
  context.assertIncludes(registry, contractPath, 'Reference registry links RMT-first app authoring contract');
  context.assertIncludes(registry, fixturePath, 'Reference registry links RMT-first app fixture');
  context.assertIncludes(registry, suitePath, 'Reference registry links RMT-first app suite');
  context.assertIncludes(epic, '| `WP-E10-04` | P0 | completed |', 'Epic 10 marks WP-E10-04 completed');
  context.assertIncludes(epic, 'xtend.rmt.first-class-app-authoring.v1', 'Epic 10 records RMT-first app authoring schema');
  context.assertIncludes(epic, '| `WP-E10-05` | P0 | completed |', 'Epic 10 records completed WP-E10-05 after WP-E10-04');
  context.assertIncludes(backlog, '| `WP-E10-04` | P0 | completed |', 'Epic 10 backlog marks WP-E10-04 completed');
  context.assertIncludes(backlog, '| `WP-E10-05` | P0 | completed |', 'Epic 10 backlog records completed WP-E10-05 after WP-E10-04');
  context.assertIncludes(workpackage, 'xtend.epic10.wp04.rmt-first-class-app-authoring.v1', 'WP-E10-04 declares workpackage contract');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-04 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js rmt-first-class-app --json', 'WP-E10-04 documents local gate');
  context.assertIncludes(contract, 'xtend.rmt.first-class-app-authoring.v1', 'RMT-first app authoring document declares schema');
  context.assertIncludes(contract, 'shell-first', 'RMT-first app authoring document defines shell-first rendering');
  context.assertIncludes(contract, 'xtend.component', 'RMT-first app authoring document defines XTend component adapter');
  context.assertIncludes(contract, 'xtend.xrouter', 'RMT-first app authoring document defines XRouter adapter');
  context.assertIncludes(contract, 'rmt.state-scheduler-diagnostics', 'RMT-first app authoring document defines scheduler diagnostics adapter');
  context.assertIncludes(contract, 'xtend.component.contract.v2', 'RMT-first app authoring document references Component Contract v2');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'RMT-first app authoring document keeps RMT kernel boundary visible');
  context.assertIncludes(contract, fixturePath, 'RMT-first app authoring document links fixture');
  context.assert(fixture.manifest.metadata.contractVersion === 'xtend.rmt.first-class-app-authoring.v1', 'RMT-first fixture declares authoring schema');
  context.assert(fixture.manifest.metadata.workpackage === 'WP-E10-04', 'RMT-first fixture exposes WP-E10-04 owner');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'RMT-first fixture exposes shell-first render mode');
  context.assert(fixture.manifest.metadata.componentContract === 'xtend.component.contract.v2', 'RMT-first fixture binds Component Contract v2');
  context.assert(Array.isArray(fixture.adapters) && fixture.adapters.some((adapter) => adapter.id === 'xtend.component'), 'RMT-first fixture declares XTend component adapter');
  context.assert(Array.isArray(fixture.routes) && fixture.routes.some((route) => route.id === 'settings'), 'RMT-first fixture declares settings route');
  context.assert(Array.isArray(fixture.templates) && fixture.templates.some((template) => template.id === 'app.shell'), 'RMT-first fixture declares app shell template');
  context.assertIncludes(suiteSource, 'runRmtFirstClassAppAuthoringSuite', 'RMT-first app suite exports runner');
  context.assertIncludes(runner, "id: 'rmt-first-class-app'", 'XTend test runner registers rmt-first-class-app suite');
  context.assert(packageManifest.scripts['test:rmt-first-class-app'] === 'node scripts/run_xtend_tests.js rmt-first-class-app', 'Package exposes RMT-first app test script');
  context.assert(metadata && metadata.schema === 'xtend.rmt.first-class-app-authoring.v1', 'Package metadata exposes RMT-first app authoring schema');
  context.assert(metadata.fixture === fixturePath, 'Package metadata points at RMT-first app fixture');
  context.assert(metadata.contract === contractPath, 'Package metadata points at RMT-first app contract');
  context.assert(metadata.renderMode === 'shell-first', 'Package metadata exposes shell-first render mode');
  context.assert(metadata.componentContract === 'xtend.component.contract.v2', 'Package metadata binds Component Contract v2');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('templates'), 'Package metadata requires templates domain');
  context.assert(Array.isArray(metadata.requiredAdapters) && metadata.requiredAdapters.includes('xtend.xrouter'), 'Package metadata requires XRouter adapter');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps RMT kernel boundary');
  context.assert(Array.isArray(metadata.followUps) && metadata.followUps.includes('WP-E10-05'), 'Package metadata hands off to WP-E10-05');
  context.assertIncludes(scaffoldConfig, 'rmtFirstClassAppAuthoring', 'Scaffold config exposes RMT-first app authoring section');
  context.assertIncludes(scaffoldConfig, 'xtend.rmt.first-class-app-authoring.v1', 'Scaffold config declares RMT-first app authoring schema');
}

function assertEpic10ComponentFabricLaneIngestionReference(context, rootDir) {
  const epicPath = 'development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const backlogPath = 'development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md';
  const wpPath = 'development/WP-E10-05-XTend-Component-Adapter-um-Fabric-Lane-Ingestion-erweitern.md';
  const contractPath = 'development/XTend-Fabric-Component-Compatibility-v2.md';
  const suitePath = 'tests/rmt/rmt_component_fabric_lane_ingestion_suite.js';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText(epicPath, rootDir);
  const backlog = readText(backlogPath, rootDir);
  const workpackage = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const suiteSource = readText(suitePath, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const runtimeSource = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const browserSource = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const typesSource = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const schemaSource = readText('xtendrmt/rmt.schema.json', rootDir);
  const docsNative = readText('docs/xtendrmt-native-authoring.md', rootDir);
  const docsDsl = readText('docs/xtendrmt-app-dsl.md', rootDir);
  const docsFabric = readText('docs/xtend-fabric-rmt-lane-mapping.md', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentFabricLaneIngestion;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-05 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Component Fabric compatibility contract exists');
  assertFileExists(context, suitePath, rootDir, 'Component Fabric/Lane ingestion suite exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-05');
  context.assertIncludes(registry, contractPath, 'Reference registry links Component Fabric compatibility contract');
  context.assertIncludes(registry, suitePath, 'Reference registry links Component Fabric/Lane ingestion suite');
  context.assertIncludes(epic, '| `WP-E10-05` | P0 | completed |', 'Epic 10 marks WP-E10-05 completed');
  context.assertIncludes(epic, '| `WP-E10-06` | P0 | completed |', 'Epic 10 marks WP-E10-06 completed after WP-E10-05');
  context.assertIncludes(backlog, '| `WP-E10-05` | P0 | completed |', 'Epic 10 backlog marks WP-E10-05 completed');
  context.assertIncludes(backlog, '| `WP-E10-06` | P0 | completed |', 'Epic 10 backlog marks WP-E10-06 completed after WP-E10-05');
  context.assertIncludes(workpackage, 'xtend.epic10.wp05.component-fabric-lane-ingestion.v1', 'WP-E10-05 declares workpackage contract');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-05 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json', 'WP-E10-05 documents local gate');
  context.assertIncludes(contract, 'xtend.component.fabric-lane-ingestion.v2', 'Component Fabric compatibility document declares schema');
  context.assertIncludes(contract, 'resolveFabricContext', 'Component Fabric compatibility document defines resolveFabricContext');
  context.assertIncludes(contract, 'rmt.schedule-record', 'Component Fabric compatibility document defines schedule-record precedence');
  context.assertIncludes(contract, 'fabric.runtime-override', 'Component Fabric compatibility document defines runtime override source');
  context.assertIncludes(contract, 'rmt.xtend.component.fabric_lane.conflict', 'Component Fabric compatibility document defines conflict diagnostic');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Component Fabric compatibility keeps RMT boundary visible');
  context.assertIncludes(runtimeSource, 'XTEND_COMPONENT_FABRIC_LANE_INGESTION_SCHEMA', 'ESM runtime declares Fabric/Lane ingestion schema constant');
  context.assertIncludes(runtimeSource, 'resolveFabricContext', 'ESM runtime exposes resolveFabricContext');
  context.assertIncludes(browserSource, 'resolveFabricContext', 'Browser runtime exposes resolveFabricContext');
  context.assertIncludes(typesSource, 'RmtXtendComponentFabricContext', 'RMT types expose Component Fabric context');
  context.assertIncludes(schemaSource, 'fabricLaneIngestion', 'RMT schema exposes fabricLaneIngestion section');
  context.assertIncludes(suiteSource, 'runRmtComponentFabricLaneIngestionSuite', 'Component Fabric/Lane ingestion suite exports runner');
  context.assertIncludes(runner, "id: 'rmt-component-fabric-ingestion'", 'XTend test runner registers rmt-component-fabric-ingestion suite');
  context.assert(packageManifest.scripts['test:rmt-component-fabric-ingestion'] === 'node scripts/run_xtend_tests.js rmt-component-fabric-ingestion', 'Package exposes Component Fabric/Lane ingestion test script');
  context.assert(metadata && metadata.schema === 'xtend.component.fabric-lane-ingestion.v2', 'Package metadata exposes Component Fabric/Lane ingestion schema');
  context.assert(metadata.contract === contractPath, 'Package metadata points at Component Fabric compatibility contract');
  context.assert(Array.isArray(metadata.precedence) && metadata.precedence[0] === 'rmt.schedule-record', 'Package metadata exposes precedence order');
  context.assert(Array.isArray(metadata.capabilities) && metadata.capabilities.includes('laneIngestion'), 'Package metadata exposes lane ingestion capability');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps RMT kernel boundary');
  context.assert(Array.isArray(metadata.followUps) && metadata.followUps.includes('WP-E10-06'), 'Package metadata hands off to WP-E10-06');
  context.assertIncludes(scaffoldConfig, 'componentFabricLaneIngestion', 'Scaffold config exposes Component Fabric/Lane ingestion section');
  context.assertIncludes(scaffoldConfig, 'xtend.component.fabric-lane-ingestion.v2', 'Scaffold config declares Component Fabric/Lane ingestion schema');
  context.assertIncludes(docsNative, 'xtend.component.fabric-lane-ingestion.v2', 'Native authoring docs mention Component Fabric/Lane ingestion');
  context.assertIncludes(docsDsl, 'Component Fabric Context', 'App DSL docs document Component Fabric Context');
  context.assertIncludes(docsFabric, 'Adapter-Ingestion', 'Fabric/RMT lane docs document adapter ingestion');
}

function assertEpic10ComponentLifecycleTelemetryReference(context, rootDir) {
  const wpPath = 'development/WP-E10-06-Telemetry-API-Anschluss-fuer-Component-Lifecycle-standardisieren.md';
  const contractPath = 'development/XTend-Component-Lifecycle-Telemetry-Contract.md';
  const suitePath = 'tests/rmt/rmt_component_lifecycle_telemetry_suite.js';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const workpackage = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const suiteSource = readText(suitePath, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const fabricSource = readText('fabric/xtend-fabric.js', rootDir);
  const runtimeSource = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const browserSource = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const typesSource = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const schemaSource = readText('xtendrmt/rmt.schema.json', rootDir);
  const docsNative = readText('docs/xtendrmt-native-authoring.md', rootDir);
  const docsDsl = readText('docs/xtendrmt-app-dsl.md', rootDir);
  const docsFabric = readText('docs/xtend-fabric.md', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentLifecycleTelemetry;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-06 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Component Lifecycle Telemetry contract exists');
  assertFileExists(context, suitePath, rootDir, 'Component Lifecycle Telemetry suite exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-06');
  context.assertIncludes(registry, contractPath, 'Reference registry links Component Lifecycle Telemetry contract');
  context.assertIncludes(registry, suitePath, 'Reference registry links Component Lifecycle Telemetry suite');
  context.assertIncludes(epic, '| `WP-E10-06` | P0 | completed |', 'Epic 10 marks WP-E10-06 completed');
  context.assertIncludes(epic, '| `WP-E10-07` | P0 | completed |', 'Epic 10 marks WP-E10-07 completed after WP-E10-06');
  context.assertIncludes(backlog, '| `WP-E10-06` | P0 | completed |', 'Epic 10 backlog marks WP-E10-06 completed');
  context.assertIncludes(backlog, '| `WP-E10-07` | P0 | completed |', 'Epic 10 backlog marks WP-E10-07 completed after WP-E10-06');
  context.assertIncludes(workpackage, 'xtend.epic10.wp06.component-lifecycle-telemetry.v1', 'WP-E10-06 declares workpackage contract');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-06 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json', 'WP-E10-06 documents local gate');
  context.assertIncludes(contract, 'xtend.component.lifecycle-telemetry.v1', 'Component Lifecycle Telemetry contract declares schema');
  context.assertIncludes(contract, 'recordComponentTelemetry', 'Component Lifecycle Telemetry contract defines manual telemetry hook');
  context.assertIncludes(contract, 'snapshot.componentTelemetry', 'Component Lifecycle Telemetry contract defines snapshot section');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Component Lifecycle Telemetry keeps RMT boundary visible');
  context.assertIncludes(fabricSource, 'componentLifecycleTelemetry', 'Fabric runtime declares Component Lifecycle Telemetry contract');
  context.assertIncludes(fabricSource, 'summarizeComponentLifecycleTelemetry', 'Fabric runtime exposes Component Lifecycle Telemetry summarizer');
  context.assertIncludes(runtimeSource, 'XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA', 'ESM runtime declares Lifecycle Telemetry schema constant');
  context.assertIncludes(browserSource, 'XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA', 'Browser runtime declares Lifecycle Telemetry schema constant');
  context.assertIncludes(runtimeSource, 'recordComponentTelemetry', 'ESM runtime exposes recordComponentTelemetry');
  context.assertIncludes(browserSource, 'recordComponentTelemetry', 'Browser runtime exposes recordComponentTelemetry');
  context.assertIncludes(typesSource, 'RmtXtendComponentLifecycleTelemetry', 'RMT types expose Component Lifecycle Telemetry');
  context.assertIncludes(schemaSource, 'componentLifecycleTelemetry', 'RMT schema exposes Component Lifecycle Telemetry metadata');
  context.assertIncludes(suiteSource, 'runRmtComponentLifecycleTelemetrySuite', 'Component Lifecycle Telemetry suite exports runner');
  context.assertIncludes(runner, "id: 'rmt-component-lifecycle-telemetry'", 'XTend test runner registers rmt-component-lifecycle-telemetry suite');
  context.assert(packageManifest.scripts['test:rmt-component-lifecycle-telemetry'] === 'node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry', 'Package exposes Component Lifecycle Telemetry test script');
  context.assert(metadata && metadata.schema === 'xtend.component.lifecycle-telemetry.v1', 'Package metadata exposes Component Lifecycle Telemetry schema');
  context.assert(metadata.contract === contractPath, 'Package metadata points at Component Lifecycle Telemetry contract');
  context.assert(metadata.localGate === 'node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json', 'Package metadata exposes Component Lifecycle Telemetry local gate');
  context.assert(Array.isArray(metadata.operations) && metadata.operations.includes('event'), 'Package metadata exposes lifecycle operations');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'componentLifecycleTelemetry', 'Scaffold config exposes Component Lifecycle Telemetry section');
  context.assertIncludes(scaffoldConfig, 'xtend.component.lifecycle-telemetry.v1', 'Scaffold config declares Component Lifecycle Telemetry schema');
  context.assertIncludes(docsNative, 'xtend.component.lifecycle-telemetry.v1', 'Native authoring docs mention Component Lifecycle Telemetry');
  context.assertIncludes(docsDsl, 'Component Lifecycle Telemetry', 'App DSL docs document Component Lifecycle Telemetry');
  context.assertIncludes(docsFabric, 'xtend.component.lifecycle-telemetry.v1', 'Fabric docs mention Component Lifecycle Telemetry');
}

function assertEpic10TypeScriptComponentBlueprintReference(context, rootDir) {
  const wpPath = 'development/WP-E10-07-xtend-builder-TypeScript-Blueprint-vorbereiten.md';
  const contractPath = 'development/XTend-TypeScript-Component-Blueprint.md';
  const suitePath = 'tests/builder/typescript_component_blueprint_suite.js';
  const docsPath = 'docs/typescript-components.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const workpackage = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const docs = readText(docsPath, rootDir);
  const blueprintSource = readText('xtend-builder/blueprints/component-blueprint.contract.js', rootDir);
  const generatorSource = readText('xtend-builder/generators/component-files.js', rootDir);
  const templateRegistrySource = readText('xtend-builder/templates/registry.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.typescriptComponentBlueprint;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-07 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'TypeScript Component Blueprint contract exists');
  assertFileExists(context, suitePath, rootDir, 'TypeScript Component Blueprint suite exists');
  assertFileExists(context, docsPath, rootDir, 'TypeScript components docs exist');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-07');
  context.assertIncludes(registry, contractPath, 'Reference registry links TypeScript Component Blueprint contract');
  context.assertIncludes(registry, suitePath, 'Reference registry links TypeScript Component Blueprint suite');
  context.assertIncludes(registry, docsPath, 'Reference registry links TypeScript components docs');
  context.assertIncludes(epic, '| `WP-E10-07` | P0 | completed |', 'Epic 10 marks WP-E10-07 completed');
  context.assertIncludes(epic, '| `WP-E10-08` | P1 | completed |', 'Epic 10 marks WP-E10-08 completed after WP-E10-07');
  context.assertIncludes(epic, '| `WP-E10-09` | P1 | completed |', 'Epic 10 marks WP-E10-09 completed after implementation');
  context.assertIncludes(epic, '| `WP-E10-10` | P1 | completed |', 'Epic 10 marks WP-E10-10 completed after implementation');
  context.assertIncludes(epic, '| `WP-E10-11` | P1 | completed |', 'Epic 10 marks WP-E10-11 completed after implementation');
  context.assertIncludes(backlog, '| `WP-E10-07` | P0 | completed |', 'Epic 10 backlog marks WP-E10-07 completed');
  context.assertIncludes(backlog, '| `WP-E10-08` | P1 | completed |', 'Epic 10 backlog marks WP-E10-08 completed after WP-E10-07');
  context.assertIncludes(backlog, '| `WP-E10-09` | P1 | completed |', 'Epic 10 backlog marks WP-E10-09 completed after implementation');
  context.assertIncludes(backlog, '| `WP-E10-10` | P1 | completed |', 'Epic 10 backlog marks WP-E10-10 completed after implementation');
  context.assertIncludes(backlog, '| `WP-E10-11` | P1 | completed |', 'Epic 10 backlog marks WP-E10-11 completed after implementation');
  context.assertIncludes(workpackage, 'xtend.epic10.wp07.typescript-component-blueprint.v1', 'WP-E10-07 declares workpackage contract');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-07 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js builder-typescript-blueprint --json', 'WP-E10-07 documents local gate');
  context.assertIncludes(contract, 'xtend.scaffold.typescript-component-blueprint.v1', 'TypeScript Component Blueprint document declares schema');
  context.assertIncludes(contract, '`ts-source`', 'TypeScript Component Blueprint document declares ts-source artifact');
  context.assertIncludes(contract, '`ts-rmt`', 'TypeScript Component Blueprint document declares ts-rmt artifact');
  context.assertIncludes(contract, 'xtend.component.lifecycle-telemetry.v1', 'TypeScript Component Blueprint document binds Lifecycle Telemetry');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'TypeScript Component Blueprint keeps RMT kernel boundary visible');
  context.assertIncludes(docs, 'xtend.scaffold.typescript-component-blueprint.v1', 'TypeScript components docs mention blueprint schema');
  context.assertIncludes(blueprintSource, 'TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA', 'Component blueprint module declares TypeScript Blueprint schema');
  context.assertIncludes(blueprintSource, "'ts-source'", 'Component blueprint module declares ts-source artifact');
  context.assertIncludes(generatorSource, 'componentContractV2', 'Component files generator exposes Component Contract v2 wiring');
  context.assertIncludes(generatorSource, 'rmtComponentMetadata', 'Component files generator creates RMT metadata');
  context.assertIncludes(templateRegistrySource, 'component.ts-source', 'Template registry declares TypeScript source template');
  context.assertIncludes(templateRegistrySource, 'component.ts-rmt', 'Template registry declares RMT metadata template');
  context.assertIncludes(scaffoldConfig, 'typescriptComponentBlueprint', 'Scaffold config exposes TypeScript Component Blueprint');
  context.assertIncludes(runner, "id: 'builder-typescript-blueprint'", 'Test runner registers TypeScript Component Blueprint suite');
  context.assert(packageManifest.scripts['test:builder-typescript-blueprint'] === 'node scripts/run_xtend_tests.js builder-typescript-blueprint', 'Package exposes TypeScript Blueprint test script');
  context.assert(metadata && metadata.schema === 'xtend.scaffold.typescript-component-blueprint.v1', 'Package metadata exposes TypeScript Component Blueprint schema');
  context.assert(metadata.contract === contractPath, 'Package metadata points at TypeScript Component Blueprint contract');
  context.assert(metadata.suite === suitePath, 'Package metadata points at TypeScript Component Blueprint suite');
  context.assert(Array.isArray(metadata.requiredArtifacts) && metadata.requiredArtifacts.includes('ts-performance'), 'Package metadata requires TypeScript Performance artifact');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps TypeScript Blueprint RMT boundary');
}

function assertEpic10P0ComponentWaveReference(context, rootDir) {
  const wpPath = 'development/WP-E10-08-P0-Komponentenwelle-priorisieren-und-Contracts-anlegen.md';
  const contractPath = 'development/XTend-P0-Komponentenwelle-und-Contract-Stubs.md';
  const modulePath = 'catalog/epic10-p0-component-wave.js';
  const suitePath = 'tests/components/epic10_p0_component_wave_suite.js';
  const docsPath = 'docs/component-platform.md';
  const expectedTags = ['x-select', 'x-checkbox', 'x-radio', 'x-textarea', 'x-status', 'x-progress', 'x-tooltip', 'x-popover', 'x-drawer'];
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const workpackage = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const moduleSource = readText(modulePath, rootDir);
  const suiteSource = readText(suitePath, rootDir);
  const docs = readText(docsPath, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10P0ComponentWave;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-08 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'P0 component wave contract exists');
  assertFileExists(context, modulePath, rootDir, 'P0 component wave module exists');
  assertFileExists(context, suitePath, rootDir, 'P0 component wave suite exists');
  assertFileExists(context, docsPath, rootDir, 'Component Platform docs exist');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-08');
  context.assertIncludes(registry, contractPath, 'Reference registry links P0 component wave contract');
  context.assertIncludes(registry, modulePath, 'Reference registry links P0 component wave module');
  context.assertIncludes(registry, suitePath, 'Reference registry links P0 component wave suite');
  context.assertIncludes(registry, docsPath, 'Reference registry links Component Platform docs');
  context.assertIncludes(epic, '| `WP-E10-08` | P1 | completed |', 'Epic 10 marks WP-E10-08 completed');
  context.assertIncludes(epic, '| `WP-E10-09` | P1 | completed |', 'Epic 10 marks WP-E10-09 completed');
  context.assertIncludes(epic, '| `WP-E10-10` | P1 | completed |', 'Epic 10 marks WP-E10-10 completed');
  context.assertIncludes(epic, '| `WP-E10-11` | P1 | completed |', 'Epic 10 marks WP-E10-11 completed');
  context.assertIncludes(backlog, '| `WP-E10-08` | P1 | completed |', 'Epic 10 backlog marks WP-E10-08 completed');
  context.assertIncludes(backlog, '| `WP-E10-09` | P1 | completed |', 'Epic 10 backlog marks WP-E10-09 completed');
  context.assertIncludes(backlog, '| `WP-E10-10` | P1 | completed |', 'Epic 10 backlog marks WP-E10-10 completed');
  context.assertIncludes(backlog, '| `WP-E10-11` | P1 | completed |', 'Epic 10 backlog marks WP-E10-11 completed');
  context.assertIncludes(workpackage, 'xtend.epic10.wp08.p0-component-wave.v1', 'WP-E10-08 declares workpackage contract');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-08 is completed');
  context.assertIncludes(workpackage, 'node scripts/run_xtend_tests.js epic10-p0-component-wave --json', 'WP-E10-08 documents local gate');
  context.assertIncludes(contract, 'xtend.epic10.p0-component-wave.v1', 'P0 component wave contract declares schema');
  context.assertIncludes(contract, 'xtend.epic10.p0-component-contract-stub.v1', 'P0 component wave contract declares stub schema');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'P0 component wave keeps RMT kernel boundary visible');
  context.assertIncludes(moduleSource, 'EPIC10_P0_COMPONENT_WAVE_SCHEMA', 'P0 component wave module declares schema constant');
  context.assertIncludes(moduleSource, 'createP0ComponentWavePlan', 'P0 component wave module exports plan factory');
  context.assertIncludes(moduleSource, 'validateP0ComponentWavePlan', 'P0 component wave module exports validator');
  context.assertIncludes(suiteSource, 'runEpic10P0ComponentWaveSuite', 'P0 component wave suite exports runner');
  context.assertIncludes(runner, "id: 'epic10-p0-component-wave'", 'Test runner registers P0 component wave suite');
  context.assertIncludes(scaffoldConfig, 'componentPlatformP0Wave', 'Scaffold config exposes P0 component wave section');
  context.assert((packageManifest.exports['./catalog/epic10-p0-component-wave'] === './catalog/epic10-p0-component-wave.js' || (packageManifest.exports['./catalog/epic10-p0-component-wave'] && packageManifest.exports['./catalog/epic10-p0-component-wave'].default === './catalog/epic10-p0-component-wave.js')), 'Package exports P0 component wave module');
  context.assert(packageManifest.scripts['test:epic10-p0-component-wave'] === 'node scripts/run_xtend_tests.js epic10-p0-component-wave', 'Package exposes P0 component wave test script');
  context.assert(metadata && metadata.schema === 'xtend.epic10.p0-component-wave.v1', 'Package metadata exposes P0 component wave schema');
  context.assert(metadata.contract === contractPath, 'Package metadata points at P0 component wave contract');
  context.assert(metadata.module === modulePath, 'Package metadata points at P0 component wave module');
  context.assert(metadata.suite === suitePath, 'Package metadata points at P0 component wave suite');
  context.assert(metadata.localGate === 'node scripts/run_xtend_tests.js epic10-p0-component-wave --json', 'Package metadata exposes P0 component wave local gate');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps P0 wave RMT boundary');
  context.assert(Array.isArray(metadata.implementationOrder) && metadata.implementationOrder.length === expectedTags.length, 'Package metadata exposes all P0 wave components');

  expectedTags.forEach((tag) => {
    context.assertIncludes(contract, tag, `P0 component wave contract documents ${tag}`);
    context.assertIncludes(moduleSource, tag, `P0 component wave module declares ${tag}`);
    context.assertIncludes(docs, tag, `Component Platform docs mention ${tag}`);
    context.assert(metadata.implementationOrder.includes(tag), `Package metadata includes ${tag}`);
  });
}

function assertEpic10FormSelectionControlsReference(context, rootDir) {
  const wpPath = 'development/WP-E10-09-x-select-x-checkbox-x-radio-TypeScript-first-implementieren.md';
  const contractPath = 'development/XTend-Form-Selection-Controls-TypeScript-RMT-Contract.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const wp = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const componentSuite = readText('tests/components/component_suite.js', rootDir);
  const priorityContracts = readText('tests/components/priority_component_contracts.js', rootDir);
  const publicTypesSuite = readText('tests/components/component_public_types_suite.js', rootDir);
  const xFormSource = readText('components/xform.js', rootDir);
  const catalogModule = require(resolveRepoPath('catalog/component-catalog-coverage.js', rootDir));
  const report = catalogModule.createComponentCatalogCoverageReport({ rootDir });
  const byTag = new Map(report.entries.map((entry) => [entry.tag, entry]));
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10FormSelectionControls;
  const expected = [
    {
      tag: 'x-select',
      runtime: 'components/xselect.js',
      source: 'src/components/x-select/x-select.ts',
      types: 'components/xselect.d.ts',
      docs: 'docs/components/xselect.md',
      fixture: 'tests/components/fixtures/xselect.component.html',
      suite: 'tests/components/xselect.component_suite.js',
      manifest: './xselect.js'
    },
    {
      tag: 'x-checkbox',
      runtime: 'components/xcheckbox.js',
      source: 'src/components/x-checkbox/x-checkbox.ts',
      types: 'components/xcheckbox.d.ts',
      docs: 'docs/components/xcheckbox.md',
      fixture: 'tests/components/fixtures/xcheckbox.component.html',
      suite: 'tests/components/xcheckbox.component_suite.js',
      manifest: './xcheckbox.js'
    },
    {
      tag: 'x-radio',
      runtime: 'components/xradio.js',
      source: 'src/components/x-radio/x-radio.ts',
      types: 'components/xradio.d.ts',
      docs: 'docs/components/xradio.md',
      fixture: 'tests/components/fixtures/xradio.component.html',
      suite: 'tests/components/xradio.component_suite.js',
      manifest: './xradio.js'
    }
  ];

  assertFileExists(context, wpPath, rootDir, 'WP-E10-09 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Form Selection Controls contract exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-09');
  context.assertIncludes(registry, contractPath, 'Reference registry links Form Selection Controls contract');
  context.assertIncludes(epic, '| `WP-E10-09` | P1 | completed |', 'Epic 10 marks WP-E10-09 completed');
  context.assertIncludes(epic, '| `WP-E10-10` | P1 | completed |', 'Epic 10 marks WP-E10-10 completed');
  context.assertIncludes(epic, '| `WP-E10-11` | P1 | completed |', 'Epic 10 marks WP-E10-11 completed');
  context.assertIncludes(backlog, '| `WP-E10-09` | P1 | completed |', 'Backlog marks WP-E10-09 completed');
  context.assertIncludes(backlog, '| `WP-E10-10` | P1 | completed |', 'Backlog marks WP-E10-10 completed');
  context.assertIncludes(backlog, '| `WP-E10-11` | P1 | completed |', 'Backlog marks WP-E10-11 completed');
  context.assertIncludes(wp, 'xtend.epic10.form-selection-controls.v1', 'WP-E10-09 declares form selection controls schema');
  context.assertIncludes(wp, 'Status: `completed`', 'WP-E10-09 is completed');
  context.assertIncludes(contract, 'xtend.epic10.form-selection-controls.v1', 'Form Selection Controls contract declares schema');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Form Selection Controls contract keeps RMT boundary');
  context.assert(metadata && metadata.schema === 'xtend.epic10.form-selection-controls.v1', 'Package metadata exposes WP-E10-09 schema');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata accepts WP-E10-09');
  context.assert(packageManifest.xtend.componentPublicTypes.typedPriorityComponents === 41, 'Package metadata counts 41 public type artifacts after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.componentSuite.covered === 41, 'Coverage report counts 41 component suites after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.performance.covered === 39, 'Coverage report counts thirty-nine performance-ready components after SurfaceManager side-panel runtime');
  context.assertIncludes(xFormSource, 'x-select, x-checkbox, x-radio', 'x-form discovers selection controls');
  context.assertIncludes(xFormSource, 'select-changed', 'x-form listens to select changes');
  context.assertIncludes(xFormSource, 'checkbox-changed', 'x-form listens to checkbox changes');
  context.assertIncludes(xFormSource, 'radio-changed', 'x-form listens to radio changes');

  expected.forEach((entry) => {
    assertFileExists(context, entry.runtime, rootDir, `${entry.tag} runtime exists`);
    assertFileExists(context, entry.source, rootDir, `${entry.tag} TypeScript source exists`);
    assertFileExists(context, entry.types, rootDir, `${entry.tag} public types exist`);
    assertFileExists(context, entry.docs, rootDir, `${entry.tag} docs exist`);
    assertFileExists(context, entry.fixture, rootDir, `${entry.tag} fixture exists`);
    assertFileExists(context, entry.suite, rootDir, `${entry.tag} suite exists`);
    context.assert(manifest[entry.tag] === entry.manifest, `${entry.tag} manifest entry is local`);
    context.assertIncludes(componentSuite, path.basename(entry.suite, '.js'), `Component suite imports ${entry.tag}`);
    context.assertIncludes(priorityContracts, entry.tag, `Priority component contracts include ${entry.tag}`);
    context.assertIncludes(publicTypesSuite, entry.types, `Public type suite includes ${entry.tag}`);
    context.assert(byTag.get(entry.tag) && byTag.get(entry.tag).status === 'enterprise-ready', `${entry.tag} is enterprise-ready`);
    context.assert(metadata && Array.isArray(metadata.components) && metadata.components.includes(entry.tag), `Package metadata lists ${entry.tag}`);
  });
}

function assertEpic10FormFeedbackControlsReference(context, rootDir) {
  const wpPath = 'development/WP-E10-10-x-textarea-x-status-x-progress-implementieren.md';
  const contractPath = 'development/XTend-Form-Feedback-Controls-TypeScript-RMT-Contract.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const wp = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const componentSuite = readText('tests/components/component_suite.js', rootDir);
  const priorityContracts = readText('tests/components/priority_component_contracts.js', rootDir);
  const publicTypesSuite = readText('tests/components/component_public_types_suite.js', rootDir);
  const xFormSource = readText('components/xform.js', rootDir);
  const catalogModule = require(resolveRepoPath('catalog/component-catalog-coverage.js', rootDir));
  const report = catalogModule.createComponentCatalogCoverageReport({ rootDir });
  const byTag = new Map(report.entries.map((entry) => [entry.tag, entry]));
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10FormFeedbackControls;
  const expected = [
    {
      tag: 'x-textarea',
      runtime: 'components/xtextarea.js',
      source: 'src/components/x-textarea/x-textarea.ts',
      types: 'components/xtextarea.d.ts',
      docs: 'docs/components/xtextarea.md',
      fixture: 'tests/components/fixtures/xtextarea.component.html',
      suite: 'tests/components/xtextarea.component_suite.js',
      manifest: './xtextarea.js'
    },
    {
      tag: 'x-status',
      runtime: 'components/xstatus.js',
      source: 'src/components/x-status/x-status.ts',
      types: 'components/xstatus.d.ts',
      docs: 'docs/components/xstatus.md',
      fixture: 'tests/components/fixtures/xstatus.component.html',
      suite: 'tests/components/xstatus.component_suite.js',
      manifest: './xstatus.js'
    },
    {
      tag: 'x-progress',
      runtime: 'components/xprogress.js',
      source: 'src/components/x-progress/x-progress.ts',
      types: 'components/xprogress.d.ts',
      docs: 'docs/components/xprogress.md',
      fixture: 'tests/components/fixtures/xprogress.component.html',
      suite: 'tests/components/xprogress.component_suite.js',
      manifest: './xprogress.js'
    }
  ];

  assertFileExists(context, wpPath, rootDir, 'WP-E10-10 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Form Feedback Controls contract exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-10');
  context.assertIncludes(registry, contractPath, 'Reference registry links Form Feedback Controls contract');
  context.assertIncludes(epic, '| `WP-E10-10` | P1 | completed |', 'Epic 10 marks WP-E10-10 completed');
  context.assertIncludes(epic, '| `WP-E10-11` | P1 | completed |', 'Epic 10 marks WP-E10-11 completed');
  context.assertIncludes(backlog, '| `WP-E10-10` | P1 | completed |', 'Backlog marks WP-E10-10 completed');
  context.assertIncludes(backlog, '| `WP-E10-11` | P1 | completed |', 'Backlog marks WP-E10-11 completed');
  context.assertIncludes(wp, 'xtend.epic10.form-feedback-controls.v1', 'WP-E10-10 declares form feedback controls schema');
  context.assertIncludes(wp, 'Status: `completed`', 'WP-E10-10 is completed');
  context.assertIncludes(contract, 'xtend.epic10.form-feedback-controls.v1', 'Form Feedback Controls contract declares schema');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Form Feedback Controls contract keeps RMT boundary');
  context.assert(metadata && metadata.schema === 'xtend.epic10.form-feedback-controls.v1', 'Package metadata exposes WP-E10-10 schema');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata accepts WP-E10-10');
  context.assert(packageManifest.xtend.componentPublicTypes.typedPriorityComponents === 41, 'Package metadata counts 41 public type artifacts after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.componentSuite.covered === 41, 'Coverage report counts 41 component suites after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.performance.covered === 39, 'Coverage report counts thirty-nine performance-ready components after SurfaceManager side-panel runtime');
  context.assertIncludes(xFormSource, 'x-select, x-checkbox, x-radio, x-textarea', 'x-form discovers textarea control');
  context.assertIncludes(xFormSource, 'textarea-changed', 'x-form listens to textarea changes');

  expected.forEach((entry) => {
    assertFileExists(context, entry.runtime, rootDir, `${entry.tag} runtime exists`);
    assertFileExists(context, entry.source, rootDir, `${entry.tag} TypeScript source exists`);
    assertFileExists(context, entry.types, rootDir, `${entry.tag} public types exist`);
    assertFileExists(context, entry.docs, rootDir, `${entry.tag} docs exist`);
    assertFileExists(context, entry.fixture, rootDir, `${entry.tag} fixture exists`);
    assertFileExists(context, entry.suite, rootDir, `${entry.tag} suite exists`);
    context.assert(manifest[entry.tag] === entry.manifest, `${entry.tag} manifest entry is local`);
    context.assertIncludes(componentSuite, path.basename(entry.suite, '.js'), `Component suite imports ${entry.tag}`);
    context.assertIncludes(priorityContracts, entry.tag, `Priority component contracts include ${entry.tag}`);
    context.assertIncludes(publicTypesSuite, entry.types, `Public type suite includes ${entry.tag}`);
    context.assert(byTag.get(entry.tag) && byTag.get(entry.tag).status === 'enterprise-ready', `${entry.tag} is enterprise-ready`);
    context.assert(metadata && Array.isArray(metadata.components) && metadata.components.includes(entry.tag), `Package metadata lists ${entry.tag}`);
  });
}

function assertEpic10OverlayNavigationControlsReference(context, rootDir) {
  const wpPath = 'development/WP-E10-11-x-tooltip-x-popover-x-drawer-implementieren.md';
  const contractPath = 'development/XTend-Overlay-Navigation-Controls-TypeScript-RMT-Contract.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const wp = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const componentSuite = readText('tests/components/component_suite.js', rootDir);
  const priorityContracts = readText('tests/components/priority_component_contracts.js', rootDir);
  const publicTypesSuite = readText('tests/components/component_public_types_suite.js', rootDir);
  const catalogModule = require(resolveRepoPath('catalog/component-catalog-coverage.js', rootDir));
  const report = catalogModule.createComponentCatalogCoverageReport({ rootDir });
  const byTag = new Map(report.entries.map((entry) => [entry.tag, entry]));
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10OverlayNavigationControls;
  const expected = [
    {
      tag: 'x-tooltip',
      runtime: 'components/xtooltip.js',
      source: 'src/components/x-tooltip/x-tooltip.ts',
      types: 'components/xtooltip.d.ts',
      docs: 'docs/components/xtooltip.md',
      fixture: 'tests/components/fixtures/xtooltip.component.html',
      suite: 'tests/components/xtooltip.component_suite.js',
      manifest: './xtooltip.js'
    },
    {
      tag: 'x-popover',
      runtime: 'components/xpopover.js',
      source: 'src/components/x-popover/x-popover.ts',
      types: 'components/xpopover.d.ts',
      docs: 'docs/components/xpopover.md',
      fixture: 'tests/components/fixtures/xpopover.component.html',
      suite: 'tests/components/xpopover.component_suite.js',
      manifest: './xpopover.js'
    },
    {
      tag: 'x-drawer',
      runtime: 'components/xdrawer.js',
      source: 'src/components/x-drawer/x-drawer.ts',
      types: 'components/xdrawer.d.ts',
      docs: 'docs/components/xdrawer.md',
      fixture: 'tests/components/fixtures/xdrawer.component.html',
      suite: 'tests/components/xdrawer.component_suite.js',
      manifest: './xdrawer.js'
    }
  ];

  assertFileExists(context, wpPath, rootDir, 'WP-E10-11 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Overlay Navigation Controls contract exists');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-11');
  context.assertIncludes(registry, contractPath, 'Reference registry links Overlay Navigation Controls contract');
  context.assertIncludes(epic, '| `WP-E10-11` | P1 | completed |', 'Epic 10 marks WP-E10-11 completed');
  context.assertIncludes(epic, '| `WP-E10-12` | P1 | completed |', 'Epic 10 marks WP-E10-12 completed');
  context.assertIncludes(epic, '| `WP-E10-13` | P1 | completed |', 'Epic 10 marks WP-E10-13 completed');
  context.assertIncludes(epic, '| `WP-E10-14` | P1 | completed |', 'Epic 10 marks WP-E10-14 completed');
  context.assertIncludes(epic, '| `WP-E10-15` | P1 | completed |', 'Epic 10 marks WP-E10-15 completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '| `WP-E10-11` | P1 | completed |', 'Backlog marks WP-E10-11 completed');
  context.assertIncludes(backlog, '| `WP-E10-12` | P1 | completed |', 'Backlog marks WP-E10-12 completed');
  context.assertIncludes(backlog, '| `WP-E10-13` | P1 | completed |', 'Backlog marks WP-E10-13 completed');
  context.assertIncludes(backlog, '| `WP-E10-14` | P1 | completed |', 'Backlog marks WP-E10-14 completed');
  context.assertIncludes(backlog, '| `WP-E10-15` | P1 | completed |', 'Backlog marks WP-E10-15 completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(wp, 'xtend.epic10.overlay-navigation-controls.v1', 'WP-E10-11 declares overlay navigation controls schema');
  context.assertIncludes(wp, 'Status: `completed`', 'WP-E10-11 is completed');
  context.assertIncludes(contract, 'xtend.epic10.overlay-navigation-controls.v1', 'Overlay Navigation Controls contract declares schema');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Overlay Navigation Controls contract keeps RMT boundary');
  context.assert(metadata && metadata.schema === 'xtend.epic10.overlay-navigation-controls.v1', 'Package metadata exposes WP-E10-11 schema');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata accepts WP-E10-11');
  context.assert(packageManifest.xtend.componentPublicTypes.typedPriorityComponents === 41, 'Package metadata counts 41 public type artifacts after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.componentSuite.covered === 41, 'Coverage report counts 41 component suites after SurfaceManager side-panel runtime');
  context.assert(report.summary.byDimension.performance.covered === 39, 'Coverage report counts thirty-nine performance-ready components after SurfaceManager side-panel runtime');

  expected.forEach((entry) => {
    assertFileExists(context, entry.runtime, rootDir, `${entry.tag} runtime exists`);
    assertFileExists(context, entry.source, rootDir, `${entry.tag} TypeScript source exists`);
    assertFileExists(context, entry.types, rootDir, `${entry.tag} public types exist`);
    assertFileExists(context, entry.docs, rootDir, `${entry.tag} docs exist`);
    assertFileExists(context, entry.fixture, rootDir, `${entry.tag} fixture exists`);
    assertFileExists(context, entry.suite, rootDir, `${entry.tag} suite exists`);
    context.assert(manifest[entry.tag] === entry.manifest, `${entry.tag} manifest entry is local`);
    context.assertIncludes(componentSuite, path.basename(entry.suite, '.js'), `Component suite imports ${entry.tag}`);
    context.assertIncludes(priorityContracts, entry.tag, `Priority component contracts include ${entry.tag}`);
    context.assertIncludes(publicTypesSuite, entry.types, `Public type suite includes ${entry.tag}`);
    context.assert(byTag.get(entry.tag) && byTag.get(entry.tag).status === 'enterprise-ready', `${entry.tag} is enterprise-ready`);
    context.assert(metadata && Array.isArray(metadata.components) && metadata.components.includes(entry.tag), `Package metadata lists ${entry.tag}`);
  });
}

function assertEpic10ComponentLabRmtInspectorReference(context, rootDir) {
  const wpPath = 'development/WP-E10-12-Component-Lab-und-RMT-Inspector-Pilot-anlegen.md';
  const contractPath = 'development/XTend-Component-Lab-und-RMT-Inspector-Pilot.md';
  const modulePath = 'xtend-builder/preview/component-lab.js';
  const fixturePath = 'tests/fixtures/rmt-component-lab-pilot.rmt';
  const suitePath = 'tests/builder/component_lab_rmt_inspector_suite.js';
  const docsPath = 'docs/component-lab.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const wp = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const docs = readText(docsPath, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const fixture = readJson(fixturePath, rootDir);
  const componentLabModule = require(resolveRepoPath(modulePath, rootDir));
  const plan = componentLabModule.createComponentLabPlan({ rootDir });
  const gate = componentLabModule.createComponentLabGate({ rootDir, plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.componentLabRmtInspector;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-12 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Component Lab contract exists');
  assertFileExists(context, modulePath, rootDir, 'Component Lab module exists');
  assertFileExists(context, fixturePath, rootDir, 'Component Lab RMT fixture exists');
  assertFileExists(context, suitePath, rootDir, 'Component Lab suite exists');
  assertFileExists(context, docsPath, rootDir, 'Component Lab docs exist');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-12');
  context.assertIncludes(registry, contractPath, 'Reference registry links Component Lab contract');
  context.assertIncludes(registry, modulePath, 'Reference registry links Component Lab module');
  context.assertIncludes(registry, fixturePath, 'Reference registry links Component Lab fixture');
  context.assertIncludes(registry, suitePath, 'Reference registry links Component Lab suite');
  context.assertIncludes(registry, docsPath, 'Reference registry links Component Lab docs');
  context.assertIncludes(epic, '| `WP-E10-12` | P1 | completed |', 'Epic 10 marks WP-E10-12 completed');
  context.assertIncludes(epic, '| `WP-E10-13` | P1 | completed |', 'Epic 10 marks WP-E10-13 completed');
  context.assertIncludes(epic, '| `WP-E10-14` | P1 | completed |', 'Epic 10 marks WP-E10-14 completed');
  context.assertIncludes(epic, '| `WP-E10-15` | P1 | completed |', 'Epic 10 marks WP-E10-15 completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '| `WP-E10-12` | P1 | completed |', 'Backlog marks WP-E10-12 completed');
  context.assertIncludes(backlog, '| `WP-E10-13` | P1 | completed |', 'Backlog marks WP-E10-13 completed');
  context.assertIncludes(backlog, '| `WP-E10-14` | P1 | completed |', 'Backlog marks WP-E10-14 completed');
  context.assertIncludes(backlog, '| `WP-E10-15` | P1 | completed |', 'Backlog marks WP-E10-15 completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(wp, 'Status: `completed`', 'WP-E10-12 is completed');
  context.assertIncludes(wp, 'xtend.epic10.component-lab-rmt-inspector.v1', 'WP-E10-12 declares Component Lab schema');
  context.assertIncludes(contract, 'xtend.epic10.component-lab-rmt-inspector.v1', 'Component Lab contract declares schema');
  context.assertIncludes(contract, 'RMT Inspector', 'Component Lab contract documents RMT Inspector');
  context.assertIncludes(contract, 'Telemetry Panel', 'Component Lab contract documents telemetry panel');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Component Lab contract keeps kernel boundary');
  context.assertIncludes(docs, 'xtend.docs.component-lab.v1', 'Component Lab docs declare docs schema');
  context.assertIncludes(docsReadme, './component-lab.md', 'Docs README links Component Lab docs');
  context.assertIncludes(runner, "id: 'component-lab-rmt-inspector'", 'Runner registers Component Lab gate');
  context.assertIncludes(scaffoldConfig, 'componentLabRmtInspector', 'Scaffold config exposes Component Lab metadata');
  context.assert((typeof packageManifest.exports['./builder/preview/component-lab'] === 'string' ? packageManifest.exports['./builder/preview/component-lab'] : packageManifest.exports['./builder/preview/component-lab'] && packageManifest.exports['./builder/preview/component-lab'].default) === './xtend-builder/preview/component-lab.js', 'Package exports Component Lab module');
  context.assert(packageManifest.scripts['test:component-lab'] === 'node scripts/run_xtend_tests.js component-lab-rmt-inspector', 'Package exposes Component Lab script');
  context.assert(metadata && metadata.schema === 'xtend.epic10.component-lab-rmt-inspector.v1', 'Package metadata exposes Component Lab schema');
  context.assert(metadata && metadata.status === 'accepted-pilot', 'Package metadata accepts Component Lab pilot');
  context.assert(metadata && metadata.fixture === fixturePath, 'Package metadata points at Component Lab fixture');
  context.assert(Array.isArray(metadata.previewTargets) && metadata.previewTargets.length === 9, 'Package metadata lists nine Component Lab targets');
  context.assert(fixture.manifest.metadata.contractVersion === 'xtend.epic10.component-lab-rmt-inspector.v1', 'Component Lab fixture declares schema');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'Component Lab fixture declares shell-first render mode');
  context.assert(JSON.stringify(fixture).includes('lab.panel.rmt.inspector'), 'Component Lab fixture declares RMT Inspector panel');
  context.assert(JSON.stringify(fixture).includes('snapshot.componentTelemetry'), 'Component Lab fixture declares telemetry snapshot path');
  context.assert(plan.schema === 'xtend.epic10.component-lab-rmt-inspector.v1', 'Component Lab module creates stable plan schema');
  context.assert(plan.lab.previewTargets.length === 9, 'Component Lab plan has nine preview targets');
  context.assert(plan.inspector.domains.includes('diagnostics'), 'Component Lab plan inspects diagnostics');
  context.assert(gate.ok === true, 'Component Lab gate accepts generated plan');
}

function assertEpic10PlatformGatesReference(context, rootDir) {
  const wpPath = 'development/WP-E10-15-Browser-A11y-Performance-und-Visual-Gates-erweitern.md';
  const contractPath = 'development/XTend-Epic10-Platform-Gates.md';
  const modulePath = 'catalog/epic10-platform-gates.js';
  const suitePath = 'tests/platform/epic10_platform_gates_suite.js';
  const docsPath = 'docs/epic10-platform-gates.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const wp = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const docs = readText(docsPath, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const platformModule = require(resolveRepoPath(modulePath, rootDir));
  const plan = platformModule.createEpic10PlatformGatePlan({ rootDir });
  const gate = platformModule.createEpic10PlatformGateReport({ rootDir, plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10PlatformGates;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-15 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Epic 10 Platform Gates contract exists');
  assertFileExists(context, modulePath, rootDir, 'Epic 10 Platform Gates module exists');
  assertFileExists(context, suitePath, rootDir, 'Epic 10 Platform Gates suite exists');
  assertFileExists(context, docsPath, rootDir, 'Epic 10 Platform Gates docs exist');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-15');
  context.assertIncludes(registry, contractPath, 'Reference registry links Epic 10 Platform Gates contract');
  context.assertIncludes(registry, modulePath, 'Reference registry links Epic 10 Platform Gates module');
  context.assertIncludes(registry, suitePath, 'Reference registry links Epic 10 Platform Gates suite');
  context.assertIncludes(registry, docsPath, 'Reference registry links Epic 10 Platform Gates docs');
  context.assertIncludes(epic, '| `WP-E10-15` | P1 | completed |', 'Epic 10 marks WP-E10-15 completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '| `WP-E10-15` | P1 | completed |', 'Backlog marks WP-E10-15 completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(wp, 'Status: `completed`', 'WP-E10-15 is completed');
  context.assertIncludes(wp, 'xtend.epic10.wp15.platform-gates.v1', 'WP-E10-15 declares workpackage schema');
  context.assertIncludes(contract, 'xtend.epic10.platform-gates.v1', 'Epic 10 Platform Gates contract declares schema');
  context.assertIncludes(contract, 'Fast PR Gate', 'Epic 10 Platform Gates contract documents Fast PR Gate');
  context.assertIncludes(contract, 'Release Gate', 'Epic 10 Platform Gates contract documents Release Gate');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Epic 10 Platform Gates contract keeps RMT boundary');
  context.assertIncludes(docs, 'xtend.epic10.platform-gates.v1', 'Epic 10 Platform Gates docs declare schema');
  context.assertIncludes(docsReadme, './epic10-platform-gates.md', 'Docs README links Epic 10 Platform Gates docs');
  context.assertIncludes(docsMenu, 'epic10-platform-gates', 'Docs menu links Epic 10 Platform Gates');
  context.assertIncludes(runner, "id: 'epic10-platform-gates'", 'Runner registers Epic 10 Platform Gates suite');
  context.assertIncludes(scaffoldConfig, 'epic10PlatformGates', 'Scaffold config exposes Epic 10 Platform Gates');
  context.assert((packageManifest.exports['./catalog/epic10-platform-gates'] === './catalog/epic10-platform-gates.js' || (packageManifest.exports['./catalog/epic10-platform-gates'] && packageManifest.exports['./catalog/epic10-platform-gates'].default === './catalog/epic10-platform-gates.js')), 'Package exports Epic 10 Platform Gates module');
  context.assert(packageManifest.scripts['test:epic10-platform-gates'] === 'node scripts/run_xtend_tests.js epic10-platform-gates', 'Package exposes Epic 10 Platform Gates script');
  context.assert(metadata && metadata.schema === 'xtend.epic10.platform-gates.v1', 'Package metadata exposes Epic 10 Platform Gates schema');
  context.assert(metadata && metadata.workpackage === 'WP-E10-15', 'Package metadata exposes WP-E10-15 owner');
  context.assert(metadata && metadata.module === modulePath, 'Package metadata points at Epic 10 Platform Gates module');
  context.assert(metadata && metadata.suite === suitePath, 'Package metadata points at Epic 10 Platform Gates suite');
  context.assert(Array.isArray(metadata.fastPrSuiteIds) && metadata.fastPrSuiteIds.includes('browser'), 'Package metadata includes browser in Fast PR handoff');
  context.assert(Array.isArray(metadata.fastPrSuiteIds) && metadata.fastPrSuiteIds.includes('epic10-release-handoff'), 'Package metadata includes Release Handoff in Fast PR handoff');
  context.assert(Array.isArray(metadata.releaseSuiteIds) && metadata.releaseSuiteIds.includes('performance-regression'), 'Package metadata includes performance regression in release handoff');
  context.assert(plan.schema === 'xtend.epic10.platform-gates.v1', 'Epic 10 Platform Gates module creates stable plan schema');
  context.assert(plan.status === 'accepted-gate-chain', 'Epic 10 Platform Gates plan is accepted');
  context.assert(plan.requiredDomains.includes('visual-browser-regression'), 'Epic 10 Platform Gates plan includes visual browser regression domain');
  context.assert(plan.ci.fastPr.suiteIds.includes('browser'), 'Epic 10 Platform Gates plan includes browser in Fast PR');
  context.assert(plan.ci.fastPr.suiteIds.includes('epic10-release-handoff'), 'Epic 10 Platform Gates plan includes Release Handoff in Fast PR');
  context.assert(!plan.ci.fastPr.suiteIds.includes('performance-regression'), 'Epic 10 Platform Gates plan keeps performance regression release-only');
  context.assert(plan.ci.release.suiteIds.includes('performance-regression'), 'Epic 10 Platform Gates plan includes performance regression in release');
  context.assert(gate.ok === true, 'Epic 10 Platform Gates report passes');
}

function assertEpic10ReleaseHandoffReference(context, rootDir) {
  const wpPath = 'development/WP-E10-16-Dokumentation-Guides-und-Release-Handoff-finalisieren.md';
  const contractPath = 'development/XTend-Epic10-Abschluss-und-Release-Handoff.md';
  const modulePath = 'catalog/epic10-release-handoff.js';
  const suitePath = 'tests/platform/epic10_release_handoff_suite.js';
  const docsPath = 'docs/epic10-release-handoff.md';
  const rmtFirstDocsPath = 'docs/rmt-first-xtend-apps.md';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const wp = readText(wpPath, rootDir);
  const contract = readText(contractPath, rootDir);
  const docs = readText(docsPath, rootDir);
  const rmtFirstDocs = readText(rmtFirstDocsPath, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const componentPlatform = readText('docs/component-platform.md', rootDir);
  const typescriptDocs = readText('docs/typescript-components.md', rootDir);
  const enterpriseDocs = readText('docs/enterprise-adoption.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const handoffModule = require(resolveRepoPath(modulePath, rootDir));
  const plan = handoffModule.createEpic10ReleaseHandoffPlan({ rootDir });
  const validation = handoffModule.validateEpic10ReleaseHandoffPlan(plan);
  const report = handoffModule.createEpic10ReleaseHandoffReport({ rootDir, plan });
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10ReleaseHandoff;

  assertFileExists(context, wpPath, rootDir, 'WP-E10-16 workpackage exists');
  assertFileExists(context, contractPath, rootDir, 'Epic 10 Release Handoff contract exists');
  assertFileExists(context, modulePath, rootDir, 'Epic 10 Release Handoff module exists');
  assertFileExists(context, suitePath, rootDir, 'Epic 10 Release Handoff suite exists');
  assertFileExists(context, docsPath, rootDir, 'Epic 10 Release Handoff docs exist');
  assertFileExists(context, rmtFirstDocsPath, rootDir, 'RMT-first XTend Apps docs exist');
  context.assertIncludes(registry, wpPath, 'Reference registry links WP-E10-16');
  context.assertIncludes(registry, contractPath, 'Reference registry links Epic 10 Release Handoff contract');
  context.assertIncludes(registry, modulePath, 'Reference registry links Epic 10 Release Handoff module');
  context.assertIncludes(registry, suitePath, 'Reference registry links Epic 10 Release Handoff suite');
  context.assertIncludes(registry, docsPath, 'Reference registry links Epic 10 Release Handoff docs');
  context.assertIncludes(registry, rmtFirstDocsPath, 'Reference registry links RMT-first XTend Apps docs');
  context.assertIncludes(epic, '- Status: Completed', 'Epic 10 is completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '- Status: Completed', 'Backlog is completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(wp, 'Status: `completed`', 'WP-E10-16 is completed');
  context.assertIncludes(wp, 'xtend.epic10.wp16.release-handoff.v1', 'WP-E10-16 declares workpackage schema');
  context.assertIncludes(contract, 'xtend.epic10.release-handoff.v1', 'Epic 10 Release Handoff contract declares schema');
  context.assertIncludes(contract, 'adapter-injection-via-xtend-component-resolveFabricContext', 'Epic 10 Release Handoff contract declares Fabric boundary');
  context.assertIncludes(contract, 'private-until-release-owner-acceptance', 'Epic 10 Release Handoff contract blocks publish');
  context.assertIncludes(docs, 'xtend.epic10.release-handoff.v1', 'Epic 10 Release Handoff docs declare schema');
  context.assertIncludes(docs, 'Migration Notes', 'Epic 10 Release Handoff docs include migration notes');
  context.assertIncludes(docs, 'Next-Wave Handoff', 'Epic 10 Release Handoff docs include next-wave handoff');
  context.assertIncludes(rmtFirstDocs, 'xtend.docs.rmt-first-xtend-apps.v1', 'RMT-first XTend Apps docs declare docs schema');
  context.assertIncludes(rmtFirstDocs, 'xtend.rmt.first-class-app-authoring.v1', 'RMT-first XTend Apps docs declare app authoring contract');
  context.assertIncludes(rmtFirstDocs, 'no-rmt-kernel-import-of-xtend-types', 'RMT-first XTend Apps docs keep kernel boundary visible');
  context.assertIncludes(componentPlatform, 'Epic 10 Release Handoff', 'Component Platform docs mention Epic 10 release handoff');
  context.assertIncludes(typescriptDocs, 'WP-E10-16', 'TypeScript docs mention WP-E10-16');
  context.assertIncludes(enterpriseDocs, 'Epic 10 Release Handoff', 'Enterprise Adoption docs mention Epic 10 Release Handoff');
  context.assertIncludes(docsReadme, './epic10-release-handoff.md', 'Docs README links Epic 10 Release Handoff');
  context.assertIncludes(docsReadme, './rmt-first-xtend-apps.md', 'Docs README links RMT-first XTend Apps');
  context.assertIncludes(docsMenu, 'epic10-release-handoff', 'Docs menu links Epic 10 Release Handoff');
  context.assertIncludes(docsMenu, 'rmt-first-xtend-apps', 'Docs menu links RMT-first XTend Apps');
  context.assertIncludes(runner, "id: 'epic10-release-handoff'", 'Runner registers Epic 10 Release Handoff suite');
  context.assertIncludes(scaffoldConfig, 'epic10ReleaseHandoff', 'Scaffold config exposes Epic 10 Release Handoff');
  context.assert((packageManifest.exports['./catalog/epic10-release-handoff'] === './catalog/epic10-release-handoff.js' || (packageManifest.exports['./catalog/epic10-release-handoff'] && packageManifest.exports['./catalog/epic10-release-handoff'].default === './catalog/epic10-release-handoff.js')), 'Package exports Epic 10 Release Handoff module');
  context.assert(packageManifest.scripts['test:epic10-release-handoff'] === 'node scripts/run_xtend_tests.js epic10-release-handoff', 'Package exposes Epic 10 Release Handoff script');
  context.assert(metadata && metadata.schema === 'xtend.epic10.release-handoff.v1', 'Package metadata exposes Epic 10 Release Handoff schema');
  context.assert(metadata && metadata.status === 'accepted-release-handoff', 'Package metadata accepts Epic 10 Release Handoff');
  context.assert(metadata && metadata.workpackage === 'WP-E10-16', 'Package metadata exposes WP-E10-16 owner');
  context.assert(metadata && metadata.module === modulePath, 'Package metadata points at Epic 10 Release Handoff module');
  context.assert(metadata && metadata.suite === suitePath, 'Package metadata points at Epic 10 Release Handoff suite');
  context.assert(metadata && metadata.publishAllowed === false, 'Package metadata blocks publish from Epic 10 handoff');
  context.assert(Array.isArray(metadata.requiredDocs) && metadata.requiredDocs.includes(rmtFirstDocsPath), 'Package metadata includes RMT-first XTend Apps docs');
  context.assert(Array.isArray(metadata.requiredReleaseGates) && metadata.requiredReleaseGates.includes('epic10-release-handoff'), 'Package metadata includes Epic 10 Release Handoff release gate');
  context.assert(plan.schema === 'xtend.epic10.release-handoff.v1', 'Epic 10 Release Handoff module creates stable plan schema');
  context.assert(plan.status === 'accepted-release-handoff', 'Epic 10 Release Handoff plan is accepted');
  context.assert(plan.workpackage === 'WP-E10-16', 'Epic 10 Release Handoff plan belongs to WP-E10-16');
  context.assert(plan.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Epic 10 Release Handoff plan keeps RMT kernel boundary');
  context.assert(plan.canonicalFabricBoundary === 'adapter-injection-via-xtend-component-resolveFabricContext', 'Epic 10 Release Handoff plan declares canonical Fabric boundary');
  context.assert(plan.docsSurface.requiredDocs.includes(rmtFirstDocsPath), 'Epic 10 Release Handoff plan includes RMT-first XTend Apps docs');
  context.assert(plan.releaseReadiness.requiredGates.includes('epic10-release-handoff'), 'Epic 10 Release Handoff plan requires its own gate');
  context.assert(plan.epicCompletion.completedWorkpackages.length === 16, 'Epic 10 Release Handoff plan lists all 16 workpackages');
  context.assert(validation.ok === true, 'Epic 10 Release Handoff validation passes');
  context.assert(report.ok === true, 'Epic 10 Release Handoff report passes');
  context.assert(report.knownHandoffs.includes('xtendrmt-upstream-dsl-polish'), 'Epic 10 Release Handoff report keeps XTendRMT upstream handoff visible');
}

function assertEpic11BacklogAndUxMaturityReference(context, rootDir) {
  const epicPath = 'development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md';
  const backlogPath = 'development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md';
  const wp01Path = 'development/WP-E11-01-Epic-11-Backlog-und-UX-Reifegradmodell-anlegen.md';
  const wp02Path = 'development/WP-E11-02-Component-Shell-Contract-spezifizieren.md';
  const wp03Path = 'development/WP-E11-03-Styling-Token-und-CSS-Part-Contract-definieren.md';
  const wp04Path = 'development/WP-E11-04-Runtime-A11y-Contract-fuer-echte-UI-Bedienbarkeit-haerten.md';
  const wp05Path = 'development/WP-E11-05-Component-Performance-Profiles-und-Budgets-erweitern.md';
  const wp06Path = 'development/WP-E11-06-Component-Network-Contract-definieren.md';
  const wp07Path = 'development/WP-E11-07-RMT-Shell-Authoring-fuer-Component-UX-erweitern.md';
  const wp08Path = 'development/WP-E11-08-Form-Controls-UX-Reife-umsetzen.md';
  const wp09Path = 'development/WP-E11-09-Feedback-und-Status-UX-Reife-umsetzen.md';
  const wp10Path = 'development/WP-E11-10-Navigation-und-Routing-UX-Reife-umsetzen.md';
  const wp11Path = 'development/WP-E11-11-Overlay-und-Interaction-UX-Reife-umsetzen.md';
  const modelPath = 'development/XTend-Component-UX-Reifegradmodell.md';
  const shellContractPath = 'development/XTend-Component-Shell-Contract.md';
  const stylingContractPath = 'development/XTend-Component-Styling-Token-und-Part-Contract.md';
  const runtimeA11yContractPath = 'development/XTend-Runtime-A11y-UX-Contract.md';
  const componentUxPerformanceContractPath = 'development/XTend-Component-UX-Performance-Profile.md';
  const componentNetworkContractPath = 'development/XTend-Component-Network-Compatibility-Contract.md';
  const rmtShellAuthoringContractPath = 'development/XTend-RMT-Shell-Authoring-fuer-Component-UX.md';
  const rmtShellAuthoringFixturePath = 'tests/fixtures/rmt-shell-authoring-component-ux.rmt';
  const formControlsUxContractPath = 'development/XTend-Form-Controls-UX-Reife-Contract.md';
  const formControlsUxFixturePath = 'tests/fixtures/rmt-form-controls-ux.rmt';
  const feedbackStatusUxContractPath = 'development/XTend-Feedback-und-Status-UX-Reife-Contract.md';
  const feedbackStatusUxFixturePath = 'tests/fixtures/rmt-feedback-status-ux.rmt';
  const navigationRoutingUxContractPath = 'development/XTend-Navigation-und-Routing-UX-Reife-Contract.md';
  const navigationRoutingUxFixturePath = 'tests/fixtures/rmt-navigation-routing-ux.rmt';
  const overlayInteractionUxContractPath = 'development/XTend-Overlay-und-Interaction-UX-Reife-Contract.md';
  const overlayInteractionUxFixturePath = 'tests/fixtures/rmt-overlay-interaction-ux.rmt';
  const shellModulePath = 'xtend-builder/typing/component-shell-contract.js';
  const stylingModulePath = 'xtend-builder/typing/component-styling-contract.js';
  const runtimeA11yModulePath = 'a11y/runtime-a11y-contract.js';
  const componentUxPerformanceModulePath = 'xtend-builder/performance/component-ux-performance-contract.js';
  const componentNetworkModulePath = 'xtend-builder/typing/component-network-contract.js';
  const rmtShellAuthoringModulePath = 'xtend-builder/typing/rmt-shell-authoring-contract.js';
  const formControlsUxModulePath = 'xtend-builder/typing/form-controls-ux-contract.js';
  const feedbackStatusUxModulePath = 'xtend-builder/typing/feedback-status-ux-contract.js';
  const navigationRoutingUxModulePath = 'xtend-builder/typing/navigation-routing-ux-contract.js';
  const overlayInteractionUxModulePath = 'xtend-builder/typing/overlay-interaction-ux-contract.js';
  const shellSuitePath = 'tests/components/component_shell_contract_suite.js';
  const stylingSuitePath = 'tests/components/component_styling_contract_suite.js';
  const runtimeA11ySuitePath = 'tests/a11y/runtime_a11y_contract_suite.js';
  const componentUxPerformanceSuitePath = 'tests/performance/component_ux_performance_contract_suite.js';
  const componentNetworkSuitePath = 'tests/components/component_network_contract_suite.js';
  const rmtShellAuthoringSuitePath = 'tests/rmt/rmt_shell_authoring_component_ux_suite.js';
  const formControlsUxSuitePath = 'tests/components/form_controls_ux_suite.js';
  const feedbackStatusUxSuitePath = 'tests/components/feedback_status_ux_suite.js';
  const navigationRoutingUxSuitePath = 'tests/components/navigation_routing_ux_suite.js';
  const overlayInteractionUxSuitePath = 'tests/components/overlay_interaction_ux_suite.js';
  const registry = readText(REFERENCE_REGISTRY_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const epic = readText(epicPath, rootDir);
  const backlog = readText(backlogPath, rootDir);
  const wp01 = readText(wp01Path, rootDir);
  const wp02 = readText(wp02Path, rootDir);
  const wp03 = readText(wp03Path, rootDir);
  const wp04 = readText(wp04Path, rootDir);
  const wp05 = readText(wp05Path, rootDir);
  const wp06 = readText(wp06Path, rootDir);
  const wp07 = readText(wp07Path, rootDir);
  const wp08 = readText(wp08Path, rootDir);
  const wp09 = readText(wp09Path, rootDir);
  const wp10 = readText(wp10Path, rootDir);
  const wp11 = readText(wp11Path, rootDir);
  const model = readText(modelPath, rootDir);
  const shellContract = readText(shellContractPath, rootDir);
  const stylingContract = readText(stylingContractPath, rootDir);
  const runtimeA11yContract = readText(runtimeA11yContractPath, rootDir);
  const componentUxPerformanceContract = readText(componentUxPerformanceContractPath, rootDir);
  const componentNetworkContract = readText(componentNetworkContractPath, rootDir);
  const rmtShellAuthoringContract = readText(rmtShellAuthoringContractPath, rootDir);
  const rmtShellAuthoringFixture = readJson(rmtShellAuthoringFixturePath, rootDir);
  const formControlsUxContract = readText(formControlsUxContractPath, rootDir);
  const formControlsUxFixture = readJson(formControlsUxFixturePath, rootDir);
  const feedbackStatusUxContract = readText(feedbackStatusUxContractPath, rootDir);
  const feedbackStatusUxFixture = readJson(feedbackStatusUxFixturePath, rootDir);
  const navigationRoutingUxContract = readText(navigationRoutingUxContractPath, rootDir);
  const navigationRoutingUxFixture = readJson(navigationRoutingUxFixturePath, rootDir);
  const overlayInteractionUxContract = readText(overlayInteractionUxContractPath, rootDir);
  const overlayInteractionUxFixture = readJson(overlayInteractionUxFixturePath, rootDir);
  const shellModuleSource = readText(shellModulePath, rootDir);
  const stylingModuleSource = readText(stylingModulePath, rootDir);
  const runtimeA11yModuleSource = readText(runtimeA11yModulePath, rootDir);
  const componentUxPerformanceModuleSource = readText(componentUxPerformanceModulePath, rootDir);
  const componentNetworkModuleSource = readText(componentNetworkModulePath, rootDir);
  const rmtShellAuthoringModuleSource = readText(rmtShellAuthoringModulePath, rootDir);
  const formControlsUxModuleSource = readText(formControlsUxModulePath, rootDir);
  const feedbackStatusUxModuleSource = readText(feedbackStatusUxModulePath, rootDir);
  const navigationRoutingUxModuleSource = readText(navigationRoutingUxModulePath, rootDir);
  const overlayInteractionUxModuleSource = readText(overlayInteractionUxModulePath, rootDir);
  const shellSuite = readText(shellSuitePath, rootDir);
  const stylingSuite = readText(stylingSuitePath, rootDir);
  const runtimeA11ySuite = readText(runtimeA11ySuitePath, rootDir);
  const componentUxPerformanceSuite = readText(componentUxPerformanceSuitePath, rootDir);
  const componentNetworkSuite = readText(componentNetworkSuitePath, rootDir);
  const rmtShellAuthoringSuite = readText(rmtShellAuthoringSuitePath, rootDir);
  const formControlsUxSuite = readText(formControlsUxSuitePath, rootDir);
  const feedbackStatusUxSuite = readText(feedbackStatusUxSuitePath, rootDir);
  const navigationRoutingUxSuite = readText(navigationRoutingUxSuitePath, rootDir);
  const overlayInteractionUxSuite = readText(overlayInteractionUxSuitePath, rootDir);
  const {
    COMPONENT_SHELL_CONTRACT_SCHEMA,
    COMPONENT_SHELL_REPORT_SCHEMA,
    RMT_SHELL_AUTHORING_SCHEMA,
    KERNEL_BOUNDARY,
    SHELL_REQUIRED_STATES,
    createComponentShellContract,
    validateComponentShellContract
  } = require('../../xtend-builder/typing/component-shell-contract');
  const {
    COMPONENT_STYLING_CONTRACT_SCHEMA,
    COMPONENT_STYLING_REPORT_SCHEMA,
    RMT_STYLE_AUTHORING_SCHEMA,
    STYLING_TOKEN_CATEGORIES,
    createComponentStylingContract,
    validateComponentStylingContract
  } = require('../../xtend-builder/typing/component-styling-contract');
  const {
    RUNTIME_A11Y_CONTRACT_SCHEMA,
    RUNTIME_A11Y_REPORT_SCHEMA,
    RMT_A11Y_AUTHORING_SCHEMA,
    RUNTIME_A11Y_REQUIRED_ASSERTIONS,
    RUNTIME_A11Y_REQUIRED_DOMAINS,
    createRuntimeA11yContract,
    validateRuntimeA11yContract
  } = require('../../a11y/runtime-a11y-contract');
  const {
    COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA,
    COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA,
    COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS,
    COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS,
    COMPONENT_UX_PERFORMANCE_PROFILES,
    RMT_PERFORMANCE_AUTHORING_SCHEMA,
    createComponentUxPerformanceContract,
    validateComponentUxPerformanceContract
  } = require('../../xtend-builder/performance/component-ux-performance-contract');
  const {
    COMPONENT_NETWORK_CONTRACT_SCHEMA,
    COMPONENT_NETWORK_REPORT_SCHEMA,
    COMPONENT_NETWORK_ASSERTIONS,
    COMPONENT_NETWORK_REQUIRED_DOMAINS,
    COMPONENT_NETWORK_REQUIRED_EVENTS,
    COMPONENT_NETWORK_PROFILES,
    RMT_NETWORK_AUTHORING_SCHEMA,
    KERNEL_BOUNDARY: COMPONENT_NETWORK_KERNEL_BOUNDARY,
    createComponentNetworkContract,
    validateComponentNetworkContract
  } = require('../../xtend-builder/typing/component-network-contract');
  const {
    RMT_SHELL_AUTHORING_REPORT_SCHEMA,
    RMT_SHELL_AUTHORING_ASSERTIONS,
    RMT_SHELL_AUTHORING_FIELDS,
    RMT_SHELL_AUTHORING_REQUIRED_DOMAINS,
    RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES,
    createRmtShellAuthoringContract,
    validateRmtShellAuthoringContract
  } = require('../../xtend-builder/typing/rmt-shell-authoring-contract');
  const {
    FORM_CONTROLS_UX_REPORT_SCHEMA,
    FORM_CONTROLS_UX_SCHEMA,
    FORM_CONTROL_REQUIRED_ASSERTIONS,
    FORM_CONTROL_REQUIRED_DOMAINS,
    FORM_CONTROL_TARGETS,
    createFormControlsUxContract,
    validateFormControlsUxContract
  } = require('../../xtend-builder/typing/form-controls-ux-contract');
  const {
    FEEDBACK_STATUS_REQUIRED_ASSERTIONS,
    FEEDBACK_STATUS_REQUIRED_DOMAINS,
    FEEDBACK_STATUS_TARGETS,
    FEEDBACK_STATUS_UX_REPORT_SCHEMA,
    FEEDBACK_STATUS_UX_SCHEMA,
    createFeedbackStatusUxContract,
    validateFeedbackStatusUxContract
  } = require('../../xtend-builder/typing/feedback-status-ux-contract');
  const {
    NAVIGATION_ROUTING_REQUIRED_ASSERTIONS,
    NAVIGATION_ROUTING_REQUIRED_DOMAINS,
    NAVIGATION_ROUTING_REQUIRED_EVENTS,
    NAVIGATION_ROUTING_REQUIRED_SCHEDULES,
    NAVIGATION_ROUTING_TARGETS,
    NAVIGATION_ROUTING_UX_REPORT_SCHEMA,
    NAVIGATION_ROUTING_UX_SCHEMA,
    KERNEL_BOUNDARY: NAVIGATION_ROUTING_KERNEL_BOUNDARY,
    createNavigationRoutingUxContract,
    validateNavigationRoutingUxContract
  } = require('../../xtend-builder/typing/navigation-routing-ux-contract');
  const {
    OVERLAY_INTERACTION_REQUIRED_ASSERTIONS,
    OVERLAY_INTERACTION_REQUIRED_DOMAINS,
    OVERLAY_INTERACTION_REQUIRED_EVENTS,
    OVERLAY_INTERACTION_REQUIRED_SCHEDULES,
    OVERLAY_INTERACTION_TARGETS,
    OVERLAY_INTERACTION_UX_REPORT_SCHEMA,
    OVERLAY_INTERACTION_UX_SCHEMA,
    KERNEL_BOUNDARY: OVERLAY_INTERACTION_KERNEL_BOUNDARY,
    createOverlayInteractionUxContract,
    validateOverlayInteractionUxContract
  } = require('../../xtend-builder/typing/overlay-interaction-ux-contract');
  const shellMetadata = packageManifest.xtend && packageManifest.xtend.componentShellContract;
  const stylingMetadata = packageManifest.xtend && packageManifest.xtend.componentStylingContract;
  const runtimeA11yMetadata = packageManifest.xtend && packageManifest.xtend.runtimeA11yContract;
  const componentUxPerformanceMetadata = packageManifest.xtend && packageManifest.xtend.componentUxPerformanceContract;
  const componentNetworkMetadata = packageManifest.xtend && packageManifest.xtend.componentNetworkContract;
  const rmtShellAuthoringMetadata = packageManifest.xtend && packageManifest.xtend.rmtShellAuthoringComponentUx;
  const formControlsUxMetadata = packageManifest.xtend && packageManifest.xtend.formControlsUxMaturity;
  const feedbackStatusUxMetadata = packageManifest.xtend && packageManifest.xtend.feedbackStatusUxMaturity;
  const navigationRoutingUxMetadata = packageManifest.xtend && packageManifest.xtend.navigationRoutingUxMaturity;
  const overlayInteractionUxMetadata = packageManifest.xtend && packageManifest.xtend.overlayInteractionUxMaturity;
  const sampleShell = createComponentShellContract({ tag: 'x-button' });
  const shellValidation = validateComponentShellContract(sampleShell);
  const sampleStyling = createComponentStylingContract({ tag: 'x-button' });
  const stylingValidation = validateComponentStylingContract(sampleStyling);
  const sampleRuntimeA11y = createRuntimeA11yContract({ tag: 'x-dialog', profiles: ['overlay'] });
  const runtimeA11yValidation = validateRuntimeA11yContract(sampleRuntimeA11y);
  const sampleComponentUxPerformance = createComponentUxPerformanceContract({ tag: 'x-dialog', profiles: ['overlay'] });
  const componentUxPerformanceValidation = validateComponentUxPerformanceContract(sampleComponentUxPerformance);
  const sampleComponentNetwork = createComponentNetworkContract({ tag: 'x-input', profiles: ['form-control'] });
  const componentNetworkValidation = validateComponentNetworkContract(sampleComponentNetwork);
  const sampleRmtShellAuthoring = createRmtShellAuthoringContract();
  const rmtShellAuthoringValidation = validateRmtShellAuthoringContract(sampleRmtShellAuthoring);
  const sampleFormControlsUx = createFormControlsUxContract();
  const formControlsUxValidation = validateFormControlsUxContract(sampleFormControlsUx);
  const sampleFeedbackStatusUx = createFeedbackStatusUxContract();
  const feedbackStatusUxValidation = validateFeedbackStatusUxContract(sampleFeedbackStatusUx);
  const sampleNavigationRoutingUx = createNavigationRoutingUxContract();
  const navigationRoutingUxValidation = validateNavigationRoutingUxContract(sampleNavigationRoutingUx);
  const sampleOverlayInteractionUx = createOverlayInteractionUxContract();
  const overlayInteractionUxValidation = validateOverlayInteractionUxContract(sampleOverlayInteractionUx);

  assertFileExists(context, epicPath, rootDir, 'Epic 11 document exists');
  assertFileExists(context, backlogPath, rootDir, 'Epic 11 backlog exists');
  assertFileExists(context, wp01Path, rootDir, 'WP-E11-01 workpackage exists');
  assertFileExists(context, wp02Path, rootDir, 'WP-E11-02 workpackage exists');
  assertFileExists(context, wp03Path, rootDir, 'WP-E11-03 workpackage exists');
  assertFileExists(context, wp04Path, rootDir, 'WP-E11-04 workpackage exists');
  assertFileExists(context, wp05Path, rootDir, 'WP-E11-05 workpackage exists');
  assertFileExists(context, wp06Path, rootDir, 'WP-E11-06 workpackage exists');
  assertFileExists(context, wp07Path, rootDir, 'WP-E11-07 workpackage exists');
  assertFileExists(context, wp08Path, rootDir, 'WP-E11-08 workpackage exists');
  assertFileExists(context, wp09Path, rootDir, 'WP-E11-09 workpackage exists');
  assertFileExists(context, wp10Path, rootDir, 'WP-E11-10 workpackage exists');
  assertFileExists(context, wp11Path, rootDir, 'WP-E11-11 workpackage exists');
  assertFileExists(context, modelPath, rootDir, 'Component UX maturity model exists');
  assertFileExists(context, shellContractPath, rootDir, 'Component Shell Contract exists');
  assertFileExists(context, stylingContractPath, rootDir, 'Component Styling Contract exists');
  assertFileExists(context, runtimeA11yContractPath, rootDir, 'Runtime A11y UX Contract exists');
  assertFileExists(context, componentUxPerformanceContractPath, rootDir, 'Component UX Performance Contract exists');
  assertFileExists(context, componentNetworkContractPath, rootDir, 'Component Network Contract exists');
  assertFileExists(context, rmtShellAuthoringContractPath, rootDir, 'RMT Shell Authoring Contract exists');
  assertFileExists(context, rmtShellAuthoringFixturePath, rootDir, 'RMT Shell Authoring fixture exists');
  assertFileExists(context, formControlsUxContractPath, rootDir, 'Form Controls UX Contract exists');
  assertFileExists(context, formControlsUxFixturePath, rootDir, 'Form Controls UX fixture exists');
  assertFileExists(context, feedbackStatusUxContractPath, rootDir, 'Feedback Status UX Contract exists');
  assertFileExists(context, feedbackStatusUxFixturePath, rootDir, 'Feedback Status UX fixture exists');
  assertFileExists(context, navigationRoutingUxContractPath, rootDir, 'Navigation Routing UX Contract exists');
  assertFileExists(context, navigationRoutingUxFixturePath, rootDir, 'Navigation Routing UX fixture exists');
  assertFileExists(context, overlayInteractionUxContractPath, rootDir, 'Overlay Interaction UX Contract exists');
  assertFileExists(context, overlayInteractionUxFixturePath, rootDir, 'Overlay Interaction UX fixture exists');
  assertFileExists(context, shellModulePath, rootDir, 'Component Shell Contract module exists');
  assertFileExists(context, stylingModulePath, rootDir, 'Component Styling Contract module exists');
  assertFileExists(context, runtimeA11yModulePath, rootDir, 'Runtime A11y Contract module exists');
  assertFileExists(context, componentUxPerformanceModulePath, rootDir, 'Component UX Performance Contract module exists');
  assertFileExists(context, componentNetworkModulePath, rootDir, 'Component Network Contract module exists');
  assertFileExists(context, rmtShellAuthoringModulePath, rootDir, 'RMT Shell Authoring module exists');
  assertFileExists(context, formControlsUxModulePath, rootDir, 'Form Controls UX module exists');
  assertFileExists(context, feedbackStatusUxModulePath, rootDir, 'Feedback Status UX module exists');
  assertFileExists(context, navigationRoutingUxModulePath, rootDir, 'Navigation Routing UX module exists');
  assertFileExists(context, overlayInteractionUxModulePath, rootDir, 'Overlay Interaction UX module exists');
  assertFileExists(context, shellSuitePath, rootDir, 'Component Shell Contract suite exists');
  assertFileExists(context, stylingSuitePath, rootDir, 'Component Styling Contract suite exists');
  assertFileExists(context, runtimeA11ySuitePath, rootDir, 'Runtime A11y Contract suite exists');
  assertFileExists(context, componentUxPerformanceSuitePath, rootDir, 'Component UX Performance Contract suite exists');
  assertFileExists(context, componentNetworkSuitePath, rootDir, 'Component Network Contract suite exists');
  assertFileExists(context, rmtShellAuthoringSuitePath, rootDir, 'RMT Shell Authoring suite exists');
  assertFileExists(context, formControlsUxSuitePath, rootDir, 'Form Controls UX suite exists');
  assertFileExists(context, feedbackStatusUxSuitePath, rootDir, 'Feedback Status UX suite exists');
  assertFileExists(context, navigationRoutingUxSuitePath, rootDir, 'Navigation Routing UX suite exists');
  assertFileExists(context, overlayInteractionUxSuitePath, rootDir, 'Overlay Interaction UX suite exists');
  context.assertIncludes(registry, epicPath, 'Reference registry links Epic 11 document');
  context.assertIncludes(registry, backlogPath, 'Reference registry links Epic 11 backlog');
  context.assertIncludes(registry, wp01Path, 'Reference registry links WP-E11-01');
  context.assertIncludes(registry, wp02Path, 'Reference registry links WP-E11-02');
  context.assertIncludes(registry, wp03Path, 'Reference registry links WP-E11-03');
  context.assertIncludes(registry, wp04Path, 'Reference registry links WP-E11-04');
  context.assertIncludes(registry, wp05Path, 'Reference registry links WP-E11-05');
  context.assertIncludes(registry, wp06Path, 'Reference registry links WP-E11-06');
  context.assertIncludes(registry, wp07Path, 'Reference registry links WP-E11-07');
  context.assertIncludes(registry, wp08Path, 'Reference registry links WP-E11-08');
  context.assertIncludes(registry, wp09Path, 'Reference registry links WP-E11-09');
  context.assertIncludes(registry, wp10Path, 'Reference registry links WP-E11-10');
  context.assertIncludes(registry, wp11Path, 'Reference registry links WP-E11-11');
  context.assertIncludes(registry, modelPath, 'Reference registry links Component UX maturity model');
  context.assertIncludes(registry, shellContractPath, 'Reference registry links Component Shell Contract');
  context.assertIncludes(registry, stylingContractPath, 'Reference registry links Component Styling Contract');
  context.assertIncludes(registry, runtimeA11yContractPath, 'Reference registry links Runtime A11y UX Contract');
  context.assertIncludes(registry, componentUxPerformanceContractPath, 'Reference registry links Component UX Performance Contract');
  context.assertIncludes(registry, componentNetworkContractPath, 'Reference registry links Component Network Contract');
  context.assertIncludes(registry, rmtShellAuthoringContractPath, 'Reference registry links RMT Shell Authoring Contract');
  context.assertIncludes(registry, rmtShellAuthoringFixturePath, 'Reference registry links RMT Shell Authoring fixture');
  context.assertIncludes(registry, formControlsUxContractPath, 'Reference registry links Form Controls UX Contract');
  context.assertIncludes(registry, formControlsUxFixturePath, 'Reference registry links Form Controls UX fixture');
  context.assertIncludes(registry, feedbackStatusUxContractPath, 'Reference registry links Feedback Status UX Contract');
  context.assertIncludes(registry, feedbackStatusUxFixturePath, 'Reference registry links Feedback Status UX fixture');
  context.assertIncludes(registry, navigationRoutingUxContractPath, 'Reference registry links Navigation Routing UX Contract');
  context.assertIncludes(registry, navigationRoutingUxFixturePath, 'Reference registry links Navigation Routing UX fixture');
  context.assertIncludes(registry, overlayInteractionUxContractPath, 'Reference registry links Overlay Interaction UX Contract');
  context.assertIncludes(registry, overlayInteractionUxFixturePath, 'Reference registry links Overlay Interaction UX fixture');
  context.assertIncludes(registry, shellModulePath, 'Reference registry links Component Shell Contract module');
  context.assertIncludes(registry, stylingModulePath, 'Reference registry links Component Styling Contract module');
  context.assertIncludes(registry, runtimeA11yModulePath, 'Reference registry links Runtime A11y Contract module');
  context.assertIncludes(registry, componentUxPerformanceModulePath, 'Reference registry links Component UX Performance Contract module');
  context.assertIncludes(registry, componentNetworkModulePath, 'Reference registry links Component Network Contract module');
  context.assertIncludes(registry, rmtShellAuthoringModulePath, 'Reference registry links RMT Shell Authoring module');
  context.assertIncludes(registry, formControlsUxModulePath, 'Reference registry links Form Controls UX module');
  context.assertIncludes(registry, feedbackStatusUxModulePath, 'Reference registry links Feedback Status UX module');
  context.assertIncludes(registry, navigationRoutingUxModulePath, 'Reference registry links Navigation Routing UX module');
  context.assertIncludes(registry, overlayInteractionUxModulePath, 'Reference registry links Overlay Interaction UX module');
  context.assertIncludes(registry, shellSuitePath, 'Reference registry links Component Shell Contract suite');
  context.assertIncludes(registry, stylingSuitePath, 'Reference registry links Component Styling Contract suite');
  context.assertIncludes(registry, runtimeA11ySuitePath, 'Reference registry links Runtime A11y Contract suite');
  context.assertIncludes(registry, componentUxPerformanceSuitePath, 'Reference registry links Component UX Performance Contract suite');
  context.assertIncludes(registry, componentNetworkSuitePath, 'Reference registry links Component Network Contract suite');
  context.assertIncludes(registry, rmtShellAuthoringSuitePath, 'Reference registry links RMT Shell Authoring suite');
  context.assertIncludes(registry, formControlsUxSuitePath, 'Reference registry links Form Controls UX suite');
  context.assertIncludes(registry, feedbackStatusUxSuitePath, 'Reference registry links Feedback Status UX suite');
  context.assertIncludes(registry, navigationRoutingUxSuitePath, 'Reference registry links Navigation Routing UX suite');
  context.assertIncludes(registry, overlayInteractionUxSuitePath, 'Reference registry links Overlay Interaction UX suite');
  context.assertIncludes(epic, 'xtend.epic11.component-ux-shell-styling-a11y-compatibility.v1', 'Epic 11 declares stable schema');
  context.assertIncludes(epic, '- Status: Completed', 'Epic 11 is completed');
  context.assertIncludes(epic, '| `WP-E11-01` | P0 | completed |', 'Epic 11 marks WP-E11-01 completed');
  context.assertIncludes(epic, '| `WP-E11-02` | P0 | completed |', 'Epic 11 marks WP-E11-02 completed');
  context.assertIncludes(epic, '| `WP-E11-03` | P0 | completed |', 'Epic 11 marks WP-E11-03 completed');
  context.assertIncludes(epic, '| `WP-E11-04` | P0 | completed |', 'Epic 11 marks WP-E11-04 completed');
  context.assertIncludes(epic, '| `WP-E11-05` | P0 | completed |', 'Epic 11 marks WP-E11-05 completed');
  context.assertIncludes(epic, '| `WP-E11-06` | P0 | completed |', 'Epic 11 marks WP-E11-06 completed');
  context.assertIncludes(epic, '| `WP-E11-07` | P0 | completed |', 'Epic 11 marks WP-E11-07 completed');
  context.assertIncludes(epic, '| `WP-E11-08` | P1 | completed |', 'Epic 11 marks WP-E11-08 completed');
  context.assertIncludes(epic, '| `WP-E11-09` | P1 | completed |', 'Epic 11 marks WP-E11-09 completed');
  context.assertIncludes(epic, '| `WP-E11-10` | P1 | completed |', 'Epic 11 marks WP-E11-10 completed');
  context.assertIncludes(epic, '| `WP-E11-11` | P1 | completed |', 'Epic 11 marks WP-E11-11 completed');
  context.assertIncludes(epic, '| `WP-E11-12` | P1 | completed |', 'Epic 11 marks WP-E11-12 completed');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic 11 marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic 11 marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic 11 marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic 11 marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic 11 marks WP-E11-17 completed');
  context.assertIncludes(epic, '| `WP-E11-18` | P2 | completed |', 'Epic 11 marks WP-E11-18 completed');
  context.assertIncludes(epic, 'xtend.epic11.enterprise-ux-handoff.v1', 'Epic 11 records Enterprise UX Handoff schema');
  context.assertIncludes(epic, 'completed-with-accepted-long-tail-handoff', 'Epic 11 records Handoff completion mode');
  context.assertIncludes(epic, 'xtend.component.ux-maturity-model.v1', 'Epic 11 records UX maturity model');
  context.assertIncludes(epic, COMPONENT_SHELL_CONTRACT_SCHEMA, 'Epic 11 records Component Shell Contract schema');
  context.assertIncludes(epic, COMPONENT_STYLING_CONTRACT_SCHEMA, 'Epic 11 records Component Styling Contract schema');
  context.assertIncludes(epic, RUNTIME_A11Y_CONTRACT_SCHEMA, 'Epic 11 records Runtime A11y Contract schema');
  context.assertIncludes(epic, COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Epic 11 records Component UX Performance Contract schema');
  context.assertIncludes(epic, COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Epic 11 records Component Network Contract schema');
  context.assertIncludes(epic, RMT_SHELL_AUTHORING_SCHEMA, 'Epic 11 records RMT Shell Authoring schema');
  context.assertIncludes(epic, FORM_CONTROLS_UX_SCHEMA, 'Epic 11 records Form Controls UX schema');
  context.assertIncludes(epic, FEEDBACK_STATUS_UX_SCHEMA, 'Epic 11 records Feedback Status UX schema');
  context.assertIncludes(epic, NAVIGATION_ROUTING_UX_SCHEMA, 'Epic 11 records Navigation Routing UX schema');
  context.assertIncludes(epic, OVERLAY_INTERACTION_UX_SCHEMA, 'Epic 11 records Overlay Interaction UX schema');
  context.assertIncludes(epic, 'component-shell-contract', 'Epic 11 records Component Shell Contract gate');
  context.assertIncludes(epic, 'component-styling-contract', 'Epic 11 records Component Styling Contract gate');
  context.assertIncludes(epic, 'runtime-a11y-contract', 'Epic 11 records Runtime A11y Contract gate');
  context.assertIncludes(epic, 'component-ux-performance', 'Epic 11 records Component UX Performance Contract gate');
  context.assertIncludes(epic, 'component-network-contract', 'Epic 11 records Component Network Contract gate');
  context.assertIncludes(epic, 'rmt-shell-authoring-ux', 'Epic 11 records RMT Shell Authoring gate');
  context.assertIncludes(epic, 'form-controls-ux', 'Epic 11 records Form Controls UX gate');
  context.assertIncludes(epic, 'feedback-status-ux', 'Epic 11 records Feedback Status UX gate');
  context.assertIncludes(epic, 'navigation-routing-ux', 'Epic 11 records Navigation Routing UX gate');
  context.assertIncludes(epic, 'overlay-interaction-ux', 'Epic 11 records Overlay Interaction UX gate');
  context.assertIncludes(epic, 'Component Shell Contract', 'Epic 11 records Component Shell foundation');
  context.assertIncludes(epic, 'Styling', 'Epic 11 records Component Styling foundation');
  context.assertIncludes(epic, 'RMT Shell Authoring', 'Epic 11 records RMT Shell Authoring foundation');
  context.assertIncludes(backlog, 'xtend.epic11.backlog.v1', 'Epic 11 backlog declares stable schema');
  context.assertIncludes(backlog, '- Status: Completed', 'Epic 11 backlog is completed');
  context.assertIncludes(backlog, '| `WP-E11-01` | P0 | completed | WS0 |', 'Epic 11 backlog marks WP-E11-01 completed');
  context.assertIncludes(backlog, '| `WP-E11-02` | P0 | completed | WS1 |', 'Epic 11 backlog marks WP-E11-02 completed');
  context.assertIncludes(backlog, '| `WP-E11-03` | P0 | completed | WS1 |', 'Epic 11 backlog marks WP-E11-03 completed');
  context.assertIncludes(backlog, '| `WP-E11-04` | P0 | completed | WS2 |', 'Epic 11 backlog marks WP-E11-04 completed');
  context.assertIncludes(backlog, '| `WP-E11-05` | P0 | completed | WS3 |', 'Epic 11 backlog marks WP-E11-05 completed');
  context.assertIncludes(backlog, '| `WP-E11-06` | P0 | completed | WS4 |', 'Epic 11 backlog marks WP-E11-06 completed');
  context.assertIncludes(backlog, '| `WP-E11-07` | P0 | completed | WS5 |', 'Epic 11 backlog marks WP-E11-07 completed');
  context.assertIncludes(backlog, '| `WP-E11-08` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-08 completed');
  context.assertIncludes(backlog, '| `WP-E11-09` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-09 completed');
  context.assertIncludes(backlog, '| `WP-E11-10` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-10 completed');
  context.assertIncludes(backlog, '| `WP-E11-11` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-11 completed');
  context.assertIncludes(backlog, '| `WP-E11-12` | P1 | completed | WS6 |', 'Epic 11 backlog marks WP-E11-12 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed | WS7 |', 'Epic 11 backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed | WS8 |', 'Epic 11 backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed | WS8 |', 'Epic 11 backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed | WS9 |', 'Epic 11 backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed | WS10 |', 'Epic 11 backlog marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-18` | P2 | completed | WS11 |', 'Epic 11 backlog marks WP-E11-18 completed');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-02', 'Epic 11 backlog documents WP-E11-02 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-03', 'Epic 11 backlog documents WP-E11-03 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-04', 'Epic 11 backlog documents WP-E11-04 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-05', 'Epic 11 backlog documents WP-E11-05 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-06', 'Epic 11 backlog documents WP-E11-06 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-07', 'Epic 11 backlog documents WP-E11-07 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-08', 'Epic 11 backlog documents WP-E11-08 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-09', 'Epic 11 backlog documents WP-E11-09 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-10', 'Epic 11 backlog documents WP-E11-10 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-12', 'Epic 11 backlog documents WP-E11-12 handoff');
  context.assertIncludes(backlog, 'Handoff nach WP-E11-18', 'Epic 11 backlog documents WP-E11-18 handoff');
  context.assertIncludes(wp01, 'xtend.epic11.wp01.backlog-and-ux-maturity.v1', 'WP-E11-01 declares stable schema');
  context.assertIncludes(wp01, 'Status: `completed`', 'WP-E11-01 is completed');
  context.assertIncludes(wp01, 'xtend.component.ux-maturity-model.v1', 'WP-E11-01 accepts UX maturity model');
  context.assertIncludes(wp01, '`WP-E11-02` bis `WP-E11-06`', 'WP-E11-01 documents startable foundation packages');
  context.assertIncludes(wp02, 'xtend.epic11.wp02.component-shell-contract.v1', 'WP-E11-02 declares stable schema');
  context.assertIncludes(wp02, 'Status: `completed`', 'WP-E11-02 is completed');
  context.assertIncludes(wp02, COMPONENT_SHELL_CONTRACT_SCHEMA, 'WP-E11-02 accepts Component Shell Contract');
  context.assertIncludes(wp02, 'node scripts/run_xtend_tests.js component-shell-contract --json', 'WP-E11-02 documents Component Shell Contract gate');
  context.assertIncludes(wp03, 'xtend.epic11.wp03.component-styling-contract.v1', 'WP-E11-03 declares stable schema');
  context.assertIncludes(wp03, 'Status: `completed`', 'WP-E11-03 is completed');
  context.assertIncludes(wp03, COMPONENT_STYLING_CONTRACT_SCHEMA, 'WP-E11-03 accepts Component Styling Contract');
  context.assertIncludes(wp03, 'node scripts/run_xtend_tests.js component-styling-contract --json', 'WP-E11-03 documents Component Styling Contract gate');
  context.assertIncludes(wp04, 'xtend.epic11.wp04.runtime-a11y-contract.v1', 'WP-E11-04 declares stable schema');
  context.assertIncludes(wp04, 'Status: `completed`', 'WP-E11-04 is completed');
  context.assertIncludes(wp04, RUNTIME_A11Y_CONTRACT_SCHEMA, 'WP-E11-04 accepts Runtime A11y Contract');
  context.assertIncludes(wp04, 'node scripts/run_xtend_tests.js runtime-a11y-contract --json', 'WP-E11-04 documents Runtime A11y Contract gate');
  context.assertIncludes(wp05, 'xtend.epic11.wp05.component-ux-performance-contract.v1', 'WP-E11-05 declares stable schema');
  context.assertIncludes(wp05, 'Status: `completed`', 'WP-E11-05 is completed');
  context.assertIncludes(wp05, COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'WP-E11-05 accepts Component UX Performance Contract');
  context.assertIncludes(wp05, 'node scripts/run_xtend_tests.js component-ux-performance --json', 'WP-E11-05 documents Component UX Performance Contract gate');
  context.assertIncludes(wp06, 'xtend.epic11.wp06.component-network-contract.v1', 'WP-E11-06 declares stable schema');
  context.assertIncludes(wp06, 'Status: `completed`', 'WP-E11-06 is completed');
  context.assertIncludes(wp06, COMPONENT_NETWORK_CONTRACT_SCHEMA, 'WP-E11-06 accepts Component Network Contract');
  context.assertIncludes(wp06, 'node scripts/run_xtend_tests.js component-network-contract --json', 'WP-E11-06 documents Component Network Contract gate');
  context.assertIncludes(wp07, 'xtend.epic11.wp07.rmt-shell-authoring-component-ux.v1', 'WP-E11-07 declares stable schema');
  context.assertIncludes(wp07, 'Status: `completed`', 'WP-E11-07 is completed');
  context.assertIncludes(wp07, RMT_SHELL_AUTHORING_SCHEMA, 'WP-E11-07 accepts RMT Shell Authoring Contract');
  context.assertIncludes(wp07, 'node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json', 'WP-E11-07 documents RMT Shell Authoring gate');
  context.assertIncludes(wp08, 'xtend.epic11.wp08.form-controls-ux.v1', 'WP-E11-08 declares stable schema');
  context.assertIncludes(wp08, 'Status: `completed`', 'WP-E11-08 is completed');
  context.assertIncludes(wp08, FORM_CONTROLS_UX_SCHEMA, 'WP-E11-08 accepts Form Controls UX Contract');
  context.assertIncludes(wp08, 'node scripts/run_xtend_tests.js form-controls-ux --json', 'WP-E11-08 documents Form Controls UX gate');
  context.assertIncludes(wp09, 'xtend.epic11.wp09.feedback-status-ux.v1', 'WP-E11-09 declares stable schema');
  context.assertIncludes(wp09, 'Status: `completed`', 'WP-E11-09 is completed');
  context.assertIncludes(wp09, FEEDBACK_STATUS_UX_SCHEMA, 'WP-E11-09 accepts Feedback Status UX Contract');
  context.assertIncludes(wp09, 'node scripts/run_xtend_tests.js feedback-status-ux --json', 'WP-E11-09 documents Feedback Status UX gate');
  context.assertIncludes(wp10, 'xtend.epic11.wp10.navigation-routing-ux.v1', 'WP-E11-10 declares stable schema');
  context.assertIncludes(wp10, 'Status: `completed`', 'WP-E11-10 is completed');
  context.assertIncludes(wp10, NAVIGATION_ROUTING_UX_SCHEMA, 'WP-E11-10 accepts Navigation Routing UX Contract');
  context.assertIncludes(wp10, 'node scripts/run_xtend_tests.js navigation-routing-ux --json', 'WP-E11-10 documents Navigation Routing UX gate');
  context.assertIncludes(wp11, 'xtend.epic11.wp11.overlay-interaction-ux.v1', 'WP-E11-11 declares stable schema');
  context.assertIncludes(wp11, 'Status: `completed`', 'WP-E11-11 is completed');
  context.assertIncludes(wp11, OVERLAY_INTERACTION_UX_SCHEMA, 'WP-E11-11 accepts Overlay Interaction UX Contract');
  context.assertIncludes(wp11, 'node scripts/run_xtend_tests.js overlay-interaction-ux --json', 'WP-E11-11 documents Overlay Interaction UX gate');
  context.assertIncludes(model, 'xtend.component.ux-maturity-model.v1', 'Component UX maturity model declares stable schema');
  context.assertIncludes(model, 'Status: Accepted', 'Component UX maturity model is accepted');
  context.assertIncludes(model, '`ux-ready`', 'Component UX maturity model defines ux-ready');
  context.assertIncludes(model, '`ux-stable`', 'Component UX maturity model defines ux-stable');
  context.assertIncludes(model, '`ux-core`', 'Component UX maturity model defines ux-core');
  context.assertIncludes(model, 'Component Shell Contract', 'Component UX maturity model covers Shell');
  context.assertIncludes(model, 'Runtime-A11y', 'Component UX maturity model covers Runtime-A11y');
  context.assertIncludes(model, 'Component Network', 'Component UX maturity model covers Component Network');
  context.assertIncludes(shellContract, COMPONENT_SHELL_CONTRACT_SCHEMA, 'Component Shell Contract declares stable schema');
  context.assertIncludes(shellContract, COMPONENT_SHELL_REPORT_SCHEMA, 'Component Shell Contract declares report schema');
  context.assertIncludes(shellContract, 'XtendComponentShellContract', 'Component Shell Contract declares TypeScript interface');
  context.assertIncludes(shellContract, RMT_SHELL_AUTHORING_SCHEMA, 'Component Shell Contract prepares RMT Shell Authoring schema');
  context.assertIncludes(shellContract, KERNEL_BOUNDARY, 'Component Shell Contract keeps RMT kernel boundary visible');
  context.assertIncludes(shellContract, '`empty`, `loading`, `ready`, `error`, `disabled`, `busy`, `invalid`', 'Component Shell Contract lists required states');
  context.assertIncludes(shellModuleSource, COMPONENT_SHELL_CONTRACT_SCHEMA, 'Component Shell module declares stable schema');
  context.assertIncludes(shellModuleSource, 'createComponentShellContract', 'Component Shell module exports factory');
  context.assertIncludes(shellModuleSource, 'validateComponentShellContract', 'Component Shell module exports validator');
  context.assertIncludes(shellSuite, 'runComponentShellContractSuite', 'Component Shell suite exposes runner function');
  context.assertIncludes(stylingContract, COMPONENT_STYLING_CONTRACT_SCHEMA, 'Component Styling Contract declares stable schema');
  context.assertIncludes(stylingContract, COMPONENT_STYLING_REPORT_SCHEMA, 'Component Styling Contract declares report schema');
  context.assertIncludes(stylingContract, 'XtendComponentStylingContract', 'Component Styling Contract declares TypeScript interface');
  context.assertIncludes(stylingContract, RMT_STYLE_AUTHORING_SCHEMA, 'Component Styling Contract prepares RMT Style Authoring schema');
  context.assertIncludes(stylingContract, KERNEL_BOUNDARY, 'Component Styling Contract keeps RMT kernel boundary visible');
  context.assertIncludes(stylingContract, '`comfortable`, `compact`, `dense`', 'Component Styling Contract lists density profiles');
  context.assertIncludes(stylingModuleSource, COMPONENT_STYLING_CONTRACT_SCHEMA, 'Component Styling module declares stable schema');
  context.assertIncludes(stylingModuleSource, 'createComponentStylingContract', 'Component Styling module exports factory');
  context.assertIncludes(stylingModuleSource, 'validateComponentStylingContract', 'Component Styling module exports validator');
  context.assertIncludes(stylingSuite, 'runComponentStylingContractSuite', 'Component Styling suite exposes runner function');
  context.assertIncludes(runtimeA11yContract, RUNTIME_A11Y_CONTRACT_SCHEMA, 'Runtime A11y Contract declares stable schema');
  context.assertIncludes(runtimeA11yContract, RUNTIME_A11Y_REPORT_SCHEMA, 'Runtime A11y Contract declares report schema');
  context.assertIncludes(runtimeA11yContract, 'XtendRuntimeA11yContract', 'Runtime A11y Contract declares TypeScript interface');
  context.assertIncludes(runtimeA11yContract, RMT_A11Y_AUTHORING_SCHEMA, 'Runtime A11y Contract prepares RMT A11y Authoring schema');
  context.assertIncludes(runtimeA11yContract, KERNEL_BOUNDARY, 'Runtime A11y Contract keeps RMT kernel boundary visible');
  context.assertIncludes(runtimeA11yContract, '`keyboard-path`, `focus-visible`, `screenreader-signal`', 'Runtime A11y Contract lists browser assertions');
  context.assertIncludes(runtimeA11yModuleSource, RUNTIME_A11Y_CONTRACT_SCHEMA, 'Runtime A11y module declares stable schema');
  context.assertIncludes(runtimeA11yModuleSource, 'createRuntimeA11yContract', 'Runtime A11y module exports factory');
  context.assertIncludes(runtimeA11yModuleSource, 'validateRuntimeA11yContract', 'Runtime A11y module exports validator');
  context.assertIncludes(runtimeA11ySuite, 'runRuntimeA11yContractSuite', 'Runtime A11y suite exposes runner function');
  context.assertIncludes(componentUxPerformanceContract, COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Component UX Performance Contract declares stable schema');
  context.assertIncludes(componentUxPerformanceContract, COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA, 'Component UX Performance Contract declares report schema');
  context.assertIncludes(componentUxPerformanceContract, 'XtendComponentUxPerformanceContract', 'Component UX Performance Contract declares TypeScript interface');
  context.assertIncludes(componentUxPerformanceContract, RMT_PERFORMANCE_AUTHORING_SCHEMA, 'Component UX Performance Contract prepares RMT Performance Authoring schema');
  context.assertIncludes(componentUxPerformanceContract, KERNEL_BOUNDARY, 'Component UX Performance Contract keeps RMT kernel boundary visible');
  context.assertIncludes(componentUxPerformanceContract, '`budget-class-derived`', 'Component UX Performance Contract lists budget assertion');
  context.assertIncludes(componentUxPerformanceModuleSource, COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Component UX Performance module declares stable schema');
  context.assertIncludes(componentUxPerformanceModuleSource, 'createComponentUxPerformanceContract', 'Component UX Performance module exports factory');
  context.assertIncludes(componentUxPerformanceModuleSource, 'validateComponentUxPerformanceContract', 'Component UX Performance module exports validator');
  context.assertIncludes(componentUxPerformanceSuite, 'runComponentUxPerformanceContractSuite', 'Component UX Performance suite exposes runner function');
  context.assertIncludes(componentNetworkContract, COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Component Network Contract declares stable schema');
  context.assertIncludes(componentNetworkContract, COMPONENT_NETWORK_REPORT_SCHEMA, 'Component Network Contract declares report schema');
  context.assertIncludes(componentNetworkContract, 'XtendComponentNetworkContract', 'Component Network Contract declares TypeScript interface');
  context.assertIncludes(componentNetworkContract, RMT_NETWORK_AUTHORING_SCHEMA, 'Component Network Contract prepares RMT Network Authoring schema');
  context.assertIncludes(componentNetworkContract, COMPONENT_NETWORK_KERNEL_BOUNDARY, 'Component Network Contract keeps RMT kernel boundary visible');
  context.assertIncludes(componentNetworkContract, '`events-composed-bubbling`', 'Component Network Contract lists event propagation assertion');
  context.assertIncludes(componentNetworkModuleSource, COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Component Network module declares stable schema');
  context.assertIncludes(componentNetworkModuleSource, 'createComponentNetworkContract', 'Component Network module exports factory');
  context.assertIncludes(componentNetworkModuleSource, 'validateComponentNetworkContract', 'Component Network module exports validator');
  context.assertIncludes(componentNetworkSuite, 'runComponentNetworkContractSuite', 'Component Network suite exposes runner function');
  context.assertIncludes(rmtShellAuthoringContract, RMT_SHELL_AUTHORING_SCHEMA, 'RMT Shell Authoring Contract declares stable schema');
  context.assertIncludes(rmtShellAuthoringContract, RMT_SHELL_AUTHORING_REPORT_SCHEMA, 'RMT Shell Authoring Contract declares report schema');
  context.assertIncludes(rmtShellAuthoringContract, 'XtendRmtShellAuthoringContract', 'RMT Shell Authoring Contract declares TypeScript interface');
  context.assertIncludes(rmtShellAuthoringContract, KERNEL_BOUNDARY, 'RMT Shell Authoring Contract keeps RMT kernel boundary visible');
  context.assertIncludes(rmtShellAuthoringContract, '`shell-first-authoring`', 'RMT Shell Authoring Contract lists shell-first assertion');
  context.assert(rmtShellAuthoringFixture.manifest.metadata.contractVersion === RMT_SHELL_AUTHORING_SCHEMA, 'RMT Shell Authoring fixture declares schema');
  context.assertIncludes(rmtShellAuthoringModuleSource, RMT_SHELL_AUTHORING_SCHEMA, 'RMT Shell Authoring module declares stable schema');
  context.assertIncludes(rmtShellAuthoringModuleSource, 'createRmtShellAuthoringContract', 'RMT Shell Authoring module exports factory');
  context.assertIncludes(rmtShellAuthoringModuleSource, 'validateRmtShellAuthoringContract', 'RMT Shell Authoring module exports validator');
  context.assertIncludes(rmtShellAuthoringSuite, 'runRmtShellAuthoringComponentUxSuite', 'RMT Shell Authoring suite exposes runner function');
  context.assertIncludes(formControlsUxContract, FORM_CONTROLS_UX_SCHEMA, 'Form Controls UX Contract declares stable schema');
  context.assertIncludes(formControlsUxContract, FORM_CONTROLS_UX_REPORT_SCHEMA, 'Form Controls UX Contract declares report schema');
  context.assertIncludes(formControlsUxContract, 'xtendFormControlUxProfile', 'Form Controls UX Contract documents runtime profile');
  context.assert(formControlsUxFixture.manifest.metadata.contractVersion === FORM_CONTROLS_UX_SCHEMA, 'Form Controls UX fixture declares schema');
  context.assertIncludes(formControlsUxModuleSource, FORM_CONTROLS_UX_SCHEMA, 'Form Controls UX module declares stable schema');
  context.assertIncludes(formControlsUxModuleSource, 'createFormControlsUxContract', 'Form Controls UX module exports factory');
  context.assertIncludes(formControlsUxModuleSource, 'validateFormControlsUxContract', 'Form Controls UX module exports validator');
  context.assertIncludes(formControlsUxSuite, 'runFormControlsUxSuite', 'Form Controls UX suite exposes runner function');
  context.assertIncludes(feedbackStatusUxContract, FEEDBACK_STATUS_UX_SCHEMA, 'Feedback Status UX Contract declares stable schema');
  context.assertIncludes(feedbackStatusUxContract, FEEDBACK_STATUS_UX_REPORT_SCHEMA, 'Feedback Status UX Contract declares report schema');
  context.assertIncludes(feedbackStatusUxContract, 'xtendFeedbackStatusUxProfile', 'Feedback Status UX Contract documents runtime profile');
  context.assert(feedbackStatusUxFixture.manifest.metadata.contractVersion === FEEDBACK_STATUS_UX_SCHEMA, 'Feedback Status UX fixture declares schema');
  context.assertIncludes(feedbackStatusUxModuleSource, FEEDBACK_STATUS_UX_SCHEMA, 'Feedback Status UX module declares stable schema');
  context.assertIncludes(feedbackStatusUxModuleSource, 'createFeedbackStatusUxContract', 'Feedback Status UX module exports factory');
  context.assertIncludes(feedbackStatusUxModuleSource, 'validateFeedbackStatusUxContract', 'Feedback Status UX module exports validator');
  context.assertIncludes(feedbackStatusUxSuite, 'runFeedbackStatusUxSuite', 'Feedback Status UX suite exposes runner function');
  context.assertIncludes(navigationRoutingUxContract, NAVIGATION_ROUTING_UX_SCHEMA, 'Navigation Routing UX Contract declares stable schema');
  context.assertIncludes(navigationRoutingUxContract, NAVIGATION_ROUTING_UX_REPORT_SCHEMA, 'Navigation Routing UX Contract declares report schema');
  context.assertIncludes(navigationRoutingUxContract, NAVIGATION_ROUTING_KERNEL_BOUNDARY, 'Navigation Routing UX Contract keeps RMT boundary visible');
  context.assertIncludes(navigationRoutingUxContract, 'Focus Restore', 'Navigation Routing UX Contract documents focus restore');
  context.assertIncludes(navigationRoutingUxContract, 'Route Announcements', 'Navigation Routing UX Contract documents route announcements');
  context.assert(navigationRoutingUxFixture.manifest.metadata.contractVersion === NAVIGATION_ROUTING_UX_SCHEMA, 'Navigation Routing UX fixture declares schema');
  context.assert(navigationRoutingUxFixture.manifest.metadata.workpackage === 'WP-E11-10', 'Navigation Routing UX fixture declares workpackage metadata');
  context.assert(navigationRoutingUxFixture.adapters.some((adapter) => adapter.id === 'xtend.xrouter'), 'Navigation Routing UX fixture uses XRouter adapter');
  context.assert(navigationRoutingUxFixture.schedules.some((schedule) => schedule.id === 'route.focus.restore'), 'Navigation Routing UX fixture schedules focus restore');
  context.assert(navigationRoutingUxFixture.components.some((component) => component.tag === 'x-link'), 'Navigation Routing UX fixture includes x-link');
  context.assertIncludes(navigationRoutingUxModuleSource, NAVIGATION_ROUTING_UX_SCHEMA, 'Navigation Routing UX module declares stable schema');
  context.assertIncludes(navigationRoutingUxModuleSource, 'createNavigationRoutingUxContract', 'Navigation Routing UX module exports factory');
  context.assertIncludes(navigationRoutingUxModuleSource, 'validateNavigationRoutingUxContract', 'Navigation Routing UX module exports validator');
  context.assertIncludes(navigationRoutingUxSuite, 'runNavigationRoutingUxSuite', 'Navigation Routing UX suite exposes runner function');
  context.assertIncludes(overlayInteractionUxContract, OVERLAY_INTERACTION_UX_SCHEMA, 'Overlay Interaction UX Contract declares stable schema');
  context.assertIncludes(overlayInteractionUxContract, OVERLAY_INTERACTION_UX_REPORT_SCHEMA, 'Overlay Interaction UX Contract declares report schema');
  context.assertIncludes(overlayInteractionUxContract, OVERLAY_INTERACTION_KERNEL_BOUNDARY, 'Overlay Interaction UX Contract keeps RMT boundary visible');
  context.assertIncludes(overlayInteractionUxContract, 'Focus Trap', 'Overlay Interaction UX Contract documents focus trap');
  context.assertIncludes(overlayInteractionUxContract, 'Scroll Lock', 'Overlay Interaction UX Contract documents scroll lock');
  context.assert(overlayInteractionUxFixture.manifest.metadata.contractVersion === OVERLAY_INTERACTION_UX_SCHEMA, 'Overlay Interaction UX fixture declares schema');
  context.assert(overlayInteractionUxFixture.manifest.metadata.workpackage === 'WP-E11-11', 'Overlay Interaction UX fixture declares workpackage metadata');
  context.assert(overlayInteractionUxFixture.adapters.some((adapter) => adapter.id === 'rmt.overlay-stack'), 'Overlay Interaction UX fixture uses overlay-stack adapter');
  context.assert(overlayInteractionUxFixture.schedules.some((schedule) => schedule.id === 'overlay.focus.trap'), 'Overlay Interaction UX fixture schedules focus trap');
  context.assert(overlayInteractionUxFixture.components.some((component) => component.tag === 'x-modal'), 'Overlay Interaction UX fixture includes x-modal');
  context.assertIncludes(overlayInteractionUxModuleSource, OVERLAY_INTERACTION_UX_SCHEMA, 'Overlay Interaction UX module declares stable schema');
  context.assertIncludes(overlayInteractionUxModuleSource, 'createOverlayInteractionUxContract', 'Overlay Interaction UX module exports factory');
  context.assertIncludes(overlayInteractionUxModuleSource, 'validateOverlayInteractionUxContract', 'Overlay Interaction UX module exports validator');
  context.assertIncludes(overlayInteractionUxSuite, 'runOverlayInteractionUxSuite', 'Overlay Interaction UX suite exposes runner function');
  context.assertIncludes(runner, "id: 'component-shell-contract'", 'Runner exposes Component Shell Contract suite');
  context.assertIncludes(runner, "id: 'component-styling-contract'", 'Runner exposes Component Styling Contract suite');
  context.assertIncludes(runner, "id: 'runtime-a11y-contract'", 'Runner exposes Runtime A11y Contract suite');
  context.assertIncludes(runner, "id: 'component-ux-performance'", 'Runner exposes Component UX Performance suite');
  context.assertIncludes(runner, "id: 'component-network-contract'", 'Runner exposes Component Network suite');
  context.assertIncludes(runner, "id: 'rmt-shell-authoring-ux'", 'Runner exposes RMT Shell Authoring UX suite');
  context.assertIncludes(runner, "id: 'form-controls-ux'", 'Runner exposes Form Controls UX suite');
  context.assertIncludes(runner, "id: 'feedback-status-ux'", 'Runner exposes Feedback Status UX suite');
  context.assertIncludes(runner, "id: 'navigation-routing-ux'", 'Runner exposes Navigation Routing UX suite');
  context.assertIncludes(runner, "id: 'overlay-interaction-ux'", 'Runner exposes Overlay Interaction UX suite');
  context.assertIncludes(scaffoldConfig, 'componentShellContract', 'Scaffold config exposes Component Shell Contract');
  context.assertIncludes(scaffoldConfig, 'componentStylingContract', 'Scaffold config exposes Component Styling Contract');
  context.assertIncludes(scaffoldConfig, 'runtimeA11yContract', 'Scaffold config exposes Runtime A11y Contract');
  context.assertIncludes(scaffoldConfig, 'componentUxPerformanceContract', 'Scaffold config exposes Component UX Performance Contract');
  context.assertIncludes(scaffoldConfig, 'componentNetworkContract', 'Scaffold config exposes Component Network Contract');
  context.assertIncludes(scaffoldConfig, 'rmtShellAuthoringComponentUx', 'Scaffold config exposes RMT Shell Authoring Contract');
  context.assertIncludes(scaffoldConfig, 'formControlsUxMaturity', 'Scaffold config exposes Form Controls UX Contract');
  context.assertIncludes(scaffoldConfig, 'feedbackStatusUxMaturity', 'Scaffold config exposes Feedback Status UX Contract');
  context.assertIncludes(scaffoldConfig, 'navigationRoutingUxMaturity', 'Scaffold config exposes Navigation Routing UX Contract');
  context.assertIncludes(scaffoldConfig, 'overlayInteractionUxMaturity', 'Scaffold config exposes Overlay Interaction UX Contract');
  context.assert((typeof packageManifest.exports['./builder/typing/component-shell-contract'] === 'string' ? packageManifest.exports['./builder/typing/component-shell-contract'] : packageManifest.exports['./builder/typing/component-shell-contract'] && packageManifest.exports['./builder/typing/component-shell-contract'].default) === './xtend-builder/typing/component-shell-contract.js', 'Package exports Component Shell Contract module');
  context.assert((typeof packageManifest.exports['./builder/typing/component-styling-contract'] === 'string' ? packageManifest.exports['./builder/typing/component-styling-contract'] : packageManifest.exports['./builder/typing/component-styling-contract'] && packageManifest.exports['./builder/typing/component-styling-contract'].default) === './xtend-builder/typing/component-styling-contract.js', 'Package exports Component Styling Contract module');
  const runtimeA11yExport = packageManifest.exports['./a11y/runtime-a11y-contract'];
  context.assert((typeof runtimeA11yExport === 'string' ? runtimeA11yExport : runtimeA11yExport.default) === './a11y/runtime-a11y-contract.js', 'Package exports Runtime A11y Contract module');
  context.assert((typeof packageManifest.exports['./builder/performance/component-ux-performance-contract'] === 'string' ? packageManifest.exports['./builder/performance/component-ux-performance-contract'] : packageManifest.exports['./builder/performance/component-ux-performance-contract'] && packageManifest.exports['./builder/performance/component-ux-performance-contract'].default) === './xtend-builder/performance/component-ux-performance-contract.js', 'Package exports Component UX Performance Contract module');
  context.assert((typeof packageManifest.exports['./builder/typing/component-network-contract'] === 'string' ? packageManifest.exports['./builder/typing/component-network-contract'] : packageManifest.exports['./builder/typing/component-network-contract'] && packageManifest.exports['./builder/typing/component-network-contract'].default) === './xtend-builder/typing/component-network-contract.js', 'Package exports Component Network Contract module');
  context.assert((typeof packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'] === 'string' ? packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'] : packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'] && packageManifest.exports['./builder/typing/rmt-shell-authoring-contract'].default) === './xtend-builder/typing/rmt-shell-authoring-contract.js', 'Package exports RMT Shell Authoring Contract module');
  context.assert((typeof packageManifest.exports['./builder/typing/form-controls-ux-contract'] === 'string' ? packageManifest.exports['./builder/typing/form-controls-ux-contract'] : packageManifest.exports['./builder/typing/form-controls-ux-contract'] && packageManifest.exports['./builder/typing/form-controls-ux-contract'].default) === './xtend-builder/typing/form-controls-ux-contract.js', 'Package exports Form Controls UX Contract module');
  context.assert((typeof packageManifest.exports['./builder/typing/feedback-status-ux-contract'] === 'string' ? packageManifest.exports['./builder/typing/feedback-status-ux-contract'] : packageManifest.exports['./builder/typing/feedback-status-ux-contract'] && packageManifest.exports['./builder/typing/feedback-status-ux-contract'].default) === './xtend-builder/typing/feedback-status-ux-contract.js', 'Package exports Feedback Status UX Contract module');
  context.assert((typeof packageManifest.exports['./builder/typing/navigation-routing-ux-contract'] === 'string' ? packageManifest.exports['./builder/typing/navigation-routing-ux-contract'] : packageManifest.exports['./builder/typing/navigation-routing-ux-contract'] && packageManifest.exports['./builder/typing/navigation-routing-ux-contract'].default) === './xtend-builder/typing/navigation-routing-ux-contract.js', 'Package exports Navigation Routing UX Contract module');
  context.assert((typeof packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'] === 'string' ? packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'] : packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'] && packageManifest.exports['./builder/typing/overlay-interaction-ux-contract'].default) === './xtend-builder/typing/overlay-interaction-ux-contract.js', 'Package exports Overlay Interaction UX Contract module');
  context.assert(packageManifest.scripts['test:component-shell-contract'] === 'node scripts/run_xtend_tests.js component-shell-contract', 'Package exposes Component Shell Contract test script');
  context.assert(packageManifest.scripts['test:component-styling-contract'] === 'node scripts/run_xtend_tests.js component-styling-contract', 'Package exposes Component Styling Contract test script');
  context.assert(packageManifest.scripts['test:runtime-a11y-contract'] === 'node scripts/run_xtend_tests.js runtime-a11y-contract', 'Package exposes Runtime A11y Contract test script');
  context.assert(packageManifest.scripts['test:component-ux-performance'] === 'node scripts/run_xtend_tests.js component-ux-performance', 'Package exposes Component UX Performance test script');
  context.assert(packageManifest.scripts['test:component-network-contract'] === 'node scripts/run_xtend_tests.js component-network-contract', 'Package exposes Component Network test script');
  context.assert(packageManifest.scripts['test:rmt-shell-authoring-ux'] === 'node scripts/run_xtend_tests.js rmt-shell-authoring-ux', 'Package exposes RMT Shell Authoring test script');
  context.assert(packageManifest.scripts['test:form-controls-ux'] === 'node scripts/run_xtend_tests.js form-controls-ux', 'Package exposes Form Controls UX test script');
  context.assert(packageManifest.scripts['test:feedback-status-ux'] === 'node scripts/run_xtend_tests.js feedback-status-ux', 'Package exposes Feedback Status UX test script');
  context.assert(packageManifest.scripts['test:navigation-routing-ux'] === 'node scripts/run_xtend_tests.js navigation-routing-ux', 'Package exposes Navigation Routing UX test script');
  context.assert(packageManifest.scripts['test:overlay-interaction-ux'] === 'node scripts/run_xtend_tests.js overlay-interaction-ux', 'Package exposes Overlay Interaction UX test script');
  context.assert(shellMetadata && shellMetadata.schema === COMPONENT_SHELL_CONTRACT_SCHEMA, 'Package metadata exposes Component Shell Contract schema');
  context.assert(shellMetadata.reportSchema === COMPONENT_SHELL_REPORT_SCHEMA, 'Package metadata exposes Component Shell report schema');
  context.assert(shellMetadata.workpackage === 'WP-E11-02', 'Package metadata exposes WP-E11-02 owner');
  context.assert(shellMetadata.contract === shellContractPath, 'Package metadata exposes Component Shell Contract path');
  context.assert(shellMetadata.localGate === 'node scripts/run_xtend_tests.js component-shell-contract --json', 'Package metadata exposes Component Shell local gate');
  context.assert(shellMetadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps Component Shell RMT boundary');
  context.assert(stylingMetadata && stylingMetadata.schema === COMPONENT_STYLING_CONTRACT_SCHEMA, 'Package metadata exposes Component Styling Contract schema');
  context.assert(stylingMetadata.reportSchema === COMPONENT_STYLING_REPORT_SCHEMA, 'Package metadata exposes Component Styling report schema');
  context.assert(stylingMetadata.workpackage === 'WP-E11-03', 'Package metadata exposes WP-E11-03 owner');
  context.assert(stylingMetadata.contract === stylingContractPath, 'Package metadata exposes Component Styling Contract path');
  context.assert(stylingMetadata.localGate === 'node scripts/run_xtend_tests.js component-styling-contract --json', 'Package metadata exposes Component Styling local gate');
  context.assert(stylingMetadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps Component Styling RMT boundary');
  context.assert(runtimeA11yMetadata && runtimeA11yMetadata.schema === RUNTIME_A11Y_CONTRACT_SCHEMA, 'Package metadata exposes Runtime A11y Contract schema');
  context.assert(runtimeA11yMetadata.reportSchema === RUNTIME_A11Y_REPORT_SCHEMA, 'Package metadata exposes Runtime A11y report schema');
  context.assert(runtimeA11yMetadata.workpackage === 'WP-E11-04', 'Package metadata exposes WP-E11-04 owner');
  context.assert(runtimeA11yMetadata.contract === runtimeA11yContractPath, 'Package metadata exposes Runtime A11y Contract path');
  context.assert(runtimeA11yMetadata.module === runtimeA11yModulePath, 'Package metadata exposes Runtime A11y module path');
  context.assert(runtimeA11yMetadata.localGate === 'node scripts/run_xtend_tests.js runtime-a11y-contract --json', 'Package metadata exposes Runtime A11y local gate');
  context.assert(runtimeA11yMetadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps Runtime A11y RMT boundary');
  context.assert(Array.isArray(runtimeA11yMetadata.requiredAssertions) && runtimeA11yMetadata.requiredAssertions.includes('keyboard-path'), 'Package metadata exposes Runtime A11y keyboard assertion');
  context.assert(Array.isArray(runtimeA11yMetadata.requiredStates) && runtimeA11yMetadata.requiredStates.includes('invalid'), 'Package metadata exposes Runtime A11y invalid state');
  context.assert(componentUxPerformanceMetadata && componentUxPerformanceMetadata.schema === COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Package metadata exposes Component UX Performance schema');
  context.assert(componentUxPerformanceMetadata.reportSchema === COMPONENT_UX_PERFORMANCE_REPORT_SCHEMA, 'Package metadata exposes Component UX Performance report schema');
  context.assert(componentUxPerformanceMetadata.workpackage === 'WP-E11-05', 'Package metadata exposes WP-E11-05 owner');
  context.assert(componentUxPerformanceMetadata.contract === componentUxPerformanceContractPath, 'Package metadata exposes Component UX Performance Contract path');
  context.assert(componentUxPerformanceMetadata.module === componentUxPerformanceModulePath, 'Package metadata exposes Component UX Performance module path');
  context.assert(componentUxPerformanceMetadata.localGate === 'node scripts/run_xtend_tests.js component-ux-performance --json', 'Package metadata exposes Component UX Performance local gate');
  context.assert(componentUxPerformanceMetadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps Component UX Performance RMT boundary');
  context.assert(Array.isArray(componentUxPerformanceMetadata.requiredAssertions) && componentUxPerformanceMetadata.requiredAssertions.includes('event-budget-bounded'), 'Package metadata exposes Component UX Performance event budget assertion');
  context.assert(Array.isArray(componentUxPerformanceMetadata.requiredProfiles) && componentUxPerformanceMetadata.requiredProfiles.includes('media'), 'Package metadata exposes Component UX Performance media profile');
  context.assert(componentNetworkMetadata && componentNetworkMetadata.schema === COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Package metadata exposes Component Network schema');
  context.assert(componentNetworkMetadata.reportSchema === COMPONENT_NETWORK_REPORT_SCHEMA, 'Package metadata exposes Component Network report schema');
  context.assert(componentNetworkMetadata.workpackage === 'WP-E11-06', 'Package metadata exposes WP-E11-06 owner');
  context.assert(componentNetworkMetadata.contract === componentNetworkContractPath, 'Package metadata exposes Component Network Contract path');
  context.assert(componentNetworkMetadata.module === componentNetworkModulePath, 'Package metadata exposes Component Network module path');
  context.assert(componentNetworkMetadata.localGate === 'node scripts/run_xtend_tests.js component-network-contract --json', 'Package metadata exposes Component Network local gate');
  context.assert(componentNetworkMetadata.kernelBoundary === COMPONENT_NETWORK_KERNEL_BOUNDARY, 'Package metadata keeps Component Network RMT boundary');
  context.assert(componentNetworkMetadata.rmtNetworkAuthoring === RMT_NETWORK_AUTHORING_SCHEMA, 'Package metadata exposes Component Network RMT Authoring schema');
  context.assert(Array.isArray(componentNetworkMetadata.requiredAssertions) && componentNetworkMetadata.requiredAssertions.includes('no-global-magic-state'), 'Package metadata exposes Component Network no magic state assertion');
  context.assert(Array.isArray(componentNetworkMetadata.requiredEvents) && componentNetworkMetadata.requiredEvents.includes('xtend:route-change'), 'Package metadata exposes Component Network route event');
  context.assert(Array.isArray(componentNetworkMetadata.requiredCommands) && componentNetworkMetadata.requiredCommands.includes('navigate'), 'Package metadata exposes Component Network navigate command');
  context.assert(Array.isArray(componentNetworkMetadata.requiredProfiles) && componentNetworkMetadata.requiredProfiles.includes('form-control'), 'Package metadata exposes Component Network form-control profile');
  context.assert(rmtShellAuthoringMetadata && rmtShellAuthoringMetadata.schema === RMT_SHELL_AUTHORING_SCHEMA, 'Package metadata exposes RMT Shell Authoring schema');
  context.assert(rmtShellAuthoringMetadata.reportSchema === RMT_SHELL_AUTHORING_REPORT_SCHEMA, 'Package metadata exposes RMT Shell Authoring report schema');
  context.assert(rmtShellAuthoringMetadata.workpackage === 'WP-E11-07', 'Package metadata exposes WP-E11-07 owner');
  context.assert(rmtShellAuthoringMetadata.contract === rmtShellAuthoringContractPath, 'Package metadata exposes RMT Shell Authoring Contract path');
  context.assert(rmtShellAuthoringMetadata.module === rmtShellAuthoringModulePath, 'Package metadata exposes RMT Shell Authoring module path');
  context.assert(rmtShellAuthoringMetadata.fixture === rmtShellAuthoringFixturePath, 'Package metadata exposes RMT Shell Authoring fixture path');
  context.assert(rmtShellAuthoringMetadata.localGate === 'node scripts/run_xtend_tests.js rmt-shell-authoring-ux --json', 'Package metadata exposes RMT Shell Authoring local gate');
  context.assert(rmtShellAuthoringMetadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT Shell Authoring RMT boundary');
  context.assert(Array.isArray(rmtShellAuthoringMetadata.authoringFields) && rmtShellAuthoringMetadata.authoringFields.includes('fabric'), 'Package metadata exposes RMT Shell Authoring Fabric field');
  context.assert(Array.isArray(rmtShellAuthoringMetadata.requiredSchedules) && rmtShellAuthoringMetadata.requiredSchedules.includes('a11y.announce'), 'Package metadata exposes RMT Shell Authoring a11y schedule');
  context.assert(Array.isArray(rmtShellAuthoringMetadata.requiredAssertions) && rmtShellAuthoringMetadata.requiredAssertions.includes('kernel-boundary-preserved'), 'Package metadata exposes RMT Shell Authoring kernel boundary assertion');
  context.assert(formControlsUxMetadata && formControlsUxMetadata.schema === FORM_CONTROLS_UX_SCHEMA, 'Package metadata exposes Form Controls UX schema');
  context.assert(formControlsUxMetadata.reportSchema === FORM_CONTROLS_UX_REPORT_SCHEMA, 'Package metadata exposes Form Controls UX report schema');
  context.assert(formControlsUxMetadata.workpackage === 'WP-E11-08', 'Package metadata exposes WP-E11-08 owner');
  context.assert(formControlsUxMetadata.contract === formControlsUxContractPath, 'Package metadata exposes Form Controls UX Contract path');
  context.assert(formControlsUxMetadata.module === formControlsUxModulePath, 'Package metadata exposes Form Controls UX module path');
  context.assert(formControlsUxMetadata.fixture === formControlsUxFixturePath, 'Package metadata exposes Form Controls UX fixture path');
  context.assert(formControlsUxMetadata.localGate === 'node scripts/run_xtend_tests.js form-controls-ux --json', 'Package metadata exposes Form Controls UX local gate');
  context.assert(formControlsUxMetadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps Form Controls UX RMT boundary');
  context.assert(Array.isArray(formControlsUxMetadata.targets) && formControlsUxMetadata.targets.includes('x-writer'), 'Package metadata exposes Form Controls UX x-writer target');
  context.assert(Array.isArray(formControlsUxMetadata.requiredAssertions) && formControlsUxMetadata.requiredAssertions.includes('form-data-aggregation'), 'Package metadata exposes Form Controls UX aggregation assertion');
  context.assert(feedbackStatusUxMetadata && feedbackStatusUxMetadata.schema === FEEDBACK_STATUS_UX_SCHEMA, 'Package metadata exposes Feedback Status UX schema');
  context.assert(feedbackStatusUxMetadata.reportSchema === FEEDBACK_STATUS_UX_REPORT_SCHEMA, 'Package metadata exposes Feedback Status UX report schema');
  context.assert(feedbackStatusUxMetadata.workpackage === 'WP-E11-09', 'Package metadata exposes WP-E11-09 owner');
  context.assert(feedbackStatusUxMetadata.contract === feedbackStatusUxContractPath, 'Package metadata exposes Feedback Status UX Contract path');
  context.assert(feedbackStatusUxMetadata.module === feedbackStatusUxModulePath, 'Package metadata exposes Feedback Status UX module path');
  context.assert(feedbackStatusUxMetadata.fixture === feedbackStatusUxFixturePath, 'Package metadata exposes Feedback Status UX fixture path');
  context.assert(feedbackStatusUxMetadata.localGate === 'node scripts/run_xtend_tests.js feedback-status-ux --json', 'Package metadata exposes Feedback Status UX local gate');
  context.assert(feedbackStatusUxMetadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps Feedback Status UX RMT boundary');
  context.assert(Array.isArray(feedbackStatusUxMetadata.targets) && feedbackStatusUxMetadata.targets.includes('x-spinner'), 'Package metadata exposes Feedback Status UX x-spinner target');
  context.assert(Array.isArray(feedbackStatusUxMetadata.requiredAssertions) && feedbackStatusUxMetadata.requiredAssertions.includes('live-region-semantics'), 'Package metadata exposes Feedback Status UX live region assertion');
  context.assert(navigationRoutingUxMetadata && navigationRoutingUxMetadata.schema === NAVIGATION_ROUTING_UX_SCHEMA, 'Package metadata exposes Navigation Routing UX schema');
  context.assert(navigationRoutingUxMetadata.reportSchema === NAVIGATION_ROUTING_UX_REPORT_SCHEMA, 'Package metadata exposes Navigation Routing UX report schema');
  context.assert(navigationRoutingUxMetadata.workpackage === 'WP-E11-10', 'Package metadata exposes WP-E11-10 owner');
  context.assert(navigationRoutingUxMetadata.contract === navigationRoutingUxContractPath, 'Package metadata exposes Navigation Routing UX Contract path');
  context.assert(navigationRoutingUxMetadata.module === navigationRoutingUxModulePath, 'Package metadata exposes Navigation Routing UX module path');
  context.assert(navigationRoutingUxMetadata.fixture === navigationRoutingUxFixturePath, 'Package metadata exposes Navigation Routing UX fixture path');
  context.assert(navigationRoutingUxMetadata.localGate === 'node scripts/run_xtend_tests.js navigation-routing-ux --json', 'Package metadata exposes Navigation Routing UX local gate');
  context.assert(navigationRoutingUxMetadata.kernelBoundary === NAVIGATION_ROUTING_KERNEL_BOUNDARY, 'Package metadata keeps Navigation Routing UX RMT boundary');
  context.assert(Array.isArray(navigationRoutingUxMetadata.targets) && navigationRoutingUxMetadata.targets.includes('x-router'), 'Package metadata exposes Navigation Routing UX x-router target');
  context.assert(Array.isArray(navigationRoutingUxMetadata.requiredAssertions) && navigationRoutingUxMetadata.requiredAssertions.includes('focus-restore-after-route'), 'Package metadata exposes Navigation Routing UX focus restore assertion');
  context.assert(overlayInteractionUxMetadata && overlayInteractionUxMetadata.schema === OVERLAY_INTERACTION_UX_SCHEMA, 'Package metadata exposes Overlay Interaction UX schema');
  context.assert(overlayInteractionUxMetadata.reportSchema === OVERLAY_INTERACTION_UX_REPORT_SCHEMA, 'Package metadata exposes Overlay Interaction UX report schema');
  context.assert(overlayInteractionUxMetadata.workpackage === 'WP-E11-11', 'Package metadata exposes WP-E11-11 owner');
  context.assert(overlayInteractionUxMetadata.contract === overlayInteractionUxContractPath, 'Package metadata exposes Overlay Interaction UX Contract path');
  context.assert(overlayInteractionUxMetadata.module === overlayInteractionUxModulePath, 'Package metadata exposes Overlay Interaction UX module path');
  context.assert(overlayInteractionUxMetadata.fixture === overlayInteractionUxFixturePath, 'Package metadata exposes Overlay Interaction UX fixture path');
  context.assert(overlayInteractionUxMetadata.localGate === 'node scripts/run_xtend_tests.js overlay-interaction-ux --json', 'Package metadata exposes Overlay Interaction UX local gate');
  context.assert(overlayInteractionUxMetadata.kernelBoundary === OVERLAY_INTERACTION_KERNEL_BOUNDARY, 'Package metadata keeps Overlay Interaction UX RMT boundary');
  context.assert(Array.isArray(overlayInteractionUxMetadata.targets) && overlayInteractionUxMetadata.targets.includes('x-modal'), 'Package metadata exposes Overlay Interaction UX x-modal target');
  context.assert(Array.isArray(overlayInteractionUxMetadata.requiredAssertions) && overlayInteractionUxMetadata.requiredAssertions.includes('focus-trap-contained'), 'Package metadata exposes Overlay Interaction UX focus trap assertion');
  context.assert(sampleShell.schema === COMPONENT_SHELL_CONTRACT_SCHEMA, 'Component Shell factory creates stable schema records');
  context.assert(SHELL_REQUIRED_STATES.every((state) => sampleShell.states.includes(state)), 'Component Shell factory includes all required states');
  context.assert(shellValidation.ok === true, 'Component Shell validator accepts factory output');
  context.assert(sampleStyling.schema === COMPONENT_STYLING_CONTRACT_SCHEMA, 'Component Styling factory creates stable schema records');
  context.assert(STYLING_TOKEN_CATEGORIES.every((category) => sampleStyling.tokens.some((token) => token.category === category)), 'Component Styling factory includes all token categories');
  context.assert(stylingValidation.ok === true, 'Component Styling validator accepts factory output');
  context.assert(sampleRuntimeA11y.schema === RUNTIME_A11Y_CONTRACT_SCHEMA, 'Runtime A11y factory creates stable schema records');
  context.assert(RUNTIME_A11Y_REQUIRED_DOMAINS.every((domain) => Boolean(sampleRuntimeA11y[domain])), 'Runtime A11y factory includes all required domains');
  context.assert(RUNTIME_A11Y_REQUIRED_ASSERTIONS.every((assertion) => sampleRuntimeA11y.tests.assertions.includes(assertion)), 'Runtime A11y factory includes all required assertions');
  context.assert(runtimeA11yValidation.ok === true, 'Runtime A11y validator accepts factory output');
  context.assert(sampleComponentUxPerformance.schema === COMPONENT_UX_PERFORMANCE_CONTRACT_SCHEMA, 'Component UX Performance factory creates stable schema records');
  context.assert(COMPONENT_UX_PERFORMANCE_REQUIRED_DOMAINS.every((domain) => Boolean(sampleComponentUxPerformance[domain])), 'Component UX Performance factory includes all required domains');
  context.assert(COMPONENT_UX_PERFORMANCE_REQUIRED_ASSERTIONS.every((assertion) => sampleComponentUxPerformance.tests.assertions.includes(assertion)), 'Component UX Performance factory includes all required assertions');
  context.assert(COMPONENT_UX_PERFORMANCE_PROFILES.every((profile) => sampleComponentUxPerformance.profile.allowedProfiles.includes(profile)), 'Component UX Performance factory exposes all profile kinds');
  context.assert(componentUxPerformanceValidation.ok === true, 'Component UX Performance validator accepts factory output');
  context.assert(sampleComponentNetwork.schema === COMPONENT_NETWORK_CONTRACT_SCHEMA, 'Component Network factory creates stable schema records');
  context.assert(COMPONENT_NETWORK_REQUIRED_DOMAINS.every((domain) => Boolean(sampleComponentNetwork[domain])), 'Component Network factory includes all required domains');
  context.assert(COMPONENT_NETWORK_ASSERTIONS.every((assertion) => sampleComponentNetwork.tests.assertions.includes(assertion)), 'Component Network factory includes all required assertions');
  context.assert(COMPONENT_NETWORK_REQUIRED_EVENTS.every((event) => sampleComponentNetwork.events.required.some((record) => record.name === event)), 'Component Network factory includes all required events');
  context.assert(COMPONENT_NETWORK_PROFILES.includes(sampleComponentNetwork.primaryProfile), 'Component Network factory derives a known primary profile');
  context.assert(componentNetworkValidation.ok === true, 'Component Network validator accepts factory output');
  context.assert(sampleRmtShellAuthoring.schema === RMT_SHELL_AUTHORING_SCHEMA, 'RMT Shell Authoring factory creates stable schema records');
  context.assert(RMT_SHELL_AUTHORING_REQUIRED_DOMAINS.every((domain) => Boolean(sampleRmtShellAuthoring[domain])), 'RMT Shell Authoring factory includes all required domains');
  context.assert(RMT_SHELL_AUTHORING_ASSERTIONS.every((assertion) => sampleRmtShellAuthoring.tests.assertions.includes(assertion)), 'RMT Shell Authoring factory includes all required assertions');
  context.assert(RMT_SHELL_AUTHORING_FIELDS.every((field) => sampleRmtShellAuthoring.authoringFields.includes(field)), 'RMT Shell Authoring factory exposes all authoring fields');
  context.assert(RMT_SHELL_AUTHORING_REQUIRED_SCHEDULES.every((schedule) => sampleRmtShellAuthoring.schedules.required.some((record) => record.id === schedule)), 'RMT Shell Authoring factory exposes all required schedules');
  context.assert(rmtShellAuthoringValidation.ok === true, 'RMT Shell Authoring validator accepts factory output');
  context.assert(sampleFormControlsUx.schema === FORM_CONTROLS_UX_SCHEMA, 'Form Controls UX factory creates stable schema records');
  context.assert(FORM_CONTROL_REQUIRED_DOMAINS.every((domain) => sampleFormControlsUx.domains.includes(domain)), 'Form Controls UX factory exposes all required domains');
  context.assert(FORM_CONTROL_REQUIRED_ASSERTIONS.every((assertion) => sampleFormControlsUx.tests.assertions.includes(assertion)), 'Form Controls UX factory exposes all required assertions');
  context.assert(FORM_CONTROL_TARGETS.every((tag) => sampleFormControlsUx.targets.includes(tag)), 'Form Controls UX factory exposes all target controls');
  context.assert(formControlsUxValidation.ok === true, 'Form Controls UX validator accepts factory output');
  context.assert(sampleFeedbackStatusUx.schema === FEEDBACK_STATUS_UX_SCHEMA, 'Feedback Status UX factory creates stable schema records');
  context.assert(FEEDBACK_STATUS_REQUIRED_DOMAINS.every((domain) => sampleFeedbackStatusUx.domains.includes(domain)), 'Feedback Status UX factory exposes all required domains');
  context.assert(FEEDBACK_STATUS_REQUIRED_ASSERTIONS.every((assertion) => sampleFeedbackStatusUx.tests.assertions.includes(assertion)), 'Feedback Status UX factory exposes all required assertions');
  context.assert(FEEDBACK_STATUS_TARGETS.every((tag) => sampleFeedbackStatusUx.targets.includes(tag)), 'Feedback Status UX factory exposes all target controls');
  context.assert(feedbackStatusUxValidation.ok === true, 'Feedback Status UX validator accepts factory output');
  context.assert(sampleNavigationRoutingUx.schema === NAVIGATION_ROUTING_UX_SCHEMA, 'Navigation Routing UX factory creates stable schema records');
  context.assert(NAVIGATION_ROUTING_REQUIRED_DOMAINS.every((domain) => sampleNavigationRoutingUx.domains.includes(domain)), 'Navigation Routing UX factory exposes all required domains');
  context.assert(NAVIGATION_ROUTING_REQUIRED_ASSERTIONS.every((assertion) => sampleNavigationRoutingUx.tests.assertions.includes(assertion)), 'Navigation Routing UX factory exposes all required assertions');
  context.assert(NAVIGATION_ROUTING_TARGETS.every((tag) => sampleNavigationRoutingUx.targets.includes(tag)), 'Navigation Routing UX factory exposes all target controls');
  context.assert(NAVIGATION_ROUTING_REQUIRED_EVENTS.every((eventName) => sampleNavigationRoutingUx.requiredEvents.includes(eventName)), 'Navigation Routing UX factory exposes all required events');
  context.assert(NAVIGATION_ROUTING_REQUIRED_SCHEDULES.every((schedule) => sampleNavigationRoutingUx.requiredSchedules.includes(schedule)), 'Navigation Routing UX factory exposes all required schedules');
  context.assert(navigationRoutingUxValidation.ok === true, 'Navigation Routing UX validator accepts factory output');
  context.assert(sampleOverlayInteractionUx.schema === OVERLAY_INTERACTION_UX_SCHEMA, 'Overlay Interaction UX factory creates stable schema records');
  context.assert(OVERLAY_INTERACTION_REQUIRED_DOMAINS.every((domain) => sampleOverlayInteractionUx.domains.includes(domain)), 'Overlay Interaction UX factory exposes all required domains');
  context.assert(OVERLAY_INTERACTION_REQUIRED_ASSERTIONS.every((assertion) => sampleOverlayInteractionUx.tests.assertions.includes(assertion)), 'Overlay Interaction UX factory exposes all required assertions');
  context.assert(OVERLAY_INTERACTION_TARGETS.every((tag) => sampleOverlayInteractionUx.targets.includes(tag)), 'Overlay Interaction UX factory exposes all target controls');
  context.assert(OVERLAY_INTERACTION_REQUIRED_EVENTS.every((eventName) => sampleOverlayInteractionUx.requiredEvents.includes(eventName)), 'Overlay Interaction UX factory exposes all required events');
  context.assert(OVERLAY_INTERACTION_REQUIRED_SCHEDULES.every((schedule) => sampleOverlayInteractionUx.requiredSchedules.includes(schedule)), 'Overlay Interaction UX factory exposes all required schedules');
  context.assert(overlayInteractionUxValidation.ok === true, 'Overlay Interaction UX validator accepts factory output');
}

function assertEnterpriseRoadmapStatusConsistency(context, rootDir) {
  const roadmapPath = 'development/ROADMAP-XTend-Enterprise-Reife.md';
  const roadmap = readText(roadmapPath, rootDir);
  const tableStatuses = new Map();
  const detailStatuses = new Map();
  const tableRowPattern = /^\| `(ER-WP-\d+)` \| [^|]+ \| (completed|ready|next|blocked|planned) \|/gm;
  const detailStatusPattern = /^### (ER-WP-\d+) - [^\n]+\n\n- Prioritaet: `[^`]+`\n- Status: `(completed|ready|next|blocked|planned)`/gm;

  let match;
  while ((match = tableRowPattern.exec(roadmap)) !== null) {
    tableStatuses.set(match[1], match[2]);
  }

  while ((match = detailStatusPattern.exec(roadmap)) !== null) {
    detailStatuses.set(match[1], match[2]);
  }

  context.assert(tableStatuses.size === 40, 'Enterprise roadmap table lists all 40 ER workpackages');
  context.assert(detailStatuses.size === 40, 'Enterprise roadmap detail sections list all 40 ER workpackages');

  tableStatuses.forEach((status, id) => {
    context.assert(
      detailStatuses.get(id) === status,
      `${id} roadmap table status matches detail section status (${status})`
    );
  });
}

function assertEpic03ScaffoldReferences(context, rootDir) {
  EPIC_03_SCAFFOLD_REFERENCE_CONTRACTS.forEach((reference) => {
    assertFileExists(context, reference.path, rootDir, `${reference.label} file exists`);
    assertContracts(context, readText(reference.path, rootDir), reference.contracts, reference.label);
  });
}

function assertEpic04RmtTemplateReferences(context, rootDir) {
  EPIC_04_RMT_TEMPLATE_REFERENCE_CONTRACTS.forEach((reference) => {
    assertFileExists(context, reference.path, rootDir, `${reference.label} file exists`);
    assertContracts(context, readText(reference.path, rootDir), reference.contracts, reference.label);
  });
}

function assertEpic05BridgeReferences(context, rootDir) {
  EPIC_05_BRIDGE_REFERENCE_CONTRACTS.forEach((reference) => {
    assertFileExists(context, reference.path, rootDir, `${reference.label} file exists`);
    assertContracts(context, readText(reference.path, rootDir), reference.contracts, reference.label);
  });
}

function runReferencePathSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'references',
    label: 'Documentation and demo reference paths'
  });

  assertFileExists(context, REFERENCE_REGISTRY_PATH, rootDir, 'Reference registry document exists');
  assertNoXtendCdnInDefaultCorePaths(context, rootDir);
  assertDemoAndFixtureLoaderMigration(context, rootDir);
  assertDocsMenuReferences(context, rootDir);
  assertDocumentationReferences(context, rootDir);
  assertDemoReferences(context, rootDir);
  assertRmtReference(context, rootDir);
  assertTestObligationReferences(context, rootDir);
  assertEpicClosureReferences(context, rootDir);
  assertTrustedDomPolicyReference(context, rootDir);
  assertSupplyChainPolicyReference(context, rootDir);
  assertComponentCatalogCoverageReference(context, rootDir);
  assertComponentRegressionPriorityReference(context, rootDir);
  assertCiDefaultGatesReference(context, rootDir);
  assertReleaseChecklistReference(context, rootDir);
  assertEnterpriseAdoptionReference(context, rootDir);
  assertDocsRmtPilotReference(context, rootDir);
  assertEpic10TypeScriptSourceStrategyReference(context, rootDir);
  assertEpic10ComponentContractV2Reference(context, rootDir);
  assertEpic10RmtFirstClassAppAuthoringReference(context, rootDir);
  assertEpic10ComponentFabricLaneIngestionReference(context, rootDir);
  assertEpic10ComponentLifecycleTelemetryReference(context, rootDir);
  assertEpic10TypeScriptComponentBlueprintReference(context, rootDir);
  assertEpic10P0ComponentWaveReference(context, rootDir);
  assertEpic10FormSelectionControlsReference(context, rootDir);
  assertEpic10FormFeedbackControlsReference(context, rootDir);
  assertEpic10OverlayNavigationControlsReference(context, rootDir);
  assertEpic10ComponentLabRmtInspectorReference(context, rootDir);
  assertEpic10PlatformGatesReference(context, rootDir);
  assertEpic10ReleaseHandoffReference(context, rootDir);
  assertEpic11BacklogAndUxMaturityReference(context, rootDir);
  assertEnterpriseRoadmapStatusConsistency(context, rootDir);
  assertEpic03ScaffoldReferences(context, rootDir);
  assertEpic04RmtTemplateReferences(context, rootDir);
  assertEpic05BridgeReferences(context, rootDir);
  assertScaffoldProjectLayoutReference(context, rootDir);
  assertScaffoldComponentBlueprintReference(context, rootDir);
  assertScaffoldGeneratorReference(context, rootDir);
  assertScaffoldWorkflowReference(context, rootDir);

  return context.result({
    docs: DOC_REFERENCE_CONTRACTS.map((reference) => reference.path),
    demos: DEMO_REFERENCE_CONTRACTS.map((reference) => reference.path),
    testObligation: TEST_OBLIGATION_REFERENCE_CONTRACTS.map((reference) => reference.path),
    closure: EPIC_CLOSURE_REFERENCE_CONTRACTS.map((reference) => reference.path),
    epic03Scaffold: EPIC_03_SCAFFOLD_REFERENCE_CONTRACTS.map((reference) => reference.path),
    epic04RmtTemplating: EPIC_04_RMT_TEMPLATE_REFERENCE_CONTRACTS.map((reference) => reference.path),
    epic05Bridge: EPIC_05_BRIDGE_REFERENCE_CONTRACTS.map((reference) => reference.path),
    registry: REFERENCE_REGISTRY_PATH
  });
}

function printReferencePathReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Documentation/Demo Reference Gates erfolgreich.',
    failureTitle: 'XTend Documentation/Demo Reference Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runReferencePathSuite();
  printReferencePathReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printReferencePathReport,
  runReferencePathSuite
};

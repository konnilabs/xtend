# RMT Tooling Release Gates

The Epic 14 RMT tooling release boundary is the stable CI contract for the parser, semantic graph, linter, language server, agent reports and Maraca-adjacent production checks.

- Status: Accepted
- Contract: `xtend.epic14.rmt-tooling.v1`
- Release gate: `npm run test:rmt-tooling`
- Release report: `npm run test:rmt-tooling:report`
- Optional PR gate: `npm run test:pr:rmt`
- Optional PR report: `npm run test:pr:rmt:report`
- Self gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`
- Kernel boundary: `no-rmt-kernel-import-of-xtend-types`

## RKFA Closure

RKFA-13 extends the gate boundary with PROD Maraca closure:

- Schema: `xtend.maraca.production-bundle-closure.v1`
- Gate: `node scripts/run_xtend_tests.js maraca-bundle-report rmt-stack-docs epic14-rmt-tooling-release-gates --json`
- Reports: `productionClosure`, `kernelFeatureAdoptionClosure`
- CI artifact: `.xtend-test-results/xtend-rkfa-production-closure-report.json`

PROD bundles must not silently pass missing runtime capabilities, policy parity drift, strict fallbacks or failed bundle budgets.

## CI Behavior

The GitHub Actions do not treat the RMT tooling gates as a disconnected side path. They are part of the PR and release reports, and they are also materialized as a dedicated RKFA closure report. That lets owners inspect whether parser, linter, agent repair, Maraca closure and kernel feature adoption still agree in an ordinary PR. The separate report is intentionally narrow: it checks Maraca bundle reporting, RMT stack documentation and the Epic 14 release-gate alias in one run.

Release and publish paths produce the same closure report again. This prevents a bundle from passing the large release report while later publishing without machine-readable evidence for `productionClosure` or `kernelFeatureAdoptionClosure`. For debugging, the report is the stable first stop: read `xtend-rkfa-production-closure-report.json`, then drill into `xtend-release-gate-report.json` and the Maraca bundle-report artifact when a capability needs deeper inspection.

## Expected Evidence

A green gate run provides three layers of evidence. The first layer is Source-to-Sea: RMT source, bundle fingerprint, runtime expected status and linked release tests must describe the same product surface. The second layer is policy parity: kernel-adjacent factories such as `recordTrustVerdict`, `recoverFromPanic`, `reportPerformanceSample` and `dispatchCommand` must exist without drift in both compile-time and runtime views. The third layer is runtime closure: lifecycle, telemetry, performance, Warm Reentry, Prewarm Worker and prerender may only be marked active when the productive chain actually provides the capability.

When a capability is intentionally optional, it remains visible, but it must not pretend to be PROD-ready. That is the operational difference between `supported`, `active`, `degraded` and `blocked`. CI treats those fields as contracts between the RMT kernel, Fabric, Maraca and the UI layer, not as decorative reporting.

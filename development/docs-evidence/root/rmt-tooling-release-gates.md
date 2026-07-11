# XTend Epic 14 RMT Tooling Release Gates

- Status: Accepted
- Contract: `xtend.epic14.rmt-tooling.v1`
- Release-Gate: `npm run test:rmt-tooling`
- Release-Report: `npm run test:rmt-tooling:report`
- Optionaler PR-Gate: `npm run test:pr:rmt`
- Optionaler PR-Report: `npm run test:pr:rmt:report`
- Self-Gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Gate-Schnitt

Der Release-Gate buendelt Parser, Semantic Graph, Linter, CLI, Completion, Navigation, Language Server, Code Actions, Agent Report, Editor Packaging, Regression Matrix und Tooling-Doku.

RKFA-11 haertet den Release-Schnitt um Kernel Policy Parity:

- Schema: `xtend.rmt.kernel-policy-parity.v1`
- Report: `xtend.rmt.kernel-policy-parity-report.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json`
- Package Script: `npm run test:rmt-kernel-policy-parity`
- Required Factories: `recordTrustVerdict`, `commitTrustedHtml`, `commitTrustedAttribute`, `commitTrustedProperty`, `applyRemoteSurfacePolicy`, `recoverFromPanic`, `rememberSafeSnapshot`, `listRecoveryOutcomes`, `panicBlockScope`, `abortScope`, `reportPerformanceSample`, `dispatchCommand`, `recordEscalation`, `listEscalations`

Release-Reports muessen `policyParity.ok`, `policyParity.driftCount` und `policyParity.requiredFactories` maschinenlesbar enthalten. Strict Maraca Builds duerfen Drift, fehlende Factories oder unsichere Trust-Sink-Abdeckung nicht still uebergehen.

RKFA-13 schliesst PROD-Maraca-Bundles ueber `productionClosure` und `kernelFeatureAdoptionClosure` ab:

- Schema: `xtend.maraca.production-bundle-closure.v1`
- Gate: `node scripts/run_xtend_tests.js maraca-bundle-report rmt-stack-docs epic14-rmt-tooling-release-gates --json`
- Matrix: `supported`, `active`, `degraded`, `blocked`, `runtimeExpectedStatus`, `diagnostics`
- Source-To-Sea: RMT Source-Fingerprint, Artifact-/Bundle-Fingerprints, Runtime Feature Status und Release-Tests
- Release-Constraint: PROD-Bundles blocken bei fehlenden Runtime-Capabilities, Policy-Parity-Drift, Strict-Fallbacks oder fehlgeschlagenem Bundle-Budget.

## CI-Handoff

`npm test` und `npm run test:release:full:report` bleiben die globale Full-Release-Linie. `npm run test:rmt-tooling` bleibt der dedizierte RMT-Tooling-Gate; Policy Parity ist als eigener Kernel-Release-Constraint daran gekoppelt.

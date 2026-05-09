const {
  KERNEL_BOUNDARY,
  createEpic12Rc0HandoffPlan,
  createEpic12Rc0HandoffReport,
  validateEpic12Rc0HandoffPlan
} = require('./epic12-rc0-handoff');
const {
  CONDITIONAL_NETWORK_COMMANDS,
  RC0_AUTHORING_SUITES,
  RC0_RELEASE_MUST_INCLUDE,
  RC0_SNAPSHOT_SUITES,
  createEpic12Rc0GateMatrix,
  createEpic12Rc0GateMatrixReport,
  validateEpic12Rc0GateMatrix
} = require('./epic12-rc0-gate-matrix');

const EPIC13_RC1_READINESS_SCHEMA = 'xtend.epic13.rc1-production-readiness.v1';
const EPIC13_RC1_READINESS_REPORT_SCHEMA = 'xtend.epic13.rc1-readiness-report.v1';
const EPIC13_RC1_READINESS_WORKPACKAGE = 'WP-E13-01';
const EPIC13_RC1_READINESS_STATUS = 'accepted-rc1-readiness-model';
const EPIC13_RC1_READINESS_TARGET = 'rc1-production-candidate-ready';
const EPIC13_RC1_READINESS_MODULE = 'catalog/epic13-rc1-readiness.js';
const EPIC13_RC1_READINESS_SUITE = 'tests/platform/epic13_rc1_readiness_suite.js';
const EPIC13_RC1_READINESS_STEERING = 'development/RC0-RC1-transfer-EPIC13.md';
const EPIC13_RC1_READINESS_CONTRACT = 'development/XTend-Epic13-RC1-Readiness-Modell.md';
const EPIC13_RC1_READINESS_WORKPACKAGE_DOC = 'development/WP-E13-01-RC1-Readiness-Model-und-Gate-Abgleich-einfrieren.md';
const EPIC13_RC1_READINESS_DOCS = 'docs/rc1-readiness.md';
const EPIC13_RC1_READINESS_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic13-rc1-readiness --json';
const EPIC13_RC1_READINESS_PACKAGE_SCRIPT = 'npm run test:epic13-rc1-readiness';
const PUBLISH_BOUNDARY = 'private-until-release-owner-acceptance';

const REQUIRED_BASELINE_GATES = Object.freeze([
  'epic12-rc0-handoff',
  'rc0-gate-matrix',
  'references'
]);

const REQUIRED_SOURCE_SCHEMAS = Object.freeze([
  'xtend.epic12.rc0-handoff.v1',
  'xtend.epic12.rc0-gate-matrix.v1',
  'xtend.release.checklist-semver-policy.v1',
  'xtend.ci.gate-matrix.v1'
]);

const REQUIRED_DOCS = Object.freeze([
  EPIC13_RC1_READINESS_STEERING,
  EPIC13_RC1_READINESS_CONTRACT,
  EPIC13_RC1_READINESS_WORKPACKAGE_DOC,
  EPIC13_RC1_READINESS_DOCS,
  'development/XTend-Epic12-Abschluss-und-RC0-Handoff.md',
  'development/XTend-RC0-Gate-Matrix.md',
  'development/XTend-Release-Checklist-und-SemVer-Policy.md',
  'development/XTend-CI-Gate-Matrix.md',
  'docs/epic12-rc0-handoff.md',
  'docs/enterprise-adoption.md'
]);

const GATE_MAPPINGS = Object.freeze([
  {
    goalpost: 'rc0-owner-handoff',
    existingGate: 'npm run test:epic12-rc0-handoff',
    sourceSchema: 'xtend.epic12.rc0-handoff.v1',
    status: 'baseline-green',
    rc1Decision: 'carry-forward'
  },
  {
    goalpost: 'full-release-report',
    existingGate: 'npm run test:release:full:report',
    sourceSchema: 'xtend.ci.gate-matrix.v1',
    status: 'available',
    rc1Decision: 'required-artifact'
  },
  {
    goalpost: 'pr-fast-report',
    existingGate: 'npm run test:pr:report',
    sourceSchema: 'xtend.ci.gate-matrix.v1',
    status: 'available',
    rc1Decision: 'carry-forward'
  },
  {
    goalpost: 'rc0-gate-matrix',
    existingGate: 'npm run test:rc0-gate-matrix',
    sourceSchema: 'xtend.epic12.rc0-gate-matrix.v1',
    status: 'baseline-green',
    rc1Decision: 'extend-to-rc1'
  },
  {
    goalpost: 'docs-and-migration-notes',
    existingGate: 'npm run test:epic12-docs-adoption',
    sourceSchema: 'xtend.epic12.docs-adoption.v1',
    status: 'available',
    rc1Decision: 'extend-to-rc1'
  },
  {
    goalpost: 'release-report',
    existingGate: 'npm run release:report',
    sourceSchema: 'xtend.release.checklist-semver-policy.v1',
    status: 'available',
    rc1Decision: 'required-artifact'
  },
  {
    goalpost: 'package-dry-run',
    existingGate: 'npm run pack:dry-run',
    sourceSchema: 'xtend.release.checklist-semver-policy.v1',
    status: 'available',
    rc1Decision: 'needs-machine-readable-lock'
  },
  {
    goalpost: 'manifest-security',
    existingGate: 'npm run test:manifest-policy',
    sourceSchema: 'xtend.security.manifest-import-gate.v1',
    status: 'available-prod-csp-prepared',
    rc1Decision: 'carry-forward-with-prod-csp-smoke'
  },
  {
    goalpost: 'local-supply-chain',
    existingGate: 'npm run test:supply-chain',
    sourceSchema: 'xtend.security.supply-chain-gate-plan.v1',
    status: 'available',
    rc1Decision: 'link-network-evidence'
  },
  {
    goalpost: 'conditional-network-gates',
    existingGate: CONDITIONAL_NETWORK_COMMANDS.join(' && '),
    sourceSchema: 'xtend.epic12.rc0-gate-matrix.v1',
    status: 'conditional',
    rc1Decision: 'run-or-owner-deferral'
  },
  {
    goalpost: 'visual-dom-snapshots',
    existingGate: 'npm run test:visual-snapshots',
    sourceSchema: 'xtend.epic12.visual-snapshot-runner-report.v1',
    status: 'available',
    rc1Decision: 'carry-forward-with-optional-pixel-artifact'
  },
  {
    goalpost: 'design-tokens',
    existingGate: 'npm run test:design-tokens',
    sourceSchema: 'xtend.design-tokens.product-contract.v1',
    status: 'available',
    rc1Decision: 'carry-forward'
  },
  {
    goalpost: 'performance-regression',
    existingGate: 'npm run test:performance',
    sourceSchema: 'xtend.performance.regression-gate.v1',
    status: 'available-closed-warning',
    rc1Decision: 'carry-forward-after-owner-free-closure'
  },
  {
    goalpost: 'hydration-policy',
    existingGate: 'npm run test:hydration-policy',
    sourceSchema: 'xtend.fabric.hydration-policy.v1',
    status: 'available',
    rc1Decision: 'carry-forward-with-prod-smoke'
  },
  {
    goalpost: 'a11y-baseline',
    existingGate: 'npm run test:a11y && npm run test:screenreader-signals && npm run test:motion-contrast',
    sourceSchema: 'xtend.a11y.screenreader-signals.v1',
    status: 'available',
    rc1Decision: 'densify-browser-near'
  },
  {
    goalpost: 'browser-smoke',
    existingGate: 'npm run test:browser',
    sourceSchema: 'xtend.browser-smoke.v1',
    status: 'available-prod-csp-prepared',
    rc1Decision: 'carry-forward-with-prod-like-csp'
  },
  {
    goalpost: 'rmt-compatibility',
    existingGate: 'npm run test:rmt-compatibility && npm run test:rmt-first-class-app && npm run test:rmt-artifact-parity',
    sourceSchema: 'xtend.rmt.first-class-app-authoring.v1',
    status: 'available',
    rc1Decision: 'bundle-production-readiness'
  },
  {
    goalpost: 'docs-rmt-pilot',
    existingGate: 'npm run test:docs-rmt-pilot',
    sourceSchema: 'xtend.docs.parsedown-rmt-pilot.v1',
    status: 'available',
    rc1Decision: 'harden-for-prod-like-docs-shell'
  }
]);

const GATE_GAPS = Object.freeze([
  {
    id: 'rc1-gate-matrix',
    title: 'RC1 Gate Matrix fehlt',
    reason: 'RC0 ist reviewbar, RC1 braucht finalen Acceptance-Schnitt',
    targetWorkpackages: ['WP-E13-01', 'WP-E13-13']
  },
  {
    id: 'release-owner-acceptance',
    title: 'Release Owner Acceptance Contract ist definiert',
    reason: 'Publish Boundary ist formalisiert, bleibt aber geschlossen',
    targetWorkpackages: ['WP-E13-02']
  },
  {
    id: 'network-evidence',
    title: 'Network-Gate-Resultate sind als Evidence/Deferral vorbereitet',
    reason: 'Audit/SBOM bleiben vor Publish owner-pflichtig',
    targetWorkpackages: ['WP-E13-03']
  },
  {
    id: 'package-export-lock',
    title: 'Package Dry Run und Export Surface sind als Lock vorbereitet',
    reason: 'Paketinhalt bleibt fuer RC1 maschinenlesbar pruefbar',
    targetWorkpackages: ['WP-E13-04']
  },
  {
    id: 'known-residuals',
    title: 'RC0-Residuals sind fuer RC1 triagiert',
    reason: 'xstate und x-utils sind Boundary-Contracts; Hydration wurde in WP-E13-06 owner-frei geschlossen',
    targetWorkpackages: ['WP-E13-05', 'WP-E13-06']
  },
  {
    id: 'prod-browser-csp',
    title: 'PROD-nahe CSP-/Server-Smokes sind vorbereitet',
    reason: 'WP-E13-07 stellt Fixture, Local-Server-CSP-Header und Same-Origin-Policy bereit; WP-E13-11 hat Trusted DOM browsernah geprueft',
    targetWorkpackages: ['WP-E13-07']
  },
  {
    id: 'visual-owner-artifact',
    title: 'Screenshot-/Pixel-Artefakt ist als optionales RC1-Owner-Artefakt normalisiert',
    reason: 'WP-E13-08 legt Manifest, deterministische Viewports und Pfadkonventionen fest; Pixel-Diff bleibt lokal optional',
    targetWorkpackages: []
  },
  {
    id: 'rmt-production-readiness',
    title: 'RMT-first PROD App Readiness ist als RC1-Schnitt gebuendelt',
    reason: 'WP-E13-09 buendelt Shell, Routing, Components, Fabric, Lanes, Diagnostics und Artefakt-Paritaet',
    targetWorkpackages: []
  },
  {
    id: 'docs-rmt-production-hardening',
    title: 'Docs-App RMT Parsedown Shell ist PROD-nah gehaertet',
    reason: 'WP-E13-10 stabilisiert Extension-Slots; WP-E13-11 prueft Trusted DOM, Parsedown und RMT HTML Boundary browsernah',
    targetWorkpackages: []
  },
  {
    id: 'trusted-dom-boundary',
    title: 'Trusted DOM, Parsedown und RMT HTML Boundary sind browsernah geprueft',
    reason: 'WP-E13-11 beweist Sanitizer, Fixture, CSP-Anschluss und Host-Sink ohne RMT-Kernel-Kopplung',
    targetWorkpackages: []
  },
  {
    id: 'rc1-migration-notes',
    title: 'RC1 Migration Notes und SemVer-Entscheid sind vorbereitet',
    reason: 'WP-E13-12 macht Konsumentenkommunikation, SemVer-Entscheid und Changelog-Pflichten maschinenlesbar',
    targetWorkpackages: []
  },
  {
    id: 'rc1-handoff',
    title: 'RC1 finaler Handoff fehlt',
    reason: 'RC1 darf erst nach explizitem Abschluss entscheidungsreif sein',
    targetWorkpackages: ['WP-E13-14']
  }
]);

const WORKPACKAGES = Object.freeze([
  ['WP-E13-01', 'P0', 'completed', 'WS0', 'RC1 Readiness Model und Gate-Abgleich einfrieren', ['WP-E12-16']],
  ['WP-E13-02', 'P0', 'completed', 'WS0', 'Release Owner Acceptance Contract definieren', ['WP-E13-01']],
  ['WP-E13-03', 'P0', 'completed', 'WS1', 'Conditional Network Gate Evidence vorbereiten', ['WP-E13-02']],
  ['WP-E13-04', 'P0', 'completed', 'WS1', 'Package Dry Run Artefakt und Export-Surface-Lock bauen', ['WP-E13-02']],
  ['WP-E13-05', 'P0', 'completed', 'WS2', 'RC0 Known Residuals fuer RC1 triagieren', ['WP-E13-01']],
  ['WP-E13-06', 'P0', 'completed', 'WS2', 'Hydration Performance Warning schliessen oder RC1 Owner-Entscheid bauen', ['WP-E13-05']],
  ['WP-E13-07', 'P1', 'completed', 'WS3', 'PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten', ['WP-E13-03', 'WP-E13-04']],
  ['WP-E13-08', 'P1', 'completed', 'WS3', 'Visual Screenshot/Pixels als RC1-Artefakt normalisieren', ['WP-E13-07']],
  ['WP-E13-09', 'P1', 'completed', 'WS4', 'RMT-first App Production Readiness Gate buendeln', ['WP-E13-01', 'WP-E13-08']],
  ['WP-E13-10', 'P1', 'completed', 'WS4', 'Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten', ['WP-E13-09']],
  ['WP-E13-11', 'P1', 'completed', 'WS5', 'Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen', ['WP-E13-10']],
  ['WP-E13-12', 'P1', 'completed', 'WS6', 'RC1 Migration Notes, SemVer-Entscheid und Changelog vorbereiten', ['WP-E13-04', 'WP-E13-05']],
  ['WP-E13-13', 'P2', 'ready', 'WS7', 'RC1 Gate Matrix und CI-Handoff erstellen', ['WP-E13-03', 'WP-E13-04', 'WP-E13-05', 'WP-E13-06', 'WP-E13-07', 'WP-E13-08', 'WP-E13-09', 'WP-E13-10', 'WP-E13-11', 'WP-E13-12']],
  ['WP-E13-14', 'P2', 'planned', 'WS8', 'Epic-13-Abschlussreview und RC1-Handoff erstellen', ['WP-E13-13']]
]).map(([id, priority, status, workstream, title, dependencies]) => ({
  id,
  priority,
  status,
  workstream,
  title,
  dependencies
}));

const FEATURE_DRIFT_DECISIONS = Object.freeze([
  { risk: 'xtend-embedded-in-rmt-kernel', decision: 'rejected', reason: 'RMT bleibt host-neutral' },
  { risk: 'cdn-fallbacks-return', decision: 'rejected', reason: 'lokale und same-origin ESM-Pfade bleiben Standard' },
  { risk: 'new-product-features-without-prod-readiness-purpose', decision: 'rejected', reason: 'nur Gate-Fixtures fuer PROD-Readiness sind erlaubt' },
  { risk: 'large-component-design-refresh', decision: 'rejected', reason: 'nur konkrete A11y-, Performance- oder Visual-Gate-Luecken sind Scope' },
  { risk: 'hard-pixel-default-gate', decision: 'rejected-for-local-default', reason: 'Pixel-Artefakte muessen umgebungsstabil sein' },
  { risk: 'automatic-publish-boundary-open', decision: 'rejected', reason: 'Publish bleibt Release-Owner-Entscheidung' }
]);

function summarizeWorkpackages(workpackages) {
  return workpackages.reduce((summary, workpackage) => {
    summary.byStatus[workpackage.status] = (summary.byStatus[workpackage.status] || 0) + 1;
    if (workpackage.status === 'completed') summary.completed.push(workpackage.id);
    if (workpackage.status === 'ready') summary.ready.push(workpackage.id);
    if (workpackage.status === 'planned') summary.planned.push(workpackage.id);
    return summary;
  }, {
    total: workpackages.length,
    byStatus: {},
    completed: [],
    ready: [],
    planned: []
  });
}

function createEpic13Rc1ReadinessModel(options = {}) {
  const rc0Handoff = options.rc0Handoff || createEpic12Rc0HandoffPlan(options);
  const rc0HandoffReport = options.rc0HandoffReport || createEpic12Rc0HandoffReport({ ...options, plan: rc0Handoff });
  const rc0HandoffValidation = options.rc0HandoffValidation || validateEpic12Rc0HandoffPlan(rc0Handoff);
  const rc0Matrix = options.rc0Matrix || createEpic12Rc0GateMatrix(options);
  const rc0MatrixReport = options.rc0MatrixReport || createEpic12Rc0GateMatrixReport({ ...options, matrix: rc0Matrix });
  const rc0MatrixValidation = options.rc0MatrixValidation || validateEpic12Rc0GateMatrix(rc0Matrix);
  const workpackageSummary = summarizeWorkpackages(WORKPACKAGES);

  return {
    schema: EPIC13_RC1_READINESS_SCHEMA,
    reportSchema: EPIC13_RC1_READINESS_REPORT_SCHEMA,
    workpackage: EPIC13_RC1_READINESS_WORKPACKAGE,
    status: EPIC13_RC1_READINESS_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC13_RC1_READINESS_MODULE,
    suite: EPIC13_RC1_READINESS_SUITE,
    steeringDocument: EPIC13_RC1_READINESS_STEERING,
    contract: EPIC13_RC1_READINESS_CONTRACT,
    workpackageDocument: EPIC13_RC1_READINESS_WORKPACKAGE_DOC,
    docs: EPIC13_RC1_READINESS_DOCS,
    localGate: EPIC13_RC1_READINESS_LOCAL_GATE,
    packageScript: EPIC13_RC1_READINESS_PACKAGE_SCRIPT,
    sourceReleaseCandidate: 'RC0',
    targetReleaseCandidate: 'RC1',
    sourceDecision: rc0Handoff.releaseReadiness.decision,
    sourceNextDecision: rc0Handoff.nextDecision,
    targetReadiness: EPIC13_RC1_READINESS_TARGET,
    nextDecision: 'rc1-gate-matrix-ci-handoff',
    nextWorkpackage: 'WP-E13-13',
    kernelBoundary: KERNEL_BOUNDARY,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true,
    sourceSchemas: [
      rc0Handoff.schema,
      rc0Matrix.schema,
      'xtend.release.checklist-semver-policy.v1',
      'xtend.ci.gate-matrix.v1'
    ],
    baselineValidations: {
      rc0Handoff: rc0HandoffValidation.ok,
      rc0GateMatrix: rc0MatrixValidation.ok,
      rc0HandoffReport: rc0HandoffReport.ok,
      rc0GateMatrixReport: rc0MatrixReport.ok
    },
    baselineGates: REQUIRED_BASELINE_GATES.slice(),
    gateMappings: GATE_MAPPINGS.map((entry) => ({ ...entry })),
    gateGaps: GATE_GAPS.map((entry) => ({ ...entry, targetWorkpackages: entry.targetWorkpackages.slice() })),
    workpackages: WORKPACKAGES.map((entry) => ({ ...entry, dependencies: entry.dependencies.slice() })),
    workpackageSummary,
    featureDriftDecisions: FEATURE_DRIFT_DECISIONS.map((entry) => ({ ...entry })),
    rc1ReadinessCriteria: [
      'all-local-release-gates-green',
      'conditional-network-gates-run-or-owner-deferred',
      'package-dry-run-export-surface-reviewed',
      'private-true-until-release-owner-acceptance',
      'rc0-residuals-closed-or-renewed-for-rc1',
      'prod-like-browser-a11y-performance-security-rmt-docs-paths-reviewed',
      'changelog-readme-docs-and-migration-notes-current',
      'xtend.epic13.rc1-handoff.v1-produces-rc1-production-candidate-ready'
    ],
    rc0Snapshot: {
      completedEpic12Workpackages: rc0Handoff.epicCompletion.completedWorkpackages.length,
      rc0KpiFailed: rc0Handoff.kpiSummary.failed,
      ownerReviewRequired: rc0Handoff.kpiSummary.ownerReviewRequired,
      acceptedResidualCount: rc0Matrix.summary.acceptedResidualCount,
      requiredLocalGateCount: rc0Matrix.summary.requiredLocalGateCount,
      conditionalNetworkGateCount: rc0Matrix.summary.conditionalNetworkGateCount,
      visualSnapshotDomDiffCount: rc0Handoff.sourceSnapshots.visualSnapshotDomDiffCount,
      sourceCoveragePercent: rc0Handoff.sourceSnapshots.sourceCoveragePercent
    },
    rc1Inputs: {
      snapshotSuites: RC0_SNAPSHOT_SUITES.slice(),
      rmtAuthoringSuites: RC0_AUTHORING_SUITES.slice(),
      releaseMustInclude: RC0_RELEASE_MUST_INCLUDE.slice(),
      conditionalNetworkGates: CONDITIONAL_NETWORK_COMMANDS.slice(),
      requiredDocs: REQUIRED_DOCS.slice()
    }
  };
}

function validateEpic13Rc1ReadinessModel(model = createEpic13Rc1ReadinessModel()) {
  const errors = [];

  if (!model || model.schema !== EPIC13_RC1_READINESS_SCHEMA) errors.push(`schema must be ${EPIC13_RC1_READINESS_SCHEMA}`);
  if (!model || model.reportSchema !== EPIC13_RC1_READINESS_REPORT_SCHEMA) errors.push(`reportSchema must be ${EPIC13_RC1_READINESS_REPORT_SCHEMA}`);
  if (!model || model.workpackage !== EPIC13_RC1_READINESS_WORKPACKAGE) errors.push(`workpackage must be ${EPIC13_RC1_READINESS_WORKPACKAGE}`);
  if (!model || model.status !== EPIC13_RC1_READINESS_STATUS) errors.push(`status must be ${EPIC13_RC1_READINESS_STATUS}`);
  if (!model || model.targetReadiness !== EPIC13_RC1_READINESS_TARGET) errors.push(`targetReadiness must be ${EPIC13_RC1_READINESS_TARGET}`);
  if (!model || model.sourceDecision !== 'ready-for-release-owner-review-not-publish') errors.push('source decision must be RC0 review-ready but not publish-ready');
  if (!model || model.sourceNextDecision !== 'release-owner-acceptance') errors.push('source next decision must be release owner acceptance');
  if (!model || model.nextDecision !== 'rc1-gate-matrix-ci-handoff') errors.push('next decision must be RC1 Gate Matrix und CI-Handoff');
  if (!model || model.nextWorkpackage !== 'WP-E13-13') errors.push('next workpackage must be WP-E13-13');
  if (!model || model.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);
  if (!model || model.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!model || model.publishAllowed !== false || model.packagePrivateRequired !== true) errors.push('RC1 readiness must keep publish blocked and package private');
  REQUIRED_SOURCE_SCHEMAS.forEach((schema) => {
    if (!model || !model.sourceSchemas.includes(schema)) errors.push(`source schema missing: ${schema}`);
  });
  REQUIRED_BASELINE_GATES.forEach((gate) => {
    if (!model || !model.baselineGates.includes(gate)) errors.push(`baseline gate missing: ${gate}`);
  });
  if (!model || !Object.values(model.baselineValidations).every(Boolean)) errors.push('all RC0 baseline validations must be green');
  if (!model || model.gateMappings.length !== GATE_MAPPINGS.length) errors.push('all gate mappings must be present');
  if (!model || model.gateGaps.length !== GATE_GAPS.length) errors.push('all RC1 gate gaps must be present');
  if (!model || model.workpackages.length !== 14) errors.push('Epic 13 must expose 14 workpackages');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-01')) errors.push('WP-E13-01 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-02')) errors.push('WP-E13-02 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-03')) errors.push('WP-E13-03 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-04')) errors.push('WP-E13-04 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-05')) errors.push('WP-E13-05 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-06')) errors.push('WP-E13-06 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-07')) errors.push('WP-E13-07 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-08')) errors.push('WP-E13-08 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-09')) errors.push('WP-E13-09 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-10')) errors.push('WP-E13-10 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-11')) errors.push('WP-E13-11 must be completed');
  if (!model || !model.workpackageSummary.completed.includes('WP-E13-12')) errors.push('WP-E13-12 must be completed');
  if (!model || !model.workpackageSummary.ready.includes('WP-E13-13')) errors.push('WP-E13-13 must be ready');
  if (!model || model.featureDriftDecisions.some((entry) => entry.decision === 'accepted')) errors.push('feature drift must not be accepted in WP-E13-01');
  if (!model || model.rc0Snapshot.rc0KpiFailed !== 0) errors.push('RC0 source must not contain failed KPI decisions');
  if (!model || model.rc0Snapshot.visualSnapshotDomDiffCount !== 0) errors.push('RC0 visual DOM snapshot diff count must be zero');
  if (!model || !model.rc1ReadinessCriteria.includes('xtend.epic13.rc1-handoff.v1-produces-rc1-production-candidate-ready')) errors.push('RC1 handoff criterion must be present');

  return {
    schema: EPIC13_RC1_READINESS_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic13Rc1ReadinessReport(options = {}) {
  const model = options.model || createEpic13Rc1ReadinessModel(options);
  const validation = validateEpic13Rc1ReadinessModel(model);

  return {
    schema: EPIC13_RC1_READINESS_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    model,
    gateMappingCount: model.gateMappings.length,
    gateGapCount: model.gateGaps.length,
    workpackageCount: model.workpackages.length,
    completedWorkpackages: model.workpackageSummary.completed.slice(),
    readyWorkpackages: model.workpackageSummary.ready.slice(),
    targetReadiness: model.targetReadiness,
    publishAllowed: model.publishAllowed,
    nextWorkpackage: model.nextWorkpackage
  };
}

module.exports = {
  EPIC13_RC1_READINESS_CONTRACT,
  EPIC13_RC1_READINESS_DOCS,
  EPIC13_RC1_READINESS_LOCAL_GATE,
  EPIC13_RC1_READINESS_MODULE,
  EPIC13_RC1_READINESS_PACKAGE_SCRIPT,
  EPIC13_RC1_READINESS_REPORT_SCHEMA,
  EPIC13_RC1_READINESS_SCHEMA,
  EPIC13_RC1_READINESS_STATUS,
  EPIC13_RC1_READINESS_STEERING,
  EPIC13_RC1_READINESS_SUITE,
  EPIC13_RC1_READINESS_TARGET,
  EPIC13_RC1_READINESS_WORKPACKAGE,
  EPIC13_RC1_READINESS_WORKPACKAGE_DOC,
  FEATURE_DRIFT_DECISIONS,
  GATE_GAPS,
  GATE_MAPPINGS,
  REQUIRED_BASELINE_GATES,
  REQUIRED_DOCS,
  REQUIRED_SOURCE_SCHEMAS,
  WORKPACKAGES,
  createEpic13Rc1ReadinessModel,
  createEpic13Rc1ReadinessReport,
  validateEpic13Rc1ReadinessModel
};

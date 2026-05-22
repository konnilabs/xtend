'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('./vnext-compiler');

const RMT_VNEXT_RELEASE_HANDOFF_SCHEMA = 'xtend.rmt.vnext-release-handoff.v1';
const RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA = 'xtend.rmt.vnext-release-handoff-report.v1';
const RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA = 'xtend.rmt.vnext-release-gate-matrix.v1';
const RMT_VNEXT_RELEASE_WORKPACKAGE = 'WP-E15-18';
const RMT_VNEXT_RELEASE_MODULE_PATH = 'tools/rmt-language/vnext-release.js';
const RMT_VNEXT_RELEASE_SUITE_PATH = 'tests/rmt-language/rmt_vnext_release_handoff_suite.js';
const RMT_VNEXT_RELEASE_CONTRACT_PATH = 'development/XTendRMT-vNext-Release-Handoff-Contract.md';
const RMT_VNEXT_RELEASE_WORKPACKAGE_PATH = 'development/WP-E15-18-Docs-Reference-Demo-Release-Gates-und-Handoff-finalisieren.md';
const RMT_VNEXT_AUTHORING_GUIDE_PATH = 'docs/rmt-vnext-authoring.md';
const RMT_VNEXT_MIGRATION_NOTES_PATH = 'docs/rmt-vnext-migration-notes.md';
const RMT_VNEXT_RELEASE_HANDOFF_DOC_PATH = 'docs/rmt-vnext-release-handoff.md';
const RMT_VNEXT_REFERENCE_DEMO_PATH = 'xtendrmt/rmt-vnext-reference-demo.rmt';
const RMT_VNEXT_REFERENCE_CORE_PATH = 'xtendrmt/rmt-vnext-reference-demo.core.json';
const RMT_VNEXT_RELEASE_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-release';
const RMT_VNEXT_RELEASE_LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-vnext-release --json';

const RMT_VNEXT_RELEASE_DOCS = Object.freeze([
  RMT_VNEXT_AUTHORING_GUIDE_PATH,
  RMT_VNEXT_MIGRATION_NOTES_PATH,
  RMT_VNEXT_RELEASE_HANDOFF_DOC_PATH
]);

const RMT_VNEXT_RELEASE_GATES = Object.freeze([
  'npm run test:rmt-vnext-parser',
  'npm run test:rmt-semantic-graph',
  'npm run test:rmt-vnext-compiler',
  'npm run test:rmt-vnext-source-to-sea',
  'npm run test:rmt-vnext-source-to-sea:evidence',
  'npm run test:rmt-vnext-source-to-sea:chromedriver',
  'npm run test:rmt-vnext-lifecycle',
  'npm run test:rmt-vnext-scheduler',
  'npm run test:rmt-vnext-surfaces',
  'npm run test:rmt-vnext-conditions',
  'npm run test:rmt-vnext-composition',
  'npm run test:rmt-vnext-imports',
  'npm run test:rmt-vnext-events',
  'npm run test:rmt-vnext-security',
  'npm run test:rmt-vnext-streaming',
  'npm run test:rmt-vnext-tooling',
  'npm run test:rmt-vnext-compatibility',
  'npm run test:rmt-vnext-primitives:report',
  'npm run test:rmt-vnext-regression',
  'npm run test:browser',
  'npm run test:references'
]);

const RMT_VNEXT_ACCEPTED_CONTRACTS = Object.freeze([
  'xtend.rmt.vnext-syntax.v1',
  'xtend.epic15.wp01.vnext-syntax-scope-source-of-truth.v1',
  'xtend.rmt.vnext.grammar.v1',
  'xtend.rmt.core-format.vnext.v1',
  'xtend.rmt.vnext-parser.v1',
  'xtend.rmt.vnext-compiler.v1',
  'xtend.rmt.vnext-lifecycle.v1',
  'xtend.rmt.vnext-scheduler-policy.v1',
  'xtend.rmt.vnext-surface-registry.v1',
  'xtend.rmt.vnext-condition-contract.v1',
  'xtend.rmt.vnext-composition.v1',
  'xtend.rmt.vnext-import-resolver.v1',
  'xtend.rmt.vnext-event-action-contract.v1',
  'xtend.rmt.vnext-security-policy-contract.v1',
  'xtend.rmt.vnext-streaming-contract.v1',
  'xtend.rmt.vnext-tooling-adapter.v1',
  'xtend.rmt.vnext-compatibility-matrix.v1',
  'xtend.rmt.vnext-regression-gate.v1',
  RMT_VNEXT_RELEASE_HANDOFF_SCHEMA
]);

const RMT_VNEXT_FOLLOW_UP_EPICS = Object.freeze([
  {
    id: 'rmt-vnext-runtime-adapters',
    title: 'vNext Core an produktive Runtime Adapter anbinden',
    scope: 'Surface-, Lifecycle-, Scheduler-, Security- und Streaming-Core in Host-Adapter ueberfuehren.'
  },
  {
    id: 'rmt-vnext-formatter-writer',
    title: 'Formatter und Writer API fuer vNext Authoring',
    scope: 'Format-preserving Edits, stabile Pretty-Print-Regeln und LSP-Formatierung.'
  },
  {
    id: 'rmt-vnext-project-index',
    title: 'Workspace Project Index, Rename und References',
    scope: 'Multi-File-Symbolindex, sichere Refactors und Referenzsuche.'
  },
  {
    id: 'rmt-vnext-editor-distribution',
    title: 'Editor Packages und Marketplace Distribution',
    scope: 'VS Code, JetBrains, Neovim und Helix Packaging auf dem vNext Language Layer.'
  }
]);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function createGateMatrix() {
  return {
    schema: RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_RELEASE_WORKPACKAGE,
    gates: RMT_VNEXT_RELEASE_GATES.map((command) => ({
      command,
      required: true,
      status: 'accepted-local-gate'
    }))
  };
}

function createRmtVNextReleaseHandoffPlan(options = {}) {
  return {
    schema: RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
    reportSchema: RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA,
    gateMatrixSchema: RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA,
    workpackage: RMT_VNEXT_RELEASE_WORKPACKAGE,
    status: 'accepted-vnext-release-handoff',
    targetReadiness: 'rmt-vnext-release-ready',
    localGate: RMT_VNEXT_RELEASE_LOCAL_GATE,
    packageScript: RMT_VNEXT_RELEASE_PACKAGE_SCRIPT,
    docs: RMT_VNEXT_RELEASE_DOCS.slice(),
    referenceDemo: RMT_VNEXT_REFERENCE_DEMO_PATH,
    referenceCoreOutput: RMT_VNEXT_REFERENCE_CORE_PATH,
    acceptedContracts: RMT_VNEXT_ACCEPTED_CONTRACTS.slice(),
    gateMatrix: createGateMatrix(),
    followUpEpicCandidates: RMT_VNEXT_FOLLOW_UP_EPICS.map((entry) => ({ ...entry })),
    residualRisks: [
      {
        id: 'runtime-adapter-production-binding',
        status: 'planned-follow-up',
        owner: 'future-runtime-epic'
      },
      {
        id: 'formatter-not-production-released',
        status: 'planned-follow-up',
        owner: 'future-tooling-epic'
      },
      {
        id: 'workspace-index-file-local',
        status: 'planned-follow-up',
        owner: 'future-project-index-epic'
      }
    ],
    publishBoundary: options.publishBoundary || 'source-ready-not-public-runtime-release',
    networkRequired: false,
    kernelBoundary: 'no-rmt-kernel-import-of-host-runtime-types'
  };
}

function validateRmtVNextReleaseHandoffPlan(plan = {}) {
  const diagnostics = [];
  const requiredDocs = RMT_VNEXT_RELEASE_DOCS;

  if (plan.schema !== RMT_VNEXT_RELEASE_HANDOFF_SCHEMA) diagnostics.push('schema');
  if (plan.reportSchema !== RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA) diagnostics.push('reportSchema');
  if (plan.gateMatrixSchema !== RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA) diagnostics.push('gateMatrixSchema');
  if (plan.workpackage !== RMT_VNEXT_RELEASE_WORKPACKAGE) diagnostics.push('workpackage');
  if (plan.status !== 'accepted-vnext-release-handoff') diagnostics.push('status');
  requiredDocs.forEach((docPath) => {
    if (!toArray(plan.docs).includes(docPath)) diagnostics.push(`docs:${docPath}`);
  });
  RMT_VNEXT_RELEASE_GATES.forEach((command) => {
    const hasGate = plan.gateMatrix && toArray(plan.gateMatrix.gates).some((gate) => gate.command === command);
    if (!hasGate) diagnostics.push(`gate:${command}`);
  });
  if (!toArray(plan.acceptedContracts).includes('xtend.rmt.vnext-regression-gate.v1')) diagnostics.push('acceptedContracts:regression');
  if (!toArray(plan.acceptedContracts).includes(RMT_VNEXT_RELEASE_HANDOFF_SCHEMA)) diagnostics.push('acceptedContracts:release');
  if (toArray(plan.followUpEpicCandidates).length < 3) diagnostics.push('followUpEpicCandidates');

  return {
    schema: RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_RELEASE_WORKPACKAGE,
    ok: diagnostics.length === 0,
    diagnostics
  };
}

function createReferenceDemoReport(options = {}) {
  if (typeof options.readFile !== 'function') {
    return {
      ok: false,
      status: 'missing-reader',
      diagnostic: 'readFile option required'
    };
  }

  const source = options.readFile(RMT_VNEXT_REFERENCE_DEMO_PATH);
  const expectedCore = options.readFile(RMT_VNEXT_REFERENCE_CORE_PATH);
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: RMT_VNEXT_REFERENCE_DEMO_PATH,
    version: 15
  });
  const coreDocument = compileResult.coreDocument || {};
  const counts = {
    imports: toArray(coreDocument.imports).length,
    templates: toArray(coreDocument.templates).length,
    surfaces: toArray(coreDocument.surfaces).length,
    lanes: toArray(coreDocument.lanes).length,
    operations: toArray(coreDocument.operations).length,
    slots: toArray(coreDocument.slots).length,
    events: toArray(coreDocument.events).length,
    dataSources: toArray(coreDocument.dataSources).length,
    securityPolicies: toArray(coreDocument.securityPolicies).length,
    sourceMap: toArray(coreDocument.sourceMap).length
  };
  const requiredCoverage = {
    templates: counts.templates >= 1,
    surfaces: counts.surfaces >= 3,
    lanes: counts.lanes >= 4,
    conditions: toArray(coreDocument.operations).some((operation) => operation.condition),
    slots: counts.slots >= 3,
    events: counts.events >= 2,
    security: counts.securityPolicies >= 4,
    streaming: toArray(coreDocument.operations).some((operation) => operation.kind === 'stream')
  };
  const coreOutputMatches = compileResult.ok === true && compileResult.coreJson === expectedCore;
  const ok = compileResult.ok === true && coreOutputMatches && Object.values(requiredCoverage).every(Boolean);

  return {
    ok,
    status: ok ? 'passed' : 'failed',
    coreSchema: coreDocument.schema || null,
    documentId: coreDocument.manifest ? coreDocument.manifest.documentId : null,
    coreOutputMatches,
    counts,
    requiredCoverage,
    diagnosticCodes: toArray(compileResult.diagnostics).map((diagnostic) => diagnostic.code)
  };
}

function createRmtVNextReleaseHandoffReport(options = {}) {
  const plan = options.plan || createRmtVNextReleaseHandoffPlan(options);
  const validation = validateRmtVNextReleaseHandoffPlan(plan);
  const referenceDemo = createReferenceDemoReport(options);
  const ok = validation.ok && referenceDemo.ok;

  return {
    schema: RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_RELEASE_WORKPACKAGE,
    status: ok ? 'passed' : 'failed',
    ok,
    plan,
    validation,
    referenceDemo,
    gateMatrix: plan.gateMatrix
  };
}

function createRmtVNextReleaseHandoffAdapter(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
    reportSchema: RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_RELEASE_WORKPACKAGE,
    createPlan: (options = {}) => createRmtVNextReleaseHandoffPlan({
      ...defaultOptions,
      ...options
    }),
    validatePlan: validateRmtVNextReleaseHandoffPlan,
    createReport: (options = {}) => createRmtVNextReleaseHandoffReport({
      ...defaultOptions,
      ...options
    })
  });
}

module.exports = {
  RMT_VNEXT_ACCEPTED_CONTRACTS,
  RMT_VNEXT_AUTHORING_GUIDE_PATH,
  RMT_VNEXT_FOLLOW_UP_EPICS,
  RMT_VNEXT_MIGRATION_NOTES_PATH,
  RMT_VNEXT_REFERENCE_CORE_PATH,
  RMT_VNEXT_REFERENCE_DEMO_PATH,
  RMT_VNEXT_RELEASE_CONTRACT_PATH,
  RMT_VNEXT_RELEASE_DOCS,
  RMT_VNEXT_RELEASE_GATE_MATRIX_SCHEMA,
  RMT_VNEXT_RELEASE_GATES,
  RMT_VNEXT_RELEASE_HANDOFF_DOC_PATH,
  RMT_VNEXT_RELEASE_HANDOFF_REPORT_SCHEMA,
  RMT_VNEXT_RELEASE_HANDOFF_SCHEMA,
  RMT_VNEXT_RELEASE_LOCAL_GATE,
  RMT_VNEXT_RELEASE_MODULE_PATH,
  RMT_VNEXT_RELEASE_PACKAGE_SCRIPT,
  RMT_VNEXT_RELEASE_SUITE_PATH,
  RMT_VNEXT_RELEASE_WORKPACKAGE,
  RMT_VNEXT_RELEASE_WORKPACKAGE_PATH,
  RMT_VNEXT_CORE_SCHEMA,
  createGateMatrix,
  createReferenceDemoReport,
  createRmtVNextReleaseHandoffAdapter,
  createRmtVNextReleaseHandoffPlan,
  createRmtVNextReleaseHandoffReport,
  validateRmtVNextReleaseHandoffPlan
};

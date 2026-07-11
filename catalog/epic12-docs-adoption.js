const EPIC12_DOCS_ADOPTION_SCHEMA = 'xtend.epic12.docs-adoption.v1';
const EPIC12_DOCS_ADOPTION_REPORT_SCHEMA = 'xtend.epic12.docs-adoption-report.v1';
const EPIC12_DOCS_ADOPTION_STATUS = 'accepted-docs-adoption';
const EPIC12_DOCS_ADOPTION_WORKPACKAGE = 'WP-E12-15';
const EPIC12_DOCS_ADOPTION_MODULE = 'catalog/epic12-docs-adoption.js';
const EPIC12_DOCS_ADOPTION_CONTRACT = 'development/XTend-Epic12-Docs-Migration-und-Adoption-Guide.md';
const EPIC12_DOCS_ADOPTION_WORKPACKAGE_DOC = 'development/WP-E12-15-Docs-Migration-Notes-und-Enterprise-Adoption-Guide-aktualisieren.md';
const EPIC12_DOCS_ADOPTION_DOCS = 'docs/rc0-adoption-guide.md';
const EPIC12_DOCS_ADOPTION_SUITE = 'tests/docs/epic12_docs_adoption_suite.js';
const EPIC12_DOCS_ADOPTION_LOCAL_GATE = 'node scripts/run_xtend_tests.js epic12-docs-adoption --json';
const EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT = 'npm run test:epic12-docs-adoption';
const PUBLISH_BOUNDARY = 'private-until-release-owner-approval';
const KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';

const REQUIRED_DOCS = Object.freeze([
  'docs/rc0-adoption-guide.md',
  'docs/enterprise-adoption.md',
  'docs/en/component-long-tail-migration.md',
  'docs/visual-snapshot-automation.md',
  'docs/design-tokens.md',
  'docs/rmt-dsl-authoring-polish.md',
  'docs/rc0-gate-matrix.md',
  'docs/en/README.md',
  'docs/menu.json'
]);

const MIGRATION_NOTE_TOPICS = Object.freeze([
  'long-tail-runtime-closure',
  'dom-first-visual-snapshots',
  'design-token-productization',
  'rmt-dsl-authoring-polish',
  'rc0-gate-matrix',
  'known-residual-policy',
  'publish-boundary'
]);

const ADOPTION_STAGES = Object.freeze([
  'local-baseline',
  'ui-component-baseline',
  'fabric-telemetry-baseline',
  'rmt-shell-first-baseline',
  'security-baseline',
  'performance-a11y-baseline',
  'snapshot-and-design-token-baseline',
  'rc0-review-baseline'
]);

function createEpic12DocsAdoptionGuide(options = {}) {
  return {
    schema: EPIC12_DOCS_ADOPTION_SCHEMA,
    reportSchema: EPIC12_DOCS_ADOPTION_REPORT_SCHEMA,
    workpackage: EPIC12_DOCS_ADOPTION_WORKPACKAGE,
    status: EPIC12_DOCS_ADOPTION_STATUS,
    generatedAt: options.generatedAt || 'static-local',
    module: EPIC12_DOCS_ADOPTION_MODULE,
    contract: EPIC12_DOCS_ADOPTION_CONTRACT,
    workpackageDocument: EPIC12_DOCS_ADOPTION_WORKPACKAGE_DOC,
    docs: EPIC12_DOCS_ADOPTION_DOCS,
    suite: EPIC12_DOCS_ADOPTION_SUITE,
    localGate: EPIC12_DOCS_ADOPTION_LOCAL_GATE,
    packageScript: EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT,
    publishBoundary: PUBLISH_BOUNDARY,
    publishAllowed: false,
    packagePrivateRequired: true,
    kernelBoundary: KERNEL_BOUNDARY,
    sourceContracts: [
      'xtend.epic12.rc-hardening-model.v1',
      'xtend.epic12.rc0-gate-matrix.v1',
      'xtend.epic12.visual-snapshot-runner.v1',
      'xtend.design-tokens.product-contract.v1',
      'xtend.rmt.dsl-authoring-polish.v1',
      'xtend.docs.enterprise-adoption.v1'
    ],
    requiredDocs: REQUIRED_DOCS.slice(),
    migrationNotes: {
      status: 'rc0-docs-current',
      topics: MIGRATION_NOTE_TOPICS.slice(),
      componentAuthors: [
        'use xtend-loader.js and local manifests',
        'keep XTendRMT host-neutral',
        'prefer dom_descriptor over html_fragment',
        'publish CSS Parts, tokens, events and types as public contracts',
        'run rc0-gate-matrix before owner review'
      ],
      appAuthors: [
        'compose XTend Apps shell-first through RMT where possible',
        'map XRouter routes through native RMT route records',
        'treat Parsedown or rich media as scheduled RMT content components',
        'document conditional network gates when offline'
      ]
    },
    adoptionStages: ADOPTION_STAGES.slice(),
    requiredGates: [
      'node scripts/run_xtend_tests.js epic12-docs-adoption --json',
      'node scripts/run_xtend_tests.js references --json',
      'node scripts/run_xtend_tests.js rc0-gate-matrix --json',
      'npm run test:release:full:report',
      'npm run pack:dry-run'
    ],
    conditionalNetworkGates: [
      'npm audit --audit-level=moderate',
      'npm sbom --sbom-format=cyclonedx --json'
    ],
    knownResiduals: [
      'xstate',
      'x-utils',
      'xtend.component.hydrate'
    ],
    handoff: ['WP-E12-16']
  };
}

function validateEpic12DocsAdoptionGuide(guide = createEpic12DocsAdoptionGuide()) {
  const errors = [];

  if (!guide || guide.schema !== EPIC12_DOCS_ADOPTION_SCHEMA) errors.push(`schema must be ${EPIC12_DOCS_ADOPTION_SCHEMA}`);
  if (!guide || guide.workpackage !== EPIC12_DOCS_ADOPTION_WORKPACKAGE) errors.push(`workpackage must be ${EPIC12_DOCS_ADOPTION_WORKPACKAGE}`);
  if (!guide || guide.status !== EPIC12_DOCS_ADOPTION_STATUS) errors.push(`status must be ${EPIC12_DOCS_ADOPTION_STATUS}`);
  if (!guide || guide.publishAllowed !== false || guide.packagePrivateRequired !== true) errors.push('Docs adoption must keep publish blocked and package private');
  if (!guide || guide.publishBoundary !== PUBLISH_BOUNDARY) errors.push(`publishBoundary must be ${PUBLISH_BOUNDARY}`);
  if (!guide || guide.kernelBoundary !== KERNEL_BOUNDARY) errors.push(`kernelBoundary must be ${KERNEL_BOUNDARY}`);

  REQUIRED_DOCS.forEach((doc) => {
    if (!guide.requiredDocs || !guide.requiredDocs.includes(doc)) errors.push(`requiredDocs missing ${doc}`);
  });
  MIGRATION_NOTE_TOPICS.forEach((topic) => {
    if (!guide.migrationNotes || !guide.migrationNotes.topics.includes(topic)) errors.push(`migrationNotes missing ${topic}`);
  });
  ADOPTION_STAGES.forEach((stage) => {
    if (!guide.adoptionStages || !guide.adoptionStages.includes(stage)) errors.push(`adoptionStages missing ${stage}`);
  });
  ['xtend.epic12.rc0-gate-matrix.v1', 'xtend.docs.enterprise-adoption.v1'].forEach((schema) => {
    if (!guide.sourceContracts || !guide.sourceContracts.includes(schema)) errors.push(`sourceContracts missing ${schema}`);
  });
  ['WP-E12-16'].forEach((handoff) => {
    if (!guide.handoff || !guide.handoff.includes(handoff)) errors.push(`handoff missing ${handoff}`);
  });

  return {
    schema: EPIC12_DOCS_ADOPTION_REPORT_SCHEMA,
    ok: errors.length === 0,
    errors
  };
}

function createEpic12DocsAdoptionReport(options = {}) {
  const guide = options.guide || createEpic12DocsAdoptionGuide(options);
  const validation = validateEpic12DocsAdoptionGuide(guide);
  return {
    schema: EPIC12_DOCS_ADOPTION_REPORT_SCHEMA,
    ok: validation.ok,
    errors: validation.errors,
    guide,
    docsCount: guide.requiredDocs.length,
    migrationTopicCount: guide.migrationNotes.topics.length,
    adoptionStageCount: guide.adoptionStages.length,
    publishAllowed: guide.publishAllowed,
    packagePrivateRequired: guide.packagePrivateRequired,
    handoff: guide.handoff
  };
}

module.exports = {
  ADOPTION_STAGES,
  EPIC12_DOCS_ADOPTION_CONTRACT,
  EPIC12_DOCS_ADOPTION_DOCS,
  EPIC12_DOCS_ADOPTION_LOCAL_GATE,
  EPIC12_DOCS_ADOPTION_MODULE,
  EPIC12_DOCS_ADOPTION_PACKAGE_SCRIPT,
  EPIC12_DOCS_ADOPTION_REPORT_SCHEMA,
  EPIC12_DOCS_ADOPTION_SCHEMA,
  EPIC12_DOCS_ADOPTION_STATUS,
  EPIC12_DOCS_ADOPTION_SUITE,
  EPIC12_DOCS_ADOPTION_WORKPACKAGE,
  EPIC12_DOCS_ADOPTION_WORKPACKAGE_DOC,
  KERNEL_BOUNDARY,
  MIGRATION_NOTE_TOPICS,
  PUBLISH_BOUNDARY,
  REQUIRED_DOCS,
  createEpic12DocsAdoptionGuide,
  createEpic12DocsAdoptionReport,
  validateEpic12DocsAdoptionGuide
};

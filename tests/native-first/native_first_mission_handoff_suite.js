const fs = require('fs');
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

const SUITE_ID = 'native-first-mission-handoff';
const SUITE_LABEL = 'Native-First Mission Handoff';
const CONTRACT_SCHEMA = 'xtend.native-first.mission-handoff.v1';
const MATRIX_SCHEMA = 'xtend.native-first.mission-handoff-decision-matrix.v1';
const DECISION_SCHEMA = 'xtend.native-first.mission-handoff-decision.v1';
const FIXTURE_SCHEMA = 'xtend.native-first.mission-handoff-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.native-first.mission-handoff-fixtures.v1';
const REPORT_SCHEMA = 'xtend.native-first.mission-handoff-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-mission-handoff --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-mission-handoff';
const FIXTURE_PATH = 'tests/fixtures/native-first/native-first-mission-handoff-fixtures.json';
const NEXT_EPIC_BOUNDARY = 'rmt-ui-maximality-and-owned-component-surface-hardening';

const REQUIRED_FIELDS = Object.freeze([
  'handoffId',
  'missionPillar',
  'sourceWorkpackages',
  'sourceContracts',
  'status',
  'releaseDecision',
  'nextEpicBoundary',
  'residuals',
  'requiredGates',
  'evidenceArtifacts',
  'owner',
  'nextHandoff'
]);

const HANDOFF_STATUSES = Object.freeze([
  'accepted',
  'accepted-with-residuals',
  'needs-next-mission-epic'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'native-first-mission-handoff',
  'contract-registry',
  'contract-runtime-parity',
  'native-first-evidence-pack',
  'native-first-budget-gates',
  'native-first-docs-authoring',
  'native-first-migration-deprecation',
  'native-first-market-pattern-parity',
  'native-first-framework-leverage',
  'native-first-form-navigation-media',
  'native-first-overlay-focus',
  'rmt-ui-primitive-gap',
  'rmt-syntax-growth',
  'rmt-action-effect-data-resource-primitives',
  'rmt-complete-ui-recipes',
  'rmt-renderer-dom-descriptor-proofs',
  'supply-chain',
  'references'
]);

const REQUIRED_HANDOFFS = Object.freeze([
  {
    handoffId: 'NFM-HO-01',
    missionPillar: 'native-primitives-first',
    status: 'accepted',
    releaseDecision: 'accepted',
    owner: 'browser-primitive-owner',
    nextEpicBoundary: 'native-primitive-radar-cadence',
    sourceWorkpackages: ['NFM-WP-01', 'NFM-WP-02', 'NFM-WP-03', 'NFM-WP-18', 'NFM-WP-19'],
    requiredGates: ['contract-registry', 'contract-runtime-parity', 'rmt-renderer-dom-descriptor-proofs', 'native-first-budget-gates', 'references'],
    residuals: ['browser-lab-cadence'],
    nextHandoff: ['native-primitive-review-cadence']
  },
  {
    handoffId: 'NFM-HO-02',
    missionPillar: 'dependency-minimalism',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'migration-owner',
    nextEpicBoundary: 'vendor-legacy-containment-review',
    sourceWorkpackages: ['NFM-WP-04', 'NFM-WP-05', 'NFM-WP-21'],
    requiredGates: ['native-first-migration-deprecation', 'native-first-budget-gates', 'supply-chain', 'references'],
    residuals: ['legacy-loader-warning-window', 'owned-docs-highlighter-review'],
    nextHandoff: ['migration-owner-review']
  },
  {
    handoffId: 'NFM-HO-03',
    missionPillar: 'owned-framework-leverage',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'component-platform-owner',
    nextEpicBoundary: 'owned-component-surface-hardening',
    sourceWorkpackages: ['NFM-WP-06', 'NFM-WP-07', 'NFM-WP-08', 'NFM-WP-09', 'NFM-WP-10'],
    requiredGates: ['native-first-overlay-focus', 'native-first-form-navigation-media', 'native-first-framework-leverage', 'native-first-market-pattern-parity', 'contract-registry'],
    residuals: ['data-display-owned-package', 'command-search-owned-package'],
    nextHandoff: ['owned-component-surface-hardening-epic']
  },
  {
    handoffId: 'NFM-HO-04',
    missionPillar: 'contract-auditability',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'audit-evidence-owner',
    nextEpicBoundary: 'contract-productization-and-doc-quality',
    sourceWorkpackages: ['NFM-WP-11', 'NFM-WP-12', 'NFM-WP-13', 'NFM-WP-20'],
    requiredGates: ['contract-registry', 'contract-runtime-parity', 'native-first-evidence-pack', 'native-first-docs-authoring', 'references'],
    residuals: ['docs-public-quality-legacy-failures', 'conditional-network-owner-run'],
    nextHandoff: ['release-owner-review']
  },
  {
    handoffId: 'NFM-HO-05',
    missionPillar: 'rmt-ui-maximality',
    status: 'needs-next-mission-epic',
    releaseDecision: 'needs-next-mission-epic',
    owner: 'rmt-ui-authoring-owner',
    nextEpicBoundary: NEXT_EPIC_BOUNDARY,
    sourceWorkpackages: ['NFM-WP-14', 'NFM-WP-15', 'NFM-WP-16', 'NFM-WP-17', 'NFM-WP-18', 'NFM-WP-19'],
    requiredGates: ['rmt-ui-primitive-gap', 'rmt-syntax-growth', 'rmt-action-effect-data-resource-primitives', 'rmt-complete-ui-recipes', 'rmt-renderer-dom-descriptor-proofs', 'native-first-budget-gates'],
    residuals: ['surface-browser-lab', 'data-display-parity', 'command-search-parity', 'visual-evidence-artifacts'],
    nextHandoff: ['next-mission-epic-intake']
  },
  {
    handoffId: 'NFM-HO-06',
    missionPillar: 'mission-release-handoff',
    status: 'accepted-with-residuals',
    releaseDecision: 'accepted-with-residuals',
    owner: 'native-first-mission-owner',
    nextEpicBoundary: NEXT_EPIC_BOUNDARY,
    sourceWorkpackages: ['NFM-WP-19', 'NFM-WP-20', 'NFM-WP-21', 'NFM-WP-22'],
    requiredGates: ['native-first-mission-handoff', 'contract-registry', 'native-first-evidence-pack', 'native-first-budget-gates', 'native-first-docs-authoring', 'native-first-migration-deprecation', 'references'],
    residuals: ['docs-public-quality-legacy-failures', 'component-long-tail-migration-docs-file', 'type-exports-docs-links', 'browser-lab-artifacts'],
    nextHandoff: ['next-epic-intake']
  }
]);

function assertIncludesAll(context, content, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(content, entry, `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertPathExists(context, rootDir, relativePath, label) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), `${label} exists at ${relativePath}`);
}

function assertRunnerGate(context, runner, gate) {
  context.assertIncludes(runner, `id: '${gate}'`, `Runner registers ${gate}`);
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function runNativeFirstMissionHandoffSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Mission-Handoff-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Mission-Handoff-Decision-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-22-Native-First-Mission-Handoff-und-naechste-Epic-Grenze-entscheiden.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const evidencePack = readText('development/XTend-Native-First-Audit-Evidence-Pack.md', rootDir);
  const budgetContract = readText('development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md', rootDir);
  const docsContract = readText('development/XTend-Native-First-Docs-Authoring-Guides-Contract.md', rootDir);
  const migrationContract = readText('development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstMissionHandoff;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'owner-handoff-before-release-claim',
    'accepted-with-residuals-is-explicit',
    'next-epic-boundary-is-single-source',
    NEXT_EPIC_BOUNDARY
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, HANDOFF_STATUSES, 'Contract status model');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    CONTRACT_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'Status Summary',
    'Release Decision Summary',
    'Final Owner Decision',
    NEXT_EPIC_BOUNDARY
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix required fields');
  assertIncludesAll(context, matrix, [
    '`accepted` | 1',
    '`accepted-with-residuals` | 4',
    '`needs-next-mission-epic` | 1'
  ], 'Matrix status counts');

  REQUIRED_HANDOFFS.forEach((handoff) => {
    assertIncludesAll(context, matrix, [
      handoff.handoffId,
      handoff.missionPillar,
      handoff.status,
      handoff.releaseDecision,
      handoff.owner,
      handoff.nextEpicBoundary
    ], `Matrix row ${handoff.handoffId}`);
    assertIncludesAll(context, matrix, handoff.sourceWorkpackages, `Matrix row ${handoff.handoffId} workpackages`);
    assertIncludesAll(context, matrix, handoff.requiredGates, `Matrix row ${handoff.handoffId} gates`);
    assertIncludesAll(context, matrix, handoff.residuals, `Matrix row ${handoff.handoffId} residuals`);
    assertIncludesAll(context, matrix, handoff.nextHandoff, `Matrix row ${handoff.handoffId} next handoff`);
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references WP-22 contract');
  context.assert(fixtures && fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix schema');
  context.assert(fixtures && fixtures.workpackage === 'NFM-WP-22', 'Fixture pack references WP-22');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures && fixtures.releaseDecision === 'accepted-with-residuals', 'Fixture pack records final release decision');
  context.assert(fixtures && fixtures.nextEpicBoundary === NEXT_EPIC_BOUNDARY, 'Fixture pack records next epic boundary');
  context.assert(fixtures && fixtures.noRuntimeDependency === true, 'Fixture pack records no runtime dependency');
  context.assert(fixtures && fixtures.externalUiFrameworkDependencyAllowed === false, 'Fixture pack blocks external UI framework dependency');
  context.assert(fixtures && fixtures.unsafeHtmlSinkAllowed === false, 'Fixture pack blocks unsafe HTML sink');

  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_HANDOFFS.length, 'Fixture pack contains one fixture per handoff decision');

  REQUIRED_HANDOFFS.forEach((required) => {
    const fixture = fixtureRows.find((candidate) => candidate.handoffId === required.handoffId);
    context.assert(Boolean(fixture), `Fixture pack contains ${required.handoffId}`);
    if (!fixture) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(fixture[field]), `Fixture ${required.handoffId} has ${field}`);
    });
    context.assert(fixture.missionPillar === required.missionPillar, `${required.handoffId} has mission pillar`);
    context.assert(fixture.status === required.status, `${required.handoffId} has status`);
    context.assert(fixture.releaseDecision === required.releaseDecision, `${required.handoffId} has release decision`);
    context.assert(fixture.owner === required.owner, `${required.handoffId} has owner`);
    context.assert(fixture.nextEpicBoundary === required.nextEpicBoundary, `${required.handoffId} has next epic boundary`);
    assertArrayIncludesAll(context, fixture.sourceWorkpackages, required.sourceWorkpackages, `${required.handoffId} source workpackages`);
    assertArrayIncludesAll(context, fixture.requiredGates, required.requiredGates, `${required.handoffId} gates`);
    assertArrayIncludesAll(context, fixture.residuals, required.residuals, `${required.handoffId} residuals`);
    assertArrayIncludesAll(context, fixture.nextHandoff, required.nextHandoff, `${required.handoffId} next handoff`);
    context.assert(Array.isArray(fixture.sourceContracts) && fixture.sourceContracts.length > 0, `${required.handoffId} has source contracts`);
    context.assert(Array.isArray(fixture.evidenceArtifacts) && fixture.evidenceArtifacts.length > 0, `${required.handoffId} has evidence artifacts`);
    fixture.evidenceArtifacts.forEach((relativePath) => {
      assertPathExists(context, rootDir, relativePath, `${required.handoffId} evidence artifact`);
    });
  });

  const statusCounts = countBy(fixtureRows, 'status');
  const releaseDecisionCounts = countBy(fixtureRows, 'releaseDecision');
  context.assert(statusCounts.accepted === 1, 'Status count accepted is 1');
  context.assert(statusCounts['accepted-with-residuals'] === 4, 'Status count accepted-with-residuals is 4');
  context.assert(statusCounts['needs-next-mission-epic'] === 1, 'Status count needs-next-mission-epic is 1');
  context.assert(releaseDecisionCounts.accepted === 1, 'Release decision count accepted is 1');
  context.assert(releaseDecisionCounts['accepted-with-residuals'] === 4, 'Release decision count accepted-with-residuals is 4');
  context.assert(releaseDecisionCounts['needs-next-mission-epic'] === 1, 'Release decision count needs-next-mission-epic is 1');

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    NEXT_EPIC_BOUNDARY,
    'accepted-with-residuals',
    'needs-next-mission-epic'
  ], 'Workpackage completion');

  assertIncludesAll(context, roadmap, [
    '| `NFM-WP-22` | P0 | completed |',
    'development/XTend-Native-First-Mission-Handoff-Contract.md',
    'development/XTend-Native-First-Mission-Handoff-Decision-Matrix.md',
    FIXTURE_PATH,
    LOCAL_GATE,
    NEXT_EPIC_BOUNDARY,
    'Die Roadmap ist fachlich abgeschlossen'
  ], 'Roadmap WP-22 handoff');

  assertIncludesAll(context, mission, [
    'Mission Handoff Contract: `xtend.native-first.mission-handoff.v1`',
    'development/XTend-Native-First-Mission-Handoff-Decision-Matrix.md',
    '`NFM-WP-22` | completed',
    NEXT_EPIC_BOUNDARY
  ], 'Mission WP-22 source of truth');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'accepted-with-mission-handoff',
    'native-first-mission-owner',
    'NFM-WP-22',
    REPORT_SCHEMA,
    'native-first-mission-handoff',
    'development/XTend-Native-First-Mission-Handoff-Contract.md',
    'mission-handoff',
    'final-handoff'
  ], 'Registry WP-22 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-22',
    'native-first-mission-handoff',
    CONTRACT_SCHEMA,
    'accepted-with-mission-handoff',
    'final-handoff'
  ], 'Registry contract WP-22 extension');

  assertIncludesAll(context, evidencePack, ['NFM-WP-22', 'Release-Owner-Pack'], 'Audit evidence pack feeds handoff');
  assertIncludesAll(context, budgetContract, ['NFM-WP-22', 'final release acceptance bleibt NFM-WP-22'], 'Budget gates feed handoff');
  assertIncludesAll(context, docsContract, ['NFM-WP-22', 'blocked public Claims'], 'Docs authoring feeds handoff');
  assertIncludesAll(context, migrationContract, ['NFM-WP-22', 'no-silent-deprecation'], 'Migration contract feeds handoff');

  context.assert(packageScripts['test:native-first-mission-handoff'] === 'node scripts/run_xtend_tests.js native-first-mission-handoff', 'Package exposes WP-22 test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_mission_handoff_suite')", 'Runner imports WP-22 suite');
  context.assertIncludes(runner, "id: 'native-first-mission-handoff'", 'Runner registers WP-22 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-22 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-22 matrix schema');
  context.assert(metadata && metadata.decisionSchema === DECISION_SCHEMA, 'Package metadata exposes WP-22 decision schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes WP-22 fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes WP-22 fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-22 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-Mission-Handoff-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Mission-Handoff-Decision-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-22-Native-First-Mission-Handoff-und-naechste-Epic-Grenze-entscheiden.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.status === 'accepted-with-mission-handoff', 'Package metadata exposes handoff status');
  context.assert(metadata && metadata.releaseDecision === 'accepted-with-residuals', 'Package metadata exposes release decision');
  context.assert(metadata && metadata.nextEpicBoundary === NEXT_EPIC_BOUNDARY, 'Package metadata exposes next epic boundary');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external framework dependency');
  context.assert(metadata && metadata.unsafeHtmlSinkAllowed === false, 'Package metadata blocks unsafe sink');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.handoffStatuses, HANDOFF_STATUSES, 'Package metadata handoff statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');

  const metadataRows = (metadata && metadata.handoffs) || [];
  context.assert(metadataRows.length === REQUIRED_HANDOFFS.length, 'Package metadata registers all handoffs');
  REQUIRED_HANDOFFS.forEach((required) => {
    const handoff = metadataRows.find((candidate) => candidate.handoffId === required.handoffId);
    context.assert(Boolean(handoff), `Package metadata registers ${required.handoffId}`);
    if (!handoff) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(handoff[field]), `Package metadata ${required.handoffId} has ${field}`);
    });
    context.assert(handoff.status === required.status, `Package metadata ${required.handoffId} has status`);
    context.assert(handoff.releaseDecision === required.releaseDecision, `Package metadata ${required.handoffId} has release decision`);
    context.assert(handoff.owner === required.owner, `Package metadata ${required.handoffId} has owner`);
    context.assert(handoff.nextEpicBoundary === required.nextEpicBoundary, `Package metadata ${required.handoffId} has next epic boundary`);
    assertArrayIncludesAll(context, handoff.sourceWorkpackages, required.sourceWorkpackages, `Package metadata ${required.handoffId} workpackages`);
    assertArrayIncludesAll(context, handoff.requiredGates, required.requiredGates, `Package metadata ${required.handoffId} gates`);
    assertArrayIncludesAll(context, handoff.residuals, required.residuals, `Package metadata ${required.handoffId} residuals`);
    assertArrayIncludesAll(context, handoff.nextHandoff, required.nextHandoff, `Package metadata ${required.handoffId} handoff`);
  });

  context.assert(registryMetadata && Array.isArray(registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('native-first-mission-handoff'), 'Registry metadata source gates include WP-22');
  context.assert(registryMetadata && Array.isArray(registryMetadata.entries) && registryMetadata.entries.some((entry) => entry.contractId === CONTRACT_SCHEMA), 'Registry metadata entries include WP-22');

  [
    'development/XTend-Native-First-Mission-Handoff-Contract.md',
    'development/XTend-Native-First-Mission-Handoff-Decision-Matrix.md',
    'development/NFM-WP-22-Native-First-Mission-Handoff-und-naechste-Epic-Grenze-entscheiden.md',
    FIXTURE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-22 artifact ${relativePath}`));

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-22',
      contract: CONTRACT_SCHEMA,
      handoffs: REQUIRED_HANDOFFS.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      statusCounts,
      releaseDecisionCounts,
      releaseDecision: 'accepted-with-residuals',
      nextEpicBoundary: NEXT_EPIC_BOUNDARY,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true
    }
  });
}

function printNativeFirstMissionHandoffReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Mission Handoff erfolgreich.',
    failureTitle: 'Native-First Mission Handoff fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstMissionHandoffReport,
  runNativeFirstMissionHandoffSuite
};

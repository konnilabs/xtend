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

const SUITE_ID = 'native-first-migration-deprecation';
const SUITE_LABEL = 'Native-First Migration Deprecation Plan';
const CONTRACT_SCHEMA = 'xtend.native-first.migration-deprecation-plan.v1';
const MATRIX_SCHEMA = 'xtend.native-first.migration-deprecation-matrix.v1';
const ITEM_SCHEMA = 'xtend.native-first.migration-deprecation-item.v1';
const FIXTURE_SCHEMA = 'xtend.native-first.migration-deprecation-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.native-first.migration-deprecation-fixtures.v1';
const REPORT_SCHEMA = 'xtend.native-first.migration-deprecation-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js native-first-migration-deprecation --json';
const PACKAGE_SCRIPT = 'npm run test:native-first-migration-deprecation';
const FIXTURE_PATH = 'tests/fixtures/native-first/native-first-migration-deprecation-fixtures.json';

const REQUIRED_FIELDS = Object.freeze([
  'migrationId',
  'sourceCandidate',
  'priority',
  'migrationClass',
  'currentSurface',
  'status',
  'deprecationStage',
  'alternative',
  'migrationGuide',
  'requiredGates',
  'semverPolicy',
  'releaseDecision',
  'owner',
  'nextHandoff'
]);

const MIGRATION_STATUSES = Object.freeze([
  'migration-required',
  'deprecation-planned',
  'containment-accepted',
  'closed-guardrail'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'native-first-migration-deprecation',
  'native-first-docs-authoring',
  'native-first-budget-gates',
  'contract-registry',
  'supply-chain',
  'type-exports-vendor',
  'type-exports-loader',
  'component-long-tail-migration',
  'rmt-dom-descriptor-renderer',
  'rmt-renderer-dom-descriptor-proofs',
  'rmt-native-shell-migration',
  'maraca-bundle',
  'maraca-size-budget',
  'rmt-tooling-docs',
  'epic13-trusted-dom-boundary',
  'epic18-vendor-bugfix-smokes',
  'component-contract-v2',
  'docs-public-quality',
  'references'
]);

const REQUIRED_GUIDE_PATHS = Object.freeze([
  'docs/de/native-first-migration-guide.md',
  'docs/en/native-first-migration-guide.md'
]);

const FORBIDDEN_PUBLIC_TERMS = Object.freeze([
  'NFM-WP-',
  'Workpackage',
  'Handoff',
  'Gate Matrix',
  'Release Owner',
  'RC0',
  'RC1'
]);

const GERMAN_ASCII_UMLAUT_PATTERN = /\b(?:fuer|ueber|koennen|muessen|waehrend|enthaelt|prueft|pruefen|haerten|moeglich|laedt|fuehrt|gehoert|vollstaendig|zugehoerig|flaeche|aenderung|aenderungen|kompatibilitaet|qualitaet)\b/iu;

const REQUIRED_MIGRATIONS = Object.freeze([
  {
    migrationId: 'NFM-MIG-01',
    sourceCandidate: 'NFM-RC-01',
    priority: 'P0',
    migrationClass: 'manual-html-path',
    status: 'migration-required',
    deprecationStage: 'block-new-normal-ui-sinks',
    semverPolicy: 'minor-warning-major-removal-window',
    releaseDecision: 'blocked-until-descriptor-or-trust-boundary',
    owner: 'rmt-renderer-security-owner',
    requiredGates: ['native-first-migration-deprecation', 'rmt-dom-descriptor-renderer', 'rmt-renderer-dom-descriptor-proofs', 'epic13-trusted-dom-boundary', 'native-first-budget-gates'],
    nextHandoff: ['NFM-WP-22']
  },
  {
    migrationId: 'NFM-MIG-02',
    sourceCandidate: 'NFM-RC-02',
    priority: 'P1',
    migrationClass: 'vendored-utility',
    status: 'deprecation-planned',
    deprecationStage: 'freeze-facade-no-broad-export',
    semverPolicy: 'minor-warning-before-public-surface-change',
    releaseDecision: 'allowed-contained-no-new-public-surface',
    owner: 'docs-authoring-owner',
    requiredGates: ['native-first-migration-deprecation', 'type-exports-vendor', 'supply-chain', 'docs-public-quality'],
    nextHandoff: ['owned-docs-highlighter-review']
  },
  {
    migrationId: 'NFM-MIG-03',
    sourceCandidate: 'NFM-RC-03',
    priority: 'P1',
    migrationClass: 'vendored-utility',
    status: 'migration-required',
    deprecationStage: 'trust-boundary-before-new-use',
    semverPolicy: 'minor-warning-major-removal-window',
    releaseDecision: 'blocked-for-new-raw-html-conversion-without-trust-boundary',
    owner: 'security-owner',
    requiredGates: ['native-first-migration-deprecation', 'epic13-trusted-dom-boundary', 'rmt-dom-descriptor-renderer', 'native-first-docs-authoring'],
    nextHandoff: ['NFM-WP-22']
  },
  {
    migrationId: 'NFM-MIG-04',
    sourceCandidate: 'NFM-RC-04',
    priority: 'P1',
    migrationClass: 'tooling-dependency',
    status: 'containment-accepted',
    deprecationStage: 'keep-build-tooling-outside-runtime',
    semverPolicy: 'no-runtime-deprecation-tooling-contained',
    releaseDecision: 'allowed-build-tooling-not-runtime',
    owner: 'maraca-tooling-owner',
    requiredGates: ['native-first-migration-deprecation', 'maraca-bundle', 'maraca-size-budget', 'native-first-budget-gates', 'supply-chain'],
    nextHandoff: ['NFM-WP-22']
  },
  {
    migrationId: 'NFM-MIG-05',
    sourceCandidate: 'NFM-RC-05',
    priority: 'P2',
    migrationClass: 'tooling-dependency',
    status: 'containment-accepted',
    deprecationStage: 'editor-scope-only',
    semverPolicy: 'no-runtime-deprecation-editor-contained',
    releaseDecision: 'allowed-editor-only-not-runtime',
    owner: 'editor-tooling-owner',
    requiredGates: ['native-first-migration-deprecation', 'rmt-tooling-docs', 'references', 'manifest-import-policy'],
    nextHandoff: ['NFM-WP-22']
  },
  {
    migrationId: 'NFM-MIG-06',
    sourceCandidate: 'NFM-RC-06',
    priority: 'P2',
    migrationClass: 'legacy-runtime-surface',
    status: 'deprecation-planned',
    deprecationStage: 'compatibility-warning-before-removal',
    semverPolicy: 'major-removal-only-after-two-minor-warnings',
    releaseDecision: 'allowed-compatibility-surface-with-warning-window',
    owner: 'loader-compat-owner',
    requiredGates: ['native-first-migration-deprecation', 'type-exports-loader', 'rmt-native-shell-migration', 'component-long-tail-migration', 'references'],
    nextHandoff: ['NFM-WP-22']
  },
  {
    migrationId: 'NFM-MIG-07',
    sourceCandidate: 'NFM-RC-07',
    priority: 'P2',
    migrationClass: 'vendor-backport-residual',
    status: 'closed-guardrail',
    deprecationStage: 'no-new-vendor-copy',
    semverPolicy: 'no-deprecation-guardrail-only',
    releaseDecision: 'accepted-controlled-backport-no-new-copy',
    owner: 'component-platform-owner',
    requiredGates: ['native-first-migration-deprecation', 'epic18-vendor-bugfix-smokes', 'component-contract-v2', 'references'],
    nextHandoff: ['NFM-WP-22']
  },
  {
    migrationId: 'NFM-MIG-08',
    sourceCandidate: 'NFM-RC-08',
    priority: 'P2',
    migrationClass: 'owned-vendor-adapter',
    status: 'closed-guardrail',
    deprecationStage: 'owned-adapter-pattern',
    semverPolicy: 'no-deprecation-owned-pattern',
    releaseDecision: 'accepted-owned-adapter-pattern',
    owner: 'component-platform-owner',
    requiredGates: ['native-first-migration-deprecation', 'component-contract-v2', 'native-first-docs-authoring', 'references'],
    nextHandoff: ['NFM-WP-22']
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

function runNativeFirstMigrationDeprecationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-21-Migration-und-Deprecation-fuer-Vendor-Legacy-und-Non-Native-Pfade-planen.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const vendorContract = readText('development/XTend-Native-First-Vendor-Legacy-Replacement-Contract.md', rootDir);
  const vendorMatrix = readText('development/XTend-Native-First-Vendor-Legacy-Replacement-Matrix.md', rootDir);
  const budgetContract = readText('development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md', rootDir);
  const docsContract = readText('development/XTend-Native-First-Docs-Authoring-Guides-Contract.md', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsReadmeDe = readText('docs/de/README.md', rootDir);
  const docsReadmeEn = readText('docs/en/README.md', rootDir);
  const menu = readJson('docs/menu.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstMigrationDeprecation;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'xtend.native-first.vendor-legacy-replacement.v1',
    'xtend.native-first.dependency-diet-policy.v1',
    'xtend.native-first.performance-complexity-bundle-budget-gates.v1',
    'xtend.native-first.docs-authoring-guides.v1',
    LOCAL_GATE,
    PACKAGE_SCRIPT
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, MIGRATION_STATUSES, 'Contract status model');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'no-silent-deprecation',
    'alternative-before-removal',
    'migration-guide-before-public-deprecation',
    'gate-before-release-decision',
    'no-new-runtime-dependency'
  ], 'Contract boundaries');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    CONTRACT_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    'Status Summary',
    'Priority Summary',
    'Release Decisions',
    'NFM-WP-22'
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix required fields');
  assertIncludesAll(context, matrix, [
    '`migration-required` | 2',
    '`deprecation-planned` | 2',
    '`containment-accepted` | 2',
    '`closed-guardrail` | 2',
    '`P0` | 1',
    '`P1` | 3',
    '`P2` | 4'
  ], 'Matrix status and priority counts');

  REQUIRED_MIGRATIONS.forEach((migration) => {
    assertIncludesAll(context, matrix, [
      migration.migrationId,
      migration.sourceCandidate,
      migration.priority,
      migration.migrationClass,
      migration.status,
      migration.deprecationStage,
      migration.semverPolicy,
      migration.releaseDecision,
      migration.owner
    ], `Matrix row ${migration.migrationId}`);
    assertIncludesAll(context, matrix, migration.requiredGates, `Matrix row ${migration.migrationId} gates`);
    assertIncludesAll(context, matrix, migration.nextHandoff, `Matrix row ${migration.migrationId} handoff`);
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references WP-21 contract');
  context.assert(fixtures && fixtures.workpackage === 'NFM-WP-21', 'Fixture pack references WP-21');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  assertArrayIncludesAll(context, fixtures && fixtures.migrationGuide, REQUIRED_GUIDE_PATHS, 'Fixture pack migration guide');
  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_MIGRATIONS.length, 'Fixture pack contains one fixture per migration decision');

  REQUIRED_MIGRATIONS.forEach((required) => {
    const fixture = fixtureRows.find((candidate) => candidate.migrationId === required.migrationId);
    context.assert(Boolean(fixture), `Fixture pack contains ${required.migrationId}`);
    if (!fixture) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(fixture[field]), `Fixture ${required.migrationId} has ${field}`);
    });
    context.assert(fixture.sourceCandidate === required.sourceCandidate, `${required.migrationId} has source candidate`);
    context.assert(fixture.priority === required.priority, `${required.migrationId} has priority`);
    context.assert(fixture.migrationClass === required.migrationClass, `${required.migrationId} has class`);
    context.assert(fixture.status === required.status, `${required.migrationId} has status`);
    context.assert(fixture.deprecationStage === required.deprecationStage, `${required.migrationId} has stage`);
    context.assert(fixture.semverPolicy === required.semverPolicy, `${required.migrationId} has semver policy`);
    context.assert(fixture.releaseDecision === required.releaseDecision, `${required.migrationId} has release decision`);
    context.assert(fixture.owner === required.owner, `${required.migrationId} has owner`);
    assertArrayIncludesAll(context, fixture.requiredGates, required.requiredGates, `${required.migrationId} gates`);
    assertArrayIncludesAll(context, fixture.nextHandoff, required.nextHandoff, `${required.migrationId} handoff`);
    assertArrayIncludesAll(context, fixture.migrationGuide, REQUIRED_GUIDE_PATHS, `${required.migrationId} guide paths`);
  });

  REQUIRED_GUIDE_PATHS.forEach((guidePath) => {
    assertPathExists(context, rootDir, guidePath, `Migration guide ${guidePath}`);
    const publicDoc = readText(guidePath, rootDir);
    assertIncludesAll(context, publicDoc, [
      'xtend.native-first.vendor-legacy-replacement.v1',
      CONTRACT_SCHEMA,
      'xtend.native-first.performance-complexity-bundle-budget-gates.v1',
      'xtend.native-first.docs-authoring-guides.v1',
      'native-first-migration-deprecation',
      'rmt-dom-descriptor-renderer',
      'type-exports-vendor',
      'type-exports-loader',
      'rmt-native-shell-migration',
      'SemVer',
      'xtend-dev.js',
      './legacy-loader',
      'components/prism.js',
      'components/turndown.js'
    ], `Migration guide ${guidePath}`);
    FORBIDDEN_PUBLIC_TERMS.forEach((term) => {
      context.assert(!publicDoc.includes(term), `Migration guide ${guidePath} omits ${term}`);
    });
    if (guidePath.startsWith('docs/de/')) {
      context.assert(!GERMAN_ASCII_UMLAUT_PATTERN.test(publicDoc), 'German migration guide uses umlauts');
    }
  });

  const menuSlugs = menu.map((entry) => entry.slug);
  context.assert(menuSlugs.includes('native-first-migration-guide'), 'Docs menu exposes native-first-migration-guide');
  context.assert(menu.find((entry) => entry.slug === 'native-first-migration-guide' && entry.labels && entry.labels.de && entry.labels.en), 'Docs menu migration guide has localized labels');
  assertIncludesAll(context, `${docsReadme}\n${docsReadmeDe}\n${docsReadmeEn}`, ['native-first-migration-guide'], 'Docs README references migration guide');

  assertIncludesAll(context, vendorContract, ['defer-to-nfm-wp-21', 'Legacy Loader, Vendor Facades und Manual HTML'], 'WP-05 contract hands off migration');
  assertIncludesAll(context, vendorMatrix, ['NFM-RC-01', 'NFM-RC-02', 'NFM-RC-03', 'NFM-RC-06', 'NFM-WP-21'], 'WP-05 matrix source candidates');
  assertIncludesAll(context, budgetContract, ['NFM-WP-21', 'no-production-budget-claim-without-gate'], 'WP-19 budget gate feeds migration');
  assertIncludesAll(context, docsContract, ['NFM-WP-21', 'migration-handoff-for-vendor-backed-paths'], 'WP-20 docs gate feeds migration');

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    FIXTURE_PATH,
    'docs/de/native-first-migration-guide.md',
    'docs/en/native-first-migration-guide.md',
    'NFM-WP-22'
  ], 'Workpackage schemas, gate and handoff');

  context.assertIncludes(roadmap, '| `NFM-WP-21` | P2 | completed |', 'Roadmap marks NFM-WP-21 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-22` | P0 | ready |') || roadmap.includes('| `NFM-WP-22` | P0 | completed |'),
    'Roadmap marks NFM-WP-22 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md', 'Roadmap references WP-21 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-21 gate');

  context.assertIncludes(mission, 'Migration Deprecation Plan Contract: `xtend.native-first.migration-deprecation-plan.v1`', 'Mission references WP-21 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md', 'Mission source-of-truth lists WP-21 matrix');
  context.assertIncludes(mission, '`NFM-WP-21` | completed', 'Mission handoff marks WP-21 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'accepted-with-migration-deprecation-plan',
    'migration-owner',
    'NFM-WP-21',
    REPORT_SCHEMA,
    'native-first-migration-deprecation',
    'development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md',
    'migration-deprecation-plan',
    'migration-plan'
  ], 'Registry WP-21 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-21',
    'native-first-migration-deprecation',
    CONTRACT_SCHEMA,
    'accepted-with-migration-deprecation-plan'
  ], 'Registry contract WP-21 extension');

  context.assert(packageScripts['test:native-first-migration-deprecation'] === 'node scripts/run_xtend_tests.js native-first-migration-deprecation', 'Package exposes WP-21 test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_migration_deprecation_suite')", 'Runner imports WP-21 suite');
  context.assertIncludes(runner, "id: 'native-first-migration-deprecation'", 'Runner registers WP-21 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-21 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-21 matrix schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes WP-21 item schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes WP-21 fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes WP-21 fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-21 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-21-Migration-und-Deprecation-fuer-Vendor-Legacy-und-Non-Native-Pfade-planen.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.noSilentDeprecation === true, 'Package metadata blocks silent deprecation');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.migrationStatuses, MIGRATION_STATUSES, 'Package metadata migration statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.migrationGuide, REQUIRED_GUIDE_PATHS, 'Package metadata migration guides');

  const migrationRows = (metadata && metadata.migrations) || [];
  context.assert(migrationRows.length === REQUIRED_MIGRATIONS.length, 'Package metadata registers all migrations');
  REQUIRED_MIGRATIONS.forEach((required) => {
    const migration = migrationRows.find((candidate) => candidate.migrationId === required.migrationId);
    context.assert(Boolean(migration), `Package metadata registers ${required.migrationId}`);
    if (!migration) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(migration[field]), `Package metadata ${required.migrationId} has ${field}`);
    });
    context.assert(migration.sourceCandidate === required.sourceCandidate, `Package metadata ${required.migrationId} has source candidate`);
    context.assert(migration.priority === required.priority, `Package metadata ${required.migrationId} has priority`);
    context.assert(migration.migrationClass === required.migrationClass, `Package metadata ${required.migrationId} has class`);
    context.assert(migration.status === required.status, `Package metadata ${required.migrationId} has status`);
    context.assert(migration.deprecationStage === required.deprecationStage, `Package metadata ${required.migrationId} has stage`);
    context.assert(migration.semverPolicy === required.semverPolicy, `Package metadata ${required.migrationId} has semver policy`);
    context.assert(migration.releaseDecision === required.releaseDecision, `Package metadata ${required.migrationId} has release decision`);
    context.assert(migration.owner === required.owner, `Package metadata ${required.migrationId} has owner`);
    assertArrayIncludesAll(context, migration.requiredGates, required.requiredGates, `Package metadata ${required.migrationId} gates`);
    assertArrayIncludesAll(context, migration.nextHandoff, required.nextHandoff, `Package metadata ${required.migrationId} handoff`);
    assertArrayIncludesAll(context, migration.migrationGuide, REQUIRED_GUIDE_PATHS, `Package metadata ${required.migrationId} guide`);
  });

  context.assert(registryMetadata && Array.isArray(registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('native-first-migration-deprecation'), 'Registry metadata source gates include WP-21');
  context.assert(registryMetadata && Array.isArray(registryMetadata.entries) && registryMetadata.entries.some((entry) => entry.contractId === CONTRACT_SCHEMA), 'Registry metadata entries include WP-21');

  [
    'development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md',
    'development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md',
    'development/NFM-WP-21-Migration-und-Deprecation-fuer-Vendor-Legacy-und-Non-Native-Pfade-planen.md',
    FIXTURE_PATH,
    ...REQUIRED_GUIDE_PATHS
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-21 artifact ${relativePath}`));

  const statusCounts = countBy(fixtureRows, 'status');
  const priorityCounts = countBy(fixtureRows, 'priority');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-21',
      contract: CONTRACT_SCHEMA,
      migrations: REQUIRED_MIGRATIONS.length,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      statusCounts,
      priorityCounts,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      noSilentDeprecation: true
    }
  });
}

function printNativeFirstMigrationDeprecationReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First Migration Deprecation Plan erfolgreich.',
    failureTitle: 'Native-First Migration Deprecation Plan fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstMigrationDeprecationReport,
  runNativeFirstMigrationDeprecationSuite
};

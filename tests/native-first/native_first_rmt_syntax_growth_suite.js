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

const SUITE_ID = 'rmt-syntax-growth';
const SUITE_LABEL = 'Native-First RMT Syntax Growth';
const CONTRACT_SCHEMA = 'xtend.native-first.rmt-syntax-growth.v1';
const MATRIX_SCHEMA = 'xtend.native-first.rmt-syntax-growth-decision-matrix.v1';
const DECISION_SCHEMA = 'xtend.native-first.rmt-syntax-growth-decision.v1';
const FIXTURE_SCHEMA = 'xtend.native-first.rmt-syntax-growth-migration-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.native-first.rmt-syntax-growth-migration-fixtures.v1';
const REPORT_SCHEMA = 'xtend.native-first.rmt-syntax-growth-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-syntax-growth --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-syntax-growth';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-syntax-growth-migration-fixtures.json';

const REQUIRED_FIELDS = Object.freeze([
  'decisionId',
  'sourceGap',
  'proposal',
  'decision',
  'syntaxSurface',
  'coreRecordPlan',
  'sourceMapPlan',
  'diagnosticPlan',
  'migrationFixture',
  'positiveClaim',
  'negativeClaim',
  'owner',
  'sourceGates',
  'nextHandoff'
]);

const DECISION_STATUSES = Object.freeze([
  'accept-syntax-growth',
  'accept-core-record-only',
  'defer-owned-primitive',
  'defer-to-wp16-resource-action',
  'reject-imperative-or-html-bypass'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'syntax-growth-decisions-only-no-runtime-implementation',
  'compile-to-core-record-required',
  'source-map-and-diagnostics-required',
  'no-inline-javascript-or-unsafe-html-sink',
  'no-imperative-control-flow',
  'no-new-runtime-dependency',
  'rmt-kernel-remains-host-neutral',
  'migration-fixture-required-for-accepted-syntax',
  'owned-primitive-needed-remains-negative-claim'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-syntax-growth',
  'rmt-ui-primitive-gap',
  'rmt-vnext-compiler',
  'rmt-vnext-composition',
  'rmt-vnext-surfaces',
  'rmt-vnext-events',
  'rmt-vnext-security',
  'rmt-dom-descriptor-renderer',
  'rmt-component-template-primitives',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-app-platform-tooling',
  'rmt-app-platform-fixture',
  'rmt-native-shell-migration',
  'native-first-market-pattern-parity',
  'contract-runtime-parity',
  'references'
]);

const FORBIDDEN_TOKENS = Object.freeze([
  'innerHTML',
  'eval(',
  'function ',
  'for(',
  'while('
]);

const REQUIRED_DECISIONS = Object.freeze([
  {
    decisionId: 'NFM-RSG-01',
    sourceGaps: ['NFM-RUG-01'],
    proposal: 'route-shell-record-and-navigation-state-binding',
    decision: 'accept-core-record-only',
    syntaxSurfaces: ['route-shell-record', 'navigation-state'],
    coreRecords: ['routes[]', 'surfaces[]', 'events[]', 'sourceMap[]'],
    diagnostics: ['rmt.syntax.route.shell.surface_missing', 'rmt.syntax.route.navigation_adapter_residual'],
    fixture: 'NFM-RSG-FIX-01',
    negativeClaim: 'no-native-navigation-api-product-claim',
    owner: 'rmt-routing-owner',
    sourceGates: ['rmt-vnext-compiler', 'rmt-vnext-surfaces', 'rmt-app-platform-fixture', 'rmt-ui-primitive-gap'],
    nextHandoff: 'NFM-WP-17'
  },
  {
    decisionId: 'NFM-RSG-02',
    sourceGaps: ['NFM-RUG-02'],
    proposal: 'layout-region-slot-composition-sugar',
    decision: 'accept-syntax-growth',
    syntaxSurfaces: ['layout', 'region', 'slot'],
    coreRecords: ['templates[]', 'slots[]', 'components[]', 'sourceMap[]'],
    diagnostics: ['rmt.syntax.layout.region.unresolved', 'rmt.syntax.layout.slot.duplicate', 'rmt.syntax.layout.core_record_missing'],
    fixture: 'NFM-RSG-FIX-02',
    negativeClaim: 'no-complete-layout-sugar-claim',
    owner: 'rmt-language-owner',
    sourceGates: ['rmt-vnext-composition', 'rmt-component-template-primitives', 'native-first-market-pattern-parity', 'rmt-ui-primitive-gap'],
    nextHandoff: 'NFM-WP-17'
  },
  {
    decisionId: 'NFM-RSG-03',
    sourceGaps: ['NFM-RUG-07'],
    proposal: 'surface-region-portal-overlay-records',
    decision: 'accept-syntax-growth',
    syntaxSurfaces: ['surface', 'region', 'portal', 'overlay'],
    coreRecords: ['surfaces[]', 'slots[]', 'securityPolicies[]', 'sourceMap[]'],
    diagnostics: ['rmt.syntax.surface.kind.unknown', 'rmt.syntax.portal.target_missing', 'rmt.syntax.surface.trust_policy_missing'],
    fixture: 'NFM-RSG-FIX-03',
    negativeClaim: 'no-complete-surface-maximality-claim',
    owner: 'surface-runtime-owner',
    sourceGates: ['rmt-vnext-surfaces', 'rmt-dom-descriptor-renderer', 'rmt-native-shell-migration', 'rmt-vnext-security', 'rmt-ui-primitive-gap'],
    nextHandoff: 'NFM-WP-18'
  },
  {
    decisionId: 'NFM-RSG-04',
    sourceGaps: ['NFM-RUG-11'],
    proposal: 'collection-view-record-and-owned-data-display-package',
    decision: 'defer-owned-primitive',
    syntaxSurfaces: ['collection-view', 'item-template', 'empty-state'],
    coreRecords: ['components[]', 'templates[]', 'dataSources[]', 'sourceMap[]'],
    diagnostics: ['rmt.syntax.collection.owned_primitive_missing', 'rmt.syntax.collection.datasource_missing'],
    fixture: 'NFM-RSG-FIX-04',
    negativeClaim: 'no-table-tree-data-grid-virtual-list-claim',
    owner: 'component-data-display-owner',
    sourceGates: ['native-first-market-pattern-parity', 'rmt-component-template-primitives', 'rmt-surface-resource-graph-runtime', 'rmt-ui-primitive-gap'],
    nextHandoff: 'owned-data-display-package'
  },
  {
    decisionId: 'NFM-RSG-05',
    sourceGaps: ['NFM-RUG-12'],
    proposal: 'command-source-record-and-owned-search-package',
    decision: 'defer-owned-primitive',
    syntaxSurfaces: ['command-source', 'search-source', 'combobox-source'],
    coreRecords: ['components[]', 'events[]', 'actions[]', 'state[]', 'resources[]', 'sourceMap[]'],
    diagnostics: ['rmt.syntax.command.owned_primitive_missing', 'rmt.syntax.command.action_ref_missing', 'rmt.syntax.command.resource_ref_missing'],
    fixture: 'NFM-RSG-FIX-05',
    negativeClaim: 'no-command-palette-autocomplete-rich-combobox-claim',
    owner: 'component-command-search-owner',
    sourceGates: ['native-first-market-pattern-parity', 'rmt-action-effect-runtime', 'rmt-event-routing-runtime', 'rmt-ui-primitive-gap'],
    nextHandoff: 'NFM-WP-16'
  },
  {
    decisionId: 'NFM-RSG-06',
    sourceGaps: ['NFM-RUG-05', 'NFM-RUG-06', 'NFM-RUG-12'],
    proposal: 'binding-action-resource-records',
    decision: 'defer-to-wp16-resource-action',
    syntaxSurfaces: ['bind', 'on', 'action', 'resource'],
    coreRecords: ['events[]', 'operations[]', 'dataSources[]', 'resources[]', 'sourceMap[]'],
    diagnostics: ['rmt.syntax.binding.free_function_call', 'rmt.syntax.resource.lifecycle_missing', 'rmt.syntax.action.effect_policy_missing'],
    fixture: 'NFM-RSG-FIX-06',
    negativeClaim: 'no-resource-data-ui-family-claim',
    owner: 'rmt-resource-action-owner',
    sourceGates: ['rmt-vnext-events', 'rmt-action-effect-runtime', 'rmt-event-routing-runtime', 'contract-runtime-parity', 'rmt-ui-primitive-gap'],
    nextHandoff: 'NFM-WP-16'
  },
  {
    decisionId: 'NFM-RSG-07',
    sourceGaps: ['NFM-RUG-02', 'NFM-RUG-11', 'NFM-RUG-12'],
    proposal: 'component-composition-sugar',
    decision: 'accept-syntax-growth',
    syntaxSurfaces: ['component-compose', 'part', 'slot', 'props'],
    coreRecords: ['components[]', 'templates[]', 'slots[]', 'sourceMap[]'],
    diagnostics: ['rmt.syntax.component.part_missing', 'rmt.syntax.component.slot_contract_mismatch', 'rmt.syntax.component.prop_type_unresolved'],
    fixture: 'NFM-RSG-FIX-07',
    negativeClaim: 'no-framework-api-emulation-claim',
    owner: 'rmt-component-authoring-owner',
    sourceGates: ['rmt-vnext-composition', 'rmt-component-template-primitives', 'rmt-app-platform-tooling', 'native-first-market-pattern-parity'],
    nextHandoff: 'NFM-WP-17'
  },
  {
    decisionId: 'NFM-RSG-08',
    sourceGaps: ['cross-cutting-security-boundary'],
    proposal: 'reject-inline-js-html-and-imperative-control-flow',
    decision: 'reject-imperative-or-html-bypass',
    syntaxSurfaces: ['if', 'for', 'while', 'function', 'innerHTML', 'eval'],
    coreRecords: ['none'],
    diagnostics: ['rmt.syntax.imperative_control_flow_forbidden', 'rmt.syntax.inline_html_forbidden', 'rmt.syntax.inline_javascript_forbidden'],
    fixture: 'NFM-RSG-FIX-08',
    negativeClaim: 'Inline-JavaScript, Eval, Inline-HTML und imperative Sprache bleiben verboten',
    owner: 'rmt-security-owner',
    sourceGates: ['rmt-vnext-security', 'rmt-dom-descriptor-renderer', 'contract-runtime-parity', 'references'],
    nextHandoff: 'NFM-WP-18'
  }
]);

const ACCEPTED_SYNTAX_SURFACES = Object.freeze([
  'layout',
  'region',
  'slot',
  'surface',
  'portal',
  'overlay',
  'component-compose'
]);

const BLOCKED_CLAIMS = Object.freeze([
  'RMT Syntax Growth ist bereits implementiert',
  'no-complete-layout-sugar-claim',
  'no-complete-surface-maximality-claim',
  'no-table-tree-data-grid-virtual-list-claim',
  'no-command-palette-autocomplete-rich-combobox-claim',
  'Inline-JavaScript, Eval, Inline-HTML oder imperative Sprache'
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

function containsAnyForbiddenToken(text) {
  return FORBIDDEN_TOKENS.some((token) => String(text).includes(token));
}

function runNativeFirstRmtSyntaxGrowthSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-RMT-Syntax-Growth-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-15-RMT-Syntax-Growth-fuer-Layout-Composition-und-UI-Primitives-entscheiden.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const gapContract = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md', rootDir);
  const gapMatrix = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', rootDir);
  const coreContract = readText('development/XTendRMT-vNext-Core-Format-Contract.md', rootDir);
  const grammarContract = readText('development/XTendRMT-vNext-Grammar-Contract.md', rootDir);
  const surfaceContract = readText('development/XTendRMT-vNext-Surface-Registry-Contract.md', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstRmtSyntaxGrowth;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'xtend.native-first.rmt-ui-primitive-gap.v1',
    'xtend.rmt.core-format.vnext.v1',
    'xtend.rmt.vnext.grammar.v1',
    'xtend.rmt.vnext-surface-registry.v1',
    LOCAL_GATE
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, DECISION_STATUSES, 'Contract decision statuses');
  assertIncludesAll(context, contract, REQUIRED_BOUNDARIES, 'Contract boundaries');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'keine Runtime-Implementierung neuer Syntax in WP-15',
    'kein Parser- oder Compiler-Code als Produktivpfad in WP-15',
    'kein fertiger DataGrid-, Table-, Tree-, VirtualList-, Command-Palette-, Autocomplete- oder rich Combobox-Claim'
  ], 'Contract non-goals');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    'Decision Summary',
    'Accepted Syntax Surfaces',
    'Blocked Claims nach WP-15',
    'Migration Fixture Coverage'
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix fields');
  assertIncludesAll(context, matrix, [
    '`accept-syntax-growth` | 3',
    '`accept-core-record-only` | 1',
    '`defer-owned-primitive` | 2',
    '`defer-to-wp16-resource-action` | 1',
    '`reject-imperative-or-html-bypass` | 1'
  ], 'Matrix decision counts');
  assertIncludesAll(context, matrix, ACCEPTED_SYNTAX_SURFACES, 'Matrix accepted syntax surfaces');
  assertIncludesAll(context, matrix, BLOCKED_CLAIMS, 'Matrix blocked claims');

  REQUIRED_DECISIONS.forEach((decision) => {
    assertIncludesAll(context, matrix, [
      decision.decisionId,
      decision.proposal,
      decision.decision,
      decision.fixture,
      decision.owner,
      decision.nextHandoff
    ], `Matrix row ${decision.decisionId}`);
    assertIncludesAll(context, matrix, decision.sourceGaps, `Matrix row ${decision.decisionId} source gaps`);
    assertIncludesAll(context, matrix, decision.syntaxSurfaces, `Matrix row ${decision.decisionId} syntax surfaces`);
    assertIncludesAll(context, matrix, decision.coreRecords, `Matrix row ${decision.decisionId} core records`);
    assertIncludesAll(context, matrix, decision.diagnostics, `Matrix row ${decision.decisionId} diagnostics`);
    assertIncludesAll(context, matrix, decision.sourceGates, `Matrix row ${decision.decisionId} source gates`);
    decision.sourceGates.forEach((gate) => assertRunnerGate(context, runner, gate));
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references WP-15 contract');
  context.assert(fixtures && fixtures.workpackage === 'NFM-WP-15', 'Fixture pack references WP-15');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_DECISIONS.length, 'Fixture pack contains one fixture per decision');

  REQUIRED_DECISIONS.forEach((decision) => {
    const fixture = fixtureRows.find((candidate) => candidate.fixtureId === decision.fixture);
    context.assert(Boolean(fixture), `Fixture pack contains ${decision.fixture}`);
    if (!fixture) return;
    context.assert(fixture.decisionId === decision.decisionId, `${decision.fixture} maps to ${decision.decisionId}`);
    decision.sourceGaps.forEach((sourceGap) => {
      context.assert(String(fixture.sourceGap).includes(sourceGap) || decision.sourceGaps.length > 1, `${decision.fixture} references source gap ${sourceGap}`);
    });
    assertArrayIncludesAll(context, fixture.coreRecords, decision.coreRecords, `${decision.fixture} core records`);
    assertArrayIncludesAll(context, fixture.diagnostics, decision.diagnostics, `${decision.fixture} diagnostics`);
    assertArrayIncludesAll(context, fixture.forbiddenTokens, FORBIDDEN_TOKENS, `${decision.fixture} forbidden tokens`);
    context.assert(!containsAnyForbiddenToken(fixture.afterSyntax), `${decision.fixture} afterSyntax does not contain forbidden tokens`);
    context.assert(Boolean(fixture.migrationStatus), `${decision.fixture} exposes migration status`);
  });

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    DECISION_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    FIXTURE_PATH,
    'NFM-WP-16',
    'NFM-WP-17',
    'NFM-WP-18',
    'owned-data-display-package',
    'owned-command-search-package'
  ], 'Workpackage schemas, gate and handoff');

  assertIncludesAll(context, gapContract, [
    'Eine Gap-Zeile mit `syntax-growth-needed` muss einen Core-Record-, Source-Map- und Diagnostics-Pfad fuer `NFM-WP-15` benennen.',
    '`NFM-WP-15` | entscheidet Syntax Growth'
  ], 'WP-14 contract handoff');
  assertIncludesAll(context, gapMatrix, [
    'NFM-RUG-01',
    'NFM-RUG-02',
    'NFM-RUG-07',
    'NFM-RUG-11',
    'NFM-RUG-12',
    'NFM-WP-15'
  ], 'WP-14 matrix inputs');
  assertIncludesAll(context, grammarContract, [
    'Inline-JavaScript',
    'Inline-HTML',
    'template',
    'surface',
    'slot',
    'on',
    'action'
  ], 'RMT grammar source inputs');
  assertIncludesAll(context, coreContract, [
    'templates',
    'surfaces',
    'slots',
    'events',
    'dataSources',
    'securityPolicies',
    'sourceMap'
  ], 'RMT core source inputs');
  assertIncludesAll(context, surfaceContract, [
    'root',
    'modal',
    'panel',
    'overlay',
    'workspace',
    'portal'
  ], 'RMT surface source inputs');

  context.assertIncludes(roadmap, '| `NFM-WP-15` | P1 | completed |', 'Roadmap marks NFM-WP-15 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-16` | P1 | ready |') || roadmap.includes('| `NFM-WP-16` | P1 | completed |'),
    'Roadmap keeps NFM-WP-16 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-RMT-Syntax-Growth-Contract.md', 'Roadmap references WP-15 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-15 gate');

  context.assertIncludes(mission, 'RMT Syntax Growth Contract: `xtend.native-first.rmt-syntax-growth.v1`', 'Mission references WP-15 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', 'Mission source-of-truth lists WP-15 matrix');
  context.assertIncludes(mission, '`NFM-WP-15` | completed', 'Mission handoff marks WP-15 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'rmt-language-owner',
    'NFM-WP-15',
    REPORT_SCHEMA,
    'rmt-syntax-growth',
    'development/XTend-Native-First-RMT-Syntax-Growth-Contract.md',
    'rmt-syntax-growth-decision-matrix',
    'gate-plan'
  ], 'Registry WP-15 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-15',
    'rmt-syntax-growth',
    CONTRACT_SCHEMA
  ], 'Registry contract WP-15 extension');

  context.assert(packageScripts['test:rmt-syntax-growth'] === 'node scripts/run_xtend_tests.js rmt-syntax-growth', 'Package exposes WP-15 test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_rmt_syntax_growth_suite')", 'Runner imports WP-15 suite');
  context.assertIncludes(runner, "id: 'rmt-syntax-growth'", 'Runner registers WP-15 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-15 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-15 matrix schema');
  context.assert(metadata && metadata.decisionSchema === DECISION_SCHEMA, 'Package metadata exposes WP-15 decision schema');
  context.assert(metadata && metadata.migrationFixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes WP-15 fixture schema');
  context.assert(metadata && metadata.migrationFixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes WP-15 fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-15 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-RMT-Syntax-Growth-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.migrationFixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-15-RMT-Syntax-Growth-fuer-Layout-Composition-und-UI-Primitives-entscheiden.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.runtimeImplementationIncluded === false, 'Package metadata declares no runtime implementation');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework dependency');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata preserves RMT kernel boundary');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.decisionStatuses, DECISION_STATUSES, 'Package metadata decision statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');
  assertArrayIncludesAll(context, metadata && metadata.acceptedSyntaxSurfaces, ACCEPTED_SYNTAX_SURFACES, 'Package metadata accepted syntax surfaces');

  const decisions = (metadata && metadata.decisions) || [];
  context.assert(decisions.length === REQUIRED_DECISIONS.length, 'Package metadata registers all decision rows');
  REQUIRED_DECISIONS.forEach((required) => {
    const decision = decisions.find((candidate) => candidate.decisionId === required.decisionId);
    context.assert(Boolean(decision), `Package metadata registers ${required.decisionId}`);
    if (!decision) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(decision[field]), `Package metadata ${required.decisionId} has ${field}`);
    });
    context.assert(decision.proposal === required.proposal, `Package metadata ${required.decisionId} has proposal`);
    context.assert(decision.decision === required.decision, `Package metadata ${required.decisionId} has decision`);
    context.assert(decision.migrationFixture === required.fixture, `Package metadata ${required.decisionId} has fixture`);
    context.assert(decision.owner === required.owner, `Package metadata ${required.decisionId} has owner`);
    context.assert(String(decision.nextHandoff).includes(required.nextHandoff), `Package metadata ${required.decisionId} has handoff`);
    required.sourceGaps.forEach((sourceGap) => {
      context.assert(String(decision.sourceGap).includes(sourceGap), `Package metadata ${required.decisionId} has source gap ${sourceGap}`);
    });
    assertArrayIncludesAll(context, decision.syntaxSurface, required.syntaxSurfaces, `Package metadata ${required.decisionId} syntax surfaces`);
    assertArrayIncludesAll(context, decision.coreRecordPlan, required.coreRecords, `Package metadata ${required.decisionId} core records`);
    assertArrayIncludesAll(context, decision.diagnosticPlan, required.diagnostics, `Package metadata ${required.decisionId} diagnostics`);
    assertArrayIncludesAll(context, decision.sourceGates, required.sourceGates, `Package metadata ${required.decisionId} source gates`);
  });

  const decisionCounts = countBy(decisions, 'decision');
  context.assert(decisionCounts['accept-syntax-growth'] === 3, 'Package metadata counts accepted syntax growth decisions');
  context.assert(decisionCounts['accept-core-record-only'] === 1, 'Package metadata counts core-record-only decisions');
  context.assert(decisionCounts['defer-owned-primitive'] === 2, 'Package metadata counts owned primitive deferrals');
  context.assert(decisionCounts['defer-to-wp16-resource-action'] === 1, 'Package metadata counts WP-16 deferrals');
  context.assert(decisionCounts['reject-imperative-or-html-bypass'] === 1, 'Package metadata counts rejected bypass decisions');

  const registryEntries = (registryMetadata && registryMetadata.entries) || [];
  context.assert(registryEntries.some((entry) => entry.contractId === CONTRACT_SCHEMA && entry.workpackage === 'NFM-WP-15'), 'Registry package metadata includes WP-15 contract');
  context.assert(Array.isArray(registryMetadata && registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('rmt-syntax-growth'), 'Registry package metadata lists WP-15 source gate');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-Syntax-Growth-Contract.md', 'WP-15 contract path');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', 'WP-15 matrix path');
  assertPathExists(context, rootDir, 'development/NFM-WP-15-RMT-Syntax-Growth-fuer-Layout-Composition-und-UI-Primitives-entscheiden.md', 'WP-15 workpackage path');
  assertPathExists(context, rootDir, FIXTURE_PATH, 'WP-15 fixture path');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-15',
      contract: CONTRACT_SCHEMA,
      matrixSchema: MATRIX_SCHEMA,
      decisionRows: REQUIRED_DECISIONS.length,
      fixtureRows: fixtureRows.length,
      decisionCounts,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      runtimeImplementationIncluded: false,
      rmtKernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    }
  });
}

function printNativeFirstRmtSyntaxGrowthReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First RMT Syntax Growth erfolgreich.',
    failureTitle: 'Native-First RMT Syntax Growth fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstRmtSyntaxGrowthReport,
  runNativeFirstRmtSyntaxGrowthSuite
};

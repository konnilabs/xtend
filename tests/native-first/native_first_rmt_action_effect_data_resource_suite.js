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

const SUITE_ID = 'rmt-action-effect-data-resource-primitives';
const SUITE_LABEL = 'Native-First RMT Action Effect Data Resource Primitives';
const CONTRACT_SCHEMA = 'xtend.native-first.rmt-action-effect-data-resource-primitives.v1';
const MATRIX_SCHEMA = 'xtend.native-first.rmt-action-effect-data-resource-primitives-matrix.v1';
const ITEM_SCHEMA = 'xtend.native-first.rmt-action-effect-data-resource-primitive.v1';
const FIXTURE_SCHEMA = 'xtend.native-first.rmt-action-effect-data-resource-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.native-first.rmt-action-effect-data-resource-fixtures.v1';
const REPORT_SCHEMA = 'xtend.native-first.rmt-action-effect-data-resource-primitives-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-action-effect-data-resource-primitives';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-action-effect-data-resource-fixtures.json';

const REQUIRED_FIELDS = Object.freeze([
  'primitiveId',
  'sourceGap',
  'sourceSyntaxDecision',
  'proposal',
  'decision',
  'primitiveSurface',
  'rmtDomains',
  'coreRecordPlan',
  'runtimeSurface',
  'policyPlan',
  'sourceMapPlan',
  'diagnosticPlan',
  'fixture',
  'positiveClaim',
  'negativeClaim',
  'owner',
  'sourceGates',
  'nextHandoff'
]);

const DECISION_STATUSES = Object.freeze([
  'accept-action-binding',
  'accept-resource-lifecycle',
  'accept-datasource-policy',
  'accept-effect-policy',
  'defer-owned-ui-primitive',
  'reject-free-runtime-execution'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'declarative-action-resource-authoring-only',
  'no-free-runtime-execution',
  'no-inline-javascript-or-unsafe-html-sink',
  'data-source-adapters-are-injected',
  'resource-ownership-and-release-required',
  'side-effects-require-policy-records',
  'rmt-kernel-remains-host-neutral',
  'owned-ui-primitive-gaps-remain-negative-claims',
  'no-new-runtime-dependency'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-action-effect-data-resource-primitives',
  'rmt-syntax-growth',
  'rmt-ui-primitive-gap',
  'rmt-vnext-events',
  'rmt-vnext-security',
  'rmt-state-selector-runtime',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-app-platform-fixture',
  'native-first-form-navigation-media',
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

const REQUIRED_PRIMITIVES = Object.freeze([
  {
    primitiveId: 'NFM-RAE-01',
    sourceGaps: ['NFM-RUG-03'],
    sourceSyntaxDecision: 'none',
    proposal: 'form-binding-validation-result-record',
    decision: 'accept-action-binding',
    primitiveSurfaces: ['form-action', 'validation-result', 'result-state'],
    rmtDomains: ['events', 'actions', 'dataSources', 'state', 'sourceMap'],
    coreRecords: ['events[]', 'actions[]', 'dataSources[]', 'state[]', 'sourceMap[]'],
    runtimeSurface: ['rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'rmt-state-selector-runtime'],
    policies: ['validation-result-shape-required', 'no-free-function-handler'],
    diagnostics: ['rmt.action.form.validation_result_missing', 'rmt.action.form.payload_shape_missing', 'rmt.action.form.free_handler_forbidden'],
    fixture: 'NFM-RAE-FIX-01',
    negativeClaim: 'no-rich-combobox-autocomplete-claim',
    owner: 'component-forms-navigation-owner',
    sourceGates: ['native-first-form-navigation-media', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'rmt-state-selector-runtime', 'rmt-ui-primitive-gap'],
    nextHandoff: 'NFM-WP-17'
  },
  {
    primitiveId: 'NFM-RAE-02',
    sourceGaps: ['NFM-RUG-05'],
    sourceSyntaxDecision: 'NFM-RSG-06',
    proposal: 'command-action-binding-record',
    decision: 'accept-action-binding',
    primitiveSurfaces: ['command-action', 'event-action-ref', 'status-state'],
    rmtDomains: ['events', 'actions', 'effects', 'state', 'sourceMap'],
    coreRecords: ['events[]', 'actions[]', 'effects[]', 'state[]', 'sourceMap[]'],
    runtimeSurface: ['rmt-event-routing-runtime', 'rmt-action-effect-runtime'],
    policies: ['action-ref-required', 'effect-policy-required', 'command-ui-owned-primitive-not-claimed'],
    diagnostics: ['rmt.action.command.action_ref_missing', 'rmt.action.command.effect_policy_missing', 'rmt.action.command.owned_ui_missing'],
    fixture: 'NFM-RAE-FIX-02',
    negativeClaim: 'no-command-palette-claim',
    owner: 'rmt-resource-action-owner',
    sourceGates: ['rmt-syntax-growth', 'rmt-vnext-events', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'native-first-market-pattern-parity'],
    nextHandoff: 'owned-command-search-package'
  },
  {
    primitiveId: 'NFM-RAE-03',
    sourceGaps: ['NFM-RUG-06'],
    sourceSyntaxDecision: 'NFM-RSG-06',
    proposal: 'resource-query-lifecycle-record',
    decision: 'accept-resource-lifecycle',
    primitiveSurfaces: ['resource-query', 'loading-success-error-cancel', 'resource-owner'],
    rmtDomains: ['dataSources', 'resources', 'actions', 'operations', 'sourceMap'],
    coreRecords: ['dataSources[]', 'resources[]', 'actions[]', 'operations[]', 'sourceMap[]'],
    runtimeSurface: ['rmt-action-effect-runtime', 'rmt-surface-resource-graph-runtime'],
    policies: ['resource-owner-required', 'cancel-releases-resources', 'adapter-injected'],
    diagnostics: ['rmt.resource.lifecycle.owner_missing', 'rmt.resource.lifecycle.release_missing', 'rmt.resource.datasource.adapter_missing'],
    fixture: 'NFM-RAE-FIX-03',
    negativeClaim: 'no-resource-data-ui-family-claim',
    owner: 'rmt-resource-action-owner',
    sourceGates: ['rmt-syntax-growth', 'rmt-vnext-events', 'rmt-action-effect-runtime', 'rmt-surface-resource-graph-runtime', 'contract-runtime-parity'],
    nextHandoff: 'NFM-WP-17'
  },
  {
    primitiveId: 'NFM-RAE-04',
    sourceGaps: ['NFM-RUG-06'],
    sourceSyntaxDecision: 'NFM-RSG-06',
    proposal: 'effect-policy-and-scheduler-lane-record',
    decision: 'accept-effect-policy',
    primitiveSurfaces: ['feedback-effect', 'navigation-effect', 'focus-effect', 'lazy-import-effect', 'side-effect-policy'],
    rmtDomains: ['effects', 'actions', 'lanes', 'securityPolicies', 'sourceMap'],
    coreRecords: ['effects[]', 'actions[]', 'lanes[]', 'securityPolicies[]', 'sourceMap[]'],
    runtimeSurface: ['rmt-action-effect-runtime', 'rmt-vnext-security'],
    policies: ['effect-policy-required', 'side-effect-adapter-injected', 'scheduler-lane-visible'],
    diagnostics: ['rmt.effect.policy.missing', 'rmt.effect.side_effect.adapter_missing', 'rmt.effect.lane_ref_missing'],
    fixture: 'NFM-RAE-FIX-04',
    negativeClaim: 'freie Side Effects bleiben verboten',
    owner: 'rmt-effect-policy-owner',
    sourceGates: ['rmt-vnext-security', 'rmt-action-effect-runtime', 'rmt-vnext-events', 'contract-runtime-parity'],
    nextHandoff: 'NFM-WP-18'
  },
  {
    primitiveId: 'NFM-RAE-05',
    sourceGaps: ['NFM-RUG-06'],
    sourceSyntaxDecision: 'NFM-RSG-06',
    proposal: 'datasource-adapter-policy-record',
    decision: 'accept-datasource-policy',
    primitiveSurfaces: ['datasource-policy', 'adapter-ref', 'payload-shape', 'result-shape'],
    rmtDomains: ['dataSources', 'actions', 'securityPolicies', 'sourceMap'],
    coreRecords: ['dataSources[]', 'actions[]', 'securityPolicies[]', 'sourceMap[]'],
    runtimeSurface: ['rmt-vnext-events', 'rmt-action-effect-runtime'],
    policies: ['adapter-ref-required', 'payload-result-shape-required', 'no-kernel-network-default'],
    diagnostics: ['rmt.datasource.adapter_ref_missing', 'rmt.datasource.result_shape_missing', 'rmt.datasource.kernel_network_forbidden'],
    fixture: 'NFM-RAE-FIX-05',
    negativeClaim: 'Kernel-Netzwerkzugriff ohne injizierten Adapter bleibt verboten',
    owner: 'rmt-datasource-owner',
    sourceGates: ['rmt-vnext-events', 'rmt-action-effect-runtime', 'rmt-app-platform-fixture', 'contract-runtime-parity'],
    nextHandoff: 'NFM-WP-17'
  },
  {
    primitiveId: 'NFM-RAE-06',
    sourceGaps: ['NFM-RUG-12'],
    sourceSyntaxDecision: 'NFM-RSG-05',
    proposal: 'command-search-resource-binding-record',
    decision: 'defer-owned-ui-primitive',
    primitiveSurfaces: ['command-source', 'search-resource', 'action-result-state'],
    rmtDomains: ['components', 'events', 'actions', 'resources', 'state', 'sourceMap'],
    coreRecords: ['components[]', 'events[]', 'actions[]', 'resources[]', 'state[]', 'sourceMap[]'],
    runtimeSurface: ['rmt-event-routing-runtime', 'rmt-action-effect-runtime'],
    policies: ['owned-command-search-ui-required', 'resource-binding-allowed', 'autocomplete-ui-not-claimed'],
    diagnostics: ['rmt.command_search.owned_ui_missing', 'rmt.command_search.resource_ref_missing', 'rmt.command_search.action_result_missing'],
    fixture: 'NFM-RAE-FIX-06',
    negativeClaim: 'no-command-palette-autocomplete-rich-combobox-claim',
    owner: 'component-command-search-owner',
    sourceGates: ['rmt-syntax-growth', 'native-first-market-pattern-parity', 'rmt-action-effect-runtime', 'rmt-event-routing-runtime'],
    nextHandoff: 'owned-command-search-package'
  },
  {
    primitiveId: 'NFM-RAE-07',
    sourceGaps: ['NFM-RUG-06'],
    sourceSyntaxDecision: 'NFM-RSG-06',
    proposal: 'owned-resource-cleanup-contract',
    decision: 'accept-resource-lifecycle',
    primitiveSurfaces: ['object-url', 'stream', 'observer', 'timer', 'lazy-import'],
    rmtDomains: ['resources', 'effects', 'actions', 'sourceMap'],
    coreRecords: ['resources[]', 'effects[]', 'actions[]', 'sourceMap[]'],
    runtimeSurface: ['createRmtResourceManager', 'rmt-action-effect-runtime'],
    policies: ['owner-scope-required', 'release-on-cancel-or-owner-dispose', 'diagnostics-on-leak'],
    diagnostics: ['rmt.resource.owner_scope_missing', 'rmt.resource.release_on_cancel_missing', 'rmt.resource.leak_detected'],
    fixture: 'NFM-RAE-FIX-07',
    negativeClaim: 'Resource Handles duerfen nicht global oder leaky bleiben',
    owner: 'rmt-resource-lifecycle-owner',
    sourceGates: ['rmt-action-effect-runtime', 'rmt-surface-resource-graph-runtime', 'contract-runtime-parity', 'references'],
    nextHandoff: 'NFM-WP-19'
  },
  {
    primitiveId: 'NFM-RAE-08',
    sourceGaps: ['cross-cutting-security-boundary'],
    sourceSyntaxDecision: 'NFM-RSG-08',
    proposal: 'reject-free-runtime-execution',
    decision: 'reject-free-runtime-execution',
    primitiveSurfaces: ['inline-handler', 'eval', 'inline-js', 'inline-html', 'unscoped-side-effect'],
    rmtDomains: ['none'],
    coreRecords: ['none'],
    runtimeSurface: ['none'],
    policies: ['free-runtime-execution-forbidden', 'unsafe-html-sink-forbidden', 'unscoped-side-effect-forbidden'],
    diagnostics: ['rmt.action.free_runtime_execution_forbidden', 'rmt.action.inline_javascript_forbidden', 'rmt.action.inline_html_forbidden'],
    fixture: 'NFM-RAE-FIX-08',
    negativeClaim: 'freie Runtime-Ausfuehrung bleibt verboten',
    owner: 'rmt-security-owner',
    sourceGates: ['rmt-syntax-growth', 'rmt-vnext-security', 'contract-runtime-parity', 'references'],
    nextHandoff: 'NFM-WP-18'
  }
]);

const BLOCKED_CLAIMS = Object.freeze([
  'no-command-palette-autocomplete-rich-combobox-claim',
  'no-resource-data-ui-family-claim',
  'no-command-palette-claim',
  'Kernel-Netzwerkzugriff ohne injizierten Adapter bleibt verboten',
  'freie Runtime-Ausfuehrung bleibt verboten',
  'Data Display UI bleibt `owned-data-display-package`'
]);

const RUNTIME_EVIDENCE = Object.freeze([
  'xtend.epic18.rmt-action-effect-runtime.v1',
  'createRmtActionEffectRuntime',
  'createRmtResourceManager',
  'fixture',
  'rest',
  'ssr',
  'host',
  'object-url',
  'stream',
  'observer',
  'timer',
  'lazy-import',
  'resource-owner-cleanup',
  'data-access-through-injected-adapters'
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

function runNativeFirstRmtActionEffectDataResourceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-16-RMT-Action-Effect-Data-und-Resource-Primitives-erweitern.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const gapMatrix = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', rootDir);
  const syntaxMatrix = readText('development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', rootDir);
  const eventContract = readText('development/XTendRMT-vNext-Event-Action-DataSource-Contract.md', rootDir);
  const runtimePlan = readText('catalog/epic18-rmt-action-effect-runtime.js', rootDir);
  const runtimeSource = readText('xtendrmt/rmt-action-effect-runtime.js', rootDir);
  const runtimeFixture = readText('tests/fixtures/rmt-action-effect-runtime.rmt', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstRmtActionEffectDataResourcePrimitives;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'xtend.native-first.rmt-ui-primitive-gap.v1',
    'xtend.native-first.rmt-syntax-growth.v1',
    'xtend.rmt.vnext-event-action-contract.v1',
    'xtend.epic18.rmt-action-effect-runtime.v1',
    LOCAL_GATE
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, DECISION_STATUSES, 'Contract decision statuses');
  assertIncludesAll(context, contract, REQUIRED_BOUNDARIES, 'Contract boundaries');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'kein neues Produkt-Action-Framework neben RMT',
    'keine freie Runtime-Ausfuehrung, keine Handler-Funktionen, kein Eval',
    'kein fertiger DataGrid-, Table-, Tree-, VirtualList-, Command-Palette-, Autocomplete- oder rich Combobox-Claim'
  ], 'Contract non-goals');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    'Decision Summary',
    'Primitive Capability Coverage',
    'Blocked Claims nach WP-16',
    'Fixture Coverage'
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix fields');
  assertIncludesAll(context, matrix, [
    '`accept-action-binding` | 2',
    '`accept-resource-lifecycle` | 2',
    '`accept-effect-policy` | 1',
    '`accept-datasource-policy` | 1',
    '`defer-owned-ui-primitive` | 1',
    '`reject-free-runtime-execution` | 1'
  ], 'Matrix decision counts');
  assertIncludesAll(context, matrix, BLOCKED_CLAIMS, 'Matrix blocked claims');

  REQUIRED_PRIMITIVES.forEach((primitive) => {
    assertIncludesAll(context, matrix, [
      primitive.primitiveId,
      primitive.sourceSyntaxDecision,
      primitive.proposal,
      primitive.decision,
      primitive.fixture,
      primitive.owner,
      primitive.nextHandoff
    ], `Matrix row ${primitive.primitiveId}`);
    assertIncludesAll(context, matrix, primitive.sourceGaps, `Matrix row ${primitive.primitiveId} source gaps`);
    assertIncludesAll(context, matrix, primitive.primitiveSurfaces, `Matrix row ${primitive.primitiveId} primitive surfaces`);
    assertIncludesAll(context, matrix, primitive.rmtDomains, `Matrix row ${primitive.primitiveId} RMT domains`);
    assertIncludesAll(context, matrix, primitive.coreRecords, `Matrix row ${primitive.primitiveId} core records`);
    assertIncludesAll(context, matrix, primitive.runtimeSurface, `Matrix row ${primitive.primitiveId} runtime surfaces`);
    assertIncludesAll(context, matrix, primitive.policies, `Matrix row ${primitive.primitiveId} policies`);
    assertIncludesAll(context, matrix, primitive.diagnostics, `Matrix row ${primitive.primitiveId} diagnostics`);
    assertIncludesAll(context, matrix, primitive.sourceGates, `Matrix row ${primitive.primitiveId} source gates`);
    primitive.sourceGates.forEach((gate) => assertRunnerGate(context, runner, gate));
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references WP-16 contract');
  context.assert(fixtures && fixtures.workpackage === 'NFM-WP-16', 'Fixture pack references WP-16');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_PRIMITIVES.length, 'Fixture pack contains one fixture per primitive');

  REQUIRED_PRIMITIVES.forEach((primitive) => {
    const fixture = fixtureRows.find((candidate) => candidate.fixtureId === primitive.fixture);
    context.assert(Boolean(fixture), `Fixture pack contains ${primitive.fixture}`);
    if (!fixture) return;
    context.assert(fixture.primitiveId === primitive.primitiveId, `${primitive.fixture} maps to ${primitive.primitiveId}`);
    primitive.sourceGaps.forEach((sourceGap) => {
      context.assert(String(fixture.sourceGap).includes(sourceGap) || primitive.sourceGaps.length > 1, `${primitive.fixture} references source gap ${sourceGap}`);
    });
    assertArrayIncludesAll(context, fixture.coreRecords, primitive.coreRecords, `${primitive.fixture} core records`);
    assertArrayIncludesAll(context, fixture.runtimeSurface, primitive.runtimeSurface, `${primitive.fixture} runtime surfaces`);
    assertArrayIncludesAll(context, fixture.policies, primitive.policies, `${primitive.fixture} policies`);
    assertArrayIncludesAll(context, fixture.diagnostics, primitive.diagnostics, `${primitive.fixture} diagnostics`);
    assertArrayIncludesAll(context, fixture.forbiddenTokens, FORBIDDEN_TOKENS, `${primitive.fixture} forbidden tokens`);
    context.assert(!containsAnyForbiddenToken(fixture.authoring), `${primitive.fixture} authoring does not contain forbidden tokens`);
    context.assert(Boolean(fixture.expectedOutcome), `${primitive.fixture} exposes expected outcome`);
  });

  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  assertIncludesAll(context, workpackage, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    FIXTURE_PATH,
    'NFM-WP-17',
    'NFM-WP-18',
    'NFM-WP-19',
    'owned-data-display-package',
    'owned-command-search-package'
  ], 'Workpackage schemas, gate and handoff');

  assertIncludesAll(context, gapMatrix, [
    'NFM-RUG-03',
    'NFM-RUG-05',
    'NFM-RUG-06',
    'NFM-RUG-12',
    'NFM-WP-16'
  ], 'WP-14 gap inputs');
  assertIncludesAll(context, syntaxMatrix, [
    'NFM-RSG-05',
    'NFM-RSG-06',
    'NFM-WP-16'
  ], 'WP-15 syntax handoff inputs');
  assertIncludesAll(context, eventContract, [
    'xtend.rmt.vnext-event-action-contract.v1',
    'Event Binding',
    'Action Ref',
    'Data Source',
    '"runtimeEval": false'
  ], 'RMT event contract inputs');
  assertIncludesAll(context, runtimePlan, RUNTIME_EVIDENCE, 'Action effect runtime plan evidence');
  assertIncludesAll(context, runtimeSource, [
    'createRmtActionEffectRuntime',
    'createRmtResourceManager',
    'runDataSource',
    'releaseOwner'
  ], 'Action effect runtime source evidence');
  assertIncludesAll(context, runtimeFixture, [
    '"kind": "fixture"',
    '"kind": "rest"',
    '"kind": "ssr"',
    '"kind": "host"',
    '"kind": "object-url"',
    '"kind": "stream"',
    '"kind": "observer"',
    '"kind": "timer"',
    '"kind": "lazy-import"',
    '"manualHtmlRendererAllowed": false',
    '"dataSourceAdapterMode": "injected-host-adapter"'
  ], 'Action effect runtime fixture evidence');

  context.assertIncludes(roadmap, '| `NFM-WP-16` | P1 | completed |', 'Roadmap marks NFM-WP-16 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-17` | P1 | ready |') || roadmap.includes('| `NFM-WP-17` | P1 | completed |'),
    'Roadmap keeps NFM-WP-17 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md', 'Roadmap references WP-16 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-16 gate');

  context.assertIncludes(mission, 'RMT Action Effect Data Resource Primitives Contract: `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`', 'Mission references WP-16 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', 'Mission source-of-truth lists WP-16 matrix');
  context.assertIncludes(mission, '`NFM-WP-16` | completed', 'Mission handoff marks WP-16 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'rmt-resource-action-owner',
    'NFM-WP-16',
    REPORT_SCHEMA,
    'rmt-action-effect-data-resource-primitives',
    'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md',
    'rmt-action-effect-data-resource-primitives-matrix',
    'gate-plan'
  ], 'Registry WP-16 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-16',
    'rmt-action-effect-data-resource-primitives',
    CONTRACT_SCHEMA
  ], 'Registry contract WP-16 extension');

  context.assert(packageScripts['test:rmt-action-effect-data-resource-primitives'] === 'node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives', 'Package exposes WP-16 test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_rmt_action_effect_data_resource_suite')", 'Runner imports WP-16 suite');
  context.assertIncludes(runner, "id: 'rmt-action-effect-data-resource-primitives'", 'Runner registers WP-16 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-16 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-16 matrix schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes WP-16 item schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes WP-16 fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes WP-16 fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-16 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-16-RMT-Action-Effect-Data-und-Resource-Primitives-erweitern.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework dependency');
  context.assert(metadata && metadata.freeRuntimeExecutionAllowed === false, 'Package metadata blocks free runtime execution');
  context.assert(metadata && metadata.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata preserves RMT kernel boundary');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.decisionStatuses, DECISION_STATUSES, 'Package metadata decision statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');

  const primitives = (metadata && metadata.primitives) || [];
  context.assert(primitives.length === REQUIRED_PRIMITIVES.length, 'Package metadata registers all primitive rows');
  REQUIRED_PRIMITIVES.forEach((required) => {
    const primitive = primitives.find((candidate) => candidate.primitiveId === required.primitiveId);
    context.assert(Boolean(primitive), `Package metadata registers ${required.primitiveId}`);
    if (!primitive) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(primitive[field]), `Package metadata ${required.primitiveId} has ${field}`);
    });
    context.assert(primitive.proposal === required.proposal, `Package metadata ${required.primitiveId} has proposal`);
    context.assert(primitive.decision === required.decision, `Package metadata ${required.primitiveId} has decision`);
    context.assert(primitive.fixture === required.fixture, `Package metadata ${required.primitiveId} has fixture`);
    context.assert(primitive.owner === required.owner, `Package metadata ${required.primitiveId} has owner`);
    context.assert(String(primitive.nextHandoff).includes(required.nextHandoff), `Package metadata ${required.primitiveId} has handoff`);
    required.sourceGaps.forEach((sourceGap) => {
      context.assert(String(primitive.sourceGap).includes(sourceGap), `Package metadata ${required.primitiveId} has source gap ${sourceGap}`);
    });
    assertArrayIncludesAll(context, primitive.primitiveSurface, required.primitiveSurfaces, `Package metadata ${required.primitiveId} primitive surfaces`);
    assertArrayIncludesAll(context, primitive.rmtDomains, required.rmtDomains, `Package metadata ${required.primitiveId} RMT domains`);
    assertArrayIncludesAll(context, primitive.coreRecordPlan, required.coreRecords, `Package metadata ${required.primitiveId} core records`);
    assertArrayIncludesAll(context, primitive.runtimeSurface, required.runtimeSurface, `Package metadata ${required.primitiveId} runtime surfaces`);
    assertArrayIncludesAll(context, primitive.policyPlan, required.policies, `Package metadata ${required.primitiveId} policies`);
    assertArrayIncludesAll(context, primitive.diagnosticPlan, required.diagnostics, `Package metadata ${required.primitiveId} diagnostics`);
    assertArrayIncludesAll(context, primitive.sourceGates, required.sourceGates, `Package metadata ${required.primitiveId} source gates`);
  });

  const decisionCounts = countBy(primitives, 'decision');
  context.assert(decisionCounts['accept-action-binding'] === 2, 'Package metadata counts action binding primitives');
  context.assert(decisionCounts['accept-resource-lifecycle'] === 2, 'Package metadata counts resource lifecycle primitives');
  context.assert(decisionCounts['accept-effect-policy'] === 1, 'Package metadata counts effect policy primitives');
  context.assert(decisionCounts['accept-datasource-policy'] === 1, 'Package metadata counts datasource policy primitives');
  context.assert(decisionCounts['defer-owned-ui-primitive'] === 1, 'Package metadata counts owned UI primitive deferrals');
  context.assert(decisionCounts['reject-free-runtime-execution'] === 1, 'Package metadata counts rejected runtime execution decisions');

  const registryEntries = (registryMetadata && registryMetadata.entries) || [];
  context.assert(registryEntries.some((entry) => entry.contractId === CONTRACT_SCHEMA && entry.workpackage === 'NFM-WP-16'), 'Registry package metadata includes WP-16 contract');
  context.assert(Array.isArray(registryMetadata && registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('rmt-action-effect-data-resource-primitives'), 'Registry package metadata lists WP-16 source gate');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md', 'WP-16 contract path');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', 'WP-16 matrix path');
  assertPathExists(context, rootDir, 'development/NFM-WP-16-RMT-Action-Effect-Data-und-Resource-Primitives-erweitern.md', 'WP-16 workpackage path');
  assertPathExists(context, rootDir, FIXTURE_PATH, 'WP-16 fixture path');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-16',
      contract: CONTRACT_SCHEMA,
      matrixSchema: MATRIX_SCHEMA,
      primitiveRows: REQUIRED_PRIMITIVES.length,
      fixtureRows: fixtureRows.length,
      decisionCounts,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      freeRuntimeExecutionAllowed: false,
      rmtKernelBoundary: 'no-rmt-kernel-import-of-xtend-types'
    }
  });
}

function printNativeFirstRmtActionEffectDataResourceReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First RMT Action Effect Data Resource Primitives erfolgreich.',
    failureTitle: 'Native-First RMT Action Effect Data Resource Primitives fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstRmtActionEffectDataResourceReport,
  runNativeFirstRmtActionEffectDataResourceSuite
};

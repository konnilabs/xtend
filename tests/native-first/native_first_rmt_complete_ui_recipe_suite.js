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

const SUITE_ID = 'rmt-complete-ui-recipes';
const SUITE_LABEL = 'Native-First RMT Complete UI Recipes';
const CONTRACT_SCHEMA = 'xtend.native-first.rmt-complete-ui-recipe-fixtures.v1';
const MATRIX_SCHEMA = 'xtend.native-first.rmt-complete-ui-recipe-matrix.v1';
const ITEM_SCHEMA = 'xtend.native-first.rmt-complete-ui-recipe.v1';
const FIXTURE_SCHEMA = 'xtend.native-first.rmt-complete-ui-recipe-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.native-first.rmt-complete-ui-recipe-fixtures.v1';
const REPORT_SCHEMA = 'xtend.native-first.rmt-complete-ui-recipe-fixtures-report.v1';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-complete-ui-recipes';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-complete-ui-recipe-fixtures.json';

const REQUIRED_FIELDS = Object.freeze([
  'recipeId',
  'recipeClass',
  'sourceGaps',
  'sourceSyntaxDecisions',
  'sourcePrimitiveDecisions',
  'status',
  'uiSurfaces',
  'rmtDomains',
  'coreRecordPlan',
  'ownedPrimitiveUse',
  'runtimeGates',
  'browserSmokePlan',
  'goldenFixturePlan',
  'visualEvidencePlan',
  'policyPlan',
  'blockedClaims',
  'sourceMapPlan',
  'fixture',
  'expectedOutcome',
  'owner',
  'nextHandoff'
]);

const RECIPE_STATUSES = Object.freeze([
  'recipe-accepted',
  'recipe-accepted-with-adapter-residual',
  'recipe-accepted-with-renderer-proof-residual',
  'recipe-blocked-owned-primitive'
]);

const REQUIRED_BOUNDARIES = Object.freeze([
  'complete-ui-recipes-are-fixtures-not-runtime',
  'no-free-runtime-execution',
  'no-inline-javascript-or-unsafe-html-sink',
  'owned-primitive-residuals-remain-negative-claims',
  'browser-smokes-and-visual-evidence-are-plans-until-wp18-wp19',
  'no-new-runtime-dependency'
]);

const REQUIRED_SOURCE_GATES = Object.freeze([
  'rmt-complete-ui-recipes',
  'rmt-syntax-growth',
  'rmt-action-effect-data-resource-primitives',
  'rmt-ui-primitive-gap',
  'rmt-vnext-compiler',
  'rmt-vnext-composition',
  'rmt-vnext-surfaces',
  'rmt-vnext-events',
  'rmt-vnext-security',
  'rmt-component-template-primitives',
  'rmt-dom-descriptor-renderer',
  'rmt-state-selector-runtime',
  'rmt-action-effect-runtime',
  'rmt-event-routing-runtime',
  'rmt-surface-resource-graph-runtime',
  'rmt-app-platform-tooling',
  'rmt-app-platform-fixture',
  'native-first-form-navigation-media',
  'native-first-overlay-focus',
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

const REQUIRED_RECIPES = Object.freeze([
  {
    recipeId: 'NFM-RCR-01',
    recipeClass: 'app-shell-routing',
    sourceGaps: ['NFM-RUG-01', 'NFM-RUG-02'],
    sourceSyntaxDecisions: ['NFM-RSG-01', 'NFM-RSG-02', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-05'],
    status: 'recipe-accepted-with-adapter-residual',
    uiSurfaces: ['route-shell', 'navigation-state', 'app-layout', 'global-actions'],
    rmtDomains: ['routes', 'surfaces', 'templates', 'slots', 'events', 'actions', 'state', 'sourceMap'],
    coreRecords: ['routes[]', 'surfaces[]', 'templates[]', 'slots[]', 'components[]', 'events[]', 'actions[]', 'state[]', 'sourceMap[]'],
    ownedPrimitives: ['x-shell', 'x-nav', 'x-link', 'x-button'],
    runtimeGates: ['rmt-vnext-compiler', 'rmt-vnext-surfaces', 'rmt-app-platform-fixture', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime'],
    browserSmokes: ['route-render-smoke', 'keyboard-nav-smoke', 'hydration-boundary-smoke'],
    goldenFixtures: ['rmt-app-platform-fixture', 'rmt-app-platform-tooling', 'rmt-vnext-regression'],
    visualEvidence: ['app-shell-desktop', 'app-shell-mobile'],
    policies: ['router-adapter-required', 'document-title-announcement-required', 'no-native-navigation-api-product-claim'],
    blockedClaims: ['no-native-navigation-api-product-claim'],
    fixture: 'NFM-RCR-FIX-01',
    expectedOutcome: 'accepted-with-router-adapter-residual',
    owner: 'rmt-routing-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    recipeId: 'NFM-RCR-02',
    recipeClass: 'dashboard-composition',
    sourceGaps: ['NFM-RUG-02', 'NFM-RUG-04', 'NFM-RUG-06', 'NFM-RUG-11'],
    sourceSyntaxDecisions: ['NFM-RSG-02', 'NFM-RSG-04', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-03', 'NFM-RAE-05', 'NFM-RAE-07'],
    status: 'recipe-accepted-with-adapter-residual',
    uiSurfaces: ['dashboard-layout', 'status-card', 'kpi-grid', 'collection-view-draft'],
    rmtDomains: ['templates', 'slots', 'components', 'state', 'selectors', 'dataSources', 'resources', 'schedules', 'sourceMap'],
    coreRecords: ['templates[]', 'slots[]', 'components[]', 'state[]', 'selectors[]', 'dataSources[]', 'resources[]', 'schedules[]', 'sourceMap[]'],
    ownedPrimitives: ['x-section', 'x-card', 'x-status', 'x-progress', 'x-list'],
    runtimeGates: ['rmt-component-template-primitives', 'rmt-state-selector-runtime', 'rmt-action-effect-runtime', 'rmt-surface-resource-graph-runtime', 'rmt-app-platform-fixture'],
    browserSmokes: ['dashboard-render-smoke', 'selector-update-smoke', 'resource-loading-smoke'],
    goldenFixtures: ['rmt-app-platform-fixture', 'rmt-state-selector-runtime', 'rmt-surface-resource-graph-runtime'],
    visualEvidence: ['dashboard-grid-desktop', 'dashboard-kpi-state'],
    policies: ['resource-owner-required', 'adapter-ref-required', 'owned-data-display-ui-required'],
    blockedClaims: ['no-table-tree-data-grid-virtual-list-claim'],
    fixture: 'NFM-RCR-FIX-02',
    expectedOutcome: 'accepted-with-data-display-residual',
    owner: 'component-data-display-owner',
    nextHandoff: ['NFM-WP-19', 'owned-data-display-package']
  },
  {
    recipeId: 'NFM-RCR-03',
    recipeClass: 'crud-form-workflow',
    sourceGaps: ['NFM-RUG-03', 'NFM-RUG-05', 'NFM-RUG-06'],
    sourceSyntaxDecisions: ['NFM-RSG-02', 'NFM-RSG-06'],
    sourcePrimitiveDecisions: ['NFM-RAE-01', 'NFM-RAE-03', 'NFM-RAE-05'],
    status: 'recipe-accepted',
    uiSurfaces: ['form-layout', 'fieldset', 'validation-result', 'submit-action', 'resource-query'],
    rmtDomains: ['components', 'templates', 'events', 'actions', 'dataSources', 'resources', 'state', 'sourceMap'],
    coreRecords: ['components[]', 'templates[]', 'events[]', 'actions[]', 'dataSources[]', 'resources[]', 'state[]', 'sourceMap[]'],
    ownedPrimitives: ['x-form', 'x-input', 'x-select', 'x-button', 'x-status'],
    runtimeGates: ['native-first-form-navigation-media', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'rmt-state-selector-runtime', 'rmt-app-platform-fixture'],
    browserSmokes: ['form-submit-smoke', 'validation-feedback-smoke', 'focus-order-smoke'],
    goldenFixtures: ['rmt-action-effect-runtime', 'rmt-form-controls-ux', 'rmt-app-platform-fixture'],
    visualEvidence: ['crud-form-valid', 'crud-form-invalid'],
    policies: ['validation-result-shape-required', 'payload-result-shape-required', 'no-free-function-handler'],
    blockedClaims: ['no-rich-combobox-autocomplete-claim'],
    fixture: 'NFM-RCR-FIX-03',
    expectedOutcome: 'accepted-complete-form-recipe',
    owner: 'component-forms-navigation-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    recipeId: 'NFM-RCR-04',
    recipeClass: 'modal-overlay-workflow',
    sourceGaps: ['NFM-RUG-05', 'NFM-RUG-07', 'NFM-RUG-10'],
    sourceSyntaxDecisions: ['NFM-RSG-03', 'NFM-RSG-06'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-04', 'NFM-RAE-07'],
    status: 'recipe-accepted-with-renderer-proof-residual',
    uiSurfaces: ['overlay', 'portal', 'focus-scope', 'modal-action', 'cleanup'],
    rmtDomains: ['surfaces', 'slots', 'events', 'actions', 'effects', 'resources', 'securityPolicies', 'sourceMap'],
    coreRecords: ['surfaces[]', 'slots[]', 'events[]', 'actions[]', 'effects[]', 'resources[]', 'securityPolicies[]', 'sourceMap[]'],
    ownedPrimitives: ['x-dialog', 'x-popover', 'x-focus-scope', 'x-button'],
    runtimeGates: ['native-first-overlay-focus', 'rmt-vnext-surfaces', 'rmt-vnext-security', 'rmt-action-effect-runtime', 'rmt-event-routing-runtime'],
    browserSmokes: ['modal-open-close-smoke', 'focus-return-smoke', 'escape-dismiss-smoke'],
    goldenFixtures: ['rmt-overlay-interaction-ux', 'rmt-vnext-surfaces', 'rmt-action-effect-runtime'],
    visualEvidence: ['modal-open-state', 'modal-focus-ring'],
    policies: ['surface-trust-policy-required', 'effect-policy-required', 'release-on-cancel-or-owner-dispose'],
    blockedClaims: ['no-complete-surface-maximality-claim'],
    fixture: 'NFM-RCR-FIX-04',
    expectedOutcome: 'accepted-with-renderer-proof-residual',
    owner: 'component-overlay-owner',
    nextHandoff: ['NFM-WP-18', 'NFM-WP-19']
  },
  {
    recipeId: 'NFM-RCR-05',
    recipeClass: 'navigation-flow',
    sourceGaps: ['NFM-RUG-01', 'NFM-RUG-05', 'NFM-RUG-08'],
    sourceSyntaxDecisions: ['NFM-RSG-01', 'NFM-RSG-02'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-04'],
    status: 'recipe-accepted-with-adapter-residual',
    uiSurfaces: ['route-link', 'breadcrumbs', 'tabs', 'feedback-effect'],
    rmtDomains: ['routes', 'events', 'actions', 'effects', 'state', 'schedules', 'sourceMap'],
    coreRecords: ['routes[]', 'events[]', 'actions[]', 'effects[]', 'state[]', 'schedules[]', 'sourceMap[]'],
    ownedPrimitives: ['x-link', 'x-tabs', 'x-breadcrumb', 'x-status'],
    runtimeGates: ['native-first-form-navigation-media', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'rmt-vnext-events', 'rmt-app-platform-fixture'],
    browserSmokes: ['link-activation-smoke', 'active-route-state-smoke', 'feedback-announcement-smoke'],
    goldenFixtures: ['rmt-navigation-routing-ux', 'rmt-event-routing-runtime', 'rmt-app-platform-fixture'],
    visualEvidence: ['navigation-active-state', 'navigation-mobile'],
    policies: ['action-ref-required', 'scheduler-lane-visible', 'router-adapter-required'],
    blockedClaims: ['no-native-navigation-api-product-claim'],
    fixture: 'NFM-RCR-FIX-05',
    expectedOutcome: 'accepted-with-router-adapter-residual',
    owner: 'component-forms-navigation-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    recipeId: 'NFM-RCR-06',
    recipeClass: 'data-display-collection',
    sourceGaps: ['NFM-RUG-11', 'NFM-RUG-06', 'NFM-RUG-02'],
    sourceSyntaxDecisions: ['NFM-RSG-04', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-03', 'NFM-RAE-05', 'NFM-RAE-07'],
    status: 'recipe-blocked-owned-primitive',
    uiSurfaces: ['collection-view', 'item-template', 'empty-state', 'resource-query'],
    rmtDomains: ['components', 'templates', 'dataSources', 'resources', 'state', 'selectors', 'sourceMap'],
    coreRecords: ['components[]', 'templates[]', 'dataSources[]', 'resources[]', 'state[]', 'selectors[]', 'sourceMap[]'],
    ownedPrimitives: ['x-list', 'x-card', 'x-empty-state'],
    runtimeGates: ['native-first-market-pattern-parity', 'rmt-component-template-primitives', 'rmt-surface-resource-graph-runtime', 'rmt-action-effect-runtime'],
    browserSmokes: ['collection-empty-smoke', 'collection-loading-smoke', 'collection-selection-smoke'],
    goldenFixtures: ['rmt-component-template-primitives', 'rmt-surface-resource-graph-runtime', 'rmt-app-platform-fixture'],
    visualEvidence: ['collection-list-state', 'collection-empty-state'],
    policies: ['owned-data-display-ui-required', 'resource-owner-required', 'adapter-ref-required'],
    blockedClaims: ['no-table-tree-data-grid-virtual-list-claim'],
    fixture: 'NFM-RCR-FIX-06',
    expectedOutcome: 'blocked-until-owned-data-display-package',
    owner: 'component-data-display-owner',
    nextHandoff: ['owned-data-display-package', 'NFM-WP-19']
  },
  {
    recipeId: 'NFM-RCR-07',
    recipeClass: 'command-search-workflow',
    sourceGaps: ['NFM-RUG-12', 'NFM-RUG-05', 'NFM-RUG-06'],
    sourceSyntaxDecisions: ['NFM-RSG-05', 'NFM-RSG-06', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-06'],
    status: 'recipe-blocked-owned-primitive',
    uiSurfaces: ['command-source', 'search-resource', 'action-result-state', 'owned-command-search-placeholder'],
    rmtDomains: ['components', 'events', 'actions', 'resources', 'state', 'sourceMap'],
    coreRecords: ['components[]', 'events[]', 'actions[]', 'resources[]', 'state[]', 'sourceMap[]'],
    ownedPrimitives: ['x-button', 'x-input', 'owned-command-search-package'],
    runtimeGates: ['native-first-market-pattern-parity', 'rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'rmt-ui-primitive-gap'],
    browserSmokes: ['command-open-smoke', 'search-query-smoke', 'action-result-smoke'],
    goldenFixtures: ['rmt-event-routing-runtime', 'rmt-action-effect-runtime', 'rmt-syntax-growth'],
    visualEvidence: ['command-empty-state', 'command-result-state'],
    policies: ['owned-command-search-ui-required', 'action-ref-required', 'effect-policy-required'],
    blockedClaims: ['no-command-palette-autocomplete-rich-combobox-claim'],
    fixture: 'NFM-RCR-FIX-07',
    expectedOutcome: 'blocked-until-owned-command-search-package',
    owner: 'component-command-search-owner',
    nextHandoff: ['owned-command-search-package', 'NFM-WP-19']
  },
  {
    recipeId: 'NFM-RCR-08',
    recipeClass: 'media-resource-preview',
    sourceGaps: ['NFM-RUG-06', 'NFM-RUG-08', 'NFM-RUG-10'],
    sourceSyntaxDecisions: ['NFM-RSG-02', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-03', 'NFM-RAE-04', 'NFM-RAE-07'],
    status: 'recipe-accepted',
    uiSurfaces: ['media-preview', 'object-url-resource', 'feedback-effect', 'cleanup'],
    rmtDomains: ['components', 'templates', 'resources', 'effects', 'actions', 'schedules', 'sourceMap'],
    coreRecords: ['components[]', 'templates[]', 'resources[]', 'effects[]', 'actions[]', 'schedules[]', 'sourceMap[]'],
    ownedPrimitives: ['x-media', 'x-image', 'x-button', 'x-status'],
    runtimeGates: ['native-first-form-navigation-media', 'rmt-action-effect-runtime', 'rmt-surface-resource-graph-runtime', 'rmt-vnext-security', 'rmt-app-platform-fixture'],
    browserSmokes: ['media-preview-smoke', 'object-url-release-smoke', 'lazy-import-smoke'],
    goldenFixtures: ['rmt-layout-display-media-ux', 'rmt-action-effect-runtime', 'rmt-surface-resource-graph-runtime'],
    visualEvidence: ['media-preview-ready', 'media-resource-cleanup'],
    policies: ['owner-scope-required', 'release-on-cancel-or-owner-dispose', 'effect-policy-required'],
    blockedClaims: ['none'],
    fixture: 'NFM-RCR-FIX-08',
    expectedOutcome: 'accepted-media-resource-recipe',
    owner: 'component-forms-navigation-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  },
  {
    recipeId: 'NFM-RCR-09',
    recipeClass: 'docs-flow-progressive-boot',
    sourceGaps: ['NFM-RUG-01', 'NFM-RUG-09', 'NFM-RUG-10'],
    sourceSyntaxDecisions: ['NFM-RSG-01', 'NFM-RSG-02', 'NFM-RSG-07'],
    sourcePrimitiveDecisions: ['NFM-RAE-02', 'NFM-RAE-05'],
    status: 'recipe-accepted-with-adapter-residual',
    uiSurfaces: ['docs-route', 'toc-navigation', 'progressive-boot', 'diagnostic-boundary'],
    rmtDomains: ['routes', 'templates', 'components', 'events', 'actions', 'dataSources', 'securityPolicies', 'diagnostics', 'sourceMap'],
    coreRecords: ['routes[]', 'templates[]', 'components[]', 'events[]', 'actions[]', 'dataSources[]', 'securityPolicies[]', 'diagnostics[]', 'sourceMap[]'],
    ownedPrimitives: ['x-docs-shell', 'x-link', 'x-toc', 'x-status'],
    runtimeGates: ['references', 'rmt-app-platform-tooling', 'rmt-app-platform-fixture', 'rmt-vnext-compiler', 'contract-runtime-parity'],
    browserSmokes: ['docs-route-smoke', 'toc-keyboard-smoke', 'progressive-boot-smoke'],
    goldenFixtures: ['references', 'rmt-app-platform-tooling', 'rmt-app-platform-fixture'],
    visualEvidence: ['docs-flow-desktop', 'docs-flow-mobile'],
    policies: ['hydration-boot-record-required', 'adapter-ref-required', 'diagnostic-boundary-required'],
    blockedClaims: ['no-production-bundle-claim-without-release-gate'],
    fixture: 'NFM-RCR-FIX-09',
    expectedOutcome: 'accepted-with-progressive-boot-residual',
    owner: 'docs-authoring-owner',
    nextHandoff: ['NFM-WP-19', 'NFM-WP-20']
  }
]);

const BLOCKED_CLAIMS = Object.freeze([
  'no-native-navigation-api-product-claim',
  'no-table-tree-data-grid-virtual-list-claim',
  'no-rich-combobox-autocomplete-claim',
  'no-complete-surface-maximality-claim',
  'no-command-palette-autocomplete-rich-combobox-claim',
  'no-production-bundle-claim-without-release-gate'
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

function containsForbiddenToken(text) {
  return FORBIDDEN_TOKENS.some((token) => String(text).includes(token));
}

function runNativeFirstRmtCompleteUiRecipeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText('development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md', rootDir);
  const matrix = readText('development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', rootDir);
  const workpackage = readText('development/NFM-WP-17-Complete-UI-Recipe-Fixtures-fuer-App-Form-Overlay-Dashboard-und-Media-UIs-bauen.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Native-First-Framework-Mission.md', rootDir);
  const mission = readText('development/XTend-Native-First-Mission-Source-of-Truth-Contract.md', rootDir);
  const registry = readText('development/XTend-Native-First-Contract-Registry.md', rootDir);
  const registryContract = readText('development/XTend-Native-First-Contract-Registry-Contract.md', rootDir);
  const gapMatrix = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', rootDir);
  const syntaxMatrix = readText('development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', rootDir);
  const actionMatrix = readText('development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', rootDir);
  const appPlatformFixture = readText('tests/fixtures/rmt-app-platform-fixture.rmt', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const packageScripts = packageManifest.scripts || {};
  const metadata = packageManifest.xtend && packageManifest.xtend.nativeFirstRmtCompleteUiRecipes;
  const registryMetadata = packageManifest.xtend && packageManifest.xtend.nativeFirstContractRegistry;

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    'xtend.native-first.rmt-syntax-growth.v1',
    'xtend.native-first.rmt-action-effect-data-resource-primitives.v1',
    'xtend.native-first.rmt-ui-primitive-gap.v1',
    'xtend.epic18.rmt-app-platform-fixture.v1',
    LOCAL_GATE,
    PACKAGE_SCRIPT
  ], 'Contract header');
  assertIncludesAll(context, contract, REQUIRED_FIELDS, 'Contract required fields');
  assertIncludesAll(context, contract, RECIPE_STATUSES, 'Contract status model');
  assertIncludesAll(context, contract, REQUIRED_BOUNDARIES, 'Contract boundaries');
  assertIncludesAll(context, contract, REQUIRED_SOURCE_GATES, 'Contract source gates');
  assertIncludesAll(context, contract, [
    'keine produktive Implementierung von RMT Syntax Growth',
    'keine neue Browser-Smoke-Infrastruktur in diesem Paket',
    'keine Freigabe blockierter Data Display oder Command/Search Produktclaims'
  ], 'Contract non-goals');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    ITEM_SCHEMA,
    FIXTURE_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    REPORT_SCHEMA,
    FIXTURE_PATH,
    LOCAL_GATE,
    'Status Summary',
    'Coverage Summary',
    'NFM-WP-18',
    'NFM-WP-19',
    'NFM-WP-20'
  ], 'Matrix header and sections');
  assertIncludesAll(context, matrix, REQUIRED_FIELDS, 'Matrix fields');
  assertIncludesAll(context, matrix, [
    '`recipe-accepted` | 2',
    '`recipe-accepted-with-adapter-residual` | 4',
    '`recipe-accepted-with-renderer-proof-residual` | 1',
    '`recipe-blocked-owned-primitive` | 2'
  ], 'Matrix status counts');
  assertIncludesAll(context, matrix, BLOCKED_CLAIMS, 'Matrix blocked claims');

  REQUIRED_RECIPES.forEach((recipe) => {
    assertIncludesAll(context, matrix, [
      recipe.recipeId,
      recipe.recipeClass,
      recipe.status,
      recipe.fixture,
      recipe.expectedOutcome,
      recipe.owner
    ], `Matrix row ${recipe.recipeId}`);
    assertIncludesAll(context, matrix, recipe.sourceGaps, `Matrix row ${recipe.recipeId} source gaps`);
    assertIncludesAll(context, matrix, recipe.sourceSyntaxDecisions, `Matrix row ${recipe.recipeId} syntax decisions`);
    assertIncludesAll(context, matrix, recipe.sourcePrimitiveDecisions, `Matrix row ${recipe.recipeId} primitive decisions`);
    assertIncludesAll(context, matrix, recipe.uiSurfaces, `Matrix row ${recipe.recipeId} UI surfaces`);
    assertIncludesAll(context, matrix, recipe.rmtDomains, `Matrix row ${recipe.recipeId} RMT domains`);
    assertIncludesAll(context, matrix, recipe.coreRecords, `Matrix row ${recipe.recipeId} core records`);
    assertIncludesAll(context, matrix, recipe.ownedPrimitives, `Matrix row ${recipe.recipeId} owned primitives`);
    assertIncludesAll(context, matrix, recipe.runtimeGates, `Matrix row ${recipe.recipeId} runtime gates`);
    assertIncludesAll(context, matrix, recipe.browserSmokes, `Matrix row ${recipe.recipeId} browser smokes`);
    assertIncludesAll(context, matrix, recipe.goldenFixtures, `Matrix row ${recipe.recipeId} golden fixtures`);
    assertIncludesAll(context, matrix, recipe.visualEvidence, `Matrix row ${recipe.recipeId} visual evidence`);
    assertIncludesAll(context, matrix, recipe.policies, `Matrix row ${recipe.recipeId} policies`);
    assertIncludesAll(context, matrix, recipe.blockedClaims, `Matrix row ${recipe.recipeId} blocked claims`);
    recipe.nextHandoff.forEach((handoff) => context.assertIncludes(matrix, handoff, `Matrix row ${recipe.recipeId} handoff ${handoff}`));
  });

  context.assert(fixtures && fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures && fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes item schema');
  context.assert(fixtures && fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references WP-17 contract');
  context.assert(fixtures && fixtures.workpackage === 'NFM-WP-17', 'Fixture pack references WP-17');
  context.assert(fixtures && fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  const fixtureRows = (fixtures && fixtures.fixtures) || [];
  context.assert(fixtureRows.length === REQUIRED_RECIPES.length, 'Fixture pack contains one fixture per recipe');

  REQUIRED_RECIPES.forEach((recipe) => {
    const fixture = fixtureRows.find((candidate) => candidate.fixtureId === recipe.fixture);
    context.assert(Boolean(fixture), `Fixture pack contains ${recipe.fixture}`);
    if (!fixture) return;
    context.assert(fixture.recipeId === recipe.recipeId, `${recipe.fixture} maps to ${recipe.recipeId}`);
    context.assert(fixture.recipeClass === recipe.recipeClass, `${recipe.fixture} has recipe class`);
    context.assert(fixture.status === recipe.status, `${recipe.fixture} has status`);
    context.assert(fixture.expectedOutcome === recipe.expectedOutcome, `${recipe.fixture} has expected outcome`);
    context.assert(fixture.owner === recipe.owner, `${recipe.fixture} has owner`);
    context.assert(!containsForbiddenToken(fixture.authoring), `${recipe.fixture} authoring avoids forbidden runtime tokens`);
    assertArrayIncludesAll(context, fixture.sourceGaps, recipe.sourceGaps, `${recipe.fixture} source gaps`);
    assertArrayIncludesAll(context, fixture.sourceSyntaxDecisions, recipe.sourceSyntaxDecisions, `${recipe.fixture} source syntax decisions`);
    assertArrayIncludesAll(context, fixture.sourcePrimitiveDecisions, recipe.sourcePrimitiveDecisions, `${recipe.fixture} source primitive decisions`);
    assertArrayIncludesAll(context, fixture.uiSurfaces, recipe.uiSurfaces, `${recipe.fixture} UI surfaces`);
    assertArrayIncludesAll(context, fixture.rmtDomains, recipe.rmtDomains, `${recipe.fixture} RMT domains`);
    assertArrayIncludesAll(context, fixture.coreRecordPlan, recipe.coreRecords, `${recipe.fixture} core records`);
    assertArrayIncludesAll(context, fixture.ownedPrimitiveUse, recipe.ownedPrimitives, `${recipe.fixture} owned primitives`);
    assertArrayIncludesAll(context, fixture.runtimeGates, recipe.runtimeGates, `${recipe.fixture} runtime gates`);
    assertArrayIncludesAll(context, fixture.browserSmokePlan, recipe.browserSmokes, `${recipe.fixture} browser smoke plan`);
    assertArrayIncludesAll(context, fixture.goldenFixturePlan, recipe.goldenFixtures, `${recipe.fixture} golden fixture plan`);
    assertArrayIncludesAll(context, fixture.visualEvidencePlan, recipe.visualEvidence, `${recipe.fixture} visual evidence plan`);
    assertArrayIncludesAll(context, fixture.policyPlan, recipe.policies, `${recipe.fixture} policies`);
    assertArrayIncludesAll(context, fixture.blockedClaims, recipe.blockedClaims, `${recipe.fixture} blocked claims`);
    assertArrayIncludesAll(context, fixture.forbiddenTokens, FORBIDDEN_TOKENS, `${recipe.fixture} forbidden tokens`);
    recipe.nextHandoff.forEach((handoff) => {
      context.assert(Array.isArray(fixture.nextHandoff) && fixture.nextHandoff.includes(handoff), `${recipe.fixture} handoff includes ${handoff}`);
    });
  });

  assertIncludesAll(context, gapMatrix, [
    'NFM-RUG-01',
    'NFM-RUG-02',
    'NFM-RUG-03',
    'NFM-RUG-04',
    'NFM-RUG-05',
    'NFM-RUG-06',
    'NFM-RUG-07',
    'NFM-RUG-08',
    'NFM-RUG-09',
    'NFM-RUG-10',
    'NFM-RUG-11',
    'NFM-RUG-12',
    'NFM-WP-17'
  ], 'WP-14 gap inputs');
  assertIncludesAll(context, syntaxMatrix, [
    'NFM-RSG-01',
    'NFM-RSG-02',
    'NFM-RSG-03',
    'NFM-RSG-04',
    'NFM-RSG-05',
    'NFM-RSG-06',
    'NFM-RSG-07',
    'NFM-WP-17'
  ], 'WP-15 syntax inputs');
  assertIncludesAll(context, actionMatrix, [
    'NFM-RAE-01',
    'NFM-RAE-02',
    'NFM-RAE-03',
    'NFM-RAE-04',
    'NFM-RAE-05',
    'NFM-RAE-06',
    'NFM-RAE-07',
    'NFM-WP-17'
  ], 'WP-16 action/resource inputs');
  assertIncludesAll(context, appPlatformFixture, [
    'xtend.epic18.rmt-app-platform-fixture.v1',
    'manualHtmlRendererAllowed',
    'productSurfaceTaxonomyAllowed',
    'routes',
    'surfaces',
    'dataSources',
    'resources',
    'events',
    'actions'
  ], 'Epic18 app platform fixture evidence');

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
    'NFM-WP-18',
    'NFM-WP-19',
    'NFM-WP-20',
    'owned-data-display-package',
    'owned-command-search-package'
  ], 'Workpackage schemas, gate and handoff');

  context.assertIncludes(roadmap, '| `NFM-WP-17` | P1 | completed |', 'Roadmap marks NFM-WP-17 completed');
  context.assert(
    roadmap.includes('| `NFM-WP-18` | P1 | ready |') || roadmap.includes('| `NFM-WP-18` | P1 | completed |'),
    'Roadmap keeps NFM-WP-18 ready or completed'
  );
  context.assert(
    roadmap.includes('| `NFM-WP-19` | P1 | ready |') || roadmap.includes('| `NFM-WP-19` | P1 | completed |'),
    'Roadmap keeps NFM-WP-19 ready or completed'
  );
  context.assertIncludes(roadmap, 'development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md', 'Roadmap references WP-17 contract');
  context.assertIncludes(roadmap, LOCAL_GATE, 'Roadmap target gates include WP-17 gate');

  context.assertIncludes(mission, 'RMT Complete UI Recipe Fixtures Contract: `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`', 'Mission references WP-17 contract');
  context.assertIncludes(mission, 'development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', 'Mission source-of-truth lists WP-17 matrix');
  context.assertIncludes(mission, '`NFM-WP-17` | completed', 'Mission handoff marks WP-17 completed');

  assertIncludesAll(context, registry, [
    CONTRACT_SCHEMA,
    'rmt-recipe-owner',
    'NFM-WP-17',
    REPORT_SCHEMA,
    'rmt-complete-ui-recipes',
    'development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md',
    'rmt-complete-ui-recipe-matrix',
    'gate-plan'
  ], 'Registry WP-17 entry');
  assertIncludesAll(context, registryContract, [
    'NFM-WP-17',
    'rmt-complete-ui-recipes',
    CONTRACT_SCHEMA
  ], 'Registry contract WP-17 extension');

  context.assert(packageScripts['test:rmt-complete-ui-recipes'] === 'node scripts/run_xtend_tests.js rmt-complete-ui-recipes', 'Package exposes WP-17 test script');
  context.assertIncludes(runner, "require('../tests/native-first/native_first_rmt_complete_ui_recipe_suite')", 'Runner imports WP-17 suite');
  context.assertIncludes(runner, "id: 'rmt-complete-ui-recipes'", 'Runner registers WP-17 suite');
  REQUIRED_SOURCE_GATES.forEach((gate) => assertRunnerGate(context, runner, gate));

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes WP-17 contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes WP-17 matrix schema');
  context.assert(metadata && metadata.itemSchema === ITEM_SCHEMA, 'Package metadata exposes WP-17 item schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes WP-17 fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes WP-17 fixture pack schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes WP-17 report schema');
  context.assert(metadata && metadata.contract === 'development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md', 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === 'development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.workpackageDocument === 'development/NFM-WP-17-Complete-UI-Recipe-Fixtures-fuer-App-Form-Overlay-Dashboard-und-Media-UIs-bauen.md', 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata keeps no runtime dependency boundary');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework dependency');
  context.assert(metadata && metadata.freeRuntimeExecutionAllowed === false, 'Package metadata blocks free runtime execution');
  context.assert(metadata && metadata.runtimeImplementationIncluded === false, 'Package metadata declares no runtime implementation');
  assertArrayIncludesAll(context, metadata && metadata.requiredFields, REQUIRED_FIELDS, 'Package metadata required fields');
  assertArrayIncludesAll(context, metadata && metadata.recipeStatuses, RECIPE_STATUSES, 'Package metadata recipe statuses');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_SOURCE_GATES, 'Package metadata source gates');

  const recipes = (metadata && metadata.recipes) || [];
  context.assert(recipes.length === REQUIRED_RECIPES.length, 'Package metadata registers all recipe rows');
  REQUIRED_RECIPES.forEach((required) => {
    const recipe = recipes.find((candidate) => candidate.recipeId === required.recipeId);
    context.assert(Boolean(recipe), `Package metadata registers ${required.recipeId}`);
    if (!recipe) return;
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Boolean(recipe[field]), `Package metadata ${required.recipeId} has ${field}`);
    });
    context.assert(recipe.recipeClass === required.recipeClass, `Package metadata ${required.recipeId} has class`);
    context.assert(recipe.status === required.status, `Package metadata ${required.recipeId} has status`);
    context.assert(recipe.fixture === required.fixture, `Package metadata ${required.recipeId} has fixture`);
    context.assert(recipe.expectedOutcome === required.expectedOutcome, `Package metadata ${required.recipeId} has expected outcome`);
    context.assert(recipe.owner === required.owner, `Package metadata ${required.recipeId} has owner`);
    assertArrayIncludesAll(context, recipe.sourceGaps, required.sourceGaps, `Package metadata ${required.recipeId} source gaps`);
    assertArrayIncludesAll(context, recipe.sourceSyntaxDecisions, required.sourceSyntaxDecisions, `Package metadata ${required.recipeId} syntax decisions`);
    assertArrayIncludesAll(context, recipe.sourcePrimitiveDecisions, required.sourcePrimitiveDecisions, `Package metadata ${required.recipeId} primitive decisions`);
    assertArrayIncludesAll(context, recipe.uiSurfaces, required.uiSurfaces, `Package metadata ${required.recipeId} UI surfaces`);
    assertArrayIncludesAll(context, recipe.rmtDomains, required.rmtDomains, `Package metadata ${required.recipeId} RMT domains`);
    assertArrayIncludesAll(context, recipe.coreRecordPlan, required.coreRecords, `Package metadata ${required.recipeId} core records`);
    assertArrayIncludesAll(context, recipe.ownedPrimitiveUse, required.ownedPrimitives, `Package metadata ${required.recipeId} owned primitives`);
    assertArrayIncludesAll(context, recipe.runtimeGates, required.runtimeGates, `Package metadata ${required.recipeId} runtime gates`);
    assertArrayIncludesAll(context, recipe.browserSmokePlan, required.browserSmokes, `Package metadata ${required.recipeId} browser smokes`);
    assertArrayIncludesAll(context, recipe.goldenFixturePlan, required.goldenFixtures, `Package metadata ${required.recipeId} golden fixtures`);
    assertArrayIncludesAll(context, recipe.visualEvidencePlan, required.visualEvidence, `Package metadata ${required.recipeId} visual evidence`);
    assertArrayIncludesAll(context, recipe.policyPlan, required.policies, `Package metadata ${required.recipeId} policies`);
    assertArrayIncludesAll(context, recipe.blockedClaims, required.blockedClaims, `Package metadata ${required.recipeId} blocked claims`);
    assertArrayIncludesAll(context, recipe.nextHandoff, required.nextHandoff, `Package metadata ${required.recipeId} handoff`);
  });

  const statusCounts = countBy(recipes, 'status');
  context.assert(statusCounts['recipe-accepted'] === 2, 'Package metadata counts accepted recipes');
  context.assert(statusCounts['recipe-accepted-with-adapter-residual'] === 4, 'Package metadata counts adapter residual recipes');
  context.assert(statusCounts['recipe-accepted-with-renderer-proof-residual'] === 1, 'Package metadata counts renderer residual recipes');
  context.assert(statusCounts['recipe-blocked-owned-primitive'] === 2, 'Package metadata counts blocked owned primitive recipes');

  const registryEntries = (registryMetadata && registryMetadata.entries) || [];
  context.assert(registryEntries.some((entry) => entry.contractId === CONTRACT_SCHEMA && entry.workpackage === 'NFM-WP-17'), 'Registry package metadata includes WP-17 contract');
  context.assert(Array.isArray(registryMetadata && registryMetadata.sourceGates) && registryMetadata.sourceGates.includes('rmt-complete-ui-recipes'), 'Registry package metadata lists WP-17 source gate');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md', 'WP-17 contract path');
  assertPathExists(context, rootDir, 'development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', 'WP-17 matrix path');
  assertPathExists(context, rootDir, 'development/NFM-WP-17-Complete-UI-Recipe-Fixtures-fuer-App-Form-Overlay-Dashboard-und-Media-UIs-bauen.md', 'WP-17 workpackage path');
  assertPathExists(context, rootDir, FIXTURE_PATH, 'WP-17 fixture path');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: 'NFM-WP-17',
      contract: CONTRACT_SCHEMA,
      matrixSchema: MATRIX_SCHEMA,
      recipeRows: REQUIRED_RECIPES.length,
      fixtureRows: fixtureRows.length,
      statusCounts,
      sourceGates: REQUIRED_SOURCE_GATES.length,
      localGate: LOCAL_GATE,
      noRuntimeDependency: true,
      runtimeImplementationIncluded: false,
      freeRuntimeExecutionAllowed: false
    }
  });
}

function printNativeFirstRmtCompleteUiRecipeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Native-First RMT Complete UI Recipes erfolgreich.',
    failureTitle: 'Native-First RMT Complete UI Recipes fehlgeschlagen:'
  });
}

module.exports = {
  printNativeFirstRmtCompleteUiRecipeReport,
  runNativeFirstRmtCompleteUiRecipeSuite
};

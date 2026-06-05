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
const {
  syntaxCheckFile
} = require('../utils/process');

const SUITE_ID = 'rmt-owned-command-search-primitives';
const SUITE_LABEL = 'RMT Owned Command Search Primitives';
const CONTRACT_SCHEMA = 'xtend.rmt-ui-maximality-owned-command-search-primitives.v1';
const MATRIX_SCHEMA = 'xtend.rmt-ui-maximality-owned-command-search-primitives-matrix.v1';
const FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-command-search-primitives-fixture.v1';
const FIXTURE_PACK_SCHEMA = 'xtend.rmt-ui-maximality-owned-command-search-primitives-fixtures.v1';
const RMT_FIXTURE_SCHEMA = 'xtend.rmt-ui-maximality-owned-command-search-primitives.rmt-fixture.v1';
const REPORT_SCHEMA = 'xtend.rmt-ui-maximality-owned-command-search-primitives-report.v1';
const WORKPACKAGE = 'WP-RMO-04';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-owned-command-search-primitives --json';
const PACKAGE_SCRIPT = 'npm run test:rmt-owned-command-search-primitives';
const BACKLOG_PATH = 'development/BACKLOG-XTend-RMT-UI-Maximality-und-Owned-Component-Surface-Hardening.md';
const CONTRACT_PATH = 'development/XTend-RMT-Owned-Command-Search-Primitives-Contract.md';
const MATRIX_PATH = 'development/XTend-RMT-Owned-Command-Search-Primitives-Matrix.md';
const WORKPACKAGE_PATH = 'development/WP-RMO-04-Owned-Command-Search-Primitive-Package-schneiden.md';
const FIXTURE_PATH = 'tests/fixtures/native-first/rmt-owned-command-search-primitives-fixtures.json';
const RMT_FIXTURE_PATH = 'tests/fixtures/rmt-owned-command-search-primitives.rmt';
const SUITE_PATH = 'tests/native-first/rmt_owned_command_search_primitives_suite.js';

const REQUIRED_FIELDS = Object.freeze([
  'primitiveId',
  'primitive',
  'surfaceClass',
  'status',
  'sourceResidual',
  'sourceGaps',
  'ownedComponents',
  'rmtRecords',
  'interactionCoverage',
  'a11yCoverage',
  'policyCoverage',
  'allowedClaims',
  'blockedClaims',
  'nextHandoff'
]);

const ACCEPTED_COMPONENTS = Object.freeze([
  'x-input',
  'x-button',
  'x-menu',
  'x-popover',
  'x-dialog',
  'x-status',
  'x-progress',
  'x-alert',
  'x-icon'
]);

const DEFERRED_COMPONENTS = Object.freeze([
  'x-command-palette',
  'x-autocomplete',
  'x-combobox'
]);

const REQUIRED_RECORDS = Object.freeze([
  'commandSources[]',
  'searchSources[]',
  'components[]',
  'templates[]',
  'dataSources[]',
  'resources[]',
  'events[]',
  'actions[]',
  'effects[]',
  'state[]',
  'selectors[]',
  'schedules[]',
  'sourceMap[]'
]);

const REQUIRED_RMT_RECORD_KEYS = Object.freeze([
  'commandSources',
  'searchSources',
  'components',
  'templates',
  'dataSources',
  'resources',
  'events',
  'actions',
  'effects',
  'state',
  'selectors',
  'schedules',
  'sourceMap'
]);

const REQUIRED_BLOCKED_CLAIMS = Object.freeze([
  'command-palette-full-parity',
  'framework-command-api-copy',
  'rich-combobox-autocomplete-parity',
  'unregistered-command-execution',
  'free-command-execution-without-action-ref'
]);

const REQUIRED_GATES = Object.freeze([
  'rmt-owned-command-search-primitives',
  'rmt-ui-primitive-gap',
  'native-first-market-pattern-parity',
  'rmt-action-effect-data-resource-primitives',
  'rmt-event-routing-runtime',
  'native-first-overlay-focus',
  'native-first-form-navigation-media',
  'rmt-complete-ui-recipes',
  'catalog-coverage',
  'references'
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

function countBy(items, field) {
  return items.reduce((acc, item) => {
    acc[item[field]] = (acc[item[field]] || 0) + 1;
    return acc;
  }, {});
}

function runRmtOwnedCommandSearchPrimitivesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: SUITE_ID,
    label: SUITE_LABEL
  });

  const contract = readText(CONTRACT_PATH, rootDir);
  const matrix = readText(MATRIX_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const backlog = readText(BACKLOG_PATH, rootDir);
  const gapAnalysis = readText('development/XTend-Native-First-RMT-UI-Primitive-Gap-Analysis.md', rootDir);
  const syntaxMatrix = readText('development/XTend-Native-First-RMT-Syntax-Growth-Decision-Matrix.md', rootDir);
  const actionResourceMatrix = readText('development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Matrix.md', rootDir);
  const marketParity = readText('development/XTend-Native-First-Market-Pattern-Parity-Matrix.md', rootDir);
  const completeRecipes = readText('development/XTend-Native-First-RMT-Complete-UI-Recipe-Matrix.md', rootDir);
  const fixtures = readJson(FIXTURE_PATH, rootDir);
  const rmtFixture = readJson(RMT_FIXTURE_PATH, rootDir);
  const componentManifest = readJson('components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtOwnedCommandSearchPrimitives;
  const suiteSyntax = syntaxCheckFile(SUITE_PATH, { rootDir, extension: '.js' });

  [
    BACKLOG_PATH,
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH
  ].forEach((relativePath) => assertPathExists(context, rootDir, relativePath, `WP-RMO-04 artifact ${relativePath}`));
  context.assert(suiteSyntax.ok, `WP-RMO-04 suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  assertIncludesAll(context, contract, [
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    RMT_FIXTURE_SCHEMA,
    REPORT_SCHEMA,
    WORKPACKAGE,
    LOCAL_GATE,
    PACKAGE_SCRIPT,
    'owned-command-search-foundation',
    'command-source-record',
    'search-source-resource-binding',
    'overlay-focus-policy',
    'no-runtime-dependency',
    'no-rmt-kernel-import-of-xtend-types',
    'scoped-owned-command-search-package'
  ], 'Command/Search contract');
  assertIncludesAll(context, contract, REQUIRED_BLOCKED_CLAIMS, 'Command/Search blocked claims');
  assertIncludesAll(context, contract, REQUIRED_GATES, 'Command/Search contract gates');

  assertIncludesAll(context, matrix, [
    MATRIX_SCHEMA,
    'RMO-CS-01',
    'RMO-CS-02',
    'RMO-CS-03',
    'RMO-CS-04',
    'RMO-CS-05',
    'RMO-CS-06',
    'RMO-CS-07',
    'accepted-foundation',
    'accepted-command-source',
    'accepted-search-resource',
    'accepted-overlay-focus-policy',
    'deferred-owned-component',
    'browser-evidence-required',
    'scoped-owned-command-search-package'
  ], 'Command/Search matrix');
  ACCEPTED_COMPONENTS.slice(0, 8).forEach((tag) => context.assertIncludes(matrix, tag, `Matrix includes ${tag}`));
  REQUIRED_BLOCKED_CLAIMS.forEach((claim) => context.assertIncludes(matrix, claim, `Matrix blocks ${claim}`));

  assertIncludesAll(context, workpackage, [
    'Status: `completed`',
    CONTRACT_SCHEMA,
    MATRIX_SCHEMA,
    FIXTURE_PACK_SCHEMA,
    RMT_FIXTURE_SCHEMA,
    LOCAL_GATE,
    CONTRACT_PATH,
    MATRIX_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH,
    'command-search-parity',
    'WP-RMO-05',
    'WP-RMO-06',
    'WP-RMO-07'
  ], 'WP-RMO-04 document');

  context.assert(fixtures.schema === FIXTURE_PACK_SCHEMA, 'Fixture pack exposes schema');
  context.assert(fixtures.fixtureSchema === FIXTURE_SCHEMA, 'Fixture pack exposes fixture schema');
  context.assert(fixtures.contract === CONTRACT_SCHEMA, 'Fixture pack references contract');
  context.assert(fixtures.matrix === MATRIX_SCHEMA, 'Fixture pack references matrix');
  context.assert(fixtures.rmtFixtureSchema === RMT_FIXTURE_SCHEMA, 'Fixture pack references RMT fixture schema');
  context.assert(fixtures.reportSchema === REPORT_SCHEMA, 'Fixture pack references report schema');
  context.assert(fixtures.workpackage === WORKPACKAGE, 'Fixture pack references WP-RMO-04');
  context.assert(fixtures.localGate === LOCAL_GATE, 'Fixture pack references local gate');
  context.assert(fixtures.packageScript === PACKAGE_SCRIPT, 'Fixture pack references package script');
  context.assert(fixtures.rmtFixture === RMT_FIXTURE_PATH, 'Fixture pack references RMT fixture path');
  context.assert(fixtures.noRuntimeDependency === true, 'Fixture pack adds no runtime dependency');
  context.assert(fixtures.externalUiFrameworkDependencyAllowed === false, 'Fixture pack blocks external UI framework dependency');
  context.assert(fixtures.rmtKernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Fixture pack keeps RMT kernel boundary');

  const entries = fixtures.entries || [];
  context.assert(entries.length === 7, 'Fixture pack has seven command/search decisions');
  entries.forEach((entry) => {
    REQUIRED_FIELDS.forEach((field) => {
      context.assert(Object.prototype.hasOwnProperty.call(entry, field), `${entry.primitiveId} has ${field}`);
    });
    context.assert(entry.sourceResidual === 'command-search-parity', `${entry.primitiveId} traces command-search-parity`);
    context.assert(Array.isArray(entry.sourceGaps) && entry.sourceGaps.some((gap) => ['NFM-RUG-12', 'NFM-RSG-05', 'NFM-RAE-06'].includes(gap)), `${entry.primitiveId} traces Command/Search source gap`);
  });
  const statusCounts = countBy(entries, 'status');
  context.assert(statusCounts['accepted-foundation'] === 1, 'Status summary accepted-foundation is 1');
  context.assert(statusCounts['accepted-command-source'] === 1, 'Status summary accepted-command-source is 1');
  context.assert(statusCounts['accepted-search-resource'] === 1, 'Status summary accepted-search-resource is 1');
  context.assert(statusCounts['accepted-overlay-focus-policy'] === 1, 'Status summary accepted-overlay-focus-policy is 1');
  context.assert(statusCounts['deferred-owned-component'] === 3, 'Status summary deferred-owned-component is 3');
  Object.entries(fixtures.statusSummary).forEach(([status, count]) => {
    context.assert(statusCounts[status] === count, `Fixture summary ${status} matches entries`);
  });
  assertArrayIncludesAll(context, fixtures.residualDecision.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Residual blocked claims');
  context.assert(fixtures.residualDecision.status === 'scoped-owned-command-search-package', 'Residual decision scopes command-search-parity');

  context.assert(rmtFixture.schema === RMT_FIXTURE_SCHEMA, 'RMT fixture exposes schema');
  context.assert(rmtFixture.manifest.metadata.contractVersion === CONTRACT_SCHEMA, 'RMT fixture references contract');
  context.assert(rmtFixture.manifest.metadata.manualHtmlRendererAllowed === false, 'RMT fixture blocks manual HTML renderer');
  context.assert(rmtFixture.manifest.metadata.htmlStringRendererRequired === false, 'RMT fixture avoids HTML string renderer');
  context.assert(rmtFixture.manifest.metadata.externalUiFrameworkDependencyAllowed === false, 'RMT fixture blocks external UI framework dependency');
  context.assert(rmtFixture.manifest.metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'RMT fixture keeps kernel boundary');
  context.assert(rmtFixture.manifest.metadata.commandPolicy === 'action-ref-required', 'RMT fixture requires action refs for commands');
  context.assert(Array.isArray(rmtFixture.commandSources) && rmtFixture.commandSources.length === 1, 'RMT fixture has one command source');
  context.assert(Array.isArray(rmtFixture.searchSources) && rmtFixture.searchSources.length === 1, 'RMT fixture has one search source');
  const commandSource = rmtFixture.commandSources[0];
  const searchSource = rmtFixture.searchSources[0];
  context.assert(commandSource.id === 'command.global', 'Command source has stable id');
  context.assert(commandSource.actionRefRequired === true, 'Command source requires action refs');
  context.assert(commandSource.shortcut === 'Mod+K', 'Command source has keyboard trigger');
  context.assert(Array.isArray(commandSource.registeredCommands) && commandSource.registeredCommands.length === 2, 'Command source has registered commands');
  commandSource.registeredCommands.forEach((command) => {
    context.assert(command.action && command.action.startsWith('action.command.'), `${command.id}: command maps to action ref`);
  });
  context.assert(searchSource.id === 'search.commands', 'Search source has stable id');
  context.assert(searchSource.resource === 'resource.commands', 'Search source binds resource');
  context.assert(searchSource.queryState === 'state.command.query', 'Search source binds query state');
  context.assert(searchSource.debounceMs === 120, 'Search source records debounce policy');
  context.assert(searchSource.a11y && searchSource.a11y.resultAnnouncement === 'polite', 'Search source records polite announcement');
  assertIncludesAll(context, JSON.stringify(rmtFixture), REQUIRED_RMT_RECORD_KEYS, 'RMT fixture record domains');
  assertArrayIncludesAll(context, rmtFixture.negativeClaims, REQUIRED_BLOCKED_CLAIMS, 'RMT fixture negative claims');

  const manifestTags = new Set((rmtFixture.components || []).map((component) => component.tag));
  ACCEPTED_COMPONENTS.forEach((tag) => {
    context.assert(Object.prototype.hasOwnProperty.call(componentManifest, tag), `Component manifest exposes ${tag}`);
  });
  ['x-input', 'x-button', 'x-menu', 'x-popover', 'x-status', 'x-progress', 'x-alert', 'x-icon'].forEach((tag) => {
    context.assert(manifestTags.has(tag), `RMT fixture uses accepted component ${tag}`);
  });
  DEFERRED_COMPONENTS.forEach((tag) => {
    context.assert(!Object.prototype.hasOwnProperty.call(componentManifest, tag), `Manifest does not claim ${tag}`);
    context.assert(!manifestTags.has(tag), `RMT fixture does not use deferred ${tag}`);
  });

  assertIncludesAll(context, gapAnalysis, [
    'NFM-RUG-12',
    'Command Palette und rich Search Controls',
    'no-command-palette-autocomplete-rich-combobox-claim',
    'owned-command-search-package'
  ], 'RMT UI primitive gap analysis');
  assertIncludesAll(context, syntaxMatrix, [
    'NFM-RSG-05',
    'command-source-record-and-owned-search-package',
    'command-source',
    'search-source',
    'components[]',
    'events[]',
    'actions[]',
    'state[]',
    'resources[]',
    'sourceMap[]'
  ], 'RMT syntax growth matrix');
  assertIncludesAll(context, actionResourceMatrix, [
    'NFM-RAE-06',
    'command-search-resource-binding-record',
    'owned-command-search-ui-required',
    'action-ref-required'
  ], 'RMT action/effect/data/resource matrix');
  assertIncludesAll(context, marketParity, [
    'Command Palette',
    'Autocomplete',
    'Combobox',
    'blocked-negative-claim'
  ], 'Market pattern parity matrix');
  assertIncludesAll(context, completeRecipes, [
    'NFM-RCR-07',
    'command-search-workflow',
    'owned-command-search-package',
    'blocked-until-owned-command-search-package'
  ], 'Complete UI recipe matrix handoff');

  assertIncludesAll(context, backlog, [
    CONTRACT_PATH,
    MATRIX_PATH,
    WORKPACKAGE_PATH,
    FIXTURE_PATH,
    RMT_FIXTURE_PATH,
    SUITE_PATH,
    '| `WP-RMO-03` | P0 | completed |',
    '| `WP-RMO-04` | P0 | completed |',
    '| `WP-RMO-05` | P1 | completed |',
    'scoped-owned-command-search-package',
    'rmt-owned-command-search-primitives'
  ], 'Backlog WP-RMO-04 status');

  context.assert(packageManifest.scripts['test:rmt-owned-command-search-primitives'] === 'node scripts/run_xtend_tests.js rmt-owned-command-search-primitives', 'Package exposes WP-RMO-04 test script');
  context.assertIncludes(runner, "require('../tests/native-first/rmt_owned_command_search_primitives_suite')", 'Runner imports WP-RMO-04 suite');
  context.assertIncludes(runner, "id: 'rmt-owned-command-search-primitives'", 'Runner registers WP-RMO-04 suite');

  context.assert(metadata && metadata.schema === CONTRACT_SCHEMA, 'Package metadata exposes contract schema');
  context.assert(metadata && metadata.matrixSchema === MATRIX_SCHEMA, 'Package metadata exposes matrix schema');
  context.assert(metadata && metadata.fixtureSchema === FIXTURE_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.fixturePackSchema === FIXTURE_PACK_SCHEMA, 'Package metadata exposes fixture pack schema');
  context.assert(metadata && metadata.rmtFixtureSchema === RMT_FIXTURE_SCHEMA, 'Package metadata exposes RMT fixture schema');
  context.assert(metadata && metadata.reportSchema === REPORT_SCHEMA, 'Package metadata exposes report schema');
  context.assert(metadata && metadata.workpackage === WORKPACKAGE, 'Package metadata exposes WP-RMO-04');
  context.assert(metadata && metadata.status === 'accepted', 'Package metadata marks WP-RMO-04 accepted');
  context.assert(metadata && metadata.contract === CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.matrix === MATRIX_PATH, 'Package metadata exposes matrix path');
  context.assert(metadata && metadata.workpackageDocument === WORKPACKAGE_PATH, 'Package metadata exposes workpackage path');
  context.assert(metadata && metadata.fixtures === FIXTURE_PATH, 'Package metadata exposes fixtures path');
  context.assert(metadata && metadata.rmtFixture === RMT_FIXTURE_PATH, 'Package metadata exposes RMT fixture path');
  context.assert(metadata && metadata.suite === SUITE_PATH, 'Package metadata exposes suite path');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.residualDecision === 'scoped-owned-command-search-package', 'Package metadata scopes command-search residual');
  context.assert(metadata && metadata.noRuntimeDependency === true, 'Package metadata adds no runtime dependency');
  context.assert(metadata && metadata.externalUiFrameworkDependencyAllowed === false, 'Package metadata blocks external UI framework');
  assertArrayIncludesAll(context, metadata && metadata.acceptedComponents, ACCEPTED_COMPONENTS, 'Package metadata accepted components');
  assertArrayIncludesAll(context, metadata && metadata.deferredComponents, DEFERRED_COMPONENTS, 'Package metadata deferred components');
  assertArrayIncludesAll(context, metadata && metadata.blockedClaims, REQUIRED_BLOCKED_CLAIMS, 'Package metadata blocked claims');
  assertArrayIncludesAll(context, metadata && metadata.sourceGates, REQUIRED_GATES, 'Package metadata source gates');

  return context.result({
    report: {
      schema: REPORT_SCHEMA,
      workpackage: WORKPACKAGE,
      decisions: entries.length,
      acceptedDecisions: 4,
      deferredComponents: DEFERRED_COMPONENTS,
      residualDecision: fixtures.residualDecision.status,
      localGate: LOCAL_GATE
    }
  });
}

function printRmtOwnedCommandSearchPrimitivesReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Owned Command Search Primitives erfolgreich.',
    failureTitle: 'RMT Owned Command Search Primitives fehlgeschlagen:'
  });
}

module.exports = {
  printRmtOwnedCommandSearchPrimitivesReport,
  runRmtOwnedCommandSearchPrimitivesSuite
};

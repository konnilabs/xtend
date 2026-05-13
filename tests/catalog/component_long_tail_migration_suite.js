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
const {
  COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA,
  COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA,
  COMPONENT_LONG_TAIL_MIGRATION_SCHEMA,
  KERNEL_BOUNDARY,
  createComponentLongTailMigrationGate,
  createComponentLongTailMigrationPlan,
  createMarkdownMatrix,
  validateComponentLongTailMigrationPlan
} = require('../../catalog/component-long-tail-migration');

const COMPONENT_LONG_TAIL_MIGRATION_DOC_SCHEMA = 'xtend.docs.component-long-tail-migration.v1';
const COMPONENT_LONG_TAIL_MIGRATION_WORKPACKAGE = 'WP-E11-17';
const COMPONENT_LONG_TAIL_MIGRATION_NEXT_WORKPACKAGE = 'WP-E11-18';
const COMPONENT_LONG_TAIL_MIGRATION_LOCAL_GATE = 'node scripts/run_xtend_tests.js component-long-tail-migration --json';
const COMPONENT_LONG_TAIL_MIGRATION_PACKAGE_SCRIPT = 'npm run test:component-long-tail-migration';
const COMPONENT_LONG_TAIL_MIGRATION_CONTRACT_PATH = 'development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md';
const COMPONENT_LONG_TAIL_MIGRATION_WP_PATH = 'development/WP-E11-17-Legacy-Long-Tail-Migration-planen.md';
const COMPONENT_LONG_TAIL_MIGRATION_DOC_PATH = 'docs/component-long-tail-migration.md';
const COMPONENT_LONG_TAIL_MIGRATION_MODULE_PATH = 'catalog/component-long-tail-migration.js';
const COMPONENT_LONG_TAIL_MIGRATION_SUITE_PATH = 'tests/catalog/component_long_tail_migration_suite.js';
const EXPECTED_TAGS = Object.freeze(['xstate', 'x-utils']);

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function findEntry(plan, tag) {
  return plan.entries.find((entry) => entry.tag === tag);
}

function assertEntry(context, plan, tag, expected) {
  const entry = findEntry(plan, tag);
  context.assert(Boolean(entry), `${tag} is part of the long-tail migration plan`);
  if (!entry) return;
  Object.entries(expected).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((expectedValue) => {
        context.assert(Array.isArray(entry[key]) && entry[key].includes(expectedValue), `${tag} ${key} includes ${expectedValue}`);
      });
    } else {
      context.assert(entry[key] === value, `${tag} ${key} is ${value}`);
    }
  });
}

function runComponentLongTailMigrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-long-tail-migration',
    label: 'Epic 11 Legacy Long-Tail Migration'
  });
  const moduleSyntax = syntaxCheckFile(COMPONENT_LONG_TAIL_MIGRATION_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(COMPONENT_LONG_TAIL_MIGRATION_SUITE_PATH, { rootDir, extension: '.js' });
  const plan = createComponentLongTailMigrationPlan({ rootDir });
  const validation = validateComponentLongTailMigrationPlan(plan);
  const gate = createComponentLongTailMigrationGate({ rootDir });
  const matrix = createMarkdownMatrix(plan);
  const moduleSource = readText(COMPONENT_LONG_TAIL_MIGRATION_MODULE_PATH, rootDir);
  const contractDoc = readText(COMPONENT_LONG_TAIL_MIGRATION_CONTRACT_PATH, rootDir);
  const workpackage = readText(COMPONENT_LONG_TAIL_MIGRATION_WP_PATH, rootDir);
  const developerDocs = readText(COMPONENT_LONG_TAIL_MIGRATION_DOC_PATH, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const componentUxGates = readText('docs/component-ux-gates.md', rootDir);
  const catalogDocs = readText('docs/component-catalog-coverage.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const menu = readJson('docs/menu.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentLongTailMigration;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);

  [
    COMPONENT_LONG_TAIL_MIGRATION_MODULE_PATH,
    COMPONENT_LONG_TAIL_MIGRATION_CONTRACT_PATH,
    COMPONENT_LONG_TAIL_MIGRATION_WP_PATH,
    COMPONENT_LONG_TAIL_MIGRATION_DOC_PATH,
    COMPONENT_LONG_TAIL_MIGRATION_SUITE_PATH
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });
  context.assert(moduleSyntax.ok, `Component long-tail migration module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Component long-tail migration suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assertIncludes(moduleSource, COMPONENT_LONG_TAIL_MIGRATION_SCHEMA, 'Module declares long-tail migration schema');
  context.assertIncludes(moduleSource, COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA, 'Module declares long-tail entry schema');
  context.assertIncludes(moduleSource, COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA, 'Module declares long-tail gate schema');
  context.assertIncludes(moduleSource, 'incremental-no-big-bang', 'Module encodes non-big-bang strategy');
  context.assert(COMPONENT_LONG_TAIL_MIGRATION_SCHEMA === 'xtend.epic11.legacy-long-tail-migration.v1', 'Suite tracks stable long-tail migration schema literal');

  context.assert(plan.schema === COMPONENT_LONG_TAIL_MIGRATION_SCHEMA, 'Plan exposes stable long-tail migration schema');
  context.assert(plan.entrySchema === COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA, 'Plan exposes entry schema');
  context.assert(plan.gateSchema === COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA, 'Plan exposes gate schema');
  context.assert(plan.workpackage === COMPONENT_LONG_TAIL_MIGRATION_WORKPACKAGE, 'Plan belongs to WP-E11-17');
  context.assert(plan.strategy === 'incremental-no-big-bang', 'Plan avoids a big-bang migration');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Plan keeps RMT kernel boundary visible');
  context.assert(plan.entries.length === EXPECTED_TAGS.length, 'Plan contains the two current non-enterprise-ready Manifest entries after WP-E12-09');
  context.assert(EXPECTED_TAGS.every((tag) => Boolean(findEntry(plan, tag))), 'Plan contains every expected long-tail tag');
  context.assert(!findEntry(plan, 'x-tabs'), 'Plan excludes x-tabs after WP-E12-02 performance closure');
  context.assert(!findEntry(plan, 'x-theme'), 'Plan excludes x-theme after WP-E12-05 performance closure');
  context.assert(!findEntry(plan, 'x-button'), 'Plan excludes x-button after WP-E12-06 performance closure');
  context.assert(!findEntry(plan, 'x-menu'), 'Plan excludes x-menu after WP-E12-07 performance closure');
  context.assert(!findEntry(plan, 'x-alert'), 'Plan excludes already enterprise-ready x-alert');
  context.assert(plan.summary.componentCount === 2, 'Summary counts two long-tail components after WP-E12-09');
  context.assert(plan.summary.customElementCount === 0, 'Summary counts no visual custom elements after WP-E12-09');
  context.assert(plan.summary.boundaryProbeCount === 2, 'Summary counts two adapter or helper boundary probes after WP-E12-09');
  context.assert(plan.summary.missingByDimension.performance.length === 2, 'Performance gap remains visible for remaining long-tail entries');
  context.assert(plan.summary.missingByDimension.a11y.includes('xstate'), 'A11y gap includes xstate');
  context.assert(!plan.summary.missingByDimension.a11y.includes('x-theme'), 'A11y gap no longer includes x-theme after WP-E12-04');
  context.assert(!plan.summary.missingByDimension.componentSuite, 'Component suite gap is closed after WP-E12-09');
  context.assert(!plan.summary.missingByDimension.fixture, 'Fixture gap is closed after WP-E12-09');
  context.assert(!plan.summary.missingByDimension.types, 'Type gap is closed after WP-E12-09');
  assertEntry(context, plan, 'xstate', {
    wave: 'wave-3-infrastructure-and-utility-probes',
    migrationKind: 'adapter-boundary-probe',
    targetMaturity: 'ux-baseline-probe',
    requiredActions: ['non-custom-element-integration-probe', 'runtime-a11y-profile', 'performance-profile']
  });
  assertEntry(context, plan, 'x-utils', {
    wave: 'wave-3-infrastructure-and-utility-probes',
    migrationKind: 'adapter-boundary-probe',
    targetMaturity: 'ux-baseline-probe',
    requiredActions: ['non-custom-element-integration-probe', 'performance-profile']
  });

  context.assert(validation.ok === true, 'Long-tail migration plan validates');
  context.assert(gate.ok === true, 'Long-tail migration gate passes');
  context.assert(gate.plan.schema === COMPONENT_LONG_TAIL_MIGRATION_SCHEMA, 'Gate returns the long-tail migration plan');
  context.assert(!matrix.includes('| `x-tabs` |'), 'Markdown matrix excludes x-tabs after WP-E12-02 performance closure');
  context.assert(matrix.includes('| `x-utils` | `wave-3-infrastructure-and-utility-probes` | `typed-contract-gated` | `ux-baseline-probe` |'), 'Markdown matrix includes x-utils wave row after WP-E12-09');

  context.assertIncludes(contractDoc, COMPONENT_LONG_TAIL_MIGRATION_SCHEMA, 'Contract doc declares long-tail migration schema');
  context.assertIncludes(contractDoc, COMPONENT_LONG_TAIL_MIGRATION_LOCAL_GATE, 'Contract doc documents local gate');
  context.assertIncludes(contractDoc, 'incremental-no-big-bang', 'Contract doc documents migration strategy');
  context.assertIncludes(contractDoc, '`x-tabs`', 'Contract doc prioritizes x-tabs');
  context.assertIncludes(contractDoc, '`x-utils`', 'Contract doc includes x-utils boundary probe');
  context.assertIncludes(workpackage, 'Status: `completed`', 'Workpackage is completed');
  context.assertIncludes(workpackage, COMPONENT_LONG_TAIL_MIGRATION_LOCAL_GATE, 'Workpackage documents local gate');
  context.assertIncludes(workpackage, COMPONENT_LONG_TAIL_MIGRATION_NEXT_WORKPACKAGE, 'Workpackage hands off to WP-E11-18');
  context.assertIncludes(developerDocs, COMPONENT_LONG_TAIL_MIGRATION_DOC_SCHEMA, 'Developer docs declare docs schema');
  context.assertIncludes(developerDocs, COMPONENT_LONG_TAIL_MIGRATION_LOCAL_GATE, 'Developer docs document local gate');
  context.assertIncludes(componentUxGates, 'component-long-tail-migration', 'Component UX Gates document long-tail migration gate');
  context.assertIncludes(catalogDocs, 'WP-E11-17', 'Component Catalog Coverage docs mention WP-E11-17');
  context.assertIncludes(docsReadme, 'component-long-tail-migration.md', 'Docs README links Component Long-Tail Migration');
  context.assert(menu.some((entry) => entry.slug === 'component-long-tail-migration'), 'Docs menu exposes component-long-tail-migration');

  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic 11 marks WP-E11-17 completed');
  context.assertIncludes(epic, '| `WP-E11-18` | P2 | completed |', 'Epic 11 marks WP-E11-18 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed | WS10 |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-18` | P2 | completed | WS11 |', 'Backlog marks WP-E11-18 completed');
  context.assertIncludes(registry, COMPONENT_LONG_TAIL_MIGRATION_CONTRACT_PATH, 'Reference registry links Long-Tail Migration contract');
  context.assertIncludes(registry, COMPONENT_LONG_TAIL_MIGRATION_WP_PATH, 'Reference registry links WP-E11-17');
  context.assertIncludes(registry, COMPONENT_LONG_TAIL_MIGRATION_MODULE_PATH, 'Reference registry links Long-Tail Migration module');
  context.assertIncludes(registry, COMPONENT_LONG_TAIL_MIGRATION_DOC_PATH, 'Reference registry links Long-Tail Migration docs');
  context.assertIncludes(registry, COMPONENT_LONG_TAIL_MIGRATION_SUITE_PATH, 'Reference registry links Long-Tail Migration suite');

  context.assert((packageManifest.exports['./catalog/component-long-tail-migration'] === './catalog/component-long-tail-migration.js' || (packageManifest.exports['./catalog/component-long-tail-migration'] && packageManifest.exports['./catalog/component-long-tail-migration'].default === './catalog/component-long-tail-migration.js')), 'Package exports Component Long-Tail Migration module');
  context.assert(packageManifest.scripts['test:component-long-tail-migration'] === 'node scripts/run_xtend_tests.js component-long-tail-migration', 'Package exposes Component Long-Tail Migration test script');
  context.assert(metadata && metadata.schema === COMPONENT_LONG_TAIL_MIGRATION_SCHEMA, 'Package metadata exposes Long-Tail Migration schema');
  context.assert(metadata && metadata.entrySchema === COMPONENT_LONG_TAIL_MIGRATION_ENTRY_SCHEMA, 'Package metadata exposes Long-Tail Migration entry schema');
  context.assert(metadata && metadata.gateSchema === COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA, 'Package metadata exposes Long-Tail Migration gate schema');
  context.assert(metadata && metadata.workpackage === COMPONENT_LONG_TAIL_MIGRATION_WORKPACKAGE, 'Package metadata exposes WP-E11-17');
  context.assert(metadata && metadata.localGate === COMPONENT_LONG_TAIL_MIGRATION_LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(Array.isArray(metadata && metadata.targetComponents) && metadata.targetComponents.length === EXPECTED_TAGS.length, 'Package metadata exposes two target components after WP-E12-07');
  context.assert(Array.isArray(metadata && metadata.handoff) && metadata.handoff.includes(COMPONENT_LONG_TAIL_MIGRATION_NEXT_WORKPACKAGE), 'Package metadata hands off to WP-E11-18');
  context.assertIncludes(scaffoldConfig, 'componentLongTailMigration', 'Scaffold config exposes Component Long-Tail Migration metadata');
  context.assertIncludes(scaffoldConfig, COMPONENT_LONG_TAIL_MIGRATION_SCHEMA, 'Scaffold config declares Long-Tail Migration schema');
  context.assertIncludes(scaffoldConfig, COMPONENT_LONG_TAIL_MIGRATION_LOCAL_GATE, 'Scaffold config declares Long-Tail Migration local gate');
  context.assertIncludes(runner, "id: 'component-long-tail-migration'", 'XTend runner registers Component Long-Tail Migration suite');
  context.assertIncludes(runner, COMPONENT_LONG_TAIL_MIGRATION_LOCAL_GATE.replace(' --json', ''), 'XTend runner help references Component Long-Tail Migration suite');

  return context.result({
    report: {
      schema: COMPONENT_LONG_TAIL_MIGRATION_GATE_SCHEMA,
      componentCount: plan.entries.length,
      waves: plan.waves.map((wave) => wave.id),
      targetComponents: plan.entries.map((entry) => entry.tag)
    }
  });
}

function printComponentLongTailMigrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 11 Legacy Long-Tail Migration erfolgreich.',
    failureTitle: 'Epic 11 Legacy Long-Tail Migration fehlgeschlagen:'
  });
}

module.exports = {
  printComponentLongTailMigrationReport,
  runComponentLongTailMigrationSuite
};

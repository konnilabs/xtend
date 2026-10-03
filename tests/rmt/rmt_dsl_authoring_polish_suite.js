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
  DIAGNOSTIC_CODES,
  DSL_ALIAS_NAMES,
  KERNEL_BOUNDARY,
  RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH,
  RMT_DSL_AUTHORING_POLISH_DOC_PATH,
  RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH,
  RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA,
  RMT_DSL_AUTHORING_POLISH_LOCAL_GATE,
  RMT_DSL_AUTHORING_POLISH_MODULE_PATH,
  RMT_DSL_AUTHORING_POLISH_PACKAGE_SCRIPT,
  RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA,
  RMT_DSL_AUTHORING_POLISH_SCHEMA,
  RMT_DSL_AUTHORING_POLISH_SUITE_PATH,
  RMT_DSL_AUTHORING_POLISH_WORKPACKAGE,
  RMT_DSL_AUTHORING_POLISH_WP_PATH,
  XTEND_DESIGN_TOKEN_SCHEMA,
  createRmtDslAuthoringPolishPlan,
  validateRmtDslAuthoringPolishFixture,
  validateRmtDslAuthoringPolishPlan
} = require('../../xtend-builder/typing/rmt-dsl-authoring-polish');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function assertArrayIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(source) && source.includes(entry), `${label} includes ${entry}`);
  });
}

function assertNoInlineRuntimeCode(context, source, label) {
  const serialized = typeof source === 'string' ? source : JSON.stringify(source);
  ['function(', '=>', '<script', 'onclick=', 'onchange='].forEach((needle) => {
    context.assert(!serialized.includes(needle), `${label} rejects ${needle}`);
  });
}

function runRmtDslAuthoringPolishSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-dsl-authoring-polish',
    label: 'Epic 12 RMT DSL Authoring Polish'
  });
  const plan = createRmtDslAuthoringPolishPlan();
  const planValidation = validateRmtDslAuthoringPolishPlan(plan);
  const fixture = readJson(RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH, rootDir);
  const fixtureValidation = validateRmtDslAuthoringPolishFixture(fixture, plan);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtDslAuthoringPolish;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const contractDoc = readText(RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH, rootDir);
  const docs = readText(RMT_DSL_AUTHORING_POLISH_DOC_PATH, rootDir);
  const rmtReadme = readText('tests/rmt/README.md', rootDir);
  const typingReadme = readText('xtend-builder/typing/README.md', rootDir);
  const docsReadme = readText('docs/en/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md', rootDir);
  const rcModel = readText('development/XTend-Epic12-RC-Hardening-Modell.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const shellAuthoringDoc = readText('development/XTend-RMT-Shell-Authoring-fuer-Component-UX.md', rootDir);
  const designTokenDoc = readText('development/XTend-Enterprise-Design-System-Token-Contract.md', rootDir);
  const workpackage = readText(RMT_DSL_AUTHORING_POLISH_WP_PATH, rootDir);
  const moduleSyntax = syntaxCheckFile(RMT_DSL_AUTHORING_POLISH_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_DSL_AUTHORING_POLISH_SUITE_PATH, { rootDir, extension: '.js' });
  const aliasNames = plan.aliasPlan.map((alias) => alias.alias);
  const fixtureAliases = fixture.dslAliases.map((alias) => alias.alias);
  const diagnosticCodes = plan.diagnostics.map((diagnostic) => diagnostic.code);
  const fixtureDiagnosticCodes = fixture.diagnosticFixtures.map((diagnostic) => diagnostic.code);

  assertFileExists(context, RMT_DSL_AUTHORING_POLISH_MODULE_PATH, rootDir, 'RMT DSL Authoring Polish module exists');
  assertFileExists(context, RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH, rootDir, 'RMT DSL Authoring Polish fixture exists');
  assertFileExists(context, RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH, rootDir, 'RMT DSL Authoring Polish contract doc exists');
  assertFileExists(context, RMT_DSL_AUTHORING_POLISH_DOC_PATH, rootDir, 'RMT DSL Authoring Polish docs page exists');
  assertFileExists(context, RMT_DSL_AUTHORING_POLISH_SUITE_PATH, rootDir, 'RMT DSL Authoring Polish suite exists');
  assertFileExists(context, RMT_DSL_AUTHORING_POLISH_WP_PATH, rootDir, 'WP-E12-13 workpackage document exists');
  context.assert(moduleSyntax.ok, `RMT DSL Authoring Polish module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT DSL Authoring Polish suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(plan.schema === RMT_DSL_AUTHORING_POLISH_SCHEMA, 'Plan factory declares stable schema');
  context.assert(plan.reportSchema === RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA, 'Plan factory declares report schema');
  context.assert(plan.fixtureSchema === RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA, 'Plan factory declares fixture schema');
  context.assert(plan.workpackage === RMT_DSL_AUTHORING_POLISH_WORKPACKAGE, 'Plan belongs to WP-E12-13');
  context.assert(plan.productSurface.kernelBoundary === KERNEL_BOUNDARY, 'Plan keeps RMT kernel boundary');
  context.assert(plan.productSurface.noXtendKernelImports === true, 'Plan refuses XTend kernel imports');
  context.assert(plan.productSurface.noInlineRuntimeCode === true, 'Plan refuses inline runtime code');
  context.assert(plan.productSurface.localOnly === true, 'Plan remains local-only');
  context.assert(plan.productSurface.externalNetworkAllowed === false, 'Plan rejects external network');
  context.assert(planValidation.schema === RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA, 'Plan validator emits report schema');
  context.assert(planValidation.ok === true, 'Plan validator accepts factory output');
  assertArrayIncludesAll(context, aliasNames, DSL_ALIAS_NAMES, 'Plan aliases');
  assertArrayIncludesAll(context, diagnosticCodes, DIAGNOSTIC_CODES, 'Plan diagnostics');
  context.assert(plan.routingSugar.routerAdapter === 'xtend.xrouter', 'Plan keeps XRouter as adapter');
  context.assert(plan.routingSugar.routeAlias === 'route', 'Plan exposes route sugar');
  context.assert(plan.routingSugar.linkAlias === 'link', 'Plan exposes link sugar');
  context.assert(plan.routingSugar.outletAlias === 'outlet', 'Plan exposes outlet sugar');
  context.assert(plan.tokenBridge.schema === XTEND_DESIGN_TOKEN_SCHEMA, 'Plan binds Design Token contract');
  assertArrayIncludesAll(context, plan.tokenBridge.requiredTokens, ['--xtend-surface', '--xtend-color-primary', '--xtend-density-spacing'], 'Plan required tokens');
  assertArrayIncludesAll(context, plan.tokenBridge.densityPacks, ['comfortable', 'compact', 'dense'], 'Plan density packs');
  context.assert(plan.validation.normalizeBeforeRuntime === true, 'Plan normalizes before runtime');
  context.assert(plan.validation.diagnosticsFirst === true, 'Plan is diagnostics-first');
  context.assert(plan.upstreamHandoff.nonGoals.some((entry) => entry.includes('RMT kernel')), 'Plan keeps upstream kernel non-goal visible');

  context.assert(fixture.schema === RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA, 'Fixture declares fixture schema');
  context.assert(fixture.contract === RMT_DSL_AUTHORING_POLISH_SCHEMA, 'Fixture declares polish contract schema');
  context.assert(fixture.workpackage === RMT_DSL_AUTHORING_POLISH_WORKPACKAGE, 'Fixture is owned by WP-E12-13');
  context.assert(fixture.kernelBoundary === KERNEL_BOUNDARY, 'Fixture keeps RMT kernel boundary');
  context.assert(fixtureValidation.schema === RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA, 'Fixture validator emits report schema');
  context.assert(fixtureValidation.ok === true, 'Fixture validator accepts fixture');
  assertArrayIncludesAll(context, fixtureAliases, DSL_ALIAS_NAMES, 'Fixture aliases');
  assertArrayIncludesAll(context, fixtureDiagnosticCodes, DIAGNOSTIC_CODES, 'Fixture diagnostics');
  context.assert(fixture.dslAliases.every((alias) => alias.kernelVisible === false), 'Fixture aliases remain kernel-invisible');
  context.assert(fixture.authoringExamples.length >= 4, 'Fixture contains at least four authoring examples');
  context.assert(fixture.authoringExamples.some((example) => example.id === 'settings-route-link' && JSON.stringify(example.normalized).includes('xtend.xrouter')), 'Fixture includes XRouter/XLink sugar example');
  context.assert(JSON.stringify(fixture.authoringExamples).includes('--xtend-surface'), 'Fixture examples use product tokens');
  context.assert(JSON.stringify(fixture.authoringExamples).includes('--xtend-density-spacing'), 'Fixture examples use density tokens');
  assertNoInlineRuntimeCode(context, fixture, 'Fixture');
  context.assert(fixture.upstreamHandoff.nonGoals.some((entry) => entry.includes('RMT kernel')), 'Fixture handoff keeps RMT kernel non-goal visible');

  context.assert((typeof packageManifest.exports['./builder/typing/rmt-dsl-authoring-polish'] === 'string' ? packageManifest.exports['./builder/typing/rmt-dsl-authoring-polish'] : packageManifest.exports['./builder/typing/rmt-dsl-authoring-polish'] && packageManifest.exports['./builder/typing/rmt-dsl-authoring-polish'].default) === './xtend-builder/typing/rmt-dsl-authoring-polish.js', 'Package exports RMT DSL Authoring Polish module');
  context.assert(packageManifest.scripts['test:rmt-dsl-authoring-polish'] === 'node scripts/run_xtend_tests.js rmt-dsl-authoring-polish', 'Package exposes RMT DSL Authoring Polish test script');
  context.assert(metadata && metadata.schema === RMT_DSL_AUTHORING_POLISH_SCHEMA, 'Package metadata exposes RMT DSL Authoring Polish schema');
  context.assert(metadata && metadata.fixtureSchema === RMT_DSL_AUTHORING_POLISH_FIXTURE_SCHEMA, 'Package metadata exposes fixture schema');
  context.assert(metadata && metadata.module === RMT_DSL_AUTHORING_POLISH_MODULE_PATH, 'Package metadata exposes module path');
  context.assert(metadata && metadata.fixture === RMT_DSL_AUTHORING_POLISH_FIXTURE_PATH, 'Package metadata exposes fixture path');
  context.assert(metadata && metadata.contract === RMT_DSL_AUTHORING_POLISH_CONTRACT_PATH, 'Package metadata exposes contract path');
  context.assert(metadata && metadata.docs === RMT_DSL_AUTHORING_POLISH_DOC_PATH, 'Package metadata exposes docs path');
  context.assert(metadata && metadata.localGate === RMT_DSL_AUTHORING_POLISH_LOCAL_GATE, 'Package metadata exposes local gate');
  context.assert(metadata && metadata.packageScript === RMT_DSL_AUTHORING_POLISH_PACKAGE_SCRIPT, 'Package metadata exposes package script');
  context.assert(metadata && metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps kernel boundary');
  context.assert(metadata && Array.isArray(metadata.aliases) && metadata.aliases.includes('route'), 'Package metadata exposes route alias');
  context.assert(metadata && Array.isArray(metadata.diagnostics) && metadata.diagnostics.includes('rmt.dsl.kernel-boundary.refused'), 'Package metadata exposes kernel boundary diagnostic');
  context.assertIncludes(scaffoldConfig, 'rmtDslAuthoringPolish', 'Scaffold config exposes RMT DSL Authoring Polish section');
  context.assertIncludes(scaffoldConfig, RMT_DSL_AUTHORING_POLISH_SCHEMA, 'Scaffold config declares RMT DSL Authoring Polish schema');
  context.assertIncludes(scaffoldConfig, RMT_DSL_AUTHORING_POLISH_LOCAL_GATE, 'Scaffold config references RMT DSL Authoring Polish gate');
  context.assert(runner.hasSuite("rmt-dsl-authoring-polish"), 'Runner exposes RMT DSL Authoring Polish suite');

  assertIncludesAll(context, contractDoc, [
    RMT_DSL_AUTHORING_POLISH_SCHEMA,
    RMT_DSL_AUTHORING_POLISH_LOCAL_GATE,
    KERNEL_BOUNDARY,
    'route',
    'link',
    'outlet',
    'rmt.dsl.inline-runtime-code-refused'
  ], 'Contract doc');
  assertIncludesAll(context, docs, [
    RMT_DSL_AUTHORING_POLISH_SCHEMA,
    RMT_DSL_AUTHORING_POLISH_LOCAL_GATE,
    '--xtend-surface',
    'xtend.xrouter',
    KERNEL_BOUNDARY
  ], 'Docs page');
  context.assertIncludes(docsReadme, 'rmt-dsl-authoring-polish.md', 'Docs README links RMT DSL Authoring Polish');
  context.assertIncludes(docsMenu, 'rmt-dsl-authoring-polish', 'Docs menu exposes RMT DSL Authoring Polish');
  context.assertIncludes(rmtReadme, RMT_DSL_AUTHORING_POLISH_LOCAL_GATE, 'RMT tests README documents RMT DSL Authoring Polish gate');
  context.assertIncludes(typingReadme, 'rmt-dsl-authoring-polish.js', 'Typing README documents RMT DSL Authoring Polish module');
  context.assertIncludes(shellAuthoringDoc, 'xtend.rmt.shell-authoring.v1', 'Shell authoring source contract remains documented');
  context.assertIncludes(designTokenDoc, XTEND_DESIGN_TOKEN_SCHEMA, 'Design Token source contract remains documented');
  assertIncludesAll(context, workpackage, [
    'xtend.epic12.wp13.rmt-dsl-authoring-polish.v1',
    'Status: `completed`',
    RMT_DSL_AUTHORING_POLISH_SCHEMA,
    RMT_DSL_AUTHORING_POLISH_LOCAL_GATE
  ], 'Workpackage doc');
  context.assertIncludes(backlog, '| `WP-E12-13` | P2 | completed | WS7 |', 'Backlog marks WP-E12-13 completed');
  context.assertIncludes(backlog, '| `WP-E12-14` | P2 | completed | WS8 |', 'Backlog marks WP-E12-14 completed');
  context.assertIncludes(backlog, '| `WP-E12-15` | P2 | completed | WS9 |', 'Backlog marks WP-E12-15 completed');
  context.assertIncludes(backlog, '| `WP-E12-16` | P2 | completed | WS10 |', 'Backlog marks WP-E12-16 completed');
  context.assertIncludes(backlog, RMT_DSL_AUTHORING_POLISH_SCHEMA, 'Backlog records RMT DSL Authoring Polish schema');
  context.assertIncludes(rcModel, RMT_DSL_AUTHORING_POLISH_SCHEMA, 'RC Hardening model records RMT DSL Authoring Polish schema');
  context.assertIncludes(rcModel, 'WP-E12-16', 'RC Hardening model hands off to WP-E12-16 after docs adoption');
  context.assertIncludes(registry, RMT_DSL_AUTHORING_POLISH_SCHEMA, 'Reference registry records RMT DSL Authoring Polish schema');
  context.assertIncludes(registry, RMT_DSL_AUTHORING_POLISH_DOC_PATH, 'Reference registry records docs path');

  return context.result({
    report: {
      schema: RMT_DSL_AUTHORING_POLISH_REPORT_SCHEMA,
      workpackage: RMT_DSL_AUTHORING_POLISH_WORKPACKAGE,
      aliases: DSL_ALIAS_NAMES.length,
      diagnostics: DIAGNOSTIC_CODES.length,
      examples: fixture.authoringExamples.length,
      gate: RMT_DSL_AUTHORING_POLISH_LOCAL_GATE
    }
  });
}

function printRmtDslAuthoringPolishReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 12 RMT DSL Authoring Polish erfolgreich.',
    failureTitle: 'Epic 12 RMT DSL Authoring Polish fehlgeschlagen:'
  });
}

module.exports = {
  printRmtDslAuthoringPolishReport,
  runRmtDslAuthoringPolishSuite
};

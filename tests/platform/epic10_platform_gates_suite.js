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
  BROWSER_FIXTURES,
  EPIC10_PLATFORM_GATES_DEVELOPER_DOCS,
  EPIC10_PLATFORM_GATES_DOC,
  EPIC10_PLATFORM_GATES_LOCAL_GATE,
  EPIC10_PLATFORM_GATES_MODULE,
  EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT,
  EPIC10_PLATFORM_GATES_REPORT_SCHEMA,
  EPIC10_PLATFORM_GATES_SCHEMA,
  EPIC10_PLATFORM_GATES_STATUS,
  EPIC10_PLATFORM_GATES_SUITE,
  EPIC10_PLATFORM_GATES_WORKPACKAGE,
  EPIC10_PLATFORM_GATES_WORKPACKAGE_DOC,
  EPIC10_PLATFORM_GATE_RECORD_SCHEMA,
  FAST_PR_SUITE_IDS,
  KERNEL_BOUNDARY,
  RELEASE_SUITE_IDS,
  REQUIRED_GATE_DOMAINS,
  createEpic10PlatformGatePlan,
  createEpic10PlatformGateReport,
  validateEpic10PlatformGatePlan
} = require('../../catalog/epic10-platform-gates');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function runEpic10PlatformGatesSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'epic10-platform-gates',
    label: 'Epic 10 Browser, A11y, Performance and Visual Platform Gates'
  });
  const plan = createEpic10PlatformGatePlan({ rootDir });
  const validation = validateEpic10PlatformGatePlan(plan);
  const report = createEpic10PlatformGateReport({ rootDir, plan });
  const packageManifest = readJson('package.json', rootDir);
  const componentManifest = readJson('components/manifest.json', rootDir);
  const manifestComponentCount = Object.keys(componentManifest || {}).length;
  const metadata = packageManifest.xtend && packageManifest.xtend.epic10PlatformGates;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const platformDocs = readText('docs/component-platform.md', rootDir);
  const rmtReadme = readText('tests/rmt/README.md', rootDir);
  const contract = readText(EPIC10_PLATFORM_GATES_DOC, rootDir);
  const workpackage = readText(EPIC10_PLATFORM_GATES_WORKPACKAGE_DOC, rootDir);
  const docs = readText(EPIC10_PLATFORM_GATES_DEVELOPER_DOCS, rootDir);
  const moduleSyntax = syntaxCheckFile(EPIC10_PLATFORM_GATES_MODULE, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(EPIC10_PLATFORM_GATES_SUITE, { rootDir, extension: '.js' });

  [
    EPIC10_PLATFORM_GATES_MODULE,
    EPIC10_PLATFORM_GATES_SUITE,
    EPIC10_PLATFORM_GATES_DOC,
    EPIC10_PLATFORM_GATES_WORKPACKAGE_DOC,
    EPIC10_PLATFORM_GATES_DEVELOPER_DOCS
  ].forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists`);
  });
  BROWSER_FIXTURES.forEach((fixturePath) => {
    assertFileExists(context, fixturePath, rootDir, `${fixturePath} exists`);
  });

  context.assert(moduleSyntax.ok, `Epic 10 Platform Gates module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Epic 10 Platform Gates suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assert(plan.schema === EPIC10_PLATFORM_GATES_SCHEMA, 'Platform gate plan exposes stable schema');
  context.assert(plan.reportSchema === EPIC10_PLATFORM_GATES_REPORT_SCHEMA, 'Platform gate plan exposes report schema');
  context.assert(plan.gateRecordSchema === EPIC10_PLATFORM_GATE_RECORD_SCHEMA, 'Platform gate plan exposes gate record schema');
  context.assert(plan.workpackage === EPIC10_PLATFORM_GATES_WORKPACKAGE, 'Platform gate plan belongs to WP-E10-15');
  context.assert(plan.status === EPIC10_PLATFORM_GATES_STATUS, 'Platform gate plan is accepted');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Platform gate plan keeps RMT kernel boundary');
  context.assert(validation.schema === EPIC10_PLATFORM_GATES_REPORT_SCHEMA, 'Platform validator emits report schema');
  context.assert(validation.ok === true, 'Platform gate plan validates');
  context.assert(report.ok === true, 'Platform gate report passes');
  context.assert(report.localGate === EPIC10_PLATFORM_GATES_LOCAL_GATE, 'Platform gate report exposes local gate');

  assertIncludesAll(context, plan.requiredDomains, REQUIRED_GATE_DOMAINS, 'Platform gate domains');
  context.assert(plan.summary.gateCount === 12, 'Platform gate plan exposes twelve gate records');
  context.assert(plan.summary.byDomain.a11y === 3, 'Platform gate plan groups three A11y gates');
  context.assert(plan.summary.byDomain.performance === 3, 'Platform gate plan groups three performance gates');
  context.assert(plan.summary.byTier['fast-pr'] === 9, 'Platform gate plan keeps nine fast PR gates');
  context.assert(plan.summary.byTier.release === 3, 'Platform gate plan keeps three release-only performance gates');

  plan.gates.forEach((gate) => {
    context.assert(gate.schema === EPIC10_PLATFORM_GATE_RECORD_SCHEMA, `${gate.id} exposes gate record schema`);
    context.assert(REQUIRED_GATE_DOMAINS.includes(gate.domain), `${gate.id} belongs to a required domain`);
    context.assert(gate.command.includes(gate.suiteId), `${gate.id} command invokes its suite id`);
    context.assert(gate.packageScript.startsWith('npm run test:'), `${gate.id} exposes package script`);
    context.assert(Array.isArray(gate.validates) && gate.validates.length > 0, `${gate.id} declares validation targets`);
  });

  assertIncludesAll(context, plan.ci.fastPr.suiteIds, FAST_PR_SUITE_IDS, 'Fast PR gate suites');
  assertIncludesAll(context, plan.ci.release.suiteIds, RELEASE_SUITE_IDS, 'Release gate suites');
  context.assert(!plan.ci.fastPr.suiteIds.includes('performance-regression'), 'Fast PR gate excludes performance-regression');
  context.assert(plan.ci.release.suiteIds.includes('performance-regression'), 'Release gate includes performance-regression');
  context.assert(plan.ci.release.suiteIds.includes('fabric-performance-measurements'), 'Release gate includes Fabric performance measurements');
  context.assert(plan.ci.handoff === 'WP-E10-16', 'Platform gates hand off to WP-E10-16');

  context.assert(plan.browser.localOnly === true, 'Browser gates stay local-only');
  context.assert(plan.browser.cdnAllowed === false, 'Browser gates reject CDN loading');
  context.assert(plan.browser.fixtures.includes('tests/browser/fixtures/rmt-first-demo-app-smoke.html'), 'Browser gates include RMT-first demo smoke');
  context.assert(plan.browser.fixtures.includes('tests/browser/fixtures/a11y-focus-keyboard-smoke.html'), 'Browser gates include A11y keyboard smoke');
  context.assertIncludes(browserSuite, 'RMT_FIRST_DEMO_SMOKE_FIXTURE_PATH', 'Browser smoke suite registers RMT-first demo fixture');
  context.assertIncludes(browserSuite, '__xtendRmtFirstDemoSmokeResult', 'Browser smoke suite registers RMT-first demo result key');
  context.assertIncludes(browserSuite, 'A11Y_FOCUS_KEYBOARD_FIXTURE_PATH', 'Browser smoke suite registers A11y keyboard fixture');
  context.assertIncludes(browserSuite, '__xtendA11yKeyboardSmokeResult', 'Browser smoke suite registers A11y keyboard result key');

  context.assert(plan.componentTargets.typescriptFirst.length === 9, 'Platform gate plan covers nine TypeScript-first targets');
  context.assert(plan.componentTargets.existingMetadata.length === 9, 'Platform gate plan covers nine existing metadata targets');
  context.assert(plan.componentTargets.typescriptFirst.includes('x-select'), 'Platform gate plan covers x-select');
  context.assert(plan.componentTargets.typescriptFirst.includes('x-drawer'), 'Platform gate plan covers x-drawer');
  context.assert(plan.componentTargets.existingMetadata.includes('x-router'), 'Platform gate plan covers x-router');
  context.assert(plan.componentTargets.existingMetadata.includes('x-alert'), 'Platform gate plan covers x-alert');
  context.assert(plan.visualRegression.componentCount === manifestComponentCount, 'Visual regression source covers all manifest components');
  context.assert(plan.visualRegression.viewports.includes('desktop-1280') && plan.visualRegression.viewports.includes('mobile-390'), 'Visual regression covers desktop and mobile viewports');
  context.assert(plan.visualRegression.themeVariants.includes('forced-colors') && plan.visualRegression.themeVariants.includes('reduced-motion'), 'Visual regression covers forced-colors and reduced-motion variants');
  context.assert(plan.visualRegression.prioritizedTargets.includes('x-router'), 'Visual regression prioritizes existing route components');
  context.assert(plan.visualRegression.prioritizedTargets.includes('x-popover'), 'Visual regression prioritizes Epic 10 overlay components');

  context.assertIncludes(contract, EPIC10_PLATFORM_GATES_SCHEMA, 'Platform gate contract declares schema');
  context.assertIncludes(contract, EPIC10_PLATFORM_GATES_LOCAL_GATE, 'Platform gate contract documents local gate');
  context.assertIncludes(contract, 'Fast PR Gate', 'Platform gate contract documents Fast PR Gate');
  context.assertIncludes(contract, 'Release Gate', 'Platform gate contract documents Release Gate');
  context.assertIncludes(contract, KERNEL_BOUNDARY, 'Platform gate contract keeps kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-15 is completed');
  context.assertIncludes(workpackage, EPIC10_PLATFORM_GATES_LOCAL_GATE, 'WP-E10-15 documents local gate');
  context.assertIncludes(docs, EPIC10_PLATFORM_GATES_SCHEMA, 'Platform gate docs declare schema');
  context.assertIncludes(docs, EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT, 'Platform gate docs document package script');
  context.assertIncludes(docsReadme, 'Epic 10 Platform Gates', 'Docs README links Epic 10 Platform Gates');
  context.assertIncludes(docsMenu, 'epic10-platform-gates', 'Docs menu links Epic 10 Platform Gates');
  context.assertIncludes(platformDocs, 'Epic 10 Platform Gates', 'Component Platform docs mention Epic 10 Platform Gates');
  context.assertIncludes(rmtReadme, EPIC10_PLATFORM_GATES_SCHEMA, 'RMT README documents Epic 10 Platform Gates');
  context.assertIncludes(epic, '| `WP-E10-15` | P1 | completed |', 'Epic 10 marks WP-E10-15 completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '| `WP-E10-15` | P1 | completed |', 'Backlog marks WP-E10-15 completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(registry, EPIC10_PLATFORM_GATES_MODULE, 'Reference registry links Platform Gates module');
  context.assertIncludes(registry, EPIC10_PLATFORM_GATES_DOC, 'Reference registry links Platform Gates contract');
  context.assertIncludes(registry, EPIC10_PLATFORM_GATES_SUITE, 'Reference registry links Platform Gates suite');
  context.assertIncludes(registry, EPIC10_PLATFORM_GATES_DEVELOPER_DOCS, 'Reference registry links Platform Gates docs');
  context.assertIncludes(scaffoldConfig, 'epic10PlatformGates', 'Scaffold config exposes Epic 10 Platform Gates');
  context.assertIncludes(runner, "id: 'epic10-platform-gates'", 'Runner registers Epic 10 Platform Gates suite');

  context.assert((packageManifest.exports['./catalog/epic10-platform-gates'] === './catalog/epic10-platform-gates.js' || (packageManifest.exports['./catalog/epic10-platform-gates'] && packageManifest.exports['./catalog/epic10-platform-gates'].default === './catalog/epic10-platform-gates.js')), 'Package exports Epic 10 Platform Gates module');
  context.assert(packageManifest.scripts['test:epic10-platform-gates'] === 'node scripts/run_xtend_tests.js epic10-platform-gates', 'Package exposes Epic 10 Platform Gates test script');
  context.assert(metadata && metadata.schema === EPIC10_PLATFORM_GATES_SCHEMA, 'Package metadata exposes Epic 10 Platform Gates schema');
  context.assert(metadata && metadata.reportSchema === EPIC10_PLATFORM_GATES_REPORT_SCHEMA, 'Package metadata exposes Epic 10 Platform Gates report schema');
  context.assert(metadata && metadata.workpackage === EPIC10_PLATFORM_GATES_WORKPACKAGE, 'Package metadata exposes WP-E10-15 owner');
  context.assert(metadata && metadata.module === EPIC10_PLATFORM_GATES_MODULE, 'Package metadata exposes Platform Gates module');
  context.assert(metadata && metadata.suite === EPIC10_PLATFORM_GATES_SUITE, 'Package metadata exposes Platform Gates suite');
  context.assert(metadata && metadata.localGate === EPIC10_PLATFORM_GATES_LOCAL_GATE, 'Package metadata exposes Platform Gates local gate');
  context.assert(metadata && metadata.packageScript === EPIC10_PLATFORM_GATES_PACKAGE_SCRIPT, 'Package metadata exposes Platform Gates package script');
  context.assert(Array.isArray(metadata.fastPrSuiteIds) && metadata.fastPrSuiteIds.includes('browser'), 'Package metadata exposes fast PR browser gate');
  context.assert(Array.isArray(metadata.fastPrSuiteIds) && metadata.fastPrSuiteIds.includes('epic10-release-handoff'), 'Package metadata exposes fast PR release handoff gate');
  context.assert(Array.isArray(metadata.releaseSuiteIds) && metadata.releaseSuiteIds.includes('performance-regression'), 'Package metadata exposes release performance gate');
  context.assert(metadata && metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata keeps RMT kernel boundary');

  return context.result({
    report: {
      schema: EPIC10_PLATFORM_GATES_REPORT_SCHEMA,
      domains: plan.requiredDomains,
      gateCount: plan.gates.length,
      fastPrSuites: plan.ci.fastPr.suiteIds,
      releaseSuites: plan.ci.release.suiteIds
    }
  });
}

function printEpic10PlatformGatesReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 10 Platform Gates erfolgreich.',
    failureTitle: 'Epic 10 Platform Gates fehlgeschlagen:'
  });
}

module.exports = {
  printEpic10PlatformGatesReport,
  runEpic10PlatformGatesSuite
};

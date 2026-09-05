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
  COMPONENT_UX_BROWSER_SMOKE_SCHEMA
} = require('./component-ux-browser-smoke-plan');
const {
  COMPONENT_REGRESSION_PRIORITY_SCHEMA
} = require('../../catalog/component-regression-priority');
const {
  COMPONENT_SHELL_THEME_MATRIX_CONTRACT_META,
  COMPONENT_SHELL_THEME_MATRIX_DENSITIES,
  COMPONENT_SHELL_THEME_MATRIX_DOC_PATH,
  COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH,
  COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE,
  COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES,
  COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY,
  COMPONENT_SHELL_THEME_MATRIX_SCHEMA,
  COMPONENT_SHELL_THEME_MATRIX_SUITE_PATH,
  COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS,
  COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS,
  COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE,
  COMPONENT_SHELL_THEME_MATRIX_WP_PATH,
  FAMILY_REQUIRED_CHECKS,
  FAMILY_VISUAL_STATES,
  createComponentShellThemeMatrixGate,
  createComponentShellThemeMatrixPlan,
  validateComponentShellThemeMatrixPlan
} = require('./component-shell-theme-matrix-plan');

const PLAN_PATH = 'tests/browser/component-shell-theme-matrix-plan.js';
const REQUIRED_MANIFEST_ENTRIES = {
  'x-tabs': '/components/xtabs.js',
  'x-select': '/components/xselect.js',
  'x-checkbox': '/components/xcheckbox.js',
  'x-toggle': '/components/xtoggle.js',
  'x-status': '/components/xstatus.js',
  'x-progress': '/components/xprogress.js',
  'x-drawer': '/components/xdrawer.js',
  'x-section': '/components/xsection.js',
  'x-cards': '/components/xcards.js',
  'x-code': '/components/xcode.js',
  'x-player': '/components/xplayer.js'
};

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, source, expected, label) {
  expected.forEach((entry) => {
    context.assert(source.includes(entry), `${label} includes ${entry}`);
  });
}

function runComponentShellThemeMatrixSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-shell-theme-matrix',
    label: 'Epic 11 Component Shell Theme Matrix'
  });
  const plan = createComponentShellThemeMatrixPlan({ rootDir });
  const validation = validateComponentShellThemeMatrixPlan(plan);
  const gate = createComponentShellThemeMatrixGate({ rootDir, plan });
  const fixture = readText(COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH, rootDir);
  const manifest = readJson('tests/browser/fixtures/components/manifest.json', rootDir);
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.componentShellThemeMatrix;
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const browserReadme = readText('tests/browser/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const doc = readText(COMPONENT_SHELL_THEME_MATRIX_DOC_PATH, rootDir);
  const workpackage = readText(COMPONENT_SHELL_THEME_MATRIX_WP_PATH, rootDir);
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const uxSmokePlan = readText('tests/browser/component-ux-browser-smoke-plan.js', rootDir);
  const regressionPriority = readText('catalog/component-regression-priority.js', rootDir);
  const planSyntax = syntaxCheckFile(PLAN_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(COMPONENT_SHELL_THEME_MATRIX_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, PLAN_PATH, rootDir, 'Component Shell Theme Matrix plan exists');
  assertFileExists(context, COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH, rootDir, 'Component Shell Theme Matrix fixture exists');
  assertFileExists(context, COMPONENT_SHELL_THEME_MATRIX_DOC_PATH, rootDir, 'Component Shell Theme Matrix contract document exists');
  assertFileExists(context, COMPONENT_SHELL_THEME_MATRIX_WP_PATH, rootDir, 'WP-E11-15 workpackage document exists');
  assertFileExists(context, COMPONENT_SHELL_THEME_MATRIX_SUITE_PATH, rootDir, 'Component Shell Theme Matrix suite exists');
  context.assert(planSyntax.ok, `Component Shell Theme Matrix plan syntax passes${planSyntax.ok ? '' : ` (${planSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Component Shell Theme Matrix suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(plan.schema === COMPONENT_SHELL_THEME_MATRIX_SCHEMA, 'Theme Matrix plan declares schema');
  context.assert(plan.entrySchema === COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA, 'Theme Matrix plan declares entry schema');
  context.assert(plan.reportSchema === COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA, 'Theme Matrix plan declares report schema');
  context.assert(plan.status === 'accepted-theme-matrix', 'Theme Matrix plan is accepted');
  context.assert(plan.workpackage === COMPONENT_SHELL_THEME_MATRIX_WORKPACKAGE, 'Theme Matrix plan belongs to WP-E11-15');
  context.assert(plan.contractMeta === COMPONENT_SHELL_THEME_MATRIX_CONTRACT_META, 'Theme Matrix plan declares contract meta');
  context.assert(plan.localOnly === true, 'Theme Matrix plan is local-only');
  context.assert(plan.externalNetworkAllowed === false, 'Theme Matrix plan rejects external network');
  context.assert(plan.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Theme Matrix plan keeps RMT kernel boundary');
  context.assert(plan.handoff.nextWorkpackage === 'WP-E11-16', 'Theme Matrix plan hands off to WP-E11-16');
  context.assert(plan.browserHarness.fixturePath === COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH, 'Theme Matrix plan points to fixture');
  context.assert(plan.browserHarness.resultKey === COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY, 'Theme Matrix plan points to result key');
  context.assert(plan.sourceBrowserSmokes.schema === COMPONENT_UX_BROWSER_SMOKE_SCHEMA, 'Theme Matrix derives from Browser UX smokes');
  context.assert(plan.sourceBrowserSmokes.workpackage === 'WP-E11-14', 'Theme Matrix derives from WP-E11-14');
  context.assert(plan.sourceRegressionPriority.schema === COMPONENT_REGRESSION_PRIORITY_SCHEMA, 'Theme Matrix links regression priority plan');
  context.assert(plan.coverage.flowCount === 5, 'Theme Matrix covers five UX journeys');
  context.assert(plan.coverage.familyCount === 5, 'Theme Matrix covers five UX families');
  context.assert(plan.coverage.componentCount === 18, 'Theme Matrix covers eighteen representative components with x-toggle form coverage');
  context.assert(plan.coverage.themeVariantCount === 4, 'Theme Matrix covers four theme variants');
  context.assert(plan.coverage.motionModeCount === 2, 'Theme Matrix covers two motion modes');
  context.assert(plan.coverage.densityCount === 3, 'Theme Matrix covers three densities');
  context.assert(plan.coverage.viewportCount === 3, 'Theme Matrix covers three viewport contracts');
  context.assert(plan.coverage.matrixCombinationCount === 360, 'Theme Matrix exposes 360 shell-state combinations');
  context.assert(validation.schema === COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA, 'Theme Matrix validator emits report schema');
  context.assert(validation.ok === true, 'Theme Matrix validator accepts generated plan');
  context.assert(gate.ok === true, 'Theme Matrix gate passes');
  context.assert(plan.localGate === COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE, 'Theme Matrix plan exposes local gate');

  assertIncludesAll(context, plan.themeVariants, COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS, 'Theme Matrix theme variants');
  assertIncludesAll(context, plan.motionModes, COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES, 'Theme Matrix motion modes');
  assertIncludesAll(context, plan.densities, COMPONENT_SHELL_THEME_MATRIX_DENSITIES, 'Theme Matrix densities');
  assertIncludesAll(context, plan.viewports, COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS, 'Theme Matrix viewports');
  context.assert(plan.sourceRegressionPriority.coreThemeVariants.includes('reduced-motion'), 'Theme Matrix maps reduced-motion from regression priority into motion modes');
  context.assert(plan.sourceRegressionPriority.coreViewports.includes('desktop-1280') && plan.sourceRegressionPriority.coreViewports.includes('mobile-390'), 'Theme Matrix inherits core regression viewports');

  Object.keys(FAMILY_VISUAL_STATES).forEach((familyId) => {
    const entry = plan.entries.find((candidate) => candidate.family === familyId);
    context.assert(Boolean(entry), `${familyId}: Theme Matrix entry is exposed`);
    context.assert(entry && entry.schema === COMPONENT_SHELL_THEME_MATRIX_ENTRY_SCHEMA, `${familyId}: entry schema is stable`);
    context.assert(entry && entry.sourceWorkpackage === 'WP-E11-14', `${familyId}: entry links WP-E11-14 source`);
    context.assert(entry && entry.components.length >= 2, `${familyId}: entry covers multiple components`);
    assertIncludesAll(context, entry ? entry.visualStates : [], FAMILY_VISUAL_STATES[familyId], `${familyId} visual states`);
    assertIncludesAll(context, entry ? entry.requiredChecks : [], FAMILY_REQUIRED_CHECKS[familyId], `${familyId} fixture checks`);
    assertIncludesAll(context, entry ? entry.themeVariants : [], COMPONENT_SHELL_THEME_MATRIX_THEME_VARIANTS, `${familyId} theme variants`);
    assertIncludesAll(context, entry ? entry.motionModes : [], COMPONENT_SHELL_THEME_MATRIX_MOTION_MODES, `${familyId} motion modes`);
    assertIncludesAll(context, entry ? entry.densities : [], COMPONENT_SHELL_THEME_MATRIX_DENSITIES, `${familyId} densities`);
    assertIncludesAll(context, entry ? entry.viewports : [], COMPONENT_SHELL_THEME_MATRIX_VIEWPORTS, `${familyId} viewports`);
  });

  context.assert(fixture.includes(COMPONENT_SHELL_THEME_MATRIX_SCHEMA), 'Theme Matrix fixture declares schema');
  context.assert(fixture.includes(COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY), 'Theme Matrix fixture exposes stable result key');
  context.assert(fixture.includes('type="module"'), 'Theme Matrix fixture uses module loader');
  context.assert(fixture.includes('src="/xtend-loader.js"'), 'Theme Matrix fixture uses canonical local loader');
  context.assert(fixture.includes('data-manifest="/tests/browser/fixtures/components/manifest.json"'), 'Theme Matrix fixture uses local manifest');
  context.assert(fixture.includes('name="xtend-preload"'), 'Theme Matrix fixture preloads representative components');
  context.assert(!fixture.includes('type="importmap"'), 'Theme Matrix fixture avoids CDN import maps');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Theme Matrix fixture has no XTend CDN dependency');
  [
    'theme matrix fixture hydrated local loader',
    'theme matrix light tokens applied',
    'theme matrix dark tokens applied',
    'theme matrix high contrast tokens applied',
    'theme matrix forced colors contract visible',
    'theme matrix reduced motion contract visible',
    'theme matrix comfortable density applied',
    'theme matrix compact density applied',
    'theme matrix dense density applied',
    'theme matrix desktop viewport contract visible',
    'theme matrix tablet viewport contract visible',
    'theme matrix mobile viewport contract visible',
    'visual matrix remains local only'
  ].forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Theme Matrix fixture records ${check}`);
  });
  Object.values(FAMILY_REQUIRED_CHECKS).flat().forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Theme Matrix fixture records ${check}`);
  });

  Object.entries(REQUIRED_MANIFEST_ENTRIES).forEach(([tag, expectedPath]) => {
    context.assert(manifest[tag] === expectedPath, `Theme Matrix fixture manifest resolves ${tag} locally`);
  });

  context.assertIncludes(browserSuite, 'EPIC11_THEME_MATRIX_FIXTURE_PATH', 'Browser suite registers Theme Matrix fixture path');
  context.assertIncludes(browserSuite, COMPONENT_SHELL_THEME_MATRIX_RESULT_KEY, 'Browser suite registers Theme Matrix result key');
  context.assertIncludes(browserSuite, 'assertEpic11ThemeMatrixFixtureContract', 'Browser suite exposes Theme Matrix contract assertion');

  context.assertIncludes(uxSmokePlan, COMPONENT_UX_BROWSER_SMOKE_SCHEMA, 'Theme Matrix source browser smoke plan is available');
  context.assertIncludes(regressionPriority, COMPONENT_REGRESSION_PRIORITY_SCHEMA, 'Theme Matrix source regression priority plan is available');
  context.assertIncludes(regressionPriority, 'CORE_THEME_VARIANTS', 'Regression priority exposes core theme variants');
  context.assertIncludes(regressionPriority, 'CORE_VIEWPORTS', 'Regression priority exposes core viewports');

  context.assertIncludes(doc, COMPONENT_SHELL_THEME_MATRIX_SCHEMA, 'Theme Matrix contract document declares schema');
  context.assertIncludes(doc, COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE, 'Theme Matrix contract document declares local gate');
  context.assertIncludes(doc, 'light', 'Theme Matrix contract documents light theme');
  context.assertIncludes(doc, 'dark', 'Theme Matrix contract documents dark theme');
  context.assertIncludes(doc, 'high-contrast', 'Theme Matrix contract documents high contrast');
  context.assertIncludes(doc, 'forced-colors', 'Theme Matrix contract documents forced colors');
  context.assertIncludes(doc, 'reduced-motion', 'Theme Matrix contract documents reduced motion');
  context.assertIncludes(doc, 'comfortable', 'Theme Matrix contract documents comfortable density');
  context.assertIncludes(doc, 'compact', 'Theme Matrix contract documents compact density');
  context.assertIncludes(doc, 'dense', 'Theme Matrix contract documents dense density');
  context.assertIncludes(doc, 'desktop-1280', 'Theme Matrix contract documents desktop viewport');
  context.assertIncludes(doc, 'tablet-768', 'Theme Matrix contract documents tablet viewport');
  context.assertIncludes(doc, 'mobile-390', 'Theme Matrix contract documents mobile viewport');
  context.assertIncludes(doc, '360', 'Theme Matrix contract documents combination count');
  context.assertIncludes(doc, 'no-rmt-kernel-import-of-xtend-types', 'Theme Matrix contract keeps kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-15 is completed');
  context.assertIncludes(workpackage, COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE, 'WP-E11-15 documents local gate');
  context.assertIncludes(browserReadme, COMPONENT_SHELL_THEME_MATRIX_SCHEMA, 'Browser README documents Theme Matrix schema');
  context.assertIncludes(browserReadme, COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH, 'Browser README documents Theme Matrix fixture');
  context.assertIncludes(testsReadme, COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE, 'Test README documents Theme Matrix gate');
  context.assertIncludes(scaffoldConfig, 'componentShellThemeMatrix', 'Scaffold config exposes Theme Matrix metadata');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic 11 marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic 11 marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic 11 marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed | WS8 |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed | WS9 |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed | WS10 |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(registry, COMPONENT_SHELL_THEME_MATRIX_DOC_PATH, 'Reference registry links Theme Matrix contract');
  context.assertIncludes(registry, COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH, 'Reference registry links Theme Matrix fixture');
  context.assertIncludes(registry, COMPONENT_SHELL_THEME_MATRIX_SUITE_PATH, 'Reference registry links Theme Matrix suite');
  context.assert(runner.hasSuite("component-shell-theme-matrix"), 'XTend runner registers Theme Matrix suite');
  context.assert(packageManifest.scripts['test:component-shell-theme-matrix'] === 'node scripts/run_xtend_tests.js component-shell-theme-matrix', 'Package exposes Theme Matrix test script');
  context.assert(metadata && metadata.schema === COMPONENT_SHELL_THEME_MATRIX_SCHEMA, 'Package metadata exposes Theme Matrix schema');
  context.assert(metadata && metadata.reportSchema === COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA, 'Package metadata exposes Theme Matrix report schema');
  context.assert(metadata && metadata.fixture === COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH, 'Package metadata exposes Theme Matrix fixture');
  context.assert(metadata && metadata.localGate === COMPONENT_SHELL_THEME_MATRIX_LOCAL_GATE, 'Package metadata exposes Theme Matrix local gate');
  context.assert(metadata && metadata.componentCount === 18, 'Package metadata exposes Theme Matrix component count with x-toggle');
  context.assert(metadata && metadata.matrixCombinationCount === 360, 'Package metadata exposes Theme Matrix combination count');
  context.assert(Array.isArray(metadata.themeVariants) && metadata.themeVariants.length === 4, 'Package metadata exposes four Theme Matrix theme variants');
  context.assert(Array.isArray(metadata.motionModes) && metadata.motionModes.includes('reduced-motion'), 'Package metadata exposes reduced motion mode');
  context.assert(Array.isArray(metadata.densities) && metadata.densities.length === 3, 'Package metadata exposes three Theme Matrix densities');
  context.assert(Array.isArray(metadata.viewports) && metadata.viewports.includes('tablet-768'), 'Package metadata exposes tablet viewport');

  return context.result({
    report: {
      schema: COMPONENT_SHELL_THEME_MATRIX_REPORT_SCHEMA,
      flowCount: plan.coverage.flowCount,
      componentCount: plan.coverage.componentCount,
      matrixCombinationCount: plan.coverage.matrixCombinationCount,
      fixture: COMPONENT_SHELL_THEME_MATRIX_FIXTURE_PATH
    }
  });
}

function printComponentShellThemeMatrixReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 11 Component Shell Theme Matrix erfolgreich.',
    failureTitle: 'Epic 11 Component Shell Theme Matrix fehlgeschlagen:'
  });
}

module.exports = {
  printComponentShellThemeMatrixReport,
  runComponentShellThemeMatrixSuite
};

const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA,
  COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA,
  COMPONENT_REGRESSION_PRIORITY_SCHEMA,
  createComponentRegressionPriorityGate,
  createComponentRegressionPriorityPlan,
  validateComponentRegressionPriorityPlan
} = require('../../catalog/component-regression-priority');

const EXPECTED_REGRESSION_PRIORITY_SCHEMA = 'xtend.catalog.component-regression-priority-plan.v1';

function findEntry(plan, tag) {
  return plan.entries.find((entry) => entry.tag === tag);
}

function runComponentRegressionPrioritySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'regression-priority',
    label: 'XTend visual and browser regression priority plan'
  });
  const packageManifest = readJson('package.json', rootDir);
  const manifest = readJson('components/manifest.json', rootDir);
  const moduleSource = readText('catalog/component-regression-priority.js', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Enterprise-Reife.md', rootDir);
  const contractDoc = readText('development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md', rootDir);
  const developerDocs = readText('docs/en/visual-browser-regression.md', rootDir);
  const suiteSyntax = syntaxCheckFile('tests/catalog/component_regression_priority_suite.js', { rootDir, extension: '.js' });
  const moduleSyntax = syntaxCheckFile('catalog/component-regression-priority.js', { rootDir, extension: '.js' });
  const plan = createComponentRegressionPriorityPlan({ rootDir });
  const validation = validateComponentRegressionPriorityPlan(plan);
  const gate = createComponentRegressionPriorityGate({ rootDir });
  const xRouter = findEntry(plan, 'x-router');
  const xTabs = findEntry(plan, 'x-tabs');
  const xSelect = findEntry(plan, 'x-select');
  const xTextarea = findEntry(plan, 'x-textarea');
  const xStatus = findEntry(plan, 'x-status');
  const xProgress = findEntry(plan, 'x-progress');
  const xTooltip = findEntry(plan, 'x-tooltip');
  const xPopover = findEntry(plan, 'x-popover');
  const xDrawer = findEntry(plan, 'x-drawer');
  const xModal = findEntry(plan, 'x-modal');
  const xTheme = findEntry(plan, 'x-theme');
  const xButton = findEntry(plan, 'x-button');
  const xIcon = findEntry(plan, 'x-icon');
  const xMenu = findEntry(plan, 'x-menu');
  const xWriter = findEntry(plan, 'x-writer');
  const xState = findEntry(plan, 'xtend-state');
  const xUtils = findEntry(plan, 'x-utils');
  const xtendI18n = findEntry(plan, 'xtend-i18n');
  const expectedManifestCount = Object.keys(manifest).length;

  context.assert(moduleSyntax.ok, `Component regression priority module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Component regression priority suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assertIncludes(moduleSource, COMPONENT_REGRESSION_PRIORITY_SCHEMA, 'Module declares regression priority plan schema');
  context.assertIncludes(moduleSource, COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA, 'Module declares regression priority entry schema');
  context.assertIncludes(moduleSource, COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA, 'Module declares regression priority gate schema');
  context.assertIncludes(moduleSource, 'PROFILE_BROWSER_SMOKES', 'Module maps profiles to browser smoke obligations');
  context.assertIncludes(moduleSource, 'PROFILE_VISUAL_STATES', 'Module maps profiles to visual states');
  context.assert(COMPONENT_REGRESSION_PRIORITY_SCHEMA === EXPECTED_REGRESSION_PRIORITY_SCHEMA, 'Suite tracks stable regression priority schema literal');

  context.assert(plan.schema === COMPONENT_REGRESSION_PRIORITY_SCHEMA, 'Plan exposes stable regression priority schema');
  context.assert(plan.sourceCoverageSchema === 'xtend.catalog.component-coverage-matrix.v1', 'Plan is derived from Component Catalog Coverage');
  context.assert(plan.entrySchema === COMPONENT_REGRESSION_PRIORITY_ENTRY_SCHEMA, 'Plan exposes entry schema');
  context.assert(plan.gateSchema === COMPONENT_REGRESSION_PRIORITY_GATE_SCHEMA, 'Plan exposes gate schema');
  context.assert(plan.workpackage === 'ER-WP-35', 'Plan is owned by ER-WP-35');
  context.assert(plan.entries.length === expectedManifestCount, `Plan covers all ${expectedManifestCount} Manifest components`);
  context.assert(plan.summary.componentCount === expectedManifestCount, 'Summary counts all Manifest components');
  context.assert(plan.summary.byTier['p0-browser-critical'] >= 17, 'Plan identifies P0 browser-critical components');
  context.assert(plan.summary.byTier['p1-visual-performance'] >= 11, 'Plan identifies P1 visual/performance components');
  context.assert(plan.summary.byTier['p2-long-tail'] >= 8, 'Plan keeps P2 long-tail components visible');
  context.assert(plan.summary.requiresPerformanceProfile === 3, 'Plan keeps performance profile authoring visible for the remaining infrastructure catalog');
  context.assert(plan.summary.requiresA11yRemediation === 1, 'Plan keeps the remaining A11y remediation count visible after WP-E12-04');
  context.assert(plan.summary.requiresLongTailSuite === 0, 'Plan closes long-tail suite and fixture gap after WP-E12-09 x-utils boundary suite');
  context.assert(plan.viewports.includes('desktop-1280') && plan.viewports.includes('mobile-390'), 'Plan requires desktop and mobile viewports');
  context.assert(plan.themeVariants.includes('light') && plan.themeVariants.includes('dark'), 'Plan requires light and dark theme variants');
  context.assert(plan.themeVariants.includes('forced-colors') && plan.themeVariants.includes('reduced-motion'), 'Plan requires forced-colors and reduced-motion variants');

  context.assert(validation.ok === true, 'Regression priority plan validates');
  context.assert(gate.ok === true, 'Regression priority gate passes');
  context.assert(gate.warnings.some((warning) => warning.dimension === 'performance'), 'Gate reports performance-profile warning');
  context.assert(gate.warnings.some((warning) => warning.dimension === 'a11y'), 'Gate reports A11y remediation warning');
  context.assert(!gate.warnings.some((warning) => warning.dimension === 'long-tail'), 'Gate closes long-tail suite warning after WP-E12-09');

  context.assert(xRouter && xRouter.tier === 'p0-browser-critical', 'x-router is P0 browser-critical');
  context.assert(xRouter && xRouter.browserSmokes.includes('route-change'), 'x-router plans route-change browser smoke');
  context.assert(xRouter && xRouter.browserSmokes.includes('rmt-route-adapter'), 'x-router plans RMT route adapter smoke');
  context.assert(xRouter && xRouter.performanceProfile.criticalMeasurements.includes('xtend.route.navigate'), 'x-router derives route navigate performance measurement');
  context.assert(xRouter && xRouter.performanceProfile.criticalMeasurements.includes('xtend.route.render'), 'x-router derives route render performance measurement');
  context.assert(xTabs && !xTabs.remediation.includes('performance-profile-authoring'), 'x-tabs no longer requires performance profile authoring after WP-E12-02');
  context.assert(xTabs && xTabs.performanceProfile.lane === 'user-blocking', 'x-tabs derives user-blocking performance lane');
  context.assert(xSelect && xSelect.tier === 'p0-browser-critical', 'x-select enters P0 browser-critical wave');
  context.assert(xSelect && xSelect.browserSmokes.includes('input-sync'), 'x-select inherits form browser smokes');
  context.assert(xSelect && xSelect.browserSmokes.includes('keyboard-activation'), 'x-select inherits interactive browser smokes');
  context.assert(xTextarea && xTextarea.tier === 'p0-browser-critical', 'x-textarea enters P0 browser-critical wave');
  context.assert(xTextarea && xTextarea.browserSmokes.includes('validation-feedback'), 'x-textarea inherits validation browser smokes');
  context.assert(xStatus && xStatus.tier === 'p1-visual-performance', 'x-status enters P1 visual/performance wave');
  context.assert(xStatus && xStatus.browserSmokes.includes('live-region'), 'x-status plans live-region browser smoke');
  context.assert(xProgress && xProgress.tier === 'p1-visual-performance', 'x-progress enters P1 visual/performance wave');
  context.assert(xProgress && xProgress.browserSmokes.includes('live-region'), 'x-progress plans live-region browser smoke');
  context.assert(xTooltip && xTooltip.tier === 'p0-browser-critical', 'x-tooltip enters P0 browser-critical wave');
  context.assert(xTooltip && xTooltip.browserSmokes.includes('escape-close'), 'x-tooltip inherits overlay browser smokes');
  context.assert(xPopover && xPopover.tier === 'p0-browser-critical', 'x-popover enters P0 browser-critical wave');
  context.assert(xPopover && xPopover.browserSmokes.includes('focus-trap'), 'x-popover plans focus-trap browser smoke');
  context.assert(xDrawer && xDrawer.tier === 'p0-browser-critical', 'x-drawer enters P0 browser-critical wave');
  context.assert(xDrawer && xDrawer.browserSmokes.includes('rmt-route-adapter'), 'x-drawer inherits routing browser smoke');
  context.assert(xModal && xModal.browserSmokes.includes('focus-trap'), 'x-modal plans focus-trap browser smoke');
  context.assert(xModal && xModal.visualStates.includes('focus-trapped'), 'x-modal plans focus-trapped visual state');
  context.assert(xTheme && !xTheme.remediation.includes('a11y-profile-remediation'), 'x-theme A11y remediation is closed by WP-E12-04');
  context.assert(xTheme && !xTheme.remediation.includes('performance-profile-authoring'), 'x-theme performance profile authoring is closed by WP-E12-05');
  context.assert(xTheme && xTheme.catalogStatus === 'enterprise-ready', 'x-theme remains enterprise-ready with bilingual public docs coverage');
  context.assert(xTheme && xTheme.browserSmokes.includes('theme-switch'), 'x-theme plans theme-switch browser smoke');
  context.assert(xButton && !xButton.remediation.includes('performance-profile-authoring'), 'x-button performance profile authoring is closed by WP-E12-06');
  context.assert(xButton && xButton.catalogStatus === 'enterprise-ready', 'x-button remains enterprise-ready with bilingual public docs coverage');
  context.assert(xButton && xButton.browserSmokes.includes('keyboard-activation'), 'x-button keeps interactive keyboard smoke');
  context.assert(xIcon && xIcon.catalogStatus === 'enterprise-ready', 'x-icon remains enterprise-ready as iconography adapter');
  context.assert(xIcon && xIcon.visualStates.includes('default-layout'), 'x-icon inherits display visual state');
  context.assert(xIcon && !xIcon.remediation.includes('performance-profile-authoring'), 'x-icon performance profile authoring is closed at introduction');
  context.assert(xMenu && !xMenu.remediation.includes('performance-profile-authoring'), 'x-menu performance profile authoring is closed by WP-E12-07');
  context.assert(xMenu && xMenu.catalogStatus === 'enterprise-ready', 'x-menu remains enterprise-ready with bilingual public docs coverage');
  context.assert(xMenu && xMenu.browserSmokes.includes('keyboard-activation'), 'x-menu keeps interactive keyboard smoke');
  context.assert(xWriter && !xWriter.remediation.includes('a11y-profile-remediation'), 'x-writer A11y remediation is closed by WP-E11-08');
  context.assert(xWriter && xWriter.tier === 'p0-browser-critical', 'x-writer remains P0 because it is form/stateful');
  context.assert(xState && xState.catalogStatus === 'contract-gated', 'state remains contract-gated as a boundary probe with bilingual docs coverage');
  context.assert(xState && xState.remediation.includes('a11y-profile-remediation'), 'state keeps A11y remediation visible after WP-E12-08');
  context.assert(xState && xState.remediation.includes('performance-profile-authoring'), 'state keeps performance authoring visible after WP-E12-08');
  context.assert(xState && !xState.remediation.includes('public-types-long-tail'), 'state public types are closed after WP-E12-08');
  context.assert(xState && !xState.remediation.includes('long-tail-component-suite-and-fixture'), 'state suite and fixture are closed after WP-E12-08');
  context.assert(xUtils && xUtils.tier === 'p1-visual-performance', 'x-utils is promoted by typed bilingual docs coverage while keeping utility remediation visible');
  context.assert(xUtils && xUtils.browserSmokes.includes('utility-integration-probe'), 'x-utils plans utility integration probe');
  context.assert(xUtils && xUtils.remediation.includes('non-custom-element-integration-probe'), 'x-utils records non-custom-element probe need');
  context.assert(xUtils && xUtils.remediation.includes('performance-profile-authoring'), 'x-utils keeps performance authoring visible after WP-E12-09');
  context.assert(xUtils && !xUtils.remediation.includes('public-types-long-tail'), 'x-utils public types are closed after WP-E12-09');
  context.assert(xUtils && !xUtils.remediation.includes('long-tail-component-suite-and-fixture'), 'x-utils suite and fixture are closed after WP-E12-09');
  context.assert(xtendI18n && xtendI18n.priority === 'P2', 'xtend-i18n remains an infrastructure long-tail priority');
  context.assert(xtendI18n && xtendI18n.browserSmokes.includes('state-api-integration'), 'xtend-i18n plans infrastructure integration coverage');
  context.assert(xtendI18n && xtendI18n.remediation.includes('performance-profile-authoring'), 'xtend-i18n keeps performance authoring visible');

  context.assert((packageManifest.exports['./catalog/component-regression-priority'] === './catalog/component-regression-priority.js' || (packageManifest.exports['./catalog/component-regression-priority'] && packageManifest.exports['./catalog/component-regression-priority'].default === './catalog/component-regression-priority.js')), 'Package exports regression priority module');
  context.assert(packageManifest.scripts['test:regression-priority'] === 'node scripts/run_xtend_tests.js regression-priority', 'Package exposes regression priority test script');
  context.assert(packageManifest.xtend.componentRegressionPriority.schema === COMPONENT_REGRESSION_PRIORITY_SCHEMA, 'Package metadata exposes regression priority schema');
  context.assert(packageManifest.xtend.componentRegressionPriority.localGate === 'node scripts/run_xtend_tests.js regression-priority --json', 'Package metadata exposes regression priority gate');
  context.assert(roadmap.includes('| `ER-WP-35` | P2 | completed | Phase 4 | EPIC 09 | visuelle und browsernahe Regression priorisieren |'), 'Roadmap marks ER-WP-35 completed');
  context.assert(roadmap.includes('| `ER-WP-36` | P0 | completed | Phase 4 | EPIC 09 | CI Workflow fuer Default Gates anlegen |'), 'Roadmap marks ER-WP-36 completed');
  context.assert(roadmap.includes('| `ER-WP-37` | P1 | completed | Phase 4 | EPIC 09 | schnelle PR-Gates und volle Release-Gates trennen |'), 'Roadmap marks ER-WP-37 completed');
  context.assert(roadmap.includes('| `ER-WP-38` | P1 | completed | Phase 4 | EPIC 09 | Release Checklist und SemVer Policy schreiben |'), 'Roadmap marks ER-WP-38 completed');
  context.assert(roadmap.includes('| `ER-WP-39` | P1 | completed | Phase 4 | EPIC 09 | Enterprise Adoption Guide schreiben |'), 'Roadmap marks ER-WP-39 completed');
  context.assert(roadmap.includes('| `ER-WP-40` | P2 | completed | Phase 4 | EPIC 09 | Docs-App mit RMT Parsedown Scheduling pilotieren |'), 'Roadmap marks ER-WP-40 completed');
  context.assert(contractDoc.includes(COMPONENT_REGRESSION_PRIORITY_SCHEMA), 'Contract document declares regression priority plan schema');
  context.assert(contractDoc.includes('P0 browser-critical regression baseline'), 'Contract document describes P0 browser-critical wave');
  context.assert(contractDoc.includes('x-router'), 'Contract document includes x-router priority');
  context.assert(contractDoc.includes('x-utils'), 'Contract document includes x-utils long-tail priority');
  context.assert(developerDocs.includes('node scripts/run_xtend_tests.js regression-priority visual-snapshots --json'), 'Developer docs document the runnable regression gate');
  context.assert(developerDocs.includes('tests/browser/visual_snapshots_suite.js'), 'Developer docs identify the visual snapshot runner');
  context.assert(developerDocs.includes('desktop-1280'), 'Developer docs document desktop viewport');
  context.assert(developerDocs.includes('mobile-390'), 'Developer docs document mobile viewport');

  return context.result({
    plan,
    gate
  });
}

function printComponentRegressionPriorityReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Visual/Browser Regression Priority Plan erfolgreich.',
    failureTitle: 'XTend Visual/Browser Regression Priority Plan fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runComponentRegressionPrioritySuite();
  printComponentRegressionPriorityReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printComponentRegressionPriorityReport,
  runComponentRegressionPrioritySuite
};

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
  COMPONENT_CATALOG_COVERAGE_SCHEMA,
  COMPONENT_CATALOG_ENTRY_SCHEMA,
  COMPONENT_CATALOG_GATE_SCHEMA,
  COVERAGE_DIMENSIONS,
  STATUS_LABELS,
  createComponentCatalogCoverageGate,
  createComponentCatalogCoverageReport,
  createMarkdownMatrix,
  validateComponentCatalogCoverageReport
} = require('../../catalog/component-catalog-coverage');

function findEntry(report, tag) {
  return report.entries.find((entry) => entry.tag === tag);
}

function runComponentCatalogCoverageSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'catalog-coverage',
    label: 'XTend Component Catalog Coverage Matrix'
  });
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const manifest = readJson('components/manifest.json', rootDir);
  const moduleSource = readText('catalog/component-catalog-coverage.js', rootDir);
  const roadmap = readText('development/ROADMAP-XTend-Enterprise-Reife.md', rootDir);
  const contractDoc = readText('development/XTend-Component-Catalog-Coverage-Matrix.md', rootDir);
  const namingDoc = readText('development/XTend-Component-Catalog-Naming-Konvention.md', rootDir);
  const developerDocs = contractDoc;
  const publicTypesDocs = readText('docs/en/public-component-types.md', rootDir);
  const regressionDocs = readText('docs/en/visual-browser-regression.md', rootDir);
  const xSummaryDocs = readText('docs/components/xsummary.md', rootDir);
  const xUtilsDocs = readText('docs/components/xutils.md', rootDir);
  const moduleSyntax = syntaxCheckFile('catalog/component-catalog-coverage.js', { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile('tests/catalog/component_catalog_coverage_suite.js', { rootDir, extension: '.js' });
  const report = createComponentCatalogCoverageReport({ rootDir });
  const validation = validateComponentCatalogCoverageReport(report);
  const gate = createComponentCatalogCoverageGate({ rootDir });
  const matrix = createMarkdownMatrix(report);
  const manifestTags = Object.keys(manifest);
  const xAlert = findEntry(report, 'x-alert');
  const xToast = findEntry(report, 'x-toast');
  const xSpinner = findEntry(report, 'x-spinner');
  const xTabs = findEntry(report, 'x-tabs');
  const xButton = findEntry(report, 'x-button');
  const xIcon = findEntry(report, 'x-icon');
  const xMenu = findEntry(report, 'x-menu');
  const xRouter = findEntry(report, 'x-router');
  const xInput = findEntry(report, 'x-input');
  const xSelect = findEntry(report, 'x-select');
  const xCheckbox = findEntry(report, 'x-checkbox');
  const xToggle = findEntry(report, 'x-toggle');
  const xRadio = findEntry(report, 'x-radio');
  const xRmtLifecycleDemoBuild = findEntry(report, 'x-rmt-lifecycle-demo-build');
  const xTextarea = findEntry(report, 'x-textarea');
  const xStatus = findEntry(report, 'x-status');
  const xProgress = findEntry(report, 'x-progress');
  const xTooltip = findEntry(report, 'x-tooltip');
  const xPopover = findEntry(report, 'x-popover');
  const xDrawer = findEntry(report, 'x-drawer');
  const xSurfaceManager = findEntry(report, 'x-surface-manager');
  const xSurfaceWindow = findEntry(report, 'x-surface-window');
  const xSidePanel = findEntry(report, 'x-side-panel');
  const xModal = findEntry(report, 'x-modal');
  const xDialog = findEntry(report, 'x-dialog');
  const xLightbox = findEntry(report, 'x-lightbox');
  const xMasonry = findEntry(report, 'x-masonry');
  const xCode = findEntry(report, 'x-code');
  const xHeader = findEntry(report, 'x-header');
  const xFooter = findEntry(report, 'x-footer');
  const xHero = findEntry(report, 'x-hero');
  const xType = findEntry(report, 'x-type');
  const xForm = findEntry(report, 'x-form');
  const xCalendar = findEntry(report, 'x-calendar');
  const xWriter = findEntry(report, 'x-writer');
  const xLink = findEntry(report, 'x-link');
  const xSummary = findEntry(report, 'x-summary');
  const xSection = findEntry(report, 'x-section');
  const xCards = findEntry(report, 'x-cards');
  const xPlayer = findEntry(report, 'x-player');
  const xState = findEntry(report, 'xtend-state');
  const xUtils = findEntry(report, 'x-utils');
  const xtendI18n = findEntry(report, 'xtend-i18n');
  const expectedManifestCount = manifestTags.length;

  context.assert(moduleSyntax.ok, `Component catalog coverage module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Component catalog coverage suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);
  context.assertIncludes(moduleSource, COMPONENT_CATALOG_COVERAGE_SCHEMA, 'Module declares coverage matrix schema');
  context.assertIncludes(moduleSource, COMPONENT_CATALOG_ENTRY_SCHEMA, 'Module declares coverage entry schema');
  context.assertIncludes(moduleSource, COMPONENT_CATALOG_GATE_SCHEMA, 'Module declares coverage gate schema');
  context.assertIncludes(moduleSource, 'EXPECTED_PROFILES_BY_TAG', 'Module defines expected component profiles by manifest tag');
  context.assertIncludes(moduleSource, 'missingByDimension', 'Module exposes missing coverage by dimension');
  context.assert(COMPONENT_CATALOG_COVERAGE_SCHEMA === 'xtend.catalog.component-coverage-matrix.v1', 'Exports coverage matrix schema');
  context.assert(COMPONENT_CATALOG_ENTRY_SCHEMA === 'xtend.catalog.component-coverage-entry.v1', 'Exports coverage entry schema');
  context.assert(COMPONENT_CATALOG_GATE_SCHEMA === 'xtend.catalog.component-coverage-gate.v1', 'Exports coverage gate schema');
  context.assert(COVERAGE_DIMENSIONS.includes('performance'), 'Coverage dimensions include performance');
  context.assert(COVERAGE_DIMENSIONS.includes('a11y'), 'Coverage dimensions include a11y');
  context.assert(STATUS_LABELS.contractGated === 'contract-gated', 'Status labels expose contract-gated state');

  context.assert(report.schema === COMPONENT_CATALOG_COVERAGE_SCHEMA, 'Report exposes coverage matrix schema');
  context.assert(report.entries.length === manifestTags.length, 'Report contains every component manifest entry');
  context.assert(report.summary.manifestEntries === expectedManifestCount, `Current component catalog contains ${expectedManifestCount} manifest entries`);
  context.assert(report.entries.every((entry) => manifestTags.includes(entry.tag)), 'Every report entry maps to a manifest tag');
  context.assert(report.entries.every((entry) => entry.schema === COMPONENT_CATALOG_ENTRY_SCHEMA), 'Every report entry carries the entry schema');
  context.assert(report.entries.every((entry) => entry.coverage.source === true), 'Every manifest source resolves to a local component file');
  context.assert(report.summary.byDimension.source.covered === expectedManifestCount, 'Source coverage is complete for the manifest');
  context.assert(report.summary.byDimension.docs.covered === expectedManifestCount, 'Docs coverage is complete for the current manifest');
  context.assert(report.summary.byDimension.componentSuite.covered === expectedManifestCount, 'Component-suite coverage is complete after infrastructure boundary suites');
  context.assert(report.summary.byDimension.fixture.covered === expectedManifestCount, 'Fixture coverage is complete after infrastructure boundary fixtures');
  context.assert(report.summary.byDimension.types.covered === expectedManifestCount, 'Type coverage is complete after infrastructure boundary type artifacts');
  context.assert(report.summary.byDimension.performance.missing === 3, 'Performance coverage gap is explicit for the remaining infrastructure/control catalog');
  context.assert(!report.summary.missingByDimension.docs, 'Docs gap is closed for every manifest component');
  context.assert(!report.summary.missingByDimension.types, 'Type gap is closed after WP-E12-09');
  context.assert(!report.summary.missingByDimension.componentSuite, 'Component-suite gap is closed after WP-E12-09');
  context.assert(!report.summary.missingByDimension.fixture, 'Fixture gap is closed after WP-E12-09');
  context.assert(!report.summary.missingByDimension.performance.includes('x-router'), 'Performance gap no longer includes x-router after WP-E11-10');
  context.assert(!report.summary.missingByDimension.performance.includes('x-modal'), 'Performance gap no longer includes x-modal after WP-E11-11');
  context.assert(!report.summary.missingByDimension.performance.includes('x-dialog'), 'Performance gap no longer includes x-dialog after WP-E11-11');
  context.assert(!report.summary.missingByDimension.performance.includes('x-summary'), 'Performance gap no longer includes x-summary after WP-E11-12');
  context.assert(!report.summary.missingByDimension.performance.includes('x-lightbox'), 'Performance gap no longer includes x-lightbox after WP-E11-12');
  context.assert(!report.summary.missingByDimension.performance.includes('x-player'), 'Performance gap no longer includes x-player after WP-E11-12');
  context.assert(!report.summary.missingByDimension.performance.includes('x-tabs'), 'Performance gap no longer includes x-tabs after WP-E12-02');
  context.assert(!report.summary.missingByDimension.performance.includes('x-theme'), 'Performance gap no longer includes x-theme after WP-E12-05');
  context.assert(!report.summary.missingByDimension.performance.includes('x-button'), 'Performance gap no longer includes x-button after WP-E12-06');
  context.assert(!report.summary.missingByDimension.performance.includes('x-menu'), 'Performance gap no longer includes x-menu after WP-E12-07');
  context.assert(!report.summary.missingByDimension.types, 'Type gap no longer includes any component after WP-E12-09');

  context.assert(validation.ok === true, 'Coverage report validates for current manifest sources');
  context.assert(gate.ok === true, 'Coverage gate passes because open dimensions are warnings, not source failures');
  context.assert(gate.warnings.length >= 2, 'Coverage gate exposes non-blocking warnings for open hardening dimensions');
  context.assert(gate.report.handoff.naming === 'ER-WP-32', 'Gate keeps naming/docs handoff history visible');
  context.assert(gate.report.handoff.componentSuites === 'ER-WP-33', 'Gate hands component-suite gaps to ER-WP-33');
  context.assert(gate.report.handoff.types === 'ER-WP-34', 'Gate hands type gaps to ER-WP-34');
  context.assert(gate.report.handoff.visualRegression === 'ER-WP-35', 'Gate hands visual regression to ER-WP-35');

  context.assert(xAlert && xAlert.status === 'enterprise-ready', 'x-alert is enterprise-ready after WP-E11-09');
  context.assert(xAlert && xAlert.coverage.componentSuite === true && xAlert.coverage.fixture === true, 'x-alert has component suite and fixture coverage');
  context.assert(xAlert && xAlert.coverage.performance === true, 'x-alert has explicit performance profile');
  context.assert(xToast && xToast.status === 'enterprise-ready', 'x-toast is enterprise-ready after WP-E11-09');
  context.assert(xToast && xToast.coverage.performance === true, 'x-toast has explicit performance profile');
  context.assert(xSpinner && xSpinner.status === 'enterprise-ready', 'x-spinner is enterprise-ready after WP-E11-09');
  context.assert(xSpinner && xSpinner.coverage.performance === true, 'x-spinner has explicit performance profile');
  context.assert(xTabs && xTabs.status === 'enterprise-ready', 'x-tabs is enterprise-ready after WP-E12-02');
  context.assert(xTabs && xTabs.coverage.performance === true, 'x-tabs has explicit performance profile');
  const xTheme = findEntry(report, 'x-theme');
  context.assert(xTheme && xTheme.status === 'enterprise-ready', 'x-theme is enterprise-ready after WP-E12-05');
  context.assert(xTheme && xTheme.coverage.performance === true, 'x-theme has explicit performance profile');
  context.assert(xButton && xButton.status === 'enterprise-ready', 'x-button is enterprise-ready after WP-E12-06');
  context.assert(xButton && xButton.coverage.performance === true, 'x-button has explicit performance profile');
  context.assert(xIcon && xIcon.status === 'enterprise-ready', 'x-icon is enterprise-ready as local iconography adapter');
  context.assert(xIcon && xIcon.coverage.performance === true, 'x-icon has explicit performance profile');
  context.assert(xIcon && xIcon.profiles.includes('iconography'), 'x-icon is classified as iconography');
  context.assert(xMenu && xMenu.status === 'enterprise-ready', 'x-menu is enterprise-ready after WP-E12-07');
  context.assert(xMenu && xMenu.coverage.performance === true, 'x-menu has explicit performance profile');
  context.assert(xRouter && xRouter.status === 'enterprise-ready', 'x-router is enterprise-ready after WP-E11-10');
  context.assert(xRouter && xRouter.coverage.componentSuite === true && xRouter.coverage.fixture === true, 'x-router has component suite and fixture coverage');
  context.assert(xRouter && xRouter.coverage.types === true, 'x-router keeps its public type artifact visible');
  context.assert(xRouter && xRouter.coverage.performance === true, 'x-router has explicit performance profile');
  context.assert(xInput && xInput.status === 'enterprise-ready', 'x-input is enterprise-ready after WP-E11-08');
  context.assert(xInput && xInput.coverage.performance === true, 'x-input has explicit performance profile');
  context.assert(xSelect && xSelect.status === 'enterprise-ready', 'x-select is enterprise-ready after WP-E10-09');
  context.assert(xSelect && xSelect.coverage.performance === true, 'x-select has explicit performance profile');
  context.assert(xCheckbox && xCheckbox.status === 'enterprise-ready', 'x-checkbox is enterprise-ready after WP-E10-09');
  context.assert(xCheckbox && xCheckbox.coverage.performance === true, 'x-checkbox has explicit performance profile');
  context.assert(xToggle && xToggle.status === 'enterprise-ready', 'x-toggle is enterprise-ready as a TypeScript-first form switch');
  context.assert(xToggle && xToggle.coverage.performance === true, 'x-toggle has explicit performance profile');
  context.assert(xToggle && xToggle.profiles.includes('stateful'), 'x-toggle is classified as stateful');
  context.assert(xRadio && xRadio.status === 'enterprise-ready', 'x-radio is enterprise-ready after WP-E10-09');
  context.assert(xRadio && xRadio.coverage.performance === true, 'x-radio has explicit performance profile');
  context.assert(xRmtLifecycleDemoBuild && xRmtLifecycleDemoBuild.status === 'enterprise-ready', 'x-rmt-lifecycle-demo-build is enterprise-ready after RC1 test build coverage closure');
  context.assert(xRmtLifecycleDemoBuild && xRmtLifecycleDemoBuild.coverage.componentSuite === true && xRmtLifecycleDemoBuild.coverage.fixture === true, 'x-rmt-lifecycle-demo-build has component suite and fixture coverage');
  context.assert(xRmtLifecycleDemoBuild && xRmtLifecycleDemoBuild.coverage.types === true, 'x-rmt-lifecycle-demo-build has public type coverage');
  context.assert(xRmtLifecycleDemoBuild && xRmtLifecycleDemoBuild.coverage.performance === true, 'x-rmt-lifecycle-demo-build has explicit scaffold performance profile');
  context.assert(xTextarea && xTextarea.status === 'enterprise-ready', 'x-textarea is enterprise-ready after WP-E10-10');
  context.assert(xTextarea && xTextarea.coverage.performance === true, 'x-textarea has explicit performance profile');
  context.assert(xStatus && xStatus.status === 'enterprise-ready', 'x-status is enterprise-ready after WP-E10-10');
  context.assert(xStatus && xStatus.coverage.performance === true, 'x-status has explicit performance profile');
  context.assert(xProgress && xProgress.status === 'enterprise-ready', 'x-progress is enterprise-ready after WP-E10-10');
  context.assert(xProgress && xProgress.coverage.performance === true, 'x-progress has explicit performance profile');
  context.assert(xTooltip && xTooltip.status === 'enterprise-ready', 'x-tooltip is enterprise-ready after WP-E10-11');
  context.assert(xTooltip && xTooltip.coverage.performance === true, 'x-tooltip has explicit performance profile');
  context.assert(xPopover && xPopover.status === 'enterprise-ready', 'x-popover is enterprise-ready after WP-E10-11');
  context.assert(xPopover && xPopover.coverage.performance === true, 'x-popover has explicit performance profile');
  context.assert(xDrawer && xDrawer.status === 'enterprise-ready', 'x-drawer is enterprise-ready after WP-E10-11');
  context.assert(xDrawer && xDrawer.coverage.performance === true, 'x-drawer has explicit performance profile');
  context.assert(xSurfaceManager && xSurfaceManager.status === 'enterprise-ready', 'x-surface-manager is enterprise-ready after WP-SM-03');
  context.assert(xSurfaceManager && xSurfaceManager.coverage.performance === true, 'x-surface-manager has explicit performance profile');
  context.assert(xSurfaceManager && xSurfaceManager.profiles.includes('stateful'), 'x-surface-manager is classified as stateful');
  context.assert(xSurfaceWindow && xSurfaceWindow.status === 'enterprise-ready', 'x-surface-window is enterprise-ready after WP-SM-03');
  context.assert(xSurfaceWindow && xSurfaceWindow.coverage.performance === true, 'x-surface-window has explicit performance profile');
  context.assert(xSurfaceWindow && xSurfaceWindow.profiles.includes('interactive'), 'x-surface-window is classified as interactive');
  context.assert(xSidePanel && xSidePanel.status === 'enterprise-ready', 'x-side-panel is enterprise-ready after WP-SM-04');
  context.assert(xSidePanel && xSidePanel.coverage.performance === true, 'x-side-panel has explicit performance profile');
  context.assert(xSidePanel && xSidePanel.profiles.includes('stateful'), 'x-side-panel is classified as stateful');
  context.assert(xModal && xModal.status === 'enterprise-ready', 'x-modal is enterprise-ready after WP-E11-11');
  context.assert(xModal && xModal.coverage.performance === true, 'x-modal has explicit performance profile');
  context.assert(xDialog && xDialog.status === 'enterprise-ready', 'x-dialog is enterprise-ready after WP-E11-11');
  context.assert(xDialog && xDialog.coverage.performance === true, 'x-dialog has explicit performance profile');
  context.assert(xLightbox && xLightbox.status === 'enterprise-ready', 'x-lightbox is enterprise-ready after WP-E11-12');
  context.assert(xLightbox && xLightbox.coverage.performance === true, 'x-lightbox has explicit performance profile');
  context.assert(xMasonry && xMasonry.status === 'enterprise-ready', 'x-masonry is enterprise-ready after WP-E11-12');
  context.assert(xMasonry && xMasonry.coverage.performance === true, 'x-masonry has explicit performance profile');
  context.assert(xCode && xCode.status === 'enterprise-ready', 'x-code is enterprise-ready after WP-E11-12');
  context.assert(xCode && xCode.coverage.performance === true, 'x-code has explicit performance profile');
  context.assert(xHeader && xHeader.status === 'enterprise-ready', 'x-header is enterprise-ready after WP-E11-12');
  context.assert(xHeader && xHeader.coverage.performance === true, 'x-header has explicit performance profile');
  context.assert(xFooter && xFooter.status === 'enterprise-ready', 'x-footer is enterprise-ready after WP-E11-12');
  context.assert(xFooter && xFooter.coverage.performance === true, 'x-footer has explicit performance profile');
  context.assert(xHero && xHero.status === 'enterprise-ready', 'x-hero is enterprise-ready after WP-E11-12');
  context.assert(xHero && xHero.coverage.performance === true, 'x-hero has explicit performance profile');
  context.assert(xType && xType.status === 'enterprise-ready', 'x-type is enterprise-ready after WP-E11-12');
  context.assert(xType && xType.coverage.performance === true, 'x-type has explicit performance profile');
  context.assert(xForm && xForm.status === 'enterprise-ready', 'x-form is enterprise-ready after WP-E11-08');
  context.assert(xForm && xForm.coverage.performance === true, 'x-form has explicit performance profile');
  context.assert(xCalendar && xCalendar.status === 'enterprise-ready', 'x-calendar is enterprise-ready after WP-E11-08');
  context.assert(xCalendar && xCalendar.coverage.performance === true, 'x-calendar has explicit performance profile');
  context.assert(xWriter && xWriter.status === 'enterprise-ready', 'x-writer is enterprise-ready after WP-E11-08');
  context.assert(xWriter && xWriter.coverage.performance === true, 'x-writer has explicit performance profile');
  context.assert(xLink && xLink.status === 'enterprise-ready', 'x-link is enterprise-ready after WP-E11-10');
  context.assert(xLink && xLink.coverage.performance === true, 'x-link has explicit performance profile');
  context.assert(xSummary && xSummary.status === 'enterprise-ready', 'x-summary is enterprise-ready after WP-E11-12');
  context.assert(xSummary && xSummary.coverage.componentSuite === true && xSummary.coverage.fixture === true, 'x-summary has component suite and fixture coverage');
  context.assert(xSummary && xSummary.coverage.performance === true, 'x-summary has explicit performance profile');
  context.assert(xSection && xSection.status === 'enterprise-ready', 'x-section is enterprise-ready after WP-E11-12');
  context.assert(xSection && xSection.coverage.componentSuite === true && xSection.coverage.fixture === true, 'x-section has component suite and fixture coverage');
  context.assert(xCards && xCards.status === 'enterprise-ready', 'x-cards is enterprise-ready after WP-E11-12');
  context.assert(xCards && xCards.coverage.componentSuite === true && xCards.coverage.fixture === true, 'x-cards has component suite and fixture coverage');
  context.assert(xPlayer && xPlayer.status === 'enterprise-ready', 'x-player is enterprise-ready after WP-E11-12');
  context.assert(xPlayer && xPlayer.coverage.performance === true, 'x-player has explicit performance profile');
  context.assert(xState && xState.status === 'contract-gated', 'state is contract-gated as a non-visual boundary probe after WP-E12-08');
  context.assert(xState && xState.coverage.componentSuite === true && xState.coverage.fixture === true, 'state has boundary suite and fixture coverage after WP-E12-08');
  context.assert(xState && xState.coverage.types === true, 'state has public type coverage after WP-E12-08');
  context.assert(xState && xState.customElement === false, 'state remains a non-custom-element boundary');
  context.assert(xUtils && xUtils.status === 'typed-contract-gated', 'x-utils is typed-contract-gated after WP-E12-09');
  context.assert(xUtils && xUtils.coverage.componentSuite === true && xUtils.coverage.fixture === true, 'x-utils has utility suite and fixture coverage after WP-E12-09');
  context.assert(xUtils && xUtils.coverage.types === true, 'x-utils has public type coverage after WP-E12-09');
  context.assert(xUtils && xUtils.coverage.performance === false, 'x-utils keeps performance profile handoff visible after WP-E12-09');
  context.assert(xtendI18n && xtendI18n.status === 'typed-contract-gated', 'xtend-i18n is typed-contract-gated as a non-visual infrastructure boundary');
  context.assert(xtendI18n && xtendI18n.profiles.includes('infrastructure'), 'xtend-i18n is classified as infrastructure');
  context.assert(xtendI18n && xtendI18n.customElement === false, 'xtend-i18n remains a non-custom-element boundary');
  context.assert(matrix.includes('| `x-alert` | `feedback, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-alert enterprise-ready row');
  context.assert(matrix.includes('| `x-router` | `routing` | `enterprise-ready` |'), 'Markdown matrix includes x-router enterprise-ready row');
  context.assert(matrix.includes('| `x-link` | `routing, interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-link enterprise-ready row');
  context.assert(matrix.includes('| `x-menu` | `interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-menu enterprise-ready row');
  context.assert(matrix.includes('| `x-icon` | `display, iconography` | `enterprise-ready` |'), 'Markdown matrix includes x-icon enterprise-ready row');
  context.assert(matrix.includes('| `x-input` | `form` | `enterprise-ready` |'), 'Markdown matrix includes x-input enterprise-ready row');
  context.assert(matrix.includes('| `x-select` | `form, interactive, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-select enterprise-ready row');
  context.assert(matrix.includes('| `x-checkbox` | `form, interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-checkbox enterprise-ready row');
  context.assert(matrix.includes('| `x-toggle` | `form, interactive, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-toggle enterprise-ready row');
  context.assert(matrix.includes('| `x-radio` | `form, interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-radio enterprise-ready row');
  context.assert(matrix.includes('| `x-rmt-lifecycle-demo-build` | `display, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-rmt-lifecycle-demo-build enterprise-ready row');
  context.assert(matrix.includes('| `x-textarea` | `form, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-textarea enterprise-ready row');
  context.assert(matrix.includes('| `x-status` | `feedback, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-status enterprise-ready row');
  context.assert(matrix.includes('| `x-progress` | `feedback, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-progress enterprise-ready row');
  context.assert(matrix.includes('| `x-tooltip` | `overlay, feedback` | `enterprise-ready` |'), 'Markdown matrix includes x-tooltip enterprise-ready row');
  context.assert(matrix.includes('| `x-popover` | `overlay, interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-popover enterprise-ready row');
  context.assert(matrix.includes('| `x-drawer` | `overlay, routing` | `enterprise-ready` |'), 'Markdown matrix includes x-drawer enterprise-ready row');
  context.assert(matrix.includes('| `x-surface-manager` | `overlay, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-surface-manager enterprise-ready row');
  context.assert(matrix.includes('| `x-surface-portal` | `overlay, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-surface-portal enterprise-ready row');
  context.assert(matrix.includes('| `x-surface-region` | `display, stateful` | `enterprise-ready` |'), 'Markdown matrix includes x-surface-region enterprise-ready row');
  context.assert(matrix.includes('| `x-surface-window` | `overlay, interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-surface-window enterprise-ready row');
  context.assert(matrix.includes('| `x-side-panel` | `overlay, stateful, interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-side-panel enterprise-ready row');
  context.assert(matrix.includes('| `x-modal` | `overlay` | `enterprise-ready` |'), 'Markdown matrix includes x-modal enterprise-ready row');
  context.assert(matrix.includes('| `x-dialog` | `overlay` | `enterprise-ready` |'), 'Markdown matrix includes x-dialog enterprise-ready row');
  context.assert(matrix.includes('| `x-section` | `display` | `enterprise-ready` |'), 'Markdown matrix includes x-section enterprise-ready row');
  context.assert(matrix.includes('| `x-cards` | `display` | `enterprise-ready` |'), 'Markdown matrix includes x-cards enterprise-ready row');
  context.assert(matrix.includes('| `x-player` | `media, interactive` | `enterprise-ready` |'), 'Markdown matrix includes x-player enterprise-ready row');
  context.assert(matrix.includes('| `x-utils` | `utility` | `typed-contract-gated` |'), 'Markdown matrix includes x-utils typed-contract-gated row');

  context.assert((packageManifest.exports['./catalog/component-catalog-coverage'] === './catalog/component-catalog-coverage.js' || (packageManifest.exports['./catalog/component-catalog-coverage'] && packageManifest.exports['./catalog/component-catalog-coverage'].default === './catalog/component-catalog-coverage.js')), 'Package exports component catalog coverage module');
  context.assert(packageManifest.scripts['test:catalog-coverage'] === 'node scripts/run_xtend_tests.js catalog-coverage', 'Package exposes catalog coverage suite script');
  context.assert(packageManifest.xtend.componentCatalogCoverage.schema === COMPONENT_CATALOG_COVERAGE_SCHEMA, 'Package metadata exposes catalog coverage schema');
  context.assert(packageManifest.xtend.componentCatalogCoverage.localGate === 'node scripts/run_xtend_tests.js catalog-coverage --json', 'Package metadata exposes catalog coverage local gate');
  context.assert(packageManifest.xtend.componentPublicTypes.schema === 'xtend.enterprise.er-wp-34.public-component-types.v1', 'Package metadata exposes component public types schema');
  context.assert(packageManifest.xtend.componentPublicTypes.typedPriorityComponents === expectedManifestCount, 'Package metadata exposes current typed priority component count');
  context.assert(packageManifest.xtend.epic10FormSelectionControls.schema === 'xtend.epic10.form-selection-controls.v1', 'Package metadata exposes WP-E10-09 form selection controls schema');
  context.assert(packageManifest.xtend.epic10FormFeedbackControls.schema === 'xtend.epic10.form-feedback-controls.v1', 'Package metadata exposes WP-E10-10 form feedback controls schema');
  context.assert(packageManifest.xtend.epic10OverlayNavigationControls.schema === 'xtend.epic10.overlay-navigation-controls.v1', 'Package metadata exposes WP-E10-11 overlay navigation controls schema');
  context.assert((packageManifest.exports['./catalog/component-regression-priority'] === './catalog/component-regression-priority.js' || (packageManifest.exports['./catalog/component-regression-priority'] && packageManifest.exports['./catalog/component-regression-priority'].default === './catalog/component-regression-priority.js')), 'Package exports regression priority module');
  context.assert(packageManifest.scripts['test:regression-priority'] === 'node scripts/run_xtend_tests.js regression-priority', 'Package exposes regression priority script');
  context.assert(packageManifest.xtend.componentRegressionPriority.schema === 'xtend.catalog.component-regression-priority-plan.v1', 'Package metadata exposes regression priority schema');
  context.assert(roadmap.includes('| `ER-WP-31` | P0 | completed | Phase 4 | EPIC 09 | Component Catalog Coverage Matrix erzeugen |'), 'Roadmap marks ER-WP-31 completed');
  context.assert(roadmap.includes('| `ER-WP-32` | P0 | completed | Phase 4 | EPIC 09 | Naming- und Doku-Luecken im Component Catalog schliessen |'), 'Roadmap marks ER-WP-32 completed');
  context.assert(roadmap.includes('| `ER-WP-33` | P1 | completed | Phase 4 | EPIC 09 | Component-Level-Suites fuer priorisierte Komponenten nachziehen |'), 'Roadmap marks ER-WP-33 completed');
  context.assert(roadmap.includes('| `ER-WP-34` | P1 | completed | Phase 4 | EPIC 09 | Types und Public Event Contracts vervollstaendigen |'), 'Roadmap marks ER-WP-34 completed');
  context.assert(roadmap.includes('| `ER-WP-35` | P2 | completed | Phase 4 | EPIC 09 | visuelle und browsernahe Regression priorisieren |'), 'Roadmap marks ER-WP-35 completed');
  context.assert(roadmap.includes('| `ER-WP-36` | P0 | completed | Phase 4 | EPIC 09 | CI Workflow fuer Default Gates anlegen |'), 'Roadmap marks ER-WP-36 completed');
  context.assert(roadmap.includes('| `ER-WP-37` | P1 | completed | Phase 4 | EPIC 09 | schnelle PR-Gates und volle Release-Gates trennen |'), 'Roadmap marks ER-WP-37 completed');
  context.assert(roadmap.includes('| `ER-WP-38` | P1 | completed | Phase 4 | EPIC 09 | Release Checklist und SemVer Policy schreiben |'), 'Roadmap marks ER-WP-38 completed');
  context.assert(roadmap.includes('| `ER-WP-39` | P1 | completed | Phase 4 | EPIC 09 | Enterprise Adoption Guide schreiben |'), 'Roadmap marks ER-WP-39 completed');
  context.assert(roadmap.includes('| `ER-WP-40` | P2 | completed | Phase 4 | EPIC 09 | Docs-App mit RMT Parsedown Scheduling pilotieren |'), 'Roadmap marks ER-WP-40 completed');
  context.assert(contractDoc.includes(COMPONENT_CATALOG_COVERAGE_SCHEMA), 'Contract document declares coverage matrix schema');
  context.assert(contractDoc.includes('| `x-summary` | `display, stateful` | `enterprise-ready` |'), 'Contract document contains x-summary enterprise-ready row');
  context.assert(contractDoc.includes('| `x-player` | `media, interactive` | `enterprise-ready` |'), 'Contract document contains x-player enterprise-ready row');
  context.assert(contractDoc.includes('| `x-router` | `routing` | `enterprise-ready` |'), 'Contract document contains x-router enterprise-ready row');
  context.assert(contractDoc.includes('| `x-link` | `routing, interactive` | `enterprise-ready` |'), 'Contract document contains x-link enterprise-ready row');
  context.assert(contractDoc.includes('| `x-icon` | `display, iconography` | `enterprise-ready` |'), 'Contract document contains x-icon enterprise-ready row');
  context.assert(contractDoc.includes('| `x-utils` | `utility` | `typed-contract-gated` |'), 'Contract document contains x-utils typed-contract-gated row');
  context.assert(namingDoc.includes('xtend.catalog.naming-convention.v1'), 'Naming convention document declares contract');
  context.assert(namingDoc.includes('components-xsummary'), 'Naming convention documents x-summary menu slug');
  context.assert(namingDoc.includes('x-utils'), 'Naming convention documents x-utils utility exception');
  context.assert(developerDocs.includes('npm run test:catalog-coverage'), 'Developer docs document package gate');
  context.assert(developerDocs.includes(`| \`docs\` | ${expectedManifestCount} | 0 | 100 |`), 'Developer docs document closed docs coverage');
  context.assert(developerDocs.includes(`${expectedManifestCount} Component-Level-Suites`), 'Developer docs document suite coverage after infrastructure boundary closure');
  context.assert(developerDocs.includes(`| \`types\` | ${expectedManifestCount} | 0 | 100 |`), 'Developer docs document public type coverage after infrastructure boundary closure');
  context.assert(developerDocs.includes('| `ER-WP-34` | abgeschlossen'), 'Developer docs document completed public types handoff');
  context.assert(developerDocs.includes('| `ER-WP-35` | abgeschlossen'), 'Developer docs document completed regression priority handoff');
  context.assert(developerDocs.includes('catalog/component-regression-priority.js'), 'Developer docs link regression priority module');
  context.assert(publicTypesDocs.includes('# Public Component Types'), 'Public types docs expose the canonical guide');
  context.assert(publicTypesDocs.includes('components/<name>.d.ts'), 'Public types docs explain component-local declaration files');
  context.assert(publicTypesDocs.includes('components/xtend-public-types.d.ts'), 'Public types docs document shared type helper');
  context.assert(publicTypesDocs.includes('component-public-types'), 'Public types docs document component public types gate');
  context.assert(regressionDocs.includes('# Visual Browser Regression'), 'Regression docs expose the canonical guide');
  context.assert(regressionDocs.includes('regression-priority'), 'Regression docs document the priority gate');
  context.assert(xSummaryDocs.includes('xsummary-open-<id>'), 'x-summary docs document state key');
  context.assert(xSummaryDocs.includes('aria-expanded'), 'x-summary docs document accessibility state');
  context.assert(xSummaryDocs.includes('xsummary-open-<id>'), 'x-summary docs keep ER-WP-33 suite state key visible');
  context.assert(xUtilsDocs.includes('window.XUtils'), 'x-utils docs document browser utility surface');
  context.assert(xUtilsDocs.includes('focusTrap'), 'x-utils docs document focus helper');
  context.assert(xUtilsDocs.includes('registriert kein `customElements.define()`'), 'x-utils docs document non-custom-element contract');

  return context.result({
    report,
    gate
  });
}

function printComponentCatalogCoverageReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Component Catalog Coverage Matrix erfolgreich.',
    failureTitle: 'XTend Component Catalog Coverage Matrix fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runComponentCatalogCoverageSuite();
  printComponentCatalogCoverageReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printComponentCatalogCoverageReport,
  runComponentCatalogCoverageSuite
};

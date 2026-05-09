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
  COMPONENT_UX_BROWSER_SMOKE_CONTRACT_META,
  COMPONENT_UX_BROWSER_SMOKE_DOC_PATH,
  COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH,
  COMPONENT_UX_BROWSER_SMOKE_FLOWS,
  COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE,
  COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA,
  COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY,
  COMPONENT_UX_BROWSER_SMOKE_SCHEMA,
  COMPONENT_UX_BROWSER_SMOKE_SUITE_PATH,
  COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE,
  COMPONENT_UX_BROWSER_SMOKE_WP_PATH,
  KERNEL_BOUNDARY,
  createComponentUxBrowserSmokeGate,
  createComponentUxBrowserSmokePlan,
  validateComponentUxBrowserSmokePlan
} = require('./component-ux-browser-smoke-plan');

const REQUIRED_MANIFEST_ENTRIES = {
  'x-tabs': '/components/xtabs.js',
  'x-select': '/components/xselect.js',
  'x-checkbox': '/components/xcheckbox.js',
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

function runComponentUxBrowserSmokeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'component-ux-browser-smokes',
    label: 'Epic 11 Component UX browser smokes'
  });
  const plan = createComponentUxBrowserSmokePlan({ rootDir });
  const validation = validateComponentUxBrowserSmokePlan(plan);
  const gate = createComponentUxBrowserSmokeGate({ rootDir, plan });
  const fixture = readText(COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH, rootDir);
  const manifest = readJson('tests/browser/fixtures/components/manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentUxBrowserSmokes;
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const browserReadme = readText('tests/browser/README.md', rootDir);
  const testsReadme = readText('tests/README.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const doc = readText(COMPONENT_UX_BROWSER_SMOKE_DOC_PATH, rootDir);
  const workpackage = readText(COMPONENT_UX_BROWSER_SMOKE_WP_PATH, rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const planSyntax = syntaxCheckFile('tests/browser/component-ux-browser-smoke-plan.js', { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(COMPONENT_UX_BROWSER_SMOKE_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, 'tests/browser/component-ux-browser-smoke-plan.js', rootDir, 'Component UX browser smoke plan exists');
  assertFileExists(context, COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH, rootDir, 'Component UX browser smoke fixture exists');
  assertFileExists(context, COMPONENT_UX_BROWSER_SMOKE_DOC_PATH, rootDir, 'Component UX browser smoke contract document exists');
  assertFileExists(context, COMPONENT_UX_BROWSER_SMOKE_WP_PATH, rootDir, 'WP-E11-14 workpackage document exists');
  assertFileExists(context, COMPONENT_UX_BROWSER_SMOKE_SUITE_PATH, rootDir, 'Component UX browser smoke suite exists');
  context.assert(planSyntax.ok, `Component UX browser smoke plan syntax passes${planSyntax.ok ? '' : ` (${planSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `Component UX browser smoke suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(plan.schema === COMPONENT_UX_BROWSER_SMOKE_SCHEMA, 'Browser smoke plan declares schema');
  context.assert(plan.reportSchema === COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA, 'Browser smoke plan declares report schema');
  context.assert(plan.status === 'accepted-smoke-plan', 'Browser smoke plan is accepted');
  context.assert(plan.workpackage === COMPONENT_UX_BROWSER_SMOKE_WORKPACKAGE, 'Browser smoke plan belongs to WP-E11-14');
  context.assert(plan.contractMeta === COMPONENT_UX_BROWSER_SMOKE_CONTRACT_META, 'Browser smoke plan declares contract meta');
  context.assert(plan.localOnly === true, 'Browser smoke plan is local-only');
  context.assert(plan.externalNetworkAllowed === false, 'Browser smoke plan rejects external network');
  context.assert(plan.kernelBoundary === KERNEL_BOUNDARY, 'Browser smoke plan keeps RMT kernel boundary');
  context.assert(plan.handoff.nextWorkpackage === 'WP-E11-15', 'Browser smoke plan hands off to WP-E11-15');
  context.assert(plan.browserHarness.fixturePath === COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH, 'Browser smoke plan points to fixture');
  context.assert(plan.browserHarness.resultKey === COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY, 'Browser smoke plan points to result key');
  context.assert(plan.sourceInspector.schema === 'xtend.epic11.component-lab-ux-inspector.v1', 'Browser smoke plan derives from UX Inspector');
  context.assert(plan.coverage.flowCount === 5, 'Browser smoke plan covers five UX journeys');
  context.assert(plan.coverage.componentCount === 17, 'Browser smoke plan covers seventeen representative components after WP-E12-03');
  context.assert(validation.schema === COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA, 'Browser smoke validator emits report schema');
  context.assert(validation.ok === true, 'Browser smoke validator accepts generated plan');
  context.assert(gate.ok === true, 'Browser smoke gate passes');
  context.assert(plan.localGate === COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE, 'Browser smoke plan exposes local gate');

  COMPONENT_UX_BROWSER_SMOKE_FLOWS.forEach((expectedFlow) => {
    const flow = plan.flows.find((candidate) => candidate.id === expectedFlow.id);
    context.assert(Boolean(flow), `${expectedFlow.id}: flow is exposed`);
    context.assert(flow && flow.family === expectedFlow.family, `${expectedFlow.id}: family is bound`);
    context.assert(flow && flow.familySchema && flow.familySchema.startsWith('xtend.component.'), `${expectedFlow.id}: family schema is linked`);
    context.assert(flow && flow.sourceFixture && flow.sourceFixture.startsWith('tests/fixtures/'), `${expectedFlow.id}: family fixture is linked`);
    context.assert(flow && flow.sourceSuite && flow.sourceSuite.endsWith('-ux'), `${expectedFlow.id}: family suite is linked`);
    context.assert(flow && flow.resultKey === COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY, `${expectedFlow.id}: fixture result key is stable`);
    assertIncludesAll(context, flow ? flow.components : [], expectedFlow.components, `${expectedFlow.id} components`);
    assertIncludesAll(context, flow ? flow.fixtureChecks : [], expectedFlow.fixtureChecks, `${expectedFlow.id} fixture checks`);
  });

  context.assert(fixture.includes(COMPONENT_UX_BROWSER_SMOKE_SCHEMA), 'Browser fixture declares Epic 11 UX smoke schema');
  context.assert(fixture.includes(COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY), 'Browser fixture exposes stable result key');
  context.assert(fixture.includes('type="module"'), 'Browser fixture uses module loader');
  context.assert(fixture.includes('src="/xtend-loader.js"'), 'Browser fixture uses canonical local loader');
  context.assert(fixture.includes('data-manifest="/tests/browser/fixtures/components/manifest.json"'), 'Browser fixture uses local manifest');
  context.assert(fixture.includes('name="xtend-preload"'), 'Browser fixture preloads representative components');
  context.assert(!fixture.includes('type="importmap"'), 'Browser fixture avoids CDN import maps');
  context.assert(!fixture.includes('https://cdn.ccs-networks.de/xtend'), 'Browser fixture has no XTend CDN dependency');
  COMPONENT_UX_BROWSER_SMOKE_FLOWS.flatMap((flow) => flow.fixtureChecks).forEach((check) => {
    context.assertIncludes(fixture, `recordCheck('${check}'`, `Browser fixture records ${check}`);
  });

  Object.entries(REQUIRED_MANIFEST_ENTRIES).forEach(([tag, expectedPath]) => {
    context.assert(manifest[tag] === expectedPath, `Browser fixture manifest resolves ${tag} locally`);
  });

  context.assertIncludes(browserSuite, 'EPIC11_UX_COMPATIBILITY_FIXTURE_PATH', 'Browser suite registers Epic 11 UX compatibility fixture path');
  context.assertIncludes(browserSuite, COMPONENT_UX_BROWSER_SMOKE_RESULT_KEY, 'Browser suite registers Epic 11 UX compatibility result key');
  context.assertIncludes(browserSuite, 'assertEpic11UxCompatibilityFixtureContract', 'Browser suite exposes Epic 11 UX compatibility contract assertion');

  context.assertIncludes(readText('components/xinput.js', rootDir), 'input-changed', 'x-input exposes productive input synchronization event');
  context.assertIncludes(readText('components/xform.js', rootDir), 'getFormData()', 'x-form exposes productive form aggregation API');
  context.assertIncludes(readText('components/xmodal.js', rootDir), "event.key === 'Escape'", 'x-modal supports productive Escape dismissal');
  context.assertIncludes(readText('components/xrouter.js', rootDir), 'router-rendered', 'x-router exposes rendered route state');
  context.assertIncludes(readText('components/xtabs.js', rootDir), 'aria-controls', 'x-tabs exposes tab-panel ARIA wiring');
  context.assertIncludes(readText('components/xtabs.js', rootDir), 'Home', 'x-tabs supports Home keyboard navigation');
  context.assertIncludes(readText('components/xtabs.js', rootDir), 'End', 'x-tabs supports End keyboard navigation');
  context.assertIncludes(readText('components/xstatus.js', rootDir), 'aria-live', 'x-status exposes live region semantics');
  context.assertIncludes(readText('components/xprogress.js', rootDir), 'role="progressbar"', 'x-progress exposes progressbar semantics');
  context.assertIncludes(readText('components/xplayer.js', rootDir), 'xtendLayoutDisplayMediaUxProfile', 'x-player exposes layout/display/media UX profile');

  context.assertIncludes(doc, COMPONENT_UX_BROWSER_SMOKE_SCHEMA, 'Browser smoke contract document declares schema');
  context.assertIncludes(doc, COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE, 'Browser smoke contract document declares local gate');
  context.assertIncludes(doc, 'form-validation-journey', 'Browser smoke contract documents form journey');
  context.assertIncludes(doc, 'feedback-status-journey', 'Browser smoke contract documents feedback journey');
  context.assertIncludes(doc, 'navigation-routing-journey', 'Browser smoke contract documents routing journey');
  context.assertIncludes(doc, 'overlay-focus-journey', 'Browser smoke contract documents overlay journey');
  context.assertIncludes(doc, 'layout-display-media-journey', 'Browser smoke contract documents layout/media journey');
  context.assertIncludes(doc, KERNEL_BOUNDARY, 'Browser smoke contract keeps kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-14 is completed');
  context.assertIncludes(workpackage, COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE, 'WP-E11-14 documents local gate');
  context.assertIncludes(browserReadme, COMPONENT_UX_BROWSER_SMOKE_SCHEMA, 'Browser README documents Epic 11 UX smoke schema');
  context.assertIncludes(browserReadme, COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH, 'Browser README documents Epic 11 UX fixture');
  context.assertIncludes(testsReadme, COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE, 'Test README documents Epic 11 UX smoke gate');
  context.assertIncludes(scaffoldConfig, 'componentUxBrowserSmokes', 'Scaffold config exposes Browser UX smoke metadata');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic 11 marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic 11 marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic 11 marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic 11 marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed | WS8 |', 'Backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed | WS8 |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed | WS9 |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed | WS10 |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(registry, COMPONENT_UX_BROWSER_SMOKE_DOC_PATH, 'Reference registry links Browser UX smoke contract');
  context.assertIncludes(registry, COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH, 'Reference registry links Browser UX smoke fixture');
  context.assertIncludes(registry, COMPONENT_UX_BROWSER_SMOKE_SUITE_PATH, 'Reference registry links Browser UX smoke suite');
  context.assertIncludes(runner, "id: 'component-ux-browser-smokes'", 'XTend runner registers Browser UX smoke suite');
  context.assert(packageManifest.scripts['test:component-ux-browser-smokes'] === 'node scripts/run_xtend_tests.js component-ux-browser-smokes', 'Package exposes Browser UX smoke test script');
  context.assert(metadata && metadata.schema === COMPONENT_UX_BROWSER_SMOKE_SCHEMA, 'Package metadata exposes Browser UX smoke schema');
  context.assert(metadata && metadata.reportSchema === COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA, 'Package metadata exposes Browser UX smoke report schema');
  context.assert(metadata && metadata.fixture === COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH, 'Package metadata exposes Browser UX smoke fixture');
  context.assert(metadata && metadata.localGate === COMPONENT_UX_BROWSER_SMOKE_LOCAL_GATE, 'Package metadata exposes Browser UX smoke local gate');
  context.assert(metadata && metadata.componentCount === 17, 'Package metadata exposes Browser UX smoke component count after WP-E12-03');
  context.assert(Array.isArray(metadata.flows) && metadata.flows.length === 5, 'Package metadata exposes five Browser UX smoke flows');

  return context.result({
    report: {
      schema: COMPONENT_UX_BROWSER_SMOKE_REPORT_SCHEMA,
      flowCount: plan.coverage.flowCount,
      componentCount: plan.coverage.componentCount,
      fixture: COMPONENT_UX_BROWSER_SMOKE_FIXTURE_PATH
    }
  });
}

function printComponentUxBrowserSmokeReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 11 Component UX Browser-Smokes erfolgreich.',
    failureTitle: 'Epic 11 Component UX Browser-Smokes fehlgeschlagen:'
  });
}

module.exports = {
  printComponentUxBrowserSmokeReport,
  runComponentUxBrowserSmokeSuite
};

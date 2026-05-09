const fs = require('fs');
const path = require('path');
const vm = require('vm');
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

const RMT_FIRST_DEMO_SCHEMA = 'xtend.epic10.rmt-first-demo-app.v1';
const RMT_FIRST_DEMO_SMOKE_SCHEMA = 'xtend.epic10.rmt-first-demo-app.browser-smoke.v1';
const FIXTURE_PATH = 'xtendrmt/rmt-first-demo-app.rmt';
const HOST_PATH = 'xtendrmt-rmt-first-demo.html';
const RUNTIME_PATH = 'xtendrmt/rmt-first-demo-app.js';
const BROWSER_SMOKE_PATH = 'tests/browser/fixtures/rmt-first-demo-app-smoke.html';
const CONTRACT_PATH = 'development/XTend-RMT-First-Demo-App.md';
const WORKPACKAGE_PATH = 'development/WP-E10-13-RMT-first-Demo-App-ohne-manuelle-Shell-bauen.md';
const DOCS_PATH = 'docs/rmt-first-demo-app.md';
const LOCAL_GATE = 'node scripts/run_xtend_tests.js rmt-first-demo-app --json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function indexById(records) {
  return new Map((Array.isArray(records) ? records : []).map((record) => [record.id, record]));
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertAllRouteReferencesResolve(context, document) {
  const components = indexById(document.components);
  const templates = indexById(document.templates);
  const schedules = indexById(document.schedules);
  const adapters = indexById(document.adapters);

  (document.routes || []).forEach((route) => {
    context.assert(adapters.has(route.router), `${route.id}: router adapter resolves`);
    context.assert(components.has(route.component), `${route.id}: component ref resolves`);
    context.assert(templates.has(route.template), `${route.id}: template ref resolves`);
    context.assert(templates.has(route.shell), `${route.id}: shell template ref resolves`);
    context.assert(schedules.has(route.schedule), `${route.id}: schedule ref resolves`);
  });
}

function assertAllComponentSchedulesResolve(context, document) {
  const schedules = indexById(document.schedules);
  (document.components || []).forEach((component) => {
    context.assert(schedules.has(component.schedule), `${component.id}: component schedule resolves`);
  });
}

function createRmtFormatFromBundle(context, rootDir) {
  const artifactPath = 'xtendrmt/rmt-core.esm.js';
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = source.replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '');
  function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
  }
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-rmt-first-demo-app-test' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
      createElement(tagName) {
        return {
          tagName: String(tagName || '').toUpperCase(),
          attributes: {},
          children: [],
          setAttribute(name, value) {
            this.attributes[name] = String(value);
          },
          appendChild(child) {
            this.children.push(child);
            return child;
          }
        };
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, {
      filename: artifactPath
    });
  } catch (error) {
    context.fail(`RMT core bundle evaluates for RMT-first demo app (${error.message})`);
    return null;
  }

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for RMT-first demo app')) {
    return null;
  }
  return factory();
}

function runRmtFirstDemoAppSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-first-demo-app',
    label: 'Epic 10 RMT-first Demo App'
  });
  const fixture = readJson(FIXTURE_PATH, rootDir);
  const host = readText(HOST_PATH, rootDir);
  const runtime = readText(RUNTIME_PATH, rootDir);
  const browserSmoke = readText(BROWSER_SMOKE_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtFirstDemoApp;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const browserSuite = readText('tests/browser/browser_smoke_suite.js', rootDir);
  const contract = readText(CONTRACT_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const docs = readText(DOCS_PATH, rootDir);
  const docsReadme = readText('docs/README.md', rootDir);
  const docsMenu = readText('docs/menu.json', rootDir);
  const platformDocs = readText('docs/component-platform.md', rootDir);
  const epic = readText('development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md', rootDir);
  const registry = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);

  assertFileExists(context, FIXTURE_PATH, rootDir, 'RMT-first demo fixture exists');
  assertFileExists(context, HOST_PATH, rootDir, 'RMT-first demo host exists');
  assertFileExists(context, RUNTIME_PATH, rootDir, 'RMT-first demo runtime exists');
  assertFileExists(context, BROWSER_SMOKE_PATH, rootDir, 'RMT-first demo browser smoke exists');
  assertFileExists(context, CONTRACT_PATH, rootDir, 'RMT-first demo contract document exists');
  assertFileExists(context, WORKPACKAGE_PATH, rootDir, 'WP-E10-13 workpackage document exists');
  assertFileExists(context, DOCS_PATH, rootDir, 'RMT-first demo developer docs exist');

  context.assert(fixture.kind === 'rmt_document', 'RMT-first demo fixture is an RMT document');
  context.assert(fixture.manifest.metadata.contractVersion === RMT_FIRST_DEMO_SCHEMA, 'RMT-first demo declares contract schema');
  context.assert(fixture.manifest.metadata.workpackage === 'WP-E10-13', 'RMT-first demo belongs to WP-E10-13');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'RMT-first demo is shell-first');
  context.assert(fixture.manifest.metadata.manualShellAllowed === false, 'RMT-first demo forbids manual shell');
  context.assert(fixture.manifest.metadata.hostShellMarkup === false, 'RMT-first demo forbids host shell markup');
  context.assert(fixture.manifest.metadata.kernelBoundary.includes('DOM materialization'), 'RMT-first demo keeps DOM materialization in host adapter');

  const adapterIds = fixture.adapters.map((adapter) => adapter.id);
  const componentIds = fixture.components.map((component) => component.id);
  const routeIds = fixture.routes.map((route) => route.id);
  const scheduleIds = fixture.schedules.map((schedule) => schedule.id);
  const templateIds = fixture.templates.map((template) => template.id);
  assertIncludesAll(context, adapterIds, ['xtend.component', 'xtend.xrouter', 'rmt.state-scheduler-diagnostics', 'xtend.fabric-telemetry'], 'RMT-first demo adapters');
  assertIncludesAll(context, componentIds, [
    'app.shell',
    'app.router',
    'page.dashboard',
    'dashboard.status',
    'dashboard.progress',
    'page.settings',
    'settings.delivery',
    'settings.telemetry',
    'settings.renderMode',
    'settings.notes',
    'page.overlays',
    'overlays.tooltip',
    'overlays.popover',
    'overlays.drawer'
  ], 'RMT-first demo components');
  assertIncludesAll(context, routeIds, ['dashboard', 'settings', 'overlays'], 'RMT-first demo routes');
  assertIncludesAll(context, scheduleIds, [
    'app.shell.render',
    'route.visible.render',
    'route.transition.render',
    'component.visible.mount',
    'component.idle.hydrate',
    'ui.user-blocking.input',
    'overlay.visible.mount',
    'overlay.idle.hydrate',
    'diagnostics.snapshot'
  ], 'RMT-first demo schedules');
  assertIncludesAll(context, templateIds, [
    'app.shell.template',
    'app.header',
    'page.dashboard.template',
    'page.settings.template',
    'page.overlays.template',
    'overlays.popover.content',
    'overlays.drawer.content'
  ], 'RMT-first demo templates');
  context.assert(JSON.stringify(fixture).includes('x-select'), 'RMT-first demo uses x-select');
  context.assert(JSON.stringify(fixture).includes('x-checkbox'), 'RMT-first demo uses x-checkbox');
  context.assert(JSON.stringify(fixture).includes('x-radio'), 'RMT-first demo uses x-radio');
  context.assert(JSON.stringify(fixture).includes('x-textarea'), 'RMT-first demo uses x-textarea');
  context.assert(JSON.stringify(fixture).includes('x-status'), 'RMT-first demo uses x-status');
  context.assert(JSON.stringify(fixture).includes('x-progress'), 'RMT-first demo uses x-progress');
  context.assert(JSON.stringify(fixture).includes('x-tooltip'), 'RMT-first demo uses x-tooltip');
  context.assert(JSON.stringify(fixture).includes('x-popover'), 'RMT-first demo uses x-popover');
  context.assert(JSON.stringify(fixture).includes('x-drawer'), 'RMT-first demo uses x-drawer');
  context.assert(fixture.diagnostics.schema === 'xtend.epic10.rmt-first-demo-diagnostics.v1', 'RMT-first demo declares diagnostics schema');
  assertAllRouteReferencesResolve(context, fixture);
  assertAllComponentSchedulesResolve(context, fixture);

  const rmtFormat = createRmtFormatFromBundle(context, rootDir);
  if (rmtFormat) {
    const normalizedDocument = rmtFormat.normalizeDocument(fixture);
    const registries = rmtFormat.createRuntimeRegistries(fixture);
    context.assert(normalizedDocument.manifest.documentId === 'demo.xtend.rmt-first-app', 'RMT format normalizes RMT-first demo document id');
    context.assert(normalizedDocument.adapters.length === 4, 'RMT format normalizes four demo adapters');
    context.assert(normalizedDocument.components.length === 14, 'RMT format normalizes fourteen demo components');
    context.assert(normalizedDocument.routes.length === 3, 'RMT format normalizes three demo routes');
    context.assert(normalizedDocument.schedules.length === 9, 'RMT format normalizes nine demo schedules');
    context.assert(normalizedDocument.templates.length === 7, 'RMT format normalizes seven demo templates');
    context.assert(registries.status === 'ready', 'RMT-first demo creates ready runtime registries');
    context.assert(registries.diagnosticCount === 0, 'RMT-first demo creates registries without diagnostics');
    context.assert(registries.routeRegistry.ids.includes('settings'), 'RMT-first demo indexes settings route');
    context.assert(registries.componentRegistry.ids.includes('overlays.drawer'), 'RMT-first demo indexes drawer component');
  }

  context.assert(host.includes('data-rmt-host="rmt-first-demo"'), 'RMT-first demo host exposes generic RMT root');
  context.assert(host.includes('data-rmt-document-src="xtendrmt/rmt-first-demo-app.rmt"'), 'RMT-first demo host points at RMT document');
  context.assert(host.includes('type="module" src="xtend-loader.js"'), 'RMT-first demo host uses canonical XTend loader');
  context.assert(host.includes('data-manifest="components/manifest.json"'), 'RMT-first demo host uses local manifest');
  context.assert(host.includes('window.__XTendLoaderBootPromise'), 'RMT-first demo host waits for loader boot');
  context.assert(host.includes("import('./xtendrmt/rmt-first-demo-app.js')"), 'RMT-first demo host imports demo runtime');
  context.assert(!host.includes('<x-section'), 'RMT-first demo host has no static x-section shell');
  context.assert(!host.includes('<x-router'), 'RMT-first demo host has no static x-router shell');
  context.assert(!host.includes('https://cdn.ccs-networks.de/xtend'), 'RMT-first demo host has no CDN dependency');

  context.assert(runtime.includes('renderRmtShellFromDocument'), 'RMT-first demo runtime exposes shell renderer');
  context.assert(runtime.includes('renderDomDescriptor'), 'RMT-first demo runtime exposes descriptor renderer');
  context.assert(runtime.includes('createRouteElement'), 'RMT-first demo runtime derives route elements');
  context.assert(runtime.includes('fetch(documentUrl'), 'RMT-first demo runtime fetches RMT document');
  context.assert(runtime.includes('createRmtFormat'), 'RMT-first demo runtime uses RMT format when available');
  context.assert(runtime.includes('root.replaceChildren(shellFragment)'), 'RMT-first demo runtime replaces host root with RMT shell');
  context.assert(runtime.includes('data-rmt-rendered-shell'), 'RMT-first demo runtime marks rendered shell');
  context.assert(!runtime.includes('innerHTML'), 'RMT-first demo runtime avoids string HTML rendering');
  context.assert(!runtime.includes('manualShell'), 'RMT-first demo runtime has no manual shell special logic marker');

  context.assert(browserSmoke.includes(RMT_FIRST_DEMO_SMOKE_SCHEMA), 'RMT-first demo browser smoke declares schema');
  context.assert(browserSmoke.includes('/xtend-loader.js'), 'RMT-first demo browser smoke uses local loader');
  context.assert(browserSmoke.includes('/xtendrmt/rmt-first-demo-app.js'), 'RMT-first demo browser smoke imports demo runtime');
  context.assert(browserSmoke.includes('/xtendrmt/rmt-first-demo-app.rmt'), 'RMT-first demo browser smoke loads RMT document');
  context.assert(browserSmoke.includes('__xtendRmtFirstDemoSmokeResult'), 'RMT-first demo browser smoke exposes result object');
  context.assert(browserSmoke.includes("recordCheck('rmt-first demo document loaded'"), 'RMT-first demo browser smoke checks document load');
  context.assert(browserSmoke.includes("recordCheck('rmt-first demo shell rendered from rmt'"), 'RMT-first demo browser smoke checks RMT shell render');
  context.assert(browserSmoke.includes("recordCheck('rmt-first demo routes derived from rmt'"), 'RMT-first demo browser smoke checks RMT routes');
  context.assert(browserSmoke.includes("recordCheck('rmt-first demo telemetry schedule visible'"), 'RMT-first demo browser smoke checks telemetry schedule');
  context.assert(!browserSmoke.includes('https://cdn.ccs-networks.de/xtend'), 'RMT-first demo browser smoke has no CDN dependency');
  context.assertIncludes(browserSuite, 'RMT_FIRST_DEMO_SMOKE_FIXTURE_PATH', 'Browser smoke suite registers RMT-first demo fixture path');
  context.assertIncludes(browserSuite, '__xtendRmtFirstDemoSmokeResult', 'Browser smoke suite registers RMT-first demo result key');

  context.assertIncludes(contract, RMT_FIRST_DEMO_SCHEMA, 'RMT-first demo contract declares schema');
  context.assertIncludes(contract, 'keine manuelle App-Shell', 'RMT-first demo contract documents no manual shell');
  context.assertIncludes(contract, FIXTURE_PATH, 'RMT-first demo contract links fixture');
  context.assertIncludes(contract, LOCAL_GATE, 'RMT-first demo contract documents local gate');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-13 is completed');
  context.assertIncludes(workpackage, LOCAL_GATE, 'WP-E10-13 documents local gate');
  context.assertIncludes(docs, RMT_FIRST_DEMO_SCHEMA, 'Docs declare RMT-first demo schema');
  context.assertIncludes(docs, HOST_PATH, 'Docs link demo host');
  context.assertIncludes(docsReadme, 'RMT-first Demo-App', 'Docs README links RMT-first demo');
  context.assertIncludes(docsMenu, 'rmt-first-demo-app', 'Docs menu links RMT-first demo');
  context.assertIncludes(platformDocs, 'RMT-first Demo-App', 'Component Platform docs mention RMT-first demo');
  context.assertIncludes(epic, '| `WP-E10-13` | P1 | completed |', 'Epic 10 marks WP-E10-13 completed');
  context.assertIncludes(epic, '| `WP-E10-14` | P1 | completed |', 'Epic 10 marks WP-E10-14 completed');
  context.assertIncludes(epic, '| `WP-E10-15` | P1 | completed |', 'Epic 10 marks WP-E10-15 completed');
  context.assertIncludes(epic, '| `WP-E10-16` | P2 | completed |', 'Epic 10 marks WP-E10-16 completed');
  context.assertIncludes(backlog, '| `WP-E10-13` | P1 | completed |', 'Backlog marks WP-E10-13 completed');
  context.assertIncludes(backlog, '| `WP-E10-14` | P1 | completed |', 'Backlog marks WP-E10-14 completed');
  context.assertIncludes(backlog, '| `WP-E10-15` | P1 | completed |', 'Backlog marks WP-E10-15 completed');
  context.assertIncludes(backlog, '| `WP-E10-16` | P2 | completed |', 'Backlog marks WP-E10-16 completed');
  context.assertIncludes(registry, CONTRACT_PATH, 'Reference registry links RMT-first demo contract');
  context.assertIncludes(registry, FIXTURE_PATH, 'Reference registry links RMT-first demo fixture');
  context.assertIncludes(registry, HOST_PATH, 'Reference registry links RMT-first demo host');
  context.assertIncludes(registry, BROWSER_SMOKE_PATH, 'Reference registry links RMT-first demo browser smoke');
  context.assertIncludes(runner, "id: 'rmt-first-demo-app'", 'XTend runner registers RMT-first demo suite');
  context.assert(packageManifest.scripts['test:rmt-first-demo-app'] === 'node scripts/run_xtend_tests.js rmt-first-demo-app', 'Package exposes RMT-first demo test script');
  context.assert(metadata && metadata.schema === RMT_FIRST_DEMO_SCHEMA, 'Package metadata exposes RMT-first demo schema');
  context.assert(metadata && metadata.fixture === FIXTURE_PATH, 'Package metadata exposes RMT-first demo fixture');
  context.assert(metadata && metadata.host === HOST_PATH, 'Package metadata exposes RMT-first demo host');
  context.assert(metadata && metadata.runtime === RUNTIME_PATH, 'Package metadata exposes RMT-first demo runtime');
  context.assert(metadata && metadata.browserSmoke === BROWSER_SMOKE_PATH, 'Package metadata exposes RMT-first demo browser smoke');
  context.assert(metadata && metadata.localGate === LOCAL_GATE, 'Package metadata exposes RMT-first demo local gate');
  context.assert(metadata && metadata.manualShellAllowed === false, 'Package metadata forbids manual shell');

  return context.result({
    report: {
      schema: 'xtend.epic10.rmt-first-demo-app-report.v1',
      fixture: FIXTURE_PATH,
      host: HOST_PATH,
      routes: fixture.routes.length,
      components: fixture.components.length,
      schedules: fixture.schedules.length,
      templates: fixture.templates.length
    }
  });
}

function printRmtFirstDemoAppReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 10 RMT-first Demo-App erfolgreich.',
    failureTitle: 'Epic 10 RMT-first Demo-App fehlgeschlagen:'
  });
}

module.exports = {
  printRmtFirstDemoAppReport,
  runRmtFirstDemoAppSuite
};

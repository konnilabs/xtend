const vm = require('vm');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');

const RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA = 'xtend.rmt.first-class-app-authoring.v1';
const FIXTURE_PATH = 'tests/fixtures/rmt-first-class-xtend-app.rmt';
const CONTRACT_PATH = 'development/XTend-RMT-First-Class-App-Authoring.md';
const WORKPACKAGE_PATH = 'development/WP-E10-04-RMT-App-Authoring-Contract-fuer-vollstaendige-XTend-Apps-spezifizieren.md';

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
    navigator: { userAgent: 'xtend-rmt-first-class-app-test' },
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
    context.fail(`RMT core bundle evaluates for RMT-first app authoring (${error.message})`);
    return null;
  }

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;
  if (!context.assert(typeof factory === 'function', 'RMT core bundle exposes createRmtFormat for RMT-first app authoring')) {
    return null;
  }
  return factory();
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

function runRmtFirstClassAppAuthoringSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'rmt-first-class-app',
    label: 'RMT-first XTend app authoring contract'
  });
  const fixture = readJson(FIXTURE_PATH, rootDir);
  const contract = readText(CONTRACT_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtFirstClassAppAuthoring;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);

  context.assert(fixture.kind === 'rmt_document', 'RMT-first fixture is an RMT document');
  context.assert(fixture.manifest && fixture.manifest.metadata && fixture.manifest.metadata.contractVersion === RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA, 'RMT-first fixture declares authoring schema');
  context.assert(fixture.manifest.metadata.workpackage === 'WP-E10-04', 'RMT-first fixture is owned by WP-E10-04');
  context.assert(fixture.manifest.metadata.renderMode === 'shell-first', 'RMT-first fixture declares shell-first rendering');
  context.assert(fixture.manifest.metadata.componentContract === 'xtend.component.contract.v2', 'RMT-first fixture binds Component Contract v2');
  context.assert(fixture.manifest.metadata.kernelBoundary.includes('XTend component execution'), 'RMT-first fixture keeps host execution outside kernel');

  const adapters = indexById(fixture.adapters);
  const components = indexById(fixture.components);
  const routes = indexById(fixture.routes);
  const schedules = indexById(fixture.schedules);
  const templates = indexById(fixture.templates);

  context.assert(adapters.get('xtend.component') && adapters.get('xtend.component').kind === 'component_adapter', 'RMT-first fixture declares XTend component adapter');
  context.assert(adapters.get('xtend.component') && adapters.get('xtend.component').kernelVisible === false, 'XTend component adapter remains kernel-invisible');
  assertIncludesAll(context, adapters.get('xtend.component') && adapters.get('xtend.component').providedCapabilities, ['components', 'customElements', 'manifestLookup', 'fabricContext', 'diagnostics'], 'XTend component adapter capabilities');
  context.assert(adapters.get('xtend.xrouter') && adapters.get('xtend.xrouter').kind === 'router_adapter', 'RMT-first fixture declares XRouter adapter');
  context.assert(adapters.get('rmt.state-scheduler-diagnostics') && adapters.get('rmt.state-scheduler-diagnostics').kind === 'scheduler_adapter', 'RMT-first fixture declares scheduler diagnostics adapter');
  context.assert(components.get('app.shell') && components.get('app.shell').tag === 'x-section', 'RMT-first fixture declares XTend app shell component');
  context.assert(components.get('app.router') && components.get('app.router').tag === 'x-router', 'RMT-first fixture declares XRouter component host');
  context.assert(components.get('dashboard.health') && components.get('dashboard.health').events['alert-dismissed'].command === 'dashboard.health.dismiss', 'RMT-first fixture binds component event to command');
  context.assert(components.get('pages.settings') && components.get('pages.settings').metadata.fabric.lane === 'idle', 'RMT-first fixture carries Fabric lane metadata');
  context.assert(components.get('pages.tutorial') && components.get('pages.tutorial').tag === 'x-player', 'RMT-first fixture prepares XPlayer tutorial component');
  context.assert(routes.get('dashboard') && routes.get('dashboard').path === '/', 'RMT-first fixture declares dashboard route');
  context.assert(routes.get('settings') && routes.get('settings').schedule === 'route.transition.render', 'RMT-first fixture declares transition route schedule');
  context.assert(routes.get('tutorial') && routes.get('tutorial').metadata.contentKind === 'xplayerTutorial', 'RMT-first fixture declares tutorial content kind');
  context.assert(schedules.get('app.shell.render') && schedules.get('app.shell.render').endpointName === 'xtendrmt.shell.render', 'RMT-first fixture schedules shell render endpoint');
  context.assert(schedules.get('ui.user-blocking.input') && schedules.get('ui.user-blocking.input').lane === 'user-blocking', 'RMT-first fixture schedules user-blocking input lane');
  context.assert(schedules.get('media.lazy.hydrate') && schedules.get('media.lazy.hydrate').preferIdle === true, 'RMT-first fixture schedules lazy media hydration');
  context.assert(schedules.get('diagnostics.snapshot') && schedules.get('diagnostics.snapshot').lane === 'diagnostics', 'RMT-first fixture schedules diagnostics lane');
  context.assert(templates.get('app.shell') && templates.get('app.shell').mode === 'dom_descriptor', 'RMT-first fixture declares dom_descriptor app shell');
  context.assert(templates.get('app.shell') && templates.get('app.shell').metadata.renderMode === 'shell-first', 'RMT-first app shell template is shell-first');
  context.assert(JSON.stringify(templates.get('app.header')).includes('x-link'), 'RMT-first header template contains navigation links');
  context.assert(templates.get('pages.settings.template') && templates.get('pages.settings.template').nodes[0].events.submit === 'settings.save', 'RMT-first settings template maps submit event to command');
  context.assert(templates.get('pages.tutorial.template') && templates.get('pages.tutorial.template').metadata.lazySchedule === 'media.lazy.hydrate', 'RMT-first tutorial template declares lazy media schedule');

  assertAllRouteReferencesResolve(context, fixture);
  assertAllComponentSchedulesResolve(context, fixture);

  const rmtFormat = createRmtFormatFromBundle(context, rootDir);
  if (rmtFormat) {
    const normalizedDocument = rmtFormat.normalizeDocument(fixture);
    const registries = rmtFormat.createRuntimeRegistries(fixture);
    context.assert(normalizedDocument.manifest.documentId === 'fixture.xtend.first-class-app', 'RMT format normalizes RMT-first app document id');
    context.assert(normalizedDocument.adapters.length === 3, 'RMT format normalizes RMT-first app adapters');
    context.assert(normalizedDocument.components.length === 8, 'RMT format normalizes RMT-first app components');
    context.assert(normalizedDocument.routes.length === 3, 'RMT format normalizes RMT-first app routes');
    context.assert(normalizedDocument.schedules.length === 8, 'RMT format normalizes RMT-first app schedules');
    context.assert(normalizedDocument.templates.length === 5, 'RMT format normalizes RMT-first app templates');
    context.assert(registries.status === 'ready', 'RMT-first app creates ready runtime registries');
    context.assert(registries.diagnosticCount === 0, 'RMT-first app creates runtime registries without diagnostics');
    context.assert(Array.isArray(registries.routeRegistry.ids) && registries.routeRegistry.ids.includes('settings'), 'RMT-first app indexes settings route');
    context.assert(Array.isArray(registries.componentRegistry.ids) && registries.componentRegistry.ids.includes('app.shell'), 'RMT-first app indexes app shell component');
    context.assert(Array.isArray(registries.componentRegistry.ids) && registries.componentRegistry.ids.includes('pages.tutorial'), 'RMT-first app indexes tutorial component');
  }

  context.assertIncludes(contract, RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA, 'RMT-first app authoring document declares schema');
  context.assertIncludes(contract, 'shell-first', 'RMT-first app authoring document describes shell-first rendering');
  context.assertIncludes(contract, 'xtend.component', 'RMT-first app authoring document describes XTend component adapter');
  context.assertIncludes(contract, 'xtend.xrouter', 'RMT-first app authoring document describes XRouter adapter');
  context.assertIncludes(contract, 'xtend.component.contract.v2', 'RMT-first app authoring document references Component Contract v2');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'RMT-first app authoring document keeps kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-04 is completed');
  context.assert(metadata && metadata.schema === RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA, 'Package metadata exposes RMT-first app authoring schema');
  context.assert(metadata.fixture === FIXTURE_PATH, 'Package metadata exposes RMT-first app fixture path');
  context.assert(metadata.contract === CONTRACT_PATH, 'Package metadata exposes RMT-first app contract path');
  context.assert(metadata.renderMode === 'shell-first', 'Package metadata exposes shell-first render mode');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('routes'), 'Package metadata requires routes domain');
  context.assert(Array.isArray(metadata.requiredDomains) && metadata.requiredDomains.includes('templates'), 'Package metadata requires templates domain');
  context.assert(Array.isArray(metadata.requiredAdapters) && metadata.requiredAdapters.includes('xtend.component'), 'Package metadata requires XTend component adapter');
  context.assert(Array.isArray(metadata.requiredAdapters) && metadata.requiredAdapters.includes('xtend.xrouter'), 'Package metadata requires XRouter adapter');
  context.assert(metadata.kernelBoundary === 'no-rmt-kernel-import-of-xtend-types', 'Package metadata keeps RMT kernel boundary');
  context.assert(packageManifest.scripts['test:rmt-first-class-app'] === 'node scripts/run_xtend_tests.js rmt-first-class-app', 'Package exposes RMT-first app test script');
  context.assertIncludes(scaffoldConfig, 'rmtFirstClassAppAuthoring', 'Scaffold config exposes RMT-first app authoring section');
  context.assertIncludes(scaffoldConfig, RMT_FIRST_CLASS_APP_AUTHORING_SCHEMA, 'Scaffold config declares RMT-first app authoring schema');

  return context.result({
    report: {
      schema: 'xtend.rmt.first-class-app-authoring-report.v1',
      document: FIXTURE_PATH,
      routes: Array.isArray(fixture.routes) ? fixture.routes.length : 0,
      components: Array.isArray(fixture.components) ? fixture.components.length : 0,
      templates: Array.isArray(fixture.templates) ? fixture.templates.length : 0,
      schedules: Array.isArray(fixture.schedules) ? fixture.schedules.length : 0
    }
  });
}

function printRmtFirstClassAppAuthoringReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT-first XTend app authoring contract erfolgreich.',
    failureTitle: 'RMT-first XTend app authoring contract fehlgeschlagen:'
  });
}

module.exports = {
  printRmtFirstClassAppAuthoringReport,
  runRmtFirstClassAppAuthoringSuite
};

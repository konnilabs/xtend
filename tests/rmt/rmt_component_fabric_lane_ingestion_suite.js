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

const FABRIC_LANE_INGESTION_SCHEMA = 'xtend.component.fabric-lane-ingestion.v2';
const WORKPACKAGE_PATH = 'development/WP-E10-05-XTend-Component-Adapter-um-Fabric-Lane-Ingestion-erweitern.md';
const CONTRACT_PATH = 'development/XTend-Fabric-Component-Compatibility-v2.md';
const FIXTURE_PATH = 'tests/fixtures/rmt-first-class-xtend-app.rmt';

function createRuntimeModules(context, rootDir, artifactPath) {
  const source = readText(artifactPath, rootDir);
  const cjsCompatibleSource = artifactPath.endsWith('.esm.js')
    ? source.replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
    : source;
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
    navigator: { userAgent: 'xtend-component-fabric-lane-ingestion-test' },
    CustomEvent,
    document: createFakeDocument()
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, { filename: artifactPath });
  } catch (error) {
    context.fail(`${artifactPath} evaluates for Component Fabric/Lane ingestion (${error.message})`);
    return null;
  }
  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules.createRmtXtendComponentAdapter === 'function', `${artifactPath} exposes createRmtXtendComponentAdapter`)) {
    return null;
  }
  return sandbox.AppModules;
}

function createFakeElement(tagName) {
  return {
    tagName: String(tagName || '').toUpperCase(),
    attributes: {},
    children: [],
    listeners: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener(eventName, handler, options) {
      this.listeners[eventName] = { handler, options };
    },
    querySelector(selector) {
      if (selector.startsWith('[data-rmt-component-id=')) {
        const componentId = selector.match(/"([^"]+)"/);
        return this.children.find((child) => child.attributes && child.attributes['data-rmt-component-id'] === (componentId && componentId[1])) || null;
      }
      return this.children.find((child) => child.tagName && child.tagName.toLowerCase() === selector.toLowerCase()) || null;
    },
    hydrate(model, details) {
      this.hydrateCall = { model, details };
    }
  };
}

function createFakeDocument() {
  return {
    createElement(tagName) {
      return createFakeElement(tagName);
    },
    createTextNode(text) {
      return { textContent: String(text) };
    }
  };
}

function createAdapterFixture(context, rootDir, artifactPath) {
  const modules = createRuntimeModules(context, rootDir, artifactPath);
  if (!modules) return null;
  const fixture = readJson(FIXTURE_PATH, rootDir);
  const format = modules.createRmtFormat();
  const registry = format.createRuntimeRegistries(fixture);
  const fakeDocument = createFakeDocument();
  const fakeRoot = createFakeElement('main');
  fakeRoot.ownerDocument = fakeDocument;
  const adapter = modules.createRmtXtendComponentAdapter({
    document: fakeDocument,
    customElements: {
      get(tagName) {
        return tagName ? function XtendComponent() {} : undefined;
      }
    }
  });
  const mapping = adapter.mapComponents(registry, {
    schedules: fixture.schedules
  });
  return { adapter, fakeRoot, fixture, mapping, registry };
}

function assertRuntimeArtifact(context, rootDir, artifactPath) {
  const fixture = createAdapterFixture(context, rootDir, artifactPath);
  if (!fixture) return;
  const { adapter, fakeRoot, mapping } = fixture;

  context.assert(adapter.schema === 'xtend.rmt.xtend-component-adapter.v1', `${artifactPath}: adapter keeps XTend component schema`);
  context.assert(adapter.runtimeSurface.includes('resolveFabricContext'), `${artifactPath}: adapter exposes resolveFabricContext runtime surface`);
  context.assert(adapter.capabilities.providedCapabilities.includes('laneIngestion'), `${artifactPath}: adapter exposes laneIngestion capability`);
  context.assert(adapter.definition.metadata.fabricLaneIngestion === FABRIC_LANE_INGESTION_SCHEMA, `${artifactPath}: adapter definition exposes Fabric lane ingestion schema`);
  context.assert(Array.isArray(mapping.schedules) && mapping.schedules.length >= 8, `${artifactPath}: mapping preserves RMT schedule records`);

  const dashboardContext = adapter.resolveFabricContext('pages.dashboard', 'mountComponent', {}, { mapping });
  context.assert(dashboardContext.schema === FABRIC_LANE_INGESTION_SCHEMA, `${artifactPath}: dashboard Fabric context uses stable schema`);
  context.assert(dashboardContext.source === 'rmt.schedule-record', `${artifactPath}: RMT schedule record has highest precedence`);
  context.assert(dashboardContext.fabricLane === 'visible', `${artifactPath}: dashboard resolves visible Fabric lane`);
  context.assert(dashboardContext.fiberKind === 'component.mount', `${artifactPath}: dashboard resolves mount fiber`);
  context.assert(dashboardContext.endpointNameHint === 'xtendrmt.component.mount', `${artifactPath}: dashboard resolves component mount endpoint`);

  const settingsContext = adapter.resolveFabricContext('pages.settings', 'hydrateComponent', {}, {
    mapping,
    fabric: {
      lane: 'visible',
      fiberKind: 'component.render'
    },
    componentContract: {
      schema: 'xtend.component.contract.v2',
      fabric: {
        defaultLane: 'background'
      }
    }
  });
  context.assert(settingsContext.fabricLane === 'idle', `${artifactPath}: schedule record wins over runtime and static contract lane`);
  context.assert(settingsContext.scheduleRef === 'component.idle.hydrate', `${artifactPath}: settings hydration resolves idle schedule`);
  context.assert(settingsContext.preferIdle === true, `${artifactPath}: settings hydration keeps idle preference`);
  context.assert(settingsContext.diagnostics.some((entry) => entry.code === 'rmt.xtend.component.fabric_lane.conflict'), `${artifactPath}: conflicting lane sources emit diagnostics`);

  const mountResult = adapter.mountComponent(fakeRoot, 'pages.dashboard', {}, { mapping });
  const mountedElement = fakeRoot.children[0];
  context.assert(mountResult.ok === true, `${artifactPath}: mount succeeds with Fabric context`);
  context.assert(mountResult.metadata.fabric.schema === FABRIC_LANE_INGESTION_SCHEMA, `${artifactPath}: mount result carries Fabric context`);
  context.assert(mountedElement.attributes['data-xtend-fabric-lane'] === 'visible', `${artifactPath}: mounted element carries Fabric lane attribute`);
  context.assert(mountedElement.attributes['data-xtend-fabric-fiber'] === 'component.mount', `${artifactPath}: mounted element carries Fiber kind attribute`);
  context.assert(mountedElement.attributes['data-rmt-endpoint'] === 'xtendrmt.component.mount', `${artifactPath}: mounted element carries endpoint hint`);

  const hydrateResult = adapter.hydrateComponent(fakeRoot, 'pages.settings', {}, { mapping });
  context.assert(hydrateResult.ok === true, `${artifactPath}: hydration succeeds with Fabric context`);
  context.assert(hydrateResult.metadata.fabric.fabricLane === 'idle', `${artifactPath}: hydration result carries idle Fabric lane`);
  context.assert(hydrateResult.metadata.fabric.fiberKind === 'component.hydrate', `${artifactPath}: hydration result carries hydrate Fiber kind`);
}

function runRmtComponentFabricLaneIngestionSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'rmt-component-fabric-ingestion',
    label: 'RMT XTend component Fabric/Lane ingestion'
  });
  const contract = readText(CONTRACT_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const runtimeSource = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const browserSource = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const typesSource = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const schemaSource = readText('xtendrmt/rmt.schema.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentFabricLaneIngestion;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);

  context.assertIncludes(contract, FABRIC_LANE_INGESTION_SCHEMA, 'Compatibility contract declares Fabric/Lane ingestion schema');
  context.assertIncludes(contract, 'rmt.schedule-record', 'Compatibility contract documents schedule-record precedence');
  context.assertIncludes(contract, 'fabric.runtime-override', 'Compatibility contract documents runtime override source');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Compatibility contract keeps RMT kernel boundary visible');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-05 is completed');
  context.assertIncludes(runtimeSource, 'resolveFabricContext', 'ESM runtime exposes resolveFabricContext');
  context.assertIncludes(browserSource, 'resolveFabricContext', 'Browser runtime exposes resolveFabricContext');
  context.assertIncludes(typesSource, 'RmtXtendComponentFabricContext', 'Types expose Fabric context contract');
  context.assertIncludes(schemaSource, FABRIC_LANE_INGESTION_SCHEMA, 'RMT schema exposes Fabric lane ingestion metadata');
  context.assert(metadata && metadata.schema === FABRIC_LANE_INGESTION_SCHEMA, 'Package metadata exposes Fabric/Lane ingestion schema');
  context.assert(metadata.localGate === 'node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json', 'Package metadata exposes local gate');
  context.assertIncludes(scaffoldConfig, 'componentFabricLaneIngestion', 'Scaffold config exposes Component Fabric/Lane ingestion section');

  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.esm.js');
  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.browser.js');

  return context.result({
    report: {
      schema: 'xtend.component.fabric-lane-ingestion-report.v1',
      fixture: FIXTURE_PATH,
      artifacts: ['xtendrmt/rmt-runtime.esm.js', 'xtendrmt/rmt-runtime.browser.js']
    }
  });
}

function printRmtComponentFabricLaneIngestionReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT XTend Component Fabric/Lane Ingestion erfolgreich.',
    failureTitle: 'RMT XTend Component Fabric/Lane Ingestion fehlgeschlagen:'
  });
}

module.exports = {
  printRmtComponentFabricLaneIngestionReport,
  runRmtComponentFabricLaneIngestionSuite
};

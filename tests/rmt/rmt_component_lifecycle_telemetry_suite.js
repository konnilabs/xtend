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
const {
  CONTRACTS,
  createXtendFabric
} = require('../../fabric/xtend-fabric');

const LIFECYCLE_TELEMETRY_SCHEMA = 'xtend.component.lifecycle-telemetry.v1';
const WORKPACKAGE_PATH = 'development/WP-E10-06-Telemetry-API-Anschluss-fuer-Component-Lifecycle-standardisieren.md';
const CONTRACT_PATH = 'development/XTend-Component-Lifecycle-Telemetry-Contract.md';
const FIXTURE_PATH = 'tests/fixtures/rmt-first-class-xtend-app.rmt';

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
    navigator: { userAgent: 'xtend-component-lifecycle-telemetry-test' },
    CustomEvent,
    document: createFakeDocument()
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  try {
    vm.runInNewContext(cjsCompatibleSource, sandbox, { filename: artifactPath });
  } catch (error) {
    context.fail(`${artifactPath} evaluates for Component Lifecycle Telemetry (${error.message})`);
    return null;
  }
  if (!context.assert(sandbox.AppModules && typeof sandbox.AppModules.createRmtXtendComponentAdapter === 'function', `${artifactPath} exposes createRmtXtendComponentAdapter`)) {
    return null;
  }
  return sandbox.AppModules;
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
  const telemetryCollector = [];
  let nowTick = 0;
  const adapter = modules.createRmtXtendComponentAdapter({
    document: fakeDocument,
    telemetryCollector,
    now() {
      nowTick += 7;
      return nowTick;
    },
    customElements: {
      get(tagName) {
        return tagName ? function XtendComponent() {} : undefined;
      }
    }
  });
  const mapping = adapter.mapComponents(registry, {
    schedules: fixture.schedules
  });
  return { adapter, fakeRoot, fixture, mapping, telemetryCollector };
}

function assertRuntimeArtifact(context, rootDir, artifactPath) {
  const fixture = createAdapterFixture(context, rootDir, artifactPath);
  if (!fixture) return;
  const { adapter, fakeRoot, mapping, telemetryCollector } = fixture;

  context.assert(adapter.runtimeSurface.includes('recordComponentTelemetry'), `${artifactPath}: adapter exposes recordComponentTelemetry`);
  context.assert(adapter.capabilities.providedCapabilities.includes('componentTelemetry'), `${artifactPath}: adapter exposes componentTelemetry capability`);
  context.assert(adapter.definition.metadata.componentLifecycleTelemetry === LIFECYCLE_TELEMETRY_SCHEMA, `${artifactPath}: adapter definition exposes Lifecycle Telemetry schema`);

  const mountResult = adapter.mountComponent(fakeRoot, 'dashboard.health', {}, { mapping });
  context.assert(mountResult.metadata.telemetry.schema === LIFECYCLE_TELEMETRY_SCHEMA, `${artifactPath}: mount result carries telemetry record`);
  context.assert(mountResult.metadata.telemetry.operation === 'mount', `${artifactPath}: mount telemetry normalizes operation`);
  context.assert(mountResult.metadata.telemetry.componentId === 'dashboard.health', `${artifactPath}: mount telemetry preserves component id`);
  context.assert(mountResult.metadata.telemetry.scheduleRef === 'component.visible.mount', `${artifactPath}: mount telemetry preserves schedule ref`);
  context.assert(mountResult.metadata.telemetry.fabricLane === 'visible', `${artifactPath}: mount telemetry preserves Fabric lane`);
  context.assert(telemetryCollector.some((record) => record.operation === 'mount'), `${artifactPath}: mount telemetry reaches collector`);

  const mountedElement = fakeRoot.children[0];
  context.assert(mountedElement && mountedElement.listeners['alert-dismissed'], `${artifactPath}: event listener is attached`);
  mountedElement.listeners['alert-dismissed'].handler({ detail: { reason: 'smoke' } });
  context.assert(telemetryCollector.some((record) => record.operation === 'event' && record.metadata.eventName === 'alert-dismissed'), `${artifactPath}: event telemetry reaches collector`);

  const manualResult = adapter.recordComponentTelemetry({
    componentId: 'dashboard.health',
    operation: 'render',
    status: 'failed',
    durationMs: 640,
    fabricContext: mountResult.metadata.fabric,
    backpressureSignal: {
      level: 'high',
      reason: 'render-pressure',
      metadata: {
        token: 'secret'
      }
    },
    metadata: {
      routeRef: 'dashboard',
      correlationId: 'route.dashboard'
    }
  }, { mapping });
  context.assert(manualResult.metadata.telemetry.operation === 'render', `${artifactPath}: manual render telemetry is normalized`);
  context.assert(manualResult.metadata.telemetry.status === 'failed', `${artifactPath}: manual telemetry preserves failed status`);
  context.assert(telemetryCollector.some((record) => record.operation === 'render' && record.status === 'failed'), `${artifactPath}: manual telemetry reaches collector`);

  const fabric = createXtendFabric({
    idPrefix: 'component.lifecycle.telemetry',
    now: () => new Date(Date.UTC(2026, 4, 7, 10, 0, 0))
  });
  const snapshot = fabric.createTelemetrySnapshot({
    componentTelemetry: telemetryCollector,
    correlationId: 'route.dashboard'
  });
  context.assert(snapshot.componentTelemetry.schema === LIFECYCLE_TELEMETRY_SCHEMA, `${artifactPath}: Fabric snapshot exposes component telemetry schema`);
  context.assert(snapshot.componentTelemetry.recordCount >= 3, `${artifactPath}: Fabric snapshot counts component lifecycle records`);
  context.assert(snapshot.componentTelemetry.operations.mount.recordCount >= 1, `${artifactPath}: Fabric snapshot aggregates mount operations`);
  context.assert(snapshot.componentTelemetry.operations.event.recordCount >= 1, `${artifactPath}: Fabric snapshot aggregates event operations`);
  context.assert(snapshot.componentTelemetry.operations.render.failedCount >= 1, `${artifactPath}: Fabric snapshot aggregates failed render operations`);
  context.assert(snapshot.componentTelemetry.components['dashboard.health'].recordCount >= 3, `${artifactPath}: Fabric snapshot aggregates per component`);
  context.assert(snapshot.componentTelemetry.lanes.visible.recordCount >= 1, `${artifactPath}: Fabric snapshot aggregates per lane`);
  context.assert(snapshot.backpressure.signalCount >= 1, `${artifactPath}: Component telemetry contributes to backpressure signals`);
  context.assert(snapshot.backpressure.signals.some((signal) => signal.reason === 'render-pressure'), `${artifactPath}: explicit component backpressure signal is preserved`);
  context.assert(snapshot.backpressure.signals.some((signal) => signal.metadata.token === '[redacted]'), `${artifactPath}: component backpressure metadata is redacted`);

  const fabricStore = createXtendFabric({
    idPrefix: 'component.lifecycle.store',
    now: () => new Date(Date.UTC(2026, 4, 7, 11, 0, 0))
  });
  const storeRoot = createFakeElement('main');
  storeRoot.ownerDocument = createFakeDocument();
  adapter.mountComponent(storeRoot, 'pages.dashboard', {}, {
    mapping,
    fabric: fabricStore
  });
  context.assert(fabricStore.getComponentTelemetry().some((record) => record.componentId === 'pages.dashboard'), `${artifactPath}: Fabric instance ingests adapter component telemetry`);
  const storeSnapshot = fabricStore.createTelemetrySnapshot();
  context.assert(storeSnapshot.componentTelemetry.recordCount >= 1, `${artifactPath}: Fabric snapshot can read stored component telemetry without explicit option`);
}

function runRmtComponentLifecycleTelemetrySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'rmt-component-lifecycle-telemetry',
    label: 'RMT XTend component lifecycle telemetry'
  });
  const contract = readText(CONTRACT_PATH, rootDir);
  const workpackage = readText(WORKPACKAGE_PATH, rootDir);
  const fabricSource = readText('fabric/xtend-fabric.js', rootDir);
  const runtimeSource = readText('xtendrmt/rmt-runtime.esm.js', rootDir);
  const browserSource = readText('xtendrmt/rmt-runtime.browser.js', rootDir);
  const typesSource = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const schemaSource = readText('xtendrmt/rmt.schema.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.componentLifecycleTelemetry;
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);

  context.assert(CONTRACTS.componentLifecycleTelemetry === LIFECYCLE_TELEMETRY_SCHEMA, 'Fabric exports Component Lifecycle Telemetry contract');
  context.assertIncludes(contract, LIFECYCLE_TELEMETRY_SCHEMA, 'Lifecycle Telemetry contract declares stable schema');
  context.assertIncludes(contract, 'no-rmt-kernel-import-of-xtend-types', 'Lifecycle Telemetry contract keeps RMT boundary visible');
  context.assertIncludes(contract, 'mount', 'Lifecycle Telemetry contract documents mount operation');
  context.assertIncludes(contract, 'hydrate', 'Lifecycle Telemetry contract documents hydrate operation');
  context.assertIncludes(contract, 'event', 'Lifecycle Telemetry contract documents event operation');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E10-06 is completed');
  context.assertIncludes(workpackage, 'xtend.epic10.wp06.component-lifecycle-telemetry.v1', 'WP-E10-06 declares workpackage contract');
  context.assertIncludes(fabricSource, 'componentLifecycleTelemetry', 'Fabric runtime declares componentLifecycleTelemetry contract key');
  context.assertIncludes(fabricSource, 'summarizeComponentLifecycleTelemetry', 'Fabric runtime summarizes Component Lifecycle Telemetry');
  context.assertIncludes(fabricSource, 'componentTelemetry:', 'Fabric snapshot returns componentTelemetry section');
  context.assertIncludes(runtimeSource, 'XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA', 'ESM runtime declares Lifecycle Telemetry schema constant');
  context.assertIncludes(browserSource, 'XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA', 'Browser runtime declares Lifecycle Telemetry schema constant');
  context.assertIncludes(runtimeSource, 'recordComponentTelemetry', 'ESM runtime exposes recordComponentTelemetry');
  context.assertIncludes(browserSource, 'recordComponentTelemetry', 'Browser runtime exposes recordComponentTelemetry');
  context.assertIncludes(typesSource, 'RmtXtendComponentLifecycleTelemetry', 'Types expose Component Lifecycle Telemetry');
  context.assertIncludes(schemaSource, 'componentLifecycleTelemetry', 'RMT schema exposes componentLifecycleTelemetry section');
  context.assert(metadata && metadata.schema === LIFECYCLE_TELEMETRY_SCHEMA, 'Package metadata exposes Component Lifecycle Telemetry schema');
  context.assert(metadata.localGate === 'node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json', 'Package metadata exposes local gate');
  context.assertIncludes(scaffoldConfig, 'componentLifecycleTelemetry', 'Scaffold config exposes Component Lifecycle Telemetry section');

  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.esm.js');
  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.browser.js');

  return context.result({
    report: {
      schema: 'xtend.component.lifecycle-telemetry-report.v1',
      fixture: FIXTURE_PATH,
      artifacts: ['fabric/xtend-fabric.js', 'xtendrmt/rmt-runtime.esm.js', 'xtendrmt/rmt-runtime.browser.js']
    }
  });
}

function printRmtComponentLifecycleTelemetryReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT XTend Component Lifecycle Telemetry erfolgreich.',
    failureTitle: 'RMT XTend Component Lifecycle Telemetry fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runRmtComponentLifecycleTelemetrySuite();
  printRmtComponentLifecycleTelemetryReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printRmtComponentLifecycleTelemetryReport,
  runRmtComponentLifecycleTelemetrySuite
};

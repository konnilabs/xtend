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

function createWorkerPrerenderChunk(generation) {
  return {
    kind: 'rmt_template_chunk',
    version: '1.0',
    executionMode: 'worker_prerender_hydrate',
    transport: 'worker',
    rootId: 'worker-root',
    template: {
      id: 'worker-card',
      qualifiedId: 'rkfa.worker.card',
      namespace: 'rkfa.worker',
      documentId: 'rkfa.worker',
      mode: 'html',
      props: []
    },
    target: {
      elementId: 'worker-card',
      selector: '#worker-card',
      ownershipMode: 'hydrate_existing',
      namespace: 'rkfa.worker'
    },
    markup: {
      html: '<article id="worker-card">Worker</article>',
      textContent: 'Worker',
      descriptor: null
    },
    hydration: {
      bindings: [],
      slots: [],
      props: [],
      templateHydration: { mode: 'worker_prerender_hydrate' },
      errorBoundary: {},
      reactivityHints: {},
      ownershipMode: 'hydrate_existing',
      resourceId: 'template.chunk:rkfa.worker.card',
      metadata: {
        hydrationGeneration: generation
      }
    },
    modelSnapshot: {},
    plan: {
      executionMode: 'worker_prerender_hydrate',
      phases: []
    },
    renderedAt: 1
  };
}

function createWorkerExecutionPath(hydrationStats) {
  return {
    normalizeExecutionMode(value, fallbackValue) {
      return value || fallbackValue || 'worker_prerender_hydrate';
    },
    createPrerenderEnvelope(requestInput = {}) {
      return {
        kind: 'rmt_template_prerender_request',
        version: '1.0',
        executionMode: requestInput.executionMode || 'worker_prerender_hydrate',
        prerenderTransport: 'worker',
        rootId: requestInput.rootId || 'worker-root',
        template: requestInput.template || {
          id: 'worker-card',
          qualifiedId: 'rkfa.worker.card',
          namespace: 'rkfa.worker',
          documentId: 'rkfa.worker'
        },
        target: requestInput.target || {},
        model: requestInput.model || {},
        metadata: requestInput.metadata || {},
        plan: {},
        requestedAt: 1
      };
    },
    normalizeChunk(chunkInput) {
      return chunkInput && chunkInput.kind === 'rmt_template_chunk'
        ? chunkInput
        : createWorkerPrerenderChunk('fallback');
    },
    hydrateTemplate(requestInput = {}) {
      hydrationStats.count += 1;
      return {
        executionMode: 'hydrate_prerendered',
        plan: requestInput.chunk && requestInput.chunk.plan || {},
        chunk: requestInput.chunk,
        islandHandle: null,
        bindingSession: null,
        applied: true,
        deferred: false
      };
    },
    prerenderTemplate() {
      return createWorkerPrerenderChunk('generated');
    }
  };
}

function assertWorkerPrerenderInterop(context, rootDir, artifactPath) {
  const modules = createRuntimeModules(context, rootDir, artifactPath);
  if (!modules) return;
  const hydrationStats = { count: 0 };
  const workerAdapter = modules.createRmtTemplateWorkerAdapter({
    executionPath: createWorkerExecutionPath(hydrationStats)
  });
  context.assert(typeof workerAdapter.hydrateResponse === 'function', `${artifactPath}: worker adapter exposes hydrateResponse`);
  context.assert(typeof workerAdapter.rememberHydrationGeneration === 'function', `${artifactPath}: worker adapter exposes generation dev API`);

  const staleResponse = {
    kind: 'rmt_template_prerender_response',
    version: '1.0',
    ok: true,
    transport: 'worker',
    executionMode: 'worker_prerender_hydrate',
    rootId: 'worker-root',
    template: null,
    plan: null,
    request: null,
    metadata: {
      supersessionKey: 'worker-card',
      hydrationGeneration: '1',
      hostServiceRequests: [{ service: 'secrets.read' }]
    },
    worker: {
      serviceRequests: [{ service: 'unsafe.host' }]
    },
    chunk: createWorkerPrerenderChunk('1'),
    superseded: false,
    error: null,
    requestedAt: 1,
    respondedAt: 2
  };
  const staleHydration = workerAdapter.hydrateResponse(staleResponse, {}, {
    hydrationKey: 'worker-card',
    currentGeneration: '2'
  });
  context.assert(staleHydration.ok === false && staleHydration.superseded === true, `${artifactPath}: stale worker response is discarded by generation`);
  context.assert(staleHydration.status === 'superseded', `${artifactPath}: stale worker response reports superseded status`);
  context.assert(hydrationStats.count === 0, `${artifactPath}: stale worker response does not run hydrateTemplate`);
  context.assert(staleHydration.blockedHostServiceRequests === 2, `${artifactPath}: stale worker response blocks host service payloads`);
  context.assert(staleHydration.hostServicesExecuted === 0, `${artifactPath}: worker path does not execute host services`);

  const freshResponse = {
    ...staleResponse,
    metadata: {
      supersessionKey: 'worker-card',
      hydrationGeneration: '2',
      hostServiceRequests: [{ service: 'secrets.read' }]
    },
    worker: null,
    chunk: createWorkerPrerenderChunk('2')
  };
  const freshHydration = workerAdapter.hydrateResponse(freshResponse, {}, {
    hydrationKey: 'worker-card',
    currentGeneration: '2'
  });
  context.assert(freshHydration.ok === true && freshHydration.hydrated === true, `${artifactPath}: matching worker response hydrates`);
  context.assert(freshHydration.trustedDomCommit && freshHydration.trustedDomCommit.mainThread === true, `${artifactPath}: matching worker response records main-thread trusted DOM commit`);
  context.assert(freshHydration.blockedHostServiceRequests === 1, `${artifactPath}: matching worker response still blocks host service payloads`);
  context.assert(freshHydration.hostServicesExecuted === 0, `${artifactPath}: matching worker response does not execute host services`);
  context.assert(hydrationStats.count === 1, `${artifactPath}: matching worker response reaches hydrateTemplate once`);

  context.assert(workerAdapter.rememberHydrationGeneration('worker-card', '3') === true, `${artifactPath}: worker adapter remembers latest hydration generation`);
  context.assert(workerAdapter.getLatestHydrationGeneration('worker-card') === '3', `${artifactPath}: worker adapter exposes latest hydration generation`);
  const rememberedStaleHydration = workerAdapter.hydrateResponse(freshResponse, {}, {
    hydrationKey: 'worker-card'
  });
  context.assert(rememberedStaleHydration.superseded === true, `${artifactPath}: remembered generation supersedes older worker response`);
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
  context.assertIncludes(runtimeSource, 'generation_superseded', 'ESM runtime exposes worker prerender generation supersession');
  context.assertIncludes(browserSource, 'generation_superseded', 'Browser runtime exposes worker prerender generation supersession');
  context.assertIncludes(typesSource, 'RmtXtendComponentFabricContext', 'Types expose Fabric context contract');
  context.assertIncludes(typesSource, 'getLatestHydrationGeneration', 'Types expose worker prerender generation dev API');
  context.assertIncludes(schemaSource, FABRIC_LANE_INGESTION_SCHEMA, 'RMT schema exposes Fabric lane ingestion metadata');
  context.assert(metadata && metadata.schema === FABRIC_LANE_INGESTION_SCHEMA, 'Package metadata exposes Fabric/Lane ingestion schema');
  context.assert(metadata.localGate === 'node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json', 'Package metadata exposes local gate');
  context.assertIncludes(scaffoldConfig, 'componentFabricLaneIngestion', 'Scaffold config exposes Component Fabric/Lane ingestion section');

  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.esm.js');
  assertRuntimeArtifact(context, rootDir, 'xtendrmt/rmt-runtime.browser.js');
  assertWorkerPrerenderInterop(context, rootDir, 'xtendrmt/rmt-runtime.esm.js');
  assertWorkerPrerenderInterop(context, rootDir, 'xtendrmt/rmt-runtime.browser.js');

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

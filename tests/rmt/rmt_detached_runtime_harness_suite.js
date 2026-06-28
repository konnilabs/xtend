const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

const DETACHED_RUNTIME_HARNESS_SCHEMA = 'xtend.rmt.detached-runtime-gate-harness.v1';
const DETACHED_RUNTIME_RESULT_SCHEMA = 'xtend.rmt.detached-runtime-gate-result.v1';
const DETACHED_RUNTIME_TELEMETRY_SCHEMA = 'xtend.rmt.detached-runtime-telemetry.v1';
const BROWSER_SMOKE_COMPAT_SCHEMA = 'xtend.rmt.browser-smoke-compatible-result.v1';

const RMT_CORE_RUNTIME = 'xtendrmt/rmt-core.esm.js';
const RMT_CORE_TYPES = 'xtendrmt/rmt-core.d.ts';
const SURFACE_CONTROLLER_RUNTIME = 'components/xsurfacemanager-controller.js';
const SURFACE_GRAPH_RUNTIME = 'xtendrmt/rmt-surface-resource-graph-runtime.js';
const ACTION_EFFECT_RUNTIME = 'xtendrmt/rmt-action-effect-runtime.js';

function createDetachedElement(tagName = 'div', id = '') {
  return {
    nodeType: 1,
    tagName: String(tagName || 'div').toUpperCase(),
    localName: String(tagName || 'div').toLowerCase(),
    id: String(id || ''),
    attributes: {},
    children: [],
    listeners: {},
    parentNode: null,
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = String(value);
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'id') this.id = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    addEventListener(eventName, handler) {
      const name = String(eventName || '');
      if (!this.listeners[name]) this.listeners[name] = [];
      this.listeners[name].push(handler);
    },
    removeEventListener(eventName, handler) {
      const name = String(eventName || '');
      this.listeners[name] = (this.listeners[name] || []).filter((entry) => entry !== handler);
    },
    appendChild(child) {
      this.children.push(child);
      if (child && typeof child === 'object') child.parentNode = this;
      return child;
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      if (child && typeof child === 'object') child.parentNode = null;
      return child;
    },
    replaceChildren(...nextChildren) {
      this.children.forEach((child) => {
        if (child && typeof child === 'object') child.parentNode = null;
      });
      this.children = [];
      nextChildren.forEach((child) => this.appendChild(child));
    },
    remove() {
      if (this.parentNode && typeof this.parentNode.removeChild === 'function') {
        this.parentNode.removeChild(this);
      }
    }
  };
}

function createDetachedDocumentHarness() {
  const elements = new Map();
  const body = createDetachedElement('body', 'detached-body');
  function register(element) {
    if (element && element.id) elements.set(element.id, element);
    return element;
  }
  const documentTarget = {
    body,
    createElement(tagName) {
      return createDetachedElement(tagName);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: String(text || ''), parentNode: null };
    },
    getElementById(id) {
      return elements.get(String(id || '')) || null;
    },
    querySelector(selector) {
      const normalized = String(selector || '').trim();
      if (normalized.startsWith('#')) return this.getElementById(normalized.slice(1));
      if (normalized.startsWith('[data-testid="') && normalized.endsWith('"]')) {
        const testId = normalized.slice(14, -2);
        return [...elements.values()].find((element) => element.getAttribute && element.getAttribute('data-testid') === testId) || null;
      }
      return null;
    }
  };
  const windowTarget = {
    document: documentTarget,
    navigator: { userAgent: 'xtend-rmt-detached-runtime-harness' },
    performance: {
      now: () => 0,
      getEntriesByType: () => []
    },
    CustomEvent: function CustomEvent(type, init = {}) {
      this.type = type;
      this.detail = init.detail || null;
      this.bubbles = init.bubbles === true;
      this.composed = init.composed === true;
    }
  };
  return {
    body,
    documentTarget,
    elements,
    register,
    windowTarget
  };
}

function createResourceHarness() {
  const observerOpen = [];
  const observerClose = [];
  const streamOpen = [];
  const streamClose = [];
  return {
    observerOpen,
    observerClose,
    streamOpen,
    streamClose,
    adapters: {
      observer: {
        open(resource, context) {
          const handle = { id: resource.id, owner: context.surface && context.surface.owner };
          observerOpen.push(handle);
          return handle;
        },
        close(handle) {
          observerClose.push(handle);
        }
      },
      stream: {
        open(resource, context) {
          const handle = { id: resource.id, owner: context.surface && context.surface.owner };
          streamOpen.push(handle);
          return handle;
        },
        close(handle) {
          streamClose.push(handle);
        }
      }
    }
  };
}

function browserSmokeCompatibleResult(operationRecords, errors = []) {
  const checks = operationRecords.map((record) => ({
    label: record.operation,
    passed: record.status === 'ok',
    details: record.details || null
  }));
  return {
    schema: BROWSER_SMOKE_COMPAT_SCHEMA,
    status: errors.length === 0 && checks.every((check) => check.passed) ? 'passed' : 'failed',
    checks,
    errors
  };
}

async function importEsm(rootDir, relativePath) {
  return import(pathToFileURL(resolveRepoPath(relativePath, rootDir)).href);
}

async function loadSurfaceControllerModule(rootDir) {
  const moduleApi = await importEsm(rootDir, SURFACE_CONTROLLER_RUNTIME);
  if (moduleApi && typeof moduleApi.createSurfaceController === 'function') return moduleApi;
  return globalThis.XTendSurfaceController || {};
}

async function createRmtDetachedRuntimeGateHarness(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const rmtKernel = await importEsm(rootDir, RMT_CORE_RUNTIME);
  const surfaceGraphModule = await importEsm(rootDir, SURFACE_GRAPH_RUNTIME);
  const actionModule = await importEsm(rootDir, ACTION_EFFECT_RUNTIME);
  const surfaceControllerModule = await loadSurfaceControllerModule(rootDir);
  const dom = createDetachedDocumentHarness();
  const mountTarget = dom.register(createDetachedElement('section', 'detached-mount-root'));
  const hydrateTarget = dom.register(createDetachedElement('section', 'detached-hydrate-root'));
  mountTarget.appendChild(createDetachedElement('span', 'stale-child'));
  const telemetryRecords = [];
  const diagnostics = [];
  const surfaceManagerCalls = [];
  const detachedOwners = [];
  const resourceHarness = createResourceHarness();

  function record(operation, status, details = {}) {
    const entry = {
      schema: DETACHED_RUNTIME_TELEMETRY_SCHEMA,
      operation,
      status,
      runtimeKind: 'detached_dom',
      sequence: telemetryRecords.length + 1,
      details
    };
    telemetryRecords.push(entry);
    return entry;
  }

  const detachedRuntime = rmtKernel.createRmtDetachedRuntime({
    windowTarget: dom.windowTarget,
    documentTarget: dom.documentTarget,
    collectBrowserSignals: false,
    probeBrowserFrameOnInit: false,
    enablePrewarmWorker: false,
    namespace: 'rkfa04.detached'
  });
  const surfaceController = surfaceControllerModule.createSurfaceController({
    managerId: 'rkfa04.detached.surface-manager',
    now: () => '2026-06-19T00:00:00.000Z',
    maxDiagnostics: 40
  });
  const surfaceManager = {
    registerSurface(recordInput) {
      surfaceManagerCalls.push({ operation: 'registerSurface', id: recordInput && recordInput.id });
      return surfaceController.registerSurface(recordInput);
    },
    openSurface(id, input) {
      surfaceManagerCalls.push({ operation: 'openSurface', id, input });
      return surfaceController.openSurface(id, input);
    },
    closeSurface(id, reason) {
      surfaceManagerCalls.push({ operation: 'closeSurface', id, reason });
      return surfaceController.closeSurface(id, reason);
    },
    focusSurface(id) {
      surfaceManagerCalls.push({ operation: 'focusSurface', id });
      return surfaceController.focusSurface(id);
    },
    updateSurface(id, patch) {
      surfaceManagerCalls.push({ operation: 'updateSurface', id, patch });
      return surfaceController.updateSurface(id, patch);
    },
    minimizeSurface(id) {
      surfaceManagerCalls.push({ operation: 'minimizeSurface', id });
      return surfaceController.minimizeSurface(id);
    },
    restoreSurface(id) {
      surfaceManagerCalls.push({ operation: 'restoreSurface', id });
      return surfaceController.restoreSurface(id);
    },
    destroySurface(id, input) {
      surfaceManagerCalls.push({ operation: 'destroySurface', id, input });
      return surfaceController.destroySurface(id, input);
    }
  };
  const resourceManager = actionModule.createRmtResourceManager({
    resources: [
      { id: 'resource.detached.observer', kind: 'observer' },
      { id: 'resource.detached.stream', kind: 'stream' }
    ],
    resourceAdapters: resourceHarness.adapters
  });
  const surfaceGraph = surfaceGraphModule.createRmtSurfaceResourceGraphRuntime({
    managerId: 'rkfa04.detached.surface-manager',
    surfaces: [{
      id: 'surface.detached.workspace',
      kind: 'window',
      label: 'Detached Workspace',
      portal: 'portal.detached',
      component: 'x-detached-workspace',
      template: 'template.detached.workspace',
      owner: 'surface.detached.workspace',
      resources: ['resource.detached.observer', 'resource.detached.stream'],
      bounds: { x: 12, y: 16, width: 640, height: 420 }
    }],
    overlays: [],
    portals: [{ id: 'portal.detached', policy: 'region' }],
    resourceManager,
    surfaceManager,
    documentTarget: dom.documentTarget,
    eventRuntime: {
      detachOwner(ownerId) {
        detachedOwners.push(ownerId);
        return { schema: 'xtend.test.detached-owner.v1', owner: ownerId, detachedCount: 1 };
      }
    },
    diagnosticsHub: {
      publish(channel, payload) {
        diagnostics.push({ channel, payload });
      }
    }
  });

  async function runLifecycleScenario() {
    const errors = [];
    let mountHandle = null;
    let hydrateHandle = null;
    try {
      mountHandle = detachedRuntime.mount({
        target: mountTarget,
        rootId: 'root.detached.mount',
        ownershipMode: 'replace_children'
      });
      record('mount', mountHandle && mountHandle.getRootId() === 'root.detached.mount' ? 'ok' : 'failed', {
        rootId: mountHandle && mountHandle.getRootId(),
        ownershipMode: mountHandle && mountHandle.getContract() && mountHandle.getContract().ownershipMode,
        childCountAfterMount: mountTarget.children.length
      });
      hydrateHandle = detachedRuntime.hydrate({
        target: hydrateTarget,
        rootId: 'root.detached.hydrate'
      });
      record('hydrate', hydrateHandle && hydrateHandle.getContract() && hydrateHandle.getContract().ownershipMode === 'hydrate_existing' ? 'ok' : 'failed', {
        rootId: hydrateHandle && hydrateHandle.getRootId(),
        ownershipMode: hydrateHandle && hydrateHandle.getContract() && hydrateHandle.getContract().ownershipMode
      });
      const unmounted = detachedRuntime.unmount(mountHandle, {
        clearChildren: true,
        removeState: true
      });
      record('unmount', unmounted === true ? 'ok' : 'failed', {
        rootId: 'root.detached.mount',
        rootCountAfterUnmount: detachedRuntime.getRenderMan().listRoots().length
      });
      const disposedRoot = hydrateHandle.unmount({
        clearHandlers: true,
        removeState: true
      });
      record('disposeRoot', disposedRoot === true ? 'ok' : 'failed', {
        rootId: 'root.detached.hydrate',
        rootCountAfterDispose: detachedRuntime.getRenderMan().listRoots().length
      });
      const opened = await surfaceGraph.openSurface('surface.detached.workspace');
      record('openSurface', opened && opened.state === 'open' ? 'ok' : 'failed', {
        surfaceId: opened && opened.id,
        resourcesOwned: resourceManager.listOwned('surface.detached.workspace').length
      });
      const destroyed = surfaceGraph.destroySurface('surface.detached.workspace', {
        reason: 'rkfa04-detached-gate'
      });
      const controllerSnapshot = surfaceController.snapshot({ includeDestroyed: true });
      const tombstone = controllerSnapshot.surfaces.find((surface) => surface.id === 'surface.detached.workspace' && surface.tombstone);
      record('destroySurface', destroyed && destroyed.state === 'destroyed' && Boolean(tombstone) ? 'ok' : 'failed', {
        surfaceId: destroyed && destroyed.id,
        releasedResources: tombstone && tombstone.tombstone && tombstone.tombstone.releasedResources || [],
        tombstone: tombstone && tombstone.tombstone || null
      });
      record('resource.release', resourceManager.listOwned('surface.detached.workspace').length === 0 ? 'ok' : 'failed', {
        disposalCount: resourceManager.listDisposals().length,
        observerClosed: resourceHarness.observerClose.length,
        streamClosed: resourceHarness.streamClose.length
      });
    } catch (error) {
      errors.push(error && error.message ? error.message : String(error));
      record('scenario', 'failed', { error: errors[errors.length - 1] });
    }

    const activeSurfaceSnapshot = surfaceController.snapshot();
    const diagnosticSurfaceSnapshot = surfaceController.snapshot({ includeDestroyed: true });
    const result = {
      schema: DETACHED_RUNTIME_RESULT_SCHEMA,
      ok: errors.length === 0 && telemetryRecords.every((entry) => entry.status === 'ok'),
      runtimeKind: detachedRuntime.runtimeKind,
      hostKind: detachedRuntime.hostKind,
      operations: {
        mount: telemetryRecords.find((entry) => entry.operation === 'mount') || null,
        hydrate: telemetryRecords.find((entry) => entry.operation === 'hydrate') || null,
        unmount: telemetryRecords.find((entry) => entry.operation === 'unmount') || null,
        disposeRoot: telemetryRecords.find((entry) => entry.operation === 'disposeRoot') || null,
        openSurface: telemetryRecords.find((entry) => entry.operation === 'openSurface') || null,
        destroySurface: telemetryRecords.find((entry) => entry.operation === 'destroySurface') || null,
        resourceRelease: telemetryRecords.find((entry) => entry.operation === 'resource.release') || null
      },
      snapshots: {
        detachedRuntime: {
          islandCount: detachedRuntime.listIslands().length,
          rootCount: detachedRuntime.getRenderMan().listRoots().length,
          capabilities: detachedRuntime.getCapabilities()
        },
        surfaceController: activeSurfaceSnapshot,
        surfaceControllerDiagnostics: diagnosticSurfaceSnapshot,
        surfaceGraph: surfaceGraph.getSnapshot(),
        resources: {
          ownedCount: resourceManager.listOwned('surface.detached.workspace').length,
          acquisitionCount: resourceManager.listAcquisitions().length,
          disposalCount: resourceManager.listDisposals().length,
          observerOpenCount: resourceHarness.observerOpen.length,
          observerCloseCount: resourceHarness.observerClose.length,
          streamOpenCount: resourceHarness.streamOpen.length,
          streamCloseCount: resourceHarness.streamClose.length
        }
      },
      telemetry: {
        schema: DETACHED_RUNTIME_TELEMETRY_SCHEMA,
        recordCount: telemetryRecords.length,
        records: telemetryRecords.slice()
      },
      diagnostics: diagnostics.slice(),
      surfaceManagerCalls: surfaceManagerCalls.slice(),
      detachedOwners: detachedOwners.slice(),
      browserSmokeCompatible: browserSmokeCompatibleResult(telemetryRecords, errors),
      errors
    };
    return result;
  }

  return {
    schema: DETACHED_RUNTIME_HARNESS_SCHEMA,
    rootDir,
    detachedRuntime,
    documentTarget: dom.documentTarget,
    surfaceController,
    surfaceGraph,
    resourceManager,
    getTelemetryRecords() {
      return telemetryRecords.slice();
    },
    runLifecycleScenario
  };
}

async function runRmtDetachedRuntimeHarnessSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-detached-runtime-harness',
    label: 'RMT Detached Runtime gate harness'
  });
  const coreSource = readText(RMT_CORE_RUNTIME, rootDir);
  const coreTypes = readText(RMT_CORE_TYPES, rootDir);
  const surfaceControllerSource = readText(SURFACE_CONTROLLER_RUNTIME, rootDir);
  const surfaceGraphSource = readText(SURFACE_GRAPH_RUNTIME, rootDir);
  const runnerSource = readText('scripts/run_xtend_tests.js', rootDir);

  [
    RMT_CORE_RUNTIME,
    RMT_CORE_TYPES,
    SURFACE_CONTROLLER_RUNTIME,
    SURFACE_GRAPH_RUNTIME,
    ACTION_EFFECT_RUNTIME
  ].forEach((filePath) => {
    context.assert(fs.existsSync(resolveRepoPath(filePath, rootDir)), `${filePath} exists for detached runtime harness`);
  });
  context.assert(syntaxCheckFile(SURFACE_CONTROLLER_RUNTIME, { rootDir, extension: '.js' }).ok, 'Surface Controller runtime syntax passes');
  context.assert(syntaxCheckFile(SURFACE_GRAPH_RUNTIME, { rootDir, extension: '.js' }).ok, 'Surface Resource Graph runtime syntax passes');
  context.assert(syntaxCheckFile(ACTION_EFFECT_RUNTIME, { rootDir, extension: '.js' }).ok, 'Action Effect runtime syntax passes');
  context.assertIncludes(coreSource, 'createRmtDetachedRuntime', 'RMT runtime exposes createRmtDetachedRuntime');
  context.assertIncludes(coreSource, "runtimeKind: 'detached_dom'", 'RMT runtime marks detached runtime kind');
  context.assertIncludes(coreSource, 'allowDetachedElements: true', 'RMT runtime enables detached element operation');
  context.assertIncludes(coreTypes, 'interface RmtDetachedDomRuntime', 'RMT types expose detached runtime interface');
  context.assertIncludes(coreTypes, 'createRmtDetachedRuntime', 'RMT types expose detached runtime factory');
  context.assertIncludes(surfaceControllerSource, 'xtend.surface.tombstone.v1', 'Surface Controller supports tombstone telemetry');
  context.assertIncludes(surfaceGraphSource, "callSurfaceManager('destroySurface'", 'Surface Resource Graph calls real destroySurface when available');
  context.assertIncludes(surfaceGraphSource, 'releaseOwner', 'Surface Resource Graph releases resource owners');
  context.assertIncludes(surfaceGraphSource, 'detachOwner', 'Surface Resource Graph detaches event owners');
  context.assertIncludes(runnerSource, "id: 'rmt-detached-runtime-harness'", 'Test runner exposes detached runtime harness suite');

  const harness = await createRmtDetachedRuntimeGateHarness({ rootDir });
  const result = await harness.runLifecycleScenario();

  context.assert(harness.schema === DETACHED_RUNTIME_HARNESS_SCHEMA, 'Harness exposes stable schema');
  context.assert(result.schema === DETACHED_RUNTIME_RESULT_SCHEMA, 'Harness result exposes stable schema');
  context.assert(result.ok === true, `Detached runtime lifecycle scenario passes${result.errors.length ? ` (${result.errors.join(', ')})` : ''}`);
  context.assert(result.runtimeKind === 'detached_dom', 'Detached runtime reports detached_dom runtime kind');
  context.assert(result.hostKind === 'detached_dom', 'Detached runtime host adapter reports detached_dom host kind');
  context.assert(result.operations.mount && result.operations.mount.status === 'ok', 'Harness mounts a detached island');
  context.assert(result.operations.hydrate && result.operations.hydrate.status === 'ok', 'Harness hydrates a detached island');
  context.assert(result.operations.unmount && result.operations.unmount.status === 'ok', 'Harness unmounts through runtime API');
  context.assert(result.operations.disposeRoot && result.operations.disposeRoot.status === 'ok', 'Harness exercises disposeRoot through island unmount');
  context.assert(result.operations.destroySurface && result.operations.destroySurface.status === 'ok', 'Harness destroys a Surface through ResourceGraph and SurfaceController');
  context.assert(result.operations.resourceRelease && result.operations.resourceRelease.status === 'ok', 'Harness releases resource ownership on destroy');
  context.assert(result.snapshots.detachedRuntime.rootCount === 0 && result.snapshots.detachedRuntime.islandCount === 0, 'Detached runtime snapshot is empty after unmount/dispose');
  context.assert(result.snapshots.surfaceController.destroyedSurfaceCount === 1, 'Active Surface snapshot reports one destroyed surface');
  context.assert(result.snapshots.surfaceController.surfaceCount === 0, 'Active Surface snapshot hides destroyed tombstones');
  context.assert(
    result.snapshots.surfaceControllerDiagnostics.surfaces.some((surface) => surface.id === 'surface.detached.workspace' && surface.tombstone && surface.tombstone.schema === 'xtend.surface.tombstone.v1'),
    'Diagnostic Surface snapshot exposes destroyed tombstone'
  );
  context.assert(result.snapshots.resources.acquisitionCount === 2 && result.snapshots.resources.disposalCount === 2, 'Resource snapshot records balanced acquisition and disposal');
  context.assert(result.snapshots.resources.observerCloseCount === 1 && result.snapshots.resources.streamCloseCount === 1, 'Resource adapters close observer and stream handles');
  context.assert(result.detachedOwners.includes('surface.detached.workspace'), 'Event owner scope is detached during destroy');
  context.assert(result.telemetry.recordCount >= 7, 'Harness exposes telemetry records for test gates');
  context.assert(result.telemetry.records.every((record) => record.schema === DETACHED_RUNTIME_TELEMETRY_SCHEMA), 'Harness telemetry records carry stable schema');
  context.assert(result.browserSmokeCompatible.schema === BROWSER_SMOKE_COMPAT_SCHEMA, 'Harness emits browser-smoke-compatible result schema');
  context.assert(result.browserSmokeCompatible.status === 'passed', 'Browser-smoke-compatible result passes');
  context.assert(Array.isArray(result.browserSmokeCompatible.checks) && result.browserSmokeCompatible.checks.length === result.telemetry.recordCount, 'Browser-smoke-compatible result mirrors telemetry records as checks');

  return context.result({
    report: {
      schema: DETACHED_RUNTIME_RESULT_SCHEMA,
      runtimeKind: result.runtimeKind,
      telemetryCount: result.telemetry.recordCount,
      destroyedSurfaceCount: result.snapshots.surfaceController.destroyedSurfaceCount,
      resourceDisposalCount: result.snapshots.resources.disposalCount
    }
  });
}

function printRmtDetachedRuntimeHarnessReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Detached Runtime Gate Harness erfolgreich.',
    failureTitle: 'RMT Detached Runtime Gate Harness fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtDetachedRuntimeHarnessSuite()
    .then((result) => {
      printRmtDetachedRuntimeHarnessReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  BROWSER_SMOKE_COMPAT_SCHEMA,
  DETACHED_RUNTIME_HARNESS_SCHEMA,
  DETACHED_RUNTIME_RESULT_SCHEMA,
  DETACHED_RUNTIME_TELEMETRY_SCHEMA,
  createDetachedDocumentHarness,
  createRmtDetachedRuntimeGateHarness,
  printRmtDetachedRuntimeHarnessReport,
  runRmtDetachedRuntimeHarnessSuite
};

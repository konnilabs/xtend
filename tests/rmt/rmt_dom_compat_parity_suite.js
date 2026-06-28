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
const {
  createDetachedDocumentHarness
} = require('./rmt_detached_runtime_harness_suite');

const DOM_COMPAT_PARITY_SCHEMA = 'xtend.rmt.dom-compat-parity.v1';
const DOM_COMPAT_PARITY_REPORT_SCHEMA = 'xtend.rmt.dom-compat-parity-report.v1';
const RMT_CORE_RUNTIME = 'xtendrmt/rmt-core.esm.js';
const RMT_RUNTIME_ESM = 'xtendrmt/rmt-runtime.esm.js';
const RMT_RUNTIME_BROWSER = 'xtendrmt/rmt-runtime.browser.js';
const RMT_CORE_TYPES = 'xtendrmt/rmt-core.d.ts';
const SURFACE_CONTROLLER_RUNTIME = 'components/xsurfacemanager-controller.js';
const SURFACE_CONTROLLER_TYPES = 'components/xsurfacemanager-controller.d.ts';
const SURFACE_MANAGER_RUNTIME = 'components/xsurfacemanager.js';
const SURFACE_CONTROLLER_SOURCE = 'src/components/x-surface-manager/surface-controller.ts';
const SURFACE_RECORD_SOURCE = 'src/components/x-surface-manager/surface-record.ts';
const OWNERSHIP_MODES = Object.freeze([
  'managed_subtree',
  'replace_children',
  'hydrate_existing',
  'observe_only'
]);

async function importEsm(rootDir, relativePath) {
  return import(pathToFileURL(resolveRepoPath(relativePath, rootDir)).href);
}

async function loadSurfaceControllerModule(rootDir) {
  const moduleApi = await importEsm(rootDir, SURFACE_CONTROLLER_RUNTIME);
  if (moduleApi && typeof moduleApi.createSurfaceController === 'function') return moduleApi;
  return globalThis.XTendSurfaceController || {};
}

function createElement(dom, tagName, id) {
  const element = dom.documentTarget.createElement(tagName);
  if (id) {
    element.setAttribute('id', id);
    dom.register(element);
  }
  return element;
}

function createSurfaceDocument(modes = OWNERSHIP_MODES) {
  return {
    kind: 'rmt_document',
    id: 'rkfa05.dom-compat-parity',
    components: [
      {
        id: 'manager.dom-compat',
        kind: 'custom_element',
        tag: 'x-surface-manager'
      },
      {
        id: 'component.dom-compat',
        kind: 'custom_element',
        tag: 'x-dom-compat-surface'
      }
    ],
    surfaces: modes.map((mode) => ({
      id: `surface.${mode}`,
      type: 'window',
      kind: 'window',
      manager: 'manager.dom-compat',
      component: 'component.dom-compat',
      ownershipMode: mode,
      bounds: { x: 4, y: 8, width: 320, height: 180 }
    }))
  };
}

function findSurfaceElement(root, surfaceId) {
  if (!root || typeof root !== 'object') return null;
  if (typeof root.getAttribute === 'function' && root.getAttribute('data-rmt-surface') === surfaceId) return root;
  const children = Array.isArray(root.children) ? root.children : [];
  for (const child of children) {
    const match = findSurfaceElement(child, surfaceId);
    if (match) return match;
  }
  return null;
}

function createFakeSurfaceManager(dom, surfaceControllerModule) {
  const controller = surfaceControllerModule.createSurfaceController({
    managerId: 'manager.dom-compat',
    now: () => '2026-06-19T00:00:00.000Z'
  });
  const manager = createElement(dom, 'x-surface-manager', 'manager.dom-compat');
  manager.setAttribute('manager-id', 'manager.dom-compat');
  manager.registered = [];
  manager.cleanup = [];
  manager.registerSurface = function registerSurface(record) {
    this.registered.push(record);
    return controller.registerSurface(record);
  };
  manager.destroySurface = function destroySurface(id, options = {}) {
    const surfaceId = String(id || '').trim();
    const element = findSurfaceElement(this, surfaceId);
    const removedElement = Boolean(element && (
      options.removeElement === true
      || element.getAttribute('data-rmt-materialized-surface') === 'true'
      || element.getAttribute('data-rmt-native-surface') === 'true'
    ));
    if (removedElement && element.parentNode && typeof element.parentNode.removeChild === 'function') {
      element.parentNode.removeChild(element);
    }
    this.cleanup.push({ surfaceId, removedElement, removeElement: options.removeElement === true });
    return controller.destroySurface(surfaceId, options);
  };
  manager.snapshot = function snapshot(options = {}) {
    return controller.snapshot(options);
  };
  manager.readSnapshot = manager.snapshot;
  dom.body.appendChild(manager);
  return { controller, manager };
}

function attachSurfaceElement(dom, manager, surfaceId, options = {}) {
  const element = createElement(dom, 'x-surface-window', `${surfaceId}.element`);
  element.setAttribute('data-rmt-surface', surfaceId);
  element.setAttribute('surface-id', surfaceId);
  if (options.materialized === true) {
    element.setAttribute('data-rmt-materialized-surface', 'true');
    element.setAttribute('data-rmt-native-surface', 'true');
  }
  manager.appendChild(element);
  return element;
}

function assertOwnershipModeParity(context, runtimeScenarios, snapshot) {
  OWNERSHIP_MODES.forEach((mode) => {
    const runtimeScenario = runtimeScenarios.find((entry) => entry.mode === mode);
    const surfaceRecord = snapshot.surfaces.find((surface) => surface.id === `surface.${mode}`);
    context.assert(runtimeScenario && runtimeScenario.contractOwnershipMode === mode, `DomCompat runtime contract preserves ${mode}`);
    context.assert(surfaceRecord && surfaceRecord.ownershipMode === mode, `Surface snapshot preserves ${mode} ownership`);
  });
}

async function runDomCompatParityScenario(rootDir) {
  const rmtKernel = await importEsm(rootDir, RMT_CORE_RUNTIME);
  const surfaceControllerModule = await loadSurfaceControllerModule(rootDir);
  const dom = createDetachedDocumentHarness();
  const domCompat = rmtKernel.createRmtDomCompat({
    windowTarget: dom.windowTarget,
    document: dom.documentTarget,
    allowDetachedElements: true
  });
  const runtime = rmtKernel.createRmtDetachedRuntime({
    windowTarget: dom.windowTarget,
    document: dom.documentTarget
  });
  const runtimeScenarios = OWNERSHIP_MODES.map((mode) => {
    const target = createElement(dom, 'section', `target.${mode}`);
    const sentinel = createElement(dom, 'span', `sentinel.${mode}`);
    target.appendChild(sentinel);
    dom.body.appendChild(target);
    const rootId = `root.${mode}`;
    const handle = mode === 'hydrate_existing'
      ? runtime.hydrate({ target, rootId })
      : mode === 'observe_only'
        ? runtime.observe({ target, rootId })
        : runtime.mount({ target, rootId, ownershipMode: mode });
    const island = runtime.listIslands().find((entry) => entry.rootId === rootId) || null;
    const childCountAfterMount = target.children.length;
    const unmounted = handle.unmount({
      clearChildren: true,
      clearHandlers: true,
      removeState: true
    });
    return {
      mode,
      contractOwnershipMode: island && island.ownershipMode,
      childCountAfterMount,
      childCountAfterUnmount: target.children.length,
      targetPreserved: target.parentNode === dom.body,
      sentinelPreserved: sentinel.parentNode === target,
      unmounted
    };
  });

  const adapter = rmtKernel.createRmtSurfaceAdapter({ domCompat });
  const mapping = adapter.mapSurfaces(createSurfaceDocument());
  const unsupportedMapping = adapter.mapSurfaces(createSurfaceDocument(['adapter_owned_dom']));
  const { controller, manager } = createFakeSurfaceManager(dom, surfaceControllerModule);
  const registerResult = adapter.registerSurface(mapping, { managerElement: manager });
  const ownedElement = attachSurfaceElement(dom, manager, 'surface.replace_children', { materialized: true });
  const externalPreservedElement = attachSurfaceElement(dom, manager, 'surface.hydrate_existing');
  const externalRemovedElement = attachSurfaceElement(dom, manager, 'surface.observe_only');
  const ownedDestroy = adapter.destroySurface('surface.replace_children', {
    reason: 'rkfa05-owned-destroy'
  }, { mapping, managerElement: manager });
  const externalPreservedDestroy = adapter.destroySurface('surface.hydrate_existing', {
    reason: 'rkfa05-external-preserve'
  }, { mapping, managerElement: manager });
  const externalRemovedDestroy = adapter.destroySurface('surface.observe_only', {
    reason: 'rkfa05-external-remove',
    removeElement: true
  }, { mapping, managerElement: manager });
  const snapshot = controller.snapshot({ includeDestroyed: true });

  return {
    schema: DOM_COMPAT_PARITY_SCHEMA,
    hostContract: domCompat.getHostContract(),
    runtimeScenarios,
    mapping,
    unsupportedMapping,
    registerResult,
    ownedDestroy,
    externalPreservedDestroy,
    externalRemovedDestroy,
    snapshot,
    cleanup: manager.cleanup.slice(),
    domState: {
      ownedRemoved: ownedElement.parentNode === null,
      externalPreserved: externalPreservedElement.parentNode === manager,
      externalRemoved: externalRemovedElement.parentNode === null
    }
  };
}

async function runRmtDomCompatParitySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-dom-compat-parity',
    label: 'RMT DomCompat and SurfaceManager ownership parity'
  });
  const coreSource = readText(RMT_CORE_RUNTIME, rootDir);
  const runtimeSource = readText(RMT_RUNTIME_ESM, rootDir);
  const browserSource = readText(RMT_RUNTIME_BROWSER, rootDir);
  const typesSource = readText(RMT_CORE_TYPES, rootDir);
  const controllerSource = readText(SURFACE_CONTROLLER_RUNTIME, rootDir);
  const managerSource = readText(SURFACE_MANAGER_RUNTIME, rootDir);
  const sourceController = readText(SURFACE_CONTROLLER_SOURCE, rootDir);
  const sourceRecord = readText(SURFACE_RECORD_SOURCE, rootDir);
  const runnerSource = readText('scripts/run_xtend_tests.js', rootDir);

  [
    RMT_CORE_RUNTIME,
    RMT_RUNTIME_ESM,
    RMT_RUNTIME_BROWSER,
    RMT_CORE_TYPES,
    SURFACE_CONTROLLER_RUNTIME,
    SURFACE_CONTROLLER_TYPES,
    SURFACE_MANAGER_RUNTIME,
    SURFACE_CONTROLLER_SOURCE,
    SURFACE_RECORD_SOURCE
  ].forEach((filePath) => {
    context.assert(fs.existsSync(resolveRepoPath(filePath, rootDir)), `${filePath} exists for DomCompat parity`);
  });
  [
    RMT_CORE_RUNTIME,
    RMT_RUNTIME_ESM,
    RMT_RUNTIME_BROWSER,
    SURFACE_CONTROLLER_RUNTIME,
    SURFACE_MANAGER_RUNTIME
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  [
    coreSource,
    runtimeSource,
    browserSource
  ].forEach((source, index) => {
    const label = index === 0 ? 'core' : index === 1 ? 'esm runtime' : 'browser runtime';
    context.assertIncludes(source, 'rmt.surface.dom_compat_ownership_unsupported', `${label} exposes DomCompat ownership diagnostic`);
    context.assertIncludes(source, 'data-rmt-ownership-mode', `${label} materializes ownership attribute`);
    context.assertIncludes(source, "'ownershipMode'", `${label} maps ownershipMode field`);
  });
  context.assertIncludes(typesSource, 'ownershipMode: RmtOwnershipMode | string;', 'RMT types expose mapped surface ownership');
  context.assertIncludes(typesSource, "'rmt.surface.dom_compat_ownership_unsupported'", 'RMT types expose DomCompat ownership diagnostic code');
  context.assertIncludes(controllerSource, 'ownershipMode:', 'Surface Controller runtime mirrors ownershipMode');
  context.assertIncludes(readText(SURFACE_CONTROLLER_TYPES, rootDir), 'ownershipMode: string | null;', 'Surface Controller declaration mirrors ownershipMode');
  context.assertIncludes(sourceController, 'ownershipMode:', 'Surface Controller source mirrors ownershipMode');
  context.assertIncludes(sourceRecord, 'ownershipMode: string | null;', 'Surface record source exposes ownershipMode');
  context.assertIncludes(managerSource, "options.removeElement === true", 'SurfaceManager destroy keeps explicit removeElement contract');
  context.assertIncludes(managerSource, "data-rmt-materialized-surface') === 'true'", 'SurfaceManager destroy removes materialized owned surfaces');
  context.assertIncludes(runnerSource, "id: 'rmt-dom-compat-parity'", 'Test runner exposes DomCompat parity suite');

  const scenario = await runDomCompatParityScenario(rootDir);
  context.assert(scenario.schema === DOM_COMPAT_PARITY_SCHEMA, 'DomCompat parity scenario exposes stable schema');
  context.assert(Array.isArray(scenario.hostContract.ownershipModes), 'DomCompat host contract exposes ownership modes');
  OWNERSHIP_MODES.forEach((mode) => {
    context.assert(scenario.hostContract.ownershipModes.includes(mode), `DomCompat host contract supports ${mode}`);
  });
  const replaceScenario = scenario.runtimeScenarios.find((entry) => entry.mode === 'replace_children');
  context.assert(replaceScenario && replaceScenario.childCountAfterMount === 0 && replaceScenario.childCountAfterUnmount === 0, 'replace_children clears owned children on mount and unmount');
  context.assert(scenario.runtimeScenarios.filter((entry) => entry.mode !== 'replace_children').every((entry) => entry.sentinelPreserved === true), 'non-replace ownership modes preserve existing host children on unmount');
  context.assert(scenario.runtimeScenarios.every((entry) => entry.targetPreserved === true && entry.unmounted === true), 'Runtime unmount preserves host elements for all ownership modes');
  context.assert(scenario.mapping.modelFields.includes('ownershipMode'), 'SurfaceAdapter mapping declares ownershipMode model field');
  context.assert(scenario.mapping.surfaces.every((surface) => surface.ownershipMode && surface.requestedOwnershipMode === surface.ownershipMode), 'SurfaceAdapter maps supported ownership modes without degradation');
  context.assert(!scenario.mapping.diagnostics.some((entry) => entry.code === 'rmt.surface.dom_compat_ownership_unsupported'), 'SurfaceAdapter does not degrade supported DomCompat ownership modes');
  context.assert(scenario.unsupportedMapping.diagnostics.some((entry) => entry.code === 'rmt.surface.dom_compat_ownership_unsupported'), 'SurfaceAdapter diagnoses unsupported DomCompat ownership mode');
  context.assert(scenario.registerResult.ok === true && scenario.registerResult.metadata.registeredCount === OWNERSHIP_MODES.length, 'SurfaceAdapter registers ownership-aware surfaces');
  assertOwnershipModeParity(context, scenario.runtimeScenarios, scenario.snapshot);
  context.assert(scenario.ownedDestroy.ok === true && scenario.domState.ownedRemoved === true, 'Owned materialized Surface element is removed on destroy');
  context.assert(scenario.externalPreservedDestroy.ok === true && scenario.domState.externalPreserved === true, 'External host Surface element is preserved without removeElement');
  context.assert(scenario.externalRemovedDestroy.ok === true && scenario.domState.externalRemoved === true, 'External host Surface element is removed with removeElement true');
  context.assert(scenario.cleanup.some((entry) => entry.surfaceId === 'surface.replace_children' && entry.removedElement === true), 'SurfaceManager cleanup records owned element removal');
  context.assert(scenario.cleanup.some((entry) => entry.surfaceId === 'surface.hydrate_existing' && entry.removedElement === false), 'SurfaceManager cleanup records preserved external host');
  context.assert(scenario.cleanup.some((entry) => entry.surfaceId === 'surface.observe_only' && entry.removedElement === true && entry.removeElement === true), 'SurfaceManager cleanup records explicit external removal');

  return context.result({
    report: {
      schema: DOM_COMPAT_PARITY_REPORT_SCHEMA,
      ownershipModes: OWNERSHIP_MODES.slice(),
      mappedSurfaceCount: scenario.mapping.surfaceCount,
      destroyedSurfaceCount: scenario.snapshot.destroyedSurfaceCount,
      cleanupCount: scenario.cleanup.length
    }
  });
}

function printRmtDomCompatParityReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT DomCompat Parity erfolgreich.',
    failureTitle: 'RMT DomCompat Parity fehlgeschlagen:'
  });
}

if (require.main === module) {
  runRmtDomCompatParitySuite()
    .then((result) => {
      printRmtDomCompatParityReport(result);
      if (!result.ok) process.exit(1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  DOM_COMPAT_PARITY_REPORT_SCHEMA,
  DOM_COMPAT_PARITY_SCHEMA,
  printRmtDomCompatParityReport,
  runRmtDomCompatParitySuite
};

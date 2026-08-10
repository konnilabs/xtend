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
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  REQUIRED_ARTIFACTS,
  RUNTIME_ARTIFACTS,
  SURFACE_ADAPTER_DIAGNOSTICS,
  SURFACE_ADAPTER_ID,
  SURFACE_ADAPTER_KIND,
  SURFACE_ADAPTER_OPERATIONS,
  SURFACE_ADAPTER_SCHEMA,
  SURFACE_MANAGER_ADAPTER_RUNTIME_BACKLOG,
  SURFACE_MANAGER_ADAPTER_RUNTIME_FIXTURE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_LOCAL_GATE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_MODULE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_PACKAGE_SCRIPT,
  SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA,
  SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA,
  SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS,
  SURFACE_MANAGER_ADAPTER_RUNTIME_SUITE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET,
  SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE,
  SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE_DOC,
  createSurfaceManagerAdapterRuntimePlan,
  createSurfaceManagerAdapterRuntimeReport,
  validateSurfaceManagerAdapterRuntimePlan
} = require('../../catalog/surface-manager-adapter-runtime');

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertTextIncludesAll(context, text, expected, label) {
  expected.forEach((entry) => {
    context.assertIncludes(text, entry, `${label} includes ${entry}`);
  });
}

function createSandbox() {
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
    navigator: { userAgent: 'xtend-surface-adapter-runtime-test' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
      querySelector() {
        return null;
      },
      createElement(tagName) {
        return {
          tagName: String(tagName || '').toUpperCase(),
          attributes: {},
          children: [],
          setAttribute(name, value) {
            this.attributes[name] = String(value);
          },
          getAttribute(name) {
            return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
          },
          appendChild(child) {
            this.children.push(child);
            return child;
          },
          dispatchEvent() {
            return true;
          }
        };
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  return sandbox;
}

function evaluateXtendRmtArtifact(context, relativePath, rootDir) {
  const source = readText(relativePath, rootDir);
  const sandbox = createSandbox();
  const executableSource = relativePath.endsWith('.esm.js')
    ? source
      .replace(/^import\s+\{[^;]*\}\s+from\s+['"][^'"]+['"];\s*$/gmu, '')
      .replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '')
    : source;
  try {
    vm.runInNewContext(executableSource, sandbox, { filename: relativePath });
  } catch (error) {
    context.fail(`${relativePath} evaluates with createRmtSurfaceAdapter (${error.message})`);
    return null;
  }
  return sandbox.AppModules || null;
}

function createFakeSurfaceManager() {
  const manager = {
    id: '',
    attributes: Object.create(null),
    registered: [],
    operations: [],
    events: [],
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    dispatchEvent(event) {
      this.events.push(event);
      return true;
    },
    registerSurface(record) {
      this.registered.push(record);
      this.operations.push({ operation: 'registerSurface', id: record.id, record });
      return { ok: true, operation: 'registerSurface', metadata: { surfaceId: record.id } };
    },
    openSurface(id, input) {
      this.operations.push({ operation: 'openSurface', id, input });
      return { ok: true, operation: 'openSurface', metadata: { surfaceId: id } };
    },
    closeSurface(id, reason) {
      this.operations.push({ operation: 'closeSurface', id, reason });
      return { ok: true, operation: 'closeSurface', metadata: { surfaceId: id, reason } };
    },
    focusSurface(id) {
      this.operations.push({ operation: 'focusSurface', id });
      return { ok: true, operation: 'focusSurface', metadata: { surfaceId: id } };
    },
    moveSurface(id, bounds) {
      this.operations.push({ operation: 'moveSurface', id, bounds });
      return { ok: true, operation: 'moveSurface', metadata: { surfaceId: id } };
    },
    resizeSurface(id, bounds) {
      this.operations.push({ operation: 'resizeSurface', id, bounds });
      return { ok: true, operation: 'resizeSurface', metadata: { surfaceId: id } };
    },
    dockSurface(id, placement, mode) {
      this.operations.push({ operation: 'dockSurface', id, placement, mode });
      return { ok: true, operation: 'dockSurface', metadata: { surfaceId: id, placement, mode } };
    },
    updateSurface(id, patch) {
      this.operations.push({ operation: 'updateSurface', id, patch });
      return { ok: true, operation: 'updateSurface', metadata: { surfaceId: id, patch } };
    },
    snapshot() {
      return {
        schema: 'xtend.surface.snapshot.v1',
        surfaces: this.registered.map((record) => ({
          id: record.id,
          type: record.type,
          manager: record.manager,
          contentRef: record.contentRef
        }))
      };
    }
  };
  return manager;
}

function runSurfaceManagerAdapterRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'surface-adapter-runtime',
    label: 'SurfaceManager productive xtend.surface adapter runtime'
  });
  const plan = createSurfaceManagerAdapterRuntimePlan({ rootDir });
  const validation = validateSurfaceManagerAdapterRuntimePlan(plan);
  const report = createSurfaceManagerAdapterRuntimeReport({ rootDir, plan });
  const fixture = readJson(SURFACE_MANAGER_ADAPTER_RUNTIME_FIXTURE, rootDir);
  const coreTypes = readText('xtendrmt/rmt-core.d.ts', rootDir);
  const manifest = readJson('xtendrmt/rmt-manifest.json', rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.surfaceManagerAdapterRuntime;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const backlog = readText(SURFACE_MANAGER_ADAPTER_RUNTIME_BACKLOG, rootDir);
  const workpackageDoc = readText(SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE_DOC, rootDir);

  REQUIRED_ARTIFACTS.forEach((filePath) => {
    assertFileExists(context, filePath, rootDir, `${filePath} exists as surface adapter runtime artifact`);
  });

  [
    SURFACE_MANAGER_ADAPTER_RUNTIME_MODULE,
    SURFACE_MANAGER_ADAPTER_RUNTIME_SUITE,
    ...RUNTIME_ARTIFACTS.filter((artifact) => artifact.endsWith('.js'))
  ].forEach((filePath) => {
    const syntax = syntaxCheckFile(filePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${filePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  context.assert(plan.schema === SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA, 'Surface adapter runtime schema is stable');
  context.assert(plan.reportSchema === SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA, 'Surface adapter runtime report schema is stable');
  context.assert(plan.adapterSchema === SURFACE_ADAPTER_SCHEMA, 'Surface adapter runtime reuses xtend.surface adapter schema');
  context.assert(plan.adapterId === SURFACE_ADAPTER_ID, 'Surface adapter runtime uses xtend.surface adapter id');
  context.assert(plan.adapterKind === SURFACE_ADAPTER_KIND, 'Surface adapter runtime declares surface_adapter kind');
  context.assert(plan.workpackage === SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE, 'Surface adapter runtime belongs to WP-SM-10');
  context.assert(plan.status === SURFACE_MANAGER_ADAPTER_RUNTIME_STATUS, 'Surface adapter runtime status is implemented');
  context.assert(plan.targetReadiness === SURFACE_MANAGER_ADAPTER_RUNTIME_TARGET, 'Surface adapter runtime target readiness is stable');
  context.assert(plan.runtimeBoundary.claimsProductiveAdapterRuntime === true, 'WP-SM-10 claims productive surface adapter runtime');
  context.assert(plan.runtimeBoundary.createsSecondRegistry === false, 'Surface adapter runtime does not create a second registry');
  context.assert(plan.runtimeBoundary.materializesDom === false, 'WP-SM-10 keeps DOM materialization for WP-SM-11');
  context.assert(validation.ok === true, 'Surface adapter runtime plan validates');
  context.assert(report.ok === true, 'Surface adapter runtime report validates');
  assertIncludesAll(context, plan.operations, SURFACE_ADAPTER_OPERATIONS, 'Surface adapter runtime operations');
  assertIncludesAll(context, plan.diagnostics, SURFACE_ADAPTER_DIAGNOSTICS, 'Surface adapter runtime diagnostics');

  const evaluatedArtifacts = [
    'xtendrmt/rmt-core.esm.js',
    'xtendrmt/rmt-runtime.esm.js',
    'xtendrmt/rmt-runtime.browser.js'
  ].map((artifact) => ({ artifact, modules: evaluateXtendRmtArtifact(context, artifact, rootDir) }));

  evaluatedArtifacts.forEach(({ artifact, modules }) => {
    if (!modules) return;
    context.assert(typeof modules.createRmtSurfaceAdapter === 'function', `${artifact} exposes createRmtSurfaceAdapter`);
    context.assert(typeof modules.createRmtSurfaceAdapter === 'function', `${artifact} exposes legacy createRmtSurfaceAdapter`);
  });

  const coreModules = evaluatedArtifacts.find((entry) => entry.artifact === 'xtendrmt/rmt-core.esm.js').modules;
  if (coreModules && typeof coreModules.createRmtSurfaceAdapter === 'function') {
    const adapter = coreModules.createRmtSurfaceAdapter();
    const format = coreModules.createRmtFormat();
    const mapping = adapter.mapSurfaces(fixture);
    const manager = createFakeSurfaceManager();
    const publishedDiagnostics = [];
    const adapterWithDiagnostics = coreModules.createRmtSurfaceAdapter({
      diagnosticsHub: {
        publish(event) {
          publishedDiagnostics.push(event);
        }
      },
      windowTarget: createSandbox()
    });
    const registry = format.createRuntimeRegistries(fixture);
    const registerResult = adapter.registerSurface(mapping, { managerElement: manager });
    const openResult = adapter.openSurface('surface.editor', { bounds: { x: 12, y: 16 } }, { mapping, managerElement: manager });
    const closeResult = adapter.closeSurface('surface.commandPalette', 'test-close', { mapping, managerElement: manager });
    const focusResult = adapter.focusSurface('surface.inspector', {}, { mapping, managerElement: manager });
    const moveResult = adapter.moveSurface('surface.inspector', { x: 120, y: 144 }, { mapping, managerElement: manager });
    const resizeResult = adapter.resizeSurface('surface.editor', { width: 720, height: 460 }, { mapping, managerElement: manager });
    const dockResult = adapter.dockSurface('surface.properties', 'right', 'docked', { mapping, managerElement: manager });
    const undockResult = adapter.undockSurface('surface.properties', { mapping, managerElement: manager });
    const snapshotResult = adapter.snapshotSurfaces(mapping, { managerElement: manager });
    const diagnosticResult = adapterWithDiagnostics.emitDiagnostic(
      { code: 'rmt.surface.diagnostic', message: 'runtime probe', level: 'info' },
      { surfaceId: 'surface.inspector' },
      { managerElement: manager }
    );

    context.assert(adapter.schema === SURFACE_ADAPTER_SCHEMA, 'createRmtSurfaceAdapter returns xtend.surface adapter schema');
    context.assert(adapter.kind === SURFACE_ADAPTER_KIND, 'createRmtSurfaceAdapter returns surface_adapter kind');
    context.assert(adapter.definition.metadata.runtimeImplemented === true, 'Surface adapter runtime metadata is productive');
    context.assert(adapter.definition.metadata.createsSecondRegistry === false, 'Surface adapter definition refuses second registry');
    assertIncludesAll(context, adapter.runtimeSurface, SURFACE_ADAPTER_OPERATIONS, 'Adapter runtimeSurface');
    assertIncludesAll(context, adapter.listDiagnosticCodes(), SURFACE_ADAPTER_DIAGNOSTICS, 'Adapter diagnostic codes');
    context.assert(mapping.schema === SURFACE_ADAPTER_SCHEMA, 'Surface adapter maps to adapter schema');
    context.assert(mapping.surfaceCount === 6, 'Surface adapter maps six native surfaces');
    context.assert(mapping.surfaces[0].componentRecord && mapping.surfaces[0].componentRecord.id === 'workbench.inspector', 'Surface mapping resolves component record');
    context.assert(mapping.surfaces[0].managerRecord && mapping.surfaces[0].managerRecord.tag === 'x-surface-manager', 'Surface mapping resolves manager component record');
    context.assert(mapping.surfaces[0].routeRecord && mapping.surfaces[0].routeRecord.id === 'workbench', 'Surface mapping resolves route record');
    context.assert(mapping.surfaces[0].scheduleRecord && mapping.surfaces[0].scheduleRecord.id === 'surface.user-blocking.open', 'Surface mapping resolves schedule record');
    context.assert(!Object.prototype.hasOwnProperty.call(registry, 'surfaceRegistry'), 'Runtime registries still do not create a second surface registry');
    context.assert(registerResult.ok === true && registerResult.metadata.registeredCount === 6, 'Surface adapter registers mapped surfaces on x-surface-manager target');
    context.assert(manager.getAttribute('manager-id') === null, 'Surface adapter does not mutate manager-id on the host-owned manager element');
    context.assert(manager.registered.every((record) => record.manager === 'workbench.manager'), 'Registered controller records use the native manager reference as their fallback runtime id');
    context.assert(manager.registered[0].contentRef === 'workbench.inspector', 'Registered controller record keeps RMT component as contentRef');
    context.assert(openResult.ok === true && manager.operations.some((operation) => operation.operation === 'openSurface' && operation.id === 'surface.editor'), 'Surface adapter opens a mapped surface');
    context.assert(closeResult.ok === true && manager.operations.some((operation) => operation.operation === 'closeSurface' && operation.reason === 'test-close'), 'Surface adapter closes a mapped surface');
    context.assert(focusResult.ok === true && moveResult.ok === true && resizeResult.ok === true, 'Surface adapter forwards focus, move and resize operations');
    context.assert(dockResult.ok === true && dockResult.operation === 'dockSurface', 'Surface adapter forwards dock operation');
    context.assert(undockResult.ok === true && undockResult.operation === 'undockSurface', 'Surface adapter exposes undock operation');
    context.assert(snapshotResult.ok === true && snapshotResult.metadata.source === 'x-surface-manager' && snapshotResult.metadata.surfaceCount === 6, 'Surface adapter snapshots through x-surface-manager');
    context.assert(diagnosticResult.ok === true && publishedDiagnostics.length === 1 && manager.events.length === 1, 'Surface adapter emits diagnostics through host hooks');
  }

  assertTextIncludesAll(context, coreTypes, [
    'RmtSurfaceAdapter',
    'RmtSurfaceAdapterMapping',
    'RmtSurfaceMappedSurface',
    'RmtSurfaceAdapterRuntimeContract',
    'createRmtSurfaceAdapter',
    'createRmtSurfaceAdapter'
  ], 'RMT type artifact surface adapter runtime');
  assertIncludesAll(context, manifest.artifactParityContracts[0].requiredFactories, ['createRmtSurfaceAdapter'], 'RMT manifest artifact parity factories');
  assertIncludesAll(context, manifest.artifactParityContracts[0].requiredContractIds, [SURFACE_ADAPTER_SCHEMA], 'RMT manifest artifact parity contracts');
  context.assert(manifest.entryPoints.appModulesFactories.surfaceAdapter === 'createRmtSurfaceAdapter', 'RMT manifest exposes surface adapter factory');
  assertIncludesAll(context, manifest.entryPoints.buildTargets[1].namedExports, ['createRmtSurfaceAdapter'], 'RMT manifest ESM exports include surface adapter');
  context.assert(metadata && metadata.schema === SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA, 'Package metadata exposes surface adapter runtime schema');
  context.assert(metadata && metadata.localGate === SURFACE_MANAGER_ADAPTER_RUNTIME_LOCAL_GATE, 'Package metadata exposes surface adapter runtime gate');
  context.assert(metadata && metadata.packageScript === SURFACE_MANAGER_ADAPTER_RUNTIME_PACKAGE_SCRIPT, 'Package metadata exposes surface adapter runtime package script');
  context.assert(packageManifest.scripts && packageManifest.scripts['test:surface-adapter-runtime'] === 'node scripts/run_xtend_tests.js surface-adapter-runtime', 'Package script test:surface-adapter-runtime exists');
  context.assertIncludes(runner, "require('../tests/rmt/surface_manager_adapter_runtime_suite')", 'Runner imports surface adapter runtime suite');
  context.assertIncludes(runner, "id: 'surface-adapter-runtime'", 'Runner registers surface adapter runtime suite');
  assertTextIncludesAll(context, backlog, [
    '`WP-SM-10` | P0 | completed',
    'Produktive `xtend.surface` Adapter Runtime bauen',
    'WP-SM-11'
  ], 'Surface adapter runtime backlog status');
  assertTextIncludesAll(context, workpackageDoc, [
    'Status: `completed`',
    SURFACE_MANAGER_ADAPTER_RUNTIME_SCHEMA,
    SURFACE_MANAGER_ADAPTER_RUNTIME_LOCAL_GATE,
    'no-second-surface-registry',
    'WP-SM-11'
  ], 'Surface adapter runtime workpackage doc');

  return context.result({
    report: {
      schema: SURFACE_MANAGER_ADAPTER_RUNTIME_REPORT_SCHEMA,
      workpackage: SURFACE_MANAGER_ADAPTER_RUNTIME_WORKPACKAGE,
      adapterId: SURFACE_ADAPTER_ID,
      runtimeFactory: 'createRmtSurfaceAdapter',
      operations: SURFACE_ADAPTER_OPERATIONS.length,
      diagnostics: SURFACE_ADAPTER_DIAGNOSTICS.length
    }
  });
}

function printSurfaceManagerAdapterRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'SurfaceManager Adapter Runtime erfolgreich.',
    failureTitle: 'SurfaceManager Adapter Runtime fehlgeschlagen:'
  });
}

module.exports = {
  printSurfaceManagerAdapterRuntimeReport,
  runSurfaceManagerAdapterRuntimeSuite
};

if (require.main === module) {
  const result = runSurfaceManagerAdapterRuntimeSuite();
  printSurfaceManagerAdapterRuntimeReport(result);
  process.exit(result.ok ? 0 : 1);
}

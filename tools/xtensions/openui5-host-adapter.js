'use strict';

const {
  REQUIRED_HOST_CONTROLLER_METHODS,
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA,
  createLifecycleRecord,
  normalizeHostControllerResult
} = require('./host-controller-contract');
const {
  XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
  XTENSIONS_SURFACE_EVENT_SCHEMA
} = require('./signal-bridge-contract');

const XTENSIONS_OPENUI5_ADAPTER_SCHEMA = 'xtend.xtensions.openui5-adapter.v1';
const XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA = 'xtend.xtensions.openui5-loader-boundary.v1';
const XTENSIONS_OPENUI5_REPORT_SCHEMA = 'xtend.xtensions.openui5-adapter-report.v1';
const XTENSIONS_OPENUI5_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.openui5-adapter-diagnostic.v1';
const XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH = 'tools/xtensions/openui5-host-adapter.js';
const XTENSIONS_OPENUI5_ADAPTER_TYPES_PATH = 'tools/xtensions/openui5-host-adapter.d.ts';
const XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH = 'tests/xtensions/xtensions_openui5_host_adapter_suite.js';
const XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH = 'tests/fixtures/xtensions/openui5-host-adapter-valid.json';
const XTENSIONS_OPENUI5_ADAPTER_CONTRACT_PATH = 'development/XTensions-OpenUI5-Host-Adapter-Contract.md';
const XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE = 'XTN-16';
const XTENSIONS_OPENUI5_ADAPTER_PACKAGE_SCRIPT = 'npm run test:xtensions-openui5-host-controller';
const XTENSIONS_OPENUI5_LOADER_BOUNDARY_PACKAGE_SCRIPT = 'npm run test:xtensions-openui5-loader-boundary';

const OPENUI5_CAPABILITIES = Object.freeze([
  'openui5.loader.lazy',
  'openui5.control.lifecycle',
  'openui5.model.json',
  'dom.boundary.host-owned-container',
  'style.boundary.global-theme-managed'
]);

const OPENUI5_ALLOWED_DEPENDENCIES = Object.freeze([
  '@openui5/sap.ui.core',
  '@openui5/sap.m',
  '@openui5/sap.ui.layout',
  '@openui5/sap.ui.unified',
  '@openui5/themelib_sap_horizon'
]);

const OPENUI5_FORBIDDEN_REMOTE_PATTERNS = Object.freeze([
  /https?:\/\//iu,
  /\/\/ui5\.sap\.com/iu,
  /sapui5\.hana\.ondemand\.com/iu
]);

const OPENUI5_REMOTE_LOADER_CODE = 'xtensions.openui5.remote_loader';
const OPENUI5_DEPENDENCY_BOUNDARY_CODE = 'xtensions.openui5.dependency_boundary';
const OPENUI5_LIFECYCLE_CODE = 'xtensions.openui5.lifecycle';

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function createOpenUi5Diagnostic(code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_OPENUI5_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_OPENUI5_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE,
    severity,
    code,
    message,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeOpenUi5LoaderBoundary(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const resourceRoot = normalizeString(source.resourceRoot || '/dist/xtensions/openui5/resources/');
  const bootstrap = normalizeString(source.bootstrap || `${resourceRoot.replace(/\/?$/u, '/') }sap-ui-core.js`);
  const theme = normalizeString(source.theme || 'sap_horizon') || 'sap_horizon';
  const libraries = toArray(source.libraries || ['sap.m']).map(normalizeString).filter(Boolean);
  const diagnostics = [];

  if (!resourceRoot.startsWith('/dist/xtensions/openui5/resources/')) {
    diagnostics.push(createOpenUi5Diagnostic(
      OPENUI5_REMOTE_LOADER_CODE,
      'OpenUI5 resourceRoot must point at the product-local XTension resources directory.',
      'error',
      { field: 'loader.resourceRoot', resourceRoot }
    ));
  }

  if (OPENUI5_FORBIDDEN_REMOTE_PATTERNS.some((pattern) => pattern.test(`${resourceRoot}\n${bootstrap}`))) {
    diagnostics.push(createOpenUi5Diagnostic(
      OPENUI5_REMOTE_LOADER_CODE,
      'OpenUI5 loader must not reference SAPUI5/OpenUI5 CDN or any remote URL.',
      'error',
      { field: 'loader.bootstrap', bootstrap, resourceRoot }
    ));
  }

  return {
    schema: XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA,
    runtimeClass: 'openui5',
    domBoundary: 'host-owned-container',
    styleBoundary: 'global-theme-managed',
    trustBoundary: 'same-origin-adapter',
    mutationPolicy: 'adapter-owned-inside-host-container',
    resourceRoot,
    bootstrap,
    theme,
    libraries,
    lazy: true,
    sameRealmHardSecurity: false,
    remoteLoaderAllowed: false,
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

function createOpenUi5AdapterContract(options = {}) {
  const loader = normalizeOpenUi5LoaderBoundary(options.loader || {});
  return {
    schema: XTENSIONS_OPENUI5_ADAPTER_SCHEMA,
    loaderBoundarySchema: XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    signalBridgeSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    workpackage: XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE,
    status: 'accepted-by-XTN-16',
    framework: 'openui5',
    hostNeutral: true,
    requiredMethods: REQUIRED_HOST_CONTROLLER_METHODS.slice(),
    capabilities: OPENUI5_CAPABILITIES.slice(),
    allowedDependencies: OPENUI5_ALLOWED_DEPENDENCIES.slice(),
    dependencyClassification: 'product-local-bundled',
    loaderBoundary: loader,
    boundaries: [
      'openui5-runtime-is-product-local-only',
      'sapui5-cdn-is-policy-blocked',
      'same-realm-is-not-hard-security',
      'ui5-controls-must-be-destroyed-on-unmount',
      'ui5-jsonmodel-updates-prefer-model-setdata'
    ]
  };
}

function assertOpenUi5DependencyBoundary(input = {}) {
  const packageManifest = input.packageManifest || {};
  const sourceText = String(input.sourceText || '');
  const dependencies = Object.assign(
    {},
    packageManifest.dependencies || {},
    packageManifest.devDependencies || {},
    packageManifest.optionalDependencies || {}
  );
  const rootOpenUi5Dependencies = Object.keys(dependencies).filter((name) => name.startsWith('@openui5/'));
  const diagnostics = [];

  if (rootOpenUi5Dependencies.length > 0) {
    diagnostics.push(createOpenUi5Diagnostic(
      OPENUI5_DEPENDENCY_BOUNDARY_CODE,
      'OpenUI5 must not be added to the XTend root package; only product-local demos may install it.',
      'error',
      { field: 'package.dependencies', dependencies: rootOpenUi5Dependencies }
    ));
  }

  if (OPENUI5_FORBIDDEN_REMOTE_PATTERNS.some((pattern) => pattern.test(sourceText))) {
    diagnostics.push(createOpenUi5Diagnostic(
      OPENUI5_REMOTE_LOADER_CODE,
      'OpenUI5 adapter source must not point at remote UI5 loaders.',
      'error',
      { field: 'sourceText' }
    ));
  }

  return {
    schema: XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA,
    ok: diagnostics.length === 0,
    rootOpenUi5Dependencies,
    diagnostics
  };
}

function createFrameworklessOpenUi5HostAdapter(options = {}) {
  const hostId = normalizeString(options.hostId || 'xtend-openui5-host');
  const surfaceId = normalizeString(options.surfaceId || 'surface.openui5.host');
  const lifecycle = [];
  let mounted = false;
  let destroyed = false;
  let sequence = 0;
  let modelData = {};
  let controlDestroyed = false;

  function result(operation, status, metadata = {}) {
    sequence += 1;
    const record = createLifecycleRecord(operation, null, {
      hostId,
      surfaceId,
      sequence,
      status,
      timestamp: timestampFromOptions(options),
      payload: metadata
    });
    lifecycle.push(record);
    return normalizeHostControllerResult(operation, {
      status,
      hostId,
      surfaceId,
      lifecycleRecord: record,
      cleanupRecords: operation === 'unmount' ? [
        { resource: 'openui5-control-tree', status: controlDestroyed ? 'destroyed' : 'released' },
        { resource: 'openui5-jsonmodel', status: 'released' },
        { resource: 'host-owned-container', status: 'cleared' }
      ] : [],
      metadata
    }, { hostId, surfaceId, timestamp: timestampFromOptions(options) });
  }

  return {
    schema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    mount(target = {}, initialProps = {}, mountOptions = {}) {
      if (destroyed) return result('mount', 'failed', { code: OPENUI5_LIFECYCLE_CODE, reason: 'destroyed' });
      const loader = normalizeOpenUi5LoaderBoundary(mountOptions.loader || options.loader || {});
      if (!loader.ok) return result('mount', 'policy-blocked', { diagnostics: loader.diagnostics });
      mounted = true;
      modelData = cloneJson(initialProps) || {};
      if (target && typeof target === 'object') target.openUi5Mounted = true;
      return result('mount', 'ok', { loader, modelKeys: Object.keys(modelData) });
    },
    update(signal = {}) {
      if (!mounted || destroyed) return result('update', 'failed', { code: OPENUI5_LIFECYCLE_CODE, reason: 'not-mounted' });
      modelData = cloneJson(signal.props || signal) || {};
      return result('update', 'ok', { reason: signal.reason || 'update', modelKeys: Object.keys(modelData) });
    },
    suspend(reason = 'host-policy') {
      if (!mounted || destroyed) return result('suspend', 'skipped', { reason });
      return result('suspend', 'ok', { reason });
    },
    resume(reason = 'host-policy') {
      if (!mounted || destroyed) return result('resume', 'skipped', { reason });
      return result('resume', 'ok', { reason });
    },
    reportError(error, metadata = {}) {
      return result('reportError', 'degraded', {
        ...metadata,
        message: error && error.message ? error.message : String(error)
      });
    },
    unmount(reason = 'host-dispose') {
      controlDestroyed = mounted;
      mounted = false;
      destroyed = true;
      return result('unmount', 'ok', { reason, controlDestroyed });
    },
    snapshot() {
      return {
        schema: 'xtend.xtensions.openui5-adapter-snapshot.v1',
        hostId,
        surfaceId,
        mounted,
        destroyed,
        controlDestroyed,
        modelData: cloneJson(modelData) || {},
        lifecycleCount: lifecycle.length
      };
    },
    getLifecycleRecords() {
      return lifecycle.map(cloneJson);
    }
  };
}

function createOpenUi5AdapterReport(input = {}, options = {}) {
  const loader = normalizeOpenUi5LoaderBoundary(input.loader || {});
  const dependencyBoundary = assertOpenUi5DependencyBoundary(input.dependencyBoundary || {});
  return {
    schema: XTENSIONS_OPENUI5_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_OPENUI5_ADAPTER_SCHEMA,
    loaderBoundarySchema: XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE,
    generatedAt: timestampFromOptions(options),
    loaderBoundary: loader,
    dependencyBoundary,
    ok: loader.ok && dependencyBoundary.ok
  };
}

function serializeOpenUi5AdapterReport(report = {}) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function printOpenUi5HostAdapterReport(report) {
  const output = report && report.report ? report.report : report;
  console.log(serializeOpenUi5AdapterReport(output));
}

module.exports = {
  OPENUI5_ALLOWED_DEPENDENCIES,
  OPENUI5_CAPABILITIES,
  OPENUI5_DEPENDENCY_BOUNDARY_CODE,
  OPENUI5_REMOTE_LOADER_CODE,
  XTENSIONS_OPENUI5_ADAPTER_CONTRACT_PATH,
  XTENSIONS_OPENUI5_ADAPTER_FIXTURE_PATH,
  XTENSIONS_OPENUI5_ADAPTER_MODULE_PATH,
  XTENSIONS_OPENUI5_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_OPENUI5_ADAPTER_SCHEMA,
  XTENSIONS_OPENUI5_ADAPTER_SUITE_PATH,
  XTENSIONS_OPENUI5_ADAPTER_TYPES_PATH,
  XTENSIONS_OPENUI5_ADAPTER_WORKPACKAGE,
  XTENSIONS_OPENUI5_DIAGNOSTIC_SCHEMA,
  XTENSIONS_OPENUI5_LOADER_BOUNDARY_PACKAGE_SCRIPT,
  XTENSIONS_OPENUI5_LOADER_BOUNDARY_SCHEMA,
  XTENSIONS_OPENUI5_REPORT_SCHEMA,
  assertOpenUi5DependencyBoundary,
  createFrameworklessOpenUi5HostAdapter,
  createOpenUi5AdapterContract,
  createOpenUi5AdapterReport,
  normalizeOpenUi5LoaderBoundary,
  printOpenUi5HostAdapterReport,
  serializeOpenUi5AdapterReport
};

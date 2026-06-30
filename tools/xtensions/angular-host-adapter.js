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

const XTENSIONS_ANGULAR_ADAPTER_SCHEMA = 'xtend.xtensions.angular-adapter.v1';
const XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA = 'xtend.xtensions.angular-zone-boundary.v1';
const XTENSIONS_ANGULAR_REPORT_SCHEMA = 'xtend.xtensions.angular-adapter-report.v1';
const XTENSIONS_ANGULAR_DIAGNOSTIC_SCHEMA = 'xtend.xtensions.angular-adapter-diagnostic.v1';
const XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH = 'tools/xtensions/angular-host-adapter.js';
const XTENSIONS_ANGULAR_ADAPTER_TYPES_PATH = 'tools/xtensions/angular-host-adapter.d.ts';
const XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH = 'tests/xtensions/xtensions_angular_host_adapter_suite.js';
const XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH = 'tests/fixtures/xtensions/angular-host-adapter-valid.json';
const XTENSIONS_ANGULAR_ADAPTER_CONTRACT_PATH = 'development/XTensions-Angular-Host-Adapter-Contract.md';
const XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE = 'XTN-17';
const XTENSIONS_ANGULAR_ADAPTER_PACKAGE_SCRIPT = 'npm run test:xtensions-angular-host-controller';
const XTENSIONS_ANGULAR_ZONE_BOUNDARY_PACKAGE_SCRIPT = 'npm run test:xtensions-angular-zone-boundary';

const ANGULAR_CAPABILITIES = Object.freeze([
  'angular.standalone.bootstrap',
  'angular.aot.bundle',
  'angular.signals.model',
  'angular.zoneless.change-detection',
  'angular.applicationref.destroy',
  'dom.boundary.host-owned-container',
  'style.boundary.host-css-owned'
]);

const ANGULAR_ALLOWED_RUNTIME_DEPENDENCIES = Object.freeze([
  '@angular/core',
  '@angular/common',
  '@angular/platform-browser',
  'rxjs'
]);

const ANGULAR_ALLOWED_BUILD_DEPENDENCIES = Object.freeze([
  '@angular/compiler',
  '@angular/compiler-cli',
  'typescript'
]);

const ANGULAR_REMOTE_LOADER_CODE = 'xtensions.angular.remote_loader';
const ANGULAR_DEPENDENCY_BOUNDARY_CODE = 'xtensions.angular.dependency_boundary';
const ANGULAR_RUNTIME_COMPILER_CODE = 'xtensions.angular.runtime_compiler';
const ANGULAR_LIFECYCLE_CODE = 'xtensions.angular.lifecycle';

const ANGULAR_FORBIDDEN_REMOTE_PATTERNS = Object.freeze([
  /https?:\/\//iu,
  /\/\/unpkg\.com/iu,
  /\/\/esm\.sh/iu,
  /\/\/cdn\.jsdelivr\.net/iu,
  /\/\/cdnjs\.cloudflare\.com/iu
]);

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

function createAngularDiagnostic(code, message, severity = 'error', metadata = {}) {
  return {
    schema: XTENSIONS_ANGULAR_DIAGNOSTIC_SCHEMA,
    source: XTENSIONS_ANGULAR_ADAPTER_SCHEMA,
    workpackage: XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE,
    severity,
    code,
    message,
    field: metadata.field || null,
    metadata: cloneJson(metadata) || {}
  };
}

function normalizeAngularZoneBoundary(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const buildMode = normalizeString(source.buildMode || 'aot') || 'aot';
  const changeDetection = normalizeString(source.changeDetection || 'zoneless-signals') || 'zoneless-signals';
  const domBoundary = normalizeString(source.domBoundary || 'host-owned-container') || 'host-owned-container';
  const styleBoundary = normalizeString(source.styleBoundary || 'host-css-owned') || 'host-css-owned';
  const trustBoundary = normalizeString(source.trustBoundary || 'same-origin-adapter') || 'same-origin-adapter';
  const runtimeCompiler = source.runtimeCompiler === true || source.compilerRuntime === true;
  const remoteArtifactsAllowed = source.remoteArtifactsAllowed === true;
  const diagnostics = [];

  if (buildMode !== 'aot') {
    diagnostics.push(createAngularDiagnostic(
      ANGULAR_DEPENDENCY_BOUNDARY_CODE,
      'Angular XTensions must be product-built with AOT for the strict CSP host path.',
      'error',
      { field: 'buildMode', buildMode }
    ));
  }

  if (runtimeCompiler) {
    diagnostics.push(createAngularDiagnostic(
      ANGULAR_RUNTIME_COMPILER_CODE,
      'Angular runtime compiler is policy-blocked; compile the XTension before bundling.',
      'error',
      { field: 'runtimeCompiler' }
    ));
  }

  if (domBoundary !== 'host-owned-container') {
    diagnostics.push(createAngularDiagnostic(
      ANGULAR_DEPENDENCY_BOUNDARY_CODE,
      'Angular same-realm XTensions must mount into a host-owned container.',
      'error',
      { field: 'domBoundary', domBoundary }
    ));
  }

  if (remoteArtifactsAllowed) {
    diagnostics.push(createAngularDiagnostic(
      ANGULAR_REMOTE_LOADER_CODE,
      'Angular XTensions must not load remote runtime artifacts.',
      'error',
      { field: 'remoteArtifactsAllowed' }
    ));
  }

  return {
    schema: XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA,
    runtimeClass: 'angular',
    buildMode,
    changeDetection,
    domBoundary,
    styleBoundary,
    trustBoundary,
    mutationPolicy: normalizeString(source.mutationPolicy || 'adapter-owned-inside-host-container') || 'adapter-owned-inside-host-container',
    lazy: source.lazy !== false,
    runtimeCompilerAllowed: false,
    remoteArtifactsAllowed: false,
    sameRealmHardSecurity: false,
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

function createAngularAdapterContract(options = {}) {
  const zoneBoundary = normalizeAngularZoneBoundary(options.zoneBoundary || {});
  return {
    schema: XTENSIONS_ANGULAR_ADAPTER_SCHEMA,
    zoneBoundarySchema: XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA,
    hostControllerSchema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    signalBridgeSchema: XTENSIONS_SIGNAL_BRIDGE_SCHEMA,
    surfaceEventSchema: XTENSIONS_SURFACE_EVENT_SCHEMA,
    workpackage: XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE,
    status: 'accepted-by-XTN-17',
    framework: 'angular',
    hostNeutral: true,
    requiredMethods: REQUIRED_HOST_CONTROLLER_METHODS.slice(),
    capabilities: ANGULAR_CAPABILITIES.slice(),
    allowedRuntimeDependencies: ANGULAR_ALLOWED_RUNTIME_DEPENDENCIES.slice(),
    allowedBuildDependencies: ANGULAR_ALLOWED_BUILD_DEPENDENCIES.slice(),
    dependencyClassification: 'product-local-bundled',
    zoneBoundary,
    boundaries: [
      'angular-runtime-is-product-local-only',
      'angular-runtime-compiler-is-policy-blocked',
      'angular-cdn-is-policy-blocked',
      'same-realm-is-not-hard-security',
      'angular-app-ref-must-be-destroyed-on-unmount',
      'angular-signals-update-path-preferred'
    ]
  };
}

function assertAngularDependencyBoundary(input = {}) {
  const packageManifest = input.packageManifest || {};
  const sourceText = String(input.sourceText || '');
  const dependencies = Object.assign(
    {},
    packageManifest.dependencies || {},
    packageManifest.devDependencies || {},
    packageManifest.optionalDependencies || {}
  );
  const rootAngularDependencies = Object.keys(dependencies).filter((name) => name.startsWith('@angular/') || name === 'rxjs' || name === 'zone.js');
  const diagnostics = [];

  if (rootAngularDependencies.length > 0) {
    diagnostics.push(createAngularDiagnostic(
      ANGULAR_DEPENDENCY_BOUNDARY_CODE,
      'Angular must not be added to the XTend root package; only product-local demos may install it.',
      'error',
      { field: 'package.dependencies', dependencies: rootAngularDependencies }
    ));
  }

  if (ANGULAR_FORBIDDEN_REMOTE_PATTERNS.some((pattern) => pattern.test(sourceText))) {
    diagnostics.push(createAngularDiagnostic(
      ANGULAR_REMOTE_LOADER_CODE,
      'Angular adapter source must not point at remote loaders or CDN artifacts.',
      'error',
      { field: 'sourceText' }
    ));
  }

  if (/(?:from\s+['"]@angular\/compiler['"]|import\s+['"]@angular\/compiler['"]|require\(\s*['"]@angular\/compiler['"]\s*\)|import\(\s*['"]@angular\/compiler['"]\s*\))/u.test(sourceText)) {
    diagnostics.push(createAngularDiagnostic(
      ANGULAR_RUNTIME_COMPILER_CODE,
      'The runtime adapter must not import @angular/compiler; AOT build output is required.',
      'error',
      { field: 'sourceText' }
    ));
  }

  return {
    schema: XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA,
    ok: diagnostics.length === 0,
    rootAngularDependencies,
    diagnostics
  };
}

function createFrameworklessAngularHostAdapter(options = {}) {
  const hostId = normalizeString(options.hostId || 'xtend-angular-host');
  const surfaceId = normalizeString(options.surfaceId || 'surface.angular.host');
  const lifecycle = [];
  let mounted = false;
  let destroyed = false;
  let sequence = 0;
  let modelData = {};
  let applicationDestroyed = false;

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
        { resource: 'angular-application-ref', status: applicationDestroyed ? 'destroyed' : 'released' },
        { resource: 'angular-signal-store', status: 'released' },
        { resource: 'host-owned-container', status: 'cleared' }
      ] : [],
      metadata
    }, { hostId, surfaceId, timestamp: timestampFromOptions(options) });
  }

  return {
    schema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    mount(target = {}, initialProps = {}, mountOptions = {}) {
      if (destroyed) return result('mount', 'failed', { code: ANGULAR_LIFECYCLE_CODE, reason: 'destroyed' });
      const zoneBoundary = normalizeAngularZoneBoundary(mountOptions.zoneBoundary || options.zoneBoundary || {});
      if (!zoneBoundary.ok) return result('mount', 'policy-blocked', { diagnostics: zoneBoundary.diagnostics });
      mounted = true;
      modelData = cloneJson(initialProps) || {};
      if (target && typeof target === 'object') target.angularMounted = true;
      return result('mount', 'ok', { zoneBoundary, modelKeys: Object.keys(modelData) });
    },
    update(signal = {}) {
      if (!mounted || destroyed) return result('update', 'failed', { code: ANGULAR_LIFECYCLE_CODE, reason: 'not-mounted' });
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
      if (!mounted || destroyed) return result('unmount', 'skipped', { reason });
      applicationDestroyed = true;
      destroyed = true;
      mounted = false;
      return result('unmount', 'ok', { reason });
    },
    snapshot() {
      return {
        schema: 'xtend.xtensions.angular-adapter-snapshot.v1',
        hostId,
        surfaceId,
        mounted,
        destroyed,
        applicationDestroyed,
        modelKeys: Object.keys(modelData),
        lifecycleCount: lifecycle.length
      };
    },
    getLifecycleRecords() {
      return lifecycle.map(cloneJson);
    }
  };
}

function createAngularAdapterReport(input = {}, options = {}) {
  const zoneBoundary = normalizeAngularZoneBoundary(input.zoneBoundary || {});
  const dependencyBoundary = assertAngularDependencyBoundary(input.dependencyBoundary || {});
  return {
    schema: XTENSIONS_ANGULAR_REPORT_SCHEMA,
    adapterSchema: XTENSIONS_ANGULAR_ADAPTER_SCHEMA,
    zoneBoundarySchema: XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA,
    workpackage: XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE,
    generatedAt: timestampFromOptions(options),
    zoneBoundary,
    dependencyBoundary,
    ok: zoneBoundary.ok && dependencyBoundary.ok
  };
}

function serializeAngularAdapterReport(report = {}) {
  return JSON.stringify(report, null, 2);
}

function printAngularHostAdapterReport(report = {}) {
  console.log(serializeAngularAdapterReport(report));
}

module.exports = {
  ANGULAR_ALLOWED_BUILD_DEPENDENCIES,
  ANGULAR_ALLOWED_RUNTIME_DEPENDENCIES,
  ANGULAR_CAPABILITIES,
  ANGULAR_DEPENDENCY_BOUNDARY_CODE,
  ANGULAR_LIFECYCLE_CODE,
  ANGULAR_REMOTE_LOADER_CODE,
  ANGULAR_RUNTIME_COMPILER_CODE,
  XTENSIONS_ANGULAR_ADAPTER_CONTRACT_PATH,
  XTENSIONS_ANGULAR_ADAPTER_FIXTURE_PATH,
  XTENSIONS_ANGULAR_ADAPTER_MODULE_PATH,
  XTENSIONS_ANGULAR_ADAPTER_PACKAGE_SCRIPT,
  XTENSIONS_ANGULAR_ADAPTER_SCHEMA,
  XTENSIONS_ANGULAR_ADAPTER_SUITE_PATH,
  XTENSIONS_ANGULAR_ADAPTER_TYPES_PATH,
  XTENSIONS_ANGULAR_ADAPTER_WORKPACKAGE,
  XTENSIONS_ANGULAR_DIAGNOSTIC_SCHEMA,
  XTENSIONS_ANGULAR_REPORT_SCHEMA,
  XTENSIONS_ANGULAR_ZONE_BOUNDARY_PACKAGE_SCRIPT,
  XTENSIONS_ANGULAR_ZONE_BOUNDARY_SCHEMA,
  assertAngularDependencyBoundary,
  createAngularAdapterContract,
  createAngularAdapterReport,
  createFrameworklessAngularHostAdapter,
  normalizeAngularZoneBoundary,
  printAngularHostAdapterReport,
  serializeAngularAdapterReport
};

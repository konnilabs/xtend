'use strict';

const XTENSIONS_HOST_CONTROLLER_SCHEMA = 'xtend.xtensions.host-controller.v1';
const XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA = 'xtend.xtensions.host-controller-result.v1';
const XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA = 'xtend.xtensions.host-controller-lifecycle-record.v1';
const XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA = 'xtend.xtensions.host-controller-report.v1';
const XTENSIONS_HOST_CONTROLLER_MODULE_PATH = 'tools/xtensions/host-controller-contract.js';
const XTENSIONS_HOST_CONTROLLER_TYPES_PATH = 'tools/xtensions/host-controller-contract.d.ts';
const XTENSIONS_HOST_CONTROLLER_SUITE_PATH = 'tests/xtensions/xtensions_host_controller_suite.js';
const XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH = 'tests/fixtures/xtensions/host-controller-dummy.json';
const XTENSIONS_HOST_CONTROLLER_WORKPACKAGE = 'XTN-01';
const XTENSIONS_HOST_CONTROLLER_PACKAGE_SCRIPT = 'npm run test:xtensions-host-controller';

const XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY_CODE = 'XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY';
const XTENSIONS_HOST_CONTROLLER_METHOD_MISSING_CODE = 'XTENSIONS_HOST_CONTROLLER_METHOD_MISSING';
const XTENSIONS_HOST_CONTROLLER_INVALID_LIFECYCLE_CODE = 'XTENSIONS_HOST_CONTROLLER_INVALID_LIFECYCLE';
const XTENSIONS_HOST_CONTROLLER_NOT_MOUNTED_CODE = 'XTENSIONS_HOST_CONTROLLER_NOT_MOUNTED';
const XTENSIONS_HOST_CONTROLLER_ALREADY_DESTROYED_CODE = 'XTENSIONS_HOST_CONTROLLER_ALREADY_DESTROYED';
const XTENSIONS_HOST_CONTROLLER_ERROR_REPORTED_CODE = 'XTENSIONS_HOST_CONTROLLER_ERROR_REPORTED';

const REQUIRED_HOST_CONTROLLER_METHODS = Object.freeze([
  'mount',
  'update',
  'suspend',
  'resume',
  'reportError',
  'unmount'
]);

const HOST_CONTROLLER_RESULT_STATUSES = Object.freeze([
  'ok',
  'skipped',
  'degraded',
  'failed',
  'policy-blocked'
]);

const DEFAULT_CLEANUP_RESOURCES = Object.freeze([
  'framework-root',
  'event-listeners',
  'timers',
  'observers',
  'animation-frames',
  'workers'
]);

const FORBIDDEN_FRAMEWORK_DEPENDENCIES = Object.freeze([
  'react',
  'react-dom',
  'vue',
  'three',
  'leaflet',
  'chart.js',
  '@react-three/fiber'
]);

const HOST_CONTROLLER_BOUNDARIES = Object.freeze([
  'no-rmt-kernel-import-of-framework-runtime-types',
  'no-framework-test-fixture-dependencies-in-xtend-package',
  'no-vendored-third-party-frameworks-in-repo-or-npm-package',
  'framework-pocs-use-contract-stubs-or-external-opt-in-peer-harnesses',
  'hostcontroller-lifecycle-must-be-fabric-observable'
]);

const HOST_CONTROLLER_LIFECYCLE_MATRIX = Object.freeze([
  Object.freeze({
    operation: 'mount',
    requiredMethod: 'mount',
    acceptedSignal: 'surface:mount',
    emittedEvent: 'surface:ready',
    phase: 'ready',
    terminal: false
  }),
  Object.freeze({
    operation: 'update',
    requiredMethod: 'update',
    acceptedSignal: 'surface:update',
    emittedEvent: 'surface:updated',
    phase: 'active',
    terminal: false
  }),
  Object.freeze({
    operation: 'suspend',
    requiredMethod: 'suspend',
    acceptedSignal: 'surface:suspend',
    emittedEvent: 'surface:suspended',
    phase: 'suspended',
    terminal: false
  }),
  Object.freeze({
    operation: 'resume',
    requiredMethod: 'resume',
    acceptedSignal: 'surface:resume',
    emittedEvent: 'surface:resumed',
    phase: 'active',
    terminal: false
  }),
  Object.freeze({
    operation: 'reportError',
    requiredMethod: 'reportError',
    acceptedSignal: 'surface:error',
    emittedEvent: 'surface:error',
    phase: 'degraded',
    terminal: false
  }),
  Object.freeze({
    operation: 'unmount',
    requiredMethod: 'unmount',
    acceptedSignal: 'surface:unmount',
    emittedEvent: 'surface:destroyed',
    phase: 'destroyed',
    terminal: true
  })
]);

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function lifecycleEntryFor(operation) {
  return HOST_CONTROLLER_LIFECYCLE_MATRIX.find((entry) => entry.operation === operation) || null;
}

function createDiagnostic(code, message, details = {}) {
  return {
    code,
    message,
    details: cloneJson(details) || {}
  };
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function normalizeHostControllerResult(operation, result = {}, options = {}) {
  const status = HOST_CONTROLLER_RESULT_STATUSES.includes(result.status) ? result.status : 'failed';
  const diagnostics = Array.isArray(result.diagnostics) ? result.diagnostics.map(cloneJson) : [];

  return {
    schema: XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA,
    operation,
    ok: status === 'ok' || status === 'skipped',
    status,
    hostId: result.hostId || options.hostId || null,
    surfaceId: result.surfaceId || options.surfaceId || null,
    timestamp: result.timestamp || timestampFromOptions(options),
    lifecycleRecord: result.lifecycleRecord ? cloneJson(result.lifecycleRecord) : null,
    cleanupRecords: Array.isArray(result.cleanupRecords) ? result.cleanupRecords.map(cloneJson) : [],
    diagnostics,
    metadata: cloneJson(result.metadata || {})
  };
}

function createLifecycleRecord(operation, event, options = {}) {
  const matrixEntry = lifecycleEntryFor(operation) || {};
  return {
    schema: XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA,
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    operation,
    event: event || matrixEntry.emittedEvent || null,
    status: options.status || 'ok',
    phase: options.phase || matrixEntry.phase || 'unknown',
    lane: options.lane || 'fabric.default',
    sequence: Number.isFinite(options.sequence) ? options.sequence : 0,
    terminal: Boolean(options.terminal || matrixEntry.terminal),
    timestamp: timestampFromOptions(options),
    payload: cloneJson(options.payload || {}),
    diagnostics: Array.isArray(options.diagnostics) ? options.diagnostics.map(cloneJson) : []
  };
}

function normalizeContainerOwnership(ownership = {}) {
  return {
    mode: ownership.mode || 'host-owned-container',
    shadowDom: ownership.shadowDom || 'policy-driven',
    styleBoundary: ownership.styleBoundary || 'host-owned',
    focusBoundary: ownership.focusBoundary || 'host-owned',
    domMutationBoundary: ownership.domMutationBoundary || 'adapter-owned-inside-host-container'
  };
}

function createXTensionHostControllerContract(options = {}) {
  return {
    schema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    resultSchema: XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA,
    lifecycleRecordSchema: XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA,
    reportSchema: XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA,
    workpackage: XTENSIONS_HOST_CONTROLLER_WORKPACKAGE,
    status: 'accepted-by-XTN-01',
    hostNeutral: true,
    requiredMethods: REQUIRED_HOST_CONTROLLER_METHODS.slice(),
    resultStatuses: HOST_CONTROLLER_RESULT_STATUSES.slice(),
    lifecycle: HOST_CONTROLLER_LIFECYCLE_MATRIX.map(cloneJson),
    cleanupResources: (options.cleanupResources || DEFAULT_CLEANUP_RESOURCES).slice(),
    containerOwnership: normalizeContainerOwnership(options.containerOwnership),
    dependencyPolicy: {
      frameworkDependenciesAllowed: false,
      vendoredFrameworksAllowed: false,
      networkRequired: false,
      allowedTestModes: [
        'frameworkless-contract-stub',
        'external-opt-in-peer-harness'
      ],
      forbiddenFrameworkDependencies: FORBIDDEN_FRAMEWORK_DEPENDENCIES.slice()
    },
    boundaries: HOST_CONTROLLER_BOUNDARIES.slice()
  };
}

function matchesForbiddenPackageName(packageName) {
  return FORBIDDEN_FRAMEWORK_DEPENDENCIES.some((forbidden) => (
    packageName === forbidden || packageName.startsWith(`${forbidden}/`)
  ));
}

function collectPackageDependencyNames(packageManifest = {}) {
  const dependencySections = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    'bundledDependencies',
    'bundleDependencies'
  ];
  const names = [];

  dependencySections.forEach((section) => {
    const entries = packageManifest[section];
    if (Array.isArray(entries)) {
      entries.forEach((name) => names.push({ section, name }));
      return;
    }

    if (entries && typeof entries === 'object') {
      Object.keys(entries).forEach((name) => names.push({ section, name }));
    }
  });

  return names;
}

function collectSourceImports(sourceText = '') {
  const imports = [];
  const importPattern = /(?:require\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\))/gu;
  let match = importPattern.exec(sourceText);

  while (match) {
    imports.push(match[1] || match[2] || match[3]);
    match = importPattern.exec(sourceText);
  }

  return imports;
}

function assertNoFrameworkDependencies(input = {}) {
  const diagnostics = [];
  const dependencyNames = collectPackageDependencyNames(input.packageManifest || input.packageJson || {});
  const explicitImports = Array.isArray(input.imports) ? input.imports : [];
  const sourceImports = collectSourceImports(input.sourceText || input.text || '');

  dependencyNames.forEach(({ section, name }) => {
    if (matchesForbiddenPackageName(name)) {
      diagnostics.push(createDiagnostic(
        XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY_CODE,
        `Forbidden framework dependency declared in ${section}: ${name}`,
        { section, name }
      ));
    }
  });

  explicitImports.concat(sourceImports).forEach((name) => {
    if (matchesForbiddenPackageName(name)) {
      diagnostics.push(createDiagnostic(
        XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY_CODE,
        `Forbidden framework import detected: ${name}`,
        { name }
      ));
    }
  });

  return {
    ok: diagnostics.length === 0,
    diagnostics,
    forbiddenFrameworkDependencies: FORBIDDEN_FRAMEWORK_DEPENDENCIES.slice()
  };
}

function normalizeHostControllerDefinition(definition = {}) {
  const methods = Array.isArray(definition.methods) ? definition.methods.slice() : [];
  const missingMethods = REQUIRED_HOST_CONTROLLER_METHODS.filter((method) => !methods.includes(method));
  const dependencyCheck = assertNoFrameworkDependencies({
    packageManifest: definition.packageManifest || {},
    imports: definition.imports || []
  });
  const diagnostics = dependencyCheck.diagnostics.slice();

  missingMethods.forEach((method) => {
    diagnostics.push(createDiagnostic(
      XTENSIONS_HOST_CONTROLLER_METHOD_MISSING_CODE,
      `HostController is missing required method: ${method}`,
      { method }
    ));
  });

  return {
    schema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    id: definition.id || null,
    framework: definition.framework || 'unknown',
    version: definition.version || '0.0.0',
    methods,
    capabilities: Array.isArray(definition.capabilities) ? definition.capabilities.slice() : [],
    containerOwnership: normalizeContainerOwnership(definition.containerOwnership),
    dependencyPolicy: createXTensionHostControllerContract().dependencyPolicy,
    ok: diagnostics.length === 0,
    diagnostics
  };
}

function createCleanupRecords(hostId, surfaceId, resources, options = {}) {
  return resources.map((resource, index) => ({
    schema: 'xtend.xtensions.host-controller-cleanup-record.v1',
    hostId,
    surfaceId,
    resource,
    status: 'released',
    sequence: index + 1,
    timestamp: timestampFromOptions(options)
  }));
}

function createFrameworklessHostControllerStub(options = {}) {
  const contract = createXTensionHostControllerContract(options.contract || {});
  const hostId = options.id || 'xtension.host-controller.frameworkless-stub';
  const surfaceId = options.surfaceId || 'surface.xtensions.stub';
  const cleanupResources = options.cleanupResources || contract.cleanupResources;
  const lifecycleRecords = [];
  const cleanupRecords = [];
  const state = {
    mounted: false,
    suspended: false,
    destroyed: false,
    containerId: null,
    props: {},
    lastSignal: null
  };
  let sequence = 0;

  function pushLifecycle(operation, status, payload = {}, diagnostics = []) {
    const entry = lifecycleEntryFor(operation);
    sequence += 1;
    const record = createLifecycleRecord(operation, entry && entry.emittedEvent, {
      hostId,
      surfaceId,
      status,
      phase: entry && entry.phase,
      terminal: entry && entry.terminal,
      sequence,
      payload,
      diagnostics,
      clock: options.clock
    });
    lifecycleRecords.push(record);
    return record;
  }

  function result(operation, status, metadata = {}, diagnostics = [], lifecycleRecord = null, released = []) {
    return normalizeHostControllerResult(operation, {
      status,
      hostId,
      surfaceId,
      lifecycleRecord,
      cleanupRecords: released,
      diagnostics,
      metadata
    }, {
      hostId,
      surfaceId,
      clock: options.clock
    });
  }

  function blockedWhenNotMounted(operation) {
    const diagnostic = createDiagnostic(
      state.destroyed ? XTENSIONS_HOST_CONTROLLER_ALREADY_DESTROYED_CODE : XTENSIONS_HOST_CONTROLLER_NOT_MOUNTED_CODE,
      state.destroyed ? 'HostController has already been destroyed.' : 'HostController is not mounted.',
      { operation }
    );
    const lifecycleRecord = pushLifecycle(operation, 'failed', {}, [diagnostic]);
    return result(operation, 'failed', {}, [diagnostic], lifecycleRecord);
  }

  return {
    schema: XTENSIONS_HOST_CONTROLLER_SCHEMA,
    id: hostId,
    framework: 'frameworkless-stub',
    version: '0.0.0-test',
    hostNeutral: true,
    contract,
    dependencyPolicy: contract.dependencyPolicy,
    methods: REQUIRED_HOST_CONTROLLER_METHODS.slice(),

    mount(container = {}, initialProps = {}, mountOptions = {}) {
      if (state.destroyed) return blockedWhenNotMounted('mount');
      if (state.mounted) {
        const lifecycleRecord = pushLifecycle('mount', 'skipped', { reason: 'already-mounted' });
        return result('mount', 'skipped', { reason: 'already-mounted' }, [], lifecycleRecord);
      }

      state.mounted = true;
      state.suspended = false;
      state.containerId = mountOptions.containerId || container.id || container.name || 'anonymous-host-container';
      state.props = cloneJson(initialProps) || {};
      const lifecycleRecord = pushLifecycle('mount', 'ok', {
        containerId: state.containerId,
        props: state.props
      });
      return result('mount', 'ok', { containerId: state.containerId }, [], lifecycleRecord);
    },

    update(signal = {}) {
      if (!state.mounted || state.destroyed) return blockedWhenNotMounted('update');
      state.lastSignal = cloneJson(signal) || {};
      const lifecycleRecord = pushLifecycle('update', 'ok', { signal: state.lastSignal });
      return result('update', 'ok', { signal: state.lastSignal }, [], lifecycleRecord);
    },

    suspend(reason = 'unspecified') {
      if (!state.mounted || state.destroyed) return blockedWhenNotMounted('suspend');
      if (state.suspended) {
        const lifecycleRecord = pushLifecycle('suspend', 'skipped', { reason: 'already-suspended' });
        return result('suspend', 'skipped', { reason: 'already-suspended' }, [], lifecycleRecord);
      }

      state.suspended = true;
      const lifecycleRecord = pushLifecycle('suspend', 'ok', { reason });
      return result('suspend', 'ok', { reason }, [], lifecycleRecord);
    },

    resume(reason = 'unspecified') {
      if (!state.mounted || state.destroyed) return blockedWhenNotMounted('resume');
      if (!state.suspended) {
        const lifecycleRecord = pushLifecycle('resume', 'skipped', { reason: 'not-suspended' });
        return result('resume', 'skipped', { reason: 'not-suspended' }, [], lifecycleRecord);
      }

      state.suspended = false;
      const lifecycleRecord = pushLifecycle('resume', 'ok', { reason });
      return result('resume', 'ok', { reason }, [], lifecycleRecord);
    },

    reportError(error, metadata = {}) {
      const diagnostic = createDiagnostic(
        XTENSIONS_HOST_CONTROLLER_ERROR_REPORTED_CODE,
        error && error.message ? error.message : 'HostController reported an error.',
        {
          name: error && error.name ? error.name : 'Error',
          metadata
        }
      );
      const lifecycleRecord = pushLifecycle('reportError', 'degraded', { metadata }, [diagnostic]);
      return result('reportError', 'degraded', { metadata }, [diagnostic], lifecycleRecord);
    },

    unmount(reason = 'unspecified') {
      if (state.destroyed) {
        const diagnostic = createDiagnostic(
          XTENSIONS_HOST_CONTROLLER_ALREADY_DESTROYED_CODE,
          'HostController unmount is idempotent; resources were already released.',
          { reason }
        );
        const lifecycleRecord = pushLifecycle('unmount', 'skipped', { reason }, [diagnostic]);
        return result('unmount', 'skipped', { reason }, [diagnostic], lifecycleRecord, []);
      }

      if (!state.mounted) return blockedWhenNotMounted('unmount');

      state.mounted = false;
      state.suspended = false;
      state.destroyed = true;
      const released = createCleanupRecords(hostId, surfaceId, cleanupResources, { clock: options.clock });
      released.forEach((record) => cleanupRecords.push(record));
      const lifecycleRecord = pushLifecycle('unmount', 'ok', { reason, cleanupResources });
      return result('unmount', 'ok', { reason }, [], lifecycleRecord, released);
    },

    snapshot() {
      return {
        schema: 'xtend.xtensions.host-controller-snapshot.v1',
        hostId,
        surfaceId,
        state: cloneJson(state),
        lifecycleCount: lifecycleRecords.length,
        cleanupCount: cleanupRecords.length
      };
    },

    getLifecycleRecords() {
      return lifecycleRecords.map(cloneJson);
    },

    getCleanupRecords() {
      return cleanupRecords.map(cloneJson);
    }
  };
}

module.exports = {
  DEFAULT_CLEANUP_RESOURCES,
  FORBIDDEN_FRAMEWORK_DEPENDENCIES,
  HOST_CONTROLLER_BOUNDARIES,
  HOST_CONTROLLER_LIFECYCLE_MATRIX,
  HOST_CONTROLLER_RESULT_STATUSES,
  REQUIRED_HOST_CONTROLLER_METHODS,
  XTENSIONS_HOST_CONTROLLER_ALREADY_DESTROYED_CODE,
  XTENSIONS_HOST_CONTROLLER_ERROR_REPORTED_CODE,
  XTENSIONS_HOST_CONTROLLER_FIXTURE_PATH,
  XTENSIONS_HOST_CONTROLLER_FRAMEWORK_DEPENDENCY_CODE,
  XTENSIONS_HOST_CONTROLLER_INVALID_LIFECYCLE_CODE,
  XTENSIONS_HOST_CONTROLLER_LIFECYCLE_RECORD_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_METHOD_MISSING_CODE,
  XTENSIONS_HOST_CONTROLLER_MODULE_PATH,
  XTENSIONS_HOST_CONTROLLER_NOT_MOUNTED_CODE,
  XTENSIONS_HOST_CONTROLLER_PACKAGE_SCRIPT,
  XTENSIONS_HOST_CONTROLLER_REPORT_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_RESULT_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_SCHEMA,
  XTENSIONS_HOST_CONTROLLER_SUITE_PATH,
  XTENSIONS_HOST_CONTROLLER_TYPES_PATH,
  XTENSIONS_HOST_CONTROLLER_WORKPACKAGE,
  assertNoFrameworkDependencies,
  createFrameworklessHostControllerStub,
  createLifecycleRecord,
  createXTensionHostControllerContract,
  normalizeHostControllerDefinition,
  normalizeHostControllerResult
};

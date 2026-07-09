'use strict';

const XTEND_DEV_SURFACE_EXTENSION_SCHEMA = 'xtend.devsurface.extension.v1';
const XTEND_DEV_SURFACE_CONTRACT_SCHEMA = 'xtend.devsurface.contract.v1';
const XTEND_DEV_SURFACE_DEV_API_SCHEMA = 'xtend.devsurface.dev-api.v1';
const XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA = 'xtend.devsurface.snapshot.v1';
const XTEND_DEV_SURFACE_PERFORMANCE_SNAPSHOT_SCHEMA = 'xtend.devsurface.performance-snapshot.v1';
const XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA = 'xtend.devsurface.performance-view.v1';
const XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA = 'xtend.devsurface.hydration-snapshot.v1';
const XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA = 'xtend.devsurface.hydration-view.v1';
const XTEND_DEV_SURFACE_FABRIC_SNAPSHOT_SCHEMA = 'xtend.devsurface.fabric-snapshot.v1';
const XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA = 'xtend.devsurface.fabric-view.v1';
const XTEND_DEV_SURFACE_KERNEL_SNAPSHOT_SCHEMA = 'xtend.devsurface.kernel-snapshot.v1';
const XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA = 'xtend.devsurface.kernel-monitor.v1';
const XTEND_DEV_SURFACE_GATE_RUN_SCHEMA = 'xtend.devsurface.gate-run.v1';
const XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA = 'xtend.devsurface.diagnostic.v1';
const XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA = 'xtend.devsurface.security-boundary.v1';
const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA = 'xtend.devsurface.runtime-bridge.v1';
const XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA = 'xtend.devsurface.runtime-bridge-read.v1';
const XTEND_DEV_SURFACE_COMPANION_SCHEMA = 'xtend.devsurface.companion.v1';
const XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA = 'xtend.devsurface.gate-stream.v1';
const XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA = 'xtend.devsurface.gate-artifact.v1';
const XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA = 'xtend.devsurface.worker-path.v1';
const XTEND_DEV_SURFACE_HANDOFF_SCHEMA = 'xtend.devsurface.handoff.v1';
const XTEND_DEV_SURFACE_WORKPACKAGE = 'XDS-WP-01';
const XTEND_DEV_SURFACE_ROOT = 'tools/xtend-dev-surface';
const XTEND_DEV_SURFACE_DIST_PATH = 'tools/xtend-dev-surface/dist';
const XTEND_DEV_SURFACE_CONTRACT_PATH = 'development/XTend-Dev-Surface-Implementierungsplan.md';
const XTEND_DEV_SURFACE_SUITE_PATH = 'tests/xtend-dev-surface/xtend_dev_surface_suite.js';
const XTEND_DEV_SURFACE_TYPES_PATH = 'tools/xtend-dev-surface/contracts.d.ts';
const XTEND_DEV_SURFACE_PACKAGE_SCRIPT = 'npm run test:xtend-dev-surface';

const DEV_API_GLOBAL = '__XTEND_DEV_API__';
const COMPANION_DEFAULT_ORIGIN = 'http://127.0.0.1:27864';
const DEV_API_REQUIRED_METHODS = Object.freeze([
  'getPerformanceSnapshot',
  'getFabricTelemetrySnapshot',
  'getKernelSnapshot'
]);
const DEV_API_OPTIONAL_METHODS = Object.freeze([
  'getHydrationSnapshot',
  'subscribe'
]);

const DEV_SURFACE_VIEWS = Object.freeze([
  'performance',
  'hydration',
  'kernel',
  'fabric',
  'gates'
]);

const DIAGNOSTIC_CATALOG = Object.freeze({
  devApiMissing: Object.freeze({
    code: 'xtend.devsurface.dev_api.missing',
    severity: 'warning',
    boundary: 'explicit-dev-api'
  }),
  devApiMethodMissing: Object.freeze({
    code: 'xtend.devsurface.dev_api.method_missing',
    severity: 'error',
    boundary: 'explicit-dev-api'
  }),
  gateNotAllowed: Object.freeze({
    code: 'xtend.devsurface.gate.not_allowed',
    severity: 'error',
    boundary: 'local-companion-allowlist'
  }),
  gateSpawnFailed: Object.freeze({
    code: 'xtend.devsurface.gate.spawn_failed',
    severity: 'error',
    boundary: 'local-companion-allowlist'
  }),
  gateReportInvalid: Object.freeze({
    code: 'xtend.devsurface.gate.report_invalid',
    severity: 'warning',
    boundary: 'local-companion-report'
  }),
  gateArtifactBlocked: Object.freeze({
    code: 'xtend.devsurface.gate.artifact_blocked',
    severity: 'error',
    boundary: 'local-companion-artifacts'
  }),
  companionUnauthorized: Object.freeze({
    code: 'xtend.devsurface.companion.unauthorized',
    severity: 'error',
    boundary: 'local-companion-token'
  }),
  companionBadRequest: Object.freeze({
    code: 'xtend.devsurface.companion.bad_request',
    severity: 'error',
    boundary: 'local-companion-api'
  }),
  companionNotFound: Object.freeze({
    code: 'xtend.devsurface.companion.not_found',
    severity: 'warning',
    boundary: 'local-companion-api'
  }),
  companionUnavailable: Object.freeze({
    code: 'xtend.devsurface.companion.unavailable',
    severity: 'warning',
    boundary: 'local-companion-api'
  }),
  remoteCodeBlocked: Object.freeze({
    code: 'xtend.devsurface.security.remote_code_blocked',
    severity: 'error',
    boundary: 'no-remote-code'
  }),
  monkeypatchBlocked: Object.freeze({
    code: 'xtend.devsurface.security.monkeypatch_blocked',
    severity: 'error',
    boundary: 'no-monkeypatching'
  }),
  frameworkDependencyBlocked: Object.freeze({
    code: 'xtend.devsurface.security.framework_dependency_blocked',
    severity: 'error',
    boundary: 'no-new-framework-dependency'
  }),
  workerOwnershipBlocked: Object.freeze({
    code: 'xtend.devsurface.security.worker_ownership_blocked',
    severity: 'error',
    boundary: 'worker-normalization-only'
  }),
  companionFreeCommandBlocked: Object.freeze({
    code: 'xtend.devsurface.security.free_command_blocked',
    severity: 'error',
    boundary: 'companion-allowlist-only'
  }),
  cspUnsafe: Object.freeze({
    code: 'xtend.devsurface.security.csp_unsafe',
    severity: 'error',
    boundary: 'extension-csp-local-only'
  }),
  extensionSkeletonInvalid: Object.freeze({
    code: 'xtend.devsurface.skeleton.invalid',
    severity: 'error',
    boundary: 'extension-skeleton'
  }),
  sourceDistDrift: Object.freeze({
    code: 'xtend.devsurface.skeleton.source_dist_drift',
    severity: 'error',
    boundary: 'source-dist-parity'
  }),
  runtimeBridgeUnavailable: Object.freeze({
    code: 'xtend.devsurface.runtime_bridge.unavailable',
    severity: 'warning',
    boundary: 'explicit-dev-api'
  }),
  runtimeBridgeInvalid: Object.freeze({
    code: 'xtend.devsurface.runtime_bridge.invalid',
    severity: 'error',
    boundary: 'explicit-dev-api'
  }),
  runtimeBridgeReadFailed: Object.freeze({
    code: 'xtend.devsurface.runtime_bridge.read_failed',
    severity: 'error',
    boundary: 'explicit-dev-api'
  }),
  runtimeBridgeSerializationFailed: Object.freeze({
    code: 'xtend.devsurface.runtime_bridge.serialization_failed',
    severity: 'error',
    boundary: 'explicit-dev-api'
  }),
  runtimeBridgeAsyncSnapshotUnsupported: Object.freeze({
    code: 'xtend.devsurface.runtime_bridge.async_snapshot_unsupported',
    severity: 'error',
    boundary: 'explicit-dev-api'
  }),
  runtimeBridgeForbiddenSource: Object.freeze({
    code: 'xtend.devsurface.runtime_bridge.forbidden_source',
    severity: 'error',
    boundary: 'explicit-dev-api'
  })
});

const SECURITY_BOUNDARY_RULES = Object.freeze([
  Object.freeze({
    id: 'no-remote-code',
    code: DIAGNOSTIC_CATALOG.remoteCodeBlocked.code,
    description: 'Extension pages and workers may not load remote code, eval strings, or use dynamic Function constructors.'
  }),
  Object.freeze({
    id: 'no-monkeypatching',
    code: DIAGNOSTIC_CATALOG.monkeypatchBlocked.code,
    description: 'The Dev Surface may not patch inspected app or browser runtime APIs.'
  }),
  Object.freeze({
    id: 'no-new-framework-dependency',
    code: DIAGNOSTIC_CATALOG.frameworkDependencyBlocked.code,
    description: 'The Dev Surface v1 does not introduce React, Vue, Angular or similar framework dependencies.'
  }),
  Object.freeze({
    id: 'worker-normalization-only',
    code: DIAGNOSTIC_CATALOG.workerOwnershipBlocked.code,
    description: 'The Prewarm Worker normalizes snapshots only and owns no DOM, host service or canonical state.'
  }),
  Object.freeze({
    id: 'companion-allowlist-only',
    code: DIAGNOSTIC_CATALOG.companionFreeCommandBlocked.code,
    description: 'The local companion may execute only allowlisted gate definitions.'
  }),
  Object.freeze({
    id: 'extension-csp-local-only',
    code: DIAGNOSTIC_CATALOG.cspUnsafe.code,
    description: 'Extension CSP must keep scripts local and disallow unsafe eval/inline execution.'
  })
]);

const REMOTE_CODE_PATTERN = /(<script[^>]+src=["']https?:|importScripts\(\s*["']https?:|eval\s*\(|new\s+Function\s*\()/iu;
const MONKEYPATCH_PATTERN = /((window|globalThis)\.fetch\s*=|history\.(pushState|replaceState)\s*=|performance\.(mark|measure)\s*=|customElements\.define\s*=)/u;
const FRAMEWORK_DEPENDENCY_PATTERN = /\b(React|Vue|Angular)\.|from\s+["'](react|vue|@angular\/core)["']|require\(["'](react|vue|@angular\/core)["']\)/u;
const WORKER_OWNERSHIP_PATTERN = /\b(document|window|localStorage|sessionStorage)\b|chrome\.devtools/u;

const PERFORMANCE_STATUS_TO_GRADE = Object.freeze({
  pass: 'optimal',
  warn: 'needs-improvement',
  fail: 'flawed',
  blocked: 'blocked',
  unknown: 'unknown'
});

const KERNEL_STATE_TO_HEALTH = Object.freeze({
  none: 'healthy',
  suspected: 'observing',
  active: 'blocked',
  recovering: 'degraded',
  recovered: 'healthy',
  failed: 'blocked'
});

const GATE_ALLOWLIST = Object.freeze({
  'xtend-dev-surface': Object.freeze({
    gateId: 'xtend-dev-surface',
    label: 'XTend Dev Surface',
    command: Object.freeze(['node', 'scripts/run_xtend_tests.js', 'xtend-dev-surface', '--json']),
    reportPath: null,
    category: 'tooling'
  }),
  'fabric-telemetry-snapshot': Object.freeze({
    gateId: 'fabric-telemetry-snapshot',
    label: 'Fabric Telemetry Snapshot',
    command: Object.freeze(['node', 'scripts/run_xtend_tests.js', 'fabric-telemetry-snapshot', '--json']),
    reportPath: null,
    category: 'fabric'
  }),
  'rmt-kernel-panic-monitor': Object.freeze({
    gateId: 'rmt-kernel-panic-monitor',
    label: 'RMT Kernel Panic Monitor',
    command: Object.freeze(['node', 'scripts/run_xtend_tests.js', 'rmt-kernel-panic-monitor', '--json']),
    reportPath: null,
    category: 'kernel'
  }),
  'pr-fast': Object.freeze({
    gateId: 'pr-fast',
    label: 'PR Fast Gates',
    command: Object.freeze(['npm', 'run', 'test:pr:report']),
    reportPath: '.xtend-test-results/xtend-pr-gate-report.json',
    category: 'ci'
  }),
  'full-release': Object.freeze({
    gateId: 'full-release',
    label: 'Full Release Gates',
    command: Object.freeze(['npm', 'run', 'test:release:full:report']),
    reportPath: '.xtend-test-results/xtend-release-gate-report.json',
    category: 'ci'
  })
});

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function normalizeNumber(value, fallback = 0, minimum = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(numberValue, minimum);
}

function roundNumber(value, digits = 2) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  const factor = 10 ** digits;
  return Math.round(numberValue * factor) / factor;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function cloneJson(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableSort(value[key]);
      return result;
    }, {});
  }
  return value;
}

function timestampFromOptions(options = {}) {
  if (options.timestamp) return options.timestamp;
  if (typeof options.clock === 'function') return options.clock();
  return new Date().toISOString();
}

function createDevSurfaceDiagnostic(code, message, severity = null, metadata = {}) {
  const catalogEntry = Object.values(DIAGNOSTIC_CATALOG).find((entry) => entry.code === code);
  return {
    schema: XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA,
    source: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    workpackage: XTEND_DEV_SURFACE_WORKPACKAGE,
    severity: normalizeString(severity, catalogEntry ? catalogEntry.severity : 'warning'),
    code: normalizeString(code, 'xtend.devsurface.unknown'),
    message: normalizeString(message, 'XTend Dev Surface diagnostic.'),
    boundary: catalogEntry ? catalogEntry.boundary : normalizeString(metadata.boundary, null),
    metadata: cloneJson(metadata, {})
  };
}

function createDevSurfaceWorkerPathRecord(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    schema: XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    workpackage: 'XDS-WP-08',
    mode: normalizeString(source.mode, 'classic-prewarm-worker'),
    source: normalizeString(source.source, `${XTEND_DEV_SURFACE_ROOT}/src/prewarm-worker.js`),
    dist: normalizeString(source.dist, `${XTEND_DEV_SURFACE_DIST_PATH}/prewarm-worker.js`),
    inputSchema: normalizeString(source.inputSchema, XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA),
    outputSchema: normalizeString(source.outputSchema, XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA),
    chartDataSchema: XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA,
    normalizationOnly: source.normalizationOnly !== false,
    ownsDom: false,
    ownsHostServices: false,
    ownsCanonicalState: false,
    remoteRuntimeAllowed: false,
    allowedMessageTypes: ['xds:normalize-snapshot'],
    outputSections: ['performance', 'hydration', 'fabric', 'kernel', 'gates', 'diagnostics', 'chartData'],
    boundary: {
      rule: 'worker-normalization-only',
      domAccessAllowed: false,
      hostServiceAccessAllowed: false,
      canonicalStateOwnershipAllowed: false,
      runtimeMutationAllowed: false
    }
  };
}

function createDevSurfaceHandoffRecord(options = {}) {
  return {
    schema: XTEND_DEV_SURFACE_HANDOFF_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    contractSchema: XTEND_DEV_SURFACE_CONTRACT_SCHEMA,
    snapshotSchema: XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA,
    workpackage: 'XDS-WP-09',
    status: normalizeString(options.status, 'completed-handoff'),
    generatedAt: timestampFromOptions(options),
    browserTarget: 'chromium-devtools-extension',
    manifestVersion: 3,
    sourceRoot: XTEND_DEV_SURFACE_ROOT,
    distRoot: XTEND_DEV_SURFACE_DIST_PATH,
    loadPath: XTEND_DEV_SURFACE_DIST_PATH,
    buildCommands: [
      'node tools/xtend-dev-surface/build.js'
    ],
    testCommands: [
      'node --check tools/xtend-dev-surface/contracts.js',
      'node --check tools/xtend-dev-surface/companion.js',
      'node --check tools/xtend-dev-surface/extension-skeleton.js',
      'node --check tools/xtend-dev-surface/src/runtime-bridge.js',
      'node --check tools/xtend-dev-surface/src/prewarm-worker.js',
      'node --check tools/xtend-dev-surface/src/panel.js',
      'node --check tools/xtend-dev-surface/build.js',
      'node tools/xtend-dev-surface/build.js',
      'node scripts/run_xtend_tests.js xtend-dev-surface --json',
      'npm run test:xtend-dev-surface'
    ],
    loadInstructions: [
      'Open chrome://extensions in a Chromium-compatible browser.',
      'Enable Developer Mode.',
      `Load ${XTEND_DEV_SURFACE_DIST_PATH} as an unpacked extension.`,
      'Open DevTools on an XTend app and select the XTend panel.'
    ],
    companion: {
      optional: true,
      origin: COMPANION_DEFAULT_ORIGIN,
      startCommand: 'XTEND_DEV_SURFACE_TOKEN=dev node tools/xtend-dev-surface/companion.js',
      tokenHeader: 'x-xtend-dev-surface-token',
      commandPolicy: 'allowlist-only'
    },
    devApi: {
      globalName: DEV_API_GLOBAL,
      requiredMethods: DEV_API_REQUIRED_METHODS.slice(),
      optionalMethods: DEV_API_OPTIONAL_METHODS.slice()
    },
    artifacts: {
      sourceContract: XTEND_DEV_SURFACE_CONTRACT_PATH,
      readme: `${XTEND_DEV_SURFACE_ROOT}/README.md`,
      contracts: `${XTEND_DEV_SURFACE_ROOT}/contracts.js`,
      types: XTEND_DEV_SURFACE_TYPES_PATH,
      distManifest: `${XTEND_DEV_SURFACE_DIST_PATH}/manifest.json`,
      buildReport: `${XTEND_DEV_SURFACE_DIST_PATH}/build-report.json`,
      handoff: `${XTEND_DEV_SURFACE_DIST_PATH}/handoff.json`,
      suite: XTEND_DEV_SURFACE_SUITE_PATH
    },
    workpackages: [
      'XDS-WP-00',
      'XDS-WP-01',
      'XDS-WP-02',
      'XDS-WP-03',
      'XDS-WP-04',
      'XDS-WP-05',
      'XDS-WP-06',
      'XDS-WP-07',
      'XDS-WP-08',
      'XDS-WP-09',
      'XDS-WP-10'
    ],
    boundaries: [
      'explicit-dev-api',
      'local-companion-allowlist',
      'no-remote-code',
      'no-monkeypatching',
      'no-new-framework-dependency',
      'worker-normalization-only'
    ]
  };
}

function createDevSurfaceContract(options = {}) {
  const defaultDevApi = {
    methods: DEV_API_REQUIRED_METHODS.concat(DEV_API_OPTIONAL_METHODS),
    version: options.devApiVersion || '1.0.0'
  };
  return {
    schema: XTEND_DEV_SURFACE_CONTRACT_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    devApiSchema: XTEND_DEV_SURFACE_DEV_API_SCHEMA,
    snapshotSchema: XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA,
    performanceSnapshotSchema: XTEND_DEV_SURFACE_PERFORMANCE_SNAPSHOT_SCHEMA,
    performanceViewSchema: XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA,
    hydrationSnapshotSchema: XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA,
    hydrationViewSchema: XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
    fabricSnapshotSchema: XTEND_DEV_SURFACE_FABRIC_SNAPSHOT_SCHEMA,
    fabricViewSchema: XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
    kernelSnapshotSchema: XTEND_DEV_SURFACE_KERNEL_SNAPSHOT_SCHEMA,
    kernelMonitorSchema: XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
    gateRunSchema: XTEND_DEV_SURFACE_GATE_RUN_SCHEMA,
    diagnosticSchema: XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA,
    securityBoundarySchema: XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA,
    runtimeBridgeSchema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
    runtimeBridgeReadSchema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA,
    companionSchema: XTEND_DEV_SURFACE_COMPANION_SCHEMA,
    gateStreamSchema: XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
    gateArtifactSchema: XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA,
    workerPathSchema: XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA,
    handoffSchema: XTEND_DEV_SURFACE_HANDOFF_SCHEMA,
    workpackage: XTEND_DEV_SURFACE_WORKPACKAGE,
    status: normalizeString(options.status, 'accepted-by-XDS-WP-01'),
    devApi: normalizeDevApiRecord(options.devApi || defaultDevApi),
    views: DEV_SURFACE_VIEWS.slice(),
    companion: {
      schema: XTEND_DEV_SURFACE_COMPANION_SCHEMA,
      workpackage: 'XDS-WP-04',
      origin: normalizeString(options.companionOrigin, COMPANION_DEFAULT_ORIGIN),
      tokenHeader: 'x-xtend-dev-surface-token',
      commandPolicy: 'allowlist-only',
      handshakeRequired: true,
      streamingStatus: true,
      artifactLinks: true,
      endpoints: ['/health', '/handshake', '/gates', '/gate-runs', '/gate-runs/events', '/artifacts/:path'],
      gates: listGateDefinitions(options.gateAllowlist || GATE_ALLOWLIST)
    },
    performanceView: {
      schema: XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA,
      workpackage: 'XDS-WP-05',
      source: `window.${DEV_API_GLOBAL}.getPerformanceSnapshot()`,
      measurementSchema: 'xtend.performance.measurement.v1',
      gradeMap: cloneJson(PERFORMANCE_STATUS_TO_GRADE, {}),
      autoRefresh: true,
      sections: ['budget', 'phase-summary', 'trend', 'measurements'],
      budgets: {
        sourceFields: ['durationMs', 'budgetMs', 'status'],
        missRule: 'durationMs > budgetMs',
        displayFields: ['budgetUsedPct', 'overBudgetMs', 'budgetMissCount']
      }
    },
    hydrationView: {
      schema: XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
      snapshotSchema: XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA,
      workpackage: 'XDS-WP-10',
      source: `window.${DEV_API_GLOBAL}.getHydrationSnapshot()`,
      optional: true,
      autoRefresh: true,
      sections: ['overview', 'timeline', 'surfaces', 'xscaler'],
      strategies: ['server_prerender_resume', 'server_prerender_hydrate', 'worker_prerender_hydrate', 'client_hydrate', 'none', 'unknown'],
      statuses: ['ready', 'hydrating', 'resumed', 'degraded', 'blocked', 'unknown'],
      xscaler: {
        embedded: true,
        displayFields: ['mode', 'preflightCount', 'acceptedCount', 'rejectedCount', 'networkDuringRender', 'lazyLoadedCount', 'atcSessions']
      },
      boundary: {
        readMode: 'explicit-dev-api-snapshot',
        domScrapingAllowed: false,
        monkeypatchingAllowed: false,
        hydrationMutationAllowed: false,
        xscalerMutationAllowed: false
      }
    },
    fabricView: {
      schema: XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
      workpackage: 'XDS-WP-07',
      source: `window.${DEV_API_GLOBAL}.getFabricTelemetrySnapshot()`,
      telemetrySchema: 'xtend.fabric.telemetry-snapshot.v1',
      autoRefresh: true,
      sections: ['fabric-health', 'lane-summary', 'fiber-summary', 'backpressure', 'critical-lanes'],
      lanes: {
        displayFields: ['utilizationPct', 'fiberCount', 'failedCount', 'budgetMissCount', 'backpressureLevel'],
        healthRule: 'failedCount > 0 || budgetMissCount > 0 || backpressureLevel in high/critical'
      },
      boundary: {
        readMode: 'explicit-dev-api-snapshot',
        monkeypatchingAllowed: false,
        fabricMutationAllowed: false
      }
    },
    workerPath: createDevSurfaceWorkerPathRecord(options.workerPath || {}),
    handoff: createDevSurfaceHandoffRecord(options.handoff || {}),
    kernelMonitor: {
      schema: XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
      workpackage: 'XDS-WP-06',
      source: `window.${DEV_API_GLOBAL}.getKernelSnapshot()`,
      panicStateSchema: 'xtend.rmt.kernel-panic-state.v1',
      healthMap: cloneJson(KERNEL_STATE_TO_HEALTH, {}),
      autoRefresh: true,
      sections: ['kernel-health', 'panic-state', 'recovery-action', 'mitigation-strategy', 'affected-scopes'],
      boundary: {
        readMode: 'explicit-dev-api-snapshot',
        monkeypatchingAllowed: false,
        kernelMutationAllowed: false
      }
    },
    diagnostics: {
      catalog: Object.keys(DIAGNOSTIC_CATALOG).sort().map((key) => ({
        id: key,
        ...DIAGNOSTIC_CATALOG[key]
      }))
    },
    security: {
      schema: XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA,
      rules: SECURITY_BOUNDARY_RULES.slice()
    },
    runtimeBridge: {
      schema: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
      workpackage: 'XDS-WP-03',
      devApiGlobal: DEV_API_GLOBAL,
      readMode: 'chrome.devtools.inspectedWindow.eval',
      allowedReads: [
        'version',
        'getPerformanceSnapshot',
        'getHydrationSnapshot',
        'getFabricTelemetrySnapshot',
        'getKernelSnapshot',
        'subscribe'
      ],
      snapshotSources: [
        'xtend.performance.measurement.v1',
        XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA,
        'xtend.xscaler.preflight-response.v1',
        'xtend.xscaler.atc-handoff.v1',
        'xtend.fabric.telemetry-snapshot.v1',
        'xtend.rmt.kernel-panic-state.v1'
      ],
      monkeypatchingAllowed: false,
      remoteRuntimeAllowed: false,
      uiCoprocessorAllowed: false,
      prewarmWorkerAllowed: true
    },
    paths: {
      root: XTEND_DEV_SURFACE_ROOT,
      dist: XTEND_DEV_SURFACE_DIST_PATH,
      contract: XTEND_DEV_SURFACE_CONTRACT_PATH,
      module: `${XTEND_DEV_SURFACE_ROOT}/contracts.js`,
      types: XTEND_DEV_SURFACE_TYPES_PATH,
      suite: XTEND_DEV_SURFACE_SUITE_PATH
    }
  };
}

function normalizeDevApiRecord(api = {}) {
  const source = api && typeof api === 'object' ? api : {};
  const providedMethods = toArray(source.methods)
    .concat(Object.keys(source).filter((key) => typeof source[key] === 'function'))
    .filter(Boolean)
    .map(String);
  const uniqueProvidedMethods = Array.from(new Set(providedMethods));
  const missingMethods = DEV_API_REQUIRED_METHODS.filter((method) => !uniqueProvidedMethods.includes(method));
  const diagnostics = missingMethods.map((method) => createDevSurfaceDiagnostic(
    DIAGNOSTIC_CATALOG.devApiMethodMissing.code,
    `XTend DEV API is missing required method "${method}".`,
    DIAGNOSTIC_CATALOG.devApiMethodMissing.severity,
    { method, globalName: DEV_API_GLOBAL }
  ));

  return {
    schema: XTEND_DEV_SURFACE_DEV_API_SCHEMA,
    globalName: DEV_API_GLOBAL,
    version: normalizeString(source.version, null),
    requiredMethods: DEV_API_REQUIRED_METHODS.slice(),
    optionalMethods: DEV_API_OPTIONAL_METHODS.slice(),
    providedMethods: uniqueProvidedMethods.sort(),
    missingMethods,
    subscribeSupported: uniqueProvidedMethods.includes('subscribe') || typeof source.subscribe === 'function',
    diagnostics,
    ok: missingMethods.length === 0
  };
}

function normalizePerformanceStatus(measurement = {}) {
  const explicit = normalizeString(measurement.status, '').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(PERFORMANCE_STATUS_TO_GRADE, explicit)) return explicit;

  const durationMs = Number(measurement.durationMs);
  const budgetMs = Number(measurement.budgetMs);
  if (Number.isFinite(durationMs) && Number.isFinite(budgetMs) && budgetMs > 0) {
    if (durationMs <= budgetMs) return 'pass';
    if (durationMs <= budgetMs * 1.5) return 'warn';
    return 'fail';
  }

  return 'unknown';
}

function normalizePerformanceMeasurement(measurement = {}, index = 0) {
  const source = measurement && typeof measurement === 'object' ? measurement : {};
  const status = normalizePerformanceStatus(source);
  const durationMs = normalizeNumber(source.durationMs, 0, 0);
  const budgetMs = normalizeNumber(source.budgetMs, 0, 0);
  const budgetDeltaMs = budgetMs > 0 ? roundNumber(durationMs - budgetMs) : 0;
  const budgetUsedPct = budgetMs > 0 ? Math.round((durationMs / budgetMs) * 100) : 0;
  return {
    schema: normalizeString(source.schema, 'xtend.performance.measurement.v1'),
    id: normalizeString(source.id, `xtend.devsurface.measurement.${index + 1}`),
    name: normalizeString(source.name || source.entryName, `measurement.${index + 1}`),
    phase: normalizeString(source.phase, 'unknown'),
    profile: normalizeString(source.profile, 'unknown'),
    lane: normalizeString(source.lane, null),
    durationMs,
    budgetMs,
    budgetDeltaMs,
    budgetUsedPct,
    budgetStatus: budgetMs > 0 ? (durationMs > budgetMs ? status : 'pass') : 'unknown',
    status,
    grade: PERFORMANCE_STATUS_TO_GRADE[status] || 'unknown',
    sampleKind: normalizeString(source.sampleKind, 'telemetry'),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function summarizePerformanceMeasurements(measurements = []) {
  const summary = {
    totalCount: measurements.length,
    passCount: 0,
    warnCount: 0,
    failCount: 0,
    unknownCount: 0,
    budgetMissCount: 0,
    totalDurationMs: 0,
    totalBudgetMs: 0,
    overBudgetMs: 0,
    averageDurationMs: 0,
    budgetUsedPct: 0,
    status: 'unknown',
    grade: 'unknown'
  };

  measurements.forEach((measurement) => {
    if (measurement.status === 'pass') summary.passCount += 1;
    else if (measurement.status === 'warn') summary.warnCount += 1;
    else if (measurement.status === 'fail') summary.failCount += 1;
    else summary.unknownCount += 1;
    summary.totalDurationMs += measurement.durationMs || 0;
    summary.totalBudgetMs += measurement.budgetMs || 0;
    if (measurement.budgetMs > 0 && measurement.durationMs > measurement.budgetMs) {
      summary.budgetMissCount += 1;
      summary.overBudgetMs += measurement.durationMs - measurement.budgetMs;
    }
  });

  summary.totalDurationMs = roundNumber(summary.totalDurationMs);
  summary.totalBudgetMs = roundNumber(summary.totalBudgetMs);
  summary.overBudgetMs = roundNumber(summary.overBudgetMs);
  summary.averageDurationMs = measurements.length > 0
    ? roundNumber(summary.totalDurationMs / measurements.length)
    : 0;
  summary.budgetUsedPct = summary.totalBudgetMs > 0
    ? Math.round((summary.totalDurationMs / summary.totalBudgetMs) * 100)
    : 0;

  if (summary.failCount > 0) summary.status = 'fail';
  else if (summary.warnCount > 0) summary.status = 'warn';
  else if (summary.passCount > 0 && summary.unknownCount === 0) summary.status = 'pass';
  summary.grade = PERFORMANCE_STATUS_TO_GRADE[summary.status] || 'unknown';

  return summary;
}

function createEmptyPerformanceBucket(id) {
  return {
    phase: normalizeString(id, 'unknown'),
    measurementCount: 0,
    passCount: 0,
    warnCount: 0,
    failCount: 0,
    unknownCount: 0,
    budgetMissCount: 0,
    totalDurationMs: 0,
    totalBudgetMs: 0,
    overBudgetMs: 0,
    averageDurationMs: 0,
    budgetUsedPct: 0,
    status: 'unknown',
    grade: 'unknown',
    source: null
  };
}

function finalizePerformanceBucket(bucket) {
  const result = {
    ...bucket,
    totalDurationMs: roundNumber(bucket.totalDurationMs),
    totalBudgetMs: roundNumber(bucket.totalBudgetMs),
    overBudgetMs: roundNumber(bucket.overBudgetMs),
    averageDurationMs: bucket.measurementCount > 0
      ? roundNumber(bucket.totalDurationMs / bucket.measurementCount)
      : 0,
    budgetUsedPct: bucket.totalBudgetMs > 0
      ? Math.round((bucket.totalDurationMs / bucket.totalBudgetMs) * 100)
      : 0
  };

  if (result.failCount > 0) result.status = 'fail';
  else if (result.warnCount > 0) result.status = 'warn';
  else if (result.passCount > 0 && result.unknownCount === 0) result.status = 'pass';
  result.grade = PERFORMANCE_STATUS_TO_GRADE[result.status] || 'unknown';
  return result;
}

function normalizePerformancePhaseSummary(measurements = [], providedSummary = {}) {
  const buckets = new Map();
  measurements.forEach((measurement) => {
    const phase = normalizeString(measurement.phase, 'unknown');
    if (!buckets.has(phase)) buckets.set(phase, createEmptyPerformanceBucket(phase));
    const bucket = buckets.get(phase);
    bucket.measurementCount += 1;
    if (measurement.status === 'pass') bucket.passCount += 1;
    else if (measurement.status === 'warn') bucket.warnCount += 1;
    else if (measurement.status === 'fail') bucket.failCount += 1;
    else bucket.unknownCount += 1;
    bucket.totalDurationMs += measurement.durationMs || 0;
    bucket.totalBudgetMs += measurement.budgetMs || 0;
    if (measurement.budgetMs > 0 && measurement.durationMs > measurement.budgetMs) {
      bucket.budgetMissCount += 1;
      bucket.overBudgetMs += measurement.durationMs - measurement.budgetMs;
    }
  });

  if (providedSummary && typeof providedSummary === 'object' && !Array.isArray(providedSummary)) {
    Object.keys(providedSummary).forEach((phase) => {
      if (!buckets.has(phase)) buckets.set(phase, createEmptyPerformanceBucket(phase));
      buckets.get(phase).source = cloneJson(providedSummary[phase], {});
    });
  }

  return Array.from(buckets.keys()).sort().map((phase) => finalizePerformanceBucket(buckets.get(phase)));
}

function normalizePerformanceTrendSample(sample = {}, index = 0) {
  const source = sample && typeof sample === 'object' ? sample : {};
  const summary = source.summary && typeof source.summary === 'object' ? source.summary : {};
  return {
    id: normalizeString(source.id, `xtend.devsurface.performance-trend.${index + 1}`),
    timestamp: normalizeString(source.timestamp || source.generatedAt, null),
    grade: normalizeString(source.grade || summary.grade, 'unknown'),
    totalDurationMs: roundNumber(source.totalDurationMs !== undefined ? source.totalDurationMs : summary.totalDurationMs),
    totalBudgetMs: roundNumber(source.totalBudgetMs !== undefined ? source.totalBudgetMs : summary.totalBudgetMs),
    budgetUsedPct: normalizeNumber(source.budgetUsedPct !== undefined ? source.budgetUsedPct : summary.budgetUsedPct, 0, 0),
    budgetMissCount: normalizeNumber(source.budgetMissCount !== undefined ? source.budgetMissCount : summary.budgetMissCount, 0, 0)
  };
}

function normalizePerformanceTrend(input = {}, summary = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const rawSamples = source.samples || source.trend || source.history || [];
  const samples = toArray(rawSamples).map(normalizePerformanceTrendSample);
  const currentSample = samples.length > 0
    ? samples[samples.length - 1]
    : normalizePerformanceTrendSample({ summary }, 0);
  const previousSample = samples.length > 1 ? samples[samples.length - 2] : null;
  const currentBudgetUsedPct = currentSample.budgetUsedPct || summary.budgetUsedPct || 0;
  const previousBudgetUsedPct = previousSample ? previousSample.budgetUsedPct : null;
  const deltaBudgetUsedPct = previousBudgetUsedPct === null ? 0 : currentBudgetUsedPct - previousBudgetUsedPct;
  let direction = 'stable';

  if (deltaBudgetUsedPct < 0) direction = 'improved';
  else if (deltaBudgetUsedPct > 0) direction = 'regressed';

  return {
    schema: XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA,
    sampleCount: samples.length,
    direction,
    previousBudgetUsedPct,
    currentBudgetUsedPct,
    deltaBudgetUsedPct,
    grade: summary.grade || currentSample.grade || 'unknown',
    samples
  };
}

function normalizePerformanceSnapshot(snapshot = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const rawMeasurements = toArray(source.measurements || source.performanceMeasurements || source.entries);
  const measurements = rawMeasurements.map(normalizePerformanceMeasurement);
  const summary = summarizePerformanceMeasurements(measurements);
  const phaseSummary = normalizePerformancePhaseSummary(measurements, source.phaseSummary);
  const phaseSummaryByPhase = phaseSummary.reduce((result, phase) => {
    result[phase.phase] = phase;
    return result;
  }, {});
  const trend = normalizePerformanceTrend(source, summary);
  return {
    schema: XTEND_DEV_SURFACE_PERFORMANCE_SNAPSHOT_SCHEMA,
    viewSchema: XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA,
    measurementSchema: 'xtend.performance.measurement.v1',
    supported: normalizeBoolean(source.supported, measurements.length > 0),
    measurements,
    phaseSummary,
    phaseSummaryByPhase,
    budget: {
      schema: XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA,
      grade: summary.grade,
      status: summary.status,
      budgetUsedPct: summary.budgetUsedPct,
      budgetMissCount: summary.budgetMissCount,
      totalDurationMs: summary.totalDurationMs,
      totalBudgetMs: summary.totalBudgetMs,
      overBudgetMs: summary.overBudgetMs
    },
    trend,
    summary
  };
}

function normalizeFiberRecord(fiber = {}, laneId = 'unknown', index = 0) {
  if (typeof fiber === 'string') {
    return {
      id: fiber,
      label: fiber,
      lane: laneId,
      status: 'reported',
      durationMs: 0,
      budgetMs: 0,
      budgetUsedPct: 0,
      failed: false,
      budgetMiss: false,
      metadata: {}
    };
  }

  const source = fiber && typeof fiber === 'object' ? fiber : {};
  const durationMs = normalizeNumber(source.durationMs, 0, 0);
  const budgetMs = normalizeNumber(source.budgetMs, 0, 0);
  const status = normalizeString(source.status, source.failed === true ? 'failed' : 'reported');
  return {
    id: normalizeString(source.id || source.fiberId || source.name, `${laneId}.fiber.${index + 1}`),
    label: normalizeString(source.label || source.name, source.id || source.fiberId || `${laneId}.fiber.${index + 1}`),
    lane: normalizeString(source.lane, laneId),
    status,
    durationMs,
    budgetMs,
    budgetUsedPct: budgetMs > 0 ? Math.round((durationMs / budgetMs) * 100) : 0,
    failed: source.failed === true || status === 'failed',
    budgetMiss: source.budgetMiss === true || (budgetMs > 0 && durationMs > budgetMs),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeFabricBackpressure(backpressure = {}, lanes = []) {
  const source = backpressure && typeof backpressure === 'object' ? backpressure : {};
  const laneIds = toArray(source.laneIds || source.lanes || source.pressureLaneIds).map(String);
  const inferredLevel = lanes.some((lane) => lane.backpressureLevel === 'critical')
    ? 'critical'
    : (lanes.some((lane) => lane.backpressureLevel === 'high') ? 'high' : 'none');
  const level = normalizeString(source.level || source.status, inferredLevel);
  return {
    schema: XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
    level,
    action: normalizeString(source.action || source.recommendedAction, level === 'none' ? 'observe' : 'defer-or-rebalance'),
    laneIds,
    pressureLaneCount: laneIds.length || lanes.filter((lane) => ['high', 'critical'].includes(lane.backpressureLevel)).length,
    reason: normalizeString(source.reason, null),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeLaneSummary(laneId, lane = {}) {
  const source = lane && typeof lane === 'object' ? lane : {};
  const normalizedLaneId = normalizeString(source.lane || source.id || laneId, laneId);
  const fibers = toArray(source.fibers || source.fiberRecords).map((fiber, index) => normalizeFiberRecord(fiber, normalizedLaneId, index));
  const fiberCount = normalizeNumber(source.fiberCount, fibers.length, 0);
  const failedCount = normalizeNumber(source.failedCount, fibers.filter((fiber) => fiber.failed).length, 0);
  const budgetMissCount = normalizeNumber(source.budgetMissCount, fibers.filter((fiber) => fiber.budgetMiss).length, 0);
  const deadlineMs = normalizeNumber(source.deadlineMs, 0, 0);
  const maxDurationMs = normalizeNumber(source.maxDurationMs, source.averageDurationMs || 0, 0);
  const averageDurationMs = normalizeNumber(source.averageDurationMs, 0, 0);
  const utilizationRawPct = deadlineMs > 0
    ? Math.min(100, Math.round((Math.max(maxDurationMs, averageDurationMs) / deadlineMs) * 100))
    : 0;
  const uncappedUtilizationPct = deadlineMs > 0
    ? Math.round((Math.max(maxDurationMs, averageDurationMs) / deadlineMs) * 100)
    : 0;
  const backpressureLevel = normalizeString(source.backpressureLevel || source.backpressure && source.backpressure.level, (
    uncappedUtilizationPct >= 150 || failedCount > 0 ? 'critical' : (uncappedUtilizationPct >= 100 || budgetMissCount > 0 ? 'high' : 'none')
  ));
  const health = failedCount > 0 || budgetMissCount > 0 || ['high', 'critical'].includes(backpressureLevel)
    ? (backpressureLevel === 'critical' || failedCount > 0 ? 'degraded' : 'observing')
    : 'healthy';

  return {
    schema: XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
    lane: normalizedLaneId,
    priority: normalizeString(source.priority, 'normal'),
    budgetClass: normalizeString(source.budgetClass, 'unknown'),
    deadlineMs,
    fiberCount,
    activeFiberCount: normalizeNumber(source.activeFiberCount, 0, 0),
    pendingFiberCount: normalizeNumber(source.pendingFiberCount || source.queuedFiberCount, 0, 0),
    suspendedFiberCount: normalizeNumber(source.suspendedFiberCount, 0, 0),
    completedCount: normalizeNumber(source.completedCount, 0, 0),
    failedCount,
    budgetMissCount,
    failureRatePct: fiberCount > 0 ? Math.round((failedCount / fiberCount) * 100) : 0,
    budgetMissRatePct: fiberCount > 0 ? Math.round((budgetMissCount / fiberCount) * 100) : 0,
    averageDurationMs,
    maxDurationMs,
    utilizationPct: utilizationRawPct,
    utilizationRawPct: uncappedUtilizationPct,
    backpressureLevel,
    health,
    fibers,
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeFabricTelemetrySnapshot(snapshot = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const laneSource = source.lanes && typeof source.lanes === 'object' ? source.lanes : {};
  const lanes = Array.isArray(laneSource)
    ? laneSource.map((lane, index) => normalizeLaneSummary(lane && (lane.lane || lane.id) || `lane.${index + 1}`, lane))
    : Object.keys(laneSource).sort().map((laneId) => normalizeLaneSummary(laneId, laneSource[laneId]));
  const totals = cloneJson(source.totals || {}, {});
  const backpressure = normalizeFabricBackpressure(source.backpressure || {}, lanes);
  const computedTotals = lanes.reduce((result, lane) => {
    result.fiberCount += lane.fiberCount;
    result.completedCount += lane.completedCount;
    result.failedCount += lane.failedCount;
    result.budgetMissCount += lane.budgetMissCount;
    result.activeFiberCount += lane.activeFiberCount;
    result.pendingFiberCount += lane.pendingFiberCount;
    result.suspendedFiberCount += lane.suspendedFiberCount;
    result.maxUtilizationPct = Math.max(result.maxUtilizationPct, lane.utilizationRawPct);
    result.totalUtilizationPct += lane.utilizationRawPct;
    return result;
  }, {
    fiberCount: 0,
    completedCount: 0,
    failedCount: 0,
    budgetMissCount: 0,
    activeFiberCount: 0,
    pendingFiberCount: 0,
    suspendedFiberCount: 0,
    maxUtilizationPct: 0,
    totalUtilizationPct: 0
  });
  const criticalLanes = lanes.filter((lane) => lane.health !== 'healthy' || ['high', 'critical'].includes(lane.backpressureLevel));
  const degradedLaneCount = lanes.filter((lane) => lane.health !== 'healthy').length;
  const fiberCount = normalizeNumber(source.fiberCount, totals.fiberCount || computedTotals.fiberCount, 0);
  const failedCount = normalizeNumber(totals.failedCount, computedTotals.failedCount, 0);
  const budgetMissCount = normalizeNumber(totals.budgetMissCount, computedTotals.budgetMissCount, 0);
  const health = criticalLanes.length > 0 || ['critical', 'high'].includes(backpressure.level) ? 'degraded' : 'healthy';
  const fiberSummary = {
    schema: XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
    fiberCount,
    completedCount: normalizeNumber(totals.completedCount, computedTotals.completedCount, 0),
    failedCount,
    budgetMissCount,
    activeFiberCount: normalizeNumber(totals.activeFiberCount, computedTotals.activeFiberCount, 0),
    pendingFiberCount: normalizeNumber(totals.pendingFiberCount, computedTotals.pendingFiberCount, 0),
    suspendedFiberCount: normalizeNumber(totals.suspendedFiberCount, computedTotals.suspendedFiberCount, 0)
  };
  const summary = {
    schema: XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
    health,
    laneCount: lanes.length,
    fiberCount,
    completedCount: fiberSummary.completedCount,
    failedCount,
    budgetMissCount,
    criticalLaneCount: criticalLanes.length,
    degradedLaneCount,
    backpressureLevel: backpressure.level,
    pressureLaneCount: backpressure.pressureLaneCount,
    averageUtilizationPct: lanes.length > 0 ? Math.round(computedTotals.totalUtilizationPct / lanes.length) : 0,
    maxUtilizationPct: computedTotals.maxUtilizationPct,
    needsAttention: health !== 'healthy' || failedCount > 0 || budgetMissCount > 0
  };

  return {
    schema: XTEND_DEV_SURFACE_FABRIC_SNAPSHOT_SCHEMA,
    viewSchema: XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
    telemetrySchema: normalizeString(source.schema, 'xtend.fabric.telemetry-snapshot.v1'),
    id: normalizeString(source.id, null),
    fiberCount,
    diagnosticCount: normalizeNumber(source.diagnosticCount, 0, 0),
    lanes,
    laneCount: lanes.length,
    totals,
    backpressure,
    fiberSummary,
    criticalLanes,
    summary,
    health
  };
}

function normalizeKernelState(value) {
  const state = normalizeString(value, 'none');
  if (Object.prototype.hasOwnProperty.call(KERNEL_STATE_TO_HEALTH, state)) return state;
  return 'unknown';
}

function kernelRecoveryStatusForState(state, recoveryFailureCount = 0) {
  if (state === 'failed' || recoveryFailureCount > 0) return 'failed';
  if (state === 'recovering') return 'active';
  if (state === 'recovered') return 'completed';
  if (state === 'active' || state === 'suspected') return 'pending';
  if (state === 'none') return 'idle';
  return 'unknown';
}

function normalizeKernelScopeRecord(scope = {}, index = 0, fallbackSeverity = 'info') {
  if (typeof scope === 'string') {
    return {
      id: scope,
      label: scope,
      kind: 'scope',
      severity: fallbackSeverity,
      status: 'affected',
      mitigationStrategy: null,
      blockedCommitCount: 0,
      criticalViolationCount: 0,
      metadata: {}
    };
  }

  const source = scope && typeof scope === 'object' ? scope : {};
  const id = normalizeString(source.id || source.scopeId || source.name, `scope.${index + 1}`);
  return {
    id,
    label: normalizeString(source.label || source.name, id),
    kind: normalizeString(source.kind || source.type, 'scope'),
    severity: normalizeString(source.severity, fallbackSeverity),
    status: normalizeString(source.status, 'affected'),
    mitigationStrategy: normalizeString(source.mitigationStrategy || source.strategy, null),
    blockedCommitCount: normalizeNumber(source.blockedCommitCount, 0, 0),
    criticalViolationCount: normalizeNumber(source.criticalViolationCount, 0, 0),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeKernelJobRecord(job = {}, index = 0, fallbackSeverity = 'info') {
  if (typeof job === 'string') {
    return {
      id: job,
      label: job,
      status: 'affected',
      severity: fallbackSeverity,
      lane: null,
      metadata: {}
    };
  }

  const source = job && typeof job === 'object' ? job : {};
  const id = normalizeString(source.id || source.jobId || source.name, `job.${index + 1}`);
  return {
    id,
    label: normalizeString(source.label || source.name, id),
    status: normalizeString(source.status, 'affected'),
    severity: normalizeString(source.severity, fallbackSeverity),
    lane: normalizeString(source.lane, null),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeKernelMitigationRecord(mitigation = {}, index = 0) {
  if (typeof mitigation === 'string') {
    return {
      id: `mitigation.${index + 1}`,
      strategy: mitigation,
      action: mitigation,
      status: 'pending',
      scope: null,
      evidence: null,
      metadata: {}
    };
  }

  const source = mitigation && typeof mitigation === 'object' ? mitigation : {};
  const strategy = normalizeString(source.strategy || source.mitigationStrategy || source.action, 'none');
  return {
    id: normalizeString(source.id || source.mitigationId, `mitigation.${index + 1}`),
    strategy,
    action: normalizeString(source.action || source.recoveryAction, strategy),
    status: normalizeString(source.status, 'pending'),
    scope: normalizeString(source.scope || source.scopeId, null),
    evidence: normalizeString(source.evidence, null),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeKernelSnapshot(snapshot = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const state = normalizeKernelState(source.state || source.panicState || 'none');
  const health = KERNEL_STATE_TO_HEALTH[state] || 'unknown';
  const severity = normalizeString(source.severity, state === 'none' ? 'info' : 'warning');
  const recoveryAction = normalizeString(source.recoveryAction || source.defaultRecoveryAction, 'none');
  const mitigationStrategy = normalizeString(source.mitigationStrategy || recoveryAction, recoveryAction);
  const blockedCommitCount = normalizeNumber(source.blockedCommitCount, 0, 0);
  const criticalViolationCount = normalizeNumber(source.criticalViolationCount, 0, 0);
  const recoveryAttemptCount = normalizeNumber(source.recoveryAttemptCount, 0, 0);
  const recoveryFailureCount = normalizeNumber(source.recoveryFailureCount, 0, 0);
  const affectedScopes = toArray(source.affectedScopes).map((scope, index) => normalizeKernelScopeRecord(scope, index, severity));
  const affectedJobs = toArray(source.affectedJobs).map((job, index) => normalizeKernelJobRecord(job, index, severity));
  const rawMitigations = toArray(source.mitigationStrategies || source.mitigations || source.mitigationPlan);
  const mitigationStrategies = rawMitigations.length > 0
    ? rawMitigations.map(normalizeKernelMitigationRecord)
    : (mitigationStrategy && mitigationStrategy !== 'none'
      ? [normalizeKernelMitigationRecord({ strategy: mitigationStrategy, action: recoveryAction, status: kernelRecoveryStatusForState(state, recoveryFailureCount) }, 0)]
      : []);
  const recoveryStatus = kernelRecoveryStatusForState(state, recoveryFailureCount);
  const panic = {
    schema: XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
    state,
    health,
    severity,
    trigger: normalizeString(source.trigger, null),
    panicId: normalizeString(source.panicId, null),
    correlationId: normalizeString(source.correlationId, null),
    detectedAt: normalizeString(source.detectedAt || source.startedAt, null),
    lastSeenAt: normalizeString(source.lastSeenAt || source.updatedAt, null)
  };
  const recovery = {
    schema: XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
    status: recoveryStatus,
    action: recoveryAction,
    strategy: mitigationStrategy,
    attemptCount: recoveryAttemptCount,
    failureCount: recoveryFailureCount,
    blockedCommitCount,
    lastRecoveredAt: normalizeString(source.lastRecoveredAt || source.recoveredAt, null),
    evidence: normalizeString(source.recoveryEvidence, null)
  };
  const mitigation = {
    schema: XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
    strategy: mitigationStrategy,
    action: recoveryAction,
    count: mitigationStrategies.length,
    strategies: mitigationStrategies
  };
  const summary = {
    schema: XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
    health,
    state,
    severity,
    affectedScopeCount: affectedScopes.length,
    affectedJobCount: affectedJobs.length,
    mitigationCount: mitigationStrategies.length,
    blockedCommitCount,
    criticalViolationCount,
    recoveryAttemptCount,
    recoveryFailureCount,
    recoveryStatus,
    needsAttention: health !== 'healthy' || criticalViolationCount > 0 || recoveryFailureCount > 0
  };

  return {
    schema: XTEND_DEV_SURFACE_KERNEL_SNAPSHOT_SCHEMA,
    viewSchema: XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
    panicSchema: normalizeString(source.schema, 'xtend.rmt.kernel-panic-state.v1'),
    state,
    health,
    severity,
    trigger: panic.trigger,
    panicId: panic.panicId,
    correlationId: panic.correlationId,
    recoveryAction,
    mitigationStrategy,
    blockedCommitCount,
    criticalViolationCount,
    recoveryAttemptCount,
    recoveryFailureCount,
    affectedScopes,
    affectedJobs,
    panic,
    recovery,
    mitigation,
    summary,
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeHydrationTiming(timing = {}) {
  const source = timing && typeof timing === 'object' ? timing : {};
  return {
    schema: XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
    ssrRenderMs: normalizeNumber(source.ssrRenderMs, 0, 0),
    resumeReadMs: normalizeNumber(source.resumeReadMs, 0, 0),
    hydrateMs: normalizeNumber(source.hydrateMs, 0, 0),
    firstInteractiveMs: normalizeNumber(source.firstInteractiveMs, 0, 0),
    clsValue: roundNumber(source.clsValue, 4)
  };
}

function normalizeHydrationSurfaceRecord(surface = {}, index = 0, fallbackStrategy = 'unknown') {
  if (typeof surface === 'string') {
    return {
      id: surface,
      label: surface,
      rootId: null,
      strategy: fallbackStrategy,
      status: 'unknown',
      resumeTokenPresent: false,
      lazy: false,
      xscalerState: 'unknown',
      timing: normalizeHydrationTiming(),
      metadata: {}
    };
  }

  const source = surface && typeof surface === 'object' ? surface : {};
  const id = normalizeString(source.id || source.surfaceId || source.rootId || source.name, `surface.${index + 1}`);
  const status = normalizeString(source.status || source.hydrationStatus || source.resumeStatus || source.lazyState, 'unknown');
  return {
    id,
    label: normalizeString(source.label || source.title || source.name, id),
    rootId: normalizeString(source.rootId, null),
    strategy: normalizeString(source.strategy, fallbackStrategy),
    status,
    resumeTokenPresent: source.resumeTokenPresent === true || Boolean(source.resumeToken),
    lazy: source.lazy === true,
    xscalerState: normalizeString(source.xscalerState || source.preflightStatus, 'unknown'),
    timing: normalizeHydrationTiming(source.timing || {}),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeHydrationTimelineStep(step = {}, index = 0) {
  if (typeof step === 'string') {
    return {
      id: `hydration.step.${index + 1}`,
      label: step,
      kind: 'custom',
      status: 'unknown',
      durationMs: 0,
      at: null,
      metadata: {}
    };
  }

  const source = step && typeof step === 'object' ? step : {};
  const id = normalizeString(source.id || source.stepId, `hydration.step.${index + 1}`);
  return {
    id,
    label: normalizeString(source.label || source.name, id),
    kind: normalizeString(source.kind || source.type, 'custom'),
    status: normalizeString(source.status, 'unknown'),
    durationMs: normalizeNumber(source.durationMs, 0, 0),
    at: normalizeString(source.at || source.timestamp, null),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeXScalerAtcSession(session = {}, index = 0) {
  if (typeof session === 'string') {
    return {
      id: session,
      sessionId: session,
      protocol: null,
      route: null,
      mode: null,
      lifecycleState: null,
      activation: null,
      schedulerLane: null,
      componentMix: [],
      metadata: {}
    };
  }

  const source = session && typeof session === 'object' ? session : {};
  const sessionId = normalizeString(source.sessionId || source.id, `xscaler.atc.${index + 1}`);
  return {
    id: sessionId,
    sessionId,
    protocol: normalizeString(source.protocol, null),
    route: normalizeString(source.route, null),
    mode: normalizeString(source.mode, null),
    lifecycleState: normalizeString(source.lifecycleState, null),
    activation: normalizeString(source.activation, null),
    schedulerLane: normalizeString(source.schedulerLane, null),
    componentMix: toArray(source.componentMix).map(String),
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function normalizeXScalerSnapshot(xscaler = {}) {
  const source = xscaler && typeof xscaler === 'object' ? xscaler : {};
  const preflights = toArray(source.preflights || source.preflightRecords || source.preflightHistory).map((preflight, index) => {
    const entry = preflight && typeof preflight === 'object' ? preflight : {};
    return {
      id: normalizeString(entry.id || entry.surface || entry.rmtSurface, `xscaler.preflight.${index + 1}`),
      surface: normalizeString(entry.surface || entry.surfaceId, null),
      accepted: entry.accepted === true || entry.ok === true,
      rejected: entry.accepted === false || entry.ok === false,
      networkDuringRender: entry.networkDuringRender === true,
      lazyAfterHydration: entry.lazyAfterHydration === true,
      reason: normalizeString(entry.reason, null),
      rejection: cloneJson(entry.rejection || null, null),
      atc: entry.atc ? normalizeXScalerAtcSession(entry.atc, index) : null,
      metadata: cloneJson(entry.metadata || {}, {})
    };
  });
  const rawAtcSessions = toArray(source.atcSessions || source.atc || source.handoffs)
    .concat(preflights.map((preflight) => preflight.atc).filter(Boolean));
  const atcSessions = rawAtcSessions.map(normalizeXScalerAtcSession);
  const preflightCount = normalizeNumber(source.preflightCount, preflights.length, 0);
  const acceptedCount = normalizeNumber(source.acceptedCount, preflights.filter((preflight) => preflight.accepted).length, 0);
  const rejectedCount = normalizeNumber(source.rejectedCount, preflights.filter((preflight) => preflight.rejected).length, 0);
  const networkDuringRender = source.networkDuringRender === true || preflights.some((preflight) => preflight.networkDuringRender);
  const lazyLoadedCount = normalizeNumber(source.lazyLoadedCount || source.lazySurfaceCount, 0, 0);
  const status = networkDuringRender || rejectedCount > 0
    ? 'degraded'
    : (preflightCount > 0 || lazyLoadedCount > 0 || atcSessions.length > 0 ? 'ready' : 'unknown');

  return {
    schema: XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
    mode: normalizeString(source.mode, 'unknown'),
    status,
    preflightEndpoint: normalizeString(source.preflightEndpoint, null),
    lazyEndpoint: normalizeString(source.lazyEndpoint, null),
    preflightCount,
    acceptedCount,
    rejectedCount,
    networkDuringRender,
    lazyLoadedCount,
    atcSessionCount: atcSessions.length,
    atcSessions,
    preflights,
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function createHydrationTimeline(source, timing, xscaler) {
  const providedSteps = toArray(source.timeline || source.steps);
  if (providedSteps.length > 0) return providedSteps.map(normalizeHydrationTimelineStep);

  const status = normalizeString(source.status, 'unknown');
  const resumeToken = normalizeString(source.resumeToken || source.token, null);
  const responseKind = normalizeString(source.responseKind || source.response && source.response.kind, null);
  const hydrateStatus = status === 'resumed' || status === 'ready'
    ? 'completed'
    : (status === 'hydrating' ? 'active' : (status === 'blocked' ? 'failed' : 'unknown'));
  return [
    {
      id: 'hydration.ssr-response',
      label: 'SSR response',
      kind: 'ssr-response',
      status: responseKind ? 'completed' : 'unknown',
      durationMs: timing.ssrRenderMs,
      metadata: { responseKind }
    },
    {
      id: 'hydration.resume-payload',
      label: 'Resume payload',
      kind: 'resume-payload',
      status: resumeToken ? 'completed' : 'unknown',
      durationMs: timing.resumeReadMs,
      metadata: { resumeTokenPresent: Boolean(resumeToken) }
    },
    {
      id: 'hydration.token-read',
      label: 'Resume token read',
      kind: 'token-read',
      status: resumeToken ? 'completed' : 'unknown',
      durationMs: timing.resumeReadMs,
      metadata: {}
    },
    {
      id: 'hydration.resume',
      label: 'Hydrate / resume',
      kind: 'hydrate-resume',
      status: hydrateStatus,
      durationMs: timing.hydrateMs,
      metadata: { strategy: source.strategy || 'unknown' }
    },
    {
      id: 'hydration.xscaler-preflight',
      label: 'Lazy surface preflight',
      kind: 'xscaler-preflight',
      status: xscaler.preflightCount > 0 ? 'completed' : 'unknown',
      durationMs: 0,
      metadata: { preflightCount: xscaler.preflightCount, acceptedCount: xscaler.acceptedCount, rejectedCount: xscaler.rejectedCount }
    },
    {
      id: 'hydration.atc-handoff',
      label: 'ATC handoff',
      kind: 'atc-handoff',
      status: xscaler.atcSessionCount > 0 ? 'completed' : 'unknown',
      durationMs: 0,
      metadata: { atcSessionCount: xscaler.atcSessionCount }
    }
  ].map(normalizeHydrationTimelineStep);
}

function normalizeHydrationSnapshot(snapshot = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const timing = normalizeHydrationTiming(source.timing || {});
  const xscaler = normalizeXScalerSnapshot(source.xscaler || {});
  const strategy = normalizeString(source.strategy || source.hydrationStrategy, 'unknown');
  const status = normalizeString(source.status || source.hydrationStatus, Object.keys(source).length > 0 ? 'ready' : 'unknown');
  const resumeToken = normalizeString(source.resumeToken || source.token, null);
  const resumeTokenRedacted = source.resumeTokenRedacted === true || /redacted|\*{3,}|\u2026/iu.test(resumeToken || '');
  const surfaces = toArray(source.surfaces || source.roots).map((surface, index) => normalizeHydrationSurfaceRecord(surface, index, strategy));
  const timeline = createHydrationTimeline({ ...source, status, strategy, resumeToken }, timing, xscaler);
  const diagnostics = toArray(source.diagnostics).map((diagnostic) => (
    diagnostic && diagnostic.schema === XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA
      ? diagnostic
      : createDevSurfaceDiagnostic(diagnostic && diagnostic.code, diagnostic && diagnostic.message, diagnostic && diagnostic.severity, diagnostic && diagnostic.metadata)
  ));
  if (xscaler.networkDuringRender) {
    diagnostics.push(createDevSurfaceDiagnostic(
      'xtend.devsurface.hydration.xscaler_network_during_render',
      'XScaler reported network activity during render.',
      'warning',
      { field: 'xscaler.networkDuringRender' }
    ));
  }

  const supported = normalizeBoolean(source.supported, Object.keys(source).length > 0);
  const summaryStatus = status === 'blocked' || xscaler.networkDuringRender || xscaler.rejectedCount > 0
    ? (status === 'blocked' ? 'blocked' : 'degraded')
    : status;
  return {
    schema: XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA,
    viewSchema: XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
    supported,
    strategy,
    status,
    resumeToken,
    resumeTokenRedacted,
    rootId: normalizeString(source.rootId || source.response && source.response.rootId, null),
    adapterKind: normalizeString(source.adapterKind || source.response && source.response.adapterKind, null),
    responseKind: normalizeString(source.responseKind || source.response && source.response.kind, null),
    hydrationSchema: normalizeString(source.hydrationSchema || source.hydration && source.hydration.schema, null),
    timing,
    surfaces,
    surfaceCount: surfaces.length,
    timeline,
    xscaler,
    diagnostics,
    summary: {
      schema: XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
      strategy,
      status: summaryStatus,
      supported,
      surfaceCount: surfaces.length,
      resumedSurfaceCount: surfaces.filter((surface) => surface.status === 'resumed' || surface.status === 'ready' || surface.status === 'loaded').length,
      pendingSurfaceCount: surfaces.filter((surface) => surface.status === 'pending' || surface.status === 'unknown').length,
      preflightCount: xscaler.preflightCount,
      acceptedCount: xscaler.acceptedCount,
      rejectedCount: xscaler.rejectedCount,
      networkDuringRender: xscaler.networkDuringRender,
      lazyLoadedCount: xscaler.lazyLoadedCount,
      atcSessionCount: xscaler.atcSessionCount,
      needsAttention: summaryStatus === 'blocked' || summaryStatus === 'degraded' || diagnostics.some((diagnostic) => diagnostic.severity === 'error')
    },
    metadata: cloneJson(source.metadata || {}, {})
  };
}

function createDevSurfaceWorkerChartData(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const performance = source.performance || {};
  const hydration = source.hydration || {};
  const fabric = source.fabric || {};
  const kernel = source.kernel || {};
  const measurements = toArray(performance.measurements);
  const phases = Array.isArray(performance.phaseSummary) ? performance.phaseSummary : [];
  const hydrationTimeline = Array.isArray(hydration.timeline) ? hydration.timeline : [];
  const xscaler = hydration.xscaler || {};
  const lanes = toArray(fabric.lanes);

  return {
    schema: XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA,
    generatedBy: 'classic-prewarm-worker',
    normalizationOnly: true,
    performanceBudgetSeries: measurements.map((measurement) => ({
      id: measurement.id,
      label: measurement.name,
      phase: measurement.phase,
      value: measurement.durationMs || 0,
      budget: measurement.budgetMs || 0,
      percent: measurement.budgetUsedPct || 0,
      grade: measurement.grade || 'unknown'
    })),
    performancePhaseSeries: phases.map((phase) => ({
      id: phase.phase,
      label: phase.phase,
      value: phase.totalDurationMs || 0,
      budget: phase.totalBudgetMs || 0,
      percent: phase.budgetUsedPct || 0,
      grade: phase.grade || 'unknown'
    })),
    hydrationTimelineSeries: hydrationTimeline.map((step) => ({
      id: step.id,
      label: step.label,
      kind: step.kind,
      status: step.status,
      value: step.durationMs || 0
    })),
    hydrationSurfaceSeries: toArray(hydration.surfaces).map((surface) => ({
      id: surface.id,
      label: surface.label,
      status: surface.status,
      strategy: surface.strategy,
      lazy: surface.lazy === true,
      xscalerState: surface.xscalerState || 'unknown'
    })),
    xscalerPreflightSeries: [{
      id: 'xscaler.preflight',
      label: 'XScaler Preflight',
      value: xscaler.preflightCount || 0,
      accepted: xscaler.acceptedCount || 0,
      rejected: xscaler.rejectedCount || 0,
      networkDuringRender: xscaler.networkDuringRender === true,
      lazyLoaded: xscaler.lazyLoadedCount || 0
    }],
    fabricLaneSeries: lanes.map((lane) => ({
      id: lane.lane,
      label: lane.lane,
      value: lane.utilizationPct || 0,
      rawValue: lane.utilizationRawPct || lane.utilizationPct || 0,
      fibers: lane.fiberCount || 0,
      failures: lane.failedCount || 0,
      budgetMisses: lane.budgetMissCount || 0,
      health: lane.health || 'unknown',
      backpressureLevel: lane.backpressureLevel || 'unknown'
    })),
    fabricFiberSeries: lanes.flatMap((lane) => toArray(lane.fibers).map((fiber) => ({
      id: fiber.id,
      label: fiber.label,
      lane: lane.lane,
      value: fiber.durationMs || 0,
      budget: fiber.budgetMs || 0,
      percent: fiber.budgetUsedPct || 0,
      status: fiber.status || 'unknown'
    }))),
    kernelHealthSeries: [{
      id: 'kernel.health',
      label: 'Kernel Health',
      state: kernel.state || 'unknown',
      health: kernel.health || 'unknown',
      severity: kernel.severity || 'unknown',
      affectedScopes: kernel.summary && kernel.summary.affectedScopeCount || 0,
      affectedJobs: kernel.summary && kernel.summary.affectedJobCount || 0
    }]
  };
}

function normalizeGateRun(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const gateId = normalizeString(source.gateId || source.id, 'unknown');
  const definition = resolveGateDefinition(gateId, options.allowlist || GATE_ALLOWLIST);
  const allowed = !!definition;
  const status = allowed ? normalizeString(source.status, 'queued') : 'blocked';
  const diagnostics = [];
  const startedAt = normalizeString(source.startedAt, options.startedAt || null);
  const completedAt = normalizeString(source.completedAt, options.completedAt || null);
  const id = normalizeString(
    source.id || source.runId,
    `${XTEND_DEV_SURFACE_GATE_RUN_SCHEMA}:${gateId}:${startedAt || 'pending'}`
  );
  const reportPath = normalizeString(source.reportPath, definition ? definition.reportPath : null);

  if (!allowed) {
    diagnostics.push(createDevSurfaceDiagnostic(
      'xtend.devsurface.gate.not_allowed',
      `Gate "${gateId}" is not allowlisted for XTend Dev Surface.`,
      'error',
      { gateId }
    ));
  }
  toArray(source.diagnostics).forEach((diagnostic) => {
    diagnostics.push(
      diagnostic && diagnostic.schema === XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA
        ? diagnostic
        : createDevSurfaceDiagnostic(
          diagnostic && diagnostic.code,
          diagnostic && diagnostic.message,
          diagnostic && diagnostic.severity,
          diagnostic && diagnostic.metadata
        )
    );
  });

  return {
    schema: XTEND_DEV_SURFACE_GATE_RUN_SCHEMA,
    id,
    runId: id,
    gateId,
    label: normalizeString(source.label, definition ? definition.label : gateId),
    status,
    allowed,
    command: definition ? definition.command.slice() : [],
    reportPath,
    startedAt,
    completedAt,
    exitCode: source.exitCode === null || source.exitCode === undefined ? null : Number(source.exitCode),
    pid: source.pid === null || source.pid === undefined ? null : Number(source.pid),
    progress: normalizeNumber(source.progress, status === 'passed' || status === 'failed' || status === 'blocked' ? 100 : 0, 0),
    artifactUrl: normalizeString(source.artifactUrl, reportPath ? `/artifacts/${encodeURIComponent(reportPath)}` : null),
    artifacts: toArray(source.artifacts).map((artifact) => cloneJson(artifact, {})),
    report: cloneJson(source.report, null),
    stdoutTail: normalizeString(source.stdoutTail, null),
    stderrTail: normalizeString(source.stderrTail, null),
    diagnostics
  };
}

function resolveGateDefinition(gateId, allowlist = GATE_ALLOWLIST) {
  const normalized = normalizeString(gateId, '');
  const definition = allowlist[normalized];
  if (!definition) return null;
  return {
    gateId: definition.gateId,
    label: definition.label,
    command: definition.command.slice(),
    reportPath: definition.reportPath,
    category: definition.category
  };
}

function listGateDefinitions(allowlist = GATE_ALLOWLIST) {
  return Object.keys(allowlist).sort().map((gateId) => resolveGateDefinition(gateId, allowlist));
}

function createDevSurfaceSnapshot(input = {}, options = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const diagnostics = toArray(source.diagnostics).map((diagnostic) => (
    diagnostic && diagnostic.schema === XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA
      ? diagnostic
      : createDevSurfaceDiagnostic(diagnostic && diagnostic.code, diagnostic && diagnostic.message, diagnostic && diagnostic.severity, diagnostic && diagnostic.metadata)
  ));

  if (source.devApiPresent === false) {
    diagnostics.push(createDevSurfaceDiagnostic(
      'xtend.devsurface.dev_api.missing',
      `Inspected page does not expose window.${DEV_API_GLOBAL}.`,
      'warning',
      { globalName: DEV_API_GLOBAL }
    ));
  }

  const performance = normalizePerformanceSnapshot(source.performanceSnapshot || source.performance || {});
  const hydration = normalizeHydrationSnapshot(source.hydrationSnapshot || source.hydration || {});
  const fabric = normalizeFabricTelemetrySnapshot(source.fabricTelemetrySnapshot || source.fabric || {});
  const kernel = normalizeKernelSnapshot(source.kernelSnapshot || source.kernel || {});
  const workerPath = createDevSurfaceWorkerPathRecord(source.workerPath || {});
  const chartData = createDevSurfaceWorkerChartData({ performance, hydration, fabric, kernel });
  const gates = toArray(source.gates).map((gate) => normalizeGateRun(gate, options));
  const snapshotDiagnostics = diagnostics.concat(hydration.diagnostics || []);
  const blockingDiagnostics = diagnostics
    .concat(hydration.diagnostics || [])
    .concat(gates.flatMap((gate) => gate.diagnostics || []))
    .filter((diagnostic) => diagnostic.severity === 'error');
  const devApiPresent = source.devApiPresent === true;

  return {
    schema: XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    runtimeBridgeSchema: normalizeString(source.bridgeSchema || source.runtimeBridgeSchema, XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA),
    runtimeBridge: cloneJson(source.bridge || source.runtimeBridge || null, null),
    generatedAt: timestampFromOptions(options),
    devApiGlobal: DEV_API_GLOBAL,
    devApiPresent,
    devApiVersion: normalizeString(source.devApiVersion || source.version, null),
    companionOrigin: normalizeString(source.companionOrigin, COMPANION_DEFAULT_ORIGIN),
    performance,
    hydration,
    fabric,
    kernel,
    workerPath,
    chartData,
    gates,
    diagnostics: snapshotDiagnostics,
    ok: devApiPresent && blockingDiagnostics.length === 0
  };
}

function assertDevApiShape(api = {}) {
  const record = normalizeDevApiRecord(api);
  return {
    ok: record.ok,
    version: record.version,
    missing: record.missingMethods,
    subscribeSupported: record.subscribeSupported,
    diagnostics: record.diagnostics
  };
}

function evaluateDevSurfaceWorkerPathSource(sourceText = '') {
  const workerSource = normalizeString(sourceText, '');
  const checks = [
    {
      id: 'worker.normalization_message',
      ok: workerSource.includes('xds:normalize-snapshot'),
      message: 'Prewarm Worker must expose the xds:normalize-snapshot message path.'
    },
    {
      id: 'worker.no_dom_access',
      ok: !/\b(document|HTMLElement|customElements|querySelector)\b/u.test(workerSource),
      message: 'Prewarm Worker must not access DOM APIs.'
    },
    {
      id: 'worker.no_page_global',
      ok: !/\bwindow\b/u.test(workerSource),
      message: 'Prewarm Worker must not read inspected page globals.'
    },
    {
      id: 'worker.no_host_services',
      ok: !/(chrome\.devtools|chrome\.runtime|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)/u.test(workerSource),
      message: 'Prewarm Worker must not own host services or companion IO.'
    },
    {
      id: 'worker.no_persistent_state',
      ok: !/\b(localStorage|sessionStorage|indexedDB|caches)\b/u.test(workerSource),
      message: 'Prewarm Worker must not own persistent canonical state.'
    },
    {
      id: 'worker.no_worker_fanout',
      ok: !/\b(new\s+Worker|SharedWorker|ServiceWorker|navigator\.serviceWorker)\b/u.test(workerSource),
      message: 'Prewarm Worker must not spawn additional worker ownership paths.'
    },
    {
      id: 'worker.chart_data',
      ok: workerSource.includes('createWorkerChartData') && workerSource.includes('chartData'),
      message: 'Prewarm Worker must prepare UI-near chart data.'
    }
  ];
  const diagnostics = checks
    .filter((check) => !check.ok)
    .map((check) => createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.workerOwnershipBlocked.code,
      check.message,
      DIAGNOSTIC_CATALOG.workerOwnershipBlocked.severity,
      { checkId: check.id }
    ));

  return {
    schema: XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    workpackage: 'XDS-WP-08',
    source: `${XTEND_DEV_SURFACE_ROOT}/src/prewarm-worker.js`,
    checks,
    diagnostics,
    normalizationOnly: true,
    ownsDom: false,
    ownsHostServices: false,
    ownsCanonicalState: false,
    ok: diagnostics.length === 0
  };
}

function evaluateDevSurfaceSecurityBoundary(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const sourceText = normalizeString(source.sourceText, [
    source.panelSource,
    source.devtoolsSource,
    source.contentBridgeSource,
    source.serviceWorkerSource
  ].filter(Boolean).join('\n'));
  const workerSource = normalizeString(source.workerSource, '');
  const manifest = source.manifest && typeof source.manifest === 'object' ? source.manifest : {};
  const csp = normalizeString(
    manifest.content_security_policy && manifest.content_security_policy.extension_pages,
    ''
  );
  const diagnostics = [];

  if (REMOTE_CODE_PATTERN.test(sourceText) || REMOTE_CODE_PATTERN.test(workerSource)) {
    diagnostics.push(createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.remoteCodeBlocked.code,
      'XTend Dev Surface extension code must not load or evaluate remote code.',
      DIAGNOSTIC_CATALOG.remoteCodeBlocked.severity
    ));
  }

  if (MONKEYPATCH_PATTERN.test(sourceText) || MONKEYPATCH_PATTERN.test(workerSource)) {
    diagnostics.push(createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.monkeypatchBlocked.code,
      'XTend Dev Surface may not monkeypatch browser or inspected-app runtime APIs.',
      DIAGNOSTIC_CATALOG.monkeypatchBlocked.severity
    ));
  }

  if (FRAMEWORK_DEPENDENCY_PATTERN.test(sourceText) || FRAMEWORK_DEPENDENCY_PATTERN.test(workerSource)) {
    diagnostics.push(createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.frameworkDependencyBlocked.code,
      'XTend Dev Surface v1 may not introduce framework runtime dependencies.',
      DIAGNOSTIC_CATALOG.frameworkDependencyBlocked.severity
    ));
  }

  if (workerSource && WORKER_OWNERSHIP_PATTERN.test(workerSource)) {
    diagnostics.push(createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.workerOwnershipBlocked.code,
      'XTend Dev Surface worker code must stay normalization-only and must not own DOM or host services.',
      DIAGNOSTIC_CATALOG.workerOwnershipBlocked.severity
    ));
  }

  if (source.freeCommandAllowed === true) {
    diagnostics.push(createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.companionFreeCommandBlocked.code,
      'XTend Dev Surface companion must not allow arbitrary commands.',
      DIAGNOSTIC_CATALOG.companionFreeCommandBlocked.severity
    ));
  }

  if (csp && (!csp.includes("script-src 'self'") || csp.includes('unsafe-eval') || csp.includes('unsafe-inline') || /script-src[^;]*https?:/u.test(csp))) {
    diagnostics.push(createDevSurfaceDiagnostic(
      DIAGNOSTIC_CATALOG.cspUnsafe.code,
      'XTend Dev Surface extension CSP must keep scripts local and block unsafe script execution.',
      DIAGNOSTIC_CATALOG.cspUnsafe.severity,
      { csp }
    ));
  }

  return {
    schema: XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    rules: SECURITY_BOUNDARY_RULES.slice(),
    csp: csp || null,
    diagnostics,
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  };
}

function serializeDevSurfaceSnapshot(snapshot = {}) {
  return `${JSON.stringify(stableSort(snapshot), null, 2)}\n`;
}

module.exports = {
  COMPANION_DEFAULT_ORIGIN,
  DEV_API_GLOBAL,
  DEV_API_OPTIONAL_METHODS,
  DEV_API_REQUIRED_METHODS,
  DEV_SURFACE_VIEWS,
  DIAGNOSTIC_CATALOG,
  GATE_ALLOWLIST,
  KERNEL_STATE_TO_HEALTH,
  PERFORMANCE_STATUS_TO_GRADE,
  SECURITY_BOUNDARY_RULES,
  XTEND_DEV_SURFACE_COMPANION_SCHEMA,
  XTEND_DEV_SURFACE_CONTRACT_PATH,
  XTEND_DEV_SURFACE_CONTRACT_SCHEMA,
  XTEND_DEV_SURFACE_DEV_API_SCHEMA,
  XTEND_DEV_SURFACE_DIAGNOSTIC_SCHEMA,
  XTEND_DEV_SURFACE_DIST_PATH,
  XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
  XTEND_DEV_SURFACE_FABRIC_SNAPSHOT_SCHEMA,
  XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
  XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA,
  XTEND_DEV_SURFACE_GATE_RUN_SCHEMA,
  XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
  XTEND_DEV_SURFACE_HANDOFF_SCHEMA,
  XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA,
  XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
  XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
  XTEND_DEV_SURFACE_KERNEL_SNAPSHOT_SCHEMA,
  XTEND_DEV_SURFACE_PACKAGE_SCRIPT,
  XTEND_DEV_SURFACE_PERFORMANCE_SNAPSHOT_SCHEMA,
  XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA,
  XTEND_DEV_SURFACE_ROOT,
  XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA,
  XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
  XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA,
  XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA,
  XTEND_DEV_SURFACE_SUITE_PATH,
  XTEND_DEV_SURFACE_TYPES_PATH,
  XTEND_DEV_SURFACE_WORKPACKAGE,
  XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA,
  assertDevApiShape,
  createDevSurfaceContract,
  createDevSurfaceDiagnostic,
  createDevSurfaceHandoffRecord,
  createDevSurfaceSnapshot,
  createDevSurfaceWorkerChartData,
  createDevSurfaceWorkerPathRecord,
  evaluateDevSurfaceSecurityBoundary,
  evaluateDevSurfaceWorkerPathSource,
  listGateDefinitions,
  normalizeDevApiRecord,
  normalizeFabricTelemetrySnapshot,
  normalizeGateRun,
  normalizeHydrationSnapshot,
  normalizeKernelSnapshot,
  normalizePerformanceMeasurement,
  normalizePerformanceSnapshot,
  resolveGateDefinition,
  serializeDevSurfaceSnapshot
};

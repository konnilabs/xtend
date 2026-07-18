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
  DEV_API_OPTIONAL_METHODS,
  DEV_API_REQUIRED_METHODS,
  DEV_API_GLOBAL,
  DIAGNOSTIC_CATALOG,
  SECURITY_BOUNDARY_RULES,
  XTEND_DEV_SURFACE_COMPANION_SCHEMA,
  XTEND_DEV_SURFACE_CONTRACT_PATH,
  XTEND_DEV_SURFACE_CONTRACT_SCHEMA,
  XTEND_DEV_SURFACE_DEV_API_SCHEMA,
  XTEND_DEV_SURFACE_DIST_PATH,
  XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
  XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA,
  XTEND_DEV_SURFACE_GATE_RUN_SCHEMA,
  XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA,
  XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA,
  XTEND_DEV_SURFACE_HANDOFF_SCHEMA,
  XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA,
  XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA,
  XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA,
  XTEND_DEV_SURFACE_PACKAGE_SCRIPT,
  XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA,
  XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA,
  XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA,
  XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA,
  XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA,
  XTEND_DEV_SURFACE_SUITE_PATH,
  XTEND_DEV_SURFACE_TYPES_PATH,
  XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA,
  assertDevApiShape,
  createDevSurfaceContract,
  createDevSurfaceHandoffRecord,
  createDevSurfaceSnapshot,
  createDevSurfaceWorkerPathRecord,
  evaluateDevSurfaceSecurityBoundary,
  evaluateDevSurfaceWorkerPathSource,
  listGateDefinitions,
  normalizeDevApiRecord,
  normalizeGateRun,
  normalizeHydrationSnapshot,
  resolveGateDefinition,
  serializeDevSurfaceSnapshot
} = require('../../tools/xtend-dev-surface/contracts');
const {
  COMPANION_SCHEMA,
  HANDSHAKE_SCHEMA,
  TOKEN_HEADER,
  authorizeCompanionRequest,
  createCompanionArtifactRecord,
  createCompanionGatePlan,
  createCompanionHandshake,
  createGateStreamEvent,
  createRunStore,
  isAllowlistedArtifactPath,
  parseGateReport,
  runAllowedGate
} = require('../../tools/xtend-dev-surface/companion');
const {
  XTEND_DEV_SURFACE_BUILD_REPORT_SCHEMA,
  XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA,
  XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE,
  createExtensionSkeletonReport
} = require('../../tools/xtend-dev-surface/extension-skeleton');
const {
  DEV_API_ACCESS,
  DEVTOOLS_EVAL_ACCESS,
  XTEND_DEV_SURFACE_WORKPACKAGE: XTEND_DEV_SURFACE_RUNTIME_BRIDGE_WORKPACKAGE,
  createFallbackSnapshot: createRuntimeBridgeFallbackSnapshot,
  createInspectedWindowReadExpression,
  createRuntimeBridgeRecord,
  evaluateRuntimeBridgeSource,
  normalizeBridgeReadResult
} = require('../../tools/xtend-dev-surface/src/runtime-bridge');

const TOOL_FILES = [
  'tools/xtend-dev-surface/contracts.js',
  'tools/xtend-dev-surface/companion.js',
  'tools/xtend-dev-surface/extension-skeleton.js',
  'tools/xtend-dev-surface/build.js',
  'tools/xtend-dev-surface/src/devtools.js',
  'tools/xtend-dev-surface/src/runtime-bridge.js',
  'tools/xtend-dev-surface/src/panel.js',
  'tools/xtend-dev-surface/src/service-worker.js',
  'tools/xtend-dev-surface/src/content-bridge.js',
  'tools/xtend-dev-surface/src/prewarm-worker.js',
  'tools/xtend-dev-surface/dist/devtools.js',
  'tools/xtend-dev-surface/dist/runtime-bridge.js',
  'tools/xtend-dev-surface/dist/panel.js',
  'tools/xtend-dev-surface/dist/service-worker.js',
  'tools/xtend-dev-surface/dist/content-bridge.js',
  'tools/xtend-dev-surface/dist/prewarm-worker.js',
  XTEND_DEV_SURFACE_SUITE_PATH
];

const DIST_FILES = [
  'manifest.json',
  'devtools.html',
  'devtools.js',
  'runtime-bridge.js',
  'panel.html',
  'panel.js',
  'panel.css',
  'service-worker.js',
  'content-bridge.js',
  'prewarm-worker.js',
  'assets/icon.svg',
  'build-report.json',
  'handoff.json'
];

function extractFencedCodeBlocks(markdown) {
  return Array.from(String(markdown || '').matchAll(/```(?:js|json)\s*([\s\S]*?)```/gu))
    .map((match) => match[1].trim());
}

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createMockSnapshot() {
  return {
    devApiPresent: true,
    devApiVersion: '1.0.0',
    performanceSnapshot: {
      measurements: [
        { name: 'xtend.component.hydrate', phase: 'hydrate', durationMs: 22, budgetMs: 32, status: 'pass' },
        { name: 'xtend.route.render', phase: 'route', durationMs: 60, budgetMs: 48, status: 'warn' },
        { name: 'xtend.event.handler', phase: 'event', durationMs: 30, budgetMs: 16, status: 'fail' }
      ],
      phaseSummary: {
        hydrate: { measurementCount: 1 }
      },
      history: [
        { timestamp: '2026-07-09T09:55:00.000Z', totalDurationMs: 88, totalBudgetMs: 96, budgetUsedPct: 92, budgetMissCount: 1, grade: 'needs-improvement' },
        { timestamp: '2026-07-09T10:00:00.000Z', totalDurationMs: 112, totalBudgetMs: 96, budgetUsedPct: 117, budgetMissCount: 2, grade: 'flawed' }
      ]
    },
    hydrationSnapshot: {
      schema: XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA,
      strategy: 'server_prerender_resume',
      status: 'resumed',
      resumeToken: 'tb-test-token',
      rootId: 'xtend-maraca-root',
      adapterKind: 'node-ssr',
      responseKind: 'html',
      hydrationSchema: 'xtend.rmt.node-ssr-hydration.v1',
      timing: {
        ssrRenderMs: 18,
        resumeReadMs: 4,
        hydrateMs: 22,
        firstInteractiveMs: 64,
        clsValue: 0.004
      },
      surfaces: [
        { id: 'dashboard', label: 'Dashboard', status: 'resumed', strategy: 'server_prerender_resume', resumeTokenPresent: true, lazy: false, xscalerState: 'not-required' },
        { id: 'settings', label: 'Settings', status: 'pending', strategy: 'server_prerender_resume', resumeTokenPresent: true, lazy: true, xscalerState: 'pending' }
      ],
      xscaler: {
        mode: 'protocol-lazy',
        preflightEndpoint: '/api/xscaler/preflight',
        lazyEndpoint: '/api/lazy-surface/:id',
        preflightCount: 2,
        acceptedCount: 1,
        rejectedCount: 1,
        networkDuringRender: false,
        lazyLoadedCount: 1,
        atcSessions: [
          {
            sessionId: 'xscaler:testbench:settings',
            protocol: 'xscaler-atc-compatible',
            route: '/api/lazy-surface/settings',
            mode: 'protocol-lazy',
            lifecycleState: 'client-hydrated-navigation',
            activation: 'client-hydrated-navigation',
            schedulerLane: 'transition',
            componentMix: ['x-input', 'x-select']
          }
        ],
        preflights: [
          { surface: 'settings', accepted: true, ok: true, networkDuringRender: false, atc: { sessionId: 'xscaler:testbench:settings', route: '/api/lazy-surface/settings', schedulerLane: 'transition' } },
          { surface: 'grid', accepted: false, ok: false, networkDuringRender: false, rejection: { code: 'not-ready' } }
        ]
      }
    },
    fabricTelemetrySnapshot: {
      schema: 'xtend.fabric.telemetry-snapshot.v1',
      id: 'fabric.snapshot.test',
      fiberCount: 3,
      totals: { fiberCount: 3, completedCount: 2, failedCount: 1, budgetMissCount: 1, activeFiberCount: 1, pendingFiberCount: 1 },
      backpressure: { level: 'high', action: 'defer-background-work', laneIds: ['diagnostics'], reason: 'budget-pressure' },
      lanes: {
        visible: {
          lane: 'visible',
          priority: 'user-visible',
          deadlineMs: 24,
          fiberCount: 2,
          activeFiberCount: 1,
          pendingFiberCount: 1,
          completedCount: 2,
          failedCount: 0,
          budgetMissCount: 0,
          averageDurationMs: 12,
          maxDurationMs: 18,
          fibers: [
            { id: 'fiber.visible.1', status: 'completed', durationMs: 12, budgetMs: 24 },
            { id: 'fiber.visible.2', status: 'completed', durationMs: 18, budgetMs: 24 }
          ]
        },
        diagnostics: {
          lane: 'diagnostics',
          priority: 'background',
          deadlineMs: 80,
          fiberCount: 1,
          failedCount: 1,
          budgetMissCount: 1,
          averageDurationMs: 90,
          maxDurationMs: 90,
          fibers: [
            { id: 'fiber.diagnostics.1', status: 'failed', durationMs: 90, budgetMs: 80, failed: true }
          ]
        }
      }
    },
    kernelSnapshot: {
      schema: 'xtend.rmt.kernel-panic-state.v1',
      state: 'active',
      severity: 'critical',
      trigger: 'trust-verdict-panic',
      panicId: 'panic:test',
      correlationId: 'corr:test',
      detectedAt: '2026-07-09T09:59:00.000Z',
      lastSeenAt: '2026-07-09T10:00:00.000Z',
      recoveryAction: 'quarantine-scope',
      mitigationStrategy: 'quarantine-and-rollback',
      blockedCommitCount: 2,
      criticalViolationCount: 1,
      recoveryAttemptCount: 1,
      recoveryFailureCount: 0,
      affectedScopes: [
        { id: 'surface', label: 'Surface Runtime', severity: 'critical', status: 'quarantined', mitigationStrategy: 'quarantine-and-rollback', criticalViolationCount: 1 }
      ],
      affectedJobs: [
        { id: 'job.render.1', label: 'Render Commit', status: 'blocked', severity: 'critical', lane: 'visible' }
      ],
      mitigationStrategies: [
        { id: 'mitigate.quarantine', strategy: 'quarantine-and-rollback', action: 'quarantine-scope', status: 'pending', scope: 'surface' },
        { id: 'mitigate.defer', strategy: 'defer-dependent-lanes', action: 'defer-background-work', status: 'pending', scope: 'visible' }
      ]
    }
  };
}

function assertCommonFiles(context, rootDir) {
  [
    XTEND_DEV_SURFACE_CONTRACT_PATH,
    'development/XTend-Docs-Quality-Implementierungsplan.md',
    'docs/de/xtend-dev-surface.md',
    'docs/en/xtend-dev-surface.md',
    'tools/xtend-dev-surface/README.md',
    XTEND_DEV_SURFACE_TYPES_PATH,
    'tools/xtend-dev-surface/runtime-bridge.d.ts',
    'tools/xtend-dev-surface/src/manifest.json',
    'tools/xtend-dev-surface/dist/manifest.json'
  ].forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
  });

  TOOL_FILES.forEach((relativePath) => {
    assertFileExists(context, relativePath, rootDir, `${relativePath} exists`);
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });

  DIST_FILES.forEach((relativePath) => {
    assertFileExists(context, path.join(XTEND_DEV_SURFACE_DIST_PATH, relativePath), rootDir, `dist artifact ${relativePath} exists`);
  });
}

function assertManifest(context, rootDir) {
  const manifest = readJson('tools/xtend-dev-surface/dist/manifest.json', rootDir);
  const sourceManifest = readJson('tools/xtend-dev-surface/src/manifest.json', rootDir);
  context.assert(manifest.manifest_version === 3, 'dist manifest uses Manifest V3');
  context.assert(manifest.devtools_page === 'devtools.html', 'dist manifest declares devtools_page');
  context.assert(manifest.background && manifest.background.service_worker === 'service-worker.js', 'dist manifest declares extension service worker');
  context.assert(manifest.content_security_policy.extension_pages.includes("script-src 'self'"), 'dist manifest keeps extension scripts local');
  context.assert(!manifest.content_security_policy.extension_pages.includes('https:'), 'dist manifest does not allow remote script/connect origins');
  context.assert(Array.isArray(manifest.host_permissions) && manifest.host_permissions.every((entry) => entry === 'http://127.0.0.1/*' || entry === 'http://localhost/*'), 'dist manifest host permissions stay local-only');
  context.assert(JSON.stringify(manifest) === JSON.stringify(sourceManifest), 'dist manifest is reproducible from source manifest');
}

function assertExtensionSkeleton(context, rootDir) {
  const skeleton = createExtensionSkeletonReport({ rootDir });
  const buildReport = readJson('tools/xtend-dev-surface/dist/build-report.json', rootDir);
  const handoff = readJson('tools/xtend-dev-surface/dist/handoff.json', rootDir);
  context.assert(skeleton.schema === XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA, 'extension skeleton emits schema');
  context.assert(skeleton.workpackage === XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE, 'extension skeleton points to XDS-WP-02');
  context.assert(skeleton.ok === true, 'extension skeleton passes all checks');
  context.assert(skeleton.checks.some((check) => check.id === 'manifest.v3' && check.ok), 'extension skeleton validates Manifest V3');
  context.assert(skeleton.checks.some((check) => check.id === 'manifest.csp.local_scripts' && check.ok), 'extension skeleton validates local-only CSP');
  context.assert(skeleton.parity.length > 0 && skeleton.parity.every((entry) => entry.ok), 'extension skeleton source and dist artifacts match');
  context.assert(buildReport.schema === XTEND_DEV_SURFACE_BUILD_REPORT_SCHEMA, 'dist build report emits schema');
  context.assert(buildReport.skeletonSchema === XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA, 'dist build report links skeleton schema');
  context.assert(buildReport.workpackage === XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE, 'dist build report points to XDS-WP-02');
  context.assert(buildReport.ok === true, 'dist build report is green');
  context.assert(buildReport.copiedFiles.some((relativePath) => relativePath.endsWith('manifest.json')), 'dist build report records copied artifacts');
  context.assert(buildReport.handoffSchema === XTEND_DEV_SURFACE_HANDOFF_SCHEMA, 'dist build report links handoff schema');
  context.assert(buildReport.generatedFiles.some((relativePath) => relativePath.endsWith('handoff.json')), 'dist build report records generated handoff');
  context.assert(handoff.schema === XTEND_DEV_SURFACE_HANDOFF_SCHEMA && handoff.workpackage === 'XDS-WP-09', 'dist handoff emits XDS-WP-09 schema');
  context.assert(handoff.loadPath === XTEND_DEV_SURFACE_DIST_PATH && handoff.loadInstructions.some((step) => step.includes('unpacked extension')), 'dist handoff documents unpacked extension loading');
  context.assert(handoff.testCommands.includes(XTEND_DEV_SURFACE_PACKAGE_SCRIPT), 'dist handoff documents package test command');
}

function assertNoMonkeypatching(context, rootDir) {
  const browserSource = [
    'tools/xtend-dev-surface/src/runtime-bridge.js',
    'tools/xtend-dev-surface/src/panel.js',
    'tools/xtend-dev-surface/src/content-bridge.js',
    'tools/xtend-dev-surface/src/service-worker.js',
    'tools/xtend-dev-surface/src/prewarm-worker.js'
  ].map((relativePath) => readText(relativePath, rootDir)).join('\n');

  [
    'window.fetch =',
    'globalThis.fetch =',
    'history.pushState =',
    'history.replaceState =',
    'performance.mark =',
    'performance.measure =',
    'customElements.define =',
    'React.',
    'Vue.'
  ].forEach((forbidden) => {
    context.assert(!browserSource.includes(forbidden), `browser source does not monkeypatch ${forbidden}`);
  });

  context.assert(browserSource.includes(`window.${DEV_API_GLOBAL}`), 'panel reads explicit XTend DEV API');
  context.assert(browserSource.includes('chrome.devtools.inspectedWindow.eval'), 'panel uses DevTools inspectedWindow eval only for DEV API read');
}

function assertRuntimeBridge(context, rootDir) {
  const runtimeBridgeSource = readText('tools/xtend-dev-surface/src/runtime-bridge.js', rootDir);
  const runtimeBridgeTypes = readText('tools/xtend-dev-surface/runtime-bridge.d.ts', rootDir);
  const bridge = createRuntimeBridgeRecord();
  context.assert(bridge.schema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA, 'runtime bridge emits schema');
  context.assert(bridge.workpackage === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_WORKPACKAGE, 'runtime bridge points to XDS-WP-03');
  context.assert(bridge.devApiAccess === DEV_API_ACCESS && bridge.devtoolsEvalAccess === DEVTOOLS_EVAL_ACCESS, 'runtime bridge declares explicit read boundary');
  context.assert(bridge.monkeypatchingAllowed === false && bridge.remoteRuntimeAllowed === false, 'runtime bridge blocks monkeypatching and remote runtime');
  context.assert(bridge.allowedReads.includes('getPerformanceSnapshot') && bridge.allowedReads.includes('getKernelSnapshot'), 'runtime bridge allowlists DEV API snapshot reads');
  context.assert(bridge.allowedReads.includes('getHydrationSnapshot') && bridge.optionalMethods.includes('getHydrationSnapshot'), 'runtime bridge treats hydration as optional DEV API read');
  context.assert(runtimeBridgeTypes.includes(XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA), 'runtime bridge local types declare schema');

  const sourceAudit = evaluateRuntimeBridgeSource(runtimeBridgeSource);
  context.assert(sourceAudit.ok === true, 'runtime bridge source audit passes');

  const expression = createInspectedWindowReadExpression();
  context.assert(expression.includes('window[DEV_API_GLOBAL]'), 'runtime bridge expression reads explicit DEV API global');
  context.assert(expression.includes('getHydrationSnapshot') && expression.includes('getFabricTelemetrySnapshot') && expression.includes('getKernelSnapshot'), 'runtime bridge expression reads optional Hydration, Fabric and Kernel snapshots');
  [
    'window.fetch =',
    'history.pushState =',
    'history.replaceState =',
    'performance.mark =',
    'performance.measure =',
    'customElements.define ='
  ].forEach((forbidden) => {
    context.assert(!expression.includes(forbidden), `runtime bridge expression does not monkeypatch ${forbidden}`);
  });

  const readResult = vm.runInNewContext(expression, {
    window: {
      [DEV_API_GLOBAL]: {
        version: '1.0.0',
        getPerformanceSnapshot() {
          return {
            measurements: [
              { name: 'x-route', phase: 'route', durationMs: 12, budgetMs: 20, status: 'pass' }
            ]
          };
        },
        getHydrationSnapshot() {
          return {
            strategy: 'server_prerender_resume',
            status: 'resumed',
            resumeToken: 'tb-test-token',
            xscaler: { mode: 'protocol-lazy', preflightCount: 1, acceptedCount: 1 }
          };
        },
        getFabricTelemetrySnapshot() {
          return {
            schema: 'xtend.fabric.telemetry-snapshot.v1',
            lanes: {
              visible: { fiberCount: 1, deadlineMs: 24, maxDurationMs: 12 }
            },
            totals: { fiberCount: 1 }
          };
        },
        getKernelSnapshot() {
          return {
            schema: 'xtend.rmt.kernel-panic-state.v1',
            state: 'recovering',
            recoveryAction: 'rollback-scope',
            affectedScopes: ['surface']
          };
        },
        subscribe() {}
      }
    }
  });
  const normalized = normalizeBridgeReadResult(readResult);
  context.assert(normalized.schema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA, 'runtime bridge read result emits schema');
  context.assert(normalized.devApiPresent === true && normalized.devApiVersion === '1.0.0', 'runtime bridge reads DEV API version');
  context.assert(normalized.performanceSnapshot.measurements.length === 1, 'runtime bridge reads performance measurements');
  context.assert(normalized.hydrationSnapshot.strategy === 'server_prerender_resume', 'runtime bridge reads optional hydration snapshot');
  context.assert(normalized.fabricTelemetrySnapshot.lanes.visible.fiberCount === 1, 'runtime bridge reads Fabric lane snapshot');
  context.assert(normalized.kernelSnapshot.state === 'recovering', 'runtime bridge reads Kernel recovery snapshot');
  context.assert(normalized.subscribeSupported === true && normalized.ok === true, 'runtime bridge records subscribe support');
  const normalizedSnapshot = createDevSurfaceSnapshot(normalized, {
    timestamp: '2026-07-09T10:05:00.000Z'
  });
  context.assert(normalizedSnapshot.runtimeBridgeSchema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA, 'snapshot keeps runtime bridge schema');
  context.assert(normalizedSnapshot.runtimeBridge && normalizedSnapshot.runtimeBridge.schema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA, 'snapshot keeps runtime bridge record');

  const optionalHydrationMissing = vm.runInNewContext(expression, {
    window: {
      [DEV_API_GLOBAL]: {
        version: '1.0.0',
        getPerformanceSnapshot() {
          return { measurements: [] };
        },
        getFabricTelemetrySnapshot() {
          return { lanes: {} };
        },
        getKernelSnapshot() {
          return { state: 'none' };
        }
      }
    }
  });
  context.assert(optionalHydrationMissing.ok === true && optionalHydrationMissing.hydrationSnapshot === null, 'runtime bridge keeps missing optional hydration method non-blocking');

  const missingResult = vm.runInNewContext(expression, { window: {} });
  context.assert(missingResult.devApiPresent === false && missingResult.ok === false, 'runtime bridge degrades when DEV API is missing');
  context.assert(missingResult.diagnostics.some((diagnostic) => diagnostic.code === DIAGNOSTIC_CATALOG.devApiMissing.code), 'runtime bridge emits missing DEV API diagnostic');

  const failingResult = vm.runInNewContext(expression, {
    window: {
      [DEV_API_GLOBAL]: {
        version: '1.0.0',
        getPerformanceSnapshot() {
          throw new Error('boom');
        },
        getFabricTelemetrySnapshot() {
          return { lanes: {} };
        },
        getKernelSnapshot() {
          return { state: 'none' };
        }
      }
    }
  });
  context.assert(failingResult.ok === false, 'runtime bridge marks failed DEV API read as blocked');
  context.assert(failingResult.diagnostics.some((diagnostic) => diagnostic.code === DIAGNOSTIC_CATALOG.runtimeBridgeReadFailed.code), 'runtime bridge emits read failed diagnostic');

  const asyncResult = vm.runInNewContext(expression, {
    window: {
      [DEV_API_GLOBAL]: {
        version: '1.0.0',
        getPerformanceSnapshot() {
          return Promise.resolve({ measurements: [] });
        },
        getFabricTelemetrySnapshot() {
          return { lanes: {} };
        },
        getKernelSnapshot() {
          return { state: 'none' };
        }
      }
    },
    Promise
  });
  context.assert(asyncResult.ok === false, 'runtime bridge blocks async DEV API snapshot methods');
  context.assert(asyncResult.diagnostics.some((diagnostic) => diagnostic.code === DIAGNOSTIC_CATALOG.runtimeBridgeAsyncSnapshotUnsupported.code), 'runtime bridge emits async snapshot diagnostic');

  const fallback = createRuntimeBridgeFallbackSnapshot('No inspected page.');
  context.assert(fallback.devApiPresent === false && fallback.bridge.readMode === 'fallback', 'runtime bridge fallback snapshot is degraded');
}

function assertWorkerPath(context, rootDir) {
  const workerSource = readText('tools/xtend-dev-surface/src/prewarm-worker.js', rootDir);
  const workerRecord = createDevSurfaceWorkerPathRecord();
  const audit = evaluateDevSurfaceWorkerPathSource(workerSource);
  context.assert(workerRecord.schema === XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA && workerRecord.workpackage === 'XDS-WP-08', 'worker path record emits XDS-WP-08 schema');
  context.assert(workerRecord.normalizationOnly === true && workerRecord.ownsDom === false, 'worker path record stays normalization-only');
  context.assert(audit.schema === XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA && audit.ok === true, 'worker path source audit passes');
  context.assert(audit.checks.some((check) => check.id === 'worker.no_host_services' && check.ok), 'worker path audit blocks host service ownership');
  context.assert(audit.checks.some((check) => check.id === 'worker.chart_data' && check.ok), 'worker path audit requires chart data preparation');

  let messageHandler = null;
  const postedMessages = [];
  vm.runInNewContext(workerSource, {
    self: {
      addEventListener(type, handler) {
        if (type === 'message') messageHandler = handler;
      },
      postMessage(message) {
        postedMessages.push(message);
      }
    }
  });
  context.assert(typeof messageHandler === 'function', 'prewarm worker registers message handler');
  messageHandler({
    data: {
      type: 'xds:normalize-snapshot',
      requestId: 'worker-path-test',
      snapshot: createMockSnapshot()
    }
  });
  const response = postedMessages[0] || {};
  context.assert(response.type === 'xds:normalized-snapshot' && response.requestId === 'worker-path-test', 'prewarm worker posts normalized snapshot response');
  context.assert(response.snapshot && response.snapshot.workerPath.schema === XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA, 'prewarm worker emits worker path metadata');
  context.assert(response.snapshot && response.snapshot.chartData.performanceBudgetSeries.length === 3, 'prewarm worker emits performance chart data');
  context.assert(response.snapshot && response.snapshot.hydration.strategy === 'server_prerender_resume', 'prewarm worker normalizes hydration strategy');
  context.assert(response.snapshot && response.snapshot.hydration.resumeToken === 'tb-test-token', 'prewarm worker preserves app-provided resume token');
  context.assert(response.snapshot && response.snapshot.hydration.timing.firstInteractiveMs === 64, 'prewarm worker normalizes hydration timing');
  context.assert(response.snapshot && response.snapshot.hydration.surfaces.length === 2, 'prewarm worker normalizes hydration surface rows');
  context.assert(response.snapshot && response.snapshot.hydration.xscaler.rejectedCount === 1, 'prewarm worker normalizes XScaler rejected preflights');
  context.assert(response.snapshot && response.snapshot.chartData.hydrationTimelineSeries.length >= 6, 'prewarm worker emits hydration timeline chart data');
  context.assert(response.snapshot && response.snapshot.chartData.xscalerPreflightSeries[0].accepted === 1, 'prewarm worker emits XScaler preflight chart data');
  context.assert(response.snapshot && response.snapshot.chartData.fabricLaneSeries.length === 2, 'prewarm worker emits fabric chart data');
  context.assert(response.snapshot && response.snapshot.chartData.kernelHealthSeries[0].health === 'blocked', 'prewarm worker emits kernel chart data');
  context.assert(response.snapshot && response.snapshot.workerPath.ownsCanonicalState === false, 'prewarm worker does not own canonical state');

  postedMessages.length = 0;
  messageHandler({
    data: {
      type: 'xds:normalize-snapshot',
      requestId: 'worker-path-missing-api',
      snapshot: { devApiPresent: false }
    }
  });
  const degradedResponse = postedMessages[0] || {};
  context.assert(degradedResponse.snapshot && degradedResponse.snapshot.devApiPresent === false, 'prewarm worker preserves missing DEV API flag');
  context.assert(degradedResponse.snapshot && degradedResponse.snapshot.ok === false, 'prewarm worker keeps missing DEV API degraded');
  context.assert(degradedResponse.snapshot.diagnostics.some((diagnostic) => diagnostic.code === DIAGNOSTIC_CATALOG.devApiMissing.code), 'prewarm worker emits missing DEV API diagnostic');
}

function assertContracts(context) {
  const contract = createDevSurfaceContract();
  context.assert(contract.schema === XTEND_DEV_SURFACE_CONTRACT_SCHEMA, 'contract factory emits Dev Surface contract schema');
  context.assert(contract.devApi.schema === XTEND_DEV_SURFACE_DEV_API_SCHEMA && contract.devApi.ok === true, 'contract factory declares accepted DEV API');
  context.assert(contract.security.schema === XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA, 'contract factory declares security boundary schema');
  context.assert(contract.runtimeBridge && contract.runtimeBridge.schema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA, 'contract factory declares runtime bridge schema');
  context.assert(contract.runtimeBridge.allowedReads.includes('subscribe'), 'contract factory declares runtime bridge subscribe capability');
  context.assert(contract.runtimeBridge.allowedReads.includes('getHydrationSnapshot'), 'contract factory declares optional hydration runtime read');
  context.assert(contract.companion && contract.companion.schema === XTEND_DEV_SURFACE_COMPANION_SCHEMA, 'contract factory declares companion schema');
  context.assert(contract.companion.streamingStatus === true && contract.companion.artifactLinks === true, 'contract factory declares companion streaming and artifact links');
  context.assert(contract.performanceView && contract.performanceView.schema === XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA, 'contract factory declares performance view schema');
  context.assert(contract.performanceView.sections.includes('phase-summary') && contract.performanceView.sections.includes('trend'), 'contract factory declares performance phase and trend sections');
  context.assert(contract.hydrationSnapshotSchema === XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA, 'contract factory declares hydration snapshot schema');
  context.assert(contract.hydrationView && contract.hydrationView.schema === XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA, 'contract factory declares hydration view schema');
  context.assert(contract.hydrationView.sections.includes('timeline') && contract.hydrationView.sections.includes('xscaler'), 'contract factory declares hydration timeline and XScaler sections');
  context.assert(contract.fabricView && contract.fabricView.schema === XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA, 'contract factory declares fabric view schema');
  context.assert(contract.fabricView.sections.includes('critical-lanes') && contract.fabricView.sections.includes('fiber-summary'), 'contract factory declares fabric critical lanes and fiber summary sections');
  context.assert(contract.kernelMonitor && contract.kernelMonitor.schema === XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA, 'contract factory declares kernel monitor schema');
  context.assert(contract.kernelMonitor.sections.includes('panic-state') && contract.kernelMonitor.sections.includes('affected-scopes'), 'contract factory declares kernel monitor sections');
  context.assert(contract.workerPath && contract.workerPath.schema === XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA, 'contract factory declares worker path schema');
  context.assert(contract.workerPath.normalizationOnly === true && contract.workerPath.ownsCanonicalState === false, 'contract factory declares normalization-only worker path');
  context.assert(contract.handoff && contract.handoff.schema === XTEND_DEV_SURFACE_HANDOFF_SCHEMA, 'contract factory declares handoff schema');
  context.assert(contract.handoff.loadPath === XTEND_DEV_SURFACE_DIST_PATH && contract.handoff.workpackage === 'XDS-WP-09', 'contract factory declares handoff load path');
  context.assert(contract.paths.types === XTEND_DEV_SURFACE_TYPES_PATH, 'contract factory points to co-located types');
  context.assert(contract.diagnostics.catalog.some((entry) => entry.code === DIAGNOSTIC_CATALOG.monkeypatchBlocked.code), 'contract factory exposes diagnostic catalog');
  context.assert(SECURITY_BOUNDARY_RULES.some((rule) => rule.id === 'no-monkeypatching'), 'security boundary catalog includes no-monkeypatching');

  const shape = assertDevApiShape({
    version: '1.0.0',
    getPerformanceSnapshot() {},
    getHydrationSnapshot() {},
    getFabricTelemetrySnapshot() {},
    getKernelSnapshot() {},
    subscribe() {}
  });
  context.assert(shape.ok === true && shape.subscribeSupported === true, 'DEV API shape accepts expected methods');

  const missingShape = assertDevApiShape({});
  context.assert(missingShape.ok === false && missingShape.missing.includes('getKernelSnapshot'), 'DEV API shape reports missing methods');
  const record = normalizeDevApiRecord({ methods: ['getPerformanceSnapshot'] });
  context.assert(record.schema === XTEND_DEV_SURFACE_DEV_API_SCHEMA && record.diagnostics.length === 2, 'DEV API record emits method diagnostics');
  context.assert(record.optionalMethods.includes('getHydrationSnapshot') && record.missingMethods.length === 2, 'DEV API record keeps hydration optional');
  const handoff = createDevSurfaceHandoffRecord({ timestamp: '2026-07-09T10:00:00.000Z' });
  context.assert(handoff.schema === XTEND_DEV_SURFACE_HANDOFF_SCHEMA && handoff.generatedAt === '2026-07-09T10:00:00.000Z', 'handoff record factory emits stable schema');
  context.assert(handoff.buildCommands.includes('node tools/xtend-dev-surface/build.js'), 'handoff record documents build command');

  const snapshot = createDevSurfaceSnapshot(createMockSnapshot(), {
    timestamp: '2026-07-09T10:00:00.000Z'
  });
  context.assert(snapshot.schema === XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA, 'snapshot factory emits Dev Surface snapshot schema');
  context.assert(snapshot.extensionSchema === XTEND_DEV_SURFACE_EXTENSION_SCHEMA, 'snapshot factory links extension schema');
  context.assert(snapshot.devApiPresent === true, 'snapshot factory preserves DEV API presence flag');
  context.assert(snapshot.runtimeBridgeSchema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA, 'snapshot factory links runtime bridge schema');
  context.assert(snapshot.workerPath.schema === XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA, 'snapshot factory links worker path schema');
  context.assert(snapshot.workerPath.ownsDom === false && snapshot.workerPath.ownsHostServices === false, 'snapshot worker path does not own DOM or host services');
  context.assert(snapshot.chartData.schema === XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA, 'snapshot factory emits worker chart data');
  context.assert(snapshot.chartData.performanceBudgetSeries.length === 3, 'worker chart data includes performance budget series');
  context.assert(snapshot.chartData.hydrationTimelineSeries.length >= 6, 'worker chart data includes hydration timeline series');
  context.assert(snapshot.chartData.xscalerPreflightSeries[0].rejected === 1, 'worker chart data includes XScaler preflight series');
  context.assert(snapshot.chartData.fabricLaneSeries.length === 2, 'worker chart data includes fabric lane series');
  context.assert(snapshot.chartData.kernelHealthSeries[0].health === 'blocked', 'worker chart data includes kernel health series');
  context.assert(snapshot.performance.summary.grade === 'flawed', 'performance fail maps to flawed grade');
  context.assert(snapshot.performance.viewSchema === XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA, 'performance snapshot links performance view schema');
  context.assert(snapshot.performance.summary.totalDurationMs === 112 && snapshot.performance.summary.totalBudgetMs === 96, 'performance summary totals duration and budget');
  context.assert(snapshot.performance.summary.budgetUsedPct === 117 && snapshot.performance.summary.budgetMissCount === 2, 'performance summary evaluates budget misses');
  context.assert(snapshot.performance.budget.overBudgetMs === 26, 'performance budget records over-budget milliseconds');
  context.assert(snapshot.performance.trend.direction === 'regressed' && snapshot.performance.trend.deltaBudgetUsedPct === 25, 'performance trend records budget regression');
  context.assert(snapshot.performance.phaseSummaryByPhase.hydrate.grade === 'optimal', 'performance phase summary maps passing phase');
  context.assert(snapshot.performance.phaseSummaryByPhase.route.grade === 'needs-improvement', 'performance phase summary maps warning phase');
  context.assert(snapshot.performance.phaseSummaryByPhase.event.grade === 'flawed', 'performance phase summary maps failing phase');
  context.assert(snapshot.performance.measurements[0].grade === 'optimal', 'performance pass maps to optimal grade');
  context.assert(snapshot.performance.measurements[1].grade === 'needs-improvement', 'performance warn maps to needs-improvement grade');
  context.assert(snapshot.hydration.schema === XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA, 'hydration snapshot emits hydration schema');
  context.assert(snapshot.hydration.viewSchema === XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA, 'hydration snapshot links hydration view schema');
  context.assert(snapshot.hydration.strategy === 'server_prerender_resume' && snapshot.hydration.status === 'resumed', 'hydration snapshot normalizes strategy and status');
  context.assert(snapshot.hydration.resumeToken === 'tb-test-token' && snapshot.hydration.resumeTokenRedacted === false, 'hydration snapshot preserves app-provided resume token');
  context.assert(snapshot.hydration.timing.firstInteractiveMs === 64 && snapshot.hydration.timing.clsValue === 0.004, 'hydration snapshot normalizes timing values');
  context.assert(snapshot.hydration.surfaces.length === 2 && snapshot.hydration.summary.pendingSurfaceCount === 1, 'hydration snapshot normalizes surface rows');
  context.assert(snapshot.hydration.xscaler.mode === 'protocol-lazy' && snapshot.hydration.xscaler.rejectedCount === 1, 'hydration snapshot normalizes XScaler counts');
  context.assert(snapshot.hydration.xscaler.atcSessions[0].schedulerLane === 'transition', 'hydration snapshot normalizes ATC sessions');
  context.assert(snapshot.kernel.health === 'blocked', 'active kernel panic maps to blocked health');
  context.assert(snapshot.kernel.viewSchema === XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA, 'kernel snapshot links kernel monitor schema');
  context.assert(snapshot.kernel.summary.needsAttention === true && snapshot.kernel.summary.affectedScopeCount === 1, 'kernel monitor summarizes affected scope attention');
  context.assert(snapshot.kernel.summary.affectedJobCount === 1 && snapshot.kernel.summary.mitigationCount === 2, 'kernel monitor summarizes jobs and mitigations');
  context.assert(snapshot.kernel.panic.trigger === 'trust-verdict-panic' && snapshot.kernel.panic.correlationId === 'corr:test', 'kernel monitor normalizes panic details');
  context.assert(snapshot.kernel.recovery.status === 'pending' && snapshot.kernel.recovery.blockedCommitCount === 2, 'kernel monitor normalizes recovery status');
  context.assert(snapshot.kernel.mitigation.strategies.some((strategy) => strategy.scope === 'surface'), 'kernel monitor normalizes mitigation strategies');
  context.assert(snapshot.kernel.affectedScopes[0].label === 'Surface Runtime', 'kernel monitor normalizes affected scope records');
  context.assert(snapshot.kernel.affectedJobs[0].lane === 'visible', 'kernel monitor normalizes affected job records');
  context.assert(snapshot.fabric.health === 'degraded', 'fabric high backpressure maps to degraded health');
  context.assert(snapshot.fabric.viewSchema === XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA, 'fabric snapshot links fabric view schema');
  context.assert(snapshot.fabric.summary.fiberCount === 3 && snapshot.fabric.summary.laneCount === 2, 'fabric view summarizes fibers and lanes');
  context.assert(snapshot.fabric.summary.failedCount === 1 && snapshot.fabric.summary.budgetMissCount === 1, 'fabric view summarizes failures and budget misses');
  context.assert(snapshot.fabric.summary.criticalLaneCount === 1 && snapshot.fabric.summary.backpressureLevel === 'high', 'fabric view summarizes critical backpressure');
  context.assert(snapshot.fabric.fiberSummary.activeFiberCount === 1 && snapshot.fabric.fiberSummary.pendingFiberCount === 1, 'fabric view summarizes active and pending fibers');
  context.assert(snapshot.fabric.backpressure.laneIds[0] === 'diagnostics', 'fabric view normalizes backpressure lane ids');
  context.assert(snapshot.fabric.criticalLanes[0].lane === 'diagnostics', 'fabric view lists critical lanes');
  context.assert(snapshot.fabric.lanes.some((lane) => lane.lane === 'visible' && lane.fibers.length === 2), 'fabric view keeps lane fiber records');
  context.assert(snapshot.fabric.lanes.some((lane) => lane.lane === 'diagnostics' && lane.utilizationPct === 100), 'fabric lane utilization is capped at 100');
  context.assert(serializeDevSurfaceSnapshot(snapshot).includes(XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA), 'snapshot serializes stable schema');

  const redactedHydration = normalizeHydrationSnapshot({
    resumeToken: 'redacted',
    xscaler: { networkDuringRender: true }
  });
  context.assert(redactedHydration.resumeTokenRedacted === true, 'hydration snapshot marks redacted resume token');
  context.assert(redactedHydration.summary.status === 'degraded' && redactedHydration.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.devsurface.hydration.xscaler_network_during_render'), 'hydration snapshot flags networkDuringRender');

  const missingHydration = createDevSurfaceSnapshot({
    devApiPresent: true,
    performanceSnapshot: { measurements: [] },
    fabricTelemetrySnapshot: { lanes: {} },
    kernelSnapshot: { state: 'none' }
  });
  context.assert(missingHydration.ok === true && missingHydration.hydration.supported === false, 'missing optional hydration snapshot does not degrade global snapshot');

  const degraded = createDevSurfaceSnapshot({ devApiPresent: false });
  context.assert(degraded.devApiPresent === false, 'missing DEV API snapshot preserves absence flag');
  context.assert(degraded.ok === false, 'missing DEV API snapshot is degraded');
  context.assert(degraded.diagnostics.some((diagnostic) => diagnostic.code === 'xtend.devsurface.dev_api.missing'), 'missing DEV API emits degraded diagnostic');

  const classicCapabilities = createDevSurfaceSnapshot({
    devApiPresent: true,
    performanceSnapshot: { supported: true, measurements: [] },
    hydrationSnapshot: { supported: false, strategy: 'classic_loader_no_ssr', status: 'degraded' },
    fabricTelemetrySnapshot: { supported: false, status: 'degraded', lanes: {} },
    kernelSnapshot: { supported: false, status: 'degraded', state: 'unknown' }
  });
  context.assert(classicCapabilities.fabric.supported === false && classicCapabilities.fabric.health === 'unknown', 'Classic Fabric capability remains explicitly unsupported');
  context.assert(classicCapabilities.kernel.supported === false && classicCapabilities.kernel.health === 'unknown', 'Classic Kernel capability remains explicitly unsupported');
  context.assert(classicCapabilities.fabric.summary.needsAttention === false && classicCapabilities.kernel.summary.needsAttention === false, 'inactive Classic runtimes are not reported as unhealthy');

  const manifest = {
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; connect-src http://127.0.0.1:*"
    }
  };
  const security = evaluateDevSurfaceSecurityBoundary({
    manifest,
    sourceText: 'const ok = "window.__XTEND_DEV_API__";',
    workerSource: 'self.addEventListener("message", function () {});'
  });
  context.assert(security.ok === true && security.schema === XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA, 'security boundary accepts local-only extension code');
  const blockedSecurity = evaluateDevSurfaceSecurityBoundary({
    manifest: {
      content_security_policy: {
        extension_pages: "script-src 'self' https://cdn.example; object-src 'self'"
      }
    },
    sourceText: 'window.fetch = fetch; eval("1"); React.createElement("div");',
    workerSource: 'document.querySelector("x-app")',
    freeCommandAllowed: true
  });
  context.assert(blockedSecurity.ok === false, 'security boundary blocks unsafe Dev Surface contract drift');
  [
    DIAGNOSTIC_CATALOG.remoteCodeBlocked.code,
    DIAGNOSTIC_CATALOG.monkeypatchBlocked.code,
    DIAGNOSTIC_CATALOG.frameworkDependencyBlocked.code,
    DIAGNOSTIC_CATALOG.workerOwnershipBlocked.code,
    DIAGNOSTIC_CATALOG.companionFreeCommandBlocked.code,
    DIAGNOSTIC_CATALOG.cspUnsafe.code
  ].forEach((code) => {
    context.assert(blockedSecurity.diagnostics.some((diagnostic) => diagnostic.code === code), `security boundary emits ${code}`);
  });
}

async function assertClassicDevApi(context, rootDir) {
  const source = readText('xtend-classic-dev-api.js', rootDir);
  const classicModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const measurements = [{
    schema: 'xtend.performance.measurement.v1',
    id: 'loader.test',
    name: 'xtend.loader.module',
    phase: 'load',
    durationMs: 3,
    sampleKind: 'local',
    status: 'completed',
    metadata: { tag: 'x-hero' }
  }];
  const globalTarget = {
    performance: {
      getEntriesByType(type) {
        if (type === 'navigation') return [{ responseEnd: 12 }];
        if (type === 'paint') return [{ name: 'first-contentful-paint', startTime: 18 }];
        return [];
      }
    }
  };
  const controller = classicModule.installClassicDevApi({
    globalTarget,
    getMeasurements: () => measurements,
    getDiagnostics: () => [],
    getBootState: () => ({ status: 'booting' })
  });
  const api = globalTarget.__XTEND_DEV_API__;
  context.assert(controller.installed === true && controller.preserved === false, 'Classic DEV API installs through its explicit controller');
  context.assert(api && api.version === '1.0.0' && api.schema === XTEND_DEV_SURFACE_DEV_API_SCHEMA, 'Classic DEV API exposes the v1 global contract');
  DEV_API_REQUIRED_METHODS.concat(DEV_API_OPTIONAL_METHODS).forEach((method) => {
    context.assert(typeof api[method] === 'function', `Classic DEV API exposes ${method}`);
  });
  const performanceSnapshot = api.getPerformanceSnapshot();
  context.assert(performanceSnapshot.measurements.length === 3 && performanceSnapshot.supported === true, 'Classic DEV API combines loader, navigation and paint measurements');
  performanceSnapshot.measurements[0].metadata.tag = 'mutated';
  context.assert(api.getPerformanceSnapshot().measurements[0].metadata.tag === 'x-hero', 'Classic DEV API returns defensive snapshot copies');
  context.assert(JSON.parse(JSON.stringify(api.getFabricTelemetrySnapshot())).supported === false, 'Classic Fabric snapshot is synchronously serializable and unsupported');
  context.assert(api.getKernelSnapshot().supported === false && api.getKernelSnapshot().state === 'unknown', 'Classic Kernel snapshot avoids synthetic healthy state');
  context.assert(api.getHydrationSnapshot().supported === false && api.getHydrationSnapshot().strategy === 'classic_loader_no_ssr', 'Classic hydration snapshot reports the no-SSR strategy');
  const events = [];
  const unsubscribe = api.subscribe((event) => events.push(event));
  controller.publish('loader-performance', measurements[0]);
  unsubscribe();
  controller.publish('loader-diagnostic', { code: 'ignored.after.unsubscribe' });
  context.assert(events.length === 1 && events[0].kind === 'loader-performance', 'Classic DEV API subscriptions publish updates and unsubscribe cleanly');
  controller.complete({ schema: 'xtend.loader.contract.v1', loadedTags: ['x-hero'] }, 'ready');
  context.assert(api.getPerformanceSnapshot().status === 'ready', 'Classic DEV API transitions to ready after loader completion');
  const preserved = classicModule.installClassicDevApi({ globalTarget });
  context.assert(preserved.preserved === true && globalTarget.__XTEND_DEV_API__ === api, 'Classic DEV API preserves an existing host contract');
  context.assert(!/((window|globalThis)\.fetch\s*=|history\.(pushState|replaceState)\s*=|performance\.(mark|measure)\s*=|customElements\.define\s*=)/u.test(source), 'Classic DEV API contains no forbidden monkeypatch');
}

async function assertCompanion(context, rootDir) {
  const definitions = listGateDefinitions();
  context.assert(definitions.some((definition) => definition.gateId === 'pr-fast'), 'companion exposes PR fast gate definition');
  const gate = resolveGateDefinition('fabric-telemetry-snapshot');
  context.assert(gate && gate.command[0] === 'node' && gate.command.includes('--json'), 'fabric telemetry gate uses node runner allowlist');
  const plan = createCompanionGatePlan('rmt-kernel-panic-monitor');
  context.assert(plan.schema === XTEND_DEV_SURFACE_GATE_RUN_SCHEMA && plan.allowed === true, 'companion creates allowed gate plan');
  const blocked = createCompanionGatePlan('rm -rf repo');
  context.assert(blocked.allowed === false && blocked.status === 'blocked', 'companion blocks arbitrary command strings');
  context.assert(normalizeGateRun({ gateId: 'unknown' }).allowed === false, 'gate run normalizer blocks unknown gates');
  context.assert(authorizeCompanionRequest({ [TOKEN_HEADER]: 'token' }, 'token') === true, 'companion token authorizes matching request');
  context.assert(authorizeCompanionRequest({ [TOKEN_HEADER]: 'wrong' }, 'token') === false, 'companion token rejects mismatched request');
  const handshake = createCompanionHandshake({ [TOKEN_HEADER]: 'token' }, { token: 'token' });
  context.assert(handshake.schema === HANDSHAKE_SCHEMA && handshake.ok === true, 'companion token handshake accepts matching token');
  const rejectedHandshake = createCompanionHandshake({ [TOKEN_HEADER]: 'wrong' }, { token: 'token' });
  context.assert(rejectedHandshake.ok === false && rejectedHandshake.diagnostics[0].code === DIAGNOSTIC_CATALOG.companionUnauthorized.code, 'companion token handshake rejects mismatched token');
  context.assert(parseGateReport('{"schema":"xtend.test.report.v1","status":"passed"}').status === 'passed', 'companion parses JSON gate report from stdout');
  context.assert(parseGateReport('starting\n{"schema":"xtend.test.report.v1","status":"passed"}\ndone').status === 'passed', 'companion parses JSON gate report from noisy stdout');

  const store = createRunStore();
  const streamEvents = [];
  const unsubscribe = store.subscribe((event) => streamEvents.push(event));
  const storedRun = normalizeGateRun({
    gateId: 'xtend-dev-surface',
    status: 'running',
    startedAt: '2026-07-09T10:00:00.000Z'
  });
  store.add(storedRun);
  store.update(storedRun.runId, { ...storedRun, status: 'passed', progress: 100 });
  unsubscribe();
  context.assert(store.snapshot().schema === XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA, 'companion run store emits gate stream schema');
  context.assert(streamEvents.some((event) => event.schema === XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA && event.event === 'gate-run.created'), 'companion run store publishes stream events');
  const streamEvent = createGateStreamEvent('gate-run.completed', storedRun);
  context.assert(streamEvent.schema === XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA && streamEvent.runId === storedRun.runId, 'companion creates normalized stream event');

  const artifact = createCompanionArtifactRecord('.xtend-test-results/xtend-pr-gate-report.json', { rootDir });
  context.assert(artifact.schema === XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA && artifact.url.includes('/artifacts/'), 'companion creates gate artifact link record');
  context.assert(isAllowlistedArtifactPath('.xtend-test-results/xtend-pr-gate-report.json') === true, 'companion allows only reportPath artifacts from gate allowlist');
  context.assert(isAllowlistedArtifactPath('../package.json') === false, 'companion blocks traversal artifact paths');

  const mockAllowlist = {
    'mock-pass': Object.freeze({
      gateId: 'mock-pass',
      label: 'Mock Passing Gate',
      command: Object.freeze([
        process.execPath,
        '-e',
        ''
      ]),
      reportPath: null,
      category: 'test'
    })
  };
  const mockEvents = [];
  const mockPlan = createCompanionGatePlan('mock-pass', { allowlist: mockAllowlist });
  context.assert(mockPlan.allowed === true && mockPlan.command[0] === process.execPath, 'companion accepts custom allowlisted mock gate');
  const mockRun = await runAllowedGate('mock-pass', {
    allowlist: mockAllowlist,
    rootDir,
    onEvent(event) {
      mockEvents.push(event);
    }
  });
  context.assert(mockRun.status === 'passed' && mockRun.allowed === true, 'companion runs allowed mock gate');
  context.assert(mockEvents.some((event) => event.event === 'gate-run.started') && mockEvents.some((event) => event.event === 'gate-run.completed'), 'companion emits streaming events for allowed mock gate');
  const blockedRun = await runAllowedGate('node -e free-command', { allowlist: mockAllowlist, rootDir });
  context.assert(blockedRun.allowed === false && blockedRun.status === 'blocked', 'companion refuses non-allowlisted command execution');
}

function assertPackageAndRunner(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.devSurface;
  context.assert(packageManifest.scripts['test:xtend-dev-surface'] === 'node scripts/run_xtend_tests.js xtend-dev-surface', 'package exposes Dev Surface test script');
  context.assert(packageManifest.scripts['test:xtend-dev-surface:report'] === 'node scripts/run_xtend_tests.js xtend-dev-surface --report .xtend-test-results/xtend-dev-surface-report.json', 'package exposes Dev Surface report script');
  context.assert(metadata && metadata.schema === XTEND_DEV_SURFACE_EXTENSION_SCHEMA, 'package metadata declares Dev Surface schema');
  context.assert(metadata && metadata.contractSchema === XTEND_DEV_SURFACE_CONTRACT_SCHEMA, 'package metadata declares Dev Surface contract schema');
  context.assert(metadata && metadata.devApiSchema === XTEND_DEV_SURFACE_DEV_API_SCHEMA, 'package metadata declares Dev Surface DEV API schema');
  context.assert(metadata && metadata.securityBoundarySchema === XTEND_DEV_SURFACE_SECURITY_BOUNDARY_SCHEMA, 'package metadata declares Dev Surface security boundary schema');
  context.assert(metadata && metadata.skeletonSchema === XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA, 'package metadata declares Dev Surface skeleton schema');
  context.assert(metadata && metadata.buildReportSchema === XTEND_DEV_SURFACE_BUILD_REPORT_SCHEMA, 'package metadata declares Dev Surface build report schema');
  context.assert(metadata && metadata.runtimeBridgeSchema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_SCHEMA, 'package metadata declares Dev Surface runtime bridge schema');
  context.assert(metadata && metadata.runtimeBridgeReadSchema === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_READ_SCHEMA, 'package metadata declares Dev Surface runtime bridge read schema');
  context.assert(metadata && metadata.companionSchema === XTEND_DEV_SURFACE_COMPANION_SCHEMA, 'package metadata declares Dev Surface companion schema');
  context.assert(metadata && metadata.gateStreamSchema === XTEND_DEV_SURFACE_GATE_STREAM_SCHEMA, 'package metadata declares Dev Surface gate stream schema');
  context.assert(metadata && metadata.gateArtifactSchema === XTEND_DEV_SURFACE_GATE_ARTIFACT_SCHEMA, 'package metadata declares Dev Surface gate artifact schema');
  context.assert(metadata && metadata.performanceViewSchema === XTEND_DEV_SURFACE_PERFORMANCE_VIEW_SCHEMA, 'package metadata declares Dev Surface performance view schema');
  context.assert(metadata && metadata.hydrationSnapshotSchema === XTEND_DEV_SURFACE_HYDRATION_SNAPSHOT_SCHEMA, 'package metadata declares Dev Surface hydration snapshot schema');
  context.assert(metadata && metadata.hydrationViewSchema === XTEND_DEV_SURFACE_HYDRATION_VIEW_SCHEMA, 'package metadata declares Dev Surface hydration view schema');
  context.assert(metadata && metadata.fabricViewSchema === XTEND_DEV_SURFACE_FABRIC_VIEW_SCHEMA, 'package metadata declares Dev Surface fabric view schema');
  context.assert(metadata && metadata.kernelMonitorSchema === XTEND_DEV_SURFACE_KERNEL_MONITOR_SCHEMA, 'package metadata declares Dev Surface kernel monitor schema');
  context.assert(metadata && metadata.workerPathSchema === XTEND_DEV_SURFACE_WORKER_PATH_SCHEMA, 'package metadata declares Dev Surface worker path schema');
  context.assert(metadata && metadata.handoffSchema === XTEND_DEV_SURFACE_HANDOFF_SCHEMA, 'package metadata declares Dev Surface handoff schema');
  context.assert(metadata && metadata.workpackage === 'XDS-WP-09', 'package metadata points to XDS-WP-09');
  context.assert(metadata && metadata.skeletonWorkpackage === XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE, 'package metadata preserves XDS-WP-02 skeleton marker');
  context.assert(metadata && metadata.runtimeBridgeWorkpackage === XTEND_DEV_SURFACE_RUNTIME_BRIDGE_WORKPACKAGE, 'package metadata declares XDS-WP-03 runtime bridge marker');
  context.assert(metadata && metadata.companionWorkpackage === 'XDS-WP-04', 'package metadata declares XDS-WP-04 companion marker');
  context.assert(metadata && metadata.performanceViewWorkpackage === 'XDS-WP-05', 'package metadata declares XDS-WP-05 performance view marker');
  context.assert(metadata && metadata.hydrationViewWorkpackage === 'XDS-WP-10', 'package metadata declares XDS-WP-10 hydration view marker');
  context.assert(metadata && metadata.publicDocsWorkpackage === 'XDS-WP-11', 'package metadata declares XDS-WP-11 public docs marker');
  context.assert(metadata && metadata.devApiDocsWorkpackage === 'XDS-WP-12', 'package metadata declares XDS-WP-12 DEV API docs marker');
  context.assert(metadata && metadata.docs && metadata.docs.de === 'docs/de/xtend-dev-surface.md', 'package metadata points to German Dev Surface docs');
  context.assert(metadata && metadata.docs && metadata.docs.en === 'docs/en/xtend-dev-surface.md', 'package metadata points to English Dev Surface docs');
  context.assert(metadata && metadata.devApiDocs && metadata.devApiDocs.de === 'docs/de/xtend-dev-api.md', 'package metadata points to German DEV API docs');
  context.assert(metadata && metadata.devApiDocs && metadata.devApiDocs.en === 'docs/en/xtend-dev-api.md', 'package metadata points to English DEV API docs');
  context.assert(metadata && metadata.classicModule === 'xtend-classic-dev-api.js' && metadata.classicActivation === 'data-dev-api=true', 'package metadata declares the Classic loader DEV API integration');
  context.assert(packageManifest.files.includes('xtend-classic-dev-api.js') && packageManifest.files.includes('xtend-classic-dev-api.d.ts'), 'root package publishes the internal Classic DEV API service');
  context.assert(!Object.keys(packageManifest.exports || {}).some((entry) => entry.includes('dev-api')), 'DEV API docs add no public package export');
  context.assert(metadata && metadata.kernelMonitorWorkpackage === 'XDS-WP-06', 'package metadata declares XDS-WP-06 kernel monitor marker');
  context.assert(metadata && metadata.fabricViewWorkpackage === 'XDS-WP-07', 'package metadata declares XDS-WP-07 fabric view marker');
  context.assert(metadata && metadata.workerPathWorkpackage === 'XDS-WP-08', 'package metadata declares XDS-WP-08 worker path marker');
  context.assert(metadata && metadata.handoffWorkpackage === 'XDS-WP-09', 'package metadata declares XDS-WP-09 handoff marker');
  context.assert(metadata && metadata.types === XTEND_DEV_SURFACE_TYPES_PATH, 'package metadata points to Dev Surface contract types');
  context.assert(metadata && metadata.dist === XTEND_DEV_SURFACE_DIST_PATH, 'package metadata points to Dev Surface dist path');
  context.assert(metadata && metadata.skeleton === 'tools/xtend-dev-surface/extension-skeleton.js', 'package metadata points to Dev Surface skeleton module');
  context.assert(metadata && metadata.runtimeBridgeModule === 'tools/xtend-dev-surface/src/runtime-bridge.js', 'package metadata points to Dev Surface runtime bridge module');
  context.assert(metadata && metadata.runtimeBridgeTypes === 'tools/xtend-dev-surface/runtime-bridge.d.ts', 'package metadata points to Dev Surface runtime bridge types');
  context.assert(metadata && metadata.runtimeBridgeDist === 'tools/xtend-dev-surface/dist/runtime-bridge.js', 'package metadata points to Dev Surface runtime bridge dist artifact');
  context.assert(metadata && metadata.buildReport === 'tools/xtend-dev-surface/dist/build-report.json', 'package metadata points to Dev Surface build report');
  context.assert(metadata && metadata.handoff === 'tools/xtend-dev-surface/dist/handoff.json', 'package metadata points to Dev Surface handoff artifact');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js xtend-dev-surface --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === XTEND_DEV_SURFACE_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.reportScript === 'npm run test:xtend-dev-surface:report', 'package metadata declares report script');
  context.assert(metadata && metadata.reportPath === '.xtend-test-results/xtend-dev-surface-report.json', 'package metadata declares report path');
  context.assert(metadata && metadata.ciArtifactName === 'xtend-dev-surface-report-node-26', 'package metadata declares CI artifact name');
  context.assert(runner.includes("id: 'xtend-dev-surface'"), 'runner exposes xtend-dev-surface suite');
}

function assertDocs(context, rootDir) {
  const doc = readText(XTEND_DEV_SURFACE_CONTRACT_PATH, rootDir);
  const docsQualityPlan = readText('development/XTend-Docs-Quality-Implementierungsplan.md', rootDir);
  const docsMenu = readJson('docs/menu.json', rootDir);
  const docsDe = readText('docs/de/xtend-dev-surface.md', rootDir);
  const docsEn = readText('docs/en/xtend-dev-surface.md', rootDir);
  const devApiDocsDe = readText('docs/de/xtend-dev-api.md', rootDir);
  const devApiDocsEn = readText('docs/en/xtend-dev-api.md', rootDir);
  const docsReadmeDe = readText('docs/de/README.md', rootDir);
  const docsReadmeEn = readText('docs/en/README.md', rootDir);
  const readme = readText('tools/xtend-dev-surface/README.md', rootDir);
  context.assertIncludes(doc, 'XDS-WP-00', 'implementation plan documents XDS-WP-00');
  context.assertIncludes(doc, 'XDS-WP-03 Runtime Bridge', 'implementation plan documents XDS-WP-03');
  context.assertIncludes(doc, 'XDS-WP-04 Gate Runner', 'implementation plan documents XDS-WP-04');
  context.assertIncludes(doc, 'XDS-WP-05 Performance View', 'implementation plan documents XDS-WP-05');
  context.assertIncludes(doc, 'XDS-WP-06 Kernel Monitor', 'implementation plan documents XDS-WP-06');
  context.assertIncludes(doc, 'XDS-WP-07 Fabric View', 'implementation plan documents XDS-WP-07');
  context.assertIncludes(doc, 'XDS-WP-08 Worker Path', 'implementation plan documents XDS-WP-08');
  context.assertIncludes(doc, 'XDS-WP-09 Handoff', 'implementation plan documents XDS-WP-09');
  context.assertIncludes(doc, 'XDS-WP-10 Hydration/XScaler', 'implementation plan documents XDS-WP-10');
  context.assertIncludes(doc, 'XDS-WP-11 Public Documentation', 'implementation plan documents XDS-WP-11');
  context.assertIncludes(doc, 'XDS-WP-12 Public DEV API Reference', 'implementation plan documents XDS-WP-12');
  context.assertIncludes(doc, 'xtend.devsurface.hydration-snapshot.v1', 'implementation plan documents hydration snapshot schema');
  context.assertIncludes(doc, 'XDS-WP-09', 'implementation plan documents XDS-WP-09');
  context.assertIncludes(doc, 'window.__XTEND_DEV_API__', 'implementation plan documents DEV API');
  context.assertIncludes(doc, 'Keine Patches', 'implementation plan documents no monkeypatching boundary');
  context.assertIncludes(readme, 'Extension Laden', 'README documents extension loading');
  context.assertIncludes(readme, 'node tools/xtend-dev-surface/build.js', 'README documents build command');
  context.assertIncludes(readme, 'getHydrationSnapshot()', 'README documents optional hydration DEV API');
  context.assertIncludes(readme, 'No XTend app detected', 'README documents missing XTend app blocking state');
  context.assertIncludes(readme, 'npm run test:xtend-dev-surface', 'README documents package test command');
  context.assertIncludes(readme, 'tools/xtend-dev-surface/dist/', 'README documents dist load path');
  context.assertIncludes(readme, 'Troubleshooting', 'README documents troubleshooting');
  context.assertIncludes(docsQualityPlan, 'XDQ-WP-00', 'docs quality plan records its baseline workpackage');
  context.assertIncludes(docsQualityPlan, 'XDQ-WP-11', 'docs quality plan records the public DEV API reference workpackage');
  const menuEntry = docsMenu.find((entry) => entry.slug === 'xtend-dev-surface');
  const devApiMenuEntry = docsMenu.find((entry) => entry.slug === 'xtend-dev-api');
  context.assert(menuEntry && menuEntry.group === 'quality' && menuEntry.contentType === 'tutorial', 'docs menu exposes Dev Surface as a quality tutorial');
  context.assert(docsMenu.length === 169, 'docs menu exposes 169 canonical articles after DEV API registration');
  context.assert(devApiMenuEntry && devApiMenuEntry.id === 'docs.xtend.dev.api' && devApiMenuEntry.group === 'quality', 'docs menu exposes the canonical XTend DEV API entry');
  context.assert(devApiMenuEntry && devApiMenuEntry.parent === 'xtend-dev-surface' && devApiMenuEntry.trunk === 'operate' && devApiMenuEntry.section === 'devtools', 'DEV API reference is nested in Operate Dev Tools');
  context.assert(devApiMenuEntry && devApiMenuEntry.contentType === 'reference' && devApiMenuEntry.tier === 'basic' && devApiMenuEntry.rank === 93 && devApiMenuEntry.icon === 'braces', 'DEV API menu metadata declares the planned reference profile');
  [docsDe, docsEn].forEach((publicDoc) => {
    [
      'window.__XTEND_DEV_API__',
      'getPerformanceSnapshot()',
      'getHydrationSnapshot()',
      'getFabricTelemetrySnapshot()',
      'getKernelSnapshot()',
      'Performance',
      'Hydration',
      'Kernel',
      'Fabric',
      'Gates',
      'No XTend app detected',
      '9196',
      'XTEND_DEV_SURFACE_TOKEN=dev',
      'tools/xtend-dev-surface/dist/'
    ].forEach((marker) => context.assertIncludes(publicDoc, marker, `public Dev Surface docs include ${marker}`));
  });
  context.assertIncludes(docsReadmeDe, './xtend-dev-surface.md', 'German Developer Center links Dev Surface');
  context.assertIncludes(docsReadmeEn, './xtend-dev-surface.md', 'English Developer Center links Dev Surface');
  context.assertIncludes(docsReadmeDe, './xtend-dev-api.md', 'German Developer Center links DEV API reference');
  context.assertIncludes(docsReadmeEn, './xtend-dev-api.md', 'English Developer Center links DEV API reference');
  [devApiDocsDe, devApiDocsEn].forEach((publicDoc) => {
    context.assert(publicDoc.startsWith('# XTend DEV API'), 'public DEV API reference starts with the canonical title');
    context.assertIncludes(publicDoc, 'window.__XTEND_DEV_API__', 'public DEV API reference names the global boundary');
    context.assertIncludes(publicDoc, 'window.XTend', 'public DEV API reference distinguishes the product API');
    context.assertIncludes(publicDoc, 'data-dev-api="true"', 'public DEV API reference documents the Classic loader opt-in');
    DEV_API_REQUIRED_METHODS.forEach((method) => context.assertIncludes(publicDoc, `${method}()`, `public DEV API reference includes required method ${method}`));
    DEV_API_OPTIONAL_METHODS.forEach((method) => context.assertIncludes(publicDoc, method === 'subscribe' ? 'subscribe(listener)' : `${method}()`, `public DEV API reference includes optional method ${method}`));
    [
      'xtend.devsurface.performance-snapshot.v1',
      'xtend.performance.measurement.v1',
      'xtend.fabric.telemetry-snapshot.v1',
      'xtend.rmt.kernel-panic-state.v1',
      'xtend.devsurface.hydration-snapshot.v1'
    ].forEach((schema) => context.assertIncludes(publicDoc, schema, `public DEV API reference includes schema ${schema}`));
    [
      'xtend.devsurface.dev_api.missing',
      'xtend.devsurface.dev_api.method_missing',
      'xtend.devsurface.runtime_bridge.async_snapshot_unsupported',
      'xtend.devsurface.runtime_bridge.serialization_failed',
      'xtend.devsurface.runtime_bridge.read_failed'
    ].forEach((code) => context.assertIncludes(publicDoc, code, `public DEV API reference includes diagnostic ${code}`));
    context.assertIncludes(publicDoc, './xtend-dev-surface.md', 'public DEV API reference links Dev Surface');
    context.assertIncludes(publicDoc, './performance.md', 'public DEV API reference links Performance');
    context.assertIncludes(publicDoc, './hydration-policies.md', 'public DEV API reference links Hydration Policies');
    context.assertIncludes(publicDoc, './rmt-kernel-runtime.md', 'public DEV API reference links Kernel Runtime');
    context.assertIncludes(publicDoc, './xtend-fabric-runtime.md', 'public DEV API reference links Fabric Runtime');
  });
  const codeBlocksDe = extractFencedCodeBlocks(devApiDocsDe);
  const codeBlocksEn = extractFencedCodeBlocks(devApiDocsEn);
  context.assert(codeBlocksDe.length === 7 && JSON.stringify(codeBlocksDe) === JSON.stringify(codeBlocksEn), 'DE and EN DEV API references contain seven technically identical examples');
  [
    'docs/de/xtend-dev-surface.md',
    'docs/en/xtend-dev-surface.md',
    'docs/de/performance.md',
    'docs/en/performance.md',
    'docs/de/hydration-policies.md',
    'docs/en/hydration-policies.md',
    'docs/de/rmt-kernel-runtime.md',
    'docs/en/rmt-kernel-runtime.md',
    'docs/de/xtend-fabric-runtime.md',
    'docs/en/xtend-fabric-runtime.md'
  ].forEach((articlePath) => context.assertIncludes(readText(articlePath, rootDir), './xtend-dev-api.md', `${articlePath} links DEV API reference`));
}

async function runXTendDevSurfaceSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'xtend-dev-surface',
    label: 'XTend Dev Surface Chromium DevTools Extension'
  });

  assertCommonFiles(context, rootDir);
  assertManifest(context, rootDir);
  assertExtensionSkeleton(context, rootDir);
  assertNoMonkeypatching(context, rootDir);
  assertRuntimeBridge(context, rootDir);
  assertWorkerPath(context, rootDir);
  assertContracts(context);
  await assertClassicDevApi(context, rootDir);
  await assertCompanion(context, rootDir);
  assertPackageAndRunner(context, rootDir);
  assertDocs(context, rootDir);

  const panelHtml = readText('tools/xtend-dev-surface/dist/panel.html', rootDir);
  const panelJs = readText('tools/xtend-dev-surface/dist/panel.js', rootDir);
  const panelCss = readText('tools/xtend-dev-surface/dist/panel.css', rootDir);
  const serviceWorkerJs = readText('tools/xtend-dev-surface/dist/service-worker.js', rootDir);
  context.assert(panelHtml.includes('id="xds-view"') && panelHtml.includes('runtime-bridge.js') && panelHtml.includes('panel.js'), 'panel HTML exposes render root and runtime bridge scripts');
  context.assert(panelHtml.includes('data-view="hydration"') && panelHtml.indexOf('data-view="performance"') < panelHtml.indexOf('data-view="hydration"'), 'panel HTML exposes Hydration tab after Performance');
  context.assert(panelJs.includes('renderPerformance') && panelJs.includes('renderHydration') && panelJs.includes('renderKernel') && panelJs.includes('renderFabric'), 'panel JS contains performance, hydration, kernel and fabric views');
  context.assert(panelJs.includes('renderMissingXTendAppOverlay') && panelJs.includes('No XTend app detected') && panelJs.includes('Copy Diagnostic'), 'panel JS renders missing XTend app blocking overlay');
  context.assert(panelJs.includes('xtend.devsurface.dev_api.missing') && panelJs.includes('window.__XTEND_DEV_API__'), 'panel JS keys missing app overlay to explicit DEV API absence');
  context.assert(panelJs.includes('renderBudget') && panelJs.includes('renderTrend') && panelJs.includes('renderPhaseSummary'), 'panel JS renders performance budget, trend and phase summary');
  context.assert(panelJs.includes('renderHydrationTimeline') && panelJs.includes('renderHydrationXScaler') && panelJs.includes('Resume Token'), 'panel JS renders hydration timeline and XScaler view');
  context.assert(panelJs.includes('renderKernelRecovery') && panelJs.includes('renderKernelMitigations') && panelJs.includes('renderKernelScopes'), 'panel JS renders kernel recovery, mitigation and affected scopes');
  context.assert(panelJs.includes('renderFabricFiberSummary') && panelJs.includes('renderFabricBackpressure') && panelJs.includes('renderFabricCriticalLanes'), 'panel JS renders fabric fiber summary, backpressure and critical lanes');
  context.assert(panelJs.includes('The RMT Kernel is not active in this XTend Classic host.') && panelJs.includes('Fabric is not active in this XTend Classic host.'), 'panel renders inactive Classic Kernel and Fabric capabilities honestly');
  context.assert(panelJs.includes('readRuntimeSnapshotFromInspectedWindow'), 'panel JS delegates DEV API reads to runtime bridge');
  context.assert(panelJs.includes('/handshake') && panelJs.includes('EventSource') && panelJs.includes('/gate-runs/events'), 'panel JS connects companion handshake and gate stream');
  context.assert(panelJs.includes('data-companion-token') && panelJs.includes('setCompanionToken') && panelJs.includes('xtend.devSurface.token'), 'panel JS exposes Companion token setup');
  context.assert(panelJs.includes('verifyCompanion') && panelJs.includes('Companion connected'), 'panel JS exposes Companion connectivity check');
  context.assert(panelJs.includes('artifactUrl'), 'panel JS renders companion artifact links');
  context.assert(panelCss.includes('.xds-timeline') && panelCss.includes('.xds-token'), 'panel CSS styles Hydration timeline and resume token');
  context.assert(panelCss.includes('.xds-blocking-state') && panelCss.includes('.xds-diagnostic-callout'), 'panel CSS styles missing app blocking overlay');
  context.assert(panelCss.includes('code {') && panelCss.includes('white-space: nowrap'), 'panel CSS keeps inline DEV API code readable');
  context.assert(panelCss.includes('.xds-companion-form') && panelCss.includes('.xds-companion-status'), 'panel CSS styles Companion setup controls');
  context.assert(serviceWorkerJs.includes('xds:companion-handshake') && serviceWorkerJs.includes('isAllowedCompanionOrigin'), 'service worker exposes local-only companion handshake');
  context.assert(panelJs.includes('new Worker') && panelJs.includes('prewarm-worker.js'), 'panel starts optional prewarm worker');
  context.assert(panelJs.includes('xds:normalize-snapshot'), 'panel posts snapshot normalization requests to prewarm worker');

  return context.result({
    schema: 'xtend.devsurface.suite-report.v1',
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    snapshotSchema: XTEND_DEV_SURFACE_SNAPSHOT_SCHEMA,
    gateRunSchema: XTEND_DEV_SURFACE_GATE_RUN_SCHEMA,
    distPath: XTEND_DEV_SURFACE_DIST_PATH
  });
}

function printXTendDevSurfaceReport(result) {
  printSuiteReport(result);
}

module.exports = {
  printXTendDevSurfaceReport,
  runXTendDevSurfaceSuite
};

'use strict';

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');
const {
  DATA_SOURCE_KIND_CAPABILITIES,
  DATA_SOURCE_KINDS
} = require('./vnext-events');
const {
  RMT_VNEXT_SCHEDULER_SCHEMA,
  createSchedulerPolicy
} = require('./vnext-scheduler');
const {
  RMT_VNEXT_SECURITY_POLICY_SCHEMA,
  createSecurityPolicyContract
} = require('./vnext-security');

const RMT_VNEXT_STREAMING_SCHEMA = 'xtend.rmt.vnext-streaming-contract.v1';
const RMT_VNEXT_STREAM_OPERATION_SCHEMA = 'xtend.rmt.vnext-stream-operation.v1';
const RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA = 'xtend.rmt.vnext-stream-runtime-probe.v1';
const RMT_VNEXT_STREAMING_REPORT_SCHEMA = 'xtend.rmt.vnext-streaming-report.v1';
const RMT_VNEXT_STREAMING_WORKPACKAGE = 'WP-E15-14';
const RMT_VNEXT_STREAMING_MODULE_PATH = 'tools/rmt-language/vnext-streaming.js';
const RMT_VNEXT_STREAMING_SUITE_PATH = 'tests/rmt-language/rmt_vnext_streaming_suite.js';
const RMT_VNEXT_STREAMING_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-streaming';

const STREAM_SOURCE_MISSING_CODE = 'rmt.vnext.streaming.operation.source_missing';
const STREAM_DATA_SOURCE_MISSING_CODE = 'rmt.vnext.streaming.data_source.missing';
const STREAM_DATA_SOURCE_KIND_UNSUPPORTED_CODE = 'rmt.vnext.streaming.data_source.kind_unsupported';
const STREAM_SCHEDULER_MISSING_CODE = 'rmt.vnext.streaming.scheduler.missing';
const STREAM_BACKPRESSURE_MISSING_CODE = 'rmt.vnext.streaming.backpressure.missing';
const STREAM_SECURITY_MISSING_CODE = 'rmt.vnext.streaming.security.missing';
const STREAM_COMPLETION_MISSING_CODE = 'rmt.vnext.streaming.completion.missing';
const STREAM_ERROR_PATH_MISSING_CODE = 'rmt.vnext.streaming.error_path.missing';
const STREAM_CAPABILITY_MISSING_CODE = 'rmt.vnext.streaming.capability.missing';
const STREAM_RUNTIME_PROBE_HOST_COUPLED_CODE = 'rmt.vnext.streaming.runtime_probe.host_coupled';

const STREAM_VARIANT_CAPABILITIES = Object.freeze({
  sse: 'stream.sse.incremental',
  worker: 'stream.worker.incremental',
  ssr: 'stream.ssr.incremental',
  hydration: 'stream.hydration.chunked'
});

const DEFAULT_COMPLETION_SIGNALS = Object.freeze({
  sse: Object.freeze({
    signal: 'rmt.vnext.stream.complete',
    source: 'event:end',
    terminal: true,
    timeoutMs: null
  }),
  worker: Object.freeze({
    signal: 'rmt.vnext.worker.complete',
    source: 'worker-message:complete',
    terminal: true,
    timeoutMs: 5000
  }),
  ssr: Object.freeze({
    signal: 'rmt.vnext.ssr.complete',
    source: 'response:eof',
    terminal: true,
    timeoutMs: 3000
  }),
  hydration: Object.freeze({
    signal: 'rmt.vnext.hydration.complete',
    source: 'operation:complete',
    terminal: true,
    timeoutMs: 3000
  })
});

const DEFAULT_ERROR_PATHS = Object.freeze({
  sse: Object.freeze({
    signal: 'rmt.vnext.stream.error',
    behavior: 'close-and-surface-retry',
    retry: 'resume-after-backoff'
  }),
  worker: Object.freeze({
    signal: 'rmt.vnext.worker.error',
    behavior: 'terminate-and-retry',
    retry: 'restart-worker'
  }),
  ssr: Object.freeze({
    signal: 'rmt.vnext.ssr.error',
    behavior: 'abort-fragment',
    retry: 'refetch-fragment'
  }),
  hydration: Object.freeze({
    signal: 'rmt.vnext.hydration.error',
    behavior: 'rollback-chunk',
    retry: 'resume-from-boundary'
  })
});

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueList(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function createStreamingDiagnostic(coreDocument, operation, code, message, severity, details) {
  const diagnostic = {
    code,
    severity: severity || 'error',
    message,
    sourceRef: operation && operation.sourceRef || coreDocument && coreDocument.sourceRef || null,
    operationId: operation && operation.id || null
  };
  if (details && typeof details === 'object') {
    diagnostic.details = details;
  }
  return diagnostic;
}

function createIndex(items, keySelector) {
  const index = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = keySelector ? keySelector(item) : item && item.id;
    if (key) index.set(key, item);
  });
  return index;
}

function normalizeDataSourceCatalog(dataSources) {
  const records = [];
  const byId = new Map();
  const byTarget = new Map();

  (Array.isArray(dataSources) ? dataSources : []).forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const id = String(entry.id || entry.dataSourceId || entry.target || `dataSource.${index}`).trim();
    if (!id) return;
    const record = {
      id,
      kind: entry.kind || entry.type || null,
      target: entry.target || entry.id || id,
      unsafe: entry.unsafe === true || entry.requiresTrustBoundary === true || !!(entry.security && entry.security.unsafe === true),
      format: entry.format || entry.security && entry.security.format || null,
      requiresTrustBoundary: entry.requiresTrustBoundary === true || !!(entry.security && entry.security.requiresTrustBoundary === true),
      requiresSanitize: Array.isArray(entry.requiresSanitize)
        ? entry.requiresSanitize.slice()
        : (entry.requiresSanitize ? [entry.requiresSanitize] : []),
      source: entry
    };
    records.push(record);
    byId.set(record.id, record);
    if (record.target) byTarget.set(record.target, record);
  });

  return {
    count: records.length,
    ids: records.map((record) => record.id),
    records,
    byId,
    byTarget
  };
}

function isStreamOperation(operation) {
  return !!operation && (operation.kind === 'stream' || operation.op === 'stream');
}

function isChunkedHydrationOperation(operation) {
  const source = operation && operation.source;
  return !!operation
    && operation.kind === 'lifecycle'
    && operation.op === 'hydrate'
    && !!source
    && (source.kind === 'dataSource' || source.kind === 'data-source' || String(source.ref || '').startsWith('dataSource:'));
}

function isStreamingCandidate(operation) {
  return isStreamOperation(operation) || isChunkedHydrationOperation(operation);
}

function classifyStreamVariant(operation, dataSource) {
  if (isChunkedHydrationOperation(operation)) return 'hydration';
  if (dataSource && dataSource.kind === 'sse') return 'sse';
  if (dataSource && dataSource.kind === 'worker') return 'worker';
  if (dataSource && dataSource.kind === 'endpoint') return 'ssr';
  return null;
}

function createChunkMetadata(operation, variant, lanePolicy) {
  const chunking = lanePolicy && lanePolicy.chunking ? lanePolicy.chunking : null;
  if (!chunking) return null;
  return {
    mode: variant === 'hydration' ? 'chunked-hydration' : 'incremental-stream',
    strategy: chunking.strategy,
    maxChunkMs: chunking.maxChunkMs,
    yieldAfterMs: chunking.yieldAfterMs,
    preferIdle: chunking.preferIdle === true,
    metadata: {
      operationId: operation && operation.id || null,
      laneId: operation && operation.scope && operation.scope.lane || null,
      chunkKey: `rmt.vnext.${variant || 'stream'}.${operation && operation.id || 'operation'}`
    }
  };
}

function createBackpressureMetadata(lanePolicy) {
  if (!lanePolicy || !lanePolicy.backpressure) return null;
  return {
    signal: lanePolicy.backpressure.signal,
    behavior: lanePolicy.backpressure.behavior,
    coalescePolicy: lanePolicy.backpressure.coalescePolicy,
    coalesceKey: lanePolicy.backpressure.coalesceKey
  };
}

function createSchedulerIndexes(schedulerPolicy) {
  const lanes = Array.isArray(schedulerPolicy && schedulerPolicy.lanes) ? schedulerPolicy.lanes : [];
  return {
    byLaneId: createIndex(lanes, (lane) => lane && lane.laneId),
    byOperationId: lanes.reduce((index, lane) => {
      (Array.isArray(lane && lane.operationRefs) ? lane.operationRefs : []).forEach((operationRef) => {
        index.set(operationRef, lane);
      });
      return index;
    }, new Map())
  };
}

function createSecurityIndex(securityContract) {
  return createIndex(securityContract && securityContract.postures, (posture) => posture && posture.operationId);
}

function mergeVariantMap(defaults, overrides) {
  return {
    sse: overrides && Object.prototype.hasOwnProperty.call(overrides, 'sse') ? overrides.sse : cloneJson(defaults.sse),
    worker: overrides && Object.prototype.hasOwnProperty.call(overrides, 'worker') ? overrides.worker : cloneJson(defaults.worker),
    ssr: overrides && Object.prototype.hasOwnProperty.call(overrides, 'ssr') ? overrides.ssr : cloneJson(defaults.ssr),
    hydration: overrides && Object.prototype.hasOwnProperty.call(overrides, 'hydration') ? overrides.hydration : cloneJson(defaults.hydration)
  };
}

function inferSecurityRequired(operation, dataSource, catalogRecord, posture) {
  if (posture && posture.required && (posture.required.trustBoundary || (posture.required.sanitizeFormats || []).length > 0)) {
    return true;
  }
  if (isStreamOperation(operation)) return true;
  if (!dataSource) return false;
  if (dataSource.kind === 'sse' || dataSource.kind === 'worker') return true;
  if (catalogRecord && (catalogRecord.unsafe || catalogRecord.requiresTrustBoundary || catalogRecord.requiresSanitize.length > 0)) {
    return true;
  }
  return false;
}

function createSecuritySnapshot(posture, required) {
  if (!posture) {
    return {
      required: required === true,
      visible: false,
      status: required ? 'missing' : 'not-required',
      trustBoundaryRefs: [],
      boundaryIds: [],
      sanitizeRefs: [],
      sanitizeFormats: [],
      csp: [],
      isolation: [],
      sandbox: [],
      escaping: {
        required: false,
        formats: []
      }
    };
  }

  return {
    required: required === true,
    visible: true,
    status: posture.status,
    trustBoundaryRefs: Array.isArray(posture.trustBoundaryRefs) ? posture.trustBoundaryRefs.slice() : [],
    boundaryIds: Array.isArray(posture.boundaryIds) ? posture.boundaryIds.slice() : [],
    sanitizeRefs: Array.isArray(posture.sanitizeRefs) ? posture.sanitizeRefs.slice() : [],
    sanitizeFormats: Array.isArray(posture.sanitizeFormats) ? posture.sanitizeFormats.slice() : [],
    csp: cloneJson(posture.csp || []),
    isolation: cloneJson(posture.isolation || []),
    sandbox: cloneJson(posture.sandbox || []),
    escaping: cloneJson(posture.escaping || { required: false, formats: [] })
  };
}

function createStreamingRecord(coreDocument, operation, context) {
  const diagnostics = [];
  const sourceRef = operation && operation.source && operation.source.ref || null;
  const dataSource = sourceRef ? context.dataSourceIndex.get(sourceRef) : null;
  const catalogRecord = dataSource && dataSource.target ? context.dataSourceCatalog.byTarget.get(dataSource.target) : null;
  const laneId = operation && operation.scope && operation.scope.lane || null;
  const lanePolicy = laneId ? context.schedulerIndexes.byLaneId.get(laneId) : context.schedulerIndexes.byOperationId.get(operation && operation.id);
  const variant = classifyStreamVariant(operation, dataSource);
  const capability = variant ? STREAM_VARIANT_CAPABILITIES[variant] : null;
  const scheduler = lanePolicy ? {
    laneId: lanePolicy.laneId,
    schedulerLane: lanePolicy.schedulerLane,
    budget: cloneJson(lanePolicy.budget),
    status: lanePolicy.status
  } : null;
  const chunking = createChunkMetadata(operation, variant, lanePolicy);
  const backpressure = createBackpressureMetadata(lanePolicy);
  const completion = variant ? context.completionSignals[variant] : null;
  const errorPath = variant ? context.errorPaths[variant] : null;
  const posture = context.securityIndex.get(operation && operation.id);
  const securityRequired = inferSecurityRequired(operation, dataSource, catalogRecord, posture);
  const security = createSecuritySnapshot(posture, securityRequired);

  if (isStreamOperation(operation) && !sourceRef) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_SOURCE_MISSING_CODE,
      `Stream operation "${operation && operation.id || 'unknown'}" requires a source clause.`
    ));
  }

  if (sourceRef && !dataSource) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_DATA_SOURCE_MISSING_CODE,
      `Operation "${operation && operation.id || 'unknown'}" references missing data source "${sourceRef}".`,
      'error',
      { dataSourceRef: sourceRef }
    ));
  }

  if (dataSource && !DATA_SOURCE_KINDS.includes(dataSource.kind)) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_DATA_SOURCE_KIND_UNSUPPORTED_CODE,
      `Data source kind "${dataSource.kind || 'unknown'}" is not stream-capable.`,
      'error',
      { dataSourceKind: dataSource.kind }
    ));
  }

  if (!lanePolicy) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_SCHEDULER_MISSING_CODE,
      `Operation "${operation && operation.id || 'unknown'}" is not mapped to a scheduler lane.`,
      'error',
      { laneId }
    ));
  }

  if (!chunking || !backpressure) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_BACKPRESSURE_MISSING_CODE,
      `Operation "${operation && operation.id || 'unknown'}" needs visible chunking and backpressure metadata.`
    ));
  }

  if (securityRequired && (!posture || posture.status !== 'ready')) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_SECURITY_MISSING_CODE,
      `Operation "${operation && operation.id || 'unknown'}" needs a ready security posture for streaming.`,
      'error',
      { securityStatus: posture && posture.status || 'missing' }
    ));
  }

  if (variant && !completion) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_COMPLETION_MISSING_CODE,
      `Streaming variant "${variant}" needs a completion signal.`
    ));
  }

  if (variant && !errorPath) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_ERROR_PATH_MISSING_CODE,
      `Streaming variant "${variant}" needs an error path.`
    ));
  }

  if (capability && !context.capabilities.includes(capability)) {
    diagnostics.push(createStreamingDiagnostic(
      coreDocument,
      operation,
      STREAM_CAPABILITY_MISSING_CODE,
      `Streaming capability "${capability}" is not available to the host-neutral runtime probe.`,
      'error',
      { capability }
    ));
  }

  return {
    schema: RMT_VNEXT_STREAM_OPERATION_SCHEMA,
    operationId: operation && operation.id || null,
    operationKind: operation && operation.kind || null,
    op: operation && operation.op || null,
    target: operation && operation.target && operation.target.ref || null,
    sourceRef,
    variant,
    capability,
    scheduler,
    dataSource: dataSource ? {
      id: dataSource.id,
      kind: dataSource.kind,
      target: dataSource.target,
      capability: DATA_SOURCE_KIND_CAPABILITIES[dataSource.kind] || null,
      catalog: catalogRecord ? {
        id: catalogRecord.id,
        unsafe: catalogRecord.unsafe,
        format: catalogRecord.format,
        requiresTrustBoundary: catalogRecord.requiresTrustBoundary,
        requiresSanitize: catalogRecord.requiresSanitize.slice()
      } : null
    } : null,
    chunking,
    backpressure,
    completion: completion ? cloneJson(completion) : null,
    errorPath: errorPath ? cloneJson(errorPath) : null,
    security,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function createHostNeutralRuntimeProbe(contract, options) {
  const probeOptions = options && options.runtimeProbe && typeof options.runtimeProbe === 'object' ? options.runtimeProbe : {};
  const hostCoupled = probeOptions.hostCoupled === true;
  const domRequired = probeOptions.domRequired === true;
  const operations = (Array.isArray(contract && contract.streams) ? contract.streams : []).map((record) => ({
    operationId: record.operationId,
    variant: record.variant,
    capability: record.capability,
    schedulerLane: record.scheduler && record.scheduler.schedulerLane || null,
    chunkingVisible: !!record.chunking,
    backpressureVisible: !!record.backpressure,
    completionVisible: !!record.completion,
    errorPathVisible: !!record.errorPath,
    securityVisible: !!(record.security && record.security.visible),
    status: record.status
  }));
  const diagnostics = [];
  if (hostCoupled || domRequired) {
    diagnostics.push({
      code: STREAM_RUNTIME_PROBE_HOST_COUPLED_CODE,
      severity: 'error',
      message: 'Streaming runtime probe must stay host-neutral and DOM-independent.',
      sourceRef: null,
      operationId: null,
      details: {
        hostCoupled,
        domRequired
      }
    });
  }

  return {
    schema: RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA,
    hostCoupled,
    domRequired,
    ok: diagnostics.length === 0 && operations.every((operation) => operation.status === 'ready'),
    operationCount: operations.length,
    operations,
    diagnostics
  };
}

function createStreamingContract(coreDocument, options) {
  const effectiveOptions = options || {};
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  const dataSources = Array.isArray(coreDocument && coreDocument.dataSources) ? coreDocument.dataSources : [];
  const schedulerPolicy = effectiveOptions.schedulerPolicy || createSchedulerPolicy(coreDocument || {}, effectiveOptions.scheduler || {});
  const securityContract = effectiveOptions.securityContract || createSecurityPolicyContract(coreDocument || {}, {
    dataSources: effectiveOptions.dataSources || [],
    trustBoundaries: effectiveOptions.trustBoundaries || undefined
  });
  const recordsContext = {
    dataSourceIndex: createIndex(dataSources),
    dataSourceCatalog: normalizeDataSourceCatalog(effectiveOptions.dataSources || []),
    schedulerIndexes: createSchedulerIndexes(schedulerPolicy),
    securityIndex: createSecurityIndex(securityContract),
    completionSignals: mergeVariantMap(DEFAULT_COMPLETION_SIGNALS, effectiveOptions.completionSignals),
    errorPaths: mergeVariantMap(DEFAULT_ERROR_PATHS, effectiveOptions.errorPaths),
    capabilities: effectiveOptions.capabilities
      ? effectiveOptions.capabilities.slice()
      : Object.keys(STREAM_VARIANT_CAPABILITIES).map((key) => STREAM_VARIANT_CAPABILITIES[key])
  };
  const streams = operations
    .filter(isStreamingCandidate)
    .map((operation) => createStreamingRecord(coreDocument, operation, recordsContext));
  const diagnostics = streams
    .flatMap((record) => record.diagnostics)
    .concat((schedulerPolicy.diagnostics || []).filter((diagnostic) => diagnostic.severity === 'error'))
    .concat((securityContract.diagnostics || []).filter((diagnostic) => diagnostic.severity === 'error' && streams.some((record) => record.operationId === diagnostic.operationId)));
  const variantCounts = streams.reduce((counts, record) => {
    if (record.variant) counts[record.variant] = (counts[record.variant] || 0) + 1;
    return counts;
  }, {});
  const contract = {
    schema: RMT_VNEXT_STREAMING_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    schedulerSchema: schedulerPolicy.schema || RMT_VNEXT_SCHEDULER_SCHEMA,
    securityPolicySchema: securityContract.schema || RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    workpackage: RMT_VNEXT_STREAMING_WORKPACKAGE,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    ok: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
    operationCount: operations.length,
    streamOperationCount: streams.filter((record) => record.operationKind === 'stream').length,
    hydrationOperationCount: streams.filter((record) => record.variant === 'hydration').length,
    streamRecordCount: streams.length,
    variants: Object.keys(variantCounts).sort(),
    variantCounts,
    requiredCapabilities: uniqueList(streams.map((record) => record.capability)),
    capabilities: recordsContext.capabilities.slice(),
    schedulerPolicy: {
      schema: schedulerPolicy.schema,
      status: schedulerPolicy.status,
      laneCount: schedulerPolicy.laneCount
    },
    securityPolicy: {
      schema: securityContract.schema,
      status: securityContract.status,
      unsafeFlowCount: securityContract.unsafeFlowCount
    },
    streams,
    diagnostics
  };
  const runtimeProbe = createHostNeutralRuntimeProbe(contract, effectiveOptions);
  contract.runtimeProbe = runtimeProbe;
  contract.diagnostics = diagnostics.concat(runtimeProbe.diagnostics);
  contract.status = contract.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  contract.ok = contract.status !== 'blocked' && runtimeProbe.ok === true;
  return contract;
}

function serializeStreamingContract(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

function createRmtVNextStreamingContract(defaultOptions) {
  const effectiveDefaultOptions = defaultOptions || {};
  return Object.freeze({
    schema: RMT_VNEXT_STREAMING_SCHEMA,
    streamOperationSchema: RMT_VNEXT_STREAM_OPERATION_SCHEMA,
    runtimeProbeSchema: RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    schedulerSchema: RMT_VNEXT_SCHEDULER_SCHEMA,
    securityPolicySchema: RMT_VNEXT_SECURITY_POLICY_SCHEMA,
    workpackage: RMT_VNEXT_STREAMING_WORKPACKAGE,
    variants: Object.keys(STREAM_VARIANT_CAPABILITIES),
    capabilities: cloneJson(STREAM_VARIANT_CAPABILITIES),
    completionSignals: cloneJson(DEFAULT_COMPLETION_SIGNALS),
    errorPaths: cloneJson(DEFAULT_ERROR_PATHS),
    createContract: (coreDocument, options = {}) => createStreamingContract(coreDocument, {
      ...effectiveDefaultOptions,
      ...options
    }),
    createRuntimeProbe: createHostNeutralRuntimeProbe,
    serializeContract: serializeStreamingContract
  });
}

module.exports = {
  DEFAULT_COMPLETION_SIGNALS,
  DEFAULT_ERROR_PATHS,
  RMT_VNEXT_STREAMING_MODULE_PATH,
  RMT_VNEXT_STREAMING_PACKAGE_SCRIPT,
  RMT_VNEXT_STREAMING_REPORT_SCHEMA,
  RMT_VNEXT_STREAMING_SCHEMA,
  RMT_VNEXT_STREAMING_SUITE_PATH,
  RMT_VNEXT_STREAMING_WORKPACKAGE,
  RMT_VNEXT_STREAM_OPERATION_SCHEMA,
  RMT_VNEXT_STREAM_RUNTIME_PROBE_SCHEMA,
  STREAM_BACKPRESSURE_MISSING_CODE,
  STREAM_CAPABILITY_MISSING_CODE,
  STREAM_COMPLETION_MISSING_CODE,
  STREAM_DATA_SOURCE_KIND_UNSUPPORTED_CODE,
  STREAM_DATA_SOURCE_MISSING_CODE,
  STREAM_ERROR_PATH_MISSING_CODE,
  STREAM_RUNTIME_PROBE_HOST_COUPLED_CODE,
  STREAM_SCHEDULER_MISSING_CODE,
  STREAM_SECURITY_MISSING_CODE,
  STREAM_SOURCE_MISSING_CODE,
  STREAM_VARIANT_CAPABILITIES,
  createHostNeutralRuntimeProbe,
  createRmtVNextStreamingContract,
  createStreamingContract,
  serializeStreamingContract
};

const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_LIFECYCLE_SCHEMA = 'xtend.rmt.vnext-lifecycle.v1';
const RMT_VNEXT_LIFECYCLE_OPERATION_SCHEMA = 'xtend.rmt.vnext-lifecycle-operation.v1';
const RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA = 'xtend.rmt.vnext-lifecycle-result.v1';
const RMT_VNEXT_LIFECYCLE_REPORT_SCHEMA = 'xtend.rmt.vnext-lifecycle-report.v1';
const RMT_VNEXT_LIFECYCLE_WORKPACKAGE = 'WP-E15-06';
const RMT_VNEXT_LIFECYCLE_MODULE_PATH = 'tools/rmt-language/vnext-lifecycle.js';
const RMT_VNEXT_LIFECYCLE_SUITE_PATH = 'tests/rmt-language/rmt_vnext_lifecycle_suite.js';
const RMT_VNEXT_LIFECYCLE_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-lifecycle';

const LIFECYCLE_OPERATION_UNSUPPORTED_CODE = 'rmt.vnext.lifecycle.operation.unsupported';
const LIFECYCLE_TARGET_MISSING_CODE = 'rmt.vnext.lifecycle.target.missing';
const LIFECYCLE_TARGET_UNSUPPORTED_CODE = 'rmt.vnext.lifecycle.target.unsupported';
const LIFECYCLE_ADAPTER_MISSING_CODE = 'rmt.vnext.lifecycle.adapter.missing';
const LIFECYCLE_CAPABILITY_MISSING_CODE = 'rmt.vnext.lifecycle.capability.missing';

const RESULT_STATUS_VALUES = Object.freeze(['ok', 'skipped', 'failed', 'degraded']);
const TARGET_TYPE_VALUES = Object.freeze(['ref']);

const LIFECYCLE_OPERATION_MATRIX = Object.freeze({
  mount: Object.freeze({
    op: 'mount',
    phase: 'attach',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.mount',
    idempotency: 'idempotent-by-target-phase',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  hydrate: Object.freeze({
    op: 'hydrate',
    phase: 'interactive',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.hydrate',
    idempotency: 'idempotent-by-target-version',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  suspend: Object.freeze({
    op: 'suspend',
    phase: 'quiesce',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.suspend',
    idempotency: 'idempotent-by-target-phase',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  resume: Object.freeze({
    op: 'resume',
    phase: 'interactive',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.resume',
    idempotency: 'idempotent-by-target-phase',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  invalidate: Object.freeze({
    op: 'invalidate',
    phase: 'refresh',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.invalidate',
    idempotency: 'coalesced-by-target',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  dispose: Object.freeze({
    op: 'dispose',
    phase: 'release',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.dispose',
    idempotency: 'terminal-idempotent',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  prewarm: Object.freeze({
    op: 'prewarm',
    phase: 'prepare',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.prewarm',
    idempotency: 'cache-key-idempotent',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  recycle: Object.freeze({
    op: 'recycle',
    phase: 'reuse',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.recycle',
    idempotency: 'pool-key-idempotent',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  detach: Object.freeze({
    op: 'detach',
    phase: 'detach',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.detach',
    idempotency: 'idempotent-by-target-phase',
    resultStatusValues: RESULT_STATUS_VALUES
  }),
  reattach: Object.freeze({
    op: 'reattach',
    phase: 'attach',
    targetTypes: TARGET_TYPE_VALUES,
    requiredCapability: 'lifecycle.reattach',
    idempotency: 'idempotent-by-target-phase',
    resultStatusValues: RESULT_STATUS_VALUES
  })
});

function listLifecycleOperations() {
  return Object.keys(LIFECYCLE_OPERATION_MATRIX);
}

function cloneRange(range = {}) {
  return {
    start: {
      line: range.start && Number.isInteger(range.start.line) ? range.start.line : 0,
      character: range.start && Number.isInteger(range.start.character) ? range.start.character : 0
    },
    end: {
      line: range.end && Number.isInteger(range.end.line) ? range.end.line : 0,
      character: range.end && Number.isInteger(range.end.character) ? range.end.character : 0
    },
    startOffset: Number.isInteger(range.startOffset) ? range.startOffset : 0,
    endOffset: Number.isInteger(range.endOffset) ? range.endOffset : 0
  };
}

function cloneTarget(target) {
  if (!target || typeof target !== 'object') {
    return null;
  }

  return {
    kind: target.kind,
    ref: target.ref
  };
}

function normalizeProvidedCapabilities(adapter = {}) {
  if (Array.isArray(adapter.providedCapabilities)) {
    return adapter.providedCapabilities.filter(Boolean).map(String);
  }

  if (adapter.capabilities && Array.isArray(adapter.capabilities.providedCapabilities)) {
    return adapter.capabilities.providedCapabilities.filter(Boolean).map(String);
  }

  if (Array.isArray(adapter.capabilities)) {
    return adapter.capabilities.filter(Boolean).map(String);
  }

  return [];
}

function createLifecycleAdapterStub(definition = {}) {
  const id = definition.id || definition.adapterId || 'rmt.vnext.lifecycle.adapter';
  const providedCapabilities = normalizeProvidedCapabilities(definition);

  return Object.freeze({
    schema: 'xtend.rmt.vnext-lifecycle-adapter-stub.v1',
    id,
    hostNeutral: true,
    providedCapabilities: Object.freeze(providedCapabilities.slice()),
    capabilities: Object.freeze({
      providedCapabilities: Object.freeze(providedCapabilities.slice())
    })
  });
}

function normalizeAdapterStubs(adapters = []) {
  const list = Array.isArray(adapters) ? adapters : Object.values(adapters || {});
  return list.map(createLifecycleAdapterStub);
}

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createLifecycleDiagnostic(coreDocument, operation, code, message, severity = 'error') {
  const sourceEntry = findSourceEntry(coreDocument, operation && operation.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_LIFECYCLE_SCHEMA,
    workpackage: RMT_VNEXT_LIFECYCLE_WORKPACKAGE,
    severity,
    code,
    message,
    operationId: operation && operation.id ? operation.id : null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: operation && operation.sourceRef ? operation.sourceRef : null,
    range: cloneRange(sourceEntry && sourceEntry.range)
  };
}

function validateLifecycleTarget(coreDocument, operation) {
  const target = operation && operation.target;
  if (!target || typeof target !== 'object' || !target.kind || !target.ref) {
    return {
      target: null,
      diagnostic: createLifecycleDiagnostic(
        coreDocument,
        operation,
        LIFECYCLE_TARGET_MISSING_CODE,
        `Lifecycle operation "${operation && operation.op ? operation.op : 'unknown'}" needs a declarative ref target.`
      )
    };
  }

  if (!TARGET_TYPE_VALUES.includes(target.kind)) {
    return {
      target: cloneTarget(target),
      diagnostic: createLifecycleDiagnostic(
        coreDocument,
        operation,
        LIFECYCLE_TARGET_UNSUPPORTED_CODE,
        `Lifecycle target kind "${target.kind}" is not supported by ${RMT_VNEXT_LIFECYCLE_SCHEMA}.`
      )
    };
  }

  return {
    target: cloneTarget(target),
    diagnostic: null
  };
}

function findAdaptersForCapability(adapters, requiredCapability) {
  return adapters.filter((adapter) => {
    const provided = normalizeProvidedCapabilities(adapter);
    return provided.includes(requiredCapability);
  });
}

function createIdempotencyKey(operation, matrixEntry, target) {
  const lane = operation && operation.scope && operation.scope.lane ? operation.scope.lane : 'lane:unknown';
  const targetRef = target && target.ref ? target.ref : 'target:missing';
  return `${matrixEntry.op}:${matrixEntry.phase}:${lane}:${targetRef}`;
}

function createLifecycleResultContract(plan) {
  return {
    schema: RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA,
    operationId: plan.operationId,
    op: plan.op,
    phase: plan.phase,
    statusValues: RESULT_STATUS_VALUES.slice(),
    requiredFields: [
      'schema',
      'ok',
      'status',
      'operationId',
      'op',
      'phase',
      'target',
      'adapterId',
      'idempotencyKey',
      'diagnostics'
    ]
  };
}

function createLifecycleOperationPlan(coreDocument, options = {}) {
  const adapters = normalizeAdapterStubs(options.adapters || []);
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  const lifecycleOperations = operations.filter((operation) => operation && operation.kind === 'lifecycle');
  const planOperations = [];
  const diagnostics = [];

  lifecycleOperations.forEach((operation, index) => {
    const op = operation.op;
    const matrixEntry = LIFECYCLE_OPERATION_MATRIX[op];
    const operationDiagnostics = [];
    const targetResult = validateLifecycleTarget(coreDocument, operation);
    const target = targetResult.target;

    if (targetResult.diagnostic) {
      operationDiagnostics.push(targetResult.diagnostic);
    }

    if (!matrixEntry) {
      operationDiagnostics.push(createLifecycleDiagnostic(
        coreDocument,
        operation,
        LIFECYCLE_OPERATION_UNSUPPORTED_CODE,
        `Lifecycle operation "${op || 'unknown'}" is not part of the vNext operation contract.`
      ));
    }

    const requiredCapability = matrixEntry ? matrixEntry.requiredCapability : null;
    const adapterCandidates = requiredCapability
      ? findAdaptersForCapability(adapters, requiredCapability)
      : [];

    if (matrixEntry && adapters.length === 0) {
      operationDiagnostics.push(createLifecycleDiagnostic(
        coreDocument,
        operation,
        LIFECYCLE_ADAPTER_MISSING_CODE,
        `No host-neutral adapter stub was provided for lifecycle operation "${op}".`
      ));
    } else if (matrixEntry && adapterCandidates.length === 0) {
      operationDiagnostics.push(createLifecycleDiagnostic(
        coreDocument,
        operation,
        LIFECYCLE_CAPABILITY_MISSING_CODE,
        `No adapter declares required capability "${requiredCapability}" for lifecycle operation "${op}".`
      ));
    }

    const phase = matrixEntry ? matrixEntry.phase : 'unknown';
    const plan = {
      schema: RMT_VNEXT_LIFECYCLE_OPERATION_SCHEMA,
      operationId: operation.id || `operation:${index}`,
      op: op || 'unknown',
      phase,
      target,
      scope: operation.scope ? { ...operation.scope } : {},
      sourceRef: operation.sourceRef || null,
      requiredCapability,
      adapterCandidates: adapterCandidates.map((adapter) => adapter.id),
      adapterId: adapterCandidates.length > 0 ? adapterCandidates[0].id : null,
      idempotency: {
        mode: matrixEntry ? matrixEntry.idempotency : 'unsupported',
        key: matrixEntry ? createIdempotencyKey(operation, matrixEntry, target) : null
      },
      resultContract: null,
      status: operationDiagnostics.length === 0 ? 'ready' : 'blocked',
      diagnostics: operationDiagnostics
    };

    plan.resultContract = createLifecycleResultContract(plan);
    planOperations.push(plan);
    diagnostics.push(...operationDiagnostics);
  });

  return {
    schema: RMT_VNEXT_LIFECYCLE_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_LIFECYCLE_WORKPACKAGE,
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    operationCount: planOperations.length,
    adapterCount: adapters.length,
    operationMatrix: listLifecycleOperations().map((op) => ({ ...LIFECYCLE_OPERATION_MATRIX[op] })),
    operations: planOperations,
    diagnostics
  };
}

function normalizeLifecycleOperationResult(plan, result = {}) {
  const requestedStatus = result.status || (result.ok === false ? 'failed' : 'ok');
  const status = RESULT_STATUS_VALUES.includes(requestedStatus) ? requestedStatus : 'failed';
  const diagnostics = Array.isArray(result.diagnostics) ? result.diagnostics.slice() : [];

  return {
    schema: RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA,
    ok: status === 'ok' || status === 'skipped',
    status,
    operationId: result.operationId || (plan && plan.operationId) || null,
    op: result.op || (plan && plan.op) || null,
    phase: result.phase || (plan && plan.phase) || null,
    target: result.target || (plan && plan.target) || null,
    adapterId: result.adapterId || (plan && plan.adapterId) || null,
    idempotencyKey: result.idempotencyKey || (plan && plan.idempotency && plan.idempotency.key) || null,
    diagnostics,
    metadata: result.metadata && typeof result.metadata === 'object' ? { ...result.metadata } : {}
  };
}

function createRmtVNextLifecycleContract(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_LIFECYCLE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_LIFECYCLE_WORKPACKAGE,
    operations: listLifecycleOperations(),
    matrix: LIFECYCLE_OPERATION_MATRIX,
    createAdapterStub: createLifecycleAdapterStub,
    createOperationPlan: (coreDocument, options = {}) => createLifecycleOperationPlan(coreDocument, {
      ...defaultOptions,
      ...options
    }),
    normalizeResult: normalizeLifecycleOperationResult
  });
}

module.exports = {
  LIFECYCLE_ADAPTER_MISSING_CODE,
  LIFECYCLE_CAPABILITY_MISSING_CODE,
  LIFECYCLE_OPERATION_MATRIX,
  LIFECYCLE_OPERATION_UNSUPPORTED_CODE,
  LIFECYCLE_TARGET_MISSING_CODE,
  LIFECYCLE_TARGET_UNSUPPORTED_CODE,
  RMT_VNEXT_LIFECYCLE_MODULE_PATH,
  RMT_VNEXT_LIFECYCLE_OPERATION_SCHEMA,
  RMT_VNEXT_LIFECYCLE_PACKAGE_SCRIPT,
  RMT_VNEXT_LIFECYCLE_REPORT_SCHEMA,
  RMT_VNEXT_LIFECYCLE_RESULT_SCHEMA,
  RMT_VNEXT_LIFECYCLE_SCHEMA,
  RMT_VNEXT_LIFECYCLE_SUITE_PATH,
  RMT_VNEXT_LIFECYCLE_WORKPACKAGE,
  createLifecycleAdapterStub,
  createLifecycleOperationPlan,
  createRmtVNextLifecycleContract,
  listLifecycleOperations,
  normalizeLifecycleOperationResult
};

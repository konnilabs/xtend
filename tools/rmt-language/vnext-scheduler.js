const {
  RMT_VNEXT_CORE_SCHEMA
} = require('./vnext-compiler');

const RMT_VNEXT_SCHEDULER_SCHEMA = 'xtend.rmt.vnext-scheduler-policy.v1';
const RMT_VNEXT_SCHEDULER_LANE_SCHEMA = 'xtend.rmt.vnext-scheduler-lane.v1';
const RMT_VNEXT_SCHEDULER_REPORT_SCHEMA = 'xtend.rmt.vnext-scheduler-report.v1';
const RMT_VNEXT_SCHEDULER_WORKPACKAGE = 'WP-E15-07';
const RMT_VNEXT_SCHEDULER_MODULE_PATH = 'tools/rmt-language/vnext-scheduler.js';
const RMT_VNEXT_SCHEDULER_SUITE_PATH = 'tests/rmt-language/rmt_vnext_scheduler_suite.js';
const RMT_VNEXT_SCHEDULER_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-scheduler';

const SCHEDULER_LANE_UNKNOWN_CODE = 'rmt.vnext.scheduler.lane.unknown';
const SCHEDULER_LANE_DUPLICATE_CODE = 'rmt.vnext.scheduler.lane.duplicate';
const SCHEDULER_WEIGHT_INVALID_CODE = 'rmt.vnext.scheduler.weight.invalid';
const SCHEDULER_WEIGHT_OUT_OF_RANGE_CODE = 'rmt.vnext.scheduler.weight.out_of_range';
const SCHEDULER_BUDGET_INVALID_CODE = 'rmt.vnext.scheduler.budget.invalid';
const SCHEDULER_OPERATION_REF_MISSING_CODE = 'rmt.vnext.scheduler.operation_ref.missing';
const SCHEDULER_OPERATION_LANE_MISMATCH_CODE = 'rmt.vnext.scheduler.operation_ref.lane_mismatch';

const CANONICAL_SCHEDULER_LANES = Object.freeze({
  'user-blocking': Object.freeze({
    schedulerLane: 'user-blocking',
    priority: 100,
    budgetClass: 'critical',
    deadlineMs: 80,
    maxChunkMs: 8,
    yieldAfterMs: 12,
    preferIdle: false,
    coalescePolicy: 'none',
    backpressure: 'shed-deferred-work',
    fabricLaneHint: 'user-blocking'
  }),
  visible: Object.freeze({
    schedulerLane: 'visible',
    priority: 80,
    budgetClass: 'interactive',
    deadlineMs: 160,
    maxChunkMs: 12,
    yieldAfterMs: 20,
    preferIdle: false,
    coalescePolicy: 'scope',
    backpressure: 'coalesce-by-scope',
    fabricLaneHint: 'visible'
  }),
  transition: Object.freeze({
    schedulerLane: 'transition',
    priority: 65,
    budgetClass: 'interactive',
    deadlineMs: 240,
    maxChunkMs: 16,
    yieldAfterMs: 32,
    preferIdle: false,
    coalescePolicy: 'route-or-scope',
    backpressure: 'coalesce-by-route',
    fabricLaneHint: 'transition'
  }),
  idle: Object.freeze({
    schedulerLane: 'idle',
    priority: 35,
    budgetClass: 'background',
    deadlineMs: 500,
    maxChunkMs: 24,
    yieldAfterMs: 48,
    preferIdle: true,
    coalescePolicy: 'coalesce',
    backpressure: 'pause-until-idle',
    fabricLaneHint: 'idle'
  }),
  background: Object.freeze({
    schedulerLane: 'background',
    priority: 25,
    budgetClass: 'best_effort',
    deadlineMs: 1000,
    maxChunkMs: 32,
    yieldAfterMs: 64,
    preferIdle: true,
    coalescePolicy: 'coalesce',
    backpressure: 'drop-stale',
    fabricLaneHint: 'background'
  }),
  diagnostics: Object.freeze({
    schedulerLane: 'diagnostics',
    priority: 20,
    budgetClass: 'diagnostics',
    deadlineMs: 750,
    maxChunkMs: 16,
    yieldAfterMs: 64,
    preferIdle: true,
    coalescePolicy: 'coalesce',
    backpressure: 'sample',
    fabricLaneHint: 'diagnostics'
  })
});

const LANE_ALIASES = Object.freeze({
  critical: 'user-blocking',
  urgent: 'user-blocking',
  input: 'user-blocking',
  interactive: 'visible',
  normal: 'visible',
  default: 'visible',
  visible: 'visible',
  transition: 'transition',
  route: 'transition',
  idle: 'idle',
  deferred: 'idle',
  background: 'background',
  bg: 'background',
  diagnostics: 'diagnostics',
  telemetry: 'diagnostics',
  debug: 'diagnostics'
});

function listSchedulerLanes() {
  return Object.keys(CANONICAL_SCHEDULER_LANES);
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

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createSchedulerDiagnostic(coreDocument, lane, code, message, severity = 'error', metadata = {}) {
  const sourceEntry = findSourceEntry(coreDocument, lane && lane.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_SCHEDULER_SCHEMA,
    workpackage: RMT_VNEXT_SCHEDULER_WORKPACKAGE,
    severity,
    code,
    message,
    laneId: lane && lane.id ? lane.id : null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: lane && lane.sourceRef ? lane.sourceRef : null,
    range: cloneRange(sourceEntry && sourceEntry.range),
    metadata
  };
}

function normalizeLaneName(name) {
  const raw = String(name || '').trim();
  const key = raw.toLowerCase();
  const schedulerLane = LANE_ALIASES[key] || CANONICAL_SCHEDULER_LANES[key] && key;

  if (schedulerLane && CANONICAL_SCHEDULER_LANES[schedulerLane]) {
    return {
      rawName: raw,
      schedulerLane,
      known: true,
      alias: key !== schedulerLane
    };
  }

  return {
    rawName: raw || 'unnamed',
    schedulerLane: 'visible',
    known: false,
    alias: false
  };
}

function normalizeWeight(lane, profile) {
  if (lane.weight === null || lane.weight === undefined) {
    return {
      weight: null,
      priority: profile.priority,
      diagnostics: []
    };
  }

  const value = Number(lane.weight);
  if (!Number.isFinite(value)) {
    return {
      weight: lane.weight,
      priority: profile.priority,
      diagnostics: [{
        code: SCHEDULER_WEIGHT_INVALID_CODE,
        severity: 'warning',
        message: `Lane "${lane.name || lane.id}" has a non-numeric weight; using ${profile.priority}.`
      }]
    };
  }

  if (value < 0 || value > 100) {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    return {
      weight: clamped,
      priority: clamped,
      diagnostics: [{
        code: SCHEDULER_WEIGHT_OUT_OF_RANGE_CODE,
        severity: 'warning',
        message: `Lane "${lane.name || lane.id}" weight ${value} is outside 0..100 and was clamped to ${clamped}.`
      }]
    };
  }

  const normalized = Math.round(value);
  return {
    weight: normalized,
    priority: normalized,
    diagnostics: []
  };
}

function readExplicitBudgetMs(lane) {
  if (lane.deadlineMs !== null && lane.deadlineMs !== undefined) return lane.deadlineMs;
  if (lane.budgetMs !== null && lane.budgetMs !== undefined) return lane.budgetMs;
  if (lane.schedule && lane.schedule.deadlineMs !== null && lane.schedule.deadlineMs !== undefined) return lane.schedule.deadlineMs;
  if (lane.budget && lane.budget.deadlineMs !== null && lane.budget.deadlineMs !== undefined) return lane.budget.deadlineMs;
  return null;
}

function normalizeBudget(lane, profile) {
  const explicitBudget = readExplicitBudgetMs(lane);
  if (explicitBudget === null) {
    return {
      budget: {
        class: profile.budgetClass,
        deadlineMs: profile.deadlineMs
      },
      diagnostics: []
    };
  }

  const deadlineMs = Number(explicitBudget);
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0) {
    return {
      budget: {
        class: profile.budgetClass,
        deadlineMs: profile.deadlineMs
      },
      diagnostics: [{
        code: SCHEDULER_BUDGET_INVALID_CODE,
        severity: 'warning',
        message: `Lane "${lane.name || lane.id}" has invalid deadlineMs; using ${profile.deadlineMs}.`
      }]
    };
  }

  return {
    budget: {
      class: profile.budgetClass,
      deadlineMs: Math.round(deadlineMs)
    },
    diagnostics: []
  };
}

function createChunking(profile) {
  return {
    strategy: profile.preferIdle ? 'idle-cooperative' : 'cooperative',
    maxChunkMs: profile.maxChunkMs,
    yieldAfterMs: profile.yieldAfterMs,
    preferIdle: profile.preferIdle
  };
}

function createBackpressure(profile, laneId) {
  return {
    signal: `rmt.vnext.backpressure.${profile.schedulerLane}`,
    behavior: profile.backpressure,
    coalescePolicy: profile.coalescePolicy,
    coalesceKey: `rmt.vnext.scheduler.${profile.schedulerLane}.${laneId}`
  };
}

function createOperationIndex(coreDocument) {
  const index = new Map();
  const operations = Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations : [];
  operations.forEach((operation) => {
    if (operation && operation.id) index.set(operation.id, operation);
  });
  return index;
}

function validateOperationRefs(coreDocument, lane, operationIndex) {
  const diagnostics = [];
  const operationRefs = Array.isArray(lane.operationRefs) ? lane.operationRefs : [];
  operationRefs.forEach((operationRef) => {
    const operation = operationIndex.get(operationRef);
    if (!operation) {
      diagnostics.push(createSchedulerDiagnostic(
        coreDocument,
        lane,
        SCHEDULER_OPERATION_REF_MISSING_CODE,
        `Lane "${lane.id}" references missing operation "${operationRef}".`
      ));
      return;
    }

    const operationLane = operation.scope && operation.scope.lane;
    if (operationLane && operationLane !== lane.id) {
      diagnostics.push(createSchedulerDiagnostic(
        coreDocument,
        lane,
        SCHEDULER_OPERATION_LANE_MISMATCH_CODE,
        `Operation "${operationRef}" points to lane "${operationLane}" but is scheduled through "${lane.id}".`
      ));
    }
  });
  return diagnostics;
}

function createSchedulerLane(coreDocument, lane, operationIndex) {
  const nameResult = normalizeLaneName(lane.name);
  const profile = CANONICAL_SCHEDULER_LANES[nameResult.schedulerLane];
  const weightResult = normalizeWeight(lane, profile);
  const budgetResult = normalizeBudget(lane, profile);
  const diagnostics = [];

  if (!nameResult.known) {
    diagnostics.push(createSchedulerDiagnostic(
      coreDocument,
      lane,
      SCHEDULER_LANE_UNKNOWN_CODE,
      `Lane "${nameResult.rawName}" is not a known scheduler lane; using visible scheduling semantics.`,
      'warning',
      { fallbackSchedulerLane: 'visible' }
    ));
  }

  weightResult.diagnostics.forEach((diagnostic) => {
    diagnostics.push(createSchedulerDiagnostic(coreDocument, lane, diagnostic.code, diagnostic.message, diagnostic.severity));
  });
  budgetResult.diagnostics.forEach((diagnostic) => {
    diagnostics.push(createSchedulerDiagnostic(coreDocument, lane, diagnostic.code, diagnostic.message, diagnostic.severity));
  });
  diagnostics.push(...validateOperationRefs(coreDocument, lane, operationIndex));

  return {
    schema: RMT_VNEXT_SCHEDULER_LANE_SCHEMA,
    laneId: lane.id,
    name: lane.name || null,
    schedulerLane: nameResult.schedulerLane,
    alias: nameResult.alias,
    sourceRef: lane.sourceRef || null,
    scope: lane.scope ? { ...lane.scope } : {},
    operationRefs: Array.isArray(lane.operationRefs) ? lane.operationRefs.slice() : [],
    operationCount: Array.isArray(lane.operationRefs) ? lane.operationRefs.length : 0,
    weight: weightResult.weight,
    priority: weightResult.priority,
    budget: budgetResult.budget,
    chunking: createChunking(profile),
    backpressure: createBackpressure(profile, lane.id || nameResult.schedulerLane),
    mapping: {
      fabricLaneHint: profile.fabricLaneHint,
      schedulerLane: nameResult.schedulerLane,
      budgetClass: profile.budgetClass
    },
    status: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready',
    diagnostics
  };
}

function detectDuplicateLaneIds(coreDocument, lanes) {
  const diagnostics = [];
  const seen = new Map();
  lanes.forEach((lane) => {
    if (!lane || !lane.id) return;
    if (seen.has(lane.id)) {
      diagnostics.push(createSchedulerDiagnostic(
        coreDocument,
        lane,
        SCHEDULER_LANE_DUPLICATE_CODE,
        `Lane id "${lane.id}" is duplicated in the vNext Core document.`
      ));
    } else {
      seen.set(lane.id, lane);
    }
  });
  return diagnostics;
}

function createSchedulerPolicy(coreDocument, options = {}) {
  const lanes = Array.isArray(coreDocument && coreDocument.lanes) ? coreDocument.lanes : [];
  const operationIndex = createOperationIndex(coreDocument);
  const lanePolicies = lanes.map((lane) => createSchedulerLane(coreDocument, lane, operationIndex));
  const duplicateDiagnostics = detectDuplicateLaneIds(coreDocument, lanes);
  const diagnostics = lanePolicies.flatMap((lane) => lane.diagnostics).concat(duplicateDiagnostics);
  const sortedSchedule = lanePolicies
    .slice()
    .sort((left, right) => {
      if (right.priority !== left.priority) return right.priority - left.priority;
      return String(left.laneId).localeCompare(String(right.laneId));
    })
    .map((lane, index) => ({
      order: index,
      laneId: lane.laneId,
      schedulerLane: lane.schedulerLane,
      priority: lane.priority,
      operationRefs: lane.operationRefs.slice()
    }));
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_SCHEDULER_SCHEMA,
    coreSchema: coreDocument && coreDocument.schema ? coreDocument.schema : RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SCHEDULER_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    policyId: options.policyId || `scheduler:${coreDocument && coreDocument.manifest && coreDocument.manifest.documentId || 'rmt.vnext.document'}`,
    laneCount: lanePolicies.length,
    operationCount: Array.isArray(coreDocument && coreDocument.operations) ? coreDocument.operations.length : 0,
    canonicalLanes: listSchedulerLanes(),
    lanes: lanePolicies,
    schedule: sortedSchedule,
    diagnostics
  };
}

function serializeSchedulerPolicy(policy) {
  return `${JSON.stringify(policy, null, 2)}\n`;
}

function createRmtVNextScheduler(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_SCHEDULER_SCHEMA,
    laneSchema: RMT_VNEXT_SCHEDULER_LANE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_SCHEDULER_WORKPACKAGE,
    canonicalLanes: CANONICAL_SCHEDULER_LANES,
    aliases: LANE_ALIASES,
    createPolicy: (coreDocument, options = {}) => createSchedulerPolicy(coreDocument, {
      ...defaultOptions,
      ...options
    }),
    serializePolicy: serializeSchedulerPolicy
  });
}

module.exports = {
  CANONICAL_SCHEDULER_LANES,
  LANE_ALIASES,
  RMT_VNEXT_SCHEDULER_LANE_SCHEMA,
  RMT_VNEXT_SCHEDULER_MODULE_PATH,
  RMT_VNEXT_SCHEDULER_PACKAGE_SCRIPT,
  RMT_VNEXT_SCHEDULER_REPORT_SCHEMA,
  RMT_VNEXT_SCHEDULER_SCHEMA,
  RMT_VNEXT_SCHEDULER_SUITE_PATH,
  RMT_VNEXT_SCHEDULER_WORKPACKAGE,
  SCHEDULER_BUDGET_INVALID_CODE,
  SCHEDULER_LANE_DUPLICATE_CODE,
  SCHEDULER_LANE_UNKNOWN_CODE,
  SCHEDULER_OPERATION_LANE_MISMATCH_CODE,
  SCHEDULER_OPERATION_REF_MISSING_CODE,
  SCHEDULER_WEIGHT_INVALID_CODE,
  SCHEDULER_WEIGHT_OUT_OF_RANGE_CODE,
  createRmtVNextScheduler,
  createSchedulerPolicy,
  listSchedulerLanes,
  normalizeLaneName,
  serializeSchedulerPolicy
};

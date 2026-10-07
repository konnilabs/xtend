'use strict';

const RMT_VNEXT_SCHEDULER_SCHEMA = 'xtend.rmt.vnext-scheduler-policy.v1';

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

module.exports = { CANONICAL_SCHEDULER_LANES, LANE_ALIASES, RMT_VNEXT_SCHEDULER_SCHEMA, normalizeLaneName };

#!/usr/bin/env node

const path = require('path');
const {
  createMaracaBuildPlan
} = require('../xtend-maraca');

const BRIDGE_SCHEMA = 'xtend.docs.rmt-playground.maraca-preview-bridge.v1';
const RESPONSE_SCHEMA = 'xtend.docs.rmt-playground.maraca-preview.v1';
const VALID_MODES = new Set(['auto', 'strict', 'off']);
const FEATURE_KEYS = Object.freeze([
  'orchestration',
  'kernel',
  'hydration',
  'validation',
  'transitions'
]);
const REDACTED_KEYS = new Set([
  'absolutePath',
  'rootDir',
  'sourcePath',
  'outputDir',
  'outputs',
  'toolchain',
  'propertyMangling',
  'sourceMap',
  'astPointer',
  'workpackage'
]);

function readStdin() {
  return new Promise((resolve, reject) => {
    let body = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      body += chunk;
    });
    process.stdin.on('end', () => resolve(body));
    process.stdin.on('error', reject);
    process.stdin.resume();
  });
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function normalizeMode(value) {
  const mode = String(value || '').toLowerCase();
  return VALID_MODES.has(mode) ? mode : 'auto';
}

function normalizeFeatureOptions(value = {}) {
  const input = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(FEATURE_KEYS.map((key) => [key, normalizeMode(input[key])]));
}

function scrubValue(value, rootDir, depth = 0) {
  if (depth > 24) return '[depth-limit]';
  if (Array.isArray(value)) {
    return value.map((entry) => scrubValue(entry, rootDir, depth + 1));
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && rootDir && value.startsWith(rootDir)) {
      return value.replace(rootDir, '[repo]');
    }
    return value;
  }

  const result = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (REDACTED_KEYS.has(key)) return;
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
      result[key] = '[redacted]';
      return;
    }
    result[key] = scrubValue(entry, rootDir, depth + 1);
  });
  return result;
}

function sanitizeDiagnostics(diagnostics, rootDir) {
  if (!Array.isArray(diagnostics)) return [];
  return diagnostics.map((diagnostic) => {
    const scrubbed = scrubValue(diagnostic, rootDir);
    if (scrubbed && typeof scrubbed.message === 'string') {
      scrubbed.message = scrubbed.message.replace(/\bWP-[A-Z0-9-]+\b/giu, 'compiler source');
    }
    return scrubbed;
  });
}

function featureResponse(feature, rootDir) {
  const entry = feature && typeof feature === 'object' ? feature : {};
  return {
    schema: entry.schema || null,
    mode: entry.mode || 'auto',
    strict: entry.strict === true,
    enabled: entry.enabled === true,
    status: entry.status || 'unknown',
    supported: entry.supported === true,
    summary: scrubValue(entry.summary || {}, rootDir),
    runtimeModules: Array.isArray(entry.runtimeModules) ? entry.runtimeModules.slice() : [],
    artifact: scrubValue(entry.artifact || null, rootDir),
    diagnostics: sanitizeDiagnostics(entry.diagnostics || [], rootDir)
  };
}

function buildSummary(plan = {}) {
  const orchestration = plan.orchestration && plan.orchestration.summary || {};
  const kernel = plan.kernel && plan.kernel.summary || {};
  const hydration = plan.hydration && plan.hydration.summary || {};
  const validation = plan.validation && plan.validation.summary || {};
  const transitions = plan.transitions && plan.transitions.summary || {};
  return {
    surfaceCount: Number(orchestration.surfaceCount || (Array.isArray(plan.surfaces) ? plan.surfaces.length : 0)),
    actionCount: Number(orchestration.actionCount || 0),
    eventCount: Number(orchestration.eventCount || (Array.isArray(plan.events) ? plan.events.length : 0)),
    validationGroupCount: Number(validation.groupCount || 0),
    transitionCount: Number(transitions.transitionCount || 0),
    kernelScheduleCount: Number(kernel.scheduleCount || 0),
    hydrationRecordCount: Number(hydration.recordCount || 0)
  };
}

function sanitizePlan(plan = {}, rootDir) {
  return {
    schema: plan.schema,
    ok: plan.ok === true,
    status: plan.status || 'unknown',
    source: plan.source || 'docs/rmt-playground-source.rmt',
    sourceHash: plan.sourceHash || '',
    profile: plan.profile || 'debug',
    lazy: plan.lazy || 'component',
    css: plan.css || 'external',
    componentMode: plan.componentMode || 'document',
    stackMode: plan.stackMode || 'runtime',
    orchestrationMode: plan.orchestrationMode || 'auto',
    kernelMode: plan.kernelMode || 'auto',
    hydrationMode: plan.hydrationMode || 'auto',
    validationMode: plan.validationMode || 'auto',
    transitionsMode: plan.transitionsMode || 'auto',
    diagnostics: sanitizeDiagnostics(plan.diagnostics || [], rootDir),
    rmt: scrubValue(plan.rmt || {}, rootDir),
    components: {
      requiredTags: plan.components && Array.isArray(plan.components.requiredTags) ? plan.components.requiredTags.slice() : [],
      selected: plan.components && Array.isArray(plan.components.selected)
        ? plan.components.selected.map((entry) => ({
            tag: entry.tag,
            module: entry.module,
            source: entry.source,
            known: entry.known === true,
            lazy: entry.lazy === true,
            sideEffectBoundary: entry.sideEffectBoundary || ''
          }))
        : [],
      unknown: plan.components && Array.isArray(plan.components.unknown) ? plan.components.unknown.slice() : []
    },
    surfaces: scrubValue(plan.surfaces || [], rootDir),
    events: scrubValue(plan.events || [], rootDir),
    lanes: scrubValue(plan.lanes || [], rootDir),
    state: scrubValue(plan.state || {}, rootDir),
    runtimeModules: Array.isArray(plan.runtimeModules) ? plan.runtimeModules.slice() : [],
    stack: scrubValue(plan.stack || {}, rootDir),
    features: Object.fromEntries(FEATURE_KEYS.map((key) => [key, featureResponse(plan[key], rootDir)])),
    orchestration: featureResponse(plan.orchestration, rootDir),
    kernel: featureResponse(plan.kernel, rootDir),
    hydration: featureResponse(plan.hydration, rootDir),
    validation: featureResponse(plan.validation, rootDir),
    transitions: featureResponse(plan.transitions, rootDir),
    publicNameReservations: Array.isArray(plan.publicNameReservations) ? plan.publicNameReservations.slice() : []
  };
}

function createMaracaPreviewBridgePayload(payload = {}, options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const featureOptions = normalizeFeatureOptions(payload.maraca || payload.features || {});
  const source = String(payload.source || payload.sourceText || '');
  const filePath = payload.filePath || payload.virtualSourcePath || 'docs/rmt-playground-source.rmt';
  const plan = createMaracaBuildPlan({
    sourceText: source,
    virtualSourcePath: filePath,
    profile: payload.profile || 'debug',
    lazy: payload.lazy || 'component',
    css: payload.css || 'external',
    stack: payload.stack || 'runtime',
    components: payload.components || 'document',
    ...featureOptions
  }, {
    rootDir
  });
  const safePlan = sanitizePlan(plan, rootDir);
  const diagnostics = sanitizeDiagnostics(plan.diagnostics || [], rootDir);
  const featureEntries = Object.fromEntries(FEATURE_KEYS.map((key) => {
    const feature = safePlan[key] || safePlan.features[key] || {};
    return [key, {
      enabled: feature.enabled === true,
      mode: feature.mode || featureOptions[key],
      status: feature.status || 'unknown',
      supported: feature.supported === true,
      summary: feature.summary || {}
    }];
  }));

  return {
    schema: RESPONSE_SCHEMA,
    bridgeSchema: BRIDGE_SCHEMA,
    ok: plan.ok === true,
    status: plan.status || (plan.ok ? 'planned' : 'blocked'),
    diagnostics,
    summary: buildSummary(plan),
    features: featureEntries,
    runtimeModules: safePlan.runtimeModules,
    plan: safePlan
  };
}

async function main() {
  const raw = await readStdin();
  let payload = {};
  try {
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    writeJson({
      schema: RESPONSE_SCHEMA,
      bridgeSchema: BRIDGE_SCHEMA,
      ok: false,
      status: 'invalid-json',
      diagnostics: [{
        code: 'xtend.docs.rmt_playground.maraca_preview.invalid_json',
        severity: 'error',
        message: error.message
      }],
      summary: buildSummary({}),
      features: Object.fromEntries(FEATURE_KEYS.map((key) => [key, { enabled: false, mode: 'auto', status: 'invalid-json', supported: false, summary: {} }])),
      runtimeModules: [],
      plan: null
    });
    process.exitCode = 1;
    return;
  }

  const result = createMaracaPreviewBridgePayload(payload);
  writeJson(result);
  if (result.ok !== true) process.exitCode = 2;
}

if (require.main === module) {
  main().catch((error) => {
    writeJson({
      schema: RESPONSE_SCHEMA,
      bridgeSchema: BRIDGE_SCHEMA,
      ok: false,
      status: 'bridge-error',
      diagnostics: [{
        code: 'xtend.docs.rmt_playground.maraca_preview.failed',
        severity: 'error',
        message: error && error.message ? error.message : String(error)
      }],
      summary: buildSummary({}),
      features: Object.fromEntries(FEATURE_KEYS.map((key) => [key, { enabled: false, mode: 'auto', status: 'bridge-error', supported: false, summary: {} }])),
      runtimeModules: [],
      plan: null
    });
    process.exitCode = 1;
  });
}

module.exports = {
  BRIDGE_SCHEMA,
  RESPONSE_SCHEMA,
  createMaracaPreviewBridgePayload
};

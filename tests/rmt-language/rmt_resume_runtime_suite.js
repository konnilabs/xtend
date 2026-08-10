const path = require('path');
const { createHash } = require('crypto');
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
const { syntaxCheckFile } = require('../utils/process');

const RMT_RESUME_RUNTIME_PATH = 'xtendrmt/rmt-resume-runtime.js';
const RMT_RESUME_RUNTIME_TYPES = 'xtendrmt/rmt-resume-runtime.d.ts';
const RMT_RESUME_CAPTURE_ADAPTER_PATH = 'xtendrmt/rmt-resume-capture-adapter.js';
const RMT_RESUME_COMMAND_ADAPTER_PATH = 'xtendrmt/rmt-resume-command-adapter.js';
const RMT_RESUME_COMMAND_CONTROLLER_PATH = 'xtendrmt/rmt-resume-command-controller.js';
const RMT_RESUME_HOST_ADAPTER_PATH = 'xtendrmt/rmt-resume-host-adapter.js';
const RMT_RESUME_RUNTIME_SCHEMA = 'xtend.rmt.resume-runtime.v1';
const RMT_RESUME_ENVELOPE_SCHEMA = 'xtend.rmt.ssr-resume-envelope.v1';

function createRoot(generation, outerHTML = null) {
  const attributes = new Map([
    ['id', 'resume-root'],
    ['data-rmt-resume-root', 'true'],
    ['data-rmt-resume-generation', generation]
  ]);
  const listeners = new Map();
  const root = {
    nodeType: 1,
    getAttribute(name) { return attributes.get(name) || null; },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    dispatch(type, event) { if (listeners.has(type)) listeners.get(type)(event); }
  };
  if (outerHTML !== null) root.outerHTML = outerHTML;
  return root;
}

function canonicalize(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function createEnvelope(generation, overrides = {}) {
  const envelope = {
    schema: RMT_RESUME_ENVELOPE_SCHEMA,
    version: 1,
    executionMode: 'server_prerender_resume',
    requestId: `request-${generation}`,
    rootId: 'resume-root',
    templateId: 'resume-template',
    generation,
    issuedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2027-01-01T00:00:00.000Z',
    snapshot: {
      schema: 'xtend.rmt.resume-snapshot.v1',
      state: { 'app.status': { text: 'Ready' } },
      surfaces: { 'app.shell': { text: 'Ready' } }
    },
    eventReplay: {
      schema: 'xtend.rmt.resume-intent-queue-policy.v1',
      mode: 'intent_queue',
      generation,
      maxEntries: 128,
      replayExactlyOnce: true
    },
    xtensions: [{ id: 'react-ledger', strategy: 'dom_hydrate' }],
    manifests: [],
    dom: { algorithm: 'SHA-256', digest: 'fixture-digest' },
    fallbackMode: 'server_prerender_hydrate',
    hydrationSchema: 'xtend.rmt.node-ssr-hydration-payload.v1',
    integrity: {
      schema: 'xtend.rmt.ssr-resume-integrity.v1',
      algorithm: 'ECDSA-P256-SHA256',
      encoding: 'base64url',
      keyId: 'fixture-key',
      digest: '',
      signature: 'fixture-signature'
    },
    ...overrides
  };
  if (!Object.prototype.hasOwnProperty.call(overrides, 'integrity')) {
    const { integrity, ...unsigned } = envelope;
    envelope.integrity = {
      ...integrity,
      digest: createHash('sha256').update(canonicalize(unsigned)).digest('base64url')
    };
  }
  return envelope;
}

async function runRmtResumeRuntimeSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'rmt-resume-runtime', label: 'RMT Resume Runtime' });
  const syntax = syntaxCheckFile(RMT_RESUME_RUNTIME_PATH, { rootDir, extension: '.js' });
  const source = readText(RMT_RESUME_RUNTIME_PATH, rootDir);
  const captureSource = readText(RMT_RESUME_CAPTURE_ADAPTER_PATH, rootDir);
  const commandSource = readText(RMT_RESUME_COMMAND_ADAPTER_PATH, rootDir);
  const controllerSource = readText(RMT_RESUME_COMMAND_CONTROLLER_PATH, rootDir);
  const hostSource = readText(RMT_RESUME_HOST_ADAPTER_PATH, rootDir);
  const types = readText(RMT_RESUME_RUNTIME_TYPES, rootDir);
  const rootManifest = readJson('package.json', rootDir);
  const runtimeManifest = readJson('xtendrmt/package.json', rootDir);
  const api = await import(`file://${resolveRepoPath(RMT_RESUME_RUNTIME_PATH, rootDir)}`);
  const verifyEnvelopeDigest = (canonicalPayload, expectedDigest, integrity) => ({
    verified: createHash('sha256').update(canonicalPayload).digest(integrity.encoding === 'hex' ? 'hex' : 'base64url') === expectedDigest
  });

  context.assert(syntax.ok, `resume runtime syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assert(api.RMT_RESUME_RUNTIME_SCHEMA === RMT_RESUME_RUNTIME_SCHEMA, 'resume runtime exposes its public schema');
  context.assert(typeof api.createRmtResumeRuntime === 'function', 'resume runtime exposes a factory');
  context.assert(typeof api.resumeResponse === 'function' && typeof api.resumeTemplate === 'function', 'resume runtime exposes response and template entrypoints');
  context.assert(types.includes('RmtResumeEnvelope') && types.includes('RmtResumeVerifier') && types.includes('RmtResumeDigestVerifier'), 'resume runtime publishes envelope, signature and digest verifier types');
  context.assert(rootManifest.exports['./rmt/resume-runtime'].default === './xtendrmt/rmt-resume-runtime.js', 'root package exports resume runtime');
  context.assert(runtimeManifest.exports['./resume-runtime'].default === './rmt-resume-runtime.js', 'RMT package exports resume runtime');
  context.assert(!source.includes('innerHTML'), 'resume runtime does not replace server markup');
  context.assert(
    source.includes("from './rmt-resume-capture-adapter.js'")
      && source.includes("from './rmt-resume-host-adapter.js'")
      && source.includes("from './rmt-resume-command-adapter.js'")
      && source.includes("from './rmt-resume-command-controller.js'"),
    'resume compatibility runtime delegates to physically separate capture, host, command and controller ports'
  );
  context.assert(
    !/\.(?:addEventListener|removeEventListener|getAttribute|querySelector|setState)\s*\(/u.test(source),
    'resume compatibility composer performs no concrete DOM, event or state work'
  );
  context.assert(/\.addEventListener\s*\(/u.test(captureSource)
    && !/\.setState\s*\(/u.test(captureSource),
  'resume input adapter exclusively owns preboot event capture');
  context.assert(/\.setState\s*\(/u.test(commandSource)
    && !/\.(?:addEventListener|removeEventListener|getAttribute|querySelector)\s*\(/u.test(commandSource),
  'resume command adapter exclusively owns legacy state restoration');
  context.assert(!/\.(?:addEventListener|removeEventListener|dispatchEvent|getAttribute|querySelector|setState)\s*\(/u.test(controllerSource)
    && /\.getAttribute\s*\(/u.test(hostSource),
  'resume controller orchestrates typed ports while host inspection stays in the host adapter');

  const order = [];
  const root = createRoot('generation-1');
  const runtime = api.createRmtResumeRuntime({
    now: () => Date.parse('2026-07-21T12:00:00.000Z'),
    verifyEnvelopeDigest,
    verify: async (_canonical, integrity) => ({ verified: integrity.signature === 'fixture-signature' }),
    restoreState(state) {
      order.push(`state:${state['app.status'].text}`);
    },
    adopters: {
      'react-ledger': {
        adopt(input) {
          order.push(`adopt:${input.record.strategy}`);
          return { ok: true, status: 'dom_hydrated', rootPreserved: true };
        }
      }
    },
    replayIntent(intent) {
      order.push(`intent:${intent.action}`);
      return { ok: true };
    }
  });
  runtime.captureIntent({
    generation: 'generation-1',
    eventId: 'event:select',
    action: 'erp.select',
    surfaceId: 'app.shell',
    eventType: 'click',
    payload: { id: 'row-1' }
  });
  const envelope = createEnvelope('generation-1');
  const response = { kind: 'rmt_template_prerender_response', ok: true, rootId: 'resume-root', resume: envelope, chunk: { kind: 'rmt_template_chunk' } };
  const preflight = await runtime.verifyResponse(response, {}, { root });
  context.assert(preflight.ok === true
    && preflight.verified === true
    && preflight.state['app.status'].text === 'Ready'
    && Object.isFrozen(preflight)
    && Object.isFrozen(preflight.state)
    && Object.isFrozen(preflight.state['app.status']),
  'resume preflight exposes only a deeply frozen verified initial Model snapshot');
  context.assert(order.length === 0
    && runtime.snapshot().history.length === 0
    && runtime.snapshot().consumedGenerations.length === 0,
  'resume preflight performs no state, DOM, adoption, replay, or lifecycle mutation');
  const resumed = await runtime.resumeResponse(response, {}, { root, preflight });
  context.assert(resumed.ok === true && resumed.status === 'resumed' && resumed.verified === true, `valid envelope resumes successfully${resumed.reasons && resumed.reasons.length ? ` (${resumed.reasons.join(',')})` : ''}`);
  context.assert(resumed.rootPreserved === true && resumed.fallbackAttempted === false, 'valid resume preserves root and avoids fallback');
  context.assert(resumed.restoredStateCount === 1 && resumed.adoptedXtensionCount === 1 && resumed.replayedIntentCount === 1, 'resume restores state, adopts XTensions and replays intents');
  context.assert(order.join('|') === 'state:Ready|adopt:dom_hydrate|intent:erp.select', 'resume transaction order is state, adoption, replay');

  const duplicate = await runtime.resumeResponse(response, {}, { root });
  context.assert(duplicate.status === 'resumed' && duplicate.duplicateIgnored === true, 'duplicate generation is ignored without replay or fallback');

  let fallbackCount = 0;
  const invalidRoot = createRoot('generation-2');
  const invalidEnvelope = createEnvelope('generation-2', {
    integrity: { algorithm: 'ECDSA-P256-SHA256', keyId: 'fixture-key', digest: 'bad', signature: 'tampered' }
  });
  const invalidResponse = { ...response, resume: invalidEnvelope };
  const invalid = await runtime.resumeResponse(invalidResponse, {}, {
    root: invalidRoot,
    hydrateResponse() {
      fallbackCount += 1;
      return { ok: true, status: 'hydrated' };
    }
  });
  context.assert(invalid.status === 'fallback_hydrated' && invalid.fallbackAttempted === true, 'invalid signature uses explicit hydration fallback');
  context.assert(fallbackCount === 1, 'invalid signature hydrates exactly once');
  const invalidAgain = await runtime.resumeResponse(invalidResponse, {}, {
    root: invalidRoot,
    hydrateResponse() { fallbackCount += 1; return { ok: true }; }
  });
  context.assert(invalidAgain.status === 'rejected' && fallbackCount === 1, 'repeated invalid payload cannot run fallback twice');

  let domMutationCount = 0;
  const domRoot = createRoot('generation-dom', '<section id="resume-root">mutated</section>');
  const domEnvelope = createEnvelope('generation-dom');
  const domRejected = await api.createRmtResumeRuntime({
    now: () => Date.parse('2026-07-21T12:00:00.000Z'),
    verifyEnvelopeDigest,
    verify: async () => ({ verified: true }),
    verifyDomDigest: async (_outerHtml, expectedDigest) => ({
      verified: false,
      reason: expectedDigest === 'fixture-digest' ? 'dom_digest_mismatch' : 'dom_digest_missing'
    }),
    restoreState() { domMutationCount += 1; }
  }).resumeResponse({ ...response, resume: domEnvelope }, {}, {
    root: domRoot,
    hydrateResponse() { return { ok: false, status: 'rejected' }; }
  });
  context.assert(domRejected.status === 'rejected' && domRejected.reasons.includes('dom_digest_mismatch'), `DOM digest mismatch is rejected before adoption (${(domRejected.reasons || []).join(',')})`);
  context.assert(domMutationCount === 0, 'DOM digest rejection happens before state mutation');

  let tamperedStateMutationCount = 0;
  const signedEnvelope = createEnvelope('generation-signed');
  const tamperedCases = [
    {
      label: 'state',
      expectedReason: 'envelope_digest_mismatch',
      envelope: { ...signedEnvelope, snapshot: { ...signedEnvelope.snapshot, state: { 'app.status': { text: 'Tampered' } } } }
    },
    {
      label: 'manifest',
      expectedReason: 'envelope_digest_mismatch',
      envelope: { ...signedEnvelope, manifests: [{ id: 'injected', bundleIntegrity: 'bad' }] }
    },
    {
      label: 'digest',
      expectedReason: 'envelope_digest_mismatch',
      envelope: { ...signedEnvelope, integrity: { ...signedEnvelope.integrity, digest: `A${signedEnvelope.integrity.digest.slice(1)}` } }
    },
    {
      label: 'version',
      expectedReason: 'version_mismatch',
      envelope: { ...signedEnvelope, version: 2 }
    },
    {
      label: 'expiry',
      expectedReason: 'expired',
      envelope: { ...signedEnvelope, expiresAt: '2026-01-01T00:00:00.000Z' }
    },
    {
      label: 'generation',
      expectedReason: 'generation_mismatch',
      envelope: { ...signedEnvelope, generation: 'generation-injected' }
    },
    {
      label: 'root',
      expectedReason: 'root_mismatch',
      envelope: { ...signedEnvelope, rootId: 'injected-root' }
    }
  ];
  const tamperedResults = [];
  for (const testCase of tamperedCases) {
    const tamperedRuntime = api.createRmtResumeRuntime({
      now: () => Date.parse('2026-07-21T12:00:00.000Z'),
      verifyEnvelopeDigest,
      verify: async () => ({ verified: true }),
      restoreState() { tamperedStateMutationCount += 1; }
    });
    const result = await tamperedRuntime.resumeResponse({ ...response, resume: testCase.envelope }, {}, {
      root: createRoot('generation-signed'),
      hydrateResponse() { return { ok: false, status: 'rejected' }; }
    });
    tamperedResults.push({ ...testCase, result });
  }
  context.assert(tamperedResults.every(({ expectedReason, result }) => result.status === 'rejected' && result.reasons.includes(expectedReason)), `tampered state, manifest, digest, version, expiry, generation and root are rejected (${tamperedResults.map(({ label, result }) => `${label}:${(result.reasons || []).join('+')}`).join(',')})`);
  context.assert(tamperedStateMutationCount === 0, 'all invalid envelope variants fail before preserved-state mutation');

  const bounded = api.createRmtResumeRuntime({ generation: 'bounded' });
  let lastIntent = null;
  for (let index = 0; index <= api.RMT_RESUME_MAX_INTENTS; index += 1) {
    lastIntent = bounded.captureIntent({ generation: 'bounded', eventId: `event-${index}`, action: 'bounded.action' });
  }
  context.assert(lastIntent === null && bounded.snapshot().queuedIntentCount === 128, 'pre-boot intent queue is bounded at 128 entries');
  context.assert(api.canonicalizeRmtResumePayload({ b: 1, a: 2 }) === '{"a":2,"b":1}', 'resume canonicalization is key-order stable');

  return context.result({
    schema: 'xtend.rmt.resume-runtime-report.v1',
    runtimeSchema: RMT_RESUME_RUNTIME_SCHEMA,
    assertionCount: context.passes.length
  });
}

function printRmtResumeRuntimeReport(result) {
  printSuiteReport(result, {
    successTitle: 'RMT Resume Runtime erfolgreich.',
    failureTitle: 'RMT Resume Runtime fehlgeschlagen:'
  });
}

module.exports = {
  RMT_RESUME_RUNTIME_PATH,
  RMT_RESUME_RUNTIME_SCHEMA,
  printRmtResumeRuntimeReport,
  runRmtResumeRuntimeSuite
};

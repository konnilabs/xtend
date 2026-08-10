import {
  RMT_RESUME_ENVELOPE_SCHEMA,
  RMT_RESUME_RESULT_SCHEMA,
  RMT_RESUME_RUNTIME_SCHEMA,
  canonicalizeRmtResumePayload,
  clampString,
  cloneSafe,
  createResumeDiagnostic,
  freezeClone,
  normalizeEnvelope,
  normalizeResponse,
  objectRecord,
  toArray,
  unsignedEnvelope
} from './rmt-resume-protocol.js';

export function createRmtResumeCommandController(options = {}) {
  const capturePort = options.capturePort;
  const hostPort = options.hostPort;
  const commandPort = options.commandPort;
  const history = [];
  const diagnostics = [];
  const consumedGenerations = new Set();
  const fallbackGenerations = new Set();
  const verifiedPreflights = new WeakMap();

  function publish(diagnostic) {
    diagnostics.push(diagnostic);
    if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(diagnostic);
    return diagnostic;
  }

  function captureIntent(input = {}) {
    return capturePort.captureIntent(input);
  }

  function installPrebootCapture(root, eventRecords = [], captureOptions = {}) {
    return capturePort.install(root, eventRecords, captureOptions);
  }

  async function verifyEnvelopeDigest(canonicalPayload, integrity, callOptions) {
    const expectedDigest = clampString(integrity && integrity.digest);
    if (!expectedDigest) return { ok: false, reason: 'envelope_digest_missing' };
    const encoding = clampString(
      integrity && integrity.encoding,
      /^[a-f0-9]{64}$/iu.test(expectedDigest) ? 'hex' : 'base64url'
    );
    const expected = encoding === 'hex' ? expectedDigest.toLowerCase() : expectedDigest;
    const verifier = callOptions.verifyEnvelopeDigest || options.verifyEnvelopeDigest;
    if (typeof verifier === 'function') {
      const verdict = await verifier(canonicalPayload, expected, cloneSafe(integrity, {}));
      const ok = verdict === true || Boolean(verdict && (verdict.ok === true || verdict.verified === true));
      return ok
        ? { ok: true, encoding, verdict: cloneSafe(verdict, { verified: true }) }
        : { ok: false, reason: verdict && verdict.reason || 'envelope_digest_mismatch', encoding };
    }
    const actual = await hostPort.digest(canonicalPayload, encoding);
    if (!actual) return { ok: false, reason: 'envelope_digest_verifier_unavailable' };
    return actual === expected
      ? { ok: true, actual, encoding }
      : { ok: false, reason: 'envelope_digest_mismatch', expected, actual, encoding };
  }

  async function verifyDomDigest(envelope, root, callOptions) {
    const dom = objectRecord(envelope.dom);
    const expectedDigest = clampString(dom.digest);
    if (!expectedDigest) return { ok: false, reason: 'dom_digest_missing' };
    const encoding = clampString(dom.encoding, /^[a-f0-9]{64}$/iu.test(expectedDigest) ? 'hex' : 'base64url');
    const expected = encoding === 'hex' ? expectedDigest.toLowerCase() : expectedDigest;
    const payload = hostPort.readDomPayload(root, dom);
    if (payload.skipped) return { ok: true, skipped: true, reason: 'dom_serialization_unavailable' };
    if (Number.isFinite(dom.nodeCount) && Number.isFinite(payload.nodeCount) && dom.nodeCount !== payload.nodeCount) {
      return { ok: false, reason: 'dom_node_count_mismatch', expected: dom.nodeCount, actual: payload.nodeCount };
    }
    const verifier = callOptions.verifyDomDigest || options.verifyDomDigest;
    if (typeof verifier === 'function') {
      const verdict = await verifier(payload.canonical, expected, cloneSafe(dom, {}), envelope);
      const ok = verdict === true || Boolean(verdict && (verdict.ok === true || verdict.verified === true));
      return ok
        ? { ok: true, verdict: cloneSafe(verdict, { verified: true }) }
        : { ok: false, reason: verdict && verdict.reason || 'dom_digest_mismatch' };
    }
    const actual = await hostPort.digest(payload.canonical, encoding);
    if (!actual) return { ok: false, reason: 'dom_digest_verifier_unavailable' };
    return actual === expected
      ? { ok: true, actual }
      : { ok: false, reason: 'dom_digest_mismatch', expected, actual };
  }

  async function verifyEnvelope(envelope, root, callOptions) {
    const reasons = [];
    if (envelope.schema !== RMT_RESUME_ENVELOPE_SCHEMA) reasons.push('schema_mismatch');
    if (envelope.version !== 1) reasons.push('version_mismatch');
    if (envelope.executionMode !== 'server_prerender_resume') reasons.push('execution_mode_mismatch');
    if (!clampString(envelope.rootId) || !clampString(envelope.generation)) reasons.push('identity_missing');
    if (!envelope.integrity || !envelope.integrity.signature || !envelope.integrity.keyId) reasons.push('integrity_missing');
    if (envelope.integrity && envelope.integrity.algorithm !== 'ECDSA-P256-SHA256') reasons.push('integrity_algorithm_mismatch');
    if (envelope.fallbackMode !== 'server_prerender_hydrate') reasons.push('fallback_mode_mismatch');
    const replayPolicy = objectRecord(envelope.eventReplay);
    if (
      replayPolicy.mode !== 'intent_queue'
      || replayPolicy.replayExactlyOnce !== true
      || replayPolicy.generation !== envelope.generation
    ) reasons.push('event_replay_policy_mismatch');
    const expiresAt = Date.parse(envelope.expiresAt || '');
    if (!Number.isFinite(expiresAt) || expiresAt <= hostPort.now()) reasons.push('expired');
    if (!root) reasons.push('root_missing');
    const rootIdentity = hostPort.inspectRoot(root);
    if (rootIdentity.id && rootIdentity.id !== envelope.rootId) reasons.push('root_mismatch');
    if (rootIdentity.generation && rootIdentity.generation !== envelope.generation) reasons.push('generation_mismatch');
    if (reasons.length > 0) return { ok: false, reasons };

    const verifier = callOptions.verify || callOptions.verifyResumeEnvelope || options.verify || options.verifyResumeEnvelope;
    if (typeof verifier !== 'function') return { ok: false, reasons: ['verifier_missing'] };
    try {
      const canonicalPayload = canonicalizeRmtResumePayload(unsignedEnvelope(envelope));
      const envelopeDigest = await verifyEnvelopeDigest(canonicalPayload, envelope.integrity, callOptions);
      if (!envelopeDigest.ok) {
        return { ok: false, reasons: [envelopeDigest.reason], verdict: { envelopeDigest } };
      }
      const verdict = await verifier(canonicalPayload, cloneSafe(envelope.integrity, {}), cloneSafe(envelope, {}));
      const accepted = verdict === true || Boolean(verdict && (verdict.ok === true || verdict.verified === true));
      if (!accepted) {
        return {
          ok: false,
          reasons: [verdict && verdict.reason || 'signature_invalid'],
          verdict: cloneSafe(verdict, null)
        };
      }
      const domDigest = await verifyDomDigest(envelope, root, callOptions);
      return domDigest.ok
        ? {
            ok: true,
            reasons: [],
            verdict: { ...cloneSafe(verdict, { verified: true }), envelopeDigest, domDigest }
          }
        : {
            ok: false,
            reasons: [domDigest.reason || 'dom_digest_mismatch'],
            verdict: { ...cloneSafe(verdict, { verified: true }), envelopeDigest, domDigest }
          };
    } catch (error) {
      return { ok: false, reasons: ['verification_failed'], error };
    }
  }

  async function hydrateFallback(response, request, envelope, root, verification, callOptions) {
    const reasons = toArray(verification.reasons).map(String);
    const key = `${envelope.rootId || response.rootId || 'root'}:${envelope.generation || 'unknown'}`;
    if (fallbackGenerations.has(key)) {
      return {
        schema: RMT_RESUME_RESULT_SCHEMA,
        ok: false,
        status: 'rejected',
        verified: false,
        fallbackAttempted: false,
        fallbackHydrated: false,
        reasons: reasons.concat('fallback_already_attempted'),
        rootPreserved: true
      };
    }
    fallbackGenerations.add(key);
    const fallbackCommand = await commandPort.hydrateFallback(
      response,
      request,
      { root, reasons },
      callOptions
    );
    if (!fallbackCommand.available) {
      return {
        schema: RMT_RESUME_RESULT_SCHEMA,
        ok: false,
        status: 'rejected',
        verified: false,
        fallbackAttempted: true,
        fallbackHydrated: false,
        reasons: reasons.concat('hydrate_fallback_missing'),
        rootPreserved: true
      };
    }
    const fallback = fallbackCommand.result;
    const hydrated = fallback !== false && (!fallback || fallback.ok !== false);
    return {
      schema: RMT_RESUME_RESULT_SCHEMA,
      ok: hydrated,
      status: hydrated ? 'fallback_hydrated' : 'rejected',
      verified: false,
      fallbackAttempted: true,
      fallbackHydrated: hydrated,
      fallback,
      reasons,
      rootPreserved: true
    };
  }

  async function resumeResponse(responseInput = {}, requestInput = {}, callOptions = {}) {
    const response = normalizeResponse(responseInput);
    const envelope = normalizeEnvelope(responseInput.resume || response.resume || responseInput);
    const root = hostPort.resolveRoot(envelope, response, callOptions);
    if (clampString(envelope.generation) && consumedGenerations.has(envelope.generation)) {
      const duplicateResult = Object.freeze({
        schema: RMT_RESUME_RESULT_SCHEMA,
        ok: true,
        status: 'resumed',
        verified: true,
        generation: envelope.generation,
        rootId: envelope.rootId,
        rootPreserved: true,
        restoredStateCount: 0,
        adoptedXtensionCount: 0,
        replayedIntentCount: 0,
        fallbackAttempted: false,
        fallbackHydrated: false,
        duplicateIgnored: true,
        reasons: []
      });
      history.push(cloneSafe(duplicateResult, {}));
      return duplicateResult;
    }

    const suppliedPreflight = callOptions.preflight;
    const preflightRecord = suppliedPreflight && typeof suppliedPreflight === 'object'
      ? verifiedPreflights.get(suppliedPreflight)
      : null;
    const currentCanonicalPayload = canonicalizeRmtResumePayload(unsignedEnvelope(envelope));
    const usePreflight = Boolean(
      preflightRecord
      && preflightRecord.root === root
      && preflightRecord.canonicalPayload === currentCanonicalPayload
      && suppliedPreflight.generation === clampString(envelope.generation)
      && suppliedPreflight.rootId === clampString(envelope.rootId)
    );
    if (usePreflight) verifiedPreflights.delete(suppliedPreflight);
    const verification = usePreflight
      ? { ok: true, reasons: [], verdict: suppliedPreflight.verification || { verified: true } }
      : await verifyEnvelope(envelope, root, callOptions);
    if (!verification.ok) {
      const result = await hydrateFallback(response, requestInput, envelope, root, verification, callOptions);
      history.push(cloneSafe(result, {}));
      publish(createResumeDiagnostic(
        'rmt.resume.rejected',
        result.status === 'fallback_hydrated' ? 'warning' : 'error',
        `Resume was rejected: ${toArray(verification.reasons).join(', ')}.`,
        { status: result.status, reasons: verification.reasons }
      ));
      return Object.freeze(result);
    }

    const rootReference = root;
    try {
      const restored = commandPort.restoreState(envelope, callOptions);
      if (restored.result && typeof restored.result.then === 'function') await restored.result;
      const nativeResult = await commandPort.adoptRoot(root, envelope, response, callOptions);
      const xtensions = await commandPort.adoptXtensions(envelope, root, callOptions);
      const hasExternalQueue = Object.prototype.hasOwnProperty.call(callOptions, 'intentQueue');
      const inputQueue = hasExternalQueue ? toArray(callOptions.intentQueue) : capturePort.listIntents();
      const intents = inputQueue.filter((intent) => intent && intent.generation === envelope.generation);
      const replay = await commandPort.replayIntents(envelope, intents, callOptions);
      if (!hasExternalQueue) capturePort.clearIntents();
      consumedGenerations.add(envelope.generation);
      const result = {
        schema: RMT_RESUME_RESULT_SCHEMA,
        ok: true,
        status: 'resumed',
        verified: true,
        verification: verification.verdict || { verified: true },
        generation: envelope.generation,
        rootId: envelope.rootId,
        rootPreserved: root === rootReference,
        restoredStateCount: restored.count,
        adoptedXtensionCount: xtensions.length,
        xtensions,
        native: nativeResult,
        replayedIntentCount: replay.count,
        fallbackAttempted: false,
        fallbackHydrated: false,
        reasons: []
      };
      history.push(cloneSafe(result, {}));
      return Object.freeze(result);
    } catch (error) {
      const failedVerification = {
        ok: false,
        reasons: [error && error.code || 'adoption_failed'],
        error
      };
      const result = await hydrateFallback(response, requestInput, envelope, root, failedVerification, callOptions);
      history.push(cloneSafe(result, {}));
      publish(createResumeDiagnostic(
        'rmt.resume.adoption_failed',
        result.status === 'fallback_hydrated' ? 'warning' : 'error',
        error && error.message ? error.message : 'Resume adoption failed.',
        { status: result.status }
      ));
      return Object.freeze(result);
    }
  }

  async function verifyResponse(responseInput = {}, requestInput = {}, callOptions = {}) {
    void requestInput;
    const response = normalizeResponse(responseInput);
    const envelope = normalizeEnvelope(responseInput.resume || response.resume || responseInput);
    const root = hostPort.resolveRoot(envelope, response, callOptions);
    const verification = await verifyEnvelope(envelope, root, callOptions);
    const snapshot = verification.ok ? objectRecord(envelope.snapshot) : {};
    const result = freezeClone({
      schema: 'xtend.rmt.resume-preflight.v1',
      ok: verification.ok === true,
      verified: verification.ok === true,
      generation: verification.ok ? clampString(envelope.generation) : '',
      rootId: verification.ok ? clampString(envelope.rootId) : '',
      state: verification.ok ? objectRecord(snapshot.state) : {},
      snapshot: verification.ok ? snapshot : {},
      verification: verification.ok ? verification.verdict || { verified: true } : null,
      reasons: verification.ok ? [] : toArray(verification.reasons).map(String)
    }, {
      schema: 'xtend.rmt.resume-preflight.v1',
      ok: false,
      verified: false,
      generation: '',
      rootId: '',
      state: {},
      snapshot: {},
      verification: null,
      reasons: ['verification_failed']
    });
    if (result.ok) {
      verifiedPreflights.set(result, {
        canonicalPayload: canonicalizeRmtResumePayload(unsignedEnvelope(envelope)),
        root
      });
    }
    return result;
  }

  async function resumeTemplate(requestInput = {}, callOptions = {}) {
    const request = objectRecord(requestInput);
    const response = objectRecord(request.response || {
      kind: 'rmt_template_prerender_response',
      ok: true,
      executionMode: 'server_prerender_resume',
      rootId: request.rootId,
      chunk: request.chunk || null,
      resume: request.resume || callOptions.resume || null
    });
    return resumeResponse(response, request, callOptions);
  }

  function listDiagnostics() {
    return diagnostics.concat(capturePort.listDiagnostics());
  }

  return Object.freeze({
    schema: RMT_RESUME_RUNTIME_SCHEMA,
    captureIntent,
    installPrebootCapture,
    verifyResponse,
    resumeResponse,
    resumeTemplate,
    listDiagnostics,
    listHistory: () => history.slice(),
    snapshot: () => ({
      schema: 'xtend.rmt.resume-runtime-snapshot.v1',
      queuedIntentCount: capturePort.listIntents().length,
      consumedGenerations: Array.from(consumedGenerations),
      fallbackGenerations: Array.from(fallbackGenerations),
      history: history.slice(),
      diagnostics: listDiagnostics()
    })
  });
}

export default Object.freeze({ createRmtResumeCommandController });

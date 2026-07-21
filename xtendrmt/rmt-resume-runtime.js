(function attachRmtResumeRuntime(globalTarget) {
  'use strict';

  const RMT_RESUME_RUNTIME_SCHEMA = 'xtend.rmt.resume-runtime.v1';
  const RMT_RESUME_ENVELOPE_SCHEMA = 'xtend.rmt.ssr-resume-envelope.v1';
  const RMT_RESUME_RESULT_SCHEMA = 'xtend.rmt.resume-result.v1';
  const RMT_RESUME_INTENT_SCHEMA = 'xtend.rmt.resume-intent.v1';
  const RMT_RESUME_ADAPTER_SCHEMA = 'xtend.xtensions.resume-adapter.v1';
  const RMT_RESUME_MAX_INTENTS = 128;

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function cloneSafe(value, fallback = null) {
    if (value === undefined) return fallback;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
    }
  }

  function canonicalizeRmtResumePayload(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `[${value.map(canonicalizeRmtResumePayload).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalizeRmtResumePayload(value[key])}`).join(',')}}`;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) return 'null';
    return JSON.stringify(value);
  }

  function unsignedEnvelope(envelope) {
    const source = objectRecord(envelope);
    const result = {};
    Object.keys(source).forEach((key) => {
      if (key !== 'integrity') result[key] = source[key];
    });
    return result;
  }

  function normalizeEnvelope(input) {
    if (typeof input === 'string') {
      try {
        return normalizeEnvelope(JSON.parse(input));
      } catch (_) {
        return {};
      }
    }
    const source = objectRecord(input);
    return objectRecord(source.resume || source.response && source.response.resume || source.result && source.result.resume || source);
  }

  function normalizeResponse(input) {
    if (typeof input === 'string') {
      try {
        return normalizeResponse(JSON.parse(input));
      } catch (_) {
        return {};
      }
    }
    const source = objectRecord(input);
    return objectRecord(source.response || source.result && source.result.response || source);
  }

  function resolveRoot(envelope, response, options) {
    if (options.root && typeof options.root === 'object') return options.root;
    const documentTarget = options.document || (globalTarget && globalTarget.document) || null;
    if (!documentTarget) return null;
    const rootId = clampString(options.rootId || envelope.rootId || response.rootId);
    if (rootId && typeof documentTarget.getElementById === 'function') {
      const root = documentTarget.getElementById(rootId);
      if (root) return root;
    }
    return typeof documentTarget.querySelector === 'function'
      ? documentTarget.querySelector('[data-rmt-resume-root="true"]')
      : null;
  }

  function createDiagnostic(code, severity, message, details = {}) {
    return {
      schema: 'xtend.rmt.resume-diagnostic.v1',
      code,
      severity,
      message,
      details: cloneSafe(details, {})
    };
  }

  function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes)).map((value) => value.toString(16).padStart(2, '0')).join('');
  }

  function bytesToBase64Url(bytes) {
    const encode = globalTarget && globalTarget.btoa;
    if (typeof encode !== 'function') return '';
    const binary = Array.from(new Uint8Array(bytes)).map((value) => String.fromCharCode(value)).join('');
    return encode(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '');
  }

  async function calculateSha256(value, encoding = 'base64url') {
    const cryptoTarget = globalTarget && globalTarget.crypto;
    const Encoder = globalTarget && globalTarget.TextEncoder;
    if (!cryptoTarget || !cryptoTarget.subtle || typeof Encoder !== 'function') return null;
    const digestBytes = await cryptoTarget.subtle.digest('SHA-256', new Encoder().encode(value));
    return encoding === 'hex' ? bytesToHex(digestBytes) : bytesToBase64Url(digestBytes);
  }

  async function verifyEnvelopeDigest(canonicalPayload, integrity, callOptions, options) {
    const expectedDigest = clampString(integrity && integrity.digest);
    if (!expectedDigest) return { ok: false, reason: 'envelope_digest_missing' };
    const encoding = clampString(integrity && integrity.encoding, /^[a-f0-9]{64}$/iu.test(expectedDigest) ? 'hex' : 'base64url');
    const expected = encoding === 'hex' ? expectedDigest.toLowerCase() : expectedDigest;
    const verifier = callOptions.verifyEnvelopeDigest || options.verifyEnvelopeDigest;
    if (typeof verifier === 'function') {
      const verdict = await verifier(canonicalPayload, expected, cloneSafe(integrity, {}));
      const ok = verdict === true || verdict && (verdict.ok === true || verdict.verified === true);
      return ok
        ? { ok: true, encoding, verdict: cloneSafe(verdict, { verified: true }) }
        : { ok: false, reason: verdict && verdict.reason || 'envelope_digest_mismatch', encoding };
    }
    const actual = await calculateSha256(canonicalPayload, encoding);
    if (!actual) return { ok: false, reason: 'envelope_digest_verifier_unavailable' };
    return actual === expected
      ? { ok: true, actual, encoding }
      : { ok: false, reason: 'envelope_digest_mismatch', expected, actual, encoding };
  }

  function createResumeNodeManifest(root) {
    if (!root || typeof root.getAttribute !== 'function') return [];
    const nodes = [root];
    if (typeof root.querySelectorAll === 'function') {
      nodes.push(...Array.from(root.querySelectorAll('[data-rmt-resume-id]')));
    }
    return nodes.map((node) => ({
      generation: clampString(node.getAttribute('data-rmt-resume-generation')),
      id: clampString(node.getAttribute('data-rmt-resume-id')),
      tag: clampString(node.localName || node.tagName).toLowerCase()
    })).filter((record) => record.id);
  }

  async function verifyDomDigest(envelope, root, callOptions, options) {
    const dom = objectRecord(envelope.dom);
    const expectedDigest = clampString(dom.digest);
    if (!expectedDigest) return { ok: false, reason: 'dom_digest_missing' };
    const encoding = clampString(dom.encoding, /^[a-f0-9]{64}$/iu.test(expectedDigest) ? 'hex' : 'base64url');
    const expected = encoding === 'hex' ? expectedDigest.toLowerCase() : expectedDigest;
    let canonicalDom = '';
    if (dom.canonicalization === 'resume-node-manifest.v1') {
      const manifest = createResumeNodeManifest(root);
      if (Number.isFinite(dom.nodeCount) && dom.nodeCount !== manifest.length) {
        return { ok: false, reason: 'dom_node_count_mismatch', expected: dom.nodeCount, actual: manifest.length };
      }
      canonicalDom = canonicalizeRmtResumePayload(manifest);
    } else {
      if (!root || typeof root.outerHTML !== 'string') {
        return { ok: true, skipped: true, reason: 'dom_serialization_unavailable' };
      }
      canonicalDom = root.outerHTML;
    }
    const verifier = callOptions.verifyDomDigest || options.verifyDomDigest;
    if (typeof verifier === 'function') {
      const verdict = await verifier(canonicalDom, expected, cloneSafe(envelope.dom, {}), envelope);
      const ok = verdict === true || verdict && (verdict.ok === true || verdict.verified === true);
      return ok ? { ok: true, verdict: cloneSafe(verdict, { verified: true }) } : { ok: false, reason: verdict && verdict.reason || 'dom_digest_mismatch' };
    }
    const actual = await calculateSha256(canonicalDom, encoding);
    if (!actual) return { ok: false, reason: 'dom_digest_verifier_unavailable' };
    return actual === expected
      ? { ok: true, actual }
      : { ok: false, reason: 'dom_digest_mismatch', expected, actual };
  }

  function createRmtResumeRuntime(options = {}) {
    const history = [];
    const diagnostics = [];
    const consumedGenerations = new Set();
    const fallbackGenerations = new Set();
    const queuedIntents = [];
    const now = typeof options.now === 'function' ? options.now : (() => Date.now());

    function publish(diagnostic) {
      diagnostics.push(diagnostic);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(diagnostic);
      return diagnostic;
    }

    function captureIntent(input = {}) {
      const source = objectRecord(input);
      const generation = clampString(source.generation || options.generation);
      const eventId = clampString(source.eventId || source.id);
      const action = clampString(source.action || source.command);
      if (!generation || (!eventId && !action)) {
        publish(createDiagnostic(
          'rmt.resume.intent_invalid',
          'warning',
          'Pre-boot intent requires generation and a declared event or action.',
          { generation, eventId, action }
        ));
        return null;
      }
      if (queuedIntents.length >= RMT_RESUME_MAX_INTENTS) {
        publish(createDiagnostic(
          'rmt.resume.intent_queue_full',
          'warning',
          `Pre-boot intent queue rejected an entry after ${RMT_RESUME_MAX_INTENTS} records.`,
          { generation, eventId, action }
        ));
        return null;
      }
      const intent = Object.freeze({
        schema: RMT_RESUME_INTENT_SCHEMA,
        sequence: queuedIntents.length,
        generation,
        eventId,
        action,
        surfaceId: clampString(source.surfaceId || source.surface),
        eventType: clampString(source.eventType || source.event),
        payload: cloneSafe(source.payload, {}),
        capturedAt: Number.isFinite(source.capturedAt) ? source.capturedAt : now()
      });
      queuedIntents.push(intent);
      return intent;
    }

    function installPrebootCapture(root, eventRecords = [], captureOptions = {}) {
      if (!root || typeof root.addEventListener !== 'function') {
        return Object.freeze({ status: 'unavailable', dispose() {}, snapshot: () => [] });
      }
      const records = toArray(eventRecords).filter((record) => record && record.event);
      const listeners = [];
      const generation = clampString(captureOptions.generation || options.generation || (root.getAttribute && root.getAttribute('data-rmt-resume-generation')));
      const eventTypes = [...new Set(records.map((record) => clampString(record.event)).filter(Boolean))];
      eventTypes.forEach((eventType) => {
        const listener = (event) => {
          const candidates = records.filter((record) => record.event === eventType);
          for (const record of candidates) {
            const selector = clampString(record.selector);
            const target = event && event.target;
            const matched = selector && target && typeof target.closest === 'function' ? target.closest(selector) : target;
            if (!matched) continue;
            const payload = typeof captureOptions.mapPayload === 'function'
              ? captureOptions.mapPayload(record, event, matched)
              : {
                  value: matched && Object.prototype.hasOwnProperty.call(matched, 'value') ? matched.value : undefined,
                  detail: cloneSafe(event && event.detail, null)
                };
            captureIntent({
              generation,
              eventId: record.id,
              action: record.action,
              surfaceId: record.surface || record.owner,
              eventType,
              payload
            });
            break;
          }
        };
        root.addEventListener(eventType, listener, { capture: true, passive: eventType !== 'submit' });
        listeners.push([eventType, listener]);
      });
      return Object.freeze({
        status: 'capturing',
        generation,
        snapshot: () => queuedIntents.slice(),
        dispose() {
          listeners.forEach(([eventType, listener]) => root.removeEventListener(eventType, listener, { capture: true }));
          listeners.length = 0;
        }
      });
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
      if (replayPolicy.mode !== 'intent_queue' || replayPolicy.replayExactlyOnce !== true || replayPolicy.generation !== envelope.generation) reasons.push('event_replay_policy_mismatch');
      const expiresAt = Date.parse(envelope.expiresAt || '');
      if (!Number.isFinite(expiresAt) || expiresAt <= now()) reasons.push('expired');
      if (!root) reasons.push('root_missing');
      const rootId = root && typeof root.getAttribute === 'function'
        ? clampString(root.getAttribute('id'))
        : '';
      if (rootId && rootId !== envelope.rootId) reasons.push('root_mismatch');
      const rootGeneration = root && typeof root.getAttribute === 'function'
        ? clampString(root.getAttribute('data-rmt-resume-generation'))
        : '';
      if (rootGeneration && rootGeneration !== envelope.generation) reasons.push('generation_mismatch');
      if (reasons.length > 0) return { ok: false, reasons };

      const verifier = callOptions.verify || callOptions.verifyResumeEnvelope || options.verify || options.verifyResumeEnvelope;
      if (typeof verifier !== 'function') return { ok: false, reasons: ['verifier_missing'] };
      try {
        const canonicalPayload = canonicalizeRmtResumePayload(unsignedEnvelope(envelope));
        const envelopeDigest = await verifyEnvelopeDigest(canonicalPayload, envelope.integrity, callOptions, options);
        if (!envelopeDigest.ok) return { ok: false, reasons: [envelopeDigest.reason], verdict: { envelopeDigest } };
        const verdict = await verifier(canonicalPayload, cloneSafe(envelope.integrity, {}), cloneSafe(envelope, {}));
        const accepted = verdict === true || verdict && verdict.ok === true || verdict && verdict.verified === true;
        if (!accepted) return { ok: false, reasons: [verdict && verdict.reason || 'signature_invalid'], verdict: cloneSafe(verdict, null) };
        const dom = await verifyDomDigest(envelope, root, callOptions, options);
        return dom.ok
          ? { ok: true, reasons: [], verdict: { ...cloneSafe(verdict, { verified: true }), envelopeDigest, domDigest: dom } }
          : { ok: false, reasons: [dom.reason || 'dom_digest_mismatch'], verdict: { ...cloneSafe(verdict, { verified: true }), envelopeDigest, domDigest: dom } };
      } catch (error) {
        return { ok: false, reasons: ['verification_failed'], error };
      }
    }

    function restoreState(envelope, callOptions) {
      const snapshot = objectRecord(envelope.snapshot);
      const state = objectRecord(snapshot.state);
      const restore = callOptions.restoreState || options.restoreState;
      if (typeof restore === 'function') {
        const result = restore(cloneSafe(state, {}), cloneSafe(snapshot, {}), envelope);
        return { count: Object.keys(state).length, result };
      }
      const stateRuntime = callOptions.stateRuntime || options.stateRuntime;
      if (!stateRuntime || typeof stateRuntime.setState !== 'function') return { count: 0, result: null };
      const knownStates = new Set(toArray(stateRuntime.stateDefinitions).map((definition) => definition && definition.id).filter(Boolean));
      let count = 0;
      Object.entries(state).forEach(([id, value]) => {
        if (knownStates.size > 0 && !knownStates.has(id)) return;
        stateRuntime.setState(id, cloneSafe(value, value), { operation: 'server-resume', generation: envelope.generation });
        count += 1;
      });
      return { count, result: null };
    }

    function resolveAdopter(adopters, record) {
      if (adopters instanceof Map) return adopters.get(record.id || record.key || record.surfaceId) || null;
      if (Array.isArray(adopters)) {
        return adopters.find((entry) => entry && (entry.id === record.id || entry.key === record.key || entry.surfaceId === record.surfaceId)) || null;
      }
      return objectRecord(adopters)[record.id || record.key || record.surfaceId] || null;
    }

    async function adoptXtensions(envelope, root, callOptions) {
      const records = toArray(envelope.xtensions);
      const adopters = callOptions.adopters || options.adopters || {};
      const results = [];
      for (const record of records) {
        const adopter = resolveAdopter(adopters, objectRecord(record));
        const adopt = typeof adopter === 'function' ? adopter : adopter && adopter.adopt;
        if (typeof adopt !== 'function') {
          throw Object.assign(new Error(`Missing resume adopter for ${record.id || record.key || record.surfaceId || 'unknown XTension'}.`), {
            code: 'rmt.resume.xtension_adopter_missing'
          });
        }
        const result = await adopt({
          schema: RMT_RESUME_ADAPTER_SCHEMA,
          root,
          record: cloneSafe(record, {}),
          generation: envelope.generation,
          snapshot: cloneSafe(envelope.snapshot, {}),
          envelope: cloneSafe(envelope, {})
        });
        if (!result || result.ok === false || !['resumed', 'dom_hydrated', 'host_activated'].includes(result.status)) {
          throw Object.assign(new Error(`Resume adopter rejected ${record.id || record.key || record.surfaceId || 'XTension'}.`), {
            code: 'rmt.resume.xtension_adoption_failed',
            result
          });
        }
        results.push(result);
      }
      return results;
    }

    async function replayIntents(envelope, callOptions) {
      const replay = callOptions.replayIntent || options.replayIntent;
      const inputQueue = toArray(callOptions.intentQueue || queuedIntents);
      const queue = inputQueue.filter((intent) => intent && intent.generation === envelope.generation);
      if (typeof replay !== 'function') return { count: 0, results: [] };
      const results = [];
      for (const intent of queue) results.push(await replay(cloneSafe(intent, {}), envelope));
      if (!callOptions.intentQueue) queuedIntents.splice(0, queuedIntents.length);
      return { count: results.length, results };
    }

    async function hydrateFallback(response, request, envelope, root, verification, callOptions) {
      const key = `${envelope.rootId || response.rootId || 'root'}:${envelope.generation || 'unknown'}`;
      if (fallbackGenerations.has(key)) {
        return {
          schema: RMT_RESUME_RESULT_SCHEMA,
          ok: false,
          status: 'rejected',
          verified: false,
          fallbackAttempted: false,
          fallbackHydrated: false,
          reasons: verification.reasons.concat('fallback_already_attempted'),
          rootPreserved: true
        };
      }
      fallbackGenerations.add(key);
      const hydrate = callOptions.hydrateResponse || options.hydrateResponse;
      if (typeof hydrate !== 'function') {
        return {
          schema: RMT_RESUME_RESULT_SCHEMA,
          ok: false,
          status: 'rejected',
          verified: false,
          fallbackAttempted: true,
          fallbackHydrated: false,
          reasons: verification.reasons.concat('hydrate_fallback_missing'),
          rootPreserved: true
        };
      }
      const fallback = await hydrate(response, request, {
        ...callOptions,
        root,
        executionMode: 'server_prerender_hydrate',
        resumeRejected: true,
        resumeReasons: verification.reasons.slice()
      });
      const hydrated = fallback !== false && (!fallback || fallback.ok !== false);
      return {
        schema: RMT_RESUME_RESULT_SCHEMA,
        ok: hydrated,
        status: hydrated ? 'fallback_hydrated' : 'rejected',
        verified: false,
        fallbackAttempted: true,
        fallbackHydrated: hydrated,
        fallback,
        reasons: verification.reasons.slice(),
        rootPreserved: true
      };
    }

    async function resumeResponse(responseInput = {}, requestInput = {}, callOptions = {}) {
      const response = normalizeResponse(responseInput);
      const envelope = normalizeEnvelope(responseInput.resume || response.resume || responseInput);
      const root = resolveRoot(envelope, response, callOptions);
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
      const verification = await verifyEnvelope(envelope, root, callOptions);
      if (!verification.ok) {
        const result = await hydrateFallback(response, requestInput, envelope, root, verification, callOptions);
        history.push(cloneSafe(result, {}));
        publish(createDiagnostic(
          'rmt.resume.rejected',
          result.status === 'fallback_hydrated' ? 'warning' : 'error',
          `Resume was rejected: ${verification.reasons.join(', ')}.`,
          { status: result.status, reasons: verification.reasons }
        ));
        return Object.freeze(result);
      }

      const rootReference = root;
      try {
        const restored = restoreState(envelope, callOptions);
        if (restored.result && typeof restored.result.then === 'function') await restored.result;
        let nativeResult = null;
        if (typeof callOptions.adoptRoot === 'function') {
          nativeResult = await callOptions.adoptRoot(root, envelope, response);
        } else if (typeof options.adoptRoot === 'function') {
          nativeResult = await options.adoptRoot(root, envelope, response);
        }
        const xtensions = await adoptXtensions(envelope, root, callOptions);
        const replay = await replayIntents(envelope, callOptions);
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
        publish(createDiagnostic(
          'rmt.resume.adoption_failed',
          result.status === 'fallback_hydrated' ? 'warning' : 'error',
          error && error.message ? error.message : 'Resume adoption failed.',
          { status: result.status }
        ));
        return Object.freeze(result);
      }
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

    return Object.freeze({
      schema: RMT_RESUME_RUNTIME_SCHEMA,
      captureIntent,
      installPrebootCapture,
      resumeResponse,
      resumeTemplate,
      listDiagnostics: () => diagnostics.slice(),
      listHistory: () => history.slice(),
      snapshot: () => ({
        schema: 'xtend.rmt.resume-runtime-snapshot.v1',
        queuedIntentCount: queuedIntents.length,
        consumedGenerations: Array.from(consumedGenerations),
        fallbackGenerations: Array.from(fallbackGenerations),
        history: history.slice(),
        diagnostics: diagnostics.slice()
      })
    });
  }

  const api = Object.freeze({
    RMT_RESUME_RUNTIME_SCHEMA,
    RMT_RESUME_ENVELOPE_SCHEMA,
    RMT_RESUME_RESULT_SCHEMA,
    RMT_RESUME_INTENT_SCHEMA,
    RMT_RESUME_ADAPTER_SCHEMA,
    RMT_RESUME_MAX_INTENTS,
    canonicalizeRmtResumePayload,
    createRmtResumeRuntime,
    installRmtPrebootIntentCapture(root, events, options = {}) {
      return createRmtResumeRuntime(options).installPrebootCapture(root, events, options);
    },
    resumeResponse(response, request = {}, options = {}) {
      return createRmtResumeRuntime(options).resumeResponse(response, request, options);
    },
    resumeTemplate(request, options = {}) {
      return createRmtResumeRuntime(options).resumeTemplate(request, options);
    }
  });

  if (globalTarget) globalTarget.XTendRmtResumeRuntime = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

const __XTEND_RMT_RESUME_RUNTIME_API__ = globalThis.XTendRmtResumeRuntime;

export const RMT_RESUME_RUNTIME_SCHEMA = __XTEND_RMT_RESUME_RUNTIME_API__.RMT_RESUME_RUNTIME_SCHEMA;
export const RMT_RESUME_ENVELOPE_SCHEMA = __XTEND_RMT_RESUME_RUNTIME_API__.RMT_RESUME_ENVELOPE_SCHEMA;
export const RMT_RESUME_RESULT_SCHEMA = __XTEND_RMT_RESUME_RUNTIME_API__.RMT_RESUME_RESULT_SCHEMA;
export const RMT_RESUME_INTENT_SCHEMA = __XTEND_RMT_RESUME_RUNTIME_API__.RMT_RESUME_INTENT_SCHEMA;
export const RMT_RESUME_ADAPTER_SCHEMA = __XTEND_RMT_RESUME_RUNTIME_API__.RMT_RESUME_ADAPTER_SCHEMA;
export const RMT_RESUME_MAX_INTENTS = __XTEND_RMT_RESUME_RUNTIME_API__.RMT_RESUME_MAX_INTENTS;
export const canonicalizeRmtResumePayload = __XTEND_RMT_RESUME_RUNTIME_API__.canonicalizeRmtResumePayload;
export const createRmtResumeRuntime = __XTEND_RMT_RESUME_RUNTIME_API__.createRmtResumeRuntime;
export const installRmtPrebootIntentCapture = __XTEND_RMT_RESUME_RUNTIME_API__.installRmtPrebootIntentCapture;
export const resumeResponse = __XTEND_RMT_RESUME_RUNTIME_API__.resumeResponse;
export const resumeTemplate = __XTEND_RMT_RESUME_RUNTIME_API__.resumeTemplate;

export default __XTEND_RMT_RESUME_RUNTIME_API__;

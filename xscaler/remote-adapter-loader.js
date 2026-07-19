'use strict';

const {
  XSCALER_ATC_HANDOFF_SCHEMA,
  XSCALER_PREFLIGHT_RESPONSE_SCHEMA,
  XSCALER_PROTOCOL,
  XSCALER_REMOTE_SURFACE_PLAN_SCHEMA,
  createXScalerAtcHandoff,
  createXScalerPreflightRequest,
  createXScalerRemoteSurfacePlan,
  evaluateXScalerPreflight
} = require('./protocol');

const XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA = 'xtend.xscaler.remote-adapter-loader.v1';
const XSCALER_REMOTE_ADAPTER_LOAD_RESULT_SCHEMA = 'xtend.xscaler.remote-adapter-load-result.v1';
const XSCALER_REMOTE_ADAPTER_SESSION_SCHEMA = 'xtend.xscaler.remote-adapter-session.v1';
const XSCALER_REMOTE_ADAPTER_LOADER_SNAPSHOT_SCHEMA = 'xtend.xscaler.remote-adapter-loader-snapshot.v1';
const XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA = 'xtend.xscaler.remote-adapter-registration.v1';

const XSCALER_REMOTE_SURFACE_REQUIRED_CODE = 'xscaler.loader.remote_surface_required';
const XSCALER_REMOTE_URL_INVALID_CODE = 'xscaler.loader.remote_url_invalid';
const XSCALER_REMOTE_ORIGIN_MISMATCH_CODE = 'xscaler.loader.origin_mismatch';
const XSCALER_REMOTE_INTEGRITY_INVALID_CODE = 'xscaler.loader.integrity_invalid';
const XSCALER_REMOTE_PREFLIGHT_INVALID_CODE = 'xscaler.loader.preflight_invalid';
const XSCALER_REMOTE_PREFLIGHT_REJECTED_CODE = 'xscaler.loader.preflight_rejected';
const XSCALER_REMOTE_LOADER_UNSAFE_CODE = 'xscaler.loader.external_loader_unsafe';
const XSCALER_REMOTE_LOAD_FAILED_CODE = 'xscaler.loader.load_failed';
const XSCALER_REMOTE_ADAPTER_INVALID_CODE = 'xscaler.loader.adapter_invalid';
const XSCALER_REMOTE_LIFECYCLE_FAILED_CODE = 'xscaler.loader.lifecycle_failed';
const XSCALER_REMOTE_SESSION_NOT_FOUND_CODE = 'xscaler.loader.session_not_found';
const XSCALER_REMOTE_SESSION_ACTIVE_CODE = 'xscaler.loader.session_active';
const XSCALER_REMOTE_SESSION_ID_CONFLICT_CODE = 'xscaler.loader.session_id_conflict';
const XSCALER_REMOTE_OPERATION_INVALID_CODE = 'xscaler.loader.operation_invalid';
const XSCALER_REMOTE_OPERATION_FAILED_CODE = 'xscaler.loader.operation_failed';
const XSCALER_REMOTE_CANCELLED_CODE = 'xscaler.loader.cancelled';
const XSCALER_REMOTE_LOADER_DISPOSED_CODE = 'xscaler.loader.disposed';
const XSCALER_REMOTE_FALLBACK_ACTIVATION_FAILED_CODE = 'xscaler.loader.fallback_activation_failed';

const TERMINAL_STATES = new Set(['refused', 'failed', 'cancelled', 'detached', 'disposed']);
const SAFE_ERROR_NAMES = new Set(['AbortError', 'Error', 'NetworkError', 'SecurityError', 'TimeoutError', 'TypeError']);
const SRI_PATTERN = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})$/u;
const SRI_DIGEST_PATTERNS = Object.freeze({
  sha256: /^[A-Za-z0-9+/]{43}=$/u,
  sha384: /^[A-Za-z0-9+/]{64}$/u,
  sha512: /^[A-Za-z0-9+/]{86}==$/u
});
const REMOTE_ADAPTER_REGISTRATION_SYMBOL = Symbol.for(XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA);

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeString(value, fallback = '') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function cloneJson(value, fallback = null) {
  if (value === undefined || value === null) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
}

function diagnostic(code, message, severity = 'error', extra = {}) {
  return Object.freeze({ code, severity, message, ...cloneJson(extra, {}) });
}

function normalizeError(error) {
  const name = normalizeString(error && error.name, 'Error');
  return { name: SAFE_ERROR_NAMES.has(name) ? name : 'Error' };
}

function abortError(reason = 'cancelled') {
  const error = new Error(normalizeString(reason, 'cancelled'));
  error.name = 'AbortError';
  return error;
}

function remoteAdapterError(code, message) {
  const error = new Error(message);
  error.name = 'XScalerRemoteAdapterError';
  error.code = code;
  return error;
}

function normalizedOrigin(value) {
  try {
    const parsed = new URL(normalizeString(value));
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
    return parsed.origin;
  } catch (_error) {
    return null;
  }
}

function normalizedRemoteUrl(value) {
  try {
    const parsed = new URL(normalizeString(value));
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) return null;
    return parsed.href;
  } catch (_error) {
    return null;
  }
}

function normalizeSri(integrity = {}) {
  const algorithm = normalizeString(integrity.algorithm).toLowerCase();
  const digest = normalizeString(integrity.digest);
  const match = SRI_PATTERN.exec(digest);
  if (!match || match[1] !== algorithm || !SRI_DIGEST_PATTERNS[algorithm].test(match[2])) return null;
  return digest;
}

function normalizeSriDigest(value) {
  const digest = normalizeString(value);
  const match = SRI_PATTERN.exec(digest);
  if (!match || !SRI_DIGEST_PATTERNS[match[1]].test(match[2])) return null;
  return digest;
}

function remoteSurfaceId(plan) {
  const explicit = normalizeString(plan && plan.surfaceId);
  if (explicit.startsWith('remoteSurface:')) return explicit;
  const surface = normalizeString(plan && plan.surface, explicit || 'unknown').replace(/^remoteSurface:/u, '');
  return `remoteSurface:${surface}`;
}

function validateRemoteFacts(input = {}) {
  const diagnostics = [];
  const rawPlan = input.remoteSurfacePlan || input.plan || null;
  if (!rawPlan || rawPlan.schema !== XSCALER_REMOTE_SURFACE_PLAN_SCHEMA || rawPlan.protocol !== XSCALER_PROTOCOL) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_SURFACE_REQUIRED_CODE,
      `XScaler remote adapter loading requires ${XSCALER_REMOTE_SURFACE_PLAN_SCHEMA}.`
    ));
    return { diagnostics, plan: null, surfaceId: '', url: '', integrity: '' };
  }

  const rawBoundary = isPlainObject(rawPlan.runtimeBoundary) ? rawPlan.runtimeBoundary : {};
  const declaredSurfaceId = normalizeString(rawPlan.surfaceId);
  if (
    !/^remoteSurface:.+/u.test(declaredSurfaceId)
    || rawBoundary.remoteRuntimeExecution !== false
    || rawBoundary.kernelRemoteExecution !== false
    || rawBoundary.networkRequiredByKernel !== false
  ) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_SURFACE_REQUIRED_CODE,
      'XScaler loading requires a remoteSurface:* id and the kernel no-remote-execution boundary.'
    ));
  }

  const plan = createXScalerRemoteSurfacePlan(rawPlan);
  const surfaceId = remoteSurfaceId(plan);
  const origin = normalizedOrigin(plan.origin);
  const url = normalizedRemoteUrl(input.adapterUrl || input.url || rawPlan.adapterUrl || rawPlan.moduleUrl);
  const integrity = normalizeSri(plan.integrity);

  if (!origin || !url) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_URL_INVALID_CODE,
      'XScaler remote adapters require absolute credential-free HTTPS URLs without fragments.',
      'error',
      { origin: plan.origin || '', adapterUrl: normalizeString(input.adapterUrl || input.url || rawPlan.adapterUrl || rawPlan.moduleUrl) }
    ));
  } else if (new URL(url).origin !== origin) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_ORIGIN_MISMATCH_CODE,
      'Remote adapter URL origin does not match the preflighted remote surface origin.',
      'error',
      { expectedOrigin: origin, actualOrigin: new URL(url).origin }
    ));
  }

  if (!integrity) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_INTEGRITY_INVALID_CODE,
      'Remote adapter loading requires a valid matching sha256, sha384 or sha512 SRI digest.'
    ));
  }

  return { diagnostics, plan, surfaceId, url: url || '', integrity: integrity || '' };
}

function externalLoaderCapabilities(loader, options = {}) {
  const declared = isPlainObject(options.externalLoaderCapabilities)
    ? options.externalLoaderCapabilities
    : (isPlainObject(loader && loader.xscalerCapabilities) ? loader.xscalerCapabilities : {});
  return {
    cspSafe: declared.cspSafe === true,
    sri: declared.sri === true,
    externalOnly: declared.externalOnly === true
  };
}

function registrationTarget(options, documentTarget) {
  if (options.registrationTarget && (typeof options.registrationTarget === 'object' || typeof options.registrationTarget === 'function')) {
    return options.registrationTarget;
  }
  if (documentTarget && documentTarget.defaultView) return documentTarget.defaultView;
  return typeof globalThis !== 'undefined' ? globalThis : null;
}

function createRemoteAdapterRegistrationBroker(target) {
  if (!target) return null;
  const existing = target[REMOTE_ADAPTER_REGISTRATION_SYMBOL];
  if (existing && existing.schema === XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA && typeof existing.open === 'function' && typeof existing.register === 'function') {
    return existing;
  }
  if (existing !== undefined) return null;
  const waiters = new Map();
  const broker = Object.freeze({
    schema: XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA,
    open(descriptor = {}) {
      const sessionId = normalizeString(descriptor.sessionId);
      const surfaceId = normalizeString(descriptor.surfaceId);
      if (!sessionId || !surfaceId || waiters.has(sessionId)) return null;
      const waiter = { sessionId, surfaceId, adapter: null };
      waiters.set(sessionId, waiter);
      return Object.freeze({
        consume() {
          if (waiters.get(sessionId) !== waiter) return null;
          waiters.delete(sessionId);
          return waiter.adapter;
        },
        close() {
          if (waiters.get(sessionId) !== waiter) return false;
          waiters.delete(sessionId);
          return true;
        }
      });
    },
    register(registration = {}) {
      if (!registration || registration.schema !== XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA || !validateAdapter(registration.adapter)) return false;
      const sessionId = normalizeString(registration.sessionId);
      const surfaceId = normalizeString(registration.surfaceId);
      let waiter = sessionId ? waiters.get(sessionId) || null : null;
      if (!waiter && surfaceId) {
        const candidates = Array.from(waiters.values()).filter((entry) => entry.surfaceId === surfaceId);
        if (candidates.length === 1) waiter = candidates[0];
      }
      if (!waiter || waiter.adapter || surfaceId && waiter.surfaceId !== surfaceId) return false;
      waiter.adapter = registration.adapter;
      return true;
    }
  });
  try {
    Object.defineProperty(target, REMOTE_ADAPTER_REGISTRATION_SYMBOL, {
      value: broker,
      configurable: true,
      enumerable: false,
      writable: false
    });
  } catch (_error) {
    return null;
  }
  return broker;
}

function registerXScalerRemoteAdapter(registration = {}, target = typeof globalThis !== 'undefined' ? globalThis : null) {
  const broker = target && target[REMOTE_ADAPTER_REGISTRATION_SYMBOL];
  if (!broker || broker.schema !== XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA || typeof broker.register !== 'function') return false;
  return broker.register(Object.freeze({
    schema: XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA,
    sessionId: normalizeString(registration.sessionId),
    surfaceId: normalizeString(registration.surfaceId || registration.surface),
    adapter: registration.adapter
  })) === true;
}

function createBrowserExternalModuleLoader(options = {}) {
  const documentTarget = options.documentTarget || (typeof document !== 'undefined' ? document : null);
  const adapterRegistrationTarget = registrationTarget(options, documentTarget);
  const load = function loadExternalXScalerModule(descriptor = {}) {
    const url = normalizedRemoteUrl(descriptor.url);
    const integrity = normalizeSriDigest(descriptor.integrity);
    if (!url || !integrity) {
      return Promise.reject(new Error('XScaler external module descriptor requires an HTTPS URL and a complete SRI digest.'));
    }
    if (!documentTarget || typeof documentTarget.createElement !== 'function') {
      return Promise.reject(new Error('A browser document is required for the default XScaler external module loader.'));
    }
    const parent = documentTarget.head || documentTarget.documentElement;
    if (!parent || typeof parent.appendChild !== 'function') {
      return Promise.reject(new Error('The browser document has no safe external script attachment point.'));
    }
    const registrationBroker = createRemoteAdapterRegistrationBroker(adapterRegistrationTarget);
    const registration = registrationBroker && registrationBroker.open(descriptor);
    if (!registration) {
      return Promise.reject(new Error('XScaler external module loading requires a unique session-bound adapter registration slot.'));
    }

    return new Promise((resolve, reject) => {
      const script = documentTarget.createElement('script');
      let settled = false;
      const signal = descriptor.signal || null;
      const cleanupListeners = () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        if (signal && typeof signal.removeEventListener === 'function') signal.removeEventListener('abort', onAbort);
      };
      const remove = () => {
        if (script && typeof script.remove === 'function') script.remove();
        else if (script && script.parentNode && typeof script.parentNode.removeChild === 'function') script.parentNode.removeChild(script);
      };
      const finish = (callback) => {
        if (settled) return;
        settled = true;
        cleanupListeners();
        callback();
      };
      const onLoad = () => finish(() => {
        const adapter = registration.consume();
        if (!validateAdapter(adapter)) {
          remove();
          reject(new Error('XScaler remote adapter module loaded without registering its session adapter.'));
          return;
        }
        resolve(Object.freeze({ adapter, element: script, remove }));
      });
      const onError = () => finish(() => {
        registration.close();
        remove();
        reject(new Error(`XScaler remote adapter module failed to load: ${descriptor.url}`));
      });
      const onAbort = () => finish(() => {
        registration.close();
        remove();
        reject(abortError(signal && signal.reason));
      });

      script.type = 'module';
      script.async = true;
      script.src = url;
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      if (descriptor.nonce) script.nonce = descriptor.nonce;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      if (signal && typeof signal.addEventListener === 'function') signal.addEventListener('abort', onAbort, { once: true });
      if (signal && signal.aborted) {
        onAbort();
        return;
      }
      try {
        parent.appendChild(script);
      } catch (error) {
        registration.close();
        remove();
        finish(() => reject(error));
      }
    });
  };
  Object.defineProperty(load, 'xscalerCapabilities', {
    value: Object.freeze({ cspSafe: true, sri: true, externalOnly: true }),
    enumerable: true
  });
  return load;
}

function validateAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') return false;
  return ['attach', 'cancel', 'detach', 'dispose'].every((method) => typeof adapter[method] === 'function');
}

function blockingDiagnostics(value) {
  return toArray(value && value.diagnostics).filter((entry) => entry && (entry.severity === 'error' || entry.status === 'blocked'));
}

function validatePreflightResponse(response, request, facts) {
  const diagnostics = [];
  if (!response || response.schema !== XSCALER_PREFLIGHT_RESPONSE_SCHEMA || response.protocol !== XSCALER_PROTOCOL) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      `Remote adapter preflight must return ${XSCALER_PREFLIGHT_RESPONSE_SCHEMA}.`
    ));
    return diagnostics;
  }
  if (response.requestId !== request.requestId) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Remote adapter preflight response requestId does not match the request.',
      'error',
      { expectedRequestId: request.requestId, actualRequestId: response.requestId }
    ));
  }
  if (response.accepted !== response.ok) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Remote adapter preflight accepted and ok fields must be identical.'
    ));
  }
  if (!Array.isArray(response.diagnostics) || !Array.isArray(response.requiredAnchors)) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Remote adapter preflight response diagnostics and required anchors must be arrays.'
    ));
  }
  if (response.surface !== request.surface || response.surface !== facts.plan.surface) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Remote adapter preflight response surface does not match the requested surface.'
    ));
  }
  if (response.accepted === true && blockingDiagnostics(response).length > 0) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Accepted remote adapter preflight responses may not contain blocking diagnostics.'
    ));
  }
  const responsePlan = response.remoteSurfacePlan;
  if (response.accepted === true && (!responsePlan || responsePlan.schema !== XSCALER_REMOTE_SURFACE_PLAN_SCHEMA || responsePlan.protocol !== XSCALER_PROTOCOL)) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Accepted remote adapter preflight responses require a canonical remote surface plan.'
    ));
  } else if (response.accepted === true) {
    const rawBoundary = isPlainObject(responsePlan.runtimeBoundary) ? responsePlan.runtimeBoundary : {};
    const normalized = createXScalerRemoteSurfacePlan(responsePlan);
    if (
      !isPlainObject(responsePlan.runtimeBoundary)
      || rawBoundary.remoteRuntimeExecution !== false
      || rawBoundary.kernelRemoteExecution !== false
      || rawBoundary.networkRequiredByKernel !== false
      || normalized.ssr.networkDuringRender === true
      || JSON.stringify(normalized) !== JSON.stringify(facts.plan)
    ) {
      diagnostics.push(diagnostic(
        XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
        'Accepted remote adapter preflight response changed preflighted plan or runtime-boundary facts.'
      ));
    }
  }
  if (response.accepted === true && (
    response.rejection !== null
    || !isPlainObject(response.compatibility)
    || response.compatibility.ssr !== 'compatible'
    || response.compatibility.remoteSurfacePlan !== 'required'
    || response.compatibility.xtensionDeployment !== 'allowed'
    || !response.atc
    || response.atc.schema !== XSCALER_ATC_HANDOFF_SCHEMA
    || response.atc.protocol !== XSCALER_PROTOCOL
    || response.atc.accepted !== true
    || response.atc.ok !== true
    || response.atc.status === 'refused'
    || response.atc.surfaceId !== facts.surfaceId
    || blockingDiagnostics(response.atc).length > 0
    || !isPlainObject(response.atc.runtimeBoundary)
    || response.atc.runtimeBoundary.remoteRuntimeExecution !== false
    || response.atc.runtimeBoundary.kernelRemoteExecution !== false
    || response.atc.runtimeBoundary.networkRequiredByHandoff !== false
  )) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Accepted remote adapter preflight response requires a canonical no-remote-kernel ATC handoff.'
    ));
  }
  if (response.accepted === false && (!response.rejection || !normalizeString(response.rejection.code))) {
    diagnostics.push(diagnostic(
      XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
      'Rejected remote adapter preflight responses require a rejection code.'
    ));
  }
  return diagnostics;
}

function createXScalerRemoteAdapterLoader(options = {}) {
  const sessions = new Map();
  const latestSessionBySurface = new Map();
  const registeredAdapters = new Map();
  const history = [];
  const counters = {
    preflight: 0,
    accepted: 0,
    rejected: 0,
    loadAttempts: 0,
    loaded: 0,
    attached: 0,
    cancelled: 0,
    detached: 0,
    disposed: 0
  };
  let sequence = 0;
  let disposed = false;

  const externalLoader = options.loadExternalAdapter || createBrowserExternalModuleLoader(options);
  const loaderCapabilities = externalLoaderCapabilities(externalLoader, options);

  function nextSessionId(surfaceId) {
    sequence += 1;
    return `xscaler:${surfaceId}:${sequence}`;
  }

  function sessionSnapshot(session) {
    if (!session) return null;
    return {
      schema: XSCALER_REMOTE_ADAPTER_SESSION_SCHEMA,
      id: session.id,
      surfaceId: session.surfaceId,
      state: session.state,
      adapterUrl: session.url,
      integrity: session.integrity,
      preflightAccepted: Boolean(session.preflight && session.preflight.accepted === true),
      loadAttempted: session.loadAttempted,
      loaded: session.loaded,
      adapterExecutionAttempted: session.adapterExecutionAttempted,
      adapterAttached: session.adapterAttached,
      adapterDisposed: session.adapterDisposed,
      fallbackActivationAttempted: session.fallbackActivationAttempted === true,
      fallbackActivated: session.fallbackActivated === true,
      runtimeBoundary: {
        remoteRuntimeExecution: false,
        kernelRemoteExecution: false,
        networkRequiredByKernel: false
      },
      diagnostics: session.diagnostics.map((entry) => cloneJson(entry, {}))
    };
  }

  function createResult(session, status, resultOptions = {}) {
    const succeeded = resultOptions.ok !== undefined
      ? resultOptions.ok === true
      : ['attached', 'cancelled', 'detached', 'disposed'].includes(status);
    const accepted = Boolean(session && session.preflight && session.preflight.accepted === true);
    const diagnostics = session ? session.diagnostics.slice() : toArray(resultOptions.diagnostics);
    const handoffSignal = resultOptions.handoffSignal || ({
      attached: 'attach',
      cancelled: 'cancel',
      detached: 'detach',
      disposed: 'dispose'
    }[status] || 'refuse');
    const fallbackSurface = session && session.plan && session.plan.fallbackSurface
      || normalizeString(resultOptions.fallbackSurface);
    const atc = createXScalerAtcHandoff({
      surfaceId: session && session.surfaceId || resultOptions.surfaceId || 'remoteSurface:unknown',
      sessionId: session && session.id || resultOptions.sessionId,
      handoffSignal,
      lifecycleState: status,
      status: succeeded && accepted ? (status === 'attached' ? 'ready' : status) : 'refused',
      accepted: succeeded && accepted,
      fallback: fallbackSurface
        ? { surface: fallbackSurface }
        : null,
      diagnostics
    });
    const result = Object.freeze({
      schema: XSCALER_REMOTE_ADAPTER_LOAD_RESULT_SCHEMA,
      ok: succeeded,
      status,
      surfaceId: session && session.surfaceId || resultOptions.surfaceId || '',
      sessionId: session && session.id || resultOptions.sessionId || '',
      preflight: session && session.preflight ? cloneJson(session.preflight, null) : null,
      loadAttempted: Boolean(session && session.loadAttempted),
      loaded: Boolean(session && session.loaded),
      adapterExecuted: Boolean(session && session.adapterExecutionAttempted),
      atc,
      runtimeBoundary: {
        remoteRuntimeExecution: false,
        kernelRemoteExecution: false,
        networkRequiredByKernel: false
      },
      diagnostics: diagnostics.map((entry) => cloneJson(entry, {})),
      session: sessionSnapshot(session)
    });
    history.push({
      status: result.status,
      surfaceId: result.surfaceId,
      sessionId: result.sessionId,
      loadAttempted: result.loadAttempted,
      loaded: result.loaded
    });
    return result;
  }

  async function createFailureResult(session, status, resultOptions = {}, attachInput = {}) {
    const nextOptions = {
      ...resultOptions,
      diagnostics: toArray(resultOptions.diagnostics).slice()
    };
    const fallbackSurface = session && session.plan && session.plan.fallbackSurface
      || normalizeString(nextOptions.fallbackSurface);
    const activateFallback = options.activateFallback;
    const alreadyAttempted = Boolean(session && session.fallbackActivationAttempted);
    if (fallbackSurface && typeof activateFallback === 'function' && !alreadyAttempted) {
      if (session) session.fallbackActivationAttempted = true;
      try {
        const activation = await activateFallback(Object.freeze({
          schema: 'xtend.xscaler.surface-fallback-activation.v1',
          status,
          surfaceId: session && session.surfaceId || nextOptions.surfaceId || '',
          fallbackSurface,
          sessionId: session && session.id || nextOptions.sessionId || '',
          remoteSurfacePlan: cloneJson(session && session.plan || nextOptions.remoteSurfacePlan, null),
          preflight: cloneJson(session && session.preflight, null),
          hostContext: session && session.hostContext || attachInput.hostContext || null,
          diagnostics: (session ? session.diagnostics : nextOptions.diagnostics).map((entry) => cloneJson(entry, {}))
        }));
        if (activation === false) throw new Error('Host fallback activation returned false.');
        if (session) session.fallbackActivated = true;
      } catch (error) {
        const entry = diagnostic(
          XSCALER_REMOTE_FALLBACK_ACTIVATION_FAILED_CODE,
          `Host activation of fallback surface ${fallbackSurface} failed.`,
          'error',
          { fallbackSurface, error: normalizeError(error) }
        );
        if (session) session.diagnostics.push(entry);
        else nextOptions.diagnostics.push(entry);
      }
    }
    return createResult(session, status, nextOptions);
  }

  function createAbortedSessionResult(session) {
    let status = session.state;
    if (!['cancelled', 'detached', 'disposed'].includes(status)) {
      status = 'cancelled';
      session.state = status;
    }
    return createResult(session, status, {
      ok: true,
      handoffSignal: { cancelled: 'cancel', detached: 'detach', disposed: 'dispose' }[status]
    });
  }

  function findSession(reference) {
    if (reference && typeof reference === 'object') {
      const id = normalizeString(reference.sessionId || reference.id);
      if (id && sessions.has(id)) return sessions.get(id);
      reference = reference.surfaceId || reference.surface;
    }
    const key = normalizeString(reference);
    if (sessions.has(key)) return sessions.get(key);
    const sessionId = latestSessionBySurface.get(key) || latestSessionBySurface.get(key.startsWith('remoteSurface:') ? key : `remoteSurface:${key}`);
    return sessionId ? sessions.get(sessionId) || null : null;
  }

  function activeSessionForSurface(surfaceId) {
    const latest = findSession(surfaceId);
    return latest && !TERMINAL_STATES.has(latest.state) ? latest : null;
  }

  function removeLoadHandle(session) {
    const handle = session && session.loadHandle;
    if (!handle) return;
    try {
      if (typeof handle.remove === 'function') handle.remove();
      else if (handle.element && typeof handle.element.remove === 'function') handle.element.remove();
    } catch (_error) {}
    session.loadHandle = null;
  }

  async function invokeLifecycle(session, method, context = {}) {
    if (!session.adapter || typeof session.adapter[method] !== 'function') return null;
    if (method === 'dispose' && session.adapterDisposed) return null;
    if (method === 'dispose') session.adapterDisposed = true;
    session.adapterExecutionAttempted = true;
    try {
      return await session.adapter[method](Object.freeze({
        surfaceId: session.surfaceId,
        sessionId: session.id,
        remoteSurfacePlan: cloneJson(session.plan, {}),
        preflight: cloneJson(session.preflight, null),
        signal: session.controller.signal,
        ...context
      }));
    } catch (error) {
      session.diagnostics.push(diagnostic(
        XSCALER_REMOTE_LIFECYCLE_FAILED_CODE,
        `Remote adapter ${method} lifecycle failed.`,
        'error',
        { lifecycle: method, error: normalizeError(error) }
      ));
      return null;
    }
  }

  function requireAdapterOperation(reference, method) {
    const session = findSession(reference);
    if (!session || session.state !== 'attached' || !session.adapter || typeof session.adapter[method] !== 'function') {
      throw remoteAdapterError(
        XSCALER_REMOTE_OPERATION_INVALID_CODE,
        `Attached XScaler adapter operation ${method} is unavailable.`
      );
    }
    if (session.controller.signal.aborted) throw abortError(session.controller.signal.reason);
    return session;
  }

  function operationRequest(session, request = {}) {
    return Object.freeze({
      ...(isPlainObject(request) ? request : { input: request }),
      signal: session.controller.signal
    });
  }

  function operationContext(session) {
    return Object.freeze({
      surfaceId: session.surfaceId,
      sessionId: session.id,
      remoteSurfacePlan: cloneJson(session.plan, {}),
      preflight: cloneJson(session.preflight, null),
      signal: session.controller.signal,
      hostContext: session.hostContext
    });
  }

  async function invoke(reference, request = {}) {
    const session = requireAdapterOperation(reference, 'invoke');
    session.adapterExecutionAttempted = true;
    try {
      return await session.adapter.invoke(operationRequest(session, request), operationContext(session));
    } catch (error) {
      if (session.controller.signal.aborted) throw abortError(session.controller.signal.reason);
      session.diagnostics.push(diagnostic(
        XSCALER_REMOTE_OPERATION_FAILED_CODE,
        'Remote adapter AppService invocation failed.',
        'error',
        { lifecycle: 'invoke', error: normalizeError(error) }
      ));
      throw remoteAdapterError(XSCALER_REMOTE_OPERATION_FAILED_CODE, 'Remote adapter AppService invocation failed.');
    }
  }

  async function stream(reference, request = {}) {
    const session = requireAdapterOperation(reference, 'stream');
    session.adapterExecutionAttempted = true;
    let source;
    try {
      source = await session.adapter.stream(operationRequest(session, request), operationContext(session));
    } catch (error) {
      if (session.controller.signal.aborted) throw abortError(session.controller.signal.reason);
      session.diagnostics.push(diagnostic(
        XSCALER_REMOTE_OPERATION_FAILED_CODE,
        'Remote adapter AppService stream failed to open.',
        'error',
        { lifecycle: 'stream', error: normalizeError(error) }
      ));
      throw remoteAdapterError(XSCALER_REMOTE_OPERATION_FAILED_CODE, 'Remote adapter AppService stream failed to open.');
    }
    if (!source || typeof source[Symbol.asyncIterator] !== 'function') {
      session.diagnostics.push(diagnostic(
        XSCALER_REMOTE_OPERATION_INVALID_CODE,
        'Remote adapter AppService stream must return an AsyncIterable.'
      ));
      throw remoteAdapterError(XSCALER_REMOTE_OPERATION_INVALID_CODE, 'Remote adapter AppService stream must return an AsyncIterable.');
    }
    return source;
  }

  function resolveAdapter(session, loadResult) {
    if (loadResult && validateAdapter(loadResult.adapter)) return loadResult.adapter;
    if (validateAdapter(loadResult)) return loadResult;
    if (typeof options.resolveAdapter === 'function') {
      const resolved = options.resolveAdapter(Object.freeze({
        surfaceId: session.surfaceId,
        sessionId: session.id,
        remoteSurfacePlan: cloneJson(session.plan, {}),
        loadResult
      }));
      if (validateAdapter(resolved)) return resolved;
    }
    return registeredAdapters.get(session.surfaceId) || registeredAdapters.get(session.plan.surface) || null;
  }

  async function attach(input = {}) {
    if (disposed) {
      const entry = diagnostic(XSCALER_REMOTE_LOADER_DISPOSED_CODE, 'XScaler remote adapter loader is disposed.');
      return createResult(null, 'refused', { diagnostics: [entry], surfaceId: normalizeString(input.surfaceId) });
    }

    const facts = validateRemoteFacts(input);
    if (!loaderCapabilities.cspSafe || !loaderCapabilities.sri || !loaderCapabilities.externalOnly) {
      facts.diagnostics.push(diagnostic(
        XSCALER_REMOTE_LOADER_UNSAFE_CODE,
        'XScaler external adapter loader must attest CSP-safe, SRI-enforced, external-only loading.'
      ));
    }
    if (facts.diagnostics.length > 0) {
      counters.rejected += 1;
      return createFailureResult(null, 'refused', {
        diagnostics: facts.diagnostics,
        fallbackSurface: facts.plan && facts.plan.fallbackSurface,
        remoteSurfacePlan: facts.plan,
        surfaceId: facts.surfaceId
      }, input);
    }
    const active = activeSessionForSurface(facts.surfaceId);
    if (active) {
      counters.rejected += 1;
      return createFailureResult(null, 'refused', {
        diagnostics: [diagnostic(
          XSCALER_REMOTE_SESSION_ACTIVE_CODE,
          `Remote surface ${facts.surfaceId} already has an active ATC session.`
        )],
        fallbackSurface: facts.plan.fallbackSurface,
        remoteSurfacePlan: facts.plan,
        sessionId: normalizeString(input.sessionId),
        surfaceId: facts.surfaceId
      }, input);
    }

    const sessionId = normalizeString(input.sessionId, nextSessionId(facts.surfaceId));
    if (sessions.has(sessionId)) {
      counters.rejected += 1;
      return createFailureResult(null, 'refused', {
        diagnostics: [diagnostic(
          XSCALER_REMOTE_SESSION_ID_CONFLICT_CODE,
          `Remote adapter session id ${sessionId} has already been used.`
        )],
        fallbackSurface: facts.plan.fallbackSurface,
        remoteSurfacePlan: facts.plan,
        sessionId,
        surfaceId: facts.surfaceId
      }, input);
    }
    const controller = new AbortController();
    const session = {
      id: sessionId,
      surfaceId: facts.surfaceId,
      plan: facts.plan,
      url: facts.url,
      integrity: facts.integrity,
      state: 'preflight',
      controller,
      preflight: null,
      loadHandle: null,
      adapter: null,
      hostContext: input.hostContext || null,
      loadAttempted: false,
      loaded: false,
      adapterExecutionAttempted: false,
      adapterAttached: false,
      adapterDisposed: false,
      fallbackActivationAttempted: false,
      fallbackActivated: false,
      diagnostics: []
    };
    sessions.set(session.id, session);
    latestSessionBySurface.set(session.surfaceId, session.id);

    const request = createXScalerPreflightRequest({
      ...cloneJson(input.request, {}),
      requestId: normalizeString(input.request && input.request.requestId, `xscaler-loader-${session.id}`),
      surface: facts.plan.surface,
      constraints: {
        ...cloneJson(input.request && input.request.constraints, {}),
        allowNetworkDuringSsr: false
      }
    });

    counters.preflight += 1;
    try {
      const preflightEvaluator = typeof options.preflight === 'function' ? options.preflight : evaluateXScalerPreflight;
      const evaluatedPreflight = await preflightEvaluator({
        request,
        remoteSurfacePlan: facts.plan,
        hostCapabilities: input.hostCapabilities || options.hostCapabilities || {},
        remoteSecurityReport: input.remoteSecurityReport,
        degradationReport: input.degradationReport,
        signal: controller.signal
      });
      session.preflight = cloneJson(evaluatedPreflight, null);
    } catch (error) {
      if (controller.signal.aborted) return createAbortedSessionResult(session);
      session.diagnostics.push(diagnostic(
        XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
        'Remote adapter preflight evaluation failed.',
        'error',
        { error: normalizeError(error) }
      ));
      session.state = 'refused';
      counters.rejected += 1;
      return createFailureResult(session, 'refused', { ok: false }, input);
    }

    if (controller.signal.aborted || session.state === 'cancelled') {
      return createAbortedSessionResult(session);
    }

    session.diagnostics.push(...validatePreflightResponse(session.preflight, request, facts));
    if (session.diagnostics.length > 0 || session.preflight.accepted !== true || session.preflight.ok !== true) {
      if (session.diagnostics.length === 0) {
        session.diagnostics.push(diagnostic(
          XSCALER_REMOTE_PREFLIGHT_REJECTED_CODE,
          session.preflight.rejection && session.preflight.rejection.message || 'Remote adapter preflight rejected the surface.',
          'error',
          { rejectionCode: session.preflight.rejection && session.preflight.rejection.code || null }
        ));
      }
      session.state = 'refused';
      counters.rejected += 1;
      return createFailureResult(session, 'refused', { ok: false }, input);
    }

    counters.accepted += 1;
    session.state = 'loading';
    session.loadAttempted = true;
    counters.loadAttempts += 1;
    const loadDescriptor = Object.freeze({
      schema: XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA,
      url: session.url,
      integrity: session.integrity,
      crossOrigin: 'anonymous',
      referrerPolicy: 'no-referrer',
      nonce: normalizeString(input.nonce || options.nonce),
      surfaceId: session.surfaceId,
      sessionId: session.id,
      signal: controller.signal,
      runtimeBoundary: Object.freeze({
        remoteRuntimeExecution: false,
        kernelRemoteExecution: false,
        networkRequiredByKernel: false
      })
    });

    let loadResult;
    try {
      loadResult = await externalLoader(loadDescriptor);
      session.loadHandle = loadResult || null;
      if (controller.signal.aborted || session.state === 'cancelled') {
        removeLoadHandle(session);
        return createAbortedSessionResult(session);
      }
      session.loaded = true;
      counters.loaded += 1;
    } catch (error) {
      if (controller.signal.aborted || error && error.name === 'AbortError') {
        if (!['detached', 'disposed'].includes(session.state)) session.state = 'cancelled';
        if (session.state === 'cancelled' && !session.diagnostics.some((entry) => entry.code === XSCALER_REMOTE_CANCELLED_CODE)) {
          session.diagnostics.push(diagnostic(XSCALER_REMOTE_CANCELLED_CODE, 'Remote adapter load was cancelled.', 'warning'));
        }
        return createAbortedSessionResult(session);
      }
      session.state = 'failed';
      session.diagnostics.push(diagnostic(
        XSCALER_REMOTE_LOAD_FAILED_CODE,
        'Remote adapter failed to load after accepted preflight.',
        'error',
        { error: normalizeError(error) }
      ));
      removeLoadHandle(session);
      return createFailureResult(session, 'failed', { ok: false }, input);
    }

    session.adapter = resolveAdapter(session, loadResult);
    if (!validateAdapter(session.adapter)) {
      session.state = 'failed';
      session.diagnostics.push(diagnostic(
        XSCALER_REMOTE_ADAPTER_INVALID_CODE,
        'Loaded remote adapter must implement attach, cancel, detach and dispose.'
      ));
      removeLoadHandle(session);
      return createFailureResult(session, 'failed', { ok: false }, input);
    }

    const diagnosticCountBeforeAttach = session.diagnostics.length;
    await invokeLifecycle(session, 'attach', { hostContext: input.hostContext || null });
    if (controller.signal.aborted || session.state === 'cancelled') {
      removeLoadHandle(session);
      return createAbortedSessionResult(session);
    }
    if (session.diagnostics.length > diagnosticCountBeforeAttach) {
      session.state = 'failed';
      await invokeLifecycle(session, 'dispose', { reason: 'attach-failed' });
      removeLoadHandle(session);
      return createFailureResult(session, 'failed', { ok: false }, input);
    }
    session.adapterAttached = true;
    session.state = 'attached';
    counters.attached += 1;
    return createResult(session, 'attached', { ok: true });
  }

  async function cancel(reference, reason = 'cancelled') {
    const session = findSession(reference);
    if (!session) {
      const entry = diagnostic(XSCALER_REMOTE_SESSION_NOT_FOUND_CODE, 'XScaler ATC session was not found.');
      return createResult(null, 'refused', { diagnostics: [entry], surfaceId: normalizeString(reference) });
    }
    if (session.state === 'cancelled') return createResult(session, 'cancelled', { ok: true, handoffSignal: 'cancel' });
    session.state = 'cancelled';
    try { session.controller.abort(reason); } catch (_error) {}
    await invokeLifecycle(session, 'cancel', { reason: normalizeString(reason, 'cancelled') });
    session.adapterAttached = false;
    removeLoadHandle(session);
    session.diagnostics.push(diagnostic(XSCALER_REMOTE_CANCELLED_CODE, 'Remote adapter ATC session was cancelled.', 'warning', { reason }));
    counters.cancelled += 1;
    return createResult(session, 'cancelled', { ok: true, handoffSignal: 'cancel' });
  }

  async function detach(reference, reason = 'detached') {
    const session = findSession(reference);
    if (!session) {
      const entry = diagnostic(XSCALER_REMOTE_SESSION_NOT_FOUND_CODE, 'XScaler ATC session was not found.');
      return createResult(null, 'refused', { diagnostics: [entry], surfaceId: normalizeString(reference) });
    }
    if (session.state === 'detached') return createResult(session, 'detached', { ok: true, handoffSignal: 'detach' });
    session.state = 'detached';
    try { session.controller.abort(reason); } catch (_error) {}
    await invokeLifecycle(session, 'detach', { reason: normalizeString(reason, 'detached') });
    session.adapterAttached = false;
    removeLoadHandle(session);
    counters.detached += 1;
    return createResult(session, 'detached', { ok: true, handoffSignal: 'detach' });
  }

  async function dispose(reason = 'disposed') {
    if (disposed) return snapshot();
    disposed = true;
    for (const session of sessions.values()) {
      if (session.state === 'disposed') continue;
      session.state = 'disposed';
      try { session.controller.abort(reason); } catch (_error) {}
      await invokeLifecycle(session, 'dispose', { reason: normalizeString(reason, 'disposed') });
      session.adapterAttached = false;
      removeLoadHandle(session);
    }
    registeredAdapters.clear();
    counters.disposed += 1;
    return snapshot();
  }

  function registerAdapter(surfaceReference, adapter) {
    const key = normalizeString(surfaceReference);
    if (!key || !validateAdapter(adapter) || disposed) return false;
    registeredAdapters.set(key, adapter);
    if (!key.startsWith('remoteSurface:')) registeredAdapters.set(`remoteSurface:${key}`, adapter);
    return true;
  }

  function unregisterAdapter(surfaceReference) {
    const key = normalizeString(surfaceReference);
    const removed = registeredAdapters.delete(key);
    const remoteRemoved = registeredAdapters.delete(key.startsWith('remoteSurface:') ? key.slice('remoteSurface:'.length) : `remoteSurface:${key}`);
    return removed || remoteRemoved;
  }

  function snapshot() {
    return {
      schema: XSCALER_REMOTE_ADAPTER_LOADER_SNAPSHOT_SCHEMA,
      loaderSchema: XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA,
      disposed,
      status: disposed ? 'disposed' : 'ready',
      sessionCount: sessions.size,
      registeredAdapterCount: new Set(registeredAdapters.values()).size,
      counters: { ...counters },
      runtimeBoundary: {
        remoteSurfaceOnly: true,
        remoteRuntimeExecution: false,
        kernelRemoteExecution: false,
        networkRequiredByKernel: false
      },
      sessions: Array.from(sessions.values()).map(sessionSnapshot),
      history: history.map((entry) => ({ ...entry }))
    };
  }

  return Object.freeze({
    schema: XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA,
    attach,
    invoke,
    stream,
    cancel,
    detach,
    dispose,
    registerAdapter,
    unregisterAdapter,
    snapshot,
    listSessions() {
      return Array.from(sessions.values()).map(sessionSnapshot);
    }
  });
}

module.exports = Object.freeze({
  XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA,
  XSCALER_REMOTE_ADAPTER_LOAD_RESULT_SCHEMA,
  XSCALER_REMOTE_ADAPTER_SESSION_SCHEMA,
  XSCALER_REMOTE_ADAPTER_LOADER_SNAPSHOT_SCHEMA,
  XSCALER_REMOTE_ADAPTER_REGISTRATION_SCHEMA,
  XSCALER_REMOTE_SURFACE_REQUIRED_CODE,
  XSCALER_REMOTE_URL_INVALID_CODE,
  XSCALER_REMOTE_ORIGIN_MISMATCH_CODE,
  XSCALER_REMOTE_INTEGRITY_INVALID_CODE,
  XSCALER_REMOTE_PREFLIGHT_INVALID_CODE,
  XSCALER_REMOTE_PREFLIGHT_REJECTED_CODE,
  XSCALER_REMOTE_LOADER_UNSAFE_CODE,
  XSCALER_REMOTE_LOAD_FAILED_CODE,
  XSCALER_REMOTE_ADAPTER_INVALID_CODE,
  XSCALER_REMOTE_LIFECYCLE_FAILED_CODE,
  XSCALER_REMOTE_SESSION_NOT_FOUND_CODE,
  XSCALER_REMOTE_SESSION_ACTIVE_CODE,
  XSCALER_REMOTE_SESSION_ID_CONFLICT_CODE,
  XSCALER_REMOTE_OPERATION_INVALID_CODE,
  XSCALER_REMOTE_OPERATION_FAILED_CODE,
  XSCALER_REMOTE_CANCELLED_CODE,
  XSCALER_REMOTE_LOADER_DISPOSED_CODE,
  XSCALER_REMOTE_FALLBACK_ACTIVATION_FAILED_CODE,
  registerXScalerRemoteAdapter,
  createBrowserExternalModuleLoader,
  createXScalerRemoteAdapterLoader
});

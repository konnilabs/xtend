'use strict';

const {
  XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA,
  createXScalerRemoteAdapterLoader
} = require('./remote-adapter-loader');

const MARACA_APP_SERVICE_TRANSPORT_SCHEMA = 'xtend.maraca.app-service-transport.v1';
const XSCALER_APP_SERVICE_TRANSPORT_SCHEMA = 'xtend.xscaler.app-service-transport.v1';
const XSCALER_APP_SERVICE_TARGET_REQUIRED_CODE = 'xscaler.app-service.remote_surface_required';
const XSCALER_APP_SERVICE_CONFIG_MISSING_CODE = 'xscaler.app-service.config_missing';
const XSCALER_APP_SERVICE_ATTACH_REFUSED_CODE = 'xscaler.app-service.attach_refused';
const XSCALER_APP_SERVICE_OPERATION_FAILED_CODE = 'xscaler.app-service.operation_failed';
const XSCALER_APP_SERVICE_CANCELLED_CODE = 'xscaler.app-service.cancelled';
const XSCALER_APP_SERVICE_DISPOSED_CODE = 'xscaler.app-service.disposed';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeString(value, fallback = '') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function cloneJson(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return fallback;
  }
}

function diagnosticCodes(result) {
  return Array.isArray(result && result.diagnostics)
    ? result.diagnostics.map((entry) => normalizeString(entry && entry.code)).filter(Boolean)
    : [];
}

class XScalerAppServiceTransportError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'XScalerAppServiceTransportError';
    this.code = normalizeString(options.code, XSCALER_APP_SERVICE_OPERATION_FAILED_CODE);
    this.details = Object.freeze(cloneJson(options.details, {}));
    this.fallback = cloneJson(options.fallback, null);
  }
}

function transportError(code, message, request, extra = {}) {
  return new XScalerAppServiceTransportError(message, {
    code,
    fallback: extra.fallback,
    details: {
      serviceId: normalizeString(request && request.serviceId),
      invocationId: normalizeString(request && request.invocationId),
      ...cloneJson(extra.details, {})
    }
  });
}

function createXScalerAppServiceTransport(options = {}) {
  const configuredServices = isPlainObject(options.services)
    ? options.services
    : (isPlainObject(options.remoteServices) ? options.remoteServices : {});
  const loader = options.loader || createXScalerRemoteAdapterLoader(options.loaderOptions || {});
  if (!loader || loader.schema !== XSCALER_REMOTE_ADAPTER_LOADER_SCHEMA || typeof loader.attach !== 'function' || typeof loader.invoke !== 'function' || typeof loader.stream !== 'function') {
    throw new TypeError('createXScalerAppServiceTransport requires an XScaler remote adapter loader with attach/invoke/stream operations.');
  }

  const ownsLoader = !options.loader || options.disposeLoader === true;
  const active = new Map();
  let disposed = false;
  let disposalPromise = Promise.resolve(null);

  function ensureRemoteRequest(request) {
    if (!request || request.target !== 'remote-surface') {
      throw transportError(
        XSCALER_APP_SERVICE_TARGET_REQUIRED_CODE,
        'XScaler AppService transport only accepts target: remote-surface.',
        request
      );
    }
    if (disposed) {
      throw transportError(XSCALER_APP_SERVICE_DISPOSED_CODE, 'XScaler AppService transport is disposed.', request);
    }
    if (request.signal && request.signal.aborted) {
      throw transportError(XSCALER_APP_SERVICE_CANCELLED_CODE, 'XScaler AppService operation was cancelled.', request);
    }
  }

  async function resolveServiceConfig(request) {
    const serviceId = normalizeString(request && request.serviceId);
    let configured = configuredServices[serviceId];
    if (typeof configured === 'function') configured = await configured(request);
    if (configured === undefined && typeof options.resolveService === 'function') {
      configured = await options.resolveService(request);
    }
    if (!isPlainObject(configured) || !configured.remoteSurfacePlan || !normalizeString(configured.adapterUrl || configured.url)) {
      throw transportError(
        XSCALER_APP_SERVICE_CONFIG_MISSING_CODE,
        'Remote-surface AppService has no host-owned XScaler plan and adapter URL.',
        request
      );
    }
    return configured;
  }

  function sessionIdFor(request, config) {
    const configured = typeof config.sessionId === 'function' ? config.sessionId(request) : config.sessionId;
    return normalizeString(
      configured,
      `xscaler-app-service:${normalizeString(request.serviceId, 'unknown')}:${normalizeString(request.invocationId, request.correlationId || 'operation')}`
    );
  }

  function cancelledError(request) {
    return transportError(XSCALER_APP_SERVICE_CANCELLED_CODE, 'XScaler AppService operation was cancelled.', request);
  }

  async function openSession(request) {
    ensureRemoteRequest(request);
    const config = await resolveServiceConfig(request);
    ensureRemoteRequest(request);
    const sessionId = sessionIdFor(request, config);
    const entry = {
      request,
      config,
      sessionId,
      closed: false,
      cancelPromise: null,
      removeAbortListener: null
    };
    const cancel = () => {
      if (!entry.cancelPromise) {
        entry.cancelPromise = Promise.resolve(loader.cancel(sessionId, 'app-service-aborted')).catch(() => null);
      }
      return entry.cancelPromise;
    };
    const attachPromise = loader.attach({
      remoteSurfacePlan: config.remoteSurfacePlan,
      adapterUrl: config.adapterUrl || config.url,
      sessionId,
      request: config.preflightRequest || config.request,
      hostCapabilities: config.hostCapabilities,
      remoteSecurityReport: config.remoteSecurityReport,
      degradationReport: config.degradationReport,
      nonce: config.nonce,
      hostContext: Object.freeze({
        appService: Object.freeze({
          serviceId: normalizeString(request.serviceId),
          invocationId: normalizeString(request.invocationId),
          correlationId: normalizeString(request.correlationId)
        }),
        configured: config.hostContext || null
      })
    });

    active.set(sessionId, entry);
    if (request.signal && typeof request.signal.addEventListener === 'function') {
      const onAbort = () => { void cancel(); };
      request.signal.addEventListener('abort', onAbort, { once: true });
      entry.removeAbortListener = () => request.signal.removeEventListener('abort', onAbort);
      if (request.signal.aborted) onAbort();
    }

    let result;
    try {
      result = await attachPromise;
    } catch (_error) {
      active.delete(sessionId);
      if (entry.removeAbortListener) entry.removeAbortListener();
      throw transportError(
        XSCALER_APP_SERVICE_ATTACH_REFUSED_CODE,
        'XScaler rejected the remote-surface AppService before adapter execution.',
        request
      );
    }

    if (disposed || request.signal && request.signal.aborted || result.status === 'cancelled' || result.status === 'disposed') {
      await cancel();
      active.delete(sessionId);
      if (entry.removeAbortListener) entry.removeAbortListener();
      throw cancelledError(request);
    }
    if (result.status !== 'attached' || result.ok !== true) {
      active.delete(sessionId);
      if (entry.removeAbortListener) entry.removeAbortListener();
      throw transportError(
        XSCALER_APP_SERVICE_ATTACH_REFUSED_CODE,
        'XScaler rejected the remote-surface AppService before adapter execution.',
        request,
        {
          fallback: result.atc && result.atc.fallback,
          details: {
            surfaceId: result.surfaceId,
            status: result.status,
            diagnosticCodes: diagnosticCodes(result)
          }
        }
      );
    }
    return entry;
  }

  async function closeSession(entry, outcome) {
    if (!entry || entry.closed) return;
    entry.closed = true;
    active.delete(entry.sessionId);
    if (entry.removeAbortListener) entry.removeAbortListener();
    try {
      if (outcome === 'complete' && !(entry.request.signal && entry.request.signal.aborted) && !disposed) {
        await loader.detach(entry.sessionId, 'app-service-complete');
      } else {
        await (entry.cancelPromise || loader.cancel(entry.sessionId, outcome === 'dispose' ? 'app-service-disposed' : 'app-service-aborted'));
      }
    } catch (_error) {
      // ATC diagnostics remain available on the loader snapshot; cleanup must not mask the service result.
    }
  }

  function operationError(error, request) {
    if (error instanceof XScalerAppServiceTransportError) return error;
    if (request && request.signal && request.signal.aborted) return cancelledError(request);
    return transportError(
      XSCALER_APP_SERVICE_OPERATION_FAILED_CODE,
      'Remote-surface AppService operation failed.',
      request
    );
  }

  async function invoke(request = {}) {
    let entry = null;
    let outcome = 'error';
    try {
      entry = await openSession(request);
      const value = await loader.invoke(entry.sessionId, request);
      if (request.signal && request.signal.aborted) throw cancelledError(request);
      outcome = 'complete';
      return value;
    } catch (error) {
      throw operationError(error, request);
    } finally {
      if (entry) await closeSession(entry, outcome);
    }
  }

  async function *stream(request = {}) {
    let entry = null;
    let outcome = 'error';
    try {
      entry = await openSession(request);
      const source = await loader.stream(entry.sessionId, request);
      for await (const frame of source) {
        if (request.signal && request.signal.aborted) throw cancelledError(request);
        const frameType = normalizeString(frame && (frame.type || frame.kind));
        const terminal = frameType === 'complete' || frameType === 'error' || frameType === 'cancelled';
        if (frameType === 'complete') {
          outcome = 'complete';
          await closeSession(entry, outcome);
        }
        yield frame;
        if (terminal) return;
      }
      if (request.signal && request.signal.aborted) throw cancelledError(request);
      outcome = 'complete';
    } catch (error) {
      throw operationError(error, request);
    } finally {
      if (entry) await closeSession(entry, outcome);
    }
  }

  function dispose(reason = 'XScaler AppService transport disposed.') {
    if (disposed) return false;
    disposed = true;
    const pending = Array.from(active.values()).map((entry) => {
      entry.closed = true;
      if (entry.removeAbortListener) entry.removeAbortListener();
      return entry.cancelPromise || Promise.resolve(loader.cancel(entry.sessionId, 'app-service-disposed')).catch(() => null);
    });
    active.clear();
    disposalPromise = Promise.allSettled(pending).then(async () => {
      if (ownsLoader) return loader.dispose(normalizeString(reason, 'XScaler AppService transport disposed.'));
      return null;
    });
    return true;
  }

  function snapshot() {
    return Object.freeze({
      schema: XSCALER_APP_SERVICE_TRANSPORT_SCHEMA,
      kind: 'xscaler-remote-surface',
      disposed,
      activeCount: active.size,
      configuredServiceIds: Object.keys(configuredServices).sort(),
      ownsLoader,
      runtimeBoundary: Object.freeze({
        remoteSurfaceOnly: true,
        remoteRuntimeExecution: false,
        kernelRemoteExecution: false
      }),
      loader: typeof loader.snapshot === 'function' ? loader.snapshot() : null
    });
  }

  return Object.freeze({
    schema: MARACA_APP_SERVICE_TRANSPORT_SCHEMA,
    xscalerSchema: XSCALER_APP_SERVICE_TRANSPORT_SCHEMA,
    kind: 'xscaler-remote-surface',
    invoke,
    stream,
    dispose,
    snapshot,
    whenDisposed() { return disposalPromise; }
  });
}

module.exports = Object.freeze({
  MARACA_APP_SERVICE_TRANSPORT_SCHEMA,
  XSCALER_APP_SERVICE_TRANSPORT_SCHEMA,
  XSCALER_APP_SERVICE_TARGET_REQUIRED_CODE,
  XSCALER_APP_SERVICE_CONFIG_MISSING_CODE,
  XSCALER_APP_SERVICE_ATTACH_REFUSED_CODE,
  XSCALER_APP_SERVICE_OPERATION_FAILED_CODE,
  XSCALER_APP_SERVICE_CANCELLED_CODE,
  XSCALER_APP_SERVICE_DISPOSED_CODE,
  XScalerAppServiceTransportError,
  createXScalerAppServiceTransport
});

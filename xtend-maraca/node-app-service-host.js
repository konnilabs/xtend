'use strict';

const {
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  AppServiceAbortError,
  AppServiceError,
  applyAppServiceInputPolicy,
  createAppServiceRegistry
} = require('./app-services');

const MARACA_NODE_APP_SERVICE_HOST_SCHEMA = 'xtend.maraca.node-app-service-host.v1';
const DEFAULT_PATH_PREFIX = '/api/xtend/services';
const WIRE_KINDS = new Set(['query', 'command', 'stream']);
const WIRE_IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/u;

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizePathPrefix(value) {
  return `/${String(value || DEFAULT_PATH_PREFIX).replace(/^\/+|\/+$/gu, '')}`;
}

function errorStatus(error) {
  if (!error || typeof error !== 'object') return 500;
  if (error.code === 'xtend.maraca.app-service.unknown') return 404;
  if (error.code === 'xtend.maraca.app-service.method_not_allowed') return 405;
  if (error.code === 'xtend.maraca.app-service.payload_too_large') return 413;
  if (/invalid_contract|invalid_request|mode_mismatch|target_mismatch|stream_protocol|input_policy/u.test(String(error.code || ''))) return 400;
  if (/cancelled|disposed|timeout|stale/u.test(String(error.code || ''))) return 499;
  return 500;
}

function safeError(error, exposeErrors) {
  const canExpose = exposeErrors === true || error && error.expose === true;
  return {
    code: error && error.code || 'xtend.maraca.app-service.internal_error',
    message: canExpose && error && error.message
      ? error.message
      : 'App service request failed.'
  };
}

function responseEnvelope(request, fields = {}) {
  return {
    schema: MARACA_APP_SERVICE_RESPONSE_SCHEMA,
    ok: fields.ok !== false,
    serviceId: request && request.serviceId || null,
    invocationId: request && request.invocationId || null,
    correlationId: request && request.correlationId || null,
    ...fields
  };
}

function optionalWireIdentifier(value, label) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = typeof value === 'string' || Number.isInteger(value) ? String(value).trim() : '';
  if (!WIRE_IDENTIFIER_PATTERN.test(normalized)) {
    throw new AppServiceError(`${label} is invalid.`, {
      code: 'xtend.maraca.app-service.invalid_request',
      expose: true
    });
  }
  return normalized;
}

function safeWireIdentifier(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = typeof value === 'string' || Number.isInteger(value) ? String(value).trim() : '';
  return WIRE_IDENTIFIER_PATTERN.test(normalized) ? normalized : null;
}

function validateWireRequest(input, routeServiceId = null) {
  const request = objectRecord(input);
  if (request.schema !== MARACA_APP_SERVICE_REQUEST_SCHEMA) {
    throw new AppServiceError(`App service request must use ${MARACA_APP_SERVICE_REQUEST_SCHEMA}.`, {
      code: 'xtend.maraca.app-service.invalid_request',
      expose: true
    });
  }
  const serviceId = String(request.serviceId || '').trim();
  if (!WIRE_IDENTIFIER_PATTERN.test(serviceId)) {
    throw new AppServiceError('App service request requires serviceId.', {
      code: 'xtend.maraca.app-service.invalid_request',
      expose: true
    });
  }
  if (routeServiceId && routeServiceId !== serviceId) {
    throw new AppServiceError('App service route and request serviceId do not match.', {
      code: 'xtend.maraca.app-service.invalid_request',
      details: { routeServiceId, serviceId },
      expose: true
    });
  }
  return {
    ...request,
    serviceId,
    kind: String(request.kind || '').trim(),
    target: String(request.target || '').trim(),
    invocationId: optionalWireIdentifier(request.invocationId, 'App service invocationId'),
    correlationId: optionalWireIdentifier(request.correlationId, 'App service correlationId')
  };
}

function validateWireServiceRequest(request, serviceDefinition, expectedMode = null) {
  const kind = request.kind;
  if (!WIRE_KINDS.has(kind) || kind !== serviceDefinition.kind) {
    throw new AppServiceError('AppService request kind does not match the server definition.', {
      code: 'xtend.maraca.app-service.mode_mismatch',
      expose: true
    });
  }
  const mode = kind === 'stream' ? 'stream' : 'invoke';
  if (expectedMode && mode !== expectedMode) {
    throw new AppServiceError('AppService request uses the wrong execution mode.', {
      code: 'xtend.maraca.app-service.mode_mismatch',
      expose: true
    });
  }
  if (request.target !== 'server' || request.target !== serviceDefinition.target) {
    throw new AppServiceError('AppService request target does not match the server definition.', {
      code: 'xtend.maraca.app-service.target_mismatch',
      expose: true
    });
  }
  return request;
}

function createRequestController(rootSignal, request, response, additionalSignal = null) {
  const controller = new AbortController();
  const removers = [];
  const abort = (reason) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };
  const linkSignal = (signal) => {
    if (!signal) return;
    if (signal.aborted) {
      abort(signal.reason);
      return;
    }
    const onAbort = () => abort(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    removers.push(() => signal.removeEventListener('abort', onAbort));
  };
  linkSignal(rootSignal);
  linkSignal(additionalSignal);
  if (request && typeof request.once === 'function') {
    const onAborted = () => abort(new AppServiceAbortError('Node request was aborted.'));
    request.once('aborted', onAborted);
    removers.push(() => {
      if (typeof request.removeListener === 'function') request.removeListener('aborted', onAborted);
    });
  }
  if (response && typeof response.once === 'function') {
    const onClose = () => {
      if (!response.writableEnded) abort(new AppServiceAbortError('Node response was closed.'));
    };
    response.once('close', onClose);
    removers.push(() => {
      if (typeof response.removeListener === 'function') response.removeListener('close', onClose);
    });
  }
  return {
    controller,
    cleanup() {
      removers.splice(0).forEach((remove) => remove());
    }
  };
}

function chunkBytes(chunk) {
  if (typeof Buffer !== 'undefined') return Buffer.byteLength(chunk);
  if (typeof chunk === 'string') return new TextEncoder().encode(chunk).byteLength;
  return chunk && chunk.byteLength || 0;
}

async function readJsonBody(request, limit) {
  const chunks = [];
  let bytes = 0;
  if (!request || typeof request[Symbol.asyncIterator] !== 'function') {
    throw new AppServiceError('Node app service request body is not readable.', {
      code: 'xtend.maraca.app-service.invalid_request',
      expose: true
    });
  }
  for await (const chunk of request) {
    bytes += chunkBytes(chunk);
    if (bytes > limit) {
      throw new AppServiceError(`App service request exceeds the ${limit} byte body limit.`, {
        code: 'xtend.maraca.app-service.payload_too_large',
        details: { limit },
        expose: true
      });
    }
    chunks.push(chunk);
  }
  const text = typeof Buffer !== 'undefined'
    ? Buffer.concat(chunks.map((chunk) => {
      if (Buffer.isBuffer(chunk)) return chunk;
      if (ArrayBuffer.isView(chunk) || chunk instanceof ArrayBuffer) return Buffer.from(chunk);
      return Buffer.from(String(chunk));
    })).toString('utf8')
    : chunks.map((chunk) => typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)).join('');
  try {
    return JSON.parse(text || '{}');
  } catch (error) {
    throw new AppServiceError('App service request body is not valid JSON.', {
      code: 'xtend.maraca.app-service.invalid_request',
      expose: true,
      cause: error
    });
  }
}

function setHeader(response, name, value) {
  if (response && typeof response.setHeader === 'function') response.setHeader(name, value);
}

function endResponse(response, body = '') {
  if (response && typeof response.end === 'function' && !response.writableEnded) response.end(body);
}

function writeJson(response, status, payload) {
  response.statusCode = status;
  setHeader(response, 'Content-Type', 'application/json; charset=UTF-8');
  setHeader(response, 'Cache-Control', 'no-store');
  endResponse(response, JSON.stringify(payload));
}

function waitForDrain(response, signal) {
  if (!response || typeof response.once !== 'function') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (typeof response.removeListener === 'function') {
        response.removeListener('drain', onDrain);
        response.removeListener('error', onError);
      }
      if (signal && typeof signal.removeEventListener === 'function') signal.removeEventListener('abort', onAbort);
    };
    const onDrain = () => { cleanup(); resolve(); };
    const onError = (error) => { cleanup(); reject(error); };
    const onAbort = () => {
      cleanup();
      reject(signal && signal.reason instanceof Error
        ? signal.reason
        : new AppServiceAbortError('Node response was aborted while waiting for drain.'));
    };
    response.once('drain', onDrain);
    response.once('error', onError);
    if (signal && typeof signal.addEventListener === 'function') signal.addEventListener('abort', onAbort, { once: true });
    if (signal && signal.aborted) onAbort();
  });
}

function createNodeAppServiceHost(options = {}) {
  const registry = options.registry || createAppServiceRegistry(options.services || {}, {
    transport: options.transport,
    historyLimit: options.historyLimit
  });
  const ownsRegistry = !options.registry;
  const pathPrefix = normalizePathPrefix(options.pathPrefix);
  const bodyLimit = Number.isInteger(options.bodyLimit) && options.bodyLimit > 0 ? options.bodyLimit : 1024 * 1024;
  const exposeErrors = options.exposeErrors === true;
  const rootController = new AbortController();
  const activeRequests = new Set();
  let hostInvocationSequence = 0;
  let hostWireSequence = 0;
  let disposed = false;
  let disposalPromise = Promise.resolve();

  function routeServiceId(urlValue) {
    const parsed = new URL(String(urlValue || '/'), 'http://xtend.local');
    if (!parsed.pathname.startsWith(`${pathPrefix}/`)) return null;
    const encoded = parsed.pathname.slice(pathPrefix.length + 1);
    if (!encoded || encoded.includes('/')) return '';
    try {
      return decodeURIComponent(encoded);
    } catch (_) {
      return '';
    }
  }

  function requestContext(request, scope, extra = {}) {
    return {
      ...objectRecord(extra),
      signal: scope.controller.signal,
      request,
      defer: scope.defer
    };
  }

  function reportCleanupError(error, context) {
    const callback = typeof options.onCleanupError === 'function'
      ? options.onCleanupError
      : (typeof options.onError === 'function' ? options.onError : null);
    if (!callback) return;
    try {
      callback(error, { ...objectRecord(context), phase: 'cleanup' });
    } catch (_) {
      // Host observability must never change request completion.
    }
  }

  function openRequestScope(request, response, additionalSignal = null, cleanupContext = {}) {
    const lifecycle = createRequestController(rootController.signal, request, response, additionalSignal);
    const cleanups = [];
    let closed = false;
    let closePromise = null;
    const scope = {
      controller: lifecycle.controller,
      defer(cleanup) {
        if (typeof cleanup !== 'function') {
          throw new AppServiceError('Deferred AppService cleanup must be a function.', {
            code: 'xtend.maraca.app-service.cleanup_invalid',
            expose: true
          });
        }
        if (closed) {
          throw new AppServiceAbortError('AppService request scope is already closed.', {
            code: 'xtend.maraca.app-service.disposed'
          });
        }
        cleanups.push(cleanup);
        return cleanup;
      },
      close(reason = 'request-complete') {
        if (closePromise) return closePromise;
        closed = true;
        lifecycle.cleanup();
        lifecycle.controller.signal.removeEventListener('abort', onAbort);
        activeRequests.delete(scope);
        const callbacks = cleanups.splice(0).reverse();
        closePromise = (async () => {
          for (const cleanup of callbacks) {
            try {
              await cleanup();
            } catch (error) {
              reportCleanupError(error, { ...objectRecord(cleanupContext), reason });
            }
          }
        })();
        return closePromise;
      }
    };
    const onAbort = () => { void scope.close(lifecycle.controller.signal.reason || 'request-aborted'); };
    lifecycle.controller.signal.addEventListener('abort', onAbort, { once: true });
    activeRequests.add(scope);
    if (lifecycle.controller.signal.aborted) onAbort();
    return scope;
  }

  function normalizeWireIdentifiers(request) {
    hostWireSequence += 1;
    const invocationId = request.invocationId || `xtend.maraca.app-service.invocation:${hostWireSequence}`;
    return {
      ...request,
      invocationId,
      correlationId: request.correlationId || invocationId
    };
  }

  function enforceWireInputPolicy(request) {
    const result = applyAppServiceInputPolicy(request.input, {
      serviceId: request.serviceId,
      manifest: options.manifest || null,
      phase: 'server',
      onVerdict: options.onInputPolicyVerdict
    });
    return {
      ...request,
      input: result.input,
      inputPolicyVerdict: result.verdict
    };
  }

  function concurrencyKey(wireRequest, context, serviceDefinition = null) {
    const explicit = context && context.concurrencyKey;
    if (explicit != null && String(explicit).trim()) return String(explicit);
    if (serviceDefinition && serviceDefinition.concurrency === 'serial') {
      return `node.service:${wireRequest.serviceId}`;
    }
    const clientKey = wireRequest && (wireRequest.correlationId || wireRequest.invocationId);
    if (clientKey) return `node.request:${clientKey}`;
    hostInvocationSequence += 1;
    return `node.request:${hostInvocationSequence}`;
  }

  async function handleEnvelope(input, context = {}) {
    let request = validateWireRequest(input);
    const contextRecord = objectRecord(context);
    const serviceDefinition = registry.getService(request.serviceId);
    validateWireServiceRequest(request, serviceDefinition, 'invoke');
    request = enforceWireInputPolicy(request);
    request = normalizeWireIdentifiers(request);
    const scope = openRequestScope(null, null, contextRecord.signal, {
      serviceId: request.serviceId,
      invocationId: request.invocationId,
      correlationId: request.correlationId
    });
    try {
      const value = await registry.invoke(request.serviceId, request.input, {
        ...contextRecord,
        signal: scope.controller.signal,
        defer: scope.defer,
        invocationId: request.invocationId,
        correlationId: request.correlationId,
        inputPolicyVerdict: request.inputPolicyVerdict,
        concurrencyKey: concurrencyKey(request, contextRecord, serviceDefinition)
      });
      return responseEnvelope(request, { ok: true, value });
    } finally {
      await scope.close('request-complete');
    }
  }

  async function *streamEnvelope(input, context = {}) {
    let request = validateWireRequest(input);
    const contextRecord = objectRecord(context);
    const serviceDefinition = registry.getService(request.serviceId);
    validateWireServiceRequest(request, serviceDefinition, 'stream');
    request = enforceWireInputPolicy(request);
    request = normalizeWireIdentifiers(request);
    const scope = openRequestScope(null, null, contextRecord.signal, {
      serviceId: request.serviceId,
      invocationId: request.invocationId,
      correlationId: request.correlationId
    });
    let handle = null;
    let completed = false;
    try {
      handle = registry.stream(request.serviceId, request.input, {}, {
        ...contextRecord,
        signal: scope.controller.signal,
        defer: scope.defer,
        invocationId: request.invocationId,
        correlationId: request.correlationId,
        inputPolicyVerdict: request.inputPolicyVerdict,
        concurrencyKey: concurrencyKey(request, contextRecord, serviceDefinition)
      });
      for await (const frame of handle) {
        if (frame.type === 'error') {
          yield { ...frame, error: safeError(objectRecord(frame.error), exposeErrors) };
        } else {
          yield frame;
        }
      }
      completed = true;
    } finally {
      if (!completed && handle && !handle.signal.aborted) handle.cancel('Node stream consumer detached.');
      await scope.close(completed ? 'request-complete' : 'stream-consumer-detached');
    }
  }

  async function handle(request, response) {
    const routeId = routeServiceId(request && request.url);
    if (routeId === null) return false;
    if (disposed) {
      writeJson(response, 503, responseEnvelope({ serviceId: routeId }, {
        ok: false,
        error: safeError(new AppServiceAbortError('Node app service host is disposed.', {
          code: 'xtend.maraca.app-service.disposed'
        }), exposeErrors)
      }));
      return true;
    }
    if (String(request && request.method || 'GET').toUpperCase() !== 'POST') {
      setHeader(response, 'Allow', 'POST');
      const error = new AppServiceError('App service endpoints require POST.', {
        code: 'xtend.maraca.app-service.method_not_allowed',
        expose: true
      });
      writeJson(response, 405, responseEnvelope({ serviceId: routeId }, { ok: false, error: safeError(error, exposeErrors) }));
      return true;
    }

    const requestScope = openRequestScope(request, response, null);
    let streamHandle = null;
    let wireRequest = { serviceId: routeId };
    try {
      const decodedRequest = await readJsonBody(request, bodyLimit);
      wireRequest = {
        serviceId: routeId,
        invocationId: safeWireIdentifier(decodedRequest.invocationId),
        correlationId: safeWireIdentifier(decodedRequest.correlationId)
      };
      wireRequest = validateWireRequest(decodedRequest, routeId);
      const serviceDefinition = registry.getService(wireRequest.serviceId);
      validateWireServiceRequest(wireRequest, serviceDefinition);
      wireRequest = enforceWireInputPolicy(wireRequest);
      wireRequest = normalizeWireIdentifiers(wireRequest);
      const hostContext = typeof options.createContext === 'function'
        ? await options.createContext(request, wireRequest)
        : {};
      const context = requestContext(request, requestScope, hostContext);
      if (serviceDefinition.kind !== 'stream') {
        const value = await registry.invoke(wireRequest.serviceId, wireRequest.input, {
          ...context,
          invocationId: wireRequest.invocationId,
          correlationId: wireRequest.correlationId,
          inputPolicyVerdict: wireRequest.inputPolicyVerdict,
          concurrencyKey: concurrencyKey(wireRequest, context, serviceDefinition)
        });
        const payload = responseEnvelope(wireRequest, { ok: true, value });
        writeJson(response, 200, payload);
        return true;
      }

      response.statusCode = 200;
      setHeader(response, 'Content-Type', 'application/x-ndjson; charset=UTF-8');
      setHeader(response, 'Cache-Control', 'no-store');
      setHeader(response, 'X-Content-Type-Options', 'nosniff');
      streamHandle = registry.stream(wireRequest.serviceId, wireRequest.input, {}, {
        ...context,
        invocationId: wireRequest.invocationId,
        correlationId: wireRequest.correlationId,
        inputPolicyVerdict: wireRequest.inputPolicyVerdict,
        concurrencyKey: concurrencyKey(wireRequest, context, serviceDefinition)
      });
      for await (const frame of streamHandle) {
        if (requestScope.controller.signal.aborted || response.writableEnded) break;
        const outgoingFrame = frame.type === 'error'
          ? { ...frame, error: safeError(objectRecord(frame.error), exposeErrors) }
          : frame;
        const writable = response.write(`${JSON.stringify(outgoingFrame)}\n`);
        if (writable === false) await waitForDrain(response, requestScope.controller.signal);
      }
      endResponse(response);
      return true;
    } catch (error) {
      if (streamHandle && !streamHandle.signal.aborted) streamHandle.cancel(error);
      if (!response.headersSent && !response.writableEnded) {
        writeJson(response, errorStatus(error), responseEnvelope(wireRequest, {
          ok: false,
          error: safeError(error, exposeErrors)
        }));
      } else {
        endResponse(response);
      }
      return true;
    } finally {
      await requestScope.close('request-complete');
    }
  }

  function dispose(reason = 'Node app service host disposed.') {
    if (disposed) return false;
    disposed = true;
    const error = new AppServiceAbortError(String(reason), {
      code: 'xtend.maraca.app-service.disposed'
    });
    const scopes = Array.from(activeRequests);
    rootController.abort(error);
    scopes.forEach((scope) => {
      if (!scope.controller.signal.aborted) scope.controller.abort(error);
    });
    disposalPromise = Promise.allSettled(scopes.map((scope) => scope.close(error))).then(() => undefined);
    if (ownsRegistry) registry.dispose(reason);
    return true;
  }

  return Object.freeze({
    schema: MARACA_NODE_APP_SERVICE_HOST_SCHEMA,
    registry,
    pathPrefix,
    handle,
    handleEnvelope,
    streamEnvelope,
    dispose,
    whenDisposed() {
      return disposalPromise;
    },
    get disposed() {
      return disposed;
    }
  });
}

module.exports = {
  MARACA_NODE_APP_SERVICE_HOST_SCHEMA,
  createNodeAppServiceHost
};

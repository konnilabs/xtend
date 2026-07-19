'use strict';

const MARACA_APP_SERVICES_SCHEMA = 'xtend.maraca.app-services.v1';
const MARACA_APP_SERVICE_SCHEMA = 'xtend.maraca.app-service.v1';
const MARACA_APP_SERVICE_REGISTRY_SCHEMA = 'xtend.maraca.app-service-registry.v1';
const MARACA_APP_SERVICE_REQUEST_SCHEMA = 'xtend.maraca.app-service-request.v1';
const MARACA_APP_SERVICE_RESPONSE_SCHEMA = 'xtend.maraca.app-service-response.v1';
const MARACA_APP_SERVICE_STREAM_SCHEMA = 'xtend.maraca.app-service-stream.v1';
const MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA = 'xtend.maraca.app-service-stream-frame.v1';
const MARACA_APP_SERVICE_TRANSPORT_SCHEMA = 'xtend.maraca.app-service-transport.v1';

const SERVICE_KINDS = new Set(['query', 'command', 'stream']);
const SERVICE_TARGETS = new Set(['local', 'server', 'remote-surface']);
const CONCURRENCY_POLICIES = new Set(['latest', 'serial', 'parallel']);
const STREAM_FRAME_TYPES = new Set(['start', 'delta', 'tool-call', 'tool-result', 'complete', 'error', 'cancelled']);
const TERMINAL_STREAM_FRAME_TYPES = new Set(['complete', 'error', 'cancelled']);
const STREAM_HANDLER_NAMES = Object.freeze({
  start: 'onStart',
  delta: 'onDelta',
  'tool-call': 'onToolCall',
  'tool-result': 'onToolResult',
  complete: 'onComplete',
  error: 'onError',
  cancelled: 'onCancel'
});

class AppServiceError extends Error {
  constructor(message, options = {}) {
    super(String(message || 'App service operation failed.'));
    this.name = 'AppServiceError';
    this.code = options.code || 'xtend.maraca.app-service.error';
    this.details = options.details && typeof options.details === 'object' ? options.details : {};
    this.expose = options.expose === true;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

class AppServiceAbortError extends AppServiceError {
  constructor(message = 'App service operation was cancelled.', options = {}) {
    super(message, {
      ...options,
      code: options.code || 'xtend.maraca.app-service.cancelled'
    });
    this.name = 'AppServiceAbortError';
  }
}

class AppServiceStaleResultError extends AppServiceAbortError {
  constructor(message = 'A newer app service invocation superseded this result.', options = {}) {
    super(message, {
      ...options,
      code: 'xtend.maraca.app-service.stale'
    });
    this.name = 'AppServiceStaleResultError';
  }
}

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function requiredString(value, label) {
  const normalized = String(value == null ? '' : value).trim();
  if (!normalized) {
    throw new AppServiceError(`${label} is required.`, {
      code: 'xtend.maraca.app-service.invalid_contract',
      expose: true
    });
  }
  return normalized;
}

function defaultConcurrency(kind) {
  return kind === 'command' ? 'serial' : 'latest';
}

function assertChoice(value, choices, label) {
  if (!choices.has(value)) {
    throw new AppServiceError(`Unsupported ${label} ${value}.`, {
      code: 'xtend.maraca.app-service.invalid_contract',
      details: { [label]: value },
      expose: true
    });
  }
}

function service(options = {}) {
  const source = objectRecord(options);
  const kind = String(source.kind || 'query').trim();
  const target = String(source.target || 'local').trim();
  const concurrency = String(source.concurrency || defaultConcurrency(kind)).trim();
  assertChoice(kind, SERVICE_KINDS, 'kind');
  assertChoice(target, SERVICE_TARGETS, 'target');
  assertChoice(concurrency, CONCURRENCY_POLICIES, 'concurrency');
  if (source.invoke != null && typeof source.invoke !== 'function') {
    throw new AppServiceError('App service invoke must be a function.', {
      code: 'xtend.maraca.app-service.invalid_contract',
      expose: true
    });
  }
  if (source.stream != null && typeof source.stream !== 'function') {
    throw new AppServiceError('App service stream must be a function.', {
      code: 'xtend.maraca.app-service.invalid_contract',
      expose: true
    });
  }
  if (kind === 'stream' && source.invoke != null) {
    throw new AppServiceError('Stream services use stream, not invoke.', {
      code: 'xtend.maraca.app-service.invalid_contract',
      expose: true
    });
  }
  if (kind !== 'stream' && source.stream != null) {
    throw new AppServiceError(`${kind} services use invoke, not stream.`, {
      code: 'xtend.maraca.app-service.invalid_contract',
      expose: true
    });
  }
  return Object.freeze({
    schema: MARACA_APP_SERVICE_SCHEMA,
    kind,
    target,
    concurrency,
    invoke: source.invoke || null,
    stream: source.stream || null,
    metadata: Object.freeze({ ...objectRecord(source.metadata) })
  });
}

function defineServices(scope, entries) {
  const source = objectRecord(entries);
  if (entries !== source) {
    throw new AppServiceError('App services must be declared as an object keyed by service id.', {
      code: 'xtend.maraca.app-service.invalid_contract',
      expose: true
    });
  }
  const normalized = {};
  Object.entries(source).forEach(([serviceId, definition]) => {
    const id = requiredString(serviceId, 'App service id');
    if (!definition || definition.schema !== MARACA_APP_SERVICE_SCHEMA) {
      throw new AppServiceError(`App service ${id} must be created with service(...).`, {
        code: 'xtend.maraca.app-service.invalid_contract',
        details: { serviceId: id },
        expose: true
      });
    }
    const executesHere = definition.target === 'local' || (scope === 'server' && definition.target === 'server');
    const handler = definition.kind === 'stream' ? definition.stream : definition.invoke;
    if (executesHere && typeof handler !== 'function') {
      throw new AppServiceError(`App service ${id} requires a ${definition.kind === 'stream' ? 'stream' : 'invoke'} handler.`, {
        code: 'xtend.maraca.app-service.handler_missing',
        details: { serviceId: id, kind: definition.kind, target: definition.target },
        expose: true
      });
    }
    normalized[id] = Object.freeze({ ...definition, id });
  });
  return Object.freeze({
    schema: MARACA_APP_SERVICES_SCHEMA,
    scope,
    services: Object.freeze(normalized)
  });
}

function defineAppServices(entries) {
  return defineServices('client', entries);
}

function defineServerServices(entries) {
  return defineServices('server', entries);
}

function normalizeDefinition(input) {
  if (input && input.schema === MARACA_APP_SERVICES_SCHEMA) return input;
  return defineAppServices(input);
}

function createLinkedAbortController(signals = []) {
  const controller = new AbortController();
  const removers = [];
  const abortFrom = (signal) => {
    if (controller.signal.aborted) return;
    const reason = signal && signal.reason !== undefined
      ? signal.reason
      : new AppServiceAbortError();
    controller.abort(reason);
  };
  signals.filter(Boolean).forEach((signal) => {
    if (signal.aborted) {
      abortFrom(signal);
      return;
    }
    const listener = () => abortFrom(signal);
    signal.addEventListener('abort', listener, { once: true });
    removers.push(() => signal.removeEventListener('abort', listener));
  });
  return {
    controller,
    cleanup() {
      removers.splice(0).forEach((remove) => remove());
    }
  };
}

function abortReason(signal, fallback = 'App service operation was cancelled.') {
  if (signal && signal.reason instanceof Error) return signal.reason;
  return new AppServiceAbortError(fallback);
}

function raceWithAbort(value, signal) {
  if (!signal) return Promise.resolve(value);
  if (signal.aborted) return Promise.reject(abortReason(signal));
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(abortReason(signal));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(value).then((result) => {
      signal.removeEventListener('abort', onAbort);
      resolve(result);
    }, (error) => {
      signal.removeEventListener('abort', onAbort);
      reject(error);
    });
  });
}

function decorateInvocation(promise, record, cancel) {
  Object.defineProperties(promise, {
    id: { value: record.id, enumerable: true },
    invocationId: { value: record.invocationId, enumerable: true },
    correlationId: { value: record.correlationId, enumerable: true },
    sequence: { value: record.sequence, enumerable: true },
    signal: { value: record.controller.signal, enumerable: true },
    cancel: { value: cancel, enumerable: true }
  });
  return promise;
}

function createAsyncQueue() {
  const values = [];
  const waiters = [];
  let closed = false;
  function flush() {
    while (waiters.length && values.length) {
      waiters.shift().resolve({ value: values.shift(), done: false });
    }
    if (closed && !values.length) {
      while (waiters.length) waiters.shift().resolve({ value: undefined, done: true });
    }
  }
  return {
    push(value) {
      if (closed) return false;
      values.push(value);
      flush();
      return true;
    },
    close() {
      closed = true;
      flush();
    },
    iterator: {
      next() {
        if (values.length) return Promise.resolve({ value: values.shift(), done: false });
        if (closed) return Promise.resolve({ value: undefined, done: true });
        return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
      },
      return() {
        closed = true;
        flush();
        return Promise.resolve({ value: undefined, done: true });
      },
      [Symbol.asyncIterator]() {
        return this;
      }
    }
  };
}

function createAppServiceRegistry(definitionInput, options = {}) {
  const definition = normalizeDefinition(definitionInput);
  const services = definition.services;
  const transport = options.transport || null;
  const rootController = new AbortController();
  const active = new Map();
  const activeByConcurrency = new Map();
  const serialTails = new Map();
  const latestByService = new Map();
  const history = [];
  const listenerErrors = [];
  const historyLimit = Number.isInteger(options.historyLimit) && options.historyLimit > 0 ? options.historyLimit : 100;
  let sequence = 0;
  let disposed = false;

  function getService(serviceId) {
    const id = requiredString(serviceId, 'App service id');
    const definitionRecord = services[id];
    if (!definitionRecord) {
      throw new AppServiceError(`Unknown app service ${id}.`, {
        code: 'xtend.maraca.app-service.unknown',
        details: { serviceId: id },
        expose: true
      });
    }
    return definitionRecord;
  }

  function addActive(record) {
    active.set(record.id, record);
    if (!activeByConcurrency.has(record.concurrencyBucket)) activeByConcurrency.set(record.concurrencyBucket, new Set());
    activeByConcurrency.get(record.concurrencyBucket).add(record.id);
  }

  function removeActive(record) {
    active.delete(record.id);
    const ids = activeByConcurrency.get(record.concurrencyBucket);
    if (ids) {
      ids.delete(record.id);
      if (!ids.size) activeByConcurrency.delete(record.concurrencyBucket);
    }
    if (latestByService.get(record.concurrencyBucket) === record.id) latestByService.delete(record.concurrencyBucket);
    if (record.timeoutHandle) clearTimeout(record.timeoutHandle);
    record.linked.cleanup();
    history.push(Object.freeze({
      id: record.id,
      invocationId: record.invocationId,
      correlationId: record.correlationId,
      sequence: record.sequence,
      serviceId: record.serviceId,
      kind: record.service.kind,
      target: record.service.target,
      concurrency: record.service.concurrency,
      concurrencyKey: record.concurrencyKey,
      status: record.status
    }));
    if (history.length > historyLimit) history.splice(0, history.length - historyLimit);
  }

  function createRecord(serviceDefinition, context = {}) {
    if (disposed) {
      throw new AppServiceAbortError('App service registry is disposed.', {
        code: 'xtend.maraca.app-service.disposed'
      });
    }
    sequence += 1;
    const contextRecord = objectRecord(context);
    const linked = createLinkedAbortController([rootController.signal, contextRecord.signal]);
    const id = `xtend.maraca.app-service.invocation:${sequence}`;
    // `id` is the monotone registry-owned execution identity. A server host may
    // additionally preserve the validated wire invocation id for handler and
    // response correlation without weakening internal scheduling uniqueness.
    const invocationId = String(contextRecord.invocationId || id);
    const correlationId = String(contextRecord.correlationId || `xtend.maraca.app-service.correlation:${sequence}`);
    const concurrencyKey = String(contextRecord.concurrencyKey || serviceDefinition.id);
    const record = {
      id,
      invocationId,
      correlationId,
      sequence,
      serviceId: serviceDefinition.id,
      service: serviceDefinition,
      concurrencyKey,
      concurrencyBucket: `${serviceDefinition.id}\u0000${concurrencyKey}`,
      context: contextRecord,
      linked,
      controller: linked.controller,
      timeoutHandle: null,
      status: 'queued',
      promise: null
    };
    const timeoutMs = Number(contextRecord.timeoutMs);
    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
      record.timeoutHandle = setTimeout(() => {
        if (!record.controller.signal.aborted) {
          record.controller.abort(new AppServiceAbortError(`App service ${record.serviceId} timed out.`, {
            code: 'xtend.maraca.app-service.timeout',
            details: { serviceId: record.serviceId, timeoutMs }
          }));
        }
      }, timeoutMs);
    }
    return record;
  }

  function cancelRecord(record, reason) {
    if (!record || record.controller.signal.aborted) return false;
    record.controller.abort(reason instanceof Error ? reason : new AppServiceAbortError(String(reason || 'App service operation was cancelled.')));
    return true;
  }

  function cancelActiveForLatest(record) {
    const ids = activeByConcurrency.get(record.concurrencyBucket);
    if (!ids) return;
    Array.from(ids).forEach((id) => {
      const current = active.get(id);
      if (current) {
        cancelRecord(current, new AppServiceStaleResultError(
          `App service ${record.serviceId} invocation ${current.id} was superseded by ${record.id}.`,
          { details: { serviceId: record.serviceId, supersededBy: record.id } }
        ));
      }
    });
  }

  function schedule(record, runner) {
    if (record.service.concurrency === 'latest') cancelActiveForLatest(record);
    addActive(record);
    if (record.service.concurrency === 'latest') latestByService.set(record.concurrencyBucket, record.id);

    const execute = async () => {
      try {
        if (record.controller.signal.aborted) throw abortReason(record.controller.signal);
        record.status = 'running';
        return await runner();
      } catch (error) {
        if (record.controller.signal.aborted) {
          const reason = abortReason(record.controller.signal);
          record.status = reason && reason.code === 'xtend.maraca.app-service.stale' ? 'stale' : 'cancelled';
          throw reason;
        }
        if (record.status === 'running') record.status = 'rejected';
        throw error;
      } finally {
        removeActive(record);
      }
    };

    let scheduled;
    if (record.service.concurrency === 'serial') {
      const previous = serialTails.get(record.concurrencyBucket) || Promise.resolve();
      scheduled = previous.then(execute, execute);
      const tail = scheduled.then(() => undefined, () => undefined);
      serialTails.set(record.concurrencyBucket, tail);
      tail.then(() => {
        if (serialTails.get(record.concurrencyBucket) === tail) serialTails.delete(record.concurrencyBucket);
      });
    } else {
      scheduled = Promise.resolve().then(execute);
    }
    record.promise = scheduled;
    return scheduled;
  }

  function executionContext(record) {
    return Object.freeze({
      ...record.context,
      signal: record.controller.signal,
      serviceId: record.serviceId,
      kind: record.service.kind,
      target: record.service.target,
      concurrency: record.service.concurrency,
      concurrencyKey: record.concurrencyKey,
      executionId: record.id,
      invocationId: record.invocationId,
      correlationId: record.correlationId,
      sequence: record.sequence
    });
  }

  function executesLocally(serviceDefinition) {
    return serviceDefinition.target === 'local'
      || (definition.scope === 'server' && serviceDefinition.target === 'server');
  }

  async function runInvoke(record, input) {
    const context = executionContext(record);
    let result;
    if (executesLocally(record.service)) {
      result = await raceWithAbort(record.service.invoke(input, context), record.controller.signal);
    } else {
      if (!transport || typeof transport.invoke !== 'function') {
        throw new AppServiceError(`App service transport for ${record.serviceId} is missing.`, {
          code: 'xtend.maraca.app-service.transport_missing',
          details: { serviceId: record.serviceId, target: record.service.target }
        });
      }
      result = await raceWithAbort(transport.invoke({
        serviceId: record.serviceId,
        kind: record.service.kind,
        target: record.service.target,
        input,
        invocationId: record.invocationId,
        correlationId: record.correlationId,
        signal: record.controller.signal,
        context: record.context
      }), record.controller.signal);
    }
    if (record.controller.signal.aborted) throw abortReason(record.controller.signal);
    if (record.service.concurrency === 'latest' && latestByService.get(record.concurrencyBucket) !== record.id) {
      throw new AppServiceStaleResultError(undefined, {
        details: { serviceId: record.serviceId, invocationId: record.invocationId }
      });
    }
    record.status = 'fulfilled';
    return result;
  }

  function invoke(serviceId, input, context = {}) {
    let serviceDefinition;
    let record;
    try {
      serviceDefinition = getService(serviceId);
      if (serviceDefinition.kind === 'stream') {
        throw new AppServiceError(`App service ${serviceDefinition.id} is a stream and must be opened with stream().`, {
          code: 'xtend.maraca.app-service.mode_mismatch',
          details: { serviceId: serviceDefinition.id, expected: 'stream' },
          expose: true
        });
      }
      record = createRecord(serviceDefinition, context);
    } catch (error) {
      return Promise.reject(error);
    }
    const promise = schedule(record, () => runInvoke(record, input));
    record.promise = promise;
    return decorateInvocation(promise, record, (reason) => cancelRecord(record, new AppServiceAbortError(String(reason || 'App service invocation cancelled.'))));
  }

  function notifyStreamHandler(handlers, name, value) {
    if (!handlers || typeof handlers[name] !== 'function') return;
    try {
      handlers[name](value);
    } catch (error) {
      listenerErrors.push({ name, error });
    }
  }

  function stream(serviceId, input, handlers = {}, context = {}) {
    let serviceDefinition;
    let record;
    try {
      serviceDefinition = getService(serviceId);
      if (serviceDefinition.kind !== 'stream') {
        throw new AppServiceError(`App service ${serviceDefinition.id} is not a stream.`, {
          code: 'xtend.maraca.app-service.mode_mismatch',
          details: { serviceId: serviceDefinition.id, expected: serviceDefinition.kind },
          expose: true
        });
      }
      record = createRecord(serviceDefinition, context);
    } catch (error) {
      throw error;
    }

    const queue = createAsyncQueue();
    const seenFrameIds = new Set();
    const seenInputSequences = new Set();
    let highestInputSequence = -1;
    let outputSequence = 0;
    let terminalFrame = null;
    let resolveDone;
    const done = new Promise((resolve) => { resolveDone = resolve; });

    function normalizeFrame(value, fallbackType = 'delta') {
      const source = value && typeof value === 'object' && !Array.isArray(value) ? value : { value };
      const type = String(source.type || source.kind || fallbackType);
      if (!STREAM_FRAME_TYPES.has(type)) {
        throw new AppServiceError(`Unsupported app service stream frame type ${type}.`, {
          code: 'xtend.maraca.app-service.stream_protocol',
          details: { serviceId: record.serviceId, type }
        });
      }
      if (source.id != null && seenFrameIds.has(String(source.id))) return null;
      if (source.sequence != null) {
        const inputSequence = Number(source.sequence);
        if (Number.isInteger(inputSequence)) {
          if (seenInputSequences.has(inputSequence) || inputSequence <= highestInputSequence) return null;
          seenInputSequences.add(inputSequence);
          highestInputSequence = inputSequence;
        }
      }
      if (source.id != null) seenFrameIds.add(String(source.id));
      if (type === 'start' && outputSequence > 0) return null;
      outputSequence += 1;
      const id = String(source.id || `${record.invocationId}:frame:${outputSequence}`);
      seenFrameIds.add(id);
      return Object.freeze({
        schema: MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
        id,
        streamId: record.invocationId,
        serviceId: record.serviceId,
        invocationId: record.invocationId,
        correlationId: record.correlationId,
        sequence: outputSequence,
        type,
        value: Object.prototype.hasOwnProperty.call(source, 'value') ? source.value : null,
        delta: Object.prototype.hasOwnProperty.call(source, 'delta') ? source.delta : null,
        toolCall: Object.prototype.hasOwnProperty.call(source, 'toolCall') ? source.toolCall : (source.tool || null),
        toolResult: Object.prototype.hasOwnProperty.call(source, 'toolResult') ? source.toolResult : null,
        error: Object.prototype.hasOwnProperty.call(source, 'error') ? source.error : null
      });
    }

    function emit(value, fallbackType) {
      if (terminalFrame) return null;
      const frame = normalizeFrame(value, fallbackType);
      if (!frame) return null;
      queue.push(frame);
      notifyStreamHandler(handlers, 'onFrame', frame);
      notifyStreamHandler(handlers, STREAM_HANDLER_NAMES[frame.type], frame);
      if (TERMINAL_STREAM_FRAME_TYPES.has(frame.type)) {
        terminalFrame = frame;
        record.status = frame.type === 'complete' ? 'fulfilled' : (frame.type === 'error' ? 'rejected' : 'cancelled');
        queue.close();
        resolveDone(frame);
      }
      return frame;
    }

    function cancelStream(reason = 'App service stream cancelled.') {
      if (terminalFrame) return false;
      const cancellation = reason instanceof Error
        ? reason
        : new AppServiceAbortError(String(reason));
      const cancelled = cancelRecord(record, cancellation);
      if (!terminalFrame) emit({ type: 'cancelled', value: cancellation.message }, 'cancelled');
      return cancelled;
    }

    record.controller.signal.addEventListener('abort', () => {
      if (!terminalFrame) emit({ type: 'cancelled', value: abortReason(record.controller.signal).message }, 'cancelled');
    }, { once: true });

    const runStream = async () => {
      if (record.controller.signal.aborted) {
        if (!terminalFrame) emit({ type: 'cancelled', value: abortReason(record.controller.signal).message }, 'cancelled');
        return terminalFrame;
      }
      emit({ type: 'start' }, 'start');
      try {
        const handlerContext = executionContext(record);
        let source;
        if (executesLocally(record.service)) {
          source = await raceWithAbort(record.service.stream(input, handlerContext), record.controller.signal);
        } else {
          if (!transport || typeof transport.stream !== 'function') {
            throw new AppServiceError(`App service stream transport for ${record.serviceId} is missing.`, {
              code: 'xtend.maraca.app-service.transport_missing',
              details: { serviceId: record.serviceId, target: record.service.target }
            });
          }
          source = transport.stream({
            serviceId: record.serviceId,
            kind: record.service.kind,
            target: record.service.target,
            input,
            invocationId: record.invocationId,
            correlationId: record.correlationId,
            signal: record.controller.signal,
            context: record.context
          });
        }
        if (!source || typeof source[Symbol.asyncIterator] !== 'function') {
          throw new AppServiceError(`App service ${record.serviceId} stream handler must return an AsyncIterable.`, {
            code: 'xtend.maraca.app-service.stream_protocol',
            details: { serviceId: record.serviceId }
          });
        }
        const iterator = source[Symbol.asyncIterator]();
        try {
          while (!record.controller.signal.aborted && !terminalFrame) {
            const next = await raceWithAbort(iterator.next(), record.controller.signal);
            if (next.done) break;
            emit(next.value, 'delta');
          }
        } finally {
          if ((record.controller.signal.aborted || terminalFrame) && typeof iterator.return === 'function') {
            const cleanup = Promise.resolve(iterator.return()).catch(() => undefined);
            if (!record.controller.signal.aborted) {
              // A terminal frame leaves the producer paused at a yield, so its async
              // finally block is part of the observable lifecycle and whenIdle().
              await cleanup;
            }
          }
        }
        if (!terminalFrame) emit({ type: 'complete' }, 'complete');
      } catch (error) {
        if (record.controller.signal.aborted) {
          if (!terminalFrame) emit({ type: 'cancelled', value: abortReason(record.controller.signal).message }, 'cancelled');
        } else if (!terminalFrame) {
          emit({
            type: 'error',
            error: {
              code: error && error.code || 'xtend.maraca.app-service.stream_failed',
              message: error && error.message || String(error)
            }
          }, 'error');
        }
      }
      return terminalFrame;
    };

    const scheduled = schedule(record, runStream);
    scheduled.catch((error) => {
      if (!terminalFrame) {
        if (record.controller.signal.aborted) emit({ type: 'cancelled', value: abortReason(record.controller.signal).message }, 'cancelled');
        else emit({ type: 'error', error: { code: error && error.code, message: error && error.message || String(error) } }, 'error');
      }
    });

    return Object.freeze({
      schema: MARACA_APP_SERVICE_STREAM_SCHEMA,
      id: record.id,
      streamId: record.invocationId,
      invocationId: record.invocationId,
      correlationId: record.correlationId,
      sequence: record.sequence,
      signal: record.controller.signal,
      done,
      cancel: cancelStream,
      [Symbol.asyncIterator]() {
        return queue.iterator;
      }
    });
  }

  function cancel(identifier, reason = 'App service operation cancelled.') {
    const id = requiredString(identifier, 'Invocation or correlation id');
    let cancelled = 0;
    active.forEach((record) => {
      if (record.id === id || record.invocationId === id || record.correlationId === id) {
        if (cancelRecord(record, new AppServiceAbortError(String(reason)))) cancelled += 1;
      }
    });
    return Object.freeze({
      schema: 'xtend.maraca.app-service-cancel.v1',
      id,
      cancelled: cancelled > 0,
      count: cancelled,
      reason: String(reason)
    });
  }

  function dispose(reason = 'App service registry disposed.') {
    if (disposed) return false;
    disposed = true;
    rootController.abort(new AppServiceAbortError(String(reason), {
      code: 'xtend.maraca.app-service.disposed'
    }));
    if (options.disposeTransport === true && transport && typeof transport.dispose === 'function') transport.dispose(reason);
    return true;
  }

  async function whenIdle() {
    const promises = Array.from(active.values()).map((record) => record.promise).filter(Boolean);
    await Promise.allSettled(promises);
  }

  function snapshotRecord(record) {
    return Object.freeze({
      id: record.id,
      invocationId: record.invocationId,
      correlationId: record.correlationId,
      sequence: record.sequence,
      serviceId: record.serviceId,
      kind: record.service.kind,
      target: record.service.target,
      concurrency: record.service.concurrency,
      concurrencyKey: record.concurrencyKey,
      status: record.status,
      aborted: record.controller.signal.aborted
    });
  }

  return Object.freeze({
    schema: MARACA_APP_SERVICE_REGISTRY_SCHEMA,
    scope: definition.scope,
    invoke,
    stream,
    cancel,
    dispose,
    whenIdle,
    getService,
    listServices() {
      return Object.values(services);
    },
    listActive() {
      return Array.from(active.values()).map(snapshotRecord);
    },
    listHistory() {
      return history.slice();
    },
    listListenerErrors() {
      return listenerErrors.slice();
    },
    get disposed() {
      return disposed;
    }
  });
}

function buildWireRequest(request) {
  return {
    schema: MARACA_APP_SERVICE_REQUEST_SCHEMA,
    serviceId: requiredString(request.serviceId, 'App service id'),
    kind: request.kind || 'query',
    target: request.target || 'server',
    invocationId: request.invocationId || null,
    correlationId: request.correlationId || null,
    input: Object.prototype.hasOwnProperty.call(request, 'input') ? request.input : null
  };
}

function createTransportError(message, options = {}) {
  return new AppServiceError(message, {
    code: options.code || 'xtend.maraca.app-service.remote_error',
    details: options.details || {},
    expose: true,
    cause: options.cause
  });
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch (error) {
    throw createTransportError('App service endpoint returned invalid JSON.', {
      code: 'xtend.maraca.app-service.invalid_response',
      details: { status: response.status },
      cause: error
    });
  }
}

async function *iterateResponseBody(response) {
  const body = response.body;
  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        yield result.value;
      }
    } finally {
      reader.releaseLock();
    }
    return;
  }
  if (body && typeof body[Symbol.asyncIterator] === 'function') {
    for await (const chunk of body) yield chunk;
    return;
  }
  yield await response.text();
}

function createHttpAppServiceTransport(options = {}) {
  const fetchImplementation = options.fetch || (typeof globalThis !== 'undefined' && globalThis.fetch);
  if (typeof fetchImplementation !== 'function') {
    throw new AppServiceError('createHttpAppServiceTransport requires fetch.', {
      code: 'xtend.maraca.app-service.fetch_missing'
    });
  }
  const baseUrl = String(options.baseUrl || '').replace(/\/+$/u, '');
  const pathPrefix = `/${String(options.pathPrefix || '/api/xtend/services').replace(/^\/+|\/+$/gu, '')}`;
  const maxFrameBytes = Number.isInteger(options.maxFrameBytes) && options.maxFrameBytes > 0
    ? options.maxFrameBytes
    : 1024 * 1024;
  const rootController = new AbortController();
  const activeControllers = new Set();
  let disposed = false;

  function endpoint(serviceId) {
    return `${baseUrl}${pathPrefix}/${encodeURIComponent(requiredString(serviceId, 'App service id'))}`;
  }

  async function resolveHeaders(request, accept) {
    const configured = typeof options.headers === 'function' ? await options.headers(request) : objectRecord(options.headers);
    return {
      'Content-Type': 'application/json',
      Accept: accept,
      ...configured
    };
  }

  function linkedRequest(signal) {
    if (disposed) {
      throw new AppServiceAbortError('App service transport is disposed.', {
        code: 'xtend.maraca.app-service.disposed'
      });
    }
    const linked = createLinkedAbortController([rootController.signal, signal]);
    activeControllers.add(linked.controller);
    return {
      ...linked,
      cleanup() {
        activeControllers.delete(linked.controller);
        linked.cleanup();
      }
    };
  }

  async function invoke(request = {}) {
    const wireRequest = buildWireRequest(request);
    const linked = linkedRequest(request.signal);
    try {
      const response = await fetchImplementation(endpoint(wireRequest.serviceId), {
        method: 'POST',
        headers: await resolveHeaders(wireRequest, 'application/json'),
        credentials: options.credentials,
        body: JSON.stringify(wireRequest),
        signal: linked.controller.signal
      });
      const payload = await parseJsonResponse(response);
      if (!payload || payload.schema !== MARACA_APP_SERVICE_RESPONSE_SCHEMA) {
        throw createTransportError(`App service endpoint must return ${MARACA_APP_SERVICE_RESPONSE_SCHEMA}.`, {
          code: 'xtend.maraca.app-service.invalid_response',
          details: { status: response.status, serviceId: wireRequest.serviceId }
        });
      }
      if (!response.ok || payload && payload.ok === false) {
        const error = objectRecord(payload && payload.error);
        throw createTransportError(error.message || `App service endpoint failed with status ${response.status}.`, {
          code: error.code || 'xtend.maraca.app-service.remote_error',
          details: { status: response.status, serviceId: wireRequest.serviceId }
        });
      }
      if (payload && payload.schema === MARACA_APP_SERVICE_RESPONSE_SCHEMA) return payload.value;
      return payload;
    } catch (error) {
      if (linked.controller.signal.aborted) throw abortReason(linked.controller.signal);
      throw error;
    } finally {
      linked.cleanup();
    }
  }

  async function *stream(request = {}) {
    const wireRequest = buildWireRequest({ ...request, kind: 'stream' });
    const linked = linkedRequest(request.signal);
    try {
      const response = await fetchImplementation(endpoint(wireRequest.serviceId), {
        method: 'POST',
        headers: await resolveHeaders(wireRequest, 'application/x-ndjson'),
        credentials: options.credentials,
        body: JSON.stringify(wireRequest),
        signal: linked.controller.signal
      });
      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch (_) {
          // The status code remains sufficient when a host redacts the response body.
        }
        const remoteError = objectRecord(payload && payload.error);
        throw createTransportError(remoteError.message || `App service stream endpoint failed with status ${response.status}.`, {
          code: remoteError.code || 'xtend.maraca.app-service.remote_error',
          details: { status: response.status, serviceId: wireRequest.serviceId }
        });
      }
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = '';
      function parseFrame(line, trailing = false) {
        let frame;
        try {
          frame = JSON.parse(line);
        } catch (error) {
          throw createTransportError(`App service stream endpoint returned invalid ${trailing ? 'trailing ' : ''}NDJSON.`, {
            code: 'xtend.maraca.app-service.invalid_response',
            details: { serviceId: wireRequest.serviceId },
            cause: error
          });
        }
        if (!frame || frame.schema !== MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA) {
          throw createTransportError(`App service stream frame must use ${MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA}.`, {
            code: 'xtend.maraca.app-service.invalid_response',
            details: { serviceId: wireRequest.serviceId }
          });
        }
        return frame;
      }
      for await (const chunk of iterateResponseBody(response)) {
        buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        const lines = buffer.split(/\r?\n/u);
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          if (encoder.encode(line).byteLength > maxFrameBytes) {
            throw createTransportError(`App service stream frame exceeds the ${maxFrameBytes} byte limit.`, {
              code: 'xtend.maraca.app-service.invalid_response',
              details: { serviceId: wireRequest.serviceId, maxFrameBytes }
            });
          }
          yield parseFrame(line);
        }
        if (encoder.encode(buffer).byteLength > maxFrameBytes) {
          throw createTransportError(`App service stream frame exceeds the ${maxFrameBytes} byte limit.`, {
            code: 'xtend.maraca.app-service.invalid_response',
            details: { serviceId: wireRequest.serviceId, maxFrameBytes }
          });
        }
      }
      buffer += decoder.decode();
      if (buffer.trim()) {
        yield parseFrame(buffer, true);
      }
    } catch (error) {
      if (linked.controller.signal.aborted) throw abortReason(linked.controller.signal);
      throw error;
    } finally {
      linked.cleanup();
    }
  }

  function dispose(reason = 'App service transport disposed.') {
    if (disposed) return false;
    disposed = true;
    rootController.abort(new AppServiceAbortError(String(reason), {
      code: 'xtend.maraca.app-service.disposed'
    }));
    activeControllers.clear();
    return true;
  }

  return Object.freeze({
    schema: MARACA_APP_SERVICE_TRANSPORT_SCHEMA,
    kind: 'http',
    invoke,
    stream,
    dispose,
    endpoint
  });
}

export {
  MARACA_APP_SERVICES_SCHEMA,
  MARACA_APP_SERVICE_SCHEMA,
  MARACA_APP_SERVICE_REGISTRY_SCHEMA,
  MARACA_APP_SERVICE_REQUEST_SCHEMA,
  MARACA_APP_SERVICE_RESPONSE_SCHEMA,
  MARACA_APP_SERVICE_STREAM_SCHEMA,
  MARACA_APP_SERVICE_STREAM_FRAME_SCHEMA,
  MARACA_APP_SERVICE_TRANSPORT_SCHEMA,
  AppServiceError,
  AppServiceAbortError,
  AppServiceStaleResultError,
  service,
  defineAppServices,
  defineServerServices,
  createAppServiceRegistry,
  createHttpAppServiceTransport
};

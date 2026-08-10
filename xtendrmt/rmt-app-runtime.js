const __XTEND_RMT_APP_RUNTIME_API__ = (() => {
  const RMT_APP_RUNTIME_SCHEMA = 'xtend.rmt.app-runtime.v2';
  const RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA = 'xtend.rmt.app-runtime-diagnostic.v1';
  const RMT_COMMAND_SCHEMA = 'xtend.rmt.command.v1';
  const RMT_HOST_SERVICE_SCHEMA = 'xtend.rmt.host-service.v1';
  const RMT_STREAM_PATCH_SCHEMA = 'xtend.rmt.stream-patch.v1';
  const RMT_STREAM_PATCH_PLAN_SCHEMA = 'xtend.rmt.stream-patch-plan.v1';
  const RMT_STREAM_PATCH_COMMIT_SCHEMA = 'xtend.rmt.stream-patch-commit.v1';
  const RMT_STREAM_PRESSURE_SCHEMA = 'xtend.rmt.app-runtime-stream-pressure.v1';
  const RMT_YIELD_ACTION_SCHEMA = 'xtend.rmt.app-runtime-yield-action.v1';
  const RMT_VIEW_TEMPLATE_SCHEMA = 'xtend.rmt.view-template.v1';
  const RMT_APP_PRESENTATION_MODEL_SCHEMA = 'xtend.rmt.app-presentation-model.v1';
  const RMT_SEARCH_RUNTIME_SCHEMA = 'xtend.rmt.search-runtime.v1';
  const RMT_SEARCH_RESPONSE_SCHEMA = 'xtend.rmt.search-response.v1';
  const RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA = 'xtend.rmt.search-recommendation-response.v1';
  const RMT_SEARCH_WORKER_SCHEMA = 'xtend.rmt.prewarm-search-worker.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_runtime';
  const STREAM_PATCH_TYPES = new Set(['start', 'delta', 'tool-call', 'tool-result', 'complete', 'error', 'cancel']);
  const TERMINAL_STREAM_PATCH_TYPES = new Set(['complete', 'error', 'cancel']);
  const STREAM_PRESSURE_LEVELS = Object.freeze({
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  });
  const UI_WIRING_PATTERNS = Object.freeze([
    { id: 'document.querySelector', pattern: /\bdocument\s*\.\s*querySelector(?:All)?\s*\(/u },
    { id: 'document.getElementById', pattern: /\bdocument\s*\.\s*getElementById\s*\(/u },
    { id: 'addEventListener', pattern: /\.\s*addEventListener\s*\(/u },
    { id: 'createElement', pattern: /\bdocument\s*\.\s*createElement\s*\(/u },
    { id: 'appendChild', pattern: /\.\s*appendChild\s*\(/u },
    { id: 'replaceChildren', pattern: /\.\s*replaceChildren\s*\(/u }
  ]);
  const DEFAULT_SEARCH_FIELD_WEIGHTS = Object.freeze({
    title: 1,
    aliases: 0.92,
    keywords: 0.82,
    headings: 0.7,
    summary: 0.55,
    body: 0.35
  });
  const SEARCH_RECOMMENDATION_PROBE_WEIGHTS = Object.freeze({
    keyword: 1,
    title: 0.9,
    alias: 0.85,
    titleToken: 0.75,
    heading: 0.55
  });
  const STRUCTURAL_RECOMMENDATION_TERMS = new Set([
    'article', 'component', 'components', 'concept', 'content', 'documentation',
    'guide', 'learn', 'operate', 'operations', 'orientation', 'reference', 'section',
    'start', 'trunk', 'tutorial'
  ]);

  function clampString(value, fallback = '') {
    const normalized = String(value == null ? '' : value).trim();
    return normalized || fallback;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function objectRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function cloneValue(value, fallback = null) {
    if (typeof value === 'undefined') return fallback;
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((entry) => cloneValue(entry, entry));
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      const result = {};
      Object.entries(value).forEach(([key, entry]) => {
        result[key] = cloneValue(entry, entry);
      });
      return result;
    }
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function cloneAndFreeze(value, fallback = null) {
    const freeze = (entry) => {
      if (!entry || typeof entry !== 'object' || Object.isFrozen(entry)) return entry;
      Object.values(entry).forEach(freeze);
      return Object.freeze(entry);
    };
    return freeze(cloneValue(value, fallback));
  }

  const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

  function pathParts(path) {
    return String(path || '').split('.').filter(Boolean);
  }

  function hasUnsafePathSegment(parts) {
    return parts.some((part) => UNSAFE_PATH_SEGMENTS.has(part));
  }

  function readPath(source, path) {
    if (!path) return source;
    const parts = pathParts(path);
    if (hasUnsafePathSegment(parts)) return undefined;
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      cursor = cursor[part];
    }
    return cursor;
  }

  function writePath(target, path, value) {
    const parts = pathParts(path);
    if (hasUnsafePathSegment(parts)) return target;
    if (!parts.length) return target;
    let cursor = target;
    parts.slice(0, -1).forEach((part) => {
      if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) cursor[part] = {};
      cursor = cursor[part];
    });
    cursor[parts[parts.length - 1]] = value;
    return target;
  }

  function removePath(target, path) {
    const parts = pathParts(path);
    if (hasUnsafePathSegment(parts)) return target;
    if (!parts.length) return target;
    let cursor = target;
    for (const part of parts.slice(0, -1)) {
      if (!cursor || typeof cursor !== 'object') return target;
      cursor = cursor[part];
    }
    if (cursor && typeof cursor === 'object') delete cursor[parts[parts.length - 1]];
    return target;
  }

  let fallbackIdSequence = 0;
  const INERT_APP_HOST_PORT = Object.freeze({
    schema: 'xtend.rmt.app-host-port.inert.v1',
    now: () => 0,
    nowIso: () => '1970-01-01T00:00:00.000Z',
    createId(prefix = 'rmt') {
      fallbackIdSequence += 1;
      return `${String(prefix || 'rmt')}:local:${fallbackIdSequence}`;
    },
    schedule(task) {
      if (typeof task === 'function') task();
      return null;
    },
    createSearchWorker: () => null
  });

  function resolveAppHostPort(options = {}) {
    const record = objectRecord(options);
    const hostPort = record.hostPort || record.appHostPort || null;
    return hostPort && typeof hostPort === 'object' ? hostPort : INERT_APP_HOST_PORT;
  }

  function nowIso(clock, hostPort = INERT_APP_HOST_PORT) {
    if (hostPort && typeof hostPort.nowIso === 'function') return hostPort.nowIso(clock);
    if (typeof clock === 'function') {
      const value = clock();
      if (typeof value === 'string') return value;
    }
    return '1970-01-01T00:00:00.000Z';
  }

  function scheduleHostTask(hostPort, task, metadata = {}) {
    const schedulerPort = hostPort && typeof hostPort.schedule === 'function' ? hostPort : INERT_APP_HOST_PORT;
    return schedulerPort.schedule(task, metadata);
  }

  function createDiagnosticsRecorder(deps = {}) {
    const diagnostics = [];
    const diagnosticsHub = deps.diagnosticsHub || null;
    const channel = clampString(deps.diagnosticChannel, DEFAULT_DIAGNOSTIC_CHANNEL);
    return {
      diagnostics,
      publish(diagnostic) {
        diagnostics.push(diagnostic);
        if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
          diagnosticsHub.publish(channel, diagnostic, { schema: RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA });
        }
        return diagnostic;
      }
    };
  }

  function createDiagnostic(code, message, details = {}, severity = 'info') {
    return {
      schema: RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA,
      code,
      message,
      severity,
      details: cloneValue(details, {})
    };
  }

  function randomId(prefix, hostPort = INERT_APP_HOST_PORT) {
    return hostPort && typeof hostPort.createId === 'function'
      ? hostPort.createId(prefix)
      : INERT_APP_HOST_PORT.createId(prefix);
  }

  function createRmtCommandEnvelope(input = {}, defaults = {}) {
    const hostPort = resolveAppHostPort(defaults);
    const source = objectRecord(input.source || defaults.source);
    const payload = Object.prototype.hasOwnProperty.call(input, 'payload') ? input.payload : defaults.payload;
    const command = clampString(input.command || input.action || defaults.command || defaults.action, '');
    if (!command) throw new Error('RMT command envelope requires command.');
    return Object.freeze({
      schema: RMT_COMMAND_SCHEMA,
      id: clampString(input.id, randomId('rmt.command', hostPort)),
      source: Object.freeze({
        kind: clampString(source.kind, defaults.sourceKind || 'component'),
        id: clampString(source.id || source.component || source.surface, defaults.sourceId || ''),
        event: clampString(source.event, defaults.event || ''),
        surfaceId: clampString(source.surfaceId || source.surface, defaults.surfaceId || '')
      }),
      command,
      payload: cloneValue(payload, {}),
      target: input.target == null ? (defaults.target == null ? null : defaults.target) : input.target,
      correlationId: clampString(input.correlationId || defaults.correlationId, randomId('rmt.correlation', hostPort)),
      runId: clampString(input.runId || defaults.runId, ''),
      lane: clampString(input.lane || defaults.lane, 'user-blocking'),
      timestamp: input.timestamp || defaults.timestamp || nowIso(defaults.clock, hostPort)
    });
  }

  function isRmtCommandEnvelope(value) {
    return !!value && typeof value === 'object' && value.schema === RMT_COMMAND_SCHEMA && !!value.command;
  }

  function commandFromComponentEvent(eventName, detail = {}, defaults = {}) {
    const record = objectRecord(detail);
    if (isRmtCommandEnvelope(record)) return record;
    if (isRmtCommandEnvelope(record.command)) return record.command;
    return createRmtCommandEnvelope({
      source: {
        kind: 'component',
        id: record.id || record.componentId || defaults.componentId || '',
        event: eventName,
        surfaceId: record.surfaceId || defaults.surfaceId || ''
      },
      command: record.command || record.action || defaults.command || eventName,
      payload: Object.prototype.hasOwnProperty.call(record, 'payload') ? record.payload : record,
      target: record.target || defaults.target || null,
      correlationId: record.correlationId || defaults.correlationId,
      lane: record.lane || defaults.lane || 'user-blocking'
    }, defaults);
  }

  function normalizeHostServices(services) {
    return toArray(services).map((service) => {
      const record = objectRecord(service);
      return {
        schema: RMT_HOST_SERVICE_SCHEMA,
        id: clampString(record.id || record.name),
        adapter: clampString(record.adapter || record.id || record.name),
        mode: clampString(record.mode || record.kind, 'invoke'),
        cancelable: record.cancelable !== false,
        resultPath: clampString(record.resultPath, '')
      };
    }).filter((service) => service.id);
  }

  function createRmtHostServiceRegistry(options = {}) {
    const hostPort = resolveAppHostPort(options);
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const services = normalizeHostServices(options.services || options.hostServices);
    const adapters = objectRecord(options.adapters || options.hostAdapters);
    const serviceIndex = new Map(services.map((service) => [service.id, service]));
    const calls = [];
    const subscriptions = new Map();

    function resolveService(serviceId) {
      const id = clampString(serviceId);
      const service = serviceIndex.get(id) || {
        schema: RMT_HOST_SERVICE_SCHEMA,
        id,
        adapter: id,
        mode: 'invoke',
        cancelable: true,
        resultPath: ''
      };
      if (!id) throw new Error('RMT host service id is required.');
      return service;
    }

    function resolveAdapter(service) {
      return adapters[service.adapter] || adapters[service.id] || null;
    }

    async function invoke(serviceId, payload = {}, context = {}) {
      const service = resolveService(serviceId);
      const adapter = resolveAdapter(service);
      if (!adapter || typeof adapter.invoke !== 'function') {
        throw new Error(`RMT Host Service Adapter for ${service.id} is missing.`);
      }
      const record = {
        schema: 'xtend.rmt.host-service-call.v1',
        service: service.id,
        mode: 'invoke',
        command: context.command && context.command.id || null,
        correlationId: context.correlationId || context.command && context.command.correlationId || null
      };
      calls.push(record);
      const response = await adapter.invoke({ service, payload, context });
      diagnosticsRecorder.publish(createDiagnostic('rmt.host_service.invoke', `RMT Host Service ${service.id} invoked.`, record, 'info'));
      return service.resultPath ? readPath(response, service.resultPath) : response;
    }

    function subscribe(serviceId, payload = {}, handlers = {}, context = {}) {
      const service = resolveService(serviceId);
      const adapter = resolveAdapter(service);
      if (!adapter || typeof adapter.subscribe !== 'function') {
        throw new Error(`RMT Host Service subscription adapter for ${service.id} is missing.`);
      }
      const subscription = adapter.subscribe({ service, payload, context }, handlers);
      const subscriptionId = clampString(subscription && subscription.id, randomId(`rmt.subscription.${service.id}`, hostPort));
      subscriptions.set(subscriptionId, {
        service: service.id,
        subscription,
        context: cloneValue(context, {})
      });
      diagnosticsRecorder.publish(createDiagnostic('rmt.host_service.subscribe', `RMT Host Service ${service.id} subscribed.`, { service: service.id, subscriptionId }, 'info'));
      return {
        schema: 'xtend.rmt.host-service-subscription.v1',
        id: subscriptionId,
        service: service.id,
        unsubscribe() {
          const current = subscriptions.get(subscriptionId);
          subscriptions.delete(subscriptionId);
          if (current && current.subscription && typeof current.subscription.unsubscribe === 'function') {
            current.subscription.unsubscribe();
          } else if (current && current.subscription && typeof current.subscription.cancel === 'function') {
            current.subscription.cancel();
          }
        }
      };
    }

    async function stream(serviceId, payload = {}, handlers = {}, context = {}) {
      const service = resolveService(serviceId);
      const adapter = resolveAdapter(service);
      if (!adapter || typeof adapter.stream !== 'function') {
        throw new Error(`RMT Host Service stream adapter for ${service.id} is missing.`);
      }
      const streamHandle = await adapter.stream({ service, payload, context }, handlers);
      const streamId = clampString(streamHandle && streamHandle.id, randomId(`rmt.stream.${service.id}`, hostPort));
      subscriptions.set(streamId, {
        service: service.id,
        subscription: streamHandle,
        context: cloneValue(context, {})
      });
      diagnosticsRecorder.publish(createDiagnostic('rmt.host_service.stream', `RMT Host Service ${service.id} stream opened.`, { service: service.id, streamId }, 'info'));
      return {
        schema: 'xtend.rmt.host-service-stream.v1',
        id: streamId,
        service: service.id,
        cancel(reason = 'cancelled') {
          return cancel(streamId, reason);
        }
      };
    }

    function cancel(id, reason = 'cancelled') {
      const current = subscriptions.get(clampString(id));
      if (!current) return { schema: 'xtend.rmt.host-service-cancel.v1', id, cancelled: false, reason };
      subscriptions.delete(clampString(id));
      if (current.subscription && typeof current.subscription.cancel === 'function') current.subscription.cancel(reason);
      else if (current.subscription && typeof current.subscription.unsubscribe === 'function') current.subscription.unsubscribe();
      diagnosticsRecorder.publish(createDiagnostic('rmt.host_service.cancel', `RMT Host Service ${current.service} cancelled.`, { id, service: current.service, reason }, 'warning'));
      return { schema: 'xtend.rmt.host-service-cancel.v1', id, service: current.service, cancelled: true, reason };
    }

    return Object.freeze({
      schema: RMT_HOST_SERVICE_SCHEMA,
      invoke,
      subscribe,
      stream,
      cancel,
      listServices() {
        return services.map((service) => cloneValue(service, service));
      },
      listCalls() {
        return calls.map((call) => cloneValue(call, call));
      },
      listSubscriptions() {
        return Array.from(subscriptions.entries()).map(([id, record]) => ({
          id,
          service: record.service,
          context: cloneValue(record.context, {})
        }));
      },
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    });
  }

  function createRmtStreamPatch(input = {}, defaults = {}) {
    const hostPort = resolveAppHostPort(defaults);
    const type = clampString(input.type || input.kind || defaults.type, 'delta');
    if (!STREAM_PATCH_TYPES.has(type)) throw new Error(`Unsupported RMT stream patch type ${type}.`);
    return Object.freeze({
      schema: RMT_STREAM_PATCH_SCHEMA,
      id: clampString(input.id, randomId('rmt.stream.patch', hostPort)),
      type,
      streamId: clampString(input.streamId || defaults.streamId, ''),
      target: clampString(input.target || defaults.target, ''),
      correlationId: clampString(input.correlationId || defaults.correlationId, ''),
      delta: cloneValue(input.delta, null),
      value: cloneValue(input.value, null),
      toolCall: cloneValue(input.toolCall || input.tool, null),
      toolResult: cloneValue(input.toolResult, null),
      error: cloneValue(input.error, null),
      timestamp: input.timestamp || defaults.timestamp || nowIso(defaults.clock, hostPort)
    });
  }

  function updateCollection(collection, patch, options = {}) {
    const item = cloneValue(patch.value == null ? patch.delta : patch.value, {});
    const keyField = options.keyField || 'id';
    const key = clampString(item && item[keyField], '');
    if (!key) return collection.concat([item]);
    const index = collection.findIndex((entry) => entry && String(entry[keyField]) === key);
    if (index < 0) return collection.concat([item]);
    const next = collection.slice();
    next[index] = { ...objectRecord(next[index]), ...objectRecord(item) };
    return next;
  }

  function applyRmtStreamPatch(state = {}, patchInput = {}, options = {}) {
    const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA ? patchInput : createRmtStreamPatch(patchInput, options);
    const targetPath = clampString(patch.target || options.target, '');
    const next = cloneValue(state, {});
    if (!targetPath) return next;
    const current = readPath(next, targetPath);
    if (patch.type === 'start') {
      writePath(next, targetPath, options.initialValue != null ? cloneValue(options.initialValue, options.initialValue) : (Array.isArray(current) ? current : ''));
    } else if (patch.type === 'delta') {
      if (Array.isArray(current)) writePath(next, targetPath, updateCollection(current, patch, options));
      else writePath(next, targetPath, `${current == null ? '' : current}${patch.delta == null ? '' : String(patch.delta)}`);
    } else if (patch.type === 'tool-call') {
      writePath(next, targetPath, updateCollection(Array.isArray(current) ? current : [], { ...patch, value: patch.toolCall }, options));
    } else if (patch.type === 'tool-result') {
      writePath(next, targetPath, updateCollection(Array.isArray(current) ? current : [], { ...patch, value: patch.toolResult }, options));
    } else if (patch.type === 'complete') {
      if (patch.value !== null) writePath(next, targetPath, patch.value);
    } else if (patch.type === 'error') {
      writePath(next, targetPath, { status: 'error', error: patch.error || patch.value });
    } else if (patch.type === 'cancel') {
      writePath(next, targetPath, { status: 'cancelled' });
    }
    return next;
  }

  function resolveStreamModelTarget(modelSnapshot = {}, targetPath = '', options = {}) {
    const snapshot = objectRecord(modelSnapshot);
    const states = objectRecord(snapshot.states || snapshot.state || snapshot);
    const explicitState = clampString(options.targetState, '');
    const configuredStateIds = toArray(options.stateIds).map((entry) => clampString(entry, '')).filter(Boolean);
    const stateIds = configuredStateIds.length > 0 ? configuredStateIds : Object.keys(states);
    const target = clampString(targetPath, '');
    const stateId = explicitState || stateIds
      .filter((candidate) => target === candidate || target.startsWith(`${candidate}.`))
      .sort((left, right) => right.length - left.length)[0] || '';
    if (!stateId || !Object.prototype.hasOwnProperty.call(states, stateId)) return null;
    return {
      state: stateId,
      path: target === stateId ? '' : target.slice(stateId.length + 1),
      value: cloneValue(states[stateId], states[stateId])
    };
  }

  function createRmtStreamPatchPlan(modelSnapshot = {}, patchInput = {}, options = {}) {
    const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA
      ? patchInput
      : createRmtStreamPatch(patchInput, options);
    const diagnostics = [];
    const streamRecord = objectRecord(options.streamRecord);
    if (!patch.target || hasUnsafePathSegment(pathParts(patch.target))) {
      diagnostics.push(createDiagnostic(
        'rmt.stream.model-target-invalid',
        `RMT stream patch target ${patch.target || '(empty)'} is not a safe Model path.`,
        {
          target: patch.target || '',
          streamId: patch.streamId || '',
          correlationId: patch.correlationId || ''
        },
        'error'
      ));
      return cloneAndFreeze({
        schema: RMT_STREAM_PATCH_PLAN_SCHEMA,
        status: 'rejected',
        accepted: false,
        changed: false,
        patch,
        target: null,
        modelOperations: [],
        postCommitEffects: [],
        diagnostics,
        metadata: cloneValue(options.metadata, {})
      }, {});
    }
    if (TERMINAL_STREAM_PATCH_TYPES.has(streamRecord.status) && patch.type !== 'start') {
      diagnostics.push(createDiagnostic(
        'rmt.stream.patch.after_terminal',
        `RMT stream patch ${patch.type} arrived after ${streamRecord.status}.`,
        {
          streamId: patch.streamId || streamRecord.streamId || streamRecord.id || '',
          patchType: patch.type,
          correlationId: patch.correlationId || streamRecord.correlationId || ''
        },
        'warning'
      ));
      return cloneAndFreeze({
        schema: RMT_STREAM_PATCH_PLAN_SCHEMA,
        status: 'ignored',
        accepted: false,
        changed: false,
        patch,
        target: null,
        modelOperations: [],
        postCommitEffects: [],
        diagnostics,
        metadata: cloneValue(options.metadata, {})
      }, {});
    }
    const target = resolveStreamModelTarget(modelSnapshot, patch.target, options);
    if (!target) {
      diagnostics.push(createDiagnostic(
        'rmt.stream.model-target-unresolved',
        `RMT stream patch target ${patch.target || '(empty)'} does not resolve to a Model state.`,
        {
          target: patch.target || '',
          streamId: patch.streamId || '',
          correlationId: patch.correlationId || ''
        },
        'error'
      ));
      return cloneAndFreeze({
        schema: RMT_STREAM_PATCH_PLAN_SCHEMA,
        status: 'rejected',
        accepted: false,
        changed: false,
        patch,
        target: null,
        modelOperations: [],
        postCommitEffects: [],
        diagnostics,
        metadata: cloneValue(options.metadata, {})
      }, {});
    }
    const wrappedState = { value: cloneValue(target.value, target.value) };
    const relativeTarget = target.path ? `value.${target.path}` : 'value';
    const nextWrappedState = applyRmtStreamPatch(wrappedState, {
      ...patch,
      target: relativeTarget
    }, options);
    const nextValue = nextWrappedState.value;
    const changed = JSON.stringify(target.value) !== JSON.stringify(nextValue);
    const lifecycleActions = objectRecord(options.lifecycleActions);
    const lifecycleAction = TERMINAL_STREAM_PATCH_TYPES.has(patch.type)
      ? clampString(lifecycleActions[patch.type], '')
      : '';
    const postCommitEffects = lifecycleAction ? [{
      schema: 'xtend.rmt.stream-post-commit-effect.v1',
      type: 'dispatch-command',
      command: lifecycleAction,
      payload: {
        patch: cloneValue(patch, patch),
        state: cloneValue(nextValue, nextValue)
      },
      metadata: {
        lane: options.lane || 'visible',
        correlationId: patch.correlationId || '',
        sourceId: 'appRuntime.streamLifecycle',
        event: `stream-${patch.type}`
      }
    }] : [];
    return cloneAndFreeze({
      schema: RMT_STREAM_PATCH_PLAN_SCHEMA,
      status: 'planned',
      accepted: true,
      changed,
      patch,
      target: { state: target.state, path: target.path },
      modelOperations: changed ? [{ operation: 'set', state: target.state, value: nextValue }] : [],
      postCommitEffects,
      diagnostics,
      metadata: cloneValue(options.metadata, {})
    }, {});
  }

  function resolveReducerValue(record, context, fallback = undefined) {
    const value = Object.prototype.hasOwnProperty.call(record, 'value') ? record.value : fallback;
    if (typeof value === 'string' && value.startsWith('$')) return readPath(context, value.slice(1));
    return cloneValue(value, value);
  }

  function patchObjectAtPath(next, path, patch) {
    const current = path ? readPath(next, path) : next;
    const value = { ...objectRecord(current), ...objectRecord(patch) };
    if (path) writePath(next, path, value);
    else Object.keys(next).forEach((key) => delete next[key]);
    if (!path) Object.assign(next, value);
    return next;
  }

  function publishReducerDiagnostic(context, code, message, details = {}, severity = 'warning') {
    const diagnostic = createDiagnostic(code, message, details, severity);
    if (context && typeof context.publishDiagnostic === 'function') context.publishDiagnostic(diagnostic);
    else if (context && Array.isArray(context.diagnostics)) context.diagnostics.push(diagnostic);
    return diagnostic;
  }

  function choiceMenuItemValue(item, index = 0) {
    const record = objectRecord(item);
    if (Object.prototype.hasOwnProperty.call(record, 'value')) return clampString(record.value, String(index));
    if (Object.prototype.hasOwnProperty.call(record, 'id')) return clampString(record.id, String(index));
    if (Object.prototype.hasOwnProperty.call(record, 'name')) return clampString(record.name, String(index));
    if (Object.prototype.hasOwnProperty.call(record, 'toolName')) return clampString(record.toolName, String(index));
    return clampString(item, String(index));
  }

  function normalizeChoiceMenuItems(menu = {}) {
    const configuredItems = toArray(objectRecord(menu).items);
    const sourceItems = configuredItems.length > 0
      ? configuredItems
      : [{ value: clampString(menu.activeTool || menu.activeValue, 'auto'), label: menu.activeToolLabel || menu.label || 'Auto' }];
    return sourceItems.map((item, index) => {
      const record = objectRecord(item);
      const value = choiceMenuItemValue(item, index);
      const label = clampString(record.label || record.text || record.title, value);
      const triggerLabel = clampString(record.triggerLabel || record.activeLabel || record.buttonLabel, value === 'auto' ? 'Use tool' : label);
      const activeAttr = Object.prototype.hasOwnProperty.call(record, 'activeAttr')
        ? clampString(record.activeAttr, '')
        : Object.prototype.hasOwnProperty.call(record, 'activeToolAttr')
          ? clampString(record.activeToolAttr, '')
          : value === 'auto' ? '' : value;
      return {
        ...record,
        value,
        label,
        triggerLabel,
        activeAttr
      };
    });
  }

  function choiceMenuSelectedValue(value, fallback = '') {
    const record = objectRecord(value);
    if (Object.keys(record).length > 0) {
      return clampString(record.value || record.activeTool || record.activeValue || record.toolName || record.id || record.name, fallback);
    }
    return clampString(value, fallback);
  }

  function projectChoiceMenuState(menu = {}, selectedValue = undefined) {
    const record = objectRecord(menu);
    const items = normalizeChoiceMenuItems(record);
    const fallbackValue = items.length > 0 ? items[0].value : 'auto';
    const activeTool = choiceMenuSelectedValue(
      typeof selectedValue === 'undefined' ? record.activeTool || record.activeValue : selectedValue,
      fallbackValue
    );
    const activeItem = items.find((item) => item.value === activeTool) || items.find((item) => item.value === fallbackValue) || null;
    const activeLabel = activeItem
      ? activeItem.triggerLabel || activeItem.label || activeTool
      : activeTool === 'auto' ? 'Use tool' : activeTool;
    const activeAttr = activeItem
      ? activeItem.activeAttr
      : activeTool === 'auto' ? '' : activeTool;
    return {
      ...record,
      items,
      activeTool,
      activeValue: activeTool,
      activeToolLabel: activeLabel,
      activeToolAttr: activeAttr
    };
  }

  function applyRmtReducerRecipe(state = {}, reducer = {}, context = {}) {
    const next = cloneValue(state, {});
    const record = objectRecord(reducer);
    const recipe = clampString(record.recipe || record.kind || record.op || record.operation, '');
    const path = clampString(record.path || record.target || record.state, '');
    const current = path ? readPath(next, path) : next;
    const value = resolveReducerValue(record, context, context.value);

    if (recipe === 'open-dialog') {
      patchObjectAtPath(next, path, { open: true, hidden: false });
    } else if (recipe === 'close-dialog') {
      patchObjectAtPath(next, path, { open: false, hidden: true });
    } else if (recipe === 'toggle-menu') {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        patchObjectAtPath(next, path, { open: !current.open, hidden: !!current.open });
      } else {
        patchObjectAtPath(next, path, { open: !current, hidden: !!current });
      }
    } else if (recipe === 'toggle-choice-menu') {
      const menu = projectChoiceMenuState(current);
      if (menu.disabled) {
        patchObjectAtPath(next, path, menu);
      } else {
        patchObjectAtPath(next, path, { ...menu, open: !menu.open, hidden: false });
      }
    } else if (recipe === 'select-choice-menu') {
      const menu = projectChoiceMenuState(current);
      const selectedValue = choiceMenuSelectedValue(value, '');
      const selectedItem = menu.items.find((item) => item.value === selectedValue);
      if (!selectedItem) {
        publishReducerDiagnostic(context, 'rmt.choice_menu.invalid_value', `Choice menu value ${selectedValue || '(empty)'} is not available.`, {
          path,
          value: selectedValue,
          allowedValues: menu.items.map((item) => item.value)
        }, 'warning');
        patchObjectAtPath(next, path, menu);
      } else {
        patchObjectAtPath(next, path, { ...projectChoiceMenuState(menu, selectedValue), open: false, hidden: false });
      }
    } else if (recipe === 'project-choice-menu') {
      patchObjectAtPath(next, path, projectChoiceMenuState(current, value));
    } else if (recipe === 'set-draft') {
      writePath(next, path, value);
      if (record.dirtyPath) writePath(next, record.dirtyPath, true);
    } else if (recipe === 'dirty-draft') {
      if (record.draftPath) writePath(next, record.draftPath, value);
      if (record.dirtyPath) writePath(next, record.dirtyPath, true);
      if (!record.draftPath && !record.dirtyPath) patchObjectAtPath(next, path, { draft: value, dirty: true });
    } else if (recipe === 'reset-draft') {
      const resetValue = record.sourcePath ? readPath(next, record.sourcePath) : resolveReducerValue({ value: record.initialValue }, context, '');
      writePath(next, path, cloneValue(resetValue, resetValue));
      if (record.dirtyPath) writePath(next, record.dirtyPath, false);
    } else if (recipe === 'clear-error') {
      patchObjectAtPath(next, path, {
        hidden: true,
        error: null,
        text: Object.prototype.hasOwnProperty.call(record, 'text') ? record.text : 'No runtime error.'
      });
    } else if (recipe === 'busy-generation' || recipe === 'busy-status') {
      patchObjectAtPath(next, path, {
        busy: true,
        active: true,
        hidden: false,
        status: record.status || 'Working',
        text: record.text || 'Working...',
        tone: record.tone || 'info'
      });
    } else if (recipe === 'idle-generation' || recipe === 'idle-status') {
      patchObjectAtPath(next, path, {
        busy: false,
        active: false,
        status: record.status || 'Waiting',
        text: record.text || 'Ready.',
        tone: record.tone || 'success'
      });
    } else if (recipe === 'active-run') {
      patchObjectAtPath(next, path, {
        activeRunId: record.runId || context.runId || context.correlationId || '',
        activeCorrelationId: record.correlationId || context.correlationId || '',
        submitting: record.submitting !== false
      });
    } else {
      throw new Error(`Unsupported RMT reducer recipe ${recipe}.`);
    }
    return next;
  }

  function applyRmtReducer(state = {}, reducer = {}, context = {}) {
    const next = cloneValue(state, {});
    const record = objectRecord(reducer);
    const op = clampString(record.op || record.operation, 'set');
    if (op === 'recipe' || record.recipe) return applyRmtReducerRecipe(state, record, context);
    const path = clampString(record.path || record.target || record.state, '');
    const resolvedValue = resolveReducerValue(record, context, context.value);
    const current = path ? readPath(next, path) : next;

    if (op === 'set') writePath(next, path, resolvedValue);
    else if (op === 'patch') writePath(next, path, { ...objectRecord(current), ...objectRecord(resolvedValue) });
    else if (op === 'append') writePath(next, path, toArray(current).concat([resolvedValue]));
    else if (op === 'upsert') writePath(next, path, updateCollection(toArray(current), { value: resolvedValue }, record));
    else if (op === 'remove') {
      const keyField = record.keyField || 'id';
      const key = clampString(record.key || resolvedValue && resolvedValue[keyField], '');
      writePath(next, path, toArray(current).filter((entry) => String(entry && entry[keyField]) !== key));
    } else if (op === 'clear') writePath(next, path, Array.isArray(current) ? [] : null);
    else if (op === 'delete') removePath(next, path);
    else throw new Error(`Unsupported RMT reducer operation ${op}.`);
    return next;
  }

  function createRmtAppPresentationModel(template = {}, model = {}) {
    return cloneAndFreeze({
      schema: RMT_APP_PRESENTATION_MODEL_SCHEMA,
      template: cloneValue(objectRecord(template), {}),
      model: cloneValue(objectRecord(model), {})
    }, {});
  }

  function resolveRmtAppPresentationViewPort(explicitPort = null) {
    if (explicitPort && typeof explicitPort.project === 'function') return explicitPort;
    const error = new TypeError('RMT App presentation projection requires an injected RmtAppPresentationViewPort.');
    error.code = 'rmt.app.presentation-view-port-required';
    throw error;
  }

  function createRmtViewTemplateDescriptor(template = {}, model = {}, options = {}) {
    const viewPort = resolveRmtAppPresentationViewPort(
      options.presentationViewPort || options.viewProjectionPort || options.viewPort || null
    );
    return viewPort.project(createRmtAppPresentationModel(template, model), {
      compatibilityApi: 'createRmtViewTemplateDescriptor'
    });
  }

  function createNoManualUiWiringGate(options = {}) {
    const allowedFiles = new Set(toArray(options.allowedFiles));
    const allowedPatternIds = new Set(toArray(options.allowedPatternIds));
    return Object.freeze({
      schema: 'xtend.rmt.no-manual-ui-wiring-gate.v1',
      scanText(sourceText, scanOptions = {}) {
        const filePath = clampString(scanOptions.filePath, 'inline');
        if (allowedFiles.has(filePath)) return [];
        return UI_WIRING_PATTERNS
          .filter((record) => !allowedPatternIds.has(record.id) && record.pattern.test(String(sourceText || '')))
          .map((record) => ({
            schema: RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA,
            code: 'rmt.app_runtime.manual-ui-wiring',
            severity: 'error',
            sink: record.id,
            filePath,
            message: `Manual UI wiring sink ${record.id} is not allowed in RMT-owned app UI.`
          }));
      },
      scanFiles(files = {}) {
        return Object.entries(files).flatMap(([filePath, sourceText]) => this.scanText(sourceText, { filePath }));
      }
    });
  }

  function normalizeSearchText(value) {
    return String(value == null ? '' : value)
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/ß/g, 'ss')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function searchTokens(value) {
    const normalized = normalizeSearchText(value);
    return normalized ? normalized.split(' ').filter(Boolean) : [];
  }

  function boundedDamerauLevenshtein(leftValue, rightValue, maxDistance = 2) {
    const left = String(leftValue || '');
    const right = String(rightValue || '');
    if (left === right) return 0;
    if (!left || !right) return Math.max(left.length, right.length);
    if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;

    const previousPrevious = new Array(right.length + 1).fill(0);
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row += 1) {
      const current = [row];
      let rowMinimum = row;
      for (let column = 1; column <= right.length; column += 1) {
        const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
        let distance = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + substitutionCost
        );
        if (
          row > 1
          && column > 1
          && left[row - 1] === right[column - 2]
          && left[row - 2] === right[column - 1]
        ) {
          distance = Math.min(distance, previousPrevious[column - 2] + 1);
        }
        current[column] = distance;
        rowMinimum = Math.min(rowMinimum, distance);
      }
      if (rowMinimum > maxDistance) return maxDistance + 1;
      for (let index = 0; index < previous.length; index += 1) previousPrevious[index] = previous[index];
      previous = current;
    }
    return previous[right.length];
  }

  function fuzzyTokenScore(queryToken, candidateToken) {
    if (!queryToken || !candidateToken) return 0;
    if (queryToken === candidateToken) return 1;
    if (candidateToken.startsWith(queryToken)) return 0.9;
    if (candidateToken.includes(queryToken)) return 0.76;
    const maxDistance = queryToken.length >= 8 ? 2 : (queryToken.length >= 4 ? 1 : 0);
    if (maxDistance === 0) return 0;
    const distance = boundedDamerauLevenshtein(queryToken, candidateToken, maxDistance);
    if (distance > maxDistance) return 0;
    return Math.max(0.54, 0.76 - distance * 0.1);
  }

  function prepareSearchField(value) {
    return toArray(value).map(normalizeSearchText).filter(Boolean).map((normalized) => ({
      normalized,
      tokens: searchTokens(normalized)
    }));
  }

  function scorePreparedSearchField(query, queryTokens, values, fuzzyCache = null, allowFuzzy = true) {
    let best = 0;
    values.forEach((prepared) => {
      const normalized = prepared.normalized;
      if (normalized === query) best = Math.max(best, 1);
      else if (normalized.startsWith(query)) best = Math.max(best, 0.94);
      else if (normalized.includes(query)) best = Math.max(best, 0.82);

      const candidateTokens = prepared.tokens;
      if (queryTokens.length > 0 && candidateTokens.length > 0) {
        if (queryTokens.every((queryToken) => candidateTokens.includes(queryToken))) {
          best = Math.max(best, 1);
          return;
        }
        if (best >= 0.94 || !allowFuzzy) return;
        const tokenScores = queryTokens.map((queryToken) => candidateTokens.reduce((score, candidateToken) => {
          const cacheKey = fuzzyCache ? `${queryToken}\0${candidateToken}` : '';
          let tokenScore = fuzzyCache && fuzzyCache.has(cacheKey) ? fuzzyCache.get(cacheKey) : undefined;
          if (typeof tokenScore === 'undefined') {
            tokenScore = fuzzyTokenScore(queryToken, candidateToken);
            if (fuzzyCache) fuzzyCache.set(cacheKey, tokenScore);
          }
          return Math.max(score, tokenScore);
        }, 0));
        const covered = tokenScores.filter((score) => score > 0).length;
        if (covered > 0) {
          const average = tokenScores.reduce((sum, score) => sum + score, 0) / queryTokens.length;
          best = Math.max(best, average * (covered / queryTokens.length));
        }
      }
    });
    return Math.min(1, best);
  }

  function scoreSearchField(query, queryTokens, value) {
    return scorePreparedSearchField(query, queryTokens, prepareSearchField(value));
  }

  function prepareSearchEntry(entry) {
    return {
      title: prepareSearchField(entry.title),
      aliases: prepareSearchField(entry.aliases),
      keywords: prepareSearchField(entry.keywords),
      headings: prepareSearchField(entry.headings),
      summary: prepareSearchField(entry.summary),
      body: prepareSearchField(entry.body)
    };
  }

  function scorePreparedSearchEntry(prepared, query, queryTokens, weights, fuzzyCache = null, allowFuzzy = true) {
    const fieldScores = {
      title: scorePreparedSearchField(query, queryTokens, prepared.title, fuzzyCache, allowFuzzy),
      aliases: scorePreparedSearchField(query, queryTokens, prepared.aliases, fuzzyCache, allowFuzzy),
      keywords: scorePreparedSearchField(query, queryTokens, prepared.keywords, fuzzyCache, allowFuzzy),
      headings: scorePreparedSearchField(query, queryTokens, prepared.headings, fuzzyCache, allowFuzzy),
      summary: scorePreparedSearchField(query, queryTokens, prepared.summary, fuzzyCache, allowFuzzy),
      body: scorePreparedSearchField(query, queryTokens, prepared.body, fuzzyCache, allowFuzzy)
    };
    const weighted = Object.entries(fieldScores).map(([field, score]) => score * Number(weights[field] || 0));
    const strongest = weighted.reduce((best, score) => Math.max(best, score), 0);
    const supporting = weighted.filter((score) => score > 0).sort((left, right) => right - left).slice(1, 3);
    return {
      fieldScores,
      score: Math.min(1, strongest + supporting.reduce((sum, value) => sum + value * 0.08, 0))
    };
  }

  function normalizeSearchEntry(entry = {}) {
    const source = objectRecord(entry);
    return {
      id: clampString(source.id || source.slug, ''),
      slug: clampString(source.slug || source.id, ''),
      title: clampString(source.title || source.label, ''),
      aliases: toArray(source.aliases || source.searchAliases).map((value) => clampString(value, '')).filter(Boolean),
      keywords: toArray(source.keywords || source.tags).map((value) => clampString(value, '')).filter(Boolean),
      headings: toArray(source.headings).map((value) => clampString(value, '')).filter(Boolean),
      summary: clampString(source.summary || source.description, ''),
      body: clampString(source.body || source.text, ''),
      locale: clampString(source.locale, ''),
      parent: clampString(source.parent, ''),
      trunk: clampString(source.trunk, ''),
      section: clampString(source.section, ''),
      rank: Number.isFinite(Number(source.rank)) ? Number(source.rank) : 0,
      relatedSlugs: toArray(source.relatedSlugs || source.related).map((value) => clampString(value, '')).filter(Boolean),
      metadata: cloneValue(source.metadata, {})
    };
  }

  function searchEntries(entries = [], queryValue = '', options = {}) {
    const query = normalizeSearchText(queryValue);
    const minimumLength = Math.max(1, Number(options.minQueryLength || 2));
    const resultLimit = Math.max(1, Math.min(100, Number(options.resultLimit || 8)));
    const weights = {
      ...DEFAULT_SEARCH_FIELD_WEIGHTS,
      ...objectRecord(options.fieldWeights)
    };
    if (query.length < minimumLength) return [];
    const queryTokenList = searchTokens(query);

    return toArray(entries).map(normalizeSearchEntry).map((entry) => {
      const scored = scorePreparedSearchEntry(prepareSearchEntry(entry), query, queryTokenList, weights);
      return {
        id: entry.id || entry.slug,
        slug: entry.slug,
        title: entry.title,
        locale: entry.locale,
        score: Number(scored.score.toFixed(4)),
        fieldScores: scored.fieldScores,
        metadata: cloneValue(entry.metadata, {})
      };
    }).filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title) || left.slug.localeCompare(right.slug))
      .slice(0, resultLimit);
  }

  function mergeSearchResults(primary = [], fallback = [], resultLimit = 8) {
    const byId = new Map();
    primary.concat(fallback).forEach((entry) => {
      const key = entry && (entry.id || entry.slug);
      if (!key) return;
      const previous = byId.get(key);
      if (!previous || Number(entry.score || 0) > Number(previous.score || 0)) byId.set(key, entry);
    });
    return Array.from(byId.values())
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || String(left.title || '').localeCompare(String(right.title || '')))
      .slice(0, resultLimit);
  }

  function recommendEntries(entries = [], seedValue = {}, options = {}) {
    const normalizedEntries = toArray(entries).map(normalizeSearchEntry).filter((entry) => entry.slug);
    const requestedSeed = typeof seedValue === 'string'
      ? { slug: seedValue, id: seedValue }
      : normalizeSearchEntry(seedValue);
    let seed = normalizedEntries.find((entry) => (
      entry.slug === requestedSeed.slug
      || entry.id === requestedSeed.id
      || entry.aliases.includes(requestedSeed.slug)
    )) || requestedSeed;
    if (typeof seedValue === 'string' && !normalizedEntries.includes(seed)) {
      const fuzzySeed = searchEntries(normalizedEntries, seedValue, { resultLimit: 1, minQueryLength: 2 })[0];
      if (fuzzySeed && Number(fuzzySeed.score || 0) >= 0.54) {
        seed = normalizedEntries.find((entry) => entry.slug === fuzzySeed.slug) || seed;
      }
    }
    const excluded = new Set([
      seed.id,
      seed.slug,
      ...seed.aliases,
      ...toArray(options.excludeIds),
      ...toArray(options.excludeSlugs)
    ].map((value) => clampString(value, '')).filter(Boolean));
    const structuralTerms = new Set([
      ...STRUCTURAL_RECOMMENDATION_TERMS,
      normalizeSearchText(seed.trunk),
      normalizeSearchText(seed.section),
      ...toArray(options.structuralTerms).map(normalizeSearchText)
    ].filter(Boolean));
    const probesByValue = new Map();
    const addProbe = (value, kind, weight) => {
      const normalized = normalizeSearchText(value);
      if (normalized.length < 2 || structuralTerms.has(normalized)) return;
      const previous = probesByValue.get(normalized);
      if (!previous || weight > previous.weight) probesByValue.set(normalized, { value: String(value), normalized, kind, weight });
    };
    seed.keywords.forEach((value) => addProbe(value, 'keyword', SEARCH_RECOMMENDATION_PROBE_WEIGHTS.keyword));
    addProbe(seed.title, 'title', SEARCH_RECOMMENDATION_PROBE_WEIGHTS.title);
    seed.aliases.forEach((value) => addProbe(value, 'alias', SEARCH_RECOMMENDATION_PROBE_WEIGHTS.alias));
    searchTokens(seed.title).forEach((value) => addProbe(value, 'titleToken', SEARCH_RECOMMENDATION_PROBE_WEIGHTS.titleToken));
    seed.headings.slice(0, 6).forEach((value) => addProbe(value, 'heading', SEARCH_RECOMMENDATION_PROBE_WEIGHTS.heading));

    const preparedEntries = normalizedEntries.map((entry) => ({ entry, fields: prepareSearchEntry(entry) }));
    const probeValues = Array.from(probesByValue.values());
    const requestedResultLimit = Number(options.resultLimit || 7);
    const candidateLimit = Math.min(normalizedEntries.length, Math.max(15, requestedResultLimit + 5));
    const candidateEntries = preparedEntries.map((prepared) => {
      const searchable = ['title', 'aliases', 'keywords', 'headings'].flatMap((field) => prepared.fields[field]);
      let shortlistScore = 0;
      probeValues.forEach((probe) => {
        const probeTokens = searchTokens(probe.normalized);
        let matched = 0;
        searchable.forEach((value) => {
          if (value.normalized === probe.normalized || value.normalized.includes(probe.normalized) || probe.normalized.includes(value.normalized)) {
            matched = Math.max(matched, 1);
          } else if (probeTokens.some((token) => value.tokens.includes(token))) {
            matched = Math.max(matched, 0.55);
          }
        });
        shortlistScore += matched * probe.weight;
      });
      if (seed.relatedSlugs.includes(prepared.entry.slug) || prepared.entry.relatedSlugs.includes(seed.slug)) shortlistScore += 2;
      if ((prepared.entry.parent && prepared.entry.parent === seed.slug) || (seed.parent && seed.parent === prepared.entry.slug)) shortlistScore += 1.5;
      if (seed.parent && prepared.entry.parent === seed.parent) shortlistScore += 1.2;
      return { ...prepared, shortlistScore };
    }).filter(({ entry }) => !excluded.has(entry.slug) && !excluded.has(entry.id))
      .sort((left, right) => right.shortlistScore - left.shortlistScore || right.entry.rank - left.entry.rank || left.entry.slug.localeCompare(right.entry.slug))
      .slice(0, candidateLimit);
    const weights = { ...DEFAULT_SEARCH_FIELD_WEIGHTS, ...objectRecord(options.fieldWeights) };
    const fuzzyCache = new Map();
    const signalsBySlug = new Map();
    probeValues.forEach((probe) => {
      const queryTokens = searchTokens(probe.normalized);
      const allowFuzzy = probe.kind === 'keyword' || probe.kind === 'title' || probe.kind === 'alias';
      candidateEntries.forEach(({ entry, fields }) => {
        if (excluded.has(entry.slug) || excluded.has(entry.id)) return;
        const scored = scorePreparedSearchEntry(fields, probe.normalized, queryTokens, weights, fuzzyCache, allowFuzzy);
        if (scored.score <= 0) return;
        const signals = signalsBySlug.get(entry.slug) || [];
        signals.push({
          kind: probe.kind,
          probe: probe.value,
          score: Number((Number(scored.score || 0) * probe.weight).toFixed(4))
        });
        signalsBySlug.set(entry.slug, signals);
      });
    });

    const minimumScore = Number.isFinite(Number(options.minScore)) ? Number(options.minScore) : 0.3;
    const resultLimit = Math.max(1, Math.min(100, Number(options.resultLimit || 7)));
    const parentLimit = Math.max(1, Number(options.parentLimit || 3));
    const results = normalizedEntries.map((candidate) => {
      if (excluded.has(candidate.slug) || excluded.has(candidate.id)) return null;
      const signals = (signalsBySlug.get(candidate.slug) || []).sort((left, right) => right.score - left.score || left.probe.localeCompare(right.probe));
      const semanticScore = Math.min(1, Number(signals[0] && signals[0].score || 0)
        + Number(signals[1] && signals[1].score || 0) * 0.35
        + Number(signals[2] && signals[2].score || 0) * 0.2);
      let navigationBoost = 0;
      const navigationSignals = [];
      const directlyRelated = seed.relatedSlugs.includes(candidate.slug) || candidate.relatedSlugs.includes(seed.slug);
      if (directlyRelated) {
        navigationBoost += 0.18;
        navigationSignals.push('direct-link');
      }
      const parentChild = (candidate.parent && candidate.parent === seed.slug) || (seed.parent && seed.parent === candidate.slug);
      if (parentChild) {
        navigationBoost += 0.15;
        navigationSignals.push('parent-child');
      } else if (seed.parent && candidate.parent === seed.parent) {
        navigationBoost += 0.12;
        navigationSignals.push('same-parent');
      }
      if (seed.section && candidate.section === seed.section) {
        navigationBoost += 0.08;
        navigationSignals.push('same-section');
      }
      if (seed.trunk && candidate.trunk === seed.trunk) {
        navigationBoost += 0.03;
        navigationSignals.push('same-trunk');
      }
      const score = Number((semanticScore + navigationBoost).toFixed(4));
      if (score < minimumScore) return null;
      return {
        id: candidate.id || candidate.slug,
        slug: candidate.slug,
        title: candidate.title,
        locale: candidate.locale,
        parent: candidate.parent || null,
        trunk: candidate.trunk || null,
        section: candidate.section || null,
        rank: candidate.rank,
        score,
        semanticScore: Number(semanticScore.toFixed(4)),
        navigationBoost: Number(navigationBoost.toFixed(4)),
        signals: signals.slice(0, 3).map((signal) => cloneValue(signal, signal)),
        navigationSignals,
        metadata: cloneValue(candidate.metadata, {})
      };
    }).filter(Boolean).sort((left, right) => (
      right.score - left.score
      || right.rank - left.rank
      || left.title.localeCompare(right.title)
      || left.slug.localeCompare(right.slug)
    ));

    const parentCounts = new Map();
    const selected = [];
    for (const result of results) {
      const parentKey = result.parent || '';
      if (parentKey && Number(parentCounts.get(parentKey) || 0) >= parentLimit) continue;
      selected.push(result);
      if (parentKey) parentCounts.set(parentKey, Number(parentCounts.get(parentKey) || 0) + 1);
      if (selected.length >= resultLimit) break;
    }
    return selected.map((entry) => cloneValue(entry, entry));
  }

  function createRmtSearchWorkerSource() {
    const functions = [
      normalizeSearchText,
      searchTokens,
      boundedDamerauLevenshtein,
      fuzzyTokenScore,
      prepareSearchField,
      scorePreparedSearchField,
      scoreSearchField,
      prepareSearchEntry,
      scorePreparedSearchEntry,
      normalizeSearchEntry,
      searchEntries
    ].map((fn) => fn.toString()).join('\n');
    return `'use strict';\nconst RMT_SEARCH_RESPONSE_SCHEMA=${JSON.stringify(RMT_SEARCH_RESPONSE_SCHEMA)};\nconst DEFAULT_SEARCH_FIELD_WEIGHTS=${JSON.stringify(DEFAULT_SEARCH_FIELD_WEIGHTS)};\nconst toArray=(value)=>Array.isArray(value)?value:(value==null?[]:[value]);\nconst objectRecord=(value)=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};\nconst clampString=(value,fallback='')=>String(value==null?fallback:value).trim()||String(fallback||'').trim();\nconst cloneValue=(value,fallback=null)=>{try{return JSON.parse(JSON.stringify(value));}catch(_error){return fallback;}};\n${functions}\nconst searchIndexes=new Map();\nself.onmessage=(event)=>{const message=event&&event.data&&typeof event.data==='object'?event.data:{};if(message.action!=='search_index'){self.postMessage({id:message.id,ok:false,error:{message:'Unsupported prewarm search action.'}});return;}try{const envelope=message.envelope&&typeof message.envelope==='object'?message.envelope:{};const resourceId=clampString(envelope.resourceId,'');const providedEntries=Array.isArray(envelope.entries)?envelope.entries:null;if(resourceId&&providedEntries)searchIndexes.set(resourceId,providedEntries);const entries=providedEntries||(resourceId?searchIndexes.get(resourceId):null);if(!entries)throw new Error('Search index cache miss.');const results=searchEntries(entries,envelope.query,envelope.options);self.postMessage({id:message.id,ok:true,result:{schema:RMT_SEARCH_RESPONSE_SCHEMA,action:'search_index',generation:envelope.generation||'',resourceId,cacheHit:!providedEntries,results}});}catch(error){self.postMessage({id:message.id,ok:false,error:{message:error&&error.message?error.message:String(error)}});}};\n`;
  }

  function createRmtSearchPrewarmWorker(options = {}) {
    const hostPort = resolveAppHostPort(options);
    if (hostPort && typeof hostPort.createSearchWorker === 'function') {
      const worker = hostPort.createSearchWorker({
        source: createRmtSearchWorkerSource(),
        workerName: options.workerName || 'XTendRMTPrewarmSearchWorker',
        workerType: options.workerType || 'classic'
      });
      if (worker && typeof worker.dispatchSearchEnvelope === 'function') return worker;
    }
    return Object.freeze({
      schema: RMT_SEARCH_WORKER_SCHEMA,
      available: false,
      dispatchSearchEnvelope() {
        return Promise.reject(new Error('Prewarm search worker is unavailable.'));
      },
      terminate() {},
      snapshot() {
        return Object.freeze({
          schema: RMT_SEARCH_WORKER_SCHEMA,
          available: false,
          instantiated: false,
          pendingJobs: 0,
          submittedJobs: 0,
          resourceCache: true,
          cachedResourceCount: 0,
          ownership: Object.freeze({ dom: false, events: false, state: false, trustedDomCommit: false }),
          allowedActions: Object.freeze(['search_index'])
        });
      }
    });
  }

  function createRmtSearchRuntime(options = {}) {
    const hostPort = resolveAppHostPort(options);
    const sources = new Map(toArray(options.searchSources || options.sources).map((source) => [clampString(source && source.id, ''), objectRecord(source)]).filter(([id]) => id));
    const resources = new Map(Object.entries(objectRecord(options.resources)).map(([id, entries]) => [id, cloneValue(entries, [])]));
    const diagnostics = [];
    const history = [];
    const recommendationHistory = [];
    const resourceResolver = typeof options.resourceResolver === 'function' ? options.resourceResolver : null;
    const prewarmWorker = options.prewarmWorker && typeof options.prewarmWorker.dispatchSearchEnvelope === 'function'
      ? options.prewarmWorker
      : createRmtSearchPrewarmWorker(options);
    const workerResourceIds = new Set();
    const runtimeNow = () => hostPort && typeof hostPort.now === 'function' ? Number(hostPort.now()) || 0 : 0;
    let generation = 0;
    let recommendationGeneration = 0;

    async function resolveResource(resourceId, context = {}) {
      if (resources.has(resourceId)) return resources.get(resourceId);
      if (!resourceResolver) return [];
      const resolved = await resourceResolver(resourceId, context);
      resources.set(resourceId, cloneValue(resolved, []));
      return resources.get(resourceId);
    }

    async function runSearch(entries, query, searchOptions, currentGeneration, resourceId) {
      if (prewarmWorker && prewarmWorker.available !== false && typeof prewarmWorker.dispatchSearchEnvelope === 'function') {
        try {
          const workerSnapshot = typeof prewarmWorker.snapshot === 'function' ? prewarmWorker.snapshot() : null;
          const supportsResourceCache = Boolean(workerSnapshot && workerSnapshot.resourceCache === true && resourceId);
          const includeEntries = !supportsResourceCache || !workerResourceIds.has(resourceId);
          const response = await prewarmWorker.dispatchSearchEnvelope({
            generation: currentGeneration,
            resourceId,
            entries: includeEntries ? entries : undefined,
            query,
            options: searchOptions
          });
          if (supportsResourceCache) workerResourceIds.add(resourceId);
          return toArray(response && response.results);
        } catch (error) {
          if (resourceId) workerResourceIds.delete(resourceId);
          diagnostics.push({
            schema: RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA,
            code: 'rmt.search.worker.degraded',
            severity: 'warning',
            message: error && error.message ? error.message : String(error)
          });
        }
      }
      return searchEntries(entries, query, searchOptions);
    }

    async function query(sourceId, queryValue, queryOptions = {}) {
      const source = sources.get(sourceId) || sources.values().next().value || {};
      const currentGeneration = String(++generation);
      const resultLimit = Number(queryOptions.resultLimit || source.resultLimit || 8);
      const searchOptions = {
        minQueryLength: queryOptions.minQueryLength || source.minQueryLength || 2,
        resultLimit,
        fieldWeights: queryOptions.fieldWeights || source.fieldWeights || DEFAULT_SEARCH_FIELD_WEIGHTS
      };
      const compactResource = clampString(queryOptions.resource || source.resource, '');
      const fallbackResource = clampString(queryOptions.fallbackResource || source.fallbackResource, '');
      const compactEntries = await resolveResource(compactResource, { source, fulltext: false });
      const compactResults = await runSearch(compactEntries, queryValue, searchOptions, currentGeneration, compactResource);
      const threshold = Number(queryOptions.fallbackThreshold || source.fallbackThreshold || 0.6);
      const normalizedQuery = normalizeSearchText(queryValue);
      const belowMinimumLength = normalizedQuery.length < Number(searchOptions.minQueryLength || 2);
      const usefulCount = compactResults.filter((entry) => Number(entry.score || 0) >= threshold * 0.75).length;
      const shouldUseFallback = !belowMinimumLength
        && Boolean(fallbackResource)
        && (usefulCount < 3 || Number(compactResults[0] && compactResults[0].score || 0) < threshold);
      let fallbackResults = [];
      if (shouldUseFallback) {
        const fallbackEntries = await resolveResource(fallbackResource, { source, fulltext: true });
        fallbackResults = await runSearch(fallbackEntries, queryValue, searchOptions, currentGeneration, fallbackResource);
      }
      const superseded = currentGeneration !== String(generation);
      const results = superseded ? [] : mergeSearchResults(compactResults, fallbackResults, resultLimit);
      const response = {
        schema: RMT_SEARCH_RESPONSE_SCHEMA,
        sourceId: clampString(source.id, sourceId || ''),
        query: String(queryValue || ''),
        normalizedQuery,
        generation: currentGeneration,
        superseded,
        usedFulltext: shouldUseFallback,
        compactResultCount: compactResults.length,
        fallbackResultCount: fallbackResults.length,
        results
      };
      history.push(cloneValue(response, response));
      if (history.length > 50) history.shift();
      return response;
    }

    async function recommend(sourceId, seed, recommendationOptions = {}) {
      const source = sources.get(sourceId) || sources.values().next().value || {};
      const currentGeneration = String(++recommendationGeneration);
      const resourceId = clampString(recommendationOptions.resource || source.resource, '');
      const startedAt = runtimeNow();
      let rankingStartedAt = 0;
      let rankingCompletedAt = 0;
      let results = [];
      let status = 'ready';
      try {
        const entries = await resolveResource(resourceId, { source, fulltext: false, recommendation: true });
        await new Promise((resolve) => scheduleHostTask(hostPort, resolve, {
          delayMs: 0,
          lane: 'idle',
          sourceId,
          resourceId,
          phase: 'before-ranking'
        }));
        rankingStartedAt = runtimeNow();
        results = recommendEntries(entries, seed, recommendationOptions);
        rankingCompletedAt = runtimeNow();
        await new Promise((resolve) => scheduleHostTask(hostPort, resolve, {
          delayMs: 0,
          lane: 'idle',
          sourceId,
          resourceId,
          phase: 'after-ranking'
        }));
      } catch (error) {
        status = 'degraded';
        diagnostics.push({
          schema: RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA,
          code: 'rmt.search.recommendation.degraded',
          severity: 'warning',
          message: error && error.message ? error.message : String(error)
        });
      }
      const superseded = currentGeneration !== String(recommendationGeneration);
      const seedRecord = typeof seed === 'string' ? { id: seed, slug: seed } : normalizeSearchEntry(seed);
      const response = {
        schema: RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA,
        sourceId: clampString(source.id, sourceId || ''),
        seedId: clampString(seedRecord.id || seedRecord.slug, ''),
        seedSlug: clampString(seedRecord.slug || seedRecord.id, ''),
        generation: currentGeneration,
        superseded,
        status,
        resourceId,
        durationMs: Math.max(0, runtimeNow() - startedAt),
        rankingStartedAt,
        rankingCompletedAt,
        rankingDurationMs: Math.max(0, rankingCompletedAt - rankingStartedAt),
        resultCount: superseded ? 0 : results.length,
        results: superseded ? [] : results
      };
      recommendationHistory.push(cloneValue(response, response));
      if (recommendationHistory.length > 50) recommendationHistory.shift();
      return response;
    }

    return Object.freeze({
      schema: RMT_SEARCH_RUNTIME_SCHEMA,
      query,
      recommend,
      searchEntries,
      recommendEntries,
      registerSource(source = {}) {
        const id = clampString(source.id, '');
        if (id) sources.set(id, objectRecord(source));
        return id;
      },
      registerResource(id, entries = []) {
        resources.set(clampString(id, ''), cloneValue(entries, []));
        return toArray(entries).length;
      },
      listDiagnostics() {
        return diagnostics.map((entry) => cloneValue(entry, entry));
      },
      listHistory() {
        return history.map((entry) => cloneValue(entry, entry));
      },
      listRecommendationHistory() {
        return recommendationHistory.map((entry) => cloneValue(entry, entry));
      },
      snapshot() {
        return {
          schema: RMT_SEARCH_RUNTIME_SCHEMA,
          sourceCount: sources.size,
          resourceCount: resources.size,
          queryCount: history.length,
          recommendationCount: recommendationHistory.length,
          worker: prewarmWorker && typeof prewarmWorker.snapshot === 'function' ? prewarmWorker.snapshot() : null,
          diagnosticCount: diagnostics.length
        };
      },
      dispose() {
        workerResourceIds.clear();
        if (prewarmWorker && typeof prewarmWorker.terminate === 'function') prewarmWorker.terminate('search-runtime-dispose');
      }
    });
  }

  function runWithFabric(fabric, fiberInput, task) {
    if (fabric && typeof fabric.runFiber === 'function') return fabric.runFiber(fiberInput, task);
    return task(fiberInput);
  }

  function streamPressureValue(level) {
    return STREAM_PRESSURE_LEVELS[clampString(level, 'none')] || 0;
  }

  function streamPressureLevelForScore(score, explicitLevel) {
    const requested = clampString(explicitLevel, '');
    if (Object.prototype.hasOwnProperty.call(STREAM_PRESSURE_LEVELS, requested)) return requested;
    const numericScore = Number.isFinite(Number(score)) ? Number(score) : 0;
    if (numericScore >= 12) return 'critical';
    if (numericScore >= 8) return 'high';
    if (numericScore >= 4) return 'medium';
    if (numericScore >= 1) return 'low';
    return 'none';
  }

  function streamPressureActionFor(level, patchType) {
    if (patchType === 'complete') return 'release-stream-resources';
    if (patchType === 'cancel' || patchType === 'error' || level === 'critical') return 'protect-visible-work';
    if (level === 'high') return 'defer-lazy-hydration';
    if (level === 'medium') return 'rebalance-idle-work';
    if (level === 'low') return 'observe-stream-pressure';
    return 'continue';
  }

  function createRmtAppRuntime(options = {}) {
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const hostPort = resolveAppHostPort(options);
    const managedModel = options.managedModel === true || options.managedController === true;
    const modelReader = options.modelReader || options.model || null;
    const streamPatchDispatcher = typeof options.dispatchStreamPatch === 'function'
      ? options.dispatchStreamPatch
      : options.streamPatchCommandPort && typeof options.streamPatchCommandPort.dispatch === 'function'
        ? (patch, metadata) => options.streamPatchCommandPort.dispatch(patch, metadata)
        : null;
    if (options.managedController === true && (!modelReader || typeof modelReader.snapshot !== 'function')) {
      const error = new Error('Managed RMT App Runtime requires the read-only Model reader port.');
      error.code = 'rmt.app.model-reader-required';
      throw error;
    }
    const actionRuntime = options.actionRuntime || null;
    const fabric = options.fabric || null;
    const kernelRuntime = options.kernelRuntime || options.rmtRuntime || options.runtime || null;
    const scheduler = options.scheduler || options.kernelScheduler || options.rmtScheduler || kernelRuntime && kernelRuntime.scheduler || null;
    const performanceRuntime = options.performanceRuntime || options.kernelPerformanceRuntime || options.rmtPerformanceRuntime || kernelRuntime && kernelRuntime.performanceRuntime || null;
    const orchestrationController = options.kernelOrchestrationController || options.orchestrationController || null;
    const presentationViewPort = options.presentationViewPort || options.viewProjectionPort || null;
    const hostServices = options.hostServices && typeof options.hostServices.invoke === 'function'
      ? options.hostServices
      : createRmtHostServiceRegistry({
          services: options.services || options.hostServiceDefinitions,
          adapters: options.hostServiceAdapters || options.adapters,
          diagnosticsHub: options.diagnosticsHub,
          hostPort
        });
    const commandHistory = [];
    const streamHistory = [];
    const streamRecords = new Map();
    const streamPressureRecords = [];
    const yieldActions = [];
    const schedulerPressureSamples = [];
    const streamLifecycleActions = objectRecord(options.streamLifecycleActions || options.lifecycleActions);
    const telemetryLimit = Number.isInteger(options.telemetryLimit) && options.telemetryLimit > 0 ? options.telemetryLimit : 200;
    let appState = managedModel ? null : cloneValue(options.initialState, {});

    function managedModelSnapshot() {
      if (modelReader && typeof modelReader.snapshot === 'function') return modelReader.snapshot();
      return { states: {} };
    }

    function managedMutationError(operation) {
      const error = new Error(`Managed RMT App Runtime cannot ${operation}; use the Model command port through the Maraca controller.`);
      error.code = 'rmt.app.managed-model-mutation-forbidden';
      return error;
    }

    function trimTelemetryStore(store) {
      while (store.length > telemetryLimit) store.shift();
    }

    function streamRecordKey(patch) {
      return clampString(patch.streamId || patch.correlationId || patch.target || patch.id, '');
    }

    function getStreamRecord(patch) {
      const key = streamRecordKey(patch);
      if (!key) return null;
      if (!streamRecords.has(key)) {
        streamRecords.set(key, {
          schema: 'xtend.rmt.stream-lifecycle.v1',
          id: key,
          streamId: patch.streamId || '',
          target: patch.target || '',
          correlationId: patch.correlationId || '',
          status: 'idle',
          patchCount: 0,
          deltaCount: 0,
          toolCallCount: 0,
          toolResultCount: 0,
          cancellationReason: '',
          finalState: null,
          startedAt: '',
          completedAt: ''
        });
      }
      return streamRecords.get(key);
    }

    function recordStreamPatch(patch, reducerOptions = {}) {
      const record = getStreamRecord(patch);
      if (!record) return { record: null, accepted: true };
      if (TERMINAL_STREAM_PATCH_TYPES.has(record.status) && patch.type !== 'start') {
        diagnosticsRecorder.publish(createDiagnostic('rmt.stream.patch.after_terminal', `RMT stream patch ${patch.type} arrived after ${record.status}.`, {
          streamId: record.streamId || record.id,
          patchType: patch.type,
          correlationId: patch.correlationId || record.correlationId
        }, 'warning'));
        return { record: cloneValue(record, record), accepted: false };
      }
      record.patchCount += 1;
      if (patch.type === 'start') {
        record.status = 'start';
        record.startedAt = patch.timestamp;
        record.finalState = null;
      } else if (patch.type === 'delta') {
        record.status = 'delta';
        record.deltaCount += 1;
      } else if (patch.type === 'tool-call') {
        record.status = 'tool-call';
        record.toolCallCount += 1;
      } else if (patch.type === 'tool-result') {
        record.status = 'tool-result';
        record.toolResultCount += 1;
      } else if (TERMINAL_STREAM_PATCH_TYPES.has(patch.type)) {
        record.status = patch.type;
        record.completedAt = patch.timestamp;
        record.finalState = patch.type;
        if (patch.type === 'cancel') {
          record.cancellationReason = patch.value && patch.value.reason || reducerOptions.reason || 'cancelled';
        }
      }
      return { record: cloneValue(record, record), accepted: true };
    }

    function createStreamPressureRecord(patch, streamTelemetry = {}, reducerOptions = {}) {
      const record = objectRecord(streamTelemetry.record);
      const patchCount = Number.isFinite(Number(record.patchCount)) ? Number(record.patchCount) : 0;
      const deltaCount = Number.isFinite(Number(record.deltaCount)) ? Number(record.deltaCount) : 0;
      let score = Math.min(12, Math.max(0, patchCount + deltaCount));
      if (patch.type === 'delta') score = Math.min(12, Math.max(score, deltaCount + 2));
      if (patch.type === 'tool-call' || patch.type === 'tool-result') score = Math.max(score, 4);
      if (patch.type === 'complete') score = Math.max(score, 3);
      if (patch.type === 'cancel') score = Math.max(score, 8);
      if (patch.type === 'error') score = Math.max(score, 12);
      const explicitLevel = reducerOptions.streamPressureLevel || reducerOptions.backpressureLevel || options.streamPressureLevel;
      const level = patch.type === 'error'
        ? 'critical'
        : (patch.type === 'cancel' ? 'high' : streamPressureLevelForScore(score, explicitLevel));
      const terminal = TERMINAL_STREAM_PATCH_TYPES.has(patch.type);
      return Object.freeze({
        schema: RMT_STREAM_PRESSURE_SCHEMA,
        id: `${patch.streamId || patch.correlationId || patch.id || 'stream'}.pressure.${streamPressureRecords.length + 1}`,
        timestamp: patch.timestamp || nowIso(options.clock, hostPort),
        source: 'rmt-app-runtime',
        phase: terminal ? 'stream-terminal' : 'stream',
        streamId: patch.streamId || '',
        target: patch.target || '',
        correlationId: patch.correlationId || '',
        patchId: patch.id || '',
        patchType: patch.type,
        terminal,
        level,
        score,
        action: streamPressureActionFor(level, patch.type),
        lane: terminal ? 'background' : 'idle',
        schedulerLane: 'idle_maintenance',
        scheduleRef: terminal ? 'rmt.stream.terminal' : 'rmt.stream.patch',
        patchCount,
        deltaCount,
        finalState: record.finalState || null,
        cancellationReason: record.cancellationReason || ''
      });
    }

    function reportStreamPressureSample(pressureRecord) {
      const record = objectRecord(pressureRecord);
      const sample = {
        schema: 'xtend.rmt.app-runtime-stream-pressure-sample.v1',
        source: 'rmt.app_runtime.stream-pressure',
        phase: record.terminal ? 'stream-terminal' : 'stream-pressure',
        lane: 'idle_maintenance',
        scheduleRef: record.scheduleRef,
        durationMs: Math.max(1, Number(record.score || 0) * (record.level === 'critical' ? 10 : 6)),
        longTask: record.level === 'critical',
        pressureLevel: record.level,
        streamId: record.streamId,
        patchType: record.patchType,
        terminal: record.terminal === true,
        correlationId: record.correlationId,
        metadata: {
          streamPressure: record,
          action: record.action
        }
      };
      let result = null;
      let sampled = false;
      try {
        if (scheduler && typeof scheduler.reportPerformanceSample === 'function') {
          result = scheduler.reportPerformanceSample(sample);
          sampled = true;
        } else if (performanceRuntime && typeof performanceRuntime.reportPerformanceSample === 'function') {
          result = performanceRuntime.reportPerformanceSample(sample);
          sampled = true;
        } else if (kernelRuntime && typeof kernelRuntime.reportPerformanceSample === 'function') {
          result = kernelRuntime.reportPerformanceSample(sample);
          sampled = true;
        } else if (orchestrationController && typeof orchestrationController.recordAppRuntimeBackpressure === 'function') {
          result = orchestrationController.recordAppRuntimeBackpressure(record);
          sampled = true;
        }
      } catch (error) {
        result = {
          ok: false,
          error: error && error.message ? error.message : String(error)
        };
      }
      const entry = Object.freeze({
        ...sample,
        schedulerPressureSampled: sampled,
        schedulerResult: cloneValue(result, result)
      });
      schedulerPressureSamples.push(entry);
      trimTelemetryStore(schedulerPressureSamples);
      return entry;
    }

    function createYieldAction(pressureRecord, schedulerSample = null) {
      const record = objectRecord(pressureRecord);
      if (streamPressureValue(record.level) < STREAM_PRESSURE_LEVELS.high && record.terminal !== true) return null;
      const schedulerResult = objectRecord(schedulerSample && schedulerSample.schedulerResult);
      return Object.freeze({
        schema: RMT_YIELD_ACTION_SCHEMA,
        id: `${record.id || record.streamId || 'stream'}.yield.${yieldActions.length + 1}`,
        timestamp: record.timestamp || nowIso(options.clock, hostPort),
        source: 'rmt-app-runtime',
        reason: record.terminal ? `stream-${record.patchType}` : `stream-pressure-${record.level}`,
        action: record.action,
        lane: 'idle_maintenance',
        targetLane: 'visible',
        pressureLevel: record.level,
        schedulerPressureLevel: schedulerResult.pressureLevel || '',
        streamId: record.streamId,
        patchType: record.patchType,
        terminal: record.terminal === true,
        scheduleRef: record.scheduleRef,
        correlationId: record.correlationId,
        metadata: {
          streamPressureId: record.id,
          schedulerPressureSampled: schedulerSample && schedulerSample.schedulerPressureSampled === true
        }
      });
    }

    function recordStreamPressure(patch, streamTelemetry = {}, reducerOptions = {}) {
      const pressureRecord = createStreamPressureRecord(patch, streamTelemetry, reducerOptions);
      streamPressureRecords.push(pressureRecord);
      trimTelemetryStore(streamPressureRecords);
      const schedulerSample = reportStreamPressureSample(pressureRecord);
      const yieldAction = createYieldAction(pressureRecord, schedulerSample);
      if (yieldAction) {
        yieldActions.push(yieldAction);
        trimTelemetryStore(yieldActions);
      }
      diagnosticsRecorder.publish(createDiagnostic('rmt.stream.pressure', 'RMT stream pressure recorded.', {
        streamPressure: pressureRecord,
        yieldAction,
        schedulerPressureSample: schedulerSample
      }, streamPressureValue(pressureRecord.level) >= STREAM_PRESSURE_LEVELS.high ? 'warning' : 'info'));
      return { pressureRecord, schedulerSample, yieldAction };
    }

    async function dispatchCommand(commandInput, metadata = {}) {
      const command = isRmtCommandEnvelope(commandInput)
        ? commandInput
        : createRmtCommandEnvelope(commandInput, { ...objectRecord(metadata), hostPort });
      const fiberInput = {
        id: `fiber:${command.id}`,
        kind: 'rmt.command',
        source: 'rmt-app-runtime',
        phase: 'command',
        lane: command.lane || 'user-blocking',
        scheduleRef: 'rmt.command.dispatch',
        correlationId: command.correlationId,
        metadata: { command }
      };
      return runWithFabric(fabric, fiberInput, async () => {
        let result = null;
        if (actionRuntime && typeof actionRuntime.runAction === 'function') {
          result = await actionRuntime.runAction(command.command, command.payload, {
            ...objectRecord(metadata),
            commandEnvelope: command,
            correlationId: command.correlationId,
            lane: command.lane
          });
        }
        const record = {
          schema: 'xtend.rmt.command-dispatch-result.v1',
          command,
          result: cloneValue(result, result),
          status: result && result.status || 'dispatched'
        };
        commandHistory.push(record);
        diagnosticsRecorder.publish(createDiagnostic('rmt.command.dispatched', `RMT command ${command.command} dispatched.`, {
          command: command.command,
          commandId: command.id,
          correlationId: command.correlationId
        }, 'info'));
        return record;
      });
    }

    function command(commandName, payload = {}, options = {}) {
      if (isRmtCommandEnvelope(commandName)) return dispatchCommand(commandName, options.metadata || options);
      const defaults = {
        source: {
          kind: options.sourceKind || 'app-runtime',
          id: options.sourceId || 'appRuntime.command',
          event: options.event || 'command',
          surfaceId: options.surfaceId || ''
        },
        lane: options.lane || 'user-blocking',
        correlationId: options.correlationId,
        runId: options.runId
      };
      const envelope = createRmtCommandEnvelope({
        command: commandName,
        payload,
        target: Object.prototype.hasOwnProperty.call(options, 'target') ? options.target : null
      }, { ...defaults, hostPort });
      return dispatchCommand(envelope, options.metadata || options);
    }

    function refreshSnapshot(commandName = 'xtend.app.applySnapshot', payload = {}, options = {}) {
      return command(commandName, {
        reason: options.reason || 'app-runtime-refresh',
        ...objectRecord(payload)
      }, {
        ...objectRecord(options),
        lane: options.lane || 'visible',
        sourceId: options.sourceId || 'appRuntime.refreshSnapshot',
        event: options.event || 'snapshot-refresh'
      });
    }

    async function invokeService(serviceId, payload = {}, context = {}) {
      const command = context.command || null;
      return runWithFabric(fabric, {
        id: randomId(`fiber:rmt.service.${serviceId}`, hostPort),
        kind: 'rmt.service.invoke',
        source: 'rmt-app-runtime',
        phase: 'service',
        lane: context.lane || command && command.lane || 'user-blocking',
        scheduleRef: 'rmt.service.invoke',
        correlationId: context.correlationId || command && command.correlationId,
        metadata: { serviceId }
      }, () => hostServices.invoke(serviceId, payload, context));
    }

    function recordCommittedStreamPatch(patch, reducerOptions = {}) {
      const telemetry = recordStreamPatch(patch, reducerOptions);
      if (!telemetry.accepted) return { accepted: false, telemetry, streamPressure: null, signal: null };
      streamHistory.push(patch);
      const streamPressure = recordStreamPressure(patch, telemetry, reducerOptions);
      const pressureRecord = streamPressure.pressureRecord;
      const signal = fabric && typeof fabric.createBackpressureSignal === 'function' && (patch.type === 'delta' || pressureRecord.terminal)
        ? fabric.createBackpressureSignal({
          source: 'rmt-app-runtime',
          reason: pressureRecord.terminal ? 'stream-terminal' : 'stream-delta',
          lane: 'visible',
          level: pressureRecord.level,
          score: pressureRecord.score,
          action: pressureRecord.action,
          correlationId: patch.correlationId,
          scheduleRef: pressureRecord.scheduleRef,
          metadata: {
            streamPressure: pressureRecord,
            yieldAction: streamPressure.yieldAction
          }
        })
        : null;
      if (signal && fabric && typeof fabric.recordBackpressureSignal === 'function') {
        fabric.recordBackpressureSignal(signal);
      }
      if (fabric && typeof fabric.emitDiagnostic === 'function') {
        fabric.emitDiagnostic({
          code: 'rmt.stream.patch',
          message: 'RMT stream patch recorded.',
          source: 'rmt-app-runtime',
          phase: 'stream',
          lane: 'visible',
          correlationId: patch.correlationId,
          scheduleRef: 'rmt.stream.patch',
          backpressureSignal: signal,
          metadata: {
            patchType: patch.type,
            streamId: patch.streamId,
            patchCount: telemetry.record && telemetry.record.patchCount || 0,
            finalState: telemetry.record && telemetry.record.finalState || null,
            cancellationReason: telemetry.record && telemetry.record.cancellationReason || '',
            streamPressure: pressureRecord,
            yieldAction: streamPressure.yieldAction,
            schedulerPressureSample: streamPressure.schedulerSample,
            backpressureSignal: signal
          }
        });
      }
      if (signal) {
        diagnosticsRecorder.publish(createDiagnostic('rmt.stream.backpressure', 'RMT stream patch emitted a backpressure signal.', {
          patchType: patch.type,
          streamId: patch.streamId,
          correlationId: patch.correlationId,
          streamPressure: pressureRecord,
          yieldAction: streamPressure.yieldAction,
          backpressureSignal: signal
        }, 'info'));
      }
      return { accepted: true, telemetry, streamPressure, signal };
    }

    function planStreamPatch(patchInput, modelSnapshot = managedModelSnapshot(), reducerOptions = {}) {
      const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA
        ? patchInput
        : createRmtStreamPatch(patchInput, { ...objectRecord(reducerOptions), hostPort });
      const key = streamRecordKey(patch);
      const streamRecord = key && streamRecords.has(key) ? streamRecords.get(key) : null;
      return createRmtStreamPatchPlan(modelSnapshot, patch, {
        ...objectRecord(reducerOptions),
        streamRecord,
        lifecycleActions: {
          ...streamLifecycleActions,
          ...objectRecord(reducerOptions.lifecycleActions)
        },
        metadata: reducerOptions.metadata || reducerOptions
      });
    }

    function commitStreamPatchPlan(planInput, reducerOptions = {}) {
      const plan = objectRecord(planInput);
      if (plan.schema !== RMT_STREAM_PATCH_PLAN_SCHEMA) {
        throw new TypeError('RMT App Runtime expected a validated stream patch plan.');
      }
      if (plan.accepted !== true) {
        toArray(plan.diagnostics).forEach((diagnostic) => diagnosticsRecorder.publish(cloneValue(diagnostic, diagnostic)));
        return cloneAndFreeze({
          schema: RMT_STREAM_PATCH_COMMIT_SCHEMA,
          status: plan.status === 'rejected' ? 'rejected' : 'ignored',
          accepted: false,
          changed: false,
          patch: plan.patch || null,
          target: plan.target || null,
          modelOperations: [],
          postCommitEffects: [],
          diagnostics: plan.diagnostics || [],
          metadata: cloneValue(reducerOptions.metadata || reducerOptions, {})
        }, {});
      }
      const recorded = recordCommittedStreamPatch(plan.patch, reducerOptions);
      return cloneAndFreeze({
        schema: RMT_STREAM_PATCH_COMMIT_SCHEMA,
        status: recorded.accepted ? 'applied' : 'ignored',
        accepted: recorded.accepted,
        changed: plan.changed === true,
        patch: plan.patch,
        target: plan.target,
        modelOperations: plan.modelOperations || [],
        postCommitEffects: plan.postCommitEffects || [],
        diagnostics: plan.diagnostics || [],
        stream: recorded.telemetry && recorded.telemetry.record || null,
        streamPressure: recorded.streamPressure && recorded.streamPressure.pressureRecord || null,
        metadata: cloneValue(reducerOptions.metadata || reducerOptions, {})
      }, {});
    }

    function applyStreamPatch(patchInput, reducerOptions = {}) {
      if (managedModel) throw managedMutationError('apply stream patches directly');
      const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA
        ? patchInput
        : createRmtStreamPatch(patchInput, { ...objectRecord(reducerOptions), hostPort });
      const recorded = recordCommittedStreamPatch(patch, reducerOptions);
      if (!recorded.accepted) return cloneValue(appState, appState);
      appState = applyRmtStreamPatch(appState, patch, reducerOptions);
      return cloneValue(appState, appState);
    }

    async function handleStreamPatch(patchInput, reducerOptions = {}) {
      if (managedModel) {
        if (streamPatchDispatcher) return streamPatchDispatcher(patchInput, reducerOptions);
        throw managedMutationError('handle stream patches directly');
      }
      const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA
        ? patchInput
        : createRmtStreamPatch(patchInput, { ...objectRecord(reducerOptions), hostPort });
      const state = applyStreamPatch(patch, reducerOptions);
      const actionName = reducerOptions.lifecycleActions && reducerOptions.lifecycleActions[patch.type]
        || streamLifecycleActions[patch.type]
        || (patch.type === 'complete' ? streamLifecycleActions.complete : patch.type === 'error' ? streamLifecycleActions.error : patch.type === 'cancel' ? streamLifecycleActions.cancel : '');
      if (actionName && TERMINAL_STREAM_PATCH_TYPES.has(patch.type)) {
        await command(actionName, { patch, state }, {
          lane: reducerOptions.lane || 'visible',
          correlationId: patch.correlationId,
          sourceId: 'appRuntime.streamLifecycle',
          event: `stream-${patch.type}`
        });
      }
      return state;
    }

    async function streamService(serviceId, payload = {}, options = {}) {
      const commandEnvelope = options.command || null;
      const defaults = {
        streamId: options.streamId,
        target: options.target,
        correlationId: options.correlationId || commandEnvelope && commandEnvelope.correlationId
      };
      const handlers = {
        ...objectRecord(options.handlers),
        onPatch(record) {
          return handleStreamPatch(record, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onStreamPatch(record) {
          return handleStreamPatch(record, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onStart(value) {
          return handleStreamPatch({ type: 'start', value, ...defaults }, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onDelta(delta) {
          return handleStreamPatch({ type: 'delta', delta, ...defaults }, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onToolCall(toolCall) {
          return handleStreamPatch({ type: 'tool-call', toolCall, ...defaults }, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onToolResult(toolResult) {
          return handleStreamPatch({ type: 'tool-result', toolResult, ...defaults }, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onComplete(value) {
          return handleStreamPatch({ type: 'complete', value, ...defaults }, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onError(error) {
          return handleStreamPatch({ type: 'error', error, ...defaults }, { ...defaults, ...objectRecord(options.reducerOptions) });
        },
        onCancel(value) {
          return handleStreamPatch({ type: 'cancel', value, ...defaults }, { ...defaults, ...objectRecord(options.reducerOptions) });
        }
      };
      return runWithFabric(fabric, {
        id: randomId(`fiber:rmt.service.stream.${serviceId}`, hostPort),
        kind: 'rmt.service.stream',
        source: 'rmt-app-runtime',
        phase: 'service',
        lane: options.lane || commandEnvelope && commandEnvelope.lane || 'visible',
        scheduleRef: 'rmt.service.stream',
        correlationId: defaults.correlationId,
        metadata: { serviceId }
      }, () => hostServices.stream(serviceId, payload, handlers, {
        ...objectRecord(options.context),
        command: commandEnvelope,
        correlationId: defaults.correlationId,
        lane: options.lane || 'visible'
      }));
    }

    function applyReducer(reducer, context = {}) {
      if (managedModel) throw managedMutationError('apply reducers directly');
      appState = applyRmtReducer(appState, reducer, {
        ...objectRecord(context),
        publishDiagnostic: diagnosticsRecorder.publish
      });
      return cloneValue(appState, appState);
    }

    function applyRecipe(recipe, context = {}) {
      const record = typeof recipe === 'string' ? { op: 'recipe', recipe } : { ...objectRecord(recipe), op: 'recipe' };
      return applyReducer(record, context);
    }

    function getPerformanceTelemetrySnapshot() {
      const diagnostics = diagnosticsRecorder.diagnostics.slice();
      const backpressureSignals = diagnostics.flatMap((diagnostic) => {
        const metadata = objectRecord(diagnostic && diagnostic.metadata);
        const details = objectRecord(diagnostic && diagnostic.details);
        const signal = diagnostic && diagnostic.backpressureSignal
          || metadata.backpressureSignal
          || details.backpressureSignal;
        return signal ? [cloneValue(signal, signal)] : [];
      });
      return {
        schema: 'xtend.rmt.app-runtime-performance-telemetry.v1',
        commandCount: commandHistory.length,
        streamPatchCount: streamHistory.length,
        streamCount: streamRecords.size,
        diagnosticCount: diagnostics.length,
        backpressureSignalCount: backpressureSignals.length,
        backpressureSignals,
        streamPressureRecordCount: streamPressureRecords.length,
        streamPressureRecords: streamPressureRecords.map((entry) => cloneValue(entry, entry)),
        highestStreamPressureLevel: streamPressureRecords.reduce((level, record) => (
          streamPressureValue(record.level) > streamPressureValue(level) ? record.level : level
        ), 'none'),
        yieldActionCount: yieldActions.length,
        yieldActions: yieldActions.map((entry) => cloneValue(entry, entry)),
        schedulerSampleCount: schedulerPressureSamples.length,
        schedulerPressureSamples: schedulerPressureSamples.map((entry) => cloneValue(entry, entry)),
        streams: Array.from(streamRecords.values()).map((entry) => cloneValue(entry, entry))
      };
    }

    function listPanicRecoveryRecords() {
      const records = [];
      if (kernelRuntime && typeof kernelRuntime.listPanicRecoveryRecords === 'function') {
        records.push(...kernelRuntime.listPanicRecoveryRecords());
      }
      if (fabric && typeof fabric.getKernelPanicRecoveryRecords === 'function') {
        records.push(...fabric.getKernelPanicRecoveryRecords());
      }
      return records.map((record) => cloneValue(record, record));
    }

    function getPanicRecoverySnapshot() {
      const kernelSnapshot = kernelRuntime && typeof kernelRuntime.getPanicRecoverySnapshot === 'function'
        ? kernelRuntime.getPanicRecoverySnapshot()
        : null;
      const fabricSnapshot = fabric && typeof fabric.getPanicRecoverySnapshot === 'function'
        ? fabric.getPanicRecoverySnapshot()
        : null;
      const records = listPanicRecoveryRecords();
      return {
        schema: 'xtend.rmt.app-runtime-panic-recovery-snapshot.v1',
        recordCount: records.length,
        kernel: cloneValue(kernelSnapshot, kernelSnapshot),
        fabric: cloneValue(fabricSnapshot, fabricSnapshot),
        records
      };
    }

    return Object.freeze({
      schema: RMT_APP_RUNTIME_SCHEMA,
      command,
      refreshSnapshot,
      dispatchCommand,
      invokeService,
      streamService,
      planStreamPatch,
      commitStreamPatchPlan,
      applyStreamPatch,
      handleStreamPatch,
      applyReducer,
      applyRecipe,
      createPresentationModel: createRmtAppPresentationModel,
      projectViewTemplate(template = {}, model = {}) {
        return resolveRmtAppPresentationViewPort(presentationViewPort).project(
          createRmtAppPresentationModel(template, model),
          { source: 'rmt-app-runtime' }
        );
      },
      createCommandEnvelope(input = {}, defaults = {}) {
        return createRmtCommandEnvelope(input, { ...objectRecord(defaults), hostPort });
      },
      hostServices,
      getState() {
        if (managedModel) return cloneValue(objectRecord(managedModelSnapshot()).states, {});
        return cloneValue(appState, appState);
      },
      setState(value) {
        if (managedModel) throw managedMutationError('set application state directly');
        appState = cloneValue(value, {});
        return cloneValue(appState, appState);
      },
      listCommands() {
        return commandHistory.map((entry) => cloneValue(entry, entry));
      },
      listStreamPatches() {
        return streamHistory.map((entry) => cloneValue(entry, entry));
      },
      listStreams() {
        return Array.from(streamRecords.values()).map((entry) => cloneValue(entry, entry));
      },
      listStreamPressureRecords() {
        return streamPressureRecords.map((entry) => cloneValue(entry, entry));
      },
      listYieldActions() {
        return yieldActions.map((entry) => cloneValue(entry, entry));
      },
      listSchedulerPressureSamples() {
        return schedulerPressureSamples.map((entry) => cloneValue(entry, entry));
      },
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      },
      getPerformanceTelemetrySnapshot,
      listPanicRecoveryRecords,
      getPanicRecoverySnapshot
    });
  }

  const api = Object.freeze({
    RMT_APP_RUNTIME_SCHEMA,
    RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA,
    RMT_COMMAND_SCHEMA,
    RMT_HOST_SERVICE_SCHEMA,
    RMT_STREAM_PATCH_SCHEMA,
    RMT_STREAM_PATCH_PLAN_SCHEMA,
    RMT_STREAM_PATCH_COMMIT_SCHEMA,
    RMT_STREAM_PRESSURE_SCHEMA,
    RMT_YIELD_ACTION_SCHEMA,
    RMT_VIEW_TEMPLATE_SCHEMA,
    RMT_APP_PRESENTATION_MODEL_SCHEMA,
    RMT_SEARCH_RUNTIME_SCHEMA,
    RMT_SEARCH_RESPONSE_SCHEMA,
    RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA,
    RMT_SEARCH_WORKER_SCHEMA,
    createRmtCommandEnvelope,
    isRmtCommandEnvelope,
    commandFromComponentEvent,
    createRmtHostServiceRegistry,
    createRmtStreamPatch,
    createRmtStreamPatchPlan,
    applyRmtStreamPatch,
    applyRmtReducer,
    applyRmtReducerRecipe,
    createRmtAppPresentationModel,
    createRmtViewTemplateDescriptor,
    createNoManualUiWiringGate,
    normalizeSearchText,
    boundedDamerauLevenshtein,
    searchEntries,
    recommendEntries,
    createRmtSearchWorkerSource,
    createRmtSearchPrewarmWorker,
    createRmtSearchRuntime,
    createRmtAppRuntime
  });

  return api;
})();

export const RMT_APP_RUNTIME_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_APP_RUNTIME_SCHEMA;
export const RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA;
export const RMT_COMMAND_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_COMMAND_SCHEMA;
export const RMT_HOST_SERVICE_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_HOST_SERVICE_SCHEMA;
export const RMT_STREAM_PATCH_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_STREAM_PATCH_SCHEMA;
export const RMT_STREAM_PATCH_PLAN_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_STREAM_PATCH_PLAN_SCHEMA;
export const RMT_STREAM_PATCH_COMMIT_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_STREAM_PATCH_COMMIT_SCHEMA;
export const RMT_STREAM_PRESSURE_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_STREAM_PRESSURE_SCHEMA;
export const RMT_YIELD_ACTION_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_YIELD_ACTION_SCHEMA;
export const RMT_VIEW_TEMPLATE_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_VIEW_TEMPLATE_SCHEMA;
export const RMT_APP_PRESENTATION_MODEL_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_APP_PRESENTATION_MODEL_SCHEMA;
export const RMT_SEARCH_RUNTIME_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_SEARCH_RUNTIME_SCHEMA;
export const RMT_SEARCH_RESPONSE_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_SEARCH_RESPONSE_SCHEMA;
export const RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_SEARCH_RECOMMENDATION_RESPONSE_SCHEMA;
export const RMT_SEARCH_WORKER_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_SEARCH_WORKER_SCHEMA;
export const createRmtCommandEnvelope = __XTEND_RMT_APP_RUNTIME_API__.createRmtCommandEnvelope;
export const isRmtCommandEnvelope = __XTEND_RMT_APP_RUNTIME_API__.isRmtCommandEnvelope;
export const commandFromComponentEvent = __XTEND_RMT_APP_RUNTIME_API__.commandFromComponentEvent;
export const createRmtHostServiceRegistry = __XTEND_RMT_APP_RUNTIME_API__.createRmtHostServiceRegistry;
export const createRmtStreamPatch = __XTEND_RMT_APP_RUNTIME_API__.createRmtStreamPatch;
export const createRmtStreamPatchPlan = __XTEND_RMT_APP_RUNTIME_API__.createRmtStreamPatchPlan;
export const applyRmtStreamPatch = __XTEND_RMT_APP_RUNTIME_API__.applyRmtStreamPatch;
export const applyRmtReducer = __XTEND_RMT_APP_RUNTIME_API__.applyRmtReducer;
export const applyRmtReducerRecipe = __XTEND_RMT_APP_RUNTIME_API__.applyRmtReducerRecipe;
export const createRmtAppPresentationModel = __XTEND_RMT_APP_RUNTIME_API__.createRmtAppPresentationModel;
export const createRmtViewTemplateDescriptor = __XTEND_RMT_APP_RUNTIME_API__.createRmtViewTemplateDescriptor;
export const createNoManualUiWiringGate = __XTEND_RMT_APP_RUNTIME_API__.createNoManualUiWiringGate;
export const normalizeSearchText = __XTEND_RMT_APP_RUNTIME_API__.normalizeSearchText;
export const boundedDamerauLevenshtein = __XTEND_RMT_APP_RUNTIME_API__.boundedDamerauLevenshtein;
export const searchEntries = __XTEND_RMT_APP_RUNTIME_API__.searchEntries;
export const recommendEntries = __XTEND_RMT_APP_RUNTIME_API__.recommendEntries;
export const createRmtSearchWorkerSource = __XTEND_RMT_APP_RUNTIME_API__.createRmtSearchWorkerSource;
export const createRmtSearchPrewarmWorker = __XTEND_RMT_APP_RUNTIME_API__.createRmtSearchPrewarmWorker;
export const createRmtSearchRuntime = __XTEND_RMT_APP_RUNTIME_API__.createRmtSearchRuntime;
export const createRmtAppRuntime = __XTEND_RMT_APP_RUNTIME_API__.createRmtAppRuntime;

export default __XTEND_RMT_APP_RUNTIME_API__;

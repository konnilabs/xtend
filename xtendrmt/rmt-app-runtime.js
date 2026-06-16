(function attachRmtAppRuntime(globalTarget) {
  const RMT_APP_RUNTIME_SCHEMA = 'xtend.rmt.app-runtime.v1';
  const RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA = 'xtend.rmt.app-runtime-diagnostic.v1';
  const RMT_COMMAND_SCHEMA = 'xtend.rmt.command.v1';
  const RMT_HOST_SERVICE_SCHEMA = 'xtend.rmt.host-service.v1';
  const RMT_STREAM_PATCH_SCHEMA = 'xtend.rmt.stream-patch.v1';
  const RMT_VIEW_TEMPLATE_SCHEMA = 'xtend.rmt.view-template.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_runtime';
  const STREAM_PATCH_TYPES = new Set(['start', 'delta', 'tool-call', 'tool-result', 'complete', 'error', 'cancel']);
  const TERMINAL_STREAM_PATCH_TYPES = new Set(['complete', 'error', 'cancel']);
  const UI_WIRING_PATTERNS = Object.freeze([
    { id: 'document.querySelector', pattern: /\bdocument\s*\.\s*querySelector(?:All)?\s*\(/u },
    { id: 'document.getElementById', pattern: /\bdocument\s*\.\s*getElementById\s*\(/u },
    { id: 'addEventListener', pattern: /\.\s*addEventListener\s*\(/u },
    { id: 'createElement', pattern: /\bdocument\s*\.\s*createElement\s*\(/u },
    { id: 'appendChild', pattern: /\.\s*appendChild\s*\(/u },
    { id: 'replaceChildren', pattern: /\.\s*replaceChildren\s*\(/u }
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

  function readPath(source, path) {
    if (!path) return source;
    const parts = String(path).split('.').filter(Boolean);
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      cursor = cursor[part];
    }
    return cursor;
  }

  function writePath(target, path, value) {
    const parts = String(path || '').split('.').filter(Boolean);
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
    const parts = String(path || '').split('.').filter(Boolean);
    if (!parts.length) return target;
    let cursor = target;
    for (const part of parts.slice(0, -1)) {
      if (!cursor || typeof cursor !== 'object') return target;
      cursor = cursor[part];
    }
    if (cursor && typeof cursor === 'object') delete cursor[parts[parts.length - 1]];
    return target;
  }

  function nowIso(clock) {
    if (typeof clock === 'function') {
      const value = clock();
      if (typeof value === 'string') return value;
      if (Number.isFinite(value)) return new Date(value).toISOString();
    }
    return new Date().toISOString();
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

  function randomId(prefix) {
    const cryptoTarget = globalTarget && globalTarget.crypto || null;
    if (cryptoTarget && typeof cryptoTarget.randomUUID === 'function') return `${prefix}:${cryptoTarget.randomUUID()}`;
    return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  }

  function createRmtCommandEnvelope(input = {}, defaults = {}) {
    const source = objectRecord(input.source || defaults.source);
    const payload = Object.prototype.hasOwnProperty.call(input, 'payload') ? input.payload : defaults.payload;
    const command = clampString(input.command || input.action || defaults.command || defaults.action, '');
    if (!command) throw new Error('RMT command envelope requires command.');
    return Object.freeze({
      schema: RMT_COMMAND_SCHEMA,
      id: clampString(input.id, randomId('rmt.command')),
      source: Object.freeze({
        kind: clampString(source.kind, defaults.sourceKind || 'component'),
        id: clampString(source.id || source.component || source.surface, defaults.sourceId || ''),
        event: clampString(source.event, defaults.event || ''),
        surfaceId: clampString(source.surfaceId || source.surface, defaults.surfaceId || '')
      }),
      command,
      payload: cloneValue(payload, {}),
      target: input.target == null ? (defaults.target == null ? null : defaults.target) : input.target,
      correlationId: clampString(input.correlationId || defaults.correlationId, randomId('rmt.correlation')),
      runId: clampString(input.runId || defaults.runId, ''),
      lane: clampString(input.lane || defaults.lane, 'user-blocking'),
      timestamp: input.timestamp || defaults.timestamp || nowIso(defaults.clock)
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
      const subscriptionId = clampString(subscription && subscription.id, randomId(`rmt.subscription.${service.id}`));
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
      const streamId = clampString(streamHandle && streamHandle.id, randomId(`rmt.stream.${service.id}`));
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
    const type = clampString(input.type || input.kind || defaults.type, 'delta');
    if (!STREAM_PATCH_TYPES.has(type)) throw new Error(`Unsupported RMT stream patch type ${type}.`);
    return Object.freeze({
      schema: RMT_STREAM_PATCH_SCHEMA,
      id: clampString(input.id, randomId('rmt.stream.patch')),
      type,
      streamId: clampString(input.streamId || defaults.streamId, ''),
      target: clampString(input.target || defaults.target, ''),
      correlationId: clampString(input.correlationId || defaults.correlationId, ''),
      delta: cloneValue(input.delta, null),
      value: cloneValue(input.value, null),
      toolCall: cloneValue(input.toolCall || input.tool, null),
      toolResult: cloneValue(input.toolResult, null),
      error: cloneValue(input.error, null),
      timestamp: input.timestamp || defaults.timestamp || nowIso(defaults.clock)
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
    const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA ? patchInput : createRmtStreamPatch(patchInput);
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

  function richTextSegmentDescriptor(segment = {}) {
    const record = objectRecord(segment);
    const kind = clampString(record.kind || record.type, 'text');
    if (kind === 'code') {
      return {
        type: 'component',
        tag: 'x-code',
        component: 'x-code',
        attributes: {
          lang: record.lang || record.language || 'text',
          'data-rmt-rich-segment': 'code'
        },
        children: [{ type: 'text', text: record.text || record.code || '' }]
      };
    }
    if (kind === 'citation') {
      return {
        type: 'element',
        tag: 'a',
        class: 'xtend-rmt-citation',
        attributes: {
          href: record.href || record.url || '#',
          rel: 'noreferrer',
          target: '_blank',
          'data-rmt-rich-segment': 'citation'
        },
        text: record.label || record.title || record.text || 'source'
      };
    }
    return {
      type: 'element',
      tag: kind === 'strong' ? 'strong' : kind === 'em' ? 'em' : 'span',
      attributes: { 'data-rmt-rich-segment': kind },
      text: record.text || ''
    };
  }

  function createRmtViewTemplateDescriptor(template = {}, model = {}) {
    const record = objectRecord(template);
    if (record.schema && record.schema !== RMT_VIEW_TEMPLATE_SCHEMA) return cloneValue(record, record);
    if (record.kind === 'choice-menu' || record.type === 'choice-menu') {
      const modelSource = clampString(record.modelSource || record.source, '$model.choiceMenu');
      const statePath = (field) => record[`${field}Source`] || `${modelSource}.${field}`;
      const selectPayloadField = clampString(record.selectPayloadField || record.payloadField, 'value');
      return {
        schema: RMT_VIEW_TEMPLATE_SCHEMA,
        type: 'fragment',
        primitive: 'choice-menu',
        children: [
          {
            type: 'element',
            tag: 'button',
            class: record.buttonClass || record.triggerClass || 'xtend-rmt-choice-menu-button',
            attributes: {
              id: record.buttonId || record.triggerId || 'choice-menu-button',
              type: 'button',
              'aria-haspopup': record.ariaHasPopup || 'menu',
              'aria-expanded': statePath('open'),
              'aria-pressed': { op: 'not-equals', left: statePath('activeToolAttr'), right: '' },
              'data-active-tool': statePath('activeToolAttr'),
              disabled: statePath('disabled')
            },
            command: {
              command: record.toggleCommand || record.command || 'rmt.choiceMenu.toggle',
              payload: record.togglePayload || { label: record.label || 'Choice menu' }
            },
            text: statePath('activeToolLabel')
          },
          {
            type: 'element',
            tag: 'div',
            class: record.optionsClass || record.menuClass || 'xtend-rmt-choice-menu-options',
            attributes: {
              id: record.optionsId || record.menuId || 'choice-menu-options',
              role: record.optionsRole || 'menu',
              hidden: { op: 'not', source: statePath('open') }
            },
            children: [
              {
                type: 'repeat',
                source: record.itemsSource || statePath('items'),
                key: record.itemKey || 'value',
                template: {
                  type: 'element',
                  tag: 'button',
                  class: record.itemClass || 'xtend-rmt-choice-menu-item',
                  attributes: {
                    type: 'button',
                    role: record.itemRole || 'menuitemradio',
                    'data-tool-name': '$item.value',
                    'aria-checked': { op: 'equals', left: statePath('activeTool'), right: '$item.value' }
                  },
                  command: {
                    command: record.selectCommand || 'rmt.choiceMenu.select',
                    payload: { [selectPayloadField]: '$item.value' }
                  },
                  text: '$item.label'
                }
              }
            ]
          }
        ]
      };
    }
    if (record.kind === 'rich-text' || record.type === 'rich-text') {
      return {
        schema: RMT_VIEW_TEMPLATE_SCHEMA,
        type: 'fragment',
        children: toArray(record.segments || readPath(model, record.source || '')).map(richTextSegmentDescriptor)
      };
    }
    if (record.kind === 'repeat' || record.type === 'repeat') {
      return {
        schema: RMT_VIEW_TEMPLATE_SCHEMA,
        type: 'repeat',
        source: record.source || '$model.items',
        key: record.key || 'id',
        template: record.template || record.node || { type: 'text', text: '$item' }
      };
    }
    return {
      schema: RMT_VIEW_TEMPLATE_SCHEMA,
      type: record.type || 'fragment',
      children: toArray(record.children || record.nodes).map((child) => createRmtViewTemplateDescriptor(child, model))
    };
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

  function runWithFabric(fabric, fiberInput, task) {
    if (fabric && typeof fabric.runFiber === 'function') return fabric.runFiber(fiberInput, task);
    return task(fiberInput);
  }

  function createRmtAppRuntime(options = {}) {
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const actionRuntime = options.actionRuntime || null;
    const fabric = options.fabric || null;
    const hostServices = options.hostServices && typeof options.hostServices.invoke === 'function'
      ? options.hostServices
      : createRmtHostServiceRegistry({
          services: options.services || options.hostServiceDefinitions,
          adapters: options.hostServiceAdapters || options.adapters,
          diagnosticsHub: options.diagnosticsHub
        });
    const commandHistory = [];
    const streamHistory = [];
    const streamRecords = new Map();
    const streamLifecycleActions = objectRecord(options.streamLifecycleActions || options.lifecycleActions);
    let appState = cloneValue(options.initialState, {});

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

    async function dispatchCommand(commandInput, metadata = {}) {
      const command = isRmtCommandEnvelope(commandInput)
        ? commandInput
        : createRmtCommandEnvelope(commandInput, metadata);
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
      }, defaults);
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
        id: randomId(`fiber:rmt.service.${serviceId}`),
        kind: 'rmt.service.invoke',
        source: 'rmt-app-runtime',
        phase: 'service',
        lane: context.lane || command && command.lane || 'user-blocking',
        scheduleRef: 'rmt.service.invoke',
        correlationId: context.correlationId || command && command.correlationId,
        metadata: { serviceId }
      }, () => hostServices.invoke(serviceId, payload, context));
    }

    function applyStreamPatch(patchInput, reducerOptions = {}) {
      const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA ? patchInput : createRmtStreamPatch(patchInput, reducerOptions);
      const telemetry = recordStreamPatch(patch, reducerOptions);
      if (!telemetry.accepted) return cloneValue(appState, appState);
      appState = applyRmtStreamPatch(appState, patch, reducerOptions);
      streamHistory.push(patch);
      const signal = fabric && typeof fabric.createBackpressureSignal === 'function' && patch.type === 'delta'
        ? fabric.createBackpressureSignal({
          source: 'rmt-app-runtime',
          reason: 'stream-delta',
          lane: 'visible',
          score: Math.min(streamHistory.length, 12),
          correlationId: patch.correlationId,
          scheduleRef: 'rmt.stream.patch'
        })
        : null;
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
            backpressureSignal: signal
          }
        });
      }
      return cloneValue(appState, appState);
    }

    async function handleStreamPatch(patchInput, reducerOptions = {}) {
      const patch = patchInput && patchInput.schema === RMT_STREAM_PATCH_SCHEMA ? patchInput : createRmtStreamPatch(patchInput, reducerOptions);
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
        id: randomId(`fiber:rmt.service.stream.${serviceId}`),
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

    return Object.freeze({
      schema: RMT_APP_RUNTIME_SCHEMA,
      command,
      refreshSnapshot,
      dispatchCommand,
      invokeService,
      streamService,
      applyStreamPatch,
      handleStreamPatch,
      applyReducer,
      applyRecipe,
      createCommandEnvelope: createRmtCommandEnvelope,
      hostServices,
      getState() {
        return cloneValue(appState, appState);
      },
      setState(value) {
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
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    });
  }

  const api = {
    RMT_APP_RUNTIME_SCHEMA,
    RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA,
    RMT_COMMAND_SCHEMA,
    RMT_HOST_SERVICE_SCHEMA,
    RMT_STREAM_PATCH_SCHEMA,
    RMT_VIEW_TEMPLATE_SCHEMA,
    createRmtCommandEnvelope,
    isRmtCommandEnvelope,
    commandFromComponentEvent,
    createRmtHostServiceRegistry,
    createRmtStreamPatch,
    applyRmtStreamPatch,
    applyRmtReducer,
    applyRmtReducerRecipe,
    createRmtViewTemplateDescriptor,
    createNoManualUiWiringGate,
    createRmtAppRuntime
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtAppRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_APP_RUNTIME_API__ = globalThis.XTendRmtAppRuntime;

export const RMT_APP_RUNTIME_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_APP_RUNTIME_SCHEMA;
export const RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_APP_RUNTIME_DIAGNOSTIC_SCHEMA;
export const RMT_COMMAND_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_COMMAND_SCHEMA;
export const RMT_HOST_SERVICE_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_HOST_SERVICE_SCHEMA;
export const RMT_STREAM_PATCH_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_STREAM_PATCH_SCHEMA;
export const RMT_VIEW_TEMPLATE_SCHEMA = __XTEND_RMT_APP_RUNTIME_API__.RMT_VIEW_TEMPLATE_SCHEMA;
export const createRmtCommandEnvelope = __XTEND_RMT_APP_RUNTIME_API__.createRmtCommandEnvelope;
export const isRmtCommandEnvelope = __XTEND_RMT_APP_RUNTIME_API__.isRmtCommandEnvelope;
export const commandFromComponentEvent = __XTEND_RMT_APP_RUNTIME_API__.commandFromComponentEvent;
export const createRmtHostServiceRegistry = __XTEND_RMT_APP_RUNTIME_API__.createRmtHostServiceRegistry;
export const createRmtStreamPatch = __XTEND_RMT_APP_RUNTIME_API__.createRmtStreamPatch;
export const applyRmtStreamPatch = __XTEND_RMT_APP_RUNTIME_API__.applyRmtStreamPatch;
export const applyRmtReducer = __XTEND_RMT_APP_RUNTIME_API__.applyRmtReducer;
export const applyRmtReducerRecipe = __XTEND_RMT_APP_RUNTIME_API__.applyRmtReducerRecipe;
export const createRmtViewTemplateDescriptor = __XTEND_RMT_APP_RUNTIME_API__.createRmtViewTemplateDescriptor;
export const createNoManualUiWiringGate = __XTEND_RMT_APP_RUNTIME_API__.createNoManualUiWiringGate;
export const createRmtAppRuntime = __XTEND_RMT_APP_RUNTIME_API__.createRmtAppRuntime;

export default __XTEND_RMT_APP_RUNTIME_API__;

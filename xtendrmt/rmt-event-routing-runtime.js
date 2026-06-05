(function attachRmtEventRoutingRuntime(globalTarget) {
  const RMT_EVENT_ROUTING_RUNTIME_SCHEMA = 'xtend.epic18.rmt-event-routing-runtime.v1';
  const RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-event-routing-diagnostic.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.event_routing';

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
    if (typeof File !== 'undefined' && value instanceof File) return value;
    if (typeof Blob !== 'undefined' && value instanceof Blob) return value;
    if (typeof FileList !== 'undefined' && value instanceof FileList) return Array.from(value);
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
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, path)) return source[path];
    const parts = String(path).split('.').filter(Boolean);
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      if (part === 'length' && (Array.isArray(cursor) || typeof cursor === 'string')) return cursor.length;
      cursor = cursor[part];
    }
    return cursor;
  }

  function toDatasetRecord(target) {
    const dataset = target && target.dataset && typeof target.dataset === 'object' ? target.dataset : {};
    const result = {};
    Object.keys(dataset).forEach((key) => {
      result[key] = dataset[key];
    });
    return result;
  }

  function getAttributeValue(target, name) {
    if (!target || !name) return undefined;
    if (typeof target.getAttribute === 'function') return target.getAttribute(name);
    if (target.attributes && Object.prototype.hasOwnProperty.call(target.attributes, name)) return target.attributes[name];
    return undefined;
  }

  function eventPath(event) {
    if (event && typeof event.composedPath === 'function') {
      const path = event.composedPath();
      if (Array.isArray(path)) return path;
    }
    const path = [];
    let cursor = event && event.target || null;
    while (cursor) {
      path.push(cursor);
      cursor = cursor.parentElement || cursor.parentNode || null;
    }
    return path;
  }

  function matchesSelector(target, selector) {
    if (!target || !selector) return false;
    if (typeof target.matches === 'function') return target.matches(selector);
    if (selector.startsWith('[data-') && selector.endsWith(']')) {
      const match = selector.match(/^\[([^=\]]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]$/u);
      if (!match) return false;
      const value = getAttributeValue(target, match[1]);
      const expected = match[2] || match[3] || match[4];
      return typeof expected === 'undefined' ? value != null : String(value) === expected;
    }
    if (selector.startsWith('#')) return target.id === selector.slice(1);
    if (selector.startsWith('.')) return String(target.className || '').split(/\s+/u).includes(selector.slice(1));
    return String(target.tagName || target.localName || '').toLowerCase() === selector.toLowerCase();
  }

  function selectorDataMaracaSurface(selector) {
    const match = String(selector || '').match(/\[data-maraca-surface=(?:"([^"]+)"|'([^']+)'|([^\]]+))\]/u);
    return match ? clampString(match[1] || match[2] || match[3], '') : '';
  }

  function bindingSurfaceId(binding) {
    const candidates = [
      binding && binding.closest,
      binding && binding.target,
      binding && binding.selector,
      binding && binding.surface,
      binding && binding.surfaceId
    ];
    for (const candidate of candidates) {
      const surfaceFromSelector = selectorDataMaracaSurface(candidate);
      if (surfaceFromSelector) return surfaceFromSelector;
      const value = clampString(candidate, '');
      if (!value) continue;
      if (value.startsWith('surface:')) {
        return value.replace(/^surface:[^/]+\//u, '').replace(/^surface:/u, '');
      }
    }
    return '';
  }

  function eventSurfaceId(event) {
    const detail = objectRecord(event && event.detail);
    return clampString(
      detail.surfaceId || detail.surface || readPath(detail, 'payload.surfaceId') || readPath(detail, 'payload.surface'),
      ''
    );
  }

  function eventMatchesBindingSurface(binding, event) {
    const expectedSurfaceId = bindingSurfaceId(binding);
    const actualSurfaceId = eventSurfaceId(event);
    return Boolean(expectedSurfaceId && actualSurfaceId && expectedSurfaceId === actualSurfaceId);
  }

  function closestTarget(event, selector, fallback) {
    if (!selector) return fallback;
    const start = event && event.target || fallback;
    if (start && typeof start.closest === 'function') {
      const nativeClosest = start.closest;
      const closest = nativeClosest.call(start, selector);
      if (closest) return closest;
    }
    return eventPath(event).find((entry) => matchesSelector(entry, selector)) || fallback;
  }

  function fileSummary(file) {
    return {
      name: clampString(file && file.name, ''),
      size: Number.isFinite(file && file.size) ? file.size : 0,
      type: clampString(file && file.type, ''),
      lastModified: Number.isFinite(file && file.lastModified) ? file.lastModified : null
    };
  }

  function fileListToArray(files) {
    if (!files) return [];
    try {
      return Array.from(files).map(fileSummary);
    } catch (_) {
      const result = [];
      for (let index = 0; index < (files.length || 0); index += 1) {
        result.push(fileSummary(files[index]));
      }
      return result;
    }
  }

  function resolveEventSource(binding, event) {
    if (binding && binding.closest) {
      const closest = closestTarget(event, binding.closest, null);
      if (closest) return closest;
      if (eventMatchesBindingSurface(binding, event)) {
        return event && event.target || event && event.currentTarget || null;
      }
      return null;
    }
    const governance = objectRecord(binding.governance);
    if (governance.retarget === 'current-target') return event && event.currentTarget || null;
    if (governance.retarget === 'composed-path' && event && typeof event.composedPath === 'function') {
      const path = event.composedPath();
      return Array.isArray(path) && path.length ? path[0] : event.target || null;
    }
    return event && event.target || null;
  }

  function resolveValue(value, context = {}) {
    if (Array.isArray(value)) return value.map((entry) => resolveValue(entry, context));
    if (value && typeof value === 'object') {
      const result = {};
      Object.entries(value).forEach(([key, entry]) => {
        result[key] = resolveValue(entry, context);
      });
      return result;
    }
    if (typeof value !== 'string') return value;
    if (value === '$event') return context.event;
    if (value.startsWith('$event.')) return readPath(context.event, value.slice(7));
    if (value === '$target') return context.target;
    if (value.startsWith('$target.')) return readPath(context.target, value.slice(8));
    if (value === '$currentTarget') return context.currentTarget;
    if (value.startsWith('$currentTarget.')) return readPath(context.currentTarget, value.slice(15));
    if (value === '$source') return context.source;
    if (value.startsWith('$source.')) return readPath(context.source, value.slice(8));
    if (value === '$detail') return context.event && context.event.detail;
    if (value.startsWith('$detail.')) return readPath(context.event && context.event.detail, value.slice(8));
    if (value === '$metadata') return context.metadata;
    if (value.startsWith('$metadata.')) return readPath(context.metadata, value.slice(10));
    if (value === '$binding') return context.binding;
    if (value.startsWith('$binding.')) return readPath(context.binding, value.slice(9));
    return value;
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
          diagnosticsHub.publish(channel, diagnostic, {
            schema: RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA
          });
        }
        return diagnostic;
      }
    };
  }

  function createDiagnostic(code, message, details = {}, severity = 'info') {
    return {
      schema: RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA,
      code,
      message,
      severity,
      details: cloneValue(details, {})
    };
  }

  function normalizeBindings(input) {
    return toArray(input).map((binding) => {
      const source = objectRecord(binding);
      const eventName = clampString(source.event || source.eventName || source.type, '');
      return {
        ...source,
        id: clampString(source.id),
        kind: clampString(source.kind, 'dom'),
        event: eventName,
        target: source.target || source.selector || source.ref || '',
        component: clampString(source.component || source.componentId, ''),
        action: clampString(source.action || source.actionId, ''),
        actionMode: clampString(source.actionMode || source.operation || source.mode, 'run-action'),
        owner: clampString(source.owner || source.ownerId || source.scope, source.id),
        payload: Object.prototype.hasOwnProperty.call(source, 'payload') ? source.payload : '$detail',
        payloadContract: source.payloadContract || source.contract || null,
        governance: {
          capture: Boolean(source.capture || source.governance && source.governance.capture),
          passive: Boolean(source.passive || source.governance && source.governance.passive),
          once: Boolean(source.once || source.governance && source.governance.once),
          preventDefault: Boolean(source.preventDefault || source.governance && source.governance.preventDefault),
          stopPropagation: Boolean(source.stopPropagation || source.governance && source.governance.stopPropagation),
          stopImmediatePropagation: Boolean(source.stopImmediatePropagation || source.governance && source.governance.stopImmediatePropagation),
          retarget: clampString(source.retarget || source.governance && source.governance.retarget, 'target')
        },
        payloadAdapter: source.payloadAdapter || source.adapter || source.payloadKind || null,
        closest: source.closest || source.closestSelector || source.delegate || null,
        guard: source.guard || source.confirm || null,
        postAction: toArray(source.postAction || source.after || source.afterAction),
        condition: source.condition || source.when || null,
        enabled: source.enabled !== false
      };
    }).filter((binding) => binding.id);
  }

  function typeOfValue(value) {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
  }

  function validateShape(value, shape, path = '$payload') {
    const contract = objectRecord(shape);
    const expectedType = clampString(contract.type, '');
    const errors = [];
    if (!expectedType) return errors;
    const actualType = typeOfValue(value);
    if (expectedType === 'array') {
      if (!Array.isArray(value)) errors.push(`${path} expected array but got ${actualType}`);
      return errors;
    }
    if (expectedType === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`${path} expected object but got ${actualType}`);
        return errors;
      }
      toArray(contract.required).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${path}.${key} is required`);
      });
      Object.entries(objectRecord(contract.properties)).forEach(([key, propertyShape]) => {
        if (!Object.prototype.hasOwnProperty.call(value, key)) return;
        const normalizedShape = typeof propertyShape === 'string' ? { type: propertyShape } : objectRecord(propertyShape);
        errors.push(...validateShape(value[key], normalizedShape, `${path}.${key}`));
      });
      return errors;
    }
    if (expectedType === 'nullable') return errors;
    if (actualType !== expectedType) errors.push(`${path} expected ${expectedType} but got ${actualType}`);
    return errors;
  }

  function evaluateCondition(condition, context) {
    if (!condition) return true;
    const source = objectRecord(condition);
    const left = resolveValue(source.left, context);
    const right = resolveValue(source.right, context);
    const op = clampString(source.op || source.operator, source.equals !== undefined ? 'equals' : 'truthy');
    if (op === 'equals') return left === (source.equals !== undefined ? resolveValue(source.equals, context) : right);
    if (op === 'not-equals') return left !== right;
    if (op === 'truthy') return Boolean(source.value !== undefined ? resolveValue(source.value, context) : left);
    if (op === 'falsy') return !Boolean(source.value !== undefined ? resolveValue(source.value, context) : left);
    if (op === 'includes') return Array.isArray(left) ? left.includes(right) : String(left || '').includes(String(right || ''));
    return true;
  }

  function applyGovernance(binding, event) {
    const governance = objectRecord(binding.governance);
    if (governance.preventDefault && event && event.cancelable !== false && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (governance.stopPropagation && event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    if (governance.stopImmediatePropagation && event && typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
    return {
      preventDefault: Boolean(governance.preventDefault),
      stopPropagation: Boolean(governance.stopPropagation),
      stopImmediatePropagation: Boolean(governance.stopImmediatePropagation),
      retarget: governance.retarget || 'target'
    };
  }

  function createPayload(binding, event, metadata = {}) {
    const context = {
      binding,
      event,
      metadata,
      target: event && event.target || null,
      currentTarget: event && event.currentTarget || null,
      source: resolveEventSource(binding, event)
    };
    const adapterPayload = createAdapterPayload(binding, event, context);
    const explicitPayload = binding.payload === '$detail' && adapterPayload !== null
      ? null
      : resolveValue(binding.payload, context);
    const payload = adapterPayload && explicitPayload && typeof adapterPayload === 'object' && typeof explicitPayload === 'object' && !Array.isArray(adapterPayload) && !Array.isArray(explicitPayload)
      ? { ...adapterPayload, ...explicitPayload }
      : (adapterPayload !== null ? adapterPayload : explicitPayload);
    return cloneValue(payload, payload);
  }

  function normalizePayloadAdapter(binding) {
    const adapter = binding.payloadAdapter;
    if (!adapter) return null;
    return typeof adapter === 'string' ? { kind: adapter } : objectRecord(adapter);
  }

  function createAdapterPayload(binding, event, context) {
    const adapter = normalizePayloadAdapter(binding);
    if (!adapter) return null;
    const kind = clampString(adapter.kind || adapter.type, '');
    const delegated = closestTarget(event, adapter.closest || binding.closest, context.source || context.target);
    const target = delegated || context.source || context.target || {};
    if (kind === 'dataset') {
      return {
        dataset: toDatasetRecord(target),
        action: getAttributeValue(target, 'data-action') || undefined,
        id: getAttributeValue(target, 'data-id') || getAttributeValue(target, 'data-record-id') || undefined
      };
    }
    if (kind === 'input' || kind === 'change') {
      return {
        name: target.name || getAttributeValue(target, 'name') || '',
        value: typeof target.value === 'undefined' ? getAttributeValue(target, 'value') : target.value,
        checked: typeof target.checked === 'boolean' ? target.checked : undefined,
        dataset: toDatasetRecord(target)
      };
    }
    if (kind === 'file-input') {
      const files = fileListToArray(target.files);
      return {
        name: target.name || getAttributeValue(target, 'name') || '',
        files,
        fileCount: files.length,
        dataset: toDatasetRecord(target)
      };
    }
    if (kind === 'drop-files' || kind === 'drag-drop') {
      const dataTransfer = event && event.dataTransfer || {};
      const files = fileListToArray(dataTransfer.files);
      return {
        files,
        fileCount: files.length,
        types: Array.isArray(dataTransfer.types) ? dataTransfer.types.slice() : fileListToArray(dataTransfer.items).map((entry) => entry.type).filter(Boolean),
        dataset: toDatasetRecord(target)
      };
    }
    if (kind === 'surface-event') {
      return {
        surfaceId: getAttributeValue(target, 'surface-id') || getAttributeValue(target, 'data-rmt-surface') || readPath(event && event.detail, 'surfaceId') || '',
        detail: cloneValue(event && event.detail, {}),
        dataset: toDatasetRecord(target)
      };
    }
    if (kind === 'beforeunload') {
      return {
        returnValue: event && event.returnValue,
        detail: cloneValue(event && event.detail, {})
      };
    }
    return null;
  }

  function shouldConfirm(binding, payload, event, metadata, options = {}) {
    const guard = binding.guard;
    if (!guard) return true;
    const record = guard === true ? { kind: 'confirm' } : (typeof guard === 'string' ? { kind: guard } : objectRecord(guard));
    const kind = clampString(record.kind || record.type, '');
    if (kind !== 'confirm') return true;
    const adapter = options.confirmAdapter || null;
    const message = resolveValue(record.message || binding.confirmMessage || 'Confirm action?', { binding, event, payload, metadata });
    if (adapter && typeof adapter.confirm === 'function') return adapter.confirm(message, { binding, payload, event, metadata }) !== false;
    if (typeof globalTarget !== 'undefined' && globalTarget && typeof globalTarget.confirm === 'function') return globalTarget.confirm(message);
    return record.default !== false;
  }

  function applyPostAction(binding, event, routeResult, metadata, options = {}) {
    const operations = [];
    binding.postAction.forEach((entry) => {
      const action = typeof entry === 'string' ? { kind: entry } : objectRecord(entry);
      const kind = clampString(action.kind || action.type, '');
      if (kind !== 'reset-file-input' && kind !== 'reset-input') return;
      const target = action.target
        ? defaultResolveTarget({ ...binding, target: action.target }, options.root || null, options)
        : closestTarget(event, action.closest || binding.closest, event && event.target || null);
      if (target && Object.prototype.hasOwnProperty.call(target, 'value')) {
        target.value = '';
        operations.push({ kind, target: action.target || binding.target || '', reset: true });
      }
    });
    return operations;
  }

  function surfaceDelegationTarget(binding, root) {
    if (!bindingSurfaceId(binding)) return null;
    return root && root.ownerDocument && typeof root.ownerDocument.addEventListener === 'function'
      ? root.ownerDocument
      : null;
  }

  function isSurfaceCommandEvent(binding) {
    return Boolean(bindingSurfaceId(binding) && /^surface-[a-z-]+-command$/u.test(clampString(binding && binding.event, '')));
  }

  function isSurfaceDelegatedEvent(binding) {
    return Boolean(bindingSurfaceId(binding) && binding && binding.closest);
  }

  function defaultResolveTarget(binding, root, options = {}) {
    const target = binding.target;
    if (target && typeof target === 'object' && typeof target.addEventListener === 'function') return target;
    const targets = objectRecord(options.targets);
    if (typeof target === 'string' && targets[target]) return targets[target];
    if (binding.closest && root && typeof root.addEventListener === 'function') {
      return surfaceDelegationTarget(binding, root) || root;
    }
    if (typeof options.targetResolver === 'function') {
      const resolved = options.targetResolver(binding, root);
      if (resolved) return resolved;
    }
    if (root && typeof root.querySelector === 'function' && typeof target === 'string' && target) {
      const byRef = root.querySelector(`[data-rmt-ref="${target}"]`);
      if (byRef) return byRef;
      return root.querySelector(target);
    }
    return null;
  }

  function listenerOptions(binding) {
    const governance = objectRecord(binding.governance);
    return {
      capture: Boolean(governance.capture || isSurfaceCommandEvent(binding) || isSurfaceDelegatedEvent(binding)),
      passive: Boolean(governance.passive),
      once: Boolean(governance.once)
    };
  }

  function createRouteResult(binding, status, payload, details = {}) {
    return {
      schema: 'xtend.epic18.rmt-event-route-result.v1',
      bindingId: binding.id,
      event: binding.event,
      component: binding.component,
      action: binding.action,
      status,
      payload: cloneValue(payload, payload),
      ...cloneValue(details, {})
    };
  }

  function createRmtEventRoutingRuntime(options = {}) {
    const bindings = normalizeBindings(options.bindings || options.events || options.eventBindings);
    const bindingIndex = new Map(bindings.map((binding) => [binding.id, binding]));
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const actionRuntime = options.actionRuntime || null;
    const rootTarget = options.root || null;
    const routeHistory = [];
    const listenerRecords = [];

    async function routeEvent(bindingId, event = {}, metadata = {}) {
      const binding = bindingIndex.get(clampString(bindingId));
      if (!binding) throw new Error(`RMT Event Binding ${bindingId} ist nicht definiert.`);
      const eventContext = {
        binding,
        event,
        metadata,
        target: event && event.target || null,
        currentTarget: event && event.currentTarget || null,
        source: resolveEventSource(binding, event)
      };
      if (!binding.enabled) {
        const skipped = createRouteResult(binding, 'skipped', null, { reason: 'disabled' });
        routeHistory.push(skipped);
        return skipped;
      }
      if (binding.closest && !eventContext.source) {
        if (eventMatchesBindingSurface(binding, event)) {
          eventContext.source = event && event.target || event && event.currentTarget || rootTarget;
        }
      }
      if (binding.closest && !eventContext.source) {
        const skipped = createRouteResult(binding, 'skipped', null, { reason: 'delegated-target' });
        routeHistory.push(skipped);
        return skipped;
      }
      if (!evaluateCondition(binding.condition, eventContext)) {
        const skipped = createRouteResult(binding, 'skipped', null, { reason: 'condition' });
        diagnosticsRecorder.publish(createDiagnostic('rmt.event.condition.skipped', `RMT Event ${binding.id} wurde durch eine Bedingung uebersprungen.`, {
          bindingId: binding.id,
          event: binding.event,
          component: binding.component,
          action: binding.action
        }, 'info'));
        routeHistory.push(skipped);
        return skipped;
      }

      const governanceResult = applyGovernance(binding, event);
      const payload = createPayload(binding, event, metadata);
      if (!shouldConfirm(binding, payload, event, metadata, options)) {
        const blocked = createRouteResult(binding, 'blocked', payload, {
          reason: 'confirm-declined',
          governance: governanceResult
        });
        diagnosticsRecorder.publish(createDiagnostic('rmt.event.guard.confirm_declined', `RMT Event ${binding.id} wurde durch Confirm Guard blockiert.`, {
          bindingId: binding.id,
          event: binding.event,
          component: binding.component,
          action: binding.action
        }, 'warning'));
        routeHistory.push(blocked);
        return blocked;
      }
      const contractErrors = validateShape(payload, binding.payloadContract);
      if (contractErrors.length > 0) {
        const blocked = createRouteResult(binding, 'blocked', payload, {
          contractErrors,
          governance: governanceResult
        });
        diagnosticsRecorder.publish(createDiagnostic('rmt.event.payload_contract.invalid', `RMT Event ${binding.id} verletzt den Payload Contract.`, {
          bindingId: binding.id,
          event: binding.event,
          component: binding.component,
          action: binding.action,
          payload,
          contractErrors
        }, 'error'));
        routeHistory.push(blocked);
        return blocked;
      }

      if (!actionRuntime) {
        const blocked = createRouteResult(binding, 'blocked', payload, {
          reason: 'missing-action-runtime',
          governance: governanceResult
        });
        diagnosticsRecorder.publish(createDiagnostic('rmt.event.action_runtime.missing', `RMT Event ${binding.id} hat keine Action Runtime.`, {
          bindingId: binding.id,
          event: binding.event,
          component: binding.component,
          action: binding.action
        }, 'error'));
        routeHistory.push(blocked);
        return blocked;
      }

      let actionResult = null;
      if (binding.actionMode === 'cancel-action') {
        if (typeof actionRuntime.cancelAction !== 'function') throw new Error('RMT Action Runtime unterstuetzt cancelAction nicht.');
        actionResult = actionRuntime.cancelAction(binding.action);
      } else {
        if (typeof actionRuntime.runAction !== 'function') throw new Error('RMT Action Runtime unterstuetzt runAction nicht.');
        actionResult = await actionRuntime.runAction(binding.action, payload, {
          eventId: binding.id,
          eventName: binding.event,
          component: binding.component,
          ownerId: binding.owner,
          ...objectRecord(metadata)
        });
      }

      const status = actionResult && actionResult.status || (binding.actionMode === 'cancel-action' ? 'cancelled' : 'success');
      const postAction = applyPostAction(binding, event, null, metadata, options);
      const result = createRouteResult(binding, status, payload, {
        actionResult: cloneValue(actionResult, actionResult),
        governance: governanceResult,
        postAction
      });
      diagnosticsRecorder.publish(createDiagnostic('rmt.event.route.success', `RMT Event ${binding.id} wurde an Action ${binding.action} geroutet.`, {
        bindingId: binding.id,
        event: binding.event,
        component: binding.component,
        action: binding.action,
        actionStatus: status,
        payload,
        payloadContract: Boolean(binding.payloadContract)
      }, 'info'));
      routeHistory.push(result);
      return result;
    }

    function attach(root = rootTarget) {
      const attached = [];
      bindings.forEach((binding) => {
        if (!binding.enabled || !binding.event) return;
        const target = defaultResolveTarget(binding, root, options);
        if (!target || typeof target.addEventListener !== 'function') {
          diagnosticsRecorder.publish(createDiagnostic('rmt.event.target.missing', `RMT Event ${binding.id} hat kein bindbares Ziel.`, {
            bindingId: binding.id,
            target: binding.target,
            event: binding.event,
            component: binding.component
          }, 'error'));
          return;
        }
        const listener = (event) => routeEvent(binding.id, event, { source: 'listener' });
        const optionsForListener = listenerOptions(binding);
        target.addEventListener(binding.event, listener, optionsForListener);
        const record = {
          bindingId: binding.id,
          owner: binding.owner,
          event: binding.event,
          target,
          listener,
          options: optionsForListener
        };
        listenerRecords.push(record);
        attached.push({
          bindingId: binding.id,
          owner: binding.owner,
          event: binding.event,
          component: binding.component
        });
      });
      return {
        schema: 'xtend.epic18.rmt-event-attach-report.v1',
        attachedCount: attached.length,
        attached
      };
    }

    function detachOwner(ownerId = '') {
      const owner = clampString(ownerId);
      let detached = 0;
      for (let index = listenerRecords.length - 1; index >= 0; index -= 1) {
        const record = listenerRecords[index];
        if (owner && record.owner !== owner) continue;
        if (record.target && typeof record.target.removeEventListener === 'function') {
          record.target.removeEventListener(record.event, record.listener, record.options);
        }
        listenerRecords.splice(index, 1);
        detached += 1;
      }
      return {
        schema: 'xtend.epic18.rmt-event-detach-report.v1',
        owner: owner || 'all',
        detachedCount: detached
      };
    }

    return Object.freeze({
      schema: RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
      attach,
      detachOwner,
      detachAll() {
        return detachOwner('');
      },
      routeEvent,
      createPayload,
      listBindings() {
        return bindings.map((binding) => cloneValue(binding, binding));
      },
      listAttached() {
        return listenerRecords.map((record) => ({
          bindingId: record.bindingId,
          owner: record.owner,
          event: record.event
        }));
      },
      listRoutes() {
        return routeHistory.map((entry) => cloneValue(entry, entry));
      },
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    });
  }

  const api = {
    RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA,
    RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
    createRmtEventRoutingRuntime
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtEventRoutingRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__ = globalThis.XTendRmtEventRoutingRuntime;

export const RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA = __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__.RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA;
export const RMT_EVENT_ROUTING_RUNTIME_SCHEMA = __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__.RMT_EVENT_ROUTING_RUNTIME_SCHEMA;
export const createRmtEventRoutingRuntime = __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__.createRmtEventRoutingRuntime;

export default __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__;

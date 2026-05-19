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

  function resolveEventSource(binding, event) {
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
    const payload = resolveValue(binding.payload, context);
    return cloneValue(payload, payload);
  }

  function defaultResolveTarget(binding, root, options = {}) {
    const target = binding.target;
    if (target && typeof target === 'object' && typeof target.addEventListener === 'function') return target;
    const targets = objectRecord(options.targets);
    if (typeof target === 'string' && targets[target]) return targets[target];
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
      capture: Boolean(governance.capture),
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
      const result = createRouteResult(binding, status, payload, {
        actionResult: cloneValue(actionResult, actionResult),
        governance: governanceResult
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

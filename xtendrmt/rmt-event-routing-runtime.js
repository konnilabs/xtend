function createRmtEventRoutingRuntimeModule() {
  const RMT_EVENT_ROUTING_RUNTIME_SCHEMA = 'xtend.epic18.rmt-event-routing-runtime.v2';
  const RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-event-routing-diagnostic.v1';
  const RMT_COMMAND_SCHEMA = 'xtend.rmt.command.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.event_routing';
  const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

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
      const result = Object.create(null);
      Object.entries(value).forEach(([key, entry]) => {
        assertSafePathSegments(key);
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

  function normalizePathSegments(path) {
    return String(path || '')
      .replace(/\[([0-9]+)\]/gu, '.$1')
      .split('.')
      .filter(Boolean);
  }

  function assertSafePathSegments(path) {
    const parts = normalizePathSegments(path);
    const unsafeSegment = parts.find((part) => UNSAFE_PATH_SEGMENTS.has(String(part).toLowerCase()));
    if (unsafeSegment) {
      const diagnostic = createDiagnostic(
        'rmt.event.path.unsafe',
        `Unsicheres Event-Pfadsegment ${unsafeSegment}.`,
        { path: String(path || ''), segment: unsafeSegment },
        'error'
      );
      const error = new Error(diagnostic.message);
      error.code = diagnostic.code;
      error.diagnostic = diagnostic;
      throw error;
    }
    return parts;
  }

  function readPath(source, path) {
    if (!path) return source;
    const parts = assertSafePathSegments(path);
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, path)) return source[path];
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
    const result = Object.create(null);
    Object.keys(dataset).forEach((key) => {
      assertSafePathSegments(key);
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
      const result = Object.create(null);
      Object.entries(value).forEach(([key, entry]) => {
        assertSafePathSegments(key);
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

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId(prefix) {
    return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  }

  function isRmtCommandEnvelope(value) {
    return !!value && typeof value === 'object' && value.schema === RMT_COMMAND_SCHEMA && !!value.command;
  }

  function createCommandEnvelope(binding, payload, event = {}, metadata = {}) {
    const detail = objectRecord(event && event.detail);
    const nestedCommand = isRmtCommandEnvelope(detail.command) ? detail.command : null;
    const commandDetail = isRmtCommandEnvelope(detail) ? detail : nestedCommand;
    return {
      schema: RMT_COMMAND_SCHEMA,
      id: clampString(metadata.commandId || commandDetail && commandDetail.id, randomId('rmt.command')),
      source: {
        kind: clampString(readPath(commandDetail, 'source.kind'), 'component'),
        id: clampString(binding.component || readPath(commandDetail, 'source.id') || readPath(detail, 'source.id') || detail.componentId || event && event.target && event.target.id, ''),
        event: clampString(binding.event || readPath(commandDetail, 'source.event') || event && event.type, ''),
        surfaceId: clampString(binding.surfaceId || readPath(commandDetail, 'source.surfaceId') || readPath(detail, 'source.surfaceId') || detail.surfaceId || eventSurfaceId(event), '')
      },
      command: clampString(binding.action || binding.command || commandDetail && commandDetail.command || detail.command || detail.action, ''),
      payload: cloneValue(payload, {}),
      target: binding.commandTarget || commandDetail && commandDetail.target || null,
      correlationId: clampString(metadata.correlationId || commandDetail && commandDetail.correlationId || detail.correlationId, randomId('rmt.correlation')),
      runId: clampString(metadata.runId || commandDetail && commandDetail.runId, ''),
      lane: clampString(metadata.lane || binding.lane || commandDetail && commandDetail.lane || detail.lane, 'user-blocking'),
      timestamp: metadata.timestamp || commandDetail && commandDetail.timestamp || nowIso()
    };
  }

  function normalizeBindings(input) {
    return toArray(input).map((binding) => {
      const source = objectRecord(binding);
      Object.keys(source).forEach((key) => assertSafePathSegments(key));
      const eventName = clampString(source.event || source.eventName || source.type, '');
      return {
        ...source,
        id: clampString(source.id || source.bindingId),
        kind: clampString(source.kind, 'dom'),
        event: eventName,
        target: source.target || source.selector || source.ref || '',
        component: clampString(source.component || source.componentId, ''),
        action: clampString(source.action || source.actionId || source.command || source.commandName, ''),
        actionMode: clampString(source.actionMode || source.operation || source.mode, 'run-action'),
        owner: clampString(source.owner || source.ownerId || source.scope, source.id),
        payload: Object.prototype.hasOwnProperty.call(source, 'payload') ? source.payload : '$detail',
        payloadContract: source.payloadContract || source.contract || null,
        governance: {
          capture: Boolean(source.capture || source.options && source.options.capture || source.governance && source.governance.capture),
          passive: Boolean(source.passive || source.options && source.options.passive || source.governance && source.governance.passive),
          once: Boolean(source.once || source.options && source.options.once || source.governance && source.governance.once),
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
        enabled: source.enabled !== false,
        commandTarget: Object.prototype.hasOwnProperty.call(source, 'commandTarget') ? source.commandTarget : null,
        lane: source.lane || null,
        bindingSource: source.bindingSource || 'compiled',
        bindingScope: clampString(source.bindingScope || source.scopeId || source.scope, '')
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
    const hostTarget = options.hostTarget || options.windowTarget || null;
    if (hostTarget && typeof hostTarget.confirm === 'function') return hostTarget.confirm(message);
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
        const domRenderer = resolveEventDomRenderer(target, options);
        const commitResult = domRenderer.commit({
          operation: 'merge-element',
          target,
          descriptor: {
            type: 'element',
            tag: clampString(target.localName || target.tagName, 'input').toLowerCase(),
            properties: { value: '' }
          },
          metadata: {
            adapter: 'event-router',
            bindingId: binding.id,
            postAction: kind
          }
        });
        operations.push({
          kind,
          target: action.target || binding.target || '',
          reset: true,
          commit: commitResult && {
            schema: commitResult.schema,
            operation: commitResult.operation,
            changed: Boolean(commitResult.changed)
          }
        });
      }
    });
    return operations;
  }

  function domRendererError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.diagnostic = createDiagnostic(code, message, { adapter: 'event-router' });
    return error;
  }

  function resolveEventDomRenderer(target, options = {}) {
    const injected = options.domRenderer || options.renderer;
    if (injected && typeof injected.commit === 'function') return injected;
    if (options.strict || options.strictMaraca) {
      throw domRendererError(
        'rmt.dom.shared-renderer-missing',
        'Event Router Post-Actions benoetigen den gemeinsam injizierten DOM Descriptor Renderer.'
      );
    }
    const hostTarget = options.hostTarget || options.windowTarget || null;
    const documentTarget = options.documentTarget
      || (target && target.ownerDocument)
      || (options.root && options.root.ownerDocument)
      || (hostTarget && hostTarget.document);
    const factory = options.createDomRenderer
      || (hostTarget
        && hostTarget.XTendRmtDomDescriptorRenderer
        && hostTarget.XTendRmtDomDescriptorRenderer.createRmtDomDescriptorRenderer);
    if (!documentTarget || typeof documentTarget !== 'object' || typeof factory !== 'function') {
      throw domRendererError(
        'rmt.dom.compatibility-renderer-unavailable',
        'Event Router kann ohne DOM Descriptor Renderer keine Post-Action sicher ausfuehren.'
      );
    }
    const record = options.compatibilityRendererRecord || {
      diagnosed: false,
      documentTarget: null,
      renderer: null
    };
    if (record.renderer && record.documentTarget !== documentTarget) {
      if (typeof record.renderer.dispose === 'function') record.renderer.dispose();
      record.renderer = null;
      record.diagnosed = false;
    }
    if (!record.renderer) {
      record.documentTarget = documentTarget;
      record.renderer = factory({
        documentTarget,
        diagnosticsHub: options.diagnosticsHub
      });
    }
    if (!record.renderer || typeof record.renderer.commit !== 'function') {
      throw domRendererError(
        'rmt.dom.compatibility-renderer-unavailable',
        'Event Router kann ohne DOM Descriptor Renderer keine Post-Action sicher ausfuehren.'
      );
    }
    if (!record.diagnosed) {
      record.diagnosed = true;
      const diagnostic = createDiagnostic(
        'rmt.dom.shared-renderer-missing',
        'Event Router hat einmalig einen Compatibility-DOM-Renderer erzeugt.',
        { adapter: 'event-router' },
        'warning'
      );
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(diagnostic);
    }
    return record.renderer;
  }

  function surfaceDelegationTarget(binding, root) {
    if (!bindingSurfaceId(binding) || !root || typeof root.querySelector !== 'function') return null;
    const selector = clampString(binding && (binding.closest || binding.target || binding.selector), '');
    return selector ? root.querySelector(selector) : null;
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

  function isWithinTarget(node, target) {
    if (!node || !target) return false;
    if (node === target) return true;
    if (typeof target.contains === 'function' && target.contains(node)) return true;
    let cursor = node.parentNode || null;
    while (cursor) {
      if (cursor === target) return true;
      cursor = cursor.parentNode || null;
    }
    return false;
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
    const compiledBindings = normalizeBindings(options.bindings || options.events || options.eventBindings)
      .map((binding) => ({ ...binding, bindingSource: 'compiled' }));
    compiledBindings.forEach((binding) => {
      [
        binding.payload,
        binding.payloadContract,
        binding.condition,
        binding.guard,
        binding.postAction
      ].forEach((value) => {
        if (typeof value !== 'undefined' && value !== null) resolveValue(value, { binding });
      });
    });
    const compiledBindingIndex = new Map(compiledBindings.map((binding) => [binding.id, binding]));
    const dynamicBindingIndex = new Map();
    const bindingIndex = new Map(compiledBindingIndex);
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const actionRuntime = options.actionRuntime || null;
    const rootTarget = options.root || null;
    const routeHistory = [];
    const listenerRecords = [];
    const compatibilityRendererRecord = {
      diagnosed: false,
      documentTarget: null,
      renderer: null
    };
    let disposed = false;
    let legacyRunActionDiagnosed = false;

    function publishLegacyRunActionDiagnostic(binding) {
      if (legacyRunActionDiagnosed) return;
      legacyRunActionDiagnosed = true;
      diagnosticsRecorder.publish(createDiagnostic(
        'rmt.event.run-action.legacy-compatibility',
        'runAction ist ein veralteter Event-Router-Fallback; injiziere dispatchCommand.',
        {
          bindingId: binding.id,
          event: binding.event,
          action: binding.action
        },
        'warning'
      ));
    }

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
      const detail = objectRecord(event && event.detail);
      const commandFromEvent = isRmtCommandEnvelope(detail) ? detail : (isRmtCommandEnvelope(detail.command) ? detail.command : null);
      const payload = commandFromEvent && binding.payload === '$detail'
        ? cloneValue(commandFromEvent.payload, {})
        : createPayload(binding, event, metadata);
      const commandEnvelope = createCommandEnvelope(binding, payload, event, metadata);
      if (binding.event === 'click') {
        diagnosticsRecorder.publish(createDiagnostic('rmt.event.legacy_dom_event', `RMT Event ${binding.id} uses legacy DOM event click; prefer xtend-command.`, {
          bindingId: binding.id,
          event: binding.event,
          action: binding.action,
          commandSchema: RMT_COMMAND_SCHEMA
        }, 'warning'));
      }
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

      const commandRuntime = options.commandBus || options.commandRuntime || actionRuntime;
      if (!commandRuntime) {
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
        if (typeof commandRuntime.cancelAction !== 'function') throw new Error('RMT Action Runtime unterstuetzt cancelAction nicht.');
        actionResult = commandRuntime.cancelAction(binding.action);
      } else if (typeof commandRuntime.dispatchCommand === 'function') {
        actionResult = await commandRuntime.dispatchCommand(commandEnvelope, {
          eventId: binding.id,
          eventName: binding.event,
          component: binding.component,
          ownerId: binding.owner,
          ...objectRecord(metadata)
        });
      } else {
        if (typeof commandRuntime.runAction !== 'function') throw new Error('RMT Command Runtime unterstuetzt dispatchCommand nicht.');
        publishLegacyRunActionDiagnostic(binding);
        actionResult = await commandRuntime.runAction(binding.action, payload, {
          eventId: binding.id,
          eventName: binding.event,
          component: binding.component,
          ownerId: binding.owner,
          commandEnvelope,
          correlationId: commandEnvelope.correlationId,
          lane: commandEnvelope.lane,
          ...objectRecord(metadata)
        });
      }

      const status = actionResult && actionResult.status || (binding.actionMode === 'cancel-action' ? 'cancelled' : 'success');
      const postAction = applyPostAction(binding, event, null, metadata, {
        ...options,
        compatibilityRendererRecord,
        publishDiagnostic: diagnosticsRecorder.publish
      });
      const result = createRouteResult(binding, status, payload, {
        actionResult: cloneValue(actionResult, actionResult),
        commandEnvelope: cloneValue(commandEnvelope, commandEnvelope),
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

    function bindingSummary(binding) {
      return {
        bindingId: binding.id,
        owner: binding.owner,
        event: binding.event,
        component: binding.component
      };
    }

    function listenerOptionsEqual(left, right) {
      return Boolean(left && left.capture) === Boolean(right && right.capture)
        && Boolean(left && left.passive) === Boolean(right && right.passive)
        && Boolean(left && left.once) === Boolean(right && right.once);
    }

    function detachRecord(record) {
      const index = listenerRecords.indexOf(record);
      if (index === -1) return false;
      if (record.target && typeof record.target.removeEventListener === 'function') {
        record.target.removeEventListener(record.event, record.listener, record.options);
      }
      listenerRecords.splice(index, 1);
      return true;
    }

    function summarizeCommitResult(commitResult) {
      if (!commitResult || typeof commitResult !== 'object') return null;
      return {
        schema: clampString(commitResult.schema, ''),
        operation: clampString(commitResult.operation, ''),
        changed: Boolean(commitResult.changed),
        structural: Boolean(commitResult.structural),
        nodeCount: Number.isFinite(commitResult.nodeCount) ? commitResult.nodeCount : null,
        bindingCount: Array.isArray(commitResult.bindings) ? commitResult.bindings.length : 0,
        bindingScopeId: clampString(commitResult.bindingScope && commitResult.bindingScope.id, '')
      };
    }

    function rebuildBindingIndex() {
      bindingIndex.clear();
      compiledBindingIndex.forEach((binding, id) => bindingIndex.set(id, binding));
      dynamicBindingIndex.forEach((binding, id) => {
        if (!bindingIndex.has(id)) bindingIndex.set(id, binding);
      });
    }

    function commitBindingError(code, message, details = {}) {
      const diagnostic = createDiagnostic(code, message, details, 'error');
      diagnosticsRecorder.publish(diagnostic);
      const error = new Error(message);
      error.code = code;
      error.diagnostic = diagnostic;
      return error;
    }

    function normalizeCommitBindings(commitResult) {
      if (!commitResult || typeof commitResult !== 'object') return null;
      const hasBindings = Object.prototype.hasOwnProperty.call(commitResult, 'bindings');
      const hasScope = Object.prototype.hasOwnProperty.call(commitResult, 'bindingScope');
      if (!hasBindings && !hasScope) return null;
      if (!Array.isArray(commitResult.bindings)) {
        throw commitBindingError(
          'rmt.event.commit-bindings.invalid',
          'DOM Commit Bindings muessen als Array vorliegen.'
        );
      }
      const scope = objectRecord(commitResult.bindingScope);
      const scopeId = clampString(scope.id, '');
      if (!scopeId) {
        throw commitBindingError(
          'rmt.event.commit-binding-scope.invalid',
          'DOM Commit Bindings benoetigen einen stabilen Binding-Scope.'
        );
      }
      const roots = toArray(scope.roots || scope.target).filter(Boolean);
      const normalized = normalizeBindings(commitResult.bindings.map((binding) => ({
        ...objectRecord(binding),
        bindingSource: 'commit',
        bindingScope: scopeId
      })));
      if (normalized.length !== commitResult.bindings.length) {
        throw commitBindingError(
          'rmt.event.commit-binding.invalid',
          'Jedes DOM Commit Binding benoetigt eine Binding-ID.',
          { bindingScopeId: scopeId }
        );
      }
      const stagedIds = new Map();
      normalized.forEach((binding) => {
        if (!binding.event || !binding.action || !binding.owner) {
          throw commitBindingError(
            'rmt.event.commit-binding.invalid',
            `DOM Commit Binding ${binding.id} ist unvollstaendig.`,
            { bindingId: binding.id, bindingScopeId: scopeId }
          );
        }
        if (!binding.target || typeof binding.target.addEventListener !== 'function') {
          throw commitBindingError(
            'rmt.event.commit-binding.target-invalid',
            `DOM Commit Binding ${binding.id} besitzt kein tatsaechliches EventTarget.`,
            { bindingId: binding.id, bindingScopeId: scopeId }
          );
        }
        if (roots.length && !roots.some((root) => isWithinTarget(binding.target, root))) {
          throw commitBindingError(
            'rmt.event.commit-binding.out-of-scope',
            `DOM Commit Binding ${binding.id} liegt ausserhalb seines Binding-Scopes.`,
            { bindingId: binding.id, bindingScopeId: scopeId }
          );
        }
        const previousTarget = stagedIds.get(binding.id);
        if (previousTarget && previousTarget !== binding.target) {
          throw commitBindingError(
            'rmt.event.commit-binding.duplicate',
            `DOM Commit Binding-ID ${binding.id} ist innerhalb des Scopes nicht eindeutig.`,
            { bindingId: binding.id, bindingScopeId: scopeId }
          );
        }
        stagedIds.set(binding.id, binding.target);
      });
      return {
        scope: {
          id: scopeId,
          complete: scope.complete !== false,
          roots,
          removedBindings: toArray(scope.removedBindings)
        },
        bindings: normalized
      };
    }

    function applyCommitBindings(commitResult) {
      const staged = normalizeCommitBindings(commitResult);
      if (!staged) return;
      staged.bindings.forEach((binding) => {
        if (!compiledBindingIndex.has(binding.id)) return;
        const compiled = compiledBindingIndex.get(binding.id);
        const diagnostic = createDiagnostic(
          'rmt.event.commit-binding.compiled-collision',
          `DOM Commit Binding ${binding.id} kollidiert mit einem kompilierten Binding.`,
          {
            bindingId: binding.id,
            compiledOwner: compiled.owner,
            commitOwner: binding.owner,
            bindingScopeId: staged.scope.id
          },
          options.strict || options.strictMaraca ? 'error' : 'warning'
        );
        diagnosticsRecorder.publish(diagnostic);
        if (options.strict || options.strictMaraca) {
          const error = new Error(diagnostic.message);
          error.code = diagnostic.code;
          error.diagnostic = diagnostic;
          throw error;
        }
      });

      staged.scope.removedBindings.forEach((removed) => {
        const bindingId = clampString(removed && (removed.bindingId || removed.id), '');
        const current = dynamicBindingIndex.get(bindingId);
        if (!current) return;
        if (removed && removed.target && current.target !== removed.target) return;
        dynamicBindingIndex.delete(bindingId);
      });
      if (staged.scope.complete) {
        const nextIdentities = staged.bindings.map((binding) => ({ id: binding.id, target: binding.target }));
        dynamicBindingIndex.forEach((binding, id) => {
          const belongsToScope = binding.bindingScope === staged.scope.id
            || staged.scope.roots.some((root) => isWithinTarget(binding.target, root));
          const retained = nextIdentities.some((entry) => entry.id === id && entry.target === binding.target);
          if (belongsToScope && !retained) dynamicBindingIndex.delete(id);
        });
      }
      staged.bindings.forEach((binding) => {
        if (compiledBindingIndex.has(binding.id)) return;
        dynamicBindingIndex.set(binding.id, binding);
      });
      rebuildBindingIndex();
    }

    function reconcile(root = rootTarget, commitResult = null) {
      const attached = [];
      const detached = [];
      const retained = [];
      const missing = [];
      if (!disposed) applyCommitBindings(commitResult);
      const activeBindings = [...bindingIndex.values()].filter((binding) => binding.enabled && binding.event);
      const activeBindingIds = new Set(activeBindings.map((binding) => binding.id));

      if (disposed) {
        return {
          schema: 'xtend.epic18.rmt-event-reconcile-report.v1',
          changed: false,
          disposed: true,
          bindingCount: activeBindings.length,
          attachedCount: 0,
          detachedCount: 0,
          retainedCount: 0,
          missingCount: 0,
          attached,
          detached,
          retained,
          missing,
          commit: summarizeCommitResult(commitResult)
        };
      }

      listenerRecords.slice().forEach((record) => {
        if (activeBindingIds.has(record.bindingId)) return;
        if (detachRecord(record)) {
          const binding = bindingIndex.get(record.bindingId);
          detached.push(binding ? bindingSummary(binding) : {
            bindingId: record.bindingId,
            owner: record.owner,
            event: record.event,
            component: ''
          });
        }
      });

      activeBindings.forEach((binding) => {
        const target = defaultResolveTarget(binding, root, options);
        const expectedOptions = listenerOptions(binding);
        const currentRecords = listenerRecords.filter((record) => record.bindingId === binding.id);
        const retainedRecord = target
          ? currentRecords.find((record) => (
            record.target === target
            && record.event === binding.event
            && listenerOptionsEqual(record.options, expectedOptions)
          ))
          : null;

        currentRecords.forEach((record) => {
          if (record === retainedRecord) return;
          if (detachRecord(record)) detached.push(bindingSummary(binding));
        });

        if (retainedRecord) {
          retained.push(bindingSummary(binding));
          return;
        }
        if (!target || typeof target.addEventListener !== 'function') {
          const summary = bindingSummary(binding);
          missing.push(summary);
          diagnosticsRecorder.publish(createDiagnostic('rmt.event.target.missing', `RMT Event ${binding.id} hat kein bindbares Ziel.`, {
            bindingId: binding.id,
            target: binding.target,
            event: binding.event,
            component: binding.component
          }, 'error'));
          return;
        }

        let record = null;
        const listener = (event) => {
          if (expectedOptions.once && record) detachRecord(record);
          return routeEvent(binding.id, event, { source: 'listener' });
        };
        target.addEventListener(binding.event, listener, expectedOptions);
        record = {
          bindingId: binding.id,
          owner: binding.owner,
          event: binding.event,
          target,
          listener,
          options: expectedOptions
        };
        listenerRecords.push(record);
        attached.push(bindingSummary(binding));
      });

      return {
        schema: 'xtend.epic18.rmt-event-reconcile-report.v1',
        changed: attached.length > 0 || detached.length > 0,
        disposed: false,
        bindingCount: activeBindings.length,
        attachedCount: attached.length,
        detachedCount: detached.length,
        retainedCount: retained.length,
        missingCount: missing.length,
        attached,
        detached,
        retained,
        missing,
        commit: summarizeCommitResult(commitResult)
      };
    }

    function attach(root = rootTarget) {
      const report = reconcile(root);
      return {
        schema: 'xtend.epic18.rmt-event-attach-report.v1',
        attachedCount: report.attachedCount,
        attached: report.attached
      };
    }

    function detachOwner(ownerId = '') {
      const owner = clampString(ownerId);
      let detached = 0;
      for (let index = listenerRecords.length - 1; index >= 0; index -= 1) {
        const record = listenerRecords[index];
        if (owner && record.owner !== owner) continue;
        if (detachRecord(record)) detached += 1;
      }
      return {
        schema: 'xtend.epic18.rmt-event-detach-report.v1',
        owner: owner || 'all',
        detachedCount: detached
      };
    }

    function dispose() {
      const alreadyDisposed = disposed;
      disposed = true;
      const detachReport = detachOwner('');
      if (
        compatibilityRendererRecord.renderer
        && typeof compatibilityRendererRecord.renderer.dispose === 'function'
      ) {
        compatibilityRendererRecord.renderer.dispose();
      }
      compatibilityRendererRecord.renderer = null;
      compatibilityRendererRecord.documentTarget = null;
      return {
        schema: 'xtend.epic18.rmt-event-dispose-report.v1',
        disposed: true,
        alreadyDisposed,
        detachedCount: detachReport.detachedCount
      };
    }

    return Object.freeze({
      schema: RMT_EVENT_ROUTING_RUNTIME_SCHEMA,
      attach,
      reconcile,
      detachOwner,
      detachAll() {
        return detachOwner('');
      },
      dispose,
      routeEvent,
      createPayload,
      listBindings() {
        return [...bindingIndex.values()].map((binding) => ({
          ...cloneValue(binding, binding),
          target: binding.target
        }));
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
    RMT_COMMAND_SCHEMA,
    createRmtEventRoutingRuntime
  };

  return Object.freeze(api);
}

const __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__ = createRmtEventRoutingRuntimeModule();

export const RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA = __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__.RMT_EVENT_ROUTING_DIAGNOSTIC_SCHEMA;
export const RMT_EVENT_ROUTING_RUNTIME_SCHEMA = __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__.RMT_EVENT_ROUTING_RUNTIME_SCHEMA;
export const RMT_COMMAND_SCHEMA = __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__.RMT_COMMAND_SCHEMA;
export const createRmtEventRoutingRuntime = __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__.createRmtEventRoutingRuntime;

export default __XTEND_RMT_EVENT_ROUTING_RUNTIME_API__;

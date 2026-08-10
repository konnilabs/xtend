(function attachRmtStateBindingViewProjector(globalTarget) {
  const RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA = 'xtend.rmt.state-binding-view-projector.v1';
  const RMT_STATE_BINDING_APPLICATION_SCHEMA = 'xtend.epic18.rmt-state-binding-application.v1';
  const RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA = 'xtend.rmt.state-binding-diagnostic.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.state_binding_view';
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
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return fallback;
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
      const error = new Error(`Unsafe state-binding path segment ${unsafeSegment}.`);
      error.code = 'rmt.state-binding.path-unsafe';
      throw error;
    }
    return parts;
  }

  function readPath(source, path) {
    if (!path) return source;
    const parts = assertSafePathSegments(path);
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, path)) {
      return source[path];
    }
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      if ((Array.isArray(cursor) || typeof cursor === 'string') && part === 'length') cursor = cursor.length;
      else cursor = cursor[part];
    }
    return cursor;
  }

  function createDiagnostic(code, severity, message, details = {}) {
    return Object.freeze({
      schema: RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA,
      code,
      severity,
      message,
      details: cloneValue(details, {})
    });
  }

  function diagnosticError(diagnostic) {
    const error = new Error(diagnostic.message);
    error.code = diagnostic.code;
    error.diagnostic = diagnostic;
    return error;
  }

  function isDeepFrozen(value, seen = new WeakSet()) {
    if (!value || typeof value !== 'object' || seen.has(value)) return true;
    if (!Object.isFrozen(value)) return false;
    seen.add(value);
    return Reflect.ownKeys(value).every((key) => (
      !Object.prototype.propertyIsEnumerable.call(value, key) || isDeepFrozen(value[key], seen)
    ));
  }

  function escapeCssString(value) {
    return String(value == null ? '' : value)
      .replace(/\\/gu, '\\\\')
      .replace(/"/gu, '\\"')
      .replace(/[\u0000-\u001f\u007f]/gu, (character) => `\\${character.codePointAt(0).toString(16)} `);
  }

  function isSafeSelectorAttributeName(value) {
    return /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/u.test(clampString(value));
  }

  function createEvaluationContext(snapshot) {
    return {
      states: objectRecord(snapshot.states),
      selectors: objectRecord(snapshot.selectors),
      derived: objectRecord(snapshot.derived),
      payload: {},
      params: {}
    };
  }

  function resolveRecordPath(records, expression) {
    if (Object.prototype.hasOwnProperty.call(records, expression)) return records[expression];
    const normalizedExpression = ['state.', 'selector.', 'derive.'].reduce((current, prefix) => (
      current.startsWith(prefix) ? current.slice(prefix.length) : current
    ), expression);
    if (Object.prototype.hasOwnProperty.call(records, normalizedExpression)) return records[normalizedExpression];
    const ownerKey = Object.keys(records)
      .filter((key) => expression.startsWith(`${key}.`) || normalizedExpression.startsWith(`${key}.`))
      .sort((left, right) => right.length - left.length)[0];
    if (ownerKey) {
      const ownerExpression = normalizedExpression.startsWith(`${ownerKey}.`) ? normalizedExpression : expression;
      return readPath(records[ownerKey], ownerExpression.slice(ownerKey.length + 1));
    }
    return readPath(records, normalizedExpression);
  }

  function resolveReference(expression, context, item) {
    if (Array.isArray(expression)) return expression.map((entry) => resolveReference(entry, context, item));
    if (expression && typeof expression === 'object') return evaluateTransformExpression(expression, context, item);
    if (typeof expression !== 'string') return expression;
    if (expression.includes('${')) return interpolateString(expression, context, item);
    if (expression === '$item') return item;
    if (expression.startsWith('$item.')) return readPath(item, expression.slice(6));
    if (expression.startsWith('$state.')) return resolveReference(`state.${expression.slice(7)}`, context, item);
    if (expression.startsWith('state.')) return resolveRecordPath(context.states, expression);
    if (expression.startsWith('$selector.')) return resolveReference(`selector.${expression.slice(10)}`, context, item);
    if (expression.startsWith('selector.')) return resolveRecordPath(context.selectors, expression);
    if (expression.startsWith('$derive.')) return resolveReference(`derive.${expression.slice(8)}`, context, item);
    if (expression.startsWith('derive.')) return resolveRecordPath(context.derived, expression);
    return expression;
  }

  function interpolateString(value, context, item) {
    return String(value).replace(/\$\{([^}]+)\}/gu, (_, expression) => {
      const normalized = clampString(expression);
      const resolved = resolveReference(normalized.startsWith('$') ? normalized : `$${normalized}`, context, item);
      return String(resolved == null ? '' : resolved);
    });
  }

  function compareValues(left, right, op, options = {}) {
    const normalizedOp = clampString(op, 'equals');
    if ((right === '' || right == null) && options.empty === 'pass') return true;
    if (normalizedOp === 'equals' || normalizedOp === 'eq') return left === right;
    if (normalizedOp === 'not-equals' || normalizedOp === 'neq') return left !== right;
    if (normalizedOp === 'truthy') return !!left;
    if (normalizedOp === 'falsy') return !left;
    if (normalizedOp === 'in') return Array.isArray(right) && right.includes(left);
    if (normalizedOp === 'includes') {
      return Array.isArray(left)
        ? left.includes(right)
        : String(left == null ? '' : left).includes(String(right == null ? '' : right));
    }
    if (normalizedOp === 'contains') {
      const leftText = String(left == null ? '' : left);
      const rightText = String(right == null ? '' : right);
      return options.ignoreCase
        ? leftText.toLowerCase().includes(rightText.toLowerCase())
        : leftText.includes(rightText);
    }
    return left === right;
  }

  function evaluateRule(rule, context, item) {
    if (typeof rule === 'string') return !!resolveReference(rule, context, item);
    const record = objectRecord(rule);
    const left = record.left
      ? resolveReference(record.left, context, item)
      : readPath(item, record.path || record.field || '');
    const right = Object.prototype.hasOwnProperty.call(record, 'right')
      ? resolveReference(record.right, context, item)
      : resolveReference(record.value, context, item);
    return compareValues(left, right, record.op || record.operator, record);
  }

  function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes)) return '';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), units.length - 1);
    const amount = bytes / Math.pow(1024, index);
    const precision = index === 0 || Math.abs(amount) >= 10 ? 0 : 1;
    return `${amount.toFixed(precision)} ${units[index]}`;
  }

  function formatDateShort(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  function formatDuration(value) {
    const totalSeconds = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const padded = (entry) => String(entry).padStart(2, '0');
    return hours > 0 ? `${hours}:${padded(minutes)}:${padded(seconds)}` : `${minutes}:${padded(seconds)}`;
  }

  function evaluateTransformExpression(recordInput, context, item) {
    const record = objectRecord(recordInput);
    const operation = clampString(record.op || record.operator || record.kind || record.compute || record.format);
    const hasValue = Object.prototype.hasOwnProperty.call(record, 'value')
      || Object.prototype.hasOwnProperty.call(record, 'from')
      || Object.prototype.hasOwnProperty.call(record, 'source');
    const sourceExpression = Object.prototype.hasOwnProperty.call(record, 'value')
      ? record.value
      : (Object.prototype.hasOwnProperty.call(record, 'from') ? record.from : record.source);
    const source = hasValue
      ? resolveReference(sourceExpression, context, item)
      : (record.path ? readPath(item, record.path) : undefined);
    let result;
    switch (operation) {
      case '':
      case 'path':
        result = record.path && !hasValue ? readPath(item, record.path) : source;
        break;
      case 'uppercase':
      case 'upper':
        result = String(source == null ? '' : source).toUpperCase();
        break;
      case 'lowercase':
      case 'lower':
        result = String(source == null ? '' : source).toLowerCase();
        break;
      case 'replace': {
        const search = resolveReference(record.search, context, item);
        const replacement = resolveReference(record.replacement, context, item);
        result = String(source == null ? '' : source).replace(
          new RegExp(String(search == null ? '' : search), record.flags || 'gu'),
          String(replacement == null ? '' : replacement)
        );
        break;
      }
      case 'concat':
      case 'interpolate':
        result = toArray(record.values || record.parts || source)
          .map((entry) => resolveReference(entry, context, item))
          .join(record.separator || '');
        break;
      case 'slice':
        result = Array.isArray(source) || typeof source === 'string'
          ? source.slice(
              Number(resolveReference(record.start || 0, context, item)),
              typeof record.end === 'undefined' ? undefined : Number(resolveReference(record.end, context, item))
            )
          : [];
        break;
      case 'contains':
      case 'includes':
        result = compareValues(source, resolveReference(record.search || record.item || record.right, context, item), operation, record);
        break;
      case 'map':
        result = Array.isArray(source)
          ? source.map((entry) => record.path ? readPath(entry, record.path) : resolveReference(record.expression || '$item', context, entry))
          : [];
        break;
      case 'filter':
        result = Array.isArray(source)
          ? source.filter((entry) => toArray(record.where || record.filter || record.rules).every((rule) => evaluateRule(rule, context, entry)))
          : [];
        break;
      case 'count':
        result = Array.isArray(source) || typeof source === 'string'
          ? source.length
          : Object.keys(objectRecord(source)).length;
        break;
      case 'reduce':
        result = record.mode === 'sum'
          ? (Array.isArray(source)
              ? source.reduce((sum, entry) => sum + Number(record.path ? readPath(entry, record.path) : entry || 0), 0)
              : 0)
          : (Array.isArray(source) || typeof source === 'string'
              ? source.length
              : Object.keys(objectRecord(source)).length);
        break;
      case 'countBy':
      case 'count-by':
        result = Object.create(null);
        if (Array.isArray(source)) {
          source.forEach((entry) => {
            const key = clampString(record.path ? readPath(entry, record.path) : resolveReference(record.key || '$item', context, entry), 'unknown');
            assertSafePathSegments(key);
            result[key] = (result[key] || 0) + 1;
          });
        }
        break;
      case 'not-empty':
        result = Array.isArray(source) || typeof source === 'string' ? source.length > 0 : !!source;
        break;
      case 'empty':
        result = Array.isArray(source) || typeof source === 'string' ? source.length === 0 : !source;
        break;
      case 'boolean':
        result = !!source;
        break;
      case 'first':
        result = Array.isArray(source) ? source[0] || null : source;
        break;
      case 'formatBytes':
      case 'bytes':
        result = formatBytes(source);
        break;
      case 'formatDateShort':
      case 'dateShort':
        result = formatDateShort(source);
        break;
      case 'formatDuration':
      case 'duration':
        result = formatDuration(source);
        break;
      case 'fallback':
        result = source;
        break;
      default:
        result = hasValue ? source : recordInput;
        break;
    }
    if ((result === null || typeof result === 'undefined' || result === '') && Object.prototype.hasOwnProperty.call(record, 'fallback')) {
      return resolveReference(record.fallback, context, item);
    }
    return result;
  }

  function createRmtStateBindingViewProjector(options = {}) {
    const strict = options.strict === true || options.strictMaraca === true;
    const diagnostics = [];
    const diagnosticCodes = new Set();
    let compatibilityRenderer = null;
    let disposed = false;

    function publishDiagnostic(diagnostic, once = false) {
      if (once && diagnosticCodes.has(diagnostic.code)) {
        return diagnostics.find((entry) => entry.code === diagnostic.code) || diagnostic;
      }
      diagnosticCodes.add(diagnostic.code);
      diagnostics.push(diagnostic);
      if (typeof options.publishDiagnostic === 'function') options.publishDiagnostic(diagnostic);
      const diagnosticsHub = options.diagnosticsHub || null;
      if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
        diagnosticsHub.publish(
          clampString(options.diagnosticChannel, DEFAULT_DIAGNOSTIC_CHANNEL),
          diagnostic,
          { schema: RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA }
        );
      }
      return diagnostic;
    }

    function fail(code, message, details = {}) {
      const diagnostic = publishDiagnostic(createDiagnostic(code, 'error', message, details));
      throw diagnosticError(diagnostic);
    }

    if (strict && (!(options.domRenderer || options.renderer) || typeof (options.domRenderer || options.renderer).commit !== 'function')) {
      fail(
        'rmt.dom.shared-renderer-missing',
        'Strict State Binding View projection requires the injected shared DOM Descriptor Renderer.',
        { adapter: 'state-binding-view-projector' }
      );
    }

    function resolveRenderer(root) {
      const injected = options.domRenderer || options.renderer;
      if (injected && typeof injected.commit === 'function') return injected;
      const diagnostic = createDiagnostic(
        'rmt.dom.shared-renderer-missing',
        strict ? 'error' : 'warning',
        'State Binding View Projector requires the shared DOM Descriptor Renderer.',
        { adapter: 'state-binding-view-projector' }
      );
      if (strict) {
        publishDiagnostic(diagnostic, true);
        throw diagnosticError(diagnostic);
      }
      const documentTarget = options.documentTarget || (root && root.ownerDocument) || (globalTarget && globalTarget.document);
      const factory = options.createDomRenderer
        || (globalTarget
          && globalTarget.XTendRmtDomDescriptorRenderer
          && globalTarget.XTendRmtDomDescriptorRenderer.createRmtDomDescriptorRenderer);
      if (!documentTarget || typeof factory !== 'function') {
        publishDiagnostic(diagnostic, true);
        throw diagnosticError(diagnostic);
      }
      if (!compatibilityRenderer) {
        compatibilityRenderer = factory({
          documentTarget,
          diagnosticsHub: options.diagnosticsHub,
          diagnosticChannel: options.domDiagnosticChannel
        });
      }
      publishDiagnostic(diagnostic, true);
      return compatibilityRenderer;
    }

    function project(root, bindings, modelSnapshot, metadata = {}) {
      if (disposed) fail('rmt.state-binding.projector-disposed', 'State Binding View Projector is already disposed.');
      if (!root || typeof root.querySelector !== 'function') {
        fail('rmt.state-binding.root-invalid', 'State Binding View Projector requires a queryable root.');
      }
      if (!modelSnapshot || typeof modelSnapshot !== 'object' || !isDeepFrozen(modelSnapshot)) {
        fail(
          'rmt.state-binding.snapshot-mutable',
          'State Binding View Projector accepts only deeply frozen model snapshots.'
        );
      }
      const renderer = resolveRenderer(root);
      const operations = [];
      const localDiagnostics = [];
      const commitResults = [];
      const evaluationContext = createEvaluationContext(modelSnapshot);
      const resolveBindingValue = (expression, item) => resolveReference(expression, evaluationContext, item);

      toArray(bindings).forEach((binding) => {
        const bindingRecord = objectRecord(binding);
        const source = resolveBindingValue(bindingRecord.source);
        const items = Array.isArray(source) ? source : [source];
        const target = objectRecord(bindingRecord.target);
        const targetAttribute = clampString(target.attribute || target.byKeyAttribute, 'data-rmt-key');
        if (!isSafeSelectorAttributeName(targetAttribute)) {
          const diagnostic = createDiagnostic(
            'rmt.state-binding.target-attribute-invalid',
            strict ? 'error' : 'warning',
            `Invalid State Binding target attribute ${targetAttribute}.`,
            { binding: bindingRecord.id, targetAttribute }
          );
          localDiagnostics.push(diagnostic);
          publishDiagnostic(diagnostic);
          if (strict) throw diagnosticError(diagnostic);
          return;
        }
        items.filter((item) => item != null).forEach((item) => {
          const keyPath = clampString(bindingRecord.key || target.key, 'id');
          const key = String(readPath(item, keyPath));
          const selector = `[${targetAttribute}="${escapeCssString(key)}"]`;
          let element = null;
          try {
            element = root.querySelector(selector);
          } catch (_) {
            const diagnostic = createDiagnostic(
              'rmt.state-binding.target-selector-invalid',
              strict ? 'error' : 'warning',
              'State Binding target could not be resolved safely.',
              { binding: bindingRecord.id, targetAttribute }
            );
            localDiagnostics.push(diagnostic);
            publishDiagnostic(diagnostic);
            if (strict) throw diagnosticError(diagnostic);
          }
          if (!element) return;
          const attributes = {};
          const properties = {};
          const classTokens = new Set(
            String((element.getAttribute && element.getAttribute('class')) || '').split(/\s+/u).filter(Boolean)
          );
          let hasClassBinding = false;
          const elementOperations = [];
          Object.entries(objectRecord(bindingRecord.attributes)).forEach(([name, expression]) => {
            const normalizedName = clampString(name);
            const value = expression && typeof expression === 'object'
              ? evaluateRule(expression, evaluationContext, item)
              : resolveBindingValue(expression, item);
            attributes[normalizedName] = value;
            elementOperations.push({ binding: bindingRecord.id, target: key, kind: 'attribute', name: normalizedName, value });
          });
          Object.entries(objectRecord(bindingRecord.classes)).forEach(([token, expression]) => {
            const enabled = expression && typeof expression === 'object'
              ? evaluateRule(expression, evaluationContext, item)
              : !!resolveBindingValue(expression, item);
            hasClassBinding = true;
            if (enabled) classTokens.add(token);
            else classTokens.delete(token);
            elementOperations.push({ binding: bindingRecord.id, target: key, kind: 'class', name: token, value: enabled });
          });
          Object.entries(objectRecord(bindingRecord.properties)).forEach(([name, expression]) => {
            const normalizedName = clampString(name);
            const value = resolveBindingValue(expression, item);
            properties[normalizedName] = value;
            elementOperations.push({ binding: bindingRecord.id, target: key, kind: 'property', name: normalizedName, value });
          });
          operations.push(...elementOperations);
          const descriptor = {
            type: 'element',
            tag: clampString(element.localName || element.tagName, 'div').toLowerCase(),
            attributes,
            properties
          };
          if (hasClassBinding) {
            if (classTokens.size) descriptor.class = [...classTokens];
            else descriptor.attributes.class = false;
          }
          try {
            commitResults.push(renderer.commit({
              operation: 'merge-element',
              target: element,
              descriptor,
              ownership: options.ownership,
              context: {
                ...objectRecord(options.context),
                componentRegistry: options.componentRegistry || options.registry
              },
              metadata: {
                ...objectRecord(metadata),
                adapter: 'state-binding-view-projector',
                bindingId: bindingRecord.id,
                targetKey: key
              }
            }));
          } catch (error) {
            const reason = clampString(error && error.code, 'rmt.dom.commit.failed');
            elementOperations.forEach((operationRecord) => {
              operationRecord.skipped = true;
              operationRecord.reason = reason;
            });
            const diagnostic = error && error.diagnostic
              ? error.diagnostic
              : createDiagnostic(reason, 'error', error && error.message ? error.message : 'DOM commit failed.');
            localDiagnostics.push(diagnostic);
            publishDiagnostic(diagnostic);
            if (strict) throw error;
          }
        });
      });

      return Object.freeze({
        schema: RMT_STATE_BINDING_APPLICATION_SCHEMA,
        projectorSchema: RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA,
        strategy: options.strategy || 'attribute-sync',
        replacedRoot: false,
        operationCount: operations.length,
        operations: Object.freeze(operations.map((operation) => Object.freeze({ ...operation }))),
        commitResults: Object.freeze(commitResults.slice()),
        diagnostics: Object.freeze(localDiagnostics.slice())
      });
    }

    return Object.freeze({
      schema: RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA,
      project,
      listDiagnostics() {
        return diagnostics.slice();
      },
      dispose() {
        const alreadyDisposed = disposed;
        disposed = true;
        if (compatibilityRenderer && typeof compatibilityRenderer.dispose === 'function') {
          compatibilityRenderer.dispose();
        }
        compatibilityRenderer = null;
        return Object.freeze({
          schema: RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA,
          disposed: true,
          alreadyDisposed
        });
      }
    });
  }

  const api = Object.freeze({
    RMT_STATE_BINDING_APPLICATION_SCHEMA,
    RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA,
    RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA,
    createRmtStateBindingViewProjector
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (globalTarget) globalTarget.XTendRmtStateBindingViewProjector = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_STATE_BINDING_VIEW_PROJECTOR_API__ = globalThis.XTendRmtStateBindingViewProjector;

export const RMT_STATE_BINDING_APPLICATION_SCHEMA = __XTEND_RMT_STATE_BINDING_VIEW_PROJECTOR_API__.RMT_STATE_BINDING_APPLICATION_SCHEMA;
export const RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA = __XTEND_RMT_STATE_BINDING_VIEW_PROJECTOR_API__.RMT_STATE_BINDING_DIAGNOSTIC_SCHEMA;
export const RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA = __XTEND_RMT_STATE_BINDING_VIEW_PROJECTOR_API__.RMT_STATE_BINDING_VIEW_PROJECTOR_SCHEMA;
export const createRmtStateBindingViewProjector = __XTEND_RMT_STATE_BINDING_VIEW_PROJECTOR_API__.createRmtStateBindingViewProjector;

export default __XTEND_RMT_STATE_BINDING_VIEW_PROJECTOR_API__;

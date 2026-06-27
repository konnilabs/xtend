(function attachRmtStateSelectorRuntime(globalTarget) {
  const RMT_STATE_SELECTOR_RUNTIME_SCHEMA = 'xtend.epic18.rmt-state-selector-runtime.v1';
  const RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-state-selector-diagnostic.v1';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.state_selector';
  const URL_ATTRIBUTE_NAMES = new Set(['href', 'src', 'action', 'formaction', 'poster']);
  const BLOCKED_ATTRIBUTE_NAMES = new Set(['srcdoc']);
  const BLOCKED_PROPERTY_NAMES = new Set(['innerHTML', 'outerHTML', 'insertAdjacentHTML']);


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

  function isSafeUrl(value) {
    const normalized = String(value == null ? '' : value).trim().toLowerCase();
    if (!normalized) return true;
    if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) return true;
    return /^(https?:|mailto:|tel:|blob:)/u.test(normalized);
  }

  function isSafeAttributeName(name) {
    const normalized = clampString(name).toLowerCase();
    if (!normalized) return false;
    if (normalized.startsWith('on')) return false;
    if (BLOCKED_ATTRIBUTE_NAMES.has(normalized)) return false;
    return /^[a-z_:][a-z0-9_.:-]*$/u.test(normalized);
  }

  function isSafePropertyName(name) {
    const normalized = clampString(name);
    if (!normalized) return false;
    if (normalized.startsWith('on')) return false;
    return !BLOCKED_PROPERTY_NAMES.has(normalized);
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

  function normalizePathSegments(path) {
    return String(path || '')
      .replace(/\[([0-9]+)\]/gu, '.$1')
      .split('.')
      .filter(Boolean);
  }

  function readPath(source, path) {
    if (!path) return source;
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, path)) {
      return source[path];
    }
    const parts = normalizePathSegments(path);
    let cursor = source;
    for (const part of parts) {
      if (cursor == null) return undefined;
      if ((Array.isArray(cursor) || typeof cursor === 'string') && part === 'length') {
        cursor = cursor.length;
      } else {
        cursor = cursor[part];
      }
    }
    return cursor;
  }

  function writePath(target, path, value) {
    const parts = String(path || '').split('.').filter(Boolean);
    if (!parts.length) return target;
    let cursor = target;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        cursor[part] = value;
        return;
      }
      if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
        cursor[part] = {};
      }
      cursor = cursor[part];
    });
    return target;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
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
            schema: RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA
          });
        }
        return diagnostic;
      }
    };
  }

  function createDiagnostic(code, message, details = {}, severity = 'error') {
    return {
      schema: RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA,
      code,
      message,
      severity,
      details: cloneValue(details, {})
    };
  }

  function normalizeStateDefinitions(states) {
    return toArray(states).map((state) => ({
      id: clampString(state && state.id),
      type: clampString(state && state.type, 'object'),
      schema: clampString(state && state.schema, ''),
      initial: cloneValue(state && Object.prototype.hasOwnProperty.call(state, 'initial') ? state.initial : null, null),
      preserve: clampString(state && state.preserve, ''),
      xstateKey: clampString(state && state.xstateKey, state && state.id)
    })).filter((state) => state.id);
  }

  function normalizeSelectorDefinitions(selectors) {
    return toArray(selectors).map((selector) => ({
      ...objectRecord(selector),
      id: clampString(selector && selector.id),
      from: clampString(selector && selector.from),
      compute: clampString(selector && selector.compute, ''),
      structural: selector && Object.prototype.hasOwnProperty.call(selector, 'structural') ? selector.structural !== false : true
    })).filter((selector) => selector.id);
  }

  function normalizeDerivedDefinitions(derived) {
    return toArray(derived).map((entry) => ({
      ...objectRecord(entry),
      id: clampString(entry && entry.id),
      from: clampString(entry && entry.from),
      compute: clampString(entry && entry.compute, ''),
      structural: entry && Object.prototype.hasOwnProperty.call(entry, 'structural') ? entry.structural !== false : false
    })).filter((entry) => entry.id);
  }

  function normalizeReducerDefinitions(reducers) {
    return toArray(reducers).map((reducer) => ({
      ...objectRecord(reducer),
      id: clampString(reducer && reducer.id),
      command: clampString(reducer && (reducer.command || reducer.id)),
      state: clampString(reducer && reducer.state)
    })).filter((reducer) => reducer.id && reducer.command && reducer.state);
  }

  function validateTypedValue(definition, value) {
    const type = definition.type;
    if (type === 'collection' || type === 'array') return Array.isArray(value);
    if (type === 'object') return !!value && typeof value === 'object' && !Array.isArray(value);
    if (type === 'string') return typeof value === 'string';
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    if (type === 'boolean') return typeof value === 'boolean';
    if (type === 'nullable') return value === null || typeof value !== 'undefined';
    return true;
  }

  function createRmtXStateBridge(options = {}) {
    const xstate = options.xstate || null;
    const writes = [];
    const reads = [];

    function set(key, value, metadata = {}) {
      const safeKey = clampString(key);
      if (!safeKey) return false;
      let mirrored = false;
      if (xstate && typeof xstate.set === 'function') {
        xstate.set(safeKey, cloneValue(value, value));
        mirrored = true;
      } else if (xstate && typeof xstate.setState === 'function') {
        xstate.setState(safeKey, cloneValue(value, value));
        mirrored = true;
      }
      writes.push({ key: safeKey, value: cloneValue(value, value), mirrored, metadata: cloneValue(metadata, {}) });
      return mirrored;
    }

    function get(key, fallbackValue) {
      const safeKey = clampString(key);
      let value;
      if (xstate && typeof xstate.get === 'function') {
        value = xstate.get(safeKey);
      } else if (xstate && typeof xstate.getState === 'function') {
        value = xstate.getState(safeKey);
      }
      reads.push({ key: safeKey, hit: typeof value !== 'undefined' });
      return typeof value === 'undefined' ? fallbackValue : value;
    }

    function mirrorSnapshot(snapshot, metadata = {}) {
      Object.entries(snapshot.states || {}).forEach(([key, value]) => set(key, value, metadata));
      Object.entries(snapshot.selectors || {}).forEach(([key, value]) => set(key, value, metadata));
      Object.entries(snapshot.derived || {}).forEach(([key, value]) => set(key, value, metadata));
    }

    function subscribe(listener) {
      if (xstate && typeof xstate.subscribe === 'function') return xstate.subscribe(listener);
      return () => undefined;
    }

    return Object.freeze({
      schema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
      external: !!xstate,
      set,
      get,
      mirrorSnapshot,
      subscribe,
      listWrites() {
        return writes.map((entry) => cloneValue(entry, entry));
      },
      listReads() {
        return reads.map((entry) => cloneValue(entry, entry));
      }
    });
  }

  function createEvaluationContext(stateValues, selectorValues = {}, derivedValues = {}, payload = {}, params = {}) {
    return {
      states: stateValues,
      selectors: selectorValues,
      derived: derivedValues,
      payload,
      params
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
    if (expression === '$payload') return context.payload;
    if (expression.startsWith('$payload.')) return readPath(context.payload, expression.slice(9));
    if (expression === '$params') return context.params;
    if (expression.startsWith('$params.')) return readPath(context.params, expression.slice(8));
    if (expression.startsWith('$state.')) return resolveReference(`state.${expression.slice(7)}`, context, item);
    if (expression.startsWith('state.')) {
      return resolveRecordPath(context.states, expression);
    }
    if (expression.startsWith('$selector.')) return resolveReference(`selector.${expression.slice(10)}`, context, item);
    if (expression.startsWith('selector.')) {
      return resolveRecordPath(context.selectors, expression);
    }
    if (expression.startsWith('$derive.')) return resolveReference(`derive.${expression.slice(8)}`, context, item);
    if (expression.startsWith('derive.')) {
      return resolveRecordPath(context.derived, expression);
    }
    if (Object.prototype.hasOwnProperty.call(context.params || {}, expression)) return context.params[expression];
    return expression;
  }

  function isEmptyValue(value) {
    return value === null || typeof value === 'undefined' || value === '';
  }

  function applyFallback(value, fallback, context, item) {
    return isEmptyValue(value) && typeof fallback !== 'undefined'
      ? resolveReference(fallback, context, item)
      : value;
  }

  function interpolateString(value, context, item) {
    return String(value).replace(/\$\{([^}]+)\}/gu, (_, expression) => {
      const normalized = clampString(expression, '');
      const resolved = resolveReference(normalized.startsWith('$') ? normalized : `$${normalized}`, context, item);
      return String(resolved == null ? '' : resolved);
    });
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
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
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
    const op = clampString(record.op || record.operator || record.kind || record.compute || record.format, '');
    const hasValue = Object.prototype.hasOwnProperty.call(record, 'value') || Object.prototype.hasOwnProperty.call(record, 'from') || Object.prototype.hasOwnProperty.call(record, 'source');
    const sourceExpression = Object.prototype.hasOwnProperty.call(record, 'value')
      ? record.value
      : (Object.prototype.hasOwnProperty.call(record, 'from') ? record.from : record.source);
    const source = hasValue ? resolveReference(sourceExpression, context, item) : (record.path ? readPath(item, record.path) : undefined);
    let result;

    switch (op) {
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
        result = String(source == null ? '' : source).replace(new RegExp(String(search == null ? '' : search), record.flags || 'gu'), String(replacement == null ? '' : replacement));
        break;
      }
      case 'concat':
      case 'interpolate':
        result = toArray(record.values || record.parts || source).map((entry) => resolveReference(entry, context, item)).join(record.separator || '');
        break;
      case 'slice':
        result = Array.isArray(source) || typeof source === 'string'
          ? source.slice(Number(resolveReference(record.start || 0, context, item)), typeof record.end === 'undefined' ? undefined : Number(resolveReference(record.end, context, item)))
          : [];
        break;
      case 'contains':
      case 'includes':
        result = compareValues(source, resolveReference(record.search || record.item || record.right, context, item), 'contains', record);
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
      case 'reduce':
        if (record.mode === 'sum') {
          result = Array.isArray(source) ? source.reduce((sum, entry) => sum + Number(record.path ? readPath(entry, record.path) : entry || 0), 0) : 0;
        } else {
          result = Array.isArray(source) || typeof source === 'string' ? source.length : Object.keys(objectRecord(source)).length;
        }
        break;
      case 'countBy':
      case 'count-by':
        result = {};
        if (Array.isArray(source)) {
          source.forEach((entry) => {
            const key = clampString(record.path ? readPath(entry, record.path) : resolveReference(record.key || '$item', context, entry), 'unknown');
            result[key] = (result[key] || 0) + 1;
          });
        }
        break;
      case 'count':
        result = Array.isArray(source) || typeof source === 'string' ? source.length : Object.keys(objectRecord(source)).length;
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
        result = applyFallback(source, record.fallback, context, item);
        break;
      default:
        result = hasValue ? source : recordInput;
        break;
    }

    return applyFallback(result, record.fallback, context, item);
  }

  function compareValues(left, right, op, options = {}) {
    const normalizedOp = clampString(op, 'equals');
    if ((right === '' || right == null) && options.empty === 'pass') return true;
    if (normalizedOp === 'equals' || normalizedOp === 'eq') return left === right;
    if (normalizedOp === 'not-equals' || normalizedOp === 'neq') return left !== right;
    if (normalizedOp === 'truthy') return !!left;
    if (normalizedOp === 'falsy') return !left;
    if (normalizedOp === 'in') return Array.isArray(right) && right.includes(left);
    if (normalizedOp === 'includes') return Array.isArray(left) ? left.includes(right) : String(left == null ? '' : left).includes(String(right == null ? '' : right));
    if (normalizedOp === 'contains') {
      const leftText = String(left == null ? '' : left);
      const rightText = String(right == null ? '' : right);
      return options.ignoreCase ? leftText.toLowerCase().includes(rightText.toLowerCase()) : leftText.includes(rightText);
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

  function applySelectorOperations(source, selector, context) {
    let value = source;
    if (selector.path) value = readPath(value, selector.path);
    const filters = toArray(selector.where || selector.filter).filter(Boolean);
    if (filters.length) {
      value = Array.isArray(value)
        ? value.filter((item) => filters.every((rule) => evaluateRule(rule, context, item)))
        : [];
    }
    if (selector.find) {
      const rules = toArray(selector.find).filter(Boolean);
      value = Array.isArray(value)
        ? value.find((item) => rules.every((rule) => evaluateRule(rule, context, item))) || null
        : null;
    }
    if (selector.sort && Array.isArray(value)) {
      const sort = objectRecord(selector.sort);
      const direction = clampString(sort.direction, 'asc') === 'desc' ? -1 : 1;
      value = value.slice().sort((left, right) => {
        const leftValue = readPath(left, sort.by || sort.path || '');
        const rightValue = readPath(right, sort.by || sort.path || '');
        return String(leftValue == null ? '' : leftValue).localeCompare(String(rightValue == null ? '' : rightValue)) * direction;
      });
    }
    if (selector.slice && (Array.isArray(value) || typeof value === 'string')) {
      const slice = objectRecord(selector.slice);
      value = value.slice(Number(resolveReference(slice.start || 0, context)), typeof slice.end === 'undefined' ? undefined : Number(resolveReference(slice.end, context)));
    }
    if (selector.map) {
      const mapRecord = typeof selector.map === 'string' ? { path: selector.map } : objectRecord(selector.map);
      value = Array.isArray(value)
        ? value.map((item) => mapRecord.path ? readPath(item, mapRecord.path) : resolveReference(mapRecord.expression || mapRecord.value || '$item', context, item))
        : [];
    }
    if (selector.transform) value = evaluateTransformExpression({ ...objectRecord(selector.transform), value }, context);
    if (selector.compute === 'count') return Array.isArray(value) || typeof value === 'string' ? value.length : Object.keys(objectRecord(value)).length;
    if (selector.compute === 'countBy' || selector.compute === 'count-by') {
      const result = {};
      if (Array.isArray(value)) {
        const path = selector.countBy || selector.path || selector.key || '';
        value.forEach((item) => {
          const key = clampString(path ? readPath(item, path) : item, 'unknown');
          result[key] = (result[key] || 0) + 1;
        });
      }
      return result;
    }
    if (selector.compute === 'not-empty') return Array.isArray(value) || typeof value === 'string' ? value.length > 0 : !!value;
    if (selector.compute === 'empty') return Array.isArray(value) || typeof value === 'string' ? value.length === 0 : !value;
    if (selector.compute === 'first') return Array.isArray(value) ? value[0] || null : value;
    if (selector.compute === 'boolean') return !!value;
    return value;
  }

  function evaluateDerived(entry, context) {
    let value = resolveReference(entry.from, context);
    if (entry.path) value = readPath(value, entry.path);
    if (entry.expression) {
      if (typeof entry.expression === 'object') {
        value = resolveReference({ ...entry.expression, value }, context);
      } else {
        const expression = clampString(entry.expression);
        const sourceName = clampString(entry.sourceName || entry.from.split('.').pop());
        if (expression.startsWith(`${sourceName}.`)) value = readPath(value, expression.slice(sourceName.length + 1));
        else value = resolveReference(expression, context);
      }
    }
    if (entry.transform) value = evaluateTransformExpression({ ...objectRecord(entry.transform), value }, context);
    if (entry.compute === 'count') return Array.isArray(value) || typeof value === 'string' ? value.length : Object.keys(objectRecord(value)).length;
    if (entry.compute === 'countBy' || entry.compute === 'count-by') return evaluateTransformExpression({ op: 'countBy', value, path: entry.countBy || entry.path }, context);
    if (entry.compute === 'not-empty') return Array.isArray(value) || typeof value === 'string' ? value.length > 0 : !!value;
    if (entry.compute === 'empty') return Array.isArray(value) || typeof value === 'string' ? value.length === 0 : !value;
    if (entry.compute === 'boolean') return !!value;
    return value;
  }

  function buildRenderModel(states, selectors, derived) {
    const model = {};
    Object.entries(states).forEach(([key, value]) => {
      const cloned = cloneValue(value, value);
      model[key] = cloned;
      writePath(model, key, cloned);
      if (key.startsWith('state.')) model[key.slice(6)] = cloned;
    });
    Object.entries(selectors).forEach(([key, value]) => {
      const cloned = cloneValue(value, value);
      model[key] = cloned;
      writePath(model, key, cloned);
      if (key.startsWith('selector.')) model[key.slice(9)] = cloned;
    });
    Object.entries(derived).forEach(([key, value]) => {
      const cloned = cloneValue(value, value);
      model[key] = cloned;
      writePath(model, key, cloned);
      if (key.startsWith('derive.')) model[key.slice(7)] = cloned;
    });
    return model;
  }

  function diffRecord(previous, next) {
    const keys = new Set([...Object.keys(previous || {}), ...Object.keys(next || {})]);
    return [...keys].filter((key) => stableStringify(previous && previous[key]) !== stableStringify(next && next[key]));
  }

  function planRmtStatePatch(previousSnapshot, nextSnapshot, options = {}) {
    const selectorDefinitions = new Map(toArray(options.selectors).map((selector) => [selector.id, selector]));
    const derivedDefinitions = new Map(toArray(options.derived).map((entry) => [entry.id, entry]));
    const preserveStates = options.preserveStates instanceof Set
      ? options.preserveStates
      : new Set(toArray(options.preserveStates));
    const changedStates = diffRecord(previousSnapshot.states, nextSnapshot.states);
    const changedSelectors = diffRecord(previousSnapshot.selectors, nextSnapshot.selectors);
    const changedDerived = diffRecord(previousSnapshot.derived, nextSnapshot.derived);
    const structuralSelectors = changedSelectors.filter((id) => {
      const selector = selectorDefinitions.get(id);
      return !selector || selector.structural !== false;
    });
    const structuralDerived = changedDerived.filter((id) => {
      const entry = derivedDefinitions.get(id);
      return entry && entry.structural === true;
    });
    const structuralStates = changedStates.filter((id) => !preserveStates.has(id));
    const structural = structuralStates.length > 0 || structuralSelectors.length > 0 || structuralDerived.length > 0;
    return {
      schema: 'xtend.epic18.rmt-state-patch-plan.v1',
      strategy: structural ? 'rerender' : 'attribute-sync',
      preserveDom: !structural,
      structural,
      changedStates,
      changedSelectors,
      changedDerived,
      structuralStates,
      structuralSelectors,
      structuralDerived
    };
  }

  function createRmtStateSelectorRuntime(options = {}) {
    const diagnosticsRecorder = createDiagnosticsRecorder(options);
    const stateDefinitions = normalizeStateDefinitions(options.states || options.state);
    const selectorDefinitions = normalizeSelectorDefinitions(options.selectors);
    const derivedDefinitions = normalizeDerivedDefinitions(options.derive || options.derived);
    const reducers = normalizeReducerDefinitions(options.reducers || options.commands);
    const xstateBridge = createRmtXStateBridge({ xstate: options.xstate });
    const listeners = new Set();
    const stateDefinitionMap = new Map(stateDefinitions.map((state) => [state.id, state]));
    const selectorDefinitionMap = new Map(selectorDefinitions.map((selector) => [selector.id, selector]));
    const derivedDefinitionMap = new Map(derivedDefinitions.map((entry) => [entry.id, entry]));
    const preserveStates = new Set(stateDefinitions.filter((state) => state.preserve === 'attribute-sync' || state.preserve === 'component-state').map((state) => state.id));
    const stateValues = {};

    stateDefinitions.forEach((state) => {
      const externalValue = xstateBridge.get(state.xstateKey, undefined);
      const initialValue = typeof externalValue === 'undefined'
        ? cloneValue((options.initialState && Object.prototype.hasOwnProperty.call(options.initialState, state.id)) ? options.initialState[state.id] : state.initial, null)
        : cloneValue(externalValue, externalValue);
      if (!validateTypedValue(state, initialValue)) {
        diagnosticsRecorder.publish(createDiagnostic('rmt.state.type.invalid', `State ${state.id} passt nicht zum Typ ${state.type}.`, { state: state.id, type: state.type }));
      }
      stateValues[state.id] = initialValue;
    });

    function evaluateSelectors() {
      const selectorValues = {};
      selectorDefinitions.forEach((selector) => {
        const context = createEvaluationContext(stateValues, selectorValues, {}, {}, {});
        const source = resolveReference(selector.from, context);
        selectorValues[selector.id] = applySelectorOperations(source, selector, context);
      });
      return selectorValues;
    }

    function evaluateDerivedValues(selectorValues = evaluateSelectors()) {
      const derivedValues = {};
      derivedDefinitions.forEach((entry) => {
        const context = createEvaluationContext(stateValues, selectorValues, derivedValues, {}, {});
        derivedValues[entry.id] = evaluateDerived(entry, context);
      });
      return derivedValues;
    }

    function snapshot() {
      const selectors = evaluateSelectors();
      const derived = evaluateDerivedValues(selectors);
      return {
        schema: 'xtend.epic18.rmt-state-selector-snapshot.v1',
        states: cloneValue(stateValues, {}),
        selectors: cloneValue(selectors, {}),
        derived: cloneValue(derived, {}),
        model: buildRenderModel(stateValues, selectors, derived)
      };
    }

    function notify(previousSnapshot, metadata = {}) {
      const nextSnapshot = snapshot();
      const patchPlan = planRmtStatePatch(previousSnapshot, nextSnapshot, {
        selectors: selectorDefinitions,
        derived: derivedDefinitions,
        preserveStates
      });
      xstateBridge.mirrorSnapshot(nextSnapshot, metadata);
      const event = Object.freeze({
        schema: 'xtend.epic18.rmt-state-change.v1',
        previous: previousSnapshot,
        next: nextSnapshot,
        patchPlan,
        metadata: cloneValue(metadata, {})
      });
      listeners.forEach((listener) => listener(event));
      return event;
    }

    function setState(id, value, metadata = {}) {
      const stateId = clampString(id);
      const definition = stateDefinitionMap.get(stateId);
      if (!definition) {
        throw new Error(`RMT State ${stateId} ist nicht definiert.`);
      }
      if (!validateTypedValue(definition, value)) {
        throw new Error(`RMT State ${stateId} erwartet Typ ${definition.type}.`);
      }
      const previousSnapshot = snapshot();
      stateValues[stateId] = cloneValue(value, value);
      xstateBridge.set(definition.xstateKey, stateValues[stateId], metadata);
      return notify(previousSnapshot, { operation: 'setState', state: stateId, ...metadata });
    }

    function patchState(id, patch, metadata = {}) {
      const stateId = clampString(id);
      const current = objectRecord(stateValues[stateId]);
      return setState(stateId, {
        ...cloneValue(current, {}),
        ...objectRecord(patch)
      }, { operation: 'patchState', state: stateId, ...metadata });
    }

    function dispatch(commandId, payload = {}, metadata = {}) {
      const command = clampString(commandId);
      const reducer = reducers.find((entry) => entry.command === command || entry.id === command);
      if (!reducer) throw new Error(`RMT Reducer ${command} ist nicht definiert.`);
      const current = stateValues[reducer.state];
      const context = createEvaluationContext(stateValues, evaluateSelectors(), evaluateDerivedValues(), payload, {});
      if (reducer.set) {
        return setState(reducer.state, resolveReference(reducer.set, context), { operation: 'dispatch', command, ...metadata });
      }
      if (reducer.patch) {
        const patch = {};
        Object.entries(objectRecord(reducer.patch)).forEach(([key, value]) => {
          patch[key] = resolveReference(value, context);
        });
        return patchState(reducer.state, patch, { operation: 'dispatch', command, ...metadata });
      }
      if (reducer.toggle) {
        const next = cloneValue(objectRecord(current), {});
        const path = clampString(reducer.toggle);
        writePath(next, path, !readPath(next, path));
        return setState(reducer.state, next, { operation: 'dispatch', command, ...metadata });
      }
      return setState(reducer.state, cloneValue(payload, payload), { operation: 'dispatch', command, ...metadata });
    }

    function select(selectorId, params = {}) {
      const id = clampString(selectorId);
      if (!selectorDefinitionMap.has(id)) throw new Error(`RMT Selector ${id} ist nicht definiert.`);
      const selectorValues = evaluateSelectors();
      if (!Object.keys(params).length) return selectorValues[id];
      const selector = selectorDefinitionMap.get(id);
      const context = createEvaluationContext(stateValues, selectorValues, evaluateDerivedValues(selectorValues), {}, params);
      return applySelectorOperations(resolveReference(selector.from, context), selector, context);
    }

    const initialSnapshot = snapshot();
    xstateBridge.mirrorSnapshot(initialSnapshot, { operation: 'init' });

    return Object.freeze({
      schema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
      stateDefinitions: stateDefinitions.slice(),
      selectorDefinitions: selectorDefinitions.slice(),
      derivedDefinitions: derivedDefinitions.slice(),
      reducers: reducers.slice(),
      getState(id) {
        return cloneValue(stateValues[clampString(id)], stateValues[clampString(id)]);
      },
      setState,
      patchState,
      dispatch,
      select,
      getSelectorValues() {
        return cloneValue(evaluateSelectors(), {});
      },
      getDerivedValues() {
        return cloneValue(evaluateDerivedValues(), {});
      },
      getRenderModel() {
        const current = snapshot();
        return current.model;
      },
      createRenderContext(extra = {}) {
        const current = snapshot();
        return {
          ...extra,
          model: {
            ...(extra.model || {}),
            ...current.model
          },
          selectors: new Map(selectorDefinitions.map((selector) => [selector.id, selector])),
          selectorValues: current.selectors
        };
      },
      resolve(expression, item, payload = {}, params = {}) {
        const selectors = evaluateSelectors();
        return resolveReference(expression, createEvaluationContext(stateValues, selectors, evaluateDerivedValues(selectors), payload, params), item);
      },
      snapshot,
      planPatch(previousSnapshot, nextSnapshot) {
        return planRmtStatePatch(previousSnapshot, nextSnapshot, {
          selectors: selectorDefinitions,
          derived: derivedDefinitions,
          preserveStates
        });
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      connectXState(target) {
        return createRmtXStateBridge({ xstate: target });
      },
      xstateBridge,
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    });
  }

  function setClassToken(element, token, enabled) {
    const current = String((element.getAttribute && element.getAttribute('class')) || '').split(/\s+/u).filter(Boolean);
    const next = new Set(current);
    if (enabled) next.add(token);
    else next.delete(token);
    if (element.setAttribute) element.setAttribute('class', [...next].join(' '));
  }

  function applyRmtStateBindings(root, bindings, runtime, options = {}) {
    const operations = [];
    toArray(bindings).forEach((binding) => {
      const source = runtime.resolve(binding.source);
      const items = Array.isArray(source) ? source : [source];
      items.filter((item) => item != null).forEach((item) => {
        const keyPath = clampString(binding.key || (binding.target && binding.target.key), 'id');
        const key = String(readPath(item, keyPath));
        const targetAttribute = clampString(binding.target && (binding.target.attribute || binding.target.byKeyAttribute), 'data-rmt-key');
        const selector = `[${targetAttribute}="${key}"]`;
        const element = root && typeof root.querySelector === 'function' ? root.querySelector(selector) : null;
        if (!element) return;
        Object.entries(objectRecord(binding.attributes)).forEach(([name, expression]) => {
          const normalizedName = clampString(name);
          const value = typeof expression === 'object'
            ? evaluateRule(expression, createEvaluationContext(runtime.snapshot().states, runtime.getSelectorValues(), runtime.getDerivedValues(), {}, {}), item)
            : runtime.resolve(expression, item);
          if (!isSafeAttributeName(normalizedName) || (URL_ATTRIBUTE_NAMES.has(normalizedName.toLowerCase()) && !isSafeUrl(value))) {
            operations.push({ binding: binding.id, target: key, kind: 'attribute', name: normalizedName, value, skipped: true, reason: 'unsafe' });
            return;
          }
          if (value == null || (value === false && !String(normalizedName).startsWith('aria-'))) {
            if (element.removeAttribute) element.removeAttribute(normalizedName);
          } else if (element.setAttribute) {
            element.setAttribute(normalizedName, value === true ? 'true' : String(value));
          }
          operations.push({ binding: binding.id, target: key, kind: 'attribute', name: normalizedName, value });
        });
        Object.entries(objectRecord(binding.classes)).forEach(([token, expression]) => {
          const enabled = typeof expression === 'object'
            ? evaluateRule(expression, createEvaluationContext(runtime.snapshot().states, runtime.getSelectorValues(), runtime.getDerivedValues(), {}, {}), item)
            : !!runtime.resolve(expression, item);
          setClassToken(element, token, enabled);
          operations.push({ binding: binding.id, target: key, kind: 'class', name: token, value: enabled });
        });
        Object.entries(objectRecord(binding.properties)).forEach(([name, expression]) => {
          const normalizedName = clampString(name);
          const value = runtime.resolve(expression, item);
          if (!isSafePropertyName(normalizedName)) {
            operations.push({ binding: binding.id, target: key, kind: 'property', name: normalizedName, value, skipped: true, reason: 'unsafe' });
            return;
          }
          element[normalizedName] = value;
          operations.push({ binding: binding.id, target: key, kind: 'property', name: normalizedName, value: element[normalizedName] });
        });
      });
    });
    return {
      schema: 'xtend.epic18.rmt-state-binding-application.v1',
      strategy: options.strategy || 'attribute-sync',
      replacedRoot: false,
      operationCount: operations.length,
      operations
    };
  }

  function createRmtStateBindingAdapter(options = {}) {
    return Object.freeze({
      schema: RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
      apply(root, bindings, runtime) {
        return applyRmtStateBindings(root, bindings, runtime, options);
      }
    });
  }

  const api = {
    RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA,
    RMT_STATE_SELECTOR_RUNTIME_SCHEMA,
    applyRmtStateBindings,
    createRmtStateBindingAdapter,
    createRmtStateSelectorRuntime,
    createRmtXStateBridge,
    planRmtStatePatch
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtStateSelectorRuntime = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__ = globalThis.XTendRmtStateSelectorRuntime;

export const RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA = __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__.RMT_STATE_SELECTOR_DIAGNOSTIC_SCHEMA;
export const RMT_STATE_SELECTOR_RUNTIME_SCHEMA = __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__.RMT_STATE_SELECTOR_RUNTIME_SCHEMA;
export const applyRmtStateBindings = __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__.applyRmtStateBindings;
export const createRmtStateBindingAdapter = __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__.createRmtStateBindingAdapter;
export const createRmtStateSelectorRuntime = __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__.createRmtStateSelectorRuntime;
export const createRmtXStateBridge = __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__.createRmtXStateBridge;
export const planRmtStatePatch = __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__.planRmtStatePatch;

export default __XTEND_RMT_STATE_SELECTOR_RUNTIME_API__;

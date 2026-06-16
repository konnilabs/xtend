(function attachRmtDomDescriptorRenderer(globalTarget) {
  const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA = 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
  const RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-dom-renderer-diagnostic.v1';
  const TRUSTED_DOM_BOUNDARY = 'xtend.rmt.trusted-dom-boundary.explicit';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.dom_descriptor';
  const SAFE_TAG_NAME = /^[a-z][a-z0-9.-]*$/u;
  const URL_ATTRIBUTE_NAMES = new Set(['href', 'src', 'action', 'formaction', 'poster']);
  const BLOCKED_ATTRIBUTE_NAMES = new Set(['srcdoc']);
  const BLOCKED_PROPERTY_NAMES = new Set(['innerHTML', 'outerHTML', 'insertAdjacentHTML']);
  const EXPLICIT_FALSE_ATTRIBUTE_NAMES = new Set(['collapsible', 'collapsable', 'closable', 'pinnable']);
  const MANUAL_HTML_PATTERNS = Object.freeze([
    { id: 'root.innerHTML', pattern: /\broot\s*\.\s*innerHTML\s*=/u },
    { id: 'element.innerHTML', pattern: /\belement\s*\.\s*innerHTML\s*=/u },
    { id: 'template.innerHTML', pattern: /\btemplate\s*\.\s*innerHTML\s*=/u },
    { id: 'any.innerHTML', pattern: /\.\s*innerHTML\s*=/u },
    { id: 'outerHTML', pattern: /\.\s*outerHTML\s*=/u },
    { id: 'insertAdjacentHTML', pattern: /\.\s*insertAdjacentHTML\s*\(/u },
    { id: 'document.write', pattern: /\bdocument\s*\.\s*write\s*\(/u },
    { id: 'createContextualFragment', pattern: /\bcreateContextualFragment\s*\(/u }
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

  function isNodeLike(value) {
    return !!value && typeof value === 'object' && (
      typeof value.nodeType === 'number'
      || typeof value.appendChild === 'function'
      || typeof value.replaceChildren === 'function'
    );
  }

  function isAriaAttribute(name) {
    return clampString(name).toLowerCase().startsWith('aria-');
  }

  function resolveDocumentTarget(deps = {}) {
    if (deps.documentTarget && typeof deps.documentTarget.createElement === 'function') {
      return deps.documentTarget;
    }
    const globalDocument = globalTarget && globalTarget.document;
    if (globalDocument && typeof globalDocument.createElement === 'function') {
      return globalDocument;
    }
    throw new Error('RMT DOM Descriptor Renderer benoetigt ein documentTarget mit createElement().');
  }

  function createDiagnosticsRecorder(deps = {}) {
    const diagnostics = [];
    const diagnosticsHub = deps.diagnosticsHub || null;
    const channel = clampString(deps.diagnosticChannel, DEFAULT_DIAGNOSTIC_CHANNEL);

    function publish(diagnostic) {
      diagnostics.push(diagnostic);
      if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
        diagnosticsHub.publish(channel, diagnostic, {
          schema: RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA
        });
      }
      return diagnostic;
    }

    return {
      diagnostics,
      publish
    };
  }

  function safeSource(source = {}) {
    return {
      documentId: clampString(source.documentId, ''),
      templateId: clampString(source.templateId, ''),
      nodeId: clampString(source.nodeId, ''),
      pointer: clampString(source.pointer, ''),
      line: Number.isFinite(source.line) ? source.line : null,
      column: Number.isFinite(source.column) ? source.column : null
    };
  }

  function createDiagnostic(code, message, descriptor = {}, context = {}, severity = 'error') {
    return {
      schema: RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA,
      code,
      message,
      severity,
      source: safeSource({
        ...(context.source || {}),
        ...(descriptor.source || {}),
        templateId: descriptor.templateId || (descriptor.source && descriptor.source.templateId) || (context.source && context.source.templateId),
        nodeId: descriptor.id || descriptor.nodeId || (context.source && context.source.nodeId),
        pointer: descriptor.pointer || (descriptor.source && descriptor.source.pointer) || (context.source && context.source.pointer)
      })
    };
  }

  function createRendererError(code, message, descriptor = {}, context = {}) {
    const diagnostic = createDiagnostic(code, message, descriptor, context);
    const error = new Error(message);
    error.code = code;
    error.diagnostic = diagnostic;
    return error;
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

  function createText(documentTarget, value) {
    if (typeof documentTarget.createTextNode === 'function') {
      return documentTarget.createTextNode(String(value == null ? '' : value));
    }
    return {
      nodeType: 3,
      textContent: String(value == null ? '' : value),
      parentNode: null
    };
  }

  function createFragment(documentTarget) {
    if (typeof documentTarget.createDocumentFragment === 'function') {
      return documentTarget.createDocumentFragment();
    }
    const fragment = {
      nodeType: 11,
      childNodes: [],
      appendChild(child) {
        this.childNodes.push(child);
        child.parentNode = this;
        return child;
      }
    };
    return fragment;
  }

  function appendNodes(parent, nodes) {
    toArray(nodes).forEach((node) => {
      if (node && typeof parent.appendChild === 'function') {
        parent.appendChild(node);
      }
    });
  }

  function childContainerFor(element) {
    return element && elementTagName(element) === 'template' && element.content
      ? element.content
      : element;
  }

  function elementTagName(element) {
    return clampString(
      element && (element.localName || element.tagName || element.nodeName),
      ''
    ).toLowerCase();
  }

  function descriptorTagName(descriptor, context) {
    if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) return '';
    const nodeType = clampString(
      descriptor.type || (descriptor.component ? 'component' : descriptor.tag ? 'element' : descriptor.template ? 'template' : 'fragment'),
      'fragment'
    );
    if (nodeType === 'component') return clampString(resolveComponent(descriptor, context).tag, '').toLowerCase();
    if (nodeType === 'element') return clampString(descriptor.tag, 'div').toLowerCase();
    if (nodeType === 'text') return '#text';
    return '';
  }

  function canPatchExistingChild(existing, descriptor, context) {
    const nextTag = descriptorTagName(descriptor, context);
    if (!nextTag) return false;
    if (nextTag === '#text') return existing && existing.nodeType === 3;
    return existing && existing.nodeType === 1 && elementTagName(existing) === nextTag;
  }

  function patchExistingChild(existing, descriptor, context) {
    if (descriptorTagName(descriptor, context) === '#text') {
      existing.textContent = String(resolveValue(descriptor.text, context, context.item) == null ? '' : resolveValue(descriptor.text, context, context.item));
      return existing;
    }
    return patchExistingElement(existing, descriptor, context);
  }

  function replaceChildren(parent, nodes) {
    const normalizedNodes = toArray(nodes).filter(Boolean);
    if (typeof parent.replaceChildren === 'function') {
      parent.replaceChildren(...normalizedNodes);
      return normalizedNodes;
    }
    while (parent.firstChild && typeof parent.removeChild === 'function') {
      parent.removeChild(parent.firstChild);
    }
    if (Array.isArray(parent.childNodes)) {
      parent.childNodes.slice().forEach((child) => {
        if (typeof parent.removeChild === 'function') {
          parent.removeChild(child);
        }
      });
      if (!parent.removeChild) parent.childNodes = [];
    }
    appendNodes(parent, normalizedNodes);
    return normalizedNodes;
  }

  function setAttributeSafe(element, name, value, descriptor, context) {
    const normalizedName = clampString(name);
    if (!isSafeAttributeName(normalizedName)) {
      throw createRendererError('rmt.dom.attribute.unsafe', `Unsicheres Attribut ${normalizedName}`, descriptor, context);
    }
    const resolvedValue = resolveValue(value, context, context.item);
    if (URL_ATTRIBUTE_NAMES.has(normalizedName.toLowerCase()) && !isSafeUrl(resolvedValue)) {
      throw createRendererError('rmt.dom.attribute.url-unsafe', `Unsichere URL fuer Attribut ${normalizedName}`, descriptor, context);
    }
    if (typeof resolvedValue === 'boolean' && isAriaAttribute(normalizedName)) {
      if (typeof element.setAttribute === 'function') element.setAttribute(normalizedName, String(resolvedValue));
      return;
    }
    if (resolvedValue === false && EXPLICIT_FALSE_ATTRIBUTE_NAMES.has(normalizedName.toLowerCase())) {
      if (typeof element.setAttribute === 'function') element.setAttribute(normalizedName, 'false');
      return;
    }
    if (resolvedValue === false || resolvedValue === null || typeof resolvedValue === 'undefined') {
      if (typeof element.removeAttribute === 'function') element.removeAttribute(normalizedName);
      if (normalizedName === 'hidden' && element.style && element.getAttribute && element.getAttribute('data-rmt-hidden-display') === 'true') {
        element.style.display = '';
        if (typeof element.removeAttribute === 'function') element.removeAttribute('data-rmt-hidden-display');
      }
      return;
    }
    if (typeof element.setAttribute === 'function') {
      element.setAttribute(normalizedName, resolvedValue === true ? '' : String(resolvedValue));
      if (normalizedName === 'hidden' && element.style) {
        element.style.display = 'none';
        element.setAttribute('data-rmt-hidden-display', 'true');
      }
    }
  }

  function applyStyleObject(element, styleRecord, descriptor, context) {
    if (!styleRecord || typeof styleRecord !== 'object' || Array.isArray(styleRecord)) {
      throw createRendererError('rmt.dom.style.invalid', 'Style darf nur als strukturiertes Objekt gesetzt werden.', descriptor, context);
    }
    Object.entries(styleRecord).forEach(([name, value]) => {
      const normalizedName = clampString(name);
      if (!/^(--[a-z0-9-]+|[a-z][a-z0-9-]*)$/u.test(normalizedName)) {
        throw createRendererError('rmt.dom.style.unsafe-name', `Unsicherer Style-Name ${normalizedName}`, descriptor, context);
      }
      if (element.style && typeof element.style.setProperty === 'function') {
        element.style.setProperty(normalizedName, String(resolveValue(value, context, context.item) == null ? '' : resolveValue(value, context, context.item)));
      } else if (element.style && typeof element.style === 'object') {
        element.style[normalizedName] = String(resolveValue(value, context, context.item) == null ? '' : resolveValue(value, context, context.item));
      } else {
        setAttributeSafe(element, `data-style-${normalizedName.replace(/^--/u, '')}`, value, descriptor, context);
      }
    });
  }

  function normalizeClassTokens(value, context, item) {
    if (!value) return [];
    if (typeof value === 'string') {
      const resolved = resolveValue(value, context, item);
      return String(resolved == null ? '' : resolved).split(/\s+/u).filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value.flatMap((entry) => normalizeClassTokens(entry, context, item));
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .filter(([, enabled]) => !!resolveValue(enabled, context, item))
        .map(([className]) => className);
    }
    return [];
  }

  function applyClassPrimitive(element, descriptor, context) {
    const tokens = [
      ...normalizeClassTokens(descriptor.class, context, context.item),
      ...normalizeClassTokens(descriptor.className, context, context.item),
      ...normalizeClassTokens(descriptor.classes, context, context.item)
    ].filter((token, index, allTokens) => allTokens.indexOf(token) === index);
    if (!tokens.length) return;
    tokens.forEach((token) => {
      if (!/^-?[_a-zA-Z]+[_a-zA-Z0-9-:]*$/u.test(token)) {
        throw createRendererError('rmt.dom.class.unsafe', `Unsichere Klasse ${token}`, descriptor, context);
      }
    });
    setAttributeSafe(element, 'class', tokens.join(' '), descriptor, context);
  }

  function normalizePartTokens(value, context, item) {
    return normalizeClassTokens(value, context, item);
  }

  function applyPartPrimitive(element, descriptor, context) {
    const tokens = [
      ...normalizePartTokens(descriptor.part, context, context.item),
      ...normalizePartTokens(descriptor.parts, context, context.item)
    ].filter((token, index, allTokens) => allTokens.indexOf(token) === index);
    if (!tokens.length) return;
    tokens.forEach((token) => {
      if (!/^[a-z][a-z0-9-]*$/u.test(token)) {
        throw createRendererError('rmt.dom.part.unsafe', `Unsicherer Part ${token}`, descriptor, context);
      }
    });
    setAttributeSafe(element, 'part', tokens.join(' '), descriptor, context);
  }

  function normalizeStyleTokenName(name) {
    const normalized = clampString(name).replace(/[A-Z]/gu, (match) => `-${match.toLowerCase()}`).toLowerCase();
    return /^[a-z][a-z0-9-]*$/u.test(normalized) ? normalized : '';
  }

  function applyStyleTokens(element, descriptor, context) {
    const tokens = {
      ...objectRecord(descriptor.styleToken),
      ...objectRecord(descriptor.styleTokens),
      ...objectRecord(descriptor['style-token'])
    };
    Object.entries(tokens).forEach(([name, value]) => {
      const tokenName = normalizeStyleTokenName(name);
      if (!tokenName) {
        throw createRendererError('rmt.dom.style-token.unsafe-name', `Unsicherer Style-Token ${name}`, descriptor, context);
      }
      const resolvedValue = resolveValue(value, context, context.item);
      setAttributeSafe(element, `data-style-token-${tokenName}`, { op: 'literal', value: resolvedValue }, descriptor, context);
      if (element.style && typeof element.style.setProperty === 'function') {
        element.style.setProperty(`--xtend-${tokenName}`, String(resolvedValue == null ? '' : resolvedValue));
      }
    });
  }

  function applyRefPrimitive(element, descriptor, context) {
    const ref = clampString(resolveValue(descriptor.ref || descriptor.nodeRef, context, context.item));
    if (!ref) return;
    if (!/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u.test(ref)) {
      throw createRendererError('rmt.dom.ref.unsafe', `Unsichere Ref ${ref}`, descriptor, context);
    }
    setAttributeSafe(element, 'data-rmt-ref', ref, descriptor, context);
    if (context.refs && typeof context.refs.set === 'function') {
      context.refs.set(ref, element);
    }
  }

  function applyAttributes(element, attributes, descriptor, context) {
    Object.entries(attributes || {}).forEach(([name, value]) => {
      if (name === 'style') {
        applyStyleObject(element, value, descriptor, context);
        return;
      }
      setAttributeSafe(element, name, value, descriptor, context);
    });
  }

  function applyProperties(element, properties, descriptor, context) {
    Object.entries(properties || {}).forEach(([name, value]) => {
      const normalizedName = clampString(name);
      if (!isSafePropertyName(normalizedName)) {
        throw createRendererError('rmt.dom.property.unsafe', `Unsichere Property ${normalizedName}`, descriptor, context);
      }
      const resolvedValue = resolveValue(value, context, context.item);
      try {
        element[normalizedName] = resolvedValue;
      } catch (_) {
        setAttributeSafe(element, normalizedName, resolvedValue, descriptor, context);
      }
      if (typeof resolvedValue === 'string' || typeof resolvedValue === 'number' || typeof resolvedValue === 'boolean') {
        setAttributeSafe(element, normalizedName, resolvedValue, descriptor, context);
      }
    });
  }

  function applyEvents(element, events, descriptor, context) {
    Object.entries(events || {}).forEach(([eventName, actionId]) => {
      const normalizedEvent = clampString(eventName);
      if (!normalizedEvent || normalizedEvent.toLowerCase().startsWith('on')) {
        throw createRendererError('rmt.dom.event.unsafe', `Unsicherer Event-Name ${normalizedEvent}`, descriptor, context);
      }
      if (typeof element.addEventListener !== 'function') return;
      element.addEventListener(normalizedEvent, (event) => {
        if (typeof context.dispatchEvent === 'function') {
          context.dispatchEvent({
            id: actionId,
            eventName: normalizedEvent,
            nativeEvent: event,
            source: descriptor.id || descriptor.component || descriptor.tag || ''
          });
        }
      });
    });
  }

  function normalizePathSegments(path) {
    return String(path || '')
      .replace(/\[([0-9]+)\]/gu, '.$1')
      .split('.')
      .filter(Boolean);
  }

  function readPath(model, path) {
    const expression = clampString(path, '');
    const record = objectRecord(model);
    if (Object.prototype.hasOwnProperty.call(record, expression)) return record[expression];
    const ownerKey = Object.keys(record)
      .filter((key) => expression.startsWith(`${key}.`))
      .sort((left, right) => right.length - left.length)[0];
    const parts = normalizePathSegments(ownerKey ? expression.slice(ownerKey.length + 1) : expression);
    if (!ownerKey && parts.length === 0) return undefined;
    let cursor = ownerKey ? record[ownerKey] : model;
    for (const part of parts) {
      if (cursor == null) return undefined;
      if (part === 'length' && (Array.isArray(cursor) || typeof cursor === 'string')) return cursor.length;
      cursor = cursor[part];
    }
    return cursor;
  }

  function isEmptyValue(value) {
    return value === null || typeof value === 'undefined' || value === '';
  }

  function applyFallback(value, fallback, context, item) {
    return isEmptyValue(value) && typeof fallback !== 'undefined'
      ? resolveValue(fallback, context, item)
      : value;
  }

  function compareValues(left, right, op, options = {}) {
    const normalizedOp = clampString(op, 'equals');
    if ((right === '' || right == null) && options.empty === 'pass') return true;
    if (normalizedOp === 'equals' || normalizedOp === 'eq') return left === right;
    if (normalizedOp === 'not-equals' || normalizedOp === 'neq') return left !== right;
    if (normalizedOp === 'truthy') return !!left;
    if (normalizedOp === 'falsy') return !left;
    if (normalizedOp === 'gt') return Number(left) > Number(right);
    if (normalizedOp === 'gte') return Number(left) >= Number(right);
    if (normalizedOp === 'lt') return Number(left) < Number(right);
    if (normalizedOp === 'lte') return Number(left) <= Number(right);
    if (normalizedOp === 'in') return Array.isArray(right) && right.includes(left);
    if (normalizedOp === 'includes' || normalizedOp === 'contains') {
      if (Array.isArray(left)) return left.includes(right);
      const leftText = String(left == null ? '' : left);
      const rightText = String(right == null ? '' : right);
      return options.ignoreCase ? leftText.toLowerCase().includes(rightText.toLowerCase()) : leftText.includes(rightText);
    }
    return left === right;
  }

  function evaluateRule(rule, context, item) {
    if (typeof rule === 'string') return !!resolveValue(rule, context, item);
    const record = objectRecord(rule);
    const left = record.left
      ? resolveValue(record.left, context, item)
      : readPath(item, record.path || record.field || '');
    const right = Object.prototype.hasOwnProperty.call(record, 'right')
      ? resolveValue(record.right, context, item)
      : resolveValue(record.value, context, item);
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

  function resolvePathExpression(path, context, item) {
    const expression = clampString(path, '');
    if (!expression) return undefined;
    if (expression === '$item') return item;
    if (expression.startsWith('$item.')) return readPath(item, expression.slice(6));
    if (expression === '$event') return context.event;
    if (expression.startsWith('$event.')) return readPath(context.event, expression.slice(7));
    if (expression === '$target') return context.target;
    if (expression.startsWith('$target.')) return readPath(context.target, expression.slice(8));
    if (expression === '$currentTarget') return context.currentTarget;
    if (expression.startsWith('$currentTarget.')) return readPath(context.currentTarget, expression.slice(15));
    if (expression.startsWith('$selector.')) {
      const selectorKey = `selector.${expression.slice(10)}`;
      if (context.selectorValues && Object.prototype.hasOwnProperty.call(context.selectorValues, selectorKey)) return context.selectorValues[selectorKey];
      return readPath(context.model, selectorKey);
    }
    if (expression.startsWith('selector.') && context.selectorValues && Object.prototype.hasOwnProperty.call(context.selectorValues, expression)) {
      return context.selectorValues[expression];
    }
    if (expression.startsWith('$derive.')) {
      const deriveKey = `derive.${expression.slice(8)}`;
      return readPath(context.model, deriveKey);
    }
    if (expression.startsWith('$state.')) return readPath(context.model, expression.slice(7));
    if (expression.startsWith('$model.')) return readPath(context.model, expression.slice(7));
    if (Object.prototype.hasOwnProperty.call(context.model || {}, expression)) return context.model[expression];
    return readPath(context.model, expression);
  }

  function interpolateString(value, context, item) {
    return String(value).replace(/\$\{([^}]+)\}/gu, (_, expression) => {
      const normalized = clampString(expression, '');
      const resolved = resolveValue(normalized.startsWith('$') ? normalized : `$${normalized}`, context, item);
      return String(resolved == null ? '' : resolved);
    });
  }

  function evaluateExpression(record, context, item) {
    const op = clampString(record.op || record.operator || record.kind || record.format, '');
    const hasValue = Object.prototype.hasOwnProperty.call(record, 'value') || Object.prototype.hasOwnProperty.call(record, 'from') || Object.prototype.hasOwnProperty.call(record, 'source');
    const sourceExpression = Object.prototype.hasOwnProperty.call(record, 'value')
      ? record.value
      : (Object.prototype.hasOwnProperty.call(record, 'from') ? record.from : record.source);
    const source = hasValue ? resolveValue(sourceExpression, context, item) : (record.path ? resolvePathExpression(record.path, context, item) : undefined);
    let result;

    switch (op) {
      case 'literal':
      case 'const':
      case 'static':
        result = Object.prototype.hasOwnProperty.call(record, 'value') ? record.value : record.source;
        break;
      case '':
      case 'path':
        result = record.path ? resolvePathExpression(record.path, context, item) : source;
        break;
      case 'fallback':
        result = applyFallback(source, record.fallback, context, item);
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
        const search = resolveValue(record.search, context, item);
        const replacement = resolveValue(record.replacement, context, item);
        result = String(source == null ? '' : source).replace(new RegExp(String(search == null ? '' : search), record.flags || 'gu'), String(replacement == null ? '' : replacement));
        break;
      }
      case 'concat':
      case 'interpolate':
        result = toArray(record.values || record.parts || source).map((entry) => resolveValue(entry, context, item)).join(record.separator || '');
        break;
      case 'slice':
        result = Array.isArray(source) || typeof source === 'string'
          ? source.slice(Number(resolveValue(record.start || 0, context, item)), typeof record.end === 'undefined' ? undefined : Number(resolveValue(record.end, context, item)))
          : [];
        break;
      case 'contains':
      case 'includes':
        result = compareValues(source, resolveValue(record.search || record.item || record.right, context, item), 'contains', record);
        break;
      case 'equals':
      case 'eq':
        result = compareValues(
          Object.prototype.hasOwnProperty.call(record, 'left') ? resolveValue(record.left, context, item) : source,
          Object.prototype.hasOwnProperty.call(record, 'right') ? resolveValue(record.right, context, item) : resolveValue(record.value, context, item),
          'equals',
          record
        );
        break;
      case 'not-equals':
      case 'neq':
        result = compareValues(
          Object.prototype.hasOwnProperty.call(record, 'left') ? resolveValue(record.left, context, item) : source,
          Object.prototype.hasOwnProperty.call(record, 'right') ? resolveValue(record.right, context, item) : resolveValue(record.value, context, item),
          'not-equals',
          record
        );
        break;
      case 'truthy':
        result = !!source;
        break;
      case 'falsy':
        result = !source;
        break;
      case 'not':
        result = !source;
        break;
      case 'if':
      case 'ternary':
        result = resolveValue(record.test || record.when || record.condition, context, item)
          ? resolveValue(record.then, context, item)
          : resolveValue(record.else || record.fallback, context, item);
        break;
      case 'map':
        result = Array.isArray(source)
          ? source.map((entry) => record.path ? readPath(entry, record.path) : resolveValue(record.expression || '$item', { ...context, item: entry }, entry))
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
            const key = clampString(record.path ? readPath(entry, record.path) : resolveValue(record.key || '$item', { ...context, item: entry }, entry), 'unknown');
            result[key] = (result[key] || 0) + 1;
          });
        }
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
      default:
        result = hasValue ? source : record;
        break;
    }

    return applyFallback(result, record.fallback, context, item);
  }

  function isExpressionRecord(record) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
    return [
      'op',
      'operator',
      'format'
    ].some((key) => Object.prototype.hasOwnProperty.call(record, key));
  }

  function resolvePayloadValue(value, context, item) {
    if (Array.isArray(value)) return value.map((entry) => resolvePayloadValue(entry, context, item));
    if (value && typeof value === 'object' && !isNodeLike(value)) {
      if (isExpressionRecord(value)) return evaluateExpression(value, context, item);
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, resolvePayloadValue(entry, context, item)])
      );
    }
    return resolveValue(value, context, item);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId(prefix) {
    return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalizeCommandSpec(spec, descriptor) {
    if (typeof spec === 'string') {
      return {
        command: spec,
        event: 'click',
        payload: descriptor.payload
      };
    }
    const record = objectRecord(spec);
    return {
      command: clampString(record.command || record.id || record.action || record.name, ''),
      event: clampString(record.event || record.trigger, 'click'),
      payload: Object.prototype.hasOwnProperty.call(record, 'payload') ? record.payload : descriptor.payload,
      preventDefault: Object.prototype.hasOwnProperty.call(record, 'preventDefault') ? Boolean(record.preventDefault) : true,
      stopPropagation: Boolean(record.stopPropagation),
      lane: record.lane,
      target: record.target,
      source: record.source
    };
  }

  function defaultCommandPayload(event) {
    const target = event && event.target || {};
    return {
      value: target.value,
      checked: target.checked,
      id: target.id || '',
      label: target.dataset && target.dataset.label || '',
      action: target.dataset && target.dataset.action || '',
      dataset: target.dataset ? { ...target.dataset } : {}
    };
  }

  function createCommandEventDetail(spec, descriptor, context, event, element) {
    const commandContext = {
      ...context,
      event,
      target: event && event.target || element,
      currentTarget: event && event.currentTarget || element
    };
    const payload = typeof spec.payload === 'undefined'
      ? defaultCommandPayload(event)
      : resolvePayloadValue(spec.payload, commandContext, commandContext.item);
    const sourceRecord = objectRecord(resolveValue(spec.source, commandContext, commandContext.item));
    const source = {
      kind: sourceRecord.kind || 'descriptor',
      id: sourceRecord.id || descriptor.id || descriptor.component || descriptor.tag || '',
      event: event && event.type || spec.event,
      surfaceId: sourceRecord.surfaceId || descriptor.surface || ''
    };
    return {
      schema: 'xtend.rmt.command.v1',
      id: randomId('rmt.command'),
      source,
      command: spec.command,
      payload,
      target: resolveValue(spec.target, commandContext, commandContext.item) || descriptor.surface || null,
      correlationId: randomId('rmt.correlation'),
      lane: resolveValue(spec.lane, commandContext, commandContext.item) || 'user',
      timestamp: nowIso()
    };
  }

  function applyImmediateCommandState(element) {
    if (!element || typeof element.getAttribute !== 'function' || typeof element.setAttribute !== 'function') return;
    const role = element.getAttribute('role');
    if (role !== 'menuitemradio') return;
    const parent = element.parentElement || element.parentNode || null;
    if (parent && typeof parent.querySelectorAll === 'function') {
      Array.from(parent.querySelectorAll('[role="menuitemradio"]')).forEach((entry) => {
        if (entry && typeof entry.setAttribute === 'function') entry.setAttribute('aria-checked', 'false');
      });
    }
    element.setAttribute('aria-checked', 'true');
  }

  function applyCommand(element, descriptor, context) {
    const commandSpecs = toArray(descriptor.commands || descriptor.command)
      .map((spec) => normalizeCommandSpec(spec, descriptor))
      .filter((spec) => spec.command && spec.event);
    element.__rmtCommandSpecs = commandSpecs;
    element.__rmtCommandDescriptor = descriptor;
    element.__rmtCommandContext = context;
    if (!commandSpecs.length || typeof element.addEventListener !== 'function') return;
    if (!element.__rmtCommandListeners) element.__rmtCommandListeners = new Set();
    [...new Set(commandSpecs.map((spec) => spec.event))].forEach((eventName) => {
      if (element.__rmtCommandListeners.has(eventName)) return;
      element.__rmtCommandListeners.add(eventName);
      element.addEventListener(eventName, (event) => {
        const activeSpecs = toArray(element.__rmtCommandSpecs).filter((spec) => spec.event === eventName);
        activeSpecs.forEach((spec) => {
          if (spec.preventDefault && typeof event.preventDefault === 'function') event.preventDefault();
          if (spec.stopPropagation && typeof event.stopPropagation === 'function') event.stopPropagation();
          applyImmediateCommandState(element);
          const detail = createCommandEventDetail(
            spec,
            element.__rmtCommandDescriptor || descriptor,
            element.__rmtCommandContext || context,
            event,
            element
          );
          if (typeof element.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
            element.dispatchEvent(new CustomEvent('xtend-command', {
              detail,
              bubbles: true,
              composed: true,
              cancelable: true
            }));
          }
        });
      });
    });
  }

  function resolveValue(value, context, item) {
    if (Array.isArray(value)) return value.map((entry) => resolveValue(entry, context, item));
    if (value && typeof value === 'object' && !isNodeLike(value)) return evaluateExpression(value, context, item);
    if (typeof value !== 'string') return value;
    if (value.includes('${')) return interpolateString(value, context, item);
    const resolved = resolvePathExpression(value, context, item);
    return typeof resolved === 'undefined' ? value : resolved;
  }

  function resolveComponent(descriptor, context) {
    const componentId = descriptor.component || descriptor.ref || descriptor.id || '';
    const component = componentId && context.components ? context.components.get(componentId) : null;
    const registry = context.componentRegistry || null;
    const requestedTag = clampString(descriptor.tag || descriptor.componentTag || (component && component.tag) || componentId, '');
    const capability = registry && typeof registry.resolveComponentCapability === 'function'
      ? registry.resolveComponentCapability(requestedTag) || registry.resolveComponentCapability(componentId)
      : null;
    const registryDescriptor = capability && typeof registry.buildComponentDescriptor === 'function'
      ? registry.buildComponentDescriptor({
          ...descriptor,
          id: descriptor.id || componentId || capability.tag,
          component: componentId || capability.tag,
          tag: descriptor.tag || capability.tag
        }, {
          source: context.source || null
        })
      : null;
    return {
      id: componentId,
      tag: clampString(descriptor.tag || (component && component.tag) || (capability && capability.tag), 'div'),
      capability,
      attributes: {
        ...objectRecord(registryDescriptor && registryDescriptor.attributes),
        ...objectRecord(component && component.attributes),
        ...(descriptor.attributes || {})
      },
      properties: {
        ...objectRecord(registryDescriptor && registryDescriptor.properties),
        ...objectRecord(component && component.properties),
        ...objectRecord(component && component.props),
        ...(descriptor.properties || descriptor.props || {})
      },
      slots: {
        ...objectRecord(component && component.slots),
        ...objectRecord(descriptor.slots)
      },
      parts: [
        ...toArray(registryDescriptor && registryDescriptor.parts),
        ...toArray(component && component.parts),
        ...toArray(descriptor.parts || descriptor.part)
      ],
      classes: [
        ...toArray(component && (component.class || component.className || component.classes)),
        ...toArray(descriptor.class || descriptor.className || descriptor.classes)
      ],
      styleTokens: {
        ...objectRecord(component && (component.styleTokens || component.styleToken || component['style-token'])),
        ...objectRecord(descriptor.styleTokens || descriptor.styleToken || descriptor['style-token'])
      },
      events: {
        ...objectRecord(registryDescriptor && registryDescriptor.events),
        ...objectRecord(component && component.events),
        ...objectRecord(descriptor.events)
      }
    };
  }

  function renderTemplate(templateId, context, item) {
    const template = context.templates ? context.templates.get(templateId) : null;
    if (!template) {
      throw createRendererError('rmt.dom.template.missing', `RMT Template ${templateId} wurde nicht gefunden.`, {
        id: templateId
      }, context);
    }
    return renderNode(template.root || template.node || template, {
      ...context,
      source: {
        ...(context.source || {}),
        templateId
      },
      item
    });
  }

  function renderSlot(slotId, context, item) {
    const slot = context.slots ? context.slots.get(slotId) : null;
    if (!slot) {
      throw createRendererError('rmt.dom.slot.missing', `RMT Slot ${slotId} wurde nicht gefunden.`, {
        id: slotId
      }, context);
    }
    return renderTemplate(slot.template, context, item);
  }

  function renderSlotContent(slotContent, context, item) {
    if (typeof slotContent === 'string') {
      return renderSlot(slotContent, context, item);
    }
    if (!slotContent || typeof slotContent !== 'object') {
      return createFragment(context.documentTarget);
    }
    if (slotContent.template) return renderTemplate(slotContent.template, context, item);
    if (slotContent.component) return renderNode({ type: 'component', ...slotContent }, context);
    if (Object.prototype.hasOwnProperty.call(slotContent, 'text')) {
      return createText(context.documentTarget, resolveValue(slotContent.text, context, item));
    }
    return renderNode(slotContent.descriptor || slotContent.node || slotContent.children || slotContent, context);
  }

  function renderTrustedHtml(descriptor, context) {
    if (descriptor.trustedBoundary !== TRUSTED_DOM_BOUNDARY) {
      throw createRendererError('rmt.dom.trusted-boundary.missing', 'Trusted HTML benoetigt die explizite Trusted-DOM-Boundary.', descriptor, context);
    }
    if (typeof context.trustedDomRenderer !== 'function') {
      throw createRendererError('rmt.dom.trusted-renderer.missing', 'Trusted HTML benoetigt einen expliziten trustedDomRenderer ausserhalb des Standard-Renderers.', descriptor, context);
    }
    const rendered = context.trustedDomRenderer(descriptor, context);
    if (!isNodeLike(rendered) && !Array.isArray(rendered)) {
      throw createRendererError('rmt.dom.trusted-renderer.invalid', 'trustedDomRenderer muss Node oder Node[] liefern.', descriptor, context);
    }
    return rendered;
  }

  function materializeChildren(element, children, context, item) {
    const target = childContainerFor(element);
    const descriptors = toArray(children);
    const existingChildren = getChildren(target);
    if (
      descriptors.length > 0
      && existingChildren.length === descriptors.length
      && descriptors.every((child, index) => canPatchExistingChild(existingChildren[index], child, { ...context, item }))
    ) {
      descriptors.forEach((child, index) => {
        patchExistingChild(existingChildren[index], child, {
          ...context,
          source: {
            ...(context.source || {}),
            pointer: `${(context.source && context.source.pointer) || ''}/children/${index}`
          },
          item
        });
      });
      return;
    }
    const rendered = [];
    descriptors.forEach((child, index) => {
      const childNodes = renderNode(child, {
        ...context,
        source: {
          ...(context.source || {}),
          pointer: `${(context.source && context.source.pointer) || ''}/children/${index}`
        },
        item
      });
      rendered.push(...toArray(childNodes));
    });
    replaceChildren(target, rendered);
  }

  function renderElement(descriptor, context) {
    const tag = clampString(descriptor.tag, 'div');
    if (!SAFE_TAG_NAME.test(tag)) {
      throw createRendererError('rmt.dom.tag.unsafe', `Unsicherer oder ungueltiger Tag ${tag}`, descriptor, context);
    }
    const element = context.documentTarget.createElement(tag);
    if (descriptor.id) setAttributeSafe(element, 'data-rmt-node', descriptor.id, descriptor, context);
    if (descriptor.key) setAttributeSafe(element, 'data-rmt-key', resolveValue(descriptor.key, context, context.item), descriptor, context);
    applyAttributes(element, descriptor.attributes || {}, descriptor, context);
    applyProperties(element, descriptor.properties || descriptor.props || {}, descriptor, context);
    applyClassPrimitive(element, descriptor, context);
    applyPartPrimitive(element, descriptor, context);
    applyStyleTokens(element, descriptor, context);
    applyRefPrimitive(element, descriptor, context);
    applyEvents(element, descriptor.events || {}, descriptor, context);
    applyCommand(element, descriptor, context);
    if (Object.prototype.hasOwnProperty.call(descriptor, 'text')) {
      appendNodes(childContainerFor(element), [createText(context.documentTarget, resolveValue(descriptor.text, context, context.item))]);
    }
    if (descriptor.children) {
      materializeChildren(element, descriptor.children, context, context.item);
    }
    return element;
  }

  function renderComponent(descriptor, context) {
    const component = resolveComponent(descriptor, context);
    const element = renderElement({
      ...descriptor,
      tag: component.tag,
      attributes: {
        'data-rmt-component': component.id,
        ...component.attributes,
        ...(descriptor.attributes || {})
      },
      properties: component.properties,
      class: component.classes,
      parts: component.parts,
      styleTokens: component.styleTokens,
      events: component.events
    }, context);
    Object.entries(component.slots || {}).forEach(([slotName, slotId]) => {
      const slotContainer = context.documentTarget.createElement('div');
      if (slotName !== 'default') setAttributeSafe(slotContainer, 'slot', slotName, descriptor, context);
      appendNodes(slotContainer, renderSlotContent(slotId, context, context.item));
      element.appendChild(slotContainer);
    });
    if (descriptor.bindings) {
      setAttributeSafe(element, 'data-rmt-bindings', toArray(descriptor.bindings).join(' '), descriptor, context);
    }
    if (context.componentRegistry && typeof context.componentRegistry.bindComponentInstance === 'function') {
      context.componentRegistry.bindComponentInstance(element, {
        tag: component.tag,
        events: component.events,
        dispatchEvent: context.dispatchEvent,
        stateBridge: context.stateBridge
      }, context.componentBindingOptions || {});
    }
    return element;
  }

  function evaluateCondition(descriptor, context) {
    const key = descriptor.test || descriptor.when;
    const explicitValue = resolveValue(key, context, context.item);
    if (typeof explicitValue === 'boolean') return explicitValue;
    if (typeof key === 'string' && key.startsWith('$') && explicitValue === key) return false;
    if (typeof key === 'string' && context.selectors && context.selectors.has(key)) {
      return !!context.selectorValues[key];
    }
    return !!explicitValue;
  }

  function resolveRepeatKey(keyExpression, context, item, index) {
    if (!keyExpression) return index;
    const expression = String(keyExpression);
    const resolved = expression.startsWith('$')
      ? resolveValue(expression, context, item)
      : resolveValue(`$item.${expression.replace(/^item\./u, '')}`, context, item);
    return resolved == null || resolved === '' ? index : resolved;
  }

  function renderRepeat(descriptor, context) {
    const sourceValue = resolveValue(descriptor.source, context, context.item);
    const items = Array.isArray(sourceValue) ? sourceValue : [];
    const fragment = createFragment(context.documentTarget);
    items.forEach((item, index) => {
      const rendered = descriptor.item
        ? renderTemplate(descriptor.item, context, item)
        : renderNode(descriptor.template || descriptor.node || descriptor.children || { type: 'text', text: '$item' }, {
            ...context,
            item
          });
      toArray(rendered).forEach((node) => {
        if (node && node.nodeType !== 11 && descriptor.key) {
          setAttributeSafe(node, 'data-rmt-key', resolveRepeatKey(descriptor.key, context, item, index), descriptor, context);
        }
        fragment.appendChild(node);
      });
    });
    return fragment;
  }

  function renderRichTextChildren(segments, context) {
    const fragment = createFragment(context.documentTarget);
    toArray(segments).forEach((segment, index) => {
      appendNodes(fragment, [renderRichTextSegment(segment, {
        ...context,
        source: {
          ...(context.source || {}),
          pointer: `${(context.source && context.source.pointer) || ''}/rich/${index}`
        }
      })]);
    });
    return fragment;
  }

  function segmentChildren(record) {
    if (Object.prototype.hasOwnProperty.call(record, 'children')) return record.children;
    if (Object.prototype.hasOwnProperty.call(record, 'segments')) return record.segments;
    if (Object.prototype.hasOwnProperty.call(record, 'content')) return record.content;
    return null;
  }

  function renderRichTextContainer(record, context, tag, fallbackText = '') {
    const descriptor = {
      type: 'element',
      tag,
      class: record.class || record.className || record.classes || '',
      attributes: {
        'data-rmt-rich-segment': record.kind || record.type || tag,
        ...(record.attributes || record.attrs || {})
      }
    };
    const children = segmentChildren(record);
    if (children) {
      descriptor.children = [{
        type: 'rich-text',
        segments: toArray(children)
      }];
    } else {
      descriptor.text = Object.prototype.hasOwnProperty.call(record, 'text')
        ? record.text
        : fallbackText;
    }
    return renderElement(descriptor, context);
  }

  function renderRichTextSegment(segment, context) {
    const record = objectRecord(segment);
    const kind = clampString(record.kind || record.type, 'text');
    if (kind === 'code') {
      return renderComponent({
        type: 'component',
        tag: 'x-code',
        component: 'x-code',
        class: record.class || record.className || '',
        attributes: {
          id: record.id || undefined,
          lang: record.lang || record.language || 'text',
          'fallback-class': record.fallbackClass || record['fallback-class'] || undefined,
          'data-xtend-llm-code-block': record.codeBlock || record['code-block'] || undefined,
          'data-insular-hydration': record.insularHydration || undefined,
          'data-streaming': record.streaming || undefined,
          'data-rmt-rich-segment': 'code'
        },
        children: [
          {
            type: 'element',
            tag: 'template',
            attributes: {
              'data-x-code-mode': 'text'
            },
            text: record.text || record.code || ''
          },
          {
            type: 'element',
            tag: 'pre',
            class: record.fallbackClass || record['fallback-class'] || 'xtend-rmt-code-fallback',
            children: [{
              type: 'element',
              tag: 'code',
              text: record.text || record.code || ''
            }]
          }
        ]
      }, context);
    }
    if (kind === 'citation') {
      return renderElement({
        type: 'element',
        tag: 'a',
        class: ['xtend-rmt-citation', record.class || record.className],
        attributes: {
          href: record.href || record.url || '#',
          rel: record.rel || 'noreferrer',
          target: record.target || '_blank',
          'data-rmt-rich-segment': 'citation'
        },
        text: record.label || record.title || record.text || 'source'
      }, context);
    }
    if (kind === 'paragraph' || kind === 'p') return renderRichTextContainer(record, context, 'p');
    if (kind === 'heading' || kind === 'h') {
      const depth = Math.min(6, Math.max(1, Number(record.depth || record.level || 3)));
      return renderRichTextContainer(record, context, `h${depth}`);
    }
    if (kind === 'quote' || kind === 'blockquote') return renderRichTextContainer(record, context, 'blockquote');
    if (kind === 'inline-code' || kind === 'code-inline') return renderRichTextContainer(record, context, 'code');
    if (kind === 'strong' || kind === 'bold') return renderRichTextContainer(record, context, 'strong');
    if (kind === 'em' || kind === 'emphasis' || kind === 'italic') return renderRichTextContainer(record, context, 'em');
    if (kind === 'delete' || kind === 'del' || kind === 'strike') return renderRichTextContainer(record, context, 'del');
    if (kind === 'link') {
      return renderElement({
        type: 'element',
        tag: 'a',
        class: record.class || record.className || '',
        attributes: {
          href: record.href || record.url || '#',
          rel: record.rel || 'noreferrer',
          target: record.target || '_blank',
          'data-rmt-rich-segment': 'link'
        },
        children: segmentChildren(record) ? [{ type: 'rich-text', segments: toArray(segmentChildren(record)) }] : undefined,
        text: segmentChildren(record) ? undefined : record.label || record.title || record.text || record.href || ''
      }, context);
    }
    if (kind === 'list' || kind === 'ul' || kind === 'ol') {
      const tag = record.ordered || kind === 'ol' ? 'ol' : 'ul';
      return renderElement({
        type: 'element',
        tag,
        class: record.class || record.className || '',
        attributes: {
          'data-rmt-rich-segment': 'list'
        },
        children: toArray(record.items).map((item) => ({
          type: 'element',
          tag: 'li',
          children: [{
            type: 'rich-text',
            segments: Array.isArray(item) ? item : toArray(item && item.children || item && item.segments || item)
          }]
        }))
      }, context);
    }
    if (kind === 'sources' || kind === 'source-panel') {
      return renderElement({
        type: 'element',
        tag: 'details',
        class: record.class || record.className || 'xtend-rmt-sources',
        attributes: {
          open: record.open || undefined,
          'data-rmt-rich-segment': 'sources'
        },
        children: [
          {
            type: 'element',
            tag: 'summary',
            class: record.summaryClass || 'xtend-rmt-sources-summary',
            text: record.summary || record.label || 'Sources'
          },
          {
            type: 'element',
            tag: 'div',
            class: record.listClass || 'xtend-rmt-sources-list',
            children: toArray(record.sources || record.items).map((source) => ({
              type: 'element',
              tag: 'a',
              class: source.class || record.itemClass || 'xtend-rmt-source',
              attributes: {
                id: source.id || undefined,
                href: source.href || source.url || '#',
                target: source.target || '_blank',
                rel: source.rel || 'noreferrer',
                'data-source-index': source.index || source.id || ''
              },
              children: [
                {
                  type: 'element',
                  tag: 'span',
                  class: source.markerClass || record.markerClass || 'xtend-rmt-source-marker',
                  text: source.marker || source.label || `[${source.index || ''}]`
                },
                {
                  type: 'element',
                  tag: 'span',
                  class: source.copyClass || record.copyClass || 'xtend-rmt-source-copy',
                  children: [
                    {
                      type: 'element',
                      tag: 'span',
                      class: source.titleClass || record.titleClass || 'xtend-rmt-source-title',
                      text: source.title || source.url || source.href || 'source'
                    },
                    {
                      type: 'element',
                      tag: 'span',
                      class: source.metaClass || record.metaClass || 'xtend-rmt-source-meta',
                      text: source.meta || ''
                    },
                    {
                      type: 'element',
                      tag: 'span',
                      class: source.snippetClass || record.snippetClass || 'xtend-rmt-source-snippet',
                      attributes: {
                        hidden: { op: 'not', source: source.snippet || '' }
                      },
                      text: source.snippet || ''
                    }
                  ]
                }
              ]
            }))
          }
        ]
      }, context);
    }
    if (kind === 'fragment') {
      return renderRichTextChildren(segmentChildren(record), context);
    }
    return renderElement({
      type: 'element',
      tag: 'span',
      class: record.class || record.className || '',
      attributes: {
        'data-rmt-rich-segment': kind
      },
      children: segmentChildren(record) ? [{ type: 'rich-text', segments: toArray(segmentChildren(record)) }] : undefined,
      text: segmentChildren(record) ? undefined : record.text || ''
    }, context);
  }

  function renderRichText(descriptor, context) {
    const fragment = createFragment(context.documentTarget);
    const resolvedSegments = descriptor.segments || resolveValue(descriptor.source, context, context.item);
    const segments = typeof descriptor.source === 'string' && descriptor.source.startsWith('$') && resolvedSegments === descriptor.source
      ? []
      : toArray(resolvedSegments);
    segments.forEach((segment, index) => {
      appendNodes(fragment, [renderRichTextSegment(segment, {
        ...context,
        source: {
          ...(context.source || {}),
          pointer: `${(context.source && context.source.pointer) || ''}/segments/${index}`
        }
      })]);
    });
    return fragment;
  }

  function renderNode(descriptor, context) {
    if (descriptor == null || descriptor === false) return createFragment(context.documentTarget);
    if (Array.isArray(descriptor)) {
      const fragment = createFragment(context.documentTarget);
      descriptor.forEach((child, index) => {
        appendNodes(fragment, renderNode(child, {
          ...context,
          source: {
            ...(context.source || {}),
            pointer: `${(context.source && context.source.pointer) || ''}/array/${index}`
          }
        }));
      });
      return fragment;
    }
    if (typeof descriptor === 'string' || typeof descriptor === 'number') {
      return createText(context.documentTarget, descriptor);
    }
    if (isNodeLike(descriptor)) return descriptor;

    const nodeType = clampString(descriptor.type || (descriptor.component ? 'component' : descriptor.tag ? 'element' : descriptor.template ? 'template' : 'fragment'), 'fragment');
    switch (nodeType) {
      case 'text':
        return createText(context.documentTarget, resolveValue(descriptor.text, context, context.item));
      case 'element':
        return renderElement(descriptor, context);
      case 'component':
        return renderComponent(descriptor, context);
      case 'template':
        return renderTemplate(descriptor.template || descriptor.id, context, context.item);
      case 'slot':
        return renderSlot(descriptor.slot || descriptor.id, context, context.item);
      case 'when':
        return evaluateCondition(descriptor, context)
          ? renderNode(descriptor.then, context)
          : renderNode(descriptor.else || descriptor.fallback, context);
      case 'repeat':
        return renderRepeat(descriptor, context);
      case 'rich-text':
      case 'richText':
        return renderRichText(descriptor, context);
      case 'empty':
        return descriptor.template
          ? renderTemplate(descriptor.template, context, context.item)
          : renderNode(descriptor.fallback || descriptor.children || descriptor.then || null, context);
      case 'fallback':
        return descriptor.template
          ? renderTemplate(descriptor.template, context, context.item)
          : renderNode(descriptor.node || descriptor.children || descriptor.text || null, context);
      case 'trusted_html':
        return renderTrustedHtml(descriptor, context);
      case 'fragment': {
        const fragment = createFragment(context.documentTarget);
        toArray(descriptor.children || descriptor.nodes).forEach((child, index) => {
          appendNodes(fragment, renderNode(child, {
            ...context,
            source: {
              ...(context.source || {}),
              pointer: `${(context.source && context.source.pointer) || ''}/nodes/${index}`
            }
          }));
        });
        return fragment;
      }
      default:
        throw createRendererError('rmt.dom.node-type.unsupported', `Nicht unterstuetzter DOM Descriptor Type ${nodeType}`, descriptor, context);
    }
  }

  function getChildren(parent) {
    return Array.from(parent.children || parent.childNodes || []);
  }

  function keyForDescriptor(descriptor, context, index) {
    if (!descriptor || typeof descriptor !== 'object') return String(index);
    const directKey = descriptor.key || (descriptor.attributes && descriptor.attributes['data-rmt-key']);
    const resolved = resolveValue(directKey, context, context.item);
    return clampString(resolved, String(index));
  }

  function patchExistingElement(element, descriptor, context) {
    if (!element || !descriptor || typeof descriptor !== 'object') return element;
    const next = descriptor.type === 'component'
      ? {
          ...descriptor,
          tag: resolveComponent(descriptor, context).tag
        }
      : descriptor;
    applyAttributes(element, next.attributes || {}, next, context);
    applyProperties(element, next.properties || next.props || {}, next, context);
    applyClassPrimitive(element, next, context);
    applyPartPrimitive(element, next, context);
    applyStyleTokens(element, next, context);
    applyRefPrimitive(element, next, context);
    applyCommand(element, next, context);
    if (Object.prototype.hasOwnProperty.call(next, 'text')) {
      replaceChildren(childContainerFor(element), [createText(context.documentTarget, resolveValue(next.text, context, context.item))]);
    } else if (next.children) {
      materializeChildren(element, next.children, context, context.item);
    }
    return element;
  }

  function renderKeyed(root, descriptors, context) {
    const existingByKey = new Map();
    getChildren(root).forEach((child) => {
      const key = child && typeof child.getAttribute === 'function'
        ? child.getAttribute('data-rmt-key')
        : child && child.attributes && child.attributes['data-rmt-key'];
      if (key) existingByKey.set(String(key), child);
    });
    const nextNodes = toArray(descriptors).map((descriptor, index) => {
      const key = keyForDescriptor(descriptor, context, index);
      const existing = existingByKey.get(key);
      if (existing) {
        setAttributeSafe(existing, 'data-rmt-key', key, descriptor, context);
        return patchExistingElement(existing, descriptor, context);
      }
      const node = renderNode({
        ...descriptor,
        attributes: {
          ...(descriptor.attributes || {}),
          'data-rmt-key': key
        }
      }, context);
      return node;
    });
    replaceChildren(root, nextNodes);
    return nextNodes;
  }

  function createMap(records) {
    return new Map(toArray(records).map((record) => [record.id, record]));
  }

  function createRenderContext(documentTarget, options = {}, diagnosticsRecorder) {
    return {
      documentTarget,
      model: options.model || {},
      selectorValues: options.selectorValues || {},
      components: options.components instanceof Map ? options.components : createMap(options.components),
      templates: options.templates instanceof Map ? options.templates : createMap(options.templates),
      slots: options.slots instanceof Map ? options.slots : createMap(options.slots),
      selectors: options.selectors instanceof Map ? options.selectors : createMap(options.selectors),
      componentRegistry: options.componentRegistry || options.registry || null,
      componentBindingOptions: options.componentBindingOptions || {},
      stateBridge: options.stateBridge || null,
      refs: options.refs instanceof Map ? options.refs : new Map(),
      dispatchEvent: options.dispatchEvent,
      trustedDomRenderer: options.trustedDomRenderer,
      diagnostics: diagnosticsRecorder.diagnostics,
      publishDiagnostic: diagnosticsRecorder.publish,
      source: options.source || {}
    };
  }

  function createNoManualHtmlGate(options = {}) {
    const allowedFiles = new Set(toArray(options.allowedFiles));
    const allowedPatternIds = new Set(toArray(options.allowedPatternIds));

    function scanText(sourceText, scanOptions = {}) {
      const filePath = clampString(scanOptions.filePath, 'inline');
      if (allowedFiles.has(filePath)) return [];
      return MANUAL_HTML_PATTERNS
        .filter((record) => !allowedPatternIds.has(record.id) && record.pattern.test(String(sourceText || '')))
        .map((record) => ({
          schema: RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA,
          code: 'rmt.dom.manual-html-sink',
          severity: 'error',
          sink: record.id,
          filePath,
          message: `Manueller HTML-Sink ${record.id} ist in normaler RMT App-UI nicht erlaubt.`
        }));
    }

    return Object.freeze({
      schema: 'xtend.epic18.no-manual-html-gate.v1',
      scanText,
      scanFiles(files = {}) {
        return Object.entries(files).flatMap(([filePath, sourceText]) => scanText(sourceText, { filePath }));
      }
    });
  }

  function createRmtDomDescriptorRenderer(deps = {}) {
    const documentTarget = resolveDocumentTarget(deps);
    const diagnosticsRecorder = createDiagnosticsRecorder(deps);

    function runWithDiagnostics(fn) {
      try {
        return fn();
      } catch (error) {
        if (error && error.diagnostic) {
          diagnosticsRecorder.publish(error.diagnostic);
        }
        throw error;
      }
    }

    return Object.freeze({
      schema: RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
      trustedDomBoundary: TRUSTED_DOM_BOUNDARY,
      render(root, descriptor, options = {}) {
        return runWithDiagnostics(() => {
          if (!root || typeof root.replaceChildren !== 'function') {
            throw createRendererError('rmt.dom.root.invalid', 'RMT Render Root benoetigt replaceChildren().', descriptor, {
              source: options.source || {}
            });
          }
          const context = createRenderContext(documentTarget, options, diagnosticsRecorder);
          const rendered = renderNode(descriptor, context);
          const nodes = rendered && rendered.nodeType === 11 ? getChildren(rendered) : toArray(rendered);
          replaceChildren(root, nodes);
          if (typeof root.setAttribute === 'function') {
            root.setAttribute('data-rmt-rendered-shell', 'true');
            root.setAttribute('data-rmt-renderer-schema', RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA);
          }
          return {
            schema: 'xtend.epic18.rmt-dom-render-result.v1',
            root,
            nodeCount: nodes.length,
            diagnostics: diagnosticsRecorder.diagnostics.slice()
          };
        });
      },
      renderNode(descriptor, options = {}) {
        return runWithDiagnostics(() => renderNode(descriptor, createRenderContext(documentTarget, options, diagnosticsRecorder)));
      },
      renderKeyed(root, descriptors, options = {}) {
        return runWithDiagnostics(() => renderKeyed(root, descriptors, createRenderContext(documentTarget, options, diagnosticsRecorder)));
      },
      patchElement(element, descriptor, options = {}) {
        return runWithDiagnostics(() => patchExistingElement(element, descriptor, createRenderContext(documentTarget, options, diagnosticsRecorder)));
      },
      resolveValue(value, options = {}) {
        return runWithDiagnostics(() => {
          const context = createRenderContext(documentTarget, options, diagnosticsRecorder);
          return resolveValue(value, context, options.item);
        });
      },
      createNoManualHtmlGate,
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    });
  }

  const api = {
    RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA,
    RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    TRUSTED_DOM_BOUNDARY,
    createNoManualHtmlGate,
    createRmtDomDescriptorRenderer
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalTarget) {
    globalTarget.XTendRmtDomDescriptorRenderer = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

const __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__ = globalThis.XTendRmtDomDescriptorRenderer;

export const RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA;
export const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA;
export const TRUSTED_DOM_BOUNDARY = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.TRUSTED_DOM_BOUNDARY;
export const createNoManualHtmlGate = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.createNoManualHtmlGate;
export const createRmtDomDescriptorRenderer = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.createRmtDomDescriptorRenderer;

export default __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__;

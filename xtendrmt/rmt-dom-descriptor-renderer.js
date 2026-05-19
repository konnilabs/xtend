(function attachRmtDomDescriptorRenderer(globalTarget) {
  const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA = 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
  const RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-dom-renderer-diagnostic.v1';
  const TRUSTED_DOM_BOUNDARY = 'xtend.rmt.trusted-dom-boundary.explicit';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.dom_descriptor';
  const SAFE_TAG_NAME = /^[a-z][a-z0-9.-]*$/u;
  const URL_ATTRIBUTE_NAMES = new Set(['href', 'src', 'action', 'formaction', 'poster']);
  const BLOCKED_ATTRIBUTE_NAMES = new Set(['srcdoc']);
  const BLOCKED_PROPERTY_NAMES = new Set(['innerHTML', 'outerHTML', 'insertAdjacentHTML']);
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
    if (resolvedValue === false || resolvedValue === null || typeof resolvedValue === 'undefined') {
      if (typeof element.removeAttribute === 'function') element.removeAttribute(normalizedName);
      return;
    }
    if (typeof element.setAttribute === 'function') {
      element.setAttribute(normalizedName, resolvedValue === true ? '' : String(resolvedValue));
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
      setAttributeSafe(element, `data-style-token-${tokenName}`, resolvedValue, descriptor, context);
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

  function readPath(model, path) {
    const parts = String(path || '').split('.').filter(Boolean);
    let cursor = model;
    for (const part of parts) {
      if (cursor == null) return undefined;
      cursor = cursor[part];
    }
    return cursor;
  }

  function resolveValue(value, context, item) {
    if (typeof value !== 'string') return value;
    if (value === '$item') return item;
    if (value.startsWith('$item.')) return readPath(item, value.slice(6));
    if (value.startsWith('$selector.')) {
      const selectorKey = `selector.${value.slice(10)}`;
      if (context.selectorValues && Object.prototype.hasOwnProperty.call(context.selectorValues, selectorKey)) return context.selectorValues[selectorKey];
      return readPath(context.model, selectorKey);
    }
    if (value.startsWith('selector.') && context.selectorValues && Object.prototype.hasOwnProperty.call(context.selectorValues, value)) {
      return context.selectorValues[value];
    }
    if (value.startsWith('$derive.')) {
      const deriveKey = `derive.${value.slice(8)}`;
      return readPath(context.model, deriveKey);
    }
    if (value.startsWith('$state.')) return readPath(context.model, value.slice(7));
    if (value.startsWith('$model.')) return readPath(context.model, value.slice(7));
    if (Object.prototype.hasOwnProperty.call(context.model || {}, value)) return context.model[value];
    return value;
  }

  function resolveComponent(descriptor, context) {
    const componentId = descriptor.component || descriptor.ref || descriptor.id || '';
    const component = componentId && context.components ? context.components.get(componentId) : null;
    return {
      id: componentId,
      tag: clampString(descriptor.tag || (component && component.tag), 'div'),
      attributes: {
        ...objectRecord(component && component.attributes),
        ...(descriptor.attributes || {})
      },
      properties: {
        ...objectRecord(component && component.properties),
        ...objectRecord(component && component.props),
        ...(descriptor.properties || descriptor.props || {})
      },
      slots: {
        ...objectRecord(component && component.slots),
        ...objectRecord(descriptor.slots)
      },
      parts: [
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
    const rendered = [];
    toArray(children).forEach((child, index) => {
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
    replaceChildren(element, rendered);
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
    if (Object.prototype.hasOwnProperty.call(descriptor, 'text')) {
      appendNodes(element, [createText(context.documentTarget, resolveValue(descriptor.text, context, context.item))]);
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
      styleTokens: component.styleTokens
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
    return element;
  }

  function evaluateCondition(descriptor, context) {
    const key = descriptor.test || descriptor.when;
    const explicitValue = resolveValue(key, context, context.item);
    if (typeof explicitValue === 'boolean') return explicitValue;
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
    if (Object.prototype.hasOwnProperty.call(next, 'text')) {
      replaceChildren(element, [createText(context.documentTarget, resolveValue(next.text, context, context.item))]);
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

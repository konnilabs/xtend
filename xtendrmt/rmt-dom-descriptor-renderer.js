(function attachRmtDomDescriptorRenderer(globalTarget) {
  const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA = 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
  const RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA = 'xtend.epic18.rmt-dom-renderer-diagnostic.v2';
  const RMT_DOM_COMMIT_RESULT_SCHEMA = 'xtend.rmt.dom-commit-result.v1';
  const RMT_DOM_APPLICATION_BINDING_SCHEMA = 'xtend.rmt.dom-application-binding.v1';
  const RMT_DOM_BINDING_SCOPE_SCHEMA = 'xtend.rmt.dom-binding-scope.v1';
  const TRUSTED_DOM_BOUNDARY = 'xtend.rmt.trusted-dom-boundary.explicit';
  const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
  const DEFAULT_DIAGNOSTIC_CHANNEL = 'rmt.app_platform.dom_descriptor';
  const SAFE_TAG_NAME = /^[a-z][a-z0-9.-]*$/u;
  const BLOCKED_TAG_NAMES = new Set(['script', 'object', 'embed', 'iframe', 'frame', 'frameset', 'meta', 'link', 'base', 'applet', 'param']);
  const URL_ATTRIBUTE_NAMES = new Set(['href', 'src', 'action', 'formaction', 'poster', 'xlink:href']);
  const URL_PROPERTY_NAMES = new Set(['href', 'src', 'action', 'formaction', 'poster']);
  const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);
  const BLOCKED_ATTRIBUTE_NAMES = new Set([
    'srcdoc',
    'innerhtml',
    'outerhtml',
    'insertadjacenthtml',
    '__proto__',
    'prototype',
    'constructor'
  ]);
  const BLOCKED_PROPERTY_NAMES = new Set([
    'innerhtml',
    'outerhtml',
    'insertadjacenthtml',
    'srcdoc',
    '__proto__',
    'prototype',
    'constructor'
  ]);
  const SAFE_NATIVE_PROPERTY_NAMES = new Set([
    'accept',
    'action',
    'alt',
    'autoplay',
    'checked',
    'cols',
    'contentEditable',
    'controls',
    'crossOrigin',
    'currentTime',
    'defaultChecked',
    'defaultSelected',
    'defaultValue',
    'dir',
    'disabled',
    'draggable',
    'formAction',
    'height',
    'href',
    'id',
    'indeterminate',
    'lang',
    'loop',
    'max',
    'maxLength',
    'min',
    'minLength',
    'multiple',
    'muted',
    'name',
    'open',
    'pattern',
    'placeholder',
    'playbackRate',
    'poster',
    'preload',
    'readOnly',
    'required',
    'rows',
    'selected',
    'selectedIndex',
    'size',
    'spellcheck',
    'src',
    'step',
    'tabIndex',
    'title',
    'type',
    'value',
    'volume',
    'width'
  ]);
  const BOOLEAN_PROPERTY_NAMES = new Set([
    'autoplay',
    'checked',
    'controls',
    'defaultChecked',
    'defaultSelected',
    'disabled',
    'draggable',
    'indeterminate',
    'loop',
    'multiple',
    'muted',
    'open',
    'readOnly',
    'required',
    'selected',
    'spellcheck'
  ]);
  const PROPERTY_NAME_ALIASES = Object.freeze({
    contenteditable: 'contentEditable',
    crossorigin: 'crossOrigin',
    currenttime: 'currentTime',
    defaultchecked: 'defaultChecked',
    defaultselected: 'defaultSelected',
    defaultvalue: 'defaultValue',
    formaction: 'formAction',
    maxlength: 'maxLength',
    minlength: 'minLength',
    playbackrate: 'playbackRate',
    readonly: 'readOnly',
    selectedindex: 'selectedIndex',
    tabindex: 'tabIndex'
  });
  const OWNERSHIP_DOMAINS = Object.freeze([
    'structure',
    'content',
    'attributes',
    'properties',
    'class',
    'part',
    'styleTokens',
    'events',
    'visibility',
    'validation'
  ]);
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
  let rendererInstanceSequence = 0;

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

  function attributeDomain(name) {
    const normalizedName = clampString(name).toLowerCase();
    if (normalizedName === 'class') return 'class';
    if (normalizedName === 'part') return 'part';
    if (normalizedName.startsWith('data-style-token-')) return 'styleTokens';
    if (
      normalizedName === 'hidden'
      || normalizedName === 'data-rmt-hidden-display'
      || normalizedName === 'data-xt-surface-transitioning'
    ) return 'visibility';
    if (
      normalizedName === 'aria-invalid'
      || normalizedName === 'aria-errormessage'
      || normalizedName === 'aria-describedby'
      || normalizedName === 'invalid'
      || normalizedName === 'data-rmt-invalid'
      || normalizedName === 'data-validation-message'
    ) return 'validation';
    return 'attributes';
  }

  function styleDomain(name) {
    const normalizedName = clampString(name).toLowerCase();
    return [
      'display',
      'visibility',
      'opacity',
      'transform',
      'transform-origin',
      'transition',
      'filter',
      'pointer-events',
      'will-change'
    ].includes(normalizedName)
      ? 'visibility'
      : 'styleTokens';
  }

  function domainAllowed(context, domain) {
    return !context || !context.blockedDomains || !context.blockedDomains.has(domain);
  }

  function ownerMapForPolicy(policy = {}) {
    const ownerMap = {
      structure: 'descriptor-renderer',
      content: 'descriptor-renderer',
      attributes: 'descriptor-renderer',
      properties: 'descriptor-renderer',
      class: 'descriptor-renderer',
      part: 'descriptor-renderer',
      styleTokens: 'descriptor-renderer',
      events: 'event-router',
      visibility: 'transition-runtime',
      validation: 'validation-runtime'
    };
    const configured = policy.domains || policy.owners || policy.domainOwners || policy.reservations || {};
    Object.entries(configured).forEach(([domain, owner]) => {
      if (OWNERSHIP_DOMAINS.includes(domain) && clampString(owner)) ownerMap[domain] = clampString(owner);
    });
    return ownerMap;
  }

  function validateOwnershipPolicy(policy) {
    if (policy == null) return;
    if (typeof policy !== 'object' || Array.isArray(policy)) {
      throw createRendererError(
        'rmt.dom.ownership.policy-invalid',
        'DOM Ownership muss als strukturiertes Policy-Objekt angegeben werden.'
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(policy, 'mode')
      && !['strict', 'compatibility'].includes(policy.mode)
    ) {
      throw createRendererError(
        'rmt.dom.ownership.mode-invalid',
        `Unbekannter DOM-Ownership-Modus ${String(policy.mode)}.`
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(policy, 'strict')
      && typeof policy.strict !== 'boolean'
    ) {
      throw createRendererError(
        'rmt.dom.ownership.strict-invalid',
        'DOM Ownership strict muss ein Boolean sein.'
      );
    }
    ['owner', 'writer'].forEach((fieldName) => {
      if (
        Object.prototype.hasOwnProperty.call(policy, fieldName)
        && (typeof policy[fieldName] !== 'string' || !clampString(policy[fieldName]))
      ) {
        throw createRendererError(
          'rmt.dom.ownership.owner-invalid',
          `DOM Ownership ${fieldName} muss ein nicht-leerer String sein.`
        );
      }
    });
    [
      'domains',
      'owners',
      'domainOwners',
      'reservations',
      'claims',
      'domainClaims',
      'domainWriters'
    ].forEach((fieldName) => {
      if (!Object.prototype.hasOwnProperty.call(policy, fieldName)) return;
      const record = policy[fieldName];
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw createRendererError(
          'rmt.dom.ownership.domains-invalid',
          `DOM Ownership ${fieldName} muss ein strukturiertes Domain-Objekt sein.`
        );
      }
      Object.entries(record).forEach(([domain, owner]) => {
        if (!OWNERSHIP_DOMAINS.includes(domain)) {
          throw createRendererError(
            'rmt.dom.ownership.domain-invalid',
            `Unbekannte DOM-Ownership-Domaene ${domain}.`
          );
        }
        if (typeof owner !== 'string' || !clampString(owner)) {
          throw createRendererError(
            'rmt.dom.ownership.owner-invalid',
            `DOM-Owner fuer ${domain} muss ein nicht-leerer String sein.`
          );
        }
      });
    });
  }

  function descriptorDomains(descriptor, context, depth = 0) {
    const domains = new Set();
    if (depth > 100) return domains;
    if (descriptor == null || descriptor === false) return domains;
    if (Array.isArray(descriptor)) {
      descriptor.forEach((entry) => descriptorDomains(entry, context, depth + 1).forEach((domain) => domains.add(domain)));
      if (descriptor.length) domains.add('structure');
      return domains;
    }
    if (typeof descriptor !== 'object') {
      domains.add('content');
      return domains;
    }
    const type = clampString(descriptor.type || (descriptor.component ? 'component' : descriptor.tag ? 'element' : 'fragment'), 'fragment');
    if (type === 'component') {
      return descriptorDomains(effectiveElementDescriptor(descriptor, context).descriptor, context, depth + 1);
    }
    if (type === 'template' || type === 'slot') {
      const templateId = type === 'template'
        ? descriptor.template || descriptor.id
        : (() => {
            const slot = context && context.slots && context.slots.get(descriptor.slot || descriptor.id);
            return slot && slot.template;
          })();
      const template = context && context.templates && context.templates.get(templateId);
      if (template) {
        return descriptorDomains(template.root || template.node || template, context, depth + 1);
      }
      return domains;
    }
    if (type === 'when') {
      return descriptorDomains(
        evaluateCondition(descriptor, context) ? descriptor.then : descriptor.else || descriptor.fallback,
        context,
        depth + 1
      );
    }
    if (type === 'repeat') {
      const sourceValue = resolveValue(descriptor.source, context, context && context.item);
      const items = Array.isArray(sourceValue) ? sourceValue : [];
      items.forEach((item) => {
        let childDescriptor = descriptor.template || descriptor.node || descriptor.children || { type: 'text', text: '$item' };
        if (descriptor.item) {
          const template = context && context.templates && context.templates.get(descriptor.item);
          childDescriptor = template && (template.root || template.node || template);
        }
        descriptorDomains(childDescriptor, { ...context, item }, depth + 1)
          .forEach((domain) => domains.add(domain));
      });
      if (items.length) domains.add('structure');
      return domains;
    }
    if (type === 'rich-text' || type === 'richText') {
      const resolvedSegments = descriptor.segments || resolveValue(descriptor.source, context, context && context.item);
      const segments = typeof descriptor.source === 'string'
        && descriptor.source.startsWith('$')
        && resolvedSegments === descriptor.source
        ? []
        : toArray(resolvedSegments);
      segments.forEach((segment) => {
        descriptorDomains(projectRichTextSegment(segment), context, depth + 1)
          .forEach((domain) => domains.add(domain));
      });
      if (segments.length) domains.add('structure');
      return domains;
    }
    if (type === 'trusted_html') {
      domains.add('content');
      domains.add('structure');
      return domains;
    }
    if (type === 'text' || Object.prototype.hasOwnProperty.call(descriptor, 'text')) domains.add('content');
    if (
      type === 'fragment'
      || type === 'repeat'
      || type === 'when'
      || descriptor.children
      || descriptor.nodes
    ) domains.add('structure');
    Object.entries(objectRecord(descriptor.attributes)).forEach(([name, value]) => {
      if (name.toLowerCase() === 'style') {
        Object.keys(objectRecord(value)).forEach((styleName) => domains.add(styleDomain(styleName)));
      } else {
        domains.add(attributeDomain(name));
      }
    });
    if (descriptor.id || descriptor.key || descriptor.bindings) domains.add('attributes');
    if (Object.keys(objectRecord(descriptor.properties || descriptor.props)).length) domains.add('properties');
    if (descriptor.class || descriptor.className || descriptor.classes) domains.add('class');
    if (descriptor.part || descriptor.parts) domains.add('part');
    if (descriptor.styleToken || descriptor.styleTokens || descriptor['style-token']) domains.add('styleTokens');
    if (Object.keys(objectRecord(descriptor.events)).length) domains.add('events');
    if (descriptor.command || descriptor.commands) domains.add('events');
    toArray(descriptor.children || descriptor.nodes).forEach((entry) => {
      descriptorDomains(entry, context, depth + 1).forEach((domain) => domains.add(domain));
    });
    return domains;
  }

  function operationDomains(operation, descriptor) {
    const domains = new Set();
    if (operation === 'replace-children' || operation === 'reconcile-children') {
      domains.add('structure');
    } else if (
      operation === 'create-node'
      && descriptor !== null
      && typeof descriptor !== 'undefined'
      && descriptor !== false
    ) {
      domains.add('structure');
    }
    return domains;
  }

  function resolveOwnership(policy, descriptor, context, operation = '') {
    if (!policy || typeof policy !== 'object') return new Set();
    const mode = clampString(policy.mode, policy.strict ? 'strict' : 'compatibility');
    const owner = clampString(policy.owner || policy.writer, 'descriptor-renderer');
    const ownerMap = ownerMapForPolicy(policy);
    const configuredClaims = policy.claims || policy.domainClaims || policy.domainWriters || {};
    const ownerForDomain = (domain) => (
      clampString(configuredClaims[domain], '') || owner
    );
    const blockedDomains = new Set(
      OWNERSHIP_DOMAINS.filter((domain) => (
        ownerMap[domain] && ownerMap[domain] !== ownerForDomain(domain)
      ))
    );
    const claimedDomains = descriptorDomains(descriptor, context);
    operationDomains(operation, descriptor).forEach((domain) => claimedDomains.add(domain));
    claimedDomains.forEach((domain) => {
      const expectedOwner = ownerMap[domain];
      const claimedOwner = ownerForDomain(domain);
      if (!expectedOwner || expectedOwner === claimedOwner) return;
      const diagnostic = createDiagnostic(
        'rmt.dom.ownership.collision',
        `DOM-Domaene ${domain} ist fuer ${expectedOwner} reserviert und kann nicht durch ${claimedOwner} geschrieben werden.`,
        descriptor,
        context,
        mode === 'strict' ? 'error' : 'warning'
      );
      diagnostic.domain = domain;
      diagnostic.owner = claimedOwner;
      diagnostic.reservedOwner = expectedOwner;
      if (mode === 'strict') {
        const error = new Error(diagnostic.message);
        error.code = diagnostic.code;
        error.diagnostic = diagnostic;
        throw error;
      }
      if (context && typeof context.publishDiagnostic === 'function') context.publishDiagnostic(diagnostic);
    });
    return blockedDomains;
  }

  function isSafeUrl(value) {
    const normalized = String(value == null ? '' : value).trim().toLowerCase();
    if (!normalized) return true;
    if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) return true;
    return /^(https?:|mailto:|tel:|blob:)/u.test(normalized);
  }

  function isSafeStyleValue(value) {
    const normalized = String(value == null ? '' : value).trim().toLowerCase();
    if (!normalized) return true;
    if (/expression\s*\(|@import|behavior\s*:|-moz-binding|javascript\s*:/u.test(normalized)) return false;
    const urlStarts = normalized.match(/url\s*\(/gu) || [];
    const urlMatches = Array.from(normalized.matchAll(/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gu));
    if (urlMatches.length !== urlStarts.length) return false;
    return urlMatches.every((match) => isSafeUrl(match[2]));
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
    const lowerName = normalized.toLowerCase();
    if (lowerName.startsWith('on')) return false;
    return !BLOCKED_PROPERTY_NAMES.has(lowerName);
  }

  function markChanged(context, structural = false) {
    if (!context || !context.commitTracker) return;
    context.commitTracker.changed = true;
    if (structural) context.commitTracker.structural = true;
  }

  function attributeValue(element, name) {
    if (element && typeof element.getAttribute === 'function') return element.getAttribute(name);
    if (element && element.attributes && Object.prototype.hasOwnProperty.call(element.attributes, name)) {
      const attribute = element.attributes[name];
      return attribute && typeof attribute === 'object' && Object.prototype.hasOwnProperty.call(attribute, 'value')
        ? String(attribute.value)
        : String(attribute);
    }
    return null;
  }

  function styleValue(element, name) {
    if (!element || !element.style) return '';
    if (typeof element.style.getPropertyValue === 'function') return element.style.getPropertyValue(name);
    if (element.style.values && Object.prototype.hasOwnProperty.call(element.style.values, name)) {
      return String(element.style.values[name]);
    }
    return String(element.style[name] == null ? '' : element.style[name]);
  }

  function setStyleValue(element, name, value, context) {
    if (!element || !element.style) return;
    const nextValue = String(value == null ? '' : value);
    if (styleValue(element, name) === nextValue) return;
    if (typeof element.style.setProperty === 'function') {
      element.style.setProperty(name, nextValue);
    } else {
      element.style[name] = nextValue;
    }
    markChanged(context);
  }

  function removeStyleValue(element, name, context) {
    if (!element || !element.style || styleValue(element, name) === '') return;
    if (typeof element.style.removeProperty === 'function') {
      element.style.removeProperty(name);
    } else if (element.style.values && Object.prototype.hasOwnProperty.call(element.style.values, name)) {
      delete element.style.values[name];
    } else {
      element.style[name] = '';
    }
    markChanged(context);
  }

  function propertyNamesFromCapability(capability) {
    const propertyNames = new Set();
    const records = [
      capability,
      capability && capability.rmt,
      capability && capability.componentContract,
      capability && capability.componentContract && capability.componentContract.properties,
      capability && capability.componentContract && capability.componentContract.api
    ];
    records.forEach((record) => {
      if (!record || typeof record !== 'object') return;
      [
        record.properties,
        record.allowedProperties,
        record.propertyNames,
        record.props
      ].forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((entry) => propertyNames.add(clampString(entry)));
        } else if (value && typeof value === 'object') {
          Object.keys(value).forEach((entry) => propertyNames.add(clampString(entry)));
        }
      });
    });
    return propertyNames;
  }

  function validatePropertyName(element, name, descriptor, context) {
    const requestedName = clampString(name);
    const lowerRequestedName = requestedName.toLowerCase();
    const normalizedName = Object.prototype.hasOwnProperty.call(PROPERTY_NAME_ALIASES, lowerRequestedName)
      ? PROPERTY_NAME_ALIASES[lowerRequestedName]
      : requestedName;
    if (!isSafePropertyName(normalizedName)) {
      throw createRendererError('rmt.dom.property.unsafe', `Unsichere Property ${normalizedName}`, descriptor, context);
    }
    const tag = elementTagName(element) || descriptorTagName(descriptor, context);
    const isCustomElement = tag.includes('-');
    const registry = context.componentRegistry;
    const capability = isCustomElement && registry && typeof registry.resolveComponentCapability === 'function'
      ? registry.resolveComponentCapability(tag)
      : null;
    if (isCustomElement) {
      if (!propertyNamesFromCapability(capability).has(normalizedName)) {
        throw createRendererError('rmt.dom.property.not-allowed', `Nicht freigegebene Property ${normalizedName}`, descriptor, context);
      }
      return normalizedName;
    }
    if (!SAFE_NATIVE_PROPERTY_NAMES.has(normalizedName)) {
      throw createRendererError('rmt.dom.property.not-allowed', `Nicht freigegebene Property ${normalizedName}`, descriptor, context);
    }
    return normalizedName;
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
    if (typeof descriptor === 'string' || typeof descriptor === 'number') return '#text';
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

  function replaceChildren(parent, nodes, context) {
    const normalizedNodes = toArray(nodes).filter(Boolean);
    const existingNodes = getChildren(parent);
    if (context && !domainAllowed(context, 'structure')) return existingNodes;
    if (
      existingNodes.length === normalizedNodes.length
      && existingNodes.every((node, index) => node === normalizedNodes[index])
    ) {
      return normalizedNodes;
    }
    if (typeof parent.replaceChildren === 'function') {
      parent.replaceChildren(...normalizedNodes);
      markChanged(context, true);
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
    markChanged(context, true);
    return normalizedNodes;
  }

  function setAttributeSafe(element, name, value, descriptor, context) {
    const normalizedName = clampString(name);
    if (!isSafeAttributeName(normalizedName)) {
      throw createRendererError('rmt.dom.attribute.unsafe', `Unsicheres Attribut ${normalizedName}`, descriptor, context);
    }
    if (!domainAllowed(context, attributeDomain(normalizedName))) return;
    const resolvedValue = resolveValue(value, context, context.item);
    if (URL_ATTRIBUTE_NAMES.has(normalizedName.toLowerCase()) && !isSafeUrl(resolvedValue)) {
      throw createRendererError('rmt.dom.attribute.url-unsafe', `Unsichere URL fuer Attribut ${normalizedName}`, descriptor, context);
    }
    if (typeof resolvedValue === 'boolean' && isAriaAttribute(normalizedName)) {
      const nextValue = String(resolvedValue);
      if (typeof element.setAttribute === 'function' && attributeValue(element, normalizedName) !== nextValue) {
        element.setAttribute(normalizedName, nextValue);
        markChanged(context);
      }
      return;
    }
    if (resolvedValue === false && EXPLICIT_FALSE_ATTRIBUTE_NAMES.has(normalizedName.toLowerCase())) {
      if (typeof element.setAttribute === 'function' && attributeValue(element, normalizedName) !== 'false') {
        element.setAttribute(normalizedName, 'false');
        markChanged(context);
      }
      return;
    }
    if (resolvedValue === false || resolvedValue === null || typeof resolvedValue === 'undefined') {
      if (typeof element.removeAttribute === 'function' && attributeValue(element, normalizedName) !== null) {
        element.removeAttribute(normalizedName);
        markChanged(context);
      }
      if (normalizedName === 'hidden' && element.style && element.getAttribute && element.getAttribute('data-rmt-hidden-display') === 'true') {
        setStyleValue(element, 'display', '', context);
        if (typeof element.removeAttribute === 'function') {
          element.removeAttribute('data-rmt-hidden-display');
          markChanged(context);
        }
      }
      return;
    }
    if (typeof element.setAttribute === 'function') {
      const nextValue = resolvedValue === true ? '' : String(resolvedValue);
      if (attributeValue(element, normalizedName) !== nextValue) {
        element.setAttribute(normalizedName, nextValue);
        markChanged(context);
      }
      if (normalizedName === 'hidden' && element.style) {
        setStyleValue(element, 'display', 'none', context);
        if (attributeValue(element, 'data-rmt-hidden-display') !== 'true') {
          element.setAttribute('data-rmt-hidden-display', 'true');
          markChanged(context);
        }
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
      if (!domainAllowed(context, styleDomain(normalizedName))) return;
      const resolvedValue = resolveValue(value, context, context.item);
      if (!isSafeStyleValue(resolvedValue)) {
        throw createRendererError('rmt.dom.style.unsafe-value', `Unsicherer Style-Wert fuer ${normalizedName}`, descriptor, context);
      }
      if (element.style && typeof element.style === 'object') {
        setStyleValue(element, normalizedName, resolvedValue == null ? '' : resolvedValue, context);
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
    if (!domainAllowed(context, 'class')) return;
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
    if (!domainAllowed(context, 'part')) return;
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
    if (!domainAllowed(context, 'styleTokens')) return;
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
      if (!isSafeStyleValue(resolvedValue)) {
        throw createRendererError('rmt.dom.style-token.unsafe-value', `Unsicherer Style-Token-Wert fuer ${tokenName}`, descriptor, context);
      }
      setAttributeSafe(element, `data-style-token-${tokenName}`, { op: 'literal', value: resolvedValue }, descriptor, context);
      setStyleValue(element, `--xtend-${tokenName}`, resolvedValue == null ? '' : resolvedValue, context);
    });
  }

  function applyRefPrimitive(element, descriptor, context) {
    if (!domainAllowed(context, 'attributes')) return;
    const ref = clampString(resolveValue(descriptor.ref || descriptor.nodeRef, context, context.item));
    if (!ref) return;
    if (!/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u.test(ref)) {
      throw createRendererError('rmt.dom.ref.unsafe', `Unsichere Ref ${ref}`, descriptor, context);
    }
    setAttributeSafe(element, 'data-rmt-ref', ref, descriptor, context);
    if (context.refs && typeof context.refs.set === 'function') {
      const previousRef = context.rendererState && context.rendererState.refs.get(element);
      if (
        previousRef
        && (
          previousRef.key !== ref
          || previousRef.map !== context.refs
        )
      ) {
        removeRefOwnership(element, context.rendererState);
        markChanged(context);
      }
      context.refs.set(ref, element);
      if (context.rendererState) {
        context.rendererState.refs.set(element, {
          key: ref,
          map: context.refs
        });
      }
    }
  }

  function applyAttributes(element, attributes, descriptor, context) {
    Object.entries(attributes || {}).forEach(([name, value]) => {
      if (name.toLowerCase() === 'style') {
        applyStyleObject(element, value, descriptor, context);
        return;
      }
      if (shouldPreserveActiveInputDraft(element, name, context)) return;
      setAttributeSafe(element, name, value, descriptor, context);
    });
  }

  function isActiveEditingElement(element, context) {
    if (!element) return false;
    const documentTarget = context && context.documentTarget;
    const activeElement = documentTarget && documentTarget.activeElement;
    if (activeElement === element) return true;
    if (element.shadowRoot && element.shadowRoot.activeElement) return true;
    if (activeElement && typeof element.contains === 'function' && element.contains(activeElement)) return true;
    if (typeof element.matches === 'function') {
      try {
        if (element.matches(':focus-within')) return true;
      } catch (_) {}
    }
    return false;
  }

  function shouldPreserveActiveInputDraft(element, propertyName, context) {
    if (!context || (
      context.preserveActiveInputDraft !== true
      && (!context.metadata || context.metadata.preserveActiveInputDraft !== true)
    )) return false;
    if (String(propertyName || '').toLowerCase() !== 'value') return false;
    if (!('value' in element)) return false;
    return true;
  }

  function applyProperties(element, properties, descriptor, context) {
    if (!domainAllowed(context, 'properties')) return;
    Object.entries(properties || {}).forEach(([name, value]) => {
      const normalizedName = validatePropertyName(element, name, descriptor, context);
      const resolvedValue = resolveValue(value, context, context.item);
      if (URL_PROPERTY_NAMES.has(normalizedName.toLowerCase()) && !isSafeUrl(resolvedValue)) {
        throw createRendererError('rmt.dom.property.url-unsafe', `Unsichere URL fuer Property ${normalizedName}`, descriptor, context);
      }
      if (shouldPreserveActiveInputDraft(element, normalizedName, context)) return;
      if (context.rendererState) {
        let baselines = context.rendererState.propertyBaselines.get(element);
        if (!baselines) {
          baselines = new Map();
          context.rendererState.propertyBaselines.set(element, baselines);
        }
        if (!baselines.has(normalizedName)) {
          baselines.set(normalizedName, element[normalizedName]);
        }
      }
      if (!Object.is(element[normalizedName], resolvedValue)) {
        element[normalizedName] = resolvedValue;
        markChanged(context);
      }
      if (typeof resolvedValue === 'string' || typeof resolvedValue === 'number' || typeof resolvedValue === 'boolean') {
        setAttributeSafe(element, normalizedName, resolvedValue, descriptor, context);
      }
    });
  }

  function bindingOwner(descriptor, binding = {}) {
    const source = clampString(
      binding.owner
      || binding.ownerId
      || binding.scope
      || descriptor.owner
      || descriptor.id
      || descriptor.key
      || descriptor.ref
      || descriptor.component
      || descriptor.tag,
      'anonymous'
    );
    return source.startsWith('scope.') ? source : `descriptor.${source}`;
  }

  function bindingIdFor(element, slot, explicitId, descriptor, context) {
    const rendererState = context.rendererState;
    const normalizedExplicitId = clampString(explicitId, '');
    if (normalizedExplicitId && !/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u.test(normalizedExplicitId)) {
      throw createRendererError('rmt.dom.binding.id-unsafe', `Unsichere Binding-ID ${normalizedExplicitId}`, descriptor, context);
    }
    if (!rendererState) return normalizedExplicitId || `rmt.binding.detached.${slot}`;
    let ids = rendererState.bindingIds.get(element);
    if (!ids) {
      ids = new Map();
      rendererState.bindingIds.set(element, ids);
    }
    if (normalizedExplicitId) {
      ids.set(slot, normalizedExplicitId);
      return normalizedExplicitId;
    }
    if (!ids.has(slot)) {
      rendererState.bindingSequence += 1;
      ids.set(slot, `rmt.binding.${rendererState.rendererInstanceId}.${rendererState.bindingSequence}`);
    }
    return ids.get(slot);
  }

  function bindingSignature(binding) {
    try {
      return JSON.stringify({
        event: binding.event,
        command: binding.command,
        owner: binding.owner,
        component: binding.component,
        options: binding.options,
        governance: binding.governance,
        payload: binding.payload,
        payloadContract: binding.payloadContract,
        payloadAdapter: binding.payloadAdapter,
        condition: binding.condition,
        guard: binding.guard,
        postAction: binding.postAction,
        commandTarget: binding.commandTarget,
        lane: binding.lane
      });
    } catch (_) {
      return `${binding.event}:${binding.command}:${binding.owner}`;
    }
  }

  function storeApplicationBindings(element, family, nextBindings, context) {
    const rendererState = context.rendererState;
    if (!rendererState) return;
    let bindings = rendererState.applicationBindings.get(element);
    if (!bindings) bindings = new Map();
    const desiredSlots = new Set(nextBindings.map((binding) => binding.slot));
    nextBindings.forEach((binding) => {
      const current = bindings.get(binding.slot);
      const signature = bindingSignature(binding);
      if (!current || current.id !== binding.id || current.signature !== signature) {
        bindings.set(binding.slot, { ...binding, signature });
        markChanged(context);
      }
    });
    if (context.reconcileMode) {
      Array.from(bindings.entries()).forEach(([slot]) => {
        if (!slot.startsWith(`${family}:`) || desiredSlots.has(slot)) return;
        bindings.delete(slot);
        markChanged(context);
      });
    }
    if (bindings.size) rendererState.applicationBindings.set(element, bindings);
    else rendererState.applicationBindings.delete(element);
  }

  function applicationBindingRecord(element, descriptor, context, input) {
    const source = objectRecord(input.source);
    const event = clampString(input.event);
    const command = clampString(input.command);
    if (!event || event.toLowerCase().startsWith('on')) {
      throw createRendererError('rmt.dom.event.unsafe', `Unsicherer Event-Name ${event}`, descriptor, context);
    }
    if (!command) {
      throw createRendererError('rmt.dom.binding.command-missing', `Application Binding fuer ${event} benoetigt ein Command.`, descriptor, context);
    }
    const options = Object.freeze({
      capture: source.capture === true || source.options && source.options.capture === true,
      once: source.once === true || source.options && source.options.once === true,
      passive: source.passive === true || source.options && source.options.passive === true
    });
    const governance = Object.freeze({
      ...options,
      preventDefault: source.preventDefault === true || source.governance && source.governance.preventDefault === true,
      stopPropagation: source.stopPropagation === true || source.governance && source.governance.stopPropagation === true,
      stopImmediatePropagation: source.stopImmediatePropagation === true || source.governance && source.governance.stopImmediatePropagation === true,
      retarget: clampString(source.retarget || source.governance && source.governance.retarget, 'target')
    });
    const id = bindingIdFor(element, input.slot, source.bindingId, descriptor, context);
    return Object.freeze({
      schema: RMT_DOM_APPLICATION_BINDING_SCHEMA,
      id,
      bindingId: id,
      kind: 'application',
      target: element,
      event,
      command,
      action: command,
      options,
      governance,
      owner: bindingOwner(descriptor, source),
      component: clampString(source.component || descriptor.component || descriptor.tag, ''),
      payload: Object.prototype.hasOwnProperty.call(input, 'payload') ? input.payload : '$detail',
      payloadContract: source.payloadContract || source.contract || null,
      payloadAdapter: source.payloadAdapter || source.adapter || source.payloadKind || null,
      closest: source.closest || source.closestSelector || source.delegate || null,
      condition: source.condition || source.when || null,
      guard: source.guard || source.confirm || null,
      postAction: toArray(source.postAction || source.after || source.afterAction),
      commandTarget: input.commandTarget || null,
      lane: input.lane || null,
      slot: input.slot,
      scope: ''
    });
  }

  function applyEvents(element, events, descriptor, context) {
    if (!domainAllowed(context, 'events')) return;
    const bindings = Object.entries(events || {}).map(([eventName, actionInput]) => {
      const actionRecord = objectRecord(actionInput);
      const command = Object.keys(actionRecord).length
        ? (
            actionRecord.actionId
            || actionRecord.action
            || actionRecord.commandName
            || actionRecord.command
            || actionRecord.id
          )
        : actionInput;
      const normalizedEvent = clampString(eventName);
      return applicationBindingRecord(element, descriptor, context, {
        source: actionRecord,
        slot: `event:${normalizedEvent}`,
        event: normalizedEvent,
        command,
        payload: Object.prototype.hasOwnProperty.call(actionRecord, 'payload')
          ? resolvePayloadValue(actionRecord.payload, context, context.item)
          : '$detail',
        commandTarget: Object.prototype.hasOwnProperty.call(actionRecord, 'target')
          ? resolveValue(actionRecord.target, context, context.item)
          : null,
        lane: Object.prototype.hasOwnProperty.call(actionRecord, 'lane')
          ? resolveValue(actionRecord.lane, context, context.item)
          : null
      });
    });
    storeApplicationBindings(element, 'event', bindings, context);
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
      throw createRendererError(
        'rmt.dom.path.unsafe',
        `Unsicheres DOM-Descriptor-Pfadsegment ${unsafeSegment}`
      );
    }
    return parts;
  }

  function readPath(model, path) {
    const expression = clampString(path, '');
    const expressionParts = assertSafePathSegments(expression);
    const record = objectRecord(model);
    if (Object.prototype.hasOwnProperty.call(record, expression)) return record[expression];
    const ownerKey = Object.keys(record)
      .filter((key) => expression.startsWith(`${key}.`))
      .sort((left, right) => right.length - left.length)[0];
    const parts = ownerKey
      ? assertSafePathSegments(expression.slice(ownerKey.length + 1))
      : expressionParts;
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
        result = Object.create(null);
        if (Array.isArray(source)) {
          source.forEach((entry) => {
            const key = clampString(record.path ? readPath(entry, record.path) : resolveValue(record.key || '$item', { ...context, item: entry }, entry), 'unknown');
            assertSafePathSegments(key);
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
        Object.entries(value).map(([key, entry]) => {
          assertSafePathSegments(key);
          return [key, resolvePayloadValue(entry, context, item)];
        })
      );
    }
    return resolveValue(value, context, item);
  }

  function valueSignature(value) {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return toArray(value).map((entry) => clampString(entry && (entry.command || entry.id || entry.action || entry.name))).join('|');
    }
  }

  function normalizeCommandSpec(spec, descriptor) {
    if (typeof spec === 'string') {
      return {
        command: spec,
        event: 'click',
        payload: descriptor.payload,
        binding: {}
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
      source: record.source,
      binding: record
    };
  }

  function applyCommand(element, descriptor, context) {
    if (!domainAllowed(context, 'events')) return;
    const commandSpecs = toArray(descriptor.commands || descriptor.command)
      .map((spec) => normalizeCommandSpec(spec, descriptor))
      .filter((spec) => spec.command && spec.event);
    const bindings = commandSpecs.map((spec, index) => {
      const source = objectRecord(spec.binding);
      const payload = typeof spec.payload === 'undefined'
        ? {
            value: '$target.value',
            checked: '$target.checked',
            id: '$target.id',
            label: '$target.dataset.label',
            action: '$target.dataset.action',
            dataset: '$target.dataset'
          }
        : resolvePayloadValue(spec.payload, context, context.item);
      return applicationBindingRecord(element, descriptor, context, {
        source: {
          ...source,
          preventDefault: spec.preventDefault,
          stopPropagation: spec.stopPropagation
        },
        slot: `command:${spec.event}:${index}`,
        event: spec.event,
        command: spec.command,
        payload,
        commandTarget: typeof spec.target === 'undefined'
          ? null
          : resolveValue(spec.target, context, context.item),
        lane: typeof spec.lane === 'undefined'
          ? null
          : resolveValue(spec.lane, context, context.item)
      });
    });
    storeApplicationBindings(element, 'command', bindings, context);
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

  function normalizeSlotContentDescriptor(slotContent, context) {
    if (typeof slotContent === 'string') {
      return {
        type: 'slot',
        slot: slotContent
      };
    }
    if (!slotContent || typeof slotContent !== 'object' || Array.isArray(slotContent)) {
      return null;
    }
    if (slotContent.type === 'trusted_html') return slotContent;
    const hasMarkup = Object.prototype.hasOwnProperty.call(slotContent, 'markup');
    const hasHtml = Object.prototype.hasOwnProperty.call(slotContent, 'html');
    if (hasMarkup || hasHtml) {
      if (hasMarkup && hasHtml) {
        throw createRendererError(
          'rmt.dom.slot.markup-ambiguous',
          'Slot-Inhalt darf nicht gleichzeitig markup und html deklarieren.',
          slotContent,
          context
        );
      }
      const fieldName = hasMarkup ? 'markup' : 'html';
      const value = slotContent[fieldName];
      if (typeof value !== 'string') {
        throw createRendererError(
          'rmt.dom.slot.markup-invalid',
          `slots.*.${fieldName} muss fuer normalen Slot-Inhalt ein String sein.`,
          slotContent,
          context
        );
      }
      return {
        type: 'text',
        text: {
          op: 'literal',
          value
        }
      };
    }
    if (slotContent.template) {
      return {
        type: 'template',
        template: slotContent.template
      };
    }
    if (slotContent.descriptor) return slotContent.descriptor;
    if (slotContent.node) return slotContent.node;
    if (slotContent.component || slotContent.tag || slotContent.type) return slotContent;
    if (Object.prototype.hasOwnProperty.call(slotContent, 'text')) {
      return {
        type: 'text',
        text: slotContent.text
      };
    }
    if (Object.prototype.hasOwnProperty.call(slotContent, 'children')) {
      return {
        type: 'fragment',
        children: slotContent.children
      };
    }
    throw createRendererError(
      'rmt.dom.slot.content-invalid',
      'Strukturierter Slot-Inhalt benoetigt descriptor, template oder einen expliziten DOM Descriptor.',
      slotContent,
      context
    );
  }

  function renderSlotContent(slotContent, context, item) {
    const descriptor = normalizeSlotContentDescriptor(slotContent, context);
    return descriptor == null
      ? createFragment(context.documentTarget)
      : renderNode(descriptor, { ...context, item });
  }

  function trustedPolicyReference(descriptor) {
    const policy = descriptor && (
      descriptor.policyRef
      || descriptor.policyId
      || descriptor.trustedPolicy
      || descriptor.policy
    );
    if (policy && typeof policy === 'object') {
      return clampString(policy.ref || policy.id || policy.name, '');
    }
    return clampString(policy, '');
  }

  function validateTrustedHtmlDescriptor(descriptor, context) {
    if (descriptor.trustedBoundary !== TRUSTED_DOM_BOUNDARY) {
      throw createRendererError('rmt.dom.trusted-boundary.missing', 'Trusted HTML benoetigt die explizite Trusted-DOM-Boundary.', descriptor, context);
    }
    const policyRef = trustedPolicyReference(descriptor);
    if (!policyRef) {
      throw createRendererError('rmt.dom.trusted-policy.missing', 'Trusted HTML benoetigt eine explizite policyRef.', descriptor, context);
    }
    if (!/^[a-zA-Z][a-zA-Z0-9._:/-]{0,255}$/u.test(policyRef)) {
      throw createRendererError('rmt.dom.trusted-policy.invalid', `Ungueltige Trusted-DOM-Policy-Referenz ${policyRef}`, descriptor, context);
    }
    if (typeof context.trustedDomRenderer !== 'function') {
      throw createRendererError('rmt.dom.trusted-renderer.missing', 'Trusted HTML benoetigt einen expliziten trustedDomRenderer ausserhalb des Standard-Renderers.', descriptor, context);
    }
    return policyRef;
  }

  function trustedDescriptorSignature(descriptor, policyRef) {
    return valueSignature({
      policyRef,
      resource: descriptor && descriptor.resource,
      html: descriptor && descriptor.html,
      source: descriptor && descriptor.source
    });
  }

  function materializeTrustedHtmlForPreflight(descriptor, context) {
    const policyRef = validateTrustedHtmlDescriptor(descriptor, context);
    let rendered;
    try {
      rendered = context.trustedDomRenderer({
        ...descriptor,
        policyRef
      }, context);
    } catch (error) {
      if (error && error.diagnostic) throw error;
      throw createRendererError(
        'rmt.dom.trusted-renderer.failed',
        error && error.message
          ? `trustedDomRenderer ist fehlgeschlagen: ${error.message}`
          : 'trustedDomRenderer ist fehlgeschlagen.',
        descriptor,
        context
      );
    }
    if (
      !isNodeLike(rendered)
      && (!Array.isArray(rendered) || rendered.some((node) => !isNodeLike(node)))
    ) {
      throw createRendererError('rmt.dom.trusted-renderer.invalid', 'trustedDomRenderer muss Node oder Node[] liefern.', descriptor, context);
    }
    context.trustedDomPreflight.records.push({
      descriptor,
      rendered,
      signature: trustedDescriptorSignature(descriptor, policyRef)
    });
  }

  function renderTrustedHtml(descriptor, context) {
    const policyRef = validateTrustedHtmlDescriptor(descriptor, context);
    if (!domainAllowed(context, 'content') || !domainAllowed(context, 'structure')) {
      return createFragment(context.documentTarget);
    }
    const preflight = context.trustedDomPreflight;
    const record = preflight && preflight.records[preflight.cursor];
    const signature = trustedDescriptorSignature(descriptor, policyRef);
    if (!record || record.descriptor !== descriptor || record.signature !== signature) {
      throw createRendererError(
        'rmt.dom.trusted-preflight.mismatch',
        'Trusted-DOM-Ausgabe fehlt im validierten Commit-Preflight oder stimmt nicht mit dem Descriptor ueberein.',
        descriptor,
        context
      );
    }
    preflight.cursor += 1;
    return record.rendered;
  }

  function validateElementDescriptor(descriptor, context, depth) {
    const tag = clampString(descriptor.tag, 'div');
    if (!SAFE_TAG_NAME.test(tag) || BLOCKED_TAG_NAMES.has(tag.toLowerCase())) {
      throw createRendererError('rmt.dom.tag.unsafe', `Unsicherer oder ungueltiger Tag ${tag}`, descriptor, context);
    }
    [
      ['attributes', descriptor.attributes],
      ['properties', descriptor.properties],
      ['props', descriptor.props],
      ['events', descriptor.events],
      ['styleTokens', descriptor.styleTokens],
      ['styleToken', descriptor.styleToken],
      ['style-token', descriptor['style-token']]
    ].forEach(([fieldName, value]) => {
      if (
        typeof value !== 'undefined'
        && value !== null
        && (typeof value !== 'object' || Array.isArray(value))
      ) {
        throw createRendererError('rmt.dom.descriptor.field-invalid', `${fieldName} muss ein strukturiertes Objekt sein.`, descriptor, context);
      }
    });
    Object.entries(objectRecord(descriptor.attributes)).forEach(([name, value]) => {
      if (name.toLowerCase() === 'style') {
        const styleRecord = value;
        if (!styleRecord || typeof styleRecord !== 'object' || Array.isArray(styleRecord)) {
          throw createRendererError('rmt.dom.style.invalid', 'Style darf nur als strukturiertes Objekt gesetzt werden.', descriptor, context);
        }
        Object.entries(styleRecord).forEach(([styleName, styleValue]) => {
          const normalizedName = clampString(styleName);
          if (!/^(--[a-z0-9-]+|[a-z][a-z0-9-]*)$/u.test(normalizedName)) {
            throw createRendererError('rmt.dom.style.unsafe-name', `Unsicherer Style-Name ${normalizedName}`, descriptor, context);
          }
          if (!isSafeStyleValue(resolveValue(styleValue, context, context.item))) {
            throw createRendererError('rmt.dom.style.unsafe-value', `Unsicherer Style-Wert fuer ${normalizedName}`, descriptor, context);
          }
        });
        return;
      }
      const normalizedName = clampString(name);
      if (!isSafeAttributeName(normalizedName)) {
        throw createRendererError('rmt.dom.attribute.unsafe', `Unsicheres Attribut ${normalizedName}`, descriptor, context);
      }
      const resolvedValue = resolveValue(value, context, context.item);
      if (URL_ATTRIBUTE_NAMES.has(normalizedName.toLowerCase()) && !isSafeUrl(resolvedValue)) {
        throw createRendererError('rmt.dom.attribute.url-unsafe', `Unsichere URL fuer Attribut ${normalizedName}`, descriptor, context);
      }
    });
    const elementShape = {
      localName: tag.toLowerCase()
    };
    Object.entries(objectRecord(descriptor.properties || descriptor.props)).forEach(([name, value]) => {
      const normalizedName = validatePropertyName(elementShape, name, descriptor, context);
      const resolvedValue = resolveValue(value, context, context.item);
      if (URL_PROPERTY_NAMES.has(normalizedName.toLowerCase()) && !isSafeUrl(resolvedValue)) {
        throw createRendererError('rmt.dom.property.url-unsafe', `Unsichere URL fuer Property ${normalizedName}`, descriptor, context);
      }
    });
    normalizeClassTokens([
      descriptor.class,
      descriptor.className,
      descriptor.classes
    ], context, context.item).forEach((token) => {
      if (!/^-?[_a-zA-Z]+[_a-zA-Z0-9-:]*$/u.test(token)) {
        throw createRendererError('rmt.dom.class.unsafe', `Unsichere Klasse ${token}`, descriptor, context);
      }
    });
    normalizePartTokens([descriptor.part, descriptor.parts], context, context.item).forEach((token) => {
      if (!/^[a-z][a-z0-9-]*$/u.test(token)) {
        throw createRendererError('rmt.dom.part.unsafe', `Unsicherer Part ${token}`, descriptor, context);
      }
    });
    Object.entries({
      ...objectRecord(descriptor.styleToken),
      ...objectRecord(descriptor.styleTokens),
      ...objectRecord(descriptor['style-token'])
    }).forEach(([name, value]) => {
      const tokenName = normalizeStyleTokenName(name);
      if (!tokenName) {
        throw createRendererError('rmt.dom.style-token.unsafe-name', `Unsicherer Style-Token ${name}`, descriptor, context);
      }
      if (!isSafeStyleValue(resolveValue(value, context, context.item))) {
        throw createRendererError('rmt.dom.style-token.unsafe-value', `Unsicherer Style-Token-Wert fuer ${tokenName}`, descriptor, context);
      }
    });
    const ref = clampString(resolveValue(descriptor.ref || descriptor.nodeRef, context, context.item));
    if (ref && !/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u.test(ref)) {
      throw createRendererError('rmt.dom.ref.unsafe', `Unsichere Ref ${ref}`, descriptor, context);
    }
    Object.entries(objectRecord(descriptor.events)).forEach(([eventName, actionInput]) => {
      const normalizedEvent = clampString(eventName);
      if (!normalizedEvent || normalizedEvent.toLowerCase().startsWith('on')) {
        throw createRendererError('rmt.dom.event.unsafe', `Unsicherer Event-Name ${normalizedEvent}`, descriptor, context);
      }
      const actionRecord = objectRecord(actionInput);
      const command = Object.keys(actionRecord).length
        ? clampString(
            actionRecord.actionId
            || actionRecord.action
            || actionRecord.commandName
            || actionRecord.command
            || actionRecord.id,
            ''
          )
        : clampString(actionInput, '');
      if (!command) {
        throw createRendererError('rmt.dom.binding.command-missing', `Application Binding fuer ${normalizedEvent} benoetigt ein Command.`, descriptor, context);
      }
      if (actionRecord.bindingId && !/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u.test(clampString(actionRecord.bindingId))) {
        throw createRendererError('rmt.dom.binding.id-unsafe', `Unsichere Binding-ID ${String(actionRecord.bindingId)}`, descriptor, context);
      }
      if (Object.prototype.hasOwnProperty.call(actionRecord, 'payload')) {
        resolvePayloadValue(actionRecord.payload, context, context.item);
      }
    });
    toArray(descriptor.commands || descriptor.command)
      .map((spec) => normalizeCommandSpec(spec, descriptor))
      .filter((spec) => spec.command)
      .forEach((spec) => {
        if (!spec.event || spec.event.toLowerCase().startsWith('on')) {
          throw createRendererError('rmt.dom.event.unsafe', `Unsicherer Event-Name ${spec.event}`, descriptor, context);
        }
        if (spec.binding && spec.binding.bindingId && !/^[a-zA-Z][a-zA-Z0-9_.:-]*$/u.test(clampString(spec.binding.bindingId))) {
          throw createRendererError('rmt.dom.binding.id-unsafe', `Unsichere Binding-ID ${String(spec.binding.bindingId)}`, descriptor, context);
        }
        if (typeof spec.payload !== 'undefined') {
          resolvePayloadValue(spec.payload, context, context.item);
        }
        [spec.source, spec.target, spec.lane].forEach((value) => {
          if (typeof value !== 'undefined') resolveValue(value, context, context.item);
        });
      });
    if (Object.prototype.hasOwnProperty.call(descriptor, 'children')) {
      validateDescriptor(descriptor.children, context, depth + 1);
    }
  }

  function validateDescriptor(descriptor, context, depth = 0) {
    if (depth > 100) {
      throw createRendererError('rmt.dom.descriptor.depth-exceeded', 'DOM Descriptor ueberschreitet die maximal erlaubte Verschachtelung.', {}, context);
    }
    if (descriptor == null || descriptor === false || typeof descriptor === 'string' || typeof descriptor === 'number') return;
    if (isNodeLike(descriptor)) {
      throw createRendererError(
        'rmt.dom.raw-node.unsupported',
        'Native DOM Nodes sind keine Descriptoren und duerfen nur vom expliziten Trusted-DOM-Renderer zurueckgegeben werden.',
        {},
        context
      );
    }
    if (Array.isArray(descriptor)) {
      descriptor.forEach((entry) => validateDescriptor(entry, context, depth + 1));
      return;
    }
    if (typeof descriptor !== 'object') {
      throw createRendererError('rmt.dom.descriptor.invalid', 'DOM Descriptor muss strukturiert sein.', {}, context);
    }
    const nodeType = clampString(
      descriptor.type || (descriptor.component ? 'component' : descriptor.tag ? 'element' : descriptor.template ? 'template' : 'fragment'),
      'fragment'
    );
    if (nodeType === 'element') {
      validateElementDescriptor(descriptor, context, depth);
      return;
    }
    if (nodeType === 'component') {
      validateElementDescriptor(effectiveElementDescriptor(descriptor, context).descriptor, context, depth);
      return;
    }
    if (nodeType === 'text' || nodeType === 'empty' || nodeType === 'fallback') {
      if (nodeType !== 'text') {
        validateDescriptor(descriptor.fallback || descriptor.node || descriptor.children || descriptor.then || null, context, depth + 1);
      }
      return;
    }
    if (nodeType === 'fragment') {
      validateDescriptor(descriptor.children || descriptor.nodes || [], context, depth + 1);
      return;
    }
    if (nodeType === 'when') {
      validateDescriptor(evaluateCondition(descriptor, context) ? descriptor.then : descriptor.else || descriptor.fallback, context, depth + 1);
      return;
    }
    if (nodeType === 'repeat') {
      const sourceValue = resolveValue(descriptor.source, context, context.item);
      const items = Array.isArray(sourceValue) ? sourceValue : [];
      items.forEach((item) => {
        if (descriptor.item) {
          const template = context.templates && context.templates.get(descriptor.item);
          if (!template) {
            throw createRendererError('rmt.dom.template.missing', `RMT Template ${descriptor.item} wurde nicht gefunden.`, descriptor, context);
          }
          validateDescriptor(template.root || template.node || template, { ...context, item }, depth + 1);
        } else {
          validateDescriptor(descriptor.template || descriptor.node || descriptor.children || { type: 'text', text: '$item' }, { ...context, item }, depth + 1);
        }
      });
      return;
    }
    if (nodeType === 'template' || nodeType === 'slot') {
      const templateId = nodeType === 'template'
        ? descriptor.template || descriptor.id
        : (() => {
            const slot = context.slots && context.slots.get(descriptor.slot || descriptor.id);
            return slot && slot.template;
          })();
      const template = context.templates && context.templates.get(templateId);
      if (!template) {
        throw createRendererError('rmt.dom.template.missing', `RMT Template ${templateId} wurde nicht gefunden.`, descriptor, context);
      }
      validateDescriptor(template.root || template.node || template, context, depth + 1);
      return;
    }
    if (nodeType === 'trusted_html') {
      validateTrustedHtmlDescriptor(descriptor, context);
      if (
        context.trustedDomPreflight
        && context.trustedDomPreflight.collecting
        && domainAllowed(context, 'content')
        && domainAllowed(context, 'structure')
      ) {
        materializeTrustedHtmlForPreflight(descriptor, context);
      }
      return;
    }
    if (nodeType === 'rich-text' || nodeType === 'richText') {
      const resolvedSegments = descriptor.segments || resolveValue(descriptor.source, context, context.item);
      const segments = typeof descriptor.source === 'string'
        && descriptor.source.startsWith('$')
        && resolvedSegments === descriptor.source
        ? []
        : toArray(resolvedSegments);
      segments.forEach((segment) => {
        validateDescriptor(projectRichTextSegment(segment), context, depth + 1);
      });
      return;
    }
    throw createRendererError('rmt.dom.node-type.unsupported', `Nicht unterstuetzter DOM Descriptor Type ${nodeType}`, descriptor, context);
  }

  function materializeChildren(element, children, context, item) {
    const target = childContainerFor(element);
    renderKeyed(target, toArray(children), {
      ...context,
      item,
      reconcileMode: true
    });
  }

  function renderElement(descriptor, context) {
    const tag = clampString(descriptor.tag, 'div');
    if (!SAFE_TAG_NAME.test(tag) || BLOCKED_TAG_NAMES.has(tag.toLowerCase())) {
      throw createRendererError('rmt.dom.tag.unsafe', `Unsicherer oder ungueltiger Tag ${tag}`, descriptor, context);
    }
    const namespace = clampString(descriptor.namespace || descriptor.namespaceURI, '');
    const element = namespace && typeof context.documentTarget.createElementNS === 'function'
      ? context.documentTarget.createElementNS(namespace, tag)
      : context.documentTarget.createElement(tag);
    markChanged(context, true);
    if (context.rendererState) context.rendererState.trackedNodes.add(element);
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
    if (
      Object.prototype.hasOwnProperty.call(descriptor, 'text')
      && domainAllowed(context, 'content')
    ) {
      appendNodes(childContainerFor(element), [createText(context.documentTarget, resolveValue(descriptor.text, context, context.item))]);
    }
    if (descriptor.children && domainAllowed(context, 'structure')) {
      materializeChildren(element, descriptor.children, context, context.item);
    }
    rememberOwnedFields(element, descriptor, context);
    return element;
  }

  function publishCleanupFailure(rendererState, node, phase, error) {
    if (!rendererState || typeof rendererState.publishDiagnostic !== 'function') return;
    const diagnostic = createDiagnostic(
      'rmt.dom.dispose.cleanup-failed',
      `Renderer-Cleanup ${phase} ist fehlgeschlagen: ${error && error.message ? error.message : 'unbekannter Fehler'}`,
      {},
      {}
    );
    diagnostic.phase = phase;
    diagnostic.targetTag = elementTagName(node);
    try {
      rendererState.publishDiagnostic(diagnostic);
    } catch (_) {
      // Cleanup must continue even when a diagnostics sink is unavailable.
    }
  }

  function runCleanupStep(rendererState, node, phase, callback) {
    try {
      return callback();
    } catch (error) {
      publishCleanupFailure(rendererState, node, phase, error);
      return undefined;
    }
  }

  function disposeHandle(handle, rendererState, node, phase = 'component-binding') {
    if (!handle || typeof handle !== 'object') return;
    if (rendererState && rendererState.disposedHandles.has(handle)) return;
    if (rendererState) rendererState.disposedHandles.add(handle);
    if (typeof handle.dispose === 'function') {
      runCleanupStep(rendererState, node, phase, () => handle.dispose());
      return;
    }
    if (typeof handle.destroy === 'function') {
      runCleanupStep(rendererState, node, phase, () => handle.destroy());
    }
  }

  function applyComponentBinding(element, component, descriptor, context) {
    const rendererState = context.rendererState;
    const registry = context.componentRegistry;
    const previous = rendererState && rendererState.componentBindings.get(element);
    if (!registry || typeof registry.bindComponentInstance !== 'function') {
      if (context.reconcileMode && previous) {
        rendererState.componentBindings.delete(element);
        disposeHandle(previous.handle, rendererState, element);
        markChanged(context);
      }
      return;
    }
    const signature = JSON.stringify({
      tag: component.tag,
      bindEvents: false
    });
    if (
      previous
      && previous.registry === registry
      && previous.signature === signature
      && previous.stateBridge === context.stateBridge
    ) {
      return;
    }
    if (previous && rendererState) rendererState.componentBindings.delete(element);
    if (previous) disposeHandle(previous.handle, rendererState, element);
    const handle = registry.bindComponentInstance(element, {
      tag: component.tag,
      events: [],
      bindEvents: false,
      stateBridge: context.stateBridge
    }, {
      ...objectRecord(context.componentBindingOptions),
      domRenderer: rendererState && rendererState.renderer,
      bindEvents: false
    });
    if (rendererState) {
      rendererState.componentBindings.set(element, {
        handle,
        registry,
        signature,
        stateBridge: context.stateBridge
      });
    }
    markChanged(context);
  }

  function renderComponent(descriptor, context) {
    const effective = effectiveElementDescriptor(descriptor, context);
    const component = effective.component;
    const element = renderElement(effective.descriptor, context);
    if (descriptor.bindings) {
      setAttributeSafe(element, 'data-rmt-bindings', toArray(descriptor.bindings).join(' '), descriptor, context);
    }
    applyComponentBinding(element, component, descriptor, context);
    rememberOwnedFields(element, effective.descriptor, context);
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

  function createRichTextContainerDescriptor(record, tag, fallbackText = '') {
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
    return descriptor;
  }

  function projectRichTextSegment(segment) {
    const record = objectRecord(segment);
    const kind = clampString(record.kind || record.type, 'text');
    if (kind === 'code') {
      return {
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
      };
    }
    if (kind === 'citation') {
      return {
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
      };
    }
    if (kind === 'paragraph' || kind === 'p') return createRichTextContainerDescriptor(record, 'p');
    if (kind === 'heading' || kind === 'h') {
      const depth = Math.min(6, Math.max(1, Number(record.depth || record.level || 3)));
      return createRichTextContainerDescriptor(record, `h${depth}`);
    }
    if (kind === 'quote' || kind === 'blockquote') return createRichTextContainerDescriptor(record, 'blockquote');
    if (kind === 'inline-code' || kind === 'code-inline') return createRichTextContainerDescriptor(record, 'code');
    if (kind === 'strong' || kind === 'bold') return createRichTextContainerDescriptor(record, 'strong');
    if (kind === 'em' || kind === 'emphasis' || kind === 'italic') return createRichTextContainerDescriptor(record, 'em');
    if (kind === 'delete' || kind === 'del' || kind === 'strike') return createRichTextContainerDescriptor(record, 'del');
    if (kind === 'link') {
      return {
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
      };
    }
    if (kind === 'list' || kind === 'ul' || kind === 'ol') {
      const tag = record.ordered || kind === 'ol' ? 'ol' : 'ul';
      return {
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
      };
    }
    if (kind === 'sources' || kind === 'source-panel') {
      return {
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
      };
    }
    if (kind === 'fragment') {
      return {
        type: 'fragment',
        children: [{
          type: 'rich-text',
          segments: toArray(segmentChildren(record))
        }]
      };
    }
    return {
      type: 'element',
      tag: 'span',
      class: record.class || record.className || '',
      attributes: {
        'data-rmt-rich-segment': kind
      },
      children: segmentChildren(record) ? [{ type: 'rich-text', segments: toArray(segmentChildren(record)) }] : undefined,
      text: segmentChildren(record) ? undefined : record.text || ''
    };
  }

  function renderRichTextSegment(segment, context) {
    return renderNode(projectRichTextSegment(segment), context);
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
      if (!domainAllowed(context, 'structure')) return fragment;
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
      return domainAllowed(context, 'content')
        ? createText(context.documentTarget, descriptor)
        : createFragment(context.documentTarget);
    }
    if (isNodeLike(descriptor)) {
      throw createRendererError(
        'rmt.dom.raw-node.unsupported',
        'Native DOM Nodes sind keine Descriptoren und duerfen nur vom expliziten Trusted-DOM-Renderer zurueckgegeben werden.',
        {},
        context
      );
    }

    const nodeType = clampString(descriptor.type || (descriptor.component ? 'component' : descriptor.tag ? 'element' : descriptor.template ? 'template' : 'fragment'), 'fragment');
    switch (nodeType) {
      case 'text':
        return domainAllowed(context, 'content')
          ? createText(context.documentTarget, resolveValue(descriptor.text, context, context.item))
          : createFragment(context.documentTarget);
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
        return domainAllowed(context, 'structure')
          ? renderRepeat(descriptor, context)
          : createFragment(context.documentTarget);
      case 'rich-text':
      case 'richText':
        return domainAllowed(context, 'structure')
          ? renderRichText(descriptor, context)
          : createFragment(context.documentTarget);
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
        if (!domainAllowed(context, 'structure')) return fragment;
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
    return Array.from(parent && (parent.childNodes || parent.children) || []);
  }

  function reconcileKeyForNode(node, rendererState) {
    const attributeKey = node && typeof node.getAttribute === 'function'
      ? node.getAttribute('data-rmt-key')
      : node && node.attributes && node.attributes['data-rmt-key'];
    if (attributeKey) return String(attributeKey);
    const internalKey = rendererState && rendererState.nodeKeys.get(node);
    return internalKey ? String(internalKey) : '';
  }

  function rememberReconcileKey(node, key, descriptor, context) {
    if (!node) return;
    const normalizedKey = clampString(key, '');
    if (context.rendererState) {
      if (normalizedKey) context.rendererState.nodeKeys.set(node, normalizedKey);
      else context.rendererState.nodeKeys.delete(node);
    }
    if (normalizedKey && node.nodeType === 1) {
      setAttributeSafe(node, 'data-rmt-key', normalizedKey, descriptor, context);
    }
  }

  function nodeNamespace(node) {
    const isElementLike = node && (
      node.nodeType === 1
      || (
        typeof node.setAttribute === 'function'
        && Boolean(elementTagName(node))
      )
    );
    return clampString(node && node.namespaceURI, isElementLike ? HTML_NAMESPACE : '');
  }

  function descriptorNamespace(descriptor) {
    const explicitNamespace = clampString(descriptor && (descriptor.namespace || descriptor.namespaceURI), '');
    if (explicitNamespace) return explicitNamespace;
    const type = descriptor && clampString(
      descriptor.type || (descriptor.component ? 'component' : descriptor.tag ? 'element' : ''),
      ''
    );
    return type === 'element' || type === 'component' ? HTML_NAMESPACE : '';
  }

  function sameNodeKind(existing, descriptor, context) {
    const nextTag = descriptorTagName(descriptor, context);
    if (!nextTag) return false;
    if (nextTag === '#text') return existing && existing.nodeType === 3;
    const isElementLike = existing && (
      existing.nodeType === 1
      || (
        typeof existing.setAttribute === 'function'
        && Boolean(elementTagName(existing))
      )
    );
    if (!isElementLike || elementTagName(existing) !== nextTag) return false;
    const expectedNamespace = descriptorNamespace(descriptor);
    return !expectedNamespace || nodeNamespace(existing) === expectedNamespace;
  }

  function keyForDescriptor(descriptor, context, index) {
    if (!descriptor || typeof descriptor !== 'object') return String(index);
    const directKey = descriptor.key || (descriptor.attributes && descriptor.attributes['data-rmt-key']);
    const resolved = resolveValue(directKey, context, context.item);
    return clampString(resolved, String(index));
  }

  function explicitKeyForDescriptor(descriptor, context) {
    if (!descriptor || typeof descriptor !== 'object') return '';
    const directKey = descriptor.key || (descriptor.attributes && descriptor.attributes['data-rmt-key']);
    return clampString(resolveValue(directKey, context, context.item), '');
  }

  function effectiveElementDescriptor(descriptor, context) {
    if (!descriptor || (descriptor.type !== 'component' && !descriptor.component)) {
      return {
        component: null,
        descriptor
      };
    }
    const component = resolveComponent(descriptor, context);
    const slotChildren = Object.entries(component.slots || {}).map(([slotName, slotContent]) => {
      const contentDescriptor = normalizeSlotContentDescriptor(slotContent, context);
      return {
        type: 'element',
        tag: 'div',
        attributes: slotName === 'default' ? {} : { slot: slotName },
        children: contentDescriptor == null ? [] : [contentDescriptor]
      };
    });
    const descriptorChildren = Object.prototype.hasOwnProperty.call(descriptor, 'children')
      ? toArray(descriptor.children)
      : [];
    return {
      component,
      descriptor: {
        ...descriptor,
        type: 'element',
        tag: component.tag,
        attributes: {
          'data-rmt-component': component.id,
          ...component.attributes,
          ...objectRecord(descriptor.attributes)
        },
        properties: component.properties,
        class: component.classes,
        parts: component.parts,
        styleTokens: component.styleTokens,
        events: component.events,
        ...(
          Object.prototype.hasOwnProperty.call(descriptor, 'children') || slotChildren.length
            ? { children: [...descriptorChildren, ...slotChildren] }
            : {}
        )
      }
    };
  }

  function ownedFieldsFor(descriptor, context) {
    const fields = {
      attributes: new Set(),
      properties: new Set(),
      styles: new Set(),
      ref: '',
      refMap: context.refs,
      content: false,
      contentDomains: new Set()
    };
    if (!descriptor || typeof descriptor !== 'object') return fields;
    if (descriptor.id && domainAllowed(context, 'attributes')) fields.attributes.add('data-rmt-node');
    if (descriptor.key && domainAllowed(context, 'attributes')) fields.attributes.add('data-rmt-key');
    Object.entries(objectRecord(descriptor.attributes)).forEach(([name, value]) => {
      if (name.toLowerCase() === 'style') {
        Object.keys(objectRecord(value)).forEach((styleName) => {
          if (domainAllowed(context, styleDomain(styleName))) fields.styles.add(styleName);
        });
      } else if (domainAllowed(context, attributeDomain(name))) {
        fields.attributes.add(name);
        if (name.toLowerCase() === 'hidden' && resolveValue(value, context, context.item)) {
          fields.attributes.add('data-rmt-hidden-display');
          fields.styles.add('display');
        }
      }
    });
    if (
      domainAllowed(context, 'class')
      && normalizeClassTokens([descriptor.class, descriptor.className, descriptor.classes], context, context.item).length
    ) fields.attributes.add('class');
    if (
      domainAllowed(context, 'part')
      && normalizePartTokens([descriptor.part, descriptor.parts], context, context.item).length
    ) fields.attributes.add('part');
    if (domainAllowed(context, 'styleTokens')) {
      Object.keys({
        ...objectRecord(descriptor.styleToken),
        ...objectRecord(descriptor.styleTokens),
        ...objectRecord(descriptor['style-token'])
      }).forEach((name) => {
        const tokenName = normalizeStyleTokenName(name);
        if (!tokenName) return;
        fields.attributes.add(`data-style-token-${tokenName}`);
        fields.styles.add(`--xtend-${tokenName}`);
      });
    }
    if (domainAllowed(context, 'attributes')) {
      fields.ref = clampString(resolveValue(descriptor.ref || descriptor.nodeRef, context, context.item));
      if (fields.ref) fields.attributes.add('data-rmt-ref');
      if (descriptor.bindings) fields.attributes.add('data-rmt-bindings');
    }
    if (domainAllowed(context, 'properties')) {
      const elementShape = {
        localName: clampString(descriptor.tag, 'div').toLowerCase()
      };
      Object.keys(objectRecord(descriptor.properties || descriptor.props)).forEach((name) => {
        fields.properties.add(validatePropertyName(elementShape, name, descriptor, context));
      });
    }
    if (
      domainAllowed(context, 'content')
      && Object.prototype.hasOwnProperty.call(descriptor, 'text')
    ) fields.contentDomains.add('content');
    if (
      domainAllowed(context, 'structure')
      && Object.prototype.hasOwnProperty.call(descriptor, 'children')
    ) fields.contentDomains.add('structure');
    fields.content = fields.contentDomains.size > 0;
    return fields;
  }

  function rememberOwnedFields(element, descriptor, context) {
    if (!context.rendererState || !element || element.nodeType !== 1) return;
    const next = ownedFieldsFor(descriptor, context);
    const previous = context.rendererState.ownedFields.get(element);
    if (previous && !context.reconcileMode) {
      previous.attributes.forEach((name) => next.attributes.add(name));
      previous.properties.forEach((name) => next.properties.add(name));
      previous.styles.forEach((name) => next.styles.add(name));
      if (!next.ref && previous.ref) {
        next.ref = previous.ref;
        next.refMap = previous.refMap;
      }
      if (previous.contentDomains) {
        previous.contentDomains.forEach((domain) => next.contentDomains.add(domain));
      }
      next.content = next.content || previous.content;
    }
    context.rendererState.ownedFields.set(element, next);
    context.rendererState.trackedNodes.add(element);
  }

  function removeRefOwnership(element, rendererState) {
    const refRecord = rendererState && rendererState.refs.get(element);
    if (!refRecord) return;
    rendererState.refs.delete(element);
    if (
      refRecord.map
      && typeof refRecord.map.get === 'function'
      && typeof refRecord.map.delete === 'function'
      && refRecord.map.get(refRecord.key) === element
    ) {
      refRecord.map.delete(refRecord.key);
    }
  }

  function ownedAttributeDomain(name) {
    const normalizedName = clampString(name).toLowerCase();
    if (normalizedName === 'class') return 'class';
    if (normalizedName === 'part') return 'part';
    if (normalizedName.startsWith('data-style-token-')) return 'styleTokens';
    return attributeDomain(normalizedName);
  }

  function clearStaleOwnedFields(element, nextDescriptor, context) {
    const rendererState = context.rendererState;
    const previous = rendererState && rendererState.ownedFields.get(element);
    if (!previous) return;
    const next = ownedFieldsFor(nextDescriptor, context);
    previous.attributes.forEach((name) => {
      const domain = ownedAttributeDomain(name);
      if (next.attributes.has(name) || !domainAllowed(context, domain)) return;
      if (shouldPreserveActiveInputDraft(element, name, context)) return;
      if (domain === 'class' || domain === 'part' || domain === 'styleTokens') {
        if (attributeValue(element, name) !== null && typeof element.removeAttribute === 'function') {
          element.removeAttribute(name);
          markChanged(context);
        }
        return;
      }
      setAttributeSafe(element, name, null, nextDescriptor, context);
    });
    previous.styles.forEach((name) => {
      if (!next.styles.has(name) && domainAllowed(context, styleDomain(name))) removeStyleValue(element, name, context);
    });
    previous.properties.forEach((name) => {
      if (next.properties.has(name) || !domainAllowed(context, 'properties')) return;
      if (shouldPreserveActiveInputDraft(element, name, context)) return;
      const baselines = rendererState.propertyBaselines.get(element);
      const baseline = baselines && baselines.has(name)
        ? baselines.get(name)
        : (BOOLEAN_PROPERTY_NAMES.has(name) ? false : undefined);
      if (!Object.is(element[name], baseline)) {
        element[name] = baseline;
        markChanged(context);
      }
      if (isSafeAttributeName(name) && attributeValue(element, name) !== null) {
        element.removeAttribute(name);
        markChanged(context);
      }
    });
    if (previous.ref && previous.ref !== next.ref) removeRefOwnership(element, rendererState);
    const previousContentDomains = previous.contentDomains && previous.contentDomains.size
      ? previous.contentDomains
      : new Set(['structure']);
    if (
      previous.content
      && !next.content
      && Array.from(previousContentDomains).every((domain) => domainAllowed(context, domain))
    ) {
      getChildren(childContainerFor(element)).forEach((child) => cleanupNode(child, rendererState));
      replaceChildren(childContainerFor(element), [], context);
    }
  }

  function cleanupNode(node, rendererState) {
    if (!node || !rendererState) return;
    const children = runCleanupStep(
      rendererState,
      node,
      'children',
      () => getChildren(childContainerFor(node))
    ) || [];
    children.forEach((child) => cleanupNode(child, rendererState));
    rendererState.applicationBindings.delete(node);
    rendererState.bindingIds.delete(node);
    const componentBinding = rendererState.componentBindings.get(node);
    if (componentBinding) {
      rendererState.componentBindings.delete(node);
      disposeHandle(componentBinding.handle, rendererState, node);
    }
    runCleanupStep(rendererState, node, 'ref', () => removeRefOwnership(node, rendererState));
    rendererState.ownedFields.delete(node);
    rendererState.propertyBaselines.delete(node);
    rendererState.nodeKeys.delete(node);
    rendererState.trackedNodes.delete(node);
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

  function cleanupFailedCommitNodes(trackedBefore, request, rendererState) {
    Array.from(rendererState.trackedNodes).forEach((node) => {
      if (trackedBefore.has(node)) return;
      if (isWithinTarget(node, request && request.target)) return;
      if (node && node.isConnected === true) return;
      if (rendererState.trackedNodes.has(node)) cleanupNode(node, rendererState);
    });
  }

  function setTextContent(textNode, value, context) {
    if (!domainAllowed(context, 'content')) return;
    const nextValue = String(value == null ? '' : value);
    if (textNode.textContent === nextValue) return;
    textNode.textContent = nextValue;
    markChanged(context);
  }

  function patchExistingElement(element, descriptor, context) {
    if (!element || !descriptor || typeof descriptor !== 'object') return element;
    const effective = effectiveElementDescriptor(descriptor, context);
    const next = effective.descriptor;
    if (context.reconcileMode) clearStaleOwnedFields(element, next, context);
    if (next.id) setAttributeSafe(element, 'data-rmt-node', next.id, next, context);
    if (next.key) setAttributeSafe(element, 'data-rmt-key', resolveValue(next.key, context, context.item), next, context);
    applyAttributes(element, next.attributes || {}, next, context);
    applyProperties(element, next.properties || next.props || {}, next, context);
    applyClassPrimitive(element, next, context);
    applyPartPrimitive(element, next, context);
    applyStyleTokens(element, next, context);
    applyRefPrimitive(element, next, context);
    if (next.bindings && domainAllowed(context, 'attributes')) {
      setAttributeSafe(element, 'data-rmt-bindings', toArray(next.bindings).join(' '), next, context);
    }
    applyEvents(element, next.events || {}, next, context);
    applyCommand(element, next, context);
    if (Object.prototype.hasOwnProperty.call(next, 'text') && domainAllowed(context, 'content')) {
      const target = childContainerFor(element);
      const children = getChildren(target);
      const resolvedText = resolveValue(next.text, context, context.item);
      if (children.length === 1 && children[0] && children[0].nodeType === 3) {
        setTextContent(children[0], resolvedText, context);
      } else if (domainAllowed(context, 'structure')) {
        replaceChildren(target, [createText(context.documentTarget, resolvedText)], context);
        children.forEach((child) => cleanupNode(child, context.rendererState));
      }
    } else if (Object.prototype.hasOwnProperty.call(next, 'children') && domainAllowed(context, 'structure')) {
      materializeChildren(element, next.children, context, context.item);
    }
    if (effective.component) {
      applyComponentBinding(element, effective.component, descriptor, context);
    } else if (context.reconcileMode && context.rendererState) {
      const previousBinding = context.rendererState.componentBindings.get(element);
      if (previousBinding) {
        context.rendererState.componentBindings.delete(element);
        disposeHandle(previousBinding.handle, context.rendererState, element);
        markChanged(context);
      }
    }
    rememberOwnedFields(element, next, context);
    return element;
  }

  function expandChildEntries(descriptors, context, item = context.item) {
    const entries = [];
    toArray(descriptors).forEach((descriptor) => {
      if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor) || isNodeLike(descriptor)) {
        entries.push({ descriptor, context: { ...context, item }, key: '' });
        return;
      }
      const nodeType = clampString(
        descriptor.type || (descriptor.component ? 'component' : descriptor.tag ? 'element' : descriptor.template ? 'template' : 'fragment'),
        'fragment'
      );
      if (nodeType === 'repeat') {
        const sourceValue = resolveValue(descriptor.source, context, item);
        const items = Array.isArray(sourceValue) ? sourceValue : [];
        items.forEach((repeatItem, index) => {
          let childDescriptor = descriptor.template || descriptor.node || descriptor.children || { type: 'text', text: '$item' };
          if (descriptor.item) {
            const template = context.templates && context.templates.get(descriptor.item);
            childDescriptor = template && (template.root || template.node || template);
          }
          const repeatKey = clampString(resolveRepeatKey(descriptor.key, context, repeatItem, index), String(index));
          expandChildEntries(childDescriptor, { ...context, item: repeatItem }, repeatItem).forEach((entry) => {
            entries.push({
              ...entry,
              key: entry.key || repeatKey
            });
          });
        });
        return;
      }
      if (nodeType === 'fragment') {
        entries.push(...expandChildEntries(descriptor.children || descriptor.nodes, { ...context, item }, item));
        return;
      }
      if (nodeType === 'when') {
        entries.push(...expandChildEntries(
          evaluateCondition(descriptor, { ...context, item }) ? descriptor.then : descriptor.else || descriptor.fallback,
          { ...context, item },
          item
        ));
        return;
      }
      entries.push({
        descriptor,
        context: { ...context, item },
        key: explicitKeyForDescriptor(descriptor, { ...context, item })
      });
    });
    return entries;
  }

  function reconcileChildOrder(root, nextNodes, context) {
    const existingChildren = getChildren(root);
    if (!domainAllowed(context, 'structure')) return existingChildren;
    if (
      existingChildren.length === nextNodes.length
      && existingChildren.every((node, index) => node === nextNodes[index])
    ) return;
    const nextSet = new Set(nextNodes);
    const removedNodes = existingChildren.filter((node) => !nextSet.has(node));
    if (typeof root.insertBefore === 'function' && typeof root.removeChild === 'function') {
      nextNodes.forEach((node, index) => {
        const current = getChildren(root)[index] || null;
        if (current !== node) root.insertBefore(node, current);
      });
      getChildren(root).filter((node) => !nextSet.has(node)).forEach((node) => root.removeChild(node));
      removedNodes.forEach((node) => cleanupNode(node, context.rendererState));
      markChanged(context, true);
      return;
    }
    replaceChildren(root, nextNodes, context);
    removedNodes.forEach((node) => cleanupNode(node, context.rendererState));
  }

  function renderKeyed(root, descriptors, context, options = {}) {
    const existingByKey = new Map();
    getChildren(root).forEach((child) => {
      const key = reconcileKeyForNode(child, context.rendererState);
      if (key && !existingByKey.has(String(key))) existingByKey.set(String(key), child);
    });
    const entries = expandChildEntries(descriptors, context);
    const seenKeys = new Set();
    entries.forEach((entry, index) => {
      const key = entry.key || (options.forceKeys ? keyForDescriptor(entry.descriptor, entry.context, index) : '');
      if (!key) return;
      if (seenKeys.has(key)) {
        throw createRendererError('rmt.dom.key.duplicate', `Doppelter DOM-Reconcile-Key ${key}`, entry.descriptor, entry.context);
      }
      seenKeys.add(key);
      entry.key = key;
    });
    const existingChildren = getChildren(root);
    const usedNodes = new Set();
    const nextNodes = [];
    entries.forEach((entry, index) => {
      const descriptor = entry.descriptor;
      const entryContext = entry.context;
      const key = entry.key;
      const existing = existingByKey.get(key);
      const positional = !key ? existingChildren[index] : null;
      const candidate = existing || positional;
      if (candidate && !usedNodes.has(candidate) && sameNodeKind(candidate, descriptor, entryContext)) {
        usedNodes.add(candidate);
        rememberReconcileKey(candidate, key, descriptor, entryContext);
        if (candidate.nodeType === 3) {
          const value = descriptor && typeof descriptor === 'object' && descriptor.type === 'text'
            ? resolveValue(descriptor.text, entryContext, entryContext.item)
            : descriptor;
          setTextContent(candidate, value, entryContext);
          nextNodes.push(candidate);
        } else {
          nextNodes.push(patchExistingElement(candidate, descriptor, {
            ...entryContext,
            reconcileMode: true
          }));
        }
        return;
      }
      const rendered = renderNode(descriptor, {
        ...entryContext,
        reconcileMode: true
      });
      const renderedNodes = rendered && rendered.nodeType === 11 ? getChildren(rendered) : toArray(rendered);
      renderedNodes.forEach((node, renderedIndex) => {
        if (key && node) {
          const nodeKey = renderedIndex === 0 ? key : `${key}:${renderedIndex}`;
          rememberReconcileKey(node, nodeKey, descriptor, entryContext);
        }
        nextNodes.push(node);
      });
    });
    reconcileChildOrder(root, nextNodes, context);
    return nextNodes;
  }

  function createMap(records) {
    return new Map(toArray(records).map((record) => [record.id, record]));
  }

  function createRenderContext(documentTarget, options = {}, diagnosticsRecorder, rendererState = null) {
    let trustedDomRenderer = options.trustedDomRenderer;
    if (!trustedDomRenderer && typeof options.trustedDom === 'function') {
      trustedDomRenderer = options.trustedDom;
      if (rendererState && !rendererState.trustedDomAliasDiagnosed) {
        rendererState.trustedDomAliasDiagnosed = true;
        diagnosticsRecorder.publish(createDiagnostic(
          'rmt.dom.trusted-dom.legacy-alias',
          'trustedDom ist veraltet; verwende trustedDomRenderer.',
          {},
          { source: options.source || {} },
          'info'
        ));
      }
    }
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
      refs: options.refs instanceof Map
        ? options.refs
        : (rendererState ? rendererState.defaultRefs : new Map()),
      dispatchEvent: options.dispatchEvent,
      trustedDomRenderer,
      diagnostics: diagnosticsRecorder.diagnostics,
      publishDiagnostic: diagnosticsRecorder.publish,
      source: options.source || {},
      metadata: options.metadata || null,
      preserveActiveInputDraft: options.preserveActiveInputDraft === true,
      rendererState,
      commitTracker: options.commitTracker || null,
      reconcileMode: Boolean(options.reconcileMode),
      blockedDomains: options.blockedDomains instanceof Set ? options.blockedDomains : new Set(),
      trustedDomPreflight: {
        collecting: false,
        cursor: 0,
        records: []
      }
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
    const defaultContextOptions = {
      ...objectRecord(deps.renderOptions),
      componentRegistry: deps.componentRegistry || deps.registry || (deps.renderOptions && (deps.renderOptions.componentRegistry || deps.renderOptions.registry)),
      registry: deps.registry || (deps.renderOptions && deps.renderOptions.registry),
      trustedDomRenderer: deps.trustedDomRenderer || (deps.renderOptions && deps.renderOptions.trustedDomRenderer),
      trustedDom: deps.trustedDom || (deps.renderOptions && deps.renderOptions.trustedDom)
    };
    const rendererState = {
      applicationBindings: new WeakMap(),
      bindingIds: new WeakMap(),
      bindingScopes: new WeakMap(),
      bindingSequence: 0,
      bindingScopeSequence: 0,
      componentBindings: new WeakMap(),
      defaultRefs: new Map(),
      disposedHandles: new WeakSet(),
      rendererInstanceId: ++rendererInstanceSequence,
      nodeKeys: new WeakMap(),
      ownedFields: new WeakMap(),
      propertyBaselines: new WeakMap(),
      refs: new WeakMap(),
      roots: new Set(),
      trackedNodes: new Set(),
      legacyPatchDiagnosed: false,
      trustedDomAliasDiagnosed: false,
      publishDiagnostic: diagnosticsRecorder.publish,
      renderer: null
    };

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

    function validateCommitRequest(request) {
      if (!request || typeof request !== 'object' || Array.isArray(request)) {
        throw createRendererError('rmt.dom.commit.invalid', 'DOM Commit benoetigt ein strukturiertes Request-Objekt.');
      }
      const operation = clampString(request.operation);
      const operations = new Set([
        'create-node',
        'replace-children',
        'reconcile-children',
        'reconcile-element',
        'merge-element'
      ]);
      if (!operations.has(operation)) {
        throw createRendererError('rmt.dom.commit.operation-unsupported', `Nicht unterstuetzte DOM Commit Operation ${operation || '(leer)'}.`);
      }
      if (operation !== 'create-node') {
        const target = request.target;
        if (!target || typeof target !== 'object') {
          throw createRendererError('rmt.dom.commit.target-invalid', `DOM Commit ${operation} benoetigt ein gueltiges Target.`);
        }
        if (
          (operation === 'replace-children' || operation === 'reconcile-children')
          && typeof target.replaceChildren !== 'function'
          && typeof target.appendChild !== 'function'
        ) {
          throw createRendererError('rmt.dom.commit.target-invalid', `DOM Commit ${operation} benoetigt ein ParentNode-Target.`);
        }
        if (
          (operation === 'reconcile-element' || operation === 'merge-element')
          && !(
            target.nodeType === 1
            || (
              typeof target.setAttribute === 'function'
              && Boolean(elementTagName(target))
            )
          )
        ) {
          throw createRendererError('rmt.dom.commit.target-invalid', `DOM Commit ${operation} benoetigt ein Element-Target.`);
        }
      }
      if (operation === 'reconcile-children' && !Array.isArray(request.descriptors)) {
        throw createRendererError('rmt.dom.commit.descriptors-invalid', 'reconcile-children benoetigt ein descriptors-Array.');
      }
      if (operation !== 'reconcile-children' && !Object.prototype.hasOwnProperty.call(request, 'descriptor')) {
        throw createRendererError('rmt.dom.commit.descriptor-missing', `DOM Commit ${operation} benoetigt einen descriptor.`);
      }
      validateOwnershipPolicy(request.ownership);
      return operation;
    }

    function collectApplicationBindings(roots) {
      const normalizedRoots = toArray(roots).filter(Boolean);
      const records = [];
      rendererState.trackedNodes.forEach((node) => {
        if (!normalizedRoots.some((root) => isWithinTarget(node, root))) return;
        const nodeBindings = rendererState.applicationBindings.get(node);
        if (!nodeBindings) return;
        nodeBindings.forEach((binding) => records.push(binding));
      });
      return records;
    }

    function bindingScopeId(target) {
      if (target && typeof target === 'object') {
        const existing = rendererState.bindingScopes.get(target);
        if (existing) return existing;
        rendererState.bindingScopeSequence += 1;
        const id = `rmt.binding-scope.${rendererState.rendererInstanceId}.${rendererState.bindingScopeSequence}`;
        rendererState.bindingScopes.set(target, id);
        return id;
      }
      rendererState.bindingScopeSequence += 1;
      return `rmt.binding-scope.${rendererState.rendererInstanceId}.${rendererState.bindingScopeSequence}`;
    }

    function bindingExists(records, expected) {
      return records.some((record) => record.id === expected.id && record.target === expected.target);
    }

    function createBindingCommitState(operation, request, nodes, previousBindings) {
      const scopeTarget = request.target || nodes[0] || null;
      const roots = operation === 'create-node'
        ? nodes.filter(Boolean)
        : (request.target ? [request.target] : []);
      const id = bindingScopeId(scopeTarget);
      const current = collectApplicationBindings(roots).map((binding) => Object.freeze({
        ...binding,
        scope: id
      }));
      const removedBindings = previousBindings
        .filter((binding) => !bindingExists(current, binding))
        .map((binding) => Object.freeze({
          bindingId: binding.id,
          target: binding.target
        }));
      return {
        bindings: Object.freeze(current),
        bindingScope: Object.freeze({
          schema: RMT_DOM_BINDING_SCOPE_SCHEMA,
          id,
          target: scopeTarget,
          roots: Object.freeze(roots.slice()),
          complete: true,
          bindingIds: Object.freeze(current.map((binding) => binding.id)),
          removedBindings: Object.freeze(removedBindings)
        })
      };
    }

    function commit(request, internalOptions = {}) {
      return runWithDiagnostics(() => {
        const trackedBefore = new Set(rendererState.trackedNodes);
        const operation = validateCommitRequest(request);
        const previousBindings = operation === 'create-node'
          ? []
          : collectApplicationBindings(request.target ? [request.target] : []);
        const diagnosticsStart = diagnosticsRecorder.diagnostics.length;
        const tracker = {
          changed: false,
          structural: false
        };
        const contextOptions = {
          ...defaultContextOptions,
          ...objectRecord(request.context),
          commitTracker: tracker,
          reconcileMode: operation === 'reconcile-children' || operation === 'reconcile-element'
        };
        const context = createRenderContext(documentTarget, contextOptions, diagnosticsRecorder, rendererState);
        const descriptorInput = operation === 'reconcile-children' ? request.descriptors : request.descriptor;
        context.blockedDomains = resolveOwnership(request.ownership, descriptorInput, context, operation);
        validateDescriptor(descriptorInput, context);
        context.trustedDomPreflight.collecting = true;
        try {
          validateDescriptor(descriptorInput, context);
        } finally {
          context.trustedDomPreflight.collecting = false;
        }
        if (operation === 'reconcile-children') {
          const seenKeys = new Set();
          expandChildEntries(request.descriptors, context).forEach((entry) => {
            const key = entry.key;
            if (!key) return;
            if (seenKeys.has(key)) {
              throw createRendererError('rmt.dom.key.duplicate', `Doppelter DOM-Reconcile-Key ${key}`, entry.descriptor, entry.context);
            }
            seenKeys.add(key);
          });
        }
        if (
          operation === 'reconcile-element'
          && !sameNodeKind(request.target, request.descriptor, context)
        ) {
          throw createRendererError(
            'rmt.dom.commit.target-kind-mismatch',
            'reconcile-element kann Tag oder Namespace des Zielknotens nicht austauschen.',
            request.descriptor,
            context
          );
        }

        let nodes = [];
        try {
          const operationOwnsStructure = (
            operation === 'create-node'
            || operation === 'replace-children'
            || operation === 'reconcile-children'
          );
          if (operationOwnsStructure && !domainAllowed(context, 'structure')) {
            nodes = operation === 'create-node' ? [] : getChildren(request.target);
          } else if (operation === 'create-node') {
            const rendered = renderNode(request.descriptor, context);
            nodes = rendered && rendered.nodeType === 11 ? getChildren(rendered) : toArray(rendered).filter(Boolean);
            tracker.changed = nodes.length > 0;
            tracker.structural = nodes.length > 0;
          } else if (operation === 'replace-children') {
            const rendered = renderNode(request.descriptor, context);
            nodes = rendered && rendered.nodeType === 11 ? getChildren(rendered) : toArray(rendered).filter(Boolean);
            const nextSet = new Set(nodes);
            const removedNodes = getChildren(request.target).filter((node) => !nextSet.has(node));
            replaceChildren(request.target, nodes, context);
            removedNodes.forEach((node) => cleanupNode(node, rendererState));
            rendererState.roots.add(request.target);
          } else if (operation === 'reconcile-children') {
            nodes = renderKeyed(request.target, request.descriptors, context, {
              forceKeys: Boolean(request.forceKeys)
            });
            rendererState.roots.add(request.target);
          } else {
            nodes = [patchExistingElement(request.target, request.descriptor, context)];
            rendererState.roots.add(request.target);
          }
          if (internalOptions.markRenderedShell === true && request.target) {
            const markerDescriptor = {
              type: 'element',
              tag: elementTagName(request.target) || 'div'
            };
            setAttributeSafe(
              request.target,
              'data-rmt-rendered-shell',
              'true',
              markerDescriptor,
              context
            );
            setAttributeSafe(
              request.target,
              'data-rmt-renderer-schema',
              RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
              markerDescriptor,
              context
            );
          }
        } catch (error) {
          cleanupFailedCommitNodes(trackedBefore, request, rendererState);
          if (error && error.diagnostic) throw error;
          const diagnostic = createDiagnostic(
            'rmt.dom.commit.native-error',
            error && error.message ? error.message : 'Native DOM-Mutation ist fehlgeschlagen.',
            request.descriptor || {},
            context
          );
          if (error && typeof error === 'object') {
            error.code = error.code || diagnostic.code;
            error.diagnostic = diagnostic;
            throw error;
          }
          const wrappedError = new Error(diagnostic.message);
          wrappedError.code = diagnostic.code;
          wrappedError.diagnostic = diagnostic;
          throw wrappedError;
        }
        const bindingState = createBindingCommitState(operation, request, nodes, previousBindings);
        return {
          schema: RMT_DOM_COMMIT_RESULT_SCHEMA,
          operation,
          target: request.target || null,
          nodes,
          nodeCount: nodes.length,
          changed: tracker.changed,
          structural: tracker.structural,
          bindings: bindingState.bindings,
          bindingScope: bindingState.bindingScope,
          diagnostics: diagnosticsRecorder.diagnostics.slice(diagnosticsStart),
          metadata: Object.prototype.hasOwnProperty.call(request, 'metadata')
            ? request.metadata
            : (typeof context.metadata === 'undefined' ? null : context.metadata)
        };
      });
    }

    function dispose(target, options = {}) {
      const clearOwnedDom = Boolean(options && options.clearOwnedDom);
      if (target) {
        cleanupNode(target, rendererState);
        rendererState.roots.delete(target);
        if (clearOwnedDom && (typeof target.replaceChildren === 'function' || typeof target.removeChild === 'function')) {
          runCleanupStep(rendererState, target, 'clear-owned-dom', () => replaceChildren(target, []));
          if (typeof target.removeAttribute === 'function') {
            runCleanupStep(rendererState, target, 'clear-owned-markers', () => {
              target.removeAttribute('data-rmt-rendered-shell');
              target.removeAttribute('data-rmt-renderer-schema');
            });
          }
        }
        return;
      }
      Array.from(rendererState.trackedNodes).forEach((node) => cleanupNode(node, rendererState));
      if (clearOwnedDom) {
        Array.from(rendererState.roots).forEach((root) => {
          runCleanupStep(rendererState, root, 'clear-owned-dom', () => replaceChildren(root, []));
          if (typeof root.removeAttribute === 'function') {
            runCleanupStep(rendererState, root, 'clear-owned-markers', () => {
              root.removeAttribute('data-rmt-rendered-shell');
              root.removeAttribute('data-rmt-renderer-schema');
            });
          }
        });
      }
      rendererState.roots.clear();
    }

    const renderer = {
      schema: RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
      trustedDomBoundary: TRUSTED_DOM_BOUNDARY,
      commit,
      dispose,
      render(root, descriptor, options = {}) {
        if (!root || typeof root.replaceChildren !== 'function') {
          return runWithDiagnostics(() => {
            throw createRendererError('rmt.dom.root.invalid', 'RMT Render Root benoetigt replaceChildren().', descriptor, {
              source: options.source || {}
            });
          });
        }
        const result = commit({
          operation: 'replace-children',
          target: root,
          descriptor,
          context: options
        }, {
          markRenderedShell: true
        });
        return {
          schema: 'xtend.epic18.rmt-dom-render-result.v1',
          root,
          nodeCount: result.nodeCount,
          bindings: result.bindings,
          bindingScope: result.bindingScope,
          diagnostics: diagnosticsRecorder.diagnostics.slice()
        };
      },
      renderNode(descriptor, options = {}) {
        const result = commit({
          operation: 'create-node',
          descriptor,
          context: options
        });
        if (result.nodes.length === 1) return result.nodes[0];
        const fragment = createFragment(documentTarget);
        appendNodes(fragment, result.nodes);
        return fragment;
      },
      renderKeyed(root, descriptors, options = {}) {
        return commit({
          operation: 'reconcile-children',
          target: root,
          descriptors,
          context: options,
          forceKeys: true
        }).nodes;
      },
      patchElement(element, descriptor, options = {}) {
        if (!rendererState.legacyPatchDiagnosed) {
          rendererState.legacyPatchDiagnosed = true;
          diagnosticsRecorder.publish(createDiagnostic(
            'rmt.dom.patch-element.legacy-merge',
            'patchElement() verwendet die veraltete Merge-Semantik; verwende commit({ operation: \"merge-element\" }).',
            descriptor,
            { source: options.source || {} },
            'info'
          ));
        }
        return commit({
          operation: 'merge-element',
          target: element,
          descriptor,
          context: options
        }).target;
      },
      resolveValue(value, options = {}) {
        return runWithDiagnostics(() => {
          const context = createRenderContext(documentTarget, {
            ...defaultContextOptions,
            ...options
          }, diagnosticsRecorder, rendererState);
          return resolveValue(value, context, options.item);
        });
      },
      resolveClasses(value, options = {}) {
        return [...new Set(normalizeClassTokens(value, { ...defaultContextOptions, ...options }, options.item))];
      },
      createNoManualHtmlGate,
      isUrlAllowed(value) {
        return isSafeUrl(value);
      },
      listDiagnostics() {
        return diagnosticsRecorder.diagnostics.slice();
      }
    };
    rendererState.renderer = renderer;
    return Object.freeze(renderer);
  }

  const api = {
    RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA,
    RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA,
    RMT_DOM_COMMIT_RESULT_SCHEMA,
    RMT_DOM_APPLICATION_BINDING_SCHEMA,
    RMT_DOM_BINDING_SCOPE_SCHEMA,
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
export const RMT_DOM_COMMIT_RESULT_SCHEMA = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.RMT_DOM_COMMIT_RESULT_SCHEMA;
export const RMT_DOM_APPLICATION_BINDING_SCHEMA = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.RMT_DOM_APPLICATION_BINDING_SCHEMA;
export const RMT_DOM_BINDING_SCOPE_SCHEMA = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.RMT_DOM_BINDING_SCOPE_SCHEMA;
export const TRUSTED_DOM_BOUNDARY = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.TRUSTED_DOM_BOUNDARY;
export const createNoManualHtmlGate = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.createNoManualHtmlGate;
export const createRmtDomDescriptorRenderer = __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__.createRmtDomDescriptorRenderer;

export default __XTEND_RMT_DOM_DESCRIPTOR_RENDERER_API__;

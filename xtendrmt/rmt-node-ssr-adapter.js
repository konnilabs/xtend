import { Readable } from 'node:stream';
import { createRmtComponentCapabilityRegistry } from './rmt-component-capability-registry.js';
import { createRmtDomDescriptorRenderer } from './rmt-dom-descriptor-renderer.js';

export const RMT_NODE_SSR_ADAPTER_SCHEMA = 'xtend.rmt.node-ssr-adapter.v1';
export const RMT_NODE_SSR_RENDER_RESULT_SCHEMA = 'xtend.rmt.node-ssr-render-result.v1';
export const RMT_NODE_SSR_JSONL_FRAME_SCHEMA = 'xtend.rmt.node-ssr-jsonl-frame.v1';
export const RMT_NODE_SSR_DIAGNOSTIC_SCHEMA = 'xtend.rmt.node-ssr-diagnostic.v1';
export const RMT_NODE_SSR_HYDRATION_SCHEMA = 'xtend.rmt.node-ssr-hydration-payload.v1';
export const RMT_NODE_SSR_CHUNK_KIND = 'renderman_template_chunk';
export const RMT_NODE_SSR_RESPONSE_KIND = 'renderman_template_prerender_response';
export const RMT_NODE_SSR_EXECUTION_MODE = 'server_prerender_hydrate';
export const RMT_NODE_SSR_STREAMING_CONTRACT_SCHEMA = 'xtend.rmt.vnext-streaming-contract.v1';
export const RMT_NODE_SSR_KERNEL_BOUNDARY = 'no-rmt-kernel-import-of-xtend-types';
export const RMT_SSR_CSP_POLICY_SCHEMA = 'xtend.rmt.ssr-csp-policy.v1';
export const RMT_SSR_CSP_HEADER = 'Content-Security-Policy';

const BLOCKING_SEVERITIES = new Set(['error', 'fatal']);
const TRUST_BOUNDARY_TOKENS = new Set([
  'xtend.security.trusted-dom-boundary.v1',
  'xtend.security.sanitizing-boundary.v1',
  'xtend.security.streaming-boundary.v1',
  'trusted',
  'sanitized',
  'host-sanitized'
]);
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'poster', 'xlink:href']);
const BLOCKED_ATTRIBUTES = new Set(['srcdoc']);
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);
const BLOCKED_MARKUP_TAGS = new Set(['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'base', 'link', 'meta', 'form', 'style', 'svg', 'math', 'template']);
const BLOCKED_MARKUP_TAG_PATTERN = [...BLOCKED_MARKUP_TAGS].join('|');
const DEFAULT_SSR_CSP_DIRECTIVES = Object.freeze({
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'worker-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'self'"],
  'form-action': ["'self'"]
});

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === false) return [];
  return [value];
}

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function stableString(value, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return fallback;
}

function safeIdentifier(value, fallback = 'rmt-node-ssr') {
  const normalized = stableString(value, '').trim().replace(/[^a-zA-Z0-9_.:-]+/gu, '-').replace(/^-+|-+$/gu, '');
  return normalized || fallback;
}

function escapeHtml(value) {
  return stableString(value, '').replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return character;
    }
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/gu, '&#96;');
}

function isSafeTagName(tagName) {
  return /^[a-z][a-z0-9._:-]*$/u.test(stableString(tagName, '').toLowerCase());
}

function normalizeTagName(tagName, diagnostics, context) {
  const normalized = stableString(tagName, '').trim().toLowerCase();
  if (isSafeTagName(normalized) && !BLOCKED_MARKUP_TAGS.has(normalized)) return normalized;
  diagnostics.publish('rmt.node_ssr.tag_blocked', `Blocked unsafe tag "${stableString(tagName, '<empty>')}".`, 'error', context);
  return 'div';
}

function normalizeAttributeName(name) {
  return stableString(name, '').trim().toLowerCase();
}

function isSafeAttributeName(name) {
  return /^[a-z_:][a-z0-9_.:-]*$/u.test(name);
}

function isSafeUrl(value) {
  const raw = stableString(value, '').trim();
  if (!raw) return true;
  const compact = raw.replace(/[\u0000-\u001F\u007F\s]+/gu, '').toLowerCase();
  if (compact.startsWith('#') || compact.startsWith('/') || compact.startsWith('./') || compact.startsWith('../')) return true;
  if (compact.startsWith('http://') || compact.startsWith('https://') || compact.startsWith('mailto:') || compact.startsWith('tel:') || compact.startsWith('blob:')) return true;
  if (compact.startsWith('data:image/')) return true;
  if (/^[a-z][a-z0-9+.-]*:/u.test(compact)) return false;
  return true;
}

function normalizeCspDirectiveValues(value) {
  if (value === false || value == null) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => normalizeCspDirectiveValues(entry));
  return stableString(value, '').split(/\s+/u).map((entry) => entry.trim()).filter(Boolean);
}

function mergeCspDirectives(...records) {
  const directives = {};
  records.forEach((record) => {
    Object.entries(objectRecord(record)).forEach(([name, value]) => {
      const directiveName = normalizeAttributeName(name);
      if (!directiveName) return;
      const values = normalizeCspDirectiveValues(value);
      if (values.length === 0) {
        directives[directiveName] = [];
        return;
      }
      directives[directiveName] = [...new Set([...(directives[directiveName] || []), ...values])];
    });
  });
  return directives;
}

function serializeCspDirectives(directives) {
  return Object.entries(objectRecord(directives))
    .filter(([name]) => normalizeAttributeName(name))
    .map(([name, values]) => {
      const normalizedValues = normalizeCspDirectiveValues(values);
      return normalizedValues.length ? `${normalizeAttributeName(name)} ${normalizedValues.join(' ')}` : normalizeAttributeName(name);
    })
    .join('; ');
}

function createSsrCspPolicy(options = {}) {
  const headerPolicy = Object.entries(objectRecord(options.headers)).find(([name]) => normalizeAttributeName(name) === normalizeAttributeName(RMT_SSR_CSP_HEADER));
  const explicitPolicy = options.contentSecurityPolicy || options.cspPolicy || options.csp || (headerPolicy && headerPolicy[1]);
  if (typeof explicitPolicy === 'string' && explicitPolicy.trim()) {
    return {
      schema: RMT_SSR_CSP_POLICY_SCHEMA,
      mode: 'host-supplied',
      header: explicitPolicy.trim(),
      directives: {},
      managedBy: RMT_NODE_SSR_ADAPTER_SCHEMA,
      automatic: true
    };
  }
  const explicitDirectives = explicitPolicy && typeof explicitPolicy === 'object'
    ? explicitPolicy.directives || explicitPolicy
    : {};
  const directives = mergeCspDirectives(DEFAULT_SSR_CSP_DIRECTIVES, explicitDirectives, options.cspDirectives);
  return {
    schema: RMT_SSR_CSP_POLICY_SCHEMA,
    mode: 'framework-default',
    header: serializeCspDirectives(directives),
    directives,
    managedBy: RMT_NODE_SSR_ADAPTER_SCHEMA,
    automatic: true
  };
}

function hasHeader(headers, headerName) {
  const normalizedHeaderName = normalizeAttributeName(headerName);
  return Object.keys(objectRecord(headers)).some((name) => normalizeAttributeName(name) === normalizedHeaderName);
}

function createSsrSecurityHeaders(cspPolicy, headers = {}) {
  const mergedHeaders = { ...objectRecord(headers) };
  if (!hasHeader(mergedHeaders, RMT_SSR_CSP_HEADER)) {
    mergedHeaders[RMT_SSR_CSP_HEADER] = cspPolicy.header;
  }
  return mergedHeaders;
}

function createDiagnostic(code, message, severity = 'error', details = {}) {
  let safeDetails = {};
  if (details && typeof details === 'object') {
    safeDetails = JSON.parse(JSON.stringify(details, (key, value) => {
      if (typeof value === 'function') return undefined;
      if (value instanceof Map) return [...value.entries()];
      if (value instanceof Set) return [...value.values()];
      if (key === 'options' || key === 'diagnostics' || key === 'componentRegistry') return undefined;
      return value;
    }));
  }
  return {
    schema: RMT_NODE_SSR_DIAGNOSTIC_SCHEMA,
    code,
    severity,
    message,
    ...safeDetails
  };
}

function createDiagnosticsCollector(options = {}) {
  const diagnostics = [];
  return {
    diagnostics,
    publish(code, message, severity = 'error', details = {}) {
      const diagnostic = createDiagnostic(code, message, severity, details);
      diagnostics.push(diagnostic);
      if (typeof options.publishDiagnostic === 'function') {
        options.publishDiagnostic(diagnostic);
      }
      return diagnostic;
    },
    pushMany(entries) {
      asArray(entries).forEach((entry) => {
        if (!entry) return;
        if (entry.schema === RMT_NODE_SSR_DIAGNOSTIC_SCHEMA) {
          diagnostics.push(entry);
        } else {
          diagnostics.push(createDiagnostic(
            entry.code || 'rmt.node_ssr.upstream_diagnostic',
            entry.message || 'Upstream RMT diagnostic.',
            entry.severity || 'warning',
            { upstream: cloneJson(entry) }
          ));
        }
      });
    }
  };
}

function createValueResolver() {
  const renderer = createRmtDomDescriptorRenderer({
    documentTarget: {
      createElement: () => ({}),
      createTextNode: (text) => ({ nodeType: 3, textContent: stableString(text, '') }),
      createDocumentFragment: () => ({ nodeType: 11, childNodes: [] })
    }
  });
  return (value, context = {}) => renderer.resolveValue(value, context);
}

function hasTrustBoundary(record, options = {}) {
  const candidates = asArray(record && (record.trustBoundary || record.trust || record.securityBoundary || record.sanitizer));
  const optionCandidates = asArray(options.trustBoundary || options.defaultTrustBoundary);
  return [...candidates, ...optionCandidates].some((entry) => TRUST_BOUNDARY_TOKENS.has(stableString(entry, '').trim()));
}

function fallbackSanitizeHtml(html, diagnostics, context) {
  let sanitized = stableString(html, '');
  const before = sanitized;
  sanitized = sanitized.replace(new RegExp(`<(${BLOCKED_MARKUP_TAG_PATTERN})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, 'giu'), '');
  sanitized = sanitized.replace(new RegExp(`<\\/?(${BLOCKED_MARKUP_TAG_PATTERN})\\b[^>]*>`, 'giu'), '');
  sanitized = sanitized.replace(/\s+on[a-z0-9_-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/giu, '');
  sanitized = sanitized.replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/giu, '');
  sanitized = sanitized.replace(/\s+(href|src|action|formaction|poster|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/giu, (match, name, rawValue) => {
    const value = rawValue.replace(/^['"]|['"]$/gu, '');
    return isSafeUrl(value) ? match : '';
  });
  if (before !== sanitized) {
    diagnostics.publish(
      'rmt.node_ssr.html_sanitized',
      'Unsafe server markup was sanitized by the Node SSR adapter fallback sanitizer.',
      'warning',
      context
    );
  }
  return sanitized;
}

function sanitizeHtmlFragment(html, diagnostics, context, options = {}) {
  if (!hasTrustBoundary(context && context.descriptor, options)) {
    diagnostics.publish(
      'rmt.node_ssr.trust_boundary_missing',
      'HTML fragments require an explicit XTend trust boundary or host sanitizer.',
      'error',
      context
    );
  }
  if (typeof options.sanitizeHtmlOutput === 'function') {
    return stableString(options.sanitizeHtmlOutput(stableString(html, ''), { ...context, diagnostics: diagnostics.diagnostics }), '');
  }
  return fallbackSanitizeHtml(html, diagnostics, context);
}

function serializeAttribute(name, value, diagnostics, context) {
  const attrName = normalizeAttributeName(name);
  if (!attrName || !isSafeAttributeName(attrName)) {
    diagnostics.publish('rmt.node_ssr.attribute_blocked', `Blocked invalid attribute "${stableString(name, '<empty>')}".`, 'error', context);
    return '';
  }
  if (attrName.startsWith('on') || BLOCKED_ATTRIBUTES.has(attrName)) {
    diagnostics.publish('rmt.node_ssr.attribute_blocked', `Blocked unsafe attribute "${attrName}".`, 'error', context);
    return '';
  }
  if (value == null || value === false) return '';
  if (URL_ATTRIBUTES.has(attrName) && !isSafeUrl(value)) {
    diagnostics.publish('rmt.node_ssr.url_blocked', `Blocked unsafe URL in "${attrName}".`, 'error', { ...context, attribute: attrName });
    return '';
  }
  if (value === true) return ` ${attrName}="true"`;
  if (typeof value === 'object') {
    return ` ${attrName}="${escapeAttribute(JSON.stringify(value))}"`;
  }
  return ` ${attrName}="${escapeAttribute(value)}"`;
}

function mergeAttributes(...records) {
  return Object.assign({}, ...records.map(objectRecord));
}

function serializeAttributes(attributes, diagnostics, context) {
  return Object.entries(objectRecord(attributes))
    .map(([name, value]) => serializeAttribute(name, value, diagnostics, context))
    .join('');
}

function normalizeDescriptor(input) {
  if (Array.isArray(input)) return { type: 'fragment', children: input };
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') return { type: 'text', text: input };
  if (!input || typeof input !== 'object') return { type: 'empty' };
  if (input.descriptor) return normalizeDescriptor(input.descriptor);
  if (input.domDescriptor) return normalizeDescriptor(input.domDescriptor);
  if (input.type || input.kind || input.tag || input.component || input.html || input.text || input.children || input.nodes) return input;
  return { type: 'empty' };
}

function descriptorWithSlot(descriptor, slotName) {
  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
    return {
      type: 'element',
      tag: 'span',
      attributes: { slot: slotName },
      children: [descriptor]
    };
  }
  if (descriptor.text != null && !descriptor.type && !descriptor.tag && !descriptor.component) {
    return {
      type: 'element',
      tag: 'span',
      attributes: {
        ...objectRecord(descriptor.attributes),
        slot: descriptor.slot || objectRecord(descriptor.attributes).slot || slotName
      },
      children: [{ type: 'text', text: descriptor.text }]
    };
  }
  return {
    ...descriptor,
    attributes: {
      ...objectRecord(descriptor.attributes),
      slot: descriptor.slot || objectRecord(descriptor.attributes).slot || slotName
    }
  };
}

function resolveComponentDescriptor(descriptor, registry, diagnostics, context) {
  const tag = descriptor.tag || descriptor.componentTag || descriptor.host || descriptor.component || descriptor.ref || 'div';
  const capability = registry && typeof registry.resolveComponentCapability === 'function'
    ? registry.resolveComponentCapability(tag) || registry.resolveComponentCapability(descriptor.component)
    : null;
  const built = capability && typeof registry.buildComponentDescriptor === 'function'
    ? registry.buildComponentDescriptor({
        ...descriptor,
        tag: capability.tag,
        component: descriptor.component || capability.tag,
        id: descriptor.id || descriptor.key || capability.tag
      }, { source: context.source || null })
    : null;
  if (capability && context.componentCapabilities && !context.componentCapabilities.has(capability.tag)) {
    context.componentCapabilities.set(capability.tag, {
      tag: capability.tag,
      family: capability.family,
      visualKind: capability.visualKind,
      modulePath: capability.modulePath,
      slots: asArray(capability.slots),
      parts: asArray(capability.parts),
      events: asArray(capability.events),
      importPolicy: capability.importPolicy,
      kernelBoundary: capability.kernelBoundary
    });
  }
  if (!capability && tag && String(tag).startsWith('x-')) {
    diagnostics.publish(
      'rmt.node_ssr.component_capability_missing',
      `No XTend component capability metadata was available for "${tag}".`,
      'warning',
      { tag, source: context.source || null }
    );
  }
  return {
    descriptor: built || descriptor,
    capability
  };
}

function serializeElementLike(descriptor, context) {
  const tag = normalizeTagName(descriptor.tag || descriptor.element || 'div', context.diagnostics, context);
  const attributes = mergeAttributes(descriptor.attributes, descriptor.attrs);
  const children = asArray(descriptor.children || descriptor.nodes || descriptor.childNodes);
  const open = `<${tag}${serializeAttributes(attributes, context.diagnostics, { ...context, tag })}>`;
  if (VOID_TAGS.has(tag)) return open;
  return `${open}${children.map((child, index) => serializeDescriptor(child, { ...context, source: { ...(context.source || {}), index } })).join('')}</${tag}>`;
}

function serializeComponent(descriptor, context) {
  const registryResult = resolveComponentDescriptor(descriptor, context.componentRegistry, context.diagnostics, context);
  const componentDescriptor = registryResult.descriptor;
  const capability = registryResult.capability || componentDescriptor.capability || null;
  const tag = normalizeTagName(componentDescriptor.tag || descriptor.tag || 'div', context.diagnostics, context);
  const partList = [
    ...asArray(componentDescriptor.parts),
    ...asArray(descriptor.parts || descriptor.part)
  ].filter(Boolean);
  const eventAttributes = Object.fromEntries(Object.entries(objectRecord(componentDescriptor.events || descriptor.events || descriptor.eventBindings))
    .map(([eventName, action]) => [`data-rmt-event-${safeIdentifier(eventName, 'event')}`, stableString(action, '')]));
  const propertyAttributes = Object.fromEntries(Object.entries(objectRecord(componentDescriptor.properties || componentDescriptor.props || descriptor.properties || descriptor.props))
    .filter(([, value]) => value == null || typeof value !== 'function')
    .map(([name, value]) => {
      if (value != null && typeof value === 'object') return [`data-rmt-prop-${safeIdentifier(name, 'prop')}`, JSON.stringify(value)];
      return [name, value];
    }));
  const attributes = mergeAttributes(
    componentDescriptor.attributes,
    descriptor.attributes,
    propertyAttributes,
    {
      'data-rmt-node-ssr': 'true',
      'data-rmt-component-capability': capability && capability.tag || tag,
      'data-rmt-component-family': capability && capability.family || componentDescriptor.attributes && componentDescriptor.attributes['data-rmt-component-family'],
      'data-rmt-lazy-import': capability && capability.modulePath || componentDescriptor.attributes && componentDescriptor.attributes['data-rmt-lazy-import']
    },
    eventAttributes
  );
  if (partList.length) attributes.part = [...new Set(partList.map((entry) => stableString(entry, '').trim()).filter(Boolean))].join(' ');
  const slotChildren = Object.entries(objectRecord(componentDescriptor.slots || descriptor.slots))
    .flatMap(([slotName, slotValue]) => asArray(slotValue).map((entry) => descriptorWithSlot(entry, slotName)));
  const children = [
    ...slotChildren,
    ...asArray(componentDescriptor.children || componentDescriptor.nodes || descriptor.children || descriptor.nodes)
  ];
  const open = `<${tag}${serializeAttributes(attributes, context.diagnostics, { ...context, tag, capability: capability && capability.tag || tag })}>`;
  return `${open}${children.map((child, index) => serializeDescriptor(child, { ...context, source: { ...(context.source || {}), index } })).join('')}</${tag}>`;
}

function serializeDescriptor(descriptorInput, context) {
  const descriptor = normalizeDescriptor(descriptorInput);
  const type = stableString(descriptor.type || descriptor.kind || (descriptor.component || descriptor.componentTag ? 'component' : descriptor.tag ? 'element' : descriptor.html ? 'html' : descriptor.text != null ? 'text' : 'fragment'), 'fragment');
  if (type === 'empty') return '';
  if (type === 'text') return escapeHtml(context.resolveValue(descriptor.text, context));
  if (type === 'html' || type === 'trusted_html' || descriptor.html != null) {
    return sanitizeHtmlFragment(context.resolveValue(descriptor.html || descriptor.content || '', context), context.diagnostics, { ...context, descriptor }, context.options);
  }
  if (type === 'component') return serializeComponent(descriptor, context);
  if (type === 'element') return serializeElementLike(descriptor, context);
  if (type === 'fragment') {
    return asArray(descriptor.children || descriptor.nodes).map((child, index) => serializeDescriptor(child, {
      ...context,
      source: { ...(context.source || {}), index }
    })).join('');
  }
  if (type === 'slot') {
    return serializeDescriptor(descriptorWithSlot(descriptor.children || descriptor.text || '', descriptor.slot || descriptor.name || 'default'), context);
  }
  context.diagnostics.publish('rmt.node_ssr.descriptor_type_unsupported', `Unsupported SSR descriptor type "${type}".`, 'error', context);
  return '';
}

function extractTextContent(html) {
  return stableString(html, '').replace(/<[^>]*>/gu, '').replace(/\s+/gu, ' ').trim();
}

function findStateValue(coreDocument, selector) {
  if (!selector) return null;
  const candidates = [
    selector.target,
    selector.source,
    selector.sourceRef,
    selector.id && `state:${selector.id}`,
    selector.name && `state:${selector.name}`
  ].filter(Boolean);
  const states = asArray(coreDocument && coreDocument.states);
  for (const candidate of candidates) {
    const found = states.find((state) => state && (state.id === candidate || state.name === candidate || state.target === candidate));
    if (found) return found.initial || found.value || found.defaultValue || null;
  }
  return null;
}

function deriveDescriptorFromCore(coreDocument) {
  const selectors = new Map(asArray(coreDocument && coreDocument.selectors).map((selector) => [selector.id || selector.name, selector]));
  const lanes = asArray(coreDocument && coreDocument.lanes);
  const children = asArray(coreDocument && coreDocument.surfaces).map((surface) => {
    const selector = selectors.get(surface.source && (surface.source.selectorId || surface.source.id || surface.source.name));
    const stateValue = findStateValue(coreDocument, selector);
    const text = stateValue && (stateValue.text || stateValue.label || stateValue.value || stateValue.status);
    const lane = lanes.find((entry) => entry && asArray(entry.surfaceIds || entry.surfaces).includes(surface.id));
    return {
      type: 'component',
      tag: surface.component || surface.tag || 'section',
      id: safeIdentifier(surface.id || surface.name),
      key: safeIdentifier(surface.key || surface.id || surface.name),
      attributes: {
        id: safeIdentifier(surface.id || surface.name),
        'data-rmt-surface-id': surface.id || surface.name,
        'data-rmt-surface-name': surface.name || surface.id,
        'data-rmt-surface-kind': surface.kind || surface.type || 'surface',
        'data-rmt-primitive-id': surface.name || surface.id,
        'data-rmt-lane': lane && (lane.name || lane.id) || 'server-prerender',
        'data-rmt-source-ref': surface.sourceRef || surface.source && surface.source.sourceRef || null
      },
      children: text ? [{ type: 'text', text }] : []
    };
  });
  return {
    type: 'element',
    tag: 'section',
    attributes: {
      'data-rmt-node-ssr-root': 'true',
      'data-rmt-document-id': coreDocument && coreDocument.manifest && coreDocument.manifest.id || 'rmt-document'
    },
    children
  };
}

async function loadDefaultCompiler(disabled) {
  if (disabled) return null;
  try {
    const moduleApi = await import('../tools/rmt-language/vnext-compiler.js');
    return moduleApi.compileRmtVNextSource || moduleApi.default && moduleApi.default.compileRmtVNextSource || null;
  } catch {
    return null;
  }
}

async function loadDefaultStreamingContractFactory() {
  try {
    const moduleApi = await import('../tools/rmt-language/vnext-streaming.js');
    return moduleApi.createStreamingContract || moduleApi.default && moduleApi.default.createStreamingContract || null;
  } catch {
    return null;
  }
}

function isCoreDocument(value) {
  return Boolean(value && typeof value === 'object' && (value.schema === 'xtend.rmt.core-format.vnext.v1' || Array.isArray(value.surfaces) && Array.isArray(value.operations)));
}

async function normalizeRenderInput(input, adapterOptions, renderOptions, diagnostics) {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input : { descriptor: input };
  if (value.descriptor || value.domDescriptor) {
    return {
      kind: 'dom-descriptor',
      descriptor: normalizeDescriptor(value.descriptor || value.domDescriptor),
      sourceRef: value.filePath || value.sourceRef || null
    };
  }
  if (isCoreDocument(value.coreDocument || value.core || value)) {
    const coreDocument = value.coreDocument || value.core || value;
    return {
      kind: 'core-document',
      coreDocument,
      descriptor: value.descriptor ? normalizeDescriptor(value.descriptor) : deriveDescriptorFromCore(coreDocument),
      sourceRef: value.filePath || coreDocument.sourceRef || null
    };
  }
  if (value.template || value.preparedTemplate || value.kind === 'renderman_prepared_template') {
    const template = value.template || value.preparedTemplate || value;
    return {
      kind: 'prepared-template',
      template,
      descriptor: normalizeDescriptor(template.descriptor || template.domDescriptor || template.markup && template.markup.descriptor || template.html && { html: template.html, trustBoundary: template.trustBoundary }),
      sourceRef: value.filePath || template.sourceRef || null
    };
  }
  if (typeof input === 'string' || typeof value.source === 'string' || typeof value.text === 'string') {
    const source = typeof input === 'string' ? input : value.source || value.text;
    const compileRmtVNextSource = adapterOptions.compileRmtVNextSource || renderOptions.compileRmtVNextSource || await loadDefaultCompiler(adapterOptions.disableAutoCompiler || renderOptions.disableAutoCompiler);
    if (typeof compileRmtVNextSource !== 'function') {
      diagnostics.publish(
        'rmt.node_ssr.compiler_required',
        'Rendering RMT source in the runtime-only adapter requires an injected compileRmtVNextSource function.',
        'error',
        { filePath: value.filePath || null }
      );
      return {
        kind: 'source',
        source,
        sourceRef: value.filePath || null,
        descriptor: { type: 'empty' }
      };
    }
    const compileResult = compileRmtVNextSource(source, { filePath: value.filePath || value.sourceRef || 'inline.rmt' });
    diagnostics.pushMany(compileResult && (compileResult.diagnostics || compileResult.compilerDiagnostics));
    if (!compileResult || compileResult.ok === false || !compileResult.coreDocument) {
      diagnostics.publish('rmt.node_ssr.compile_failed', 'RMT source could not be compiled for SSR.', 'error', { filePath: value.filePath || null });
      return {
        kind: 'source',
        source,
        compileResult,
        sourceRef: value.filePath || null,
        descriptor: { type: 'empty' }
      };
    }
    return {
      kind: 'source',
      source,
      compileResult,
      coreDocument: compileResult.coreDocument,
      descriptor: deriveDescriptorFromCore(compileResult.coreDocument),
      sourceRef: value.filePath || compileResult.coreDocument.sourceRef || null
    };
  }
  return {
    kind: 'dom-descriptor',
    descriptor: normalizeDescriptor(input),
    sourceRef: null
  };
}

function createChunk(renderState, html, descriptor, hydration) {
  const documentId = renderState.coreDocument && renderState.coreDocument.manifest && renderState.coreDocument.manifest.id || renderState.requestId;
  const templateId = safeIdentifier(renderState.options.templateId || documentId, 'rmt-node-ssr-template');
  const qualifiedId = `${safeIdentifier(renderState.options.namespace || 'rmt')}:${templateId}`;
  return {
    kind: RMT_NODE_SSR_CHUNK_KIND,
    version: '1.0',
    executionMode: RMT_NODE_SSR_EXECUTION_MODE,
    transport: 'server',
    rootId: renderState.rootId,
    template: {
      id: templateId,
      qualifiedId,
      namespace: renderState.options.namespace || 'rmt',
      documentId,
      mode: 'dom_descriptor',
      props: []
    },
    target: {
      elementId: renderState.rootId,
      selector: `#${renderState.rootId}`,
      ownershipMode: 'hydrate_existing',
      namespace: renderState.options.namespace || 'rmt'
    },
    markup: {
      html,
      textContent: extractTextContent(html),
      descriptor: cloneJson(descriptor)
    },
    hydration: {
      bindings: [],
      slots: [],
      props: [],
      templateHydration: {
        mode: RMT_NODE_SSR_EXECUTION_MODE,
        schema: RMT_NODE_SSR_HYDRATION_SCHEMA
      },
      errorBoundary: {
        mode: 'preserve-server-markup'
      },
      reactivityHints: {
        source: 'rmt-node-ssr-adapter'
      },
      ownershipMode: 'hydrate_existing',
      resourceId: `template.chunk:${qualifiedId}`,
      metadata: hydration
    },
    modelSnapshot: renderState.model || {},
    plan: {
      executionMode: RMT_NODE_SSR_EXECUTION_MODE,
      rootId: renderState.rootId,
      templateQualifiedId: qualifiedId,
      namespace: renderState.options.namespace || 'rmt',
      phases: ['server_prerender', 'html_delivery', 'client_hydrate']
    },
    renderedAt: renderState.renderedAt
  };
}

function createPrerenderResponseEnvelope(renderState, chunk, hydration, diagnostics, ok, cspPolicy, headers) {
  const renderedAt = Date.parse(renderState.renderedAt) || Date.now();
  const metadata = {
    adapterKind: 'node-ssr',
    adapterSchema: RMT_NODE_SSR_ADAPTER_SCHEMA,
    hydrationSchema: RMT_NODE_SSR_HYDRATION_SCHEMA,
    requestId: renderState.requestId,
    sourceKind: hydration && hydration.sourceKind || null,
    sourceRef: hydration && hydration.sourceRef || null,
    cspPolicy: cloneJson(cspPolicy)
  };
  const request = {
    kind: 'renderman_template_prerender_request',
    version: '1.0',
    executionMode: RMT_NODE_SSR_EXECUTION_MODE,
    transport: 'server',
    rootId: renderState.rootId,
    template: cloneJson(chunk.template),
    target: cloneJson(chunk.target),
    metadata: cloneJson(metadata),
    requestedAt: renderedAt
  };
  return {
    kind: RMT_NODE_SSR_RESPONSE_KIND,
    version: '1.0',
    ok,
    status: ok ? 'rendered' : 'blocked',
    transport: 'server',
    executionMode: RMT_NODE_SSR_EXECUTION_MODE,
    adapterKind: 'node-ssr',
    supportStatus: ok ? 'supported' : 'blocked',
    rootId: renderState.rootId,
    template: cloneJson(chunk.template),
    target: cloneJson(chunk.target),
    plan: cloneJson(chunk.plan),
    request,
    metadata,
    headers: cloneJson(headers),
    chunk,
    chunks: [chunk],
    hydration,
    diagnostics: diagnostics.slice(),
    superseded: false,
    error: ok ? null : {
      code: 'rmt.node_ssr.prerender_blocked',
      message: 'Node SSR prerender response was blocked by diagnostics.',
      diagnostics: diagnostics.slice()
    },
    requestedAt: renderedAt,
    respondedAt: renderedAt
  };
}

function normalizeDataSources(coreDocument, options = {}) {
  const records = [
    ...asArray(coreDocument && coreDocument.dataSources),
    ...asArray(options.dataSources)
  ];
  return records.map((entry, index) => ({
    id: entry.id || entry.dataSourceId || entry.target || `dataSource.${index}`,
    kind: entry.kind || entry.type || null,
    target: entry.target || entry.id || entry.dataSourceId || null,
    unsafe: entry.unsafe === true || entry.requiresTrustBoundary === true,
    format: entry.format || entry.responseType || null,
    requiresTrustBoundary: entry.requiresTrustBoundary !== false && (entry.unsafe === true || entry.format === 'html' || entry.responseType === 'html' || entry.kind === 'endpoint'),
    source: entry
  }));
}

async function createStreamingContract(coreDocument, options, diagnostics) {
  if (!coreDocument || asArray(coreDocument.dataSources).length === 0) return null;
  const factory = options.createStreamingContract || await loadDefaultStreamingContractFactory();
  if (typeof factory !== 'function') return null;
  const contract = factory(coreDocument, {
    dataSources: normalizeDataSources(coreDocument, options),
    runtimeProbes: options.runtimeProbes || []
  });
  diagnostics.pushMany(contract && contract.diagnostics);
  return contract;
}

async function resolveDataSource(record, context) {
  const options = context.options || {};
  if (typeof options.resolveDataSource === 'function') {
    return options.resolveDataSource(record, context);
  }
  const endpointHandlers = objectRecord(options.endpointHandlers);
  const target = record && (record.target || record.id);
  if (target && typeof endpointHandlers[target] === 'function') {
    return endpointHandlers[target](record, context);
  }
  const staticDataSources = {
    ...objectRecord(options.staticDataSources),
    ...objectRecord(options.fixtures)
  };
  if (target && Object.prototype.hasOwnProperty.call(staticDataSources, target)) {
    return staticDataSources[target];
  }
  if (target && Object.prototype.hasOwnProperty.call(staticDataSources, record.id)) {
    return staticDataSources[record.id];
  }
  if (typeof options.fetchAdapter === 'function') {
    return options.fetchAdapter(record, context);
  }
  context.diagnostics.publish(
    'rmt.node_ssr.datasource_missing',
    `No host resolver was provided for data source "${target || '<unknown>'}".`,
    'error',
    { operationId: context.operationId || null, dataSourceId: record && record.id || null, target: target || null }
  );
  return null;
}

function normalizeJsonlPayload(value) {
  if (value == null) return {};
  if (typeof value === 'string') return { html: value };
  if (value && typeof value === 'object') return value;
  return { value };
}

function toJsonlLine(frame) {
  return `${JSON.stringify(frame)}\n`;
}

function createFrameFactory(base) {
  let sequence = 0;
  return (type, fields = {}) => ({
    schema: RMT_NODE_SSR_JSONL_FRAME_SCHEMA,
    type,
    requestId: base.requestId,
    sequence: sequence++,
    operationId: fields.operationId || null,
    variant: fields.variant || null,
    capability: fields.capability || null,
    lane: fields.lane || null,
    chunkKey: fields.chunkKey || null,
    payload: fields.payload || {},
    diagnostics: asArray(fields.diagnostics)
  });
}

function hasBlockingDiagnostics(diagnostics) {
  return asArray(diagnostics).some((entry) => BLOCKING_SEVERITIES.has(entry && entry.severity));
}

function collectPreloads(html) {
  const preloads = [];
  for (const match of stableString(html, '').matchAll(/data-rmt-lazy-import="([^"]+)"/gu)) {
    const href = match[1];
    if (href && !preloads.some((entry) => entry.href === href)) {
      preloads.push({ href, as: 'script', rel: 'modulepreload' });
    }
  }
  return preloads;
}

export function createRmtNodeSsrAdapter(options = {}) {
  const adapterOptions = { ...options };
  const resolveValue = createValueResolver();
  const componentRegistry = adapterOptions.componentRegistry || (
    adapterOptions.manifest
      ? createRmtComponentCapabilityRegistry({
          manifest: adapterOptions.manifest,
          sourceTexts: adapterOptions.sourceTexts || {},
          contracts: adapterOptions.contracts || {},
          metadata: adapterOptions.metadata || {}
        })
      : null
  );

  async function render(input, renderOptions = {}) {
    const mergedOptions = { ...adapterOptions, ...renderOptions };
    const diagnostics = createDiagnosticsCollector(mergedOptions);
    const cspPolicy = createSsrCspPolicy(mergedOptions);
    const headers = createSsrSecurityHeaders(cspPolicy, mergedOptions.headers);
    const requestId = safeIdentifier(mergedOptions.requestId || mergedOptions.operationId || `rmt-node-ssr-${Date.now()}`);
    const normalized = await normalizeRenderInput(input, adapterOptions, renderOptions, diagnostics);
    const rootId = safeIdentifier(mergedOptions.rootId || 'rmt-node-ssr-root');
    const componentCapabilities = new Map();
    const html = serializeDescriptor(normalized.descriptor, {
      options: mergedOptions,
      diagnostics,
      componentRegistry: mergedOptions.componentRegistry || componentRegistry,
      componentCapabilities,
      model: mergedOptions.model || {},
      selectorValues: mergedOptions.selectorValues || {},
      source: { inputKind: normalized.kind, sourceRef: normalized.sourceRef },
      resolveValue
    });
    const streamingContract = await createStreamingContract(normalized.coreDocument, mergedOptions, diagnostics);
    const hydration = {
      schema: RMT_NODE_SSR_HYDRATION_SCHEMA,
      requestId,
      executionMode: RMT_NODE_SSR_EXECUTION_MODE,
      sourceKind: normalized.kind,
      sourceRef: normalized.sourceRef,
      componentCapabilities: [...componentCapabilities.values()],
      coreDocumentSchema: normalized.coreDocument && normalized.coreDocument.schema || null,
      streamingContractSchema: streamingContract && streamingContract.schema || null,
      cspPolicy
    };
    const renderState = {
      requestId,
      rootId,
      options: mergedOptions,
      coreDocument: normalized.coreDocument,
      renderedAt: mergedOptions.renderedAt || new Date().toISOString(),
      model: mergedOptions.model || {}
    };
    const chunk = createChunk(renderState, html, normalized.descriptor, hydration);
    const ok = !hasBlockingDiagnostics(diagnostics.diagnostics);
    const result = {
      schema: RMT_NODE_SSR_RENDER_RESULT_SCHEMA,
      adapterSchema: RMT_NODE_SSR_ADAPTER_SCHEMA,
      ok,
      status: ok ? 'rendered' : 'blocked',
      requestId,
      html,
      head: {
        preloads: collectPreloads(html),
        csp: cspPolicy,
        securityHeaders: headers,
        hints: [
          {
            rel: 'xtend-rmt-hydration',
            schema: RMT_NODE_SSR_HYDRATION_SCHEMA
          }
        ]
      },
      headers,
      cspPolicy,
      chunks: [chunk],
      response: createPrerenderResponseEnvelope(renderState, chunk, hydration, diagnostics.diagnostics, ok, cspPolicy, headers),
      hydration,
      streamingContract,
      componentCapabilities: [...componentCapabilities.values()],
      fabricTelemetryHints: {
        schema: 'xtend.rmt.node-ssr-fabric-telemetry-hints.v1',
        lanes: asArray(normalized.coreDocument && normalized.coreDocument.lanes).map((lane) => lane.id || lane.name).filter(Boolean),
        kernelBoundary: RMT_NODE_SSR_KERNEL_BOUNDARY,
        transport: 'node-ssr'
      },
      diagnostics: diagnostics.diagnostics.slice()
    };
    return result;
  }

  async function* streamJsonl(input, streamOptions = {}) {
    const mergedOptions = { ...adapterOptions, ...streamOptions };
    const renderResult = await render(input, { ...mergedOptions, streamMode: true });
    const frame = createFrameFactory({ requestId: renderResult.requestId });
    yield toJsonlLine(frame('start', {
      payload: {
        adapterSchema: RMT_NODE_SSR_ADAPTER_SCHEMA,
        streamingContractSchema: renderResult.streamingContract && renderResult.streamingContract.schema || RMT_NODE_SSR_STREAMING_CONTRACT_SCHEMA,
        cspPolicy: renderResult.cspPolicy,
        headers: renderResult.headers
      }
    }));
    for (const diagnostic of renderResult.diagnostics) {
      yield toJsonlLine(frame('diagnostic', { diagnostics: [diagnostic], payload: { code: diagnostic.code } }));
    }
    for (const capability of renderResult.componentCapabilities) {
      yield toJsonlLine(frame('component', {
        capability: capability.tag,
        payload: capability
      }));
    }
    yield toJsonlLine(frame('html', {
      variant: 'ssr',
      capability: 'stream.ssr.incremental',
      lane: 'server-prerender',
      chunkKey: renderResult.chunks[0] && renderResult.chunks[0].template && renderResult.chunks[0].template.qualifiedId,
      payload: { html: renderResult.html }
    }));
    const operations = asArray(
      renderResult.streamingContract && (renderResult.streamingContract.streams || renderResult.streamingContract.operations)
    );
    for (const operation of operations) {
      if (mergedOptions.signal && mergedOptions.signal.aborted) {
        yield toJsonlLine(frame('error', {
          operationId: operation.operationId || operation.id,
          variant: operation.variant,
          capability: operation.capability,
          diagnostics: [createDiagnostic('rmt.node_ssr.stream_aborted', 'Node SSR JSONL stream was aborted.', 'error', { operationId: operation.operationId || operation.id })]
        }));
        return;
      }
      const operationId = operation.operationId || operation.id || null;
      const record = operation.dataSource
        ? {
            id: operation.dataSource.id || operation.sourceId || operation.sourceRef || operationId,
            kind: operation.dataSource.kind || null,
            target: operation.dataSource.target || operation.dataSource.id || null,
            unsafe: operation.dataSource.catalog && operation.dataSource.catalog.unsafe === true,
            format: operation.dataSource.catalog && operation.dataSource.catalog.format || null,
            requiresTrustBoundary: operation.security && operation.security.required === true,
            source: operation.dataSource
          }
        : null;
      if (!record) continue;
      const diagnostics = createDiagnosticsCollector(mergedOptions);
      const payload = normalizeJsonlPayload(await resolveDataSource(record, {
        options: mergedOptions,
        diagnostics,
        operationId,
        renderResult
      }));
      for (const diagnostic of diagnostics.diagnostics) {
        yield toJsonlLine(frame('diagnostic', {
          operationId,
          variant: operation.variant,
          capability: operation.capability,
          diagnostics: [diagnostic],
          payload: { code: diagnostic.code }
        }));
      }
      if (payload.html != null) {
        const html = sanitizeHtmlFragment(payload.html, diagnostics, {
          descriptor: {
            trustBoundary: payload.trustBoundary
              || record.source && record.source.trustBoundary
              || operation.security && operation.security.boundaryIds
              || mergedOptions.defaultTrustBoundary
          },
          operationId
        }, mergedOptions);
        yield toJsonlLine(frame('html', {
          operationId,
          variant: operation.variant,
          capability: operation.capability,
          lane: operation.scheduler && operation.scheduler.laneId || operation.lane || operation.variant || null,
          chunkKey: operation.chunking && operation.chunking.metadata && operation.chunking.metadata.chunkKey || operation.chunkKey || operationId,
          payload: { html, dataSourceId: record.id }
        }));
      }
      if (payload.descriptor) {
        const descriptorHtml = serializeDescriptor(payload.descriptor, {
          options: mergedOptions,
          diagnostics,
          componentRegistry: mergedOptions.componentRegistry || componentRegistry,
          componentCapabilities: new Map(),
          model: mergedOptions.model || {},
          selectorValues: mergedOptions.selectorValues || {},
          source: { inputKind: 'stream-descriptor', operationId },
          resolveValue
        });
        yield toJsonlLine(frame('html', {
          operationId,
          variant: operation.variant,
          capability: operation.capability,
          lane: operation.scheduler && operation.scheduler.laneId || operation.lane || operation.variant || null,
          chunkKey: operation.chunking && operation.chunking.metadata && operation.chunking.metadata.chunkKey || operation.chunkKey || operationId,
          payload: { html: descriptorHtml, dataSourceId: record.id }
        }));
      }
    }
    yield toJsonlLine(frame('hydration', {
      variant: 'hydration',
      capability: 'stream.hydration.chunked',
      lane: 'client-hydrate',
      chunkKey: renderResult.chunks[0] && renderResult.chunks[0].template && renderResult.chunks[0].template.qualifiedId,
      payload: renderResult.hydration
    }));
    yield toJsonlLine(frame('complete', {
      payload: {
        ok: renderResult.ok,
        status: renderResult.status,
        diagnostics: renderResult.diagnostics.length
      }
    }));
  }

  function toNodeReadable(input, streamOptions = {}) {
    return Readable.from(streamJsonl(input, streamOptions));
  }

  async function toHttpResponse(input, responseOptions = {}) {
    const result = await render(input, responseOptions);
    return {
      status: responseOptions.status || (result.ok ? 200 : 500),
      headers: createSsrSecurityHeaders(result.cspPolicy, {
        'Content-Type': 'text/html; charset=UTF-8',
        'X-XTend-RMT-SSR-Adapter': RMT_NODE_SSR_ADAPTER_SCHEMA,
        ...objectRecord(result.headers),
        ...objectRecord(responseOptions.headers)
      }),
      body: result.html,
      result
    };
  }

  async function sendNodeResponse(nodeResponse, input, responseOptions = {}) {
    const response = await toHttpResponse(input, responseOptions);
    if (nodeResponse && typeof nodeResponse === 'object') {
      nodeResponse.statusCode = response.status;
      Object.entries(response.headers).forEach(([name, value]) => {
        if (typeof nodeResponse.setHeader === 'function') nodeResponse.setHeader(name, value);
      });
      if (typeof nodeResponse.end === 'function') nodeResponse.end(response.body);
    }
    return response;
  }

  function toReadableStream(input, streamOptions = {}) {
    const iterable = streamJsonl(input, streamOptions);
    if (typeof ReadableStream === 'function') {
      const iterator = iterable[Symbol.asyncIterator]();
      return new ReadableStream({
        async pull(controller) {
          const next = await iterator.next();
          if (next.done) {
            controller.close();
          } else {
            controller.enqueue(next.value);
          }
        },
        async cancel() {
          if (typeof iterator.return === 'function') await iterator.return();
        }
      });
    }
    return Readable.toWeb(Readable.from(iterable));
  }

  return Object.freeze({
    schema: RMT_NODE_SSR_ADAPTER_SCHEMA,
    kernelBoundary: RMT_NODE_SSR_KERNEL_BOUNDARY,
    componentRegistry,
    render,
    streamJsonl,
    toReadableStream,
    toNodeReadable,
    toHttpResponse,
    sendNodeResponse,
    renderDescriptorToHtml(descriptor, renderOptions = {}) {
      const diagnostics = createDiagnosticsCollector({ ...adapterOptions, ...renderOptions });
      const componentCapabilities = new Map();
      const html = serializeDescriptor(descriptor, {
        options: { ...adapterOptions, ...renderOptions },
        diagnostics,
        componentRegistry: renderOptions.componentRegistry || componentRegistry,
        componentCapabilities,
        model: renderOptions.model || {},
        selectorValues: renderOptions.selectorValues || {},
        source: { inputKind: 'descriptor-helper' },
        resolveValue
      });
      return {
        html,
        componentCapabilities: [...componentCapabilities.values()],
        diagnostics: diagnostics.diagnostics.slice()
      };
    },
    listDiagnostics() {
      return componentRegistry && typeof componentRegistry.listDiagnostics === 'function'
        ? componentRegistry.listDiagnostics()
        : [];
    }
  });
}

export default {
  RMT_NODE_SSR_ADAPTER_SCHEMA,
  RMT_NODE_SSR_RENDER_RESULT_SCHEMA,
  RMT_NODE_SSR_JSONL_FRAME_SCHEMA,
  RMT_NODE_SSR_DIAGNOSTIC_SCHEMA,
  RMT_NODE_SSR_HYDRATION_SCHEMA,
  RMT_NODE_SSR_CHUNK_KIND,
  RMT_NODE_SSR_RESPONSE_KIND,
  RMT_NODE_SSR_EXECUTION_MODE,
  RMT_NODE_SSR_STREAMING_CONTRACT_SCHEMA,
  RMT_NODE_SSR_KERNEL_BOUNDARY,
  RMT_SSR_CSP_POLICY_SCHEMA,
  RMT_SSR_CSP_HEADER,
  createRmtNodeSsrAdapter
};

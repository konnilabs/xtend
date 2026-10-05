(function attachRmtSafePreview(globalTarget) {
  const RMT_SAFE_PREVIEW_SCHEMA = 'xtend.rmt.safe-preview-projector.v1';
  const DEFAULT_LIMITS = Object.freeze({ maxDepth: 32, maxNodes: 1000, maxTextBytes: 65536, maxAttributes: 32 });
  const BLOCKED_ATTRIBUTES = /^(?:on|srcdoc$|innerhtml$|outerhtml$)/i;
  const URL_ATTRIBUTES = new Set(['href', 'src', 'poster', 'action', 'formaction']);
  function record(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function array(value) { return Array.isArray(value) ? value : []; }
  function clone(value, fallback = null) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; } }
  function diagnostic(code, message, details = {}) { return { schema: 'xtend.rmt.safe-preview-diagnostic.v1', code, severity: 'warning', message, details }; }

  function createRmtSafePreviewProjector(options = {}) {
    const registry = options.componentRegistry;
    const allowedElements = new Set(array(options.allowedElements || ['div', 'section', 'article', 'header', 'footer', 'main', 'p', 'span', 'strong', 'em', 'ul', 'ol', 'li', 'button', 'label', 'input', 'textarea', 'select', 'option', 'pre', 'code']).map(String));
    const limits = { ...DEFAULT_LIMITS, ...record(options.limits) };
    for (const [key, fallback] of Object.entries(DEFAULT_LIMITS)) {
      if (!Number.isSafeInteger(limits[key]) || limits[key] < (key === 'maxNodes' ? 1 : 0)) limits[key] = fallback;
    }
    const allowedProtocols = new Set(array(options.allowedProtocols || ['http:', 'https:', 'mailto:', 'tel:']).map(String));
    function isKnownComponent(tag) {
      if (!tag.includes('-')) return allowedElements.has(tag);
      if (!registry) return false;
      if (typeof registry.has === 'function') return registry.has(tag);
      if (typeof registry.get === 'function') return Boolean(registry.get(tag));
      if (Array.isArray(registry)) return registry.some((entry) => entry === tag || entry && entry.tag === tag);
      return Object.prototype.hasOwnProperty.call(registry, tag);
    }
    function safeUrl(value, baseUrl) {
      const raw = String(value || '').trim();
      if (!raw || raw.startsWith('#') || raw.startsWith('/')) return raw;
      try { return allowedProtocols.has(new URL(raw, baseUrl || 'https://xtend.invalid/').protocol) ? raw : null; } catch (_) { return null; }
    }
    function project(coreDocument, projectOptions = {}) {
      const diagnostics = [];
      let truncated = false;
      function warn(code, message, details = {}) {
        if (diagnostics.length < Math.min(limits.maxNodes, 100)) diagnostics.push(diagnostic(code, message, details));
      }
      function limit() {
        if (!truncated) warn('rmt.safe-preview.limit', 'The preview was truncated at its resource limit.');
        truncated = true;
      }
      function acceptText(value) {
        const text = String(value);
        const remaining = limits.maxTextBytes - counters.textBytes;
        if (text.length > remaining) { limit(); return null; }
        const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(text).length : text.length;
        if (bytes > remaining) { limit(); return null; }
        counters.textBytes += bytes;
        return text;
      }
      const counters = { nodes: 0, textBytes: 0 };
      const source = record(coreDocument);
      function recordIds(entry) { const value = record(entry); return [value.id, value.name, value.qualifiedId].filter(Boolean).map(String); }
      function findRecord(records, id) {
        const target = String(id || '');
        return array(records).find((entry) => recordIds(entry).some((candidate) => candidate === target || candidate.endsWith(`:${target}`) || candidate.endsWith(`/${target}`)));
      }
      function surfaceState(surface) {
        const sourceRef = record(surface.source);
        let target = String(sourceRef.target || sourceRef.ref || '');
        if (String(sourceRef.kind || '') === 'selector') {
          const selector = record(findRecord(source.selectors, target));
          target = String(record(selector.source).target || '');
        }
        return record(findRecord(source.states, target)).initial || {};
      }
      function surfaceDescriptor(surface) {
        const state = record(surfaceState(surface));
        const tag = String(surface.component || '').toLowerCase();
        const surfaceId = String(surface.id || surface.name || tag);
        const text = String(state.message || state.text || state.title || state.label || state.name || state.status || state.value || surface.name || surfaceId);
        const attributes = { 'data-rmt-playground-surface': surfaceId, 'data-rmt-surface-name': String(surface.name || surfaceId), 'data-rmt-surface-kind': String(surface.kind || 'surface') };
        const candidates = { label: ['label', 'title', 'name', 'id'], title: ['title', 'label', 'name'], name: ['name', 'id'], value: ['value'], state: ['state', 'status', 'tone'], type: ['type', 'tone'], variant: ['variant', 'tone'], placeholder: ['placeholder'], max: ['max', 'total'] };
        Object.entries(candidates).forEach(([attribute, keys]) => { const key = keys.find((candidate) => state[candidate] != null && typeof state[candidate] !== 'object'); if (key) attributes[attribute] = String(state[key]); });
        ['busy', 'checked', 'disabled', 'dismissible', 'loading', 'open', 'polite', 'required', 'selected'].forEach((key) => { if (typeof state[key] === 'boolean') attributes[key] = state[key]; });
        if (tag === 'x-status') { attributes.type = ['info', 'success', 'warning', 'error'].includes(String(state.tone || '').toLowerCase()) ? String(state.tone).toLowerCase() : 'info'; attributes.state = String(state.state || state.status || state.tone || attributes.type); attributes.message = text || 'Status ready'; }
        if (tag === 'x-progress') { attributes.value = String(state.value || state.progress || state.percent || '0'); attributes.max = String(state.max || state.total || '100'); }
        return { type: 'component', tag, attributes, children: text ? [{ type: 'text', text }] : [] };
      }
      const generatedRoot = array(source.surfaces).length ? { type: 'fragment', children: array(source.surfaces).slice(0, limits.maxNodes).map(surfaceDescriptor) } : null;
      const root = projectOptions.descriptor
        || (source.render && record(source.render).root)
        || (source.descriptor && record(source.descriptor))
        || source.root
        || generatedRoot;
      function childrenOf(children, depth) {
        const result = [];
        for (const child of array(children)) {
          if (counters.nodes >= limits.maxNodes || depth > limits.maxDepth) { limit(); break; }
          result.push(visit(child, depth));
        }
        return result;
      }
      function visit(node, depth) {
        counters.nodes += 1;
        if (typeof node === 'string' || typeof node === 'number') {
          return { type: 'text', text: acceptText(node) ?? '' };
        }
        const input = record(node);
        if (input.type === 'text' || (!input.tag && Object.prototype.hasOwnProperty.call(input, 'text'))) {
          return { type: 'text', text: acceptText(input.text ?? '') ?? '' };
        }
        if (input.type === 'fragment' || (!input.tag && Array.isArray(input.children || input.nodes))) {
          return { type: 'fragment', children: childrenOf(input.children || input.nodes, depth + 1) };
        }
        const tag = String(input.tag || input.component || '').toLowerCase();
        if (!/^[a-z][a-z0-9-]*$/.test(tag) || !isKnownComponent(tag)) {
          warn('rmt.safe-preview.component-unknown', 'Component is not available in the preview registry.', { tag: tag.slice(0, 128) });
          return {
            type: 'element', tag: 'p',
            attributes: { role: 'status', 'data-rmt-preview-degraded': 'unknown-component', 'data-rmt-preview-component': acceptText(tag.slice(0, 128)) ?? '' },
            children: childrenOf([{ type: 'text', text: `Preview unavailable: ${tag.slice(0, 128) || 'unknown component'}` }], depth + 1)
          };
        }
        const attributes = Object.create(null);
        const sourceAttributes = record(input.attributes || input.props);
        let attributeCount = 0;
        for (const name in sourceAttributes) {
          if (!Object.prototype.hasOwnProperty.call(sourceAttributes, name)) continue;
          if (attributeCount++ >= limits.maxAttributes) { limit(); break; }
          const value = sourceAttributes[name];
          const normalized = name.toLowerCase();
          if (!/^[a-z_:][a-z0-9:_.-]*$/i.test(normalized) || BLOCKED_ATTRIBUTES.test(normalized) || value == null || typeof value === 'object') {
            warn('rmt.safe-preview.attribute-blocked', 'Attribute was removed.', { tag: tag.slice(0, 128), attribute: name.slice(0, 128) });
            continue;
          }
          const candidate = String(value === true ? '' : value);
          // Check bytes before URL parsing or copying oversized attribute values.
          if (acceptText(normalized + candidate) === null) continue;
          const next = URL_ATTRIBUTES.has(normalized) ? safeUrl(candidate, projectOptions.baseUrl) : candidate;
          if (next === null) {
            warn('rmt.safe-preview.url-blocked', 'URL attribute was removed.', { tag: tag.slice(0, 128), attribute: name.slice(0, 128) });
            continue;
          }
          attributes[normalized] = next;
        }
        return { type: 'element', tag, attributes, children: childrenOf(input.children, depth + 1) };
      }
      const descriptor = visit(root || { type: 'fragment', children: [] }, 0);
      return Object.freeze({ schema: RMT_SAFE_PREVIEW_SCHEMA, ok: true, descriptor: clone(descriptor, {}), diagnostics: clone(diagnostics, []), metrics: { ...counters } });
    }
    return Object.freeze({ schema: RMT_SAFE_PREVIEW_SCHEMA, project, snapshot: () => ({ schema: RMT_SAFE_PREVIEW_SCHEMA, limits: { ...limits } }) });
  }
  const api = { RMT_SAFE_PREVIEW_SCHEMA, createRmtSafePreviewProjector };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (globalTarget) globalTarget.XTendRmtSafePreview = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
const __XTEND_RMT_SAFE_PREVIEW_API__ = globalThis.XTendRmtSafePreview;
export const RMT_SAFE_PREVIEW_SCHEMA = __XTEND_RMT_SAFE_PREVIEW_API__.RMT_SAFE_PREVIEW_SCHEMA;
export const createRmtSafePreviewProjector = __XTEND_RMT_SAFE_PREVIEW_API__.createRmtSafePreviewProjector;
export default __XTEND_RMT_SAFE_PREVIEW_API__;

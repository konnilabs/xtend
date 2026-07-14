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
      const generatedRoot = array(source.surfaces).length ? { type: 'fragment', children: array(source.surfaces).map(surfaceDescriptor) } : null;
      const root = projectOptions.descriptor
        || (source.render && record(source.render).root)
        || (source.descriptor && record(source.descriptor))
        || source.root
        || generatedRoot;
      function visit(node, depth) {
        counters.nodes += 1;
        if (depth > limits.maxDepth || counters.nodes > limits.maxNodes) {
          diagnostics.push(diagnostic('rmt.safe-preview.limit', 'The preview was truncated at its structural limit.', { depth, nodes: counters.nodes }));
          return { type: 'element', tag: 'p', attributes: { 'data-rmt-preview-degraded': 'limit' }, children: [{ type: 'text', text: 'Preview truncated.' }] };
        }
        if (typeof node === 'string' || typeof node === 'number') {
          const text = String(node);
          counters.textBytes += typeof TextEncoder === 'function' ? new TextEncoder().encode(text).length : text.length;
          return { type: 'text', text: counters.textBytes > limits.maxTextBytes ? '' : text };
        }
        const input = record(node);
        if (input.type === 'text' || (!input.tag && Object.prototype.hasOwnProperty.call(input, 'text'))) return visit(String(input.text || ''), depth);
        if (input.type === 'fragment' || (!input.tag && Array.isArray(input.children || input.nodes))) return { type: 'fragment', children: array(input.children || input.nodes).map((child) => visit(child, depth + 1)) };
        const tag = String(input.tag || input.component || '').toLowerCase();
        if (!/^[a-z][a-z0-9-]*$/.test(tag) || !isKnownComponent(tag)) {
          diagnostics.push(diagnostic('rmt.safe-preview.component-unknown', `Component ${tag || '(missing)'} is not available in the preview registry.`, { tag }));
          return { type: 'element', tag: 'p', attributes: { role: 'status', 'data-rmt-preview-degraded': 'unknown-component', 'data-rmt-preview-component': tag }, children: [{ type: 'text', text: `Preview unavailable: ${tag || 'unknown component'}` }] };
        }
        const attributes = {};
        Object.entries(record(input.attributes || input.props)).slice(0, limits.maxAttributes).forEach(([name, value]) => {
          const normalized = String(name).toLowerCase();
          if (!/^[a-z_:][a-z0-9:_.-]*$/i.test(normalized) || BLOCKED_ATTRIBUTES.test(normalized) || value == null || typeof value === 'object') {
            diagnostics.push(diagnostic('rmt.safe-preview.attribute-blocked', `Attribute ${name} was removed.`, { tag, attribute: name })); return;
          }
          const next = URL_ATTRIBUTES.has(normalized) ? safeUrl(value, projectOptions.baseUrl) : String(value === true ? '' : value);
          if (next === null) { diagnostics.push(diagnostic('rmt.safe-preview.url-blocked', `URL attribute ${name} was removed.`, { tag, attribute: name })); return; }
          attributes[normalized] = next;
        });
        return { type: 'element', tag, attributes, children: array(input.children).map((child) => visit(child, depth + 1)) };
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

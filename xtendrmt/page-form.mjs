import { assertKey, pageError, validatePageResponse } from './page-contract.mjs';
const hasFiles = value => typeof Blob !== 'undefined' && value instanceof Blob || value && typeof value === 'object' && Object.values(value).some(hasFiles);
const copy = value => value === undefined ? undefined : typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
export function createPageForm(options) {
  let defaults = copy(options.defaults || {}), values = copy(defaults), errors = {}, processing = false, success = false, progress = null, sequence = 0, validating = false;
  let active, validationController;
  let valuesVersion = 0;
  const listeners = new Set();
  const notify = () => { for (const listener of listeners) listener(api.state); };
  function multipart(data) {
    const form = new FormData();
    function append(value, key) {
      assertKey(key);
      if (value instanceof Blob) form.append(key, value);
      else if (value && typeof value === 'object') for (const [name, entry] of Object.entries(value)) append(entry, key ? `${key}[${name}]` : name);
      else form.append(key, value == null ? '' : typeof value === 'boolean' ? value ? '1' : '0' : String(value));
    }
    for (const [key, value] of Object.entries(data)) append(value, key);
    return form;
  }
  function upload(url, body, settings) {
    const XHR = options.XMLHttpRequest || globalThis.XMLHttpRequest;
    if (!XHR) throw pageError('page.upload_unavailable', 'Upload progress requires XMLHttpRequest.');
    return new Promise((resolve, reject) => {
      const xhr = new XHR(); xhr.open('POST', url); xhr.timeout = options.timeoutMs || 30000;
      const abort = () => { xhr.abort(); reject(new DOMException('Aborted', 'AbortError')); };
      settings.signal.addEventListener('abort', abort, { once: true });
      for (const [name, value] of Object.entries(settings.headers)) xhr.setRequestHeader(name, value);
      xhr.upload.onprogress = event => { if (settings.sequence !== sequence || settings.signal.aborted) return; progress = event.lengthComputable ? { loaded: event.loaded, total: event.total, percentage: Math.round(event.loaded * 100 / event.total) } : { loaded: event.loaded }; notify(); };
      const fail = () => reject(pageError('page.upload_failed', 'Upload failed.', xhr.status || 500));
      xhr.onerror = fail; xhr.ontimeout = fail; xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
      xhr.onload = () => { try { const result = validatePageResponse(JSON.parse(xhr.responseText)); if (xhr.status >= 400 && xhr.status !== 409 && !(xhr.status === 422 && Object.keys(result.errors || {}).length)) fail(); else resolve(result); } catch { reject(pageError('page.upload_response', 'Invalid upload response.')); } };
      xhr.onloadend = () => settings.signal.removeEventListener('abort', abort);
      if (settings.signal.aborted) { settings.signal.removeEventListener('abort', abort); abort(); } else xhr.send(body);
    });
  }
  async function submit(url, settings = {}) {
    active?.abort(); active = new AbortController(); const current = ++sequence, submittedVersion = valuesVersion;
    processing = true; success = false; errors = {}; progress = null; notify();
    try {
      const target = new URL(url, options.origin || globalThis.location?.origin || 'http://localhost');
      const origin = options.origin || globalThis.location?.origin || 'http://localhost';
      if (target.origin !== origin) throw pageError('page.form_origin', 'Form submission must stay on the same origin.');
      const method = (settings.method || 'POST').toUpperCase();
      const data = settings.transform ? settings.transform(copy(values)) : copy(values);
      const headers = { Accept: 'text/html', 'X-XTend-Page': '1', 'X-XTend-Version': options.client.page.version, 'X-XTend-Context':options.client.page.contextKey, 'X-XTend-Error-Bag': options.errorBag || 'default', ...(options.headers?.() || {}), ...(settings.headers || {}) };
      const token = options.csrfToken?.() || options.client.page.csrfToken || globalThis.document?.querySelector('meta[name="csrf-token"]')?.content; if (token) headers['X-CSRF-TOKEN'] = token;
      let result;
      if (hasFiles(data) || settings.forceFormData) { const body = multipart(data); if (method !== 'POST') body.append('_method', method); result = await upload(target.href, body, { signal: active.signal, headers, sequence: current }); }
      else result = await options.client.request(target.href, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: active.signal });
      if (current !== sequence || submittedVersion !== valuesVersion) return null;
      if (result.kind === 'download') { await options.client.download(result); success = true; return null; }
      if (result.kind === 'redirect') result = await options.client.visit(result.location, { preserveState: true, preserveScroll: true, replace: true });
      else if (result.kind === 'reload') { await options.client.visit(target.href, { preserveState: true }); return null; }
      else await options.client.commit(result);
      if (current !== sequence || submittedVersion !== valuesVersion || !result) return null;
      errors = result?.errors?.[options.errorBag || 'default'] || {};
      success = Object.keys(errors).length === 0;
      if (success && settings.resetOnSuccess) { values = copy(defaults); }
      if (!success) options.focusError?.(Object.keys(errors)[0]);
      return result;
    } finally { if (current === sequence) { processing = false; notify(); } }
  }
  function assignField(target, name, value) {
    const segments = name.replace(/\[([^\]]*)\]/gu, '.$1').split('.');
    for (const segment of segments) if (segment) assertKey(segment);
    let owner = target;
    for (let index = 0; index < segments.length; index++) {
      const key = segments[index] || (Array.isArray(owner) ? owner.length : '');
      if (key === '') throw pageError('page.form_field', 'Invalid form field name.');
      if (index === segments.length - 1) owner[key] = value;
      else { owner[key] ??= segments[index + 1] === '' || /^\d+$/u.test(segments[index + 1]) ? [] : {}; if (!owner[key] || typeof owner[key] !== 'object') owner[key] = {}; owner = owner[key]; }
    }
  }
  function readForm(element) {
    const target = {}; const data = new FormData(element);
    for (const key of new Set(data.keys())) {
      const entries = data.getAll(key);
      if (key.endsWith('[]')) for (const entry of entries) assignField(target,key,entry);
      else assignField(target,key,entries.length > 1 ? entries : entries[0]);
    }
    return target;
  }
  function readCustomForm(data) {
    const target = {};
    for (const [name, value] of Object.entries(data || {})) assignField(target, name, value);
    return target;
  }
  const bindings = new Set();
  const api = {
    get state() { return { values: copy(values), errors: copy(errors), processing, validating, success, progress, dirty: hasFiles(values) || JSON.stringify(values) !== JSON.stringify(defaults) }; },
    set(name, value) { assignField(values,name,value); valuesVersion++; success = false; validationController?.abort(); notify(); },
    defaults(next) { defaults = copy(next || values); notify(); },
    reset(...keys) {
      if (!keys.length) values = copy(defaults);
      else for (const key of keys) {
        const segments = key.replace(/\[([^\]]+)\]/gu, '.$1').split('.');
        segments.forEach(assertKey);
        const initial = segments.reduce((owner, segment) => owner?.[segment], defaults);
        assignField(values, key, copy(initial));
      }
      valuesVersion++; validationController?.abort(); errors = {}; success = false; notify();
    },
    setErrors(next) { errors = copy(next); notify(); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    submit,
    async validate(url, fields = Object.keys(values)) {
      validationController?.abort(); const controller = validationController = new AbortController(); validating = true; notify();
      try {
        if (!options.validate) throw pageError('page.validation_provider', 'Live validation requires a host provider.');
        const validationValues = Object.fromEntries(Object.entries(values).filter(([, value]) => !hasFiles(value)));
        const result = await options.validate({ url, fields, values: copy(validationValues), signal: controller.signal });
        if (!controller.signal.aborted && validationController === controller) { for (const field of fields) delete errors[field]; Object.assign(errors, result.errors || {}); }
        return result;
      } finally { if (validationController === controller) { validating = false; notify(); } }
    },
    bind(element, settings = {}) {
      const handler = event => {
        if (!event.detail?.data && event.target !== element) return;
        event.preventDefault();
        values = event.detail?.data ? readCustomForm(event.detail.data) : readForm(element); valuesVersion++;
        submit(settings.action || element.getAttribute('action'), { ...settings, method: settings.method || element.getAttribute('method') || 'POST' }).catch(error => options.onError?.(error));
      };
      element.addEventListener('submit', handler);
      const input = event => {
        if (element.tagName === 'FORM' || typeof element.getFormData === 'function') { values = element.tagName === 'FORM' ? readForm(element) : readCustomForm(element.getFormData()); valuesVersion++; success = false; validationController?.abort(); notify(); }
        else if (event.detail?.name) api.set(event.detail.name, event.detail.value);
      };
      element.addEventListener('input', input); element.addEventListener('change', input);
      const unsubscribe = api.subscribe(state => {
        element.toggleAttribute('busy', state.processing); element.setAttribute('aria-busy', String(state.processing)); element.toggleAttribute('invalid', Object.keys(state.errors).length > 0);
        for (const control of element.querySelectorAll('[name]')) { const invalid = Boolean(state.errors[control.name]?.length); control.setAttribute('aria-invalid', String(invalid)); }
        if (!state.processing && Object.keys(state.errors).length && !options.focusError) Array.from(element.querySelectorAll('[name]')).find(control => state.errors[control.name]?.length)?.focus();
      });
      const unbind = () => { element.removeEventListener('submit', handler); element.removeEventListener('input', input); element.removeEventListener('change', input); unsubscribe(); bindings.delete(unbind); };
      bindings.add(unbind); return unbind;
    },
    remember(key) { options.client.remember(key, values); },
    restore(key) { const restored = options.client.remember(key); if (restored) values = { ...defaults, ...restored }; notify(); },
    cancel() { sequence++; active?.abort(); validationController?.abort(); processing = validating = false; notify(); },
    dispose() { unregister?.(); api.cancel(); for (const unbind of bindings) unbind(); listeners.clear(); }
  };
  const unregister = options.client.registerResource?.(() => api.dispose(), {layout:options.persistent === true});
  return api;
}
export function createPrecognitionValidator(options = {}) {
  return createHostValidator(options, fields=>({Precognition:'true','Precognition-Validate-Only':fields.join(',')}));
}
export function createNodePageValidator(options = {}) {
  return createHostValidator(options, fields=>({'X-XTend-Validate':JSON.stringify(fields)}));
}
function createHostValidator(options, selectionHeaders) {
  const fetcher = options.fetch || globalThis.fetch;
  return async ({ url, fields, values, signal }) => {
    const origin = options.origin || globalThis.location?.origin || 'http://localhost';
    const target = new URL(url, origin);
    if (target.origin !== origin) throw pageError('page.validation_origin', 'Live validation must stay on the same origin.');
    for (const field of fields) assertKey(field);
    const token=options.csrfToken?.() || globalThis.document?.querySelector('meta[name="csrf-token"]')?.content;
    const response = await fetcher(target.href, { method: options.method || 'POST', credentials: 'same-origin', signal, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...selectionHeaders(fields), ...(token ? {'X-CSRF-TOKEN':token} : {}), ...(options.headers?.() || {}) }, body: JSON.stringify(values) });
    if (response.status === 204) return { errors: {} };
    if (response.status !== 422) throw pageError('page.live_validation_failed', 'Live validation failed.', response.status);
    const result = await response.json();
    if (!result?.errors || Array.isArray(result.errors) || typeof result.errors !== 'object' || Object.entries(result.errors).some(([field, messages]) => { assertKey(field); return !Array.isArray(messages) || messages.some(message => typeof message !== 'string'); })) throw pageError('page.validation_result', 'Invalid live validation result.');
    return result;
  };
}

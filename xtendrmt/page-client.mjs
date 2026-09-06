import { validatePageResponse, mergePageProps, safePageJson, pageError, composePageDescriptor, assertKey, mergePageHead } from './page-contract.mjs';
import { createRmtDomDescriptorRenderer } from './rmt-dom-descriptor-renderer.js';
import { projectPortableRender } from './rmt-portable-render.js';
const clone = value => JSON.parse(JSON.stringify(value));
const secret = /password|token|secret|authorization|csrf/iu;
export function safeRemember(value) {
  if (typeof File !== 'undefined' && value instanceof File || typeof Blob !== 'undefined' && value instanceof Blob) return undefined;
  if (Array.isArray(value)) return value.map(safeRemember);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !secret.test(key)).map(([key, value]) => [key, safeRemember(value)]));
  return value;
}
export function createPageClient(options) {
  const win = options.window || globalThis.window;
  const doc = win?.document;
  const fetcher = options.fetch || globalThis.fetch;
  for (const key of ['cacheSize', 'onceLimit', 'timeoutMs', 'maxConcurrentRequests', 'maxQueuedRequests']) if (options[key] !== undefined && (!Number.isSafeInteger(options[key]) || options[key] < 1)) throw pageError('page.client_option', `${key} must be a positive integer.`);
  const maxConcurrent = Math.min(16, options.maxConcurrentRequests || 4), maxQueued = Math.min(256, options.maxQueuedRequests || 32);
  let inFlight = 0;
  const waiting = [];
  async function acquire(signal) {
    signal.throwIfAborted();
    if (inFlight < maxConcurrent) { inFlight++; return; }
    if (waiting.length >= maxQueued) throw pageError('page.request_capacity', 'The page request queue is full.');
    await new Promise((resolve, reject) => {
      const entry = {resolve: () => { signal.removeEventListener('abort', abort); resolve(); }};
      const abort = () => { const index = waiting.indexOf(entry); if (index >= 0) waiting.splice(index, 1); reject(signal.reason); };
      signal.addEventListener('abort', abort, {once:true}); waiting.push(entry);
    });
  }
  function releaseRequest() { const next = waiting.shift(); if (next) next.resolve(); else inFlight--; }
  const historyKey = `xtend.history.key:${options.applicationKey || 'default'}`;
  let page = validatePageResponse(options.initialPage), generation = 0, disposed = false, active = null, remembered = {}, revision = 0;
  let commits = Promise.resolve();
  let viewTransition = null;
  const skipTransition = () => { viewTransition?.skipTransition(); viewTransition = null; };
  const reloads = new Map();
  const listeners = new Set(), controllers = new Set(), cache = new Map(), once = new Map(), resources = new Set(), layoutResources = new Set();
  const rememberOnce = current => {
    for (const [key, record] of once) if (record.expiry <= Date.now()) once.delete(key);
    for (const [name, record] of Object.entries(current.once || {})) if (Object.prototype.hasOwnProperty.call(current.props, name)) once.set(record.key, { expiry: Date.now() + record.ttl, value: clone(current.props[name]) });
    while (once.size > Math.min(256, options.onceLimit || 128)) once.delete(once.keys().next().value);
  };
  rememberOnce(page);
  const root = options.root || doc?.getElementById('xtend-page');
  const renderer = options.renderer || (doc ? createRmtDomDescriptorRenderer({ documentTarget: doc }) : null);
  const origin = win?.location?.origin || options.origin || 'http://localhost';
  const absolute = url => { const target = new URL(url, origin); if (!['http:', 'https:'].includes(target.protocol)) throw pageError('page.navigation_protocol','Navigation requires an HTTP(S) destination.'); return target; };
  const emit = (type, detail = {}) => { for (const listener of listeners) listener({ type, page, ...detail }); };
  const scope = () => `${page.contextKey}:${page.version}`;
  const release = (owners = resources) => { for (const dispose of owners) { try { dispose(); } catch (error) { emit('cleanup-error',{error}); } } owners.clear(); };
  function head(records) {
    if (!doc) return;
    doc.head.querySelectorAll('[data-xtend-page-head]').forEach(node => node.remove());
    for (const record of mergePageHead([], records || [])) {
      if (record.tag === 'title') { doc.title = record.text || ''; continue; }
      const node = doc.createElement(record.tag === 'json-ld' ? 'script' : record.tag); node.setAttribute('data-xtend-page-head', '');
      if (record.tag === 'json-ld') { node.type = 'application/ld+json'; node.nonce = doc.getElementById('xtend-page-data')?.nonce || ''; node.textContent = safePageJson(record.data); }
      else for (const [key, value] of Object.entries(record.attributes || {})) node.setAttribute(key, String(value));
      doc.head.appendChild(node);
    }
  }
  async function render(next, previous, isCurrent = () => !disposed) {
    const sameContext = previous?.contextKey === next.contextKey && previous?.version === next.version;
    if (options.render) await options.render(next, { previous, preserveLayout: sameContext && previous?.layout === next.layout, isCurrent });
    else if (renderer && root) {
      const projected = next.renderArtifact ? projectPortableRender(next.renderArtifact, next.props) : { descriptor: next.ssr?.chunk?.markup?.descriptor, model: next.props };
      const outlet = sameContext && previous?.layout && previous.layout === next.layout && root.querySelector('[data-xtend-page-slot]');
      if (projected.descriptor) {
        const descriptor = next.layoutArtifact && !outlet ? composePageDescriptor(projectPortableRender(next.layoutArtifact, {...next.shared,...next.props}).descriptor, projected.descriptor) : projected.descriptor;
        if (sameContext) renderer.commit({ operation: 'reconcile-children', target: outlet || root, descriptors: [descriptor], context: { model: projected.model } });
        else renderer.commit({operation:'replace-children',target:root,descriptor,context:{model:projected.model}});
      }
    }
    if (isCurrent()) head(next.head);
  }
  function commit(next, settings = {}) {
    const expected = settings.generation ?? generation;
    const work = commits.catch(() => {}).then(() => {
      if (disposed || generation !== expected) return null;
      return applyCommit(next, settings, expected);
    });
    commits = work;
    return work;
  }
  async function applyCommit(next, settings, expected) {
    validatePageResponse(next);
    if (next.kind !== 'page') throw pageError('page.commit_kind', 'Only page responses can be committed.');
    if (absolute(next.url).origin !== origin) throw pageError('page.commit_origin','Page data must belong to the current origin.');
    const previous = page;
    if (next.contextKey !== previous.contextKey || next.version !== previous.version) invalidate();
    if (next.partial && next.contextKey !== previous.contextKey) throw pageError('page.partial_context', 'Partial data belongs to a different authenticated context.');
    const delivered = next;
    const retained = {};
    for (const [name, record] of Object.entries(next.once || {})) {
      const cached = once.get(record.key);
      if (!Object.prototype.hasOwnProperty.call(next.props, name) && cached?.expiry > Date.now()) retained[name] = clone(cached.value);
    }
    next = { ...next, props: { ...retained, ...next.props } };
    if (next.partial && (next.page !== previous.page || next.url !== previous.url)) throw pageError('page.partial_target', 'Partial data belongs to a different page.');
    if (next.partial) next = { ...previous, ...next, props: mergePageProps(previous.props, next.props, next.merge), renderArtifact: next.renderArtifact || previous.renderArtifact, ssr: next.ssr || previous.ssr };
    const apply = async () => {
      if (disposed || expected !== generation) return;
      await render(next, previous, () => !disposed && expected === generation);
      if (disposed || expected !== generation) return;
      page = next; revision++;
      if (previous.page !== next.page || previous.url !== next.url || previous.contextKey !== next.contextKey || previous.version !== next.version) release();
      if (previous.layout !== next.layout || previous.contextKey !== next.contextKey || previous.version !== next.version) release(layoutResources);
      // Position the destination before the browser takes its new-page snapshot.
      settings.afterRender?.();
    };
    if (settings.transition && !win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      if (options.transition) await options.transition(apply);
      else if (options.viewTransitions && doc?.startViewTransition) {
        skipTransition();
        const transition = viewTransition = doc.startViewTransition(apply);
        // Skipped snapshots still execute the update callback. Only callback
        // failures reject the commit; animation failures are cosmetic.
        transition.ready.catch(() => {});
        const finished = () => { if (viewTransition === transition) viewTransition = null; };
        transition.finished.then(finished, finished);
        await transition.updateCallbackDone;
      } else await apply();
    }
    else await apply();
    if (disposed || expected !== generation) return null;
    rememberOnce(delivered);
    emit('navigate');
    return page;
  }
  function invalidate() {
    cache.clear(); once.clear(); remembered = {}; revision++;
    try { win?.sessionStorage?.removeItem(historyKey); } catch { /* memory state was already cleared */ }
  }
  async function crypt(value, decode = false) {
    const crypto = win?.crypto || globalThis.crypto;
    const storage = win?.sessionStorage;
    if (!crypto?.subtle || !storage) throw pageError('page.history_crypto', 'Encrypted history requires WebCrypto and sessionStorage.');
    let raw = storage.getItem(historyKey);
    if (!raw) { if (decode) return null; raw = JSON.stringify(Array.from(crypto.getRandomValues(new Uint8Array(32)))); storage.setItem(historyKey, raw); }
    const key = await crypto.subtle.importKey('raw', Uint8Array.from(JSON.parse(raw)), 'AES-GCM', false, ['encrypt', 'decrypt']);
    if (decode) return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Uint8Array.from(value.iv) }, key, Uint8Array.from(value.bytes))));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(safePageJson(value)));
    return { iv: Array.from(iv), bytes: Array.from(new Uint8Array(bytes)) };
  }
  async function saveHistory(replace, url = page.url) {
    if (!win?.history) return;
    const data = { scope: scope(), remembered: safeRemember(remembered), scroll: [win.scrollX, win.scrollY], regions: Array.from(doc?.querySelectorAll('[data-xtend-scroll]') || []).map(node => [node.getAttribute('data-xtend-scroll'), node.scrollLeft, node.scrollTop]) };
    const state = options.encryptHistory ? { encrypted: await crypt(data) } : { data };
    win.history[replace ? 'replaceState' : 'pushState']({ ...win.history.state, xtend: state }, '', url);
  }
  async function request(url, settings = {}) {
    if (disposed) throw pageError('page.disposed', 'Page client is disposed.');
    const target = absolute(url);
    if (target.origin !== origin) throw pageError('page.cross_origin', 'Page requests must stay on the same origin.');
    const controller = new AbortController(); controllers.add(controller);
    const abort = () => controller.abort(settings.signal.reason);
    if (settings.signal?.aborted) abort(); else settings.signal?.addEventListener('abort', abort, { once: true });
    const headers = { Accept: 'text/html', 'X-XTend-Page': '1', 'X-XTend-Page-Wire':'1', 'X-XTend-Version': page.version, 'X-XTend-Context':page.contextKey, ...(options.headers?.() || {}), ...(settings.headers || {}) };
    for (const [key, header] of [['only', 'Only'], ['deferred', 'Deferred']]) if (settings[key]) headers[`X-XTend-${header}`] = JSON.stringify(settings[key]);
    const rememberedOnce = [...once].filter(([, record]) => record.expiry > Date.now()).map(([key]) => key);
    if (rememberedOnce.length) headers['X-XTend-Once'] = JSON.stringify(rememberedOnce);
    if (settings.prefetch) headers['X-XTend-Prefetch'] = '1';
    const timer = setTimeout(() => controller.abort(new Error('Page request timed out.')), options.timeoutMs || 30000);
    let acquired = false;
    try {
      await acquire(controller.signal); acquired = true; controller.signal.throwIfAborted();
      const response = await fetcher(target.href, { method: settings.method || 'GET', body: settings.body, credentials: 'same-origin', headers, signal: controller.signal });
      const disposition = response.headers.get('content-disposition') || '';
      if (response.ok && /^attachment(?:;|$)/iu.test(disposition)) {
        let filename = /filename="([^"]*)"/iu.exec(disposition)?.[1] || /filename=([^;\s]+)/iu.exec(disposition)?.[1] || 'download';
        const encoded = /filename\*=UTF-8''([^;]+)/iu.exec(disposition)?.[1];
        if (encoded) { try { filename = decodeURIComponent(encoded); } catch {} }
        filename = filename.replace(/[\x00-\x1f\x7f/\\]/gu, '_');
        return { kind: 'download', filename, blob: await response.blob(), url: target.href };
      }
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw pageError('page.unexpected_response', 'The host did not return an XTend page.', response.status);
      const result = validatePageResponse(await response.json());
      if (!response.ok && response.status !== 409 && !(response.status === 422 && Object.keys(result.errors || {}).length)) throw pageError('page.http_error', 'Page request failed.', response.status);
      return result;
    } finally { if (acquired) releaseRequest(); clearTimeout(timer); controllers.delete(controller); settings.signal?.removeEventListener('abort', abort); }
  }
  async function download(result) {
    if (options.onDownload) await options.onDownload(result);
    else if (doc) {
      const url = win.URL.createObjectURL(result.blob), link = doc.createElement('a');
      link.href = url; link.download = result.filename; link.hidden = true; doc.body.appendChild(link);
      try { link.click(); } finally { link.remove(); setTimeout(() => win.URL.revokeObjectURL(url), 1000); }
    } else throw pageError('page.download_transport', 'Downloads require a browser or an onDownload handler.');
    emit('download');
  }
  async function visit(url, settings = {}) {
    const target = absolute(url);
    if (target.origin !== origin) { win?.location.assign(target.href); return null; }
    skipTransition();
    active?.abort(); const controller = active = new AbortController(); const current = ++generation;
    emit('pending', {url:target.href});
    const saved = page;
    if (!settings.fromHistory) await saveHistory(true);
    if (settings.instant && options.pages?.[settings.instant]) {
      const staged = commits.catch(() => {}).then(() => {
        if (!disposed && current === generation) return render({ ...page, page: settings.instant, props: settings.placeholder || {}, renderArtifact: options.pages[settings.instant], pending: true }, page);
      });
      commits = staged; await staged;
      if (disposed || current !== generation) return null;
    }
    try {
      const key = `${scope()}:${target.href}`, cached = cache.get(key);
      let next;
      if (cached?.expires > Date.now() && !settings.method && !settings.only && !settings.deferred) {
        // Recheck authorization, context and one-time session data on every visit.
        const [prepared, fresh] = await Promise.all([cached.promise, request(target.href, { ...settings, only: [], signal: controller.signal })]);
        cache.delete(key);
        if (prepared.kind === 'page' && fresh.kind === 'page' && prepared.contextKey === fresh.contextKey && prepared.version === fresh.version && prepared.page === fresh.page) next = { ...prepared, ...fresh, props: prepared.props, partial: false, ssr: prepared.ssr, once: prepared.once, merge: prepared.merge };
        else next = fresh.kind !== 'page' ? fresh : await request(target.href, { ...settings, signal: controller.signal });
      } else next = await request(target.href, { ...settings, signal: controller.signal });
      if (current !== generation) return null;
      if (next.kind === 'download') { await download(next); return null; }
      if (next.kind === 'redirect') return visit(next.location, { replace: true });
      if (next.kind === 'reload') { const target = absolute(next.location); emit('version', { next }); if (options.onVersionMismatch) await options.onVersionMismatch(next); else win?.location.assign(target.href); return null; }
      if (!await commit(next, { ...settings, transition: settings.transition ?? options.viewTransitions, generation: current, afterRender: () => {
        if (!settings.preserveScroll && win) {
          const hash = absolute(page.url).hash;
          const anchor = hash && doc.getElementById(decodeURIComponent(hash.slice(1)));
          if (anchor) anchor.scrollIntoView(); else win.scrollTo(0, 0);
          root?.focus?.({ preventScroll: true });
        }
      } })) return null;
      if (!settings.preserveState) remembered = {};
      if (!settings.fromHistory) await saveHistory(settings.replace, page.url);
      if (disposed || current !== generation) return null;
      for (const group of Object.keys(page.deferred || {})) reload({ deferred: [group] }).catch(error => emit('data-error', { group, error }));
      return page;
    } catch (error) { if (current === generation) { if (settings.instant) await render(saved, page); emit('error', { error }); } if (error.name !== 'AbortError' && !controller.signal.aborted) throw error; return null; }
  }
  async function reload(settings = {}) {
    const current = generation, identity = `${page.contextKey}:${page.page}:${page.url}`;
    const selectionKey = JSON.stringify([settings.only || null, settings.deferred || null]);
    const ticket = (reloads.get(selectionKey) || 0) + 1; reloads.set(selectionKey, ticket);
    const next = await request(page.url, settings);
    if (generation !== current || ticket !== reloads.get(selectionKey) || identity !== `${page.contextKey}:${page.page}:${page.url}`) return null;
    if (next.kind === 'download') { await download(next); return null; }
    if (next.kind === 'reload') { emit('version', { next }); return null; }
    if (next.kind === 'redirect') return visit(next.location, { replace: true });
    return commit(next, { ...settings, generation: current });
  }
  async function prefetch(url, settings = {}) {
    const key = `${scope()}:${absolute(url).href}`;
    if (cache.get(key)?.expires > Date.now()) return cache.get(key).promise;
    const promise = request(url, { ...settings, prefetch: true });
    cache.set(key, { promise, expires: Date.now() + (settings.ttl || 30000) });
    while (cache.size > Math.min(256, options.cacheSize || 32)) cache.delete(cache.keys().next().value);
    try { return await promise; } catch (error) { cache.delete(key); throw error; }
  }
  const restoreHistory = async event => {
    const state = event.state?.xtend;
    const restored = await visit(win.location.href, { fromHistory: true, preserveScroll: true });
    if (!restored) return;
    const current = generation;
    let data;
    try { data = state?.encrypted ? await crypt(state.encrypted, true) : state?.data; } catch { return; }
    if (current !== generation || data?.scope !== scope()) return;
    remembered = data.remembered || {}; win.scrollTo(...data.scroll);
    for (const [key, x, y] of data.regions || []) for (const node of doc.querySelectorAll('[data-xtend-scroll]')) if (node.getAttribute('data-xtend-scroll') === key) node.scrollTo(x, y);
    emit('restore');
  };
  const popstate = event => { restoreHistory(event).catch(error => emit('error', { error })); };
  const navigationOptions = element => Object.fromEntries([
    ['preserveScroll', 'data-xtend-preserve-scroll'],
    ['preserveState', 'data-xtend-preserve-state'],
    ['transition', 'data-xtend-transition']
  ].filter(([, attribute]) => element.hasAttribute(attribute))
    .map(([key, attribute]) => [key, element.getAttribute(attribute) !== 'false' && (key !== 'transition' || element.getAttribute(attribute) !== 'none')]));
  const click = event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self' || link.hasAttribute('data-xtend-native') || link.closest('[contenteditable]')) return;
    const target = new URL(link.href, origin);
    if (target.origin !== origin || !['http:', 'https:'].includes(target.protocol)) return;
    if (target.pathname === win.location.pathname && target.search === win.location.search && target.hash) return;
    event.preventDefault(); visit(target.href, navigationOptions(link)).catch(() => {});
  };
  const submit = event => {
    const form = event.target, button = event.submitter;
    if (event.defaultPrevented || form?.tagName !== 'FORM' || form.hasAttribute('data-xtend-native')) return;
    const method = button?.getAttribute('formmethod') || form.getAttribute('method') || 'get';
    const browsingTarget = button?.getAttribute('formtarget') || form.target;
    if (method.toLowerCase() !== 'get' || browsingTarget && browsingTarget !== '_self') return;
    const target = new URL(button?.getAttribute('formaction') || form.action, origin);
    if (target.origin !== origin || !['http:', 'https:'].includes(target.protocol)) return;
    const entries = [...new win.FormData(form, button || undefined)];
    if (entries.some(([,value])=>typeof value !== 'string')) return;
    target.search = new URLSearchParams(entries).toString();
    event.preventDefault(); visit(target.href, {...navigationOptions(form), ...(button ? navigationOptions(button) : {})}).catch(() => {});
  };
  win?.addEventListener('popstate', popstate);
  if (options.links !== false) doc?.addEventListener('click', click);
  if (options.forms === true) doc?.addEventListener('submit', submit);
  const api = {
    get page() { return page; }, visit, reload, request, commit, prefetch, invalidate, download,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    remember(key, value) { assertKey(key); if (arguments.length === 1) return clone(remembered[key] ?? null); remembered[key] = safeRemember(value); },
    registerResource(dispose, settings = {}) { const owners = settings.layout ? layoutResources : resources; owners.add(dispose); return () => owners.delete(dispose); },
    poll(interval, settings = {}) {
      if (!Number.isFinite(interval) || interval < 1) throw pageError('page.poll_interval', 'Polling needs a positive interval.');
      let busy = false;
      const timer = setInterval(() => { if (!doc?.hidden && !busy) { busy = true; reload(settings).catch(error => emit('data-error', { error })).finally(() => {busy = false;}); } }, interval);
      const dispose = () => {clearInterval(timer); resources.delete(dispose);}; resources.add(dispose); return dispose;
    },
    whenVisible(element, settings = {}) { const observer = new win.IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); reload(settings).catch(error => emit('data-error', { error })); } }); observer.observe(element); const dispose = () => observer.disconnect(); resources.add(dispose); return dispose; },
    async loadMore(direction = 'next') { const url = page.pagination?.[direction]; if (!url) return null; const current = generation; const next = await request(url, { only: page.pagination.props }); if (current !== generation) return null; if (next.kind !== 'page' || next.page !== page.page || next.contextKey !== page.contextKey || next.version !== page.version) return visit(url); const result = await commit({...page, ...next, partial:false, props:mergePageProps(page.props, next.props, next.merge), renderArtifact:next.renderArtifact || page.renderArtifact, ssr:next.ssr || page.ssr}, {generation:current}); if (result) await saveHistory(true, result.url); return result; },
    async optimistic(update, mutation) { const before = page, applied = { ...page, props: update(clone(page.props)) }; if (!await commit(applied)) return null; const token = revision; try { const result = await mutation(); if (result?.schema && revision === token) await commit(result); return result; } catch (error) { if (revision === token) await commit(before); throw error; } },
    async start() {
      if (options.activateInitial) {
        const result = await options.activateInitial(page);
        head(page.head); if (result?.resume) emit('resume', {result: result.resume});
      } else if (page.ssr?.executionMode === 'server_prerender_resume') {
        const {resumeResponse} = await import('./rmt-resume-runtime.js');
        const result = await resumeResponse(page.ssr, {}, {...options.resume,root,windowTarget:win,hydrateResponse:async()=>{await render(page,page);return {ok:true};}});
        if (!result.ok) throw pageError('page.resume_rejected','The initial page could neither resume nor hydrate.');
        head(page.head); emit('resume',{result});
      } else await render(page, page);
      await saveHistory(true); await Promise.all(Object.keys(page.deferred || {}).map(group => reload({deferred:[group]}).catch(error => emit('data-error', {group,error})))); return page;
    },
    dispose() { disposed = true; generation++; skipTransition(); active?.abort(); for (const controller of controllers) controller.abort(); release(); release(layoutResources); listeners.clear(); cache.clear(); win?.removeEventListener('popstate', popstate); doc?.removeEventListener('click', click); doc?.removeEventListener('submit', submit); if (options.router?.pageClient === api) options.router.pageClient = null; }
  };
  if (options.router) options.router.pageClient = api;
  return api;
}

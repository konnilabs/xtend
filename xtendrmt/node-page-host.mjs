import { randomBytes, createHash } from 'node:crypto';
import {readFileSync} from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { PAGE_MANIFEST_SCHEMA, PAGE_RESPONSE_SCHEMA, parsePageSelection, resolvePageProps, safePageJson, pageError, mergePageHead, composePageDescriptor, assertKey } from './page-contract.mjs';
import { createRmtNodeSsrAdapter } from './rmt-node-ssr-adapter.js';
import { projectPortableRender } from './rmt-portable-render.js';
const escape = value => String(value ?? '').replace(/[&<>"']/gu, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function createNodePageRouteManifest(routes) {
  const records = {};
  for (const route of [...routes].sort((a,b)=>a.name.localeCompare(b.name))) {
    assertKey(route.name);
    if (Object.prototype.hasOwnProperty.call(records,route.name) || typeof route.uri !== 'string' || !Array.isArray(route.methods) || !route.methods.length) throw pageError('page.route_invalid','Named host routes need unique identities, a URI and methods.');
    records[route.name] = {uri:route.uri,methods:route.methods.map(method=>String(method).toUpperCase()),parameters:(route.parameters || []).map(assertKey),domain:route.domain || null};
  }
  return {schema:'xtend.page-routes.v1',host:'node',routes:records};
}
export function renderPageDocument(page, html, assets = {}, nonce = '') {
  const head = (page.head || []).map(tag => {
    if (tag.tag === 'title') return `<title>${escape(tag.text)}</title>`;
    if (tag.tag !== 'meta') throw pageError('page.invalid_head', 'Only title and meta head records are supported.');
    return `<meta data-xtend-page-head ${Object.entries(tag.attributes || {}).map(([key, value]) => {
      if (!['name', 'property', 'content', 'charset', 'http-equiv'].includes(key) || key === 'http-equiv') throw pageError('page.invalid_head', 'Unsafe head attribute.');
      return `${key}="${escape(value)}"`;
    }).join(' ')}>`;
  }).join('');
  const assetUrl = value => { if (!/^\/(?!\/)/u.test(value)) throw pageError('page.invalid_asset', 'Page assets must use same-origin absolute paths.'); return escape(value); };
  return `<!doctype html><html><head><meta charset="utf-8">${head}${(assets.css || []).map(url => `<link rel="stylesheet" href="${assetUrl(url)}">`).join('')}</head><body><main id="${page.ssr?.resume ? 'xtend-page-container' : 'xtend-page'}" tabindex="-1">${html}</main><script type="application/json" id="xtend-page-data" nonce="${escape(nonce)}">${safePageJson(page)}</script>${assets.entry ? `<script type="module" src="${assetUrl(assets.entry)}" nonce="${escape(nonce)}"></script>` : ''}</body></html>`;
}
export function createNodePageHost(options) {
  const { manifest } = options;
  if (manifest?.schema !== PAGE_MANIFEST_SCHEMA || typeof manifest.version !== 'string') throw pageError('page.manifest_invalid', 'A versioned page manifest is required.');
  for (const [file, expected] of Object.entries(manifest.runtimeFingerprints?.node || {})) {
    if (!/^[a-z0-9-]+\.m?js$/u.test(file) || createHash('sha256').update(readFileSync(new URL(file,import.meta.url))).digest('hex') !== expected) throw pageError('page.runtime_mismatch','Page build and Node runtime are incompatible. Rebuild the pages with the deployed package.');
  }
  const adapter = options.adapter || createRmtNodeSsrAdapter(options.ssr || {});
  const controllers = new Set();
  let disposed = false;
  async function resolve(request, signal, context) {
    signal.throwIfAborted();
    const selection = parsePageSelection(request.headers);
    if (request.headers['x-xtend-context'] !== context.contextKey) selection.once = [];
    context.selection = selection;
    if (request.headers['x-xtend-validate']) {
      if (!options.validate) throw pageError('page.validation_unavailable','This host has no validation provider.',405);
      let fields;
      try { fields=JSON.parse(request.headers['x-xtend-validate']); if (!Array.isArray(fields) || fields.length>256 || fields.some(field=>typeof field!=='string' || !field)) throw new Error(); }
      catch { throw pageError('page.validation_fields','Invalid validation field selection.',400); }
      fields.forEach(assertKey);
      const validation = await options.validate(context, fields); signal.throwIfAborted();
      if (!validation?.errors || typeof validation.errors !== 'object' || Array.isArray(validation.errors)) throw pageError('page.validation_result','Invalid host validation result.');
      return {validation,status:Object.keys(validation.errors).length ? 422 : 204,context};
    }
    const resolved = await options.resolvePage(context);
    signal.throwIfAborted();
    if (!resolved) return null;
    const contextKey = context.contextKey;
    if (typeof contextKey !== 'string' || !contextKey) throw pageError('page.context_missing', 'The host must supply an opaque contextKey for the current user/tenant.');
    const base = { schema: PAGE_RESPONSE_SCHEMA, version: manifest.version, contextKey };
    if (resolved.redirect) {
      const target = new URL(resolved.redirect, context.origin || 'http://localhost');
      if (!['http:', 'https:'].includes(target.protocol)) throw pageError('page.redirect_invalid', 'Unsupported redirect protocol.');
      return { status: request.headers['x-xtend-page'] ? 409 : resolved.status || 303, headers: { Location: resolved.redirect }, page: { ...base, kind: 'redirect', location: resolved.redirect }, context };
    }
    if (resolved.download) return { download: resolved.download, status: resolved.status || 200, headers: resolved.headers || {}, context };
    const definition = manifest.pages?.[resolved.page];
    if (!definition) throw pageError('page.unknown_page', 'The selected page is absent from the build manifest.', 404);
    const version = request.headers['x-xtend-version'];
    if (version && version !== manifest.version) return { status: 409, page: { ...base, kind: 'reload', location: request.url }, headers: {}, context };
    const shared = await options.share?.(context) || {};
    signal.throwIfAborted();
    const data = await resolvePageProps(resolved.props, context, selection);
    const partial = Boolean(selection.only || selection.deferred);
    const page = { ...base, ...data, kind: 'page', page: resolved.page, url: resolved.url || request.url, layout: resolved.layout ?? definition.layout ?? null, head: resolved.head || definition.head || [], shared, flash: selection.prefetch ? {} : resolved.flash || {}, errors: resolved.errors || {}, partial, pagination: resolved.pagination || null, renderArtifact: definition.artifact || null };
    const layout = page.layout && manifest.layouts?.[page.layout];
    if (context.csrfToken) page.csrfToken = context.csrfToken;
    if (page.layout && !layout) throw pageError('page.layout_missing', 'The declared layout is absent from the page manifest.');
    page.head = mergePageHead(layout?.head, page.head);
    page.layoutArtifact = layout?.artifact || null;
    let html = '', result;
    if (!partial) {
      const input = definition.artifact ? projectPortableRender(definition.artifact, data.props) : { ...(definition.input || {}), model: data.props };
      if (layout) input.descriptor = composePageDescriptor(projectPortableRender(layout.artifact, {...shared,...data.props}).descriptor, input.descriptor);
      if ((resolved.renderOptions?.executionMode || options.ssr?.executionMode) === 'server_prerender_resume' && input.descriptor) input.descriptor = {type:'element',tag:'section',attributes:{id:'xtend-page'},children:[input.descriptor]};
      result = await adapter.render(input.descriptor ? { descriptor: input.descriptor } : input, { model: input.model, rootId: 'xtend-page', nativeForms: true, signal, ...(resolved.renderOptions || {}) });
      if (!result.ok) throw pageError('page.render_failed', 'Page rendering failed.');
      html = result.html; page.ssr = result.response;
    }
    return { status: resolved.status || 200, headers: result?.headers || {}, page, html, context };
  }
  async function handle(request, response) {
    if (disposed) throw pageError('page.disposed', 'Page host is disposed.');
    if (options.appServiceHost && await options.appServiceHost.handle(request, response)) return true;
    const controller = new AbortController(); controllers.add(controller);
    const abort = () => { if (!response.writableEnded) controller.abort(new Error('Client disconnected.')); };
    request.once('aborted', abort); response.once('close', abort);
    const timeout = setTimeout(() => controller.abort(new Error('Page request timed out.')), options.timeoutMs || 30000);
    let context, finished = false;
    const cleaned = new Set();
    async function cleanup(value) {
      if (!options.cleanup || !value || cleaned.has(value)) return;
      cleaned.add(value);
      let timer;
      try { await Promise.race([Promise.resolve().then(() => options.cleanup(value)), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Page cleanup timed out.')), options.cleanupTimeoutMs || 5000); })]); }
      catch (error) { try { options.onCleanupError?.(error, value); } catch { /* A reporting hook cannot prevent transport cleanup. */ } }
      finally { clearTimeout(timer); }
    }
    try {
      const work = Promise.resolve().then(() => options.createContext?.(request, controller.signal)).then(async value => {
        context = { ...value, request, signal: controller.signal };
        if (finished) { await cleanup(context); return null; }
        return resolve(request, controller.signal, context);
      });
      const aborted = new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true }));
      const result = await Promise.race([work, aborted]);
      if (!result) return false;
      response.statusCode = result.status;
      for (const [name, value] of Object.entries(result.headers || {})) response.setHeader(name, value);
      response.setHeader('Cache-Control', 'private, no-store'); response.setHeader('Vary', 'X-XTend-Page, X-XTend-Version, X-XTend-Only, X-XTend-Deferred, X-XTend-Once');
      if (result.validation) { response.setHeader('Content-Type','application/json'); response.end(result.status===204 ? undefined : safePageJson(result.validation)); return true; }
      if (request.method === 'HEAD') { result.download?.destroy?.(); response.end(); return true; }
      if (result.download) { await pipeline(result.download instanceof Readable ? result.download : Readable.fromWeb(result.download), response, { signal: controller.signal }); return true; }
      if (request.headers['x-xtend-page']) {
        response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(safePageJson(result.page));
      } else if (result.page.kind !== 'page') response.end();
      else {
        const nonce = randomBytes(18).toString('base64');
        // Preserve the renderer policy, adding only the nonce needed by our bootstrap.
        const policy = String(response.getHeader('Content-Security-Policy') || "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'");
        response.setHeader('Content-Security-Policy', /script-src\s/u.test(policy) ? policy.replace(/script-src([^;]*)/u, (_, values) => `script-src${values} 'nonce-${nonce}'`) : `${policy}; script-src 'self' 'nonce-${nonce}'`);
        response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(renderPageDocument(result.page, result.html, manifest.assets, nonce));
      }
      return true;
    } catch (error) {
      try { options.onError?.(error, context); } catch (reportError) { try { options.onCleanupError?.(reportError, context); } catch {} }
      if (!response.headersSent && !response.destroyed) { response.statusCode = error.status || 500; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ error: error.code || 'page.request_failed' })); }
      else if (!response.destroyed) response.destroy(error);
      return true;
    } finally {
      finished = true;
      clearTimeout(timeout); request.removeListener('aborted', abort); response.removeListener('close', abort); controllers.delete(controller);
      await cleanup(context);
    }
  }
  return { handle, dispose(reason = new Error('Page host disposed.')) { disposed = true; for (const controller of controllers) controller.abort(reason); } };
}

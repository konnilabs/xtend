// SPDX-License-Identifier: Apache-2.0
'use strict';
const { captureSSRBuild } = require('./xtension-deployment');
const { freeze, json, copy } = require('./xtension-composition-contract.mjs');
const XTENSION_SSR_API_VERSION = '2.0.0';
const { RMTX_XTENSION_SSR_API_VERSION } = require('./xtension-rmtx-ssr-contract.mjs');
const { normalizeCapturedSSRModuleBaseURL, resolveCapturedSSRImportMeta, createCapturedSSRModuleCache } = require('./server-captured-esm.cjs');
// One immutable captured module graph per genuine build, not per request.
// Actual output bytes are still verified before every lookup. A fresh app
// factory below owns each request's Model, controller and lifetime authority.
const rmtxModules = createCapturedSSRModuleCache();
/** Node-only SSR of the actual captured browser graph. No filesystem module
 * cache, ambient browser globals, framework dependency or server evaluator. */
async function renderMaracaXTensionSSR(options) {
  if (typeof globalThis.window !== 'undefined' || typeof globalThis.document !== 'undefined') throw new TypeError('Node SSR requires a server process without ambient browser globals.');
  const rmtx = options?.schema === 'xtend.maraca.xtension-ssr-render-options.v3';
  if (!options || Object.keys(options).some(key => !['build', 'documentTarget', 'root', 'fabric', 'xtensions', 'initialState', 'generation', 'sign', 'expiresInMs', 'now', ...(rmtx ? ['schema', 'moduleBaseURL'] : [])].includes(key))) throw new TypeError('Closed Node SSR options are required.');
  const { files, entry, componentProfile, nativeOnly, requiresModuleBaseURL } = captureSSRBuild(options.build, rmtx ? { rmtx: true } : {}), path = require('node:path').posix;
  const moduleBaseURL = rmtx ? normalizeCapturedSSRModuleBaseURL(options.moduleBaseURL, requiresModuleBaseURL) : null;
  if (rmtx && nativeOnly && options.xtensions === undefined) options = { ...options, xtensions: { grants: {} } };
  const original = options;
  const grants = Object.fromEntries(Object.entries(original.xtensions?.grants || {}).map(([id, grant]) => {
    const { authorize, validateProps, ...data } = grant; json(data);
    return [id, Object.freeze({ ...freeze(copy(data)), authorize, validateProps })];
  }));
  if (!original.xtensions || Object.keys(original.xtensions).some(key => !['grants', 'loadPeers', 'loadPeerGroup'].includes(key))) throw new TypeError('SSR requires explicit peer-loader and grant ports.');
  if (original.initialState !== undefined) json(original.initialState);
  options = Object.freeze({ ...original, initialState: original.initialState === undefined ? undefined : freeze(copy(original.initialState)),
    xtensions: Object.freeze({ grants: Object.freeze(grants), loadPeers: original.xtensions.loadPeers, loadPeerGroup: original.xtensions.loadPeerGroup }),
    fabric: Object.freeze({ createBoundary: original.fabric?.createBoundary?.bind(original.fabric), emitDiagnostic: original.fabric?.emitDiagnostic?.bind(original.fabric),
      ...(rmtx ? { runFiber: original.fabric?.runFiber?.bind(original.fabric) } : {}) }) });
  async function loadCapturedModule() {
    const { rollup } = require('rollup');
    const bundle = await rollup({ input: entry, onwarn(warning) { if (warning.code !== 'THIS_IS_UNDEFINED') throw new Error(warning.message); }, plugins: [{
      name: 'captured-ssr-build',
      resolveId(id, importer) {
        const target = importer ? path.normalize(path.join(path.dirname(importer), id)) : id;
        if (importer && !id.startsWith('./') && !id.startsWith('../') || !files.has(target)) throw new Error('SSR imports must belong to the captured ESM graph.');
        return target;
      },
      load(id) { if (!files.has(id)) throw new Error('Unknown SSR module.'); return files.get(id); },
      resolveImportMeta(property, { moduleId }) {
        if (!rmtx) return null;
        return resolveCapturedSSRImportMeta(property, { moduleId, entry, moduleBaseURL, files });
      }
    }] });
    try {
      const output = await bundle.generate(rmtx ? { format: 'es', inlineDynamicImports: false, entryFileNames: 'entry.mjs', chunkFileNames: 'chunks/[name]-[hash].mjs' } : { format: 'es', inlineDynamicImports: true });
      if (rmtx) {
        const entries = output.output.filter(chunk => chunk.type === 'chunk' && chunk.isEntry);
        if (entries.length !== 1) throw new Error('RMTX SSR requires one captured entry.');
        return await require('./server-captured-esm.cjs').importCapturedSSRGraph(output.output, entries[0].fileName);
      }
      if (output.output.length !== 1 || output.output[0].imports.length || output.output[0].dynamicImports.length) throw new Error('SSR requires a closed captured module.');
      return await import('data:text/javascript;base64,' + Buffer.from(output.output[0].code + '\n//# sourceURL=xtend-captured-ssr.mjs\n').toString('base64'));
    } finally { await bundle.close(); }
  }
  let app;
  try {
    const pending = rmtx ? rmtxModules(original.build, moduleBaseURL, loadCapturedModule) : loadCapturedModule();
    const module = await pending;
    const createApp = rmtx ? module.createXtendRmtxSSR : module.createXtendMaraca;
    if (typeof createApp !== 'function') throw new TypeError('The captured build lacks its versioned SSR application factory.');
    app = createApp({ documentTarget: options.documentTarget, windowTarget: options.documentTarget?.defaultView, platformTarget: {} });
    const result = await app.facade.boot({ root: options.root, fabric: options.fabric, initialState: options.initialState,
      registerPwa: false, xtensions: { ...options.xtensions, ssr: { schema: rmtx ? 'xtend.maraca.xtension-ssr-options.v3' : componentProfile ? 'xtend.maraca.xtension-ssr-options.v2' : 'xtend.maraca.xtension-ssr-options.v1', mode: 'server', generation: options.generation, sign: options.sign, expiresInMs: options.expiresInMs, now: options.now } } });
    if (!result.ok) throw new Error('SSR application boot failed.');
    await app.facade.whenXTensionsIdle();
    // The browser root keeps the session private; the facade captures only a
    // completed server request, and never grants snapshot JSON live authority.
    return freeze(await app.facade.captureXTensionSSR());
  } finally {
    if (app) { app.facade.dispose('SSR request completed.'); await app.facade.whenXTensionsIdle(); }
  }
}
module.exports = { XTENSION_SSR_API_VERSION, RMTX_XTENSION_SSR_API_VERSION, renderMaracaXTensionSSR };

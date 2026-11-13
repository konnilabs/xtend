// SPDX-License-Identifier: Apache-2.0
'use strict';
const { captureSSRBuild } = require('./xtension-deployment');
const { freeze, json, copy } = require('./xtension-composition-contract.mjs');
const XTENSION_SSR_API_VERSION = '1.0.0';
/** Node-only SSR of the actual captured browser graph. No filesystem module
 * cache, ambient browser globals, framework dependency or server evaluator. */
async function renderMaracaXTensionSSR(options) {
  if (typeof globalThis.window !== 'undefined' || typeof globalThis.document !== 'undefined') throw new TypeError('Node SSR requires a server process without ambient browser globals.');
  if (!options || Object.keys(options).some(key => !['build', 'documentTarget', 'root', 'fabric', 'xtensions', 'initialState', 'generation', 'sign', 'expiresInMs', 'now'].includes(key))) throw new TypeError('Closed Node SSR options are required.');
  const original = options;
  const grants = Object.fromEntries(Object.entries(original.xtensions?.grants || {}).map(([id, grant]) => {
    const { authorize, validateProps, ...data } = grant; json(data);
    return [id, Object.freeze({ ...freeze(copy(data)), authorize, validateProps })];
  }));
  if (!original.xtensions || Object.keys(original.xtensions).some(key => !['grants', 'loadPeers', 'loadPeerGroup'].includes(key))) throw new TypeError('SSR requires explicit peer-loader and grant ports.');
  if (original.initialState !== undefined) json(original.initialState);
  options = Object.freeze({ ...original, initialState: original.initialState === undefined ? undefined : freeze(copy(original.initialState)),
    xtensions: Object.freeze({ grants: Object.freeze(grants), loadPeers: original.xtensions.loadPeers, loadPeerGroup: original.xtensions.loadPeerGroup }),
    fabric: Object.freeze({ createBoundary: original.fabric?.createBoundary?.bind(original.fabric), emitDiagnostic: original.fabric?.emitDiagnostic?.bind(original.fabric) }) });
  const { files, entry } = captureSSRBuild(options.build), path = require('node:path').posix;
  const { rollup } = require('rollup');
  const bundle = await rollup({ input: entry, onwarn(warning) { if (warning.code !== 'THIS_IS_UNDEFINED') throw new Error(warning.message); }, plugins: [{
    name: 'captured-ssr-build',
    resolveId(id, importer) {
      const target = importer ? path.normalize(path.join(path.dirname(importer), id)) : id;
      if (importer && !id.startsWith('./') && !id.startsWith('../') || !files.has(target)) throw new Error('SSR imports must belong to the captured ESM graph.');
      return target;
    },
    load(id) { if (!files.has(id)) throw new Error('Unknown SSR module.'); return files.get(id); }
  }] });
  let app;
  try {
    const output = await bundle.generate({ format: 'es', inlineDynamicImports: true });
    if (output.output.length !== 1 || output.output[0].imports.length || output.output[0].dynamicImports.length) throw new Error('SSR requires a closed captured module.');
    const module = await import('data:text/javascript;base64,' + Buffer.from(output.output[0].code + '\n//# sourceURL=xtend-captured-ssr.mjs\n').toString('base64'));
    app = module.createXtendMaraca({ documentTarget: options.documentTarget, windowTarget: options.documentTarget?.defaultView, platformTarget: {} });
    const result = await app.facade.boot({ root: options.root, fabric: options.fabric, initialState: options.initialState,
      registerPwa: false, xtensions: { ...options.xtensions, ssr: { schema: 'xtend.maraca.xtension-ssr-options.v1', mode: 'server', generation: options.generation, sign: options.sign, expiresInMs: options.expiresInMs, now: options.now } } });
    if (!result.ok) throw new Error('SSR application boot failed.');
    await app.facade.whenXTensionsIdle();
    // The browser root keeps the session private; the facade captures only a
    // completed server request, and never grants snapshot JSON live authority.
    return freeze(await app.facade.captureXTensionSSR());
  } finally {
    if (app) { app.facade.dispose('SSR request completed.'); await app.facade.whenXTensionsIdle(); }
    await bundle.close();
  }
}
module.exports = { XTENSION_SSR_API_VERSION, renderMaracaXTensionSSR };

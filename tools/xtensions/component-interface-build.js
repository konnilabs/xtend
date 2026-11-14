// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { data, fields, freeze } = require('./state-binding-contract');
const { normalizeComponentInterface, createComponentInterfaceCatalog } = require('./component-interface');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const captured = new WeakMap();
function readLocal(root, file) {
  if (typeof file !== 'string' || !/^\.\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:json|mjs|js)$/.test(file)) throw new TypeError('A canonical local component file is required.');
  const target = fs.realpathSync(path.resolve(root, file));
  if ('./' + path.relative(root, target).split(path.sep).join('/') !== file || !fs.statSync(target).isFile()) throw new TypeError('Component files cannot escape or alias their project root.');
  return fs.readFileSync(target);
}
/** Capture definitions and code once; never execute provider code during capture. */
async function captureComponentInterfaces({ rootDir, interfaces }) {
  if (!Array.isArray(interfaces) || !interfaces.length || interfaces.length > 64) throw new TypeError('A bounded trusted provider interface list is required.');
  data(interfaces);
  const records = [], sources = new Map(), paths = new Set();
  for (const entry of interfaces) {
    fields(entry, ['file', 'sha256'], 'Provider interface pin');
    if (paths.has(entry.file)) throw new TypeError('Duplicate component interface path.'); paths.add(entry.file);
    const bytes = readLocal(rootDir, entry.file);
    if (bytes.length > 65536 || hash(bytes) !== entry.sha256) throw new TypeError('Provider interface bytes differ from the trusted catalog pin.');
    const definition = normalizeComponentInterface(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
    const code = readLocal(rootDir, definition.entry.module);
    if (hash(code) !== definition.entry.sha256) throw new TypeError('Provider code differs from its interface pin.');
    records.push({ definition, interfaceSha256: entry.sha256, moduleSha256: hash(code) });
    sources.set(definition.entry.module, code);
  }
  const catalog = createComponentInterfaceCatalog(records);
  const { GRAPH_MANIFEST_SCHEMA } = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  const providers = records.map(({ definition: value }) => ({ id: value.providerId, framework: value.framework, version: value.componentVersion,
    entry: { module: value.entry.module, exportName: value.entry.exportName }, integrity: { sha256: value.entry.sha256 }, peers: value.peers }));
  const graph = await require('../../xtend-maraca/xtension-provider-graph').captureProviderGraph(rootDir, { schema: GRAPH_MANIFEST_SCHEMA, providers,
    modules: providers.map(provider => ({ module: provider.entry.module, sha256: provider.integrity.sha256 })) });
  // v1 component capture is deliberately a single function module per provider.
  // The wider A04 provider graph remains a separate unchanged contract.
  if (graph.modules.some(module => module.imports.length)) throw new TypeError('Component interface build v1 requires self-contained provider factory modules.');
  for (const module of graph.modules) if (hash(sources.get(module.module)) !== module.sha256) throw new TypeError('Component source changed during capture.');
  const result = Object.freeze({ apiVersion: '1.0.0', catalog, records: catalog.entries(), providers: freeze(providers),
    async loadFactories() {
      const result = {};
      for (const record of records) {
        const value = record.definition, source = sources.get(value.entry.module);
        const namespace = await import('data:text/javascript;base64,' + source.toString('base64'));
        const factory = namespace[value.entry.exportName];
        if (typeof factory !== 'function') throw new TypeError('Captured component factory export is missing.');
        result[value.providerId] = factory;
      }
      return Object.freeze(result);
    } });
  captured.set(result, sources); return result;
}
/** A test/build bundler consumes only captured bytes, never a reopened source. */
function capturedComponentPlugin(capture) {
  const sources = captured.get(capture);
  if (!sources) throw new TypeError('An actual component build capture is required.');
  return { name: 'captured-component-interfaces', setup(build) {
    build.onResolve({ filter: /^component-provider:/ }, args => {
      const id = args.path.slice('component-provider:'.length), record = capture.records.find(record => record.definition.providerId === id);
      if (!record) throw new TypeError('Unknown captured component.');
      return { path: record.definition.entry.module, namespace: 'component-provider' };
    });
    build.onLoad({ filter: /.*/, namespace: 'component-provider' }, args => ({ contents: sources.get(args.path).toString('utf8'), loader: 'js' }));
  } };
}
module.exports = { captureComponentInterfaces, capturedComponentPlugin };

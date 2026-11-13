// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { TextDecoder } = require('node:util');
const XTENSION_COMPOSITION_BUILD_API_VERSION = '10.0.0';
const hash = value => createHash('sha256').update(value).digest('hex');
function inspectSource(source, exportName) {
  const { parseAst } = require('rollup/parseAst');
  const ast = parseAst(source);
  let found = false;
  for (const statement of ast.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (!declaration || declaration.type !== 'FunctionDeclaration' || !declaration.id || declaration.async || declaration.generator) throw new TypeError('A04.1 provider modules permit only synchronous named function declarations.');
    if (statement.type === 'ExportNamedDeclaration' && declaration.id.name === exportName) found = true;
  }
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ImportExpression' || node.type === 'MetaProperty' || node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'require') throw new TypeError('A04.1 provider source must be self-contained; runtime/module imports are not admitted.');
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
  }
  walk(ast);
  if (!found) throw new TypeError('The declared provider factory export is absent.');
}

/** Captures verified source bytes into a companion ESM graph for a compiled plan.
 * It does not execute providers, bundle peers, or certify HTTP delivery. */
async function buildMaracaXTensionComposition(options) {
  const { planIdentity, normalizeManifest, ARTIFACT_SCHEMA, INTEGRATED_ARTIFACT_SCHEMA, GRAPH_MANIFEST_SCHEMA, GRAPH_ARTIFACT_SCHEMA, DEFERRED_MANIFEST_SCHEMA, DEFERRED_ARTIFACT_SCHEMA, SHARED_MANIFEST_SCHEMA, SHARED_ARTIFACT_SCHEMA, DELIVERY_MANIFEST_SCHEMA, DELIVERY_ARTIFACT_SCHEMA, createLoadPlan, canonical } = await import('./xtension-composition-contract.mjs');
  const identity = planIdentity(options.plan, options.bindingsRuntime), manifest = normalizeManifest(options.manifest, identity);
  const integrated = identity.schema === 'xtend.maraca.build-plan.v5';
  if (integrated && canonical(manifest) !== canonical(identity.compositionManifest)) throw new TypeError('The provider manifest must match the declared v5 build plan.');
  const root = fs.realpathSync(options.rootDir), captures = [];
  const delivery = manifest.schema === DELIVERY_MANIFEST_SCHEMA, shared = delivery || manifest.schema === SHARED_MANIFEST_SCHEMA, deferred = shared || manifest.schema === DEFERRED_MANIFEST_SCHEMA;
  const graph = [GRAPH_MANIFEST_SCHEMA, DEFERRED_MANIFEST_SCHEMA, SHARED_MANIFEST_SCHEMA, DELIVERY_MANIFEST_SCHEMA].includes(manifest.schema) ? await require('./xtension-provider-graph').captureProviderGraph(root, manifest) : null;
  for (const provider of graph ? [] : manifest.providers) {
    const sourcePath = fs.realpathSync(path.resolve(root, provider.entry.module));
    const relative = path.relative(root, sourcePath);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !fs.statSync(sourcePath).isFile()) throw new TypeError('Provider source must be a regular file within the declared project root.');
    const bytes = fs.readFileSync(sourcePath);
    if (hash(bytes) !== provider.integrity.sha256) throw new TypeError(`Provider integrity mismatch: ${provider.id}.`);
    inspectSource(new TextDecoder('utf-8', { fatal: true }).decode(bytes), provider.entry.exportName);
    captures.push({ id: provider.id, bytes, sha256: hash(bytes), fileName: `providers/${provider.id}-${hash(bytes)}.mjs` });
  }
  // Every source is captured and checked before the first output mutation.
  // Legacy files keep their exact bytes; graph imports are rewritten from the capture.
  // Neither path rereads original sources during output.
  const entryFile = `xtend.xtensions-${hash(canonical({ identity, manifest }))}.mjs`;
  const providers = graph ? graph.providers : captures.map(({ id, sha256, fileName }) => ({ id, sha256, fileName }));
  const artifact = { schema: delivery ? DELIVERY_ARTIFACT_SCHEMA : shared ? SHARED_ARTIFACT_SCHEMA : deferred ? DEFERRED_ARTIFACT_SCHEMA : graph ? GRAPH_ARTIFACT_SCHEMA : integrated ? INTEGRATED_ARTIFACT_SCHEMA : ARTIFACT_SCHEMA, apiVersion: delivery ? '6.0.0' : shared ? '5.0.0' : deferred ? '4.0.0' : graph ? '3.0.0' : integrated ? '2.0.0' : '1.0.0', plan: identity, manifest,
    providers, ...(graph ? { modules: graph.modules } : {}), ...(deferred ? { loadPlan: createLoadPlan(manifest, graph.modules, providers) } : {}), entryFile, runtimeExecutionVerified: false };
  const source = (deferred ? [] : providers).map((entry, index) => `import * as provider${index} from ${JSON.stringify('./' + entry.fileName)};`).join('\n') +
    `\nfunction freezeData(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freezeData); Object.freeze(value); } return value; }\nexport const artifact = freezeData(${JSON.stringify(artifact)});\nexport function createHostFactory(ports) {\n  return ports.compositionRuntime.createMaracaXTensionHostFactory({ ...ports, artifact, ${deferred ? 'loadProviders' : 'providers'}: {${providers.map((entry, index) => `${JSON.stringify(entry.id)}: ${deferred ? `() => import(${JSON.stringify('./' + entry.fileName)})` : `provider${index}`}`).join(',')}} });\n}\n`;
  const output = path.resolve(options.outputDir);
  const files = [...(graph ? graph.files : captures), { fileName: entryFile, bytes: Buffer.from(source), sha256: hash(source) }];
  let deliveryFile;
  if (delivery) {
    const plan = { schema: 'xtend.maraca.xtension-delivery-plan.v1', scope: 'composition-graph', entryFile, mode: manifest.delivery.mode,
      headers: { 'Content-Security-Policy': "script-src 'self'; script-src-elem 'self'; script-src-attr 'none'; object-src 'none'; base-uri 'none'", 'X-Content-Type-Options': 'nosniff' },
      javascriptContentType: 'text/javascript; charset=utf-8', runtimeDeliveryVerified: false,
      files: files.map(file => ({ fileName: file.fileName, sha256: file.sha256, bytes: file.bytes.length })).sort((a, b) => a.fileName < b.fileName ? -1 : 1) };
    const bytes = Buffer.from(JSON.stringify(plan) + '\n');
    deliveryFile = `xtend.xtensions.delivery-${hash(bytes)}.json`;
    files.push({ fileName: deliveryFile, bytes, sha256: hash(bytes) });
  }
  fs.mkdirSync(output, { recursive: true });
  for (const file of files) {
    const target = path.join(output, file.fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // Content-addressed files may be reused, never silently replaced by other bytes.
    try { fs.writeFileSync(target, file.bytes, { flag: 'wx' }); }
    catch (error) { if (error.code !== 'EEXIST' || !fs.readFileSync(target).equals(file.bytes)) throw error; }
  }
  return { schema: delivery ? 'xtend.maraca.xtension-composition-build-report.v6' : shared ? 'xtend.maraca.xtension-composition-build-report.v5' : deferred ? 'xtend.maraca.xtension-composition-build-report.v4' : graph ? 'xtend.maraca.xtension-composition-build-report.v3' : integrated ? 'xtend.maraca.xtension-composition-build-report.v2' : 'xtend.maraca.xtension-composition-build-report.v1', apiVersion: delivery ? '6.0.0' : shared ? '5.0.0' : deferred ? '4.0.0' : graph ? '3.0.0' : integrated ? '2.0.0' : '1.0.0', ok: true,
    artifact, ...(delivery ? { deliveryFile } : {}), entryPath: path.join(output, entryFile), files: files.map(file => ({ fileName: file.fileName, sha256: file.sha256, bytes: file.bytes.length })),
    frameworkDependenciesBundled: false, runtimeExecutionVerified: false };
}
const { registerBuild: _registerBuild, captureSSRBuild: _captureSSRBuild, ...deployment } = require('./xtension-deployment');
module.exports = { XTENSION_COMPOSITION_BUILD_API_VERSION, buildMaracaXTensionComposition, ...require('./xtension-ssr'), ...deployment };

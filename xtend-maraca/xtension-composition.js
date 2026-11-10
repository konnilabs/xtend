// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { TextDecoder } = require('node:util');
const XTENSION_COMPOSITION_BUILD_API_VERSION = '2.0.0';
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
  const { planIdentity, normalizeManifest, ARTIFACT_SCHEMA, INTEGRATED_ARTIFACT_SCHEMA, canonical } = await import('./xtension-composition-contract.mjs');
  const identity = planIdentity(options.plan, options.bindingsRuntime), manifest = normalizeManifest(options.manifest, identity);
  const integrated = identity.schema === 'xtend.maraca.build-plan.v5';
  if (integrated && canonical(manifest) !== canonical(identity.compositionManifest)) throw new TypeError('The provider manifest must match the declared v5 build plan.');
  const root = fs.realpathSync(options.rootDir), captures = [];
  for (const provider of manifest.providers) {
    const sourcePath = fs.realpathSync(path.resolve(root, provider.entry.module));
    const relative = path.relative(root, sourcePath);
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !fs.statSync(sourcePath).isFile()) throw new TypeError('Provider source must be a regular file within the declared project root.');
    const bytes = fs.readFileSync(sourcePath);
    if (hash(bytes) !== provider.integrity.sha256) throw new TypeError(`Provider integrity mismatch: ${provider.id}.`);
    inspectSource(new TextDecoder('utf-8', { fatal: true }).decode(bytes), provider.entry.exportName);
    captures.push({ id: provider.id, bytes, sha256: hash(bytes), fileName: `providers/${provider.id}-${hash(bytes)}.mjs` });
  }
  // Every source is captured and checked before the first output mutation.
  // Output imports these exact bytes; it never rereads the original source.
  const entryFile = `xtend.xtensions-${hash(canonical({ identity, manifest }))}.mjs`;
  const artifact = { schema: integrated ? INTEGRATED_ARTIFACT_SCHEMA : ARTIFACT_SCHEMA, apiVersion: integrated ? '2.0.0' : '1.0.0', plan: identity, manifest,
    providers: captures.map(({ id, sha256, fileName }) => ({ id, sha256, fileName })), entryFile, runtimeExecutionVerified: false };
  const source = captures.map((entry, index) => `import * as provider${index} from ${JSON.stringify('./' + entry.fileName)};`).join('\n') +
    `\nfunction freezeData(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freezeData); Object.freeze(value); } return value; }\nexport const artifact = freezeData(${JSON.stringify(artifact)});\nexport function createHostFactory(ports) {\n  return ports.compositionRuntime.createMaracaXTensionHostFactory({ ...ports, artifact, providers: {${captures.map((entry, index) => `${JSON.stringify(entry.id)}: provider${index}`).join(',')}} });\n}\n`;
  const output = path.resolve(options.outputDir);
  const files = [...captures, { fileName: entryFile, bytes: Buffer.from(source), sha256: hash(source) }];
  fs.mkdirSync(output, { recursive: true });
  for (const file of files) {
    const target = path.join(output, file.fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // Content-addressed files may be reused, never silently replaced by other bytes.
    try { fs.writeFileSync(target, file.bytes, { flag: 'wx' }); }
    catch (error) { if (error.code !== 'EEXIST' || !fs.readFileSync(target).equals(file.bytes)) throw error; }
  }
  return { schema: integrated ? 'xtend.maraca.xtension-composition-build-report.v2' : 'xtend.maraca.xtension-composition-build-report.v1', apiVersion: integrated ? XTENSION_COMPOSITION_BUILD_API_VERSION : '1.0.0', ok: true,
    artifact, entryPath: path.join(output, entryFile), files: files.map(file => ({ fileName: file.fileName, sha256: file.sha256, bytes: file.bytes.length })),
    frameworkDependenciesBundled: false, runtimeExecutionVerified: false };
}
module.exports = { XTENSION_COMPOSITION_BUILD_API_VERSION, buildMaracaXTensionComposition };

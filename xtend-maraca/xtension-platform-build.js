// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path');

// This bridge is deliberately limited to XTend's own CommonJS runtime closure.
// Application providers retain their separate verified local ESM contract.
async function buildXTensionPlatform(plan, rollup) {
  const entries = Object.fromEntries(['state-binding', ...new Set(plan.xtensionComposition.providers.map(provider => provider.framework + '-runtime-adapter'))].map(name =>
    [name, require.resolve('@ccslabs/xtend-compiler/xtensions/' + name, { paths: [plan.rootDir, __dirname] })]));
  const compilerRoot = path.dirname(path.dirname(entries['state-binding']));
  const { parseAst } = require('rollup/parseAst');
  const captured = new Map(), esmSources = new Map();
  function capture(file) {
    file = fs.realpathSync(file);
    if (captured.has(file)) return;
    const relative = path.relative(compilerRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new TypeError('XTension platform dependencies must remain inside the compiler package.');
    const source = fs.readFileSync(file, 'utf8'), imports = new Map();
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'require') {
        const id = node.arguments.length === 1 && node.arguments[0].value;
        if (typeof id !== 'string' || !id.startsWith('.')) throw new TypeError('Only static relative XTend platform requires are supported.');
        imports.set(id, require.resolve(path.resolve(path.dirname(file), id)));
      }
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
    walk(parseAst(source)); captured.set(file, { source, imports });
    imports.forEach(capture);
  }
  Object.values(entries).forEach(capture);
  const virtual = '\0xtend-xtension-platform';
  const runtime = path.join(__dirname, 'xtension-composition-runtime.mjs');
  const bindingContract = require.resolve(path.join(compilerRoot, 'xtensions/state-binding-contract'));
  capture(bindingContract);
  const source = `import * as bindingContract from ${JSON.stringify(bindingContract)};\nimport * as ssrRuntime from ${JSON.stringify(path.join(__dirname, 'xtension-ssr-runtime.mjs'))};\n` + Object.entries(entries).map(([name, file], index) => `import * as api${index} from ${JSON.stringify(file)};`).join('\n') +
    `\nimport * as compositionRuntime from ${JSON.stringify(runtime)};\nexport default Object.freeze({ bindingsRuntime: Object.freeze({XTENSION_STATE_BINDING_API_VERSION:api0.XTENSION_STATE_BINDING_API_VERSION,validateStateBindingArtifact:api0.validateStateBindingArtifact,materializeStateBindingArtifact:api0.materializeStateBindingArtifact,createXTensionStateRegistry:api0.createXTensionStateRegistry}), compositionRuntime, ssrRuntime, resumeBindingsRuntime: Object.freeze({XTENSION_RESUME_STATE_BINDING_API_VERSION:api0.XTENSION_RESUME_STATE_BINDING_API_VERSION,createXTensionResumeStateRegistry:api0.createXTensionResumeStateRegistry,typed:bindingContract.typed,propsFrom:bindingContract.propsFrom}), adapters: Object.freeze({${Object.keys(entries).slice(1).map((name, index) => {const framework=name.split('-')[0],title=framework==='react'?'React':'Vue';return `${JSON.stringify(framework)}: Object.freeze({create${title}KernelRuntimeAdapter:api${index+1}.create${title}KernelRuntimeAdapter,normalize${title}Peers:api${index+1}.normalize${title}Peers,create${title}SSRRuntimeAdapter:api${index+1}.create${title}SSRRuntimeAdapter,normalize${title}SSRPeers:api${index+1}.normalize${title}SSRPeers})`;}).join(',')} }) });\n`;
  const bundle = await rollup.rollup({ input: virtual, plugins: [{
    name: 'xtend-owned-xtension-platform',
    resolveId(id) { return id === virtual ? id : null; },
    load(id) {
      if (id === virtual) return source;
      const record = captured.get(id);
      if (!record) {
        if (id.startsWith(__dirname + path.sep) && id.endsWith('.mjs')) {
          const source = fs.readFileSync(id, 'utf8'); esmSources.set(id, source); return source;
        }
        return null;
      }
      return require('./xtension-platform-esm').toESM(record.source,parseAst,name=>{const target=record.imports.get(name);if(!target)throw new TypeError('Unknown platform dependency.');return target;});
    }
  }] });
  try {
    const result = await bundle.generate({ format: 'es' });
    if (result.output.length !== 1 || result.output[0].type !== 'chunk' || result.output[0].imports.length || result.output[0].dynamicImports.length) throw new TypeError('The XTension platform must have a closed native ESM output.');
    const fileName = 'runtime/xtension-platform.mjs', target = path.join(plan.outputDir, fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, result.output[0].code);
    const { createHash } = require('node:crypto');
    const sourceFiles = [...captured].map(([absolutePath, record]) => ({ absolutePath, source: 'compiler/' + path.relative(compilerRoot, absolutePath).split(path.sep).join('/'), content: record.source }))
      .concat([...esmSources].map(([absolutePath, content]) => ({ absolutePath, source: 'maraca/' + path.relative(__dirname, absolutePath).split(path.sep).join('/'), content })))
      .map(({ content, ...record }) => ({ ...record, bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') }));
    return { sourceFiles, type: 'asset', fileName, path: target, bytes: fs.statSync(target).size, isEntry: false, isDynamicEntry: false, imports: [], dynamicImports: [] };
  } finally { await bundle.close(); }
}
module.exports = { buildXTensionPlatform };

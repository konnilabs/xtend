// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path');

// This bridge is deliberately limited to XTend's own CommonJS runtime closure.
// Application providers retain the separate verified, import-free ESM contract.
async function buildXTensionPlatform(plan, rollup) {
  const entries = Object.fromEntries(['state-binding', ...new Set(plan.xtensionComposition.providers.map(provider => provider.framework + '-runtime-adapter'))].map(name =>
    [name, require.resolve('@ccslabs/xtend-compiler/xtensions/' + name, { paths: [plan.rootDir, __dirname] })]));
  const compilerRoot = path.dirname(path.dirname(entries['state-binding']));
  const { parseAst } = require('rollup/parseAst');
  const captured = new Map();
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
  const source = Object.entries(entries).map(([name, file], index) => `import api${index} from ${JSON.stringify(file)};`).join('\n') +
    `\nimport * as compositionRuntime from ${JSON.stringify(runtime)};\nexport default Object.freeze({ bindingsRuntime: api0, compositionRuntime, adapters: Object.freeze({${Object.keys(entries).slice(1).map((name, index) => `${JSON.stringify(name.split('-')[0])}: api${index + 1}`).join(',')} }) });\n`;
  const bundle = await rollup.rollup({ input: virtual, plugins: [{
    name: 'xtend-owned-xtension-platform',
    resolveId(id) { return id === virtual ? id : null; },
    load(id) {
      if (id === virtual) return source;
      const record = captured.get(id);
      if (!record) return null;
      const imports = [...record.imports];
      return imports.map(([name, target], index) => `import dependency${index} from ${JSON.stringify(target)};`).join('\n') +
        `\nconst api = (() => { const module = { exports: {} }; const exports = module.exports; const dependencies = {${imports.map(([name], index) => `${JSON.stringify(name)}: dependency${index}`).join(',')}}; const require = id => { if (!Object.hasOwn(dependencies, id)) throw new TypeError('Unknown XTension platform dependency.'); return dependencies[id]; };\n${record.source}\nreturn module.exports; })();\nexport default api;`;
    }
  }] });
  try {
    const result = await bundle.generate({ format: 'es' });
    if (result.output.length !== 1 || result.output[0].type !== 'chunk' || result.output[0].imports.length || result.output[0].dynamicImports.length) throw new TypeError('The XTension platform must have a closed native ESM output.');
    const fileName = 'runtime/xtension-platform.mjs', target = path.join(plan.outputDir, fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, result.output[0].code);
    return { type: 'asset', fileName, path: target, bytes: fs.statSync(target).size, isEntry: false, isDynamicEntry: false, imports: [], dynamicImports: [] };
  } finally { await bundle.close(); }
}
module.exports = { buildXTensionPlatform };

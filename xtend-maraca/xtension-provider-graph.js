// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto'), { TextDecoder } = require('node:util');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
/** Closed, pinned, acyclic local graph. Capture all inputs before any output write.
 * Module evaluation creates bindings only; provider initialization stays in
 * admitted mount work. Function bodies remain trusted application code. */
async function captureProviderGraph(root, manifest) {
  const { resolveModuleSpecifier, validateModuleGraph, DEFERRED_MANIFEST_SCHEMA, SHARED_MANIFEST_SCHEMA, DELIVERY_MANIFEST_SCHEMA } = await import('./xtension-composition-contract.mjs');
  const { parseAst } = require('rollup/parseAst');
  const captures = new Map();
  for (const pin of manifest.modules) {
    const target = fs.realpathSync(path.resolve(root, pin.module));
    if ('./' + path.relative(root, target).split(path.sep).join('/') !== pin.module || !fs.statSync(target).isFile()) throw new TypeError('Provider modules require canonical regular files within the project; symlink aliases are not admitted.');
    const bytes = fs.readFileSync(target);
    if (hash(bytes) !== pin.sha256) throw new TypeError(`Provider module integrity mismatch: ${pin.module}.`);
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes), bom = text.startsWith('\uFEFF');
    // Rollup strips a leading BOM before assigning source offsets. Parse the
    // BOM-free text explicitly, then restore the original mark after rewriting.
    const source = bom ? text.slice(1) : text, ast = parseAst(source);
    const imports = [], exported = new Set(), functions = new Set(), aliases = [];
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'ImportExpression' || node.type === 'MetaProperty' || node.type === 'CallExpression' && node.callee?.type === 'Identifier' && node.callee.name === 'require') throw new TypeError('Dynamic imports, import.meta and require are not admitted in provider graphs.');
      for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
    for (const statement of ast.body) {
      if (statement.type === 'ImportDeclaration') {
        if (!statement.specifiers.length || statement.attributes?.length || statement.assertions?.length) throw new TypeError('Only named/namespace static imports without attributes are admitted.');
        if (statement.specifiers.some(row => !['ImportSpecifier', 'ImportNamespaceSpecifier'].includes(row.type))) throw new TypeError('Provider graphs require named or namespace imports.');
        const specifier = statement.source.value;
        imports.push({ specifier, module: resolveModuleSpecifier(pin.module, specifier), start: statement.source.start, end: statement.source.end,
          names: statement.specifiers.filter(row => row.type === 'ImportSpecifier').map(row => row.imported.name ?? row.imported.value) });
      } else if (statement.type === 'ExportNamedDeclaration' && !statement.declaration) {
        if (statement.source || !statement.specifiers.length) throw new TypeError('Provider reexports are not admitted.');
        for (const row of statement.specifiers) { exported.add(row.exported.name ?? row.exported.value); aliases.push(row.local.name); }
      } else {
        const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
        if (!declaration || declaration.type !== 'FunctionDeclaration' || !declaration.id || declaration.async || declaration.generator) throw new TypeError('Provider graph modules permit only synchronous named function declarations and static imports/exports.');
        functions.add(declaration.id.name);
        if (statement.type === 'ExportNamedDeclaration') exported.add(declaration.id.name);
      }
    }
    if ([DEFERRED_MANIFEST_SCHEMA, SHARED_MANIFEST_SCHEMA, DELIVERY_MANIFEST_SCHEMA].includes(manifest.schema) && exported.has('then')) throw new TypeError('Deferred provider graphs cannot export then: native import would assimilate the namespace as a promise.');
    if (aliases.some(name => !functions.has(name))) throw new TypeError('Local exports must refer to locally declared synchronous functions.');
    if (imports.length > 256) throw new TypeError('Too many static imports in provider module.');
    walk(ast);
    captures.set(pin.module, { ...pin, bytes, source, bom, imports, exported });
  }
  const active = new Set(), outputs = new Map(), records = new Map();
  function emit(module) {
    if (active.has(module)) throw new TypeError('Cyclic provider module graphs are not admitted.');
    if (records.has(module)) return records.get(module);
    const capture = captures.get(module);
    if (!capture) throw new TypeError(`Unpinned provider dependency: ${module}.`);
    active.add(module);
    let transformed = capture.source;
    for (const edge of capture.imports) {
      const target = captures.get(edge.module);
      if (!target || edge.names.some(name => !target.exported.has(name))) throw new TypeError('Static imports must resolve to pinned, existing named function exports.');
      emit(edge.module);
    }
    for (const edge of [...capture.imports].reverse()) {
      const fileName = records.get(edge.module).fileName;
      const relative = path.posix.relative(path.posix.dirname('providers/modules/' + module.slice(2)), fileName);
      transformed = transformed.slice(0, edge.start) + JSON.stringify(relative.startsWith('.') ? relative : './' + relative) + transformed.slice(edge.end);
    }
    // Preserve exact bytes when there is no transform (including UTF-8 BOM).
    const bytes = capture.imports.length ? Buffer.from((capture.bom ? '\uFEFF' : '') + transformed) : capture.bytes, outputSha256 = hash(bytes), fileName = `providers/modules/${module.slice(2)}-${outputSha256}.mjs`;
    const record = { module, sha256: capture.sha256, sourceBytes: capture.bytes.length, fileName, outputSha256, outputBytes: bytes.length,
      imports: capture.imports.map(({ specifier, module }) => ({ specifier, module })) };
    records.set(module, record); outputs.set(fileName, { fileName, bytes, sha256: outputSha256 }); active.delete(module);
    return record;
  }
  for (const provider of manifest.providers) {
    emit(provider.entry.module);
    if (!captures.get(provider.entry.module).exported.has(provider.entry.exportName)) throw new TypeError('The declared provider factory export is absent.');
  }
  const modules = [...records.values()].sort((a, b) => a.module < b.module ? -1 : 1);
  validateModuleGraph(modules, manifest);
  return { modules, files: [...outputs.values()].sort((a, b) => a.fileName < b.fileName ? -1 : 1), providers: manifest.providers.map(provider => {
    const record = records.get(provider.entry.module);
    return { id: provider.id, sha256: record.sha256, fileName: record.fileName, outputSha256: record.outputSha256 };
  }) };
}
module.exports = { captureProviderGraph };

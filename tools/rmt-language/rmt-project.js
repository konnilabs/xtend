'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const ts = require('typescript');
const { createRmtSourceModel } = require('./source-model');
const { parseRmtVNextSource } = require('./vnext-parser');
const { parseRmtxSource } = require('./rmtx-parser');
const { compileRmtVNextSource, compileRmtVNextAstResult } = require('./vnext-compiler');
const { compileRmtxSource } = require('./rmtx-compiler');
const { getRmtxOperatorProfile } = require('./rmtx-operator-profiles');
const { validateRmtClassicAst } = require('./classic-ast-contract');
const { bindProjectDeclarations } = require('./rmt-project-context');

const RMT_PROJECT_API_VERSION = '1.0.0';
const RMT_PROJECT_GRAPH_SCHEMA = 'xtend.rmt.project-graph.v1';
const RMT_PROJECT_REPORT_SCHEMA = 'xtend.rmt.project-report.v1';
const RMT_PROJECT_COMPILER_SCHEMA = 'xtend.rmt.project-compiler.v1';
const RMT_PROJECT_COMPILE_RESULT_SCHEMA = 'xtend.rmt.project-compile-result.v1';
const AUTHORING = new Set(['@ccslabs/xtend/rmt-language/rmtx', '@ccslabs/xtend-compiler/rmt-language/rmtx']);
const VERSIONS = new Set(['1.0.0', '2.0.0', '3.0.0', '4.0.0', '5.0.0', '6.0.0', '7.0.0', '8.0.0']);
const posix = value => String(value).replace(/\\/gu, '/');
const hash = value => createHash('sha256').update(value).digest('hex');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const inside = (root, file) => { const relative = path.relative(root, file); return relative === '' || relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative); };
function normalizeFile(file) { return path.resolve(String(file).startsWith('file:') ? fileURLToPath(file) : file); }
function normalizeSyntax(value) { return value === 'rmtx' ? 'rmtx' : ['rmt', 'rmt-vnext', 'rmt-classic'].includes(value) ? 'rmt-vnext' : null; }
function fileSyntax(file) { return /\.rmtx$/iu.test(file) ? 'rmtx' : /\.rmt$/iu.test(file) ? 'rmt-vnext' : null; }
function mask(text) { return text.replace(/[^\r\n]/g, ' '); }
function freeze(value, seen = new WeakSet()) {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value); Object.values(value).forEach(item => freeze(item, seen)); Object.freeze(value);
  }
  return value;
}
function inputRecord(input, options) {
  input = typeof input === 'string' ? { text: input } : input || {};
  const rootDir = path.resolve(options.rootDir || options.root || process.cwd());
  const candidate = input.filePath || (input.uri?.startsWith('file:') ? fileURLToPath(input.uri) : null)
    || (input.uri ? path.join(rootDir, `__untitled_${Buffer.from(input.uri).toString('hex')}.${normalizeSyntax(options.sourceSyntax) === 'rmt-vnext' ? 'rmt' : 'rmtx'}`) : null)
    || path.join(rootDir, normalizeSyntax(options.sourceSyntax) === 'rmt-vnext' ? 'untitled.rmt' : 'untitled.rmtx');
  return { input, rootDir, entryFile: path.resolve(rootDir, candidate) };
}
function documentMap(documents, rootDir) {
  const map = new Map();
  if (documents instanceof Map) documents = [...documents].map(([filePath, value]) => typeof value === 'string' ? { filePath, text: value } : { filePath, ...value });
  else if (documents && !Array.isArray(documents)) documents = Object.entries(documents).map(([filePath, value]) => typeof value === 'string' ? { filePath, text: value } : { filePath, ...value });
  for (const document of documents || []) {
    const file = document.filePath || (document.uri?.startsWith('file:') ? fileURLToPath(document.uri) : null);
    if (file && typeof document.text === 'string') map.set(path.resolve(rootDir, file), document.text);
  }
  return map;
}
function declarations(ast) {
  const result = [];
  for (const node of ast?.body || []) {
    if (node.type === 'RmtTemplateDeclaration') result.push(...(node.body || []));
    else result.push(node);
  }
  return result;
}
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'range') continue;
    if (Array.isArray(value)) value.forEach(item => walk(item, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}
function diagnostic(model, code, message, range) {
  return model.createDiagnostic({ source: 'rmt-project', code, severity: 'error', message, range: range || model.rangeForOffsets(0, 1) });
}
function jsxOpening(node) { return ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null; }
function unwrap(node) { while (node && ts.isParenthesizedExpression(node)) node = node.expression; return node; }

// Discover only the existing closed authoring grammar. In particular an import
// of provider TSX, executable JS, type declarations or arbitrary JSX is not an
// implicit project module, and no import is ever evaluated.
function inspectRmtx(record, options) {
  const file = ts.createSourceFile(record.filePath, record.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const bindings = new Map();
  let program = null;
  const profile = getRmtxOperatorProfile(options.rmtxSyntaxVersion);
  for (const item of file.parseDiagnostics) record.diagnostics.push(diagnostic(record.sourceModel, 'rmtx.syntax.invalid', ts.flattenDiagnosticMessageText(item.messageText, '\n'), record.sourceModel.rangeForOffsets(item.start || 0, (item.start || 0) + (item.length || 1))));
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (!ts.isStringLiteral(statement.moduleSpecifier) || !AUTHORING.has(statement.moduleSpecifier.text) || statement.attributes
        || !clause || clause.name || clause.isTypeOnly || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) {
        record.diagnostics.push(diagnostic(record.sourceModel, 'rmtx.import.unsupported', 'Only the existing named RMTX authoring imports are allowed.', record.sourceModel.rangeForOffsets(statement.getStart(file), statement.end))); continue;
      }
      for (const binding of clause.namedBindings.elements) {
        const name = (binding.propertyName || binding.name).text;
        if (binding.isTypeOnly || !profile.imports.includes(name) || bindings.has(binding.name.text)) record.diagnostics.push(diagnostic(record.sourceModel, 'rmtx.import.binding', 'Unknown or duplicate authoring binding.', record.sourceModel.rangeForOffsets(binding.getStart(file), binding.end)));
        else bindings.set(binding.name.text, name);
      }
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals && !program) program = unwrap(statement.expression);
    else record.diagnostics.push(diagnostic(record.sourceModel, 'rmtx.source.statement', 'A project module still requires authoring imports and one default Program export.', record.sourceModel.rangeForOffsets(statement.getStart(file), statement.end)));
  }
  const opening = program && jsxOpening(program);
  if (!opening || !ts.isPropertyAccessExpression(opening.tagName) || !ts.isIdentifier(opening.tagName.expression)
    || bindings.get(opening.tagName.expression.text) !== 'RMT' || opening.tagName.name.text !== 'Program') {
    record.diagnostics.push(diagnostic(record.sourceModel, 'rmtx.program.required', 'Expected a default RMT.Program export.')); return;
  }
  const children = ts.isJsxElement(program) ? [...program.children] : [];
  // A composed module must not inherit authoring bindings from another module
  // or from our synthetic canonical header. Keep this lexical boundary even
  // when a trusted caller disables the optional TypeScript semantic pass.
  const canonicalBindings = new Set(profile.imports);
  function checkBindings(node) {
    if (ts.isIdentifier(node) && canonicalBindings.has(node.text) && !bindings.has(node.text) && isReferenceIdentifier(node)) {
      record.diagnostics.push(diagnostic(record.sourceModel, 'rmt.project.binding.unbound',
        `Authoring binding ${node.text} must be imported by this module.`, record.sourceModel.rangeForOffsets(node.getStart(file), node.end)));
    }
    ts.forEachChild(node, checkBindings);
  }
  children.forEach(checkBindings);
  const importChildren = children.filter(child => {
    const head = jsxOpening(child);
    return head && ts.isPropertyAccessExpression(head.tagName) && ts.isIdentifier(head.tagName.expression)
      && bindings.get(head.tagName.expression.text) === 'RMT' && head.tagName.name.text === 'Import';
  });
  // Mask non-import children without changing a single UTF-16 offset or CRLF.
  // The retained parser validates the actual root/import syntax and attributes.
  let header = record.text;
  for (const child of [...children].reverse()) if (!importChildren.includes(child)) header = header.slice(0, child.pos) + mask(header.slice(child.pos, child.end)) + header.slice(child.end);
  if (!record.diagnostics.length || options.recoverImports === true) {
    const parsed = parseRmtxSource({ text: header, filePath: record.filePath, uri: record.uri }, { syntaxVersion: options.rmtxSyntaxVersion });
    record.diagnostics.push(...parsed.diagnostics);
    if (parsed.ok) {
      record.programId = parsed.ast.body.find(node => node.type === 'RmtTemplateDeclaration').name;
      record.imports = declarations(parsed.ast).filter(node => node.type === 'RmtImportDeclaration').map(node => ({ path: node.path, mode: node.mode, range: node.range }));
    }
    if (!parsed.ok && options.recoverImports === true) {
      // Discovery only: an incomplete view must not hide an already valid
      // static import from editor completion. The original errors remain and
      // therefore this graph cannot be compiled successfully.
      const namespace = [...bindings].find(([, canonical]) => canonical === 'RMT')?.[0];
      if (namespace) {
        const prefix = `import {RMT as ${namespace}} from '@ccslabs/xtend/rmt-language/rmtx';export default <${namespace}.Program id="editor">`;
        const recovery = parseRmtxSource({ text: prefix + importChildren.map(child => child.getText(file)).join('\n') + `</${namespace}.Program>;`, filePath: record.filePath }, { syntaxVersion: options.rmtxSyntaxVersion });
        if (recovery.ok) record.imports = declarations(recovery.ast).filter(node => node.type === 'RmtImportDeclaration').map((node, index) => ({ path: node.path, mode: node.mode,
          range: record.sourceModel.rangeForOffsets(importChildren[index].getStart(file), importChildren[index].end) }));
      }
    }
  }
  Object.defineProperty(record, '_rmtx', { value: { file, bindings, program, children: children.filter(child => !importChildren.includes(child)) } });
}

function createRmtProjectSnapshot(input = {}, options = {}) {
  const normalized = inputRecord(input, options); input = normalized.input;
  const { rootDir, entryFile } = normalized;
  const syntaxVersion = options.rmtxSyntaxVersion || options.syntaxVersion || '8.0.0';
  const modules = [], edges = [], order = [], diagnostics = [], dependencies = new Map(), byPath = new Map(), active = [];
  const models = new Map();
  let componentInterfaceCatalog = options.componentInterfaceCatalog || null, rmtxProviders = null, rmtxProvidersFile = null;
  const overlays = documentMap(options.documents, rootDir);
  if (typeof input.text === 'string') overlays.set(entryFile, input.text);
  const physicalRoot = fs.existsSync(rootDir) ? fs.realpathSync(rootDir) : rootDir;
  const limits = { modules: 256, sourceBytes: 8 * 1024 * 1024 };
  let bytes = 0;
  const makeModel = (file, text = '') => createRmtSourceModel({ text, filePath: file, uri: file === entryFile ? input.uri : undefined, languageId: fileSyntax(file) === 'rmtx' ? 'rmtx' : 'rmt' });
  const rootModel = makeModel(entryFile, typeof input.text === 'string' ? input.text : '');
  const fail = (file, code, message, range) => diagnostics.push(diagnostic(models.get(file) || rootModel, code, message, range));
  if (!VERSIONS.has(syntaxVersion)) fail(entryFile, 'rmt.project.profile.unsupported', `Unsupported RMTX syntax profile ${syntaxVersion}.`);
  if (!fileSyntax(entryFile)) fail(entryFile, 'rmt.project.source.extension', 'Project entries require .rmt or .rmtx; provider .tsx is not a declarative entry.');
  if (options.sourceSyntax !== undefined && (!normalizeSyntax(options.sourceSyntax) || normalizeSyntax(options.sourceSyntax) !== fileSyntax(entryFile))) fail(entryFile, 'rmt.project.source.mismatch', 'The explicit source language must match the entry extension.');
  function boundary(file) {
    if (!inside(rootDir, file)) return false;
    let existing = file;
    while (!fs.existsSync(existing) && path.dirname(existing) !== existing) existing = path.dirname(existing);
    try { return inside(physicalRoot, fs.realpathSync(existing)); } catch { return false; }
  }
  function read(file) {
    if (!boundary(file)) throw Object.assign(new Error('Module escapes the project root or a physical symlink boundary.'), { code: 'rmt.project.import.boundary' });
    if (overlays.has(file)) return overlays.get(file);
    return options.readFile ? options.readFile(file) : fs.readFileSync(file, 'utf8');
  }
  function loadProviderRegistry() {
    const explicit = options.rmtxProvidersFile !== undefined;
    let candidate;
    let pins = options.rmtxProviders;
    try {
      if (explicit && (typeof options.rmtxProvidersFile !== 'string' || !options.rmtxProvidersFile.trim())) throw new TypeError('An explicit provider registry requires a nonempty JSON path.');
      candidate = path.resolve(rootDir, options.rmtxProvidersFile || 'rmtx.providers.json');
      if (explicit || !pins && (overlays.has(candidate) || fs.existsSync(candidate))) {
        if (!candidate.endsWith('.json') || !boundary(candidate)) throw new TypeError('Provider registries must be JSON files inside the project root.');
        const text = read(candidate);
        rmtxProvidersFile = posix(candidate);
        dependencies.set(candidate, { filePath: rmtxProvidersFile, exists: true, kind: 'provider-registry', sha256: hash(text) });
        pins = JSON.parse(text);
      }
      if (pins === undefined) return;
      const { fields } = require('../xtensions/state-binding-contract');
      fields(pins, ['schema', 'interfaces'], 'RMTX provider registry');
      if (pins.schema !== 'xtend.maraca.rmtx-providers.v1') throw new TypeError('An explicit versioned RMTX provider registry is required.');
      rmtxProviders = JSON.parse(JSON.stringify(pins));
      const captured = require('../xtensions/component-interface-build').captureComponentInterfaceMetadata({ rootDir, interfaces: rmtxProviders.interfaces });
      if (!componentInterfaceCatalog) componentInterfaceCatalog = captured;
      for (const record of captured.records) {
        for (const [file, sha256, kind] of [[record.file, record.interfaceSha256, 'provider-interface'], [record.definition.entry.module, record.moduleSha256, 'provider-module']]) {
          const resolved = posix(path.resolve(rootDir, file));
          dependencies.set(resolved, { filePath: resolved, sha256, exists: true, kind });
        }
      }
    } catch (error) {
      if (explicit && candidate && !dependencies.has(candidate)) dependencies.set(candidate, { filePath: posix(candidate), exists: false, kind: 'provider-registry', sha256: null });
      fail(entryFile, 'rmt.project.providers.invalid', error.message);
    }
  }
  function matches(importer, spec) {
    if (typeof spec.path !== 'string' || !/^\.\.?\//u.test(spec.path) || spec.path.includes('\\') || /[?#\0]/u.test(spec.path)) {
      fail(importer, 'rmt.project.import.path', 'Imports must be explicit relative .rmt/.rmtx paths.', spec.range); return [];
    }
    if (!['static_file', 'static_glob'].includes(spec.mode)) { fail(importer, 'rmt.project.import.mode', 'Only static_file and static_glob project imports are supported.', spec.range); return []; }
    const absolute = path.resolve(path.dirname(importer), spec.path);
    if (!boundary(absolute)) { fail(importer, 'rmt.project.import.boundary', 'An import escapes the lexical or physical project root.', spec.range); return []; }
    if (spec.mode === 'static_file') {
      if (spec.path.includes('*') || !fileSyntax(absolute)) { fail(importer, 'rmt.project.import.extension', 'Static imports require .rmt or .rmtx, never provider .tsx.', spec.range); return []; }
      return [absolute];
    }
    const pattern = /^(.*?\/)(\*\*\/)?\*\.(rmtx?)$/u.exec(posix(absolute));
    if (!pattern || pattern[1].includes('*')) { fail(importer, 'rmt.project.import.glob', 'Only *.rmt, *.rmtx and their **/ forms are supported.', spec.range); return []; }
    const directory = path.resolve(pattern[1]), recursive = !!pattern[2], extension = '.' + pattern[3], found = new Set();
    function visitDirectory(dir) {
      if (!boundary(dir)) { fail(importer, 'rmt.project.import.boundary', 'A glob crosses a physical project boundary.', spec.range); return; }
      let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { entries = []; }
      for (const entry of entries) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory() && recursive) visitDirectory(file);
        else if (entry.isFile() && file.endsWith(extension)) found.add(file);
        else if (entry.isSymbolicLink() && file.endsWith(extension)) {
          if (!boundary(file)) fail(importer, 'rmt.project.import.boundary', 'A glob matched a foreign symlink.', spec.range);
          else {
            try { if (fs.statSync(file).isFile()) found.add(file); }
            catch { fail(importer, 'rmt.project.import.missing', 'A glob matched a dangling or unreadable module symlink.', spec.range); }
          }
        }
      }
    }
    visitDirectory(directory);
    for (const file of overlays.keys()) if (file.endsWith(extension) && inside(directory, file) && (recursive || path.dirname(file) === directory)) found.add(file);
    const result = [...found].sort(compare);
    if (!result.length) fail(importer, 'rmt.project.import.glob-empty', 'The project import glob matched no modules.', spec.range);
    // Membership is part of identity even if every previously matched byte is unchanged.
    dependencies.set('glob:' + absolute, { filePath: posix(absolute), exists: result.length > 0, kind: 'glob', sha256: hash(JSON.stringify(result.map(posix))), matches: result.map(posix) });
    return result;
  }
  function visit(file, importer = null, importRange = null) {
    if (active.includes(file)) { fail(importer || active.at(-1), 'rmt.project.import.cycle', `Static module cycle: ${[...active.slice(active.indexOf(file)), file].map(value => posix(path.relative(rootDir, value))).join(' -> ')}.`, importRange); return; }
    if (byPath.has(file)) return;
    if (modules.length >= limits.modules) { fail(file, 'rmt.project.limit', 'The project exceeds 256 modules.'); return; }
    let text;
    try { text = read(file); if (typeof text !== 'string') throw new Error('Module reader did not return text.'); }
    catch (error) {
      dependencies.set(file, { filePath: posix(file), exists: false, sha256: null, sourceSyntax: fileSyntax(file), syntaxVersion: fileSyntax(file) === 'rmtx' ? syntaxVersion : 'classic' });
      fail(importer || file, error.code === 'rmt.project.import.boundary' ? error.code : 'rmt.project.import.missing', `Cannot read project module ${posix(path.relative(rootDir, file))}: ${error.message}`, importRange); return;
    }
    bytes += Buffer.byteLength(text, 'utf8');
    if (bytes > limits.sourceBytes) { fail(file, 'rmt.project.limit', 'Project sources exceed 8 MiB.'); return; }
    const sourceModel = makeModel(file, text); models.set(file, sourceModel);
    const sourceSyntax = fileSyntax(file), record = { filePath: posix(file), uri: sourceModel.uri, text, sourceSyntax, syntaxVersion: sourceSyntax === 'rmtx' ? syntaxVersion : 'classic', sha256: hash(text), imports: [], diagnostics: [] };
    Object.defineProperty(record, 'sourceModel', { value: sourceModel });
    modules.push(record); byPath.set(file, record);
    dependencies.set(file, { filePath: posix(file), exists: true, sha256: record.sha256, sourceSyntax, syntaxVersion: record.syntaxVersion });
    if (sourceSyntax === 'rmtx') inspectRmtx(record, { ...options, rmtxSyntaxVersion: syntaxVersion });
    else {
      const parsed = parseRmtVNextSource({ text, filePath: file, uri: record.uri }); Object.defineProperty(record, '_classic', { value: parsed });
      record.diagnostics.push(...parsed.diagnostics);
      record.programId = parsed.ast?.body.find(node => node.type === 'RmtTemplateDeclaration')?.name;
      record.imports = declarations(parsed.ast).filter(node => node.type === 'RmtImportDeclaration').map(node => ({ path: node.path, mode: node.mode, range: node.range }));
    }
    diagnostics.push(...record.diagnostics);
    active.push(file);
    for (const spec of record.imports) {
      const resolved = matches(file, spec);
      edges.push({ importer: posix(file), importPath: spec.path, mode: spec.mode, resolvedPaths: resolved.map(posix), range: spec.range });
      for (const target of resolved) visit(target, file, spec.range);
    }
    active.pop(); order.push(posix(file));
  }
  if (!diagnostics.length) loadProviderRegistry();
  if (!diagnostics.length || options.recoverImports === true && VERSIONS.has(syntaxVersion) && fileSyntax(entryFile)) visit(entryFile);
  const dependencyList = [...dependencies.values()].sort((a, b) => compare(a.filePath, b.filePath));
  const identity = hash(JSON.stringify({ apiVersion: RMT_PROJECT_API_VERSION, rootDir: posix(rootDir), entryFile: posix(entryFile), syntaxVersion,
    sourceSyntax: options.sourceSyntax || fileSyntax(entryFile), dependencies: dependencyList }));
  const snapshot = { schema: RMT_PROJECT_GRAPH_SCHEMA, apiVersion: RMT_PROJECT_API_VERSION, ok: !diagnostics.some(row => row.severity === 'error'),
    rootDir: posix(rootDir), entryFile: posix(entryFile), sourceSyntax: fileSyntax(entryFile), syntaxVersion, identity,
    effectiveSourceProfile: fileSyntax(entryFile) === 'rmtx' || modules.some(record => record.sourceSyntax === 'rmtx') ? { syntax: 'rmtx', version: syntaxVersion } : { syntax: 'rmt', version: 'classic' },
    modules, dependencies: dependencyList, edges, order, diagnostics, componentInterfaceCatalog, rmtxProviders, rmtxProvidersFile };
  return snapshot;
}

function sourceWitness(snapshot, origins = [], sourceMap = []) {
  return freeze({ schema: RMT_PROJECT_REPORT_SCHEMA, apiVersion: RMT_PROJECT_API_VERSION, ok: snapshot.ok, identity: snapshot.identity,
    rootDir: snapshot.rootDir, entryFile: snapshot.entryFile, sourceSyntax: snapshot.sourceSyntax, syntaxVersion: snapshot.syntaxVersion,
    effectiveSourceProfile: snapshot.effectiveSourceProfile, dependencies: snapshot.dependencies, edges: snapshot.edges, order: snapshot.order, origins, sourceMap,
    rmtxProviders: snapshot.rmtxProviders, rmtxProvidersFile: snapshot.rmtxProvidersFile });
}
function failedResult(snapshot) {
  return { schema: RMT_PROJECT_COMPILE_RESULT_SCHEMA, apiVersion: RMT_PROJECT_API_VERSION, ok: false, status: 'invalid', phase: 'project',
    sourceProfile: snapshot.effectiveSourceProfile, diagnostics: snapshot.diagnostics, compilerDiagnostics: snapshot.diagnostics,
    coreDocument: null, coreJson: null, orchestrationArtifacts: null, primitiveArtifacts: null, appServiceDemands: null,
    selectorDependencies: null, componentDependencies: null, nativeDependencies: null, lifecycleDependencies: null, xtensionBindings: null, xtensionComposition: null,
    project: sourceWitness(snapshot) };
}
function isReferenceIdentifier(node) {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isJsxAttribute(parent)) && parent.name === node) return false;
  return true;
}
function compose(snapshot) {
  const byPath = new Map(snapshot.modules.map(record => [record.filePath, record]));
  const rmtx = snapshot.modules.filter(record => record.sourceSyntax === 'rmtx');
  const entry = byPath.get(snapshot.entryFile);
  const profile = getRmtxOperatorProfile(snapshot.syntaxVersion);
  let text = `import { ${profile.imports.join(', ')} } from '@ccslabs/xtend/rmt-language/rmtx';\nexport default <RMT.Program id=${JSON.stringify(entry.programId || 'project')} >\n`;
  const origins = [], classic = [];
  function append(raw, filePath, start, end, replacement = false) {
    const offset = text.length; text += raw;
    origins.push({ filePath, startOffset: start, endOffset: end, generatedStart: offset, generatedEnd: text.length, replacement });
  }
  for (const filePath of snapshot.order) {
    const record = byPath.get(filePath);
    if (record.sourceSyntax !== 'rmtx') continue;
    const { file, bindings, children } = record._rmtx;
    for (const child of children) {
      const start = child.pos, end = child.end, replacements = [];
      function find(node) {
        if (ts.isIdentifier(node) && bindings.has(node.text) && bindings.get(node.text) !== node.text && isReferenceIdentifier(node)) replacements.push({ start: node.getStart(file), end: node.end, value: bindings.get(node.text) });
        ts.forEachChild(node, find);
      }
      find(child); replacements.sort((a, b) => a.start - b.start);
      let cursor = start;
      for (const edit of replacements) {
        append(record.text.slice(cursor, edit.start), filePath, cursor, edit.start);
        append(edit.value, filePath, edit.start, edit.end, true); cursor = edit.end;
      }
      append(record.text.slice(cursor, end), filePath, cursor, end); text += '\n';
    }
  }
  text += '</RMT.Program>;\n';
  for (const filePath of snapshot.order) {
    const record = byPath.get(filePath);
    if (record.sourceSyntax !== 'rmt-vnext') continue;
    text += '\n'; const offset = text.length;
    append(mask(record.text), filePath, 0, record.text.length); text += '\n';
    for (const node of declarations(record._classic.ast)) {
      if (node.type === 'RmtImportDeclaration') continue;
      const copied = JSON.parse(JSON.stringify(node));
      walk(copied, value => {
        if (!value.range) return;
        const start = value.range.startOffset ?? record.sourceModel.offsetAt(value.range.start);
        const end = value.range.endOffset ?? record.sourceModel.offsetAt(value.range.end);
        value.range = { _projectStart: offset + start, _projectEnd: offset + end };
        delete value.astPointer;
      });
      classic.push(copied);
    }
  }
  const virtualFilePath = snapshot.entryFile.replace(/\.rmt$/iu, '.rmtx');
  const sourceModel = createRmtSourceModel({ text, filePath: virtualFilePath, languageId: 'rmtx' });
  for (const node of classic) walk(node, value => {
    if (value.range?._projectStart !== undefined) value.range = sourceModel.rangeForOffsets(value.range._projectStart, value.range._projectEnd);
  });
  return { text, filePath: virtualFilePath, origins, classic, sourceModel };
}
function mapDiagnostic(item, composite, snapshot) {
  const offset = item.range?.startOffset ?? (item.range?.start ? composite.sourceModel.offsetAt(item.range.start) : 0);
  const segment = composite.origins.find(row => offset >= row.generatedStart && offset < row.generatedEnd)
    || composite.origins.find(row => offset === row.generatedEnd);
  if (!segment) {
    const entry = snapshot.modules.find(row => row.filePath === snapshot.entryFile);
    return { ...item, file: snapshot.entryFile, uri: entry.uri, range: entry.sourceModel.rangeForOffsets(0, 1) };
  }
  const record = snapshot.modules.find(row => row.filePath === segment.filePath);
  const start = segment.replacement ? segment.startOffset : segment.startOffset + offset - segment.generatedStart;
  const generatedEnd = item.range?.endOffset ?? offset + 1;
  const endSegment = composite.origins.find(row => row.filePath === segment.filePath && generatedEnd > row.generatedStart && generatedEnd <= row.generatedEnd);
  const end = endSegment ? endSegment.replacement ? endSegment.endOffset : endSegment.startOffset + generatedEnd - endSegment.generatedStart
    : segment.endOffset;
  return { ...item, file: record.filePath, uri: record.uri, range: record.sourceModel.rangeForOffsets(start, Math.max(start, end)) };
}
function composeClassic(snapshot) {
  let text = '';
  const origins = [], body = [], byPath = new Map(snapshot.modules.map(record => [record.filePath, record]));
  const entry = byPath.get(snapshot.entryFile);
  for (const file of snapshot.order) {
    const record = byPath.get(file), offset = text.length;
    text += record.text;
    origins.push({ filePath: file, startOffset: 0, endOffset: record.text.length, generatedStart: offset, generatedEnd: text.length, replacement: false });
    text += '\n';
    for (const node of declarations(record._classic.ast)) {
      if (node.type === 'RmtImportDeclaration') continue;
      const copy = JSON.parse(JSON.stringify(node));
      walk(copy, value => {
        delete value.astPointer;
        if (!value.range) return;
        value.range = { _projectStart: offset + (value.range.startOffset ?? record.sourceModel.offsetAt(value.range.start)),
          _projectEnd: offset + (value.range.endOffset ?? record.sourceModel.offsetAt(value.range.end)) };
      });
      body.push(copy);
    }
  }
  const sourceModel = createRmtSourceModel({ text, filePath: snapshot.entryFile, languageId: 'rmt' });
  body.forEach(node => walk(node, value => {
    if (value.range?._projectStart !== undefined) value.range = sourceModel.rangeForOffsets(value.range._projectStart, value.range._projectEnd);
  }));
  const originalTemplate = entry._classic.ast.body.find(node => node.type === 'RmtTemplateDeclaration');
  const template = JSON.parse(JSON.stringify({ ...originalTemplate, body: [] }));
  const entryOffset = origins.find(origin => origin.filePath === snapshot.entryFile).generatedStart;
  walk(template, value => {
    delete value.astPointer;
    if (value.range) value.range = sourceModel.rangeForOffsets(entryOffset + (value.range.startOffset ?? entry.sourceModel.offsetAt(value.range.start)),
      entryOffset + (value.range.endOffset ?? entry.sourceModel.offsetAt(value.range.end)));
  });
  template.body = body;
  const ast = { type: 'RmtVNextDocument', schema: 'xtend.rmt.vnext.ast.v1', range: sourceModel.rangeForOffsets(0, text.length), body: [template] };
  return { text, filePath: snapshot.entryFile, origins, sourceModel, ast };
}
function compileRmtProjectSource(input = {}, options = {}) {
  const snapshot = createRmtProjectSnapshot(input, options);
  if (!snapshot.ok) return failedResult(snapshot);
  const entry = snapshot.modules.find(record => record.filePath === snapshot.entryFile);
  const { documents, readFile, rootDir, root, sourceSyntax, rmtxSyntaxVersion, semanticCheck, rmtxProvidersFile, rmtxProviders, ...compilerOptions } = options;
  if (snapshot.componentInterfaceCatalog) compilerOptions.componentInterfaceCatalog = snapshot.componentInterfaceCatalog;
  let result, composite = null;
  if (snapshot.modules.length === 1 && entry.imports.length === 0) {
    result = entry.sourceSyntax === 'rmtx'
      ? compileRmtxSource({ text: entry.text, filePath: entry.filePath, uri: entry.uri }, { ...compilerOptions, syntaxVersion: snapshot.syntaxVersion })
      : compileRmtVNextSource({ text: entry.text, filePath: entry.filePath, uri: entry.uri }, compilerOptions);
  } else if (snapshot.effectiveSourceProfile.syntax === 'rmtx') {
    composite = compose(snapshot);
    const composedInput = { text: composite.text, filePath: composite.filePath };
    const linkedOptions = bindProjectDeclarations({ ...compilerOptions, syntaxVersion: snapshot.syntaxVersion }, composedInput, composite.classic);
    result = compileRmtxSource(composedInput, linkedOptions);
    result = { ...result, diagnostics: result.diagnostics.map(item => mapDiagnostic(item, composite, snapshot)),
      compilerDiagnostics: result.compilerDiagnostics.map(item => mapDiagnostic(item, composite, snapshot)) };
  } else {
    composite = composeClassic(snapshot);
    const errors = validateRmtClassicAst(composite.ast, { sourceModel: composite.sourceModel });
    if (errors.length) { snapshot.diagnostics.push(...errors.map(item => mapDiagnostic(item, composite, snapshot))); snapshot.ok = false; return failedResult(snapshot); }
    result = compileRmtVNextAstResult(composite.ast, { ...compilerOptions, sourceModel: composite.sourceModel });
    result = { ...result, diagnostics: result.diagnostics.map(item => mapDiagnostic(item, composite, snapshot)),
      compilerDiagnostics: result.compilerDiagnostics.map(item => mapDiagnostic(item, composite, snapshot)) };
  }
  if (result.ok && semanticCheck !== false && snapshot.modules.some(record => record.sourceSyntax === 'rmtx')) {
    const service = require('./rmtx-language-service');
    const checked = service.checkRmtxProjectTypes(snapshot.modules.map(({ filePath, uri, text, sourceSyntax }) => ({ filePath, uri, text, sourceSyntax })),
      { ...options, componentInterfaceCatalog: snapshot.componentInterfaceCatalog, syntaxVersion: snapshot.syntaxVersion, rootDir: snapshot.rootDir });
    if (checked.diagnostics?.length) result = { ...result, diagnostics: [...result.diagnostics, ...checked.diagnostics], compilerDiagnostics: [...result.compilerDiagnostics, ...checked.diagnostics] };
    if (checked.diagnostics?.some(item => item.severity === 'error')) {
      result = { ...result, ok: false, status: 'invalid', phase: 'semantic',
        coreDocument: null, coreJson: null, orchestrationArtifacts: null, primitiveArtifacts: null, appServiceDemands: null,
        selectorDependencies: null, componentDependencies: null, nativeDependencies: null, lifecycleDependencies: null, xtensionBindings: null, xtensionComposition: null };
    }
  }
  const sourceMap = (result.coreDocument?.sourceMap || []).map(row => composite ? mapDiagnostic(row, composite, snapshot)
    : { ...row, file: entry.filePath, uri: entry.uri });
  return { ...result, project: sourceWitness(snapshot, composite?.origins || [], sourceMap) };
}
function createRmtProjectCompiler(defaultOptions = {}) {
  return Object.freeze({ name: 'RMT Project', schema: RMT_PROJECT_COMPILER_SCHEMA, apiVersion: RMT_PROJECT_API_VERSION,
    compileSource: (input, options = {}) => compileRmtProjectSource(input, { ...defaultOptions, ...options }),
    createSnapshot: (input, options = {}) => createRmtProjectSnapshot(input, { ...defaultOptions, ...options }) });
}
function createRmtProject(defaultOptions = {}) {
  const overlays = new Map();
  function options(overrides = {}) {
    const merged = { ...defaultOptions, ...overrides }, root = path.resolve(merged.rootDir || merged.root || process.cwd());
    const documents = [...documentMap(defaultOptions.documents, root)].map(([filePath, text]) => ({ filePath, text }))
      .concat([...overlays.values()], [...documentMap(overrides.documents, root)].map(([filePath, text]) => ({ filePath, text })));
    return { ...merged, documents };
  }
  return Object.freeze({ apiVersion: RMT_PROJECT_API_VERSION,
    updateDocument(document) { const normalized = inputRecord(document, defaultOptions); overlays.set(normalized.entryFile, { ...document, filePath: normalized.entryFile }); },
    removeDocument(file) { const value = typeof file === 'string' ? file : file.filePath || file.uri;
      for (const [key, document] of overlays) if (document.uri === value) overlays.delete(key);
      overlays.delete(String(value).startsWith('file:') ? normalizeFile(value) : path.resolve(defaultOptions.rootDir || defaultOptions.root || process.cwd(), value)); },
    getDocuments: (input, overrides = {}) => createRmtProjectSnapshot(input, options(overrides)).modules.map(({ filePath, uri, text, sourceSyntax, syntaxVersion }) => ({ filePath, uri, text, sourceSyntax, syntaxVersion })),
    analyze: (input, overrides = {}) => createRmtProjectSnapshot(input, options(overrides)),
    compileSource: (input, overrides = {}) => compileRmtProjectSource(input, options(overrides)),
    dispose() { overlays.clear(); } });
}
module.exports = { RMT_PROJECT_API_VERSION, RMT_PROJECT_GRAPH_SCHEMA, RMT_PROJECT_REPORT_SCHEMA, RMT_PROJECT_COMPILER_SCHEMA, RMT_PROJECT_COMPILE_RESULT_SCHEMA,
  createRmtProjectSnapshot, compileRmtProjectSource, createRmtProjectCompiler, createRmtProject };

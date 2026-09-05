'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL, fileURLToPath } = require('url');
const { discoverFiles, fingerprint, posix, inside, compare } = require('./sources');
const { computeImpact } = require('./impact');
const SCHEMA = 'xtend.project-index.v1';
const ANALYZER_VERSION = '1';
const uriFor = file => pathToFileURL(path.resolve(file)).href;
const fileFor = value => value.startsWith('file:') ? fileURLToPath(value) : path.resolve(value);
const virtualUri = value => /^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith('file:') && !path.isAbsolute(value);
const documentUri = value => virtualUri(value) ? value : uriFor(fileFor(value));
const fileId = file => `file:${uriFor(file)}`;
const sortRecords = values => values.sort((a, b) => compare(a.id || JSON.stringify(a), b.id || JSON.stringify(b)));
const location = (uri, range) => ({ uri, range });
const at = (range, position) => range && position &&
  (position.line > range.start.line || position.line === range.start.line && position.character >= range.start.character) &&
  (position.line < range.end.line || position.line === range.end.line && position.character < range.end.character);

class ProjectIndex {
  constructor(options = {}) {
    if (!options.rootDir && !options.workspaceRoots?.length) throw new TypeError('An explicit rootDir or workspaceRoots is required');
    this.options = { profile: 'rmt', ...options };
    if (!['rmt', 'repository'].includes(this.options.profile)) throw new TypeError('Unknown project-index profile');
    this.roots = [...new Set((options.workspaceRoots || [options.rootDir]).map(fileFor))].sort(compare);
    this.documents = new Map();
    this.overlays = new Map();
    this.analyses = new Map();
    this.stats = { analyses: 0, rmtAnalyses: 0, moduleAnalyses: 0, cacheHits: 0 };
    this.dirty = true;
    this.built = false;
    this.disposed = false;
    this.metadata = new Map();
    this.ts = this.options.profile === 'repository' ? require('./modules').loadTypeScript(this.roots[0]) : null;
  }
  assertActive() { if (this.disposed) throw new Error('Project index has been disposed'); }
  rootFor(file) { return this.roots.filter(root => inside(root, file)).sort((a, b) => b.length - a.length)[0]; }
  build() {
    this.assertActive();
    const found = new Set();
    this.packages = [];
    const config = [];
    for (const root of this.roots) {
      const files = discoverFiles(root, { git: this.options.git });
      for (const relative of files.filter(file => /(?:^|\/)(?:package|tsconfig[^/]*)\.json$/.test(file))) {
        const file = path.join(root, relative);
        try {
          const text = this.overlays.get(uriFor(file))?.text ?? fs.readFileSync(file, 'utf8');
          config.push([uriFor(file), fingerprint(text)]);
          if (path.basename(file) === 'package.json') {
            const manifest = JSON.parse(text);
            this.packages.push({ id: `package:${uriFor(file)}`, name: manifest.name || relative, directory: path.dirname(file), rootDir: root, manifest, manifestPath: relative, text });
          }
        } catch { /* Invalid manifests appear as document coverage gaps below. */ }
      }
      for (const relative of files) {
        if (this.options.profile === 'rmt' && !/\.(?:rmt|rmt\.json|core\.json|rmt\.yaml|rmt\.yml)$/.test(relative)) continue;
        if (relative === 'tests/schemas/xtend-schema-inventory.json' || /(?:^|\/)package-lock\.json$/.test(relative)) continue;
        const file = path.join(root, relative);
        found.add(uriFor(file));
      }
    }
    this.configurationFingerprint = fingerprint(JSON.stringify({ roots: this.roots, profile: this.options.profile, importRoots: this.options.importRoots || null, config: config.sort() }));
    for (const uri of found) this.readDocument(fileFor(uri));
    for (const [uri, doc] of this.documents) if (!found.has(uri) && !this.overlays.has(uri)) {
      // Explicit imports may rediscover normally excluded files below. Keep
      // their content cache until linking establishes the current reachable set.
      this.documents.delete(uri);
    }
    for (const overlay of this.overlays.values()) this.storeDocument(overlay);
    this.built = true;
    this.dirty = true;
    return this;
  }
  readDocument(file) {
    const uri = uriFor(file);
    if (this.overlays.has(uri)) return this.storeDocument(this.overlays.get(uri));
    const discard = () => { this.documents.delete(uri); this.analyses.delete(uri); this.dirty = true; return false; };
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile() || stat.size > 16 * 1024 * 1024) return discard();
      const buffer = fs.readFileSync(file);
      if (buffer.includes(0)) return discard();
      return this.storeDocument({ uri, filePath: file, text: buffer.toString('utf8'), version: null, origin: 'disk' });
    } catch {
      return discard();
    }
  }
  storeDocument(input) {
    const file = fileFor(input.filePath || input.uri), workspace = this.rootFor(file);
    // Explicitly opened standalone documents get an isolated project identity;
    // they do not widen workspace discovery or the RMT import boundary.
    const root = workspace || this.roots[0] || fileFor(this.options.rootDir || path.dirname(file));
    const uri = input.uri && virtualUri(input.uri) ? input.uri : uriFor(file), text = String(input.text ?? '');
    const owner = (this.packages || []).filter(pkg => inside(pkg.directory, file)).sort((a, b) => b.directory.length - a.directory.length)[0];
    const projectRoot = owner?.directory || (workspace ? root : path.dirname(file));
    const document = { id: `file:${uri}`, uri, filePath: file, rootDir: root, projectId: `project:${uriFor(projectRoot)}`,
      relativePath: posix(path.relative(projectRoot, file)), workspacePath: posix(path.relative(root, file)),
      language: /\.(?:rmt|rmt\.json|core\.json|rmt\.ya?ml)$/.test(file) || input.languageId === 'rmt' ? 'rmt' : /\.[cm]?[jt]sx?$/.test(file) ? 'module' : 'data',
      fingerprint: fingerprint(text), version: input.version ?? null, origin: input.origin || 'buffer', status: 'unanalysed', text };
    const previous = this.documents.get(uri);
    if (previous && previous.fingerprint === document.fingerprint && previous.language === document.language) {
      document.status = previous.status;
      if (previous.moduleExports) document.moduleExports = previous.moduleExports;
      if (previous.analysisProvider) document.analysisProvider = previous.analysisProvider;
    }
    this.documents.set(uri, document);
    if (!previous || previous.fingerprint !== document.fingerprint || previous.version !== document.version || previous.projectId !== document.projectId) this.dirty = true;
    return true;
  }
  updateDocument(input) {
    this.assertActive();
    const uri = documentUri(input.uri || input.filePath);
    const previous = this.overlays.get(uri);
    const version = input.version ?? (previous?.version ?? -1) + 1;
    if (previous && version <= previous.version) return false;
    const overlay = { ...input, uri, version, origin: 'buffer' };
    if (!this.storeDocument(overlay)) return false;
    this.overlays.set(uri, overlay);
    return true;
  }
  closeDocument(value) {
    this.assertActive(); const uri = documentUri(value); this.overlays.delete(uri); this.dirty = true;
    if (virtualUri(uri)) { this.removeDocument(uri); return false; }
    return this.readDocument(fileFor(uri));
  }
  removeDocument(value) {
    this.assertActive(); const uri = documentUri(value); this.overlays.delete(uri); this.analyses.delete(uri); this.dirty = true;
    return this.documents.delete(uri);
  }
  refreshDocument(value) { this.assertActive(); return this.readDocument(fileFor(value)); }
  getAnalysis(documentPath) {
    this.assertActive();
    const uri = documentUri(documentPath);
    if (virtualUri(uri) && !this.documents.has(uri)) return null;
    if (!this.documents.has(uri)) this.readDocument(fileFor(uri));
    const document = this.documents.get(uri);
    if (!document) return null;
    const cached = this.analyses.get(uri);
    if (cached && cached.fingerprint === document.fingerprint && cached.language === document.language) {
      this.stats.cacheHits++;
      if (cached.value) { cached.value.document = document; cached.value.input && (cached.value.input.version = document.version); }
      document.status = cached.status;
      if (document.language === 'module' && cached.value) document.moduleExports = cached.value.exports;
      document.analysisProvider = cached.provider;
      return cached.value;
    }
    let value = null;
    if (document.language === 'rmt') { value = require('./rmt').analyze(document, document.rootDir); this.stats.rmtAnalyses++; }
    else if (document.language === 'module' && this.ts) { value = require('./modules').analyzeModule(this.ts, document.filePath, document.text, document.rootDir); this.stats.moduleAnalyses++; }
    document.status = value ? (document.language === 'rmt' ? value.graph.ok ? 'complete' : 'incomplete' : value.gaps.length ? 'incomplete' : 'complete') : document.language === 'data' ? 'recorded' : 'incomplete';
    if (document.language === 'module' && value) document.moduleExports = value.exports;
    document.analysisProvider = document.language === 'rmt' ? value?.languageMode === 'vnext' ? 'rmt-vnext-compiler' : 'rmt-semantic-graph' : document.language === 'module' ? this.ts ? 'typescript' : 'unavailable' : 'source-inventory';
    this.stats.analyses++;
    this.analyses.set(uri, { fingerprint: document.fingerprint, language: document.language, value, status: document.status, provider: document.analysisProvider });
    return value;
  }
  ensureLinked() {
    this.assertActive(); if (!this.built) this.build(); if (!this.dirty) return;
    this.symbolRecords = []; this.referenceRecords = []; this.relationships = []; this.coverage = []; this.suites = []; this.contracts = [];
    const analyses = new Map();
    const edge = (from, to, kind, provenance, extra = {}) => {
      const value = { from, to, kind, provenance, ...extra };
      this.relationships.push({ id: `edge:${fingerprint(JSON.stringify(value))}`, ...value });
    };
    // Resolver preserves its existing default: an entry's directory is its
    // import boundary unless explicit importRoots were supplied.
    for (const document of this.documents.values()) {
      const analysis = this.getAnalysis(document.uri);
      analyses.set(document.uri, analysis);
      if (document.language !== 'rmt' || !analysis?.imports.length) continue;
      if (virtualUri(document.uri)) {
        this.coverage.push({ documentId: document.id, path: document.workspacePath, provider: 'rmt-vnext-import-resolver', code: 'virtual-document-import-base', detail: 'Save the document to establish a filesystem import base.' });
        continue;
      }
      const { createModuleGraph } = require('../rmt-language/vnext-import-resolver');
      const roots = (this.options.importRoots || [path.dirname(document.filePath)]).map(root => path.resolve(document.rootDir, root));
      const graph = createModuleGraph({ entryFile: document.filePath }, { rootDir: document.rootDir, roots,
        allowIncompleteImports: true,
        readText: file => this.documents.get(uriFor(file))?.text ?? fs.readFileSync(file, 'utf8'),
        fileExists: file => this.documents.has(uriFor(file)) || fs.existsSync(file),
        compileSource: input => this.getAnalysis(input.filePath)?.graph.compileResult || require('../rmt-language/vnext-compiler').compileRmtVNextSource(input),
        additionalFiles: [...this.overlays.keys()].map(fileFor),
        realPathInsideAnyRoot: file => { let real; try { real = fs.realpathSync(file); } catch { if (this.overlays.has(uriFor(file))) real = file; }
          return real ? { realPath: real, inside: roots.some(root => { try { return inside(fs.realpathSync(root), real); } catch { return inside(root, real); } }) } : null; }
      });
      const modules = new Map(graph.modules.map(module => [module.id, module]));
      for (const item of graph.edges) {
        const importer = modules.get(item.importer);
        if (!importer || importer.filePath !== posix(document.filePath)) continue;
        const imported = analysis.imports.find(record => record.path === item.importPath);
        for (const target of item.resolvedPaths) edge(document.id, fileId(target), 'rmt-import', { provider: 'rmt-vnext-import-resolver', evidence: 'declared', path: document.workspacePath }, { source: location(document.uri, imported?.range), specifier: item.importPath });
      }
      for (const diagnostic of graph.diagnostics) if (String(diagnostic.code).startsWith('rmt.vnext.import.')) this.coverage.push({ documentId: document.id, path: document.workspacePath, provider: 'rmt-vnext-import-resolver', code: diagnostic.code, detail: diagnostic.message });
    }
    for (const document of this.documents.values()) {
      const analysis = this.getAnalysis(document.uri); analyses.set(document.uri, analysis);
      if (document.language !== 'rmt' || !analysis) continue;
      const ids = new Map();
      for (const entry of analysis.entries) {
        const declared = entry.node?.name || entry.id;
        const base = `symbol:${JSON.stringify([document.projectId, document.relativePath, entry.domain, entry.declaredScope, declared])}`;
        const count = (ids.get(base) || 0) + 1; ids.set(base, count);
        const symbol = { id: count === 1 ? base : `${base}#duplicate:${count}`, documentId: document.id, projectId: document.projectId,
          name: entry.name, domain: entry.domain, scope: entry.declaredScope, declaredIdentity: declared, aliases: entry.aliases,
          pointer: entry.pointer, astPointer: entry.node?.astPointer || null,
          definition: location(document.uri, entry.range), nameLocation: location(document.uri, entry.idRange),
          provenance: { provider: analysis.languageMode === 'legacy' ? 'rmt-semantic-graph' : 'rmt-compiler-and-primitive-graph', evidence: 'semantic', path: document.workspacePath } };
        this.symbolRecords.push(symbol);
      }
      const local = this.symbolRecords.filter(symbol => symbol.documentId === document.id);
      for (const [i, ref] of analysis.refs.entries()) {
        const targets = local.filter(symbol => symbol.domain === ref.targetDomain && symbol.aliases.includes(ref.targetId));
        const resolved = ref.resolved && targets.length === 1;
        this.referenceRecords.push({ id: `reference:${document.id}:${i}`, documentId: document.id, projectId: document.projectId,
          source: location(document.uri, ref.sourceRange), pointer: ref.sourcePointer,
          relationship: ref.relationship, targetDomain: ref.targetDomain, targetName: ref.targetId,
          targetId: resolved ? targets[0].id : null, status: targets.length > 1 ? 'ambiguous' : resolved ? 'resolved' : 'unresolved',
          candidates: [], provenance: { provider: ref.provider, evidence: 'semantic', path: document.workspacePath } });
      }
      if (!analysis.graph.ok) this.coverage.push({ documentId: document.id, path: document.workspacePath, provider: 'rmt', code: 'incomplete-analysis', detail: 'Current compiler/parser diagnostics are retained; partial declarations only.' });
    }
    for (const reference of this.referenceRecords.filter(ref => ref.status !== 'resolved')) {
      const reachable = new Set([reference.documentId]), queue = [reference.documentId];
      while (queue.length) { const from = queue.shift(); for (const rel of this.relationships) if (rel.kind === 'rmt-import' && rel.from === from && !reachable.has(rel.to)) { reachable.add(rel.to); queue.push(rel.to); } }
      reference.candidates = this.symbolRecords.filter(symbol => symbol.projectId === reference.projectId && symbol.documentId !== reference.documentId && reachable.has(symbol.documentId) && symbol.domain === reference.targetDomain && symbol.aliases.includes(reference.targetName)).map(symbol => symbol.id);
    }
    if (this.options.profile === 'repository') require('./repository').linkRepository(this, analyses, edge, fileId);
    this.relationships = sortRecords([...new Map(this.relationships.map(rel => [rel.id, rel])).values()]);
    this.symbolRecords = sortRecords(this.symbolRecords); this.referenceRecords = sortRecords(this.referenceRecords);
    this.coverage = [...new Map(this.coverage.map(gap => [JSON.stringify(gap), gap])).values()].sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)));
    for (const uri of this.analyses.keys()) if (!this.documents.has(uri)) this.analyses.delete(uri);
    this.dirty = false;
  }
  snapshot() {
    this.ensureLinked();
    const documents = sortRecords([...this.documents.values()].map(({ text, ...document }) => document));
    return JSON.parse(JSON.stringify({ schema: SCHEMA, analyzerVersion: ANALYZER_VERSION, profile: this.options.profile,
      workspaceRoots: this.roots, configurationFingerprint: this.configurationFingerprint,
      contentFingerprint: fingerprint(JSON.stringify(documents.map(doc => [doc.id, doc.fingerprint]))),
      documents, symbols: this.symbolRecords, references: this.referenceRecords, relationships: this.relationships,
      packages: (this.packages || []).map(({ manifest, text, ...pkg }) => pkg).sort((a, b) => compare(a.id, b.id)), contracts: sortRecords(this.contracts), suites: sortRecords(this.suites), coverage: this.coverage }));
  }
  searchSymbols(query = '', options = {}) {
    this.ensureLinked(); return this.symbolRecords.filter(symbol => (!query || symbol.name.toLowerCase().includes(query.toLowerCase())) && (!options.projectId || symbol.projectId === options.projectId) && (!options.uri || symbol.definition.uri === options.uri)).slice(0, options.limit ?? Infinity);
  }
  definitions(query = {}) {
    this.ensureLinked();
    if (query.symbolId) return this.symbolRecords.filter(symbol => symbol.id === query.symbolId).map(symbol => symbol.nameLocation);
    const references = this.referenceRecords.filter(ref => ref.source.uri === query.uri && (query.pointer ? ref.pointer === query.pointer : at(ref.source.range, query.position)));
    if (references.length) return references.filter(ref => ref.status === 'resolved').flatMap(ref => this.definitions({ symbolId: ref.targetId }));
    const imports = this.relationships.filter(rel => rel.kind === 'rmt-import' && rel.source?.uri === query.uri && at(rel.source.range, query.position));
    if (imports.length) return imports.map(rel => ({ uri: rel.to.slice(5), range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } }));
    return this.symbolRecords.filter(symbol => symbol.definition.uri === query.uri && (query.pointer ? [symbol.pointer, symbol.astPointer].includes(query.pointer) : at(symbol.nameLocation.range, query.position))).map(symbol => symbol.nameLocation);
  }
  references(query = {}) {
    this.ensureLinked();
    const ids = new Set(query.symbolId ? [query.symbolId] : this.symbolRecords.filter(symbol => symbol.nameLocation.uri === query.uri && at(symbol.nameLocation.range, query.position)).map(symbol => symbol.id));
    if (!ids.size) for (const ref of this.referenceRecords) if (ref.source.uri === query.uri && at(ref.source.range, query.position) && ref.status === 'resolved') ids.add(ref.targetId);
    const results = this.referenceRecords.filter(ref => ref.status === 'resolved' && ids.has(ref.targetId)).map(ref => ref.source);
    if (query.includeDeclaration) results.push(...this.symbolRecords.filter(symbol => ids.has(symbol.id)).map(symbol => symbol.nameLocation));
    return [...new Map(results.map(result => [JSON.stringify(result), result])).values()];
  }
  dispose() {
    this.documents.clear(); this.overlays.clear(); this.analyses.clear(); this.metadata.clear();
    this.symbolRecords = []; this.referenceRecords = []; this.relationships = [];
    this.coverage = []; this.suites = []; this.contracts = []; this.packages = []; this.ts = null;
    this.disposed = true;
  }
}
function createProjectIndex(options) { return new ProjectIndex(options); }
module.exports = { SCHEMA, ANALYZER_VERSION, createProjectIndex, computeImpact };

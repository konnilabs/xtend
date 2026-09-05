'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert/strict');
const { pathToFileURL } = require('url');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { createProjectIndex, computeImpact } = require('../../tools/project-index');
const { runProjectIndexCli } = require('../../tools/project-index/cli');
const { createRmtLanguageServer } = require('../../tools/rmt-language-server/server');
const { compileRmtVNextSource } = require('../../tools/rmt-language/vnext-compiler');
const { buildSemanticGraph } = require('../../tools/rmt-language/semantic-graph');
const { getRmtDocumentSymbols } = require('../../tools/rmt-language/symbols');
const { getRmtVNextToolingDocumentSymbols } = require('../../tools/rmt-language/vnext-tooling');
const { packageExportMappings, discoverFiles } = require('../../tools/project-index/sources');

const source = name => `template app {\n state ${name} type number initial 0\n selector selected from state ${name} {\n output Value[]\n }\n}\n`;
function runProjectIndexSuite(options = {}) {
  const context = createSuiteContext({ id: 'project-index', label: 'Shared project index' });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xt-project-index-'));
  const write = (relative, text) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); return file; };
  const uri = relative => pathToFileURL(path.join(root, relative)).href;
  const check = (label, action) => { try { action(); context.pass(label); } catch (error) { context.fail(`${label}: ${error.stack}`); } };
  const measurements = {};
  let index;
  try {
    write('package.json', JSON.stringify({ name: 'index-test', private: true }));
    write('a.rmt', source('count'));
    write('other/package.json', JSON.stringify({ name: 'other-app' }));
    write('other/a.rmt', source('count'));
    write('node_modules/dependency/hidden.rmt', source('hidden'));
    write('dist/hidden.rmt', source('hidden'));
    index = createProjectIndex({ rootDir: root, git: false }).build();
    check('External source discovery, project isolation and precise UTF-16 positions', () => {
      assert(!discoverFiles(root, { git: false }).some(file => file.includes('hidden')));
      const symbols = index.searchSymbols('count'); assert.equal(symbols.length, 2); assert.notEqual(symbols[0].id, symbols[1].id);
      const count = symbols.find(symbol => symbol.definition.uri === uri('a.rmt'));
      assert.equal(count.nameLocation.range.start.character, 7);
      assert.equal(index.references({ symbolId: count.id }).length, 1);
      assert.deepEqual(index.definitions({ uri: uri('a.rmt'), position: { line: 2, character: 31 } }), [count.nameLocation]);
    });
    check('Stable identity, overlay priority, current diagnostics and stale version rejection', () => {
      const before = index.searchSymbols('count', { uri: uri('a.rmt') })[0].id;
      index.updateDocument({ uri: uri('a.rmt'), text: '\n' + source('count'), version: 3 });
      assert.equal(index.searchSymbols('count', { uri: uri('a.rmt') })[0].id, before);
      assert.equal(index.updateDocument({ uri: uri('a.rmt'), text: source('stale'), version: 2 }), false);
      index.updateDocument({ uri: uri('a.rmt'), text: 'template app {\n state current type number initial 0\n }\n}', version: 4 });
      assert.equal(index.searchSymbols('count', { uri: uri('a.rmt') }).length, 0);
      assert.equal(index.searchSymbols('current', { uri: uri('a.rmt') }).length, 1);
      assert.equal(index.snapshot().documents.find(doc => doc.uri === uri('a.rmt')).status, 'incomplete');
      write('a.rmt', source('disk'));
      index.refreshDocument(uri('a.rmt')); assert.equal(index.searchSymbols('current', { uri: uri('a.rmt') }).length, 1);
      index.closeDocument(uri('a.rmt')); assert.equal(index.searchSymbols('disk', { uri: uri('a.rmt') }).length, 1);
      fs.renameSync(path.join(root, 'a.rmt'), path.join(root, 'renamed.rmt')); index.build();
      assert.equal(index.searchSymbols('', { uri: uri('a.rmt') }).length, 0);
      fs.unlinkSync(path.join(root, 'renamed.rmt')); index.removeDocument(uri('renamed.rmt'));
      assert.equal(index.searchSymbols('', { uri: uri('renamed.rmt') }).length, 0);
      write('opaque.rmt', source('opaque')); index.refreshDocument(uri('opaque.rmt'));
      const stable = JSON.stringify(index.snapshot()); index.refreshDocument(uri('opaque.rmt'));
      assert.equal(JSON.stringify(index.snapshot()), stable);
      write('opaque.rmt', Buffer.from([0, 1, 2])); index.refreshDocument(uri('opaque.rmt'));
      assert.equal(index.searchSymbols('opaque').length, 0);
    });
    check('Compiler failures retain diagnostics; duplicate and unresolved references remain explicit', () => {
      const duplicate = 'template app {\n state same type number initial 0\n state same type number initial 1\n selector selected from state same {\n output Value[]\n }\n}';
      index.updateDocument({ uri: uri('duplicate.rmt'), text: duplicate, version: 1 });
      const analysis = index.getAnalysis(uri('duplicate.rmt'));
      assert.deepEqual(analysis.graph.compileResult.diagnostics, compileRmtVNextSource({ text: duplicate, filePath: path.join(root, 'duplicate.rmt'), uri: uri('duplicate.rmt'), version: 1 }).diagnostics);
      const snapshot = index.snapshot(); assert.equal(snapshot.symbols.filter(symbol => symbol.name === 'same').length, 2);
      assert(snapshot.references.some(reference => reference.status === 'ambiguous'));
      assert(computeImpact({ headSnapshot: snapshot, changedPaths: ['duplicate.rmt'] }).unknownMappings.some(gap => gap.code === 'repository-profile-required'));
      assert.equal(index.definitions({ uri: uri('duplicate.rmt'), position: { line: 3, character: 31 } }).length, 0);
    });
    check('Static imports/globs, cycles and root violations preserve resolver boundaries', () => {
      write('imports/dep.rmt', 'state shared type number initial 0\n');
      write('imports/app.rmt', 'import "./dep.rmt"\nselector selected from state shared {\n output Value[]\n}\n');
      write('imports/glob.rmt', 'import "./nested/*.rmt"\n');
      write('imports/nested/one.rmt', 'state nested type number initial 0\n');
      write('imports/cycle-a.rmt', 'import "./cycle-b.rmt"\n');
      write('imports/cycle-b.rmt', 'import "./cycle-a.rmt"\n');
      write('imports/escape.rmt', 'import "../other/a.rmt"\n');
      write('imports/dist/generated.rmt', 'state explicitGenerated type number initial 0\n');
      write('imports/generated-user.rmt', 'import "./dist/*.rmt"\n');
      index.build(); const snapshot = index.snapshot();
      const ref = snapshot.references.find(ref => ref.source.uri === uri('imports/app.rmt'));
      assert.equal(ref.status, 'unresolved'); assert.equal(ref.candidates.length, 1);
      assert.equal(index.definitions({ uri: uri('imports/app.rmt'), position: { line: 1, character: 30 } }).length, 0);
      assert.equal(index.definitions({ uri: uri('imports/app.rmt'), position: { line: 0, character: 10 } })[0].uri, uri('imports/dep.rmt'));
      assert(snapshot.relationships.some(edge => edge.kind === 'rmt-import' && edge.to.endsWith('/imports/nested/one.rmt')));
      assert(snapshot.relationships.some(edge => edge.kind === 'rmt-import' && edge.to.endsWith('/imports/dist/generated.rmt')));
      assert(snapshot.symbols.some(symbol => symbol.name === 'explicitGenerated'));
      assert(snapshot.coverage.some(gap => gap.code === 'rmt.vnext.import.cycle'));
      assert(snapshot.coverage.some(gap => gap.code === 'rmt.vnext.import.boundary.violation'));
      const explicitRoots = createProjectIndex({ rootDir: root, importRoots: ['.'], git: false });
      assert.equal(explicitRoots.definitions({ uri: uri('imports/escape.rmt'), position: { line: 0, character: 10 } })[0].uri, uri('other/a.rmt'));
      explicitRoots.dispose();
    });
    check('Physical symlinks cannot escape RMT roots', () => {
      fs.symlinkSync(path.join(root, 'other/a.rmt'), path.join(root, 'imports/link.rmt'));
      write('imports/link-user.rmt', 'import "./link.rmt"\n'); index.build();
      assert(index.snapshot().coverage.some(gap => gap.path === 'imports/link-user.rmt' && gap.code === 'rmt.vnext.import.boundary.violation'));
    });
    check('Legacy and vNext facades reuse the same current analysis', () => {
      const legacy = JSON.stringify({ components: [{ id: 'legacy', tag: 'x-example' }] });
      index.updateDocument({ uri: uri('legacy.rmt'), text: legacy, version: 1 });
      const a = index.getAnalysis(uri('legacy.rmt'));
      assert.deepEqual(a.graph.diagnostics, buildSemanticGraph(a.input).diagnostics);
      assert.deepEqual(getRmtDocumentSymbols(a.input, { graph: a.graph }), getRmtDocumentSymbols(a.input));
      const unicode = JSON.stringify({ meta: '😀', components: [{ id: 'unicode', tag: 'x-example' }] });
      index.updateDocument({ uri: uri('unicode.rmt'), text: unicode, version: 1 });
      assert.equal(index.searchSymbols('unicode')[0].nameLocation.range.start.character, unicode.indexOf('unicode'));
      const b = index.getAnalysis(uri('other/a.rmt'));
      assert.deepEqual(getRmtVNextToolingDocumentSymbols(b.input, { analysis: b.graph }), getRmtVNextToolingDocumentSymbols(b.input));
      const count = index.stats.rmtAnalyses; index.searchSymbols('count'); index.references({ symbolId: index.searchSymbols('count')[0].id }); index.snapshot();
      assert.equal(index.stats.rmtAnalyses, count);
    });
    check('LSP closed documents, workspace roots and rapid updates share the index', () => {
      const server = createRmtLanguageServer({ rootDir: root });
      server.initialize({ workspaceFolders: [{ uri: uri('other') }] });
      assert.equal(server.workspaceSymbols({ query: 'count' }).length, 1);
      server.openDocument({ textDocument: { uri: uri('other/a.rmt'), text: source('buffer'), version: 10, languageId: 'rmt' } });
      server.changeDocument({ textDocument: { uri: uri('other/a.rmt'), version: 9 }, contentChanges: [{ text: source('old') }] });
      assert.equal(server.workspaceSymbols({ query: 'buffer' }).length, 1);
      assert.equal(server.references({ textDocument: { uri: uri('other/a.rmt') }, position: { line: 1, character: 8 }, context: { includeDeclaration: true } }).length, 2);
      server.closeDocument({ textDocument: { uri: uri('other/a.rmt') } });
      assert.equal(server.workspaceSymbols({ query: 'count' }).length, 1);
      write('other/a.rmt', source('external'));
      server.watchedFiles({ changes: [{ uri: uri('other/a.rmt'), type: 2 }] });
      assert.equal(server.workspaceSymbols({ query: 'external' }).length, 1);
      server.workspaceFolders({ event: { removed: [{ uri: uri('other') }], added: [] } });
      assert.equal(server.workspaceSymbols({ query: 'external' }).length, 0);
      const untitled = 'untitled:temporary.rmt';
      server.openDocument({ textDocument: { uri: untitled, text: source('unsaved'), version: 1, languageId: 'rmt' } });
      server.changeDocument({ textDocument: { uri: untitled, version: 2 }, contentChanges: [{ text: source('unsavedCurrent') }] });
      assert.equal(server.workspaceSymbols({ query: 'unsavedCurrent' })[0].location.uri, untitled);
      server.closeDocument({ textDocument: { uri: untitled } });
      assert.equal(server.workspaceSymbols({ query: 'unsavedCurrent' }).length, 0);
      server.projectIndex.dispose();
    });
    check('Repository AST input graph, conditional package exports and static suite IDs', () => {
      write('fixtures/input.json', '{}');
      write('pkg/package.json', JSON.stringify({ name: '@sample/pkg', exports: { '.': { types: './index.d.ts', browser: './browser.js', node: './node.js', default: './fallback.js' } } }));
      for (const file of ['index.d.ts', 'browser.js', 'node.js', 'fallback.js']) write('pkg/' + file, 'export {};');
      write('src/main.ts', 'export * from "@sample/pkg"; import type { T } from "@sample/pkg"; import("./dynamic.js"); import(computed);');
      write('src/dynamic.js', 'export {};');
      write('src/incomplete.ts', 'import { value } from ;');
      write('tests/example_suite.js', 'const fs = require("fs"); const path = require("path"); const INPUT = "fixtures/input.json"; function runExampleSuite({ rootDir }) { fs.readFileSync(path.join(rootDir, INPUT)); fs.readFileSync(dynamicPath); } module.exports = { runExampleSuite };');
      write('scripts/run_xtend_tests.js', 'const { runExampleSuite } = require("../tests/example_suite"); const suites = [{ id: "example", run: () => runExampleSuite({ rootDir }) }, { id: "example-report", run: () => runExampleSuite({ rootDir }) }]; throw new Error("Runner must never execute");');
      const repo = createProjectIndex({ rootDir: root, profile: 'repository', git: false });
      const base = repo.snapshot();
      const rmtParses = repo.stats.rmtAnalyses;
      assert.equal(JSON.stringify(repo.build().snapshot()), JSON.stringify(base));
      assert.equal(repo.stats.rmtAnalyses, rmtParses);
      assert.equal(base.suites.length, 2);
      for (const file of ['index.d.ts', 'browser.js', 'node.js']) assert(base.relationships.some(edge => edge.kind === 'module-import' && edge.to.endsWith('/pkg/' + file)));
      assert(base.coverage.some(gap => gap.code === 'dynamic-import'));
      assert(base.coverage.some(gap => gap.code === 'dynamic-file-input'));
      assert(base.coverage.some(gap => gap.path === 'src/incomplete.ts' && gap.code === 'module-syntax-error'));
      const count = repo.stats.moduleAnalyses;
      write('fixtures/input.json', '{"changed":true}'); repo.refreshDocument(uri('fixtures/input.json'));
      const head = repo.snapshot(); assert.equal(repo.stats.moduleAnalyses, count);
      const impact = computeImpact({ baseSnapshot: base, headSnapshot: head, changedPaths: ['fixtures/input.json'] });
      assert.equal(impact.possibleSuites.length, 2); assert.equal(impact.testSelection, 'not-performed');
      assert(impact.possibleSuites.every(suite => suite.reason.some(edge => edge.kind === 'file-input')));
      assert(impact.possibleDuplicateExecutions.some(group => group.sameArguments));
      const same = computeImpact({ baseSnapshot: base, headSnapshot: base, changedPaths: ['fixtures/input.json'] });
      assert.deepEqual(same.possibleSuites[0].reason[0].snapshots, ['base', 'head']);
      write('tests/example_suite.js', 'module.exports = {};'); repo.refreshDocument(uri('tests/example_suite.js'));
      const deleted = computeImpact({ baseSnapshot: base, headSnapshot: repo.snapshot(), changedPaths: ['fixtures/input.json'] });
      assert.equal(deleted.possibleSuites.length, 2); assert(deleted.possibleSuites.some(suite => suite.reason.some(edge => edge.snapshots.includes('base'))));
      assert.equal(computeImpact({ headSnapshot: head, changedPaths: ['untracked.file'] }).complete, false);
      write('scripts/test-runner/catalog.json', JSON.stringify({ version: 1, suites: [
        { id: 'example', implementations: [{ path: 'tests/example_suite.js', function: 'runExampleSuite', arguments: ['{ rootDir }'] }] },
        { id: 'example-report', aliasOf: 'example', implementations: [{ path: 'tests/example_suite.js', function: 'runExampleSuite', arguments: ['{ rootDir }'] }] }
      ] }));
      const catalogSnapshot = repo.build().snapshot();
      assert.equal(catalogSnapshot.suites.length, 2);
      assert(catalogSnapshot.suites.every(suite => suite.runnerPath === 'scripts/test-runner/catalog.json'));
      assert(catalogSnapshot.relationships.some(edge => edge.role === 'suite-alias' && edge.from.endsWith(':example-report') && edge.to.endsWith(':example')));
      assert(catalogSnapshot.relationships.some(edge => edge.kind === 'suite-implementation' && edge.provenance.provider === 'suite-catalog'));
      repo.dispose();
    });
    check('Package export inventory keeps historical mapping shape and order', () => {
      assert.deepEqual(packageExportMappings(root, [{ path: 'pkg/package.json', text: JSON.stringify({ name: 'pkg', exports: { '.': { types: './index.d.ts', default: './index.js' }, './*': './*.js' } }) }]), [
        { target: 'pkg/index.d.ts', module: 'pkg' }, { target: 'pkg/index.js', module: 'pkg' }, { target: 'pkg/*.js', module: 'pkg/*' }
      ]);
    });
    check('Missing TypeScript preserves RMT and reports incomplete module coverage', () => {
      const providers = require('../../tools/project-index/modules');
      const load = providers.loadTypeScript;
      try {
        providers.loadTypeScript = () => null;
        const partial = createProjectIndex({ rootDir: root, profile: 'repository', git: false });
        assert(partial.searchSymbols('external').length > 0);
        assert(partial.snapshot().coverage.some(gap => gap.code === 'typescript-unavailable'));
        partial.dispose();
      } finally { providers.loadTypeScript = load; }
    });
    check('Shared inventory discovery preserves canonical exports and curated decisions', () => {
      const scanner = require('../../scripts/scan_schema_inventory');
      const discriminator = ['fixture', 'navigation', 'v1'].join('.');
      write('inventory/package.json', JSON.stringify({ name: 'index-fixture', exports: { './report': './report.js' } }));
      write('inventory/report.js', `module.exports = { schema: ${JSON.stringify(discriminator)}, value: 1 };`);
      const scan = scanner.scanSchemaInventory({ rootDir: path.join(root, 'inventory') });
      const entry = scan.entries.find(entry => entry.schemaId === discriminator);
      assert.equal(entry.canonicalDefinition.path, 'report.js');
      assert(JSON.stringify(entry.usages).includes('index-fixture/report'));
      const first = scanner.createInventoryDocument(scan);
      const curated = first.entries.find(entry => entry.schemaId === discriminator);
      curated.description = 'A reviewed fixture contract'; curated.descriptionStatus = 'curated';
      curated.lifecycle = { status: 'deprecated', rollout: 'dual-read' };
      curated.notes = 'Preserve this migration decision';
      const updated = scanner.createInventoryDocument(scan, first).entries.find(entry => entry.schemaId === discriminator);
      assert.equal(updated.description, curated.description); assert.deepEqual(updated.lifecycle, curated.lifecycle); assert.equal(updated.notes, curated.notes);
      assert.deepEqual(updated.canonicalDefinition, entry.canonicalDefinition);
    });
    check('Public project-index types accept navigation and reject invalid arguments', () => {
      const ts = require('typescript');
      const fixture = path.resolve(__dirname, '../types/fixtures/project_index_contract.ts');
      const program = ts.createProgram([fixture], { noEmit: true, strict: true, skipLibCheck: true, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022 });
      const errors = ts.getPreEmitDiagnostics(program);
      assert.equal(errors.length, 0, errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'));
    });
    check('CLI requires root, emits JSON and invalidates opt-in caches', () => {
      let output = '', error = ''; const io = { stdout: { write: text => { output += text; } }, stderr: { write: text => { error += text; } } };
      assert.equal(runProjectIndexCli(['build'], io), 1); assert(error.includes('--root'));
      assert.equal(runProjectIndexCli(['symbols', 'external', '--root', root, '--cache', '--json'], io), 0);
      assert.equal(JSON.parse(output).symbols.filter(symbol => symbol.definition.uri === uri('other/a.rmt')).length, 1); output = '';
      write('other/a.rmt', source('cacheChanged'));
      assert.equal(runProjectIndexCli(['symbols', 'cacheChanged', '--root', root, '--cache', '--json'], io), 0);
      assert.equal(JSON.parse(output).symbols.filter(symbol => symbol.definition.uri === uri('other/a.rmt')).length, 1);
    });
    check('1,000-document measurements and incremental parse reuse', () => {
      const collection = path.join(root, 'collection');
      for (let i = 0; i < 1000; i++) write(`collection/${i}.rmt`, source(`value${i}`));
      const large = createProjectIndex({ rootDir: collection, git: false });
      let t = performance.now(); const before = large.snapshot(); measurements.syntheticColdMs = performance.now() - t;
      assert.equal(before.documents.length, 1000); assert.equal(large.stats.rmtAnalyses, 1000);
      t = performance.now(); for (let i = 0; i < 20; i++) large.searchSymbols(`value${i}`); measurements.syntheticWarm20QueriesMs = performance.now() - t;
      const parses = large.stats.rmtAnalyses;
      t = performance.now(); large.updateDocument({ filePath: path.join(collection, '0.rmt'), text: source('updated'), version: 1 }); large.snapshot(); measurements.syntheticIncrementalMs = performance.now() - t;
      assert.equal(large.stats.rmtAnalyses, parses + 1);
      measurements.syntheticMemoryBytes = process.memoryUsage().heapUsed;
      const cached = large.snapshot(); assert.deepEqual(cached, large.snapshot());
      large.dispose(); assert.throws(() => large.snapshot(), /disposed/);
    });
  } finally { index?.dispose(); fs.rmSync(root, { recursive: true, force: true }); }
  return context.result({ report: { measurements } });
}
function printProjectIndexReport(result) { printSuiteReport(result); }
module.exports = { runProjectIndexSuite, printProjectIndexReport };

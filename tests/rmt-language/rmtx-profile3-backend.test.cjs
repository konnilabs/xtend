'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const classic = require('../../tools/rmt-language/classic-compiler');
const backend = require('../../tools/rmt-language/vnext-compiler');
const { parseRmtClassicSource } = require('../../tools/rmt-language/classic-parser');
const dependencies = require('../../tools/rmt-language/rmtx-selector-dependencies');
const profile = version => ({ syntax: 'rmtx', version });
const source = `state rows type array initial [{ id 1 }, { id "1" }]
state product type object initial { id "parent" }
state product.id type number initial 1
selector picked from state rows { where item.id == state.product.id; output object[] }
selector final from selector picked { where true || contains(item.id, input.query); output object[] }`;
function compile(text = source, version = '3.0.0') {
  const parsed = parseRmtClassicSource({ text, filePath: 'profile3.rmt' });
  assert(parsed.ok, JSON.stringify(parsed.diagnostics));
  const result = classic.compileRmtClassicAstResult(parsed.ast, { sourceModel: parsed.sourceModel, sourceProfile: profile(version) });
  assert(result.ok, JSON.stringify(result.diagnostics));
  return { ...result, sourceProfile: profile(version) };
}

test('source profile3 is additive without altering established Core, plan or factory ports', () => {
  const parsed = parseRmtClassicSource(source);
  for (const compileResult of [classic.compileRmtClassicAstResult, backend.compileRmtVNextAstResult]) {
    const versions = ['1.0.0', '2.0.0', '3.0.0'].map(version => compileResult(parsed.ast, { sourceProfile: profile(version) }));
    assert(versions.every(result => result.ok));
    for (const result of versions.slice(1)) {
      assert.equal(result.coreJson, versions[0].coreJson);
      assert.deepEqual(result.orchestrationArtifacts, versions[0].orchestrationArtifacts);
      assert.deepEqual(Object.keys(result), Object.keys(versions[0]));
    }
  }
  assert.equal(classic.RMT_CLASSIC_COMPILER_API_VERSION, '4.5.0');
  assert.equal(backend.RMT_VNEXT_COMPILER_API_VERSION, '1.6.0');
  for (const factory of [classic.createRmtClassicCompiler, backend.createRmtVNextCompiler]) {
    const original = factory(), selected = factory({ sourceProfile: profile('3.0.0') });
    assert.deepEqual(Object.keys(selected), Object.keys(original));
    assert.equal(Object.hasOwn(selected, 'compileAstResult'), false);
    assert.equal(selected.compileAst(parsed.ast).manifest.sourceSyntax, 'rmt-vnext');
    assert.equal(selected.compileSource(source).coreDocument.manifest.sourceSyntax, 'rmt-vnext');
  }
});

test('profile3 preserves strict plain metadata validation without running accessors', () => {
  const ast = parseRmtClassicSource(source).ast;
  let reads = 0;
  const accessor = Object.defineProperty({ syntax: 'rmtx' }, 'version', { enumerable: true, get() { reads++; return '3.0.0'; } });
  const hidden = Object.defineProperty({ syntax: 'rmtx' }, 'version', { value: '3.0.0', enumerable: false });
  for (const sourceProfile of [accessor, hidden, { ...profile('3.0.0'), extra: true },
    Object.assign(Object.create({ inherited: true }), profile('3.0.0')),
    { ...profile('3.0.0'), [Symbol('extra')]: true }, profile('5.0.0')]) {
    for (const run of [classic.compileRmtClassicAstResult, backend.compileRmtVNextAstResult])
      assert.throws(() => run(ast, { sourceProfile }), { code: 'rmt.compiler.source-profile.unsupported' });
  }
  assert.equal(reads, 0);
  assert(classic.compileRmtClassicAstResult(ast, { sourceProfile: Object.assign(Object.create(null), profile('3.0.0')) }).ok);
});

test('profile3 emits a distinct dependency contract while profile2 retains its complete v1 data', () => {
  const old = dependencies.createRmtxSelectorDependencyReport(compile(source, '2.0.0'));
  const current = dependencies.createRmtxSelectorDependencyReport(compile());
  assert.equal(dependencies.RMTX_SELECTOR_DEPENDENCIES_SCHEMA, 'xtend.rmtx.selector-dependencies.v1');
  assert.equal(dependencies.RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2, 'xtend.rmtx.selector-dependencies.v2');
  assert.equal(old.schema, dependencies.RMTX_SELECTOR_DEPENDENCIES_SCHEMA);
  assert.deepEqual(old.sourceProfile, profile('2.0.0'));
  assert.equal(current.schema, dependencies.RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2);
  assert.deepEqual(current.sourceProfile, profile('3.0.0'));
  assert.equal(JSON.stringify(old), JSON.stringify({ ...current, schema: old.schema, sourceProfile: old.sourceProfile }));
  assert.deepEqual(current.selectors[0].stateReads, [
    { symbol: 'product.id', path: [], reference: 'state.product.id' },
    { symbol: 'rows', path: [], reference: 'state.rows' }
  ]);
  assert.deepEqual(current.selectors[1].parameterPaths, [['query']]);
  assert(Object.isFrozen(current.selectors[0].stateReads[0].path));
  for (const key of ['incrementalRecomputation', 'runtimeTracking', 'parametersForwardedToDependencies']) assert.equal(current[key], false);
});

test('profile3 dependency reports retain empty programs, validation failures and metadata precedence', () => {
  const empty = dependencies.createRmtxSelectorDependencyReport(compile('template empty {}'));
  assert.deepEqual(empty.topologicalOrder, []); assert.deepEqual(empty.selectors, []);
  const result = compile();
  const { sourceProfile, ...withoutProfile } = result;
  const viaParser = { ...withoutProfile, parserResult: { ...result.parserResult, sourceProfile } };
  assert.deepEqual(dependencies.createRmtxSelectorDependencyReport(viaParser), dependencies.createRmtxSelectorDependencyReport(result));
  assert.equal(dependencies.createRmtxSelectorDependencyReport({ ...viaParser, sourceProfile: profile('2.0.0') }).schema,
    dependencies.RMTX_SELECTOR_DEPENDENCIES_SCHEMA);
  for (const candidate of [{ ...result, ok: false }, { ...result, sourceProfile: profile('5.0.0') },
    { ...result, primitiveSemanticGraph: null }, { ...result, orchestrationArtifacts: null }])
    assert.throws(() => dependencies.createRmtxSelectorDependencyReport(candidate), { code: 'rmtx.selector-dependencies.invalid' });
});

test('unchanged compiled event guards read live Model values and fail closed for unavailable paths', async () => {
  const { createRmtEventRoutingRuntime } = await import('../../xtendrmt/rmt-event-routing-runtime.js');
  const { createRmtStateSelectorRuntime } = await import('../../xtendrmt/rmt-state-selector-runtime.js');
  for (const [expression, expected] of [['state.app.ready == true', 'success'], ['state.missing.ready == true', 'skipped']]) {
    const result = compile(`state app type object initial {ready true}
action save { input id string; reduce state.app.ready = false }
surface panel kind region component div {
 lane visible { mount panel }
 on click "div" -> action save when ${expression} { payload id from detail.id }
}`);
    const model = createRmtStateSelectorRuntime(result.orchestrationArtifacts.state);
    const binding = result.orchestrationArtifacts.events[0], commands = [];
    const router = createRmtEventRoutingRuntime({ events: [binding], modelReader: model.modelReader,
      commandRuntime: { dispatchCommand(command) { commands.push(command); return { status: 'success' }; } } });
    try {
      assert.deepEqual(binding.condition, result.coreDocument.events[0].condition);
      assert.equal((await router.routeEvent(binding.id, { detail: { id: 'row' } })).status, expected);
      model.modelCommandPort.apply({ operation: 'set', state: 'app', value: { ready: false } });
      assert.equal((await router.routeEvent(binding.id, { detail: { id: 'row' } })).status, 'skipped');
      assert.equal(commands.length, expected === 'success' ? 1 : 0);
    } finally { router.dispose(); }
  }
});

test('new backend/dependency types discriminate profile3 without widening legacy interfaces', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-profile3-backend-'));
  try {
    const root = path.resolve(__dirname, '../..').replaceAll('\\', '/'), file = path.join(temporary, 'consumer.ts');
    fs.writeFileSync(file, `import {compileRmtClassicAstResult, type RmtClassicAst, type RmtClassicAstResultOptions, type RmtClassicAstResultOptionsV2, type RmtClassicAstResultOptionsV3} from '${root}/tools/rmt-language/classic-compiler';
import {compileRmtVNextAstResult, type RmtCompilerSourceProfile, type RmtCompilerSourceProfileV2, type RmtCompilerSourceProfileV3, type RmtVNextAstResultOptionsV3} from '${root}/tools/rmt-language/vnext-compiler';
import {createRmtxSelectorDependencyReport, type RmtxSelectorDependencyReport, type RmtxSelectorDependencyReportV2} from '${root}/tools/rmt-language/rmtx-selector-dependencies';
const v1:RmtCompilerSourceProfile={syntax:'rmtx',version:'1.0.0'};
const v2:RmtCompilerSourceProfileV2={syntax:'rmtx',version:'2.0.0'};
const v3:RmtCompilerSourceProfileV3={syntax:'rmtx',version:'3.0.0'};
const old:RmtClassicAstResultOptions={sourceProfile:v1};
const previous:RmtClassicAstResultOptionsV2={sourceProfile:v2};
const current:RmtClassicAstResultOptionsV3={sourceProfile:v3};
const backend:RmtVNextAstResultOptionsV3=current;
// @ts-expect-error legacy profile1 is not widened
const bad1:RmtCompilerSourceProfile=v3;
// @ts-expect-error legacy profile2 is not widened
const bad2:RmtCompilerSourceProfileV2=v3;
// @ts-expect-error legacy AST options are not widened
const badOptions:RmtClassicAstResultOptions=current;
const ast={} as RmtClassicAst;
compileRmtClassicAstResult(ast,old);compileRmtClassicAstResult(ast,previous);compileRmtClassicAstResult(ast,current);
compileRmtClassicAstResult(ast,Math.random()?old:current);compileRmtVNextAstResult(ast,backend);
compileRmtVNextAstResult(ast,Math.random()?old:current);
const legacyReport:RmtxSelectorDependencyReport=createRmtxSelectorDependencyReport({sourceProfile:v2});
const newReport:RmtxSelectorDependencyReportV2=createRmtxSelectorDependencyReport({sourceProfile:v3});
const parserReport:RmtxSelectorDependencyReportV2=createRmtxSelectorDependencyReport({parserResult:{sourceProfile:v3}});
const withMetadata:RmtxSelectorDependencyReportV2=createRmtxSelectorDependencyReport({sourceProfile:v3,ok:true,parserResult:{sourceProfile:v3}});
const metadataWins:RmtxSelectorDependencyReport=createRmtxSelectorDependencyReport({sourceProfile:v2,parserResult:{sourceProfile:v3}});
const union=createRmtxSelectorDependencyReport({sourceProfile:Math.random()?v2:v3});
if(union.schema==='xtend.rmtx.selector-dependencies.v2'){const selected:'3.0.0'=union.sourceProfile.version;void selected;}
// @ts-expect-error existing report type remains profile2/schema1
const notLegacy:RmtxSelectorDependencyReport=newReport;
// @ts-expect-error new report is immutable
newReport.selectors.push({});
// @ts-expect-error unknown future versions are rejected
compileRmtClassicAstResult(ast,{sourceProfile:{syntax:'rmtx',version:'5.0.0'}});
void [bad1,bad2,badOptions,legacyReport,newReport,parserReport,withMetadata,metadataWins,notLegacy];
`);
    const ts = require('typescript'), program = ts.createProgram([file], { noEmit: true, strict: true, skipLibCheck: false, types: [],
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10 });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => temporary,
      getCanonicalFileName: file => file, getNewLine: () => '\n' }));
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

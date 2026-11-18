'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { parseRmtClassicSource } = require('../../tools/rmt-language/classic-parser');
const classic = require('../../tools/rmt-language/classic-compiler');
const backend = require('../../tools/rmt-language/vnext-compiler');
const { createRmtxSelectorDependencyReport: report, RMTX_SELECTOR_DEPENDENCIES_SCHEMA } = require('../../tools/rmt-language/rmtx-selector-dependencies');
const profile = Object.freeze({ syntax: 'rmtx', version: '2.0.0' });
const legacyProfile = Object.freeze({ syntax: 'rmtx', version: '1.0.0' });
function compile(text, sourceProfile = profile) {
  const parsed = parseRmtClassicSource({ text, filePath: 'dependencies.rmt' });
  assert(parsed.ok, JSON.stringify(parsed.diagnostics));
  const result = classic.compileRmtClassicAstResult(parsed.ast, { sourceModel: parsed.sourceModel, sourceProfile });
  assert(result.ok, JSON.stringify(result.diagnostics));
  return { ...result, sourceProfile };
}
const source = `
state rows type array initial []
state product type object initial { id 0; title "wanted" }
state product.id type number initial 2
selector final from selector first {
  where item.id == state.product.id
  where false && contains(item.label, state.product.title)
  where selector.product.id.id == record.id
  where contains(item.label, input.query)
  where input.id == item.id
  where "state.ghost" != "$params.ghost"
  sort by item.name asc
  output object[]
}
selector first from state rows { where item.kind == "image"; output object[] }
selector product from state rows { output object[] }
selector product.id from state rows { find item.id == 2; output object }
`;

test('the new source profile is additive and retains both existing factory forms', () => {
  const parsed = parseRmtClassicSource({ text: 'state value type number initial 0' });
  assert.equal(classic.RMT_CLASSIC_COMPILER_API_VERSION,'4.6.0');
  assert.equal(backend.RMT_VNEXT_COMPILER_API_VERSION,'1.7.0');
  for (const compileResult of [classic.compileRmtClassicAstResult, backend.compileRmtVNextAstResult]) {
    const current = compileResult(parsed.ast,{sourceProfile:profile});
    const legacy = compileResult(parsed.ast,{sourceProfile:legacyProfile});
    assert.equal(current.ok,true);assert.equal(legacy.ok,true);
    assert.equal(current.coreDocument.manifest.sourceSyntax,'rmtx');
    assert.equal(current.coreDocument.appPlatform.sourceSyntax,'rmtx');
    assert.equal(current.orchestrationArtifacts.sourceSyntax,'rmtx');
    assert.equal(current.coreJson,legacy.coreJson);
  }
  for (const compiler of [classic.createRmtClassicCompiler({sourceProfile:profile}),backend.createRmtVNextCompiler({sourceProfile:profile})]) {
    assert.equal(Object.hasOwn(compiler,'compileAstResult'),false);
    assert.equal(compiler.compileAst(parsed.ast).manifest.sourceSyntax,'rmt-vnext');
  }
  assert.equal(classic.compileRmtClassicSource('state value type number initial 0',{sourceProfile:profile}).coreDocument.manifest.sourceSyntax,'rmt-vnext');
});

test('only explicit source versions are accepted without executing profile accessors', () => {
  const ast = parseRmtClassicSource({text:'state value type number initial 0'}).ast;
  let accessed = false;
  const accessor = Object.defineProperty({syntax:'rmtx'},'version',{enumerable:true,get(){accessed=true;return '2.0.0';}});
  for (const sourceProfile of [null,{},[],{syntax:'tsx',version:'2.0.0'},{syntax:'rmtx',version:'6.0.0'},{...profile,extra:true},accessor]) {
    assert.throws(()=>classic.compileRmtClassicAstResult(ast,{sourceProfile}),{code:'rmt.compiler.source-profile.unsupported'});
  }
  assert.equal(accessed,false);
});

test('dependency owners come from semantic facts and use the longest declared symbol prefix', () => {
  const result = compile(source), value = report(result);
  const selected = value.selectors.find(entry=>entry.id==='final');
  assert.equal(value.schema,RMTX_SELECTOR_DEPENDENCIES_SCHEMA);
  assert.deepEqual(selected.source,{kind:'selector',symbol:'first'});
  assert.deepEqual(selected.stateReads,[
    {symbol:'product',path:['title'],reference:'state.product.title'},
    {symbol:'product.id',path:[],reference:'state.product.id'}
  ]);
  assert.deepEqual(selected.selectorReads,[
    {symbol:'first',path:[],reference:'selector.first'},
    {symbol:'product.id',path:['id'],reference:'selector.product.id.id'}
  ]);
  assert(!selected.selectorReads.some(read=>read.symbol==='product'));
});

test('all static branches are included while literal reference-looking strings are excluded', () => {
  const selected = report(compile(source)).selectors.find(entry=>entry.id==='final');
  assert(selected.stateReads.some(read=>read.symbol==='product' && read.path.join('.')==='title'));
  assert.deepEqual(selected.rowPaths,[['id'],['label'],['name']]);
  assert.deepEqual(selected.parameterPaths,[['id'],['query']]);
  assert(!JSON.stringify(selected).includes('ghost'));
});

test('the actual compiled plan determines topological order and transitive State reads', () => {
  const result=compile(source), value=report(result), selected=value.selectors.find(entry=>entry.id==='final');
  assert.deepEqual(value.topologicalOrder,result.orchestrationArtifacts.state.selectors.map(entry=>entry.id));
  for(const read of selected.selectorReads) assert(value.topologicalOrder.indexOf(read.symbol)<value.topologicalOrder.indexOf('final'));
  assert.deepEqual(selected.transitiveStateReads,[
    {symbol:'product',path:['title'],reference:'state.product.title'},
    {symbol:'product.id',path:[],reference:'state.product.id'},
    {symbol:'rows',path:[],reference:'state.rows'}
  ]);
  assert.equal(value.incrementalRecomputation,false);assert.equal(value.runtimeTracking,false);
});

test('whole row and whole parameter reads retain an empty segment list', () => {
  const value=report(compile('state rows type array initial []\nselector itemValue from state rows { where item == input; output object[] }'));
  assert.deepEqual(value.selectors[0].rowPaths,[[]]);
  assert.deepEqual(value.selectors[0].parameterPaths,[[]]);
  assert.deepEqual(value.selectors[0].stateReads,[{symbol:'rows',path:[],reference:'state.rows'}]);
});

test('parameter metadata does not pretend that runtime arguments flow to dependent selectors', async () => {
  const result=compile(`state rows type array initial [{ id "a" }, { id "b" }]
selector parent from state rows { where item.id == input.id; output object[] }
selector child from selector parent { where true; output object[] }`);
  const value=report(result);
  assert.equal(value.parametersForwardedToDependencies,false);
  assert.deepEqual(value.selectors.find(entry=>entry.id==='parent').parameterPaths,[['id']]);
  assert.deepEqual(value.selectors.find(entry=>entry.id==='child').parameterPaths,[]);
  const {createRmtStateSelectorRuntime}=await import('../../xtendrmt/rmt-state-selector-runtime.js');
  const runtime=createRmtStateSelectorRuntime(result.orchestrationArtifacts.state);
  assert.deepEqual(runtime.modelReader.select('parent',{id:'b'}),[{id:'b'}]);
  assert.deepEqual(runtime.modelReader.select('child',{id:'b'}),[]);
});

test('dependency summaries are deterministic and frozen without changing compile results', () => {
  const result=compile(source), before=JSON.stringify(result.orchestrationArtifacts);
  const left=report(result), right=report(result);
  assert.equal(JSON.stringify(left),JSON.stringify(right));
  assert.equal(JSON.stringify(result.orchestrationArtifacts),before);
  assert(Object.isFrozen(left));assert(Object.isFrozen(left.selectors));
  assert(Object.isFrozen(left.selectors[0].transitiveStateReads));
});

test('invalid or incomplete results never become a successful dependency report', () => {
  const result=compile(source);
  for(const candidate of [null,{}, {...result,ok:false}, {...result,sourceProfile:legacyProfile},
    {...result,primitiveSemanticGraph:null}, {...result,orchestrationArtifacts:null},
    {...result,primitiveSemanticGraph:{references:{records:[]}}}]) {
    assert.throws(()=>report(candidate),{code:'rmtx.selector-dependencies.invalid'});
  }
  const reverse={...result,orchestrationArtifacts:{...result.orchestrationArtifacts,state:{...result.orchestrationArtifacts.state,selectors:result.orchestrationArtifacts.state.selectors.slice().reverse()}}};
  assert.throws(()=>report(reverse),{code:'rmtx.selector-dependencies.invalid'});
});

test('an empty successful profile has an empty dependency order', () => {
  assert.deepEqual(report(compile('template empty {}')).topologicalOrder,[]);
});

test('legacy source-profile option types remain v1 while separate overloads accept v2', () => {
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-rmtx-dependency-types-'));
  try {
    const root=path.resolve(__dirname,'../..').replaceAll('\\','/'), file=path.join(temporary,'consumer.ts');
    fs.writeFileSync(file,`import { compileRmtClassicAstResult, type RmtClassicAstResultOptions, type RmtClassicAstResultOptionsV2, type RmtClassicAst } from '${root}/tools/rmt-language/classic-compiler';
import { compileRmtVNextAstResult, type RmtVNextAstResultOptions, type RmtVNextAstResultOptionsV2, type RmtCompilerSourceProfile, type RmtCompilerSourceProfileV2 } from '${root}/tools/rmt-language/vnext-compiler';
import { createRmtxSelectorDependencyReport } from '${root}/tools/rmt-language/rmtx-selector-dependencies';
const legacy: RmtCompilerSourceProfile={syntax:'rmtx',version:'1.0.0'};
const current: RmtCompilerSourceProfileV2={syntax:'rmtx',version:'2.0.0'};
// @ts-expect-error legacy source type does not silently widen
const notLegacy:RmtCompilerSourceProfile=current;
const left:RmtClassicAstResultOptions={sourceProfile:legacy};
const right:RmtClassicAstResultOptionsV2={sourceProfile:current};
const oldBackend:RmtVNextAstResultOptions={sourceProfile:legacy};
const newBackend:RmtVNextAstResultOptionsV2={sourceProfile:current};
const ast={} as RmtClassicAst;
compileRmtClassicAstResult(ast,left);compileRmtClassicAstResult(ast,right);
compileRmtClassicAstResult(ast,Math.random()?left:right);
compileRmtVNextAstResult(ast,oldBackend);compileRmtVNextAstResult(ast,newBackend);
compileRmtVNextAstResult(ast,Math.random()?oldBackend:newBackend);
// @ts-expect-error unknown profiles stay rejected
compileRmtClassicAstResult(ast,{sourceProfile:{syntax:'rmtx',version:'6.0.0'}});
const report=createRmtxSelectorDependencyReport({});
const tracking:false=report.runtimeTracking;
// @ts-expect-error report is readonly
report.topologicalOrder.push('invented');
void [notLegacy,tracking];
`);
    const ts=require('typescript');assert.equal(ts.version,'5.9.3');
    const program=ts.createProgram([file],{noEmit:true,strict:true,skipLibCheck:true,types:[],target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10});
    const diagnostics=ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>temporary,getCanonicalFileName:file=>file,getNewLine:()=> '\n'}));
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

test('RMTX public types retain default v1 results and discriminate explicit v2 results and factories', () => {
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-rmtx-profile-types-'));
  try {
    const root=path.resolve(__dirname,'../..').replaceAll('\\','/'), file=path.join(temporary,'consumer.ts');
    fs.writeFileSync(file,`import { parseRmtxSource, getRmtxOperatorProfile, RMTX_PARSER_API_VERSION, RMTX_PARSER_SCHEMA, RMTX_PARSER_SCHEMA_V2, RMTX_SOURCE_PROFILE, RMTX_SELECTOR_SOURCE_PROFILE, type RmtxParserOptions, type RmtxParserOptionsV2, type RmtxParseResult, type RmtxParseResultV2 } from '${root}/tools/rmt-language/rmtx-parser';
import { compileRmtxSource, createRmtxCompiler, RMTX_COMPILER_API_VERSION, RMTX_COMPILE_RESULT_SCHEMA, RMTX_COMPILE_RESULT_SCHEMA_V2, type RmtxCompilerOptions, type RmtxCompilerOptionsV2, type RmtxCompileResult, type RmtxCompileResultV2, type RmtxCompiler, type RmtxCompilerV2 } from '${root}/tools/rmt-language/rmtx-compiler';
const moduleParser:'5.0.0'=RMTX_PARSER_API_VERSION;
const moduleCompiler:'5.0.0'=RMTX_COMPILER_API_VERSION;
const legacy: RmtxParserOptions={syntaxVersion:'1.0.0'};
const selected:RmtxParserOptionsV2={syntaxVersion:'2.0.0'};
// @ts-expect-error the existing option type stays v1
const notLegacy:RmtxParserOptions=selected;
const parsed:RmtxParseResult=parseRmtxSource('');
const parsedV2:RmtxParseResultV2=parseRmtxSource('',selected);
const oldParserApi:'1.0.0'=parsed.apiVersion;
const newParserApi:'2.0.0'=parsedV2.apiVersion;
const oldParserSchema:'xtend.rmtx.parser-result.v1'=RMTX_PARSER_SCHEMA;
const newParserSchema:'xtend.rmtx.parser-result.v2'=RMTX_PARSER_SCHEMA_V2;
const oldSource:'1.0.0'=RMTX_SOURCE_PROFILE.version;
const newSource:'2.0.0'=RMTX_SELECTOR_SOURCE_PROFILE.version;
const selectedParserOptions:RmtxParserOptions|RmtxParserOptionsV2|undefined=Math.random()?selected:undefined;
const parsedUnion=parseRmtxSource('',selectedParserOptions);
if(parsedUnion.schema===RMTX_PARSER_SCHEMA_V2){const v:'2.0.0'=parsedUnion.sourceProfile.version;void v;}
else {const v:'1.0.0'=parsedUnion.sourceProfile.version;void v;}
const options:RmtxCompilerOptions={syntaxVersion:'1.0.0'};
const optionsV2:RmtxCompilerOptionsV2={syntaxVersion:'2.0.0'};
// @ts-expect-error existing compiler options stay v1
const notCompilerLegacy:RmtxCompilerOptions=optionsV2;
const compiled:RmtxCompileResult=compileRmtxSource('');
const compiledV2:RmtxCompileResultV2=compileRmtxSource('',optionsV2);
const oldCompilerApi:'1.0.0'=compiled.apiVersion;
const newCompilerApi:'2.0.0'=compiledV2.apiVersion;
const oldCompilerSchema:'xtend.rmtx.compile-result.v1'=RMTX_COMPILE_RESULT_SCHEMA;
const newCompilerSchema:'xtend.rmtx.compile-result.v2'=RMTX_COMPILE_RESULT_SCHEMA_V2;
const selectedCompilerOptions:RmtxCompilerOptions|RmtxCompilerOptionsV2|undefined=Math.random()?optionsV2:undefined;
const compiledUnion=compileRmtxSource('',selectedCompilerOptions);
if(compiledUnion.schema===RMTX_COMPILE_RESULT_SCHEMA_V2){const d=compiledUnion.selectorDependencies;const v:'2.0.0'=compiledUnion.parserResult.sourceProfile.version;void [d,v];}
else {const v:'1.0.0'=compiledUnion.parserResult.sourceProfile.version;void v;}
const oldFactory:Readonly<RmtxCompiler>=createRmtxCompiler();
const newFactory:Readonly<RmtxCompilerV2>=createRmtxCompiler(optionsV2);
const oldFactoryApi:'1.0.0'=oldFactory.apiVersion;
const newFactoryApi:'2.0.0'=newFactory.apiVersion;
const oldCompiled:RmtxCompileResult=oldFactory.compileSource('');
const newCompiled:RmtxCompileResultV2=newFactory.compileSource('');
const explicitLegacy:RmtxCompileResult=newFactory.compileSource('',{syntaxVersion:'1.0.0'});
// @ts-expect-error the complete legacy factory port remains v1
oldFactory.compileSource('',optionsV2);
const profileVersion:'2.0.0'=getRmtxOperatorProfile('2.0.0').syntaxVersion;
const defaultVersion:'1.0.0'=getRmtxOperatorProfile().syntaxVersion;
void [notLegacy,notCompilerLegacy,moduleParser,moduleCompiler,oldParserApi,newParserApi,oldParserSchema,newParserSchema,oldSource,newSource,oldCompilerApi,newCompilerApi,oldCompilerSchema,newCompilerSchema,oldFactoryApi,newFactoryApi,oldCompiled,newCompiled,explicitLegacy,profileVersion,defaultVersion];
`);
    const ts=require('typescript');
    const program=ts.createProgram([file],{noEmit:true,strict:true,skipLibCheck:true,types:[],target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10});
    const diagnostics=ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>temporary,getCanonicalFileName:file=>file,getNewLine:()=> '\n'}));
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

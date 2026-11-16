'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { parseRmtxSource, RMTX_PARSER_SCHEMA } = require('../../tools/rmt-language/rmtx-parser');
const { compileRmtxSource, createRmtxCompiler, RMTX_COMPILE_RESULT_SCHEMA } = require('../../tools/rmt-language/rmtx-compiler');
const { compileRmtClassicSource } = require('../../tools/rmt-language/classic-compiler');
const dir = path.resolve(__dirname, '../../development/rmtx-a06/frontend');
const source = fs.readFileSync(path.join(dir, 'two-host.rmtx'), 'utf8');
const prefix = `import { RMT, model, input } from '@ccslabs/xtend/rmt-language/rmtx';\nexport default `;
const program = body => prefix + `<RMT.Program id="test">${body}</RMT.Program>;`;
const compile = text => compileRmtxSource({ text, filePath: 'test.rmtx' });
function noArtifacts(result) {
  assert.equal(result.ok, false);
  for (const key of ['coreDocument', 'coreJson', 'orchestrationArtifacts', 'appServiceDemands', 'primitiveArtifacts']) assert.equal(result[key], null, key);
  assert(result.diagnostics.length > 0);
  assert(result.diagnostics.every(d => d.source === 'rmtx' && d.range));
}
function semantic(value) {
  if (Array.isArray(value)) return value.map(semantic);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['sourceMap','sourceSyntax'].includes(key)).map(([k,v]) => [k,semantic(v)]));
  return value;
}

test('the productive frontend lowers the complete reference through the same compiler and plans', () => {
  const rmtx = compileRmtxSource({ text: source, filePath: path.join(dir, 'two-host.rmtx') });
  const classic = compileRmtClassicSource({ text: fs.readFileSync(path.join(dir,'two-host.rmt'),'utf8'), filePath: path.join(dir,'two-host.rmt') });
  assert.equal(rmtx.ok, true, JSON.stringify(rmtx.diagnostics)); assert.equal(classic.ok,true);
  assert.equal(rmtx.schema, RMTX_COMPILE_RESULT_SCHEMA); assert.equal(rmtx.parserResult.schema, RMTX_PARSER_SCHEMA);
  assert.equal(rmtx.coreDocument.manifest.sourceSyntax, 'rmtx');
  assert.equal(rmtx.coreDocument.appPlatform.sourceSyntax, 'rmtx');
  assert.equal(rmtx.orchestrationArtifacts.sourceSyntax, 'rmtx');
  assert.deepEqual(semantic(rmtx.coreDocument), semantic(classic.coreDocument));
  assert.deepEqual(semantic(rmtx.orchestrationArtifacts), semantic(classic.orchestrationArtifacts));
  assert.equal(rmtx.parserResult.sourceModel.languageId,'rmtx');
  assert(rmtx.coreDocument.sourceMap.every(item => item.range && item.range.endOffset <= source.length));
});

test('namespace and model/input aliases resolve from canonical imports rather than tag spelling', () => {
  const text = `import { RMT as O, input as arg } from '@ccslabs/xtend-compiler/rmt-language/rmtx';
export default <O.Program id="alias"><O.State id="value" type="number" initial={0}/><O.Action id="change"><O.Input name="next" type="number"/><O.Reduce state="value" value={arg.next}/></O.Action></O.Program>;`;
  assert.equal(compile(text).ok,true);
  noArtifacts(compile(text.replace('<O.State','<RMT.State')));
  noArtifacts(compile(text.replace('@ccslabs/xtend-compiler/rmt-language/rmtx','./pretend')));
});

test('JSON literal values preserve strings, nested values, falsy scalars and source string escapes', () => {
  const r = compile(program(`<RMT.State id="data" type="object" initial={{ a: 0, b: false, c: null, d: ['x', -2], e: { word: '\\u003c' } }} />`));
  assert.equal(r.ok,true,JSON.stringify(r.diagnostics));
  assert.deepEqual(r.orchestrationArtifacts.state.states[0].initial,{a:0,b:false,c:null,d:['x',-2],e:{word:'<'}});
  const reducer = compile(program(`<RMT.State id="value" type="string" initial="before"/><RMT.Action id="change"><RMT.Reduce state="value" value="input.text"/></RMT.Action>`));
  assert.equal(reducer.ok,true);
  assert.equal(reducer.orchestrationArtifacts.actions.actions[0].reducers[0].valueKind,'literal');
});

test('JSX string entities are explicit and unsupported entities cannot silently change values', () => {
  const r = compile(program(`<RMT.State id="text" type="string" initial="A&amp;B&#x21;"/>`));
  assert.equal(r.ok,true); assert.equal(r.orchestrationArtifacts.state.states[0].initial,'A&B!');
  noArtifacts(compile(program(`<RMT.State id="text" type="string" initial="&unknown;"/>`)));
});

const denied = [
  ['source statements', `const stolen = globalThis.__rmtxExecuted = true;\n${program('')}`],
  ['call expression', program(`<RMT.State id="value" type="number" initial={globalThis.__rmtxExecuted = true}/>`)],
  ['IIFE', program(`<RMT.State id="value" type="number" initial={(()=>{globalThis.__rmtxExecuted=true;return 0})()}/>`)],
  ['dynamic import', program(`<RMT.State id="value" type="object" initial={import('not-allowed')}/>`)],
  ['spread attributes', program(`<RMT.State {...attrs} id="value" type="number" initial={0}/>`)],
  ['duplicate attributes', program(`<RMT.State id="a" id="b" type="number" initial={0}/>`)],
  ['unknown attributes', program(`<RMT.State id="a" type="number" initial={0} extra="ignored"/>`)],
  ['unknown operators', program(`<RMT.NotAnOperator/>`)],
  ['unqualified UI', program(`<div/>`)],
  ['native text', program(`ignored text`)],
  ['function children', program(`{[1].map(x=><RMT.State id="a" type="number" initial={x}/>)}`)],
  ['type arguments', program(`<RMT.State<any> id="a" type="number" initial={0}/>`)],
  ['computed fields', program(`<RMT.State id="data" type="object" initial={{[model.key]: 0}}/>`)],
  ['object accessors', program(`<RMT.State id="data" type="object" initial={{get a(){return 1}}}/>`)],
  ['duplicate fields', program(`<RMT.State id="data" type="object" initial={{a:1,a:2}}/>`)],
  ['unsafe field', program(`<RMT.State id="data" type="object" initial={{__proto__:0}}/>`)],
  ['unsafe path', program(`<RMT.State id="a" type="number" initial={0}/><RMT.Action id="b"><RMT.Reduce state="a" value={model.constructor}/></RMT.Action>`)],
  ['optional path', program(`<RMT.State id="a" type="number" initial={0}/><RMT.Action id="b"><RMT.Reduce state="a" value={model?.a}/></RMT.Action>`)],
  ['computed path', program(`<RMT.State id="a" type="number" initial={0}/><RMT.Action id="b"><RMT.Reduce state="a" value={model['a']}/></RMT.Action>`)],
  ['nonfinite literal', program(`<RMT.State id="a" type="number" initial={1e999}/>`)],
  ['sparse array', program(`<RMT.State id="a" type="array" initial={[1,,2]}/>`)],
  ['illegal context', program(`<RMT.Input name="x" type="number"/>`)],
  ['unknown reference', program(`<RMT.Action id="bad"><RMT.Reduce state="missing" value={0}/></RMT.Action>`)],
  ['unknown input', program(`<RMT.State id="a" type="number" initial={0}/><RMT.Action id="bad"><RMT.Reduce state="a" value={input.missing}/></RMT.Action>`)],
  ['malformed JSX', prefix + '<RMT.Program id="bad"><RMT.State/></Different>'],
];
for (const [name,text] of denied) test(`closed profile rejects ${name} before producing executable artifacts`, () => {
  delete globalThis.__rmtxExecuted;
  noArtifacts(compile(text)); assert.equal(globalThis.__rmtxExecuted,undefined);
});

test('unsupported syntax versions and source extensions fail explicitly', () => {
  noArtifacts(compileRmtxSource({text:program(''),filePath:'wrong.tsx'}));
  noArtifacts(compileRmtxSource({text:program(''),filePath:'wrong.rmtx?fake.tsx'}));
  noArtifacts(compileRmtxSource({text:program(''),filePath:'right.rmtx'},{syntaxVersion:'3.0.0'}));
  assert.equal(parseRmtxSource(program('')).ok,true);
  assert.equal(compileRmtxSource(program('')).ok,true);
});

test('diagnostics retain RMTX URI and point at the offending original expression', () => {
  const text=program('\n<RMT.State id="a" type="number" initial={doNotRun()}/>\n');
  const r=compileRmtxSource({text,uri:'file:///example/source.rmtx'}); noArtifacts(r);
  const d=r.diagnostics[0]; assert.equal(d.uri,'file:///example/source.rmtx');
  assert.equal(text.slice(d.range.startOffset,d.range.endOffset),'doNotRun()');
});

test('factory defaults preserve frontend profile and unsupported authoring runtime execution fails', () => {
  const factory=createRmtxCompiler({syntaxVersion:'1.0.0'});
  assert.equal(factory.apiVersion,'1.0.0'); assert.equal(factory.compileSource(program('')).ok,true);
  noArtifacts(factory.compileSource(program(''),{syntaxVersion:'future'}));
  assert.throws(()=>require('../../tools/rmt-language/rmtx').RMT.Program({}),/must be compiled/);
});

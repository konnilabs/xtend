'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const profiles = require('../../tools/rmt-language/rmtx-operator-profiles');
const authoring = require('../../tools/rmt-language/rmtx');
const oldNames = ['Program','State','Action','Input','Reduce','Portal','Surface','Lane','Mount'];

function frozenData(value) {
  if (!value || typeof value !== 'object') { assert.notEqual(typeof value,'function'); return; }
  assert(Object.isFrozen(value));
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    assert(Object.hasOwn(descriptor,'value'));
    frozenData(descriptor.value);
  }
}

test('default v1 contract retains exactly the original operators, imports and expression scopes', () => {
  const profile = profiles.getRmtxOperatorProfile();
  assert.equal(profile.schema,'xtend.rmtx.operator-profile.v1');
  assert.equal(profile.syntaxVersion,'1.0.0');
  assert.deepEqual(Object.keys(profile.operators),oldNames);
  assert.deepEqual(profile.imports,['RMT','model','input']);
  assert.deepEqual(profile.expressionContexts.reduce.roots,['model','input']);
  assert.equal(profile.expressionContexts.predicate,undefined);
  assert.equal(profile.operators.Program.children.includes('Selector'),false);
});

test('v2 declares selector admission, field rules and strict boolean semantics independently of v1', () => {
  const profile = profiles.getRmtxOperatorProfile('2.0.0');
  assert.deepEqual(Object.keys(profile.operators),[...oldNames,'Selector','Where','Find','Sort','Output']);
  assert.deepEqual(profile.imports,['RMT','model','input','selectors','item','params','contains']);
  assert.deepEqual(profile.operators.Selector.children,['Where','Find','Sort','Output']);
  assert.deepEqual(profile.operators.Selector.childCardinality,{Where:{min:0,max:null},Find:{min:0,max:1},Sort:{min:0,max:1},Output:{min:0,max:1}});
  assert.equal(profile.operators.Selector.attributes.from.required,true);
  assert.deepEqual(profile.operators.Sort.attributes.direction.values,['asc','desc']);
  assert.equal(profile.operators.Sort.attributes.direction.default,'asc');
  assert.deepEqual(profile.expressionContexts.predicate.equality,{'===':'==','!==':'!='});
  assert.equal(profile.expressionContexts.predicate.looseEquality,false);
  assert.equal(profile.expressionContexts.predicate.barePathTruthiness,false);
  assert.equal(profile.expressionContexts.predicate.negation.requiresParenthesizedPredicate,true);
  assert.equal(profile.expressionContexts.predicate.calls.contains.arguments,2);
  assert.equal(profile.expressionContexts['selector-source'].wholeDeclaredSymbolOnly,true);
  assert.deepEqual(profile.expressionContexts['sort-path'].roots,['item']);
  assert.deepEqual(profile.semantics.selector.executionOrder,['where','find','sort']);
  assert.equal(profile.semantics.selector.sort.copiesSource,true);
  assert.equal(profile.semantics.selector.sort.numeric,false);
  assert.equal(profile.semantics.selector.output.runtimeValueValidation,false);
  assert.equal(profile.semantics.selector.parameters.forwardedToDependencies,false);
  assert.equal(profiles.getRmtxOperatorProfile('1.0.0').operators.Selector,undefined);
});

test('profile records are immutable plain data and mutable clones cannot alter compiler contracts', () => {
  for (const version of ['1.0.0','2.0.0']) {
    const profile = profiles.getRmtxOperatorProfile(version);frozenData(profile);
    assert.deepEqual(JSON.parse(JSON.stringify(profile)),profile);
    assert.throws(()=>{profile.operators.Program.children.push('Anything');},TypeError);
    assert.throws(()=>{profile.limits.generatedNodes=Infinity;},TypeError);
    const copy=JSON.parse(JSON.stringify(profile));copy.operators.Program.attributes.injected={kind:'string',required:false};
    assert.equal(profiles.getRmtxOperatorProfile(version).operators.Program.attributes.injected,undefined);
  }
});

test('unsupported versions fail without coercing or executing supplied metadata', () => {
  let touched=false;
  const misleading={toString(){touched=true;return '1.0.0';}};
  for(const value of ['future','__proto__','constructor','',null,[],misleading]) {
    assert.throws(()=>profiles.getRmtxOperatorProfile(value),{code:'rmtx.operator-profile.unsupported'});
  }
  assert.equal(touched,false);
});

test('catalog references remain coherent and do not claim dynamic tracking or runtime source execution', () => {
  for(const version of ['1.0.0','2.0.0']) {
    const profile=profiles.getRmtxOperatorProfile(version);
    for(const contract of Object.values(profile.operators)) {
      for(const child of contract.children) assert(Object.hasOwn(profile.operators,child),child);
      for(const attribute of Object.values(contract.attributes)) {
        assert.equal(typeof attribute.required,'boolean');
        if(attribute.expressionContext) assert(Object.hasOwn(profile.expressionContexts,attribute.expressionContext));
        if(attribute.default) assert(attribute.values.includes(attribute.default));
      }
    }
    for(const value of Object.values(profile.limits)) assert(Number.isInteger(value)&&value>0);
    assert.equal(profile.semantics.sourceExecution,false);assert.equal(profile.semantics.importsExecuted,false);
    assert.equal(profile.reads.runtimeTracking,false);assert.equal(profile.reads.runtimeSubscriptionsChanged,false);
  }
});

test('authoring names follow the v2 catalog and all operator/helper calls require compilation', () => {
  assert.equal(authoring.RMTX_AUTHORING_API_VERSION,'2.0.0');
  assert.deepEqual(Object.keys(authoring.RMT),Object.keys(profiles.getRmtxOperatorProfile('2.0.0').operators));
  assert(Object.isFrozen(authoring));assert(Object.isFrozen(authoring.RMT));
  let touched=false;
  const attrs=Object.defineProperty({},'id',{get(){touched=true;return 'forged';}});
  for(const fn of [...Object.values(authoring.RMT),authoring.contains]) assert.throws(()=>fn(attrs),/must be compiled/);
  assert.equal(touched,false);
});

test('strict authoring types reject unknown attributes and enums while preserving the named legacy type', () => {
  const ts=require('typescript');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-rmtx-profile-types-'));
  try {
    const file=path.join(temporary,'consumer.cts');
    const authoringModule=path.resolve(__dirname,'../../tools/rmt-language/rmtx').replaceAll('\\','/');
    const profileModule=path.resolve(__dirname,'../../tools/rmt-language/rmtx-operator-profiles').replaceAll('\\','/');
    fs.writeFileSync(file,`import {RMT,model,item,contains,type RmtxLegacyAuthoringNamespace} from '${authoringModule}';
import {getRmtxOperatorProfile} from '${profileModule}';
const legacy = {} as RmtxLegacyAuthoringNamespace;
legacy.Program({legacyField:true});
type Equal<A,B> = (<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;
const oldKeys: Equal<keyof RmtxLegacyAuthoringNamespace,'Program'|'State'|'Action'|'Input'|'Reduce'|'Portal'|'Surface'|'Lane'|'Mount'> = true;
const newKeys: Equal<keyof typeof RMT,'Program'|'State'|'Action'|'Input'|'Reduce'|'Portal'|'Surface'|'Lane'|'Mount'|'Selector'|'Where'|'Find'|'Sort'|'Output'> = true;
const sourceVersion: '2.0.0' = getRmtxOperatorProfile('2.0.0').syntaxVersion;
RMT.Selector({id:'images',from:model.images});
RMT.Where({test:contains(item.label,'image')});
RMT.Sort({by:item.name,direction:'desc'});
RMT.Output({type:'object[]'});
RMT.State({id:'ready',type:'boolean',initial:true,preserve:false});
// @ts-expect-error Required source binding is missing.
RMT.Selector({id:'bad'});
// @ts-expect-error Unknown operator attribute.
RMT.Where({test:true,ignored:true});
// @ts-expect-error Direction enum is closed.
RMT.Sort({by:item.name,direction:'sideways'});
// @ts-expect-error Leaf children are not introduced.
RMT.Output({type:'object[]',children:'native'});
// @ts-expect-error State initial data cannot contain executable values.
RMT.State({id:'bad',type:'object',initial:{run:()=>0}});
// @ts-expect-error Model field inference is intentionally unavailable in this stage.
const unsupported = model.product.name;
void [oldKeys,newKeys,sourceVersion];
`);
    const program=ts.createProgram([file],{noEmit:true,strict:true,skipLibCheck:false,types:[],module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,target:ts.ScriptTarget.ES2022});
    const diagnostics=ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>temporary,getCanonicalFileName:file=>file,getNewLine:()=>'\n'}));
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

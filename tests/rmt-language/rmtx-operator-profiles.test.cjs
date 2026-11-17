'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
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

test('new profile capability preserves exact v1 and v2 wire contracts', () => {
  assert.equal(profiles.RMTX_OPERATOR_PROFILE_API_VERSION,'3.0.0');
  const expected={
    '1.0.0':'d40079c970f88ee4c66e547f81d1d35052643a86c3d79712b79d4e8cc4aff4ec',
    '2.0.0':'27f9d25ba4e730b0db9812a451af631d14bb1fa11cd16abd9ef35d19002f55c1'
  };
  for(const [version,hash] of Object.entries(expected)) {
    const profile=profiles.getRmtxOperatorProfile(version);
    assert.equal(profile.apiVersion,'1.0.0');
    assert.equal(createHash('sha256').update(JSON.stringify(profile)).digest('hex'),hash);
  }
});

test('v3 closes host repeat, boolean presence and event conditions without enabling native repeat or Mount conditions', () => {
  const profile=profiles.getRmtxOperatorProfile('3.0.0');
  assert.equal(profile.apiVersion,'2.0.0');
  assert.equal(profile.schema,'xtend.rmtx.operator-profile.v2');
  assert.deepEqual(Object.keys(profile.operators),[...Object.keys(profiles.getRmtxOperatorProfile('2.0.0').operators),'Repeat','On']);
  assert.deepEqual(profile.imports,profiles.getRmtxOperatorProfile('2.0.0').imports);
  assert(profile.operators.Program.children.includes('Repeat'));
  assert.deepEqual(profile.operators.Repeat.children,['Repeat','Surface']);
  assert.equal(profile.operators.Repeat.astType,'RmtxHostRepeatScope');
  assert.equal(profile.operators.Repeat.lowering,'host-scope-source-contract');
  assert.equal(profile.operators.Repeat.attributes.from.required,true);
  assert.equal(profile.operators.Repeat.attributes.keyBy.required,true);
  assert.deepEqual(profile.operators.Surface.children,['Lane','On']);
  assert.equal(profile.operators.Surface.attributes.present.kind,'boolean-model-or-item-path');
  assert.equal(profile.operators.Surface.attributes.present.expressionContext,'host-presence');
  assert.equal(profile.operators.On.astType,'RmtEventBinding');
  assert.equal(profile.operators.On.attributes.event.required,true);
  assert.equal(profile.operators.On.attributes.action.required,true);
  assert.equal(profile.operators.On.attributes.payload.required,true);
  assert.equal(profile.operators.On.attributes.when.expressionContext,'condition');
  assert.deepEqual(profile.expressionContexts.condition.roots,['model']);
  assert.deepEqual(profile.expressionContexts.condition.calls,{});
  assert.equal(profile.expressionContexts.condition.barePathTruthiness,false);
  assert.equal(profile.expressionContexts.condition.negation.requiresParenthesizedPredicate,true);
  assert.equal(profile.expressionContexts['repeat-source'].rootScope,'model');
  assert.equal(profile.expressionContexts['repeat-source'].nestedScope,'item');
  assert.deepEqual(profile.expressionContexts['repeat-key'].roots,['item']);
  assert.equal(profile.expressionContexts['repeat-key'].fieldRequired,true);
  assert.equal(profile.semantics.hostScopes.matchingXTensionBindingRequired,true);
  assert.equal(profile.semantics.hostScopes.nativeEventsOnScopedHosts,false);
  assert.equal(profile.semantics.events.nativePayloadTypeValidation,false);
  assert.equal(profile.semantics.events.inputNames,'exact-declared-action-inputs');
  assert.equal(profile.semantics.hostScopes.bindingArtifact,'xtend.xtensions.state-binding-artifact.v3');
  assert.equal(profile.semantics.hostScopes.lowering,'flattened-static-surfaces-with-host-scope-contract');
  assert.equal(profile.operators.Mount.attributes.when,undefined);
  for(const version of ['1.0.0','2.0.0']) {
    const old=profiles.getRmtxOperatorProfile(version);
    assert.equal(old.operators.Repeat,undefined);assert.equal(old.operators.On,undefined);
    assert.equal(old.operators.Surface.attributes.present,undefined);
  }
});

test('profile records are immutable plain data and mutable clones cannot alter compiler contracts', () => {
  for (const version of ['1.0.0','2.0.0','3.0.0','4.0.0']) {
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
  for(const version of ['1.0.0','2.0.0','3.0.0','4.0.0']) {
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

test('authoring names follow the v4 catalog and all operator/helper calls require compilation', () => {
  assert.equal(authoring.RMTX_AUTHORING_API_VERSION,'4.0.0');
  assert.deepEqual(Object.keys(authoring.RMT),Object.keys(profiles.getRmtxOperatorProfile('4.0.0').operators));
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
    fs.writeFileSync(file,`import {RMT,model,item,contains,type RmtxLegacyAuthoringNamespace,type RmtxAuthoringNamespaceV2,type RmtxAuthoringNamespaceV3} from '${authoringModule}';
import {getRmtxOperatorProfile} from '${profileModule}';
const legacy = {} as RmtxLegacyAuthoringNamespace;
legacy.Program({legacyField:true});
type Equal<A,B> = (<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;
const oldKeys: Equal<keyof RmtxLegacyAuthoringNamespace,'Program'|'State'|'Action'|'Input'|'Reduce'|'Portal'|'Surface'|'Lane'|'Mount'> = true;
const v2Keys: Equal<keyof RmtxAuthoringNamespaceV2,'Program'|'State'|'Action'|'Input'|'Reduce'|'Portal'|'Surface'|'Lane'|'Mount'|'Selector'|'Where'|'Find'|'Sort'|'Output'> = true;
const newKeys: Equal<keyof RmtxAuthoringNamespaceV3,keyof RmtxAuthoringNamespaceV2|'Repeat'|'On'> = true;
const sourceVersion: '2.0.0' = getRmtxOperatorProfile('2.0.0').syntaxVersion;
const v3SourceVersion: '3.0.0' = getRmtxOperatorProfile('3.0.0').syntaxVersion;
const oldProfileApi: '1.0.0' = getRmtxOperatorProfile('2.0.0').apiVersion;
const newProfileApi: '2.0.0' = getRmtxOperatorProfile('3.0.0').apiVersion;
RMT.Selector({id:'images',from:model.images});
RMT.Where({test:contains(item.label,'image')});
RMT.Sort({by:item.name,direction:'desc'});
RMT.Output({type:'object[]'});
RMT.State({id:'ready',type:'boolean',initial:true,preserve:false});
RMT.Repeat({from:model.groups,keyBy:item.id});
RMT.Surface({id:'host',present:item.enabled});
RMT.On({event:'click',action:'select',payload:{id:'detail.id'},when:true});
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
// @ts-expect-error A repeat always declares an explicit stable item key.
RMT.Repeat({from:model.groups});
// @ts-expect-error Repeat attributes stay closed.
RMT.Repeat({from:model.groups,keyBy:item.id,indexKey:true});
// @ts-expect-error An event binding always declares the target action.
RMT.On({event:'click'});
// @ts-expect-error No event payload/selector syntax is introduced in this profile.
RMT.On({event:'click',action:'select',selector:'#host'});
// @ts-expect-error Mount conditions are not supported by the actual runtime.
RMT.Mount({target:'card',when:true});
// @ts-expect-error On is a leaf operator.
RMT.On({event:'click',action:'select',children:'text'});
void [oldKeys,v2Keys,newKeys,sourceVersion,v3SourceVersion,oldProfileApi,newProfileApi];
`);
    const program=ts.createProgram([file],{noEmit:true,strict:true,skipLibCheck:false,types:[],module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,target:ts.ScriptTarget.ES2022});
    const diagnostics=ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>temporary,getCanonicalFileName:file=>file,getNewLine:()=>'\n'}));
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
});

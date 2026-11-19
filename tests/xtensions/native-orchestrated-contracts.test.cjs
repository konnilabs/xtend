'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ref=require('../../development/rmtx-a06/native-orchestration-profile/reference.cjs'),binding=require('../../tools/xtensions/state-binding'),urls=require('../../tools/xtensions/url-state');
const compiled=ref.compiler().compileSource({text:fs.readFileSync(ref.source,'utf8'),filePath:ref.source},{componentInterfaceCatalog:ref.catalog()});assert.equal(compiled.ok,true,JSON.stringify(compiled.diagnostics));
const program=compiled.orchestrationArtifacts,snapshot=()=>({states:structuredClone(Object.fromEntries(program.state.states.map(row=>[row.id,row.initial])))});
test('Binding7 preserves typed logical addresses and binds each target to its concrete owning Surface',()=>{
 const artifact=binding.validateOrchestratedStateBindingArtifact(compiled.xtensionBindings,program),data=snapshot(),rows=binding.materializeOrchestratedStateBindingArtifact(artifact,data);
 assert.equal(rows.length,4);assert.equal(new Set(rows.map(row=>row.hostSurface)).size,4);assert.equal(new Set(rows.map(row=>row.ownerSurface)).size,2);assert.deepEqual(rows.filter(row=>row.surface==='gallery').map(row=>row.binding.address.keys),[[1],['1']]);assert.equal(Object.isFrozen(data.states.catalog.items[0]),false);
 const reversed=snapshot();reversed.states.catalog.items.reverse();const reordered=binding.materializeOrchestratedStateBindingArtifact(artifact,reversed);
 assert.deepEqual(new Set(reordered.map(row=>row.hostSurface)),new Set(rows.map(row=>row.hostSurface)));
 assert.equal(binding.materializeOrchestratedStateBindingArtifact(artifact,data,{[rows[0].ownerSurface]:false}).length,2);
 assert.throws(()=>binding.materializeStateBindingArtifact(artifact,data),/explicit orchestrated/);assert.throws(()=>binding.validateLifecycleStateBindingArtifact(compiled.xtensionBindings,program));
});
test('Binding7 rejects forged scope ancestry and raw accessors before invocation',()=>{
 const forged=structuredClone(compiled.xtensionBindings);forged.bindings[0].repeat[0].key=['title'];assert.throws(()=>binding.validateOrchestratedStateBindingArtifact(forged,program));
 let reads=0;const raw=Object.defineProperty({},'schema',{enumerable:true,get(){reads++;return compiled.xtensionBindings.schema;}});assert.throws(()=>binding.validateOrchestratedStateBindingArtifact(raw,program));assert.equal(reads,0);
});
test('URL5 keeps URL2 token bytes and independent numeric/string restore keys',()=>{
 const policy={schema:'xtend.xtensions.url-state-policy.v2',id:'products',version:1,documentId:compiled.xtensionBindings.documentId,exposure:'public-url',fields:[{id:'image',surface:'gallery',prop:'selectedImageId',default:'front'}],limits:{tokenBytes:8192,entries:20,valueBytes:256,instances:20}};
 const codec=urls.ORCHESTRATED_URL_STATE_RUNTIME.createURLStateContract(policy,{program,bindings:compiled.xtensionBindings});try{
  assert.equal(codec.apiVersion,'5.0.0');const data=snapshot(),captured=codec.capture(data);assert.equal(captured.schema,'xtend.xtensions.url-state.v2');const token=codec.encode(captured);assert(token.startsWith('2.'));assert.deepEqual(codec.decode(token),captured);
  const target=snapshot();target.states.catalog.items[1].selectedImageId='front';const plan=codec.planRestore(token,target,{navigationId:'typed'});assert.equal(plan.changes.length,1);assert.deepEqual(plan.changes[0].keys,['1']);
  assert.throws(()=>urls.LIFECYCLE_URL_STATE_RUNTIME.createURLStateContract(policy,{program,bindings:compiled.xtensionBindings}));
 }finally{codec.dispose();}
});
test('Browser13 requires Port3 and its named factory before any host work',async()=>{
 const {createMaracaBrowserCompositionRoot}=await import('../../xtend-maraca/browser-composition-runtime.mjs'),port=require('../../tools/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME;
 const config={schema:'xtend.maraca.browser-composition-root.v13',buildPlanSchema:'xtend.maraca.build-plan.v11',sourceHash:'a'.repeat(64),orchestration:{enabled:true,artifact:program},components:[],surfaces:[]};
 assert.throws(()=>createMaracaBrowserCompositionRoot(config,{nativeViewRuntimePort:port,createPlanRuntime(){}}));
 const root=createMaracaBrowserCompositionRoot(config,{nativeViewRuntimePort:port,createOrchestratedPlanRuntime(){}});assert.equal(root.apiVersion,'13.0.0');assert.equal(root.facade.snapshot().schema,'xtend.maraca.plan-runtime.v16');root.dispose();
});

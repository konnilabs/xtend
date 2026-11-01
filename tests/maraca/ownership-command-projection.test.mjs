import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {JSDOM} from 'jsdom';import {createRmtDomDescriptorRenderer} from '../../xtendrmt/rmt-dom-descriptor-renderer.js';import {createRmtEventRoutingRuntime} from '../../xtendrmt/rmt-event-routing-runtime.js';
const source=fs.readFileSync(new URL('../../xtend-maraca/plan-runtime.mjs',import.meta.url),'utf8');const projection=source.slice(source.indexOf('const VISIBILITY_ATTRIBUTES'),source.indexOf('\nexport function',source.indexOf('function descriptorForOwners')));const project=vm.runInNewContext(projection+'\ndescriptorForOwners');const policy=source.slice(source.indexOf('  const ownership = Object.freeze('),source.indexOf('\n\n  function projectDescriptor'));const ownership=vm.runInNewContext(policy+'\nownership',{strict:true,reservedOwners:{events:true,visibility:true,validation:true}});
function setup(){const dom=new JSDOM('<main></main>');const root=dom.window.document.querySelector('main'),renderer=createRmtDomDescriptorRenderer({documentTarget:dom.window.document});return {dom,root,renderer};}
const settle=()=>new Promise(r=>setImmediate(r));
for(const kind of ['command','commands'])test(kind+' retained declarations route once with original payload and command target',async()=>{const {dom,root,renderer}=setup();const spec={command:'fixture.activate',event:'click',payload:{value:7},target:{op:'literal',value:{id:'owned-target'}}};const original={type:'element',tag:'button',attributes:{id:'button'},[kind]:kind==='commands'?[spec]:spec};const before=JSON.stringify(original);const projected=project(original,{events:true});assert.equal(JSON.stringify(original),before);assert.deepEqual(JSON.parse(JSON.stringify(projected[kind])),JSON.parse(JSON.stringify(original[kind])));const report=renderer.commit({operation:'replace-children',target:root,descriptor:projected,ownership});assert.equal(report.bindings.length,1);const calls=[];const router=createRmtEventRoutingRuntime({root,events:[],commandBus:{async dispatchCommand(envelope,metadata){calls.push({envelope,metadata});return {status:'ok'};}}});root.firstChild.click();await settle();assert.equal(calls.length,0,'renderer attaches no command listener');router.reconcile(root,report);router.reconcile(root,report);root.firstChild.click();await settle();assert.equal(calls.length,1);assert.equal(calls[0].envelope.command,'fixture.activate');assert.equal(Object.getPrototypeOf(calls[0].envelope.payload),null);assert.deepEqual({...calls[0].envelope.payload},{value:7});assert.deepEqual({...calls[0].envelope.target},{id:'owned-target'});assert.equal(report.bindings[0].target,root.firstChild);router.dispose();dom.window.close();});
test('mixed nested commands and original event fields preserve routing without duplicate renderer listener',async()=>{const {dom,root,renderer}=setup();const original={type:'fragment',children:[{type:'element',tag:'section',children:[{type:'element',tag:'button',attributes:{id:'one'},command:{command:'fixture.one',payload:{n:1}}},{type:'element',tag:'button',attributes:{id:'two'},commands:[{command:'fixture.two',payload:{n:2}}]},{type:'element',tag:'button',attributes:{id:'three'},events:{click:{command:'fixture.three',payload:{n:3}}}}]}]};const before=JSON.stringify(original),projected=project(original,{events:true});assert.equal(JSON.stringify(original),before);assert.equal(Object.hasOwn(projected.children[0].children[2],'events'),false);const report=renderer.commit({operation:'replace-children',target:root,descriptor:projected,ownership});assert.equal(report.bindings.length,2);const calls=[];const router=createRmtEventRoutingRuntime({root,events:[{id:'original.event',event:'click',target:'#three',command:original.children[0].children[2].events.click.command,payload:original.children[0].children[2].events.click.payload}],commandBus:{async dispatchCommand(e){calls.push(e);return {status:'ok'};}}});router.reconcile(root,report);router.reconcile(root,report);for(const id of ['one','two','three'])root.querySelector('#'+id).click();await settle();assert.deepEqual(calls.map(x=>x.command),['fixture.one','fixture.two','fixture.three']);assert.ok(calls.every(x=>Object.getPrototypeOf(x.payload)===null));assert.deepEqual(calls.map(x=>({...x.payload})),[{n:1},{n:2},{n:3}]);assert.equal(JSON.stringify(original),before);router.dispose();dom.window.close();});
test('projection recursion conserves original commands in every existing nested lane',()=>{for(const key of ['children','descriptors','nodes','child','content','fallback','then','else','empty','template','itemTemplate','node','descriptor','slots']){const leaf={type:'element',tag:'button',command:'fixture.one',commands:[{command:'fixture.two'}],events:{click:'fixture.old'}};const original=key==='slots'?{slots:{default:leaf}}:['children','descriptors','nodes'].includes(key)?{[key]:[leaf]}:{[key]:leaf};const bytes=JSON.stringify(original),result=project(original,{events:true});const out=key==='slots'?result.slots.default:Array.isArray(result[key])?result[key][0]:result[key];assert.equal(out.command,leaf.command);assert.deepEqual(JSON.parse(JSON.stringify(out.commands)),leaf.commands);assert.equal(Object.hasOwn(out,'events'),false);assert.equal(JSON.stringify(original),bytes);}});
test('event reservation false keeps original event and command fields',()=>{const original={events:{click:'fixture.one'},command:'fixture.two'};assert.deepEqual(JSON.parse(JSON.stringify(project(original,{events:false}))),original);});
test('original collision, foreign claim and unrelated domain collisions remain strict',()=>{for(const custom of [{...ownership,claims:{}},{...ownership,claims:{events:'foreign-writer'}},{...ownership,claims:{events:'event-router'},domains:{...ownership.domains,structure:'foreign-owner'}}]){const {dom,root,renderer}=setup();assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor:{type:'element',tag:'button',events:{click:'fixture.one'}},ownership:custom}),e=>e.code==='rmt.dom.ownership.collision');assert.equal(root.childNodes.length,0);dom.window.close();}});
test('unsafe command identity and untrusted DOM remain rejected',()=>{const {dom,root,renderer}=setup();assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor:{type:'element',tag:'button',command:{command:'fixture.one',bindingId:'bad id'}},ownership}),e=>e.code==='rmt.dom.binding.id-unsafe');assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor:{type:'element',tag:'script',command:'fixture.one'},ownership}));dom.window.close();});
test('original descriptor and compiled event source remain separate authoritative inputs',()=>{assert.ok(source.includes('events: artifact.events || []'));assert.ok(source.includes('events.reconcile(root, commitReport)'));assert.ok(source.includes('asRecord(artifact.render).root'));assert.ok(source.includes('if (reservations.events) delete next.events;'));assert.ok(!projection.includes('delete next.command'));});
test('plural commands with distinct events preserve precedence, payloads and exactly-once reconciliation',async()=>{const {dom,root,renderer}=setup();const original={type:'element',tag:'button',command:'fixture.ignored',commands:[{command:'fixture.click',event:'click',payload:{n:1}},{command:'fixture.focus',event:'focus',payload:{n:2}}]};const before=JSON.stringify(original);const report=renderer.commit({operation:'replace-children',target:root,descriptor:project(original,{events:true}),ownership});assert.equal(report.bindings.length,2);const calls=[];const router=createRmtEventRoutingRuntime({root,events:[],commandBus:{async dispatchCommand(e){calls.push(e);return {status:'ok'};}}});router.reconcile(root,report);router.reconcile(root,report);root.firstChild.dispatchEvent(new dom.window.Event('click'));root.firstChild.dispatchEvent(new dom.window.Event('focus'));await settle();assert.deepEqual(calls.map(e=>e.command),['fixture.click','fixture.focus']);assert.deepEqual(calls.map(e=>({...e.payload})),[{n:1},{n:2}]);assert.equal(JSON.stringify(original),before);router.dispose();dom.window.close();});
test('forged owner attribution cannot authorize actual renderer handler writes',()=>{for(const forged of [{owner:'event-router'},{claims:{events:'event-router'}},{owner:'event-router',claims:{events:'event-router'}}]){for(const descriptor of [{type:'element',tag:'button',attributes:{onclick:'fixture()'}},{type:'element',tag:'button',properties:{onclick:()=>{throw Error('must not execute');}}}]){const {dom,root,renderer}=setup();assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor,ownership:{...ownership,...forged}}));assert.equal(root.childNodes.length,0);dom.window.close();}}});
test('handler installer belongs only to router, metadata generation is not owner relabeling',async()=>{const {dom,root,renderer}=setup();let installs=0;const native=dom.window.EventTarget.prototype.addEventListener;dom.window.EventTarget.prototype.addEventListener=function(...args){if(this.localName==='button')installs++;return native.apply(this,args);};const report=renderer.commit({operation:'replace-children',target:root,descriptor:{type:'element',tag:'button',command:'fixture.once'},ownership});assert.equal(installs,0);assert.equal(root.firstChild.onclick,null);const calls=[];const router=createRmtEventRoutingRuntime({root,commandBus:{async dispatchCommand(e){calls.push(e);return {status:'ok'};}}});router.reconcile(root,report);assert.equal(installs,1);router.reconcile(root,report);assert.equal(installs,1);root.firstChild.click();await settle();assert.equal(calls.length,1);router.dispose();root.firstChild.click();await settle();assert.equal(calls.length,1);dom.window.EventTarget.prototype.addEventListener=native;dom.window.close();});
test('canonical renderer and both existing embedded distributions retain identical command boundary change',()=>{for(const file of ['rmt-dom-descriptor-renderer.js','rmt-runtime.browser.js','rmt-runtime.esm.js']){const bytes=fs.readFileSync(new URL('../../xtendrmt/'+file,import.meta.url),'utf8');assert.ok(bytes.includes('// Command declarations produce inert binding metadata, not event handlers.'));assert.ok(bytes.includes('// The event-router alone installs handlers from these validated records.'));assert.ok(!bytes.includes("if (descriptor.command || descriptor.commands) domains.add('events');"));assert.ok(!/function applyCommand\(element, descriptor, context\) \{\s*if \(!domainAllowed\(context, 'events'\)\)/.test(bytes));}});
test('strict router rejects compiled versus dynamic binding-ID collision without installing competing handler',async()=>{const {dom,root,renderer}=setup();const report=renderer.commit({operation:'replace-children',target:root,descriptor:{type:'element',tag:'button',attributes:{id:'collision'},command:{command:'fixture.dynamic',bindingId:'shared.binding'}},ownership});assert.equal(report.bindings[0].id,'shared.binding');const calls=[];const router=createRmtEventRoutingRuntime({root,strict:true,events:[{id:'shared.binding',event:'click',target:'#collision',command:'fixture.compiled',payload:{n:9},owner:'compiled.owner'}],commandBus:{async dispatchCommand(e){calls.push(e);return {status:'ok'};}}});assert.throws(()=>router.reconcile(root,report),e=>e.code==='rmt.event.commit-binding.compiled-collision'&&e.diagnostic.details.bindingId==='shared.binding');root.firstChild.click();await settle();assert.equal(calls.length,0);router.reconcile(root);root.firstChild.click();await settle();assert.deepEqual(calls.map(e=>e.command),['fixture.compiled']);assert.deepEqual({...calls[0].payload},{n:9});router.dispose();dom.window.close();});

// Exercise the controller's actual report boundary, not only renderer -> router.
const normalizeSource = source.slice(source.indexOf('  function normalizeRendererReport('), source.indexOf('\n  function legacyFullRender(', source.indexOf('  function normalizeRendererReport(')));
const normalizeReport = vm.runInNewContext(normalizeSource + '\nnormalizeRendererReport', {
  asRecord: value => value && typeof value === 'object' ? value : {},
  asArray: value => Array.isArray(value) ? value : [],
  hasOwn: (value, key) => Object.hasOwn(value, key),
  clone: (value, fallback) => value === undefined ? fallback : structuredClone(value),
  viewChildNodes: target => [...target.childNodes],
  DOM_COMMIT_SCHEMA: vm.runInNewContext(source.slice(source.indexOf('const PLAN_RUNTIME_SCHEMA'), source.indexOf('const VISIBILITY_ATTRIBUTES')) + '\nDOM_COMMIT_SCHEMA')
});
test('controller normalization preserves exact binding targets and routes native commands through state reconciliation', async () => {
  const {dom,root,renderer}=setup(); const calls=[];
  const router=createRmtEventRoutingRuntime({root,strict:true,commandBus:{async dispatchCommand(e){calls.push(e.command);return {status:'ok'};}}});
  const descriptor={type:'element',tag:'button',attributes:{id:'cancel'},command:{command:'fixture.close',payload:{label:'Cancel'}}};
  const initial={operation:'replace-children',target:root,descriptor,ownership};
  const raw=renderer.commit(initial), normalized=normalizeReport(raw,initial);
  assert.equal(normalized.bindings,raw.bindings); assert.equal(normalized.bindingScope,raw.bindingScope);
  assert.equal(normalized.bindings[0].target,root.firstChild);
  router.reconcile(root,normalized); root.firstChild.click(); await settle();
  const update={operation:'reconcile-children',target:root,descriptors:[{...descriptor,text:'Cancel preparation'}],ownership};
  router.reconcile(root,normalizeReport(renderer.commit(update),update));
  router.reconcile(root,normalizeReport(renderer.commit(update),update));
  root.firstChild.click(); await settle(); assert.deepEqual(calls,['fixture.close','fixture.close']);
  const remove={...update,descriptors:[]}; const old=root.firstChild;
  router.reconcile(root,normalizeReport(renderer.commit(remove),remove)); old.click(); await settle();
  assert.equal(calls.length,2); router.dispose(); dom.window.close();
});
test('controller does not invent absent binding evidence or hide malformed and foreign binding scopes', () => {
  const {dom,root,renderer}=setup(); const request={operation:'replace-children',target:root,descriptor:{type:'element',tag:'button',command:'fixture.close'},ownership};
  const raw=renderer.commit(request), router=createRmtEventRoutingRuntime({root,strict:true});
  const absent=normalizeReport({},request); assert.equal(Object.hasOwn(absent,'bindings'),false); assert.equal(Object.hasOwn(absent,'bindingScope'),false);
  for (const bad of [{...raw,bindings:null},{...raw,bindingScope:null},{...raw,bindingScope:{...raw.bindingScope,roots:[dom.window.document.createElement('aside')]}}]) {
    assert.throws(()=>router.reconcile(root,normalizeReport(bad,request)),e=>e.code.startsWith('rmt.event.commit-'));
  }
  router.dispose();dom.window.close();
});

const {applyRmtReducerRecipe} = await import('../../xtendrmt/rmt-app-runtime.js');
const {createRmtStateSelectorRuntime} = await import('../../xtendrmt/rmt-state-selector-runtime.js');
const reducerLoop = source.slice(source.indexOf('    reducers.forEach((reducer) => {'), source.indexOf('\n    const changedValidationStates', source.indexOf('    reducers.forEach((reducer) => {')));
const planReducers = vm.runInNewContext(source.slice(source.indexOf('const PLAN_RUNTIME_SCHEMA'), source.indexOf('const VISIBILITY_ATTRIBUTES')) + `
  (reducers, initial, recipePort, payload = {}) => {
    const runtimes = { applyReducerRecipe: recipePort };
    const actionResult = {}, metadata = {}, diagnostics = [];
    const recordDiagnostic = (...args) => diagnostics.push(args);
    const modelOperations = []; let workingStates = clone(initial, {});
    ${reducerLoop}
    return {modelOperations, workingStates, diagnostics};
  }`);
const menu = () => ({open:false,disabled:false,activeTool:'auto',items:[{value:'auto',label:'Auto',triggerLabel:'Use tool',activeAttr:''},{value:'web_search',label:'Web search',activeAttr:'web_search'}]});
test('controller plans declared recipes using the existing pure reducer and commits typed model operations', () => {
  const initial={'fixture.menu':menu()}; const before=JSON.stringify(initial);
  const toggle={state:'fixture.menu',path:'',target:'state.fixture.menu',recipe:'toggle-choice-menu',mode:'recipe',value:null};
  const result=planReducers([toggle,{...toggle,recipe:'select-choice-menu',value:'input.tool'}],initial,applyRmtReducerRecipe,{tool:'web_search'});
  assert.equal(JSON.stringify(initial),before);
  const model=createRmtStateSelectorRuntime({states:[{id:'fixture.menu',type:'object',initial:menu()}]});
  model.modelCommandPort.apply(result.modelOperations);
  const observed=model.modelReader.snapshot().states['fixture.menu'];
  assert.equal(result.modelOperations[0].value.open,true); assert.equal(observed.open,false); assert.equal(observed.activeTool,'web_search');
  assert.equal(observed.activeToolLabel,'Web search'); assert.equal(observed.activeToolAttr,'web_search');
});
test('controller recipe boundary retains disabled behavior, nested targets, diagnostics and fail-closed errors', () => {
  const base={state:'fixture.menu',path:'',recipe:'toggle-choice-menu',mode:'recipe',value:null};
  assert.equal(planReducers([base],{'fixture.menu':{...menu(),disabled:true}},applyRmtReducerRecipe).workingStates['fixture.menu'].open,false);
  assert.equal(planReducers([{...base,path:'child'}],{'fixture.menu':{child:menu()}},applyRmtReducerRecipe).workingStates['fixture.menu'].child.open,true);
  const invalid=planReducers([{...base,recipe:'select-choice-menu',value:'missing'}],{'fixture.menu':menu()},applyRmtReducerRecipe);
  assert.equal(invalid.workingStates['fixture.menu'].activeTool,'auto'); assert.equal(invalid.diagnostics.length,1);
  assert.throws(()=>planReducers([base],{'fixture.menu':menu()},null),/recipe/i);
  assert.throws(()=>planReducers([{...base,recipe:'unknown-recipe'}],{'fixture.menu':menu()},applyRmtReducerRecipe),/Unsupported RMT reducer recipe/);
  const literal=planReducers([{state:'fixture.menu',path:'open',value:true}],{'fixture.menu':menu()},null);
  assert.equal(literal.workingStates['fixture.menu'].open,true);
  const model=createRmtStateSelectorRuntime({states:[{id:'fixture.menu',type:'object',initial:menu()}]});
  assert.throws(()=>model.modelCommandPort.apply([{operation:'set',state:'fixture.menu',value:null}]),/Typ object/);
});
const {createRmtAppPresentationViewPort,RMT_APP_PRESENTATION_MODEL_SCHEMA} = await import('../../xtendrmt/rmt-app-view-projector.js');
const {createRmtSurfaceTransitionRuntime} = await import('../../xtendrmt/rmt-surface-transition-runtime.js');
const visibilitySource=source.slice(source.indexOf('  async function syncDescriptorVisibility('),source.indexOf('\n  async function syncOwnedVisibility('));
function visibilityOwner(root,transition,phase='ready') {
  return vm.runInNewContext(visibilitySource+'\nsyncDescriptorVisibility',{
    root,phase,hasOwn:(value,key)=>Object.hasOwn(value,key),reservedOwners:{visibility:true},runtimes:{transitions:transition},
    presentationBoundary:{capture:()=>1,isCurrent:token=>token===1}
  });
}
function choiceFixture() {
  const {dom,root,renderer}=setup();
  const template={type:'choice-menu',source:'$model.menu',buttonId:'trigger',optionsId:'options'};
  const descriptor=createRmtAppPresentationViewPort().project({schema:RMT_APP_PRESENTATION_MODEL_SCHEMA,template,model:{}});
  const transition=createRmtSurfaceTransitionRuntime({strict:true,domRenderer:renderer,transitionPlan:{transitions:[]},windowTarget:dom.window});
  const sync=visibilityOwner(root,transition);
  const commit=(open,previous,replace=false)=>renderer.commit({operation:replace?'replace-children':'reconcile-children',target:root,...(replace?{descriptor}:{descriptors:[descriptor]}),ownership,context:{model:{menu:{...menu(),open}},previousContext:{model:{menu:{...menu(),open:previous}}}}});
  return {dom,root,renderer,descriptor,transition,sync,commit};
}
test('choice menu visibility is projected only by its existing Transition owner through normalized commits',async()=>{
  const f=choiceFixture();
  try {
    const initial=f.commit(false,false,true),target=f.root.querySelector('#options');
    assert.equal(target.hidden,false,'renderer has not written a reserved domain');
    assert.equal(initial.visibilityBindings.length,1);assert.equal(initial.visibilityBindings[0].target,target);
    await f.sync(normalizeReport(initial,{operation:'replace-children',target:f.root}));assert.equal(target.hidden,true);
    const open=f.commit(true,false);assert.equal(target.hidden,true);assert.equal(open.visibilityBindings[0].previousHidden,true);assert.equal(open.visibilityBindings[0].nextHidden,false);
    await f.sync(normalizeReport(open,{operation:'reconcile-children',target:f.root}));assert.equal(target.hidden,false);
    await f.sync(normalizeReport(f.commit(false,true),{operation:'reconcile-children',target:f.root}));assert.equal(target.hidden,true);
    assert.equal(f.transition.snapshot().fallbackCount,0);
  } finally {f.transition.dispose();f.renderer.dispose();f.dom.window.close();}
});
test('owned visibility rejects missing Model predecessor, invalid declarations and competing direct writes',()=>{
  for(const descriptor of [{type:'element',tag:'div',visibility:{hidden:true}},{type:'element',tag:'div',visibility:{hidden:'invalid'}}]) {
    const {dom,root,renderer}=setup();assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor,ownership}),e=>e.code.startsWith('rmt.dom.visibility.'));dom.window.close();
  }
  const {dom,root,renderer}=setup();
  assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor:{type:'element',tag:'div',attributes:{hidden:true}},ownership}),e=>e.code==='rmt.dom.ownership.collision');
  const report=renderer.commit({operation:'replace-children',target:root,descriptor:{type:'element',tag:'div',visibility:{hidden:true}},ownership:{mode:'strict',domains:{visibility:'descriptor-renderer'}}});
  assert.equal(root.firstChild.hidden,true);assert.equal(report.visibilityBindings.length,0);dom.window.close();
});
test('visibility handoff rejects foreign targets, duplicate identities, missing fields and disposed presentation',async()=>{
  const f=choiceFixture();
  try {
    const raw=f.commit(false,false,true),binding=raw.visibilityBindings[0],target=binding.target;
    for(const bindings of [null,[binding,binding],[{...binding,target:f.dom.window.document.createElement('aside')}],[{...binding,previousHidden:undefined}],[{...binding,nextHidden:'true'}]]) {
      await assert.rejects(f.sync({...raw,visibilityBindings:bindings}),/visibility evidence/);
      assert.equal(target.hidden,false);
    }
    await visibilityOwner(f.root,f.transition,'disposed')(raw);assert.equal(target.hidden,false);
    await f.sync(raw);assert.equal(target.hidden,true);
  } finally {f.transition.dispose();f.renderer.dispose();f.dom.window.close();}
});
test('nested declared hidden intent survives owner projection without overriding surface visibility or validation',()=>{
  const original={type:'element',tag:'section',surface:'fixture.surface',attributes:{hidden:'$model.shell.hidden'},children:[{type:'element',tag:'div',attributes:{hidden:'$model.nested.hidden','aria-invalid':true}}]};
  const result=project(original,{visibility:true,validation:true});
  assert.equal(Object.hasOwn(result.attributes,'hidden'),false);assert.equal(result.visibility,undefined);
  assert.equal(result.children[0].visibility.hidden,'$model.nested.hidden');assert.equal(Object.hasOwn(result.children[0].attributes,'hidden'),false);assert.equal(Object.hasOwn(result.children[0].attributes,'aria-invalid'),false);
  assert.equal(original.children[0].attributes.hidden,'$model.nested.hidden');
});

test('visibility preflight rejects unpaired repeated items before any DOM mutation',()=>{
  const {dom,root,renderer}=setup();root.innerHTML='<strong>retained</strong>';
  const descriptor={type:'element',tag:'section',children:[{type:'element',tag:'div',visibility:{hidden:'$item.hidden'}}]};
  assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor,ownership,context:{item:{hidden:true},previousContext:{model:{}}}}),e=>e.code.startsWith('rmt.dom.visibility.'));
  assert.equal(root.innerHTML,'<strong>retained</strong>');renderer.dispose();dom.window.close();
});
test('visibility handoff cannot reuse a removed target or partially apply a foreign batch',async()=>{
  const f=choiceFixture();
  try {
    const raw=f.commit(false,false,true),binding=raw.visibilityBindings[0],target=binding.target;
    await assert.rejects(f.sync({...raw,visibilityBindings:[binding,{...binding,id:'foreign',target:f.dom.window.document.createElement('aside')}]}),/visibility evidence/);
    assert.equal(target.hidden,false);target.remove();
    await assert.rejects(f.sync(raw),/visibility evidence/);assert.equal(target.hidden,false);
  }finally{f.transition.dispose();f.renderer.dispose();f.dom.window.close();}
});
test('keyed repeated visibility pairs Model predecessors across insertion, reorder and removal',async()=>{
  const {dom,root,renderer}=setup();const transition=createRmtSurfaceTransitionRuntime({strict:true,domRenderer:renderer,transitionPlan:{transitions:[]},windowTarget:dom.window});const sync=visibilityOwner(root,transition);
  const descriptor={type:'repeat',source:'$model.rows',key:'$item.id',node:{type:'element',tag:'div',attributes:{'data-id':'$item.id'},visibility:{hidden:'$item.hidden'}}};
  const a={id:'a',hidden:true},b={id:'b',hidden:false},c={id:'c',hidden:true};
  const commit=(rows,previous,first=false)=>renderer.commit({operation:first?'replace-children':'reconcile-children',target:root,...(first?{descriptor}:{descriptors:[descriptor]}),ownership,context:{model:{rows},previousContext:{model:{rows:previous}}}});
  try{
    const initial=commit([a,b],[],true);await sync(initial);assert.equal(root.querySelector('[data-id=a]').hidden,true);assert.equal(root.querySelector('[data-id=b]').hidden,false);
    const aNode=root.querySelector('[data-id=a]');const reordered=commit([{...b,hidden:true},{...a,hidden:false},c],[a,b]);
    const intent=Object.fromEntries(reordered.visibilityBindings.map(x=>[x.target.getAttribute('data-id'),[x.previousHidden,x.nextHidden]]));
    assert.deepEqual(intent,{a:[true,false],b:[false,true],c:[true,true]});await sync(reordered);assert.equal(root.querySelector('[data-id=a]'),aNode);assert.equal(aNode.hidden,false);
    const removed=commit([c],[{...b,hidden:true},{...a,hidden:false},c]);assert.equal(removed.visibilityBindings.length,1);await sync(removed);assert.equal(root.children.length,1);
  }finally{transition.dispose();renderer.dispose();dom.window.close();}
});
test('repeated visibility rejects ambiguous keys and absent prior collections before mutation',()=>{
  const {dom,root,renderer}=setup();root.innerHTML='<strong>retained</strong>';
  const descriptor={type:'repeat',source:'$model.rows',key:'$item.id',node:{type:'element',tag:'div',visibility:{hidden:'$item.hidden'}}};const a={id:'a',hidden:true};
  for(const [rows,previous] of [[[a,a],[]],[[a],[a,a]],[[a],null],[[{id:'b',hidden:'bad'}],[]]]){
    assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor,ownership,context:{model:{rows},previousContext:{model:{rows:previous}}}}),e=>e.code.startsWith('rmt.dom.visibility.'));
    assert.equal(root.innerHTML,'<strong>retained</strong>');
  }renderer.dispose();dom.window.close();
});
test('plain page repeats do not require a previous visibility collection',()=>{
  const {dom,root,renderer}=setup();
  const descriptor={type:'repeat',source:'$model.page.rows',key:'$item.id',node:{type:'element',tag:'button',attributes:{'data-id':'$item.id'},text:'$item.label',command:{command:'fixture.select',payload:{id:'$item.id'}}}};
  try {
    for(const previous of [{page:null},{page:{rows:null}},{page:{}}]) {
      const report=renderer.commit({operation:'replace-children',target:root,descriptor,ownership,context:{model:{page:{rows:[{id:'new',label:'New page'}]}},previousContext:{model:previous}}});
      assert.equal(root.textContent,'New page');assert.equal(report.bindings.length,1);assert.equal(report.visibilityBindings.length,0);
    }
    renderer.commit({operation:'reconcile-children',target:root,descriptors:[descriptor],ownership,context:{model:{page:null},previousContext:{model:{page:null}}}});
    assert.equal(root.children.length,0);
  }finally{renderer.dispose();dom.window.close();}
});
test('missing repeated predecessor still rejects nested visibility before mutation',()=>{
  const {dom,root,renderer}=setup();root.innerHTML='<strong>retained</strong>';
  const descriptor={type:'repeat',source:'$model.rows',key:'id',node:{type:'element',tag:'section',children:[{type:'element',tag:'div',visibility:{hidden:'$item.hidden'}}]}};
  try {
    assert.throws(()=>renderer.commit({operation:'replace-children',target:root,descriptor,ownership,context:{model:{rows:[{id:'one',hidden:false}]},previousContext:{model:{rows:null}}}}),e=>e.code==='rmt.dom.visibility.previous-context-missing');
    assert.equal(root.innerHTML,'<strong>retained</strong>');
  }finally{renderer.dispose();dom.window.close();}
});
test('AppServices snapshot exposes measured status without returning private registry or payloads',()=>{
  const composition=fs.readFileSync(new URL('../../xtend-maraca/browser-composition-runtime.mjs',import.meta.url),'utf8');
  const code=composition.slice(composition.indexOf('function createAppServicesPort('),composition.indexOf('\nfunction createRuntimeConfiguration('));
  const create=vm.runInNewContext(code+'\ncreateAppServicesPort',{deepFreeze:value=>Object.freeze(value),clone:value=>structuredClone(value)});
  const registry={listActive:()=>[{}],listListenerErrors:()=>[],listHistory:()=>[{serviceId:'fixture.stream',kind:'stream',target:'local',status:'fulfilled',payload:{private:'not returned'},controller:{}}],listInputPolicyVerdicts:()=>[],dispose(){},invoke(){},stream(){}};
  const port=create({appServices:{enabled:true,manifest:{services:[{id:'fixture.stream'}]}}},{appServiceDefinition:{},createAppServiceRegistry:()=>registry},{},()=>{}),snapshot=port.snapshot();
  assert.equal(snapshot.activeCount,1);assert.equal(snapshot.listenerErrorCount,0);assert.equal(snapshot.history[0].status,'fulfilled');assert.equal(snapshot.serviceCount,1);
  assert.equal(snapshot.registry,undefined);assert.equal(snapshot.history[0].payload,undefined);assert.equal(snapshot.history[0].controller,undefined);assert.equal(snapshot.stream,undefined);
});

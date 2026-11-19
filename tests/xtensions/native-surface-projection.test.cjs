'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { compileRmtxSource } = require('../../tools/rmt-language/rmtx-compiler');
const view = require('../../tools/xtensions/native-surface-projection');
const scopes = require('../../tools/xtensions/native-surface-scopes');
function program(body, extra = '') {
  const text = `import {RMT,model,item,input} from '@ccslabs/xtend/rmt-language/rmtx';
  export default <RMT.Program id="surface.projection">
  <RMT.State id="rows" type="collection" initial={[{id:1,title:'Number',shown:true,children:[{id:'a',title:'Nested'}]},{id:'1',title:'String',shown:true,children:[]}]}/>
  <RMT.State id="ui" type="object" initial={{enabled:true,selected:null}}/>
  <RMT.Action id="select"><RMT.Input name="rowId" type="json"/><RMT.Reduce state="ui" path="selected" value={input.rowId}/></RMT.Action>
  ${extra}${body}</RMT.Program>`;
  const result = compileRmtxSource(text, { syntaxVersion: '7.0.0' });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics)); return result.orchestrationArtifacts;
}
function snapshot(p) { return {states: Object.fromEntries(p.state.states.map(row => [row.id, structuredClone(row.initial)])), selectors: {}}; }
const repeated = children => `<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row"><RMT.View>${children}</RMT.View></RMT.Surface></RMT.Repeat>`;

test('actual Surface repeats preserve number/string keys and scope projections through reorder', () => {
  const p = program(repeated('<RMT.Element tag="p"><RMT.Text value={item.title}/></RMT.Element>')), s = snapshot(p);
  const before = scopes.materializeNativeSurfaceScopes(p, s);
  assert.equal(before.instances.length, 2); assert.notEqual(before.instances[0].id, before.instances[1].id);
  assert.equal(Object.isFrozen(s.states.rows[0]), false, 'pure materialization must not freeze caller Model rows');
  const output = view.materializeNativeSurfaceView(p, s);
  assert.deepEqual(output.children.map(row => row.children[0].children[0].text.value), ['Number', 'String']);
  assert.deepEqual(output.children.map(row => row.surface), before.instances.map(row => row.id));
  s.states.rows.reverse(); s.states.rows[0].title = 'Changed';
  const after = view.materializeNativeSurfaceView(p, s);
  assert.deepEqual(after.children.map(row => row.surface), output.children.map(row => row.surface).reverse());
  assert.deepEqual(after.children.map(row => row.children[0].key.value), output.children.map(row => row.children[0].key.value).reverse());
  assert.equal(after.children[0].children[0].children[0].text.value, 'Changed');
});

test('nested Surface scopes inherit typed parent identities and absent parents short-circuit descendants', () => {
  const p = program(`<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row" present={item.shown}><RMT.View><RMT.Text value={item.title}/></RMT.View><RMT.Repeat from={item.children} keyBy={item.id}><RMT.Surface id="child"><RMT.View><RMT.Text value={item.title}/></RMT.View></RMT.Surface></RMT.Repeat></RMT.Surface></RMT.Repeat>`), s = snapshot(p);
  const rows = scopes.materializeNativeSurfaceScopes(p, s).instances;
  const child = rows.find(row => row.surfaceId === 'child');
  assert.deepEqual(child.keys, [1, 'a']); assert.equal(child.parentId, rows.find(row => row.surfaceId === 'row' && row.keys[0] === 1).id);
  const output = view.materializeNativeSurfaceView(p, s); assert.equal(output.children[0].children[1].surface, child.id);
  s.states.rows[0].shown = false; s.states.rows[0].children = null;
  assert.equal(scopes.materializeNativeSurfaceScopes(p, s).instances.length, 1);
  assert.equal(view.materializeNativeSurfaceView(p, s).children.length, 1);
});

test('true Mount guards cannot be raised by caller admission and propagate to child scopes', () => {
  const p = program('<RMT.Surface id="parent"><RMT.Lane name="visible"><RMT.Mount target="parent" when={model.ui.enabled}/></RMT.Lane><RMT.View/><RMT.Surface id="child"><RMT.View><RMT.Text value="child"/></RMT.View></RMT.Surface></RMT.Surface>'), s = snapshot(p);
  s.states.ui.enabled = false;
  assert.deepEqual(view.materializeNativeSurfaceView(p, s, undefined, {parent: true, child: true}).children, []);
  s.states.ui.enabled = true; assert.equal(view.materializeNativeSurfaceView(p, s).children[0].children[0].surface, 'child');
});

test('public named slots retain direct element/control children and wrap only named text', () => {
  const p = program('<RMT.Surface id="owner"><RMT.View><RMT.Component tag="x-header"><RMT.Slot name="title"><RMT.Text value="Title"/></RMT.Slot><RMT.Slot name="actions"><RMT.Element tag="button"><RMT.Text value="HTML"/></RMT.Element><RMT.Component tag="x-button"><RMT.Text value="Control"/></RMT.Component></RMT.Slot></RMT.Component></RMT.View></RMT.Surface>'), s = snapshot(p);
  const component = view.materializeNativeSurfaceView(p, s).children[0].children[0];
  assert.equal(component.type, 'component'); assert.equal(component.component, 'x-header');
  assert.deepEqual(component.children.map(row => row.tag), ['span', 'button', 'x-button']);
  assert.deepEqual(component.children.map(row => row.attributes.slot.value), ['title', 'actions', 'actions']);
  assert.equal(component.children[2].children[0].type, 'text'); assert.equal(component.children[2].children[0].text.value, 'Control');
  assert.equal(Object.hasOwn(component, 'slots'), false);
});

test('repeated native events derive trusted typed keys without accepting spoofed detail or getters', () => {
  const p = program(`<RMT.Repeat from={model.rows} keyBy={item.id}><RMT.Surface id="row"><RMT.View/><RMT.On event="select" action="select" payload={{}} keys={{rowId:0}}/></RMT.Surface></RMT.Repeat>`), s = snapshot(p);
  const events = scopes.materializeNativeSurfaceEvents(p, s);
  assert.equal(events.events.length, 2); assert.notEqual(events.events[0].id, events.events[1].id);
  const detail = { __rmtxScopedKeys: {k0: 'spoof'}, ordinary: 1 }; let reads = 0;
  Object.defineProperty(detail, 'danger', {enumerable: true, get() {reads++; return 'bad';}});
  const wrapped = scopes.scopeNativeEvent({type: 'select', detail}, [1]);
  assert.equal(reads, 0); assert.equal(wrapped.detail.__rmtxScopedKeys.k0, 1); assert.equal(detail.__rmtxScopedKeys.k0, 'spoof');
  assert.equal(Object.isFrozen(detail), false);
  assert.notEqual(events.events[0].target, events.events[1].target);
});

test('Source7 validation is exact and rejects accessor plans before executing getters', () => {
  const p = program(repeated('<RMT.Text value={item.title}/>'));
  assert.throws(() => view.validateNativeSurfaceViewProgram({...p, schema: 'xtend.rmt.app-orchestration.v4'}));
  let reads = 0; const bad = {...p}; Object.defineProperty(bad, 'render', {enumerable: true, get() {reads++; return p.render;}});
  assert.throws(() => view.validateNativeSurfaceViewProgram(bad)); assert.equal(reads, 0);
});

test('provider-owned roots remain opaque to real renderer commits and repeated owner reorders', async () => {
  const fs = require('node:fs'), { JSDOM } = require('jsdom');
  const reference = require('../../development/rmtx-a06/native-orchestration-profile/reference.cjs');
  const compiled = reference.compiler().compileSource({text: fs.readFileSync(reference.source, 'utf8'), filePath: reference.source}, {componentInterfaceCatalog: reference.catalog()});
  assert.equal(compiled.ok, true, JSON.stringify(compiled.diagnostics));
  const p = compiled.orchestrationArtifacts, s = snapshot(p), dom = new JSDOM('<main></main>');
  const { createRmtDomDescriptorRenderer } = await import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
  const renderer = createRmtDomDescriptorRenderer({documentTarget: dom.window.document, componentRegistry: view.createNativeComponentRegistry(p)}), target = dom.window.document.querySelector('main');
  const bindings = require('../../tools/xtensions/state-binding');
  const artifact = bindings.validateOrchestratedStateBindingArtifact(compiled.xtensionBindings, p);
  const rows = bindings.materializeOrchestratedStateBindingArtifact(artifact, s);
  const collect = node => !node || typeof node !== 'object' ? [] : (Array.isArray(node) ? node.flatMap(collect) : [node, ...collect(node.children)]);
  const commit = () => {
    const descriptor = view.materializeNativeSurfaceView(p, s);
    for (const row of rows) assert.equal(Object.hasOwn(collect(descriptor).find(node => node.surface === row.hostSurface), 'children'), false, 'foreign root must omit children entirely');
    renderer.commit({operation: 'reconcile-children', target, descriptors: descriptor.children});
  };
  try {
    commit();
    const own = new Map();
    for (const row of rows) {
      const host = [...target.querySelectorAll('[data-maraca-surface]')].find(node => node.getAttribute('data-maraca-surface') === row.hostSurface);
      assert.ok(host); const content = dom.window.document.createElement('span'); content.textContent = JSON.stringify(row.binding.address.keys);
      host.append(content); own.set(row.hostSurface, {host, content});
    }
    s.states.catalog.items.reverse(); commit();
    for (const row of rows) {
      const {host, content} = own.get(row.hostSurface);
      assert.ok([...target.querySelectorAll('[data-maraca-surface]')].find(node => node.getAttribute('data-maraca-surface') === row.hostSurface) === host, 'Reordering retains the exact provider host element');
      assert.ok(host.firstChild === content, 'Native reconciliation retains the exact framework-owned subtree node');
    }
  } finally {renderer.dispose(target, {clearOwnedDom: true}); dom.window.close();}
});


test('Source7 component registry grants only compiled metadata and forwards trusted hooks without freezing their owner',async()=>{
 const p=program('<RMT.Surface id="owner"><RMT.View><RMT.Component tag="x-button" properties={{title:"Allowed"}}/></RMT.View></RMT.Surface>');
 let resolverCalls=0;const supplied={calls:[],resolveComponentCapability(){resolverCalls++;return{properties:['value','innerHTML','title']};},buildComponentDescriptor(){throw Error('A supplied descriptor resolver cannot be forwarded.');},ensureTags(tags){assert.ok(this===supplied,'Trusted hooks retain their own registry receiver');this.calls.push(['ensure',tags]);return'tags';},hydrate(...args){assert.ok(this===supplied,'Trusted hooks retain their own registry receiver');this.calls.push(['hydrate',...args]);return'hooks';},bindComponentInstance(...args){this.calls.push(['bind',...args]);return'bound';},snapshot(){return this.calls;}};
 const registry=view.createNativeComponentRegistry(p,supplied);assert.equal(Object.isFrozen(registry),true);assert.equal(Object.isFrozen(supplied),false);assert.equal(Object.isFrozen(supplied.calls),false);
 assert.deepEqual(registry.resolveComponentCapability('x-button'),{properties:['title']});assert.equal(registry.resolveComponentCapability('x-header'),null);assert.equal(registry.resolveComponentCapability('unlisted'),null);assert.equal(resolverCalls,0);
 assert.equal(Object.isFrozen(registry.resolveComponentCapability('x-button').properties),true);assert.throws(()=>registry.resolveComponentCapability('x-button').properties.push('value'));
 assert.equal(registry.buildComponentDescriptor,undefined);assert.equal(registry.ensureTags(['x-button']),'tags');assert.equal(registry.hydrate('target',['x-button'],{}),'hooks');assert.equal(registry.bindComponentInstance('node'),'bound');assert.ok(registry.snapshot()===supplied.calls,'Operational snapshots retain their supplied contract');assert.equal(supplied.calls.length,3);
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<main></main>'),{createRmtDomDescriptorRenderer}=await import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
 const renderer=createRmtDomDescriptorRenderer({documentTarget:dom.window.document,componentRegistry:registry});
 try{const descriptor=view.materializeNativeSurfaceView(p,snapshot(p));renderer.preflight({operation:'reconcile-children',target:dom.window.document.querySelector('main'),descriptors:descriptor.children});const bad=structuredClone(descriptor);bad.children[0].children[0].properties.value={op:'literal',value:'outside'};assert.throws(()=>renderer.preflight({operation:'reconcile-children',target:dom.window.document.querySelector('main'),descriptors:bad.children}),/Property|property/);}finally{renderer.dispose();dom.window.close();}
 const omitted=view.NATIVE_ORCHESTRATION_VIEW_RUNTIME.createComponentRegistry(p,{ensureTags:'not a function',snapshot:42});assert.equal(Object.hasOwn(omitted,'ensureTags'),false);assert.equal(Object.hasOwn(omitted,'snapshot'),false);
 let reads=0;const bad=Object.defineProperty({...p},'render',{enumerable:true,get(){reads++;return p.render;}});assert.throws(()=>view.createNativeComponentRegistry(bad,supplied));assert.equal(reads,0);
});


test('Header2 cannot forge a component tag, source hash or wider reviewed sinks to grant Renderer capabilities',()=>{
 const p=program('<RMT.Surface id="owner"><RMT.View><RMT.Component tag="x-button"/></RMT.View></RMT.Surface>');
 for(const mutate of [metadata=>{metadata.tag='x-writer';metadata.module='components/xwriter.js';metadata.properties=['value'];},metadata=>{metadata.properties.push('value');},metadata=>{metadata.attributes.push('data-label');},metadata=>{metadata.slots.push('invented');},metadata=>{metadata.sha256='0'.repeat(64);},metadata=>{metadata.module='components/xheader.js';}]){
  const forged=structuredClone(p);mutate(forged.render.nativeView.components[0]);assert.throws(()=>view.validateNativeSurfaceViewProgram(forged),/reviewed captured runtime catalog/);assert.throws(()=>view.createNativeComponentRegistry(forged,{resolveComponentCapability:()=>({properties:['value']})}),/reviewed captured runtime catalog/);
 }
});

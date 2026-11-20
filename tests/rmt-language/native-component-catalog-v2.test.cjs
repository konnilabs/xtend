// SPDX-License-Identifier: Apache-2.0
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const catalog = require('../../tools/rmt-language/rmtx-native-components-v2');
const contract = require('../../tools/xtensions/native-component-contract-v2');
const managed = require('../../tools/xtensions/native-component-managed');
const root = path.resolve(__dirname, '../..');
const owner = { documentId: 'doc', surfaceId: 'editor', controllerId: 'controller', generation: 1 };
let sequence = 0;
function fixture(tag = 'x-input', options = {}) {
  class Element extends EventTarget {
    constructor() { super(); this.localName = tag; this.attributes = new Map(); this.writes = []; this.ownerDocument = { defaultView: { File } }; }
    setAttribute(name, value) { this.attributes.set(name, value); this.writes.push(['attribute', name, value]); }
    removeAttribute(name) { this.attributes.delete(name); this.writes.push(['remove', name]); }
    getAttribute(name) { return this.attributes.has(name)?this.attributes.get(name):null; }
    set value(value) { this.writes.push(['property', 'value', value]); this._value = value; }
    get value() { return this._value; }
  }
  Object.defineProperty(Element, managed.MANAGED_NATIVE_CLASS, { value: Object.freeze({ apiVersion: '2.0.0', tag }) });
  const element = new Element(), descriptor = catalog.getRmtxNativeComponentV2(tag);
  const context = managed.prepareNativeComponent(element, { descriptor, owner, ref: 'field' + (++sequence), keys: [], ports: {}, isCurrent: () => true, ...options });
  context.connect();
  return { element, descriptor, context };
}
test('catalog2 classifies the exact manifest rather than approving every ShadowRoot', () => {
  const value = catalog.getRmtxNativeComponentCatalogV2();
  assert.deepEqual(value.counts, { ui: 36, platform: 6, service: 4, demo: 1 });
  assert.deepEqual(value.components.map(row => row.tag).sort(), Object.keys(require('../../components/manifest.json')).sort());
  assert.equal(value.components.length, 47);
  assert.ok(value.components.every(row => row.status.verification === 'pending'));
  assert.ok(value.components.every(row => row.dependencies.length > 0));
  for (const tag of ['x-theme', 'x-utils', 'xtend-i18n', 'xtend-state', 'x-rmt-lifecycle-demo-build']) assert.throws(() => catalog.getRmtxNativeComponentV2(tag), /productive CustomElement/);
});
test('captured metadata cannot grant extra global attributes, setters, commands or a replacement class', () => {
  const descriptor = catalog.getRmtxNativeComponentV2('x-input');
  for (const property of ['innerHTML', 'onclick', 'style', 'data-rmt-owner']) {
    const changed = JSON.parse(JSON.stringify(descriptor)); changed.properties[property] = { type: 'string' };
    assert.throws(() => contract.validateCapturedNativeComponentMetadataV2(changed));
  }
  const changed = JSON.parse(JSON.stringify(descriptor)); changed.properties.title = { type: 'string' };
  assert.throws(() => catalog.validateRmtxNativeComponentsV2([changed]), /differs/);
  assert.throws(() => managed.assertNativeComponentClass(class {}, descriptor), /not the pinned/);
});
test('declared structured props are typed while attributes stay scalar and closed', () => {
  const select = catalog.getRmtxNativeComponentV2('x-select');
  assert.doesNotThrow(() => contract.validateNativeComponentValuesV2(select, { properties: { values: ['red', 'green'] } }));
  assert.throws(() => contract.validateNativeComponentValuesV2(select, { properties: { values: ['red', 1] } }));
  assert.throws(() => contract.validateNativeComponentValuesV2(select, { attributes: { value: ['red'] } }));
  assert.throws(() => contract.validateNativeComponentValuesV2(select, { attributes: { 'aria-hidden': 'true' } }));
  assert.throws(() => contract.validateNativeValueV2({ value: 'x', unexpected: true }, { type: 'object', fields: { value: { type: 'string' } } }));
});
test('platform metadata exposes actual UI flags and assertions, while Controller state requires commands',()=>{
 const expected={
  'x-surface-region':['role','surface-id'],
  'x-surface-window':['draggable','resizable','surface-id'],
  'x-side-panel':['closable','collapsable','collapsible','pinnable','resizable','surface-id'],
  'x-surface-manager':['manager-id']
 };
 const authored=require('../../development/rmtx-a06/native-component-catalog/catalog.cjs').definitions;
 for(const [tag,attributes]of Object.entries(expected)){
  const metadata=catalog.getRmtxNativeComponentV2(tag);
  assert.deepEqual(Object.keys(metadata.attributes).sort(),attributes);
  assert.deepEqual(metadata.properties,{});assert.deepEqual(metadata.state.controlled,[]);
  assert.deepEqual(Object.keys(authored[tag].attributes).sort(),attributes,'no later authored override may restore unsupported sinks');
  for(const name of ['open','label','initial-width','collapsed','layout'])assert.throws(()=>contract.validateNativeComponentValuesV2(metadata,{attributes:{[name]:'ignored'}}),/Controller-owned.*command/);
 }
});
test('Model-controlled header, keymap and lightbox focus paths carry their explicit owner capability',()=>{
 for(const tag of ['x-header','x-keymap','x-lightbox']){
  const metadata=catalog.getRmtxNativeComponentV2(tag);
  assert.ok(metadata.capabilities.includes('focus.request'),tag+' requires the owner focus port');
  const calls=[],f=fixture(tag,{ports:{dispatch(capability,args,lease){calls.push({capability,args,owner:lease.owner});return null;}}});
  f.context.request('focus.request',{part:'surface'});
  assert.equal(calls.length,1);assert.deepEqual(calls[0].owner,owner);
  managed.disposeNativeComponent(f.element);
 }
});
test('every reviewed runtime request path has its own tag grant, while unknown requests fail before dispatch',()=>{
 const {runtimeRequests}=require('../../development/rmtx-a06/native-component-catalog/matrix-capabilities.cjs');
 const authored=require('../../development/rmtx-a06/native-component-catalog/catalog.cjs').definitions;
 const rows=catalog.getRmtxNativeComponentCatalogV2().components;
 assert.deepEqual(Object.keys(runtimeRequests).sort(),rows.map(row=>row.tag).sort(),'the manual audit covers all shipped roles');
 for(const row of rows){
  for(const capability of runtimeRequests[row.tag]){
   assert.ok(row.capabilities.includes(capability),row.tag+' captured grant '+capability);
   assert.ok(authored[row.tag].capabilities.includes(capability),row.tag+' authored grant '+capability);
  }
  if(!['ui','platform'].includes(row.role))continue;
  let dispatched=false;const f=fixture(row.tag,{ports:{dispatch(){dispatched=true;}}});
  assert.throws(()=>f.context.request('diagnostic.undeclared',{}),/trusted injected port/);
  assert.equal(dispatched,false,'an unknown request must not reach any host');managed.disposeNativeComponent(f.element);
 }
 // A new literal port must be classified manually, including shared helpers.
 // This check never infers the tags or mutates the actual grant list.
 const approved=new Set(Object.values(runtimeRequests).flat());
 for(const file of fs.readdirSync(path.join(root,'components')).filter(name=>name.endsWith('.definition.js')||/^native-.*\.js$/.test(name))){
  const source=fs.readFileSync(path.join(root,'components',file),'utf8');
  const literals=[...source.matchAll(/\brequestManaged\s*\([^,]+,\s*['"]([^'"]+)['"]/g),...source.matchAll(/\.request\s*\(\s*['"]([^'"]+)['"]/g)];
  for(const match of literals)assert.ok(approved.has(match[1]),file+' contains an unreviewed literal capability '+match[1]);
 }
});
test('calendar controlled civil dates reject invalid days before any setter regardless of timezone',()=>{
 const descriptor=catalog.getRmtxNativeComponentV2('x-calendar');
 for(const value of ['2026-02-29','2026-13-01','2026-04-31','2026-01-00','2026-1-1','0000-01-01'])assert.throws(()=>contract.validateNativeComponentValuesV2(descriptor,{properties:{viewDate:value}}),/civil/);
 assert.doesNotThrow(()=>contract.validateNativeComponentValuesV2(descriptor,{properties:{viewDate:'2024-02-29',value:''}}));
});
test('prepare precedes all author properties and a whole update validates before any setter', () => {
  const { element } = fixture(); assert.deepEqual(element.writes, []);
  assert.throws(() => managed.updateNativeComponent(element, { properties: { value: 'safe', innerHTML: 'unsafe' } }), /Undeclared/);
  assert.deepEqual(element.writes, []);
  managed.updateNativeComponent(element, { attributes: { disabled: true, placeholder: 'Email' }, properties: { value: 'hello' } });
  assert.deepEqual(element.writes, [['attribute', 'disabled', ''], ['attribute', 'placeholder', 'Email'], ['property', 'value', 'hello']]);
  managed.disposeNativeComponent(element);
});
test('events use canonical declared DTO projections and immutable typed owner keys', () => {
  const calls = [];
  const { element, context } = fixture('x-input', { keys: ['row', 4], ports: { dispatchValidatedIntent: (action, payload, lease) => calls.push({ action, payload, keys: lease.keys }) } });
  managed.bindNativeComponentEvents(element, [{ event: 'input-changed', action: 'form.changed', payload: { value: 'detail.value' } }]);
  context.emit('input-changed', { detail: { value: 'alice', source: 'input', instrumentation: 100 } });
  assert.deepEqual(calls, [{ action: 'form.changed', payload: { value: 'alice' }, keys: ['row', 4] }]);
  assert.ok(Object.isFrozen(calls[0].payload));
  assert.throws(() => context.emit('input-changed', { detail: { value: 2 } }));
  assert.throws(() => context.emit('input-changed', { detail: { value: 'x', raw: new Event('input') } }), /plain objects/);
  assert.throws(() => managed.bindNativeComponentEvents(element, [{ event: 'input-changed', action: 'form.changed', payload: { value: 'detail.invented' } }]), /undeclared/);
  assert.equal(calls.length, 1); managed.disposeNativeComponent(element);
});
test('property updates never echo user intents', () => {
  const calls = [], { element, context } = fixture('x-input', { ports: { dispatchValidatedIntent: (...args) => calls.push(args) } });
  managed.bindNativeComponentEvents(element, [{ event: 'input-changed', action: 'form.changed', payload: { value: 'detail.value' } }]);
  Object.defineProperty(element, 'value', { set(value) { context.emit('input-changed', { detail: { value } }); } });
  managed.updateNativeComponent(element, { properties: { value: 'from-model' } });
  assert.equal(calls.length, 0); context.emit('input-changed', { detail: { value: 'from-user' } }); assert.equal(calls.length, 1);
  managed.disposeNativeComponent(element);
});
test('compiled lexical event guards use a required exact live Model gate with strict Boolean results',()=>{
 let enabled=false;const calls=[],guards=[];const {element,context}=fixture('x-input',{ports:{isNativeEventEnabled(id,lease){guards.push([id,lease.ref]);return enabled;},dispatchValidatedIntent(...args){calls.push(args);}}});
 managed.bindNativeComponentEvents(element,[{event:'input-changed',eventId:'event:input',action:'form.changed',payload:{value:'detail.value'}}]);
 context.emit('input-changed',{detail:{value:'disabled'}});assert.equal(calls.length,0);enabled=true;context.emit('input-changed',{detail:{value:'enabled'}});assert.equal(calls.length,1);assert.deepEqual(guards.map(row=>row[0]),['event:input','event:input']);managed.disposeNativeComponent(element);
 const absent=fixture();managed.bindNativeComponentEvents(absent.element,[{event:'input-changed',eventId:'event:input',action:'form.changed',payload:{value:'detail.value'}}]);assert.throws(()=>absent.context.emit('input-changed',{detail:{value:'x'}}),/condition port/);managed.disposeNativeComponent(absent.element);
 const truthy=fixture('x-input',{ports:{isNativeEventEnabled(){return 1;}}});managed.bindNativeComponentEvents(truthy.element,[{event:'input-changed',eventId:'event:input',action:'form.changed',payload:{value:'detail.value'}}]);assert.throws(()=>truthy.context.emit('input-changed',{detail:{value:'x'}}),/strict Boolean/);managed.disposeNativeComponent(truthy.element);
});
test('distinct compiled On routes share one DOM listener and each evaluate their own condition exactly once',()=>{
 const calls=[];let first=true;const {element,context}=fixture('x-input',{ports:{isNativeEventEnabled(id){return id==='event:first'?first:true;},dispatchValidatedIntent(action){calls.push(action);}}});
 const bindings=[{event:'input-changed',eventId:'event:first',action:'first',payload:{value:'detail.value'}},{event:'input-changed',eventId:'event:second',action:'second',payload:{value:'detail.value'}}];
 managed.bindNativeComponentEvents(element,bindings);context.emit('input-changed',{detail:{value:'a'}});assert.deepEqual(calls,['first','second']);calls.length=0;
 first=false;context.emit('input-changed',{detail:{value:'b'}});assert.deepEqual(calls,['second']);calls.length=0;first=true;
 const event=new Event('input-changed');Object.defineProperty(event,'detail',{value:{value:'c'}});element.dispatchEvent(event);assert.deepEqual(calls,['first','second'],'one DOM event must not produce squared route fanout');
 assert.throws(()=>managed.bindNativeComponentEvents(element,[{event:'input-changed',action:'first',payload:{}},{event:'input-changed',action:'second',payload:{}}]),/unique event names/);managed.disposeNativeComponent(element);
});
test('refs retain full typed key tuples and commands dispatch through the actual authority port', async () => {
  const ref = 'keyed' + (++sequence), calls = [];
  const port = { dispatchComponentCommand: async (capability, operation, lease) => { calls.push({ capability, keys: lease.keys }); return operation.invoke(); } };
  const a = fixture('x-input', { ref, keys: [1], ports: port }), b = fixture('x-input', { ref, keys: ['1'], ports: port });
  a.context.registerCommand('focus', () => null); b.context.registerCommand('focus', () => null);
  assert.equal(await managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + ref, keys: [1], command: 'focus', args: {} }), null);
  assert.equal(await managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + ref, keys: ['1'], command: 'focus', args: {} }), null);
  assert.deepEqual(calls.map(call => call.keys), [[1], ['1']]);
  assert.throws(() => fixture('x-input', { ref, keys: [1] }), /Duplicate/);
  await assert.rejects(managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + ref, keys: [], command: 'focus', args: {} }), /no active/);
  await assert.rejects(managed.dispatchNativeComponentCommand({ owner, target: 'other.' + ref, keys: [1], command: 'focus', args: {} }), /owning Surface/);
  managed.disposeNativeComponent(a.element); managed.disposeNativeComponent(b.element);
});
test('commands reject missing sidecars, unsupported operations and authority no-ops', async () => {
  const { element, context } = fixture('x-input', { ports: { dispatchComponentCommand: () => null } });
  context.registerCommand('focus', () => null);
  await assert.rejects(managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + context.ref, command: 'focus', args: {} }), /did not invoke/);
  await assert.rejects(managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + context.ref, command: 'remove', args: {} }), /Undeclared/);
  await assert.rejects(managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + context.ref, command: 'focus', args: { selector: 'body' } }), /unsupported/);
  managed.disposeNativeComponent(element);
});
test('async commands and capability results are fenced by the original lifetime', async () => {
  let finish, release = 0;
  const { element, context } = fixture('x-input', { ports: { dispatch: () => new Promise(resolve => { finish = resolve; }) } });
  const pending = context.request('file.read', { operation: 'read' }); managed.disposeNativeComponent(element); finish({ release() { release++; } });
  await assert.rejects(pending, /no longer belongs/); assert.equal(release, 1);
  let settle;
  const second = fixture('x-input', { ports: { dispatchComponentCommand: (_cap, operation) => operation.invoke() } });
  second.context.registerCommand('focus', () => new Promise(resolve => { settle = resolve; }));
  const command = managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + second.context.ref, command: 'focus', args: {} });
  managed.disposeNativeComponent(second.element); settle(null); await assert.rejects(command, /no longer belongs/);
});
test('suspension preserves handles but blocks business events and commands until resumed', async () => {
  const calls = [], { element, context } = fixture('x-input', { ports: { dispatchValidatedIntent: (...args) => calls.push(args), dispatchComponentCommand: (_cap, operation) => operation.invoke() } });
  managed.bindNativeComponentEvents(element, [{ event: 'input-changed', action: 'form.changed', payload: { value: 'detail.value' } }]); context.registerCommand('focus', () => null);
  managed.suspendNativeComponent(element); assert.equal(context.emit('input-changed', { detail: { value: 'x' } }), false);
  await assert.rejects(managed.dispatchNativeComponentCommand({ owner, target: 'editor.' + context.ref, command: 'focus', args: {} }), /suspended/);
  managed.resumeNativeComponent(element); context.emit('input-changed', { detail: { value: 'y' } }); assert.equal(calls.length, 1);
  managed.disposeNativeComponent(element);
});
test('a resumed component cannot accept results from the previous aborted activation',async()=>{
 let finish,released=0;const {element,context}=fixture('x-input',{ports:{dispatch(){return new Promise(resolve=>{finish=resolve;});}}});
 const resource=context.request('file.read',{});managed.suspendNativeComponent(element);managed.resumeNativeComponent(element);finish({release(){released++;}});await assert.rejects(resource,/aborted activity/);assert.equal(released,1);managed.disposeNativeComponent(element);
 let settle;const second=fixture('x-input',{ports:{dispatchComponentCommand(_cap,operation){return operation.invoke();}}});second.context.registerCommand('focus',()=>new Promise(resolve=>{settle=resolve;}));
 const command=managed.dispatchNativeComponentCommand({owner,target:'editor.'+second.context.ref,command:'focus',args:{}});managed.suspendNativeComponent(second.element);managed.resumeNativeComponent(second.element);settle(null);await assert.rejects(command,/aborted activity/);managed.disposeNativeComponent(second.element);
});
test('only genuine private platform terminal receipts may finish after their own deactivation',async()=>{
 const receipts=new WeakSet();let original,checks=0;const f=fixture('x-surface-region',{ports:{dispatchComponentCommand(_cap,operation){return operation.invoke();},verifyNativeTerminalReceipt(command,raw){checks++;assert.equal(command,'close');assert.ok(raw===original,'verification must retain the original raw identity');return receipts.has(raw);}}});
 f.context.registerCommand('close',()=>{original={ok:true,status:'closed'};receipts.add(original);managed.suspendNativeComponent(f.element);return original;});
 const result=await managed.dispatchNativeComponentCommand({owner,target:'editor.'+f.context.ref,command:'close',args:{}});assert.deepEqual(result,{ok:true,status:'closed'});assert.ok(result!==original);assert.equal(checks,2);assert.equal(f.context.isActive(),false);assert.equal(f.context.isAlive(),true);managed.disposeNativeComponent(f.element);
 const forged=fixture('x-surface-region',{ports:{dispatchComponentCommand(_cap,operation){return operation.invoke();},verifyNativeTerminalReceipt(_command,raw){return receipts.has(raw);}}});forged.context.registerCommand('close',()=>{managed.suspendNativeComponent(forged.element);return{ok:true,status:'closed'};});await assert.rejects(managed.dispatchNativeComponentCommand({owner,target:'editor.'+forged.context.ref,command:'close',args:{}}),/private Controller commit receipt/);managed.disposeNativeComponent(forged.element);
 const ui=fixture('x-dialog',{ports:{dispatchComponentCommand(_cap,operation){return operation.invoke();},verifyNativeTerminalReceipt(){return true;}}});ui.context.registerCommand('close',()=>{managed.suspendNativeComponent(ui.element);return null;});await assert.rejects(managed.dispatchNativeComponentCommand({owner,target:'editor.'+ui.context.ref,command:'close',args:{}}),/suspended/);managed.disposeNativeComponent(ui.element);
});
test('File objects cross as scoped handles and cannot be resolved after disposal or by another component', () => {
  let lease;
  const { element, context } = fixture('x-input', { ports: { dispatch(_cap, _args, value) { lease = value; } } });
  const file = new File(['hi'], 'hello.txt', { type: 'text/plain', lastModified: 1 });
  const dto = context.captureFile(file); context.request('file.read', { handle: dto.handle });
  assert.equal(typeof dto.handle, 'string'); assert.ok(lease.resolveFile(dto.handle) === file);
  assert.throws(() => context.captureFile({ name: 'fake' }), /real scoped File/);
  const other = fixture('x-input', { ports: { dispatch(_cap, _args, otherLease) { assert.throws(() => otherLease.resolveFile(dto.handle), /absent/); } } });
  other.context.request('file.read', { handle: dto.handle }); managed.disposeNativeComponent(element);
  assert.throws(() => lease.resolveFile(dto.handle), /no longer belongs/); managed.disposeNativeComponent(other.element);
});
test('a held File lease stays revoked after Suspend/Resume while a fresh lease can resolve the same lifetime File',()=>{
 const leases=[],f=fixture('x-input',{ports:{dispatch(_cap,_args,lease){leases.push(lease);return null;}}});
 const file=new File(['owned'],'owned.txt'),dto=f.context.captureFile(file);
 f.context.request('file.read',{handle:dto.handle});const old=leases[0];assert.equal(old.isActive(),true);assert.ok(old.resolveFile(dto.handle)===file);
 managed.suspendNativeComponent(f.element);assert.equal(old.signal.aborted,true);assert.equal(old.isCurrent(),true);assert.equal(old.isActive(),false);assert.throws(()=>old.resolveFile(dto.handle),/suspended|admitted/);
 managed.resumeNativeComponent(f.element);assert.equal(f.context.isActive(),true);assert.equal(old.isCurrent(),true);assert.equal(old.isActive(),false);assert.throws(()=>old.resolveFile(dto.handle),/aborted activity/);
 f.context.request('file.read',{handle:dto.handle});const fresh=leases[1];assert.ok(fresh!==old);assert.equal(fresh.isActive(),true);assert.ok(fresh.resolveFile(dto.handle)===file);assert.equal(old.isActive(),false);
 managed.disposeNativeComponent(f.element);assert.equal(fresh.isActive(),false);assert.throws(()=>fresh.resolveFile(dto.handle),/no longer belongs/);
});
test('lifetime admits passive Model projection while activation separately releases and reacquires UI work',()=>{
  let admitted=false,resumes=0,suspends=0;
  const {element,context}=fixture('x-input',{isActive:()=>admitted});
  context.registerActivityHooks({resume(){resumes++;},suspend(){suspends++;}});
  assert.equal(context.isCurrent(),true);assert.equal(context.isActive(),false);
  managed.updateNativeComponent(element,{properties:{value:'passive'}});assert.equal(element.value,'passive');assert.equal(resumes,0);
  assert.throws(()=>context.request('file.read',{}),/not admitted/);
  admitted=true;managed.synchronizeNativeComponentActivity(element);assert.equal(context.isActive(),true);assert.equal(resumes,1);const previous=context.activitySignal;
  managed.suspendNativeComponent(element);assert.equal(previous.aborted,true);assert.equal(suspends,1);assert.equal(context.isCurrent(),true);
  managed.updateNativeComponent(element,{properties:{value:'while-suspended'}});assert.equal(resumes,1);
  managed.resumeNativeComponent(element);assert.equal(resumes,2);assert.equal(context.activitySignal.aborted,false);
  admitted=false;managed.synchronizeNativeComponentActivity(element);context.connect();assert.equal(resumes,2);assert.equal(suspends,2);
  managed.disposeNativeComponent(element);assert.equal(context.isCurrent(),false);
});
test('removed controlled fields restore their original baselines inside the same echo-suppressed transaction',()=>{
  const {element,context}=fixture();element.setAttribute('placeholder','baseline');element.value='original';element.writes=[];
  managed.updateNativeComponent(element,{attributes:{placeholder:'managed',disabled:true},properties:{value:'controlled'}});
  let guarded=false;Object.defineProperty(element,'value',{get(){return this._value;},set(value){guarded=context.isApplyingUpdate();this._value=value;}});
  managed.updateNativeComponent(element,{attributes:{},properties:{}});
  assert.equal(element.getAttribute('placeholder'),'baseline');assert.equal(element.getAttribute('disabled'),null);assert.equal(element.value,'original');assert.equal(guarded,true);managed.disposeNativeComponent(element);
});
test('cross-property projection validates final DTO before setters and commits once after the transaction',()=>{
  const {element,context}=fixture('x-select');element.values=[];element.multiple=false;let projections=0;
  context.registerProjectionValidator(({properties})=>{if(properties.values.length>1&&!properties.multiple)throw new TypeError('multiple required');});
  context.onProjection(({properties})=>{assert.equal(context.isApplyingUpdate(),true);assert.deepEqual(properties.values,['a','b']);projections++;});
  assert.throws(()=>managed.updateNativeComponent(element,{properties:{values:['a','b'],multiple:false}}),/multiple required/);assert.deepEqual(element.values,[]);
  managed.updateNativeComponent(element,{properties:{values:['a','b'],multiple:true}});assert.equal(projections,1);managed.disposeNativeComponent(element);
});
test('source verification captures helper bytes, not only manifest entry hashes', () => {
  const row = catalog.getRmtxNativeComponentV2('x-input'), fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'native-component-catalog-'));
  try {
    fs.mkdirSync(path.join(fixtureRoot, 'components'), { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, 'package.json'), JSON.stringify({ name: '@ccslabs/xtend' }));
    fs.copyFileSync(path.join(root, 'components/manifest.json'), path.join(fixtureRoot, 'components/manifest.json'));
    for (const capture of [{ module: row.module }, ...row.dependencies]) { const target = path.join(fixtureRoot, capture.module); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(root, capture.module), target); }
    assert.doesNotThrow(() => catalog.verifyNativeComponentSourcesV2([row], { rootDir: fixtureRoot }));
    const helper = row.dependencies.find(item => item.module === 'components/native-managed.js'); assert.ok(helper);
    fs.appendFileSync(path.join(fixtureRoot, helper.module), '\n// changed helper\n');
    assert.throws(() => catalog.verifyNativeComponentSourcesV2([row], { rootDir: fixtureRoot }), /dependency bytes differ/);
  } finally { fs.rmSync(fixtureRoot, { recursive: true, force: true }); }
});

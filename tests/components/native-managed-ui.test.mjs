import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const browserErrors = [];
const consoleTarget = new VirtualConsole();
consoleTarget.on('jsdomError', (error) => { if (!/Not implemented:.*HTMLMediaElement/.test(error.message)) browserErrors.push(error); });
const dom = new JSDOM('<!doctype html><html><body><main></main></body></html>', { url: 'http://localhost/', pretendToBeVisual: true, virtualConsole: consoleTarget });
for (const name of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','MouseEvent','KeyboardEvent','File','FileList','customElements','localStorage','sessionStorage','MutationObserver','DOMParser','ShadowRoot','AbortController','AbortSignal']) globalThis[name] = dom.window[name];
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.ResizeObserver = globalThis.ResizeObserver;
// jsdom does not implement form-associated custom element form value APIs yet.
HTMLElement.prototype.attachInternals = function() { return { setFormValue() {}, setValidity() {}, checkValidity() { return true; }, reportValidity() { return true; } }; };
const { prepareNativeComponent, updateNativeComponent, bindNativeComponentEvents, disposeNativeComponent, resumeNativeComponent, dispatchNativeComponentCommand } = require('../../tools/xtensions/native-component-managed');
const { NATIVE_COMPONENT_CATALOG_V2 } = require('../../tools/xtensions/native-component-catalog-v2');
const manifest = JSON.parse(fs.readFileSync(new URL('../../components/manifest.json', import.meta.url)));
const descriptors = NATIVE_COMPONENT_CATALOG_V2.filter((entry) => entry.role === 'ui');
const definitions = new Map();
for (const descriptor of descriptors) definitions.set(descriptor.tag, await import(new URL(`../../${descriptor.managedModule}`, import.meta.url)));
const { xtendState } = await import('../../components/xtend-state.definition.js');
const { NATIVE_UI_COMMANDS } = await import('../../components/native-ui-profiles.js');
const { NATIVE_COMPONENT_CLASS } = await import('../../components/native-managed.js');
let sequence = 0;
const active = [];
function register(tag, module) {
  for (const [dependency, constructor] of module.nativeDependencies || []) if (!customElements.get(dependency)) customElements.define(dependency, constructor);
  if (!customElements.get(tag)) customElements.define(tag, module.default);
}
function create(tag, input = {}, bindings = []) {
  const descriptor = descriptors.find((entry) => entry.tag === tag);
  register(tag, definitions.get(tag));
  const element = document.createElement(tag), intents = [], requests = [], resources={overlayAcquires:0,overlayReleases:0,overlayLive:0,overlayPeak:0};
  const context = prepareNativeComponent(element, { descriptor, owner: { documentId:'ui-test', surfaceId:'surface', controllerId:'controller', generation:1 }, ref:`component${++sequence}`, keys:[], isCurrent:()=>true,
    ports:{ dispatch(capability,args) { requests.push({capability,args}); if(capability==='overlay.acquire'){resources.overlayAcquires++;resources.overlayLive++;resources.overlayPeak=Math.max(resources.overlayPeak,resources.overlayLive);let live=true;return {release(){if(!live)return false;live=false;resources.overlayLive--;resources.overlayReleases++;return true;}};} return capability === 'writer.save' ? { status: 200, response: null } : capability === 'writer.markdown' ? args.html.replace(/<[^>]*>/g, '') : null; }, dispatchValidatedIntent(action,payload) { intents.push({action,payload}); } } });
  bindNativeComponentEvents(element, bindings);
  updateNativeComponent(element, input);
  document.querySelector('main').append(element); active.push(element);
  return {element,context,intents,requests,resources};
}
function destroy(element) { element.remove(); disposeNativeComponent(element); }

test('all 36 UI imports are pure and export the exact managed-compatible shared class', () => {
  assert.equal(descriptors.length, 36);
  assert.equal(window.XTend, undefined);
  assert.equal(window.__xtendIconRegistry, undefined);
  for (const descriptor of descriptors) {
    const module = definitions.get(descriptor.tag);
    assert.equal(customElements.get(descriptor.tag), undefined, descriptor.tag);
    assert.equal(module.default[NATIVE_COMPONENT_CLASS].tag, descriptor.tag);
    assert.deepEqual([...NATIVE_UI_COMMANDS[descriptor.tag]].sort(), Object.keys(descriptor.commands).sort(), `command contract ${descriptor.tag}`);
  }
  assert.equal(xtendState.snapshot().listenerCount, 0);
});

test('every UI class mounts and releases without writing the Classic store or moving its host', () => {
  const before = structuredClone(xtendState.snapshot().data);
  for (const descriptor of descriptors) {
    const {element} = create(descriptor.tag);
    assert.ok(element.parentNode === document.querySelector('main'), `${descriptor.tag} keeps its owner`);
    assert.ok(element.shadowRoot, `${descriptor.tag} keeps actual implementation shadow`);
    destroy(element);
  }
  assert.deepEqual(xtendState.snapshot().data, before);
  assert.equal(xtendState.snapshot().listenerCount, 0);
  assert.equal(browserErrors.length, 0, browserErrors.map(error => error.message).join('; '));
});

test('input property updates are silent; input gestures deliver one normalized intent and reconnect releases listeners', () => {
  const {element,intents} = create('x-input', {properties:{value:'initial'}}, [{event:'input-changed',action:'form.changed',payload:{value:'detail.value'}}]);
  assert.equal(intents.length,0);
  element._input.value='edited'; element._input.dispatchEvent(new Event('input'));
  assert.deepEqual(intents,[{action:'form.changed',payload:{value:'edited'}}]);
  updateNativeComponent(element,{properties:{value:'projected'}}); assert.equal(intents.length,1);
  element.remove(); resumeNativeComponent(element); document.querySelector('main').append(element);
  element._input.value='again';element._input.dispatchEvent(new Event('input'));assert.equal(intents.length,2);
  destroy(element);
});

test('radio changes never uncheck another managed or Classic instance', () => {
  const a=create('x-radio',{attributes:{name:'group'},properties:{checked:true}}).element;
  const b=create('x-radio',{attributes:{name:'group'},properties:{checked:true}}).element;
  assert.equal(a.checked,true);assert.equal(b.checked,true);
  b._control.dispatchEvent(new Event('change'));assert.equal(a.checked,true);
  destroy(a);destroy(b);
});

test('code, hero, masonry, menu and tabs preserve author element identity and attributes', () => {
  for (const tag of ['x-code','x-hero','x-masonry','x-menu','x-tabs']) {
    const {element}=create(tag);
    const child=document.createElement(tag==='x-tabs'?'x-tab':'button');child.textContent='Author content';child.setAttribute('data-owner','rmt');child.className='original';
    if(tag==='x-hero')child.slot='hero-title';
    element.append(child); const attributes=child.outerHTML;
    if(tag==='x-code')updateNativeComponent(element,{properties:{code:'const answer = 42;'}});
    else if(tag==='x-hero')element.render();
    else if(tag==='x-masonry')element._renderItems();
    else if(tag==='x-menu')element._updateMenu();
    else element._renderTabs();
    assert.ok(element.firstElementChild===child,`${tag} retains author identity`);
    assert.equal(child.outerHTML,attributes,`${tag} retains author structure/attributes`);
    destroy(element);
  }
});

test('managed dismissals request state transitions while retaining the host', () => {
  for (const [tag,eventName] of [['x-alert','alert-dismissed'],['x-toast','toast-dismissed']]) {
    const {element,intents}=create(tag,{attributes:tag==='x-toast'?{duration:'0'}:{}},[{event:eventName,action:'dismiss',payload:{reason:'detail.reason'}}]);
    element.dismiss('button');assert.ok(element.isConnected);assert.equal(intents.at(-1).payload.reason,'button');destroy(element);
  }
});

test('writer sanitizes model HTML and delegates saving/export to the injected owner ports', async () => {
  const {element,requests,intents}=create('x-writer',{properties:{value:'<p>safe</p><img src="x" onerror="evil()"><script>evil()</script>'}},[{event:'writer:change',action:'writer.changed',payload:{html:'detail.html'}}]);
  assert.equal(/onerror|<script/i.test(element.getHTML()),false);assert.equal(intents.length,0);
  await element.save(false);element.exportHTML('test.html');
  assert.ok(requests.some(request=>request.capability==='writer.save'));assert.ok(requests.some(request=>request.capability==='writer.export'));
  destroy(element);
});

test.after(() => { for(const element of active) if(element.isConnected)destroy(element);dom.window.close(); });

test('managed Modal title stays text and cannot create executable or resource-bearing markup', () => {
  const title = '</div><img src="https://xtend.invalid/modal-title" onerror="evil()"><script>evil()</script>';
  const {element,requests} = create('x-modal', {attributes:{title}});
  const node = element.shadowRoot.querySelector('.x-modal-title');
  assert.equal(node.textContent, title);
  assert.equal(node.childElementCount, 0);
  assert.equal(element.shadowRoot.querySelectorAll('img,script').length, 0);
  assert.equal(requests.filter(request => request.capability === 'resource.image').length, 0);
  updateNativeComponent(element, {attributes:{title:'<strong>still plain</strong>'}});
  assert.equal(element.shadowRoot.querySelector('.x-modal-title').textContent, '<strong>still plain</strong>');
  assert.equal(element.shadowRoot.querySelector('.x-modal-title').childElementCount, 0);
  destroy(element);
});

test('Dialog dimensions reject stylesheet injection before the first write and preserve valid updates atomically', () => {
  register('x-dialog', definitions.get('x-dialog'));
  const descriptor = descriptors.find(entry => entry.tag === 'x-dialog');
  const element = document.createElement('x-dialog'), requests = [];
  prepareNativeComponent(element, {descriptor, owner:{documentId:'ui-test',surfaceId:'surface',controllerId:'controller',generation:1}, ref:`component${++sequence}`, keys:[], isCurrent:()=>true,
    ports:{dispatch(capability,args){requests.push({capability,args});return null;}}});
  for (const input of [
    {title:'must not be written',width:'1px; background-image:url(https://xtend.invalid/dimension)'},
    {height:'0} .xdialog {background-image:image-set("https://xtend.invalid/image" 1x)'},
    {width:'</style><img src="https://xtend.invalid/style-breakout" onerror="evil()">'},
    {height:'u\\72l(https://xtend.invalid/escaped)'}
  ]) {
    assert.throws(() => updateNativeComponent(element,{attributes:input}), /managed|dimension/i);
    assert.equal(element.attributes.length, 0);
    assert.equal(requests.length, 0);
  }
  disposeNativeComponent(element);

  const current = create('x-dialog',{attributes:{title:'kept',width:'320px',height:'auto'}});
  const before = current.element.outerHTML, surface = current.element.shadowRoot.querySelector('.xdialog');
  assert.equal(surface.style.width,'320px');
  assert.equal(surface.style.height,'auto');
  const requestCount = current.requests.length;
  assert.throws(() => updateNativeComponent(current.element,{attributes:{title:'changed',width:'1px; color:red'}}), /managed|dimension/i);
  assert.equal(current.element.outerHTML,before);
  assert.equal(current.element.shadowRoot.querySelector('.xdialog-title').textContent,'kept');
  assert.ok(current.element.shadowRoot.querySelector('.xdialog') === surface, 'Rejected dimensions preserve the existing presentation');
  assert.equal(current.requests.length,requestCount);
  updateNativeComponent(current.element,{attributes:{width:'calc(100% - 32px)',height:'240px'}});
  assert.equal(current.element.shadowRoot.querySelector('.xdialog').style.height,'240px');
  assert.match(current.element.shadowRoot.querySelector('.xdialog').style.width,/calc\(/);
  destroy(current.element);
});

test('typed multiple selection and date constraints survive Model projection', () => {
  const {element:select}=create('x-select');
  for(const value of ['one','two','three']){const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);}
  select._syncOptions(); updateNativeComponent(select,{properties:{multiple:true,values:['one','three']}});
  assert.deepEqual(select.values,['one','three']);
  updateNativeComponent(select,{properties:{values:['two']}});assert.deepEqual(select.values,['two']);
  const {element:calendar}=create('x-calendar',{attributes:{min:'2026-01-10',max:'2026-01-20',required:true},properties:{value:'2026-01-15'}});
  assert.equal(calendar.checkValidity(),true);
  updateNativeComponent(calendar,{attributes:{min:'2026-01-10',max:'2026-01-20',required:true},properties:{value:'2026-01-25'}});assert.equal(calendar.checkValidity(),false);
  updateNativeComponent(calendar,{attributes:{min:'2026-01-10',max:'2026-01-20',required:true},properties:{value:''}});assert.equal(calendar.checkValidity(),false);
  destroy(select);destroy(calendar);
});

test('controlled commands require a Model Action and never mutate the projected value themselves', async () => {
  const {element,context,intents}=create('x-progress',{properties:{value:12}},[{event:'progress-changed',action:'progress.set',payload:{value:'detail.value'}}]);
  const port={dispatchComponentCommand(_capability,request){return request.invoke();}};
  await dispatchNativeComponentCommand({owner:context.owner,target:`surface.${context.ref}`,keys:[],command:'setProgress',args:{value:73}},port);
  assert.equal(element.value,12);assert.deepEqual(intents,[{action:'progress.set',payload:{value:73}}]);
  const missing=create('x-progress',{properties:{value:15}});
  await assert.rejects(dispatchNativeComponentCommand({owner:missing.context.owner,target:`surface.${missing.context.ref}`,keys:[],command:'reset',args:{}},port),/requires a validated RMT.On Action/);
  assert.equal(missing.element.value,15);destroy(element);destroy(missing.element);
});

test('Model-owned overlay open and checkbox checked remain authoritative after gestures', () => {
  const popover=create('x-popover',{},[{event:'popover-opened',action:'overlay.open',payload:{open:'detail.open'}}]);
  popover.element.show({source:'button'});assert.equal(popover.element.hasAttribute('open'),false);assert.equal(popover.intents.at(-1).payload.open,true);
  updateNativeComponent(popover.element,{properties:{open:true}});assert.equal(popover.element._open,true);
  const checkbox=create('x-checkbox',{properties:{checked:false}},[{event:'checkbox-changed',action:'check',payload:{checked:'detail.checked'}}]);
  checkbox.element._control.checked=true;checkbox.element._control.dispatchEvent(new Event('change'));
  assert.equal(checkbox.element.checked,false);assert.equal(checkbox.element.hasAttribute('checked'),false);assert.equal(checkbox.intents.at(-1).payload.checked,true);
  destroy(popover.element);destroy(checkbox.element);
});

test('file DTOs contain scoped opaque handles; arbitrary File-like objects are rejected', () => {
  const {element,context}=create('x-input');
  const file=new File(['content'],'demo.txt',{type:'text/plain',lastModified:42});
  const dto=context.captureFile(file);assert.match(dto.handle,/^native-/);assert.deepEqual({name:dto.name,type:dto.type,size:dto.size,lastModified:dto.lastModified},{name:'demo.txt',type:'text/plain',size:7,lastModified:42});
  assert.throws(()=>context.captureFile({name:'forged',size:0,type:'text/plain',lastModified:0}),/real scoped File/);
  destroy(element);assert.throws(()=>context.captureFile(file),/current|longer|active/);
});

test('sanitized modal HTML and declarative actions never execute callback fields', () => {
  const {element,intents}=create('x-modal',{attributes:{content:'<p>safe</p><img src=x onerror=evil()><script>evil()</script>'},properties:{actions:[{label:'Choose',action:'choose',close:false}]}},[{event:'modal-action',action:'choose',payload:{action:'detail.action'}}]);
  assert.equal(/onerror|<script/i.test(element.shadowRoot.innerHTML),false);
  element.shadowRoot.querySelector('.x-modal-btn').click();assert.equal(intents.at(-1).payload.action,'choose');
  assert.throws(()=>updateNativeComponent(element,{properties:{actions:[{label:'Bad',action:'bad',callback:()=>{}}]}}),/JSON|data|canonical|undeclared/i);
  destroy(element);
});

const profiles = [
  ['x-alert',{type:'warning'}, {}, '.alert', 'alert-dismissed', e=>e.dismiss('profile'), 'snapshot'],
  ['x-button',{label:'Run'}, {}, 'button', 'button-interaction', e=>e._btn.click(), 'focus'],
  ['x-calendar',{required:true},{value:'2026-11-19'}, '.day', 'date-select', e=>e.shadowRoot.querySelector('.day').click(), 'checkValidity'],
  ['x-cards',{columns:'2'}, {}, '.grid', 'cards-layout', null, 'snapshot'],
  ['x-checkbox',{label:'Agree'},{checked:false}, 'input', 'checkbox-changed', e=>{e._control.checked=true;e._control.dispatchEvent(new Event('change'));}, 'validate'],
  ['x-code',{language:'text'},{code:'const value = 1;'}, 'code', 'code-copied', e=>e.shadowRoot.querySelector('.copy-btn').click(), 'snapshot'],
  ['x-dialog',{title:'Dialog',open:true},{}, '.xdialog', 'dialog-closed', e=>e.close({source:'profile'}), 'snapshot'],
  ['x-drawer',{label:'Drawer'},{open:true}, '[role="dialog"]', 'drawer-closed', e=>e.closeDrawer({source:'profile'}), 'snapshot'],
  ['x-footer',{'logo-size':'40px'},{}, 'slot', 'footer-ready', null, 'snapshot'],
  ['x-form',{busy:true},{}, 'form', 'submit', e=>e._form.dispatchEvent(new Event('submit',{cancelable:true})), 'validate'],
  ['x-header',{title:'Header'}, {}, 'slot[name="title"]', 'header-ready', null, 'snapshot'],
  ['x-hero',{align:'left'}, {}, '.hero', 'hero-rendered', null, 'snapshot'],
  ['x-icon',{pack:'core'},{name:'close'}, 'svg', 'icon-ready', null, 'snapshot'],
  ['x-input',{placeholder:'Email'},{value:'test'}, 'input', 'input-changed', e=>{e._input.value='edit';e._input.dispatchEvent(new Event('input'));}, 'validate'],
  ['x-keymap',{title:'Keys'},{entries:[{id:'save',label:'Save',sequence:['Ctrl','S']}]}, '[role="dialog"]', 'xkeymap-close', e=>e.close('profile'), 'isOpen'],
  ['x-lightbox',{alt:'Photo'}, {}, 'img', 'lightbox-opened', e=>e.open('/photo.png'), 'snapshot'],
  ['x-link',{href:'/dashboard'}, {}, 'a', 'before-navigate', e=>e._anchor.click(), 'focus'],
  ['x-masonry',{columns:'2'}, {}, 'slot', null, null, 'snapshot'],
  ['x-menu',{orientation:'vertical'}, {}, 'slot', 'menu-item-clicked', e=>{const a=document.createElement('a');a.href='/item';a.textContent='Item';e.append(a);e._updateMenu();a.dispatchEvent(new MouseEvent('click',{bubbles:true,composed:true,cancelable:true}));}, 'focus'],
  ['x-modal',{title:'Modal',open:true},{}, '.x-modal', 'modal-closed', e=>e.close({source:'profile'}), 'snapshot'],
  ['x-player',{title:'Media'}, {volume:0.4,muted:true}, 'video,audio', 'player-state-changed', e=>e._media.dispatchEvent(new Event('timeupdate')), 'snapshot'],
  ['x-popover',{label:'Popover'},{open:false}, '[role="dialog"]', 'popover-opened', e=>e.show({source:'profile'}), 'snapshot'],
  ['x-progress',{max:'100'},{value:21}, '[role="progressbar"]', 'progress-changed', e=>e.setProgress(22), 'snapshot'],
  ['x-radio',{name:'profile'},{checked:false}, 'input', 'radio-changed', e=>{e._control.checked=true;e._control.dispatchEvent(new Event('change'));}, 'validate'],
  ['x-section',{label:'Section'}, {}, 'main', 'section-rendered', null, 'snapshot'],
  ['x-select',{placeholder:'Choose'},{multiple:true,values:[]}, 'select', 'select-changed', e=>e._control.dispatchEvent(new Event('change')), 'validate'],
  ['x-spinner',{size:'28'}, {}, '.spinner,.dots', 'spinner-started', null, 'snapshot'],
  ['x-status',{message:'Ready'}, {}, '[role="status"],[role="alert"]', 'status-changed', e=>e._syncState(), 'snapshot'],
  ['x-summary',{type:'default'}, {}, 'details', 'open', e=>e.open(), 'snapshot'],
  ['x-tabs',{orientation:'vertical'}, {}, '[role="tablist"]', null, null, null],
  ['x-textarea',{rows:'4'},{value:'Text'}, 'textarea', 'textarea-changed', e=>{e._control.value='Edit';e._control.dispatchEvent(new Event('input'));}, 'validate'],
  ['x-toast',{duration:'0',open:true}, {}, '[role="status"],[role="alert"]', 'toast-dismissed', e=>e.dismiss('profile'), 'dismiss'],
  ['x-toggle',{label:'Enabled'},{checked:false}, 'input', 'toggle-changed', e=>{e.control.checked=true;e.control.dispatchEvent(new Event('change'));}, 'validate'],
  ['x-tooltip',{label:'Tip'}, {open:false}, '[role="tooltip"]', 'tooltip-opened', e=>e.show({immediate:true}), 'snapshot'],
  ['x-type',{loop:false,speed:'1',pause:'1'}, {texts:['A']}, '[part="text"]', 'typing-started', null, 'snapshot'],
  ['x-writer',{}, {value:'<p>Writer</p>'}, '[contenteditable]', 'writer:change', e=>{e.shadowRoot.querySelector('.editor').textContent='Edit';e.shadowRoot.querySelector('.editor').dispatchEvent(new Event('input'));}, 'getHTML']
];
for(const [tag,attributes,properties,selector,primary,trigger,command] of profiles) test(`functional profile ${tag}: projection, event, command, lifecycle and shared Classic class`,async()=>{
  const bindings=primary?[{event:primary,action:`${tag}.event`,payload:{}}]:[];
  const mounted=create(tag,{attributes,properties},bindings), {element,context,intents}=mounted;
  assert.ok(element.shadowRoot.querySelector(selector),`${tag} actual Shadow UI`);
  for(const [name,value]of Object.entries(attributes))assert.equal(element.hasAttribute(name),value!==false&&value!==null,`${tag} projected attribute ${name}`);
  for(const [name,value]of Object.entries(properties))assert.deepEqual(element[name],value,`${tag} projected property ${name}`);
  if(trigger)await trigger(element);await new Promise(resolve=>setTimeout(resolve,0));
  if(primary)assert.ok(intents.some(intent=>intent.action===`${tag}.event`),`${tag} actual primary event`);
  if(command)await dispatchNativeComponentCommand({owner:context.owner,target:`surface.${context.ref}`,keys:[],command,args:{}},{dispatchComponentCommand(_cap,request){return request.invoke();}});
  const count=intents.length;
  const {suspendNativeComponent,resumeNativeComponent}=require('../../tools/xtensions/native-component-managed');
  suspendNativeComponent(element);assert.equal(context.isActive(),false);
  if(trigger) { try{await trigger(element);}catch(error){assert.match(error.message,/active owner|no active|bound|Action|invalid/i);} }
  assert.equal(intents.length,count,`${tag} inactive channel is fenced`);
  resumeNativeComponent(element);assert.equal(context.isActive(),true);
  assert.ok(element.shadowRoot.querySelector(selector),`${tag} resumes actual UI`);
  const legacy=await import(new URL(`../../components/${manifest[tag].slice(2)}`,import.meta.url));
  assert.ok(legacy.default===definitions.get(tag).default,`${tag} Classic and managed use the same constructor`);
  destroy(element);assert.equal(context.isCurrent(),false);
});

async function collectionFixture(tag) {
  const {compileRmtxSource}=require('../../tools/rmt-language/rmtx-compiler');
  const port=require('../../tools/xtensions/native-managed-view-projection');
  const {createRmtDomDescriptorRenderer}=await import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
  const {evaluateRmtEventCondition}=await import('../../xtendrmt/rmt-event-routing-runtime.js');
  const initial={items:[{key:1,ref:'one',title:'First'},{key:'1',ref:'two',title:'Second'}],selected:1,order:[1,'1'],collapsed:[]};
  const binding=tag==='x-tabs'?'items:model.ui.items,selectedKey:model.ui.selected':'items:model.ui.items,order:model.ui.order,collapsed:model.ui.collapsed';
  const action=tag==='x-tabs'?'<RMT.Action id="select"><RMT.Input name="key" type="json"/><RMT.Reduce state="ui" path="selected" value={input.key}/></RMT.Action>':'<RMT.Action id="reorder"><RMT.Input name="order" type="array"/><RMT.Input name="collapsed" type="array"/><RMT.Reduce state="ui" path="order" value={input.order}/><RMT.Reduce state="ui" path="collapsed" value={input.collapsed}/></RMT.Action>';
  const on=tag==='x-tabs'?'<RMT.On event="tab-selection-requested" action="select" payload={{key:"detail.key"}}/>':'<RMT.On event="masonry-change-requested" action="reorder" payload={{order:"detail.order",collapsed:"detail.collapsed"}}/>';
  const result=compileRmtxSource(`import {RMT,model,input} from '@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id="collection.test${++sequence}"><RMT.State id="ui" type="object" initial={${JSON.stringify(initial)}}/>${action}<RMT.Surface id="surface"><RMT.View><RMT.Component ref="collection" tag="${tag}" properties={{${binding}}}>${on}<RMT.Element ref="one" tag="section"/><RMT.Element ref="two" tag="section"/></RMT.Component></RMT.View></RMT.Surface></RMT.Program>`,{syntaxVersion:'8.0.0'});
  assert.equal(result.ok,true,JSON.stringify(result.diagnostics));
  const program=result.orchestrationArtifacts,root=document.createElement('div'),intents=[];document.querySelector('main').append(root);
  let renderer,current=true,admitted=true,snapshot={states:{ui:initial},selectors:{}};
  const registry=port.createNativeComponentRegistry(program,{nativeRuntimeHost:{resolve(binding){return{owner:{documentId:program.render.nativeView.documentId,surfaceId:binding.surfaceId,controllerId:'collection-controller',generation:1},isCurrent:()=>current,isActive:()=>admitted,ports:{isNativeEventEnabled(eventId){const event=program.events.find(row=>row.id===eventId);assert.ok(event);return evaluateRmtEventCondition(event.condition,{modelReader:{snapshot:()=>snapshot}});},dispatch(capability,args,lease){assert.equal(capability,'layout.bind');return renderer.createNativeSlotPresentationLease(lease.element,args,{isCurrent:lease.isCurrent,signal:lease.signal});},dispatchValidatedIntent(action,payload){intents.push({action,payload});},dispatchComponentCommand(_cap,request){return request.invoke();},onError(error){throw error;}}};}}});
  renderer=createRmtDomDescriptorRenderer({documentTarget:document,componentRegistry:registry});
  const render=(state=initial)=>{snapshot={states:{ui:state},selectors:{}};const descriptor=port.materializeNativeManagedView(program,snapshot);renderer.commit({operation:'reconcile-children',target:root,descriptors:Array.isArray(descriptor)?descriptor:[descriptor],context:{componentRegistry:registry}});};
  register(tag,definitions.get(tag));render();
  return {element:root.querySelector(tag),intents,render,initial,suspend(){admitted=false;registry.synchronizeNativeComponents();},resume(){admitted=true;registry.synchronizeNativeComponents();},dispose(){current=false;renderer.dispose(root);root.remove();}};
}

test('tabs use original Renderer refs, typed key intents, registered selection command and suspension leases',async()=>{
  const fixture=await collectionFixture('x-tabs'),{element,intents}=fixture;
  const [one,two]=element.children;assert.equal(one.hidden,false);assert.equal(two.hidden,true);
  const firstTab=element._tabs[0],firstPanel=element.shadowRoot.getElementById(firstTab.getAttribute('aria-controls'));
  assert.ok(firstPanel && firstPanel.getRootNode()===firstTab.getRootNode());assert.equal(firstPanel.getAttribute('aria-labelledby'),firstTab.id);assert.equal(firstPanel.querySelector('slot').name,one.slot);
  element._tabs[1].click();assert.deepEqual(intents.at(-1),{action:'select',payload:{key:'1'}});assert.equal(element.selectedKey,1);
  const bridge=require('../../tools/xtensions/native-component-managed'),context=bridge.resolveManagedComponent(element);
  await dispatchNativeComponentCommand({owner:context.owner,target:`surface.${context.ref}`,keys:[],command:'selectTab',args:{index:1}});
  assert.deepEqual(intents.at(-1).payload,{key:'1'});assert.equal(one.hidden,false);
  fixture.render({...fixture.initial,selected:'1'});assert.ok(element.children[0]===one&&element.children[1]===two);assert.equal(one.hidden,true);assert.equal(two.hidden,false);
  fixture.suspend();assert.equal(one.hasAttribute('hidden'),false);assert.equal(two.hasAttribute('hidden'),false);
  fixture.resume();assert.equal(one.hidden,true);assert.equal(two.hidden,false);
  const intentCount=intents.length;
  fixture.render({...fixture.initial,items:fixture.initial.items.map((item,index)=>({...item,disabled:index===0})),selected:null});
  assert.equal(element.selectedKey,null);assert.equal(one.hidden,true);assert.equal(two.hidden,true);
  assert.deepEqual(element._tabs.map(tab=>tab.getAttribute('aria-selected')),['false','false']);
  assert.deepEqual(element._tabs.map(tab=>tab.tabIndex),[-1,0]);assert.equal(element._tabs[0].disabled,true);
  element._tabs[1].focus();assert.ok(element.shadowRoot.activeElement===element._tabs[1]);assert.equal(intents.length,intentCount,'Ephemeral keyboard entry never selects a Model key');
  fixture.render({...fixture.initial,items:fixture.initial.items.map(item=>({...item,disabled:true})),selected:null});
  assert.deepEqual(element._tabs.map(tab=>tab.tabIndex),[-1,-1]);assert.equal(element.selectedKey,null);assert.equal(intents.length,intentCount);
  fixture.dispose();
});

test('masonry collapse and reorder controls emit typed Model requests while Renderer owns all originals',async()=>{
  const fixture=await collectionFixture('x-masonry'),{element,intents}=fixture;const [one,two]=element.children;
  element.shadowRoot.querySelector('[part="collapse control"]').click();assert.deepEqual(intents.at(-1).payload,{order:[1,'1'],collapsed:[1]});assert.equal(one.hidden,false);
  element.shadowRoot.querySelector('[part="move-down control"]').click();assert.deepEqual(intents.at(-1).payload,{order:['1',1],collapsed:[]});assert.ok(element.children[0]===one);
  const bridge=require('../../tools/xtensions/native-component-managed'),context=bridge.resolveManagedComponent(element);
  const snapshot=await dispatchNativeComponentCommand({owner:context.owner,target:`surface.${context.ref}`,keys:[],command:'snapshot',args:{}});assert.deepEqual(snapshot.order,[1,'1']);
  fixture.render({...fixture.initial,order:['1',1],collapsed:[1]});assert.ok(element.children[0]===two&&element.children[1]===one);assert.equal(one.hidden,true);
  fixture.suspend();assert.ok(element.children[0]===one&&element.children[1]===two);assert.equal(one.hidden,false);
  fixture.resume();assert.ok(element.children[0]===two&&element.children[1]===one);assert.equal(one.hidden,true);fixture.dispose();
});

test('calendar civil days, localized labels and controlled viewports are independent of the process time zone',()=>{
  const mounted=create('x-calendar',{attributes:{locale:'de-DE'},properties:{value:'2026-11-19',viewDate:'2026-12-01'}},[
    {event:'date-select',action:'selectDate',payload:{value:'detail.value'}},
    {event:'calendar-view-changed',action:'showMonth',payload:{viewDate:'detail.viewDate'}}
  ]);
  const {element,intents}=mounted;
  assert.equal(element.value,'2026-11-19');assert.equal(element.viewDate,'2026-12-01');
  assert.equal(element._elements.monthLabel.textContent,new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date('2026-12-01T00:00:00Z')));
  [...element.shadowRoot.querySelectorAll('.day')].find(node=>node.textContent==='20').click();
  assert.deepEqual(intents.at(-1),{action:'selectDate',payload:{value:'2026-12-20'}});assert.equal(element.value,'2026-11-19');
  element._elements.prevBtn.click();assert.deepEqual(intents.at(-1),{action:'showMonth',payload:{viewDate:'2026-11-01'}});assert.equal(element.viewDate,'2026-12-01');
  assert.throws(()=>updateNativeComponent(element,{properties:{value:'2026-02-30'}}),/civil|date|YYYY/i);
  assert.equal(element.value,'2026-11-19');destroy(element);
});

test('removing optional collection controls restores default presentation without undefined author data',async()=>{
  const tabs=await collectionFixture('x-tabs');
  tabs.render({...tabs.initial,selected:'1'});assert.equal(tabs.element.children[0].hidden,true);
  updateNativeComponent(tabs.element,{properties:{items:tabs.initial.items}});assert.equal(tabs.element.selectedKey,undefined);assert.equal(tabs.element.children[0].hidden,false);
  const masonry=await collectionFixture('x-masonry');
  masonry.render({...masonry.initial,order:['1',1],collapsed:[1]});
  updateNativeComponent(masonry.element,{properties:{items:masonry.initial.items}});
  assert.equal(masonry.element.order,undefined);assert.equal(masonry.element.collapsed,undefined);assert.equal(masonry.element.children[0].hidden,false);
  assert.throws(()=>updateNativeComponent(masonry.element,{properties:{collapsed:undefined}}),/JSON|data|canonical/i);
  tabs.dispose();masonry.dispose();
});

test('calendar keyboard focus stays local while Enter/Space emit bounded civil-date intents, including RTL',()=>{
  const projection={attributes:{locale:'de-DE',min:'2026-12-18',max:'2026-12-25'},properties:{value:'2026-12-19',viewDate:'2026-12-01'}};
  const {element,intents}=create('x-calendar',projection,[{event:'date-select',action:'select',payload:{value:'detail.value'}}]);
  let node=element._nativeDayNodes.get('2026-12-19');node.focus();node.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,composed:true}));
  assert.ok(element.shadowRoot.activeElement===element._nativeDayNodes.get('2026-12-20'));
  element.shadowRoot.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true}));
  assert.deepEqual(intents.at(-1).payload,{value:'2026-12-20'});assert.equal(element.value,'2026-12-19');
  element.shadowRoot.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true,composed:true}));
  assert.ok(element.shadowRoot.activeElement===element._nativeDayNodes.get('2026-12-18'));
  element.shadowRoot.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,composed:true}));
  assert.ok(element.shadowRoot.activeElement===element._nativeDayNodes.get('2026-12-18'));
  updateNativeComponent(element,{...projection,attributes:{...projection.attributes,locale:'ar-SA'}});
  assert.equal(element._elements.daysGrid.dir,'rtl');node=element._nativeDayNodes.get('2026-12-19');node.focus();node.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,composed:true}));
  assert.ok(element.shadowRoot.activeElement===element._nativeDayNodes.get('2026-12-18'));
  element.shadowRoot.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true,composed:true}));assert.deepEqual(intents.at(-1).payload,{value:'2026-12-18'});
  const count=intents.length;updateNativeComponent(element,{...projection,attributes:{...projection.attributes,disabled:true}});
  element._nativeDayNodes.get('2026-12-19').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,composed:true}));assert.equal(intents.length,count);destroy(element);
});

async function ownedMenuFixture() {
  const {compileRmtxSource}=require('../../tools/rmt-language/rmtx-compiler'),port=require('../../tools/xtensions/native-managed-view-projection');
  const {createRmtDomDescriptorRenderer}=await import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
  const result=compileRmtxSource(`import {RMT} from '@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id="menu.test${++sequence}"><RMT.Surface id="surface"><RMT.View><RMT.Component ref="menu" tag="x-menu"><RMT.Element ref="first" tag="button" attributes={{role:"menuitem"}}/><RMT.Element ref="disabled" tag="button" attributes={{role:"menuitem",disabled:true}}/><RMT.Element ref="last" tag="button" attributes={{role:"menuitem"}}/></RMT.Component></RMT.View></RMT.Surface></RMT.Program>`,{syntaxVersion:'8.0.0'});
  assert.equal(result.ok,true,JSON.stringify(result.diagnostics));const program=result.orchestrationArtifacts,root=document.createElement('div');document.querySelector('main').append(root);let renderer,current=true;
  const registry=port.createNativeComponentRegistry(program,{nativeRuntimeHost:{resolve(binding){return{owner:{documentId:program.render.nativeView.documentId,surfaceId:binding.surfaceId,controllerId:'menu-controller',generation:1},isCurrent:()=>current,isActive:()=>true,ports:{dispatch(capability,args,lease){assert.equal(capability,'focus.request');return renderer.focusNativeComponent(lease.element,args,{isCurrent:lease.isCurrent,signal:lease.signal});},onError(error){throw error;}}};}}});
  renderer=createRmtDomDescriptorRenderer({documentTarget:document,componentRegistry:registry});register('x-menu',definitions.get('x-menu'));
  const descriptor=port.materializeNativeManagedView(program,{states:{},selectors:{}});renderer.commit({operation:'reconcile-children',target:root,descriptors:Array.isArray(descriptor)?descriptor:[descriptor],context:{componentRegistry:registry}});
  return{element:root.querySelector('x-menu'),dispose(){current=false;renderer.dispose(root);root.remove();}};
}

test('native menu arrows focus actual Renderer-owned enabled items and preserve authored roles',async()=>{
  const fixture=await ownedMenuFixture(),[first,disabled,last]=fixture.element.children;
  first.focus();first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,composed:true,cancelable:true}));
  assert.ok(document.activeElement===last);assert.equal(disabled.disabled,true);
  last.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true,composed:true,cancelable:true}));assert.ok(document.activeElement===first);
  for(const node of [first,disabled,last])assert.equal(node.getAttribute('role'),'menuitem');fixture.dispose();
});

test('managed modal admission retains one actual lease, releases on Suspend, and reacquires unchanged Model open on Resume',()=>{
  const {element,context,resources}=create('x-popover',{attributes:{modal:true},properties:{open:true}});
  assert.equal(element.open,true);assert.equal(resources.overlayLive,1);assert.equal(resources.overlayPeak,1);
  const bridge=require('../../tools/xtensions/native-component-managed');bridge.suspendNativeComponent(element);
  assert.equal(context.isActive(),false);assert.equal(element.open,true);assert.equal(resources.overlayLive,0);
  bridge.resumeNativeComponent(element);assert.equal(element.open,true);assert.equal(resources.overlayLive,1);assert.equal(resources.overlayPeak,1);
  updateNativeComponent(element,{attributes:{modal:true},properties:{open:false}});assert.equal(resources.overlayLive,0);
  destroy(element);assert.equal(resources.overlayAcquires,resources.overlayReleases);
});

test('Model-open header, keymap and lightbox admit their exact owner focus capabilities',()=>{
  for(const [tag,attributes,focus] of [
    ['x-header',{'menu-open':true,'menu-modal':true},element=>element._focusMenuSurface()],
    ['x-keymap',{open:true},()=>{}],
    ['x-lightbox',{open:true},element=>element._focusElement()]
  ]){
    const {element,requests,resources}=create(tag);
    updateNativeComponent(element,{attributes});focus(element);
    assert.ok(requests.some(request=>request.capability==='focus.request'),`${tag} owner focus is admitted`);
    assert.equal(resources.overlayLive,1,`${tag} keeps one owned modal lease`);
    destroy(element);assert.equal(resources.overlayLive,0);
  }
});

test('managed dialog and modal use a modal owner lease independently of the visual backdrop',()=>{
  for(const tag of ['x-dialog','x-modal']){
    const {element,requests}=create(tag,{attributes:{open:true}});
    assert.equal(element.shadowRoot.querySelector(tag==='x-modal'?'.x-modal':'.xdialog').getAttribute('tabindex'),'-1');
    assert.ok(requests.some(request=>request.capability==='overlay.acquire'&&request.args.modal===true));
    destroy(element);
  }
});

test('managed Hero style values reject markup and alternate URL forms before setters and admit one actual image URL before writes',()=>{
  const descriptor=descriptors.find(row=>row.tag==='x-hero');register('x-hero',definitions.get('x-hero'));
  const element=document.createElement('x-hero'),requests=[];let denied=false,releases=0;
  prepareNativeComponent(element,{descriptor,owner:{documentId:'hero-styles',surfaceId:'surface',controllerId:'controller',generation:1},ref:'hero',keys:[],isCurrent:()=>true,ports:{dispatch(capability,args){
    requests.push({capability,args});assert.equal(capability,'resource.image');assert.equal(args.attribute,'background-image');
    assert.equal(element.getAttribute('background-image'),denied?'/x':null,'Admission precedes the Model attribute setter');
    assert.equal(element.shadowRoot.querySelector('.hero').style.backgroundImage,denied?`url("${new URL('/x',document.baseURI).href}")`:'','Admission precedes the browser image property');
    if(denied)return false;
    assert.equal(args.url,new URL('/x',document.baseURI).href);return{release(){releases++;}};
  }}});
  document.querySelector('main').append(element);
  const attacks=[
    {background:'red;}</style><img src=x onerror=evil()><style>'},
    {background:'image-set("https://hero-denied.invalid/image" 1x)'},
    {background:'linear-gradient(red, blue)'},
    {background:'u\\72l(https://hero-denied.invalid/image)'},
    {'background-image':'image-set("https://hero-denied.invalid/image" 1x)'},
    {'background-image':'url("https://hero-denied.invalid/one") url("https://hero-denied.invalid/two")'},
    {'background-image':'javascript:evil()'},
    {'background-image':'x\');}</style><img src=x onerror=evil()><style>'},
    {'overlay-dark':'url(https://hero-denied.invalid/image)'},
    {'font-color':'var(--token, url(https://hero-denied.invalid/image))'},
    {align:'left;}</style><img src=x onerror=evil()><style>'}
  ];
  for(const attack of attacks){const before=element.outerHTML,shadow=element.shadowRoot.innerHTML;assert.throws(()=>updateNativeComponent(element,{attributes:{align:'right',...attack}}),/managed|Hero|URL|color|function|protocol/i);assert.equal(element.outerHTML,before);assert.equal(element.shadowRoot.innerHTML,shadow);assert.equal(requests.length,0);}
  updateNativeComponent(element,{attributes:{background:'#112233','background-image':'/x',align:'left'}});
  assert.equal(requests.length,1);assert.equal(element.shadowRoot.querySelector('.hero').style.backgroundColor,'rgb(17, 34, 51)');
  assert.equal(element.shadowRoot.querySelector('img,script'),null);
  denied=true;const before=element.outerHTML,shadow=element.shadowRoot.innerHTML;
  assert.throws(()=>updateNativeComponent(element,{attributes:{background:'#ffffff','background-image':'/x?denied=1'}}),/denied/i);
  assert.equal(element.outerHTML,before);assert.equal(element.shadowRoot.innerHTML,shadow);
  destroy(element);assert.equal(releases,1);
});

test('managed Section and Spinner colors reject image functions atomically and consume variable tokens only as colors',()=>{
  for(const [tag,attribute,other]of [['x-section','background',{}],['x-spinner','color',{type:'dots'}]]){
    const {element,requests}=create(tag,{attributes:{...other,[attribute]:'#112233'}});
    for(const value of ['url(https://color-denied.invalid/image)','image-set("https://color-denied.invalid/image" 1x)','u\\72l(https://color-denied.invalid/image)','red; background:url(https://color-denied.invalid/image)','</style><img src=x onerror=evil()>']){
      const before=element.outerHTML,shadow=element.shadowRoot.innerHTML;
      assert.throws(()=>updateNativeComponent(element,{attributes:{...other,[attribute]:value}}),/managed|color|function/i);
      assert.equal(element.outerHTML,before);assert.equal(element.shadowRoot.innerHTML,shadow);assert.equal(requests.length,0);
    }
    element.style.setProperty('--native-adversarial-color','url("https://color-denied.invalid/variable")');
    updateNativeComponent(element,{attributes:{...other,[attribute]:'var(--native-adversarial-color)'}});
    const consumers=tag==='x-section'?[element]:Array.from(element.shadowRoot.querySelectorAll('.dot'));
    assert.ok(consumers.length);for(const node of consumers)assert.equal(getComputedStyle(node).backgroundImage,'none','Variable values never enter a full background/image sink');
    assert.equal(requests.length,0);destroy(element);
  }
});

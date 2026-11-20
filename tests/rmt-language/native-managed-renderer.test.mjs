// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require('jsdom');
const errors=[],consoleTarget=new VirtualConsole();consoleTarget.on('jsdomError',error=>errors.push(error));
const dom=new JSDOM('<!doctype html><main></main>',{url:'http://localhost/',pretendToBeVisual:true,virtualConsole:consoleTarget});
for(const name of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','KeyboardEvent','MouseEvent','File','customElements','localStorage','MutationObserver','DOMParser','AbortController','AbortSignal'])globalThis[name]=dom.window[name];
globalThis.getComputedStyle=window.getComputedStyle.bind(window);globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);globalThis.ResizeObserver=class{observe(){}disconnect(){}};window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
HTMLElement.prototype.attachInternals=function(){return{setFormValue(){},setValidity(){},checkValidity(){return true;},reportValidity(){return true;}};};
const {compileRmtxSource}=require('../../tools/rmt-language/rmtx-compiler');
const port=require('../../tools/xtensions/native-managed-view-projection');
const bridge=require('../../tools/xtensions/native-component-managed');
const {createRmtDomDescriptorRenderer}=await import('../../xtendrmt/rmt-dom-descriptor-renderer.js');
const {evaluateRmtEventCondition}=await import('../../xtendrmt/rmt-event-routing-runtime.js');
for(const name of ['xinput','xtabs','xmasonry','xhero','xmenu','xtooltip','xmodal']){const module=await import(`../../components/${name}.definition.js`);for(const [tag,ctor]of module.nativeDependencies||[])if(!customElements.get(tag))customElements.define(tag,ctor);const tag=module.default[bridge.MANAGED_NATIVE_CLASS].tag;if(!customElements.get(tag))customElements.define(tag,module.default);}
let sequence=0;
function fixture(body,initial={}){
 const result=compileRmtxSource(`import {RMT,model,input,item} from '@ccslabs/xtend/rmt-language/rmtx';export default <RMT.Program id="renderer.test${++sequence}"><RMT.State id="ui" type="object" initial={${JSON.stringify(initial)}}/><RMT.Action id="change"><RMT.Input name="value" type="string"/><RMT.Reduce state="ui" path="value" value={input.value}/></RMT.Action><RMT.Surface id="editor"><RMT.View>${body}</RMT.View></RMT.Surface></RMT.Program>`,{syntaxVersion:'8.0.0'});
 assert.equal(result.ok,true,JSON.stringify(result.diagnostics));
 const program=result.orchestrationArtifacts,root=document.createElement('div');document.querySelector('main').append(root);let active=true,current=true;const calls=[];
 let renderer;const registry=port.createNativeComponentRegistry(program,{nativeRuntimeHost:{resolve(binding){return{owner:{documentId:program.render.nativeView.documentId,surfaceId:binding.surfaceId,controllerId:'actual-controller',generation:1},isCurrent:()=>current,isActive:()=>active,ports:{isNativeEventEnabled(eventId){const event=program.events.find(row=>row.id===eventId);assert.ok(event);return evaluateRmtEventCondition(event.condition,{modelReader:{snapshot:()=>snapshot}});},dispatchValidatedIntent(action,payload,lease){calls.push({action,payload,keys:lease.keys});},dispatch(capability,args,lease){if(capability==='overlay.acquire')return renderer.createNativeOverlayLease(lease.element,args,{root,owner:lease.owner,isCurrent:lease.isActive,signal:lease.signal});if(capability==='focus.request')return renderer.focusNativeComponent(lease.element,args,{isCurrent:lease.isActive,signal:lease.signal});if(capability!=='layout.bind')throw new TypeError('unexpected '+capability);return renderer.createNativeSlotPresentationLease(lease.element,args,{isCurrent:lease.isCurrent,signal:lease.signal});},dispatchComponentCommand(_cap,operation){return operation.invoke();},onError(error){throw error;}}};}}});
 renderer=createRmtDomDescriptorRenderer({documentTarget:document,componentRegistry:registry});
 let snapshot={states:{ui:initial},selectors:{}};
 const render=(value=initial)=>{snapshot={states:{ui:value},selectors:{}};const projected=port.materializeNativeManagedView(program,snapshot);renderer.commit({operation:'reconcile-children',target:root,descriptors:Array.isArray(projected)?projected:[projected],context:{componentRegistry:registry}});};
 return{root,program,renderer,registry,calls,render,get snapshot(){return snapshot;},setActive(value){active=value;registry.synchronizeNativeComponents();},dispose(){current=false;renderer.dispose(root);root.remove();}};
}
test('the actual renderer prepares before attributes, routes a single lexical intent and silently patches controlled props',()=>{
 const value=fixture('<RMT.Component ref="email" tag="x-input" attributes={{placeholder:"Email"}} properties={{value:model.ui.value}}><RMT.On event="input-changed" action="change" payload={{value:"detail.value"}}/></RMT.Component>',{value:'initial'});
 value.render();const input=value.root.querySelector('x-input');assert.ok(input);assert.equal(input.value,'initial');assert.equal(input.getAttribute('placeholder'),'Email');
 input._input.value='edited';input._input.dispatchEvent(new Event('input'));assert.deepEqual(value.calls,[{action:'change',payload:{value:'edited'},keys:[]}]);
 value.render({value:'model'});assert.ok(value.root.querySelector('x-input')===input);assert.equal(input.value,'model');assert.equal(value.calls.length,1);
 value.setActive(false);input._input.value='blocked';input._input.dispatchEvent(new Event('input'));assert.equal(value.calls.length,1);value.render({value:'passive'});assert.equal(input.value,'passive');
 value.setActive(true);input._input.value='resumed';input._input.dispatchEvent(new Event('input'));assert.equal(value.calls.length,2);value.dispose();assert.equal(errors.length,0,errors.map(error=>error.message).join(';'));
});
test('Renderer-owned tabs project exact original children and restore authored visibility on release',()=>{
 const value=fixture('<RMT.Component ref="tabs" tag="x-tabs" properties={{items:model.ui.items,selectedKey:model.ui.selected}}><RMT.Element ref="one" tag="section" attributes={{title:"original"}}/><RMT.Element ref="two" tag="section"/></RMT.Component>',{items:[{key:1,ref:'one',title:'One'},{key:'1',ref:'two',title:'Two'}],selected:1});
 value.render();const tabs=value.root.querySelector('x-tabs'),[one,two]=tabs.children;
 assert.equal(one.hidden,false);assert.equal(two.hidden,true);assert.equal(one.title,'original');
 value.render({items:[{key:1,ref:'one',title:'One'},{key:'1',ref:'two',title:'Two'}],selected:'1'});assert.ok(tabs.children[0]===one&&tabs.children[1]===two);assert.equal(one.hidden,true);assert.equal(two.hidden,false);
 value.setActive(false);assert.equal(one.hasAttribute('hidden'),false);assert.equal(two.hasAttribute('hidden'),false);assert.equal(one.hasAttribute('role'),false);
 value.setActive(true);assert.equal(one.hidden,true);assert.equal(two.hidden,false);value.dispose();
});
test('Renderer-owned masonry reorders originals by typed keys and rejects foreign or missing refs atomically',()=>{
 const value=fixture('<RMT.Component ref="layout" tag="x-masonry" properties={{items:model.ui.items,order:model.ui.order,collapsed:model.ui.collapsed}}><RMT.Element ref="one" tag="article"/><RMT.Element ref="two" tag="article"/></RMT.Component>',{items:[{key:1,ref:'one'},{key:'1',ref:'two'}],order:[1,'1'],collapsed:[]});
 value.render();const layout=value.root.querySelector('x-masonry'),[one,two]=layout.children;
 value.render({items:[{key:1,ref:'one'},{key:'1',ref:'two'}],order:['1',1],collapsed:[1]});assert.ok(layout.children[0]===two&&layout.children[1]===one);assert.equal(one.hidden,true);assert.equal(two.hidden,false);
 value.setActive(false);assert.ok(layout.children[0]===one&&layout.children[1]===two);assert.equal(one.hidden,false);
 assert.throws(()=>value.renderer.createNativeSlotPresentationLease(document.createElement('div'),{kind:'masonry',items:[]},{isCurrent:()=>true}),/owned/);
 assert.throws(()=>value.renderer.createNativeSlotPresentationLease(layout,{kind:'masonry',items:[{key:1,ref:'missing'}]},{isCurrent:()=>true}),/original direct children/);
 assert.ok(layout.children[0]===one&&layout.children[1]===two);value.dispose();
});

test('lexical native On conditions read the live Model and cannot fall through a Surface delegate',()=>{
 const value=fixture('<RMT.Component ref="email" tag="x-input" properties={{value:model.ui.value}}><RMT.On event="input-changed" action="change" payload={{value:"detail.value"}} when={model.ui.enabled === true}/></RMT.Component>',{value:'initial',enabled:false});
 value.render();const input=value.root.querySelector('x-input');input._input.value='blocked';input._input.dispatchEvent(new Event('input'));assert.equal(value.calls.length,0);
 value.render({value:'projected',enabled:true});input._input.value='allowed';input._input.dispatchEvent(new Event('input'));assert.deepEqual(value.calls,[{action:'change',payload:{value:'allowed'},keys:[]}]);
 const forged=new CustomEvent('input-changed',{bubbles:true,detail:{value:'forged'}});value.root.dispatchEvent(forged);assert.equal(value.calls.length,1);value.dispose();
});

test('owned Hero scroll and Menu keyboard navigation use real Renderer ports',()=>{
 const value=fixture('<RMT.Component ref="hero" tag="x-hero"/><RMT.Component ref="menu" tag="x-menu"><RMT.Element ref="first" tag="button"/><RMT.Element ref="disabled" tag="button" attributes={{disabled:true}}/><RMT.Element ref="last" tag="button"/></RMT.Component>');
 value.render();const hero=value.root.querySelector('x-hero'),menu=value.root.querySelector('x-menu');let scrolled=0;const originalScroll=hero.scrollIntoView;hero.scrollIntoView=function(options){assert.equal(options.block,'end');scrolled++;if(typeof originalScroll==='function')return Reflect.apply(originalScroll,this,[options]);};hero.scrollPast();assert.equal(scrolled,1);
 const [first,disabled,last]=menu.children;first.focus();first.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}));assert.ok(document.activeElement===last,'disabled menu items are skipped through the actual owned focus port');assert.equal(disabled.disabled,true);
 value.dispose();
});
test('owned Tooltip anchor leases preserve other descriptions and release callbacks on Suspend',()=>{
 const value=fixture('<RMT.Element ref="anchor" tag="button" attributes={{"aria-describedby":"existing-description"}}/><RMT.Component ref="tip" tag="x-tooltip" attributes={{for:"anchor",label:"Hint",delay:"0",open:model.ui.open}}><RMT.On event="tooltip-opened" action="change" payload={{value:"detail.source"}}/></RMT.Component>',{open:false});
 value.render();const anchor=value.root.querySelector('button'),tip=value.root.querySelector('x-tooltip');assert.ok(anchor.getAttribute('aria-describedby').split(/\s+/).includes(tip.id));assert.ok(anchor.getAttribute('aria-describedby').includes('existing-description'));assert.equal(anchor.getAttribute('aria-description'),'Hint');
 anchor.dispatchEvent(new MouseEvent('mouseenter'));assert.equal(value.calls.length,1);assert.equal(value.calls[0].payload.value,'anchor');
 assert.throws(()=>value.renderer.focusNativeComponent(tip,{operation:'tooltip-anchor',ref:'missing'},{isCurrent:()=>true}),/same exact owning Surface/);
 value.setActive(false);assert.equal(anchor.getAttribute('aria-describedby'),'existing-description');assert.equal(anchor.getAttribute('aria-description'),null);anchor.dispatchEvent(new MouseEvent('mouseenter'));assert.equal(value.calls.length,1);
 value.setActive(true);anchor.dispatchEvent(new MouseEvent('mouseenter'));assert.equal(value.calls.length,2);value.dispose();
});

test('actual modal leases inert only owned app siblings, trap focus, track Model changes and release on Suspend',()=>{
 const outside=document.createElement('button');document.body.append(outside);
 const value=fixture('<RMT.Element ref="background" tag="button"/><RMT.Component ref="dialog" tag="x-modal" attributes={{title:"Dialog",overlay:true,open:model.ui.open}}><RMT.Element ref="inside" tag="button"/></RMT.Component>',{open:true});
 value.root.style.setProperty('overflow','auto','important');value.render();
 const background=value.root.querySelector('section,article,div')?.querySelector('button')||value.root.querySelector('button'),modal=value.root.querySelector('x-modal');
 assert.ok(modal.shadowRoot.querySelector('slot:not([name])'),'empty modal content retains the original author slot with native TrustedHTML as well as string sanitizers');
 assert.ok(background.hasAttribute('inert'),'owned background becomes inert');assert.equal(outside.hasAttribute('inert'),false);assert.equal(value.root.style.overflow,'hidden');
 const buttons=Array.from(modal.shadowRoot.querySelectorAll('button')).filter(button=>!button.disabled),inside=modal.querySelector('button');assert.ok(buttons.length);assert.ok(inside);inside.focus();inside.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,composed:true,cancelable:true}));assert.ok(modal.shadowRoot.activeElement===buttons[0],'Tab wraps from the last rendered slotted control to the first private control');buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,composed:true,cancelable:true}));assert.ok(document.activeElement===inside,'Shift+Tab returns to the original slotted control');buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,composed:true,cancelable:true}));assert.ok(document.activeElement===inside,'Shift+Tab wraps to the original rendered slotted control');
 value.render({open:true});assert.equal(background.hasAttribute('inert'),true);
 value.setActive(false);assert.equal(background.hasAttribute('inert'),false);assert.equal(value.root.style.overflow,'auto');assert.equal(value.root.style.getPropertyPriority('overflow'),'important');assert.equal(outside.hasAttribute('inert'),false);
 value.setActive(true);assert.equal(background.hasAttribute('inert'),true);value.render({open:false});assert.equal(background.hasAttribute('inert'),false);value.dispose();outside.remove();
});


test('conditional Tooltip anchors retire their listeners and rebind the same ref to its new owned lifetime',async()=>{
 const value=fixture('<RMT.When test={model.ui.show}><RMT.Element ref="anchor" tag="button"/></RMT.When><RMT.Component ref="tip" tag="x-tooltip" attributes={{for:"anchor",label:model.ui.label,delay:"0",open:true}}><RMT.On event="tooltip-opened" action="change" payload={{value:"detail.source"}}/></RMT.Component>',{show:true,label:'Original'});
 value.render();const old=value.root.querySelector('button'),tip=value.root.querySelector('x-tooltip');old.dispatchEvent(new MouseEvent('mouseenter'));assert.equal(value.calls.length,1);
 value.render({show:false,label:'Changed while absent'});assert.equal(old.isConnected,false);assert.equal(old.hasAttribute('aria-describedby'),false);assert.equal(old.hasAttribute('aria-description'),false);
 window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('scroll'));old.dispatchEvent(new MouseEvent('mouseenter'));await new Promise(done=>window.requestAnimationFrame(done));assert.equal(value.calls.length,1);
 value.render({show:true,label:'Reentered'});const next=value.root.querySelector('button');assert.ok(next!==old);assert.ok(value.root.querySelector('x-tooltip')===tip);assert.equal(next.getAttribute('aria-description'),'Reentered');next.dispatchEvent(new MouseEvent('mouseenter'));assert.equal(value.calls.length,2);assert.equal(errors.length,0,errors.map(error=>error.message).join(';'));value.dispose();
});

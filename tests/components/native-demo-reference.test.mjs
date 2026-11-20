// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><main></main>',{url:'http://localhost/'});
for(const name of ['window','document','HTMLElement','customElements'])globalThis[name]=dom.window[name];
await import('../../components/x-rmt-lifecycle-demo-build.js');
test('the demo remains an actual Classic CSR lifecycle and author-slot reference, not a productive native grant',()=>{
 const element=document.createElement('x-rmt-lifecycle-demo-build'),child=document.createElement('span'),calls=[];child.textContent='Original author';element.append(child);
 for(const hook of ['beforeHydrate','afterHydrate','beforeRender','afterRender','onDisconnect'])element[hook]=()=>calls.push(hook);
 document.querySelector('main').append(element);assert.equal(element.getAttribute('data-xtend-hydrated'),'true');assert.deepEqual(calls,['beforeHydrate','beforeRender','afterRender','afterHydrate']);
 const constructor=element.constructor;element.setAttribute('variant','<variant>');element.setAttribute('aria-label','"<safe>');assert.ok(element.firstElementChild===child);assert.equal(element.shadowRoot.querySelector('section').getAttribute('data-variant'),'<variant>');assert.equal(element.shadowRoot.querySelector('section').getAttribute('aria-label'),'"<safe>');
 element.remove();assert.equal(calls.at(-1),'onDisconnect');assert.equal(element.hasAttribute('data-xtend-hydrated'),false);document.querySelector('main').append(element);assert.ok(element.constructor===constructor);assert.ok(element.firstElementChild===child);assert.equal(element.getAttribute('data-xtend-hydrated'),'true');
 assert.throws(()=>require('../../tools/rmt-language/rmtx-native-components-v2').getRmtxNativeComponentV2('x-rmt-lifecycle-demo-build'),/productive CustomElement/);element.remove();dom.window.close();
});

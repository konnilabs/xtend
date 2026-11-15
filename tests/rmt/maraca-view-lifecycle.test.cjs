'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const apiPromise = Promise.all([import('../../xtendrmt/rmt-maraca-view-projection-adapter.js'),import('../../xtendrmt/rmt-dom-descriptor-renderer.js')]);
async function fixture(content='<section data-maraca-surface="owner"><h1>Native header</h1></section><aside data-maraca-surface="sibling"><input value="retained"></aside>') {
  const [api,domApi]=await apiPromise,dom=new JSDOM('<main>'+content+'</main>'),document=dom.window.document,root=document.querySelector('main');
  const renderer=domApi.createRmtDomDescriptorRenderer({documentTarget:document}),view=api.createRmtMaracaViewProjectionAdapter({root,documentTarget:document});
  const record=(status='open',extra={})=>({surfaces:[{id:'owner',status,generation:1,...extra}]});
  return {api,dom,document,root,renderer,view,record,owner:root.querySelector('section'),sibling:root.querySelector('aside'),close(){renderer.dispose();view.dispose();dom.window.close();}};
}
test('v2 is explicit and opt-in v1 retains its original port and schema',async()=>{
  const f=await fixture();try{
    assert.equal(f.api.RMT_MARACA_VIEW_PROJECTION_ADAPTER_API_VERSION,'2.0.0');
    assert.equal(f.view.schema,'xtend.rmt.maraca-view-projection-adapter.v2');
    const legacy=f.api.createRmtMaracaViewProjectionAdapter({root:f.root,adapterSchema:f.api.RMT_MARACA_VIEW_PROJECTION_ADAPTER_LEGACY_SCHEMA});
    assert.equal(legacy.schema,'xtend.rmt.maraca-view-projection-adapter.v1');assert.equal(legacy.projectSurfaceLifecycle,undefined);assert.equal(legacy.validateRoot().schema,legacy.schema);legacy.dispose();
  }finally{f.close();}
});
test('close, minimized and collapsed hide only the native owner and preserve nodes on resume',async()=>{
  const f=await fixture();try{
    const heading=f.owner.firstChild,input=f.sibling.firstChild;
    for(const record of [f.record('closed'),f.record('minimized'),f.record('open',{minimized:true}),f.record('open',{collapsed:true})]){
      f.view.projectSurfaceLifecycle(record,{renderer:f.renderer});
      assert.equal(f.owner.hidden,true);assert.equal(f.owner.style.display,'none');assert.equal(f.owner.getAttribute('aria-hidden'),'true');assert(!f.sibling.hidden);
      f.view.projectSurfaceLifecycle(f.record(),{renderer:f.renderer});
      assert.equal(f.owner.hidden,false);assert.equal(f.owner.style.display,'');assert.equal(f.owner.getAttribute('aria-hidden'),null);assert.equal(f.owner.firstChild,heading);assert.equal(f.sibling.firstChild,input);
    }
  }finally{f.close();}
});
test('original visibility and ARIA survive close/resume including inline style priority',async()=>{
  const f=await fixture();try{
    f.owner.setAttribute('aria-hidden','false');f.owner.style.setProperty('display','grid','important');
    f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer});f.view.projectSurfaceLifecycle(f.record(),{renderer:f.renderer});
    assert.equal(f.owner.getAttribute('aria-hidden'),'false');assert.equal(f.owner.style.display,'grid');assert.equal(f.owner.style.getPropertyPriority('display'),'important');
    f.owner.hidden=true;f.owner.setAttribute('aria-hidden','true');f.owner.style.display='none';
    f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer});f.view.projectSurfaceLifecycle(f.record(),{renderer:f.renderer});
    assert.equal(f.owner.hidden,true);assert.equal(f.owner.getAttribute('aria-hidden'),'true');assert.equal(f.owner.style.display,'none');
  }finally{f.close();}
});
test('prepare/project phases retain Model visibility changes made while closed',async()=>{
  const f=await fixture();try{
    f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer});
    f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer,phase:'prepare'});
    f.renderer.commit({operation:'merge-element',target:f.owner,descriptor:{type:'element',tag:'section',attributes:{hidden:'','aria-hidden':'true',style:{display:'none'}}}});
    f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer});f.view.projectSurfaceLifecycle(f.record(),{renderer:f.renderer});
    assert.equal(f.owner.hidden,true);assert.equal(f.owner.getAttribute('aria-hidden'),'true');assert.equal(f.owner.style.display,'none');
  }finally{f.close();}
});
test('restore does not overwrite an intervening presentation writer',async()=>{
  const f=await fixture();try{
    f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer});
    f.owner.setAttribute('aria-hidden','false');f.owner.style.display='grid';
    f.view.projectSurfaceLifecycle(f.record(),{renderer:f.renderer});
    assert.equal(f.owner.getAttribute('aria-hidden'),'false');assert.equal(f.owner.style.display,'grid');
  }finally{f.close();}
});
test('destroy cleans native subtree and index without touching a sibling or external root',async()=>{
  const f=await fixture();try{
    const heading=f.owner.firstChild,sibling=f.sibling,external=f.document.createElement('section');external.setAttribute('data-maraca-surface','external');f.document.body.append(external);
    f.view.projectSurfaceLifecycle({surfaces:[...f.record('destroyed').surfaces,{id:'external',status:'destroyed',generation:1}]},{renderer:f.renderer});
    assert.equal(heading.isConnected,false);assert.equal(f.owner.isConnected,false);assert.equal(sibling.parentNode,f.root);assert.equal(external.isConnected,true);assert.equal(f.view.resolveSurface('owner'),null);
    f.view.reindexSurfaces();assert.equal(f.view.resolveSurface('owner'),null);
  }finally{f.close();}
});
test('destroy preserves privately reserved foreign roots and their wrappers until owner disposal',async()=>{
  const f=await fixture();try{
    const ownership={owner:'foreign-resource',domains:{structure:'foreign-resource',content:'foreign-resource',attributes:'foreign-resource'}};
    const foreign=f.renderer.commit({operation:'create-node',descriptor:{type:'element',tag:'nav',children:[{type:'element',tag:'input'}]},ownership}).nodes[0];
    const wrapper=f.document.createElement('div');wrapper.append(foreign);f.owner.append(wrapper);const input=foreign.firstChild;input.focus();
    f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer});
    const report=f.view.projectSurfaceLifecycle(f.record('destroyed'),{renderer:f.renderer});
    assert.equal(f.owner.hidden,false,'a retained foreign wrapper does not retain a disposed owner lifecycle overlay');
    assert.equal(report.retained,1);assert.equal(foreign.isConnected,true);assert.equal(f.document.activeElement,input);assert.equal(f.root.querySelector('h1'),null);assert.equal(f.view.resolveSurface('owner'),null);
    f.renderer.commit({operation:'reconcile-children',target:f.root,descriptors:[]});assert.equal(foreign.isConnected,true);assert.equal(f.document.activeElement,input);
    f.renderer.dispose(foreign);f.renderer.commit({operation:'reconcile-children',target:f.root,descriptors:[]});assert.equal(foreign.isConnected,false);
  }finally{f.close();}
});
test('native descendants of a retained retired owner are excluded from lifecycle lookup',async()=>{
  const f=await fixture();try{
    const child=f.document.createElement('article');child.setAttribute('data-maraca-surface','child');
    const foreign=f.renderer.commit({operation:'create-node',descriptor:{type:'element',tag:'nav',text:'foreign scope'},ownership:{owner:'foreign-resource',domains:{structure:'foreign-resource',content:'foreign-resource'}}}).nodes[0];
    const childHeader=f.document.createElement('h2');childHeader.textContent='native child';child.append(childHeader,foreign);f.owner.append(child);
    f.view.projectSurfaceLifecycle({surfaces:[{id:'child',status:'closed',generation:1},...f.record('destroyed').surfaces]},{renderer:f.renderer});
    assert.equal(foreign.isConnected,true);assert.equal(childHeader.isConnected,false);assert.equal(f.view.resolveSurface('owner'),null);assert.equal(f.view.resolveSurface('child'),null);
    assert.equal(child.hidden,false,'disposed ancestor removes native descendant lifecycle overlays from retained foreign wrappers');
    f.view.projectSurfaceLifecycle({surfaces:[{id:'child',status:'closed',generation:1}]},{renderer:f.renderer});
    assert.equal(f.view.resolveSurface('child'),null);assert.equal(child.hidden,false);
  }finally{f.close();}
});
test('old generation cannot resurrect a destroyed view while a new generation can index a new view',async()=>{
  const f=await fixture();try{
    f.view.projectSurfaceLifecycle(f.record('destroyed'),{renderer:f.renderer});
    const forged=f.document.createElement('section');forged.setAttribute('data-maraca-surface','owner');f.root.append(forged);
    f.view.projectSurfaceLifecycle(f.record('open'),{renderer:f.renderer});assert.equal(f.view.resolveSurface('owner'),null);
    f.view.projectSurfaceLifecycle(f.record('open',{generation:2}),{renderer:f.renderer});assert.equal(f.view.resolveSurface('owner'),forged);
  }finally{f.close();}
});
test('an application root remains a shell and can host a new authoritative surface generation',async()=>{
  const f=await fixture();try{
    f.root.setAttribute('data-maraca-surface','owner');f.owner.removeAttribute('data-maraca-surface');
    f.view.projectSurfaceLifecycle(f.record('destroyed'),{renderer:f.renderer});
    assert.equal(f.root.isConnected,true);assert.equal(f.root.childNodes.length,0);assert.equal(f.view.resolveSurface('owner'),null);
    f.renderer.commit({operation:'reconcile-children',target:f.root,descriptors:[{type:'element',tag:'h1',text:'new generation'}]});
    f.view.projectSurfaceLifecycle(f.record('open',{generation:2}),{renderer:f.renderer});
    assert.equal(f.view.resolveSurface('owner'),f.root);assert.equal(f.root.textContent,'new generation');
  }finally{f.close();}
});
test('bad batches and missing renderer authority fail before any lifecycle mutation',async()=>{
  const f=await fixture();try{
    assert.throws(()=>f.view.projectSurfaceLifecycle({surfaces:[...f.record('closed').surfaces,{id:'owner',status:'open'}]},{renderer:f.renderer}),/unique plain data/);
    assert.equal(f.owner.hidden,false);
    assert.throws(()=>f.view.projectSurfaceLifecycle({get surfaces(){throw Error('snapshot getter executed');}},{renderer:f.renderer}),/complete Surface snapshot/);
    assert.throws(()=>f.view.projectSurfaceLifecycle({surfaces:new Array(1)},{renderer:f.renderer}),/dense data array/);
    assert.throws(()=>f.view.projectSurfaceLifecycle(f.record('closed'),{}),/shared renderer/);assert.equal(f.owner.hidden,false);
    const getter={get id(){throw Error('getter executed');},status:'closed'};
    assert.throws(()=>f.view.projectSurfaceLifecycle({surfaces:[getter]},{renderer:f.renderer}),/unique plain data/);assert.equal(f.owner.hidden,false);
  }finally{f.close();}
});
test('disposed adapter rejects lifecycle and cannot touch retained nodes',async()=>{
  const f=await fixture();try{
    f.view.dispose();assert.throws(()=>f.view.projectSurfaceLifecycle(f.record('closed'),{renderer:f.renderer}),/after disposal/);assert.equal(f.owner.hidden,false);
  }finally{f.close();}
});

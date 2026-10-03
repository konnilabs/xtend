'use strict';
const assert = require('node:assert/strict');
const {createServer}=require('node:http');
const {once}=require('node:events');

async function contractEvolutionChecks({check, checkPhp, load, php}) {
  const portable = await load('rmt-portable-render.js');
  const {createRmtDomDescriptorRenderer} = await load('rmt-dom-descriptor-renderer.js');
  const {createRmtNodeSsrAdapter, getRmtSsrCoverage} = await load('rmt-node-ssr-adapter.js');
  const {encodePageInitialResume, decodePageInitialDocument, encodePageWire, decodePageWire} = await load('page-contract.mjs');
  const {createNodePageHost, renderPageDocument} = await load('node-page-host.mjs');
  const input = {descriptor:{type:'element',tag:'input',attributes:{type:'search',value:'$model.query'}}};
  const props = {search:'email',query:'Explicit value'};
  const artifacts = ['xtend.rmt.portable-render.v1','xtend.rmt.portable-render.v2'].map(schema => portable.createPortableRenderArtifact(input,{schema,inputs:Object.keys(props)}));
  const page = extra => ({schema:'xtend.page-response.v2',kind:'page',version:'fixture',contextKey:'session',page:'Index',url:'/',props:{},...extra});
  await check('legacy scalar attribute bindings remain isolated from canonical literal strings', async () => {
    for (const artifact of artifacts) {
      const projected = portable.projectPortableRender(artifact,props);
      const result = await createRmtNodeSsrAdapter().render({descriptor:projected.descriptor});
      assert(result.ok);
      assert(result.html.includes(`type="${artifact.schema.endsWith('v1') ? 'email' : 'search'}"`));
      assert(result.html.includes('value="Explicit value"'));
    }
    assert.throws(() => portable.projectPortableRender({...artifacts[1],rendererSchema:'xtend.epic18.rmt-dom-descriptor-renderer.v1'},props), /renderer contract/);
    assert.throws(() => createRmtDomDescriptorRenderer({rendererSchema:'unknown',documentTarget:{createElement(){}}}), /renderer contract/);
    const legacy=createRmtDomDescriptorRenderer({rendererSchema:'xtend.epic18.rmt-dom-descriptor-renderer.v1',documentTarget:{createElement(){}}});
    assert.equal(legacy.resolveAttributeValue('search',{model:props}),'email');
    assert(legacy.listDiagnostics().some(value=>value.code==='rmt.dom.attribute.implicit-binding-deprecated' && value.message.includes('$model.search')));
  });
  await check('source and all shipped DOM renderer bundles preserve canonical and legacy attribute semantics', async () => {
    const {createFakeDocument}=require('../rmt/rmt_dom_descriptor_renderer_suite');
    const factories=[createRmtDomDescriptorRenderer];
    for(const file of ['rmt-core.esm.js','rmt-runtime.esm.js'])factories.push((await load(file)).createRmtDomDescriptorRenderer);
    const previous=globalThis.XTendRMT,previousAlias=globalThis['xtend.rmt'];
    try {
      await load('rmt-runtime.browser.js');factories.push(globalThis.XTendRMT.createRmtDomDescriptorRenderer);
      for(const create of factories)for(const legacy of [false,true]) {
        const documentTarget=createFakeDocument();
        const renderer=create({documentTarget,...(legacy?{rendererSchema:'xtend.epic18.rmt-dom-descriptor-renderer.v1'}:{})});
        const root=documentTarget.createElement('main');
        renderer.render(root,input.descriptor,{model:props,source:{pointer:'/descriptor/attributes/type'}});
        assert.equal(root.childNodes[0].getAttribute('type'),legacy?'email':'search');
        assert.equal(root.childNodes[0].getAttribute('value'),'Explicit value');
        const before=root.childNodes[0];
        assert.throws(()=>renderer.render(root,input.descriptor,{model:{search:{secret:true}},rendererSchema:'xtend.epic18.rmt-dom-descriptor-renderer.v1'}),error=>error.code==='rmt.dom.attribute.value-invalid');
        assert.equal(root.childNodes[0],before,'Rejected legacy values cannot replace existing DOM');
        if(legacy)assert(renderer.listDiagnostics().some(value=>value.code==='rmt.dom.attribute.implicit-binding-deprecated'&&value.source.pointer==='/descriptor/attributes/type'));
        renderer.dispose(root);
      }
    } finally {
      if(previous===undefined)delete globalThis.XTendRMT;else globalThis.XTendRMT=previous;
      if(previousAlias===undefined)delete globalThis['xtend.rmt'];else globalThis['xtend.rmt']=previousAlias;
    }
  });
  await checkPhp('portable PHP preserves both released attribute contracts', async () => {
    for (const artifact of artifacts) {
      const projected = portable.projectPortableRender(artifact,props);
      const result = await createRmtNodeSsrAdapter().render({descriptor:projected.descriptor});
      assert.equal(php({artifact,props}).result.html,result.html);
      const unsafe=php({artifact,props:{...props,search:{secret:'private'}}}).result;
      if (artifact.schema.endsWith('v1')) {assert(!unsafe.ok);assert(!unsafe.html.includes('private'));}
      else {assert(unsafe.ok);assert(unsafe.html.includes('type="search"'));}
    }
  });
  await check('legacy Node manifests preserve direct descriptor bindings and the full response transport', async () => {
    const host=createNodePageHost({manifest:{schema:'xtend.page-manifest.v1',version:'legacy',pages:{Index:{input}}},createContext:()=>({contextKey:'legacy'}),resolvePage:()=>({page:'Index',props})});
    const server=createServer((req,res)=>host.handle(req,res));server.listen(0,'127.0.0.1');await once(server,'listening');
    try {
      const response=await fetch(`http://127.0.0.1:${server.address().port}/`,{headers:{'X-XTend-Page':'1'}});
      const page=await response.json();assert.equal(response.status,200);assert.equal(page.schema,'xtend.page-response.v1');
      assert(page.ssr.chunk.markup.html.includes('type="email"'));assert(page.ssr.chunk.markup.html.includes('value="Explicit value"'));
    } finally {host.dispose();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  });
  await check('SSR marker coverage has a separate typed telemetry contract with honest empty and opaque counts', async () => {
    const adapter=createRmtNodeSsrAdapter();
    const empty=await adapter.render({descriptor:{type:'empty'}});
    assert.equal(getRmtSsrCoverage(empty).resumeMarkerCoverage,null);
    assert(!Object.hasOwn(empty.hydration,'coverage'));
    const descriptor={type:'fragment',children:[{type:'component',component:'x-unknown'},{type:'html',html:'<p>Opaque</p>',trustBoundary:'sanitized'}]};
    const result=await adapter.render({descriptor});
    const coverage=getRmtSsrCoverage(result);
    assert.equal(coverage.componentNodes,1);assert.equal(coverage.missingCapabilityNodes,1);
    assert.equal(coverage.rawHtmlFragments,1);assert.equal(coverage.descriptorElementNodes,1);
    assert.equal(coverage.resumeMarkerCoverage,0);
    const marked=await adapter.render({descriptor:{type:'element',tag:'p'}},{executionMode:'server_prerender_resume',resume:{sign:()=>({keyId:'test',signature:'test'})}});
    assert.equal(getRmtSsrCoverage(marked).resumeMarkerCoverage,1);
    assert.throws(()=>getRmtSsrCoverage({fabricTelemetryHints:{coverage:{...coverage,resumeMarkedNodes:2}}}),/Invalid SSR coverage/);
    assert.equal(getRmtSsrCoverage({}),null);
  });
  const descriptor={type:'element',tag:'p',text:'Resume and recover'};
  const result=await createRmtNodeSsrAdapter().render({descriptor},{executionMode:'server_prerender_resume',resume:{state:{draft:'kept'},sign:()=>({keyId:'fixture',signature:'fixture'})}});
  const full=page({renderArtifact:portable.createPortableRenderArtifact({descriptor}),ssr:result.response});
  const initial=encodePageInitialResume(full);
  await check('initial resume owns reduced chunks and leaves ordinary responses complete', () => {
    assert.equal(initial.ssr.kind,undefined);assert.equal(initial.ssr.chunk.kind,undefined);
    assert.deepEqual(Object.keys(initial.ssr.chunk.markup),['descriptor']);
    assert.deepEqual(decodePageInitialDocument(initial).ssr.resume,full.ssr.resume);
    assert.equal(full.ssr.chunk.markup.html,result.html);
    assert.throws(()=>decodePageInitialDocument({...initial,schema:'xtend.page-initial-resume.v'+99}));
    assert.throws(()=>decodePageInitialDocument({...initial,ssr:{...initial.ssr,kind:full.ssr.kind}}));
    assert.throws(()=>decodePageInitialDocument({...initial,ssr:{...initial.ssr,resume:{...initial.ssr.resume,version:99}}}));
    assert.throws(()=>encodePageWire(initial),/reference table/);
    const legacy={...full,schema:'xtend.page-response.v1',renderArtifact:portable.createPortableRenderArtifact({descriptor},{schema:'xtend.rmt.portable-render.v1'})};
    const document=renderPageDocument(legacy,result.html);
    const raw=JSON.parse(document.match(/id="xtend-page-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
    assert.equal(decodePageInitialDocument(raw).ssr.chunk.markup.html,result.html);
    for (const value of [legacy,full]) {
      const wire=encodePageWire(value);assert.deepEqual(decodePageWire(wire),value);
      assert.throws(()=>decodePageWire({...wire,schema:wire.schema.endsWith('v1')?'xtend.page-wire.v2':'xtend.page-wire.v1'}),/reference table/);
    }
    assert.throws(()=>createNodePageHost({manifest:{schema:'xtend.page-manifest.v1',version:'fixture',pages:{Index:{artifact:artifacts[1]}}}}),/Legacy manifests/);
    assert.throws(()=>createNodePageHost({manifest:{schema:'xtend.page-manifest.v2',version:'fixture',initialResumeSchema:'unknown',pages:{}}}),/initial resume/);
  });
  await checkPhp('PHP and Node emit identical initial resume envelopes with preserved signatures and recovery', () => {
    assert.deepEqual(php({operation:'initial',page:full}),JSON.parse(JSON.stringify(initial)));
    assert.deepEqual(php({operation:'wire',page:full}),encodePageWire(full));
  });
}
module.exports={contractEvolutionChecks};

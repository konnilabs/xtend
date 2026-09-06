'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const { createServer } = require('node:http');
const { once } = require('node:events');
const { createSuiteContext } = require('../utils/assertions');
async function runSsrPagesSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '../..');
  const context = createSuiteContext({ id: options.phpParityOnly ? 'ssr-pages-php' : 'ssr-pages', label: options.phpParityOnly ? 'Portable Node/PHP render parity' : 'Shared page contracts and Node host' });
  const load = name => import(pathToFileURL(path.join(rootDir, 'xtendrmt', name)).href);
  const portable = await load('rmt-portable-render.js');
  const { createRmtNodeSsrAdapter } = await load('rmt-node-ssr-adapter.js');
  const { Prop, resolvePageProps, mergePageProps, safePageJson } = await load('page-contract.mjs');
  const { createNodePageHost } = await load('node-page-host.mjs');
  const { createPageClient } = await load('page-client.mjs');
  const { createPageForm } = await load('page-form.mjs');
  const runCheck = async (name, action) => { try { await action(); context.pass(name); } catch (error) { context.fail(`${name}: ${error.stack || error}`); } };
  const check = (name, action) => options.phpParityOnly ? undefined : runCheck(name, action);
  const checkPhp = (name, action) => options.phpParityOnly ? runCheck(name, action) : undefined;
  const php = input => JSON.parse(execFileSync(process.env.XTEND_PHP_BINARY || 'php', [path.join(__dirname, 'portable_probe.php'), rootDir], { input: JSON.stringify(input), encoding: 'utf8', timeout: 10000 }));
  const artifact = portable.createPortableRenderArtifact({ descriptor: { type: 'element', tag: 'section', children: [
    { type: 'element', tag: 'h1', children: [{ type: 'text', text: '$model.title' }] },
    { type: 'conditional', test: '$model.visible', then: { type: 'text', text: 'Shown' }, else: { type: 'text', text: 'Hidden' } },
    { type: 'repeat', source: { op: 'filter', value: '$model.orders', where: [{ path: 'active', op: 'equals', value: true }] }, key: 'id', template: { type: 'element', tag: 'p', attributes: { 'data-id': '$item.id' }, children: [{ type: 'text', text: '$item.name' }] } }
  ] } }, { inputs: ['title', 'visible', 'orders'], defaults: { title: 'Default', visible: false, orders: [] } });
  await checkPhp('portable PHP and Node render the same changing controller data', async () => {
    for (const title of ['Controller <value>', '', false, 0, null, 'Grüße 🌍']) {
      const props = { title, visible: true, orders: [{ id: 1, name: 'First', active: true }, { id: 2, name: 'Hidden', active: false }] };
      const projected = portable.projectPortableRender(artifact, props);
      const node = await createRmtNodeSsrAdapter().render({ descriptor: projected.descriptor }, { model: projected.model });
      const result = php({ artifact, props });
      assert.equal(node.ok, true); assert.equal(result.result.ok, true); assert.equal(node.html, result.result.html);
      assert.equal(node.html.includes('Default'), false); assert.equal(node.html.includes('data-id="2"'), false);
    }
  });
  await check('PHP target rejects nonportable expressions while Node remains available', () => {
    const input = { descriptor: { type: 'text', text: { op: 'replace', value: '$model.title', search: 'a', replacement: 'b' } } };
    assert.throws(() => portable.createPortableRenderArtifact(input), /cannot execute/);
    assert.deepEqual(portable.createPortableRenderArtifact(input, { target: 'node' }).targets, ['node']);
  });
  await checkPhp('compiler state projection and static identities survive dynamic host values', async () => {
    const { compileRmtVNextSource } = require('../../tools/rmt-language/vnext-compiler');
    const compiled = compileRmtVNextSource({text: fs.readFileSync(path.join(rootDir, 'tests/rmt-language/fixtures/maraca-orchestration-app.rmt'), 'utf8')});
    assert.equal(compiled.ok, true);
    const artifact = portable.createPortableRenderArtifact(compiled);
    const props = {'demo.orchestration.status': {id:'current', text:'Controller data', tone:'success'}};
    const projected = portable.projectPortableRender(artifact, props);
    const node = await createRmtNodeSsrAdapter().render({descriptor:projected.descriptor}, {model:projected.model});
    const result = php({artifact, props});
    // The existing PHP adapter supplies a default component-family registry;
    // runtime-only Node installations may inject their own registry.
    const markup = html => html.replace(/ data-rmt-component-family="[^"]*"/gu, '');
    assert.equal(markup(node.html), markup(result.result.html));
    assert.match(node.html, /data-rmt-primitive-id="demo.orchestration.status"/);
    assert.match(node.html, />Controller data<\/x-status>/);
  });
  await checkPhp('projected data is evaluated once even if it resembles an expression', async () => {
    const props = {title:'$model.visible', visible:true, orders:[]};
    const projected = portable.projectPortableRender(artifact, props);
    const node = await createRmtNodeSsrAdapter().render({descriptor:projected.descriptor}, {model:projected.model});
    assert.match(node.html, /<h1>\$model.visible<\/h1>/);
    assert.equal(node.html, php({artifact,props}).result.html);
  });
  await checkPhp('JSON objects, empty lists, nulls and multiple named slot children retain parity', async () => {
    const artifact=portable.createPortableRenderArtifact({descriptor:{type:'component',component:'x-status',slots:{details:[{type:'element',tag:'span',text:'$model.value'},{type:'element',tag:'strong',text:{op:'path',path:'$model.missing'}}]}}},{inputs:['value']});
    for(const value of [{},[],{name:'record'},null,false,0,'$model.missing']) {
      const props={value},projected=portable.projectPortableRender(artifact,props);
      const result=await createRmtNodeSsrAdapter().render({descriptor:projected.descriptor},{model:projected.model});
      const clean=html=>html.replace(/ data-rmt-component-family="[^"]*"/gu,'');
      assert.equal(clean(result.html),clean(php({artifact,props}).result.html));
      assert.equal((result.html.match(/slot="details"/gu)||[]).length,2);
    }
  });
  await check('structural forms remain available while raw HTML keeps its trust boundary', async () => {
    const input = {descriptor:{type:'element',tag:'form',attributes:{action:'/orders',method:'post'},children:[]}};
    assert.equal((await createRmtNodeSsrAdapter().render(input)).ok,false);
    const node = await createRmtNodeSsrAdapter().render(input,{nativeForms:true});
    assert.equal(node.ok,true); assert.match(node.html, /^<form /);
  });
  await checkPhp('portable expressions preserve scalar coercions, filters and Unicode slices', async () => {
    const literal = value => ({op:'literal',value});
    const expressions = [
      {op:'truthy',path:'$model.value'}, {op:'equals',left:'$model.value',right:literal(1)},
      {op:'contains',value:'HELLO World',search:'hello',ignoreCase:true},
      {op:'reduce',mode:'sum',value:literal([true,null,'2',3.5])},
      {op:'reduce',value:'$model.value'}, {op:'bytes',value:'$model.value'}, {op:'duration',value:'$model.value'},
      {op:'slice',value:'A🌍B',start:1,end:3},
      {op:'reduce',value:{op:'filter',value:literal([{id:1,active:true},{id:2,active:false}]),where:{path:'id',op:'gt',value:'1'}}},
      {op:'reduce',value:{op:'filter',value:literal([{name:'HELLO'},{name:'bye'}]),where:[{path:'name',op:'contains',value:'hello',ignoreCase:true}]}},
      {op:'reduce',value:{op:'filter',value:literal([{id:1},{id:2}]),where:[{path:'id',value:1.0}]}},
      {op:'fallback',path:'$model.missing',fallback:'Initial'},
    ];
    const testArtifact=portable.createPortableRenderArtifact({descriptor:{type:'element',tag:'main',children:expressions.map(text=>({type:'element',tag:'p',text}))}},{inputs:['value']});
    for(const value of [null, false, true, 0, 1, 1024, '2', '', 'invalid']) {
      const props={value}, projected=portable.projectPortableRender(testArtifact,props);
      const node=await createRmtNodeSsrAdapter().render({descriptor:projected.descriptor},{model:projected.model});
      assert.equal(php({artifact:testArtifact,props}).result.html,node.html,`Expression parity for ${JSON.stringify(value)}`);
    }
  });
  const core = { schema: 'xtend.rmt.core-format.vnext.v1', surfaces: [], dataSources: [{id:'source:orders', target:'orders.load', kind:'endpoint'}], operations: [{id:'orders.stream', kind:'stream', source:{ref:'source:orders'}}] };
  await checkPhp('resolver failures terminate PHP and Node streams unsuccessfully without leaking errors', async () => {
    for (const throws of [false, true]) {
      const phpFrames = php({ operation: 'stream', core, throw: throws });
      assert.equal(phpFrames.at(-1).payload.ok, false); assert.equal(phpFrames.filter(frame => frame.type === 'complete').length, 1); assert.equal(JSON.stringify(phpFrames).includes('private exception'), false);
      const adapter = createRmtNodeSsrAdapter(throws ? { resolveDataSource() { throw new Error('private exception'); } } : {});
      const frames = []; for await (const line of adapter.streamJsonl(core)) frames.push(JSON.parse(line));
      assert.equal(frames.at(-1).payload.ok, false); assert.equal(frames.filter(frame => frame.type === 'complete').length, 1); assert.equal(JSON.stringify(frames).includes('private exception'), false);
    }
  });
  await check('partial, deferred and once providers only evaluate requested values', async () => {
    const calls = [];
    const input = { first: Prop.lazy(() => { calls.push('first'); return 1; }), second: Prop.defer(() => { calls.push('second'); return 2; }, 'later'), lookup: Prop.once(() => { calls.push('lookup'); return 3; }) };
    let result = await resolvePageProps(input); assert.deepEqual(calls, ['lookup']); assert.deepEqual(result.deferred.later, ['second']);
    result = await resolvePageProps(input, {}, { only: ['first'], once: ['lookup'] }); assert.deepEqual(calls, ['lookup', 'first']); assert.equal(result.props.first, 1);
    result = await resolvePageProps(input, {}, { deferred: ['later'] }); assert.equal(result.props.second, 2); assert.deepEqual(calls, ['lookup', 'first', 'second']);
  });
  await check('keyed page merges update without duplicates and reject ambiguous keys', () => {
    assert.deepEqual(mergePageProps({ rows: [{id:1,v:'old'}] }, {rows:[{id:1,v:'new'}, {id:2,v:'added'}]}, { rows:{mode:'append',key:'id'} }).rows, [{id:1,v:'new'}, {id:2,v:'added'}]);
    assert.throws(() => mergePageProps({ rows: [] }, {rows:[{id:1}, {id:1}]}, {rows:{mode:'append',key:'id'}}), /unique identities/);
    assert.equal(safePageJson({value:'</script>'}).includes('<'), false);
  });
  await check('Node pages serve initial HTML, selective JSON, redirects and host-isolated contexts', async () => {
    const host = createNodePageHost({ manifest: { schema:'xtend.page-manifest.v1', version:'v1', pages:{ Index:{artifact} } },
      createContext: req => ({contextKey: req.headers['x-user'] || 'guest'}),
      resolvePage: ctx => ctx.request.url === '/redirect' ? {redirect:'/'} : { page:'Index', props:{ title:'Server title', visible:true, orders:[] } }
    });
    const server = createServer((req,res) => { host.handle(req,res).then(handled => { if (!handled) {res.statusCode=404;res.end();} }); });
    server.listen(0,'127.0.0.1'); await once(server,'listening');
    try {
      const url = `http://127.0.0.1:${server.address().port}`;
      let response = await fetch(url); assert.equal(response.status,200); const html = await response.text(); assert.match(html,/Server title/); assert.match(html,/xtend-page-data/);
      response = await fetch(url,{headers:{'X-XTend-Page':'1','X-XTend-Only':'["title"]','X-User':'alice'}}); let body = await response.json(); assert.equal(body.contextKey,'alice'); assert.equal(body.partial,true); assert.deepEqual(body.props,{title:'Server title'});
      response = await fetch(url,{headers:{'X-XTend-Page':'1','X-User':'bob'}}); body=await response.json(); assert.equal(body.contextKey,'bob');
      response = await fetch(url+'/redirect',{headers:{'X-XTend-Page':'1'}}); assert.equal(response.status,409); assert.equal((await response.json()).kind,'redirect');
      response = await fetch(url,{headers:{'X-XTend-Page':'1','X-XTend-Version':'old'}}); assert.equal((await response.json()).kind,'reload');
    } finally { host.dispose(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  });
  const page = (name, extra = {}) => ({schema:'xtend.page-response.v1',kind:'page',version:'1',contextKey:'alice',page:name,url:`/${name}`,props:{},head:[],errors:{},flash:{},shared:{},deferred:{},once:{},merge:{},partial:false,layout:null,...extra});
  await check('a late navigation cannot replace a newer page', async () => {
    let release;
    const client = createPageClient({initialPage:page('start'), fetch: async url => { if (url.endsWith('/slow')) await new Promise(resolve => { release=resolve; }); return Response.json(page(url.endsWith('/slow')?'slow':'fast')); }});
    const slow=client.visit('/slow'); while (!release) await new Promise(resolve=>setImmediate(resolve)); await client.visit('/fast'); release(); await slow; assert.equal(client.page.page,'fast'); client.dispose();
  });
  await check('form errors stay in their error bag and failed submissions preserve input', async () => {
    const client=createPageClient({initialPage:page('edit'),fetch: async()=>Response.json(page('edit',{errors:{edit:{name:['Required']}}}))});
    const form=createPageForm({client,errorBag:'edit',defaults:{name:''}}); form.set('name','changed'); await form.submit('/edit'); assert.deepEqual(form.state.errors,{name:['Required']}); assert.equal(form.state.values.name,'changed'); assert.equal(form.state.success,false); assert.equal(form.state.processing,false); form.dispose();client.dispose();
  });
  await check('a stale submission cannot reset newer edits or validate another form', async () => {
    let finish;
    const client=createPageClient({initialPage:page('edit'),fetch:()=>new Promise(resolve=>{finish=()=>resolve(Response.json(page('edit')));})});
    const form=createPageForm({client,defaults:{name:'before'}}), second=createPageForm({client,defaults:{name:'other'},errorBag:'other'});
    form.set('name','submitted'); const work=form.submit('/edit',{resetOnSuccess:true});
    while(!finish)await new Promise(resolve=>setImmediate(resolve)); form.set('name','newer edit'); finish(); await work;
    assert.equal(form.state.values.name,'newer edit'); assert.equal(form.state.processing,false); assert.equal(form.state.success,false); assert.equal(second.state.values.name,'other');
    form.dispose();second.dispose();client.dispose();
  });
  await check('retaining once props does not extend their declared expiration', async () => {
    const realNow=Date.now; let now=1000,headers;
    try {
      Date.now=()=>now;
      const client=createPageClient({initialPage:page('edit',{props:{lookup:'first'},once:{lookup:{key:'lookup',ttl:100}}}),fetch:async(_,settings)=>{headers=settings.headers;return Response.json(page('edit'));}});
      now=1050;await client.commit(page('edit',{partial:true,once:{lookup:{key:'lookup',ttl:100}}}));assert.equal(client.page.props.lookup,'first');
      now=1120;await client.request('/edit');assert.equal(headers['X-XTend-Once'],undefined);client.dispose();
    }finally{Date.now=realNow;}
  });
  await check('async render commits retain navigation order', async () => {
    let release,started=false;const rendered=[];
    const client=createPageClient({initialPage:page('start'),fetch:async url=>Response.json(page(url.endsWith('/slow')?'slow':'fast')),render:async next=>{if(next.page==='slow'){started=true;await new Promise(resolve=>{release=resolve;});}rendered.push(next.page);}});
    const slow=client.visit('/slow');while(!started)await new Promise(resolve=>setImmediate(resolve));const fast=client.visit('/fast');release();await Promise.all([slow,fast]);assert.equal(client.page.page,'fast');assert.equal(rendered.at(-1),'fast');client.dispose();
  });
  await check('a nonresponsive Node stream emits one failed terminal frame within its deadline', async () => {
    const adapter=createRmtNodeSsrAdapter({resolveDataSource:()=>new Promise(()=>{})});const frames=[];
    for await(const line of adapter.streamJsonl(core,{streamTimeoutMs:10,cleanupTimeoutMs:10}))frames.push(JSON.parse(line));
    assert.equal(frames.at(-1).type,'complete');assert.equal(frames.at(-1).payload.ok,false);assert.equal(frames.filter(frame=>frame.type==='complete').length,1);
  });
  await check('page builds reuse compiler facts and expose source/host/artifact links', async () => {
    const os=require('node:os');const directory=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-pages-build-test-'));
    try {
      fs.copyFileSync(path.join(rootDir,'tests/rmt-language/fixtures/maraca-orchestration-app.rmt'),path.join(directory,'page.rmt'));
      fs.mkdirSync(path.join(directory,'vendor'));fs.writeFileSync(path.join(directory,'vendor/ignored.rmt'),'template dependency {}');
      fs.writeFileSync(path.join(directory,'xtend.pages.json'),JSON.stringify({schema:'xtend.page-build.v1',host:'laravel',pages:{Index:{source:'page.rmt'}}}));
      const {buildPages}=require('../../tools/rmt-language/page-build');const first=await buildPages({root:directory}),second=await buildPages({root:directory});
      assert.equal(first.manifest.version,second.manifest.version);assert.equal(first.sourceCount,1);assert.equal(first.output,path.join(directory,'bootstrap/xtend/pages.json'));
      const index=require('../../tools/project-index').createProjectIndex({rootDir:directory,profile:'repository',git:false});const snapshot=index.snapshot();
      assert(snapshot.relationships.some(edge=>edge.kind==='generated-from'&&edge.specifier==='Index'&&edge.role==='laravel'&&edge.to.endsWith('/page.rmt')));
      assert(!snapshot.documents.some(file=>file.workspacePath?.startsWith('vendor/')));index.dispose();
      assert.throws(()=>portable.createPortableRenderArtifact({descriptor:{type:'text',text:{op:'literal',value:BigInt(1)}}}),/safe JSON/);
      const assets=path.join(directory,'public/build');fs.mkdirSync(assets,{recursive:true});
      for(const file of ['entry.js','shared.js','shared.css'])fs.writeFileSync(path.join(assets,file),'initial');
      fs.writeFileSync(path.join(assets,'manifest.json'),JSON.stringify({app:{file:'entry.js',imports:['shared']},shared:{file:'shared.js',css:['shared.css']}}));
      const configuration={schema:'xtend.page-build.v1',pages:{Index:{source:'page.rmt'}},vite:{entry:'app'}};
      fs.writeFileSync(path.join(directory,'xtend.pages.json'),JSON.stringify(configuration));
      const vite=await buildPages({root:directory});assert.deepEqual(vite.manifest.assets,{entry:'/build/entry.js',css:['/build/shared.css']});
      assert(vite.manifest.assetFingerprints['/build/shared.js']);
      fs.writeFileSync(path.join(assets,'shared.js'),'changed');
      assert.notEqual((await buildPages({root:directory})).manifest.version,vite.manifest.version);
      fs.unlinkSync(path.join(assets,'shared.css'));await assert.rejects(buildPages({root:directory}),/ENOENT/);
      delete configuration.vite;configuration.pages.Index.layout='Absent';
      fs.writeFileSync(path.join(directory,'xtend.pages.json'),JSON.stringify(configuration));await assert.rejects(buildPages({root:directory}),/unknown layout/);
      delete configuration.pages.Index.layout;configuration.layouts={Shell:{source:'page.rmt',outlet:'absent'}};
      fs.writeFileSync(path.join(directory,'xtend.pages.json'),JSON.stringify(configuration));await assert.rejects(buildPages({root:directory}),/exactly one compiled outlet/);
    } finally {fs.rmSync(directory,{recursive:true,force:true});}
  });
  await check('disconnecting Node and Web streams cancels a pending provider within cleanup bounds', async () => {
    let started;
    const adapter=createRmtNodeSsrAdapter({resolveDataSource:()=>{started=true;return new Promise(()=>{});}});
    const node=adapter.toNodeReadable(core,{streamTimeoutMs:5000,cleanupTimeoutMs:20});
    node.resume(); while(!started)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(node.readableObjectMode,true, 'The public Node readable retains string frames.');
    const closed=once(node,'close'); node.destroy();
    let timer;
    try {await Promise.race([closed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Node stream did not close.')),300);})]);}
    finally {clearTimeout(timer);}
    started=false;
    const reader=adapter.toReadableStream(core,{streamTimeoutMs:5000,cleanupTimeoutMs:20}).getReader();
    while(JSON.parse((await reader.read()).value).type!=='html') { /* Consume the initial envelope. */ }
    const pending=reader.read(); while(!started)await new Promise(resolve=>setImmediate(resolve));
    try {await Promise.race([reader.cancel(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Web stream did not cancel.')),300);})]);await pending;}
    finally {clearTimeout(timer);}
  });
  await require('./operational_checks').operationalChecks({check,checkPhp,load,page,php});
  await check('packed Node page runtime operates without PHP or checkout fallback', () => require('./packed_node_check').checkPackedNode(rootDir));
  return context.result();
}
if (require.main === module) runSsrPagesSuite().then(result => {console.log(JSON.stringify(result,null,2)); process.exitCode=result.ok?0:1;});
function runPhpPageParitySuite(options = {}) { return runSsrPagesSuite({...options, phpParityOnly:true}); }
module.exports = {runSsrPagesSuite,runPhpPageParitySuite};

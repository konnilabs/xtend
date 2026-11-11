'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createSuiteContext } = require('../utils/assertions');
const { prepareXTensionsTestPeers, npmCommand } = require('../../scripts/prepare_xtensions_test_peers');
function command(name,args,options) {
  const r=spawnSync(name,args,{encoding:'utf8',timeout:90000,maxBuffer:16*1024*1024,...options});
  if(r.error||r.status!==0)throw r.error||Error(`${name} failed: ${r.stderr}\n${r.stdout}`);
  return r.stdout;
}
async function runXTensionsConsumerPackageSuite({ rootDir } = {}) {
  const context = createSuiteContext({id:'xtensions-consumer-package',label:'Packed XTensions consumers without implicit framework dependencies'});
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'xtend-packed-consumer-'));
  const artifact=path.join(rootDir,'.xtend-test-results/xtend-xtensions-consumer-package-report.json');
  fs.mkdirSync(path.dirname(artifact),{recursive:true});fs.rmSync(artifact,{force:true});
  try {
    const peers=prepareXTensionsTestPeers({rootDir});
    fs.writeFileSync(path.join(temp,'package.json'),JSON.stringify({name:'isolated-xtend-consumer',private:true}));
    for(const directory of [rootDir,path.join(rootDir,'tools')]){
      const [pack]=JSON.parse(npmCommand(['pack','--json','--ignore-scripts','--pack-destination',temp],{cwd:directory,encoding:'utf8',timeout:90000,maxBuffer:16*1024*1024}));
      assert(!pack.files.some(file=>/node_modules\/(react|react-dom|vue)(\/|$)|runtime-peers/.test(file.path)),'Packed package must not contain test peers or framework runtimes');
      const target=path.join(temp,'node_modules',pack.name);fs.mkdirSync(target,{recursive:true});
      command('tar',['-xzf',path.join(temp,pack.filename),'-C',target,'--strip-components=1']);
      const manifest=JSON.parse(fs.readFileSync(path.join(target,'package.json')));
      for(const section of ['dependencies','optionalDependencies','peerDependencies'])for(const name of ['react','react-dom','vue'])assert(!manifest[section]?.[name],`${pack.name} must not install framework ${name} for all consumers`);
      for(const framework of ['react','vue']){
        const entry=manifest.exports[`./xtensions/${framework}-runtime-adapter`];
        for(const condition of ['types','default'])assert(fs.existsSync(path.join(target,entry[condition])),`${pack.name} packs ${framework} ${condition} target`);
      }
      const urlEntry=manifest.exports['./xtensions/url-state'];
      for(const condition of ['types','default'])assert(fs.existsSync(path.join(target,urlEntry[condition])),`${pack.name} packs URL-state ${condition} target`);
      assert.equal(require(path.join(target,urlEntry.default)).API_VERSION,'1.0.0','packed URL runtime includes its schema dependencies');
      const bindingEntry=manifest.exports['./xtensions/state-binding'];
      for(const condition of ['types','default'])assert(fs.existsSync(path.join(target,bindingEntry[condition])),`${pack.name} packs state binding ${condition} target`);
      context.pass(`${pack.name}: actual npm tarball contains the reviewed runtime targets and no framework dependencies`);
    }
    {
      const [pack] = JSON.parse(npmCommand(['pack', '--json', '--ignore-scripts', '--pack-destination', temp], { cwd: path.join(rootDir, 'xtend-maraca'), encoding: 'utf8', timeout: 90000, maxBuffer: 16 * 1024 * 1024 }));
      const target = path.join(temp, 'node_modules', pack.name); fs.mkdirSync(target, { recursive: true });
      command('tar', ['-xzf', path.join(temp, pack.filename), '-C', target, '--strip-components=1']);
      const manifest = JSON.parse(fs.readFileSync(path.join(target, 'package.json')));
      for (const subpath of ['xtension-composition', 'xtension-composition-runtime']) for (const condition of ['types', 'default']) assert(fs.existsSync(path.join(target, manifest.exports['./' + subpath][condition])));
      assert(fs.existsSync(path.join(target, 'xtension-composition-contract.mjs')));
      assert(fs.existsSync(path.join(target, 'xtension-platform-build.js')));
      assert(fs.existsSync(path.join(target, 'xtension-deployment.js')));
      context.pass('Packed Maraca contains both versioned A04 APIs and their private data contract');
    }
    const fixture=path.join(temp,'consumer.cjs');
    fs.writeFileSync(fixture, `
'use strict';
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const peers=createRequire(process.env.XTENSIONS_TEST_PEERS+'/package.json');
(async()=>{
 for(const name of ['react','react-dom','vue'])assert.throws(()=>require.resolve(name),{code:'MODULE_NOT_FOUND'});
 await import('@ccslabs/xtend');
 const {createRmtStateSelectorRuntime}=await import('@ccslabs/xtend/rmt/state-selector-runtime');
 const {createRmtKernelScheduler}=await import('@ccslabs/xtend/rmt/kernel-scheduler');
 const {createRmtCore}=await import('@ccslabs/xtend/rmt');
 const {createRmtSurfaceResourceGraphRuntime}=await import('@ccslabs/xtend/rmt/surface-resource-graph-runtime');
 const {createSurfaceController}=await import('@ccslabs/xtend/components/xsurfacemanager-controller.js');
 const {createXtendFabric}=require('@ccslabs/xtend/fabric');
 const {JSDOM}=peers('jsdom');const dom=new JSDOM('<!doctype html><body></body>',{pretendToBeVisual:true,url:'http://xtend.test/packed'});
 for(const key of ['window','document','Node','Element','HTMLElement','SVGElement','navigator','MutationObserver','Event','CustomEvent'])Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]});
 const React=peers('react'),ReactDOM={...peers('react-dom/client'),version:peers('react-dom').version},Vue=peers('vue');
 try{
  for(const pkg of ['@ccslabs/xtend','@ccslabs/xtend-compiler']){
   const {createXTensionStateRegistry,XTENSION_STATE_BINDING_SCHEMA,validateStateBindingArtifact,materializeStateBindingArtifact}=require(pkg+'/xtensions/state-binding');
   const repeatedPlan=${JSON.stringify(require('../../development/rmtx-a02/inspect.cjs').inspectRepeated())};
   const validated=validateStateBindingArtifact(repeatedPlan.xtensionBindings,repeatedPlan.orchestration.artifact);
   const repeatedStates=Object.fromEntries(repeatedPlan.orchestration.artifact.state.states.map(state=>[state.id,state.initial]));
   const rows=materializeStateBindingArtifact(validated,{states:repeatedStates});
   assert.equal(rows.length,3);assert.notEqual(rows[0].hostSurface,rows[1].hostSurface);
   assert.throws(()=>materializeStateBindingArtifact(JSON.parse(JSON.stringify(validated)),{states:repeatedStates}),/validated/);
   const model=createRmtStateSelectorRuntime({states:[{id:'title',type:'string',initial:'packed binding'}]});
   const registry=createXTensionStateRegistry({modelReader:model.modelReader,modelCommandPort:model.modelCommandPort});
   const container=document.createElement('section');document.body.append(container);
   const bound=registry.bind({schema:XTENSION_STATE_BINDING_SCHEMA,address:{documentId:pkg,declarationId:'title',keys:[]},
    props:{title:{state:'title',path:[],type:'string'}},intents:{}},context=>require(pkg+'/xtensions/react-runtime-adapter').createReactRuntimeAdapter({
     ...context,container,component:props=>React.createElement('p',null,props.title),peers:{React,ReactDOM},policy:{events:context.events}}));
   await bound.mount();assert.equal(container.textContent,'packed binding');
   model.setState('title','updated binding');await bound.whenIdle();assert.equal(container.textContent,'updated binding');
   await registry.dispose();assert.equal(container.childNodes.length,0);container.remove();
  }
  for(const pkg of ['@ccslabs/xtend','@ccslabs/xtend-compiler'])for(const framework of ['react','vue']){
   const title=framework[0].toUpperCase()+framework.slice(1),api=require(pkg+'/xtensions/'+framework+'-runtime-adapter');
   assert.throws(()=>api['normalize'+title+'Peers']({}),TypeError);
   const container=document.createElement('section');document.body.append(container);
   const component=framework==='react'?props=>React.createElement('p',null,props.title):{props:['title','xtension'],setup:props=>()=>Vue.h('p',props.title)};
   const adapter=api['create'+title+'RuntimeAdapter']({container,component,peers:framework==='react'?{React,ReactDOM}:{Vue}});
   assert.equal((await adapter.mount(container,{title:'packed'})).ok,true);assert.equal(container.textContent,'packed');
   const cycle={};cycle.self=cycle;assert.equal((await adapter.update({props:cycle,updateAdapter:'applyPropsUpdate'})).status,'policy-blocked');
   assert.equal((await adapter.update({props:{title:'consumer'},updateAdapter:'applyPropsUpdate'})).ok,true);assert.equal(container.textContent,'consumer');
   await adapter.unmount();assert.equal(container.childNodes.length,0);
   const scheduler=createRmtKernelScheduler({preferPostTask:false}),fabric=createXtendFabric();let capabilities;
   const kernelComponent=framework==='react'?props=>{capabilities=props.xtension;return React.createElement('p',null,props.title);}:{props:['title','xtension'],setup:props=>()=>{capabilities=props.xtension;return Vue.h('p',props.title);}};
   const kernel=api['create'+title+'KernelRuntimeAdapter']({container,component:kernelComponent,peers:framework==='react'?{React,ReactDOM}:{Vue},fabric,kernelWork:{scheduler,rootId:'packed',scope:pkg+':'+framework,work:{scan:{lane:'background'}}}});
   assert.equal(kernel.schema,'xtend.xtensions.runtime-host-controller.v3');assert.equal((await kernel.mount(container,{title:'kernel packed'})).ok,true);
   const task=capabilities.work.schedule('scan',context=>context.isCurrent());assert.equal(await task.result,true);assert.equal(scheduler.getJob(task.jobId).status,'completed');
   assert(fabric.getFibers().some(fiber=>fiber.metadata.kernelJobId===task.jobId));await kernel.unmount();
   const engine=createRmtCore({scheduler,documentTarget:document,windowTarget:window}).rmt;engine.mountRoot('packed-owned',document.body);
   const controller=createSurfaceController({fabric}),graph=createRmtSurfaceResourceGraphRuntime({surfaces:[{id:'packed-panel',initialState:'open'}],surfaceController:controller,strict:true});graph.materialize();
   const owned=api['create'+title+'KernelRuntimeAdapter']({container,component:kernelComponent,peers:framework==='react'?{React,ReactDOM}:{Vue},fabric,
    kernelWork:{scheduler,rootId:'packed-owned',scope:pkg+':'+framework,work:{scan:{lane:'background'}}},resourceGraph:{kernel:engine,surfaceGraph:graph,surfaceController:controller,surfaceId:'packed-panel'}});
   assert.equal(owned.apiVersion,'4.0.0');assert.equal((await owned.mount(container,{title:'graph packed'})).ok,true);assert.equal(engine.listResources().length,1);
   graph.closeSurface('packed-panel');assert(owned.snapshot().suspended);assert.equal((await owned.update({type:'props.update',props:{title:'staged packed'}})).ok,true);
   await graph.openSurface('packed-panel');await owned.whenIdle();assert.equal(container.textContent,'staged packed');
   assert.equal(await capabilities.work.schedule('scan',context=>context.isCurrent()).result,true);
   await owned.unmount();assert.equal(engine.listResources().length,0);
   const budget=api['create'+title+'KernelRuntimeAdapter']({container,component:kernelComponent,peers:framework==='react'?{React,ReactDOM}:{Vue},fabric,
    kernelWork:{scheduler,rootId:'packed-owned',scope:pkg+':'+framework,work:{scan:{lane:'background',maxChunkMs:4}}},resourceGraph:{kernel:engine,surfaceGraph:graph,surfaceController:controller,surfaceId:'packed-panel'},
    workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1,pressure:{critical:{admission:'reject',maxChunkMs:1}}}}}});
   assert.equal(budget.apiVersion,'5.0.0');assert.equal((await budget.mount(container,{title:'budget packed'})).ok,true);
   scheduler.updatePressure('critical');const denied=capabilities.work.schedule('scan',()=>true);assert.equal(denied.jobId,null);await assert.rejects(denied.result,{reason:'kernel-pressure'});
   scheduler.updatePressure('normal');assert.equal(await capabilities.work.schedule('scan',()=>42).result,42);assert.equal(budget.snapshot().workBudget.rejected,1);
   await budget.unmount();assert.equal(engine.listResources().length,0);
   const negotiatedOptions={container,component:kernelComponent,peers:framework==='react'?{React,ReactDOM}:{Vue},fabric,
    kernelWork:{scheduler,rootId:'packed-owned',scope:pkg+':'+framework,work:{scan:{lane:'background',maxChunkMs:4}}},resourceGraph:{kernel:engine,surfaceGraph:graph,surfaceController:controller,surfaceId:'packed-panel'},
    workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1}}},
    capabilityRequirements:{schema:'xtend.xtensions.host-capability-requirements.v1',required:{features:['kernel.lifecycle','surface.lifecycle','work.bounded'],work:['scan']},optional:{features:['render.ssr']}}};
   const negotiated=api['create'+title+'KernelRuntimeAdapter'](negotiatedOptions);
   assert.equal(negotiated.apiVersion,'6.0.0');assert.equal(negotiated.getCapabilities().schema,'xtend.xtensions.runtime-capabilities.v2');assert.equal(negotiated.getCapabilityNegotiation().status,'degraded');
   assert.equal((await negotiated.mount(container,{title:'negotiated packed'})).ok,true);assert.equal(await capabilities.work.schedule('scan',()=>42).result,42);
   graph.closeSurface('packed-panel');await negotiated.update({type:'props.update',props:{title:'negotiated staged'}});await graph.openSurface('packed-panel');await negotiated.whenIdle();assert.equal(container.textContent,'negotiated staged');
   await negotiated.unmount();
   const blocked=api['create'+title+'KernelRuntimeAdapter']({...negotiatedOptions,capabilityRequirements:{schema:'xtend.xtensions.host-capability-requirements.v1',required:{features:['execution.preemption']}}});
   assert.equal(blocked.getCapabilityNegotiation().status,'blocked');assert.equal((await blocked.mount(container,{})).status,'policy-blocked');assert.equal(engine.listResources().length,0);await blocked.unmount();
   graph.dispose();controller.dispose();engine.disposeRoot('packed-owned');scheduler.dispose();assert.equal(container.childNodes.length,0);container.remove();
  }
  const fs = require('node:fs'), path = require('node:path'), {createHash} = require('node:crypto');
  const compositionRuntime = await import('@ccslabs/xtend/maraca/xtension-composition-runtime');
  const maracaRuntime = await import('@ccslabs/xtend-maraca/xtension-composition-runtime');
  assert.equal(maracaRuntime.XTENSION_COMPOSITION_API_VERSION, '6.0.0');
  assert.equal(require('@ccslabs/xtend-maraca/xtension-composition').XTENSION_COMPOSITION_BUILD_API_VERSION, '7.0.0');
  const compositionPlan = ${JSON.stringify(require('../../development/rmtx-a04/reference.cjs').createPlan())};
  const sources = ${JSON.stringify(Object.fromEntries(['react', 'vue'].map(framework => [framework, fs.readFileSync(path.join(rootDir, 'development/rmtx-a04/providers', framework + '-panel.mjs'), 'utf8')])))};
  const manifests = ${JSON.stringify(Object.fromEntries(['react', 'vue'].map(framework => [framework, require('../../development/rmtx-a04/reference.cjs').createManifest(framework)])))};
  const bindingsRuntime = require('@ccslabs/xtend/xtensions/state-binding');
  for (const framework of ['react', 'vue']) {
   fs.writeFileSync(framework + '.mjs', sources[framework]); const manifest = manifests[framework]; manifest.providers[0].entry.module = './' + framework + '.mjs';
   const report = await require('@ccslabs/xtend/maraca/xtension-composition').buildMaracaXTensionComposition({plan:compositionPlan,manifest,bindingsRuntime,rootDir:process.cwd(),outputDir:path.resolve('composed-' + framework)});
   for(const file of report.files)assert.equal(createHash('sha256').update(fs.readFileSync(path.join(path.dirname(report.entryPath),file.fileName))).digest('hex'),file.sha256);
   const generated = await import(require('node:url').pathToFileURL(report.entryPath));
   const scheduler = createRmtKernelScheduler({preferPostTask:false}), fabric = createXtendFabric(), engine = createRmtCore({scheduler}).rmt;
   const root = document.createElement('main'); document.body.append(root);engine.mountRoot('packed-composition',root);
   const controller = createSurfaceController({fabric}), graph = createRmtSurfaceResourceGraphRuntime({surfaces:compositionPlan.orchestration.artifact.surfaces,surfaceController:controller,strict:true});graph.materialize();
   const createHost = generated.createHostFactory({compositionRuntime,plan:compositionPlan,bindingsRuntime,adapters:{[framework]:require('@ccslabs/xtend/xtensions/' + framework + '-runtime-adapter')},fabric,
    loadPeers:()=>framework==='react'?{React,ReactDOM}:{Vue},kernelWork:{scheduler,rootId:'packed-composition'},resourceGraph:{kernel:engine,surfaceGraph:graph,surfaceController:controller},
    grants:{'filter-panel':{work:{scan:{lane:'background'}},workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1}}}}}});
   const model = createRmtStateSelectorRuntime({states:compositionPlan.orchestration.artifact.state.states});
   const registry = bindingsRuntime.createXTensionStateRegistry({modelReader:model.modelReader,modelCommandPort:model.modelCommandPort});
   const validated = bindingsRuntime.validateStateBindingArtifact(compositionPlan.xtensionBindings,compositionPlan.orchestration.artifact);
   for(const row of bindingsRuntime.materializeStateBindingArtifact(validated,model.modelReader.snapshot())){
    const container=document.createElement('section');root.append(container);const bound=registry.bind(row.binding,context=>createHost({...context,container,surface:row.surface,binding:row.binding}));await bound.mount();
   }
   assert.equal(root.querySelectorAll('input').length,3);assert.equal(engine.listResources('packed-composition').length,3);
   await registry.dispose();assert.equal(engine.listResources('packed-composition').length,0);assert.equal(root.querySelectorAll('input').length,0);
   graph.dispose();controller.dispose();engine.disposeRoot('packed-composition');scheduler.dispose();root.remove();
  }
  for (const framework of ['react', 'vue']) {
   const manifest = manifests[framework]; manifest.schema = 'xtend.maraca.xtension-composition-manifest.v5'; manifest.delivery = {schema:'xtend.maraca.xtension-delivery-policy.v1',mode:'same-origin-external-esm'}; manifest.loading = {provider:'on-mount',peers:'shared'};
   const module = './' + framework + '.mjs', dependency = './' + framework + '-component.mjs';
   fs.writeFileSync(dependency, sources[framework].replace('createPanel', 'createComponent'));
   fs.writeFileSync(module, 'import { createComponent } from "' + dependency + '"; export function createPanel(peers) { return createComponent(peers); }');
   manifest.providers[0].integrity.sha256 = createHash('sha256').update(fs.readFileSync(module)).digest('hex');
   manifest.modules = [module, dependency].map(module => ({module, sha256:createHash('sha256').update(fs.readFileSync(module)).digest('hex')}));
  }
  const integratedSource = ${JSON.stringify(fs.readFileSync(path.join(rootDir, 'development/rmtx-a02/repeated-filters.rmt'), 'utf8'))};
  window.__XTendMaracaDisableAutoBoot = true;
  for (const framework of ['react', 'vue']) {
   const builder = require(framework === 'react' ? '@ccslabs/xtend/maraca' : '@ccslabs/xtend-maraca');
   const out = path.resolve('integrated-' + framework);
   const built = await builder.buildMaracaBundleAsync({sourceText:integratedSource,virtualSourcePath:'packed.rmt',xtensionBindings:compositionPlan.xtensionBindings,xtensionComposition:manifests[framework],out,orchestration:'strict',kernel:'strict',hydration:'off',validation:'off',transitions:'off',profile:framework==='react'?'production':'max',lazy:'none'},{rootDir:process.cwd()});
   assert(built.ok, JSON.stringify(built.plan.diagnostics)); assert.equal(built.plan.schema,'xtend.maraca.build-plan.v5'); assert.equal(built.plan.xtensionComposition.schema,'xtend.maraca.xtension-composition-manifest.v5');assert.equal(built.sizeBudgetReport.schema,'xtend.maraca.size-budget-report.v2'); assert.equal(built.sizeBudgetReport.mode,'strict'); assert(built.sizeBudgetReport.xtensions.withinBudget);
   const compositionReport=JSON.parse(fs.readFileSync(path.join(out,'xtend.xtensions.report.json'))),delivery=JSON.parse(fs.readFileSync(path.join(out,compositionReport.deliveryFile)));
   assert.equal(compositionReport.apiVersion,'6.0.0');assert.equal(delivery.runtimeDeliveryVerified,false);assert.equal(delivery.headers['X-Content-Type-Options'],'nosniff');
   for(const file of delivery.files)assert.equal(createHash('sha256').update(fs.readFileSync(path.join(out,file.fileName))).digest('hex'),file.sha256);
   const deployment=require(framework==='react'?'@ccslabs/xtend/maraca/xtension-composition':'@ccslabs/xtend-maraca/xtension-composition');
   assert.equal(deployment.XTENSION_DEPLOYMENT_API_VERSION,'1.0.0');
   const appDir=path.resolve('application-'+framework);fs.mkdirSync(appDir);const code='import "./xtend.maraca.mjs";';fs.writeFileSync(path.join(appDir,'bootstrap.mjs'),code);
   const sealed=deployment.buildMaracaXTensionDeployment({schema:'xtend.maraca.xtension-deployment-config.v1',build:built,application:{rootDir:appDir,bootstrap:{fileName:'bootstrap.mjs',sha256:createHash('sha256').update(code).digest('hex')},modules:[]},publicPath:'/sealed/',outputDir:path.resolve('sealed-'+framework)});
   const loaded=deployment.loadMaracaXTensionDeployment({rootDir:sealed.outputDir,manifestSha256:sealed.manifestSha256});
   const handler=deployment.createMaracaXTensionDeploymentHandler(loaded),headers={};let status,body;
   assert(handler({method:'GET',url:'/sealed/'},{setHeader(k,v){headers[k]=v;},writeHead(s,h){status=s;Object.assign(headers,h);},end(b){body=b;}}));
   assert.equal(status,200);assert(body.toString().includes('type="importmap"'));assert(headers['Content-Security-Policy'].includes('sha256-'));assert(!headers['Content-Security-Policy'].includes("'self'"));
   assert.equal(sealed.accounting.xtensionRuntimeBytes,built.sizeBudgetReport.xtensions.runtimeBytes);assert.equal(sealed.runtimeExecutionVerified,false);
   const generated = await import(require('node:url').pathToFileURL(path.join(out,'xtend.maraca.mjs')));
   const root=document.createElement('main'); document.body.append(root); const app=generated.createXtendMaraca({windowTarget:window,documentTarget:document,platformTarget:{}});
   await app.boot({root,fabric:createXtendFabric(),xtensions:{loadPeerGroup:()=>framework==='react'?{React,ReactDOM}:{Vue},grants:{'filter-panel':{work:{scan:{lane:'background'}},workBudget:{schema:'xtend.xtensions.work-budget-policy.v1',maxPending:1,work:{scan:{maxPending:1}}}}}}});
   assert.equal(app.apiVersion,'6.0.0');assert.equal(app.facade.snapshot().schema,'xtend.maraca.plan-runtime.v8');assert.equal(root.querySelectorAll('input').length,3);
   app.dispose();await app.facade.whenXTensionsIdle();assert.equal(root.querySelectorAll('input').length,0);root.remove();
  }
 }finally{dom.window.close();}
 console.log('Packed root/compiler factories render with explicitly injected external peers; missing peers and unsafe payloads are rejected.');
})().catch(error=>{console.error(error);process.exitCode=1;});
`);
    console.log(command(process.execPath,[fixture],{cwd:temp,env:{...process.env,XTENSIONS_TEST_PEERS:peers.peerRoot}}));
    context.pass('Isolated packed root/compiler Node consumer resolves all Runtime APIs, renders with injected peers, rejects missing peers and payload leaks');
    const typing=path.join(temp,'binding-consumer.mts');
    fs.writeFileSync(typing,`import { createReactKernelRuntimeAdapter } from '@ccslabs/xtend/xtensions/react-runtime-adapter';
import { createVueKernelRuntimeAdapter } from '@ccslabs/xtend-compiler/xtensions/vue-runtime-adapter';
import { createXTensionStateRegistry as root } from '@ccslabs/xtend/xtensions/state-binding';
import { createXTensionStateRegistry as compiler, materializeStateBindingArtifact } from '@ccslabs/xtend-compiler/xtensions/state-binding';
import { compileRmtClassicAstWithBindings } from '@ccslabs/xtend-compiler/rmt-language/classic-compiler';
const same: typeof root = compiler; void same; void compileRmtClassicAstWithBindings; void materializeStateBindingArtifact; void createReactKernelRuntimeAdapter; void createVueKernelRuntimeAdapter;\n`);
    fs.appendFileSync(typing, `import {buildMaracaXTensionComposition} from '@ccslabs/xtend/maraca/xtension-composition';
import {createMaracaXTensionHostFactory} from '@ccslabs/xtend/maraca/xtension-composition-runtime';
import {createMaracaXTensionHostFactory as workspace} from '@ccslabs/xtend-maraca/xtension-composition-runtime';
const composition: typeof workspace = createMaracaXTensionHostFactory; void composition; void buildMaracaXTensionComposition;\n`);
    const integratedTyping=path.join(temp,'integrated-consumer.mts');
    fs.copyFileSync(path.join(rootDir,'tests/types/xtensions_integrated_composition.mts'),integratedTyping);
    command(process.execPath,[path.join(rootDir,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--lib','es2022,dom','--module','node16','--moduleResolution','node16',typing,integratedTyping],{cwd:temp});
    context.pass('Packed root/compiler state binding declarations resolve strictly without source-tree RMT imports');
    const { build } = require('esbuild');
    const bundle=await build({stdin:{contents:"import * as XTend from '@ccslabs/xtend'; import * as ReactAdapter from '@ccslabs/xtend/xtensions/react-runtime-adapter'; import * as VueAdapter from '@ccslabs/xtend/xtensions/vue-runtime-adapter'; import * as StateBinding from '@ccslabs/xtend/xtensions/state-binding'; import * as Composition from '@ccslabs/xtend/maraca/xtension-composition-runtime'; globalThis.consumer={XTend,ReactAdapter,VueAdapter,StateBinding,Composition};",resolveDir:temp},absWorkingDir:temp,bundle:true,platform:'browser',write:false,metafile:true});
    assert(Object.keys(bundle.metafile.inputs).some(input=>input.endsWith('/xtend.js')),'Neutral Core must actually be included, not tree-shaken out of the consumer test');
    assert(!Object.keys(bundle.metafile.inputs).some(input=>/node_modules[\\/](react|react-dom|vue|@vue)[\\/]/.test(input)),'Neutral core and adapter bundle must not include peer runtimes');
    context.pass('Actual packed browser consumer bundles neutral Core and Runtime factories without React/Vue');
    const report=context.result();
    fs.writeFileSync(artifact,JSON.stringify({schema:'xtend.xtensions.consumer-package-report.v1',ok:report.ok,id:report.id,label:report.label,passes:report.passes,failures:report.failures,skips:report.skips},null,2)+'\n');
    return report;
  }catch(error){context.fail(error.stack||String(error));return context.result();}
  finally{fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={runXTensionsConsumerPackageSuite};

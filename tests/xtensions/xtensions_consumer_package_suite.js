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
      context.pass(`${pack.name}: actual npm tarball contains the reviewed runtime targets and no framework dependencies`);
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
 const {JSDOM}=peers('jsdom');const dom=new JSDOM('<!doctype html><body></body>',{pretendToBeVisual:true});
 for(const key of ['window','document','Node','Element','HTMLElement','SVGElement','navigator','MutationObserver'])Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]});
 const React=peers('react'),ReactDOM={...peers('react-dom/client'),version:peers('react-dom').version},Vue=peers('vue');
 try{
  for(const pkg of ['@ccslabs/xtend','@ccslabs/xtend-compiler'])for(const framework of ['react','vue']){
   const title=framework[0].toUpperCase()+framework.slice(1),api=require(pkg+'/xtensions/'+framework+'-runtime-adapter');
   assert.throws(()=>api['normalize'+title+'Peers']({}),TypeError);
   const container=document.createElement('section');document.body.append(container);
   const component=framework==='react'?props=>React.createElement('p',null,props.title):{props:['title','xtension'],setup:props=>()=>Vue.h('p',props.title)};
   const adapter=api['create'+title+'RuntimeAdapter']({container,component,peers:framework==='react'?{React,ReactDOM}:{Vue}});
   assert.equal((await adapter.mount(container,{title:'packed'})).ok,true);assert.equal(container.textContent,'packed');
   const cycle={};cycle.self=cycle;assert.equal((await adapter.update({props:cycle,updateAdapter:'applyPropsUpdate'})).status,'policy-blocked');
   assert.equal((await adapter.update({props:{title:'consumer'},updateAdapter:'applyPropsUpdate'})).ok,true);assert.equal(container.textContent,'consumer');
   await adapter.unmount();assert.equal(container.childNodes.length,0);container.remove();
  }
 }finally{dom.window.close();}
 console.log('Packed root/compiler factories render with explicitly injected external peers; missing peers and unsafe payloads are rejected.');
})().catch(error=>{console.error(error);process.exitCode=1;});
`);
    console.log(command(process.execPath,[fixture],{cwd:temp,env:{...process.env,XTENSIONS_TEST_PEERS:peers.peerRoot}}));
    context.pass('Isolated packed root/compiler Node consumer resolves all Runtime APIs, renders with injected peers, rejects missing peers and payload leaks');
    const { build } = require('esbuild');
    const bundle=await build({stdin:{contents:"import * as XTend from '@ccslabs/xtend'; import * as ReactAdapter from '@ccslabs/xtend/xtensions/react-runtime-adapter'; import * as VueAdapter from '@ccslabs/xtend/xtensions/vue-runtime-adapter'; globalThis.consumer={XTend,ReactAdapter,VueAdapter};",resolveDir:temp},absWorkingDir:temp,bundle:true,platform:'browser',write:false,metafile:true});
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

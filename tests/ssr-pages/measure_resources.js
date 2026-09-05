'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const {gzipSync}=require('node:zlib');
const {performance}=require('node:perf_hooks');
const {createBrowserManifest}=require('./browser_manifest');

async function measureResources(output) {
  const root=path.resolve(__dirname,'../..');
  const {projectPortableRender}=await import('../../xtendrmt/rmt-portable-render.js');
  const {createRmtNodeSsrAdapter}=await import('../../xtendrmt/rmt-node-ssr-adapter.js');
  const {Prop,resolvePageProps}=await import('../../xtendrmt/page-contract.mjs');
  const providerExecutions={initial:0,partial:0,deferred:0};
  for(const [name,selection] of Object.entries({initial:{},partial:{only:['lazy']},deferred:{deferred:['later']}})) {
    const resolve=()=>{providerExecutions[name]++;return 'Measured';};
    await resolvePageProps({eager:resolve,lazy:Prop.lazy(resolve),later:Prop.defer(resolve,'later'),once:Prop.once(resolve)}, {}, selection);
  }
  const artifact=(await createBrowserManifest()).pages.Orders.artifact;
  const props={title:'Measured orders',orders:Array.from({length:100},(_,index)=>({id:index,name:`Order ${index}`}))};
  const iterations=50, timings=[];let html='';const adapter=createRmtNodeSsrAdapter();
  for(let index=0;index<iterations;index++) {
    const start=performance.now(), projected=projectPortableRender(artifact,props);
    const result=await adapter.render({descriptor:projected.descriptor},{model:projected.model});
    if(!result.ok)throw new Error('Node measurement render failed.');
    timings.push(performance.now()-start);html=result.html;
  }
  const php=JSON.parse(execFileSync(process.env.XTEND_PHP_BINARY || 'php',[path.join(__dirname,'measure_resources.php'),root],{input:JSON.stringify({artifact,props,iterations}),encoding:'utf8',timeout:30000}));
  const bundled=await require('esbuild').build({stdin:{contents:"export {createPageClient} from './xtendrmt/page-client.mjs'; export {createPageForm} from './xtendrmt/page-form.mjs';",resolveDir:root,sourcefile:'page-entry.mjs'},bundle:true,write:false,minify:true,format:'esm',platform:'browser',target:'es2022'});
  const bytes=bundled.outputFiles[0].contents;
  const sorted=[...timings].sort((a,b)=>a-b);
  const report={recordedAt:new Date().toISOString(),environment:{platform:process.platform,architecture:process.arch,node:process.version,cpus:os.cpus().length},fixture:{rows:props.orders.length,iterations,compilationsDuringRequests:0},node:{providerExecutions,coldRenderMs:timings[0],medianRenderMs:sorted[Math.floor(iterations/2)],p95RenderMs:sorted[Math.floor(iterations*.95)],rssBytes:process.memoryUsage().rss,heapBytes:process.memoryUsage().heapUsed,htmlBytes:Buffer.byteLength(html)},php,browser:{minifiedBytes:bytes.length,gzipBytes:gzipSync(bytes).length}};
  if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
  return report;
}
if(require.main===module)measureResources(process.argv[2]).then(report=>console.log(JSON.stringify(report,null,2))).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={measureResources};

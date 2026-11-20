// SPDX-License-Identifier: Apache-2.0
'use strict';
// One real, cold Chromium registry per UI tag. Existing functional assertions
// and fixtures are reused verbatim; collection cases also consume exact Node
// compilation records and the actual Renderer. No browser API is replaced.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),http=require('node:http');
const {spawnSync}=require('node:child_process'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),argv=process.argv.slice(2);
const option=(name,fallback)=>{const index=argv.indexOf(name);return index<0?fallback:argv[index+1];};
const out=path.resolve(option('--out','/tmp/xtend-native-catalog-v2/ui/cold36'));
const output=path.resolve(option('--output',path.join(out,'report.json')));
const peerRoot=path.resolve(option('--dependencies',process.env.XTENSIONS_TEST_PEERS||'/tmp/xtend-rmtx-a0642/locked-tools'));
const node=option('--node',process.execPath),chrome=process.env.CHROME_BIN||'/home/konni/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const peers=createRequire(path.join(peerRoot,'package.json'));
const nodePath=fs.existsSync(path.join(peerRoot,'node_modules'))?path.join(peerRoot,'node_modules'):peerRoot;
const testFile='tests/components/native-managed-ui.test.mjs';
const helperFile='development/rmtx-a06/native-component-catalog/ui-browser-test.cjs';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const relative=file=>path.relative(root,file).split(path.sep).join('/');
const write=(file,data)=>fs.writeFileSync(path.join(out,file),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');
const catalog=require('../../tools/xtensions/native-component-catalog-v2').NATIVE_COMPONENT_CATALOG_V2;
const ui=catalog.filter(row=>row.role==='ui'),manifest=JSON.parse(read('components/manifest.json'));
const knownTags=Object.keys(manifest);
const collectionTests={
 'x-tabs':'tabs use original Renderer refs, typed key intents, registered selection command and suspension leases',
 'x-masonry':'masonry collapse and reorder controls emit typed Model requests while Renderer owns all originals'
};
const source=read(testFile),sharedHarness=read(helperFile);
const profileSuffix=source.match(/test\(`functional profile \$\{tag\}(:[^`]+)`/)[1];
const template=(name)=>{const match=sharedHarness.match(new RegExp('const '+name+'=`([\\s\\S]*?)`;'));if(!match)throw Error('Missing reviewed existing harness '+name);return match[1];};
const assertionModule=template('assertModule');
const baseTestModule=template('testModule');
if(!baseTestModule.includes('queue.push({name,fn});'))throw Error('Existing test registration boundary changed');
fs.mkdirSync(out,{recursive:true});

function caseNames(tag){return ['functional profile '+tag+profileSuffix,...(collectionTests[tag]?[collectionTests[tag]]:[])];}
function nodeCapture(row){
 const capture=path.join(out,row.tag+'.compile.json'),preloader=path.join(out,row.tag+'.capture.cjs');
 fs.writeFileSync(preloader,`const fs=require('node:fs'),compiler=require(${JSON.stringify(path.join(root,'tools/rmt-language/rmtx-compiler'))});const actual=compiler.compileRmtxSource,records=new Map(),environment={node:process.version,TZ:process.env.TZ||null,NODE_ENV:process.env.NODE_ENV||null,compilerSha256:${JSON.stringify(sha(read('tools/rmt-language/rmtx-compiler.js')))}};compiler.compileRmtxSource=function(source,options){const result=actual.apply(this,arguments),key=JSON.stringify({source,options,environment});records.set(key,{key,environment,result:{ok:result.ok,diagnostics:result.diagnostics,orchestrationArtifacts:result.orchestrationArtifacts}});return result;};process.on('exit',()=>fs.writeFileSync(${JSON.stringify(capture)},JSON.stringify([...records.values()],null,2)));`);
 const escaped=caseNames(row.tag).map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 const result=spawnSync('/usr/bin/time',['-v','-o',path.join(out,row.tag+'.node.time'),node,'--max-old-space-size=512','--require',preloader,'--test','--test-concurrency=1','--test-isolation=none','--test-name-pattern','^(?:'+escaped.join('|')+')$',testFile],{cwd:root,env:{...process.env,TZ:'Europe/Berlin',NODE_PATH:nodePath},encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
 write(row.tag+'.node.tap',(result.stdout||'')+(result.stderr||''));
 if(result.error||result.status!==0)throw Error(row.tag+' original Node cases failed: '+(result.error?.message||result.status));
 const records=JSON.parse(fs.readFileSync(capture,'utf8'));
 if(collectionTests[row.tag]&&!records.length)throw Error('Collection case requires genuine compile records: '+row.tag);
 if(!collectionTests[row.tag]&&records.length)throw Error('Unexpected compilation in a direct profile: '+row.tag);
 return records;
}

function browserSource(row){
 let body=source.slice(source.indexOf('const { prepareNativeComponent')).replaceAll('dom.window.close();','');
 if(!body.startsWith('const { prepareNativeComponent'))throw Error('Original UI setup boundary changed');
 body=body.replace("const manifest = JSON.parse(fs.readFileSync(new URL('../../components/manifest.json', import.meta.url)));",'const manifest='+JSON.stringify(manifest)+';');
 body=body.replace("NATIVE_COMPONENT_CATALOG_V2.filter((entry) => entry.role === 'ui')",`NATIVE_COMPONENT_CATALOG_V2.filter((entry) => entry.role === 'ui' && entry.tag === ${JSON.stringify(row.tag)})`);
 body=body.replace('await import(new URL(`../../${descriptor.managedModule}`, import.meta.url))',`await import(${JSON.stringify(path.join(root,row.managedModule))})`);
 body=body.replace('await import(new URL(`../../components/${manifest[tag].slice(2)}`,import.meta.url))',`await import(${JSON.stringify(path.join(root,row.module))})`);
 body=body.replaceAll("require('../../tools/rmt-language/rmtx-compiler')","require('native-cold-compiler')");
 if(/jsdom|attachInternals\s*=|ResizeObserver\s*=|matchMedia\s*=|createRequire/.test(body))throw Error('A browser API replacement crossed the reviewed boundary');
 const prelude=`import test from 'native-cold-test';import assert from 'native-cold-assert';const browserErrors=[];window.addEventListener('error',event=>browserErrors.push(event.error||new Error(event.message)));const coldKnownTags=${JSON.stringify(knownTags)};const coldInitial=coldKnownTags.filter(tag=>customElements.get(tag));assert.deepEqual(coldInitial,[],'Every tag starts in its own empty registry');\n`;
 const audit=`
const coldModule=definitions.get(${JSON.stringify(row.tag)}),coldDependencies=coldModule.nativeDependencies||[];
const coldAllowed=new Map([[${JSON.stringify(row.tag)},coldModule.default],...coldDependencies]);
for(const tag of new Set([...coldKnownTags,...coldAllowed.keys()]))assert.equal(customElements.get(tag),undefined,'Pure definition did not register '+tag);
assert.equal(window.XTend,undefined,'Cold pure imports do not bootstrap Classic');
const coldShadowChecks=[];
function auditColdShadow(element){const visit=node=>{if(node.nodeType===1&&node.localName.includes('-')){assert.ok(coldAllowed.has(node.localName),'Only actual static CE dependencies may appear: '+node.localName);assert.ok(customElements.get(node.localName)===coldAllowed.get(node.localName),'Static CE dependency is registered with its actual class');assert.ok(node.constructor===coldAllowed.get(node.localName),'Dependency uses the genuine upgraded constructor');coldShadowChecks.push(node.localName);}for(const child of node.children||[])visit(child);if(node.shadowRoot)for(const child of node.shadowRoot.children)visit(child);};visit(element);}
const originalColdCreate=create;create=function(...args){const mounted=originalColdCreate(...args);auditColdShadow(mounted.element);return mounted;};
const originalColdDestroy=destroy;destroy=function(element){auditColdShadow(element);return originalColdDestroy(element);};
const originalColdCollection=collectionFixture;collectionFixture=async function(...args){const fixture=await originalColdCollection(...args);auditColdShadow(fixture.element);const dispose=fixture.dispose;fixture.dispose=()=>{auditColdShadow(fixture.element);return dispose();};return fixture;};
await globalThis.__nativeRun();
const defined=new Set([...coldKnownTags,...coldAllowed.keys()].filter(tag=>customElements.get(tag)));
for(const tag of defined)assert.ok(coldAllowed.has(tag),'An unrelated CE must never be registered: '+tag);
for(const [tag,ctor]of coldAllowed)assert.ok(customElements.get(tag)===ctor,'Actual static dependency remains registered: '+tag);
globalThis.__nativeColdResult={...globalThis.__nativeBrowserResult,tag:${JSON.stringify(row.tag)},initialDefined:coldInitial,defined:[...defined],dependencyTags:[...coldDependencies].map(([tag])=>tag),shadowChecks:coldShadowChecks,onlyActualDefinitionAndStaticDependencies:true};
`;
 // The original table bodies and fixtures stay byte-for-byte; only native
 // registry assertions are added before they execute and around their cleanup.
 return prelude+body+audit;
}

async function bundle(row,records){
 const names=caseNames(row.tag),testModule=baseTestModule.replace('queue.push({name,fn});',`if(${JSON.stringify(names)}.includes(name))queue.push({name,fn});`);
 const lookup=Object.fromEntries(records.map(record=>[record.key,record.result]));
 const compiler=`const records=${JSON.stringify(lookup)},environment=${JSON.stringify(records[0]?.environment||null)};export function compileRmtxSource(source,options){const key=JSON.stringify({source,options,environment});if(!Object.hasOwn(records,key))throw Error('Uncaptured cold compiler source/options/environment');return structuredClone(records[key]);}`;
 const modules={'native-cold-test':testModule,'native-cold-assert':assertionModule,'native-cold-compiler':compiler};
 const generated=browserSource(row);write(row.tag+'.browser-source.mjs',generated);
 const result=await peers('esbuild').build({stdin:{contents:generated,sourcefile:path.join(root,testFile),resolveDir:path.dirname(path.join(root,testFile)),loader:'js'},outfile:path.join(out,row.tag+'.mjs'),bundle:true,platform:'browser',format:'esm',target:'chrome136',metafile:true,external:['node:*'],logLevel:'error',plugins:[{name:'cold-native-test-boundary',setup(build){build.onResolve({filter:/^native-cold-/},args=>({path:args.path,namespace:'cold-boundary'}));build.onLoad({filter:/.*/,namespace:'cold-boundary'},args=>({contents:modules[args.path],loader:'js'}));}}]});
 const files=Object.keys(result.metafile.inputs).map(file=>path.resolve(root,file)).filter(file=>fs.existsSync(file)&&fs.statSync(file).isFile());
 files.push(__filename,path.join(root,testFile),path.join(root,helperFile),path.join(root,'tools/rmt-language/rmtx-compiler.js'));
 const inputs=[...new Set(files)].sort().map(file=>({file:relative(file),sha256:sha(fs.readFileSync(file))}));
 const productiveDefinitionTags=ui.filter(other=>inputs.some(input=>input.file===other.managedModule)).map(other=>other.tag);
 return{tag:row.tag,names,definition:row.managedModule,definitionSha256:sha(read(row.managedModule)),testBodySha256:sha(source),generatedSourceSha256:sha(generated),bundleSha256:sha(fs.readFileSync(path.join(out,row.tag+'.mjs'))),compiledInputs:records.map(record=>({keySha256:sha(record.key),sourceOptionsEnvironment:JSON.parse(record.key),resultSha256:sha(JSON.stringify(record.result))})),compileCaptureSha256:sha(fs.readFileSync(path.join(out,row.tag+'.compile.json'))),productiveDefinitionTags,inputs};
}

function assertInputs(prepared){for(const row of prepared){for(const input of row.inputs)if(sha(fs.readFileSync(path.join(root,input.file)))!==input.sha256)throw Error('Cold proof source changed: '+input.file);if(sha(fs.readFileSync(path.join(out,row.tag+'.mjs')))!==row.bundleSha256)throw Error('Cold bundle changed: '+row.tag);if(sha(fs.readFileSync(path.join(out,row.tag+'.compile.json')))!==row.compileCaptureSha256)throw Error('Cold compile records changed: '+row.tag);}}

async function chromiumProof(prepared){
 assertInputs(prepared);const requests=[],unexpected=[];
 const server=http.createServer((request,response)=>{const pathname=new URL(request.url,'http://localhost').pathname;requests.push(pathname);response.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self'; base-uri 'none'; object-src 'none'");if(pathname==='/favicon.ico'){response.statusCode=204;response.end();return;}const row=ui.find(row=>pathname==='/'+row.tag+'.html'||pathname==='/'+row.tag+'.mjs');if(!row){unexpected.push(pathname);response.statusCode=404;response.end();return;}if(pathname.endsWith('.mjs')){response.setHeader('Content-Type','text/javascript');response.end(fs.readFileSync(path.join(out,row.tag+'.mjs')));}else{response.setHeader('Content-Type','text/html');response.end('<!doctype html><main></main><script type="module" src="/'+row.tag+'.mjs"></script>');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await peers('playwright').chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--renderer-process-limit=1']}),browserVersion=browser.version(),cases=[];
 try{for(const row of prepared){const context=await browser.newContext({timezoneId:'Europe/Berlin',viewport:{width:1280,height:900}}),page=await context.newPage(),pageErrors=[],consoleErrors=[],network=[];let result=null,bootstrapError=null;
  page.on('pageerror',error=>pageErrors.push({message:error.message,stack:error.stack}));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});page.on('request',request=>{network.push(request.url());if(!request.url().startsWith(origin+'/')&&!request.url().startsWith('data:'))unexpected.push(request.url());});page.on('requestfailed',request=>unexpected.push(request.url()+': '+request.failure()?.errorText));
  try{await page.goto(origin+'/'+row.tag+'.html',{waitUntil:'load',timeout:30000});await page.waitForFunction(()=>globalThis.__nativeColdResult,{timeout:15000});result=await page.evaluate(()=>globalThis.__nativeColdResult);}catch(error){bootstrapError=error.message;}
  const allowed=result?[row.tag,...result.dependencyTags]:[];const importedDefinitionsScoped=row.productiveDefinitionTags.every(tag=>allowed.includes(tag));
  cases.push({tag:row.tag,...(result||{}),passed:result?.passed===true&&result.cases.length===row.names.length&&result.cases.every(test=>row.names.includes(test.name))&&importedDefinitionsScoped&&pageErrors.length===0&&consoleErrors.length===0&&!bootstrapError,importedDefinitionsScoped,productiveDefinitionTags:row.productiveDefinitionTags,caseNames:row.names,pageErrors,consoleErrors,network,bootstrapError});
  process.stdout.write(row.tag+': '+(cases.at(-1).passed?'PASS':'FAIL')+'; '+(result?.cases.length||0)+' original functional cases\n');await context.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 assertInputs(prepared);
 const report={schema:'xtend.rmtx.native-cold-registry-browser-acceptance.v1',node:process.version,browserVersion,generatedAt:new Date().toISOString(),acceptedForRelease:false,ssrAcceptancePerformed:false,tags:ui.map(row=>row.tag),cases,pageErrors:cases.flatMap(row=>row.pageErrors),unexpectedRequests:unexpected,sourceManifest:prepared,sourceHashesStable:true,actualBrowserAPIs:true,compiledInputBoundary:'Exact Node source/options/environment records, only where consumed by original collection cases; other profile cases call the actual bridge directly.',injectedPorts:'The original functional fixture injects scoped IO ports. Collection cases use the actual Renderer and captured compiler artifacts. No DOM or browser API mocks.',passed:cases.length===36&&cases.every(row=>row.passed)&&unexpected.length===0};
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');if(!report.passed)process.exitCode=1;
}

(async()=>{let prepared;if(!argv.includes('--browser-only')){prepared=[];for(const row of ui)prepared.push(await bundle(row,nodeCapture(row)));write('inputs.json',prepared);}else prepared=JSON.parse(fs.readFileSync(path.join(out,'inputs.json'),'utf8'));if(!argv.includes('--prepare-only'))await chromiumProof(prepared);})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});

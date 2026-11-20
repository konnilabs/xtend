// SPDX-License-Identifier: Apache-2.0
'use strict';
// Reuses the checked-in UI/Renderer/Demo test bodies against real Chromium APIs.
// Node performs the normal compile boundary; the browser accepts exact captured
// source/options pairs only. No DOM, media, ResizeObserver or form API is mocked.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const http=require('node:http'),{spawnSync}=require('node:child_process'),{createRequire}=require('node:module');
const extraSuites=require('./browser-suite-transform.cjs');
const root=path.resolve(__dirname,'../../..');
const args=process.argv.slice(2),option=(name,fallback)=>{const at=args.indexOf(name);return at<0?fallback:args[at+1];};
const out=path.resolve(option('--out','/tmp/xtend-native-catalog-v2/ui/chromium'));
const reportFile=path.resolve(option('--output',path.join(out,'report.json')));
const node=option('--node',process.execPath);
const peerRoot=path.resolve(option('--dependencies',process.env.XTENSIONS_TEST_PEERS||'/tmp/xtend-rmtx-a0642/locked-tools'));
const dependencyRoot=fs.existsSync(path.join(peerRoot,'node_modules'))?path.join(peerRoot,'node_modules'):peerRoot;
const chrome=option('--chrome',process.env.CHROME_BIN||'/home/konni/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome');
const externalRequire=createRequire(path.join(peerRoot,'package.json'));
const suites=[
  {id:'ui',file:'tests/components/native-managed-ui.test.mjs',marker:'const { prepareNativeComponent'},
  {id:'renderer',file:'tests/rmt-language/native-managed-renderer.test.mjs',marker:'const {compileRmtxSource}'},
  {id:'demo',file:'tests/components/native-demo-reference.test.mjs',marker:"await import('../../components/x-rmt-lifecycle-demo-build.js');"}
];
suites.push(...extraSuites.additionalSuites);
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const write=(file,value)=>fs.writeFileSync(path.join(out,file),value);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const relative=file=>path.relative(root,file).split(path.sep).join('/');
function parserLine(source){const lines=source.split('\n'),matches=lines.flatMap((line,index)=>/new DOMParser\(\)\.parseFromString\(dirtyPayload, PARSER_MEDIA_TYPE\)/.test(line)?[index+1]:[]);if(matches.length>1)throw Error('Ambiguous bundled DOMPurify parser boundary');return matches[0]||null;}
function observeAttacks(){globalThis.__nativeAttackExecutions=0;globalThis.evil=()=>{globalThis.__nativeAttackExecutions++;};globalThis.__nativeCspReports=[];document.addEventListener('securitypolicyviolation',event=>globalThis.__nativeCspReports.push({sourceFile:event.sourceFile,line:event.lineNumber,column:event.columnNumber,sample:event.sample,blockedURI:event.blockedURI,effectiveDirective:event.effectiveDirective}));}
function classifyAttackDiagnostics(reports,messages,allowed){
  const expected=report=>report.sample==='evil()'&&report.blockedURI==='inline'&&report.effectiveDirective==='script-src-attr'&&allowed.some(row=>row.url===report.sourceFile&&row.line===report.line);
  const expectedAttackReports=reports.filter(expected),unexpectedCspReports=reports.filter(report=>!expected(report));
  const expectedMessage=message=>message.text.startsWith('Executing inline event handler violates the following Content Security Policy directive')&&expectedAttackReports.some(report=>message.location.url===report.sourceFile&&message.location.lineNumber+1===report.line);
  return{expectedAttackReports,unexpectedCspReports,expectedAttackConsoleMessages:messages.filter(expectedMessage),consoleErrors:messages.filter(message=>!expectedMessage(message)).map(message=>message.text)};
}
fs.mkdirSync(out,{recursive:true});

function prepareCapture(suite){
  const preloader=path.join(out,`${suite.id}.capture.cjs`),capture=path.join(out,`${suite.id}.compile.json`);
  fs.writeFileSync(preloader,`'use strict';const fs=require('node:fs');const compiler=require(${JSON.stringify(path.join(root,'tools/rmt-language/rmtx-compiler'))});const environment={node:process.version,timezone:process.env.TZ||null,nodeEnv:process.env.NODE_ENV||null,compilerSha256:${JSON.stringify(sha(read('tools/rmt-language/rmtx-compiler.js')))}};const actual=compiler.compileRmtxSource,rows=new Map();compiler.compileRmtxSource=function(source,options){const result=actual.apply(this,arguments);const key=JSON.stringify({source,options,environment});rows.set(key,{key,environment,result:{ok:result.ok,diagnostics:result.diagnostics,orchestrationArtifacts:result.orchestrationArtifacts}});return result;};process.on('exit',()=>fs.writeFileSync(${JSON.stringify(capture)},JSON.stringify([...rows.values()],null,2)+'\\n'));`);
  const custom=extraSuites.capturePreloader(suite,{root,capture});if(custom)fs.writeFileSync(preloader,custom);
  const result=spawnSync('/usr/bin/time',['-v','-o',path.join(out,`${suite.id}.capture.time`),node,'--max-old-space-size=512','--require',preloader,'--test','--test-concurrency=1','--test-isolation=none',suite.file],{cwd:root,env:{...process.env,TZ:'Europe/Berlin',NODE_PATH:dependencyRoot},encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
  write(`${suite.id}.capture.tap`,(result.stdout||'')+(result.stderr||''));
  if(result.error||result.status!==0)throw Error(`Actual ${suite.id} capture tests failed; see ${suite.id}.capture.tap (${result.error?.message||result.status})`);
  const records=JSON.parse(fs.readFileSync(capture,'utf8'));
  if(!['demo','services'].includes(suite.id)&&!records.length)throw Error(`${suite.id} compilation map is empty`);
  return records;
}

function transformSuite(suite){
  let source=read(suite.file);
  const common=`import test from 'native-browser-test';import assert from 'native-browser-assert';const browserErrors=[],errors=[];window.addEventListener('error',event=>{browserErrors.push(event.error||new Error(event.message));errors.push(event.error||new Error(event.message));});\n`;
  const custom=extraSuites.transformBrowserSuite(suite,{root,source});if(custom!==null)return common+custom+'\nawait globalThis.__nativeRun();\n';
  const index=source.indexOf(suite.marker);
  if(index<0)throw Error(`Missing reviewed setup boundary in ${suite.file}`);
  source=source.slice(index).replaceAll('dom.window.close();','');
  const manifest=JSON.parse(read('components/manifest.json'));
  const catalog=require(path.join(root,'tools/xtensions/native-component-catalog-v2')).NATIVE_COMPONENT_CATALOG_V2;
  const ui=catalog.filter(row=>row.role==='ui');
  let prelude=common;
  if(suite.id==='ui'){
    source=source.replace("const manifest = JSON.parse(fs.readFileSync(new URL('../../components/manifest.json', import.meta.url)));",`const manifest=${JSON.stringify(manifest)};`);
    source=source.replace('for (const descriptor of descriptors) definitions.set(descriptor.tag, await import(new URL(`../../${descriptor.managedModule}`, import.meta.url)));','for (const descriptor of descriptors) definitions.set(descriptor.tag, await definitionImports[descriptor.tag]());');
    source=source.replace('await import(new URL(`../../components/${manifest[tag].slice(2)}`,import.meta.url))','await classicImports[tag]()');
    prelude+=`const definitionImports={${ui.map(row=>`${JSON.stringify(row.tag)}:()=>import(${JSON.stringify(path.join(root,row.managedModule))})`).join(',')}};\n`;
    prelude+=`const classicImports={${ui.map(row=>`${JSON.stringify(row.tag)}:()=>import(${JSON.stringify(path.join(root,row.module))})`).join(',')}};\n`;
  }else if(suite.id==='renderer'){
    source=source.replace('await import(`../../components/${name}.definition.js`)','await definitionImports[name]()');
    prelude+=`const definitionImports={${['xinput','xtabs','xmasonry','xhero','xmenu','xtooltip','xmodal'].map(name=>`${name}:()=>import(${JSON.stringify(path.join(root,'components',name+'.definition.js'))})`).join(',')}};\n`;
  }
  source=source.replaceAll("require('../../tools/rmt-language/rmtx-compiler')","require('native-browser-compiler')");
  if(/jsdom|attachInternals\s*=|ResizeObserver\s*=|matchMedia\s*=|createRequire/.test(source))throw Error('Unexpected test-only browser API replacement');
  return prelude+source+'\nawait globalThis.__nativeRun();\n';
}

const testModule=`const queue=[],after=[];function test(name,fn){queue.push({name,fn});}test.after=fn=>after.push(fn);globalThis.__nativeRun=async()=>{const cases=[];for(const {name,fn}of queue){const start=performance.now();try{await fn();cases.push({name,passed:true,milliseconds:performance.now()-start});}catch(error){cases.push({name,passed:false,error:{message:error.message,stack:error.stack},milliseconds:performance.now()-start});}}for(const fn of after)try{await fn();}catch(error){cases.push({name:'after',passed:false,error:{message:error.message,stack:error.stack}});}globalThis.__nativeBrowserResult={cases,passed:cases.every(row=>row.passed)};};export default test;`;
const assertModule=`function fail(message){throw new Error(message||'Assertion failed');}function equal(actual,expected,message){if(!Object.is(actual,expected))fail((message||'Values differ')+'; actual='+String(actual)+' expected='+String(expected));}function same(a,b,seen=new WeakMap()){if(Object.is(a,b))return true;if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;if(Object.getPrototypeOf(a)!==Object.getPrototypeOf(b))return false;if(a instanceof Date)return a.valueOf()===b.valueOf();if(seen.get(a)===b)return true;seen.set(a,b);const ak=Reflect.ownKeys(a),bk=Reflect.ownKeys(b);return ak.length===bk.length&&ak.every(key=>Object.prototype.hasOwnProperty.call(b,key)&&same(a[key],b[key],seen));}function deepEqual(a,b,message){if(!same(a,b))fail((message||'Objects differ')+'; actual='+JSON.stringify(a)+' expected='+JSON.stringify(b));}function matches(error,expected){if(expected instanceof RegExp)return expected.test(String(error?.message||error));if(typeof expected==='function')return error instanceof expected;return expected===undefined;}function throws(fn,expected,message){let error;try{fn();}catch(caught){error=caught;}if(!error||!matches(error,expected))fail(message||'Expected matching exception; actual='+String(error));}async function rejects(fn,expected,message){let error;try{await(typeof fn==='function'?fn():fn);}catch(caught){error=caught;}if(!error||!matches(error,expected))fail(message||'Expected matching rejection; actual='+String(error));}export default {equal,deepEqual,ok(value,message){if(!value)fail(message);},match(value,pattern,message){if(!pattern.test(value))fail(message||'Pattern did not match '+value);},throws,rejects};`;

async function bundleSuite(suite,records){
  const esbuild=externalRequire('esbuild');
  const transformed=transformSuite(suite);write(`${suite.id}.browser-source.mjs`,transformed);
  const lookup=Object.fromEntries(records.map(row=>[row.key,row.result]));
  const compilerModule=`const records=${JSON.stringify(lookup)},environment=${JSON.stringify(records[0]?.environment||null)};export function compileRmtxSource(source,options){const key=JSON.stringify({source,options,environment});if(!Object.prototype.hasOwnProperty.call(records,key))throw new Error('Uncaptured RMTX source/options/environment: '+source);return structuredClone(records[key]);}`;
  const modules={'native-browser-test':testModule,'native-browser-assert':assertModule,'native-browser-compiler':compilerModule};
  if(suite.id==='platform')modules['native-browser-maraca']=extraSuites.planLookupModule(records);
  const result=await esbuild.build({stdin:{contents:transformed,sourcefile:path.join(root,suite.file),resolveDir:path.dirname(path.join(root,suite.file)),loader:'js'},bundle:true,platform:'browser',format:'esm',target:'chrome136',outfile:path.join(out,`${suite.id}.mjs`),write:true,metafile:true,sourcemap:'external',external:['node:*'],plugins:[{name:'actual-native-test-boundary',setup(build){build.onResolve({filter:/^native-browser-/},args=>({path:args.path,namespace:'browser-boundary'}));build.onLoad({filter:/.*/,namespace:'browser-boundary'},args=>({contents:modules[args.path],loader:'js'}));}}]});
  write(`${suite.id}.metafile.json`,json(result.metafile));
  const files=Object.keys(result.metafile.inputs).map(file=>path.resolve(root,file)).filter(file=>fs.existsSync(file)&&fs.statSync(file).isFile());files.push(path.join(root,suite.file),__filename,path.join(__dirname,'browser-suite-transform.cjs'));
  if(suite.id==='platform')files.push(path.join(root,'xtend-maraca/index.js'));
  if(records[0]?.environment)files.push(path.join(root,'tools/rmt-language/rmtx-compiler.js'));
  return {id:suite.id,test:suite.file,compilerRecords:records.length,compilerCaptureSha256:sha(fs.readFileSync(path.join(out,`${suite.id}.compile.json`))),testSha256:sha(read(suite.file)),bundleSha256:sha(fs.readFileSync(path.join(out,`${suite.id}.mjs`))),domPurifyParserLine:parserLine(fs.readFileSync(path.join(out,`${suite.id}.mjs`),'utf8')),sources:[...new Set(files)].sort().map(file=>({file:relative(file),sha256:sha(fs.readFileSync(file))}))};
}

function assertSources(manifest){for(const suite of manifest.suites){for(const row of suite.sources)if(sha(fs.readFileSync(path.join(root,row.file)))!==row.sha256)throw Error('Browser inputs changed: '+row.file);if(sha(fs.readFileSync(path.join(out,suite.id+'.mjs')))!==suite.bundleSha256)throw Error('Browser bundle changed: '+suite.id);if(sha(fs.readFileSync(path.join(out,suite.id+'.compile.json')))!==suite.compilerCaptureSha256)throw Error('Compiler capture changed: '+suite.id);}}

async function runBrowser(manifest){
  assertSources(manifest);
  const {chromium}=externalRequire('playwright');const unexpected=[],requests=[];
  const sanitizerSource=read('xtendrmt/html-sanitizer.mjs');
  const deniedImageURL='https://xtend-parser-probe.invalid/denied-before-admission.png';
  const controlSource=`import {createHtmlSanitizer} from '/parser-control-sanitizer.mjs';
const raw='<p>safe</p><img src="/x" onerror="evil()"><script>evil()</script>';
const attackDocument=new DOMParser().parseFromString(raw,'text/html');
const deniedDocument=new DOMParser().parseFromString('<img src="${deniedImageURL}">','text/html');
const sanitize=createHtmlSanitizer(window),clean=sanitize(raw),empty=sanitize(''),deniedClean=sanitize('<img src="${deniedImageURL}">');
globalThis.__inertProbeDocuments=[attackDocument,deniedDocument];
await new Promise(resolve=>setTimeout(resolve,100));
globalThis.__nativeParserControlResult={inert:attackDocument.defaultView===null,attackRetainedOnlyInInertInput:attackDocument.querySelector('img').getAttribute('onerror')==='evil()',sanitizedOutput:String(clean.html),handlerAndScriptRemoved:!/(?:onerror|<script)/i.test(String(clean.html)),removed:clean.removed,emptyTrustedHtml:{brand:Object.prototype.toString.call(empty.html),text:String(empty.html)},deniedImageSanitized:String(deniedClean.html),resourceAdmissions:0};`;
  const controlParserLine=controlSource.split('\n').findIndex(line=>line.includes('const attackDocument=new DOMParser'))+1;
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==','base64');
  const server=http.createServer((request,response)=>{
    const pathname=new URL(request.url,'http://127.0.0.1').pathname;requests.push(pathname);
    response.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'report-sample'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; base-uri 'none'; object-src 'none'");
    if(pathname==='/favicon.ico'){response.statusCode=204;response.end();return;}
    if(pathname==='/x'){response.setHeader('Content-Type','image/png');response.end(image);return;}
    if(pathname==='/parser-control.html'){response.setHeader('Content-Type','text/html');response.end('<!doctype html><main></main><script type="module" src="/parser-control.mjs"></script>');return;}
    if(pathname==='/parser-control.mjs'||pathname==='/parser-control-sanitizer.mjs'){response.setHeader('Content-Type','text/javascript');response.end(pathname==='/parser-control.mjs'?controlSource:sanitizerSource);return;}
    const suite=suites.find(row=>pathname===`/${row.id}.html`||pathname===`/${row.id}.mjs`);
    if(!suite){unexpected.push(pathname);response.statusCode=404;response.end();return;}
    if(pathname.endsWith('.html')){response.setHeader('Content-Type','text/html');response.end(`<!doctype html><meta charset="utf-8"><title>Native ${suite.id} actual test bodies</title><main></main><script type="module" src="/${suite.id}.mjs"></script>`);return;}
    response.setHeader('Content-Type','text/javascript');response.end(fs.readFileSync(path.join(out,suite.id+'.mjs')));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--renderer-process-limit=1']});
  const reports=[],browserVersion=browser.version();let parserControl;
  try{
    for(const suite of suites){
      const context=await browser.newContext({timezoneId:'Europe/Berlin',viewport:{width:1280,height:900}}),page=await context.newPage(),pageErrors=[],consoleMessages=[],network=[];
      await page.addInitScript(observeAttacks);
      page.on('pageerror',error=>pageErrors.push({message:error.message,stack:error.stack}));page.on('console',message=>{if(message.type()==='error')consoleMessages.push({text:message.text(),location:message.location()});});
      page.on('request',request=>{const url=request.url();network.push({url,type:request.resourceType()});if(!url.startsWith(origin+'/')&&!url.startsWith('data:'))unexpected.push(url);});
      page.on('requestfailed',request=>unexpected.push(request.url()+': '+request.failure()?.errorText));
      await page.goto(`${origin}/${suite.id}.html`,{waitUntil:'load',timeout:30000});
      await page.waitForFunction(()=>globalThis.__nativeBrowserResult,{timeout:60000});
      await page.screenshot({path:path.join(out,suite.id+'.png'),fullPage:true});
      const result=await page.evaluate(()=>({...globalThis.__nativeBrowserResult,cspReports:globalThis.__nativeCspReports,attackExecutions:globalThis.__nativeAttackExecutions}));
      const line=manifest.suites.find(row=>row.id===suite.id).domPurifyParserLine;
      reports.push({id:suite.id,...result,...classifyAttackDiagnostics(result.cspReports,consoleMessages,line?[{url:origin+'/'+suite.id+'.mjs',line}]:[]),pageErrors,network});
      await context.close();
    }
    const context=await browser.newContext({timezoneId:'Europe/Berlin'}),page=await context.newPage(),pageErrors=[],consoleMessages=[],deniedImageRequests=[];
    await page.addInitScript(observeAttacks);
    await page.route(deniedImageURL,route=>route.abort());
    page.on('request',request=>{if(request.url()===deniedImageURL)deniedImageRequests.push({url:request.url(),type:request.resourceType()});else if(!request.url().startsWith(origin+'/'))unexpected.push(request.url());});
    page.on('pageerror',error=>pageErrors.push({message:error.message,stack:error.stack}));page.on('console',message=>{if(message.type()==='error')consoleMessages.push({text:message.text(),location:message.location()});});
    await page.goto(origin+'/parser-control.html',{waitUntil:'load',timeout:30000});await page.waitForFunction(()=>globalThis.__nativeParserControlResult,{timeout:30000});
    const result=await page.evaluate(()=>({...globalThis.__nativeParserControlResult,cspReports:globalThis.__nativeCspReports,attackExecutions:globalThis.__nativeAttackExecutions}));
    const diagnostics=classifyAttackDiagnostics(result.cspReports,consoleMessages,[{url:origin+'/parser-control.mjs',line:controlParserLine},{url:origin+'/parser-control-sanitizer.mjs',line:parserLine(sanitizerSource)}]);
    parserControl={...result,...diagnostics,controlSourceSha256:sha(controlSource),sanitizerSourceSha256:sha(sanitizerSource),deniedImageRequests,pageErrors,passed:result.inert&&result.attackRetainedOnlyInInertInput&&result.handlerAndScriptRemoved&&result.attackExecutions===0&&deniedImageRequests.length===0&&pageErrors.length===0&&diagnostics.unexpectedCspReports.length===0&&diagnostics.consoleErrors.length===0};
    await context.close();
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
  assertSources(manifest);
  const report={schema:'xtend.rmtx.native-catalog-browser-acceptance.v1',generatedAt:new Date().toISOString(),node:process.version,browser:chrome,browserVersion,pageErrors:[...reports.flatMap(row=>row.pageErrors),...(parserControl?.pageErrors||[])],acceptedForRelease:false,ssrAcceptancePerformed:false,timezone:'Europe/Berlin',actualBrowserAPIs:true,nodeCompileBoundary:'exact captured source/options/environment to actual orchestrationArtifacts; unknown pairs fail',injectedPorts:'Existing UI tests inject scoped IO and command ports. Renderer suites use the actual Renderer layout/focus/overlay implementations. This standalone harness does not establish the productive sealed Maraca/React/Vue acceptance.',sourceManifest:manifest,suites:reports,parserControl,unexpectedRequests:unexpected,requests,passed:reports.every(row=>row.passed&&row.pageErrors.length===0&&row.consoleErrors.length===0&&row.unexpectedCspReports.length===0&&row.attackExecutions===0)&&parserControl?.passed===true&&unexpected.length===0};
  fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,json(report));
  for(const row of reports)process.stdout.write(`${row.id}: ${row.cases.filter(test=>test.passed).length}/${row.cases.length}; pageerrors ${row.pageErrors.length}\n`);
  if(!report.passed)process.exitCode=1;
}

(async()=>{
  let manifest;
  if(!args.includes('--browser-only')){
    const prepared=[];for(const suite of suites){const records=prepareCapture(suite);prepared.push(await bundleSuite(suite,records));}
    manifest={schema:'xtend.native-ui-browser-inputs.v1',generatedAt:new Date().toISOString(),node:process.version,esbuild:externalRequire('esbuild/package.json').version,playwright:externalRequire('playwright/package.json').version,suites:prepared};
    write('inputs.json',json(manifest));assertSources(manifest);
  }else manifest=JSON.parse(fs.readFileSync(path.join(out,'inputs.json'),'utf8'));
  if(!args.includes('--prepare-only'))await runBrowser(manifest);
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});

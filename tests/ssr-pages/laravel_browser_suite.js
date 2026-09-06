'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {runFixture,availablePort}=require('../../tools/browser-hypervisor');
const {createSuiteContext}=require('../utils/assertions');
const {createBrowserManifest}=require('./browser_manifest');
async function runLaravelPageBrowserSuite(options={}) {
  const rootDir=options.rootDir || path.resolve(__dirname,'../..');
  const fixture=options.fixture || process.env.XTEND_LARAVEL_FIXTURE;
  if(!fixture || !fs.existsSync(path.join(fixture,'vendor/autoload.php')))throw new Error('An installed isolated Laravel fixture is required.');
  const context=createSuiteContext({id:'ssr-pages-laravel-browser',label:'PHP/Laravel shared page lifecycle in Chromium'});
  const publicDir=path.join(fixture,'public');
  for(const entry of ['public/runtime','bootstrap/cache','storage/framework/sessions','storage/framework/views','storage/logs'])fs.mkdirSync(path.join(fixture,entry),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'laravel_browser.php'),path.join(fixture,'browser.php'));
  fs.copyFileSync(path.join(__dirname,'browser_entry.mjs'),path.join(publicDir,'browser_entry.mjs'));
  // These are browser assets; the PHP host has no runtime path to the checkout.
  for(const name of fs.readdirSync(path.join(rootDir,'xtendrmt')).filter(name=>/\.m?js$/u.test(name)))fs.copyFileSync(path.join(rootDir,'xtendrmt',name),path.join(publicDir,'runtime',name));
  for(const name of ['xrouter.js','xtend-state.js'])fs.copyFileSync(path.join(rootDir,'components',name),path.join(publicDir,'runtime',name));
  fs.writeFileSync(path.join(fixture,'pages.json'),JSON.stringify(await createBrowserManifest()));
  const {privateKey,publicKey}=require('node:crypto').generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  fs.writeFileSync(path.join(fixture,'resume-private.pem'),privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600});
  fs.writeFileSync(path.join(fixture,'resume-public.json'),JSON.stringify(publicKey.export({format:'jwk'})));
  fs.writeFileSync(path.join(fixture,'router.php'),"<?php\n$path = parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);\nif (($path === '/browser_entry.mjs' || preg_match('#^/runtime/[a-z0-9-]+\\\\.m?js$#', $path)) && is_file(__DIR__ . '/public' . $path)) return false;\nrequire __DIR__ . '/browser.php';\n");
  let php, proxy, url, output='', spawnError;
  if(process.env.XTEND_PHP_FPM_BINARY) {
    proxy=await require('./fpm_proxy').startFpmProxy({binary:process.env.XTEND_PHP_FPM_BINARY,fixture});url=proxy.url;
  } else {
    const port=await availablePort();url=`http://127.0.0.1:${port}`;
    php=spawn(process.env.XTEND_PHP_BINARY || 'php',['-d','disable_functions=exec,shell_exec,system,passthru,proc_open,popen','-S',`127.0.0.1:${port}`,'-t',publicDir,path.join(fixture,'router.php')],{cwd:fixture,stdio:['ignore','pipe','pipe'],env:{...process.env,APP_ENV:'production'}});
    php.on('error',error=>{spawnError=error;});
    for(const stream of [php.stdout,php.stderr])stream.on('data',chunk=>{output=(output+chunk).slice(-16000);});
  }
  try {
    const deadline=Date.now()+10000;let ready=false;
    while(Date.now()<deadline && !ready){if(spawnError)throw spawnError;if(php && php.exitCode!==null)throw new Error(`PHP host stopped: ${output}`);try{const response=await fetch(`${url}/login`,{signal:AbortSignal.timeout(3000)});ready=response.ok;if(!ready)throw new Error(`PHP initial response ${response.status}: ${output}${proxy?.output || ''}`);}catch(error){if(error.message.startsWith('PHP initial'))throw error;await new Promise(resolve=>setTimeout(resolve,50));}}
    if(!ready)throw new Error(`PHP host did not start: ${output}`);
    const result=await runFixture({engine:'chromium',url:`${url}/login`,resultKey:'__XTEND_PAGE_BROWSER__',timeoutMs:60000,...options.browser});
    for(const check of result.result.checks || [])context.pass(check);
    if(!result.result.ok)context.fail(result.result.error || 'Missing browser success');
    const resume=await runFixture({engine:'chromium',url:`${url}/resume`,resultKey:'__XTEND_PAGE_BROWSER__',timeoutMs:30000,...options.browser});
    for(const check of resume.result.checks || [])context.pass(check);
    if(!resume.result.ok)context.fail(resume.result.error || 'Missing resume success');
    if(proxy)context.pass('shared lifecycle and signed resume pass behind an actual PHP-FPM pool and FastCGI proxy');
  }catch(error){context.fail(`${error.stack || error}\n${output}${proxy?.output || ''}`);}
  finally{
    if(proxy)await proxy.dispose();
    if(php?.pid && php.exitCode===null){const exited=once(php,'exit');php.kill('SIGTERM');let timer;await Promise.race([exited,new Promise(resolve=>{timer=setTimeout(resolve,3000);})]);clearTimeout(timer);if(php.exitCode===null){php.kill('SIGKILL');await exited;}}
  }
  return context.result();
}
if(require.main===module)runLaravelPageBrowserSuite().then(result=>{console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;});
module.exports={runLaravelPageBrowserSuite};

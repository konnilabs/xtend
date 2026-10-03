import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const rootDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url);
const {buildMaracaBundleAsync}=require('../../xtend-maraca');
const {listenXtendDevServer}=require('../../scripts/serve_xtend_dev');
const {runFixture}=require('../../tools/browser-hypervisor');
const built=await buildMaracaBundleAsync({source:path.join(rootDir,'demos/xtendrmt/maraca-fastpass/app.rmt'),out:path.join(rootDir,'.xtend-build/maraca/fastpass'),orchestration:'strict',kernel:'strict',hydration:'auto',css:'external'},{rootDir});
if(!built.ok)throw Error(JSON.stringify(built.diagnostics||built.plan?.diagnostics));
const server=await listenXtendDevServer({rootDir,port:0});
try {
 const result=await runFixture({engine:'chromium',url:server.origin+'/tests/maraca/fixtures/fastpass-browser.html',resultKey:'__maracaResponsiveness',timeoutMs:45000});
 await fs.mkdir(path.join(rootDir,'.xtend-test-results'),{recursive:true});
 await fs.writeFile(path.join(rootDir,'.xtend-test-results/maraca-responsiveness-browser.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({browser:result.browserVersion,...result.result},null,2));
 if(result.result.status!=='passed')process.exitCode=1;
}finally{server.server.closeAllConnections?.();await new Promise(resolve=>server.server.close(resolve));}

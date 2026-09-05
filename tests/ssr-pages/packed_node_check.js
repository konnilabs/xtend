'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
function npmCliPath() {
  const candidates=[process.env.npm_execpath,path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.resolve(path.dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
  for(const directory of (process.env.PATH || '').split(path.delimiter)) {
    candidates.push(path.join(directory,'node_modules/npm/bin/npm-cli.js'));
    try {candidates.push(fs.realpathSync(path.join(directory,'npm')));} catch {}
  }
  const cli=candidates.find(file=>file && path.basename(file)==='npm-cli.js' && fs.existsSync(file));
  if(!cli)throw new Error('The package acceptance requires an installed npm CLI.');
  return cli;
}
async function checkPackedNode(rootDir) {
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-page-node-package-'));
  try {
    const npm=npmCliPath();
    const pack=JSON.parse(execFileSync(process.execPath,[npm,'pack','--ignore-scripts','--json','--pack-destination',output],{cwd:path.join(rootDir,'xtendrmt'),encoding:'utf8',timeout:30000}))[0];
    fs.writeFileSync(path.join(output,'package.json'),JSON.stringify({name:'xtend-page-isolated-test',version:'1.0.0',private:true,type:'module'}));
    execFileSync(process.execPath,[npm,'install','--offline','--ignore-scripts','--no-audit','--no-fund','--package-lock=false',path.join(output,pack.filename)],{cwd:output,encoding:'utf8',timeout:30000});
    fs.writeFileSync(path.join(output,'verify.mjs'),`
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {spawnSync} from 'node:child_process';
import {createNodePageHost} from '@ccslabs/xtend-rmt/node-page-host';
import {createRmtNodeSsrAdapter} from '@ccslabs/xtend-rmt/node-ssr-adapter';
import {createPortableRenderArtifact} from '@ccslabs/xtend-rmt/portable-render';
import {Prop} from '@ccslabs/xtend-rmt/page-contract';
import {createPageClient} from '@ccslabs/xtend-rmt/page-client';
import {createPageForm} from '@ccslabs/xtend-rmt/page-form';
assert(spawnSync('php',['--version']).error, 'No PHP executable is available to this application');
assert.equal(typeof createRmtNodeSsrAdapter,'function');assert.equal(typeof createPageClient,'function');assert.equal(typeof createPageForm,'function');
const artifact=createPortableRenderArtifact({descriptor:{type:'text',text:'$model.title'}},{inputs:['title']});
const host=createNodePageHost({manifest:{schema:'xtend.page-manifest.v1',version:'pack',pages:{Home:{artifact}}},createContext:()=>({contextKey:'public'}),resolvePage:()=>({page:'Home',props:{title:Prop.once(async()=> 'Independent Node SSR')}})});
const server=createServer((req,res)=>host.handle(req,res));server.listen(0,'127.0.0.1');await once(server,'listening');
try{const response=await fetch('http://127.0.0.1:'+server.address().port);assert.equal(response.status,200);assert.match(await response.text(),/Independent Node SSR/);}finally{host.dispose();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
`);
    execFileSync(process.execPath,['verify.mjs'],{cwd:output,encoding:'utf8',timeout:15000,env:{...process.env,PATH:path.dirname(process.execPath),NODE_PATH:''}});
    fs.copyFileSync(path.join(rootDir,'tests/ssr-pages/type_consumer.mts'),path.join(output,'consumer.mts'));
    try { execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--target','es2022','--module','nodenext','--moduleResolution','nodenext','--types','node','--typeRoots',path.join(rootDir,'node_modules/@types'),'consumer.mts'],{cwd:output,encoding:'utf8',timeout:30000}); }
    catch(error) {throw new Error(`Packed TypeScript consumer failed:\n${error.stdout || ''}\n${error.stderr || ''}`);}
    assert(fs.existsSync(path.join(output,'node_modules/@ccslabs/xtend-rmt/page-client.d.ts')));
  } finally { fs.rmSync(output,{recursive:true,force:true}); }
}
module.exports={checkPackedNode};

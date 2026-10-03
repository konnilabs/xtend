'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

function unpackVsix(vsixPath) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-vsix-smoke-'));
  try {
    if (process.platform === 'win32') execFileSync('tar', ['-xf', vsixPath, '-C', directory]);
    else execFileSync('unzip', ['-q', vsixPath, '-d', directory]);
    return { directory, extensionRoot: path.join(directory, 'extension'), cleanup: () => fs.rmSync(directory, { recursive: true, force: true }) };
  } catch (error) { fs.rmSync(directory, { recursive: true, force: true }); throw error; }
}

async function smokeLanguageServer(extensionRoot, workspace) {
  const serverPath = path.join(extensionRoot, 'tools/rmt-language-server/server.js');
  const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' };
  const child = spawn(process.execPath, [serverPath], { cwd: workspace, env, stdio: ['pipe','pipe','pipe'] });
  let buffer = Buffer.alloc(0), stderr = '', nextId = 0;
  const pending = new Map();
  const notifications = [];
  const fail = error => { for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(error); } pending.clear(); };
  child.stderr.on('data', chunk=>{stderr+=chunk;});
  child.on('error',fail);
  child.on('exit',(code,signal)=>fail(new Error(`Packed LSP exited (${code}, ${signal}): ${stderr}`)));
  child.stdout.on('data',chunk=>{
    buffer=Buffer.concat([buffer,chunk]);
    while (true) {
      const end=buffer.indexOf('\r\n\r\n'); if(end<0)return;
      const length=Number(/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0,end).toString())?.[1]);
      if (!Number.isFinite(length)) { fail(new Error('Invalid LSP frame.')); return; }
      if(buffer.length<end+4+length)return;
      let message;try {message=JSON.parse(buffer.subarray(end+4,end+4+length));} catch(error){fail(error);return;}
      buffer=buffer.subarray(end+4+length);
      const entry=pending.get(message.id);
      if(entry){pending.delete(message.id);clearTimeout(entry.timer);message.error?entry.reject(new Error(JSON.stringify(message.error))):entry.resolve(message.result);}
      else notifications.push(message);
    }
  });
  function send(method,params,id) {
    const text=JSON.stringify({jsonrpc:'2.0',...(id===undefined?{}:{id}),method,params});
    child.stdin.write(`Content-Length: ${Buffer.byteLength(text)}\r\n\r\n${text}`);
  }
  function request(method,params={}) {
    return new Promise((resolve,reject)=>{const id=++nextId;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Packed LSP timed out: ${method}; ${stderr}`));},10000);pending.set(id,{resolve,reject,timer});send(method,params,id);});
  }
  try {
    const initialized=await request('initialize',{rootUri:pathToFileURL(workspace).href,capabilities:{}});
    assert(initialized.capabilities.referencesProvider);
    send('initialized',{});
    const documents=[
      {name:'legacy.core.json',text:JSON.stringify({kind:'rmt_document',version:'1.0',manifest:{documentId:'smoke'},components:[{id:'legacy',tag:'x-example'}]})},
      {name:'next.rmt',text:'template app {\n state count type number initial 0\n selector selected from state count {\n output Value[]\n }\n}\n'}
    ];
    for(const document of documents){
      const uri=pathToFileURL(path.join(workspace,document.name)).href;
      send('textDocument/didOpen',{textDocument:{uri,languageId:'rmt',version:1,text:document.text}});
      const symbols=await request('textDocument/documentSymbol',{textDocument:{uri}});
      assert(symbols.length>0,`Packed LSP has no ${document.name} declarations: ${JSON.stringify(notifications)}; ${stderr}`);
      assert(notifications.some(n=>n.method==='textDocument/publishDiagnostics'&&n.params.uri===uri),`Missing diagnostics for ${document.name}`);
    }
    const uri=pathToFileURL(path.join(workspace,'next.rmt')).href;
    const definitionResult=await request('textDocument/definition',{textDocument:{uri},position:{line:2,character:31}});
    const definitions=Array.isArray(definitionResult)?definitionResult:[definitionResult];
    assert.equal(definitions.length,1);
    assert.equal(definitions[0].range.start.line,1);
    const references=await request('textDocument/references',{textDocument:{uri},position:{line:1,character:8},context:{includeDeclaration:true}});
    assert.equal(references.length,2);
    assert((await request('workspace/symbol',{query:'count'})).length>0);
    await request('shutdown');
    const exit=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Packed LSP did not shut down.')),5000);child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(new Error(`Packed LSP shutdown exit ${code}`));});});
    send('exit');await exit;
    return { initialized:true, legacy:true, vNext:true, navigation:true, shutdown:true };
  } finally {
    fail(new Error('LSP smoke cleanup'));
    if(child.exitCode===null && child.signalCode===null){child.kill('SIGKILL');await new Promise(resolve=>child.once('exit',resolve));}
  }
}
module.exports={unpackVsix,smokeLanguageServer};

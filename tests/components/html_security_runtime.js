'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const {createDownstreamNoManualHtmlGate}=require('../../tools/rmt-language/app-platform-tooling');
const {checkMaracaHtmlSecurity,applyMaracaHtmlSecurity}=require('../../xtend-maraca/html-security');
const gate=createDownstreamNoManualHtmlGate({syntax:true}),checks=[];
const record=(name,run)=>{run();checks.push({name,passed:true});};
for(const source of [
 'node.innerHTML=data','node["innerHTML"] = data',"node['inner'+'HTML'] += data",'node.outerHTML=data','frame.srcdoc=data',
 'const insert=node.insertAdjacentHTML;insert("beforeend",data)',
 'const insert=node["insertAdjacentHTML"].bind(node);insert("beforeend",data)',
 'const {insertAdjacentHTML:insert}=node;insert("beforeend",data)',
 'let insert;insert=node.insertAdjacentHTML;const copy=insert;copy.call(node,"beforeend",data)',
 'document.writeln(data)','range.createContextualFragment(data)','node.setHTMLUnsafe(data)',
 'node.setAttribute("srcdoc",data)'])record('syntax gate rejects '+source,()=>assert(gate.scanText(source,{filePath:'app.ts'}).length));
for(const source of ['// node.innerHTML=data\nnode.textContent=data','const literal="node.innerHTML = data"','const html=node.innerHTML','const value: string="text";'])record('syntax gate accepts inert source '+source,()=>assert.equal(gate.scanText(source,{filePath:'app.ts'}).length,0));
record('legacy boundary filename cannot implicitly bypass syntax mode',()=>assert(gate.scanText('node.innerHTML=data',{filePath:'components/xplayer.js'}).length));
record('invalid source fails closed',()=>assert.equal(gate.scanText('const broken = (',{filePath:'app.ts'})[0].code,'rmt.app.no-manual-shell.source-invalid'));
record('optional compiler is loaded only for active audits and missing prerequisites fail closed',()=>{
 const Module=require('module'),filename=path.resolve(__dirname,'../../xtend-maraca/html-security.js');
 for(const code of ['MODULE_NOT_FOUND','ERR_PACKAGE_PATH_NOT_EXPORTED']){
  const isolated=new Module(filename,module),real=Module.createRequire(filename);let requests=0;
  isolated.filename=filename;isolated.require=name=>{
   if(name==='@ccslabs/xtend-compiler/rmt-language/app-platform-tooling'){requests++;throw Object.assign(new Error('controlled missing optional compiler'),{code});}
   return real(name);
  };
  isolated._compile(fs.readFileSync(filename,'utf8'),filename);
  for(const value of [undefined,false])assert.equal(isolated.exports.checkMaracaHtmlSecurity(value,process.cwd()),null);
  assert.equal(requests,0);
  const result=isolated.exports.checkMaracaHtmlSecurity({sources:[]},process.cwd());
  assert.equal(result.ok,false);assert.equal(requests,1);assert(result.diagnostics.some(d=>d.code==='rmt.app.no-manual-shell.toolchain-missing'));
 }
});

const folder=fs.mkdtempSync(path.join(process.cwd(),'.xtend-html-security-'));
try{
 fs.writeFileSync(path.join(folder,'clean.ts'),'const value: string="text"; node.textContent=value;');
 fs.writeFileSync(path.join(folder,'unsafe.ts'),'node["innerHTML"]=data');
 const config=file=>({sources:[path.relative(process.cwd(),path.join(folder,file))]});
 record('Maraca audit accepts clean owned source and records its hash',()=>{const r=checkMaracaHtmlSecurity(config('clean.ts'),process.cwd());assert(r.ok);assert.equal(r.sources[0].sha256.length,64);});
 record('Maraca blocks unsafe source before rendering artifacts',()=>{const plan={rootDir:process.cwd(),ok:true,status:'ready',diagnostics:[]};applyMaracaHtmlSecurity(plan,{htmlSecurity:config('unsafe.ts')},{});assert.equal(plan.ok,false);assert.equal(plan.status,'blocked');assert(plan.diagnostics.some(d=>d.sink==='innerHTML'));});
 record('Maraca audit is compatible when not configured',()=>assert.equal(checkMaracaHtmlSecurity(undefined,process.cwd()),null));
 record('empty audit and missing source fail closed',()=>{assert.equal(checkMaracaHtmlSecurity({sources:[]},process.cwd()).ok,false);assert.equal(checkMaracaHtmlSecurity(config('missing.ts'),process.cwd()).ok,false);});
 const outside=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-outside-'));fs.writeFileSync(path.join(outside,'unsafe.js'),'node.innerHTML=data');fs.symlinkSync(path.join(outside,'unsafe.js'),path.join(folder,'linked.js'));
 try{record('sources and symlinks outside the application root fail closed',()=>{assert.equal(checkMaracaHtmlSecurity(config('linked.js'),process.cwd()).ok,false);assert.equal(checkMaracaHtmlSecurity({sources:[path.join(outside,'unsafe.js')]},process.cwd()).ok,false);});}finally{fs.rmSync(outside,{recursive:true,force:true});}
}finally{fs.rmSync(folder,{recursive:true,force:true});}
console.log(JSON.stringify({status:'passed',checks,errors:[]}));

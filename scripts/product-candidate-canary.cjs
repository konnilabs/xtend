'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync,spawnSync}=require('node:child_process');
const {digest,verifyCandidates}=require('../candidate-integrity.cjs');
const {buildLaravelPackage}=require('./build_laravel_package');
const {verifyEvidence,verifyReportFiles,verifyInstallationFiles}=require('./product-candidate-evidence.cjs');
const root=path.resolve(__dirname,'..');
function git(args,cwd=root){return execFileSync('git',args,{cwd,encoding:'utf8'}).trim();}
function packCandidates({output,demoSha,development=false}={}) {
 const coreSha=git(['rev-parse','HEAD']);
 if(!development&&git(['status','--porcelain','--untracked-files=no']))throw Error('Core candidate must come from a clean commit');
 if(!/^[a-f0-9]{40}$/.test(demoSha||''))throw Error('Exact pinned Demo SHA required');
 if(fs.existsSync(output))throw Error('Candidate output must be fresh');fs.mkdirSync(output,{recursive:true});
 // Pack only tracked bytes of the asserted SHA, including in development mode.
 // npm's published globs must never import ignored/untracked worktree files.
 const snapshot=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-core-pack-'));
 try {
 const archive=execFileSync('git',['archive','--format=tar',coreSha],{cwd:root,maxBuffer:256*1024*1024});
 execFileSync('tar',['-xf','-','-C',snapshot],{input:archive,stdio:['pipe','pipe','pipe'],timeout:60000});
 const manifest=JSON.parse(fs.readFileSync(path.join(snapshot,'package.json')));
 const packages=[];
 for(const directory of ['.',...manifest.workspaces]) {
  const data=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',output],{cwd:path.join(snapshot,directory),encoding:'utf8',maxBuffer:32*1024*1024}))[0];
  const sha256=digest(fs.readFileSync(path.join(output,data.filename)));
  const filename=data.filename.replace(/\.tgz$/,'.'+sha256.slice(0,16)+'.tgz');fs.renameSync(path.join(output,data.filename),path.join(output,filename));
  const pkg=JSON.parse(fs.readFileSync(path.join(snapshot,directory,'package.json')));
  const metadata=Object.fromEntries(['dependencies','optionalDependencies','peerDependencies','peerDependenciesMeta'].filter(key=>pkg[key]).map(key=>[key,pkg[key]]));
  packages.push({name:data.name,version:data.version,file:filename,integrity:data.integrity,sha256,...metadata});
 }
 // Generated PHP packaging metadata is derived solely from the same SHA archive;
 // buildLaravelPackage fingerprints every copied runtime source.
 const php=buildLaravelPackage({rootDir:snapshot,output:path.join(output,'xtend-laravel'),archiveTool:'tar'});
 const result={schema:'xtend.product-candidates.v1',coreSha,demoSha,development,packages,php:{file:path.basename(php.archive),sha256:php.sha256,sources:php.files}};
 verifyCandidates(result,{coreSha,demoSha,directory:output});fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(result,null,2)+'\n');return result;
 } finally {fs.rmSync(snapshot,{recursive:true,force:true});}
}
async function main() {
 const development=process.argv.includes('--development');
 const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
 const pin=fs.existsSync(path.join(root,'product-demos.lock.json'))?require('../product-demos.lock.json'):{};
 const demoSha=arg('--demo-sha')||pin.demoSha;
 const output=path.resolve(arg('--out')||path.join(root,'.xtend-test-results/product-candidates'));
 const manifest=packCandidates({output,demoSha,development});
 if(process.argv.includes('--pack-only')){console.log(JSON.stringify(manifest));return;}
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-demo-candidate-'));
 const checkout=path.join(temporary,'demos'),startedAt=new Date().toISOString();
 let report={schema:'xtend.product-candidate-evidence.v1',ok:false,status:'failed',coreSha:manifest.coreSha,demoSha,packages:manifest.packages,php:manifest.php,generatedAt:startedAt,commands:[],development};
 try {
  const local=arg('--demo-repository');
  execFileSync('git',['clone','--no-checkout',local||'https://github.com/konnilabs/xtend-demos.git',checkout],{stdio:'pipe'});
  execFileSync('git',['checkout','--detach',demoSha],{cwd:checkout,stdio:'pipe'});
  if(git(['rev-parse','HEAD'],checkout)!==demoSha||git(['status','--porcelain'],checkout))throw Error('Pinned Demo checkout is not clean');
  const install=spawnSync(process.execPath,['scripts/install-candidates.cjs',output,manifest.coreSha,demoSha],{cwd:checkout,encoding:'utf8',maxBuffer:32*1024*1024,timeout:600000});
  fs.writeFileSync(path.join(output,'installation.log'),`${install.stdout||''}\n${install.stderr||''}`);
  if(install.status!==0)throw Error(`Candidate installation failed: ${install.status} ${install.error?.message||''}`);
  const installation=JSON.parse(install.stdout);
  for(const item of installation.results) {
   const file='locks/'+(item.product==='.'?'root':item.product.split('/').at(-1))+'.json';
   const bytes=fs.readFileSync(path.join(checkout,item.product,'package-lock.json'));
   if(digest(bytes)!==item.lockSha256)throw Error('Installation lock changed after verification');
   fs.mkdirSync(path.join(output,'locks'),{recursive:true});fs.writeFileSync(path.join(output,file),bytes);item.file=file;
  }
  fs.writeFileSync(path.join(output,'installation.json'),JSON.stringify(installation,null,2)+'\n');
  const runtime=spawnSync(process.execPath,['scripts/prepare-product-runtime.cjs'],{cwd:checkout,encoding:'utf8',maxBuffer:32*1024*1024,timeout:600000,env:{...process.env,XTEND_CORE_SHA:manifest.coreSha,XTEND_DEMO_SHA:demoSha}});
  fs.writeFileSync(path.join(output,'runtime-provisioning.log'),`${runtime.stdout||''}\n${runtime.stderr||''}`);
  if(runtime.status!==0)throw Error('Required PHP/Electron runtime provisioning failed: '+runtime.status);
  const ownership=spawnSync(process.execPath,['scripts/verify-schema-ownership.cjs',root,output,git(['rev-parse','HEAD']),demoSha],{cwd:checkout,encoding:'utf8',timeout:600000,maxBuffer:32*1024*1024});
  fs.writeFileSync(path.join(output,'schema-ownership.log'),`${ownership.stdout||''}\n${ownership.stderr||''}`);
  if(ownership.status!==0||ownership.error)throw Error('Required paired 100-ID ownership gate failed');
  fs.copyFileSync(path.join(checkout,'.xtend-test-results/schema-ownership-100.json'),path.join(output,'schema-ownership-100.json'));
  const ownershipBinding={file:'schema-ownership-100.json',sha256:digest(fs.readFileSync(path.join(output,'schema-ownership-100.json')))};
  require('../tools/schema-inventory/ownership.cjs').verifyOwnershipEvidence(ownershipBinding,{directory:output,coreSha:git(['rev-parse','HEAD']),demoSha,manifest,startedAt});

  const run=spawnSync(process.execPath,['scripts/run-product-gates.cjs','--report',path.join(output,'demo-execution.json')],{cwd:checkout,encoding:'utf8',maxBuffer:32*1024*1024,timeout:1500000,env:{...process.env,XTEND_CORE_SHA:manifest.coreSha,XTEND_DEMO_SHA:demoSha}});
  fs.writeFileSync(path.join(output,'demo-gates.log'),`${run.stdout||''}\n${run.stderr||''}`);
  const execution=JSON.parse(fs.readFileSync(path.join(output,'demo-execution.json')));
  if(execution.schema!=='xtend.product-execution.v1'||execution.ok!==true||execution.status!=='passed'||execution.coreSha!==manifest.coreSha||execution.demoSha!==demoSha||!Number.isFinite(Date.parse(execution.generatedAt))||Date.parse(execution.generatedAt)<Date.parse(startedAt)||Date.parse(execution.generatedAt)>Date.now()+1000)throw Error('Invalid, missing or stale product execution evidence');
  const reports=execution.commands.map(command=>{const source=path.join(checkout,'.xtend-test-results/suites',command.id+'.json');if(!fs.existsSync(source))throw Error('Missing required product report: '+command.id);const bytes=fs.readFileSync(source);const copied=path.join(output,'reports',command.id+'.json');fs.mkdirSync(path.dirname(copied),{recursive:true});fs.writeFileSync(copied,bytes);return {id:command.id,file:'reports/'+command.id+'.json',sha256:digest(bytes),status:command.status};});
  fs.mkdirSync(path.join(output,'reports'),{recursive:true});fs.copyFileSync(path.join(output,'schema-ownership-100.json'),path.join(output,'reports/schema-ownership-100.json'));
  reports.push({id:'schema-ownership-100',file:'reports/schema-ownership-100.json',sha256:ownershipBinding.sha256,status:'passed'});
  execution.commands.push({id:'schema-ownership-100',status:'passed',exitCode:ownership.status,skips:[],failures:[]});
  fs.writeFileSync(path.join(output,'reports.json'),JSON.stringify(reports,null,2)+'\n');
  report={...report,installation:installation.results,reports,commands:execution.commands,generatedAt:new Date().toISOString(),status:run.status===0?'passed':'failed',ok:run.status===0&&!development};
  if(report.ok){verifyReportFiles(reports,{directory:output,coreSha:manifest.coreSha,demoSha,manifest,startedAt});verifyInstallationFiles(installation.results,{directory:output,manifest});verifyEvidence(report,{coreSha:manifest.coreSha,demoSha,packages:manifest.packages,php:manifest.php,installation:installation.results,reports,startedAt});}
 }catch(error){report.ok=false;report.status='failed';report.error=error.message;}finally {
  const target=path.join(root,'.xtend-test-results/product-candidate.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');fs.rmSync(temporary,{recursive:true,force:true});
 }
 console.log(JSON.stringify(report));if(!report.ok)process.exitCode=1;
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={packCandidates};

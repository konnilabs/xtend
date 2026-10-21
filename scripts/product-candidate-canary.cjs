'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync,spawnSync}=require('node:child_process');
const {digest,verifyCandidates}=require('../candidate-integrity.cjs');
const {buildLaravelPackage}=require('./build_laravel_package');
const {verifyEvidence,verifyReportFiles,verifyInstallationFiles,verifyInstallationEnvelope}=require('./product-candidate-evidence.cjs');
const root=path.resolve(__dirname,'..');
function git(args,cwd=root){return execFileSync('git',args,{cwd,encoding:'utf8'}).trim();}
// Independent migration audit keeps the legacy paired manifest, using the same pack loop.
const packCandidates=options=>require('./pack-candidates.cjs').packCandidates({...options,profile:'xtend.product.audit.v1'});
async function main() {
 const development=process.argv.includes('--development');
 const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
 const pin=fs.existsSync(path.join(root,'product-demos.lock.json'))?require('../product-demos.lock.json'):{};
 if(fs.existsSync(path.join(root,'product-demos.lock.json')))require('../tools/schema-inventory/source-provider.cjs').verifyProductDemoPin(pin);
 const demoSha=arg('--demo-sha')||pin.demoSha;
 const output=path.resolve(arg('--out')||path.join(root,'.xtend-test-results/product-candidates'));
 // Reuse the reviewed packer's immutable bytes in both consumer lanes and on
 // resume. This branch never invokes npm pack or changes the source manifest.
 const existing=process.argv.includes('--existing-candidates');
 const manifest=existing?JSON.parse(fs.readFileSync(path.join(output,'manifest.json'))):packCandidates({output,demoSha,development});
 if(existing){
  const expected=arg('--manifest-sha256');
  if(!/^[a-f0-9]{64}$/.test(expected||'')||digest(fs.readFileSync(path.join(output,'manifest.json')))!==expected)throw Error('Immutable candidate manifest hash mismatch');
  if(manifest.development||development)throw Error('Development candidates cannot be reused for release');
  verifyCandidates(manifest,{coreSha:git(['rev-parse','HEAD']),demoSha,directory:output});
 }
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
  verifyInstallationEnvelope(installation,{coreSha:manifest.coreSha,demoSha});
  for(const item of installation.results) {
   const file='locks/'+(item.product==='.'?'root':item.product.split('/').at(-1))+'.json';
   const bytes=fs.readFileSync(path.join(checkout,item.product,'package-lock.json'));
   if(digest(bytes)!==item.lockSha256)throw Error('Installation lock changed after verification');
   fs.mkdirSync(path.join(output,'locks'),{recursive:true});fs.writeFileSync(path.join(output,file),bytes);item.file=file;
  }
  fs.writeFileSync(path.join(output,'installation.json'),JSON.stringify(installation,null,2)+'\n');
  const runtime=spawnSync(process.execPath,['scripts/prepare-product-runtime.cjs'],{cwd:checkout,encoding:'utf8',maxBuffer:32*1024*1024,timeout:600000,env:{...process.env,REQUIRED_CI_ATTESTATION:'1',XTEND_CORE_SHA:manifest.coreSha,XTEND_DEMO_SHA:demoSha,XTEND_SCHEMA_AUDIT_CORE_ROOT:root}});
  fs.writeFileSync(path.join(output,'runtime-provisioning.log'),`${runtime.stdout||''}\n${runtime.stderr||''}`);
  if(runtime.status!==0){try{require(path.join(checkout,'scripts/runtime-preparation-diagnostics.cjs')).relay(runtime.stderr);}catch{}throw Error('Required PHP/Electron runtime provisioning failed: '+runtime.status);}
  const ownership=spawnSync(process.execPath,['scripts/verify-schema-ownership.cjs',root,output,git(['rev-parse','HEAD']),demoSha],{cwd:checkout,encoding:'utf8',timeout:600000,maxBuffer:32*1024*1024});
  fs.writeFileSync(path.join(output,'schema-ownership.log'),`${ownership.stdout||''}\n${ownership.stderr||''}`);
  if(ownership.status!==0||ownership.error)throw Error('Required paired 103-ID ownership gate failed');
  fs.copyFileSync(path.join(checkout,'.xtend-test-results/schema-ownership-103.json'),path.join(output,'schema-ownership-103.json'));
  const ownershipBinding={file:'schema-ownership-103.json',sha256:digest(fs.readFileSync(path.join(output,'schema-ownership-103.json')))};
  require('../tools/schema-inventory/index.cjs').verifyMigrationOwnershipEvidence(ownershipBinding,{directory:output,coreSha:git(['rev-parse','HEAD']),demoSha,manifest,startedAt,now:Date.now()});

  const run=spawnSync(process.execPath,['scripts/run-product-gates.cjs','--report',path.join(output,'demo-execution.json')],{cwd:checkout,encoding:'utf8',maxBuffer:32*1024*1024,timeout:1500000,env:{...process.env,REQUIRED_CI_ATTESTATION:'1',XTEND_CORE_SHA:manifest.coreSha,XTEND_DEMO_SHA:demoSha,XTEND_SCHEMA_AUDIT_CORE_ROOT:root}});
  fs.writeFileSync(path.join(output,'demo-gates.log'),`${run.stdout||''}\n${run.stderr||''}`);
  const appProof=spawnSync(process.execPath,['scripts/verify-electron-app-attestation.cjs','--core-sha',manifest.coreSha,'--demo-sha',demoSha,'--started-at',startedAt],{cwd:checkout,encoding:'utf8',maxBuffer:32*1024*1024,timeout:30000,env:{...process.env,REQUIRED_CI_ATTESTATION:'1'}});
  fs.writeFileSync(path.join(output,'electron-app-attestation-consumer.log'),`${appProof.stdout||''}\n${appProof.stderr||''}`);
  if(appProof.status!==0||appProof.error)throw Error('Required actual application sandbox attestation failed');
  const actualApp=JSON.parse(appProof.stdout);if(actualApp.ok!==true||actualApp.coreSha!==manifest.coreSha||actualApp.demoSha!==demoSha||actualApp.proofKind!=='consumed-actual-application-main-frame')throw Error('Missing actual application identity proof');
  fs.copyFileSync(path.join(checkout,'.xtend-test-results/electron-sandbox-attestation.json'),path.join(output,'electron-sandbox-attestation.json'));
  const retainedConsumer=fs.readFileSync(path.join(checkout,'.xtend-test-results/electron-app-attestation-consumer.json'));
  if(JSON.stringify(JSON.parse(retainedConsumer))!==JSON.stringify(actualApp))throw Error('Retained actual application consumer differs from independent recheck');
  fs.writeFileSync(path.join(output,'electron-app-attestation-consumer.json'),retainedConsumer);
  const execution=JSON.parse(fs.readFileSync(path.join(output,'demo-execution.json')));
  if(execution.schema!=='xtend.product-execution.v1'||execution.ok!==true||execution.status!=='passed'||execution.coreSha!==manifest.coreSha||execution.demoSha!==demoSha||!Number.isFinite(Date.parse(execution.generatedAt))||Date.parse(execution.generatedAt)<Date.parse(startedAt)||Date.parse(execution.generatedAt)>Date.now()+1000)throw Error('Invalid, missing or stale product execution evidence');
  const reports=execution.commands.map(command=>{const source=path.join(checkout,'.xtend-test-results/suites',command.id+'.json');if(!fs.existsSync(source))throw Error('Missing required product report: '+command.id);const bytes=fs.readFileSync(source);const copied=path.join(output,'reports',command.id+'.json');fs.mkdirSync(path.dirname(copied),{recursive:true});fs.writeFileSync(copied,bytes);return {id:command.id,file:'reports/'+command.id+'.json',sha256:digest(bytes),status:command.status};});
  fs.mkdirSync(path.join(output,'reports'),{recursive:true});fs.copyFileSync(path.join(output,'schema-ownership-103.json'),path.join(output,'reports/schema-ownership-103.json'));
  reports.push({id:'schema-ownership-103',file:'reports/schema-ownership-103.json',sha256:ownershipBinding.sha256,status:'passed'});
  execution.commands.push({id:'schema-ownership-103',status:'passed',exitCode:ownership.status,skips:[],failures:[]});
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

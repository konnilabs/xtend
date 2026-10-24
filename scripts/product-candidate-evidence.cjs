'use strict';
const fs=require('node:fs'),path=require('node:path');
const {verifyCandidates,verifyInstalledClosure,digest}=require('../candidate-integrity.cjs');
const schema='xtend.product-candidate-evidence.v1';
const required=['http-security','product-xss','product-builds','product-owned-suites','shop-php','shop-browser','shop-browser-fpm','electron-runtime','electron-actual-app-attestation','electron-shell-import-worker','llm-contracts','erp-resumability-catfood','maraca-app-services-test-bench','xtend-llm-app-services-catfood','xtend-material-catfooding','xtend-shop-php','xtend-shop-browser','xtend-shop-contracts','schema-ownership-103'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function verifyEvidence(evidence,{coreSha,demoSha,packages,php,installation,reports,startedAt,maxAgeMs=3600000,now=Date.now()}={}) {
 if(evidence?.schema!==schema||evidence.ok!==true||evidence.status!=='passed'||evidence.development)throw Error('Missing or failed required Demo evidence');
 if(!/^[a-f0-9]{40}$/.test(coreSha||'')||!/^[a-f0-9]{40}$/.test(demoSha||'')||evidence.coreSha!==coreSha||evidence.demoSha!==demoSha)throw Error('Demo evidence SHA mismatch');
 const generated=Date.parse(evidence.generatedAt);if(!Number.isFinite(generated)||generated>now+1000||now-generated>maxAgeMs||startedAt&&generated<Date.parse(startedAt))throw Error('Stale Demo evidence');
 if(!Array.isArray(evidence.commands)||!evidence.commands.length||new Set(evidence.commands.map(c=>c.id)).size!==evidence.commands.length||evidence.commands.some(c=>c.status!=='passed'||c.exitCode!==0||c.skips?.length||c.failures?.length))throw Error('Incomplete Demo execution evidence');
 for(const id of required)if(!evidence.commands.some(c=>c.id===id))throw Error(`Missing required Demo execution: ${id}`);
 if(!Array.isArray(packages)||!same(evidence.packages,packages)||!packages.length||packages.some(p=>!p.sha256||!p.integrity||!p.version))throw Error('Demo package fingerprint mismatch');
 if(!php?.sha256||!Object.keys(php.sources||{}).length||!same(evidence.php,php))throw Error('PHP/Laravel fingerprint mismatch');
 if(!Array.isArray(installation)||installation.length!==8||installation.some(i=>i.status!=='passed'||!i.lockSha256)||!same(evidence.installation,installation))throw Error('npm installation closure mismatch');
 if(!Array.isArray(reports)||!reports.length||!same(evidence.reports,reports)||reports.some(r=>r.status!=='passed'||!r.sha256)||new Set(reports.map(r=>r.id)).size!==reports.length)throw Error('Required report fingerprint mismatch');
 for(const command of evidence.commands)if(!reports.some(report=>report.id===command.id))throw Error('Missing required report for '+command.id);
 return true;
}
const appSourcePaths=['src/main/electron-main.mjs','src/main/preload.cjs','src/renderer/app-controller.mjs','src/main/app-server.mjs','src/main/app-server-session.mjs','site/index.html','scripts/electron-sandbox-policy.mjs'];
function verifyActualAppFiles(binding,{directory,coreSha,demoSha,startedAt,now=Date.now()}={}) {
 if(!binding||binding.coreSha!==coreSha||binding.demoSha!==demoSha)throw Error('Missing actual application suite binding/identity');
 const read=(key,file)=>{const entry=binding[key];if(entry?.file!==file||!/^[a-f0-9]{64}$/.test(entry.sha256||''))throw Error('Missing actual application '+key+' digest binding');const target=path.join(fs.realpathSync(directory),file);if(!fs.lstatSync(target).isFile()||fs.realpathSync(target)!==target)throw Error('Invalid actual application '+key+' file');const bytes=fs.readFileSync(target);if(digest(bytes)!==entry.sha256)throw Error('Actual application '+key+' digest mismatch');return JSON.parse(bytes);};
 const app=read('app','electron-sandbox-attestation.json'),consumer=read('consumer','electron-app-attestation-consumer.json');
 if(app.format!==1||app.proofKind!=='actual-application-main-frame'||app.mainFrameAttestation!==true||app.coreSha!==coreSha||app.demoSha!==demoSha||consumer.ok!==true||consumer.proofKind!=='consumed-actual-application-main-frame'||consumer.coreSha!==coreSha||consumer.demoSha!==demoSha)throw Error('Actual application raw identity/main-frame mismatch');
 const generated=Date.parse(app.generatedAt);if(!Number.isFinite(generated)||generated>now+1000||now-generated>3600000||startedAt&&generated<Date.parse(startedAt)||consumer.generatedAt!==app.generatedAt)throw Error('Stale actual application raw evidence');
 if(!Number.isInteger(app.applicationUid)||app.applicationUid<=0||!Number.isInteger(app.rendererPid)||app.rendererPid<=0||app.rendererSeccomp!=='2'||app.sandboxed!==true||app.contextIsolated!==true||app.nodeIntegration!==false||app.sandboxPreference!==true||!app.preloadPath?.endsWith('/products/xtend-llm/src/main/preload.cjs')||app.runtimeIdentity?.attestationMode!=='mandatory-ci')throw Error('Actual application raw sandbox/preload proof failed');
 const zip='edcfae0a8cf2a75ceee8a9842a0117521283164708b193495f4cb60ab2d6aa0d',dist='/usr/lib/xtend-electron/42.10.0/'+zip+'/dist',identity=app.runtimeIdentity;
 if(identity.electronVersion!=='42.10.0'||identity.executable!==dist+'/electron'||identity.helper!==dist+'/chrome-sandbox'||identity.executableSha256!=='0636c96f07de2c74a3eaf8692fc1743d81259c0bf66c8ebde7f7179211a8aff9'||identity.helperSha256!=='2015304df43beff0b74409cdc4d858107efcde650d9bc8afb1288041d62cec4b'||identity.helperUid!==0||identity.helperGid!==0||identity.helperMode!==0o4755)throw Error('Actual application raw official-helper identity mismatch');
 if(consumer.reportSha256!==binding.app.sha256||!/^[a-f0-9]{64}$/.test(binding.provisioningReceiptSha256||'')||consumer.provisioningReceiptSha256!==binding.provisioningReceiptSha256)throw Error('Actual application raw consumer cross-binding mismatch');
 for(const hashes of [binding.sourceHashes,consumer.sourceHashes,app.sources])if(!hashes||!same(Object.keys(hashes).sort(),appSourcePaths.slice().sort()))throw Error('Actual application raw exact source set mismatch');
 for(const source of appSourcePaths)if(!/^[a-f0-9]{64}$/.test(binding.sourceHashes[source]||'')||consumer.sourceHashes[source]!==binding.sourceHashes[source]||app.sources[source]!==binding.sourceHashes[source])throw Error('Actual application raw source identity mismatch: '+source);
 return true;
}
// Transfer the existing digest-bound raw reports; never generate or refresh them.
function copyActualAppFiles(reports,{directory,destination,coreSha,demoSha,startedAt,now=Date.now()}={}) {
 const report=reports?.find(item=>item.id==='electron-actual-app-attestation');
 if(!report)throw Error('Missing actual application report for transfer');
 verifyReportFiles([report],{directory,coreSha,demoSha,startedAt,now});
 const binding=JSON.parse(fs.readFileSync(path.join(directory,report.file))).attestation;
 const files=['electron-sandbox-attestation.json','electron-app-attestation-consumer.json'];
 const bytes=files.map((file,index)=>{
  const target=path.join(fs.realpathSync(directory),file);
  if(!fs.lstatSync(target).isFile()||fs.realpathSync(target)!==target)throw Error('Invalid actual application transfer file');
  const value=fs.readFileSync(target),expected=binding[index===0?'app':'consumer'];
  if(expected.file!==file||digest(value)!==expected.sha256)throw Error('Actual application transfer digest mismatch');
  return value;
 });
 const targetRoot=fs.realpathSync(destination);
 for(const file of files)if(fs.existsSync(path.join(targetRoot,file)))throw Error('Actual application transfer destination already exists');
 for(const [index,file] of files.entries())fs.writeFileSync(path.join(targetRoot,file),bytes[index],{flag:'wx'});
 verifyActualAppFiles(binding,{directory:targetRoot,coreSha,demoSha,startedAt,now});
 return true;
}
function verifyReportFiles(reports,{directory,coreSha,demoSha,manifest,startedAt,now=Date.now(),ownershipContract}={}) {
 for(const report of reports) {
  if(report.file!=='reports/'+report.id+'.json'||!/^[a-z0-9-]+$/.test(report.id))throw Error('Invalid report path');
  const bytes=fs.readFileSync(path.join(directory,report.file));if(digest(bytes)!==report.sha256)throw Error('Report digest mismatch');
  if(report.id==='schema-ownership-103'){require('../tools/schema-inventory/index.cjs').verifyMigrationOwnershipEvidence(report,{directory,coreSha,demoSha,manifest,startedAt,now,ownershipContract});continue;}
  const result=JSON.parse(bytes);if(result.schema!=='xtend.product-suite-result.v1'||result.id!==report.id||result.coreSha!==coreSha||result.demoSha!==demoSha||result.status!=='passed'||result.exitCode!==0||result.skips?.length||result.failures?.length)throw Error('Required report outcome/identity mismatch');
  if(report.id==='electron-actual-app-attestation')verifyActualAppFiles(result.attestation,{directory,coreSha,demoSha,startedAt,now});
 }
 return true;
}
function verifyInstallationEnvelope(receipt,{coreSha,demoSha}={}) {
 if(!/^[a-f0-9]{40}$/.test(coreSha||'')||!/^[a-f0-9]{40}$/.test(demoSha||'')
  ||!receipt||typeof receipt!=='object'||Array.isArray(receipt)||receipt.schema!=='xtend.product-candidate-installation.v1'
  ||receipt.ok!==true||receipt.coreSha!==coreSha||receipt.demoSha!==demoSha)throw Error('Installation outer schema/outcome/source mismatch');
 if(!Array.isArray(receipt.results))throw Error('Missing installation results');
 return receipt.results;
}
function verifyInstallationFiles(installation,{directory,manifest}={}) {
 const expected=['.','products/maraca-app-services-test-bench','products/resumability-maraca-erp-demo','products/rmt-animation-testbench','products/rmt-maraca-kernel-orchestration','products/xtend-llm','products/xtend-material-workbench','products/xtend-shop'];
 if(!Array.isArray(installation)||installation.length!==expected.length||new Set(installation.map(i=>i.product)).size!==expected.length||installation.some(i=>!expected.includes(i.product)))throw Error('Incomplete installation product set');
 for(const item of installation) {
  const filename='locks/'+(item.product==='.'?'root':item.product.split('/').at(-1))+'.json';
  if(item.file!==filename||item.status!=='passed')throw Error('Invalid installation lock identity');
  const bytes=fs.readFileSync(path.join(directory,filename));if(digest(bytes)!==item.lockSha256)throw Error('Installation lock digest mismatch');
  verifyInstalledClosure(JSON.parse(bytes),manifest);
 }
 return true;
}
if(require.main===module) {
 try {
  const root=path.resolve(__dirname,'..'),directory=path.join(root,'.xtend-test-results/product-candidates'),pin=require('../product-demos.lock.json');
  const coreSha=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  require('../tools/schema-inventory/source-provider.cjs').verifyProductDemoPin(pin);
  const evidence=JSON.parse(fs.readFileSync(process.argv[2]||path.join(root,'.xtend-test-results/product-candidate.json')));
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'))),installation=verifyInstallationEnvelope(JSON.parse(fs.readFileSync(path.join(directory,'installation.json'))),{coreSha,demoSha:pin.demoSha}),reports=JSON.parse(fs.readFileSync(path.join(directory,'reports.json')));
  verifyCandidates(manifest,{coreSha,demoSha:pin.demoSha,directory});
  verifyReportFiles(reports,{directory,coreSha,demoSha:pin.demoSha,manifest,ownershipContract:pin.ownershipContract});
  verifyInstallationFiles(installation,{directory,manifest});
  verifyEvidence(evidence,{coreSha,demoSha:pin.demoSha,packages:manifest.packages,php:manifest.php,installation,reports});
  console.log(JSON.stringify({schema:'xtend.product-candidate-verification.v1',ok:true,coreSha,demoSha:pin.demoSha,manifestSha256:digest(fs.readFileSync(path.join(directory,'manifest.json'))),evidenceSha256:digest(fs.readFileSync(process.argv[2]||path.join(root,'.xtend-test-results/product-candidate.json')))}));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={schema,required,verifyEvidence,verifyReportFiles,verifyInstallationFiles,verifyInstallationEnvelope,copyActualAppFiles};

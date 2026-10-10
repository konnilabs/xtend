'use strict';
const fs=require('node:fs'),path=require('node:path');
const {verifyCandidates,verifyInstalledClosure,digest}=require('../candidate-integrity.cjs');
const schema='xtend.product-candidate-evidence.v1';
const required=['http-security','product-xss','product-builds','product-owned-suites','shop-php','shop-browser','shop-browser-fpm','electron-runtime','electron-shell-import-worker','llm-contracts','erp-resumability-catfood','maraca-app-services-test-bench','xtend-llm-app-services-catfood','xtend-material-catfooding','xtend-shop-php','xtend-shop-browser','xtend-shop-contracts','schema-ownership-100'];
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
function verifyReportFiles(reports,{directory,coreSha,demoSha,manifest,startedAt,now}={}) {
 for(const report of reports) {
  if(report.file!=='reports/'+report.id+'.json'||!/^[a-z0-9-]+$/.test(report.id))throw Error('Invalid report path');
  const bytes=fs.readFileSync(path.join(directory,report.file));if(digest(bytes)!==report.sha256)throw Error('Report digest mismatch');
  if(report.id==='schema-ownership-100'){require('../tools/schema-inventory/index.cjs').verifyOwnershipEvidence(report,{directory,coreSha,demoSha,manifest,startedAt,now});continue;}
  const result=JSON.parse(bytes);if(result.schema!=='xtend.product-suite-result.v1'||result.id!==report.id||result.coreSha!==coreSha||result.demoSha!==demoSha||result.status!=='passed'||result.exitCode!==0||result.skips?.length||result.failures?.length)throw Error('Required report outcome/identity mismatch');
 }
 return true;
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
  const evidence=JSON.parse(fs.readFileSync(process.argv[2]||path.join(root,'.xtend-test-results/product-candidate.json')));
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'))),installation=JSON.parse(fs.readFileSync(path.join(directory,'installation.json'))).results,reports=JSON.parse(fs.readFileSync(path.join(directory,'reports.json')));
  verifyCandidates(manifest,{coreSha,demoSha:pin.demoSha,directory});
  verifyReportFiles(reports,{directory,coreSha,demoSha:pin.demoSha,manifest});
  verifyInstallationFiles(installation,{directory,manifest});
  verifyEvidence(evidence,{coreSha,demoSha:pin.demoSha,packages:manifest.packages,php:manifest.php,installation,reports});
  console.log(JSON.stringify({schema:'xtend.product-candidate-verification.v1',ok:true,coreSha,demoSha:pin.demoSha,manifestSha256:digest(fs.readFileSync(path.join(directory,'manifest.json'))),evidenceSha256:digest(fs.readFileSync(process.argv[2]||path.join(root,'.xtend-test-results/product-candidate.json')))}));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={schema,required,verifyEvidence,verifyReportFiles,verifyInstallationFiles};

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {candidateFixture,preparedFixture}=require('./core-fixture.cjs'),{write}=require('./fixtures.cjs');
const artifact=require('../../scripts/release/artifact.cjs'),candidates=require('../../scripts/release/candidates.cjs');
const profile=require('../../scripts/release/profile.cjs'),evidence=require('../../scripts/release/release-evidence.cjs');
const consumer=require('../../scripts/release/core-evidence.cjs'),integrity=require('../../candidate-integrity.cjs');
for(const selection of [undefined,{groups:['mcp']},{groups:['material']}])test('Core adapter verifies unchanged candidate bytes with scope '+JSON.stringify(selection),async t=>{
 const f=await preparedFixture(t,{selection}),bytes=fs.readFileSync(path.join(f.directory,'manifest.json')),a=await f.verify();
 assert.equal(a.manifest.schema,profile.ARTIFACT);assert.equal(a.manifest.profile,profile.PROFILE);
 assert.equal(fs.existsSync(path.join(f.f.rootDir,'product-demos.lock.json')),false);
 assert.equal(a.manifest.candidateBinding.allPackages.length,10);await candidates.verifyCandidateBinding(a,{directory:f.directory,rootDir:f.f.rootDir});
 assert.deepEqual(fs.readFileSync(path.join(f.directory,'manifest.json')),bytes);
 assert.equal((await artifact.assertPreflightArtifact(a)).phase,'prepared');
});
for(const location of ['candidate','artifact','canary'])for(const field of ['demoSha','demoRepository','productEvidence','unionEvidence'])test('Core rejects '+location+' with foreign '+field,async t=>{
 const f=await preparedFixture(t);await f.verify();
 if(location==='candidate'){const file=path.join(f.directory,'manifest.json'),d=JSON.parse(fs.readFileSync(file));d[field]='foreign';write(file,d);await assert.rejects(candidates.inspectCandidates(f.options),/Core contract/);}
 else {const d=location==='artifact'?f.manifest:f.canary;d[field]='foreign';f.sync();await assert.rejects(f.verify(),/Core contract/);}
});
for(const field of ['schema','profile','coreSha','development','sha256','missing-package','metadata'])test('Core candidate mutation rejects '+field,async t=>{
 const f=await candidateFixture(t);await candidates.inspectCandidates(f.options);
 if(field==='schema')f.manifest.schema=['xtend','product-candidates','v1'].join('.');
 if(field==='profile')delete f.manifest.profile;
 if(field==='coreSha')f.manifest.coreSha='f'.repeat(40);
 if(field==='development')f.manifest.development=true;
 if(field==='sha256')f.manifest.packages[0].sha256='0'.repeat(64);
 if(field==='missing-package')f.manifest.packages.pop();
 if(field==='metadata')f.manifest.packages.find(p=>p.name==='@ccslabs/xtend-mcp').dependencies={};
 write(path.join(f.directory,'manifest.json'),f.manifest);await assert.rejects(candidates.inspectCandidates(f.options));
});
for(const field of ['missing-commands','wrong-order','raw-instead-of-compact','missing-prepared','future-prepared','false-canary','missing-sha256','wrong-binding','legacy-canary'])test('Core prepared contract rejects '+field,async t=>{
 const f=await preparedFixture(t);await f.verify();
 if(field==='missing-commands')delete f.build.commands;
 if(field==='wrong-order')f.build.commands.reverse();
 if(field==='raw-instead-of-compact')f.canary.buildEvidenceIntegrity=artifact.digest(fs.readFileSync(path.join(f.directory,'build.json')));
 if(field==='missing-prepared')delete f.manifest.preparedAt;
 if(field==='future-prepared')f.manifest.preparedAt=new Date(Date.now()+3600000).toISOString();
 if(field==='false-canary')f.canary.ok=false;
 if(field==='missing-sha256')delete f.manifest.packages[0].sha256;
 if(field==='wrong-binding')f.manifest.candidateBinding.allPackages[0].sha256='0'.repeat(64);
 if(field==='legacy-canary'){f.canary.schema=['xtend','release','canary','v1'].join('.');delete f.canary.profile;}
 f.sync();await assert.rejects(f.verify());
});
test('Core preparation permits a separate consumer phase but cannot self-declare a seal',async t=>{
 const f=await preparedFixture(t);delete f.manifest.canary;delete f.manifest.preparedAt;
 write(path.join(f.directory,'release-manifest.json'),f.manifest);await f.verify({phase:'adapted',requireCanary:false});
 f.manifest.preparedAt=new Date().toISOString();write(path.join(f.directory,'release-manifest.json'),f.manifest);
 await f.verify({phase:'prepared',requireCanary:false});await assert.rejects(f.verify(),/bound canary/);
 await assert.rejects(f.verify({phase:'sealed'}),/Sealed artifact phase/);
});
test('real Core publisher stops before registry for pending source and independent FirstRelease',async t=>{
 const f=await preparedFixture(t),a=await f.verify();let calls=0;const forbidden=()=>{calls++;throw Error('No registry or upload permitted');};
 const publish=require('../../scripts/release/publish.cjs').publishRelease;
 // This miniature fixture deliberately has no source proof; do not inherit the CI checkout's transport.
 const sourceKeys=['XTEND_CORE_ARCHIVE','XTEND_CORE_EXPECTED'],saved=sourceKeys.map(key=>[key,process.env[key]]);
 try {
  for(const key of sourceKeys)delete process.env[key];
 await assert.rejects(publish({artifact:a,ledgerFile:f.f.ledgerFile,registry:{version:forbidden,package:forbidden},publisher:{publish:forbidden}}),/Core source|XTEND_CORE|authenticated/i);
 } finally {for(const [key,value] of saved){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
 await assert.rejects(publish({artifact:a,ledgerFile:f.f.ledgerFile,publish:true,registry:{version:forbidden,package:forbidden},publisher:{publish:forbidden}}),/source-level initial-authority retirement/);
 assert.equal(calls,0);assert.equal(fs.existsSync(path.join(path.dirname(f.f.ledgerFile),'npm-release.lock')),false);
});
const {installedProof}=require('./contract-proof-fixture.cjs');
for(const node of profile.lanes)test('real Core consumer validator accepts both complete controlled closures for '+node,async t=>{
 const f=await preparedFixture(t,{selection:{groups:['mcp']}}),a=await f.verify(),original=JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),p=installedProof(a,original,node);
 consumer.verifyConsumer(p.report,p.selectedLock,{artifact:a,node,now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock});
});
for(const field of ['runtime','legacy','source','stale','future','lock','sdk-lock','resolution','sdk-coverage','package-check','sdk-knowledge','registry-closure'])test('Core consumer verifier rejects controlled '+field,async t=>{
 const f=await preparedFixture(t,{selection:{groups:['mcp']}}),a=await f.verify(),original=JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),node=profile.lanes[0],p=installedProof(a,original,node),options={artifact:a,node,now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock};consumer.verifyConsumer(p.report,p.selectedLock,options);
 if(field==='runtime')p.report.runtime.node='other';if(field==='legacy')p.report.demoSha='d'.repeat(40);if(field==='source')p.report.sourceSha='e'.repeat(40);
 if(field==='stale')p.report.finishedAt=new Date(Date.now()-7200000).toISOString();if(field==='future')p.report.finishedAt=new Date(Date.now()+7200000).toISOString();
 if(field==='lock')p.selectedLock.packages[''].dependencies={};if(field==='sdk-lock')p.sdkLock.packages[''].dependencies={};if(field==='resolution')p.report.resolution=false;
 if(field==='sdk-coverage')p.report.candidateSDK.packages.pop();if(field==='package-check')p.report.packages[0].types=false;if(field==='sdk-knowledge')p.report.candidateSDK.mcpKnowledgeChecked=false;if(field==='registry-closure')p.report.registryDependencies.pop();
 assert.throws(()=>consumer.verifyConsumer(p.report,p.selectedLock,options));
});
test('historical v1 reference and current shared generic verifier preserve exact v1 bytes; Core rejects relabeling',async t=>{
 const f=await require('./legacy-runtime.cjs').load('tests/release/fixtures.cjs').packedFixture(t);
 assert.equal(f.manifest.schema,['xtend','release','artifact','v1'].join('.'));assert.ok(!Object.hasOwn(f.manifest,'profile'));
 const bytes=fs.readFileSync(path.join(f.artifactDir,'release-manifest.json'));await f.verify();assert.deepEqual(fs.readFileSync(path.join(f.artifactDir,'release-manifest.json')),bytes);
 await assert.rejects(artifact.verifyArtifact({directory:f.artifactDir,manifestIntegrity:f.integrity(),sourceSha:f.sourceSha,rootDir:f.rootDir,phase:'primitive'}),/Core contract/);
});

test('real authenticated security verifier rejects unavailable coverage even with a green job and forged passing outer statuses',async t=>{
 // A miniature Git-object transport supplies a genuinely branded provider. No
 // verifier is stubbed, and these controlled bytes are not browser execution.
 const os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
 const security=require('../../scripts/release/core-security.cjs'),catalog=require('../../scripts/test-runner/catalog');
 const repo=path.resolve(__dirname,'../..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'core-browser-policy-contract-'));
 t.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));
 const source=path.join(temporary,'repo');fs.mkdirSync(source);
 const files=new Set([...Object.keys(security.sourceHashes(repo)),'scripts/build-core-source-artifact.py','scripts/release/core-projection-policy.json',
  ...['catalog.json','catalog.js','handlers.js','executor.js','worker.js','cli.js','imported-ci.js','nightly.js','nightly-evidence.js',
   'capabilities.js','../create_xtend_nightly_manifest.js','../verify_ci_dependency_locks.js'].map(file=>path.posix.normalize('scripts/test-runner/'+file))]);
 for(const file of files){fs.mkdirSync(path.dirname(path.join(source,file)),{recursive:true});fs.copyFileSync(path.join(repo,file),path.join(source,file));}
 const git=args=>execFileSync('git',args,{cwd:source,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
 git(['init','-q']);git(['add','.']);git(['-c','user.name=Controlled fixture','-c','user.email=fixture@invalid','commit','-qm','Controlled verifier fixture']);
 const sha=git(['rev-parse','HEAD']),transport=path.join(temporary,'transport');
 const expected=JSON.parse(execFileSync('python3',[path.join(repo,'scripts/build-core-source-artifact.py'),'--core',source,'--core-sha',sha,
  '--output',transport,'--run-id','442','--run-attempt','1'],{encoding:'utf8'}));
 const provider=require('../../tools/schema-inventory/source-provider.cjs').createCoreReleaseProvider({archive:path.join(transport,'sources.tar.gz'),
  destination:path.join(temporary,'verified'),expected});
 const now=Date.now(),start=new Date(now-500).toISOString(),end=new Date(now).toISOString(),pin=require('../security/sandboxed-browser.cjs').pin;
 const browser={binary:'/verified/chrome',sha256:'b'.repeat(64),version:pin.version,archiveSha256:pin.archives['chrome-linux64.zip'],uid:1001,gid:1001};
 const proof={browser,browserPid:200,sanitizerTrustedTypes:'passed',argv:require('../security/sandboxed-browser.cjs').browserArguments('/private/profile'),
  sandboxRows:['PID namespaces','Network namespaces','Seccomp-BPF sandbox'].map(name=>[name,'Yes']),browserNamespaces:{pid:'pid:[1]',net:'net:[1]'},
  renderers:[{pid:201,uids:[1001,1001,1001,1001],gids:[1001,1001,1001,1001],capEff:'0',noNewPrivs:'1',seccomp:'2',namespaces:{pid:'pid:[2]',net:'net:[2]'}}]};
 const report={command:['node','--test','--test-reporter=tap','tests/security/browser.test.mjs'],node:security.node,startedAt:start,finishedAt:end,
  sourceHashes:security.sourceHashes(repo),exitCode:0,signal:null,abortCause:null,cleanupError:null,
  cleanup:{complete:true,childReaped:true,groupGone:true,remaining:[],group:100,leaderStart:'100',signals:[],termMs:2000,killMs:2000},
  stdout:'# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n',
  browserGate:{status:'passed',preflight:{status:'passed'},product:{status:'passed'},cleanup:{status:'passed'},preflightProof:{browser,browserPid:200}},browserProof:proof};
 const result={id:security.id,status:'passed',exitCode:0,failureCount:0,failures:[],skipCount:0,skips:[],report};
 const entry={id:security.id,executionId:security.id,startedAt:start,completedAt:end,result};
 const execution={schema:require('../../scripts/test-runner/executor').SCHEMA,profile:security.id,complete:true,status:'passed',executionId:'controlled',
  commit:sha,sourceFingerprint:crypto.createHash('sha256').update('').digest('hex'),catalogFingerprint:catalog.fingerprint(),run:'442:1',
  runtime:{node:'v'+security.node,platform:'linux',arch:'x64'},expected:[security.id],results:[entry],executions:[entry],startedAt:start,completedAt:end};
 const options={artifact:{sourceSha:sha,manifest:{preparedAt:new Date(now-1000).toISOString()}},
  envelope:{context:{runId:'442',runAttempt:'1'},jobs:[{name:security.job,conclusion:'success'}]},provider,now};
 assert.equal(security.verifyCoreSecurityReport(execution,options),true,'complete controlled positive reaches the actual verifier');
 report.browserGate={status:'infrastructure-blocked',preflight:{status:'infrastructure-blocked'},product:{status:'not-run'},cleanup:{status:'passed'}};
 execution.status='failed';result.status='failed';result.exitCode=report.exitCode=1;
 assert.throws(()=>security.verifyCoreSecurityReport(execution,options),/source\/run\/attempt\/runtime/);
 execution.status=result.status='passed';result.exitCode=report.exitCode=0;
 assert.throws(()=>security.verifyCoreSecurityReport(execution,options),/Browser preflight, product assertions and cleanup evidence must all pass/);
});

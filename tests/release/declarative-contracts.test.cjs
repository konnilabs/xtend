'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {compile}=require('./declarative-contract-checker.cjs'),{candidateFixture,preparedFixture}=require('./core-fixture.cjs');
const {installedProof}=require('./contract-proof-fixture.cjs'),{write}=require('./fixtures.cjs');
const artifact=require('../../scripts/release/artifact.cjs'),candidates=require('../../scripts/release/candidates.cjs'),profile=require('../../scripts/release/profile.cjs');
const schemas=Object.fromEntries(['artifact-v2','canary-v2','core-evidence-v1'].map(name=>[name,JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../contracts/release/'+name+'.schema.json')))]));
const validators=Object.fromEntries(Object.entries(schemas).map(([name,schema])=>[name,compile(schema)]));
const accept=(name,value)=>assert.deepEqual(validators[name].errors(value),[]);
const reject=(name,value)=>assert.ok(validators[name].errors(value).length);
async function prepared(t){const f=await preparedFixture(t);f.manifest.toolchain.node='24.18.0';fs.writeFileSync(path.join(f.f.rootDir,'.nvmrc'),'24.18.0\n');f.canary.toolchain={...f.manifest.toolchain};f.canary.tarballSetIntegrity=artifact.releaseSetIntegrity(f.manifest);f.canary.buildEvidenceIntegrity=require('../../scripts/release/contracts.cjs').buildCanaryIntegrity(f.build);f.sync();return f;}
for(const [name,schema] of Object.entries(schemas))test('complete declaration resolves every supported keyword/reference: '+name,()=>{assert.equal(schema.$schema,'http://json-schema.org/draft-07/schema#');compile(schema);});
test('test-only checker fails closed for unsupported keywords and missing refs',()=>{assert.throws(()=>compile({format:'email'}),/Unsupported/);assert.throws(()=>compile({$ref:'#/definitions/absent'}),/Unresolved/);assert.throws(()=>compile({$ref:'https://invalid'}),/Unsupported/);});
test('test-only checker exercises each validation branch',()=>{
 const schema={definitions:{name:{type:'string',pattern:'^x$'}},type:'object',properties:{name:{$ref:'#/definitions/name'},n:{type:'integer',minimum:1,maximum:3},b:{const:true},a:{type:'array',items:{enum:[1,2]},minItems:1,maxItems:2,uniqueItems:true,contains:{const:2}},v:{oneOf:[{type:'null'},{type:'string'}]},w:{anyOf:[{const:1},{const:2}]}},required:['name','n','b','a','v','w'],additionalProperties:false,allOf:[{not:{required:['forbidden']}}]};
 const check=compile(schema),good={name:'x',n:2,b:true,a:[2],v:null,w:1};assert.deepEqual(check.errors(good),[]);
 for(const patch of [{name:'y'},{n:0},{n:4},{n:1.2},{b:false},{a:[]},{a:[1]},{a:[2,2]},{a:[1,2,2]},{a:[3]},{v:4},{w:3},{extra:1},{forbidden:true}])assert.ok(check.errors({...good,...patch}).length);
 const absent={...good};delete absent.name;assert.ok(check.errors(absent).length);assert.ok(compile({oneOf:[true,true]}).errors(1).length);assert.deepEqual(compile({additionalProperties:{type:'string'}}).errors({a:'x'}),[]);
});
test('actual adapter output and existing external artifact phases match complete contract',async t=>{
 const f=await candidateFixture(t);f.options.buildEvidence.toolchain.node='24.18.0';fs.writeFileSync(path.join(f.f.rootDir,'.nvmrc'),'24.18.0\n');
 const m=await candidates.adaptCandidates(f.options);accept('artifact-v2',m);assert.deepEqual(validators['artifact-v2'].phase('adapted',m),[]);
 const phase=require('../../scripts/release/contracts.cjs').verifyEnvelopePhase;phase(m,{phase:'adapted',requireCanary:false,packageCount:10});
 m.preparedAt=new Date().toISOString();accept('artifact-v2',m);phase(m,{phase:'prepared',requireCanary:false,packageCount:10});
 m.sealedAt=m.preparedAt;m.canary={file:'core-evidence/24.18.0/consumer.json',integrity:m.buildEvidence.integrity};m.coreEvidence={file:'core-evidence/index.json',integrity:m.buildEvidence.integrity};accept('artifact-v2',m);phase(m,{phase:'sealed',requireCanary:true,packageCount:10});
 // Phase structure alone is intentionally no authenticated seal.
 await assert.rejects(artifact.assertSealedArtifact({manifest:m}),/verified|source-level|artifact/i);
});
for(const key of ['candidateBinding','buildEvidence','bootstrapPackages','registryDependencies','preparedAt'])test('declaration and runtime reject missing prepared field '+key,async t=>{const f=await prepared(t);await f.verify();delete f.manifest[key];write(path.join(f.directory,'release-manifest.json'),f.manifest);reject('artifact-v2',f.manifest);await assert.rejects(f.verify());});
for(const field of ['demoSha','demoRepository','productEvidence','unionEvidence'])test('foreign security field rejected by declarations and Core runtime: '+field,async t=>{const f=await prepared(t);f.manifest[field]='foreign';f.sync();reject('artifact-v2',f.manifest);await assert.rejects(f.verify(),/Core contract/);for(const name of ['canary-v2','core-evidence-v1'])assert.equal(schemas[name].properties[field],false);});
test('existing prepared canary acceptance is deliberately weaker than producer/Seal contract',async t=>{const f=await prepared(t),a=await f.verify();reject('canary-v2',f.canary);assert.throws(()=>require('../../scripts/release/core-evidence.cjs').verifyConsumer(f.canary,{}, {artifact:a,node:profile.lanes[0],now:Date.now(),startedAt:f.manifest.preparedAt,directory:f.directory,candidateSDKLock:{}}));});
for(const node of profile.lanes)test('complete controlled installed proofs satisfy declaration and real Seal consumer guards '+node,async t=>{
 const f=await prepared(t),a=await f.verify(),original=JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),p=installedProof(a,original,node);p.report.error=null;accept('canary-v2',p.report);
 const check=()=>require('../../scripts/release/core-evidence.cjs').verifyConsumer(p.report,p.selectedLock,{artifact:a,node,now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock});check();
 // Unknown JSON extensions are ignored today, not a new authenticated assertion.
 p.report.security={arbitraryClaim:true};accept('canary-v2',p.report);check();delete p.report.security;
 for(const field of ['candidateSDK','lockIntegrity','runtime','resolution']){const value=p.report[field];delete p.report[field];reject('canary-v2',p.report);assert.throws(check);p.report[field]=value;}
 p.report.candidateSDK.packages.pop();reject('canary-v2',p.report);assert.throws(check);
});
test('real consumer producer persists complete SDK-failure phase without accepting it as a seal',async t=>{
 const f=await prepared(t),a=await f.verify(),out=path.join(f.directory,'failed-consumer.json');
 // Existing dependency seam: npm returns the real pinned version then a controlled
 // failed install. The actual producer catch/finally writes the failure report.
 const Module=require('node:module'),file=path.resolve(__dirname,'../../scripts/release/consumer.cjs'),m=new Module(file,module),real=Module.createRequire(file);m.filename=file;m.require=n=>n==='./npm.cjs'?{...real(n),runNpm:async(cli,args)=>args[0]==='--version'?{status:0,stdout:'11.17.0'}:{status:1,stdout:''}}:real(n);m._compile(fs.readFileSync(file,'utf8'),file);
 await assert.rejects(m.exports.runConsumers({artifact:a,rootDir:f.f.rootDir,npmCli:'test-only',outputFile:out,executeCanary:true,offline:true,registry:f.r.registry}),/consumer installation failed/);
 const report=JSON.parse(fs.readFileSync(out));accept('canary-v2',report);assert.deepEqual(validators['canary-v2'].phase('sdkFailed',report),[]);assert.equal(report.ok,false);
});
module.exports={schemas,validators,accept,reject,prepared};
test('real Core collector transport output matches complete envelope declaration and guarded replay',async t=>{
 const f=await prepared(t),p=await require('./core-envelope-contract-fixture.cjs').envelopeFixture(f);accept('core-evidence-v1',p.envelope);p.verify();assert.deepEqual(p.counts(),{sourceChecks:2,securityChecks:2});
 const actual=require('../../scripts/release/core-auth.cjs');assert.throws(()=>actual.verifyStoredAuthentication(p.envelope,{directory:f.directory,artifact:p.artifact}),/gzip|archive|artifact|tar|source/i);
 // Unknown JSON cannot gain security meaning just by appearing in a receipt.
 p.envelope.security.unrecognizedPrivilege={allowed:true};p.envelope.run.newGithubField={opaque:true};accept('core-evidence-v1',p.envelope);p.verify();
});
for(const key of ['security','security.node','security.job','security.archive','security.report','security.report.file','security.report.integrity','security.metadata','security.metadata.id','security.metadata.name','security.metadata.expired','security.metadata.digest','security.metadata.workflow_run','security.metadata.workflow_run.id','security.metadata.workflow_run.head_sha'])for(const mode of ['missing','wrong'])test('declaration and existing authentication reject '+mode+' '+key,async t=>{
 const f=await prepared(t),p=await require('./core-envelope-contract-fixture.cjs').envelopeFixture(f);p.verify();const changed=structuredClone(p.envelope),parts=key.split('.'),last=parts.pop(),parent=parts.reduce((v,k)=>v[k],changed);if(mode==='missing')delete parent[last];else parent[last]=typeof parent[last]==='object'?null:typeof parent[last]==='boolean'?true:'wrong';reject('core-evidence-v1',changed);assert.throws(()=>p.verify(changed));
});
for(const key of ['candidateSDKLock','lock','consumer','sourceReport'])test('both lanes require bound '+key+' independently',async t=>{const f=await prepared(t),p=await require('./core-envelope-contract-fixture.cjs').envelopeFixture(f);for(const i of [0,1]){const changed=structuredClone(p.envelope);delete changed.lanes[i][key];reject('core-evidence-v1',changed);assert.throws(()=>p.verify(changed));}});
for(const mutation of ['duplicate-lane','wrong-run','wrong-attempt','wrong-source','wrong-producer','wrong-security-output','additional-gate','extra-registry-security-field'])test('relational existing runtime guard: '+mutation,async t=>{
 const f=await prepared(t),p=await require('./core-envelope-contract-fixture.cjs').envelopeFixture(f),v=structuredClone(p.envelope);
 if(mutation==='duplicate-lane')v.lanes[1]=v.lanes[0];if(mutation==='wrong-run')v.run.id=442;if(mutation==='wrong-attempt')v.jobs[0].run_attempt=2;if(mutation==='wrong-source')v.source.expected.sourceSha='f'.repeat(40);if(mutation==='wrong-producer')v.source.provenance.producer.implementationSha256='f'.repeat(64);if(mutation==='wrong-security-output')v.needs['core-security-browser'].outputs['artifact-id']='905';if(mutation==='additional-gate')v.requiredGates.unbound='success';
 if(mutation==='extra-registry-security-field'){const schema=schemas['artifact-v2'].definitions.registry;assert.ok(compile(schema).errors({name:'test',version:'1',group:'core',integrity:p.artifact.manifest.buildEvidence.integrity,sourceSha:p.artifact.sourceSha,security:true}).length);return;}
 assert.throws(()=>p.verify(v));
});
test('actual offline miniature installs produce completed canary and both immutable locks',async t=>{
 const f=await prepared(t),a=await f.verify(),out=path.join(f.directory,'real-consumer.json');
 fs.symlinkSync(path.resolve(__dirname,'../../node_modules'),path.join(f.f.rootDir,'node_modules'),'dir');
 const mcp=path.join(f.f.rootDir,'products/xtend-mcp/scripts/build-knowledge.mjs');fs.mkdirSync(path.dirname(mcp),{recursive:true});fs.writeFileSync(mcp,'// Controlled miniature MCP package fixture: no production knowledge assertion.\n');
 const npmCli=process.env.XTEND_RELEASE_TEST_NPM_CLI;if(!npmCli)throw Error('Pinned test npm CLI required');
 const report=await require('../../scripts/release/consumer.cjs').runConsumers({artifact:a,rootDir:f.f.rootDir,npmCli,outputFile:out,executeCanary:true,offline:true,registry:f.r.registry});accept('canary-v2',report);assert.deepEqual(validators['canary-v2'].phase('completed',report),[]);
 require('../../scripts/release/core-evidence.cjs').verifyConsumer(report,JSON.parse(fs.readFileSync(path.join(f.directory,'consumer-lock.json'))),{artifact:a,node:process.versions.node,now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:JSON.parse(fs.readFileSync(path.join(f.directory,'candidate-sdk-lock.json')))});
});
test('actual consumer selected-failure phase retains completed SDK and no partial selected scope',async t=>{
 const f=await prepared(t),a=await f.verify(),out=path.join(f.directory,'selected-failed.json');fs.symlinkSync(path.resolve(__dirname,'../../node_modules'),path.join(f.f.rootDir,'node_modules'),'dir');const mcp=path.join(f.f.rootDir,'products/xtend-mcp/scripts/build-knowledge.mjs');fs.mkdirSync(path.dirname(mcp),{recursive:true});fs.writeFileSync(mcp,'// Controlled fixture knowledge script\n');
 const real=require('../../scripts/release/npm.cjs');let installs=0;const scoped=require('./core-envelope-contract-fixture.cjs').scoped('consumer.cjs',{'./npm.cjs':{...real,runNpm:async(...args)=>args[1][0]==='install'&&++installs===2?{status:1,stdout:''}:real.runNpm(...args)}});
 await assert.rejects(scoped.runConsumers({artifact:a,rootDir:f.f.rootDir,npmCli:process.env.XTEND_RELEASE_TEST_NPM_CLI,outputFile:out,executeCanary:true,offline:true,registry:f.r.registry}),/consumer installation failed/);const report=JSON.parse(fs.readFileSync(out));accept('canary-v2',report);assert.deepEqual(validators['canary-v2'].phase('selectedFailed',report),[]);assert.equal(report.candidateSDK.ok,true);assert.equal(report.packages.length,0);
});
test('extra registry security field is rejected by the actual artifact validator',async t=>{const f=await preparedFixture(t,{selection:{groups:['mcp']}});f.manifest.toolchain.node='24.18.0';fs.writeFileSync(path.join(f.f.rootDir,'.nvmrc'),'24.18.0\n');f.canary.toolchain={...f.manifest.toolchain};f.canary.tarballSetIntegrity=artifact.releaseSetIntegrity(f.manifest);f.canary.buildEvidenceIntegrity=require('../../scripts/release/contracts.cjs').buildCanaryIntegrity(f.build);f.sync();await f.verify();f.manifest.registryDependencies[0].security=true;f.sync();reject('artifact-v2',f.manifest);await assert.rejects(f.verify(),/Invalid pinned registry dependency/);});
test('documented canary producer/admission discrepancy remains unchanged',async t=>{const f=await prepared(t),a=await f.verify(),p=installedProof(a,JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),profile.lanes[0]);p.report.error='not inspected by this existing success validator';reject('canary-v2',p.report);require('../../scripts/release/core-evidence.cjs').verifyConsumer(p.report,p.selectedLock,{artifact:a,node:profile.lanes[0],now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock});});
test('Maraca permissive factory and early-blocked tune expose distinct existing phases',async()=>{
 const m=require('../../xtend-maraca/index.js'),config=m.createMaracaTuneConfig({});assert.equal(config.source,undefined);assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(config))).sort(),['configFingerprint','schema','serviceGraphFingerprint']);
 const blocked=await m.tuneMaracaBuild({sourceText:'',write:true,check:true},{rootDir:path.resolve(__dirname,'../..')});assert.equal(blocked.status,'blocked');assert.deepEqual(Object.keys(blocked).sort(),['candidates','configPath','diagnostics','ok','schema','status']);
});
test('source AST field inventory includes late assignments and all composed producer fields',()=>{
 const ts=require('typescript');
 function inspect(file,fn,variable){const source=ts.createSourceFile(file,fs.readFileSync(path.resolve(__dirname,'../../'+file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);let target,initial,late=[];const visit=n=>{if(ts.isFunctionDeclaration(n)&&n.name?.text===fn)target=n;ts.forEachChild(n,visit);};visit(source);assert.ok(target,fn);const fields=o=>o.properties.map(p=>ts.isSpreadAssignment(p)?'...'+p.expression.getText(source):p.name?.text).filter(Boolean);const scan=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(source)===variable&&n.initializer&&ts.isObjectLiteralExpression(n.initializer))initial=fields(n.initializer);if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isPropertyAccessExpression(n.left)&&n.left.expression.getText(source)===variable)late.push(n.left.name.text);ts.forEachChild(n,scan);};scan(target);return {initial,late};}
 const cases=[['scripts/release/candidates.cjs','adaptCandidates','manifest','artifact-v2'],['scripts/release/consumer.cjs','runConsumers','report','canary-v2'],['scripts/release/consumer.cjs','runInstalledScope','report','canary-v2'],['scripts/release/core-auth.cjs','collect','envelope','core-evidence-v1']];
 for(const [file,fn,variable,name] of cases){const found=inspect(file,fn,variable);assert.ok(found.initial.length);for(const key of [...found.initial,...found.late])assert.ok(Object.hasOwn(schemas[name].properties,key),file+': '+key);}
 // These fields are assigned by Object.assign, finally, pipeline sealing and
 // envelope assembly and were absent from the former initial-object snapshots.
 assert.deepEqual(inspect('scripts/release/consumer.cjs','runInstalledScope','report').late.sort(),['lockIntegrity','mcpKnowledgeChecked','mcpKnowledgeGenerated','ok','resolution','runtimeImports'].sort());
 assert.ok(inspect('scripts/release/core-auth.cjs','collect','envelope').late.includes('security'));
});
test('approved admission separation accounts for every producer root field and concrete validator',()=>{
 const phases=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../contracts/release/admission-phases.json')));assert.equal(phases.status,'proposal-only-not-finally-bound');assert.equal(phases.authorityBinding,null);assert.equal(phases.firstReleaseRetirement,false);assert.equal(phases.runtimeBehaviorChanged,false);assert.equal(phases.boundaries.length,7);
 for(const boundary of phases.boundaries){const schema=Object.values(schemas).find(s=>s.$id===boundary.contractId);assert.ok(schema);assert.deepEqual(Object.keys(boundary.fieldPolicies).sort(),Object.keys(schema.properties).sort());assert.equal(boundary.publicationAuthority,false);for(const field of ['demoSha','demoRepository','productEvidence','unionEvidence'])assert.equal(boundary.fieldPolicies[field].presence,'forbidden');for(const reference of boundary.entrypoints){const [file,symbol]=reference.split('#');assert.ok(fs.readFileSync(path.resolve(__dirname,'../../'+file),'utf8').includes('function '+symbol.split('(')[0]+'('),reference);}for(const [,fields] of boundary.predicates)for(const field of fields)assert.ok(boundary.fieldPolicies[field],field);}
});
test('prepared admission without canary keeps an uninspected malformed binding outside producer authority',async t=>{
 const f=await prepared(t);f.manifest.canary={file:0,integrity:null};write(path.join(f.directory,'release-manifest.json'),f.manifest);reject('artifact-v2',f.manifest);const a=await f.verify({phase:'prepared',requireCanary:false});await assert.rejects(artifact.assertPreflightArtifact(a),/verified prepared/);
});
test('seal admission retains existing missing-error acceptance independently of producer shape',async t=>{
 const f=await prepared(t),a=await f.verify(),p=installedProof(a,JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),profile.lanes[0]);assert.equal(Object.hasOwn(p.report,'error'),false);reject('canary-v2',p.report);require('../../scripts/release/core-evidence.cjs').verifyConsumer(p.report,p.selectedLock,{artifact:a,node:profile.lanes[0],now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock});
});
test('seal admission retains fresh noncanonical Date.parse formatting without widening producer output',async t=>{
 const f=await prepared(t),a=await f.verify(),p=installedProof(a,JSON.parse(fs.readFileSync(path.join(f.directory,'manifest.json'))),profile.lanes[0]);p.report.error=null;p.report.startedAt=p.report.startedAt.replace('T',' ');p.report.finishedAt=p.report.finishedAt.replace('T',' ');reject('canary-v2',p.report);require('../../scripts/release/core-evidence.cjs').verifyConsumer(p.report,p.selectedLock,{artifact:a,node:profile.lanes[0],now:Date.now(),startedAt:a.manifest.preparedAt,directory:f.directory,candidateSDKLock:p.sdkLock});
});

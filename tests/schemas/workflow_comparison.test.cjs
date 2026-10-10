'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const api=require('../../tools/schema-inventory/index.cjs');
const negativeResults=[];
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'workflow-comparison-'));
const archive=process.env.XTEND_UNION_ARCHIVE,expected=JSON.parse(fs.readFileSync(process.env.XTEND_UNION_EXPECTED));
let provider;
test.after(()=>{if(process.env.XTEND_COMPARISON_NEGATIVES)fs.writeFileSync(process.env.XTEND_COMPARISON_NEGATIVES,JSON.stringify(negativeResults,null,2)+'\n');fs.rmSync(directory,{recursive:true,force:true});});
test('both exact immutable workflow snapshots roundtrip only into comparison evidence',()=>{
 provider=api.createSourceProvider({archive,expected,destination:path.join(directory,'positive')});const rows=provider.comparisonEvidence();assert.equal(rows.length,2);
 for(const row of rows){assert.equal(crypto.createHash('sha256').update(row.bytes).digest('hex'),row.sha256);assert.equal(row.originalCoreSha,'31d8c01f92538b55e57e741ed4e71a4e4a6604b5');assert.ok(!provider.files().some(file=>file.logicalPath===row.memberPath));assert.equal(provider.hasCurrent(row.memberPath),false);assert.throws(()=>provider.readCurrent(row.memberPath),/Missing current source/);assert.ok(provider.hasCurrent(row.path));}
 for(const short of ['xtend-default-gates','xtend-nightly-build'])assert.equal(provider.hasCurrent('@demo/migration/source-'+short+'.yml.txt'),false);
 assert.equal(provider.provenance().historicalProductiveFiles,0);
});
for(const mutation of ['archive-tamper','archive-missing','unknown-archive','member-tamper','member-missing','member-extra','provenance'])test(mutation+' fails closed before materialization',()=>{
 const out=path.join(directory,mutation);const r=spawnSync('python3',[path.join(__dirname,'workflow_comparison_mutation.py'),archive,process.env.XTEND_UNION_EXPECTED,out,mutation],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 let implementation=require('../../tools/schema-inventory/source-provider.cjs');
 if(fs.existsSync(path.join(out,'test-policy.json'))){const copy=path.join(out,'module');fs.mkdirSync(copy);fs.copyFileSync(path.resolve(__dirname,'../../tools/schema-inventory/source-provider.cjs'),path.join(copy,'source-provider.cjs'));fs.copyFileSync(path.join(out,'test-policy.json'),path.join(copy,'source-bindings.json'));implementation=require(path.join(copy,'source-provider.cjs'));}
 const destination=path.join(out,'extracted');assert.throws(()=>implementation.createSourceProvider({archive:path.join(out,'sources.tar.gz'),expected:JSON.parse(fs.readFileSync(path.join(out,'expected.json'))),destination}),error=>{const pattern=mutation==='unknown-archive'?/Unknown workflow comparison archive/:mutation==='member-missing'||mutation==='member-extra'?/Unexpected workflow comparison member/:mutation==='member-tamper'||mutation==='provenance'?/Workflow comparison source provenance mismatch/:/Current source integrity mismatch/;assert.match(error.message,pattern);negativeResults.push({mutation,error:error.message,isolatedTrustInputsForMemberBoundary:fs.existsSync(path.join(out,'test-policy.json'))});return true;});assert.equal(fs.existsSync(destination),false);
});
test('package snapshot selected101 and active workflow/current-source boundaries survive',()=>{
 assert.equal(crypto.createHash('sha256').update(provider.readCurrent('@demo/migration/source-core-package-metadata.txt')).digest('hex'),'ecb00902c18961d35be2e1f56d13f1227a8d34a45d943a39c8d5dbdeb6a42e9c');
 const inventory=api.createExpectedInventory(provider);const material=inventory.entries.find(e=>e.schemaId===['xtend','material','catfooding-report','v1'].join('.'));assert.equal(material.canonicalDefinition.path,'@demo/migration/source-core-package-metadata.txt');
 for(const name of ['.github/workflows/xtend-default-gates.yml','.github/workflows/xtend-nightly-build.yml','tests/migration/nightly-command-contract.test.cjs'])assert.ok(provider.hasCurrent(name));
 const scanner=api.createScanner({typescript:require('typescript')}),scan=scanner.scanSchemaInventory({rootDir:directory,sourceProvider:provider});assert.ok(scan.files.includes('@demo/migration/source-core-package-metadata.txt'));assert.ok(!scan.files.some(p=>p.startsWith('evidence/workflow-comparison/')));assert.ok(scan.files.includes('.github/workflows/xtend-default-gates.yml'));assert.ok(scan.files.includes('@demo/package.json'));
 const validation=scanner.validateInventoryDocument(inventory,scan,{sourceProvider:provider});assert.equal(validation.valid,false);assert.ok(validation.errors.length>0);
 if(process.env.XTEND_COMPARISON_REPORT)fs.writeFileSync(process.env.XTEND_COMPARISON_REPORT,JSON.stringify({kind:'actual uncommitted proposal source fixture; NOT immutable committed producer or fresh installed101',productiveSource:provider.provenance(),validation,stats:scan.stats},null,2)+'\n');
});

test('missing live workflow cannot fall back to valid historical comparison bytes',()=>{
 const missing='.github/workflows/xtend-nightly-build.yml',out=path.join(directory,'missing-live-workflow');
 const command=spawnSync('python3',[path.join(__dirname,'workflow_comparison_mutation.py'),archive,process.env.XTEND_UNION_EXPECTED,out,'live-workflow-missing'],{encoding:'utf8'});assert.equal(command.status,0,command.stderr);
 const expectation=JSON.parse(fs.readFileSync(path.join(out,'expected.json'))),destination=path.join(out,'source');
 const actual=api.createSourceProvider({archive:path.join(out,'sources.tar.gz'),expected:expectation,destination});
 assert.equal(actual.hasCurrent(missing),false);assert.ok(!actual.files().some(row=>row.logicalPath===missing));assert.equal(fs.existsSync(path.join(destination,'current/core',missing)),false);
 let readError;assert.throws(()=>actual.readCurrent(missing),error=>{readError=error.message;assert.match(error.message,/Missing current source/);return true;});
 const evidence=actual.comparisonEvidence().find(row=>row.path===missing);assert.ok(evidence);assert.equal(evidence.sha256,'6426d6de5a31be5ea138eb8f265a075d267f5a8521c3c66b61400985e159b2ac');assert.equal(crypto.createHash('sha256').update(evidence.bytes).digest('hex'),evidence.sha256);
 assert.equal(actual.hasCurrent(evidence.memberPath),false);assert.throws(()=>actual.readCurrent(evidence.memberPath),/Missing current source/);
 const scanner=api.createScanner({typescript:require('typescript')}),observed=scanner.scanSchemaInventory({rootDir:destination,sourceProvider:actual}),inventory=api.createExpectedInventory(actual),validation=scanner.validateInventoryDocument(inventory,observed,{sourceProvider:actual});
 assert.ok(!observed.files.includes(missing));assert.ok(!observed.files.includes(evidence.memberPath));assert.equal(validation.valid,false);
 const missingDiagnostics=validation.errors.filter(row=>row.path===missing&&row.code==='missing-usage-path');assert.ok(missingDiagnostics.length>0,'Full strict validation must expose the actual absent live workflow, despite valid historical bytes');
 assert.deepEqual(actual.comparisonEvidence().find(row=>row.path===missing).bytes,evidence.bytes);
 if(process.env.XTEND_MISSING_LIVE_PROOF){const provenance=actual.provenance();fs.writeFileSync(process.env.XTEND_MISSING_LIVE_PROOF,JSON.stringify({kind:'controlled actual missing-current-source tree; synthetic test identities, NOT delivery commits',missingLivePath:missing,physicalCurrentFileExists:false,currentReadError:readError,historicalEvidence:{...evidence,bytes:evidence.bytes.toString('utf8')},sourceIdentity:{...provenance,bindings:undefined},currentTreeBindingsForMissingPath:provenance.bindings.filter(row=>row.logicalPath===missing),historicalBytesRemainReadableOnlyAsEvidence:true,observedFilesIncludeMissingLiveOrEvidence:false,strictValid:validation.valid,missingLiveDiagnostics:missingDiagnostics,allStrictErrors:validation.errors,stats:observed.stats},null,2)+'\n');}
});

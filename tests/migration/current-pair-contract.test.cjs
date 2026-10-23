'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),zlib=require('node:zlib');
const api=require('../../tools/schema-inventory/index.cjs'),contract=require('../../tools/schema-inventory/current-pair-contract.cjs');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ledgerBytes=zlib.gunzipSync(fs.readFileSync(path.join(root,'tools/schema-inventory/ownership-ledger.json.gz'))),ledger=JSON.parse(ledgerBytes),ids=require('../../tools/schema-inventory/selection.json');
const projection=contract.readProjection(root),transition=contract.assertDecision().transition;
const current=projection.entries.find(e=>e.schemaId===transition.schemaId).shapeFingerprints.find(f=>f.hash===transition.current.hash);
// Controlled validator models only. Live paired source/candidate proof is produced separately.
function fixture(){
 const core={entries:ids.map(id=>structuredClone(ledger.entries.find(e=>e.schemaId===id)))},demo=structuredClone(core);
 for(const scan of [core,demo]){const e=scan.entries.find(e=>e.schemaId===transition.schemaId);e.shapeFingerprints=e.shapeFingerprints.filter(f=>f.hash!==transition.historicalHash);}
 core.entries.find(e=>e.schemaId===transition.schemaId).shapeFingerprints.push(structuredClone(current));
 for(const o of [require('../../tools/schema-inventory/command-lexical-overlay.json'),...require('../../tools/schema-inventory/form-validation-lexical-overlay.json')])demo.entries.find(e=>e.schemaId===o.schemaId).shapeFingerprints.push(...structuredClone(o.variants));
 for(const row of contract.generatedMirrors().entries){for(const scan of [core,demo]){const e=scan.entries.find(e=>e.schemaId===row.schemaId);e.shapeFingerprints=e.shapeFingerprints.filter(f=>!row.historicalOnly.includes(f.hash));}demo.entries.find(e=>e.schemaId===row.schemaId).shapeFingerprints.push(...structuredClone(row.variants));}
 return {core,demo};
}
test('current 103 union has the approved partial transition; immutable history retains its original hash',()=>{
 const {core,demo}=fixture(),rows=api.verifyCurrentUnion(core,demo);assert.equal(rows.length,103);
 assert.equal(sha(ledgerBytes),contract.facts().historical.ledgerSha256);
 assert.ok(ledger.entries.find(e=>e.schemaId===transition.schemaId).shapeFingerprints.some(f=>f.hash===transition.historicalHash));
 assert.ok(!rows.find(r=>r.schemaId===transition.schemaId).hashes.includes(transition.historicalHash));
 assert.equal(current.authoritative,false);assert.equal(current.evidence[0].completeness,'partial');
 assert.throws(()=>api.verifyUnion(core,demo),/union mismatch/);
});
for(const kind of ['missing','extra','same-hash-shape','foreign-owner','foreign-source','foreign-symbol','complete-authority','historical-as-current','other-form-change'])test('current union rejects '+kind,()=>{
 const {core,demo}=fixture(),e=core.entries.find(e=>e.schemaId===transition.schemaId),f=e.shapeFingerprints.find(f=>f.hash===transition.current.hash);
 if(kind==='missing')e.shapeFingerprints=e.shapeFingerprints.filter(x=>x!==f);
 if(kind==='extra')e.shapeFingerprints.push({...f,hash:'sha256:'+'0'.repeat(64)});
 if(kind==='same-hash-shape')f.shape.normalized.fields.unapproved={optional:true,type:'string'};
 if(kind==='foreign-owner'){e.shapeFingerprints=e.shapeFingerprints.filter(x=>x!==f);demo.entries.find(e=>e.schemaId===transition.schemaId).shapeFingerprints.push(f);}
 if(kind==='foreign-source')f.sourcePaths=['other.d.ts'];
 if(kind==='foreign-symbol')f.symbols=['OtherReport'];
 if(kind==='complete-authority'){f.authoritative=true;f.evidence[0].completeness='complete';}
 if(kind==='historical-as-current')e.shapeFingerprints.push(structuredClone(ledger.entries.find(e=>e.schemaId===transition.schemaId).shapeFingerprints.find(f=>f.hash===transition.historicalHash)));
 if(kind==='other-form-change')core.entries.find(e=>e.schemaId!==transition.schemaId&&e.shapeFingerprints.length).shapeFingerprints[0].shape={unapproved:true};
 assert.throws(()=>api.verifyCurrentUnion(core,demo));
});
test('projection and source substitutions reject without changing historical or productive files',t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'current-pair-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const file=path.join(temp,contract.assertDecision().coreInventoryFile),source=path.join(temp,transition.sourcePath);
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.mkdirSync(path.dirname(source),{recursive:true});
 fs.copyFileSync(path.join(root,contract.assertDecision().coreInventoryFile),file);fs.copyFileSync(path.join(root,transition.sourcePath),source);
 assert.equal(contract.readProjection(temp).inventoryVersion,2);
 fs.appendFileSync(source,'\n');assert.throws(()=>contract.readProjection(temp),/transition source/);
 fs.copyFileSync(path.join(root,transition.sourcePath),source);fs.appendFileSync(file,'\n');assert.throws(()=>contract.readProjection(temp),/projection changed/);
});
function report(){
 const {core,demo}=fixture(),coreSha='a'.repeat(40),demoSha='b'.repeat(40),item={name:'@ccslabs/xtend',version:'0.8.0',sha256:'c'.repeat(64)};
 const rows=(scan,owner)=>scan.entries.map(e=>({schemaId:e.schemaId,owner,hashes:e.shapeFingerprints.map(f=>f.hash).sort(),authorities:(e.shapePolicy.authoritativeFingerprints||[]).slice().sort()}));
 return {manifest:{packages:[item]},value:{currentPair:contract.facts(),acceptedForMerge:false,acceptedForRelease:false,auditSource:{mode:'committed-core-source',coreSha},selection:ids,coreSha,demoSha,ledgerSha256:sha(ledgerBytes),packageVersion:item.version,packageSha256:item.sha256,core:rows(core,'core'),demo:rows(demo,'demo'),union:api.verifyCurrentUnion(core,demo),selectionOk:true,migrationComplete:false,remainingOwnershipDisposition:'not-established-by-this-103-id-contract',generatedAt:new Date().toISOString(),authorities:require('../../tools/schema-inventory/authority-bindings.json').map(b=>({...b,coreSha,packageSha256:item.sha256,packageVersion:item.version,importedSource:'imports/core/'+coreSha+'/'+b.oldSource}))}};
}
test('current evidence is explicit, digest-bound and cannot impersonate historical proof',t=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'current-evidence-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));const {manifest,value}=report(),bytes=JSON.stringify(value),binding={file:'schema-ownership-103.json',sha256:sha(bytes)},options={directory,coreSha:value.coreSha,demoSha:value.demoSha,manifest};fs.writeFileSync(path.join(directory,binding.file),bytes);
 assert.equal(api.verifyCurrentOwnershipEvidence(binding,options),true);assert.equal(api.verifyMigrationOwnershipEvidence(binding,options),true);assert.throws(()=>api.verifyOwnershipEvidence(binding,options),/historical conservation/);
 assert.equal(api.verifyMigrationOwnershipEvidence(binding,{...options,ownershipContract:'current-pair-v1'}),true);
 assert.throws(()=>api.verifyMigrationOwnershipEvidence(binding,{...options,ownershipContract:'foreign'}),/Pinned current ownership/);
 const historical=structuredClone(value);delete historical.currentPair;const oldBytes=JSON.stringify(historical);fs.writeFileSync(path.join(directory,binding.file),oldBytes);
 assert.throws(()=>api.verifyMigrationOwnershipEvidence({...binding,sha256:sha(oldBytes)},{...options,ownershipContract:'current-pair-v1'}),/Pinned current ownership/);
});
for(const kind of ['core-pin','demo-pin','candidate','digest','decision','approval','history','missing','duplicate','authority','owner','merge','release','disposition','stale','mode-confusion'])test('current evidence rejects '+kind,t=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'current-evidence-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));const {manifest,value}=report(),options={directory,coreSha:value.coreSha,demoSha:value.demoSha,manifest};
 if(kind==='core-pin')value.coreSha='d'.repeat(40);if(kind==='demo-pin')value.demoSha='d'.repeat(40);if(kind==='candidate')value.packageSha256='d'.repeat(64);
 if(kind==='decision')value.currentPair.decisionSha256='d'.repeat(64);if(kind==='approval')value.currentPair.transitions.push({unapproved:true});if(kind==='history')value.currentPair.historical.ledgerSha256='d'.repeat(64);
 if(kind==='missing')value.core.pop();if(kind==='duplicate')value.core[0].hashes.push(value.core[0].hashes[0]);if(kind==='authority')value.core.find(r=>r.authorities.length).authorities=[];if(kind==='owner')value.core[0].owner='demo';
 if(kind==='merge')value.acceptedForMerge=true;if(kind==='release')value.currentPair.acceptedForRelease=true;if(kind==='disposition')value.remainingOwnershipIds=0;if(kind==='stale')value.generatedAt='2000-01-01T00:00:00Z';if(kind==='mode-confusion')delete value.currentPair;
 const bytes=JSON.stringify(value),binding={file:'schema-ownership-103.json',sha256:kind==='digest'?'d'.repeat(64):sha(bytes)};fs.writeFileSync(path.join(directory,binding.file),bytes);assert.throws(()=>api.verifyCurrentOwnershipEvidence(binding,options));assert.throws(()=>api.verifyMigrationOwnershipEvidence(binding,options));
});

'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),test=require('node:test'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('actual npm-packed public API imports all 24 digest-bound authority sources and rejects package/pin mutations',t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'public-authority-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const pack=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--cache',path.join(temp,'cache'),'--pack-destination',temp],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}))[0];
 const owner=path.join(temp,'owner'),target=path.join(owner,'node_modules/@ccslabs/xtend');fs.mkdirSync(target,{recursive:true});execFileSync('tar',['-xzf',path.join(temp,pack.filename),'--strip-components=1','-C',target]);
 const bytes=fs.readFileSync(path.join(temp,pack.filename)),php=Buffer.from('CONTROLLED validation-only PHP placeholder, not runtime evidence');fs.writeFileSync(path.join(temp,'controlled.php.tar'),php);
 const coreSha='a'.repeat(40),demoSha='b'.repeat(40),manifest={schema:'xtend.product-candidates.v1',coreSha,demoSha,packages:[{name:'@ccslabs/xtend',version:pack.version,file:pack.filename,sha256:sha(bytes),integrity:'sha512-'+crypto.createHash('sha512').update(bytes).digest('base64')}],php:{file:'controlled.php.tar',sha256:sha(php),sources:{controlled:sha(php)}}};
 const api=require(path.join(target,'tools/schema-inventory/index.cjs')),options={manifest,coreSha,demoSha,ownerRoot:owner,directory:temp};const records=api.importAuthorities(options);assert.equal(records.length,24);for(const r of records)assert.equal(sha(fs.readFileSync(path.join(owner,r.importedSource))),r.sourceSha256);
 const imports=path.join(owner,'imports');fs.renameSync(imports,path.join(owner,'saved-imports'));fs.symlinkSync(temp,imports,'dir');assert.throws(()=>api.importAuthorities(options),/symlink rejected/);fs.unlinkSync(imports);fs.renameSync(path.join(owner,'saved-imports'),imports);
 const ledger=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync(path.join(target,'tools/schema-inventory/ownership-ledger.json.gz')))),ids=require(path.join(target,'tools/schema-inventory/selection.json'));
 const rows=ids.map(schemaId=>({schemaId,hashes:ledger.entries.find(e=>e.schemaId===schemaId).shapePolicy.acceptedFingerprints.slice().sort()}));
 // Controlled complete pass envelope; real import bytes above are separately checked.
 const good={selection:ids,coreSha,demoSha,packageSha256:manifest.packages[0].sha256,packageVersion:pack.version,ledgerSha256:'40a4e1d38dbf9e64a724d69178803768e6bff22c90c8260f5644916c24e127c8',selectionOk:true,migrationComplete:false,remainingOwnershipIds:24,generatedAt:new Date().toISOString(),core:rows,demo:rows,union:rows,authorities:records};
 const reportFile=path.join(temp,'schema-ownership-100.json'),expected={directory:temp,coreSha,demoSha,manifest,startedAt:new Date(Date.now()-1000).toISOString()};
 function binding(report){const bytes=Buffer.from(JSON.stringify(report));fs.writeFileSync(reportFile,bytes);return {file:'schema-ownership-100.json',sha256:sha(bytes)};}
 assert.equal(api.verifyOwnershipEvidence(binding(good),expected),true);
 for(const mutation of ['core-sha','demo-sha','package-digest','ledger','stale','union','missing-row','authority-source']){const bad=structuredClone(good);if(mutation==='core-sha')bad.coreSha='c'.repeat(40);if(mutation==='demo-sha')bad.demoSha='d'.repeat(40);if(mutation==='package-digest')bad.packageSha256='0'.repeat(64);if(mutation==='ledger')bad.ledgerSha256='0'.repeat(64);if(mutation==='stale')bad.generatedAt='2000-01-01T00:00:00Z';if(mutation==='union')bad.union[0].hashes=[];if(mutation==='missing-row')bad.core.pop();if(mutation==='authority-source')bad.authorities[0].sourceSha256='0'.repeat(64);assert.throws(()=>api.verifyOwnershipEvidence(binding(bad),expected),undefined,mutation);}
 const correct=binding(good);assert.throws(()=>api.verifyOwnershipEvidence({...correct,sha256:'0'.repeat(64)},expected),/digest mismatch/);fs.unlinkSync(reportFile);assert.throws(()=>api.verifyOwnershipEvidence(correct,expected));
 assert.throws(()=>api.verifyOwnershipEvidence(undefined,expected),/Missing required/);
 assert.throws(()=>api.importAuthorities({...options,coreSha:'c'.repeat(40)}),/SHA identity/);
 const bad=structuredClone(manifest);bad.packages[0].sha256='0'.repeat(64);assert.throws(()=>api.importAuthorities({...options,manifest:bad}),/digest mismatch/);
 assert.throws(()=>api.importAuthorities({...options,ownerRoot:temp}),/independent owner/);
 const helper=path.join(target,'tools/project-index/sources.js'),originalHelper=fs.readFileSync(helper);fs.appendFileSync(helper,'\n// changed discovery implementation\n');assert.throws(()=>api.importAuthorities(options),/differs from verified.*sources.js/);fs.writeFileSync(helper,originalHelper);
 fs.appendFileSync(path.join(target,'tools/schema-inventory/selection.json'),' ');assert.throws(()=>api.importAuthorities(options),/differs from verified/);
 fs.renameSync(path.join(temp,pack.filename),path.join(temp,'missing.tgz'));assert.throws(()=>api.importAuthorities(options),/Missing regular candidate/);
});

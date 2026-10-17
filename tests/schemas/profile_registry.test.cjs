'use strict';
// All trust-bearing tests use Git-object source captures. JSON review markers
// exist only in separately generated controlled fixtures, never production data.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const sources=require('../../tools/schema-inventory/source-provider.cjs');
const profiles=require('../../tools/schema-inventory/profile-registry.cjs');
const engine=require('../../tools/schema-inventory/engine.cjs').createLegacyScanner({typescript:require('typescript')});
assert.ok(process.env.XTEND_PROFILE_REGISTRY_FIXTURES,'Real Core/committed Union/proposal captures are mandatory');
const fixtures=JSON.parse(fs.readFileSync(process.env.XTEND_PROFILE_REGISTRY_FIXTURES));
const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'profile-registry-')));
test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
const providers=new Map();
function provider(name){if(!providers.has(name)){const f=fixtures[name];assert.ok(f,name);providers.set(name,sources[f.kind==='core'?'createCoreReleaseProvider':'createSourceProvider']({archive:f.archive,expected:JSON.parse(fs.readFileSync(f.receipt)),destination:path.join(temp,name)}));}return providers.get(name);}
function inventory(p){return JSON.parse(p.readCurrent('tests/schemas/core-release-inventory.json'));}
function family(d,id=profiles.FAMILIES[0]){return d.schemaFamilies.find(f=>f.familyId===id);}
function resolve(p,id,expected){const d=inventory(p);return profiles.resolveProfileCurrent(family(d,id),d.entries,p,expected);}
for(const name of ['core','legacy'])for(const id of profiles.FAMILIES)test(name+' selects exactly its own version for '+id,()=>{
 const selected=resolve(provider(name),id,name==='core'?profiles.CORE:profiles.LEGACY);assert.equal(selected.version,name==='core'?2:1);assert.equal(selected.schemaId,id+'.v'+selected.version);
});
for(const name of ['core','legacy'])test(name+' rejects opposite/unknown caller context and ignores mutable provenance copies',()=>{
 const p=provider(name),d=inventory(p),actual=sources.verifiedSourceProfile(p),opposite=actual===profiles.CORE?profiles.LEGACY:profiles.CORE;
 for(const context of [opposite,'unknown',null])assert.throws(()=>profiles.resolveProfileCurrent(family(d),d.entries,p,context),/contradicts/);
 const copy=p.provenance();copy.profile=opposite;assert.equal(sources.verifiedSourceProfile(p),actual);
});
test('missing, copied and forged providers cannot choose a context',()=>{
 const d=inventory(provider('core'));for(const p of [undefined,{}, {...provider('core')},{provenance:()=>({profile:profiles.CORE})}])assert.throws(()=>profiles.resolveProfileCurrent(family(d),d.entries,p),/Verified manifest/);
});
test('proposal Union transport never receives a committed profile capability',()=>assert.throws(()=>sources.verifiedSourceProfile(provider('proposal')),/Committed verified/));
test('real pending productive snapshot cannot resolve a reviewed version',()=>assert.throws(()=>resolve(provider('pending'),profiles.FAMILIES[0]),/pending/));
const mutations=[
 ['missing profile',f=>f.profileCurrents.pop()],['duplicate profile',f=>f.profileCurrents.push({...f.profileCurrents[0]})],
 ['unknown profile',f=>f.profileCurrents[0].profile='unknown'],['cross profile fallback',f=>f.profileCurrents[0].schemaId=f.profileCurrents[1].schemaId],
 ['wrong version',f=>f.profileCurrents[0].version=2],['global current',f=>f.currentVersion=2],['global ID',f=>f.activeSchemaId=f.profileCurrents[1].schemaId],
 ['extra family',f=>f.familyId='outside'],['changed release facts',f=>f.versions[0].releasedFingerprintSetHash='changed'],
 ['tombstone reuse',f=>f.tombstones.push({schemaId:f.profileCurrents[0].schemaId})],
 ['deprecated v1',(f,d)=>d.entries.find(e=>e.schemaId===f.profileCurrents[0].schemaId).lifecycle.status='deprecated'],
 ['replacement',(f,d)=>d.entries.find(e=>e.schemaId===f.profileCurrents[0].schemaId).replacedBy=f.profileCurrents[1].schemaId],
 ['outside alias',(f,d)=>d.entries.push({familyId:'outside',schemaId:'outside',aliasOf:f.profileCurrents[0].schemaId})]
];
for(const [name,mutate] of mutations)test('closed registry rejects '+name,()=>{const d=inventory(provider('core')),f=family(d);mutate(f,d);assert.throws(()=>profiles.resolveProfileCurrent(f,d.entries,provider('core')));});
test('even nonstructural caller edits cannot borrow the exact inventory binding',()=>{const d=inventory(provider('core'));d.entries.find(e=>e.familyId===profiles.FAMILIES[0]).description+=' injected';assert.throws(()=>profiles.resolveProfileCurrent(family(d),d.entries,provider('core')),/differs from authenticated/);});
for(const name of ['bad-decision-hash','bad-membership','bad-registry'])test('authenticated transport still rejects '+name,()=>assert.throws(()=>resolve(provider(name),profiles.FAMILIES[0]),/binding|membership|registration/));
test('generator uses the provider context and preserves closed mapping and historical facts',()=>{
 const p=provider('core'),d=inventory(p);const result=engine.buildSchemaFamilies(d.entries,d.schemaFamilies,p);
 for(const id of profiles.FAMILIES)assert.deepEqual(family({schemaFamilies:result},id),family(d,id));
 assert.throws(()=>engine.buildSchemaFamilies(d.entries,d.schemaFamilies),/Verified manifest/);
});
test('duplicate audit describes membership without inventing a current context',()=>{
 const d=inventory(provider('core')),audit=engine.auditDuplicateCandidates(d.entries,d.consolidations);
 for(const id of profiles.FAMILIES){const f=family({schemaFamilies:audit.versionFamilies},id);assert.ok(!Object.hasOwn(f,'currentVersion')&&!Object.hasOwn(f,'activeSchemaId')&&!Object.hasOwn(f,'profileCurrents'));}
});
test('acceptCurrentBaseline rejects before changing any profile family or global field',()=>{
 for(const removeMap of [false,true]){const d=inventory(provider('pending'));if(removeMap)for(const f of d.schemaFamilies)delete f.profileCurrents;const bytes=JSON.stringify(d);assert.throws(()=>engine.acceptCurrentBaseline(d),/profile/i);assert.equal(JSON.stringify(d),bytes);}
});
test('ordinary families retain global single-active validation',()=>{
 const p=provider('core'),d=inventory(p),scan=engine.scanSchemaInventory({sourceProvider:p});
 const f=d.schemaFamilies.find(f=>!profiles.FAMILIES.includes(f.familyId)&&f.versions.length>=2),members=d.entries.filter(e=>e.familyId===f.familyId);assert.ok(members.length>=2);
 for(const e of members)e.lifecycle.status='active';const v=engine.validateInventoryDocument(d,scan,{sourceProvider:p});assert.ok(v.errors.some(e=>e.code==='multiple-current-family-version'&&e.familyId===f.familyId));
});
test('complete Candidate authority registration passes only with real current Core source and active v1',()=>{
 const p=provider('core'),d=inventory(p),scan=engine.scanSchemaInventory({sourceProvider:p});
 const result=engine.assertCoreCandidateAuthority(d,scan,p);assert.equal(result.publicationGuardRetired,false);assert.equal(result.releasedFingerprintSetHash,null);
 assert.throws(()=>engine.assertCoreCandidateAuthority(d,scan,provider('legacy')),/same authenticated/);
 assert.throws(()=>engine.assertCandidateInitialAuthorityRetiredForRelease(),/source-level/);
});
test('post-verification source tampering invalidates context before resolution',()=>{
 const p=provider('core'),row=p.files().find(f=>f.path==='candidate-integrity.d.ts'),bytes=fs.readFileSync(row.absolutePath);
 try{fs.appendFileSync(row.absolutePath,'\n// changed');assert.throws(()=>resolve(p,profiles.FAMILIES[0]),/changed|mismatch/);}finally{fs.writeFileSync(row.absolutePath,bytes);}
 assert.equal(resolve(p,profiles.FAMILIES[0]).version,2);
});

'use strict';
// Closed repository-private registry. A payload or caller cannot select its trust
// context. Draft construction never grants the reviewed-resolution capability.
const crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const sources=require('./source-provider.cjs');
const CORE='xtend.npm.core-only.v1', LEGACY='legacy-paired-audit';
const FAMILIES=Object.freeze(['xtend.product-candidates','xtend.release.artifact','xtend.release.canary']);
const INVENTORY='tests/schemas/core-release-inventory.json';
const DECISION='development/core-release-authority-decision.json';
const POLICY='scripts/release/core-projection-policy.json';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error('Profile registry: '+message);};
const own=(value,key)=>Object.hasOwn(value,key);
function currents(familyId){
 check(FAMILIES.includes(familyId),'family is outside the closed registry');
 return [{profile:LEGACY,schemaId:familyId+'.v1',version:1},{profile:CORE,schemaId:familyId+'.v2',version:2}];
}
function mappings(){return FAMILIES.map(familyId=>({familyId,profileCurrents:currents(familyId)}));}
function sourceProfile(provider,expectedProfile){
 const profile=sources.verifiedSourceProfile(provider);
 check(profile===CORE||profile===LEGACY,'unknown verified context');
 if(expectedProfile!==undefined)check((expectedProfile===CORE||expectedProfile===LEGACY)&&expectedProfile===profile,'requested context contradicts verified provider');
 return profile;
}
function assertProfileFamily(family,entries){
 check(family&&FAMILIES.includes(family.familyId),'family is outside the closed registry');
 check(!own(family,'currentVersion')&&!own(family,'activeSchemaId'),'ambiguous global current fields');
 check(isDeepStrictEqual(family.profileCurrents,currents(family.familyId)),'exact unique Legacy-v1/Core-v2 mapping required');
 const members=entries.filter(e=>e.familyId===family.familyId).slice().sort((a,b)=>a.version-b.version);
 check(members.length===2&&members.every((e,i)=>e.schemaId===family.familyId+'.v'+(i+1)&&e.version===i+1&&
   e.lifecycle?.status==='active'&&e.aliasOf===null&&e.replacedBy===null&&!e.replacementDecision),'exact active unaliased versions required');
 check(!entries.some(e=>members.some(m=>e.aliasOf===m.schemaId)),'profile family aliases are forbidden');
 check(Array.isArray(family.tombstones)&&!family.tombstones.some(t=>members.some(e=>e.schemaId===t.schemaId)),'active profile version cannot be tombstoned');
 const expected=members.map(e=>({schemaId:e.schemaId,version:e.version,lifecycle:e.lifecycle,releasedFingerprintSetHash:e.releasedFingerprintSetHash}));
 check(isDeepStrictEqual(family.versions,expected),'profile version facts differ from entries');
 return members;
}
function buildProfileFamily(family,entries,provider){
 sourceProfile(provider);
 const result={...family,profileCurrents:currents(family.familyId)};
 delete result.currentVersion;delete result.activeSchemaId;
 assertProfileFamily(result,entries);
 return result; // Observed draft only; every productive resolution reauthenticates.
}
function assertReviewedProfileRegistry(provider){
 const profile=sourceProfile(provider),policyBytes=provider.readCurrent(POLICY),policy=JSON.parse(policyBytes);
 check(policy.status==='reviewed-core-owned-projection'&&policy.inventoryFile===INVENTORY,'exact registry/source approval pending');
 const decisionBytes=provider.readCurrent(DECISION),decision=JSON.parse(decisionBytes),inventoryBytes=provider.readCurrent(INVENTORY);
 check(/^[a-f0-9]{64}$/.test(policy.authorityDecisionSha256||'')&&hash(decisionBytes)===policy.authorityDecisionSha256,'decision bytes differ from reviewed binding');
 check(decision.format===1&&decision.profile===CORE&&decision.repository==='konnilabs/xtend'&&
   decision.status==='reviewed-core-owned-projection'&&decision.inventoryFile===INVENTORY&&
   /^[a-f0-9]{64}$/.test(policy.inventorySha256||'')&&decision.inventorySha256===policy.inventorySha256&&
   hash(inventoryBytes)===policy.inventorySha256,'inventory/decision identity mismatch');
 const files=provider.files(),corePaths=files.filter(row=>row.owner==='core').map(row=>row.logicalPath).sort();
 check(corePaths.length>0&&new Set(corePaths).size===corePaths.length&&
   files.filter(row=>row.owner==='core').every(row=>row.logicalPath===row.path)&&
   isDeepStrictEqual(policy.productivePaths,corePaths)&&decision.sourceMembershipSha256===hash(Buffer.from(JSON.stringify(corePaths))),
   'complete authenticated Core membership mismatch');
 check(isDeepStrictEqual(decision.profileRegistry,{format:1,status:'reviewed-exact-profile-registry',families:mappings()}),'exact three-family registration pending or changed');
 const inventory=JSON.parse(inventoryBytes),scoped=inventory.schemaFamilies.filter(f=>own(f,'profileCurrents'));
 check(scoped.length===3&&isDeepStrictEqual(scoped.map(f=>f.familyId).sort(),[...FAMILIES].sort()),'missing or extra profile family');
 for(const family of scoped)assertProfileFamily(family,inventory.entries);
 return {profile,inventory,decisionSha256:hash(decisionBytes)};
}
function resolveProfileCurrent(family,entries,provider,expectedProfile){
 sourceProfile(provider,expectedProfile);
 assertProfileFamily(family,entries);
 const reviewed=assertReviewedProfileRegistry(provider);
 const stored=reviewed.inventory.schemaFamilies.find(f=>f.familyId===family.familyId);
 const select=rows=>rows.filter(e=>e.familyId===family.familyId).slice().sort((a,b)=>a.version-b.version);
 check(isDeepStrictEqual(family,stored)&&isDeepStrictEqual(select(entries),select(reviewed.inventory.entries)),
   'caller family differs from authenticated reviewed inventory');
 const rows=family.profileCurrents.filter(row=>row.profile===reviewed.profile);
 check(rows.length===1,'exactly one version required in verified context');
 return Object.freeze({...rows[0],familyId:family.familyId,decisionSha256:reviewed.decisionSha256});
}
module.exports=Object.freeze({CORE,LEGACY,FAMILIES,currents,mappings,assertProfileFamily,buildProfileFamily,assertReviewedProfileRegistry,resolveProfileCurrent});

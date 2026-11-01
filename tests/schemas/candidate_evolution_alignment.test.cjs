// Maintained narrow alignment regression. Run: node --test tests/schemas/candidate_evolution_alignment.test.cjs
// Frozen registration controls are not provider observations or full-union acceptance.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),Module=require('node:module'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'../..'),suiteFile=path.join(__dirname,'schema_inventory_suite.js');
const source=fs.readFileSync(suiteFile,'utf8'),compiled=new Module(suiteFile,module);compiled.filename=suiteFile;compiled.paths=Module._nodeModulePaths(__dirname);
// Private visibility in the test's compiled copy only; actual module exports stay unchanged.
const returnStatement = 'return { runSchemaInventorySuite, printSchemaInventoryReport };';
assert.equal(source.split(returnStatement).length, 2, 'one private suite factory return');
compiled._compile(source.replace(returnStatement, 'return { runSchemaInventorySuite, printSchemaInventoryReport, __alignmentTest: {validateEntryEvolutionFields,validateSchemaFamilies,validateNegativeGateBehavior} };')+'\nmodule.exports.__alignmentTest=createSuite().__alignmentTest;\n',suiteFile);
const local=compiled.exports.__alignmentTest;
const scanner=require('../../tools/schema-inventory/index.cjs').createScanner({typescript:require('typescript')});
const id=['xtend','product-candidates','v1'].join('.');
const frozen=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'tests/migration/manifest-initial-authority/proposed-current-five-registration.json.gz'))));
const base=JSON.parse(fs.readFileSync(path.join(root,'tests/schemas/xtend-schema-inventory.json')));
const doc={...base,entries:[frozen.entry],schemaFamilies:[frozen.family],duplicateReviews:frozen.duplicateReviews};
const entry=value=>value.entries.find(e=>e.schemaId===id);
const historicalRoot=fs.mkdtempSync(path.join(os.tmpdir(),'historical-candidate-declaration-'));
test.after(()=>fs.rmSync(historicalRoot,{recursive:true,force:true}));
const historicalBytes=zlib.gunzipSync(fs.readFileSync(path.join(root,'tests/migration/manifest-initial-authority/historical-candidate-declaration.d.ts.gz')));
assert.equal(require('node:crypto').createHash('sha256').update(historicalBytes).digest('hex'),'4b096560d425afd3c16aba9353d9a974e9e12138a5512e9941a69fa608382c47');
fs.writeFileSync(path.join(historicalRoot,'candidate-integrity.d.ts'),historicalBytes);
const errors=(value=doc,rootDir=historicalRoot)=>scanner.validateInventoryDocument(value,frozen.observation,{rootDir});
const drift=validation=>validation.errors.filter(e=>e.code==='released-fingerprint-drift'&&e.schemaId===id);

test('frozen historical registration uses its exact original source-aware rule with null released hashes',()=>{
 const result=errors();assert.deepEqual(drift(result),[]);assert.deepEqual(local.validateEntryEvolutionFields(doc.entries,result),[]);
 assert.equal(entry(doc).releasedFingerprintSetHash,null);assert.equal(entry(doc).shapePolicy.releasedFingerprintSetHash,null);assert.equal(doc.schemaFamilies[0].versions[0].releasedFingerprintSetHash,null);
 assert.equal(result.valid,false,'Scoped frozen registration is not a full inventory/union acceptance');
});
test('missing public validation fails and this proposal adds no unsupported union integration',()=>{
 assert.ok(local.validateEntryEvolutionFields(doc.entries,null).length);assert.ok(local.validateEntryEvolutionFields(doc.entries,{}).length);
 assert.match(source,/validateEntryEvolutionFields\(entries, validation\)/);
 assert.match(source,/validation = validateInventoryDocument\(inventory, scan, \{ rootDir, \.\.\.\(sourceProvider \? \{ sourceProvider \} : \{\}\) \}\)/);
 assert.match(source,/if \(options\.sourceProvider \|\| options\.scan \|\| options\.inventory\) throw Error\('Branded Core schema context required'\)/);
 assert.doesNotMatch(source,/INITIAL_CANDIDATE_AUTHORITY|assertCandidateInitialAuthorityRetiredForRelease|reviewed-unreleased/);
});
for(const mutation of ['missing-review','wrong-path','wrong-symbol','wrong-digest','wrong-authority','wrong-canonical','rollout-complete','not-active','alias','replacement','history','release-record','tombstone','other-family-version','missing-family','invented-entry-release'])test('existing exception negative survives: '+mutation,()=>{
 const changed=structuredClone(doc),e=entry(changed),family=changed.schemaFamilies[0];
 if(mutation==='missing-review')delete e.initialAuthorityReview;
 if(mutation==='wrong-path')e.initialAuthorityReview.sourcePath='other.d.ts';
 if(mutation==='wrong-symbol')e.initialAuthorityReview.symbol='Other';
 if(mutation==='wrong-digest')e.initialAuthorityReview.sourceSha256='0'.repeat(64);
 if(mutation==='wrong-authority')e.initialAuthorityReview.authoritativeFingerprint='sha256:'+'0'.repeat(64);
 if(mutation==='wrong-canonical')e.canonicalDefinition.path='candidate-integrity.cjs';
 if(mutation==='rollout-complete')e.lifecycle.rollout='complete';
 if(mutation==='not-active')e.lifecycle.status='retired';
 if(mutation==='alias')e.aliasOf=['xtend','a11y','profile','v1'].join('.');
 if(mutation==='replacement')e.replacedBy='other.v2';
 if(mutation==='history')e.history=[{release:'previous'}];
 if(mutation==='release-record')changed.releaseRecords=[{schemaId:id,version:1}];
 if(mutation==='tombstone')family.tombstones=[{schemaId:id,version:1,rationale:'Prior retired version'}];
 if(mutation==='other-family-version')family.versions.push({...family.versions[0],schemaId:['xtend','product-candidates','v2'].join('.'),version:2});
 if(mutation==='missing-family')changed.schemaFamilies=[];
 if(mutation==='invented-entry-release')e.releasedFingerprintSetHash=e.shapePolicy.releasedFingerprintSetHash='sha256:'+'0'.repeat(64);
 const validation=errors(changed);assert.ok(drift(validation).length,mutation);assert.ok(local.validateEntryEvolutionFields(changed.entries,validation).length,mutation);
});
test('ordinary field/evidence/family checks are retained',()=>{
 const validation=errors();for(const change of [e=>e.version=0,e=>e.aliasOf=42,e=>e.shapePolicy.authoritativeFingerprints=['sha256:'+'0'.repeat(64)],e=>e.shapeFingerprints[0].evidence[0].completeness='invalid']){
  const changed=structuredClone(doc);change(entry(changed));assert.ok(local.validateEntryEvolutionFields(changed.entries,validation).length);
 }
 const changed=structuredClone(doc);changed.schemaFamilies[0].versions=[];assert.ok(local.validateSchemaFamilies(changed,changed.entries).length);
});
test('other IDs and ordinary released contracts cannot borrow initial registration',()=>{
 const changed=structuredClone(doc);entry(changed).schemaId=['xtend','other-candidates','v1'].join('.');assert.ok(errors(changed).errors.some(e=>e.code==='released-fingerprint-drift'));
 const ordinary=base.entries.find(e=>e.releasedFingerprintSetHash&&e.shapeFingerprints.some(f=>f.authoritative)&&e.lifecycle.status==='active'&&!e.aliasOf);assert.ok(ordinary);
 for(const change of [e=>e.releasedFingerprintSetHash=e.shapePolicy.releasedFingerprintSetHash=null,e=>e.shapeFingerprints.find(f=>f.authoritative).hash='sha256:'+'0'.repeat(64)]){
  const e=structuredClone(ordinary);change(e);const validation=errors({...doc,entries:[e]});assert.ok(validation.errors.some(issue=>issue.code==='released-fingerprint-drift'&&issue.schemaId===e.schemaId));assert.ok(local.validateEntryEvolutionFields([e],validation).length);
 }
});
test('actual changed declaration bytes revoke the initial rule and history is not rewritten',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'candidate-evolution-source-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.writeFileSync(path.join(dir,'candidate-integrity.d.ts'),fs.readFileSync(path.join(root,'candidate-integrity.d.ts'))+'\n// changed\n');assert.ok(drift(errors(doc,dir)).length);
});
test('untrusted provider-shaped snapshots cannot become accepted scans',()=>{
 const clone=structuredClone(frozen.observation);clone.sourceProvenance={};assert.throws(()=>scanner.validateInventoryDocument(doc,clone),/requires its verified source provider/);
 assert.throws(()=>scanner.validateInventoryDocument(doc,clone,{sourceProvider:{files:()=>[]}}),/Verified manifest-backed source provider/);
});
test('real whole suite uses unchanged single-root negative probes without provider-brand exceptions',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'candidate-evolution-suite-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'tests/schemas'),{recursive:true});fs.writeFileSync(path.join(dir,'tests/schemas/xtend-schema-inventory.json'),JSON.stringify({...doc,consolidations:[]}));
 fs.writeFileSync(path.join(dir,'candidate-integrity.d.ts'),fs.readFileSync(path.join(root,'candidate-integrity.d.ts')));
 fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'package.json')))));
 for(const relative of ['tests/utils/test-catalog.js','scripts/test-runner/catalog.js','scripts/test-runner/catalog.json']){const target=path.join(dir,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,relative),target);}
 let result;assert.doesNotThrow(()=>{result=compiled.exports.runSchemaInventorySuite({rootDir:dir});});
 assert.equal(result.ok,false,'Deliberately incomplete source fixture remains red');
 assert.ok(!result.failures.some(failure=>/requires its verified|cloned or mutated|unmodified verified extraction/.test(typeof failure==='string'?failure:JSON.stringify(failure))));
 assert.ok(result.failures.some(failure=>/negative gate/.test(failure)), 'Real negative probes executed and report the fixture missing aliases/exact groups');
 t.diagnostic(JSON.stringify({boundedWholeSuiteResult:result}));
});
test('the independent actual publication retirement guard remains active',()=>{
 assert.throws(()=>require('../../scripts/scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease(),/source-level initial-authority retirement/);
});

test('current renamed declaration cannot silently inherit the historical source approval',()=>{assert.ok(drift(errors(doc,root)).length);});

// Controlled diagnostics model: verifies that batching never accepts a different
// mutation's failure. Real validator and provider negatives run in the full suite.
const probeModule=new Module(suiteFile,module);probeModule.filename=suiteFile;probeModule.paths=Module._nodeModulePaths(__dirname);
const validationCall='const result = validateInventoryDocument(document, scanned, { rootDir, ...(sourceProvider ? { sourceProvider } : {}) });';
assert.equal(source.split(validationCall).length,2);
probeModule._compile(source.replace(validationCall,'const result = { errors: module.__diagnosticModel(document) };')
 .replace(returnStatement,'return { runSchemaInventorySuite, printSchemaInventoryReport, negativeProbe: validateNegativeGateBehavior };')
 +'\nmodule.exports.negativeProbe=createSuite().negativeProbe;\n',suiteFile);
const fixtureIds=new Set(base.entries.slice(0,3).map(e=>e.schemaId));
const add=e=>{if(e)fixtureIds.add(e.schemaId);};
const aliasRows=base.entries.filter(e=>e.aliasOf).slice(0,4);
for(const e of aliasRows){add(e);add(base.entries.find(row=>row.schemaId===e.aliasOf));}
add(base.entries.find(e=>e.releasedFingerprintSetHash&&!e.aliasOf&&e.lifecycle.status==='active'));
const multi=base.schemaFamilies.find(f=>f.versions.filter(v=>base.entries.find(e=>e.schemaId===v.schemaId)?.aliasOf===null).length>1);
for(const v of multi?.versions||[])add(base.entries.find(e=>e.schemaId===v.schemaId));
const exact=base.consolidations.find(c=>c.kind==='exact-authoritative'&&c.decision);
const insufficient=base.consolidations.find(c=>c.kind==='insufficient-evidence');
const cleanup=base.consolidations.find(c=>c.decision==='consolidate'&&c.canonicalSchemaId===['xtend','xtensions','host-resource-cleanup-record','v1'].join('.'));
for(const id of cleanup?.schemaIds||[])add(base.entries.find(e=>e.schemaId===id));
const probeFixture={...base,entries:base.entries.filter(e=>fixtureIds.has(e.schemaId)),
 schemaFamilies:base.schemaFamilies.filter(f=>f.versions.some(v=>fixtureIds.has(v.schemaId))),
 consolidations:[...new Set([exact,insufficient,cleanup].filter(Boolean))]};
const originalEntries=new Map(probeFixture.entries.map(e=>[e.schemaId,e]));
const batchCases=[
 ['coverage-missing-schema','removing an inventory entry does not fail scan coverage'],
 ['missing-usage-path','an invalid usage path does not fail validation'],
 ['classification-status-drift','lifecycle curation can incorrectly overwrite the static scan status'],
 ['unresolved-exact-consolidation','removing a new exact-group decision does not block validation'],
 ['invalid-consolidation','partial/test/docs/generated evidence can incorrectly trigger consolidation'],
 ['alias-fingerprint-mismatch','alias released-fingerprint mismatches are not rejected'],
 ['invalid-replaced-by','invalid replacedBy targets are not rejected']
];
function diagnosticModel(document){
 const rows=[{code:'alias-target-missing'},{code:'alias-chain'},{code:'alias-cycle'},
  {code:'multiple-current-family-version'},{code:'tombstone-reuse'},{code:'invalid-consolidation-rollout'}];
 for(const e of probeFixture.entries)if(!document.entries.some(row=>row.schemaId===e.schemaId))rows.push({code:'coverage-missing-schema',schemaId:e.schemaId});
 for(const e of document.entries){
  const old=originalEntries.get(e.schemaId);
  if(e.schemaId.endsWith('.v1.2'))rows.push({code:'invalid-family-version',schemaId:e.schemaId});
  if(e.shapeFingerprints?.some(f=>String(f.shape.signature).includes('|tampered:unknown')))rows.push({code:'invalid-shape-hash',schemaId:e.schemaId});
  if(old&&old.status!==e.status)rows.push({code:'classification-status-drift',schemaId:e.schemaId});
  for(const u of e.usages||[])for(const p of u.sourcePaths||[])if(p==='does/not/exist.schema-inventory-fixture')rows.push({code:'missing-usage-path',schemaId:e.schemaId,path:p});
  if(e.aliasOf&&old&&old.releasedFingerprintSetHash!==e.releasedFingerprintSetHash)rows.push({code:'alias-fingerprint-mismatch',schemaId:e.schemaId});
  if(e.aliasOf&&e.replacedBy===e.aliasOf)rows.push({code:'invalid-replaced-by',schemaId:e.schemaId});
 }
 for(const c of document.consolidations||[]){
  if(c.consolidationId===exact.consolidationId&&!c.decision)rows.push({code:'unresolved-exact-consolidation',consolidationId:c.consolidationId});
  if(c.consolidationId===insufficient.consolidationId&&c.decision==='consolidate')rows.push({code:'invalid-consolidation',consolidationId:c.consolidationId,message:'A consolidate decision requires identical authoritative released fingerprint sets.'});
 }
 return rows;
}
test('all batched mutations require their own matching diagnostics in a controlled model',()=>{
 probeModule.__diagnosticModel=diagnosticModel;
 assert.deepEqual(probeModule.exports.negativeProbe(probeFixture,{},root),[]);
});
for(const [code,message] of batchCases)test('another failure cannot mask an omitted batched diagnostic: '+code,()=>{
 probeModule.__diagnosticModel=document=>diagnosticModel(document).filter(row=>row.code!==code);
 assert.ok(probeModule.exports.negativeProbe(probeFixture,{},root).includes(message));
});
test('right diagnostic codes for unrelated targets do not satisfy batched mutations',()=>{
 const selected=new Set(batchCases.map(([code])=>code));
 probeModule.__diagnosticModel=document=>diagnosticModel(document).map(row=>selected.has(row.code)?{...row,schemaId:'foreign',consolidationId:'foreign',path:'foreign'}:row);
 const issues=probeModule.exports.negativeProbe(probeFixture,{},root);
 for(const [,message] of batchCases)assert.ok(issues.includes(message),message);
});

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

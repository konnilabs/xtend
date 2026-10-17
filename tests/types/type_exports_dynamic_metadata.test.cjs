// UNAPPLIED truthful dynamic metadata proposal. No fixed payload values or registration.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),Module=require('node:module');
const root=process.env.XTEND_TYPEEXPORT_SOURCE_ROOT||path.resolve(__dirname,'../..');
const file=process.env.XTEND_TYPEEXPORT_PROPOSAL||path.join(root,'catalog/type-exports.js');
const source=fs.readFileSync(file,'utf8'),compiled=new Module(path.join(root,'catalog/type-exports.js'),module);
compiled.filename=path.join(root,'catalog/type-exports.js');compiled.paths=Module._nodeModulePaths(path.dirname(compiled.filename));compiled._compile(source,compiled.filename);
const api=compiled.exports;const manifest=()=>JSON.parse(fs.readFileSync(path.join(root,'package.json')));
const plan=p=>api.createTypeExportsPlan({rootDir:root,packageManifest:p});
test('actual metadata remains numeric/string and strict current207-key validation passes',()=>{
 const p=manifest(),result=plan(p);assert.equal(result.lockedExportCount,p.xtend.typeExports.expectedExportCount);
 assert.equal(result.lockedExportFingerprint,p.xtend.typeExports.lockedExportFingerprint);
 assert.equal(typeof result.lockedExportCount,'number');assert.equal(typeof result.lockedExportFingerprint,'string');
 assert.equal(Object.keys(p.exports).length,207);assert.deepEqual(api.validateTypeExportsPlan(result).errors,[]);
});
test('producer retains changed dynamic values while consumer rejects semantic drift',()=>{
 for(const value of [0,206,208,999]){const p=manifest();p.xtend.typeExports.expectedExportCount=value;const result=plan(p);assert.equal(result.lockedExportCount,value);assert.equal(api.validateTypeExportsPlan(result).ok,false);}
 const p=manifest();p.xtend.typeExports.lockedExportFingerprint='0'.repeat(64);const result=plan(p);assert.equal(result.lockedExportFingerprint,'0'.repeat(64));assert.equal(api.validateTypeExportsPlan(result).ok,false);
});
for(const [name,mutate]of [
 ['missing object',p=>delete p.xtend.typeExports],['null object',p=>p.xtend.typeExports=null],['array object',p=>p.xtend.typeExports=[]],
 ['missing count',p=>delete p.xtend.typeExports.expectedExportCount],['string count',p=>p.xtend.typeExports.expectedExportCount='207'],
 ['noninteger count',p=>p.xtend.typeExports.expectedExportCount=207.5],['nonfinite count',p=>p.xtend.typeExports.expectedExportCount=Infinity],['negative count',p=>p.xtend.typeExports.expectedExportCount=-1],
 ['missing fingerprint',p=>delete p.xtend.typeExports.lockedExportFingerprint],['numeric fingerprint',p=>p.xtend.typeExports.lockedExportFingerprint=123],
 ['null fingerprint',p=>p.xtend.typeExports.lockedExportFingerprint=null],['malformed fingerprint',p=>p.xtend.typeExports.lockedExportFingerprint='not-a-digest']
])test('invalid metadata still returns original dynamic values and is rejected by the validator '+name,()=>{const p=manifest();mutate(p);const result=plan(p),metadata=p.xtend.typeExports;assert.equal(result.lockedExportCount,metadata&&metadata.expectedExportCount);assert.equal(result.lockedExportFingerprint,metadata&&metadata.lockedExportFingerprint);assert.equal(api.validateTypeExportsPlan(result).ok,false);});
test('strict export addition/substitution/order and existing declaration checks remain enforced',()=>{
 for(const mutate of [p=>p.exports['./unreviewed-helper']='./api.js',p=>{delete p.exports['./schema-inventory'];p.exports['./unreviewed-helper']='./api.js';},p=>p.exports=Object.fromEntries(Object.entries(p.exports).reverse()),p=>p.exports['./schema-inventory'].default='./api.js']){
  const p=manifest();mutate(p);assert.equal(api.validateTypeExportsPlan(plan(p)).ok,false);
 }
});
test('actual actual standard JSDoc-aware extractor retains the exact approved full dd49 plan instead of unresolved metadata expressions',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dynamic-typeexports-shape-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'catalog'));fs.writeFileSync(path.join(dir,'catalog/type-exports.js'),source);
 const scanner=require(path.join(root,'tools/schema-inventory/index.cjs')).createScanner({typescript:require(require.resolve('typescript',{paths:[root]}))});
 const observed=scanner.scanSchemaInventory({rootDir:dir}).entries.find(e=>e.schemaId===['xtend','type-exports','plan','v1'].join('.'));
 const shape=observed.shapeFingerprints.find(f=>f.shape.normalized?.fields?.lockedExportCount);assert.ok(shape);
 const inventory=JSON.parse(fs.readFileSync(path.join(root,'tests/schemas/xtend-schema-inventory.json'))),record=inventory.entries.find(r=>r.schemaId===observed.schemaId),expected=record.shapeFingerprints.find(f=>f.hash==='sha256:dd49dff5aa24266c68c96cd7f1caf946c548acb4549d604c3bbab7b36c6c98e8');assert.equal(shape.hash,expected.hash);assert.deepEqual(shape.shape,expected.shape);
 assert.equal(shape.shape.normalized.fields.lockedExportCount.type,'number');assert.equal(shape.shape.normalized.fields.lockedExportFingerprint.type,'string');
 t.diagnostic(JSON.stringify({normalizedPlanObservation:shape}));
});

for(const [name,p] of [['empty packageManifest',{}],['exports-only packageManifest',{exports:manifest().exports}],['empty xtend metadata',{exports:manifest().exports,xtend:{}}]])test('partial input remains a rejected diagnostic plan '+name,()=>{const result=plan(p);assert.equal(result.lockedExportCount,undefined);assert.equal(result.lockedExportFingerprint,undefined);assert.equal(api.validateTypeExportsPlan(result).ok,false);});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../../catalog/epic13-package-export-lock');
const root=path.resolve(__dirname,'../..');
function manifest(){return JSON.parse(fs.readFileSync(path.join(root,'package.json')));}
function validateMutation(mutate){const pkg=manifest();mutate(pkg);return api.validateEpic13PackageExportLockPlan(api.createEpic13PackageExportLockPlan({packageManifest:pkg}));}
test('explicit Core export lock keeps candidate integrity public and schema inventory private',()=>{
 const result=validateMutation(()=>{});assert.deepEqual(result.errors,[]);
 assert.equal(api.EXPECTED_EXPORT_KEYS.length,207);assert.ok(api.EXPECTED_EXPORT_KEYS.includes('./candidate-integrity'));
 assert.ok(!api.EXPECTED_EXPORT_KEYS.includes('./schema-inventory'));
 assert.ok(!manifest().files.includes('tools'));assert.ok(!manifest().files.includes('tools/schema-inventory'));
});
test('unreviewed manifest export still fails the explicit lock',()=>{
 const result=validateMutation(pkg=>pkg.exports['./unreviewed']='./api.js');assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('unexpected exports: ./unreviewed')));
});
test('missing public candidate integrity export still fails the explicit lock',()=>{
 const result=validateMutation(pkg=>delete pkg.exports['./candidate-integrity']);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('missing expected exports: ./candidate-integrity')));
});
test('same-count substitution fails both missing and unexpected export checks',()=>{
 const result=validateMutation(pkg=>{delete pkg.exports['./candidate-integrity'];pkg.exports['./unreviewed']='./api.js';});assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('missing expected exports')));assert.ok(result.errors.some(e=>e.includes('unexpected exports')));
});
test('external export target and missing declared pack root remain rejected',()=>{
 for(const mutate of [pkg=>pkg.exports['./candidate-integrity']='https://foreign.test/code.js',pkg=>pkg.files=pkg.files.filter(f=>f!=='tools/xtensions')])assert.equal(validateMutation(mutate).ok,false);
});
test('each required public tooling root remains mandatory',()=>{
 for(const root of api.REQUIRED_PACK_ROOTS.filter(root=>root.startsWith('tools/')))
  assert.equal(validateMutation(pkg=>pkg.files=pkg.files.filter(file=>file!==root)).ok,false,root);
});

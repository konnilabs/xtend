'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../../catalog/epic13-package-export-lock');
const root=path.resolve(__dirname,'../..');
function manifest(){return JSON.parse(fs.readFileSync(path.join(root,'package.json')));}
function validateMutation(mutate){const pkg=manifest();mutate(pkg);return api.validateEpic13PackageExportLockPlan(api.createEpic13PackageExportLockPlan({packageManifest:pkg}));}
test('explicit export lock includes the reviewed public schema inventory API',()=>{
 const result=validateMutation(()=>{});assert.deepEqual(result.errors,[]);
 assert.equal(api.EXPECTED_EXPORT_KEYS.length,207);assert.ok(api.EXPECTED_EXPORT_KEYS.includes('./schema-inventory'));
});
test('unreviewed manifest export still fails the explicit lock',()=>{
 const result=validateMutation(pkg=>pkg.exports['./unreviewed']='./api.js');assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('unexpected exports: ./unreviewed')));
});
test('missing public schema inventory export still fails the explicit lock',()=>{
 const result=validateMutation(pkg=>delete pkg.exports['./schema-inventory']);assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('missing expected exports: ./schema-inventory')));
});
test('same-count substitution fails both missing and unexpected export checks',()=>{
 const result=validateMutation(pkg=>{delete pkg.exports['./schema-inventory'];pkg.exports['./unreviewed']='./api.js';});assert.equal(result.ok,false);assert.ok(result.errors.some(e=>e.includes('missing expected exports')));assert.ok(result.errors.some(e=>e.includes('unexpected exports')));
});
test('external export target and missing declared pack root remain rejected',()=>{
 for(const mutate of [pkg=>pkg.exports['./schema-inventory']='../foreign',pkg=>pkg.files=pkg.files.filter(f=>f!=='tools')])assert.equal(validateMutation(mutate).ok,false);
});

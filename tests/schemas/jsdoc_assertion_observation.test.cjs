'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),ts=require('typescript');
const scanner=require('../../tools/schema-inventory/index.cjs').createScanner({typescript:ts});
const discriminator=['xtend','jsdoc-unit','envelope','v1'].join('.');
function observe(expression,{extension='js',prelude='',raw='raw-value'}={}) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jsdoc-observation-'));
 try {
  const source=`'use strict'; const metadata={value:${JSON.stringify(raw)}}; ${prelude}\nmodule.exports={schema:${JSON.stringify(discriminator)},value:${expression}};\n`;
  fs.writeFileSync(path.join(dir,'runtime.'+extension),source);
  const entry=scanner.scanSchemaInventory({rootDir:dir}).entries.find(e=>e.schemaId===discriminator);
  assert.ok(entry);assert.equal(entry.shapeFingerprints.length,1);
  const fingerprint=entry.shapeFingerprints[0];
  assert.deepEqual(fingerprint.evidenceTypes,['runtime-observation']);assert.equal(fingerprint.authoritative,false);
  assert.ok(fingerprint.evidence.every(e=>e.type==='runtime-observation'&&e.authoritative===false));
  return {source,fingerprint,type:fingerprint.shape.normalized.fields.value.type};
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
function unresolved(result){assert.deepEqual(result.type,{unresolved:'metadata.value'});assert.equal(result.fingerprint.completeness,'partial');}
for(const primitive of ['number','string','boolean'])test('valid JSDoc '+primitive+' assertion normalizes without becoming authority',()=>{
 const result=observe(`/** @type {${primitive}} */ (metadata.value)`);assert.equal(result.type,primitive);assert.equal(result.fingerprint.completeness,'complete');
});
test('a valid field assertion describes source type without coercing runtime bytes',()=>{
 const result=observe('/** @type {number} */ (metadata.value)',{raw:'not-a-number'}),module={exports:{}};
 vm.runInNewContext(result.source,{module});assert.equal(module.exports.value,'not-a-number');assert.equal(typeof module.exports.value,'string');assert.equal(result.type,'number');assert.equal(result.fingerprint.authoritative,false);
});
test('unresolved alias remains a partial runtime observation',()=>{
 const result=observe('/** @type {UnknownLocalAlias} */ (metadata.value)');assert.deepEqual(result.type,{arguments:[],unresolvedReference:'UnknownLocalAlias'});assert.equal(result.fingerprint.completeness,'partial');
});
for(const primitive of ['any','unknown'])test(primitive+' assertion remains honestly partial',()=>{
 const result=observe(`/** @type {${primitive}} */ (metadata.value)`);assert.equal(result.type,primitive);assert.equal(result.fingerprint.completeness,'partial');
});
for(const [label,expression]of [
 ['ordinary block comment','/* @type {number} */ (metadata.value)'],
 ['return tag','/** @returns {number} */ (metadata.value)'],
 ['param tag','/** @param {number} input */ (metadata.value)'],
 ['no assertion parentheses','/** @type {number} */ metadata.value'],
 ['unclosed type brace','/** @type {number */ (metadata.value)'],
 ['empty type','/** @type {} */ (metadata.value)'],
 ['missing union operand','/** @type {number |} */ (metadata.value)'],
 ['unclosed array type','/** @type {number[} */ (metadata.value)']
])test('non-assertion or malformed comment cannot grant a type: '+label,()=>unresolved(observe(expression)));
test('a declaration comment on another statement cannot grant a field type',()=>unresolved(observe('(metadata.value)',{prelude:'/** @type {number} */ const unrelated=metadata.value;'})));
test('unrelated malformed JSDoc does not suppress a separately valid assertion',()=>{
 const result=observe('/** @type {string} */ (metadata.value)',{prelude:'/** @type {number */ const unrelated=metadata.value;'});assert.equal(result.type,'string');assert.equal(result.fingerprint.completeness,'complete');
});
for(const [label,expression,extension]of [
 ['ordinary JS parentheses','(metadata.value)','js'],
 ['nested JS parentheses','((metadata.value))','js'],
 ['existing TS as assertion','metadata.value as number','ts'],
 ['existing TS angle assertion','<number>metadata.value','ts'],
 ['existing parenthesized TS assertion','(metadata.value as number)','ts']
])test(label+' keeps existing unresolved-expression behavior',()=>unresolved(observe(expression,{extension})));
test('a valid assertion through outer parentheses keeps type and runtime evidence',()=>{
 const result=observe('((/** @type {number} */ (metadata.value)))');assert.equal(result.type,'number');assert.equal(result.fingerprint.completeness,'complete');
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),zlib=require('node:zlib'),ts=require('typescript');
const expectedSchema=require('../../tools/schema-inventory/command-lexical-overlay.json').schemaId;
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=fs.readFileSync(path.join(root,'xtend-maraca/plan-runtime.mjs'),'utf8'),output=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'fixtures/command-runtime-d1.mjs.gz'))).toString();
// Retained historical D1 fixture plus separately bound current canonical generation.
// Scoped PR118 current Core generation is separate from frozen Demo evidence.
// This test reproduces the separately authorized observation from the bound inputs.
const currentCoreGeneration = Object.freeze({
  reviewStatus: 'user-authorized-for-validation',
  observedSourceSha: '33c533b78a59dd7f0de85858e576e63aee8c3ec3',
  canonicalSha256: '38d1ccffe5ceca4be74892385adfcaa6c282655a4e73806da5d3c3b1e9c6b02c',
  builderSha256: 'd1068ed165e21bd1f62453b9f16d5d3bceb43f21eec0d437e57d01da7c3b120b',
  packageLockSha256: 'f121174d831b28ea2d50c00f02c7b5b3616637aa0aa402465bd2ffbcaa014c3d',
  terserVersion: '5.48.0',
  typescriptVersion: '5.9.3',
  outputSha256: 'fb0ce48fc03850bf5bd3b6905d306e81d43b715c9f198cfe4da4dd6e868a70f5'
});
const historicalDemoOutputHash = require('../../tools/schema-inventory/current-pair-contract.cjs').generatedMirrors().sourceHashes['products/rmt-maraca-kernel-orchestration/site/build/runtime/xtend-maraca-plan-runtime.mjs'];
const currentOutputHash = currentCoreGeneration.outputSha256;
function extract(source,name){const file=ts.createSourceFile('actual.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),found=[];function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text===name)found.push(n.getText(file));ts.forEachChild(n,visit);}visit(file);assert.equal(found.length,1);return found[0];}
function adapters(source){return new Function(extract(source,'asRecord')+';const SYSTEM_REFRESH_COMMAND="xtend.system.refresh";function recordLegacyAdapter(){};function dispatchCommand(envelope){return envelope};'+extract(source,'render')+';'+extract(source,'refresh')+';return {render,refresh};')();}
function check(source){const api=adapters(source);for(const name of ['render','refresh']){for(const input of [undefined,null,'bad',[],0])assert.deepEqual(api[name](input),{schema:expectedSchema,command:'xtend.system.refresh',metadata:{operation:'maraca.'+name}});const input={operation:'custom.operation',correlationId:'fixed',extra:7};assert.deepEqual(api[name](input),{schema:expectedSchema,command:'xtend.system.refresh',metadata:input});assert.deepEqual(input,{operation:'custom.operation',correlationId:'fixed',extra:7});}}
test('digest-bound historical D1 fixture and current canonical adapters preserve command construction',()=>{assert.equal(sha(output),'16e583631727612eac9922c20a24d078a30af0b10b43306fb3d8ee2f7b12673c');assert.equal(sha(canonical),currentCoreGeneration.canonicalSha256);check(canonical);check(output);});
test('schema default-operation metadata-spread and caller-override mutations fail',()=>{const body=extract(canonical,'render');for(const mutate of [s=>s.replace("schema: 'xtend.rmt.command.v1'","schema: 'wrong'"),s=>s.replace("|| 'maraca.render'","|| 'wrong.render'"),s=>s.replace('...asRecord(metadata),',''),s=>s.replace("asRecord(metadata).operation || 'maraca.render'","'maraca.render'")]){const bad=mutate(body);assert.notEqual(bad,body);assert.throws(()=>check(canonical.replace(body,bad)));}});
test('actual production minifier reproduces separately bound current Core bytes and command semantics',async t=>{const temp=fs.mkdtempSync(path.join(os.tmpdir(),'command-reproduction-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));const terser=require('terser'),builder=fs.readFileSync(path.join(root,'xtend-maraca/index.js'),'utf8'),minify=new Function('fs','requireOptional',extract(builder,'minifyCopiedMaracaRuntimeAssets')+';return minifyCopiedMaracaRuntimeAssets;')(fs,()=>({available:true,module:terser})),filename=path.join(temp,'runtime.mjs');fs.writeFileSync(filename,canonical);assert.equal(sha(canonical),currentCoreGeneration.canonicalSha256);assert.equal(sha(builder),currentCoreGeneration.builderSha256);assert.equal(sha(fs.readFileSync(path.join(root,'package-lock.json'))),currentCoreGeneration.packageLockSha256);assert.equal(require('terser/package.json').version,currentCoreGeneration.terserVersion);assert.equal(ts.version,currentCoreGeneration.typescriptVersion);const asset={fileName:'runtime/xtend-maraca-plan-runtime.mjs',path:filename};await minify({profile:'production',rootDir:root},[asset]);const current=fs.readFileSync(filename,'utf8');assert.match(currentOutputHash,/^[a-f0-9]{64}$/);assert.equal(sha(current),currentOutputHash);assert.notEqual(sha(current),sha(output));assert.notEqual(sha(current),historicalDemoOutputHash);assert.equal(asset.bytes,Buffer.byteLength(current));check(current);});
test('actual production minifier rejects missing code',async()=>{const builder=fs.readFileSync(path.join(root,'xtend-maraca/index.js'),'utf8'),minify=new Function('fs','requireOptional',extract(builder,'minifyCopiedMaracaRuntimeAssets')+';return minifyCopiedMaracaRuntimeAssets;')(fs,()=>({available:true,module:{minify:async()=>({})}}));await assert.rejects(minify({profile:'production'},[{fileName:'runtime/input.mjs',path:path.join(root,'xtend-maraca/plan-runtime.mjs')}]),/Terser did not return code/);});

test('frozen Demo generation and historical fixtures remain separate from current Core',()=>{
  assert.equal(historicalDemoOutputHash,'0b2dabe143dc23d1e3e199a05d9f8b39457b105491243264ae5c31bc77560192');
  assert.equal(sha(output),'16e583631727612eac9922c20a24d078a30af0b10b43306fb3d8ee2f7b12673c');
  assert.notEqual(currentOutputHash,historicalDemoOutputHash);
});

 'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),Module=require('node:module');
const root=process.env.XTEND_MARACA_SOURCE_ROOT||path.resolve(__dirname,'../..');
const filename=path.join(root,'xtend-maraca/index.js'),source=fs.readFileSync(process.env.XTEND_MARACA_PROPOSAL||filename,'utf8');
const compiled=new Module(filename,module);compiled.filename=filename;compiled.paths=Module._nodeModulePaths(path.dirname(filename));
compiled._compile(source+'\nmodule.exports.__nullableTest={normalizeOptions,loadMaracaBuildConfig,createMaracaServiceSourceFingerprint};\n',filename);const api=compiled.exports,local=api.__nullableTest;
function setup(t){const rootDir=fs.mkdtempSync(path.join(os.tmpdir(),'maraca-nullable-'));t.after(()=>fs.rmSync(rootDir,{recursive:true,force:true}));fs.mkdirSync(path.join(rootDir,'src'));fs.writeFileSync(path.join(rootDir,'app.rmt'),'Controlled RMT source bytes; no build is run');fs.writeFileSync(path.join(rootDir,'src/services.ts'),'export const actualServiceInput = 1;\n');return rootDir;}
function input(options={}){return{source:'app.rmt',sourceFingerprint:null,output:'dist',selected:{profile:'production',lazy:'none',css:'external'},locked:{},options,toolchain:{rollup:null,terser:null,mode:'rollup-terser'},candidateMatrixFingerprint:'a'.repeat(64)};}
function configured(dir,value){fs.writeFileSync(path.join(dir,'maraca.config.json'),JSON.stringify(value));return local.normalizeOptions({config:'maraca.config.json'},{rootDir:dir});}
const errors=plan=>plan.buildConfigDiagnostics;
test('disabled producer intentionally normalizes absent/null to the same null bytes without changing chosen policies',t=>{
 const dir=setup(t),base=input({lazy:'none',css:'external'});const missing=api.createMaracaTuneConfig(base),nullable=api.createMaracaTuneConfig({...base,serviceGraphFingerprint:null});assert.deepEqual(missing,nullable);assert.equal(missing.serviceGraphFingerprint,null);assert.deepEqual(missing.options,base.options);assert.deepEqual(missing.selected,base.selected);
 assert.match(local.createMaracaServiceSourceFingerprint(undefined,dir),/^[a-f0-9]{64}$/, 'Existing default source correctly enables discovery');
 fs.unlinkSync(path.join(dir,'src/services.ts'));assert.equal(local.createMaracaServiceSourceFingerprint(undefined,dir),null);assert.equal(local.createMaracaServiceSourceFingerprint(false,dir),null);
});
test('actual consumer accepts historical absent field and current null, with unchanged none/route normalization',t=>{
 const dir=setup(t);for(const lazy of ['none','route'])for(const mode of ['absent','null']){
  const base=input({lazy,css:'external'});const config=api.createMaracaTuneConfig(base);if(mode==='absent'){delete config.serviceGraphFingerprint;delete config.configFingerprint;}
  const normalized=configured(dir,config);assert.equal(normalized.lazy,lazy);assert.equal(normalized.css,'external');assert.deepEqual(errors(normalized),[]);
 }
});
for(const value of [false,0,'',42,{},[], 'not-a-hash','A'.repeat(64)])test('producer and actual loader reject malformed '+JSON.stringify(value),t=>{
 const dir=setup(t);assert.throws(()=>api.createMaracaTuneConfig({...input(),serviceGraphFingerprint:value}),/absent, null, or a SHA256/);
 const config=api.createMaracaTuneConfig(input());config.serviceGraphFingerprint=value;delete config.configFingerprint;
 const normalized=configured(dir,config);assert.ok(errors(normalized).some(e=>e.code==='xtend.maraca.build_config_service_graph_invalid'));
});
test('enabled exact graph hash is generated from real source bytes; wrong hash/source mutation remains rejected',t=>{
 const dir=setup(t),services={clientEntry:'src/services.ts',targets:['browser'],strict:true};const fingerprint=local.createMaracaServiceSourceFingerprint(services,dir);assert.match(fingerprint,/^[a-f0-9]{64}$/);const config=api.createMaracaTuneConfig({...input({services,lazy:'route'}),serviceGraphFingerprint:fingerprint});
 assert.equal(config.serviceGraphFingerprint,fingerprint);assert.deepEqual(errors(configured(dir,config)),[]);
 const wrong=api.createMaracaTuneConfig({...input({services}),serviceGraphFingerprint:'0'.repeat(64)});assert.ok(errors(configured(dir,wrong)).some(e=>e.code==='xtend.maraca.build_config_service_graph_drift'));
 fs.appendFileSync(path.join(dir,'src/services.ts'),'// real input mutation\n');assert.ok(errors(configured(dir,config)).some(e=>e.code==='xtend.maraca.build_config_service_graph_drift'));
});
test('truthy hash cannot claim a disabled graph and config fingerprint still binds null-versus-absent representation',t=>{
 const dir=setup(t);const config=api.createMaracaTuneConfig({...input({services:false}),serviceGraphFingerprint:'0'.repeat(64)});assert.ok(errors(configured(dir,config)).some(e=>e.code==='xtend.maraca.build_config_service_graph_drift'));
 const nullable=api.createMaracaTuneConfig(input());delete nullable.serviceGraphFingerprint;assert.ok(errors(configured(dir,nullable)).some(e=>e.code==='xtend.maraca.build_config_fingerprint_drift'));
});
test('existing service source drift check and all lazy/route code are conserved verbatim',()=>{
 assert.ok(source.includes('currentServiceGraphFingerprint !== buildConfigRecord.config.serviceGraphFingerprint'));
 assert.ok(source.includes("const lazy = VALID_LAZY_MODES.has(values.lazy) ? values.lazy : 'route';"));
 assert.ok(source.includes("const declaredPolicyPreserved = requested.lazy !== 'none' || declaredDeferredPolicies.length === 0;"));
});

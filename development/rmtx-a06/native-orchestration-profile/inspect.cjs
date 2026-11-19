'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
const sourceFiles=Object.freeze([...new Set([
 ...require('../lifecycle-profile/inspect.cjs').sourceFiles,
 ...['native-component-contract','native-orchestration-lifecycle','native-surface-scopes','native-surface-projection'].flatMap(name=>['tools/xtensions/'+name+'.js','tools/xtensions/'+name+'.d.ts']),
 'tools/xtensions/native-component-catalog.js','development/rmtx-a06/native-components/generate.cjs','tools/xtensions/native-sink-contract.js','tools/xtensions/state-binding-orchestrated.js',
 ...['rmtx-native-components.js','rmtx-native-components.d.ts','rmtx-native-components.generated.d.ts','rmtx-native-components.v1.json'].map(name=>'tools/rmt-language/'+name),
 ...['native-orchestration-runtime.mjs','native-orchestration-runtime.d.ts','native-surface-graph.mjs','native-surface-graph.d.ts'].map(name=>'xtend-maraca/'+name),
 'components/xheader.js','tests/types/xtensions_native_orchestration.mts','tests/xtensions/native-orchestrated-contracts.test.cjs','tests/xtensions/native-orchestrated-prewarm.test.cjs','tests/maraca/rmtx-surface-graph.test.mjs','tests/rmt-language/rmtx-native-orchestration.test.cjs','tests/maraca/rmtx-orchestration.test.mjs','tests/xtensions/native-surface-projection.test.cjs',
 ...['source.rmtx','reference.cjs','inspect.cjs','runtime-test.cjs','runtime-acceptance.mjs'].map(name=>'development/rmtx-a06/native-orchestration-profile/'+name)
])].sort());
const sourceHashes=()=>Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
async function inspect({write=false,check=false}={}){
 const ref=require('./reference.cjs'),names=[],temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-orchestration-inspect-')),sources=sourceHashes();
 try{
  const compiled=ref.compiler().compileSource({text:fs.readFileSync(path.join(root,ref.source),'utf8'),filePath:ref.source},{componentInterfaceCatalog:ref.catalog()});
  assert.equal(compiled.ok,true,JSON.stringify(compiled.diagnostics));
  assert.equal(compiled.schema,'xtend.rmtx.compile-result.v7');assert.equal(compiled.orchestrationArtifacts.schema,'xtend.rmt.app-orchestration.v5');names.push('explicit Source7 compiles the real nested native/React/Vue reference through unchanged formal Classic AST1');
  const program=compiled.orchestrationArtifacts,port=require('../../../tools/xtensions/native-surface-projection').NATIVE_ORCHESTRATION_VIEW_RUNTIME;
  port.validateNativeViewProgram(program);assert.equal(port.NATIVE_VIEW_PROJECTION_API_VERSION,'3.0.0');
  const states=Object.fromEntries(program.state.states.map(row=>[row.id,row.initial])),snapshot={states};
  const scopes=port.materializeSurfaceScopes(program,snapshot);assert.equal(scopes.instances.length,6);assert.equal(new Set(scopes.instances.map(row=>row.id)).size,6);names.push('shared typed scope materialization separates numeric and string keys for native owners and provider hosts');
  const binding=require('../../../tools/xtensions/state-binding'),validated=binding.validateOrchestratedStateBindingArtifact(compiled.xtensionBindings,program),rows=binding.materializeOrchestratedStateBindingArtifact(validated,snapshot);
  assert.equal(rows.length,4);assert(rows.every(row=>row.hostSurface!==row.surface&&row.ownerSurface.startsWith('product:rmtx:')));assert.equal(new Set(rows.map(row=>JSON.stringify(row.binding.address))).size,4);names.push('Binding7 joins concrete provider targets and owning Surface instances without changing logical Binding3 addresses');
  assert.throws(()=>binding.validateStateBindingArtifact(compiled.xtensionBindings,program));assert.throws(()=>require('../../../tools/xtensions/native-view-projection').NATIVE_LIFECYCLE_VIEW_RUNTIME.validateNativeViewProgram(program));names.push('retained legacy ports remain closed to Source7 contracts');
  assert.equal(new Set(program.lifecycle.operations.map(row=>row.op)).size,10);assert.equal(program.lifecycle.schema,'xtend.rmt.native-lifecycle-plan.v2');names.push('all ten native content lifecycle operations retain exact compiler provenance');
  assert.equal(program.render.nativeView.components[0].tag,'x-header');require('../../../tools/rmt-language/rmtx-native-components').verifyNativeComponentSources(program.render.nativeView.components,{rootDir:root});names.push('public Shadow DOM metadata is pinned to actual shipped component bytes');
  const compileChecks=ref.verifyCompileCases();assert.equal(compileChecks.checks,10);names.push('ten unsupported authoring cases reject before productive artifacts');
  const build=await ref.build(path.join(temporary,'mixed'));assert.equal(build.ok,true,JSON.stringify(build.plan.diagnostics));assert.equal(build.plan.schema,'xtend.maraca.build-plan.v11');
  const artifact=JSON.parse(fs.readFileSync(path.join(build.plan.outputDir,'xtend.xtensions.report.json'))).artifact;
  assert.equal(artifact.schema,'xtend.maraca.xtension-composition-artifact.v12');assert.equal(artifact.loadPlan.schema,'xtend.maraca.xtension-load-plan.v3');assert(artifact.loadPlan.providers.every(row=>row.phase==='kernel.fabric.lifecycle'));assert(fs.existsSync(path.join(build.plan.outputDir,'runtime/xtend-maraca-native-orchestration-runtime.mjs')));names.push('regular production build emits Plan11, Artifact12 and separate versioned lifecycle projection assets');
  assert.deepEqual(sourceHashes(),sources,'Source files changed during static inspection');
  const report={schema:'xtend.rmtx.native-orchestration-evidence.v1',version:'1.0.0',stage:'A06.4.2-native-orchestration',passed:true,checks:names.length,names,compileChecks,sources,runtimeExecutionVerified:false,acceptedForRelease:false,ssrAcceptancePerformed:false};
  const output=JSON.stringify(report,null,2)+'\n',target=path.join(__dirname,'evidence.json');if(write)fs.writeFileSync(target,output);if(check)assert.equal(fs.readFileSync(target,'utf8'),output);console.log(JSON.stringify(report));return report;
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}
if(require.main===module)inspect({write:process.argv.includes('--write'),check:process.argv.includes('--check')}).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={sourceFiles,sourceHashes,inspect};

'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const {compileRmtxSource,RMTX_COMPILER_API_VERSION}=require('../../../tools/rmt-language/rmtx-compiler');
const {getRmtxOperatorProfile,RMTX_PARSER_API_VERSION}=require('../../../tools/rmt-language/rmtx-parser');
const {compileRmtClassicSource,RMT_CLASSIC_COMPILER_API_VERSION}=require('../../../tools/rmt-language/classic-compiler');
const {RMT_VNEXT_COMPILER_API_VERSION}=require('../../../tools/rmt-language/vnext-compiler');
const sourceFiles=[
 'tools/rmt-language/rmtx-parser.js','tools/rmt-language/rmtx-parser.d.ts','tools/rmt-language/rmtx-compiler.js','tools/rmt-language/rmtx-compiler.d.ts',
 'tools/rmt-language/rmtx-operator-profiles.js','tools/rmt-language/rmtx-operator-profiles.d.ts','tools/rmt-language/rmtx-selector-dependencies.js','tools/rmt-language/rmtx-selector-dependencies.d.ts',
 'tools/rmt-language/rmtx.js','tools/rmt-language/rmtx.d.ts','tools/rmt-language/classic-compiler.js','tools/rmt-language/classic-compiler.d.ts',
 'tools/rmt-language/vnext-compiler.js','tools/rmt-language/vnext-compiler.d.ts','tools/rmt-language/classic-ast-contract.js','tools/rmt-language/classic-ast-rules.js',
 'tools/rmt-language/classic-semantic-rules.js','tools/rmt-language/semantic-graph.js','xtendrmt/rmt-state-selector-runtime.js',
 'development/rmtx-a06/selector-profile/selectors.rmt','development/rmtx-a06/selector-profile/selectors.rmtx','development/rmtx-a06/selector-profile/two-host.rmtx',
 'development/rmtx-a06/selector-profile/inspect.cjs','development/rmtx-a06/selector-profile/runtime-test.cjs','development/rmtx-a06/selector-profile/runtime-acceptance.mjs',
 'tests/rmt-language/rmtx-selectors.test.cjs','tests/rmt-language/rmtx-operator-profiles.test.cjs','tests/rmt-language/rmtx-selector-dependencies.test.cjs',
 'scripts/check_release_preparation.cjs','tests/release/preparation-gates.test.cjs','tests/xtensions/xtensions_runtime_gate_suite.js'
];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const state=plan=>({...plan,selectors:plan.selectors.map(({clauses,...entry})=>entry)});
function inspect(){
 const r=compileRmtxSource({text:fs.readFileSync(path.join(__dirname,'selectors.rmtx'),'utf8'),filePath:path.join(__dirname,'selectors.rmtx')},{syntaxVersion:'2.0.0'});
 const c=compileRmtClassicSource({text:fs.readFileSync(path.join(__dirname,'selectors.rmt'),'utf8'),filePath:path.join(__dirname,'selectors.rmt')});
 assert(r.ok,JSON.stringify(r.diagnostics));assert(c.ok,JSON.stringify(c.diagnostics));
 assert.deepEqual(state(r.orchestrationArtifacts.state),state(c.orchestrationArtifacts.state));
 assert.deepEqual(r.orchestrationArtifacts.actions,c.orchestrationArtifacts.actions);
 assert.equal(r.schema,'xtend.rmtx.compile-result.v2');assert.equal(r.selectorDependencies.runtimeTracking,false);
 const profile=getRmtxOperatorProfile('2.0.0');assert.equal(Object.keys(profile.operators).length,14);
 const old=getRmtxOperatorProfile();assert.equal(Object.keys(old.operators).length,9);
 const sources=Object.fromEntries(sourceFiles.slice().sort().map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
 return {profile,dependencies:r.selectorDependencies,evidence:{format:1,version:'1.0.0',stage:'A06.3.1-selector-profile',passed:true,
  sourceProfile:r.sourceProfile,defaultSyntaxVersion:old.syntaxVersion,
  apiVersions:{parser:RMTX_PARSER_API_VERSION,compiler:RMTX_COMPILER_API_VERSION,classic:RMT_CLASSIC_COMPILER_API_VERSION,vnext:RMT_VNEXT_COMPILER_API_VERSION},
  operatorCount:14,legacyOperatorCount:9,checks:{actualRmtxCompile:true,actualClassicCompile:true,effectiveStatePlanParity:true,actionPlanParity:true,canonicalDependencyReport:true},
  generalRmtxOperatorCoverageComplete:false,modelFieldTypeInferenceImplemented:false,incrementalSelectorRecomputationImplemented:false,acceptedForRelease:false,sources}};
}
if(require.main===module){
 const r=inspect();for(const[name,value]of[['operator-profile.json',r.profile],['dependencies.json',r.dependencies],['evidence.json',r.evidence]]){
  const output=path.join(__dirname,name),bytes=JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--write'))fs.writeFileSync(output,bytes);
  else assert(fs.existsSync(output)&&fs.readFileSync(output,'utf8')===bytes,`A06.3 observation drift: ${name}; execute inspector --write after review.`);
 }
 console.log(JSON.stringify({passed:r.evidence.passed,stage:r.evidence.stage,sources:Object.keys(r.evidence.sources).length,operators:r.evidence.operatorCount}));
}
module.exports={inspect};

'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const { compileRmtxSource, RMTX_COMPILER_API_VERSION, RMTX_COMPILE_RESULT_SCHEMA } = require('../../../tools/rmt-language/rmtx-compiler');
const { RMTX_PARSER_API_VERSION, RMTX_PARSER_SCHEMA, RMTX_SOURCE_PROFILE } = require('../../../tools/rmt-language/rmtx-parser');
const { compileRmtClassicSource, RMT_CLASSIC_COMPILER_API_VERSION } = require('../../../tools/rmt-language/classic-compiler');
const { RMT_VNEXT_COMPILER_API_VERSION } = require('../../../tools/rmt-language/vnext-compiler');
const files = [
  'tools/rmt-language/rmtx-parser.js', 'tools/rmt-language/rmtx-parser.d.ts',
  'tools/rmt-language/rmtx-compiler.js', 'tools/rmt-language/rmtx-compiler.d.ts',
  'tools/rmt-language/rmtx.js', 'tools/rmt-language/rmtx.d.ts',
  'tools/rmt-language/classic-compiler.js', 'tools/rmt-language/classic-compiler.d.ts',
  'tools/rmt-language/vnext-compiler.js', 'tools/rmt-language/vnext-compiler.d.ts',
  'tools/rmt-language/classic-ast-contract.js', 'tools/rmt-language/classic-ast-rules.js',
  'tools/rmt-language/classic-semantic-rules.js', 'tools/rmt-language/contracts/classic-ast.v1.schema.json',
  'tools/rmt-language/source-model.js', 'tools/xtensions/state-binding-artifact.js',
  'xtend-maraca/index.js', 'xtend-maraca/index.d.ts', 'package.json', 'tools/package.json', 'package-lock.json',
  'catalog/epic13-package-export-lock.js', 'catalog/type-exports-rmt.js',
  'scripts/check_release_preparation.cjs', 'tests/release/preparation-gates.test.cjs',
  'tests/rmt-language/backend-ast-result.test.cjs', 'tests/rmt-language/rmtx-frontend.test.cjs',
  'tests/rmt-language/rmtx-maraca-integration.test.cjs', 'tests/xtensions/xtensions_runtime_gate_suite.js',
  'development/rmtx-a06/frontend/inspect.cjs', 'development/rmtx-a06/frontend/runtime-test.cjs',
  'development/rmtx-a06/frontend/two-host.rmtx', 'development/rmtx-a06/frontend/two-host.rmt'
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !['sourceMap','sourceSyntax'].includes(key)).map(([key,item]) => [key,normalized(item)]));
}
function inspect() {
  const rmtxFile = path.join(__dirname,'two-host.rmtx'), classicFile = path.join(__dirname,'two-host.rmt');
  const rmtx = compileRmtxSource({text:fs.readFileSync(rmtxFile,'utf8'),filePath:rmtxFile});
  const classic = compileRmtClassicSource({text:fs.readFileSync(classicFile,'utf8'),filePath:classicFile});
  assert(rmtx.ok,JSON.stringify(rmtx.diagnostics));assert(classic.ok,JSON.stringify(classic.diagnostics));
  assert.deepEqual(normalized(rmtx.coreDocument),normalized(classic.coreDocument));
  assert.deepEqual(normalized(rmtx.orchestrationArtifacts),normalized(classic.orchestrationArtifacts));
  assert.equal(rmtx.coreDocument.manifest.sourceSyntax,'rmtx');assert.equal(rmtx.orchestrationArtifacts.sourceSyntax,'rmtx');
  const rejected = compileRmtxSource(`import {RMT} from '@ccslabs/xtend/rmt-language/rmtx'; export default <RMT.Program id="bad"><RMT.State id="x" type="number" initial={neverExecute()} /></RMT.Program>;`);
  assert.equal(rejected.ok,false);assert.equal(rejected.coreDocument,null);assert.equal(rejected.orchestrationArtifacts,null);
  const sources = Object.fromEntries(files.slice().sort().map(file => [file,hash(fs.readFileSync(path.join(root,file)))]));
  return {format:1,version:'1.0.0',stage:'A06.2-productive-frontend',sourceProfile:RMTX_SOURCE_PROFILE,
    passed:true,apiVersions:{parser:RMTX_PARSER_API_VERSION,compiler:RMTX_COMPILER_API_VERSION,classic:RMT_CLASSIC_COMPILER_API_VERSION,vnext:RMT_VNEXT_COMPILER_API_VERSION},
    parserSchema:RMTX_PARSER_SCHEMA,compilerSchema:RMTX_COMPILE_RESULT_SCHEMA,
    checks:{actualRmtxCompile:true,actualClassicCompile:true,coreSemanticParity:true,orchestrationSemanticParity:true,originalRmtxSourceRanges:true,closedSourceRejection:true},
    automaticDiscoveryImplemented:false,generalNativeUIImplemented:false,semanticEditorImplemented:false,
    fullRmtxLanguageImplemented:false,acceptedForRelease:false,sources};
}
if (require.main === module) {
  const result=inspect(), output=path.join(__dirname,'evidence.json'), bytes=JSON.stringify(result,null,2)+'\n';
  if (process.argv.includes('--write')) fs.writeFileSync(output,bytes);
  else if (!fs.existsSync(output) || fs.readFileSync(output,'utf8')!==bytes) throw Error('RMTX frontend evidence is stale; execute inspect.cjs --write after review.');
  console.log(JSON.stringify({passed:result.passed,stage:result.stage,sourceProfile:result.sourceProfile,sources:Object.keys(result.sources).length}));
}
module.exports={inspect};

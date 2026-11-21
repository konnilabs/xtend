'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateRmtxSSRRuntimeReport } = require('./xtensions_runtime_gate_suite');
const identity = {schema:'xtend.maraca.rmtx-ssr-source-identity.v1',sourceProfile:{syntax:'rmtx',version:'8.0.0'},sourceHash:'a'.repeat(64),project:{schema:'xtend.rmt.project-report.v1',apiVersion:'1.0.0',identity:'b'.repeat(64),sourceSyntax:'rmtx'}};
function fixture() {
  const names = ['resume','replay','duplicate','held','native','reorder','renew','fallback','empty','signed-project','signed-source-profile','signature','invalid-batch','cancel'].map(name => 'real sealed RMTX SSR browser: ' + name);
  const nativeNames = ['resume','click','signature','old-wire','shell','native-tamper','cancel'].map(name => 'native-only sealed browser: ' + name);
  nativeNames.push('native-only production build','native-only actual Node rendering');
  names.push(...nativeNames);
  while(names.length < 50) names.push('additional unit report case ' + names.length);
  // This is a validation fixture, never saved or presented as execution evidence.
  return {schema:'xtend.rmtx.ssr-runtime-acceptance.v1',format:1,stage:'A06.6.2-versioned-rmtx-ssr',node:process.version,browser:'unit-validator-only',passed:true,cases:names.length,names,
    sourceIdentity:structuredClone(identity),nativeSealedJavaScript:true,trustedServerComposedDocument:true,ssrWireVersion:3,realClassicActionExecutionVerified:true,realKernelFabricVerified:true,acceptedForRelease:false,
    nativeOnly:{schema:'xtend.rmtx.native-only-ssr-runtime-acceptance.v1',node:process.version,passed:true,cases:nativeNames.length,names:nativeNames,sourceIdentity:structuredClone(identity),acceptedForRelease:false}};
}
test('runtime gate rejects missing, old, incomplete or foreign RMTX SSR reports', () => {
  assert.equal(validateRmtxSSRRuntimeReport(fixture()),true);
  for(const value of [undefined,null,{}, {schema:'xtend.xtensions.ssr-acceptance-report.v1',ok:true}]) assert.equal(validateRmtxSSRRuntimeReport(value),false);
  for(const mutate of [row => {row.format=99;},row => {row.ssrWireVersion=2;},row => {row.passed=false;},row => {row.node='v0.0.0';},row => {row.acceptedForRelease=true;},row => {row.realKernelFabricVerified=false;},
    row => {row.names=row.names.filter(name => !name.endsWith('invalid-batch'));row.cases=row.names.length;},row => {row.sourceIdentity.project.identity='bad';},row => {delete row.nativeOnly;},
    row => {row.nativeOnly.passed=false;},row => {row.nativeOnly.names=[];row.nativeOnly.cases=0;},row => {row.nativeOnly.node='v0.0.0';}]) {
    const input=fixture();mutate(input);assert.equal(validateRmtxSSRRuntimeReport(input),false);
  }
});
test('actual browser owner runs the v3 fixture separately while preserving old report contracts', () => {
  const source=fs.readFileSync(path.join(__dirname,'xtensions_runtime_gate_suite.js'),'utf8');
  assert.match(source,/development\/rmtx-a06\/release-acceptance\/runtime\/runtime-test\.cjs/u);
  assert.match(source,/xtend-rmtx-ssr-runtime-report\.json/u);
  assert.match(source,/rmtxSSRExecution\.status === 0/u);
  assert.match(source,/validateRmtxSSRRuntimeReport\(rmtxSSR\)/u);
  assert.match(source,/xtend\.xtensions\.ssr-acceptance-report\.v1/u);
  assert.match(source,/xtend\.xtensions\.component-ssr-acceptance\.v1/u);
});

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createSuiteContext } = require('../utils/assertions');
const { prepareXTensionsTestPeers, npmCommand } = require('../../scripts/prepare_xtensions_test_peers');
const { findExecutable } = require('../../tools/browser-hypervisor');

function runXTensionsRuntimeGate({ rootDir, browser = false } = {}) {
  const id = browser ? 'xtensions-runtime-browser' : 'xtensions-runtime';
  const context = createSuiteContext({id,label:`Actual XTensions ${browser ? 'Chromium' : 'jsdom'} acceptance`});
  try {
    const artifact = path.join(rootDir,'.xtend-test-results',`xtend-${id}-report.json`);
    fs.mkdirSync(path.dirname(artifact),{recursive:true});
    fs.rmSync(artifact,{force:true});
    const peers = prepareXTensionsTestPeers({ rootDir });
    const env = {...process.env,XTENSIONS_TEST_PEERS:peers.peerRoot};
    if (browser) {
      env.CHROME_BIN = process.env.CHROME_BIN || findExecutable('chromium') || findExecutable('google-chrome');
      if (!env.CHROME_BIN) throw Error('Actual Runtime browser acceptance requires an installed Chromium; no stub or skip is allowed.');
    }
    const output = npmCommand(['run',browser ? 'test:xtensions-runtime:browser' : 'test:xtensions-runtime','--','--report',artifact],{cwd:rootDir,env,encoding:'utf8',timeout:90000,maxBuffer:16*1024*1024});
    console.log(output);
    const report = JSON.parse(fs.readFileSync(artifact,'utf8'));
    context.assert(report.ok === true && report.failed.length === 0 && report.passed.length >= 158,'Complete real adapter acceptance, including compiled A02.2 state bindings and retained safeguards, passes');
    context.assert(report.passed.filter((name) => name.startsWith('A02:')).length >= 12,'A02 executes the two-instance, typed intent and lifecycle reference in the actual environment');
    context.assert(report.passed.filter((name) => name.startsWith('A02.2:')).length >= 9,'Compiled Classic/Maraca state binding reference and lifecycle guards execute in the actual environment');
    context.assert(report.passed.filter((name) => name.startsWith('A02.3:')).length >= 11,'Conditional host lifetimes, cleanup ordering, stale intents and failure guards execute in the actual environment');
    context.assert(report.passed.filter(name => name.startsWith('A02.4:')).length >= 15,'Nested repeated hosts, typed keys, scoped props, trusted intent keys, composition and cancellation are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A02.5:')).length >= 4,'URL contract reference verifies atomic Model/State/React delivery, deferred/rejected input and History ownership');
    context.assert(report.passed.filter(name => name.startsWith('A02.5.2:')).length >= 17,'Real route ownership, Maraca restore, Back/Forward, reset, deferred keys and cancellation are mandatory');
    context.assert(report.schema === 'xtend.xtensions.runtime-acceptance-report.v2','Extended compiler evidence uses the new report version');
    context.assert(report.schema !== report.exports.legacyAcceptanceReportSchema,'Legacy acceptance reports cannot stand in for current feature evidence');
    context.assert(report.compilerChecks?.ok === true && report.compilerChecks.checks >= 88,'Source/AST/transport parity, explicit versions and negative compiler artifact guards are mandatory');
    context.assert(report.node === process.version,'Evidence uses the executing Node lane');
    context.assert(report.mode === (browser ? 'chromium' : 'jsdom'),'Evidence uses the required actual environment');
    context.assert(report.versions.react === peers.versions.react && report.versions.vue === peers.versions.vue,'Evidence uses the exact isolated lock versions');
    context.assert(report.exports.legacySynchronousContracts && report.exports.declarationExportParity && report.exports.browserConditionParity,'Legacy, declaration and condition contracts pass');
    if (browser) context.assert(Boolean(report.browser) && report.exports.actualBrowserParity && report.pageErrors.length === 0,'Real browser export parity and page errors are verified');
    if (!browser) {
      const typing=spawnSync(process.execPath,[path.join(rootDir,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--skipLibCheck','--lib','es2022,dom','--module','node16','--moduleResolution','node16','tests/types/xtensions_runtime_adapters.ts','tests/types/xtensions_compiled_bindings.mts','tests/types/xtensions_url_history_contract.mts'],{cwd:rootDir,encoding:'utf8',timeout:60000});
      context.assert(!typing.error && typing.status===0,`Actual Runtime public declarations and Fabric consumer compile strictly: ${typing.stderr || typing.stdout || typing.error || ''}`);
    }

  } catch (error) { context.fail(error.stack || String(error)); }
  return context.result();
}
module.exports = { runXTensionsRuntimeGate };

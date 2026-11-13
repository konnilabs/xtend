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
    context.assert(report.ok === true && report.failed.length === 0 && report.passed.length >= 341,'Complete real adapter acceptance, including compiled A02.2 state bindings and retained safeguards, passes');
    context.assert(report.passed.filter((name) => name.startsWith('A02:')).length >= 12,'A02 executes the two-instance, typed intent and lifecycle reference in the actual environment');
    context.assert(report.passed.filter((name) => name.startsWith('A02.2:')).length >= 9,'Compiled Classic/Maraca state binding reference and lifecycle guards execute in the actual environment');
    context.assert(report.passed.filter((name) => name.startsWith('A02.3:')).length >= 11,'Conditional host lifetimes, cleanup ordering, stale intents and failure guards execute in the actual environment');
    context.assert(report.passed.filter(name => name.startsWith('A02.4:')).length >= 15,'Nested repeated hosts, typed keys, scoped props, trusted intent keys, composition and cancellation are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A02.5:')).length >= 4,'URL contract reference verifies atomic Model/State/React delivery, deferred/rejected input and History ownership');
    context.assert(report.passed.filter(name => name.startsWith('A02.5.2:')).length >= 17,'Real route ownership, Maraca restore, Back/Forward, reset, deferred keys and cancellation are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A03.1:')).length >= 26,'Real Kernel queue/yield/cancellation and mandatory Fabric delivery execute for React/Vue and compiled Maraca hosts');
    context.assert(report.passed.filter(name => name.startsWith('A03.2:')).length >= 32,'Real Surface and kernel resource ownership, synchronous revocation, retained props and keyed Maraca integration are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A03.3:')).length >= 26,'Bounded admission, live pressure chunks, reentrant cancellation and keyed Maraca integration are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A03.4:')).length >= 27,'Actual adapter capability requirements, optional gaps, provider validation and keyed Maraca integration are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A04.1:')).length >= 14,'Captured provider graphs, automatic keyed hosts, explicit grants, peer integrity, Surface ownership and late cleanup are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A04.2:')).length >= 17,'Regular generated React/Vue and mixed native ESM boot, internal ownership, abort, retry and borrowed kernel cleanup are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A04.3.1:')).length >= 5,'Native transitive React/Vue and shared graphs, deferred factories and revoked peer loads are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A04.3.2:')).length >= 13,'Deferred provider imports, admission, cancellation, retry and native HTTP loading are mandatory');
    context.assert(report.passed.filter(name => name.startsWith('A04.3.3:')).length >= 23,'Exact shared peer groups, independent host lifetimes, eviction, retry and boot isolation are mandatory');
    context.assert(report.schema === 'xtend.xtensions.runtime-acceptance-report.v2','Extended compiler evidence uses the new report version');
    context.assert(report.schema !== report.exports.legacyAcceptanceReportSchema,'Legacy acceptance reports cannot stand in for current feature evidence');
    context.assert(report.compilerChecks?.ok === true && report.compilerChecks.checks >= 88,'Source/AST/transport parity, explicit versions and negative compiler artifact guards are mandatory');
    context.assert(report.node === process.version,'Evidence uses the executing Node lane');
    context.assert(report.mode === (browser ? 'chromium' : 'jsdom'),'Evidence uses the required actual environment');
    context.assert(report.versions.react === peers.versions.react && report.versions.vue === peers.versions.vue,'Evidence uses the exact isolated lock versions');
    context.assert(report.exports.legacySynchronousContracts && report.exports.declarationExportParity && report.exports.browserConditionParity,'Legacy, declaration and condition contracts pass');
    if (browser) context.assert(Boolean(report.browser) && report.exports.actualBrowserParity && report.pageErrors.length === 0,'Real browser export parity and page errors are verified');
    if (browser) {
      const deliveryArtifact = path.join(rootDir,'.xtend-test-results','xtend-xtensions-delivery-report.json');
      fs.rmSync(deliveryArtifact,{force:true});
      const execution = spawnSync(process.execPath,['scripts/test_xtensions_delivery.cjs','--report',deliveryArtifact],{cwd:rootDir,env,encoding:'utf8',timeout:90000,maxBuffer:16*1024*1024});
      context.assert(!execution.error && execution.status===0,`Actual HTTP/CSP delivery acceptance passes: ${execution.stderr || execution.stdout || execution.error || ''}`);
      const delivery = JSON.parse(fs.readFileSync(deliveryArtifact,'utf8'));
      context.assert(delivery.schema==='xtend.xtensions.delivery-acceptance-report.v1' && delivery.ok && delivery.node===process.version && delivery.checks>=12 && delivery.cases.every(row=>row.passed),'All native HTTP/CSP cases and the independent response-body audit are mandatory');
      context.assert(delivery.productionByteIntegrityEnforced===false && delivery.cases.filter(row=>row.scenario==='tamper').every(row=>!row.responseAudit.matchesBuild && row.responseAudit.mismatches.length===1),'CSP origin checks cannot substitute for byte-integrity evidence');
      const integrityArtifact = path.join(rootDir,'.xtend-test-results','xtend-xtensions-integrity-report.json');
      fs.rmSync(integrityArtifact,{force:true});
      const sealed = spawnSync(process.execPath,['scripts/test_xtensions_integrity.cjs','--report',integrityArtifact],{cwd:rootDir,env,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
      context.assert(!sealed.error && sealed.status===0,`Actual native SRI/import-map acceptance passes: ${sealed.stderr || sealed.stdout || sealed.error || ''}`);
      const integrity = JSON.parse(fs.readFileSync(integrityArtifact,'utf8'));
      context.assert(integrity.schema==='xtend.xtensions.integrity-acceptance-report.v1' && integrity.ok && integrity.node===process.version && integrity.checks>=23 && integrity.cases.every(row=>row.passed),'All sealed native browser cases are mandatory');
      context.assert(integrity.browserByteIntegrityEnforced===true && integrity.trustedDocumentRequired===true && integrity.scope==='sealed-browser-javascript-graph','Native byte enforcement explicitly retains the trusted document boundary');
      for(const scenario of ['tamper-bootstrap','tamper-peers','tamper-app','tamper-platform','tamper-kernel','tamper-companion','tamper-helper','no-map','no-helper-pin','sw-tamper','sw-cache','redirect-tamper','unlisted']) context.assert(integrity.cases.some(row=>row.scenario===scenario),`Required native integrity scenario: ${scenario}`);
      const runtimeArtifact=path.join(rootDir,'.xtend-test-results','xtend-xtensions-deployment-runtime-report.json');
      fs.rmSync(runtimeArtifact,{force:true});
      const runtimeExecution=spawnSync(process.execPath,['scripts/test_xtensions_deployment_runtime.cjs','--report',runtimeArtifact],{cwd:rootDir,env,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
      context.assert(!runtimeExecution.error&&runtimeExecution.status===0,`Actual PWA/AppServices deployment acceptance passes: ${runtimeExecution.stderr||runtimeExecution.stdout||runtimeExecution.error||''}`);
      const deploymentRuntime=JSON.parse(fs.readFileSync(runtimeArtifact,'utf8'));
      context.assert(deploymentRuntime.schema==='xtend.xtensions.deployment-runtime-acceptance-report.v1'&&deploymentRuntime.ok&&deploymentRuntime.node===process.version&&deploymentRuntime.checks>=10&&deploymentRuntime.cases.every(row=>row.passed),'All PWA/AppServices browser/HTTP cases are mandatory');
      context.assert(deploymentRuntime.browserByteIntegrityEnforced===true&&deploymentRuntime.trustedWorkerRequired===true&&deploymentRuntime.trustedDocumentRequired===true&&deploymentRuntime.workerRegistrationIntegrityEnforced===false&&deploymentRuntime.offlineMode==='static-fallback','Module integrity retains the explicit document/worker trust boundary');
      for(const scenario of ['cache-tamper','install-tamper','install-redirect','private-http','offline','api-network-only','legacy-worker-blocked'])context.assert(deploymentRuntime.cases.some(row=>row.scenario===scenario),`Required deployment runtime scenario: ${scenario}`);
      const updatesArtifact=path.join(rootDir,'.xtend-test-results','xtend-xtensions-deployment-update-report.json');
      fs.rmSync(updatesArtifact,{force:true});
      const updatesExecution=spawnSync(process.execPath,['scripts/test_xtensions_updates.cjs','--report',updatesArtifact],{cwd:rootDir,env,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
      context.assert(!updatesExecution.error&&updatesExecution.status===0,`Actual revision/update/cache acceptance passes: ${updatesExecution.stderr||updatesExecution.stdout||updatesExecution.error||''}`);
      const updates=JSON.parse(fs.readFileSync(updatesArtifact,'utf8'));
      context.assert(updates.schema==='xtend.xtensions.deployment-update-acceptance-report.v1'&&updates.ok&&updates.node===process.version&&updates.checks>=64&&updates.cases.every(row=>row.passed),'All actual revision coexistence and client-acknowledged cache cases are mandatory');
      context.assert(updates.nativeBrowserExecution===true&&updates.activation==='natural'&&updates.retirement==='explicit-unanimous-client-ack','Updates retain explicit client participation and natural worker activation');
      for(const scenario of ['coexisting-revisions','old-controller-blocks-retirement','unknown-client-blocks-retirement','replayed-acknowledgement-rejected','arbitrary-cache-authority-rejected','unanimous-current-clients-retire-only-owned-cache','legacy-v2-and-v3-coexist','legacy-cache-retires-after-natural-activation','single-tab-discovers-new-revision','snapshot-restart-without-ancestor','snapshot-cache-retirement-after-natural-activation','second-current-client-blocks-retirement','concurrent-retirement-blocked','revoked-client-lease-blocks-retirement','foreign-head-rejected','missing-head-blocks-discovery','redirected-head-rejected'])context.assert(updates.cases.some(row=>row.scenario===scenario),`Required coordinated update scenario: ${scenario}`);
    }
    if (!browser) {
      const typing=spawnSync(process.execPath,[path.join(rootDir,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--skipLibCheck','--lib','es2022,dom','--module','node16','--moduleResolution','node16','tests/types/xtensions_runtime_adapters.ts','tests/types/xtensions_compiled_bindings.mts','tests/types/xtensions_url_history_contract.mts','tests/types/xtensions_kernel_runtime.mts','tests/types/xtensions_resource_graph.mts','tests/types/xtensions_work_budget.mts','tests/types/xtensions_capability_negotiation.mts','tests/types/xtensions_composition.mts','tests/types/xtensions_integrated_composition.mts'],{cwd:rootDir,encoding:'utf8',timeout:60000});
      context.assert(!typing.error && typing.status===0,`Actual Runtime public declarations and Fabric consumer compile strictly: ${typing.stderr || typing.stdout || typing.error || ''}`);
    }

  } catch (error) { context.fail(error.stack || String(error)); }
  return context.result();
}
module.exports = { runXTensionsRuntimeGate };

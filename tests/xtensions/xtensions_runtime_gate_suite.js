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
    const scopedArtifact=path.join(rootDir,'.xtend-test-results','xtend-component-scopes-report.json');
    fs.rmSync(scopedArtifact,{force:true});
    const scopedExecution=spawnSync(process.execPath,['development/rmtx-a06/scoped-test.cjs',...(browser?['--browser']:[]),'--output',scopedArtifact],{cwd:rootDir,env,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
    context.assert(!scopedExecution.error&&scopedExecution.status===0,`Actual component key scopes pass: ${scopedExecution.stderr||scopedExecution.stdout||scopedExecution.error||''}`);
    const scoped=JSON.parse(fs.readFileSync(scopedArtifact,'utf8'));
    context.assert(scoped.schema==='xtend.xtensions.component-scope-acceptance.v1'&&scoped.passed&&scoped.node===process.version&&scoped.cases>=6&&scoped.mode===(browser?'chromium-sealed-native-esm':'jsdom-native-esm')&&(!browser||Boolean(scoped.browserVersion)&&scoped.pageErrors.length===0)&&scoped.typedKeyScopes&&scoped.ssrAcceptancePerformed===false,'Nested typed component scopes, lifetime and State paths are independently required');
    const rmtxArtifact = path.join(rootDir, '.xtend-test-results', `xtend-rmtx-frontend-runtime-${browser ? 'browser' : 'node'}-report.json`);
    fs.rmSync(rmtxArtifact, { force: true });
    const rmtxExecution = spawnSync(process.execPath, ['development/rmtx-a06/frontend/runtime-test.cjs', ...(browser ? ['--browser'] : []), '--output', rmtxArtifact], {
      cwd: rootDir, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024
    });
    context.assert(!rmtxExecution.error && rmtxExecution.status === 0, `Actual productive RMTX frontend acceptance passes: ${rmtxExecution.stderr || rmtxExecution.stdout || rmtxExecution.error || ''}`);
    const rmtx = JSON.parse(fs.readFileSync(rmtxArtifact, 'utf8'));
    context.assert(rmtx.schema === 'xtend.rmtx.frontend-runtime-acceptance.v1' && rmtx.passed && rmtx.node === process.version && rmtx.cases >= 8
      && rmtx.mode === (browser ? 'chromium-sealed-native-esm' : 'jsdom-native-esm')
      && (!browser || Boolean(rmtx.browserVersion) && rmtx.pageErrors.length === 0)
      && rmtx.compiler?.schema === 'xtend.rmtx.compile-result.v1' && rmtx.compiler.planCompilerSchema === rmtx.compiler.schema
      && rmtx.compiler.sourceProfile?.syntax === 'rmtx' && rmtx.compiler.sourceProfile.version === '1.0.0'
      && rmtx.productiveRmtxFrontendUsed === true && rmtx.completeRmtxFrontendImplemented === false && rmtx.acceptedForRelease === false,
    'RMTX source must use the productive compiler and generated React/Vue host chain with explicit source profile and retained release limits');
    const selectorArtifact = path.join(rootDir, '.xtend-test-results', `xtend-rmtx-selector-runtime-${browser ? 'browser' : 'node'}-report.json`);
    fs.rmSync(selectorArtifact, { force: true });
    const selectorExecution = spawnSync(process.execPath, ['development/rmtx-a06/selector-profile/runtime-test.cjs', ...(browser ? ['--browser'] : []), '--output', selectorArtifact], {
      cwd: rootDir, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024
    });
    context.assert(!selectorExecution.error && selectorExecution.status === 0, `Actual RMTX selector/action/provider acceptance passes: ${selectorExecution.stderr || selectorExecution.stdout || selectorExecution.error || ''}`);
    const selector = JSON.parse(fs.readFileSync(selectorArtifact, 'utf8'));
    context.assert(selector.schema === 'xtend.rmtx.selector-runtime-acceptance.v1' && selector.passed && selector.node === process.version && selector.cases >= 11
      && selector.mode === (browser ? 'chromium-sealed-native-esm' : 'jsdom-native-esm')
      && (!browser || Boolean(selector.browserVersion) && selector.pageErrors.length === 0)
      && selector.compiler?.schema === 'xtend.rmtx.compile-result.v2' && selector.compiler.planCompilerSchema === selector.compiler.schema
      && selector.compiler.sourceProfile?.syntax === 'rmtx' && selector.compiler.sourceProfile.version === '2.0.0'
      && selector.existingAutomaticCases >= 8 && selector.selectorActionModelPropsCases >= 3 && selector.selectorActionModelPropsVerified === true
      && selector.productiveRmtxFrontendUsed === true && selector.completeRmtxFrontendImplemented === false
      && selector.ssrAcceptancePerformed === false && selector.acceptedForRelease === false,
    'Opt-in RMTX v2 selectors must actually drive Actions, Model and React props while preserving Vue roots and owner staging');
    const keyedArtifact = path.join(rootDir, '.xtend-test-results', `xtend-rmtx-keyed-runtime-${browser ? 'browser' : 'node'}-report.json`);
    fs.rmSync(keyedArtifact, { force: true });
    const keyedExecution = spawnSync(process.execPath, ['development/rmtx-a06/keyed-profile/runtime-test.cjs', ...(browser ? ['--browser'] : []), '--output', keyedArtifact], {
      cwd: rootDir, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024
    });
    context.assert(!keyedExecution.error && keyedExecution.status === 0, `Actual RMTX typed host-scope acceptance passes: ${keyedExecution.stderr || keyedExecution.stdout || keyedExecution.error || ''}`);
    const keyed = JSON.parse(fs.readFileSync(keyedArtifact, 'utf8'));
    context.assert(keyed.schema === 'xtend.rmtx.keyed-runtime-acceptance.v1' && keyed.passed && keyed.node === process.version && keyed.cases >= 9
      && keyed.mode === (browser ? 'chromium-sealed-native-esm' : 'jsdom-native-esm')
      && (!browser || Boolean(keyed.browserVersion) && keyed.pageErrors.length === 0)
      && keyed.compiler?.schema === 'xtend.rmtx.compile-result.v3' && keyed.compiler.planCompilerSchema === keyed.compiler.schema
      && keyed.compiler.sourceProfile?.syntax === 'rmtx' && keyed.compiler.sourceProfile.version === '3.0.0'
      && keyed.compiler.hostScopesSchema === 'xtend.rmtx.host-scopes.v1'
      && keyed.compileChecks?.passed === true && keyed.compileChecks.checks >= 7
      && keyed.sourceHostScopesVerified === true && keyed.typedKeyScopes === true && keyed.trustedIntentKeysVerified === true
      && keyed.booleanPresenceVerified === true && keyed.nativeRepeatSupported === false
      && keyed.productiveRmtxFrontendUsed === true && keyed.completeRmtxFrontendImplemented === false
      && keyed.ssrAcceptancePerformed === false && keyed.acceptedForRelease === false,
    'Opt-in RMTX v3 source scopes must drive real typed React/Vue lifetimes, trusted intent keys, boolean presence and retained owner staging');
    const orchestrationArtifact = path.join(rootDir, '.xtend-test-results', `xtend-rmtx-orchestration-runtime-${browser ? 'browser' : 'node'}-report.json`);
    fs.rmSync(orchestrationArtifact, { force: true });
    const orchestrationExecution = spawnSync(process.execPath, ['development/rmtx-a06/orchestration-profile/runtime-test.cjs', ...(browser ? ['--browser'] : []), '--output', orchestrationArtifact], {
      cwd: rootDir, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024
    });
    context.assert(!orchestrationExecution.error && orchestrationExecution.status === 0, `Actual RMTX inline orchestration acceptance passes: ${orchestrationExecution.stderr || orchestrationExecution.stdout || orchestrationExecution.error || ''}`);
    const orchestration = JSON.parse(fs.readFileSync(orchestrationArtifact, 'utf8'));
    context.assert(orchestration.schema === 'xtend.rmtx.orchestration-runtime-acceptance.v1' && orchestration.passed && orchestration.node === process.version && orchestration.cases >= 12
      && orchestration.mode === (browser ? 'chromium-sealed-native-esm' : 'jsdom-native-esm')
      && (!browser || Boolean(orchestration.browserVersion) && orchestration.pageErrors.length === 0)
      && orchestration.compiler?.schema === 'xtend.rmtx.compile-result.v4' && orchestration.compiler.planCompilerSchema === orchestration.compiler.schema
      && orchestration.compiler.sourceProfile?.syntax === 'rmtx' && orchestration.compiler.sourceProfile.version === '4.0.0'
      && orchestration.compiler.hostScopesSchema === 'xtend.rmtx.host-scopes.v2'
      && orchestration.compileChecks?.passed === true && orchestration.compileChecks.checks >= 10
      && orchestration.sourceHostScopesVerified === true && orchestration.typedKeyScopes === true && orchestration.trustedIntentKeysVerified === true
      && orchestration.booleanPresenceVerified === true && orchestration.nativeRepeatSupported === false
      && orchestration.inlineBindingsVerified === true && orchestration.selectorProjectionVerified === true && orchestration.providerDefaultsVerified === true
      && orchestration.nativeInputValidationVerified === true
      && orchestration.projectionURLStateVerified === true
      && orchestration.xrouterProjectionURLStateVerified === true
      && orchestration.componentContract === 'xtend.maraca.xtension-composition-artifact.v9'
      && orchestration.productiveRmtxFrontendUsed === true && orchestration.completeRmtxFrontendImplemented === false
      && orchestration.ssrAcceptancePerformed === false && orchestration.acceptedForRelease === false,
    'Opt-in RMTX v4 inline declarations must drive actual React/Vue hosts, projected Model and selector props, provider defaults and validated intent boundaries');
    const nativeArtifact = path.join(rootDir, '.xtend-test-results', `xtend-rmtx-native-view-runtime-${browser ? 'browser' : 'node'}-report.json`);
    fs.rmSync(nativeArtifact, { force: true });
    const nativeExecution = spawnSync(process.execPath, ['development/rmtx-a06/native-view-profile/runtime-test.cjs', ...(browser ? ['--browser'] : []), '--output', nativeArtifact], {
      cwd: rootDir, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024
    });
    context.assert(!nativeExecution.error && nativeExecution.status === 0, `Actual RMTX native HTML View acceptance passes: ${nativeExecution.stderr || nativeExecution.stdout || nativeExecution.error || ''}`);
    const native = JSON.parse(fs.readFileSync(nativeArtifact, 'utf8'));
    context.assert(native.schema === 'xtend.rmtx.native-view-runtime-acceptance.v1' && native.passed && native.node === process.version && native.cases >= 20
      && native.mode === (browser ? 'chromium-sealed-native-esm' : 'jsdom-native-esm')
      && (!browser || Boolean(native.browserVersion) && native.pageErrors.length === 0)
      && native.compiler?.schema === 'xtend.rmtx.compile-result.v5' && native.compiler.planCompilerSchema === native.compiler.schema
      && native.compiler.sourceProfile?.syntax === 'rmtx' && native.compiler.sourceProfile.version === '5.0.0'
      && native.compiler.hostScopesSchema === 'xtend.rmtx.host-scopes.v3'
      && native.compileChecks?.passed === true && native.compileChecks.checks >= 12
      && native.productiveNativeViewVerified === true && native.nativeDOMIdentityVerified === true && native.nativePreflightVerified === true
      && native.nativeOnlyKernelFabricVerified === true && native.nativeURLStateVerified === true && native.xrouterNativeURLStateVerified === true
      && native.nativeRepeatSupported === true && native.nativeHtmlViewImplemented === true
      && native.componentContract === 'xtend.maraca.xtension-composition-artifact.v10'
      && native.productiveRmtxFrontendUsed === true && native.completeA064Implemented === false && native.completeRmtxFrontendImplemented === false
      && native.ssrAcceptancePerformed === false && native.acceptedForRelease === false,
    'Opt-in Source5 must execute native typed DOM loops, prospective validation, real Kernel/Fabric and Native URL/Router paths alongside React/Vue without claiming lifecycle or SSR completion');
    const lifecycleArtifact = path.join(rootDir, '.xtend-test-results', `xtend-rmtx-native-lifecycle-runtime-${browser ? 'browser' : 'node'}-report.json`);
    fs.rmSync(lifecycleArtifact, { force: true });
    const lifecycleExecution = spawnSync(process.execPath, ['development/rmtx-a06/lifecycle-profile/runtime-test.cjs', ...(browser ? ['--browser'] : []), '--output', lifecycleArtifact], {
      cwd: rootDir, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024
    });
    context.assert(!lifecycleExecution.error && lifecycleExecution.status === 0, `Actual RMTX lifecycle admission passes: ${lifecycleExecution.stderr || lifecycleExecution.stdout || lifecycleExecution.error || ''}`);
    const lifecycle = JSON.parse(fs.readFileSync(lifecycleArtifact, 'utf8'));
    context.assert(lifecycle.schema === 'xtend.rmtx.native-lifecycle-runtime-acceptance.v1' && lifecycle.passed && lifecycle.node === process.version && lifecycle.cases >= 8
      && lifecycle.mode === (browser ? 'chromium-sealed-native-esm' : 'jsdom-native-esm')
      && (!browser || Boolean(lifecycle.browserVersion) && lifecycle.pageErrors.length === 0)
      && lifecycle.compiler?.schema === 'xtend.rmtx.compile-result.v6' && lifecycle.compiler.sourceProfile?.version === '6.0.0'
      && lifecycle.compileChecks?.passed === true && lifecycle.compiler.compositionArtifactSchema === 'xtend.maraca.xtension-composition-artifact.v11'
      && lifecycle.compiler.programSchema === 'xtend.rmt.app-orchestration.v4' && lifecycle.compiler.buildPlanSchema === 'xtend.maraca.build-plan.v10'
      && lifecycle.realReactVueProviders === true && lifecycle.initialFalseVerified === true && lifecycle.kernelFabricVerified === true
      && lifecycle.completeA064Implemented === false && lifecycle.ssrAcceptancePerformed === false && lifecycle.acceptedForRelease === false,
    'Source6 must run conditional native admission through the real Model/Controller/Kernel/Fabric/provider chain while retaining release limits');
    const orchestratedArtifact = path.join(rootDir, '.xtend-test-results', `xtend-rmtx-native-orchestration-runtime-${browser ? 'browser' : 'node'}-report.json`);
    fs.rmSync(orchestratedArtifact, {force:true});
    const orchestratedExecution = spawnSync(process.execPath, ['--max-old-space-size=1024', 'development/rmtx-a06/native-orchestration-profile/runtime-test.cjs', ...(browser ? ['--browser'] : []), '--output', orchestratedArtifact], {
      cwd:rootDir, env, encoding:'utf8', timeout:180000, maxBuffer:16*1024*1024
    });
    context.assert(!orchestratedExecution.error && orchestratedExecution.status === 0, `Actual Source7 native orchestration passes: ${orchestratedExecution.stderr || orchestratedExecution.stdout || orchestratedExecution.error || ''}`);
    const orchestrated = JSON.parse(fs.readFileSync(orchestratedArtifact, 'utf8'));
    context.assert(orchestrated.schema === 'xtend.rmtx.native-orchestration-runtime-acceptance.v1' && orchestrated.passed && orchestrated.node === process.version && orchestrated.cases >= 9
      && orchestrated.mode === (browser ? 'chromium-sealed-native-esm' : 'jsdom-native-esm') && (!browser || Boolean(orchestrated.browserVersion) && orchestrated.pageErrors.length === 0)
      && orchestrated.compileChecks?.passed === true && orchestrated.compileChecks.checks >= 10
      && orchestrated.compiler?.schema === 'xtend.rmtx.compile-result.v7' && orchestrated.compiler.sourceProfile?.version === '7.0.0'
      && orchestrated.compiler.programSchema === 'xtend.rmt.app-orchestration.v5' && orchestrated.compiler.buildPlanSchema === 'xtend.maraca.build-plan.v11'
      && orchestrated.compiler.compositionArtifactSchema === 'xtend.maraca.xtension-composition-artifact.v12'
      && orchestrated.realReactVueProviders === true && orchestrated.kernelFabricVerified === true && orchestrated.stableTypedAddressesVerified === true && orchestrated.slotsVerified === true
      && orchestrated.staleProviderIntentVerified === true && orchestrated.acceptedForRelease === false && orchestrated.ssrAcceptancePerformed === false,
      'Source7 must execute actual typed native owners, slots and retained framework lifetimes through Kernel/Fabric without changing release acceptance');
    if(browser){
      const componentSSRArtifact=path.join(rootDir,'.xtend-test-results','xtend-component-ssr-report.json');fs.rmSync(componentSSRArtifact,{force:true});
      const execution=spawnSync(process.execPath,['development/rmtx-a06/scoped-ssr-test.cjs','--output',componentSSRArtifact],{cwd:rootDir,env,encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});
      context.assert(!execution.error&&execution.status===0,`Actual component SSR v2 passes: ${execution.stderr||execution.stdout||execution.error||''}`);
      const result=JSON.parse(fs.readFileSync(componentSSRArtifact,'utf8'));
      context.assert(result.schema==='xtend.xtensions.component-ssr-acceptance.v1'&&result.passed&&result.node===process.version&&result.cases>=35&&result.ssrWireVersion===2&&result.nativeSealedJavaScript&&result.trustedServerComposedDocument&&result.acceptedForRelease===false,'Actual signed component SSR, raw-provider replay and native adoption are mandatory');
    }
    if (browser) {
      const ssrArtifact = path.join(rootDir, '.xtend-test-results', 'xtend-xtensions-ssr-report.json');
      fs.rmSync(ssrArtifact, { force: true });
      const ssrExecution = spawnSync(process.execPath, ['scripts/test_xtensions_ssr.cjs', '--report', ssrArtifact], { cwd: rootDir, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
      context.assert(!ssrExecution.error && ssrExecution.status === 0, `Actual Node SSR/native adoption passes: ${ssrExecution.stderr || ssrExecution.stdout || ssrExecution.error || ''}`);
      const ssr = JSON.parse(fs.readFileSync(ssrArtifact, 'utf8'));
      context.assert(ssr.schema === 'xtend.xtensions.ssr-acceptance-report.v1' && ssr.ok && ssr.node === process.version && ssr.checks >= 84 && ssr.cases.every(row => row.passed), 'Actual SSR/restore/adoption/replay and separately reported fallback are mandatory');
      context.assert(Object.values(ssr.sizes).every(row => Number.isFinite(row.frameworkBytes) && row.frameworkBytes <= 2200000 && row.runtimeBytes <= 240000), 'SSR JavaScript stays fully inside the unchanged framework/runtime ceilings');
      context.assert(ssr.signedSnapshotRequired && ssr.restoreBeforeReplay && ssr.ownership === 'exclusive-container' && ssr.releaseAccepted === false, 'SSR retains signature, restore and bounded ownership contracts');
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

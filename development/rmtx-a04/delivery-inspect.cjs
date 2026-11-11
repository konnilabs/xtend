'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..'), reference = require('./integration-reference.cjs'), bindingsRuntime = require('../../tools/xtensions/state-binding');
const hash = value => createHash('sha256').update(value).digest('hex'), copy = value => JSON.parse(JSON.stringify(value));
async function inspect() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-a0434-')), names = [], sizes = {};
  const check = async (name, fn) => { await fn(); names.push(name); };
  const tool = require('../../xtend-maraca/xtension-composition'), maraca = require('../../xtend-maraca'), contract = await import('../../xtend-maraca/xtension-composition-contract.mjs');
  const runtime = await import('../../xtend-maraca/xtension-composition-runtime.mjs'), plan = require('./reference.cjs').createPlan();
  const manifest = reference.withDeliveryProfile(reference.createBuildInput('react', path.join(temp, 'unused'))).xtensionComposition;
  let capture;
  try {
    await check('v5 manifest builds API6 artifact/report with explicit delivery inventory', async () => {
      capture = await tool.buildMaracaXTensionComposition({ plan, manifest, bindingsRuntime, rootDir: root, outputDir: path.join(temp, 'manual') });
      assert.equal(tool.XTENSION_COMPOSITION_BUILD_API_VERSION, '8.0.0'); assert.equal(runtime.XTENSION_COMPOSITION_API_VERSION, '6.0.0');
      assert.equal(capture.schema, 'xtend.maraca.xtension-composition-build-report.v6'); assert.equal(capture.apiVersion, '6.0.0');
      const artifact = contract.validateArtifact(capture.artifact, plan, bindingsRuntime); assert.equal(artifact.apiVersion, '6.0.0'); assert.equal(artifact.loadPlan.schema, 'xtend.maraca.xtension-load-plan.v2'); assert(Object.isFrozen(artifact.manifest.delivery));
      const bytes = fs.readFileSync(path.join(temp, 'manual', capture.deliveryFile)), delivery = JSON.parse(bytes);
      assert.equal(capture.deliveryFile, `xtend.xtensions.delivery-${hash(bytes)}.json`); assert.equal(delivery.schema, 'xtend.maraca.xtension-delivery-plan.v1');
      assert.equal(delivery.entryFile, artifact.entryFile); assert.equal(delivery.mode, 'same-origin-external-esm'); assert.equal(delivery.scope, 'composition-graph'); assert.equal(delivery.runtimeDeliveryVerified, false);
      assert.deepEqual(delivery.files, capture.files.filter(row => row.fileName !== capture.deliveryFile).sort((a,b)=>a.fileName<b.fileName?-1:1));
      assert.equal(delivery.files.length, artifact.modules.length+1); assert.equal(delivery.headers['X-Content-Type-Options'], 'nosniff');
      assert.equal(delivery.headers['Content-Security-Policy'], "script-src 'self'; script-src-elem 'self'; script-src-attr 'none'; object-src 'none'; base-uri 'none'");
      assert(!delivery.headers['Content-Security-Policy'].includes('unsafe-')); assert.equal(delivery.javascriptContentType, 'text/javascript; charset=utf-8');
      for (const row of capture.files) { const value=fs.readFileSync(path.join(temp,'manual',row.fileName));assert.equal(hash(value),row.sha256);assert.equal(value.length,row.bytes); }
      assert.equal(capture.frameworkDependenciesBundled, false); assert.equal(capture.runtimeExecutionVerified, false);
    });
    for (const [label, mutate] of [
      ['missing policy', m => { delete m.delivery; }], ['unversioned policy', m => { delete m.delivery.schema; }],
      ['unknown version', m => { m.delivery.schema += '.unknown'; }], ['remote policy', m => { m.delivery.mode = 'cross-origin'; }],
      ['inline policy', m => { m.delivery.mode = 'inline'; }], ['extra CSP authority', m => { m.delivery.scriptSrc = ['*']; }],
      ['extra runtime proof', m => { m.delivery.runtimeDeliveryVerified = true; }],
      ['legacy manifest accepts no delivery field', m => { m.schema = 'xtend.maraca.xtension-composition-manifest.v4'; }]
    ]) await check(`reject ${label} before output`, async () => { const value=copy(manifest); mutate(value); const outputDir=path.join(temp,'invalid-'+names.length);await assert.rejects(tool.buildMaracaXTensionComposition({plan,manifest:value,bindingsRuntime,rootDir:root,outputDir}));assert(!fs.existsSync(outputDir)); });
    for (const [label, mutate] of [
      ['downgraded artifact', a => { a.schema = 'xtend.maraca.xtension-composition-artifact.v5'; a.apiVersion = '5.0.0'; }],
      ['wrong API', a => { a.apiVersion = '5.0.0'; }], ['mutated mode', a => { a.manifest.delivery.mode = 'unsafe'; }],
      ['injected proof', a => { a.runtimeDeliveryVerified = true; }]
    ]) await check(`reject ${label} before runtime ports`, () => { const value=copy(capture.artifact);mutate(value);assert.throws(()=>contract.validateArtifact(value,plan,bindingsRuntime)); });
    await check('legacy shared composition retains API5 and emits no new delivery inventory', async () => {
      const value=copy(manifest);value.schema='xtend.maraca.xtension-composition-manifest.v4';delete value.delivery;
      const old=await tool.buildMaracaXTensionComposition({plan,manifest:value,bindingsRuntime,rootDir:root,outputDir:path.join(temp,'legacy')});assert.equal(old.apiVersion,'5.0.0');assert.equal(old.artifact.schema,'xtend.maraca.xtension-composition-artifact.v5');assert(!old.deliveryFile);assert(!old.files.some(row=>row.fileName.includes('.delivery-')));
    });
    for (const framework of ['react','vue','mixed']) await check(`${framework}: strict regular build binds delivery files to unchanged ceilings`, async () => {
      const outputDir=path.join(temp,framework), input=reference.withDeliveryProfile(reference.createBuildInput(framework,outputDir,{profile:framework==='vue'?'max':'production'}));
      const built=await maraca.buildMaracaBundleAsync(input,{rootDir:root});assert(built.ok,JSON.stringify(built.plan.diagnostics));
      const report=JSON.parse(fs.readFileSync(path.join(outputDir,'xtend.xtensions.report.json'))),budget=built.sizeBudgetReport;
      assert.equal(report.artifact.schema,'xtend.maraca.xtension-composition-artifact.v6');assert.equal(budget.status,'within_budget');assert(budget.xtensions.withinBudget);assert(budget.framework.bytes<=2200000);assert(budget.xtensions.runtimeBytes<=240000);
      assert(budget.xtensions.runtimeFiles.some(row=>row.fileName===report.deliveryFile));assert(budget.accounting.files.some(row=>row.fileName===report.deliveryFile));
      sizes[framework]={frameworkBytes:budget.framework.bytes,xtensionRuntimeBytes:budget.xtensions.runtimeBytes};
      const target=path.join(outputDir,report.deliveryFile),bytes=fs.readFileSync(target),entry=built.bundleReport.bundleFiles.find(row=>row.fileName===report.deliveryFile);
      try {fs.writeFileSync(target,Buffer.concat([bytes,Buffer.from(' ')]));entry.bytes++;assert.throws(()=>maraca.createMaracaSizeBudgetReport({plan:built.plan,entryPath:built.plan.outputs.entry,entryBytes:built.bundleReport.bytes,bundleFiles:built.bundleReport.bundleFiles}),/captured build provenance/);}
      finally {fs.writeFileSync(target,bytes);entry.bytes--;}
    });
    await check('real CLI config v5 emits versioned external-script delivery headers', () => {
      const outputDir=path.join(temp,'cli'),config=path.join(temp,'config.json'),input=reference.withDeliveryProfile(reference.createBuildInput('react',outputDir,{profile:'production'}));
      fs.writeFileSync(config,JSON.stringify({schema:'xtend.maraca.build-config.v5',source:input.source,options:input}));
      const run=require('node:child_process').spawnSync(process.execPath,[path.join(root,'xtend-builder/bin/xt.js'),'maraca','build','--config',config],{cwd:root,env:process.env,encoding:'utf8',timeout:60000});assert.equal(run.status,0,run.stderr+run.stdout);
      const report=JSON.parse(fs.readFileSync(path.join(outputDir,'xtend.xtensions.report.json')));assert.equal(JSON.parse(fs.readFileSync(path.join(outputDir,report.deliveryFile))).runtimeDeliveryVerified,false);
    });
    const sources=['xtend-maraca/xtension-composition.js','xtend-maraca/xtension-composition-contract.mjs','xtend-maraca/xtension-composition-runtime.mjs','xtend-maraca/xtension-provider-graph.js','xtend-maraca/xtension-composition.d.ts','xtend-maraca/xtension-composition-runtime.d.ts','xtend-maraca/xtension-size-budget.js','xtend-maraca/browser-composition-runtime.mjs','xtend-maraca/browser-composition-runtime.d.ts','xtend-maraca/plan-runtime.mjs','xtend-maraca/plan-runtime.d.ts','development/rmtx-a04/integration-reference.cjs','development/rmtx-a04/delivery-inspect.cjs','scripts/test_xtensions_delivery.cjs','tests/xtensions/xtensions_runtime_gate_suite.js','tests/xtensions/xtensions_consumer_package_suite.js','tests/types/xtensions_integrated_composition.mts','scripts/check_release_preparation.cjs','tests/release/preparation-gates.test.cjs'];
    const evidence={format:1,stage:'A04.3.4-native-esm-delivery',status:'implemented',manifestVersion:5,artifactVersion:6,buildReportVersion:6,apiVersion:'6.0.0',loadPlanVersion:2,deliveryPolicyVersion:1,deliveryPlanVersion:1,browserCases:12,productionByteIntegrityEnforced:false,runtimeExecutionVerified:false,acceptedForRelease:false,checks:names.length,names,sizes,sources:Object.fromEntries(sources.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]))};
    const text=JSON.stringify(evidence,null,2)+'\n',output=path.join(__dirname,'delivery-evidence.json');if(process.argv.includes('--write'))fs.writeFileSync(output,text);if(process.argv.includes('--check'))assert.equal(fs.readFileSync(output,'utf8'),text,'A04.3.4 delivery source/contract drift');
    console.log(`A04.3.4: ${names.length} delivery/build/contract checks; real CSP/HTTP execution is a separate mandatory browser gate.`);return evidence;
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module)inspect().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={inspect};

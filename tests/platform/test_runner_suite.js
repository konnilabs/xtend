'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createSuiteContext } = require('../utils/assertions');
const { normalizeSuiteResult } = require('../utils/reporting');
const { parseArgs } = require('../../scripts/test-runner/cli');
const { catalog, select, canonicalSuite, scriptSuiteIds } = require('../../scripts/test-runner/catalog');
const { execute, verifyExecution } = require('../../scripts/test-runner/executor');

async function runTestRunnerSuite({ rootDir } = {}) {
  const context = createSuiteContext({ id: 'test-runner', label: 'Runner supervision and profiles' });
  const check = async (name, fn) => { try { await fn(); context.pass(name); } catch (error) { context.fail(`${name}: ${error.stack}`); } };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xt-runner-contract-'));
  const identity = { run: 'test', commit: 'fixture', sourceFingerprint: 'fixture', catalogFingerprint: 'fixture', runtime: { node: process.version } };
  try {
    await check('Catalog implementations and arguments match every lazy adapter', () => {
      const ts=require('typescript');
      const source=fs.readFileSync(path.join(rootDir,'scripts/test-runner/handlers.js'),'utf8');
      const ast=ts.createSourceFile('handlers.js',source,ts.ScriptTarget.Latest,true);
      const locals=new Map(ast.statements.filter(ts.isFunctionDeclaration).map(node=>[node.name.text,node]));
      const exported=ast.statements.find(node=>ts.isExpressionStatement(node)&&ts.isBinaryExpression(node.expression)&&node.expression.left.getText(ast)==='module.exports').expression.right;
      const handlers=new Map(exported.properties.map(node=>[node.name.text,node.initializer]));
      assert.equal(handlers.size,catalog.suites.length);
      assert.equal(new Set(catalog.suites.map(suite=>suite.id)).size,catalog.suites.length);
      const normalize=value=>value.replace(/load\([^)]+\)\["(\w+)"\]/g,'$1').replace(/\s+/g,' ').trim();
      for(const suite of catalog.suites){
        const implementations=[],visited=new Set();
        function walk(node){
          if(ts.isCallExpression(node)){
            const callee=node.expression;
            if((ts.isElementAccessExpression(callee)||ts.isPropertyAccessExpression(callee))&&ts.isCallExpression(callee.expression)&&callee.expression.expression.getText(ast)==='load'){
              const name=callee.argumentExpression?.text || callee.name.text;
              if(!name.startsWith('print')){
                const specifier=callee.expression.arguments[0].text;
                const file=path.resolve(rootDir,'scripts',specifier)+(path.extname(specifier)?'':'.js');
                implementations.push({path:path.relative(rootDir,file).split(path.sep).join('/'),function:name,arguments:node.arguments.map(arg=>normalize(arg.getText(ast)))});
              }
            } else if(ts.isIdentifier(callee)&&locals.has(callee.text)&&!visited.has(callee.text)){
              visited.add(callee.text);walk(locals.get(callee.text));
            }
          }
          ts.forEachChild(node,walk);
        }
        assert(handlers.has(suite.id),suite.id);walk(handlers.get(suite.id));
        assert.deepEqual(implementations,suite.implementations.map(implementation=>({...implementation,arguments:implementation.arguments.map(normalize)})),suite.id);
      }
    });
    await check('Profile parity and alias identity preserve explicit arguments', () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')));
      for (const [plain, report] of [['test:pr','test:pr:report'],['test:release:full','test:release:full:report']]) assert.deepEqual(scriptSuiteIds(manifest, plain), scriptSuiteIds(manifest, report));
      assert.equal(canonicalSuite('maraca-bundle-report').id, 'maraca-bundle');
      for (const gate of Object.values(manifest.xtend.ciGateMatrix)) {
        if (gate && Array.isArray(gate.suites) && gate.command?.startsWith('npm run ')) {
          const selected = scriptSuiteIds(manifest, gate.command.slice(8));
          if (selected.length) assert.deepEqual(gate.suites, selected, `Compatibility projection drift: ${gate.command}`);
        }
      }
      assert.deepEqual(select({ suiteIds: ['core','core'] }).map(s=>s.id), ['core']);
      assert.notEqual(canonicalSuite('surface-manager-browser').id, canonicalSuite('surface-manager-a11y').id);
    });
    await check('Invalid selection fails before loading tests', () => {
      for (const args of [['--report='],['--report'],['--jobs','3'],['--jobs','1.5'],['--from','file']]) assert.throws(()=>parseArgs(args));
      for (const suiteIds of [['all','typo'],['core','typo']]) assert.throws(()=>select({suiteIds}));
      assert.throws(()=>select({profile:'pr',suiteIds:['core']}));
      const probe = spawnSync(process.execPath, ['-e', "require('./scripts/test-runner/cli').main(['--profile','pr','--plan','--json']).then(()=>{if(Object.keys(require.cache).some(p=>/node_modules[\\\\/]typescript|[\\\\/]tests[\\\\/]/.test(p)))process.exitCode=1})"], { cwd: rootDir, encoding: 'utf8' });
      assert.equal(probe.status, 0, probe.stderr);
      assert(JSON.parse(probe.stdout).executionCount > 0);
    });
    await check('Contradictory and absent results cannot pass', () => {
      for (const raw of [null,undefined,{}, {ok:false}, {status:'passed',failures:['broken']}, {status:'passed',exitCode:-1}, {status:'passed',ok:false}, {status:'passed',failureCount:1}]) assert.equal(normalizeSuiteResult(raw).status,'failed');
      assert.equal(normalizeSuiteResult({ok:true}).status,'passed');
    });
    const workerPath = path.join(temp,'worker.cjs');
    const execution = path.join(temp,'execution.json');
    fs.writeFileSync(workerPath, `const p=${JSON.stringify(path.join(rootDir,'scripts/test-runner/handlers.js'))};
require.cache[p]={exports:{
 first:()=>({ok:true}),
 exception:()=>{throw Error('controlled exception')},
 crash:()=>process.exit(17),
 hang:()=>new Promise(()=>{}),
 invalid:()=>null,
 last:()=>{const r=JSON.parse(require('fs').readFileSync(${JSON.stringify(execution)}));return {ok:r.complete===false&&r.results.some(e=>e.id==='first')}},
 core:()=>({ok:true}),
 skipped:()=>({ok:true,skipCount:0,skips:['required capability unavailable']}),
 slow:()=>new Promise(r=>setTimeout(()=>r({ok:true}),60))
}};require(${JSON.stringify(path.join(rootDir,'scripts/test-runner/worker.js'))});`);
    const suite = id => ({id,label:id,resources:[],timeoutMs:id==='hang'?150:10000});
    await check('Exceptions, crashes, deadlines, missing outcomes and atomic partial reports', async () => {
      const selected = ['first','exception','crash','hang','invalid','last'].map(suite);
      const { summary } = await execute(selected, { workerPath, execution, report:path.join(temp,'report.json'), provenance:identity, resolveSuite:id=>selected.find(s=>s.id===id), json:true, cleanupMs:100 });
      assert.equal(summary.status,'failed');
      assert.equal(summary.suiteCount,6);
      assert.equal(summary.failedCount,4);
      assert.equal(summary.suites.at(-1).status,'passed');
      const evidence = JSON.parse(fs.readFileSync(execution));
      assert(evidence.complete);
      assert(evidence.executions.some(e=>e.abortCause==='timeout'));
      assert(evidence.executions.some(e=>e.abortCause==='worker-exit'));
      assert(evidence.workerCount >= 3);
      assert.equal(JSON.parse(fs.readFileSync(path.join(temp,'report.json'))).suiteCount,6);
    });
    await check('Aliases execute once; independent resources allow bounded concurrency', async () => {
      const selected = [suite('first'),{...suite('alias'),aliasOf:'first'},suite('slow')];
      const { summary } = await execute(selected,{workerPath,execution,provenance:identity,resolveSuite:id=>selected.find(s=>s.id===(id==='alias'?'first':id)),json:true,jobs:2,cleanupMs:100});
      assert.equal(summary.status,'passed');
      const evidence=JSON.parse(fs.readFileSync(execution));
      assert.equal(evidence.executions.length,2);
      assert.equal(evidence.workerCount,2);
      assert(evidence.results.find(e=>e.id==='alias').reused);
    });
    await check('Unknown resources serialize; provenance and missing results fail verification', async () => {
      const selected = [suite('core'),{...suite('slow'),resources:undefined}];
      await execute(selected,{workerPath,execution,provenance:identity,resolveSuite:id=>selected.find(s=>s.id===id),json:true,jobs:2,cleanupMs:100});
      assert.equal(JSON.parse(fs.readFileSync(execution)).workerCount,1);
      assert.equal(verifyExecution({verify:'core',from:execution,project:false,provenance:identity}).status,'passed');
      for (const key of ['run','commit','sourceFingerprint','catalogFingerprint','runtime']) assert.equal(verifyExecution({verify:'core',from:execution,project:false,provenance:{...identity,[key]:'foreign'}}).status,'failed');
      const evidence=JSON.parse(fs.readFileSync(execution));evidence.results=[];fs.writeFileSync(execution,JSON.stringify(evidence));
      assert.equal(verifyExecution({verify:'core',from:execution,project:false,provenance:identity}).status,'failed');
    });
    await check('Required Nightly skips fail while optional local skips stay visible', async () => {
      const entry=suite('skipped');
      for (const strict of [false,true]) {
        const result=await execute([entry],{workerPath,execution,provenance:identity,resolveSuite:()=>entry,requireNoSkips:strict,json:true,cleanupMs:100});
        assert.equal(result.status,strict?'failed':'passed');
      }
    });
    await require('./nightly_runner_checks').runNightlyRunnerChecks({check,temp,identity,rootDir});
    await check('Package capture propagates a negative checker outcome to its process exit', () => {
      const program = `const Module=require('module');const original=Module._load;Module._load=function(name,...args){
        if(name==='fs')return {...require('node:fs'),mkdirSync(){},writeFileSync(){}};
        if(name==='child_process')return {spawnSync:()=>({status:0,stdout:'[]',stderr:''})};
        if(name==='../catalog/epic13-package-export-lock')return {PACKAGE_DRY_RUN_ARTIFACT:'pack.json',PACKAGE_EXPORT_SURFACE_ARTIFACT:'surface.json',PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT:'report.json',createEpic13PackageExportLockPlan:()=>({packDryRunArtifact:{fileCount:0},surfaceSnapshot:{}}),createEpic13PackageExportLockReport:()=>({ok:false})};
        return original.call(this,name,...args);
      };require(${JSON.stringify(path.join(rootDir,'scripts/capture_pack_dry_run.js'))});`;
      const child=spawnSync(process.execPath,['-e',program],{cwd:rootDir,encoding:'utf8',timeout:10000});
      assert.equal(child.status,1,child.stderr);
      assert.equal(JSON.parse(child.stdout).ok,false);
    });
    await check('Advisory policy preserves failed domain reports while allowing the profile', async () => {
      const entry=suite('exception');
      const outcome=await execute([entry],{workerPath,execution,provenance:identity,resolveSuite:()=>entry,advisory:['exception'],json:true,cleanupMs:100});
      assert.equal(outcome.status,'passed');
      assert.equal(outcome.summary.status,'failed');
      assert.equal(outcome.summary.failedCount,1);
      assert.equal(JSON.parse(fs.readFileSync(execution)).results[0].result.status,'failed');
    });
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
  return context.result();
}
module.exports={runTestRunnerSuite};

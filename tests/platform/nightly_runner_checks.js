'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { catalog, profileIds, canonicalSuite } = require('../../scripts/test-runner/catalog');
const { summaryFor, SCHEMA } = require('../../scripts/test-runner/executor');
const { normalizeSuiteResult, createRunSummary, writeJsonReport } = require('../utils/reporting');
const { begin, runPhase } = require('../../scripts/test-runner/nightly');
const { SESSION_PATH, inspectArtifact, validateNightly } = require('../../scripts/test-runner/nightly-evidence');
const { probeCapabilities } = require('../../scripts/test-runner/capabilities');
const { verifyCiDependencyLocks } = require('../../scripts/verify_ci_dependency_locks');

async function runNightlyRunnerChecks({ check, temp, identity, rootDir }) {
  const fixture = path.join(temp, 'nightly'); fs.mkdirSync(fixture);
  const save = (name, value) => writeJsonReport(value, name, fixture);
  await check('Nightly locks reject missing root locks, dependency drift and internal registry copies', () => {
    assert(verifyCiDependencyLocks({rootDir}).ok);
    const manifest = {name:'root',version:'1.0.0',workspaces:['packages/internal'],devDependencies:{external:'1.0.0'}};
    const internal = {name:'@fixture/internal',version:'1.0.0'};
    const lock = {packages:{'':manifest,'packages/internal':internal,'node_modules/@fixture/internal':{link:true,resolved:'packages/internal'}}};
    save('package.json',manifest);save('packages/internal/package.json',internal);
    const inspect=()=>verifyCiDependencyLocks({rootDir:fixture,productPaths:[]});
    assert.equal(inspect().ok,false);
    save('package-lock.json',lock);assert.equal(inspect().ok,true);
    lock.packages['node_modules/external/node_modules/@fixture/internal']={version:'1.0.0',resolved:'https://registry.example/internal'};
    save('package-lock.json',lock);assert.equal(inspect().ok,false);
    delete lock.packages['node_modules/external/node_modules/@fixture/internal'];
    save('package-lock.json',lock);manifest.devDependencies.external='2.0.0';save('package.json',manifest);assert.equal(inspect().ok,false);
  });
  await check('Missing PHP or browser capabilities are explicit failures', async () => {
    const positive=await probeCapabilities({commandProbe:()=> 'available',browserProbe:()=>({ok:true})});
    assert(positive.ok);
    const negative=await probeCapabilities({commandProbe:command=>{if(command==='php')throw Error('PHP unavailable');return 'available';},browserProbe:()=>{throw Error('Browser unavailable');}});
    assert(!negative.ok);assert.equal(negative.checks.filter(c=>!c.ok).length,2);
  });
  await check('CI cache setup needs no npm invocation before the required package manager is installed', () => {
    const {configureNpmCache}=require('../../scripts/configure_npm_cache');
    const commandFile=path.join(fixture,'github-env');
    const directory=configureNpmCache({RUNNER_TEMP:fixture,GITHUB_ENV:commandFile});
    assert.equal(fs.readFileSync(commandFile,'utf8'),`NPM_CONFIG_CACHE=${directory}\nXTEND_NPM_CACHE=${directory}\n`);
    assert(fs.statSync(directory).isDirectory());
    assert.throws(()=>configureNpmCache({}),/required/);
    for(const name of ['xtend-default-gates.yml','xtend-nightly-build.yml','xtend-browser-hypervisor-matrix.yml']){
      const source=fs.readFileSync(path.join(rootDir,'.github/workflows',name),'utf8');
      assert(!/^\s+cache: npm\s*$/m.test(source),'setup-node must not query npm before its version is pinned');
      const setups=(source.match(/uses: actions\/setup-node@/g)||[]).length;
      assert.equal((source.match(/run: node scripts\/configure_npm_cache.js/g)||[]).length,setups);
      assert.equal((source.match(/uses: actions\/cache@[a-f0-9]{40}/g)||[]).length,setups);
      assert(!/^\s+NPM_CONFIG_CACHE: \.xtend/m.test(source),'cache paths must remain absolute across working directories');
    }
  });
  await check('Failed prerequisites block dependent commands; independent phases and partial receipts survive a timeout', async () => {
    const artifact={path:'phase.json',kind:'outcome',producer:'last'};
    const command=args=>({command:'node',args});
    const contract={artifacts:[artifact],phases:{
      first:{commands:[command(['-e','console.error("controlled failure");process.exit(4)'])],timeoutMs:10000},
      blocked:{commands:[command(['-e','throw Error("must not execute")'])],dependsOn:['first'],timeoutMs:10000},
      timeout:{commands:[command(['-e',`const fs=require('fs'); const child=require('child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync('owned-child.pid',String(child.pid));process.on('SIGTERM',()=>{});setInterval(()=>{},1000);`])],timeoutMs:500},
      last:{commands:[{...command(['-e','console.log(JSON.stringify({schema:"fixture",ok:true}))']),output:artifact.path}],timeoutMs:10000}
    }};
    const previousRun = process.env.XTEND_TEST_RUN_ID;
    begin({rootDir:fixture,provenance:identity});
    if (previousRun === undefined) delete process.env.XTEND_TEST_RUN_ID; else process.env.XTEND_TEST_RUN_ID = previousRun;
    const run=id=>runPhase(id,{rootDir:fixture,contract,provenance:identity,cleanupMs:100});
    assert.equal((await run('first')).status,'failed');
    const blocked=await run('blocked');assert.equal(blocked.commands.length,0);assert.match(blocked.errors[0],/prerequisite/);
    const timed=await run('timeout');assert.equal(timed.commands[0].abortCause,'timeout');assert(timed.durationMs<5000);
    const ownedPid=Number(fs.readFileSync(path.join(fixture,'owned-child.pid'),'utf8'));
    await new Promise(resolve=>setTimeout(resolve,100));
    let alive=false;
    try { process.kill(ownedPid,0);alive=process.platform!=='linux'||!/\) Z /.test(fs.readFileSync(`/proc/${ownedPid}/stat`,'utf8')); } catch(error) {if(!['ESRCH','ENOENT'].includes(error.code))throw error;}
    assert(!alive,'owned descendants must terminate when the parent ignores SIGTERM');
    const last=await run('last');assert.equal(last.status,'passed');assert(last.artifacts[0].valid);
    await assert.rejects(run('last'),/already attempted/);
    await assert.rejects(runPhase('first',{rootDir:fixture,contract,provenance:{...identity,commit:'foreign'}}),/changed/);
    const receipt=JSON.parse(fs.readFileSync(path.join(fixture,SESSION_PATH)));assert.equal(Object.keys(receipt.phases).length,4);
  });
  await check('Nightly acceptance binds complete suite results and fresh artifacts to their producing phase and runtime', () => {
    const now=new Date().toISOString();
    const ids=profileIds('ci-nightly');
    const execution={schema:SCHEMA,executionId:'fixture-run',...identity,expected:ids,complete:true,status:'passed',startedAt:now,
      results:ids.map(id=>({id,executionId:canonicalSuite(id).id,startedAt:now,completedAt:now,result:normalizeSuiteResult({id,ok:true})}))};
    const definition={phases:{full_release:{blocking:true}},artifacts:[{path:'release.json',kind:'outcome',producer:'full_release',profile:'release'}]};
    save('release.json',summaryFor(execution,profileIds('release')));
    const receipt=inspectArtifact(definition.artifacts[0],{rootDir:fixture,startedAt:now,executionReport:execution});assert(receipt.valid);
    const previousRun=process.env.XTEND_TEST_RUN_ID;
    const session=begin({rootDir:fixture,provenance:identity});
    if(previousRun===undefined)delete process.env.XTEND_TEST_RUN_ID;else process.env.XTEND_TEST_RUN_ID=previousRun;
    session.phases={full_release:{status:'passed',startedAt:now,completedAt:now,artifacts:[receipt]}};
    const validate=(extra={})=>validateNightly({rootDir:fixture,contract:definition,provenance:identity,executionReport:execution,session,...extra});
    assert(validate().ok);
    for(const key of ['run','commit','sourceFingerprint','catalogFingerprint','runtime']) assert(!validate({provenance:{...identity,[key]:'foreign'}}).ok,key);
    assert(!validate({executionReport:{...execution,complete:false}}).ok);
    assert(!validate({executionReport:{...execution,results:execution.results.slice(1)}}).ok);
    const bad=structuredClone(execution);bad.results[0].result.skipCount=1;assert(!validate({executionReport:bad}).ok);
    save('release.json',createRunSummary([]));assert(!validate().ok);
    save('release.json',{schema:'fixture',ok:false});assert(!validate().ok);
    fs.writeFileSync(path.join(fixture,'release.json'),'');assert(!validate().ok);
    fs.rmSync(path.join(fixture,'release.json'));assert(!validate().ok);
    save('release.json',summaryFor(execution,profileIds('release')));fs.utimesSync(path.join(fixture,'release.json'),1,1);assert(!validate().ok);
    const pack={path:'pack.json',kind:'pack'};save(pack.path,[]);assert(!inspectArtifact(pack,{rootDir:fixture}).valid);
    const png={path:'shot.png',kind:'png'};fs.writeFileSync(path.join(fixture,png.path),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5xkAAAAASUVORK5CYII=','base64'));assert(!inspectArtifact(png,{rootDir:fixture}).valid,'corrupt CRC must fail');
  });
  await check('Nightly catalog keeps all additional checks blocking and uses one suite execution', () => {
    assert(catalog.profiles['ci-nightly'].requireNoSkips);
    assert(catalog.ci['ci-nightly'].additionalChecks.every(check=>check.advisory===false));
    const workflow=fs.readFileSync(path.join(rootDir,'.github/workflows/xtend-nightly-build.yml'),'utf8');
    assert(!workflow.includes('install_erp'));assert(!workflow.includes('--verify '));
    assert.equal((workflow.match(/nightly.js phase full_release/g)||[]).length,1);
    assert(workflow.includes('runs-on: ubuntu-24.04'));
    const jobs=workflow.slice(workflow.indexOf('\njobs:\n')).split(/\n  [\w-]+:\n/).slice(1);
    assert.equal(jobs.length,3);
    for(const job of jobs){
      const setup=job.indexOf('uses: actions/setup-node@');
      const configure=job.indexOf('name: Configure npm download cache');
      assert(configure>=0 && configure<setup,'npm cache must be configured before setup-node queries it');
      const header=job.slice(0,job.indexOf('\n    steps:'));
      const jobEnv=header.match(/^    env:\n(?:      .*\n)*/m)?.[0] || '';
      assert(!jobEnv.includes('${{ runner.'),'runner context is unavailable in job-level env');
    }
    assert(workflow.includes('nightly_finalize.outputs.accepted') || workflow.includes('steps.nightly_finalize.outcome'));
  });
}
module.exports = {runNightlyRunnerChecks};

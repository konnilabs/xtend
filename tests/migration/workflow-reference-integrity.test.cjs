'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('workflow setup avoids npm auto-cache; the independent Nightly demo audit provisions FPM',()=>{
 const root=path.resolve(__dirname,'../../.github/workflows');
 for(const file of ['xtend-default-gates.yml','xtend-nightly-build.yml']) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const step of source.split(/\n      - /).filter(step=>step.includes('uses: actions/setup-node@'))) assert.match(step,/package-manager-cache: false/,file);
  for(const step of source.split(/\n      - /).filter(step=>step.includes('uses: shivammathur\/setup-php@'))) {
   assert.match(step,/update: true/);assert.match(step,/use_package_cache: false/);assert.match(step,/composer:2\.10\.3/);
  }
  if(file==='xtend-nightly-build.yml')assert.match(source,/node scripts\/provision_product_fpm\.cjs 8\.4/);
  else {
   assert.ok(!source.includes('scripts/provision_product_fpm.cjs'));
   assert.ok(!source.includes('scripts/product-candidate-canary.cjs'));
   assert.ok(!source.includes('needs.product-candidate'));
   assert.ok(source.includes('core-installed-consumers'));
   assert.ok(source.includes('core-security-browser'));
  }
 }
});
function checkWorkflow(source) {
 const jobs=source.split(/^jobs:\s*$/m)[1];if(!jobs)return [];
 const starts=[...jobs.matchAll(/^  ([a-zA-Z0-9_-]+):\s*$/gm)];const errors=[];
 for(let i=0;i<starts.length;i++) {
  const job=jobs.slice(starts[i].index,starts[i+1]?.index),name=starts[i][1];
  const ids=[...job.matchAll(/^\s+(?:-\s+)?id:\s*['"]?([a-zA-Z0-9_-]+)/gm)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)errors.push(name+': duplicate step ID');
  for(const match of job.matchAll(/\bsteps(?:\.([a-zA-Z0-9_-]+)|\[['"]([^'"]+)['"]\])/g))if(!ids.includes(match[1]||match[2]))errors.push(name+': undefined step '+(match[1]||match[2]));
 }
 return errors;
}
test('all Core workflow expressions and outputs reference existing steps in the same job',()=>{
 const root=path.resolve(__dirname,'../../.github/workflows');for(const file of fs.readdirSync(root).filter(f=>/\.ya?ml$/.test(f)))assert.deepEqual(checkWorkflow(fs.readFileSync(path.join(root,file),'utf8')),[],file);
});
test('deleted, cross-job and output step references are rejected; present guards remain checked',()=>{
 const fixture=`jobs:\n  core:\n    steps:\n      - id: install_1\n        run: npm ci\n      - if: \${{ steps.install_3.outcome == 'success' }}\n        run: npm test\n    outputs:\n      report: \${{ steps.other.outputs.report }}\n  demo:\n    steps:\n      - id: other\n        run: true\n`;
 assert.deepEqual(checkWorkflow(fixture),['core: undefined step install_3','core: undefined step other']);
 assert.deepEqual(checkWorkflow(fixture.replaceAll('steps.install_3','steps.install_1').replaceAll('steps.other','steps.install_1')),[]);
});
function checkNightlyOutputs(source,keys) {
 return [...source.matchAll(/steps\.nightly_finalize\.outputs\.([a-zA-Z0-9_]+)/g)].map(match=>match[1]).filter(key=>!keys.has(key));
}
test('every finalized Nightly workflow output is declared by its actual phase/profile contract',()=>{
 const {catalog,profileGroups}=require('../../scripts/test-runner/catalog');
 const keys=new Set([...Object.keys(catalog.ci['ci-nightly'].phases),...profileGroups('ci-nightly'),'accepted'].map(key=>key.replace(/[^a-zA-Z0-9_]/g,'_')));
 const source=fs.readFileSync(path.resolve(__dirname,'../../.github/workflows/xtend-nightly-build.yml'),'utf8');
 assert.deepEqual(checkNightlyOutputs(source,keys),[]);
 assert.equal(catalog.ci['ci-nightly'].phases.product_candidate.blocking,true);
 assert.match(source,/test "\$\{\{ steps\.nightly_finalize\.outputs\.product_candidate \}\}" = "success"/);
 assert.match(source,/test "\$\{\{ steps\.nightly_finalize\.outputs\.accepted \}\}" = "success"/);
 assert.match(source,/steps\.product_candidate_acceptance\.outcome/);
 assert.ok(!source.includes('.xtend-test-results/xtend-maraca-app-services-test-bench-report.json'));
 assert.ok(source.includes('.xtend-test-results/product-candidates/reports/maraca-app-services-test-bench.json'));
 assert.deepEqual(checkNightlyOutputs(source+'\n${{ steps.nightly_finalize.outputs.xtend_llm_app_services_catfood }}',keys),['xtend_llm_app_services_catfood']);
 const missingCandidate=new Set(keys);missingCandidate.delete('product_candidate');
 assert.deepEqual(checkNightlyOutputs(source,missingCandidate),['product_candidate']);
});

// This executes only Node model children, never npm, a browser or a network call.
test('controlled child-process model for migration environment retains identity, cache, limits and failure status',()=>{
 const {execFileSync}=require('node:child_process');
 const workflow=path.resolve(__dirname,'../../.github/workflows/xtend-migration-completion.yml');
 const model=String.raw`"""Controlled workflow regression model. No npm, browser or network execution."""
import ast
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from unittest.mock import patch

workflow = Path(sys.argv[2])
source = workflow.read_text()
body = source.split("          python3 - <<'PYREGRESSION'\n", 1)[1].split('          PYREGRESSION', 1)[0]
body = '\n'.join(line[10:] for line in body.splitlines())
program = compile(ast.parse(body), str(workflow), 'exec')
node = sys.argv[1]
base = {
    'PATH': str(Path(node).parent) + ':/usr/bin:/bin',
    'CI': 'true', 'GITHUB_ACTIONS': 'true',
    'GITHUB_REPOSITORY': 'synthetic/model', 'GITHUB_RUN_ID': '123',
    'GITHUB_RUN_ATTEMPT': '1', 'GITHUB_JOB': 'model',
    'GITHUB_SHA': 'a' * 40, 'XTEND_CI_LANE': 'synthetic-lane',
    'NPM_CONFIG_CACHE': '/tmp/model-cache', 'XTEND_NPM_CACHE': '/tmp/model-cache',
    'XTEND_NPM_CLI': '/tmp/model-npm-cli.js',
    'XTEND_CORE_REQUIRED': 'true', 'XTEND_CORE_ARCHIVE': '/tmp/model-archive',
    'XTEND_CORE_EXPECTED': '/tmp/model-expectation',
    'XTEND_NODE_WARNING_POLICY': 'project-error',
    'XTEND_NODE_WARNING_REPORT': '/tmp/model-warning-report',
    'XTEND_TEST_RUN_ID': 'ignored-by-existing-fingerprint',
    'GITHUB_TOKEN': 'sentinel-not-a-real-token', 'GH_TOKEN': 'sentinel',
    'ACTIONS_RUNTIME_TOKEN': 'sentinel', 'AWS_SECRET_ACCESS_KEY': 'sentinel',
    'NPM_TOKEN': 'sentinel', 'GITHUB_ENV': '/tmp/must-not-reach-child',
    'RUNNER_TEMP': '/tmp/' + 'long-runner-path' * 16,
    'HOME': '/tmp/user-profile-must-not-reach-child',
}
assert source.index('name: Discover pinned npm for release model tests') < source.index('name: Run XTend PR fast gate report')
assert source.count('name: Discover pinned npm for release model tests') == 1
actual_run = subprocess.run
cases = []

def identity(environment):
    return sorted((key, value) for key, value in environment.items()
                  if key.startswith('XTEND_') and key != 'XTEND_TEST_RUN_ID')

def check(label, change=None, child_exit=0, rejection=None):
    environment = copy.deepcopy(base)
    if change:
        change(environment)
    captures = []

    def model_child(command, *, env):
        assert command == ['npm', 'run', 'test:ci-pr']
        captures.append(dict(env))
        assert identity(env) == identity(environment), 'Producer/verifier identity differs'
        assert all(name not in env for name in ['GITHUB_TOKEN', 'GH_TOKEN', 'ACTIONS_RUNTIME_TOKEN', 'AWS_SECRET_ACCESS_KEY', 'NPM_TOKEN', 'GITHUB_ENV', 'RUNNER_TEMP'])
        assert env['NPM_CONFIG_CACHE'] == env['XTEND_NPM_CACHE'] == '/tmp/model-cache'
        assert env['HOME'] == env['TMPDIR'] and env['HOME'] != environment['HOME']
        assert Path(env['HOME']).is_dir()
        socket = env['TMPDIR'] + '/xtend-test-worker-AAAAAA/org.chromium.Chromium.BBBBBB/SingletonSocket'
        assert len(socket.encode()) < 108, 'Linux Unix socket path budget exceeded'
        script = "const c=require('node:crypto');const v=Object.keys(process.env).filter(k=>k.startsWith('XTEND_')&&k!=='XTEND_TEST_RUN_ID').sort().map(k=>[k,process.env[k]]);process.stdout.write(c.createHash('sha256').update(JSON.stringify(v)).digest('hex'));process.exitCode=" + str(child_exit)
        result = actual_run([node, '-e', script], env=env, capture_output=True, text=True, timeout=10)
        expected = hashlib.sha256(json.dumps(identity(environment), separators=(',', ':')).encode()).hexdigest()
        assert result.stdout == expected and result.stderr == ''
        return result

    with patch.dict(os.environ, environment, clear=True), patch('subprocess.run', model_child):
        try:
            exec(program, {'__name__': '__main__'})
        except SystemExit as result:
            outcome = result.code
        else:
            raise AssertionError('Workflow did not propagate completion')
    if rejection:
        assert not captures and outcome == rejection, (label, outcome)
    else:
        assert len(captures) == 1 and outcome == child_exit
        assert not Path(captures[0]['HOME']).exists(), 'Temporary home not removed'
    cases.append({'name': label, 'passed': True, 'kind': 'controlled-process-model'})

check('identity-cache-credentials-socket-budget-and-cleanup')
check('consistent-lowercase-cache-alias', lambda e: e.update(npm_config_cache=e['NPM_CONFIG_CACHE']))
check('child-failure-propagates', child_exit=1)
check('nonstandard-child-exit-propagates', child_exit=37)
check('missing-cache-rejected', lambda e: e.pop('NPM_CONFIG_CACHE'), rejection='Consistent explicit npm cache required')
check('mismatched-cache-rejected', lambda e: e.update(XTEND_NPM_CACHE='/tmp/wrong'), rejection='Consistent explicit npm cache required')
check('mismatched-lowercase-alias-rejected', lambda e: e.update(npm_config_cache='/tmp/wrong'), rejection='Consistent explicit npm cache required')
check('missing-discovered-cli-rejected', lambda e: e.pop('XTEND_NPM_CLI'), rejection='Discovered npm CLI required before execution')
check('unknown-identity-rejected-without-leaking-name-or-value', lambda e: e.update(XTEND_SECRET_SENTINEL='sentinel'), rejection='Unlisted XTend execution identity; review the explicit allowlist')
print(json.dumps({'kind': 'controlled-workflow-model-no-browser-execution',
                  'node': actual_run([node, '--version'], capture_output=True, text=True, check=True).stdout.strip(),
                  'workflowSha256': hashlib.sha256(workflow.read_bytes()).hexdigest(),
                  'cases': cases, 'passed': len(cases), 'failed': 0}, indent=2))
`;
 const result=JSON.parse(execFileSync('python3',['-',process.execPath,workflow],{input:model,encoding:'utf8',timeout:30000}));
 assert.equal(result.kind,'controlled-workflow-model-no-browser-execution');
 assert.equal(result.passed,9);assert.equal(result.failed,0);
 assert.equal(result.node,process.version);
 assert.equal(result.cases.length,9);assert.equal(new Set(result.cases.map(row=>row.name)).size,9);
 assert.ok(result.cases.every(row=>row.passed===true&&row.kind==='controlled-process-model'));
});

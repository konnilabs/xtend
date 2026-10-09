'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('candidate setup avoids npm auto-cache before the required npm pin and provisions packaged FPM',()=>{
 const root=path.resolve(__dirname,'../../.github/workflows');
 for(const file of ['xtend-default-gates.yml','xtend-nightly-build.yml']) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const step of source.split(/\n      - /).filter(step=>step.includes('uses: actions/setup-node@'))) assert.match(step,/package-manager-cache: false/,file);
  for(const step of source.split(/\n      - /).filter(step=>step.includes('uses: shivammathur\/setup-php@'))) {
   assert.match(step,/update: true/);assert.match(step,/use_package_cache: false/);assert.match(step,/composer:2\.10\.3/);
  }
  assert.match(source,/\/usr\/sbin\/php-fpm8\.4 -v/);
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

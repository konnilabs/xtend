'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const {verifyStateBranding} = require('../../scripts/verify_state_branding.js');
const runtime = require('../../scripts/capture_node_runtime_evidence.js');
const removed = ['x', 'state'].join('');
const pascal = ['X', 'State'].join('');
const historicalPaths = [
  `development/ER-WP-11-Fabric-an-${removed}-API-und-XTendRMT-Diagnostics-anbinden.md`,
  `development/WP-05-${pascal}-Core-Contract-Vereinheitlichung.md`,
  `development/WP-E12-08-${removed}-Adapter-Typing-und-Lifecycle-Boundary-Probe-bauen.md`,
  `development/WP-E18-07-Typed-State-Selectors-und-${pascal}-Bridge-fuer-Apps-bauen.md`
];
const historical = historicalPaths[0];
const policyPath = 'scripts/release/core-projection-policy.json';
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'branding-membership-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const write = (file, content) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), content);};
  write('components/xtend-state.js', `const LEGACY_STATE_STORAGE_KEY = '${removed}-data';`);
  historicalPaths.forEach(file => write(file, 'Historical development note'));
  const policy = {productivePaths: [...historicalPaths]};
  const check = () => {write(policyPath, JSON.stringify(policy, null, 2)); return verifyStateBranding({rootDir: root});};
  return {root, write, policy, check};
}
test('historical membership path is retained while the branding gate accepts its metadata reference', t => {
  const f=fixture(t); assert.equal(f.check().ok,true); assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root,policyPath))).productivePaths,historicalPaths);
});
for (const [index, file] of historicalPaths.entries()) test('historical metadata exemption never applies to active field '+index, t => {
  const f=fixture(t);f.policy.activeName=file;assert.equal(f.check().ok,false);
});
for (const [name, mutate] of [
  ['active field', f => {f.policy.description=removed;}],
  ['active source path', f => {f.policy.productivePaths.push(`src/${removed}.js`);f.write(`src/${removed}.js`,'const active = true;');}],
  ['active runtime source', f => {f.write('src/runtime.js',`const name = '${removed}';`);}],
  ['other metadata field', f => {f.policy.otherPaths=[historical];}],
  ['missing historical target', f => {fs.unlinkSync(path.join(f.root,historical));}],
  ['different historical path', f => {const p=`development/other-${removed}.md`;f.write(p,'note');f.policy.productivePaths.push(p);}],
  ['historical reference outside policy', f => {f.write('scripts/other.json',JSON.stringify({productivePaths:[historical]}));}]
]) test('branding still rejects '+name, t => {const f=fixture(t);mutate(f);assert.equal(f.check().ok,false);});
test('malformed policy does not gain a historical path exemption', t=> {const f=fixture(t);f.write(policyPath,JSON.stringify(f.policy)+' invalid');assert.equal(verifyStateBranding({rootDir:f.root}).ok,false);});
test('Core workflow selects only the pre-existing exact runtime lanes',()=>{
  const workflow=fs.readFileSync(path.join(__dirname,'../../.github/workflows/xtend-default-gates.yml'),'utf8');
  assert.ok(workflow.includes("capture_node_runtime_evidence.js --lane ${{ matrix.node_version == '24.18.0' && 'node-24-lts' || 'node-26-current' }}"));
  assert.ok(workflow.includes('capture_node_runtime_evidence.js --lane node-24-lts'));
  assert.ok(!/capture_node_runtime_evidence\.js --lane core-/u.test(workflow));
  assert.deepEqual(Object.keys(runtime.RUNTIME_LANES).sort(),['node-24-lts','node-24-publish','node-26-current']);
});

test('Core job identity setup precedes execution and remains pinned without sandbox flags',()=>{
  const check=(source,job,nextJob,command)=>{
    const block=source.slice(source.indexOf('\n  '+job+':'),source.indexOf('\n  '+nextJob+':'));
    const setup=block.indexOf('run: node scripts/prepare_product_browser_toolchain.cjs');
    const execute=block.indexOf(command);
    assert(setup>0&&execute>setup,'Exact identity must be prepared before execution');
    const step=block.slice(block.lastIndexOf('      - name:',setup),block.indexOf('      - name:',setup));
    assert(!step.includes('continue-on-error'));assert(!step.includes('--no-sandbox'));
    assert(step.includes('$RUNNER_TEMP/xtend-core-browser-toolchain'));
    assert(step.includes('id: browser_toolchain'));
    const runStep=block.slice(block.lastIndexOf('      - name:',execute),execute);
    assert(runStep.includes("steps.browser_toolchain.outcome == 'success'"),'Failed identity preparation must prevent product execution');
  };
  const regular=fs.readFileSync(path.join(__dirname,'../../.github/workflows/xtend-default-gates.yml'),'utf8');
  check(regular,'pr-fast-gates','full-release-gates','run: npm run test:ci-pr');
  check(regular,'full-release-gates','rmt-vnext-primitive-gates','run: npm run test:ci-release');
  const migration=fs.readFileSync(path.join(__dirname,'../../.github/workflows/xtend-migration-completion.yml'),'utf8');
  check(migration,'pr-fast-gates','release-prepare',"subprocess.run(['npm','run','test:ci-pr']");
  for(const variable of ['XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY','XTEND_BROWSER_HYPERVISOR_DRIVER_PATH','CHROMIUM_PATH','XTEND_SECURITY_BROWSER_ARCHIVE'])assert(migration.includes("'"+variable+"'"));
});

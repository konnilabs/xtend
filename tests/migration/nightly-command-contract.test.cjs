'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),helper=require('../utils/test-catalog');
const workflow = shell => 'jobs:\n  required:\n    steps:\n      - name: Execute required gate\n        run: |\n' + shell.split('\n').map(line=>'          '+line).join('\n');
const has = (shell, command) => helper.workflowHasCommand(workflow(shell), command);
test('actual nightly workflow executes every declared npm and direct command obligation',()=>{const p=require('../../package.json');function walk(x){if(x&&typeof x==='object'){if(x.schema==='xtend.ci.nightly-build.v1'){let text=fs.readFileSync(path.join(root,x.workflow),'utf8');text=text.slice(0,text.indexOf('\n  optional-source-to-sea:'));for(const c of x.commandSet)assert.equal(helper.workflowHasCommand(text,c),true,c);}Object.values(x).forEach(walk);}}walk(p);});
test('missing and substituted direct commands cannot satisfy an obligation',()=>{for(const c of ['npm pack --workspace xtendrmt --dry-run --json --silent','node scripts/product-candidate-canary.cjs']){assert.equal(has(c+' > report.json',c),true);assert.equal(has('',c),false);assert.equal(has(c.replace('xtendrmt','foreign').replace('product-candidate-canary','wrong'),c),false);}assert.equal(has('echo node scripts/product-candidate-canary.cjs','node scripts/product-candidate-canary.cjs'),false);});

test('nonexecuting or execution-changing modifiers never satisfy required commands',()=>{for(const c of ['node scripts/product-candidate-canary.cjs','npm run test:ci-nightly'])for(const suffix of [' --help',' --pack-only',' --version',' || true',' | cat'])assert.equal(has(c+suffix,c),false,c+suffix);});
test('commented commands and heredoc bodies are not executions',()=>{const c='node scripts/product-candidate-canary.cjs';for(const text of ['# '+c,'  # '+c,"cat <<'EOF'\n"+c+'\nEOF','cat <<-END\n'+c+'\nEND'])assert.equal(has(text,c),false,text);assert.equal(has("cat <<'EOF'\nignored\nEOF\n"+c,c),true);});

test('env and multiline name text cannot provide execution evidence',()=>{const c='node scripts/product-candidate-canary.cjs';for(const metadata of ['env:\n  NOTE: |\n    '+c,'jobs:\n  required:\n    steps:\n      - name: |\n          '+c+'\n        run: echo other','jobs:\n  required:\n    steps:\n      - env:\n          NOTE: |\n            '+c+'\n        run: echo other'])assert.equal(helper.workflowHasCommand(metadata,c),false);assert.equal(helper.workflowHasCommand('jobs:\n  required:\n    steps:\n      - run: '+c,c),true);});

const os = require('node:os');
const { begin, runPhase, currentIdentity } = require('../../scripts/test-runner/nightly');
const { SESSION_PATH } = require('../../scripts/test-runner/nightly-evidence');
const capabilities = require('../../scripts/test-runner/capabilities');
const { workflowHasCommand } = require('../utils/test-catalog');

const nightlyWorkflow = fs.readFileSync(path.resolve(__dirname, '../../.github/workflows/xtend-nightly-build.yml'), 'utf8');
const job = nightlyWorkflow.split('\n  nightly-build:\n')[1].split(/^  [\w-]+:\s*$/m)[0];
const steps = job.split(/\n(?=      - )/).slice(1);
const commandStep = command => {
  const matches = steps.map((step, index) => ({ step, index })).filter(({ step }) =>
    workflowHasCommand('jobs:\n  fixture:\n    steps:\n' + step, command));
  assert.equal(matches.length, 1, `Expected one executing step: ${command}`);
  return matches[0];
};

test('Nightly provisions its runtime in a required step before capturing identity', () => {
  const provision = commandStep('node scripts/prepare_product_browser_toolchain.cjs "${{ runner.temp }}/xtend-browser"');
  const fpm = commandStep('node scripts/provision_product_fpm.cjs 8.4');
  const initialize = commandStep('node scripts/test-runner/nightly.js begin');
  assert.equal(fpm.index, provision.index);
  // GITHUB_ENV exports become visible only to subsequent workflow steps.
  assert(provision.index < initialize.index, 'Provisioning must finish before Nightly identity capture');
  for (const { step } of [provision, initialize]) {
    assert(!/^        (?:if|continue-on-error):/m.test(step), 'Required setup must fail before initialization or phases');
  }
  for (const id of Object.keys(require('../../scripts/test-runner/catalog').catalog.ci['ci-nightly'].phases)) {
    assert(commandStep(`node scripts/test-runner/nightly.js phase ${id}`).index > initialize.index, id);
  }
});

function fixture(t) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-nightly-order-'));
  const names = ['XTEND_TEST_RUN_ID', 'XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY', 'XTEND_BROWSER_HYPERVISOR_DRIVER_PATH', 'XTEND_BROWSER_HYPERVISOR_URL', 'XTEND_NIGHTLY_ORDER_INPUT'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  t.after(() => {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    }
    fs.rmSync(rootDir, { recursive: true, force: true });
  });
  process.env.XTEND_TEST_RUN_ID = 'nightly-setup-order-fixture';
  delete process.env.XTEND_BROWSER_HYPERVISOR_URL;
  delete process.env.XTEND_NIGHTLY_ORDER_INPUT;
  // Version fixtures model the observed replacement without downloading or
  // launching any browser. Identity capture, fingerprints and phases are real.
  const runtime = (name, browser, driver) => {
    const directory = path.join(rootDir, name);
    fs.mkdirSync(directory);
    const files = { browser: path.join(directory, 'browser'), driver: path.join(directory, 'driver') };
    fs.writeFileSync(files.browser, browser, { mode: 0o755 });
    fs.writeFileSync(files.driver, driver, { mode: 0o755 });
    return files;
  };
  const system = runtime('system', 'Chromium 155.0.8059.0', 'ChromeDriver 155.0.8059.39');
  const pinned = require('../security/sandboxed-browser.cjs').pin.version;
  const provisioned = runtime('provisioned', `Google Chrome for Testing ${pinned}`, `ChromeDriver ${pinned}`);
  const probeFiles = new Set([...Object.values(system), ...Object.values(provisioned)]);
  const original = capabilities.toolchainIdentity;
  t.mock.method(capabilities, 'toolchainIdentity', options => original({ ...options, commandProbe: (command, args) => {
    if (probeFiles.has(command)) {
      assert.deepEqual(args, ['--version']);
      return fs.readFileSync(command, 'utf8');
    }
    return 'fixture PHP identity';
  } }));
  const select = files => {
    process.env.XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY = files.browser;
    process.env.XTEND_BROWSER_HYPERVISOR_DRIVER_PATH = files.driver;
  };
  const artifact = { path: 'candidate.json', kind: 'outcome', producer: 'product_candidate', expectedSchema: 'nightly.order.fixture.v1' };
  const contract = { artifacts: [artifact], phases: {
    lock_guard: { commands: [], timeoutMs: 10000 },
    install_1: { commands: [], dependsOn: ['lock_guard'], timeoutMs: 10000 },
    product_candidate: { commands: [{ command: 'node', args: ['-e', 'console.log(JSON.stringify({schema:"nightly.order.fixture.v1",ok:true}))'], output: artifact.path }], dependsOn: ['install_1'], timeoutMs: 10000 }
  } };
  const run = id => runPhase(id, { rootDir, contract });
  const read = () => JSON.parse(fs.readFileSync(path.join(rootDir, SESSION_PATH), 'utf8'));
  const prerequisites = async () => {
    for (const id of ['lock_guard', 'install_1']) assert.equal((await run(id)).status, 'passed');
  };
  const reject = async () => {
    const before = fs.readFileSync(path.join(rootDir, SESSION_PATH), 'utf8');
    await assert.rejects(run('product_candidate'), /Nightly input or runtime changed after initialization/);
    assert.equal(fs.readFileSync(path.join(rootDir, SESSION_PATH), 'utf8'), before, 'Rejected phase must not rebaseline identity or record success');
    assert(!fs.existsSync(path.join(rootDir, artifact.path)), 'Rejected phase must not execute its command');
  };
  return { rootDir, system, provisioned, select, run, read, prerequisites, reject };
}

test('old setup order rejects provisioning drift after only lock and install complete', async t => {
  const f = fixture(t);
  f.select(f.system);
  const session = begin({ rootDir: f.rootDir });
  await f.prerequisites();
  f.select(f.provisioned);
  const after = currentIdentity(session);
  for (const key of ['run', 'commit', 'sourceFingerprint', 'catalogFingerprint']) assert.deepEqual(after[key], session.identity[key], key);
  for (const key of ['driver', 'binary']) {
    assert.notEqual(after.runtime.toolchain.browser[key].command, session.identity.runtime.toolchain.browser[key].command);
    assert.notEqual(after.runtime.toolchain.browser[key].value, session.identity.runtime.toolchain.browser[key].value);
    assert.equal(after.runtime.toolchain.browser[key].available, true);
  }
  assert.notEqual(after.runtime.toolchain.configurationFingerprint, session.identity.runtime.toolchain.configurationFingerprint);
  assert.notEqual(after.runtime.environmentFingerprint, session.identity.runtime.environmentFingerprint);
  await f.reject();
  assert.deepEqual(Object.keys(f.read().phases), ['lock_guard', 'install_1']);
});

test('provisioning before initialization retains identity and captures fresh phase evidence', async t => {
  const f = fixture(t);
  f.select(f.provisioned);
  const session = begin({ rootDir: f.rootDir });
  await f.prerequisites();
  const result = await f.run('product_candidate');
  assert.equal(result.status, 'passed');
  assert.equal(result.commands.length, 1);
  assert.equal(result.commands[0].exitCode, 0);
  assert.equal(result.artifacts[0].valid, true);
  assert.equal(result.artifacts[0].sha256.length, 64);
  assert.deepEqual(f.read().identity, session.identity);
  assert.deepEqual(currentIdentity(session), session.identity);
});

test('correct setup still rejects later executable-version and environment-input changes', async t => {
  const f = fixture(t);
  f.select(f.provisioned);
  const session = begin({ rootDir: f.rootDir });
  await f.prerequisites();
  const original = fs.readFileSync(f.provisioned.browser, 'utf8');
  fs.writeFileSync(f.provisioned.browser, 'changed browser version');
  const changed = currentIdentity(session);
  assert.equal(changed.runtime.environmentFingerprint, session.identity.runtime.environmentFingerprint);
  assert.notEqual(changed.runtime.toolchain.configurationFingerprint, session.identity.runtime.toolchain.configurationFingerprint);
  await f.reject();
  fs.writeFileSync(f.provisioned.browser, original);
  process.env.XTEND_NIGHTLY_ORDER_INPUT = 'changed after initialization';
  const input = currentIdentity(session);
  assert.deepEqual(input.runtime.toolchain, session.identity.runtime.toolchain);
  assert.notEqual(input.runtime.environmentFingerprint, session.identity.runtime.environmentFingerprint);
  await f.reject();
});

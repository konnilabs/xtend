'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const { detectAvailableEngine, runFixture, findExecutable, providerOptions } = require('../../tools/browser-hypervisor');

function commandProbe(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `${command} exited ${result.status}`);
  return result.stdout.trim();
}

async function browserProbe() {
  const engine = detectAvailableEngine({ engine: 'chromium' });
  if (!engine) throw new Error('Required Chromium WebDriver is unavailable');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-nightly-capabilities-'));
  const source = '<!doctype html><title>Nightly capability probe</title><script>window.__xtendNightlyCapabilities={status:"passed",ok:true};</script>';
  const fixture = 'probe.html';
  fs.writeFileSync(path.join(directory, fixture), source);
  const server = http.createServer((_request, response) => { response.setHeader('content-type', 'text/html'); response.end(source); });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const evidence = await runFixture({ rootDir: directory, fixturePath: fixture, engine,
      url: `http://127.0.0.1:${server.address().port}/${fixture}`, resultKey: '__xtendNightlyCapabilities',
      timeoutMs: 20000, accept: result => result?.ok === true });
    const provider = providerOptions({});
    return { engine, driver: evidence.driver, driverVersion: evidence.driverVersion, browserVersion: evidence.browserVersion,
      driverPath: provider.webDriverUrl ? null : findExecutable(evidence.driver, provider.driverPath, { explicitOnly: Boolean(provider.driverPath) }),
      endpoint: provider.webDriverUrl ? 'external-driver' : 'local-driver', fixtureTransport: 'loopback', result: evidence.result };
  } finally {
    server.closeAllConnections();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function probeCapabilities(options = {}) {
  const run = options.commandProbe || commandProbe;
  const checks = [];
  const check = async (id, fn) => {
    try { checks.push({ id, ok: true, evidence: await fn() }); }
    catch (error) { checks.push({ id, ok: false, error: error.message }); }
  };
  await check('node-and-subprocess', () => run(process.execPath, ['-e', 'if(Number(process.versions.node.split(".")[0])<24)process.exit(1);console.log(process.version)']));
  await check('npm', () => run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version']));
  await check('node-sqlite', () => run(process.execPath, ['-e', 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync(":memory:");db.exec("create table probe (ok integer); insert into probe values (1)");if(db.prepare("select ok from probe").get().ok!==1)process.exit(1);db.close();console.log("SQLite read/write available")']));
  await check('php', () => run('php', ['-r', 'if(!extension_loaded("json")||!extension_loaded("openssl")||!is_callable("proc_open")){fwrite(STDERR,"PHP requires JSON, OpenSSL and proc_open");exit(1);}echo PHP_VERSION;']));
  await check('browser-and-loopback', options.browserProbe || browserProbe);
  return { schema: 'xtend.ci.runner-capabilities.v1', generatedAt: new Date().toISOString(),
    ok: checks.every(check => check.ok), runtime: { node: process.version, platform: process.platform, arch: process.arch,
      image: `${process.env.ImageOS || ''}:${process.env.ImageVersion || ''}` }, checks };
}

if (require.main === module) probeCapabilities().then(report => {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}).catch(error => { console.error(error); process.exitCode = 1; });

module.exports = { probeCapabilities };

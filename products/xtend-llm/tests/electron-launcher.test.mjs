import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  createElectronEnvironment,
  createHostRuntimeEvidence,
  HOST_RUNTIME_EVIDENCE_ENV,
  mirrorChildExit,
  spawnWithSignalForwarding
} from '../scripts/electron-launcher.mjs';

const hostRuntime = createHostRuntimeEvidence({
  versions: {
    node: '26.5.0',
    modules: '147',
    napi: '10',
    v8: '14.6.202.33-node.0',
    openssl: '3.5.4'
  },
  environment: { npm_config_user_agent: 'npm/11.17.0 node/v26.5.0 linux x64' },
  platform: 'linux',
  arch: 'x64'
});
const environment = createElectronEnvironment({
  ELECTRON_RUN_AS_NODE: '1',
  KEEP_ME: 'yes'
}, hostRuntime);
assert.equal(environment.ELECTRON_RUN_AS_NODE, undefined);
assert.equal(environment.KEEP_ME, 'yes');
assert.deepEqual(JSON.parse(environment[HOST_RUNTIME_EVIDENCE_ENV]), hostRuntime);
assert.equal(hostRuntime.npm, '11.17.0');

const exitResult = await spawnWithSignalForwarding({
  executable: process.execPath,
  args: ['-e', 'process.exit(23)'],
  env: createElectronEnvironment(),
  stdio: 'ignore',
  signals: []
});
assert.deepEqual(exitResult, { code: 23, signal: null });

if (process.platform !== 'win32') {
  const signalResult = await spawnWithSignalForwarding({
    executable: process.execPath,
    args: ['-e', 'process.kill(process.pid, "SIGTERM")'],
    env: createElectronEnvironment(),
    stdio: 'ignore',
    signals: []
  });
  assert.deepEqual(signalResult, { code: null, signal: 'SIGTERM' });
}

const codeTarget = { exitCode: null, pid: 1, kill() { throw new Error('must not signal'); } };
assert.deepEqual(mirrorChildExit({ code: 7, signal: null }, codeTarget), { mode: 'code', exitCode: 7 });
assert.equal(codeTarget.exitCode, 7);

const signalled = [];
const signalTarget = {
  exitCode: null,
  pid: 123,
  kill(pid, signal) {
    signalled.push({ pid, signal });
  }
};
const mirroredSignal = mirrorChildExit({ code: null, signal: 'SIGTERM' }, signalTarget);
assert.equal(mirroredSignal.mode, 'signal');
assert.deepEqual(signalled, [{ pid: 123, signal: 'SIGTERM' }]);
assert.equal(signalTarget.exitCode, 143);

const fallbackTarget = {
  exitCode: null,
  pid: 123,
  kill() {
    throw new Error('unsupported signal');
  }
};
assert.deepEqual(mirrorChildExit({ code: null, signal: 'SIGTERM' }, fallbackTarget), {
  mode: 'fallback',
  signal: 'SIGTERM',
  exitCode: 143
});
assert.equal(fallbackTarget.exitCode, 143);

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcherPath = path.join(productRoot, 'scripts', 'run-electron.mjs');
const cliExit = spawnSync(process.execPath, [
  launcherPath,
  '--xtend-executable',
  process.execPath,
  '-e',
  [
    'const evidence = JSON.parse(process.env.XTEND_LLM_HOST_RUNTIME_EVIDENCE);',
    'const argsOk = JSON.stringify(process.argv.slice(1)) === JSON.stringify(["alpha", "--", "beta"]);',
    'const evidenceOk = evidence.schema === "xtend-llm.launcher-host-runtime.v1" && evidence.node === process.versions.node;',
    'process.exitCode = !process.env.ELECTRON_RUN_AS_NODE && argsOk && evidenceOk ? 19 : 70;'
  ].join(' '),
  'alpha',
  '--',
  'beta'
], {
  cwd: productRoot,
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  encoding: 'utf8'
});
assert.equal(cliExit.status, 19, cliExit.stderr);

if (process.platform !== 'win32') {
  const cliSignal = spawnSync(process.execPath, [
    launcherPath,
    '--xtend-executable',
    process.execPath,
    '-e',
    'process.kill(process.pid, "SIGTERM")'
  ], {
    cwd: productRoot,
    stdio: 'ignore'
  });
  assert.equal(cliSignal.status, null);
  assert.equal(cliSignal.signal, 'SIGTERM');
}

console.log('ok - portable Electron launcher cleans environment and mirrors exit/signal state');

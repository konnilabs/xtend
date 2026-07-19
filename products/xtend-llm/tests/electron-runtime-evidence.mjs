import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { HOST_RUNTIME_EVIDENCE_ENV } from '../scripts/electron-launcher.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultDir = path.join(productRoot, '.xtend-llm-results');
const require = createRequire(import.meta.url);
const { app } = require('electron');
const electronPackage = require('electron/package.json');
const manifest = JSON.parse(fs.readFileSync(path.join(productRoot, 'package.json'), 'utf8'));
const policy = manifest.xtendLlm?.nodeRuntimePolicy || {};
const args = process.argv.slice(2).filter((argument) => argument !== '--');
const laneArgument = args.find((argument) => argument.startsWith('--lane='));
const lane = laneArgument ? laneArgument.slice('--lane='.length) : null;
const expectedHost = lane ? policy.hostLanes?.[lane] || null : null;

function major(version) {
  const match = /^(\d+)/u.exec(String(version || ''));
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseHostRuntime() {
  try {
    return JSON.parse(process.env[HOST_RUNTIME_EVIDENCE_ENV] || 'null');
  } catch {
    return null;
  }
}

const host = parseHostRuntime();
const embedded = {
  schema: 'xtend-llm.electron-embedded-runtime.v1',
  processType: process.type || null,
  node: process.versions.node || null,
  electron: process.versions.electron || null,
  chrome: process.versions.chrome || null,
  modules: process.versions.modules || null,
  napi: process.versions.napi || null,
  v8: process.versions['v8'] || null,
  openssl: process.versions.openssl || null,
  platform: process.platform,
  arch: process.arch,
  pid: process.pid,
  parentPid: process.ppid
};
const checks = [
  {
    id: 'known-host-lane',
    ok: Boolean(expectedHost),
    expected: Object.keys(policy.hostLanes || {}),
    observed: lane
  },
  {
    id: 'launcher-host-evidence-present',
    ok: host?.schema === 'xtend-llm.launcher-host-runtime.v1',
    expected: 'xtend-llm.launcher-host-runtime.v1',
    observed: host?.schema || null
  },
  {
    id: 'exact-host-node',
    ok: Boolean(expectedHost) && host?.node === expectedHost.node,
    expected: expectedHost?.node || null,
    observed: host?.node || null
  },
  {
    id: 'exact-host-npm',
    ok: Boolean(expectedHost) && host?.npm === expectedHost.npm,
    expected: expectedHost?.npm || null,
    observed: host?.npm || null
  },
  {
    id: 'electron-main-process',
    ok: embedded.processType === 'browser',
    expected: 'browser',
    observed: embedded.processType
  },
  {
    id: 'electron-package-runtime-parity',
    ok: embedded.electron === electronPackage.version,
    expected: electronPackage.version,
    observed: embedded.electron
  },
  {
    id: 'electron-major',
    ok: major(embedded.electron) === policy.electron?.major,
    expected: policy.electron?.major ?? null,
    observed: major(embedded.electron)
  },
  {
    id: 'embedded-node-major',
    ok: major(embedded.node) === policy.electron?.embeddedNodeMajor,
    expected: policy.electron?.embeddedNodeMajor ?? null,
    observed: major(embedded.node)
  },
  {
    id: 'host-and-embedded-runtime-separated',
    ok: Number.isInteger(host?.pid) && host.pid !== embedded.pid,
    expected: 'different-process-domains',
    observed: { hostPid: host?.pid || null, embeddedPid: embedded.pid }
  },
  {
    id: 'embedded-native-abi-present',
    ok: /^\d+$/u.test(String(embedded.modules || '')) && /^\d+$/u.test(String(embedded.napi || '')),
    expected: 'numeric modules and napi',
    observed: { modules: embedded.modules, napi: embedded.napi }
  }
];
const ok = checks.every((check) => check.ok === true);
const safeLane = String(lane || 'unknown').replace(/[^a-z0-9._-]+/giu, '-');
const report = {
  schema: 'xtend-llm.electron-runtime-evidence.v1',
  ok,
  status: ok ? 'passed' : 'failed',
  generatedAt: new Date().toISOString(),
  lane,
  expected: {
    host: expectedHost,
    electron: policy.electron || null
  },
  observed: {
    launcherHost: host,
    electronMain: embedded,
    installedElectronPackage: electronPackage.version
  },
  boundary: {
    hostRuntimeOwner: 'node-cli',
    embeddedRuntimeOwner: 'electron',
    sameRuntimeClaimAllowed: false
  },
  checks
};

fs.mkdirSync(resultDir, { recursive: true });
const reportPath = path.join(resultDir, `electron-runtime-${safeLane}.json`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`${ok ? 'Electron runtime evidence passed' : 'Electron runtime evidence failed'}: ${reportPath}`);

app.whenReady().then(() => app.exit(ok ? 0 : 1)).catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  app.exit(1);
});

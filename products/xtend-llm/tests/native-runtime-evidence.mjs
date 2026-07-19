import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { HOST_RUNTIME_EVIDENCE_ENV } from '../scripts/electron-launcher.mjs';
import { createTinyIdentityOnnxModel } from './tiny-onnx-identity.mjs';

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

function errorRecord(error) {
  return {
    name: error?.name || 'Error',
    code: error?.code || null,
    message: error?.message || String(error)
  };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseHostRuntime() {
  try {
    return JSON.parse(process.env[HOST_RUNTIME_EVIDENCE_ENV] || 'null');
  } catch {
    return null;
  }
}

async function runOnnxSmoke() {
  let ort;
  try {
    const module = await import('onnxruntime-node');
    ort = module.InferenceSession ? module : module.default;
  } catch (error) {
    return {
      ok: false,
      status: 'blocked',
      blocker: 'onnxruntime-node-unavailable-in-electron',
      error: errorRecord(error)
    };
  }

  let session;
  try {
    const model = createTinyIdentityOnnxModel();
    session = await ort.InferenceSession.create(model, { executionProviders: ['cpu'] });
    const outputs = await session.run({
      X: new ort.Tensor('float32', Float32Array.of(7), [1])
    });
    const output = outputs.Y;
    const value = output && output.data ? Number(output.data[0]) : Number.NaN;
    const ok = output?.type === 'float32'
      && JSON.stringify(output.dims) === JSON.stringify([1])
      && value === 7;
    return {
      ok,
      status: ok ? 'passed' : 'failed',
      blocker: ok ? null : 'tiny-identity-output-mismatch',
      provider: 'cpu',
      model: {
        source: 'deterministic-in-memory-protobuf',
        irVersion: 8,
        opset: 13,
        operation: 'Identity',
        bytes: model.byteLength,
        sha256: sha256(model)
      },
      input: { name: 'X', type: 'float32', dims: [1], value: 7 },
      output: {
        name: 'Y',
        type: output?.type || null,
        dims: output?.dims || null,
        value: Number.isFinite(value) ? value : null
      }
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      blocker: 'tiny-onnx-inference-failed-in-electron',
      error: errorRecord(error)
    };
  } finally {
    if (session && typeof session.release === 'function') await session.release();
  }
}

async function runSharpSmoke() {
  let sharp;
  try {
    const module = await import('sharp');
    sharp = module.default || module;
  } catch (error) {
    return {
      ok: false,
      status: 'blocked',
      blocker: 'sharp-unavailable-in-electron',
      error: errorRecord(error)
    };
  }
  try {
    const pixels = Buffer.from([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255
    ]);
    const { data, info } = await sharp(pixels, {
      raw: { width: 2, height: 2, channels: 4 }
    }).resize(1, 1, { kernel: 'nearest' }).png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
    const metadata = await sharp(data).metadata();
    const ok = info.format === 'png'
      && info.width === 1
      && info.height === 1
      && metadata.format === 'png'
      && metadata.width === 1
      && metadata.height === 1;
    return {
      ok,
      status: ok ? 'passed' : 'failed',
      blocker: ok ? null : 'sharp-output-contract-mismatch',
      source: 'deterministic-in-memory-rgba',
      versions: sharp.versions || null,
      output: {
        bytes: data.byteLength,
        sha256: sha256(data),
        info,
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels
        }
      }
    };
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      blocker: 'sharp-native-operation-failed-in-electron',
      error: errorRecord(error)
    };
  }
}

function writeReport(report) {
  fs.mkdirSync(resultDir, { recursive: true });
  const safeLane = String(lane || 'unknown').replace(/[^a-z0-9._-]+/giu, '-');
  const reportPath = path.join(resultDir, `native-runtime-${safeLane}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

async function run() {
  const host = parseHostRuntime();
  const embedded = {
    processType: process.type || null,
    node: process.versions.node || null,
    electron: process.versions.electron || null,
    modules: process.versions.modules || null,
    napi: process.versions.napi || null,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid
  };
  const runtimeChecks = [
    {
      id: 'known-host-lane',
      ok: Boolean(expectedHost),
      expected: Object.keys(policy.hostLanes || {}),
      observed: lane
    },
    {
      id: 'exact-launcher-host-node',
      ok: Boolean(expectedHost) && host?.node === expectedHost.node,
      expected: expectedHost?.node || null,
      observed: host?.node || null
    },
    {
      id: 'exact-launcher-host-npm',
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
      id: 'host-and-electron-process-separated',
      ok: Number.isInteger(host?.pid) && host.pid !== embedded.pid,
      expected: 'different-process-domains',
      observed: { hostPid: host?.pid || null, embeddedPid: embedded.pid }
    }
  ];
  const [onnx, sharp] = await Promise.all([runOnnxSmoke(), runSharpSmoke()]);
  const ok = runtimeChecks.every((check) => check.ok === true) && onnx.ok === true && sharp.ok === true;
  const report = {
    schema: 'xtend-llm.native-runtime-evidence.v1',
    ok,
    status: ok ? 'passed' : (onnx.status === 'blocked' || sharp.status === 'blocked' ? 'blocked' : 'failed'),
    generatedAt: new Date().toISOString(),
    lane,
    networkAllowed: false,
    runtime: {
      launcherHost: host,
      electronMain: embedded,
      installedElectronPackage: electronPackage.version
    },
    runtimeChecks,
    onnx,
    sharp
  };
  const reportPath = writeReport(report);
  console.log(`${ok ? 'Native runtime evidence passed' : `Native runtime evidence ${report.status}`}: ${reportPath}`);
  app.exit(ok ? 0 : 1);
}

app.whenReady().then(run).catch((error) => {
  const reportPath = writeReport({
    schema: 'xtend-llm.native-runtime-evidence.v1',
    ok: false,
    status: 'failed',
    generatedAt: new Date().toISOString(),
    lane,
    networkAllowed: false,
    error: errorRecord(error)
  });
  console.error(`Native runtime evidence failed: ${reportPath}`);
  app.exit(1);
});

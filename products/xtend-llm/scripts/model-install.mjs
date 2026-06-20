import fs from 'node:fs';
import path from 'node:path';
import { Transform, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import {
  QWEN3_8B_MODEL_ID,
  TARGET_MODEL_ID
} from '../src/main/constants.mjs';
import {
  createModelCachePaths,
  readInstalledModelManifest,
  resolveDefaultUserDataPath,
  safeCachePath,
  writeInstalledModelManifest
} from '../src/main/model-cache.mjs';
import {
  createModelLoadPlan,
  DTYPE_FILE_NAMES,
  formatUnsupportedModelReport,
  QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER
} from '../src/llm/model-profile.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter((arg) => arg !== '--');
const argMap = new Map();
for (const arg of args) {
  const [key, ...rest] = arg.split('=');
  argMap.set(key, rest.length ? rest.join('=') : 'true');
}

const modelId = argMap.get('--model')
  || process.env.XTEND_LLM_INSTALL_MODEL
  || (argMap.has('--target') ? QWEN3_8B_MODEL_ID : TARGET_MODEL_ID);
const revision = argMap.get('--revision') || process.env.XTEND_LLM_INSTALL_REVISION || 'main';
const userData = path.resolve(argMap.get('--user-data') || resolveDefaultUserDataPath());
const force = argMap.has('--force') || process.env.XTEND_LLM_INSTALL_FORCE === '1';
const quiet = argMap.has('--quiet');

function log(message) {
  if (!quiet) console.log(`[xtend-llm-installer] ${message}`);
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GiB`;
}

function encodeModelPath(model) {
  return String(model).split('/').map((part) => encodeURIComponent(part)).join('/');
}

async function fetchModelTree(model, rev) {
  const url = `https://huggingface.co/api/models/${encodeModelPath(model)}/tree/${encodeURIComponent(rev)}?recursive=true`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Could not inspect Hugging Face tree for ${model}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function normalizeTreePaths(tree) {
  return new Set((Array.isArray(tree) ? tree : [])
    .map((entry) => entry && (entry.path || entry.rfilename))
    .filter(Boolean)
    .map((entry) => String(entry).replace(/^\/+/u, '')));
}

function treeEntryPath(entry) {
  return entry && (entry.path || entry.rfilename)
    ? String(entry.path || entry.rfilename).replace(/^\/+/u, '')
    : '';
}

function treeEntrySize(entry) {
  const direct = Number(entry && entry.size);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const lfs = Number(entry && entry.lfs && entry.lfs.size);
  if (Number.isFinite(lfs) && lfs > 0) return lfs;
  return 0;
}

function createTreeSizeIndex(tree) {
  const sizes = new Map();
  for (const entry of Array.isArray(tree) ? tree : []) {
    const filePath = treeEntryPath(entry);
    const size = treeEntrySize(entry);
    if (filePath && size > 0) sizes.set(filePath, size);
  }
  return sizes;
}

function collectCommonFiles(paths, prefix = '') {
  return [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'generation_config.json',
    'special_tokens_map.json',
    'chat_template.jinja'
  ]
    .map((fileName) => `${prefix}${fileName}`)
    .filter((fileName) => paths.has(fileName));
}

function modelFilesForPlan(plan, paths) {
  if (plan.kind === 'transformers-js-layout') {
    const subfolder = plan.pipelineOptions.subfolder ? `${plan.pipelineOptions.subfolder}/` : '';
    const modelFile = `${subfolder}${DTYPE_FILE_NAMES[plan.selectedDtype] || 'model.onnx'}`;
    return [...collectCommonFiles(paths), modelFile].filter((fileName) => paths.has(fileName));
  }
  if (plan.kind === 'onnxruntime-webgpu-layout') {
    const prefix = `${QWEN3_8B_ONNX_RUNTIME_WEBGPU_SUBFOLDER}/`;
    return [
      ...collectCommonFiles(paths, prefix),
      `${prefix}model.onnx`,
      `${prefix}model.onnx.data`
    ].filter((fileName) => paths.has(fileName));
  }
  return [];
}

function createProgressTransform(label, total) {
  let loaded = 0;
  let lastPercent = -1;
  let lastAt = 0;
  return new Transform({
    transform(chunk, _encoding, callback) {
      loaded += chunk.length;
      const percent = total > 0 ? Math.floor(loaded / total * 100) : 0;
      const now = Date.now();
      if (now - lastAt > 1500 || percent >= lastPercent + 5 || loaded === total) {
        lastAt = now;
        lastPercent = percent;
        log(`downloading ${label}: ${formatBytes(loaded)} / ${total ? formatBytes(total) : '?'}${total ? ` (${percent}%)` : ''}`);
      }
      callback(null, chunk);
    }
  });
}

function assertExpectedSize(fileName, actualBytes, expectedBytes, source) {
  if (expectedBytes > 0 && actualBytes !== expectedBytes) {
    throw new Error(
      `Downloaded file size mismatch for ${fileName}: expected ${formatBytes(expectedBytes)} from ${source}, got ${formatBytes(actualBytes)}.`
    );
  }
}

async function downloadFile(model, rev, fileName, cacheRoot, expectedRemoteBytes = 0) {
  const cachePath = safeCachePath(cacheRoot, `${model}/resolve/${rev}/${fileName}`);
  if (!force && fs.existsSync(cachePath)) {
    const size = fs.statSync(cachePath).size;
    if (expectedRemoteBytes > 0 && size !== expectedRemoteBytes) {
      log(`cache stale ${fileName}: expected ${formatBytes(expectedRemoteBytes)}, found ${formatBytes(size)}`);
      fs.rmSync(cachePath, { force: true });
    } else {
      log(`cache hit ${fileName} (${formatBytes(size)})`);
      return {
        path: fileName,
        cachePath,
        bytes: size,
        expectedBytes: expectedRemoteBytes || size,
        cached: true
      };
    }
  }
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  for (const entry of fs.readdirSync(path.dirname(cachePath), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.startsWith(`${path.basename(cachePath)}.tmp-`)) {
      fs.rmSync(path.join(path.dirname(cachePath), entry.name), { force: true });
    }
  }
  const url = `https://huggingface.co/${model}/resolve/${encodeURIComponent(rev)}/${fileName}`;
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${fileName}: ${response.status} ${response.statusText}`);
  }
  const total = Number.parseInt(response.headers.get('content-length') || '0', 10) || 0;
  const expectedBytes = expectedRemoteBytes || total;
  if (expectedRemoteBytes > 0 && total > 0 && expectedRemoteBytes !== total) {
    log(`size header differs ${fileName}: tree ${formatBytes(expectedRemoteBytes)}, response ${formatBytes(total)}`);
  }
  const tmpPath = `${cachePath}.tmp-${process.pid}`;
  log(`download start ${fileName}`);
  try {
    await pipeline(
      Readable.fromWeb(response.body),
      createProgressTransform(fileName, total),
      fs.createWriteStream(tmpPath)
    );
    const size = fs.statSync(tmpPath).size;
    assertExpectedSize(fileName, size, expectedBytes, expectedRemoteBytes > 0 ? 'Hugging Face tree metadata' : 'HTTP content-length');
    fs.renameSync(tmpPath, cachePath);
  } catch (error) {
    if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true });
    throw error;
  }
  const size = fs.statSync(cachePath).size;
  log(`cached ${fileName} (${formatBytes(size)})`);
  return {
    path: fileName,
    cachePath,
    bytes: size,
    expectedBytes: expectedBytes || size,
    cached: false
  };
}

async function main() {
  const cache = createModelCachePaths(userData, modelId);
  log(`model: ${modelId}`);
  log(`userData: ${userData}`);
  log(`cacheRoot: ${cache.root}`);
  const tree = await fetchModelTree(modelId, revision);
  const plan = createModelLoadPlan(modelId, tree);
  if (plan.kind === 'unsupported-layout') {
    const message = formatUnsupportedModelReport(plan);
    const report = {
      schema: 'xtend-llm.model-install-report.v1',
      ok: false,
      status: 'unsupported-model',
      modelId,
      revision,
      userData,
      cacheRoot: cache.root,
      message,
      createdAt: new Date().toISOString()
    };
    fs.mkdirSync(cache.root, { recursive: true });
    fs.writeFileSync(cache.manifestPath, `${JSON.stringify(report, null, 2)}\n`);
    console.error(message);
    console.error(`Report: ${cache.manifestPath}`);
    process.exit(1);
    return;
  }
  const paths = normalizeTreePaths(tree);
  const sizes = createTreeSizeIndex(tree);
  const files = Array.from(new Set(modelFilesForPlan(plan, paths)));
  if (files.length === 0) throw new Error(`No downloadable runtime files resolved for ${modelId}.`);
  const installedFiles = [];
  for (const fileName of files) {
    installedFiles.push(await downloadFile(modelId, revision, fileName, cache.root, sizes.get(fileName) || 0));
  }
  const existing = readInstalledModelManifest(userData);
  const modelManifest = {
    schema: 'xtend-llm.installed-model.v1',
    ok: true,
    modelId,
    activeModelId: modelId,
    revision,
    plan: {
      kind: plan.kind,
      selectedDtype: plan.selectedDtype,
      availableDtypes: plan.availableDtypes,
      remotePathTemplate: plan.remotePathTemplate
    },
    userData,
    cacheRoot: cache.root,
    files: installedFiles,
    installedAt: new Date().toISOString()
  };
  const manifest = {
    schema: 'xtend-llm.installed-models.v1',
    activeModelId: modelId,
    userData,
    cacheRoot: cache.root,
    models: {
      ...(existing && existing.models ? existing.models : {}),
      [modelId]: modelManifest
    },
    updatedAt: new Date().toISOString()
  };
  fs.mkdirSync(cache.root, { recursive: true });
  fs.writeFileSync(cache.manifestPath, `${JSON.stringify(modelManifest, null, 2)}\n`);
  const installedManifestPath = writeInstalledModelManifest(userData, manifest);
  log(`installed manifest: ${installedManifestPath}`);
  log(`model manifest: ${cache.manifestPath}`);
  log(`done`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});

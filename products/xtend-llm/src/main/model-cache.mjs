import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PRODUCT_TITLE, TARGET_MODEL_ID } from './constants.mjs';

export const DTYPE_PREFERENCE = Object.freeze(['q4f16', 'q4', 'q8', 'fp16', 'fp32']);

export function choosePreferredDtype(available = DTYPE_PREFERENCE) {
  const normalized = new Set((available || []).map((entry) => String(entry).trim()).filter(Boolean));
  return DTYPE_PREFERENCE.find((dtype) => normalized.has(dtype)) || 'fp32';
}

export function createModelCachePaths(userData, modelId = TARGET_MODEL_ID) {
  const safeModel = String(modelId).replace(/[^a-zA-Z0-9_.-]+/gu, '__');
  const root = path.join(userData, 'model-cache');
  return {
    root,
    modelId,
    modelRoot: path.join(root, safeModel),
    manifestPath: path.join(root, `${safeModel}.manifest.json`),
    installedManifestPath: path.join(root, 'installed-models.json')
  };
}

export function resolveDefaultUserDataPath(platform = process.platform, home = os.homedir()) {
  if (process.env.XTEND_LLM_USER_DATA) return path.resolve(process.env.XTEND_LLM_USER_DATA);
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', PRODUCT_TITLE);
  if (platform === 'win32') {
    const base = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(base, PRODUCT_TITLE);
  }
  const base = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  return path.join(base, PRODUCT_TITLE);
}

export function readInstalledModelManifest(userData) {
  const manifestPath = createModelCachePaths(userData).installedManifestPath;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

export function writeInstalledModelManifest(userData, manifest) {
  const manifestPath = createModelCachePaths(userData).installedManifestPath;
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
}

export function validateInstalledModelManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, reason: 'Installed model manifest is missing.' };
  }
  const activeModelId = String(manifest.activeModelId || '');
  const model = manifest.models && manifest.models[activeModelId];
  if (!activeModelId || !model || !Array.isArray(model.files) || model.files.length === 0) {
    return { ok: false, reason: 'Installed model manifest has no active model files.' };
  }
  const cacheRoot = path.resolve(String(manifest.cacheRoot || model.cacheRoot || ''));
  if (!cacheRoot) return { ok: false, reason: 'Installed model manifest has no cache root.' };

  for (const file of model.files) {
    const cachePath = path.resolve(String(file && file.cachePath || ''));
    const relative = path.relative(cacheRoot, cachePath);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      return { ok: false, reason: `Installed model file escapes cache root: ${cachePath}` };
    }
    const expectedBytes = Number(file && file.expectedBytes);
    if (!Number.isFinite(expectedBytes) || expectedBytes <= 0) {
      return { ok: false, reason: `Installed model file is missing expected size: ${file && file.path || cachePath}` };
    }
    try {
      const actualBytes = fs.statSync(cachePath).size;
      if (actualBytes !== expectedBytes) {
        return {
          ok: false,
          reason: `Installed model file size mismatch for ${file.path}: expected ${expectedBytes}, got ${actualBytes}.`
        };
      }
    } catch (_) {
      return { ok: false, reason: `Installed model file is missing: ${file && file.path || cachePath}` };
    }
  }

  return { ok: true, modelId: activeModelId, model };
}

export function createModelState(overrides = {}) {
  return {
    schema: 'xtend-llm.model-state.v1',
    model: TARGET_MODEL_ID,
    dtype: '',
    phase: 'idle',
    status: 'Model not loaded.',
    webgpu: false,
    loaded: 0,
    total: 0,
    progress: 0,
    ...overrides
  };
}

export function safeCachePath(root, requestPath) {
  const parts = String(requestPath || '')
    .replace(/^\/+/u, '')
    .split('/')
    .filter((part) => part && part !== '.');
  if (parts.some((part) => part === '..')) throw new Error('Model cache path escaped cache root.');
  const clean = parts.join(path.sep);
  const resolved = path.resolve(root, clean);
  const normalizedRoot = path.resolve(root);
  if (!resolved.startsWith(normalizedRoot)) throw new Error('Model cache path escaped cache root.');
  return resolved;
}

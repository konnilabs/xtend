'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TAILWIND_TOOLCHAIN_SCHEMA = 'xtend.material.tailwind-toolchain.v1';
const TAILWIND_COMPILE_REQUEST_SCHEMA = 'xtend.material.tailwind-compile-request.v1';
const TAILWIND_COMPILE_RESULT_SCHEMA = 'xtend.material.tailwind-compile-result.v1';
const TAILWIND_VERSION = '4.3.2';
const DEFAULT_STYLESHEET = [
  '@layer theme, utilities;',
  '@import "tailwindcss/theme.css" layer(theme);',
  '@import "tailwindcss/utilities.css" layer(utilities);'
].join('\n');

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((record, key) => {
    if (value[key] !== undefined && typeof value[key] !== 'function') record[key] = stableValue(value[key]);
    return record;
  }, {});
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function containedBy(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function packageRecord(packageName, resolveFn = require.resolve) {
  const entry = resolveFn(packageName);
  let directory = path.dirname(entry);
  while (directory !== path.dirname(directory)) {
    const manifestPath = path.join(directory, 'package.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.name === packageName) {
        let lockDirectory = directory;
        let integrity = null;
        while (lockDirectory !== path.dirname(lockDirectory)) {
          const lockPath = path.join(lockDirectory, 'package-lock.json');
          if (fs.existsSync(lockPath)) {
            const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
            integrity = lock.packages && lock.packages[`node_modules/${packageName}`] && lock.packages[`node_modules/${packageName}`].integrity || null;
            break;
          }
          lockDirectory = path.dirname(lockDirectory);
        }
        return { name: manifest.name, version: manifest.version, license: manifest.license || null, path: directory, manifestPath, integrity };
      }
    }
    directory = path.dirname(directory);
  }
  throw new Error(`Package manifest for ${packageName} was not found.`);
}

function toolchainInspection(options = {}) {
  const resolveFn = options.resolve || require.resolve;
  try {
    const node = packageRecord('@tailwindcss/node', resolveFn);
    const tailwindcss = packageRecord('tailwindcss', resolveFn);
    const versionPinned = node.version === TAILWIND_VERSION && tailwindcss.version === TAILWIND_VERSION;
    return {
      schema: TAILWIND_TOOLCHAIN_SCHEMA,
      status: versionPinned ? 'ready' : 'blocked',
      available: true,
      airGapped: true,
      runtimeBoundary: 'build-time-only',
      versions: { adapter: '0.1.0', node: node.version, tailwindcss: tailwindcss.version },
      packages: [node, tailwindcss].map((entry) => ({ name: entry.name, version: entry.version, license: entry.license, path: entry.path, integrity: entry.integrity })),
      networkPolicy: 'forbidden',
      discovery: 'explicit-sources-only',
      preflight: 'disabled',
      cache: 'memory-only',
      tempFiles: false,
      diagnostics: versionPinned ? [] : [{
        code: 'xtend.material.tailwind.version_mismatch',
        severity: 'error',
        message: `Tailwind toolchain must resolve exactly to ${TAILWIND_VERSION}.`
      }]
    };
  } catch (error) {
    return {
      schema: TAILWIND_TOOLCHAIN_SCHEMA,
      status: 'unavailable',
      available: false,
      airGapped: true,
      runtimeBoundary: 'build-time-only',
      versions: { adapter: '0.1.0', node: null, tailwindcss: null },
      packages: [],
      networkPolicy: 'forbidden',
      discovery: 'explicit-sources-only',
      preflight: 'disabled',
      cache: 'memory-only',
      tempFiles: false,
      diagnostics: [{
        code: 'xtend.maraca.css_provider.unavailable',
        severity: 'error',
        message: error && error.message || 'Local Tailwind toolchain is unavailable.'
      }]
    };
  }
}

function fail(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function assertAirGappedStylesheet(cssText) {
  const remoteDirective = /@(import|plugin|config)\s+(?:url\()?\s*["']?(?:https?:)?\/\//iu.exec(cssText);
  if (remoteDirective) {
    fail('xtend.material.tailwind.network_source_blocked', 'Remote Tailwind imports, plugins and configs are forbidden in air-gapped builds.');
  }
  if (/@(?:plugin|config)\b/iu.test(cssText)) {
    fail('xtend.material.tailwind.executable_extension_blocked', 'Tailwind JavaScript plugins and configs are disabled in the air-gapped XTM-03 compiler endpoint.');
  }
  const imports = Array.from(cssText.matchAll(/@import\s+["']([^"']+)["']/giu)).map((match) => match[1]);
  const allowedImports = new Set(['tailwindcss/theme.css', 'tailwindcss/utilities.css']);
  if (imports.some((request) => !allowedImports.has(request))) {
    fail('xtend.maraca.css_provider.source_blocked', 'Only the pinned Tailwind theme.css and utilities.css imports are accepted by the air-gapped compiler endpoint.');
  }
  if (/@import\s+["']tailwindcss["']/u.test(cssText) || /tailwindcss\/preflight\.css/u.test(cssText)) {
    fail('xtend.material.tailwind.preflight_blocked', 'Tailwind Preflight is disabled for the XTM-03 MVP; import theme.css and utilities.css explicitly.');
  }
}

function normalizeCandidates(values) {
  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value).trim())
    .filter((value) => value && !/[\s"'`<>]/u.test(value))))
    .sort();
}

function extractCandidates(content) {
  const candidates = [];
  const patterns = [
    /\bclass(?:Name)?\s*=\s*["']([^"']+)["']/giu,
    /["']?class["']?\s*:\s*["']([^"']+)["']/giu
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(String(content || '')))) candidates.push(...match[1].split(/\s+/u));
  });
  return normalizeCandidates(candidates);
}

function readExplicitSources(sources, sourceRoot) {
  const records = [];
  (Array.isArray(sources) ? sources : []).forEach((source) => {
    const input = typeof source === 'string' ? { path: source } : (source || {});
    const absolutePath = input.path ? path.resolve(sourceRoot, input.path) : null;
    if (absolutePath && !containedBy(sourceRoot, absolutePath)) {
      fail('xtend.maraca.css_provider.source_blocked', `Tailwind source escapes the explicit source root: ${input.path}`, { path: input.path });
    }
    const content = typeof input.content === 'string'
      ? input.content
      : (absolutePath && fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()
        ? fs.readFileSync(absolutePath, 'utf8')
        : '');
    records.push({
      path: input.path || null,
      absolutePath,
      kind: input.kind || 'content',
      content,
      fingerprint: fingerprint(content)
    });
  });
  return records;
}

async function compileTailwindCss(input = {}, options = {}) {
  const inspection = toolchainInspection(options);
  if (!inspection.available || inspection.status !== 'ready') {
    fail('xtend.maraca.css_provider.unavailable', 'Pinned local Tailwind toolchain is unavailable.', { inspection });
  }
  if (input.preflight && input.preflight !== 'disabled') {
    fail('xtend.material.tailwind.preflight_blocked', 'XTM-03 supports preflight=disabled only.');
  }
  const sourceRoot = path.resolve(input.sourceRoot || process.cwd());
  const base = path.resolve(input.base || sourceRoot);
  if (!containedBy(sourceRoot, base)) {
    fail('xtend.maraca.css_provider.source_blocked', 'Tailwind compiler base must be inside the explicit source root.');
  }
  const cssText = typeof input.css === 'string' ? input.css : DEFAULT_STYLESHEET;
  assertAirGappedStylesheet(cssText);
  const sourceRecords = readExplicitSources(input.sources, sourceRoot);
  const candidates = normalizeCandidates((input.candidates || []).concat(sourceRecords.flatMap((source) => extractCandidates(source.content))));
  const dependencies = [];
  const tailwindNode = options.tailwindNode || require('@tailwindcss/node');
  const compiler = await tailwindNode.compile(cssText, {
    base,
    from: input.from || undefined,
    onDependency(dependency) {
      const absoluteDependency = path.resolve(dependency);
      dependencies.push(absoluteDependency);
      if (!containedBy(sourceRoot, absoluteDependency) && !inspection.packages.some((entry) => containedBy(entry.path, absoluteDependency))) {
        fail('xtend.maraca.css_provider.source_blocked', `Tailwind dependency is outside the source root and pinned toolchain: ${dependency}`);
      }
    }
  });
  const generated = compiler.build(candidates);
  const optimized = input.minify === false
    ? { code: generated, map: undefined }
    : tailwindNode.optimize(generated, { file: input.output || 'xtend.maraca.css', minify: true });
  const result = {
    schema: TAILWIND_COMPILE_RESULT_SCHEMA,
    status: 'ready',
    cssText: optimized.code,
    sourceMap: optimized.map || null,
    bytes: Buffer.byteLength(optimized.code),
    outputFingerprint: fingerprint(optimized.code),
    requestFingerprint: fingerprint({
      schema: TAILWIND_COMPILE_REQUEST_SCHEMA,
      cssText,
      sourceRoot,
      base,
      candidates,
      sourceFingerprints: sourceRecords.map((source) => ({ path: source.path, fingerprint: source.fingerprint })),
      minify: input.minify !== false,
      preflight: 'disabled'
    }),
    candidates,
    candidateCount: candidates.length,
    sources: sourceRecords.map((source) => ({ path: source.path, kind: source.kind, fingerprint: source.fingerprint })),
    dependencies: Array.from(new Set(dependencies)).sort(),
    toolchain: inspection,
    airGap: {
      networkAccess: false,
      automaticDiscovery: false,
      sourceRoot,
      tempFiles: false,
      cache: 'memory-only'
    }
  };
  result.fingerprint = fingerprint({ ...result, cssText: undefined });
  return result;
}

function createTailwindToolchainApi(options = {}) {
  return Object.freeze({
    schema: TAILWIND_TOOLCHAIN_SCHEMA,
    inspect: () => toolchainInspection(options),
    compile: (input) => compileTailwindCss(input, options),
    extractCandidates,
    dispose: async () => ({ status: 'disposed', tempFilesRemoved: 0, cacheEntriesRemoved: 0 })
  });
}

module.exports = {
  DEFAULT_STYLESHEET,
  TAILWIND_COMPILE_REQUEST_SCHEMA,
  TAILWIND_COMPILE_RESULT_SCHEMA,
  TAILWIND_TOOLCHAIN_SCHEMA,
  TAILWIND_VERSION,
  compileTailwindCss,
  createTailwindToolchainApi,
  extractCandidates,
  toolchainInspection
};

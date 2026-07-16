'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  createCssArtifact,
  createCssBuildEvidence,
  createCssProvider
} = require('@ccslabs/xtend-maraca/css-provider');
const {
  DEFAULT_STYLESHEET,
  TAILWIND_VERSION,
  createTailwindToolchainApi
} = require('./toolchain');
const {
  createMaterialRecipeRegistry,
  createMaterialRecipeStylesheet,
  createRmtCssSourceInventory
} = require('./source-inventory');

function loadTokenBridge(rootDir, suppliedBridge) {
  if (suppliedBridge && suppliedBridge.cssText) return suppliedBridge;
  const localModule = path.resolve(rootDir, 'design-tokens', 'tailwind', 'xtend-tailwind-token-bridge.js');
  const workspaceModule = path.resolve(__dirname, '..', 'design-tokens', 'tailwind', 'xtend-tailwind-token-bridge.js');
  let bridgeApi;
  let bridge;
  if (fs.existsSync(localModule)) {
    bridgeApi = require(localModule);
    bridge = bridgeApi.createXtendTailwindTokenBridge({ baseDir: rootDir });
  } else if (fs.existsSync(workspaceModule)) {
    bridgeApi = require(workspaceModule);
    bridge = bridgeApi.createXtendTailwindTokenBridge({ baseDir: path.resolve(__dirname, '..') });
  } else {
    try {
      const installedModule = require.resolve('@ccslabs/xtend/design-tokens/tailwind/token-bridge', { paths: [rootDir, __dirname] });
      bridgeApi = require(installedModule);
      bridge = bridgeApi.createXtendTailwindTokenBridge();
    } catch (_error) {
      return null;
    }
  }
  const report = bridgeApi.validateXtendTailwindTokenBridge(bridge);
  if (!report.ok) {
    const error = new Error(`XTend Tailwind token bridge is invalid: ${report.errors.join('; ')}`);
    error.code = 'xtend.material.tailwind.token_bridge_invalid';
    throw error;
  }
  return bridge;
}

function loadDesignKitStyles(rootDir, suppliedStyles) {
  if (typeof suppliedStyles === 'string') return suppliedStyles;
  const localStyles = path.resolve(rootDir, 'xtend-material', 'styles.css');
  if (fs.existsSync(localStyles)) return fs.readFileSync(localStyles, 'utf8');
  const workspaceStyles = path.resolve(__dirname, '..', 'xtend-material', 'styles.css');
  if (fs.existsSync(workspaceStyles)) return fs.readFileSync(workspaceStyles, 'utf8');
  try {
    return fs.readFileSync(require.resolve('@xtend-material/core/styles.css', { paths: [rootDir, __dirname] }), 'utf8');
  } catch (_error) {
    return '';
  }
}

const TAILWIND_PROVIDER_ID = 'tailwind';
const TAILWIND_ADAPTER_VERSION = '0.1.0';

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

function createTailwindCssProvider(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const toolchain = options.toolchain || createTailwindToolchainApi(options.toolchainOptions);
  const tokenBridge = loadTokenBridge(rootDir, options.tokenBridge);
  const designKitStyles = loadDesignKitStyles(rootDir, options.designKitStyles);
  const designKitFingerprint = designKitStyles ? fingerprint(designKitStyles) : null;
  let lastCompileResult = null;
  let lastInventory = null;
  function inventoryForRequest(request) {
    const supplied = request.metadata && request.metadata.cssInventory;
    if (supplied && supplied.schema === 'xtend.rmt.css-source-inventory.v1') return supplied;
    const diagnostics = [];
    const sources = (request.sources || []).map((source) => {
      const absolutePath = path.resolve(rootDir, source.path || '');
      const relative = path.relative(rootDir, absolutePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        diagnostics.push({
          code: 'rmt.css.utility.source_outside_policy',
          severity: 'error',
          message: `CSS source is outside the explicit Maraca root: ${source.path}`,
          source: { file: source.path, line: null, column: null },
          repairHint: 'Move the source below the application root and declare it through cssSources.'
        });
        return null;
      }
      return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()
        ? { path: source.path, content: fs.readFileSync(absolutePath, 'utf8') }
        : null;
    }).filter(Boolean);
    const inventory = createRmtCssSourceInventory({ sources, diagnostics });
    return inventory;
  }
  return createCssProvider({
    id: TAILWIND_PROVIDER_ID,
    version: TAILWIND_ADAPTER_VERSION,
    label: 'XTend Material Tailwind CSS provider',
    capabilities: { inline: true, external: true, minify: true, sourceMaps: false },
    sourcePolicy: { explicitSources: true, automaticDiscovery: false, network: false },
    inspect(request) {
      const inspection = toolchain.inspect();
      lastInventory = inventoryForRequest(request);
      const preflight = request.metadata && request.metadata.preflight || 'disabled';
      const diagnostics = (inspection.diagnostics || []).concat(lastInventory.diagnostics || []);
      if (preflight !== 'disabled') diagnostics.push({
        code: 'xtend.material.tailwind.preflight_blocked',
        severity: 'error',
        message: 'The XTM-03 Tailwind provider requires cssPreflight=disabled.'
      });
      return {
        status: inspection.available && diagnostics.length === 0 ? 'ready' : (inspection.available ? 'blocked' : 'unavailable'),
        available: inspection.available,
        toolchain: inspection,
        inventory: lastInventory,
        tokenBridge: tokenBridge ? {
          schema: tokenBridge.schema,
          fingerprint: tokenBridge.fingerprint,
          themePacks: tokenBridge.themePacks,
          densityPacks: tokenBridge.densityPacks,
          experiencePacks: tokenBridge.experiencePacks
        } : null,
        designKit: designKitStyles ? { schema: 'xtend.material.design-kit.v1', package: '@xtend-material/core', version: '0.1.0', stylesFingerprint: designKitFingerprint } : null,
        diagnostics
      };
    },
    plan(request) {
      return {
        status: 'ready',
        output: request.output,
        steps: ['validate-air-gap', 'load-xtend-token-bridge', 'read-explicit-sources', 'compile-tailwind-v4', 'optimize-lightningcss'],
        metadata: {
          sourceRoot: rootDir,
          automaticDiscovery: false,
          preflight: 'disabled',
          tempPolicy: 'memory-only'
        }
      };
    },
    async build(plan, request) {
      const inputPath = request.input ? path.resolve(rootDir, request.input) : null;
      if (inputPath && !fs.existsSync(inputPath)) {
        const error = new Error(`Tailwind CSS input not found: ${request.input}`);
        error.code = 'xtend.maraca.css_provider.source_blocked';
        throw error;
      }
      const inputCss = inputPath ? fs.readFileSync(inputPath, 'utf8') : DEFAULT_STYLESHEET;
      const css = [inputCss, tokenBridge && tokenBridge.cssText || '', designKitStyles, lastInventory && lastInventory.recipeStylesheet || ''].filter(Boolean).join('\n');
      lastCompileResult = await toolchain.compile({
        css,
        from: inputPath,
        base: inputPath ? path.dirname(inputPath) : rootDir,
        sourceRoot: rootDir,
        sources: [],
        candidates: lastInventory && lastInventory.candidates || [],
        minify: request.minify,
        preflight: request.metadata && request.metadata.preflight || 'disabled',
        output: request.output
      });
      return createCssArtifact({
        status: 'ready',
        mode: request.mode,
        fileName: request.output,
        cssText: lastCompileResult.cssText,
        sourceMap: lastCompileResult.sourceMap
      });
    },
    report(context) {
      const base = createCssBuildEvidence(context);
      const resolvedToolchain = lastCompileResult && lastCompileResult.toolchain || toolchain.inspect();
      const evidence = {
        ...base,
        adapter: { name: '@xtend-material/maraca-tailwind', version: TAILWIND_ADAPTER_VERSION },
        toolchain: resolvedToolchain,
        supplyChain: {
          schema: 'xtend.material.tailwind-supply-chain-evidence.v1',
          adapter: { name: '@xtend-material/maraca-tailwind', version: TAILWIND_ADAPTER_VERSION, license: 'Apache-2.0', provenance: true },
          designKit: { name: '@xtend-material/core', version: '0.1.0', license: 'Apache-2.0', provenance: true },
          packages: (resolvedToolchain.packages || []).map((entry) => ({ name: entry.name, version: entry.version, license: entry.license, integrity: entry.integrity })),
          lockfileIntegrityRequired: true
        },
        compileFingerprint: lastCompileResult && lastCompileResult.fingerprint || null,
        candidateCount: lastCompileResult && lastCompileResult.candidateCount || 0,
        inventory: lastInventory,
        tokenBridge: tokenBridge ? {
          schema: tokenBridge.schema,
          fingerprint: tokenBridge.fingerprint,
          sourceOfTruth: tokenBridge.sourceOfTruth,
          runtimeProvider: tokenBridge.runtimeProvider,
          themePacks: tokenBridge.themePacks,
          densityPacks: tokenBridge.densityPacks,
          experiencePacks: tokenBridge.experiencePacks,
          capabilities: tokenBridge.capabilities
        } : null,
        designKit: designKitStyles ? { schema: 'xtend.material.design-kit.v1', package: '@xtend-material/core', version: '0.1.0', stylesFingerprint: designKitFingerprint } : null,
        airGap: lastCompileResult && lastCompileResult.airGap || {
          networkAccess: false,
          automaticDiscovery: false,
          sourceRoot: rootDir,
          tempFiles: false,
          cache: 'memory-only'
        }
      };
      evidence.fingerprint = fingerprint({ ...evidence, fingerprint: undefined });
      return evidence;
    },
    async dispose() {
      lastCompileResult = null;
      lastInventory = null;
      return toolchain.dispose();
    }
  });
}

module.exports = {
  TAILWIND_ADAPTER_VERSION,
  TAILWIND_PROVIDER_ID,
  TAILWIND_VERSION,
  createTailwindCssProvider,
  createTailwindToolchainApi,
  createMaterialRecipeRegistry,
  createMaterialRecipeStylesheet,
  createRmtCssSourceInventory
};

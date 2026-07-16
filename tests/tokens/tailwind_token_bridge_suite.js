'use strict';

const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const {
  DENSITY_PACKS,
  EXPERIENCE_PACKS,
  THEME_PACKS,
  XTEND_MATERIAL_THEME_PATH,
  XTEND_TAILWIND_THEME_PATH,
  XTEND_TAILWIND_TOKEN_BRIDGE_LOCAL_GATE,
  XTEND_TAILWIND_TOKEN_BRIDGE_REPORT_SCHEMA,
  XTEND_TAILWIND_TOKEN_BRIDGE_SCHEMA,
  XTEND_TAILWIND_TOKEN_MATRIX_PATH,
  createXtendTailwindTokenBridge,
  validateXtendTailwindTokenBridge
} = require('../../design-tokens/tailwind/xtend-tailwind-token-bridge');
const { DEFAULT_STYLESHEET, createTailwindToolchainApi } = require('../../xtend-maraca-css-tailwind/toolchain');
const { createTailwindCssProvider } = require('../../xtend-maraca-css-tailwind');
const { createCssBuildRequest, runCssProviderLifecycle } = require('../../xtend-maraca/css-provider');

async function runTailwindTokenBridgeSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({ id: 'tailwind-token-bridge', label: 'XTM-05 Tailwind Token Bridge' });
  const backlog = fs.readFileSync(path.join(rootDir, 'development/BACKLOG-XTend-Material-Tailwind-CSS-Fast-Path.md'), 'utf8');
  const themeCss = fs.readFileSync(path.join(rootDir, XTEND_TAILWIND_THEME_PATH), 'utf8');
  const materialCss = fs.readFileSync(path.join(rootDir, XTEND_MATERIAL_THEME_PATH), 'utf8');
  const matrix = JSON.parse(fs.readFileSync(path.join(rootDir, XTEND_TAILWIND_TOKEN_MATRIX_PATH), 'utf8'));
  const bridge = createXtendTailwindTokenBridge({ baseDir: rootDir });
  const report = validateXtendTailwindTokenBridge(bridge);

  context.assert(bridge.schema === XTEND_TAILWIND_TOKEN_BRIDGE_SCHEMA, 'bridge exposes the stable XTM-05 schema');
  context.assert(report.schema === XTEND_TAILWIND_TOKEN_BRIDGE_REPORT_SCHEMA && report.ok, 'generated token bridge passes its validator');
  context.assert(matrix.mappings.length >= 25 && report.mappingCount === matrix.mappings.length, 'matrix covers a useful semantic token surface');
  context.assert(new Set(matrix.mappings.map((entry) => entry.category)).size >= 10, 'matrix covers color, layout, type, motion and elevation categories');
  context.assert(matrix.mappings.every((entry) => entry.xtendToken.startsWith('--xtend-') && entry.fallback), 'every Tailwind mapping has an XTend source and fallback');
  context.assert(matrix.mappings.every((entry) => themeCss.includes(`${entry.tailwindVariable}: var(${entry.xtendToken}, ${entry.fallback});`)), 'CSS bridge is exactly backed by the mapping matrix');
  context.assert(bridge.themePacks.join(',') === THEME_PACKS.join(',') && THEME_PACKS.length === 4, 'bridge exposes all four x-theme packs');
  context.assert(bridge.densityPacks.join(',') === DENSITY_PACKS.join(',') && DENSITY_PACKS.length === 3, 'bridge exposes all three density packs');
  context.assert(bridge.experiencePacks.map((pack) => pack.name).join(',') === EXPERIENCE_PACKS.join(','), 'bridge exposes enterprise and utility experience packs');
  context.assert(bridge.experiencePacks.find((pack) => pack.name === 'enterprise').recommendedDensity === 'comfortable', 'enterprise pack recommends readable comfortable density');
  context.assert(bridge.experiencePacks.find((pack) => pack.name === 'utility').recommendedDensity === 'compact', 'utility pack recommends space-efficient compact density');

  ['light', 'dark', 'high-contrast', 'forced-colors'].forEach((theme) => context.assert(materialCss.includes(`[data-theme="${theme}"]`) || theme === 'forced-colors' && materialCss.includes('[data-theme="forced-colors"]'), `runtime CSS supports ${theme}`));
  ['comfortable', 'compact', 'dense'].forEach((density) => context.assert(materialCss.includes(`[data-density="${density}"]`), `runtime CSS supports ${density}`));
  context.assert(materialCss.includes('[data-material-pack="enterprise"]') && materialCss.includes('[data-material-pack="utility"]'), 'experience pack selection is one declarative host attribute');
  context.assert(materialCss.includes('@media (forced-colors: active)') && materialCss.includes('ButtonFace') && materialCss.includes('CanvasText'), 'forced-colors uses platform system colors');
  context.assert(materialCss.includes('@media (prefers-reduced-motion: reduce)') && materialCss.includes(':focus-visible'), 'reduced motion and visible keyboard focus are built in');

  const unknownToken = createXtendTailwindTokenBridge({ baseDir: rootDir });
  unknownToken.matrix = JSON.parse(JSON.stringify(unknownToken.matrix));
  unknownToken.matrix.mappings[0].xtendToken = '--xtend-does-not-exist';
  context.assert(!validateXtendTailwindTokenBridge(unknownToken).ok, 'validator blocks unknown XTend token references');
  const missingFallback = createXtendTailwindTokenBridge({ baseDir: rootDir });
  missingFallback.matrix = JSON.parse(JSON.stringify(missingFallback.matrix));
  missingFallback.matrix.mappings[0].fallback = '';
  context.assert(!validateXtendTailwindTokenBridge(missingFallback).ok, 'validator blocks fallback-less token references');
  const fallbacklessCss = createXtendTailwindTokenBridge({ baseDir: rootDir });
  fallbacklessCss.cssText += '\n.xtm-invalid { color: var(--xtend-text-primary); }';
  context.assert(!validateXtendTailwindTokenBridge(fallbacklessCss).ok, 'validator scans Material CSS for fallback-less XTend references');
  const competingValue = createXtendTailwindTokenBridge({ baseDir: rootDir });
  competingValue.cssText = competingValue.cssText.replace('var(--xtend-color-action, Highlight)', '#6750a4');
  context.assert(validateXtendTailwindTokenBridge(competingValue).errors.some((error) => error.includes('competing Tailwind product value')), 'validator blocks a competing hard-coded Tailwind palette value');

  const compiled = await createTailwindToolchainApi().compile({
    css: `${DEFAULT_STYLESHEET}\n${bridge.cssText}\n@utility xtm-token-smoke { @apply bg-xtend-surface text-xtend-text rounded-xtend-panel; }`,
    sourceRoot: rootDir,
    candidates: ['xtm-token-smoke'],
    preflight: 'disabled',
    minify: false
  });
  context.assert(compiled.cssText.includes('.xtm-token-smoke') && compiled.cssText.includes('var(--xtend-surface-page'), 'pinned Tailwind toolchain compiles the XTend theme mapping');

  const providerResult = await runCssProviderLifecycle(createTailwindCssProvider({ rootDir }), createCssBuildRequest({
    provider: 'tailwind',
    mode: 'external',
    metadata: { preflight: 'disabled', cssInventory: {
      schema: 'xtend.rmt.css-source-inventory.v1',
      diagnostics: [], candidates: ['xtm-card'], materialClasses: ['xtm-card'], staticUtilities: ['border'], recipeUtilities: [],
      recipeStylesheet: '@utility xtm-card { @apply border; }', fingerprint: 'fixture'
    } }
  }));
  context.assert(providerResult.ok && providerResult.evidence.tokenBridge.fingerprint === bridge.fingerprint, 'provider evidence fingerprints the validated bridge');
  context.assert(providerResult.evidence.tokenBridge.capabilities.runtimeThemeSwitch && !providerResult.evidence.tokenBridge.capabilities.rebuildRequiredForPackSwitch, 'provider evidence proves runtime pack switching without rebuild');
  context.assert(backlog.includes('| `XTM-05` | P0/P1 | completed | WS3 |'), 'backlog marks XTM-05 completed');
  context.assert(backlog.includes(XTEND_TAILWIND_TOKEN_BRIDGE_LOCAL_GATE), 'backlog exposes the complete XTM-05 gate');

  return context.result({ report: { ...report, status: context.failures.length === 0 ? 'accepted' : 'blocked' } });
}

function printTailwindTokenBridgeReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTM-05 Tailwind token bridge gate passed.',
    failureTitle: 'XTM-05 Tailwind token bridge gate failed:'
  });
}

if (require.main === module) {
  runTailwindTokenBridgeSuite().then((result) => {
    printTailwindTokenBridgeReport(result);
    if (!result.ok) process.exit(1);
  }).catch((error) => {
    console.error(error && error.stack || error);
    process.exit(1);
  });
}

module.exports = { printTailwindTokenBridgeReport, runTailwindTokenBridgeSuite };

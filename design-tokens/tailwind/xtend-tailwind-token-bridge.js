'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { TOKEN_DEFINITIONS } = require('../xtend-design-tokens');
const { GLOBAL_ALIASES } = require('../xtheme-token-alias-layer');

const XTEND_TAILWIND_TOKEN_BRIDGE_SCHEMA = 'xtend.material.tailwind-token-bridge.v1';
const XTEND_TAILWIND_TOKEN_BRIDGE_REPORT_SCHEMA = 'xtend.material.tailwind-token-bridge-report.v1';
const XTEND_TAILWIND_TOKEN_MATRIX_SCHEMA = 'xtend.material.tailwind-token-matrix.v1';
const XTEND_TAILWIND_TOKEN_BRIDGE_WORKPACKAGE = 'XTM-05';
const XTEND_TAILWIND_THEME_PATH = 'design-tokens/tailwind/xtend-theme.css';
const XTEND_MATERIAL_THEME_PATH = 'design-tokens/tailwind/xtend-material-theme.css';
const XTEND_TAILWIND_TOKEN_MATRIX_PATH = 'design-tokens/tailwind/xtend-tailwind-token-matrix.json';
const XTEND_TAILWIND_TOKEN_BRIDGE_MODULE_PATH = 'design-tokens/tailwind/xtend-tailwind-token-bridge.js';
const XTEND_TAILWIND_TOKEN_BRIDGE_TYPES_PATH = 'design-tokens/tailwind/xtend-tailwind-token-bridge.d.ts';
const XTEND_TAILWIND_TOKEN_BRIDGE_SUITE_PATH = 'tests/tokens/tailwind_token_bridge_suite.js';
const XTEND_TAILWIND_TOKEN_BRIDGE_LOCAL_GATE = 'node scripts/run_xtend_tests.js design-tokens xtheme-token-alias-layer tailwind-token-bridge --json';
const THEME_PACKS = Object.freeze(['light', 'dark', 'high-contrast', 'forced-colors']);
const DENSITY_PACKS = Object.freeze(['comfortable', 'compact', 'dense']);
const EXPERIENCE_PACKS = Object.freeze(['enterprise', 'utility']);

function fingerprint(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

function readArtifacts(baseDir = path.resolve(__dirname, '..', '..')) {
  return {
    matrix: JSON.parse(fs.readFileSync(path.resolve(baseDir, XTEND_TAILWIND_TOKEN_MATRIX_PATH), 'utf8')),
    themeCss: fs.readFileSync(path.resolve(baseDir, XTEND_TAILWIND_THEME_PATH), 'utf8'),
    materialThemeCss: fs.readFileSync(path.resolve(baseDir, XTEND_MATERIAL_THEME_PATH), 'utf8')
  };
}

function knownXtendTokens() {
  return new Set(TOKEN_DEFINITIONS.concat(GLOBAL_ALIASES).map((entry) => entry.name));
}

function createXtendTailwindTokenBridge(options = {}) {
  const artifacts = options.artifacts || readArtifacts(options.baseDir);
  const bridge = {
    schema: XTEND_TAILWIND_TOKEN_BRIDGE_SCHEMA,
    reportSchema: XTEND_TAILWIND_TOKEN_BRIDGE_REPORT_SCHEMA,
    workpackage: XTEND_TAILWIND_TOKEN_BRIDGE_WORKPACKAGE,
    sourceOfTruth: 'xtend-design-tokens',
    tailwindRole: 'build-time-alias-consumer',
    runtimeProvider: 'x-theme',
    themePacks: THEME_PACKS.slice(),
    densityPacks: DENSITY_PACKS.slice(),
    experiencePacks: EXPERIENCE_PACKS.map((name) => ({
      name,
      recommendedDensity: name === 'enterprise' ? 'comfortable' : 'compact',
      intent: name === 'enterprise' ? 'durable-enterprise-workflow' : 'rapid-utility-application'
    })),
    matrix: artifacts.matrix,
    stylesheets: {
      tailwindTheme: XTEND_TAILWIND_THEME_PATH,
      materialTheme: XTEND_MATERIAL_THEME_PATH
    },
    cssText: `${artifacts.themeCss}\n${artifacts.materialThemeCss}`,
    capabilities: {
      runtimeThemeSwitch: true,
      runtimeDensitySwitch: true,
      forcedColors: true,
      reducedMotion: true,
      visibleFocus: true,
      rebuildRequiredForPackSwitch: false
    }
  };
  bridge.fingerprint = fingerprint({ matrix: bridge.matrix, cssText: bridge.cssText });
  return bridge;
}

function validateXtendTailwindTokenBridge(input) {
  const bridge = input || {};
  const errors = [];
  const matrix = bridge.matrix || {};
  const mappings = Array.isArray(matrix.mappings) ? matrix.mappings : [];
  const known = knownXtendTokens();
  const cssText = String(bridge.cssText || '');
  if (bridge.schema !== XTEND_TAILWIND_TOKEN_BRIDGE_SCHEMA) errors.push('invalid bridge schema');
  if (matrix.schema !== XTEND_TAILWIND_TOKEN_MATRIX_SCHEMA) errors.push('invalid token matrix schema');
  if (bridge.sourceOfTruth !== 'xtend-design-tokens') errors.push('XTend tokens must remain the source of truth');
  if (mappings.length === 0) errors.push('token matrix must not be empty');
  const names = new Set();
  mappings.forEach((mapping) => {
    if (!String(mapping.tailwindVariable || '').startsWith('--')) errors.push(`invalid Tailwind variable ${mapping.tailwindVariable || ''}`);
    if (names.has(mapping.tailwindVariable)) errors.push(`duplicate Tailwind variable ${mapping.tailwindVariable}`);
    names.add(mapping.tailwindVariable);
    if (!known.has(mapping.xtendToken)) errors.push(`unknown XTend token ${mapping.xtendToken || ''}`);
    if (!String(mapping.fallback || '').trim()) errors.push(`missing fallback for ${mapping.tailwindVariable || ''}`);
    const declaration = `${mapping.tailwindVariable}: var(${mapping.xtendToken}, ${mapping.fallback});`;
    if (!cssText.includes(declaration)) errors.push(`missing mapped declaration ${mapping.tailwindVariable || ''}`);
  });
  Array.from(cssText.matchAll(/var\((--xtend-[a-z0-9-]+)(?:,\s*([^)]*))?\)/giu)).forEach((match) => {
    if (!known.has(match[1])) errors.push(`unknown XTend token ${match[1]}`);
    if (!String(match[2] || '').trim()) errors.push(`missing fallback for XTend reference ${match[1]}`);
  });
  const themeBlock = /@theme\s+inline\s*\{([\s\S]*?)\}/u.exec(cssText);
  if (!themeBlock) errors.push('missing inline Tailwind theme block');
  else {
    Array.from(themeBlock[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/giu)).forEach((match) => {
      if (!/^var\(--xtend-[a-z0-9-]+,\s*.+\)$/iu.test(match[2].trim())) errors.push(`competing Tailwind product value ${match[1]}`);
    });
  }
  THEME_PACKS.forEach((name) => {
    if (!bridge.themePacks || !bridge.themePacks.includes(name)) errors.push(`missing theme pack ${name}`);
  });
  DENSITY_PACKS.forEach((name) => {
    if (!bridge.densityPacks || !bridge.densityPacks.includes(name)) errors.push(`missing density pack ${name}`);
  });
  EXPERIENCE_PACKS.forEach((name) => {
    if (!bridge.experiencePacks || !bridge.experiencePacks.some((pack) => pack.name === name)) errors.push(`missing experience pack ${name}`);
  });
  if (!cssText.includes('@media (forced-colors: active)') || !cssText.includes('CanvasText') || !cssText.includes('Highlight')) errors.push('forced colors must use system colors');
  if (!cssText.includes('@media (prefers-reduced-motion: reduce)')) errors.push('missing reduced motion behavior');
  if (!cssText.includes(':focus-visible')) errors.push('missing visible focus behavior');
  return {
    schema: XTEND_TAILWIND_TOKEN_BRIDGE_REPORT_SCHEMA,
    ok: errors.length === 0,
    status: errors.length === 0 ? 'accepted' : 'blocked',
    errors,
    mappingCount: mappings.length,
    themePackCount: Array.isArray(bridge.themePacks) ? bridge.themePacks.length : 0,
    densityPackCount: Array.isArray(bridge.densityPacks) ? bridge.densityPacks.length : 0,
    experiencePackCount: Array.isArray(bridge.experiencePacks) ? bridge.experiencePacks.length : 0,
    fingerprint: bridge.fingerprint || null
  };
}

module.exports = {
  DENSITY_PACKS,
  EXPERIENCE_PACKS,
  THEME_PACKS,
  XTEND_MATERIAL_THEME_PATH,
  XTEND_TAILWIND_THEME_PATH,
  XTEND_TAILWIND_TOKEN_BRIDGE_LOCAL_GATE,
  XTEND_TAILWIND_TOKEN_BRIDGE_MODULE_PATH,
  XTEND_TAILWIND_TOKEN_BRIDGE_REPORT_SCHEMA,
  XTEND_TAILWIND_TOKEN_BRIDGE_SCHEMA,
  XTEND_TAILWIND_TOKEN_BRIDGE_SUITE_PATH,
  XTEND_TAILWIND_TOKEN_BRIDGE_TYPES_PATH,
  XTEND_TAILWIND_TOKEN_BRIDGE_WORKPACKAGE,
  XTEND_TAILWIND_TOKEN_MATRIX_PATH,
  XTEND_TAILWIND_TOKEN_MATRIX_SCHEMA,
  createXtendTailwindTokenBridge,
  validateXtendTailwindTokenBridge
};

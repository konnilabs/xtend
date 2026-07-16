'use strict';

const XTEND_MATERIAL_MARACA_PRESET_SCHEMA = 'xtend.material.maraca-preset.v1';

function createMaterialMaracaPreset(overrides = {}) {
  return Object.freeze({
    schema: XTEND_MATERIAL_MARACA_PRESET_SCHEMA,
    id: 'material.enterprise-shell',
    designKit: '@xtend-material/core',
    cssProvider: 'tailwind',
    cssPreflight: 'disabled',
    cssMode: 'external',
    authoringContract: 'xtm-material-classes-only',
    materialPack: 'enterprise',
    theme: 'light',
    density: 'comfortable',
    nativeFallback: '@xtend-material/core/styles.css',
    runtimeTailwind: false,
    ...overrides
  });
}

module.exports = { XTEND_MATERIAL_MARACA_PRESET_SCHEMA, createMaterialMaracaPreset };

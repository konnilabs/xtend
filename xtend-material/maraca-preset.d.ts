export interface MaterialMaracaPreset {
  schema: 'xtend.material.maraca-preset.v1';
  id: string;
  designKit: '@xtend-material/core';
  cssProvider: 'tailwind';
  cssPreflight: 'disabled';
  cssMode: 'external';
  authoringContract: 'xtm-material-classes-only';
  materialPack: 'enterprise' | 'utility';
  theme: 'light' | 'dark' | 'high-contrast' | 'forced-colors';
  density: 'comfortable' | 'compact' | 'dense';
  nativeFallback: '@xtend-material/core/styles.css';
  runtimeTailwind: false;
}
export declare const XTEND_MATERIAL_MARACA_PRESET_SCHEMA: 'xtend.material.maraca-preset.v1';
export declare function createMaterialMaracaPreset(overrides?: Partial<MaterialMaracaPreset>): Readonly<MaterialMaracaPreset>;

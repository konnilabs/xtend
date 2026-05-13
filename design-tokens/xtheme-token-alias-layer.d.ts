export type XThemeTokenAliasCategory =
  | 'color'
  | 'surface'
  | 'text'
  | 'border'
  | 'focus'
  | 'radius'
  | 'space'
  | 'elevation'
  | 'typography'
  | 'motion';

export interface XThemeGlobalAlias {
  name: `--xtend-${string}`;
  category: XThemeTokenAliasCategory;
  mapsTo: `--xtend-${string}` | string;
  fallback: string;
}

export interface XThemeLegacyAlias {
  legacy: string;
  normalized: `--xtend-${string}`;
}

export interface XThemeComponentAlias {
  name: `--xtend-${string}`;
  role: string;
  mapsTo: `--xtend-${string}` | string;
}

export interface XThemeComponentAliasGroup {
  prefix: `--xtend-${string}-`;
  aliases: readonly XThemeComponentAlias[];
}

export interface XThemeTokenAliasLayer {
  schema: typeof XTHEME_TOKEN_ALIAS_LAYER_SCHEMA;
  reportSchema: typeof XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA;
  workpackage: typeof XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE;
  status: string;
  runtimeProvider: 'x-theme';
  namespace: '--xtend-';
  canonicalPrefixes: readonly string[];
  globalAliases: readonly XThemeGlobalAlias[];
  legacyAliases: readonly XThemeLegacyAlias[];
  componentAliases: Readonly<Record<string, XThemeComponentAliasGroup>>;
  p0Components: readonly string[];
  themeVariants: Readonly<Record<string, unknown>>;
  overrideContract: Record<string, unknown>;
  docs: Record<string, string>;
  gates: Record<string, unknown>;
  kernelBoundary: typeof KERNEL_BOUNDARY;
}

export interface XThemeTokenAliasLayerReport {
  schema: typeof XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA;
  ok: boolean;
  errors: string[];
}

export declare const COMPONENT_ALIAS_GROUPS: Readonly<Record<string, XThemeComponentAliasGroup>>;
export declare const GLOBAL_ALIASES: readonly XThemeGlobalAlias[];
export declare const KERNEL_BOUNDARY: 'no-rmt-kernel-import-of-xtend-types';
export declare const LEGACY_ALIASES: readonly XThemeLegacyAlias[];
export declare const P0_COMPONENTS: readonly string[];
export declare const REQUIRED_GLOBAL_PREFIXES: readonly string[];
export declare const THEME_VARIANTS: Readonly<Record<string, unknown>>;
export declare const XTHEME_TOKEN_ALIAS_LAYER_DOC_PATH: string;
export declare const XTHEME_TOKEN_ALIAS_LAYER_FIXTURE_PATH: string;
export declare const XTHEME_TOKEN_ALIAS_LAYER_LOCAL_GATE: string;
export declare const XTHEME_TOKEN_ALIAS_LAYER_MODULE_PATH: string;
export declare const XTHEME_TOKEN_ALIAS_LAYER_PACKAGE_SCRIPT: string;
export declare const XTHEME_TOKEN_ALIAS_LAYER_REPORT_SCHEMA: 'xtend.theme.token-alias-layer-report.v1';
export declare const XTHEME_TOKEN_ALIAS_LAYER_SCHEMA: 'xtend.theme.token-alias-layer.v1';
export declare const XTHEME_TOKEN_ALIAS_LAYER_SUITE_PATH: string;
export declare const XTHEME_TOKEN_ALIAS_LAYER_TYPES_PATH: string;
export declare const XTHEME_TOKEN_ALIAS_LAYER_WORKPACKAGE: 'ECH-WP-03';

export declare function createAllComponentAliasTokenMap(): Record<`--xtend-${string}`, string>;
export declare function createComponentAliasTokenMap(componentTag: string): Record<`--xtend-${string}`, string>;
export declare function createGlobalAliasTokenMap(): Record<`--xtend-${string}`, string>;
export declare function createXThemeAliasThemeTokens(themeName?: string): Record<`--xtend-${string}`, string>;
export declare function createXThemeTokenAliasLayer(): XThemeTokenAliasLayer;
export declare function validateXThemeTokenAliasLayer(layer?: XThemeTokenAliasLayer): XThemeTokenAliasLayerReport;

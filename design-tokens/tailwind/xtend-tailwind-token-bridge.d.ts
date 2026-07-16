export type XtendThemePack = 'light' | 'dark' | 'high-contrast' | 'forced-colors';
export type XtendDensityPack = 'comfortable' | 'compact' | 'dense';
export type XtendMaterialExperiencePack = 'enterprise' | 'utility';

export interface XtendTailwindTokenMapping {
  tailwindVariable: string;
  xtendToken: `--xtend-${string}`;
  category: string;
  fallback: string;
}

export interface XtendTailwindTokenBridge {
  schema: 'xtend.material.tailwind-token-bridge.v1';
  reportSchema: 'xtend.material.tailwind-token-bridge-report.v1';
  workpackage: 'XTM-05';
  sourceOfTruth: 'xtend-design-tokens';
  tailwindRole: 'build-time-alias-consumer';
  runtimeProvider: 'x-theme';
  themePacks: XtendThemePack[];
  densityPacks: XtendDensityPack[];
  experiencePacks: Array<{ name: XtendMaterialExperiencePack; recommendedDensity: XtendDensityPack; intent: string }>;
  matrix: { schema: 'xtend.material.tailwind-token-matrix.v1'; sourceOfTruth: string; tailwindVersion: string; mappings: XtendTailwindTokenMapping[] };
  stylesheets: { tailwindTheme: string; materialTheme: string };
  cssText: string;
  capabilities: Record<string, boolean>;
  fingerprint: string;
}

export interface XtendTailwindTokenBridgeReport {
  schema: 'xtend.material.tailwind-token-bridge-report.v1';
  ok: boolean;
  status: 'accepted' | 'blocked';
  errors: string[];
  mappingCount: number;
  themePackCount: number;
  densityPackCount: number;
  experiencePackCount: number;
  fingerprint: string | null;
}

export declare const THEME_PACKS: readonly XtendThemePack[];
export declare const DENSITY_PACKS: readonly XtendDensityPack[];
export declare const EXPERIENCE_PACKS: readonly XtendMaterialExperiencePack[];
export declare function createXtendTailwindTokenBridge(options?: { baseDir?: string; artifacts?: { matrix: object; themeCss: string; materialThemeCss: string } }): XtendTailwindTokenBridge;
export declare function validateXtendTailwindTokenBridge(bridge: XtendTailwindTokenBridge | object): XtendTailwindTokenBridgeReport;

export * from './recipes';
export * from './maraca-preset';
export * from './shell-recipes';
export * from './flow-recipes';
export * from './performance-contract';
import type { MaterialRecipe, MaterialRecipeRegistry } from './recipes';
import type { MaterialMaracaPreset } from './maraca-preset';
export interface XtendMaterialDesignKit {
  schema: 'xtend.material.design-kit.v1';
  reportSchema: 'xtend.material.design-kit-report.v1';
  name: 'XTend Material';
  packageName: '@xtend-material/core';
  version: '0.1.0';
  owner: 'CCS Labs (ccslabs)';
  designIntent: 'modern-minimal-enterprise-app-shells';
  principles: ReadonlyArray<{ id: string; intent: string; rule: string }>;
  recipes: MaterialRecipe[];
  recipeRegistry: MaterialRecipeRegistry;
  themePacks: string[];
  densityPacks: string[];
  experiencePacks: string[];
  compatibility: Record<string, string>;
  exports: string[];
  boundaries: { browserTailwindRuntime: false; componentDefinitions: false; componentRegistry: false; tokenSourceOfTruth: '--xtend-*'; rmtKernelImport: false };
  maracaPreset: MaterialMaracaPreset;
}
export interface XtendMaterialDesignKitReport { schema: 'xtend.material.design-kit-report.v1'; ok: boolean; status: 'accepted' | 'blocked'; errors: string[]; recipeCount: number; principleCount: number; componentDefinitionCount: number }
export declare const XTEND_MATERIAL_DESIGN_KIT_SCHEMA: 'xtend.material.design-kit.v1';
export declare const XTEND_MATERIAL_DESIGN_KIT_REPORT_SCHEMA: 'xtend.material.design-kit-report.v1';
export declare const XTEND_MATERIAL_VERSION: '0.1.0';
export declare const DESIGN_PRINCIPLES: ReadonlyArray<{ id: string; intent: string; rule: string }>;
export declare const COMPATIBILITY: Readonly<Record<string, string>>;
export declare function createXtendMaterialDesignKit(options?: { recipes?: Partial<MaterialRecipe>[] }): XtendMaterialDesignKit;
export declare function validateXtendMaterialDesignKit(input: object, options?: { rootDir?: string; knownComponents?: Set<string>; knownTokens?: Set<string> }): XtendMaterialDesignKitReport;

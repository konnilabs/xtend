export type MaterialRecipeCategory = 'layout' | 'surface' | 'typography' | 'action' | string;
export interface MaterialRecipe {
  schema: 'xtend.material.recipe.v1';
  id: `material.${string}`;
  version: string;
  status: 'foundation' | 'shell' | 'flow' | 'extension';
  className: `xtm-${string}`;
  category: MaterialRecipeCategory;
  slots: Array<{ name: string; required: boolean; className: string; semanticRole: string }>;
  components: string[];
  tokens: `--xtend-${string}`[];
  utilities: string[];
  responsive: { strategy: string; breakpoints: Array<string | Record<string, string>>; degradation: string; containerName?: string };
  accessibility: { semanticRole: string; visibleFocus: boolean; reducedMotion: boolean; forcedColors: boolean };
  fallback: { provider: 'native-css'; stylesheet: '@xtend-material/core/styles.css'; className: string };
  parts?: string[];
  composition?: Array<{ component: string; slot: string; componentSlot?: string; required: boolean }>;
  boundaries?: Record<string, boolean>;
}
export interface MaterialRecipeRegistry {
  schema: 'xtend.material.recipe-registry.v1';
  namespace: 'xtm-';
  records: MaterialRecipe[];
  byClass: Map<string, MaterialRecipe>;
  byId: Map<string, MaterialRecipe>;
  fingerprint: string;
}
export declare const MATERIAL_RECIPE_SCHEMA: 'xtend.material.recipe.v1';
export declare const MATERIAL_RECIPE_REGISTRY_SCHEMA: 'xtend.material.recipe-registry.v1';
export declare const MATERIAL_RECIPE_VERSION: '1.0.0';
export declare const MATERIAL_FOUNDATION_RECIPES: readonly MaterialRecipe[];
export { MATERIAL_SHELL_RECIPES } from './shell-recipes';
export { MATERIAL_FLOW_RECIPES } from './flow-recipes';
export declare function createMaterialRecipeRegistry(extensions?: Partial<MaterialRecipe>[]): MaterialRecipeRegistry;

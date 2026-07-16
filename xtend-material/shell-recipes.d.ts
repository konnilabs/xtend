import type { MaterialRecipe } from './recipes';
export type MaterialShellRecipeId = 'material.app-shell' | 'material.workspace' | 'material.navigation-rail' | 'material.top-app-bar' | 'material.detail-pane';
export interface MaterialShellRecipe extends MaterialRecipe {
  id: MaterialShellRecipeId;
  status: 'shell';
  parts: string[];
  composition: Array<{ component: string; slot: string; required: boolean }>;
  responsive: { strategy: 'container-first-with-viewport-fallback'; containerName: 'xtm-shell'; breakpoints: MaterialShellBreakpoint[]; degradation: string };
  accessibility: MaterialRecipe['accessibility'] & {
    landmarks: string[];
    keyboard: Record<string, string | string[]>;
    focus: Record<string, string>;
  };
  boundaries: { shadowRootAccess: false; manualHostDomWiring: false; rawTailwindAuthoring: false };
}
export interface MaterialShellBreakpoint { name: 'mobile' | 'tablet' | 'desktop'; query: string; layout: string; navigation: string; detail: string }
export interface MaterialShellRecipeReport { schema: 'xtend.material.shell-recipe-report.v1'; ok: boolean; status: 'accepted' | 'blocked'; errors: string[]; recipeCount: number }
export declare const BREAKPOINTS: readonly MaterialShellBreakpoint[];
export declare const MATERIAL_SHELL_RECIPES: readonly MaterialShellRecipe[];
export declare const MATERIAL_SHELL_RECIPE_REPORT_SCHEMA: 'xtend.material.shell-recipe-report.v1';
export declare function validateMaterialShellRecipes(recipes?: readonly MaterialShellRecipe[], options?: { knownComponents?: Set<string>; knownTokens?: Set<string> }): MaterialShellRecipeReport;

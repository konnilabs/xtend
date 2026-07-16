import type { MaterialRecipe } from './recipes';
export type MaterialFlowRecipeId = 'material.form-flow' | 'material.feedback-stack' | 'material.dashboard' | 'material.content-page' | 'material.settings-page' | 'material.empty-state' | 'material.confirmation-flow';
export type MaterialFlowComponentOwnedState = 'validation' | 'error' | 'busy' | 'disabled' | 'success';
export type MaterialFlowBlockedParityClaim = 'data-grid' | 'autocomplete' | 'command-palette';
export interface MaterialFlowRecipe extends MaterialRecipe {
  id: MaterialFlowRecipeId;
  status: 'flow';
  parts: string[];
  composition: Array<{ component: string; slot: string; componentSlot?: string; required: boolean }>;
  behaviorOwnership: { owner: 'component-and-rmt'; states: readonly MaterialFlowComponentOwnedState[]; materialScope: 'layout-and-visual-composition-only' };
  claims: { blockedParity: readonly MaterialFlowBlockedParityClaim[] };
  boundaries: { shadowRootAccess: false; manualHostDomWiring: false; rawTailwindAuthoring: false };
}
export interface MaterialFlowRecipeReport { schema: 'xtend.material.flow-recipe-report.v1'; ok: boolean; status: 'accepted' | 'blocked'; errors: string[]; recipeCount: number }
export declare const FLOW_BREAKPOINTS: ReadonlyArray<Record<string, string>>;
export declare const BLOCKED_PARITY_CLAIMS: readonly MaterialFlowBlockedParityClaim[];
export declare const COMPONENT_OWNED_STATES: readonly MaterialFlowComponentOwnedState[];
export declare const MATERIAL_FLOW_RECIPES: readonly MaterialFlowRecipe[];
export declare const MATERIAL_FLOW_RECIPE_REPORT_SCHEMA: 'xtend.material.flow-recipe-report.v1';
export declare function validateMaterialFlowRecipes(recipes?: readonly MaterialFlowRecipe[], options?: { knownComponents?: Set<string>; knownTokens?: Set<string> }): MaterialFlowRecipeReport;

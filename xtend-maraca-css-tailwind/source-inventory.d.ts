export const RMT_CSS_SOURCE_INVENTORY_SCHEMA: 'xtend.rmt.css-source-inventory.v1';
export const MATERIAL_RECIPE_REGISTRY_SCHEMA: 'xtend.material.recipe-registry.v1';
export const DEFAULT_MATERIAL_RECIPES: ReadonlyArray<MaterialRecipe>;

export interface MaterialRecipe {
  className: `xtm-${string}`;
  category: string;
  utilities: string[];
}

export interface MaterialRecipeRegistry {
  schema: typeof MATERIAL_RECIPE_REGISTRY_SCHEMA;
  namespace: 'xtm-';
  records: MaterialRecipe[];
  byClass: Map<string, MaterialRecipe>;
  fingerprint: string;
}

export interface RmtCssInventoryDiagnostic {
  code: 'rmt.css.utility.dynamic_name' | 'rmt.css.utility.unsupported_syntax' | 'rmt.css.utility.unowned_safelist' | 'rmt.css.utility.source_outside_policy' | string;
  severity: 'error';
  message: string;
  classification: string;
  candidate: string;
  source: { file?: string | null; line?: number | null; column?: number | null; offset?: number; pointer?: string };
  repairHint: string;
}

export interface RmtCssSourceInventory {
  schema: typeof RMT_CSS_SOURCE_INVENTORY_SCHEMA;
  ok: boolean;
  status: 'ready' | 'blocked';
  authoringContract: 'xtm-material-classes-only';
  registryFingerprint: string;
  materialClasses: string[];
  candidates: string[];
  staticUtilities: string[];
  recipeUtilities: MaterialRecipe[];
  blockedUtilities: string[];
  dynamicCandidates: string[];
  records: Array<Record<string, unknown>>;
  diagnostics: RmtCssInventoryDiagnostic[];
  recipeStylesheet: string;
  fingerprint: string;
}

export function createMaterialRecipeRegistry(customRecipes?: MaterialRecipe[]): MaterialRecipeRegistry;
export function createMaterialRecipeStylesheet(classNames: string[], registry?: MaterialRecipeRegistry): string;
export function createRmtCssSourceInventory(input?: {
  sourceText?: string;
  filePath?: string;
  sources?: Array<{ path?: string; content: string }>;
  descriptors?: unknown[];
  recipes?: MaterialRecipe[];
  registry?: MaterialRecipeRegistry;
  diagnostics?: RmtCssInventoryDiagnostic[];
}): RmtCssSourceInventory;

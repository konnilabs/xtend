export type XtendDesignTokenCategory =
  | 'color'
  | 'surface'
  | 'text'
  | 'state'
  | 'border'
  | 'focus'
  | 'elevation'
  | 'radius'
  | 'typography'
  | 'motion'
  | 'density';

export interface XtendDesignTokenDefinition {
  name: `--xtend-${string}`;
  category: XtendDesignTokenCategory;
  role: string;
  requiredInTheme?: boolean;
  densityOnly?: boolean;
}

export interface XtendDesignTokenPack {
  schema: typeof XTEND_DESIGN_TOKEN_PACK_SCHEMA;
  type: 'theme' | 'density';
  name: string;
  tokens: Record<`--xtend-${string}`, string>;
}

export interface XtendDesignTokenContract {
  schema: typeof XTEND_DESIGN_TOKEN_SCHEMA;
  status: string;
  workpackage: typeof XTEND_DESIGN_TOKEN_WORKPACKAGE;
  sourceContracts: string[];
  productSurface: {
    namespace: '--xtend-';
    runtimeProvider: 'x-theme';
    appAuthoring: string[];
    localOnly: boolean;
    externalNetworkAllowed: boolean;
    kernelBoundary: typeof KERNEL_BOUNDARY;
  };
  categories: XtendDesignTokenCategory[];
  tokens: XtendDesignTokenDefinition[];
  tokenNames: Array<`--xtend-${string}`>;
  themePacks: XtendDesignTokenPack[];
  densityPacks: XtendDesignTokenPack[];
  cssParts: string[];
  highContrast: {
    requiredPacks: string[];
    requiredSystemColors: string[];
    focusToken: `--xtend-${string}`;
    noColorOnlyState: boolean;
  };
  docs: {
    contract: string;
    guide: string;
    exampleTheme: string;
  };
  gates: {
    localGate: string;
    packageScript: string;
    requiredSuites: string[];
  };
}

export interface XtendDesignTokenReport {
  schema: typeof XTEND_DESIGN_TOKEN_REPORT_SCHEMA;
  ok: boolean;
  errors: string[];
}

export declare const CSS_PART_CONTRACT: readonly string[];
export declare const DENSITY_PACKS: Readonly<Record<string, Readonly<Record<`--xtend-${string}`, string>>>>;
export declare const KERNEL_BOUNDARY: 'no-rmt-kernel-import-of-xtend-types';
export declare const THEME_PACKS: Readonly<Record<string, Readonly<Record<`--xtend-${string}`, string>>>>;
export declare const TOKEN_CATEGORIES: readonly XtendDesignTokenCategory[];
export declare const TOKEN_DEFINITIONS: readonly XtendDesignTokenDefinition[];
export declare const XTEND_DESIGN_TOKEN_CONTRACT_PATH: string;
export declare const XTEND_DESIGN_TOKEN_DOC_PATH: string;
export declare const XTEND_DESIGN_TOKEN_EXAMPLE_THEME_PATH: string;
export declare const XTEND_DESIGN_TOKEN_LOCAL_GATE: string;
export declare const XTEND_DESIGN_TOKEN_MODULE_PATH: string;
export declare const XTEND_DESIGN_TOKEN_PACKAGE_SCRIPT: string;
export declare const XTEND_DESIGN_TOKEN_PACK_SCHEMA: 'xtend.design-tokens.pack.v1';
export declare const XTEND_DESIGN_TOKEN_REPORT_SCHEMA: 'xtend.design-tokens.report.v1';
export declare const XTEND_DESIGN_TOKEN_SCHEMA: 'xtend.design-tokens.product-contract.v1';
export declare const XTEND_DESIGN_TOKEN_SUITE_PATH: string;
export declare const XTEND_DESIGN_TOKEN_WORKPACKAGE: 'WP-E12-12';
export declare const XTEND_DESIGN_TOKEN_WP_PATH: string;

export declare function createDensityPack(name: string, tokens?: Record<`--xtend-${string}`, string>): XtendDesignTokenPack;
export declare function createThemePack(name: string, tokens?: Record<`--xtend-${string}`, string>): XtendDesignTokenPack;
export declare function createXtendDesignTokenContract(): XtendDesignTokenContract;
export declare function tokenNames(): Array<`--xtend-${string}`>;
export declare function validateXtendDesignTokenContract(contract?: XtendDesignTokenContract): XtendDesignTokenReport;

import type { XtendBuilderComponentInput, XtendBuilderOptions, XtendBuilderRecord } from '../builder-public-types';

export declare const ALLOWED_FEATURES: string[];
export declare function normalizeList(value?: string | string[]): string[];
export declare function validateComponentPlanInput(input?: XtendBuilderComponentInput, options?: XtendBuilderOptions): { ok: boolean; value?: XtendBuilderRecord; errors: string[] };

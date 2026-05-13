import type { XtendBuilderComponentInput, XtendBuilderRecord } from '../builder-public-types';

export declare const GLOBAL_PERFORMANCE_RULES: string[];
export declare const HYDRATION_POLICY_SCHEMA: string;
export declare const PERFORMANCE_BUDGET_MATRIX_SCHEMA: string;
export declare const PERFORMANCE_COMPONENT_PROFILE_SCHEMA: string;
export declare const PERFORMANCE_MEASUREMENT_SCHEMA: string;
export declare const PERFORMANCE_POLICY_SCHEMA: string;
export declare const PERFORMANCE_REGRESSION_GATE_SCHEMA: string;
export declare const PROFILE_PERFORMANCE_RULES: XtendBuilderRecord;
export declare function createComponentPerformanceProfile(input?: XtendBuilderComponentInput, options?: XtendBuilderRecord): XtendBuilderRecord;

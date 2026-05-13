import type { XtendBuilderComponentLabPlan, XtendBuilderOptions, XtendBuilderReport } from '../builder-public-types';

export declare const COMPONENT_LAB_DOC_PATH: string;
export declare const COMPONENT_LAB_FIXTURE_PATH: string;
export declare const COMPONENT_LAB_GATE_SCHEMA: string;
export declare const COMPONENT_LAB_LOCAL_GATE: string;
export declare const COMPONENT_LAB_SCHEMA: string;
export declare const COMPONENT_LAB_SUITE_PATH: string;
export declare const COMPONENT_LAB_WP_PATH: string;
export declare const REQUIRED_INSPECTOR_DOMAINS: Readonly<string[]>;
export declare const REQUIRED_LAB_PANELS: Readonly<string[]>;
export declare function createComponentLabGate(options?: XtendBuilderOptions): XtendBuilderReport<XtendBuilderComponentLabPlan>;
export declare function createComponentLabPlan(options?: XtendBuilderOptions): XtendBuilderComponentLabPlan;
export declare function validateComponentLabPlan(plan?: unknown): XtendBuilderReport<XtendBuilderComponentLabPlan>;

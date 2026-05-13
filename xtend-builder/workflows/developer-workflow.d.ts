import type { XtendBuilderComponentInput, XtendBuilderWorkflow } from '../builder-public-types';

export declare const DEVELOPER_WORKFLOW_SCHEMA: string;
export declare const VERIFY_PLAN_SCHEMA: string;
export declare function createDeveloperWorkflow(input?: XtendBuilderComponentInput): XtendBuilderWorkflow;
export declare function createVerifyPlan(input?: XtendBuilderComponentInput): XtendBuilderWorkflow;

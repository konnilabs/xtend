export * from './xtend-policy-public-types';
import type {
  XtendFabricFiberInput,
  XtendHydrationDecision,
  XtendPolicyConstant,
  XtendPolicyFunction,
  XtendPolicyOptions,
  XtendRmtScheduleRecord
} from './xtend-policy-public-types';

export interface XtendHydrationPolicyController {
  schema: string;
  componentRef: string;
  resolve(options?: XtendPolicyOptions): XtendHydrationDecision;
  createFiberInput(options?: XtendPolicyOptions): XtendFabricFiberInput;
  hydrate(instrumentation: { hydrate(task: unknown, fiberInput: XtendFabricFiberInput): unknown }, task: unknown, options?: XtendPolicyOptions): unknown;
}

export declare const CONTRACTS: XtendPolicyConstant<Record<string, string>>;
export declare const BROWSER_NAMESPACE: XtendPolicyConstant<string>;
export declare const HYDRATION_POLICIES: XtendPolicyConstant<Record<string, unknown>>;
export declare const HYDRATION_POLICY_IDS: XtendPolicyConstant<string[]>;
export declare const NON_BLOCKING_LANES: XtendPolicyConstant<string[]>;
export declare function resolveHydrationPolicy(options?: XtendPolicyOptions): XtendHydrationDecision;
export declare function createHydrationFiberInput(componentRef?: string, options?: XtendPolicyOptions): XtendFabricFiberInput;
export declare function createHydrationPolicyController(componentRef?: string, controllerOptions?: XtendPolicyOptions): XtendHydrationPolicyController;
export declare const createHydrationScheduleRecords: XtendPolicyFunction<XtendRmtScheduleRecord[]>;

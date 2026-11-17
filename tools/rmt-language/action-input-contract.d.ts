import type { RmtJsonValue } from './rmt-tooling-public-types';
export declare const RMT_ACTION_INPUT_CONTRACT_SCHEMA: 'xtend.rmt.action-input-contract.v1';
export declare const RMTX_ACTION_INPUT_RULES_SCHEMA: 'xtend.rmtx.action-input-rules.v1';
export declare const RMT_ACTION_PLAN_SCHEMA_V2: 'xtend.rmt.action-plan.v2';
export declare const RMT_NATIVE_EVENT_BINDING_SCHEMA_V2: 'xtend.rmt.native-event-binding.v2';
export interface RmtActionInputValueRule {
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'json' | 'null';
  readonly nullable: boolean;
  readonly items?: RmtActionInputValueRule;
}
export interface RmtActionInputFieldRule extends RmtActionInputValueRule { readonly required: boolean; readonly default?: RmtJsonValue }
export interface RmtActionInputContract {
  readonly schema: typeof RMT_ACTION_INPUT_CONTRACT_SCHEMA; readonly apiVersion: '1.0.0';
  readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '4.0.0' }>;
  readonly actions: readonly Readonly<{ id: string; fields: Readonly<Record<string, RmtActionInputFieldRule>> }>[];
}
export interface RmtxActionInputRules {
  readonly schema: typeof RMTX_ACTION_INPUT_RULES_SCHEMA; readonly sourceProfile: Readonly<{ syntax: 'rmtx'; version: '4.0.0' }>;
  readonly actions: readonly Readonly<{ id: string; inputs: readonly Readonly<{ name: string; type: string; optional?: boolean; nullable?: boolean; default?: RmtJsonValue }>[] }>[];
}
export declare function createRmtActionInputContract(core: unknown, sourceRules?: RmtxActionInputRules): RmtActionInputContract;

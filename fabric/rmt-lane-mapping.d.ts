export * from './xtend-policy-public-types';
import type {
  XtendFabricFiberInput,
  XtendFabricLaneProfile,
  XtendPolicyConstant,
  XtendPolicyDiagnostic,
  XtendPolicyFunction,
  XtendPolicyOptions,
  XtendRmtScheduleRecord
} from './xtend-policy-public-types';

export interface XtendFabricRmtLaneResolution {
  schema: string;
  ok: boolean;
  fabricLane: string;
  rmtLane: string;
  scheduleRef?: string;
  endpointName?: string;
  scope?: string;
  schedule?: XtendRmtScheduleRecord;
  source?: string;
  diagnostics: XtendPolicyDiagnostic[];
}

export interface XtendFabricRmtLaneMapping {
  schema: string;
  contracts: Record<string, string>;
  fabricLanes: string[];
  rmtScheduleLanes: string[];
  laneMap: Record<string, string>;
  schedules: XtendRmtScheduleRecord[];
  resolveLane: XtendPolicyFunction<XtendFabricRmtLaneResolution>;
  resolveFiber(fiber: XtendFabricFiberInput, options?: XtendPolicyOptions): XtendFabricRmtLaneResolution;
  getSchedule(id: string): XtendRmtScheduleRecord | null;
}

export declare const CONTRACTS: XtendPolicyConstant<Record<string, string>>;
export declare const BROWSER_NAMESPACE: XtendPolicyConstant<string>;
export declare const RMT_SCHEDULE_LANES: XtendPolicyConstant<string[]>;
export declare const FABRIC_LANES: XtendPolicyConstant<string[]>;
export declare const FABRIC_TO_RMT_LANE: XtendPolicyConstant<Record<string, string>>;
export declare const LANE_PROFILES: XtendPolicyConstant<Record<string, XtendFabricLaneProfile>>;
export declare const DEFAULT_LANE_BY_KIND: XtendPolicyConstant<Record<string, string>>;
export declare function createFabricRmtLaneMapping(options?: XtendPolicyOptions): XtendFabricRmtLaneMapping;
export declare function createRmtScheduleRecords(options?: XtendPolicyOptions): XtendRmtScheduleRecord[];
export declare const normalizeFabricLaneForRmt: XtendPolicyFunction<XtendFabricRmtLaneResolution>;
export declare function resolveRmtScheduleForFiber(fiberInput?: XtendFabricFiberInput, options?: XtendPolicyOptions): XtendFabricRmtLaneResolution;

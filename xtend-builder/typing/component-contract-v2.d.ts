import type { XtendBuilderComponentInput, XtendBuilderOptions, XtendBuilderRecord, XtendBuilderReport } from '../builder-public-types';

export declare const COMPONENT_CONTRACT_V2_SCHEMA: string;
export declare const COMPONENT_CONTRACT_REPORT_V2_SCHEMA: string;
export declare const COMPONENT_CONTRACT_V2_WORKPACKAGE: string;
export declare const COMPONENT_CONTRACT_V2_DOC: string;
export declare const TYPESCRIPT_SOURCE_STRATEGY_SCHEMA: string;
export declare const RMT_COMPONENT_CONTRACT_SCHEMA: string;
export declare const FABRIC_BOUNDARY_SCHEMA: string;
export declare const TELEMETRY_SNAPSHOT_SCHEMA: string;
export declare const CONTRACT_V2_REQUIRED_DOMAINS: string[];
export declare const CONTRACT_V2_LIFECYCLE_OPERATIONS: string[];
export declare const CONTRACT_V2_LANE_PRECEDENCE: string[];
export declare function createComponentContractV2(input?: XtendBuilderComponentInput, options?: XtendBuilderOptions): XtendBuilderRecord;
export declare function validateComponentContractV2(contract: unknown): XtendBuilderReport<XtendBuilderRecord>;

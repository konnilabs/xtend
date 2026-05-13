import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const EPIC10_P0_COMPONENT_WAVE_SCHEMA: string;
export declare const EPIC10_P0_COMPONENT_STUB_SCHEMA: string;
export declare const EPIC10_P0_COMPONENT_WAVE_GATE_SCHEMA: string;
export declare const EPIC10_P0_COMPONENT_WAVE_WORKPACKAGE: string;
export declare const EPIC10_P0_COMPONENT_WAVE_DOC: XtendCatalogConstant;
export declare const EPIC10_P0_COMPONENT_WAVE_SUITE: string;
export declare const EPIC10_P0_COMPONENT_WAVE_GATE: XtendCatalogConstant;
export declare const REQUIRED_TS_COMPONENT_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_RUNTIME_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_COMPANION_ARTIFACTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const REQUIRED_LOCAL_GATES: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EXPECTED_COMPONENT_ORDER: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const WORKPACKAGE_COMPONENT_MAP: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const P0_COMPONENT_WAVE_DEFINITIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createP0ComponentContractStub(options?: XtendCatalogOptions): XtendCatalogRecord;
export declare function createP0ComponentWavePlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function validateP0ComponentWavePlan(plan?: unknown): XtendCatalogReport;
export declare function createP0ComponentWaveGate(options?: XtendCatalogOptions): XtendCatalogGate;

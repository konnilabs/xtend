import type {
  XtendCatalogConstant,
  XtendCatalogGate,
  XtendCatalogOptions,
  XtendCatalogPlan,
  XtendCatalogRecord,
  XtendCatalogReport
} from './catalog-public-types';


export declare const COMPONENT_DEFINITIONS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare const EXISTING_COMPONENT_METADATA_DOC: XtendCatalogConstant;
export declare const EXISTING_COMPONENT_METADATA_GATE: XtendCatalogConstant;
export declare const EXISTING_COMPONENT_METADATA_GATE_SCHEMA: string;
export declare const EXISTING_COMPONENT_METADATA_MODULE: string;
export declare const EXISTING_COMPONENT_METADATA_SCHEMA: string;
export declare const EXISTING_COMPONENT_METADATA_SUITE: string;
export declare const EXISTING_COMPONENT_METADATA_WORKPACKAGE: string;
export declare const EXISTING_COMPONENT_RECORD_SCHEMA: string;
export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const MIGRATION_STRATEGY: XtendCatalogConstant;
export declare const TARGET_COMPONENTS: readonly XtendCatalogConstant[] | XtendCatalogConstant;
export declare function createExistingComponentMetadataGate(options?: XtendCatalogOptions): XtendCatalogGate;
export declare function createExistingComponentMetadataPlan(options?: XtendCatalogOptions): XtendCatalogPlan;
export declare function validateExistingComponentMetadataPlan(plan?: unknown): XtendCatalogReport;

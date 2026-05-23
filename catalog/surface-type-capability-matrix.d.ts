import type {
  XtendCatalogConstant,
  XtendCatalogOptions,
  XtendCatalogReport
} from './catalog-public-types';

export interface SurfaceTypeCapabilityLowering {
  type: string;
  kind: string;
  component: string;
  managerSlot: string;
  portalPolicy: string;
}

export interface SurfaceTypeCapabilityRow {
  schema?: string;
  kind: string;
  runtimeType: string;
  componentTag: string;
  managerSlot: string;
  layer: string;
  stackPolicy: string;
  layoutEligible: boolean;
  resourceOwnership: string;
  portalPolicy: string;
  rmtSyntax?: string;
  lowersTo?: SurfaceTypeCapabilityLowering;
  kernelBoundary?: string;
}

export interface SurfaceTypeCapabilityMatrix {
  schema: string;
  reportSchema: string;
  generatedAt: string;
  rowCount: number;
  runtimeTypes: readonly string[];
  regionKinds: readonly string[];
  overlayKinds: readonly string[];
  rows: readonly SurfaceTypeCapabilityRow[];
  policies: {
    additiveCompatibility: boolean;
    controllerIsSingleRegistry: boolean;
    rmtKernelImportsXtendTypes: boolean;
    genericUiComponent: string;
    portalPolicyComponent: string;
  };
  kernelBoundary: string;
}

export declare const KERNEL_BOUNDARY: XtendCatalogConstant;
export declare const OVERLAY_KINDS: readonly string[];
export declare const REGION_KINDS: readonly string[];
export declare const SURFACE_TYPE_CAPABILITY_MATRIX_REPORT_SCHEMA: string;
export declare const SURFACE_TYPE_CAPABILITY_MATRIX_SCHEMA: string;
export declare const SURFACE_TYPE_CAPABILITY_ROWS: readonly SurfaceTypeCapabilityRow[];
export declare function createSurfaceTypeCapabilityMatrix(options?: XtendCatalogOptions): SurfaceTypeCapabilityMatrix;
export declare function listSurfaceTypeCapabilityRows(): readonly SurfaceTypeCapabilityRow[];
export declare function resolveSurfaceTypeCapability(kind: string): SurfaceTypeCapabilityRow | null;
export declare function surfaceKindToComponentTag(kind: string, fallback?: string): string;
export declare function surfaceKindToRuntimeType(kind: string, fallback?: string): string;
export declare function validateSurfaceTypeCapabilityMatrix(matrix?: SurfaceTypeCapabilityMatrix): XtendCatalogReport;

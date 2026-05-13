import type { XtendBuilderArtifactContract, XtendBuilderBlueprintContract, XtendBuilderConstant, XtendBuilderRecord } from '../builder-public-types';

export declare const ARTIFACT_MATRIX: XtendBuilderArtifactContract[];
export declare const A11Y_PROFILE_REQUIREMENTS: XtendBuilderConstant<XtendBuilderRecord>;
export declare const COMPONENT_BLUEPRINT_SCHEMA: string;
export declare const TYPESCRIPT_BLUEPRINT_REQUIREMENTS: XtendBuilderConstant<XtendBuilderRecord>;
export declare const TYPESCRIPT_COMPONENT_BLUEPRINT_SCHEMA: string;
export declare const COMPONENT_FABRIC_LANE_INGESTION_SCHEMA: string;
export declare const COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA: string;
export declare const EXCEPTION_POLICY: XtendBuilderConstant<XtendBuilderRecord>;
export declare const NAMING_CONTRACT: XtendBuilderConstant<XtendBuilderRecord>;
export declare const PERFORMANCE_POLICY_REQUIREMENTS: XtendBuilderConstant<XtendBuilderRecord>;
export declare const PROFILE_CHECKS: XtendBuilderRecord[];
export declare function getArtifactContract(id: string): XtendBuilderArtifactContract | null;
export declare function getComponentBlueprintContract(): XtendBuilderBlueprintContract;
export declare function getProfileContract(profile: string): XtendBuilderRecord | null;

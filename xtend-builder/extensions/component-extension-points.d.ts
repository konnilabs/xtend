import type { XtendBuilderComponentInput, XtendBuilderOptions, XtendBuilderRecord } from '../builder-public-types';

export declare const COMPONENT_EXTENSION_POINTS_SCHEMA: string;
export declare const ROOT_LIFECYCLE_SCHEMA: string;
export declare const TEMPLATE_EXTENSION_SCHEMA: string;
export declare const RENDERING_EXTENSION_SCHEMA: string;
export declare const ROOT_HANDSHAKE_CONTRACT_VERSION: string;
export declare const HOST_CAPABILITIES_CONTRACT_VERSION: string;
export declare const RMT_COMPATIBILITY_BINDING_SCHEMA: string;
export declare const ROOT_LIFECYCLE_HOOKS: XtendBuilderRecord[];
export declare function createComponentExtensionPoints(input?: XtendBuilderComponentInput, options?: XtendBuilderOptions): XtendBuilderRecord;

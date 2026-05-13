import type { XtendBuilderComponentInput, XtendBuilderOptions, XtendBuilderRecord } from '../builder-public-types';

export declare const COMPONENT_TYPING_SCHEMA: string;
export declare const RMT_ATTACHMENT_SCHEMA: string;
export declare const RMT_COMPONENT_CONTRACT_VERSION: string;
export declare const RMT_TEMPLATE_AUTHORING_CONTRACT_VERSION: string;
export declare const RMT_ROOT_HANDSHAKE_CONTRACT_VERSION: string;
export declare const RMT_HOST_CAPABILITIES_CONTRACT_VERSION: string;
export declare const RMT_COMPATIBILITY_BINDING_SCHEMA: string;
export declare function createComponentTypingContract(input?: XtendBuilderComponentInput, options?: XtendBuilderOptions): XtendBuilderRecord;

import type { XtendBuilderComponentInput, XtendBuilderOptions, XtendBuilderRecord, XtendBuilderReport } from '../builder-public-types';

export declare const NAVIGATION_ROUTING_PROFILES: string[];
export declare const NAVIGATION_ROUTING_REQUIRED_ASSERTIONS: string[];
export declare const NAVIGATION_ROUTING_REQUIRED_COMMANDS: string[];
export declare const NAVIGATION_ROUTING_REQUIRED_DOMAINS: string[];
export declare const NAVIGATION_ROUTING_REQUIRED_EVENTS: string[];
export declare const NAVIGATION_ROUTING_REQUIRED_SCHEDULES: string[];
export declare const NAVIGATION_ROUTING_TARGETS: string[];
export declare const NAVIGATION_ROUTING_UX_CONTRACT_DOC: string;
export declare const NAVIGATION_ROUTING_UX_FIXTURE: string;
export declare const NAVIGATION_ROUTING_UX_REPORT_SCHEMA: string;
export declare const NAVIGATION_ROUTING_UX_SCHEMA: string;
export declare const NAVIGATION_ROUTING_UX_WORKPACKAGE: string;
export declare const KERNEL_BOUNDARY: string;
export declare function createNavigationRoutingUxContract(input?: XtendBuilderComponentInput, options?: XtendBuilderOptions): XtendBuilderRecord;
export declare function validateNavigationRoutingUxContract(contract: unknown): XtendBuilderReport<XtendBuilderRecord>;

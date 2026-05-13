export * from '../fabric/xtend-policy-public-types';
import type {
  XtendPolicyConstant,
  XtendPolicyOptions,
  XtendSecurityClassification
} from '../fabric/xtend-policy-public-types';

export interface XtendManifestImportPolicy {
  schema: string;
  loaderPolicy: string;
  manifestPolicy: string;
  importPolicy: string;
  mode: string;
  allowedProtocols: string[];
  refusedProtocols: string[];
  localHosts: string[];
  manifestExtensions: string[];
  moduleExtensions: string[];
  reservedBootstrapKeys: string[];
  diagnostics: string[];
  rules: Record<string, string>;
}

export interface XtendNormalizedManifest extends XtendSecurityClassification {
  entries: Record<string, string>;
}

export declare const ALLOWED_IMPORT_PROTOCOLS: XtendPolicyConstant<string[]>;
export declare const ALLOWED_MANIFEST_EXTENSIONS: XtendPolicyConstant<string[]>;
export declare const ALLOWED_MODULE_EXTENSIONS: XtendPolicyConstant<string[]>;
export declare const CUSTOM_ELEMENT_NAME_PATTERN: XtendPolicyConstant<RegExp>;
export declare const IMPORT_POLICY_CONTRACT: XtendPolicyConstant<string>;
export declare const LOADER_POLICY_CONTRACT: XtendPolicyConstant<string>;
export declare const LOCAL_HOSTS: XtendPolicyConstant<string[]>;
export declare const MANIFEST_IMPORT_GATE_CONTRACT: XtendPolicyConstant<string>;
export declare const MANIFEST_POLICY_CONTRACT: XtendPolicyConstant<string>;
export declare const REFUSED_PROTOCOLS: XtendPolicyConstant<string[]>;
export declare const RESERVED_BOOTSTRAP_KEYS: XtendPolicyConstant<string[]>;
export declare function classifyManifestRecord(key: string, record: unknown, options?: XtendPolicyOptions): XtendSecurityClassification;
export declare function classifyPolicyUrl(value: string, options?: XtendPolicyOptions): XtendSecurityClassification;
export declare function createManifestImportPolicy(options?: XtendPolicyOptions): XtendManifestImportPolicy;
export declare function isAllowedManifestKey(key: string): boolean;
export declare function normalizeManifest(rawManifest?: Record<string, unknown>, options?: XtendPolicyOptions): XtendNormalizedManifest;

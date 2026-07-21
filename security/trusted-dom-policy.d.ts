export * from '../fabric/xtend-policy-public-types';
import type {
  XtendPolicyConstant,
  XtendPolicyOptions,
  XtendSecurityClassification
} from '../fabric/xtend-policy-public-types';

export interface XtendTrustedDomPolicy {
  schema: string;
  trustedDomPolicy: string;
  sanitizerPolicy: string;
  parsedownDocsPolicy: string;
  rmtTemplatePolicy: string;
  sinks: Record<string, unknown>;
  markupClasses: Record<string, unknown>;
  urlAttributes: Record<string, unknown>;
  [key: string]: unknown;
}

export interface XtendTrustedDomSanitizerVerdict {
  schema: typeof TRUSTED_DOM_SANITIZER_CONTRACT;
  ok: boolean;
  sanitized: boolean;
  boundary: typeof SANITIZING_BOUNDARY_CONTRACT;
  markupClass: string;
  html: string;
  removed: Array<{ type: string; name: string }>;
  removedCount: number;
}

export interface XtendTrustedTextSanitizerVerdict {
  schema: typeof TRUSTED_TEXT_SANITIZER_CONTRACT;
  ok: boolean;
  sanitized: boolean;
  changed: boolean;
  boundary: typeof SANITIZING_BOUNDARY_CONTRACT;
  format: 'text';
  text: string | null;
  diagnostics: string[];
}

export declare const DOM_SINKS: XtendPolicyConstant<Record<string, unknown>>;
export declare const MARKUP_CLASSES: XtendPolicyConstant<Record<string, unknown>>;
export declare const MARKUP_CLASSIFICATION_CONTRACT: XtendPolicyConstant<string>;
export declare const PARSEDOWN_DOCS_POLICY: XtendPolicyConstant<string>;
export declare const RMT_TEMPLATE_POLICY: XtendPolicyConstant<string>;
export declare const SANITIZING_BOUNDARY_CONTRACT: XtendPolicyConstant<string>;
export declare const TRUSTED_DOM_SANITIZER_CONTRACT: XtendPolicyConstant<string>;
export declare const TRUSTED_DOM_SANITIZER_POLICY: XtendPolicyConstant<string>;
export declare const TRUSTED_TEXT_SANITIZER_CONTRACT: XtendPolicyConstant<'xtend.security.trusted-text-sanitizer.v1'>;
export declare const TRUSTED_DOM_POLICY_CONTRACT: XtendPolicyConstant<string>;
export declare const TRUSTED_DOM_SINK_CONTRACT: XtendPolicyConstant<string>;
export declare const URL_ATTRIBUTE_POLICY: XtendPolicyConstant<string>;
export declare function classifyTrustedDomUse(input?: XtendPolicyOptions): XtendSecurityClassification;
export declare function getMarkupClass(markupClass: string): Record<string, unknown> | null;
export declare function getSinkPolicy(sink: string): Record<string, unknown> | null;
export declare function getTrustedDomPolicy(options?: XtendPolicyOptions): XtendTrustedDomPolicy;
export declare function isAllowedTrustedDomUrl(value: string, options?: XtendPolicyOptions): boolean;
export declare function sanitizeTrustedDomHtml(value: string, options?: XtendPolicyOptions): XtendTrustedDomSanitizerVerdict;
export declare function sanitizeTrustedText(value: unknown, options?: XtendPolicyOptions & { maxLength?: number }): XtendTrustedTextSanitizerVerdict;

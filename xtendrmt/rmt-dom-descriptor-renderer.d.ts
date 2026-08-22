export const RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-dom-renderer-diagnostic.v2';
export const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA: 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
export const RMT_DOM_COMMIT_RESULT_SCHEMA: 'xtend.rmt.dom-commit-result.v1';
export const RMT_DOM_APPLICATION_BINDING_SCHEMA: 'xtend.rmt.dom-application-binding.v1';
export const RMT_DOM_BINDING_SCOPE_SCHEMA: 'xtend.rmt.dom-binding-scope.v1';
export const TRUSTED_DOM_BOUNDARY: 'xtend.rmt.trusted-dom-boundary.explicit';

export interface RmtDomDescriptorSource {
  documentId?: string;
  templateId?: string;
  nodeId?: string;
  pointer?: string;
  line?: number | null;
  column?: number | null;
}

export interface RmtDomDescriptorDiagnostic {
  schema: typeof RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  source?: RmtDomDescriptorSource;
  sink?: string;
  filePath?: string;
  domain?: RmtDomOwnershipDomain;
  owner?: string;
  reservedOwner?: string;
  phase?: string;
  targetTag?: string;
}

export interface RmtDomDescriptorRendererOptions {
  documentTarget?: Document;
  diagnosticsHub?: {
    publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown;
  };
  diagnosticChannel?: string;
  componentRegistry?: RmtComponentRegistryLike;
  registry?: RmtComponentRegistryLike;
  trustedDomRenderer?: (descriptor: unknown, context: unknown) => Node | Node[];
  /** @deprecated Use trustedDomRenderer. Removed in 1.0. */
  trustedDom?: (descriptor: unknown, context: unknown) => Node | Node[];
  renderOptions?: RmtDomDescriptorRenderOptions;
}

export interface RmtComponentRegistryLike {
  resolveComponentCapability?(tag: string): unknown;
  buildComponentDescriptor?(input: Record<string, unknown>, options?: Record<string, unknown>): unknown;
  bindComponentInstance?(element: Element, binding?: Record<string, unknown>, options?: Record<string, unknown>): unknown;
}

export interface RmtDomDescriptorRenderOptions {
  model?: Record<string, unknown>;
  selectorValues?: Record<string, unknown>;
  components?: Map<string, unknown> | unknown[];
  templates?: Map<string, unknown> | unknown[];
  slots?: Map<string, unknown> | unknown[];
  selectors?: Map<string, unknown> | unknown[];
  componentRegistry?: RmtComponentRegistryLike;
  registry?: RmtComponentRegistryLike;
  componentBindingOptions?: Record<string, unknown>;
  stateBridge?: {
    read?: (key: string) => unknown;
    write?: (key: string, value: unknown) => void;
  };
  refs?: Map<string, Element>;
  source?: RmtDomDescriptorSource;
  dispatchEvent?: (event: unknown) => void;
  trustedDomRenderer?: (descriptor: unknown, context: unknown) => Node | Node[];
  /** @deprecated Use trustedDomRenderer. Removed in 1.0. */
  trustedDom?: (descriptor: unknown, context: unknown) => Node | Node[];
  /** Preserve the focused control's live value during an input-originated async reconcile. */
  preserveActiveInputDraft?: boolean;
  metadata?: unknown;
}

export type RmtTrustedDomPolicyReference =
  | string
  | { ref: string }
  | { id: string }
  | { name: string };

interface RmtTrustedHtmlDescriptorBase {
  type: 'trusted_html';
  trustedBoundary: typeof TRUSTED_DOM_BOUNDARY;
  html?: unknown;
  resource?: string;
  [key: string]: unknown;
}

/**
 * Canonical trusted-HTML descriptor. The referenced policy and
 * trustedDomRenderer boundary are both required before HTML can be materialized.
 */
export type RmtTrustedHtmlDescriptor =
  | (RmtTrustedHtmlDescriptorBase & {
      policyRef: string;
    })
  | (RmtTrustedHtmlDescriptorBase & {
      /** @deprecated Use policyRef. Retained as a 0.6/0.7 compatibility input. */
      policyId: string;
    })
  | (RmtTrustedHtmlDescriptorBase & {
      /** @deprecated Use policyRef. Retained as a 0.6/0.7 compatibility input. */
      trustedPolicy: RmtTrustedDomPolicyReference;
    })
  | (RmtTrustedHtmlDescriptorBase & {
      /** @deprecated Use policyRef. Retained as a 0.6/0.7 compatibility input. */
      policy: RmtTrustedDomPolicyReference;
    });

export type RmtDomSlotContent =
  | string
  | { markup: string; html?: never }
  | { html: string; markup?: never }
  | { descriptor: unknown }
  | { template: string }
  | RmtTrustedHtmlDescriptor;

export type RmtDomOwnershipDomain =
  | 'structure'
  | 'content'
  | 'attributes'
  | 'properties'
  | 'class'
  | 'part'
  | 'styleTokens'
  | 'events'
  | 'visibility'
  | 'validation';

export interface RmtDomOwnershipPolicy {
  /** Omission keeps the 0.6 legacy renderer behavior; supplied policies are validated fail-closed. */
  mode?: 'strict' | 'compatibility';
  strict?: boolean;
  owner?: string;
  writer?: string;
  domains?: Partial<Record<RmtDomOwnershipDomain, string>>;
  owners?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainOwners?: Partial<Record<RmtDomOwnershipDomain, string>>;
  reservations?: Partial<Record<RmtDomOwnershipDomain, string>>;
  /** Logical writer provenance for domains aggregated into this commit request. */
  claims?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainClaims?: Partial<Record<RmtDomOwnershipDomain, string>>;
  domainWriters?: Partial<Record<RmtDomOwnershipDomain, string>>;
}

interface RmtDomCommitRequestBase {
  context?: RmtDomDescriptorRenderOptions;
  ownership?: RmtDomOwnershipPolicy;
  metadata?: unknown;
}

export type RmtDomCommitRequest =
  | (RmtDomCommitRequestBase & {
      operation: 'create-node';
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'replace-children';
      target: ParentNode;
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'reconcile-children';
      target: ParentNode;
      descriptors: unknown[];
    })
  | (RmtDomCommitRequestBase & {
      operation: 'reconcile-element';
      target: Element;
      descriptor: unknown;
    })
  | (RmtDomCommitRequestBase & {
      operation: 'merge-element';
      target: Element;
      descriptor: unknown;
    });

export interface RmtDomApplicationBindingOptions {
  capture: boolean;
  once: boolean;
  passive: boolean;
}

export interface RmtDomApplicationBindingRecord {
  schema: typeof RMT_DOM_APPLICATION_BINDING_SCHEMA;
  id: string;
  bindingId: string;
  kind: 'application';
  /** Actual listener target. Selectors are resolved before the commit result is returned. */
  target: Element;
  event: string;
  command: string;
  action: string;
  options: Readonly<RmtDomApplicationBindingOptions>;
  governance: Readonly<RmtDomApplicationBindingOptions & {
    preventDefault: boolean;
    stopPropagation: boolean;
    stopImmediatePropagation: boolean;
    retarget: string;
  }>;
  owner: string;
  component: string;
  payload?: unknown;
  payloadContract?: unknown;
  payloadAdapter?: unknown;
  closest?: unknown;
  condition?: unknown;
  guard?: unknown;
  postAction: unknown[];
  commandTarget: unknown;
  lane: unknown;
  scope: string;
}

export interface RmtDomRemovedBindingReference {
  bindingId: string;
  target: Element;
}

export interface RmtDomBindingScope {
  schema: typeof RMT_DOM_BINDING_SCOPE_SCHEMA;
  id: string;
  target: Node | null;
  roots: readonly Node[];
  complete: boolean;
  bindingIds: readonly string[];
  removedBindings: readonly RmtDomRemovedBindingReference[];
}

export interface RmtDomCommitResult {
  schema: typeof RMT_DOM_COMMIT_RESULT_SCHEMA;
  operation: RmtDomCommitRequest['operation'];
  target: Node | null;
  nodes: Node[];
  nodeCount: number;
  changed: boolean;
  structural: boolean;
  bindings: readonly RmtDomApplicationBindingRecord[];
  bindingScope: RmtDomBindingScope;
  diagnostics: RmtDomDescriptorDiagnostic[];
  metadata: unknown;
}

export interface RmtDomDescriptorTransformExpression {
  op?: 'path' | 'map' | 'filter' | 'reduce' | 'countBy' | 'slice' | 'contains' | 'uppercase' | 'lowercase' | 'replace' | 'concat' | 'interpolate' | 'formatBytes' | 'formatDateShort' | 'formatDuration' | 'fallback' | string;
  operator?: string;
  kind?: string;
  format?: string;
  value?: unknown;
  from?: unknown;
  source?: unknown;
  path?: string;
  expression?: unknown;
  where?: unknown[] | unknown;
  filter?: unknown[] | unknown;
  rules?: unknown[] | unknown;
  values?: unknown[];
  parts?: unknown[];
  separator?: string;
  start?: unknown;
  end?: unknown;
  search?: unknown;
  replacement?: unknown;
  flags?: string;
  fallback?: unknown;
  key?: unknown;
  mode?: string;
}

export interface RmtNoManualHtmlGate {
  schema: 'xtend.epic18.no-manual-html-gate.v1';
  scanText(sourceText: string, options?: { filePath?: string }): RmtDomDescriptorDiagnostic[];
  scanFiles(files: Record<string, string>): RmtDomDescriptorDiagnostic[];
}

export interface RmtDomDescriptorRenderer {
  schema: typeof RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA;
  trustedDomBoundary: typeof TRUSTED_DOM_BOUNDARY;
  commit(request: RmtDomCommitRequest): RmtDomCommitResult;
  dispose(target?: Node, options?: { clearOwnedDom?: boolean }): void;
  render(root: Element, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): {
    schema: 'xtend.epic18.rmt-dom-render-result.v1';
    root: Element;
    nodeCount: number;
    bindings: readonly RmtDomApplicationBindingRecord[];
    bindingScope: RmtDomBindingScope;
    diagnostics: RmtDomDescriptorDiagnostic[];
  };
  renderNode(descriptor: unknown, options?: RmtDomDescriptorRenderOptions): Node | Node[];
  renderKeyed(root: Element, descriptors: unknown[], options?: RmtDomDescriptorRenderOptions): Node[];
  /** @deprecated Use commit({ operation: 'merge-element', ... }). Removed in 1.0. */
  patchElement(element: Element, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): Element;
  resolveValue(value: unknown, options?: RmtDomDescriptorRenderOptions & { item?: unknown }): unknown;
  createNoManualHtmlGate(options?: unknown): RmtNoManualHtmlGate;
  isUrlAllowed(value: unknown): boolean;
  listDiagnostics(): RmtDomDescriptorDiagnostic[];
}

export function createNoManualHtmlGate(options?: unknown): RmtNoManualHtmlGate;
export function createRmtDomDescriptorRenderer(options?: RmtDomDescriptorRendererOptions): RmtDomDescriptorRenderer;

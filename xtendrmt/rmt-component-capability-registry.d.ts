export const RMT_COMPONENT_BINDING_SCHEMA: 'xtend.rmt.component-binding.v1';
export const RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA: 'xtend.rmt.component-capability-registry.v1';
export const RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA: 'xtend.rmt.component-capability-registry-report.v1';
export const RMT_COMPONENT_DESCRIPTOR_SCHEMA: 'xtend.rmt.component-descriptor.v1';
export const RMT_COMPONENT_DIAGNOSTIC_SCHEMA: 'xtend.rmt.component-capability-diagnostic.v1';
export const RMT_COMPONENT_IMPORT_POLICY: 'explicit-importer-only';
export const RMT_COMPONENT_KERNEL_BOUNDARY: 'no-rmt-kernel-import-of-xtend-types';

export interface RmtComponentDiagnostic {
  schema: typeof RMT_COMPONENT_DIAGNOSTIC_SCHEMA;
  code: string;
  severity: 'info' | 'warning' | 'error';
  tag: string;
  message: string;
}

export interface RmtComponentCapability {
  schema: typeof RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA;
  tag: string;
  modulePath: string;
  importPolicy: typeof RMT_COMPONENT_IMPORT_POLICY;
  visualKind: 'public-ui' | 'non-visual-utility' | 'demo-non-production' | 'infrastructure-module' | string;
  family: 'form' | 'navigation' | 'overlay-surface' | 'media-feedback-layout' | 'theme-layout' | 'general-ui' | 'non-visual-utility' | 'demo-non-production' | 'infrastructure-module' | string;
  customElement: boolean;
  formAssociated: boolean;
  componentContract: Record<string, unknown> | null;
  rmt: Record<string, unknown> | null;
  a11yProfile: Record<string, unknown> | null;
  performanceProfile: Record<string, unknown> | null;
  observedAttributes: string[];
  events: string[];
  slots: string[];
  parts: string[];
  sourceToSeaRisk: string;
  kernelBoundary: string;
  diagnostics: RmtComponentDiagnostic[];
}

export interface RmtComponentDescriptorInput {
  id?: string;
  key?: string;
  ref?: string;
  tag?: string;
  host?: string;
  component?: string;
  componentTag?: string;
  attributes?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  props?: Record<string, unknown>;
  slots?: Record<string, unknown>;
  parts?: string | string[];
  part?: string | string[];
  events?: Record<string, unknown>;
  eventBindings?: Record<string, unknown>;
  bindings?: unknown[];
  source?: Record<string, unknown> | null;
}

export interface RmtComponentDescriptor {
  schema: typeof RMT_COMPONENT_DESCRIPTOR_SCHEMA;
  type: 'component';
  component: string;
  tag: string;
  key: string;
  attributes: Record<string, unknown>;
  properties: Record<string, unknown>;
  slots: Record<string, unknown>;
  parts: string[];
  events: Record<string, unknown>;
  bindings: unknown[];
  capability: {
    schema: string;
    tag: string;
    family: string;
    visualKind: string;
    modulePath: string;
  } | null;
  source: Record<string, unknown> | null;
}

export interface RmtComponentEventPayload {
  schema: 'xtend.rmt.component-event-payload.v1';
  tag: string;
  family: string;
  eventName: string;
  detail: Record<string, unknown>;
  value?: unknown;
  checked?: boolean;
  files?: Array<{ name: string; size: number; type: string; lastModified: number | null }>;
  dataset: Record<string, string>;
  validity?: Record<string, unknown>;
}

export interface RmtComponentBinding {
  schema: typeof RMT_COMPONENT_BINDING_SCHEMA;
  tag: string;
  family: string;
  eventCount: number;
  stateBridge: boolean;
  destroy(): { schema: typeof RMT_COMPONENT_BINDING_SCHEMA; tag: string; destroyed: true };
  snapshot(): {
    schema: typeof RMT_COMPONENT_BINDING_SCHEMA;
    tag: string;
    family: string;
    eventCount: number;
    value?: unknown;
  };
}

export interface RmtComponentRegistryOptions {
  manifest?: Record<string, string>;
  sourceTexts?: Record<string, string>;
  sources?: Record<string, string>;
  componentConstructors?: Record<string, unknown> | Map<string, unknown>;
  constructors?: Record<string, unknown> | Map<string, unknown>;
  componentMetadata?: Record<string, Record<string, unknown>>;
  customElements?: CustomElementRegistry;
  importComponent?: (modulePath: string, capability: RmtComponentCapability) => unknown | Promise<unknown>;
  importer?: (modulePath: string, capability: RmtComponentCapability) => unknown | Promise<unknown>;
  dispatchEvent?: (event: Record<string, unknown>) => void;
  dispatchAction?: (event: Record<string, unknown>) => void;
  stateBridge?: {
    read?: (key: string) => unknown;
    write?: (key: string, value: unknown) => void;
  };
}

export interface RmtComponentPrimitiveMatrixReport {
  schema: typeof RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA;
  registrySchema: typeof RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA;
  status: 'passed' | 'blocked';
  ok: boolean;
  manifestCount: number;
  publicComponentCount: number;
  nonVisualCount: number;
  withRmtMetadata: number;
  withComponentContract: number;
  customElementCount: number;
  formAssociatedCount: number;
  familyCounts: Record<string, number>;
  browserSmokeFamilies: string[];
  importPolicy: typeof RMT_COMPONENT_IMPORT_POLICY;
  kernelBoundary: typeof RMT_COMPONENT_KERNEL_BOUNDARY;
  diagnostics: RmtComponentDiagnostic[];
  components: Array<Record<string, unknown>>;
}

export interface RmtComponentCapabilityRegistry {
  schema: typeof RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA;
  importPolicy: typeof RMT_COMPONENT_IMPORT_POLICY;
  kernelBoundary: typeof RMT_COMPONENT_KERNEL_BOUNDARY;
  resolveComponentCapability(tag: string): RmtComponentCapability | null;
  listCapabilities(filter?: { family?: string; visualKind?: string }): RmtComponentCapability[];
  buildComponentDescriptor(input: RmtComponentDescriptorInput, options?: { source?: Record<string, unknown> }): RmtComponentDescriptor;
  bindComponentInstance(element: Element, binding?: Record<string, unknown>, options?: Record<string, unknown>): RmtComponentBinding;
  ensureComponentLoaded(tag: string, options?: RmtComponentRegistryOptions): Promise<Record<string, unknown>>;
  createMatrixReport(): RmtComponentPrimitiveMatrixReport;
  listDiagnostics(): RmtComponentDiagnostic[];
}

export function adaptComponentEventPayload(capability: RmtComponentCapability | null, event: Event): RmtComponentEventPayload;
export function classifyComponentFamily(tag: string, sourceText?: string, metadata?: Record<string, unknown>): string;
export function createRmtComponentCapabilityRegistry(options?: RmtComponentRegistryOptions): RmtComponentCapabilityRegistry;
export function createRmtComponentPrimitiveMatrix(options?: RmtComponentRegistryOptions): RmtComponentPrimitiveMatrixReport;

declare const api: {
  RMT_COMPONENT_BINDING_SCHEMA: typeof RMT_COMPONENT_BINDING_SCHEMA;
  RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA: typeof RMT_COMPONENT_CAPABILITY_REGISTRY_SCHEMA;
  RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA: typeof RMT_COMPONENT_CAPABILITY_REPORT_SCHEMA;
  RMT_COMPONENT_DESCRIPTOR_SCHEMA: typeof RMT_COMPONENT_DESCRIPTOR_SCHEMA;
  RMT_COMPONENT_DIAGNOSTIC_SCHEMA: typeof RMT_COMPONENT_DIAGNOSTIC_SCHEMA;
  RMT_COMPONENT_IMPORT_POLICY: typeof RMT_COMPONENT_IMPORT_POLICY;
  RMT_COMPONENT_KERNEL_BOUNDARY: typeof RMT_COMPONENT_KERNEL_BOUNDARY;
  adaptComponentEventPayload: typeof adaptComponentEventPayload;
  classifyComponentFamily: typeof classifyComponentFamily;
  createRmtComponentCapabilityRegistry: typeof createRmtComponentCapabilityRegistry;
  createRmtComponentPrimitiveMatrix: typeof createRmtComponentPrimitiveMatrix;
};

export default api;

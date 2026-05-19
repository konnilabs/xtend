export const RMT_DOM_DESCRIPTOR_RENDERER_DIAGNOSTIC_SCHEMA: 'xtend.epic18.rmt-dom-renderer-diagnostic.v1';
export const RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA: 'xtend.epic18.rmt-dom-descriptor-renderer.v1';
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
}

export interface RmtDomDescriptorRendererOptions {
  documentTarget?: Document;
  diagnosticsHub?: {
    publish(channel: string, payload: unknown, meta?: Record<string, unknown>): unknown;
  };
  diagnosticChannel?: string;
}

export interface RmtDomDescriptorRenderOptions {
  model?: Record<string, unknown>;
  selectorValues?: Record<string, unknown>;
  components?: Map<string, unknown> | unknown[];
  templates?: Map<string, unknown> | unknown[];
  slots?: Map<string, unknown> | unknown[];
  selectors?: Map<string, unknown> | unknown[];
  refs?: Map<string, Element>;
  source?: RmtDomDescriptorSource;
  dispatchEvent?: (event: unknown) => void;
  trustedDomRenderer?: (descriptor: unknown, context: unknown) => Node | Node[];
}

export interface RmtNoManualHtmlGate {
  schema: 'xtend.epic18.no-manual-html-gate.v1';
  scanText(sourceText: string, options?: { filePath?: string }): RmtDomDescriptorDiagnostic[];
  scanFiles(files: Record<string, string>): RmtDomDescriptorDiagnostic[];
}

export interface RmtDomDescriptorRenderer {
  schema: typeof RMT_DOM_DESCRIPTOR_RENDERER_SCHEMA;
  trustedDomBoundary: typeof TRUSTED_DOM_BOUNDARY;
  render(root: Element, descriptor: unknown, options?: RmtDomDescriptorRenderOptions): {
    schema: 'xtend.epic18.rmt-dom-render-result.v1';
    root: Element;
    nodeCount: number;
    diagnostics: RmtDomDescriptorDiagnostic[];
  };
  renderNode(descriptor: unknown, options?: RmtDomDescriptorRenderOptions): Node | Node[];
  renderKeyed(root: Element, descriptors: unknown[], options?: RmtDomDescriptorRenderOptions): Node[];
  createNoManualHtmlGate(options?: unknown): RmtNoManualHtmlGate;
  listDiagnostics(): RmtDomDescriptorDiagnostic[];
}

export function createNoManualHtmlGate(options?: unknown): RmtNoManualHtmlGate;
export function createRmtDomDescriptorRenderer(options?: RmtDomDescriptorRendererOptions): RmtDomDescriptorRenderer;

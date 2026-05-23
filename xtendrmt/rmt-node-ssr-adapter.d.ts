import type { Readable } from 'node:stream';

export const RMT_NODE_SSR_ADAPTER_SCHEMA: 'xtend.rmt.node-ssr-adapter.v1';
export const RMT_NODE_SSR_RENDER_RESULT_SCHEMA: 'xtend.rmt.node-ssr-render-result.v1';
export const RMT_NODE_SSR_JSONL_FRAME_SCHEMA: 'xtend.rmt.node-ssr-jsonl-frame.v1';
export const RMT_NODE_SSR_DIAGNOSTIC_SCHEMA: 'xtend.rmt.node-ssr-diagnostic.v1';
export const RMT_NODE_SSR_HYDRATION_SCHEMA: 'xtend.rmt.node-ssr-hydration-payload.v1';
export const RMT_NODE_SSR_CHUNK_KIND: 'renderman_template_chunk';
export const RMT_NODE_SSR_RESPONSE_KIND: 'renderman_template_prerender_response';
export const RMT_NODE_SSR_EXECUTION_MODE: 'server_prerender_hydrate';
export const RMT_NODE_SSR_STREAMING_CONTRACT_SCHEMA: 'xtend.rmt.vnext-streaming-contract.v1';
export const RMT_NODE_SSR_KERNEL_BOUNDARY: 'no-rmt-kernel-import-of-xtend-types';

export type RmtNodeSsrSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface RmtNodeSsrDiagnostic {
  schema: typeof RMT_NODE_SSR_DIAGNOSTIC_SCHEMA;
  code: string;
  severity: RmtNodeSsrSeverity;
  message: string;
  [key: string]: unknown;
}

export interface RmtNodeSsrComponentCapabilityHint {
  tag: string;
  family?: string;
  visualKind?: string;
  modulePath?: string;
  slots?: string[];
  parts?: string[];
  events?: string[];
  importPolicy?: string;
  kernelBoundary?: string;
}

export interface RmtNodeSsrHydrationPayload {
  schema: typeof RMT_NODE_SSR_HYDRATION_SCHEMA;
  requestId: string;
  executionMode: typeof RMT_NODE_SSR_EXECUTION_MODE;
  sourceKind: string;
  sourceRef?: string | null;
  componentCapabilities: RmtNodeSsrComponentCapabilityHint[];
  coreDocumentSchema?: string | null;
  streamingContractSchema?: string | null;
  [key: string]: unknown;
}

export interface RmtNodeSsrTemplateChunk {
  kind: typeof RMT_NODE_SSR_CHUNK_KIND;
  version: string;
  executionMode: typeof RMT_NODE_SSR_EXECUTION_MODE;
  transport: 'server' | string;
  rootId: string;
  template: Record<string, unknown>;
  target: Record<string, unknown>;
  markup: {
    html: string;
    textContent: string;
    descriptor: unknown;
  };
  hydration: Record<string, unknown>;
  modelSnapshot: Record<string, unknown>;
  plan: Record<string, unknown>;
  renderedAt: string;
}

export interface RmtNodeSsrRenderResult {
  schema: typeof RMT_NODE_SSR_RENDER_RESULT_SCHEMA;
  adapterSchema: typeof RMT_NODE_SSR_ADAPTER_SCHEMA;
  ok: boolean;
  status: 'rendered' | 'blocked' | string;
  requestId: string;
  html: string;
  head: {
    preloads: Array<Record<string, unknown>>;
    hints: Array<Record<string, unknown>>;
  };
  chunks: RmtNodeSsrTemplateChunk[];
  response: {
    kind: typeof RMT_NODE_SSR_RESPONSE_KIND;
    version: string;
    executionMode: typeof RMT_NODE_SSR_EXECUTION_MODE;
    rootId: string;
    chunks: RmtNodeSsrTemplateChunk[];
    hydration: RmtNodeSsrHydrationPayload;
    diagnostics: RmtNodeSsrDiagnostic[];
  };
  hydration: RmtNodeSsrHydrationPayload;
  streamingContract: Record<string, unknown> | null;
  componentCapabilities: RmtNodeSsrComponentCapabilityHint[];
  fabricTelemetryHints: Record<string, unknown>;
  diagnostics: RmtNodeSsrDiagnostic[];
}

export interface RmtNodeSsrJsonlFrame {
  schema: typeof RMT_NODE_SSR_JSONL_FRAME_SCHEMA;
  type: 'start' | 'component' | 'html' | 'hydration' | 'diagnostic' | 'complete' | 'error' | string;
  requestId: string;
  sequence: number;
  operationId: string | null;
  variant: string | null;
  capability: string | null;
  lane: string | null;
  chunkKey: string | null;
  payload: Record<string, unknown>;
  diagnostics: RmtNodeSsrDiagnostic[];
}

export interface RmtNodeSsrRenderInput {
  source?: string;
  text?: string;
  filePath?: string;
  sourceRef?: string;
  coreDocument?: Record<string, unknown>;
  core?: Record<string, unknown>;
  descriptor?: unknown;
  domDescriptor?: unknown;
  template?: Record<string, unknown>;
  preparedTemplate?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RmtNodeSsrDataSourceRecord {
  id: string;
  kind?: string | null;
  target?: string | null;
  unsafe?: boolean;
  format?: string | null;
  requiresTrustBoundary?: boolean;
  source?: Record<string, unknown>;
}

export interface RmtNodeSsrOptions {
  requestId?: string;
  rootId?: string;
  namespace?: string;
  templateId?: string;
  renderedAt?: string;
  model?: Record<string, unknown>;
  selectorValues?: Record<string, unknown>;
  manifest?: Record<string, string>;
  sourceTexts?: Record<string, string>;
  contracts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  componentRegistry?: Record<string, unknown>;
  compileRmtVNextSource?: (source: string, options?: Record<string, unknown>) => Record<string, unknown>;
  createStreamingContract?: (coreDocument: Record<string, unknown>, options?: Record<string, unknown>) => Record<string, unknown>;
  disableAutoCompiler?: boolean;
  dataSources?: RmtNodeSsrDataSourceRecord[];
  staticDataSources?: Record<string, unknown>;
  fixtures?: Record<string, unknown>;
  endpointHandlers?: Record<string, (record: RmtNodeSsrDataSourceRecord, context: Record<string, unknown>) => unknown | Promise<unknown>>;
  resolveDataSource?: (record: RmtNodeSsrDataSourceRecord, context: Record<string, unknown>) => unknown | Promise<unknown>;
  fetchAdapter?: (record: RmtNodeSsrDataSourceRecord, context: Record<string, unknown>) => unknown | Promise<unknown>;
  sanitizeHtmlOutput?: (html: string, context: Record<string, unknown>) => string;
  trustBoundary?: string | string[];
  defaultTrustBoundary?: string | string[];
  signal?: AbortSignal;
  publishDiagnostic?: (diagnostic: RmtNodeSsrDiagnostic) => void;
  [key: string]: unknown;
}

export interface RmtNodeSsrDescriptorRenderResult {
  html: string;
  componentCapabilities: RmtNodeSsrComponentCapabilityHint[];
  diagnostics: RmtNodeSsrDiagnostic[];
}

export interface RmtNodeSsrAdapter {
  schema: typeof RMT_NODE_SSR_ADAPTER_SCHEMA;
  kernelBoundary: typeof RMT_NODE_SSR_KERNEL_BOUNDARY;
  componentRegistry: Record<string, unknown> | null;
  render(input: string | RmtNodeSsrRenderInput | unknown, options?: RmtNodeSsrOptions): Promise<RmtNodeSsrRenderResult>;
  streamJsonl(input: string | RmtNodeSsrRenderInput | unknown, options?: RmtNodeSsrOptions): AsyncIterable<string>;
  toReadableStream(input: string | RmtNodeSsrRenderInput | unknown, options?: RmtNodeSsrOptions): ReadableStream<string>;
  toNodeReadable(input: string | RmtNodeSsrRenderInput | unknown, options?: RmtNodeSsrOptions): Readable;
  renderDescriptorToHtml(descriptor: unknown, options?: RmtNodeSsrOptions): RmtNodeSsrDescriptorRenderResult;
  listDiagnostics(): unknown[];
}

export function createRmtNodeSsrAdapter(options?: RmtNodeSsrOptions): RmtNodeSsrAdapter;

declare const api: {
  RMT_NODE_SSR_ADAPTER_SCHEMA: typeof RMT_NODE_SSR_ADAPTER_SCHEMA;
  RMT_NODE_SSR_RENDER_RESULT_SCHEMA: typeof RMT_NODE_SSR_RENDER_RESULT_SCHEMA;
  RMT_NODE_SSR_JSONL_FRAME_SCHEMA: typeof RMT_NODE_SSR_JSONL_FRAME_SCHEMA;
  RMT_NODE_SSR_DIAGNOSTIC_SCHEMA: typeof RMT_NODE_SSR_DIAGNOSTIC_SCHEMA;
  RMT_NODE_SSR_HYDRATION_SCHEMA: typeof RMT_NODE_SSR_HYDRATION_SCHEMA;
  RMT_NODE_SSR_CHUNK_KIND: typeof RMT_NODE_SSR_CHUNK_KIND;
  RMT_NODE_SSR_RESPONSE_KIND: typeof RMT_NODE_SSR_RESPONSE_KIND;
  RMT_NODE_SSR_EXECUTION_MODE: typeof RMT_NODE_SSR_EXECUTION_MODE;
  RMT_NODE_SSR_STREAMING_CONTRACT_SCHEMA: typeof RMT_NODE_SSR_STREAMING_CONTRACT_SCHEMA;
  RMT_NODE_SSR_KERNEL_BOUNDARY: typeof RMT_NODE_SSR_KERNEL_BOUNDARY;
  createRmtNodeSsrAdapter: typeof createRmtNodeSsrAdapter;
};

export default api;

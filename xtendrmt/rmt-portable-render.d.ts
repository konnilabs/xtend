export const RMT_PORTABLE_RENDER_SCHEMA: 'xtend.rmt.portable-render.v1';
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export interface PortableDescriptor {
  type?: 'element' | 'component' | 'text' | 'fragment' | 'empty' | 'slot' | 'conditional' | 'repeat';
  pageOutlet?: boolean; tag?: string; component?: string; text?: JsonValue; key?: string;
  attributes?: Record<string, JsonValue>; properties?: Record<string, JsonValue>;
  children?: PortableDescriptor[]; nodes?: PortableDescriptor[]; slots?: Record<string, PortableDescriptor | PortableDescriptor[]>;
  test?: JsonValue; when?: JsonValue; then?: PortableDescriptor; else?: PortableDescriptor; fallback?: PortableDescriptor;
  source?: JsonValue; template?: PortableDescriptor;
}
export interface PortableRenderArtifact {
  schema: typeof RMT_PORTABLE_RENDER_SCHEMA;
  sourceRef: string | null;
  targets: ('node' | 'php')[];
  inputs: string[];
  defaults: Record<string, JsonValue>;
  descriptor: PortableDescriptor;
  state?: Record<string, JsonValue> | null;
}
export interface PortableDiagnostic { code: string; severity: 'error'; pointer: string; operator?: string; type?: string }
export function validatePortableDescriptor(descriptor: PortableDescriptor, pointer?: string): PortableDiagnostic[];
export function createPortableRenderArtifact(input: { descriptor?: PortableDescriptor; coreDocument?: { sourceRef?: string; states?: { name?: string; id: string; initial?: JsonValue; value?: JsonValue; defaultValue?: JsonValue }[] }; orchestrationArtifacts?: { render?: { root: PortableDescriptor } } }, options?: { target?: 'node' | 'php'; inputs?: string[]; defaults?: Record<string, JsonValue>; sourceRef?: string }): PortableRenderArtifact;
export function projectPortableRender(artifact: PortableRenderArtifact, props?: Record<string, JsonValue>): { descriptor: PortableDescriptor; model: Record<string, JsonValue> };

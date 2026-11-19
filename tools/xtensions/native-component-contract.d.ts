export const NATIVE_COMPONENT_METADATA_SCHEMA: 'xtend.rmt.native-component-metadata.v1';
export interface NativeComponentMetadata {
  readonly tag: string; readonly module: string; readonly sha256: string; readonly ownership: 'shadow';
  readonly attributes: readonly string[]; readonly properties: readonly string[]; readonly slots: readonly string[];
}
export function allowedNativeComponentSink(value: unknown, kind: 'attribute' | 'property'): boolean;
export function validateNativeComponentMetadata(input: unknown): NativeComponentMetadata;
export function nativeComponentSinkAllowed(metadata: NativeComponentMetadata, name: string, kind: 'attribute' | 'property'): boolean;

/** Exact reviewed tag, module hash and complete sink/slot subset. */
export function validateCapturedNativeComponentMetadata(input: unknown): NativeComponentMetadata;

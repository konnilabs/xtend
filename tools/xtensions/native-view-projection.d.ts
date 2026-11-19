import type { XTensionRepeatScope } from './state-binding-artifact';

export const NATIVE_VIEW_PROJECTION_API_VERSION: '1.0.0';
export const NATIVE_VIEW_SCHEMA: 'xtend.rmt.native-view.v1';
/** Explicit rejection limit in UTF-16 code units; keys are never truncated. */
export const NATIVE_VIEW_MAX_KEY_LENGTH: 4096;
export type NativeViewTagName = 'a' | 'abbr' | 'address' | 'article' | 'aside' | 'audio' | 'b' | 'bdi' | 'bdo' | 'blockquote' | 'br' | 'button' | 'caption' | 'code' | 'col' | 'colgroup' | 'data' | 'datalist' | 'dd' | 'del' | 'details' | 'dfn' | 'dialog' | 'div' | 'dl' | 'dt' | 'em' | 'fieldset' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'header' | 'hgroup' | 'hr' | 'i' | 'img' | 'input' | 'ins' | 'kbd' | 'label' | 'legend' | 'li' | 'main' | 'mark' | 'menu' | 'meter' | 'nav' | 'ol' | 'optgroup' | 'option' | 'output' | 'p' | 'picture' | 'pre' | 'progress' | 'q' | 'rp' | 'rt' | 'ruby' | 's' | 'samp' | 'section' | 'select' | 'small' | 'source' | 'span' | 'strong' | 'sub' | 'summary' | 'sup' | 'table' | 'tbody' | 'td' | 'textarea' | 'tfoot' | 'th' | 'thead' | 'time' | 'tr' | 'track' | 'u' | 'ul' | 'var' | 'video' | 'wbr';
export const NATIVE_VIEW_TAG_NAMES: readonly NativeViewTagName[];
export type NativeViewPropertyName = 'value' | 'checked' | 'disabled' | 'selected' | 'readOnly' | 'required' | 'multiple' | 'indeterminate' | 'tabIndex' | 'title' | 'placeholder' | 'name' | 'type' | 'id' | 'open';
export const NATIVE_VIEW_PROPERTY_NAMES: readonly NativeViewPropertyName[];
/** Source properties.id is lowered to attributes.id before portal composition. */
export type NativeViewCompiledPropertyName = Exclude<NativeViewPropertyName, 'id'>;
export const NATIVE_VIEW_VOID_TAG_NAMES: readonly string[];
export function assertNativeAttributeName(name: string): void;
export function assertNativePropertyName(name: string): void;
export function assertNativeDomId(value: unknown): void;
/** Rejects accessors, non-JSON containers and negative zero before serialization. */
export function assertNativeCanonicalData(value: unknown, allowUndefined?: boolean): void;
export type NativeViewScalar = string | boolean | number | null;
/** Unmaterialized scalar IR3; repeat markers become trusted key selectors internally. */
export type NativeViewProjection =
  | { readonly kind: 'literal'; readonly value: NativeViewScalar }
  | { readonly kind: 'path'; readonly root: 'state' | 'selector'; readonly symbol: string; readonly path: readonly (string | number | { readonly repeat: number })[] }
  | { readonly kind: 'conditional'; readonly test: NativeViewProjection; readonly then: NativeViewProjection; readonly else: NativeViewProjection }
  | { readonly kind: 'unary'; readonly op: '!' | '-' | '+'; readonly value: NativeViewProjection }
  | { readonly kind: 'binary'; readonly op: '===' | '!==' | '<' | '<=' | '>' | '>=' | '&&' | '||' | '+' | '-' | '*' | '/' | '%'; readonly left: NativeViewProjection; readonly right: NativeViewProjection };
export type NativeViewValue = { readonly op: 'literal'; readonly value: NativeViewScalar }
  | { readonly op: 'native-projection'; readonly projection: NativeViewProjection };
export type NativeViewRepeat = readonly [XTensionRepeatScope & { readonly state: string }, ...XTensionRepeatScope[]];
export type NativeViewNode = {
  readonly type: 'element'; readonly nativeDeclarationId: string; readonly tag: NativeViewTagName;
  readonly attributes?: Readonly<Record<string, NativeViewValue>>;
  readonly properties?: Readonly<Partial<Record<NativeViewCompiledPropertyName, NativeViewValue>>>;
  readonly children: readonly NativeViewNode[];
} | {
  readonly type: 'text'; readonly nativeDeclarationId: string; readonly value: NativeViewValue;
} | {
  readonly type: 'native-repeat'; readonly nativeDeclarationId: string; readonly repeat: NativeViewRepeat;
  readonly children: readonly NativeViewNode[];
} | {
  readonly type: 'native-when'; readonly nativeDeclarationId: string; readonly test: NativeViewProjection;
  readonly children: readonly NativeViewNode[];
};
export interface NativeViewHeader {
  readonly schema: typeof NATIVE_VIEW_SCHEMA;
  readonly documentId: string;
  readonly surfaces: readonly string[];
}
/** Minimal structural shape; other compiled orchestration fields remain intact. */
export interface NativeViewProgram {
  readonly schema: 'xtend.rmt.app-orchestration.v3';
  readonly render: { readonly nativeView: NativeViewHeader; readonly root: unknown; readonly [field: string]: unknown };
  readonly state?: { readonly states?: readonly { readonly id: string; readonly initial?: unknown }[]; readonly selectors?: readonly { readonly id: string }[] };
  readonly surfaces?: readonly { readonly id: string; readonly component: NativeViewTagName; readonly kind?: string; readonly events?: readonly string[] }[];
  readonly [field: string]: unknown;
}
/** Returns an immutable, validated copy; does not execute providers or touch DOM. */
export function validateNativeViewProgram(program: unknown): NativeViewProgram;
/** Emits ordinary renderer descriptors with literal sinks and typed tuple keys. */
export function materializeNativeView(programOrValidated: unknown, snapshot: {
  readonly states: Readonly<Record<string, unknown>>;
  readonly selectors?: Readonly<Record<string, unknown>>;
}, root?: unknown): unknown;

/** Separate Source6 capability. The original API1 functions accept Program3 only. */
export interface NativeLifecycleViewProgram extends Omit<NativeViewProgram, 'schema'> {
  readonly schema: 'xtend.rmt.app-orchestration.v4';
  readonly lifecycle: import('./native-lifecycle').NativeLifecyclePlan;
}
export function validateNativeLifecycleViewProgram(program: unknown): NativeLifecycleViewProgram;
export function materializeNativeLifecycleView(program: unknown, snapshot: { readonly states: Readonly<Record<string, unknown>>; readonly selectors?: Readonly<Record<string, unknown>> }, root?: unknown, admission?: Readonly<Record<string, boolean>>): unknown;
export const NATIVE_LIFECYCLE_VIEW_RUNTIME: Readonly<{
  API_VERSION: '2.0.0'; NATIVE_VIEW_PROJECTION_API_VERSION: '2.0.0';
  assertNativeCanonicalData: typeof assertNativeCanonicalData;
  validateNativeViewProgram: typeof validateNativeLifecycleViewProgram;
  materializeNativeView: typeof materializeNativeLifecycleView;
}>;

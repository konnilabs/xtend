import type {RmtxNativeComponentTypeMapV2} from '../tools/rmt-language/rmtx-native-components-v2.generated.js';
import type {NATIVE_COMPONENT_CLASS} from './native-managed.js';
import type {ManagedNativeContext} from '../tools/xtensions/native-component-managed.js';
export type NativeWritableValueV2<T> = T extends readonly (infer Item)[] ? NativeWritableValueV2<Item>[] : T extends object ? { -readonly [Key in keyof T]: NativeWritableValueV2<T[Key]> } : T;
/** Optional fields describe writable managed sinks; a fresh, unprepared Classic instance need not initialize them. */
export type NativeWritablePropertiesV2<Tag extends keyof RmtxNativeComponentTypeMapV2> = string extends keyof RmtxNativeComponentTypeMapV2[Tag]['properties'] ? {} : { -readonly [Key in keyof RmtxNativeComponentTypeMapV2[Tag]['properties']]?: NativeWritableValueV2<RmtxNativeComponentTypeMapV2[Tag]['properties'][Key]> };
export interface NativeDefinitionConstructorV2<Tag extends keyof RmtxNativeComponentTypeMapV2, Element extends HTMLElement> {
  new(): Element & NativeWritablePropertiesV2<Tag>;
  readonly prototype: Element & NativeWritablePropertiesV2<Tag>;
  readonly observedAttributes: readonly string[];
  readonly formAssociated?: boolean;
  readonly xtendComponentContract: Readonly<Record<string, unknown>>;
  readonly [NATIVE_COMPONENT_CLASS]?: Readonly<{apiVersion:'2.0.0';tag:Tag;prepare?(element:HTMLElement,context:ManagedNativeContext):void}>;
}
export type NativeDefinitionDependenciesV2 = readonly (readonly [tag:string, constructor:CustomElementConstructor])[];

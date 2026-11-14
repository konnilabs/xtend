import type { XTensionValueRule, XTensionInstanceAddress, XTensionBindingPath, XTensionKeyedStateBinding } from './state-binding';
export const COMPONENT_INTERFACE_API_VERSION: '1.0.0';
export const COMPONENT_INTERFACE_SCHEMA: 'xtend.xtensions.component-interface.v1';
export interface ComponentInterface {
  readonly schema: typeof COMPONENT_INTERFACE_SCHEMA;
  readonly providerId: string;
  readonly version: string;
  readonly componentVersion: string;
  readonly framework: 'react' | 'vue';
  readonly entry: { readonly module: string; readonly exportName: string; readonly sha256: string };
  readonly peers: Readonly<Record<string, string>>;
  readonly props: Readonly<Record<string, XTensionValueRule>>;
  readonly intents: Readonly<Record<string, { readonly payloadSchema: string; readonly fields: Readonly<Record<string, XTensionValueRule>> }>>;
  readonly ownership: { readonly attributes: 'declared-props-only'; readonly children: 'provider-owned'; readonly slots: 'provider-owned' };
}
export interface ComponentReference {
  readonly providerId: string; readonly interfaceVersion: string; readonly interfaceSha256: string; readonly componentVersion: string;
}
export interface ComponentInterfaceCapture {
  readonly definition: ComponentInterface; readonly interfaceSha256: string; readonly moduleSha256: string;
}
export interface ComponentBindingRequest {
  readonly address: XTensionInstanceAddress;
  readonly props: Readonly<Record<string, { readonly state: string; readonly path: XTensionBindingPath }>>;
  readonly intents: Readonly<Record<string, {
    readonly command: string;
    /** Action field -> provider event field; identity mapping when omitted. */
    readonly payload?: Readonly<Record<string, string>>;
    readonly keyFields?: NonNullable<XTensionKeyedStateBinding['intents'][string]['keyFields']>;
  }>>;
}
export interface ResolvedComponentBinding {
  readonly binding: XTensionKeyedStateBinding;
  readonly routes: Readonly<Record<string, { readonly command: string; readonly payloadSchema: string; readonly payload: Readonly<Record<string, string>> }>>;
}
export function normalizeComponentInterface(input: unknown): ComponentInterface;
export function createComponentInterfaceCatalog(captures: readonly ComponentInterfaceCapture[]): {
  readonly apiVersion: '1.0.0';
  resolve(reference: ComponentReference): ComponentInterfaceCapture;
  entries(): readonly ComponentInterfaceCapture[];
};
export function resolveComponentBinding(definition: ComponentInterface, request: ComponentBindingRequest): ResolvedComponentBinding;
export function assertComponentProps(definition: ComponentInterface, props: unknown): true;
export function mapComponentIntent(definition: ComponentInterface, event: string, payload: unknown, mapping?: Readonly<Record<string, string>>): Readonly<Record<string, unknown>>;
export function canonical(value: unknown): string;

import type {NativeComponentMetadata} from '../xtensions/native-component-contract';
export const RMTX_NATIVE_COMPONENTS_API_VERSION:'1.0.0';
export const RMTX_NATIVE_COMPONENTS_SCHEMA:'xtend.rmtx.native-components.v1';
/** Exact reviewed Source7 capability subset; this is not the complete shipped component API. */
export function getRmtxNativeComponent(tag:string):NativeComponentMetadata;
export function getRmtxNativeComponentCatalog():Readonly<{schema:typeof RMTX_NATIVE_COMPONENTS_SCHEMA;source:'components/manifest.json';components:readonly NativeComponentMetadata[]}>;
export function validateRmtxNativeComponents(values:unknown):readonly NativeComponentMetadata[];
export function verifyNativeComponentSources(values:unknown, options:{rootDir:string}):readonly NativeComponentMetadata[];
export type {RmtxPublicComponentTag} from './rmtx-native-components.generated';

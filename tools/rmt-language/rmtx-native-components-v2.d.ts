import type {NativeComponentMetadataV2,NativeComponentRoleV2} from '../xtensions/native-component-contract-v2';
export declare const RMTX_NATIVE_COMPONENTS_API_VERSION_V2:'2.0.0';
export declare const RMTX_NATIVE_COMPONENTS_SCHEMA_V2:'xtend.rmtx.native-components.v2';
export declare function getRmtxNativeComponentV2(tag:string):NativeComponentMetadataV2;
export declare const getNativeComponentV2:typeof getRmtxNativeComponentV2;
export declare function getRmtxNativeComponentCatalogV2():Readonly<{schema:'xtend.rmtx.native-components.v2';apiVersion:'2.0.0';source:'components/manifest.json';counts:Readonly<Record<NativeComponentRoleV2,number>>;components:readonly NativeComponentMetadataV2[]}>;
export declare function validateRmtxNativeComponentsV2(input:unknown):readonly NativeComponentMetadataV2[];
export declare const validateNativeComponentsV2:typeof validateRmtxNativeComponentsV2;
export declare function verifyNativeComponentSourcesV2(input:unknown,options:{rootDir:string}):readonly NativeComponentMetadataV2[];

export type {RmtxNativeComponentTypeMapV2,RmtxNativeComponentTagV2} from './rmtx-native-components-v2.generated';

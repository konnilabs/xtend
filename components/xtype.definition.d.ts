// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XTypeElement} from './xtype.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xtype.js';
export type XType = XTypeElement & NativeWritablePropertiesV2<"x-type">;
export declare const XType: NativeDefinitionConstructorV2<"x-type",XTypeElement>;
export default XType;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

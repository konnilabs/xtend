// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XHeaderElement} from './xheader.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xheader.js';
export type XHeader = XHeaderElement & NativeWritablePropertiesV2<"x-header">;
export declare const XHeader: NativeDefinitionConstructorV2<"x-header",XHeaderElement>;
export default XHeader;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XStatusElement} from './xstatus.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xstatus.js';
export type XStatus = XStatusElement & NativeWritablePropertiesV2<"x-status">;
export declare const XStatus: NativeDefinitionConstructorV2<"x-status",XStatusElement>;
export default XStatus;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XToastElement} from './xtoast.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xtoast.js';
export type XToast = XToastElement & NativeWritablePropertiesV2<"x-toast">;
export declare const XToast: NativeDefinitionConstructorV2<"x-toast",XToastElement>;
export default XToast;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

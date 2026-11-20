// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XAlertElement} from './xalert.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xalert.js';
export type XAlert = XAlertElement & NativeWritablePropertiesV2<"x-alert">;
export declare const XAlert: NativeDefinitionConstructorV2<"x-alert",XAlertElement>;
export default XAlert;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XSelectElement} from './xselect.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xselect.js';
export type XSelect = XSelectElement & NativeWritablePropertiesV2<"x-select">;
export declare const XSelect: NativeDefinitionConstructorV2<"x-select",XSelectElement>;
export default XSelect;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

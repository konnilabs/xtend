// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XCheckboxElement} from './xcheckbox.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xcheckbox.js';
export type XCheckbox = XCheckboxElement & NativeWritablePropertiesV2<"x-checkbox">;
export declare const XCheckbox: NativeDefinitionConstructorV2<"x-checkbox",XCheckboxElement>;
export default XCheckbox;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

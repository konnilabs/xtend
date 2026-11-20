// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XButtonElement} from './xbutton.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xbutton.js';
export type XButton = XButtonElement & NativeWritablePropertiesV2<"x-button">;
export declare const XButton: NativeDefinitionConstructorV2<"x-button",XButtonElement>;
export default XButton;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

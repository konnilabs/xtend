// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XInputElement} from './xinput.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xinput.js';
export type XInput = XInputElement & NativeWritablePropertiesV2<"x-input">;
export declare const XInput: NativeDefinitionConstructorV2<"x-input",XInputElement>;
export default XInput;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

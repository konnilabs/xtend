// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XRadioElement} from './xradio.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xradio.js';
export type XRadio = XRadioElement & NativeWritablePropertiesV2<"x-radio">;
export declare const XRadio: NativeDefinitionConstructorV2<"x-radio",XRadioElement>;
export default XRadio;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

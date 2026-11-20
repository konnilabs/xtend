// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XSpinnerElement} from './xspinner.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xspinner.js';
export type XSpinner = XSpinnerElement & NativeWritablePropertiesV2<"x-spinner">;
export declare const XSpinner: NativeDefinitionConstructorV2<"x-spinner",XSpinnerElement>;
export default XSpinner;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XFormElement} from './xform.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xform.js';
export type XForm = XFormElement & NativeWritablePropertiesV2<"x-form">;
export declare const XForm: NativeDefinitionConstructorV2<"x-form",XFormElement>;
export default XForm;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

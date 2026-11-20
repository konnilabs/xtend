// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XModalElement} from './xmodal.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xmodal.js';
export type XModal = XModalElement & NativeWritablePropertiesV2<"x-modal">;
export declare const XModal: NativeDefinitionConstructorV2<"x-modal",XModalElement>;
export default XModal;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XSectionElement} from './xsection.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xsection.js';
export type XSection = XSectionElement & NativeWritablePropertiesV2<"x-section">;
export declare const XSection: NativeDefinitionConstructorV2<"x-section",XSectionElement>;
export default XSection;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

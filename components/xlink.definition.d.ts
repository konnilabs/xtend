// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XLinkElement} from './xlink.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xlink.js';
export type XLink = XLinkElement & NativeWritablePropertiesV2<"x-link">;
export declare const XLink: NativeDefinitionConstructorV2<"x-link",XLinkElement>;
export default XLink;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

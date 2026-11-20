// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XLightboxElement} from './xlightbox.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xlightbox.js';
export type XLightbox = XLightboxElement & NativeWritablePropertiesV2<"x-lightbox">;
export declare const XLightbox: NativeDefinitionConstructorV2<"x-lightbox",XLightboxElement>;
export default XLightbox;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XMasonryElement} from './xmasonry.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xmasonry.js';
export type XMasonry = XMasonryElement & NativeWritablePropertiesV2<"x-masonry">;
export declare const XMasonry: NativeDefinitionConstructorV2<"x-masonry",XMasonryElement>;
export default XMasonry;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

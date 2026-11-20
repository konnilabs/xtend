// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XKeymapElement} from './xkeymap.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xkeymap.js';
export type XKeymap = XKeymapElement & NativeWritablePropertiesV2<"x-keymap">;
export declare const XKeymap: NativeDefinitionConstructorV2<"x-keymap",XKeymapElement>;
export default XKeymap;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

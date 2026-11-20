// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XMenuElement} from './xmenu.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xmenu.js';
export type XMenu = XMenuElement & NativeWritablePropertiesV2<"x-menu">;
export declare const XMenu: NativeDefinitionConstructorV2<"x-menu",XMenuElement>;
export default XMenu;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

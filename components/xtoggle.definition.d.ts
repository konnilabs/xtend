// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XToggleElement} from './xtoggle.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xtoggle.js';
export type XToggle = XToggleElement & NativeWritablePropertiesV2<"x-toggle">;
export declare const XToggle: NativeDefinitionConstructorV2<"x-toggle",XToggleElement> & Omit<typeof import('./xtoggle').XToggle,'prototype'>;
export default XToggle;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

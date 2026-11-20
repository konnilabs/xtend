// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XHeroElement} from './xhero.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xhero.js';
export type XHero = XHeroElement & NativeWritablePropertiesV2<"x-hero">;
export declare const XHero: NativeDefinitionConstructorV2<"x-hero",XHeroElement>;
export default XHero;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;

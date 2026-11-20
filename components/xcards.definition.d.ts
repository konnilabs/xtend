// Pure shared definition. Importing this module does not register or bootstrap the component.
import type {XCardsElement} from './xcards.js';
import type {NativeDefinitionConstructorV2,NativeDefinitionDependenciesV2,NativeWritablePropertiesV2} from './native-managed-types.js';
export * from './xcards.js';
export type XCards = XCardsElement & NativeWritablePropertiesV2<"x-cards">;
export declare const XCards: NativeDefinitionConstructorV2<"x-cards",XCardsElement>;
export default XCards;
export declare const nativeDependencies: NativeDefinitionDependenciesV2;
export type XCard = HTMLElement;
export declare const XCard: CustomElementConstructor;

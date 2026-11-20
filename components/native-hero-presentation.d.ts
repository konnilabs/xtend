import type {ManagedNativeContext} from '../tools/xtensions/native-component-managed.js';
export interface ManagedHeroPresentation { values:Record<string,string>;align:string;vertical:string;image:string|null;themed:boolean; }
export declare function prepareManagedHero(element:HTMLElement,context:ManagedNativeContext):void;
export declare function managedHeroPresentation(element:HTMLElement,context:ManagedNativeContext):ManagedHeroPresentation;
export declare function applyManagedHeroPresentation(element:HTMLElement,checked:ManagedHeroPresentation):void;

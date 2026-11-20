import type {NativeManagedProfileV2} from './native-managed.js';
/** Profiles augment the shared actual class only after trusted preparation. */
export declare function managedProfile<Element extends HTMLElement=HTMLElement>(tag:string):NativeManagedProfileV2<Element>;
export declare function managedHeaderProfile<Element extends HTMLElement=HTMLElement>():NativeManagedProfileV2<Element>;
export declare const NATIVE_UI_COMMANDS:Readonly<Record<string,readonly string[]>>;

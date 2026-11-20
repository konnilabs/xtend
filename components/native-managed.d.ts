import type {ManagedNativeContext} from '../tools/xtensions/native-component-managed.js';
export {MANAGED_NATIVE_CONTEXT as NATIVE_COMPONENT_CONTEXT, MANAGED_NATIVE_CLASS as NATIVE_COMPONENT_CLASS} from '../tools/xtensions/native-component-managed.js';
export interface NativeManagedLocalV2 {
  cleanups: Array<()=>void>; connected:boolean; active?:boolean; updating:number;
  [key:string]:unknown;
}
export interface NativeComponentStateV2 {
  get(key?:string):unknown; set(key:string,value:unknown):unknown; remove(key:string):unknown;
  subscribe(listener:(...args:unknown[])=>void,filter?:unknown):()=>void;
  snapshot():unknown;
}
export interface NativeManagedProfileV2<Element extends HTMLElement = HTMLElement> {
  prepare?(this:Element,context:ManagedNativeContext):void;
  connect?(this:Element,context:ManagedNativeContext):void|(()=>void);
  disconnect?(this:Element,context:ManagedNativeContext):void;
  attribute?(this:Element,name:string,oldValue:string|null,newValue:string|null,context:ManagedNativeContext):unknown;
  commands?:Record<string,(this:Element,args:Record<string,unknown>,context:ManagedNativeContext)=>unknown>;
  methods?:Record<string,(this:Element,...args:unknown[])=>unknown>;
}
export declare function getManagedContext(element:unknown):ManagedNativeContext|null;
export declare const managedContext:typeof getManagedContext;
export declare function isManagedComponent(element:unknown):boolean;
export declare function componentState(element:HTMLElement,legacyState:NativeComponentStateV2):NativeComponentStateV2;
export declare function managedLocal(element:HTMLElement):NativeManagedLocalV2;
export declare function emitManagedEvent(element:HTMLElement,type:string,detail?:Record<string,unknown>):boolean;
export declare function requestManaged(element:HTMLElement,capability:string,args?:Record<string,unknown>):unknown;
export declare function onManagedCleanup(element:HTMLElement,cleanup:()=>void):()=>void;
export declare function componentListen(element:HTMLElement,target:EventTarget,type:string,listener:EventListenerOrEventListenerObject,options?:boolean|AddEventListenerOptions):()=>void;
export declare function cleanupManagedComponent(element:HTMLElement):void;
export declare function markManagedComponentClass<Constructor extends CustomElementConstructor>(constructor:Constructor,tag:string,profile?:NativeManagedProfileV2<InstanceType<Constructor>>):Constructor;
export declare function defineManagedComponent<Constructor extends CustomElementConstructor>(tag:string,constructor:Constructor,registry?:CustomElementRegistry):Constructor;

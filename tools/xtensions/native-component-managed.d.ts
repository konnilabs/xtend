import type {NativeComponentMetadataV2} from './native-component-contract-v2';
export interface ManagedNativeOwner {readonly documentId:string;readonly surfaceId:string;readonly controllerId?:string;readonly generation:number}
export interface ManagedNativeLease {readonly element:HTMLElement;readonly owner:ManagedNativeOwner;readonly ref:string;readonly keys:readonly (string|number)[];readonly handle:string;readonly signal:AbortSignal;isCurrent():boolean;isAlive():boolean;isActive():boolean;resolveFile(handle:string):File}
export interface ManagedNativePorts {
  isNativeEventEnabled?(eventId:string,lease:ManagedNativeLease):boolean;
  verifyNativeTerminalReceipt?(command:string,rawResult:unknown,lease:ManagedNativeLease):boolean;
  dispatch?(capability:string,args:unknown,lease:ManagedNativeLease):unknown;
  dispatchValidatedIntent?(action:string,payload:unknown,lease:ManagedNativeLease):unknown;
  dispatchComponentCommand?(capability:string,operation:Readonly<{target:string;command:string;args:unknown;invoke():Promise<unknown>}>,lease:ManagedNativeLease):unknown;
  onError?(error:unknown,lease:ManagedNativeLease):void;
}
/** Lifetime and activity are deliberately separate. Model projection only requires lifetime. */
export interface ManagedNativeContext {
 readonly apiVersion:'2.0.0';readonly tag:string;readonly owner:ManagedNativeOwner;readonly ref:string;readonly keys:readonly (string|number)[];
 readonly signal:AbortSignal;readonly activitySignal:AbortSignal;
 isCurrent():boolean;isAlive():boolean;isActive():boolean;isApplyingUpdate():boolean;acceptsEvent(event:string):boolean;
 emit(event:string,payload:unknown):boolean;request(capability:string,args?:unknown):unknown;
 captureFile(file:File):Readonly<{handle:string;name:string;type:string;size:number;lastModified:number}>;
 registerCommand(name:string,handler:(args:unknown,lease:ManagedNativeLease)=>unknown):()=>boolean;
 onCleanup(cleanup:()=>void):()=>boolean;
 registerActivityHooks(hooks:{resume():void;suspend():void}):()=>void;
 onActivation(callback:()=>void):()=>boolean;onDeactivation(callback:()=>void):()=>boolean;
 registerProjectionValidator(callback:(values:{attributes:Readonly<Record<string,unknown>>;properties:Readonly<Record<string,unknown>>})=>void):()=>boolean;
 onProjection(callback:(values:{attributes:Readonly<Record<string,unknown>>;properties:Readonly<Record<string,unknown>>})=>void):()=>boolean;
 connect():void;disconnect():void;
}

export declare const MANAGED_NATIVE_CONTEXT:unique symbol;
export declare const MANAGED_NATIVE_CLASS:unique symbol;
export declare function assertNativeComponentClass(constructor:CustomElementConstructor,descriptor:NativeComponentMetadataV2):CustomElementConstructor;
export declare function prepareNativeComponent(element:HTMLElement,options:{descriptor:NativeComponentMetadataV2;owner:ManagedNativeOwner;ref:string;keys?:readonly (string|number)[];ports?:ManagedNativePorts;signal?:AbortSignal;isCurrent:()=>boolean;isActive?:()=>boolean}):ManagedNativeContext;
export declare function resolveManagedComponent(element:HTMLElement):ManagedNativeContext|null;
export declare function updateNativeComponent(element:HTMLElement,input:{attributes?:Record<string,unknown>;properties?:Record<string,unknown>}):unknown;
export declare function bindNativeComponentEvents(element:HTMLElement,bindings:readonly {event:string;action:string;payload:Record<string,string|readonly string[]>;keyFields?:Record<string,number>;eventId?:string}[]):unknown;
export declare function dispatchNativeComponentCommand(request:{owner:ManagedNativeOwner;target:string;keys?:readonly (string|number)[];command:string;args?:unknown},ports?:ManagedNativePorts):Promise<unknown>;
export declare function suspendNativeComponent(element:HTMLElement):boolean;
export declare function resumeNativeComponent(element:HTMLElement):boolean;
export declare function disposeNativeComponent(element:HTMLElement):boolean;

export declare function synchronizeNativeComponentActivity(element:HTMLElement):boolean;

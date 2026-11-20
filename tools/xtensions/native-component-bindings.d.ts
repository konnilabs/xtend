import type {NativeManagedViewProgram,NativeManagedBinding,NativeManagedComponentEvent,NativeManagedComponentCommand} from './native-managed-view-projection';
import type {NativeSurfaceMaterialization} from './native-managed-surface-scopes';
export const NATIVE_COMPONENT_BINDINGS_API_VERSION:'1.0.0';
export interface NativeCommandSnapshot {readonly states:Readonly<Record<string,unknown>>;readonly selectors?:Readonly<Record<string,unknown>>}
export interface ResolvedNativeCommand {readonly target:string;readonly ref:string;readonly surfaceId:string;readonly declarationId:string;readonly keys:readonly (string|number)[];readonly command:string;readonly args:unknown}
export function validateNativeComponentBindings(program:unknown):Readonly<{bindings:readonly NativeManagedBinding[];events:readonly NativeManagedComponentEvent[];commands:readonly NativeManagedComponentCommand[]}>;
export function materializeNativeComponentBindings(program:NativeManagedViewProgram,snapshot:NativeCommandSnapshot,materialization?:NativeSurfaceMaterialization):readonly Readonly<NativeManagedBinding & {surfaceId:string;keys:readonly (string|number)[];events:readonly Readonly<{event:string;action:string;payload:Readonly<Record<string,readonly string[]>>;keyFields?:Readonly<Record<string,number>>}>[]}>[];
export function evaluateNativeCommandExpression(expression:unknown,snapshot:NativeCommandSnapshot,input:Readonly<Record<string,unknown>>):unknown;
export function resolveNativeCommand(program:NativeManagedViewProgram,effectId:string,snapshot:NativeCommandSnapshot,input:Readonly<Record<string,unknown>>):ResolvedNativeCommand;
export function nativePlatformOperationId(binding:Pick<NativeManagedBinding,'declarationId'>,command:string):string;
export function resolveNativePlatformOperation(program:NativeManagedViewProgram,declarationId:string,command:string):Readonly<{id:string;sourceRef:string;binding:NativeManagedBinding;command:string;capability:string;fiberId:string;lane:string;surface:string}>;

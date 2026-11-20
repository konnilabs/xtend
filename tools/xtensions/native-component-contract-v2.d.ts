export type NativeValueRuleV2 = Readonly<{type:'string'|'number'|'boolean'|'key'|'json'|'object'|'array';nullable?:boolean;fields?:Readonly<Record<string,NativeValueRuleV2>>;items?:NativeValueRuleV2;optional?:readonly string[];enum?:readonly (string|number|boolean|null)[];minimum?:number;maximum?:number;maxLength?:number;format?:'civil-date'|'civil-date-or-empty'}>;
export type NativeComponentRoleV2 = 'ui'|'platform'|'service'|'demo';
export interface NativeComponentMetadataV2 {
  readonly schema:'xtend.rmt.native-component-metadata.v2';readonly tag:string;readonly module:string;readonly managedModule:string;readonly sha256:string;
  readonly dependencies:readonly Readonly<{module:string;sha256:string}>[];readonly role:NativeComponentRoleV2;readonly ownership:'shadow'|'surface'|'service';readonly sourceStrategy:'managed-shared-definition';
  readonly attributes:Readonly<Record<string,NativeValueRuleV2>>;readonly properties:Readonly<Record<string,NativeValueRuleV2>>;
  readonly events:Readonly<Record<string,Readonly<{payload:NativeValueRuleV2}>>>;
  readonly commands:Readonly<Record<string,Readonly<{args:NativeValueRuleV2;result:NativeValueRuleV2;capability:string}>>>;
  readonly state:Readonly<{controlled:readonly string[];ephemeral:readonly string[]}>;readonly slots:readonly string[];
  readonly dom:Readonly<{authorChildren:'preserve';writes:'shadow-only'|'surface-port'|'none'}>;readonly capabilities:readonly string[];
  readonly status:Readonly<{implementation:'implemented'|'pending';verification:'pending'|'verified'}>;
}
export declare const NATIVE_COMPONENT_METADATA_SCHEMA_V2:'xtend.rmt.native-component-metadata.v2';
export declare function validateNativeComponentMetadataV2(input:unknown):NativeComponentMetadataV2;
export declare function validateCapturedNativeComponentMetadataV2(input:unknown):NativeComponentMetadataV2;
export declare function nativeComponentSinkAllowedV2(meta:NativeComponentMetadataV2,name:string,kind:'attribute'|'property'):boolean;
export declare function validateNativeValueV2(value:unknown,rule:NativeValueRuleV2,label?:string):true;
export declare function validateNativeComponentValuesV2(meta:NativeComponentMetadataV2,input:{attributes?:Record<string,unknown>;properties?:Record<string,unknown>}):Readonly<{attributes?:Readonly<Record<string,unknown>>;properties?:Readonly<Record<string,unknown>>}>;
export declare function validateNativeComponentEventV2(meta:NativeComponentMetadataV2,event:string,payload:unknown):unknown;
export declare function validateNativeComponentCommandV2(meta:NativeComponentMetadataV2,command:string,args:unknown):unknown;
export declare function canonical(value:unknown):string;

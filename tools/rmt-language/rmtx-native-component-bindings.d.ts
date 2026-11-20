import type {RmtxManagedNativeViewSourceContract,RmtxManagedNativeBinding,RmtxManagedNativeEvent,RmtxManagedNativeCommand,RmtxNativeSourcePath} from './rmtx-native-view';
export type RmtxNativeCommandExpression = Readonly<{kind:'literal';value:import('./rmt-tooling-public-types').RmtJsonValue}>
 | Readonly<{kind:'input';path:readonly (string|number)[]}>
 | Readonly<{kind:'path';root:'state'|'selector';symbol:string;path:RmtxNativeSourcePath}>
 | Readonly<{kind:'object';fields:Readonly<Record<string,RmtxNativeCommandExpression>>}>
 | Readonly<{kind:'array';items:readonly RmtxNativeCommandExpression[]}>
 | Readonly<{kind:'conditional';test:RmtxNativeCommandExpression;then:RmtxNativeCommandExpression;else:RmtxNativeCommandExpression}>
 | Readonly<{kind:'unary';op:'!'|'+'|'-';value:RmtxNativeCommandExpression}>
 | Readonly<{kind:'binary';op:'==='|'!=='|'<'|'<='|'>'|'>='|'&&'|'||'|'+'|'-'|'*'|'/'|'%';left:RmtxNativeCommandExpression;right:RmtxNativeCommandExpression}>;
export function validateCommandExpression(expression:RmtxNativeCommandExpression,depth?:number):void;
export function validateNativeComponentBindingSource(source:RmtxManagedNativeViewSourceContract,ast?:import('./classic-ast-types').RmtClassicAst|null):Readonly<{bindings:readonly RmtxManagedNativeBinding[];events:readonly RmtxManagedNativeEvent[];commands:readonly RmtxManagedNativeCommand[]}>;
export function lowerNativeComponentBindings(source:RmtxManagedNativeViewSourceContract,context?:{ast?:import('./classic-ast-types').RmtClassicAst;core?:import('./vnext-compiler').RmtVNextCoreDocument;events?:unknown[]}):Readonly<{bindings:readonly RmtxManagedNativeBinding[];events:readonly (RmtxManagedNativeEvent|import('../xtensions/native-managed-view-projection').NativeManagedComponentEvent)[];commands:readonly (RmtxManagedNativeCommand|import('../xtensions/native-managed-view-projection').NativeManagedComponentCommand)[]}>;

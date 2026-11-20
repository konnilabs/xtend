import {RMT,model,RMTX_AUTHORING_API_VERSION,type RmtxAuthoringNamespaceV7} from '../../tools/rmt-language/rmtx';
import {parseRmtxSource,type RmtxParserOptionsV8} from '../../tools/rmt-language/rmtx-parser';
import {compileRmtxSource,createRmtxCompiler} from '../../tools/rmt-language/rmtx-compiler';
import {getRmtxOperatorProfile} from '../../tools/rmt-language/rmtx-operator-profiles';
import type {RmtxNativeComponentTypeMapV2} from '../../tools/rmt-language/rmtx-native-components-v2';
import type {ManagedNativeContext} from '../../tools/xtensions/native-component-managed';
const authoring:'8.0.0'=RMTX_AUTHORING_API_VERSION;
RMT.Component({tag:'x-input',ref:'email',properties:{value:'alice@example.test'},attributes:{required:true}});
RMT.Component({tag:'x-input',properties:{value:model.form.email}});
RMT.Component({tag:'x-select',properties:{values:['red','green'],multiple:true}});
RMT.Component({tag:'x-masonry',properties:{items:[{key:1,ref:'panel',keys:['parent',1]}],order:[1],collapsed:[]}});
RMT.Component({tag:'x-modal',properties:{actions:[{label:'Accept',action:'accept',primary:true}]}});
RMT.Element({tag:'section',ref:'panel'});
RMT.Effect({kind:'component-command',target:'editor.email',command:'focus',args:{}});
// @ts-expect-error A string control does not accept a numeric literal.
RMT.Component({tag:'x-input',properties:{value:42}});
// @ts-expect-error Property grants are per tag, not a global union.
RMT.Component({tag:'x-button',properties:{checked:true}});
// @ts-expect-error Global/data attributes do not fall through.
RMT.Component({tag:'x-input',attributes:{'aria-hidden':true}});
// @ts-expect-error Structured data belongs to declared properties.
RMT.Component({tag:'x-select',attributes:{value:['red']}});
// @ts-expect-error Model control props are JSON-only and do not accept callbacks.
RMT.Component({tag:'x-modal',properties:{actions:[{label:'Accept',action:'accept',callback(){}}]}});
// @ts-expect-error Services are not CustomElement views.
RMT.Component({tag:'xtend-state'});
// @ts-expect-error Raw HTML setters are not implicit native properties.
RMT.Component({tag:'x-input',properties:{innerHTML:'unsafe'}});
declare const legacy:RmtxAuthoringNamespaceV7;
legacy.Component({tag:'x-button'});
// @ts-expect-error Source7 retains exactly its two-tag captured surface.
legacy.Component({tag:'x-input'});
const dto:RmtxNativeComponentTypeMapV2['x-input']['events']['input-changed']={detail:{value:'Alice'}};
// @ts-expect-error Event DTOs retain typed declared fields.
const wrongDto:RmtxNativeComponentTypeMapV2['x-input']['events']['input-changed']={detail:{value:false}};
const focusArgs:RmtxNativeComponentTypeMapV2['x-input']['commands']['focus']['args']={};
// @ts-expect-error Empty command arguments stay closed.
const unsafeArgs:RmtxNativeComponentTypeMapV2['x-input']['commands']['focus']['args']={selector:'body'};
const options:RmtxParserOptionsV8={syntaxVersion:'8.0.0'};
const parsed=parseRmtxSource('',options);const parserVersion:'8.0.0'=parsed.apiVersion;
const compiled=compileRmtxSource('',options);const compileVersion:'8.0.0'=compiled.apiVersion;
const compiler=createRmtxCompiler(options);const factoryVersion:'8.0.0'=compiler.apiVersion;
const old=compiler.compileSource('',{syntaxVersion:'7.0.0'});const oldVersion:'7.0.0'=old.apiVersion;
const defaultVersion:'1.0.0'=parseRmtxSource('').apiVersion;
const profileVersion:'7.0.0'=getRmtxOperatorProfile('8.0.0').apiVersion;
const oldProfileVersion:'6.0.0'=getRmtxOperatorProfile('7.0.0').apiVersion;
declare const context:ManagedNativeContext;
context.registerActivityHooks({resume(){},suspend(){}});context.registerProjectionValidator(dto=>{dto.properties;});context.onProjection(dto=>{dto.attributes;});context.isCurrent();context.isActive();
void [authoring,dto,wrongDto,focusArgs,unsafeArgs,parserVersion,compileVersion,factoryVersion,oldVersion,defaultVersion,profileVersion,oldProfileVersion];

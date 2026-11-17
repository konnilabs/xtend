import { parseRmtxSource, RMTX_PARSER_SCHEMA_V3, RMTX_KEYED_SOURCE_PROFILE, type RmtxParseResultV3, type RmtxHostScopeSourceContract, type RmtxParserOptionsV3 } from '../../../tools/rmt-language/rmtx-parser';
import { compileRmtxSource, createRmtxCompiler, RMTX_COMPILE_RESULT_SCHEMA_V3, type RmtxCompilerV3, type RmtxCompileResultV3, type RmtxCompilerOptionsV3 } from '../../../tools/rmt-language/rmtx-compiler';
import { RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2, type RmtxSelectorDependencyReportV2 } from '../../../tools/rmt-language/rmtx-selector-dependencies';
const options:RmtxCompilerOptionsV3={syntaxVersion:'3.0.0'};
const parser:RmtxParseResultV3=parseRmtxSource('',options);
const compiler:RmtxCompileResultV3=compileRmtxSource('',options);
const factory:Readonly<RmtxCompilerV3>=createRmtxCompiler(options);
const result:RmtxCompileResultV3=factory.compileSource('');
const older:'2.0.0'=factory.compileSource('',{syntaxVersion:'2.0.0'}).apiVersion;
const legacy:'1.0.0'=factory.compileSource('',{syntaxVersion:'1.0.0'}).apiVersion;
const schema:typeof RMTX_PARSER_SCHEMA_V3=parser.schema;
const compiled:typeof RMTX_COMPILE_RESULT_SCHEMA_V3=compiler.schema;
const profile:typeof RMTX_KEYED_SOURCE_PROFILE=compiler.sourceProfile;
const host:RmtxHostScopeSourceContract|null=parser.hostScopes;
if(host?.hosts[0].repeat){const state:string=host.hosts[0].repeat[0].state; const key:string=host.hosts[0].repeat[0].key[0];void[state,key];}
const dependencies:RmtxSelectorDependencyReportV2|null=result.selectorDependencies;
if(dependencies){const schema:typeof RMTX_SELECTOR_DEPENDENCIES_SCHEMA_V2=dependencies.schema;void schema;}
const anyOptions:RmtxParserOptionsV3|{syntaxVersion:'2.0.0'} = Math.random()?options:{syntaxVersion:'2.0.0'};
const union=parseRmtxSource('',anyOptions);
if(union.schema===RMTX_PARSER_SCHEMA_V3){const c:RmtxHostScopeSourceContract|null=union.hostScopes;void c;}
void[schema,compiled,profile,host,older,legacy];
import type { RmtxOperatorAttributeKind, RmtxOperatorContract, RmtxOperatorAttributeKindV2 } from '../../../tools/rmt-language/rmtx-operator-profiles';
import { getRmtxOperatorProfile, RMTX_OPERATOR_PROFILE_SCHEMA, RMTX_OPERATOR_PROFILE_SCHEMA_V2 } from '../../../tools/rmt-language/rmtx-operator-profiles';
type Equal<A,B>=(<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;
const retainedKind:Equal<RmtxOperatorAttributeKind,'symbol'|'string'|'json-literal'|'boolean'|'reducer-value'|'model-or-selector-path'|'boolean-predicate'|'item-path'|'enum'>=true;
const legacyCatalogSchema:typeof RMTX_OPERATOR_PROFILE_SCHEMA=getRmtxOperatorProfile('2.0.0').schema;
const nextCatalogSchema:typeof RMTX_OPERATOR_PROFILE_SCHEMA_V2=getRmtxOperatorProfile('3.0.0').schema;
const oldContract:RmtxOperatorContract=getRmtxOperatorProfile('2.0.0').operators.Surface;
const nextKind:RmtxOperatorAttributeKindV2=getRmtxOperatorProfile('3.0.0').operators.On.attributes.payload.kind;
// @ts-expect-error The legacy operator record does not acquire v2 lowering metadata.
oldContract.lowering;
void[retainedKind,legacyCatalogSchema,nextCatalogSchema,nextKind];

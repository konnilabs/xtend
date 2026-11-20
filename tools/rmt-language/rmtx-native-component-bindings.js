// SPDX-License-Identifier: Apache-2.0
'use strict';
const {data,fields,name,segments,clone,freeze}=require('../xtensions/state-binding-contract');
const {validateRepeat}=require('../xtensions/repeat-scopes');
const {visitProjection}=require('../xtensions/state-binding-projection');
const {validateRmtxNativeComponentsV2}=require('./rmtx-native-components-v2');
function invalid(message){throw Object.assign(new TypeError(message),{code:'rmtx.native-bindings.invalid'});}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function validateCommandExpression(expression,depth=0){
 if(depth>64)invalid('Native command expressions exceed their limit.');data(expression);
 if(expression.kind==='input'){fields(expression,['kind','path'],'Native Action input');segments(expression.path);if(!expression.path.length)invalid('Native commands require an explicit input field.');return;}
 if(expression.kind==='object'){fields(expression,['kind','fields'],'Native command object');fields(expression.fields,Object.keys(expression.fields||{}),'Native command fields');for(const value of Object.values(expression.fields))validateCommandExpression(value,depth+1);return;}
 if(expression.kind==='array'){fields(expression,['kind','items'],'Native command array');if(!Array.isArray(expression.items))invalid('Invalid native command array.');for(const value of expression.items)validateCommandExpression(value,depth+1);return;}
 if(expression.kind==='conditional'){fields(expression,['kind','test','then','else'],'Native command conditional');for(const key of ['test','then','else'])validateCommandExpression(expression[key],depth+1);return;}
 if(expression.kind==='binary'){fields(expression,['kind','op','left','right'],'Native command operation');validateCommandExpression(expression.left,depth+1);validateCommandExpression(expression.right,depth+1);if(!['===','!==','<','<=','>','>=','&&','||','+','-','*','/','%'].includes(expression.op))invalid('Unsupported native command operator.');return;}
 if(expression.kind==='unary'){fields(expression,['kind','op','value'],'Native command unary');if(!['!','+','-'].includes(expression.op))invalid('Unsupported native unary.');validateCommandExpression(expression.value,depth+1);return;}
 visitProjection(expression,()=>{});
}
function validateNativeComponentBindingSource(source,ast=null){
 data(source);if(source.schema!=='xtend.rmtx.native-view.v3')invalid('Native component bindings require Source8/Header3.');
 const components=new Map(validateRmtxNativeComponentsV2(source.components).map(row=>[row.tag,row]));
 for(const key of ['bindings','events','commands'])if(!Array.isArray(source[key])||source[key].length>50000)invalid('Native bindings require bounded explicit arrays.');
 const nodes=new Map();
 function walk(node,surface,repeat){
  if(node.type==='native-repeat')repeat=node.repeat;
  if(node.type==='native-component'){
   if(nodes.has(node.nativeDeclarationId)||typeof node.ref!=='string'||!/^[A-Za-z][A-Za-z0-9_-]*$/.test(node.ref)||!components.has(node.tag))invalid('Native refs require distinct captured component declarations.');
   nodes.set(node.nativeDeclarationId,{node,surface,repeat:repeat||[]});
  }
  for(const child of node.children||[])walk(child,surface,repeat);
  for(const slot of node.slots||[])walk(slot,surface,repeat);
 }
 for(const view of source.views||[])for(const node of view.children||[])walk(node,view.surface,view.repeat||[]);
 const bindings=new Map(),refs=new Set();
 for(const binding of source.bindings){
  fields(binding,['declarationId','surface','ref','tag','repeat'],'Native component declaration');name(binding.declarationId);name(binding.surface);if(!Array.isArray(binding.repeat))invalid('Native bindings require an explicit repeat chain.');if(binding.repeat.length)validateRepeat(binding.repeat);
  const found=nodes.get(binding.declarationId),key=binding.surface+'.'+binding.ref;
  if(!found||bindings.has(binding.declarationId)||refs.has(key)||found.node.ref!==binding.ref||found.node.tag!==binding.tag||found.surface!==binding.surface||!same(found.repeat,binding.repeat))invalid('Native binding differs from its exact native node and complete repeat scope.');
  bindings.set(binding.declarationId,binding);refs.add(key);
 }
 if(bindings.size!==nodes.size)invalid('Every native component requires one exact binding declaration.');
 const seenEvents=new Set(),seenCommands=new Set();
 const at=pointer=>{let node=ast;for(const part of pointer.slice(1).split('/'))node=node?.[part];return node;};
 for(const event of source.events){
  fields(event,['astPointer','surface','component','ref','event'],'Native component event');const binding=bindings.get(event.component),node=nodes.get(event.component)?.node,metadata=components.get(binding?.tag);
  if(!binding||seenEvents.has(event.astPointer)||event.surface!==binding.surface||event.ref!==binding.ref||!metadata.events[event.event]||!node.events?.some(row=>same(row,event)))invalid('Native events require exact captured component provenance.');
  if(ast){const statement=at(event.astPointer);if(statement?.type!=='RmtEventBinding'||statement.event!==event.event)invalid('Native event does not join its genuine AST On.');}
  seenEvents.add(event.astPointer);
 }
 for(const {node}of nodes.values())if(!Array.isArray(node.events)||node.events.some(event=>!source.events.some(row=>same(row,event))))invalid('Native event sidecars must match every component On.');
 for(const command of source.commands){
  fields(command,['astPointer','action','surface','component','ref','command','args','keys'],'Native component command');const binding=bindings.get(command.component),metadata=components.get(binding?.tag);
  if(!binding||seenCommands.has(command.astPointer)||command.surface!==binding.surface||command.ref!==binding.ref||!metadata.commands[command.command]||command.keys?.kind!=='array'||command.keys.items.length!==binding.repeat.length)invalid('Native commands require a captured command and complete typed instance keys.');
  validateCommandExpression(command.args);validateCommandExpression(command.keys);
  if(ast){const statement=at(command.astPointer);if(statement?.type!=='RmtEffectStatement'||statement.effectKind!=='component-command'||statement.componentCommand!==null||statement.source?.kind!=='surface'||statement.source.value!==command.surface)invalid('Native commands require their genuine AST Effect and unchanged AST1 fields.');}
  seenCommands.add(command.astPointer);
 }
 if(ast){let count=0;const walkAst=node=>{if(!node||typeof node!=='object')return;if(node.type==='RmtEffectStatement'&&node.effectKind==='component-command'){count++;if(!seenCommands.has(node.astPointer))invalid('A native Effect cannot execute without its exact command sidecar.');}for(const [key,value]of Object.entries(node)){if(key==='range')continue;if(Array.isArray(value))value.forEach(walkAst);else walkAst(value);}};walkAst(ast);if(count!==source.commands.length)invalid('Native command source coverage differs.');}
 return freeze(clone({bindings:source.bindings,events:source.events,commands:source.commands}));
}
function lowerNativeComponentBindings(source,context={}){
 const checked=validateNativeComponentBindingSource(source,context.ast||null);
 if(!context.core)return checked;
 const core=context.core;
 const locate=(pointer,type,collection)=>{const rows=(core.sourceMap||[]).filter(row=>row.astPointer===pointer&&row.nodeType===type&&new RegExp('^/'+collection+'/\\d+$').test(row.corePointer));if(rows.length!==1)invalid('Native bindings require one exact AST-to-Core mapping.');const row=core[collection]?.[Number(rows[0].corePointer.slice(collection.length+2))];if(!row||rows[0].id!=='src:'+row.id)invalid('Native binding Core source identity differs.');return row;};
 const events=checked.events.map(binding=>{
  const original=locate(binding.astPointer,'RmtEventBinding','events'),event=(context.events||[]).find(row=>row.id===original.id);
  if(!event||event.surface!==binding.surface)invalid('Native On differs from owning Core event.');
  const index=context.events.indexOf(event);context.events[index]={...event,schema:'xtend.rmt.native-event-binding.v3',component:binding.component};
  return {...binding,eventId:event.id,action:event.action,payload:clone(event.payload||{})};
 });
 const commands=checked.commands.map(binding=>{
  const effect=locate(binding.astPointer,'RmtEffectStatement','effects');if(effect.kind!=='component-command'||effect.source?.kind!=='surface'||effect.source.target!==binding.surface)invalid('Native Effect differs from its actual Core owner.');
  return{...binding,id:effect.id,sourceRef:'src:'+effect.id};
 });
 const nativeEffects=(core.effects||[]).filter(effect=>effect.kind==='component-command');if(nativeEffects.length!==commands.length)invalid('Sidecarless native Effects are forbidden.');
 return{bindings:checked.bindings,events:freeze(events),commands:freeze(commands)};
}
module.exports={validateNativeComponentBindingSource,validateCommandExpression,lowerNativeComponentBindings};

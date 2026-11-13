// SPDX-License-Identifier: Apache-2.0
'use strict';
// Only XTend-owned, statically captured CommonJS modules enter this bridge.
// Explicit imports/exports let Rollup discard unused contract/report helpers.
function toESM(source,parseAst,resolve){
 const ast=parseAst(source),edits=[];let exported=false;
 for(const statement of ast.body){
  if(statement.type==='VariableDeclaration'){
   const imports=[],remaining=[];
   for(const row of statement.declarations){
    const call=row.init;
    if(call?.type!=='CallExpression'||call.callee.type!=='Identifier'||call.callee.name!=='require'){remaining.push(source.slice(row.start,row.end));continue;}
    if(call.arguments.length!==1||typeof call.arguments[0].value!=='string')throw new TypeError('Static platform imports are required.');
    const target=JSON.stringify(resolve(call.arguments[0].value));
    if(row.id.type==='Identifier')imports.push(`import * as ${row.id.name} from ${target};`);
    else if(row.id.type==='ObjectPattern'&&row.id.properties.every(p=>p.type==='Property'&&!p.computed&&p.key.type==='Identifier'&&p.value.type==='Identifier'))imports.push(`import {${row.id.properties.map(p=>p.key.name===p.value.name?p.key.name:p.key.name+' as '+p.value.name).join(',')}} from ${target};`);
    else throw new TypeError('Platform imports require static identifier bindings.');
   }
   if(imports.length)edits.push({start:statement.start,end:statement.end,text:imports.join('\n')+(remaining.length?'\n'+statement.kind+' '+remaining.join(',')+';':'')});
  }
  const assignment=statement.type==='ExpressionStatement'&&statement.expression;
  if(assignment?.type==='AssignmentExpression'&&assignment.operator==='='&&assignment.left.type==='MemberExpression'&&assignment.left.object.name==='module'&&assignment.left.property.name==='exports'){
   const object=assignment.right;
   if(exported||object.type!=='ObjectExpression'||object.properties.some(p=>p.type!=='Property'||p.computed||p.key.type!=='Identifier'||p.value.type!=='Identifier'))throw new TypeError('Platform exports require one static identifier record.');
   exported=true;edits.push({start:statement.start,end:statement.end,text:'export {'+object.properties.map(p=>p.key.name===p.value.name?p.value.name:p.value.name+' as '+p.key.name).join(',')+'};'});
  }
 }
 if(!exported)throw new TypeError('Platform module has no static exports.');
 for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
 // No unresolved CommonJS machinery or computed load is permitted in output.
 function check(node){if(!node||typeof node!=='object')return;if(node.type==='Identifier'&&['require','module','exports'].includes(node.name))throw new TypeError('Unconverted CommonJS platform operation.');for(const value of Object.values(node))if(Array.isArray(value))value.forEach(check);else if(value&&typeof value==='object')check(value);}
 check(parseAst(source));return source;
}
module.exports={toESM};

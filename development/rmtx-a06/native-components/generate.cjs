'use strict';
// Capture static shipped declarations only. Component constructors never execute.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),ts=require('typescript');
const root=path.resolve(__dirname,'../../..'),manifest=require(path.join(root,'components/manifest.json'));
const {allowedNativeComponentSink,validateNativeComponentMetadata}=require(path.join(root,'tools/xtensions/native-component-contract'));
// A ShadowRoot alone does not establish safe light-DOM/sink ownership.
// Every tag and callable sink below is an explicitly reviewed Source7 subset
// of its shipped API. Other shipped controls keep their existing Classic APIs.
const reviewed=Object.freeze({
  'x-button':Object.freeze({module:'components/xbutton.js',attributes:['disabled','label','text'],properties:[],inheritedProperties:['title'],slots:['default']}),
  'x-header':Object.freeze({module:'components/xheader.js',attributes:['title'],properties:[],inheritedProperties:['title'],slots:['actions','logo','nav','search','title','utility']})
});
const array=value=>Array.isArray(value)?value.filter(x=>typeof x==='string'):[];
function capture(tag,module){
 const contract=reviewed[tag];
 if(!contract||contract.module!==module)throw Error('A native tag requires its exact reviewed local module.');
 const {captureNativeDefinitionClosure}=require('../../../tools/xtensions/native-component-source');
 const closure=captureNativeDefinitionClosure(root,module),entryFile=path.join(root,module);
 let entry=fs.readFileSync(entryFile,'utf8');
 const receipt='// Native shared-definition closure sha256: '+closure.sha256;
 const expected=entry.replace(/^\/\/ Native shared-definition closure sha256: [a-f0-9]{64}\n/u,'');
 if(entry!==receipt+'\n'+expected){if(process.argv.includes('--check'))throw Error('Reviewed Source7 shared definition closure drift.');entry=receipt+'\n'+expected;fs.writeFileSync(entryFile,entry);}
 const source=fs.readFileSync(path.join(root,closure.definition),'utf8');
 if(!source.includes('.attachShadow('))throw Error('Reviewed native tags must retain their shipped Shadow DOM implementation.');
 const file=ts.createSourceFile(module,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),variables=new Map(),getters=new Map(),props=new Set(),slots=new Set();
 function walk(node){
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer)variables.set(node.name.text,node.initializer);
  if(ts.isClassDeclaration(node)&&node.name)for(const member of node.members){
   const name=member.name&&(ts.isIdentifier(member.name)||ts.isStringLiteral(member.name))?member.name.text:null;
   if(!name)continue;
   const stat=member.modifiers?.some(m=>m.kind===ts.SyntaxKind.StaticKeyword);
   if(stat&&ts.isGetAccessor(member))getters.set(node.name.text+'.'+name,member.body?.statements.find(ts.isReturnStatement)?.expression);
   if(!stat&&ts.isSetAccessor(member)&&allowedNativeComponentSink(name,'property'))props.add(name);
  }
  ts.forEachChild(node,walk);
 }
 walk(file);
 function value(node,seen=new Set()){
  if(!node||seen.has(node))return undefined;seen=new Set(seen);seen.add(node);
  if(ts.isStringLiteralLike(node)||ts.isNumericLiteral(node))return ts.isNumericLiteral(node)?Number(node.text):node.text;
  if(ts.isIdentifier(node))return value(variables.get(node.text),seen);
  if(ts.isParenthesizedExpression(node)||ts.isAsExpression(node))return value(node.expression,seen);
  if(ts.isPropertyAccessExpression(node))return value(getters.get(node.getText(file)),seen);
  if(ts.isArrayLiteralExpression(node)){let a=[];for(const x of node.elements){const v=value(ts.isSpreadElement(x)?x.expression:x,seen);if(ts.isSpreadElement(x))a.push(...array(v));else if(v!==undefined)a.push(v);}return a;}
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)){
   if(node.expression.getText(file)==='Object.freeze')return value(node.arguments[0],seen);
   const base=value(node.expression.expression,seen),method=node.expression.name.text;
   if(Array.isArray(base)&&method==='slice'&&!node.arguments.length)return base;
   if(Array.isArray(base)&&method==='concat')return base.concat(...node.arguments.map(x=>value(x,seen)).filter(x=>x!==undefined));
  }
  return undefined;
 }
 const attrs=new Set();for(const [name,node]of getters)if(name.endsWith('.observedAttributes'))array(value(node)).forEach(x=>{if(allowedNativeComponentSink(x,'attribute'))attrs.add(x)});
 function metadata(node){if(ts.isPropertyAssignment(node)&&node.name?.getText(file).replace(/['"]/g,'')==='slots')array(value(node.initializer)).forEach(x=>slots.add(x));ts.forEachChild(node,metadata);}metadata(file);
 for(const match of source.matchAll(/<slot\b([^>]*)>/gu)){const name=/\bname=["']([^"']*)["']/u.exec(match[1]);slots.add(name?.[1]||'default');}
 if(/createElement\(["']slot["']\)/u.test(source)&&!slots.size)slots.add('default');
 for(const name of contract.attributes)if(!attrs.has(name))throw Error('A reviewed native attribute is absent from the shipped declarations: '+tag+'.'+name);
 for(const name of contract.properties)if(!props.has(name))throw Error('A reviewed native property is absent from the shipped declarations: '+tag+'.'+name);
 for(const name of contract.inheritedProperties)if(name!=='title'||props.has(name))throw Error('Only the reviewed inherited HTMLElement.title sink is admitted without an own setter.');
 for(const name of contract.slots)if(!slots.has(name))throw Error('A reviewed native slot is absent from the shipped declarations: '+tag+'.'+name);
 return validateNativeComponentMetadata({tag,module,sha256:crypto.createHash('sha256').update(entry).digest('hex'),ownership:'shadow',attributes:[...contract.attributes].sort(),properties:[...contract.properties,...contract.inheritedProperties].sort(),slots:[...contract.slots].sort()});
}
const components=Object.keys(reviewed).map(tag=>{const module=manifest[tag];if(typeof module!=='string')throw Error('A reviewed native tag is absent from the shipped manifest: '+tag);return capture(tag,'components/'+module.replace(/^\.\//,''));}).sort((a,b)=>a.tag.localeCompare(b.tag));
const output={schema:'xtend.rmtx.native-components.v1',source:'components/manifest.json',components},text=JSON.stringify(output,null,2)+'\n',target=path.join(root,'tools/rmt-language/rmtx-native-components.v1.json');
const declaration='// Generated from explicitly reviewed Source7 component capability subsets.\nexport type RmtxPublicComponentTag = '+components.map(row=>JSON.stringify(row.tag)).join(' | ')+';\n',declarationFile=path.join(root,'tools/rmt-language/rmtx-native-components.generated.d.ts');
const runtimeCatalog="// Generated from explicitly reviewed Source7 component capability subsets.\n'use strict';\nconst NATIVE_COMPONENT_CATALOG = "+JSON.stringify(components,null,2)+";\nmodule.exports = { NATIVE_COMPONENT_CATALOG };\n",runtimeCatalogFile=path.join(root,'tools/xtensions/native-component-catalog.js');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==text||fs.readFileSync(declarationFile,'utf8')!==declaration||fs.readFileSync(runtimeCatalogFile,'utf8')!==runtimeCatalog)throw Error('Shipped native component metadata drift.');}else{fs.writeFileSync(target,text);fs.writeFileSync(declarationFile,declaration);fs.writeFileSync(runtimeCatalogFile,runtimeCatalog);}
console.log(JSON.stringify({components:components.length,tags:components.map(x=>x.tag)}));

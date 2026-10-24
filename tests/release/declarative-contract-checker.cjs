'use strict';
// Test-only draft-07 subset. Production never imports this module. Every used
// keyword is explicitly checked; unsupported schema keywords fail closed.
const {isDeepStrictEqual:equal}=require('node:util');
const annotations=new Set(['$schema','$id','$comment','title','description']);
const keywords=new Set([...annotations,'definitions','$ref','type','const','enum','required','properties','additionalProperties','items','minItems','maxItems','uniqueItems','minimum','maximum','pattern','allOf','anyOf','oneOf','not','contains']);
function compile(root){
 const reference=ref=>{if(!ref.startsWith('#/definitions/'))throw Error('Unsupported reference '+ref);const found=root.definitions?.[ref.slice(14)];if(found===undefined)throw Error('Unresolved reference '+ref);return found;};
 function inspect(s){if(typeof s==='boolean')return;if(!s||Array.isArray(s)||typeof s!=='object')throw Error('Invalid schema');for(const k of Object.keys(s))if(!keywords.has(k))throw Error('Unsupported keyword '+k);
  if(s.$ref)reference(s.$ref);if(s.pattern)new RegExp(s.pattern,'u');
  for(const k of ['properties','definitions'])for(const child of Object.values(s[k]||{}))inspect(child);
  for(const k of ['items','additionalProperties','not','contains'])if(k in s)inspect(s[k]);
  for(const k of ['allOf','anyOf','oneOf'])for(const child of s[k]||[])inspect(child);
 }
 inspect(root);
 const type=(v,t)=>t==='null'?v===null:t==='array'?Array.isArray(v):t==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):t==='integer'?Number.isInteger(v):t==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===t;
 function errors(s,v,at='$'){
  if(s===true)return [];if(s===false)return [at+': forbidden'];let e=[];
  if(s.$ref)return errors(reference(s.$ref),v,at);
  if(s.type&&!(Array.isArray(s.type)?s.type:[s.type]).some(t=>type(v,t)))e.push(at+': type');
  if('const'in s&&!equal(v,s.const))e.push(at+': const');if(s.enum&&!s.enum.some(x=>equal(v,x)))e.push(at+': enum');
  if(typeof v==='string'&&s.pattern&&!new RegExp(s.pattern,'u').test(v))e.push(at+': pattern');
  if(typeof v==='number'){if(s.minimum!==undefined&&v<s.minimum)e.push(at+': minimum');if(s.maximum!==undefined&&v>s.maximum)e.push(at+': maximum');}
  if(Array.isArray(v)){if(s.minItems!==undefined&&v.length<s.minItems)e.push(at+': minItems');if(s.maxItems!==undefined&&v.length>s.maxItems)e.push(at+': maxItems');if(s.uniqueItems&&v.some((x,i)=>v.slice(0,i).some(y=>equal(x,y))))e.push(at+': uniqueItems');if(s.items)v.forEach((x,i)=>e.push(...errors(s.items,x,at+'['+i+']')));if(s.contains&&!v.some(x=>!errors(s.contains,x).length))e.push(at+': contains');}
  if(type(v,'object')){for(const k of s.required||[])if(!Object.hasOwn(v,k))e.push(at+'.'+k+': required');for(const [k,x] of Object.entries(v)){if(Object.hasOwn(s.properties||{},k))e.push(...errors(s.properties[k],x,at+'.'+k));else if(s.additionalProperties!==undefined)e.push(...errors(s.additionalProperties,x,at+'.'+k));}}
  for(const child of s.allOf||[])e.push(...errors(child,v,at));for(const keyword of ['anyOf','oneOf'])if(s[keyword]){const n=s[keyword].filter(child=>!errors(child,v).length).length;if(n===0||(keyword==='oneOf'&&n!==1))e.push(at+': '+keyword);}
  if(s.not&&!errors(s.not,v).length)e.push(at+': not');return e;
 }
 return {errors:value=>errors(root,value),phase:(name,value)=>errors(root.definitions[name],value)};
}
module.exports={compile};

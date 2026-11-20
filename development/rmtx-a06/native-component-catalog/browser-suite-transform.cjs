// SPDX-License-Identifier: Apache-2.0
'use strict';
const path=require('node:path');
// Only harness boundaries change. Original assertions and runtime bodies remain.
const additionalSuites=Object.freeze([
 {id:'platform',file:'tests/maraca/native-platform-managed.test.mjs',marker:'const {managedPlatformBinding}',recordKind:'maraca-plan'},
 {id:'services',file:'tests/components/native-platform-services.test.mjs',marker:'const originalDefine',recordKind:'none'}
]);
const names=['xrouter','xsidepanel','xsurfacemanager','xsurfaceportal','xsurfaceregion','xsurfacewindow'];
function capturePreloader(suite,{root,capture}){
 if(suite.id==='services')return `'use strict';const fs=require('node:fs');process.on('exit',()=>fs.writeFileSync(${JSON.stringify(capture)},'[]\\n'));`;
 if(suite.id!=='platform')return null;
 return `'use strict';const fs=require('node:fs'),crypto=require('node:crypto');const builder=${JSON.stringify(path.join(root,'xtend-maraca/index.js'))};const hostEnvironment={node:process.version,TZ:process.env.TZ||null,NODE_ENV:process.env.NODE_ENV||null,builderSha256:crypto.createHash('sha256').update(fs.readFileSync(builder)).digest('hex')};const maraca=require(${JSON.stringify(path.join(root,'xtend-maraca'))});const actual=maraca.createMaracaBuildPlan,rows=new Map();maraca.createMaracaBuildPlan=function(config,environment){const result=actual.apply(this,arguments),key=JSON.stringify([config,environment,hostEnvironment]);rows.set(key,{key,hostEnvironment,result});return result;};process.on('exit',()=>fs.writeFileSync(${JSON.stringify(capture)},JSON.stringify([...rows.values()],null,2)+'\\n'));`;
}
function planLookupModule(records){
 const environment=records[0]?.hostEnvironment;
 if(!environment||records.some(row=>JSON.stringify(row.hostEnvironment)!==JSON.stringify(environment)))throw new Error('Maraca records require one exact captured Node/TZ/NODE_ENV/builder environment');
 const lookup=Object.fromEntries(records.map(row=>[row.key,row.result]));
 return `export const capturedHostEnvironment=${JSON.stringify(environment)};const records=${JSON.stringify(lookup)};export function createMaracaBuildPlan(config,environment){const key=JSON.stringify([config,environment,capturedHostEnvironment]);if(!Object.prototype.hasOwnProperty.call(records,key))throw new Error('Uncaptured Maraca config/options/host-environment');return structuredClone(records[key]);}`;
}
function transformBrowserSuite(suite,{root,source}){
 if(!['platform','services'].includes(suite.id))return null;
 const start=source.indexOf(suite.marker);if(start<0)throw new Error('Missing reviewed browser boundary: '+suite.file);
 let body=source.slice(start),prelude='';
 const imports=`const platformDefinitionImports={${names.map(name=>`${JSON.stringify(name)}:()=>import(${JSON.stringify(path.join(root,'components',name+'.definition.js'))})`).join(',')}};\n`;
 if(suite.id==='platform'){
  // Retain every real platform/runtime ESM dependency; discard only node:test,
  // assert, module-loader and JSDOM setup above the reviewed boundary.
  prelude=source.split('\n').filter(line=>/^import /.test(line)&&!/["']node:/.test(line)).join('\n')+'\n';
  prelude+=`const {createMaracaBuildPlan}=require('native-browser-maraca');\nconst {createXtendFabric}=require('../../fabric/xtend-fabric');\nconst nativePort=require('../../tools/xtensions/native-managed-view-projection').NATIVE_MANAGED_VIEW_RUNTIME;\nconst {resolveManagedComponent}=require('../../tools/xtensions/native-component-managed');\n`;
  prelude+=imports+`const foreign=document.createElement('aside');foreign.id='foreign-root';foreign.textContent='untouched';document.body.append(foreign);\n`;
  body=body.replace('await import(`../../components/${files[index]}.definition.js`)','await platformDefinitionImports[files[index]]()');
  const rootDir=root.endsWith(path.sep)?root:root+path.sep;
  body=body.replace("const rootDir=new URL('../../',import.meta.url).pathname;",'const rootDir='+JSON.stringify(rootDir)+';');
  body=body.replaceAll('dom.window.close();','').replaceAll('dom.window.','window.');
  body=body.replace("assert.fail('forged native platform config was admitted')","assert.ok(false,'forged native platform config was admitted')");
 }else{
  prelude=imports+`for(const id of ['a','b']){const root=document.createElement('main');root.id=id;document.body.append(root);}\n`;
  body=body.replace('await import(`../../components/${name}.definition.js`)','await platformDefinitionImports[name]()');
 }
 if(/\b(?:jsdom|JSDOM|VirtualConsole|createRequire)\b|attachInternals\s*=|ResizeObserver\s*=|matchMedia\s*=/.test(prelude+body))throw new Error('A browser API replacement crossed the reviewed boundary');
 return prelude+body;
}
module.exports={additionalSuites,capturePreloader,planLookupModule,transformBrowserSuite};

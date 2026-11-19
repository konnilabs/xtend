// SPDX-License-Identifier: Apache-2.0
'use strict';
const catalog = require('./rmtx-native-components.v1.json');
const { validateNativeComponentMetadata } = require('../xtensions/native-component-contract');
const { freeze, clone, data } = require('../xtensions/state-binding-contract');
const RMTX_NATIVE_COMPONENTS_API_VERSION = '1.0.0';
const RMTX_NATIVE_COMPONENTS_SCHEMA = 'xtend.rmtx.native-components.v1';
const components = new Map(catalog.components.map(row => { const value=validateNativeComponentMetadata(row);return [value.tag,value]; }));
function getRmtxNativeComponent(tag) {
  if (!components.has(tag)) throw new TypeError('Source7 components require a shipped public Shadow DOM component tag.');
  return components.get(tag);
}
function validateRmtxNativeComponents(values) {
  data(values);
  if(!Array.isArray(values)||values.length>components.size)throw new TypeError('Native components require a bounded captured metadata array.');
  const tags=new Set();
  for(const input of values){const value=validateNativeComponentMetadata(input);const expected=getRmtxNativeComponent(value.tag);if(tags.has(value.tag)||['tag','module','sha256','ownership'].some(key=>value[key]!==expected[key])||['attributes','properties','slots'].some(key=>JSON.stringify([...value[key]].sort())!==JSON.stringify(expected[key])))throw new TypeError('Native component metadata differs from its shipped declaration.');tags.add(value.tag);}
  return freeze(clone(values));
}
function getRmtxNativeComponentCatalog(){return freeze(clone(catalog));}
function verifyNativeComponentSources(values, {rootDir} = {}) {
  const selected=validateRmtxNativeComponents(values);
  if(!selected.length)return selected;
  const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
  if(typeof rootDir!=='string'||!rootDir)throw new TypeError('Component capture requires an explicit local source root.');
  let libraryRoot=fs.realpathSync(rootDir);
  let localPackage;try{localPackage=JSON.parse(fs.readFileSync(path.join(libraryRoot,'package.json'),'utf8'));}catch{}
  if(localPackage?.name!=='@ccslabs/xtend'||!fs.existsSync(path.join(libraryRoot,'components/manifest.json'))) {
    const manifestPath=require.resolve('@ccslabs/xtend/components/manifest.json',{paths:[libraryRoot,__dirname]});
    libraryRoot=path.dirname(path.dirname(fs.realpathSync(manifestPath)));
  }
  const root=libraryRoot,manifest=JSON.parse(fs.readFileSync(path.join(root,'components/manifest.json'),'utf8'));
  for(const row of selected){
    if(manifest[row.tag]!== './'+row.module.slice('components/'.length))throw new TypeError('Captured component tag differs from the shipped component manifest.');
    const file=fs.realpathSync(path.join(root,row.module)),relative=path.relative(root,file);
    if(relative.startsWith('..')||path.isAbsolute(relative)||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==row.sha256)
      throw new TypeError('Captured public component module bytes differ from the shipped metadata.');
  }
  return selected;
}
module.exports={RMTX_NATIVE_COMPONENTS_API_VERSION,RMTX_NATIVE_COMPONENTS_SCHEMA,getRmtxNativeComponent,getRmtxNativeComponentCatalog,validateRmtxNativeComponents,verifyNativeComponentSources};

'use strict';
const path=require('node:path'),reference=require('./automatic-reference.cjs');
const API_VERSION='1.0.0';
async function createInput(outputDir){
 const input=structuredClone(await reference.createInput(outputDir)),manifest=input.xtensionComposition;
 manifest.schema='xtend.maraca.xtension-composition-manifest.v7';
 const source=['items',{repeat:0},'products',{repeat:1}],repeat=[{state:'catalog',path:['items'],key:['id']},{path:['products'],key:['id']}];
 input.xtensionBindings={schema:'xtend.xtensions.state-binding-artifact.v3',documentId:'scoped-component-products',bindings:input.xtensionBindings.bindings.map((entry,index)=>{
  const props=index===0?{images:{state:'catalog',path:[...source,'images'],type:'array',items:{type:'string'}},selectedImageId:{state:'catalog',path:[...source,'selectedImageId'],type:'string'}}:{productId:{state:'catalog',path:[...source,'slug'],type:'string'},sort:{state:'catalog',path:[...source,'reviewsSort'],type:'string'}};
  const event=index===0?'selectImage':'changeSort',field=index===0?'imageId':'sort',host=manifest.hosts.find(h=>h.declarationId===entry.binding.address.declarationId),keyFields={groupId:{index:0,type:'json'},productId:{index:1,type:'json'}};
  const command=index===0?'image.select':'reviews.sort';host.intents[event]={command,...(index?{payload:{sort:'order'}}:{}),keyFields};
  return {surface:entry.surface,repeat,presence:{state:'catalog',path:[...source,'enabled']},binding:{schema:'xtend.xtensions.state-binding.v2',address:{documentId:'scoped-component-products',declarationId:entry.binding.address.declarationId,keys:[]},props,intents:{[event]:{command,payloadSchema:entry.binding.intents[event].payloadSchema,fields:{[field]:{type:'string'}},keyFields}}}};
 })};
 return {...input,source:'development/rmtx-a06/scoped-products.rmt',lazy:'none'};
}
const {createDataSourceAdapter}=require('./scoped-model.cjs');
async function build(outputDir){return require('../../xtend-maraca').buildMaracaBundleAsync(await createInput(outputDir),{rootDir:path.resolve(__dirname,'../..')});}
module.exports={API_VERSION,createInput,build,createDataSourceAdapter};

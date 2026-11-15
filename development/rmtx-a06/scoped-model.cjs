'use strict';
function createDataSourceAdapter(){return{async fetch(endpoint,{payload,context}){
 const catalog=JSON.parse(JSON.stringify(context.stateRuntime.getState('catalog'))),product=catalog.items.find(g=>g.id===payload.groupId)?.products.find(p=>p.id===payload.productId);
 if(!product)throw Error('Addressed product is absent.');
 if(endpoint==='/catalog/image')product.selectedImageId=payload.imageId;else if(endpoint==='/catalog/sort')product.reviewsSort=payload.sort;else throw Error('Unknown scoped endpoint.');
 return{record:{catalog}};
}};}
module.exports={createDataSourceAdapter};

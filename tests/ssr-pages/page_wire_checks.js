'use strict';
const assert = require('node:assert/strict');
async function pageWireChecks({check,checkPhp,load,php}) {
 const {encodePageWire,decodePageWire,validatePageResponse}=await load('page-contract.mjs');
 const values={empty:{},array:[],literal:{r:0},unicode:'Straße 😀',nested:[null,false,0,'0'],products:Array.from({length:12},(_,id)=>({id,name:'Demo '+id,description:'Product detail '.repeat(100)}))};
 const page={schema:'xtend.page-response.v1',kind:'page',version:'1',contextKey:'guest',page:'Store',url:'/',props:{data:values},ssr:{resume:{snapshot:{state:values}},chunk:{modelSnapshot:values}}};
 await check('compact page references round-trip JSON and retain one shared data tree',()=>{
  const wire=JSON.parse(JSON.stringify(encodePageWire(page))),decoded=validatePageResponse(wire);
  assert.deepEqual(decoded,page);assert.equal(decoded.props.data,decoded.ssr.resume.snapshot.state);
  assert.equal(decoded.props.data,decoded.ssr.chunk.modelSnapshot);
  assert(JSON.stringify(wire).length<JSON.stringify(page).length/2);
  assert.equal(decodePageWire(page),page);
 });
 await check('page reference tables reject cycles, foreign references, unsafe keys and expansion bombs',()=>{
  for(const nodes of [[{next:{r:0}}],[{next:{r:8}}],[JSON.parse('{"__proto__":1}')],[{next:{r:0,extra:1}}]])assert.throws(()=>decodePageWire({schema:'xtend.page-wire.v1',root:{r:0},nodes}),/reference table/);
  const nodes=[{value:'large'}];for(let i=1;i<30;i++)nodes.push({left:{r:i-1},right:{r:i-1}});
  assert.throws(()=>decodePageWire({schema:'xtend.page-wire.v1',root:{r:nodes.length-1},nodes}),/reference table/);
  const cycle={};cycle.value=cycle;assert.throws(()=>encodePageWire(cycle),/reference table/);
 });
 await checkPhp('PHP reference transport preserves signed state values and object/array identity',()=>{
  const withEmptyKey=structuredClone(page);withEmptyKey.props.data['']='empty key';
  const wire=php({operation:'wire',page:withEmptyKey});const decoded=decodePageWire(wire);
  assert.equal(decoded.props.data[''],'empty key');delete decoded.props.data[''];
  assert.deepEqual(decoded,page);assert.equal(decoded.props.data,decoded.ssr.resume.snapshot.state);
  assert(JSON.stringify(wire).length<JSON.stringify(page).length/2);
 });
}
module.exports={pageWireChecks};

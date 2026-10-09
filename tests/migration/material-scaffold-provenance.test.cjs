'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createMaterialAppScaffold}=require('../../xtend-builder/generators/material-app');
function fixture(t){const rootDir=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-material-provenance-'));t.after(()=>fs.rmSync(rootDir,{recursive:true,force:true}));return rootDir;}
function scaffold(rootDir,mode){return createMaterialAppScaffold({rootDir,out:'products/bench',name:'bench',title:'Bench',server:'node',[mode]:true},{resolveAdapter:()=>true});}
test('generated public dependencies pin the CLI release and Material versions exactly',t=>{
 const root=fixture(t);assert.equal(scaffold(root,'write').ok,true);
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'products/bench/package.json')));
 const version=require('../../xtend-builder/package.json').version;
 for(const name of ['@ccslabs/xtend','@ccslabs/xtend-maraca'])assert.equal(pkg.dependencies[name],version);
 assert.equal(pkg.devDependencies['@ccslabs/xtend-compiler'],version);
 for(const name of ['@ccslabs/xtend-mcp','@ccslabs/xtend-fabric','@ccslabs/xtend-xsurface-shard','@ccslabs/xtend-rmt'])for(const section of ['dependencies','devDependencies'])assert.equal(pkg[section][name],undefined,`irrelevant dependency ${name}`);
 assert.equal(pkg.devDependencies['@ccslabs/xtend-cli'],version);
 for(const section of ['dependencies','devDependencies'])for(const [name,value] of Object.entries(pkg[section]))if(name.startsWith('@ccslabs/')||name.startsWith('@xtend-material/'))assert.match(value,/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
 assert.equal(scaffold(root,'check').status,'current');
});
test('managed package-version drift fails provenance checking',t=>{
 const root=fixture(t);assert.equal(scaffold(root,'write').ok,true);
 const file=path.join(root,'products/bench/package.json'),pkg=JSON.parse(fs.readFileSync(file));
 pkg.dependencies['@ccslabs/xtend']='0.8.0';fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
 const result=scaffold(root,'check');assert.equal(result.ok,false);
 assert.ok(result.errors.some(error=>error.includes('package.json')));
});
test('managed server drift fails and two clean regenerations preserve exact bytes',t=>{
 const first=fixture(t),second=fixture(t);assert.equal(scaffold(first,'write').ok,true);assert.equal(scaffold(second,'write').ok,true);
 const ownership=JSON.parse(fs.readFileSync(path.join(first,'products/bench/.xtend-build/scaffold-ownership.json')));
 for(const [file,record] of Object.entries(ownership.files))if(record.mode==='managed')assert.ok(fs.readFileSync(path.join(first,file)).equals(fs.readFileSync(path.join(second,file))),file);
 const server=path.join(first,'products/bench/server/index.mjs');fs.appendFileSync(server,'\n// unexpected managed server change\n');
 const result=scaffold(first,'check');assert.equal(result.ok,false);
 assert.ok(result.errors.some(error=>error.includes('server/index.mjs')));
});

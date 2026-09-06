'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function preparePackages(frameworkRoot=path.resolve(root,'../..')) {
  const framework=fs.realpathSync(frameworkRoot),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-store-pack-'));
  const output=path.join(root,'.packages');fs.mkdirSync(output,{recursive:true});
  try{
    const npm=process.platform==='win32'?'npm.cmd':'npm';
    const pack=directory=>{const result=JSON.parse(execFileSync(npm,['pack','--ignore-scripts','--json','--pack-destination',temporary],{cwd:directory,encoding:'utf8',maxBuffer:8*1024*1024}));const file=result[0]?.filename;if(!file)throw new Error('npm pack returned no archive.');fs.copyFileSync(path.join(temporary,file),path.join(output,file));return file;};
    const packages=[pack(framework),pack(path.join(framework,'xtend-material'))];
    const php=require(path.join(framework,'scripts/build_laravel_package.js')).buildLaravelPackage({rootDir:framework,output:path.join(temporary,'xtend-laravel')});
    for(const base of [root,path.join(root,'payment-provider')]){
      const target=path.join(base,'.packages/xtend-laravel');fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(path.dirname(target),{recursive:true});fs.cpSync(php.directory,target,{recursive:true});
    }
    return {ok:true,packages,phpFingerprint:php.sha256};
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}
if(require.main===module)console.log(JSON.stringify(preparePackages(process.argv[2]),null,2));
module.exports={preparePackages};

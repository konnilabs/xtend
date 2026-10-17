'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {digest,verifyCandidates}=require('../candidate-integrity.cjs');
const {buildLaravelPackage}=require('./build_laravel_package');
const {resolveNpmCli}=require('./release/toolchain.cjs');
const {PROFILE}=require('./release/profile.cjs');
const root=path.resolve(__dirname,'..');
function git(args,cwd=root){return execFileSync('git',args,{cwd,encoding:'utf8'}).trim();}
function packCandidates({output,profile,demoSha,development=false}={}) {
 const core=profile===PROFILE;
 if(!core&&profile!=='xtend.product.audit.v1')throw Error('Explicit private Core or legacy audit pack entry required');
 if(core&&demoSha!==undefined)throw Error('Core pack forbids Demo identity');
 const coreSha=git(['rev-parse','HEAD']);
 if(!development&&git(['status','--porcelain','--untracked-files=no']))throw Error('Core candidate must come from a clean commit');
 if(!core&&!/^[a-f0-9]{40}$/.test(demoSha||''))throw Error('Exact pinned Demo SHA required');
 if(fs.existsSync(output))throw Error('Candidate output must be fresh');fs.mkdirSync(output,{recursive:true});
 // Pack only tracked bytes of the asserted SHA, including in development mode.
 // npm's published globs must never import ignored/untracked worktree files.
 const snapshot=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-core-pack-'));
 try {
 const archive=execFileSync('git',['archive','--format=tar',coreSha],{cwd:root,maxBuffer:256*1024*1024});
 execFileSync('tar',['-xf','-','-C',snapshot],{input:archive,stdio:['pipe','pipe','pipe'],timeout:60000});
 const manifest=JSON.parse(fs.readFileSync(path.join(snapshot,'package.json')));
 const packages=[];
 for(const directory of ['.',...manifest.workspaces]) {
  const data=JSON.parse(execFileSync(process.execPath,[resolveNpmCli(),'pack','--ignore-scripts','--json','--pack-destination',output],{cwd:path.join(snapshot,directory),encoding:'utf8',maxBuffer:32*1024*1024}))[0];
  const sha256=digest(fs.readFileSync(path.join(output,data.filename)));
  const filename=data.filename.replace(/\.tgz$/,'.'+sha256.slice(0,16)+'.tgz');fs.renameSync(path.join(output,data.filename),path.join(output,filename));
  const pkg=JSON.parse(fs.readFileSync(path.join(snapshot,directory,'package.json')));
  const metadata=Object.fromEntries(['dependencies','optionalDependencies','peerDependencies','peerDependenciesMeta'].filter(key=>pkg[key]).map(key=>[key,pkg[key]]));
  packages.push({name:data.name,version:data.version,file:filename,integrity:data.integrity,sha256,...metadata});
 }
 // Generated PHP packaging metadata is derived solely from the same SHA archive;
 // buildLaravelPackage fingerprints every copied runtime source.
 const php=buildLaravelPackage({rootDir:snapshot,output:path.join(output,'xtend-laravel'),archiveTool:'tar'});
 const result={...(core?{schema:'xtend.product-candidates.v2',profile:PROFILE}:{schema:'xtend.product-candidates.v1',demoSha}),coreSha,development,packages,php:{file:path.basename(php.archive),sha256:php.sha256,sources:php.files}};
 verifyCandidates(result,core?{coreSha,profile:PROFILE,directory:output}:{coreSha,demoSha,directory:output});fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(result,null,2)+'\n');return result;
 } finally {fs.rmSync(snapshot,{recursive:true,force:true});}
}
module.exports={packCandidates};

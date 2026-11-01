'use strict';
// Historical v1 audit reference. Never imported by productive Core code.
// Frozen envelope/adapter/seal source runs against TODAY'S shared candidate,
// product, ownership, tarball, registry and Union validators. No globals patched.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),directory=path.join(__dirname,'legacy-source');
const binding=JSON.parse(fs.readFileSync(path.join(directory,'binding.json'))),cache=new Map();
function historicalSource(file){const row=binding.files.find(row=>row.path===file);if(!row)throw Error('Unknown frozen legacy source: '+file);const bytes=zlib.gunzipSync(fs.readFileSync(path.join(directory,row.file)));if(crypto.createHash('sha256').update(bytes).digest('hex')!==row.sha256)throw Error('Historical source byte mismatch');return bytes.toString('utf8');}
function source(file){
 let code=historicalSource(file);
 function replace(before,after){if(code.split(before).length!==2)throw Error('Historical audit integration anchor changed');code=code.replace(before,after);}
 // Explicit current shared-validator integrations for the legacy audit. These
 // strengthen its source pin and transfer raw attestation bytes; no payload is
 // relabeled and no Core pipeline gains a Demo dependency.
 if(file==='scripts/release/candidates.cjs'){
   const needle="  const pin = JSON.parse(fs.readFileSync(path.join(rootDir, 'product-demos.lock.json')));";
   replace(needle,needle+"\n  require('../../tools/schema-inventory/source-provider.cjs').verifyProductDemoPin(pin);");
 }
 if(file==='scripts/release/pipeline.cjs'){
   const needle="    const file = `lanes/${suffix}/product-candidate.json`;";
   replace(needle,"    const raw = JSON.parse(fs.readFileSync(path.join(source, 'product-candidate.json')));\n    productEvidence.copyActualAppFiles(raw.reports,{directory:candidateDir,destination:target,coreSha:sourceSha,demoSha:manifest.candidateBinding.demoSha,startedAt:manifest.preparedAt});\n"+needle);
 }
 return code;
}
function requireFrom(file){const absolute=path.join(root,file),real=Module.createRequire(absolute);return name=>{const target=name.startsWith('.')?path.relative(root,path.resolve(path.dirname(absolute),name)).split(path.sep).join('/'):null;return binding.files.some(row=>row.path===target)?load(target):real(name);};}
function load(file){if(cache.has(file))return cache.get(file).exports;const absolute=path.join(root,file),m=new Module(absolute,module);m.filename=absolute;m.paths=Module._nodeModulePaths(path.dirname(absolute));m.require=requireFrom(file);cache.set(file,m);m._compile(source(file),absolute);return m.exports;}
module.exports={load,source,historicalSource,requireFrom,binding};

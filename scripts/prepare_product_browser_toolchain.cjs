'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const {pin}=require('../tests/security/sandboxed-browser.cjs');
const {version,archives}=pin;
function verifyToolchainVersions(browser,driver,run=execFileSync) {
 const probe=file=>{
  try{return run(file,['--version'],{encoding:'utf8',timeout:10000,maxBuffer:32768}).trim();}
  catch(error){throw Error('Pinned tool identity probe failed'+(error.code==='ETIMEDOUT'?' (timeout)':''));}
 };
 // Probe each exact executable once. A timeout or wrong version stops setup;
 // it is never recorded as an absent optional browser or retried until green.
 if(probe(browser)!=='Google Chrome for Testing '+version)throw Error('Pinned browser version mismatch');
 const actual=probe(driver),prefix='ChromeDriver '+version;
 if(actual!==prefix&&!(actual.startsWith(prefix+' (')&&actual.endsWith(')')&&!/[\r\n]/.test(actual)))throw Error('Pinned driver version mismatch');
 return {version,browser,driver,archives};
}
function prepareToolchain(output) {
 output=path.resolve(output);if(/[\r\n]/.test(output))throw Error('Invalid toolchain directory');
 fs.mkdirSync(output,{recursive:true});
for(const [file,expected] of Object.entries(archives)) {
 const archive=path.join(output,file);execFileSync('curl',['--fail','--location','--silent','--show-error','https://storage.googleapis.com/chrome-for-testing-public/'+version+'/linux64/'+file,'--output',archive],{stdio:'inherit'});
 if(createHash('sha256').update(fs.readFileSync(archive)).digest('hex')!==expected)throw Error('Official pinned browser archive checksum mismatch: '+file);
 execFileSync('unzip',['-q','-o',archive,'-d',output]);
}
const browser=path.join(output,'chrome-linux64/chrome'),driver=path.join(output,'chromedriver-linux64/chromedriver');
const identity=verifyToolchainVersions(browser,driver);
if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,`XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY=${browser}\nXTEND_BROWSER_HYPERVISOR_DRIVER_PATH=${driver}\nCHROMIUM_PATH=${browser}\nXTEND_SECURITY_BROWSER_ARCHIVE=${path.join(output,'chrome-linux64.zip')}\n`);
return identity;
}
module.exports={verifyToolchainVersions,prepareToolchain};
if(require.main===module)console.log(JSON.stringify(prepareToolchain(process.argv[2]||'.browser-toolchain')));

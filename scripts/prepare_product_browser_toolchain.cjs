'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const {pin}=require('../tests/security/sandboxed-browser.cjs');
const {version,archives}=pin;
const output=path.resolve(process.argv[2]||'.browser-toolchain');fs.mkdirSync(output,{recursive:true});
for(const [file,expected] of Object.entries(archives)) {
 const archive=path.join(output,file);execFileSync('curl',['--fail','--location','--silent','--show-error','https://storage.googleapis.com/chrome-for-testing-public/'+version+'/linux64/'+file,'--output',archive],{stdio:'inherit'});
 if(createHash('sha256').update(fs.readFileSync(archive)).digest('hex')!==expected)throw Error('Official pinned browser archive checksum mismatch: '+file);
 execFileSync('unzip',['-q','-o',archive,'-d',output]);
}
const browser=path.join(output,'chrome-linux64/chrome'),driver=path.join(output,'chromedriver-linux64/chromedriver');
for(const executable of [browser,driver])execFileSync(executable,['--version'],{stdio:'inherit'});
if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,`XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY=${browser}\nXTEND_BROWSER_HYPERVISOR_DRIVER_PATH=${driver}\nCHROMIUM_PATH=${browser}\nXTEND_SECURITY_BROWSER_ARCHIVE=${path.join(output,'chrome-linux64.zip')}\n`);
console.log(JSON.stringify({version,browser,driver,archives}));

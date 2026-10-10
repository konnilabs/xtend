'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const version='151.0.7922.173';
const archives={'chrome-linux64.zip':'01d5eca46f9f055fb7d14b9be3dd458344edd57666960d85310d9b474fc77b84','chromedriver-linux64.zip':'e1aa107cfad6d4fc5963551863b9cdc069c2b881d8409823b44f3ef08563ee35'};
const output=path.resolve(process.argv[2]||'.browser-toolchain');fs.mkdirSync(output,{recursive:true});
for(const [file,expected] of Object.entries(archives)) {
 const archive=path.join(output,file);execFileSync('curl',['--fail','--location','--silent','--show-error','https://storage.googleapis.com/chrome-for-testing-public/'+version+'/linux64/'+file,'--output',archive],{stdio:'inherit'});
 if(createHash('sha256').update(fs.readFileSync(archive)).digest('hex')!==expected)throw Error('Official pinned browser archive checksum mismatch: '+file);
 execFileSync('unzip',['-q','-o',archive,'-d',output]);
}
const browser=path.join(output,'chrome-linux64/chrome'),driver=path.join(output,'chromedriver-linux64/chromedriver');
for(const executable of [browser,driver])execFileSync(executable,['--version'],{stdio:'inherit'});
if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,`XTEND_BROWSER_HYPERVISOR_BROWSER_BINARY=${browser}\nXTEND_BROWSER_HYPERVISOR_DRIVER_PATH=${driver}\nCHROMIUM_PATH=${browser}\n`);
console.log(JSON.stringify({version,browser,driver,archives}));

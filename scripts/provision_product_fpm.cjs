'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
function discoverFpm({expectedMinor,execute=execFileSync,exists=fs.existsSync,resolve=fs.realpathSync,searchPath=process.env.PATH||''}={}) {
 if(!/^8\.[2-5]$/.test(expectedMinor||''))throw Error('Expected explicit PHP minor for required FPM');
 const candidates=[`/usr/sbin/php-fpm${expectedMinor}`,'/usr/sbin/php-fpm',...searchPath.split(path.delimiter).filter(Boolean).flatMap(dir=>[path.join(dir,`php-fpm${expectedMinor}`),path.join(dir,'php-fpm')])];
 const observed=[];
 for(const candidate of [...new Set(candidates)]) {
  if(!exists(candidate))continue;
  try {
   const binary=resolve(candidate),version=execute(binary,['-v'],{encoding:'utf8',timeout:30000}).split('\n')[0];
   observed.push({candidate,binary,version});
   const match=version.match(/^PHP (\d+\.\d+)\.\d+.*\(fpm-fcgi\)/);
   if(match?.[1]===expectedMinor)return {binary,version,observed};
  }catch(error){observed.push({candidate,error:error.code||error.message});}
 }
 throw Error('Required installed PHP-FPM '+expectedMinor+' unavailable or mismatched; observed='+JSON.stringify(observed));
}
if(require.main===module)try {
 const expectedMinor=process.argv[2],php=execFileSync('php',['-r','echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;'],{encoding:'utf8',timeout:30000});
 if(php!==expectedMinor)throw Error('Provisioned PHP CLI minor mismatch: '+php+' expected '+expectedMinor);
 const result=discoverFpm({expectedMinor});
 if(!process.env.GITHUB_ENV)throw Error('GITHUB_ENV required to bind actual installed FPM');
 if(/[\r\n]/.test(result.binary))throw Error('Invalid FPM executable path');
 fs.appendFileSync(process.env.GITHUB_ENV,'XTEND_SHOP_FPM_BINARY='+result.binary+'\n');
 console.log(JSON.stringify({php,...result}));
}catch(error){console.error(error.message);process.exitCode=1;}
module.exports={discoverFpm};

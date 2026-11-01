'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {discoverFpm}=require('../../scripts/provision_product_fpm.cjs');
function options(files){return {expectedMinor:'8.4',searchPath:'/tools',exists:name=>Object.hasOwn(files,name),resolve:name=>name,execute:name=>files[name]};}
test('existing setup-php FPM is used without assuming an available apt repository',()=>{
 const result=discoverFpm(options({'/usr/sbin/php-fpm8.4':'PHP 8.4.24 (fpm-fcgi) (built: date)\n'}));assert.equal(result.binary,'/usr/sbin/php-fpm8.4');
 const alternative=discoverFpm(options({'/usr/sbin/php-fpm':'PHP 8.3.1 (fpm-fcgi)\n','/tools/php-fpm':'PHP 8.4.24 (fpm-fcgi)\n'}));assert.equal(alternative.binary,'/tools/php-fpm');assert.equal(alternative.observed.length,2);
});
test('missing, wrong-minor and PHP CLI binaries never satisfy mandatory FPM',()=>{
 for(const files of [{},{'/usr/sbin/php-fpm8.4':'PHP 8.3.24 (fpm-fcgi)\n'},{'/usr/sbin/php-fpm8.4':'PHP 8.4.24 (cli)\n'}])assert.throws(()=>discoverFpm(options(files)),/unavailable or mismatched/);
});

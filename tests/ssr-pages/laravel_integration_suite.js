'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {createSuiteContext}=require('../utils/assertions');
function runLaravelIntegrationSuite(options={}) {
  const fixture=options.fixture || process.env.XTEND_LARAVEL_FIXTURE;
  const context=createSuiteContext({id:'ssr-pages-laravel',label:'Isolated Composer Laravel package integration'});
  if(!fixture || !fs.existsSync(path.join(fixture,'vendor/autoload.php'))){context.fail('XTEND_LARAVEL_FIXTURE must name an isolated Composer installation.');return context.result();}
  const result=spawnSync(process.env.XTEND_PHP_BINARY || 'php',['vendor/bin/phpunit','--bootstrap','vendor/autoload.php','--colors=never','LaravelIntegrationTest.php'],{cwd:fixture,encoding:'utf8',timeout:120000});
  if(result.error || result.status!==0)context.fail(result.error?.message || result.stdout+'\n'+result.stderr);
  else context.pass(result.stdout.trim());
  return context.result();
}
module.exports={runLaravelIntegrationSuite};

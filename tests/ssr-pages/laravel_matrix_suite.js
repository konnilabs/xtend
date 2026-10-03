'use strict';
const path=require('node:path');
const {createSuiteContext}=require('../utils/assertions');
const {runLaravelIntegrationSuite}=require('./laravel_integration_suite');
const {runLaravelPageBrowserSuite}=require('./laravel_browser_suite');

async function runLaravelMatrixSuite(options={}) {
  const rootDir=options.rootDir || path.resolve(__dirname,'../..');
  const browser=Boolean(options.browser);
  const context=createSuiteContext({id:browser?'ssr-pages-laravel-browser-matrix':'ssr-pages-laravel-matrix',label:'Laravel 12/13 contract matrix'});
  for(const version of ['12','13']) {
    const fixture=process.env[`XTEND_LARAVEL_FIXTURE_${version}`] || path.join(rootDir,'.xtend-test-results/laravel-fixtures',version);
    try {
      const result=await (browser?runLaravelPageBrowserSuite:runLaravelIntegrationSuite)({...options,rootDir,fixture});
      for(const item of result.passes || [])context.pass(`Laravel ${version}: ${item}`);
      for(const item of result.failures || [])context.fail(`Laravel ${version}: ${item}`);
      for(const item of result.skips || [])context.skip(`Laravel ${version}: ${item}`);
      if(!result.ok && !result.failures?.length)context.fail(`Laravel ${version}: unsuccessful suite`);
    } catch(error) {context.fail(`Laravel ${version}: ${error.stack || error}`);}
  }
  return context.result();
}
module.exports={runLaravelMatrixSuite};

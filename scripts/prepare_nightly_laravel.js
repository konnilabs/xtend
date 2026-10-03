'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {prepareLaravelFixture}=require('../tests/ssr-pages/prepare_laravel_fixture');
const {writeJsonReport}=require('../tests/utils/reporting');

function prepareNightlyLaravel(rootDir=path.resolve(__dirname,'..')) {
  const fixtures=[];
  for(const version of ['12','13']) {
    const output=path.join(rootDir,'.xtend-test-results/laravel-fixtures',version);
    // Only this preparer's isolated, ignored output is replaced.
    fs.rmSync(output,{recursive:true,force:true});
    const fixture=prepareLaravelFixture({rootDir,output,version});
    execFileSync(process.env.XTEND_COMPOSER_BINARY || 'composer',['install','--no-interaction','--no-progress','--prefer-dist','--no-scripts'],{cwd:output,stdio:'inherit',timeout:240000});
    execFileSync(process.env.XTEND_COMPOSER_BINARY || 'composer',['check-platform-reqs'],{cwd:output,stdio:'inherit',timeout:30000});
    fixtures.push(fixture);
  }
  const report={schema:'xtend.ci.laravel-fixtures.v1',ok:true,fixtures};
  writeJsonReport(report,'.xtend-test-results/nightly/laravel-fixtures.json',rootDir);
  return report;
}
if(require.main===module)console.log(JSON.stringify(prepareNightlyLaravel()));
module.exports={prepareNightlyLaravel};

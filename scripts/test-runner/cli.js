'use strict';
const { catalog, select, profileIds, canonicalSuite, fingerprint } = require('./catalog');
function parseArgs(args) {
  const options = { suiteIds: [], jobs: 1 };
  const valued = new Map([['--profile','profile'],['--report','report'],['--execution','execution'],['--jobs','jobs'],['--verify','verify'],['--from','from']]);
  for (let i=0;i<args.length;i++) {
    const [key, ...tail] = args[i].split('=');
    if (valued.has(key)) {
      const value = tail.length ? tail.join('=') : args[++i];
      if (!value || !value.trim() || value.startsWith('--')) throw new Error(`Missing value for ${key}.`);
      if (Object.hasOwn(options, valued.get(key)) && key !== '--jobs') throw new Error(`Repeated option: ${key}`);
      options[valued.get(key)] = value;
    } else if (['--json','--plan','--list','--help','-h'].includes(key) && !tail.length) options[key === '-h' ? 'help' : key.slice(2)] = true;
    else if (key.startsWith('-')) throw new Error(`Unknown XTend test runner option: ${args[i]}`);
    else options.suiteIds.push(args[i]);
  }
  options.jobs = Number(options.jobs);
  if (!Number.isInteger(options.jobs) || options.jobs < 1 || options.jobs > 2) throw new Error('--jobs must be 1 or 2.');
  if (Boolean(options.from) !== Boolean(options.verify)) throw new Error('--verify and --from must be used together.');
  if (options.verify && (options.profile || options.suiteIds.length || options.plan)) throw new Error('Verification cannot be combined with execution selection.');
  return options;
}
async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) {
    console.log('XTend Test Runner\n\nUsage: node scripts/run_xtend_tests.js [suite...] [options]\n\n--profile <name>  Resolve a catalog profile\n--plan --json     Print selection without loading suites\n--jobs <1|2>     Worker limit (default 1; resource locks apply)\n--report <path>  Compatible JSON report\n--execution <path>  Execution provenance and partial results\n--verify <profile> --from <path>  Verify and project an existing execution\n--json           JSON output\n--list           List suite IDs\n--help           Show this help\n\nExample: node scripts/run_xtend_tests.js --profile pr --json');
    return;
  }
  if (options.list) { console.log(catalog.suites.map(s=>`${s.id}\t${s.label}\t${s.description}`).join('\n')); return; }
  if (options.verify) {
    profileIds(options.verify);
    const result = require('./executor').verifyExecution(options);
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== 'passed') process.exitCode = 1;
    return;
  }
  const selected = select(options);
  if (options.plan) {
    console.log(JSON.stringify({ schema: 'xtend.test.execution-plan.v1', profile: options.profile || null, catalogFingerprint: fingerprint(), jobs: options.jobs,
      suites: selected.map(s=>({ ...s, executionId: canonicalSuite(s.id).id })), additionalChecks: catalog.ci[options.profile]?.additionalChecks || [],
      executionCount: new Set(selected.map(s=>canonicalSuite(s.id).id)).size }, null, 2));
    return;
  }
  const { summary, status } = await require('./executor').execute(selected, options);
  if (options.json) console.log(JSON.stringify(summary, null, 2));
  else require('../../tests/utils/reporting').printTextSummary(summary);
  if (status !== 'passed') process.exitCode = 1;
}
module.exports = { main, parseArgs };

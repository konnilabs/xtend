const {
  printPriorityComponentReport,
  runPriorityComponentSuite
} = require('./priority_component_contracts');

function runXRouterComponentSuite(options = {}) {
  const result = runPriorityComponentSuite('x-router', options);
  const routing = require('./xrouter_path_consumption_checks').runXRouterPathConsumptionChecks({
    rootDir: options.rootDir || require('path').resolve(__dirname, '../..')
  });
  result.passes.push(...routing.passes);
  result.failures.push(...routing.failures);
  result.ok = result.ok && routing.ok;
  return result;
}

function printXRouterComponentReport(result) {
  printPriorityComponentReport(result);
}

if (require.main === module) {
  const result = runXRouterComponentSuite();
  printXRouterComponentReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printXRouterComponentReport,
  runXRouterComponentSuite
};

#!/usr/bin/env node

const path = require('path');
const {
  printCoreContractReport,
  runCoreContractSuite
} = require('../tests/core/core_contract_suite');

const rootDir = path.resolve(__dirname, '..');

function main() {
  const result = runCoreContractSuite({ rootDir });
  printCoreContractReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

main();

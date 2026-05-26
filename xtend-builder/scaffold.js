#!/usr/bin/env node

const { runCli, runCliAsync } = require('./lib/cli');

if (require.main === module) {
  runCliAsync(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
  });
}

module.exports = {
  runCli,
  runCliAsync
};

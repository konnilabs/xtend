#!/usr/bin/env node

const { runCli } = require('./lib/cli');

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}

module.exports = {
  runCli
};

#!/usr/bin/env node

const { runCliAsync, runMain } = require('./xt');

if (require.main === module) {
  runMain(process.argv.slice(2));
}

module.exports = {
  runMain,
  runCliAsync
};

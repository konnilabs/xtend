#!/usr/bin/env node
'use strict';

require('./test-runner/cli').main().catch(error => {
  console.error(error && error.stack || String(error));
  process.exitCode = 1;
});

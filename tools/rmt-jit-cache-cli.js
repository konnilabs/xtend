#!/usr/bin/env node
'use strict';
const { prepareRmtJitKernelCache } = require('./rmt-jit-kernel-cache');
prepareRmtJitKernelCache({ rootDir: process.cwd() }).then(result => {
  if (result.cacheStatus === 'unavailable') process.exitCode = 1;
  console.log(JSON.stringify({ ok: result.cacheStatus !== 'unavailable', key: result.key, cacheStatus: result.cacheStatus, architectureChecks: result.architectureChecks, diagnostics: result.diagnostics }));
}).catch(error => { console.error(JSON.stringify({ ok: false, code: error.code, message: error.message })); process.exitCode = 1; });

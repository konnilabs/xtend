'use strict';
const { normalizeSuiteResult } = require('../../tests/utils/reporting');
process.on('message', async message => {
  if (!message || message.type !== 'run') return;
  const { id } = message;
  let result;
  const priorExitCode = process.exitCode;
  process.exitCode = undefined;
  try {
    const handler = require('./handlers')[id];
    if (typeof handler !== 'function') throw new Error(`Missing suite handler: ${id}`);
    result = normalizeSuiteResult(await handler());
    if (process.exitCode) result = normalizeSuiteResult({ ...result, status: 'failed', exitCode: process.exitCode, failures: [...result.failures, `Suite set process.exitCode=${process.exitCode}`] });
  } catch (error) {
    result = normalizeSuiteResult({ id, status: 'failed', exitCode: 1, failures: [error && error.stack || String(error)] });
  } finally {
    process.exitCode = priorExitCode;
  }
  if (process.connected) process.send({ type: 'result', id, result, usage: { rssBytes: process.memoryUsage().rss, maxRssBytes: process.resourceUsage().maxRSS * 1024 } });
});
process.on('disconnect', () => process.exit(0));

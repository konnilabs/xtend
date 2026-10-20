'use strict';
// Internal diagnostics only. A blocked preflight never supplies security proof.
class InfrastructureBlocked extends Error {}
function startupFailure({stderr, exitCode, signalCode}) {
  const message = String(stderr || 'Chromium did not expose a DevTools endpoint').slice(-65536);
  // Classify only an observed failed launch. Timeouts, assertions, unsafe
  // configuration and later browser failures must not become infrastructure.
  return ((Number.isInteger(exitCode) && exitCode !== 0) || typeof signalCode === 'string') && /No usable sandbox!/.test(message)
    ? new InfrastructureBlocked(message) : new Error(message);
}
function outcome(phases) {
  if (phases.cleanup.status === 'failed' || phases.preflight.status === 'failed' || phases.product.status === 'failed') return 'failed';
  if (phases.preflight.status === 'infrastructure-blocked' && phases.product.status === 'not-run' && phases.cleanup.status === 'passed') return 'infrastructure-blocked';
  if ([phases.preflight, phases.product, phases.cleanup].every(row => row.status === 'passed')) return 'passed';
  return 'not-provided';
}
async function runBrowserGate({preflight, product, cleanup}) {
  const phases = {preflight:{status:'not-run'}, product:{status:'not-run'}, cleanup:{status:'not-run'}};
  let session;
  try {
    try {
      session = await preflight();
      phases.preflight = {status:'passed'};
    } catch (error) {
      phases.preflight = {status:error instanceof InfrastructureBlocked ? 'infrastructure-blocked' : 'failed', reason:error.message};
    }
    if (phases.preflight.status === 'passed') {
      try { await product(session); phases.product = {status:'passed'}; }
      catch (error) { phases.product = {status:'failed', reason:error.message}; }
    }
  } finally {
    try { await cleanup(session); phases.cleanup = {status:'passed'}; }
    catch (error) {
      phases.cleanup = {status:'failed', reason:error.message};
      if (error.cleanup) phases.cleanup.details = error.cleanup;
    }
  }
  return {...phases, status:outcome(phases)};
}
function requirePassedGate(gate) {
  if (!gate || gate.status !== 'passed' || outcome(gate) !== 'passed') {
    throw Error('Browser preflight, product assertions and cleanup evidence must all pass');
  }
}
if (require.main === module) {
  const fs = require('node:fs'), [mode, file] = process.argv.slice(2);
  if (!['--gate', '--execution'].includes(mode) || !file || process.argv.length !== 4) throw Error('Expected --gate|--execution FILE');
  let gate, supervisor;
  if (fs.existsSync(file)) {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (mode === '--gate') gate = value;
    else {
      const report = value.results?.find(row => row.id === 'core-security-browser')?.result?.report;
      gate = report?.browserGate;
      supervisor = report?.cleanupError || report?.cleanup?.complete !== true ? 'failed or not-provided' : 'passed';
    }
  }
  const lines = ['## Chromium preflight and product evidence', '',
    ...['preflight', 'product', 'cleanup'].map(name => `- ${name}: ${gate?.[name]?.status || 'not-provided'}`),
    ...(supervisor ? ['- outer process-group cleanup: ' + supervisor] : []),
    '', 'Infrastructure-blocked or missing coverage is not a security pass. Release proof remains separately required.', ''];
  const text = lines.join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  // A successful summary step cannot turn a blocked/missing test into green.
  process.exitCode = gate && outcome(gate) === 'passed' && gate.status === 'passed' &&
    (mode === '--gate' || supervisor === 'passed') ? 0 : 1;
}
module.exports = {InfrastructureBlocked, startupFailure, runBrowserGate, outcome, requirePassedGate};

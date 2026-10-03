'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { rootDir } = require('./catalog');
const { provenance } = require('./executor');
const { writeJsonReport } = require('../../tests/utils/reporting');
const { SESSION_PATH, contract, inspectArtifact, safePath } = require('./nightly-evidence');

function currentIdentity(session, supplied) {
  if (supplied) return supplied;
  if (!process.env.GITHUB_RUN_ID && session?.identity?.run) process.env.XTEND_TEST_RUN_ID = session.identity.run;
  return provenance();
}
function begin(options = {}) {
  const root = options.rootDir || rootDir;
  if (!process.env.GITHUB_RUN_ID && !process.env.XTEND_TEST_RUN_ID) process.env.XTEND_TEST_RUN_ID = `nightly:${randomUUID()}`;
  const session = { schema: 'xtend.ci.nightly-session.v1', identity: currentIdentity(null, options.provenance),
    startedAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + (options.budgetMs || 32 * 60000)).toISOString(), phases: {} };
  writeJsonReport(session, SESSION_PATH, root);
  return session;
}

// Every command has its own process group. Termination first allows nested test
// supervisors to clean up their workers; the remaining owned group is then killed.
async function runCommand(spec, options) {
  const started = Date.now(), errors = [];
  fs.mkdirSync(path.dirname(options.logPath), { recursive: true });
  const log = fs.openSync(options.logPath, 'w');
  let output;
  if (spec.output) {
    const file = safePath(options.rootDir, spec.output);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    output = fs.openSync(file, 'w');
  }
  let child, timer, exitCode = null, signal = null, abortCause = null;
  const cleanupMs = options.cleanupMs ?? 5000;
  let terminationAt, completeWait;
  const terminate = reason => {
    abortCause ||= reason;
    terminationAt ||= Date.now();
    try { child?.kill('SIGTERM'); } catch (error) { errors.push(error.message); }
    forced ||= setTimeout(() => completeWait?.(), cleanupMs);
  };
  const interrupted = () => terminate('cancelled');
  process.once('SIGTERM', interrupted); process.once('SIGINT', interrupted);
  let forced;
  try {
    const command = spec.command === 'node' ? process.execPath : spec.command;
    const invocation = process.platform === 'win32' && command === 'npm'
      ? { command: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', 'npm', ...spec.args] }
      : { command, args: spec.args };
    await new Promise(resolve => {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      completeWait = finish;
      child = spawn(invocation.command, invocation.args, { cwd: options.rootDir, env: process.env,
        detached: process.platform !== 'win32', stdio: ['ignore', output ?? log, log], windowsHide: true });
      child.once('error', error => { errors.push(error.message); abortCause = 'spawn-error'; finish(); });
      child.once('exit', (code, reason) => { exitCode = code; signal = reason; finish(); });
      timer = setTimeout(() => terminate('timeout'), Math.max(1, options.timeoutMs));
    });
  } finally {
    clearTimeout(timer); clearTimeout(forced);
    process.off('SIGTERM', interrupted); process.off('SIGINT', interrupted);
    if (child?.pid) {
      if (process.platform === 'win32') {
        if (child.exitCode === null && child.signalCode === null) {
          const stopped = spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { timeout: cleanupMs, stdio: 'ignore' });
          if (stopped.error || stopped.status !== 0) errors.push('Owned command tree cleanup failed');
        }
      } else {
        const stop = sig => { try { process.kill(-child.pid, sig); return true; } catch (error) { if (error.code !== 'ESRCH') errors.push(error.message); return false; } };
        if (stop('SIGTERM')) {
          const deadline = (terminationAt || Date.now()) + cleanupMs;
          while (Date.now() < deadline && stop(0)) await new Promise(resolve => setTimeout(resolve, 25));
          stop('SIGKILL');
        }
      }
    }
    fs.closeSync(log); if (output !== undefined) fs.closeSync(output);
  }
  if (abortCause || exitCode !== 0) errors.push(`${spec.command} ${spec.args.join(' ')}: ${abortCause || signal || `exit ${exitCode}`}`);
  return { command: spec.command, args: spec.args, startedAt: new Date(started).toISOString(), completedAt: new Date().toISOString(),
    durationMs: Date.now() - started, exitCode, signal, abortCause, errors, log: path.relative(options.rootDir, options.logPath).split(path.sep).join('/') };
}

async function runPhase(id, options = {}) {
  const root = options.rootDir || rootDir, definition = options.contract || contract(), spec = definition.phases[id];
  if (!spec) throw new Error(`Unknown nightly phase: ${id}`);
  const session = JSON.parse(fs.readFileSync(path.join(root, SESSION_PATH), 'utf8'));
  if (session.schema !== 'xtend.ci.nightly-session.v1') throw new Error('Invalid nightly session');
  const identity = currentIdentity(session, options.provenance);
  if (JSON.stringify(identity) !== JSON.stringify(session.identity)) throw new Error('Nightly input or runtime changed after initialization');
  if (session.phases[id]) throw new Error(`Nightly phase already attempted: ${id}; start a fresh session to retry`);
  const phase = { startedAt: new Date().toISOString(), completedAt: null, status: 'running', errors: [], commands: [], artifacts: [] };
  session.phases[id] = phase;
  writeJsonReport(session, SESSION_PATH, root);
  const artifacts = definition.artifacts.filter(a => a.producer === id);
  try {
    const blocked = (spec.dependsOn || []).filter(dep => session.phases[dep]?.status !== 'passed');
    if (blocked.length) throw new Error(`Blocked by unsuccessful prerequisite: ${blocked.join(', ')}`);
    const deadline = Math.min(Date.parse(session.deadlineAt), Date.now() + spec.timeoutMs);
    if (!Number.isFinite(deadline) || deadline <= Date.now()) throw new Error('Nightly execution budget exhausted');
    for (const artifact of artifacts) fs.rmSync(safePath(root, artifact.path), { force: true });
    for (const [index, command] of spec.commands.entries()) {
      if (Date.now() >= deadline) throw new Error('Phase execution budget exhausted');
      const result = await runCommand(command, { rootDir: root, timeoutMs: deadline - Date.now(), cleanupMs: options.cleanupMs,
        logPath: path.join(root, '.xtend-test-results/nightly/logs', `${id}-${index + 1}.log`) });
      phase.commands.push(result);
      phase.errors.push(...result.errors);
      writeJsonReport(session, SESSION_PATH, root);
      if (result.errors.length) break;
    }
  } catch (error) { phase.errors.push(error.message); }
  phase.artifacts = artifacts.map(artifact => inspectArtifact(artifact, { rootDir: root, startedAt: phase.startedAt }));
  phase.errors.push(...phase.artifacts.filter(a => !a.valid).map(a => `${a.path}: ${a.errors.join('; ')}`));
  phase.completedAt = new Date().toISOString();
  phase.durationMs = Date.parse(phase.completedAt) - Date.parse(phase.startedAt);
  phase.status = phase.errors.length ? 'failed' : 'passed';
  writeJsonReport(session, SESSION_PATH, root);
  return phase;
}

async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === 'begin') { begin(); console.log('Nightly session initialized (32 minute execution budget).'); return; }
  if (args.length !== 2 || args[0] !== 'phase') throw new Error('Usage: node scripts/test-runner/nightly.js begin | phase <id>');
  const result = await runPhase(args[1]);
  console.log(`${args[1]}: ${result.status} (${result.durationMs} ms)`);
  for (const error of result.errors) console.error(error);
  if (result.status !== 'passed') process.exitCode = 1;
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { begin, runPhase, runCommand, currentIdentity };

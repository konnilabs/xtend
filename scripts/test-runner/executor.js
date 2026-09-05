'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fork, spawnSync, execFileSync } = require('child_process');
const { randomUUID } = require('crypto');
const { catalog, rootDir, hash, fingerprint, canonicalSuite, profileIds, profileGroups } = require('./catalog');
const { normalizeSuiteResult, createRunSummary, writeJsonReport } = require('../../tests/utils/reporting');
const SCHEMA = 'xtend.test.execution-report.v1';
const CLEANUP_MS = 5000;
const DEFAULT_REPORT = '.xtend-test-results/xtend-test-execution.json';

function provenance() {
  const git = args => execFileSync('git', args, { cwd: rootDir, maxBuffer: 256 * 1024 * 1024 });
  const commit = git(['rev-parse', 'HEAD']).toString().trim();
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).toString().split('\0').filter(Boolean).sort();
  const sourceFingerprint = hash(Buffer.concat([git(['diff', 'HEAD', '--binary']), Buffer.from(untracked.map(file => `${file}\0${hash(fs.readFileSync(path.join(rootDir, file)))}`).join('\n'))]));
  return {
    commit, sourceFingerprint, catalogFingerprint: fingerprint(),
    run: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_RUN_ATTEMPT || '1'}` : process.env.XTEND_TEST_RUN_ID || `local:${randomUUID()}`,
    runtime: {
      node: process.version, platform: process.platform, arch: process.arch, nodeOptions: process.env.NODE_OPTIONS || '',
      runnerImage: `${process.env.ImageOS || ''}:${process.env.ImageVersion || ''}`,
      environmentFingerprint: hash(JSON.stringify(Object.keys(process.env).filter(key=>key.startsWith('XTEND_') && key !== 'XTEND_TEST_RUN_ID').sort().map(key=>[key,process.env[key]])))
    }
  };
}

function failure(id, message) { return normalizeSuiteResult({ id, status: 'failed', failures: [{ message }] }); }
function summaryFor(report, ids) {
  const entries = ids.map(id => report.results.find(entry => entry.id === id));
  const results = entries.map((entry, i) => entry?.result || failure(ids[i], 'Expected suite has no completed result.'));
  const times = entries.filter(entry => entry?.completedAt);
  const summary = createRunSummary(results, {
    startedAt: times.length ? times.map(e => e.startedAt).sort()[0] : report.startedAt,
    completedAt: times.length ? times.map(e => e.completedAt).sort().at(-1) : report.startedAt,
    durationMs: times.length ? Math.max(...times.map(e=>Date.parse(e.completedAt))) - Math.min(...times.map(e=>Date.parse(e.startedAt))) : 0
  });
  return summary;
}
function blockingStatus(summary, advisory = [], requireNoSkips = false) {
  return summary.suites.some(suite => (suite.status !== 'passed' || (requireNoSkips && suite.skipCount > 0)) && !advisory.includes(suite.id)) ? 'failed' : 'passed';
}
function projectReports(report, profile) {
  if (!profile) return;
  for (const group of profileGroups(profile)) {
    const definition = catalog.profiles[group];
    const summary = summaryFor(report, profileIds(group), definition.advisory || []);
    for (const target of definition.reports || []) writeJsonReport(summary, target, rootDir);
  }
}

// Only process groups created by this supervisor are ever signalled.
async function stopWorker(worker, cleanupMs = CLEANUP_MS) {
  if (!worker || worker.stopped) return;
  worker.stopped = true;
  const pid = worker.child.pid;
  if (pid) {
    if (process.platform === 'win32') {
      if (worker.child.exitCode === null && worker.child.signalCode === null) {
        const stopped = spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { timeout: cleanupMs, windowsHide: true, stdio: 'ignore' });
        if (stopped.error || stopped.status !== 0) throw stopped.error || new Error(`Worker tree cleanup failed for owned PID ${pid}.`);
      }
    } else {
      try { process.kill(-pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      const deadline = Date.now() + cleanupMs;
      while (Date.now() < deadline) {
        try { process.kill(-pid, 0); } catch (error) { if (error.code === 'ESRCH') break; throw error; }
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      try { process.kill(-pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
  }
  if (worker.log) { worker.log.end(); worker.log = null; }
  fs.rmSync(worker.tempDir, { recursive: true, force: true });
}

async function execute(selected, options = {}) {
  const jobs = options.jobs || 1;
  if (![1, 2].includes(jobs)) throw new Error('Worker count must be 1 or 2.');
  if (!selected.length) throw new Error('An execution must contain at least one suite.');
  const identity = options.provenance || provenance();
  const executionId = randomUUID();
  const logDir = path.join(rootDir, '.xtend-test-results/test-runner', executionId);
  fs.mkdirSync(logDir, { recursive: true });
  const resolve = options.resolveSuite || canonicalSuite;
  const queue = [...new Map(selected.map(suite => { const entry = resolve(suite.id); return [entry.id, entry]; })).values()];
  const expected = selected.map(suite => suite.id);
  const report = { schema: SCHEMA, executionId, ...identity, profile: options.profile || null, startedAt: new Date().toISOString(), completedAt: null, complete: false, status: 'failed', jobs, expected, results: [], executions: [], workerCount: 0, peakWorkerRssBytes: 0 };
  const workers = [];
  const active = new Map();
  let aborted = null;
  const advisory = options.advisory || catalog.profiles[options.profile]?.advisory || [];
  const requireNoSkips = options.requireNoSkips ?? catalog.profiles[options.profile]?.requireNoSkips ?? false;
  function checkpoint() {
    const summary = summaryFor(report, expected, advisory);
    report.status = report.complete && !aborted && !report.infrastructureErrors?.length ? blockingStatus(summary, advisory, requireNoSkips) : 'failed';
    writeJsonReport(report, options.execution || DEFAULT_REPORT, rootDir);
    if (options.report) writeJsonReport(summary, options.report, rootDir);
    projectReports(report, options.profile);
    const inventory = report.results.find(entry => entry.id === 'schema-inventory');
    if (inventory) writeJsonReport(summaryFor(report, ['schema-inventory']), '.xtend-test-results/xtend-schema-inventory-report.json', rootDir);
    return summary;
  }
  function abort(signal) { aborted = `Supervisor interrupted by ${signal}.`; for (const task of active.values()) task.finish(failure(task.suite.id, aborted), 'cancelled'); }
  const onInt = () => abort('SIGINT');
  const onTerm = () => abort('SIGTERM');
  process.on('SIGINT', onInt);
  process.on('SIGTERM', onTerm);
  function createWorker() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-test-worker-'));
    const child = fork(options.workerPath || path.join(__dirname, 'worker.js'), [], {
      cwd: rootDir, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, TMPDIR: tempDir, TEMP: tempDir, TMP: tempDir }
    });
    const worker = { child, tempDir, busy: false, stopped: false, log: null };
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { worker.log?.write(chunk); if (!options.json) process.stderr.write(chunk); });
    child.on('error', error => { worker.broken = true; active.get(worker)?.finish(failure(active.get(worker).suite.id, error.message), 'worker-error'); });
    child.on('exit', (code, signal) => { worker.broken = true; active.get(worker)?.finish(failure(active.get(worker).suite.id, `Worker exited before its result (code=${code}, signal=${signal}).`), 'worker-exit'); });
    workers.push(worker);
    report.workerCount++;
    return worker;
  }
  function run(worker, suite) {
    return new Promise(resolveTask => {
      worker.busy = true;
      const started = Date.now();
      const logPath = path.join(logDir, `${suite.id}.log`);
      worker.log = fs.createWriteStream(logPath);
      let settled = false;
      const finish = async (raw, abortCause = null, usage = {}) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.child.off('message', onMessage);
        const completed = Date.now();
        const result = normalizeSuiteResult(raw);
        if (requireNoSkips && result.skipCount > 0) {
          result.status = 'failed';
          result.exitCode = 1;
          result.failures.push({ message: `Required CI coverage was skipped: ${result.skips.join('; ')}` });
          result.failureCount = result.failures.length;
        }
        const entry = { executionId: suite.id, startedAt: new Date(started).toISOString(), completedAt: new Date(completed).toISOString(), durationMs: completed - started, logPath: path.relative(rootDir, logPath).split(path.sep).join('/'), abortCause, ...usage };
        report.executions.push(entry);
        report.peakWorkerRssBytes = Math.max(report.peakWorkerRssBytes, usage.rssBytes || 0, usage.maxRssBytes || 0);
        for (const requested of selected.filter(s => resolve(s.id).id === suite.id)) report.results.push({ ...entry, id: requested.id, reused: requested.id !== suite.id, result: { ...result, id: requested.id, label: requested.label } });
        if (worker.log) { worker.log.end(); worker.log = null; }
        if (abortCause) await stopWorker(worker, options.cleanupMs ?? CLEANUP_MS);
        worker.busy = false;
        active.delete(worker);
        checkpoint();
        resolveTask();
      };
      const onMessage = message => {
        if (message?.type === 'result' && message.id === suite.id) finish(message.result, null, message.usage);
        else finish(failure(suite.id, 'Worker returned an invalid protocol message.'), 'invalid-result');
      };
      const timer = setTimeout(() => finish(failure(suite.id, `Suite exceeded ${suite.timeoutMs || 300000}ms deadline.`), 'timeout'), suite.timeoutMs || 300000);
      active.set(worker, { suite, finish });
      worker.child.on('message', onMessage);
      worker.child.send({ type: 'run', id: suite.id }, error => { if (error) finish(failure(suite.id, error.message), 'worker-error'); });
    });
  }
  function resources(suite) { return Array.isArray(suite.resources) ? suite.resources : ['*']; }
  function available(suite) {
    const requested = resources(suite);
    return [...active.values()].every(task => {
      const held = resources(task.suite);
      return !requested.includes('*') && !held.includes('*') && !requested.some(r => held.includes(r));
    });
  }
  const pending = new Set();
  try {
    checkpoint();
    while (queue.length || pending.size) {
      if (aborted) {
        for (const suite of queue.splice(0)) for (const requested of selected.filter(s => resolve(s.id).id === suite.id)) report.results.push({ id: requested.id, executionId: suite.id, abortCause: 'cancelled', result: failure(requested.id, aborted) });
      }
      while (!aborted && pending.size < jobs) {
        const index = queue.findIndex(available);
        if (index < 0) break;
        const suite = queue.splice(index, 1)[0];
        const worker = workers.find(w => !w.busy && !w.stopped && !w.broken) || createWorker();
        const task = run(worker, suite);
        pending.add(task);
        task.finally(() => pending.delete(task));
      }
      if (pending.size) await Promise.race(pending);
    }
    const cleanup = await Promise.allSettled(workers.map(worker => stopWorker(worker, options.cleanupMs ?? CLEANUP_MS)));
    report.infrastructureErrors = cleanup.filter(result=>result.status === 'rejected').map(result=>result.reason.message);
    report.completedAt = new Date().toISOString();
    report.durationMs = Date.parse(report.completedAt) - Date.parse(report.startedAt);
    report.complete = expected.every(id => report.results.some(entry => entry.id === id && entry.completedAt));
    return { summary: checkpoint(), status: report.status };
  } finally {
    process.off('SIGINT', onInt);
    process.off('SIGTERM', onTerm);
    await Promise.all(workers.map(worker => stopWorker(worker, options.cleanupMs ?? CLEANUP_MS)));
  }
}

function verifyExecution(options) {
  const report = options.executionReport || JSON.parse(fs.readFileSync(path.resolve(rootDir, options.from), 'utf8'));
  const current = options.provenance || provenance();
  const errors = [];
  if (report.schema !== SCHEMA || !report.executionId || report.complete !== true) errors.push('Missing or incomplete execution report.');
  if (report.infrastructureErrors?.length) errors.push(...report.infrastructureErrors);
  if (!Array.isArray(report.expected) || !Array.isArray(report.results) ||
      new Set(report.expected).size !== report.expected.length ||
      report.expected.some(id => report.results.filter(entry=>entry.id === id && entry.completedAt && entry.result).length !== 1)) errors.push('Expected execution results are incomplete or duplicated.');
  for (const key of ['run', 'commit', 'sourceFingerprint', 'catalogFingerprint', 'runtime']) if (JSON.stringify(report[key]) !== JSON.stringify(current[key])) errors.push(`Execution provenance mismatch: ${key}.`);
  const ids = profileIds(options.verify);
  for (const id of ids) {
    const matches = (Array.isArray(report.results) ? report.results : []).filter(entry => entry.id === id);
    if (!Array.isArray(report.expected) || !report.expected.includes(id) || matches.length !== 1 || !matches[0].completedAt || !matches[0].result || matches[0].executionId !== canonicalSuite(id).id) errors.push(`Missing, duplicate or invalid suite result: ${id}.`);
  }
  const summary = errors.length ? null : summaryFor(report, ids);
  if (!errors.length) {
    if (options.project !== false) projectReports(report, options.verify);
    if (options.report) writeJsonReport(summary, options.report, rootDir);
  }
  return { schema: 'xtend.test.execution-verification.v1', status: errors.length ? 'failed' : blockingStatus(summary, catalog.profiles[options.verify].advisory || [], catalog.profiles[options.verify].requireNoSkips),
    executionId: report.executionId || null, profile: options.verify, errors, summary };
}
module.exports = { execute, verifyExecution, provenance, summaryFor, SCHEMA };

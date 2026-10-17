'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const execFile = require('node:util').promisify(require('node:child_process').execFile);
const { hash, profileIds, canonicalSuite, catalog } = require('./catalog');
const { RUNTIME_LANES } = require('../capture_node_runtime_evidence');
const { normalizeSuiteResult, writeJsonReport } = require('../../tests/utils/reporting');
const BINDING_SCHEMA = 'xtend.test.imported-ci-binding.v1';
const positive = value => /^[1-9]\d*$/.test(String(value));
const digest = value => /^sha256:[a-f0-9]{64}$/.test(value || '');
const { isDeepStrictEqual: same } = require('node:util');

// These expectations come from workflow configuration, never from the downloaded report.
function expectedProducer(env = process.env) {
  const job = env.GITHUB_EVENT_NAME === 'pull_request' ? 'pr-fast-gates' : 'full-release-gates';
  const node = ['node-24-lts', 'node-26-current'].includes(env.XTEND_CI_LANE) ? RUNTIME_LANES[env.XTEND_CI_LANE].node : null;
  if (!node || !positive(env.GITHUB_RUN_ID) || !env.GITHUB_SHA || !env.GITHUB_REPOSITORY || !env.GITHUB_WORKFLOW_REF) throw Error('Missing independent Imported-CI expectations.');
  return { repository: env.GITHUB_REPOSITORY, workflow: env.GITHUB_WORKFLOW_REF, job,
    jobName: `${job === 'pr-fast-gates' ? 'PR fast gates' : 'Full release gates'} (Node ${node})`,
    lane: env.XTEND_CI_LANE, runId: env.GITHUB_RUN_ID, testedSHA: env.GITHUB_SHA,
    producerNode: `v${node}`, platform: 'linux', arch: 'x64', profile: job === 'pr-fast-gates' ? 'ci-pr' : 'ci-release' };
}

function selectArtifact({ jobs, artifacts, expected }) {
  const matches = jobs.filter(job => job.name === expected.jobName);
  if (matches.length !== 1) throw Error('Missing or ambiguous latest producer job.');
  const job = matches[0];
  const start = Date.parse(job.started_at), end = Date.parse(job.completed_at);
  if (job.status !== 'completed' || job.conclusion !== 'success' || !Number.isFinite(start) || !Number.isFinite(end) || end < start) throw Error('Latest producer job is not successfully completed.');
  const prefix = `xtend-shared-execution-${expected.lane}-${expected.job}-attempt-`;
  // run_attempt and even job IDs can be rewritten for inherited successful jobs.
  // The actual execution window remains unchanged. Never fall back to an old green artifact.
  const candidates = artifacts.filter(artifact => artifact.name?.startsWith(prefix) &&
    Date.parse(artifact.created_at) >= start && Date.parse(artifact.created_at) <= end);
  if (candidates.length !== 1) throw Error('Missing, superseded or ambiguous producer artifact.');
  const artifact = candidates[0], attempt = artifact.name.slice(prefix.length);
  if (!positive(attempt) || !positive(artifact.id) || artifact.expired || !digest(artifact.digest) ||
      String(artifact.workflow_run?.id) !== expected.runId) throw Error('Invalid immutable producer artifact metadata.');
  const { jobName, producerNode, platform, arch, profile, ...producer } = expected;
  return { schema: BINDING_SCHEMA, producer: { ...producer, attempt }, producerNode, platform, arch, profile,
    artifact: { id: artifact.id, name: artifact.name, digest: artifact.digest, runId: expected.runId },
    producerWindow: { startedAt: job.started_at, completedAt: job.completed_at } };
}

async function readArchive(archive, binding) {
  if (`sha256:${hash(archive)}` !== binding.artifact.digest) throw Error('Producer artifact digest mismatch.');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-imported-ci-'));
  try {
    const zip = path.join(temp, 'artifact.zip'); fs.writeFileSync(zip, archive);
    const invoke = async args => (await execFile('unzip', args, { timeout: 10000, maxBuffer: 32 * 1024 * 1024, encoding: 'buffer' })).stdout;
    const entries = (await invoke(['-Z1', zip])).toString().trim().split('\n');
    const reports = entries.filter(name => name === 'xtend-test-execution.json');
    if (reports.length !== 1) throw Error('Missing or duplicate execution report in producer archive.');
    return await invoke(['-p', zip, reports[0]]);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

function importedErrors(report, binding, current, reportBytes) {
  const errors = [];
  const fail = message => errors.push(`Imported CI: ${message}`);
  if (binding?.schema !== BINDING_SCHEMA || !binding.producer || !binding.artifact) return ['Imported CI: Missing independent producer binding.'];
  const p = binding.producer, a = binding.artifact;
  if (p.runId !== String(current.run).split(':')[0]) fail('Consumer and producer workflow run mismatch.');
  if (!positive(p.runId) || !positive(p.attempt) || !positive(a.id) || !digest(a.digest) ||
      a.runId !== p.runId || a.name !== `xtend-shared-execution-${p.lane}-${p.job}-attempt-${p.attempt}` ||
      !p.repository || !p.workflow || !p.job || !p.lane || p.testedSHA !== current.commit) fail('Invalid producer/artifact identity.');
  if (!same(report.producer, p) || report.run !== `${p.runId}:${p.attempt}`) fail('Producer run/attempt binding mismatch.');
  if (!reportBytes || hash(reportBytes) !== binding.executionDigest) fail('Execution payload digest mismatch.');
  const start = Date.parse(binding.producerWindow?.startedAt), end = Date.parse(binding.producerWindow?.completedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || Date.parse(report.startedAt) < start ||
      !Number.isFinite(Date.parse(report.startedAt)) || !Number.isFinite(Date.parse(report.completedAt)) ||
      Date.parse(report.completedAt) > end || Date.parse(report.completedAt) < Date.parse(report.startedAt)) fail('Execution is outside the actual producer window.');
  for (const key of ['commit', 'sourceFingerprint', 'catalogFingerprint']) if (report[key] !== current[key]) fail(`Provenance mismatch: ${key}.`);
  for (const [key, expected] of [['node', binding.producerNode], ['platform', binding.platform], ['arch', binding.arch]]) {
    if (!expected || report.runtime?.[key] !== expected) fail(`Producer runtime mismatch: ${key}.`);
  }
  if (!/^v\d+\.\d+\.\d+$/.test(binding.producerNode || '')) fail('producerNode must be exactly pinned.');
  if (!catalog.profiles[binding.profile] || report.profile !== binding.profile) fail('Producer profile mismatch.');
  else {
    const ids = profileIds(binding.profile), definition = catalog.profiles[binding.profile];
    if (!Array.isArray(report.expected) || !same([...report.expected].sort(), [...ids].sort()) || report.results?.length !== ids.length) fail('Producer suite inventory mismatch.');
    for (const id of ids) {
      const entries = (Array.isArray(report.results) ? report.results : []).filter(entry => entry.id === id);
      const entry = entries[0];
      if (entries.length !== 1 || !entry?.completedAt || entry.executionId !== canonicalSuite(id).id || entry.result?.id !== id) { fail(`Missing, duplicate or invalid suite: ${id}.`); continue; }
      const result = normalizeSuiteResult(entry.result);
      if (!(definition.advisory || []).includes(id) && (result.status !== 'passed' || (definition.requireNoSkips && result.skipCount))) fail(`Required suite failed or skipped: ${id}.`);
    }
    if (report.status !== 'passed') fail('Producer execution did not pass.');
  }
  return errors;
}

async function resolveImportedCi({ env = process.env, api, provenance: identity, directory = path.resolve('.xtend-test-results') } = {}) {
  const reportPath = path.join(directory, 'xtend-test-execution.json');
  const bindingPath = path.join(directory, 'imported-ci-binding.json');
  // A failed resolver must not leave evidence from an earlier invocation usable.
  fs.rmSync(bindingPath, { force: true }); fs.rmSync(reportPath, { force: true });
  const expected = expectedProducer(env);
  const call = api || (async (endpoint, paginated = false) => (await execFile('gh', ['api', endpoint, ...(paginated ? ['--paginate', '--slurp'] : [])], { timeout: 60000, maxBuffer: 64 * 1024 * 1024, encoding: 'buffer' })).stdout);
  const base = `/repos/${expected.repository}/actions`;
  const pages = async (endpoint, key) => JSON.parse(await call(endpoint, true)).flatMap(page => page[key]);
  const jobs = await pages(`${base}/runs/${expected.runId}/jobs?filter=latest&per_page=100`, 'jobs');
  const artifacts = await pages(`${base}/runs/${expected.runId}/artifacts?per_page=100`, 'artifacts');
  const binding = selectArtifact({ jobs, artifacts, expected });
  const bytes = await readArchive(await call(`${base}/artifacts/${binding.artifact.id}/zip`), binding);
  const confirmed = selectArtifact({ jobs: await pages(`${base}/runs/${expected.runId}/jobs?filter=latest&per_page=100`, 'jobs'), artifacts, expected });
  if (!same(confirmed, binding)) throw Error('Producer changed during artifact resolution.');
  binding.executionDigest = hash(bytes);
  const report = JSON.parse(bytes);
  const { provenance, verifyExecution } = require('./executor');
  const current = identity || provenance();
  const result = verifyExecution({ verify: binding.profile, executionReport: report, importedCi: binding, executionBytes: bytes, provenance: current, project: false });
  if (result.status !== 'passed') throw Error(result.errors.join('\n') || 'Imported producer verification failed.');
  fs.mkdirSync(directory, { recursive: true }); fs.writeFileSync(reportPath, bytes);
  writeJsonReport(binding, bindingPath);
  return binding;
}
if (require.main === module) {
  resolveImportedCi().then(binding => console.log(JSON.stringify(binding, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { BINDING_SCHEMA, expectedProducer, selectArtifact, readArchive, importedErrors, resolveImportedCi };

'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { check } = require('./inventory.cjs');
const { digest } = require('./artifact.cjs');
const { verifyStatements } = require('./provenance.cjs');
// Never persist npm's free-form output: it may contain credentials, headers,
// signed URLs or arbitrary server text. Only recognized codes cross this boundary.
const hints = Object.freeze({
  E404: 'Check package existence and scope/bootstrap ownership; E404 alone does not establish the cause.',
  E401: 'Check npm authentication and the package trusted-publisher mapping.',
  E403: 'Check package/scope publish permission and the trusted-publisher workflow identity.',
  EOTP: 'Check the package authentication policy and approved publishing method.',
  ENEEDAUTH: 'Check the approved npm authentication method and trusted-publisher mapping.',
  EPUBLISHCONFLICT: 'Inspect the exact registry version and integrity before recovery.',
  E429: 'Registry rate limit; retry read-only verification later.',
  E500: 'Registry server failure; retry read-only verification later.',
  E502: 'Registry gateway failure; retry read-only verification later.',
  E503: 'Registry unavailable; retry read-only verification later.',
  ETIMEDOUT: 'Request timed out; upload outcome may be uncertain. Resume verification without uploading again.',
  ECONNRESET: 'Connection reset; upload outcome may be uncertain. Resume verification without uploading again.',
  ECONNREFUSED: 'Connection refused; inspect connectivity and resume read-only verification.',
  ENOTFOUND: 'DNS lookup failed; inspect connectivity and resume read-only verification.',
  EAI_AGAIN: 'Temporary DNS failure; resume read-only verification later.',
  ENPM: 'Unclassified npm failure; retain the sealed artifact and ledger for reviewed recovery.'
});
function npmDiagnostic(result = {}) {
  let code;
  try { code = JSON.parse(result.stdout).error?.code; } catch { /* stderr fallback below */ }
  if (!Object.hasOwn(hints, code)) {
    code = /(?:^|\n)npm (?:error|ERR!) code ([A-Z][A-Z0-9_]+)(?:\r?\n|$)/.exec(result.stderr || '')?.[1];
  }
  if (!Object.hasOwn(hints, code)) code = result.timedOut ? 'ETIMEDOUT' : Object.hasOwn(hints, result.status) ? result.status : 'ENPM';
  return { code, hint: hints[code], timedOut: result.timedOut === true };
}
function safeDiagnostic(value) {
  const code = Object.hasOwn(hints, value?.code) ? value.code : 'ENPM';
  return { code, hint: hints[code], timedOut: value?.timedOut === true };
}
function redact(message) {
  return String(message)
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/(?:authorization|proxy-authorization|cookie|set-cookie)\s*[:=][^\r\n]*/gi, '[REDACTED HEADER]')
    .replace(/(?:_authToken|_auth|[\w-]*(?:token|password|secret|credential)[\w-]*)\s*["']?\s*[:=]\s*[^\s,;}]+/gi, '[REDACTED CREDENTIAL]')
    .replace(/\b(?:Bearer|Basic)\s+[^\s,;]+/gi, '[REDACTED AUTH]')
    .replace(/\b(?:npm_[A-Za-z0-9]+|gh[pousr]_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, '[REDACTED TOKEN]')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[REDACTED URL]')
    .slice(0, 1000);
}
const execute = promisify(execFile);
const REGISTRY = 'https://registry.npmjs.org';
async function runNpm(npmCli, args, cwd, timeout = 120000) {
  check(npmCli && path.isAbsolute(npmCli) && fs.existsSync(npmCli), 'Explicit installed npm CLI path required (npm_execpath or --npm-cli)');
  try {
    const result = await execute(process.execPath, [npmCli, ...args, `--registry=${REGISTRY}`, '--fetch-retries=0'],
      { cwd, timeout, maxBuffer: 16 * 1024 * 1024, env: process.env });
    return { status: 0, stdout: result.stdout };
  } catch (error) {
    const result = { status: error.code || 1, stdout: error.stdout || '', timedOut: error.killed === true,
      transportError: !error.stdout && typeof error.code === 'string' };
    result.diagnostic = npmDiagnostic({ ...result, stderr: error.stderr });
    result.stdout = JSON.stringify({ error: { code: result.diagnostic.code, summary: result.diagnostic.hint } });
    return result;
  }
}
function parseRegistryResult(result) {
  let json;
  try { json = JSON.parse(result.stdout); } catch { throw Error('Registry returned no valid JSON; absence is unproven'); }
  if (result.status !== 0) {
    if (!result.timedOut && json.error?.code === 'E404' &&
      /(?:404 Not Found|Not Found - GET https:\/\/registry\.npmjs\.org\/)/.test(json.error.summary || '')) return null;
    throw Error(`Registry request failed (${json.error?.code || 'unknown'}); absence is unproven`);
  }
  check(json && !Array.isArray(json) && typeof json === 'object' && !json.error, 'Invalid successful registry response');
  return json;
}
function parseHttpRegistryResult(result) {
  check(result.transportOk === true, 'Registry transport failure; absence is unproven');
  let json;
  try { json = JSON.parse(result.body); } catch { throw Error('Invalid registry HTTP JSON; absence is unproven'); }
  if (result.status === 404 && (json?.error === 'Not found' ||
    result.expectedVersion && json === `version not found: ${result.expectedVersion}`)) return null;
  check(result.status === 200 && json && typeof json === 'object' && !Array.isArray(json) && !json.error,
    `Registry HTTP ${result.status}; absence is unproven`);
  return json;
}
async function readRegistry(url) {
  check(url.startsWith(`${REGISTRY}/`), 'Fixed public registry required');
  try {
    const { stdout } = await execute('curl', ['--silent', '--show-error', '--max-time', '30', '--write-out', '\n%{http_code}', '--', url],
      { timeout: 35000, maxBuffer: 32 * 1024 * 1024, env: process.env });
    const split = stdout.lastIndexOf('\n');
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    return parseHttpRegistryResult({ transportOk: true, status: Number(stdout.slice(split + 1)), body: stdout.slice(0, split),
      expectedVersion: segments.length === 2 ? decodeURIComponent(segments[1]) : undefined });
  } catch (error) { throw Error(`Registry lookup failed: ${error.message.includes('Registry HTTP') ? error.message : 'absence is unproven'}`); }
}
async function provenanceStatements(url, options) {
  check(typeof url === 'string' && url.startsWith(`${REGISTRY}/-/npm/v1/attestations/`), 'Unexpected registry attestation URL');
  // curl follows the inherited managed proxy and CA settings. No direct fetch,
  // alternate endpoint, redirects, credentials, or TLS bypass is introduced.
  const { stdout } = await execute('curl', ['--fail', '--silent', '--show-error', '--max-time', '30', '--', url],
    { timeout: 35000, maxBuffer: 16 * 1024 * 1024, env: process.env });
  const response = JSON.parse(stdout);
  return verifyStatements(response, options);
}
function npmAdapters({ npmCli, cwd, request = args => runNpm(npmCli, args, cwd), registryRequest = readRegistry,
  attestations = url => provenanceStatements(url, { npmCli }), publishCommand = runNpm }) {
  const registry = {
    async package(entry) {
      const result = await registryRequest(`${REGISTRY}/${encodeURIComponent(entry.name)}`);
      if (result) {
        check(result.versions && typeof result.versions === 'object' && !Array.isArray(result.versions), 'Invalid registry version map');
        return { ...result, versions: Object.keys(result.versions) };
      }
      return null;
    },
    async version(entry) {
      // Use the exact HTTP endpoint: npm view can synthesize an E404 for range
      // selection. Here only a real 404 response establishes version absence.
      const result = await registryRequest(`${REGISTRY}/${encodeURIComponent(entry.name)}/${encodeURIComponent(entry.version)}`);
      if (result?.dist?.attestations?.url) result.provenanceStatements = await attestations(result.dist.attestations.url);
      return result;
    }
  };
  async function publishTarball(entry, tag, dryRun) {
      // Publish a sealed byte-for-byte copy in a fresh directory. npm receives a
      // .tgz, never a workspace/folder; lifecycle hooks cannot rebuild it.
      const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-upload-'));
      try {
        const bytes = fs.readFileSync(entry.absoluteFile);
        check(bytes.length === entry.size && digest(bytes) === entry.integrity, 'Artifact changed before sealed upload');
        const sealed = path.join(temporary, 'package.tgz'); fs.writeFileSync(sealed, bytes, { flag: 'wx', mode: 0o400 });
        const result = await publishCommand(npmCli, ['publish', sealed, '--ignore-scripts', '--access=public', '--provenance',
          `--tag=${tag}`, '--json', ...(dryRun ? ['--dry-run'] : [])], temporary);
        if (result.status !== 0) {
          const diagnostic = result.diagnostic ? safeDiagnostic(result.diagnostic) : npmDiagnostic(result);
          const error = Error(`${dryRun ? 'Tarball publish dry-run gate failed before uploads' : 'npm publish outcome requires registry verification'} (${diagnostic.code}): ${diagnostic.hint}`);
          error.diagnostic = diagnostic;
          error.retryable = false; throw error;
        }
      } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  }
  const publisher = {
    dryRun: (entry, tag) => publishTarball(entry, tag, true),
    publish: (entry, tag) => publishTarball(entry, tag, false),
    async tag(entry, tag) {
      const result = await request(['dist-tag', 'add', `${entry.name}@${entry.version}`, tag, '--json']);
      check(result.status === 0, 'OIDC dist-tag failed; inspect ledger and registry before resume');
    }
  };
  return { registry, publisher };
}
// Read-only recovery of write-ahead upload markers across fresh hosted runners.
// History can forbid an upload; it never supplies release authority or evidence.
const repository = 'konnilabs/xtend';
const publishJob = 'Publish npm latest with provenance (Node 24.18.0)';
const publishStep = 'Publish exact verified tarballs sequentially with registry rechecks';
async function loadUploadHistory({ artifact, env = process.env,
  request = require('./github.cjs').githubRequest(), fetchBytes = fetch }) {
  const auth = require('./github.cjs');
  check(env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY === repository && env.GITHUB_SHA === artifact.sourceSha &&
    /^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID || '') && /^[1-9][0-9]*$/.test(env.GITHUB_RUN_ATTEMPT || ''),
    'Upload history requires current trusted workflow identity');
  const workflow = await request(`/repos/${repository}/actions/workflows/xtend-default-gates.yml`);
  const runsPath = `/repos/${repository}/actions/workflows/xtend-default-gates.yml/runs`;
  const runs = await auth.pages(resource => {
    check(resource.startsWith(runsPath + '?'), 'Unexpected workflow history resource');
    return request(`${runsPath}?head_sha=${artifact.sourceSha}&${resource.slice(runsPath.length + 1)}`);
  }, runsPath, 'workflow_runs');
  check(runs.length < 1000, 'Upload history reached the GitHub search cap; reviewed recovery required');
  check(runs.some(run => String(run.id) === env.GITHUB_RUN_ID), 'Current run missing from upload history');
  const ledgers = [];
  let inspected = 0;
  for (const run of runs) {
    check(run.head_sha === artifact.sourceSha, 'Upload history contains another source');
    if (run.event !== 'workflow_dispatch' || run.head_branch !== 'main') continue;
    check(Number.isSafeInteger(run.run_attempt) && run.run_attempt >= 1, 'Invalid upload history attempt');
    const current = String(run.id) === env.GITHUB_RUN_ID;
    const lastAttempt = current ? Number(env.GITHUB_RUN_ATTEMPT) - 1 : run.run_attempt - (run.status === 'queued' ? 1 : 0);
    // Queued future runs cannot publish concurrently with this workflow's global
    // publication lock. A running foreign publisher is never treated as absent.
    for (let attempt = 1; attempt <= lastAttempt; attempt++) {
      check(++inspected <= 100, 'Upload history budget exceeded; reviewed recovery required');
      const ctx = { runId: String(run.id), runAttempt: String(attempt), sourceSha: artifact.sourceSha };
      const producer = await request(`/repos/${repository}/actions/runs/${run.id}/attempts/${attempt}`);
      auth.checkRun(producer, workflow, ctx);
      const jobs = await auth.pages(request, auth.jobsResource(ctx), 'jobs');
      const found = jobs.filter(job => job.name === publishJob);
      check(found.length <= 1, 'Ambiguous prior publish job');
      if (!found.length) {
        check(producer.status === 'completed', 'Earlier run is still active; upload absence unproven');
        continue;
      }
      const job = found[0];
      check(String(job.run_id) === ctx.runId && job.head_sha === ctx.sourceSha &&
        (!Object.hasOwn(job, 'run_attempt') || String(job.run_attempt) === ctx.runAttempt), 'Prior publish job identity mismatch');
      if (job.conclusion === 'skipped') continue;
      check(job.status === 'completed' && Array.isArray(job.steps), 'Earlier publish job incomplete; retain artifact for recovery');
      const steps = job.steps.filter(step => step.name === publishStep);
      check(steps.length === 1, 'Prior publish boundary cannot be established');
      if (steps[0].conclusion === 'skipped' || steps[0].status === 'queued') continue;
      check(['completed', 'in_progress'].includes(steps[0].status), 'Prior upload outcome is unknown');
      const artifacts = await auth.pages(request, `/repos/${repository}/actions/runs/${run.id}/artifacts`, 'artifacts');
      const name = `xtend-npm-upload-state-${attempt}`;
      const matches = artifacts.filter(item => item.name === name);
      check(matches.length === 1, 'Prior publish started without a recoverable upload ledger; no further uploads allowed');
      auth.checkMetadata(matches[0], name, ctx);
      const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-upload-history-'));
      try {
        const zip = path.join(temporary, 'ledger.zip'), directory = path.join(temporary, 'ledger');
        await auth.download(matches[0], zip, request, fetchBytes);
        auth.extract(zip, directory, ['npm-release-ledger.json']);
        ledgers.push(JSON.parse(fs.readFileSync(path.join(directory, 'npm-release-ledger.json'))));
      } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    }
  }
  return ledgers;
}

module.exports = { REGISTRY, runNpm, parseRegistryResult, parseHttpRegistryResult, readRegistry, npmAdapters, provenanceStatements, npmDiagnostic, safeDiagnostic, redact, loadUploadHistory, publishJob, publishStep };

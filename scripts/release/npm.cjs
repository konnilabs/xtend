'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { check } = require('./inventory.cjs');
const { digest } = require('./artifact.cjs');
const execute = promisify(execFile);
const REGISTRY = 'https://registry.npmjs.org';
async function runNpm(npmCli, args, cwd, timeout = 120000) {
  check(npmCli && path.isAbsolute(npmCli) && fs.existsSync(npmCli), 'Explicit installed npm CLI path required (npm_execpath or --npm-cli)');
  try {
    const result = await execute(process.execPath, [npmCli, ...args, `--registry=${REGISTRY}`, '--fetch-retries=0'],
      { cwd, timeout, maxBuffer: 16 * 1024 * 1024, env: process.env });
    return { status: 0, stdout: result.stdout };
  } catch (error) {
    return { status: error.code || 1, stdout: error.stdout || '', timedOut: error.killed === true,
      transportError: !error.stdout && typeof error.code === 'string' };
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
async function provenanceStatements(url) {
  check(typeof url === 'string' && url.startsWith(`${REGISTRY}/-/npm/v1/attestations/`), 'Unexpected registry attestation URL');
  // curl follows the inherited managed proxy and CA settings. No direct fetch,
  // alternate endpoint, redirects, credentials, or TLS bypass is introduced.
  const { stdout } = await execute('curl', ['--fail', '--silent', '--show-error', '--max-time', '30', '--', url],
    { timeout: 35000, maxBuffer: 16 * 1024 * 1024, env: process.env });
  const response = JSON.parse(stdout);
  check(Array.isArray(response.attestations), 'Invalid registry attestation response');
  return response.attestations.map(item => {
    const payload = item.bundle?.dsseEnvelope?.payload;
    check(typeof payload === 'string', 'Attestation statement missing');
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  });
}
function npmAdapters({ npmCli, cwd, request = args => runNpm(npmCli, args, cwd), registryRequest = readRegistry,
  attestations = provenanceStatements, publishCommand = runNpm }) {
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
  const publisher = {
    async publish(entry, tag) {
      // Publish a sealed byte-for-byte copy in a fresh directory. npm receives a
      // .tgz, never a workspace/folder; lifecycle hooks cannot rebuild it.
      const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-release-upload-'));
      try {
        const bytes = fs.readFileSync(entry.absoluteFile);
        check(bytes.length === entry.size && digest(bytes) === entry.integrity, 'Artifact changed before sealed upload');
        const sealed = path.join(temporary, 'package.tgz'); fs.writeFileSync(sealed, bytes, { flag: 'wx', mode: 0o400 });
        const result = await publishCommand(npmCli, ['publish', sealed, '--ignore-scripts', '--access=public', '--provenance',
          `--tag=${tag}`, '--json'], temporary);
        if (result.status !== 0) {
          const error = Error('npm publish failed; check registry before any retry');
          error.retryable = result.timedOut; throw error;
        }
      } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    },
    async tag(entry, tag) {
      const result = await request(['dist-tag', 'add', `${entry.name}@${entry.version}`, tag, '--json']);
      check(result.status === 0, 'OIDC dist-tag failed; inspect ledger and registry before resume');
    }
  };
  return { registry, publisher };
}
module.exports = { REGISTRY, runNpm, parseRegistryResult, parseHttpRegistryResult, readRegistry, npmAdapters, provenanceStatements };

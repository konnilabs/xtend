'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RESULT_DIR = path.join(ROOT_DIR, '.xtend-test-results');
const OUTPUT_PATH = path.join(RESULT_DIR, 'xtend-nightly-build-manifest.json');

const { catalog } = require('./test-runner/catalog');
const { validateNightly, ACCEPTANCE_PATH, SESSION_PATH } = require('./test-runner/nightly-evidence');
const { currentIdentity } = require('./test-runner/nightly');
const { writeJsonReport } = require('../tests/utils/reporting');
const COMMANDS = catalog.ci['ci-nightly'].manifestCommands;
const ARTIFACT_PATHS = catalog.ci['ci-nightly'].artifacts.map(artifact => artifact.path);
const REQUIRED_ARTIFACTS = new Set(ARTIFACT_PATHS);

function readPackageManifest() {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
}

function commandVersion(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8', timeout: 10000 });
  return result.status === 0 ? result.stdout.trim() : null;
}

function artifactStatus(relativePath) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      path: relativePath,
      exists: false
    };
  }
  const stat = fs.statSync(absolutePath);
  return {
    path: relativePath,
    exists: true,
    bytes: stat.size,
    mtime: stat.mtime.toISOString()
  };
}

function createManifest(options = {}) {
  const packageManifest = readPackageManifest();
  const artifacts = ARTIFACT_PATHS.map(artifactStatus);
  const acceptance = options.acceptance || validateNightly();

  return {
    schema: 'xtend.ci.nightly-build-manifest.v1',
    generatedAt: new Date().toISOString(),
    package: {
      name: packageManifest.name,
      version: packageManifest.version
    },
    runtime: {
      nodeVersion: process.version,
      npmVersion: commandVersion('npm')
    },
    github: {
      workflow: process.env.GITHUB_WORKFLOW || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runNumber: process.env.GITHUB_RUN_NUMBER || null,
      eventName: process.env.GITHUB_EVENT_NAME || null,
      ref: process.env.GITHUB_REF || null,
      sha: process.env.GITHUB_SHA || null,
      actor: process.env.GITHUB_ACTOR || null
    },
    commandSet: COMMANDS,
    optionalEvidence: {
      sourceToSea: process.env.XTEND_NIGHTLY_SOURCE_TO_SEA === '1',
      conditionalNetwork: process.env.XTEND_NIGHTLY_CONDITIONAL_NETWORK === '1'
    },
    artifacts,
    requiredArtifacts: Array.from(REQUIRED_ARTIFACTS),
    ok: acceptance.ok
  };
}

function main() {
  let session;
  try { session = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, SESSION_PATH), 'utf8')); } catch {}
  const acceptance = validateNightly({ provenance: currentIdentity(session) });
  writeJsonReport(acceptance, ACCEPTANCE_PATH, ROOT_DIR);
  const manifest = createManifest({ acceptance });
  writeJsonReport(manifest, OUTPUT_PATH, ROOT_DIR);
  if (process.env.GITHUB_OUTPUT) {
    const outputs = Object.entries(acceptance.outputs).map(([key,value]) => `${key.replace(/[^a-zA-Z0-9_]/g, '_')}=${value}`);
    outputs.push(`accepted=${acceptance.ok ? 'success' : 'failure'}`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${outputs.join('\n')}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const phases = Object.entries(session?.phases || {}).map(([id,phase]) => `| ${id} | ${phase.status} | ${Math.round((phase.durationMs || 0) / 1000)} s |`);
    const failures = acceptance.errors.map(error => `- ${error.replace(/\n/g, ' ')}`);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Nightly acceptance: ${acceptance.ok ? 'passed' : 'failed'}\n\n| Phase | Result | Duration |\n| --- | --- | --- |\n${phases.join('\n')}\n\n${failures.join('\n')}\n\nFull command output, npm logs, suite logs and artifact fingerprints are in the nightly diagnostics artifact.\n`);
  }
  console.log(`XTend nightly manifest written: ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
  if (!manifest.ok) {
    console.error(`XTend nightly acceptance failed:\n${acceptance.errors.map(error => `- ${error}`).join('\n')}`);
    process.exitCode = 1;
  }
  return manifest;
}

if (require.main === module) {
  main();
}

module.exports = {
  COMMANDS, ARTIFACT_PATHS, REQUIRED_ARTIFACTS,
  createManifest,
  main
};

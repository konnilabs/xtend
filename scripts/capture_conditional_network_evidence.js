#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  COMMAND_ARTIFACTS,
  EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
  createEpic13ConditionalNetworkEvidenceReport
} = require('../catalog/epic13-conditional-network-evidence');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.resolve(rootDir, '.xtend-test-results');
const executeNetworkCommands = process.env.XTEND_CONDITIONAL_NETWORK_EXECUTE === '1';
const allowDeferral = process.env.XTEND_CONDITIONAL_NETWORK_ALLOW_DEFERRAL !== '0';
const fallbackReason = process.env.XTEND_CONDITIONAL_NETWORK_DEFERRAL_REASON || (executeNetworkCommands ? 'sandbox-network-unavailable' : 'network-restricted-local-default');
const cacheDir = process.env.XTEND_NPM_CACHE
  ? path.resolve(process.env.XTEND_NPM_CACHE)
  : path.resolve(outputDir, 'npm-cache');

const commandArgs = {
  'npm-audit-moderate': ['audit', '--audit-level=moderate', '--json'],
  'npm-sbom-json': ['sbom', '--json']
};

function writeJson(relativePath, value) {
  const targetPath = path.resolve(rootDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

function createDeferral(commandArtifact, reason, error = null) {
  return {
    schema: EPIC13_CONDITIONAL_NETWORK_DEFERRAL_SCHEMA,
    id: commandArtifact.id,
    command: commandArtifact.command,
    jsonCommand: commandArtifact.jsonCommand,
    expectedArtifact: commandArtifact.expectedArtifact,
    status: 'deferred',
    reason,
    executedAt: null,
    artifactPresent: false,
    ownerDecisionRequired: true,
    localGateBlocking: false,
    publishBlocking: commandArtifact.publishRequired,
    requiredBefore: 'release-owner-publish-acceptance',
    validates: commandArtifact.validates.slice(),
    error
  };
}

function parseJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
}

function captureCommand(commandArtifact) {
  if (!executeNetworkCommands) {
    const deferral = createDeferral(commandArtifact, fallbackReason);
    writeJson(commandArtifact.expectedArtifact, deferral);
    return {
      status: 'deferred',
      reason: deferral.reason,
      artifactPresent: true
    };
  }

  const result = spawnSync('npm', commandArgs[commandArtifact.id], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      npm_config_cache: cacheDir,
      NPM_CONFIG_CACHE: cacheDir
    }
  });

  if (result.error) {
    if (!allowDeferral) throw result.error;
    const deferral = createDeferral(commandArtifact, fallbackReason, {
      code: result.error.code,
      message: result.error.message
    });
    writeJson(commandArtifact.expectedArtifact, deferral);
    return {
      status: 'deferred',
      reason: deferral.reason,
      artifactPresent: true
    };
  }

  try {
    const parsed = parseJson(result.stdout);
    if (parsed) {
      writeJson(commandArtifact.expectedArtifact, parsed);
      return {
        status: 'executed',
        executedAt: new Date().toISOString(),
        artifactPresent: true
      };
    }
  } catch (error) {
    if (!allowDeferral) throw error;
    const deferral = createDeferral(commandArtifact, fallbackReason, {
      code: 'JSON_PARSE_FAILED',
      message: error.message,
      exitCode: result.status,
      stderr: result.stderr || ''
    });
    writeJson(commandArtifact.expectedArtifact, deferral);
    return {
      status: 'deferred',
      reason: deferral.reason,
      artifactPresent: true
    };
  }

  if (!allowDeferral) {
    throw new Error(`${commandArtifact.jsonCommand} produced no JSON output`);
  }
  const deferral = createDeferral(commandArtifact, fallbackReason, {
    code: 'NO_JSON_OUTPUT',
    exitCode: result.status,
    stderr: result.stderr || ''
  });
  writeJson(commandArtifact.expectedArtifact, deferral);
  return {
    status: 'deferred',
    reason: deferral.reason,
    artifactPresent: true
  };
}

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(cacheDir, { recursive: true });

const executions = {};
COMMAND_ARTIFACTS.forEach((commandArtifact) => {
  executions[commandArtifact.id] = captureCommand(commandArtifact);
});

const report = createEpic13ConditionalNetworkEvidenceReport({ executions });
writeJson('.xtend-test-results/xtend-conditional-network-evidence-report.json', report);

process.stdout.write(`${JSON.stringify({
  schema: report.schema,
  ok: report.ok,
  commandCount: report.commandCount,
  evidenceSummary: report.evidenceSummary,
  requiredArtifactCount: report.requiredArtifactCount,
  publishAllowed: report.publishAllowed,
  nextWorkpackage: report.nextWorkpackage
}, null, 2)}\n`);

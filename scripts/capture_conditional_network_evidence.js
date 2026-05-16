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
const useNpxNpm10 = process.env.XTEND_CONDITIONAL_NETWORK_USE_NPX_NPM10 === '1';
const cacheDir = process.env.XTEND_NPM_CACHE
  ? path.resolve(process.env.XTEND_NPM_CACHE)
  : path.resolve(outputDir, 'npm-cache');

const commandArgs = {
  'npm-audit-moderate': ['audit', '--audit-level=moderate', '--json'],
  'npm-sbom-json': ['sbom', '--sbom-format=cyclonedx', '--json']
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

function createNpmInvocation(args) {
  if (useNpxNpm10) {
    return {
      command: 'npx',
      args: ['--yes', 'npm@10', ...args]
    };
  }
  return {
    command: 'npm',
    args
  };
}

function createCommandFailure(commandArtifact, result) {
  const parsed = (() => {
    try {
      return parseJson(result.stdout);
    } catch (error) {
      return null;
    }
  })();
  return {
    code: 'COMMAND_FAILED',
    message: `${commandArtifact.jsonCommand} failed with exit code ${result.status}`,
    exitCode: result.status,
    stderr: result.stderr || '',
    npmErrorCode: parsed && parsed.error && parsed.error.code ? parsed.error.code : null
  };
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

  const invocation = createNpmInvocation(commandArgs[commandArtifact.id]);
  const result = spawnSync(invocation.command, invocation.args, {
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

  if (result.status !== 0) {
    const commandFailure = createCommandFailure(commandArtifact, result);
    if (!allowDeferral) {
      const error = new Error(commandFailure.message);
      error.code = commandFailure.code;
      error.exitCode = commandFailure.exitCode;
      error.stderr = commandFailure.stderr;
      error.npmErrorCode = commandFailure.npmErrorCode;
      throw error;
    }
    const deferral = createDeferral(commandArtifact, fallbackReason, commandFailure);
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

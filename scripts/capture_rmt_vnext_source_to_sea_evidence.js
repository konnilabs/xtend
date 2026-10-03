#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH = '.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json';
const RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA = 'xtend.rmt.vnext.source-to-sea-evidence-report.v1';
const RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA = 'xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1';
const RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA = 'xtend.rmt.vnext.browser-execution-evidence.v1';
const RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE = 'RMT-VNEXT-PRIM-06';
const RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY = '__xtendRmtVNextSourceToSeaResult';

function resolveReportOutputPath(outputPath, rootDir) {
  return path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(rootDir, outputPath);
}

function createCheck(name, ok, detail = null) {
  return { name, ok: ok === true, detail };
}

function parseArgs(argv) {
  const options = {
    outputPath: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
    requireBrowserExecution: process.env.RMT_VNEXT_SOURCE_TO_SEA_REQUIRE_BROWSER === '1',
    validateArtifact: false,
    validateArtifactPath: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--output' && next) {
      options.outputPath = next;
      index += 1;
    } else if (arg === '--validate-artifact') {
      options.validateArtifact = true;
      if (next && !next.startsWith('--')) {
        options.validateArtifactPath = next;
        index += 1;
      }
    } else if (arg === '--require-browser') {
      options.requireBrowserExecution = true;
    } else if (arg === '--engine' && next) {
      options.requireBrowserExecution = true;
      options.engine = next;
      index += 1;
    } else if (arg === '--timeout-ms' && next) {
      options.timeoutMs = Number(next);
      index += 1;
    } else if (arg === '--simulate-fatal-before-report') {
      options.simulateFatalBeforeReport = true;
    }
  }

  return options;
}

function writeFatalEvidenceReport(error, options, rootDir) {
  const outputPath = resolveReportOutputPath(
    options.outputPath || RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
    rootDir
  );
  const reason = error && error.message ? error.message : String(error);
  const driver = options.engine || process.env.XTEND_BROWSER_HYPERVISOR_ENGINE || null;
  const checks = [
    createCheck('source-to-sea capture reached fatal error fallback', true, outputPath),
    createCheck('source-to-sea evidence capture completed', false, reason)
  ];
  const report = {
    schema: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_SCHEMA,
    workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
    ok: false,
    status: 'failed',
    source: null,
    browserFixture: null,
    resultKey: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
    artifact: {
      path: RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
      browserExecutionRequired: options.requireBrowserExecution === true,
      browserExecutionStatus: 'failed'
    },
    evidence: null,
    objectMatrix: null,
    browserExecution: {
      schema: RMT_VNEXT_BROWSER_EXECUTION_EVIDENCE_SCHEMA,
      workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
      resultKey: RMT_VNEXT_SOURCE_TO_SEA_RESULT_KEY,
      fixture: null,
      url: null,
      driver,
      required: options.requireBrowserExecution === true,
      ok: false,
      status: 'failed',
      mode: 'fatal-error',
      reason,
      checks
    },
    ciArtifactValidation: {
      schema: RMT_VNEXT_SOURCE_TO_SEA_CI_ARTIFACT_SCHEMA,
      workpackage: RMT_VNEXT_SOURCE_TO_SEA_WORKPACKAGE,
      ok: false,
      status: 'failed',
      required: true,
      driver,
      artifactPath: outputPath,
      replayed: false,
      checks
    },
    fatalError: {
      message: reason,
      stack: error && error.stack ? error.stack : null
    },
    checks
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  return outputPath;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const options = parseArgs(process.argv.slice(2));
  const {
    validateRmtVNextSourceToSeaCiArtifactFile,
    writeRmtVNextSourceToSeaEvidenceReport
  } = require('../tools/rmt-language/vnext-source-to-sea');

  if (options.validateArtifact) {
    const validation = validateRmtVNextSourceToSeaCiArtifactFile(
      options.validateArtifactPath || options.outputPath,
      { rootDir, expectedBrowserDriver: options.engine }
    );
    const failedChecks = (validation.checks || [])
      .filter((check) => !check.ok)
      .map((check) => check.name);

    console.log(`RMT vNext Source-to-Sea CI artifact replay path: ${validation.artifactPath}`);
    console.log(`RMT vNext Source-to-Sea CI artifact validation status: ${validation.status}`);
    if (failedChecks.length > 0) {
      console.log(`RMT vNext Source-to-Sea CI artifact validation failed checks: ${failedChecks.join(', ')}`);
    }

    if (!validation.ok) {
      process.exitCode = 1;
    }
    return;
  }

  if (options.simulateFatalBeforeReport) {
    throw new Error('simulated source-to-sea capture fatal error before report write');
  }

  const result = await writeRmtVNextSourceToSeaEvidenceReport({
    rootDir,
    outputPath: options.outputPath,
    requireBrowserExecution: options.requireBrowserExecution,
    engine: options.engine,
    timeoutMs: options.timeoutMs
  });

  console.log(`RMT vNext Source-to-Sea evidence written: ${result.outputPath}`);
  console.log(`RMT vNext Source-to-Sea evidence status: ${result.report.status}`);
  if (result.report.ciArtifactValidation) {
    console.log(`RMT vNext Source-to-Sea CI artifact validation status: ${result.report.ciArtifactValidation.status}`);
  }
  if (result.report.browserExecution && result.report.browserExecution.status === 'skipped') {
    console.log(`RMT vNext Source-to-Sea browser execution skipped: ${result.report.browserExecution.reason}`);
  }

  if (!result.report.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const rootDir = path.resolve(__dirname, '..');
  const options = parseArgs(process.argv.slice(2));
  console.error(error && error.stack ? error.stack : error);
  if (!options.validateArtifact) {
    try {
      const outputPath = writeFatalEvidenceReport(error, options, rootDir);
      console.error(`RMT vNext Source-to-Sea failure evidence written: ${outputPath}`);
    } catch (writeError) {
      console.error(writeError && writeError.stack ? writeError.stack : writeError);
    }
  }
  process.exitCode = 1;
});

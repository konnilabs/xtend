#!/usr/bin/env node

const path = require('path');
const {
  RMT_VNEXT_SOURCE_TO_SEA_EVIDENCE_REPORT_PATH,
  validateRmtVNextSourceToSeaCiArtifactFile,
  writeRmtVNextSourceToSeaEvidenceReport
} = require('../tools/rmt-language/vnext-source-to-sea');

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
    } else if (arg === '--chromedriver') {
      options.requireBrowserExecution = true;
      options.browserDriver = 'chromedriver';
    } else if (arg === '--driver' && next) {
      options.browserDriver = next;
      index += 1;
    } else if (arg === '--chromedriver-path' && next) {
      options.chromeDriverPath = next;
      index += 1;
    } else if (arg === '--webdriver-url' && next) {
      options.webDriverUrl = next;
      index += 1;
    } else if (arg === '--webdriver-port' && next) {
      options.webDriverPort = Number(next);
      index += 1;
    } else if (arg === '--browser-name' && next) {
      options.browserName = next;
      index += 1;
    } else if (arg === '--timeout-ms' && next) {
      options.timeoutMs = Number(next);
      index += 1;
    }
  }

  return options;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const options = parseArgs(process.argv.slice(2));

  if (options.validateArtifact) {
    const validation = validateRmtVNextSourceToSeaCiArtifactFile(
      options.validateArtifactPath || options.outputPath,
      { rootDir }
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

  const result = await writeRmtVNextSourceToSeaEvidenceReport({
    rootDir,
    outputPath: options.outputPath,
    requireBrowserExecution: options.requireBrowserExecution,
    browserDriver: options.browserDriver,
    chromeDriverPath: options.chromeDriverPath,
    webDriverUrl: options.webDriverUrl,
    webDriverPort: options.webDriverPort,
    browserName: options.browserName,
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
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

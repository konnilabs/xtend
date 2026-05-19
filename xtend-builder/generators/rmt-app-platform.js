'use strict';

const fs = require('fs');
const path = require('path');
const {
  requireLocalOrScoped
} = require('../lib/package-resolver');
const {
  analyzeRmtAppPlatformSource,
  createRmtAppPlatformScaffoldPlan,
  RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
  RMT_APP_PLATFORM_TOOLING_LOCAL_GATE
} = requireLocalOrScoped(
  __filename,
  '../../tools/rmt-language/app-platform-tooling',
  '@ccslabs/xtend-compiler/rmt-language/app-platform-tooling'
);
const {
  normalizeRelativePath,
  writeScaffoldFiles
} = require('../writing/write-plan');

const RMT_APP_PLATFORM_BUILD_SCHEMA = 'xtend.scaffold.rmt-app-platform-build.v1';
const RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA = 'xtend.scaffold.rmt-app-platform-build-report.v1';
const DEFAULT_SOURCE_PATH = 'tests/fixtures/rmt-app-platform-tooling.rmt';
const DEFAULT_LOCAL_GATE = RMT_APP_PLATFORM_TOOLING_LOCAL_GATE;

function toBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function resolveBuildPaths(input = {}) {
  const rawSource = input.source || input.src || (Array.isArray(input._) ? input._[0] : null) || DEFAULT_SOURCE_PATH;
  const normalized = normalizeRelativePath(rawSource);
  if (!normalized.ok) {
    return {
      ok: false,
      errors: [normalized.error]
    };
  }
  if (!normalized.path.endsWith('.rmt')) {
    return {
      ok: false,
      errors: [`RMT App Platform source "${normalized.path}" must be a .rmt document.`]
    };
  }
  const sourcePath = normalized.path;
  const sourceDir = path.posix.dirname(sourcePath);
  const baseName = path.posix.basename(sourcePath, '.rmt');
  const outputDir = input.outputDir || input['output-dir'] || (sourceDir === '.' ? '.xtend-build' : `${sourceDir}/.xtend-build`);
  return {
    ok: true,
    errors: [],
    sourcePath,
    sourceDir,
    baseName,
    reportPath: input.report || `${outputDir}/${baseName}.app-platform-build.json`,
    diagnosticsPath: input.diagnostics || `${outputDir}/${baseName}.app-platform-diagnostics.json`,
    sourceMapPath: input.sourceMap || input['source-map'] || `${outputDir}/${baseName}.app-platform-source-map.json`
  };
}

function createOutputs(paths, analysis, scaffoldPlan, report) {
  return [
    {
      id: 'diagnostics',
      path: paths.diagnosticsPath,
      kind: 'rmt-app-platform-diagnostics',
      generated: true,
      content: stableJson(analysis)
    },
    {
      id: 'source-map',
      path: paths.sourceMapPath,
      kind: 'rmt-app-platform-source-map',
      generated: true,
      content: stableJson(analysis.sourceMap)
    },
    {
      id: 'scaffold-plan',
      path: paths.reportPath,
      kind: 'rmt-app-platform-build-report',
      generated: true,
      content: stableJson(report)
    }
  ];
}

function summarizeOutput(output) {
  return {
    id: output.id,
    path: output.path,
    kind: output.kind,
    generated: output.generated
  };
}

function createRmtAppPlatformBuild(input = {}, options = {}) {
  const rootDir = path.resolve(options.rootDir || input.rootDir || input['root-dir'] || process.cwd());
  const write = toBoolean(input.write);
  const check = toBoolean(input.check);
  const paths = resolveBuildPaths(input);
  if (!paths.ok) {
    return {
      schema: RMT_APP_PLATFORM_BUILD_SCHEMA,
      ok: false,
      status: 'invalid_input',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      errors: paths.errors,
      outputs: []
    };
  }

  const absoluteSourcePath = path.resolve(rootDir, paths.sourcePath);
  if (!fs.existsSync(absoluteSourcePath)) {
    return {
      schema: RMT_APP_PLATFORM_BUILD_SCHEMA,
      ok: false,
      status: 'source_missing',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      errors: [`RMT App Platform source "${paths.sourcePath}" does not exist.`],
      outputs: []
    };
  }

  const text = fs.readFileSync(absoluteSourcePath, 'utf8');
  const analysis = analyzeRmtAppPlatformSource({
    text,
    filePath: absoluteSourcePath,
    source: paths.sourcePath,
    version: 1
  }, {
    rootDir
  });
  const scaffoldPlan = createRmtAppPlatformScaffoldPlan({
    text,
    filePath: absoluteSourcePath,
    source: paths.sourcePath,
    version: 1
  }, {
    rootDir
  });
  const report = {
    schema: RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA,
    buildSchema: RMT_APP_PLATFORM_BUILD_SCHEMA,
    scaffoldSchema: RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
    status: analysis.ok ? 'planned' : 'blocked',
    ok: analysis.ok,
    source: paths.sourcePath,
    localGate: DEFAULT_LOCAL_GATE,
    generated: {
      diagnostics: paths.diagnosticsPath,
      sourceMap: paths.sourceMapPath,
      report: paths.reportPath
    },
    diagnosticSummary: analysis.summary,
    sourceMapSummary: {
      totalCount: analysis.sourceMap.totalCount,
      byDomain: analysis.sourceMap.byDomain
    },
    checks: scaffoldPlan.report.checks,
    boundaries: [
      'diagnostics-before-runtime',
      'source-map-before-browser-smoke',
      'no-product-local-registry-repaint',
      'no-manual-shell-html-sinks',
      'no-rmt-kernel-import-of-xtend-types'
    ]
  };
  const outputs = createOutputs(paths, analysis, scaffoldPlan, report);
  const writeReport = writeScaffoldFiles(outputs, {
    rootDir,
    write,
    check,
    force: toBoolean(input.force),
    generator: 'rmt-app-platform',
    owner: `rmt-app-platform:${paths.baseName}`,
    allowedRoots: [
      '.xtend-build/',
      `${paths.sourceDir}/.xtend-build/`,
      'tests/fixtures/.xtend-build/',
      paths.reportPath,
      paths.diagnosticsPath,
      paths.sourceMapPath
    ]
  });

  if (!writeReport.ok) {
    return {
      schema: RMT_APP_PLATFORM_BUILD_SCHEMA,
      ok: false,
      status: writeReport.status,
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      errors: writeReport.errors,
      diagnostics: analysis.diagnostics,
      sourceMap: analysis.sourceMap,
      outputs: outputs.map(summarizeOutput),
      writePlan: writeReport.plan,
      written: writeReport.writes,
      ownershipManifest: writeReport.ownershipManifest
    };
  }

  return {
    schema: RMT_APP_PLATFORM_BUILD_SCHEMA,
    reportSchema: RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA,
    scaffoldSchema: RMT_APP_PLATFORM_SCAFFOLD_SCHEMA,
    ok: analysis.ok,
    status: write ? writeReport.status : (check ? writeReport.status : report.status),
    mode: write ? 'write' : (check ? 'check' : 'dry-run'),
    source: paths.sourcePath,
    localGate: DEFAULT_LOCAL_GATE,
    report,
    diagnostics: analysis.diagnostics,
    sourceMap: analysis.sourceMap,
    outputs: outputs.map((output) => ({
      ...summarizeOutput(output),
      content: output.content
    })),
    writePlan: writeReport.plan,
    written: writeReport.writes,
    ownershipManifest: writeReport.ownershipManifest
  };
}

module.exports = {
  DEFAULT_LOCAL_GATE,
  DEFAULT_SOURCE_PATH,
  RMT_APP_PLATFORM_BUILD_REPORT_SCHEMA,
  RMT_APP_PLATFORM_BUILD_SCHEMA,
  createRmtAppPlatformBuild,
  resolveBuildPaths
};

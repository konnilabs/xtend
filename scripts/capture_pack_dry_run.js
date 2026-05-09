#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  PACKAGE_DRY_RUN_ARTIFACT,
  PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT,
  PACKAGE_EXPORT_SURFACE_ARTIFACT,
  createEpic13PackageExportLockPlan,
  createEpic13PackageExportLockReport
} = require('../catalog/epic13-package-export-lock');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.resolve(rootDir, '.xtend-test-results');
const cacheDir = process.env.XTEND_NPM_CACHE
  ? path.resolve(process.env.XTEND_NPM_CACHE)
  : path.resolve(outputDir, 'npm-cache');

function writeJson(relativePath, value) {
  const targetPath = path.resolve(rootDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

function parsePackJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(cacheDir, { recursive: true });

const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: rootDir,
  encoding: 'utf8',
  env: {
    ...process.env,
    npm_config_cache: cacheDir,
    NPM_CONFIG_CACHE: cacheDir
  }
});

if (result.status !== 0) {
  writeJson(PACKAGE_DRY_RUN_ARTIFACT, {
    ok: false,
    command: 'npm pack --dry-run --json',
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr
  });
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

const packArtifact = parsePackJson(result.stdout);
const plan = createEpic13PackageExportLockPlan({ packDryRunArtifact: packArtifact });
const report = createEpic13PackageExportLockReport({ plan });

writeJson(PACKAGE_DRY_RUN_ARTIFACT, packArtifact);
writeJson(PACKAGE_EXPORT_SURFACE_ARTIFACT, plan.surfaceSnapshot);
writeJson(PACKAGE_EXPORT_LOCK_REPORT_ARTIFACT, report);

process.stdout.write(`${JSON.stringify({
  schema: report.schema,
  ok: report.ok,
  exportCount: report.exportCount,
  packageFileRootCount: report.packageFileRootCount,
  surfaceGroupCount: report.surfaceGroupCount,
  packFileCount: plan.packDryRunArtifact.fileCount,
  packageDryRunArtifact: plan.packageDryRunArtifact,
  packageExportSurfaceArtifact: plan.packageExportSurfaceArtifact,
  packageExportLockReportArtifact: plan.packageExportLockReportArtifact,
  nextWorkpackage: report.nextWorkpackage
}, null, 2)}\n`);

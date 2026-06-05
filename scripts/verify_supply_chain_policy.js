#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DEPENDENCY_SECTIONS,
  LOCKFILE_CANDIDATES,
  SCOPED_RELEASE_PACKAGES,
  createSupplyChainGatePlan,
  classifyPackageSupplyChain
} = require('../security/supply-chain-gate-policy');
const {
  syncXtendPackageVersions
} = require('./sync_xtend_package_versions');

const REPORT_SCHEMA = 'xtend.security.supply-chain-report.v1';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileExists(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function createCheck(name, ok, detail = {}) {
  return {
    name,
    ok: Boolean(ok),
    ...detail
  };
}

function runSupplyChainVerification(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const packageManifest = readJson(path.join(rootDir, 'package.json'));
  const lockfiles = LOCKFILE_CANDIDATES.filter((candidate) => fileExists(rootDir, candidate));
  const plan = createSupplyChainGatePlan();
  const classification = classifyPackageSupplyChain(packageManifest, lockfiles);
  const releaseGates = packageManifest.xtend && Array.isArray(packageManifest.xtend.releaseGates)
    ? packageManifest.xtend.releaseGates
    : [];
  const scripts = packageManifest.scripts || {};
  const exportsMap = packageManifest.exports || {};
  const packageFiles = Array.isArray(packageManifest.files) ? packageManifest.files : [];
  const workspacePaths = Array.isArray(packageManifest.workspaces) ? packageManifest.workspaces : [];
  const scopedPackageMetadata = Array.isArray(packageManifest.scopedPackages) ? packageManifest.scopedPackages : [];
  const versionSyncReport = syncXtendPackageVersions({ rootDir, check: true });
  const checks = [];

  checks.push(createCheck(
    'root package is scoped for CCS Labs release',
    packageManifest.name === '@ccslabs/xtend'
  ));
  checks.push(createCheck(
    'root package declares scoped workspaces',
    SCOPED_RELEASE_PACKAGES
      .filter((entry) => entry.path !== '.')
      .every((entry) => workspacePaths.includes(entry.path))
  ));
  checks.push(createCheck(
    'root package documents scoped install choices',
    SCOPED_RELEASE_PACKAGES.every((entry) => (
      scopedPackageMetadata.some((candidate) => (
        candidate
          && candidate.name === entry.name
          && candidate.path === entry.path
          && candidate.install === `npm install ${entry.name}`
      ))
    ))
  ));
  SCOPED_RELEASE_PACKAGES.forEach((entry) => {
    const manifest = readJson(path.join(rootDir, entry.manifest));
    checks.push(createCheck(
      `scoped manifest ${entry.name} matches root release package`,
      manifest.name === entry.name
        && manifest.version === packageManifest.version
        && manifest.private === false
        && manifest.license === 'Apache-2.0'
    ));
    checks.push(createCheck(
      `scoped manifest ${entry.name} prepares public provenance`,
      manifest.publishConfig
        && manifest.publishConfig.access === 'public'
        && manifest.publishConfig.provenance === true
      && manifest.publishConfig.tag === 'latest'
    ));
  });
  checks.push(createCheck(
    'package manifests and lockfile match root release version',
    versionSyncReport.ok === true,
    { changedFiles: versionSyncReport.changedFiles }
  ));
  checks.push(createCheck(
    'package declares enterprise release strategy schema',
    packageManifest.xtend && packageManifest.xtend.schema === 'xtend.package-export.release-strategy.v1'
  ));
  checks.push(createCheck(
    'package private boundary is opened for RC1 owner publish prep',
    packageManifest.private === false
  ));
  checks.push(createCheck(
    'project package license is Apache-2.0',
    packageManifest.license === 'Apache-2.0'
  ));
  checks.push(createCheck(
    'npm provenance is prepared for later public releases',
    packageManifest.publishConfig && packageManifest.publishConfig.provenance === true
  ));
  checks.push(createCheck(
    'supply-chain policy module is exported',
    (typeof exportsMap['./security/supply-chain-gate-policy'] === 'string'
      ? exportsMap['./security/supply-chain-gate-policy']
      : exportsMap['./security/supply-chain-gate-policy'].default) === './security/supply-chain-gate-policy.js'
  ));
  checks.push(createCheck(
    'security directory is part of the package surface',
    packageFiles.includes('security')
  ));
  checks.push(createCheck(
    'local supply-chain test script is available',
    scripts['test:supply-chain'] === 'node scripts/run_xtend_tests.js supply-chain'
  ));
  checks.push(createCheck(
    'local supply-chain verify script is available',
    scripts['supply-chain:verify'] === 'node scripts/verify_supply_chain_policy.js'
  ));
  checks.push(createCheck(
    'release gates include supply-chain suite',
    releaseGates.includes('npm run test:supply-chain')
  ));
  checks.push(createCheck(
    'release gates retain full test run',
    releaseGates.includes('npm run test:release:full:report')
  ));
  checks.push(createCheck(
    'release gates retain package dry-run',
    releaseGates.includes('npm run pack:dry-run')
  ));
  checks.push(createCheck(
    'dependency inventory is lockfile-safe',
    classification.ok,
    {
      dependencyCount: classification.dependencyCount,
      lockfiles
    }
  ));
  checks.push(createCheck(
    'dependency sections are known to the policy',
    DEPENDENCY_SECTIONS.every((section) => plan.dependencySections.includes(section))
  ));
  checks.push(createCheck(
    'license policy records Apache-2.0 project decision',
    plan.license.currentPackageLicense === 'Apache-2.0'
      && plan.license.projectLicenseDecision === 'accepted-apache-2.0'
      && plan.license.publicReleaseRequiresLicenseDecision === false
  ));
  checks.push(createCheck(
    'vulnerability policy blocks high and critical release findings',
    plan.vulnerabilities.publishBlockingSeverities.includes('critical')
      && plan.vulnerabilities.publishBlockingSeverities.includes('high')
  ));
  checks.push(createCheck(
    'ci network audit commands are planned but not part of the local default gate',
    plan.ciNetworkGates.includes('npm audit --audit-level=moderate')
      && plan.ciNetworkGates.includes('npm sbom --sbom-format=cyclonedx --json')
  ));

  const failures = checks.filter((check) => !check.ok);

  return {
    schema: REPORT_SCHEMA,
    status: failures.length === 0 ? 'passed' : 'failed',
    ok: failures.length === 0,
    planSchema: plan.schema,
    dependencyAuditGate: plan.dependencyAuditGate,
    licensePolicy: plan.licensePolicy,
    vulnerabilityPolicy: plan.vulnerabilityPolicy,
    releaseGate: plan.releaseGate,
    checks,
    failures,
    classification
  };
}

function parseArgs(args) {
  return {
    json: args.includes('--json')
  };
}

function printTextReport(report) {
  if (!report.ok) {
    console.error('XTend Supply-Chain Policy Gate fehlgeschlagen:\n');
    report.failures.forEach((failure) => {
      console.error(`- ${failure.name}`);
    });
    return;
  }

  console.log('XTend Supply-Chain Policy Gate erfolgreich.\n');
  report.checks.forEach((check) => {
    console.log(`- ${check.name}`);
  });
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));
  const report = runSupplyChainVerification();

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTextReport(report);
  }

  process.exitCode = report.ok ? 0 : 1;
}

module.exports = {
  REPORT_SCHEMA,
  runSupplyChainVerification
};

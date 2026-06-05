const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  DEPENDENCY_AUDIT_GATE_CONTRACT,
  LICENSE_POLICY_CONTRACT,
  RELEASE_SUPPLY_CHAIN_GATE_CONTRACT,
  SCOPED_RELEASE_PACKAGES,
  SUPPLY_CHAIN_GATE_PLAN_CONTRACT,
  VULNERABILITY_POLICY_CONTRACT,
  createSupplyChainGatePlan,
  classifyPackageSupplyChain
} = require('../../security/supply-chain-gate-policy');
const {
  REPORT_SCHEMA,
  runSupplyChainVerification
} = require('../../scripts/verify_supply_chain_policy');

function runSupplyChainPolicySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'supply-chain',
    label: 'XTend Supply-Chain policy gates'
  });
  const packageManifest = readJson('package.json', rootDir);
  const policySource = readText('security/supply-chain-gate-policy.js', rootDir);
  const verifySource = readText('scripts/verify_supply_chain_policy.js', rootDir);
  const versionSyncSource = readText('scripts/sync_xtend_package_versions.js', rootDir);
  const plan = createSupplyChainGatePlan();
  const classification = classifyPackageSupplyChain(packageManifest, []);
  const report = runSupplyChainVerification({ rootDir });

  context.assertIncludes(policySource, 'xtend.security.supply-chain-gate-plan.v1', 'Policy module declares supply-chain gate plan contract');
  context.assertIncludes(policySource, 'xtend.security.dependency-audit-gate.v1', 'Policy module declares dependency audit gate contract');
  context.assertIncludes(policySource, 'xtend.security.license-policy.v1', 'Policy module declares license policy contract');
  context.assertIncludes(policySource, 'xtend.security.vulnerability-policy.v1', 'Policy module declares vulnerability policy contract');
  context.assertIncludes(policySource, 'npm audit --audit-level=moderate', 'Policy plans npm audit CI gate');
  context.assertIncludes(policySource, 'npm sbom --sbom-format=cyclonedx --json', 'Policy plans npm SBOM CI gate');
  context.assertIncludes(verifySource, REPORT_SCHEMA, 'Verify script declares supply-chain report schema');
  context.assertIncludes(versionSyncSource, 'xtend.release.package-version-sync-report.v1', 'Version sync helper declares stable report schema');
  context.assert(SUPPLY_CHAIN_GATE_PLAN_CONTRACT === 'xtend.security.supply-chain-gate-plan.v1', 'Exports supply-chain plan contract');
  context.assert(DEPENDENCY_AUDIT_GATE_CONTRACT === 'xtend.security.dependency-audit-gate.v1', 'Exports dependency audit contract');
  context.assert(LICENSE_POLICY_CONTRACT === 'xtend.security.license-policy.v1', 'Exports license policy contract');
  context.assert(VULNERABILITY_POLICY_CONTRACT === 'xtend.security.vulnerability-policy.v1', 'Exports vulnerability policy contract');
  context.assert(RELEASE_SUPPLY_CHAIN_GATE_CONTRACT === 'xtend.security.release-supply-chain-gate.v1', 'Exports release supply-chain gate contract');
  context.assert(Array.isArray(SCOPED_RELEASE_PACKAGES) && SCOPED_RELEASE_PACKAGES.length === 6, 'Exports scoped release package matrix');
  context.assert(SCOPED_RELEASE_PACKAGES.some((entry) => entry.name === '@ccslabs/xtend-maraca' && entry.path === 'xtend-maraca'), 'Scoped release package matrix includes Maraca');
  context.assert(plan.localGate === 'node scripts/verify_supply_chain_policy.js --json', 'Plan exposes offline local verify command');
  context.assert(plan.packageScript === 'npm run test:supply-chain', 'Plan exposes package test script');
  context.assert(plan.scopedReleasePackages.length === SCOPED_RELEASE_PACKAGES.length, 'Plan exposes scoped release packages');
  context.assert(plan.releaseScripts.includes('npm run test:supply-chain'), 'Plan includes supply-chain suite in release scripts');
  context.assert(plan.ciNetworkGates.includes('npm audit --audit-level=moderate'), 'Plan includes CI vulnerability audit');
  context.assert(plan.ciNetworkGates.includes('npm sbom --sbom-format=cyclonedx --json'), 'Plan includes CI SBOM export');
  context.assert(plan.license.currentPackageLicense === 'Apache-2.0', 'License policy records Apache-2.0 package license');
  context.assert(plan.license.projectLicenseDecision === 'accepted-apache-2.0', 'License policy records accepted Apache-2.0 decision');
  context.assert(plan.license.publicReleaseRequiresLicenseDecision === false, 'License policy no longer blocks on missing project license decision');
  context.assert(plan.vulnerabilities.zeroCriticalForAnyRelease === true, 'Vulnerability policy blocks critical findings for any release');
  context.assert(packageManifest.private === false, 'Package private boundary is opened for RC1 owner publish prep');
  context.assert(packageManifest.name === '@ccslabs/xtend', 'Root package is scoped under @ccslabs');
  context.assert(Array.isArray(packageManifest.workspaces) && packageManifest.workspaces.includes('xtendrmt'), 'Root package includes RMT workspace');
  context.assert(Array.isArray(packageManifest.workspaces) && packageManifest.workspaces.includes('fabric'), 'Root package includes Fabric workspace');
  context.assert(Array.isArray(packageManifest.workspaces) && packageManifest.workspaces.includes('xtend-builder'), 'Root package includes CLI workspace');
  context.assert(Array.isArray(packageManifest.workspaces) && packageManifest.workspaces.includes('tools'), 'Root package includes compiler workspace');
  context.assert(Array.isArray(packageManifest.workspaces) && packageManifest.workspaces.includes('xtend-maraca'), 'Root package includes Maraca workspace');
  SCOPED_RELEASE_PACKAGES.forEach((entry) => {
    const manifest = readJson(entry.manifest, rootDir);
    context.assert(manifest.name === entry.name, `${entry.name} scoped manifest declares package name`);
    context.assert(manifest.version === packageManifest.version, `${entry.name} scoped manifest matches root version`);
    context.assert(manifest.private === false, `${entry.name} scoped manifest is public-ready`);
    context.assert(manifest.license === 'Apache-2.0', `${entry.name} scoped manifest uses Apache-2.0`);
    context.assert(manifest.publishConfig && manifest.publishConfig.access === 'public', `${entry.name} scoped manifest publishes publicly`);
  });
  context.assert(packageManifest.license === 'Apache-2.0', 'Package license is Apache-2.0');
  context.assert(packageManifest.publishConfig && packageManifest.publishConfig.provenance === true, 'Package prepares npm provenance');
  const supplyChainPolicyExport = packageManifest.exports['./security/supply-chain-gate-policy'];
  context.assert((typeof supplyChainPolicyExport === 'string' ? supplyChainPolicyExport : supplyChainPolicyExport.default) === './security/supply-chain-gate-policy.js', 'Package exports supply-chain policy module');
  context.assert(packageManifest.scripts['test:supply-chain'] === 'node scripts/run_xtend_tests.js supply-chain', 'Package exposes supply-chain suite script');
  context.assert(packageManifest.scripts['supply-chain:verify'] === 'node scripts/verify_supply_chain_policy.js', 'Package exposes offline supply-chain verify script');
  context.assert(packageManifest.scripts['release:sync-versions'] === 'node scripts/sync_xtend_package_versions.js', 'Package exposes release version sync script');
  context.assert(packageManifest.xtend.releaseGates.includes('npm run test:supply-chain'), 'Release gates include supply-chain gate');
  context.assert(classification.ok === true, 'Current dependency inventory passes offline classification');
  context.assert(classification.dependencyCount === 0, 'Current package has no external dependency inventory');
  context.assert(report.schema === REPORT_SCHEMA, 'Verify script returns supply-chain report schema');
  context.assert(report.ok === true, 'Verify script passes for current package');
  context.assert(report.checks.length >= 10, 'Verify script performs multiple supply-chain checks');

  return context.result({
    plan,
    report
  });
}

function printSupplyChainPolicyReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Supply-Chain Policy Gates erfolgreich.',
    failureTitle: 'XTend Supply-Chain Policy Gates fehlgeschlagen:'
  });
}

module.exports = {
  printSupplyChainPolicyReport,
  runSupplyChainPolicySuite
};

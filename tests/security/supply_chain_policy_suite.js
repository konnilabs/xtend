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
  const plan = createSupplyChainGatePlan();
  const classification = classifyPackageSupplyChain(packageManifest, []);
  const report = runSupplyChainVerification({ rootDir });

  context.assertIncludes(policySource, 'xtend.security.supply-chain-gate-plan.v1', 'Policy module declares supply-chain gate plan contract');
  context.assertIncludes(policySource, 'xtend.security.dependency-audit-gate.v1', 'Policy module declares dependency audit gate contract');
  context.assertIncludes(policySource, 'xtend.security.license-policy.v1', 'Policy module declares license policy contract');
  context.assertIncludes(policySource, 'xtend.security.vulnerability-policy.v1', 'Policy module declares vulnerability policy contract');
  context.assertIncludes(policySource, 'npm audit --audit-level=moderate', 'Policy plans npm audit CI gate');
  context.assertIncludes(policySource, 'npm sbom --json', 'Policy plans npm SBOM CI gate');
  context.assertIncludes(verifySource, REPORT_SCHEMA, 'Verify script declares supply-chain report schema');
  context.assert(SUPPLY_CHAIN_GATE_PLAN_CONTRACT === 'xtend.security.supply-chain-gate-plan.v1', 'Exports supply-chain plan contract');
  context.assert(DEPENDENCY_AUDIT_GATE_CONTRACT === 'xtend.security.dependency-audit-gate.v1', 'Exports dependency audit contract');
  context.assert(LICENSE_POLICY_CONTRACT === 'xtend.security.license-policy.v1', 'Exports license policy contract');
  context.assert(VULNERABILITY_POLICY_CONTRACT === 'xtend.security.vulnerability-policy.v1', 'Exports vulnerability policy contract');
  context.assert(RELEASE_SUPPLY_CHAIN_GATE_CONTRACT === 'xtend.security.release-supply-chain-gate.v1', 'Exports release supply-chain gate contract');
  context.assert(plan.localGate === 'node scripts/verify_supply_chain_policy.js --json', 'Plan exposes offline local verify command');
  context.assert(plan.packageScript === 'npm run test:supply-chain', 'Plan exposes package test script');
  context.assert(plan.releaseScripts.includes('npm run test:supply-chain'), 'Plan includes supply-chain suite in release scripts');
  context.assert(plan.ciNetworkGates.includes('npm audit --audit-level=moderate'), 'Plan includes CI vulnerability audit');
  context.assert(plan.ciNetworkGates.includes('npm sbom --json'), 'Plan includes CI SBOM export');
  context.assert(plan.license.publicReleaseRequiresLicenseDecision === true, 'License policy blocks public release until license decision');
  context.assert(plan.vulnerabilities.zeroCriticalForAnyRelease === true, 'Vulnerability policy blocks critical findings for any release');
  context.assert(packageManifest.private === true, 'Package remains private during ER-WP-30');
  context.assert(packageManifest.license === 'UNLICENSED', 'Private package license is explicit');
  context.assert(packageManifest.publishConfig && packageManifest.publishConfig.provenance === true, 'Package prepares npm provenance');
  const supplyChainPolicyExport = packageManifest.exports['./security/supply-chain-gate-policy'];
  context.assert((typeof supplyChainPolicyExport === 'string' ? supplyChainPolicyExport : supplyChainPolicyExport.default) === './security/supply-chain-gate-policy.js', 'Package exports supply-chain policy module');
  context.assert(packageManifest.scripts['test:supply-chain'] === 'node scripts/run_xtend_tests.js supply-chain', 'Package exposes supply-chain suite script');
  context.assert(packageManifest.scripts['supply-chain:verify'] === 'node scripts/verify_supply_chain_policy.js', 'Package exposes offline supply-chain verify script');
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

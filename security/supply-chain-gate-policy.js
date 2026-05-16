const SUPPLY_CHAIN_GATE_PLAN_CONTRACT = 'xtend.security.supply-chain-gate-plan.v1';
const DEPENDENCY_AUDIT_GATE_CONTRACT = 'xtend.security.dependency-audit-gate.v1';
const LICENSE_POLICY_CONTRACT = 'xtend.security.license-policy.v1';
const VULNERABILITY_POLICY_CONTRACT = 'xtend.security.vulnerability-policy.v1';
const RELEASE_SUPPLY_CHAIN_GATE_CONTRACT = 'xtend.security.release-supply-chain-gate.v1';

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
];

const LOCKFILE_CANDIDATES = [
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock'
];

const SCOPED_RELEASE_PACKAGES = Object.freeze([
  {
    name: '@ccslabs/xtend',
    path: '.',
    manifest: 'package.json',
    scope: 'complete-stack'
  },
  {
    name: '@ccslabs/xtend-rmt',
    path: 'xtendrmt',
    manifest: 'xtendrmt/package.json',
    scope: 'rmt-runtime'
  },
  {
    name: '@ccslabs/xtend-fabric',
    path: 'fabric',
    manifest: 'fabric/package.json',
    scope: 'fabric-runtime'
  },
  {
    name: '@ccslabs/xtend-cli',
    path: 'xtend-builder',
    manifest: 'xtend-builder/package.json',
    scope: 'builder-cli'
  },
  {
    name: '@ccslabs/xtend-compiler',
    path: 'tools',
    manifest: 'tools/package.json',
    scope: 'rmt-compiler-tooling'
  }
]);

const LICENSE_POLICY = {
  currentPackageLicense: 'Apache-2.0',
  projectLicenseDecision: 'accepted-apache-2.0',
  privatePackageAllowedLicenses: ['Apache-2.0'],
  publicReleaseRequiresLicenseDecision: false,
  publicReleaseLicenseDecision: 'accepted-apache-2.0',
  allowedDependencyLicenses: [
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'MIT',
    'MPL-2.0',
    'Unicode-DFS-2016'
  ],
  reviewRequiredLicenses: [
    'BlueOak-1.0.0',
    'CC-BY-4.0',
    'CC0-1.0',
    'LGPL-2.1-only',
    'LGPL-2.1-or-later',
    'LGPL-3.0-only',
    'LGPL-3.0-or-later'
  ],
  forbiddenDependencyLicenses: [
    'AGPL-1.0-only',
    'AGPL-1.0-or-later',
    'AGPL-3.0-only',
    'AGPL-3.0-or-later',
    'GPL-2.0-only',
    'GPL-2.0-or-later',
    'GPL-3.0-only',
    'GPL-3.0-or-later',
    'UNLICENSED'
  ]
};

const VULNERABILITY_POLICY = {
  productionAuditLevel: 'moderate',
  developmentAuditLevel: 'high',
  publishBlockingSeverities: ['critical', 'high'],
  zeroCriticalForAnyRelease: true,
  noKnownExploitForReleaseCandidate: true,
  networkAuditStage: 'ci-release-gate',
  localGateMode: 'offline-policy-and-inventory'
};

const SUPPLY_CHAIN_GATES = [
  {
    id: 'dependency-inventory',
    contract: DEPENDENCY_AUDIT_GATE_CONTRACT,
    stage: 'local',
    command: 'node scripts/verify_supply_chain_policy.js --json',
    mode: 'offline-static',
    blocksPublish: true
  },
  {
    id: 'license-policy',
    contract: LICENSE_POLICY_CONTRACT,
    stage: 'local',
    command: 'node scripts/verify_supply_chain_policy.js --json',
    mode: 'offline-static',
    blocksPublish: true
  },
  {
    id: 'vulnerability-policy',
    contract: VULNERABILITY_POLICY_CONTRACT,
    stage: 'ci',
    command: 'npm audit --audit-level=moderate',
    mode: 'network-audit',
    blocksPublish: true
  },
  {
    id: 'release-report',
    contract: RELEASE_SUPPLY_CHAIN_GATE_CONTRACT,
    stage: 'local',
    command: 'npm run release:report',
    mode: 'offline-test-report',
    blocksPublish: true
  },
  {
    id: 'pack-provenance-dry-run',
    contract: RELEASE_SUPPLY_CHAIN_GATE_CONTRACT,
    stage: 'local',
    command: 'npm run pack:dry-run',
    mode: 'offline-package-surface',
    blocksPublish: true
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listDependencies(packageManifest = {}) {
  return DEPENDENCY_SECTIONS.flatMap((section) => {
    const entries = packageManifest[section] && typeof packageManifest[section] === 'object'
      ? Object.entries(packageManifest[section])
      : [];

    return entries.map(([name, version]) => ({
      name,
      version,
      section
    }));
  });
}

function createSupplyChainGatePlan(options = {}) {
  return {
    schema: SUPPLY_CHAIN_GATE_PLAN_CONTRACT,
    dependencyAuditGate: DEPENDENCY_AUDIT_GATE_CONTRACT,
    licensePolicy: LICENSE_POLICY_CONTRACT,
    vulnerabilityPolicy: VULNERABILITY_POLICY_CONTRACT,
    releaseGate: RELEASE_SUPPLY_CHAIN_GATE_CONTRACT,
    mode: options.mode || 'plan-and-offline-local-gate',
    localGate: 'node scripts/verify_supply_chain_policy.js --json',
    packageScript: 'npm run test:supply-chain',
    releaseScripts: [
      'npm test',
      'npm run test:supply-chain',
      'npm run release:report',
      'npm run pack:dry-run'
    ],
    ciNetworkGates: [
      'npm audit --audit-level=moderate',
      'npm sbom --sbom-format=cyclonedx --json'
    ],
    gates: clone(SUPPLY_CHAIN_GATES),
    dependencySections: clone(DEPENDENCY_SECTIONS),
    lockfileCandidates: clone(LOCKFILE_CANDIDATES),
    scopedReleasePackages: clone(SCOPED_RELEASE_PACKAGES),
    license: clone(LICENSE_POLICY),
    vulnerabilities: clone(VULNERABILITY_POLICY),
    publishBoundary: {
      privateUntil: ['ER-WP-30', 'ER-WP-36', 'ER-WP-38'],
      currentPublishState: 'owner-approved-public-rc-boundary',
      provenanceRequired: true,
      publicReleaseRequiresLicenseDecision: false,
      licenseDecision: 'accepted-apache-2.0'
    }
  };
}

function classifyPackageSupplyChain(packageManifest = {}, lockfiles = []) {
  const dependencies = listDependencies(packageManifest);
  const hasDependencies = dependencies.length > 0;
  const hasLockfile = Array.isArray(lockfiles) && lockfiles.length > 0;
  const diagnostics = [];

  if (hasDependencies && !hasLockfile) {
    diagnostics.push('xtend.security.supply_chain.lockfile.missing');
  }

  if (packageManifest.private !== false) {
    diagnostics.push('xtend.security.supply_chain.private_boundary.missing');
  }

  if (packageManifest.license === 'UNLICENSED' && packageManifest.private !== true) {
    diagnostics.push('xtend.security.supply_chain.public_license.missing');
  }

  if (!packageManifest.publishConfig || packageManifest.publishConfig.provenance !== true) {
    diagnostics.push('xtend.security.supply_chain.provenance.missing');
  }

  return {
    schema: DEPENDENCY_AUDIT_GATE_CONTRACT,
    ok: diagnostics.length === 0,
    dependencyCount: dependencies.length,
    dependencies,
    lockfiles,
    hasLockfile,
    privatePackage: packageManifest.private === true,
    publicRcPackage: packageManifest.private === false,
    packageLicense: packageManifest.license || null,
    diagnostics
  };
}

module.exports = {
  DEPENDENCY_AUDIT_GATE_CONTRACT,
  DEPENDENCY_SECTIONS,
  LICENSE_POLICY,
  LICENSE_POLICY_CONTRACT,
  LOCKFILE_CANDIDATES,
  SCOPED_RELEASE_PACKAGES,
  RELEASE_SUPPLY_CHAIN_GATE_CONTRACT,
  SUPPLY_CHAIN_GATE_PLAN_CONTRACT,
  SUPPLY_CHAIN_GATES,
  VULNERABILITY_POLICY,
  VULNERABILITY_POLICY_CONTRACT,
  classifyPackageSupplyChain,
  createSupplyChainGatePlan,
  listDependencies
};

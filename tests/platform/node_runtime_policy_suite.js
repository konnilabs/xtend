'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRepoPath, resolveRootDir } = require('../utils/files');
const { classifyWarning } = require('../../scripts/node_warning_policy.cjs');

const NODE_RUNTIME_POLICY_SUITE_SCHEMA = 'xtend.node-runtime-policy-suite.v1';
const PUBLIC_ENGINE = '>=24';
const PRIMARY_NODE = '24.18.0';
const CANARY_NODE = '26.5.0';
const PACKAGE_MANAGER = 'npm@11.17.0';

const NODE_MANIFESTS = [
  'package.json',
  'fabric/package.json',
  'tools/package.json',
  'xsurface-shard/package.json',
  'xtend-builder/package.json',
  'xtend-maraca/package.json',
  'xtend-maraca-css-tailwind/package.json',
  'xtend-material/package.json',
  'xtendrmt/package.json',
  'products/rmt-animation-testbench/package.json',
  'products/xtend-material-workbench/package.json',
  'products/xtend-llm/package.json'
];

const GENERATED_MANIFEST_TEMPLATES = [
  'xtend-builder/templates/app/rmt-package.template.json',
  'xtend-builder/templates/app/material-package.template.json'
];

const NORMATIVE_NODE_SUPPORT_DOCS = [
  'README.md',
  'fabric/README.md',
  'tools/README.md',
  'xsurface-shard/README.md',
  'xtend-builder/README.md',
  'xtend-maraca/README.md',
  'xtendrmt/README.md',
  'products/xtend-llm/README.md',
  'docs/de/xtend-dev-surface.md',
  'docs/en/xtend-dev-surface.md',
  'docs/de/xtend-material.md',
  'docs/en/xtend-material.md',
  'development/ADR-XMS-001-Maraca-AppServices.md',
  'development/XMS-13-Vite-Dev-HMR-Spike.md',
  'development/XTend-Material-Tailwind-Architecture-Decision.md',
  'development/XTend-Material-Design-Kit-Contract.md',
  'development/XTend-Material-Release-Handoff.md'
];

function validatePolicy(context, rootDir) {
  const rootPackage = readJson('package.json', rootDir);
  const policy = rootPackage.xtend && rootPackage.xtend.nodeRuntimePolicy;
  context.assert(rootPackage.engines && rootPackage.engines.node === PUBLIC_ENGINE, 'Root package publishes the Node >=24 floor');
  context.assert(rootPackage.packageManager === PACKAGE_MANAGER, 'Root package pins npm 11.17.0');
  context.assert(rootPackage.devDependencies && /^\^24\./u.test(rootPackage.devDependencies['@types/node']), 'Type declarations remain pinned to the minimum supported Node 24 contract');
  context.assert(
    rootPackage.devEngines && rootPackage.devEngines.runtime
      && rootPackage.devEngines.runtime.version === `^${PRIMARY_NODE} || ^${CANARY_NODE}`
      && rootPackage.devEngines.runtime.onFail === 'error'
      && rootPackage.devEngines.packageManager
      && rootPackage.devEngines.packageManager.version === '11.17.0'
      && rootPackage.devEngines.packageManager.onFail === 'error',
    'Contributor devEngines fail outside the supported Node 24/26 lines'
  );
  context.assert(policy && policy.schema === 'xtend.node-runtime-policy.v1', 'Root metadata exposes the canonical Node runtime policy');
  context.assert(
    policy && policy.publicEngine === PUBLIC_ENGINE
      && policy.primary === PRIMARY_NODE
      && policy.requiredCanary === CANARY_NODE
      && policy.packageManager === PACKAGE_MANAGER,
    'Canonical policy fixes the public floor, primary, canary and package manager'
  );
  context.assert(policy && policy.node26LtsCutoverNotBefore === '2026-10-28', 'Node 26 cutover is date-gated until official LTS');
  context.assert(policy && policy.cutoverMinimumConsecutiveGreenDays === 14, 'Node 26 cutover requires fourteen consecutive green days');
  context.assert(
    policy && policy.upstreamOwnedRuntimeExceptions.includes('electron-embedded-node')
      && policy.upstreamOwnedRuntimeExceptions.includes('vscode-embedded-node'),
    'Electron and VS Code embedded runtimes remain explicit upstream-owned exceptions'
  );
  context.assert(readText('.nvmrc', rootDir).trim() === PRIMARY_NODE, 'Local default is pinned to the primary Node 24 patch');
}

function validateManifests(context, rootDir) {
  NODE_MANIFESTS.forEach((relativePath) => {
    const manifest = readJson(relativePath, rootDir);
    context.assert(
      manifest.engines && manifest.engines.node === PUBLIC_ENGINE,
      `${relativePath} declares the canonical Node >=24 floor`
    );
  });
  GENERATED_MANIFEST_TEMPLATES.forEach((relativePath) => {
    const manifest = readJson(relativePath, rootDir);
    context.assert(manifest.engines && manifest.engines.node === PUBLIC_ENGINE, `${relativePath} generates the canonical Node floor`);
    context.assert(manifest.packageManager === PACKAGE_MANAGER, `${relativePath} generates the pinned npm package manager`);
  });

  const compatibility = readText('xtend-material/index.js', rootDir);
  const rootPackage = readJson('package.json', rootDir);
  context.assert(compatibility.includes("node: '>=24'"), 'XTend Material compatibility metadata matches the public Node floor');
  context.assert(
    rootPackage.xtend && rootPackage.xtend.rmtNodeSsrAdapter
      && rootPackage.xtend.rmtNodeSsrAdapter.nodeEngine === PUBLIC_ENGINE,
    'Node SSR metadata matches the public Node floor'
  );
}

function validateLockfiles(context, rootDir) {
  const rootLock = readJson('package-lock.json', rootDir);
  const workspacePaths = ['', 'fabric', 'tools', 'xsurface-shard', 'xtend-builder', 'xtend-maraca', 'xtend-maraca-css-tailwind', 'xtend-material', 'xtendrmt'];
  workspacePaths.forEach((workspacePath) => {
    const record = rootLock.packages && rootLock.packages[workspacePath];
    context.assert(record && record.engines && record.engines.node === PUBLIC_ENGINE, `root lock record ${workspacePath || '.'} mirrors Node >=24`);
  });
  const llmLock = readJson('products/xtend-llm/package-lock.json', rootDir);
  context.assert(
    llmLock.packages && llmLock.packages[''] && llmLock.packages[''].engines
      && llmLock.packages[''].engines.node === PUBLIC_ENGINE,
    'XTend LLM lock root mirrors its Node >=24 host contract'
  );
}

function validateDocs(context, rootDir) {
  const stalePatterns = [
    /Node\.js 18 or newer/u,
    /Node\.js 18 oder neuer/u,
    /Node-18-Kompatibilit[aä]t/u,
    /Node 18 weiterhin unterst[uü]tzt/u,
    /`>=18`/u
  ];
  NORMATIVE_NODE_SUPPORT_DOCS.forEach((relativePath) => {
    const source = readText(relativePath, rootDir);
    context.assert(
      stalePatterns.every((pattern) => !pattern.test(source)),
      `${relativePath} contains no stale normative Node 18 support promise`
    );
  });
  context.assert(fs.existsSync(resolveRepoPath('development/BACKLOG-XTend-Node-24-26-Migration.md', rootDir)), 'N26 migration backlog exists');
}

function validateCiContracts(context, rootDir) {
  const workflowPaths = [
    '.github/workflows/xtend-default-gates.yml',
    '.github/workflows/xtend-nightly-build.yml'
  ];
  workflowPaths.forEach((relativePath) => {
    const workflow = readText(relativePath, rootDir);
    context.assert(workflow.includes(PRIMARY_NODE) && workflow.includes(CANARY_NODE), `${relativePath} declares exact Node 24 and 26 lanes`);
    context.assert(!workflow.includes('26.x'), `${relativePath} does not use a moving Node 26 target`);
    context.assert(!workflow.includes('npm@10'), `${relativePath} does not invoke the obsolete npm 10 evidence path`);
    context.assert(!workflow.includes('--package-lock=false'), `${relativePath} does not bypass the committed lockfile`);
    const npmPinNames = Array.from(workflow.matchAll(/- name: Pin npm 11\.17\.0/gu));
    const npmPinSteps = Array.from(workflow.matchAll(/- name: Pin npm 11\.17\.0\n\s+working-directory: \$\{\{ runner\.temp \}\}\n\s+run: npm install --global npm@11\.17\.0/gu));
    context.assert(
      npmPinNames.length > 0 && npmPinSteps.length === npmPinNames.length,
      `${relativePath} bootstraps every pinned npm installation outside the repository devEngines boundary`
    );
    const actionRefs = Array.from(workflow.matchAll(/uses:\s*(actions\/(?:checkout|setup-node|upload-artifact))@([^\s#]+)/gu));
    context.assert(actionRefs.length > 0, `${relativePath} uses the expected official GitHub actions`);
    context.assert(
      actionRefs.filter((match) => match[1] === 'actions/setup-node').length === npmPinNames.length,
      `${relativePath} pins npm once for every configured Node runtime`
    );
    actionRefs.forEach((match) => {
      context.assert(/^[a-f0-9]{40}$/u.test(match[2]), `${relativePath} pins ${match[1]} to an immutable commit SHA`);
    });
  });
  const defaultWorkflow = readText('.github/workflows/xtend-default-gates.yml', rootDir);
  const nightlyWorkflow = readText('.github/workflows/xtend-nightly-build.yml', rootDir);
  context.assert(defaultWorkflow.includes('node-native-toolchain-smoke:'), 'Default CI exposes a blocking cross-platform Node-native toolchain smoke job');
  ['ubuntu-24.04', 'windows-2025', 'macos-15'].forEach((runner) => {
    context.assert(defaultWorkflow.includes(`runner: ${runner}`), `Native smoke matrix includes ${runner}`);
  });
  context.assert(defaultWorkflow.includes('expected_arch: arm64'), 'macOS native smoke is explicitly arm64');
  context.assert(defaultWorkflow.includes('npm run test:node-native-toolchain'), 'Native smoke executes the TypeScript/Rollup/Terser/Vite/native toolchain probe');
  context.assert(
    !/electron/iu.test(defaultWorkflow) && !/electron/iu.test(nightlyWorkflow),
    'Blocking default and nightly GitHub workflows never install, launch or require Electron'
  );
  context.assert(
    !defaultWorkflow.includes('test:node24:product')
      && !defaultWorkflow.includes('test:node26:product')
      && !defaultWorkflow.includes('product_script')
      && !defaultWorkflow.includes('.xtend-llm-results/native-runtime-'),
    'Cross-platform Node-native smoke has no product-runtime or embedded-runtime dependency'
  );
  context.assert(defaultWorkflow.includes('- node-native-toolchain-smoke'), 'npm publish is blocked only on the Electron-free cross-platform Node-native toolchain smoke');
  context.assert(fs.existsSync(resolveRepoPath('scripts/capture_node_runtime_evidence.js', rootDir)), 'Runtime evidence collector exists');
  context.assert(fs.existsSync(resolveRepoPath('scripts/smoke_node_native_toolchain.mjs', rootDir)), 'Native toolchain smoke exists');
  context.assert(fs.existsSync(resolveRepoPath('scripts/enable_node_warning_policy.js', rootDir)), 'Warning policy activation exists');

  const conditionalNetworkCapture = readText('scripts/capture_conditional_network_evidence.js', rootDir);
  context.assert(!conditionalNetworkCapture.includes('npm@10') && !conditionalNetworkCapture.includes('USE_NPX_NPM10'), 'Audit and SBOM evidence use the pinned npm 11 runtime rather than an npm 10 side path');

  const projectWarning = classifyWarning({
    name: 'DeprecationWarning',
    code: 'DEP_FIXTURE',
    message: 'fixture',
    stack: `DeprecationWarning: fixture\n    at ${resolveRepoPath('scripts/fixture.js', rootDir)}:1:1`
  });
  const dependencyWarning = classifyWarning({
    name: 'Warning',
    message: 'fixture',
    stack: `Warning: fixture\n    at ${resolveRepoPath('node_modules/fixture/index.js', rootDir)}:1:1`
  });
  context.assert(projectWarning.classification === 'project', 'Warning policy classifies project deprecations as blocking');
  context.assert(dependencyWarning.classification === 'third-party', 'Warning policy classifies dependency warnings as report-only');
  context.assert(!Object.prototype.hasOwnProperty.call(projectWarning, 'message'), 'Warning evidence fingerprints messages instead of persisting potential secret values');

  const warningTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-node-warning-policy-'));
  const warningReport = path.join(warningTempDir, 'warning-evidence.jsonl');
  const preloadPath = resolveRepoPath('scripts/node_warning_policy.cjs', rootDir).replaceAll(path.sep, '/');
  const warningFixture = resolveRepoPath('tests/fixtures/node-warning-project.cjs', rootDir);
  const warningExecution = spawnSync(process.execPath, [warningFixture], {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_OPTIONS: `--trace-warnings --trace-deprecation --require=${preloadPath}`,
      XTEND_NODE_WARNING_POLICY: 'project-error',
      XTEND_NODE_WARNING_REPORT: warningReport
    }
  });
  const warningEvidence = fs.existsSync(warningReport) ? fs.readFileSync(warningReport, 'utf8') : '';
  context.assert(warningExecution.status === 1, 'Warning policy fails a process that emits a project-owned deprecation');
  context.assert(warningEvidence.includes('"classification":"project"'), 'Warning policy records the blocking project classification');
  context.assert(!warningEvidence.includes('sentinel-secret-warning-message'), 'Warning report never persists the warning message payload');
  fs.rmSync(warningTempDir, { recursive: true, force: true });
}

function runNodeRuntimePolicySuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'node-runtime-policy', label: 'Node 24/26 runtime and support policy' });

  validatePolicy(context, rootDir);
  validateManifests(context, rootDir);
  validateLockfiles(context, rootDir);
  validateDocs(context, rootDir);
  validateCiContracts(context, rootDir);

  return context.result({
    schema: NODE_RUNTIME_POLICY_SUITE_SCHEMA,
    publicEngine: PUBLIC_ENGINE,
    primaryNode: PRIMARY_NODE,
    canaryNode: CANARY_NODE,
    packageManager: PACKAGE_MANAGER
  });
}

function printNodeRuntimePolicyReport(result) {
  printSuiteReport(result, {
    successTitle: 'Node-24/26-Runtime-Policy-Gate erfolgreich.',
    failureTitle: 'Node-24/26-Runtime-Policy-Gate fehlgeschlagen:'
  });
}

module.exports = { printNodeRuntimePolicyReport, runNodeRuntimePolicySuite };

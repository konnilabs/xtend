const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ARTIFACT_PARITY_SCHEMA = 'xtend.rmt.artifact-parity.v1';
const REQUIRED_ARTIFACTS = [
  'xtendrmt/rmt-core.esm.js',
  'xtendrmt/rmt-runtime.esm.js',
  'xtendrmt/rmt-runtime.browser.js',
  'xtendrmt/rmt-core.d.ts',
  'xtendrmt/rmt.schema.json',
  'xtendrmt/rmt-manifest.json'
];
const REQUIRED_CONTRACT_IDS = [
  'xtend.rmt.runtime-registry.v1',
  'xtend.rmt.xrouter-adapter.v1',
  'xtend.rmt.xtend-component-adapter.v1',
  'xtend.rmt.state-scheduler-diagnostics-bridge.v1',
  ARTIFACT_PARITY_SCHEMA
];
const REQUIRED_FACTORIES = [
  'createRmtFormat',
  'createRmtXRouterAdapter',
  'createRmtXtendComponentAdapter',
  'createRmtStateSchedulerDiagnosticsBridge'
];
const ESM_TARGETS = [
  { id: 'rmt-core.esm', path: 'xtendrmt/rmt-core.esm.js' },
  { id: 'rmt-runtime.esm', path: 'xtendrmt/rmt-runtime.esm.js' }
];
const BROWSER_TARGET = 'xtendrmt/rmt-runtime.browser.js';

function resolveRootDir(rootDir) {
  return path.resolve(rootDir || path.resolve(__dirname, '..'));
}

function resolvePath(rootDir, relativePath) {
  return path.join(rootDir, relativePath);
}

function readText(rootDir, relativePath) {
  return fs.readFileSync(resolvePath(rootDir, relativePath), 'utf8');
}

function readJson(rootDir, relativePath) {
  return JSON.parse(readText(rootDir, relativePath));
}

function addCheck(checks, id, ok, message, details = {}) {
  checks.push({
    id,
    status: ok ? 'passed' : 'failed',
    message,
    ...details
  });
}

function includesAll(values, expected) {
  return Array.isArray(values) && expected.every((entry) => values.includes(entry));
}

function extractEsmNamedExports(source) {
  const exportMatch = source.match(/export\s+\{\s*([^}]+?)\s*\};\s*export default/u);
  if (!exportMatch) return [];
  return exportMatch[1]
    .split(',')
    .map((entry) => entry.trim().split(/\s+as\s+/u)[0].trim())
    .filter(Boolean);
}

function stripEsmExports(source) {
  return source.replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default[\s\S]*?;\s*$/u, '\n');
}

function parseScript(checks, relativePath, source, stripExports = false) {
  try {
    new vm.Script(stripExports ? stripEsmExports(source) : source, { filename: relativePath });
    addCheck(checks, `syntax:${relativePath}`, true, `${relativePath} parses as a JavaScript artifact`);
  } catch (error) {
    addCheck(checks, `syntax:${relativePath}`, false, `${relativePath} parses as a JavaScript artifact`, {
      error: error.message
    });
  }
}

function evaluateAppModules(checks, relativePath, source) {
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  try {
    vm.runInNewContext(stripEsmExports(source), sandbox, { filename: relativePath });
    const appModules = sandbox.AppModules;
    addCheck(
      checks,
      `appModules:${relativePath}`,
      Boolean(appModules && typeof appModules.createRmtProductManifest === 'function'),
      `${relativePath} exposes AppModules and createRmtProductManifest`
    );
    return appModules || null;
  } catch (error) {
    addCheck(checks, `appModules:${relativePath}`, false, `${relativePath} exposes AppModules and createRmtProductManifest`, {
      error: error.message
    });
    return null;
  }
}

function getBuildTarget(manifest, id) {
  const targets = manifest && manifest.entryPoints && Array.isArray(manifest.entryPoints.buildTargets)
    ? manifest.entryPoints.buildTargets
    : [];
  return targets.find((target) => target.id === id) || null;
}

function getContractById(contracts, id) {
  return Array.isArray(contracts) ? contracts.find((entry) => entry.id === id) || null : null;
}

function getFactoryValues(manifest) {
  const factories = manifest && manifest.entryPoints && manifest.entryPoints.appModulesFactories
    ? manifest.entryPoints.appModulesFactories
    : {};
  return Object.values(factories);
}

function assertArtifactParityContract(checks, label, contract) {
  addCheck(checks, `${label}:contract`, Boolean(contract), `${label} exposes ${ARTIFACT_PARITY_SCHEMA}`);
  if (!contract) return;

  addCheck(
    checks,
    `${label}:status`,
    contract.status === 'epic-05-wp-13-contract',
    `${label} marks artifact parity as Epic 05 / WP-13 contract`
  );
  addCheck(
    checks,
    `${label}:sourceOfTruth`,
    contract.sourceOfTruth === 'development/WP-E05-13-Build-Pipeline-und-Artefakt-Paritaet-fuer-XTendRMT-absichern.md',
    `${label} points artifact parity to the WP-13 source of truth`
  );
  addCheck(
    checks,
    `${label}:gateCommand`,
    contract.gateCommand === 'node scripts/verify_xtendrmt_artifact_parity.js --json',
    `${label} documents the dedicated artifact parity gate command`
  );
  addCheck(
    checks,
    `${label}:artifactPaths`,
    includesAll(contract.artifactPaths, REQUIRED_ARTIFACTS),
    `${label} lists every synchronized XTendRMT artifact path`
  );
  addCheck(
    checks,
    `${label}:requiredFactories`,
    includesAll(contract.requiredFactories, REQUIRED_FACTORIES),
    `${label} lists the productive RMT adapter and bridge factories`
  );
  addCheck(
    checks,
    `${label}:requiredContracts`,
    includesAll(contract.requiredContractIds, REQUIRED_CONTRACT_IDS),
    `${label} lists the synchronized bridge and parity contract ids`
  );
  addCheck(
    checks,
    `${label}:artifactSurfaces`,
    includesAll(contract.artifactSurfaces, ['scripts/verify_xtendrmt_artifact_parity.js', 'RmtArtifactParityContract', 'artifactParityContracts']),
    `${label} lists the artifact parity gate and type surfaces`
  );
}

function runXtendRmtArtifactParity(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const checks = [];
  const sources = {};

  REQUIRED_ARTIFACTS.forEach((relativePath) => {
    const exists = fs.existsSync(resolvePath(rootDir, relativePath));
    addCheck(checks, `exists:${relativePath}`, exists, `${relativePath} exists`);
    if (exists) {
      sources[relativePath] = readText(rootDir, relativePath);
    }
  });

  let schema = null;
  let manifest = null;
  let packageJson = null;
  try {
    schema = readJson(rootDir, 'xtendrmt/rmt.schema.json');
    addCheck(checks, 'json:xtendrmt/rmt.schema.json', true, 'RMT schema parses as JSON');
  } catch (error) {
    addCheck(checks, 'json:xtendrmt/rmt.schema.json', false, 'RMT schema parses as JSON', { error: error.message });
  }
  try {
    manifest = readJson(rootDir, 'xtendrmt/rmt-manifest.json');
    addCheck(checks, 'json:xtendrmt/rmt-manifest.json', true, 'RMT manifest parses as JSON');
  } catch (error) {
    addCheck(checks, 'json:xtendrmt/rmt-manifest.json', false, 'RMT manifest parses as JSON', { error: error.message });
  }
  try {
    packageJson = readJson(rootDir, 'package.json');
    addCheck(checks, 'json:package.json', true, 'package.json parses as JSON');
  } catch (error) {
    addCheck(checks, 'json:package.json', false, 'package.json parses as JSON', { error: error.message });
  }

  const schemaXtend = schema && schema['x-xtendrmt'] ? schema['x-xtendrmt'] : {};
  const schemaContract = getContractById(schemaXtend.artifactParityContracts, ARTIFACT_PARITY_SCHEMA);
  const manifestContract = getContractById(manifest && manifest.artifactParityContracts, ARTIFACT_PARITY_SCHEMA);
  assertArtifactParityContract(checks, 'schema', schemaContract);
  assertArtifactParityContract(checks, 'manifest', manifestContract);

  REQUIRED_CONTRACT_IDS.forEach((contractId) => {
    addCheck(
      checks,
      `schema-contract:${contractId}`,
      sources['xtendrmt/rmt.schema.json'] && sources['xtendrmt/rmt.schema.json'].includes(contractId),
      `RMT schema contains ${contractId}`
    );
  });

  const manifestFactories = getFactoryValues(manifest);
  REQUIRED_FACTORIES.forEach((factoryName) => {
    addCheck(
      checks,
      `manifest-factory:${factoryName}`,
      manifestFactories.includes(factoryName),
      `rmt-manifest appModulesFactories includes ${factoryName}`
    );
  });

  const typesSource = sources['xtendrmt/rmt-core.d.ts'] || '';
  REQUIRED_FACTORIES.forEach((factoryName) => {
    addCheck(
      checks,
      `types-factory:${factoryName}`,
      typesSource.includes(`export declare function ${factoryName}`),
      `rmt-core.d.ts declares ${factoryName}`
    );
  });
  ['RmtArtifactParityContract', 'artifactParityContracts?: RmtArtifactParityContract[]'].forEach((typeSurface) => {
    addCheck(
      checks,
      `types-surface:${typeSurface}`,
      typesSource.includes(typeSurface),
      `rmt-core.d.ts exposes ${typeSurface}`
    );
  });

  ESM_TARGETS.forEach((target) => {
    const source = sources[target.path] || '';
    parseScript(checks, target.path, source, true);
    const manifestTarget = getBuildTarget(manifest, target.id);
    const manifestNamedExports = manifestTarget && Array.isArray(manifestTarget.namedExports)
      ? manifestTarget.namedExports
      : [];
    const actualNamedExports = extractEsmNamedExports(source);
    addCheck(
      checks,
      `esm-target:${target.id}`,
      Boolean(manifestTarget),
      `rmt-manifest declares build target ${target.id}`
    );
    addCheck(
      checks,
      `esm-exports:${target.id}`,
      includesAll(actualNamedExports, manifestNamedExports),
      `${target.id} ESM export block covers manifest namedExports`,
      {
        expected: manifestNamedExports.length,
        actual: actualNamedExports.length
      }
    );
    REQUIRED_FACTORIES.forEach((factoryName) => {
      addCheck(
        checks,
        `esm-factory:${target.id}:${factoryName}`,
        source.includes(`const ${factoryName} =`) && source.includes(`AppModules.${factoryName}`),
        `${target.id} exposes ${factoryName} through AppModules wrapper`
      );
    });

    const appModules = evaluateAppModules(checks, target.path, source);
    if (appModules && typeof appModules.createRmtProductManifest === 'function') {
      const generatedManifest = appModules.createRmtProductManifest();
      REQUIRED_FACTORIES.forEach((factoryName) => {
        addCheck(
          checks,
          `generated-manifest-factory:${target.id}:${factoryName}`,
          getFactoryValues(generatedManifest).includes(factoryName),
          `${target.id} generated product manifest includes ${factoryName}`
        );
      });
      const generatedContract = getContractById(generatedManifest.artifactParityContracts, ARTIFACT_PARITY_SCHEMA);
      assertArtifactParityContract(checks, `generated-manifest:${target.id}`, generatedContract);
    }
  });

  const browserSource = sources[BROWSER_TARGET] || '';
  parseScript(checks, BROWSER_TARGET, browserSource, false);
  REQUIRED_FACTORIES.forEach((factoryName) => {
    addCheck(
      checks,
      `browser-factory:${factoryName}`,
      browserSource.includes(`appModules.${factoryName}`),
      `browser runtime artifact contains ${factoryName}`
    );
  });
  addCheck(
    checks,
    'browser-artifact-parity-contract',
    browserSource.includes('artifactParityContracts') && browserSource.includes(ARTIFACT_PARITY_SCHEMA),
    'browser runtime generated manifest contains artifact parity contract'
  );

  addCheck(
    checks,
    'package-script:test-rmt-artifact-parity',
    packageJson && packageJson.scripts && packageJson.scripts['test:rmt-artifact-parity'] === 'node scripts/verify_xtendrmt_artifact_parity.js',
    'package.json exposes npm run test:rmt-artifact-parity'
  );

  const failedChecks = checks.filter((check) => check.status === 'failed');
  return {
    schema: 'xtend.rmt.artifact-parity-report.v1',
    contract: ARTIFACT_PARITY_SCHEMA,
    status: failedChecks.length === 0 ? 'passed' : 'failed',
    ok: failedChecks.length === 0,
    rootDir,
    passCount: checks.length - failedChecks.length,
    failureCount: failedChecks.length,
    checks
  };
}

function printTextReport(report) {
  if (report.ok) {
    console.log(`XTendRMT artifact parity passed (${report.passCount} checks).`);
    return;
  }
  console.error(`XTendRMT artifact parity failed (${report.failureCount} failures).`);
  report.checks
    .filter((check) => check.status === 'failed')
    .forEach((check) => {
      console.error(`- ${check.id}: ${check.message}`);
      if (check.error) {
        console.error(`  ${check.error}`);
      }
    });
}

if (require.main === module) {
  const json = process.argv.includes('--json');
  const report = runXtendRmtArtifactParity();
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTextReport(report);
  }
  if (!report.ok) {
    process.exit(1);
  }
}

module.exports = {
  ARTIFACT_PARITY_SCHEMA,
  REQUIRED_ARTIFACTS,
  REQUIRED_CONTRACT_IDS,
  REQUIRED_FACTORIES,
  runXtendRmtArtifactParity
};

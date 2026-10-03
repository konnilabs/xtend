'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRmtAppScaffold, RMT_APP_TEMPLATES } = require('../../xtend-builder/generators/rmt-app');
const { createMaterialAppScaffold } = require('../../xtend-builder/generators/material-app');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');

function runXtendRmtAppScaffoldSuite() {
  const context = createSuiteContext({
    id: 'xtend-rmt-app-scaffold',
    label: 'Provider-neutraler XTend RMT App Scaffold'
  });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmt-app-scaffold-'));
  try {
    const rootManifest = require('../utils/test-catalog').resolveManifestProfiles(require('../../package.json'));
    const gateMatrix = rootManifest.xtend && rootManifest.xtend.ciGateMatrix;
    assert.match(rootManifest.scripts['test:maraca-app-services'], /xtend-rmt-app-scaffold.*xtend-material-scaffold/u);
    assert.equal(gateMatrix.prFastGate.suites.includes('xtend-rmt-app-scaffold') && gateMatrix.prFastGate.suites.includes('xtend-material-scaffold'), true);
    assert.equal(gateMatrix.fullReleaseGate.suites.includes('xtend-rmt-app-scaffold') && gateMatrix.fullReleaseGate.suites.includes('xtend-material-scaffold'), true);
    context.pass('AppServices PR and release gates require both the provider-neutral scaffold and the XTM overlay');

    const report = createRmtAppScaffold({ rootDir: root, out: 'app', server: 'both', write: true });
    assert.equal(report.ok, true);
    assert.equal(report.status, 'written');
    assert.equal(report.files.length, 11);
    assert.equal(RMT_APP_TEMPLATES.length, 11);
    assert.equal(report.preset.cssProvider, 'maraca-native');
    assert.equal(report.preset.designKit, 'none');

    const config = JSON.parse(fs.readFileSync(path.join(root, 'app/maraca.config.json'), 'utf8'));
    assert.equal(config.options.cssProvider, 'maraca-native');
    assert.deepEqual(config.options.services.targets, ['browser', 'node', 'php']);
    assert.equal(config.options.services.strict, true);
    assert.equal(fs.existsSync(path.join(root, 'app/src/services.ts')), true);
    assert.equal(fs.existsSync(path.join(root, 'app/src/server-services.ts')), true);
    assert.equal(fs.existsSync(path.join(root, 'app/server/index.mjs')), true);
    assert.equal(fs.existsSync(path.join(root, 'app/server/server-services.php')), true);
    const appManifest = JSON.parse(fs.readFileSync(path.join(root, 'app/package.json'), 'utf8'));
    assert.equal(appManifest.engines.node, '>=24');
    assert.equal(appManifest.packageManager, 'npm@11.17.0');
    assert.equal(appManifest.scripts.serve, 'npm start');
    assert.equal(appManifest.scripts.start, 'npm run build && node server/index.mjs');
    assert.equal(appManifest.scripts['test:catfood'], 'npm run build && node --test');
    assert.equal(appManifest.devDependencies['@types/node'], '^24.13.3');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'app/tsconfig.json'), 'utf8')).compilerOptions.types, ['node']);
    assert.match(appManifest.scripts.tune, /--config maraca\.config\.json/u);
    assert.doesNotMatch(appManifest.scripts.tune, /maraca\.tuned\.config\.json/u);
    const generatedHost = fs.readFileSync(path.join(root, 'app/site/index.html'), 'utf8');
    assert.match(generatedHost, /<body data-xtend-maraca-host>/u);
    assert.doesNotMatch(generatedHost, /bootXtendMaraca|dataSourceAdapters|hostServiceAdapters/);
    context.pass('neutral scaffold emits RMT, CSS, strict AppServices entries and target configuration without manual boot wiring');

    const browserOnly = createRmtAppScaffold({ rootDir: root, out: 'browser-app', server: 'none' });
    assert.equal(browserOnly.ok, true);
    assert.equal(browserOnly.files.some((file) => file.path.endsWith('server-services.ts')), false);
    assert.equal(browserOnly.files.some((file) => file.path.endsWith('server-services.php')), false);
    assert.equal(browserOnly.files.some((file) => file.path.endsWith('server/index.mjs')), false);
    context.pass('browser-only planning excludes both server implementation entries');

    const material = createMaterialAppScaffold({ rootDir: root, out: 'material-app', server: 'none' }, { resolveAdapter: () => true });
    assert.equal(material.ok, true);
    assert.equal(material.preset.cssProvider, 'tailwind');
    assert.equal(material.files.some((file) => file.path.endsWith('src/services.ts')), true);
    assert.equal(material.files.some((file) => file.path.endsWith('src/app.css')), true);
    context.pass('Material remains an overlay over the provider-neutral AppServices scaffold');
  } catch (error) {
    context.fail(error && error.stack || String(error));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }

  return context.result({
    schema: 'xtend.scaffold.app-preset.rmt-suite-report.v1'
  });
}

function printXtendRmtAppScaffoldReport(result) {
  printSuiteReport(result, {
    successTitle: 'Provider-neutraler RMT App Scaffold und Material-Overlay erfolgreich.',
    failureTitle: 'Provider-neutraler RMT App Scaffold und Material-Overlay fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runXtendRmtAppScaffoldSuite();
  printXtendRmtAppScaffoldReport(result);
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = {
  printXtendRmtAppScaffoldReport,
  runXtendRmtAppScaffoldSuite
};

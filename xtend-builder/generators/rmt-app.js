'use strict';

const path = require('path');
const { renderTemplateForArtifact } = require('../templates/loader');
const { normalizeRelativePath, writeScaffoldFiles } = require('../writing/write-plan');
const {
  APP_SERVER_TARGETS,
  APP_SERVICE_BASE_TEMPLATES,
  appServiceTargets,
  filterAppTemplatesForServer,
  normalizeAppServerTarget
} = require('./app-base');

const RMT_APP_SCAFFOLD_SCHEMA = 'xtend.scaffold.app-preset.rmt.v1';
const RMT_APP_SCAFFOLD_REPORT_SCHEMA = 'xtend.scaffold.app-preset.rmt-report.v1';
const RMT_APP_OWNER = 'XMS-07-rmt-app';
const RMT_APP_TEMPLATES = Object.freeze([
  { artifact: 'rmt-app-rmt', id: 'app-rmt', target: 'src/app.rmt', kind: 'rmt' },
  { artifact: 'rmt-app-css', id: 'app-css', target: 'src/app.css', kind: 'css' },
  ...APP_SERVICE_BASE_TEMPLATES,
  { artifact: 'rmt-maraca-config', id: 'maraca-config', target: 'maraca.config.json', kind: 'config' },
  { artifact: 'rmt-package', id: 'package', target: 'package.json', kind: 'package' },
  { artifact: 'rmt-smoke', id: 'smoke-test', target: 'test/app.smoke.test.cjs', kind: 'test' },
  { artifact: 'rmt-browser-host', id: 'browser-host', target: 'site/index.html', kind: 'html' }
]);

function toBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function normalizePackageName(value) {
  const normalized = String(value || 'xtend-rmt-app').trim().toLowerCase().replace(/[^a-z0-9._-]+/gu, '-').replace(/^-+|-+$/gu, '');
  return normalized || 'xtend-rmt-app';
}

function titleFromPackageName(packageName) {
  return packageName.split(/[-_.]+/u).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function renderEntries(outputDir, values) {
  return filterAppTemplatesForServer(RMT_APP_TEMPLATES, values.serverTarget).map((definition) => {
    const rendered = renderTemplateForArtifact(definition.artifact, values);
    if (!rendered.ok) return { error: rendered.error, definition };
    return {
      id: definition.id,
      path: path.posix.join(outputDir, definition.target),
      kind: definition.kind,
      content: rendered.content,
      generated: true,
      owner: RMT_APP_OWNER,
      templateId: rendered.template.id,
      templatePath: rendered.template.path
    };
  });
}

function createRmtAppScaffold(input = {}, options = {}) {
  const rootDir = path.resolve(input.rootDir || input['root-dir'] || options.rootDir || process.cwd());
  const runtime = String(input.runtime || 'maraca');
  const designKit = String(input.designKit || input['design-kit'] || 'none').toLowerCase();
  const serverTarget = normalizeAppServerTarget(input);
  const requestedOutput = String(input.out || input.output || input.outputDir || 'rmt-app').replace(/\\/gu, '/').replace(/\/$/u, '');
  const normalizedOutput = normalizeRelativePath(requestedOutput);
  const errors = [];
  if (runtime !== 'maraca') errors.push(`RMT app preset requires runtime "maraca", received "${runtime}".`);
  if (!['none', 'native', 'neutral'].includes(designKit)) errors.push(`Provider-neutral RMT app requires design kit none, native or neutral; received "${designKit}".`);
  if (!APP_SERVER_TARGETS.includes(serverTarget)) errors.push(`RMT app server target must be one of none, node, php or both; received "${serverTarget}".`);
  if (!normalizedOutput.ok || normalizedOutput.path === '.') errors.push(normalizedOutput.error || 'RMT app output must be a named directory below the current root.');
  if (toBoolean(input.write) && toBoolean(input.check)) errors.push('RMT app scaffold accepts either --write or --check, not both.');
  if (errors.length > 0) {
    return { schema: RMT_APP_SCAFFOLD_REPORT_SCHEMA, ok: false, status: 'blocked', preset: { runtime, designKit }, outputDir: normalizedOutput.ok ? normalizedOutput.path : requestedOutput, errors, diagnostics: [], files: [], writeReport: null };
  }

  const packageName = normalizePackageName(input.name || path.posix.basename(normalizedOutput.path));
  const rendered = renderEntries(normalizedOutput.path, {
    packageName,
    appTitle: String(input.title || titleFromPackageName(packageName)),
    serviceId: 'app.health',
    serverTarget,
    serviceTargetsJson: JSON.stringify(appServiceTargets(serverTarget))
  });
  const renderErrors = rendered.filter((entry) => entry.error).map((entry) => entry.error);
  if (renderErrors.length > 0) {
    return { schema: RMT_APP_SCAFFOLD_REPORT_SCHEMA, ok: false, status: 'blocked', preset: { runtime, designKit }, outputDir: normalizedOutput.path, errors: renderErrors, diagnostics: [], files: [], writeReport: null };
  }
  const ownershipPath = path.posix.join(normalizedOutput.path, '.xtend-build/scaffold-ownership.json');
  const writeReport = writeScaffoldFiles(rendered, {
    rootDir,
    write: toBoolean(input.write),
    check: toBoolean(input.check),
    force: toBoolean(input.force),
    generator: 'rmt-app',
    owner: RMT_APP_OWNER,
    ownershipPath,
    allowedRoots: [`${normalizedOutput.path}/`]
  });
  return {
    schema: RMT_APP_SCAFFOLD_REPORT_SCHEMA,
    scaffoldSchema: RMT_APP_SCAFFOLD_SCHEMA,
    ok: writeReport.ok,
    status: writeReport.status,
    preset: { runtime: 'maraca', designKit: 'none', cssProvider: 'maraca-native', services: 'typescript', serverTarget },
    packageName,
    outputDir: normalizedOutput.path,
    ownershipPath,
    errors: writeReport.errors,
    diagnostics: [],
    files: writeReport.plan.operations.map((operation) => ({ id: operation.id, path: operation.path, kind: operation.kind, action: operation.action, changed: operation.changed, sha256: operation.sha256 })),
    writeReport,
    commands: { plan: 'npm run plan', build: 'npm run build', serve: 'npm run serve', tune: 'npm run tune', test: 'npm test' }
  };
}

module.exports = {
  RMT_APP_OWNER,
  RMT_APP_SCAFFOLD_REPORT_SCHEMA,
  RMT_APP_SCAFFOLD_SCHEMA,
  RMT_APP_TEMPLATES,
  createRmtAppScaffold
};

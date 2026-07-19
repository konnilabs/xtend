'use strict';

const fs = require('fs');
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

const MATERIAL_APP_SCAFFOLD_SCHEMA = 'xtend.scaffold.app-preset.material.v1';
const MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA = 'xtend.scaffold.app-preset.material-report.v1';
const MATERIAL_APP_OWNER = 'XTM-09-material-app';
const MATERIAL_APP_TEMPLATES = Object.freeze([
  { artifact: 'material-app-rmt', id: 'app-rmt', target: 'src/app.rmt', kind: 'rmt' },
  { artifact: 'material-app-css', id: 'app-css', target: 'src/app.css', kind: 'css' },
  ...APP_SERVICE_BASE_TEMPLATES,
  { artifact: 'material-maraca-config', id: 'maraca-config', target: 'maraca.config.json', kind: 'config' },
  { artifact: 'material-package', id: 'package', target: 'package.json', kind: 'package' },
  { artifact: 'material-smoke', id: 'smoke-test', target: 'test/material-app.smoke.test.cjs', kind: 'test' },
  { artifact: 'material-browser-host', id: 'browser-host', target: 'site/index.html', kind: 'html' },
  { artifact: 'material-runtime-host', id: 'runtime-host', target: 'src/material-runtime-host.mjs', kind: 'runtime' },
  { artifact: 'material-dev-api', id: 'dev-api', target: 'src/material-dev-api.mjs', kind: 'runtime' }
]);

function toBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function normalizePackageName(value) {
  const normalized = String(value || 'xtend-material-app').trim().toLowerCase().replace(/[^a-z0-9._-]+/gu, '-').replace(/^-+|-+$/gu, '');
  return normalized || 'xtend-material-app';
}

function titleFromPackageName(packageName) {
  return packageName.split(/[-_.]+/u).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function adapterAvailable(rootDir, resolver) {
  if (typeof resolver === 'function') return resolver(rootDir) === true;
  try {
    require.resolve('@xtend-material/maraca-tailwind/package.json', { paths: [rootDir, __dirname] });
    return true;
  } catch (_error) {
    return fs.existsSync(path.resolve(rootDir, 'xtend-maraca-css-tailwind/package.json'));
  }
}

function createMaterialAppEntries(outputDir, values) {
  return filterAppTemplatesForServer(MATERIAL_APP_TEMPLATES, values.serverTarget).map((definition) => {
    const rendered = renderTemplateForArtifact(definition.artifact, values);
    if (!rendered.ok) return { error: rendered.error, definition };
    return {
      id: definition.id,
      path: path.posix.join(outputDir, definition.target),
      kind: definition.kind,
      content: rendered.content,
      generated: true,
      owner: MATERIAL_APP_OWNER,
      templateId: rendered.template.id,
      templatePath: rendered.template.path
    };
  });
}

function createMaterialAppScaffold(input = {}, options = {}) {
  const rootDir = path.resolve(input.rootDir || input['root-dir'] || options.rootDir || process.cwd());
  const runtime = String(input.runtime || 'maraca');
  const designKit = String(input.designKit || input['design-kit'] || 'material');
  const serverTarget = normalizeAppServerTarget(input);
  const requestedOutput = String(input.out || input.output || input.outputDir || 'material-app').replace(/\\/gu, '/').replace(/\/$/u, '');
  const normalizedOutput = normalizeRelativePath(requestedOutput);
  const errors = [];
  if (runtime !== 'maraca') errors.push(`Material app preset requires runtime "maraca", received "${runtime}".`);
  if (designKit !== 'material') errors.push(`Material app generator does not activate Tailwind for design kit "${designKit}".`);
  if (!APP_SERVER_TARGETS.includes(serverTarget)) errors.push(`Material app server target must be one of none, node, php or both; received "${serverTarget}".`);
  if (!normalizedOutput.ok || normalizedOutput.path === '.') errors.push(normalizedOutput.error || 'Material app output must be a named directory below the current root.');
  if (toBoolean(input.write) && toBoolean(input.check)) errors.push('Material app scaffold accepts either --write or --check, not both.');

  const packageName = normalizePackageName(input.name || path.posix.basename(normalizedOutput.ok ? normalizedOutput.path : 'material-app'));
  const appTitle = String(input.title || titleFromPackageName(packageName));
  const diagnostics = [];
  if (!adapterAvailable(rootDir, options.resolveAdapter)) {
    diagnostics.push({
      code: 'xtend.scaffold.material_adapter_missing',
      severity: 'warning',
      message: 'The local @xtend-material/maraca-tailwind adapter is not installed yet.',
      repairHint: 'Run npm install in the generated app before plan, build or tune.'
    });
  }

  if (errors.length > 0) {
    return {
      schema: MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA,
      ok: false,
      status: 'blocked',
      preset: { runtime, designKit },
      outputDir: normalizedOutput.ok ? normalizedOutput.path : requestedOutput,
      errors,
      diagnostics,
      files: [],
      writeReport: null
    };
  }

  const outputDir = normalizedOutput.path;
  const serviceTargets = appServiceTargets(serverTarget);
  const rendered = createMaterialAppEntries(outputDir, {
    packageName,
    appTitle,
    serviceId: 'material.app.health',
    serverTarget,
    serviceTargetsJson: JSON.stringify(serviceTargets)
  });
  const renderErrors = rendered.filter((entry) => entry.error).map((entry) => entry.error);
  if (renderErrors.length > 0) {
    return {
      schema: MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA,
      ok: false,
      status: 'blocked',
      preset: { runtime, designKit },
      outputDir,
      errors: renderErrors,
      diagnostics,
      files: [],
      writeReport: null
    };
  }

  const ownershipPath = path.posix.join(outputDir, '.xtend-build/scaffold-ownership.json');
  const writeReport = writeScaffoldFiles(rendered, {
    rootDir,
    write: toBoolean(input.write),
    check: toBoolean(input.check),
    force: toBoolean(input.force),
    generator: 'material-app',
    owner: MATERIAL_APP_OWNER,
    ownershipPath,
    allowedRoots: [`${outputDir}/`]
  });
  const commands = {
    plan: 'npm run plan',
    build: 'npm run build',
    serve: 'npm run serve',
    tune: 'npm run tune',
    test: 'npm test'
  };
  return {
    schema: MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA,
    scaffoldSchema: MATERIAL_APP_SCAFFOLD_SCHEMA,
    ok: writeReport.ok,
    status: writeReport.status,
    preset: { runtime: 'maraca', designKit: 'material', cssProvider: 'tailwind', preflight: 'disabled', services: 'typescript', serverTarget },
    packageName,
    outputDir,
    ownershipPath,
    errors: writeReport.errors,
    diagnostics,
    files: writeReport.plan.operations.map((operation) => ({ id: operation.id, path: operation.path, kind: operation.kind, action: operation.action, changed: operation.changed, sha256: operation.sha256 })),
    writeReport,
    commands
  };
}

module.exports = {
  MATERIAL_APP_OWNER,
  MATERIAL_APP_SCAFFOLD_REPORT_SCHEMA,
  MATERIAL_APP_SCAFFOLD_SCHEMA,
  MATERIAL_APP_TEMPLATES,
  createMaterialAppScaffold
};

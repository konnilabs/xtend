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
const RMTX_APP_SCAFFOLD_SCHEMA = 'xtend.scaffold.app-preset.rmt.v2';
const RMTX_APP_SCAFFOLD_REPORT_SCHEMA = 'xtend.scaffold.app-preset.rmt-report.v2';
const RMT_APP_OWNER = 'XMS-07-rmt-app';
const RMT_APP_TEMPLATES = Object.freeze([
  { artifact: 'rmt-app-rmt', id: 'app-rmt', target: 'src/app.rmt', kind: 'rmt', ownershipMode: 'seed' },
  { artifact: 'rmt-app-css', id: 'app-css', target: 'src/app.css', kind: 'css', ownershipMode: 'seed' },
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
  return filterAppTemplatesForServer(RMT_APP_TEMPLATES, values.serverTarget).map(original => original.artifact === 'rmt-app-rmt' && values.sourceSyntax === 'rmtx'
    ? { ...original, artifact: 'rmt-app-rmtx', target: 'src/app.rmtx', kind: 'rmtx' } : original)
    .concat(values.sourceSyntax === 'rmtx' ? [{ artifact: 'rmtx-service-demands', id: 'app-service-demands', target: 'src/service-demands.rmt', kind: 'rmt', ownershipMode: 'seed' }] : []).map((definition) => {
    const rendered = renderTemplateForArtifact(definition.artifact, values);
    if (!rendered.ok) return { error: rendered.error, definition };
    let content = rendered.content;
    if (values.sourceSyntax === 'rmtx' && definition.id === 'maraca-config') {
      const classic = JSON.parse(content);
      content = JSON.stringify({ schema: 'xtend.maraca.project-config.v1',
        projectOptions: { sourceSyntax: 'rmtx', rmtxSyntaxVersion: '8.0.0' },
        config: { schema: 'xtend.maraca.build-config.v12', options: { ...classic.options, source: 'src/app.rmtx', rmtxSyntaxVersion: '8.0.0', cssSources: ['src/app.rmtx', 'src/app.css'] } } }, null, 2) + '\n';
    } else if (values.sourceSyntax === 'rmtx' && definition.id === 'package') {
      const manifest = JSON.parse(content);
      manifest.scripts.check = 'xt rmt check src/app.rmtx --project --source-syntax rmtx --rmtx-syntax-version 8.0.0 --json';
      manifest.scripts.watch = 'xt rmt watch src/app.rmtx --project --source-syntax rmtx --rmtx-syntax-version 8.0.0 --json';
      delete manifest.scripts.tune;
      manifest.devDependencies = { ...manifest.devDependencies, '@ccslabs/xtend-compiler': '^0.9.0' };
      for (const dependencies of [manifest.dependencies, manifest.devDependencies]) for (const name of Object.keys(dependencies || {})) if (name.startsWith('@ccslabs/xtend')) dependencies[name] = '^0.9.0';
      content = JSON.stringify(manifest, null, 2) + '\n';
    } else if (values.sourceSyntax === 'rmtx' && definition.id === 'smoke-test') {
      content = `'use strict';\nconst test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');\nconst root=path.resolve(__dirname,'..');\ntest('explicit Source8 RMTX scaffold contract',()=>{const config=JSON.parse(fs.readFileSync(path.join(root,'maraca.config.json'),'utf8'));assert.equal(config.schema,'xtend.maraca.project-config.v1');assert.equal(config.projectOptions.rmtxSyntaxVersion,'8.0.0');assert.equal(config.config.options.source,'src/app.rmtx');assert.match(fs.readFileSync(path.join(root,'src/app.rmtx'),'utf8'),/<RMT.Program/u);assert.equal(fs.existsSync(path.join(root,'src/app.rmt')),false);});\n`;
    }
    return {
      id: definition.id,
      path: path.posix.join(outputDir, definition.target),
      kind: definition.kind,
      content,
      generated: true,
      owner: RMT_APP_OWNER,
      templateId: rendered.template.id,
      templatePath: rendered.template.path,
      ownershipMode: definition.ownershipMode || 'managed'
    };
  });
}

function createRmtAppScaffold(input = {}, options = {}) {
  const rootDir = path.resolve(input.rootDir || input['root-dir'] || options.rootDir || process.cwd());
  const runtime = String(input.runtime || 'maraca');
  const sourceSyntax = String(input.sourceSyntax || input['source-syntax'] || 'rmt-vnext').replace(/^rmt$/u, 'rmt-vnext');
  const reportSchema = sourceSyntax === 'rmtx' ? RMTX_APP_SCAFFOLD_REPORT_SCHEMA : RMT_APP_SCAFFOLD_REPORT_SCHEMA;
  const designKit = String(input.designKit || input['design-kit'] || 'none').toLowerCase();
  const serverTarget = normalizeAppServerTarget(input);
  const requestedOutput = String(input.out || input.output || input.outputDir || 'rmt-app').replace(/\\/gu, '/').replace(/\/$/u, '');
  const normalizedOutput = normalizeRelativePath(requestedOutput);
  const errors = [];
  if (!['rmt-vnext', 'rmtx'].includes(sourceSyntax)) errors.push('RMT app source syntax must be rmt-vnext or rmtx.');
  if (runtime !== 'maraca') errors.push(`RMT app preset requires runtime "maraca", received "${runtime}".`);
  if (!['none', 'native', 'neutral'].includes(designKit)) errors.push(`Provider-neutral RMT app requires design kit none, native or neutral; received "${designKit}".`);
  if (!APP_SERVER_TARGETS.includes(serverTarget)) errors.push(`RMT app server target must be one of none, node, php or both; received "${serverTarget}".`);
  if (!normalizedOutput.ok || normalizedOutput.path === '.') errors.push(normalizedOutput.error || 'RMT app output must be a named directory below the current root.');
  if (toBoolean(input.write) && toBoolean(input.check)) errors.push('RMT app scaffold accepts either --write or --check, not both.');
  if (errors.length > 0) {
    return { schema: reportSchema, ok: false, status: 'blocked', preset: { runtime, designKit }, outputDir: normalizedOutput.ok ? normalizedOutput.path : requestedOutput, errors, diagnostics: [], files: [], writeReport: null };
  }

  const packageName = normalizePackageName(input.name || path.posix.basename(normalizedOutput.path));
  const rendered = renderEntries(normalizedOutput.path, {
    packageName,
    appTitle: String(input.title || titleFromPackageName(packageName)),
    appTitleRmtxJson: JSON.stringify(String(input.title || titleFromPackageName(packageName))).replace(/</gu, '\\u003c'),
    sourceSyntax,
    serviceId: 'app.health',
    serverTarget,
    serviceTargetsJson: JSON.stringify(appServiceTargets(serverTarget)),
    serveCommand: serverTarget === 'node' || serverTarget === 'both'
      ? 'npm start'
      : 'npm run build && xt serve --root . --default site/index.html --port 4173',
    startCommand: serverTarget === 'node' || serverTarget === 'both'
      ? 'npm run build && node server/index.mjs'
      : 'xt serve --root . --default site/index.html --port 4173',
    nodeTypesJson: JSON.stringify(serverTarget === 'node' || serverTarget === 'both' ? ['node'] : []),
    nodeTypesDependencyLine: serverTarget === 'node' || serverTarget === 'both'
      ? '"@types/node": "^24.13.3",\n    '
      : '',
    nodePublicPathsJson: JSON.stringify(['site/', 'dist/'])
  });
  const renderErrors = rendered.filter((entry) => entry.error).map((entry) => entry.error);
  if (renderErrors.length > 0) {
    return { schema: reportSchema, ok: false, status: 'blocked', preset: { runtime, designKit }, outputDir: normalizedOutput.path, errors: renderErrors, diagnostics: [], files: [], writeReport: null };
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
    ownershipSchema: 'xtend.scaffold.generated-ownership.v2',
    allowedRoots: [`${normalizedOutput.path}/`]
  });
  return {
    schema: reportSchema,
    scaffoldSchema: sourceSyntax === 'rmtx' ? RMTX_APP_SCAFFOLD_SCHEMA : RMT_APP_SCAFFOLD_SCHEMA,
    ok: writeReport.ok,
    status: writeReport.status,
    preset: { runtime: 'maraca', designKit: 'none', cssProvider: 'maraca-native', services: 'typescript', serverTarget,
      ...(sourceSyntax === 'rmtx' ? { sourceSyntax, syntaxVersion: '8.0.0' } : {}) },
    packageName,
    outputDir: normalizedOutput.path,
    ownershipPath,
    errors: writeReport.errors,
    diagnostics: [],
    files: writeReport.plan.operations.map((operation) => ({ id: operation.id, path: operation.path, kind: operation.kind, action: operation.action, changed: operation.changed, sha256: operation.sha256 })),
    writeReport,
    commands: { plan: 'npm run plan', build: 'npm run build', serve: 'npm run serve', start: 'npm run start',
      ...(sourceSyntax === 'rmtx' ? { check: 'npm run check', watch: 'npm run watch' } : { tune: 'npm run tune' }), test: 'npm test', catfood: 'npm run test:catfood' }
  };
}

module.exports = {
  RMT_APP_OWNER,
  RMT_APP_SCAFFOLD_REPORT_SCHEMA,
  RMT_APP_SCAFFOLD_SCHEMA,
  RMT_APP_TEMPLATES,
  RMTX_APP_SCAFFOLD_SCHEMA,
  RMTX_APP_SCAFFOLD_REPORT_SCHEMA,
  createRmtAppScaffold
};

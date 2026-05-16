'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  compileRmtVNextSource
} = require('../../tools/rmt-language/vnext-compiler');
const {
  createComponentFiles
} = require('./component-files');
const {
  normalizeRelativePath,
  writeScaffoldFiles
} = require('../writing/write-plan');
const {
  SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
  createManifestPatchEntry
} = require('../writing/manifest-patcher');

const RMT_APP_BUILD_SCHEMA = 'xtend.scaffold.rmt-app-build.v1';
const RMT_APP_BUILD_REPORT_SCHEMA = 'xtend.scaffold.rmt-app-build-report.v1';
const RMT_APP_BROWSER_SMOKE_SCHEMA = 'xtend.scaffold.rmt-app-browser-smoke.v1';
const DEFAULT_SOURCE_PATH = 'xtendrmt/rmt-lifecycle-demo.rmt';
const DEFAULT_LOCAL_GATE = 'node scripts/run_xtend_tests.js scaffold-rmt-build --json';
const DEFAULT_PROFILE = Object.freeze(['display', 'stateful']);
const DEFAULT_FEATURE = Object.freeze(['state', 'slots', 'manifest']);

function toBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function toArray(value, fallback = []) {
  if (Array.isArray(value)) return value.length > 0 ? value : fallback.slice();
  if (value === undefined || value === null || value === '') return fallback.slice();
  return [value];
}

function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function sanitizeKebab(value, fallback = 'rmt-app') {
  const sanitized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || fallback;
}

function ensureRelativeImport(relativePath) {
  const normalized = toPosixPath(path.posix.normalize(relativePath));
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
}

function relativeImport(fromPath, toPath) {
  return ensureRelativeImport(path.posix.relative(path.posix.dirname(fromPath), toPath));
}

function repoPath(rootDir, relativePath) {
  return path.resolve(rootDir, relativePath);
}

function outputSummary(output) {
  return {
    id: output.id,
    path: output.path || output.targetPath,
    kind: output.kind,
    generated: output.generated,
    sha256: sha256(output.content)
  };
}

function fileSummary(file) {
  return {
    id: file.id,
    action: file.action,
    targetPath: file.targetPath,
    templateId: file.templateId,
    templatePath: file.templatePath,
    sha256: sha256(file.content)
  };
}

function manifestPatchSummary(patch) {
  return {
    schema: patch.schema,
    patchersSchema: patch.patchersSchema,
    operation: patch.operation,
    targetPath: patch.targetPath,
    tag: patch.tag,
    source: patch.source,
    policies: patch.policies
  };
}

function countCore(core) {
  return {
    templates: Array.isArray(core.templates) ? core.templates.length : 0,
    surfaces: Array.isArray(core.surfaces) ? core.surfaces.length : 0,
    remoteSurfaces: Array.isArray(core.remoteSurfaces) ? core.remoteSurfaces.length : 0,
    lanes: Array.isArray(core.lanes) ? core.lanes.length : 0,
    operations: Array.isArray(core.operations) ? core.operations.length : 0,
    slots: Array.isArray(core.slots) ? core.slots.length : 0,
    events: Array.isArray(core.events) ? core.events.length : 0,
    dataSources: Array.isArray(core.dataSources) ? core.dataSources.length : 0
  };
}

function resolveBuildPaths(input = {}) {
  const rawSource = input.source || input.src || (Array.isArray(input._) ? input._[0] : null) || DEFAULT_SOURCE_PATH;
  const normalized = normalizeRelativePath(rawSource);
  if (!normalized.ok) {
    return {
      ok: false,
      errors: [normalized.error]
    };
  }

  if (!normalized.path.endsWith('.rmt')) {
    return {
      ok: false,
      errors: [`RMT build source "${normalized.path}" must be a .rmt vNext template.`]
    };
  }

  const sourcePath = normalized.path;
  const sourceDir = path.posix.dirname(sourcePath);
  const baseName = path.posix.basename(sourcePath, '.rmt');
  const slug = sanitizeKebab(baseName, 'rmt-app');
  const sourcePrefix = sourceDir === '.' ? '' : `${sourceDir}/`;
  const hostPrefix = sourceDir === '.' ? '' : `${sanitizeKebab(sourceDir)}-`;
  const tag = input.tag || input['component-tag'] || `x-${slug}-build`;

  return {
    ok: true,
    errors: [],
    sourcePath,
    sourceDir,
    baseName,
    slug,
    tag,
    corePath: input.core || input['core-output'] || `${sourcePrefix}${baseName}.rmt-build.core.json`,
    reportPath: input.report || input['scaffold-report'] || `${sourcePrefix}${baseName}.rmt-build.scaffold.json`,
    appPath: input.app || input['app-output'] || `${sourcePrefix}${baseName}.rmt-build.app.js`,
    hostPath: input.host || `${hostPrefix}${baseName}-rmt-build.html`,
    browserSmokePath: input['browser-smoke'] || input.browserSmoke || `tests/browser/fixtures/${baseName}-rmt-build-smoke.html`,
    componentPath: `components/${tag}.js`
  };
}

function lifecycleStages(paths, counts) {
  return [
    {
      id: 'template',
      label: 'RMT vNext Template',
      artifact: paths.sourcePath,
      status: 'source'
    },
    {
      id: 'core',
      label: 'Compiler Core',
      artifact: paths.corePath,
      status: 'compiled'
    },
    {
      id: 'scaffold',
      label: 'Scaffold Build',
      artifact: paths.componentPath,
      status: 'generated'
    },
    {
      id: 'http',
      label: 'HTTP/Test',
      artifact: paths.hostPath,
      status: counts.surfaces > 0 ? 'servable' : 'planned'
    }
  ];
}

function renderAppModule(context) {
  const componentImport = relativeImport(context.paths.appPath, context.paths.componentPath);
  const sourceImport = relativeImport(context.paths.appPath, context.paths.sourcePath);
  const coreImport = relativeImport(context.paths.appPath, context.paths.corePath);
  const reportImport = relativeImport(context.paths.appPath, context.paths.reportPath);
  const fingerprint = {
    schema: RMT_APP_BUILD_SCHEMA,
    source: context.paths.sourcePath,
    sourceSha256: context.sourceSha256,
    core: context.paths.corePath,
    coreSha256: context.coreSha256,
    scaffoldReport: context.paths.reportPath,
    generatedComponent: context.paths.componentPath,
    componentTag: context.paths.tag,
    sourceSyntax: 'rmt-vnext',
    counts: context.counts,
    stages: context.stages
  };

  return `// @generated by XTend Scaffold RMT app build.
// Source: ${context.paths.sourcePath}
// Command: ${context.buildCommand}
import '${componentImport}';

const SOURCE_URL = new URL('${sourceImport}', import.meta.url);
const CORE_URL = new URL('${coreImport}', import.meta.url);
const REPORT_URL = new URL('${reportImport}', import.meta.url);
const BUILD_FINGERPRINT = Object.freeze(${JSON.stringify(fingerprint, null, 2)});

function text(value) {
  return document.createTextNode(String(value));
}

function element(tagName, attributes = {}, children = []) {
  const node = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value === false || value === null || value === undefined) return;
    if (value === true) {
      node.setAttribute(name, '');
      return;
    }
    node.setAttribute(name, String(value));
  });
  children.forEach((child) => node.appendChild(typeof child === 'string' ? text(child) : child));
  return node;
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(\`Unable to load \${url.pathname}: \${response.status}\`);
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function renderRmtBuild(root, payload) {
  const component = element('${context.paths.tag}', {
    'aria-label': 'RMT app build',
    'data-rmt-build-component': BUILD_FINGERPRINT.componentTag
  });
  const summary = element('section', { class: 'xtend-rmt-build-summary' }, [
    element('h1', {}, ['RMT App Build']),
    element('p', {}, [BUILD_FINGERPRINT.source]),
    element('dl', {}, [
      element('dt', {}, ['Templates']),
      element('dd', {}, [String(BUILD_FINGERPRINT.counts.templates)]),
      element('dt', {}, ['Surfaces']),
      element('dd', {}, [String(BUILD_FINGERPRINT.counts.surfaces)]),
      element('dt', {}, ['Operations']),
      element('dd', {}, [String(BUILD_FINGERPRINT.counts.operations)])
    ])
  ]);
  component.appendChild(summary);
  root.replaceChildren(component);
  root.setAttribute('data-rmt-build-rendered', 'true');
  return {
    root,
    core: payload.core,
    report: payload.report,
    source: payload.source,
    fingerprint: BUILD_FINGERPRINT
  };
}

async function bootRmtBuildApp(options = {}) {
  const root = options.root || document.querySelector('[data-rmt-build-root]');
  if (!root) throw new Error('RMT build root not found');
  root.setAttribute('aria-busy', 'true');
  try {
    const payload = {
      source: await fetchText(SOURCE_URL),
      core: await fetchJson(CORE_URL),
      report: await fetchJson(REPORT_URL)
    };
    const result = renderRmtBuild(root, payload);
    root.setAttribute('aria-busy', 'false');
    window.__XTendRmtBuildResult = {
      status: 'passed',
      schema: '${RMT_APP_BUILD_SCHEMA}',
      sourceSyntax: result.core.manifest.sourceSyntax,
      generatedBy: result.report.buildCommand,
      counts: BUILD_FINGERPRINT.counts
    };
    return result;
  } catch (error) {
    root.setAttribute('aria-busy', 'false');
    root.setAttribute('data-rmt-build-rendered', 'failed');
    window.__XTendRmtBuildResult = {
      status: 'failed',
      schema: '${RMT_APP_BUILD_SCHEMA}',
      error: error.message
    };
    throw error;
  }
}

window.XTendRmtBuildApp = {
  schema: '${RMT_APP_BUILD_SCHEMA}',
  build: BUILD_FINGERPRINT,
  bootRmtBuildApp
};

export { BUILD_FINGERPRINT, bootRmtBuildApp };
export default window.XTendRmtBuildApp;
`;
}

function renderHostHtml(context) {
  const appImport = ensureRelativeImport(context.paths.appPath);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="xtend-preload" content="xstate,x-theme,${context.paths.tag}">
  <title>XTend RMT App Build</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div
    id="rmt-build-root"
    data-rmt-build-root
    data-rmt-template-src="${context.paths.sourcePath}"
    data-rmt-core-src="${context.paths.corePath}"
    data-scaffold-build="${context.buildCommand}"
    aria-busy="true"></div>
  <script type="module" src="xtend-loader.js" data-manifest="components/manifest.json"></script>
  <script type="module">
    window.__XTendRmtBuildBootPromise = (window.__XTendLoaderBootPromise || Promise.resolve())
      .then(() => import('${appImport}'))
      .then((module) => module.bootRmtBuildApp())
      .catch((error) => {
        window.__XTendRmtBuildResult = {
          status: 'failed',
          schema: '${RMT_APP_BUILD_SCHEMA}',
          error: error.message
        };
        console.error('XTend RMT app build failed', error);
      });
  </script>
</body>
</html>
`;
}

function renderBrowserSmokeHtml(context) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="xtend-preload" content="xstate,x-theme,${context.paths.tag}">
  <title>XTend RMT App Build Smoke</title>
</head>
<body>
  <div id="rmt-build-smoke-root" data-rmt-build-root aria-busy="true"></div>
  <script>
    window.__xtendRmtAppBuildSmokeResult = {
      status: 'pending',
      contract: '${RMT_APP_BROWSER_SMOKE_SCHEMA}',
      checks: [],
      errors: []
    };

    function recordCheck(label, passed, details) {
      window.__xtendRmtAppBuildSmokeResult.checks.push({ label, passed: Boolean(passed), details: details || null });
      if (!passed) {
        window.__xtendRmtAppBuildSmokeResult.errors.push(label);
      }
    }
  </script>
  <script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
  <script type="module">
    (async () => {
      try {
        await (window.__XTendLoaderBootPromise || Promise.resolve()).catch(() => {});
        const module = await import('/${context.paths.appPath}');
        const root = document.querySelector('[data-rmt-build-root]');
        const result = await module.bootRmtBuildApp({ root });
        recordCheck('rmt build source loaded', result.core.manifest.sourceSyntax === 'rmt-vnext');
        recordCheck('rmt build component defined', customElements.get('${context.paths.tag}'));
        recordCheck('rmt build app rendered', root.getAttribute('data-rmt-build-rendered') === 'true');
        recordCheck('rmt build core has template', result.core.templates.length >= 1);
        recordCheck('rmt build scaffold report linked app', result.report.generated.app === '${context.paths.appPath}');
        const externalAssets = Array.from(document.querySelectorAll('script[src], link[href], img[src]'))
          .map((node) => node.getAttribute('src') || node.getAttribute('href') || '')
          .filter((value) => /^https?:\\/\\//.test(value));
        recordCheck('rmt build local http assets only', externalAssets.length === 0, externalAssets.join(', '));
        window.__xtendRmtAppBuildSmokeResult.status = window.__xtendRmtAppBuildSmokeResult.errors.length ? 'failed' : 'passed';
        window.__xtendRmtAppBuildSmokeResult.counts = result.fingerprint.counts;
      } catch (error) {
        window.__xtendRmtAppBuildSmokeResult.status = 'failed';
        window.__xtendRmtAppBuildSmokeResult.errors.push(error.message);
      }
    })();
  </script>
</body>
</html>
`;
}

function createBuildReport(context) {
  return {
    schema: RMT_APP_BUILD_REPORT_SCHEMA,
    appBuildSchema: RMT_APP_BUILD_SCHEMA,
    browserSmokeSchema: RMT_APP_BROWSER_SMOKE_SCHEMA,
    status: 'built',
    source: context.paths.sourcePath,
    sourceSyntax: 'rmt-vnext',
    sourceSha256: context.sourceSha256,
    coreOutput: context.paths.corePath,
    coreSha256: context.coreSha256,
    buildCommand: context.buildCommand,
    checkCommand: context.checkCommand,
    localGate: DEFAULT_LOCAL_GATE,
    generated: {
      component: context.paths.componentPath,
      app: context.paths.appPath,
      host: context.paths.hostPath,
      browserSmoke: context.paths.browserSmokePath,
      report: context.paths.reportPath
    },
    scaffold: {
      entryPoint: 'xtend-builder/scaffold.js',
      generator: 'rmt-build',
      componentGenerator: context.scaffoldResult.schema,
      componentMode: context.scaffoldResult.mode,
      componentTag: context.paths.tag,
      writeStrategy: context.scaffoldResult.writeStrategy,
      files: context.scaffoldResult.files.map(fileSummary)
    },
    manifestPatch: manifestPatchSummary(context.manifestPatch.patch),
    lifecycle: context.stages,
    counts: context.counts,
    checks: [
      'template-source-is-rmt-vnext',
      'compiler-emits-deterministic-core-json',
      'scaffold-writes-generated-xtend-component',
      'scaffold-writes-generated-app-module',
      'manifest-patch-is-structured-json',
      'host-loads-over-http-dev-server',
      'browser-smoke-renders-generated-app'
    ],
    boundaries: [
      'source-owned-by-rmt-template',
      'generated-files-owned-by-scaffold-build',
      'manifest-patched-through-structured-patcher',
      'no-cdn-runtime-dependency',
      'no-rmt-kernel-import-of-xtend-types'
    ]
  };
}

function buildOutputEntries(context) {
  const appModule = renderAppModule(context);
  const hostHtml = renderHostHtml(context);
  const browserSmokeHtml = renderBrowserSmokeHtml(context);
  const report = createBuildReport(context);
  const reportJson = stableJson(report);

  return {
    report,
    outputs: [
      {
        id: 'core',
        path: context.paths.corePath,
        kind: 'rmt-vnext-core-json',
        generated: true,
        content: context.compileResult.coreJson
      },
      {
        ...context.manifestPatch.entry,
        id: 'manifest',
        kind: 'manifest-json'
      },
      {
        id: 'generated-component',
        path: context.paths.componentPath,
        kind: 'xtend-custom-element',
        generated: true,
        content: context.generatedComponent.content
      },
      {
        id: 'generated-app',
        path: context.paths.appPath,
        kind: 'xtend-rmt-app-module',
        generated: true,
        content: appModule
      },
      {
        id: 'host',
        path: context.paths.hostPath,
        kind: 'http-host',
        generated: true,
        content: hostHtml
      },
      {
        id: 'browser-smoke',
        path: context.paths.browserSmokePath,
        kind: 'browser-smoke-fixture',
        generated: true,
        content: browserSmokeHtml
      },
      {
        id: 'scaffold-report',
        path: context.paths.reportPath,
        kind: 'scaffold-rmt-app-build-report',
        generated: true,
        content: reportJson
      }
    ]
  };
}

function summarizeOutputs(outputs) {
  return outputs.map(outputSummary);
}

function createRmtAppBuild(input = {}, options = {}) {
  const rootDir = path.resolve(options.rootDir || input.rootDir || input['root-dir'] || process.cwd());
  const write = toBoolean(input.write);
  const check = toBoolean(input.check);
  const paths = resolveBuildPaths(input);
  if (!paths.ok) {
    return {
      schema: RMT_APP_BUILD_SCHEMA,
      ok: false,
      status: 'invalid_input',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      errors: paths.errors,
      outputs: []
    };
  }

  const absoluteSourcePath = repoPath(rootDir, paths.sourcePath);
  if (!fs.existsSync(absoluteSourcePath)) {
    return {
      schema: RMT_APP_BUILD_SCHEMA,
      ok: false,
      status: 'source_missing',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      errors: [`RMT build source "${paths.sourcePath}" does not exist.`],
      outputs: []
    };
  }

  const source = fs.readFileSync(absoluteSourcePath, 'utf8');
  const compileResult = compileRmtVNextSource({
    text: source,
    filePath: absoluteSourcePath,
    version: 1
  }, {
    documentId: input.documentId || input['document-id'],
    namespace: input.namespace
  });

  if (!compileResult.ok) {
    return {
      schema: RMT_APP_BUILD_SCHEMA,
      ok: false,
      status: 'compile_failed',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      errors: compileResult.diagnostics.map((diagnostic) => diagnostic.message),
      diagnostics: compileResult.diagnostics,
      outputs: []
    };
  }

  const scaffoldResult = createComponentFiles({
    tag: paths.tag,
    profile: toArray(input.profile, DEFAULT_PROFILE),
    feature: toArray(input.feature, DEFAULT_FEATURE),
    rootDir
  });

  if (!scaffoldResult.ok) {
    return {
      schema: RMT_APP_BUILD_SCHEMA,
      ok: false,
      status: 'scaffold_failed',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      errors: scaffoldResult.errors,
      outputs: []
    };
  }

  const generatedComponent = scaffoldResult.files.find((file) => file.id === 'component');
  if (!generatedComponent) {
    return {
      schema: RMT_APP_BUILD_SCHEMA,
      ok: false,
      status: 'component_missing',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      errors: ['component-files did not produce a component artifact.'],
      outputs: []
    };
  }

  const manifestPatch = createManifestPatchEntry({
    rootDir,
    patchPlan: scaffoldResult.wiring.manifest.patchPlan,
    targetPath: scaffoldResult.wiring.manifest.loader.target,
    tag: paths.tag
  });

  if (!manifestPatch.ok) {
    return {
      schema: RMT_APP_BUILD_SCHEMA,
      ok: false,
      status: 'manifest_patch_failed',
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      errors: manifestPatch.errors,
      outputs: []
    };
  }

  const counts = countCore(compileResult.coreDocument);
  const stages = lifecycleStages(paths, counts);
  const sourceSha = sha256(source);
  const coreSha = sha256(compileResult.coreJson);
  const buildCommand = `node xtend-builder/scaffold.js rmt-build --source ${paths.sourcePath} --write --json`;
  const checkCommand = `node xtend-builder/scaffold.js rmt-build --source ${paths.sourcePath} --check --json`;
  const context = {
    rootDir,
    paths,
    sourceSha256: sourceSha,
    coreSha256: coreSha,
    counts,
    stages,
    buildCommand,
    checkCommand,
    compileResult,
    scaffoldResult,
    generatedComponent,
    manifestPatch
  };
  const build = buildOutputEntries(context);
  const sourceOutputRoots = paths.sourceDir === '.'
    ? [paths.corePath, paths.appPath, paths.reportPath]
    : [`${paths.sourceDir}/`];
  const allowedRoots = Array.from(new Set([
    '.xtend-build/',
    'components/',
    ...sourceOutputRoots,
    'tests/browser/fixtures/',
    paths.hostPath
  ]));
  const writeReport = writeScaffoldFiles(build.outputs, {
    rootDir,
    write,
    check,
    force: toBoolean(input.force),
    generator: 'rmt-build',
    owner: `rmt-build:${paths.slug}`,
    allowedRoots
  });

  if (!writeReport.ok) {
    return {
      schema: RMT_APP_BUILD_SCHEMA,
      ok: false,
      status: writeReport.status,
      mode: write ? 'write' : (check ? 'check' : 'dry-run'),
      source: paths.sourcePath,
      coreOutput: paths.corePath,
      buildCommand,
      checkCommand,
      localGate: DEFAULT_LOCAL_GATE,
      errors: writeReport.errors,
      patches: [manifestPatch.patch],
      outputs: summarizeOutputs(build.outputs),
      writePlan: writeReport.plan,
      written: writeReport.writes,
      ownershipManifest: writeReport.ownershipManifest
    };
  }

  return {
    schema: RMT_APP_BUILD_SCHEMA,
    reportSchema: RMT_APP_BUILD_REPORT_SCHEMA,
    browserSmokeSchema: RMT_APP_BROWSER_SMOKE_SCHEMA,
    ok: true,
    status: write ? writeReport.status : (check ? writeReport.status : 'planned'),
    mode: write ? 'write' : (check ? 'check' : 'dry-run'),
    source: paths.sourcePath,
    coreOutput: paths.corePath,
    buildCommand,
    checkCommand,
    localGate: DEFAULT_LOCAL_GATE,
    componentTag: paths.tag,
    counts,
    report: build.report,
    patches: [manifestPatch.patch],
    outputs: build.outputs.map((output) => ({
      ...outputSummary(output),
      content: output.content
    })),
    writePlan: writeReport.plan,
    written: writeReport.writes,
    ownershipManifest: writeReport.ownershipManifest
  };
}

module.exports = {
  DEFAULT_LOCAL_GATE,
  DEFAULT_SOURCE_PATH,
  RMT_APP_BROWSER_SMOKE_SCHEMA,
  RMT_APP_BUILD_REPORT_SCHEMA,
  RMT_APP_BUILD_SCHEMA,
  SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
  createRmtAppBuild,
  resolveBuildPaths
};

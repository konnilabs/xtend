'use strict';
const fs = require('node:fs');
const path = require('node:path');

const MARACA_PROJECT_API_VERSION = '1.0.0';
const MARACA_PROJECT_CONFIG_SCHEMA = 'xtend.maraca.project-config.v1';
const MARACA_PROJECT_BUILD_PLAN_SCHEMA = 'xtend.maraca.project-build-plan.v1';
const MARACA_PROJECT_BUILD_RESULT_SCHEMA = 'xtend.maraca.project-build-result.v1';
const projectCompilers = new WeakSet();

function compilerTools() {
  try { return require('../tools/rmt-language/compilation-session'); }
  catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return require('@ccslabs/xtend-compiler/rmt-language/compilation-session');
  }
}
function projectTools() {
  try { return require('../tools/rmt-language/rmt-project'); }
  catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return require('@ccslabs/xtend-compiler/rmt-language/rmt-project');
  }
}
function isSupportedProjectSessionCompiler(compile, rootDir, preferred) {
  // These are fixed shipped owners, never a caller-provided authenticator or
  // global brand registry. Separate physical root/compiler tarballs each keep
  // their own private WeakMap; the supplied genuine session remains its owner.
  const owners = new Set([preferred]);
  for (const name of ['@ccslabs/xtend-compiler/rmt-language/compilation-session', '@ccslabs/xtend/rmt-language/compilation-session']) {
    let target;
    try { target = require.resolve(name); }
    catch (error) {
      if (['MODULE_NOT_FOUND', 'ERR_PACKAGE_PATH_NOT_EXPORTED'].includes(error.code)) continue;
      throw error;
    }
    owners.add(require(target));
  }
  return [...owners].some(owner => owner.RMT_COMPILATION_SESSION_API_VERSION === '2.0.0'
    && owner.RMT_COMPILATION_SESSION_SCHEMA === 'xtend.rmt.compilation-session.v2'
    && typeof owner.getRmtProjectSessionCompilerRoot === 'function'
    && owner.getRmtProjectSessionCompilerRoot(compile) === rootDir);
}
function isMaracaProjectCompiler(compile) { return typeof compile === 'function' && projectCompilers.has(compile); }
function createContext(input, options) {
  const raw = typeof input === 'string' ? { source: input } : { ...input };
  const rootDir = path.resolve(options.rootDir || raw.rootDir || process.cwd());
  const configPath = raw.config || raw.configPath || raw['build-config'];
  let defaults = {}, projectOptions = {};
  if (configPath) {
    const file = path.resolve(rootDir, configPath);
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (config.schema === MARACA_PROJECT_CONFIG_SCHEMA) {
      if (Object.keys(config).some(key => !['schema', 'config', 'projectOptions'].includes(key))
        || !config.config || typeof config.config !== 'object' || !config.config.options
        || !config.projectOptions || typeof config.projectOptions !== 'object') throw new TypeError('A project-config.v1 requires projectOptions and a nested native build configuration.');
      if (!/^xtend\.maraca\.build-config\.v(?:[1-9]|1[0-2])$/u.test(config.config.schema || '')
        || Object.keys(config.config).some(key => !['schema', 'options'].includes(key))) throw new TypeError('A project configuration embeds an unlocked, versioned build-config with schema and options only.');
      if (Object.keys(config.projectOptions).some(key => !['sourceSyntax', 'rmtxSyntaxVersion', 'rmtxProvidersFile', 'rmtxProviders', 'documentId', 'namespace'].includes(key))) throw new TypeError('Unknown project compiler option.');
      defaults = { ...config.config.options };
      projectOptions = { ...config.projectOptions };
      delete raw.config; delete raw.configPath; delete raw['build-config'];
    }
  }
  const values = { ...defaults, ...raw };
  projectOptions = { ...projectOptions,
    ...(values.sourceSyntax || values['source-syntax'] ? { sourceSyntax: values.sourceSyntax || values['source-syntax'] } : {}),
    ...(values.rmtxProvidersFile || values['rmtx-providers-file'] ? { rmtxProvidersFile: values.rmtxProvidersFile || values['rmtx-providers-file'] } : {}),
    ...(values.rmtxProviders ? { rmtxProviders: values.rmtxProviders } : {}),
    ...(values.rmtxSyntaxVersion || values['rmtx-syntax-version'] ? { rmtxSyntaxVersion: values.rmtxSyntaxVersion || values['rmtx-syntax-version'] } : {}) };
  if (projectOptions.sourceSyntax === 'rmt') projectOptions.sourceSyntax = 'rmt-vnext';
  if (!projectOptions.rmtxSyntaxVersion) projectOptions.rmtxSyntaxVersion = '8.0.0';
  for (const key of ['project', 'sourceSyntax', 'source-syntax', 'rmtx-syntax-version', 'rmtxProvidersFile', 'rmtx-providers-file']) delete values[key];
  // Syntax is selected by the authenticated project graph. Do not force the
  // entry's suffix onto the effective profile of a mixed-language graph.
  delete values.rmtxSyntaxVersion;
  const hasSourceText = typeof values.sourceText === 'string' || typeof values.sourceContent === 'string';
  const positional = Array.isArray(values._) && values._[0];
  const filePath = hasSourceText
    ? values.virtualSourcePath || values.filePath || values.sourcePath || positional || (projectOptions.sourceSyntax === 'rmtx' ? 'docs/rmt-playground-source.rmtx' : 'docs/rmt-playground-source.rmt')
    : values.source || values.src || values.app || positional || require('./index').DEFAULT_SOURCE;
  // The snapshot and native planner must consume the same selected identity.
  // In particular an explicitly RMTX inline source cannot regain the native
  // planner's legacy .rmt fallback when the caller leaves its path optional.
  if (hasSourceText) values.virtualSourcePath = filePath;
  const graph = projectTools().createRmtProjectSnapshot({ filePath: path.resolve(rootDir, filePath),
    ...(hasSourceText ? { text: typeof values.sourceText === 'string' ? values.sourceText : values.sourceContent } : {}) }, { ...projectOptions, rootDir });
  // The project resolver is the single authority for default/explicit provider
  // selection, containment and dependency hashes. Native Plan12 consumes that
  // exact existing pins descriptor to include the actual provider modules.
  if (graph.ok && graph.rmtxProviders) values.rmtxProviders = graph.rmtxProviders;
  else if (!graph.ok) delete values.rmtxProviders;
  const tools = compilerTools();
  const suppliedCompiler = options.compileSource;
  if (suppliedCompiler && !isSupportedProjectSessionCompiler(suppliedCompiler, rootDir, tools)) throw new TypeError('A shared project compiler must come from a genuine compilation session for the same root.');
  const session = suppliedCompiler ? null : tools.createRmtCompilationSession({ root: rootDir, applyDefaultDocumentId: false, readonlyResults: true });
  const context = { values, rootDir, session, project: null, dispose: () => session?.dispose() };
  context.compile = (source, selected) => {
    const result = (suppliedCompiler || session.compileProjectSource)(source, { ...projectOptions, ...selected });
    context.project = result.project || null;
    return result;
  };
  projectCompilers.add(context.compile);
  return context;
}
function failed(schema, error) {
  return { schema, apiVersion: MARACA_PROJECT_API_VERSION, ok: false, status: 'project_invalid', project: null,
    diagnostics: error.diagnostics || [{ code: 'xtend.maraca.project.invalid', severity: 'error', message: error.message }], plan: null };
}
function createMaracaProjectBuildPlan(input = {}, options = {}) {
  let context;
  try {
    context = createContext(input, options);
    const plan = require('./index').createMaracaBuildPlan(context.values, { ...options, rootDir: context.rootDir, compileSource: context.compile });
    return { schema: MARACA_PROJECT_BUILD_PLAN_SCHEMA, apiVersion: MARACA_PROJECT_API_VERSION,
      ok: plan.ok, status: plan.status, project: context.project, diagnostics: plan.diagnostics || [], plan };
  } catch (error) { return failed(MARACA_PROJECT_BUILD_PLAN_SCHEMA, error); }
  finally { context?.dispose(); }
}
function buildMaracaProjectBundle(input = {}, options = {}) {
  let context;
  try {
    context = createContext(input, options);
    const build = require('./index').buildMaracaBundle(context.values, { ...options, rootDir: context.rootDir, compileSource: context.compile });
    return { schema: MARACA_PROJECT_BUILD_RESULT_SCHEMA, apiVersion: MARACA_PROJECT_API_VERSION,
      ok: build.ok, status: build.status, project: context.project, diagnostics: build.diagnostics || [], build };
  } catch (error) { return { ...failed(MARACA_PROJECT_BUILD_RESULT_SCHEMA, error), build: null }; }
  finally { context?.dispose(); }
}
async function buildMaracaProjectBundleAsync(input = {}, options = {}) {
  let context;
  try {
    context = createContext(input, options);
    const build = await require('./index').buildMaracaBundleAsync(context.values, { ...options, rootDir: context.rootDir, compileSource: context.compile });
    return { schema: MARACA_PROJECT_BUILD_RESULT_SCHEMA, apiVersion: MARACA_PROJECT_API_VERSION,
      ok: build.ok, status: build.status, project: context.project, diagnostics: build.diagnostics || [], build };
  } catch (error) { return { ...failed(MARACA_PROJECT_BUILD_RESULT_SCHEMA, error), build: null }; }
  finally { context?.dispose(); }
}
module.exports = { MARACA_PROJECT_API_VERSION, MARACA_PROJECT_CONFIG_SCHEMA, MARACA_PROJECT_BUILD_PLAN_SCHEMA, MARACA_PROJECT_BUILD_RESULT_SCHEMA,
  createMaracaProjectBuildPlan, buildMaracaProjectBundle, buildMaracaProjectBundleAsync, isMaracaProjectCompiler };

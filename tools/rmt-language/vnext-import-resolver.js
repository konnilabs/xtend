const fs = require('fs');
const path = require('path');
const {
  RMT_VNEXT_CORE_SCHEMA,
  compileRmtVNextSource
} = require('./vnext-compiler');

const RMT_VNEXT_IMPORT_RESOLVER_SCHEMA = 'xtend.rmt.vnext-import-resolver.v1';
const RMT_VNEXT_MODULE_GRAPH_SCHEMA = 'xtend.rmt.vnext-module-graph.v1';
const RMT_VNEXT_MODULE_RECORD_SCHEMA = 'xtend.rmt.vnext-module-record.v1';
const RMT_VNEXT_IMPORT_EDGE_SCHEMA = 'xtend.rmt.vnext-import-edge.v1';
const RMT_VNEXT_IMPORT_RESOLVER_REPORT_SCHEMA = 'xtend.rmt.vnext-import-resolver-report.v1';
const RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE = 'WP-E15-11';
const RMT_VNEXT_IMPORT_RESOLVER_MODULE_PATH = 'tools/rmt-language/vnext-import-resolver.js';
const RMT_VNEXT_IMPORT_RESOLVER_SUITE_PATH = 'tests/rmt-language/rmt_vnext_import_resolver_suite.js';
const RMT_VNEXT_IMPORT_RESOLVER_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-imports';

const IMPORT_PATH_MISSING_CODE = 'rmt.vnext.import.path.missing';
const IMPORT_PATH_UNSUPPORTED_CODE = 'rmt.vnext.import.path.unsupported';
const IMPORT_GLOB_UNSUPPORTED_CODE = 'rmt.vnext.import.glob.unsupported';
const IMPORT_GLOB_EMPTY_CODE = 'rmt.vnext.import.glob.empty';
const IMPORT_BOUNDARY_VIOLATION_CODE = 'rmt.vnext.import.boundary.violation';
const IMPORT_FILE_MISSING_CODE = 'rmt.vnext.import.file.missing';
const IMPORT_FILE_READ_FAILED_CODE = 'rmt.vnext.import.file.read_failed';
const IMPORT_COMPILE_FAILED_CODE = 'rmt.vnext.import.file.compile_failed';
const IMPORT_CYCLE_CODE = 'rmt.vnext.import.cycle';
const IMPORT_DUPLICATE_MODULE_CODE = 'rmt.vnext.import.module.duplicate';

const ALLOWED_IMPORT_MODES = Object.freeze(['static_file', 'static_glob']);
const ALLOWED_EXTENSIONS = Object.freeze(['.rmt']);
const ALLOWED_GLOB_FORMS = Object.freeze(['./dir/*.rmt', './dir/**/*.rmt']);

function toPosixPath(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function ensureAbsolute(rootDir, filePath) {
  if (!filePath) return path.resolve(rootDir || process.cwd(), 'rmt.vnext.document.rmt');
  return path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(rootDir || process.cwd(), filePath);
}

function normalizeRootList(rootDir, roots, entryFile) {
  const rootList = Array.isArray(roots) && roots.length > 0
    ? roots
    : [path.dirname(entryFile)];

  return rootList
    .filter(Boolean)
    .map((root) => ensureAbsolute(rootDir, root));
}

function isInsideRoot(filePath, root) {
  const relative = path.relative(root, filePath);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function isInsideAnyRoot(filePath, roots) {
  return roots.some((root) => isInsideRoot(filePath, root));
}

function shortestRelativePath(filePath, roots) {
  const sortedRoots = roots.slice().sort((a, b) => b.length - a.length);
  const root = sortedRoots.find((candidate) => isInsideRoot(filePath, candidate)) || sortedRoots[0] || process.cwd();
  return toPosixPath(path.relative(root, filePath) || path.basename(filePath));
}

function moduleIdForPath(filePath, roots) {
  return `module:${shortestRelativePath(filePath, roots)}`;
}

function cloneRange(range = {}) {
  range = range || {};
  return {
    start: {
      line: range.start && Number.isInteger(range.start.line) ? range.start.line : 0,
      character: range.start && Number.isInteger(range.start.character) ? range.start.character : 0
    },
    end: {
      line: range.end && Number.isInteger(range.end.line) ? range.end.line : 0,
      character: range.end && Number.isInteger(range.end.character) ? range.end.character : 0
    },
    startOffset: Number.isInteger(range.startOffset) ? range.startOffset : 0,
    endOffset: Number.isInteger(range.endOffset) ? range.endOffset : 0
  };
}

function findSourceEntry(coreDocument, sourceRef) {
  const sourceMap = Array.isArray(coreDocument && coreDocument.sourceMap) ? coreDocument.sourceMap : [];
  return sourceMap.find((entry) => entry && entry.id === sourceRef) || null;
}

function createImportDiagnostic(moduleRecord, importRecord, code, message, severity = 'error', metadata = {}) {
  const sourceEntry = findSourceEntry(moduleRecord && moduleRecord.coreDocument, importRecord && importRecord.sourceRef);
  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: RMT_VNEXT_IMPORT_RESOLVER_SCHEMA,
    workpackage: RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE,
    severity,
    code,
    message,
    moduleId: moduleRecord && moduleRecord.id || null,
    importId: importRecord && importRecord.id || null,
    importPath: importRecord && importRecord.path || null,
    corePointer: sourceEntry && sourceEntry.corePointer ? sourceEntry.corePointer : null,
    sourceRef: importRecord && importRecord.sourceRef || null,
    range: cloneRange(sourceEntry && sourceEntry.range),
    metadata
  };
}

function uniqueList(values = []) {
  const result = [];
  values.forEach((value) => {
    if (value === null || value === undefined) return;
    const normalized = String(value);
    if (normalized && !result.includes(normalized)) result.push(normalized);
  });
  return result;
}

function defaultFileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function defaultDirectoryExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
}

function defaultReadText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function defaultListFiles(directory, options = {}) {
  if (!defaultDirectoryExists(directory)) return [];

  const recursive = options.recursive === true;
  const result = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));

  entries.forEach((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory() && recursive) {
      result.push(...defaultListFiles(fullPath, options));
      return;
    }

    if (entry.isFile()) result.push(fullPath);
  });

  return result;
}

function isRelativeImportPath(importPath) {
  return importPath.startsWith('./') || importPath.startsWith('../');
}

function hasAllowedExtension(filePath) {
  return ALLOWED_EXTENSIONS.includes(path.extname(filePath));
}

function globInfo(importPath) {
  if (!importPath.includes('*')) return null;
  const normalized = toPosixPath(importPath);
  const recursive = normalized.includes('/**/');
  const starCount = (normalized.match(/\*/g) || []).length;

  if (recursive) {
    const [prefix, suffix] = normalized.split('/**/');
    return {
      ok: starCount === 2 && suffix === '*.rmt',
      recursive: true,
      basePattern: prefix,
      suffix: '.rmt'
    };
  }

  const lastSlash = normalized.lastIndexOf('/');
  const filePattern = normalized.slice(lastSlash + 1);
  return {
    ok: starCount === 1 && filePattern === '*.rmt',
    recursive: false,
    basePattern: normalized.slice(0, lastSlash),
    suffix: '.rmt'
  };
}

function createEdge(moduleRecord, importRecord, resolvedPaths, diagnostics) {
  const status = diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';
  return {
    schema: RMT_VNEXT_IMPORT_EDGE_SCHEMA,
    id: `${moduleRecord.id}#${importRecord.id}`,
    importer: moduleRecord.id,
    importId: importRecord.id,
    importPath: importRecord.path || null,
    mode: importRecord.mode || null,
    resolvedPaths: resolvedPaths.map(toPosixPath),
    status,
    diagnostics
  };
}

function resolveFileImport(moduleRecord, importRecord, context) {
  const diagnostics = [];
  const importPath = importRecord.path || '';

  if (!importPath) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_PATH_MISSING_CODE,
      `Import "${importRecord.id}" has no static path.`
    ));
    return createEdge(moduleRecord, importRecord, [], diagnostics);
  }

  if (!isRelativeImportPath(importPath)) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_PATH_UNSUPPORTED_CODE,
      `Import path "${importPath}" must be relative and statically analyzable.`,
      'error',
      { allowedForms: ['./file.rmt', '../file.rmt', ...ALLOWED_GLOB_FORMS] }
    ));
    return createEdge(moduleRecord, importRecord, [], diagnostics);
  }

  const resolvedPath = path.resolve(path.dirname(moduleRecord.filePath), importPath);
  if (!hasAllowedExtension(resolvedPath)) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_PATH_UNSUPPORTED_CODE,
      `Import path "${importPath}" must resolve to a .rmt file.`,
      'error',
      { allowedExtensions: ALLOWED_EXTENSIONS.slice() }
    ));
  }

  if (!isInsideAnyRoot(resolvedPath, context.roots)) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_BOUNDARY_VIOLATION_CODE,
      `Import path "${importPath}" leaves the configured RMT package roots.`,
      'error',
      { resolvedPath: toPosixPath(resolvedPath), roots: context.roots.map(toPosixPath) }
    ));
    return createEdge(moduleRecord, importRecord, [], diagnostics);
  }

  if (!context.fileExists(resolvedPath)) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_FILE_MISSING_CODE,
      `Import path "${importPath}" resolved to missing file "${shortestRelativePath(resolvedPath, context.roots)}".`,
      'error',
      { resolvedPath: toPosixPath(resolvedPath) }
    ));
    return createEdge(moduleRecord, importRecord, [], diagnostics);
  }

  return createEdge(moduleRecord, importRecord, diagnostics.length > 0 ? [] : [resolvedPath], diagnostics);
}

function resolveGlobImport(moduleRecord, importRecord, context) {
  const diagnostics = [];
  const importPath = importRecord.path || '';
  const info = globInfo(importPath);

  if (!importPath || !info || !info.ok || !isRelativeImportPath(importPath)) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_GLOB_UNSUPPORTED_CODE,
      `Glob import "${importPath || 'unknown'}" is not one of the supported static vNext glob forms.`,
      'error',
      { allowedForms: ALLOWED_GLOB_FORMS.slice() }
    ));
    return createEdge(moduleRecord, importRecord, [], diagnostics);
  }

  const baseDir = path.resolve(path.dirname(moduleRecord.filePath), info.basePattern);
  if (!isInsideAnyRoot(baseDir, context.roots)) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_BOUNDARY_VIOLATION_CODE,
      `Glob import "${importPath}" leaves the configured RMT package roots.`,
      'error',
      { resolvedPath: toPosixPath(baseDir), roots: context.roots.map(toPosixPath) }
    ));
    return createEdge(moduleRecord, importRecord, [], diagnostics);
  }

  const matches = context.listFiles(baseDir, { recursive: info.recursive })
    .filter((filePath) => hasAllowedExtension(filePath))
    .filter((filePath) => isInsideAnyRoot(filePath, context.roots))
    .sort((left, right) => toPosixPath(left).localeCompare(toPosixPath(right)));

  if (matches.length === 0) {
    diagnostics.push(createImportDiagnostic(
      moduleRecord,
      importRecord,
      IMPORT_GLOB_EMPTY_CODE,
      `Glob import "${importPath}" did not resolve to any .rmt module.`,
      'error',
      { baseDir: toPosixPath(baseDir) }
    ));
  }

  return createEdge(moduleRecord, importRecord, matches, diagnostics);
}

function resolveImportEdge(moduleRecord, importRecord, context) {
  if (!ALLOWED_IMPORT_MODES.includes(importRecord.mode)) {
    return createEdge(moduleRecord, importRecord, [], [
      createImportDiagnostic(
        moduleRecord,
        importRecord,
        IMPORT_PATH_UNSUPPORTED_CODE,
        `Import mode "${importRecord.mode || 'unknown'}" is not supported by the vNext import resolver.`,
        'error',
        { allowedModes: ALLOWED_IMPORT_MODES.slice() }
      )
    ]);
  }

  if (importRecord.mode === 'static_glob') {
    return resolveGlobImport(moduleRecord, importRecord, context);
  }

  return resolveFileImport(moduleRecord, importRecord, context);
}

function createReadFailedModule(filePath, context, error) {
  const moduleRecord = {
    schema: RMT_VNEXT_MODULE_RECORD_SCHEMA,
    id: moduleIdForPath(filePath, context.roots),
    filePath: toPosixPath(filePath),
    relativePath: shortestRelativePath(filePath, context.roots),
    status: 'blocked',
    importCount: 0,
    imports: [],
    dependencies: [],
    coreDocument: null,
    diagnostics: []
  };
  moduleRecord.diagnostics.push(createImportDiagnostic(
    moduleRecord,
    null,
    IMPORT_FILE_READ_FAILED_CODE,
    `Module "${moduleRecord.relativePath}" could not be read.`,
    'error',
    { error: error && error.message || String(error || 'unknown') }
  ));
  return moduleRecord;
}

function compileModule(filePath, context) {
  let text = '';
  try {
    text = context.readText(filePath);
  } catch (error) {
    return createReadFailedModule(filePath, context, error);
  }

  const compileResult = compileRmtVNextSource({
    text,
    filePath
  }, {
    documentId: shortestRelativePath(filePath, context.roots)
  });
  const moduleRecord = {
    schema: RMT_VNEXT_MODULE_RECORD_SCHEMA,
    id: moduleIdForPath(filePath, context.roots),
    filePath: toPosixPath(filePath),
    relativePath: shortestRelativePath(filePath, context.roots),
    status: compileResult.ok ? 'ready' : 'blocked',
    importCount: 0,
    imports: [],
    dependencies: [],
    coreDocument: compileResult.coreDocument,
    diagnostics: compileResult.diagnostics || []
  };

  if (!compileResult.ok) {
    moduleRecord.diagnostics.push(createImportDiagnostic(
      moduleRecord,
      null,
      IMPORT_COMPILE_FAILED_CODE,
      `Module "${moduleRecord.relativePath}" failed vNext compilation.`
    ));
  }

  return moduleRecord;
}

function createCycleDiagnostic(moduleRecord, importRecord, resolvedPath, stack, context) {
  const cycle = stack
    .slice(stack.indexOf(resolvedPath))
    .concat([resolvedPath])
    .map((filePath) => moduleIdForPath(filePath, context.roots));

  return createImportDiagnostic(
    moduleRecord,
    importRecord,
    IMPORT_CYCLE_CODE,
    `Import "${importRecord.path}" creates a static module cycle.`,
    'error',
    { cycle }
  );
}

function createModuleGraph(input = {}, options = {}) {
  const rootDir = ensureAbsolute(process.cwd(), options.rootDir || process.cwd());
  const entryFile = ensureAbsolute(rootDir, input.entryFile || input.filePath);
  const roots = normalizeRootList(rootDir, options.roots, entryFile);
  const context = {
    rootDir,
    entryFile,
    roots,
    fileExists: options.fileExists || defaultFileExists,
    readText: options.readText || defaultReadText,
    listFiles: options.listFiles || defaultListFiles,
    modulesByPath: new Map(),
    modules: [],
    edges: [],
    diagnostics: [],
    loadOrder: [],
    mergeOrder: []
  };

  function visit(filePath, stack = []) {
    const normalizedPath = path.normalize(filePath);
    if (context.modulesByPath.has(normalizedPath)) {
      return context.modulesByPath.get(normalizedPath);
    }

    const moduleRecord = compileModule(normalizedPath, context);
    context.modulesByPath.set(normalizedPath, moduleRecord);
    context.modules.push(moduleRecord);
    context.loadOrder.push(moduleRecord.id);

    if (!moduleRecord.coreDocument) {
      context.diagnostics.push(...moduleRecord.diagnostics);
      context.mergeOrder.push(moduleRecord.id);
      return moduleRecord;
    }

    const nextStack = stack.concat([normalizedPath]);
    const importRecords = Array.isArray(moduleRecord.coreDocument.imports) ? moduleRecord.coreDocument.imports : [];
    moduleRecord.importCount = importRecords.length;

    importRecords.forEach((importRecord) => {
      const edge = resolveImportEdge(moduleRecord, importRecord, context);
      const cycleDiagnostics = [];

      edge.resolvedPaths.forEach((resolvedPathValue) => {
        const resolvedPath = path.normalize(resolvedPathValue);
        if (nextStack.includes(resolvedPath)) {
          cycleDiagnostics.push(createCycleDiagnostic(moduleRecord, importRecord, resolvedPath, nextStack, context));
          return;
        }

        moduleRecord.dependencies.push(moduleIdForPath(resolvedPath, context.roots));
        visit(resolvedPath, nextStack);
      });

      if (cycleDiagnostics.length > 0) {
        edge.status = 'blocked';
        edge.diagnostics.push(...cycleDiagnostics);
      }

      moduleRecord.imports.push(edge);
      context.edges.push(edge);
      moduleRecord.diagnostics.push(...edge.diagnostics);
      context.diagnostics.push(...edge.diagnostics);
    });

    moduleRecord.dependencies = uniqueList(moduleRecord.dependencies);
    moduleRecord.status = moduleRecord.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : moduleRecord.status;
    context.mergeOrder.push(moduleRecord.id);
    return moduleRecord;
  }

  if (!isInsideAnyRoot(entryFile, roots)) {
    const moduleRecord = {
      schema: RMT_VNEXT_MODULE_RECORD_SCHEMA,
      id: moduleIdForPath(entryFile, roots),
      filePath: toPosixPath(entryFile),
      relativePath: shortestRelativePath(entryFile, roots),
      status: 'blocked',
      importCount: 0,
      imports: [],
      dependencies: [],
      coreDocument: null,
      diagnostics: []
    };
    const diagnostic = createImportDiagnostic(
      moduleRecord,
      null,
      IMPORT_BOUNDARY_VIOLATION_CODE,
      `Entry file "${moduleRecord.relativePath}" is outside configured RMT package roots.`,
      'error',
      { entryFile: toPosixPath(entryFile), roots: roots.map(toPosixPath) }
    );
    moduleRecord.diagnostics.push(diagnostic);
    context.modules.push(moduleRecord);
    context.diagnostics.push(diagnostic);
  } else if (!context.fileExists(entryFile)) {
    const moduleRecord = {
      schema: RMT_VNEXT_MODULE_RECORD_SCHEMA,
      id: moduleIdForPath(entryFile, roots),
      filePath: toPosixPath(entryFile),
      relativePath: shortestRelativePath(entryFile, roots),
      status: 'blocked',
      importCount: 0,
      imports: [],
      dependencies: [],
      coreDocument: null,
      diagnostics: []
    };
    const diagnostic = createImportDiagnostic(
      moduleRecord,
      null,
      IMPORT_FILE_MISSING_CODE,
      `Entry file "${moduleRecord.relativePath}" is missing.`
    );
    moduleRecord.diagnostics.push(diagnostic);
    context.modules.push(moduleRecord);
    context.diagnostics.push(diagnostic);
  } else {
    visit(entryFile, []);
  }

  const duplicateDiagnostics = detectDuplicateModuleIds(context.modules);
  context.diagnostics.push(...duplicateDiagnostics);
  const status = context.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'blocked' : 'ready';

  return {
    schema: RMT_VNEXT_MODULE_GRAPH_SCHEMA,
    resolverSchema: RMT_VNEXT_IMPORT_RESOLVER_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE,
    status,
    ok: status !== 'blocked',
    entryModule: moduleIdForPath(entryFile, roots),
    entryFile: toPosixPath(entryFile),
    roots: roots.map(toPosixPath),
    allowedImportModes: ALLOWED_IMPORT_MODES.slice(),
    allowedExtensions: ALLOWED_EXTENSIONS.slice(),
    allowedGlobForms: ALLOWED_GLOB_FORMS.slice(),
    moduleCount: context.modules.length,
    edgeCount: context.edges.length,
    loadOrder: context.loadOrder.slice(),
    merge: {
      strategy: 'dependency-first-postorder',
      order: uniqueList(context.mergeOrder),
      moduleCount: uniqueList(context.mergeOrder).length
    },
    modules: context.modules,
    edges: context.edges,
    diagnostics: context.diagnostics
  };
}

function detectDuplicateModuleIds(modules = []) {
  const diagnostics = [];
  const seen = new Map();

  modules.forEach((moduleRecord) => {
    if (!moduleRecord || !moduleRecord.id) return;
    if (seen.has(moduleRecord.id)) {
      diagnostics.push(createImportDiagnostic(
        moduleRecord,
        null,
        IMPORT_DUPLICATE_MODULE_CODE,
        `Module id "${moduleRecord.id}" appears more than once in the vNext module graph.`,
        'error',
        { firstPath: seen.get(moduleRecord.id), duplicatePath: moduleRecord.filePath }
      ));
    } else {
      seen.set(moduleRecord.id, moduleRecord.filePath);
    }
  });

  return diagnostics;
}

function serializeModuleGraph(graph) {
  return `${JSON.stringify(graph, null, 2)}\n`;
}

function createRmtVNextImportResolver(defaultOptions = {}) {
  return Object.freeze({
    schema: RMT_VNEXT_IMPORT_RESOLVER_SCHEMA,
    moduleGraphSchema: RMT_VNEXT_MODULE_GRAPH_SCHEMA,
    moduleRecordSchema: RMT_VNEXT_MODULE_RECORD_SCHEMA,
    importEdgeSchema: RMT_VNEXT_IMPORT_EDGE_SCHEMA,
    coreSchema: RMT_VNEXT_CORE_SCHEMA,
    workpackage: RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE,
    allowedImportModes: ALLOWED_IMPORT_MODES.slice(),
    allowedExtensions: ALLOWED_EXTENSIONS.slice(),
    allowedGlobForms: ALLOWED_GLOB_FORMS.slice(),
    createGraph: (input = {}, options = {}) => createModuleGraph(input, {
      ...defaultOptions,
      ...options
    }),
    serializeGraph: serializeModuleGraph
  });
}

module.exports = {
  ALLOWED_EXTENSIONS,
  ALLOWED_GLOB_FORMS,
  ALLOWED_IMPORT_MODES,
  IMPORT_BOUNDARY_VIOLATION_CODE,
  IMPORT_COMPILE_FAILED_CODE,
  IMPORT_CYCLE_CODE,
  IMPORT_DUPLICATE_MODULE_CODE,
  IMPORT_FILE_MISSING_CODE,
  IMPORT_FILE_READ_FAILED_CODE,
  IMPORT_GLOB_EMPTY_CODE,
  IMPORT_GLOB_UNSUPPORTED_CODE,
  IMPORT_PATH_MISSING_CODE,
  IMPORT_PATH_UNSUPPORTED_CODE,
  RMT_VNEXT_IMPORT_EDGE_SCHEMA,
  RMT_VNEXT_IMPORT_RESOLVER_MODULE_PATH,
  RMT_VNEXT_IMPORT_RESOLVER_PACKAGE_SCRIPT,
  RMT_VNEXT_IMPORT_RESOLVER_REPORT_SCHEMA,
  RMT_VNEXT_IMPORT_RESOLVER_SCHEMA,
  RMT_VNEXT_IMPORT_RESOLVER_SUITE_PATH,
  RMT_VNEXT_IMPORT_RESOLVER_WORKPACKAGE,
  RMT_VNEXT_MODULE_GRAPH_SCHEMA,
  RMT_VNEXT_MODULE_RECORD_SCHEMA,
  createModuleGraph,
  createRmtVNextImportResolver,
  serializeModuleGraph
};

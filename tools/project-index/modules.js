'use strict';

const path = require('path');
const { builtinModules } = require('module');
const { inside, posix } = require('./sources');

function loadTypeScript(rootDir) {
  try { return require(require.resolve('typescript', { paths: [rootDir, __dirname] })); } catch { return null; }
}

function analyzeModule(ts, filePath, text, rootDir) {
  const ast = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  const imports = [], exports = [], inputs = [], gaps = [], suites = [], bindings = new Map(), constants = new Map();
  const location = node => {
    const startOffset = node.getStart(ast), endOffset = node.getEnd();
    return { start: ast.getLineAndCharacterOfPosition(startOffset), end: ast.getLineAndCharacterOfPosition(endOffset), startOffset, endOffset };
  };
  const literal = node => node && (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) ? node.text : null;
  const property = (node, name) => node.properties && node.properties.find(item => item.name && item.name.getText(ast).replace(/['"]/g, '') === name);
  function staticValue(node, seen = new Set()) {
    if (!node) return null;
    const value = literal(node);
    if (value !== null) return value;
    if (ts.isIdentifier(node)) {
      if (node.text === '__dirname') return path.dirname(filePath);
      if (node.text === '__filename') return filePath;
      if (node.text === 'rootDir') return rootDir;
      if (seen.has(node.text)) return null;
      return staticValue(constants.get(node.text), new Set([...seen, node.text]));
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const a = staticValue(node.left, seen), b = staticValue(node.right, seen);
      return a !== null && b !== null ? a + b : null;
    }
    if (ts.isTemplateExpression(node)) {
      let result = node.head.text;
      for (const span of node.templateSpans) { const item = staticValue(span.expression, seen); if (item === null) return null; result += item + span.literal.text; }
      return result;
    }
    if (ts.isCallExpression(node) && /^(?:path\.(?:join|resolve)|resolveRepoPath)$/.test(node.expression.getText(ast))) {
      const args = node.arguments.map(arg => staticValue(arg, seen));
      if (args.some(arg => arg === null)) return null;
      if (node.expression.getText(ast) === 'resolveRepoPath') return path.resolve(args[1] || rootDir, args[0]);
      return node.expression.getText(ast).endsWith('resolve') ? path.resolve(rootDir, ...args) : path.join(...args);
    }
    return null;
  }
  function collect(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      // Duplicate local bindings cannot be safely evaluated without a scope
      // analysis. Mark them unknown instead of picking an arbitrary function.
      constants.set(node.name.text, constants.has(node.name.text) ? null : node.initializer);
    }
    if (ts.isImportDeclaration(node)) {
      const specifier = literal(node.moduleSpecifier);
      const named = node.importClause?.namedBindings;
      imports.push({ specifier, kind: 'import', typeOnly: !!(node.importClause && (node.importClause.isTypeOnly || !node.importClause.name && named && ts.isNamedImports(named) && named.elements.length && named.elements.every(item => item.isTypeOnly))), range: location(node.moduleSpecifier) });
      const clause = node.importClause;
      if (clause && clause.name) bindings.set(clause.name.text, { specifier, imported: 'default' });
      if (clause && clause.namedBindings && ts.isNamedImports(clause.namedBindings)) clause.namedBindings.elements.forEach(item => bindings.set(item.name.text, { specifier, imported: (item.propertyName || item.name).text }));
    }
    if (ts.isExportDeclaration(node)) {
      exports.push({ text: node.exportClause ? node.exportClause.getText(ast) : '*', range: location(node) });
      if (node.moduleSpecifier) imports.push({ specifier: literal(node.moduleSpecifier), kind: 're-export', typeOnly: !!node.isTypeOnly, range: location(node.moduleSpecifier) });
    }
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const specifier = literal(node.moduleReference.expression);
      if (specifier) imports.push({ specifier, kind: 'require', typeOnly: node.isTypeOnly, range: location(node.moduleReference.expression) });
    }
    if (node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      const names = node.name ? [node.name.getText(ast)] : ts.isVariableStatement(node) ? node.declarationList.declarations.map(item => item.name.getText(ast)) : ['default'];
      names.forEach(name => exports.push({ text: name, range: location(node.name || node) }));
    }
    if (ts.isExportAssignment(node)) exports.push({ text: node.isExportEquals ? 'export=' : 'default', range: location(node) });
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && /^(?:module\.exports(?:\.|$)|exports\.)/.test(node.left.getText(ast))) {
      exports.push({ text: node.left.getText(ast), range: location(node.left) });
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(ast);
      if (callee === 'require' || node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const specifier = literal(node.arguments[0]);
        if (specifier === null) gaps.push({ code: 'dynamic-import', range: location(node), detail: 'Computed module specifier' });
        else {
          imports.push({ specifier, kind: callee === 'require' ? 'require' : 'dynamic-import', typeOnly: false, range: location(node.arguments[0]) });
          if (ts.isVariableDeclaration(node.parent)) {
            if (ts.isObjectBindingPattern(node.parent.name)) node.parent.name.elements.forEach(item => bindings.set(item.name.getText(ast), { specifier, imported: (item.propertyName || item.name).getText(ast) }));
            else if (ts.isIdentifier(node.parent.name)) bindings.set(node.parent.name.text, { specifier, imported: '*' });
          }
        }
      }
    }
    ts.forEachChild(node, collect);
  }
  collect(ast);
  function inspect(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(ast);
      if (/(?:^|\.)(?:readFileSync|readFile|readText|readJson|existsSync|readdirSync|resolveRepoPath)$/.test(callee)) {
        const value = staticValue(node.arguments[0]);
        if (value === null) gaps.push({ code: 'dynamic-file-input', range: location(node), detail: callee });
        else {
          const target = path.isAbsolute(value) ? value : path.resolve(rootDir, value);
          if (inside(rootDir, target)) inputs.push({ target: posix(path.relative(rootDir, target)), range: location(node), directory: /readdir/.test(callee), provenance: callee });
          else gaps.push({ code: 'external-file-input', range: location(node), detail: value });
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'suites' && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      for (const item of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(item)) { gaps.push({ code: 'dynamic-suite-registration', detail: item.getText(ast).slice(0, 120) }); continue; }
        const id = literal(property(item, 'id')?.initializer), run = property(item, 'run');
        if (!id || !run) continue;
        const implementations = [];
        function calls(child) {
          if (ts.isCallExpression(child)) {
            const local = child.expression.getText(ast), binding = bindings.get(local);
            if (binding && /^run/.test(binding.imported)) implementations.push({ ...binding, local, arguments: child.arguments.map(arg => arg.getText(ast)) });
          }
          ts.forEachChild(child, calls);
        }
        calls(run);
        suites.push({ id, implementations, range: location(item), defaultIncluded: property(item, 'defaultIncluded')?.initializer?.kind !== ts.SyntaxKind.FalseKeyword });
        if (!implementations.length) gaps.push({ code: 'unknown-suite-implementation', detail: id, range: location(run) });
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(ast);
  for (const diagnostic of ast.parseDiagnostics) gaps.push({ code: 'module-syntax-error', detail: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') });
  return { imports, exports, inputs, gaps, suites };
}

function createResolver(ts, rootDir, packages, files) {
  const configs = new Map();
  for (const file of files.filter(file => /(?:^|\/)tsconfig[^/]*\.json$/.test(file.path))) {
    const absolute = path.join(rootDir, file.path);
    const read = ts.parseConfigFileTextToJson(absolute, file.text);
    if (!read.error) {
      const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(absolute));
      configs.set(path.dirname(absolute), parsed.options);
    }
  }
  function resolve(specifier, importer, mode) {
    if (specifier.startsWith('node:') || builtinModules.includes(specifier)) return { external: true, builtin: true };
    const owner = packages.filter(pkg => specifier === pkg.name || specifier.startsWith(pkg.name + '/')).sort((a, b) => b.name.length - a.name.length)[0];
    if (mode !== 'types' && specifier.startsWith('.')) {
      const exact = path.resolve(path.dirname(importer), specifier);
      if (inside(rootDir, exact) && ts.sys.fileExists(exact) && !/\.d\.[cm]?ts$/.test(exact)) return { path: exact };
    }
    if (owner && owner.manifest.exports) {
      const { exportTargets } = require('./sources');
      const exports = owner.manifest.exports;
      const subpath = specifier === owner.name ? '.' : './' + specifier.slice(owner.name.length + 1);
      const table = typeof exports === 'string' || !Object.keys(exports).some(key => key.startsWith('.')) ? { '.': exports } : exports;
      const exact = Object.keys(table).find(key => key === subpath);
      const pattern = exact || Object.keys(table).filter(key => key.includes('*')).sort((a, b) => b.length - a.length).find(key => subpath.startsWith(key.split('*')[0]) && subpath.endsWith(key.split('*')[1]));
      if (!pattern) return { gap: 'package-subpath-not-exported' };
      const replacement = pattern.includes('*') ? subpath.slice(pattern.indexOf('*'), subpath.length - pattern.split('*')[1].length) : '';
      const conditions = new Set([mode === 'types' ? 'types' : mode, 'default', mode === 'require' ? 'node' : 'import', ...(mode === 'node' ? ['node'] : [])]);
      const candidates = exportTargets(table[pattern]).filter(entry => entry.conditions.every(condition => /^\d+$/.test(condition) || conditions.has(condition)));
      const target = candidates[0];
      if (!target) return { gap: `no-${mode}-export` };
      const absolute = path.resolve(owner.directory, target.target.replace(/\*/g, replacement));
      if (!inside(owner.directory, absolute)) return { gap: 'package-target-outside-root' };
      return ts.sys.fileExists(absolute) ? { path: absolute, conditions: target.conditions } : { gap: 'missing-export-target', expectedPath: absolute };
    }
    if (owner && specifier === owner.name) {
      const manifest = owner.manifest;
      const target = mode === 'types' ? manifest.types || manifest.typings || 'index.d.ts'
        : mode === 'browser' && typeof manifest.browser === 'string' ? manifest.browser
          : mode !== 'require' && manifest.module ? manifest.module : manifest.main || 'index.js';
      const absolute = path.resolve(owner.directory, target);
      if (!inside(owner.directory, absolute)) return { gap: 'package-target-outside-root' };
      return ts.sys.fileExists(absolute) ? { path: absolute } : { gap: 'missing-package-entry' };
    }
    const nearest = [...configs].filter(([dir]) => inside(dir, importer)).sort((a, b) => b[0].length - a[0].length)[0];
    const options = { allowJs: true, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, resolveJsonModule: true, ...(nearest && nearest[1]), customConditions: [mode] };
    const result = ts.resolveModuleName(specifier, importer, options, ts.sys).resolvedModule;
    if (result) {
      if (posix(result.resolvedFileName).includes('/node_modules/')) return { external: true, path: result.resolvedFileName };
      if (!inside(rootDir, result.resolvedFileName)) return { gap: 'module-outside-workspace' };
      if (mode !== 'types' && /\.d\.[cm]?ts$/.test(result.resolvedFileName)) {
        const runtime = result.resolvedFileName.replace(/\.d\.([cm]?)ts$/, '.$1js');
        return ts.sys.fileExists(runtime) ? { path: runtime } : { gap: 'type-only-runtime-resolution' };
      }
      return { path: result.resolvedFileName };
    }
    return { gap: 'unresolved-module' };
  }
  return resolve;
}
module.exports = { loadTypeScript, analyzeModule, createResolver };

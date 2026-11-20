const path = require('node:path');

const MANAGED_HELPER = 'components/native-managed.js';

// This is a source witness, not an evaluator. Managed registration is accepted
// only through the repository's explicit shared-definition/bootstrap pattern.
// The caller owns every source read, including authenticated Core provider reads.
function sourceRegistersCustomElement({ typescript: ts, sourcePath, source, tag, readSource }) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  // Retain the established direct registration witness unchanged.
  if (new RegExp(`customElements\\.define\\(\\s*['\"]${escaped}['\"]`, 'u').test(source)) return true;
  if (!/^components\/[^/]+\.js$/u.test(sourcePath) || /\.definition\.js$/u.test(sourcePath)) return false;
  const parse = (file, text) => {
    if (typeof text !== 'string') return null;
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    return ast.parseDiagnostics.length === 0 ? ast : null;
  };
  const localPath = (file, specifier) => typeof specifier === 'string' && /^\.\.?\//u.test(specifier)
    ? path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)) : null;
  const ast = parse(sourcePath, source);
  if (!ast) return false;

  function imports(file, from) {
    const result = new Map();
    for (const statement of file.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      const target = localPath(from, statement.moduleSpecifier.text);
      if (clause.name) result.set(clause.name.text, { target, exported: 'default' });
      const named = clause.namedBindings;
      if (named && ts.isNamedImports(named)) for (const binding of named.elements) {
        if (!binding.isTypeOnly) result.set(binding.name.text, { target, exported: (binding.propertyName || binding.name).text });
      }
    }
    return result;
  }
  function uniqueBinding(file, name) {
    let count = 0;
    let reassigned = false;
    function bindingNames(binding) {
      if (ts.isIdentifier(binding)) { if (binding.text === name) count++; }
      else for (const element of binding.elements || []) if (ts.isBindingElement(element)) bindingNames(element.name);
    }
    for (const statement of file.statements) {
      if (ts.isImportDeclaration(statement) && statement.importClause) {
        const clause = statement.importClause;
        if (clause.name) bindingNames(clause.name);
        if (clause.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings)) bindingNames(clause.namedBindings.name);
          else clause.namedBindings.elements.forEach(item => bindingNames(item.name));
        }
      } else if (ts.isVariableStatement(statement)) statement.declarationList.declarations.forEach(item => bindingNames(item.name));
      else if (statement.name && ts.isIdentifier(statement.name)) bindingNames(statement.name);
    }
    function assignmentTarget(target) {
      if (ts.isIdentifier(target)) return target.text === name;
      if (ts.isParenthesizedExpression(target) || ts.isSpreadElement(target) || ts.isSpreadAssignment(target)) return assignmentTarget(target.expression);
      if (ts.isArrayLiteralExpression(target)) return target.elements.some(assignmentTarget);
      if (ts.isObjectLiteralExpression(target)) return target.properties.some(property =>
        ts.isShorthandPropertyAssignment(property) ? assignmentTarget(property.name)
          : ts.isPropertyAssignment(property) ? assignmentTarget(property.initializer)
            : ts.isSpreadAssignment(property) && assignmentTarget(property.expression));
      if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) return assignmentTarget(target.left);
      return false;
    }
    // Reject writes conservatively, including those in unevaluated functions;
    // no control-flow claim may turn a replaced value into a class witness.
    function visit(node) {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment
        && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && assignmentTarget(node.left)) reassigned = true;
      if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node))
        && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)
        && assignmentTarget(node.operand)) reassigned = true;
      if ((ts.isForInStatement(node) || ts.isForOfStatement(node)) && assignmentTarget(node.initializer)) reassigned = true;
      ts.forEachChild(node, visit);
    }
    visit(file);
    return count === 1 && !reassigned;
  }
  function topLevelCalls(file) {
    const calls = [];
    for (const statement of file.statements) {
      if (ts.isThrowStatement(statement) || ts.isReturnStatement(statement)) break;
      if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression)) calls.push(statement.expression);
    }
    return calls;
  }
  function importedAs(bindings, file, identifier, exported) {
    if (!ts.isIdentifier(identifier) || !uniqueBinding(file, identifier.text)) return false;
    const binding = bindings.get(identifier.text);
    return binding?.target === MANAGED_HELPER && binding.exported === exported;
  }
  function exportedClass(file, exported) {
    const classes = file.statements.filter(statement => ts.isClassDeclaration(statement) && statement.name);
    for (const declaration of classes) {
      const name = declaration.name.text;
      if (!uniqueBinding(file, name)) continue;
      const modifiers = declaration.modifiers || [];
      if (modifiers.some(item => item.kind === ts.SyntaxKind.ExportKeyword)
        && (modifiers.some(item => item.kind === ts.SyntaxKind.DefaultKeyword) ? exported === 'default' : exported === name)) return name;
      for (const statement of file.statements) {
        if (exported === 'default' && ts.isExportAssignment(statement) && !statement.isExportEquals
          && ts.isIdentifier(statement.expression) && statement.expression.text === name
          && statement.getStart(file) > declaration.end) return name;
        if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && !statement.isTypeOnly
          && statement.exportClause && ts.isNamedExports(statement.exportClause)
          && statement.exportClause.elements.some(item => !item.isTypeOnly && item.name.text === exported
            && (item.propertyName || item.name).text === name)) return name;
      }
    }
    return null;
  }

  const bindings = imports(ast, sourcePath);
  for (const call of topLevelCalls(ast)) {
    if (!importedAs(bindings, ast, call.expression, 'defineManagedComponent') || call.arguments.length !== 2
      || !ts.isStringLiteral(call.arguments[0]) || call.arguments[0].text !== tag
      || !ts.isIdentifier(call.arguments[1]) || !uniqueBinding(ast, call.arguments[1].text)) continue;
    const constructor = bindings.get(call.arguments[1].text);
    const definitionPath = sourcePath.replace(/\.js$/u, '.definition.js');
    if (constructor?.target !== definitionPath) continue;
    const definition = parse(definitionPath, readSource(definitionPath));
    if (!definition) continue;
    const className = exportedClass(definition, constructor.exported);
    if (!className) continue;
    const classDeclaration = definition.statements.find(statement => ts.isClassDeclaration(statement) && statement.name?.text === className);
    const definitionImports = imports(definition, definitionPath);
    const marked = topLevelCalls(definition).some(marker => importedAs(definitionImports, definition, marker.expression, 'markManagedComponentClass')
      && marker.getStart(definition) > classDeclaration.end
      && marker.arguments.length >= 2 && ts.isIdentifier(marker.arguments[0]) && marker.arguments[0].text === className
      && ts.isStringLiteral(marker.arguments[1]) && marker.arguments[1].text === tag);
    if (!marked) continue;
    // Authenticate the real registrar/marker module as well as its import paths.
    const helper = parse(MANAGED_HELPER, readSource(MANAGED_HELPER));
    if (helper && ['defineManagedComponent', 'markManagedComponentClass'].every(name => helper.statements.some(statement =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === name
      && statement.modifiers?.some(item => item.kind === ts.SyntaxKind.ExportKeyword)))) return true;
  }
  return false;
}

module.exports = { sourceRegistersCustomElement };

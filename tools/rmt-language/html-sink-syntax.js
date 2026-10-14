'use strict';
// Build-time audit only. This does not make dynamic JavaScript safe or grant HTML trust.
const path = require('path');
const {createRequire} = require('module');

function scanHtmlSinkSyntax(text, filePath, options = {}) {
  let ts;
  try { ts = createRequire(path.join(path.resolve(options.rootDir || process.cwd()), 'package.json'))('typescript'); }
  catch { return [{sink:'toolchain-missing',index:0,length:0,code:'rmt.app.no-manual-shell.toolchain-missing'}]; }
  const kind = /\.tsx$/i.test(filePath) ? ts.ScriptKind.TSX : /\.jsx$/i.test(filePath) ? ts.ScriptKind.JSX : /\.ts$/i.test(filePath) ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, kind);
  if (source.parseDiagnostics.length) return [{sink:'source-invalid',index:source.parseDiagnostics[0].start || 0,length:source.parseDiagnostics[0].length || 0,code:'rmt.app.no-manual-shell.source-invalid'}];
  const sinks = new Set(['innerHTML','outerHTML','srcdoc']);
  const methods = new Set(['insertAdjacentHTML','createContextualFragment','setHTMLUnsafe']);
  const aliases = new Map(), found = [];
  const literal = node => {
    if (!node) return null;
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isParenthesizedExpression(node)) return literal(node.expression);
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const a=literal(node.left), b=literal(node.right); return a!==null && b!==null ? a+b : null;
    }
    return null;
  };
  const member = node => {
    if (ts.isPropertyAccessExpression(node)) return {name:node.name.text,receiver:node.expression};
    if (ts.isElementAccessExpression(node)) return {name:literal(node.argumentExpression),receiver:node.expression};
    return null;
  };
  const methodName = node => {
    if (!node) return null;
    if (ts.isIdentifier(node)) return aliases.get(node.text) || null;
    const m=member(node);
    if (m && (methods.has(m.name) || ['write','writeln'].includes(m.name) && /(?:^|\.)document$/.test(m.receiver.getText(source)))) return m.name;
    if (ts.isCallExpression(node)) { const b=member(node.expression); if (b && b.name==='bind') return methodName(b.receiver); }
    return null;
  };
  const record = (node,sink) => found.push({sink,index:node.getStart(source),length:node.getWidth(source),code:'rmt.app.no-manual-shell.html-sink'});
  const visit = node => {
    if (ts.isVariableDeclaration(node)) {
      if (ts.isIdentifier(node.name)) { const name=methodName(node.initializer); if(name) aliases.set(node.name.text,name); }
      if (ts.isObjectBindingPattern(node.name)) for (const binding of node.name.elements) {
        const key=binding.propertyName || binding.name;
        const name=ts.isIdentifier(key)?key.text:literal(key);
        if(methods.has(name) && ts.isIdentifier(binding.name)) aliases.set(binding.name.text,name);
      }
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
      const m=member(node.left);
      if (m && sinks.has(m.name)) record(node,m.name);
      if (ts.isIdentifier(node.left)) { const name=methodName(node.right); if(name) aliases.set(node.left.text,name); }
    }
    if (ts.isCallExpression(node)) {
      const name=methodName(node.expression), m=member(node.expression);
      if(name) record(node,name);
      else if(m && ['call','apply'].includes(m.name)) { const alias=methodName(m.receiver); if(alias) record(node,alias); }
      else if(m && m.name==='setAttribute' && literal(node.arguments[0])==='srcdoc') record(node,'srcdoc');
    }
    ts.forEachChild(node,visit);
  };
  visit(source);
  return found;
}
module.exports={scanHtmlSinkSyntax};

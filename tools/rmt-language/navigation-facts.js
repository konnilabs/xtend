'use strict';

// Position/identity adapters over existing parser and compiler facts. These
// helpers neither parse source nor decide which language references resolve.
function astNodes(ast) {
  const result = [], seen = new Set();
  function visit(value, scope = []) {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) { value.forEach(item => visit(item, scope)); return; }
    if (value.type && value.range) result.push({ node: value, scope });
    const next = /(?:Template|Surface|Lane|Slot)Declaration$/.test(value.type || '') && value.name
      ? scope.concat(`${value.type}:${value.name}`) : scope;
    for (const [key, child] of Object.entries(value)) {
      if (!['range', 'startToken', 'endToken', 'scope'].includes(key)) visit(child, next);
    }
  }
  visit(ast);
  return result;
}

function preciseRange(sourceModel, range, name, nodes = []) {
  if (!range || !name) return range;
  const start = range.startOffset ?? sourceModel.offsetAt(range.start);
  const end = range.endOffset ?? sourceModel.offsetAt(range.end);
  const matches = nodes.map(entry => entry.node || entry).filter(node => node.range &&
    node.range.startOffset >= start && node.range.endOffset <= end &&
    (node.value === name || node.name === name) && node.type === 'RmtIdentifier');
  if (matches.length === 1) return matches[0].range;
  // JSON strings and primitive clauses already have parser-provided bounds.
  // Narrow only a unique spelling within those bounds, never search the file.
  const text = sourceModel.text.slice(start, end);
  const at = text.indexOf(name);
  if (at >= 0 && text.indexOf(name, at + name.length) < 0) return sourceModel.rangeForOffsets(start + at, start + at + name.length);
  return range;
}

function attachVNextPositions(indexes, ast, sourceMap) {
  const nodes = astNodes(ast);
  const byPointer = new Map(nodes.filter(entry => entry.node.astPointer).map(entry => [entry.node.astPointer, entry]));
  const bySource = new Map(sourceMap.map(entry => [entry.id, entry]));
  for (const index of Object.values(indexes)) for (const entry of index.records) {
    const source = bySource.get(entry.sourceRef);
    const match = source && byPointer.get(source.astPointer);
    if (!match) continue;
    entry.node = match.node;
    entry.declaredScope = match.scope;
    entry.astPointer = match.node.astPointer;
    if (match.node.nameNode) entry.idRange = match.node.nameNode.range;
  }
  return indexes;
}
module.exports = { astNodes, preciseRange, attachVNextPositions };

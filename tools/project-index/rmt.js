'use strict';

const { buildSemanticGraph, buildRmtVNextPrimitiveSemanticGraph } = require('../rmt-language/semantic-graph');
const { analyzeRmtVNextToolingSource, isLikelyRmtVNextSource, lintRmtVNextToolingSource } = require('../rmt-language/vnext-tooling');
const { lintRmtSource } = require('../rmt-language/diagnostics');
const { astNodes, preciseRange } = require('../rmt-language/navigation-facts');

function analyze(document, rootDir) {
  const input = { text: document.text, uri: document.uri, filePath: document.filePath, version: document.version };
  const vnext = isLikelyRmtVNextSource(input);
  const graph = vnext ? analyzeRmtVNextToolingSource(input, { rootDir }) : buildSemanticGraph(input, { rootDir });
  const linterReport = vnext ? lintRmtVNextToolingSource(input, { rootDir, analysis: graph }) : lintRmtSource(input, { rootDir, graph });
  const nodes = vnext ? astNodes(graph.ast) : [];
  const byPointer = new Map(nodes.filter(({ node }) => node.astPointer).map(entry => [entry.node.astPointer, entry]));
  const primitive = vnext && (graph.compileResult.primitiveSemanticGraph || buildRmtVNextPrimitiveSemanticGraph(input, {
    parserResult: graph.compileResult.parserResult, includePartialDeclarations: true
  }));
  const entries = [], refs = [], imports = [];
  const add = (entry, domain) => {
    if (!entry || !entry.id || !entry.range || domain === 'sourceMap') return;
    const match = byPointer.get(entry.astPointer || entry.pointer);
    const node = entry.node || match && match.node;
    const existing = entries.find(item => item.domain === domain && node && item.node === node);
    if (existing) { existing.aliases.push(entry.id); return; }
    const name = node && node.name || entry.name || entry.id;
    entries.push({ ...entry, domain, name, node, aliases: [entry.id],
      declaredScope: entry.declaredScope || match && match.scope || [],
      idRange: node && node.nameNode ? node.nameNode.range : preciseRange(graph.sourceModel, entry.idRange || entry.range, name, nodes) });
  };
  for (const [domain, index] of Object.entries(graph.indexes || {})) for (const entry of index.records) add(entry, domain);
  if (primitive) for (const [domain, index] of Object.entries(primitive.indexes)) for (const entry of index.records) add(entry, domain);
  if (vnext) for (const { node, scope } of nodes) {
    if (node.type === 'RmtImportDeclaration') imports.push({ path: node.path, range: node.pathRange || node.range });
    // The parser retains declarations even when no core can be generated.
    const domain = { RmtTemplateDeclaration: 'templates', RmtSurfaceDeclaration: 'surfaces', RmtLaneDeclaration: 'lanes', RmtSlotDeclaration: 'slots', RmtRemoteSurfaceDeclaration: 'remoteSurfaces' }[node.type];
    if (domain && node.name) add({ id: node.name, node, range: node.range, pointer: node.astPointer, declaredScope: scope }, domain);
  }
  for (const ref of ((primitive || graph).references || {}).records || []) {
    refs.push({ ...ref, sourceRange: preciseRange(graph.sourceModel, ref.sourceRange, ref.targetId, nodes), provider: vnext ? 'rmt-primitive-semantic-graph' : 'rmt-semantic-graph' });
  }
  if (vnext && graph.coreDocument) {
    const targets = new Map();
    entries.forEach(entry => entry.aliases.forEach(id => { if (!targets.has(id)) targets.set(id, []); targets.get(id).push(entry); }));
    for (const [domain, index] of Object.entries(graph.indexes)) for (const entry of index.records) {
      if (domain === 'sourceMap' || !entry.range) continue;
      function walk(value, pointer, key) {
        if (Array.isArray(value)) { value.forEach((item, i) => walk(item, `${pointer}/${i}`, key)); return; }
        if (value && typeof value === 'object') { Object.entries(value).forEach(([k, item]) => walk(item, `${pointer}/${k}`, k)); return; }
        if (typeof value !== 'string' || ['id', 'sourceRef', 'name'].includes(key)) return;
        const matches = targets.get(value);
        if (!matches || matches.length !== 1 || !value.includes(':')) return;
        const target = matches[0];
        const sourceRange = preciseRange(graph.sourceModel, entry.range, target.name, nodes);
        // Implicit compiler links have no textual reference. Keep their graph
        // provenance, but do not manufacture clickable source occurrences.
        if (!sourceRange || sourceRange === entry.range) return;
        if (refs.some(ref => ref.sourceRange && ref.sourceRange.startOffset === sourceRange.startOffset && ref.targetDomain === target.domain)) return;
        refs.push({ sourceDomain: domain, sourceId: entry.id, sourcePointer: pointer, sourceRange,
          targetDomain: target.domain, targetId: target.id, targetPointer: target.pointer,
          resolved: graph.ok, relationship: `core.${key}`, provider: 'rmt-compiler-source-map' });
      }
      walk(entry.record, entry.pointer, '');
    }
  }
  return { document, input, graph, linterReport, languageMode: vnext ? 'vnext' : 'legacy', entries, refs, imports };
}
module.exports = { analyze };

'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { compare, posix } = require('./sources');

function computeImpact({ baseSnapshot, headSnapshot, changedPaths }) {
  if (!headSnapshot || !Array.isArray(changedPaths)) throw new TypeError('headSnapshot and changedPaths are required');
  const snapshots = [baseSnapshot, headSnapshot].filter(Boolean);
  if (snapshots.some(snapshot => snapshot.schema !== 'xtend.project-index.v1')) throw new TypeError('Unsupported snapshot schema');
  const documents = new Map(), packages = new Map(), contracts = new Map(), suites = new Map(), edges = new Map();
  for (const [snapshotIndex, snapshot] of snapshots.entries()) {
    for (const [name, map] of [['documents', documents], ['packages', packages], ['contracts', contracts], ['suites', suites]]) for (const record of snapshot[name] || []) map.set(record.id, record);
    for (const relationship of snapshot.relationships || []) {
      const previous = edges.get(relationship.id);
      edges.set(relationship.id, { ...relationship, snapshots: [...(previous?.snapshots || []), snapshotIndex === snapshots.length - 1 ? 'head' : 'base'] });
    }
  }
  const reverse = new Map();
  for (const edge of edges.values()) { if (!reverse.has(edge.to)) reverse.set(edge.to, []); reverse.get(edge.to).push(edge); }
  const reached = new Map(), queue = [], unknown = [];
  if (snapshots.some(snapshot => snapshot.profile !== 'repository')) unknown.push({ path: '.', code: 'repository-profile-required', detail: 'RMT snapshots do not capture repository module, contract or suite coverage.' });
  const roots = [...new Set(snapshots.flatMap(snapshot => snapshot.workspaceRoots || []))];
  for (const changed of changedPaths) {
    const matches = [...documents.values()].filter(document => document.uri === changed || document.filePath === changed || document.workspacePath === posix(changed));
    const ids = matches.length ? matches.map(document => document.id) : roots.map(root => `file:${pathToFileURL(path.resolve(root, changed)).href}`);
    if (!matches.length) unknown.push({ path: changed, code: 'changed-path-not-indexed', detail: 'The base/head document inventories do not contain this path; known relationship targets are still traversed.' });
    for (const id of ids) if (!reached.has(id)) { reached.set(id, { changedPath: changed, reason: [] }); queue.push(id); }
  }
  for (let i = 0; i < queue.length; i++) {
    const target = queue[i];
    for (const edge of reverse.get(target) || []) if (!reached.has(edge.from)) {
      reached.set(edge.from, { changedPath: reached.get(target).changedPath, reason: reached.get(target).reason.concat(edge) }); queue.push(edge.from);
    }
  }
  const affected = map => [...map.values()].filter(record => reached.has(record.id)).map(record => ({ ...record, ...reached.get(record.id) })).sort((a, b) => compare(a.id, b.id));
  const possibleSuites = affected(suites);
  const groups = new Map();
  for (const suite of suites.values()) for (const implementation of suite.implementations || []) {
    if (!groups.has(implementation.id)) groups.set(implementation.id, []);
    groups.get(implementation.id).push({ suiteId: suite.suiteId, arguments: implementation.arguments });
  }
  const possibleDuplicateExecutions = [...groups].filter(([, entries]) => entries.length > 1).map(([implementation, entries]) => ({ implementation, suites: entries, sameArguments: new Set(entries.map(entry => JSON.stringify(entry.arguments))).size === 1 }));
  const coverage = [...new Map(snapshots.flatMap(snapshot => snapshot.coverage || []).map(gap => [JSON.stringify(gap), gap])).values()];
  if (baseSnapshot && (baseSnapshot.analyzerVersion !== headSnapshot.analyzerVersion || baseSnapshot.configurationFingerprint !== headSnapshot.configurationFingerprint)) unknown.push({ code: 'snapshot-configuration-changed', path: '.', detail: 'Union traversal uses both configurations; results require review.' });
  return { schema: 'xtend.project-index.impact.v1', mode: 'report-only', changedPaths: [...changedPaths].sort(compare),
    files: affected(documents), packages: affected(packages), contracts: affected(contracts), possibleSuites,
    unknownMappings: unknown.concat(coverage), possibleDuplicateExecutions,
    testSelection: 'not-performed', complete: unknown.length === 0 && coverage.length === 0,
    recommendation: 'Keep existing gates; this report is evidence for a separate gate review.' };
}
module.exports = { computeImpact };

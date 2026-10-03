'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const catalog = require('./catalog.json');
const rootDir = path.resolve(__dirname, '../..');
const byId = new Map(catalog.suites.map(suite => [suite.id, suite]));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function fingerprint() {
  return hash(['catalog.json', 'catalog.js', 'handlers.js', 'executor.js', 'worker.js', 'cli.js', 'nightly.js', 'nightly-evidence.js', 'capabilities.js', '../create_xtend_nightly_manifest.js', '../verify_ci_dependency_locks.js'].map(name => fs.readFileSync(path.join(__dirname, name))).map(buffer => hash(buffer)).join('\n'));
}
function profileIds(name, visiting = new Set()) {
  const profile = catalog.profiles[name];
  if (!profile) throw new Error(`Unknown XTend test profile: ${name}`);
  if (visiting.has(name)) throw new Error(`Cyclic test profile: ${name}`);
  const next = new Set([...visiting, name]);
  const ids = [...(profile.defaultIncluded ? catalog.suites.filter(s => s.defaultIncluded !== false).map(s=>s.id) : []), ...(profile.suites || [])];
  for (const included of profile.includes || []) ids.push(...profileIds(included, next));
  for (const id of ids) if (!byId.has(id)) throw new Error(`Unknown XTend test suite: ${id}`);
  return [...new Set(ids)];
}
function canonicalSuite(id) {
  const seen = new Set();
  let entry = byId.get(id);
  if (!entry) throw new Error(`Unknown XTend test suite: ${id}`);
  while (entry.aliasOf) {
    if (seen.has(entry.id)) throw new Error(`Cyclic suite alias: ${entry.id}`);
    seen.add(entry.id);
    const target = byId.get(entry.aliasOf);
    if (!target || JSON.stringify(entry.implementations) !== JSON.stringify(target.implementations)) throw new Error(`Invalid suite alias: ${entry.id}`);
    entry = target;
  }
  return entry;
}
function select({ profile, suiteIds = [] } = {}) {
  if (profile && suiteIds.length) throw new Error('Choose a profile or explicit suite IDs, not both.');
  if (suiteIds.includes('all') && suiteIds.length !== 1) throw new Error('all must be used without other suite IDs.');
  const ids = profile ? profileIds(profile) : !suiteIds.length || suiteIds[0] === 'all' ? catalog.suites.filter(s=>s.defaultIncluded !== false).map(s=>s.id) : [...new Set(suiteIds)];
  return ids.map(id=> { canonicalSuite(id); return byId.get(id); });
}
function profileGroups(name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const entry = catalog.profiles[name];
  if (!entry) throw new Error(`Unknown XTend test profile: ${name}`);
  return [name, ...(entry.includes || []).flatMap(group => profileGroups(group, seen))];
}
function scriptSuiteIds(manifest, name) {
  const command = manifest.scripts?.[name];
  if (typeof command !== 'string') return [];
  const words = command.split(/\s+/);
  if (!words.includes('scripts/run_xtend_tests.js')) return [];
  const profileAt = words.indexOf('--profile');
  if (profileAt >= 0) return profileIds(words[profileAt + 1]);
  const args = words.slice(words.indexOf('scripts/run_xtend_tests.js') + 1);
  const end = args.findIndex(arg => arg.startsWith('--'));
  return select({ suiteIds: end < 0 ? args : args.slice(0,end) }).map(s=>s.id);
}
// Compatibility for governance consumers that inspect executable commands.
// Resolve the actual configured profile, never a parallel maintained list.
function resolvedScript(manifest, name) {
  const command = manifest.scripts?.[name];
  if (!command || !command.includes('scripts/run_xtend_tests.js')) return command;
  return command.replace(/--profile\s+([^\s]+)/, (_, profile) => profileIds(profile).join(' '));
}
module.exports = { catalog, rootDir, byId, hash, fingerprint, profileIds, profileGroups, canonicalSuite, select, scriptSuiteIds, resolvedScript };

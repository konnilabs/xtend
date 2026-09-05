'use strict';
const fs = require('fs');
const path = require('path');
const { catalog, resolvedScript, profileIds, profileGroups } = require('../../scripts/test-runner/catalog');

// Governance assertions consume the actual registry and resolved selection.
// No test implementation is imported to answer a registration question.
function readRunnerCatalog(rootDir) {
  const catalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/test-runner/catalog.json'), 'utf8'));
  return {
    hasSuite: id => catalog.suites.some(suite => suite.id === id),
    hasImplementation: query => catalog.suites.some(suite => suite.implementations.some(implementation => Object.entries(query).every(([key,value])=>implementation[key] === value))),
    describes: text => catalog.suites.some(suite => `${suite.label} ${suite.description}`.includes(text))
  };
}
function resolveManifestProfiles(manifest) {
  return { ...manifest, scripts: Object.fromEntries(Object.keys(manifest.scripts || {}).map(name=>[name,resolvedScript(manifest,name)])) };
}
function workflowHasScript(source, script) {
  // Expand only phase invocations actually present in the workflow.
  for (const match of source.matchAll(/node scripts\/test-runner\/nightly\.js phase ([\w-]+)/g)) {
    const phase = catalog.ci['ci-nightly'].phases[match[1]];
    if (phase) source += '\n' + phase.commands.map(command => [command.command, ...command.args].join(' ')).join('\n');
  }
  if (new RegExp(`npm run ${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`).test(source)) return true;
  const command = require('../../package.json').scripts[script];
  if (command && source.split('\n').some(line => line.trim() === command || line.trim().startsWith(`${command} `))) return true;
  const required = catalog.scripts[script];
  if (!required) return false;
  const profiles = [...source.matchAll(/--verify\s+([\w:.-]+)/g)].map(match=>match[1]);
  for (const match of source.matchAll(/npm run test:(ci-[\w-]+)/g)) profiles.push(match[1]);
  return profiles.some(profile => {
    if (!catalog.profiles[profile]) return false;
    const actual = profileIds(profile);
    const reports = profileGroups(profile).flatMap(group => catalog.profiles[group].reports || []);
    return profileIds(required.profile).every(id=>actual.includes(id)) && (!required.report || reports.includes(required.report));
  });
}
module.exports = { readRunnerCatalog, resolveManifestProfiles, workflowHasScript };

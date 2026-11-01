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
// Ignore shell comments and heredoc bodies before resolving execution obligations.
function executableLines(source) {
  const lines = [];
  let heredoc = null;
  for (const raw of source.split('\n')) {
    let line = raw.trim();
    if (heredoc) {
      if (line === heredoc) heredoc = null;
      continue;
    }
    if (!line || line.startsWith('#')) continue;
    const marker = line.match(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/);
    if (marker) { heredoc = marker[2]; continue; }
    lines.push(line);
  }
  return lines;
}
function exactExecution(line, command) {
  if (line === command) return true;
  if (!line.startsWith(command + ' ')) return false;
  // Only explicit output redirections preserve execution. No arbitrary args,
  // pipes, shell operators or command substitution qualify as evidence.
  const suffix = line.slice(command.length).trim();
  return /^(?:(?:1?>|1?>>|2>|2>>) [A-Za-z0-9_./-]+|2>&1)(?: (?:(?:1?>|1?>>|2>|2>>) [A-Za-z0-9_./-]+|2>&1))*$/.test(suffix);
}
// Narrow extraction of this repository's workflow step run scalars/blocks.
// Metadata, env values and multiline names never enter shell inspection.
function workflowRunSource(source) {
  const rows = source.split('\n'), runs = [];
  let stepsIndent = null, stepIndent = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], indent = row.match(/^ */)[0].length;
    if (!row.trim() || row.trim().startsWith('#')) continue;
    if (stepsIndent !== null && indent <= stepsIndent) { stepsIndent = null; stepIndent = null; }
    if (/^\s*steps:\s*$/.test(row)) { stepsIndent = indent; continue; }
    if (stepsIndent === null) continue;
    if (indent === stepsIndent + 2 && /^\s*- /.test(row)) stepIndent = indent;
    if (stepIndent === null) continue;
    const match = row.match(/^ *(?:- )?run:\s*(.*)$/);
    if (!match || !(indent === stepIndent + 2 || (indent === stepIndent && /^\s*- run:/.test(row)))) continue;
    const value = match[1];
    if (/^\|[-+]?\s*(?:#.*)?$/.test(value)) {
      const block = [];
      while (i + 1 < rows.length && (!rows[i + 1].trim() || rows[i + 1].match(/^ */)[0].length > stepIndent + 2)) block.push(rows[++i]);
      runs.push(block.join('\n'));
    } else if (!/^[>|]/.test(value)) {
      if (value.startsWith('"')) { try { runs.push(JSON.parse(value)); } catch {} }
      else runs.push(value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1).replaceAll("''", "'") : value);
    }
  }
  return runs.join('\n');
}
function workflowHasCommand(source, command) {
  const lines = executableLines(workflowRunSource(source));
  for (const line of [...lines]) {
    const match = line.match(/^node scripts\/test-runner\/nightly\.js phase ([\w-]+)$/);
    const phase = match && catalog.ci['ci-nightly'].phases[match[1]];
    if (phase) lines.push(...phase.commands.map(item => [item.command, ...item.args].join(' ')));
  }
  if (lines.some(line => exactExecution(line, command))) return true;
  if (!/^npm run [\w:.-]+$/.test(command)) return false;
  const script = command.slice(8);
  const underlying = require('../../package.json').scripts[script];
  // This one existing lock verifier's --json flag changes output format only.
  if (script === 'ci:dependency-locks:check' && underlying === 'node scripts/verify_ci_dependency_locks.js' && lines.some(line => exactExecution(line, underlying + ' --json'))) return true;
  // Resolve profile ownership only from actual npm execution or the existing
  // nightly report verifier, never arbitrary shell prose or extra modifiers.
  const profileLines = lines.filter(line => /^npm run [\w:.-]+$/.test(line) || /^node scripts\/test-runner\/nightly\.js [\w-]+ --verify [\w:.-]+$/.test(line));
  return workflowHasScript(profileLines.join('\n'), command.slice(8));
}

module.exports = { workflowHasCommand, readRunnerCatalog, resolveManifestProfiles, workflowHasScript };

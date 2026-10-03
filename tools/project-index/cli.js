'use strict';
const fs = require('fs');
const path = require('path');
const { createProjectIndex, computeImpact, SCHEMA, ANALYZER_VERSION } = require('./index');
const { fingerprint } = require('./sources');

const HELP = `XTend project index (report only)
  xt index build --root <project> [--profile rmt|repository] [--out snapshot.json] [--cache] --json
  xt index symbols [query] --root <project> [--profile rmt|repository] --json
  xt index references --symbol <symbol-id> --root <project> --json
  xt index impact --base <snapshot.json> [--head <snapshot.json>] --changed <path[,path...]> --root <project> --json
The root is mandatory. --cache explicitly enables .project-index-cache/snapshot.json.
Impact never selects, removes or skips gates. Unknown relationships are reported.`;
function runProjectIndexCli(args = [], io = {}) {
  const stdout = io.stdout || process.stdout, stderr = io.stderr || process.stderr;
  try {
    const command = args[0] || 'help', flags = {}, positional = [];
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (!arg.startsWith('--')) { positional.push(arg); continue; }
      const name = arg.slice(2);
      if (['json', 'help', 'cache'].includes(name)) flags[name] = true;
      else if (['root', 'profile', 'out', 'symbol', 'base', 'head', 'changed'].includes(name)) {
        if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
        flags[name] = args[++i];
      } else throw new Error(`Unknown option ${arg}`);
    }
    if (command === 'help' || command === '--help' || flags.help) { stdout.write(HELP + '\n'); return 0; }
    if (!['build', 'symbols', 'references', 'impact'].includes(command)) throw new Error(`Unknown index command ${command}`);
    if (!flags.root) throw new Error('--root <project> is required');
    const rootDir = path.resolve(flags.root);
    const profile = flags.profile || (command === 'impact' ? 'repository' : 'rmt');
    let snapshot;
    if (flags.head) snapshot = JSON.parse(fs.readFileSync(flags.head, 'utf8'));
    else {
      const index = createProjectIndex({ rootDir, profile }).build();
      const cachePath = path.join(rootDir, '.project-index-cache', 'snapshot.json');
      const sourceFingerprint = fingerprint(JSON.stringify([...index.documents.values()].map(doc => [doc.id, doc.fingerprint]).sort((a, b) => a[0] < b[0] ? -1 : 1)));
      // The curated inventory is deliberately absent from the editor scan.
      const inventoryPath = path.join(rootDir, 'tests/schemas/xtend-schema-inventory.json');
      const inventoryFingerprint = profile === 'repository' && fs.existsSync(inventoryPath) ? fingerprint(fs.readFileSync(inventoryPath)) : null;
      const cacheKey = fingerprint(JSON.stringify([SCHEMA, ANALYZER_VERSION, index.configurationFingerprint, sourceFingerprint, inventoryFingerprint]));
      if (flags.cache) {
        try { const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8')); if (cached.key === cacheKey && cached.snapshot.schema === SCHEMA) snapshot = cached.snapshot; } catch { /* reconstruct from sources */ }
      }
      if (!snapshot) {
        snapshot = index.snapshot();
        if (flags.cache) { fs.mkdirSync(path.dirname(cachePath), { recursive: true }); fs.writeFileSync(cachePath, JSON.stringify({ key: cacheKey, snapshot }) + '\n'); }
      }
      index.dispose();
    }
    if (snapshot.schema !== SCHEMA) throw new Error('Unsupported snapshot schema');
    let result = snapshot;
    if (command === 'symbols') result = { schema: 'xtend.project-index.symbols.v1', symbols: snapshot.symbols.filter(symbol => symbol.name.toLowerCase().includes((positional[0] || '').toLowerCase())), coverage: snapshot.coverage };
    if (command === 'references') {
      if (!flags.symbol) throw new Error('--symbol <symbol-id> is required');
      result = { schema: 'xtend.project-index.references.v1', references: snapshot.references.filter(reference => reference.targetId === flags.symbol || reference.candidates.includes(flags.symbol)), coverage: snapshot.coverage };
    }
    if (command === 'impact') {
      if (!flags.base || !flags.changed) throw new Error('impact requires --base and --changed');
      result = computeImpact({ baseSnapshot: JSON.parse(fs.readFileSync(flags.base, 'utf8')), headSnapshot: snapshot, changedPaths: flags.changed.split(',').filter(Boolean).concat(positional) });
    }
    const output = JSON.stringify(result, null, 2) + '\n';
    if (flags.out) fs.writeFileSync(path.resolve(flags.out), output);
    stdout.write(output);
    return 0;
  } catch (error) { stderr.write(`xt index: ${error.message}\n`); return 1; }
}
module.exports = { HELP, runProjectIndexCli };

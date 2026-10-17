'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict'), crypto = require('node:crypto'), zlib = require('node:zlib');
const root = path.resolve(__dirname, '../../..');
exports.root = root;
let historicalRoot;
Object.defineProperty(exports, 'historicalRoot', { get() {
  if (historicalRoot) return historicalRoot;
  historicalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-historical-model-'));
  // Controlled model fixture: only the declaration is historical source authority.
  // Other files satisfy path-presence checks; this is never a whole-source scan.
  const doc = JSON.parse(fs.readFileSync(path.join(root, 'tests/schemas/xtend-schema-inventory.json')));
  const entry = doc.entries.find(e => e.schemaId === ['xtend', 'product-candidates', 'v1'].join('.'));
  const paths = new Set([entry.canonicalDefinition.path,
    ...entry.usages.flatMap(u => u.sourcePaths), ...entry.shapeFingerprints.flatMap(f => f.sourcePaths)]);
  for (const relative of paths) {
    const target = path.join(historicalRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relative), target);
  }
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'historical-candidate-declaration.d.ts.gz')));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
    '4b096560d425afd3c16aba9353d9a974e9e12138a5512e9941a69fa608382c47');
  fs.writeFileSync(path.join(historicalRoot, 'candidate-integrity.d.ts'), bytes);
  process.once('exit', () => fs.rmSync(historicalRoot, { recursive: true, force: true }));
  return historicalRoot;
} });
exports.load = (retired = false, legacy = false) => {
  let code = fs.readFileSync(path.join(root, 'tools/schema-inventory/engine.cjs'), 'utf8');
  const replaceOnce = (before, after) => {
    assert.equal(code.split(before).length, 2, 'Test harness must target exactly one source expression');
    code = code.replace(before, after);
  };
  replaceOnce("require('../project-index/sources')", 'require(' + JSON.stringify(path.join(root, 'tools/project-index/sources')) + ')');
  replaceOnce('return {\n main,', 'return {\n __testInitialAuthority:isReviewedInitialCandidateAuthority,\n main,');
  if (retired) replaceOnce('enabled: true, schemaId:', 'enabled: false, schemaId:');
  if (legacy) replaceOnce(': isReviewedInitialCandidateAuthority(entry, inventory, scan, rootDir);', ': false;');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-scanner-'));
  const file = path.join(directory, 'scanner.cjs');
  fs.writeFileSync(file, code);
  try { return require(file).createLegacyScanner({ typescript: require('typescript'), defaultRootDir: root }); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
};

'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const zlib = require('node:zlib'), crypto = require('node:crypto');
const test = require('node:test'), assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const harness = require('./harness.cjs'), model = harness.load();
const api = require('../../../tools/schema-inventory/index.cjs');
const scanner = api.createScanner({ typescript: require('typescript'), defaultRootDir: harness.root });
const id = ['xtend', 'product-candidates', 'v1'].join('.'), family = ['xtend', 'product-candidates'].join('.');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(path.join(__dirname, 'proposed-current-five-registration.json.gz'));
assert.equal(digest(bytes), 'a99cc69a791172883e1941721a364e10a7bec96a0c10fa1162caa81b606768c8');
const proof = JSON.parse(zlib.gunzipSync(bytes));
const inventory = JSON.parse(fs.readFileSync(path.join(harness.root, 'tests/schemas/xtend-schema-inventory.json')));
const entry = doc => doc.entries.find(e => e.schemaId === id);
const scoped = (doc, scan, rootDir = harness.historicalRoot) => scanner.validateInventoryDocument(doc, scan, { rootDir }).errors
  .filter(e => e.schemaId === id || e.familyId === family || e.schemaIds?.includes(id));
const bound = (doc, scan, rootDir = harness.historicalRoot) => model.__testInitialAuthority(entry(doc), doc, scan, rootDir);

test('unapplied current five is exactly historical six minus one named test variant; both snapshots and authority survive', () => {
  assert.equal(proof.proposalOnly, true); assert.equal(proof.approvalApplied, false);
  const sixBytes = fs.readFileSync(path.join(__dirname, 'proposed-six-registration.json.gz'));
  const fourBytes = fs.readFileSync(path.join(__dirname, 'approved-registration.json.gz'));
  assert.equal(digest(sixBytes), 'c6ea40a991d4994e1784e638d96bbfec92319e7753da5cf2b969fa99cfb27243');
  assert.equal(digest(fourBytes), 'f674260de7daf717d52fbad0eec361abbfef8b0b9a99de47dac66e320a062b36');
  const six = JSON.parse(zlib.gunzipSync(sixBytes));
  assert.deepEqual(entry(inventory), proof.entry);
  assert.deepEqual(entry(inventory).shapePolicy.acceptedFingerprints,
    six.entry.shapePolicy.acceptedFingerprints.filter(hash => hash !== proof.removedCurrentFingerprint));
  assert.equal(entry(inventory).shapeFingerprints.length, 5);
  assert.deepEqual(entry(inventory).initialAuthorityReview, six.entry.initialAuthorityReview);
  assert.deepEqual(entry(inventory).lifecycle, { status: 'active', rollout: 'planned' });
  assert.equal(entry(inventory).releasedFingerprintSetHash, null);
  assert.equal(entry(inventory).shapePolicy.releasedFingerprintSetHash, null);
  assert.deepEqual(entry(inventory).shapePolicy.authoritativeFingerprints, six.entry.shapePolicy.authoritativeFingerprints);
  assert.deepEqual(inventory.schemaFamilies.find(f => f.familyId === family), six.family);
  assert.equal(digest(fs.readFileSync(path.join(harness.historicalRoot, 'candidate-integrity.d.ts'))),
    '4b096560d425afd3c16aba9353d9a974e9e12138a5512e9941a69fa608382c47');
  assert.deepEqual(scoped(inventory, proof.observation), []);
  assert.equal(bound(inventory, proof.observation), true);
  assert.throws(() => require('../../../scripts/scan_schema_inventory').assertCandidateInitialAuthorityRetiredForRelease(), /source-level/);
});

test('current source cannot inherit the frozen five-shape initial authority review', t => {
  const actual = scanner.scanSchemaInventory({ rootDir: harness.root });
  const observed = entry(actual);
  assert.ok(observed.shapeFingerprints.some(f => f.authoritative
    && f.evidence.some(e => e.symbol === 'CandidateManifest')));
  assert.ok(observed.shapeFingerprints.some(f => f.authoritative
    && f.hash === proof.entry.shapePolicy.authoritativeFingerprints[0]));
  assert.equal(bound(inventory, actual, harness.root), false);
  assert.ok(scoped(inventory, actual, harness.root).some(e => e.code === 'released-fingerprint-drift'));
  assert.equal(observed.canonicalDefinition.symbol, 'CandidateManifest');
  assert.notEqual(digest(fs.readFileSync(path.join(harness.root,'candidate-integrity.d.ts'))), digest(fs.readFileSync(path.join(harness.historicalRoot,'candidate-integrity.d.ts'))));
  if (process.env.XTEND_CURRENT_FIVE_OBSERVATION) fs.writeFileSync(process.env.XTEND_CURRENT_FIVE_OBSERVATION,
    JSON.stringify({ proposalOnly: true, productAcceptance: false, observation: observed,
      scopedCandidateErrors: scoped(inventory, actual, harness.root), scanStats: actual.stats }, null, 2) + '\n');
  t.diagnostic('Current exact fingerprints: ' + JSON.stringify(observed.shapeFingerprints.map(f => f.hash).sort()));
});


// Frozen full-file evidence is checked only against its original historical bytes.
// Current producer/input equivalence is a separate test, not a repin of that history.
const historicalProducerBytes = zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'historical-packaged-authority-source.cjs.gz')));
function producerSource(source) {
  const ts = require('typescript');
  const ast = ts.createSourceFile('packaged-authority.test.cjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.deepEqual(ast.parseDiagnostics, [], 'Candidate producer must parse');
  const declarations = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'manifest') declarations.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(declarations.length, 1, 'Exactly one Candidate manifest declaration');
  const declaration = declarations[0], statement = declaration.parent.parent, body = statement.parent;
  assert.ok(ts.isVariableStatement(statement) && ts.isBlock(body), 'Candidate producer must remain in its test callback');
  assert.ok(ts.isObjectLiteralExpression(declaration.initializer), 'Candidate manifest must remain an object expression');
  const schemaProperties = declaration.initializer.properties.filter(property =>
    ts.isPropertyAssignment(property) && property.name.getText(ast) === 'schema');
  assert.equal(schemaProperties.length, 1, 'Exactly one Candidate discriminator property');
  const expression = schemaProperties[0].initializer, text = expression.getText(ast);
  assert.equal(source.split(text).length, 2, 'Exactly one discriminator expression in the source');
  const prefix = ast.statements.slice(0, 3).map(node => node.getText(ast)).join('\n');
  return { prefix, inputsAndProducer: source.slice(body.statements[0].getStart(ast), statement.end),
    initializer: declaration.initializer.getText(ast), expression: text,
    expressionStart: expression.getStart(ast), expressionEnd: expression.end };
}
function checkedProducer(current, historical = historicalProducerBytes) {
  assert.equal(digest(historical), '5d87c31b857d8e2bb6d1ae706829b07b09335b7aba3f6cadb1af3cc44170b4c1',
    'Original historical full-file evidence must remain immutable');
  const old = producerSource(historical.toString('utf8')), actual = producerSource(current);
  assert.equal(actual.prefix, old.prefix, 'Candidate imports, root and digest input helpers changed');
  assert.equal(actual.inputsAndProducer, old.inputsAndProducer, 'Candidate producer or its pack/PHP/SHA inputs changed');
  assert.equal(actual.expression, old.expression, 'Candidate discriminator expression changed');
  return actual;
}
function reintroduceHistoricalDiscriminator(current) {
  const producer = checkedProducer(current);
  return current.slice(0, producer.expressionStart) + JSON.stringify(id) + current.slice(producer.expressionEnd);
}

test('frozen producer preserves exact inputs; changed current producer cannot inherit historical equivalence', () => {
  const currentSource = fs.readFileSync(path.join(harness.root, 'tests/migration/packaged-authority.test.cjs'), 'utf8');
  assert.throws(() => checkedProducer(currentSource), /Candidate/);
  const current = historicalProducerBytes.toString('utf8');
  const actual = checkedProducer(current), historical = producerSource(historicalProducerBytes.toString('utf8'));
  // Evaluate only the proven-equivalent manifest expressions with identical explicit
  // controlled inputs. This executes neither npm pack nor either ownership test body.
  const vm = require('node:vm'), php = Buffer.from('CONTROLLED validation-only PHP placeholder, not runtime evidence');
  for (const bytes of [Buffer.from([0, 255, 1, 128]), Buffer.from('different controlled archive bytes')]) {
    const context = { coreSha: 'a'.repeat(40), demoSha: 'b'.repeat(40),
      pack: { version: '0.9.0', filename: 'ccslabs-xtend-0.9.0.tgz' }, bytes, php,
      sha: digest, crypto };
    const runtime = source => Buffer.from(JSON.stringify(vm.runInNewContext('(' + source + ')', context, { timeout: 1000 })));
    const oldBytes = runtime(historical.initializer), currentBytes = runtime(actual.initializer);
    assert.equal(currentBytes.equals(oldBytes), true, 'Equal inputs must produce exactly equal fixture JSON bytes');
    const replaced = producerSource(reintroduceHistoricalDiscriminator(current));
    assert.equal(runtime(replaced.initializer).equals(oldBytes), true, 'Test-dispatch replacement must preserve Runtime-ID and all fixture bytes');
  }
});

for (const [name, before, after] of [
  ['pack-command', "'--ignore-scripts'", "'--dry-run'"],
  ['pack-byte-input', 'path.join(temp,pack.filename)),php=', "path.join(temp,'foreign.tgz')),php="],
  ['PHP-input', 'CONTROLLED validation-only PHP placeholder', 'changed PHP placeholder'],
  ['core-input', "coreSha='a'.repeat(40)", "coreSha='c'.repeat(40)"],
  ['demo-input', "demoSha='b'.repeat(40)", "demoSha='d'.repeat(40)"],
  ['package-version-input', 'version:pack.version', 'version:pack.otherVersion'],
  ['integrity-input', "integrity:'sha512-'", "integrity:'sha256-'"],
  ['discriminator', "['xtend','product-candidates','v1'].join('.')", "['xtend','product-candidates','v2'].join('.')"],
  ['root-helper', "path.resolve(__dirname,'../..')", "path.resolve(__dirname,'../../..')"]
]) test('producer equivalence rejects ' + name + ' mutation before test-dispatch replacement', () => {
  const current = historicalProducerBytes.toString('utf8');
  assert.equal(current.split(before).length, 2, 'Mutation must target exactly one real source expression');
  assert.throws(() => reintroduceHistoricalDiscriminator(current.replace(before, after)), /Candidate/);
});

test('producer equivalence rejects duplicate declarations/expressions and altered historical evidence', () => {
  const current = historicalProducerBytes.toString('utf8');
  const expression = checkedProducer(current).expression;
  assert.throws(() => checkedProducer(current + '\n// ' + expression + '\n'), /Exactly one discriminator/);
  assert.throws(() => checkedProducer(current + '\nconst manifest = {};\n'), /Exactly one Candidate manifest/);
  assert.throws(() => checkedProducer(current, Buffer.concat([historicalProducerBytes, Buffer.from('\n')])), /historical full-file evidence/);
});

for (const variant of ['unknown', 'reintroduced-historical']) test('real scanned ' + variant + ' expression cannot borrow the current five registration', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'current-five-foreign-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  if (variant === 'unknown') {
    fs.writeFileSync(path.join(directory, 'unknown.cjs'), 'const manifest = { schema: ' + JSON.stringify(id) + ', unreviewed: true };\n');
  } else {
    const relative = 'tests/migration/packaged-authority.test.cjs';
    const original = historicalProducerBytes.toString('utf8');
    const target = path.join(directory, relative); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, reintroduceHistoricalDiscriminator(original));
  }
  const foreign = entry(scanner.scanSchemaInventory({ rootDir: directory }));
  assert.ok(foreign?.shapeFingerprints.length);
  const hash = variant === 'reintroduced-historical' ? proof.removedCurrentFingerprint : foreign.shapeFingerprints[0].hash;
  const fingerprint = foreign.shapeFingerprints.find(f => f.hash === hash);
  assert.ok(fingerprint, 'Real parser must reproduce the foreign normalized fingerprint');
  assert.ok(!proof.currentFiveFingerprints.includes(hash));
  const scan = structuredClone(proof.observation); entry(scan).shapeFingerprints.push(fingerprint);
  assert.equal(bound(inventory, scan), false);
  const errors = scoped(inventory, scan);
  assert.ok(errors.some(e => e.code === 'shape-fingerprint-drift'));
  assert.ok(errors.some(e => e.code === 'released-fingerprint-drift'));
});

for (const mutant of ['extra-accepted', 'wrong-source', 'wrong-authority']) test('current-five registration rejects ' + mutant, () => {
  const doc = structuredClone(inventory), e = entry(doc);
  if (mutant === 'extra-accepted') e.shapePolicy.acceptedFingerprints.push(proof.removedCurrentFingerprint);
  if (mutant === 'wrong-source') e.initialAuthorityReview.sourceSha256 = '0'.repeat(64);
  if (mutant === 'wrong-authority') e.initialAuthorityReview.authoritativeFingerprint = 'sha256:' + '0'.repeat(64);
  assert.equal(bound(doc, proof.observation), false);
  assert.ok(scoped(doc, proof.observation).length);
});

test('current-five metadata leaves the actual publisher guard before every registry/backend read', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'current-five-publish-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  let calls = 0; const forbidden = () => { calls++; throw Error('No registry/backend permitted'); };
  await assert.rejects(require('../../../scripts/release/publish.cjs').publishRelease({
    artifact: { order: [], packages: [], sourceSha: 'a'.repeat(40), manifestIntegrity: 'controlled-unusable', toolchain: { npm: '11.17.0' } },
    ledgerFile: path.join(directory, 'ledger.json'), publish: true,
    registry: { version: forbidden, package: forbidden }, publisher: { publish: forbidden, dryRun: forbidden }
  }), /source-level initial-authority retirement/);
  assert.equal(calls, 0);
});

for (const group of ['mcp', 'material']) test('current-five metadata leaves the real clean-shell ' + group + ' CLI guard active', () => {
  const env = { ...process.env }; delete env.npm_execpath; delete env.XTEND_NPM_CLI; delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['scripts/release/cli.cjs', 'publish', '--execute', '--groups', group],
    { cwd: harness.root, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /source-level initial-authority retirement/);
  assert.doesNotMatch(result.stderr, /Artifact|npm CLI|Publish requires/);
});

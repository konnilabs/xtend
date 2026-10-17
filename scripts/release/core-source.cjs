'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const sourceProviderImplementation = require('../../tools/schema-inventory/source-provider.cjs');
const { createCoreReleaseProvider, assertSourceProvider } = sourceProviderImplementation;
// Fixed private Core context; no ambient profile module can relabel a scan.
const PROFILE = 'xtend.npm.core-only.v1';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const implementationSha256 = hash(fs.readFileSync(__filename));
const check = (condition, message) => { if (!condition) throw Error(message); };
function expectedInventory(provider) {
  assertSourceProvider(provider);
  check(provider.provenance().profile === PROFILE, 'Core projection requires the verified single-repository provider');
  const policyBytes = provider.readCurrent('scripts/release/core-projection-policy.json');
  const policy = JSON.parse(policyBytes);
  check(policy.status === 'reviewed-core-owned-projection' && /^[a-f0-9]{64}$/.test(policy.inventorySha256 || '') &&
    /^[a-f0-9]{64}$/.test(policy.authorityDecisionSha256 || '') && Array.isArray(policy.productivePaths) &&
    policy.productivePaths.length > 0 && new Set(policy.productivePaths).size === policy.productivePaths.length,
    'Core-owned inventory/source/authority projection is pending or missing; release remains blocked');
  check(policy.inventoryFile === 'tests/schemas/core-release-inventory.json', 'Exact private Core inventory path required');
  const files = provider.files(), paths = files.map(row => row.logicalPath).sort();
  check(files.every(row => row.owner === 'core' && row.logicalPath === row.path) &&
    JSON.stringify(policy.productivePaths) === JSON.stringify(paths), 'Core projection must cover the complete authenticated Core source membership');
  const decisionBytes = provider.readCurrent('development/core-release-authority-decision.json');
  check(hash(decisionBytes) === policy.authorityDecisionSha256, 'Core projection authority decision is missing or substituted');
  const decision = JSON.parse(decisionBytes);
  check(decision.format === 1 && decision.profile === PROFILE && decision.repository === 'konnilabs/xtend' &&
    decision.status === 'reviewed-core-owned-projection' && decision.inventoryFile === policy.inventoryFile &&
    decision.inventorySha256 === policy.inventorySha256 && decision.sourceMembershipSha256 === hash(Buffer.from(JSON.stringify(paths))),
    'Core source/projection decision is pending or mismatched');
  const bytes = provider.readCurrent(policy.inventoryFile);
  check(hash(bytes) === policy.inventorySha256, 'Core expected inventory bytes differ from reviewed projection');
  for (const file of policy.productivePaths) check(provider.hasCurrent(file), 'Missing reviewed Core productive source: ' + file);
  return { inventory: JSON.parse(bytes), policy, policySha256: hash(policyBytes), inventorySha256: hash(bytes) };
}
const coreContexts = new WeakSet();
const contextsByProvider = new WeakMap();
function freezeDocument(value, seen = new Set()) {
  if (value && ['object', 'function'].includes(typeof value) && !seen.has(value)) {
    seen.add(value);
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value)))
      if (Object.hasOwn(descriptor, 'value')) freezeDocument(descriptor.value, seen);
    Object.freeze(value);
  }
  return value;
}
// Private loader for this Core scanner/suite only. Repository dependencies are
// compiled from verified provider bytes; the process-wide require cache is not
// an authority for them. Relative transitive dependencies use the same closure.
function createCoreModuleLoader(provider, typescript) {
  const { isBuiltin, wrap } = require('node:module');
  const vm = require('node:vm');
  check(typescript === require('typescript') && typescript.version === '5.9.3', 'Pinned external TypeScript instance required');
  const rows = new Map(provider.files().map(row => [row.logicalPath, row]));
  const byAbsolute = new Map([...rows.values()].map(row => [row.absolutePath, row.logicalPath]));
  const cache = Object.create(null), loaded = new Map();
  function bootstrap() {
    check(require.cache[__filename] === module && module.exports === implementationExports &&
      hash(provider.readCurrent('scripts/release/core-source.cjs')) === implementationSha256 &&
      hash(fs.readFileSync(__filename)) === implementationSha256, 'Core context bootstrap identity changed');
    sourceProviderImplementation.assertImplementationBinding(provider.readCurrent('tools/schema-inventory/source-provider.cjs'),
      provider.readCurrent('tools/schema-inventory/source-bindings.json'));
  }
  function resolve(specifier, parent = '') {
    let relative;
    if (path.isAbsolute(specifier)) relative = byAbsolute.get(specifier);
    else if (specifier.startsWith('.')) relative = path.posix.normalize(path.posix.join(path.posix.dirname(parent), specifier));
    else relative = specifier;
    check(typeof relative === 'string' && !relative.startsWith('../') && relative !== '..', 'Foreign Core module path');
    const exact = [relative, relative + '.js', relative + '.cjs', relative + '.json', relative + '/index.js'].find(file => rows.has(file));
    check(exact && /\.(?:js|cjs|json)$/.test(exact), 'Missing/unsupported captured Core module: ' + specifier);
    return exact;
  }
  function load(file, parentModule) {
    bootstrap();
    const bytes = provider.readCurrent(file), filename = rows.get(file).absolutePath;
    // Preserve the original private provider brand and context ownership roots.
    if (file === 'tools/schema-inventory/source-provider.cjs') return sourceProviderImplementation;
    if (file === 'scripts/release/core-source.cjs') return implementationExports;
    let item = loaded.get(file);
    if (item) {
      check(item.sha256 === hash(bytes) && cache[filename] === item.module &&
        item.module.exports === item.exports, 'Changed cached Core module identity: ' + file);
      if (parentModule && !parentModule.children.includes(item.module)) parentModule.children.push(item.module);
      return item.exports;
    }
    const current = { id: filename, filename, exports: {}, children: [], loaded: false };
    item = { module: current, exports: current.exports, sha256: hash(bytes) };
    loaded.set(file, item); cache[filename] = current;
    if (parentModule) parentModule.children.push(current);
    const localRequire = specifier => {
      if (isBuiltin(specifier)) return require(specifier);
      if (specifier === 'typescript') return typescript;
      check(specifier.startsWith('.') || path.isAbsolute(specifier), 'Unapproved external Core assertion dependency: ' + specifier);
      return load(resolve(specifier, file), current);
    };
    localRequire.resolve = specifier => rows.get(resolve(specifier, file)).absolutePath;
    localRequire.cache = cache;
    localRequire.main = undefined;
    if (file.endsWith('.json')) current.exports = JSON.parse(bytes);
    else {
      const compiled = vm.runInThisContext(wrap(bytes.toString('utf8')), { filename });
      compiled.call(current.exports, current.exports, localRequire, current, filename, path.dirname(filename));
    }
    current.loaded = true; item.exports = freezeDocument(current.exports);
    check(hash(provider.readCurrent(file)) === item.sha256, 'Core module changed during loading');
    return item.exports;
  }
  function recheck() {
    bootstrap(); provider.files();
    check(Object.keys(cache).length === loaded.size, 'Foreign Core module cache entry');
    for (const [file, item] of loaded) {
      check(cache[rows.get(file).absolutePath] === item.module && item.module.loaded === true &&
        item.module.exports === item.exports && hash(provider.readCurrent(file)) === item.sha256,
        'Loaded Core assertion dependency changed: ' + file);
      for (const child of item.module.children) check(cache[child.filename] === child, 'Foreign cached Core child module');
    }
  }
  return Object.freeze({ load: file => load(resolve(file)), recheck,
    assertSuiteModule(value) { check(loaded.get('tests/schemas/schema_inventory_suite.js')?.module === value,
      'Core assertions must run from the provider-bound suite module'); } });
}
function assertCoreSchemaContext(context) {
  check(coreContexts.has(context), 'Original branded Core schema context required');
  assertSourceProvider(context.provider);
  context.provider.files();
  context.modules.recheck();
  check(context.provider.provenance().profile === PROFILE &&
    hash(Buffer.from(JSON.stringify(context.scan))) === context.scanSha256 &&
    hash(Buffer.from(JSON.stringify(context.inventory))) === context.inventoryContentSha256 &&
    hash(context.provider.readCurrent('tests/schemas/core-release-inventory.json')) === context.inventorySha256,
    'Core context source/inventory/scan changed');
  // The scanner additionally enforces its private provider/scan identity brand.
  return context;
}
function createCoreSchemaContext({ provider, inventory, rootDir, typescript }) {
  assertSourceProvider(provider);
  const projected = expectedInventory(provider);
  check(JSON.stringify(inventory) === JSON.stringify(projected.inventory), 'Core suite received another inventory');
  const existing = contextsByProvider.get(provider);
  if (existing) {
    check(existing.rootDir === rootDir && existing.typescript === typescript, 'Core scanner context cannot be rebound');
    return assertCoreSchemaContext(existing);
  }
  const modules = createCoreModuleLoader(provider, typescript);
  const scanner = Object.freeze(modules.load('tools/schema-inventory/engine.cjs').createLegacyScanner({ typescript, defaultRootDir: rootDir }));
  // Own fresh provider-parsed data; never retain a caller-owned frozen shell.
  inventory = projected.inventory;
  const scan = scanner.scanSchemaInventory({ rootDir, sourceProvider: provider });
  // Freezing does not alter scanner serialization or manufacture another brand.
  freezeDocument(scan); freezeDocument(inventory);
  const context = Object.freeze({ provider, inventory, scanner, scan, rootDir, typescript, modules,
    inventoryContentSha256: hash(Buffer.from(JSON.stringify(inventory))),
    inventorySha256: projected.inventorySha256, policySha256: projected.policySha256,
    scanSha256: hash(Buffer.from(JSON.stringify(scan))) });
  coreContexts.add(context); contextsByProvider.set(provider, context);
  return assertCoreSchemaContext(context);
}
function validateCoreAuthority(options) {
  const context = createCoreSchemaContext(options);
  const { scanner, inventory, scan, provider, rootDir } = context;
  const authority = scanner.assertCoreCandidateAuthority(inventory, scan, provider);
  const validation = scanner.validateInventoryDocument(inventory, scan, { rootDir, sourceProvider: provider });
  check(validation.valid === true && validation.errors.length === 0, 'Core source/authority/shape/evolution validation failed');
  assertCoreSchemaContext(context);
  return authority;
}
function withCoreSourceEnvironment({ rootDir, typescript, env = process.env }, action) {
  check(env.XTEND_CORE_ARCHIVE && env.XTEND_CORE_EXPECTED, 'Required authenticated Core source inputs absent');
  const expected = JSON.parse(fs.readFileSync(env.XTEND_CORE_EXPECTED));
  const sourceSha = require('node:child_process').execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim();
  check(expected.sourceSha === sourceSha && expected.context?.runId === env.GITHUB_RUN_ID &&
    expected.context?.runAttempt === env.GITHUB_RUN_ATTEMPT, 'Core suite independent source/run/attempt mismatch');
  const temporary = fs.realpathSync(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'xtend-core-schema-')));
  let context;
  try {
    const loaded = loadCoreSource({ archive: env.XTEND_CORE_ARCHIVE, expected, destination: path.join(temporary, 'source') });
    context = createCoreSchemaContext({ ...loaded, rootDir, typescript });
    const result = action(context);
    check(!result || typeof result.then !== 'function', 'Core suite context callback must be synchronous');
    return result;
  } finally {
    try { if (context) assertCoreSchemaContext(context); }
    finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  }
}
function loadCoreSource(options) {
  const provider = createCoreReleaseProvider(options);
  const projection = expectedInventory(provider);
  return { provider, ...projection };
}
// The complete maintained suite and every negative inventory probe share the
// exact branded scanner context. The small validator is additional evidence.
function strictSourceReport({ now = Date.now(), ...options }) {
  const context = createCoreSchemaContext(options);
  const { provider, scanner, scan, inventory, rootDir } = context;
  const startedAt = new Date(now).toISOString();
  const schemaSuite = runCoreSchemaSuite(context, { rootDir });
  const validation = scanner.validateInventoryDocument(inventory, scan, { rootDir, sourceProvider: provider });
  const candidateAuthority = scanner.assertCoreCandidateAuthority(inventory, scan, provider);
  assertCoreSchemaContext(context);
  return { format: 2, profile: PROFILE, sourceSha: provider.provenance().coreSha, startedAt,
    finishedAt: new Date().toISOString(), ok: schemaSuite.ok === true && schemaSuite.skips.length === 0 && validation.valid === true,
    productiveSource: provider.provenance(), inventorySha256: context.inventorySha256,
    policySha256: context.policySha256, candidateAuthority, schemaSuite, validation };
}
function assertCoreSuiteModule(context, value) {
  assertCoreSchemaContext(context); context.modules.assertSuiteModule(value);
}
function runCoreSchemaSuite(context, options = {}) {
  assertCoreSchemaContext(context);
  const suite = context.modules.load('tests/schemas/schema_inventory_suite.js');
  const result = suite.runAuthenticatedCoreSuite(context, options);
  assertCoreSchemaContext(context);
  return result;
}
const implementationExports = Object.freeze({ loadCoreSource, expectedInventory, strictSourceReport, validateCoreAuthority,
  createCoreSchemaContext, assertCoreSchemaContext, withCoreSourceEnvironment, runCoreSchemaSuite, assertCoreSuiteModule });
module.exports = implementationExports;

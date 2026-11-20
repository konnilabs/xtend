'use strict';

// The lifecycle contract is separate from the unchanged Classic AST and View5
// grammar. It authorizes content admission, never controller Open/Recreate.
const { data, fields, name, segments, bindingPath, clone, freeze } = require('../xtensions/state-binding-contract');
const { visitProjection } = require('../xtensions/state-binding-projection');
const { assertNativeCanonicalData } = require('../xtensions/native-data');
const RMTX_NATIVE_LIFECYCLE_API_VERSION = '1.0.0';
const RMTX_NATIVE_LIFECYCLE_SCHEMA = 'xtend.rmtx.native-lifecycle.v1';
const RMTX_LIFECYCLE_DEPENDENCIES_SCHEMA = 'xtend.rmtx.lifecycle-dependencies.v1';
const PROFILE = Object.freeze({ syntax: 'rmtx', version: '6.0.0' });
const VIEW = Object.freeze({ syntax: 'rmtx', version: '5.0.0' });
const ACTION = Object.freeze({ syntax: 'rmtx', version: '4.0.0' });
function fail(message) {
  throw Object.assign(new TypeError(message), { code: 'rmtx.lifecycle.invalid' });
}
function profile(value, expected) {
  fields(value, ['syntax', 'version'], 'Lifecycle profile');
  if (value.syntax !== expected.syntax || value.version !== expected.version) fail('Lifecycle requires explicit Source6, View5 and Action4 profiles.');
}
function inspectExpression(expression, symbols = null) {
  const reads = new Map();
  visitProjection(expression, node => {
    if (['object', 'array'].includes(node.kind)) fail('Lifecycle guards require closed scalar projections.');
    if (node.kind === 'literal' && node.value !== null && !['string', 'number', 'boolean'].includes(typeof node.value)) fail('Lifecycle guards require scalar literals.');
    if (node.kind !== 'path') return;
    segments(node.path);
    if (node.path.some(part => typeof part !== 'string')) fail('Lifecycle guards require ordinary direct Model/Selector paths without item scopes.');
    if (symbols && !(node.root === 'state' ? symbols.states : symbols.selectors).has(node.symbol)) fail('Lifecycle guard references an undeclared Model/Selector symbol.');
    const read = { root: node.root, symbol: node.symbol, path: clone(node.path) };
    reads.set(JSON.stringify(read), read);
  });
  if (expression.kind === 'literal' && typeof expression.value !== 'boolean') fail('A literal lifecycle guard must be Boolean.');
  return [...reads.values()].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0);
}
function validateRmtxNativeLifecycleContract(contract) {
  assertNativeCanonicalData(contract); data(contract);
  fields(contract, ['schema', 'documentId', 'sourceProfile', 'viewProfile', 'actionProfile', 'operations'], 'Lifecycle source contract');
  if (contract.schema !== RMTX_NATIVE_LIFECYCLE_SCHEMA) fail('Expected the explicit native lifecycle source contract.');
  name(contract.documentId); profile(contract.sourceProfile, PROFILE); profile(contract.viewProfile, VIEW); profile(contract.actionProfile, ACTION);
  if (!Array.isArray(contract.operations) || contract.operations.length > 256) fail('Lifecycle operations require a bounded array.');
  const pointers = new Set(), owners = new Set();
  for (const operation of contract.operations) {
    fields(operation, ['astPointer', 'ownerSurface', 'target', 'op', 'lane', 'when', 'range'], 'Lifecycle source operation');
    for (const key of ['astPointer', 'ownerSurface', 'target', 'lane']) name(operation[key]);
    if (!/^\/body\/\d+(?:\/body\/\d+)*$/u.test(operation.astPointer) || pointers.has(operation.astPointer) || owners.has(operation.ownerSurface)
      || operation.op !== 'mount' || operation.target !== operation.ownerSurface || operation.lane !== 'visible') fail('One guarded visible Mount must target its own distinct static Surface.');
    pointers.add(operation.astPointer); owners.add(operation.ownerSurface); inspectExpression(operation.when);
  }
  return freeze(clone(contract));
}
function validateRmtxNativeLifecycleAst(contract, ast) {
  const source = validateRmtxNativeLifecycleContract(contract);
  const resolve = parts => parts.reduce((node, key) => node?.[key], ast);
  for (const operation of source.operations) {
    const path = operation.astPointer.slice(1).split('/'), statement = resolve(path), lane = resolve(path.slice(0, -2)), surface = resolve(path.slice(0, -4));
    if (statement?.type !== 'RmtLifecycleStatement' || statement.op !== 'mount' || statement.target?.value !== operation.target
      || statement.source !== null || statement.policy !== null || statement.condition !== null || Object.hasOwn(statement, 'scope')
      || lane?.type !== 'RmtLaneDeclaration' || lane.name !== operation.lane || surface?.type !== 'RmtSurfaceDeclaration' || surface.name !== operation.ownerSurface)
      fail('A guarded Mount must be an unscoped direct Surface Lane child without Source, Policy or Classic conditions.');
  }
  return source;
}
function lowerRmtxNativeLifecycle(contract, core, nativeViewContract) {
  const source = validateRmtxNativeLifecycleContract(contract);
  if (core?.manifest?.documentId !== source.documentId || nativeViewContract?.documentId !== source.documentId) fail('Lifecycle and native View document identities differ.');
  if ((core.operations || []).some(operation => operation.condition)) fail('Source6 lifecycle conditions must use its explicit scalar guard source contract.');
  const symbols = { states: new Set((core.appPlatform?.state || []).map(value => value.id)), selectors: new Set((core.appPlatform?.selectors || []).map(value => value.id)) };
  const owners = new Map((core.surfaces || []).map(surface => [surface.id, surface]));
  const lanes = new Map((core.lanes || []).map(lane => [lane.id, lane]));
  const dependencies = [];
  const operations = source.operations.map(declaration => {
    const mappings = (core.sourceMap || []).filter(entry => entry.astPointer === declaration.astPointer && entry.nodeType === 'RmtLifecycleStatement' && /^\/operations\/\d+$/u.test(entry.corePointer));
    if (mappings.length !== 1) fail('A lifecycle guard requires one exact Classic AST-to-Core operation mapping.');
    const operation = core.operations[Number(mappings[0].corePointer.slice('/operations/'.length))];
    const owner = owners.get(operation?.scope?.surface), lane = lanes.get(operation?.scope?.lane);
    const surface = (core.appPlatform?.surfaces || []).find(value => value.id === declaration.ownerSurface);
    if (!operation || !surface || mappings[0].id !== operation.sourceRef || operation.kind !== 'lifecycle' || operation.op !== 'mount'
      || owner?.name !== declaration.ownerSurface || operation.target?.ref !== declaration.target || lane?.name !== declaration.lane
      || operation.source || operation.condition || operation.policyRefs?.length || surface?.repeat || surface?.key
      || !nativeViewContract.surfaces.includes(declaration.ownerSurface)) fail('Guarded Mount must be an ordinary owning native View operation without Source or Policy.');
    const reads = inspectExpression(declaration.when, symbols);
    dependencies.push({ id: operation.id, ownerSurface: declaration.ownerSurface, reads, allSyntacticBranches: true });
    return { id: operation.id, astPointer: declaration.astPointer, ownerSurface: declaration.ownerSurface,
      target: declaration.target, op: 'mount', lane: declaration.lane, when: clone(declaration.when) };
  });
  return freeze({ plan: { schema: 'xtend.rmt.native-lifecycle-plan.v1', documentId: source.documentId,
    sourceProfile: PROFILE, viewProfile: VIEW, actionProfile: ACTION, operations },
    dependencies: { schema: RMTX_LIFECYCLE_DEPENDENCIES_SCHEMA, sourceProfile: PROFILE, operations: dependencies,
      runtimeTracking: false, runtimeSubscriptionsChanged: false } });
}

// Source7 adds explicit content-lifetime commands. Source6 remains a closed,
// independently validated level-admission contract.
const RMTX_EXTENDED_LIFECYCLE_API_VERSION = '2.0.0';
const RMTX_EXTENDED_LIFECYCLE_SCHEMA = 'xtend.rmtx.native-lifecycle.v2';
const RMTX_EXTENDED_LIFECYCLE_DEPENDENCIES_SCHEMA = 'xtend.rmtx.lifecycle-dependencies.v2';
const extendedOps = new Set(['mount', 'hydrate', 'suspend', 'resume', 'invalidate', 'dispose', 'prewarm', 'recycle', 'detach', 'reattach']);
const extendedLanes = new Set(['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics']);
const repeatContracts = require('../xtensions/repeat-scopes');
function extendedProfile(value, version) {
  fields(value, ['syntax', 'version'], 'Extended lifecycle profile');
  if (value.syntax !== 'rmtx' || value.version !== version) fail('Extended lifecycle requires explicit Source7/View7/Action4 profiles.');
}
function extendedExpression(expression, repeat, symbols) {
  const reads = new Map();
  visitProjection(expression, node => {
    if (['object', 'array'].includes(node.kind)) fail('Lifecycle guards require closed scalar projections.');
    if (node.kind === 'literal' && node.value !== null && !['string', 'number', 'boolean'].includes(typeof node.value)) fail('Lifecycle guards require scalar literals.');
    if (node.kind !== 'path') return;
    if (symbols && !(node.root === 'state' ? symbols.states : symbols.selectors).has(node.symbol)) fail('Lifecycle guard references an undeclared Model/Selector symbol.');
    const keys = (repeat || []).map(() => 'validated-key');
    const path = repeatContracts.templatePath({ state: node.symbol, path: node.path }, { repeat }, keys);
    // The shared path validator checks ordinary segments and typed key markers;
    // no positional or stringified item keys are introduced here.
    bindingPath(path, true);
    if (node.root !== 'state' && node.path.some(part => part && typeof part === 'object')) fail('Item scopes must belong to their owning Model repeat.');
    const read = { root: node.root, symbol: node.symbol, path: clone(node.path) };
    reads.set(JSON.stringify(read), read);
  });
  if (expression.kind === 'literal' && typeof expression.value !== 'boolean') fail('A literal lifecycle guard must be Boolean.');
  return [...reads.values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
function validateExtendedLifecycleProfile(contract, managed) {
  assertNativeCanonicalData(contract); data(contract);
  fields(contract, ['schema', 'documentId', 'sourceProfile', 'viewProfile', 'actionProfile', 'operations'], 'Extended lifecycle source');
  if (contract.schema !== (managed?'xtend.rmtx.native-lifecycle.v3':RMTX_EXTENDED_LIFECYCLE_SCHEMA)) fail('Expected the explicit Source7 lifecycle source contract.');
  name(contract.documentId); extendedProfile(contract.sourceProfile, managed?'8.0.0':'7.0.0'); extendedProfile(contract.viewProfile, managed?'8.0.0':'7.0.0'); extendedProfile(contract.actionProfile, managed?'8.0.0':'4.0.0');
  if (!Array.isArray(contract.operations) || contract.operations.length > 256) fail('Lifecycle declarations require a bounded operation array.');
  const pointers = new Set(), operations = new Set();
  for (const operation of contract.operations) {
    fields(operation, ['astPointer', 'ownerSurface', 'target', 'op', 'lane', 'when', 'range', 'repeat'], 'Extended lifecycle operation');
    for (const key of ['ownerSurface', 'target', 'lane']) name(operation[key]);
    const identity = JSON.stringify([operation.ownerSurface, operation.op]);
    if (typeof operation.astPointer !== 'string' || !/^\/body\/\d+(?:\/body\/\d+)*$/u.test(operation.astPointer) || pointers.has(operation.astPointer) || operations.has(identity)
      || !extendedOps.has(operation.op) || !extendedLanes.has(operation.lane) || operation.target !== operation.ownerSurface) fail('Lifecycle operations must uniquely target their own native Surface in a declared Kernel lane.');
    pointers.add(operation.astPointer); operations.add(identity);
    repeatContracts.validateRepeat(operation.repeat); extendedExpression(operation.when, operation.repeat);
  }
  return freeze(clone(contract));
}
function validateExtendedLifecycleAstProfile(contract, ast, managed) {
  const source = validateExtendedLifecycleProfile(contract, managed);
  for (const operation of source.operations) {
    let current = ast; const ancestors = [];
    for (const part of operation.astPointer.slice(1).split('/')) { ancestors.push(current); current = current?.[part]; }
    const lane = ancestors.slice().reverse().find(value => value?.type === 'RmtLaneDeclaration');
    const surface = ancestors.slice().reverse().find(value => value?.type === 'RmtSurfaceDeclaration');
    if (current?.type !== 'RmtLifecycleStatement' || current.op !== operation.op || current.target?.value !== operation.target
      || current.source !== null || current.policy !== null || current.condition !== null || Object.hasOwn(current, 'scope')
      || !lane || lane.name !== operation.lane || !surface || surface.name !== operation.ownerSurface)
      fail('Source7 lifecycle commands must be direct owning Surface Lane operations without Source, Policy or Classic conditions.');
  }
  return source;
}
function lowerExtendedLifecycleProfile(contract, core, nativeViewContract, managed) {
  const source = validateExtendedLifecycleProfile(contract, managed);
  if (core?.manifest?.documentId !== source.documentId || nativeViewContract?.documentId !== source.documentId || nativeViewContract.schema !== (managed?'xtend.rmtx.native-view.v3':'xtend.rmtx.native-view.v2')) fail('Source7 lifecycle and Native View documents differ.');
  if ((core.operations || []).some(operation => operation.condition)) fail('Source7 uses closed lifecycle scalar guards, not Classic condition strings.');
  const symbols = { states: new Set((core.appPlatform?.state || []).map(value => value.id)), selectors: new Set((core.appPlatform?.selectors || []).map(value => value.id)) };
  const surfaces = new Map((core.surfaces || []).map(surface => [surface.id, surface]));
  const lanes = new Map((core.lanes || []).map(lane => [lane.id, lane]));
  const views = new Map((nativeViewContract.views || []).map(view => [view.surface, view]));
  const dependencies = [];
  const operations = source.operations.map(declaration => {
    const mappings = (core.sourceMap || []).filter(row => row.astPointer === declaration.astPointer && row.nodeType === 'RmtLifecycleStatement' && /^\/operations\/\d+$/u.test(row.corePointer));
    if (mappings.length !== 1) fail('A lifecycle declaration requires one exact AST-to-Core operation mapping.');
    const operation = core.operations[Number(mappings[0].corePointer.slice('/operations/'.length))];
    const owner = surfaces.get(operation?.scope?.surface), lane = lanes.get(operation?.scope?.lane), view = views.get(declaration.ownerSurface);
    if (!operation || mappings[0].id !== operation.sourceRef || operation.kind !== 'lifecycle' || operation.op !== declaration.op
      || owner?.name !== declaration.ownerSurface || operation.target?.ref !== declaration.target || lane?.name !== declaration.lane
      || operation.source || operation.condition || operation.policyRefs?.length || !view || JSON.stringify(view.repeat || null) !== JSON.stringify(declaration.repeat || null)) fail('Lifecycle declarations must retain their exact native owner, repeat chain, target and Kernel operation provenance.');
    const reads = extendedExpression(declaration.when, declaration.repeat, symbols);
    const addRead = read => { if (!reads.some(value => JSON.stringify(value) === JSON.stringify(read))) reads.push(read); };
    if (declaration.repeat) {
      let prefix = [];
      declaration.repeat.forEach((scope, index) => {
        const collection = [...prefix, ...scope.path];
        addRead({root: 'state', symbol: declaration.repeat[0].state, path: clone(collection)});
        prefix = [...collection, {repeat: index}];
        addRead({root: 'state', symbol: declaration.repeat[0].state, path: [...clone(prefix), ...clone(scope.key)]});
      });
    }
    const scope = (nativeViewContract.scopes || []).find(value => value.surface === declaration.ownerSurface);
    if (scope?.presence) addRead({root: 'state', symbol: scope.presence.state, path: clone(scope.presence.path)});
    reads.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    dependencies.push({ id: operation.id, ownerSurface: declaration.ownerSurface, reads, allSyntacticBranches: true });
    return { id: operation.id, astPointer: declaration.astPointer, ownerSurface: declaration.ownerSurface, target: declaration.target,
      op: declaration.op, lane: declaration.lane, when: clone(declaration.when), ...(declaration.repeat ? { repeat: clone(declaration.repeat) } : {}) };
  });
  return freeze({ plan: { schema: managed?'xtend.rmt.native-lifecycle-plan.v3':'xtend.rmt.native-lifecycle-plan.v2', documentId: source.documentId, sourceProfile: { syntax: 'rmtx', version: managed?'8.0.0':'7.0.0' }, viewProfile: { syntax: 'rmtx', version: managed?'8.0.0':'7.0.0' }, actionProfile: managed?{syntax:'rmtx',version:'8.0.0'}:ACTION, operations },
    dependencies: { schema: managed?'xtend.rmtx.lifecycle-dependencies.v3':RMTX_EXTENDED_LIFECYCLE_DEPENDENCIES_SCHEMA, sourceProfile: { syntax: 'rmtx', version: managed?'8.0.0':'7.0.0' }, operations: dependencies, runtimeTracking: false, runtimeSubscriptionsChanged: false } });
}
function validateRmtxExtendedLifecycleContract(contract){return validateExtendedLifecycleProfile(contract,false);}
function validateRmtxExtendedLifecycleAst(contract,ast){return validateExtendedLifecycleAstProfile(contract,ast,false);}
function lowerRmtxExtendedLifecycle(contract,core,view){return lowerExtendedLifecycleProfile(contract,core,view,false);}
function validateRmtxManagedNativeLifecycleContract(contract){return validateExtendedLifecycleProfile(contract,true);}
function validateRmtxManagedNativeLifecycleAst(contract,ast){return validateExtendedLifecycleAstProfile(contract,ast,true);}
function lowerRmtxManagedNativeLifecycle(contract,core,view){return lowerExtendedLifecycleProfile(contract,core,view,true);}
module.exports = { validateRmtxManagedNativeLifecycleContract,validateRmtxManagedNativeLifecycleAst,lowerRmtxManagedNativeLifecycle,RMTX_NATIVE_LIFECYCLE_API_VERSION, RMTX_NATIVE_LIFECYCLE_SCHEMA, RMTX_LIFECYCLE_DEPENDENCIES_SCHEMA,
  validateRmtxNativeLifecycleContract, validateRmtxNativeLifecycleAst, lowerRmtxNativeLifecycle,
  RMTX_EXTENDED_LIFECYCLE_API_VERSION, RMTX_EXTENDED_LIFECYCLE_SCHEMA, RMTX_EXTENDED_LIFECYCLE_DEPENDENCIES_SCHEMA,
  validateRmtxExtendedLifecycleContract, validateRmtxExtendedLifecycleAst, lowerRmtxExtendedLifecycle,
  validateRmtxNativeOrchestrationLifecycleContract: validateRmtxExtendedLifecycleContract,
  validateRmtxNativeOrchestrationLifecycleAst: validateRmtxExtendedLifecycleAst,
  lowerRmtxNativeOrchestrationLifecycle: lowerRmtxExtendedLifecycle };

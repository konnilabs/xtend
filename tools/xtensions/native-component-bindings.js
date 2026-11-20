// SPDX-License-Identifier: Apache-2.0
'use strict';
const { data, fields, name, segments, bindingPath, readBindingPath, clone, freeze } = require('./state-binding-contract');
const { validateRepeat, expandRepeatScopes } = require('./repeat-scopes');
const projections = require('./state-binding-projection');
const metadata = require('./native-component-contract-v2');
const scopes = require('./native-managed-surface-scopes');
const NATIVE_COMPONENT_BINDINGS_API_VERSION = '1.0.0';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function nativePlatformOperationId(binding, command) {
    name(binding?.declarationId);
    name(command);
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(command))
        fail('Platform commands require captured names.');
    return 'native-platform:' + binding.declarationId + '/' + command;
}
function fail(message) { throw Object.assign(new TypeError(message), { code: 'rmt.native-component-binding.invalid' }); }
function validateCommandExpression(expression, depth = 0, budget = { nodes: 0 }) {
    if (depth > 64 || ++budget.nodes > 50000)
        fail('Native command projection exceeds its budget.');
    data(expression);
    const visit = value => validateCommandExpression(value, depth + 1, budget);
    switch (expression.kind) {
        case 'input':
            fields(expression, ['kind', 'path'], 'Native Action input');
            segments(expression.path);
            if (!expression.path.length)
                fail('Native command inputs require a declared field.');
            break;
        case 'literal':
            fields(expression, ['kind', 'value'], 'Native command literal');
            break;
        case 'path':
            fields(expression, ['kind', 'root', 'symbol', 'path'], 'Native Model projection');
            if (!['state', 'selector'].includes(expression.root))
                fail('Native commands read Model or selector paths.');
            name(expression.symbol);
            bindingPath(expression.path, true);
            break;
        case 'object':
            fields(expression, ['kind', 'fields'], 'Native command object');
            fields(expression.fields, Object.keys(expression.fields || {}), 'Native command fields');
            for (const [key, value] of Object.entries(expression.fields)) {
                name(key);
                visit(value);
            }
            break;
        case 'array':
            fields(expression, ['kind', 'items'], 'Native command array');
            if (!Array.isArray(expression.items))
                fail('Native command items must be an array.');
            expression.items.forEach(visit);
            break;
        case 'conditional':
            fields(expression, ['kind', 'test', 'then', 'else'], 'Native command conditional');
            visit(expression.test);
            visit(expression.then);
            visit(expression.else);
            break;
        case 'unary':
            fields(expression, ['kind', 'op', 'value'], 'Native command unary');
            if (!['!', '+', '-'].includes(expression.op))
                fail('Unknown native command unary operator.');
            visit(expression.value);
            break;
        case 'binary':
            fields(expression, ['kind', 'op', 'left', 'right'], 'Native command binary');
            if (!['===', '!==', '<', '<=', '>', '>=', '&&', '||', '+', '-', '*', '/', '%'].includes(expression.op))
                fail('Unknown native command binary operator.');
            visit(expression.left);
            visit(expression.right);
            break;
        default: fail('Unknown native command projection.');
    }
}
function eventBinding(row, declaration, component, program) {
    const compiled = (program.events || []).find(event => event.id === row.eventId);
    const sourceFields = ['astPointer', 'surface', 'component', 'ref', 'event'];
    fields(row, [...sourceFields, 'eventId', 'action', 'payload'], 'Native component event');
    if (!compiled || compiled.schema !== 'xtend.rmt.native-event-binding.v3' || compiled.component !== declaration.declarationId || compiled.surface !== declaration.surface || compiled.action !== row.action || compiled.event !== row.event || !same(compiled.payload || {}, row.payload))
        fail('Native component event differs from its compiled Action binding.');
    if (!Object.hasOwn(component.events, row.event))
        fail('Native component event is absent from captured metadata.');
    const payload = {}, keyFields = {}, inputs = (program.actions.inputContract?.actions || []).find(action => action.id === row.action)?.fields;
    if (!inputs)
        fail('Native component events require a validated Action input contract.');
    for (const [field, source] of Object.entries(row.payload)) {
        if (!Object.hasOwn(inputs, field) || typeof source !== 'string')
            fail('Native event payload must map declared Action fields.');
        const key = /^\$detail\.__rmtxScopedKeys\.k(\d+)$/.exec(source);
        if (key) {
            const index = Number(key[1]);
            if (index >= declaration.repeat.length || !['string', 'number', 'json'].includes(inputs[field].type))
                fail('Native event key differs from its complete repeat scope.');
            keyFields[field] = index;
            continue;
        }
        if (!/^\$detail(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(source))
            fail('Native events accept explicit detail DTO paths only.');
        const path = source.slice(1).split('.');
        let rule = component.events[row.event].payload;
        for (const part of path) {
            if (rule.type !== 'object' || !Object.hasOwn(rule.fields, part))
                fail('Native event payload path is absent from captured DTO metadata.');
            rule = rule.fields[part];
        }
        payload[field] = path;
    }
    return { event: row.event, action: row.action, payload, ...(Object.keys(keyFields).length ? { keyFields } : {}) };
}
function validateNativeComponentBindings(program) {
    data(program, new Set(), true);
    const header = program?.render?.nativeView;
    if (program?.schema !== 'xtend.rmt.app-orchestration.v6' || header?.schema !== 'xtend.rmt.native-view.v3' || program.actions?.schema !== 'xtend.rmt.action-plan.v3')
        fail('Native bindings require exact Program6, Header3 and Actionplan3.');
    for (const key of ['bindings', 'events', 'commands'])
        if (!Array.isArray(header[key]) || header[key].length > 50000)
            fail('Native binding sidecars require bounded explicit arrays.');
    const components = new Map();
    for (const row of header.components || []) {
        const checked = metadata.validateCapturedNativeComponentMetadataV2(row);
        if (components.has(row.tag))
            fail('Duplicate captured component.');
        components.set(row.tag, checked);
    }
    const scopeMap = new Map(scopes.validateNativeSurfaceScopes(program).declarations.map(row => [row.surface, row]));
    const nodes = new Map();
    function walk(node, owner = null, repeat = []) {
        if (Array.isArray(node)) {
            node.forEach(child => walk(child, owner, repeat));
            return;
        }
        if (!node || typeof node !== 'object')
            return;
        if (node.surface) {
            owner = node.surface;
            repeat = scopeMap.get(owner)?.repeat || [];
        }
        if (node.type === 'native-repeat')
            repeat = node.repeat;
        if (node.type === 'native-component') {
            if (nodes.has(node.nativeDeclarationId) || !Array.isArray(node.events))
                fail('Native component declarations must be distinct with explicit events.');
            nodes.set(node.nativeDeclarationId, { node, surface: owner, repeat });
        }
        walk(node.children, owner, repeat);
        for (const slot of node.slots || [])
            walk(slot.children, owner, repeat);
    }
    walk(program.render.root);
    const bindings = new Map(), refs = new Set();
    for (const row of header.bindings) {
        fields(row, ['declarationId', 'surface', 'ref', 'tag', 'repeat'], 'Native binding declaration');
        name(row.declarationId);
        name(row.surface);
        if (!Array.isArray(row.repeat))
            fail('Native binding requires its explicit complete repeat chain.');
        if (row.repeat.length)
            validateRepeat(row.repeat);
        const found = nodes.get(row.declarationId), ref = row.surface + '.' + row.ref;
        if (!found || bindings.has(row.declarationId) || refs.has(ref) || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(row.ref) || found.node.ref !== row.ref || found.node.tag !== row.tag || !components.has(row.tag) || found.surface !== row.surface || !same(found.repeat, row.repeat))
            fail('Native binding differs from its exact declaration, ref or typed scope.');
        bindings.set(row.declarationId, row);
        refs.add(ref);
    }
    if (nodes.size !== bindings.size)
        fail('Every managed component needs one captured binding.');
    const platformIds = new Set();
    for (const binding of bindings.values()) {
        const component = components.get(binding.tag);
        if (component.role !== 'platform')
            continue;
        for (const command of Object.keys(component.commands)) {
            const operation = nativePlatformOperationId(binding, command), fibers = (program.kernel?.scheduler?.fibers || []).filter(row => row.operation === operation);
            if (fibers.length !== 1 || fibers[0].kind !== 'native-platform' || fibers[0].sourceRef !== 'rmtx-native:' + binding.declarationId || fibers[0].source?.kind !== 'native-component' || fibers[0].source.ref !== binding.declarationId || fibers[0].target?.kind !== 'surface' || fibers[0].target.ref !== binding.surface)
                fail('Platform capabilities require their exact compiled owning Kernel operation.');
            platformIds.add(operation);
        }
    }
    if ((program.kernel?.scheduler?.fibers || []).some(row => row.kind === 'native-platform' && !platformIds.has(row.operation)))
        fail('An uncaptured platform command cannot obtain scheduling authority.');
    const events = new Set(), commands = new Set();
    for (const row of header.events) {
        const declaration = bindings.get(row.component), node = nodes.get(row.component)?.node;
        if (!declaration || events.has(row.eventId) || row.surface !== declaration.surface || row.ref !== declaration.ref || !node.events.some(event => same(event, Object.fromEntries(['astPointer', 'surface', 'component', 'ref', 'event'].map(key => [key, row[key]])))))
            fail('Native event provenance differs from its exact component On.');
        eventBinding(row, declaration, components.get(declaration.tag), program);
        events.add(row.eventId);
    }
    for (const { node } of nodes.values())
        if (node.events.length !== header.events.filter(event => event.component === node.nativeDeclarationId).length)
            fail('Native On sidecar coverage differs.');
    for (const row of header.commands) {
        fields(row, ['astPointer', 'action', 'surface', 'component', 'ref', 'command', 'args', 'keys', 'id', 'sourceRef'], 'Native command');
        const declaration = bindings.get(row.component), effect = (program.actions.effects || []).find(effect => effect.id === row.id), action = (program.actions.actions || []).find(action => action.id === row.action);
        if (!declaration || commands.has(row.id) || !action || !action.effects.includes(row.id) || row.surface !== declaration.surface || row.ref !== declaration.ref || !Object.hasOwn(components.get(declaration.tag).commands, row.command) || row.sourceRef !== 'src:' + row.id || effect?.kind !== 'component-command' || effect.action !== row.action || effect.source?.kind !== 'surface' || effect.source.target !== row.surface || effect.componentCommand !== null || row.keys?.kind !== 'array' || row.keys.items.length !== declaration.repeat.length)
            fail('Native command differs from its genuine compiled Effect, Action or exact target.');
        validateCommandExpression(row.args);
        validateCommandExpression(row.keys);
        commands.add(row.id);
    }
    if ((program.actions.effects || []).filter(effect => effect.kind === 'component-command').length !== commands.size || !same(program.actions.nativeCommands, header.commands))
        fail('Native commands require identical complete Header3 and Actionplan3 sidecars.');
    return freeze(clone({ bindings: header.bindings, events: header.events, commands: header.commands }));
}
function materializeNativeComponentBindings(program, snapshot, materialization) {
    const checked = validateNativeComponentBindings(program), concrete = materialization ? scopes.validateNativeSurfaceMaterialization(program, materialization) : scopes.materializeNativeSurfaceScopes(program, snapshot), scopeMap = new Map(scopes.validateNativeSurfaceScopes(program).declarations.map(row => [row.surface, row])), components = new Map(program.render.nativeView.components.map(row => [row.tag, row])), rows = [];
    for (const declaration of checked.bindings)
        expandRepeatScopes(declaration.repeat.length ? declaration.repeat : undefined, snapshot, keys => {
            const depth = scopeMap.get(declaration.surface).repeat?.length || 0, surface = scopes.findNativeSurfaceInstance(concrete, declaration.surface, keys.slice(0, depth));
            if (!surface)
                return;
            rows.push({ ...declaration, surfaceId: surface.id, keys: keys.slice(), events: checked.events.filter(row => row.component === declaration.declarationId).map(row => eventBinding(row, declaration, components.get(declaration.tag), program)) });
        });
    return freeze(rows);
}
function evaluateNativeCommandExpression(expression, snapshot, input) {
    validateCommandExpression(expression);
    data(snapshot, new Set(), true);
    data(input);
    // Substitute validated inputs as literal data; the existing projection evaluator
    // remains the single authority for arithmetic and strict Boolean semantics.
    function substitute(node) {
        if (node.kind === 'input')
            return { kind: 'literal', value: readBindingPath(input, node.path) };
        if (node.kind === 'object')
            return { ...node, fields: Object.fromEntries(Object.entries(node.fields).map(([key, value]) => [key, substitute(value)])) };
        if (node.kind === 'array')
            return { ...node, items: node.items.map(substitute) };
        if (node.kind === 'conditional')
            return { ...node, test: substitute(node.test), then: substitute(node.then), else: substitute(node.else) };
        if (node.kind === 'unary')
            return { ...node, value: substitute(node.value) };
        if (node.kind === 'binary')
            return { ...node, left: substitute(node.left), right: substitute(node.right) };
        return node;
    }
    const result = projections.evaluateProjection(substitute(expression), snapshot);
    data(result);
    return freeze(clone(result));
}
function resolveNativeCommand(program, effectId, snapshot, input) {
    const checked = validateNativeComponentBindings(program), row = checked.commands.find(row => row.id === effectId);
    if (!row)
        fail('Native command Effect has no exact sidecar.');
    const declaration = checked.bindings.find(binding => binding.declarationId === row.component), keys = evaluateNativeCommandExpression(row.keys, snapshot, input);
    segments(keys);
    if (keys.length !== declaration.repeat.length)
        fail('Native command keys must retain the complete typed scope.');
    const concrete = materializeNativeComponentBindings(program, snapshot).find(binding => binding.declarationId === row.component && same(binding.keys, keys));
    if (!concrete)
        fail('Native command target is absent from the current Model scope.');
    return freeze({ target: concrete.surfaceId + '.' + row.ref, ref: row.ref, surfaceId: concrete.surfaceId, declarationId: row.component, keys, command: row.command, args: evaluateNativeCommandExpression(row.args, snapshot, input) });
}
function resolveNativePlatformOperation(program, declarationId, command) {
    const checked = validateNativeComponentBindings(program), binding = checked.bindings.find(row => row.declarationId === declarationId), component = program.render.nativeView.components.find(row => row.tag === binding?.tag);
    if (!binding || component?.role !== 'platform' || !Object.hasOwn(component.commands, command))
        fail('Platform operations require a captured role command and exact binding.');
    const id = nativePlatformOperationId(binding, command), fiber = program.kernel.scheduler.fibers.find(row => row.operation === id);
    return freeze({ id, sourceRef: fiber.sourceRef, binding: clone(binding), command, capability: component.commands[command].capability, fiberId: fiber.id, lane: fiber.lane, surface: binding.surface });
}
module.exports = { NATIVE_COMPONENT_BINDINGS_API_VERSION, nativePlatformOperationId, resolveNativePlatformOperation, validateNativeComponentBindings, materializeNativeComponentBindings, evaluateNativeCommandExpression, resolveNativeCommand };

'use strict';
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { data, fields, name, clone, freeze } = require('../../tools/xtensions/state-binding-contract');
const binding = require('../../tools/xtensions/state-binding');
const root = path.resolve(__dirname, '../..');
const source = 'development/rmtx-a06/two-host.rmt';
function readContract() { return JSON.parse(fs.readFileSync(path.join(__dirname, 'two-host.contract.json'), 'utf8')); }
function lowerContract(input = readContract()) {
  data(input); fields(input, ['format', 'version', 'caseId', 'documentId', 'ownerSurface', 'payloadSchema', 'hosts'], 'A06 case');
  if (input.format !== 1 || input.version !== '1.0.0' || !Array.isArray(input.hosts) || input.hosts.length !== 2) throw new TypeError('A06 case contract 1.0.0 requires two hosts.');
  for (const key of ['caseId', 'documentId', 'ownerSurface', 'payloadSchema']) name(input[key]);
  const declarations = new Set(), targets = new Set(), providers = new Set(), frameworks = new Set();
  const hosts = input.hosts.map(host => {
    fields(host, ['declarationId', 'targetSurface', 'providerId', 'componentVersion', 'framework', 'providerModule', 'peers', 'lane', 'presence', 'props', 'intents'], 'A06 host');
    for (const key of ['declarationId', 'targetSurface', 'providerId']) name(host[key]);
    if (declarations.has(host.declarationId) || targets.has(host.targetSurface) || providers.has(host.providerId) || host.targetSurface === input.ownerSurface) throw new TypeError('A06 declarations, targets and providers must be distinct.');
    declarations.add(host.declarationId); targets.add(host.targetSurface); providers.add(host.providerId);
    if (!['react', 'vue'].includes(host.framework) || frameworks.has(host.framework)) throw new TypeError('A06 requires one React and one Vue provider.');
    frameworks.add(host.framework);
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(host.providerId) || !/^\d+\.\d+\.\d+$/.test(host.componentVersion)) throw new TypeError('A pinned provider name and version are required.');
    const expectedPeers = host.framework === 'react' ? ['react', 'react-dom'] : ['vue'];
    fields(host.peers, expectedPeers, 'A06 peers');
    if (Object.keys(host.peers).length !== expectedPeers.length || expectedPeers.some(key => !(host.framework === 'react' ? /^18\.\d+\.\d+$/ : /^3\.\d+\.\d+$/).test(host.peers[key])) || host.framework === 'react' && host.peers.react !== host.peers['react-dom']) throw new TypeError('A06 requires exact matching supported peer versions.');
    if (!['visible', 'idle'].includes(host.lane)) throw new TypeError('Unsupported A06 lane request.');
    if (!/^\.\/development\/rmtx-a06\/providers\/[a-z-]+\.mjs$/.test(host.providerModule)) throw new TypeError('A06 providers must be local reference modules.');
    return { ...clone(host), ownerSurface: input.ownerSurface };
  });
  const bindings = { schema: binding.XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, documentId: input.documentId, bindings: hosts.map(host => ({
    surface: host.targetSurface, presence: host.presence,
    binding: { schema: binding.XTENSION_STATE_BINDING_SCHEMA, address: { documentId: input.documentId, declarationId: host.declarationId, keys: [] },
      props: host.props, intents: Object.fromEntries(Object.entries(host.intents).map(([event, spec]) => {
        fields(spec, ['command', 'fields'], 'A06 intent');
        return [event, { command: spec.command, fields: spec.fields, payloadSchema: input.payloadSchema }];
      })) }
  })) };
  const plan = require('../../xtend-maraca').createMaracaBuildPlan({ source, xtensionBindings: bindings,
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false });
  if (!plan.ok) throw Object.assign(new TypeError('A06 bindings do not match the Classic program.'), { diagnostics: plan.diagnostics });
  if (!plan.orchestration.artifact.surfaces.some(surface => surface.id === input.ownerSurface)) throw new TypeError('The common owning Surface must be declared.');
  return freeze({ contractVersion: input.version, documentId: input.documentId, ownerSurface: input.ownerSurface, hosts,
    plan, bindings: clone(plan.xtensionBindings), automaticCompositionSupported: false });
}
function providerRecords(lowered) {
  return lowered.hosts.map(host => ({ id: host.providerId, framework: host.framework, version: host.componentVersion,
    entry: { module: host.providerModule, exportName: 'createComponent' },
    integrity: { sha256: createHash('sha256').update(fs.readFileSync(path.join(root, host.providerModule))).digest('hex') }, peers: host.peers }));
}
function renderTypes(lowered) {
  function type(rule) {
    const value = rule.type === 'array' ? `readonly (${type(rule.items)})[]` : rule.type === 'object'
      ? `{ ${Object.entries(rule.fields).map(([key, spec]) => `readonly ${JSON.stringify(key)}: ${type(spec)}`).join('; ')} }`
      : rule.type === 'json' ? 'unknown' : rule.type;
    return rule.nullable ? `(${value}) | null` : value;
  }
  return '// Generated from two-host.contract.json; run two-host-inspect.cjs --write.\n' + lowered.hosts.map(host => {
    const title = host.declarationId.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('');
    const events = Object.entries(host.intents).map(([event, spec]) => `{ type: ${JSON.stringify(event)}; payload: { ${Object.entries(spec.fields).map(([key, rule]) => `readonly ${JSON.stringify(key)}: ${type(rule)}`).join('; ')} } }`).join(' | ');
    return `export interface ${title}Props {\n${Object.entries(host.props).map(([key, rule]) => `  readonly ${JSON.stringify(key)}: ${type(rule)};`).join('\n')}\n  readonly xtension: { emit(event: ${events}): unknown };\n}\n`;
  }).join('\n');
}
// Fixture consistency check only: this is not an RMTX parser or symbol resolver.
function checkCandidate(text, lowered, ts) {
  const file = ts.createSourceFile('two-host.candidate.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (file.parseDiagnostics.length) throw new TypeError('A06 candidate must parse as TSX.');
  const found = []; let owners = 0;
  function object(expression) {
    if (!expression || !ts.isObjectLiteralExpression(expression)) throw new TypeError('A06 candidate requires explicit object literals.');
    const entries = expression.properties.map(property => {
      if (!ts.isPropertyAssignment(property) || ![ts.SyntaxKind.Identifier, ts.SyntaxKind.StringLiteral].includes(property.name.kind)) throw new TypeError('A06 candidate rejects spreads, methods and computed fields.');
      return [property.name.text, property.initializer];
    });
    if (new Set(entries.map(([key]) => key)).size !== entries.length) throw new TypeError('Duplicate A06 candidate property.');
    return Object.fromEntries(entries);
  }
  function modelPath(expression) {
    if (ts.isIdentifier(expression)) return [expression.text];
    if (ts.isPropertyAccessExpression(expression)) return [...modelPath(expression.expression), expression.name.text];
    throw new TypeError('A06 candidate props require direct Model paths.');
  }
  const staticProps = element => {
    const entries = element.attributes.properties.map(attribute => {
    if (!ts.isJsxAttribute(attribute) || !attribute.initializer || !ts.isStringLiteral(attribute.initializer)) throw new TypeError('A06 identity attributes must be static strings.');
    return [attribute.name.text, attribute.initializer.text];
    });
    if (new Set(entries.map(([key]) => key)).size !== entries.length) throw new TypeError('Duplicate A06 identity attribute.');
    return Object.fromEntries(entries);
  };
  function visit(node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === 'RMT.Surface') {
      owners++;
      const attributes = staticProps(node);
      if (Object.keys(attributes).length !== 1 || attributes.id !== lowered.ownerSurface) throw new TypeError('A06 candidate owner differs.');
    }
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === 'RMT.XTension') throw new TypeError('A06 provider hosts cannot own native JSX children.');
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(file) === 'RMT.XTension') {
      if (node.attributes.properties.some(attribute => !ts.isJsxAttribute(attribute) || !['declarationId', 'provider', 'lane', 'props', 'intents'].includes(attribute.name.text))) throw new TypeError('Unknown A06 host attribute.');
      const identity = { ...node, attributes: { properties: node.attributes.properties.filter(attribute => ['declarationId', 'provider', 'lane'].includes(attribute.name?.text)) } };
      const ids = staticProps(identity), host = lowered.hosts.find(host => host.declarationId === ids.declarationId);
      if (!host) throw new TypeError('Unknown A06 candidate declaration.');
      const attribute = key => {
        const values = node.attributes.properties.filter(attribute => attribute.name.text === key);
        if (values.length !== 1 || !ts.isJsxExpression(values[0].initializer)) throw new TypeError('One A06 expression attribute is required.');
        return object(values[0].initializer.expression);
      };
      const props = attribute('props'), intents = attribute('intents');
      if (JSON.stringify(Object.keys(props).sort()) !== JSON.stringify(Object.keys(host.props).sort()) || Object.entries(props).some(([key, expression]) =>
        JSON.stringify(modelPath(expression)) !== JSON.stringify(['model', host.props[key].state, ...host.props[key].path]))) throw new TypeError('A06 candidate Model bindings differ.');
      if (JSON.stringify(Object.keys(intents).sort()) !== JSON.stringify(Object.keys(host.intents).sort())) throw new TypeError('A06 candidate events differ.');
      for (const [event, expression] of Object.entries(intents)) {
        const spec = object(expression);
        if (Object.keys(spec).length !== 1 || !spec.action || !ts.isStringLiteral(spec.action) || spec.action.text !== host.intents[event].command) throw new TypeError('A06 candidate Action differs.');
      }
      found.push(ids);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (owners !== 1 || JSON.stringify(found) !== JSON.stringify(lowered.hosts.map(host => ({ declarationId: host.declarationId, provider: host.providerId, lane: host.lane })))) throw new TypeError('A06 candidate host identities differ from contract.');
  return { syntaxOnly: true, hosts: found.length };
}
module.exports = { readContract, lowerContract, providerRecords, renderTypes, checkCandidate };

// A06 reference API 2.0.0: call sites select independently captured provider interfaces.
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { data, fields, name, clone, freeze } = require('../../tools/xtensions/state-binding-contract');
const { resolveComponentBinding, canonical } = require('../../tools/xtensions/component-interface');
const { captureComponentInterfaces } = require('../../tools/xtensions/component-interface-build');
const root = path.resolve(__dirname, '../..'), source = 'development/rmtx-a06/two-host.rmt';
const REFERENCE_API_VERSION = '2.0.0';
function readContract() { return JSON.parse(fs.readFileSync(path.join(__dirname, 'two-host.contract.json'), 'utf8')); }
async function captureProviders() {
  const value = JSON.parse(fs.readFileSync(path.join(__dirname, 'providers/catalog.json'), 'utf8'));
  data(value); fields(value, ['format', 'version', 'interfaces'], 'A06 provider catalog');
  if (value.format !== 1 || value.version !== '1.0.0') throw new TypeError('A06 provider catalog 1.0.0 is required.');
  return captureComponentInterfaces({ rootDir: root, interfaces: value.interfaces });
}
async function prepareCase(input = readContract()) {
  const capture = await captureProviders();
  return { capture, lowered: lowerContract(input, capture.catalog) };
}
function lowerContract(input, catalog) {
  data(input);
  if (!input || input.format !== 2 || input.version !== '2.0.0' || !Array.isArray(input.hosts) || input.hosts.length !== 2) throw new TypeError('A06 case contract 2.0.0 requires two hosts; v1 is retained as historical fixture.');
  fields(input, ['format', 'version', 'caseId', 'documentId', 'ownerSurface', 'hosts'], 'A06 case');
  if (!catalog || catalog.apiVersion !== '1.0.0') throw new TypeError('An independently captured component catalog is required.');
  for (const key of ['caseId', 'documentId', 'ownerSurface']) name(input[key]);
  const declarations = new Set(), targets = new Set(), providers = new Set(), frameworks = new Set(), bindings = [];
  const hosts = input.hosts.map(host => {
    fields(host, ['declarationId', 'targetSurface', 'providerId', 'interfaceVersion', 'interfaceSha256', 'componentVersion', 'lane', 'presence', 'props', 'intents'], 'A06 host');
    for (const key of ['declarationId', 'targetSurface', 'providerId']) name(host[key]);
    if (declarations.has(host.declarationId) || targets.has(host.targetSurface) || providers.has(host.providerId) || host.targetSurface === input.ownerSurface) throw new TypeError('A06 declarations, targets and providers must be distinct.');
    declarations.add(host.declarationId); targets.add(host.targetSurface); providers.add(host.providerId);
    const entry = catalog.resolve({ providerId: host.providerId, interfaceVersion: host.interfaceVersion, interfaceSha256: host.interfaceSha256, componentVersion: host.componentVersion });
    const iface = entry.definition;
    if (frameworks.has(iface.framework)) throw new TypeError('A06 requires one React and one Vue provider.');
    frameworks.add(iface.framework);
    if (!['visible', 'idle'].includes(host.lane)) throw new TypeError('Unsupported A06 lane request.');
    const resolved = resolveComponentBinding(iface, { address: { documentId: input.documentId, declarationId: host.declarationId, keys: [] }, props: host.props, intents: host.intents });
    bindings.push({ surface: host.targetSurface, presence: host.presence, binding: resolved.binding });
    return { ...clone(host), ownerSurface: input.ownerSurface, framework: iface.framework, routes: resolved.routes };
  });
  const bindingsRuntime = require('../../tools/xtensions/state-binding');
  const artifact = { schema: bindingsRuntime.XTENSION_STATE_BINDING_ARTIFACT_SCHEMA, documentId: input.documentId, bindings };
  const plan = require('../../xtend-maraca').createMaracaBuildPlan({ source, xtensionBindings: artifact,
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off' }, { rootDir: root, inspectToolchain: false });
  if (!plan.ok) throw Object.assign(new TypeError('A06 bindings do not match the Classic program.'), { diagnostics: plan.diagnostics });
  if (!plan.orchestration.artifact.surfaces.some(surface => surface.id === input.ownerSurface)) throw new TypeError('The common owning Surface must be declared.');
  return freeze({ apiVersion: REFERENCE_API_VERSION, contractVersion: input.version, documentId: input.documentId, ownerSurface: input.ownerSurface, hosts,
    plan, bindings: clone(plan.xtensionBindings), automaticCompositionSupported: false });
}
function renderTypes(catalog) {
  function type(rule) {
    const value = rule.type === 'array' ? `readonly (${type(rule.items)})[]` : rule.type === 'object'
      ? `{ ${Object.entries(rule.fields).map(([key, spec]) => `readonly ${JSON.stringify(key)}: ${type(spec)}`).join('; ')} }`
      : rule.type === 'json' ? 'Exclude<JsonValue, null>' : rule.type;
    return rule.nullable ? `(${value}) | null` : value;
  }
  const captures = catalog.entries(), rows = captures.map(entry => entry.definition);
  const fieldsOf = fields => `{ ${Object.entries(fields).map(([key, rule]) => `readonly ${JSON.stringify(key)}: ${type(rule)}`).join('; ')} }`;
  return '// Generated from captured provider-owned interface files; never from call-site types.\n' +
    'export type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };\n' +
    'export interface ComponentIdentityMap {\n' + captures.map(entry => `  readonly ${JSON.stringify(entry.definition.providerId)}: { readonly interfaceVersion: ${JSON.stringify(entry.definition.version)}; readonly interfaceSha256: ${JSON.stringify(entry.interfaceSha256)}; readonly componentVersion: ${JSON.stringify(entry.definition.componentVersion)}; readonly moduleSha256: ${JSON.stringify(entry.moduleSha256)} };`).join('\n') + '\n}\n' +
    'export interface ComponentPropsMap {\n' + rows.map(row => `  readonly ${JSON.stringify(row.providerId)}: ${fieldsOf(row.props)};`).join('\n') + '\n}\n' +
    'export interface ComponentIntentPayloadMap {\n' + rows.map(row => `  readonly ${JSON.stringify(row.providerId)}: { ${Object.entries(row.intents).map(([event, spec]) => `readonly ${JSON.stringify(event)}: ${fieldsOf(spec.fields)}`).join('; ')} };`).join('\n') + '\n}\n' +
    'export type ProviderId = keyof ComponentPropsMap;\n' +
    'export type ComponentEvent<P extends ProviderId> = { [E in keyof ComponentIntentPayloadMap[P]]: { type: E; payload: ComponentIntentPayloadMap[P][E] } }[keyof ComponentIntentPayloadMap[P]];\n' +
    'export type ComponentProps<P extends ProviderId> = ComponentPropsMap[P] & { readonly xtension: { emit(event: ComponentEvent<P>): unknown } };\n' +
    'export type ComponentCall = { [P in ProviderId]: { provider: P; props: ComponentPropsMap[P]; intents?: { [E in keyof ComponentIntentPayloadMap[P]]?: { action: string; payload?: Readonly<Record<string, Extract<keyof ComponentIntentPayloadMap[P][E], string>>> } } } }[ProviderId];\n' +
    'export type ProductGalleryProps = ComponentProps<"react-product-gallery">;\nexport type ProductReviewsProps = ComponentProps<"vue-product-reviews">;\n';
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
        if (Object.keys(spec).some(key => !['action', 'payload'].includes(key)) || !spec.action || !ts.isStringLiteral(spec.action) || spec.action.text !== host.intents[event].command) throw new TypeError('A06 candidate Action differs.');
        const mapping = spec.payload ? Object.fromEntries(Object.entries(object(spec.payload)).map(([key, value]) => {
          if (!ts.isStringLiteral(value)) throw new TypeError('Intent payload mapping requires static field names.'); return [key, value.text];
        })) : undefined;
        if (canonical(mapping ?? null) !== canonical(host.intents[event].payload ?? null)) throw new TypeError('A06 candidate payload mapping differs.');
      }
      found.push(ids);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (owners !== 1 || JSON.stringify(found) !== JSON.stringify(lowered.hosts.map(host => ({ declarationId: host.declarationId, provider: host.providerId, lane: host.lane })))) throw new TypeError('A06 candidate host identities differ from contract.');
  return { syntaxOnly: true, hosts: found.length };
}
module.exports = { REFERENCE_API_VERSION, readContract, captureProviders, prepareCase, lowerContract, renderTypes, checkCandidate };

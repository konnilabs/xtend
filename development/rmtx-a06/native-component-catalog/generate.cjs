// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { definitions } = require('./catalog.cjs');
const { validateNativeComponentMetadataV2 } = require('../../../tools/xtensions/native-component-contract-v2');
const root = path.resolve(__dirname, '../../..');
const destination = path.join(root, 'tools/rmt-language/rmtx-native-components-v2.json');
const runtimeDestination = path.join(root, 'tools/xtensions/native-component-catalog-v2.js');
const typesDestination=path.join(root,'tools/rmt-language/rmtx-native-components-v2.generated.d.ts');
const matrixDestination = path.join(__dirname, 'matrix.v2.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const excluded = /(?:native-component-catalog-v2\.js|rmtx-native-components-v2(?:\.json|\.js))$/;
function dependencies(entries, main) {
  const visited = new Set(), pending = [...entries];
  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file) || excluded.test(file)) continue;
    const absolute = fs.realpathSync(path.join(root, file)), relative = path.relative(root, absolute).split(path.sep).join('/');
    if (relative.startsWith('../') || path.isAbsolute(relative)) throw new TypeError('Native dependency escaped the repository: ' + file);
    visited.add(relative);
    if (!/\.(?:[cm]?js)$/.test(relative)) continue;
    const text = fs.readFileSync(absolute, 'utf8');
    // Only static local module edges are capture authority. Runtime/CDN imports are not approved.
    const edges = [...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)].map(match => match[1]);
    for (const edge of edges) {
      const target = path.resolve(path.dirname(absolute), edge);
      const resolved = [target, target + '.js', target + '.cjs', target + '.mjs', path.join(target, 'index.js')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!resolved) throw new TypeError('Unresolved local component dependency: ' + relative + ' -> ' + edge);
      const next = path.relative(root, resolved).split(path.sep).join('/');
      if (/^(?:components|tools|xtendrmt|fabric)\//.test(next)) pending.push(next);
    }
  }
  return [...visited].filter(file => file !== main).sort().map(module => ({ module, sha256: hash(module) }));
}
function captureCatalog() {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'components/manifest.json'), 'utf8'));
  const tags = Object.keys(manifest).sort();
  if (JSON.stringify(tags) !== JSON.stringify(Object.keys(definitions).sort())) throw new TypeError('The reviewed native catalog must cover the exact shipped manifest.');
  const counts = { ui: 0, platform: 0, service: 0, demo: 0 };
  const components = tags.map(tag => {
    const definition = definitions[tag], module = 'components/' + manifest[tag].slice(2);
    const managedModule = module.replace(/\.js$/, '.definition.js');
    const entry = fs.existsSync(path.join(root, managedModule)) ? managedModule : module;
    const helpers = ['components/native-managed.js', 'tools/xtensions/native-component-managed.js', 'tools/xtensions/native-component-contract-v2.js'];
    if (definition.role === 'platform') helpers.push('components/native-platform.js');
    if (definition.role === 'service') helpers.push('components/native-services.js');
    counts[definition.role]++;
    return validateNativeComponentMetadataV2({ schema: 'xtend.rmt.native-component-metadata.v2', tag, module, managedModule: entry, sha256: hash(module), dependencies: dependencies([module, entry, ...helpers.filter(file => fs.existsSync(path.join(root, file)))], module), sourceStrategy: 'managed-shared-definition', ...definition, status: { implementation: entry !== module ? 'implemented' : 'pending', verification: 'pending' } });
  });
  if (counts.ui !== 36 || counts.platform !== 6 || counts.service !== 4 || counts.demo !== 1) throw new TypeError('Native catalog roles must be 36 UI, 6 platform, 4 services and one demo.');
  return { schema: 'xtend.rmtx.native-components.v2', apiVersion: '2.0.0', source: 'components/manifest.json', counts, components };
}
function main(args = process.argv.slice(2)) {
  if (args.some(arg => !['--write', '--check'].includes(arg)) || args.includes('--write') && args.includes('--check')) throw new TypeError('Use --write or --check. Default is read-only --check.');
  const catalog = captureCatalog(), serialized = JSON.stringify(catalog, null, 2) + '\n';
  const runtime = "// SPDX-License-Identifier: Apache-2.0\n'use strict';\n// Generated reviewed capture. No browser JSON loader or source execution.\nconst {freeze}=require('./state-binding-contract');\nconst NATIVE_COMPONENT_CATALOG_V2=freeze(" + JSON.stringify(catalog.components) + ");\nmodule.exports={NATIVE_COMPONENT_CATALOG_V2};\n";
  const types=generateTypes(catalog);
  if (args.includes('--write')) { fs.writeFileSync(destination, serialized);fs.writeFileSync(runtimeDestination,runtime);fs.writeFileSync(typesDestination,types); if (!fs.existsSync(matrixDestination)) fs.writeFileSync(matrixDestination, JSON.stringify(createMatrix(catalog), null, 2) + '\n'); process.stdout.write('Captured reviewed native catalog2 (47 manifest roles). Verification remains pending.\n'); }
  else if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== serialized || !fs.existsSync(runtimeDestination) || fs.readFileSync(runtimeDestination,'utf8')!==runtime || !fs.existsSync(typesDestination)||fs.readFileSync(typesDestination,'utf8')!==types) { process.stderr.write('Native catalog2 capture is stale. Review source changes, then run generate.cjs --write.\n'); process.exitCode = 1; }
  else process.stdout.write('Native catalog2 source/dependency capture matches. Verification status remains explicit.\n');
}
function valueType(rule){
  let result=rule.enum?rule.enum.map(value=>JSON.stringify(value)).join(' | '):rule.type==='json'?'RmtJsonValue':rule.type==='key'?'string | number':rule.type==='array'?'ReadonlyArray<'+valueType(rule.items)+'>':rule.type==='object'?objectType(rule.fields,rule.optional||[]):rule.type;
  if(rule.nullable&&!(rule.enum||[]).includes(null))result+=' | null';
  return result;
}
function objectType(fields,optional=[]){const entries=Object.entries(fields);return entries.length?'Readonly<{ '+entries.map(([name,rule])=>'readonly '+JSON.stringify(name)+(optional.includes(name)?'?':'')+': '+valueType(rule)).join('; ')+' }>':'Readonly<Record<string,never>>';}
function generateTypes(catalog){
  const lines=["// SPDX-License-Identifier: Apache-2.0","// Generated from the explicitly reviewed ValueRules in catalog.cjs. Do not edit.","import type {RmtJsonValue} from './rmt-tooling-public-types';","export interface RmtxNativeComponentTypeMapV2 {"];
  for(const row of catalog.components.filter(row=>['ui','platform'].includes(row.role))){
    lines.push(' readonly '+JSON.stringify(row.tag)+': Readonly<{');
    lines.push('  role:'+JSON.stringify(row.role)+'; attributes:'+objectType(row.attributes)+'; properties:'+objectType(row.properties)+';');
    lines.push('  events:'+(Object.keys(row.events).length?'Readonly<{ '+Object.entries(row.events).map(([name,spec])=>'readonly '+JSON.stringify(name)+': '+valueType(spec.payload)).join('; ')+' }>':'Readonly<Record<string,never>>')+';');
    lines.push('  commands:'+(Object.keys(row.commands).length?'Readonly<{ '+Object.entries(row.commands).map(([name,spec])=>'readonly '+JSON.stringify(name)+': Readonly<{args:'+valueType(spec.args)+';result:'+valueType(spec.result)+';capability:'+JSON.stringify(spec.capability)+'}>').join('; ')+' }>':'Readonly<Record<string,never>>')+';');
    lines.push(' }>;');
  }
  lines.push('}','export type RmtxNativeComponentTagV2=keyof RmtxNativeComponentTypeMapV2;','');return lines.join('\n');
}
function createMatrix(catalog) {
  const waves = [ ['x-button', 'x-header', 'x-icon', 'x-cards', 'x-footer', 'x-progress', 'x-section', 'x-status', 'x-summary', 'x-type'], ['x-router', 'x-side-panel', 'x-surface-manager', 'x-surface-portal', 'x-surface-region', 'x-surface-window', 'x-theme', 'x-utils', 'xtend-i18n', 'xtend-state'], ['x-input', 'x-textarea', 'x-checkbox', 'x-toggle', 'x-radio', 'x-select', 'x-calendar', 'x-form'], ['x-link', 'x-tabs', 'x-menu', 'x-hero', 'x-code', 'x-masonry'], ['x-alert', 'x-dialog', 'x-drawer', 'x-keymap', 'x-lightbox', 'x-modal', 'x-popover', 'x-spinner', 'x-toast', 'x-tooltip'], ['x-player', 'x-writer'], ['x-rmt-lifecycle-demo-build'] ];
  return { schema: 'xtend.rmtx.native-component-acceptance.v2', targetRelease: '0.9.0', releaseGate: 'all-46-productive-roles-and-demo', catalogSchema: catalog.schema, entries: catalog.components.map(row => ({ tag: row.tag, role: row.role, wave: waves.findIndex(tags => tags.includes(row.tag)) + 1, acceptance: 'pending', features: {
    metadata: { implementation: 'implemented', verification: 'pending' },
    definition: { implementation: row.status.implementation, verification: 'pending' },
    attributes: { implementation: Object.keys(row.attributes).length ? 'implemented' : 'not-applicable', verification: 'pending' },
    properties: { implementation: Object.keys(row.properties).length ? 'implemented' : 'not-applicable', verification: 'pending' },
    events: { implementation: Object.keys(row.events).length ? 'implemented' : ['platform', 'service'].includes(row.role) ? 'delegated' : 'not-applicable', verification: 'pending' },
    commands: { implementation: Object.keys(row.commands).length ? 'implemented' : ['platform', 'service'].includes(row.role) ? 'delegated' : 'not-applicable', verification: 'pending' },
    state: { implementation: ['platform', 'service'].includes(row.role) ? 'delegated' : 'implemented', verification: 'pending' },
    slotsAndOwnership: { implementation: 'implemented', verification: 'pending' },
    resources: { implementation: row.capabilities.length ? 'delegated' : 'not-applicable', verification: 'pending' },
    classicCompatibility: { implementation: 'implemented', verification: 'pending' },
    browserLifecycle: { implementation: 'implemented', verification: 'pending' }
  }, evidence: [] })) };
}
if (require.main === module) main();
module.exports = { captureCatalog, dependencies, createMatrix, generateTypes, main };

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { compileRmtClassicSource, compileRmtClassicAstWithBindings } = require('../../tools/rmt-language/classic-compiler');
const { createMaracaBuildPlan } = require('../../xtend-maraca');
const { XTENSION_STATE_BINDING_ARTIFACT_SCHEMA } = require('../../tools/xtensions/state-binding');
const { filterBinding } = require('./controlled-filters');
const rootDir = path.resolve(__dirname, '../..');
const source = 'development/rmtx-a02/controlled-filters.rmt';
function inspect(conditional = false) {
  const sourcePath = conditional ? 'development/rmtx-a02/conditional-filters.rmt' : source;
  const declarations = { schema: conditional ? XTENSION_STATE_BINDING_ARTIFACT_SCHEMA : 'xtend.xtensions.state-binding-artifact.v1', documentId: 'filter-example',
    bindings: ['left', 'right'].map((key) => ({ surface: `filter.${key}`, binding: filterBinding(key), ...(conditional ? { presence: { state: 'hosts', path: [key] } } : {}) })) };
  if (conditional) for (const entry of declarations.bindings) entry.binding.intents.presence = {
    command: 'hosts.replace', payloadSchema: 'filter-example.host-presence.v1',
    fields: { hosts: { type: 'object', fields: { left: { type: 'boolean' }, right: { type: 'boolean' } } } }
  };
  const input = { text: fs.readFileSync(path.join(rootDir, sourcePath), 'utf8'), filePath: sourcePath };
  const compiled = compileRmtClassicSource(input, { xtensionBindings: declarations });
  assert(compiled.ok, JSON.stringify(compiled.diagnostics));
  const ast = compileRmtClassicAstWithBindings(compiled.parserResult.ast, declarations, { sourceModel: compiled.parserResult.sourceModel });
  assert.equal(ast.coreJson, compiled.coreJson, 'Source and AST use the same closed Core contract');
  assert.deepEqual(ast.xtensionBindings, compiled.xtensionBindings, 'Source and AST produce the same binding artifact');
  const plan = createMaracaBuildPlan({ sourceText: input.text, virtualSourcePath: sourcePath, xtensionBindings: declarations,
    orchestration: 'strict', kernel: 'off', hydration: 'off', validation: 'off', transitions: 'off', stack: 'plan' }, { rootDir, inspectToolchain: false });
  assert(plan.ok, JSON.stringify(plan.diagnostics));
  assert.deepEqual(plan.xtensionBindings, compiled.xtensionBindings, 'Maraca transports the compiled sidecar');
  return { orchestration: plan.orchestration, xtensionBindings: plan.xtensionBindings, kernel: { enabled: false },
    hydration: { enabled: false }, validation: { enabled: false }, transitions: { enabled: false }, components: plan.components };
}
if (require.main === module) {
  const plan = inspect(), hash = (value) => createHash('sha256').update(value).digest('hex');
  const outputs = {
    'bindings.v1.json': plan.xtensionBindings,
    'evidence.json': { format: 1, source, sourceSha256: hash(fs.readFileSync(path.join(rootDir, source))),
      astContractVersion: '1.0.0', compilerApiVersion: require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILER_API_VERSION,
      compileResultSchema: require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILE_RESULT_SCHEMA,
      maracaBuildPlanSchema: require('../../xtend-maraca').MARACA_BUILD_PLAN_SCHEMA,
      bindingSchema: plan.xtensionBindings.schema,
      bindingArtifactSha256: hash(JSON.stringify(plan.xtensionBindings)), programSha256: hash(JSON.stringify(plan.orchestration.artifact)),
      sourceAstParity: true, maracaTransport: true }
  };
  const conditional = inspect(true);
  outputs['conditional-bindings.v2.json'] = conditional.xtensionBindings;
  outputs['conditional-evidence.json'] = { format: 1, source: 'development/rmtx-a02/conditional-filters.rmt',
    sourceSha256: hash(fs.readFileSync(path.join(__dirname, 'conditional-filters.rmt'))),
    astContractVersion: '1.0.0', compilerApiVersion: require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILER_API_VERSION,
    compileResultSchema: require('../../tools/rmt-language/classic-compiler').RMT_CLASSIC_COMPILE_RESULT_SCHEMA,
    maracaBuildPlanSchema: require('../../xtend-maraca').MARACA_BUILD_PLAN_SCHEMA,
    bindingSchema: conditional.xtensionBindings.schema, bindingArtifactSha256: hash(JSON.stringify(conditional.xtensionBindings)),
    programSha256: hash(JSON.stringify(conditional.orchestration.artifact)), sourceAstParity: true, maracaTransport: true };
  for (const [name, value] of Object.entries(outputs)) {
    const text = JSON.stringify(value, null, 2) + '\n', output = path.join(__dirname, name);
    if (process.argv.includes('--write')) fs.writeFileSync(output, text);
    if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output, 'utf8'), text, `A02.2 ${name} drift`);
  }
  console.log('A02.2: Source/AST parity and strict Maraca binding artifact verified.');
}
module.exports = { inspect, inspectConditional: () => inspect(true) };

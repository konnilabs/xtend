const fs = require('fs');
const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRepoPath,
  resolveRootDir
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');
const {
  RMT_FILE_FALLBACK_CODE,
  RMT_VNEXT_CONTEXT_ERROR_CODE,
  RMT_VNEXT_PARSER_MODULE_PATH,
  RMT_VNEXT_PARSER_PACKAGE_SCRIPT,
  RMT_VNEXT_PARSER_REPORT_SCHEMA,
  RMT_VNEXT_PARSER_SCHEMA,
  RMT_VNEXT_PARSER_SUITE_PATH,
  RMT_VNEXT_PARSER_WORKPACKAGE,
  RMT_VNEXT_SYNTAX_ERROR_CODE,
  createRmtVNextParser,
  parseRmtVNextSource,
  tokenizeVNextSource
} = require('../../tools/rmt-language/vnext-parser');
const {
  createRmtSourceModel
} = require('../../tools/rmt-language/source-model');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const GRAMMAR_CONTRACT_PATH = 'development/XTendRMT-vNext-Grammar-Contract.md';
const CORE_CONTRACT_PATH = 'development/XTendRMT-vNext-Core-Format-Contract.md';
const WP_E15_04_PATH = 'development/WP-E15-04-Lexer-Parser-MVP-fuer-Templates-Surfaces-Lanes-und-Lifecycle-Ops-bauen.md';
const VALID_MINIMAL_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-minimal.rmt';
const VALID_COMPLEX_FIXTURE = 'tests/rmt-language/fixtures/vnext-valid-complex.rmt';
const VALID_RESUMABILITY_FIXTURE = 'tests/rmt-language/fixtures/vnext-resumability-valid.rmt';
const PRIMITIVE_GRAMMAR_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt';
const INVALID_IMPERATIVE_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-imperative.rmt';
const INVALID_CONDITION_CALL_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-condition-call.rmt';
const INVALID_TOP_LEVEL_OPERATION_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-top-level-operation.rmt';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertDiagnosticRange(context, diagnostic, message) {
  context.assert(
    diagnostic
      && diagnostic.range
      && diagnostic.range.start
      && diagnostic.range.end
      && Number.isInteger(diagnostic.range.start.line)
      && Number.isInteger(diagnostic.range.start.character)
      && Number.isInteger(diagnostic.range.end.line)
      && Number.isInteger(diagnostic.range.end.character),
    message
  );
}

function collectNodes(node, type, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (node.type === type) found.push(node);

  Object.keys(node).forEach((key) => {
    if (node.type === 'RmtVNextDocument' && ['imports', 'templates', 'surfaces'].includes(key)) {
      return;
    }
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((entry) => collectNodes(entry, type, found));
    } else if (value && typeof value === 'object' && value.type) {
      collectNodes(value, type, found);
    }
  });

  return found;
}

function parseFixture(relativePath, rootDir) {
  return parseRmtVNextSource({
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir)
  });
}

function runRmtVNextParserSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-parser',
    label: 'Epic 15 RMT vNext Lexer and Parser MVP'
  });
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextParser;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const grammarContract = readText(GRAMMAR_CONTRACT_PATH, rootDir);
  const coreContract = readText(CORE_CONTRACT_PATH, rootDir);
  const parserSyntax = syntaxCheckFile(RMT_VNEXT_PARSER_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_PARSER_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_PARSER_MODULE_PATH, rootDir, 'vNext parser module exists');
  assertFileExists(context, RMT_VNEXT_PARSER_SUITE_PATH, rootDir, 'vNext parser suite exists');
  assertFileExists(context, WP_E15_04_PATH, rootDir, 'WP-E15-04 workpackage document exists');
  assertFileExists(context, VALID_MINIMAL_FIXTURE, rootDir, 'minimal vNext fixture exists');
  assertFileExists(context, VALID_COMPLEX_FIXTURE, rootDir, 'complex vNext fixture exists');
  assertFileExists(context, PRIMITIVE_GRAMMAR_FIXTURE, rootDir, 'vNext primitive grammar fixture exists');
  context.assert(parserSyntax.ok, `vNext parser module syntax passes${parserSyntax.ok ? '' : ` (${parserSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext parser suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  context.assert(metadata && metadata.schema === RMT_VNEXT_PARSER_SCHEMA, 'package metadata declares vNext parser schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_PARSER_REPORT_SCHEMA, 'package metadata declares vNext parser report schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_PARSER_WORKPACKAGE, 'package metadata points to WP-E15-04');
  context.assert(metadata && metadata.module === RMT_VNEXT_PARSER_MODULE_PATH, 'package metadata points to vNext parser module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_PARSER_SUITE_PATH, 'package metadata points to vNext parser suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-parser --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_PARSER_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-parser'] === 'string' ? packageManifest.exports['./rmt-language/vnext-parser'] : packageManifest.exports['./rmt-language/vnext-parser'] && packageManifest.exports['./rmt-language/vnext-parser'].default) === './tools/rmt-language/vnext-parser.js', 'package exports vNext parser');
  context.assert(packageManifest.scripts['test:rmt-vnext-parser'] === 'node scripts/run_xtend_tests.js rmt-vnext-parser', 'package exposes vNext parser script');
  context.assert(runner.includes("id: 'rmt-vnext-parser'"), 'test runner exposes rmt-vnext-parser suite');
  context.assert(epic.includes('| `WP-E15-04` | P0 | completed | WS1 |'), 'Epic marks WP-E15-04 completed');
  context.assert(epic.includes('WP-E15-05` ist `ready`'), 'Epic hands off WP-E15-05 as ready');
  context.assert(grammarContract.includes('Contract: `xtend.rmt.vnext.grammar.v1`'), 'Grammar contract remains visible');
  context.assert(coreContract.includes('RmtLifecycleStatement'), 'Core contract keeps stable lifecycle AST node');

  const minimalResult = parseFixture(VALID_MINIMAL_FIXTURE, rootDir);
  context.assert(minimalResult.schema === RMT_VNEXT_PARSER_SCHEMA, 'minimal fixture emits vNext parser schema');
  context.assert(minimalResult.ok === true, 'minimal fixture parses successfully');
  context.assert(minimalResult.ast.type === 'RmtVNextDocument', 'minimal fixture returns document AST');
  context.assert(collectNodes(minimalResult.ast, 'RmtTemplateDeclaration').length === 1, 'minimal fixture has one template');
  context.assert(collectNodes(minimalResult.ast, 'RmtSurfaceDeclaration').length === 1, 'minimal fixture has one surface');
  context.assert(collectNodes(minimalResult.ast, 'RmtLaneDeclaration').length === 1, 'minimal fixture has one lane');
  context.assert(collectNodes(minimalResult.ast, 'RmtLifecycleStatement').length === 1, 'minimal fixture has one lifecycle statement');
  context.assert(
    collectNodes(minimalResult.ast, 'RmtLifecycleStatement')[0].op === 'hydrate',
    'minimal fixture lifecycle operation is hydrate'
  );
  assertDiagnosticRange(context, {
    range: collectNodes(minimalResult.ast, 'RmtLifecycleStatement')[0].range
  }, 'minimal lifecycle statement has source range');

  const complexResult = parseFixture(VALID_COMPLEX_FIXTURE, rootDir);
  context.assert(complexResult.ok === true, 'complex fixture parses successfully');
  context.assert(collectNodes(complexResult.ast, 'RmtImportDeclaration').length === 1, 'complex fixture has one import');
  context.assert(collectNodes(complexResult.ast, 'RmtSurfaceDeclaration').length === 3, 'complex fixture has three surfaces');
  context.assert(collectNodes(complexResult.ast, 'RmtLaneDeclaration').length === 4, 'complex fixture has four lanes');
  context.assert(collectNodes(complexResult.ast, 'RmtLifecycleStatement').length === 5, 'complex fixture has five lifecycle statements');
  context.assert(collectNodes(complexResult.ast, 'RmtStreamStatement').length === 1, 'complex fixture has one stream statement');
  context.assert(collectNodes(complexResult.ast, 'RmtConditionClause').length === 1, 'complex fixture has one condition clause');
  context.assert(collectNodes(complexResult.ast, 'RmtSourceClause').length === 2, 'complex fixture has two data source clauses');
  context.assert(collectNodes(complexResult.ast, 'RmtSlotDeclaration').length === 1, 'complex fixture has one slot');
  context.assert(collectNodes(complexResult.ast, 'RmtEventBinding').length === 1, 'complex fixture has one event binding');
  context.assert(collectNodes(complexResult.ast, 'RmtTrustBoundaryPolicy').length === 1, 'complex fixture has one trust boundary');
  context.assert(collectNodes(complexResult.ast, 'RmtSanitizePolicy').length === 1, 'complex fixture has one sanitize policy');
  context.assert(
    collectNodes(complexResult.ast, 'RmtLaneDeclaration').some((lane) => lane.name === 'critical' && lane.weight === 10),
    'complex fixture preserves lane weight'
  );
  context.assert(
    collectNodes(complexResult.ast, 'RmtEventBinding')[0].action === 'settings.save',
    'complex fixture preserves event action reference'
  );

  const resumabilityResult = parseFixture(VALID_RESUMABILITY_FIXTURE, rootDir);
  context.assert(resumabilityResult.ok === true, 'resumability fixture parses successfully');
  context.assert(collectNodes(resumabilityResult.ast, 'RmtResumabilityPolicy').length === 8, 'resumability fixture preserves all eight hydrate and resume policy clauses');
  context.assert(collectNodes(resumabilityResult.ast, 'RmtHydrationPolicy').some((node) => node.mode === 'server_prerender_resume'), 'resumability fixture parses server resume hydration mode');
  context.assert(collectNodes(resumabilityResult.ast, 'RmtLifecycleStatement').some((node) => node.op === 'resume'), 'resumability fixture keeps resume lifecycle operation');

  const primitiveResult = parseFixture(PRIMITIVE_GRAMMAR_FIXTURE, rootDir);
  context.assert(primitiveResult.ok === true, 'primitive grammar fixture parses successfully');
  context.assert(collectNodes(primitiveResult.ast, 'RmtStateDeclaration').length === 3, 'primitive fixture has three state declarations');
  context.assert(collectNodes(primitiveResult.ast, 'RmtSelectorDeclaration').length === 2, 'primitive fixture has two selectors');
  context.assert(collectNodes(primitiveResult.ast, 'RmtDataSourceDeclaration').length === 2, 'primitive fixture has two datasources');
  context.assert(collectNodes(primitiveResult.ast, 'RmtActionDeclaration').length === 2, 'primitive fixture has two actions');
  context.assert(collectNodes(primitiveResult.ast, 'RmtPortalDeclaration').length === 2, 'primitive fixture has two portals');
  context.assert(collectNodes(primitiveResult.ast, 'RmtOverlayDeclaration').length === 1, 'primitive fixture has one overlay');
  context.assert(collectNodes(primitiveResult.ast, 'RmtResourceDeclaration').length === 2, 'primitive fixture has two resources');
  context.assert(collectNodes(primitiveResult.ast, 'RmtSurfaceDeclaration').length === 2, 'primitive fixture has two primitive surfaces');
  context.assert(collectNodes(primitiveResult.ast, 'RmtSurfaceRepeatClause').length === 1, 'primitive fixture has one keyed surface repeater clause');
  context.assert(collectNodes(primitiveResult.ast, 'RmtReducerStatement').length === 1, 'primitive fixture has one reducer statement');
  context.assert(collectNodes(primitiveResult.ast, 'RmtEffectStatement').length === 1, 'primitive fixture has one effect statement');
  context.assert(collectNodes(primitiveResult.ast, 'RmtActionResultHandler').length === 3, 'primitive fixture has three action result handlers');
  context.assert(collectNodes(primitiveResult.ast, 'RmtEventBinding').length === 2, 'primitive fixture has two event bindings');
  context.assert(collectNodes(primitiveResult.ast, 'RmtEventPayloadMapping').length === 3, 'primitive fixture has three event payload mappings');
  context.assert(
    collectNodes(primitiveResult.ast, 'RmtStateDeclaration').every((node) => node.range && node.range.start && node.range.end),
    'primitive state declarations have source ranges'
  );
  context.assert(
    collectNodes(primitiveResult.ast, 'RmtSelectorWhereClause').some((node) => node.text.includes('contains(record.name')),
    'primitive selector preserves declarative contains operator text'
  );

  const componentCommandResult = parseRmtVNextSource({
    text: `template demo.commands {
  action demo.doFocus {
    effect focus selector demo.editor
  }
  action demo.doReset {
    effect reset selector demo.editor
  }
  action demo.capture {
    effect snapshot selector demo.editor
  }
  surface demo.editor kind field component x-textarea {
  }
}`,
    filePath: resolveRepoPath('tmp/rmt-vnext-component-commands.rmt', rootDir)
  });
  const componentCommandEffects = collectNodes(componentCommandResult.ast, 'RmtEffectStatement');
  context.assert(componentCommandResult.ok === true, 'declarative component command syntax parses successfully');
  context.assert(componentCommandEffects.length === 3, 'focus, reset and snapshot parse as three effects');
  context.assert(
    componentCommandEffects.map((effect) => effect.componentCommand && effect.componentCommand.command).join(',') === 'focus,reset,snapshot',
    'component command effects preserve the fixed command allowlist'
  );
  context.assert(
    componentCommandEffects.every((effect) => effect.componentCommand && effect.componentCommand.target === 'demo.editor' && effect.componentCommand.authoringKind === 'selector'),
    'component command effects preserve their static selector surface target'
  );
  componentCommandEffects.forEach((effect) => {
    assertDiagnosticRange(context, { range: effect.effectKindNode && effect.effectKindNode.range }, `${effect.effectKind} command has a source range`);
    assertDiagnosticRange(context, { range: effect.componentCommand && effect.componentCommand.targetNode && effect.componentCommand.targetNode.range }, `${effect.effectKind} target has a source range`);
  });

  const parser = createRmtVNextParser();
  const fallbackResult = parser.parseSource({
    text: readText(VALID_MINIMAL_FIXTURE, rootDir),
    filePath: resolveRepoPath('tests/rmt-language/fixtures/vnext-valid-minimal.rmt.json', rootDir)
  });
  const fallbackDiagnostic = fallbackResult.diagnostics.find((diagnostic) => diagnostic.code === RMT_FILE_FALLBACK_CODE);
  context.assert(fallbackResult.ok === true, '.rmt.json fallback parses as vNext syntax');
  context.assert(fallbackDiagnostic && fallbackDiagnostic.severity === 'warning', '.rmt.json fallback emits warning diagnostic');
  assertDiagnosticRange(context, fallbackDiagnostic, '.rmt.json fallback warning has range');

  const imperativeResult = parseFixture(INVALID_IMPERATIVE_FIXTURE, rootDir);
  context.assert(imperativeResult.ok === false, 'imperative fixture fails parsing');
  context.assert(
    imperativeResult.diagnostics.some((diagnostic) => diagnostic.code === RMT_VNEXT_CONTEXT_ERROR_CODE && diagnostic.message.includes('Imperative keyword')),
    'imperative fixture emits imperative keyword diagnostic'
  );
  assertDiagnosticRange(context, imperativeResult.syntaxDiagnostics[0], 'imperative diagnostic has range');

  const conditionCallResult = parseFixture(INVALID_CONDITION_CALL_FIXTURE, rootDir);
  context.assert(conditionCallResult.ok === false, 'condition function call fixture fails parsing');
  context.assert(
    conditionCallResult.diagnostics.some((diagnostic) => diagnostic.message.includes('Function calls are not allowed')),
    'condition function call emits function-call diagnostic'
  );

  const topLevelOperationResult = parseFixture(INVALID_TOP_LEVEL_OPERATION_FIXTURE, rootDir);
  context.assert(topLevelOperationResult.ok === false, 'top-level operation fixture fails parsing');
  context.assert(
    topLevelOperationResult.diagnostics.some((diagnostic) => diagnostic.message.includes('must be inside a lane or slot')),
    'top-level operation emits context diagnostic'
  );

  const sourceModel = createRmtSourceModel({
    text: 'template docs.page {\n  surface root {}\n}\n',
    uri: 'file:///virtual/tokenize.rmt'
  });
  const lexed = tokenizeVNextSource(sourceModel);
  context.assert(lexed.diagnostics.length === 0, 'tokenizer accepts simple vNext source');
  context.assert(lexed.tokens.some((token) => token.value === 'template'), 'tokenizer emits template token');
  context.assert(lexed.tokens.some((token) => token.type === 'newline'), 'tokenizer emits newline tokens for statement boundaries');

  return context.result({
    schema: RMT_VNEXT_PARSER_REPORT_SCHEMA,
    parserSchema: RMT_VNEXT_PARSER_SCHEMA,
    workpackage: RMT_VNEXT_PARSER_WORKPACKAGE,
    parserModule: RMT_VNEXT_PARSER_MODULE_PATH,
    suite: RMT_VNEXT_PARSER_SUITE_PATH,
    validFixtureCount: 3,
    invalidFixtureCount: 3
  });
}

function printRmtVNextParserReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Lexer and Parser MVP erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Lexer and Parser MVP fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextParserReport,
  runRmtVNextParserSuite
};

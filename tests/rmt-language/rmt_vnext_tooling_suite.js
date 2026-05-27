const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
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
  createRmtSourceModel
} = require('../../tools/rmt-language/source-model');
const {
  lintRmtSource
} = require('../../tools/rmt-language/diagnostics');
const {
  createRmtSnippetCatalog,
  createVsCodeSnippetDocument
} = require('../../tools/rmt-language/snippets');
const {
  createRmtLanguageServer
} = require('../../tools/rmt-language-server/server');
const {
  runRmtLinterCli
} = require('../../tools/rmt-linter/cli');
const {
  createRmtAgentRepairReportForFiles
} = require('../../tools/rmt-linter/reporter');
const {
  RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
  RMT_VNEXT_TOOLING_MODULE_PATH,
  RMT_VNEXT_TOOLING_PACKAGE_SCRIPT,
  RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE,
  RMT_VNEXT_PRIMITIVE_CODE_ACTION_PROVIDER_SCHEMA,
  RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA,
  RMT_VNEXT_PRIMITIVE_CODE_ACTION_REPORT_SCHEMA,
  RMT_VNEXT_PRIMITIVE_COMMAND_HANDOFF_SCHEMA,
  RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND,
  RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND,
  RMT_CODE_ACTION_SCHEMA,
  RMT_VNEXT_TOOLING_REPORT_SCHEMA,
  RMT_VNEXT_TOOLING_SCHEMA,
  RMT_VNEXT_TOOLING_SUITE_PATH,
  RMT_VNEXT_TOOLING_WORKPACKAGE,
  RMT_WORKSPACE_EDIT_SCHEMA,
  VNEXT_SNIPPETS,
  analyzeRmtVNextToolingSource,
  createRmtVNextPrimitiveCommandHandoff,
  createRmtVNextToolingAdapter,
  formatRmtVNextSource,
  getRmtVNextToolingCodeActions,
  getRmtVNextToolingCompletions,
  getRmtVNextToolingDefinition,
  getRmtVNextToolingDocumentSymbols,
  getRmtVNextToolingHover,
  isLikelyRmtVNextSource,
  lintRmtVNextToolingSource
} = require('../../tools/rmt-language/vnext-tooling');

const EPIC_15_PATH = 'development/EPIC_E15_RMT_vNext_Syntax.md';
const TOOLING_CONTRACT_PATH = 'development/XTendRMT-vNext-Tooling-Adapter-Contract.md';
const WP_E15_15_PATH = 'development/WP-E15-15-Tooling-Update-fuer-Linter-LSP-Formatter-und-Snippets-bauen.md';
const VALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-streaming-progressive.rmt';
const PRIMITIVE_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt';
const VALIDATION_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/maraca-validation-app.rmt';
const TRANSITION_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/maraca-transitions-app.rmt';
const PRIMITIVE_INVALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt';
const INVALID_VNEXT_FIXTURE = 'tests/rmt-language/fixtures/vnext-invalid-condition-call.rmt';
const LEGACY_FIXTURE = 'tests/rmt-language/fixtures/regression-valid.rmt';
const PUBLIC_TOOLING_DOC_PATHS = Object.freeze([
  'docs/de/rmt-linter.md',
  'docs/en/rmt-linter.md',
  'docs/de/rmt-language-server.md',
  'docs/en/rmt-language-server.md'
]);
const SEMANTIC_GRAPH_SOURCE_PATH = 'tools/rmt-language/semantic-graph.js';
const VSCODE_EXTENSION_SOURCE_PATH = 'tools/rmt-editor/vscode/extension.js';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function createMemoryStream() {
  const chunks = [];
  return {
    write(chunk) {
      chunks.push(String(chunk));
    },
    toString() {
      return chunks.join('');
    }
  };
}

function fixtureInput(relativePath, rootDir) {
  return {
    text: readText(relativePath, rootDir),
    filePath: resolveRepoPath(relativePath, rootDir),
    version: 15
  };
}

function linesOf(input) {
  return String(input && input.text ? input.text : input || '').split(/\r\n|\r|\n/u);
}

function findLineNumber(input, needle) {
  const lines = linesOf(input);
  const line = lines.findIndex((entry) => entry.includes(needle));

  if (line < 0) {
    throw new Error(`Fixture line not found: ${needle}`);
  }

  return line;
}

function positionAfter(input, needle) {
  const line = findLineNumber(input, needle);
  const lineText = linesOf(input)[line];

  return {
    line,
    character: lineText.indexOf(needle) + needle.length
  };
}

function applyWorkspaceEdit(text, action) {
  const changes = action && action.edit && action.edit.changes
    ? action.edit.changes
    : {};
  const edits = Object.values(changes).flat();
  let nextText = text;

  edits.slice().sort((left, right) => {
    const sourceModel = createRmtSourceModel({ text: nextText });
    return sourceModel.offsetAt(right.range.start) - sourceModel.offsetAt(left.range.start);
  }).forEach((edit) => {
    const sourceModel = createRmtSourceModel({ text: nextText });
    const start = sourceModel.offsetAt(edit.range.start);
    const end = sourceModel.offsetAt(edit.range.end);

    nextText = `${nextText.slice(0, start)}${edit.newText}${nextText.slice(end)}`;
  });

  return nextText;
}

function createPrimitiveAuthoringProblemFixture() {
  return [
    'template demo.authoring.missing {',
    '  state demo.blank type object preserve',
    '',
    '  portal surface.root root "#root" layer surface',
    '',
    '  resource transient.preview owner surface.demo.shell {',
    '    source selector missing.selector',
    '  }',
    '',
    '  datasource demo.sync from endpoint "/api/sync" {',
    '    method POST',
    '    result records',
    '  }',
    '',
    '  action demo.sync {',
    '    input id string',
    '    effect fetch',
    '  }',
    '',
    '  surface demo.shell kind window component x-shell {',
    '    portal missing.portal',
    '  }',
    '}',
    ''
  ].join('\n');
}

function openVNextInServer(rootDir, relativePath = VALID_VNEXT_FIXTURE) {
  const input = fixtureInput(relativePath, rootDir);
  const uri = pathToFileURL(input.filePath).href;
  const server = createRmtLanguageServer({ rootDir });

  server.handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { rootPath: rootDir }
  });
  const notifications = server.handleMessage({
    jsonrpc: '2.0',
    method: 'textDocument/didOpen',
    params: {
      textDocument: {
        uri,
        languageId: 'rmt',
        version: 1,
        text: input.text
      }
    }
  });

  return {
    server,
    uri,
    input,
    notifications,
    analysis: server.analyzeDocument(uri)
  };
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = readJson('package.json', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtVNextTooling;
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const epic = readText(EPIC_15_PATH, rootDir);
  const contract = readText(TOOLING_CONTRACT_PATH, rootDir);
  const workpackage = readText(WP_E15_15_PATH, rootDir);

  context.assert(metadata && metadata.schema === RMT_VNEXT_TOOLING_SCHEMA, 'package metadata declares vNext tooling schema');
  context.assert(metadata && metadata.reportSchema === RMT_VNEXT_TOOLING_REPORT_SCHEMA, 'package metadata declares vNext tooling report schema');
  context.assert(metadata && metadata.formatterSchema === RMT_VNEXT_TOOLING_FORMATTER_SCHEMA, 'package metadata declares vNext formatter schema');
  context.assert(metadata && metadata.workpackage === RMT_VNEXT_TOOLING_WORKPACKAGE, 'package metadata points to WP-E15-15');
  context.assert(metadata && metadata.module === RMT_VNEXT_TOOLING_MODULE_PATH, 'package metadata points to vNext tooling module');
  context.assert(metadata && metadata.suite === RMT_VNEXT_TOOLING_SUITE_PATH, 'package metadata points to vNext tooling suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-vnext-tooling --json', 'package metadata declares vNext tooling local gate');
  context.assert(metadata && metadata.packageScript === RMT_VNEXT_TOOLING_PACKAGE_SCRIPT, 'package metadata declares vNext tooling package script');
  context.assert((typeof packageManifest.exports['./rmt-language/vnext-tooling'] === 'string' ? packageManifest.exports['./rmt-language/vnext-tooling'] : packageManifest.exports['./rmt-language/vnext-tooling'] && packageManifest.exports['./rmt-language/vnext-tooling'].default) === './tools/rmt-language/vnext-tooling.js', 'package exports vNext tooling adapter');
  context.assert(packageManifest.scripts['test:rmt-vnext-tooling'] === 'node scripts/run_xtend_tests.js rmt-vnext-tooling', 'package exposes vNext tooling script');
  context.assert(runner.includes("id: 'rmt-vnext-tooling'"), 'test runner exposes rmt-vnext-tooling suite');
  context.assert(epic.includes('| `WP-E15-15` | P1 | completed | WS5 |'), 'Epic marks WP-E15-15 completed');
  context.assert(epic.includes('| `WP-E15-16` | P2 | completed | WS5 |'), 'Epic keeps WP-E15-16 completed after tooling');
  context.assert(contract.includes('schema: "xtend.rmt.vnext-tooling-adapter.v1"'), 'Tooling contract document declares schema');
  context.assert(workpackage.includes('vNext-faehige RMT-Language-Schicht'), 'Workpackage documents vNext language layer');
}

function runLinterAndCliChecks(context, rootDir) {
  const valid = fixtureInput(VALID_VNEXT_FIXTURE, rootDir);
  const invalid = fixtureInput(INVALID_VNEXT_FIXTURE, rootDir);
  const legacy = fixtureInput(LEGACY_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextToolingSource(valid, { rootDir });
  const directReport = lintRmtVNextToolingSource(valid, { rootDir, analysis });
  const routedReport = lintRmtSource(valid, { rootDir });
  const invalidReport = lintRmtSource(invalid, { rootDir });
  const legacyReport = lintRmtSource(legacy, { rootDir });
  const stdout = createMemoryStream();
  const stderr = createMemoryStream();
  const exitCode = runRmtLinterCli(['lint', VALID_VNEXT_FIXTURE, '--json'], {
    stdout,
    stderr,
    rootDir
  });
  const cliReport = JSON.parse(stdout.toString());

  context.assert(isLikelyRmtVNextSource(valid) === true, 'vNext detector recognizes native fixture');
  context.assert(isLikelyRmtVNextSource(legacy) === false, 'vNext detector leaves legacy JSON fixture alone');
  context.assert(analysis.schema === RMT_VNEXT_TOOLING_SCHEMA, 'vNext analysis emits tooling schema');
  context.assert(analysis.ok === true && analysis.graphStatus === 'indexed', 'vNext analysis indexes valid fixture');
  context.assert(analysis.sourceMapSummary.totalCount > 20, 'vNext analysis exposes source map summary');
  context.assert(directReport.status === 'passed' && directReport.languageMode === 'vnext', 'direct vNext linter passes valid fixture');
  context.assert(routedReport.status === 'passed' && routedReport.languageMode === 'vnext', 'generic linter routes vNext fixture');
  context.assert(invalidReport.status === 'failed' && invalidReport.languageMode === 'vnext', 'generic linter routes invalid vNext fixture');
  context.assert(invalidReport.diagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.syntax.error'), 'invalid vNext fixture emits vNext syntax diagnostic');
  context.assert(legacyReport.status === 'passed' && legacyReport.graphStatus === 'indexed', 'legacy fixture remains on indexed legacy graph path');
  context.assert(exitCode === 0, 'CLI accepts valid vNext fixture');
  context.assert(stderr.toString() === '', 'CLI vNext JSON mode keeps stderr empty');
  context.assert(cliReport.files === 1 && cliReport.status === 'passed', 'CLI emits one-file vNext pass report');
}

function runProviderChecks(context, rootDir) {
  const input = fixtureInput(VALID_VNEXT_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextToolingSource(input, { rootDir });
  const operationPointer = '/operations/2';
  const sourcePointer = '/operations/2/source/ref';
  const sourceRange = analysis.sourceMap.find((entry) => entry.corePointer === operationPointer).range;
  const completions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/operations/2/source'
  });
  const keywordCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    context: 'vnext-keywords'
  });
  const hover = getRmtVNextToolingHover(input, {
    rootDir,
    analysis,
    pointer: operationPointer
  });
  const symbols = getRmtVNextToolingDocumentSymbols(input, {
    rootDir,
    analysis
  });
  const definition = getRmtVNextToolingDefinition(input, {
    rootDir,
    analysis,
    pointer: sourcePointer
  });

  context.assert(analysis.findPointerAtPosition({ line: sourceRange.start.line, character: sourceRange.start.character + 2 }) === operationPointer, 'vNext source map maps position to operation pointer');
  context.assert(completions.items.some((item) => item.label === 'sse'), 'vNext completion exposes source kinds');
  context.assert(keywordCompletions.items.some((item) => item.label === 'stream'), 'vNext completion exposes stream keyword');
  context.assert(hover.status === 'found' && hover.hover.markdown.includes('stream hero-fragments'), 'vNext hover explains stream operation');
  context.assert(symbols.symbols.some((symbol) => symbol.name === 'operations'), 'vNext document symbols expose operations namespace');
  context.assert(symbols.symbols.some((symbol) => symbol.children.some((child) => child.name === 'hero-fragments')), 'vNext document symbols include stream target');
  context.assert(definition.status === 'resolved' && definition.target.domain === 'dataSources', 'vNext definition resolves operation source to data source');
}

function runPrimitiveAuthoringChecks(context, rootDir) {
  const input = fixtureInput(PRIMITIVE_VNEXT_FIXTURE, rootDir);
  const validationInput = fixtureInput(VALIDATION_VNEXT_FIXTURE, rootDir);
  const transitionInput = fixtureInput(TRANSITION_VNEXT_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextToolingSource(input, { rootDir });
  const validationAnalysis = analyzeRmtVNextToolingSource(validationInput, { rootDir });
  const transitionAnalysis = analyzeRmtVNextToolingSource(transitionInput, { rootDir });
  const primitiveKeywordCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    context: 'vnext-primitive-keywords'
  });
  const validationCompletions = getRmtVNextToolingCompletions(validationInput, {
    rootDir,
    analysis: validationAnalysis,
    pointer: '/validations/0'
  });
  const validationRuleCompletions = getRmtVNextToolingCompletions(validationInput, {
    rootDir,
    analysis: validationAnalysis,
    context: 'vnext-validation-rules'
  });
  const transitionCompletions = getRmtVNextToolingCompletions(transitionInput, {
    rootDir,
    analysis: transitionAnalysis,
    pointer: '/transitions/0'
  });
  const transitionEffectCompletions = getRmtVNextToolingCompletions(transitionInput, {
    rootDir,
    analysis: transitionAnalysis,
    context: 'vnext-transition-effects'
  });
  const stateCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/states/0'
  });
  const actionCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/actions/0'
  });
  const surfaceCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/surfaces/1'
  });
  const resourceCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/resources/0'
  });
  const overlayCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    pointer: '/overlays/0'
  });
  const cursorStateCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    position: positionAfter(input, 'state media.filters type object preserve {')
  });
  const cursorResourceKindCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    position: positionAfter(input, 'resource lightbox.import kind ')
  });
  const cursorActionPartialCompletions = getRmtVNextToolingCompletions(input, {
    rootDir,
    analysis,
    position: positionAfter(input, '    red')
  });
  const stateHover = getRmtVNextToolingHover(input, {
    rootDir,
    analysis,
    pointer: '/states/0'
  });
  const actionHover = getRmtVNextToolingHover(input, {
    rootDir,
    analysis,
    pointer: '/actions/0'
  });
  const resourceHover = getRmtVNextToolingHover(input, {
    rootDir,
    analysis,
    pointer: '/resources/0'
  });
  const symbols = getRmtVNextToolingDocumentSymbols(input, {
    rootDir,
    analysis
  });
  const validationSymbols = getRmtVNextToolingDocumentSymbols(validationInput, {
    rootDir,
    analysis: validationAnalysis
  });
  const transitionSymbols = getRmtVNextToolingDocumentSymbols(transitionInput, {
    rootDir,
    analysis: transitionAnalysis
  });
  const symbolNamespaces = symbols.symbols.map((symbol) => symbol.name);
  const validationNamespaces = validationSymbols.symbols.map((symbol) => symbol.name);
  const transitionNamespaces = transitionSymbols.symbols.map((symbol) => symbol.name);

  context.assert(RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE === 'RMT-VNEXT-PRIM-07', 'vNext tooling exports PRIM-07 authoring workpackage marker');
  context.assert(analysis.ok === true && analysis.coreDocument.states.length === 3, 'primitive vNext fixture is indexed for authoring');
  context.assert(validationAnalysis.ok === true && validationAnalysis.coreDocument.validations.length >= 1, 'validation vNext fixture indexes validation records');
  context.assert(transitionAnalysis.ok === true && transitionAnalysis.coreDocument.transitions.length >= 1, 'transition vNext fixture indexes transition records');
  context.assert(isLikelyRmtVNextSource(validationInput) === true, 'vNext detector recognizes validation primitive source');
  context.assert(isLikelyRmtVNextSource(transitionInput) === true, 'vNext detector recognizes transition primitive source');
  context.assert(analysis.sourceMapSummary.byNodeType.RmtStateDeclaration >= 3, 'primitive authoring source map exposes state declarations');
  context.assert(analysis.sourceMapSummary.byNodeType.RmtSurfaceDeclaration >= 2, 'primitive authoring source map exposes surface declarations');
  context.assert(primitiveKeywordCompletions.items.some((item) => item.label === 'state'), 'primitive completion exposes state keyword');
  context.assert(primitiveKeywordCompletions.items.some((item) => item.label === 'selector'), 'primitive completion exposes selector keyword');
  context.assert(primitiveKeywordCompletions.items.some((item) => item.label === 'resource'), 'primitive completion exposes resource keyword');
  context.assert(primitiveKeywordCompletions.items.some((item) => item.label === 'validation'), 'primitive completion exposes validation keyword');
  context.assert(primitiveKeywordCompletions.items.some((item) => item.label === 'transition'), 'primitive completion exposes transition keyword');
  context.assert(validationCompletions.context === 'vnext-primitive-validation-clauses' && validationCompletions.items.some((item) => item.label === 'target action'), 'validation pointer exposes action gate completion');
  context.assert(validationRuleCompletions.items.some((item) => item.label === 'email'), 'validation rules expose email completion');
  context.assert(transitionCompletions.context === 'vnext-primitive-transition-clauses' && transitionCompletions.items.some((item) => item.label === 'durationMs'), 'transition pointer exposes durationMs completion');
  context.assert(transitionEffectCompletions.items.some((item) => item.label === 'crossfade'), 'transition effect completion exposes crossfade');
  context.assert(stateCompletions.context === 'vnext-primitive-state-clauses' && stateCompletions.items.some((item) => item.label === 'initial'), 'state pointer infers primitive state completions');
  context.assert(actionCompletions.items.some((item) => item.label === 'effect fetch datasource'), 'action pointer exposes effect completion');
  context.assert(surfaceCompletions.items.some((item) => item.label === 'destroy releases resource'), 'surface pointer exposes lifecycle resource completion');
  context.assert(resourceCompletions.items.some((item) => item.label === 'lazy-import'), 'resource pointer exposes lazy-import resource kind');
  context.assert(overlayCompletions.items.some((item) => item.label === 'toast'), 'overlay pointer exposes toast overlay kind');
  context.assert(cursorStateCompletions.context === 'vnext-primitive-state-clauses' && cursorStateCompletions.items.some((item) => item.label === 'initial'), 'cursor-near state line infers primitive state clauses');
  context.assert(cursorResourceKindCompletions.context === 'vnext-primitive-resource-kinds' && cursorResourceKindCompletions.items.some((item) => item.label === 'lazy-import'), 'cursor-near resource kind infers resource kind enum');
  context.assert(cursorActionPartialCompletions.context === 'vnext-primitive-action-clauses' && cursorActionPartialCompletions.prefix === 'red' && cursorActionPartialCompletions.items.some((item) => item.label === 'reduce'), 'cursor-near action partial word filters action clauses');
  context.assert(stateHover.status === 'found' && stateHover.hover.markdown.includes('State: media.records'), 'primitive hover explains state declaration');
  context.assert(actionHover.status === 'found' && actionHover.hover.markdown.includes('Action: media.select'), 'primitive hover explains action declaration');
  context.assert(resourceHover.status === 'found' && resourceHover.hover.markdown.includes('Resource: lightbox.import'), 'primitive hover explains resource declaration');
  ['states', 'selectors', 'actions', 'portals', 'overlays', 'resources'].forEach((domain) => {
    context.assert(symbolNamespaces.includes(domain), `primitive document symbols expose ${domain} namespace`);
  });
  context.assert(validationNamespaces.includes('validations'), 'validation document symbols expose validations namespace');
  context.assert(validationSymbols.symbols.some((symbol) => symbol.children.some((child) => child.name === 'demo.validation.contact')), 'validation document symbols include validation group');
  context.assert(transitionNamespaces.includes('transitions'), 'transition document symbols expose transitions namespace');
  context.assert(transitionSymbols.symbols.some((symbol) => symbol.children.some((child) => child.name === 'demo.transitions.contactToIssue')), 'transition document symbols include transition record');
  context.assert(symbols.symbols.some((symbol) => symbol.children.some((child) => child.name === 'media.player')), 'primitive document symbols include visible media.player surface');
}

function runPrimitiveCodeActionChecks(context, rootDir) {
  const input = fixtureInput(PRIMITIVE_INVALID_VNEXT_FIXTURE, rootDir);
  const analysis = analyzeRmtVNextToolingSource(input, { rootDir });
  const authoringInput = {
    text: createPrimitiveAuthoringProblemFixture(),
    uri: 'file:///virtual/vnext-primitive-authoring-missing.rmt'
  };
  const authoringAnalysis = analyzeRmtVNextToolingSource(authoringInput, { rootDir });
  const report = getRmtVNextToolingCodeActions(input, {
    rootDir,
    analysis
  });
  const authoringReport = getRmtVNextToolingCodeActions(authoringInput, {
    rootDir,
    analysis: authoringAnalysis
  });
  const repeatReport = getRmtVNextToolingCodeActions(input, {
    rootDir,
    analysis
  });
  const ownerAction = report.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.owner-missing');
  const keyAction = report.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.unkeyed-repeat');
  const payloadAction = report.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.payload-contract-missing');
  const filteredReport = getRmtVNextToolingCodeActions(input, {
    rootDir,
    analysis,
    diagnostics: [{
      code: 'rmt.vnext.primitive.owner-missing',
      data: { pointer: ownerAction && ownerAction.pointer }
    }]
  });
  const ownerPatched = ownerAction ? applyWorkspaceEdit(input.text, ownerAction) : '';
  const keyPatched = keyAction ? applyWorkspaceEdit(input.text, keyAction) : '';
  const payloadPatched = payloadAction ? applyWorkspaceEdit(input.text, payloadAction) : '';
  const stateInitialAction = authoringReport.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.initial-missing');
  const resourceKindAction = authoringReport.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.resource-kind-missing');
  const selectorAction = authoringReport.actions.find((action) => action.title.includes('Selector "missing.selector"'));
  const portalAction = authoringReport.actions.find((action) => action.title.includes('Portal "missing.portal"'));
  const reducerAction = authoringReport.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.action-reducer-missing');
  const effectSourceAction = authoringReport.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.effect-source-missing');
  const kernelBoundaryAction = report.actions.find((action) => action.diagnosticCode === 'rmt.vnext.primitive.kernel-boundary');
  const fixAllAction = authoringReport.actions.find((action) => action.kind === RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND);
  const statePatched = stateInitialAction ? applyWorkspaceEdit(authoringInput.text, stateInitialAction) : '';
  const kindPatched = resourceKindAction ? applyWorkspaceEdit(authoringInput.text, resourceKindAction) : '';
  const selectorPatched = selectorAction ? applyWorkspaceEdit(authoringInput.text, selectorAction) : '';
  const portalPatched = portalAction ? applyWorkspaceEdit(authoringInput.text, portalAction) : '';
  const reducerPatched = reducerAction ? applyWorkspaceEdit(authoringInput.text, reducerAction) : '';
  const effectPatched = effectSourceAction ? applyWorkspaceEdit(authoringInput.text, effectSourceAction) : '';
  const fixAllPatched = fixAllAction ? applyWorkspaceEdit(authoringInput.text, fixAllAction) : '';
  const editActions = report.actions.concat(authoringReport.actions).filter((action) => action.edit);
  const quickFixActions = report.actions.concat(authoringReport.actions).filter((action) => action.kind === 'quickfix');
  const kernelBoundaryHandoff = kernelBoundaryAction && kernelBoundaryAction.command
    ? createRmtVNextPrimitiveCommandHandoff(kernelBoundaryAction.command, { rootDir })
    : null;

  context.assert(analysis.ok === false && analysis.compileResult.phase === 'semantic', 'invalid primitive fixture reaches semantic diagnostics for code actions');
  context.assert(authoringAnalysis.ok === false && authoringAnalysis.compileResult.phase === 'semantic', 'authoring problem fixture reaches semantic diagnostics for code actions');
  context.assert(report.schema === RMT_VNEXT_PRIMITIVE_CODE_ACTION_REPORT_SCHEMA, 'primitive code action report emits PRIM-07 report schema');
  context.assert(report.providerSchema === RMT_VNEXT_PRIMITIVE_CODE_ACTION_PROVIDER_SCHEMA, 'primitive code action report emits provider schema');
  context.assert(report.previewSchema === RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA, 'primitive code action report emits preview schema');
  context.assert(report.actionSchema === RMT_CODE_ACTION_SCHEMA, 'primitive code action report emits action schema');
  context.assert(report.editSchema === RMT_WORKSPACE_EDIT_SCHEMA, 'primitive code action report emits workspace edit schema');
  context.assert(report.workpackage === RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE, 'primitive code action report belongs to PRIM-07');
  context.assert(report.status === 'completed' && report.actionCount >= 3, 'primitive code action report completes with quick fixes');
  context.assert(quickFixActions.every((action) => action.kind === 'quickfix'), 'primitive individual code actions expose quickfix kind');
  context.assert(authoringReport.fixAllCount === 1 && fixAllAction && fixAllAction.kind === RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND, 'primitive code action report exposes safe fix-all source action');
  context.assert(authoringReport.previewCount === authoringReport.actionCount, 'primitive code action report attaches previews to every action');
  context.assert(editActions.every((action) => action.safe === true), 'primitive edit code actions are marked safe');
  context.assert(JSON.stringify(report.actions) === JSON.stringify(repeatReport.actions), 'primitive code actions are deterministic');
  context.assert(ownerAction && ownerAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'owner-missing diagnostic creates workspace edit');
  context.assert(keyAction && keyAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'unkeyed-repeat diagnostic creates workspace edit');
  context.assert(payloadAction && payloadAction.edit.schema === RMT_WORKSPACE_EDIT_SCHEMA, 'payload-contract diagnostic creates workspace edit');
  context.assert(ownerAction && ownerAction.preview && ownerAction.preview.schema === RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA, 'owner quick fix exposes preview');
  context.assert(ownerAction && ownerAction.preview.after.some((line) => line.includes('owner surface.demo.card')), 'owner quick fix preview shows inserted owner');
  context.assert(ownerPatched.includes('resource orphan.objectUrl kind object-url owner surface.demo.card {'), 'owner quick fix inserts nearest safe surface owner');
  context.assert(keyPatched.includes('    key instance.id'), 'surface repeat quick fix inserts stable key clause');
  context.assert(payloadPatched.includes('      payload id from target.dataset.id'), 'event payload quick fix inserts payload contract block');
  context.assert(stateInitialAction && statePatched.includes('state demo.blank type object preserve {\n    initial {}\n  }'), 'state initial quick fix inserts initial block');
  context.assert(resourceKindAction && kindPatched.includes('resource transient.preview kind object-url owner surface.demo.shell'), 'resource kind quick fix inserts safe default kind');
  context.assert(selectorAction && selectorPatched.includes('selector missing.selector from state demo.blank'), 'unknown selector quick fix inserts selector stub');
  context.assert(portalAction && portalPatched.includes('portal missing.portal root "#missing-portal" layer surface'), 'unknown portal quick fix inserts portal stub');
  context.assert(reducerAction && reducerPatched.includes('    reduce state.demo.blank = input.id'), 'action reducer quick fix inserts state reducer target');
  context.assert(effectSourceAction && effectPatched.includes('    effect fetch datasource demo.sync'), 'effect source quick fix inserts datasource source');
  context.assert(kernelBoundaryAction && !kernelBoundaryAction.edit && kernelBoundaryAction.safe === false, 'kernel boundary diagnostic exposes manual command action');
  context.assert(kernelBoundaryAction && kernelBoundaryAction.preview.status === 'manual-command', 'kernel boundary diagnostic exposes manual command preview');
  context.assert(kernelBoundaryAction && kernelBoundaryAction.command.command === RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND, 'kernel boundary command uses stable command id');
  context.assert(kernelBoundaryHandoff && kernelBoundaryHandoff.schema === RMT_VNEXT_PRIMITIVE_COMMAND_HANDOFF_SCHEMA, 'kernel boundary command creates stable handoff report');
  context.assert(kernelBoundaryHandoff && kernelBoundaryHandoff.status === 'manual_handoff' && kernelBoundaryHandoff.edit === null, 'kernel boundary handoff remains manual without workspace edit');
  context.assert(kernelBoundaryHandoff && kernelBoundaryHandoff.boundary === 'no-kernel-fabric-imports-in-vnext-source', 'kernel boundary handoff preserves host-neutral boundary');
  context.assert(fixAllAction && fixAllAction.edit.metadata.actionCount >= 6, 'fix-all action records aggregated safe edit count');
  context.assert(fixAllAction && fixAllAction.preview.changedLineCount >= 6, 'fix-all action exposes multi-edit preview');
  context.assert(fixAllPatched.includes('state demo.blank type object preserve {\n    initial {}\n  }'), 'fix-all action applies state initial edit');
  context.assert(fixAllPatched.includes('resource transient.preview kind object-url owner surface.demo.shell'), 'fix-all action applies resource kind edit');
  context.assert(fixAllPatched.includes('selector missing.selector from state demo.blank'), 'fix-all action applies selector stub edit');
  context.assert(fixAllPatched.includes('portal missing.portal root "#missing-portal" layer surface'), 'fix-all action applies portal stub edit');
  context.assert(fixAllPatched.includes('    reduce state.demo.blank = input.id'), 'fix-all action applies reducer edit');
  context.assert(fixAllPatched.includes('    effect fetch datasource demo.sync'), 'fix-all action applies effect source edit');
  context.assert(filteredReport.actionCount === 1 && filteredReport.actions[0].diagnosticCode === 'rmt.vnext.primitive.owner-missing', 'primitive code actions filter by LSP diagnostic context');
}

function runLanguageServerChecks(context, rootDir) {
  const initialized = createRmtLanguageServer({ rootDir }).handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { rootPath: rootDir }
  })[0].result;
  const opened = openVNextInServer(rootDir);
  const operationRange = opened.analysis.graph.sourceMap.find((entry) => entry.corePointer === '/operations/2').range;
  const position = {
    line: operationRange.start.line,
    character: operationRange.start.character + 2
  };
  const completion = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'textDocument/completion',
    params: {
      textDocument: { uri: opened.uri },
      position,
      xtend: { pointer: '/operations/2/source' }
    }
  })[0].result;
  const hover = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 3,
    method: 'textDocument/hover',
    params: {
      textDocument: { uri: opened.uri },
      position
    }
  })[0].result;
  const symbols = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 4,
    method: 'textDocument/documentSymbol',
    params: {
      textDocument: { uri: opened.uri }
    }
  })[0].result;
  const definition = opened.server.handleMessage({
    jsonrpc: '2.0',
    id: 5,
    method: 'textDocument/definition',
    params: {
      textDocument: { uri: opened.uri },
      position,
      xtend: { pointer: '/operations/2/source/ref' }
    }
  })[0].result;

  context.assert(opened.notifications[0].params.diagnostics.length === 0, 'LSP publishes no diagnostics for valid vNext fixture');
  context.assert(opened.analysis.languageMode === 'vnext', 'LSP analysis marks vNext language mode');
  context.assert(completion.items.some((item) => item.label === 'worker'), 'LSP completion maps vNext source kind');
  context.assert(hover.contents.value.includes('Operation: hero-fragments'), 'LSP hover maps vNext operation hover');
  context.assert(symbols.some((symbol) => symbol.name === 'operations'), 'LSP document symbols map vNext operations');
  context.assert(definition && definition.range.start.line >= 0, 'LSP definition maps vNext data source location');

  const primitiveOpened = openVNextInServer(rootDir, PRIMITIVE_VNEXT_FIXTURE);
  const primitiveCompletion = primitiveOpened.server.handleMessage({
    jsonrpc: '2.0',
    id: 6,
    method: 'textDocument/completion',
    params: {
      textDocument: { uri: primitiveOpened.uri },
      position: { line: 6, character: 4 },
      xtend: { context: 'vnext-primitive-keywords' }
    }
  })[0].result;
  const primitiveStateCompletion = primitiveOpened.server.handleMessage({
    jsonrpc: '2.0',
    id: 9,
    method: 'textDocument/completion',
    params: {
      textDocument: { uri: primitiveOpened.uri },
      position: positionAfter(primitiveOpened.input, 'state media.filters type object preserve {')
    }
  })[0].result;
  const primitiveResourceKindCompletion = primitiveOpened.server.handleMessage({
    jsonrpc: '2.0',
    id: 10,
    method: 'textDocument/completion',
    params: {
      textDocument: { uri: primitiveOpened.uri },
      position: positionAfter(primitiveOpened.input, 'resource lightbox.import kind ')
    }
  })[0].result;
  const primitiveHover = primitiveOpened.server.handleMessage({
    jsonrpc: '2.0',
    id: 7,
    method: 'textDocument/hover',
    params: {
      textDocument: { uri: primitiveOpened.uri },
      position: { line: 47, character: 4 },
      xtend: { pointer: '/actions/0' }
    }
  })[0].result;
  const primitiveSymbols = primitiveOpened.server.handleMessage({
    jsonrpc: '2.0',
    id: 8,
    method: 'textDocument/documentSymbol',
    params: {
      textDocument: { uri: primitiveOpened.uri }
    }
  })[0].result;
  const primitiveInvalidOpened = openVNextInServer(rootDir, PRIMITIVE_INVALID_VNEXT_FIXTURE);
  const primitiveInvalidDiagnostics = primitiveInvalidOpened.notifications[0].params.diagnostics;
  const primitiveCodeActions = primitiveInvalidOpened.server.handleMessage({
    jsonrpc: '2.0',
    id: 11,
    method: 'textDocument/codeAction',
    params: {
      textDocument: { uri: primitiveInvalidOpened.uri },
      range: primitiveInvalidDiagnostics[0].range,
      context: {
        diagnostics: primitiveInvalidDiagnostics
      }
    }
  })[0].result;
  const primitiveKernelCommand = primitiveCodeActions.find((action) => action.command && action.command.command === RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND);
  const primitiveKernelHandoff = primitiveInvalidOpened.server.handleMessage({
    jsonrpc: '2.0',
    id: 12,
    method: 'workspace/executeCommand',
    params: {
      command: RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND,
      arguments: primitiveKernelCommand && primitiveKernelCommand.command
        ? primitiveKernelCommand.command.arguments
        : []
    }
  })[0].result;

  context.assert(initialized.capabilities.executeCommandProvider.commands.includes(RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND), 'LSP advertises primitive kernel boundary executeCommand');
  context.assert(primitiveCompletion.items.some((item) => item.label === 'state'), 'LSP completion maps primitive keyword catalog');
  context.assert(primitiveStateCompletion.items.some((item) => item.label === 'initial'), 'LSP infers primitive state clause completion from cursor position');
  context.assert(primitiveResourceKindCompletion.items.some((item) => item.label === 'lazy-import'), 'LSP infers primitive resource kind completion from cursor position');
  context.assert(primitiveHover.contents.value.includes('Action: media.select'), 'LSP hover maps primitive action hover');
  context.assert(primitiveSymbols.some((symbol) => symbol.name === 'states'), 'LSP document symbols map primitive state namespace');
  context.assert(primitiveInvalidDiagnostics.some((diagnostic) => diagnostic.code === 'rmt.vnext.primitive.owner-missing'), 'LSP publishes primitive owner diagnostic');
  context.assert(primitiveCodeActions.some((action) => action.title.includes('Resource owner')), 'LSP maps primitive owner quick fix');
  context.assert(primitiveCodeActions.some((action) => action.title.includes('key-Klausel')), 'LSP maps primitive key quick fix');
  context.assert(primitiveCodeActions.some((action) => action.title.includes('Payload Contract')), 'LSP maps primitive payload quick fix');
  context.assert(primitiveCodeActions.some((action) => action.kind === RMT_VNEXT_PRIMITIVE_FIX_ALL_KIND), 'LSP maps primitive safe fix-all action');
  context.assert(primitiveCodeActions.some((action) => action.data && action.data.preview && action.data.preview.schema === RMT_VNEXT_PRIMITIVE_CODE_ACTION_PREVIEW_SCHEMA), 'LSP carries primitive code action previews in data');
  context.assert(primitiveKernelCommand && primitiveKernelCommand.command.command === RMT_VNEXT_PRIMITIVE_KERNEL_BOUNDARY_COMMAND, 'LSP maps primitive kernel boundary command action');
  context.assert(primitiveKernelHandoff.schema === RMT_VNEXT_PRIMITIVE_COMMAND_HANDOFF_SCHEMA, 'LSP executeCommand returns primitive command handoff schema');
  context.assert(primitiveKernelHandoff.status === 'manual_handoff' && primitiveKernelHandoff.edit === null, 'LSP executeCommand keeps kernel boundary handoff manual');
}

function runFormatterSnippetAndAgentChecks(context, rootDir) {
  const input = fixtureInput(VALID_VNEXT_FIXTURE, rootDir);
  const formatted = formatRmtVNextSource({
    ...input,
    text: `${input.text}  `
  }, {
    rootDir
  });
  const adapter = createRmtVNextToolingAdapter({ rootDir });
  const catalog = createRmtSnippetCatalog({ rootDir });
  const generatedSnippets = createVsCodeSnippetDocument({ rootDir });
  const staticSnippets = readJson('tools/rmt-language/snippets/rmt.code-snippets', rootDir);
  const packagedSnippets = readJson('tools/rmt-editor/vscode/snippets/rmt.code-snippets', rootDir);
  const agentReport = createRmtAgentRepairReportForFiles([resolveRepoPath(VALID_VNEXT_FIXTURE, rootDir)], {
    rootDir
  });

  context.assert(formatted.schema === RMT_VNEXT_TOOLING_FORMATTER_SCHEMA, 'formatter emits vNext formatter schema');
  context.assert(formatted.ok === true && formatted.changed === true, 'formatter normalizes trailing whitespace');
  context.assert(formatted.text.endsWith('\n') && !formatted.text.endsWith('  \n'), 'formatter keeps final newline without trailing blanks');
  context.assert(adapter.schema === RMT_VNEXT_TOOLING_SCHEMA, 'tooling adapter factory exposes schema');
  context.assert(adapter.lint(input).status === 'passed', 'tooling adapter factory can lint');
  context.assert(VNEXT_SNIPPETS.length >= 3, 'vNext tooling exports snippet patterns');
  context.assert(VNEXT_SNIPPETS.some((snippet) => snippet.id === 'rmt-vnext-primitive-shell'), 'vNext tooling exports primitive shell snippet');
  context.assert(VNEXT_SNIPPETS.some((snippet) => snippet.id === 'rmt-vnext-validation'), 'vNext tooling exports validation snippet');
  context.assert(VNEXT_SNIPPETS.some((snippet) => snippet.id === 'rmt-vnext-transition'), 'vNext tooling exports transition snippet');
  context.assert(VNEXT_SNIPPETS.some((snippet) => snippet.id === 'rmt-vnext-maraca-orchestration-app'), 'vNext tooling exports Maraca orchestration app snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-template'), 'snippet catalog includes vNext template snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-primitive-shell'), 'snippet catalog includes vNext primitive shell snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-validation'), 'snippet catalog includes vNext validation snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-transition'), 'snippet catalog includes vNext transition snippet');
  context.assert(catalog.snippets.some((snippet) => snippet.id === 'rmt-vnext-maraca-orchestration-app'), 'snippet catalog includes Maraca orchestration app snippet');
  context.assert(generatedSnippets['RMT vNext Stream'].prefix === 'rmt-vnext-stream', 'generated VS Code snippets include vNext stream prefix');
  context.assert(generatedSnippets['RMT vNext Primitive Shell'].prefix === 'rmt-vnext-primitive-shell', 'generated VS Code snippets include vNext primitive shell prefix');
  context.assert(generatedSnippets['RMT vNext Validation'].prefix === 'rmt-vnext-validation', 'generated VS Code snippets include vNext validation prefix');
  context.assert(generatedSnippets['RMT vNext Surface Transition'].prefix === 'rmt-vnext-transition', 'generated VS Code snippets include vNext transition prefix');
  context.assert(generatedSnippets['RMT vNext Maraca Orchestration App'].prefix === 'rmt-vnext-maraca-orchestration-app', 'generated VS Code snippets include Maraca orchestration app prefix');
  context.assert(staticSnippets['RMT vNext Stream'].prefix === generatedSnippets['RMT vNext Stream'].prefix, 'static source snippets include vNext stream prefix');
  context.assert(staticSnippets['RMT vNext Primitive Shell'].prefix === generatedSnippets['RMT vNext Primitive Shell'].prefix, 'static source snippets include vNext primitive shell prefix');
  context.assert(staticSnippets['RMT vNext Validation'].prefix === generatedSnippets['RMT vNext Validation'].prefix, 'static source snippets include vNext validation prefix');
  context.assert(staticSnippets['RMT vNext Surface Transition'].prefix === generatedSnippets['RMT vNext Surface Transition'].prefix, 'static source snippets include vNext transition prefix');
  context.assert(staticSnippets['RMT vNext Maraca Orchestration App'].prefix === generatedSnippets['RMT vNext Maraca Orchestration App'].prefix, 'static source snippets include Maraca orchestration app prefix');
  context.assert(packagedSnippets['RMT vNext Stream'].prefix === generatedSnippets['RMT vNext Stream'].prefix, 'packaged VS Code snippets include vNext stream prefix');
  context.assert(packagedSnippets['RMT vNext Primitive Shell'].prefix === generatedSnippets['RMT vNext Primitive Shell'].prefix, 'packaged VS Code snippets include vNext primitive shell prefix');
  context.assert(packagedSnippets['RMT vNext Validation'].prefix === generatedSnippets['RMT vNext Validation'].prefix, 'packaged VS Code snippets include vNext validation prefix');
  context.assert(packagedSnippets['RMT vNext Surface Transition'].prefix === generatedSnippets['RMT vNext Surface Transition'].prefix, 'packaged VS Code snippets include vNext transition prefix');
  context.assert(packagedSnippets['RMT vNext Maraca Orchestration App'].prefix === generatedSnippets['RMT vNext Maraca Orchestration App'].prefix, 'packaged VS Code snippets include Maraca orchestration app prefix');
  context.assert(agentReport.fileReports[0].languageMode === 'vnext', 'agent report marks vNext language mode');
  context.assert(agentReport.fileReports[0].sourceMapSummary.totalCount > 20, 'agent report exposes vNext source map summary');
}

function runPrimitiveAuthoringDocChecks(context, rootDir) {
  const publicDocs = PUBLIC_TOOLING_DOC_PATHS.map((docPath) => readText(docPath, rootDir)).join('\n');
  const contract = readText(TOOLING_CONTRACT_PATH, rootDir);
  const semanticSource = readText(SEMANTIC_GRAPH_SOURCE_PATH, rootDir);
  const toolingSource = readText(RMT_VNEXT_TOOLING_MODULE_PATH, rootDir);
  const languageServerSource = readText('tools/rmt-language-server/server.js', rootDir);
  const vscodeExtensionSource = readText(VSCODE_EXTENSION_SOURCE_PATH, rootDir);

  context.assert(RMT_VNEXT_PRIMITIVE_AUTHORING_WORKPACKAGE === 'RMT-VNEXT-PRIM-07', 'primitive tooling source keeps PRIM-07 ownership');
  context.assert(publicDocs.includes('xt rmt lint app.rmt'), 'public tooling docs cover the RMT linter command');
  context.assert(publicDocs.includes('node tools/rmt-language-server/server.js'), 'public tooling docs cover the RMT language server command');
  context.assert(publicDocs.includes('Completion') || publicDocs.includes('completion'), 'public tooling docs cover completion');
  context.assert(publicDocs.includes('Hover') || publicDocs.includes('hover'), 'public tooling docs cover hover');
  context.assert(publicDocs.includes('Code Actions'), 'public tooling docs cover code actions');
  context.assert(contract.includes('Document Symbols'), 'tooling contract covers document symbols');
  context.assert(semanticSource.includes('rmt.vnext.primitive.initial-missing'), 'semantic graph source records initial diagnostic');
  context.assert(semanticSource.includes('rmt.vnext.primitive.resource-kind-missing'), 'semantic graph source records resource kind diagnostic');
  context.assert(semanticSource.includes('rmt.vnext.primitive.action-reducer-missing'), 'semantic graph source records action reducer diagnostic');
  context.assert(semanticSource.includes('rmt.vnext.primitive.effect-source-missing'), 'semantic graph source records effect source diagnostic');
  context.assert(toolingSource.includes('source.fixAll.rmt.vnext.primitives'), 'tooling source exposes safe primitive fix-all action');
  context.assert(toolingSource.includes('xtend.rmt.vnext.primitive-command-handoff.v1'), 'tooling source records command handoff schema');
  context.assert(languageServerSource.includes('source.fixAll.rmt.vnext.primitives'), 'language server exposes primitive fix-all capability');
  context.assert(vscodeExtensionSource.includes('xtend.rmt.editor.vscode-primitive-authoring-experience.v1'), 'VS Code bridge source records primitive authoring experience schema');
}

function runRmtVNextToolingSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-vnext-tooling',
    label: 'Epic 15 RMT vNext Tooling Adapter'
  });
  const moduleSyntax = syntaxCheckFile(RMT_VNEXT_TOOLING_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_VNEXT_TOOLING_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_VNEXT_TOOLING_MODULE_PATH, rootDir, 'vNext tooling module exists');
  assertFileExists(context, RMT_VNEXT_TOOLING_SUITE_PATH, rootDir, 'vNext tooling suite exists');
  assertFileExists(context, WP_E15_15_PATH, rootDir, 'WP-E15-15 workpackage document exists');
  assertFileExists(context, TOOLING_CONTRACT_PATH, rootDir, 'vNext tooling contract document exists');
  assertFileExists(context, VALID_VNEXT_FIXTURE, rootDir, 'vNext tooling valid fixture exists');
  assertFileExists(context, PRIMITIVE_VNEXT_FIXTURE, rootDir, 'vNext primitive authoring fixture exists');
  assertFileExists(context, VALIDATION_VNEXT_FIXTURE, rootDir, 'vNext validation fixture exists');
  assertFileExists(context, TRANSITION_VNEXT_FIXTURE, rootDir, 'vNext transition fixture exists');
  assertFileExists(context, PRIMITIVE_INVALID_VNEXT_FIXTURE, rootDir, 'vNext primitive invalid authoring fixture exists');
  PUBLIC_TOOLING_DOC_PATHS.forEach((docPath) => {
    assertFileExists(context, docPath, rootDir, `${docPath} exists as public tooling documentation`);
  });
  assertFileExists(context, SEMANTIC_GRAPH_SOURCE_PATH, rootDir, 'vNext primitive semantic graph source exists');
  assertFileExists(context, VSCODE_EXTENSION_SOURCE_PATH, rootDir, 'VS Code primitive bridge source exists');
  context.assert(moduleSyntax.ok, `vNext tooling module syntax passes${moduleSyntax.ok ? '' : ` (${moduleSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `vNext tooling suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runLinterAndCliChecks(context, rootDir);
  runProviderChecks(context, rootDir);
  runPrimitiveAuthoringChecks(context, rootDir);
  runPrimitiveCodeActionChecks(context, rootDir);
  runLanguageServerChecks(context, rootDir);
  runFormatterSnippetAndAgentChecks(context, rootDir);
  runPrimitiveAuthoringDocChecks(context, rootDir);

  return context.result({
    schema: RMT_VNEXT_TOOLING_REPORT_SCHEMA,
    toolingSchema: RMT_VNEXT_TOOLING_SCHEMA,
    formatterSchema: RMT_VNEXT_TOOLING_FORMATTER_SCHEMA,
    workpackage: RMT_VNEXT_TOOLING_WORKPACKAGE,
    module: RMT_VNEXT_TOOLING_MODULE_PATH,
    suite: RMT_VNEXT_TOOLING_SUITE_PATH
  });
}

function printRmtVNextToolingReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 15 RMT vNext Tooling Adapter erfolgreich.',
    failureTitle: 'Epic 15 RMT vNext Tooling Adapter fehlgeschlagen:'
  });
}

module.exports = {
  printRmtVNextToolingReport,
  runRmtVNextToolingSuite
};

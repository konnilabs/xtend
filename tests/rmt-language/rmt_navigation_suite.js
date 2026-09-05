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
  RMT_DEFINITION_MODULE_PATH,
  RMT_DEFINITION_PACKAGE_SCRIPT,
  RMT_DEFINITION_PROVIDER_SCHEMA,
  RMT_DEFINITION_REPORT_SCHEMA,
  RMT_DEFINITION_SUITE_PATH,
  RMT_DEFINITION_TARGET_SCHEMA,
  RMT_DEFINITION_WORKPACKAGE,
  createRmtDefinitionProvider,
  getRmtDefinition
} = require('../../tools/rmt-language/definitions');
const {
  RMT_DOCUMENT_SYMBOLS_MODULE_PATH,
  RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
  RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
  RMT_DOCUMENT_SYMBOLS_SCHEMA,
  RMT_DOCUMENT_SYMBOLS_WORKPACKAGE,
  createRmtDocumentSymbolsProvider,
  getRmtDocumentSymbols
} = require('../../tools/rmt-language/symbols');
const {
  RMT_HOVER_MODULE_PATH,
  RMT_HOVER_PROVIDER_SCHEMA,
  RMT_HOVER_REPORT_SCHEMA,
  RMT_HOVER_SCHEMA,
  RMT_HOVER_WORKPACKAGE,
  createRmtHoverProvider,
  getRmtHover
} = require('../../tools/rmt-language/hover');

const EPIC_14_PATH = 'development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md';
const TOOLING_ARCHITECTURE_PATH = 'development/XTendRMT-DSL-Tooling-Architektur.md';
const RMT_NAVIGATION_WP_PATH = 'development/WP-E14-08-Hover-Document-Symbols-und-Definition-Provider-implementieren.md';
const VALID_FIXTURE_PATH = 'tests/fixtures/rmt-component-lab-pilot.core.json';

function assertFileExists(context, relativePath, rootDir, message) {
  context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), message);
}

function assertRange(context, range, message) {
  context.assert(
    range
      && range.start
      && range.end
      && Number.isInteger(range.start.line)
      && Number.isInteger(range.start.character)
      && Number.isInteger(range.end.line)
      && Number.isInteger(range.end.character),
    message
  );
}

function createInput(rootDir) {
  return {
    text: readText(VALID_FIXTURE_PATH, rootDir),
    filePath: resolveRepoPath(VALID_FIXTURE_PATH, rootDir),
    version: 8
  };
}

function createOrchestrationJsonInput() {
  return {
    text: JSON.stringify({
      kind: 'rmt_document',
      version: '1.0',
      validations: [{
        id: 'contact.validation',
        mode: 'blocking',
        fields: [{
          state: 'contact.email',
          rules: ['required', 'email'],
          message: 'Enter a valid email address.'
        }],
        targets: [{
          kind: 'action',
          id: 'contact.next'
        }]
      }],
      transitions: [{
        id: 'contact.to.issue',
        trigger: {
          kind: 'action',
          id: 'contact.next'
        },
        from: ['contact.email'],
        to: ['issue.details'],
        effect: 'crossfade',
        durationMs: 240,
        easing: 'ease-out',
        lane: 'transition'
      }]
    }, null, 2),
    uri: 'file:///virtual/rmt-orchestration-records.rmt',
    version: 9
  };
}

function findSymbol(symbols, name) {
  for (const symbol of symbols) {
    if (symbol.name === name) {
      return symbol;
    }

    const child = findSymbol(symbol.children || [], name);
    if (child) {
      return child;
    }
  }

  return null;
}

function assertDefinition(context, input, rootDir, pointer, domain, id, targetPointer, message) {
  const report = getRmtDefinition(input, {
    rootDir,
    pointer
  });

  context.assert(report.schema === RMT_DEFINITION_REPORT_SCHEMA, `${message}: report schema`);
  context.assert(report.providerSchema === RMT_DEFINITION_PROVIDER_SCHEMA, `${message}: provider schema`);
  context.assert(report.workpackage === RMT_DEFINITION_WORKPACKAGE, `${message}: workpackage`);
  context.assert(report.status === 'resolved', `${message}: resolves`);
  context.assert(report.target && report.target.schema === RMT_DEFINITION_TARGET_SCHEMA, `${message}: target schema`);
  context.assert(report.target && report.target.domain === domain, `${message}: target domain`);
  context.assert(report.target && report.target.id === id, `${message}: target id`);
  context.assert(report.target && report.target.pointer === targetPointer, `${message}: target pointer`);
  assertRange(context, report.target.range, `${message}: target range`);
}

function runDefinitionChecks(context, rootDir) {
  const input = createInput(rootDir);
  const provider = createRmtDefinitionProvider({ rootDir });
  const direct = provider.getDefinition(input, {
    domain: 'components',
    id: 'lab.preview.host'
  });
  const notFound = getRmtDefinition(input, {
    rootDir,
    pointer: '/routes/1/metadata/title'
  });

  assertDefinition(context, input, rootDir, '/routes/1/component', 'components', 'lab.preview.host', '/components/2/id', 'Route component definition');
  assertDefinition(context, input, rootDir, '/routes/1/template', 'templates', 'lab.preview.template', '/templates/3/id', 'Route template definition');
  assertDefinition(context, input, rootDir, '/routes/1/schedule', 'schedules', 'component.visible.mount', '/schedules/2/id', 'Route schedule definition');
  assertDefinition(context, input, rootDir, '/components/0/slots/header/template', 'templates', 'lab.header', '/templates/1/id', 'Slot template definition');
  assertDefinition(context, input, rootDir, '/components/8/schedule', 'schedules', 'component.idle.hydrate', '/schedules/3/id', 'Component schedule definition');

  context.assert(provider.schema === RMT_DEFINITION_PROVIDER_SCHEMA, 'Definition provider exposes schema');
  context.assert(direct.status === 'resolved', 'Definition provider supports direct domain/id lookup');
  context.assert(direct.target && direct.target.pointer === '/components/2/id', 'Direct definition lookup points to lab.preview.host ID');
  context.assert(notFound.status === 'not_found', 'Definition provider reports not_found for non-reference values');
}

function runDocumentSymbolChecks(context, rootDir) {
  const input = createInput(rootDir);
  const provider = createRmtDocumentSymbolsProvider({ rootDir });
  const report = provider.documentSymbols(input);
  const domainNames = report.symbols.map((symbol) => symbol.name);
  const componentsDomain = findSymbol(report.symbols, 'components');
  const previewHost = findSymbol(report.symbols, 'lab.preview.host');
  const previewRoute = findSymbol(report.symbols, 'lab.component.preview');
  const mountSchedule = findSymbol(report.symbols, 'component.visible.mount');
  const previewTemplate = findSymbol(report.symbols, 'lab.preview.template');
  const orchestrationReport = getRmtDocumentSymbols(createOrchestrationJsonInput(), { rootDir });
  const validationSymbol = findSymbol(orchestrationReport.symbols, 'contact.validation');
  const transitionSymbol = findSymbol(orchestrationReport.symbols, 'contact.to.issue');

  context.assert(report.schema === RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA, 'Document Symbols emits report schema');
  context.assert(report.providerSchema === RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA, 'Document Symbols emits provider schema');
  context.assert(report.workpackage === RMT_DOCUMENT_SYMBOLS_WORKPACKAGE, 'Document Symbols belongs to WP-E14-08');
  context.assert(report.status === 'completed', 'Document Symbols completes for valid source');
  context.assert(report.symbols.every((symbol) => symbol.schema === RMT_DOCUMENT_SYMBOLS_SCHEMA), 'Top-level symbols have stable schema');
  ['adapters', 'components', 'routes', 'schedules', 'templates', 'validations', 'transitions'].forEach((domain) => {
    context.assert(domainNames.includes(domain), `Document Symbols contains ${domain} domain`);
  });
  context.assert(componentsDomain && componentsDomain.kind === 'namespace', 'Components domain is a namespace symbol');
  context.assert(previewHost && previewHost.kind === 'component', 'Component ID is a component symbol');
  context.assert(previewHost && previewHost.detail.includes('x-section'), 'Component symbol detail includes tag');
  context.assert(previewRoute && previewRoute.kind === 'route', 'Route ID is a route symbol');
  context.assert(previewRoute && previewRoute.detail.includes('/components/:tag'), 'Route symbol detail includes path');
  context.assert(mountSchedule && mountSchedule.kind === 'schedule', 'Schedule ID is a schedule symbol');
  context.assert(previewTemplate && previewTemplate.kind === 'template', 'Template ID is a template symbol');
  assertRange(context, previewHost.range, 'Component symbol has range');
  assertRange(context, previewHost.selectionRange, 'Component symbol has selection range');
  context.assert(validationSymbol && validationSymbol.kind === 'validation', 'Validation record is a validation symbol');
  context.assert(validationSymbol && validationSymbol.detail.includes('blocking'), 'Validation symbol detail includes mode');
  context.assert(transitionSymbol && transitionSymbol.kind === 'transition', 'Transition record is a transition symbol');
  context.assert(transitionSymbol && transitionSymbol.detail.includes('crossfade'), 'Transition symbol detail includes effect');

  const directReport = getRmtDocumentSymbols(input, { rootDir });
  context.assert(JSON.stringify(report.symbols) === JSON.stringify(directReport.symbols), 'Document Symbol provider is deterministic');
}

function assertHover(context, input, rootDir, pointer, kind, expectedText, message) {
  const report = getRmtHover(input, {
    rootDir,
    pointer
  });

  context.assert(report.schema === RMT_HOVER_REPORT_SCHEMA, `${message}: report schema`);
  context.assert(report.providerSchema === RMT_HOVER_PROVIDER_SCHEMA, `${message}: provider schema`);
  context.assert(report.workpackage === RMT_HOVER_WORKPACKAGE, `${message}: workpackage`);
  context.assert(report.status === 'found', `${message}: hover found`);
  context.assert(report.hover && report.hover.schema === RMT_HOVER_SCHEMA, `${message}: hover schema`);
  context.assert(report.hover && report.hover.kind === kind, `${message}: hover kind`);
  context.assert(report.hover && report.hover.markdown.includes(expectedText), `${message}: hover text`);
  assertRange(context, report.hover.range, `${message}: hover range`);

  return report;
}

function runHoverChecks(context, rootDir) {
  const input = createInput(rootDir);
  const orchestrationInput = createOrchestrationJsonInput();
  const provider = createRmtHoverProvider({ rootDir });

  assertHover(context, input, rootDir, '/components/0/adapter', 'reference', 'XTend UI component adapter', 'Adapter reference hover');
  assertHover(context, input, rootDir, '/components/0/tag', 'component-tag', 'Manifest module: ./xsection.js', 'Component tag hover');
  assertHover(context, input, rootDir, '/schedules/0/lane', 'lane', 'Visible rendering work', 'Schedule lane hover');
  assertHover(context, input, rootDir, '/components/0/hydration/mode', 'hydration-policy', 'Render at runtime', 'Hydration policy hover');
  assertHover(context, input, rootDir, '/templates/0/mode', 'template-mode', 'Structured DOM descriptor template', 'Template mode hover');
  assertHover(context, orchestrationInput, rootDir, '/validations/0/mode', 'validation-mode', 'Block target actions', 'Validation mode hover');
  assertHover(context, orchestrationInput, rootDir, '/validations/0/fields/0/rules/1', 'validation-rule', 'email address', 'Validation rule hover');
  assertHover(context, orchestrationInput, rootDir, '/transitions/0/effect', 'transition-effect', 'Crossfade', 'Transition effect hover');

  const componentRef = assertHover(context, input, rootDir, '/routes/1/component', 'reference', 'lab.preview.host', 'Route component reference hover');
  const domainHover = provider.hover(input, {
    pointer: '/components'
  });
  const notFound = getRmtHover(input, {
    rootDir,
    pointer: '/routes/1/metadata/title'
  });

  context.assert(componentRef.hover.target && componentRef.hover.target.pointer === '/components/2/id', 'Reference hover exposes definition target');
  context.assert(provider.schema === RMT_HOVER_PROVIDER_SCHEMA, 'Hover provider exposes schema');
  context.assert(domainHover.status === 'found' && domainHover.hover.kind === 'domain', 'Hover provider explains top-level domains');
  context.assert(notFound.status === 'not_found', 'Hover provider reports not_found for plain values');
}

function runFailureChecks(context, rootDir) {
  const brokenInput = {
    text: '{\n  "kind": "rmt_document"\n  "version": "1.0"\n}',
    uri: 'file:///virtual/navigation-broken.rmt'
  };

  context.assert(getRmtDefinition(brokenInput, { rootDir, pointer: '/routes/0/component' }).status === 'source_unavailable', 'Definition reports source_unavailable on syntax-broken source');
  context.assert(getRmtDocumentSymbols(brokenInput, { rootDir }).status === 'source_unavailable', 'Document Symbols reports source_unavailable on syntax-broken source');
  context.assert(getRmtHover(brokenInput, { rootDir, pointer: '/routes/0/component' }).status === 'source_unavailable', 'Hover reports source_unavailable on syntax-broken source');
}

function runMetadataChecks(context, rootDir) {
  const packageManifest = require("../utils/test-catalog").resolveManifestProfiles(readJson('package.json', rootDir));
  const metadata = packageManifest.xtend && packageManifest.xtend.rmtNavigation;
  const runner = require("../utils/test-catalog").readRunnerCatalog(rootDir);
  const epic = readText(EPIC_14_PATH, rootDir);
  const architecture = readText(TOOLING_ARCHITECTURE_PATH, rootDir);

  context.assert(metadata && metadata.schema === 'xtend.rmt.navigation-provider.v1', 'package metadata declares RMT Navigation provider schema');
  context.assert(metadata && metadata.hoverSchema === RMT_HOVER_PROVIDER_SCHEMA, 'package metadata declares hover provider schema');
  context.assert(metadata && metadata.documentSymbolsSchema === RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA, 'package metadata declares document symbols provider schema');
  context.assert(metadata && metadata.definitionSchema === RMT_DEFINITION_PROVIDER_SCHEMA, 'package metadata declares definition provider schema');
  context.assert(metadata && metadata.workpackage === RMT_DEFINITION_WORKPACKAGE, 'package metadata points to WP-E14-08');
  context.assert(metadata && metadata.suite === RMT_DEFINITION_SUITE_PATH, 'package metadata points to navigation suite');
  context.assert(metadata && metadata.localGate === 'node scripts/run_xtend_tests.js rmt-navigation --json', 'package metadata declares local gate');
  context.assert(metadata && metadata.packageScript === RMT_DEFINITION_PACKAGE_SCRIPT, 'package metadata declares package script');
  context.assert(metadata && metadata.modules.hover === RMT_HOVER_MODULE_PATH, 'package metadata points to hover module');
  context.assert(metadata && metadata.modules.symbols === RMT_DOCUMENT_SYMBOLS_MODULE_PATH, 'package metadata points to symbols module');
  context.assert(metadata && metadata.modules.definitions === RMT_DEFINITION_MODULE_PATH, 'package metadata points to definitions module');
  context.assert((typeof packageManifest.exports['./rmt-language/hover'] === 'string' ? packageManifest.exports['./rmt-language/hover'] : packageManifest.exports['./rmt-language/hover'] && packageManifest.exports['./rmt-language/hover'].default) === './tools/rmt-language/hover.js', 'package exports RMT Hover provider');
  context.assert((typeof packageManifest.exports['./rmt-language/symbols'] === 'string' ? packageManifest.exports['./rmt-language/symbols'] : packageManifest.exports['./rmt-language/symbols'] && packageManifest.exports['./rmt-language/symbols'].default) === './tools/rmt-language/symbols.js', 'package exports RMT Document Symbols provider');
  context.assert((typeof packageManifest.exports['./rmt-language/definitions'] === 'string' ? packageManifest.exports['./rmt-language/definitions'] : packageManifest.exports['./rmt-language/definitions'] && packageManifest.exports['./rmt-language/definitions'].default) === './tools/rmt-language/definitions.js', 'package exports RMT Definition provider');
  context.assert(packageManifest.scripts['test:rmt-navigation'] === 'node scripts/run_xtend_tests.js rmt-navigation', 'package exposes rmt-navigation script');
  context.assert(runner.hasSuite("rmt-navigation"), 'test runner exposes rmt-navigation suite');
  context.assert(epic.includes('| `WP-E14-08` | P1 | completed | WS4 |'), 'Epic marks WP-E14-08 completed');
  context.assert(epic.includes('WP-E14-09` ist `ready`'), 'Epic hands off WP-E14-09 as ready');
  context.assert(architecture.includes('Implementierungsstand nach `WP-E14-08`'), 'Architecture documents RMT Navigation provider status');
  context.assert(architecture.includes('xtend.rmt.navigation-provider.v1'), 'Architecture documents RMT Navigation provider schema');
}

function runRmtNavigationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'rmt-navigation',
    label: 'Epic 14 RMT Navigation Providers'
  });
  const definitionSyntax = syntaxCheckFile(RMT_DEFINITION_MODULE_PATH, { rootDir, extension: '.js' });
  const hoverSyntax = syntaxCheckFile(RMT_HOVER_MODULE_PATH, { rootDir, extension: '.js' });
  const symbolsSyntax = syntaxCheckFile(RMT_DOCUMENT_SYMBOLS_MODULE_PATH, { rootDir, extension: '.js' });
  const suiteSyntax = syntaxCheckFile(RMT_DEFINITION_SUITE_PATH, { rootDir, extension: '.js' });

  assertFileExists(context, RMT_DEFINITION_MODULE_PATH, rootDir, 'RMT Definition provider module exists');
  assertFileExists(context, RMT_HOVER_MODULE_PATH, rootDir, 'RMT Hover provider module exists');
  assertFileExists(context, RMT_DOCUMENT_SYMBOLS_MODULE_PATH, rootDir, 'RMT Document Symbols provider module exists');
  assertFileExists(context, RMT_DEFINITION_SUITE_PATH, rootDir, 'RMT Navigation suite exists');
  assertFileExists(context, RMT_NAVIGATION_WP_PATH, rootDir, 'WP-E14-08 workpackage document exists');
  context.assert(definitionSyntax.ok, `RMT Definition module syntax passes${definitionSyntax.ok ? '' : ` (${definitionSyntax.message})`}`);
  context.assert(hoverSyntax.ok, `RMT Hover module syntax passes${hoverSyntax.ok ? '' : ` (${hoverSyntax.message})`}`);
  context.assert(symbolsSyntax.ok, `RMT Document Symbols module syntax passes${symbolsSyntax.ok ? '' : ` (${symbolsSyntax.message})`}`);
  context.assert(suiteSyntax.ok, `RMT Navigation suite syntax passes${suiteSyntax.ok ? '' : ` (${suiteSyntax.message})`}`);

  runMetadataChecks(context, rootDir);
  runDefinitionChecks(context, rootDir);
  runDocumentSymbolChecks(context, rootDir);
  runHoverChecks(context, rootDir);
  runFailureChecks(context, rootDir);

  return context.result({
    schema: 'xtend.rmt.navigation-provider.v1',
    hoverSchema: RMT_HOVER_PROVIDER_SCHEMA,
    documentSymbolsSchema: RMT_DOCUMENT_SYMBOLS_PROVIDER_SCHEMA,
    definitionSchema: RMT_DEFINITION_PROVIDER_SCHEMA,
    reportSchemas: [
      RMT_HOVER_REPORT_SCHEMA,
      RMT_DOCUMENT_SYMBOLS_REPORT_SCHEMA,
      RMT_DEFINITION_REPORT_SCHEMA
    ],
    workpackage: RMT_DEFINITION_WORKPACKAGE,
    modules: {
      hover: RMT_HOVER_MODULE_PATH,
      symbols: RMT_DOCUMENT_SYMBOLS_MODULE_PATH,
      definitions: RMT_DEFINITION_MODULE_PATH
    },
    suite: RMT_DEFINITION_SUITE_PATH
  });
}

function printRmtNavigationReport(result) {
  printSuiteReport(result, {
    successTitle: 'Epic 14 RMT Navigation Providers erfolgreich.',
    failureTitle: 'Epic 14 RMT Navigation Providers fehlgeschlagen:'
  });
}

module.exports = {
  printRmtNavigationReport,
  runRmtNavigationSuite
};

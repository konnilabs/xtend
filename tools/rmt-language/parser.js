const {
  RMT_SOURCE_MODEL_WORKPACKAGE,
  createRmtSourceModel
} = require('./source-model');

const RMT_PARSER_SCHEMA = 'xtend.rmt.parser.v1';
const RMT_PARSER_REPORT_SCHEMA = 'xtend.rmt.parser-report.v1';
const RMT_PARSER_WORKPACKAGE = 'WP-E14-03';
const RMT_PARSER_MODULE_PATH = 'tools/rmt-language/parser.js';
const RMT_PARSER_SUITE_PATH = 'tests/rmt-language/rmt_parser_suite.js';
const RMT_PARSER_PACKAGE_SCRIPT = 'npm run test:rmt-parser';
const RMT_FILE_FALLBACK_CODE = 'rmt.document.extension.fallback-used';

function normalizeSourceInput(input = {}, options = {}) {
  if (typeof input === 'string') {
    return {
      text: input,
      uri: options.uri,
      filePath: options.filePath,
      version: options.version
    };
  }

  return {
    text: String(input.text || ''),
    uri: input.uri || options.uri,
    filePath: input.filePath || options.filePath,
    version: input.version === undefined ? options.version : input.version,
    languageId: input.languageId || options.languageId
  };
}

function createFilePolicyDiagnostics(sourceModel) {
  if (!sourceModel || !sourceModel.filePolicy || !sourceModel.filePolicy.fallback) {
    return [];
  }

  return [
    sourceModel.createDiagnostic({
      code: RMT_FILE_FALLBACK_CODE,
      severity: 'warning',
      message: `${sourceModel.filePolicy.extension} ist nur ein RMT-Fallback-Dateityp. Neue Dokumente sollen .rmt verwenden.`,
      range: sourceModel.lineRange(0),
      workpackage: RMT_PARSER_WORKPACKAGE
    })
  ];
}

function createRmtParser(defaultOptions = {}) {
  function parseSource(input = {}, options = {}) {
    const normalizedInput = normalizeSourceInput(input, {
      ...defaultOptions,
      ...options
    });
    const sourceModel = createRmtSourceModel(normalizedInput);
    const filePolicyDiagnostics = createFilePolicyDiagnostics(sourceModel);
    const parsed = sourceModel.parseJson();

    if (!parsed.ok) {
      return {
        schema: RMT_PARSER_SCHEMA,
        workpackage: RMT_PARSER_WORKPACKAGE,
        ok: false,
        phase: 'syntax',
        status: 'syntax_error',
        sourceModel,
        rawDocument: null,
        diagnostics: filePolicyDiagnostics.concat(parsed.diagnostics),
        syntaxDiagnostics: parsed.diagnostics,
        filePolicyDiagnostics
      };
    }

    return {
      schema: RMT_PARSER_SCHEMA,
      workpackage: RMT_PARSER_WORKPACKAGE,
      ok: true,
      phase: 'parse',
      status: 'parsed',
      sourceModel,
      rawDocument: parsed.value,
      diagnostics: filePolicyDiagnostics,
      syntaxDiagnostics: [],
      filePolicyDiagnostics
    };
  }

  return Object.freeze({
    schema: RMT_PARSER_SCHEMA,
    workpackage: RMT_PARSER_WORKPACKAGE,
    parseSource
  });
}

function parseRmtSource(input = {}, options = {}) {
  return createRmtParser(options).parseSource(input, options);
}

module.exports = {
  RMT_FILE_FALLBACK_CODE,
  RMT_PARSER_MODULE_PATH,
  RMT_PARSER_PACKAGE_SCRIPT,
  RMT_PARSER_REPORT_SCHEMA,
  RMT_PARSER_SCHEMA,
  RMT_PARSER_SUITE_PATH,
  RMT_PARSER_WORKPACKAGE,
  RMT_SOURCE_MODEL_WORKPACKAGE,
  createFilePolicyDiagnostics,
  createRmtParser,
  parseRmtSource
};

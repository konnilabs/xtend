const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  RMT_FILE_FALLBACK_CODE,
  RMT_PARSER_REPORT_SCHEMA,
  RMT_PARSER_SCHEMA,
  RMT_PARSER_WORKPACKAGE,
  createRmtParser
} = require('./parser');

const RMT_FORMAT_ADAPTER_SCHEMA = 'xtend.rmt.format-adapter.v1';
const RMT_FORMAT_ADAPTER_MODULE_PATH = 'tools/rmt-language/format-adapter.js';
const RMT_FORMAT_NORMALIZATION_ERROR_CODE = 'rmt.format.normalization.failed';
const RMT_FORMAT_ADAPTER_UNAVAILABLE_CODE = 'rmt.format.adapter.unavailable';
const RMT_CORE_ARTIFACT_PATH = 'xtendrmt/rmt-core.esm.js';

function createCoreSandbox() {
  function CustomEvent(type, init = {}) {
    this.type = type;
    this.detail = init.detail || null;
    this.bubbles = init.bubbles === true;
    this.composed = init.composed === true;
  }

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
    navigator: { userAgent: 'xtend-rmt-language-tooling' },
    CustomEvent,
    document: {
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
      createElement(tagName) {
        return {
          tagName: String(tagName || '').toUpperCase(),
          attributes: {},
          children: [],
          setAttribute(name, value) {
            this.attributes[name] = String(value);
          },
          appendChild(child) {
            this.children.push(child);
            return child;
          }
        };
      }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  return sandbox;
}

function stripEsmExports(source) {
  return String(source || '').replace(/\nexport\s+\{[\s\S]*?\};\s*\nexport default XtendRmtProduct;\s*$/u, '');
}

function resolveRootDir(options = {}) {
  return options.rootDir || path.resolve(__dirname, '..', '..');
}

function loadRmtCoreFormatFactory(options = {}) {
  const rootDir = resolveRootDir(options);
  const artifactPath = options.coreArtifactPath
    ? (path.isAbsolute(options.coreArtifactPath)
      ? options.coreArtifactPath
      : path.join(rootDir, options.coreArtifactPath))
    : path.join(rootDir, RMT_CORE_ARTIFACT_PATH);
  const source = fs.readFileSync(artifactPath, 'utf8');
  const sandbox = createCoreSandbox();

  vm.runInNewContext(stripEsmExports(source), sandbox, {
    filename: RMT_CORE_ARTIFACT_PATH
  });

  const factory = sandbox.AppModules && sandbox.AppModules.createRmtFormat;

  if (typeof factory !== 'function') {
    throw new Error('XTendRMT core artifact exposes no createRmtFormat factory.');
  }

  return factory;
}

function createAdapterDiagnostic(sourceModel, input = {}) {
  const range = input.range || (sourceModel && sourceModel.lineRange ? sourceModel.lineRange(0) : null);

  return {
    schema: 'xtend.rmt.linter.diagnostic.v1',
    source: 'rmt-language',
    code: input.code || RMT_FORMAT_NORMALIZATION_ERROR_CODE,
    severity: input.severity || 'error',
    message: input.message || input.code || 'RMT format adapter diagnostic',
    uri: sourceModel ? sourceModel.uri : null,
    file: sourceModel ? sourceModel.filePath : null,
    pointer: input.pointer || null,
    range,
    workpackage: RMT_PARSER_WORKPACKAGE
  };
}

function resolveRmtFormat(options = {}) {
  if (options.rmtFormat && typeof options.rmtFormat === 'object') {
    return {
      ok: true,
      rmtFormat: options.rmtFormat,
      factorySource: 'injected-format'
    };
  }

  try {
    const factory = typeof options.createRmtFormat === 'function'
      ? options.createRmtFormat
      : loadRmtCoreFormatFactory(options);

    return {
      ok: true,
      rmtFormat: factory(),
      factorySource: typeof options.createRmtFormat === 'function' ? 'injected-factory' : RMT_CORE_ARTIFACT_PATH
    };
  } catch (error) {
    return {
      ok: false,
      rmtFormat: null,
      error,
      factorySource: null
    };
  }
}

function createRmtFormatAdapter(defaultOptions = {}) {
  const parser = defaultOptions.parser || createRmtParser(defaultOptions);

  function parseAndNormalizeSource(input = {}, options = {}) {
    const effectiveOptions = {
      ...defaultOptions,
      ...options
    };
    const parserResult = parser.parseSource(input, effectiveOptions);

    if (!parserResult.ok) {
      return {
        schema: RMT_FORMAT_ADAPTER_SCHEMA,
        parserSchema: RMT_PARSER_SCHEMA,
        reportSchema: RMT_PARSER_REPORT_SCHEMA,
        workpackage: RMT_PARSER_WORKPACKAGE,
        ok: false,
        phase: 'syntax',
        status: 'syntax_error',
        sourceModel: parserResult.sourceModel,
        rawDocument: null,
        normalizedDocument: null,
        diagnostics: parserResult.diagnostics,
        parserResult,
        formatDiagnostics: []
      };
    }

    const resolvedFormat = resolveRmtFormat(effectiveOptions);

    if (!resolvedFormat.ok || !resolvedFormat.rmtFormat || typeof resolvedFormat.rmtFormat.parseDocument !== 'function') {
      const diagnostic = createAdapterDiagnostic(parserResult.sourceModel, {
        code: RMT_FORMAT_ADAPTER_UNAVAILABLE_CODE,
        message: resolvedFormat.error && resolvedFormat.error.message
          ? resolvedFormat.error.message
          : 'createRmtFormat().parseDocument ist im RMT-Core nicht verfuegbar.'
      });

      return {
        schema: RMT_FORMAT_ADAPTER_SCHEMA,
        parserSchema: RMT_PARSER_SCHEMA,
        reportSchema: RMT_PARSER_REPORT_SCHEMA,
        workpackage: RMT_PARSER_WORKPACKAGE,
        ok: false,
        phase: 'format',
        status: 'format_adapter_unavailable',
        sourceModel: parserResult.sourceModel,
        rawDocument: parserResult.rawDocument,
        normalizedDocument: null,
        diagnostics: parserResult.diagnostics.concat(diagnostic),
        parserResult,
        formatDiagnostics: [diagnostic],
        formatFactorySource: resolvedFormat.factorySource
      };
    }

    try {
      const normalizedDocument = resolvedFormat.rmtFormat.parseDocument(parserResult.sourceModel.text, {
        sourceUrl: parserResult.sourceModel.uri,
        filePath: parserResult.sourceModel.filePath,
        ...effectiveOptions.formatOptions
      });

      return {
        schema: RMT_FORMAT_ADAPTER_SCHEMA,
        parserSchema: RMT_PARSER_SCHEMA,
        reportSchema: RMT_PARSER_REPORT_SCHEMA,
        workpackage: RMT_PARSER_WORKPACKAGE,
        ok: true,
        phase: 'normalize',
        status: 'normalized',
        sourceModel: parserResult.sourceModel,
        rawDocument: parserResult.rawDocument,
        normalizedDocument,
        diagnostics: parserResult.diagnostics,
        parserResult,
        formatDiagnostics: [],
        formatFactorySource: resolvedFormat.factorySource,
        normalizedBy: 'createRmtFormat().parseDocument'
      };
    } catch (error) {
      const diagnostic = createAdapterDiagnostic(parserResult.sourceModel, {
        code: RMT_FORMAT_NORMALIZATION_ERROR_CODE,
        message: error && error.message ? error.message : 'RMT format normalization failed.'
      });

      return {
        schema: RMT_FORMAT_ADAPTER_SCHEMA,
        parserSchema: RMT_PARSER_SCHEMA,
        reportSchema: RMT_PARSER_REPORT_SCHEMA,
        workpackage: RMT_PARSER_WORKPACKAGE,
        ok: false,
        phase: 'format',
        status: 'normalization_error',
        sourceModel: parserResult.sourceModel,
        rawDocument: parserResult.rawDocument,
        normalizedDocument: null,
        diagnostics: parserResult.diagnostics.concat(diagnostic),
        parserResult,
        formatDiagnostics: [diagnostic],
        formatFactorySource: resolvedFormat.factorySource
      };
    }
  }

  return Object.freeze({
    schema: RMT_FORMAT_ADAPTER_SCHEMA,
    parserSchema: RMT_PARSER_SCHEMA,
    workpackage: RMT_PARSER_WORKPACKAGE,
    parseAndNormalizeSource
  });
}

function parseAndNormalizeRmtSource(input = {}, options = {}) {
  return createRmtFormatAdapter(options).parseAndNormalizeSource(input, options);
}

module.exports = {
  RMT_CORE_ARTIFACT_PATH,
  RMT_FILE_FALLBACK_CODE,
  RMT_FORMAT_ADAPTER_MODULE_PATH,
  RMT_FORMAT_ADAPTER_SCHEMA,
  RMT_FORMAT_ADAPTER_UNAVAILABLE_CODE,
  RMT_FORMAT_NORMALIZATION_ERROR_CODE,
  RMT_PARSER_REPORT_SCHEMA,
  RMT_PARSER_SCHEMA,
  RMT_PARSER_WORKPACKAGE,
  createRmtFormatAdapter,
  loadRmtCoreFormatFactory,
  parseAndNormalizeRmtSource,
  stripEsmExports
};

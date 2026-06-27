const {
  RMT_SOURCE_MODEL_WORKPACKAGE,
  createRmtSourceModel
} = require('./source-model');

const RMT_VNEXT_AST_SCHEMA = 'xtend.rmt.vnext.ast.v1';
const RMT_VNEXT_PARSER_SCHEMA = 'xtend.rmt.vnext-parser.v1';
const RMT_VNEXT_PARSER_REPORT_SCHEMA = 'xtend.rmt.vnext-parser-report.v1';
const RMT_VNEXT_PARSER_WORKPACKAGE = 'WP-E15-04';
const RMT_VNEXT_PARSER_MODULE_PATH = 'tools/rmt-language/vnext-parser.js';
const RMT_VNEXT_PARSER_SUITE_PATH = 'tests/rmt-language/rmt_vnext_parser_suite.js';
const RMT_VNEXT_PARSER_PACKAGE_SCRIPT = 'npm run test:rmt-vnext-parser';
const RMT_VNEXT_SYNTAX_ERROR_CODE = 'rmt.vnext.syntax.error';
const RMT_VNEXT_CONTEXT_ERROR_CODE = 'rmt.vnext.syntax.context';
const RMT_FILE_FALLBACK_CODE = 'rmt.document.extension.fallback-used';

const RESERVED_WORDS = new Set([
  'template',
  'remote',
  'surface',
  'lane',
  'weight',
  'mount',
  'hydrate',
  'suspend',
  'resume',
  'invalidate',
  'dispose',
  'prewarm',
  'recycle',
  'detach',
  'reattach',
  'stream',
  'from',
  'endpoint',
  'sse',
  'worker',
  'when',
  'slot',
  'import',
  'on',
  'action',
  'trust',
  'boundary',
  'hydration',
  'resumability',
  'policy',
  'mode',
  'insular',
  'isolation',
  'snapshot',
  'event',
  'replay',
  'integrity',
  'sanitize',
  'true',
  'false',
  'null'
]);

const IMPERATIVE_WORDS = new Set([
  'if',
  'else',
  'for',
  'while',
  'switch',
  'case',
  'try',
  'catch',
  'finally',
  'function',
  'return',
  'await',
  'async',
  'class',
  'new',
  'eval'
]);

const LIFECYCLE_OPERATIONS = new Set([
  'mount',
  'hydrate',
  'suspend',
  'resume',
  'invalidate',
  'dispose',
  'prewarm',
  'recycle',
  'detach',
  'reattach'
]);

const SOURCE_KINDS = new Set(['endpoint', 'sse', 'worker', 'selector', 'state', 'datasource', 'fixture', 'resource']);
const COMPARISON_OPERATORS = new Set(['==', '!=', '>', '>=', '<', '<=']);
const PRIMITIVE_DECLARATIONS = new Set([
  'state',
  'selector',
  'datasource',
  'action',
  'validation',
  'transition',
  'portal',
  'overlay',
  'resource'
]);

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
    languageId: input.languageId || options.languageId || 'rmt'
  };
}

function createRange(sourceModel, startOffset, endOffset) {
  return sourceModel.rangeForOffsets(startOffset, endOffset);
}

function createToken(type, value, startOffset, endOffset, extra = {}) {
  return {
    type,
    value,
    startOffset,
    endOffset,
    ...extra
  };
}

function createLexerDiagnostic(sourceModel, input = {}) {
  return sourceModel.createDiagnostic({
    schema: input.schema,
    code: input.code || RMT_VNEXT_SYNTAX_ERROR_CODE,
    severity: input.severity || 'error',
    message: input.message || 'Invalid RMT vNext syntax',
    startOffset: input.startOffset,
    endOffset: input.endOffset,
    range: input.range,
    workpackage: RMT_VNEXT_PARSER_WORKPACKAGE
  });
}

function createFilePolicyDiagnostics(sourceModel) {
  if (!sourceModel || !sourceModel.filePolicy || !sourceModel.filePolicy.fallback) {
    return [];
  }

  return [
    sourceModel.createDiagnostic({
      code: RMT_FILE_FALLBACK_CODE,
      severity: 'warning',
      message: `${sourceModel.filePolicy.extension} is only an RMT fallback file type. New vNext documents should use .rmt.`,
      range: sourceModel.lineRange(0),
      workpackage: RMT_VNEXT_PARSER_WORKPACKAGE
    })
  ];
}

function isIdentifierStart(character) {
  return /[A-Za-z_]/.test(character);
}

function isIdentifierPart(character) {
  return /[A-Za-z0-9_-]/.test(character);
}

function tokenizeVNextSource(sourceModel) {
  const text = sourceModel.text;
  const tokens = [];
  const diagnostics = [];
  let index = 0;

  function pushDiagnostic(input) {
    diagnostics.push(createLexerDiagnostic(sourceModel, input));
  }

  while (index < text.length) {
    const start = index;
    const character = text[index];

    if (character === ' ' || character === '\t' || character === '\f' || character === '\v') {
      index += 1;
      continue;
    }

    if (character === '\r' || character === '\n') {
      if (character === '\r' && text[index + 1] === '\n') {
        index += 2;
      } else {
        index += 1;
      }
      tokens.push(createToken('newline', '\n', start, index));
      continue;
    }

    if (character === '/' && text[index + 1] === '/') {
      index += 2;
      while (index < text.length && text[index] !== '\n' && text[index] !== '\r') {
        index += 1;
      }
      continue;
    }

    if (character === '/' && text[index + 1] === '*') {
      index += 2;
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) {
        index += 1;
      }
      if (index >= text.length) {
        pushDiagnostic({
          message: 'Unterminated block comment.',
          startOffset: start,
          endOffset: text.length
        });
        break;
      }
      index += 2;
      continue;
    }

    if (character === '"') {
      index += 1;
      while (index < text.length) {
        if (text[index] === '\\') {
          index += 2;
          continue;
        }
        if (text[index] === '"') {
          index += 1;
          const raw = text.slice(start, index);
          try {
            tokens.push(createToken('string', JSON.parse(raw), start, index, { raw }));
          } catch (error) {
            pushDiagnostic({
              message: error && error.message ? error.message : 'Invalid string literal.',
              startOffset: start,
              endOffset: index
            });
          }
          break;
        }
        index += 1;
      }
      if (index >= text.length && text[index - 1] !== '"') {
        pushDiagnostic({
          message: 'Unterminated string literal.',
          startOffset: start,
          endOffset: text.length
        });
      }
      continue;
    }

    if (character === '`') {
      index += 1;
      while (index < text.length && text[index] !== '`') {
        index += 1;
      }
      if (text[index] !== '`') {
        pushDiagnostic({
          message: 'Unterminated escaped identifier.',
          startOffset: start,
          endOffset: text.length
        });
        break;
      }
      index += 1;
      tokens.push(createToken('identifier', text.slice(start + 1, index - 1), start, index, { escaped: true }));
      continue;
    }

    if (/[0-9]/.test(character)) {
      index += 1;
      while (index < text.length && /[0-9]/.test(text[index])) {
        index += 1;
      }
      tokens.push(createToken('integer', Number(text.slice(start, index)), start, index, { raw: text.slice(start, index) }));
      continue;
    }

    if (isIdentifierStart(character)) {
      index += 1;
      while (index < text.length && isIdentifierPart(text[index])) {
        index += 1;
      }
      tokens.push(createToken('identifier', text.slice(start, index), start, index));
      continue;
    }

    const twoCharacter = text.slice(index, index + 2);
    if (['->', '==', '!=', '>=', '<=', '&&', '||'].includes(twoCharacter)) {
      index += 2;
      tokens.push(createToken('symbol', twoCharacter, start, index));
      continue;
    }

    if ('{}().;!<>[]=,:[]'.includes(character)) {
      index += 1;
      tokens.push(createToken('symbol', character, start, index));
      continue;
    }

    pushDiagnostic({
      message: `Unexpected character "${character}".`,
      startOffset: start,
      endOffset: start + 1
    });
    index += 1;
  }

  tokens.push(createToken('eof', '<eof>', text.length, text.length));

  return {
    tokens,
    diagnostics
  };
}

class VNextParser {
  constructor(sourceModel, tokens, diagnostics = []) {
    this.sourceModel = sourceModel;
    this.tokens = tokens;
    this.diagnostics = diagnostics.slice();
    this.index = 0;
  }

  current() {
    return this.tokens[this.index] || this.tokens[this.tokens.length - 1];
  }

  previous() {
    return this.tokens[Math.max(0, this.index - 1)] || this.current();
  }

  isAtEnd() {
    return this.current().type === 'eof';
  }

  consume() {
    const token = this.current();
    if (!this.isAtEnd()) {
      this.index += 1;
    }
    return token;
  }

  matches(value) {
    const token = this.current();
    return token && token.value === value;
  }

  match(value) {
    if (!this.matches(value)) {
      return null;
    }
    return this.consume();
  }

  matchSeparator() {
    const token = this.current();
    if (token.type === 'newline' || token.value === ';') {
      return this.consume();
    }
    return null;
  }

  skipSeparators() {
    while (this.matchSeparator()) {
      // keep consuming
    }
  }

  isIdentifierToken(token) {
    return token
      && token.type === 'identifier'
      && (token.escaped || !RESERVED_WORDS.has(token.value));
  }

  addDiagnostic(token, message, code = RMT_VNEXT_SYNTAX_ERROR_CODE) {
    const currentToken = token || this.current();
    this.diagnostics.push(createLexerDiagnostic(this.sourceModel, {
      code,
      message,
      startOffset: currentToken.startOffset,
      endOffset: Math.max(currentToken.endOffset, currentToken.startOffset + 1)
    }));
  }

  createNode(type, startToken, endToken, fields = {}) {
    const start = startToken ? startToken.startOffset : 0;
    const end = endToken ? endToken.endOffset : start;
    return {
      type,
      range: createRange(this.sourceModel, start, end),
      ...fields
    };
  }

  parseDocument() {
    const body = [];
    this.skipSeparators();

    while (!this.isAtEnd()) {
      if (this.matches('import')) {
        body.push(this.parseImportDeclaration());
      } else if (this.matches('template')) {
        body.push(this.parseTemplateDeclaration());
      } else if (this.matches('remote')) {
        body.push(this.parseRemoteSurfaceDeclaration());
      } else if (this.matches('surface')) {
        body.push(this.parseSurfaceDeclaration(null));
      } else if (this.isPrimitiveDeclarationStart()) {
        body.push(this.parsePrimitiveDeclaration({ topLevel: true }));
      } else if (LIFECYCLE_OPERATIONS.has(this.current().value) || this.matches('stream')) {
        this.addDiagnostic(this.current(), 'Lifecycle and stream statements must be inside a lane or slot.', RMT_VNEXT_CONTEXT_ERROR_CODE);
        this.skipStatementOrBlock();
      } else {
        this.reportUnexpectedTopLevel();
      }
      this.skipSeparators();
    }

    const documentNode = {
      schema: RMT_VNEXT_AST_SCHEMA,
      type: 'RmtVNextDocument',
      body,
      range: createRange(this.sourceModel, 0, this.sourceModel.length)
    };
    assignAstPointers(documentNode, '');
    documentNode.imports = body.filter((node) => node.type === 'RmtImportDeclaration');
    documentNode.templates = body.filter((node) => node.type === 'RmtTemplateDeclaration');
    documentNode.surfaces = body.filter((node) => node.type === 'RmtSurfaceDeclaration');
    documentNode.remoteSurfaces = body.filter((node) => node.type === 'RmtRemoteSurfaceDeclaration');
    return documentNode;
  }

  reportUnexpectedTopLevel() {
    const token = this.current();
    if (IMPERATIVE_WORDS.has(token.value)) {
      this.addDiagnostic(token, `Imperative keyword "${token.value}" is not part of RMT vNext.`, RMT_VNEXT_CONTEXT_ERROR_CODE);
    } else {
      this.addDiagnostic(token, `Unexpected top-level token "${token.value}".`);
    }
    this.skipStatementOrBlock();
  }

  parseImportDeclaration() {
    const start = this.expectValue('import', 'Expected import declaration.');
    const pathToken = this.current();
    let importPath = null;

    if (pathToken.type === 'string') {
      importPath = pathToken.value;
      this.consume();
    } else {
      this.addDiagnostic(pathToken, 'Import paths must be static strings.');
      this.consume();
    }

    this.consumeStatementEnd('Expected statement end after import.');
    const end = this.previous();

    return this.createNode('RmtImportDeclaration', start, end, {
      path: importPath,
      mode: importPath && importPath.includes('*') ? 'static_glob' : 'static_file'
    });
  }

  parseTemplateDeclaration() {
    const start = this.expectValue('template', 'Expected template declaration.');
    const name = this.parseQualifiedIdentifier('Expected template identifier.');
    const body = this.parseBlock(() => {
      if (this.matches('import')) {
        return this.parseImportDeclaration();
      }
      if (this.matches('surface')) {
        return this.parseSurfaceDeclaration(name && name.value);
      }
      if (this.isPrimitiveDeclarationStart()) {
        return this.parsePrimitiveDeclaration({ templateName: name && name.value });
      }
      this.addDiagnostic(this.current(), 'Templates may contain imports, surfaces and App Platform primitives only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();

    return this.createNode('RmtTemplateDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      body: body.items
    });
  }

  parseSurfaceDeclaration(templateName) {
    const start = this.expectValue('surface', 'Expected surface declaration.');
    const name = this.parseQualifiedIdentifier('Expected surface identifier.');
    const metadata = this.parseSurfaceHeaderMetadata();
    const body = this.parseBlock(() => {
      if (this.matches('lane')) {
        return this.parseLaneDeclaration(templateName, name && name.value);
      }
      if (this.matches('on')) {
        return this.parseEventBinding();
      }
      const item = this.parseSurfacePrimitiveItem();
      if (item) return item;
      this.addDiagnostic(this.current(), 'Surfaces may contain lanes, event bindings and surface primitive clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();

    return this.createNode('RmtSurfaceDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      metadata,
      body: body.items
    });
  }

  isPrimitiveDeclarationStart() {
    return PRIMITIVE_DECLARATIONS.has(this.current().value);
  }

  parsePrimitiveDeclaration(scope = {}) {
    if (this.matches('state')) return this.parseStateDeclaration(scope);
    if (this.matches('selector')) return this.parseSelectorDeclaration(scope);
    if (this.matches('datasource')) return this.parseDataSourceDeclaration(scope);
    if (this.matches('action')) return this.parseActionDeclaration(scope);
    if (this.matches('validation')) return this.parseValidationDeclaration(scope);
    if (this.matches('transition')) return this.parseTransitionDeclaration(scope);
    if (this.matches('portal')) return this.parsePortalDeclaration(scope);
    if (this.matches('overlay')) return this.parseOverlayDeclaration(scope);
    if (this.matches('resource')) return this.parseResourceDeclaration(scope);
    this.addDiagnostic(this.current(), 'Expected App Platform primitive declaration.', RMT_VNEXT_CONTEXT_ERROR_CODE);
    this.skipStatementOrBlock();
    return null;
  }

  parseStateDeclaration(scope = {}) {
    const start = this.expectValue('state', 'Expected state declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected state identifier.');
    const fields = [];
    let dataType = null;
    let initial = null;
    let preserve = false;

    while (!this.isAtEnd() && !this.matches('{') && !this.isStatementBoundary()) {
      if (this.matches('type')) {
        this.consume();
        dataType = this.parseTypeReference('Expected state type.', ['initial', 'preserve']);
      } else if (this.matches('initial')) {
        this.consume();
        initial = this.parsePrimitiveValue();
      } else if (this.matches('preserve')) {
        preserve = true;
        this.consume();
      } else {
        this.addDiagnostic(this.current(), 'State declarations may contain type, initial and preserve clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
        this.consume();
      }
    }

    if (this.matches('{')) {
      const body = this.parseBlock(() => {
        if (this.matches('initial')) return this.parseInitialBlock();
        this.addDiagnostic(this.current(), 'State blocks may contain initial blocks only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
        this.skipStatementOrBlock();
        return null;
      });
      fields.push(...body.items);
      this.consumeOptionalStatementEnd();
      const end = body.endToken || this.previous();
      return this.createNode('RmtStateDeclaration', start, end, {
        name: name && name.value,
        nameNode: name,
        dataType,
        initial,
        preserve,
        body: fields,
        scope
      });
    }

    this.consumeStatementEnd('Expected statement end after state declaration.');
    const end = this.previous();
    return this.createNode('RmtStateDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      dataType,
      initial,
      preserve,
      body: fields,
      scope
    });
  }

  parseInitialBlock() {
    const start = this.expectValue('initial', 'Expected initial block.');
    const body = this.parseBlock(() => {
      const key = this.parseQualifiedIdentifierAllowReserved('Expected initial value key.');
      const value = this.parsePrimitiveValue();
      this.consumeStatementEnd('Expected statement end after initial value.');
      const end = value ? getNodeEndToken(value) : this.previous();
      return this.createNode('RmtInitialValueEntry', key && key.startToken, end, {
        key: key && key.value,
        keyNode: key,
        value
      });
    });
    const end = body.endToken || this.previous();
    return this.createNode('RmtInitialBlock', start, end, {
      body: body.items
    });
  }

  parseSelectorDeclaration(scope = {}) {
    const start = this.expectValue('selector', 'Expected selector declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected selector identifier.');
    const source = this.matches('from') ? this.parsePrimitiveSourceReference() : null;
    const body = this.parseBlock(() => {
      if (this.matches('where')) return this.parseRawPrimitiveClause('where', 'RmtSelectorWhereClause');
      if (this.matches('find')) return this.parseRawPrimitiveClause('find', 'RmtSelectorFindClause');
      if (this.matches('sort')) return this.parseSelectorSortClause();
      if (this.matches('output')) return this.parseOutputClause();
      this.addDiagnostic(this.current(), 'Selector blocks may contain where, find, sort and output clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();
    return this.createNode('RmtSelectorDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      source,
      body: body.items,
      scope
    });
  }

  parseDataSourceDeclaration(scope = {}) {
    const start = this.expectValue('datasource', 'Expected datasource declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected datasource identifier.');
    const source = this.matches('from') ? this.parsePrimitiveSourceReference() : null;
    const body = this.parseBlock(() => {
      if (this.matches('method')) return this.parseKeywordValueClause('method', 'RmtDataSourceMethodClause');
      if (this.matches('contract')) return this.parseKeywordValueClause('contract', 'RmtDataSourceContractClause');
      if (this.matches('result')) return this.parseKeywordValueClause('result', 'RmtDataSourceResultClause');
      if (this.matches('fallback')) return this.parseFallbackClause();
      this.addDiagnostic(this.current(), 'DataSource blocks may contain method, contract, result and fallback clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();
    return this.createNode('RmtDataSourceDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      source,
      body: body.items,
      scope
    });
  }

  parseActionDeclaration(scope = {}) {
    const start = this.expectValue('action', 'Expected action declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected action identifier.');
    const body = this.parseBlock(() => {
      if (this.matches('input')) return this.parseActionInputClause();
      if (this.matches('status')) return this.parseKeywordPathClause('status', 'RmtActionStatusClause');
      if (this.matches('effect')) return this.parseActionEffectStatement();
      if (this.matches('reduce')) return this.parseReduceStatement();
      if (this.matches('recipe')) return this.parseReducerRecipeStatement();
      if (this.matches('emit')) return this.parseEmitStatement();
      if (this.matches('on')) return this.parseActionResultHandler();
      this.addDiagnostic(this.current(), 'Action blocks may contain input, status, effect, reduce, recipe, emit and result handlers only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();
    return this.createNode('RmtActionDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      body: body.items,
      scope
    });
  }

  parseValidationDeclaration(scope = {}) {
    const start = this.expectValue('validation', 'Expected validation declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected validation identifier.');
    const body = this.parseBlock(() => {
      if (this.matches('mode')) return this.parseValidationModeClause();
      if (this.matches('target')) return this.parseValidationTargetClause();
      if (this.matches('field')) return this.parseValidationFieldClause();
      if (this.matches('include')) return this.parseValidationIncludeClause();
      this.addDiagnostic(this.current(), 'Validation blocks may contain mode, target, field and include clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();
    return this.createNode('RmtValidationDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      body: body.items,
      scope
    });
  }

  parseValidationModeClause() {
    const start = this.expectValue('mode', 'Expected validation mode clause.');
    const mode = this.parseQualifiedIdentifierAllowReserved('Expected validation mode.');
    this.consumeStatementEnd('Expected statement end after validation mode.');
    const end = mode && mode.endToken ? mode.endToken : this.previous();
    return this.createNode('RmtValidationModeClause', start, end, {
      mode: mode && mode.value,
      modeNode: mode
    });
  }

  parseValidationTargetClause() {
    const start = this.expectValue('target', 'Expected validation target clause.');
    const kindToken = this.current();
    let kind = null;
    if (kindToken.type === 'identifier') {
      kind = kindToken.value;
      this.consume();
    } else {
      this.addDiagnostic(kindToken, 'Expected validation target kind.');
      this.consume();
    }
    const target = this.parseQualifiedIdentifierAllowReserved('Expected validation target reference.');
    this.consumeStatementEnd('Expected statement end after validation target.');
    const end = target && target.endToken ? target.endToken : this.previous();
    return this.createNode('RmtValidationTargetClause', start, end, {
      kind,
      target: target && target.value,
      targetNode: target
    });
  }

  parseValidationFieldClause() {
    const start = this.expectValue('field', 'Expected validation field clause.');
    const field = this.parseQualifiedIdentifierAllowReserved('Expected validation field state.');
    const rules = [];
    while (!this.isAtEnd() && !this.isStatementBoundary()) {
      const token = this.current();
      if (this.matches('required') || this.matches('email')) {
        rules.push(this.createNode('RmtValidationRule', token, token, {
          kind: this.consume().value,
          value: this.createNode('RmtPrimitiveValue', token, token, { kind: 'literal', value: true })
        }));
        continue;
      }
      if (this.matches('minLength') || this.matches('maxLength') || this.matches('pattern') || this.matches('message')) {
        const ruleStart = this.consume();
        const value = this.parsePrimitiveValue();
        const end = value ? getNodeEndToken(value) : ruleStart;
        rules.push(this.createNode('RmtValidationRule', ruleStart, end, {
          kind: ruleStart.value,
          value
        }));
        continue;
      }
      this.addDiagnostic(token, 'Validation field rules support required, email, minLength, maxLength, pattern and message only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.consume();
    }
    this.consumeStatementEnd('Expected statement end after validation field.');
    const end = rules.length > 0 ? getNodeEndToken(rules[rules.length - 1]) : (field && field.endToken || this.previous());
    return this.createNode('RmtValidationFieldClause', start, end, {
      field: field && field.value,
      fieldNode: field,
      rules
    });
  }

  parseValidationIncludeClause() {
    const start = this.expectValue('include', 'Expected validation include clause.');
    const ref = this.parseQualifiedIdentifierAllowReserved('Expected validation include reference.');
    this.consumeStatementEnd('Expected statement end after validation include.');
    const end = ref && ref.endToken ? ref.endToken : this.previous();
    return this.createNode('RmtValidationIncludeClause', start, end, {
      ref: ref && ref.value,
      refNode: ref
    });
  }

  parseTransitionDeclaration(scope = {}) {
    const start = this.expectValue('transition', 'Expected transition declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected transition identifier.');
    const body = this.parseBlock(() => {
      if (this.matches('trigger')) return this.parseTransitionTriggerClause();
      if (this.matches('from')) return this.parseTransitionSurfaceListClause('from', 'RmtTransitionFromClause');
      if (this.matches('to')) return this.parseTransitionSurfaceListClause('to', 'RmtTransitionToClause');
      if (this.matches('effect')) return this.parseTransitionEffectClause();
      if (this.matches('durationMs')) return this.parseTransitionDurationClause();
      if (this.matches('easing')) return this.parseTransitionEasingClause();
      if (this.matches('lane')) return this.parseTransitionLaneClause();
      this.addDiagnostic(this.current(), 'Transition blocks may contain trigger, from, to, effect, durationMs, easing and lane clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();
    return this.createNode('RmtTransitionDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      body: body.items,
      scope
    });
  }

  parseTransitionTriggerClause() {
    const start = this.expectValue('trigger', 'Expected transition trigger clause.');
    const kindToken = this.current();
    let kind = null;
    if (kindToken.type === 'identifier') {
      kind = kindToken.value;
      this.consume();
    } else {
      this.addDiagnostic(kindToken, 'Expected transition trigger kind.');
      this.consume();
    }
    const target = this.parseQualifiedIdentifierAllowReserved('Expected transition trigger reference.');
    this.consumeStatementEnd('Expected statement end after transition trigger.');
    const end = target && target.endToken ? target.endToken : this.previous();
    return this.createNode('RmtTransitionTriggerClause', start, end, {
      kind: kind || 'action',
      target: target && target.value,
      targetNode: target
    });
  }

  parseTransitionSurfaceListClause(keyword, nodeType) {
    const start = this.expectValue(keyword, `Expected transition ${keyword} clause.`);
    if (this.matches('surfaces')) this.consume();
    const value = this.parsePrimitiveValue();
    this.consumeStatementEnd(`Expected statement end after transition ${keyword} clause.`);
    const end = value ? getNodeEndToken(value) : this.previous();
    return this.createNode(nodeType, start, end, {
      value
    });
  }

  parseTransitionEffectClause() {
    const start = this.expectValue('effect', 'Expected transition effect clause.');
    const effect = this.parseQualifiedIdentifierAllowReserved('Expected transition effect.');
    this.consumeStatementEnd('Expected statement end after transition effect.');
    const end = effect && effect.endToken ? effect.endToken : this.previous();
    return this.createNode('RmtTransitionEffectClause', start, end, {
      effect: effect && effect.value,
      effectNode: effect
    });
  }

  parseTransitionDurationClause() {
    const start = this.expectValue('durationMs', 'Expected transition durationMs clause.');
    const value = this.parsePrimitiveValue();
    this.consumeStatementEnd('Expected statement end after transition durationMs.');
    const end = value ? getNodeEndToken(value) : this.previous();
    return this.createNode('RmtTransitionDurationClause', start, end, {
      value
    });
  }

  parseTransitionEasingClause() {
    const start = this.expectValue('easing', 'Expected transition easing clause.');
    const value = this.parsePrimitiveValue();
    this.consumeStatementEnd('Expected statement end after transition easing.');
    const end = value ? getNodeEndToken(value) : this.previous();
    return this.createNode('RmtTransitionEasingClause', start, end, {
      value
    });
  }

  parseTransitionLaneClause() {
    const start = this.expectValue('lane', 'Expected transition lane clause.');
    const lane = this.parseQualifiedIdentifierAllowReserved('Expected transition lane.');
    this.consumeStatementEnd('Expected statement end after transition lane.');
    const end = lane && lane.endToken ? lane.endToken : this.previous();
    return this.createNode('RmtTransitionLaneClause', start, end, {
      lane: lane && lane.value,
      laneNode: lane
    });
  }

  parsePortalDeclaration(scope = {}) {
    const start = this.expectValue('portal', 'Expected portal declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected portal identifier.');
    const attributes = this.parseInlinePrimitiveAttributes(['root', 'layer', 'z']);
    const body = this.matches('{') ? this.parseGenericPrimitiveBlock('RmtPortalPolicyClause') : { items: [], endToken: null };
    if (!body.endToken) this.consumeStatementEnd('Expected statement end after portal declaration.');
    else this.consumeOptionalStatementEnd();
    const end = body.endToken || this.previous();
    return this.createNode('RmtPortalDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      attributes,
      body: body.items,
      scope
    });
  }

  parseOverlayDeclaration(scope = {}) {
    const start = this.expectValue('overlay', 'Expected overlay declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected overlay identifier.');
    const attributes = this.parseInlinePrimitiveAttributes(['kind', 'portal']);
    const body = this.matches('{') ? this.parseGenericPrimitiveBlock('RmtOverlayPolicyClause') : { items: [], endToken: null };
    if (!body.endToken) this.consumeStatementEnd('Expected statement end after overlay declaration.');
    else this.consumeOptionalStatementEnd();
    const end = body.endToken || this.previous();
    return this.createNode('RmtOverlayDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      attributes,
      body: body.items,
      scope
    });
  }

  parseResourceDeclaration(scope = {}) {
    const start = this.expectValue('resource', 'Expected resource declaration.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected resource identifier.');
    const attributes = this.parseInlinePrimitiveAttributes(['kind', 'owner', 'source']);
    const body = this.matches('{') ? this.parseResourceBlock() : { items: [], endToken: null };
    if (!body.endToken) this.consumeStatementEnd('Expected statement end after resource declaration.');
    else this.consumeOptionalStatementEnd();
    const end = body.endToken || this.previous();
    return this.createNode('RmtResourceDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      attributes,
      body: body.items,
      scope
    });
  }

  parseSurfaceHeaderMetadata() {
    const attributes = [];
    while (!this.isAtEnd() && !this.matches('{') && !this.isStatementBoundary()) {
      if (['kind', 'component'].includes(this.current().value)) {
        attributes.push(this.parseInlineAttribute(this.current().value, 'RmtSurfaceHeaderClause'));
      } else {
        this.addDiagnostic(this.current(), 'Surface headers may contain kind and component clauses before the body.', RMT_VNEXT_CONTEXT_ERROR_CODE);
        this.consume();
      }
    }
    return attributes;
  }

  parseSurfacePrimitiveItem() {
    if (this.matches('source')) return this.parsePrimitiveReferenceClause('source', 'RmtSurfaceSourceClause');
    if (this.matches('repeat')) return this.parseRepeatClause();
    if (this.matches('key')) return this.parseKeywordPathClause('key', 'RmtSurfaceKeyClause');
    if (this.matches('portal')) return this.parseKeywordPathClause('portal', 'RmtSurfacePortalClause');
    if (this.matches('bounds')) return this.parseBoundsClause();
    if (this.matches('preserve')) return this.parseRawPrimitiveClause('preserve', 'RmtSurfacePreserveClause');
    if (this.matches('destroy')) return this.parseRawPrimitiveClause('destroy', 'RmtSurfaceDestroyClause');
    return null;
  }

  isStatementBoundary() {
    const token = this.current();
    return token.type === 'newline' || token.value === ';' || token.value === '}' || token.type === 'eof';
  }

  tokenText(token) {
    if (!token) return '';
    if (token.raw) return token.raw;
    if (token.type === 'string') return JSON.stringify(token.value);
    return String(token.value);
  }

  rawTextFromTokens(tokens) {
    if (!tokens || tokens.length === 0) return '';
    const start = tokens[0].startOffset;
    const end = tokens[tokens.length - 1].endOffset;
    return this.sourceModel.text.slice(start, end).trim();
  }

  collectTokensUntilStatementEnd(options = {}) {
    const stopValues = new Set(options.stopValues || []);
    const tokens = [];
    let parenDepth = 0;
    let bracketDepth = 0;

    while (!this.isAtEnd()) {
      const token = this.current();
      if (parenDepth === 0 && bracketDepth === 0 && (this.isStatementBoundary() || stopValues.has(token.value))) {
        break;
      }
      if (token.value === '(') parenDepth += 1;
      if (token.value === ')') parenDepth = Math.max(0, parenDepth - 1);
      if (token.value === '[') bracketDepth += 1;
      if (token.value === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      tokens.push(this.consume());
    }

    return tokens;
  }

  parseTypeReference(message, stopValues = []) {
    const start = this.current();
    const tokens = this.collectTokensUntilStatementEnd({ stopValues });
    if (tokens.length === 0) {
      this.addDiagnostic(start, message || 'Expected type reference.');
      return null;
    }
    const end = tokens[tokens.length - 1];
    return this.createNode('RmtTypeReference', tokens[0], end, {
      value: this.rawTextFromTokens(tokens),
      tokens: tokens.map((token) => this.tokenText(token))
    });
  }

  parsePrimitiveValue() {
    const token = this.current();
    if (token.type === 'string' || token.type === 'integer' || token.value === 'true' || token.value === 'false' || token.value === 'null') {
      this.consume();
      let value = token.value;
      if (token.value === 'true') value = true;
      if (token.value === 'false') value = false;
      if (token.value === 'null') value = null;
      return this.createNode('RmtPrimitiveValue', token, token, {
        kind: 'literal',
        value
      });
    }

    if (token.value === '[') {
      const start = this.consume();
      const items = [];
      this.skipSeparators();
      while (!this.isAtEnd() && !this.matches(']')) {
        if (this.matches(',')) {
          this.consume();
          this.skipSeparators();
        } else {
          items.push(this.parsePrimitiveValue());
          this.skipSeparators();
          if (this.matches(',')) {
            this.consume();
            this.skipSeparators();
          }
        }
      }
      const end = this.expectValue(']', 'Expected closing bracket for array literal.') || this.previous();
      return this.createNode('RmtPrimitiveValue', start, end, {
        kind: 'array',
        items
      });
    }

    if (token.value === '{') {
      const start = this.consume();
      const fields = [];
      this.skipSeparators();
      while (!this.isAtEnd() && !this.matches('}')) {
        if (this.matches(',')) {
          this.consume();
          this.skipSeparators();
          continue;
        }

        const keyToken = this.current();
        let key = null;
        let keyNode = null;
        if (keyToken.type === 'string') {
          this.consume();
          key = keyToken.value;
          keyNode = this.createNode('RmtObjectValueKey', keyToken, keyToken, {
            value: key
          });
        } else {
          keyNode = this.parseQualifiedIdentifierAllowReserved('Expected object value key.');
          key = keyNode && keyNode.value;
        }

        const value = this.parsePrimitiveValue();
        const end = value ? getNodeEndToken(value) : this.previous();
        fields.push(this.createNode('RmtObjectValueField', keyNode && keyNode.startToken || keyToken, end, {
          key,
          keyNode,
          value
        }));
        this.skipSeparators();
        if (this.matches(',')) {
          this.consume();
          this.skipSeparators();
        }
      }
      const end = this.expectValue('}', 'Expected closing brace for object literal.') || this.previous();
      return this.createNode('RmtPrimitiveValue', start, end, {
        kind: 'object',
        fields
      });
    }

    if (token.type === 'identifier') {
      const path = this.parseQualifiedIdentifierAllowReserved('Expected value.');
      return this.createNode('RmtPrimitiveValue', path.startToken, path.endToken, {
        kind: 'path',
        value: path.value,
        path: path.parts,
        pathNode: path
      });
    }

    this.addDiagnostic(token, 'Expected primitive value.');
    this.consume();
    return this.createNode('RmtPrimitiveValue', token, token, {
      kind: 'missing',
      value: null
    });
  }

  parsePrimitiveSourceReference() {
    const start = this.expectValue('from', 'Expected from clause.');
    const kindToken = this.current();
    let kind = null;
    if (kindToken.type === 'identifier') {
      kind = kindToken.value;
      this.consume();
    } else {
      this.addDiagnostic(kindToken, 'Expected source kind.');
      this.consume();
    }

    const valueToken = this.current();
    let value = null;
    let valueNode = null;
    if (valueToken.type === 'string') {
      value = valueToken.value;
      valueNode = this.createNode('RmtPrimitiveValue', valueToken, valueToken, { kind: 'literal', value });
      this.consume();
    } else {
      valueNode = this.parseQualifiedIdentifierAllowReserved('Expected source reference.');
      value = valueNode && valueNode.value;
    }

    const end = valueNode && (valueNode.endToken || getNodeEndToken(valueNode)) || this.previous();
    return this.createNode('RmtPrimitiveSourceReference', start, end, {
      kind,
      value,
      valueNode
    });
  }

  parseRawPrimitiveClause(keyword, nodeType) {
    const start = this.expectValue(keyword, `Expected ${keyword} clause.`);
    const tokens = this.collectTokensUntilStatementEnd();
    this.consumeStatementEnd(`Expected statement end after ${keyword} clause.`);
    const end = tokens.length > 0 ? tokens[tokens.length - 1] : this.previous();
    return this.createNode(nodeType, start, end, {
      keyword,
      text: this.rawTextFromTokens(tokens),
      tokens: tokens.map((token) => this.tokenText(token))
    });
  }

  parseSelectorSortClause() {
    const start = this.expectValue('sort', 'Expected sort clause.');
    let by = null;
    if (this.matches('by')) {
      this.consume();
      by = this.parseQualifiedIdentifierAllowReserved('Expected sort path.');
    }
    let direction = null;
    if (!this.isStatementBoundary()) {
      direction = this.current().value;
      this.consume();
    }
    this.consumeStatementEnd('Expected statement end after sort clause.');
    const end = this.previous();
    return this.createNode('RmtSelectorSortClause', start, end, {
      by: by && by.value,
      byNode: by,
      direction
    });
  }

  parseOutputClause() {
    const start = this.expectValue('output', 'Expected output clause.');
    const dataType = this.parseTypeReference('Expected output type.');
    this.consumeStatementEnd('Expected statement end after output clause.');
    const end = dataType ? getNodeEndToken(dataType) : this.previous();
    return this.createNode('RmtSelectorOutputClause', start, end, {
      dataType
    });
  }

  parseKeywordValueClause(keyword, nodeType) {
    const start = this.expectValue(keyword, `Expected ${keyword} clause.`);
    const value = this.parsePrimitiveValue();
    this.consumeStatementEnd(`Expected statement end after ${keyword} clause.`);
    const end = value ? getNodeEndToken(value) : this.previous();
    return this.createNode(nodeType, start, end, {
      keyword,
      value
    });
  }

  parseInlineAttribute(keyword, nodeType) {
    const start = this.expectValue(keyword, `Expected ${keyword} attribute.`);
    const value = this.parsePrimitiveValue();
    const end = value ? getNodeEndToken(value) : this.previous();
    return this.createNode(nodeType, start, end, {
      keyword,
      value
    });
  }

  parseKeywordPathClause(keyword, nodeType) {
    const start = this.expectValue(keyword, `Expected ${keyword} clause.`);
    const path = this.parseQualifiedIdentifierAllowReserved(`Expected ${keyword} path.`);
    this.consumeStatementEnd(`Expected statement end after ${keyword} clause.`);
    const end = path && path.endToken ? path.endToken : this.previous();
    return this.createNode(nodeType, start, end, {
      keyword,
      path: path && path.value,
      pathNode: path
    });
  }

  parseFallbackClause() {
    const start = this.expectValue('fallback', 'Expected fallback clause.');
    const kind = this.current().type === 'identifier' ? this.consume() : null;
    const value = this.parseQualifiedIdentifierAllowReserved('Expected fallback reference.');
    this.consumeStatementEnd('Expected statement end after fallback clause.');
    const end = value && value.endToken ? value.endToken : this.previous();
    return this.createNode('RmtDataSourceFallbackClause', start, end, {
      kind: kind && kind.value,
      value: value && value.value,
      valueNode: value
    });
  }

  parseActionInputClause() {
    const start = this.expectValue('input', 'Expected input clause.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected input identifier.');
    const dataType = this.parseTypeReference('Expected input type.');
    this.consumeStatementEnd('Expected statement end after input clause.');
    const end = dataType ? getNodeEndToken(dataType) : this.previous();
    return this.createNode('RmtActionInputClause', start, end, {
      name: name && name.value,
      nameNode: name,
      dataType
    });
  }

  parseActionEffectStatement() {
    const start = this.expectValue('effect', 'Expected effect statement.');
    const effectKind = this.current().type === 'identifier' ? this.consume() : null;
    let source = null;
    if (this.matches('datasource') || this.matches('resource') || this.matches('selector')) {
      const sourceKind = this.consume();
      const sourceRef = this.parseQualifiedIdentifierAllowReserved('Expected effect source reference.');
      source = {
        kind: sourceKind.value,
        value: sourceRef && sourceRef.value,
        valueNode: sourceRef
      };
    }
    this.consumeStatementEnd('Expected statement end after effect statement.');
    const end = this.previous();
    return this.createNode('RmtEffectStatement', start, end, {
      effectKind: effectKind && effectKind.value,
      source
    });
  }

  parseReduceStatement() {
    const start = this.expectValue('reduce', 'Expected reduce statement.');
    const target = this.parseQualifiedIdentifierAllowReserved('Expected reducer target.');
    this.expectValue('=', 'Expected = in reduce statement.');
    const expressionTokens = this.collectTokensUntilStatementEnd();
    this.consumeStatementEnd('Expected statement end after reduce statement.');
    const end = expressionTokens.length > 0 ? expressionTokens[expressionTokens.length - 1] : this.previous();
    return this.createNode('RmtReducerStatement', start, end, {
      target: target && target.value,
      targetNode: target,
      expression: this.rawTextFromTokens(expressionTokens),
      expressionTokens: expressionTokens.map((token) => this.tokenText(token))
    });
  }

  parseReducerRecipeStatement() {
    const start = this.expectValue('recipe', 'Expected recipe statement.');
    const recipeValue = this.parsePrimitiveValue();
    if (!this.matches('target')) {
      this.addDiagnostic(this.current(), 'Expected target in reducer recipe statement.', RMT_VNEXT_CONTEXT_ERROR_CODE);
    } else {
      this.consume();
    }
    const target = this.parseQualifiedIdentifierAllowReserved('Expected reducer recipe target.');
    let valueExpression = '';
    let valueTokens = [];
    if (this.matches('value')) {
      this.consume();
      valueTokens = this.collectTokensUntilStatementEnd();
      valueExpression = this.rawTextFromTokens(valueTokens);
    }
    this.consumeStatementEnd('Expected statement end after reducer recipe statement.');
    const end = valueTokens.length > 0 ? valueTokens[valueTokens.length - 1] : this.previous();
    return this.createNode('RmtReducerRecipeStatement', start, end, {
      recipe: recipeValue,
      target: target && target.value,
      targetNode: target,
      valueExpression,
      valueTokens: valueTokens.map((token) => this.tokenText(token))
    });
  }

  parseEmitStatement() {
    const start = this.expectValue('emit', 'Expected emit statement.');
    const event = this.parseQualifiedIdentifierAllowReserved('Expected emitted event identifier.');
    const payload = [];
    if (this.matches('with')) {
      this.consume();
      while (!this.isStatementBoundary()) {
        const key = this.parseQualifiedIdentifierAllowReserved('Expected payload key.');
        const value = this.parsePrimitiveValue();
        payload.push({
          key: key && key.value,
          keyNode: key,
          value
        });
      }
    }
    this.consumeStatementEnd('Expected statement end after emit statement.');
    const end = this.previous();
    return this.createNode('RmtEmitStatement', start, end, {
      event: event && event.value,
      eventNode: event,
      payload
    });
  }

  parseActionResultHandler() {
    const start = this.expectValue('on', 'Expected action result handler.');
    const phase = this.parseQualifiedIdentifierAllowReserved('Expected action result phase.');
    this.expectValue('->', 'Expected -> in action result handler.');
    const effectTokens = this.collectTokensUntilStatementEnd();
    this.consumeStatementEnd('Expected statement end after action result handler.');
    const end = effectTokens.length > 0 ? effectTokens[effectTokens.length - 1] : this.previous();
    return this.createNode('RmtActionResultHandler', start, end, {
      phase: phase && phase.value,
      phaseNode: phase,
      effect: {
        kind: effectTokens[0] && effectTokens[0].value || null,
        text: this.rawTextFromTokens(effectTokens),
        tokens: effectTokens.map((token) => this.tokenText(token))
      }
    });
  }

  parseInlinePrimitiveAttributes(keywords = []) {
    const allowed = new Set(keywords);
    const attributes = [];
    while (!this.isAtEnd() && !this.matches('{') && !this.isStatementBoundary()) {
      const keyword = this.current().value;
      if (allowed.has(keyword)) {
        attributes.push(this.parseInlineAttribute(keyword, 'RmtPrimitiveAttribute'));
      } else {
        this.addDiagnostic(this.current(), `Unexpected inline primitive attribute "${keyword}".`, RMT_VNEXT_CONTEXT_ERROR_CODE);
        this.consume();
      }
    }
    return attributes;
  }

  parseGenericPrimitiveBlock(nodeType) {
    return this.parseBlock(() => {
      const start = this.current();
      const tokens = this.collectTokensUntilStatementEnd();
      this.consumeStatementEnd('Expected statement end after primitive policy clause.');
      const end = tokens.length > 0 ? tokens[tokens.length - 1] : start;
      return this.createNode(nodeType, start, end, {
        text: this.rawTextFromTokens(tokens),
        tokens: tokens.map((token) => this.tokenText(token))
      });
    });
  }

  parseResourceBlock() {
    return this.parseBlock(() => {
      if (this.matches('import')) return this.parseKeywordValueClause('import', 'RmtResourceImportClause');
      if (this.matches('source')) return this.parsePrimitiveReferenceClause('source', 'RmtResourceSourceClause');
      if (this.matches('dispose')) return this.parseRawPrimitiveClause('dispose', 'RmtResourceDisposeClause');
      this.addDiagnostic(this.current(), 'Resource blocks may contain import, source and dispose clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
  }

  parsePrimitiveReferenceClause(keyword, nodeType) {
    const start = this.expectValue(keyword, `Expected ${keyword} clause.`);
    const kind = this.current().type === 'identifier' ? this.consume() : null;
    const ref = this.parseQualifiedIdentifierAllowReserved(`Expected ${keyword} reference.`);
    this.consumeStatementEnd(`Expected statement end after ${keyword} clause.`);
    const end = ref && ref.endToken ? ref.endToken : this.previous();
    return this.createNode(nodeType, start, end, {
      keyword,
      kind: kind && kind.value,
      ref: ref && ref.value,
      refNode: ref
    });
  }

  parseRepeatClause() {
    const start = this.expectValue('repeat', 'Expected repeat clause.');
    const source = this.matches('from') ? this.parsePrimitiveSourceReference() : null;
    this.consumeStatementEnd('Expected statement end after repeat clause.');
    const end = source ? getNodeEndToken(source) : this.previous();
    return this.createNode('RmtSurfaceRepeatClause', start, end, {
      source
    });
  }

  parseBoundsClause() {
    const start = this.expectValue('bounds', 'Expected bounds clause.');
    const fields = [];
    while (!this.isStatementBoundary()) {
      const key = this.parseQualifiedIdentifierAllowReserved('Expected bounds key.');
      const value = this.parsePrimitiveValue();
      fields.push({
        key: key && key.value,
        keyNode: key,
        value
      });
    }
    this.consumeStatementEnd('Expected statement end after bounds clause.');
    const end = this.previous();
    return this.createNode('RmtSurfaceBoundsClause', start, end, {
      fields
    });
  }

  parseRemoteSurfaceDeclaration() {
    const start = this.expectValue('remote', 'Expected remote surface declaration.');
    this.expectValue('surface', 'Expected surface keyword after remote.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected remote surface identifier.');
    this.expectValue('from', 'Expected from in remote surface declaration.');
    this.expectValue('remote', 'Expected remote keyword after from.');
    const remoteToken = this.current();
    let remoteId = null;
    if (remoteToken.type === 'string') {
      remoteId = remoteToken.value;
      this.consume();
    } else {
      this.addDiagnostic(remoteToken, 'Remote id must be a static string.');
      this.consume();
    }

    const body = this.parseBlock(() => this.parseRemoteSurfaceItem(name && name.value));
    const end = body.endToken || this.previous();

    return this.createNode('RmtRemoteSurfaceDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      remoteId,
      body: body.items
    });
  }

  parseRemoteSurfaceItem(surfaceName) {
    if (this.matches('owner')) return this.parseRemoteOwnerClause();
    if (this.matches('version')) return this.parseRemoteStringClause('version', 'RmtRemoteVersionClause', 'Expected remote version string.');
    if (this.matches('origin')) return this.parseRemoteStringClause('origin', 'RmtRemoteOriginClause', 'Expected remote origin string.');
    if (this.matches('integrity')) return this.parseRemoteIntegrityClause();
    if (this.matches('trust')) return this.parseRemoteTrustBoundaryClause();
    if (this.matches('fallback')) return this.parseRemoteFallbackClause();
    if (this.matches('exposes')) return this.parseRemoteExposeClause(surfaceName);
    if (this.matches('emits') || this.matches('consumes')) return this.parseRemoteEventClause(surfaceName);

    this.addDiagnostic(this.current(), 'Remote surfaces may contain owner, version, origin, integrity, trust boundary, fallback, exposes, emits and consumes clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
    this.skipStatementOrBlock();
    return null;
  }

  parseRemoteOwnerClause() {
    const start = this.expectValue('owner', 'Expected owner clause.');
    let ownerKind = 'team';
    if (this.matches('team')) {
      ownerKind = this.consume().value;
    }
    const ownerToken = this.current();
    let ownerId = null;
    if (ownerToken.type === 'string') {
      ownerId = ownerToken.value;
      this.consume();
    } else {
      this.addDiagnostic(ownerToken, 'Remote owner must be a static string.');
      this.consume();
    }
    this.consumeStatementEnd('Expected statement end after owner clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteOwnerClause', start, end, {
      kind: ownerKind,
      id: ownerId
    });
  }

  parseRemoteStringClause(keyword, nodeType, message) {
    const start = this.expectValue(keyword, `Expected ${keyword} clause.`);
    const valueToken = this.current();
    let value = null;
    if (valueToken.type === 'string') {
      value = valueToken.value;
      this.consume();
    } else {
      this.addDiagnostic(valueToken, message);
      this.consume();
    }
    this.consumeStatementEnd(`Expected statement end after ${keyword} clause.`);
    const end = this.previous();

    return this.createNode(nodeType, start, end, {
      value
    });
  }

  parseRemoteIntegrityClause() {
    const start = this.expectValue('integrity', 'Expected integrity clause.');
    const algorithm = this.parseQualifiedIdentifierAllowReserved('Expected integrity algorithm.');
    const digestToken = this.current();
    let digest = null;
    if (digestToken.type === 'string') {
      digest = digestToken.value;
      this.consume();
    } else {
      this.addDiagnostic(digestToken, 'Integrity digest must be a static string.');
      this.consume();
    }
    this.consumeStatementEnd('Expected statement end after integrity clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteIntegrityClause', start, end, {
      algorithm: algorithm && algorithm.value,
      algorithmNode: algorithm,
      digest
    });
  }

  parseRemoteTrustBoundaryClause() {
    const start = this.expectValue('trust', 'Expected trust boundary clause.');
    this.expectValue('boundary', 'Expected boundary keyword in remote trust clause.');
    const boundaryToken = this.current();
    let boundary = null;
    if (boundaryToken.type === 'string') {
      boundary = boundaryToken.value;
      this.consume();
    } else {
      this.addDiagnostic(boundaryToken, 'Remote trust boundary must be a static string.');
      this.consume();
    }
    this.consumeStatementEnd('Expected statement end after remote trust boundary clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteTrustBoundaryClause', start, end, {
      boundary
    });
  }

  parseRemoteFallbackClause() {
    const start = this.expectValue('fallback', 'Expected fallback clause.');
    this.expectValue('surface', 'Expected surface keyword in fallback clause.');
    const ref = this.parseQualifiedIdentifierAllowReserved('Expected fallback surface identifier.');
    this.consumeStatementEnd('Expected statement end after fallback clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteFallbackClause', start, end, {
      kind: 'surface',
      ref: ref && ref.value,
      refNode: ref
    });
  }

  parseRemoteExposeClause(surfaceName) {
    const start = this.expectValue('exposes', 'Expected exposes clause.');
    this.expectValue('lane', 'Expected lane keyword in exposes clause.');
    const lane = this.parseQualifiedIdentifierAllowReserved('Expected exposed lane identifier.');
    this.expectValue('->', 'Expected -> in exposes clause.');
    const target = this.parseRemoteShellTarget('Expected shell target in exposes clause.');
    this.consumeStatementEnd('Expected statement end after exposes clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteExposeClause', start, end, {
      surface: surfaceName,
      lane: lane && lane.value,
      laneNode: lane,
      target
    });
  }

  parseRemoteEventClause(surfaceName) {
    const start = this.consume();
    const kind = start.value;
    const event = this.parseQualifiedIdentifierAllowReserved('Expected remote event identifier.');
    const body = this.parseBlock(() => this.parseRemoteEventItem(kind));
    const end = body.endToken || this.previous();

    return this.createNode('RmtRemoteEventClause', start, end, {
      surface: surfaceName,
      kind,
      event: event && event.value,
      eventNode: event,
      body: body.items
    });
  }

  parseRemoteEventItem(kind) {
    if (this.matches('owner')) return this.parseRemoteOwnerClause();
    if (this.matches('direction')) return this.parseRemoteEventDirectionClause(kind);
    if (this.matches('lane')) return this.parseRemoteEventLaneClause();
    if (this.matches('from')) return this.parseRemoteEventFromClause();
    if (this.matches('payload')) return this.parseRemoteStringClause('payload', 'RmtRemoteEventPayloadClause', 'Expected event payload schema string.');

    this.addDiagnostic(this.current(), 'Remote event clauses may contain owner, direction, lane, from and payload only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
    this.skipStatementOrBlock();
    return null;
  }

  parseRemoteEventDirectionClause(kind) {
    const start = this.expectValue('direction', 'Expected direction clause.');
    const token = this.current();
    let direction = null;
    if (token.value === 'outbound' || token.value === 'inbound') {
      direction = token.value;
      this.consume();
    } else {
      this.addDiagnostic(token, 'Event direction must be outbound or inbound.');
      this.consume();
    }
    this.consumeStatementEnd('Expected statement end after direction clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteEventDirectionClause', start, end, {
      direction: direction || (kind === 'emits' ? 'outbound' : 'inbound')
    });
  }

  parseRemoteEventLaneClause() {
    const start = this.expectValue('lane', 'Expected lane clause.');
    const lane = this.parseQualifiedIdentifierAllowReserved('Expected event lane identifier.');
    this.consumeStatementEnd('Expected statement end after lane clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteEventLaneClause', start, end, {
      lane: lane && lane.value,
      laneNode: lane
    });
  }

  parseRemoteEventFromClause() {
    const start = this.expectValue('from', 'Expected from clause.');
    const source = this.parseRemoteShellTarget('Expected event source scope.');
    this.consumeStatementEnd('Expected statement end after from clause.');
    const end = this.previous();

    return this.createNode('RmtRemoteEventFromClause', start, end, {
      source
    });
  }

  parseRemoteShellTarget(message) {
    const target = this.parseQualifiedIdentifierAllowReserved(message || 'Expected shell target.');
    let ref = target && target.value;
    if (target && target.value && this.current().type === 'string') {
      ref = `${target.value}:${this.current().value}`;
      this.consume();
    } else if (target && target.value === 'shell.session') {
      ref = 'shell.session:current';
    }

    return {
      type: target && target.value,
      ref,
      targetNode: target
    };
  }

  parseLaneDeclaration(templateName, surfaceName) {
    const start = this.expectValue('lane', 'Expected lane declaration.');
    const name = this.parseQualifiedIdentifier('Expected lane identifier.');
    let weight = null;

    while (this.matches('weight')) {
      this.consume();
      const weightToken = this.current();
      if (weightToken.type !== 'integer') {
        this.addDiagnostic(weightToken, 'Lane weight must be a nonnegative integer.');
        this.consume();
      } else {
        weight = weightToken.value;
        this.consume();
      }
    }

    const body = this.parseBlock(() => this.parseLaneItem(templateName, surfaceName, name && name.value));
    const end = body.endToken || this.previous();

    return this.createNode('RmtLaneDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      weight,
      body: body.items
    });
  }

  parseLaneItem(templateName, surfaceName, laneName) {
    if (LIFECYCLE_OPERATIONS.has(this.current().value)) {
      return this.parseLifecycleStatement({
        templateName,
        surfaceName,
        laneName
      });
    }
    if (this.matches('stream')) {
      return this.parseStreamStatement({
        templateName,
        surfaceName,
        laneName
      });
    }
    this.addDiagnostic(this.current(), 'Lanes may contain lifecycle or stream statements only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
    this.skipStatementOrBlock();
    return null;
  }

  parseLifecycleStatement(scope = {}) {
    const start = this.consume();
    const target = this.parseTarget();
    const source = this.matches('from') ? this.parseSourceClause() : null;
    const condition = this.matches('when') ? this.parseConditionClause() : null;
    const policy = this.matches('{') ? this.parsePolicyBlock(scope) : null;

    if (!policy) {
      this.consumeStatementEnd('Expected statement end after lifecycle statement.');
    } else {
      this.consumeOptionalStatementEnd();
    }

    const end = policy ? getNodeEndToken(policy) : this.previous();
    return this.createNode('RmtLifecycleStatement', start, end, {
      op: start.value,
      target,
      source,
      condition,
      policy,
      scope
    });
  }

  parseStreamStatement(scope = {}) {
    const start = this.expectValue('stream', 'Expected stream statement.');
    const target = this.parseTarget();
    let source = null;

    if (this.matches('from')) {
      source = this.parseSourceClause();
    } else {
      this.addDiagnostic(this.current(), 'Stream statements require a data source.');
    }

    const condition = this.matches('when') ? this.parseConditionClause() : null;
    const policy = this.matches('{') ? this.parsePolicyBlock(scope) : null;

    if (!policy) {
      this.consumeStatementEnd('Expected statement end after stream statement.');
    } else {
      this.consumeOptionalStatementEnd();
    }

    const end = policy ? getNodeEndToken(policy) : this.previous();
    return this.createNode('RmtStreamStatement', start, end, {
      op: 'stream',
      target,
      source,
      condition,
      policy,
      scope
    });
  }

  parseSourceClause() {
    const start = this.expectValue('from', 'Expected data source clause.');
    const kindToken = this.current();
    let kind = null;

    if (SOURCE_KINDS.has(kindToken.value)) {
      kind = kindToken.value;
      this.consume();
    } else {
      this.addDiagnostic(kindToken, 'Data source kind must be endpoint, sse or worker.');
      this.consume();
    }

    const target = this.parseQualifiedIdentifier('Expected data source identifier.');
    const end = target && target.endToken ? target.endToken : this.previous();

    return this.createNode('RmtSourceClause', start, end, {
      kind,
      target: target && target.value,
      targetNode: target
    });
  }

  parseConditionClause() {
    const start = this.expectValue('when', 'Expected condition clause.');
    const expression = this.parseExpression();
    const end = expression ? getNodeEndToken(expression) : this.previous();

    return this.createNode('RmtConditionClause', start, end, {
      expression
    });
  }

  parseExpression() {
    return this.parseOrExpression();
  }

  parseOrExpression() {
    let left = this.parseAndExpression();
    while (this.matches('||')) {
      const operator = this.consume();
      const right = this.parseAndExpression();
      left = this.createNode('RmtConditionExpression', getNodeStartToken(left), getNodeEndToken(right || left), {
        kind: 'logical',
        op: operator.value,
        left,
        right
      });
    }
    return left;
  }

  parseAndExpression() {
    let left = this.parseUnaryExpression();
    while (this.matches('&&')) {
      const operator = this.consume();
      const right = this.parseUnaryExpression();
      left = this.createNode('RmtConditionExpression', getNodeStartToken(left), getNodeEndToken(right || left), {
        kind: 'logical',
        op: operator.value,
        left,
        right
      });
    }
    return left;
  }

  parseUnaryExpression() {
    if (this.matches('!')) {
      const operator = this.consume();
      const argument = this.parseUnaryExpression();
      return this.createNode('RmtConditionExpression', operator, getNodeEndToken(argument || operator), {
        kind: 'unary',
        op: '!',
        argument
      });
    }
    return this.parseCompareExpression();
  }

  parseCompareExpression() {
    let left = this.parsePrimaryExpression();
    if (COMPARISON_OPERATORS.has(this.current().value)) {
      const operator = this.consume();
      const right = this.parsePrimaryExpression();
      left = this.createNode('RmtConditionExpression', getNodeStartToken(left), getNodeEndToken(right || left), {
        kind: 'binary',
        op: operator.value,
        left,
        right
      });
    }
    return left;
  }

  parsePrimaryExpression() {
    const token = this.current();

    if (token.value === '(') {
      const start = this.consume();
      const expression = this.parseExpression();
      const end = this.expectValue(')', 'Expected closing parenthesis in condition.');
      return this.createNode('RmtConditionExpression', start, end || getNodeEndToken(expression), {
        kind: 'group',
        expression
      });
    }

    if (token.type === 'string' || token.type === 'integer' || token.value === 'true' || token.value === 'false' || token.value === 'null') {
      this.consume();
      let value = token.value;
      if (token.value === 'true') value = true;
      if (token.value === 'false') value = false;
      if (token.value === 'null') value = null;
      return this.createNode('RmtConditionExpression', token, token, {
        kind: 'literal',
        value
      });
    }

    if (this.isIdentifierToken(token)) {
      const path = this.parseQualifiedIdentifier('Expected condition path.');

      if (this.matches('(')) {
        this.addDiagnostic(this.current(), 'Function calls are not allowed in RMT vNext conditions.');
        this.skipParenthesized();
      }

      return this.createNode('RmtConditionExpression', path.startToken, path.endToken, {
        kind: 'path',
        path: path.parts,
        value: path.value
      });
    }

    this.addDiagnostic(token, 'Expected condition expression.');
    this.consume();
    return this.createNode('RmtConditionExpression', token, token, {
      kind: 'missing'
    });
  }

  parsePolicyBlock(scope = {}) {
    const start = this.expectValue('{', 'Expected policy block.');
    const body = [];
    this.skipSeparators();

    while (!this.isAtEnd() && !this.matches('}')) {
      let item = null;
      if (this.matches('slot')) {
        item = this.parseSlotDeclaration(scope);
      } else if (this.matches('on')) {
        item = this.parseEventBinding();
      } else if (this.matches('trust')) {
        item = this.parseTrustPolicy();
      } else if (this.matches('hydration')) {
        item = this.parseHydrationPolicy();
      } else if (this.matches('resumability')) {
        item = this.parseResumabilityPolicy();
      } else if (this.matches('isolation')) {
        item = this.parseIsolationPolicy();
      } else if (this.matches('sanitize')) {
        item = this.parseSanitizePolicy();
      } else {
        this.addDiagnostic(this.current(), 'Policy blocks may contain slots, event bindings, hydration policies, resumability policies, isolation policies and security policies only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
        this.skipStatementOrBlock();
      }
      if (item) body.push(item);
      this.skipSeparators();
    }

    const end = this.expectValue('}', 'Expected closing brace for policy block.') || this.previous();
    return this.createNode('RmtPolicyBlock', start, end, {
      body,
      scope
    });
  }

  parseSlotDeclaration(scope = {}) {
    const start = this.expectValue('slot', 'Expected slot declaration.');
    const name = this.parseQualifiedIdentifier('Expected slot identifier.');
    const body = this.parseBlock(() => {
      if (LIFECYCLE_OPERATIONS.has(this.current().value)) {
        return this.parseLifecycleStatement(scope);
      }
      if (this.matches('stream')) {
        return this.parseStreamStatement(scope);
      }
      this.addDiagnostic(this.current(), 'Slots may contain lifecycle or stream statements only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();

    return this.createNode('RmtSlotDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      body: body.items
    });
  }

  parseEventBinding() {
    const start = this.expectValue('on', 'Expected event binding.');
    const event = this.parseQualifiedIdentifier('Expected event identifier.');
    let selector = null;
    let target = null;
    if (this.current().type === 'string') {
      const selectorToken = this.consume();
      selector = this.createNode('RmtEventSelector', selectorToken, selectorToken, {
        value: selectorToken.value
      });
    }
    if (this.matches('target')) {
      this.consume();
      target = this.parseQualifiedIdentifierAllowReserved('Expected event target.');
    }
    this.expectValue('->', 'Expected -> in event binding.');
    this.expectValue('action', 'Expected action keyword in event binding.');
    const action = this.parseQualifiedIdentifier('Expected action identifier.');
    const condition = this.matches('when') ? this.parseConditionClause() : null;
    const policy = this.matches('{') ? this.parseEventPayloadBlock() : null;
    if (!policy) {
      this.consumeStatementEnd('Expected statement end after event binding.');
    } else {
      this.consumeOptionalStatementEnd();
    }
    const end = policy ? getNodeEndToken(policy) : this.previous();

    return this.createNode('RmtEventBinding', start, end, {
      event: event && event.value,
      eventNode: event,
      selector,
      target: target && target.value,
      targetNode: target,
      action: action && action.value,
      actionNode: action,
      condition,
      policy
    });
  }

  parseEventPayloadBlock() {
    const start = this.expectValue('{', 'Expected event payload block.');
    const body = [];
    this.skipSeparators();
    while (!this.isAtEnd() && !this.matches('}')) {
      let item = null;
      if (this.matches('payload')) {
        item = this.parseEventPayloadMapping();
      } else if (this.matches('preventDefault')) {
        item = this.parseKeywordValueClause('preventDefault', 'RmtEventOptionClause');
      } else {
        this.addDiagnostic(this.current(), 'Event payload blocks may contain payload and preventDefault clauses only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
        this.skipStatementOrBlock();
      }
      if (item) body.push(item);
      this.skipSeparators();
    }
    const end = this.expectValue('}', 'Expected closing brace for event payload block.') || this.previous();
    return this.createNode('RmtEventPayloadBlock', start, end, {
      body
    });
  }

  parseEventPayloadMapping() {
    const start = this.expectValue('payload', 'Expected payload mapping.');
    const name = this.parseQualifiedIdentifierAllowReserved('Expected payload field name.');
    this.expectValue('from', 'Expected from in payload mapping.');
    const source = this.parseQualifiedIdentifierAllowReserved('Expected payload source path.');
    this.consumeStatementEnd('Expected statement end after payload mapping.');
    const end = source && source.endToken ? source.endToken : this.previous();
    return this.createNode('RmtEventPayloadMapping', start, end, {
      name: name && name.value,
      nameNode: name,
      source: source && source.value,
      sourceNode: source
    });
  }

  parseTrustPolicy() {
    const start = this.expectValue('trust', 'Expected trust policy.');
    this.expectValue('boundary', 'Expected boundary keyword in trust policy.');
    const boundary = this.current();
    let value = null;
    if (boundary.type === 'string') {
      value = boundary.value;
      this.consume();
    } else {
      this.addDiagnostic(boundary, 'Trust boundary must be a string.');
      this.consume();
    }
    this.consumeStatementEnd('Expected statement end after trust policy.');
    const end = this.previous();

    return this.createNode('RmtTrustBoundaryPolicy', start, end, {
      boundary: value
    });
  }

  parseHydrationPolicy() {
    const start = this.expectValue('hydration', 'Expected hydration policy.');
    const clause = this.current();
    const record = {
      policy: null,
      mode: null,
      insularHydration: null
    };

    if (this.matches('policy')) {
      this.consume();
      const value = this.parseQualifiedIdentifierAllowReserved('Expected hydration policy identifier.');
      record.policy = value && value.value;
    } else if (this.matches('mode')) {
      this.consume();
      const value = this.parseQualifiedIdentifierAllowReserved('Expected hydration mode identifier.');
      record.mode = value && value.value;
    } else if (this.matches('insular')) {
      this.consume();
      if (this.matches('true') || this.matches('false')) {
        record.insularHydration = this.current().value === 'true';
        this.consume();
      } else {
        const value = this.parseQualifiedIdentifierAllowReserved('Expected boolean or identifier after hydration insular.');
        record.insularHydration = value && value.value !== 'false';
      }
    } else {
      this.addDiagnostic(clause, 'Hydration policy must use policy, mode or insular.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.consume();
    }

    this.consumeStatementEnd('Expected statement end after hydration policy.');
    const end = this.previous();

    return this.createNode('RmtHydrationPolicy', start, end, record);
  }


  parseResumabilityPolicy() {
    const start = this.expectValue('resumability', 'Expected resumability policy.');
    const clause = this.current();
    const record = {
      mode: null,
      snapshot: null,
      eventReplay: null,
      integrity: null
    };

    if (this.matches('mode')) {
      this.consume();
      const value = this.parseQualifiedIdentifierAllowReserved('Expected resumability mode identifier.');
      record.mode = value && value.value;
    } else if (this.matches('snapshot')) {
      this.consume();
      const value = this.parseQualifiedIdentifierAllowReserved('Expected resumability snapshot identifier.');
      record.snapshot = value && value.value;
    } else if (this.matches('event')) {
      this.consume();
      if (this.matches('replay')) this.consume();
      const value = this.parseQualifiedIdentifierAllowReserved('Expected resumability event replay mode.');
      record.eventReplay = value && value.value;
    } else if (this.matches('integrity')) {
      this.consume();
      const value = this.parseQualifiedIdentifierAllowReserved('Expected resumability integrity mode.');
      record.integrity = value && value.value;
    } else {
      this.addDiagnostic(clause, 'Resumability policy must use mode, snapshot, event replay or integrity.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.consume();
    }

    this.consumeStatementEnd('Expected statement end after resumability policy.');
    const end = this.previous();

    return this.createNode('RmtResumabilityPolicy', start, end, record);
  }

  parseIsolationPolicy() {
    const start = this.expectValue('isolation', 'Expected isolation policy.');
    const clause = this.current();
    const record = {
      boundary: null,
      mode: null
    };

    if (this.matches('boundary')) {
      this.consume();
      const boundary = this.current();
      if (boundary.type === 'string') {
        record.boundary = boundary.value;
        this.consume();
      } else {
        const value = this.parseQualifiedIdentifierAllowReserved('Expected isolation boundary.');
        record.boundary = value && value.value;
      }
    } else if (this.matches('mode')) {
      this.consume();
      const value = this.parseQualifiedIdentifierAllowReserved('Expected isolation mode identifier.');
      record.mode = value && value.value;
    } else {
      this.addDiagnostic(clause, 'Isolation policy must use boundary or mode.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.consume();
    }

    this.consumeStatementEnd('Expected statement end after isolation policy.');
    const end = this.previous();

    return this.createNode('RmtIsolationPolicy', start, end, record);
  }

  parseSanitizePolicy() {
    const start = this.expectValue('sanitize', 'Expected sanitize policy.');
    const format = this.parseQualifiedIdentifier('Expected sanitize format.');
    this.consumeStatementEnd('Expected statement end after sanitize policy.');
    const end = this.previous();

    return this.createNode('RmtSanitizePolicy', start, end, {
      format: format && format.value,
      formatNode: format
    });
  }

  parseTarget() {
    return this.parseQualifiedIdentifier('Expected target identifier.');
  }

  parseQualifiedIdentifier(message) {
    const first = this.current();
    if (!this.isIdentifierToken(first)) {
      this.addDiagnostic(first, message || 'Expected identifier.');
      this.consume();
      return {
        type: 'RmtIdentifier',
        value: null,
        parts: [],
        startToken: first,
        endToken: first,
        range: createRange(this.sourceModel, first.startOffset, first.endOffset)
      };
    }

    const parts = [first.value];
    const start = this.consume();
    let end = start;

    while (this.matches('.')) {
      const dot = this.consume();
      const next = this.current();
      if (!this.isIdentifierToken(next)) {
        this.addDiagnostic(next, 'Expected identifier after dot.');
        end = dot;
        break;
      }
      parts.push(next.value);
      end = this.consume();
    }

    return {
      type: 'RmtIdentifier',
      value: parts.join('.'),
      parts,
      escaped: Boolean(start.escaped),
      startToken: start,
      endToken: end,
      range: createRange(this.sourceModel, start.startOffset, end.endOffset)
    };
  }

  parseQualifiedIdentifierAllowReserved(message) {
    const first = this.current();
    if (!first || first.type !== 'identifier') {
      this.addDiagnostic(first, message || 'Expected identifier.');
      this.consume();
      return {
        type: 'RmtIdentifier',
        value: null,
        parts: [],
        startToken: first,
        endToken: first,
        range: createRange(this.sourceModel, first.startOffset, first.endOffset)
      };
    }

    const parts = [first.value];
    const start = this.consume();
    let end = start;

    while (this.matches('.')) {
      const dot = this.consume();
      const next = this.current();
      if (!next || next.type !== 'identifier') {
        this.addDiagnostic(next, 'Expected identifier after dot.');
        end = dot;
        break;
      }
      parts.push(next.value);
      end = this.consume();
    }

    return {
      type: 'RmtIdentifier',
      value: parts.join('.'),
      parts,
      escaped: Boolean(start.escaped),
      startToken: start,
      endToken: end,
      range: createRange(this.sourceModel, start.startOffset, end.endOffset)
    };
  }

  parseBlock(parseItem) {
    const start = this.expectValue('{', 'Expected opening brace.');
    const items = [];
    this.skipSeparators();

    while (!this.isAtEnd() && !this.matches('}')) {
      const item = parseItem();
      if (item) {
        items.push(item);
      }
      this.skipSeparators();
    }

    const end = this.expectValue('}', 'Expected closing brace.') || this.previous();
    return {
      startToken: start,
      endToken: end,
      items
    };
  }

  expectValue(value, message) {
    if (this.matches(value)) {
      return this.consume();
    }
    this.addDiagnostic(this.current(), message || `Expected ${value}.`);
    return null;
  }

  consumeStatementEnd(message) {
    if (this.matchSeparator()) {
      this.skipSeparators();
      return true;
    }
    if (this.matches('}') || this.isAtEnd()) {
      return true;
    }
    this.addDiagnostic(this.current(), message || 'Expected statement end.');
    this.skipUntilStatementBoundary();
    this.skipSeparators();
    return false;
  }

  consumeOptionalStatementEnd() {
    if (this.matchSeparator()) {
      this.skipSeparators();
    }
  }

  skipParenthesized() {
    if (!this.matches('(')) return;
    let depth = 0;
    while (!this.isAtEnd()) {
      const token = this.consume();
      if (token.value === '(') depth += 1;
      if (token.value === ')') {
        depth -= 1;
        if (depth <= 0) return;
      }
    }
  }

  skipStatementOrBlock() {
    while (!this.isAtEnd()) {
      if (this.matches('{')) {
        this.skipBlockTokens();
        return;
      }
      if (this.current().type === 'newline' || this.current().value === ';') {
        this.skipSeparators();
        return;
      }
      if (this.matches('}')) {
        return;
      }
      this.consume();
    }
  }

  skipUntilStatementBoundary() {
    while (!this.isAtEnd() && this.current().type !== 'newline' && this.current().value !== ';' && this.current().value !== '}') {
      if (this.matches('{')) {
        this.skipBlockTokens();
        return;
      }
      this.consume();
    }
  }

  skipBlockTokens() {
    let depth = 0;
    while (!this.isAtEnd()) {
      const token = this.consume();
      if (token.value === '{') depth += 1;
      if (token.value === '}') {
        depth -= 1;
        if (depth <= 0) return;
      }
    }
  }
}

function getNodeStartToken(nodeOrToken) {
  if (!nodeOrToken) return null;
  if (typeof nodeOrToken.startOffset === 'number') return nodeOrToken;
  if (nodeOrToken.range && typeof nodeOrToken.range.startOffset === 'number') {
    return {
      startOffset: nodeOrToken.range.startOffset,
      endOffset: nodeOrToken.range.startOffset,
      value: nodeOrToken.type || 'node'
    };
  }
  return null;
}

function getNodeEndToken(nodeOrToken) {
  if (!nodeOrToken) return null;
  if (typeof nodeOrToken.endOffset === 'number') return nodeOrToken;
  if (nodeOrToken.range && typeof nodeOrToken.range.endOffset === 'number') {
    return {
      startOffset: nodeOrToken.range.endOffset,
      endOffset: nodeOrToken.range.endOffset,
      value: nodeOrToken.type || 'node'
    };
  }
  return null;
}

function assignAstPointers(node, pointer = '') {
  if (!node || typeof node !== 'object') return;
  if (node.type && !node.astPointer) {
    node.astPointer = pointer || '/';
  }

  ['body', 'attributes', 'metadata', 'payload', 'fields', 'items', 'rules'].forEach((key) => {
    const value = node[key];
    if (!Array.isArray(value)) return;
    value.forEach((child, index) => {
      assignAstPointers(child, `${pointer}/${key}/${index}`);
    });
  });

  ['source', 'condition', 'policy', 'expression', 'left', 'right', 'argument', 'value', 'dataType', 'initial'].forEach((key) => {
    const value = node[key];
    if (value && typeof value === 'object' && value.type) {
      assignAstPointers(value, `${pointer}/${key}`);
    }
  });
}

function parseRmtVNextSource(input = {}, options = {}) {
  const normalizedInput = normalizeSourceInput(input, options);
  const sourceModel = createRmtSourceModel(normalizedInput);
  const filePolicyDiagnostics = createFilePolicyDiagnostics(sourceModel);
  const lexed = tokenizeVNextSource(sourceModel);
  const parser = new VNextParser(sourceModel, lexed.tokens, filePolicyDiagnostics.concat(lexed.diagnostics));
  const ast = parser.parseDocument();
  const errorDiagnostics = parser.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const ok = errorDiagnostics.length === 0;

  return {
    schema: RMT_VNEXT_PARSER_SCHEMA,
    workpackage: RMT_VNEXT_PARSER_WORKPACKAGE,
    ok,
    phase: ok ? 'parse' : 'syntax',
    status: ok ? 'parsed' : 'syntax_error',
    sourceModel,
    ast,
    tokens: lexed.tokens.filter((token) => token.type !== 'eof'),
    diagnostics: parser.diagnostics,
    syntaxDiagnostics: parser.diagnostics.filter((diagnostic) => diagnostic.severity === 'error'),
    filePolicyDiagnostics
  };
}

function createRmtVNextParser(defaultOptions = {}) {
  function parseSource(input = {}, options = {}) {
    return parseRmtVNextSource(input, {
      ...defaultOptions,
      ...options
    });
  }

  return Object.freeze({
    schema: RMT_VNEXT_PARSER_SCHEMA,
    astSchema: RMT_VNEXT_AST_SCHEMA,
    workpackage: RMT_VNEXT_PARSER_WORKPACKAGE,
    parseSource
  });
}

module.exports = {
  IMPERATIVE_WORDS,
  LIFECYCLE_OPERATIONS,
  RMT_FILE_FALLBACK_CODE,
  RMT_SOURCE_MODEL_WORKPACKAGE,
  RMT_VNEXT_AST_SCHEMA,
  RMT_VNEXT_CONTEXT_ERROR_CODE,
  RMT_VNEXT_PARSER_MODULE_PATH,
  RMT_VNEXT_PARSER_PACKAGE_SCRIPT,
  RMT_VNEXT_PARSER_REPORT_SCHEMA,
  RMT_VNEXT_PARSER_SCHEMA,
  RMT_VNEXT_PARSER_SUITE_PATH,
  RMT_VNEXT_PARSER_WORKPACKAGE,
  RMT_VNEXT_SYNTAX_ERROR_CODE,
  RESERVED_WORDS,
  SOURCE_KINDS,
  createRmtVNextParser,
  parseRmtVNextSource,
  tokenizeVNextSource
};

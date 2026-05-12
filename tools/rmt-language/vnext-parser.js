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

const SOURCE_KINDS = new Set(['endpoint', 'sse', 'worker']);
const COMPARISON_OPERATORS = new Set(['==', '!=', '>', '>=', '<', '<=']);

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

    if ('{}().;!<>'.includes(character)) {
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
      } else if (this.matches('surface')) {
        body.push(this.parseSurfaceDeclaration(null));
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
      this.addDiagnostic(this.current(), 'Templates may contain imports and surfaces only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
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
    const body = this.parseBlock(() => {
      if (this.matches('lane')) {
        return this.parseLaneDeclaration(templateName, name && name.value);
      }
      this.addDiagnostic(this.current(), 'Surfaces may contain lanes only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
      this.skipStatementOrBlock();
      return null;
    });
    const end = body.endToken || this.previous();

    return this.createNode('RmtSurfaceDeclaration', start, end, {
      name: name && name.value,
      nameNode: name,
      body: body.items
    });
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
      } else if (this.matches('sanitize')) {
        item = this.parseSanitizePolicy();
      } else {
        this.addDiagnostic(this.current(), 'Policy blocks may contain slots, event bindings and security policies only.', RMT_VNEXT_CONTEXT_ERROR_CODE);
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
    this.expectValue('->', 'Expected -> in event binding.');
    this.expectValue('action', 'Expected action keyword in event binding.');
    const action = this.parseQualifiedIdentifier('Expected action identifier.');
    const condition = this.matches('when') ? this.parseConditionClause() : null;
    this.consumeStatementEnd('Expected statement end after event binding.');
    const end = this.previous();

    return this.createNode('RmtEventBinding', start, end, {
      event: event && event.value,
      eventNode: event,
      action: action && action.value,
      actionNode: action,
      condition
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

  ['body'].forEach((key) => {
    const value = node[key];
    if (!Array.isArray(value)) return;
    value.forEach((child, index) => {
      assignAstPointers(child, `${pointer}/${key}/${index}`);
    });
  });

  ['source', 'condition', 'policy', 'expression', 'left', 'right', 'argument'].forEach((key) => {
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

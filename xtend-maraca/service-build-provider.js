'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MARACA_APP_SERVICE_MANIFEST_SCHEMA = 'xtend.maraca.app-services-manifest.v1';
const MARACA_APP_SERVICE_DEMANDS_SCHEMA = 'xtend.maraca.app-service-demands.v1';
const MARACA_SERVICE_BUILD_PROVIDER_SCHEMA = 'xtend.maraca.service-build-provider.v1';
const MARACA_SERVICE_BUILD_PLAN_SCHEMA = 'xtend.maraca.service-build-plan.v1';
const MARACA_SERVICE_BUILD_REPORT_SCHEMA = 'xtend.maraca.service-build-report.v1';
const MARACA_PHP_SERVICE_REPORT_SCHEMA = 'xtend.maraca.php-service-validation-report.v1';

const DEFAULT_CLIENT_ENTRY = 'src/services.ts';
const DEFAULT_SERVER_ENTRY = 'src/server-services.ts';
const DEFAULT_PHP_ENTRY = 'server/server-services.php';
const DEFAULT_BASE_PATH = '/api/xtend/services';
const VALID_TARGETS = new Set(['browser', 'node', 'php']);
const VALID_KINDS = new Set(['query', 'command', 'stream']);
const VALID_SERVICE_TARGETS = new Set(['local', 'server', 'remote-surface']);
const VALID_CONCURRENCY = new Set(['latest', 'serial', 'parallel']);
const TYPE_SCRIPT_MODULES = new WeakMap();
const TYPE_SCRIPT_ERRORS = new WeakMap();

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex');
}

function toPosix(value) {
  return String(value || '').replace(/\\/gu, '/');
}

function repoRelative(filePath, rootDir) {
  return toPosix(path.relative(rootDir, filePath));
}

function readOptionalFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
    ? fs.readFileSync(filePath, 'utf8')
    : null;
}

function diagnostic(code, severity, message, details = {}) {
  return { code, severity, message, details };
}

function normalizeTargets(value, entries) {
  const requested = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(',') : []);
  const targets = requested.map((entry) => String(entry).trim().toLowerCase()).filter((entry) => VALID_TARGETS.has(entry));
  if (targets.length > 0) return Array.from(new Set(targets)).sort();
  const inferred = [];
  if (entries.client.exists) inferred.push('browser');
  if (entries.server.exists) inferred.push('node');
  if (entries.php.exists) inferred.push('php');
  return inferred;
}

function normalizeServiceBuildOptions(rawServices, options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  if (rawServices === false) {
    return {
      enabled: false,
      explicit: true,
      strict: false,
      rootDir,
      targets: [],
      entries: {},
      transport: null,
      budgets: {
        clientBytes: null,
        serverBytes: null
      }
    };
  }
  const explicit = rawServices === true || Boolean(rawServices && typeof rawServices === 'object');
  const source = rawServices && typeof rawServices === 'object' ? rawServices : {};
  const clientEntry = path.resolve(rootDir, source.clientEntry || DEFAULT_CLIENT_ENTRY);
  const serverEntry = path.resolve(rootDir, source.serverEntry || DEFAULT_SERVER_ENTRY);
  const phpEntry = path.resolve(rootDir, source.phpEntry || DEFAULT_PHP_ENTRY);
  const entries = {
    client: { kind: 'browser', path: clientEntry, relative: repoRelative(clientEntry, rootDir), exists: fs.existsSync(clientEntry) },
    server: { kind: 'node', path: serverEntry, relative: repoRelative(serverEntry, rootDir), exists: fs.existsSync(serverEntry) },
    php: { kind: 'php', path: phpEntry, relative: repoRelative(phpEntry, rootDir), exists: fs.existsSync(phpEntry) }
  };
  const targets = normalizeTargets(source.targets, entries);
  const enabled = explicit || entries.client.exists || entries.server.exists || entries.php.exists;
  const transportSource = source.transport && typeof source.transport === 'object' ? source.transport : {};
  const budgetSource = source.budgets && typeof source.budgets === 'object' ? source.budgets : {};
  const clientBudgetBytes = Number(budgetSource.clientBytes || source.clientBudgetBytes);
  const serverBudgetBytes = Number(budgetSource.serverBytes || source.serverBudgetBytes);
  return {
    enabled,
    explicit,
    strict: source.strict !== false,
    rootDir,
    targets,
    budgets: {
      clientBytes: Number.isFinite(clientBudgetBytes) && clientBudgetBytes > 0 ? clientBudgetBytes : null,
      serverBytes: Number.isFinite(serverBudgetBytes) && serverBudgetBytes > 0 ? serverBudgetBytes : null
    },
    entries,
    transport: enabled ? {
      schema: 'xtend.maraca.app-service-transport-config.v1',
      kind: transportSource.kind || 'http-ndjson',
      basePath: transportSource.basePath || DEFAULT_BASE_PATH,
      credentials: transportSource.credentials || 'same-origin'
    } : null
  };
}

function loadTypeScript(rootDir) {
  try {
    const resolved = require.resolve('typescript', { paths: [rootDir, __dirname] });
    const module = require(resolved);
    const packagePath = require.resolve('typescript/package.json', { paths: [rootDir, __dirname] });
    const toolchain = { available: true, version: require(packagePath).version, resolved };
    TYPE_SCRIPT_MODULES.set(toolchain, module);
    return toolchain;
  } catch (error) {
    const toolchain = { available: false, version: null, resolved: null };
    TYPE_SCRIPT_ERRORS.set(toolchain, error && error.message ? error.message : String(error));
    return toolchain;
  }
}

function typeScriptModule(toolchain) {
  return toolchain && TYPE_SCRIPT_MODULES.get(toolchain) || null;
}

function typeScriptError(toolchain) {
  return toolchain && TYPE_SCRIPT_ERRORS.get(toolchain) || null;
}

function loadRollup(rootDir) {
  try {
    const resolved = require.resolve('rollup', { paths: [rootDir, __dirname] });
    const module = require(resolved);
    return module && typeof module.rollup === 'function'
      ? { available: true, module, resolved, error: null }
      : { available: false, module: null, resolved, error: 'The resolved Rollup module does not expose rollup().' };
  } catch (error) {
    return { available: false, module: null, resolved: null, error: error && error.message ? error.message : String(error) };
  }
}

function propertyNameText(node, ts) {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return String(node.text);
  return '';
}

function literalValue(node, ts) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  return undefined;
}

function objectProperty(objectNode, key, ts) {
  if (!objectNode || !ts.isObjectLiteralExpression(objectNode)) return null;
  return objectNode.properties.find((property) => ts.isPropertyAssignment(property) && propertyNameText(property.name, ts) === key) || null;
}

function objectMember(objectNode, key, ts) {
  if (!objectNode || !ts.isObjectLiteralExpression(objectNode)) return null;
  return objectNode.properties.find((property) => property.name && propertyNameText(property.name, ts) === key) || null;
}

function serviceMetadata(initializer, ts, defaultTarget) {
  if (!initializer || !ts.isCallExpression(initializer)) return null;
  const expressionName = ts.isIdentifier(initializer.expression)
    ? initializer.expression.text
    : (ts.isPropertyAccessExpression(initializer.expression) ? initializer.expression.name.text : '');
  if (expressionName !== 'service') return null;
  const config = initializer.arguments[0];
  if (!config || !ts.isObjectLiteralExpression(config)) return null;
  const kind = literalValue(objectProperty(config, 'kind', ts) && objectProperty(config, 'kind', ts).initializer, ts) || 'query';
  const target = literalValue(objectProperty(config, 'target', ts) && objectProperty(config, 'target', ts).initializer, ts) || defaultTarget;
  const concurrency = literalValue(objectProperty(config, 'concurrency', ts) && objectProperty(config, 'concurrency', ts).initializer, ts)
    || (kind === 'command' ? 'serial' : 'latest');
  return {
    kind: VALID_KINDS.has(kind) ? kind : String(kind),
    target: String(target),
    concurrency: VALID_CONCURRENCY.has(concurrency) ? concurrency : String(concurrency),
    hasInvoke: Boolean(objectMember(config, 'invoke', ts)),
    hasStream: Boolean(objectMember(config, 'stream', ts))
  };
}

function findDefaultDefinitionObject(sourceFile, factoryName, ts) {
  const variables = new Map();
  sourceFile.statements.forEach((statement) => {
    if (!ts.isVariableStatement(statement)) return;
    statement.declarationList.declarations.forEach((declaration) => {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) variables.set(declaration.name.text, declaration.initializer);
    });
  });
  for (const statement of sourceFile.statements) {
    if (!ts.isExportAssignment(statement)) continue;
    let expression = statement.expression;
    if (ts.isIdentifier(expression) && variables.has(expression.text)) expression = variables.get(expression.text);
    if (!ts.isCallExpression(expression)) continue;
    const name = ts.isIdentifier(expression.expression) ? expression.expression.text : '';
    if (name !== factoryName) continue;
    return expression.arguments[0] && ts.isObjectLiteralExpression(expression.arguments[0]) ? expression.arguments[0] : null;
  }
  return null;
}

function inspectTypeScriptServiceEntry(filePath, role, toolchain) {
  if (!filePath || !fs.existsSync(filePath)) return { exists: false, role, path: filePath, services: [], diagnostics: [] };
  if (!toolchain.available) {
    return {
      exists: true,
      role,
      path: filePath,
      services: [],
      diagnostics: [diagnostic('xtend.maraca.services.typescript_unavailable', 'error', 'TypeScript is required to inspect AppServices.', { filePath })]
    };
  }
  const ts = typeScriptModule(toolchain);
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const factoryName = role === 'server' ? 'defineServerServices' : 'defineAppServices';
  const objectNode = findDefaultDefinitionObject(sourceFile, factoryName, ts);
  const diagnostics = [];
  if (!objectNode) {
    diagnostics.push(diagnostic(
      'xtend.maraca.services.definition_not_static',
      'error',
      `${path.basename(filePath)} must default-export ${factoryName}({ ... }) with statically named services.`,
      { filePath, factoryName }
    ));
    return { exists: true, role, path: filePath, services: [], diagnostics };
  }
  const services = [];
  objectNode.properties.forEach((property) => {
    if (!ts.isPropertyAssignment(property)) {
      diagnostics.push(diagnostic('xtend.maraca.services.dynamic_key', 'error', 'AppService definitions must use property assignments with literal names.', { filePath }));
      return;
    }
    const id = propertyNameText(property.name, ts);
    if (!id) {
      diagnostics.push(diagnostic('xtend.maraca.services.dynamic_key', 'error', 'AppService IDs must be string or identifier literals.', { filePath }));
      return;
    }
    const metadata = serviceMetadata(property.initializer, ts, role === 'server' ? 'server' : 'local');
    if (!metadata) {
      diagnostics.push(diagnostic('xtend.maraca.services.invalid_definition', 'error', `Service "${id}" must use service({ ... }).`, { filePath, id }));
      return;
    }
    services.push({ id, role, ...metadata });
  });
  services.sort((left, right) => left.id.localeCompare(right.id));
  return { exists: true, role, path: filePath, services, diagnostics };
}

function phpRegistryValueEnd(sourceText, start) {
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let square = 0;
  let round = 0;
  let curly = 0;
  for (let index = start; index < sourceText.length; index += 1) {
    const character = sourceText[index];
    const next = sourceText[index + 1] || '';
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') { blockComment = false; index += 1; }
      continue;
    }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (character === quote) quote = '';
      continue;
    }
    if ((character === '/' && next === '/') || character === '#') { lineComment = true; if (character === '/') index += 1; continue; }
    if (character === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (character === "'" || character === '"') { quote = character; continue; }
    if (character === '[') { square += 1; continue; }
    if (character === ']') {
      if (square === 0 && round === 0 && curly === 0) return index;
      square -= 1;
      continue;
    }
    if (character === '(') { round += 1; continue; }
    if (character === ')') { round -= 1; continue; }
    if (character === '{') { curly += 1; continue; }
    if (character === '}') { curly -= 1; continue; }
    if (character === ',' && square === 0 && round === 0 && curly === 0) return index;
  }
  return sourceText.length;
}

function inspectPhpRegistryValue(value) {
  const source = String(value || '');
  const descriptor = source.trimStart().startsWith('[');
  const hasStreamKey = /['"]stream['"]\s*=>/u.test(source);
  const hasInvokeKey = /['"]invoke['"]\s*=>/u.test(source);
  const hasGenericHandler = /['"]handler['"]\s*=>/u.test(source);
  const callable = /\b(?:static\s+)?(?:function|fn)\b/u.test(source);
  const generator = /\byield\b/u.test(source) || /:\s*\\?(?:Generator|Traversable|Iterator|iterable)\b/u.test(source);
  const hasStream = hasStreamKey || (!descriptor && callable && generator && !hasInvokeKey);
  const hasInvoke = hasInvokeKey || (!descriptor && callable && !hasStreamKey && !generator);
  return {
    kind: hasGenericHandler ? 'manifest' : (hasStream && !hasInvoke ? 'stream' : (hasInvoke && !hasStream ? 'query' : 'unknown')),
    hasGenericHandler,
    hasInvoke,
    hasStream
  };
}

function inspectPhpServiceEntry(filePath) {
  const sourceText = readOptionalFile(filePath);
  if (sourceText === null) return { exists: false, role: 'php', path: filePath, services: [], diagnostics: [] };
  const entries = new Map();
  const returnArray = /\breturn\s*\[/gu.exec(sourceText);
  if (returnArray) {
    let depth = 0;
    let quote = '';
    let quotedValue = '';
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    for (let index = returnArray.index + returnArray[0].lastIndexOf('['); index < sourceText.length; index += 1) {
      const character = sourceText[index];
      const next = sourceText[index + 1] || '';
      if (lineComment) {
        if (character === '\n') lineComment = false;
        continue;
      }
      if (blockComment) {
        if (character === '*' && next === '/') { blockComment = false; index += 1; }
        continue;
      }
      if (quote) {
        if (escaped) { quotedValue += character; escaped = false; continue; }
        if (character === '\\') { escaped = true; continue; }
        if (character !== quote) { quotedValue += character; continue; }
        const key = quotedValue;
        quote = '';
        quotedValue = '';
        if (depth === 1) {
          let cursor = index + 1;
          while (/\s/u.test(sourceText[cursor] || '')) cursor += 1;
          if (sourceText.slice(cursor, cursor + 2) === '=>') {
            const valueStart = cursor + 2;
            const valueEnd = phpRegistryValueEnd(sourceText, valueStart);
            entries.set(key, sourceText.slice(valueStart, valueEnd));
            index = Math.max(index, valueEnd - 1);
          }
        }
        continue;
      }
      if ((character === '/' && next === '/') || character === '#') { lineComment = true; if (character === '/') index += 1; continue; }
      if (character === '/' && next === '*') { blockComment = true; index += 1; continue; }
      if (character === '[') { depth += 1; continue; }
      if (character === ']') { depth -= 1; if (depth === 0) break; continue; }
      if ((character === "'" || character === '"') && depth === 1) { quote = character; quotedValue = ''; }
    }
  }
  return {
    exists: true,
    role: 'php',
    path: filePath,
    services: Array.from(entries).sort(([left], [right]) => left.localeCompare(right)).map(([id, value]) => ({
      id,
      role: 'php',
      target: 'server',
      concurrency: 'host-owned',
      ...inspectPhpRegistryValue(value)
    })),
    diagnostics: entries.size === 0
      ? [diagnostic('xtend.maraca.services.php_registry_empty', 'warning', 'The PHP service registry does not expose statically detectable service IDs.', { filePath })]
      : []
  };
}

function normalizeDemandManifest(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const services = Array.isArray(source.services) ? source.services : [];
  return {
    schema: source.schema || MARACA_APP_SERVICE_DEMANDS_SCHEMA,
    sourceDocument: source.sourceDocument || null,
    services: services.map((entry) => ({
      id: String(entry.id || entry.serviceId || entry.target || entry.dataSource || ''),
      dataSource: String(entry.dataSource || entry.name || entry.id || ''),
      mode: entry.mode === 'stream' ? 'stream' : 'invoke',
      contract: entry.contract || null,
      actions: (Array.isArray(entry.actions) ? entry.actions : []).map((action) => {
        if (typeof action === 'string') return { id: action, mode: entry.mode === 'stream' ? 'stream' : 'invoke', inputs: [] };
        const record = action && typeof action === 'object' ? action : {};
        return {
          id: String(record.id || record.action || ''),
          mode: record.mode === 'stream' ? 'stream' : 'invoke',
          inputs: (Array.isArray(record.inputs) ? record.inputs : []).map((field) => ({
            name: String(field && field.name || ''),
            type: String(field && field.type || 'unknown') || 'unknown'
          })).filter((field) => field.name).sort((left, right) => left.name.localeCompare(right.name))
        };
      }).filter((action) => action.id).sort((left, right) => left.id.localeCompare(right.id) || left.mode.localeCompare(right.mode)),
      sourceRef: entry.sourceRef || null
    })).filter((entry) => entry.id).sort((left, right) => left.id.localeCompare(right.id)),
    fingerprint: source.fingerprint || fingerprint(services)
  };
}

function validateBrowserSourceGraph(entry, serverEntry, toolchain, rootDir) {
  const diagnostics = [];
  if (!entry || !fs.existsSync(entry) || !toolchain.available) return diagnostics;
  const ts = typeScriptModule(toolchain);
  const compilerOptions = {
    allowJs: true,
    checkJs: false,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    skipLibCheck: true,
    noEmit: true
  };
  const program = ts.createProgram([entry], compilerOptions);
  const normalizedServerEntry = serverEntry ? path.resolve(serverEntry) : null;
  program.getSourceFiles().forEach((sourceFile) => {
    const absolute = path.resolve(sourceFile.fileName);
    if (sourceFile.isDeclarationFile || absolute.includes(`${path.sep}node_modules${path.sep}`)) return;
    if (normalizedServerEntry && absolute === normalizedServerEntry) {
      diagnostics.push(diagnostic('xtend.maraca.services.server_import_in_browser', 'error', 'The browser service graph imports the server service entry.', { entry: repoRelative(entry, rootDir), imported: repoRelative(absolute, rootDir) }));
    }
    const text = sourceFile.text || '';
    if (/\b(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]node:/u.test(text) || /\brequire\s*\(\s*['"]node:/u.test(text)) {
      diagnostics.push(diagnostic('xtend.maraca.services.node_import_in_browser', 'error', 'The browser service graph imports a node: module.', { source: repoRelative(absolute, rootDir) }));
    }
    if (/\bprocess\s*\.\s*env\b/u.test(text)) {
      diagnostics.push(diagnostic('xtend.maraca.services.environment_access_in_browser', 'error', 'The browser service graph reads process.env. Use an explicit public-config allow-list.', { source: repoRelative(absolute, rootDir) }));
    }
    if (/\bimport\s*\.\s*meta\s*\.\s*env\b/u.test(text) || /\b(?:Deno|Bun)\s*\.\s*env\b/u.test(text)) {
      diagnostics.push(diagnostic('xtend.maraca.services.environment_access_in_browser', 'error', 'The browser service graph reads a host environment API. Pass explicitly allow-listed public configuration through the app host instead.', { source: repoRelative(absolute, rootDir) }));
    }
    if (/server-services(?:\.[cm]?[jt]s)?['"]/u.test(text)) {
      diagnostics.push(diagnostic('xtend.maraca.services.server_import_in_browser', 'error', 'The browser service graph references server-services.', { source: repoRelative(absolute, rootDir) }));
    }
  });
  return diagnostics;
}

function validateServiceCoverage(demands, client, server, php, options) {
  const diagnostics = [];
  const clientById = new Map(client.services.map((entry) => [entry.id, entry]));
  const serverById = new Map(server.services.map((entry) => [entry.id, entry]));
  const phpById = new Map(php.services.map((entry) => [entry.id, entry]));
  const demanded = new Set(demands.services.map((entry) => entry.id));
  const severity = options.strict ? 'error' : 'warning';

  function implementationHandlerMatches(demand, implementation) {
    return implementation.hasGenericHandler === true
      || (demand.mode === 'stream' ? implementation.hasStream === true : implementation.hasInvoke === true);
  }

  function implementationModeMatches(demand, implementation) {
    if (implementation.hasGenericHandler === true) return true;
    return demand.mode === 'stream' ? implementation.kind === 'stream' : implementation.kind !== 'stream' && implementation.kind !== 'unknown';
  }

  demands.services.forEach((demand) => {
    const browser = clientById.get(demand.id);
    if (options.targets.includes('browser') && !browser) {
      diagnostics.push(diagnostic('xtend.maraca.services.missing_client_binding', severity, `RMT service "${demand.id}" has no browser binding.`, { id: demand.id, mode: demand.mode }));
      return;
    }
    if (!browser) return;
    if (!VALID_SERVICE_TARGETS.has(browser.target)) {
      diagnostics.push(diagnostic('xtend.maraca.services.target_invalid', severity, `Service "${demand.id}" declares unsupported target ${browser.target}.`, { id: demand.id, role: 'client', target: browser.target }));
    }
    if (demand.mode === 'stream' && browser.kind !== 'stream') {
      diagnostics.push(diagnostic('xtend.maraca.services.mode_mismatch', severity, `RMT service "${demand.id}" requires stream but services.ts declares ${browser.kind}.`, { id: demand.id }));
    }
    if (demand.mode === 'invoke' && browser.kind === 'stream') {
      diagnostics.push(diagnostic('xtend.maraca.services.mode_mismatch', severity, `RMT service "${demand.id}" requires invoke but services.ts declares stream.`, { id: demand.id }));
    }
    if (browser.target === 'local' && !implementationHandlerMatches(demand, browser)) {
      diagnostics.push(diagnostic('xtend.maraca.services.client_handler_missing', severity, `Local service "${demand.id}" has no ${demand.mode === 'stream' ? 'stream' : 'invoke'} handler.`, { id: demand.id, mode: demand.mode }));
    }
    if (browser.target === 'server') {
      const nodeImplementation = serverById.get(demand.id);
      const phpImplementation = phpById.get(demand.id);
      if (options.targets.includes('node') && !nodeImplementation) {
        diagnostics.push(diagnostic('xtend.maraca.services.missing_node_implementation', severity, `Server-bound service "${demand.id}" has no Node implementation.`, { id: demand.id }));
      } else if (options.targets.includes('node')) {
        if (nodeImplementation.target !== 'server') {
          diagnostics.push(diagnostic('xtend.maraca.services.node_target_mismatch', severity, `Node implementation "${demand.id}" must use target server, not ${nodeImplementation.target}.`, { id: demand.id, target: nodeImplementation.target }));
        }
        if (!implementationModeMatches(demand, nodeImplementation) || nodeImplementation.kind !== browser.kind) {
          diagnostics.push(diagnostic('xtend.maraca.services.node_mode_mismatch', severity, `Node implementation "${demand.id}" declares ${nodeImplementation.kind}, but the browser contract requires ${browser.kind}.`, { id: demand.id, expected: browser.kind, actual: nodeImplementation.kind }));
        }
        if (!implementationHandlerMatches(demand, nodeImplementation)) {
          diagnostics.push(diagnostic('xtend.maraca.services.node_handler_missing', severity, `Node implementation "${demand.id}" has no ${demand.mode === 'stream' ? 'stream' : 'invoke'} handler.`, { id: demand.id, mode: demand.mode }));
        }
      }
      if (options.targets.includes('php') && !phpImplementation) {
        diagnostics.push(diagnostic('xtend.maraca.services.missing_php_implementation', severity, `Server-bound service "${demand.id}" has no PHP implementation.`, { id: demand.id }));
      } else if (options.targets.includes('php')) {
        if (!implementationModeMatches(demand, phpImplementation)) {
          diagnostics.push(diagnostic('xtend.maraca.services.php_mode_mismatch', severity, `PHP implementation "${demand.id}" does not provide the required ${demand.mode} handler.`, { id: demand.id, mode: demand.mode, actual: phpImplementation.kind }));
        }
        if (!implementationHandlerMatches(demand, phpImplementation)) {
          diagnostics.push(diagnostic('xtend.maraca.services.php_handler_missing', severity, `PHP implementation "${demand.id}" has no ${demand.mode === 'stream' ? 'stream' : 'invoke'} callable.`, { id: demand.id, mode: demand.mode }));
        }
      }
    }
    if (browser.target !== 'server' && (serverById.has(demand.id) || phpById.has(demand.id))) {
      diagnostics.push(diagnostic('xtend.maraca.services.target_collision', severity, `${browser.target} service "${demand.id}" is also implemented in a server target.`, { id: demand.id, target: browser.target }));
    }
  });

  [client, server, php].forEach((inspection) => inspection.services.forEach((entry) => {
    if (!demanded.has(entry.id)) {
      diagnostics.push(diagnostic('xtend.maraca.services.unused_implementation', 'warning', `Service implementation "${entry.id}" is not referenced by RMT.`, { id: entry.id, role: inspection.role }));
    }
  }));
  return diagnostics;
}

function buildFinalManifest(demands, inspections, normalized) {
  const clientById = new Map(inspections.client.services.map((entry) => [entry.id, entry]));
  const serverById = new Map(inspections.server.services.map((entry) => [entry.id, entry]));
  const phpById = new Map(inspections.php.services.map((entry) => [entry.id, entry]));
  const services = demands.services.map((demand) => {
    const client = clientById.get(demand.id) || null;
    return {
      id: demand.id,
      dataSource: demand.dataSource,
      mode: demand.mode,
      kind: client && client.kind || (demand.mode === 'stream' ? 'stream' : 'query'),
      target: client && client.target || 'unbound',
      concurrency: client && client.concurrency || (demand.mode === 'stream' ? 'latest' : 'latest'),
      contract: demand.contract,
      actions: demand.actions,
      implementations: {
        browser: Boolean(client),
        node: serverById.has(demand.id),
        php: phpById.has(demand.id)
      }
    };
  });
  const base = {
    schema: MARACA_APP_SERVICE_MANIFEST_SCHEMA,
    sourceDocument: demands.sourceDocument,
    targets: normalized.targets,
    transport: normalized.transport,
    services
  };
  return { ...base, fingerprint: fingerprint(base) };
}

function createMaracaServiceBuildPlan(input = {}, options = {}) {
  const normalized = normalizeServiceBuildOptions(input.services, { rootDir: input.rootDir || options.rootDir });
  const toolchain = loadTypeScript(normalized.rootDir);
  if (!normalized.enabled) {
    return {
      schema: MARACA_SERVICE_BUILD_PLAN_SCHEMA,
      enabled: false,
      ok: true,
      status: 'disabled',
      strict: false,
      targets: [],
      entries: normalized.entries,
      transport: null,
      budgets: normalized.budgets,
      demands: normalizeDemandManifest(input.demands),
      inspections: { client: { services: [] }, server: { services: [] }, php: { services: [] } },
      manifest: null,
      toolchain,
      diagnostics: [],
      outputs: {}
    };
  }
  const demands = normalizeDemandManifest(input.demands);
  const client = inspectTypeScriptServiceEntry(normalized.entries.client.path, 'client', toolchain);
  const server = inspectTypeScriptServiceEntry(normalized.entries.server.path, 'server', toolchain);
  const php = inspectPhpServiceEntry(normalized.entries.php.path);
  const diagnostics = []
    .concat(client.diagnostics, server.diagnostics, php.diagnostics)
    .concat(validateBrowserSourceGraph(normalized.entries.client.path, normalized.entries.server.path, toolchain, normalized.rootDir))
    .concat(validateServiceCoverage(demands, client, server, php, normalized));
  if (!toolchain.available) {
    diagnostics.push(diagnostic('xtend.maraca.services.typescript_unavailable', 'error', 'The TypeScript compiler is required when AppServices are enabled.', { error: typeScriptError(toolchain) }));
  }
  const manifest = buildFinalManifest(demands, { client, server, php }, normalized);
  const outputDir = path.resolve(input.outputDir || path.join(normalized.rootDir, 'dist'));
  const ok = diagnostics.every((entry) => entry.severity !== 'error');
  return {
    schema: MARACA_SERVICE_BUILD_PLAN_SCHEMA,
    enabled: true,
    ok,
    status: ok ? 'planned' : 'blocked',
    strict: normalized.strict,
    rootDir: normalized.rootDir,
    targets: normalized.targets,
    entries: normalized.entries,
    transport: normalized.transport,
    budgets: normalized.budgets,
    demands,
    inspections: { client, server, php },
    manifest,
    toolchain,
    diagnostics,
    fingerprint: fingerprint({
      manifest,
      entries: normalized.entries,
      strict: normalized.strict,
      budgets: normalized.budgets,
      diagnostics
    }),
    outputs: {
      manifest: path.join(outputDir, 'xtend.maraca.services.json'),
      declarations: path.join(outputDir, 'xtend.maraca.services.d.ts'),
      serverEntry: path.join(outputDir, 'server', 'xtend.maraca.services.mjs'),
      phpReport: path.join(outputDir, 'xtend.maraca.services.php-report.json')
    }
  };
}

function formatTypeScriptDiagnostic(entry, ts, rootDir) {
  const message = ts.flattenDiagnosticMessageText(entry.messageText, '\n');
  const filePath = entry.file && entry.file.fileName ? path.resolve(entry.file.fileName) : null;
  const position = entry.file && Number.isFinite(entry.start) ? entry.file.getLineAndCharacterOfPosition(entry.start) : null;
  return diagnostic(
    `xtend.maraca.services.typescript_${String(entry.code)}`,
    entry.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
    message,
    {
      file: filePath ? repoRelative(filePath, rootDir) : null,
      line: position ? position.line + 1 : null,
      column: position ? position.character + 1 : null
    }
  );
}

function typecheckServiceEntries(plan) {
  if (!plan.enabled || !plan.toolchain.available) return [];
  const ts = typeScriptModule(plan.toolchain);
  const roots = [plan.entries.client, plan.entries.server].filter((entry) => entry && entry.exists).map((entry) => entry.path);
  if (roots.length === 0) return [];
  const configPath = ts.findConfigFile(plan.rootDir, ts.sys.fileExists, 'tsconfig.json');
  let compilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    noEmitOnError: true,
    skipLibCheck: true,
    sourceMap: true,
    allowJs: true
  };
  if (configPath) {
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    if (!config.error) {
      const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
      compilerOptions = { ...parsed.options, ...compilerOptions };
    }
  }
  const program = ts.createProgram(roots, compilerOptions);
  return ts.getPreEmitDiagnostics(program).map((entry) => formatTypeScriptDiagnostic(entry, ts, plan.rootDir));
}

function resolveModuleCandidate(source, importer, rootDir) {
  if (source.startsWith('node:')) return source;
  const maracaEsmSubpaths = {
    '@ccslabs/xtend-maraca/app-services': 'app-services.mjs',
    '@ccslabs/xtend-maraca/server-services': 'server-services.mjs',
    '@ccslabs/xtend-maraca/node-app-service-host': 'node-app-service-host.mjs',
    '@ccslabs/xtend/maraca/app-services': 'app-services.mjs',
    '@ccslabs/xtend/maraca/server-services': 'server-services.mjs',
    '@ccslabs/xtend/maraca/node-app-service-host': 'node-app-service-host.mjs'
  };
  if (maracaEsmSubpaths[source]) return path.join(__dirname, maracaEsmSubpaths[source]);
  if (source.startsWith('.') || source.startsWith('/')) {
    const base = source.startsWith('/') ? source : path.resolve(path.dirname(importer || rootDir), source);
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, `${base}.js`, `${base}.mjs`, path.join(base, 'index.ts'), path.join(base, 'index.js')];
    return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
  }
  try {
    return require.resolve(source, { paths: [importer ? path.dirname(importer) : rootDir, rootDir, __dirname] });
  } catch (_) {
    return null;
  }
}

function createTypeScriptRollupPlugin(plan, options = {}) {
  const ts = typeScriptModule(plan.toolchain);
  const target = options.target || 'browser';
  return {
    name: `xtend-maraca-typescript-services-${target}`,
    resolveId(source, importer) {
      if (!ts) return null;
      const resolved = resolveModuleCandidate(source, importer, plan.rootDir);
      if (!resolved) return null;
      if (target === 'server' && (source.startsWith('node:') || (!source.startsWith('.') && !source.startsWith('/') && !resolved.includes(`${path.sep}xtend-maraca${path.sep}`)))) {
        return { id: source.startsWith('node:') ? source : resolved, external: true };
      }
      return resolved;
    },
    transform(code, id) {
      if (!ts || !/\.(?:ts|tsx|mts)$/u.test(id)) return null;
      const result = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          sourceMap: true,
          inlineSources: target !== 'server',
          importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove
        }
      });
      return { code: result.outputText, map: result.sourceMapText || null };
    }
  };
}

function rmtTypeToTypeScript(value) {
  const type = String(value || '').trim().toLowerCase();
  if (type === 'string' || type === 'number' || type === 'boolean' || type === 'bigint') return type;
  if (type === 'null') return 'null';
  if (type === 'json' || type === 'object' || type === 'record') return 'Record<string, unknown>';
  const arrayMatch = /^(string|number|boolean|bigint)\[\]$/u.exec(type);
  if (arrayMatch) return `${arrayMatch[1]}[]`;
  return 'unknown';
}

function actionInputType(actions) {
  const shapes = (Array.isArray(actions) ? actions : []).map((action) => {
    const inputs = Array.isArray(action && action.inputs) ? action.inputs : [];
    if (inputs.length === 0) return 'Record<string, never>';
    return `{ ${inputs.map((input) => `${JSON.stringify(input.name)}: ${rmtTypeToTypeScript(input.type)}`).join('; ')} }`;
  });
  return Array.from(new Set(shapes)).join(' | ') || 'unknown';
}

function createDeclarationsSource(manifest) {
  const lines = [
    '// Generated by XTend Maraca. Do not edit.',
    'export interface AppServiceContract {'
  ];
  (manifest && manifest.services || []).forEach((entry) => {
    const contract = entry.contract && typeof entry.contract === 'string' ? entry.contract : null;
    lines.push(`  ${JSON.stringify(entry.id)}: {`);
    lines.push(`    mode: ${JSON.stringify(entry.mode)};`);
    lines.push(`    kind: ${JSON.stringify(entry.kind)};`);
    lines.push(`    contractName: ${contract ? JSON.stringify(contract) : 'null'};`);
    lines.push(`    input: ${actionInputType(entry.actions)};`);
    lines.push(`    output: ${rmtTypeToTypeScript(contract)};`);
    lines.push('  };');
  });
  lines.push(
    '}',
    'export type AppServiceId = keyof AppServiceContract;',
    'export type AppServiceMode<TId extends AppServiceId> = AppServiceContract[TId]["mode"];',
    'export type AppServiceInput<TId extends AppServiceId> = AppServiceContract[TId]["input"];',
    'export type AppServiceOutput<TId extends AppServiceId> = AppServiceContract[TId]["output"];',
    ''
  );
  return lines.join('\n');
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeServiceArtifacts(plan) {
  if (!plan.enabled || !plan.manifest) return [];
  writeJson(plan.outputs.manifest, plan.manifest);
  fs.mkdirSync(path.dirname(plan.outputs.declarations), { recursive: true });
  fs.writeFileSync(plan.outputs.declarations, createDeclarationsSource(plan.manifest), 'utf8');
  const phpReport = {
    schema: MARACA_PHP_SERVICE_REPORT_SCHEMA,
    ok: !plan.targets.includes('php') || plan.diagnostics.every((entry) => entry.code !== 'xtend.maraca.services.missing_php_implementation'),
    status: plan.entries.php.exists ? 'validated' : 'not_configured',
    entry: plan.entries.php.relative,
    services: plan.inspections.php.services.map((entry) => entry.id),
    manifestFingerprint: plan.manifest.fingerprint,
    diagnostics: plan.diagnostics.filter((entry) => entry.code.includes('.php_'))
  };
  writeJson(plan.outputs.phpReport, phpReport);
  return [plan.outputs.manifest, plan.outputs.declarations, plan.outputs.phpReport];
}

async function buildServerServiceBundle(plan, rollupModule) {
  if (!plan.enabled || !plan.targets.includes('node') || !plan.entries.server.exists) return { files: [], warnings: [] };
  const warnings = [];
  const bundle = await rollupModule.rollup({
    input: plan.entries.server.path,
    plugins: [createTypeScriptRollupPlugin(plan, { target: 'server' })],
    external(id) {
      return id.startsWith('node:');
    },
    treeshake: true,
    onwarn(warning) {
      warnings.push({ code: warning.code || 'ROLLUP_WARNING', message: warning.message || String(warning) });
    }
  });
  try {
    const generated = await bundle.generate({
      format: 'es',
      entryFileNames: path.basename(plan.outputs.serverEntry),
      sourcemap: true,
      sourcemapExcludeSources: true,
      exports: 'named'
    });
    const files = [];
    for (const output of generated.output) {
      const filePath = output.isEntry ? plan.outputs.serverEntry : path.join(path.dirname(plan.outputs.serverEntry), output.fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      if (output.type === 'chunk') {
        fs.writeFileSync(filePath, `${output.code}\n`, 'utf8');
        if (output.map) {
          fs.writeFileSync(`${filePath}.map`, output.map.toString(), 'utf8');
          files.push(`${filePath}.map`);
        }
      } else {
        fs.writeFileSync(filePath, output.source);
      }
      files.push(filePath);
    }
    return { files, warnings };
  } finally {
    if (typeof bundle.close === 'function') await bundle.close();
  }
}

async function buildMaracaServiceArtifacts(plan, options = {}) {
  if (!plan || !plan.enabled) {
    return { schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA, ok: true, status: 'disabled', files: [], diagnostics: [] };
  }
  const typeDiagnostics = typecheckServiceEntries(plan);
  const diagnostics = plan.diagnostics.concat(typeDiagnostics);
  if (diagnostics.some((entry) => entry.severity === 'error')) {
    return { schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA, ok: false, status: 'typecheck_failed', files: [], diagnostics };
  }
  const needsServerBundle = plan.targets.includes('node') && plan.entries.server && plan.entries.server.exists;
  const rollupTool = options.rollupModule
    ? { available: true, module: options.rollupModule, resolved: null, error: null }
    : loadRollup(plan.rootDir);
  if (needsServerBundle && !rollupTool.available) {
    diagnostics.push(diagnostic(
      'xtend.maraca.services.rollup_unavailable',
      'error',
      'Rollup is required to build the Node AppServices target.',
      { error: rollupTool.error }
    ));
    return { schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA, ok: false, status: 'toolchain_unavailable', files: [], diagnostics };
  }
  const files = writeServiceArtifacts(plan);
  const server = needsServerBundle
    ? await buildServerServiceBundle(plan, rollupTool.module)
    : { files: [], warnings: [] };
  return {
    schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA,
    ok: true,
    status: 'built',
    provider: 'typescript',
    providerVersion: plan.toolchain.version,
    files: files.concat(server.files),
    warnings: server.warnings,
    manifest: plan.manifest,
    diagnostics
  };
}

function createTypeScriptServiceBuildProvider(options = {}) {
  let currentPlan = null;
  let currentReport = null;
  return Object.freeze({
    schema: MARACA_SERVICE_BUILD_PROVIDER_SCHEMA,
    name: 'typescript',
    inspect(input = {}) {
      currentPlan = createMaracaServiceBuildPlan(input, options);
      return currentPlan;
    },
    plan(input = {}) {
      if (!currentPlan) currentPlan = createMaracaServiceBuildPlan(input, options);
      return currentPlan;
    },
    async build(input = {}) {
      if (!currentPlan) currentPlan = createMaracaServiceBuildPlan(input, options);
      if (!currentPlan.enabled) {
        currentReport = { schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA, ok: true, status: 'disabled', files: [], diagnostics: [] };
        return currentReport;
      }
      currentReport = await buildMaracaServiceArtifacts(currentPlan, {
        rollupModule: input.rollupModule || options.rollupModule
      });
      return currentReport;
    },
    report() {
      return currentReport || {
        schema: MARACA_SERVICE_BUILD_REPORT_SCHEMA,
        ok: Boolean(currentPlan && currentPlan.ok),
        status: currentPlan ? currentPlan.status : 'not_planned',
        files: [],
        manifest: currentPlan && currentPlan.manifest || null,
        diagnostics: currentPlan && currentPlan.diagnostics || []
      };
    },
    dispose() {
      currentPlan = null;
      currentReport = null;
    },
    createRollupPlugin(plan = currentPlan, target = 'browser') {
      return createTypeScriptRollupPlugin(plan, { target });
    }
  });
}

module.exports = {
  DEFAULT_BASE_PATH,
  DEFAULT_CLIENT_ENTRY,
  DEFAULT_PHP_ENTRY,
  DEFAULT_SERVER_ENTRY,
  MARACA_APP_SERVICE_DEMANDS_SCHEMA,
  MARACA_APP_SERVICE_MANIFEST_SCHEMA,
  MARACA_PHP_SERVICE_REPORT_SCHEMA,
  MARACA_SERVICE_BUILD_PLAN_SCHEMA,
  MARACA_SERVICE_BUILD_PROVIDER_SCHEMA,
  MARACA_SERVICE_BUILD_REPORT_SCHEMA,
  buildMaracaServiceArtifacts,
  createMaracaServiceBuildPlan,
  createTypeScriptRollupPlugin,
  createTypeScriptServiceBuildProvider,
  normalizeServiceBuildOptions,
  typecheckServiceEntries,
  writeServiceArtifacts
};

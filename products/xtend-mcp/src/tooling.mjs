import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(moduleDir, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');

function loadToolingBridge() {
  try {
    return require('@ccslabs/xtend-compiler/tooling-bridge');
  } catch (_) {
    return require(path.join(repoRoot, 'tools', 'tooling-bridge.js'));
  }
}

function loadRepairReporter() {
  try {
    return require('@ccslabs/xtend-compiler/rmt-linter/reporter');
  } catch (_) {
    return require(path.join(repoRoot, 'tools', 'rmt-linter', 'reporter.js'));
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function stableHash(value) {
  return sha256(JSON.stringify(stableValue(value)));
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

export function normalizeWorkspaceRoots(roots = []) {
  const values = (Array.isArray(roots) ? roots : [roots]).filter(Boolean);
  const normalized = values.map((root) => {
    const resolved = path.resolve(root);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      throw new Error(`Workspace root does not exist: ${root}`);
    }
    return fs.realpathSync(resolved);
  });
  return Array.from(new Set(normalized));
}

function validateSourceChoice(input = {}) {
  const hasSource = typeof input.source === 'string';
  const hasPath = typeof input.path === 'string' && input.path.length > 0;
  if (hasSource === hasPath) throw new Error('Provide exactly one of source or path.');
  return { hasSource, hasPath };
}

export function resolveSourceInput(input = {}, options = {}) {
  const { hasSource } = validateSourceChoice(input);
  const roots = normalizeWorkspaceRoots(options.workspaceRoots || []);
  if (hasSource) {
    return {
      source: String(input.source),
      filePath: 'inline.rmt',
      relativePath: null,
      rootDir: roots[0] || process.cwd(),
      absolutePath: null,
      uri: 'untitled:xtend-mcp-inline.rmt'
    };
  }
  if (path.isAbsolute(input.path) || input.path.includes('\u0000')) {
    throw new Error('RMT path must be a safe workspace-relative path.');
  }
  if (roots.length === 0) throw new Error('A workspace root is required for path-based tools.');
  const matches = [];
  for (const root of roots) {
    const candidate = path.resolve(root, input.path);
    if (!isInside(candidate, root) || !fs.existsSync(candidate)) continue;
    const real = fs.realpathSync(candidate);
    if (!isInside(real, root) || !fs.statSync(real).isFile()) continue;
    matches.push({ root, real });
  }
  if (matches.length === 0) throw new Error(`RMT path was not found inside an allowed workspace: ${input.path}`);
  if (matches.length > 1) throw new Error(`RMT path is ambiguous across workspace roots: ${input.path}`);
  const match = matches[0];
  return {
    source: fs.readFileSync(match.real, 'utf8'),
    filePath: path.relative(match.root, match.real).split(path.sep).join('/'),
    relativePath: path.relative(match.root, match.real).split(path.sep).join('/'),
    rootDir: match.root,
    absolutePath: match.real,
    uri: pathToFileURL(match.real).href
  };
}

function sanitize(value, roots = [], depth = 0) {
  if (depth > 40) return '[depth-limit]';
  if (Array.isArray(value)) return value.map((entry) => sanitize(entry, roots, depth + 1));
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value;
    let output = value;
    for (const root of roots) output = output.split(root).join('[workspace]');
    return output.split(repoRoot).join('[xtend]');
  }
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    if (/password|secret|token/iu.test(key)) return [key, '[redacted]'];
    return [key, sanitize(entry, roots, depth + 1)];
  }));
}

async function runBridge(operation, descriptor, options = {}) {
  const bridge = loadToolingBridge();
  const response = await bridge.executeToolingBridgeOperation({
    schema: bridge.TOOLING_BRIDGE_SCHEMA,
    requestId: `xtend-mcp-${crypto.randomUUID()}`,
    operation,
    payload: {
      source: descriptor.source,
      filePath: descriptor.filePath,
      uri: descriptor.uri,
      options: options.toolOptions || {}
    }
  }, { rootDir: descriptor.rootDir });
  return sanitize(response, [descriptor.rootDir]);
}

export async function runRmtDiagnostics(input = {}, options = {}) {
  const descriptor = resolveSourceInput(input, options);
  const response = await runBridge('language-diagnostics', descriptor, options);
  return {
    schema: 'xtend.mcp.rmt-diagnostics.v1',
    sourceHash: sha256(descriptor.source),
    path: descriptor.relativePath,
    ok: response.ok,
    status: response.status,
    diagnostics: response.diagnostics || response.result?.diagnostics || []
  };
}

export async function runRmtCompileCheck(input = {}, options = {}) {
  const descriptor = resolveSourceInput(input, options);
  const response = await runBridge('compile', descriptor, options);
  const result = response.result || {};
  return {
    schema: 'xtend.mcp.rmt-compile-check.v1',
    sourceHash: sha256(descriptor.source),
    path: descriptor.relativePath,
    ok: response.ok,
    status: response.status,
    diagnostics: response.diagnostics || [],
    summary: {
      schema: result.schema || null,
      mode: result.mode || result.languageMode || null,
      recordCount: result.recordCount ?? result.records?.length ?? null,
      outputCount: result.outputCount ?? result.outputs?.length ?? null
    }
  };
}

export async function runMaracaPlan(input = {}, options = {}) {
  const descriptor = resolveSourceInput(input, options);
  const response = await runBridge('maraca-plan', descriptor, options);
  return {
    schema: 'xtend.mcp.maraca-plan.v1',
    sourceHash: sha256(descriptor.source),
    path: descriptor.relativePath,
    ok: response.ok,
    status: response.status,
    diagnostics: response.diagnostics || [],
    plan: response.result || null
  };
}

function positionOffset(text, position = {}) {
  const lines = String(text).split(/(?<=\n)/u);
  const line = Math.max(0, Number.isInteger(position.line) ? position.line : 0);
  const character = Math.max(0, Number.isInteger(position.character) ? position.character : 0);
  let offset = 0;
  for (let index = 0; index < Math.min(line, lines.length); index += 1) offset += lines[index].length;
  return Math.min(String(text).length, offset + character);
}

function editsForStep(step, descriptor) {
  const changes = step?.edit?.changes || {};
  return Object.entries(changes).flatMap(([uri, edits]) => {
    if (descriptor.absolutePath && uri !== descriptor.uri) {
      throw new Error('Repair plan attempted to edit a file outside the selected source.');
    }
    if (!descriptor.absolutePath && uri !== descriptor.uri && !uri.startsWith('untitled:')) {
      throw new Error('Inline repair plan attempted an external workspace edit.');
    }
    return (Array.isArray(edits) ? edits : []).map((edit) => ({
      uri,
      range: edit.range,
      newText: typeof edit.newText === 'string' ? edit.newText : ''
    }));
  });
}

function applyEdits(text, edits) {
  const eol = String(text).includes('\r\n') ? '\r\n' : '\n';
  const normalized = edits.map((edit, index) => ({
    index,
    start: positionOffset(text, edit.range?.start),
    end: positionOffset(text, edit.range?.end),
    newText: eol === '\r\n' ? edit.newText.replace(/(?<!\r)\n/gu, '\r\n') : edit.newText
  })).sort((left, right) => right.start - left.start || right.end - left.end || right.index - left.index);
  const ascending = [...normalized].sort((left, right) => left.start - right.start || left.end - right.end);
  for (let index = 1; index < ascending.length; index += 1) {
    if (ascending[index].start < ascending[index - 1].end) throw new Error('Selected repair edits overlap and cannot be applied atomically.');
  }
  let output = String(text);
  for (const edit of normalized) output = `${output.slice(0, edit.start)}${edit.newText}${output.slice(edit.end)}`;
  return output;
}

function diffSummary(before, after) {
  const beforeLines = String(before).split(/\r\n|\r|\n/u);
  const afterLines = String(after).split(/\r\n|\r|\n/u);
  const max = Math.max(beforeLines.length, afterLines.length);
  let first = -1;
  let last = -1;
  for (let index = 0; index < max; index += 1) {
    if ((beforeLines[index] || '') !== (afterLines[index] || '')) {
      if (first < 0) first = index;
      last = index;
    }
  }
  if (first < 0) return { changed: false, firstChangedLine: null, changedLineCount: 0, before: [], after: [] };
  const start = Math.max(0, first - 2);
  const end = Math.min(max, last + 3);
  return {
    changed: true,
    firstChangedLine: first,
    changedLineCount: last - first + 1,
    before: beforeLines.slice(start, end),
    after: afterLines.slice(start, end)
  };
}

function normalizeRepairReport(report, descriptor, sourceHash) {
  const safeSteps = (report.repairPlan || []).filter((step) => step.safe === true && step.applyMode === 'workspace-edit' && step.edit);
  const repairs = safeSteps.map((step) => {
    const identity = {
      sourceHash,
      order: step.order,
      title: step.title,
      diagnosticCode: step.diagnosticCode,
      pointer: step.pointer || null,
      edit: step.edit
    };
    const repairId = `repair-${stableHash(identity).slice(0, 20)}`;
    const after = applyEdits(descriptor.source, editsForStep(step, descriptor));
    return {
      repairId,
      order: step.order,
      title: step.title,
      diagnosticCode: step.diagnosticCode,
      pointer: step.pointer || null,
      safe: true,
      confidence: step.confidence,
      impact: step.impact,
      repairKind: step.repairKind,
      diff: diffSummary(descriptor.source, after),
      edit: step.edit
    };
  });
  const planHash = stableHash(repairs.map((repair) => ({
    repairId: repair.repairId,
    order: repair.order,
    edit: repair.edit
  })));
  return {
    schema: 'xtend.mcp.rmt-repair-plan.v1',
    sourceHash,
    planHash,
    path: descriptor.relativePath,
    status: report.status,
    ok: report.ok,
    diagnostics: sanitize(report.diagnostics || [], [descriptor.rootDir]),
    repairs,
    noOps: sanitize(report.noOps || [], [descriptor.rootDir]),
    safeRepairCount: repairs.length,
    noOpCount: report.noOpCount || 0
  };
}

export function createRmtRepairPlan(input = {}, options = {}) {
  const descriptor = resolveSourceInput(input, options);
  const reporter = loadRepairReporter();
  const sourceHash = sha256(descriptor.source);
  const report = reporter.createRmtAgentRepairReport({
    text: descriptor.source,
    filePath: descriptor.absolutePath || descriptor.filePath,
    uri: descriptor.uri,
    version: 1,
    languageId: 'rmt'
  }, { rootDir: descriptor.rootDir });
  return { descriptor, plan: normalizeRepairReport(report, descriptor, sourceHash) };
}

function writeAtomically(filePath, content, mode) {
  const tempPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.xtend-mcp-${process.pid}-${crypto.randomUUID()}.tmp`);
  let descriptor;
  try {
    descriptor = fs.openSync(tempPath, 'wx', mode & 0o777);
    fs.writeFileSync(descriptor, content, 'utf8');
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(tempPath, filePath);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

export async function applyRmtSafeRepairs(input = {}, options = {}) {
  if (!options.allowWorkspaceWrite) throw new Error('Workspace writes are disabled. Restart with --allow-workspace-write.');
  if (typeof input.path !== 'string' || !input.path) throw new Error('apply_safe_repairs requires a workspace-relative path.');
  const { descriptor, plan } = createRmtRepairPlan({ path: input.path }, options);
  if (!descriptor.absolutePath) throw new Error('Safe repairs can only be applied to workspace files.');
  if (input.sourceHash !== plan.sourceHash) throw new Error('Source drift detected; request a new repair plan.');
  if (input.planHash !== plan.planHash) throw new Error('Repair plan drift detected; request a new repair plan.');
  const requested = Array.isArray(input.repairIds) ? Array.from(new Set(input.repairIds)) : [];
  if (requested.length === 0) throw new Error('Select at least one safe repairId.');
  const selected = requested.map((repairId) => {
    const repair = plan.repairs.find((entry) => entry.repairId === repairId);
    if (!repair) throw new Error(`Unknown or unsafe repairId: ${repairId}`);
    return repair;
  });
  const edits = selected.flatMap((repair) => editsForStep(repair, descriptor));
  const nextSource = applyEdits(descriptor.source, edits);
  if (nextSource === descriptor.source) throw new Error('Selected repair batch is a no-op.');
  const stat = fs.statSync(descriptor.absolutePath);
  writeAtomically(descriptor.absolutePath, nextSource, stat.mode);
  const diagnostics = await runRmtDiagnostics({ path: descriptor.relativePath }, options);
  return {
    schema: 'xtend.mcp.rmt-repair-apply.v1',
    ok: true,
    status: 'applied',
    path: descriptor.relativePath,
    sourceHashBefore: plan.sourceHash,
    sourceHashAfter: sha256(nextSource),
    planHash: plan.planHash,
    appliedRepairIds: selected.map((repair) => repair.repairId),
    diff: diffSummary(descriptor.source, nextSource),
    diagnostics
  };
}

export function toolingProvenance(operation, data) {
  return [{
    uri: data.path ? `workspace://${encodeURI(data.path)}` : 'untitled:xtend-mcp-inline.rmt',
    kind: operation,
    sourceHash: data.sourceHash || data.sourceHashAfter || ''
  }];
}

'use strict';

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_OWNERSHIP_PATH,
  SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA,
  SCAFFOLD_WRITE_PLAN_SCHEMA,
  sha256,
  normalizeRelativePath
} = require('./write-plan');

const SCAFFOLD_PATCHERS_SCHEMA = 'xtend.scaffold.patchers.v1';
const SCAFFOLD_MANIFEST_PATCHER_SCHEMA = 'xtend.scaffold.manifest-patcher.v1';
const SCAFFOLD_BUILD_REPORT_SCHEMA = 'xtend.scaffold.build-report.v1';
const DEFAULT_MANIFEST_PATH = 'components/manifest.json';
const BUILD_REPORT_ROOT = '.xtend-build/component-files/';

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sortObjectByKey(value) {
  return Object.keys(value || {}).sort().reduce((sorted, key) => {
    sorted[key] = value[key];
    return sorted;
  }, {});
}

function toPosixPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function sanitizeSegment(value) {
  const sanitized = String(value || 'scaffold-build')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || 'scaffold-build';
}

function isRemoteSource(source) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(source) || source.startsWith('//');
}

function normalizeManifestSource(source, manifestPath = DEFAULT_MANIFEST_PATH) {
  const raw = toPosixPath(source).trim();
  if (!raw) {
    return {
      ok: false,
      error: 'Manifest patch source must be a non-empty repo-local path.'
    };
  }

  if (raw.includes('\0')) {
    return {
      ok: false,
      error: 'Manifest patch source contains a null byte.'
    };
  }

  if (isRemoteSource(raw)) {
    return {
      ok: false,
      error: `Manifest patch source "${raw}" must stay repo-local.`
    };
  }

  if (raw.startsWith('./')) {
    const normalizedLocal = path.posix.normalize(raw);
    return {
      ok: true,
      source: normalizedLocal.startsWith('.') ? normalizedLocal : `./${normalizedLocal}`
    };
  }

  const normalizedManifestPath = normalizeRelativePath(manifestPath);
  if (!normalizedManifestPath.ok) {
    return {
      ok: false,
      error: normalizedManifestPath.error
    };
  }

  const normalizedSource = path.posix.normalize(raw);
  if (normalizedSource.startsWith('../') || normalizedSource === '..') {
    return {
      ok: false,
      error: `Manifest patch source "${raw}" must stay inside the repository.`
    };
  }

  const manifestDir = path.posix.dirname(normalizedManifestPath.path);
  const relativeToManifest = path.posix.relative(manifestDir, normalizedSource);
  const nextSource = relativeToManifest.startsWith('.') ? relativeToManifest : `./${relativeToManifest}`;
  if (nextSource.startsWith('../')) {
    return {
      ok: false,
      error: `Manifest patch source "${raw}" must resolve under "${manifestDir}".`
    };
  }

  return {
    ok: true,
    source: nextSource
  };
}

function readManifest(rootDir, manifestPath = DEFAULT_MANIFEST_PATH) {
  const normalized = normalizeRelativePath(manifestPath);
  if (!normalized.ok) {
    return {
      ok: false,
      exists: false,
      path: manifestPath,
      manifest: {},
      errors: [normalized.error]
    };
  }

  const absolutePath = path.resolve(rootDir || process.cwd(), normalized.path);
  if (!fs.existsSync(absolutePath)) {
    return {
      ok: true,
      exists: false,
      path: normalized.path,
      manifest: {},
      errors: []
    };
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    return {
      ok: false,
      exists: true,
      path: normalized.path,
      manifest: {},
      errors: [`Manifest target "${normalized.path}" exists but is not a file.`]
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return {
        ok: false,
        exists: true,
        path: normalized.path,
        manifest: {},
        errors: [`Manifest target "${normalized.path}" must be a JSON object.`]
      };
    }

    return {
      ok: true,
      exists: true,
      path: normalized.path,
      manifest: parsed,
      errors: []
    };
  } catch (error) {
    return {
      ok: false,
      exists: true,
      path: normalized.path,
      manifest: {},
      errors: [`Failed to parse manifest "${normalized.path}": ${error.message}`]
    };
  }
}

function validatePatchPlan(patchPlan = {}) {
  const errors = [];
  if (!patchPlan || typeof patchPlan !== 'object') {
    errors.push('Manifest patch plan must be an object.');
    return errors;
  }

  if (!String(patchPlan.tag || '').trim()) {
    errors.push('Manifest patch plan requires a tag.');
  }

  if (patchPlan.localImportOnly !== true) {
    errors.push('Manifest patch plan must stay localImportOnly.');
  }

  if (patchPlan.cdnAllowed !== false) {
    errors.push('Manifest patch plan must not allow CDN imports.');
  }

  return errors;
}

function createManifestPatchEntry(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const patchPlan = options.patchPlan || {};
  const targetPath = options.targetPath || DEFAULT_MANIFEST_PATH;
  const tag = String(patchPlan.tag || options.tag || '').trim();
  const manifestRead = readManifest(rootDir, targetPath);
  const source = normalizeManifestSource(patchPlan.source || `components/${tag}.js`, targetPath);
  const errors = validatePatchPlan({
    ...patchPlan,
    tag
  })
    .concat(manifestRead.errors)
    .concat(source.ok ? [] : [source.error]);

  if (errors.length > 0) {
    return {
      ok: false,
      schema: SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
      errors,
      patch: null,
      entry: null,
      manifest: manifestRead.manifest
    };
  }

  const currentManifest = sortObjectByKey(manifestRead.manifest);
  const previousSource = currentManifest[tag] || null;
  const nextManifest = sortObjectByKey({
    ...currentManifest,
    [tag]: source.source
  });
  const decision = previousSource === source.source
    ? 'already-current'
    : (previousSource ? 'update-existing-entry' : 'insert-entry');
  const patch = {
    schema: SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
    patchersSchema: SCAFFOLD_PATCHERS_SCHEMA,
    operation: patchPlan.operation || 'add-component',
    targetPath,
    tag,
    source: source.source,
    previousSource,
    decision,
    changed: decision !== 'already-current',
    existingEntryCount: Object.keys(currentManifest).length,
    nextEntryCount: Object.keys(nextManifest).length,
    policies: {
      importMode: patchPlan.importMode || 'repo-local',
      loaderMode: patchPlan.loaderMode || 'custom-element',
      hydrationMode: patchPlan.hydrationMode || 'custom-element',
      localImportOnly: true,
      cdnAllowed: false
    },
    diagnostics: previousSource && previousSource !== source.source ? [{
      code: 'manifest-entry-source-update',
      severity: 'warn',
      message: `Manifest entry "${tag}" exists with "${previousSource}" and will be updated to "${source.source}".`
    }] : []
  };
  const stablePatchIdentity = {
    schema: SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
    patchersSchema: SCAFFOLD_PATCHERS_SCHEMA,
    operation: patch.operation,
    targetPath: patch.targetPath,
    tag: patch.tag,
    source: patch.source,
    policies: patch.policies
  };
  const content = stableJson(nextManifest);

  return {
    ok: true,
    schema: SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
    errors: [],
    manifest: nextManifest,
    patch,
    entry: {
      id: options.id || 'manifest',
      targetPath,
      kind: 'manifest-json',
      action: 'patch',
      templateId: options.templateId || 'component.manifest-patcher',
      templatePath: options.templatePath || 'xtend-builder/writing/manifest-patcher.js',
      content,
      generated: true,
      allowUnownedPatch: true,
      patch,
      sourceSha256: sha256(stableJson(stablePatchIdentity)),
      buildSha256: sha256(stableJson({
        schema: SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
        patch: stablePatchIdentity,
        manifest: nextManifest
      }))
    }
  };
}

function createComponentBuildReportEntry(options = {}) {
  const tag = String(options.tag || 'component-build').trim();
  const files = Array.isArray(options.files) ? options.files : [];
  const writeEntries = Array.isArray(options.writeEntries) ? options.writeEntries : files;
  const patches = Array.isArray(options.patches) ? options.patches : [];
  const buildReportPatches = patches.map((patch) => ({
    schema: patch.schema,
    patchersSchema: patch.patchersSchema,
    operation: patch.operation,
    targetPath: patch.targetPath,
    tag: patch.tag,
    source: patch.source,
    policies: patch.policies
  }));
  const input = options.input || {};
  const targetPath = options.targetPath || `${BUILD_REPORT_ROOT}${sanitizeSegment(tag)}.scaffold-build.json`;
  const report = {
    schema: SCAFFOLD_BUILD_REPORT_SCHEMA,
    patchersSchema: SCAFFOLD_PATCHERS_SCHEMA,
    generator: options.generator || 'component-files',
    owner: options.owner || `component-files:${tag}`,
    tag,
    source: {
      command: 'component-files',
      profiles: Array.isArray(input.profiles) ? input.profiles : [],
      features: Array.isArray(input.features) ? input.features : []
    },
    contracts: {
      writePlan: SCAFFOLD_WRITE_PLAN_SCHEMA,
      ownership: SCAFFOLD_GENERATED_OWNERSHIP_SCHEMA,
      ownershipPath: DEFAULT_OWNERSHIP_PATH,
      manifestPatcher: SCAFFOLD_MANIFEST_PATCHER_SCHEMA
    },
    outputs: writeEntries.map((entry) => ({
      id: entry.id,
      kind: entry.kind || entry.type || 'file',
      targetPath: entry.targetPath || entry.path,
      templateId: entry.templateId || null,
      templatePath: entry.templatePath || null,
      sha256: sha256(entry.content || '')
    })),
    renderedArtifacts: files.map((entry) => ({
      id: entry.id,
      targetPath: entry.targetPath || entry.path,
      templateId: entry.templateId || null
    })),
    patches: buildReportPatches,
    localGates: options.localGates || [
      'node scripts/run_xtend_tests.js scaffold-component-write --json',
      'node scripts/run_xtend_tests.js scaffold-manifest-patch --json'
    ],
    policies: {
      dryRunFirst: true,
      noSilentOverwrite: true,
      repoLocalImportsOnly: true
    }
  };
  const content = stableJson(report);

  return {
    ok: true,
    schema: SCAFFOLD_BUILD_REPORT_SCHEMA,
    errors: [],
    report,
    entry: {
      id: 'build-report',
      targetPath,
      kind: 'scaffold-build-report',
      action: 'report',
      templateId: 'scaffold.build-report',
      templatePath: 'xtend-builder/writing/manifest-patcher.js',
      content,
      generated: true,
      metadata: {
        schema: SCAFFOLD_BUILD_REPORT_SCHEMA,
        tag,
        patchCount: patches.length
      },
      sourceSha256: sha256(stableJson({
        tag,
        input,
        patches: buildReportPatches
      })),
      buildSha256: sha256(content)
    }
  };
}

module.exports = {
  BUILD_REPORT_ROOT,
  DEFAULT_MANIFEST_PATH,
  SCAFFOLD_BUILD_REPORT_SCHEMA,
  SCAFFOLD_MANIFEST_PATCHER_SCHEMA,
  SCAFFOLD_PATCHERS_SCHEMA,
  createComponentBuildReportEntry,
  createManifestPatchEntry,
  normalizeManifestSource,
  readManifest
};

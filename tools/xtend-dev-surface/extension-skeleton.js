'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  DIAGNOSTIC_CATALOG,
  XTEND_DEV_SURFACE_DIST_PATH,
  XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
  XTEND_DEV_SURFACE_HANDOFF_SCHEMA,
  XTEND_DEV_SURFACE_ROOT,
  createDevSurfaceDiagnostic
} = require('./contracts');

const XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA = 'xtend.devsurface.extension-skeleton.v1';
const XTEND_DEV_SURFACE_BUILD_REPORT_SCHEMA = 'xtend.devsurface.build-report.v1';
const XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE = 'XDS-WP-02';

const COPY_FILES = Object.freeze([
  'manifest.json',
  'devtools.html',
  'devtools.js',
  'panel.html',
  'runtime-bridge.js',
  'panel.js',
  'panel.css',
  'service-worker.js',
  'content-bridge.js',
  'prewarm-worker.js',
  'assets/icon.svg'
]);

const REQUIRED_DIST_FILES = Object.freeze(COPY_FILES.concat([
  'build-report.json',
  'handoff.json'
]));

function resolveRootDir(rootDir) {
  return rootDir || path.resolve(__dirname, '..', '..');
}

function repoPath(relativePath, rootDir) {
  return path.join(resolveRootDir(rootDir), relativePath);
}

function distPath(relativePath, rootDir) {
  return repoPath(path.join(XTEND_DEV_SURFACE_DIST_PATH, relativePath), rootDir);
}

function sourcePath(relativePath, rootDir) {
  return repoPath(path.join(XTEND_DEV_SURFACE_ROOT, 'src', relativePath), rootDir);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function createCheck(id, ok, message, metadata = {}) {
  return {
    id,
    ok: Boolean(ok),
    message,
    metadata
  };
}

function diagnosticFromCheck(check, code = DIAGNOSTIC_CATALOG.extensionSkeletonInvalid.code) {
  return createDevSurfaceDiagnostic(
    code,
    check.message,
    'error',
    {
      checkId: check.id,
      ...check.metadata
    }
  );
}

function createFileRecord(relativePath, filePath) {
  const exists = fs.existsSync(filePath);
  return {
    path: relativePath,
    exists,
    bytes: exists ? fs.statSync(filePath).size : 0,
    sha256: exists ? sha256File(filePath) : null
  };
}

function createSourceDistParityRecords(rootDir) {
  return COPY_FILES.map((relativePath) => {
    const source = createFileRecord(path.join(XTEND_DEV_SURFACE_ROOT, 'src', relativePath), sourcePath(relativePath, rootDir));
    const dist = createFileRecord(path.join(XTEND_DEV_SURFACE_DIST_PATH, relativePath), distPath(relativePath, rootDir));
    return {
      relativePath,
      source,
      dist,
      ok: source.exists && dist.exists && source.sha256 === dist.sha256
    };
  });
}

function validateManifest(manifest = {}, rootDir) {
  const csp = manifest.content_security_policy && manifest.content_security_policy.extension_pages || '';
  const hostPermissions = Array.isArray(manifest.host_permissions) ? manifest.host_permissions : [];
  return [
    createCheck('manifest.v3', manifest.manifest_version === 3, 'Dev Surface manifest must use Manifest V3.'),
    createCheck('manifest.devtools_page', manifest.devtools_page === 'devtools.html' && fs.existsSync(distPath('devtools.html', rootDir)), 'Dev Surface manifest must declare a local devtools_page.'),
    createCheck('manifest.service_worker', manifest.background && manifest.background.service_worker === 'service-worker.js' && fs.existsSync(distPath('service-worker.js', rootDir)), 'Dev Surface manifest must declare the local extension service worker.'),
    createCheck('manifest.permissions.storage', Array.isArray(manifest.permissions) && manifest.permissions.includes('storage'), 'Dev Surface manifest must declare storage permission for local settings.'),
    createCheck('manifest.permissions.scripting', Array.isArray(manifest.permissions) && manifest.permissions.includes('scripting'), 'Dev Surface manifest must declare scripting permission for explicit bridge injection.'),
    createCheck('manifest.host_permissions.local_only', hostPermissions.every((entry) => entry === 'http://127.0.0.1/*' || entry === 'http://localhost/*'), 'Dev Surface host permissions must be limited to the local companion.'),
    createCheck('manifest.csp.local_scripts', csp.includes("script-src 'self'") && !csp.includes('unsafe-eval') && !csp.includes('unsafe-inline') && !/script-src[^;]*https?:/u.test(csp), 'Dev Surface CSP must keep scripts local and block unsafe script execution.'),
    createCheck('manifest.no_remote_surface', !manifest.externally_connectable && !manifest.oauth2, 'Dev Surface skeleton must not expose remote extension connection surfaces in v1.')
  ];
}

function createExtensionSkeletonReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const requireBuildReport = options.requireBuildReport !== false;
  const manifestPath = distPath('manifest.json', rootDir);
  const manifest = fs.existsSync(manifestPath) ? readJsonFile(manifestPath) : {};
  const sourceFiles = COPY_FILES.map((relativePath) => createFileRecord(path.join(XTEND_DEV_SURFACE_ROOT, 'src', relativePath), sourcePath(relativePath, rootDir)));
  const distRequiredFiles = (requireBuildReport ? REQUIRED_DIST_FILES : COPY_FILES)
    .map((relativePath) => createFileRecord(path.join(XTEND_DEV_SURFACE_DIST_PATH, relativePath), distPath(relativePath, rootDir)));
  const parity = createSourceDistParityRecords(rootDir);
  const manifestChecks = validateManifest(manifest, rootDir);
  const sourceChecks = sourceFiles.map((file) => createCheck(`source.${file.path}`, file.exists, `Required source file ${file.path} must exist.`, { path: file.path }));
  const distChecks = distRequiredFiles.map((file) => createCheck(`dist.${file.path}`, file.exists, `Required dist file ${file.path} must exist.`, { path: file.path }));
  const parityChecks = parity.map((entry) => createCheck(
    `parity.${entry.relativePath}`,
    entry.ok,
    `Source and dist artifact must match for ${entry.relativePath}.`,
    { relativePath: entry.relativePath }
  ));
  const checks = manifestChecks.concat(sourceChecks, distChecks, parityChecks);
  const diagnostics = checks
    .filter((check) => !check.ok)
    .map((check) => diagnosticFromCheck(
      check,
      check.id.startsWith('parity.') ? DIAGNOSTIC_CATALOG.sourceDistDrift.code : DIAGNOSTIC_CATALOG.extensionSkeletonInvalid.code
    ));

  return {
    schema: XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    handoffSchema: XTEND_DEV_SURFACE_HANDOFF_SCHEMA,
    workpackage: XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE,
    sourceRoot: path.join(XTEND_DEV_SURFACE_ROOT, 'src'),
    distRoot: XTEND_DEV_SURFACE_DIST_PATH,
    manifest,
    sourceFiles,
    distFiles: distRequiredFiles,
    parity,
    checks,
    diagnostics,
    ok: diagnostics.length === 0
  };
}

function createDevSurfaceBuildReport(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const copiedFiles = Array.isArray(options.files) ? options.files.slice() : COPY_FILES.slice();
  const skeleton = createExtensionSkeletonReport({ rootDir, requireBuildReport: false });
  return {
    schema: XTEND_DEV_SURFACE_BUILD_REPORT_SCHEMA,
    skeletonSchema: XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA,
    extensionSchema: XTEND_DEV_SURFACE_EXTENSION_SCHEMA,
    handoffSchema: XTEND_DEV_SURFACE_HANDOFF_SCHEMA,
    workpackage: XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE,
    source: path.join(XTEND_DEV_SURFACE_ROOT, 'src'),
    dist: XTEND_DEV_SURFACE_DIST_PATH,
    copiedFiles: copiedFiles.map((relativePath) => path.join(XTEND_DEV_SURFACE_DIST_PATH, relativePath)),
    generatedFiles: [
      path.join(XTEND_DEV_SURFACE_DIST_PATH, 'build-report.json'),
      path.join(XTEND_DEV_SURFACE_DIST_PATH, 'handoff.json')
    ],
    manifest: skeleton.manifest,
    parity: skeleton.parity,
    diagnostics: skeleton.diagnostics,
    ok: skeleton.ok
  };
}

module.exports = {
  COPY_FILES,
  REQUIRED_DIST_FILES,
  XTEND_DEV_SURFACE_BUILD_REPORT_SCHEMA,
  XTEND_DEV_SURFACE_EXTENSION_SKELETON_SCHEMA,
  XTEND_DEV_SURFACE_SKELETON_WORKPACKAGE,
  createDevSurfaceBuildReport,
  createExtensionSkeletonReport,
  validateManifest
};

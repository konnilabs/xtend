const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText
} = require('../utils/files');
const {
  syntaxCheckFile
} = require('../utils/process');

function runCoreContractSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'core',
    label: 'Core contract verification'
  });
  const { assert } = context;

  function assertFileIncludes(relativePath, pattern, description) {
    return context.assertIncludes(readText(relativePath, rootDir), pattern, description);
  }

  function assertSyntaxCheck(relativePath, extension = '.js') {
    const check = syntaxCheckFile(relativePath, { rootDir, extension });
    assert(
      check.ok,
      `Syntax-Check erfolgreich: ${relativePath}${check.ok ? '' : ` (${check.message})`}`
    );
  }

  const manifest = readJson('components/manifest.json', rootDir);
  const menu = readJson('docs/menu.json', rootDir);

  ['xstate', 'x-theme', 'x-router', 'x-link', 'x-dialog', 'x-modal', 'x-alert', 'x-toast'].forEach((key) => {
    assert(typeof manifest[key] === 'string' && manifest[key].length > 0, `Manifest-Eintrag vorhanden: ${key}`);
  });
  Object.entries(manifest).forEach(([key, value]) => {
    assert(typeof value === 'string' && value.startsWith('./'), `Manifest-Eintrag ist repo-lokal: ${key}`);
    assert(!value.includes('https://cdn.ccs-networks.de/xtend'), `Manifest-Eintrag nutzt keinen XTend-CDN-Pfad: ${key}`);
  });

  const menuSlugs = new Set(menu.map((entry) => entry.slug));
  assert(menuSlugs.has('components-xmodal'), 'Docs-Menue enthaelt x-modal');
  assert(menuSlugs.has('api'), 'Docs-Menue enthaelt die API-Referenz');

  assertFileIncludes('api.js', 'ensureComplianceAPI()', 'API initialisiert den Compliance-Contract');
  assertFileIncludes('api.js', "import { xstate } from './components/xstate.js';", 'API importiert xstate lokal');
  assert(!readText('api.js', rootDir).includes('https://cdn.ccs-networks.de/xtend'), 'API enthaelt keinen XTend-CDN-Fallback');
  assertFileIncludes('api.js', 'namespace.compliance = {', 'XTend Namespace stellt Compliance-API bereit');
  assertFileIncludes('api.js', 'xtend.compliance.checklist', 'Compliance-Checklist wird in xstate gespiegelt');

  assertFileIncludes('components/xtheme.js', 'getDesignTokens(themeName = this.currentTheme)', 'Theme-API bietet Design-Token-Zugriff');
  assertFileIncludes('components/xtheme.js', '--xtend-color-primary', 'Theme-Core definiert zentrale XTend-Design-Tokens');

  assertFileIncludes('components/xdialog.js', 'xtend.component.x-dialog.', 'XDialog nutzt kanonischen Open-State');
  assertFileIncludes('components/xdialog.js', 'dialog-opened', 'XDialog emittiert dialog-opened');

  assertFileIncludes('components/xmodal.js', 'xtend.component.x-modal.', 'XModal nutzt kanonischen Open-State');
  assertFileIncludes('components/xmodal.js', 'modal-action', 'XModal emittiert modal-action');
  assertFileIncludes('components/xmodal.js', 'prefers-reduced-motion', 'XModal respektiert prefers-reduced-motion');

  assertFileIncludes('components/xtoast.js', 'toast-dismissed', 'XToast emittiert toast-dismissed');
  assertFileIncludes('components/xtoast.js', 'prefers-reduced-motion', 'XToast respektiert prefers-reduced-motion');
  assert(!readText('components/xtoast.js', rootDir).includes('window.showToast'), 'XToast enthaelt keinen versteckten globalen Helper');

  assertFileIncludes('components/xalert.js', 'xtend.component.x-alert.', 'XAlert spiegelt seinen Zustand in den kanonischen State');
  assertFileIncludes('components/xalert.js', 'alert-dismissed', 'XAlert emittiert alert-dismissed');

  assertFileIncludes('components/xrouter.js', 'router-navigate', 'XRouter verarbeitet xstate-basierte Navigation');
  assertFileIncludes('components/xrouter.d.ts', 'RenderRouteResult', 'XRouter TypeScript-Definitionen sind vorhanden');

  assertFileIncludes('docs/de/api.md', 'window.XTend', 'Deutsche API-Doku beschreibt den XTend Host-Namespace');
  assertFileIncludes('docs/en/api.md', 'window.XTend', 'Englische API-Doku beschreibt den XTend Host-Namespace');

  assertSyntaxCheck('components/xtoast.js', '.js');
  assertSyntaxCheck('components/xalert.js', '.js');
  assertSyntaxCheck('components/xdialog.js', '.js');
  assertSyntaxCheck('components/xmodal.js', '.js');
  assertSyntaxCheck('components/xtheme.js', '.js');
  assertSyntaxCheck('components/xrouter.js', '.mjs');
  assertSyntaxCheck('api.js', '.mjs');

  return context.result();
}

function printCoreContractReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Core Contract Verification erfolgreich.',
    failureTitle: 'XTend Core Contract Verification fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runCoreContractSuite();
  printCoreContractReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  runCoreContractSuite,
  printCoreContractReport
};

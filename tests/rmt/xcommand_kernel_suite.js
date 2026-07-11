const fs = require('fs');
const path = require('path');
const { createSuiteContext, printSuiteReport } = require('../utils/assertions');
const { readJson, readText, resolveRepoPath, resolveRootDir } = require('../utils/files');
const { syntaxCheckFile } = require('../utils/process');

const XCOMMAND_GATE_SCHEMA = 'xtend.xcommand.kernel-gate.v1';
const XCOMMAND_CONTRACT = 'xtend.xcommand.kernel-contract.v1';
const XKEYMAP_CONTRACT = 'xtend.xkeymap.surface-contract.v1';
const RMT_XCOMMAND_SCHEMA = 'xtend.rmt.xcommand.v1';
const APP_SHELL_FIXTURE_PATH = 'tests/browser/fixtures/xcommand-keymap-app-shell.html';
const APP_SHELL_FIXTURE_SCHEMA = 'xtend.xcommand.app-shell-fixture.v1';

function validateRuntime(context, rootDir) {
  const xcommand = require(resolveRepoPath('xcommand/xcommand.js', rootDir));
  context.assert(xcommand.XCOMMAND_KERNEL_CONTRACT === XCOMMAND_CONTRACT, 'XCommand module declares kernel contract');
  context.assert(xcommand.XKEYMAP_SURFACE_CONTRACT === XKEYMAP_CONTRACT, 'XCommand module declares XKeymap surface contract');
  context.assert(xcommand.RMT_XCOMMAND_SCHEMA === RMT_XCOMMAND_SCHEMA, 'XCommand module declares RMT schema');

  const xstateWrites = [];
  const fabricRecords = [];
  const invoked = [];
  const kernel = xcommand.createXCommandKernel({
    chordTimeoutMs: 100,
    xstate: { get: () => undefined, set: (key, value) => xstateWrites.push({ key, value }) },
    fabric: { schedule: (record) => fabricRecords.push(record) },
    actionExecutor: (record) => invoked.push(record.id)
  });

  kernel.register({ id: 'global.save', keys: 'Mod+S', label: { i18nKey: 'commands.save', fallback: 'Save' }, action: 'action.saveDocument', lane: 'interaction', keymap: { group: 'file', order: 10 } });
  kernel.register({ id: 'navigation.go-to-file', keys: 'g f', label: { i18nKey: 'commands.goToFile', fallback: 'Go to file' }, event: 'event.openQuickFile', scope: 'app-shell', keymap: { group: 'navigation', order: 20 } });

  const direct = kernel.dispatch({ token: 'Mod+S', scope: 'global', timestamp: 10 });
  context.assert(direct.status === 'invoked' && direct.commandId === 'global.save', 'single shortcut invokes registered command');
  context.assert(invoked.includes('global.save'), 'action executor sees invoked shortcut');
  context.assert(fabricRecords.some((record) => record.kind === 'xcommand.dispatch' && record.commandId === 'global.save'), 'Fabric receives dispatch schedule record');
  context.assert(xstateWrites.some((write) => write.key === 'xtend.xcommand.last'), 'XState receives last command write');

  const pending = kernel.dispatch({ token: 'g', scope: 'app-shell', timestamp: 20 });
  context.assert(pending.status === 'pending-chord', 'first key of chord produces pending-chord');
  const chord = kernel.dispatch({ token: 'f', scope: 'app-shell', timestamp: 30 });
  context.assert(chord.status === 'invoked' && chord.commandId === 'navigation.go-to-file', 'second key invokes chord command');

  kernel.dispatch({ token: 'g', scope: 'app-shell', timestamp: 50 });
  const timeoutResult = kernel.dispatch({ token: 'x', scope: 'app-shell', timestamp: 250 });
  context.assert(timeoutResult.status === 'ignored', 'expired chord resets before next stroke');
  context.assert(xstateWrites.some((write) => write.key === 'xtend.xcommand.chord.timeout'), 'XState receives chord timeout write');

  const keymap = kernel.getKeymap('app-shell');
  context.assert(keymap.some((entry) => entry.id === 'navigation.go-to-file' && entry.group === 'navigation'), 'Keymap exposes scoped chord entry');
  const model = xcommand.createXKeymapModel(keymap, { platform: 'mac' });
  context.assert(model.groups.some((group) => group.commands.some((command) => command.sequence.includes('g'))), 'XKeymap model groups command sequences');
}

function validateRmtParser(context, rootDir) {
  const xcommand = require(resolveRepoPath('xcommand/xcommand.js', rootDir));
  const parsed = xcommand.parseRmtXCommands(`
    xcommand "global.save" {
      keys: "Mod+S"
      label: i18n("commands.save", "Save")
      icon: "save"
      action: action.saveDocument
      lane: interaction
      keymap: group("file") visible(true)
    }
    xcommand "navigation.go-to-file" {
      keys: "g f"
      label: i18n("commands.goToFile", "Go to file")
      icon: "file-search"
      event: event.openQuickFile
      scope: "app-shell"
      keymap: group("navigation") order(20)
    }
  `, { allowedActionRefs: ['action.saveDocument'], allowedEventRefs: ['event.openQuickFile'] });
  context.assert(parsed.schema === RMT_XCOMMAND_SCHEMA, 'RMT xcommand parser returns schema');
  context.assert(parsed.records.length === 2, 'RMT xcommand parser extracts two command records');
  context.assert(parsed.records[1].sequence.join(' ') === 'g f', 'RMT xcommand parser preserves key chord sequence');
  context.assert(parsed.records[0].actionRef === 'action.saveDocument', 'RMT xcommand parser maps action reference');

  const rejected = xcommand.parseRmtXCommands(`
    xcommand "admin.delete" {
      keys: "Ctrl+D"
      action: action.admin.deleteAllData
    }
  `);
  context.assert(rejected.records.length === 0, 'RMT xcommand parser rejects references without a host allowlist');
  context.assert(rejected.diagnostics.some((diagnostic) => diagnostic.code === 'xcommand.registration.action.unauthorized'), 'RMT xcommand parser reports unauthorized action reference');

  const blockedInvocations = [];
  const gatedKernel = xcommand.createXCommandKernel({ allowedActionRefs: ['action.saveDocument'], actionExecutor: () => blockedInvocations.push('blocked') });
  gatedKernel.register({ id: 'admin.delete', keys: 'Ctrl+D', action: 'action.admin.deleteAllData' });
  const blocked = gatedKernel.dispatch({ token: 'Ctrl+d', timestamp: 500 });
  context.assert(blocked.status === 'ignored', 'kernel refuses to dispatch unallowlisted action references when a host policy is configured');
  context.assert(gatedKernel.getDiagnostics().some((diagnostic) => diagnostic.code === 'xcommand.registration.action.unauthorized'), 'kernel reports unauthorized registration references');
  context.assert(blockedInvocations.length === 0, 'kernel does not execute unauthorized registrations');

  const callbackInvocations = [];
  const authorizeCalls = [];
  const callbackGatedKernel = xcommand.createXCommandKernel({
    authorizeReference: (kind, ref, record) => {
      authorizeCalls.push({ kind, ref, id: record.id });
      return ref === 'action.saveDocument';
    },
    actionExecutor: () => callbackInvocations.push('blocked')
  });
  callbackGatedKernel.register({ id: 'admin.callback-delete', keys: 'Ctrl+Shift+D', action: 'action.admin.deleteAllData' });
  const callbackBlocked = callbackGatedKernel.dispatch({ token: 'Ctrl+Shift+d', timestamp: 600 });
  context.assert(authorizeCalls.some((call) => call.kind === 'action' && call.ref === 'action.admin.deleteAllData' && call.id === 'admin.callback-delete'), 'kernel invokes host authorizeReference callbacks for registrations');
  context.assert(callbackGatedKernel.getDiagnostics().some((diagnostic) => diagnostic.code === 'xcommand.registration.action.unauthorized'), 'kernel reports callback-denied registration references');
  context.assert(callbackBlocked.status === 'ignored', 'kernel refuses to dispatch callback-denied action references');
  context.assert(callbackInvocations.length === 0, 'kernel does not execute callback-denied registrations');
}


function validateAppShellFixture(context, rootDir) {
  const fixture = readText(APP_SHELL_FIXTURE_PATH, rootDir);
  context.assert(fixture.includes(APP_SHELL_FIXTURE_SCHEMA), 'XCommand app-shell fixture declares result schema');
  context.assert(fixture.includes('../../../xcommand/xcommand.js'), 'XCommand app-shell fixture loads local XCommand runtime');
  context.assert(fixture.includes('../../../components/xkeymap.js'), 'XCommand app-shell fixture loads local XKeymap component');
  context.assert(fixture.includes('data-xtend-app-shell="xcommand-keymap-fixture"'), 'XCommand app-shell fixture declares XTend app shell marker');
  context.assert(fixture.includes('<x-keymap id="keymap"'), 'XCommand app-shell fixture renders x-keymap surface');
  context.assert(fixture.includes('xcommand "global.save"') && fixture.includes('keys: "Mod+S"'), 'XCommand app-shell fixture declares classic Mod+S command');
  context.assert(fixture.includes('xcommand "navigation.go-to-file"') && fixture.includes('keys: "g f"'), 'XCommand app-shell fixture declares g f chord command');
  context.assert(fixture.includes('role="status"') && fixture.includes('aria-live="polite"'), 'XCommand app-shell fixture exposes accessible indicator');
  context.assert(fixture.includes('window.XCommand.createXCommandKernel'), 'XCommand app-shell fixture boots the kernel');
  context.assert(fixture.includes('window.XCommand.parseRmtXCommands'), 'XCommand app-shell fixture derives commands from RMT source');
  context.assert(fixture.includes('keymap.open(kernel.getKeymap'), 'XCommand app-shell fixture opens generated keymap');
  context.assert(!/https?:\/\//u.test(fixture), 'XCommand app-shell fixture has no external network dependency');
  context.assert(!/fetch\s*\(/u.test(fixture), 'XCommand app-shell fixture does not fetch external data');
  context.assert(!/import\s*\(/u.test(fixture), 'XCommand app-shell fixture does not use dynamic imports');
}

function validateSurfaceAndDocs(context, rootDir) {
  ['xcommand/xcommand.js', 'xcommand/xcommand.d.ts', 'components/xkeymap.js', 'development/XTend-XCommand-XKeymap-Plan.md', 'development/docs-evidence/legacy-routes/en/xcommand-xkeymap-plan.md', APP_SHELL_FIXTURE_PATH].forEach((relativePath) => {
    context.assert(fs.existsSync(resolveRepoPath(relativePath, rootDir)), `${relativePath} exists`);
  });
  const component = readText('components/xkeymap.js', rootDir);
  context.assert(component.includes('xtend.xkeymap.surface-contract.v1'), 'x-keymap component declares surface contract');
  context.assert(component.includes('--xkeymap-key-bg') && component.includes('role="dialog"'), 'x-keymap component provides theme hook and dialog role');
  const manifest = readJson('components/manifest.json', rootDir);
  context.assert(manifest['x-keymap'] === './xkeymap.js', 'component manifest exposes x-keymap');
  const packageManifest = readJson('package.json', rootDir);
  context.assert(packageManifest.exports['./xcommand'].default === './xcommand/xcommand.js', 'package exports xcommand runtime');
  context.assert(packageManifest.exports['./xcommand'].types === './xcommand/xcommand.d.ts', 'package exports xcommand types');
  context.assert(packageManifest.exports['./components/xkeymap.js'] === './components/xkeymap.js', 'package exports x-keymap component');
  context.assert(packageManifest.scripts['test:xcommand-kernel'] === 'node scripts/run_xtend_tests.js xcommand-kernel', 'package exposes xcommand gate');
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  context.assert(runner.includes("require('../tests/rmt/xcommand_kernel_suite')"), 'runner imports xcommand suite');
  context.assert(runner.includes("id: 'xcommand-kernel'"), 'runner registers xcommand gate');
  const plan = readText('development/XTend-XCommand-XKeymap-Plan.md', rootDir);
  context.assert(plan.includes('Status: `implemented`'), 'development plan is marked implemented');
}

function runXCommandKernelSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({ id: 'xcommand-kernel', label: 'XCommand Kernel and XKeymap Gate' });
  ['xcommand/xcommand.js', 'components/xkeymap.js', 'tests/rmt/xcommand_kernel_suite.js'].forEach((relativePath) => {
    const syntax = syntaxCheckFile(relativePath, { rootDir, extension: '.js' });
    context.assert(syntax.ok, `${relativePath} syntax passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  });
  validateRuntime(context, rootDir);
  validateRmtParser(context, rootDir);
  validateSurfaceAndDocs(context, rootDir);
  validateAppShellFixture(context, rootDir);
  return context.result({ schema: XCOMMAND_GATE_SCHEMA, contracts: [XCOMMAND_CONTRACT, XKEYMAP_CONTRACT, RMT_XCOMMAND_SCHEMA], appShellFixture: APP_SHELL_FIXTURE_PATH });
}

function printXCommandKernelReport(result) {
  printSuiteReport(result, {
    successTitle: 'XCommand Kernel und XKeymap Gate erfolgreich.',
    failureTitle: 'XCommand Kernel und XKeymap Gate fehlgeschlagen:'
  });
}

module.exports = { printXCommandKernelReport, runXCommandKernelSuite };

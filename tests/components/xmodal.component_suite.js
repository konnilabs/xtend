const {
  printComponentContractReport,
  runComponentContractSuite
} = require('./component_contract_helpers');

const xmodalConfig = {
  tag: 'x-modal',
  fileName: 'xmodal.js',
  docTitle: 'xmodal - XTend Komponente',
  label: 'x-modal component contract',
  sourcePath: 'components/xmodal.js',
  fixturePath: 'tests/components/fixtures/xmodal.component.html',
  docPath: 'docs/components/xmodal.md',
  profiles: ['overlay', 'stateful', 'accessibility'],
  observedAttributes: ['open', 'overlay', 'title', 'content', 'actions'],
  sourceContracts: [
    { pattern: 'xtend.component.x-modal.', message: 'x-modal syncs the canonical open-state key' },
    { pattern: 'modal-open-', message: 'x-modal keeps legacy open-state compatibility' },
    { pattern: 'uiState.modals', message: 'x-modal reads modal entries from ui.modals' },
    { pattern: 'modal-opened', message: 'x-modal emits modal-opened' },
    { pattern: 'modal-closed', message: 'x-modal emits modal-closed' },
    { pattern: 'modal-action', message: 'x-modal emits modal-action' },
    { pattern: 'bubbles: true', message: 'x-modal events bubble' },
    { pattern: 'composed: true', message: 'x-modal events are composed' },
    { pattern: 'actionsSlot.name = \'actions\'', message: 'x-modal supports an actions slot' },
    { pattern: 'document.createElement(\'slot\')', message: 'x-modal supports default slot content' },
    { pattern: 'role="dialog"', message: 'x-modal exposes dialog role' },
    { pattern: 'aria-modal="true"', message: 'x-modal marks modal semantics' },
    { pattern: 'aria-hidden', message: 'x-modal synchronizes aria-hidden' },
    { pattern: 'aria-labelledby', message: 'x-modal labels the dialog title' },
    { pattern: 'event.key === \'Escape\'', message: 'x-modal supports Escape close' },
    { pattern: 'event.key !== \'Tab\'', message: 'x-modal implements Tab focus trap' },
    { pattern: 'document.removeEventListener', message: 'x-modal removes document listeners' },
    { pattern: 'this._unsubscribeState()', message: 'x-modal unsubscribes from state' },
    { pattern: 'prefers-reduced-motion', message: 'x-modal respects reduced motion' },
    { pattern: 'open()', message: 'x-modal exposes open API' },
    { pattern: 'close(options = {})', message: 'x-modal exposes close API' },
    { pattern: "portalStrategy: 'document-body-portal-layer'", message: 'x-modal declares document-wide overlay portal strategy' },
    { pattern: '_ensureDocumentPortal', message: 'x-modal portals open overlays to document body' },
    { pattern: 'document.body.appendChild(this)', message: 'x-modal moves overlay hosts out of constrained route containers' },
    { pattern: '_restoreDocumentPortal', message: 'x-modal restores direct DOM modals after close' },
    { pattern: "data-xtend-portal', 'document-body'", message: 'x-modal marks document-body portal state' }
  ],
  fixtureContracts: [
    { pattern: 'id="component-modal"', message: 'x-modal fixture uses a stable id' },
    { pattern: 'open', message: 'x-modal fixture covers open attribute' },
    { pattern: 'overlay', message: 'x-modal fixture covers overlay attribute' },
    { pattern: 'title="Component modal"', message: 'x-modal fixture covers title attribute' },
    { pattern: 'content="Component modal content"', message: 'x-modal fixture covers content attribute' },
    { pattern: 'actions=', message: 'x-modal fixture covers actions attribute' },
    { pattern: 'slot="actions"', message: 'x-modal fixture covers actions slot' },
    { pattern: 'window.xstate', message: 'x-modal fixture stubs xstate locally' },
    { pattern: '__xtendComponentResult', message: 'x-modal fixture exposes a component result object' }
  ],
  docContracts: [
    { pattern: '| `open` |', message: 'x-modal docs describe open attribute' },
    { pattern: '| `overlay` |', message: 'x-modal docs describe overlay attribute' },
    { pattern: '| `actions` |', message: 'x-modal docs describe actions attribute' },
    { pattern: '`modal-opened`', message: 'x-modal docs describe modal-opened' },
    { pattern: '`modal-closed`', message: 'x-modal docs describe modal-closed' },
    { pattern: '`modal-action`', message: 'x-modal docs describe modal-action' },
    { pattern: '`xtend.component.x-modal.<id>.open`', message: 'x-modal docs describe canonical open-state key' },
    { pattern: 'Focus-Ruecksprung', message: 'x-modal docs describe focus return' },
    { pattern: 'document.body', message: 'x-modal docs describe document-wide portal behavior' }
  ]
};

function runXModalComponentSuite(options = {}) {
  return runComponentContractSuite(xmodalConfig, options);
}

function printXModalComponentReport(result) {
  printComponentContractReport(result);
}

if (require.main === module) {
  const result = runXModalComponentSuite();
  printXModalComponentReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printXModalComponentReport,
  runXModalComponentSuite
};

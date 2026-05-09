const {
  printComponentContractReport,
  runComponentContractSuite
} = require('./component_contract_helpers');

const xtoastConfig = {
  tag: 'x-toast',
  fileName: 'xtoast.js',
  docTitle: 'xtoast - XTend Komponente',
  label: 'x-toast component contract',
  sourcePath: 'components/xtoast.js',
  fixturePath: 'tests/components/fixtures/xtoast.component.html',
  docPath: 'docs/components/xtoast.md',
  profiles: ['feedback', 'interactive'],
  observedAttributes: ['type', 'duration'],
  sourceContracts: [
    { pattern: 'toast-shown', message: 'x-toast emits toast-shown' },
    { pattern: 'toast-dismissed', message: 'x-toast emits toast-dismissed' },
    { pattern: 'bubbles: true', message: 'x-toast events bubble' },
    { pattern: 'composed: true', message: 'x-toast events are composed' },
    { pattern: '<slot></slot>', message: 'x-toast renders default slot content' },
    { pattern: "role = type === 'error' ? 'alert' : 'status'", message: 'x-toast exposes status-or-alert role' },
    { pattern: 'aria-live', message: 'x-toast exposes aria-live' },
    { pattern: 'button class="close"', message: 'x-toast exposes a close button' },
    { pattern: 'aria-label="Schliessen"', message: 'x-toast close button is labelled' },
    { pattern: 'prefers-reduced-motion', message: 'x-toast respects reduced motion' },
    { pattern: 'clearTimeout(this._timeout)', message: 'x-toast clears timers during lifecycle changes' },
    { pattern: 'attributeChangedCallback', message: 'x-toast reacts to attribute changes after hydration' },
    { pattern: 'width: var(--toast-width, min(100%, 370px))', message: 'x-toast constrains itself to the available container width' },
    { pattern: 'max-width: 100%', message: 'x-toast never exceeds its host container' },
    { pattern: 'overflow-wrap: anywhere', message: 'x-toast wraps long messages instead of overflowing the viewport' },
    { pattern: '1.1em 3.6em 1.1em 1.2em', message: 'x-toast reserves inline space for the close control' }
  ],
  fixtureContracts: [
    { pattern: 'id="component-toast"', message: 'x-toast fixture uses a stable id' },
    { pattern: 'type="success"', message: 'x-toast fixture covers type attribute' },
    { pattern: 'duration="0"', message: 'x-toast fixture covers duration attribute' },
    { pattern: '__xtendComponentResult', message: 'x-toast fixture exposes a component result object' }
  ],
  docContracts: [
    { pattern: '| `type` |', message: 'x-toast docs describe type attribute' },
    { pattern: '| `duration` |', message: 'x-toast docs describe duration attribute' },
    { pattern: '`toast-shown`', message: 'x-toast docs describe toast-shown' },
    { pattern: '`toast-dismissed`', message: 'x-toast docs describe toast-dismissed' },
    { pattern: "xstate.get('ui').toasts", message: 'x-toast docs describe API-managed state aggregation' },
    { pattern: 'window.XToast.show()', message: 'x-toast docs describe API entry point' },
    { pattern: 'viewport-sichere Surface', message: 'x-toast docs describe viewport-safe stack layout' }
  ]
};

function runXToastComponentSuite(options = {}) {
  const result = runComponentContractSuite(xtoastConfig, options);
  const source = require('../utils/files').readText('components/xtoast.js', options.rootDir);
  result.passes = result.passes || [];
  result.failures = result.failures || [];
  if (source.includes('window.showToast')) {
    result.ok = false;
    result.failures.push('x-toast must not expose a hidden global showToast helper');
  } else {
    result.passes.push('x-toast keeps global helper wiring outside the component');
  }
  return result;
}

function printXToastComponentReport(result) {
  printComponentContractReport(result);
}

if (require.main === module) {
  const result = runXToastComponentSuite();
  printXToastComponentReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printXToastComponentReport,
  runXToastComponentSuite
};

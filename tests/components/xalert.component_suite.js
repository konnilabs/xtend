const {
  printComponentContractReport,
  runComponentContractSuite
} = require('./component_contract_helpers');

const xalertConfig = {
  tag: 'x-alert',
  fileName: 'xalert.js',
  docTitle: 'xalert - XTend Komponente',
  label: 'x-alert component contract',
  sourcePath: 'components/xalert.js',
  fixturePath: 'tests/components/fixtures/xalert.component.html',
  docPath: 'docs/components/xalert.md',
  profiles: ['feedback', 'stateful'],
  observedAttributes: ['type', 'closable', 'duration', 'overlay', 'aria-label'],
  sourceContracts: [
    { pattern: 'xtend.component.x-alert.', message: 'x-alert syncs the canonical state key' },
    { pattern: 'xalert-state-', message: 'x-alert documents the legacy compatibility state key' },
    { pattern: 'alert-shown', message: 'x-alert emits alert-shown' },
    { pattern: 'alert-dismissed', message: 'x-alert emits alert-dismissed' },
    { pattern: 'bubbles: true', message: 'x-alert events bubble' },
    { pattern: 'composed: true', message: 'x-alert events are composed' },
    { pattern: 'document.createElement(\'slot\')', message: 'x-alert renders default slot content' },
    { pattern: "role = isAssertive ? 'alert' : 'status'", message: 'x-alert exposes alert-or-status role' },
    { pattern: 'aria-live', message: 'x-alert exposes aria-live' },
    { pattern: 'aria-busy', message: 'x-alert exposes aria-busy' },
    { pattern: 'tabindex', message: 'x-alert creates a focusable alert container' },
    { pattern: 'prefers-reduced-motion', message: 'x-alert respects reduced motion' },
    { pattern: 'clearTimeout(this._timeout)', message: 'x-alert clears timers during lifecycle changes' },
    { pattern: 'attributeChangedCallback', message: 'x-alert reacts to attribute changes after hydration' },
    { pattern: 'queueMicrotask', message: 'x-alert manages focus after hydration' },
    { pattern: 'is-closable', message: 'x-alert reserves text space for closable alerts' },
    { pattern: '--xalert-bg', message: 'x-alert owns solid alert background tokens' },
    { pattern: '--xalert-fg', message: 'x-alert owns solid alert foreground tokens' },
    { pattern: '--xalert-accent', message: 'x-alert exposes a semantic accent token' },
    { pattern: 'gradientFree: true', message: 'x-alert declares gradient-free feedback semantics' },
    { pattern: 'solidContrastPalette: true', message: 'x-alert declares solid contrast palette semantics' }
  ],
  absentSourceContracts: [
    { pattern: 'linear-gradient', message: 'x-alert source does not use gradient alert backgrounds' }
  ],
  fixtureContracts: [
    { pattern: 'id="component-alert"', message: 'x-alert fixture uses a stable id' },
    { pattern: 'type="warning"', message: 'x-alert fixture covers type attribute' },
    { pattern: 'closable', message: 'x-alert fixture covers closable attribute' },
    { pattern: 'overlay', message: 'x-alert fixture covers overlay attribute' },
    { pattern: 'aria-label="Component alert"', message: 'x-alert fixture covers aria-label' },
    { pattern: 'window.XTend.state', message: 'x-alert fixture stubs state locally' },
    { pattern: '__xtendComponentResult', message: 'x-alert fixture exposes a component result object' }
  ],
  docContracts: [
    { pattern: '| `type` |', message: 'x-alert docs describe type attribute' },
    { pattern: '| `closable` |', message: 'x-alert docs describe closable attribute' },
    { pattern: '| `duration` |', message: 'x-alert docs describe duration attribute' },
    { pattern: '| `overlay` |', message: 'x-alert docs describe overlay attribute' },
    { pattern: '`alert-shown`', message: 'x-alert docs describe alert-shown' },
    { pattern: '`alert-dismissed`', message: 'x-alert docs describe alert-dismissed' },
    { pattern: '`xtend.component.x-alert.<id>`', message: 'x-alert docs describe canonical state key' },
    { pattern: 'solide Kontrastfarben', message: 'x-alert docs describe the solid contrast palette' }
  ]
};

function runXAlertComponentSuite(options = {}) {
  return runComponentContractSuite(xalertConfig, options);
}

function printXAlertComponentReport(result) {
  printComponentContractReport(result);
}

if (require.main === module) {
  const result = runXAlertComponentSuite();
  printXAlertComponentReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printXAlertComponentReport,
  runXAlertComponentSuite
};

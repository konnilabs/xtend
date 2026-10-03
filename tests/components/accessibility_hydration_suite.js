const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  runAriaInHtmlConformanceSuite
} = require('../a11y/aria_in_html_conformance_suite');

const COMPONENT_GATES = [
  {
    tag: 'x-alert',
    sourcePath: 'components/xalert.js',
    fixturePath: 'tests/components/fixtures/xalert.component.html',
    accessibilityContracts: [
      { pattern: "role = isAssertive ? 'alert' : 'status'", message: 'uses alert-or-status role' },
      { pattern: "setAttribute('aria-live', ariaLive)", message: 'sets aria-live based on alert type' },
      { pattern: "setAttribute('aria-busy', 'false')", message: 'publishes settled live-region state' },
      { pattern: "setAttribute('tabindex', '-1')", message: 'creates a programmatic focus target' },
      { pattern: "setAttribute('aria-label', ariaLabel)", message: 'accepts an explicit aria-label' },
      { pattern: 'container.focus()', message: 'moves focus after overlay hydration' },
      { pattern: 'prefers-reduced-motion', message: 'respects reduced-motion users' },
      { pattern: "button.setAttribute('aria-label', 'Schliessen')", message: 'labels the dismiss control' }
    ],
    hydrationContracts: [
      { pattern: 'connectedCallback()', message: 'hydrates from connectedCallback' },
      { pattern: 'attributeChangedCallback', message: 'rehydrates after attribute changes' },
      { pattern: 'disconnectedCallback()', message: 'cleans up on detach' },
      { pattern: 'clearTimeout(this._timeout)', message: 'prevents timer duplication during rehydration' },
      { pattern: "button.addEventListener('click'", message: 'wires explicit dismissal after render' },
      { pattern: 'xtend.component.x-alert.', message: 'syncs canonical component state' }
    ],
    fixtureContracts: [
      { pattern: '<x-alert', message: 'fixture contains x-alert markup' },
      { pattern: 'aria-label="Component alert"', message: 'fixture exercises aria-label' },
      { pattern: 'window.XTend.state', message: 'fixture provides local state stub' },
      { pattern: '__xtendComponentResult', message: 'fixture exposes hydration result object' }
    ]
  },
  {
    tag: 'x-toast',
    sourcePath: 'components/xtoast.js',
    fixturePath: 'tests/components/fixtures/xtoast.component.html',
    accessibilityContracts: [
      { pattern: "role = type === 'error' ? 'alert' : 'status'", message: 'uses status-or-alert live-region role' },
      { pattern: 'aria-live', message: 'sets live-region politeness' },
      { pattern: 'aria-label="Schliessen"', message: 'labels the dismiss control' },
      { pattern: 'focus-visible', message: 'keeps keyboard focus visible' },
      { pattern: 'prefers-reduced-motion', message: 'respects reduced-motion users' }
    ],
    hydrationContracts: [
      { pattern: 'connectedCallback()', message: 'hydrates from connectedCallback' },
      { pattern: 'attributeChangedCallback', message: 'rehydrates after attribute changes' },
      { pattern: 'disconnectedCallback()', message: 'cleans up on detach' },
      { pattern: 'clearTimeout(this._timeout)', message: 'prevents timer duplication during rehydration' },
      { pattern: "closeButton.addEventListener('click'", message: 'wires explicit dismissal after render' }
    ],
    fixtureContracts: [
      { pattern: '<x-toast', message: 'fixture contains x-toast markup' },
      { pattern: 'duration="0"', message: 'fixture disables auto-dismiss flakiness' },
      { pattern: '__xtendComponentResult', message: 'fixture exposes hydration result object' }
    ]
  },
  {
    tag: 'x-modal',
    sourcePath: 'components/xmodal.js',
    fixturePath: 'tests/components/fixtures/xmodal.component.html',
    accessibilityContracts: [
      { pattern: 'role="dialog"', message: 'uses dialog role' },
      { pattern: 'aria-modal="true"', message: 'marks modal context' },
      { pattern: 'aria-hidden', message: 'syncs hidden state for assistive tech' },
      { pattern: 'tabindex="0"', message: 'creates an initial focus target' },
      { pattern: "modal.setAttribute('aria-labelledby', 'xmodal-title')", message: 'links title to dialog' },
      { pattern: "event.key === 'Escape'", message: 'supports Escape dismissal' },
      { pattern: "event.key !== 'Tab'", message: 'implements Tab focus trap guard' },
      { pattern: 'modal.focus()', message: 'moves focus into the modal' },
      { pattern: '_lastFocusedElement.focus', message: 'returns focus after close' },
      { pattern: 'prefers-reduced-motion', message: 'respects reduced-motion users' }
    ],
    hydrationContracts: [
      { pattern: 'connectedCallback()', message: 'hydrates from connectedCallback' },
      { pattern: 'attributeChangedCallback', message: 'rehydrates after attribute changes' },
      { pattern: 'disconnectedCallback()', message: 'cleans up on detach' },
      { pattern: 'document.removeEventListener', message: 'removes global key listener' },
      { pattern: 'this.shadowRoot.removeEventListener', message: 'removes shadow key listener' },
      { pattern: 'this._unsubscribeState()', message: 'removes state subscription' },
      { pattern: '_syncOpenAttribute', message: 'keeps DOM attribute and state aligned' },
      { pattern: "slot.addEventListener('slotchange'", message: 'updates fallback content after slot hydration' },
      { pattern: 'xtend.component.x-modal.', message: 'syncs canonical component state' }
    ],
    fixtureContracts: [
      { pattern: '<x-modal', message: 'fixture contains x-modal markup' },
      { pattern: 'open', message: 'fixture starts in visible hydrated state' },
      { pattern: 'overlay', message: 'fixture exercises overlay mode' },
      { pattern: 'slot="actions"', message: 'fixture exercises action slot hydration' },
      { pattern: 'window.XTend.state', message: 'fixture provides local state stub' },
      { pattern: '__xtendComponentResult', message: 'fixture exposes hydration result object' }
    ]
  },
  {
    tag: 'x-dialog',
    sourcePath: 'components/xdialog.js',
    fixturePath: null,
    accessibilityContracts: [
      { pattern: 'role="dialog"', message: 'uses dialog role' },
      { pattern: 'aria-modal="true"', message: 'marks modal context' },
      { pattern: 'aria-hidden', message: 'syncs hidden state for assistive tech' },
      { pattern: 'tabindex="0"', message: 'creates an initial focus target' },
      { pattern: "dialog.setAttribute('aria-labelledby', 'xdialog-title')", message: 'links title to dialog' },
      { pattern: "event.key === 'Escape'", message: 'supports Escape dismissal' },
      { pattern: "event.key !== 'Tab'", message: 'implements Tab focus trap guard' },
      { pattern: 'dialog.focus()', message: 'moves focus into the dialog' },
      { pattern: '_lastFocusedElement.focus', message: 'returns focus after close' },
      { pattern: 'prefers-reduced-motion', message: 'respects reduced-motion users' }
    ],
    hydrationContracts: [
      { pattern: 'connectedCallback()', message: 'hydrates from connectedCallback' },
      { pattern: 'attributeChangedCallback', message: 'rehydrates after attribute changes' },
      { pattern: 'disconnectedCallback()', message: 'cleans up on detach' },
      { pattern: 'document.removeEventListener', message: 'removes global key listener' },
      { pattern: 'this.shadowRoot.removeEventListener', message: 'removes shadow key listener' },
      { pattern: 'this._unsubscribeState()', message: 'removes state subscription' },
      { pattern: '_syncOpenAttribute', message: 'keeps DOM attribute and state aligned' },
      { pattern: "slot.addEventListener('slotchange'", message: 'updates fallback content after slot hydration' },
      { pattern: 'xtend.component.x-dialog.', message: 'syncs canonical component state' }
    ],
    fixtureContracts: []
  }
];

const BROWSER_HYDRATION_GATES = [
  {
    label: 'custom element browser fixture',
    path: 'tests/browser/fixtures/custom-elements-smoke.html',
    contracts: [
      { pattern: '__xtendBrowserSmokeResult', message: 'exposes browser hydration result object' },
      { pattern: 'customElements.whenDefined', message: 'waits for Custom Element registration' },
      { pattern: "recordCheck('shadow root rendered'", message: 'checks shadow-root hydration' },
      { pattern: "recordCheck('body visible'", message: 'checks visible UI activation' },
      { pattern: "recordCheck('state synchronized'", message: 'checks state hydration' }
    ]
  },
  {
    label: 'core flow browser fixture',
    path: 'tests/browser/fixtures/core-flows-smoke.html',
    contracts: [
      { pattern: '__xtendCoreSmokeResult', message: 'exposes core hydration result object' },
      { pattern: "recordCheck('loader kept body visible by default'", message: 'checks shell-first visible body default' },
      { pattern: "recordCheck('router rendered detail route'", message: 'checks router hydration' },
      { pattern: "recordCheck('toast api rendered visible component'", message: 'checks toast API activation' },
      { pattern: "recordCheck('alert api rendered visible component'", message: 'checks alert API activation' },
      { pattern: "recordCheck('dialog open state synchronized'", message: 'checks dialog state hydration' },
      { pattern: "recordCheck('modal open state synchronized'", message: 'checks modal state hydration' }
    ]
  },
  {
    label: 'a11y focus keyboard browser fixture',
    path: 'tests/browser/fixtures/a11y-focus-keyboard-smoke.html',
    contracts: [
      { pattern: 'xtend.a11y.browser-keyboard-smoke.v1', message: 'declares stable A11y keyboard smoke contract' },
      { pattern: '__xtendA11yKeyboardSmokeResult', message: 'exposes A11y keyboard smoke result object' },
      { pattern: "recordCheck('x-link enter key navigated route'", message: 'checks Enter routing activation' },
      { pattern: "recordCheck('x-link space key navigated route'", message: 'checks Space routing activation' },
      { pattern: "recordCheck('x-input delegated focus'", message: 'checks delegated form control focus' },
      { pattern: "recordCheck('x-form captured keyboard input data'", message: 'checks form state synchronization' },
      { pattern: "recordCheck('x-tabs arrow right selected next tab'", message: 'checks ArrowRight tab navigation' },
      { pattern: "recordCheck('x-tabs arrow left selected previous tab'", message: 'checks ArrowLeft tab navigation' },
      { pattern: "recordCheck('x-modal initial focus moved inside overlay'", message: 'checks overlay initial focus' },
      { pattern: "recordCheck('x-modal tab focus trap wrapped to first control'", message: 'checks forward focus trap' },
      { pattern: "recordCheck('x-modal shift tab focus trap wrapped to last control'", message: 'checks reverse focus trap' },
      { pattern: "recordCheck('x-modal escape restored focus to origin'", message: 'checks Escape close and focus restore' }
    ]
  }
];

function assertContracts(context, content, contracts, prefix) {
  contracts.forEach((contract) => {
    context.assertIncludes(content, contract.pattern, `${prefix}: ${contract.message}`);
  });
}

function assertFixtureContract(context, fixture, target) {
  context.assert(
    !fixture.includes('https://cdn.ccs-networks.de/xtend/components/'),
    `${target.tag}: fixture uses repo-local component imports`
  );
  context.assertIncludes(
    fixture,
    `/components/${target.sourcePath.split('/').pop()}`,
    `${target.tag}: fixture loads the repo-local component file`
  );
  assertContracts(context, fixture, target.fixtureContracts, `${target.tag} fixture`);
}

function runAccessibilityHydrationSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  const context = createSuiteContext({
    id: 'a11y-hydration',
    label: 'Accessibility and hydration gates'
  });

  COMPONENT_GATES.forEach((target) => {
    const source = readText(target.sourcePath, rootDir);
    assertContracts(context, source, target.accessibilityContracts, `${target.tag} accessibility`);
    assertContracts(context, source, target.hydrationContracts, `${target.tag} hydration`);

    if (target.fixturePath) {
      const fixture = readText(target.fixturePath, rootDir);
      assertFixtureContract(context, fixture, target);
    }
  });

  BROWSER_HYDRATION_GATES.forEach((fixtureGate) => {
    const fixture = readText(fixtureGate.path, rootDir);
    assertContracts(context, fixture, fixtureGate.contracts, fixtureGate.label);
  });

  const ariaInHtml = runAriaInHtmlConformanceSuite({ rootDir });
  ariaInHtml.passes.forEach((message) => context.pass(`ARIA in HTML 2026: ${message}`));
  ariaInHtml.failures.forEach((message) => context.fail(`ARIA in HTML 2026: ${message}`));

  return context.result({
    components: COMPONENT_GATES.map((target) => target.tag),
    browserFixtures: BROWSER_HYDRATION_GATES.map((fixtureGate) => fixtureGate.path),
    ariaInHtmlConformance: {
      schema: ariaInHtml.schema,
      ok: ariaInHtml.ok,
      baseline: ariaInHtml.baseline,
      claimBoundary: ariaInHtml.claimBoundary
    }
  });
}

function printAccessibilityHydrationReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Accessibility/Hydration Gates erfolgreich.',
    failureTitle: 'XTend Accessibility/Hydration Gates fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runAccessibilityHydrationSuite();
  printAccessibilityHydrationReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  printAccessibilityHydrationReport,
  runAccessibilityHydrationSuite
};

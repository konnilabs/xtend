const path = require('path');
const {
  createSuiteContext,
  printSuiteReport
} = require('../utils/assertions');
const {
  readJson,
  readText,
  resolveRootDir
} = require('../utils/files');
const {
  NAVIGATION_ROUTING_PROFILES,
  NAVIGATION_ROUTING_REQUIRED_ASSERTIONS,
  NAVIGATION_ROUTING_REQUIRED_COMMANDS,
  NAVIGATION_ROUTING_REQUIRED_DOMAINS,
  NAVIGATION_ROUTING_REQUIRED_EVENTS,
  NAVIGATION_ROUTING_REQUIRED_SCHEDULES,
  NAVIGATION_ROUTING_TARGETS,
  NAVIGATION_ROUTING_UX_CONTRACT_DOC,
  NAVIGATION_ROUTING_UX_FIXTURE,
  NAVIGATION_ROUTING_UX_REPORT_SCHEMA,
  NAVIGATION_ROUTING_UX_SCHEMA,
  NAVIGATION_ROUTING_UX_WORKPACKAGE,
  KERNEL_BOUNDARY,
  createNavigationRoutingUxContract,
  validateNavigationRoutingUxContract
} = require('../../xtend-builder/typing/navigation-routing-ux-contract');

const componentPaths = {
  'x-router': {
    source: 'components/xrouter.js',
    types: 'components/xrouter.d.ts',
    docs: 'docs/components/xrouter.md',
    event: 'route-announced',
    stateKey: 'xtend.router.current',
    command: 'announceRoute'
  },
  'x-link': {
    source: 'components/xlink.js',
    types: 'components/xlink.d.ts',
    docs: 'docs/components/xlink.md',
    event: 'before-navigate',
    stateKey: 'xlink-active-<id>',
    command: 'updateActive'
  }
};

function indexById(records = []) {
  return new Map(records.map((record) => [record.id, record]));
}

function assertIncludesAll(context, values, expected, label) {
  expected.forEach((entry) => {
    context.assert(Array.isArray(values) && values.includes(entry), `${label} includes ${entry}`);
  });
}

function assertFixtureReferencesResolve(context, fixture) {
  const adapters = indexById(fixture.adapters);
  const schedules = indexById(fixture.schedules);
  const components = indexById(fixture.components);
  const templates = indexById(fixture.templates);
  const routes = indexById(fixture.routes);

  (fixture.routes || []).forEach((route) => {
    context.assert(schedules.has(route.schedule), `${route.id}: route schedule resolves`);
    context.assert(templates.has(route.template), `${route.id}: route template resolves`);
  });

  (fixture.components || []).forEach((component) => {
    context.assert(adapters.has(component.adapter), `${component.id}: adapter resolves`);
    context.assert(templates.has(component.template), `${component.id}: template resolves`);
    context.assert(schedules.has(component.schedule), `${component.id}: schedule resolves`);
    (component.routes || []).forEach((routeId) => {
      context.assert(routes.has(routeId), `${component.id}: route ${routeId} resolves`);
    });
    Object.values(component.commands || {}).forEach((command) => {
      context.assert(schedules.has(command.schedule), `${component.id}: command schedule ${command.schedule} resolves`);
    });
  });

  (fixture.templates || []).forEach((template) => {
    (template.nodes || []).forEach((node) => {
      if (node.component) context.assert(components.has(node.component), `${template.id}: node component ${node.component} resolves`);
    });
  });
}

function runNavigationRoutingUxSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'navigation-routing-ux',
    label: 'XTend Navigation and Routing UX maturity'
  });
  const contract = createNavigationRoutingUxContract();
  const validation = validateNavigationRoutingUxContract(contract);
  const invalidValidation = validateNavigationRoutingUxContract({
    schema: NAVIGATION_ROUTING_UX_SCHEMA,
    kernelBoundary: 'xtend-imports-in-rmt-kernel',
    targets: ['x-router'],
    domains: [],
    requiredEvents: [],
    requiredCommands: [],
    requiredSchedules: [],
    activeState: { ariaCurrentRequired: false },
    focusRestore: { focusAfterRenderRequired: false },
    routeAnnouncements: { ariaAtomicRequired: false },
    keyboardNavigation: { spaceRequired: false },
    rmt: { shellFirst: false, noInlineRuntimeCode: false },
    fabric: { telemetryCorrelationRequired: false },
    tests: { assertions: [] }
  });
  const fixture = readJson(NAVIGATION_ROUTING_UX_FIXTURE, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const contractDoc = readText(NAVIGATION_ROUTING_UX_CONTRACT_DOC, rootDir);
  const workpackage = readText('development/WP-E11-10-Navigation-und-Routing-UX-Reife-umsetzen.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const refs = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const typingReadme = readText('xtend-builder/typing/README.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.navigationRoutingUxMaturity;
  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);

  context.assert(contract.schema === NAVIGATION_ROUTING_UX_SCHEMA, 'Navigation Routing UX factory emits stable schema');
  context.assert(validation.schema === NAVIGATION_ROUTING_UX_REPORT_SCHEMA, 'Navigation Routing UX validator emits report schema');
  context.assert(validation.ok, 'Navigation Routing UX validator accepts factory output');
  context.assert(!invalidValidation.ok, 'Navigation Routing UX validator rejects invalid records');
  context.assert(contract.workpackage === NAVIGATION_ROUTING_UX_WORKPACKAGE, 'Navigation Routing UX contract is owned by WP-E11-10');
  context.assert(contract.kernelBoundary === KERNEL_BOUNDARY, 'Navigation Routing UX contract preserves RMT kernel boundary');
  assertIncludesAll(context, contract.targets, NAVIGATION_ROUTING_TARGETS, 'Navigation Routing UX targets');
  assertIncludesAll(context, contract.domains, NAVIGATION_ROUTING_REQUIRED_DOMAINS, 'Navigation Routing UX domains');
  assertIncludesAll(context, contract.requiredEvents, NAVIGATION_ROUTING_REQUIRED_EVENTS, 'Navigation Routing UX events');
  assertIncludesAll(context, contract.requiredCommands, NAVIGATION_ROUTING_REQUIRED_COMMANDS, 'Navigation Routing UX commands');
  assertIncludesAll(context, contract.requiredSchedules, NAVIGATION_ROUTING_REQUIRED_SCHEDULES, 'Navigation Routing UX schedules');
  assertIncludesAll(context, contract.tests.assertions, NAVIGATION_ROUTING_REQUIRED_ASSERTIONS, 'Navigation Routing UX assertions');
  context.assert(contract.activeState.ariaCurrentRequired === true, 'Navigation Routing UX contract requires aria-current active state');
  context.assert(contract.focusRestore.focusAfterRenderRequired === true, 'Navigation Routing UX contract requires focus restore after render');
  context.assert(contract.routeAnnouncements.ariaAtomicRequired === true, 'Navigation Routing UX contract requires atomic route announcements');
  context.assert(contract.keyboardNavigation.spaceRequired === true, 'Navigation Routing UX contract requires Space activation');
  context.assert(contract.rmt.shellFirst === true, 'Navigation Routing UX contract is RMT shell-first ready');
  context.assert(contract.fabric.telemetryCorrelationRequired === true, 'Navigation Routing UX contract requires Fabric telemetry correlation');

  context.assert(fixture.manifest.metadata.contractVersion === NAVIGATION_ROUTING_UX_SCHEMA, 'RMT fixture declares Navigation Routing UX schema');
  context.assert(fixture.manifest.metadata.workpackage === NAVIGATION_ROUTING_UX_WORKPACKAGE, 'RMT fixture declares WP-E11-10 owner');
  context.assert(fixture.manifest.metadata.kernelBoundary === KERNEL_BOUNDARY, 'RMT fixture preserves kernel boundary');
  NAVIGATION_ROUTING_REQUIRED_SCHEDULES.forEach((schedule) => {
    context.assert(schedules.has(schedule), `RMT fixture declares ${schedule}`);
  });
  NAVIGATION_ROUTING_TARGETS.forEach((tag) => {
    const matching = (fixture.components || []).find((component) => component.tag === tag);
    context.assert(Boolean(matching), `RMT fixture includes ${tag}`);
    if (matching) {
      context.assert(Boolean(matching.a11y), `${tag}: declares a11y record`);
      context.assert(Boolean(matching.fabric), `${tag}: declares Fabric record`);
      context.assert(Boolean(matching.commands), `${tag}: declares commands record`);
    }
  });
  context.assert(components.get('docs.router').adapter === 'xtend.xrouter', 'RMT fixture uses xtend.xrouter adapter for router');
  context.assert(components.get('docs.router').props['reuse-component'] === true, 'RMT fixture opts router into insular route component reuse');
  context.assert(components.get('docs.router').commands['focus-route'].schedule === 'route.focus.restore', 'RMT fixture schedules router focus restore');
  context.assert(components.get('docs.router').commands['announce-route'].schedule === 'a11y.announce', 'RMT fixture schedules route announcements');
  context.assert(components.get('docs.router').commands['reuse-route-component'].schedule === 'route.transition.render', 'RMT fixture schedules router route component reuse');
  context.assert(components.get('docs.nav.home').a11y.activeState === 'aria-current=page', 'RMT fixture declares link active state');
  context.assert(components.get('docs.nav.guides').commands.navigate.schedule === 'ui.user-blocking.navigation', 'RMT fixture schedules link navigation');
  assertFixtureReferencesResolve(context, fixture);

  NAVIGATION_ROUTING_PROFILES.forEach((profile) => {
    const paths = componentPaths[profile.tag];
    const source = readText(paths.source, rootDir);
    const types = readText(paths.types, rootDir);
    const docs = readText(paths.docs, rootDir);

    context.assert(source.includes('xtendNavigationRoutingUxProfile'), `${profile.tag} exposes xtendNavigationRoutingUxProfile`);
    context.assert(source.includes(`componentRef: '${profile.tag}'`) || source.includes(`componentRef: "${profile.tag}"`), `${profile.tag} UX profile declares componentRef`);
    context.assert(source.includes('xtend.component.navigation-routing-ux-profile.v1'), `${profile.tag} source declares Navigation Routing UX profile schema`);
    context.assert(source.includes('xtend.rmt.component-contract.v1'), `${profile.tag} source exposes RMT metadata`);
    context.assert(source.includes(KERNEL_BOUNDARY), `${profile.tag} source preserves RMT kernel boundary`);
    context.assert(source.includes('@xtend-fabric'), `${profile.tag} source exposes Fabric API marker`);
    context.assert(source.includes('xtend.performance.component-profile.v1'), `${profile.tag} source exposes performance profile`);
    context.assert(source.includes('xtend.a11y.screenreader-signals.v1'), `${profile.tag} source exposes screenreader signals`);
    context.assert(source.includes('aria-current'), `${profile.tag} source declares active route state`);
    context.assert(source.includes('aria-live'), `${profile.tag} source declares route announcement behavior`);
    context.assert(source.includes('aria-atomic'), `${profile.tag} source declares atomic route announcements`);
    context.assert(source.includes('focus('), `${profile.tag} source exposes focus behavior`);
    if (profile.tag === 'x-router') {
      context.assert(source.includes("this._handleNavigation({ focus: false, source: 'initial-load' })"), 'x-router preserves document focus on cold-start initial render');
      context.assert(source.includes('if (options.focus === false)'), 'x-router can skip route outlet focus restore for non-interactive renders');
      context.assert(source.includes('this.focusRoute(enrichedDetail)'), 'x-router keeps focus restore for interactive route changes');
      context.assert(source.includes('#outlet[data-xtend-skeleton-active="true"][data-xtend-skeleton-mode="overlay"] > :not([data-xtend-skeleton-loader])'), 'x-router prevents route content from becoming interactive beneath its loading skeleton');
      context.assert(source.includes("'navigation-policy'") && source.includes('canNavigate(href, context = {})'), 'x-router exposes progressive navigation policy and capability inspection');
      context.assert(source.includes("schema: 'xtend.router.navigation-capability.v1'"), 'x-router capability result uses the public navigation capability schema');
      context.assert(types.includes('XRouterNavigationPolicy') && types.includes('XRouterNavigationCapability'), 'x-router types expose progressive policy and capability results');
      context.assert(docs.includes('navigation-policy') && docs.includes('canNavigate'), 'x-router docs describe progressive capability checks');
    } else if (profile.tag === 'x-link') {
      context.assert(source.includes("'navigation'") && source.includes("['auto', 'client', 'document']"), 'x-link exposes auto, client and document navigation modes');
      context.assert(source.includes('navigationKind') && source.includes('fallbackReason'), 'x-link events report client/document choice and fallback reason');
      context.assert(types.includes('XLinkNavigation') && types.includes('XLinkNavigationKind'), 'x-link types expose progressive navigation modes');
      context.assert(docs.includes('navigation="auto"') && docs.includes('fallbackReason'), 'x-link docs describe native-anchor progressive enhancement');
    }
    context.assert(source.includes('prefers-reduced-motion'), `${profile.tag} source is reduced-motion safe`);
    context.assert(source.includes('forced-colors'), `${profile.tag} source is forced-colors safe`);
    context.assert(source.includes('part=') || source.includes('setAttribute("part"') || source.includes("setAttribute('part'"), `${profile.tag} source exposes CSS parts`);
    context.assert(source.includes(paths.event), `${profile.tag} source exposes ${paths.event}`);
    context.assert(source.includes(profile.schedule), `${profile.tag} source declares schedule ${profile.schedule}`);
    context.assert(source.includes(paths.stateKey.replace('<id>', '${this.id}')) || source.includes(paths.stateKey), `${profile.tag} source declares state key ${paths.stateKey}`);
    context.assert(source.includes(paths.command), `${profile.tag} source exposes command ${paths.command}`);
    context.assert(types.includes('XtendNavigationRoutingUxProfile'), `${profile.tag} public types import Navigation Routing UX profile`);
    context.assert(types.includes('NavigationRoutingUxProfile'), `${profile.tag} public types export profile alias`);
    context.assert(docs.includes('xtend.component.navigation-routing-ux-profile.v1'), `${profile.tag} docs describe Navigation Routing UX profile`);
    context.assert(docs.includes(paths.stateKey), `${profile.tag} docs describe state key ${paths.stateKey}`);
  });

  context.assert((typeof packageManifest.exports['./builder/typing/navigation-routing-ux-contract'] === 'string' ? packageManifest.exports['./builder/typing/navigation-routing-ux-contract'] : packageManifest.exports['./builder/typing/navigation-routing-ux-contract'] && packageManifest.exports['./builder/typing/navigation-routing-ux-contract'].default) === './xtend-builder/typing/navigation-routing-ux-contract.js', 'Package exports Navigation Routing UX contract module');
  context.assert(packageManifest.scripts['test:navigation-routing-ux'] === 'node scripts/run_xtend_tests.js navigation-routing-ux', 'Package exposes Navigation Routing UX test script');
  context.assert(metadata && metadata.schema === NAVIGATION_ROUTING_UX_SCHEMA, 'Package metadata exposes Navigation Routing UX schema');
  context.assert(metadata.reportSchema === NAVIGATION_ROUTING_UX_REPORT_SCHEMA, 'Package metadata exposes Navigation Routing UX report schema');
  context.assert(metadata.fixture === NAVIGATION_ROUTING_UX_FIXTURE, 'Package metadata exposes Navigation Routing UX fixture');
  context.assert(Array.isArray(metadata.targets) && metadata.targets.includes('x-router'), 'Package metadata includes x-router target');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('focus-restore-after-route'), 'Package metadata exposes focus restore assertion');
  context.assert(metadata.profileGetter === 'xtendNavigationRoutingUxProfile', 'Package metadata exposes Navigation Routing UX profile getter');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata preserves RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'navigationRoutingUxMaturity', 'Scaffold config exposes Navigation Routing UX section');
  context.assertIncludes(scaffoldConfig, NAVIGATION_ROUTING_UX_SCHEMA, 'Scaffold config declares Navigation Routing UX schema');
  context.assertIncludes(runner, "id: 'navigation-routing-ux'", 'Runner exposes Navigation Routing UX suite');
  context.assertIncludes(contractDoc, NAVIGATION_ROUTING_UX_SCHEMA, 'Contract document declares Navigation Routing UX schema');
  context.assertIncludes(contractDoc, '`xtendNavigationRoutingUxProfile`', 'Contract document describes runtime profile');
  context.assertIncludes(workpackage, 'xtend.epic11.wp10.navigation-routing-ux.v1', 'WP-E11-10 document declares schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-10 document is completed');
  context.assertIncludes(epic, '| `WP-E11-10` | P1 | completed |', 'Epic marks WP-E11-10 completed');
  context.assertIncludes(epic, '| `WP-E11-11` | P1 | completed |', 'Epic marks WP-E11-11 completed');
  context.assertIncludes(epic, '| `WP-E11-12` | P1 | completed |', 'Epic marks WP-E11-12 completed');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-10` | P1 | completed |', 'Backlog marks WP-E11-10 completed');
  context.assertIncludes(backlog, '| `WP-E11-11` | P1 | completed |', 'Backlog marks WP-E11-11 completed');
  context.assertIncludes(backlog, '| `WP-E11-12` | P1 | completed |', 'Backlog marks WP-E11-12 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed |', 'Backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed |', 'Backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(refs, NAVIGATION_ROUTING_UX_FIXTURE, 'Reference registry includes Navigation Routing UX fixture');
  context.assertIncludes(refs, 'tests/components/navigation_routing_ux_suite.js', 'Reference registry includes Navigation Routing UX suite');
  context.assertIncludes(typingReadme, 'Navigation Routing UX Contract', 'Typing README documents Navigation Routing UX contract');

  return context.result({
    report: {
      schema: NAVIGATION_ROUTING_UX_REPORT_SCHEMA,
      fixture: NAVIGATION_ROUTING_UX_FIXTURE,
      targetCount: NAVIGATION_ROUTING_TARGETS.length,
      assertionCount: NAVIGATION_ROUTING_REQUIRED_ASSERTIONS.length
    }
  });
}

function printNavigationRoutingUxReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Navigation Routing UX Suite erfolgreich.',
    failureTitle: 'XTend Navigation Routing UX Suite fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runNavigationRoutingUxSuite();
  printNavigationRoutingUxReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printNavigationRoutingUxReport,
  runNavigationRoutingUxSuite
};

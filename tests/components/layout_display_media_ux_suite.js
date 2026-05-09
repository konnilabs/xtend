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
  KERNEL_BOUNDARY,
  LAYOUT_DISPLAY_MEDIA_PROFILES,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_COMMANDS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_DOMAINS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_EVENTS,
  LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES,
  LAYOUT_DISPLAY_MEDIA_TARGETS,
  LAYOUT_DISPLAY_MEDIA_UX_CONTRACT_DOC,
  LAYOUT_DISPLAY_MEDIA_UX_FIXTURE,
  LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA,
  LAYOUT_DISPLAY_MEDIA_UX_SCHEMA,
  LAYOUT_DISPLAY_MEDIA_UX_WORKPACKAGE,
  createLayoutDisplayMediaUxContract,
  validateLayoutDisplayMediaUxContract
} = require('../../xtend-builder/typing/layout-display-media-ux-contract');

const componentPaths = {
  'x-section': {
    source: 'components/xsection.js',
    types: 'components/xsection.d.ts',
    docs: 'docs/components/xsection.md',
    event: 'section-rendered',
    stateKey: 'xsection-state-<id>',
    command: 'snapshot'
  },
  'x-cards': {
    source: 'components/xcards.js',
    types: 'components/xcards.d.ts',
    docs: 'docs/components/xcards.md',
    event: 'cards-layout',
    stateKey: 'xcards-state-<id>',
    command: 'snapshot'
  },
  'x-header': {
    source: 'components/xheader.js',
    types: 'components/xheader.d.ts',
    docs: 'docs/components/xheader.md',
    event: 'header-ready',
    stateKey: 'xheader-state-<id>',
    command: 'snapshot'
  },
  'x-footer': {
    source: 'components/xfooter.js',
    types: 'components/xfooter.d.ts',
    docs: 'docs/components/xfooter.md',
    event: 'footer-ready',
    stateKey: 'xfooter-state-<id>',
    command: 'snapshot'
  },
  'x-hero': {
    source: 'components/xhero.js',
    types: 'components/xhero.d.ts',
    docs: 'docs/components/xhero.md',
    event: 'hero-rendered',
    stateKey: 'xhero-state-<id>',
    command: 'snapshot'
  },
  'x-type': {
    source: 'components/xtype.js',
    types: 'components/xtype.d.ts',
    docs: 'docs/components/xtype.md',
    event: 'typing-started',
    stateKey: 'xtype-current',
    command: 'snapshot'
  },
  'x-code': {
    source: 'components/xcode.js',
    types: 'components/xcode.d.ts',
    docs: 'docs/components/xcode.md',
    event: 'code-copied',
    stateKey: 'xcode-state-<id>',
    command: 'snapshot'
  },
  'x-masonry': {
    source: 'components/xmasonry.js',
    types: 'components/xmasonry.d.ts',
    docs: 'docs/components/xmasonry.md',
    event: 'masonry-layout',
    stateKey: 'xmasonry-state-<id>',
    command: 'snapshot'
  },
  'x-summary': {
    source: 'components/xsummary.js',
    types: 'components/xsummary.d.ts',
    docs: 'docs/components/xsummary.md',
    event: 'open',
    stateKey: 'xsummary-open-<id>',
    command: 'snapshot'
  },
  'x-player': {
    source: 'components/xplayer.js',
    types: 'components/xplayer.d.ts',
    docs: 'docs/components/xplayer.md',
    event: 'xplayer-play',
    stateKey: 'xplayer-state-<id>',
    command: 'snapshot'
  },
  'x-lightbox': {
    source: 'components/xlightbox.js',
    types: 'components/xlightbox.d.ts',
    docs: 'docs/components/xlightbox.md',
    event: 'lightbox-opened',
    stateKey: 'xlightbox-open-<id>',
    command: 'snapshot'
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

  (fixture.components || []).forEach((component) => {
    context.assert(adapters.has(component.adapter), `${component.id}: adapter resolves`);
    context.assert(templates.has(component.template), `${component.id}: template resolves`);
    context.assert(schedules.has(component.schedule), `${component.id}: schedule resolves`);
    Object.values(component.commands || {}).forEach((command) => {
      context.assert(schedules.has(command.schedule), `${component.id}: command schedule ${command.schedule} resolves`);
    });
  });

  (fixture.templates || []).forEach((template) => {
    (template.nodes || []).forEach((node) => {
      if (node.component) context.assert(components.has(node.component), `${template.id}: node component ${node.component} resolves`);
    });
  });

  ((fixture.diagnostics && fixture.diagnostics.snapshots) || []).forEach((snapshot) => {
    context.assert(schedules.has(snapshot.schedule), `diagnostics snapshot schedule ${snapshot.schedule} resolves`);
    (snapshot.targets || []).forEach((target) => {
      context.assert(components.has(target), `diagnostics snapshot target ${target} resolves`);
    });
  });
}

function runLayoutDisplayMediaUxSuite(options = {}) {
  const rootDir = resolveRootDir(options.rootDir || path.resolve(__dirname, '..', '..'));
  const context = createSuiteContext({
    id: 'layout-display-media-ux',
    label: 'XTend Layout Display and Media UX maturity'
  });
  const contract = createLayoutDisplayMediaUxContract();
  const validation = validateLayoutDisplayMediaUxContract(contract);
  const invalidValidation = validateLayoutDisplayMediaUxContract({
    schema: LAYOUT_DISPLAY_MEDIA_UX_SCHEMA,
    kernelBoundary: 'xtend-imports-in-rmt-kernel',
    targets: ['x-section'],
    domains: [],
    requiredEvents: [],
    requiredCommands: [],
    requiredSchedules: [],
    responsiveLayout: { viewportSafeRequired: false },
    contentProjection: { namedSlotsRequired: false },
    mediaLifecycle: { lazyMediaLoadRequired: false },
    lazyLoading: { visibleHydrationRequired: false },
    rmt: { shellFirst: false, noInlineRuntimeCode: false },
    fabric: { telemetryCorrelationRequired: false },
    tests: { assertions: [] }
  });
  const fixture = readJson(LAYOUT_DISPLAY_MEDIA_UX_FIXTURE, rootDir);
  const packageManifest = readJson('package.json', rootDir);
  const scaffoldConfig = readText('xtend-builder/scaffold.config.js', rootDir);
  const runner = readText('scripts/run_xtend_tests.js', rootDir);
  const contractDoc = readText(LAYOUT_DISPLAY_MEDIA_UX_CONTRACT_DOC, rootDir);
  const workpackage = readText('development/WP-E11-12-Layout-Display-und-Media-Shell-Reife-umsetzen.md', rootDir);
  const epic = readText('development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const backlog = readText('development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md', rootDir);
  const refs = readText('development/XTend-Dokumentations-und-Demo-Referenzpfade.md', rootDir);
  const typingReadme = readText('xtend-builder/typing/README.md', rootDir);
  const metadata = packageManifest.xtend && packageManifest.xtend.layoutDisplayMediaUxMaturity;
  const components = indexById(fixture.components);
  const schedules = indexById(fixture.schedules);
  const adapters = indexById(fixture.adapters);

  context.assert(contract.schema === LAYOUT_DISPLAY_MEDIA_UX_SCHEMA, 'Layout Display Media UX factory emits stable schema');
  context.assert(validation.schema === LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA, 'Layout Display Media UX validator emits report schema');
  context.assert(validation.ok, 'Layout Display Media UX validator accepts factory output');
  context.assert(!invalidValidation.ok, 'Layout Display Media UX validator rejects invalid records');
  context.assert(contract.workpackage === LAYOUT_DISPLAY_MEDIA_UX_WORKPACKAGE, 'Layout Display Media UX contract is owned by WP-E11-12');
  context.assert(contract.kernelBoundary === KERNEL_BOUNDARY, 'Layout Display Media UX contract preserves RMT kernel boundary');
  assertIncludesAll(context, contract.targets, LAYOUT_DISPLAY_MEDIA_TARGETS, 'Layout Display Media UX targets');
  assertIncludesAll(context, contract.domains, LAYOUT_DISPLAY_MEDIA_REQUIRED_DOMAINS, 'Layout Display Media UX domains');
  assertIncludesAll(context, contract.requiredEvents, LAYOUT_DISPLAY_MEDIA_REQUIRED_EVENTS, 'Layout Display Media UX events');
  assertIncludesAll(context, contract.requiredCommands, LAYOUT_DISPLAY_MEDIA_REQUIRED_COMMANDS, 'Layout Display Media UX commands');
  assertIncludesAll(context, contract.requiredSchedules, LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES, 'Layout Display Media UX schedules');
  assertIncludesAll(context, contract.tests.assertions, LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS, 'Layout Display Media UX assertions');
  context.assert(contract.responsiveLayout.viewportSafeRequired === true, 'Layout Display Media UX contract requires viewport-safe layout');
  context.assert(contract.contentProjection.namedSlotsRequired === true, 'Layout Display Media UX contract requires named slot projection');
  context.assert(contract.mediaLifecycle.lazyMediaLoadRequired === true, 'Layout Display Media UX contract requires lazy media lifecycle');
  context.assert(contract.lazyLoading.visibleHydrationRequired === true, 'Layout Display Media UX contract requires visible hydration');
  context.assert(contract.rmt.shellFirst === true, 'Layout Display Media UX contract is RMT shell-first ready');
  context.assert(contract.fabric.telemetryCorrelationRequired === true, 'Layout Display Media UX contract requires Fabric telemetry correlation');

  context.assert(fixture.manifest.metadata.contractVersion === LAYOUT_DISPLAY_MEDIA_UX_SCHEMA, 'RMT fixture declares Layout Display Media UX schema');
  context.assert(fixture.manifest.metadata.workpackage === LAYOUT_DISPLAY_MEDIA_UX_WORKPACKAGE, 'RMT fixture declares WP-E11-12 owner');
  context.assert(fixture.manifest.metadata.kernelBoundary === KERNEL_BOUNDARY, 'RMT fixture preserves kernel boundary');
  LAYOUT_DISPLAY_MEDIA_REQUIRED_SCHEDULES.forEach((schedule) => {
    context.assert(schedules.has(schedule), `RMT fixture declares ${schedule}`);
  });
  context.assert(adapters.has('rmt.layout-host'), 'RMT fixture declares layout host adapter');
  context.assert(adapters.has('rmt.media-host'), 'RMT fixture declares media host adapter');
  LAYOUT_DISPLAY_MEDIA_TARGETS.forEach((tag) => {
    const matching = (fixture.components || []).find((component) => component.tag === tag);
    context.assert(Boolean(matching), `RMT fixture includes ${tag}`);
    if (matching) {
      context.assert(Boolean(matching.shell), `${tag}: declares shell record`);
      context.assert(Boolean(matching.a11y), `${tag}: declares a11y record`);
      context.assert(Boolean(matching.fabric), `${tag}: declares Fabric record`);
      context.assert(Boolean(matching.commands), `${tag}: declares commands record`);
    }
  });
  context.assert(components.get('layout.section').commands.measure.schedule === 'layout.measure', 'RMT fixture schedules section measurement');
  context.assert(components.get('layout.cards').commands.layout.schedule === 'layout.reflow.commit', 'RMT fixture schedules cards layout commit');
  context.assert(components.get('display.code').commands.copy.schedule === 'a11y.announce', 'RMT fixture schedules code copy announcement');
  context.assert(components.get('media.player').commands['preload-media'].schedule === 'media.lazy.load', 'RMT fixture schedules player media lazy load');
  context.assert(components.get('media.lightbox').commands['lazy-load'].schedule === 'media.lazy.load', 'RMT fixture schedules lightbox media lazy load');
  assertFixtureReferencesResolve(context, fixture);

  LAYOUT_DISPLAY_MEDIA_PROFILES.forEach((profile) => {
    const paths = componentPaths[profile.tag];
    const source = readText(paths.source, rootDir);
    const types = readText(paths.types, rootDir);
    const docs = readText(paths.docs, rootDir);

    context.assert(source.includes('xtendLayoutDisplayMediaUxProfile'), `${profile.tag} exposes xtendLayoutDisplayMediaUxProfile`);
    context.assert(source.includes(`componentRef: '${profile.tag}'`) || source.includes(`componentRef: "${profile.tag}"`), `${profile.tag} UX profile declares componentRef`);
    context.assert(source.includes('xtend.component.layout-display-media-ux-profile.v1'), `${profile.tag} source declares Layout Display Media UX profile schema`);
    context.assert(source.includes('xtend.rmt.component-contract.v1'), `${profile.tag} source exposes RMT metadata`);
    context.assert(source.includes(KERNEL_BOUNDARY), `${profile.tag} source preserves RMT kernel boundary`);
    context.assert(source.includes('@xtend-fabric'), `${profile.tag} source exposes Fabric API marker`);
    context.assert(source.includes('xtend.performance.component-profile.v1'), `${profile.tag} source exposes performance profile`);
    context.assert(source.includes('xtend.a11y.screenreader-signals.v1'), `${profile.tag} source exposes screenreader signals`);
    context.assert(source.includes('prefers-reduced-motion'), `${profile.tag} source is reduced-motion safe`);
    context.assert(source.includes('forced-colors'), `${profile.tag} source is forced-colors safe`);
    context.assert(source.includes('part=') || source.includes('setAttribute("part"') || source.includes("setAttribute('part'"), `${profile.tag} source exposes CSS parts`);
    context.assert(source.includes(paths.event), `${profile.tag} source exposes ${paths.event}`);
    context.assert(source.includes(profile.schedule), `${profile.tag} source declares schedule ${profile.schedule}`);
    context.assert(source.includes(paths.stateKey.replace('<id>', '${this.id}')) || source.includes(paths.stateKey), `${profile.tag} source declares state key ${paths.stateKey}`);
    context.assert(source.includes(paths.command), `${profile.tag} source exposes command ${paths.command}`);
    context.assert(types.includes('XtendLayoutDisplayMediaUxProfile'), `${profile.tag} public types import Layout Display Media UX profile`);
    context.assert(types.includes('LayoutDisplayMediaUxProfile'), `${profile.tag} public types export profile alias`);
    context.assert(docs.includes('xtend.component.layout-display-media-ux-profile.v1'), `${profile.tag} docs describe Layout Display Media UX profile`);
    context.assert(docs.includes(paths.stateKey), `${profile.tag} docs describe state key ${paths.stateKey}`);
  });

  context.assert(packageManifest.exports['./builder/typing/layout-display-media-ux-contract'] === './xtend-builder/typing/layout-display-media-ux-contract.js', 'Package exports Layout Display Media UX contract module');
  context.assert(packageManifest.scripts['test:layout-display-media-ux'] === 'node scripts/run_xtend_tests.js layout-display-media-ux', 'Package exposes Layout Display Media UX test script');
  context.assert(metadata && metadata.schema === LAYOUT_DISPLAY_MEDIA_UX_SCHEMA, 'Package metadata exposes Layout Display Media UX schema');
  context.assert(metadata.reportSchema === LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA, 'Package metadata exposes Layout Display Media UX report schema');
  context.assert(metadata.fixture === LAYOUT_DISPLAY_MEDIA_UX_FIXTURE, 'Package metadata exposes Layout Display Media UX fixture');
  context.assert(Array.isArray(metadata.targets) && metadata.targets.includes('x-player'), 'Package metadata includes x-player target');
  context.assert(Array.isArray(metadata.requiredAssertions) && metadata.requiredAssertions.includes('lazy-media-scheduled'), 'Package metadata exposes lazy media assertion');
  context.assert(metadata.profileGetter === 'xtendLayoutDisplayMediaUxProfile', 'Package metadata exposes Layout Display Media UX profile getter');
  context.assert(metadata.kernelBoundary === KERNEL_BOUNDARY, 'Package metadata preserves RMT kernel boundary');
  context.assertIncludes(scaffoldConfig, 'layoutDisplayMediaUxMaturity', 'Scaffold config exposes Layout Display Media UX section');
  context.assertIncludes(scaffoldConfig, LAYOUT_DISPLAY_MEDIA_UX_SCHEMA, 'Scaffold config declares Layout Display Media UX schema');
  context.assertIncludes(runner, "id: 'layout-display-media-ux'", 'Runner exposes Layout Display Media UX suite');
  context.assertIncludes(contractDoc, LAYOUT_DISPLAY_MEDIA_UX_SCHEMA, 'Contract document declares Layout Display Media UX schema');
  context.assertIncludes(contractDoc, '`xtendLayoutDisplayMediaUxProfile`', 'Contract document describes runtime profile');
  context.assertIncludes(workpackage, 'xtend.epic11.wp12.layout-display-media-ux.v1', 'WP-E11-12 document declares schema');
  context.assertIncludes(workpackage, 'Status: `completed`', 'WP-E11-12 document is completed');
  context.assertIncludes(epic, '| `WP-E11-12` | P1 | completed |', 'Epic marks WP-E11-12 completed');
  context.assertIncludes(epic, '| `WP-E11-13` | P1 | completed |', 'Epic marks WP-E11-13 completed');
  context.assertIncludes(epic, '| `WP-E11-14` | P1 | completed |', 'Epic marks WP-E11-14 completed');
  context.assertIncludes(epic, '| `WP-E11-15` | P1 | completed |', 'Epic marks WP-E11-15 completed');
  context.assertIncludes(epic, '| `WP-E11-16` | P1 | completed |', 'Epic marks WP-E11-16 completed');
  context.assertIncludes(epic, '| `WP-E11-17` | P2 | completed |', 'Epic marks WP-E11-17 completed');
  context.assertIncludes(backlog, '| `WP-E11-12` | P1 | completed |', 'Backlog marks WP-E11-12 completed');
  context.assertIncludes(backlog, '| `WP-E11-13` | P1 | completed |', 'Backlog marks WP-E11-13 completed');
  context.assertIncludes(backlog, '| `WP-E11-14` | P1 | completed |', 'Backlog marks WP-E11-14 completed');
  context.assertIncludes(backlog, '| `WP-E11-15` | P1 | completed |', 'Backlog marks WP-E11-15 completed');
  context.assertIncludes(backlog, '| `WP-E11-16` | P1 | completed |', 'Backlog marks WP-E11-16 completed');
  context.assertIncludes(backlog, '| `WP-E11-17` | P2 | completed |', 'Backlog marks WP-E11-17 completed');
  context.assertIncludes(refs, LAYOUT_DISPLAY_MEDIA_UX_FIXTURE, 'Reference registry includes Layout Display Media UX fixture');
  context.assertIncludes(refs, 'tests/components/layout_display_media_ux_suite.js', 'Reference registry includes Layout Display Media UX suite');
  context.assertIncludes(typingReadme, 'Layout Display Media UX Contract', 'Typing README documents Layout Display Media UX contract');

  return context.result({
    report: {
      schema: LAYOUT_DISPLAY_MEDIA_UX_REPORT_SCHEMA,
      fixture: LAYOUT_DISPLAY_MEDIA_UX_FIXTURE,
      targetCount: LAYOUT_DISPLAY_MEDIA_TARGETS.length,
      assertionCount: LAYOUT_DISPLAY_MEDIA_REQUIRED_ASSERTIONS.length
    }
  });
}

function printLayoutDisplayMediaUxReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend Layout Display Media UX Suite erfolgreich.',
    failureTitle: 'XTend Layout Display Media UX Suite fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runLayoutDisplayMediaUxSuite();
  printLayoutDisplayMediaUxReport(result);
  if (!result.ok) process.exit(1);
}

module.exports = {
  printLayoutDisplayMediaUxReport,
  runLayoutDisplayMediaUxSuite
};

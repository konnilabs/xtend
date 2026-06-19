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
const {
  CONTRACTS,
  RMT_SCHEDULE_LANES,
  FABRIC_LANES,
  FABRIC_TO_RMT_LANE,
  createFabricRmtLaneMapping,
  createRmtScheduleRecords,
  normalizeFabricLaneForRmt,
  resolveRmtScheduleForFiber
} = require('../../fabric/rmt-lane-mapping');

function assertScheduleShape(context, schedule) {
  const { assert } = context;
  assert(schedule.schema === CONTRACTS.schedule, `${schedule.id} uses Fabric/RMT schedule wrapper schema`);
  assert(typeof schedule.id === 'string' && schedule.id.length > 0, `${schedule.id} has id`);
  assert(typeof schedule.endpointName === 'string' && schedule.endpointName.startsWith('xtendrmt.'), `${schedule.id} has XTendRMT endpoint`);
  assert(typeof schedule.scope === 'string' && schedule.scope.length > 0, `${schedule.id} has scope`);
  assert(RMT_SCHEDULE_LANES.includes(schedule.lane), `${schedule.id} uses supported RMT schedule lane`);
  assert(typeof schedule.priority === 'number', `${schedule.id} has numeric priority`);
  assert(typeof schedule.deadlineMs === 'number', `${schedule.id} has numeric deadline`);
  assert(typeof schedule.preferIdle === 'boolean', `${schedule.id} has preferIdle flag`);
  assert(typeof schedule.coalesceKey === 'string' && schedule.coalesceKey.length > 0, `${schedule.id} has coalesce key`);
  assert(typeof schedule.budgetClass === 'string' && schedule.budgetClass.length > 0, `${schedule.id} has budget class`);
  assert(schedule.metadata && schedule.metadata.contract === CONTRACTS.mapping, `${schedule.id} carries mapping metadata`);
  assert(schedule.metadata && schedule.metadata.kernelBoundary.includes('RMT sees schedule policy records only'), `${schedule.id} keeps kernel boundary visible`);
}

function runFabricRmtLaneMappingSuite(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
  const context = createSuiteContext({
    id: 'fabric-lane-mapping',
    label: 'XTend-Fabric RMT lane mapping'
  });
  const { assert } = context;
  const source = readText('fabric/rmt-lane-mapping.js', rootDir);
  const syntax = syntaxCheckFile('fabric/rmt-lane-mapping.js', { rootDir, extension: '.js' });

  assert(syntax.ok, `Fabric RMT lane mapping syntax check passes${syntax.ok ? '' : ` (${syntax.message})`}`);
  context.assertIncludes(source, 'xtend.fabric.rmt-lane-mapping.v1', 'Mapping module declares stable contract');
  context.assertIncludes(source, 'xtend.rmt.schedules-domain.v1', 'Mapping module references RMT schedule-domain contract');
  context.assertIncludes(source, 'a11y.user-blocking.announce', 'Mapping module defines a11y schedule record');
  context.assertIncludes(source, 'route.transition.render', 'Mapping module defines transition route schedule');
  context.assertIncludes(source, 'template.prewarm', 'Mapping module defines template prewarm schedule');
  context.assertIncludes(source, 'surface.prewarm', 'Mapping module defines surface prewarm schedule');
  context.assertIncludes(source, 'route.prewarm', 'Mapping module defines route prewarm schedule');
  assert(!source.includes('rmt-runtime'), 'Mapping module does not import the RMT runtime');
  assert(!source.includes("require('../xtendrmt") && !source.includes("require('../../xtendrmt"), 'Mapping module has no XTendRMT kernel require');

  assert(CONTRACTS.mapping === 'xtend.fabric.rmt-lane-mapping.v1', 'Mapping module exports mapping contract');
  assert(CONTRACTS.schedule === 'xtend.fabric.rmt-lane-schedule.v1', 'Mapping module exports schedule wrapper contract');
  assert(FABRIC_LANES.includes('a11y'), 'Mapping module keeps Fabric a11y lane');
  assert(!RMT_SCHEDULE_LANES.includes('a11y'), 'Mapping module does not add a11y to RMT schedule lanes');
  assert(FABRIC_TO_RMT_LANE.a11y === 'user-blocking', 'Fabric a11y maps to RMT user-blocking lane');

  const a11yLane = normalizeFabricLaneForRmt('a11y');
  assert(a11yLane.fabricLane === 'a11y' && a11yLane.rmtLane === 'user-blocking', 'A11y lane resolves to user-blocking RMT lane');
  assert(a11yLane.diagnostics.some((entry) => entry.code === 'xtend.fabric.rmt_lane_mapping.a11y_uses_user_blocking'), 'A11y lane emits explanatory diagnostic');

  const fallbackLane = normalizeFabricLaneForRmt('custom-lane');
  assert(fallbackLane.fabricLane === 'visible', 'Unknown Fabric lane falls back to visible');
  assert(fallbackLane.diagnostics.some((entry) => entry.code === 'xtend.fabric.rmt_lane_mapping.unknown_lane'), 'Unknown Fabric lane emits diagnostic');

  const schedules = createRmtScheduleRecords({ includeRouteVisible: true });
  assert(schedules.length >= 9, 'Mapping creates a full schedule record set');
  schedules.forEach((schedule) => assertScheduleShape(context, schedule));
  assert(schedules.some((schedule) => schedule.id === 'component.visible.mount' && schedule.endpointName === 'xtendrmt.component.mount'), 'Schedule set includes component mount endpoint');
  assert(schedules.some((schedule) => schedule.id === 'component.idle.hydrate' && schedule.preferIdle === true), 'Schedule set includes idle hydration endpoint');
  assert(schedules.some((schedule) => schedule.id === 'component.prewarm.prepare' && schedule.endpointName === 'xtendrmt.component.prewarm'), 'Schedule set includes component prewarm endpoint');
  assert(schedules.some((schedule) => schedule.id === 'template.prewarm' && schedule.lane === 'background'), 'Schedule set includes template prewarm endpoint');
  assert(schedules.some((schedule) => schedule.id === 'template.prerender' && schedule.lane === 'background'), 'Schedule set includes template prerender endpoint');
  assert(schedules.some((schedule) => schedule.id === 'surface.prewarm' && schedule.lane === 'background'), 'Schedule set includes surface prewarm endpoint');
  assert(schedules.some((schedule) => schedule.id === 'route.prewarm' && schedule.lane === 'background'), 'Schedule set includes route prewarm endpoint');
  assert(schedules.some((schedule) => schedule.id === 'route.transition.render' && schedule.lane === 'transition'), 'Schedule set includes transition route endpoint');
  assert(schedules.some((schedule) => schedule.id === 'diagnostics.snapshot' && schedule.lane === 'diagnostics'), 'Schedule set includes diagnostics endpoint');

  const a11ySchedule = schedules.find((schedule) => schedule.id === 'a11y.user-blocking.announce');
  assert(a11ySchedule && a11ySchedule.lane === 'user-blocking', 'A11y schedule uses RMT user-blocking lane');
  assert(a11ySchedule && a11ySchedule.metadata.fabricLane === 'a11y', 'A11y schedule preserves Fabric lane in metadata');
  assert(a11ySchedule && a11ySchedule.metadata.reason.includes('no dedicated a11y lane'), 'A11y schedule documents RMT lane gap');

  const mapping = createFabricRmtLaneMapping({ includeRouteVisible: true });
  assert(mapping.schema === CONTRACTS.mapping, 'Mapping factory exposes stable schema');
  assert(mapping.rmtScheduleLanes.every((lane) => RMT_SCHEDULE_LANES.includes(lane)), 'Mapping factory exposes RMT schedule lane set');
  assert(mapping.getSchedule('route.transition.render').endpointName === 'xtendrmt.route.render', 'Mapping factory resolves generated schedules by id');

  const hydrateResolution = resolveRmtScheduleForFiber({
    schema: CONTRACTS.fiber,
    kind: 'component.hydrate',
    lane: 'idle',
    scope: 'x-alert#secondary',
    componentRef: 'x-alert'
  });
  assert(hydrateResolution.ok === true, 'Fiber schedule resolution succeeds');
  assert(hydrateResolution.scheduleRef === 'component.idle.hydrate', 'Idle hydration fiber resolves to component.idle.hydrate');
  assert(hydrateResolution.endpointName === 'xtendrmt.component.hydrate', 'Idle hydration fiber resolves hydration endpoint');
  assert(hydrateResolution.rmtLane === 'idle', 'Idle hydration fiber stays on idle RMT lane');

  const routeResolution = mapping.resolveFiber({
    kind: 'route.render',
    lane: 'transition',
    scope: '/settings',
    routeRef: '/settings'
  });
  assert(routeResolution.scheduleRef === 'route.transition.render', 'Route render fiber resolves to transition route schedule');
  assert(routeResolution.endpointName === 'xtendrmt.route.render', 'Route render fiber resolves route endpoint');

  const surfacePrewarmResolution = resolveRmtScheduleForFiber({
    kind: 'surface.prewarm',
    scope: 'surface.workspace'
  });
  assert(surfacePrewarmResolution.scheduleRef === 'surface.prewarm', 'Surface prewarm fiber resolves to surface.prewarm schedule');
  assert(surfacePrewarmResolution.endpointName === 'xtendrmt.surface.prewarm', 'Surface prewarm fiber resolves surface prewarm endpoint');
  assert(surfacePrewarmResolution.rmtLane === 'background', 'Surface prewarm fiber runs on background RMT lane');

  const templatePrerenderResolution = resolveRmtScheduleForFiber({
    kind: 'template.prerender',
    scope: 'template.workspace'
  });
  assert(templatePrerenderResolution.scheduleRef === 'template.prerender', 'Template prerender fiber resolves to template.prerender schedule');
  assert(templatePrerenderResolution.rmtLane === 'background', 'Template prerender fiber runs on background RMT lane');

  const a11yResolution = resolveRmtScheduleForFiber({
    kind: 'a11y.announce',
    scope: 'x-toast#status'
  });
  assert(a11yResolution.scheduleRef === 'a11y.user-blocking.announce', 'A11y fiber resolves to explicit a11y schedule');
  assert(a11yResolution.rmtLane === 'user-blocking', 'A11y fiber resolves to user-blocking RMT lane');
  assert(a11yResolution.diagnostics.some((entry) => entry.code === 'xtend.fabric.rmt_lane_mapping.a11y_uses_user_blocking'), 'A11y resolution exposes diagnostic note');

  const bridgeFixture = readJson('tests/fixtures/rmt-app-dsl.native-bridge.rmt', rootDir);
  const providedResolution = resolveRmtScheduleForFiber({
    kind: 'route.render',
    lane: 'visible',
    scheduleRef: 'route.visible.render',
    endpointNameHint: 'xtendrmt.route.render'
  }, {
    schedules: bridgeFixture.schedules
  });
  assert(providedResolution.source === 'provided:scheduleRef', 'Resolver honors provided normalized RMT schedules');
  assert(providedResolution.scheduleRef === 'route.visible.render', 'Resolver preserves provided route.visible.render scheduleRef');
  assert(providedResolution.schedule.deadlineMs === 120, 'Resolver preserves provided schedule budget');

  return context.result();
}

function printFabricRmtLaneMappingReport(result) {
  printSuiteReport(result, {
    successTitle: 'XTend-Fabric RMT Lane Mapping erfolgreich.',
    failureTitle: 'XTend-Fabric RMT Lane Mapping fehlgeschlagen:'
  });
}

if (require.main === module) {
  const result = runFabricRmtLaneMappingSuite();
  printFabricRmtLaneMappingReport(result);
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  runFabricRmtLaneMappingSuite,
  printFabricRmtLaneMappingReport
};

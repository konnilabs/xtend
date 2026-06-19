(function attachXtendFabricRmtLaneMapping(globalTarget, factory) {
  const api = factory(globalTarget);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalTarget && typeof globalTarget === 'object') {
    globalTarget.XTendFabricRmtLaneMapping = Object.freeze({
      schema: api.CONTRACTS.mapping,
      contracts: api.CONTRACTS,
      lanes: api.FABRIC_TO_RMT_LANE,
      createFabricRmtLaneMapping: api.createFabricRmtLaneMapping,
      createRmtScheduleRecords: api.createRmtScheduleRecords,
      resolveRmtScheduleForFiber: api.resolveRmtScheduleForFiber
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createXtendFabricRmtLaneMappingModule() {
  const CONTRACTS = Object.freeze({
    mapping: 'xtend.fabric.rmt-lane-mapping.v1',
    schedule: 'xtend.fabric.rmt-lane-schedule.v1',
    fiber: 'xtend.fabric.fiber.v1',
    lane: 'xtend.fabric.lane.v1',
    rmtSchedule: 'xtend.rmt.schedules-domain.v1'
  });
  const BROWSER_NAMESPACE = 'window.XTendFabricRmtLaneMapping';

  const RMT_SCHEDULE_LANES = Object.freeze([
    'user-blocking',
    'visible',
    'transition',
    'idle',
    'background',
    'diagnostics'
  ]);

  const FABRIC_LANES = Object.freeze([
    'user-blocking',
    'a11y',
    'visible',
    'transition',
    'idle',
    'background',
    'diagnostics'
  ]);

  const FABRIC_TO_RMT_LANE = Object.freeze({
    'user-blocking': 'user-blocking',
    a11y: 'user-blocking',
    visible: 'visible',
    transition: 'transition',
    idle: 'idle',
    background: 'background',
    diagnostics: 'diagnostics'
  });

  const LANE_PROFILES = Object.freeze({
    'user-blocking': Object.freeze({
      priority: 100,
      budgetClass: 'critical',
      deadlineMs: 80,
      preferIdle: false,
      coalesceKey: 'xtend.fabric.user-blocking',
      endpointName: 'xtendrmt.ui.user-blocking',
      scheduleId: 'ui.user-blocking.input',
      scope: 'xtend.fabric.user-blocking'
    }),
    a11y: Object.freeze({
      priority: 95,
      budgetClass: 'critical',
      deadlineMs: 80,
      preferIdle: false,
      coalesceKey: 'xtend.fabric.a11y.announce',
      endpointName: 'xtendrmt.a11y.announce',
      scheduleId: 'a11y.user-blocking.announce',
      scope: 'xtend.fabric.a11y'
    }),
    visible: Object.freeze({
      priority: 80,
      budgetClass: 'interactive',
      deadlineMs: 160,
      preferIdle: false,
      coalesceKey: 'xtend.fabric.visible',
      endpointName: 'xtendrmt.component.render',
      scheduleId: 'component.visible.render',
      scope: 'xtend.fabric.visible'
    }),
    transition: Object.freeze({
      priority: 65,
      budgetClass: 'interactive',
      deadlineMs: 240,
      preferIdle: false,
      coalesceKey: 'xtend.fabric.transition',
      endpointName: 'xtendrmt.route.render',
      scheduleId: 'route.transition.render',
      scope: 'xtend.fabric.transition'
    }),
    idle: Object.freeze({
      priority: 35,
      budgetClass: 'background',
      deadlineMs: 500,
      preferIdle: true,
      coalesceKey: 'xtend.fabric.idle',
      endpointName: 'xtendrmt.component.hydrate',
      scheduleId: 'component.idle.hydrate',
      scope: 'xtend.fabric.idle'
    }),
    background: Object.freeze({
      priority: 25,
      budgetClass: 'best_effort',
      deadlineMs: 1000,
      preferIdle: true,
      coalesceKey: 'xtend.fabric.background',
      endpointName: 'xtendrmt.background.work',
      scheduleId: 'ui.background.work',
      scope: 'xtend.fabric.background'
    }),
    diagnostics: Object.freeze({
      priority: 20,
      budgetClass: 'diagnostics',
      deadlineMs: 750,
      preferIdle: true,
      coalesceKey: 'xtend.fabric.diagnostics',
      endpointName: 'xtendrmt.diagnostics.snapshot',
      scheduleId: 'diagnostics.snapshot',
      scope: 'xtend.fabric.diagnostics'
    })
  });

  const DEFAULT_LANE_BY_KIND = Object.freeze({
    'loader.manifest': 'user-blocking',
    'loader.module': 'visible',
    'component.mount': 'visible',
    'component.hydrate': 'visible',
    'component.render': 'visible',
    'component.update': 'visible',
    'component.disconnect': 'background',
    'component.unmount': 'background',
    'component.dispose': 'background',
    'component.prewarm': 'background',
    'component.worker_prerender_hydrate': 'background',
    'template.prewarm': 'background',
    'template.prerender': 'background',
    'surface.destroy': 'background',
    'surface.cleanup': 'background',
    'surface.prewarm': 'background',
    'resource.release': 'background',
    'event.handler': 'user-blocking',
    'route.navigate': 'user-blocking',
    'route.render': 'transition',
    'route.prewarm': 'background',
    'theme.apply': 'visible',
    'state.sync': 'user-blocking',
    'api.call': 'user-blocking',
    'a11y.announce': 'a11y',
    'diagnostics.snapshot': 'diagnostics',
    'rmt.adapter-result': 'diagnostics'
  });

  const KIND_SCHEDULE_ID_BY_LANE = Object.freeze({
    'component.mount': Object.freeze({
      visible: 'component.visible.mount',
      idle: 'component.idle.hydrate',
      background: 'ui.background.work'
    }),
    'component.hydrate': Object.freeze({
      visible: 'component.visible.hydrate',
      idle: 'component.idle.hydrate',
      background: 'ui.background.work'
    }),
    'component.render': Object.freeze({
      visible: 'component.visible.render',
      transition: 'route.transition.render'
    }),
    'component.update': Object.freeze({
      visible: 'component.visible.render',
      transition: 'route.transition.render'
    }),
    'component.disconnect': Object.freeze({
      background: 'ui.background.work'
    }),
    'component.unmount': Object.freeze({
      background: 'ui.background.work'
    }),
    'component.dispose': Object.freeze({
      background: 'ui.background.work'
    }),
    'component.prewarm': Object.freeze({
      background: 'component.prewarm.prepare',
      idle: 'component.warm.reentry'
    }),
    'component.worker_prerender_hydrate': Object.freeze({
      background: 'component.worker_prerender_hydrate'
    }),
    'template.prewarm': Object.freeze({
      background: 'template.prewarm'
    }),
    'template.prerender': Object.freeze({
      background: 'template.prerender'
    }),
    'surface.destroy': Object.freeze({
      background: 'ui.background.work'
    }),
    'surface.cleanup': Object.freeze({
      background: 'ui.background.work'
    }),
    'surface.prewarm': Object.freeze({
      background: 'surface.prewarm'
    }),
    'resource.release': Object.freeze({
      background: 'ui.background.work'
    }),
    'route.navigate': Object.freeze({
      'user-blocking': 'ui.user-blocking.input'
    }),
    'route.render': Object.freeze({
      visible: 'route.visible.render',
      transition: 'route.transition.render'
    }),
    'route.prewarm': Object.freeze({
      background: 'route.prewarm'
    }),
    'event.handler': Object.freeze({
      'user-blocking': 'ui.user-blocking.input'
    }),
    'state.sync': Object.freeze({
      'user-blocking': 'ui.user-blocking.input'
    }),
    'api.call': Object.freeze({
      'user-blocking': 'ui.user-blocking.input'
    }),
    'theme.apply': Object.freeze({
      visible: 'component.visible.render'
    }),
    'a11y.announce': Object.freeze({
      a11y: 'a11y.user-blocking.announce',
      'user-blocking': 'a11y.user-blocking.announce'
    }),
    'diagnostics.snapshot': Object.freeze({
      diagnostics: 'diagnostics.snapshot'
    }),
    'rmt.adapter-result': Object.freeze({
      diagnostics: 'diagnostics.snapshot'
    })
  });

  const SCHEDULE_OVERRIDES = Object.freeze({
    'ui.user-blocking.input': Object.freeze({
      fabricLane: 'user-blocking',
      endpointName: 'xtendrmt.ui.user-blocking',
      scope: 'xtend.fabric.user-blocking',
      coalesceKey: 'xtend.fabric.user-blocking'
    }),
    'a11y.user-blocking.announce': Object.freeze({
      fabricLane: 'a11y',
      endpointName: 'xtendrmt.a11y.announce',
      scope: 'xtend.fabric.a11y',
      coalesceKey: 'xtend.fabric.a11y.announce'
    }),
    'component.visible.mount': Object.freeze({
      fabricLane: 'visible',
      endpointName: 'xtendrmt.component.mount',
      scope: 'xtend.fabric.component.mount',
      coalesceKey: 'xtend.fabric.component.mount'
    }),
    'component.visible.hydrate': Object.freeze({
      fabricLane: 'visible',
      endpointName: 'xtendrmt.component.hydrate',
      scope: 'xtend.fabric.component.hydrate',
      coalesceKey: 'xtend.fabric.component.hydrate'
    }),
    'component.visible.render': Object.freeze({
      fabricLane: 'visible',
      endpointName: 'xtendrmt.component.render',
      scope: 'xtend.fabric.component.render',
      coalesceKey: 'xtend.fabric.component.render'
    }),
    'route.visible.render': Object.freeze({
      fabricLane: 'visible',
      endpointName: 'xtendrmt.route.render',
      scope: 'xtend.fabric.route.visible',
      coalesceKey: 'xtend.fabric.route.visible'
    }),
    'route.transition.render': Object.freeze({
      fabricLane: 'transition',
      endpointName: 'xtendrmt.route.render',
      scope: 'xtend.fabric.route.transition',
      coalesceKey: 'xtend.fabric.route.transition'
    }),
    'component.idle.hydrate': Object.freeze({
      fabricLane: 'idle',
      endpointName: 'xtendrmt.component.hydrate',
      scope: 'xtend.fabric.component.idle.hydrate',
      coalesceKey: 'xtend.fabric.component.idle.hydrate'
    }),
    'component.lazy.hydrate': Object.freeze({
      fabricLane: 'idle',
      endpointName: 'xtendrmt.component.hydrate',
      scope: 'xtend.fabric.component.lazy.hydrate',
      coalesceKey: 'xtend.fabric.component.lazy.hydrate'
    }),
    'component.warm.reentry': Object.freeze({
      fabricLane: 'idle',
      endpointName: 'xtendrmt.component.prewarm',
      scope: 'xtend.fabric.component.warm-reentry',
      coalesceKey: 'xtend.fabric.component.warm-reentry'
    }),
    'component.prewarm.prepare': Object.freeze({
      fabricLane: 'background',
      endpointName: 'xtendrmt.component.prewarm',
      scope: 'xtend.fabric.component.prewarm',
      coalesceKey: 'xtend.fabric.component.prewarm'
    }),
    'component.worker_prerender_hydrate': Object.freeze({
      fabricLane: 'background',
      endpointName: 'xtendrmt.component.worker_prerender_hydrate',
      scope: 'xtend.fabric.component.worker-prerender-hydrate',
      coalesceKey: 'xtend.fabric.component.worker-prerender-hydrate'
    }),
    'template.prewarm': Object.freeze({
      fabricLane: 'background',
      endpointName: 'xtendrmt.template.prewarm',
      scope: 'xtend.fabric.template.prewarm',
      coalesceKey: 'xtend.fabric.template.prewarm'
    }),
    'template.prerender': Object.freeze({
      fabricLane: 'background',
      endpointName: 'xtendrmt.template.prerender',
      scope: 'xtend.fabric.template.prerender',
      coalesceKey: 'xtend.fabric.template.prerender'
    }),
    'surface.prewarm': Object.freeze({
      fabricLane: 'background',
      endpointName: 'xtendrmt.surface.prewarm',
      scope: 'xtend.fabric.surface.prewarm',
      coalesceKey: 'xtend.fabric.surface.prewarm'
    }),
    'route.prewarm': Object.freeze({
      fabricLane: 'background',
      endpointName: 'xtendrmt.route.prewarm',
      scope: 'xtend.fabric.route.prewarm',
      coalesceKey: 'xtend.fabric.route.prewarm'
    }),
    'ui.background.work': Object.freeze({
      fabricLane: 'background',
      endpointName: 'xtendrmt.background.work',
      scope: 'xtend.fabric.background',
      coalesceKey: 'xtend.fabric.background'
    }),
    'diagnostics.snapshot': Object.freeze({
      fabricLane: 'diagnostics',
      endpointName: 'xtendrmt.diagnostics.snapshot',
      scope: 'xtend.fabric.diagnostics',
      coalesceKey: 'xtend.fabric.diagnostics'
    })
  });

  function asObject(value) {
    return value && typeof value === 'object' ? value : {};
  }

  function cloneRecord(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isKnownFabricLane(lane) {
    return typeof lane === 'string' && Object.prototype.hasOwnProperty.call(FABRIC_TO_RMT_LANE, lane);
  }

  function inferFabricLane(fiber = {}) {
    if (isKnownFabricLane(fiber.lane)) {
      return fiber.lane;
    }
    if (fiber.kind && DEFAULT_LANE_BY_KIND[fiber.kind]) {
      return DEFAULT_LANE_BY_KIND[fiber.kind];
    }
    return 'visible';
  }

  function normalizeFabricLaneForRmt(lane, options = {}) {
    const fallbackLane = isKnownFabricLane(options.fallbackLane) ? options.fallbackLane : 'visible';
    const fabricLane = isKnownFabricLane(lane) ? lane : fallbackLane;
    const rmtLane = FABRIC_TO_RMT_LANE[fabricLane];
    const diagnostics = [];

    if (!isKnownFabricLane(lane)) {
      diagnostics.push({
        level: 'warn',
        code: 'xtend.fabric.rmt_lane_mapping.unknown_lane',
        message: `Unknown Fabric lane mapped to ${fabricLane}`,
        lane: fabricLane,
        metadata: {
          requestedLane: lane,
          fallbackLane: fabricLane
        }
      });
    }

    if (fabricLane === 'a11y') {
      diagnostics.push({
        level: 'info',
        code: 'xtend.fabric.rmt_lane_mapping.a11y_uses_user_blocking',
        message: 'Fabric a11y work maps to the RMT user-blocking lane until RMT exposes a dedicated accessibility lane.',
        lane: 'a11y',
        metadata: {
          fabricLane,
          rmtLane
        }
      });
    }

    return {
      schema: CONTRACTS.mapping,
      fabricLane,
      rmtLane,
      diagnostics
    };
  }

  function inferFabricLaneFromScheduleId(scheduleId, override, options = {}) {
    if (override.fabricLane) {
      return override.fabricLane;
    }
    if (options.fabricLane) {
      return options.fabricLane;
    }
    const profileLane = FABRIC_LANES.find((lane) => LANE_PROFILES[lane].scheduleId === scheduleId);
    return profileLane || 'visible';
  }

  function createScheduleRecord(scheduleId, options = {}) {
    const override = SCHEDULE_OVERRIDES[scheduleId] || {};
    const fabricLane = inferFabricLaneFromScheduleId(scheduleId, override, options);
    const laneProfile = LANE_PROFILES[fabricLane] || LANE_PROFILES.visible;
    const laneMapping = normalizeFabricLaneForRmt(fabricLane);
    const record = {
      schema: CONTRACTS.schedule,
      id: scheduleId,
      endpointName: override.endpointName || options.endpointName || laneProfile.endpointName,
      scope: override.scope || options.scope || laneProfile.scope,
      lane: laneMapping.rmtLane,
      priority: options.priority || laneProfile.priority,
      deadlineMs: options.deadlineMs || laneProfile.deadlineMs,
      preferIdle: typeof options.preferIdle === 'boolean' ? options.preferIdle : laneProfile.preferIdle,
      coalesceKey: override.coalesceKey || options.coalesceKey || laneProfile.coalesceKey,
      budgetClass: options.budgetClass || laneProfile.budgetClass,
      metadata: {
        contract: CONTRACTS.mapping,
        fabricLane,
        rmtLane: laneMapping.rmtLane,
        kernelBoundary: 'RMT sees schedule policy records only; XTend execution stays in host adapters or Fabric.'
      }
    };

    if (fabricLane === 'a11y') {
      record.metadata.reason = 'RMT schedules-domain has no dedicated a11y lane in xtend.rmt.schedules-domain.v1.';
    }

    return Object.freeze(record);
  }

  function createRmtScheduleRecords(options = {}) {
    const ids = options.includeRouteVisible === true
      ? [
        'ui.user-blocking.input',
        'a11y.user-blocking.announce',
        'component.visible.mount',
        'component.visible.hydrate',
        'component.visible.render',
        'route.visible.render',
        'route.transition.render',
        'component.idle.hydrate',
        'component.lazy.hydrate',
        'component.warm.reentry',
        'component.prewarm.prepare',
        'component.worker_prerender_hydrate',
        'template.prewarm',
        'template.prerender',
        'surface.prewarm',
        'route.prewarm',
        'ui.background.work',
        'diagnostics.snapshot'
      ]
      : [
        'ui.user-blocking.input',
        'a11y.user-blocking.announce',
        'component.visible.mount',
        'component.visible.hydrate',
        'component.visible.render',
        'route.transition.render',
        'component.idle.hydrate',
        'component.lazy.hydrate',
        'component.warm.reentry',
        'component.prewarm.prepare',
        'component.worker_prerender_hydrate',
        'template.prewarm',
        'template.prerender',
        'surface.prewarm',
        'route.prewarm',
        'ui.background.work',
        'diagnostics.snapshot'
      ];
    return Object.freeze(ids.map((id) => createScheduleRecord(id)));
  }

  function indexSchedules(schedules = []) {
    return schedules.reduce((index, schedule) => {
      if (!schedule || typeof schedule !== 'object') {
        return index;
      }
      if (typeof schedule.id === 'string') {
        if (!index.byId.has(schedule.id)) {
          index.byId.set(schedule.id, schedule);
        }
      }
      if (typeof schedule.endpointName === 'string') {
        if (!index.byEndpoint.has(schedule.endpointName)) {
          index.byEndpoint.set(schedule.endpointName, schedule);
        }
      }
      return index;
    }, {
      byId: new Map(),
      byEndpoint: new Map()
    });
  }

  function resolveScheduleIdForFiber(fiber = {}, fabricLane) {
    if (typeof fiber.scheduleRef === 'string' && fiber.scheduleRef.length > 0) {
      return fiber.scheduleRef;
    }

    const byKind = KIND_SCHEDULE_ID_BY_LANE[fiber.kind] || {};
    return byKind[fabricLane] || byKind[FABRIC_TO_RMT_LANE[fabricLane]] || LANE_PROFILES[fabricLane].scheduleId;
  }

  function resolveRmtScheduleForFiber(fiberInput = {}, options = {}) {
    const fiber = asObject(fiberInput);
    const laneResult = normalizeFabricLaneForRmt(inferFabricLane(fiber), options);
    const generatedSchedules = createRmtScheduleRecords({ includeRouteVisible: true });
    const providedSchedules = Array.isArray(options.schedules) ? options.schedules : [];
    const scheduleIndex = indexSchedules(providedSchedules.concat(generatedSchedules));
    const scheduleRef = resolveScheduleIdForFiber(fiber, laneResult.fabricLane);
    const endpointNameHint = fiber.endpointNameHint || options.endpointNameHint;
    const schedule = scheduleIndex.byId.get(scheduleRef)
      || (endpointNameHint ? scheduleIndex.byEndpoint.get(endpointNameHint) : null)
      || scheduleIndex.byId.get(LANE_PROFILES[laneResult.fabricLane].scheduleId)
      || createScheduleRecord(LANE_PROFILES[laneResult.fabricLane].scheduleId);
    const source = providedSchedules.includes(schedule)
      ? (fiber.scheduleRef ? 'provided:scheduleRef' : 'provided:endpointNameHint')
      : (fiber.scheduleRef ? 'generated:scheduleRef' : 'generated:lane-default');

    return Object.freeze({
      schema: CONTRACTS.mapping,
      ok: true,
      fabricLane: laneResult.fabricLane,
      rmtLane: schedule.lane || laneResult.rmtLane,
      scheduleRef: schedule.id,
      endpointName: schedule.endpointName,
      scope: schedule.scope,
      schedule: cloneRecord(schedule),
      source,
      diagnostics: laneResult.diagnostics
    });
  }

  function createFabricRmtLaneMapping(options = {}) {
    const schedules = createRmtScheduleRecords(options);
    const scheduleIndex = indexSchedules(schedules);

    return Object.freeze({
      schema: CONTRACTS.mapping,
      contracts: CONTRACTS,
      fabricLanes: FABRIC_LANES,
      rmtScheduleLanes: RMT_SCHEDULE_LANES,
      laneMap: FABRIC_TO_RMT_LANE,
      schedules,
      resolveLane: normalizeFabricLaneForRmt,
      resolveFiber(fiber, resolveOptions = {}) {
        return resolveRmtScheduleForFiber(fiber, {
          ...resolveOptions,
          schedules: resolveOptions.schedules || schedules
        });
      },
      getSchedule(id) {
        const schedule = scheduleIndex.byId.get(id);
        return schedule ? cloneRecord(schedule) : null;
      }
    });
  }

  return Object.freeze({
    CONTRACTS,
    BROWSER_NAMESPACE,
    RMT_SCHEDULE_LANES,
    FABRIC_LANES,
    FABRIC_TO_RMT_LANE,
    LANE_PROFILES,
    DEFAULT_LANE_BY_KIND,
    createFabricRmtLaneMapping,
    createRmtScheduleRecords,
    normalizeFabricLaneForRmt,
    resolveRmtScheduleForFiber
  });
});

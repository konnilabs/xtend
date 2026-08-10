/* modules/rmt-performance-runtime.js */
(function registerRmtPerformanceRuntimeModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const ENDPOINT_EVENT_CHANNEL = 'rmt.performance.endpoint';
    const BUDGET_EVALUATION_CHANNEL = 'rmt.performance.budget';
    const SNAPSHOT_CHANNEL = 'rmt.performance.snapshot';
    const BROWSER_SIGNAL_CHANNEL = 'rmt.performance.browser_signal';
    const BACKPRESSURE_PROFILE_CHANNEL = 'rmt.performance.backpressure';
    const HISTORY_LIMIT = 160;
    const BROWSER_SIGNAL_HISTORY_LIMIT = 160;
    const PRESSURE_LEVEL_ORDER = Object.freeze([
        'idle',
        'normal',
        'elevated',
        'constrained',
        'critical'
    ]);
    const BROWSER_SIGNAL_ENTRY_TYPES = Object.freeze([
        'longtask',
        'event',
        'first-input',
        'long-animation-frame'
    ]);
    const BACKPRESSURE_PROFILE_MAP = Object.freeze({
        idle: Object.freeze({
            chunkScale: 1,
            followupChunkScale: 1,
            prewarmFootprintRatio: 1,
            prewarmMaxItems: 100000,
            prewarmMaxDomNodes: 250000,
            preferIdle: false,
            delayMultiplier: 1
        }),
        normal: Object.freeze({
            chunkScale: 1,
            followupChunkScale: 1,
            prewarmFootprintRatio: 1,
            prewarmMaxItems: 100000,
            prewarmMaxDomNodes: 250000,
            preferIdle: false,
            delayMultiplier: 1
        }),
        elevated: Object.freeze({
            chunkScale: 0.75,
            followupChunkScale: 0.7,
            prewarmFootprintRatio: 0.7,
            prewarmMaxItems: 320,
            prewarmMaxDomNodes: 12000,
            preferIdle: true,
            delayMultiplier: 1.15
        }),
        constrained: Object.freeze({
            chunkScale: 0.5,
            followupChunkScale: 0.45,
            prewarmFootprintRatio: 0.45,
            prewarmMaxItems: 180,
            prewarmMaxDomNodes: 7200,
            preferIdle: true,
            delayMultiplier: 1.35
        }),
        critical: Object.freeze({
            chunkScale: 0.3,
            followupChunkScale: 0.25,
            prewarmFootprintRatio: 0.25,
            prewarmMaxItems: 96,
            prewarmMaxDomNodes: 3600,
            preferIdle: true,
            delayMultiplier: 1.75
        })
    });
    const MEASUREMENT_PHASES = Object.freeze([
        'cold',
        'warm',
        'retained',
        'unknown'
    ]);
    const BUDGET_PROFILE_MAP = Object.freeze({
        visible_commit: Object.freeze({
            budgetId: 'visible_commit',
            label: 'Visible Commit',
            maxDurationMs: 24,
            maxWaitMs: 48,
            maxTotalMs: 56,
            maxLongTaskMs: 50
        }),
        hydration_followup: Object.freeze({
            budgetId: 'hydration_followup',
            label: 'Hydration Follow-up',
            maxDurationMs: 40,
            maxWaitMs: 160,
            maxTotalMs: 180,
            maxLongTaskMs: 80
        }),
        background_prepare: Object.freeze({
            budgetId: 'background_prepare',
            label: 'Background Prepare',
            maxDurationMs: 90,
            maxWaitMs: 900,
            maxTotalMs: 980,
            maxLongTaskMs: 120
        }),
        idle_maintenance: Object.freeze({
            budgetId: 'idle_maintenance',
            label: 'Idle Maintenance',
            maxDurationMs: 120,
            maxWaitMs: 1600,
            maxTotalMs: 1750,
            maxLongTaskMs: 160
        }),
        critical_input: Object.freeze({
            budgetId: 'critical_input',
            label: 'Critical Input',
            maxDurationMs: 16,
            maxWaitMs: 32,
            maxTotalMs: 36,
            maxLongTaskMs: 32
        }),
        command_turnaround: Object.freeze({
            budgetId: 'command_turnaround',
            label: 'Command Turnaround',
            maxDurationMs: 18,
            maxWaitMs: 28,
            maxTotalMs: 36,
            maxLongTaskMs: 32
        }),
        retained_warm_reuse: Object.freeze({
            budgetId: 'retained_warm_reuse',
            label: 'Retained Warm Reuse',
            maxDurationMs: 12,
            maxWaitMs: 24,
            maxTotalMs: 28,
            maxLongTaskMs: 24
        })
    });
    const ENDPOINT_BUDGET_OVERRIDES = Object.freeze({
        command_turnaround: Object.freeze({
            budgetId: 'command_turnaround'
        }),
        dispatch_command: Object.freeze({
            budgetId: 'command_turnaround'
        }),
        critical_input: Object.freeze({
            budgetId: 'critical_input'
        })
    });

    const ENDPOINT_PROFILE_MAP = Object.freeze({
        visible_commit: Object.freeze({
            endpointName: 'visible_commit',
            endpointGroup: 'visible_commit',
            requestedKind: 'after_paint',
            executionMode: 'scheduled',
            lane: 'visible_commit',
            priority: 420,
            budgetClass: 'visible_commit',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        hydration_followup: Object.freeze({
            endpointName: 'hydration_followup',
            endpointGroup: 'hydration_followup',
            requestedKind: 'deferred',
            executionMode: 'scheduled',
            lane: 'hydration_followup',
            priority: 320,
            budgetClass: 'hydration_followup',
            isVisible: true,
            preferIdle: true,
            userBlocking: false
        }),
        background_prepare: Object.freeze({
            endpointName: 'background_prepare',
            endpointGroup: 'background_prepare',
            requestedKind: 'deferred',
            executionMode: 'scheduled',
            lane: 'background_prepare',
            priority: 220,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        idle_maintenance: Object.freeze({
            endpointName: 'idle_maintenance',
            endpointGroup: 'idle_maintenance',
            requestedKind: 'deferred',
            executionMode: 'scheduled',
            lane: 'idle_maintenance',
            priority: 120,
            budgetClass: 'idle_maintenance',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        critical_input: Object.freeze({
            endpointName: 'critical_input',
            endpointGroup: 'critical_input',
            requestedKind: 'deferred',
            executionMode: 'scheduled',
            lane: 'critical_input',
            priority: 500,
            budgetClass: 'critical_input',
            isVisible: true,
            preferIdle: false,
            userBlocking: true
        }),
        command_turnaround: Object.freeze({
            endpointName: 'command_turnaround',
            endpointGroup: 'command_turnaround',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'critical_input',
            priority: 500,
            budgetClass: 'critical_input',
            isVisible: true,
            preferIdle: false,
            userBlocking: true
        }),
        render: Object.freeze({
            endpointName: 'render',
            endpointGroup: 'template_render',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'visible_commit',
            priority: 430,
            budgetClass: 'visible_commit',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        render_template: Object.freeze({
            endpointName: 'render_template',
            endpointGroup: 'template_render',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'visible_commit',
            priority: 430,
            budgetClass: 'visible_commit',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        render_prepared: Object.freeze({
            endpointName: 'render_prepared',
            endpointGroup: 'template_render',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'visible_commit',
            priority: 440,
            budgetClass: 'visible_commit',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        hydrate: Object.freeze({
            endpointName: 'hydrate',
            endpointGroup: 'template_hydration',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'hydration_followup',
            priority: 340,
            budgetClass: 'hydration_followup',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        hydrate_template: Object.freeze({
            endpointName: 'hydrate_template',
            endpointGroup: 'template_hydration',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'hydration_followup',
            priority: 340,
            budgetClass: 'hydration_followup',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        hydrate_prepared: Object.freeze({
            endpointName: 'hydrate_prepared',
            endpointGroup: 'template_hydration',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'hydration_followup',
            priority: 350,
            budgetClass: 'hydration_followup',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        prerender: Object.freeze({
            endpointName: 'prerender',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 230,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        prerender_template: Object.freeze({
            endpointName: 'prerender_template',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 230,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        prerender_prepared: Object.freeze({
            endpointName: 'prerender_prepared',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 240,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        prepare_document: Object.freeze({
            endpointName: 'prepare_document',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 220,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        prepare_template: Object.freeze({
            endpointName: 'prepare_template',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 220,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        load_document: Object.freeze({
            endpointName: 'load_document',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 200,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        load_rmt_document: Object.freeze({
            endpointName: 'load_rmt_document',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 200,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        load_template_source: Object.freeze({
            endpointName: 'load_template_source',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 200,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        register_document: Object.freeze({
            endpointName: 'register_document',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 200,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        register_template: Object.freeze({
            endpointName: 'register_template',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 200,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        create_artifact_bundle: Object.freeze({
            endpointName: 'create_artifact_bundle',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 210,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        register_artifact_bundle: Object.freeze({
            endpointName: 'register_artifact_bundle',
            endpointGroup: 'template_prepare',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 210,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        request_prerender: Object.freeze({
            endpointName: 'request_prerender',
            endpointGroup: 'remote_prerender',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'background_prepare',
            priority: 230,
            budgetClass: 'background_prepare',
            isVisible: false,
            preferIdle: true,
            userBlocking: false
        }),
        hydrate_response: Object.freeze({
            endpointName: 'hydrate_response',
            endpointGroup: 'template_hydration',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'hydration_followup',
            priority: 340,
            budgetClass: 'hydration_followup',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        execute: Object.freeze({
            endpointName: 'execute',
            endpointGroup: 'template_render',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'visible_commit',
            priority: 430,
            budgetClass: 'visible_commit',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        execute_template: Object.freeze({
            endpointName: 'execute_template',
            endpointGroup: 'template_render',
            requestedKind: 'after_paint',
            executionMode: 'immediate',
            lane: 'visible_commit',
            priority: 430,
            budgetClass: 'visible_commit',
            isVisible: true,
            preferIdle: false,
            userBlocking: false
        }),
        dispatch_command: Object.freeze({
            endpointName: 'dispatch_command',
            endpointGroup: 'command_turnaround',
            requestedKind: 'deferred',
            executionMode: 'immediate',
            lane: 'critical_input',
            priority: 500,
            budgetClass: 'critical_input',
            isVisible: true,
            preferIdle: false,
            userBlocking: true
        })
    });

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
        return safeValue || fallbackValue;
    }

    function normalizeMeasurementPhase(value, fallbackValue = 'unknown') {
        const safeValue = String(value || '')
            .trim()
            .toLowerCase();
        if (!safeValue) return fallbackValue;
        if (safeValue === 'retained' || safeValue.includes('retained')) return 'retained';
        if (
            safeValue === 'warm'
            || safeValue.includes('warm')
            || safeValue.includes('reuse')
            || safeValue.includes('visible-switch')
            || safeValue.includes('fast-path')
            || safeValue.includes('ready')
        ) {
            return 'warm';
        }
        if (
            safeValue === 'cold'
            || safeValue.includes('cold')
            || safeValue.includes('materialize')
            || safeValue.includes('initial')
            || safeValue.includes('standard')
            || safeValue.includes('built')
            || safeValue.includes('first-paint')
        ) {
            return 'cold';
        }
        if (safeValue === 'unknown') return 'unknown';
        return fallbackValue;
    }

    function normalizeBudgetId(value, fallbackValue = 'visible_commit') {
        const safeValue = String(value || '')
            .trim()
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
        return safeValue || fallbackValue;
    }

    function cloneSerializable(value, fallbackValue = null) {
        if (value === undefined) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_error) {
            return fallbackValue;
        }
    }

    function isObjectLike(value) {
        return !!value && typeof value === 'object';
    }

    function resolveMeasurementPhase(sample = {}, options = {}) {
        const sampleMetadata = isObjectLike(sample.metadata) ? sample.metadata : {};
        const optionMetadata = isObjectLike(options.metadata) ? options.metadata : {};
        const candidates = [
            sample.measurementPhase,
            options.measurementPhase,
            sample.cacheState,
            options.cacheState,
            sample.interactionMode,
            options.interactionMode,
            sampleMetadata.measurementPhase,
            optionMetadata.measurementPhase,
            sampleMetadata.cacheState,
            optionMetadata.cacheState,
            sampleMetadata.temperature,
            optionMetadata.temperature,
            sampleMetadata.interactionMode,
            optionMetadata.interactionMode,
            sampleMetadata.source,
            optionMetadata.source,
            sampleMetadata.reason,
            optionMetadata.reason,
            sampleMetadata.renderMode,
            optionMetadata.renderMode
        ];

        for (let index = 0; index < candidates.length; index += 1) {
            const normalized = normalizeMeasurementPhase(candidates[index], '');
            if (normalized) return normalized;
        }

        return normalizeMeasurementPhase(
            options.defaultMeasurementPhase || sample.defaultMeasurementPhase,
            'unknown'
        );
    }

    function normalizeFilterValues(values, normalizeValue) {
        const normalizedValues = new Set();
        const sourceValues = Array.isArray(values)
            ? values
            : (values !== undefined && values !== null ? [values] : []);
        sourceValues.forEach((value) => {
            const normalized = normalizeValue(value, '');
            if (normalized) normalizedValues.add(normalized);
        });
        return normalizedValues;
    }

    function matchesHistoryFilters(entry, options = {}) {
        const measurementPhaseFilter = normalizeFilterValues(
            options.measurementPhases,
            normalizeMeasurementPhase
        );
        if (measurementPhaseFilter.size > 0) {
            const measurementPhase = normalizeMeasurementPhase(entry && entry.measurementPhase, 'unknown');
            if (!measurementPhaseFilter.has(measurementPhase)) return false;
        }

        const renderPackageFilter = normalizeFilterValues(
            options.renderPackageIds,
            clampString
        );
        if (renderPackageFilter.size > 0) {
            const renderPackageId = clampString(entry && entry.renderPackageId, '');
            if (!renderPackageFilter.has(renderPackageId)) return false;
        }

        const rootFilter = normalizeFilterValues(
            options.rootIds,
            clampString
        );
        if (rootFilter.size > 0) {
            const rootId = clampString(entry && entry.rootId, '');
            if (!rootFilter.has(rootId)) return false;
        }

        return true;
    }

    function normalizeEndpointName(value, fallbackValue = 'visible_commit') {
        const safeValue = String(value || '')
            .trim()
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
        if (!safeValue) return fallbackValue;
        switch (safeValue) {
        case 'renderprepared':
            return 'render_prepared';
        case 'rendertemplate':
            return 'render_template';
        case 'hydrateprepared':
            return 'hydrate_prepared';
        case 'hydratetemplate':
            return 'hydrate_template';
        case 'prerenderprepared':
            return 'prerender_prepared';
        case 'prerendertemplate':
            return 'prerender_template';
        case 'preparedocument':
            return 'prepare_document';
        case 'preparetemplate':
            return 'prepare_template';
        case 'loaddocument':
            return 'load_document';
        case 'loadrmtdocument':
            return 'load_rmt_document';
        case 'loadtemplatesource':
            return 'load_template_source';
        case 'registerdocument':
            return 'register_document';
        case 'registertemplate':
            return 'register_template';
        case 'createartifactbundle':
            return 'create_artifact_bundle';
        case 'registerartifactbundle':
            return 'register_artifact_bundle';
        case 'requestprerender':
            return 'request_prerender';
        case 'hydrateresponse':
            return 'hydrate_response';
        case 'executetemplate':
            return 'execute_template';
        case 'dispatchcommand':
            return 'dispatch_command';
        case 'command':
            return 'dispatch_command';
        case 'commit':
            return 'visible_commit';
        case 'followup':
            return 'hydration_followup';
        case 'prepare':
            return 'background_prepare';
        default:
            return ENDPOINT_PROFILE_MAP[safeValue] ? safeValue : fallbackValue;
        }
    }

    function toNonNegativeNumber(value, fallbackValue = 0) {
        return Number.isFinite(value) && value >= 0 ? value : fallbackValue;
    }

    function toFiniteNumber(value, fallbackValue = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : fallbackValue;
    }

    function toNonNegativeFiniteNumber(value, fallbackValue = 0) {
        const numericValue = toFiniteNumber(value, fallbackValue);
        return numericValue >= 0 ? numericValue : fallbackValue;
    }

    function normalizePressureLevel(value, fallbackValue = 'normal') {
        const safeValue = String(value || '')
            .trim()
            .toLowerCase();
        if (PRESSURE_LEVEL_ORDER.includes(safeValue)) return safeValue;
        return PRESSURE_LEVEL_ORDER.includes(fallbackValue) ? fallbackValue : 'normal';
    }

    function getPressureLevelRank(value) {
        const pressureLevel = normalizePressureLevel(value, 'normal');
        const pressureIndex = PRESSURE_LEVEL_ORDER.indexOf(pressureLevel);
        return pressureIndex >= 0 ? pressureIndex : PRESSURE_LEVEL_ORDER.indexOf('normal');
    }

    function maxPressureLevel(...levels) {
        return levels.reduce((currentLevel, nextLevel) => (
            getPressureLevelRank(nextLevel) > getPressureLevelRank(currentLevel)
                ? normalizePressureLevel(nextLevel, currentLevel)
                : currentLevel
        ), 'idle');
    }

    function clampRatio(value, fallbackValue = 1) {
        const numericValue = toFiniteNumber(value, fallbackValue);
        if (!Number.isFinite(numericValue)) return fallbackValue;
        return Math.max(0, Math.min(numericValue, 1));
    }

    function summarizeMetricValues(entries = [], fieldName) {
        const values = (Array.isArray(entries) ? entries : [])
            .map((entry) => toNonNegativeFiniteNumber(entry && entry[fieldName], 0))
            .filter((value) => value > 0);
        const total = values.reduce((sum, value) => sum + value, 0);
        return {
            count: values.length,
            avg: values.length > 0 ? total / values.length : 0,
            max: values.length > 0 ? Math.max(...values) : 0
        };
    }

    function getBaseEndpointProfile(endpointName) {
        const safeEndpointName = normalizeEndpointName(endpointName, 'visible_commit');
        const profile = ENDPOINT_PROFILE_MAP[safeEndpointName] || ENDPOINT_PROFILE_MAP.visible_commit;
        return {
            ...profile,
            metadata: cloneSerializable(profile.metadata, {})
        };
    }

    function getBaseBudgetProfile(endpointName, options = {}) {
        const safeEndpointName = normalizeEndpointName(endpointName, 'visible_commit');
        const endpointProfile = getBaseEndpointProfile(safeEndpointName);
        const endpointOverride = cloneSerializable(ENDPOINT_BUDGET_OVERRIDES[safeEndpointName], {});
        const fallbackBudgetId = normalizeBudgetId(
            options.budgetId
            || endpointOverride.budgetId
            || endpointProfile.budgetClass,
            normalizeBudgetId(endpointProfile.budgetClass, 'visible_commit')
        );
        const preset = cloneSerializable(
            BUDGET_PROFILE_MAP[fallbackBudgetId]
            || BUDGET_PROFILE_MAP[normalizeBudgetId(endpointProfile.budgetClass, 'visible_commit')]
            || BUDGET_PROFILE_MAP.visible_commit,
            {}
        );
        return Object.freeze({
            budgetId: fallbackBudgetId,
            label: clampString(options.label || endpointOverride.label || preset.label, fallbackBudgetId),
            endpointName: safeEndpointName,
            endpointGroup: clampString(endpointProfile.endpointGroup, 'visible_commit'),
            budgetClass: clampString(options.budgetClass || endpointProfile.budgetClass, fallbackBudgetId),
            maxDurationMs: toNonNegativeNumber(options.maxDurationMs, toNonNegativeNumber(endpointOverride.maxDurationMs, toNonNegativeNumber(preset.maxDurationMs, 0))),
            maxWaitMs: toNonNegativeNumber(options.maxWaitMs, toNonNegativeNumber(endpointOverride.maxWaitMs, toNonNegativeNumber(preset.maxWaitMs, 0))),
            maxTotalMs: toNonNegativeNumber(options.maxTotalMs, toNonNegativeNumber(endpointOverride.maxTotalMs, toNonNegativeNumber(preset.maxTotalMs, 0))),
            maxLongTaskMs: toNonNegativeNumber(options.maxLongTaskMs, toNonNegativeNumber(endpointOverride.maxLongTaskMs, toNonNegativeNumber(preset.maxLongTaskMs, 0))),
            metadata: {
                ...cloneSerializable(preset.metadata, {}),
                ...cloneSerializable(endpointOverride.metadata, {}),
                ...cloneSerializable(options.metadata, {})
            }
        });
    }

    function evaluateBudgetSample(endpointName, sample = {}, options = {}) {
        const budgetProfile = getBaseBudgetProfile(endpointName, options);
        const durationMs = toNonNegativeNumber(sample.durationMs, 0);
        const waitMs = toNonNegativeNumber(sample.waitMs, 0);
        const totalMs = durationMs + waitMs;
        const longTaskMs = toNonNegativeNumber(sample.longTaskMs, durationMs);
        const violations = [];

        if (budgetProfile.maxDurationMs > 0 && durationMs > budgetProfile.maxDurationMs) {
            violations.push('duration_ms');
        }
        if (budgetProfile.maxWaitMs > 0 && waitMs > budgetProfile.maxWaitMs) {
            violations.push('wait_ms');
        }
        if (budgetProfile.maxTotalMs > 0 && totalMs > budgetProfile.maxTotalMs) {
            violations.push('total_ms');
        }
        if (budgetProfile.maxLongTaskMs > 0 && longTaskMs > budgetProfile.maxLongTaskMs) {
            violations.push('long_task_ms');
        }

        return Object.freeze({
            budgetId: budgetProfile.budgetId,
            label: budgetProfile.label,
            endpointName: normalizeEndpointName(endpointName, 'visible_commit'),
            endpointGroup: clampString(sample.endpointGroup || options.endpointGroup || budgetProfile.endpointGroup, budgetProfile.endpointGroup),
            budgetClass: clampString(options.budgetClass || sample.budgetClass || budgetProfile.budgetClass, budgetProfile.budgetClass),
            measurementPhase: resolveMeasurementPhase(sample, options),
            renderPackageId: clampString(sample.renderPackageId || options.renderPackageId, ''),
            rootId: clampString(sample.rootId || options.rootId, ''),
            durationMs,
            waitMs,
            totalMs,
            longTaskMs,
            withinBudget: violations.length === 0,
            status: violations.length === 0 ? 'within_budget' : 'budget_exceeded',
            violations,
            thresholds: {
                maxDurationMs: budgetProfile.maxDurationMs,
                maxWaitMs: budgetProfile.maxWaitMs,
                maxTotalMs: budgetProfile.maxTotalMs,
                maxLongTaskMs: budgetProfile.maxLongTaskMs
            },
            metadata: cloneSerializable(sample.metadata || options.metadata || budgetProfile.metadata, {})
        });
    }

    appModules.createRmtPerformanceRuntime = function createRmtPerformanceRuntime(deps = {}) {
        const hostAdapter = deps.hostAdapter && typeof deps.hostAdapter === 'object'
            ? deps.hostAdapter
            : null;
        const rmtCore = deps.rmtCore && typeof deps.rmtCore === 'object'
            ? deps.rmtCore
            : null;
        const publicApi = deps.publicApi && typeof deps.publicApi === 'object'
            ? deps.publicApi
            : null;
        const rmt = deps.rmt
            || (publicApi && typeof publicApi.getRmt === 'function' ? publicApi.getRmt() : null)
            || (rmtCore && typeof rmtCore.getRmt === 'function' ? rmtCore.getRmt() : rmtCore && rmtCore.rmt);
        const diagnosticsHub = deps.diagnosticsHub
            || (rmt && typeof rmt.getDiagnosticsHub === 'function' ? rmt.getDiagnosticsHub() : null)
            || (rmtCore && typeof rmtCore.getDiagnosticsHub === 'function' ? rmtCore.getDiagnosticsHub() : null);
        const schedulerDiagnostics = deps.schedulerDiagnostics
            || (rmtCore && typeof rmtCore.getDiagnostics === 'function' ? rmtCore.getDiagnostics() : null)
            || (publicApi && typeof publicApi.getCore === 'function' && publicApi.getCore() && typeof publicApi.getCore().getDiagnostics === 'function'
                ? publicApi.getCore().getDiagnostics()
                : null)
            || (rmt && typeof rmt.getSchedulerDiagnostics === 'function' ? rmt.getSchedulerDiagnostics() : null);
        const now = typeof deps.now === 'function'
            ? deps.now
            : (hostAdapter && typeof hostAdapter.now === 'function'
                ? hostAdapter.now.bind(hostAdapter)
                : (() => Date.now()));
        const runtimeKind = clampString(
            deps.runtimeKind
            || deps.hostKind
            || (hostAdapter && hostAdapter.hostKind)
            || 'generic',
            'generic'
        );
        const endpointHistory = [];
        const endpointStats = Object.create(null);
        const browserSignalTarget = deps.windowTarget
            || (hostAdapter && hostAdapter.windowTarget)
            || (typeof globalThis !== 'undefined' ? globalThis : null);
        const browserSignalHistory = [];
        const browserSignalObserverRecords = [];
        const browserSignalObserverErrors = [];
        let browserSignalCollectionStarted = false;
        let browserSignalFallbackActive = false;
        let browserSignalFrameProbeScheduled = false;
        let browserSignalCapabilities = null;
        let browserSignalLastMemory = null;
        let browserSignalLastInputPending = null;
        const harnessOutputHistoryLimit = Number.isFinite(deps.harnessOutputHistoryLimit)
            ? Math.max(1, Math.trunc(deps.harnessOutputHistoryLimit))
            : 24;
        const harnessOutputStorageKey = clampString(
            deps.harnessOutputStorageKey || deps.performanceHarnessOutputStorageKey,
            `rmt.performance.harness.outputs.${runtimeKind}.v1`
        );
        const historyStorage = deps.historyStorage
            && typeof deps.historyStorage.readJson === 'function'
            && typeof deps.historyStorage.writeJson === 'function'
            ? deps.historyStorage
            : null;
        const artifactWriter = deps.artifactWriter && typeof deps.artifactWriter === 'object'
            ? deps.artifactWriter
            : null;
        const persistedHarnessOutputs = loadPersistedHarnessOutputs();

        function getHistoryStorageStatus() {
            const backendInfo = historyStorage && typeof historyStorage.getBackendInfo === 'function'
                ? historyStorage.getBackendInfo()
                : null;
            return {
                storageKey: harnessOutputStorageKey,
                backend: clampString(backendInfo && backendInfo.backend, historyStorage ? 'custom' : 'memory'),
                persistentAvailable: backendInfo && backendInfo.persistentAvailable === true,
                memoryFallbackActive: backendInfo ? backendInfo.memoryFallbackActive === true : historyStorage == null,
                historyLimit: harnessOutputHistoryLimit
            };
        }

        function normalizeHarnessOutputs(outputInputs = []) {
            return (Array.isArray(outputInputs) ? outputInputs : [])
                .filter((entry) => entry && typeof entry === 'object')
                .map((entry) => cloneSerializable(entry, {}))
                .filter((entry) => entry.runReport && typeof entry.runReport === 'object')
                .sort((left, right) => {
                    const timeDelta = toNonNegativeNumber(right.exportedAt, 0) - toNonNegativeNumber(left.exportedAt, 0);
                    if (timeDelta !== 0) return timeDelta;
                    return normalizeHarnessOutputId(left.outputId, 'left').localeCompare(normalizeHarnessOutputId(right.outputId, 'right'));
                });
        }

        function loadPersistedHarnessOutputs() {
            if (!historyStorage || typeof historyStorage.readJson !== 'function') return [];
            return normalizeHarnessOutputs(historyStorage.readJson(harnessOutputStorageKey, []));
        }

        function persistHarnessOutputs(outputs = []) {
            const normalizedOutputs = normalizeHarnessOutputs(outputs).slice(0, harnessOutputHistoryLimit);
            if (historyStorage && typeof historyStorage.writeJson === 'function') {
                historyStorage.writeJson(harnessOutputStorageKey, normalizedOutputs);
            }
            persistedHarnessOutputs.splice(0, persistedHarnessOutputs.length);
            normalizedOutputs.forEach((entry) => persistedHarnessOutputs.push(entry));
            return normalizedOutputs;
        }

        function listPersistedHarnessOutputs(limit = harnessOutputHistoryLimit) {
            const safeLimit = Number.isFinite(limit)
                ? Math.max(0, Math.min(Math.trunc(limit), harnessOutputHistoryLimit))
                : harnessOutputHistoryLimit;
            return persistedHarnessOutputs
                .slice(0, safeLimit)
                .map((entry) => cloneSerializable(entry, {}));
        }

        function extractRunReportsFromHarnessOutputs(outputs = []) {
            return normalizeRunReports(
                (Array.isArray(outputs) ? outputs : [])
                    .map((entry) => entry && entry.runReport)
                    .filter(Boolean)
            );
        }

        function normalizeArtifactPath(value, fallbackValue = 'artifact.json') {
            const rawValue = clampString(value, fallbackValue).replace(/\\/g, '/');
            const isAbsolutePath = rawValue.startsWith('/') || /^[A-Za-z]:\//.test(rawValue);
            const safeValue = rawValue
                .replace(/\/+/g, '/')
                .split('/')
                .filter(Boolean)
                .map((segment) => segment.replace(/\.\./g, '_'))
                .join('/');
            if (!safeValue) return fallbackValue;
            return isAbsolutePath ? `/${safeValue}`.replace(/^\/([A-Za-z]:\/)/, '$1') : safeValue;
        }

        function resolveArtifactWriter(options = {}) {
            const writer = options.artifactWriter || options.writer || artifactWriter;
            return writer && typeof writer === 'object'
                ? writer
                : null;
        }

        function resolveArtifactTargetKind(writer) {
            if (!writer || typeof writer !== 'object') return 'none';
            if (typeof writer.writeArtifact === 'function') return 'artifact_writer';
            if (typeof writer.writeText === 'function' || typeof writer.appendText === 'function') return 'text_writer';
            if (typeof writer.writeJson === 'function') return 'json_writer';
            return 'custom';
        }

        function resolveArtifactExportTarget(options = {}) {
            const target = options.exportTarget || options.target || deps.externalExportTarget || deps.exportTarget || null;
            return target && typeof target === 'object'
                ? target
                : null;
        }

        function resolveArtifactExportTargetKind(target) {
            if (!target || typeof target !== 'object') return 'none';
            if (typeof target.publishArtifact === 'function') return 'external_artifact_target';
            if (typeof target.uploadArtifact === 'function') return 'external_upload_target';
            if (typeof target.postJson === 'function') return 'external_json_target';
            if (typeof target.postText === 'function') return 'external_text_target';
            if (typeof target.writeArtifact === 'function') return 'artifact_writer';
            if (typeof target.writeText === 'function' || typeof target.appendText === 'function') return 'text_writer';
            if (typeof target.writeJson === 'function') return 'json_writer';
            return 'custom';
        }

        function formatNightlyBucketFromTimestamp(value) {
            const safeTimestamp = toNonNegativeNumber(value, now());
            const date = new Date(safeTimestamp);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function normalizeNightlyKey(value, fallbackValue = '') {
            return clampString(value, fallbackValue);
        }

        function ensureEndpointStats(endpointName) {
            const safeEndpointName = normalizeEndpointName(endpointName, 'visible_commit');
            if (!endpointStats[safeEndpointName]) {
                endpointStats[safeEndpointName] = {
                    endpointName: safeEndpointName,
                    endpointGroup: clampString(getBaseEndpointProfile(safeEndpointName).endpointGroup, 'visible_commit'),
                    totalCount: 0,
                    scheduledCount: 0,
                    syncCount: 0,
                    asyncCount: 0,
                    errorCount: 0,
                    totalDurationMs: 0,
                    totalWaitMs: 0,
                    maxDurationMs: 0,
                    maxWaitMs: 0,
                    lastAt: 0,
                    lastDurationMs: 0,
                    lastWaitMs: 0,
                    lastStatus: 'idle',
                    budgetViolationCount: 0,
                    lastBudgetStatus: 'idle',
                    lastMeasurementPhase: 'unknown',
                    measurementPhaseCounts: {},
                    lastRenderPackageId: '',
                    lastRootId: ''
                };
            }
            return endpointStats[safeEndpointName];
        }

        function buildEndpointStatsSnapshot() {
            return Object.keys(endpointStats)
                .sort((left, right) => left.localeCompare(right))
                .map((endpointName) => {
                    const stats = endpointStats[endpointName];
                    return {
                        endpointName,
                        endpointGroup: stats.endpointGroup,
                        totalCount: stats.totalCount,
                        scheduledCount: stats.scheduledCount,
                        syncCount: stats.syncCount,
                        asyncCount: stats.asyncCount,
                        errorCount: stats.errorCount,
                        avgDurationMs: stats.totalCount > 0 ? stats.totalDurationMs / stats.totalCount : 0,
                        avgWaitMs: stats.totalCount > 0 ? stats.totalWaitMs / stats.totalCount : 0,
                        maxDurationMs: stats.maxDurationMs,
                        maxWaitMs: stats.maxWaitMs,
                        lastAt: stats.lastAt,
                        lastDurationMs: stats.lastDurationMs,
                        lastWaitMs: stats.lastWaitMs,
                        lastStatus: stats.lastStatus,
                        budgetViolationCount: stats.budgetViolationCount,
                        lastBudgetStatus: stats.lastBudgetStatus,
                        lastMeasurementPhase: stats.lastMeasurementPhase,
                        measurementPhaseCounts: cloneSerializable(stats.measurementPhaseCounts, {}),
                        lastRenderPackageId: stats.lastRenderPackageId,
                        lastRootId: stats.lastRootId
                    };
                });
        }

        function resolvePressureLevel() {
            if (schedulerDiagnostics && schedulerDiagnostics.pressureLevel) {
                return normalizePressureLevel(schedulerDiagnostics.pressureLevel, 'normal');
            }
            if (schedulerDiagnostics && typeof schedulerDiagnostics.getPressureLevel === 'function') {
                return normalizePressureLevel(schedulerDiagnostics.getPressureLevel(), 'normal');
            }
            if (schedulerDiagnostics && typeof schedulerDiagnostics.getSnapshot === 'function') {
                return normalizePressureLevel((schedulerDiagnostics.getSnapshot() || {}).pressureLevel, 'normal');
            }
            if (rmt && typeof rmt.getSchedulerDiagnostics === 'function') {
                return normalizePressureLevel((rmt.getSchedulerDiagnostics() || {}).pressureLevel, 'normal');
            }
            return 'normal';
        }

        function getBrowserPerformanceTarget() {
            if (deps.performanceTarget && typeof deps.performanceTarget === 'object') {
                return deps.performanceTarget;
            }
            if (browserSignalTarget && browserSignalTarget.performance) {
                return browserSignalTarget.performance;
            }
            if (typeof globalThis !== 'undefined' && globalThis.performance) {
                return globalThis.performance;
            }
            return null;
        }

        function getBrowserNavigatorTarget() {
            if (deps.navigatorTarget && typeof deps.navigatorTarget === 'object') {
                return deps.navigatorTarget;
            }
            if (browserSignalTarget && browserSignalTarget.navigator) {
                return browserSignalTarget.navigator;
            }
            if (typeof globalThis !== 'undefined' && globalThis.navigator) {
                return globalThis.navigator;
            }
            return null;
        }

        function getPerformanceObserverCtor() {
            if (typeof deps.PerformanceObserverCtor === 'function') return deps.PerformanceObserverCtor;
            if (browserSignalTarget && typeof browserSignalTarget.PerformanceObserver === 'function') {
                return browserSignalTarget.PerformanceObserver;
            }
            if (typeof globalThis !== 'undefined' && typeof globalThis.PerformanceObserver === 'function') {
                return globalThis.PerformanceObserver;
            }
            return null;
        }

        function getSupportedPerformanceEntryTypes(observerCtor) {
            const supportedEntryTypes = observerCtor && Array.isArray(observerCtor.supportedEntryTypes)
                ? observerCtor.supportedEntryTypes
                : [];
            return supportedEntryTypes
                .map((entryType) => String(entryType || '').trim())
                .filter(Boolean);
        }

        function getScheduleAnimationFrame() {
            if (hostAdapter && typeof hostAdapter.scheduleAnimationFrame === 'function') {
                return hostAdapter.scheduleAnimationFrame.bind(hostAdapter);
            }
            if (browserSignalTarget && typeof browserSignalTarget.requestAnimationFrame === 'function') {
                return browserSignalTarget.requestAnimationFrame.bind(browserSignalTarget);
            }
            if (browserSignalTarget && typeof browserSignalTarget.setTimeout === 'function') {
                return (callback) => browserSignalTarget.setTimeout(() => callback(now()), 16);
            }
            if (typeof globalThis !== 'undefined' && typeof globalThis.requestAnimationFrame === 'function') {
                return globalThis.requestAnimationFrame.bind(globalThis);
            }
            if (typeof globalThis !== 'undefined' && typeof globalThis.setTimeout === 'function') {
                return (callback) => globalThis.setTimeout(() => callback(now()), 16);
            }
            return null;
        }

        function normalizeBrowserSignalType(value, fallbackValue = 'fallback') {
            const safeValue = String(value || '')
                .trim()
                .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
                .replace(/[^a-zA-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .toLowerCase();
            switch (safeValue) {
            case 'longtask':
            case 'long_task':
                return 'long_task';
            case 'event':
            case 'event_timing':
                return 'event_timing';
            case 'first_input':
            case 'firstinput':
                return 'first_input';
            case 'long_animation_frame':
            case 'longanimationframe':
                return 'long_animation_frame';
            case 'frame':
            case 'frame_lag':
            case 'raf':
            case 'request_animation_frame':
                return 'frame_lag';
            case 'memory':
            case 'heap':
                return 'memory';
            case 'input_pending':
            case 'is_input_pending':
                return 'input_pending';
            default:
                return fallbackValue;
            }
        }

        function buildBrowserSignalCapabilities() {
            const observerCtor = getPerformanceObserverCtor();
            const supportedEntryTypes = getSupportedPerformanceEntryTypes(observerCtor);
            const performanceTarget = getBrowserPerformanceTarget();
            const navigatorTarget = getBrowserNavigatorTarget();
            const schedulingTarget = navigatorTarget && navigatorTarget.scheduling;
            const scheduleAnimationFrame = getScheduleAnimationFrame();
            const capabilities = {
                performanceObserver: typeof observerCtor === 'function',
                supportedEntryTypes,
                longTask: supportedEntryTypes.includes('longtask'),
                eventTiming: supportedEntryTypes.includes('event'),
                firstInput: supportedEntryTypes.includes('first-input'),
                longAnimationFrame: supportedEntryTypes.includes('long-animation-frame'),
                animationFrame: typeof scheduleAnimationFrame === 'function',
                schedulerIsInputPending: !!(schedulingTarget && typeof schedulingTarget.isInputPending === 'function'),
                performanceMemory: !!(performanceTarget && performanceTarget.memory && typeof performanceTarget.memory === 'object'),
                measureUserAgentSpecificMemory: !!(performanceTarget && typeof performanceTarget.measureUserAgentSpecificMemory === 'function')
            };
            capabilities.anyNativeSignal = capabilities.performanceObserver
                || capabilities.animationFrame
                || capabilities.schedulerIsInputPending
                || capabilities.performanceMemory
                || capabilities.measureUserAgentSpecificMemory;
            capabilities.observerSignal = capabilities.longTask
                || capabilities.eventTiming
                || capabilities.firstInput
                || capabilities.longAnimationFrame;
            return Object.freeze(capabilities);
        }

        function getBrowserSignalCapabilities() {
            if (!browserSignalCapabilities) {
                browserSignalCapabilities = buildBrowserSignalCapabilities();
            }
            return browserSignalCapabilities;
        }

        function rememberBrowserSignalError(entryType, error) {
            browserSignalObserverErrors.push({
                at: now(),
                entryType: clampString(entryType, 'unknown'),
                name: clampString(error && error.name, 'Error'),
                message: clampString(error && error.message, '')
            });
            if (browserSignalObserverErrors.length > 12) {
                browserSignalObserverErrors.splice(0, browserSignalObserverErrors.length - 12);
            }
        }

        function readEntryNumber(entry, fieldName, fallbackValue = 0) {
            return toNonNegativeFiniteNumber(entry && entry[fieldName], fallbackValue);
        }

        function buildMemorySnapshotFromPerformanceMemory(memorySource) {
            if (!memorySource || typeof memorySource !== 'object') return null;
            const usedJSHeapSize = toNonNegativeFiniteNumber(memorySource.usedJSHeapSize, 0);
            const totalJSHeapSize = toNonNegativeFiniteNumber(memorySource.totalJSHeapSize, 0);
            const jsHeapSizeLimit = toNonNegativeFiniteNumber(memorySource.jsHeapSizeLimit, 0);
            const usageRatio = totalJSHeapSize > 0
                ? usedJSHeapSize / totalJSHeapSize
                : (jsHeapSizeLimit > 0 ? usedJSHeapSize / jsHeapSizeLimit : 0);
            return {
                usedJSHeapSize,
                totalJSHeapSize,
                jsHeapSizeLimit,
                usageRatio: clampRatio(usageRatio, 0)
            };
        }

        function recordBrowserSignalSample(sample = {}, options = {}) {
            const signalType = normalizeBrowserSignalType(
                sample.signalType
                || sample.type
                || sample.entryType
                || sample.nativeEntryType,
                'fallback'
            );
            const durationMs = toNonNegativeFiniteNumber(sample.durationMs, 0);
            const inputDelayMs = toNonNegativeFiniteNumber(
                sample.inputDelayMs,
                toNonNegativeFiniteNumber(sample.waitMs, 0)
            );
            const waitMs = toNonNegativeFiniteNumber(sample.waitMs, inputDelayMs);
            const frameIntervalMs = toNonNegativeFiniteNumber(
                sample.frameIntervalMs,
                signalType === 'frame_lag' || signalType === 'long_animation_frame' ? durationMs : 0
            );
            const droppedFrameCount = Number.isFinite(sample.droppedFrameCount)
                ? Math.max(0, Math.trunc(sample.droppedFrameCount))
                : (Math.max(durationMs, frameIntervalMs) > 16.7
                    ? Math.max(0, Math.floor(Math.max(durationMs, frameIntervalMs) / 16.7) - 1)
                    : 0);
            const memory = sample.memory && typeof sample.memory === 'object'
                ? cloneSerializable(sample.memory, null)
                : null;
            const entry = {
                at: toNonNegativeFiniteNumber(sample.at, now()),
                runtimeKind,
                signalType,
                nativeEntryType: clampString(sample.nativeEntryType || sample.entryType, signalType),
                source: clampString(sample.source, 'browser-native'),
                reason: clampString(sample.reason || options.reason, 'sample'),
                durationMs,
                waitMs,
                inputDelayMs,
                frameIntervalMs,
                droppedFrameCount,
                longTask: sample.longTask === true || durationMs >= 50 || frameIntervalMs >= 50,
                inputPending: sample.inputPending === true,
                fallback: sample.fallback === true || options.fallback === true,
                memory,
                metadata: cloneSerializable(sample.metadata || options.metadata, {})
            };

            if (entry.memory) {
                browserSignalLastMemory = cloneSerializable(entry.memory, null);
            }
            if (signalType === 'input_pending') {
                browserSignalLastInputPending = entry.inputPending;
            }

            browserSignalHistory.push(entry);
            if (browserSignalHistory.length > BROWSER_SIGNAL_HISTORY_LIMIT) {
                browserSignalHistory.splice(0, browserSignalHistory.length - BROWSER_SIGNAL_HISTORY_LIMIT);
            }

            const shouldReportToScheduler = entry.durationMs > 0
                || entry.waitMs > 0
                || entry.droppedFrameCount > 0
                || entry.longTask
                || entry.inputPending;
            if (shouldReportToScheduler && rmt && typeof rmt.reportPerformanceSample === 'function') {
                rmt.reportPerformanceSample({
                    source: 'browser-native',
                    sampleType: `native_${entry.signalType}`,
                    endpointName: entry.signalType === 'input_pending' || entry.signalType === 'event_timing' || entry.signalType === 'first_input'
                        ? 'critical_input'
                        : 'background_prepare',
                    endpointGroup: 'browser_native',
                    runtimeKind,
                    lane: entry.signalType === 'input_pending' || entry.signalType === 'event_timing' || entry.signalType === 'first_input'
                        ? 'critical_input'
                        : 'background_prepare',
                    durationMs: Math.max(entry.durationMs, entry.frameIntervalMs),
                    waitMs: entry.waitMs,
                    droppedFrameCount: entry.droppedFrameCount,
                    longTask: entry.longTask
                });
            }

            if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
                diagnosticsHub.publish(BROWSER_SIGNAL_CHANNEL, entry, {
                    source: 'rmt-performance-runtime',
                    runtimeKind
                });
                diagnosticsHub.publish(BACKPRESSURE_PROFILE_CHANNEL, buildBackpressureProfile('browser_signal_recorded'), {
                    source: 'rmt-performance-runtime',
                    runtimeKind
                });
                publishSnapshot('browser_signal_recorded');
            }

            return Object.freeze(cloneSerializable(entry, {}));
        }

        function recordPerformanceObserverEntry(entry, fallbackEntryType = '') {
            if (!entry || typeof entry !== 'object') return null;
            const nativeEntryType = clampString(entry.entryType || fallbackEntryType, fallbackEntryType || 'performance_entry');
            const signalType = normalizeBrowserSignalType(nativeEntryType, 'fallback');
            const processingStart = toFiniteNumber(entry.processingStart, 0);
            const startTime = toFiniteNumber(entry.startTime, 0);
            const inputDelayMs = processingStart > 0 && startTime >= 0
                ? Math.max(processingStart - startTime, 0)
                : 0;
            return recordBrowserSignalSample({
                signalType,
                nativeEntryType,
                reason: 'performance_observer',
                durationMs: readEntryNumber(entry, 'duration', 0),
                waitMs: inputDelayMs,
                inputDelayMs,
                frameIntervalMs: signalType === 'long_animation_frame'
                    ? readEntryNumber(entry, 'duration', 0)
                    : 0,
                longTask: signalType === 'long_task' || readEntryNumber(entry, 'duration', 0) >= 50,
                metadata: {
                    name: clampString(entry.name, ''),
                    startTime: readEntryNumber(entry, 'startTime', 0),
                    interactionId: toNonNegativeFiniteNumber(entry.interactionId, 0),
                    renderStart: toNonNegativeFiniteNumber(entry.renderStart, 0),
                    styleAndLayoutStart: toNonNegativeFiniteNumber(entry.styleAndLayoutStart, 0)
                }
            });
        }

        function observeBrowserSignalEntryType(entryType, observerCtor) {
            if (!observerCtor) return false;
            let observer = null;
            try {
                observer = new observerCtor((list) => {
                    const entries = list && typeof list.getEntries === 'function'
                        ? list.getEntries()
                        : [];
                    (Array.isArray(entries) ? entries : []).forEach((entry) => {
                        recordPerformanceObserverEntry(entry, entryType);
                    });
                });
            } catch (error) {
                rememberBrowserSignalError(entryType, error);
                return false;
            }

            const observeOptions = {
                type: entryType,
                buffered: true
            };
            if (entryType === 'event') {
                observeOptions.durationThreshold = 16;
            }

            try {
                observer.observe(observeOptions);
                browserSignalObserverRecords.push({
                    entryType,
                    observer
                });
                return true;
            } catch (primaryError) {
                try {
                    observer.observe({ entryTypes: [entryType] });
                    browserSignalObserverRecords.push({
                        entryType,
                        observer
                    });
                    return true;
                } catch (fallbackError) {
                    rememberBrowserSignalError(entryType, fallbackError || primaryError);
                    if (observer && typeof observer.disconnect === 'function') {
                        observer.disconnect();
                    }
                }
            }

            return false;
        }

        function sampleBrowserMemory(reason = 'manual') {
            const performanceTarget = getBrowserPerformanceTarget();
            if (!performanceTarget) return null;
            const memorySnapshot = buildMemorySnapshotFromPerformanceMemory(performanceTarget.memory);
            if (memorySnapshot) {
                recordBrowserSignalSample({
                    signalType: 'memory',
                    nativeEntryType: 'performance.memory',
                    reason,
                    memory: memorySnapshot,
                    metadata: {
                        usageRatio: memorySnapshot.usageRatio
                    }
                });
            }
            if (typeof performanceTarget.measureUserAgentSpecificMemory === 'function') {
                try {
                    const memoryPromise = performanceTarget.measureUserAgentSpecificMemory();
                    if (memoryPromise && typeof memoryPromise.then === 'function') {
                        memoryPromise.then((result) => {
                            const bytes = toNonNegativeFiniteNumber(result && result.bytes, 0);
                            if (bytes > 0) {
                                recordBrowserSignalSample({
                                    signalType: 'memory',
                                    nativeEntryType: 'measureUserAgentSpecificMemory',
                                    reason,
                                    memory: {
                                        bytes,
                                        breakdownCount: Array.isArray(result && result.breakdown) ? result.breakdown.length : 0
                                    }
                                });
                            }
                        }).catch((error) => {
                            rememberBrowserSignalError('measureUserAgentSpecificMemory', error);
                        });
                    }
                } catch (error) {
                    rememberBrowserSignalError('measureUserAgentSpecificMemory', error);
                }
            }
            return memorySnapshot;
        }

        function sampleInputPending(reason = 'manual') {
            const navigatorTarget = getBrowserNavigatorTarget();
            const schedulingTarget = navigatorTarget && navigatorTarget.scheduling;
            if (!schedulingTarget || typeof schedulingTarget.isInputPending !== 'function') return null;
            try {
                const inputPending = schedulingTarget.isInputPending();
                browserSignalLastInputPending = inputPending === true;
                recordBrowserSignalSample({
                    signalType: 'input_pending',
                    nativeEntryType: 'navigator.scheduling.isInputPending',
                    reason,
                    inputPending: inputPending === true,
                    durationMs: inputPending === true ? 16.7 : 0,
                    waitMs: inputPending === true ? 16.7 : 0
                });
                return inputPending === true;
            } catch (error) {
                rememberBrowserSignalError('isInputPending', error);
                return null;
            }
        }

        function sampleFrameLag(reason = 'manual', options = {}) {
            const scheduleAnimationFrame = getScheduleAnimationFrame();
            if (!scheduleAnimationFrame || browserSignalFrameProbeScheduled) return false;
            browserSignalFrameProbeScheduled = true;
            const requestedAt = now();
            try {
                scheduleAnimationFrame((frameTimestamp) => {
                    browserSignalFrameProbeScheduled = false;
                    const observedAt = Number.isFinite(frameTimestamp) ? frameTimestamp : now();
                    const frameRequestMs = Math.max(observedAt - requestedAt, 0);
                    if (frameRequestMs >= 24 || options.recordAllFrames === true) {
                        recordBrowserSignalSample({
                            signalType: 'frame_lag',
                            nativeEntryType: 'requestAnimationFrame',
                            reason,
                            durationMs: frameRequestMs,
                            frameIntervalMs: frameRequestMs,
                            longTask: frameRequestMs >= 50
                        });
                    }
                });
                return true;
            } catch (error) {
                browserSignalFrameProbeScheduled = false;
                rememberBrowserSignalError('requestAnimationFrame', error);
                return false;
            }
        }

        function sampleBrowserNativeState(reason = 'manual', options = {}) {
            sampleBrowserMemory(reason);
            sampleInputPending(reason);
            if (options.probeFrame === true) {
                sampleFrameLag(reason, options);
            }
            return getBrowserSignalSnapshot(reason);
        }

        function startBrowserSignalCollection(options = {}) {
            if (browserSignalCollectionStarted) {
                return getBrowserSignalSnapshot(options.reason || 'browser_signal_collection_started');
            }
            browserSignalCollectionStarted = true;
            browserSignalCapabilities = buildBrowserSignalCapabilities();
            const observerCtor = getPerformanceObserverCtor();
            const supportedEntryTypes = getSupportedPerformanceEntryTypes(observerCtor);
            let observedCount = 0;
            if (observerCtor && supportedEntryTypes.length > 0) {
                BROWSER_SIGNAL_ENTRY_TYPES.forEach((entryType) => {
                    if (!supportedEntryTypes.includes(entryType)) return;
                    if (observeBrowserSignalEntryType(entryType, observerCtor)) {
                        observedCount += 1;
                    }
                });
            }
            browserSignalFallbackActive = observedCount <= 0;
            if (options.sampleInitial !== false) {
                sampleBrowserNativeState(options.reason || 'browser_signal_collection_started', {
                    probeFrame: options.probeFrame === true,
                    recordAllFrames: false
                });
            }
            return getBrowserSignalSnapshot(options.reason || 'browser_signal_collection_started');
        }

        function stopBrowserSignalCollection(reason = 'browser_signal_collection_stopped') {
            browserSignalObserverRecords.splice(0, browserSignalObserverRecords.length).forEach((record) => {
                if (record && record.observer && typeof record.observer.disconnect === 'function') {
                    record.observer.disconnect();
                }
            });
            browserSignalCollectionStarted = false;
            browserSignalFallbackActive = true;
            return getBrowserSignalSnapshot(reason);
        }

        function buildBrowserSignalSummary(sourceHistory = browserSignalHistory) {
            const history = Array.isArray(sourceHistory) ? sourceHistory : [];
            const durationSummary = summarizeMetricValues(history, 'durationMs');
            const waitSummary = summarizeMetricValues(history, 'waitMs');
            const frameSummary = summarizeMetricValues(history, 'frameIntervalMs');
            const inputDelaySummary = summarizeMetricValues(history, 'inputDelayMs');
            const longTaskCount = history.filter((entry) => entry && entry.longTask === true).length;
            const longFrameCount = history.filter((entry) => {
                if (!entry) return false;
                return entry.signalType === 'long_animation_frame'
                    || entry.signalType === 'frame_lag'
                    || toNonNegativeFiniteNumber(entry.frameIntervalMs, 0) >= 34;
            }).length;
            const eventTimingCount = history.filter((entry) => entry && entry.signalType === 'event_timing').length;
            const firstInputCount = history.filter((entry) => entry && entry.signalType === 'first_input').length;
            const inputPendingCount = history.filter((entry) => entry && entry.inputPending === true).length;
            const memorySampleCount = history.filter((entry) => entry && entry.signalType === 'memory').length;
            const maxMemoryUsageRatio = history.reduce((maxValue, entry) => {
                const usageRatio = entry && entry.memory
                    ? toFiniteNumber(entry.memory.usageRatio, 0)
                    : 0;
                return Math.max(maxValue, usageRatio);
            }, 0);
            const lastAt = history.reduce((maxValue, entry) => Math.max(maxValue, toNonNegativeFiniteNumber(entry && entry.at, 0)), 0);
            const summary = {
                sampleCount: history.length,
                longTaskCount,
                longFrameCount,
                eventTimingCount,
                firstInputCount,
                inputPendingCount,
                memorySampleCount,
                avgDurationMs: durationSummary.avg,
                maxDurationMs: durationSummary.max,
                avgWaitMs: waitSummary.avg,
                maxWaitMs: waitSummary.max,
                avgFrameRequestMs: frameSummary.avg,
                maxFrameRequestMs: frameSummary.max,
                avgInputDelayMs: inputDelaySummary.avg,
                maxInputDelayMs: inputDelaySummary.max,
                maxMemoryUsageRatio,
                lastAt
            };
            summary.pressureLevel = resolveBrowserPressureLevelFromSummary(summary);
            return Object.freeze(summary);
        }

        function resolveBrowserPressureLevelFromSummary(summary = {}) {
            const maxLongTaskMs = Math.max(
                toNonNegativeFiniteNumber(summary.maxDurationMs, 0),
                toNonNegativeFiniteNumber(summary.maxFrameRequestMs, 0)
            );
            const maxInputDelayMs = toNonNegativeFiniteNumber(summary.maxInputDelayMs, 0);
            const maxWaitMs = toNonNegativeFiniteNumber(summary.maxWaitMs, 0);
            const longTaskCount = toNonNegativeFiniteNumber(summary.longTaskCount, 0);
            const longFrameCount = toNonNegativeFiniteNumber(summary.longFrameCount, 0);
            const inputPendingCount = toNonNegativeFiniteNumber(summary.inputPendingCount, 0);
            const memoryRatio = toFiniteNumber(summary.maxMemoryUsageRatio, 0);

            if (
                maxLongTaskMs >= 120
                || maxInputDelayMs >= 120
                || maxWaitMs >= 160
                || longTaskCount >= 4
                || longFrameCount >= 3
                || inputPendingCount >= 4
                || memoryRatio >= 0.92
            ) {
                return 'critical';
            }
            if (
                maxLongTaskMs >= 80
                || maxInputDelayMs >= 80
                || maxWaitMs >= 96
                || longTaskCount >= 2
                || longFrameCount >= 2
                || inputPendingCount >= 2
                || memoryRatio >= 0.82
            ) {
                return 'constrained';
            }
            if (
                maxLongTaskMs >= 50
                || maxInputDelayMs >= 24
                || maxWaitMs >= 48
                || longTaskCount >= 1
                || longFrameCount >= 1
                || inputPendingCount >= 1
                || memoryRatio >= 0.72
            ) {
                return 'elevated';
            }
            return 'normal';
        }

        function getBrowserPressureLevel() {
            return normalizePressureLevel(buildBrowserSignalSummary().pressureLevel, 'normal');
        }

        function getCombinedPressureLevel() {
            return maxPressureLevel(resolvePressureLevel(), getBrowserPressureLevel());
        }

        function buildInternalMetricComparison(sourceHistory = endpointHistory) {
            const history = Array.isArray(sourceHistory) ? sourceHistory : [];
            const durationSummary = summarizeMetricValues(history, 'durationMs');
            const waitSummary = summarizeMetricValues(history, 'waitMs');
            return {
                sampleCount: history.length,
                avgDurationMs: durationSummary.avg,
                maxDurationMs: durationSummary.max,
                avgWaitMs: waitSummary.avg,
                maxWaitMs: waitSummary.max,
                longTaskCount: history.filter((entry) => toNonNegativeFiniteNumber(entry && entry.durationMs, 0) >= 50).length,
                pressureLevel: resolvePressureLevel()
            };
        }

        function buildMetricComparison(reason = 'read', sourceHistory = endpointHistory) {
            const browserSummary = buildBrowserSignalSummary();
            const internalSummary = buildInternalMetricComparison(sourceHistory);
            const combinedPressureLevel = maxPressureLevel(internalSummary.pressureLevel, browserSummary.pressureLevel);
            return Object.freeze({
                kind: 'rmt_metric_comparison',
                runtimeKind,
                updatedAt: now(),
                reason: clampString(reason, 'read'),
                internal: internalSummary,
                browserNative: {
                    sampleCount: browserSummary.sampleCount,
                    avgDurationMs: browserSummary.avgDurationMs,
                    maxHangMs: browserSummary.maxDurationMs,
                    avgWaitMs: browserSummary.avgWaitMs,
                    maxWaitMs: browserSummary.maxWaitMs,
                    maxFrameRequestMs: browserSummary.maxFrameRequestMs,
                    maxInputDelayMs: browserSummary.maxInputDelayMs,
                    longTaskCount: browserSummary.longTaskCount,
                    longFrameCount: browserSummary.longFrameCount,
                    inputPendingCount: browserSummary.inputPendingCount,
                    memorySampleCount: browserSummary.memorySampleCount,
                    pressureLevel: browserSummary.pressureLevel
                },
                pressureDelta: getPressureLevelRank(browserSummary.pressureLevel) - getPressureLevelRank(internalSummary.pressureLevel),
                combinedPressureLevel
            });
        }

        function buildBackpressureProfile(reason = 'read') {
            const internalPressureLevel = resolvePressureLevel();
            const browserPressureLevel = getBrowserPressureLevel();
            const pressureLevel = maxPressureLevel(internalPressureLevel, browserPressureLevel);
            const baseProfile = BACKPRESSURE_PROFILE_MAP[pressureLevel] || BACKPRESSURE_PROFILE_MAP.normal;
            const browserSummary = buildBrowserSignalSummary();
            const capabilities = getBrowserSignalCapabilities();
            return Object.freeze({
                kind: 'rmt_backpressure_profile',
                runtimeKind,
                updatedAt: now(),
                reason: clampString(reason, 'read'),
                pressureLevel,
                internalPressureLevel,
                browserPressureLevel,
                fallbackActive: browserSignalFallbackActive || !capabilities.observerSignal,
                chunkScale: baseProfile.chunkScale,
                followupChunkScale: baseProfile.followupChunkScale,
                prewarmFootprintRatio: baseProfile.prewarmFootprintRatio,
                prewarmMaxItems: baseProfile.prewarmMaxItems,
                prewarmMaxDomNodes: baseProfile.prewarmMaxDomNodes,
                preferIdle: baseProfile.preferIdle === true,
                delayMultiplier: baseProfile.delayMultiplier,
                signals: {
                    browserSampleCount: browserSummary.sampleCount,
                    longTaskCount: browserSummary.longTaskCount,
                    longFrameCount: browserSummary.longFrameCount,
                    inputPendingCount: browserSummary.inputPendingCount,
                    maxHangMs: browserSummary.maxDurationMs,
                    maxFrameRequestMs: browserSummary.maxFrameRequestMs,
                    maxInputDelayMs: browserSummary.maxInputDelayMs,
                    maxMemoryUsageRatio: browserSummary.maxMemoryUsageRatio
                }
            });
        }

        function getBrowserSignalSnapshot(reason = 'read') {
            const capabilities = getBrowserSignalCapabilities();
            const fallbackActive = browserSignalFallbackActive || !capabilities.observerSignal;
            const summary = buildBrowserSignalSummary();
            return Object.freeze({
                kind: 'rmt_browser_native_metrics',
                runtimeKind,
                updatedAt: now(),
                reason: clampString(reason, 'read'),
                available: capabilities.anyNativeSignal === true,
                started: browserSignalCollectionStarted === true,
                fallbackActive,
                capabilities: cloneSerializable(capabilities, {}),
                observers: browserSignalObserverRecords.map((record) => ({
                    entryType: clampString(record && record.entryType, 'unknown')
                })),
                observerErrors: browserSignalObserverErrors.map((entry) => cloneSerializable(entry, {})),
                lastMemory: cloneSerializable(browserSignalLastMemory, null),
                lastInputPending: browserSignalLastInputPending,
                pressureLevel: summary.pressureLevel,
                summary,
                history: browserSignalHistory.map((entry) => cloneSerializable(entry, {}))
            });
        }

        function buildBudgetSnapshot(reason = 'read', options = {}) {
            const sourceHistory = (Array.isArray(options.history)
                ? options.history
                : endpointHistory)
                .filter((entry) => matchesHistoryFilters(entry, options));
            const budgetBuckets = Object.create(null);
            const phaseBuckets = Object.create(null);
            const violations = [];

            sourceHistory.forEach((rawEntry) => {
                if (!rawEntry || typeof rawEntry !== 'object') return;
                const entry = rawEntry;
                const evaluation = entry.budgetId && Array.isArray(entry.budgetViolations)
                    ? {
                        budgetId: normalizeBudgetId(entry.budgetId, 'visible_commit'),
                        status: clampString(entry.budgetStatus, 'within_budget'),
                        withinBudget: clampString(entry.budgetStatus, 'within_budget') === 'within_budget',
                        violations: entry.budgetViolations.slice(),
                        durationMs: toNonNegativeNumber(entry.durationMs, 0),
                        waitMs: toNonNegativeNumber(entry.waitMs, 0),
                        totalMs: toNonNegativeNumber(entry.totalMs, toNonNegativeNumber(entry.durationMs, 0) + toNonNegativeNumber(entry.waitMs, 0)),
                        thresholds: cloneSerializable(entry.budgetThresholds, {}),
                        measurementPhase: normalizeMeasurementPhase(entry.measurementPhase, 'unknown'),
                        renderPackageId: clampString(entry.renderPackageId, ''),
                        rootId: clampString(entry.rootId, ''),
                        endpointName: normalizeEndpointName(entry.endpointName, 'visible_commit')
                    }
                    : evaluateBudgetSample(entry.endpointName, entry, {
                        budgetId: entry.budgetId || entry.budgetClass,
                        budgetClass: entry.budgetClass,
                        rootId: entry.rootId,
                        renderPackageId: entry.renderPackageId,
                        endpointGroup: entry.endpointGroup,
                        metadata: entry.metadata
                    });
                const bucketKey = evaluation.budgetId;
                if (!budgetBuckets[bucketKey]) {
                    budgetBuckets[bucketKey] = {
                        budgetId: bucketKey,
                        label: clampString((BUDGET_PROFILE_MAP[bucketKey] || {}).label, bucketKey),
                        totalCount: 0,
                        withinBudgetCount: 0,
                        violationCount: 0,
                        maxDurationMs: 0,
                        maxWaitMs: 0,
                        maxTotalMs: 0,
                        lastStatus: 'within_budget',
                        lastMeasurementPhase: 'unknown',
                        measurementPhaseCounts: {},
                        lastRenderPackageId: '',
                        lastRootId: '',
                        endpointNames: new Set(),
                        renderPackageIds: new Set()
                    };
                }
                const bucket = budgetBuckets[bucketKey];
                bucket.totalCount += 1;
                if (evaluation.withinBudget) bucket.withinBudgetCount += 1;
                else bucket.violationCount += 1;
                bucket.maxDurationMs = Math.max(bucket.maxDurationMs, evaluation.durationMs);
                bucket.maxWaitMs = Math.max(bucket.maxWaitMs, evaluation.waitMs);
                bucket.maxTotalMs = Math.max(bucket.maxTotalMs, evaluation.totalMs);
                bucket.lastStatus = evaluation.status;
                bucket.lastMeasurementPhase = evaluation.measurementPhase;
                bucket.lastRenderPackageId = evaluation.renderPackageId;
                bucket.lastRootId = evaluation.rootId;
                bucket.endpointNames.add(evaluation.endpointName);
                bucket.measurementPhaseCounts[evaluation.measurementPhase] = (bucket.measurementPhaseCounts[evaluation.measurementPhase] || 0) + 1;
                if (evaluation.renderPackageId) {
                    bucket.renderPackageIds.add(evaluation.renderPackageId);
                }
                if (!phaseBuckets[evaluation.measurementPhase]) {
                    phaseBuckets[evaluation.measurementPhase] = {
                        measurementPhase: evaluation.measurementPhase,
                        totalCount: 0,
                        withinBudgetCount: 0,
                        violationCount: 0,
                        maxDurationMs: 0,
                        maxWaitMs: 0,
                        maxTotalMs: 0,
                        lastStatus: 'within_budget',
                        budgetIds: new Set(),
                        renderPackageIds: new Set()
                    };
                }
                const phaseBucket = phaseBuckets[evaluation.measurementPhase];
                phaseBucket.totalCount += 1;
                if (evaluation.withinBudget) phaseBucket.withinBudgetCount += 1;
                else phaseBucket.violationCount += 1;
                phaseBucket.maxDurationMs = Math.max(phaseBucket.maxDurationMs, evaluation.durationMs);
                phaseBucket.maxWaitMs = Math.max(phaseBucket.maxWaitMs, evaluation.waitMs);
                phaseBucket.maxTotalMs = Math.max(phaseBucket.maxTotalMs, evaluation.totalMs);
                phaseBucket.lastStatus = evaluation.status;
                phaseBucket.budgetIds.add(evaluation.budgetId);
                if (evaluation.renderPackageId) {
                    phaseBucket.renderPackageIds.add(evaluation.renderPackageId);
                }
                if (!evaluation.withinBudget) {
                    violations.push({
                        at: toNonNegativeNumber(entry.at, 0),
                        budgetId: evaluation.budgetId,
                        endpointName: evaluation.endpointName,
                        measurementPhase: evaluation.measurementPhase,
                        renderPackageId: evaluation.renderPackageId,
                        rootId: evaluation.rootId,
                        durationMs: evaluation.durationMs,
                        waitMs: evaluation.waitMs,
                        totalMs: evaluation.totalMs,
                        violations: evaluation.violations.slice()
                    });
                }
            });

            const budgets = Object.keys(budgetBuckets)
                .sort((left, right) => left.localeCompare(right))
                .map((budgetId) => {
                    const bucket = budgetBuckets[budgetId];
                    return {
                        budgetId: bucket.budgetId,
                        label: bucket.label,
                        totalCount: bucket.totalCount,
                        withinBudgetCount: bucket.withinBudgetCount,
                        violationCount: bucket.violationCount,
                        maxDurationMs: bucket.maxDurationMs,
                        maxWaitMs: bucket.maxWaitMs,
                        maxTotalMs: bucket.maxTotalMs,
                        lastStatus: bucket.lastStatus,
                        lastMeasurementPhase: bucket.lastMeasurementPhase,
                        measurementPhaseCounts: cloneSerializable(bucket.measurementPhaseCounts, {}),
                        lastRenderPackageId: bucket.lastRenderPackageId,
                        lastRootId: bucket.lastRootId,
                        endpointNames: Array.from(bucket.endpointNames).sort((left, right) => left.localeCompare(right)),
                        renderPackageIds: Array.from(bucket.renderPackageIds).sort((left, right) => left.localeCompare(right))
                    };
                });
            const phases = Object.keys(phaseBuckets)
                .sort((left, right) => {
                    const leftIndex = MEASUREMENT_PHASES.indexOf(left);
                    const rightIndex = MEASUREMENT_PHASES.indexOf(right);
                    if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
                    if (leftIndex >= 0) return -1;
                    if (rightIndex >= 0) return 1;
                    return left.localeCompare(right);
                })
                .map((measurementPhase) => {
                    const phaseBucket = phaseBuckets[measurementPhase];
                    return {
                        measurementPhase: phaseBucket.measurementPhase,
                        totalCount: phaseBucket.totalCount,
                        withinBudgetCount: phaseBucket.withinBudgetCount,
                        violationCount: phaseBucket.violationCount,
                        maxDurationMs: phaseBucket.maxDurationMs,
                        maxWaitMs: phaseBucket.maxWaitMs,
                        maxTotalMs: phaseBucket.maxTotalMs,
                        lastStatus: phaseBucket.lastStatus,
                        budgetIds: Array.from(phaseBucket.budgetIds).sort((left, right) => left.localeCompare(right)),
                        renderPackageIds: Array.from(phaseBucket.renderPackageIds).sort((left, right) => left.localeCompare(right))
                    };
                });
            const totals = budgets.reduce((acc, bucket) => {
                acc.totalCount += bucket.totalCount;
                acc.withinBudgetCount += bucket.withinBudgetCount;
                acc.violationCount += bucket.violationCount;
                return acc;
            }, {
                totalCount: 0,
                withinBudgetCount: 0,
                violationCount: 0
            });
            const phaseTotals = phases.reduce((acc, phaseBucket) => {
                acc.totalCount += phaseBucket.totalCount;
                acc.withinBudgetCount += phaseBucket.withinBudgetCount;
                acc.violationCount += phaseBucket.violationCount;
                return acc;
            }, {
                totalCount: 0,
                withinBudgetCount: 0,
                violationCount: 0
            });

            return {
                runtimeKind,
                updatedAt: now(),
                reason: clampString(reason, 'read'),
                pressureLevel: getCombinedPressureLevel(),
                totals,
                budgets,
                phaseTotals,
                phases,
                violations: violations
                    .sort((left, right) => left.at - right.at)
                    .slice(Math.max(violations.length - 24, 0))
            };
        }

        function buildSnapshot(reason = 'read') {
            const budgetSnapshot = buildBudgetSnapshot(reason);
            const metricComparison = buildMetricComparison(reason);
            return {
                runtimeKind,
                updatedAt: now(),
                reason: clampString(reason, 'read'),
                pressureLevel: getCombinedPressureLevel(),
                endpoints: buildEndpointStatsSnapshot(),
                history: endpointHistory.map((entry) => cloneSerializable(entry, {})),
                budgets: budgetSnapshot.budgets,
                budgetTotals: budgetSnapshot.totals,
                phaseTotals: budgetSnapshot.phaseTotals,
                phases: budgetSnapshot.phases,
                budgetViolations: budgetSnapshot.violations,
                browserSignals: getBrowserSignalSnapshot(reason),
                metricComparison,
                backpressureProfile: buildBackpressureProfile(reason)
            };
        }

        function buildEndpointStatsSnapshotFromHistory(sourceHistory = []) {
            const endpointBuckets = Object.create(null);
            (Array.isArray(sourceHistory) ? sourceHistory : []).forEach((rawEntry) => {
                if (!rawEntry || typeof rawEntry !== 'object') return;
                const entry = rawEntry;
                const endpointName = normalizeEndpointName(entry.endpointName, 'visible_commit');
                if (!endpointBuckets[endpointName]) {
                    endpointBuckets[endpointName] = {
                        endpointName,
                        endpointGroup: clampString(entry.endpointGroup, clampString(getBaseEndpointProfile(endpointName).endpointGroup, 'visible_commit')),
                        totalCount: 0,
                        scheduledCount: 0,
                        syncCount: 0,
                        asyncCount: 0,
                        errorCount: 0,
                        totalDurationMs: 0,
                        totalWaitMs: 0,
                        maxDurationMs: 0,
                        maxWaitMs: 0,
                        lastAt: 0,
                        lastDurationMs: 0,
                        lastWaitMs: 0,
                        lastStatus: 'idle',
                        budgetViolationCount: 0,
                        lastBudgetStatus: 'idle',
                        lastMeasurementPhase: 'unknown',
                        measurementPhaseCounts: {},
                        lastRenderPackageId: '',
                        lastRootId: ''
                    };
                }
                const bucket = endpointBuckets[endpointName];
                const durationMs = toNonNegativeNumber(entry.durationMs, 0);
                const waitMs = toNonNegativeNumber(entry.waitMs, 0);
                const at = toNonNegativeNumber(entry.at, 0);
                bucket.totalCount += 1;
                if (entry.scheduled === true) bucket.scheduledCount += 1;
                if (entry.async === true) bucket.asyncCount += 1;
                else bucket.syncCount += 1;
                if (clampString(entry.status, 'ok') !== 'ok') bucket.errorCount += 1;
                bucket.totalDurationMs += durationMs;
                bucket.totalWaitMs += waitMs;
                bucket.maxDurationMs = Math.max(bucket.maxDurationMs, durationMs);
                bucket.maxWaitMs = Math.max(bucket.maxWaitMs, waitMs);
                if (at >= bucket.lastAt) {
                    bucket.lastAt = at;
                    bucket.lastDurationMs = durationMs;
                    bucket.lastWaitMs = waitMs;
                    bucket.lastStatus = clampString(entry.status, 'ok');
                    bucket.lastBudgetStatus = clampString(entry.budgetStatus, 'within_budget');
                    bucket.lastMeasurementPhase = normalizeMeasurementPhase(entry.measurementPhase, 'unknown');
                    bucket.lastRenderPackageId = clampString(entry.renderPackageId, '');
                    bucket.lastRootId = clampString(entry.rootId, '');
                }
                if (clampString(entry.budgetStatus, 'within_budget') === 'budget_exceeded') {
                    bucket.budgetViolationCount += 1;
                }
                const measurementPhase = normalizeMeasurementPhase(entry.measurementPhase, 'unknown');
                bucket.measurementPhaseCounts[measurementPhase] = (bucket.measurementPhaseCounts[measurementPhase] || 0) + 1;
            });

            return Object.keys(endpointBuckets)
                .sort((left, right) => left.localeCompare(right))
                .map((endpointName) => {
                    const bucket = endpointBuckets[endpointName];
                    return {
                        endpointName,
                        endpointGroup: bucket.endpointGroup,
                        totalCount: bucket.totalCount,
                        scheduledCount: bucket.scheduledCount,
                        syncCount: bucket.syncCount,
                        asyncCount: bucket.asyncCount,
                        errorCount: bucket.errorCount,
                        avgDurationMs: bucket.totalCount > 0 ? bucket.totalDurationMs / bucket.totalCount : 0,
                        avgWaitMs: bucket.totalCount > 0 ? bucket.totalWaitMs / bucket.totalCount : 0,
                        maxDurationMs: bucket.maxDurationMs,
                        maxWaitMs: bucket.maxWaitMs,
                        lastAt: bucket.lastAt,
                        lastDurationMs: bucket.lastDurationMs,
                        lastWaitMs: bucket.lastWaitMs,
                        lastStatus: bucket.lastStatus,
                        budgetViolationCount: bucket.budgetViolationCount,
                        lastBudgetStatus: bucket.lastBudgetStatus,
                        lastMeasurementPhase: bucket.lastMeasurementPhase,
                        measurementPhaseCounts: cloneSerializable(bucket.measurementPhaseCounts, {}),
                        lastRenderPackageId: bucket.lastRenderPackageId,
                        lastRootId: bucket.lastRootId
                    };
                });
        }

        function buildRenderPackageSummariesFromHistory(sourceHistory = []) {
            const packageBuckets = Object.create(null);
            (Array.isArray(sourceHistory) ? sourceHistory : []).forEach((rawEntry) => {
                if (!rawEntry || typeof rawEntry !== 'object') return;
                const entry = rawEntry;
                const renderPackageId = clampString(entry.renderPackageId, '');
                if (!renderPackageId) return;
                if (!packageBuckets[renderPackageId]) {
                    packageBuckets[renderPackageId] = {
                        renderPackageId,
                        totalCount: 0,
                        withinBudgetCount: 0,
                        violationCount: 0,
                        maxDurationMs: 0,
                        maxWaitMs: 0,
                        maxTotalMs: 0,
                        lastAt: 0,
                        lastMeasurementPhase: 'unknown',
                        lastStatus: 'idle',
                        budgetIds: new Set(),
                        endpointNames: new Set(),
                        rootIds: new Set()
                    };
                }
                const bucket = packageBuckets[renderPackageId];
                const durationMs = toNonNegativeNumber(entry.durationMs, 0);
                const waitMs = toNonNegativeNumber(entry.waitMs, 0);
                const totalMs = toNonNegativeNumber(entry.totalMs, durationMs + waitMs);
                const at = toNonNegativeNumber(entry.at, 0);
                const budgetStatus = clampString(entry.budgetStatus, 'within_budget');
                bucket.totalCount += 1;
                if (budgetStatus === 'budget_exceeded') bucket.violationCount += 1;
                else bucket.withinBudgetCount += 1;
                bucket.maxDurationMs = Math.max(bucket.maxDurationMs, durationMs);
                bucket.maxWaitMs = Math.max(bucket.maxWaitMs, waitMs);
                bucket.maxTotalMs = Math.max(bucket.maxTotalMs, totalMs);
                if (at >= bucket.lastAt) {
                    bucket.lastAt = at;
                    bucket.lastMeasurementPhase = normalizeMeasurementPhase(entry.measurementPhase, 'unknown');
                    bucket.lastStatus = budgetStatus;
                }
                bucket.budgetIds.add(normalizeBudgetId(entry.budgetId || entry.budgetClass, 'visible_commit'));
                bucket.endpointNames.add(normalizeEndpointName(entry.endpointName, 'visible_commit'));
                if (clampString(entry.rootId, '')) {
                    bucket.rootIds.add(clampString(entry.rootId, ''));
                }
            });

            return Object.keys(packageBuckets)
                .sort((left, right) => left.localeCompare(right))
                .map((renderPackageId) => {
                    const bucket = packageBuckets[renderPackageId];
                    return {
                        renderPackageId: bucket.renderPackageId,
                        totalCount: bucket.totalCount,
                        withinBudgetCount: bucket.withinBudgetCount,
                        violationCount: bucket.violationCount,
                        maxDurationMs: bucket.maxDurationMs,
                        maxWaitMs: bucket.maxWaitMs,
                        maxTotalMs: bucket.maxTotalMs,
                        lastAt: bucket.lastAt,
                        lastMeasurementPhase: bucket.lastMeasurementPhase,
                        lastStatus: bucket.lastStatus,
                        budgetIds: Array.from(bucket.budgetIds).sort((left, right) => left.localeCompare(right)),
                        endpointNames: Array.from(bucket.endpointNames).sort((left, right) => left.localeCompare(right)),
                        rootIds: Array.from(bucket.rootIds).sort((left, right) => left.localeCompare(right))
                    };
                });
        }

        function buildRootSummariesFromHistory(sourceHistory = []) {
            const rootBuckets = Object.create(null);
            (Array.isArray(sourceHistory) ? sourceHistory : []).forEach((rawEntry) => {
                if (!rawEntry || typeof rawEntry !== 'object') return;
                const entry = rawEntry;
                const rootId = clampString(entry.rootId, '');
                if (!rootId) return;
                if (!rootBuckets[rootId]) {
                    rootBuckets[rootId] = {
                        rootId,
                        totalCount: 0,
                        withinBudgetCount: 0,
                        violationCount: 0,
                        maxDurationMs: 0,
                        maxWaitMs: 0,
                        maxTotalMs: 0,
                        lastAt: 0,
                        lastMeasurementPhase: 'unknown',
                        lastStatus: 'idle',
                        budgetIds: new Set(),
                        endpointNames: new Set(),
                        renderPackageIds: new Set()
                    };
                }
                const bucket = rootBuckets[rootId];
                const durationMs = toNonNegativeNumber(entry.durationMs, 0);
                const waitMs = toNonNegativeNumber(entry.waitMs, 0);
                const totalMs = toNonNegativeNumber(entry.totalMs, durationMs + waitMs);
                const at = toNonNegativeNumber(entry.at, 0);
                const budgetStatus = clampString(entry.budgetStatus, 'within_budget');
                bucket.totalCount += 1;
                if (budgetStatus === 'budget_exceeded') bucket.violationCount += 1;
                else bucket.withinBudgetCount += 1;
                bucket.maxDurationMs = Math.max(bucket.maxDurationMs, durationMs);
                bucket.maxWaitMs = Math.max(bucket.maxWaitMs, waitMs);
                bucket.maxTotalMs = Math.max(bucket.maxTotalMs, totalMs);
                if (at >= bucket.lastAt) {
                    bucket.lastAt = at;
                    bucket.lastMeasurementPhase = normalizeMeasurementPhase(entry.measurementPhase, 'unknown');
                    bucket.lastStatus = budgetStatus;
                }
                bucket.budgetIds.add(normalizeBudgetId(entry.budgetId || entry.budgetClass, 'visible_commit'));
                bucket.endpointNames.add(normalizeEndpointName(entry.endpointName, 'visible_commit'));
                if (clampString(entry.renderPackageId, '')) {
                    bucket.renderPackageIds.add(clampString(entry.renderPackageId, ''));
                }
            });

            return Object.keys(rootBuckets)
                .sort((left, right) => left.localeCompare(right))
                .map((rootId) => {
                    const bucket = rootBuckets[rootId];
                    return {
                        rootId: bucket.rootId,
                        totalCount: bucket.totalCount,
                        withinBudgetCount: bucket.withinBudgetCount,
                        violationCount: bucket.violationCount,
                        maxDurationMs: bucket.maxDurationMs,
                        maxWaitMs: bucket.maxWaitMs,
                        maxTotalMs: bucket.maxTotalMs,
                        lastAt: bucket.lastAt,
                        lastMeasurementPhase: bucket.lastMeasurementPhase,
                        lastStatus: bucket.lastStatus,
                        budgetIds: Array.from(bucket.budgetIds).sort((left, right) => left.localeCompare(right)),
                        endpointNames: Array.from(bucket.endpointNames).sort((left, right) => left.localeCompare(right)),
                        renderPackageIds: Array.from(bucket.renderPackageIds).sort((left, right) => left.localeCompare(right))
                    };
                });
        }

        function buildSnapshotFromHistory(reason = 'read', options = {}) {
            const sourceHistory = (Array.isArray(options.history)
                ? options.history
                : endpointHistory)
                .filter((entry) => matchesHistoryFilters(entry, options));
            const budgetSnapshot = buildBudgetSnapshot(reason, {
                ...options,
                history: sourceHistory
            });
            return {
                runtimeKind,
                updatedAt: now(),
                reason: clampString(reason, 'read'),
                pressureLevel: maxPressureLevel(resolvePressureLevel(), getBrowserPressureLevel()),
                endpoints: buildEndpointStatsSnapshotFromHistory(sourceHistory),
                history: sourceHistory.map((entry) => cloneSerializable(entry, {})),
                budgets: budgetSnapshot.budgets,
                budgetTotals: budgetSnapshot.totals,
                phaseTotals: budgetSnapshot.phaseTotals,
                phases: budgetSnapshot.phases,
                budgetViolations: budgetSnapshot.violations,
                browserSignals: getBrowserSignalSnapshot(reason),
                metricComparison: buildMetricComparison(reason, sourceHistory),
                backpressureProfile: buildBackpressureProfile(reason)
            };
        }

        function normalizeRunReportId(value, fallbackValue = '') {
            const safeValue = clampString(value, fallbackValue);
            return safeValue || `run:${Math.floor(now())}`;
        }

        function normalizeHarnessOutputId(value, fallbackValue = '') {
            const safeValue = clampString(value, fallbackValue);
            return safeValue || `output:${Math.floor(now())}`;
        }

        function normalizeHarnessHistoryId(value, fallbackValue = '') {
            const safeValue = clampString(value, fallbackValue);
            return safeValue || `history:${Math.floor(now())}`;
        }

        function normalizeBatchId(value, fallbackValue = '') {
            const safeValue = clampString(value, fallbackValue);
            return safeValue || fallbackValue;
        }

        function normalizeBatchLabel(value, fallbackValue = '') {
            return clampString(value, fallbackValue);
        }

        function buildPerformanceRunReport(reasonOrOptions = 'export', maybeOptions = {}) {
            const reason = typeof reasonOrOptions === 'string'
                ? reasonOrOptions
                : 'export';
            const options = isObjectLike(reasonOrOptions)
                ? reasonOrOptions
                : maybeOptions;
            const snapshot = options.snapshot && typeof options.snapshot === 'object'
                ? cloneSerializable(options.snapshot, null)
                : buildSnapshotFromHistory(reason, options);
            const history = snapshot && Array.isArray(snapshot.history)
                ? snapshot.history
                : [];
            const renderPackages = buildRenderPackageSummariesFromHistory(history);
            const roots = buildRootSummariesFromHistory(history);
            const firstSampleAt = history.length > 0
                ? history.reduce((minValue, entry) => Math.min(minValue, toNonNegativeNumber(entry.at, minValue)), toNonNegativeNumber(history[0].at, 0))
                : 0;
            const lastSampleAt = history.length > 0
                ? history.reduce((maxValue, entry) => Math.max(maxValue, toNonNegativeNumber(entry.at, maxValue)), 0)
                : 0;
            return Object.freeze({
                kind: 'rmt_performance_run_report',
                runtimeKind,
                exportedAt: now(),
                reason: clampString(reason, 'export'),
                runId: normalizeRunReportId(options.runId, ''),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {}),
                filters: {
                    endpointNames: Array.isArray(options.endpointNames) ? options.endpointNames.map((entry) => normalizeEndpointName(entry, '')).filter(Boolean) : [],
                    measurementPhases: Array.isArray(options.measurementPhases) ? options.measurementPhases.map((entry) => normalizeMeasurementPhase(entry, '')).filter(Boolean) : [],
                    renderPackageIds: Array.isArray(options.renderPackageIds) ? options.renderPackageIds.map((entry) => clampString(entry, '')).filter(Boolean) : [],
                    rootIds: Array.isArray(options.rootIds) ? options.rootIds.map((entry) => clampString(entry, '')).filter(Boolean) : []
                },
                summary: {
                    endpointCount: Array.isArray(snapshot && snapshot.endpoints) ? snapshot.endpoints.length : 0,
                    sampleCount: history.length,
                    budgetCount: Array.isArray(snapshot && snapshot.budgets) ? snapshot.budgets.length : 0,
                    phaseCount: Array.isArray(snapshot && snapshot.phases) ? snapshot.phases.length : 0,
                    renderPackageCount: renderPackages.length,
                    rootCount: roots.length,
                    violationCount: Array.isArray(snapshot && snapshot.budgetViolations) ? snapshot.budgetViolations.length : 0,
                    firstSampleAt,
                    lastSampleAt,
                    windowMs: firstSampleAt > 0 && lastSampleAt >= firstSampleAt ? lastSampleAt - firstSampleAt : 0,
                    pressureLevel: clampString(snapshot && snapshot.pressureLevel, resolvePressureLevel())
                },
                snapshot,
                renderPackages,
                roots
            });
        }

        function compareSummaryBuckets(baseEntries = [], targetEntries = [], keyName) {
            const baseMap = new Map();
            const targetMap = new Map();
            (Array.isArray(baseEntries) ? baseEntries : []).forEach((entry) => {
                if (!entry || typeof entry !== 'object') return;
                const key = clampString(entry[keyName], '');
                if (key) baseMap.set(key, entry);
            });
            (Array.isArray(targetEntries) ? targetEntries : []).forEach((entry) => {
                if (!entry || typeof entry !== 'object') return;
                const key = clampString(entry[keyName], '');
                if (key) targetMap.set(key, entry);
            });
            return Array.from(new Set([
                ...Array.from(baseMap.keys()),
                ...Array.from(targetMap.keys())
            ]))
                .sort((left, right) => left.localeCompare(right))
                .map((key) => {
                    const baseEntry = baseMap.get(key) || {};
                    const targetEntry = targetMap.get(key) || {};
                    const baseTotalCount = toNonNegativeNumber(baseEntry.totalCount, 0);
                    const targetTotalCount = toNonNegativeNumber(targetEntry.totalCount, 0);
                    const baseViolationCount = toNonNegativeNumber(baseEntry.violationCount, 0);
                    const targetViolationCount = toNonNegativeNumber(targetEntry.violationCount, 0);
                    const baseWithinBudgetCount = toNonNegativeNumber(baseEntry.withinBudgetCount, 0);
                    const targetWithinBudgetCount = toNonNegativeNumber(targetEntry.withinBudgetCount, 0);
                    const baseMaxTotalMs = toNonNegativeNumber(baseEntry.maxTotalMs, 0);
                    const targetMaxTotalMs = toNonNegativeNumber(targetEntry.maxTotalMs, 0);
                    return {
                        [keyName]: key,
                        baseTotalCount,
                        targetTotalCount,
                        totalCountDelta: targetTotalCount - baseTotalCount,
                        baseWithinBudgetCount,
                        targetWithinBudgetCount,
                        withinBudgetDelta: targetWithinBudgetCount - baseWithinBudgetCount,
                        baseViolationCount,
                        targetViolationCount,
                        violationDelta: targetViolationCount - baseViolationCount,
                        baseMaxTotalMs,
                        targetMaxTotalMs,
                        maxTotalMsDelta: targetMaxTotalMs - baseMaxTotalMs,
                        baseLastStatus: clampString(baseEntry.lastStatus, ''),
                        targetLastStatus: clampString(targetEntry.lastStatus, ''),
                        baseLastMeasurementPhase: normalizeMeasurementPhase(baseEntry.lastMeasurementPhase, ''),
                        targetLastMeasurementPhase: normalizeMeasurementPhase(targetEntry.lastMeasurementPhase, '')
                    };
                });
        }

        function compareRunReports(baseReportInput, targetReportInput, options = {}) {
            const baseReport = baseReportInput && typeof baseReportInput === 'object' ? baseReportInput : {};
            const targetReport = targetReportInput && typeof targetReportInput === 'object' ? targetReportInput : {};
            const baseSnapshot = baseReport.snapshot && typeof baseReport.snapshot === 'object' ? baseReport.snapshot : {};
            const targetSnapshot = targetReport.snapshot && typeof targetReport.snapshot === 'object' ? targetReport.snapshot : {};
            const budgetDeltas = compareSummaryBuckets(baseSnapshot.budgets, targetSnapshot.budgets, 'budgetId');
            const phaseDeltas = compareSummaryBuckets(baseSnapshot.phases, targetSnapshot.phases, 'measurementPhase');
            const renderPackageDeltas = compareSummaryBuckets(baseReport.renderPackages, targetReport.renderPackages, 'renderPackageId');
            const rootDeltas = compareSummaryBuckets(baseReport.roots, targetReport.roots, 'rootId');
            const baseSummary = baseReport.summary && typeof baseReport.summary === 'object' ? baseReport.summary : {};
            const targetSummary = targetReport.summary && typeof targetReport.summary === 'object' ? targetReport.summary : {};

            return Object.freeze({
                kind: 'rmt_performance_run_comparison',
                runtimeKind,
                comparedAt: now(),
                label: clampString(options.label, ''),
                baseRunId: normalizeRunReportId(baseReport.runId, 'base'),
                targetRunId: normalizeRunReportId(targetReport.runId, 'target'),
                baseLabel: clampString(baseReport.label, ''),
                targetLabel: clampString(targetReport.label, ''),
                summary: {
                    sampleCountDelta: toNonNegativeNumber(targetSummary.sampleCount, 0) - toNonNegativeNumber(baseSummary.sampleCount, 0),
                    budgetCountDelta: toNonNegativeNumber(targetSummary.budgetCount, 0) - toNonNegativeNumber(baseSummary.budgetCount, 0),
                    phaseCountDelta: toNonNegativeNumber(targetSummary.phaseCount, 0) - toNonNegativeNumber(baseSummary.phaseCount, 0),
                    renderPackageCountDelta: toNonNegativeNumber(targetSummary.renderPackageCount, 0) - toNonNegativeNumber(baseSummary.renderPackageCount, 0),
                    rootCountDelta: toNonNegativeNumber(targetSummary.rootCount, 0) - toNonNegativeNumber(baseSummary.rootCount, 0),
                    violationCountDelta: toNonNegativeNumber(targetSummary.violationCount, 0) - toNonNegativeNumber(baseSummary.violationCount, 0),
                    windowMsDelta: toNonNegativeNumber(targetSummary.windowMs, 0) - toNonNegativeNumber(baseSummary.windowMs, 0)
                },
                budgetDeltas,
                phaseDeltas,
                renderPackageDeltas,
                rootDeltas
            });
        }

        function normalizeRunReports(reportInputs = []) {
            return (Array.isArray(reportInputs) ? reportInputs : [])
                .filter((report) => report && typeof report === 'object')
                .map((report) => cloneSerializable(report, {}))
                .filter((report) => report.snapshot && typeof report.snapshot === 'object')
                .sort((left, right) => {
                    const timeDelta = toNonNegativeNumber(left.exportedAt, 0) - toNonNegativeNumber(right.exportedAt, 0);
                    if (timeDelta !== 0) return timeDelta;
                    return normalizeRunReportId(left.runId, 'left').localeCompare(normalizeRunReportId(right.runId, 'right'));
                });
        }

        function buildBaselineSummary(reports = []) {
            const safeReports = normalizeRunReports(reports);
            const totals = safeReports.reduce((acc, report) => {
                const summary = report.summary && typeof report.summary === 'object' ? report.summary : {};
                const sampleCount = toNonNegativeNumber(summary.sampleCount, 0);
                const violationCount = toNonNegativeNumber(summary.violationCount, 0);
                const windowMs = toNonNegativeNumber(summary.windowMs, 0);
                const budgetCount = toNonNegativeNumber(summary.budgetCount, 0);
                const phaseCount = toNonNegativeNumber(summary.phaseCount, 0);
                const renderPackageCount = toNonNegativeNumber(summary.renderPackageCount, 0);
                const rootCount = toNonNegativeNumber(summary.rootCount, 0);
                acc.sampleCount += sampleCount;
                acc.violationCount += violationCount;
                acc.windowMs += windowMs;
                acc.budgetCount += budgetCount;
                acc.phaseCount += phaseCount;
                acc.renderPackageCount += renderPackageCount;
                acc.rootCount += rootCount;
                acc.minWindowMs = acc.minWindowMs === null ? windowMs : Math.min(acc.minWindowMs, windowMs);
                acc.maxWindowMs = Math.max(acc.maxWindowMs, windowMs);
                return acc;
            }, {
                sampleCount: 0,
                violationCount: 0,
                windowMs: 0,
                budgetCount: 0,
                phaseCount: 0,
                renderPackageCount: 0,
                rootCount: 0,
                minWindowMs: null,
                maxWindowMs: 0
            });
            const runCount = safeReports.length;
            return {
                runCount,
                avgSampleCount: runCount > 0 ? totals.sampleCount / runCount : 0,
                avgViolationCount: runCount > 0 ? totals.violationCount / runCount : 0,
                avgWindowMs: runCount > 0 ? totals.windowMs / runCount : 0,
                minWindowMs: totals.minWindowMs === null ? 0 : totals.minWindowMs,
                maxWindowMs: totals.maxWindowMs,
                avgBudgetCount: runCount > 0 ? totals.budgetCount / runCount : 0,
                avgPhaseCount: runCount > 0 ? totals.phaseCount / runCount : 0,
                avgRenderPackageCount: runCount > 0 ? totals.renderPackageCount / runCount : 0,
                avgRootCount: runCount > 0 ? totals.rootCount / runCount : 0
            };
        }

        function buildBucketBaselineEntries(reports = [], keyName, getEntries) {
            const safeReports = normalizeRunReports(reports);
            const buckets = Object.create(null);
            safeReports.forEach((report) => {
                const exportedAt = toNonNegativeNumber(report.exportedAt, 0);
                const entries = Array.isArray(getEntries(report)) ? getEntries(report) : [];
                entries.forEach((entry) => {
                    if (!entry || typeof entry !== 'object') return;
                    const key = clampString(entry[keyName], '');
                    if (!key) return;
                    if (!buckets[key]) {
                        buckets[key] = {
                            key,
                            runCount: 0,
                            totalCountSum: 0,
                            withinBudgetSum: 0,
                            violationSum: 0,
                            maxTotalMsSum: 0,
                            minTotalCount: null,
                            maxTotalCount: 0,
                            minMaxTotalMs: null,
                            maxMaxTotalMs: 0,
                            lastAt: 0,
                            latestStatus: 'idle',
                            latestMeasurementPhase: 'unknown'
                        };
                    }
                    const bucket = buckets[key];
                    const totalCount = toNonNegativeNumber(entry.totalCount, 0);
                    const withinBudgetCount = toNonNegativeNumber(entry.withinBudgetCount, 0);
                    const violationCount = toNonNegativeNumber(entry.violationCount, 0);
                    const maxTotalMs = toNonNegativeNumber(entry.maxTotalMs, 0);
                    bucket.runCount += 1;
                    bucket.totalCountSum += totalCount;
                    bucket.withinBudgetSum += withinBudgetCount;
                    bucket.violationSum += violationCount;
                    bucket.maxTotalMsSum += maxTotalMs;
                    bucket.minTotalCount = bucket.minTotalCount === null ? totalCount : Math.min(bucket.minTotalCount, totalCount);
                    bucket.maxTotalCount = Math.max(bucket.maxTotalCount, totalCount);
                    bucket.minMaxTotalMs = bucket.minMaxTotalMs === null ? maxTotalMs : Math.min(bucket.minMaxTotalMs, maxTotalMs);
                    bucket.maxMaxTotalMs = Math.max(bucket.maxMaxTotalMs, maxTotalMs);
                    if (exportedAt >= bucket.lastAt) {
                        bucket.lastAt = exportedAt;
                        bucket.latestStatus = clampString(entry.lastStatus, '');
                        bucket.latestMeasurementPhase = normalizeMeasurementPhase(entry.lastMeasurementPhase, '');
                    }
                });
            });

            return Object.keys(buckets)
                .sort((left, right) => left.localeCompare(right))
                .map((key) => {
                    const bucket = buckets[key];
                    return {
                        [keyName]: key,
                        runCount: bucket.runCount,
                        coverage: safeReports.length > 0 ? bucket.runCount / safeReports.length : 0,
                        avgTotalCount: bucket.runCount > 0 ? bucket.totalCountSum / bucket.runCount : 0,
                        avgWithinBudgetCount: bucket.runCount > 0 ? bucket.withinBudgetSum / bucket.runCount : 0,
                        avgViolationCount: bucket.runCount > 0 ? bucket.violationSum / bucket.runCount : 0,
                        avgMaxTotalMs: bucket.runCount > 0 ? bucket.maxTotalMsSum / bucket.runCount : 0,
                        minTotalCount: bucket.minTotalCount === null ? 0 : bucket.minTotalCount,
                        maxTotalCount: bucket.maxTotalCount,
                        minMaxTotalMs: bucket.minMaxTotalMs === null ? 0 : bucket.minMaxTotalMs,
                        maxMaxTotalMs: bucket.maxMaxTotalMs,
                        latestStatus: bucket.latestStatus,
                        latestMeasurementPhase: bucket.latestMeasurementPhase
                    };
                });
        }

        function buildBucketTrendSeriesEntries(reports = [], keyName, getEntries) {
            const safeReports = normalizeRunReports(reports);
            const seriesBuckets = Object.create(null);
            safeReports.forEach((report) => {
                const runId = normalizeRunReportId(report.runId, '');
                const label = clampString(report.label, '');
                const exportedAt = toNonNegativeNumber(report.exportedAt, 0);
                const entries = Array.isArray(getEntries(report)) ? getEntries(report) : [];
                entries.forEach((entry) => {
                    if (!entry || typeof entry !== 'object') return;
                    const key = clampString(entry[keyName], '');
                    if (!key) return;
                    if (!seriesBuckets[key]) {
                        seriesBuckets[key] = {
                            key,
                            points: []
                        };
                    }
                    seriesBuckets[key].points.push({
                        runId,
                        label,
                        exportedAt,
                        totalCount: toNonNegativeNumber(entry.totalCount, 0),
                        withinBudgetCount: toNonNegativeNumber(entry.withinBudgetCount, 0),
                        violationCount: toNonNegativeNumber(entry.violationCount, 0),
                        maxTotalMs: toNonNegativeNumber(entry.maxTotalMs, 0),
                        lastStatus: clampString(entry.lastStatus, ''),
                        lastMeasurementPhase: normalizeMeasurementPhase(entry.lastMeasurementPhase, '')
                    });
                });
            });

            return Object.keys(seriesBuckets)
                .sort((left, right) => left.localeCompare(right))
                .map((key) => ({
                    [keyName]: key,
                    pointCount: seriesBuckets[key].points.length,
                    points: seriesBuckets[key].points
                        .slice()
                        .sort((left, right) => left.exportedAt - right.exportedAt || left.runId.localeCompare(right.runId))
                }));
        }

        function createRunBaseline(reportInputs = [], options = {}) {
            const reports = normalizeRunReports(Array.isArray(reportInputs) ? reportInputs : options.reports);
            return Object.freeze({
                kind: 'rmt_performance_baseline',
                runtimeKind,
                createdAt: now(),
                baselineId: clampString(options.baselineId, `baseline:${Math.floor(now())}`),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {}),
                summary: buildBaselineSummary(reports),
                runs: reports.map((report) => ({
                    runId: normalizeRunReportId(report.runId, ''),
                    label: clampString(report.label, ''),
                    exportedAt: toNonNegativeNumber(report.exportedAt, 0)
                })),
                budgets: buildBucketBaselineEntries(reports, 'budgetId', (report) => report.snapshot && report.snapshot.budgets),
                phases: buildBucketBaselineEntries(reports, 'measurementPhase', (report) => report.snapshot && report.snapshot.phases),
                renderPackages: buildBucketBaselineEntries(reports, 'renderPackageId', (report) => report.renderPackages),
                roots: buildBucketBaselineEntries(reports, 'rootId', (report) => report.roots)
            });
        }

        function createTrendSeries(reportInputs = [], options = {}) {
            const reports = normalizeRunReports(Array.isArray(reportInputs) ? reportInputs : options.reports);
            return Object.freeze({
                kind: 'rmt_performance_trend_series',
                runtimeKind,
                createdAt: now(),
                seriesId: clampString(options.seriesId, `series:${Math.floor(now())}`),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {}),
                summary: {
                    runCount: reports.length,
                    budgetSeriesCount: buildBucketTrendSeriesEntries(reports, 'budgetId', (report) => report.snapshot && report.snapshot.budgets).length,
                    phaseSeriesCount: buildBucketTrendSeriesEntries(reports, 'measurementPhase', (report) => report.snapshot && report.snapshot.phases).length,
                    renderPackageSeriesCount: buildBucketTrendSeriesEntries(reports, 'renderPackageId', (report) => report.renderPackages).length,
                    rootSeriesCount: buildBucketTrendSeriesEntries(reports, 'rootId', (report) => report.roots).length
                },
                runs: reports.map((report) => ({
                    runId: normalizeRunReportId(report.runId, ''),
                    label: clampString(report.label, ''),
                    exportedAt: toNonNegativeNumber(report.exportedAt, 0),
                    sampleCount: toNonNegativeNumber(report.summary && report.summary.sampleCount, 0),
                    violationCount: toNonNegativeNumber(report.summary && report.summary.violationCount, 0),
                    windowMs: toNonNegativeNumber(report.summary && report.summary.windowMs, 0),
                    pressureLevel: clampString(report.summary && report.summary.pressureLevel, clampString(report.snapshot && report.snapshot.pressureLevel, 'normal'))
                })),
                budgets: buildBucketTrendSeriesEntries(reports, 'budgetId', (report) => report.snapshot && report.snapshot.budgets),
                phases: buildBucketTrendSeriesEntries(reports, 'measurementPhase', (report) => report.snapshot && report.snapshot.phases),
                renderPackages: buildBucketTrendSeriesEntries(reports, 'renderPackageId', (report) => report.renderPackages),
                roots: buildBucketTrendSeriesEntries(reports, 'rootId', (report) => report.roots)
            });
        }

        function compareReportEntriesToBaseline(reportEntries = [], baselineEntries = [], keyName) {
            const reportMap = new Map();
            const baselineMap = new Map();
            (Array.isArray(reportEntries) ? reportEntries : []).forEach((entry) => {
                if (!entry || typeof entry !== 'object') return;
                const key = clampString(entry[keyName], '');
                if (key) reportMap.set(key, entry);
            });
            (Array.isArray(baselineEntries) ? baselineEntries : []).forEach((entry) => {
                if (!entry || typeof entry !== 'object') return;
                const key = clampString(entry[keyName], '');
                if (key) baselineMap.set(key, entry);
            });

            return Array.from(new Set([
                ...Array.from(reportMap.keys()),
                ...Array.from(baselineMap.keys())
            ]))
                .sort((left, right) => left.localeCompare(right))
                .map((key) => {
                    const reportEntry = reportMap.get(key) || {};
                    const baselineEntry = baselineMap.get(key) || {};
                    const reportTotalCount = toNonNegativeNumber(reportEntry.totalCount, 0);
                    const reportWithinBudgetCount = toNonNegativeNumber(reportEntry.withinBudgetCount, 0);
                    const reportViolationCount = toNonNegativeNumber(reportEntry.violationCount, 0);
                    const reportMaxTotalMs = toNonNegativeNumber(reportEntry.maxTotalMs, 0);
                    const baselineAvgTotalCount = toNonNegativeNumber(baselineEntry.avgTotalCount, 0);
                    const baselineAvgWithinBudgetCount = toNonNegativeNumber(baselineEntry.avgWithinBudgetCount, 0);
                    const baselineAvgViolationCount = toNonNegativeNumber(baselineEntry.avgViolationCount, 0);
                    const baselineAvgMaxTotalMs = toNonNegativeNumber(baselineEntry.avgMaxTotalMs, 0);
                    return {
                        [keyName]: key,
                        baselineRunCount: toNonNegativeNumber(baselineEntry.runCount, 0),
                        baselineCoverage: Number.isFinite(baselineEntry.coverage) ? baselineEntry.coverage : 0,
                        reportTotalCount,
                        baselineAvgTotalCount,
                        totalCountDelta: reportTotalCount - baselineAvgTotalCount,
                        reportWithinBudgetCount,
                        baselineAvgWithinBudgetCount,
                        withinBudgetDelta: reportWithinBudgetCount - baselineAvgWithinBudgetCount,
                        reportViolationCount,
                        baselineAvgViolationCount,
                        violationDelta: reportViolationCount - baselineAvgViolationCount,
                        reportMaxTotalMs,
                        baselineAvgMaxTotalMs,
                        maxTotalMsDelta: reportMaxTotalMs - baselineAvgMaxTotalMs,
                        reportLastStatus: clampString(reportEntry.lastStatus, ''),
                        baselineLatestStatus: clampString(baselineEntry.latestStatus, ''),
                        reportLastMeasurementPhase: normalizeMeasurementPhase(reportEntry.lastMeasurementPhase, ''),
                        baselineLatestMeasurementPhase: normalizeMeasurementPhase(baselineEntry.latestMeasurementPhase, '')
                    };
                });
        }

        function compareRunReportToBaseline(reportInput, baselineInput, options = {}) {
            const report = reportInput && typeof reportInput === 'object' ? reportInput : {};
            const baseline = baselineInput && typeof baselineInput === 'object' ? baselineInput : {};
            const reportSummary = report.summary && typeof report.summary === 'object' ? report.summary : {};
            const baselineSummary = baseline.summary && typeof baseline.summary === 'object' ? baseline.summary : {};
            return Object.freeze({
                kind: 'rmt_performance_baseline_comparison',
                runtimeKind,
                comparedAt: now(),
                label: clampString(options.label, ''),
                runId: normalizeRunReportId(report.runId, 'run'),
                baselineId: clampString(baseline.baselineId, 'baseline'),
                runLabel: clampString(report.label, ''),
                baselineLabel: clampString(baseline.label, ''),
                summary: {
                    sampleCountDelta: toNonNegativeNumber(reportSummary.sampleCount, 0) - toNonNegativeNumber(baselineSummary.avgSampleCount, 0),
                    violationCountDelta: toNonNegativeNumber(reportSummary.violationCount, 0) - toNonNegativeNumber(baselineSummary.avgViolationCount, 0),
                    windowMsDelta: toNonNegativeNumber(reportSummary.windowMs, 0) - toNonNegativeNumber(baselineSummary.avgWindowMs, 0),
                    budgetCountDelta: toNonNegativeNumber(reportSummary.budgetCount, 0) - toNonNegativeNumber(baselineSummary.avgBudgetCount, 0),
                    phaseCountDelta: toNonNegativeNumber(reportSummary.phaseCount, 0) - toNonNegativeNumber(baselineSummary.avgPhaseCount, 0),
                    renderPackageCountDelta: toNonNegativeNumber(reportSummary.renderPackageCount, 0) - toNonNegativeNumber(baselineSummary.avgRenderPackageCount, 0),
                    rootCountDelta: toNonNegativeNumber(reportSummary.rootCount, 0) - toNonNegativeNumber(baselineSummary.avgRootCount, 0)
                },
                budgets: compareReportEntriesToBaseline(report.snapshot && report.snapshot.budgets, baseline.budgets, 'budgetId'),
                phases: compareReportEntriesToBaseline(report.snapshot && report.snapshot.phases, baseline.phases, 'measurementPhase'),
                renderPackages: compareReportEntriesToBaseline(report.renderPackages, baseline.renderPackages, 'renderPackageId'),
                roots: compareReportEntriesToBaseline(report.roots, baseline.roots, 'rootId')
            });
        }

        function createHarnessOutput(reasonOrOptions = 'harness_export', maybeOptions = {}) {
            const reason = typeof reasonOrOptions === 'string'
                ? reasonOrOptions
                : 'harness_export';
            const options = isObjectLike(reasonOrOptions)
                ? reasonOrOptions
                : maybeOptions;
            const runReport = options.runReport && typeof options.runReport === 'object'
                ? cloneSerializable(options.runReport, null)
                : buildPerformanceRunReport(reason, options);
            const runMetadata = runReport && isObjectLike(runReport.metadata)
                ? runReport.metadata
                : {};
            const outputMetadata = cloneSerializable(options.metadata, {});
            const batchId = normalizeBatchId(
                options.batchId
                || outputMetadata.batchId
                || runMetadata.batchId,
                normalizeRunReportId(runReport && runReport.runId, '')
            );
            const batchLabel = normalizeBatchLabel(
                options.batchLabel
                || outputMetadata.batchLabel
                || runMetadata.batchLabel,
                batchId
            );
            const historyOutputs = normalizeHarnessOutputs(
                Array.isArray(options.historyOutputs)
                    ? options.historyOutputs
                    : (options.includePersistedHistory === false ? [] : listPersistedHarnessOutputs(options.historyLimit))
            );
            const historyReports = extractRunReportsFromHarnessOutputs(historyOutputs);
            const baselineReports = historyReports.length > 0
                ? historyReports
                : (runReport ? [runReport] : []);
            const trendReports = runReport
                ? normalizeRunReports([...historyReports, runReport])
                : historyReports;
            const baseline = baselineReports.length > 0
                ? createRunBaseline(baselineReports, {
                    baselineId: clampString(options.baselineId, ''),
                    label: clampString(options.baselineLabel || options.label, ''),
                    metadata: cloneSerializable(options.metadata, {})
                })
                : null;
            const trendSeries = trendReports.length > 0
                ? createTrendSeries(trendReports, {
                    seriesId: clampString(options.seriesId, ''),
                    label: clampString(options.seriesLabel || options.label, ''),
                    metadata: cloneSerializable(options.metadata, {})
                })
                : null;
            const baselineComparison = runReport && baseline
                ? compareRunReportToBaseline(runReport, baseline, {
                    label: clampString(options.comparisonLabel || options.label, '')
                })
                : null;
            const storageStatus = getHistoryStorageStatus();
            return Object.freeze({
                kind: 'rmt_performance_harness_output',
                runtimeKind,
                exportedAt: now(),
                reason: clampString(reason, 'harness_export'),
                outputId: normalizeHarnessOutputId(options.outputId, ''),
                label: clampString(options.label, ''),
                metadata: outputMetadata,
                batchId,
                batchLabel,
                runReport: cloneSerializable(runReport, null),
                baseline: cloneSerializable(baseline, null),
                trendSeries: cloneSerializable(trendSeries, null),
                baselineComparison: cloneSerializable(baselineComparison, null),
                historySummary: {
                    persistedOutputCount: historyOutputs.length,
                    persistedRunCount: historyReports.length,
                    baselineRunCount: baseline && baseline.summary ? toNonNegativeNumber(baseline.summary.runCount, 0) : 0,
                    trendRunCount: trendSeries && trendSeries.summary ? toNonNegativeNumber(trendSeries.summary.runCount, 0) : 0,
                    storageBackend: storageStatus.backend,
                    storageKey: storageStatus.storageKey,
                    persistentAvailable: storageStatus.persistentAvailable
                }
            });
        }

        function createBatchSeries(outputInputs = [], options = {}) {
            const outputs = normalizeHarnessOutputs(
                Array.isArray(outputInputs) && outputInputs.length > 0
                    ? outputInputs
                    : listPersistedHarnessOutputs(options.limit)
            );
            const batchBuckets = Object.create(null);
            outputs.forEach((output) => {
                const runReport = output.runReport && typeof output.runReport === 'object'
                    ? output.runReport
                    : null;
                const runMetadata = runReport && isObjectLike(runReport.metadata)
                    ? runReport.metadata
                    : {};
                const batchId = normalizeBatchId(
                    output.batchId
                    || runMetadata.batchId,
                    normalizeRunReportId(runReport && runReport.runId, normalizeHarnessOutputId(output.outputId, ''))
                );
                if (!batchBuckets[batchId]) {
                    batchBuckets[batchId] = {
                        batchId,
                        batchLabel: normalizeBatchLabel(output.batchLabel || runMetadata.batchLabel, batchId),
                        outputs: []
                    };
                }
                batchBuckets[batchId].outputs.push(output);
            });

            const batches = Object.keys(batchBuckets)
                .sort((left, right) => left.localeCompare(right))
                .map((batchId) => {
                    const bucket = batchBuckets[batchId];
                    const bucketOutputs = normalizeHarnessOutputs(bucket.outputs)
                        .slice()
                        .sort((left, right) => {
                            const timeDelta = toNonNegativeNumber(left.exportedAt, 0) - toNonNegativeNumber(right.exportedAt, 0);
                            if (timeDelta !== 0) return timeDelta;
                            return normalizeHarnessOutputId(left.outputId, 'left').localeCompare(normalizeHarnessOutputId(right.outputId, 'right'));
                        });
                    const reports = extractRunReportsFromHarnessOutputs(bucketOutputs);
                    const firstExportedAt = bucketOutputs.length > 0 ? toNonNegativeNumber(bucketOutputs[0].exportedAt, 0) : 0;
                    const lastExportedAt = bucketOutputs.length > 0 ? toNonNegativeNumber(bucketOutputs[bucketOutputs.length - 1].exportedAt, 0) : 0;
                    const baseline = reports.length > 0
                        ? createRunBaseline(reports, {
                            baselineId: clampString(options.baselineIdPrefix, 'batch-baseline')
                                ? `${clampString(options.baselineIdPrefix, 'batch-baseline')}:${batchId}`
                                : '',
                            label: bucket.batchLabel,
                            metadata: cloneSerializable(options.metadata, {})
                        })
                        : null;
                    const trendSeries = reports.length > 0
                        ? createTrendSeries(reports, {
                            seriesId: clampString(options.seriesIdPrefix, 'batch-series')
                                ? `${clampString(options.seriesIdPrefix, 'batch-series')}:${batchId}`
                                : '',
                            label: bucket.batchLabel,
                            metadata: cloneSerializable(options.metadata, {})
                        })
                        : null;
                    return {
                        batchId,
                        batchLabel: bucket.batchLabel,
                        outputCount: bucketOutputs.length,
                        runCount: reports.length,
                        firstExportedAt,
                        lastExportedAt,
                        latestOutputId: bucketOutputs.length > 0 ? normalizeHarnessOutputId(bucketOutputs[bucketOutputs.length - 1].outputId, '') : '',
                        latestRunId: reports.length > 0 ? normalizeRunReportId(reports[reports.length - 1].runId, '') : '',
                        baseline: cloneSerializable(baseline, null),
                        trendSeries: cloneSerializable(trendSeries, null),
                        outputs: bucketOutputs.map((output) => ({
                            outputId: normalizeHarnessOutputId(output.outputId, ''),
                            runId: normalizeRunReportId(output.runReport && output.runReport.runId, ''),
                            label: clampString(output.label, ''),
                            exportedAt: toNonNegativeNumber(output.exportedAt, 0),
                            violationCount: toNonNegativeNumber(output.runReport && output.runReport.summary && output.runReport.summary.violationCount, 0),
                            windowMs: toNonNegativeNumber(output.runReport && output.runReport.summary && output.runReport.summary.windowMs, 0),
                            pressureLevel: clampString(
                                output.runReport && output.runReport.summary && output.runReport.summary.pressureLevel,
                                clampString(output.runReport && output.runReport.snapshot && output.runReport.snapshot.pressureLevel, 'normal')
                            )
                        }))
                    };
                });

            return Object.freeze({
                kind: 'rmt_performance_batch_series',
                runtimeKind,
                createdAt: now(),
                seriesId: clampString(options.seriesId, `batch-series:${Math.floor(now())}`),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {}),
                summary: {
                    batchCount: batches.length,
                    outputCount: outputs.length,
                    runCount: extractRunReportsFromHarnessOutputs(outputs).length
                },
                batches
            });
        }

        function createNightlyTrendlines(outputInputs = [], options = {}) {
            const outputs = normalizeHarnessOutputs(
                Array.isArray(outputInputs) && outputInputs.length > 0
                    ? outputInputs
                    : listPersistedHarnessOutputs(options.limit)
            );
            const nightlyResolver = typeof options.resolveNightlyKey === 'function'
                ? options.resolveNightlyKey
                : null;
            const nightlyBuckets = Object.create(null);

            outputs.forEach((output) => {
                const runReport = output.runReport && typeof output.runReport === 'object'
                    ? output.runReport
                    : null;
                const outputMetadata = isObjectLike(output.metadata) ? output.metadata : {};
                const runMetadata = runReport && isObjectLike(runReport.metadata) ? runReport.metadata : {};
                const exportedAt = toNonNegativeNumber(
                    output.exportedAt,
                    toNonNegativeNumber(runReport && runReport.exportedAt, now())
                );
                const nightlyKey = normalizeNightlyKey(
                    nightlyResolver
                        ? nightlyResolver(cloneSerializable(output, {}), cloneSerializable(runReport, null), {
                            runtimeKind,
                            formatNightlyBucketFromTimestamp
                        })
                        : (
                            options.nightlyKey
                            || outputMetadata.nightlyKey
                            || runMetadata.nightlyKey
                            || formatNightlyBucketFromTimestamp(exportedAt)
                        ),
                    formatNightlyBucketFromTimestamp(exportedAt)
                );
                if (!nightlyBuckets[nightlyKey]) {
                    nightlyBuckets[nightlyKey] = {
                        nightlyKey,
                        nightlyLabel: clampString(
                            outputMetadata.nightlyLabel
                            || runMetadata.nightlyLabel
                            || nightlyKey,
                            nightlyKey
                        ),
                        outputs: []
                    };
                }
                nightlyBuckets[nightlyKey].outputs.push(output);
            });

            const nightlyEntries = Object.keys(nightlyBuckets)
                .sort((left, right) => left.localeCompare(right))
                .map((nightlyKey) => {
                    const bucket = nightlyBuckets[nightlyKey];
                    const bucketOutputs = normalizeHarnessOutputs(bucket.outputs)
                        .slice()
                        .sort((left, right) => {
                            const timeDelta = toNonNegativeNumber(left.exportedAt, 0) - toNonNegativeNumber(right.exportedAt, 0);
                            if (timeDelta !== 0) return timeDelta;
                            return normalizeHarnessOutputId(left.outputId, 'left').localeCompare(normalizeHarnessOutputId(right.outputId, 'right'));
                        });
                    const reports = extractRunReportsFromHarnessOutputs(bucketOutputs);
                    const baseline = reports.length > 0
                        ? createRunBaseline(reports, {
                            baselineId: `${clampString(options.baselineIdPrefix, 'nightly-baseline')}:${nightlyKey}`,
                            label: bucket.nightlyLabel,
                            metadata: cloneSerializable(options.metadata, {})
                        })
                        : null;
                    const trendSeries = reports.length > 0
                        ? createTrendSeries(reports, {
                            seriesId: `${clampString(options.seriesIdPrefix, 'nightly-series')}:${nightlyKey}`,
                            label: bucket.nightlyLabel,
                            metadata: cloneSerializable(options.metadata, {})
                        })
                        : null;
                    return {
                        nightlyKey,
                        nightlyLabel: bucket.nightlyLabel,
                        outputCount: bucketOutputs.length,
                        runCount: reports.length,
                        firstExportedAt: bucketOutputs.length > 0 ? toNonNegativeNumber(bucketOutputs[0].exportedAt, 0) : 0,
                        lastExportedAt: bucketOutputs.length > 0 ? toNonNegativeNumber(bucketOutputs[bucketOutputs.length - 1].exportedAt, 0) : 0,
                        latestOutputId: bucketOutputs.length > 0 ? normalizeHarnessOutputId(bucketOutputs[bucketOutputs.length - 1].outputId, '') : '',
                        latestRunId: reports.length > 0 ? normalizeRunReportId(reports[reports.length - 1].runId, '') : '',
                        baseline: cloneSerializable(baseline, null),
                        trendSeries: cloneSerializable(trendSeries, null),
                        outputs: bucketOutputs.map((output) => ({
                            outputId: normalizeHarnessOutputId(output.outputId, ''),
                            runId: normalizeRunReportId(output.runReport && output.runReport.runId, ''),
                            label: clampString(output.label, ''),
                            exportedAt: toNonNegativeNumber(output.exportedAt, 0),
                            batchId: normalizeBatchId(output.batchId, ''),
                            batchLabel: normalizeBatchLabel(output.batchLabel, '')
                        })),
                        latestRunReport: reports.length > 0 ? reports[reports.length - 1] : null
                    };
                });

            const nights = nightlyEntries.map((entry, index) => {
                const previousEntry = index > 0 ? nightlyEntries[index - 1] : null;
                const comparisonToPreviousNight = previousEntry
                    && previousEntry.latestRunReport
                    && entry.latestRunReport
                    ? compareRunReports(previousEntry.latestRunReport, entry.latestRunReport, {
                        label: `${previousEntry.nightlyLabel} -> ${entry.nightlyLabel}`
                    })
                    : null;
                return {
                    nightlyKey: entry.nightlyKey,
                    nightlyLabel: entry.nightlyLabel,
                    outputCount: entry.outputCount,
                    runCount: entry.runCount,
                    firstExportedAt: entry.firstExportedAt,
                    lastExportedAt: entry.lastExportedAt,
                    latestOutputId: entry.latestOutputId,
                    latestRunId: entry.latestRunId,
                    baseline: cloneSerializable(entry.baseline, null),
                    trendSeries: cloneSerializable(entry.trendSeries, null),
                    comparisonToPreviousNight: cloneSerializable(comparisonToPreviousNight, null),
                    outputs: cloneSerializable(entry.outputs, [])
                };
            });

            return Object.freeze({
                kind: 'rmt_performance_nightly_trendlines',
                runtimeKind,
                createdAt: now(),
                trendlineId: clampString(options.trendlineId, `nightly-trendlines:${Math.floor(now())}`),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {}),
                summary: {
                    nightCount: nights.length,
                    outputCount: outputs.length,
                    runCount: extractRunReportsFromHarnessOutputs(outputs).length
                },
                nights
            });
        }

        function createFileArtifact(sourceOrOptions = {}, maybeOptions = {}) {
            const options = isObjectLike(sourceOrOptions)
                && !sourceOrOptions.kind
                && !sourceOrOptions.runReport
                && !sourceOrOptions.outputs
                && !sourceOrOptions.batches
                ? sourceOrOptions
                : maybeOptions;
            const source = isObjectLike(sourceOrOptions)
                && (
                    sourceOrOptions.kind
                    || sourceOrOptions.runReport
                    || sourceOrOptions.outputs
                    || sourceOrOptions.batches
                )
                ? sourceOrOptions
                : (options.source && typeof options.source === 'object'
                    ? options.source
                    : exportPersistedHistory(options));
            const payload = cloneSerializable(source, null);
            const kindToArtifactType = {
                rmt_performance_run_report: 'run_report',
                rmt_performance_run_comparison: 'run_comparison',
                rmt_performance_baseline: 'baseline',
                rmt_performance_trend_series: 'trend_series',
                rmt_performance_baseline_comparison: 'baseline_comparison',
                rmt_performance_harness_output: 'harness_output',
                rmt_performance_harness_history: 'harness_history',
                rmt_performance_batch_series: 'batch_series'
            };
            const artifactType = clampString(
                options.artifactType,
                kindToArtifactType[clampString(source && source.kind, '')] || 'generic'
            );
            const artifactId = clampString(options.artifactId, `${artifactType}:${Math.floor(now())}`);
            const fileName = clampString(options.fileName, `${artifactType}-${artifactId.replace(/[^a-z0-9._-]+/gi, '_')}.json`);
            const text = JSON.stringify(payload, null, 2);
            return Object.freeze({
                kind: 'rmt_performance_file_artifact',
                runtimeKind,
                createdAt: now(),
                artifactId,
                label: clampString(options.label, ''),
                artifactType,
                format: 'json',
                fileName,
                contentType: clampString(options.contentType, 'application/json'),
                metadata: cloneSerializable(options.metadata, {}),
                payload,
                text
            });
        }

        function createCiSummary(sourceOrOptions = {}, maybeOptions = {}) {
            const options = isObjectLike(sourceOrOptions)
                && !sourceOrOptions.kind
                && !sourceOrOptions.runReport
                && !sourceOrOptions.outputs
                && !sourceOrOptions.batches
                ? sourceOrOptions
                : maybeOptions;
            const source = isObjectLike(sourceOrOptions)
                && (
                    sourceOrOptions.kind
                    || sourceOrOptions.runReport
                    || sourceOrOptions.outputs
                    || sourceOrOptions.batches
                )
                ? sourceOrOptions
                : (options.source && typeof options.source === 'object'
                    ? options.source
                    : exportPersistedHistory(options));
            const kind = clampString(source && source.kind, '');
            const title = clampString(options.title, clampString(options.label, 'Rmt Performance Summary'));
            const lines = [`# ${title}`, ''];
            if (kind === 'rmt_performance_run_report') {
                const summary = source.summary && typeof source.summary === 'object' ? source.summary : {};
                lines.push(`- Run: \`${normalizeRunReportId(source.runId, 'run')}\``);
                lines.push(`- Samples: ${toNonNegativeNumber(summary.sampleCount, 0)}`);
                lines.push(`- Violations: ${toNonNegativeNumber(summary.violationCount, 0)}`);
                lines.push(`- Pressure: ${clampString(summary.pressureLevel, 'normal')}`);
            } else if (kind === 'rmt_performance_harness_history') {
                const summary = source.summary && typeof source.summary === 'object' ? source.summary : {};
                lines.push(`- Outputs: ${toNonNegativeNumber(summary.outputCount, 0)}`);
                lines.push(`- Runs: ${toNonNegativeNumber(summary.runCount, 0)}`);
                lines.push(`- Backend: ${clampString(summary.storageBackend, 'memory')}`);
                lines.push('');
                lines.push('## Latest Output');
                lines.push(`- Output ID: \`${clampString(summary.latestOutputId, '')}\``);
            } else if (kind === 'rmt_performance_batch_series') {
                const summary = source.summary && typeof source.summary === 'object' ? source.summary : {};
                const batches = Array.isArray(source.batches) ? source.batches : [];
                lines.push(`- Batches: ${toNonNegativeNumber(summary.batchCount, 0)}`);
                lines.push(`- Outputs: ${toNonNegativeNumber(summary.outputCount, 0)}`);
                lines.push(`- Runs: ${toNonNegativeNumber(summary.runCount, 0)}`);
                lines.push('');
                lines.push('| Batch | Outputs | Runs | Latest Run |');
                lines.push('| --- | ---: | ---: | --- |');
                batches.forEach((batch) => {
                    lines.push(`| ${clampString(batch.batchLabel || batch.batchId, '')} | ${toNonNegativeNumber(batch.outputCount, 0)} | ${toNonNegativeNumber(batch.runCount, 0)} | ${clampString(batch.latestRunId, '')} |`);
                });
            } else {
                lines.push(`- Kind: \`${kind || 'unknown'}\``);
            }
            return Object.freeze({
                kind: 'rmt_performance_ci_summary',
                runtimeKind,
                createdAt: now(),
                summaryId: clampString(options.summaryId, `summary:${Math.floor(now())}`),
                title,
                metadata: cloneSerializable(options.metadata, {}),
                text: lines.join('\n')
            });
        }

        function writeArtifact(artifactOrSource = {}, options = {}) {
            const artifact = artifactOrSource && artifactOrSource.kind === 'rmt_performance_file_artifact'
                ? cloneSerializable(artifactOrSource, {})
                : createFileArtifact(artifactOrSource, options);
            const writer = resolveArtifactWriter(options);
            const relativePath = normalizeArtifactPath(
                clampString(options.path, '')
                    || clampString(options.relativePath, '')
                    || (clampString(options.directory, '') ? `${clampString(options.directory, '').replace(/\/+$/g, '')}/${clampString(options.fileName, artifact.fileName)}` : clampString(options.fileName, artifact.fileName)),
                clampString(options.fileName, artifact.fileName)
            );
            if (!writer) {
                return Object.freeze({
                    kind: 'rmt_performance_artifact_write_result',
                    runtimeKind,
                    wroteAt: now(),
                    ok: false,
                    deferred: true,
                    targetKind: 'none',
                    relativePath,
                    fileName: artifact.fileName,
                    artifactId: artifact.artifactId,
                    artifactType: artifact.artifactType,
                    bytes: artifact.text.length
                });
            }
            let backendResult = null;
            if (typeof writer.writeArtifact === 'function') {
                backendResult = writer.writeArtifact(artifact, {
                    relativePath,
                    fileName: artifact.fileName,
                    contentType: artifact.contentType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof writer.writeText === 'function') {
                backendResult = writer.writeText(relativePath, artifact.text, {
                    contentType: artifact.contentType,
                    artifactType: artifact.artifactType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof writer.writeJson === 'function') {
                backendResult = writer.writeJson(relativePath, artifact.payload, {
                    contentType: artifact.contentType,
                    artifactType: artifact.artifactType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            }
            const ok = backendResult === true
                || (backendResult && typeof backendResult === 'object' && backendResult.ok !== false);
            return Object.freeze({
                kind: 'rmt_performance_artifact_write_result',
                runtimeKind,
                wroteAt: now(),
                ok,
                deferred: false,
                targetKind: resolveArtifactTargetKind(writer),
                relativePath,
                fileName: artifact.fileName,
                artifactId: artifact.artifactId,
                artifactType: artifact.artifactType,
                bytes: artifact.text.length,
                backendResult: cloneSerializable(backendResult, null)
            });
        }

        function writeCiSummary(summaryOrSource = {}, options = {}) {
            const summary = summaryOrSource && summaryOrSource.kind === 'rmt_performance_ci_summary'
                ? cloneSerializable(summaryOrSource, {})
                : createCiSummary(summaryOrSource, options);
            const writer = resolveArtifactWriter(options);
            const relativePath = normalizeArtifactPath(
                clampString(options.path, '')
                    || clampString(options.relativePath, '')
                    || clampString(options.fileName, 'performance-summary.md'),
                'performance-summary.md'
            );
            if (!writer) {
                return Object.freeze({
                    kind: 'rmt_performance_ci_summary_write_result',
                    runtimeKind,
                    wroteAt: now(),
                    ok: false,
                    deferred: true,
                    targetKind: 'none',
                    relativePath,
                    summaryId: summary.summaryId
                });
            }
            let backendResult = null;
            if (typeof writer.appendText === 'function') {
                backendResult = writer.appendText(relativePath, `${summary.text}\n`, {
                    contentType: 'text/markdown'
                });
            } else if (typeof writer.writeText === 'function') {
                backendResult = writer.writeText(relativePath, summary.text, {
                    contentType: 'text/markdown'
                });
            } else if (typeof writer.writeArtifact === 'function') {
                backendResult = writer.writeArtifact({
                    kind: 'rmt_performance_ci_summary_artifact',
                    fileName: relativePath,
                    contentType: 'text/markdown',
                    text: summary.text,
                    payload: {
                        summaryId: summary.summaryId,
                        title: summary.title
                    }
                }, {
                    relativePath,
                    fileName: relativePath,
                    contentType: 'text/markdown'
                });
            }
            const ok = backendResult === true
                || (backendResult && typeof backendResult === 'object' && backendResult.ok !== false);
            return Object.freeze({
                kind: 'rmt_performance_ci_summary_write_result',
                runtimeKind,
                wroteAt: now(),
                ok,
                deferred: false,
                targetKind: resolveArtifactTargetKind(writer),
                relativePath,
                summaryId: summary.summaryId,
                backendResult: cloneSerializable(backendResult, null)
            });
        }

        function writeBatchArtifacts(seriesOrOutputs = [], options = {}) {
            const batchSeries = seriesOrOutputs && seriesOrOutputs.kind === 'rmt_performance_batch_series'
                ? cloneSerializable(seriesOrOutputs, {})
                : createBatchSeries(seriesOrOutputs, options);
            const writes = [];
            const seriesArtifact = createFileArtifact(batchSeries, {
                artifactType: 'batch_series',
                artifactId: clampString(options.artifactId, ''),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {})
            });
            writes.push(writeArtifact(seriesArtifact, {
                ...options,
                fileName: clampString(options.fileName, seriesArtifact.fileName)
            }));
            const batches = Array.isArray(batchSeries.batches) ? batchSeries.batches : [];
            batches.forEach((batch) => {
                const batchArtifact = createFileArtifact({
                    kind: 'rmt_performance_batch_detail',
                    runtimeKind,
                    createdAt: now(),
                    batchId: clampString(batch.batchId, ''),
                    batchLabel: clampString(batch.batchLabel, ''),
                    baseline: cloneSerializable(batch.baseline, null),
                    trendSeries: cloneSerializable(batch.trendSeries, null),
                    outputs: cloneSerializable(batch.outputs, [])
                }, {
                    artifactType: 'batch_detail',
                    artifactId: `batch-detail:${clampString(batch.batchId, 'batch')}`,
                    label: clampString(batch.batchLabel, '')
                });
                writes.push(writeArtifact(batchArtifact, {
                    ...options,
                    fileName: batchArtifact.fileName
                }));
            });
            return Object.freeze({
                kind: 'rmt_performance_batch_artifact_writes',
                runtimeKind,
                wroteAt: now(),
                batchSeriesId: clampString(batchSeries.seriesId, ''),
                writeCount: writes.length,
                writes
            });
        }

        async function publishArtifactToTarget(artifactOrSource = {}, options = {}) {
            const artifact = artifactOrSource && artifactOrSource.kind === 'rmt_performance_file_artifact'
                ? cloneSerializable(artifactOrSource, {})
                : createFileArtifact(artifactOrSource, options);
            const target = resolveArtifactExportTarget(options);
            const targetPath = normalizeArtifactPath(
                clampString(options.targetPath, '')
                    || clampString(options.path, '')
                    || clampString(options.relativePath, '')
                    || clampString(options.fileName, artifact.fileName),
                clampString(options.fileName, artifact.fileName)
            );
            if (!target) {
                return Object.freeze({
                    kind: 'rmt_performance_external_export_result',
                    runtimeKind,
                    exportedAt: now(),
                    ok: false,
                    deferred: true,
                    targetKind: 'none',
                    targetPath,
                    fileName: artifact.fileName,
                    artifactId: artifact.artifactId,
                    artifactType: artifact.artifactType,
                    bytes: artifact.text.length
                });
            }

            let backendResult = null;
            if (typeof target.publishArtifact === 'function') {
                backendResult = await target.publishArtifact(artifact, {
                    targetPath,
                    fileName: artifact.fileName,
                    contentType: artifact.contentType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof target.uploadArtifact === 'function') {
                backendResult = await target.uploadArtifact(targetPath, artifact.text, {
                    artifactId: artifact.artifactId,
                    artifactType: artifact.artifactType,
                    contentType: artifact.contentType,
                    payload: cloneSerializable(artifact.payload, null),
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof target.postJson === 'function') {
                backendResult = await target.postJson(targetPath, artifact.payload, {
                    artifactId: artifact.artifactId,
                    artifactType: artifact.artifactType,
                    contentType: artifact.contentType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof target.postText === 'function') {
                backendResult = await target.postText(targetPath, artifact.text, {
                    artifactId: artifact.artifactId,
                    artifactType: artifact.artifactType,
                    contentType: artifact.contentType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof target.writeArtifact === 'function') {
                backendResult = await target.writeArtifact(artifact, {
                    relativePath: targetPath,
                    fileName: artifact.fileName,
                    contentType: artifact.contentType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof target.writeText === 'function') {
                backendResult = await target.writeText(targetPath, artifact.text, {
                    contentType: artifact.contentType,
                    artifactType: artifact.artifactType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            } else if (typeof target.writeJson === 'function') {
                backendResult = await target.writeJson(targetPath, artifact.payload, {
                    contentType: artifact.contentType,
                    artifactType: artifact.artifactType,
                    metadata: cloneSerializable(options.metadata, {})
                });
            }
            const ok = backendResult === true
                || (backendResult && typeof backendResult === 'object' && backendResult.ok !== false);
            return Object.freeze({
                kind: 'rmt_performance_external_export_result',
                runtimeKind,
                exportedAt: now(),
                ok,
                deferred: false,
                targetKind: resolveArtifactExportTargetKind(target),
                targetPath,
                fileName: artifact.fileName,
                artifactId: artifact.artifactId,
                artifactType: artifact.artifactType,
                bytes: artifact.text.length,
                backendResult: cloneSerializable(backendResult, null)
            });
        }

        async function publishBatchToTarget(seriesOrOutputs = [], options = {}) {
            const batchSeries = seriesOrOutputs && seriesOrOutputs.kind === 'rmt_performance_batch_series'
                ? cloneSerializable(seriesOrOutputs, {})
                : createBatchSeries(seriesOrOutputs, options);
            const exports = [];
            const seriesTargetPath = clampString(options.targetPath, '');
            const targetDirectory = clampString(
                options.targetDirectory || options.directory,
                seriesTargetPath && seriesTargetPath.includes('/')
                    ? seriesTargetPath.replace(/\/[^/]*$/g, '')
                    : ''
            );
            const seriesArtifact = createFileArtifact(batchSeries, {
                artifactType: 'batch_series',
                artifactId: clampString(options.artifactId, ''),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {})
            });
            exports.push(await publishArtifactToTarget(seriesArtifact, {
                ...options,
                targetPath: seriesTargetPath,
                fileName: clampString(options.fileName, seriesArtifact.fileName)
            }));
            const batches = Array.isArray(batchSeries.batches) ? batchSeries.batches : [];
            for (let index = 0; index < batches.length; index += 1) {
                const batch = batches[index];
                const batchArtifact = createFileArtifact({
                    kind: 'rmt_performance_batch_detail',
                    runtimeKind,
                    createdAt: now(),
                    batchId: clampString(batch.batchId, ''),
                    batchLabel: clampString(batch.batchLabel, ''),
                    baseline: cloneSerializable(batch.baseline, null),
                    trendSeries: cloneSerializable(batch.trendSeries, null),
                    outputs: cloneSerializable(batch.outputs, [])
                }, {
                    artifactType: 'batch_detail',
                    artifactId: `batch-detail:${clampString(batch.batchId, 'batch')}`,
                    label: clampString(batch.batchLabel, '')
                });
                exports.push(await publishArtifactToTarget(batchArtifact, {
                    ...options,
                    targetPath: targetDirectory
                        ? `${targetDirectory.replace(/\/+$/g, '')}/${batchArtifact.fileName}`
                        : batchArtifact.fileName,
                    fileName: batchArtifact.fileName
                }));
            }
            return Object.freeze({
                kind: 'rmt_performance_external_batch_export',
                runtimeKind,
                exportedAt: now(),
                batchSeriesId: clampString(batchSeries.seriesId, ''),
                exportCount: exports.length,
                exports
            });
        }

        async function runBatchHarness(runInputs = [], runner, options = {}) {
            if (typeof runner !== 'function') {
                throw new Error('RmtPerformanceRuntime.runBatchHarness(...) benoetigt einen gueltigen Runner.');
            }
            const safeInputs = Array.isArray(runInputs) ? runInputs : [];
            const outputs = [];
            for (let index = 0; index < safeInputs.length; index += 1) {
                const input = isObjectLike(safeInputs[index]) ? safeInputs[index] : {};
                const result = await runner(cloneSerializable(input, {}), index, {
                    runtimeKind,
                    getHistoryStorageStatus,
                    buildPerformanceRunReport,
                    createHarnessOutput,
                    createBatchSeries
                });
                const output = result && result.kind === 'rmt_performance_harness_output'
                    ? cloneSerializable(result, {})
                    : createHarnessOutput({
                        reason: clampString(input.reason, `batch_harness:${index + 1}`),
                        outputId: clampString(input.outputId, ''),
                        label: clampString(input.label, ''),
                        metadata: cloneSerializable(input.metadata, {}),
                        batchId: clampString(input.batchId, ''),
                        batchLabel: clampString(input.batchLabel, ''),
                        runReport: result && result.kind === 'rmt_performance_run_report'
                            ? result
                            : (result && typeof result === 'object' && result.runReport && typeof result.runReport === 'object'
                                ? result.runReport
                                : buildPerformanceRunReport(clampString(input.reason, `batch_harness:${index + 1}`), input))
                    });
                outputs.push(output);
                if (options.persist !== false) {
                    persistHarnessOutput(output);
                }
            }
            const batchSeries = createBatchSeries(outputs, {
                seriesId: clampString(options.seriesId, ''),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {})
            });
            const history = options.persist !== false
                ? exportPersistedHistory({
                    historyId: clampString(options.historyId, ''),
                    label: clampString(options.historyLabel || options.label, ''),
                    metadata: cloneSerializable(options.metadata, {})
                })
                : null;
            const artifactWrites = options.writeArtifacts === true
                ? writeBatchArtifacts(batchSeries, {
                    ...options,
                    directory: clampString(options.artifactDirectory, '') || clampString(options.directory, ''),
                    fileName: clampString(options.artifactFileName, '') || clampString(options.fileName, '')
                })
                : null;
            const summaryWrite = options.writeCiSummary === true
                ? writeCiSummary(batchSeries, {
                    ...options,
                    path: clampString(options.summaryPath, '') || clampString(options.path, ''),
                    fileName: clampString(options.summaryFileName, '') || clampString(options.fileName, 'performance-summary.md')
                })
                : null;
            return Object.freeze({
                kind: 'rmt_performance_batch_harness_run',
                runtimeKind,
                createdAt: now(),
                label: clampString(options.label, ''),
                outputCount: outputs.length,
                persisted: options.persist !== false,
                outputs: outputs.map((output) => cloneSerializable(output, {})),
                batchSeries: cloneSerializable(batchSeries, null),
                history: cloneSerializable(history, null),
                artifactWrites: cloneSerializable(artifactWrites, null),
                summaryWrite: cloneSerializable(summaryWrite, null)
            });
        }

        async function runAutomationHarness(runInputs = [], automationAdapter, options = {}) {
            const adapterObject = automationAdapter && typeof automationAdapter === 'object'
                ? automationAdapter
                : null;
            const scenarioRunner = typeof automationAdapter === 'function'
                ? automationAdapter
                : (
                    adapterObject && (
                        adapterObject.runScenario
                        || adapterObject.runCase
                        || adapterObject.executeScenario
                        || adapterObject.execute
                    )
                );
            if (typeof scenarioRunner !== 'function') {
                throw new Error('RmtPerformanceRuntime.runAutomationHarness(...) benoetigt einen gueltigen Automation-Runner.');
            }

            const automationContext = Object.freeze({
                runtimeKind,
                createBatchSeries,
                createHarnessOutput,
                createNightlyTrendlines,
                exportPersistedHistory,
                buildPerformanceRunReport,
                getHistoryStorageStatus,
                persistHarnessOutput,
                publishArtifactToTarget,
                publishBatchToTarget,
                reportEndpointSample
            });

            if (adapterObject && typeof adapterObject.beforeAll === 'function') {
                await adapterObject.beforeAll(automationContext);
            }

            try {
                const batchRun = await runBatchHarness(runInputs, async (input, index, context) => {
                    const scenarioContext = Object.freeze({
                        ...context,
                        ...automationContext
                    });
                    if (adapterObject && typeof adapterObject.beforeScenario === 'function') {
                        await adapterObject.beforeScenario(cloneSerializable(input, {}), index, scenarioContext);
                    }
                    const result = await scenarioRunner(cloneSerializable(input, {}), index, scenarioContext);
                    if (adapterObject && typeof adapterObject.afterScenario === 'function') {
                        await adapterObject.afterScenario(cloneSerializable(result, null), cloneSerializable(input, {}), index, scenarioContext);
                    }
                    return result;
                }, {
                    ...options,
                    metadata: {
                        ...cloneSerializable(options.metadata, {}),
                        automation: true
                    }
                });
                return Object.freeze({
                    ...cloneSerializable(batchRun, {}),
                    kind: 'rmt_performance_automation_harness_run',
                    automation: true,
                    adapterKind: clampString(
                        options.adapterKind,
                        clampString(adapterObject && adapterObject.kind, typeof automationAdapter === 'function' ? 'function_runner' : 'automation_adapter')
                    )
                });
            } finally {
                if (adapterObject && typeof adapterObject.afterAll === 'function') {
                    await adapterObject.afterAll(automationContext);
                }
            }
        }

        function persistHarnessOutput(outputOrReason = 'harness_export', maybeOptions = {}) {
            const output = outputOrReason && typeof outputOrReason === 'object' && outputOrReason.kind === 'rmt_performance_harness_output'
                ? cloneSerializable(outputOrReason, {})
                : createHarnessOutput(outputOrReason, maybeOptions);
            const nextOutputs = [
                output,
                ...persistedHarnessOutputs.filter((entry) => normalizeHarnessOutputId(entry && entry.outputId, '') !== normalizeHarnessOutputId(output.outputId, ''))
            ];
            const persistedOutputs = persistHarnessOutputs(nextOutputs);
            const storedOutput = persistedOutputs.find((entry) => normalizeHarnessOutputId(entry.outputId, '') === normalizeHarnessOutputId(output.outputId, ''))
                || output;
            return Object.freeze({
                ...cloneSerializable(storedOutput, {}),
                historySummary: {
                    ...(cloneSerializable(storedOutput.historySummary, {})),
                    persistedOutputCount: persistedOutputs.length,
                    persistedRunCount: extractRunReportsFromHarnessOutputs(persistedOutputs).length,
                    storageBackend: getHistoryStorageStatus().backend,
                    storageKey: harnessOutputStorageKey,
                    persistentAvailable: getHistoryStorageStatus().persistentAvailable
                }
            });
        }

        function exportPersistedHistory(options = {}) {
            const outputs = normalizeHarnessOutputs(listPersistedHarnessOutputs(options.limit));
            const reports = extractRunReportsFromHarnessOutputs(outputs);
            const baseline = reports.length > 0
                ? createRunBaseline(reports, {
                    baselineId: clampString(options.baselineId, ''),
                    label: clampString(options.baselineLabel || options.label, ''),
                    metadata: cloneSerializable(options.metadata, {})
                })
                : null;
            const trendSeries = reports.length > 0
                ? createTrendSeries(reports, {
                    seriesId: clampString(options.seriesId, ''),
                    label: clampString(options.seriesLabel || options.label, ''),
                    metadata: cloneSerializable(options.metadata, {})
                })
                : null;
            const storageStatus = getHistoryStorageStatus();
            return Object.freeze({
                kind: 'rmt_performance_harness_history',
                runtimeKind,
                exportedAt: now(),
                historyId: normalizeHarnessHistoryId(options.historyId, ''),
                label: clampString(options.label, ''),
                metadata: cloneSerializable(options.metadata, {}),
                summary: {
                    outputCount: outputs.length,
                    runCount: reports.length,
                    baselineRunCount: baseline && baseline.summary ? toNonNegativeNumber(baseline.summary.runCount, 0) : 0,
                    trendRunCount: trendSeries && trendSeries.summary ? toNonNegativeNumber(trendSeries.summary.runCount, 0) : 0,
                    latestOutputId: outputs.length > 0 ? normalizeHarnessOutputId(outputs[0].outputId, '') : '',
                    storageBackend: storageStatus.backend,
                    storageKey: storageStatus.storageKey,
                    persistentAvailable: storageStatus.persistentAvailable
                },
                outputs: outputs.map((entry) => cloneSerializable(entry, {})),
                baseline: cloneSerializable(baseline, null),
                trendSeries: cloneSerializable(trendSeries, null)
            });
        }

        function clearPersistedHistory() {
            persistedHarnessOutputs.splice(0, persistedHarnessOutputs.length);
            if (historyStorage && typeof historyStorage.remove === 'function') {
                historyStorage.remove(harnessOutputStorageKey);
            } else if (historyStorage && typeof historyStorage.writeJson === 'function') {
                historyStorage.writeJson(harnessOutputStorageKey, []);
            }
            return true;
        }

        function publishSnapshot(reason) {
            if (!diagnosticsHub || typeof diagnosticsHub.publish !== 'function') return null;
            const snapshot = buildSnapshot(reason);
            diagnosticsHub.publish(SNAPSHOT_CHANNEL, snapshot, {
                source: 'rmt-performance-runtime',
                runtimeKind
            });
            return snapshot;
        }

        function recordEndpointEvent(plan, sample = {}) {
            const endpointName = normalizeEndpointName(
                sample.endpointName
                || (plan && plan.endpointName)
                || 'visible_commit',
                'visible_commit'
            );
            const entry = {
                at: now(),
                endpointName,
                endpointGroup: clampString(
                    sample.endpointGroup
                    || (plan && plan.endpointGroup)
                    || getBaseEndpointProfile(endpointName).endpointGroup,
                    'visible_commit'
                ),
                runtimeKind,
                rootId: clampString(sample.rootId || (plan && plan.rootId), ''),
                lane: clampString(sample.lane || (plan && plan.lane), 'visible_commit'),
                durationMs: toNonNegativeNumber(sample.durationMs, 0),
                waitMs: toNonNegativeNumber(sample.waitMs, 0),
                scheduled: sample.scheduled === true,
                async: sample.async === true,
                status: clampString(sample.status, 'ok'),
                renderPackageId: clampString(sample.renderPackageId || (plan && plan.renderPackageId), ''),
                metadata: cloneSerializable(sample.metadata || (plan && plan.metadata), {})
            };
            const budgetEvaluation = evaluateBudgetSample(endpointName, entry, {
                budgetId: sample.budgetId || (plan && plan.budgetId),
                budgetClass: sample.budgetClass || (plan && plan.budgetClass),
                measurementPhase: sample.measurementPhase,
                metadata: entry.metadata
            });
            entry.budgetId = budgetEvaluation.budgetId;
            entry.totalMs = budgetEvaluation.totalMs;
            entry.budgetStatus = budgetEvaluation.status;
            entry.budgetViolations = budgetEvaluation.violations.slice();
            entry.budgetThresholds = cloneSerializable(budgetEvaluation.thresholds, {});
            entry.measurementPhase = budgetEvaluation.measurementPhase;

            const stats = ensureEndpointStats(endpointName);
            stats.endpointGroup = entry.endpointGroup;
            stats.totalCount += 1;
            if (entry.scheduled) stats.scheduledCount += 1;
            if (entry.async) stats.asyncCount += 1;
            else stats.syncCount += 1;
            if (entry.status !== 'ok') stats.errorCount += 1;
            stats.totalDurationMs += entry.durationMs;
            stats.totalWaitMs += entry.waitMs;
            stats.maxDurationMs = Math.max(stats.maxDurationMs, entry.durationMs);
            stats.maxWaitMs = Math.max(stats.maxWaitMs, entry.waitMs);
            stats.lastAt = entry.at;
            stats.lastDurationMs = entry.durationMs;
            stats.lastWaitMs = entry.waitMs;
            stats.lastStatus = entry.status;
            if (entry.budgetStatus === 'budget_exceeded') stats.budgetViolationCount += 1;
            stats.lastBudgetStatus = entry.budgetStatus;
            stats.lastMeasurementPhase = entry.measurementPhase;
            stats.measurementPhaseCounts[entry.measurementPhase] = (stats.measurementPhaseCounts[entry.measurementPhase] || 0) + 1;
            stats.lastRenderPackageId = entry.renderPackageId;
            stats.lastRootId = entry.rootId;

            endpointHistory.push(entry);
            if (endpointHistory.length > HISTORY_LIMIT) {
                endpointHistory.splice(0, endpointHistory.length - HISTORY_LIMIT);
            }

            if (rmt && typeof rmt.reportPerformanceSample === 'function') {
                rmt.reportPerformanceSample({
                    source: 'rmt-performance-runtime',
                    sampleType: entry.scheduled ? 'scheduled_endpoint' : 'endpoint',
                    endpointName: entry.endpointName,
                    endpointGroup: entry.endpointGroup,
                    runtimeKind,
                    rootId: entry.rootId,
                    lane: entry.lane,
                    durationMs: entry.durationMs,
                    waitMs: entry.waitMs,
                    droppedFrameCount: entry.durationMs > 16.7
                        ? Math.max(0, Math.floor(entry.durationMs / 16.7) - 1)
                        : 0,
                    longTask: entry.durationMs >= 50,
                    renderPackageId: entry.renderPackageId
                });
            }

            if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
                diagnosticsHub.publish(ENDPOINT_EVENT_CHANNEL, entry, {
                    source: 'rmt-performance-runtime',
                    runtimeKind
                });
                diagnosticsHub.publish(BUDGET_EVALUATION_CHANNEL, {
                    ...budgetEvaluation,
                    at: entry.at,
                    runtimeKind,
                    lane: entry.lane,
                    measurementPhase: entry.measurementPhase,
                    scheduled: entry.scheduled,
                    async: entry.async,
                    status: entry.status
                }, {
                    source: 'rmt-performance-runtime',
                    runtimeKind
                });
                publishSnapshot(entry.status === 'ok' ? 'endpoint_recorded' : 'endpoint_error');
            }

            return entry;
        }

        function resolveEndpointPlan(endpointName, options = {}) {
            const baseProfile = getBaseEndpointProfile(endpointName);
            const endpointPlan = isObjectLike(options.endpointPlan) ? options.endpointPlan : {};
            const requestedKind = clampString(
                options.requestedKind || endpointPlan.requestedKind || baseProfile.requestedKind,
                'deferred'
            ) === 'after_paint'
                ? 'after_paint'
                : 'deferred';
            const fallbackExecutionStrategy = requestedKind === 'after_paint'
                ? 'after_paint'
                : ((options.preferIdle !== undefined ? !!options.preferIdle : (endpointPlan.preferIdle !== undefined ? !!endpointPlan.preferIdle : !!baseProfile.preferIdle))
                    ? 'idle'
                    : 'timeout');
            const diagnosticsPolicy = schedulerDiagnostics && typeof schedulerDiagnostics.resolveSchedulingPolicy === 'function'
                ? schedulerDiagnostics.resolveSchedulingPolicy({
                    requestedKind,
                    kind: requestedKind,
                    lane: options.lane || endpointPlan.lane || baseProfile.lane,
                    rootId: options.rootId || endpointPlan.rootId || '',
                    isVisible: Object.prototype.hasOwnProperty.call(options, 'isVisible')
                        ? !!options.isVisible
                        : (Object.prototype.hasOwnProperty.call(endpointPlan, 'isVisible')
                            ? !!endpointPlan.isVisible
                            : baseProfile.isVisible !== false),
                    userBlocking: options.userBlocking === true || endpointPlan.userBlocking === true || baseProfile.userBlocking === true,
                    delay: options.delay,
                    timeout: options.timeout,
                    preferIdle: Object.prototype.hasOwnProperty.call(options, 'preferIdle')
                        ? !!options.preferIdle
                        : (Object.prototype.hasOwnProperty.call(endpointPlan, 'preferIdle')
                            ? !!endpointPlan.preferIdle
                            : !!baseProfile.preferIdle),
                    priority: Number.isFinite(options.priority) ? options.priority : endpointPlan.priority,
                    budgetClass: options.budgetClass || endpointPlan.budgetClass || baseProfile.budgetClass,
                    coalesceKey: options.coalesceKey || endpointPlan.coalesceKey || baseProfile.coalesceKey,
                    deadlineMs: Number.isFinite(options.deadlineMs) ? options.deadlineMs : endpointPlan.deadlineMs
                })
                : null;

            return Object.freeze({
                endpointName: normalizeEndpointName(baseProfile.endpointName, 'visible_commit'),
                endpointGroup: clampString(
                    options.endpointGroup || endpointPlan.endpointGroup || baseProfile.endpointGroup,
                    'visible_commit'
                ),
                requestedKind,
                executionMode: clampString(
                    options.executionMode || endpointPlan.executionMode || baseProfile.executionMode,
                    'scheduled'
                ),
                executionStrategy: clampString(
                    diagnosticsPolicy && diagnosticsPolicy.executionStrategy
                        ? diagnosticsPolicy.executionStrategy
                        : (endpointPlan.executionStrategy || fallbackExecutionStrategy),
                    fallbackExecutionStrategy
                ),
                scope: clampString(options.scope || endpointPlan.scope || baseProfile.endpointName, baseProfile.endpointName),
                rootId: clampString(options.rootId || endpointPlan.rootId, ''),
                renderPackageId: clampString(options.renderPackageId || endpointPlan.renderPackageId, ''),
                lane: clampString(
                    diagnosticsPolicy && diagnosticsPolicy.lane
                        ? diagnosticsPolicy.lane
                        : (options.lane || endpointPlan.lane || baseProfile.lane),
                    baseProfile.lane
                ),
                priority: Number.isFinite(options.priority)
                    ? options.priority
                    : (Number.isFinite(endpointPlan.priority)
                        ? endpointPlan.priority
                        : (diagnosticsPolicy && Number.isFinite(diagnosticsPolicy.priority)
                            ? diagnosticsPolicy.priority
                            : baseProfile.priority)),
                budgetClass: clampString(
                    options.budgetClass
                    || endpointPlan.budgetClass
                    || (diagnosticsPolicy && diagnosticsPolicy.budgetClass)
                    || baseProfile.budgetClass,
                    baseProfile.budgetClass
                ),
                delayMs: Number.isFinite(options.delay)
                    ? Math.max(options.delay, 0)
                    : (Number.isFinite(endpointPlan.delayMs)
                        ? Math.max(endpointPlan.delayMs, 0)
                        : (diagnosticsPolicy && Number.isFinite(diagnosticsPolicy.delayMs)
                            ? Math.max(diagnosticsPolicy.delayMs, 0)
                            : 0)),
                timeoutMs: Number.isFinite(options.timeout)
                    ? Math.max(options.timeout, 0)
                    : (Number.isFinite(endpointPlan.timeoutMs)
                        ? Math.max(endpointPlan.timeoutMs, 0)
                        : (diagnosticsPolicy && Number.isFinite(diagnosticsPolicy.timeoutMs)
                            ? Math.max(diagnosticsPolicy.timeoutMs, 0)
                            : 220)),
                preferIdle: Object.prototype.hasOwnProperty.call(options, 'preferIdle')
                    ? !!options.preferIdle
                    : (Object.prototype.hasOwnProperty.call(endpointPlan, 'preferIdle')
                        ? !!endpointPlan.preferIdle
                        : !!baseProfile.preferIdle),
                isVisible: Object.prototype.hasOwnProperty.call(options, 'isVisible')
                    ? !!options.isVisible
                    : (Object.prototype.hasOwnProperty.call(endpointPlan, 'isVisible')
                        ? !!endpointPlan.isVisible
                        : baseProfile.isVisible !== false),
                userBlocking: options.userBlocking === true || endpointPlan.userBlocking === true || baseProfile.userBlocking === true,
                pressureLevel: clampString(
                    maxPressureLevel(
                        diagnosticsPolicy && diagnosticsPolicy.pressureLevel
                            ? diagnosticsPolicy.pressureLevel
                            : (schedulerDiagnostics && schedulerDiagnostics.pressureLevel),
                        getBrowserPressureLevel()
                    ),
                    'normal'
                ),
                coalesceKey: clampString(options.coalesceKey || endpointPlan.coalesceKey || baseProfile.coalesceKey, ''),
                deadlineMs: Number.isFinite(options.deadlineMs)
                    ? Math.max(options.deadlineMs, 0)
                    : (Number.isFinite(endpointPlan.deadlineMs)
                        ? Math.max(endpointPlan.deadlineMs, 0)
                        : (diagnosticsPolicy && Number.isFinite(diagnosticsPolicy.deadlineMs)
                            ? Math.max(diagnosticsPolicy.deadlineMs, 0)
                            : 0)),
                metadata: {
                    ...cloneSerializable(baseProfile.metadata, {}),
                    ...cloneSerializable(endpointPlan.metadata, {}),
                    ...cloneSerializable(options.metadata, {})
                }
            });
        }

        function runEndpoint(endpointName, callback, options = {}) {
            const endpointPlan = resolveEndpointPlan(endpointName, options);
            if (typeof callback !== 'function') {
                throw new Error(`RmtPerformanceRuntime.runEndpoint(${endpointPlan.endpointName}) benoetigt einen gueltigen Callback.`);
            }
            const queuedAt = Number.isFinite(options.queuedAt) ? options.queuedAt : null;
            const startedAt = now();
            const waitMs = Number.isFinite(options.waitMs)
                ? Math.max(options.waitMs, 0)
                : (Number.isFinite(queuedAt) ? Math.max(startedAt - queuedAt, 0) : 0);

            try {
                const result = callback(endpointPlan);
                if (result && typeof result.then === 'function') {
                    return result.then((resolvedValue) => {
                        recordEndpointEvent(endpointPlan, {
                            status: 'ok',
                            async: true,
                            scheduled: options.scheduled === true,
                            durationMs: now() - startedAt,
                            waitMs,
                            rootId: options.rootId || endpointPlan.rootId,
                            renderPackageId: options.renderPackageId || endpointPlan.renderPackageId,
                            metadata: options.metadata || endpointPlan.metadata
                        });
                        return resolvedValue;
                    }).catch((error) => {
                        recordEndpointEvent(endpointPlan, {
                            status: 'error',
                            async: true,
                            scheduled: options.scheduled === true,
                            durationMs: now() - startedAt,
                            waitMs,
                            rootId: options.rootId || endpointPlan.rootId,
                            renderPackageId: options.renderPackageId || endpointPlan.renderPackageId,
                            metadata: {
                                ...(cloneSerializable(options.metadata || endpointPlan.metadata, {})),
                                errorName: clampString(error && error.name, 'Error')
                            }
                        });
                        throw error;
                    });
                }

                recordEndpointEvent(endpointPlan, {
                    status: 'ok',
                    async: false,
                    scheduled: options.scheduled === true,
                    durationMs: now() - startedAt,
                    waitMs,
                    rootId: options.rootId || endpointPlan.rootId,
                    renderPackageId: options.renderPackageId || endpointPlan.renderPackageId,
                    metadata: options.metadata || endpointPlan.metadata
                });
                return result;
            } catch (error) {
                recordEndpointEvent(endpointPlan, {
                    status: 'error',
                    async: false,
                    scheduled: options.scheduled === true,
                    durationMs: now() - startedAt,
                    waitMs,
                    rootId: options.rootId || endpointPlan.rootId,
                    renderPackageId: options.renderPackageId || endpointPlan.renderPackageId,
                    metadata: {
                        ...(cloneSerializable(options.metadata || endpointPlan.metadata, {})),
                        errorName: clampString(error && error.name, 'Error')
                    }
                });
                throw error;
            }
        }

        function scheduleEndpoint(endpointName, scope, callback, options = {}) {
            const safeScope = clampString(scope, normalizeEndpointName(endpointName, 'visible_commit'));
            const endpointPlan = resolveEndpointPlan(endpointName, {
                ...options,
                scope: safeScope
            });
            const queuedAt = now();
            const scheduledCallback = (jobContext = {}) => runEndpoint(endpointPlan.endpointName, () => callback({
                ...jobContext,
                endpointPlan
            }), {
                ...options,
                endpointPlan,
                scope: safeScope,
                scheduled: true,
                queuedAt,
                waitMs: now() - queuedAt,
                rootId: options.rootId || endpointPlan.rootId,
                renderPackageId: options.renderPackageId || endpointPlan.renderPackageId,
                metadata: options.metadata || endpointPlan.metadata
            });

            const scheduleOptions = {
                ...options,
                rootId: options.rootId || endpointPlan.rootId,
                lane: endpointPlan.lane,
                priority: endpointPlan.priority,
                budgetClass: endpointPlan.budgetClass,
                delay: Number.isFinite(options.delay) ? options.delay : endpointPlan.delayMs,
                timeout: Number.isFinite(options.timeout) ? options.timeout : endpointPlan.timeoutMs,
                preferIdle: Object.prototype.hasOwnProperty.call(options, 'preferIdle')
                    ? !!options.preferIdle
                    : endpointPlan.preferIdle,
                coalesceKey: clampString(options.coalesceKey, endpointPlan.coalesceKey),
                deadlineMs: Number.isFinite(options.deadlineMs) ? options.deadlineMs : endpointPlan.deadlineMs,
                isVisible: Object.prototype.hasOwnProperty.call(options, 'isVisible')
                    ? !!options.isVisible
                    : endpointPlan.isVisible,
                userBlocking: options.userBlocking === true || endpointPlan.userBlocking === true
            };

            if (rmt && typeof rmt.afterPaint === 'function' && endpointPlan.requestedKind === 'after_paint') {
                return rmt.afterPaint(safeScope, scheduledCallback, scheduleOptions);
            }
            if (rmt && typeof rmt.deferred === 'function') {
                return rmt.deferred(safeScope, scheduledCallback, scheduleOptions);
            }
            if (rmt && typeof rmt.schedule === 'function') {
                return rmt.schedule(safeScope, scheduledCallback, {
                    ...scheduleOptions,
                    kind: endpointPlan.requestedKind
                });
            }
            return runEndpoint(endpointPlan.endpointName, () => callback({
                token: 0,
                scope: safeScope,
                endpointPlan
            }), {
                ...options,
                endpointPlan,
                scope: safeScope,
                scheduled: true,
                queuedAt,
                rootId: options.rootId || endpointPlan.rootId,
                renderPackageId: options.renderPackageId || endpointPlan.renderPackageId,
                metadata: options.metadata || endpointPlan.metadata
            });
        }

        function listEndpointProfiles() {
            return Object.keys(ENDPOINT_PROFILE_MAP)
                .sort((left, right) => left.localeCompare(right))
                .map((endpointName) => cloneSerializable(getBaseEndpointProfile(endpointName), {}));
        }

        function listBudgetProfiles() {
            return Object.keys(BUDGET_PROFILE_MAP)
                .sort((left, right) => left.localeCompare(right))
                .map((budgetId) => cloneSerializable(BUDGET_PROFILE_MAP[budgetId], {}));
        }

        function listMeasurementPhases() {
            return MEASUREMENT_PHASES.slice();
        }

        function getEndpointProfile(endpointName) {
            return cloneSerializable(getBaseEndpointProfile(endpointName), {});
        }

        function resolveBudgetProfile(endpointName, options = {}) {
            return cloneSerializable(getBaseBudgetProfile(endpointName, options), {});
        }

        function evaluateBudget(endpointName, sample = {}, options = {}) {
            return cloneSerializable(evaluateBudgetSample(endpointName, sample, options), {});
        }

        function evaluateBudgets(reasonOrOptions = 'read', maybeOptions = {}) {
            const reason = typeof reasonOrOptions === 'string'
                ? reasonOrOptions
                : 'read';
            const options = isObjectLike(reasonOrOptions)
                ? reasonOrOptions
                : maybeOptions;
            return cloneSerializable(buildBudgetSnapshot(reason, options), {});
        }

        function reportEndpointSample(endpointName, sample = {}, options = {}) {
            const endpointPlan = resolveEndpointPlan(endpointName, options);
            return recordEndpointEvent(endpointPlan, {
                ...sample,
                rootId: sample.rootId || options.rootId || endpointPlan.rootId,
                renderPackageId: sample.renderPackageId || options.renderPackageId || endpointPlan.renderPackageId,
                metadata: sample.metadata || options.metadata || endpointPlan.metadata
            });
        }

        function reset() {
            Object.keys(endpointStats).forEach((endpointName) => {
                delete endpointStats[endpointName];
            });
            endpointHistory.splice(0, endpointHistory.length);
            browserSignalHistory.splice(0, browserSignalHistory.length);
            browserSignalLastMemory = null;
            browserSignalLastInputPending = null;
            publishSnapshot('reset');
            return true;
        }

        if (deps.collectBrowserSignals !== false) {
            startBrowserSignalCollection({
                reason: 'runtime_init',
                sampleInitial: true,
                probeFrame: deps.probeBrowserFrameOnInit === true
            });
        }

        return Object.freeze({
            runtimeKind,
            endpointEventChannel: ENDPOINT_EVENT_CHANNEL,
            budgetEvaluationChannel: BUDGET_EVALUATION_CHANNEL,
            snapshotChannel: SNAPSHOT_CHANNEL,
            browserSignalChannel: BROWSER_SIGNAL_CHANNEL,
            backpressureProfileChannel: BACKPRESSURE_PROFILE_CHANNEL,
            evaluateBudget,
            evaluateBudgets,
            getEndpointProfile,
            getBudgetProfile: resolveBudgetProfile,
            getBackpressureProfile: buildBackpressureProfile,
            getBrowserSignalSnapshot,
            getRmt: () => rmt,
            getSnapshot: buildSnapshot,
            getDiagnosticsHub: () => diagnosticsHub,
            exportRunReport: buildPerformanceRunReport,
            compareRunReports,
            createRunBaseline,
            createTrendSeries,
            compareRunReportToBaseline,
            createHarnessOutput,
            createBatchSeries,
            createNightlyTrendlines,
            createCiSummary,
            createFileArtifact,
            publishArtifactToTarget,
            publishBatchToTarget,
            writeArtifact,
            writeBatchArtifacts,
            writeCiSummary,
            persistHarnessOutput,
            exportPersistedHistory,
            listPersistedHarnessOutputs,
            clearPersistedHistory,
            getHistoryStorageStatus,
            listBudgetProfiles,
            listEndpointProfiles,
            listMeasurementPhases,
            recordBrowserSignalSample,
            reportEndpointSample,
            resolveBudgetProfile,
            resolveEndpointPlan,
            reset,
            runEndpoint,
            runBatchHarness,
            runAutomationHarness,
            sampleBrowserNativeState,
            scheduleEndpoint,
            startBrowserSignalCollection,
            stopBrowserSignalCollection
        });
    };
})(__XTENDRMT_GLOBAL__);

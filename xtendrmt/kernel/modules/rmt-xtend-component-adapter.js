/* modules/rmt-xtend-component-adapter.js */
(function registerRmtXtendComponentAdapter(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const DOCUMENT_VERSION = '1.0';
    const RUNTIME_REGISTRY_SCHEMA = 'xtend.rmt.runtime-registry.v1';
    const XTEND_COMPONENT_ADAPTER_SCHEMA = 'xtend.rmt.xtend-component-adapter.v1';
    const XTEND_COMPONENT_ADAPTER_ID = 'xtend.component';
    const XTEND_COMPONENT_ADAPTER_DIAGNOSTIC_CODES = Object.freeze([
        'rmt.xtend.component.missing_tag',
        'rmt.xtend.component.target.missing',
        'rmt.xtend.component.manifest.missing',
        'rmt.xtend.component.custom_element.unregistered',
        'rmt.xtend.component.mount.skipped',
        'rmt.xtend.component.hydration.skipped',
        'rmt.xtend.component.fabric_lane.conflict',
        'rmt.xtend.component.fabric_lane.defaulted',
        'rmt.xtend.component.event_router.missing',
        'rmt.xtend.component.event_router.compatibility',
        'rmt.xtend.component.event.failed'
    ]);
    const XTEND_COMPONENT_FABRIC_LANE_INGESTION_SCHEMA = 'xtend.component.fabric-lane-ingestion.v2';
    const XTEND_COMPONENT_FABRIC_LANE_PRECEDENCE = Object.freeze([
        'rmt.schedule-record',
        'rmt.component-metadata',
        'fabric.runtime-override',
        'component.static-contract',
        'scaffold.blueprint-default'
    ]);
    const XTEND_COMPONENT_FABRIC_SCHEDULE_PROFILES = Object.freeze({
        'component.visible.mount': Object.freeze({ lane: 'visible', fiberKind: 'component.mount', endpointNameHint: 'xtendrmt.component.mount', preferIdle: false, budgetClass: 'interactive' }),
        'component.visible.hydrate': Object.freeze({ lane: 'visible', fiberKind: 'component.hydrate', endpointNameHint: 'xtendrmt.component.hydrate', preferIdle: false, budgetClass: 'interactive' }),
        'component.idle.hydrate': Object.freeze({ lane: 'idle', fiberKind: 'component.hydrate', endpointNameHint: 'xtendrmt.component.hydrate', preferIdle: true, budgetClass: 'background' }),
        'component.lazy.hydrate': Object.freeze({ lane: 'idle', fiberKind: 'component.hydrate', endpointNameHint: 'xtendrmt.component.hydrate', preferIdle: true, budgetClass: 'background' }),
        'ui.user-blocking.input': Object.freeze({ lane: 'user-blocking', fiberKind: 'event.handler', endpointNameHint: 'xtendrmt.ui.user-blocking', preferIdle: false, budgetClass: 'critical' }),
        'diagnostics.snapshot': Object.freeze({ lane: 'diagnostics', fiberKind: 'diagnostics.snapshot', endpointNameHint: 'xtendrmt.diagnostics.snapshot', preferIdle: true, budgetClass: 'diagnostics' })
    });
    const XTEND_COMPONENT_FABRIC_DEFAULTS_BY_OPERATION = Object.freeze({
        mountComponent: Object.freeze({ lane: 'visible', scheduleRef: 'component.visible.mount', fiberKind: 'component.mount', endpointNameHint: 'xtendrmt.component.mount', preferIdle: false, budgetClass: 'interactive' }),
        hydrateComponent: Object.freeze({ lane: 'idle', scheduleRef: 'component.idle.hydrate', fiberKind: 'component.hydrate', endpointNameHint: 'xtendrmt.component.hydrate', preferIdle: true, budgetClass: 'background' }),
        registerComponent: Object.freeze({ lane: 'diagnostics', scheduleRef: 'diagnostics.snapshot', fiberKind: 'diagnostics.snapshot', endpointNameHint: 'xtendrmt.diagnostics.snapshot', preferIdle: true, budgetClass: 'diagnostics' })
    });
    const XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA = 'xtend.component.lifecycle-telemetry.v1';
    const XTEND_COMPONENT_LIFECYCLE_OPERATIONS = Object.freeze([
        'mount',
        'hydrate',
        'render',
        'update',
        'event',
        'unmount',
        'dispose',
        'error'
    ]);

    function clampString(value, fallbackValue = '') {
        const safeValue = String(value || '').trim();
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

    function toPlainObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : {};
    }

    function uniqueValues(values = []) {
        return Array.from(new Set(values
            .map((value) => clampString(value, ''))
            .filter(Boolean)));
    }

    function normalizeScheduleReference(scheduleRef) {
        if (typeof scheduleRef === 'string') return clampString(scheduleRef, '');
        const schedule = toPlainObject(scheduleRef);
        return clampString(schedule.ref || schedule.id || schedule.name, '');
    }

    function normalizeTemplateReference(templateRef) {
        if (typeof templateRef === 'string') return clampString(templateRef, '');
        const template = toPlainObject(templateRef);
        const namespace = clampString(template.namespace, '');
        const id = clampString(template.id || template.ref || template.template, '');
        if (!id) return '';
        if (id.includes(':') || !namespace) return id;
        return namespace + ':' + id;
    }

    function createXtendComponentDiagnostic(code, message, operation = 'registerComponent', phase = 'prepare', metadata = {}, level = 'warn') {
        return Object.freeze({
            level: clampString(level, 'warn'),
            code: clampString(code, ''),
            message: clampString(message, ''),
            adapterId: XTEND_COMPONENT_ADAPTER_ID,
            operation: clampString(operation, 'registerComponent'),
            phase: clampString(phase, 'prepare'),
            metadata: cloneSerializable(metadata, {})
        });
    }

    function createXtendComponentResult(options = {}) {
        return Object.freeze({
            ok: options.ok === true,
            status: clampString(options.status, options.ok === true ? 'ok' : 'skipped'),
            adapterId: clampString(options.adapterId, XTEND_COMPONENT_ADAPTER_ID),
            operation: clampString(options.operation, 'registerComponent'),
            phase: clampString(options.phase, 'prepare'),
            handle: options.handle || null,
            diagnostics: Object.freeze((Array.isArray(options.diagnostics) ? options.diagnostics : []).map((entry) => Object.freeze(entry))),
            metadata: cloneSerializable(options.metadata, {})
        });
    }

    function normalizeXtendComponentValueMap(value) {
        if (Array.isArray(value)) {
            const mapped = {};
            value.forEach((entry) => {
                const rawEntry = toPlainObject(entry);
                const key = clampString(rawEntry.name || rawEntry.key || rawEntry.prop || rawEntry.attribute, '');
                if (!key) return;
                if (Object.prototype.hasOwnProperty.call(rawEntry, 'value')) {
                    mapped[key] = rawEntry.value;
                } else if (Object.prototype.hasOwnProperty.call(rawEntry, 'defaultValue')) {
                    mapped[key] = rawEntry.defaultValue;
                } else if (Object.prototype.hasOwnProperty.call(rawEntry, 'ref')) {
                    mapped[key] = rawEntry.ref;
                } else {
                    mapped[key] = '';
                }
            });
            return Object.freeze(mapped);
        }
        return Object.freeze(cloneSerializable(toPlainObject(value), {}));
    }

    function serializeXtendAttributeValue(value) {
        if (value === true) return '';
        if (value === false || value === null || value === undefined) return null;
        if (typeof value === 'object') return JSON.stringify(cloneSerializable(value, {}));
        return String(value);
    }

    function normalizeXtendSerializedAttributes(attributes = {}) {
        const serialized = {};
        Object.entries(normalizeXtendComponentValueMap(attributes)).forEach(([key, value]) => {
            const serializedValue = serializeXtendAttributeValue(value);
            if (serializedValue === null) return;
            serialized[key] = serializedValue;
        });
        return Object.freeze(serialized);
    }

    function normalizeXtendManifestEntry(component, manifest = {}) {
        const safeManifest = toPlainObject(manifest);
        return clampString(
            safeManifest[component.tag]
            || safeManifest[component.id]
            || component.manifestRef
            || component.import
            || component.importUrl
            || component.moduleRef,
            ''
        );
    }

    function normalizeXtendComponentEntry(componentEntry = {}, options = {}) {
        const entry = toPlainObject(componentEntry);
        const record = toPlainObject(entry.record || entry);
        const metadata = toPlainObject(record.metadata);
        const id = clampString(entry.id || record.id, '');
        const tag = clampString(entry.tag || record.tag || record.renderer, '');
        const props = normalizeXtendComponentValueMap(record.props || record.properties);
        const attributes = normalizeXtendComponentValueMap(record.attributes);
        const mappedComponent = {
            id,
            componentId: id,
            kind: clampString(entry.kind || record.kind, 'custom_element'),
            adapter: clampString(entry.adapterId || record.adapter, XTEND_COMPONENT_ADAPTER_ID),
            tag,
            props,
            attributes,
            serializedAttributes: normalizeXtendSerializedAttributes(attributes),
            slots: cloneSerializable(record.slots, {}),
            events: cloneSerializable(record.events, {}),
            hydration: cloneSerializable(record.hydration, {}),
            schedule: normalizeScheduleReference(entry.scheduleRef || record.schedule),
            scheduleRef: normalizeScheduleReference(entry.scheduleRef || record.schedule),
            metadata: cloneSerializable(metadata, {}),
            diagnostics: cloneSerializable(record.diagnostics, []),
            manifestEntry: '',
            targetKind: tag ? 'custom_element' : 'none',
            sourceComponent: cloneSerializable(record, {}),
            registryIndex: typeof entry.index === 'number' ? entry.index : -1
        };
        mappedComponent.manifestEntry = normalizeXtendManifestEntry(mappedComponent, options.manifest || {});
        return Object.freeze({
            ...mappedComponent,
            props: Object.freeze(mappedComponent.props),
            attributes: Object.freeze(mappedComponent.attributes),
            slots: Object.freeze(mappedComponent.slots),
            events: Object.freeze(mappedComponent.events),
            hydration: Object.freeze(mappedComponent.hydration),
            metadata: Object.freeze(mappedComponent.metadata),
            diagnostics: Object.freeze(mappedComponent.diagnostics)
        });
    }

    function resolveXtendComponentRegistry(componentsInput, rmtFormat, options = {}) {
        if (Array.isArray(componentsInput)) {
            return Object.freeze({
                schema: RUNTIME_REGISTRY_SCHEMA,
                status: componentsInput.length > 0 ? 'ready' : 'empty',
                components: Object.freeze(componentsInput),
                componentRegistry: Object.freeze({ byAdapter: {}, byId: {}, byTag: {} }),
                diagnostics: Object.freeze([]),
                sourceDiagnostics: Object.freeze([])
            });
        }
        const rawInput = componentsInput && typeof componentsInput === 'object' ? componentsInput : {};
        if (rawInput.schema === RUNTIME_REGISTRY_SCHEMA || (Array.isArray(rawInput.components) && rawInput.componentRegistry)) {
            return rawInput;
        }
        return rmtFormat.createRuntimeRegistries(rawInput, options);
    }

    function selectXtendComponentEntries(registry, adapterId = XTEND_COMPONENT_ADAPTER_ID) {
        const components = Array.isArray(registry.components) ? registry.components : [];
        const componentIds = registry.componentRegistry
            && registry.componentRegistry.byAdapter
            && Array.isArray(registry.componentRegistry.byAdapter[adapterId])
            ? registry.componentRegistry.byAdapter[adapterId]
            : null;
        if (componentIds) {
            return componentIds
                .map((componentId) => registry.componentRegistry.byId && registry.componentRegistry.byId[componentId])
                .filter(Boolean);
        }
        return components.filter((entry) => clampString(entry.adapterId || (entry.record && entry.record.adapter) || entry.adapter, adapterId) === adapterId);
    }

    function normalizeXtendComponentMapping(componentsInput, rmtFormat, options = {}) {
        const adapterId = clampString(options.adapterId, XTEND_COMPONENT_ADAPTER_ID);
        const registry = resolveXtendComponentRegistry(componentsInput, rmtFormat, options);
        const diagnostics = [];
        const rawInput = componentsInput && typeof componentsInput === 'object' ? componentsInput : {};
        const schedules = Object.freeze((Array.isArray(options.schedules) ? options.schedules : (Array.isArray(registry.schedules) ? registry.schedules : (Array.isArray(rawInput.schedules) ? rawInput.schedules : [])))
            .map((schedule) => Object.freeze(cloneSerializable(schedule, {}))));
        const mappedComponents = Object.freeze(selectXtendComponentEntries(registry, adapterId)
            .map((entry) => normalizeXtendComponentEntry(entry, options)));
        mappedComponents.forEach((component, index) => {
            if (!component.tag) {
                diagnostics.push(createXtendComponentDiagnostic(
                    'rmt.xtend.component.missing_tag',
                    `XTend component "${component.id || index}" has no custom element tag.`,
                    'registerComponent',
                    'prepare',
                    { componentId: component.id, index }
                ));
            }
        });
        return Object.freeze({
            schema: XTEND_COMPONENT_ADAPTER_SCHEMA,
            adapterId,
            status: diagnostics.length > 0 ? 'mapped_with_diagnostics' : 'mapped',
            components: mappedComponents,
            diagnostics: Object.freeze(diagnostics),
            sourceDiagnostics: Object.freeze(cloneSerializable(registry.sourceDiagnostics || registry.diagnostics, [])),
            schedules,
            componentCount: mappedComponents.length,
            scheduleRefs: uniqueValues(mappedComponents.map((component) => component.scheduleRef)),
            modelFields: Object.freeze(['componentId', 'tag', 'props', 'attributes', 'slots', 'events', 'hydration', 'scheduleRef', 'metadata'])
        });
    }

    function resolveXtendMappedComponent(componentRef, options = {}) {
        if (componentRef && typeof componentRef === 'object') {
            if (componentRef.schema === XTEND_COMPONENT_ADAPTER_SCHEMA && Array.isArray(componentRef.components)) {
                return componentRef.components[0] || null;
            }
            if (componentRef.componentId || componentRef.tag || componentRef.record || componentRef.id) {
                return normalizeXtendComponentEntry(componentRef, options);
            }
        }
        const ref = clampString(componentRef, '');
        const mapping = options.mapping || null;
        if (!ref || !mapping || !Array.isArray(mapping.components)) return null;
        return mapping.components.find((component) => component.id === ref || component.tag === ref) || null;
    }

    function getXtendDocumentTarget(target, deps = {}, options = {}) {
        return options.document
            || deps.document
            || (target && target.ownerDocument)
            || (typeof document !== 'undefined' ? document : null);
    }

        function normalizeXtendComponentFabricLane(lane, fallbackLane = 'visible') {
        const safeLane = clampString(lane, fallbackLane);
        if (safeLane === 'a11y') return 'user-blocking';
        if (['user-blocking', 'visible', 'transition', 'idle', 'background', 'diagnostics'].includes(safeLane)) {
            return safeLane;
        }
        return fallbackLane;
    }

    function normalizeXtendComponentFabricSource(source, sourceId, lane, details = {}) {
        const safeLane = clampString(lane, '');
        if (!safeLane) return null;
        return Object.freeze({
            source,
            sourceId: clampString(sourceId, ''),
            lane: normalizeXtendComponentFabricLane(safeLane, 'visible'),
            rawLane: safeLane,
            scheduleRef: clampString(details.scheduleRef, ''),
            fiberKind: clampString(details.fiberKind, ''),
            endpointNameHint: clampString(details.endpointNameHint, ''),
            preferIdle: details.preferIdle === true,
            budgetClass: clampString(details.budgetClass, ''),
            priority: typeof details.priority === 'number' ? details.priority : null,
            deadlineMs: typeof details.deadlineMs === 'number' ? details.deadlineMs : null
        });
    }

    function findXtendComponentSchedule(scheduleRef, options = {}) {
        const schedules = [
            ...(Array.isArray(options.schedules) ? options.schedules : []),
            ...(options.mapping && Array.isArray(options.mapping.schedules) ? options.mapping.schedules : [])
        ];
        const ref = normalizeScheduleReference(scheduleRef);
        if (!ref) return null;
        return schedules.find((schedule) => normalizeScheduleReference(schedule && schedule.id) === ref) || null;
    }

    function collectXtendComponentFabricSources(component, operation, model = {}, options = {}) {
        const metadata = toPlainObject(component && component.metadata);
        const fabricMetadata = toPlainObject(metadata.fabric || metadata.fabricContext);
        const hydration = toPlainObject(component && component.hydration);
        const runtimeOverride = toPlainObject(options.fabric || options.fabricContext);
        const staticContract = toPlainObject(options.componentContract || metadata.componentContract || metadata.contract);
        const staticFabric = toPlainObject(staticContract.fabric || staticContract.lanes);
        const operationDefaults = XTEND_COMPONENT_FABRIC_DEFAULTS_BY_OPERATION[operation] || XTEND_COMPONENT_FABRIC_DEFAULTS_BY_OPERATION.mountComponent;
        const requestedScheduleRef = normalizeScheduleReference(
            runtimeOverride.scheduleRef
            || options.scheduleRef
            || (operation === 'hydrateComponent' ? (hydration.scheduleRef || hydration.schedule) : '')
            || fabricMetadata.scheduleRef
            || (operation === 'hydrateComponent' ? '' : component.scheduleRef)
            || operationDefaults.scheduleRef
        );
        const scheduleRecord = findXtendComponentSchedule(requestedScheduleRef, options);
        const scheduleProfile = scheduleRecord
            ? {
                lane: scheduleRecord.metadata && scheduleRecord.metadata.fabricLane ? scheduleRecord.metadata.fabricLane : scheduleRecord.lane,
                scheduleRef: scheduleRecord.id,
                fiberKind: operationDefaults.fiberKind,
                endpointNameHint: scheduleRecord.endpointName,
                preferIdle: scheduleRecord.preferIdle === true,
                budgetClass: scheduleRecord.budgetClass,
                priority: scheduleRecord.priority,
                deadlineMs: scheduleRecord.deadlineMs
            }
            : XTEND_COMPONENT_FABRIC_SCHEDULE_PROFILES[requestedScheduleRef];
        const sources = [
            normalizeXtendComponentFabricSource('rmt.schedule-record', requestedScheduleRef, scheduleProfile && scheduleProfile.lane, {
                ...scheduleProfile,
                scheduleRef: requestedScheduleRef
            }),
            normalizeXtendComponentFabricSource('rmt.component-metadata', component.id, fabricMetadata.lane || metadata.fabricLane, {
                scheduleRef: fabricMetadata.scheduleRef || requestedScheduleRef,
                fiberKind: fabricMetadata.fiber || fabricMetadata.fiberKind,
                endpointNameHint: fabricMetadata.endpointNameHint
            }),
            normalizeXtendComponentFabricSource('fabric.runtime-override', 'runtime', runtimeOverride.lane || options.fabricLane || options.lane, {
                scheduleRef: runtimeOverride.scheduleRef || options.scheduleRef || requestedScheduleRef,
                fiberKind: runtimeOverride.fiber || runtimeOverride.fiberKind || options.fiberKind,
                endpointNameHint: runtimeOverride.endpointNameHint || options.endpointNameHint
            }),
            normalizeXtendComponentFabricSource('component.static-contract', staticContract.schema || component.tag, staticFabric.defaultLane || staticFabric.lane, {
                scheduleRef: staticFabric.scheduleRef || requestedScheduleRef,
                fiberKind: staticFabric.fiberKind || staticContract.fiberKind,
                endpointNameHint: staticFabric.endpointNameHint
            }),
            normalizeXtendComponentFabricSource('scaffold.blueprint-default', 'default', operationDefaults.lane, operationDefaults)
        ].filter(Boolean);
        return {
            sources,
            requestedScheduleRef,
            scheduleRecord,
            operationDefaults
        };
    }

    function resolveXtendComponentFabricContext(component, operation = 'mountComponent', model = {}, options = {}) {
        const { sources, requestedScheduleRef, scheduleRecord, operationDefaults } = collectXtendComponentFabricSources(component, operation, model, options);
        const selected = sources[0] || normalizeXtendComponentFabricSource('scaffold.blueprint-default', 'default', operationDefaults.lane, operationDefaults);
        const diagnostics = [];
        sources.slice(1).forEach((source) => {
            if (source.lane && selected.lane && source.lane !== selected.lane) {
                diagnostics.push(createXtendComponentDiagnostic(
                    'rmt.xtend.component.fabric_lane.conflict',
                    `XTend component Fabric lane source "${source.source}" (${source.lane}) was superseded by "${selected.source}" (${selected.lane}).`,
                    operation,
                    operation === 'hydrateComponent' ? 'hydrate' : 'mount',
                    {
                        componentId: component.id,
                        tag: component.tag,
                        selectedSource: selected.source,
                        selectedLane: selected.lane,
                        conflictingSource: source.source,
                        conflictingLane: source.lane,
                        precedence: XTEND_COMPONENT_FABRIC_LANE_PRECEDENCE
                    },
                    'info'
                ));
            }
        });
        if (selected.source === 'scaffold.blueprint-default') {
            diagnostics.push(createXtendComponentDiagnostic(
                'rmt.xtend.component.fabric_lane.defaulted',
                'XTend component Fabric lane fell back to scaffold blueprint defaults.',
                operation,
                operation === 'hydrateComponent' ? 'hydrate' : 'mount',
                { componentId: component.id, tag: component.tag, lane: selected.lane },
                'info'
            ));
        }
        const scheduleRef = selected.scheduleRef || requestedScheduleRef || operationDefaults.scheduleRef;
        const scheduleProfile = scheduleRecord || XTEND_COMPONENT_FABRIC_SCHEDULE_PROFILES[scheduleRef] || operationDefaults;
        return Object.freeze({
            schema: XTEND_COMPONENT_FABRIC_LANE_INGESTION_SCHEMA,
            status: diagnostics.length > 0 ? 'resolved_with_diagnostics' : 'resolved',
            operation,
            phase: operation === 'hydrateComponent' ? 'hydrate' : 'mount',
            adapterId: XTEND_COMPONENT_ADAPTER_ID,
            componentId: component.id,
            tag: component.tag,
            scheduleRef,
            lane: selected.lane,
            fabricLane: selected.rawLane === 'a11y' ? 'a11y' : selected.lane,
            rmtLane: selected.lane,
            fiberKind: selected.fiberKind || operationDefaults.fiberKind,
            endpointNameHint: selected.endpointNameHint || scheduleProfile.endpointName || scheduleProfile.endpointNameHint || operationDefaults.endpointNameHint,
            preferIdle: selected.preferIdle === true || scheduleProfile.preferIdle === true,
            budgetClass: selected.budgetClass || scheduleProfile.budgetClass || operationDefaults.budgetClass,
            source: selected.source,
            sourceId: selected.sourceId,
            precedence: XTEND_COMPONENT_FABRIC_LANE_PRECEDENCE.slice(),
            sources: sources.map((source) => cloneSerializable(source, {})),
            diagnostics: Object.freeze(diagnostics)
        });
    }

        function normalizeXtendComponentLifecycleOperation(operation, fallbackOperation = 'update') {
        const requested = clampString(operation, '');
        const aliases = {
            mountComponent: 'mount',
            hydrateComponent: 'hydrate',
            renderComponent: 'render',
            updateComponent: 'update',
            unmountComponent: 'unmount',
            disposeComponent: 'dispose',
            registerComponent: 'mount',
            eventHandler: 'event',
            emitDiagnostic: 'error'
        };
        const normalized = aliases[requested] || requested;
        return XTEND_COMPONENT_LIFECYCLE_OPERATIONS.includes(normalized) ? normalized : fallbackOperation;
    }

    function readXtendComponentTelemetryNow(deps = {}, options = {}) {
        const clock = options.telemetryNow || options.now || deps.telemetryNow || deps.now;
        if (typeof clock === 'function') {
            const value = clock();
            const numeric = value instanceof Date ? value.getTime() : Number(value);
            if (Number.isFinite(numeric)) return numeric;
            const parsed = Date.parse(value);
            return Number.isFinite(parsed) ? parsed : Date.now();
        }
        if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
            return performance.now();
        }
        return Date.now();
    }

    function createXtendComponentLifecycleTelemetryRecord(componentInput = {}, operation = 'update', status = 'ok', details = {}) {
        const component = toPlainObject(componentInput);
        const fabricContext = toPlainObject(details.fabricContext || details.fabric);
        const metadata = toPlainObject(details.metadata);
        const diagnostics = Array.isArray(details.diagnostics) ? details.diagnostics : [];
        const durationMs = Number.isFinite(Number(details.durationMs)) ? Number(Number(details.durationMs).toFixed(2)) : 0;
        const normalizedStatus = ['ok', 'degraded', 'skipped', 'failed'].includes(clampString(status, 'ok')) ? clampString(status, 'ok') : 'failed';
        const lifecycleOperation = normalizeXtendComponentLifecycleOperation(operation, 'update');
        return Object.freeze({
            schema: XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA,
            id: clampString(details.id, `${component.id || component.tag || 'component'}.${lifecycleOperation}.${Date.now()}`),
            timestamp: details.timestamp || new Date().toISOString(),
            source: clampString(details.source, 'xtend.component-adapter'),
            operation: lifecycleOperation,
            phase: clampString(details.phase, lifecycleOperation),
            status: normalizedStatus,
            ok: normalizedStatus === 'ok' || normalizedStatus === 'degraded',
            adapterId: clampString(details.adapterId, XTEND_COMPONENT_ADAPTER_ID),
            componentId: clampString(details.componentId || component.id || fabricContext.componentId, ''),
            rmtComponentId: clampString(details.rmtComponentId || component.id || fabricContext.componentId, ''),
            tag: clampString(details.tag || component.tag || fabricContext.tag, ''),
            routeRef: clampString(details.routeRef || metadata.routeRef || component.routeRef || component.metadata && component.metadata.routeRef || '', ''),
            scheduleRef: clampString(details.scheduleRef || component.scheduleRef || fabricContext.scheduleRef, ''),
            fabricLane: clampString(details.fabricLane || fabricContext.fabricLane || fabricContext.lane, ''),
            rmtLane: clampString(details.rmtLane || fabricContext.rmtLane || fabricContext.lane, ''),
            fiberKind: clampString(details.fiberKind || fabricContext.fiberKind, ''),
            endpointNameHint: clampString(details.endpointNameHint || fabricContext.endpointNameHint, ''),
            durationMs,
            diagnosticCount: diagnostics.length,
            diagnostics: cloneSerializable(diagnostics, []),
            backpressureSignal: cloneSerializable(details.backpressureSignal || metadata.backpressureSignal, null),
            correlationId: details.correlationId || metadata.correlationId,
            metadata: cloneSerializable(metadata, {})
        });
    }

    function emitXtendComponentTelemetry(record, deps = {}, options = {}) {
        const telemetryRecord = record && record.schema === XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA
            ? record
            : createXtendComponentLifecycleTelemetryRecord({}, 'update', 'ok', record || {});
        const collector = options.telemetryCollector || deps.telemetryCollector || options.componentTelemetry || deps.componentTelemetry;
        if (Array.isArray(collector)) {
            collector.push(telemetryRecord);
        }
        const sink = options.recordTelemetry || deps.recordTelemetry;
        if (typeof sink === 'function') {
            sink(telemetryRecord);
        }
        const fabricTarget = options.fabric || deps.fabric;
        if (fabricTarget && typeof fabricTarget.recordComponentTelemetry === 'function') {
            fabricTarget.recordComponentTelemetry(telemetryRecord);
        }
        return telemetryRecord;
    }

    /* <kernel-lab:xtend-component-dom-commit-bridge> */
        const XTEND_COMPONENT_DOM_RENDERERS = typeof WeakMap === 'function' ? new WeakMap() : null;
        let xtendComponentFallbackDomRenderer = null;

        function resolveXtendComponentDomRenderer(documentTarget, deps = {}, options = {}) {
            const injected = options.domRenderer || deps.domRenderer || null;
            if (injected && typeof injected.commit === 'function') return injected;
            if (XTEND_COMPONENT_DOM_RENDERERS && documentTarget && XTEND_COMPONENT_DOM_RENDERERS.has(documentTarget)) {
                return XTEND_COMPONENT_DOM_RENDERERS.get(documentTarget);
            }
            if (!XTEND_COMPONENT_DOM_RENDERERS && xtendComponentFallbackDomRenderer) {
                return xtendComponentFallbackDomRenderer;
            }
            if (typeof appModules.createRmtDomDescriptorRenderer !== 'function') {
                throw new Error('XTend component adapter requires createRmtDomDescriptorRenderer().');
            }
            const renderer = appModules.createRmtDomDescriptorRenderer({
                documentTarget,
                diagnosticsHub: options.diagnosticsHub || deps.diagnosticsHub,
                componentRegistry: options.componentRegistry || deps.componentRegistry,
                trustedDomRenderer: options.trustedDomRenderer || deps.trustedDomRenderer,
                trustedDom: options.trustedDom || deps.trustedDom
            });
            if (XTEND_COMPONENT_DOM_RENDERERS && documentTarget) {
                XTEND_COMPONENT_DOM_RENDERERS.set(documentTarget, renderer);
            } else {
                xtendComponentFallbackDomRenderer = renderer;
            }
            return renderer;
        }

        function createXtendComponentRendererRegistry(component, deps = {}, options = {}) {
            const configuredRegistry = options.componentRegistry || deps.componentRegistry || null;
            const declaredProperties = Object.keys(component.props || {});
            return {
                resolveComponentCapability(tag) {
                    const configured = configuredRegistry && typeof configuredRegistry.resolveComponentCapability === 'function'
                        ? configuredRegistry.resolveComponentCapability(tag)
                        : null;
                    const configuredProperties = configured && Array.isArray(configured.propertyNames)
                        ? configured.propertyNames
                        : [];
                    return {
                        ...(configured || {}),
                        tag,
                        propertyNames: uniqueValues([...configuredProperties, ...declaredProperties])
                    };
                },
                buildComponentDescriptor(input, descriptorOptions) {
                    return configuredRegistry && typeof configuredRegistry.buildComponentDescriptor === 'function'
                        ? configuredRegistry.buildComponentDescriptor(input, descriptorOptions)
                        : null;
                },
                bindComponentInstance(element, binding, bindingOptions) {
                    return configuredRegistry && typeof configuredRegistry.bindComponentInstance === 'function'
                        ? configuredRegistry.bindComponentInstance(element, binding, bindingOptions)
                        : null;
                }
            };
        }

        function createXtendSlotDescriptor(slotName, slotValue) {
            let content = null;
            if (typeof slotValue === 'string' || typeof slotValue === 'number') {
                content = { type: 'text', text: { op: 'literal', value: String(slotValue) } };
            } else {
                const slotRecord = toPlainObject(slotValue);
                if (slotRecord.type === 'trusted_html') {
                    content = slotRecord;
                } else if (slotRecord.descriptor) {
                    content = slotRecord.descriptor;
                } else if (slotRecord.node) {
                    content = slotRecord.node;
                } else if (Object.prototype.hasOwnProperty.call(slotRecord, 'markup') || Object.prototype.hasOwnProperty.call(slotRecord, 'html')) {
                    const text = Object.prototype.hasOwnProperty.call(slotRecord, 'markup')
                        ? slotRecord.markup
                        : slotRecord.html;
                    content = {
                        type: 'element',
                        tag: 'span',
                        children: [{ type: 'text', text: { op: 'literal', value: String(text == null ? '' : text) } }]
                    };
                } else if (Object.prototype.hasOwnProperty.call(slotRecord, 'text')) {
                    content = { type: 'text', text: { op: 'literal', value: String(slotRecord.text == null ? '' : slotRecord.text) } };
                } else if (slotRecord.template || slotRecord.templateRef) {
                    content = {
                        type: 'element',
                        tag: 'template',
                        attributes: {
                            'data-rmt-template': clampString(slotRecord.template || slotRecord.templateRef, '')
                        }
                    };
                } else if (slotRecord.component || slotRecord.tag || slotRecord.type) {
                    content = slotRecord;
                } else if (Array.isArray(slotRecord.children)) {
                    content = { type: 'fragment', children: slotRecord.children };
                }
            }
            if (!content) return null;
            if (slotName === 'default') return content;
            return {
                type: 'element',
                tag: 'span',
                attributes: { slot: slotName },
                children: [content]
            };
        }

        function createXtendComponentDomDescriptor(component, model = {}, fabricContext = null, hydrated = false) {
            const safeModel = toPlainObject(model);
            const properties = {};
            Object.entries(component.props || {}).forEach(([key, value]) => {
                properties[key] = Object.prototype.hasOwnProperty.call(safeModel, key) ? safeModel[key] : value;
            });
            const attributes = {
                'data-rmt-component-id': component.id,
                'data-rmt-component-adapter': component.adapter,
                ...(component.scheduleRef ? { 'data-rmt-schedule': component.scheduleRef } : {}),
                ...(component.serializedAttributes || {})
            };
            if (fabricContext) {
                attributes['data-xtend-fabric-lane'] = fabricContext.fabricLane;
                attributes['data-xtend-rmt-lane'] = fabricContext.rmtLane;
                attributes['data-xtend-fabric-fiber'] = fabricContext.fiberKind;
                attributes['data-xtend-fabric-source'] = fabricContext.source;
                if (fabricContext.endpointNameHint) attributes['data-rmt-endpoint'] = fabricContext.endpointNameHint;
            }
            if (hydrated) attributes['data-xtend-hydrated'] = 'true';
            return {
                type: 'element',
                tag: component.tag,
                key: component.id || component.tag,
                attributes,
                properties,
                events: component.events || {},
                children: Object.entries(component.slots || {})
                    .map(([slotName, slotValue]) => createXtendSlotDescriptor(slotName, slotValue))
                    .filter(Boolean)
            };
        }

        function createXtendComponentDomBridge(component, model, deps, options, documentTarget, fabricContext, hydrated) {
            return {
                renderer: resolveXtendComponentDomRenderer(documentTarget, deps, options),
                descriptor: createXtendComponentDomDescriptor(component, model, fabricContext, hydrated),
                attachedEvents: Object.entries(component.events || {}).map(([eventName, eventConfig]) => Object.freeze({
                    eventName,
                    commandName: clampString(toPlainObject(eventConfig).commandName || toPlainObject(eventConfig).command, '')
                })),
                context: {
                    componentRegistry: createXtendComponentRendererRegistry(component, deps, options),
                    trustedDomRenderer: options.trustedDomRenderer || deps.trustedDomRenderer,
                    trustedDom: options.trustedDom || deps.trustedDom,
                    metadata: {
                        adapterId: XTEND_COMPONENT_ADAPTER_ID,
                        componentId: component.id,
                        source: 'kernel-lab-component-dom-commit'
                    }
                }
            };
        }
        /* </kernel-lab:xtend-component-dom-commit-bridge> */

    appModules.createRmtXtendComponentAdapter = function createRmtXtendComponentAdapter(deps = {}) {
        const rmtFormat = deps.rmtFormat || appModules.createRmtFormat();
        const adapterId = clampString(deps.adapterId, XTEND_COMPONENT_ADAPTER_ID);
        let applicationEventRouter = deps.eventRouter
            || deps.eventRoutingRuntime
            || deps.applicationEventRouter
            || null;
        let eventRouterDiagnosticPublished = false;

        function createLegacyCommandBus(options = {}) {
            const injected = options.commandBus || deps.commandBus || options.commandRuntime || deps.commandRuntime;
            if (injected && typeof injected.dispatchCommand === 'function') return injected;
            const dispatchCommand = options.dispatchCommand || deps.dispatchCommand;
            const onEvent = options.onEvent || deps.onEvent;
            if (typeof dispatchCommand !== 'function' && typeof onEvent !== 'function') return null;
            return Object.freeze({
                dispatchCommand(commandEnvelope = {}, metadata = {}) {
                    const commandName = clampString(commandEnvelope.command, '');
                    const payload = cloneSerializable(commandEnvelope.payload, {});
                    if (typeof dispatchCommand === 'function') {
                        return dispatchCommand(commandName, payload, {
                            commandEnvelope,
                            metadata
                        });
                    }
                    return onEvent({
                        commandName,
                        payload,
                        metadata: cloneSerializable(metadata, {})
                    }, null);
                }
            });
        }

        function resolveApplicationEventRouter(options = {}, diagnostics = []) {
            const injected = options.eventRouter
                || options.eventRoutingRuntime
                || options.applicationEventRouter
                || applicationEventRouter;
            if (injected && typeof injected.reconcile === 'function') {
                applicationEventRouter = injected;
                return injected;
            }
            if (options.strict === true || options.strictMaraca === true || deps.strict === true || deps.strictMaraca === true) {
                const error = new Error('RmtXtendComponentAdapter benoetigt im Strict-Pfad einen injizierten EventRouterPort.');
                error.code = 'rmt.xtend.component.event_router.missing';
                throw error;
            }
            const factory = typeof options.createRmtEventRoutingRuntime === 'function'
                ? options.createRmtEventRoutingRuntime
                : (typeof deps.createRmtEventRoutingRuntime === 'function'
                    ? deps.createRmtEventRoutingRuntime
                    : (global
                        && global.XTendRmtEventRoutingRuntime
                        && typeof global.XTendRmtEventRoutingRuntime.createRmtEventRoutingRuntime === 'function'
                        ? global.XTendRmtEventRoutingRuntime.createRmtEventRoutingRuntime
                        : null));
            if (typeof factory !== 'function') {
                if (!eventRouterDiagnosticPublished) {
                    eventRouterDiagnosticPublished = true;
                    diagnostics.push(createXtendComponentDiagnostic(
                        'rmt.xtend.component.event_router.missing',
                        'Application-Bindings wurden erzeugt, aber kein kanonischer Event Router ist verfuegbar.',
                        'eventBindings',
                        'commit',
                        {},
                        'info'
                    ));
                }
                return null;
            }
            applicationEventRouter = factory({
                commandBus: createLegacyCommandBus(options),
                domRenderer: options.domRenderer || deps.domRenderer || options.renderer || deps.renderer || null,
                diagnosticsHub: options.diagnosticsHub || deps.diagnosticsHub,
                documentTarget: options.documentTarget || deps.documentTarget || deps.document || null,
                strict: false
            });
            if (!eventRouterDiagnosticPublished) {
                eventRouterDiagnosticPublished = true;
                diagnostics.push(createXtendComponentDiagnostic(
                    'rmt.xtend.component.event_router.compatibility',
                    'XTendComponentAdapter hat fuer die 0.6-Low-Level-Kompatibilitaet einmalig einen kanonischen Event Router erzeugt.',
                    'eventBindings',
                    'commit',
                    {},
                    'info'
                ));
            }
            return applicationEventRouter;
        }

        function reconcileApplicationBindings(root, domCommit, options = {}, diagnostics = []) {
            if (!domCommit || !Array.isArray(domCommit.bindings) || domCommit.bindings.length === 0) return null;
            const eventRouter = resolveApplicationEventRouter(options, diagnostics);
            return eventRouter && typeof eventRouter.reconcile === 'function'
                ? eventRouter.reconcile(root, domCommit)
                : null;
        }

        function mapComponents(componentsInput = {}, options = {}) {
            return normalizeXtendComponentMapping(componentsInput, rmtFormat, {
                ...deps,
                ...options,
                adapterId
            });
        }

        function registerComponent(componentInput = {}, options = {}) {
            const mapping = componentInput && componentInput.schema === XTEND_COMPONENT_ADAPTER_SCHEMA
                ? componentInput
                : mapComponents(componentInput, options);
            const diagnostics = mapping.diagnostics.slice();
            mapping.components.forEach((component) => {
                const manifestEntry = normalizeXtendManifestEntry(component, options.manifest || deps.manifest || {});
                const customElementsRegistry = options.customElements || deps.customElements || (typeof customElements !== 'undefined' ? customElements : null);
                if (!manifestEntry) {
                    diagnostics.push(createXtendComponentDiagnostic(
                        'rmt.xtend.component.manifest.missing',
                        `XTend component "${component.id || component.tag}" has no manifest entry; adapter will rely on an already registered Custom Element.`,
                        'registerComponent',
                        'prepare',
                        { componentId: component.id, tag: component.tag },
                        'info'
                    ));
                }
                if (component.tag && customElementsRegistry && typeof customElementsRegistry.get === 'function' && !customElementsRegistry.get(component.tag)) {
                    diagnostics.push(createXtendComponentDiagnostic(
                        'rmt.xtend.component.custom_element.unregistered',
                        `XTend custom element "${component.tag}" is not registered yet.`,
                        'registerComponent',
                        'prepare',
                        { componentId: component.id, tag: component.tag, manifestEntry },
                        manifestEntry ? 'info' : 'warn'
                    ));
                }
            });
            return createXtendComponentResult({
                ok: mapping.componentCount > 0,
                status: diagnostics.some((entry) => entry.level === 'warn' || entry.level === 'error') ? 'degraded' : 'ok',
                adapterId,
                operation: 'registerComponent',
                phase: 'prepare',
                handle: { mapping },
                diagnostics,
                metadata: {
                    componentCount: mapping.componentCount,
                    scheduleRefs: mapping.scheduleRefs
                }
            });
        }

        function resolveFabricContext(componentRef, operation = 'mountComponent', model = {}, options = {}) {
            const component = resolveXtendMappedComponent(componentRef, {
                ...deps,
                ...options,
                manifest: options.manifest || deps.manifest || {}
            });
            if (!component) {
                const diagnostics = [createXtendComponentDiagnostic(
                    'rmt.xtend.component.mount.skipped',
                    'XTend component adapter could not resolve Fabric context because no component mapping was resolved.',
                    'resolveFabricContext',
                    'prepare',
                    { componentRef: cloneSerializable(componentRef, {}) }
                )];
                return Object.freeze({
                    schema: XTEND_COMPONENT_FABRIC_LANE_INGESTION_SCHEMA,
                    status: 'skipped',
                    operation,
                    adapterId,
                    componentId: '',
                    tag: '',
                    scheduleRef: '',
                    lane: '',
                    fabricLane: '',
                    rmtLane: '',
                    fiberKind: '',
                    endpointNameHint: '',
                    source: '',
                    precedence: XTEND_COMPONENT_FABRIC_LANE_PRECEDENCE.slice(),
                    sources: [],
                    diagnostics: Object.freeze(diagnostics)
                });
            }
            return resolveXtendComponentFabricContext(component, operation, model, {
                ...deps,
                ...options
            });
        }

        function mountComponent(target, componentRef, model = {}, options = {}) {
            const telemetryStart = readXtendComponentTelemetryNow(deps, options);
            const component = resolveXtendMappedComponent(componentRef, {
                ...deps,
                ...options,
                manifest: options.manifest || deps.manifest || {}
            });
            const diagnostics = [];
            if (!component) {
                diagnostics.push(createXtendComponentDiagnostic(
                    'rmt.xtend.component.mount.skipped',
                    'XTend component adapter could not mount because no component mapping was resolved.',
                    'mountComponent',
                    'mount',
                    { componentRef: cloneSerializable(componentRef, {}) }
                ));
                return createXtendComponentResult({ ok: false, status: 'skipped', adapterId, operation: 'mountComponent', phase: 'mount', diagnostics });
            }
            const documentTarget = getXtendDocumentTarget(target, deps, options);
            if (!target || typeof target.appendChild !== 'function' || !documentTarget || typeof documentTarget.createElement !== 'function') {
                diagnostics.push(createXtendComponentDiagnostic(
                    'rmt.xtend.component.target.missing',
                    'XTend component adapter needs a DOM target with appendChild and a document with createElement to mount.',
                    'mountComponent',
                    'mount',
                    { componentId: component.id, tag: component.tag }
                ));
                return createXtendComponentResult({ ok: false, status: 'skipped', adapterId, operation: 'mountComponent', phase: 'mount', diagnostics });
            }
            const fabricContext = resolveXtendComponentFabricContext(component, 'mountComponent', model, {
                ...deps,
                ...options
            });
            diagnostics.push(...fabricContext.diagnostics);
            /* <kernel-lab:xtend-component-mount-commit> */
            const domBridge = createXtendComponentDomBridge(
                component,
                model,
                deps,
                options,
                documentTarget,
                typeof fabricContext === 'undefined' ? null : fabricContext,
                false
            );
            const domCommit = domBridge.renderer.commit({
                operation: 'replace-children',
                target,
                descriptor: domBridge.descriptor,
                context: domBridge.context,
                ownership: options.ownership || deps.ownership,
                metadata: domBridge.context.metadata
            });
            const element = domCommit.nodes[0] || null;
            const attachedEvents = Object.freeze(domBridge.attachedEvents);
            const eventReconcile = reconcileApplicationBindings(target, domCommit, options, diagnostics);
            /* </kernel-lab:xtend-component-mount-commit> */
            const status = diagnostics.length > 0 ? 'degraded' : 'ok';
            const telemetry = emitXtendComponentTelemetry(createXtendComponentLifecycleTelemetryRecord(component, 'mountComponent', status, {
                phase: 'mount',
                fabricContext,
                durationMs: readXtendComponentTelemetryNow(deps, options) - telemetryStart,
                diagnostics,
                metadata: {
                    mounted: true,
                    attachedEventCount: attachedEvents.length
                }
            }), deps, options);
            return createXtendComponentResult({
                ok: true,
                status,
                adapterId,
                operation: 'mountComponent',
                phase: 'mount',
                handle: {
                    component,
                    element,
                    attachedEvents,
                    commitResult: domCommit,
                    applicationBindings: domCommit.bindings,
                    eventReconcile
                },
                diagnostics,
                metadata: {
                    componentId: component.id,
                    tag: component.tag,
                    scheduleRef: component.scheduleRef,
                    mounted: true,
                    fabric: fabricContext,
                    telemetry
                }
            });
        }

        function hydrateComponent(target, componentRef, model = {}, options = {}) {
            const telemetryStart = readXtendComponentTelemetryNow(deps, options);
            const component = resolveXtendMappedComponent(componentRef, {
                ...deps,
                ...options,
                manifest: options.manifest || deps.manifest || {}
            });
            const diagnostics = [];
            if (!component || !target) {
                diagnostics.push(createXtendComponentDiagnostic(
                    'rmt.xtend.component.hydration.skipped',
                    'XTend component adapter could not hydrate because component mapping or target was missing.',
                    'hydrateComponent',
                    'hydrate',
                    { componentRef: cloneSerializable(componentRef, {}) }
                ));
                return createXtendComponentResult({ ok: false, status: 'skipped', adapterId, operation: 'hydrateComponent', phase: 'hydrate', diagnostics });
            }
            const fabricContext = resolveXtendComponentFabricContext(component, 'hydrateComponent', model, {
                ...deps,
                ...options
            });
            diagnostics.push(...fabricContext.diagnostics);
            let element = target;
            if (typeof target.querySelector === 'function') {
                element = target.querySelector(`[data-rmt-component-id="${component.id}"]`) || target.querySelector(component.tag) || target;
            }
            /* <kernel-lab:xtend-component-hydrate-commit> */
            const documentTarget = getXtendDocumentTarget(element, deps, options);
            const domBridge = createXtendComponentDomBridge(
                component,
                model,
                deps,
                options,
                documentTarget,
                typeof fabricContext === 'undefined' ? null : fabricContext,
                true
            );
            const hydrationTag = clampString(
                element && (element.localName || element.tagName),
                ''
            ).toLowerCase();
            const hydrationMatchesComponent = hydrationTag === clampString(component.tag, '').toLowerCase();
            const hydrationDescriptor = hydrationMatchesComponent
                ? domBridge.descriptor
                : (() => {
                    const compatibilityDescriptor = { ...domBridge.descriptor };
                    delete compatibilityDescriptor.children;
                    delete compatibilityDescriptor.key;
                    delete compatibilityDescriptor.properties;
                    return compatibilityDescriptor;
                })();
            if (!hydrationMatchesComponent) {
                diagnostics.push(createXtendComponentDiagnostic(
                    'rmt.xtend.component.hydration.compatibility-target',
                    'XTend component hydration used the legacy container-target compatibility path.',
                    'hydrateComponent',
                    'hydrate',
                    {
                        componentId: component.id,
                        expectedTag: component.tag,
                        actualTag: hydrationTag
                    },
                    'info'
                ));
            }
            const domCommit = domBridge.renderer.commit({
                operation: hydrationMatchesComponent ? 'reconcile-element' : 'merge-element',
                target: element,
                descriptor: hydrationDescriptor,
                context: domBridge.context,
                ownership: options.ownership || deps.ownership,
                metadata: domBridge.context.metadata
            });
            const eventReconcile = reconcileApplicationBindings(element, domCommit, options, diagnostics);
            /* </kernel-lab:xtend-component-hydrate-commit> */
            if (typeof element.hydrate === 'function') {
                element.hydrate(model, { component, source: XTEND_COMPONENT_ADAPTER_SCHEMA });
            }

            const telemetry = emitXtendComponentTelemetry(createXtendComponentLifecycleTelemetryRecord(component, 'hydrateComponent', diagnostics.length > 0 ? 'degraded' : 'ok', {
                phase: 'hydrate',
                fabricContext,
                durationMs: readXtendComponentTelemetryNow(deps, options) - telemetryStart,
                diagnostics,
                metadata: {
                    hydrated: true,
                    hasHydrateMethod: typeof element.hydrate === 'function'
                }
            }), deps, options);
            return createXtendComponentResult({
                ok: true,
                status: 'ok',
                adapterId,
                operation: 'hydrateComponent',
                phase: 'hydrate',
                handle: {
                    component,
                    element,
                    commitResult: domCommit,
                    applicationBindings: domCommit.bindings,
                    eventReconcile
                },
                diagnostics,
                metadata: {
                    componentId: component.id,
                    tag: component.tag,
                    scheduleRef: component.scheduleRef,
                    hydrated: true,
                    fabric: fabricContext,
                    telemetry
                }
            });
        }

        function recordComponentTelemetry(recordInput = {}, options = {}) {
            const record = toPlainObject(recordInput);
            const component = resolveXtendMappedComponent(record.componentRef || record.componentId || record.rmtComponentId || record.tag || record.component || '', {
                ...deps,
                ...options,
                manifest: options.manifest || deps.manifest || {}
            }) || toPlainObject(record.component);
            const telemetry = emitXtendComponentTelemetry(createXtendComponentLifecycleTelemetryRecord(component, record.operation || 'update', record.status || 'ok', record), deps, options);
            return createXtendComponentResult({
                ok: telemetry.status !== 'failed',
                status: telemetry.status,
                adapterId,
                operation: 'recordComponentTelemetry',
                phase: 'telemetry',
                handle: { telemetry },
                metadata: { telemetry }
            });
        }

        function emitDiagnostic(event = {}, payload = {}) {
            return createXtendComponentResult({
                ok: true,
                status: 'ok',
                adapterId,
                operation: 'emitDiagnostic',
                phase: 'diagnostics',
                handle: {
                    event: cloneSerializable(event, {}),
                    payload: cloneSerializable(payload, {})
                },
                diagnostics: [createXtendComponentDiagnostic(
                    clampString(event.code, 'rmt.xtend.component.diagnostic'),
                    clampString(event.message, 'XTend component adapter diagnostic.'),
                    'emitDiagnostic',
                    'diagnostics',
                    payload,
                    clampString(event.level, 'info')
                )],
                metadata: payload
            });
        }

        return Object.freeze({
            id: adapterId,
            schema: XTEND_COMPONENT_ADAPTER_SCHEMA,
            kind: 'component_adapter',
            version: DOCUMENT_VERSION,
            runtimeSurface: Object.freeze(['registerComponent', 'mountComponent', 'hydrateComponent', 'resolveFabricContext', 'recordComponentTelemetry', 'emitDiagnostic']),
            capabilities: Object.freeze({
                providedCapabilities: Object.freeze(['components', 'customElements', 'manifestLookup', 'props', 'attributes', 'slots', 'events', 'hydration', 'diagnostics', 'scheduleRefs', 'fabricContext', 'laneIngestion', 'fiberHints', 'componentTelemetry']),
                requiredCapabilities: Object.freeze(['customElements']),
                preferredCapabilities: Object.freeze(['manifest', 'stateBridge', 'theme', 'api', 'fabric'])
            }),
            definition: Object.freeze({
                id: adapterId,
                kind: 'component_adapter',
                version: DOCUMENT_VERSION,
                runtimeSurface: Object.freeze(['registerComponent', 'mountComponent', 'hydrateComponent', 'resolveFabricContext', 'recordComponentTelemetry', 'emitDiagnostic']),
                capabilities: Object.freeze({
                    providedCapabilities: Object.freeze(['components', 'customElements', 'manifestLookup', 'props', 'attributes', 'slots', 'events', 'hydration', 'diagnostics', 'scheduleRefs', 'fabricContext', 'laneIngestion', 'fiberHints', 'componentTelemetry'])
                }),
                kernelVisible: false,
                metadata: Object.freeze({
                    schema: XTEND_COMPONENT_ADAPTER_SCHEMA,
                    inputContract: RUNTIME_REGISTRY_SCHEMA,
                    fabricLaneIngestion: XTEND_COMPONENT_FABRIC_LANE_INGESTION_SCHEMA,
                    componentLifecycleTelemetry: XTEND_COMPONENT_LIFECYCLE_TELEMETRY_SCHEMA,
                    lanePrecedence: XTEND_COMPONENT_FABRIC_LANE_PRECEDENCE
                })
            }),
            mapComponent: (componentEntry, options = {}) => normalizeXtendComponentEntry(componentEntry, options),
            mapComponents,
            registerComponent,
            resolveFabricContext,
            recordComponentTelemetry,
            mountComponent,
            hydrateComponent,
            emitDiagnostic,
            listDiagnosticCodes: () => XTEND_COMPONENT_ADAPTER_DIAGNOSTIC_CODES.slice()
        });
    };

})(__XTENDRMT_GLOBAL__);

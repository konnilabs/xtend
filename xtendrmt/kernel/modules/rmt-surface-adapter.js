/* modules/rmt-surface-adapter.js */
(function registerRmtSurfaceAdapter(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const DOCUMENT_KIND = 'rmt_document';
    const DOCUMENT_VERSION = '1.0';
    const RUNTIME_REGISTRY_SCHEMA = 'xtend.rmt.runtime-registry.v1';
    const SURFACE_ADAPTER_SCHEMA = 'xtend.surface.adapter.v1';
    const SURFACE_MATERIALIZATION_SCHEMA = 'xtend.surface.materialization.v1';
    const SURFACE_ADAPTER_ID = 'xtend.surface';
    const SURFACE_ADAPTER_DIAGNOSTIC_CODES = Object.freeze([
        'rmt.surface.missing_id',
        'rmt.surface.missing_manager',
        'rmt.surface.missing_component',
        'rmt.surface.target.missing',
        'rmt.surface.target.unsupported',
        'rmt.surface.materialization.target.missing',
        'rmt.surface.materialization.created',
        'rmt.surface.remote_policy.blocked',
        'rmt.surface.remote_policy.degraded',
        'rmt.surface.remote_policy.kernel_runtime_refused',
        'rmt.surface.remote_event_governance.blocked',
        'rmt.surface.dom_compat_ownership_unsupported',
        'rmt.surface.operation.skipped',
        'rmt.surface.diagnostic'
    ]);
    const SURFACE_ADAPTER_OPERATIONS = Object.freeze([
        'registerSurface',
        'openSurface',
        'closeSurface',
        'destroySurface',
        'focusSurface',
        'moveSurface',
        'resizeSurface',
        'dockSurface',
        'undockSurface',
        'registerRemoteSurface',
        'applyRemoteSurfacePolicy',
        'governRemoteSurfaceEvent',
        'snapshotSurfaces',
        'emitDiagnostic'
    ]);
    const OWNERSHIP_MODES = Object.freeze([
        'observe_only',
        'hydrate_existing',
        'replace_children',
        'managed_subtree'
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

    function normalizeOwnershipMode(value, fallbackValue = '') {
        const safeValue = clampString(value, fallbackValue);
        return OWNERSHIP_MODES.includes(safeValue) ? safeValue : fallbackValue;
    }

    function createSurfaceAdapterDiagnostic(code, message, operation = 'registerSurface', phase = 'prepare', metadata = {}, level = 'warn') {
        return Object.freeze({
            level: clampString(level, 'warn'),
            code: clampString(code, ''),
            message: clampString(message, ''),
            adapterId: SURFACE_ADAPTER_ID,
            operation: clampString(operation, 'registerSurface'),
            phase: clampString(phase, 'prepare'),
            metadata: cloneSerializable(metadata, {})
        });
    }

    function createSurfaceAdapterResult(options = {}) {
        return Object.freeze({
            ok: options.ok === true,
            status: clampString(options.status, options.ok === true ? 'ok' : 'skipped'),
            adapterId: clampString(options.adapterId, SURFACE_ADAPTER_ID),
            operation: clampString(options.operation, 'registerSurface'),
            phase: clampString(options.phase, 'prepare'),
            handle: options.handle || null,
            diagnostics: Object.freeze((Array.isArray(options.diagnostics) ? options.diagnostics : []).map((entry) => Object.freeze(entry))),
            metadata: cloneSerializable(options.metadata, {})
        });
    }

    function createSurfaceRecordIndex(records = []) {
        const index = Object.create(null);
        (Array.isArray(records) ? records : []).forEach((record) => {
            const id = clampString(record && record.id, '');
            if (id && !index[id]) index[id] = record;
        });
        return index;
    }

    function findSurfaceScheduleRecord(records = [], scheduleRef = '') {
        const ref = clampString(scheduleRef, '');
        if (!ref) return null;
        return (Array.isArray(records) ? records : []).find((record) => (
            clampString(record && record.id, '') === ref
            || clampString(record && record.endpointName, '') === ref
        )) || null;
    }

    function normalizeSurfaceRemoteList(value) {
        if (Array.isArray(value)) return value.flatMap((entry) => normalizeSurfaceRemoteList(entry));
        if (value && typeof value === 'object') return normalizeSurfaceRemoteList(value.id || value.name || value.capability || value.event || value.ref || '');
        return String(value || '').split(',').map((entry) => entry.trim()).filter(Boolean);
    }

    function normalizeSurfaceRemoteRecord(remoteSurface = {}, options = {}) {
        const source = toPlainObject(remoteSurface);
        const remote = toPlainObject(source.remote);
        const security = toPlainObject(source.security);
        const adapterBoundary = toPlainObject(source.adapterBoundary);
        const fallback = toPlainObject(source.fallback);
        const surfaceId = clampString(source.surfaceId || source.id, clampString(source.name, ''));
        return Object.freeze({
            schema: clampString(source.schema, 'xtend.rmt.vnext-remote-surface.v1'),
            surfaceId,
            id: surfaceId,
            manifestId: clampString(source.manifestId || remote.manifestId, ''),
            name: clampString(source.name, surfaceId),
            type: clampString(source.surfaceType || source.type, 'window'),
            manager: clampString(source.manager, clampString(options.managerId || options.manager, 'xtend.surface.manager')),
            owner: cloneSerializable(source.owner, {}),
            remote: cloneSerializable(remote, {}),
            security: cloneSerializable(security, {}),
            adapterBoundary: {
                ...cloneSerializable(adapterBoundary, {}),
                capabilities: normalizeSurfaceRemoteList(adapterBoundary.capabilities)
            },
            capabilities: Object.freeze(normalizeSurfaceRemoteList(source.capabilities)),
            shellBindings: Object.freeze((Array.isArray(source.shellBindings) ? source.shellBindings : (Array.isArray(source.exposes) ? source.exposes : [])).map((binding) => cloneSerializable(binding, {}))),
            fallback: Object.keys(fallback).length > 0 ? cloneSerializable(fallback, {}) : null,
            runtime: cloneSerializable(source.runtime, {}),
            events: cloneSerializable(source.events, {}),
            status: clampString(source.status, 'ready'),
            sourceRecord: cloneSerializable(source, {})
        });
    }

    function collectRemoteSurfaceRecords(documentRecord = {}, options = {}) {
        const records = [];
        const remoteManifest = toPlainObject(documentRecord.remoteManifest);
        if (Array.isArray(documentRecord.remoteSurfaces)) records.push(...documentRecord.remoteSurfaces);
        if (documentRecord.remoteSurface) records.push(documentRecord.remoteSurface);
        if (Array.isArray(remoteManifest.surfaces)) records.push(...remoteManifest.surfaces);
        if (remoteManifest.remoteSurface) records.push(remoteManifest.remoteSurface);
        const seen = new Set();
        return records
            .map((record) => normalizeSurfaceRemoteRecord(record, options))
            .filter((record) => {
                if (!record.surfaceId || seen.has(record.surfaceId)) return false;
                seen.add(record.surfaceId);
                return true;
            });
    }

    function remoteSurfaceToSurfaceRecord(remoteSurface = {}, options = {}) {
        const remote = normalizeSurfaceRemoteRecord(remoteSurface, options);
        const firstBinding = remote.shellBindings[0] || {};
        const bindingTarget = typeof firstBinding.target === 'object'
            ? clampString(firstBinding.target.ref, '')
            : clampString(firstBinding.target || firstBinding.slot || '', '');
        const fallbackRef = remote.fallback && remote.fallback.ref || '';
        const componentRef = fallbackRef || remote.remote.id || remote.name || remote.surfaceId;
        const type = remote.type === 'remote'
            ? (bindingTarget.includes('sidebar') || bindingTarget.includes('panel') ? 'side-panel' : 'window')
            : remote.type;
        return Object.freeze({
            schema: 'xtend.surface.record.v1',
            id: remote.surfaceId,
            adapter: SURFACE_ADAPTER_ID,
            type,
            manager: remote.manager,
            component: componentRef,
            route: clampString(remote.sourceRecord.route || remote.sourceRecord.routeRef, ''),
            schedule: clampString(remote.sourceRecord.schedule || remote.sourceRecord.scheduleRef, ''),
            stateKey: clampString(remote.sourceRecord.stateKey, ''),
            defaultOpen: remote.sourceRecord.defaultOpen === true || remote.sourceRecord.open === true,
            active: remote.sourceRecord.active === true,
            bounds: cloneSerializable(remote.sourceRecord.bounds || remote.sourceRecord.initialBounds, {}),
            placement: clampString(remote.sourceRecord.placement, type === 'side-panel' ? 'right' : ''),
            mode: clampString(remote.sourceRecord.mode, type === 'side-panel' ? 'docked' : 'floating'),
            capabilities: remote.capabilities.slice(),
            a11y: cloneSerializable(remote.sourceRecord.a11y, {}),
            persistence: cloneSerializable(remote.sourceRecord.persistence, {}),
            metadata: {
                ...cloneSerializable(remote.sourceRecord.metadata, {}),
                remoteSurface: remote.sourceRecord,
                remotePolicy: {
                    schema: 'xtend.surface.remote-policy-bridge.v1',
                    kernelRemoteExecution: false,
                    hostAdapterRequired: true
                },
                rmtKernelRemoteExecution: false
            },
            remoteSurface: remote.sourceRecord,
            remotePolicy: {
                schema: 'xtend.surface.remote-policy-bridge.v1',
                kernelRemoteExecution: false,
                hostAdapterRequired: true
            }
        });
    }

    function resolveSurfaceDocument(surfaceInput, rmtFormat, options = {}) {
        if (Array.isArray(surfaceInput)) {
            return {
                surfaces: surfaceInput,
                components: [],
                routes: [],
                schedules: [],
                diagnostics: []
            };
        }
        const rawInput = surfaceInput && typeof surfaceInput === 'object' ? surfaceInput : {};
        if (rawInput.schema === RUNTIME_REGISTRY_SCHEMA && options.document) {
            return resolveSurfaceDocument(options.document, rmtFormat, options);
        }
        if (rawInput.id && rawInput.type && !Array.isArray(rawInput.surfaces)) {
            return {
                surfaces: [rawInput],
                components: [],
                routes: [],
                schedules: [],
                diagnostics: []
            };
        }
        if (
            rawInput.kind === DOCUMENT_KIND
            || Array.isArray(rawInput.surfaces)
            || Array.isArray(rawInput.components)
            || Array.isArray(rawInput.routes)
            || Array.isArray(rawInput.schedules)
        ) {
            try {
                return rmtFormat.normalizeDocument(rawInput, options);
            } catch (_error) {
                return rawInput;
            }
        }
        if (rawInput.document || rawInput.remoteManifest || rawInput.remoteSurface || Array.isArray(rawInput.remoteSurfaces)) {
            const documentRecord = toPlainObject(rawInput.document);
            return {
                ...documentRecord,
                surfaces: Array.isArray(documentRecord.surfaces) ? documentRecord.surfaces : [],
                components: Array.isArray(documentRecord.components) ? documentRecord.components : [],
                routes: Array.isArray(documentRecord.routes) ? documentRecord.routes : [],
                schedules: Array.isArray(documentRecord.schedules) ? documentRecord.schedules : [],
                remoteSurface: rawInput.remoteSurface || documentRecord.remoteSurface || rawInput.remoteManifest && rawInput.remoteManifest.remoteSurface || null,
                remoteSurfaces: Array.isArray(rawInput.remoteSurfaces) ? rawInput.remoteSurfaces : (Array.isArray(documentRecord.remoteSurfaces) ? documentRecord.remoteSurfaces : []),
                remoteManifest: rawInput.remoteManifest || documentRecord.remoteManifest || null,
                diagnostics: Array.isArray(documentRecord.diagnostics) ? documentRecord.diagnostics : []
            };
        }
        return {
            surfaces: [],
            components: [],
            routes: [],
            schedules: [],
            diagnostics: []
        };
    }

    function resolveSurfaceRuntimeType(type, kind = '') {
        const candidate = clampString(type, '').toLowerCase();
        const semanticKind = clampString(kind, '').toLowerCase();
        const semantic = semanticKind || candidate;
        if (['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host'].includes(semantic)) return 'region';
        if (['panel', 'side-panel', 'sidepanel'].includes(semantic)) return 'side-panel';
        if (['modal', 'dialog', 'drawer', 'popover', 'tooltip', 'toast', 'lightbox', 'menu'].includes(semantic)) return semantic;
        if (['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host'].includes(candidate)) return 'region';
        if (['panel', 'side-panel', 'sidepanel'].includes(candidate)) return 'side-panel';
        if (['modal', 'dialog', 'drawer', 'popover', 'tooltip', 'toast', 'lightbox', 'menu'].includes(candidate)) return candidate;
        return candidate || 'window';
    }

    function normalizeSurfaceAdapterEntry(surfaceEntry = {}, indexes = {}, options = {}) {
        const entry = toPlainObject(surfaceEntry);
        const record = toPlainObject(entry.record || entry);
        const id = clampString(entry.id || record.id, '');
        const kind = clampString(entry.kind || record.kind, '');
        const type = resolveSurfaceRuntimeType(entry.type || record.type || kind || 'window', kind);
        const schedule = normalizeScheduleReference(entry.scheduleRef || record.schedule);
        const componentRef = clampString(entry.componentId || record.component, '');
        const managerRef = clampString(entry.managerId || record.manager, '');
        const routeRef = clampString(entry.routeId || record.route, '');
        const componentRecord = componentRef ? indexes.componentsById && indexes.componentsById[componentRef] : null;
        const managerRecord = managerRef ? indexes.componentsById && indexes.componentsById[managerRef] : null;
        const routeRecord = routeRef ? indexes.routesById && indexes.routesById[routeRef] : null;
        const scheduleRecord = findSurfaceScheduleRecord(indexes.schedules, schedule);
        const metadata = cloneSerializable(record.metadata, {});
        const hydration = toPlainObject(record.hydration);
        const requestedOwnershipMode = clampString(
            entry.ownershipMode
            || record.ownershipMode
            || record.ownership
            || hydration.ownershipMode
            || hydration.ownership,
            ''
        );
        const ownershipMode = normalizeOwnershipMode(requestedOwnershipMode, '');
        const remoteSurface = record.remoteSurface || metadata.remoteSurface || null;
        const remotePolicy = record.remotePolicy || metadata.remotePolicy || null;

        return Object.freeze({
            id,
            surfaceId: id,
            schema: clampString(record.schema, 'xtend.surface.record.v1'),
            type,
            kind: kind || type,
            adapter: clampString(entry.adapterId || record.adapter, SURFACE_ADAPTER_ID),
            manager: managerRef,
            component: componentRef,
            route: routeRef,
            schedule,
            scheduleRef: schedule,
            stateKey: clampString(record.stateKey, ''),
            defaultOpen: record.defaultOpen === true || record.open === true,
            active: record.active === true,
            bounds: cloneSerializable(record.bounds, {}),
            placement: clampString(record.placement, ''),
            mode: clampString(record.mode, ''),
            layer: clampString(record.layer, ''),
            ownershipMode,
            requestedOwnershipMode,
            capabilities: Object.freeze(Array.isArray(record.capabilities) ? record.capabilities.slice() : []),
            a11y: cloneSerializable(record.a11y, {}),
            persistence: cloneSerializable(record.persistence, {}),
            metadata: Object.freeze(metadata),
            remoteSurface: remoteSurface ? cloneSerializable(remoteSurface, {}) : null,
            remotePolicy: remotePolicy ? cloneSerializable(remotePolicy, {}) : null,
            enterpriseSurface: record.enterpriseSurface ? cloneSerializable(record.enterpriseSurface, {}) : null,
            degradation: record.degradation ? cloneSerializable(record.degradation, {}) : null,
            eventGovernance: record.eventGovernance ? cloneSerializable(record.eventGovernance, {}) : null,
            componentRecord: componentRecord ? cloneSerializable(componentRecord.record || componentRecord, {}) : null,
            managerRecord: managerRecord ? cloneSerializable(managerRecord.record || managerRecord, {}) : null,
            routeRecord: routeRecord ? cloneSerializable(routeRecord.record || routeRecord, {}) : null,
            scheduleRecord: scheduleRecord ? cloneSerializable(scheduleRecord, {}) : null,
            sourceSurface: cloneSerializable(record, {}),
            registryIndex: typeof entry.index === 'number' ? entry.index : -1
        });
    }

    function resolveSurfaceMapping(surfacesInput, rmtFormat, options = {}) {
        if (surfacesInput && surfacesInput.schema === SURFACE_ADAPTER_SCHEMA && Array.isArray(surfacesInput.surfaces)) {
            return surfacesInput;
        }
        const adapterId = clampString(options.adapterId, SURFACE_ADAPTER_ID);
        const documentRecord = resolveSurfaceDocument(surfacesInput, rmtFormat, options);
        const indexes = {
            componentsById: createSurfaceRecordIndex(documentRecord.components),
            routesById: createSurfaceRecordIndex(documentRecord.routes),
            schedules: Array.isArray(documentRecord.schedules) ? documentRecord.schedules : []
        };
        const diagnostics = [];
        const remoteSurfaces = collectRemoteSurfaceRecords(documentRecord, options).map((remoteSurface) => remoteSurfaceToSurfaceRecord(remoteSurface, options));
        const candidateSurfaces = (Array.isArray(documentRecord.surfaces) ? documentRecord.surfaces : []).concat(remoteSurfaces);
        const surfaces = Object.freeze(candidateSurfaces
            .filter((surface) => clampString(surface && surface.adapter, adapterId) === adapterId)
            .map((surface, index) => normalizeSurfaceAdapterEntry({ ...surface, index }, indexes, options)));

        surfaces.forEach((surface, index) => {
            if (!surface.id) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.missing_id',
                    `Surface record at index ${index} has no stable id.`,
                    'registerSurface',
                    'prepare',
                    { index }
                ));
            }
            if (!surface.manager) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.missing_manager',
                    `Surface "${surface.id || index}" has no manager reference.`,
                    'registerSurface',
                    'prepare',
                    { surfaceId: surface.id, index }
                ));
            }
            if (!surface.component) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.missing_component',
                    `Surface "${surface.id || index}" has no component reference.`,
                    'registerSurface',
                    'prepare',
                    { surfaceId: surface.id, index }
                ));
            }
            const domCompat = options.domCompat || null;
            const requestedOwnershipMode = surface.requestedOwnershipMode || surface.ownershipMode || '';
            if (
                requestedOwnershipMode
                && domCompat
                && typeof domCompat.supportsOwnershipMode === 'function'
                && domCompat.supportsOwnershipMode(requestedOwnershipMode) !== true
            ) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.dom_compat_ownership_unsupported',
                    `Surface "${surface.id || index}" requests unsupported DomCompat ownership mode "${requestedOwnershipMode}".`,
                    'mapSurfaces',
                    'prepare',
                    { surfaceId: surface.id, index, ownershipMode: requestedOwnershipMode }
                ));
            }
        });

        return Object.freeze({
            schema: SURFACE_ADAPTER_SCHEMA,
            adapterId,
            status: diagnostics.length > 0 ? 'mapped_with_diagnostics' : 'mapped',
            surfaces,
            diagnostics: Object.freeze(diagnostics),
            sourceDiagnostics: Object.freeze(cloneSerializable(documentRecord.diagnostics, [])),
            surfaceCount: surfaces.length,
            scheduleRefs: uniqueValues(surfaces.map((surface) => surface.scheduleRef)),
            modelFields: Object.freeze(['surfaceId', 'type', 'kind', 'manager', 'component', 'route', 'scheduleRef', 'stateKey', 'bounds', 'placement', 'mode', 'ownershipMode', 'capabilities', 'a11y', 'persistence', 'metadata', 'remoteSurface', 'remotePolicy'])
        });
    }

    function resolveMappedSurface(surfaceRef, mapping = null, options = {}) {
        if (surfaceRef && typeof surfaceRef === 'object') {
            if (surfaceRef.schema === SURFACE_ADAPTER_SCHEMA && Array.isArray(surfaceRef.surfaces)) {
                return surfaceRef.surfaces[0] || null;
            }
            if (surfaceRef.surfaceId || surfaceRef.id || surfaceRef.type || surfaceRef.component) {
                return normalizeSurfaceAdapterEntry(surfaceRef, {}, options);
            }
        }
        const ref = clampString(surfaceRef, '');
        if (!ref || !mapping || !Array.isArray(mapping.surfaces)) return null;
        return mapping.surfaces.find((surface) => surface.id === ref || surface.component === ref) || null;
    }

    function resolveSurfaceManagerTarget(surface = {}, deps = {}, options = {}) {
        const directTarget = options.managerElement || options.target || deps.managerElement || deps.target || null;
        if (directTarget && typeof directTarget.registerSurface === 'function') return directTarget;

        const managers = options.managers || deps.managers || null;
        if (managers && surface.manager) {
            if (typeof managers.get === 'function') {
                const mapped = managers.get(surface.manager);
                if (mapped) return mapped;
            }
            if (managers[surface.manager]) return managers[surface.manager];
        }

        const root = directTarget && typeof directTarget.querySelector === 'function'
            ? directTarget
            : null;
        const documentTarget = options.document
            || deps.document
            || (directTarget && directTarget.ownerDocument)
            || (typeof document !== 'undefined' ? document : null);
        const queryRoot = root || documentTarget;
        if (!queryRoot || typeof queryRoot.querySelector !== 'function') return null;

        const managerRef = clampString(surface.manager, '');
        if (managerRef) {
            const safeRef = managerRef.replace(/["\\]/g, '\\$&');
            return queryRoot.querySelector(`x-surface-manager[manager-id="${safeRef}"], x-surface-manager[data-rmt-component="${safeRef}"], [data-rmt-component="${safeRef}"]`);
        }
        return queryRoot.querySelector('x-surface-manager');
    }

    function ensureSurfaceManagerRuntimeId(managerElement, fallbackId = '') {
        if (!managerElement) return clampString(fallbackId, '');
        const getAttr = typeof managerElement.getAttribute === 'function'
            ? managerElement.getAttribute.bind(managerElement)
            : null;
        const declaredId = clampString(
            getAttr ? getAttr('manager-id') : '',
            clampString(managerElement.id, '')
        );
        if (declaredId) return declaredId;
        return clampString(fallbackId, 'xtend.surface.manager');
    }

    function createSurfaceControllerRecord(surface, managerElement) {
        const managerId = ensureSurfaceManagerRuntimeId(managerElement, surface.manager);
        return {
            schema: surface.schema,
            id: surface.id,
            type: surface.type,
            kind: surface.kind || surface.type,
            manager: managerId,
            stateKey: surface.stateKey,
            defaultOpen: surface.defaultOpen,
            open: surface.defaultOpen,
            active: surface.active,
            bounds: cloneSerializable(surface.bounds, {}),
            placement: surface.placement,
            mode: surface.mode,
            layer: surface.layer,
            ownershipMode: surface.ownershipMode || null,
            capabilities: Array.isArray(surface.capabilities) ? surface.capabilities.slice() : [],
            a11y: cloneSerializable(surface.a11y, {}),
            persistence: cloneSerializable(surface.persistence, {}),
            contentRef: surface.component,
            route: surface.route,
            schedule: surface.scheduleRef,
            metadata: {
                ...cloneSerializable(surface.metadata, {}),
                boundsMode: surface.bounds && surface.bounds.mode || undefined,
                boundsScope: surface.bounds && surface.bounds.scope || undefined,
                initialBoundsCss: surface.bounds && surface.bounds.mode === 'responsive' ? cloneSerializable(surface.bounds, {}) : undefined,
                rmtSurfaceAdapter: SURFACE_ADAPTER_SCHEMA,
                rmtComponent: surface.component,
                rmtManager: surface.manager,
                rmtOwnershipMode: surface.ownershipMode || null,
                remoteSurface: surface.remoteSurface ? cloneSerializable(surface.remoteSurface, {}) : undefined,
                remotePolicy: surface.remotePolicy ? cloneSerializable(surface.remotePolicy, {}) : undefined,
                rmtKernelRemoteExecution: false
            }
        };
    }

    const SURFACE_COMPONENT_SAFE_TAGS = new Set(['a', 'abbr', 'article', 'aside', 'b', 'blockquote', 'br', 'button', 'caption', 'code', 'col', 'colgroup', 'data', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'mark', 'nav', 'ol', 'p', 'picture', 'pre', 'q', 's', 'samp', 'section', 'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'var']);

    function resolveSurfaceComponentTag(tag) {
        const tagName = clampString(tag, '').toLowerCase();
        return SURFACE_COMPONENT_SAFE_TAGS.has(tagName) || tagName.startsWith('x-') ? tagName : 'div';
    }

    function createSurfaceComponentAttributes(componentRecord = {}) {
        const component = toPlainObject(componentRecord);
        const attributes = {
            ...toPlainObject(component.attributes)
        };
        Object.entries(toPlainObject(component.props)).forEach(([name, value]) => {
            if (name === 'textContent' || value === undefined || (value !== null && typeof value === 'object')) return;
            attributes[name] = value;
        });
        return attributes;
    }

    function resolveSurfaceMaterializedTag(surface = {}) {
        const metadata = toPlainObject(surface.metadata);
        const explicitTag = clampString(metadata.surfaceTag || metadata.surfaceComponentTag || metadata.xtendSurfaceTag, '');
        if (explicitTag) return explicitTag;
        const kind = clampString(surface.kind || metadata.surfaceKind, '').toLowerCase();
        const type = clampString(surface.type, kind || 'window').toLowerCase();
        const semantic = kind || type;
        if (['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host'].includes(semantic) || type === 'region') return 'x-surface-region';
        if (type === 'side-panel' || type === 'sidepanel' || type === 'panel') return 'x-side-panel';
        if (type === 'modal') return 'x-modal';
        if (type === 'dialog') return 'x-dialog';
        if (type === 'drawer') return 'x-drawer';
        if (type === 'popover') return 'x-popover';
        if (type === 'tooltip') return 'x-tooltip';
        if (type === 'toast') return 'x-toast';
        if (type === 'lightbox') return 'x-lightbox';
        if (type === 'menu') return 'x-menu';
        return 'x-surface-window';
    }

    function resolveSurfaceMaterializedSlot(surface = {}) {
        const kind = clampString(surface.kind, '').toLowerCase();
        const type = clampString(surface.type, kind || 'window').toLowerCase();
        const semantic = kind || type;
        if (type === 'side-panel' || type === 'sidepanel' || type === 'panel') return 'panels';
        if (type === 'modal' || type === 'dialog' || type === 'drawer' || type === 'popover' || type === 'tooltip' || type === 'toast' || type === 'lightbox' || type === 'menu') return 'overlays';
        if (['root', 'workspace', 'page', 'card', 'list', 'region', 'overlay-host'].includes(semantic) || type === 'region') return '';
        return 'windows';
    }

    function resolveSurfaceMaterializationDocument(root = null, deps = {}, options = {}) {
        const candidates = [
            options.domDocument,
            options.ownerDocument,
            options.document,
            deps.domDocument,
            deps.ownerDocument,
            deps.document,
            root && root.ownerDocument,
            typeof document !== 'undefined' ? document : null
        ];
        return candidates.find((candidate) => candidate && typeof candidate.createElement === 'function') || null;
    }

    function resolveSurfaceMaterializationRoot(documentTarget, deps = {}, options = {}) {
        const candidates = [
            options.root,
            options.host,
            options.mount,
            deps.root,
            deps.host,
            deps.mount,
            documentTarget && documentTarget.body,
            documentTarget && documentTarget.documentElement
        ];
        return candidates.find((candidate) => candidate && typeof candidate.appendChild === 'function') || null;
    }

    function escapeSurfaceSelectorValue(value) {
        return clampString(value, '').replace(/["\\]/g, '\\$&');
    }

    function findSurfaceMaterializedElement(managerElement, surface = {}) {
        if (!managerElement || typeof managerElement.querySelector !== 'function' || !surface.id) return null;
        const safeId = escapeSurfaceSelectorValue(surface.id);
        try {
            return managerElement.querySelector(`[surface-id="${safeId}"], [data-rmt-surface="${safeId}"]`);
        } catch (_error) {
            return null;
        }
    }

    function collectSurfaceMaterializationComponents(mapping = {}, deps = {}, options = {}) {
        const index = {};
        const candidates = [options.rmtDocument, options.documentRecord, options.document, deps.rmtDocument, deps.documentRecord, deps.document];
        candidates.forEach((candidate) => {
            if (!candidate || !Array.isArray(candidate.components)) return;
            candidate.components.forEach((component) => {
                const record = toPlainObject(component);
                const id = clampString(record.id, '');
                if (id && !index[id]) index[id] = record;
            });
        });
        if (Array.isArray(mapping.surfaces)) {
            mapping.surfaces.forEach((surface) => {
                const component = toPlainObject(surface.componentRecord);
                const id = clampString(component.id || surface.component, '');
                if (id && Object.keys(component).length > 0 && !index[id]) index[id] = component;
                const manager = toPlainObject(surface.managerRecord);
                const managerId = clampString(manager.id || surface.manager, '');
                if (managerId && Object.keys(manager).length > 0 && !index[managerId]) index[managerId] = manager;
            });
        }
        return index;
    }

    function createSurfaceTextDescriptor(text) {
        return {
            type: 'text',
            text: { op: 'literal', value: String(text == null ? '' : text) }
        };
    }

    function materializeSurfaceComponentRecord(componentRecord, documentTarget, componentIndex = {}, visited = new Set(), slotName = '') {
        const component = toPlainObject(componentRecord);
        const componentId = clampString(component.id, '');
        if (!documentTarget) return null;
        if (componentId && visited.has(componentId)) return null;
        const tag = resolveSurfaceComponentTag(component.tag);
        if (!tag) return null;
        const nextVisited = new Set(visited);
        if (componentId) nextVisited.add(componentId);
        const attributes = {
            ...createSurfaceComponentAttributes(component),
            ...(componentId ? { 'data-rmt-component': componentId } : {}),
            'data-rmt-surface-content': 'true',
            ...(slotName && slotName !== 'default' ? { slot: slotName } : {})
        };
        const children = [];
        const slots = toPlainObject(component.slots);
        Object.keys(slots).forEach((name) => {
            children.push(...appendSurfaceSlotContent(slots[name], documentTarget, componentIndex, nextVisited, name));
        });
        const textContent = toPlainObject(component.props).textContent;
        const descriptor = {
            type: 'element',
            tag,
            key: componentId || undefined,
            attributes,
            children
        };
        if (textContent !== undefined && textContent !== null) {
            descriptor.properties = { textContent };
        }
        return descriptor;
    }

    function appendSurfaceSlotContent(slotRecord, documentTarget, componentIndex = {}, visited = new Set(), slotName = '') {
        if (slotRecord === undefined || slotRecord === null) return [];
        if (typeof slotRecord === 'string' || typeof slotRecord === 'number') {
            return [createSurfaceTextDescriptor(slotRecord)];
        }
        if (Array.isArray(slotRecord)) {
            return slotRecord.flatMap((entry) => appendSurfaceSlotContent(entry, documentTarget, componentIndex, visited, slotName));
        }
        const slot = toPlainObject(slotRecord);
        const descriptors = [];
        if (slot.text !== undefined) descriptors.push(createSurfaceTextDescriptor(slot.text));
        const refs = [];
        if (slot.component) refs.push(slot.component);
        if (Array.isArray(slot.components)) refs.push(...slot.components);
        refs.forEach((ref) => {
            const component = componentIndex[clampString(ref, '')];
            const child = materializeSurfaceComponentRecord(component, documentTarget, componentIndex, visited, slotName);
            if (child) descriptors.push(child);
        });
        return descriptors;
    }

    function appendSurfaceMaterializedContent(surfaceDescriptor, surface = {}, documentTarget, componentIndex = {}) {
        const componentRecord = surface.componentRecord || componentIndex[surface.component];
        const contentDescriptor = materializeSurfaceComponentRecord(componentRecord, documentTarget, componentIndex, new Set());
        if (contentDescriptor) surfaceDescriptor.children = [contentDescriptor];
        return contentDescriptor;
    }

    function resolveSurfaceHydrationPolicy(surface = {}) {
        const componentRecord = surface.componentRecord || {};
        const sourceSurface = surface.sourceSurface || {};
        const candidates = [
            surface.hydrationPolicy,
            surface.hydration && surface.hydration.policy,
            surface.lifecycle && surface.lifecycle.hydrationPolicy,
            sourceSurface.hydrationPolicy,
            sourceSurface.hydration && sourceSurface.hydration.policy,
            sourceSurface.metadata && sourceSurface.metadata.hydrationPolicy,
            componentRecord.hydration && componentRecord.hydration.policy,
            componentRecord.performance && componentRecord.performance.hydrationPolicy,
            componentRecord.metadata && componentRecord.metadata.hydrationPolicy
        ];
        return candidates
            .map((value) => clampString(value, '').toLowerCase())
            .find((policy) => ['eager', 'visible', 'open', 'idle', 'route', 'warm', 'prewarm'].includes(policy)) || (surface.route ? 'route' : null);
    }

    function resolveSurfaceRouteLifecyclePolicy(surface = {}) {
        const componentRecord = surface.componentRecord || {};
        const sourceSurface = surface.sourceSurface || {};
        const candidates = [
            surface.routePolicy,
            surface.lifecycle && surface.lifecycle.routePolicy,
            surface.lifecycle && surface.lifecycle.policy,
            sourceSurface.routePolicy,
            sourceSurface.lifecycle && sourceSurface.lifecycle.routePolicy,
            sourceSurface.metadata && sourceSurface.metadata.routePolicy,
            sourceSurface.metadata && sourceSurface.metadata.surfaceRoutePolicy,
            componentRecord.metadata && componentRecord.metadata.routePolicy,
            componentRecord.metadata && componentRecord.metadata.surfaceRoutePolicy
        ];
        return candidates
            .map((value) => clampString(value, '').toLowerCase())
            .find((policy) => ['global', 'open-close', 'open-collapse', 'open-minimize', 'open-keep', 'hydrate-only', 'manual'].includes(policy)) || null;
    }

    function createSurfaceMaterializedAttributes(surface = {}, managerId = '') {
        const slotName = resolveSurfaceMaterializedSlot(surface);
        const label = clampString(
            surface.a11y && surface.a11y.label,
            clampString(surface.sourceSurface && surface.sourceSurface.label, surface.id)
        );
        const attributes = {
            id: surface.id,
            'surface-id': surface.id,
            label,
            ...(slotName ? { slot: slotName } : {}),
            'data-rmt-surface': surface.id,
            'data-rmt-surface-adapter': SURFACE_ADAPTER_ID,
            'data-rmt-native-surface': 'true',
            'data-rmt-materialized-surface': 'true',
            'data-rmt-content-ref': surface.component,
            'data-rmt-manager': surface.manager || managerId,
            'data-rmt-route': surface.route,
            'data-rmt-schedule': surface.scheduleRef,
            'data-surface-type': surface.type,
            'data-surface-kind': surface.kind,
            'data-surface-layer': surface.layer,
            'data-surface-state-key': surface.stateKey,
            'data-surface-hydration-policy': resolveSurfaceHydrationPolicy(surface),
            'data-surface-route': surface.route,
            'data-surface-route-policy': resolveSurfaceRouteLifecyclePolicy(surface),
            'data-rmt-ownership-mode': surface.ownershipMode,
            'data-surface-ownership-mode': surface.ownershipMode
        };
        if (surface.remoteSurface) {
            const remoteSurface = toPlainObject(surface.remoteSurface);
            const remote = toPlainObject(remoteSurface.remote);
            const security = toPlainObject(remoteSurface.security);
            attributes['data-rmt-remote-surface'] = 'true';
            attributes['data-rmt-remote-id'] = remote.id || remote.remoteId;
            attributes['data-rmt-remote-origin'] = remote.origin;
            attributes['data-rmt-remote-trust-boundary'] = security.trustBoundary;
            attributes['data-rmt-kernel-remote-execution'] = 'false';
            if (remoteSurface.fallback && remoteSurface.fallback.ref) attributes['data-rmt-remote-fallback'] = remoteSurface.fallback.ref;
        }
        if (surface.defaultOpen) attributes.open = true;
        if (surface.active) attributes.active = true;
        if (surface.a11y && surface.a11y.modal === true) attributes.modal = true;
        if (Array.isArray(surface.capabilities)) {
            if (surface.capabilities.includes('resize') || surface.capabilities.includes('resizable')) attributes.resizable = true;
            if (surface.capabilities.includes('move') || surface.capabilities.includes('drag') || surface.capabilities.includes('draggable')) attributes.draggable = true;
        }
        const bounds = toPlainObject(surface.bounds);
        if (bounds.mode) attributes['bounds-mode'] = bounds.mode;
        if (bounds.scope) attributes['bounds-scope'] = bounds.scope;
        if (bounds.x !== undefined) attributes['initial-x'] = bounds.x;
        if (bounds.y !== undefined) attributes['initial-y'] = bounds.y;
        if (bounds.width !== undefined) attributes['initial-width'] = bounds.width;
        if (bounds.height !== undefined) attributes['initial-height'] = bounds.height;
        if (bounds.minWidth !== undefined) attributes['initial-min-width'] = bounds.minWidth;
        if (bounds.minHeight !== undefined) attributes['initial-min-height'] = bounds.minHeight;
        if (bounds.maxWidth !== undefined) attributes['initial-max-width'] = bounds.maxWidth;
        if (bounds.maxHeight !== undefined) attributes['initial-max-height'] = bounds.maxHeight;
        if (surface.placement) attributes.placement = surface.placement;
        if (surface.mode) attributes.mode = surface.mode;
        return attributes;
    }

    function createSurfaceManagerDescriptor(managerRef = '', managerRecord = {}) {
        const safeRef = clampString(managerRef || managerRecord.id, 'xtend.surface.manager');
        return {
            type: 'element',
            tag: clampString(managerRecord.tag, 'x-surface-manager'),
            key: safeRef,
            attributes: {
                ...createSurfaceComponentAttributes(managerRecord),
                id: safeRef,
                'manager-id': safeRef,
                'data-rmt-component': safeRef,
                'data-rmt-surface-manager': 'true'
            }
        };
    }

    function createSurfaceMaterializedDescriptor(surface = {}, managerId = '', documentTarget = null, componentIndex = {}) {
        const descriptor = {
            type: 'element',
            tag: resolveSurfaceMaterializedTag(surface),
            key: surface.id,
            attributes: createSurfaceMaterializedAttributes(surface, managerId)
        };
        appendSurfaceMaterializedContent(descriptor, surface, documentTarget, componentIndex);
        return descriptor;
    }

    function commitSurfaceDescriptor(renderer, request, deps = {}, options = {}) {
        if (!renderer || typeof renderer.commit !== 'function') {
            const error = new Error('xtend.surface adapter requires the shared DOM descriptor renderer.');
            error.code = 'rmt.dom.shared-renderer-missing';
            throw error;
        }
        return renderer.commit({
            ...request,
            context: {
                ...toPlainObject(request.context),
                componentRegistry: options.componentRegistry || deps.componentRegistry,
                trustedDomRenderer: options.trustedDomRenderer || deps.trustedDomRenderer,
                metadata: {
                    adapterId: SURFACE_ADAPTER_ID,
                    source: 'kernel-lab-surface-dom-commit',
                    ...toPlainObject(request.context && request.context.metadata)
                }
            },
            ownership: options.ownership || deps.ownership
        });
    }

    function resolveSurfaceMaterializationManagerTarget(surface = {}, deps = {}, options = {}) {
        const directTarget = options.managerElement || options.manager || deps.managerElement || deps.manager || null;
        if (directTarget && typeof directTarget.appendChild === 'function') return directTarget;
        return resolveSurfaceManagerTarget(surface, deps, options);
    }

    function resolveOrCreateSurfaceManagerElement(surface = {}, state = {}) {
        const managerRef = clampString(surface.manager, 'xtend.surface.manager');
        if (state.managersById.has(managerRef)) return state.managersById.get(managerRef);
        const existing = resolveSurfaceMaterializationManagerTarget(surface, state.deps, state.options);
        if (existing) {
            const commitResult = commitSurfaceDescriptor(state.renderer, {
                operation: 'merge-element',
                target: existing,
                descriptor: createSurfaceManagerDescriptor(managerRef, toPlainObject(surface.managerRecord))
            }, state.deps, state.options);
            state.commitReports.push(commitResult);
            state.managersById.set(managerRef, existing);
            return existing;
        }
        if (!state.documentTarget || !state.rootTarget) return null;
        const managerRecord = toPlainObject(surface.managerRecord);
        const descriptor = createSurfaceManagerDescriptor(managerRef, managerRecord);
        const commitResult = commitSurfaceDescriptor(state.renderer, {
            operation: 'create-node',
            descriptor
        }, state.deps, state.options);
        const managerElement = commitResult.nodes && commitResult.nodes[0] || null;
        if (!managerElement) return null;
        state.rootTarget.appendChild(managerElement);
        state.commitReports.push(commitResult);
        state.createdManagers.push({ managerId: managerRef, element: managerElement, tag: descriptor.tag });
        state.managersById.set(managerRef, managerElement);
        return managerElement;
    }

    function callSurfaceManager(managerElement, methodName, args = [], surface = null, diagnostics = []) {
        if (!managerElement) {
            diagnostics.push(createSurfaceAdapterDiagnostic(
                'rmt.surface.target.missing',
                'xtend.surface adapter needs an x-surface-manager target for runtime operations.',
                methodName,
                'mount',
                { surfaceId: surface && surface.id, manager: surface && surface.manager }
            ));
            return null;
        }
        if (typeof managerElement[methodName] !== 'function') {
            diagnostics.push(createSurfaceAdapterDiagnostic(
                'rmt.surface.target.unsupported',
                `x-surface-manager target does not support ${methodName}().`,
                methodName,
                'mount',
                { surfaceId: surface && surface.id, manager: surface && surface.manager }
            ));
            return null;
        }
        return managerElement[methodName](...args);
    }

    function publishSurfaceAdapterDiagnostic(event = {}, payload = {}, deps = {}, options = {}) {
        const diagnostic = createSurfaceAdapterDiagnostic(
            clampString(event.code, 'rmt.surface.diagnostic'),
            clampString(event.message, 'xtend.surface adapter diagnostic.'),
            'emitDiagnostic',
            'diagnostics',
            payload,
            clampString(event.level, 'info')
        );
        const target = options.managerElement || options.target || deps.managerElement || deps.target || null;
        const hub = options.diagnosticsHub || deps.diagnosticsHub || null;
        if (hub && typeof hub.publish === 'function') {
            hub.publish(diagnostic);
        }
        if (deps.fabric && typeof deps.fabric.emitDiagnostic === 'function') {
            deps.fabric.emitDiagnostic(diagnostic);
        }
        if (target && typeof target.dispatchEvent === 'function') {
            const eventCtor = (options.windowTarget || deps.windowTarget || global || {}).CustomEvent
                || (typeof CustomEvent !== 'undefined' ? CustomEvent : null);
            if (typeof eventCtor === 'function') {
                target.dispatchEvent(new eventCtor('surface-adapter-diagnostic', {
                    detail: diagnostic,
                    bubbles: true,
                    composed: true
                }));
            }
        }
        return diagnostic;
    }

    appModules.createRmtSurfaceAdapter = function createRmtSurfaceAdapter(deps = {}) {
        const rmtFormat = deps.rmtFormat || appModules.createRmtFormat();
        const adapterId = clampString(deps.adapterId, SURFACE_ADAPTER_ID);
        const compatibilityRenderers = typeof WeakMap === 'function' ? new WeakMap() : null;
        let compatibilityFallbackRenderer = null;
        let sharedRendererDiagnosticEmitted = false;

        function resolveSurfaceDomRenderer(documentTarget, options = {}, diagnostics = []) {
            const injected = options.domRenderer || deps.domRenderer || null;
            const strict = options.strict === true || deps.strict === true;
            if (injected && typeof injected.commit === 'function') return injected;
            if (strict) {
                const error = new Error('Strict xtend.surface materialization requires an injected DOM descriptor renderer.');
                error.code = 'rmt.dom.shared-renderer-missing';
                throw error;
            }
            if (!sharedRendererDiagnosticEmitted) {
                sharedRendererDiagnosticEmitted = true;
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.dom.shared-renderer-missing',
                    'Compatibility mode created one shared DOM descriptor renderer for xtend.surface; inject domRenderer from the composition root.',
                    'materializeSurfaces',
                    'prepare',
                    { removal: '0.7.0' },
                    'info'
                ));
            }
            if (compatibilityRenderers && documentTarget && compatibilityRenderers.has(documentTarget)) {
                return compatibilityRenderers.get(documentTarget);
            }
            if (!compatibilityRenderers && compatibilityFallbackRenderer) {
                return compatibilityFallbackRenderer;
            }
            if (typeof appModules.createRmtDomDescriptorRenderer !== 'function') {
                throw new Error('xtend.surface compatibility materialization requires createRmtDomDescriptorRenderer().');
            }
            const renderer = appModules.createRmtDomDescriptorRenderer({
                documentTarget,
                diagnosticsHub: options.diagnosticsHub || deps.diagnosticsHub,
                componentRegistry: options.componentRegistry || deps.componentRegistry,
                trustedDomRenderer: options.trustedDomRenderer || deps.trustedDomRenderer,
                trustedDom: options.trustedDom || deps.trustedDom
            });
            if (compatibilityRenderers && documentTarget) {
                compatibilityRenderers.set(documentTarget, renderer);
            } else {
                compatibilityFallbackRenderer = renderer;
            }
            return renderer;
        }

        function mapSurfaces(surfacesInput = {}, options = {}) {
            return resolveSurfaceMapping(surfacesInput, rmtFormat, {
                ...deps,
                ...options,
                adapterId
            });
        }

        function remotePolicyOptions(options = {}) {
            return {
                enterpriseRegistry: options.enterpriseRegistry || deps.enterpriseRegistry || null,
                degradationReport: options.degradationReport || deps.degradationReport || null,
                eventGovernanceReport: options.eventGovernanceReport || deps.eventGovernanceReport || null,
                allowedOrigins: options.allowedOrigins || deps.allowedOrigins || null,
                allowedCapabilities: options.allowedCapabilities || deps.allowedCapabilities || null,
                source: options.source || 'xtend.surface'
            };
        }

        function recordRemotePolicyDiagnostics(result = {}, surface = {}, diagnostics = []) {
            if (!result || !surface || !surface.remoteSurface) return;
            if (result.refused === true) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.remote_policy.blocked',
                    `Remote surface "${surface.id}" was refused by the host SurfaceManager policy bridge.`,
                    'registerRemoteSurface',
                    'mount',
                    { surfaceId: surface.id, decision: result.decision }
                ));
            } else if (result.degraded === true) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.remote_policy.degraded',
                    `Remote surface "${surface.id}" was degraded to a host-controlled fallback.`,
                    'registerRemoteSurface',
                    'mount',
                    { surfaceId: surface.id, decision: result.decision, fallbackRef: result.fallbackRef },
                    'info'
                ));
            }
            if (result.kernelBoundary && result.kernelBoundary.remoteRuntimeExecution !== false) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.remote_policy.kernel_runtime_refused',
                    'Remote surface policy bridge must not execute remote runtime in the RMT kernel.',
                    'registerRemoteSurface',
                    'mount',
                    { surfaceId: surface.id }
                ));
            }
        }

        function applyRemoteSurfacePolicy(remoteSurfaceInput = {}, options = {}) {
            const remoteSurface = normalizeSurfaceRemoteRecord(remoteSurfaceInput.remoteSurface || remoteSurfaceInput, {
                ...deps,
                ...options
            });
            const surface = remoteSurfaceToSurfaceRecord(remoteSurface, {
                ...deps,
                ...options
            });
            const diagnostics = [];
            const managerElement = resolveSurfaceManagerTarget(surface, deps, options);
            let result = null;
            if (managerElement && typeof managerElement.applyRemoteSurfacePolicy === 'function') {
                result = managerElement.applyRemoteSurfacePolicy(remoteSurface.sourceRecord || remoteSurface, {
                    ...remotePolicyOptions(options),
                    commit: options.commit === true
                });
            } else {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.target.unsupported',
                    'x-surface-manager target does not support applyRemoteSurfacePolicy().',
                    'applyRemoteSurfacePolicy',
                    'mount',
                    { surfaceId: surface.id, manager: surface.manager }
                ));
            }
            recordRemotePolicyDiagnostics(result, surface, diagnostics);
            return createSurfaceAdapterResult({
                ok: !!result && result.ok !== false,
                status: !result ? 'skipped' : (diagnostics.length > 0 ? 'degraded' : 'ok'),
                adapterId,
                operation: 'applyRemoteSurfacePolicy',
                phase: 'mount',
                handle: { surface, result },
                diagnostics,
                metadata: {
                    surfaceId: surface.id,
                    decision: result && result.decision || null,
                    remoteRuntimeExecution: false
                }
            });
        }

        function registerRemoteSurface(remoteSurfaceInput = {}, options = {}) {
            const remoteSurface = normalizeSurfaceRemoteRecord(remoteSurfaceInput.remoteSurface || remoteSurfaceInput, {
                ...deps,
                ...options
            });
            const surface = remoteSurfaceToSurfaceRecord(remoteSurface, {
                ...deps,
                ...options
            });
            const diagnostics = [];
            const managerElement = resolveSurfaceManagerTarget(surface, deps, options);
            let result = null;
            if (managerElement && typeof managerElement.registerRemoteSurface === 'function') {
                result = managerElement.registerRemoteSurface(remoteSurface.sourceRecord || remoteSurface, remotePolicyOptions(options));
            } else if (managerElement && typeof managerElement.applyRemoteSurfacePolicy === 'function') {
                result = managerElement.applyRemoteSurfacePolicy(remoteSurface.sourceRecord || remoteSurface, {
                    ...remotePolicyOptions(options),
                    commit: true
                });
            } else {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.target.unsupported',
                    'x-surface-manager target does not support remote surface policy registration.',
                    'registerRemoteSurface',
                    'mount',
                    { surfaceId: surface.id, manager: surface.manager }
                ));
            }
            recordRemotePolicyDiagnostics(result, surface, diagnostics);
            return createSurfaceAdapterResult({
                ok: !!result && result.ok !== false,
                status: !result ? 'skipped' : (diagnostics.length > 0 ? 'degraded' : 'ok'),
                adapterId,
                operation: 'registerRemoteSurface',
                phase: 'mount',
                handle: { surface, result },
                diagnostics,
                metadata: {
                    surfaceId: surface.id,
                    decision: result && result.decision || null,
                    remoteRuntimeExecution: false
                }
            });
        }

        function registerSurface(surfaceInput = {}, options = {}) {
            const mapping = surfaceInput && surfaceInput.schema === SURFACE_ADAPTER_SCHEMA
                ? surfaceInput
                : mapSurfaces(surfaceInput, options);
            const diagnostics = mapping.diagnostics.slice();
            const registered = [];
            mapping.surfaces.forEach((surface) => {
                const managerElement = resolveSurfaceManagerTarget(surface, deps, options);
                const controllerRecord = createSurfaceControllerRecord(surface, managerElement);
                const result = surface.remoteSurface
                    ? (
                        managerElement && typeof managerElement.registerRemoteSurface === 'function'
                            ? managerElement.registerRemoteSurface(surface.remoteSurface, remotePolicyOptions(options))
                            : callSurfaceManager(managerElement, 'registerSurface', [controllerRecord], surface, diagnostics)
                    )
                    : callSurfaceManager(managerElement, 'registerSurface', [controllerRecord], surface, diagnostics);
                recordRemotePolicyDiagnostics(result, surface, diagnostics);
                if (result) registered.push({ surfaceId: surface.id, result });
            });
            return createSurfaceAdapterResult({
                ok: registered.length > 0,
                status: registered.length === 0 ? 'skipped' : (diagnostics.length > 0 ? 'degraded' : 'ok'),
                adapterId,
                operation: 'registerSurface',
                phase: 'mount',
                handle: { mapping, registered },
                diagnostics,
                metadata: {
                    surfaceCount: mapping.surfaceCount,
                    registeredCount: registered.length,
                    scheduleRefs: mapping.scheduleRefs
                }
            });
        }

        function runSurfaceOperation(operationName, managerMethodName, surfaceRef, payload = {}, options = {}) {
            const mapping = options.mapping || (options.document ? mapSurfaces(options.document, options) : null);
            const surface = resolveMappedSurface(surfaceRef, mapping, options);
            const diagnostics = [];
            if (!surface) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.operation.skipped',
                    `xtend.surface adapter could not resolve surface for ${operationName}.`,
                    operationName,
                    'activate',
                    { surfaceRef: cloneSerializable(surfaceRef, {}) }
                ));
                return createSurfaceAdapterResult({ ok: false, status: 'skipped', adapterId, operation: operationName, phase: 'activate', diagnostics });
            }
            const managerElement = resolveSurfaceManagerTarget(surface, deps, options);
            const args = operationName === 'closeSurface'
                ? [surface.id, payload && payload.reason]
                : (operationName === 'destroySurface'
                    ? [surface.id, payload]
                    : [surface.id, payload]);
            const result = callSurfaceManager(managerElement, managerMethodName, args, surface, diagnostics);
            return createSurfaceAdapterResult({
                ok: !!result && result.ok !== false,
                status: !result ? 'skipped' : (diagnostics.length > 0 ? 'degraded' : 'ok'),
                adapterId,
                operation: operationName,
                phase: 'activate',
                handle: { surface, result },
                diagnostics,
                metadata: {
                    surfaceId: surface.id,
                    manager: surface.manager,
                    component: surface.component
                }
            });
        }

        function dockSurface(surfaceRef, placement = 'right', mode = 'docked', options = {}) {
            const operationName = clampString(options.operation, 'dockSurface');
            const mapping = options.mapping || (options.document ? mapSurfaces(options.document, options) : null);
            const surface = resolveMappedSurface(surfaceRef, mapping, options);
            const diagnostics = [];
            if (!surface) {
                diagnostics.push(createSurfaceAdapterDiagnostic('rmt.surface.operation.skipped', `xtend.surface adapter could not resolve surface for ${operationName}.`, operationName, 'activate', { surfaceRef: cloneSerializable(surfaceRef, {}) }));
                return createSurfaceAdapterResult({ ok: false, status: 'skipped', adapterId, operation: operationName, phase: 'activate', diagnostics });
            }
            const managerElement = resolveSurfaceManagerTarget(surface, deps, options);
            let result = null;
            if (managerElement && typeof managerElement.dockSurface === 'function') {
                result = managerElement.dockSurface(surface.id, placement, mode);
            } else {
                result = callSurfaceManager(managerElement, 'updateSurface', [surface.id, { placement, mode }], surface, diagnostics);
            }
            return createSurfaceAdapterResult({
                ok: !!result && result.ok !== false,
                status: !result ? 'skipped' : (diagnostics.length > 0 ? 'degraded' : 'ok'),
                adapterId,
                operation: operationName,
                phase: 'activate',
                handle: { surface, result },
                diagnostics,
                metadata: { surfaceId: surface.id, placement, mode }
            });
        }

        function undockSurface(surfaceRef, options = {}) {
            return dockSurface(surfaceRef, '', 'floating', {
                ...options,
                operation: 'undockSurface'
            });
        }

        function governRemoteSurfaceEvent(eventRecord = {}, payload = {}, options = {}) {
            const diagnostics = [];
            const surface = resolveMappedSurface(options.surfaceRef || options.surface || eventRecord.surfaceId || eventRecord.surface, options.mapping || null, options) || {};
            const managerElement = resolveSurfaceManagerTarget(surface, deps, options) || options.managerElement || deps.managerElement || null;
            let result = null;
            if (managerElement && typeof managerElement.governRemoteSurfaceEvent === 'function') {
                result = managerElement.governRemoteSurfaceEvent(eventRecord, payload, {
                    ...remotePolicyOptions(options),
                    source: options.source || 'xtend.surface'
                });
            } else {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.remote_event_governance.blocked',
                    'x-surface-manager target does not support remote surface event governance.',
                    'governRemoteSurfaceEvent',
                    'diagnostics',
                    { event: eventRecord && eventRecord.event || null }
                ));
            }
            if (result && result.refused === true) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.remote_event_governance.blocked',
                    `Remote surface event "${result.event || 'unknown'}" was refused by host governance.`,
                    'governRemoteSurfaceEvent',
                    'diagnostics',
                    { event: result.event, scopes: result.scopes }
                ));
            }
            return createSurfaceAdapterResult({
                ok: !!result && result.ok !== false,
                status: !result ? 'skipped' : (diagnostics.length > 0 ? 'degraded' : 'ok'),
                adapterId,
                operation: 'governRemoteSurfaceEvent',
                phase: 'diagnostics',
                handle: { eventRecord: cloneSerializable(eventRecord, {}), payload: cloneSerializable(payload, {}), result },
                diagnostics,
                metadata: {
                    event: result && result.event || eventRecord && eventRecord.event || null,
                    runtimeDelivery: false,
                    implicitGlobalEventBus: false
                }
            });
        }

        function snapshotSurfaces(surfaceInput = {}, options = {}) {
            const mapping = surfaceInput && surfaceInput.schema === SURFACE_ADAPTER_SCHEMA
                ? surfaceInput
                : mapSurfaces(surfaceInput, options);
            const surface = mapping.surfaces[0] || {};
            const diagnostics = [];
            const managerElement = resolveSurfaceManagerTarget(surface, deps, options);
            const snapshot = managerElement && typeof managerElement.snapshot === 'function'
                ? managerElement.snapshot({ includeDestroyed: options.includeDestroyed === true })
                : null;
            if (!snapshot) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.target.missing',
                    'xtend.surface adapter returned a mapped snapshot because no x-surface-manager snapshot target was available.',
                    'snapshotSurfaces',
                    'snapshot',
                    { surfaceCount: mapping.surfaceCount },
                    'info'
                ));
            }
            return createSurfaceAdapterResult({
                ok: true,
                status: diagnostics.length > 0 ? 'degraded' : 'ok',
                adapterId,
                operation: 'snapshotSurfaces',
                phase: 'snapshot',
                handle: { mapping, snapshot },
                diagnostics,
                metadata: {
                    source: snapshot ? 'x-surface-manager' : 'mapping',
                    surfaceCount: snapshot && Array.isArray(snapshot.surfaces) ? snapshot.surfaces.length : mapping.surfaceCount
                }
            });
        }

        function materializeSurfaces(surfaceInput = {}, options = {}) {
            const mapping = surfaceInput && surfaceInput.schema === SURFACE_ADAPTER_SCHEMA
                ? surfaceInput
                : mapSurfaces(surfaceInput, options);
            const diagnostics = mapping.diagnostics.slice();
            const documentTarget = resolveSurfaceMaterializationDocument(options.root || deps.root, deps, options);
            const rootTarget = resolveSurfaceMaterializationRoot(documentTarget, deps, options);
            const componentIndex = collectSurfaceMaterializationComponents(mapping, deps, options);
            const materialized = [];
            const bound = [];
            const registered = [];
            const managerHandles = [];
            const renderer = documentTarget
                ? resolveSurfaceDomRenderer(documentTarget, options, diagnostics)
                : null;
            const state = {
                deps,
                options,
                documentTarget,
                rootTarget,
                renderer,
                managersById: new Map(),
                createdManagers: [],
                commitReports: []
            };

            if (!documentTarget) {
                diagnostics.push(createSurfaceAdapterDiagnostic(
                    'rmt.surface.materialization.target.missing',
                    'xtend.surface adapter needs a DOM document with createElement() to materialize native surfaces.',
                    'materializeSurfaces',
                    'mount',
                    { surfaceCount: mapping.surfaceCount }
                ));
                return createSurfaceAdapterResult({
                    ok: false,
                    status: 'skipped',
                    adapterId,
                    operation: 'materializeSurfaces',
                    phase: 'mount',
                    handle: { mapping, materialized, bound, registered, managers: managerHandles },
                    diagnostics,
                    metadata: {
                        schema: SURFACE_MATERIALIZATION_SCHEMA,
                        surfaceCount: mapping.surfaceCount,
                        materializedCount: 0,
                        boundCount: 0,
                        managerCount: 0,
                        createsSecondRegistry: false
                    }
                });
            }

            mapping.surfaces.forEach((surface) => {
                const managerElement = resolveOrCreateSurfaceManagerElement(surface, state);
                if (!managerElement || typeof managerElement.appendChild !== 'function') {
                    diagnostics.push(createSurfaceAdapterDiagnostic(
                        'rmt.surface.materialization.target.missing',
                        `xtend.surface adapter could not resolve a materialization target for surface "${surface.id}".`,
                        'materializeSurfaces',
                        'mount',
                        { surfaceId: surface.id, manager: surface.manager }
                    ));
                    return;
                }

                const managerId = ensureSurfaceManagerRuntimeId(managerElement, surface.manager);
                if (!managerHandles.some((entry) => entry.managerId === managerId)) {
                    managerHandles.push({ managerId, element: managerElement, created: state.createdManagers.some((entry) => entry.managerId === managerId) });
                }

                let surfaceElement = findSurfaceMaterializedElement(managerElement, surface);
                let contentElement = null;
                let created = false;
                const tag = resolveSurfaceMaterializedTag(surface);
                const descriptor = createSurfaceMaterializedDescriptor(
                    surface,
                    managerId,
                    documentTarget,
                    componentIndex
                );
                if (surfaceElement) {
                    const patchDescriptor = { ...descriptor };
                    delete patchDescriptor.children;
                    const commitResult = commitSurfaceDescriptor(renderer, {
                        operation: 'merge-element',
                        target: surfaceElement,
                        descriptor: patchDescriptor
                    }, deps, options);
                    state.commitReports.push(commitResult);
                    bound.push({ surfaceId: surface.id, tag: surfaceElement.localName || tag, slot: resolveSurfaceMaterializedSlot(surface), element: surfaceElement, managerElement });
                } else {
                    const commitResult = commitSurfaceDescriptor(renderer, {
                        operation: 'create-node',
                        descriptor
                    }, deps, options);
                    surfaceElement = commitResult.nodes && commitResult.nodes[0] || null;
                    if (!surfaceElement) {
                        const error = new Error(`xtend.surface renderer returned no node for surface "${surface.id}".`);
                        error.code = 'rmt.surface.dom_commit.invalid_result';
                        throw error;
                    }
                    contentElement = surfaceElement.children && surfaceElement.children[0] || null;
                    managerElement.appendChild(surfaceElement);
                    state.commitReports.push(commitResult);
                    created = true;
                    materialized.push({ surfaceId: surface.id, tag, slot: resolveSurfaceMaterializedSlot(surface), element: surfaceElement, contentElement, managerElement });
                }

                if (typeof managerElement.registerSurface === 'function') {
                    const controllerRecord = createSurfaceControllerRecord(surface, managerElement);
                    const registrationInput = surfaceElement && typeof surfaceElement.toSurfaceRecord === 'function'
                        ? surfaceElement
                        : controllerRecord;
                    const result = callSurfaceManager(managerElement, 'registerSurface', [registrationInput], surface, diagnostics);
                    if (result) {
                        registered.push({ surfaceId: surface.id, created, result });
                    }
                }
            });

            const activeSurfaceCount = materialized.length + bound.length;
            return createSurfaceAdapterResult({
                ok: activeSurfaceCount > 0,
                status: activeSurfaceCount === 0 ? 'skipped' : (diagnostics.length > 0 ? 'degraded' : 'ok'),
                adapterId,
                operation: 'materializeSurfaces',
                phase: 'mount',
                handle: {
                    schema: SURFACE_MATERIALIZATION_SCHEMA,
                    mapping,
                    materialized,
                    bound,
                    registered,
                    managers: managerHandles,
                    commitReports: state.commitReports.slice()
                },
                diagnostics,
                metadata: {
                    schema: SURFACE_MATERIALIZATION_SCHEMA,
                    surfaceCount: mapping.surfaceCount,
                    materializedCount: materialized.length,
                    boundCount: bound.length,
                    registeredCount: registered.length,
                    managerCount: managerHandles.length,
                    createdManagerCount: state.createdManagers.length,
                    createsSecondRegistry: false
                }
            });
        }

        function emitDiagnostic(event = {}, payload = {}, options = {}) {
            const diagnostic = publishSurfaceAdapterDiagnostic(event, payload, deps, options);
            return createSurfaceAdapterResult({
                ok: true,
                status: 'ok',
                adapterId,
                operation: 'emitDiagnostic',
                phase: 'diagnostics',
                handle: { event: cloneSerializable(event, {}), payload: cloneSerializable(payload, {}) },
                diagnostics: [diagnostic],
                metadata: payload
            });
        }

        return Object.freeze({
            id: adapterId,
            schema: SURFACE_ADAPTER_SCHEMA,
            kind: 'surface_adapter',
            version: DOCUMENT_VERSION,
            runtimeSurface: Object.freeze([...SURFACE_ADAPTER_OPERATIONS, 'materializeSurfaces']),
            capabilities: Object.freeze({
                providedCapabilities: Object.freeze(['surfaces', 'nativeSurfaces', 'surfaceMaterialization', 'remoteSurfacePolicy', 'remoteSurfaceTrust', 'remoteSurfaceDegradation', 'remoteEventGovernance', 'multiWindow', 'sidePanels', 'overlaySurfaces', 'stateBridge', 'diagnostics', 'scheduleRefs']),
                requiredCapabilities: Object.freeze(['x-surface-manager', 'xtend.surface.controller.v2']),
                preferredCapabilities: Object.freeze(['xtend.component', 'xtend.xrouter', 'rmt.state-scheduler-diagnostics', 'fabric'])
            }),
            definition: Object.freeze({
                id: adapterId,
                kind: 'surface_adapter',
                version: DOCUMENT_VERSION,
                runtimeSurface: Object.freeze([...SURFACE_ADAPTER_OPERATIONS, 'materializeSurfaces']),
                capabilities: Object.freeze({
                    providedCapabilities: Object.freeze(['surfaces', 'nativeSurfaces', 'surfaceMaterialization', 'remoteSurfacePolicy', 'remoteSurfaceTrust', 'remoteSurfaceDegradation', 'remoteEventGovernance', 'multiWindow', 'sidePanels', 'overlaySurfaces', 'stateBridge', 'diagnostics', 'scheduleRefs'])
                }),
                kernelVisible: false,
                metadata: Object.freeze({
                    schema: SURFACE_ADAPTER_SCHEMA,
                    materializationSchema: SURFACE_MATERIALIZATION_SCHEMA,
                    remotePolicySchema: 'xtend.surface.remote-policy-bridge.v1',
                    inputContract: RUNTIME_REGISTRY_SCHEMA,
                    runtimeImplemented: true,
                    remoteRuntimeExecution: false,
                    createsSecondRegistry: false
                })
            }),
            mapSurface: (surfaceEntry, options = {}) => normalizeSurfaceAdapterEntry(surfaceEntry, {}, options),
            mapSurfaces,
            registerSurface,
            registerRemoteSurface,
            applyRemoteSurfacePolicy,
            openSurface: (surfaceRef, input = {}, options = {}) => runSurfaceOperation('openSurface', 'openSurface', surfaceRef, input, options),
            closeSurface: (surfaceRef, reason, options = {}) => runSurfaceOperation('closeSurface', 'closeSurface', surfaceRef, { reason }, options),
            destroySurface: (surfaceRef, input = {}, options = {}) => runSurfaceOperation('destroySurface', 'destroySurface', surfaceRef, input, options),
            focusSurface: (surfaceRef, input = {}, options = {}) => runSurfaceOperation('focusSurface', 'focusSurface', surfaceRef, input, options),
            moveSurface: (surfaceRef, bounds = {}, options = {}) => runSurfaceOperation('moveSurface', 'moveSurface', surfaceRef, bounds, options),
            resizeSurface: (surfaceRef, bounds = {}, options = {}) => runSurfaceOperation('resizeSurface', 'resizeSurface', surfaceRef, bounds, options),
            dockSurface,
            undockSurface,
            snapshotSurfaces,
            materializeSurfaces,
            governRemoteSurfaceEvent,
            emitDiagnostic,
            listDiagnosticCodes: () => SURFACE_ADAPTER_DIAGNOSTIC_CODES.slice()
        });
    };

})(__XTENDRMT_GLOBAL__);

/* modules/rmt-state-telemetry-adapter.js */
(function registerRmtStateTelemetryAdapter(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const DOCUMENT_VERSION = '1.0';
    const RUNTIME_REGISTRY_SCHEMA = 'xtend.rmt.runtime-registry.v1';
    const XROUTER_ADAPTER_SCHEMA = 'xtend.rmt.xrouter-adapter.v1';
    const XTEND_COMPONENT_ADAPTER_SCHEMA = 'xtend.rmt.xtend-component-adapter.v1';
    const STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA = 'xtend.rmt.state-scheduler-diagnostics-bridge.v1';
    const STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_ID = 'rmt.state-scheduler-diagnostics';
    const STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_DIAGNOSTIC_CODES = Object.freeze([
        'rmt.bridge.state.mirrored',
        'rmt.bridge.state.unavailable',
        'rmt.bridge.scheduler.endpoint.scheduled',
        'rmt.bridge.scheduler.endpoint.queued',
        'rmt.bridge.diagnostics.emitted',
        'rmt.bridge.adapter.result.degraded',
        'rmt.bridge.telemetry.snapshot.recorded',
        'rmt.bridge.backpressure.signal.recorded',
        'rmt.bridge.backpressure.high',
        'rmt.bridge.backpressure.critical'
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

    function createStateSchedulerDiagnosticsBridgeDiagnostic(code, message, operation = 'emitDiagnostic', phase = 'diagnose', metadata = {}, level = 'info') {
        return Object.freeze({
            level: clampString(level, 'info'),
            code: clampString(code, ''),
            message: clampString(message, ''),
            adapterId: STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_ID,
            operation: clampString(operation, 'emitDiagnostic'),
            phase: clampString(phase, 'diagnose'),
            metadata: cloneSerializable(metadata, {})
        });
    }

    function createStateSchedulerDiagnosticsBridgeResult(options = {}) {
        return Object.freeze({
            ok: options.ok !== false,
            status: clampString(options.status, options.ok === false ? 'failed' : 'ok'),
            adapterId: clampString(options.adapterId, STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_ID),
            operation: clampString(options.operation, ''),
            phase: clampString(options.phase, ''),
            handle: options.handle || null,
            diagnostics: Object.freeze((Array.isArray(options.diagnostics) ? options.diagnostics : []).map((entry) => Object.freeze(entry))),
            metadata: cloneSerializable(options.metadata, {})
        });
    }

    function normalizeBridgeDiagnosticEvent(event = {}, payload = {}, defaults = {}) {
        const safeEvent = toPlainObject(event);
        return createStateSchedulerDiagnosticsBridgeDiagnostic(
            clampString(safeEvent.code, defaults.code || 'rmt.bridge.diagnostics.emitted'),
            clampString(safeEvent.message, defaults.message || 'RMT bridge diagnostic emitted.'),
            clampString(safeEvent.operation, defaults.operation || 'emitDiagnostic'),
            clampString(safeEvent.phase, defaults.phase || 'diagnose'),
            {
                ...cloneSerializable(safeEvent.metadata, {}),
                payload: cloneSerializable(payload, {})
            },
            clampString(safeEvent.level, defaults.level || 'info')
        );
    }

    function redactBridgeTelemetryValue(value) {
        const sensitiveKeyPattern = /(?:authorization|cookie|credential|form|header|password|secret|token)/i;
        if (Array.isArray(value)) {
            return value.map((entry) => redactBridgeTelemetryValue(entry));
        }
        if (value && typeof value === 'object') {
            const output = {};
            Object.keys(value).forEach((key) => {
                output[key] = sensitiveKeyPattern.test(key)
                    ? '[redacted]'
                    : redactBridgeTelemetryValue(value[key]);
            });
            return output;
        }
        return value;
    }

    function cloneBridgeTelemetry(value, fallbackValue = null) {
        return redactBridgeTelemetryValue(cloneSerializable(value, fallbackValue));
    }

    function isPressureLevel(value) {
        const level = clampString(value, 'none');
        return level === 'high' || level === 'critical';
    }

    function diagnosticCodeForBackpressureLevel(level) {
        if (level === 'critical') return 'rmt.bridge.backpressure.critical';
        if (level === 'high') return 'rmt.bridge.backpressure.high';
        return 'rmt.bridge.backpressure.signal.recorded';
    }

    function diagnosticLevelForBackpressureLevel(level) {
        if (level === 'critical') return 'error';
        if (level === 'high') return 'warn';
        return 'info';
    }

    function normalizeBridgeBackpressureSignal(signalInput = {}, defaultsInput = {}) {
        const signal = toPlainObject(signalInput);
        const defaults = toPlainObject(defaultsInput);
        const level = clampString(signal.level, defaults.level || 'none');
        const score = Number.isFinite(Number(signal.score))
            ? Number(signal.score)
            : (Number.isFinite(Number(defaults.score)) ? Number(defaults.score) : 0);
        const action = clampString(signal.action, defaults.action || (
            level === 'critical' ? 'protect-user-blocking-work'
                : level === 'high' ? 'defer-background-work'
                    : level === 'medium' ? 'coalesce-idle-work'
                        : level === 'low' ? 'observe'
                            : 'continue'
        ));
        return Object.freeze({
            schema: clampString(signal.schema, defaults.schema || 'xtend.fabric.backpressure-signal.v1'),
            id: clampString(signal.id, defaults.id || ''),
            timestamp: signal.timestamp || defaults.timestamp,
            level,
            score,
            action,
            lane: clampString(signal.lane, defaults.lane || 'diagnostics'),
            source: clampString(signal.source, defaults.source || 'fabric'),
            reason: clampString(signal.reason, defaults.reason || 'telemetry-snapshot'),
            componentRef: signal.componentRef || defaults.componentRef,
            routeRef: signal.routeRef || defaults.routeRef,
            scheduleRef: signal.scheduleRef || defaults.scheduleRef,
            fiberId: signal.fiberId || defaults.fiberId,
            correlationId: signal.correlationId || defaults.correlationId,
            signalCount: Number.isFinite(Number(signal.signalCount)) ? Number(signal.signalCount) : undefined,
            signals: Array.isArray(signal.signals) ? cloneBridgeTelemetry(signal.signals, []) : undefined,
            byLane: cloneBridgeTelemetry(signal.byLane, undefined),
            metadata: cloneBridgeTelemetry(signal.metadata || defaults.metadata || {}, {})
        });
    }

    function collectBridgeSchedules(deps = {}, options = {}) {
        const values = [];
        [
            options.schedules,
            deps.schedules,
            options.document && options.document['schedules'],
            deps.document && deps.document['schedules']
        ]
            .forEach((schedules) => {
                if (Array.isArray(schedules)) values.push(...schedules);
            });
        return values.map((schedule) => toPlainObject(schedule)).filter((schedule) => Object.keys(schedule).length > 0);
    }

    function normalizeBridgeSchedulePolicy(scheduleRef, deps = {}, options = {}) {
        const ref = normalizeScheduleReference(scheduleRef || options.schedule || options.scheduleRef || '');
        const inlineSchedule = scheduleRef && typeof scheduleRef === 'object' ? toPlainObject(scheduleRef) : {};
        const schedules = collectBridgeSchedules(deps, options);
        const matchedSchedule = schedules.find((schedule) => (
            clampString(schedule.id, '') === ref || clampString(schedule.endpointName, '') === ref
        )) || {};
        const rawSchedule = Object.keys(inlineSchedule).length > 0 ? inlineSchedule : matchedSchedule;
        const endpointName = clampString(
            rawSchedule.endpointName || options.endpointName || ref,
            ref || 'xtendrmt.bridge.endpoint'
        );
        const scope = clampString(rawSchedule.scope || options.scope, 'rmt.bridge');
        return Object.freeze({
            id: clampString(rawSchedule.id || ref, endpointName),
            endpointName,
            scope,
            lane: clampString(rawSchedule.lane || options.lane, 'visible'),
            priority: Number.isFinite(rawSchedule.priority) ? rawSchedule.priority : (Number.isFinite(options.priority) ? options.priority : 50),
            deadlineMs: Number.isFinite(rawSchedule.deadlineMs) ? rawSchedule.deadlineMs : (Number.isFinite(options.deadlineMs) ? options.deadlineMs : 120),
            preferIdle: rawSchedule.preferIdle === true || options.preferIdle === true,
            coalesceKey: clampString(rawSchedule.coalesceKey || options.coalesceKey, `${scope}:${endpointName}`),
            budgetClass: clampString(rawSchedule.budgetClass || options.budgetClass, 'interactive'),
            maxRetries: Number.isFinite(rawSchedule.maxRetries) ? rawSchedule.maxRetries : (Number.isFinite(options.maxRetries) ? options.maxRetries : 0),
            timeoutMs: Number.isFinite(rawSchedule.timeoutMs) ? rawSchedule.timeoutMs : (Number.isFinite(options.timeoutMs) ? options.timeoutMs : 0),
            metadata: cloneSerializable(rawSchedule.metadata || options.metadata, {})
        });
    }

    function resolveBridgeSchedulerTarget(deps = {}, options = {}) {
        return options.scheduler
            || deps.scheduler
            || null;
    }

    appModules.createRmtStateSchedulerDiagnosticsBridge = function createRmtStateSchedulerDiagnosticsBridge(deps = {}) {
        const adapterId = clampString(deps.adapterId, STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_ID);
        const stateValues = {};
        const diagnostics = [];
        const scheduledEndpoints = [];
        const telemetrySnapshots = [];
        const backpressureSignals = [];
        const maxTelemetryRecords = Number.isFinite(Number(deps.maxTelemetryRecords)) && Number(deps.maxTelemetryRecords) > 0
            ? Math.max(Math.floor(Number(deps.maxTelemetryRecords)), 8)
            : 80;

        function publishBridgeDiagnostic(diagnostic) {
            const hub = deps.diagnosticsHub || null;
            if (hub && typeof hub.publish === 'function') {
                hub.publish(diagnostic);
            } else if (hub && typeof hub.emit === 'function') {
                hub.emit('rmt-diagnostic', diagnostic);
            } else if (hub && typeof hub.record === 'function') {
                hub.record(diagnostic);
            }
        }

        function getStateProjectionPort() {
            return deps.stateProjectionPort && typeof deps.stateProjectionPort.batchUpdate === 'function'
                ? deps.stateProjectionPort
                : null;
        }

        function writeState(key, value, options = {}) {
            const safeKey = clampString(key, '');
            if (!safeKey) return false;
            stateValues[safeKey] = cloneSerializable(value, value);
            const stateProjectionPort = getStateProjectionPort();
            let mirrored = false;
            if (stateProjectionPort) {
                stateProjectionPort.batchUpdate({ [safeKey]: cloneSerializable(value, value) }, {
                    operation: 'rmt.state-telemetry.project',
                    key: safeKey,
                    ...cloneSerializable(options.metadata, {})
                });
                mirrored = true;
            }
            return mirrored;
        }

        function readState(key, fallbackValue = null) {
            const safeKey = clampString(key, '');
            return Object.prototype.hasOwnProperty.call(stateValues, safeKey)
                ? stateValues[safeKey]
                : fallbackValue;
        }

        function pushTelemetryRecord(buffer, record) {
            buffer.push(cloneBridgeTelemetry(record, {}));
            if (buffer.length > maxTelemetryRecords) {
                buffer.splice(0, buffer.length - maxTelemetryRecords);
            }
            return buffer[buffer.length - 1] || null;
        }

        function mapBridgeBackpressureLane(lane) {
            const safeLane = clampString(lane, 'diagnostics');
            if (safeLane === 'user-blocking' || safeLane === 'critical' || safeLane === 'critical_input') return 'critical_input';
            if (safeLane === 'visible' || safeLane === 'visible_commit') return 'visible_commit';
            if (safeLane === 'transition' || safeLane === 'hydration' || safeLane === 'hydration_followup') return 'hydration_followup';
            if (safeLane === 'background' || safeLane === 'background_prepare') return 'background_prepare';
            return 'idle_maintenance';
        }

        function createBridgeBackpressurePerformanceSample(signal = {}, options = {}) {
            const level = clampString(signal.level, 'none');
            const score = Number.isFinite(Number(signal.score)) ? Math.max(Number(signal.score), 0) : 0;
            const critical = level === 'critical';
            const high = level === 'high';
            return Object.freeze({
                source: 'rmt.bridge.fabric-backpressure',
                sampleType: 'fabric_backpressure',
                lane: mapBridgeBackpressureLane(signal.lane || options.lane),
                durationMs: critical ? Math.max(score * 4, 64) : (high ? Math.max(score * 2, 16) : Math.max(score, 0)),
                waitMs: critical ? Math.max(score * 6, 96) : (high ? Math.max(score * 4, 40) : 0),
                droppedFrameCount: critical ? Math.max(Math.ceil(score / 2), 1) : 0,
                longTask: critical,
                backpressureLevel: level,
                backpressureAction: signal.action,
                reason: signal.reason,
                routeRef: signal.routeRef || options.routeRef,
                componentRef: signal.componentRef || options.componentRef,
                scheduleRef: signal.scheduleRef || options.scheduleRef,
                correlationId: signal.correlationId || options.correlationId,
                metadata: cloneBridgeTelemetry({
                    source: signal.source,
                    signalCount: signal.signalCount,
                    snapshotId: options.snapshotId,
                    action: signal.action
                }, {})
            });
        }

        function recordSchedulerPressureSample(signal = {}, options = {}) {
            const target = resolveBridgeSchedulerTarget(deps, options);
            const sample = createBridgeBackpressurePerformanceSample(signal, options);
            let targetResult = null;
            let scheduled = false;
            try {
                if (target && typeof target.reportPerformanceSample === 'function') {
                    targetResult = target.reportPerformanceSample(sample);
                    scheduled = true;
                } else if (typeof deps.reportPerformanceSample === 'function') {
                    targetResult = deps.reportPerformanceSample(sample);
                    scheduled = true;
                }
            } catch (error) {
                emitDiagnostic({
                    code: 'rmt.bridge.backpressure.signal.recorded',
                    message: 'RMT bridge could not forward Fabric backpressure to scheduler diagnostics.',
                    operation: 'recordBackpressureSignal',
                    phase: 'diagnose',
                    level: 'warn',
                    metadata: {
                        errorName: clampString(error && error.name, 'Error'),
                        backpressureLevel: signal.level,
                        backpressureScore: signal.score
                    }
                }, {}, options);
            }
            const pressureLevel = targetResult && targetResult.pressureLevel
                ? targetResult.pressureLevel
                : (targetResult && typeof targetResult.getPressureLevel === 'function' ? targetResult.getPressureLevel() : undefined);
            return Object.freeze({
                scheduled,
                sample,
                targetResult: cloneBridgeTelemetry(targetResult, null),
                pressureLevel
            });
        }

        function emitDiagnostic(event = {}, payload = {}, options = {}) {
            const diagnostic = normalizeBridgeDiagnosticEvent(event, payload);
            diagnostics.push(diagnostic);
            writeState('rmt.diagnostics.last', diagnostic, options);
            const hub = options.diagnosticsHub || deps.diagnosticsHub || null;
            if (hub && typeof hub.publish === 'function') {
                hub.publish(diagnostic);
            } else if (hub && typeof hub.emit === 'function') {
                hub.emit('rmt-diagnostic', diagnostic);
            } else if (hub && typeof hub.record === 'function') {
                hub.record(diagnostic);
            }
            return createStateSchedulerDiagnosticsBridgeResult({
                ok: true,
                status: 'ok',
                adapterId,
                operation: 'emitDiagnostic',
                phase: 'diagnose',
                handle: { diagnostic },
                diagnostics: [diagnostic],
                metadata: {
                    code: diagnostic.code,
                    mirroredToState: readState('rmt.diagnostics.last', null, options) !== null
                }
            });
        }

        function createStateBridge(options = {}) {
            const stateProjectionPort = getStateProjectionPort();
            const hasExternalState = Boolean(stateProjectionPort);
            const bridgeHandle = Object.freeze({
                set(key, value, metadata = {}) {
                    const mirrored = writeState(key, value, { ...options, metadata });
                    return Object.freeze({
                        key: clampString(key, ''),
                        mirrored,
                        value: cloneSerializable(value, value),
                        metadata: cloneSerializable(metadata, {})
                    });
                },
                get(key, fallbackValue = null) {
                    return readState(key, fallbackValue, options);
                },
                snapshot() {
                    return cloneSerializable(stateValues, {});
                },
                publish(eventName, payload = {}, metadata = {}) {
                    return emitDiagnostic({
                        code: 'rmt.bridge.state.mirrored',
                        message: `RMT bridge mirrored state event "${eventName}".`,
                        operation: 'createStateBridge',
                        phase: 'state',
                        level: 'info',
                        metadata: {
                            eventName,
                            ...metadata
                        }
                    }, payload, options);
                }
            });
            writeState('rmt.bridge.ready', {
                schema: STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA,
                adapterId,
                externalState: hasExternalState
            }, options);
            const operationDiagnostics = hasExternalState
                ? []
                : [createStateSchedulerDiagnosticsBridgeDiagnostic(
                    'rmt.bridge.state.unavailable',
                    'RMT bridge created an in-memory state bridge because no batch-capable State Projection Port was provided.',
                    'createStateBridge',
                    'state',
                    { adapterId },
                    'info'
                )];
            return createStateSchedulerDiagnosticsBridgeResult({
                ok: true,
                status: hasExternalState ? 'ok' : 'degraded',
                adapterId,
                operation: 'createStateBridge',
                phase: 'state',
                handle: bridgeHandle,
                diagnostics: operationDiagnostics,
                metadata: {
                    externalState: hasExternalState,
                    schema: STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA
                }
            });
        }

        function scheduleEndpoint(endpointName, scope, callback = () => undefined, options = {}) {
            const schedule = normalizeBridgeSchedulePolicy(options.schedule || options.scheduleRef || endpointName, deps, {
                ...options,
                endpointName,
                scope
            });
            const schedulerTarget = resolveBridgeSchedulerTarget(deps, options);
            const jobContext = Object.freeze({
                endpointName: schedule.endpointName,
                scope: schedule.scope,
                schedule,
                metadata: cloneSerializable(options.metadata, {})
            });
            let targetResult = null;
            let status = 'queued';
            let diagnosticCode = 'rmt.bridge.scheduler.endpoint.queued';
            if (schedulerTarget && typeof schedulerTarget.scheduleEndpoint === 'function') {
                targetResult = schedulerTarget.scheduleEndpoint(schedule.endpointName, schedule.scope, callback, {
                    ...options,
                    schedule,
                    source: STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA
                });
                status = 'scheduled';
                diagnosticCode = 'rmt.bridge.scheduler.endpoint.scheduled';
            } else {
                throw new TypeError('RMT State/Telemetry Bridge requires one kernel scheduler authority.');
            }
            const endpointRecord = Object.freeze({
                status,
                endpointName: schedule.endpointName,
                scope: schedule.scope,
                schedule,
                targetResult: cloneSerializable(targetResult, null)
            });
            scheduledEndpoints.push(endpointRecord);
            writeState('rmt.scheduler.lastEndpoint', endpointRecord, options);
            const diagnostic = createStateSchedulerDiagnosticsBridgeDiagnostic(
                diagnosticCode,
                status === 'scheduled'
                    ? `RMT bridge scheduled endpoint "${schedule.endpointName}".`
                    : `RMT bridge queued endpoint "${schedule.endpointName}" without executing host scheduler work.`,
                'scheduleEndpoint',
                'schedule',
                {
                    endpointName: schedule.endpointName,
                    scope: schedule.scope,
                    scheduleRef: schedule.id,
                    budgetClass: schedule.budgetClass,
                    deadlineMs: schedule.deadlineMs
                },
                status === 'scheduled' ? 'info' : 'warn'
            );
            diagnostics.push(diagnostic);
            const bridgeResult = createStateSchedulerDiagnosticsBridgeResult({
                ok: true,
                status: status === 'scheduled' ? 'ok' : 'degraded',
                adapterId,
                operation: 'scheduleEndpoint',
                phase: 'schedule',
                handle: {
                    ...endpointRecord,
                    targetResult
                },
                diagnostics: [diagnostic],
                metadata: {
                    endpointName: schedule.endpointName,
                    scope: schedule.scope,
                    scheduleRef: schedule.id,
                    budgetClass: schedule.budgetClass,
                    scheduled: status === 'scheduled'
                }
            });
            return targetResult && targetResult.schema === 'xtend.rmt.kernel-job.v1'
                ? targetResult
                : bridgeResult;
        }

        function recordAdapterResult(result = {}, options = {}) {
            const safeResult = toPlainObject(result);
            const metadata = toPlainObject(safeResult.metadata);
            const adapterResult = {
                ok: safeResult.ok === true,
                status: clampString(safeResult.status, safeResult.ok === true ? 'ok' : 'failed'),
                adapterId: clampString(safeResult.adapterId, ''),
                operation: clampString(safeResult.operation, ''),
                phase: clampString(safeResult.phase, ''),
                metadata: cloneSerializable(metadata, {})
            };
            const scheduleRef = normalizeScheduleReference(
                options.schedule || options.scheduleRef || metadata.scheduleRef || metadata.schedule || ''
            );
            writeState('rmt.adapter.lastResult', adapterResult, options);
            if (adapterResult.adapterId && adapterResult.operation) {
                writeState(`rmt.adapter.${adapterResult.adapterId}.${adapterResult.operation}.status`, adapterResult.status, options);
            }
            if (metadata.routeId) {
                writeState(`rmt.route.${metadata.routeId}.lastResult`, adapterResult, options);
            }
            if (metadata.componentId) {
                writeState(`rmt.component.${metadata.componentId}.lastResult`, adapterResult, options);
            }
            const resultDiagnostics = Array.isArray(safeResult.diagnostics) ? safeResult.diagnostics : [];
            resultDiagnostics.forEach((diagnostic) => {
                emitDiagnostic(diagnostic, {
                    adapterId: adapterResult.adapterId,
                    operation: adapterResult.operation
                }, options);
            });
            if (adapterResult.status !== 'ok') {
                emitDiagnostic({
                    code: 'rmt.bridge.adapter.result.degraded',
                    message: `RMT bridge observed ${adapterResult.status} adapter result from "${adapterResult.adapterId}".`,
                    operation: 'recordAdapterResult',
                    phase: 'diagnose',
                    level: adapterResult.status === 'failed' ? 'error' : 'warn',
                    metadata: adapterResult
                }, {}, options);
            }
            let scheduleResult = null;
            if (scheduleRef) {
                const schedule = normalizeBridgeSchedulePolicy(scheduleRef, deps, options);
                scheduleResult = scheduleEndpoint(schedule.endpointName, schedule.scope, () => adapterResult, {
                    ...options,
                    schedule,
                    metadata: {
                        adapterId: adapterResult.adapterId,
                        operation: adapterResult.operation,
                        phase: adapterResult.phase
                    }
                });
            }
            return createStateSchedulerDiagnosticsBridgeResult({
                ok: true,
                status: adapterResult.status === 'ok' ? 'ok' : 'degraded',
                adapterId,
                operation: 'recordAdapterResult',
                phase: 'diagnose',
                handle: {
                    adapterResult,
                    scheduleResult
                },
                diagnostics: Object.freeze(resultDiagnostics.map((entry) => normalizeBridgeDiagnosticEvent(entry, {}, {
                    operation: 'recordAdapterResult',
                    phase: 'diagnose'
                }))),
                metadata: {
                    adapterId: adapterResult.adapterId,
                    operation: adapterResult.operation,
                    status: adapterResult.status,
                    scheduleRef,
                    scheduled: !!scheduleResult
                }
            });
        }

        function recordBackpressureSignal(signal = {}, options = {}) {
            const safeSignal = normalizeBridgeBackpressureSignal(signal, {
                source: options.source || 'fabric',
                routeRef: options.routeRef,
                scheduleRef: options.scheduleRef,
                correlationId: options.correlationId,
                metadata: options.metadata
            });
            const pressureSample = recordSchedulerPressureSample(safeSignal, options);
            pushTelemetryRecord(backpressureSignals, {
                ...safeSignal,
                schedulerPressureLevel: pressureSample.pressureLevel,
                schedulerPressureSampled: pressureSample.scheduled
            });
            writeState('rmt.backpressure.lastSignal', safeSignal, options);
            writeState('rmt.backpressure.profile', safeSignal, options);
            writeState('rmt.backpressure.level', safeSignal.level, options);
            writeState('rmt.backpressure.action', safeSignal.action, options);
            writeState('rmt.backpressure.lastYieldHint', {
                action: safeSignal.action,
                level: safeSignal.level,
                lane: safeSignal.lane,
                schedulerLane: pressureSample.sample.lane,
                schedulerPressureLevel: pressureSample.pressureLevel || safeSignal.level,
                scheduleRef: safeSignal.scheduleRef,
                correlationId: safeSignal.correlationId
            }, options);
            if (safeSignal.routeRef) {
                writeState(`rmt.route.${safeSignal.routeRef}.backpressure`, safeSignal, options);
            }
            if (safeSignal.componentRef) {
                writeState(`rmt.component.${safeSignal.componentRef}.backpressure`, safeSignal, options);
            }

            const diagnostic = emitDiagnostic({
                code: diagnosticCodeForBackpressureLevel(safeSignal.level),
                message: isPressureLevel(safeSignal.level)
                    ? `RMT bridge observed ${safeSignal.level} Fabric backpressure.`
                    : 'RMT bridge recorded Fabric backpressure signal.',
                operation: 'recordBackpressureSignal',
                phase: 'diagnose',
                level: diagnosticLevelForBackpressureLevel(safeSignal.level),
                metadata: {
                    backpressure: safeSignal,
                    backpressureLevel: safeSignal.level,
                    backpressureScore: safeSignal.score,
                    backpressureAction: safeSignal.action,
                    routeRef: safeSignal.routeRef,
                    scheduleRef: safeSignal.scheduleRef,
                    correlationId: safeSignal.correlationId,
                    schedulerPressureSampled: pressureSample.scheduled,
                    schedulerPressureLevel: pressureSample.pressureLevel
                }
            }, {}, options);

            return createStateSchedulerDiagnosticsBridgeResult({
                ok: true,
                status: isPressureLevel(safeSignal.level) ? 'degraded' : 'ok',
                adapterId,
                operation: 'recordBackpressureSignal',
                phase: 'diagnose',
                handle: { backpressureSignal: safeSignal },
                diagnostics: diagnostic.diagnostics,
                metadata: {
                    backpressureLevel: safeSignal.level,
                    backpressureScore: safeSignal.score,
                    backpressureAction: safeSignal.action,
                    schedulerPressureSampled: pressureSample.scheduled,
                    schedulerPressureLevel: pressureSample.pressureLevel,
                    routeRef: safeSignal.routeRef,
                    scheduleRef: safeSignal.scheduleRef
                }
            });
        }

        function recordTelemetrySnapshot(snapshot = {}, options = {}) {
            const safeSnapshot = cloneBridgeTelemetry(snapshot, {});
            const snapshotMetadata = toPlainObject(safeSnapshot.metadata);
            const backpressure = toPlainObject(safeSnapshot.backpressure);
            const snapshotId = clampString(safeSnapshot.id, '');
            const routeRef = clampString(
                options.routeRef || safeSnapshot.routeRef || snapshotMetadata.routeRef || snapshotMetadata.activeRoute,
                ''
            );
            const scheduleRef = normalizeScheduleReference(
                options.schedule || options.scheduleRef || backpressure.scheduleRef || snapshotMetadata.scheduleRef || 'diagnostics.snapshot'
            );
            const correlationId = options.correlationId || safeSnapshot.correlationId || backpressure.correlationId || routeRef || '';

            pushTelemetryRecord(telemetrySnapshots, {
                ...safeSnapshot,
                recordedAt: Date.now(),
                routeRef,
                scheduleRef,
                correlationId
            });
            writeState('rmt.telemetry.lastSnapshot', safeSnapshot, options);
            if (snapshotId) writeState('rmt.telemetry.lastSnapshotId', snapshotId, options);
            if (routeRef) writeState(`rmt.route.${routeRef}.telemetrySnapshot`, safeSnapshot, options);

            const backpressureResult = Object.keys(backpressure).length > 0
                ? recordBackpressureSignal(backpressure, {
                    ...options,
                    source: backpressure.source || 'fabric-snapshot',
                    routeRef,
                    scheduleRef,
                    correlationId,
                    snapshotId,
                    metadata: {
                        snapshotId,
                        snapshotSource: safeSnapshot.source
                    }
                })
                : null;

            let scheduleResult = null;
            if (scheduleRef && options.schedule !== false) {
                const schedule = normalizeBridgeSchedulePolicy(scheduleRef, deps, {
                    ...options,
                    lane: backpressure.lane || options.lane || 'diagnostics',
                    budgetClass: options.budgetClass || 'diagnostics',
                    endpointName: options.endpointName || 'xtendrmt.diagnostics.snapshot',
                    scope: options.scope || 'rmt.telemetry.snapshot'
                });
                scheduleResult = scheduleEndpoint(schedule.endpointName, schedule.scope, () => ({
                    snapshotId,
                    schema: safeSnapshot.schema,
                    backpressureLevel: backpressure.level || 'none',
                    backpressureScore: backpressure.score || 0
                }), {
                    ...options,
                    schedule,
                    metadata: {
                        snapshotId,
                        routeRef,
                        correlationId,
                        backpressureLevel: backpressure.level || 'none',
                        backpressureScore: backpressure.score || 0
                    }
                });
            }

            const diagnostic = emitDiagnostic({
                code: 'rmt.bridge.telemetry.snapshot.recorded',
                message: 'RMT bridge recorded Fabric telemetry snapshot.',
                operation: 'recordTelemetrySnapshot',
                phase: 'diagnose',
                level: isPressureLevel(backpressure.level) ? 'warn' : 'info',
                metadata: {
                    snapshotId,
                    snapshotSchema: safeSnapshot.schema,
                    routeRef,
                    scheduleRef,
                    correlationId,
                    backpressureLevel: backpressure.level || 'none',
                    backpressureScore: backpressure.score || 0,
                    scheduled: !!scheduleResult
                }
            }, {}, options);

            return createStateSchedulerDiagnosticsBridgeResult({
                ok: true,
                status: isPressureLevel(backpressure.level) ? 'degraded' : 'ok',
                adapterId,
                operation: 'recordTelemetrySnapshot',
                phase: 'diagnose',
                handle: {
                    telemetrySnapshot: safeSnapshot,
                    backpressureResult,
                    scheduleResult
                },
                diagnostics: diagnostic.diagnostics,
                metadata: {
                    snapshotId,
                    routeRef,
                    scheduleRef,
                    correlationId,
                    backpressureLevel: backpressure.level || 'none',
                    backpressureScore: backpressure.score || 0,
                    scheduled: !!scheduleResult
                }
            });
        }

        function listTelemetrySnapshots(options = {}) {
            const limit = Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
                ? Math.floor(Number(options.limit))
                : telemetrySnapshots.length;
            return telemetrySnapshots.slice(Math.max(telemetrySnapshots.length - limit, 0)).map((entry) => cloneBridgeTelemetry(entry, {}));
        }

        function listBackpressureSignals(options = {}) {
            const limit = Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
                ? Math.floor(Number(options.limit))
                : backpressureSignals.length;
            return backpressureSignals.slice(Math.max(backpressureSignals.length - limit, 0)).map((entry) => cloneBridgeTelemetry(entry, {}));
        }

        function getTelemetryDebugSnapshot(options = {}) {
            const telemetryRecords = listTelemetrySnapshots(options);
            const pressureRecords = listBackpressureSignals(options);
            return Object.freeze({
                schema: 'xtend.rmt.telemetry-debug-snapshot.v1',
                adapterId,
                telemetrySnapshotCount: telemetrySnapshots.length,
                backpressureSignalCount: backpressureSignals.length,
                telemetrySnapshots: telemetryRecords,
                backpressureSignals: pressureRecords,
                lastTelemetrySnapshot: cloneBridgeTelemetry(readState('rmt.telemetry.lastSnapshot', null, options), null),
                lastBackpressureSignal: cloneBridgeTelemetry(readState('rmt.backpressure.lastSignal', null, options), null),
                lastYieldHint: cloneBridgeTelemetry(readState('rmt.backpressure.lastYieldHint', null, options), null),
                scheduledEndpoints: scheduledEndpoints.slice(),
                diagnostics: diagnostics.slice()
            });
        }

        return Object.freeze({
            id: adapterId,
            schema: STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA,
            kind: 'host_adapter',
            version: DOCUMENT_VERSION,
            runtimeSurface: Object.freeze(['createStateBridge', 'scheduleEndpoint', 'emitDiagnostic', 'recordAdapterResult', 'recordTelemetrySnapshot', 'recordBackpressureSignal', 'listTelemetrySnapshots', 'listBackpressureSignals', 'getTelemetryDebugSnapshot']),
            capabilities: Object.freeze({
                providedCapabilities: Object.freeze(['stateBridge', 'schedulerEndpoints', 'diagnostics', 'adapterResults', 'performanceBudgets', 'lifecycleEvents', 'telemetrySnapshots', 'backpressureSignals']),
                requiredCapabilities: Object.freeze([]),
                preferredCapabilities: Object.freeze(['stateProjectionPort', 'diagnosticsHub', 'performanceRuntime', 'fabricTelemetry'])
            }),
            definition: Object.freeze({
                id: adapterId,
                kind: 'host_adapter',
                version: DOCUMENT_VERSION,
                runtimeSurface: Object.freeze(['createStateBridge', 'scheduleEndpoint', 'emitDiagnostic', 'recordAdapterResult', 'recordTelemetrySnapshot', 'recordBackpressureSignal', 'listTelemetrySnapshots', 'listBackpressureSignals', 'getTelemetryDebugSnapshot']),
                capabilities: Object.freeze({
                    providedCapabilities: Object.freeze(['stateBridge', 'schedulerEndpoints', 'diagnostics', 'adapterResults', 'performanceBudgets', 'lifecycleEvents', 'telemetrySnapshots', 'backpressureSignals'])
                }),
                kernelVisible: false,
                metadata: Object.freeze({
                    schema: STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_SCHEMA,
                    inputContracts: Object.freeze([
                        RUNTIME_REGISTRY_SCHEMA,
                        XROUTER_ADAPTER_SCHEMA,
                        XTEND_COMPONENT_ADAPTER_SCHEMA,
                        'xtend.fabric.telemetry-snapshot.v1',
                        'xtend.fabric.backpressure-signal.v1'
                    ])
                })
            }),
            createStateBridge,
            scheduleEndpoint,
            emitDiagnostic,
            recordAdapterResult,
            recordTelemetrySnapshot,
            recordBackpressureSignal,
            listTelemetrySnapshots,
            listBackpressureSignals,
            getTelemetryDebugSnapshot,
            resolveSchedulePolicy: (scheduleRef, options = {}) => normalizeBridgeSchedulePolicy(scheduleRef, deps, options),
            listScheduledEndpoints: () => scheduledEndpoints.slice(),
            listDiagnostics: () => diagnostics.slice(),
            listDiagnosticCodes: () => STATE_SCHEDULER_DIAGNOSTICS_BRIDGE_DIAGNOSTIC_CODES.slice()
        });
    };

})(__XTENDRMT_GLOBAL__);

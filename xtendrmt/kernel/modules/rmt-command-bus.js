/* modules/rmt-command-bus.js */
(function registerRmtCommandBusModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const RMT_KERNEL_ESCALATION_SCHEMA = 'xtend.rmt.kernel-escalation.v1';
    const RMT_KERNEL_ESCALATION_POLICY_SCHEMA = 'xtend.rmt.kernel-escalation-policy.v1';
    const RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA = 'xtend.rmt.kernel-escalation-envelope.v1';
    const RMT_KERNEL_ESCALATION_WORKPACKAGE = 'RKSH-WP-06';
    const RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL = 'rmt.kernel.escalation';
    const RMT_KERNEL_PANIC_MONITOR_SCHEMA_FOR_ESCALATION = 'xtend.rmt.kernel-panic-monitor.v1';
    const RMT_KERNEL_PANIC_STATE_SCHEMA_FOR_ESCALATION = 'xtend.rmt.kernel-panic-state.v1';
    const RMT_KERNEL_ESCALATION_SEVERITIES = Object.freeze(['info', 'warning', 'error', 'critical', 'fatal']);

    function createDeterministicCommandHostPort() {
        let clock = 0;
        function createAbortController() {
            const listeners = new Set();
            const signal = {
                aborted: false,
                reason: undefined,
                addEventListener(type, listener) {
                    if (type === 'abort' && typeof listener === 'function') listeners.add(listener);
                },
                removeEventListener(type, listener) {
                    if (type === 'abort') listeners.delete(listener);
                }
            };
            return {
                signal,
                abort(reason) {
                    if (signal.aborted) return;
                    signal.aborted = true;
                    signal.reason = reason;
                    Array.from(listeners).forEach((listener) => {
                        try {
                            listener.call(signal, { type: 'abort', target: signal });
                        } catch (_error) {}
                    });
                    listeners.clear();
                }
            };
        }
        return Object.freeze({
            schema: 'xtend.rmt.command-host-port.deterministic.v1',
            now() {
                clock += 1;
                return clock;
            },
            createAbortController
        });
    }

    function normalizeCommandHostPort(deps = {}) {
        const deterministicPort = createDeterministicCommandHostPort();
        const injectedPort = deps.hostPort
            || deps.commandHostPort
            || deps.hostAdapter
            || {};
        return Object.freeze({
            schema: String(injectedPort.schema || 'xtend.rmt.command-host-port.v1'),
            now: typeof injectedPort.now === 'function'
                ? injectedPort.now.bind(injectedPort)
                : (typeof deps.now === 'function' ? deps.now : deterministicPort.now),
            createAbortController: typeof injectedPort.createAbortController === 'function'
                ? injectedPort.createAbortController.bind(injectedPort)
                : (typeof deps.createAbortController === 'function'
                    ? deps.createAbortController
                    : deterministicPort.createAbortController)
        });
    }

    appModules.createRmtCommandBus = function createRmtCommandBus(deps = {}) {
        const hostPort = normalizeCommandHostPort(deps);
        const now = hostPort.now;
        const createAbortController = hostPort.createAbortController;
        const maxHistoryEntries = Number.isFinite(deps.maxHistoryEntries) && deps.maxHistoryEntries > 0
            ? Math.max(Math.floor(deps.maxHistoryEntries), 24)
            : 160;
        const cloneValue = typeof deps.cloneValue === 'function'
            ? deps.cloneValue
            : function cloneSerializable(value) {
                if (value === undefined) return null;
                try {
                    return JSON.parse(JSON.stringify(value));
                } catch (_error) {
                    return null;
                }
            };
        const diagnosticsHub = normalizeDiagnosticsHub(
            deps.diagnosticsHub
            || deps.rmtDiagnosticsHub
            || deps.schedulerDiagnosticsHub
            || null
        );
        const panicMonitor = deps.panicMonitor && typeof deps.panicMonitor.recordSignal === 'function'
            ? deps.panicMonitor
            : (deps.kernelPanicMonitor && typeof deps.kernelPanicMonitor.recordSignal === 'function' ? deps.kernelPanicMonitor : null);
        const escalationPolicy = {
            commandHandlerFailureSeverity: normalizeEscalationSeverity(deps.commandHandlerFailureSeverity || deps.escalationSeverity, 'error'),
            missingCommandHandlerSeverity: normalizeEscalationSeverity(deps.missingCommandHandlerSeverity, 'error'),
            commandSubscriberFailureSeverity: normalizeEscalationSeverity(deps.commandSubscriberFailureSeverity, 'warning'),
            panicSeverityThreshold: normalizeEscalationSeverity(deps.panicSeverityThreshold, 'critical'),
            diagnosticsChannel: normalizeText(deps.escalationDiagnosticsChannel || deps.kernelEscalationDiagnosticsChannel || RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL, RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL),
            trustRelevantActivatesPanic: deps.trustRelevantActivatesPanic === false ? false : true,
            redactsPayload: deps.redactsPayload === false ? false : true
        };
        const commandHandlers = new Map();
        const pendingCommands = new Map();
        const latestPendingBySupersessionKey = new Map();
        const subscribers = new Set();
        const subscriberEscalationMeta = new WeakMap();
        const history = [];
        const escalationHistory = [];
        const counters = {
            issued: 0,
            succeeded: 0,
            failed: 0,
            cancelled: 0,
            superseded: 0,
            progressEvents: 0
        };
        let correlationIdCounter = 0;

        const COMMAND_CHANNEL = 'rmt.command_bus.command';
        const RESPONSE_CHANNEL = 'rmt.command_bus.response';
        const PROGRESS_CHANNEL = 'rmt.command_bus.progress';
        const SNAPSHOT_CHANNEL = 'rmt.command_bus.snapshot';

        function normalizeText(value, fallback = '') {
            const safeValue = String(value || '').trim();
            return safeValue || fallback;
        }

        function normalizeCommandName(commandName) {
            return normalizeText(commandName, '').toLowerCase();
        }

        function normalizeObject(value) {
            return value && typeof value === 'object' ? value : {};
        }

        function clonePayload(value, fallback = null) {
            const clonedValue = cloneValue(value);
            return clonedValue === undefined ? fallback : clonedValue;
        }

        function serializeError(error) {
            if (!error) return null;
            if (error instanceof Error) {
                return {
                    name: normalizeText(error.name, 'Error'),
                    message: normalizeText(error.message, 'Unbekannter Fehler'),
                    stack: normalizeText(error.stack, '')
                };
            }
            if (typeof error === 'object') {
                return {
                    name: normalizeText(error.name, 'Error'),
                    message: normalizeText(error.message || error.error || 'Unbekannter Fehler', 'Unbekannter Fehler'),
                    stack: normalizeText(error.stack, '')
                };
            }
            return {
                name: 'Error',
                message: normalizeText(error, 'Unbekannter Fehler'),
                stack: ''
            };
        }

        function normalizeEscalationSeverity(value, fallback = 'error') {
            const normalized = String(value || '').trim().toLowerCase();
            return RMT_KERNEL_ESCALATION_SEVERITIES.includes(normalized) ? normalized : fallback;
        }

        function escalationSeverityRank(severity) {
            const index = RMT_KERNEL_ESCALATION_SEVERITIES.indexOf(normalizeEscalationSeverity(severity, 'info'));
            return index === -1 ? 0 : index;
        }

        function isEscalationSeverityAtLeast(severity, threshold) {
            return escalationSeverityRank(severity) >= escalationSeverityRank(threshold);
        }

        function redactEscalationValue(value, key = '') {
            if (value === null || value === undefined) return value;
            if (Array.isArray(value)) return value.map((entry) => redactEscalationValue(entry, key));
            if (typeof value === 'object') {
                return Object.keys(value).reduce((result, entryKey) => {
                    result[entryKey] = redactEscalationValue(value[entryKey], entryKey);
                    return result;
                }, {});
            }
            if (typeof value !== 'string') return value;
            const normalizedKey = String(key || '').toLowerCase();
            const sensitiveKey = /(payload|value|html|markup|raw|sample|source|script|token|secret|password)/u.test(normalizedKey);
            const unsafeSample = /<\s*script\b|javascript:|vbscript:|srcdoc|onerror\s*=|onclick\s*=/iu.test(value);
            if (sensitiveKey || unsafeSample) {
                return {
                    redacted: true,
                    length: value.length
                };
            }
            return value.length > 256 ? `${value.slice(0, 253)}...` : value;
        }

        function pushHistoryEntry(entry) {
            history.push(entry);
            if (history.length > maxHistoryEntries) {
                history.splice(0, history.length - maxHistoryEntries);
            }
        }

        function normalizeDiagnosticsHub(hub) {
            const normalizedHub = hub && typeof hub === 'object'
                ? hub
                : {};
            return {
                publish: typeof normalizedHub.publish === 'function'
                    ? normalizedHub.publish.bind(normalizedHub)
                    : (() => null)
            };
        }

        function createRuntimeCommandEscalationEnvelope(input = {}) {
            const severity = normalizeEscalationSeverity(input.severity, escalationPolicy.commandHandlerFailureSeverity);
            const trustRelevant = input.trustRelevant === true;
            const panicRelevant = input.panicRelevant === true
                || input.critical === true
                || isEscalationSeverityAtLeast(severity, escalationPolicy.panicSeverityThreshold)
                || (trustRelevant && escalationPolicy.trustRelevantActivatesPanic !== false);
            const createdAt = now();
            return {
                schema: RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA,
                escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA,
                policySchema: RMT_KERNEL_ESCALATION_POLICY_SCHEMA,
                panicMonitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA_FOR_ESCALATION,
                panicStateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA_FOR_ESCALATION,
                workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
                envelopeId: `${RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA}:command-bus:${createdAt}:${escalationHistory.length + 1}`,
                source: 'command-bus',
                eventType: normalizeText(input.eventType, 'command-handler-failure'),
                severity,
                panicRelevant,
                trustRelevant,
                trigger: 'command-bus-failure',
                scope: normalizeText(input.scope, 'command-bus'),
                sourceRef: normalizeText(input.sourceRef, null),
                channel: null,
                commandName: normalizeText(input.commandName, null),
                correlationId: normalizeText(input.correlationId, null),
                rootId: normalizeText(input.rootId, null),
                responseStatus: normalizeText(input.responseStatus, 'failed'),
                reasonCode: normalizeText(input.reasonCode, `xtend.rmt.kernel-escalation.${normalizeText(input.eventType, 'command-handler-failure')}`),
                diagnosticCode: normalizeText(input.diagnosticCode, `rmt.kernel.escalation.${normalizeText(input.eventType, 'command-handler-failure')}`),
                error: serializeError(input.error),
                createdAt,
                metadata: escalationPolicy.redactsPayload === false
                    ? clonePayload(input.metadata || {}, {})
                    : redactEscalationValue(clonePayload(input.metadata || {}, {}))
            };
        }

        function recordRuntimeCommandEscalation(input = {}) {
            const envelope = createRuntimeCommandEscalationEnvelope(input);
            if (panicMonitor && envelope.panicRelevant === true) {
                try {
                    envelope.panicState = panicMonitor.recordSignal({
                        trigger: 'command-bus-failure',
                        severity: envelope.severity,
                        critical: true,
                        scope: envelope.scope,
                        sourceRef: envelope.sourceRef || envelope.commandName,
                        reasonCode: envelope.reasonCode,
                        diagnosticCode: envelope.diagnosticCode,
                        correlationId: envelope.correlationId,
                        metadata: {
                            escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA,
                            envelopeId: envelope.envelopeId,
                            commandName: envelope.commandName,
                            rootId: envelope.rootId
                        }
                    });
                } catch (_error) {
                    envelope.panicState = null;
                }
            } else {
                envelope.panicState = null;
            }
            escalationHistory.push(envelope);
            if (escalationHistory.length > maxHistoryEntries) {
                escalationHistory.splice(0, escalationHistory.length - maxHistoryEntries);
            }
            diagnosticsHub.publish(escalationPolicy.diagnosticsChannel, envelope, {
                source: RMT_KERNEL_ESCALATION_SCHEMA,
                workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
                severity: envelope.severity,
                eventType: envelope.eventType,
                panicRelevant: envelope.panicRelevant
            });
            return clonePayload(envelope, {});
        }

        function inferFailureEscalation(input = {}) {
            const commandMeta = input.command && input.command.meta && typeof input.command.meta === 'object' ? input.command.meta : {};
            const handlerMeta = input.handlerMeta && typeof input.handlerMeta === 'object' ? input.handlerMeta : {};
            const response = input.response && typeof input.response === 'object' ? input.response : {};
            const severity = normalizeEscalationSeverity(
                response.severity
                || commandMeta.severity
                || handlerMeta.severity
                || (input.reason === 'missing_handler' ? escalationPolicy.missingCommandHandlerSeverity : escalationPolicy.commandHandlerFailureSeverity),
                escalationPolicy.commandHandlerFailureSeverity
            );
            return {
                severity,
                panicRelevant: response.panicRelevant === true
                    || commandMeta.panicRelevant === true
                    || commandMeta.panicCritical === true
                    || handlerMeta.panicRelevant === true
                    || handlerMeta.panicCritical === true
                    || isEscalationSeverityAtLeast(severity, escalationPolicy.panicSeverityThreshold),
                trustRelevant: response.trustRelevant === true || commandMeta.trustRelevant === true || handlerMeta.trustRelevant === true,
                reasonCode: response.reasonCode || commandMeta.reasonCode || handlerMeta.reasonCode,
                diagnosticCode: response.diagnosticCode || commandMeta.diagnosticCode || handlerMeta.diagnosticCode
            };
        }

        function emitSubscriberEvent(event) {
            const snapshot = clonePayload(event, null);
            subscribers.forEach((subscriber) => {
                try {
                    subscriber(snapshot);
                } catch (error) {
                    const meta = subscriberEscalationMeta.get(subscriber) || {};
                    recordRuntimeCommandEscalation({
                        eventType: 'command-subscriber-failure',
                        severity: meta.severity || escalationPolicy.commandSubscriberFailureSeverity,
                        panicRelevant: meta.panicRelevant === true || meta.panicCritical === true,
                        trustRelevant: meta.trustRelevant === true,
                        scope: meta.scope || 'command-bus',
                        sourceRef: meta.sourceRef || 'command-bus:subscriber',
                        correlationId: snapshot && snapshot.response && snapshot.response.correlationId,
                        commandName: snapshot && snapshot.response && snapshot.response.commandName,
                        rootId: snapshot && snapshot.response && snapshot.response.rootId,
                        error,
                        metadata: {
                            subscriber: meta.name || meta.subscriber || 'anonymous',
                            eventKind: snapshot && snapshot.kind
                        }
                    });
                    // Command subscribers must not interrupt the runtime path.
                }
            });
            return snapshot;
        }

        function generateCorrelationId(commandName) {
            correlationIdCounter += 1;
            const safeCommandName = normalizeCommandName(commandName).replace(/[^a-z0-9_-]+/g, '-') || 'command';
            return `rmcmd_${correlationIdCounter}_${safeCommandName}`;
        }

        function createCommandEnvelope(command, options = {}) {
            const rawCommand = typeof command === 'string'
                ? {
                    commandName: command,
                    payload: options.payload
                }
                : normalizeObject(command);
            const commandName = normalizeCommandName(
                rawCommand.commandName
                || rawCommand.name
                || rawCommand.command
            );
            if (!commandName) {
                throw new Error('RmtCommandBus commandName fehlt.');
            }

            const payload = rawCommand.payload && typeof rawCommand.payload === 'object'
                ? clonePayload(rawCommand.payload, {})
                : {};
            const meta = rawCommand.meta && typeof rawCommand.meta === 'object'
                ? clonePayload(rawCommand.meta, {})
                : {};

            return {
                type: 'command',
                commandName,
                correlationId: normalizeText(rawCommand.correlationId, generateCorrelationId(commandName)),
                rootId: normalizeText(rawCommand.rootId || options.rootId, ''),
                payload,
                meta,
                requestedAt: Number.isFinite(rawCommand.requestedAt)
                    ? rawCommand.requestedAt
                    : now()
            };
        }

        function createResponseEnvelope(commandEnvelope, status, options = {}) {
            const startedAt = Number.isFinite(options.startedAt) ? options.startedAt : commandEnvelope.requestedAt;
            const completedAt = Number.isFinite(options.completedAt) ? options.completedAt : now();
            return {
                status: normalizeText(status, 'succeeded'),
                correlationId: commandEnvelope.correlationId,
                commandName: commandEnvelope.commandName,
                rootId: commandEnvelope.rootId,
                result: options.result === undefined ? null : clonePayload(options.result, null),
                error: options.error ? serializeError(options.error) : null,
                severity: options.severity ? normalizeEscalationSeverity(options.severity, null) : null,
                panicRelevant: options.panicRelevant === true,
                trustRelevant: options.trustRelevant === true,
                reasonCode: normalizeText(options.reasonCode, ''),
                diagnosticCode: normalizeText(options.diagnosticCode, ''),
                failureEscalation: options.failureEscalation ? clonePayload(options.failureEscalation, null) : null,
                superseded: options.superseded === true || status === 'superseded',
                metrics: {
                    startedAt,
                    completedAt,
                    requestedAt: commandEnvelope.requestedAt,
                    durationMs: Math.max(completedAt - startedAt, 0),
                    ...(options.metrics && typeof options.metrics === 'object'
                        ? clonePayload(options.metrics, {})
                        : {})
                },
                issuedCommands: Array.isArray(options.issuedCommands)
                    ? options.issuedCommands.map((issuedCommand) => clonePayload(issuedCommand, null)).filter(Boolean)
                    : []
            };
        }

        function isResponseEnvelopeLike(value) {
            return !!(value
                && typeof value === 'object'
                && typeof value.status === 'string'
                && typeof value.correlationId === 'string');
        }

        function normalizeResponseEnvelope(commandEnvelope, response, options = {}) {
            const safeResponse = normalizeObject(response);
            return createResponseEnvelope(commandEnvelope, safeResponse.status || 'succeeded', {
                startedAt: options.startedAt,
                completedAt: options.completedAt,
                result: Object.prototype.hasOwnProperty.call(safeResponse, 'result')
                    ? safeResponse.result
                    : null,
                error: safeResponse.error || null,
                superseded: safeResponse.superseded === true,
                severity: safeResponse.severity,
                panicRelevant: safeResponse.panicRelevant === true,
                trustRelevant: safeResponse.trustRelevant === true,
                reasonCode: safeResponse.reasonCode,
                diagnosticCode: safeResponse.diagnosticCode,
                failureEscalation: safeResponse.failureEscalation,
                metrics: safeResponse.metrics,
                issuedCommands: Array.isArray(safeResponse.issuedCommands)
                    ? safeResponse.issuedCommands
                    : options.issuedCommands
            });
        }

        function listPendingCommands() {
            return Array.from(pendingCommands.values()).map((record) => ({
                correlationId: record.command.correlationId,
                commandName: record.command.commandName,
                rootId: record.command.rootId,
                requestedAt: record.command.requestedAt,
                startedAt: record.startedAt,
                supersessionKey: record.supersessionKey,
                status: record.status
            }));
        }

        function listHandlers() {
            return Array.from(commandHandlers.values())
                .map((entry) => ({
                    commandName: entry.commandName,
                    description: entry.description,
                    meta: clonePayload(entry.meta, {})
                }))
                .sort((left, right) => left.commandName.localeCompare(right.commandName));
        }

        function getSnapshot() {
            return {
                counters: {
                    issued: counters.issued,
                    succeeded: counters.succeeded,
                    failed: counters.failed,
                    cancelled: counters.cancelled,
                    superseded: counters.superseded,
                    progressEvents: counters.progressEvents,
                    pending: pendingCommands.size
                },
                pendingCommands: listPendingCommands(),
                handlers: listHandlers(),
                recentHistory: history.map((entry) => clonePayload(entry, null)).filter(Boolean)
                ,
                escalations: escalationHistory.length,
                lastEscalation: escalationHistory.length > 0 ? clonePayload(escalationHistory[escalationHistory.length - 1], null) : null
            };
        }

        function publishSnapshot(reason) {
            const snapshot = {
                reason: normalizeText(reason, 'snapshot'),
                recordedAt: now(),
                ...getSnapshot()
            };
            diagnosticsHub.publish(SNAPSHOT_CHANNEL, snapshot, {
                source: 'rmt-command-bus',
                category: 'command_bus_snapshot'
            });
            emitSubscriberEvent({
                kind: 'snapshot',
                snapshot
            });
            return snapshot;
        }

        function registerHandler(commandName, handler, options = {}) {
            const safeCommandName = normalizeCommandName(commandName);
            if (!safeCommandName || typeof handler !== 'function') return false;
            commandHandlers.set(safeCommandName, {
                commandName: safeCommandName,
                handler,
                description: normalizeText(options.description, ''),
                meta: clonePayload(options.meta, {})
            });
            publishSnapshot('handler_registered');
            return true;
        }

        function registerHandlers(definitions = {}) {
            if (!definitions || typeof definitions !== 'object') return false;
            let changed = false;
            Object.entries(definitions).forEach(([commandName, handler]) => {
                changed = registerHandler(commandName, handler) || changed;
            });
            return changed;
        }

        function notifyProgress(record, progressPayload, progressMeta = {}) {
            if (!record || record.completed) return null;
            counters.progressEvents += 1;
            const progressEvent = {
                status: 'progress',
                correlationId: record.command.correlationId,
                commandName: record.command.commandName,
                rootId: record.command.rootId,
                progress: clonePayload(progressPayload, null),
                meta: clonePayload(progressMeta, {}),
                reportedAt: now()
            };
            diagnosticsHub.publish(PROGRESS_CHANNEL, progressEvent, {
                source: 'rmt-command-bus',
                category: 'command_progress'
            });
            emitSubscriberEvent({
                kind: 'progress',
                event: progressEvent
            });
            publishSnapshot('progress');
            return progressEvent;
        }

        function finalizeRecord(record, response, reason = 'completed') {
            if (!record || record.completed) {
                return record && record.response ? record.response : response;
            }
            record.completed = true;
            record.status = response.status;
            record.response = response;
            pendingCommands.delete(record.command.correlationId);
            if (record.supersessionKey && latestPendingBySupersessionKey.get(record.supersessionKey) === record) {
                latestPendingBySupersessionKey.delete(record.supersessionKey);
            }

            if (response.status === 'succeeded') counters.succeeded += 1;
            else if (response.status === 'failed') counters.failed += 1;
            else if (response.status === 'cancelled') counters.cancelled += 1;
            else if (response.status === 'superseded') counters.superseded += 1;

            if (response.status === 'failed') {
                const failureEscalation = inferFailureEscalation({
                    command: record.command,
                    handlerMeta: record.handlerMeta,
                    response,
                    reason
                });
                response.severity = response.severity || failureEscalation.severity;
                response.panicRelevant = response.panicRelevant === true || failureEscalation.panicRelevant === true;
                response.trustRelevant = response.trustRelevant === true || failureEscalation.trustRelevant === true;
                response.reasonCode = response.reasonCode || failureEscalation.reasonCode || `xtend.rmt.kernel-escalation.${reason}`;
                response.diagnosticCode = response.diagnosticCode || failureEscalation.diagnosticCode || `rmt.kernel.escalation.${reason}`;
                const escalation = recordRuntimeCommandEscalation({
                    eventType: reason === 'missing_handler'
                        ? 'command-missing-handler'
                        : (reason === 'handler_response' ? 'command-response-failed' : 'command-handler-failure'),
                    severity: response.severity,
                    panicRelevant: response.panicRelevant,
                    trustRelevant: response.trustRelevant,
                    scope: response.trustRelevant ? 'command-bus:trust-relevant' : 'command-bus',
                    sourceRef: `command:${response.commandName}`,
                    commandName: response.commandName,
                    correlationId: response.correlationId,
                    rootId: response.rootId,
                    responseStatus: response.status,
                    reasonCode: response.reasonCode,
                    diagnosticCode: response.diagnosticCode,
                    error: response.error,
                    metadata: {
                        reason,
                        superseded: response.superseded === true,
                        metrics: response.metrics
                    }
                });
                response.failureEscalation = {
                    schema: escalation.schema,
                    envelopeId: escalation.envelopeId,
                    severity: escalation.severity,
                    panicRelevant: escalation.panicRelevant,
                    trustRelevant: escalation.trustRelevant,
                    panicState: escalation.panicState || null
                };
            }

            pushHistoryEntry({
                kind: 'response',
                reason: normalizeText(reason, 'completed'),
                correlationId: response.correlationId,
                commandName: response.commandName,
                rootId: response.rootId,
                status: response.status,
                superseded: response.superseded === true,
                metrics: clonePayload(response.metrics, {})
            });

            diagnosticsHub.publish(RESPONSE_CHANNEL, response, {
                source: 'rmt-command-bus',
                category: 'command_response'
            });
            emitSubscriberEvent({
                kind: 'response',
                response
            });
            publishSnapshot(`response:${response.status}`);
            if (typeof record.resolve === 'function') {
                record.resolve(response);
            }
            return response;
        }

        async function executeRecord(record) {
            const entry = commandHandlers.get(record.command.commandName);
            if (!entry || typeof entry.handler !== 'function') {
                return finalizeRecord(
                    record,
                    createResponseEnvelope(record.command, 'failed', {
                        startedAt: record.startedAt,
                        completedAt: now(),
                        error: new Error(`Unbekanntes Rmt-Kommando: ${record.command.commandName}`),
                        severity: record.command.meta && record.command.meta.severity || escalationPolicy.missingCommandHandlerSeverity,
                        panicRelevant: record.command.meta && (record.command.meta.panicRelevant === true || record.command.meta.panicCritical === true),
                        trustRelevant: record.command.meta && record.command.meta.trustRelevant === true,
                        reasonCode: record.command.meta && record.command.meta.reasonCode || 'xtend.rmt.kernel-escalation.command-missing-handler',
                        diagnosticCode: record.command.meta && record.command.meta.diagnosticCode || 'rmt.kernel.escalation.command-missing-handler',
                        issuedCommands: record.issuedCommands
                    }),
                    'missing_handler'
                );
            }
            record.handlerMeta = entry.meta || {};

            try {
                const result = await entry.handler(record.command, {
                    commandBus: api,
                    issueCommand(nextCommand, options = {}) {
                        const issuedCommand = createCommandEnvelope(nextCommand, options);
                        record.issuedCommands.push({
                            correlationId: issuedCommand.correlationId,
                            commandName: issuedCommand.commandName,
                            rootId: issuedCommand.rootId
                        });
                        return dispatch(issuedCommand, options);
                    },
                    reportProgress(progressPayload, progressMeta = {}) {
                        return notifyProgress(record, progressPayload, progressMeta);
                    },
                    runtimeContext: record.runtimeContext,
                    signal: record.abortController ? record.abortController.signal : null
                });
                if (record.completed) return record.response;

                const completedAt = now();
                if (isResponseEnvelopeLike(result)) {
                    return finalizeRecord(
                        record,
                        normalizeResponseEnvelope(record.command, result, {
                            startedAt: record.startedAt,
                            completedAt,
                            issuedCommands: record.issuedCommands
                        }),
                        'handler_response'
                    );
                }

                return finalizeRecord(
                    record,
                    createResponseEnvelope(record.command, 'succeeded', {
                        startedAt: record.startedAt,
                        completedAt,
                        result,
                        issuedCommands: record.issuedCommands
                    }),
                    'handler_result'
                );
            } catch (error) {
                if (record.completed) return record.response;
                return finalizeRecord(
                    record,
                    createResponseEnvelope(record.command, 'failed', {
                        startedAt: record.startedAt,
                        completedAt: now(),
                        error,
                        severity: error && error.severity || record.command.meta && record.command.meta.severity || record.handlerMeta && record.handlerMeta.severity || escalationPolicy.commandHandlerFailureSeverity,
                        panicRelevant: error && error.panicRelevant === true || record.command.meta && (record.command.meta.panicRelevant === true || record.command.meta.panicCritical === true) || record.handlerMeta && (record.handlerMeta.panicRelevant === true || record.handlerMeta.panicCritical === true),
                        trustRelevant: error && error.trustRelevant === true || record.command.meta && record.command.meta.trustRelevant === true || record.handlerMeta && record.handlerMeta.trustRelevant === true,
                        reasonCode: error && error.reasonCode || record.command.meta && record.command.meta.reasonCode || record.handlerMeta && record.handlerMeta.reasonCode || 'xtend.rmt.kernel-escalation.command-handler-failure',
                        diagnosticCode: error && error.diagnosticCode || record.command.meta && record.command.meta.diagnosticCode || record.handlerMeta && record.handlerMeta.diagnosticCode || 'rmt.kernel.escalation.command-handler-failure',
                        issuedCommands: record.issuedCommands
                    }),
                    'handler_error'
                );
            }
        }

        function dispatch(command, options = {}) {
            let commandEnvelope;
            try {
                commandEnvelope = createCommandEnvelope(command, options);
            } catch (error) {
                return Promise.resolve(createResponseEnvelope({
                    correlationId: '',
                    commandName: '',
                    rootId: '',
                    requestedAt: now()
                }, 'failed', {
                    startedAt: now(),
                    completedAt: now(),
                    error
                }));
            }

            const supersessionKey = normalizeText(
                options.supersessionKey
                || (commandEnvelope.meta && commandEnvelope.meta.supersessionKey)
                || '',
                ''
            );
            const previousRecord = supersessionKey
                ? latestPendingBySupersessionKey.get(supersessionKey) || null
                : null;

            const abortController = createAbortController();
            const record = {
                command: commandEnvelope,
                runtimeContext: options.runtimeContext && typeof options.runtimeContext === 'object'
                    ? options.runtimeContext
                    : null,
                abortController,
                supersessionKey,
                startedAt: now(),
                issuedCommands: [],
                completed: false,
                status: 'pending',
                resolve: null,
                handlerMeta: null,
                response: null
            };

            counters.issued += 1;
            pendingCommands.set(commandEnvelope.correlationId, record);
            if (supersessionKey) {
                latestPendingBySupersessionKey.set(supersessionKey, record);
            }

            pushHistoryEntry({
                kind: 'command',
                correlationId: commandEnvelope.correlationId,
                commandName: commandEnvelope.commandName,
                rootId: commandEnvelope.rootId,
                requestedAt: commandEnvelope.requestedAt,
                supersessionKey
            });

            diagnosticsHub.publish(COMMAND_CHANNEL, commandEnvelope, {
                source: 'rmt-command-bus',
                category: 'command_dispatch'
            });
            emitSubscriberEvent({
                kind: 'command',
                command: clonePayload(commandEnvelope, null)
            });
            publishSnapshot('command_dispatched');

            if (previousRecord && !previousRecord.completed) {
                if (previousRecord.abortController && typeof previousRecord.abortController.abort === 'function') {
                    try {
                        previousRecord.abortController.abort('superseded');
                    } catch (_error) {}
                }
                finalizeRecord(
                    previousRecord,
                    createResponseEnvelope(previousRecord.command, 'superseded', {
                        startedAt: previousRecord.startedAt,
                        completedAt: now(),
                        superseded: true,
                        metrics: {
                            supersessionKey
                        },
                        issuedCommands: previousRecord.issuedCommands
                    }),
                    'superseded'
                );
            }

            const promise = new Promise((resolve) => {
                record.resolve = resolve;
            });
            void executeRecord(record);
            return promise;
        }

        function cancel(correlationId, reason = 'cancelled') {
            const safeCorrelationId = normalizeText(correlationId, '');
            if (!safeCorrelationId || !pendingCommands.has(safeCorrelationId)) return null;
            const record = pendingCommands.get(safeCorrelationId);
            if (record.abortController && typeof record.abortController.abort === 'function') {
                try {
                    record.abortController.abort(reason);
                } catch (_error) {}
            }
            return finalizeRecord(
                record,
                createResponseEnvelope(record.command, 'cancelled', {
                    startedAt: record.startedAt,
                    completedAt: now(),
                    metrics: {
                        reason: normalizeText(reason, 'cancelled')
                    },
                    issuedCommands: record.issuedCommands
                }),
                'cancelled'
            );
        }

        function cancelByRoot(rootId, reason = 'root_cancelled') {
            const safeRootId = normalizeText(rootId, '');
            if (!safeRootId) return 0;
            const records = Array.from(pendingCommands.values()).filter((record) => {
                return record
                    && !record.completed
                    && normalizeText(record.command && record.command.rootId, '') === safeRootId;
            });
            records.forEach((record) => {
                if (record.abortController && typeof record.abortController.abort === 'function') {
                    try {
                        record.abortController.abort(reason);
                    } catch (_error) {}
                }
                finalizeRecord(
                    record,
                    createResponseEnvelope(record.command, 'cancelled', {
                        startedAt: record.startedAt,
                        completedAt: now(),
                        metrics: {
                            reason: normalizeText(reason, 'root_cancelled'),
                            rootId: safeRootId
                        },
                        issuedCommands: record.issuedCommands
                    }),
                    'root_cancelled'
                );
            });
            return records.length;
        }

        function subscribe(subscriber, options = {}) {
            if (typeof subscriber !== 'function') {
                return function unsubscribeNoop() {};
            }
            subscribers.add(subscriber);
            subscriberEscalationMeta.set(subscriber, options && typeof options === 'object' ? clonePayload(options, {}) : {});
            if (options.replayLatest === true) {
                try {
                    subscriber({
                        kind: 'snapshot',
                        snapshot: getSnapshot()
                    });
                } catch (error) {
                    const meta = subscriberEscalationMeta.get(subscriber) || {};
                    recordRuntimeCommandEscalation({
                        eventType: 'command-subscriber-failure',
                        severity: meta.severity || escalationPolicy.commandSubscriberFailureSeverity,
                        panicRelevant: meta.panicRelevant === true || meta.panicCritical === true,
                        trustRelevant: meta.trustRelevant === true,
                        scope: meta.scope || 'command-bus',
                        sourceRef: meta.sourceRef || 'command-bus:subscriber',
                        error,
                        metadata: {
                            subscriber: meta.name || meta.subscriber || 'anonymous',
                            eventKind: 'snapshot'
                        }
                    });
                }
            }
            return function unsubscribe() {
                subscribers.delete(subscriber);
                subscriberEscalationMeta.delete(subscriber);
            };
        }

        function getHistory() {
            return history.map((entry) => clonePayload(entry, null)).filter(Boolean);
        }

        const api = Object.freeze({
            cancel,
            cancelByRoot,
            dispatch,
            getEscalationPolicy: () => clonePayload(escalationPolicy, {}),
            getHistory,
            getSnapshot,
            listHandlers,
            listEscalations: () => escalationHistory.map((entry) => clonePayload(entry, {})),
            listPendingCommands,
            recordEscalation: recordRuntimeCommandEscalation,
            registerHandler,
            registerHandlers,
            subscribe
        });

        publishSnapshot('initialized');
        return api;
    };
})(__XTENDRMT_GLOBAL__);

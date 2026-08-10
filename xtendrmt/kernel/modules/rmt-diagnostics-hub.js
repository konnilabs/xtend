/* modules/rmt-diagnostics-hub.js */
(function registerRmtDiagnosticsHubModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});
    const RMT_KERNEL_ESCALATION_SCHEMA = 'xtend.rmt.kernel-escalation.v1';
    const RMT_KERNEL_ESCALATION_POLICY_SCHEMA = 'xtend.rmt.kernel-escalation-policy.v1';
    const RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA = 'xtend.rmt.kernel-escalation-envelope.v1';
    const RMT_KERNEL_ESCALATION_WORKPACKAGE = 'RKSH-WP-06';
    const RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL = 'rmt.kernel.escalation';
    const RMT_KERNEL_PANIC_MONITOR_SCHEMA_FOR_ESCALATION = 'xtend.rmt.kernel-panic-monitor.v1';
    const RMT_KERNEL_PANIC_STATE_SCHEMA_FOR_ESCALATION = 'xtend.rmt.kernel-panic-state.v1';
    const RMT_KERNEL_ESCALATION_SEVERITIES = Object.freeze(['info', 'warning', 'error', 'critical', 'fatal']);

    appModules.createRmtDiagnosticsHub = function createRmtDiagnosticsHub(deps = {}) {
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => Date.now());
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
        const channels = new Map();
        const subscribers = new Map();
        const subscriberEscalationMeta = new WeakMap();
        const history = [];
        const escalationHistory = [];
        const panicMonitor = deps.panicMonitor && typeof deps.panicMonitor.recordSignal === 'function'
            ? deps.panicMonitor
            : (deps.kernelPanicMonitor && typeof deps.kernelPanicMonitor.recordSignal === 'function' ? deps.kernelPanicMonitor : null);
        const escalationPolicy = {
            diagnosticsSubscriberFailureSeverity: normalizeEscalationSeverity(deps.diagnosticsSubscriberFailureSeverity || deps.escalationSeverity, 'warning'),
            panicSeverityThreshold: normalizeEscalationSeverity(deps.panicSeverityThreshold, 'critical'),
            diagnosticsChannel: normalizeChannelName(deps.escalationDiagnosticsChannel || deps.kernelEscalationDiagnosticsChannel || RMT_RUNTIME_ESCALATION_DIAGNOSTIC_CHANNEL),
            trustRelevantActivatesPanic: deps.trustRelevantActivatesPanic === false ? false : true,
            redactsPayload: deps.redactsPayload === false ? false : true
        };

        function normalizeChannelName(channelName) {
            return String(channelName || '').trim().toLowerCase();
        }

        function clonePayload(value, fallback = null) {
            const cloned = cloneValue(value);
            return cloned === undefined ? fallback : cloned;
        }

        function normalizeEscalationSeverity(value, fallback = 'warning') {
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

        function serializeEscalationError(error) {
            if (!error) return null;
            if (error instanceof Error) {
                return {
                    name: String(error.name || 'Error'),
                    message: String(error.message || 'diagnostics subscriber failure'),
                    stack: String(error.stack || '')
                };
            }
            if (typeof error === 'object') {
                return {
                    name: String(error.name || 'Error'),
                    message: String(error.message || error.error || 'diagnostics subscriber failure'),
                    stack: String(error.stack || '')
                };
            }
            return {
                name: 'Error',
                message: String(error || 'diagnostics subscriber failure'),
                stack: ''
            };
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

        function createRuntimeEscalationEnvelope(input = {}) {
            const severity = normalizeEscalationSeverity(input.severity, escalationPolicy.diagnosticsSubscriberFailureSeverity);
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
                envelopeId: `${RMT_KERNEL_ESCALATION_ENVELOPE_SCHEMA}:diagnostics:${createdAt}:${escalationHistory.length + 1}`,
                source: 'diagnostics',
                eventType: 'diagnostics-subscriber-failure',
                severity,
                panicRelevant,
                trustRelevant,
                trigger: 'diagnostics-failure',
                scope: String(input.scope || 'diagnostics'),
                sourceRef: input.sourceRef ? String(input.sourceRef) : null,
                channel: String(input.channel || ''),
                commandName: null,
                correlationId: input.correlationId ? String(input.correlationId) : null,
                rootId: input.rootId ? String(input.rootId) : null,
                responseStatus: null,
                reasonCode: String(input.reasonCode || 'xtend.rmt.kernel-escalation.diagnostics-subscriber-failure'),
                diagnosticCode: String(input.diagnosticCode || 'rmt.kernel.escalation.diagnostics-subscriber-failure'),
                error: serializeEscalationError(input.error),
                createdAt,
                metadata: escalationPolicy.redactsPayload === false
                    ? clonePayload(input.metadata || {}, {})
                    : redactEscalationValue(clonePayload(input.metadata || {}, {}))
            };
        }

        function recordRuntimeEscalation(input = {}) {
            const envelope = createRuntimeEscalationEnvelope(input);
            if (panicMonitor && envelope.panicRelevant === true) {
                try {
                    envelope.panicState = panicMonitor.recordSignal({
                        trigger: 'diagnostics-failure',
                        severity: envelope.severity,
                        critical: true,
                        scope: envelope.scope,
                        sourceRef: envelope.sourceRef || envelope.channel,
                        reasonCode: envelope.reasonCode,
                        diagnosticCode: envelope.diagnosticCode,
                        correlationId: envelope.correlationId,
                        metadata: {
                            escalationSchema: RMT_KERNEL_ESCALATION_SCHEMA,
                            envelopeId: envelope.envelopeId,
                            channel: envelope.channel
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
            if (envelope.channel !== escalationPolicy.diagnosticsChannel) {
                try {
                    publish(escalationPolicy.diagnosticsChannel, envelope, {
                        source: RMT_KERNEL_ESCALATION_SCHEMA,
                        workpackage: RMT_KERNEL_ESCALATION_WORKPACKAGE,
                        severity: envelope.severity,
                        eventType: envelope.eventType,
                        panicRelevant: envelope.panicRelevant
                    });
                } catch (_error) {}
            }
            return clonePayload(envelope, {});
        }

        function recordDiagnosticsSubscriberFailure(snapshot, error, subscriberMeta = {}, phase = 'publish') {
            return recordRuntimeEscalation({
                channel: snapshot && snapshot.channel,
                severity: subscriberMeta.severity || escalationPolicy.diagnosticsSubscriberFailureSeverity,
                panicRelevant: subscriberMeta.panicRelevant === true || subscriberMeta.panicCritical === true,
                trustRelevant: subscriberMeta.trustRelevant === true,
                scope: subscriberMeta.scope || 'diagnostics',
                sourceRef: subscriberMeta.sourceRef || `diagnostics:${snapshot && snapshot.channel || 'unknown'}`,
                correlationId: subscriberMeta.correlationId || (snapshot && snapshot.meta && snapshot.meta.correlationId),
                rootId: subscriberMeta.rootId || (snapshot && snapshot.meta && snapshot.meta.rootId),
                reasonCode: subscriberMeta.reasonCode,
                diagnosticCode: subscriberMeta.diagnosticCode,
                error,
                metadata: {
                    phase,
                    snapshotVersion: snapshot && snapshot.version,
                    subscriber: subscriberMeta.name || subscriberMeta.subscriber || 'anonymous'
                }
            });
        }

        function pushHistoryEntry(entry) {
            history.push(entry);
            if (history.length > maxHistoryEntries) {
                history.splice(0, history.length - maxHistoryEntries);
            }
        }

        function ensureChannelState(channelName) {
            const safeChannelName = normalizeChannelName(channelName);
            if (!safeChannelName) return null;
            if (!channels.has(safeChannelName)) {
                channels.set(safeChannelName, {
                    name: safeChannelName,
                    version: 0,
                    updatedAt: 0,
                    meta: {},
                    payload: null
                });
            }
            return channels.get(safeChannelName);
        }

        function cloneChannelEntry(entry) {
            if (!entry) return null;
            return {
                channel: entry.name,
                version: entry.version,
                updatedAt: entry.updatedAt,
                meta: clonePayload(entry.meta, {}),
                payload: clonePayload(entry.payload, null)
            };
        }

        function listSubscribers(channelName) {
            const safeChannelName = normalizeChannelName(channelName);
            const bucket = subscribers.get(safeChannelName);
            return bucket instanceof Set ? Array.from(bucket) : [];
        }

        function publish(channelName, payload, meta = {}) {
            const channelState = ensureChannelState(channelName);
            if (!channelState) return null;

            channelState.version += 1;
            channelState.updatedAt = now();
            channelState.meta = clonePayload(meta, {});
            channelState.payload = clonePayload(payload, null);

            const snapshot = cloneChannelEntry(channelState);
            pushHistoryEntry({
                channel: snapshot.channel,
                version: snapshot.version,
                updatedAt: snapshot.updatedAt,
                meta: clonePayload(snapshot.meta, {})
            });

            listSubscribers(snapshot.channel).forEach((subscriber) => {
                try {
                    subscriber(snapshot);
                } catch (error) {
                    recordDiagnosticsSubscriberFailure(snapshot, error, subscriberEscalationMeta.get(subscriber), 'publish');
                    // Diagnostics subscribers must not interrupt the runtime path.
                }
            });

            return snapshot;
        }

        function subscribe(channelName, subscriber, options = {}) {
            const safeChannelName = normalizeChannelName(channelName);
            if (!safeChannelName || typeof subscriber !== 'function') {
                return function unsubscribeNoop() {};
            }

            if (!subscribers.has(safeChannelName)) {
                subscribers.set(safeChannelName, new Set());
            }
            const bucket = subscribers.get(safeChannelName);
            bucket.add(subscriber);
            subscriberEscalationMeta.set(subscriber, options && typeof options === 'object' ? clonePayload(options, {}) : {});

            if (options.replayLatest !== false) {
                const snapshot = getChannelSnapshot(safeChannelName, null);
                if (snapshot) {
                    try {
                        subscriber(snapshot);
                    } catch (error) {
                        recordDiagnosticsSubscriberFailure(snapshot, error, subscriberEscalationMeta.get(subscriber), 'replay');
                        // Diagnostics subscribers must not interrupt the runtime path.
                    }
                }
            }

            return function unsubscribe() {
                bucket.delete(subscriber);
                subscriberEscalationMeta.delete(subscriber);
                if (bucket.size === 0) {
                    subscribers.delete(safeChannelName);
                }
            };
        }

        function getChannelSnapshot(channelName, fallbackValue = null) {
            const safeChannelName = normalizeChannelName(channelName);
            if (!safeChannelName || !channels.has(safeChannelName)) return fallbackValue;
            return cloneChannelEntry(channels.get(safeChannelName));
        }

        function listChannels() {
            return Array.from(channels.values())
                .map((entry) => ({
                    channel: entry.name,
                    version: entry.version,
                    updatedAt: entry.updatedAt,
                    meta: clonePayload(entry.meta, {})
                }))
                .sort((left, right) => left.channel.localeCompare(right.channel));
        }

        function getHistory() {
            return history.map((entry) => ({
                channel: entry.channel,
                version: entry.version,
                updatedAt: entry.updatedAt,
                meta: clonePayload(entry.meta, {})
            }));
        }

        function createPublisher(channelName, defaultMeta = {}) {
            const safeChannelName = normalizeChannelName(channelName);
            if (!safeChannelName) {
                return function noopPublisher() {
                    return null;
                };
            }
            const baseMeta = clonePayload(defaultMeta, {});
            return function publishWithDefaults(payload, nextMeta = {}) {
                return publish(safeChannelName, payload, {
                    ...baseMeta,
                    ...(nextMeta && typeof nextMeta === 'object' ? nextMeta : {})
                });
            };
        }

        function removeChannel(channelName) {
            const safeChannelName = normalizeChannelName(channelName);
            if (!safeChannelName) return false;
            subscribers.delete(safeChannelName);
            return channels.delete(safeChannelName);
        }

        function reset() {
            channels.clear();
            subscribers.clear();
            history.splice(0, history.length);
            return true;
        }

        return Object.freeze({
            createPublisher,
            getChannelSnapshot,
            getEscalationPolicy: () => clonePayload(escalationPolicy, {}),
            getHistory,
            listEscalations: () => escalationHistory.map((entry) => clonePayload(entry, {})),
            listChannels,
            publish,
            recordEscalation: recordRuntimeEscalation,
            removeChannel,
            reset,
            subscribe
        });
    };
})(__XTENDRMT_GLOBAL__);

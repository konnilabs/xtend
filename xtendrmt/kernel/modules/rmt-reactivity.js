/* modules/rmt-reactivity.js */
(function registerRmtReactivityModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    appModules.createRmtReactivity = function createRmtReactivity(deps = {}) {
        let logicalTime = 0;
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => {
                logicalTime += 1;
                return logicalTime;
            });
        const maxHistoryEntries = Number.isFinite(deps.maxHistoryEntries) && deps.maxHistoryEntries > 0
            ? Math.max(Math.floor(deps.maxHistoryEntries), 24)
            : 160;
        const cloneValue = typeof deps.cloneValue === 'function'
            ? deps.cloneValue
            : function cloneSerializable(value, fallback = null) {
                try {
                    return JSON.parse(JSON.stringify(value));
                } catch (_error) {
                    return fallback;
                }
            };
        const diagnosticsHub = normalizeDiagnosticsHub(
            deps.diagnosticsHub
            || deps.rmtDiagnosticsHub
            || deps.schedulerDiagnosticsHub
            || null
        );

        const sources = new Map();
        const rootSubscriptions = new Map();
        const history = [];

        const SNAPSHOT_CHANNEL = 'rmt.reactivity.snapshot';
        const SELECTOR_CHANNEL = 'rmt.reactivity.selector';

        function normalizeText(value, fallback = '') {
            const safeValue = String(value || '').trim().toLowerCase();
            return safeValue || fallback;
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

        function cloneSerializableValue(value, fallback = null) {
            return cloneValue(value, fallback);
        }

        function cloneSelectedValue(value) {
            if (value === undefined) return undefined;
            return cloneSerializableValue(value, value);
        }

        function defaultSelectionEquals(left, right) {
            if (Object.is(left, right)) return true;
            if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
                return false;
            }
            try {
                return JSON.stringify(left) === JSON.stringify(right);
            } catch (_error) {
                return false;
            }
        }

        function pushHistoryEntry(entry) {
            history.push(entry);
            if (history.length > maxHistoryEntries) {
                history.splice(0, history.length - maxHistoryEntries);
            }
        }

        function normalizeSourceName(sourceName) {
            return normalizeText(sourceName, '');
        }

        function createSourceEnvelope(state) {
            if (!state) return null;
            return {
                source: state.name,
                version: state.version,
                updatedAt: state.updatedAt,
                meta: cloneSerializableValue(state.meta, {}),
                snapshot: cloneSerializableValue(state.snapshot, null)
            };
        }

        function ensureSourceState(sourceName, initialSnapshot = null, meta = {}) {
            const safeSourceName = normalizeSourceName(sourceName);
            if (!safeSourceName) return null;

            if (!sources.has(safeSourceName)) {
                sources.set(safeSourceName, {
                    name: safeSourceName,
                    version: 0,
                    updatedAt: 0,
                    meta: cloneSerializableValue(meta, {}),
                    snapshot: cloneSerializableValue(initialSnapshot, null),
                    subscribers: new Set()
                });
            } else if (initialSnapshot !== undefined && initialSnapshot !== null) {
                const existingState = sources.get(safeSourceName);
                if (existingState.snapshot === null && existingState.version === 0) {
                    existingState.snapshot = cloneSerializableValue(initialSnapshot, null);
                }
            }

            return sources.get(safeSourceName);
        }

        function ensureSource(sourceName, initialSnapshot = null, options = {}) {
            const state = ensureSourceState(sourceName, initialSnapshot, options.meta || {});
            return createSourceEnvelope(state);
        }

        function getSourceSnapshot(sourceName, fallbackValue = null) {
            const state = ensureSourceState(sourceName);
            if (!state) return fallbackValue;
            const snapshot = cloneSerializableValue(state.snapshot, fallbackValue);
            return snapshot === undefined ? fallbackValue : snapshot;
        }

        function getSourceEnvelope(sourceName, fallbackValue = null) {
            const state = ensureSourceState(sourceName);
            if (!state) return fallbackValue;
            return createSourceEnvelope(state);
        }

        function listSources() {
            return Array.from(sources.values())
                .map((state) => ({
                    source: state.name,
                    version: state.version,
                    updatedAt: state.updatedAt,
                    meta: cloneSerializableValue(state.meta, {})
                }))
                .sort((left, right) => left.source.localeCompare(right.source));
        }

        function notifySubscribers(state, envelope) {
            if (!state || !(state.subscribers instanceof Set) || !state.subscribers.size) return;
            Array.from(state.subscribers).forEach((subscriber) => {
                try {
                    subscriber(envelope);
                } catch (_error) {
                    // Reactive subscribers must not interrupt the runtime path.
                }
            });
        }

        function publish(sourceName, snapshot, options = {}) {
            const state = ensureSourceState(sourceName, snapshot, options.meta || {});
            if (!state) return null;

            state.version += 1;
            state.updatedAt = now();
            state.meta = cloneSerializableValue(options.meta, {});
            state.snapshot = cloneSerializableValue(snapshot, null);

            const envelope = createSourceEnvelope(state);
            pushHistoryEntry({
                kind: 'publish',
                source: envelope.source,
                version: envelope.version,
                updatedAt: envelope.updatedAt,
                reason: normalizeText(options.reason, 'publish'),
                meta: cloneSerializableValue(envelope.meta, {})
            });
            diagnosticsHub.publish(SNAPSHOT_CHANNEL, envelope, {
                source: 'rmt-reactivity',
                category: 'snapshot_publish',
                reason: normalizeText(options.reason, 'publish')
            });
            notifySubscribers(state, envelope);
            return envelope;
        }

        function mutate(sourceName, mutator, options = {}) {
            const sourceEnvelope = ensureSource(sourceName, options.initialSnapshot || null, {
                meta: options.meta || {}
            });
            if (!sourceEnvelope) return null;
            const currentSnapshot = getSourceSnapshot(sourceName, {});
            const workingCopy = cloneSerializableValue(currentSnapshot, currentSnapshot);
            const nextSnapshot = typeof mutator === 'function'
                ? mutator(workingCopy, {
                    source: sourceEnvelope.source,
                    version: sourceEnvelope.version,
                    previousSnapshot: currentSnapshot
                })
                : workingCopy;
            return publish(sourceName, nextSnapshot === undefined ? workingCopy : nextSnapshot, {
                reason: options.reason || 'mutate',
                meta: options.meta || {}
            });
        }

        function read(sourceName, selector, fallbackValue = null) {
            const snapshot = getSourceSnapshot(sourceName, undefined);
            if (snapshot === undefined) return fallbackValue;
            if (typeof selector !== 'function') {
                return cloneSelectedValue(snapshot);
            }
            try {
                const selectedValue = selector(snapshot);
                return selectedValue === undefined
                    ? fallbackValue
                    : cloneSelectedValue(selectedValue);
            } catch (_error) {
                return fallbackValue;
            }
        }

        function subscribe(sourceName, subscriber, options = {}) {
            if (typeof subscriber !== 'function') {
                return function unsubscribeNoop() {};
            }

            const state = ensureSourceState(sourceName, null, {});
            if (!state) {
                return function unsubscribeInvalidSource() {};
            }

            state.subscribers.add(subscriber);

            if (options.replayLatest !== false && (state.version > 0 || state.snapshot !== null)) {
                try {
                    subscriber(createSourceEnvelope(state));
                } catch (_error) {
                    // Reactive subscribers must not interrupt the runtime path.
                }
            }

            return function unsubscribe() {
                state.subscribers.delete(subscriber);
            };
        }

        function watch(sourceName, selector, effect, options = {}) {
            if (typeof effect !== 'function') {
                return function disposeWatchNoop() {};
            }

            const equals = typeof options.equals === 'function'
                ? options.equals
                : defaultSelectionEquals;
            let hasSelection = false;
            let previousSelection = undefined;

            const subscriber = (envelope) => {
                const sourceSnapshot = envelope && Object.prototype.hasOwnProperty.call(envelope, 'snapshot')
                    ? envelope.snapshot
                    : getSourceSnapshot(sourceName, null);
                const nextSelection = typeof selector === 'function'
                    ? selector(sourceSnapshot, envelope)
                    : sourceSnapshot;
                const comparableSelection = cloneSelectedValue(nextSelection);

                if (hasSelection && equals(previousSelection, comparableSelection)) {
                    return;
                }

                const previousValue = previousSelection;
                previousSelection = comparableSelection;
                hasSelection = true;

                diagnosticsHub.publish(SELECTOR_CHANNEL, {
                    source: normalizeSourceName(sourceName),
                    selector: String(options.selectorName || '').trim() || '',
                    value: cloneSerializableValue(comparableSelection, null),
                    version: envelope && Number.isFinite(envelope.version) ? envelope.version : 0,
                    updatedAt: envelope && Number.isFinite(envelope.updatedAt) ? envelope.updatedAt : now()
                }, {
                    source: 'rmt-reactivity',
                    category: 'selector_update'
                });

                try {
                    effect(comparableSelection, {
                        previousValue,
                        envelope: envelope || null,
                        source: normalizeSourceName(sourceName)
                    });
                } catch (_error) {
                    // Reactive effects must not interrupt the runtime path.
                }
            };

            return subscribe(sourceName, subscriber, {
                replayLatest: options.fireImmediately === true || options.replayLatest !== false
            });
        }

        function registerRootDisposer(rootId, disposer) {
            const safeRootId = String(rootId || '').trim();
            if (!safeRootId || typeof disposer !== 'function') return disposer;
            if (!rootSubscriptions.has(safeRootId)) {
                rootSubscriptions.set(safeRootId, new Set());
            }
            rootSubscriptions.get(safeRootId).add(disposer);
            return disposer;
        }

        function watchRoot(rootId, sourceName, selector, effect, options = {}) {
            const safeRootId = String(rootId || '').trim();
            if (!safeRootId) {
                return function disposeRootWatchNoop() {};
            }

            const unsubscribe = watch(sourceName, selector, effect, options);
            registerRootDisposer(safeRootId, unsubscribe);
            return function disposeRootWatch() {
                if (rootSubscriptions.has(safeRootId)) {
                    rootSubscriptions.get(safeRootId).delete(unsubscribe);
                    if (rootSubscriptions.get(safeRootId).size === 0) {
                        rootSubscriptions.delete(safeRootId);
                    }
                }
                unsubscribe();
            };
        }

        function disposeRoot(rootId) {
            const safeRootId = String(rootId || '').trim();
            if (!safeRootId || !rootSubscriptions.has(safeRootId)) return 0;
            const disposers = Array.from(rootSubscriptions.get(safeRootId));
            rootSubscriptions.delete(safeRootId);
            disposers.forEach((dispose) => {
                try {
                    dispose();
                } catch (_error) {
                    // Reactive root disposers must not interrupt the runtime path.
                }
            });
            return disposers.length;
        }

        function getHistory() {
            return history.map((entry) => ({
                kind: entry.kind,
                source: entry.source,
                version: entry.version,
                updatedAt: entry.updatedAt,
                reason: entry.reason,
                meta: cloneSerializableValue(entry.meta, {})
            }));
        }

        function reset() {
            sources.clear();
            rootSubscriptions.clear();
            history.splice(0, history.length);
            return true;
        }

        return Object.freeze({
            disposeRoot,
            ensureSource,
            getHistory,
            getSourceEnvelope,
            getSourceSnapshot,
            listSources,
            mutate,
            publish,
            read,
            reset,
            subscribe,
            watch,
            watchRoot
        });
    };
})(__XTENDRMT_GLOBAL__);

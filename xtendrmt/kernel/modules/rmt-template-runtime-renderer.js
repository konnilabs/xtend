/* modules/rmt-template-runtime-renderer.js */
(function registerRmtTemplateRuntimeRendererModule(global) {
    const appModules = global.AppModules || (global.AppModules = {});

    const SUPPORTED_BINDING_KINDS = Object.freeze([
        'text',
        'attribute',
        'property',
        'class_toggle',
        'command',
        'root_event',
        'template_outlet',
        'template_repeat'
    ]);
    const SUPPORTED_SLOT_KINDS = Object.freeze([
        'text',
        'html_fragment',
        'template'
    ]);
    const MISSING_VALUE = Symbol('rmt_template_binding_missing');
    const RMT_DOM_COMMIT_RESULT_SCHEMA = 'xtend.rmt.dom-commit-result.v1';
    const RMT_DOM_APPLICATION_BINDING_SCHEMA = 'xtend.rmt.dom-application-binding.v1';
    const RMT_DOM_BINDING_SCOPE_SCHEMA = 'xtend.rmt.dom-binding-scope.v1';
    const RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA = 'xtend.rmt.runtime-trust-sink-adapter.v1';
    const RMT_KERNEL_TRUST_AUTHORITY_SCHEMA = 'xtend.rmt.kernel-trust-authority.v1';
    const RMT_KERNEL_TRUST_VERDICT_SCHEMA = 'xtend.rmt.kernel-trust-verdict.v1';
    const RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA = 'xtend.rmt.kernel-trust-diagnostic.v1';
    const RMT_KERNEL_TRUST_RUNTIME_WORKPACKAGE = 'RKSH-WP-02';
    const RMT_TRUSTED_DOM_BOUNDARY = 'xtend.security.sanitizing-boundary.v1';
    const RMT_TRUSTED_DOM_SANITIZER_SCHEMA = 'xtend.security.trusted-dom-sanitizer.v1';
    const RMT_RUNTIME_TRUST_DIAGNOSTIC_CHANNEL = 'rmt.kernel.trust';
    const RMT_KERNEL_PANIC_MONITOR_SCHEMA = 'xtend.rmt.kernel-panic-monitor.v1';
    const RMT_KERNEL_PANIC_STATE_SCHEMA = 'xtend.rmt.kernel-panic-state.v1';
    const RMT_KERNEL_PANIC_EVENT_SCHEMA = 'xtend.rmt.kernel-panic-event.v1';
    const RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE = 'RKSH-WP-04';
    const RMT_RUNTIME_PANIC_DIAGNOSTIC_CHANNEL = 'rmt.kernel.panic';
    const RMT_KERNEL_RECOVERY_SCHEMA = 'xtend.rmt.kernel-recovery.v1';
    const RMT_KERNEL_RECOVERY_POLICY_SCHEMA = 'xtend.rmt.kernel-recovery-policy.v1';
    const RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA = 'xtend.rmt.kernel-recovery-outcome.v1';
    const RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA = 'xtend.rmt.kernel-recovery-safe-snapshot.v1';
    const RMT_KERNEL_RECOVERY_WORKPACKAGE = 'RKSH-WP-05';
    const RMT_RUNTIME_RECOVERY_DIAGNOSTIC_CHANNEL = 'rmt.kernel.recovery';
    const RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE = 'RKSH-WP-03';
    const RMT_RUNTIME_URL_ATTRIBUTES = Object.freeze([
        'href',
        'src',
        'srcset',
        'action',
        'formaction',
        'poster',
        'xlink:href'
    ]);
    const RMT_RUNTIME_SAFE_ATTRIBUTES = Object.freeze([
        'id',
        'class',
        'title',
        'role',
        'name',
        'type',
        'value',
        'alt',
        'part',
        'slot',
        'for',
        'rel',
        'target',
        'loading',
        'decoding',
        'width',
        'height',
        'placeholder',
        'autocomplete',
        'min',
        'max',
        'step',
        'rows',
        'cols',
        'tabindex',
        'hidden',
        'disabled',
        'checked',
        'selected',
        'required',
        'readonly',
        'multiple',
        'open',
        'controls',
        'muted',
        'loop',
        'autoplay',
        'playsinline',
        'download',
        'data-rm-action',
        'data-rmt-repeat-item',
        'data-rmt-repeat-key'
    ]);
    const RMT_RUNTIME_SAFE_PROPERTY_WRITES = Object.freeze([
        'textcontent',
        'innertext',
        'value',
        'checked',
        'disabled',
        'selected',
        'selectedindex',
        'arialabel',
        'ariadescription',
        'role',
        'id',
        'title',
        'classname',
        'name',
        'type',
        'placeholder',
        'tabindex',
        'hidden',
        'readonly',
        'multiple',
        'required',
        'open'
    ]);
    const RMT_RUNTIME_URL_PROPERTIES = Object.freeze([
        'href',
        'src',
        'action',
        'formaction',
        'poster'
    ]);
    const RMT_RUNTIME_FORBIDDEN_PROPERTY_WRITES = Object.freeze([
        'innerhtml',
        'outerhtml',
        'srcdoc',
        'onclick',
        'onerror',
        'onload'
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

    function createRuntimePanicMonitor(options = {}) {
        const panicDiagnosticsHub = options.diagnosticsHub && typeof options.diagnosticsHub.publish === 'function'
            ? options.diagnosticsHub
            : null;
        const now = typeof options.now === 'function'
            ? options.now
            : (() => Date.now());
        const repeatedBlockThreshold = Number.isFinite(options.repeatedBlockThreshold) && options.repeatedBlockThreshold > 0
            ? Math.max(Math.floor(options.repeatedBlockThreshold), 1)
            : 3;
        const panicEvents = [];
        let panicEventSequence = 0;
        let panicSnapshot = {
            schema: RMT_KERNEL_PANIC_STATE_SCHEMA,
            monitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
            workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
            state: 'none',
            previousState: 'none',
            severity: 'info',
            trigger: 'manual',
            panicId: null,
            correlationId: null,
            sourceRef: null,
            scope: null,
            sink: null,
            reasonCode: null,
            diagnosticCode: null,
            blockedCommitCount: 0,
            criticalViolationCount: 0,
            recoveryAttemptCount: 0,
            recoveryFailureCount: 0,
            recoveryAction: 'none',
            affectedScopes: [],
            affectedJobs: [],
            activeSince: null,
            recoveringSince: null,
            recoveredAt: null,
            failedAt: null,
            lastSeenAt: now(),
            eventCount: 0,
            lastEventId: null,
            lastVerdict: null,
            metadata: {
                repeatedBlockThreshold
            }
        };

        function getPanicSnapshot() {
            return cloneSerializable(panicSnapshot, {});
        }

        function listPanicEvents() {
            return panicEvents.map((event) => cloneSerializable(event, {}));
        }

        function redactRuntimePanicMetadata(value, key = '') {
            if (value === null || value === undefined) return value;
            if (Array.isArray(value)) return value.map((entry) => redactRuntimePanicMetadata(entry, key));
            if (typeof value === 'object') {
                return Object.keys(value).reduce((result, entryKey) => {
                    result[entryKey] = redactRuntimePanicMetadata(value[entryKey], entryKey);
                    return result;
                }, {});
            }
            if (typeof value !== 'string') return value;
            const normalizedKey = clampString(key, '').toLowerCase();
            const sensitiveKey = /(value|html|markup|raw|payload|sample|source|script)/.test(normalizedKey);
            const unsafeSample = /<s*script|javascript:|vbscript:|srcdoc/i.test(value);
            if (sensitiveKey || unsafeSample) {
                return {
                    redacted: true,
                    length: value.length
                };
            }
            return value.length > 256 ? value.slice(0, 253) + '...' : value;
        }

        function publishPanicEvent(event) {
            if (!panicDiagnosticsHub) return;
            try {
                panicDiagnosticsHub.publish(RMT_RUNTIME_PANIC_DIAGNOSTIC_CHANNEL, event, {
                    source: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
                    workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
                    state: event.state,
                    panicId: event.panicId || undefined,
                    correlationId: event.correlationId || undefined
                });
            } catch (_error) {}
        }

        function createPanicId(input = {}) {
            const correlationId = clampString(input.correlationId, '');
            if (correlationId) return 'panic:' + correlationId;
            return 'panic:' + clampString(input.scope, 'runtime') + ':' + clampString(input.trigger, 'manual');
        }

        function rememberPanicTransition(input = {}, type = 'signal-recorded') {
            const previousState = panicSnapshot.state;
            const nextState = clampString(input.state, previousState);
            const at = now();
            panicEventSequence += 1;
            const event = {
                schema: RMT_KERNEL_PANIC_EVENT_SCHEMA,
                monitorSchema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
                stateSchema: RMT_KERNEL_PANIC_STATE_SCHEMA,
                workpackage: RMT_KERNEL_PANIC_MONITOR_WORKPACKAGE,
                eventId: RMT_KERNEL_PANIC_EVENT_SCHEMA + ':' + panicEventSequence,
                type,
                previousState,
                state: nextState,
                severity: clampString(input.severity, panicSnapshot.severity || 'warning'),
                trigger: clampString(input.trigger, 'manual'),
                panicId: clampString(input.panicId, panicSnapshot.panicId),
                correlationId: clampString(input.correlationId, panicSnapshot.correlationId),
                sourceRef: clampString(input.sourceRef, panicSnapshot.sourceRef),
                scope: clampString(input.scope, panicSnapshot.scope),
                sink: clampString(input.sink, panicSnapshot.sink),
                reasonCode: clampString(input.reasonCode, panicSnapshot.reasonCode),
                diagnosticCode: clampString(input.diagnosticCode, panicSnapshot.diagnosticCode),
                blockedCommitCount: Number.isFinite(input.blockedCommitCount) ? input.blockedCommitCount : panicSnapshot.blockedCommitCount,
                criticalViolationCount: Number.isFinite(input.criticalViolationCount) ? input.criticalViolationCount : panicSnapshot.criticalViolationCount,
                recoveryAttemptCount: Number.isFinite(input.recoveryAttemptCount) ? input.recoveryAttemptCount : panicSnapshot.recoveryAttemptCount,
                recoveryFailureCount: Number.isFinite(input.recoveryFailureCount) ? input.recoveryFailureCount : panicSnapshot.recoveryFailureCount,
                recoveryAction: clampString(input.recoveryAction, panicSnapshot.recoveryAction || 'none'),
                at,
                metadata: redactRuntimePanicMetadata(input.metadata)
            };
            panicEvents.push(event);
            const affectedScopes = new Set(Array.isArray(panicSnapshot.affectedScopes) ? panicSnapshot.affectedScopes : []);
            if (event.scope) affectedScopes.add(event.scope);
            const affectedJobs = new Set(Array.isArray(panicSnapshot.affectedJobs) ? panicSnapshot.affectedJobs : []);
            (Array.isArray(input.affectedJobs) ? input.affectedJobs : []).forEach((job) => {
                const safeJob = clampString(job, '');
                if (safeJob) affectedJobs.add(safeJob);
            });
            panicSnapshot = {
                ...panicSnapshot,
                state: event.state,
                previousState,
                severity: event.severity,
                trigger: event.trigger,
                panicId: event.panicId,
                correlationId: event.correlationId,
                sourceRef: event.sourceRef,
                scope: event.scope,
                sink: event.sink,
                reasonCode: event.reasonCode,
                diagnosticCode: event.diagnosticCode,
                blockedCommitCount: event.blockedCommitCount,
                criticalViolationCount: event.criticalViolationCount,
                recoveryAttemptCount: event.recoveryAttemptCount,
                recoveryFailureCount: event.recoveryFailureCount,
                recoveryAction: event.recoveryAction,
                affectedScopes: Array.from(affectedScopes),
                affectedJobs: Array.from(affectedJobs),
                activeSince: event.state === 'active' && !panicSnapshot.activeSince ? at : panicSnapshot.activeSince,
                recoveringSince: event.state === 'recovering' ? at : (event.state === 'active' ? null : panicSnapshot.recoveringSince),
                recoveredAt: event.state === 'recovered' ? at : panicSnapshot.recoveredAt,
                failedAt: event.state === 'failed' ? at : panicSnapshot.failedAt,
                lastSeenAt: at,
                eventCount: panicEvents.length,
                lastEventId: event.eventId,
                lastVerdict: cloneSerializable(input.lastVerdict, panicSnapshot.lastVerdict),
                metadata: redactRuntimePanicMetadata(input.metadata)
            };
            publishPanicEvent(event);
            return getPanicSnapshot();
        }

        function recordSignal(input = {}) {
            const verdictKind = clampString(input.verdict, '');
            const blocked = input.blocked === true || input.commitAllowed === false || verdictKind === 'blocked';
            const critical = input.critical === true
                || input.panicCandidate === true
                || verdictKind === 'panic'
                || clampString(input.severity, '') === 'fatal'
                || clampString(input.severity, '') === 'critical';
            const nextBlockedCount = panicSnapshot.blockedCommitCount + (blocked ? 1 : 0);
            const nextCriticalCount = panicSnapshot.criticalViolationCount + (critical ? 1 : 0);
            let nextState = panicSnapshot.state;
            let nextSeverity = clampString(input.severity, blocked ? 'warning' : 'info');
            let nextTrigger = clampString(input.trigger, blocked ? 'trust-verdict-blocked' : 'manual');
            let eventType = 'signal-recorded';

            if (input.recoveryFailure === true || nextTrigger === 'recovery-failure') {
                nextState = 'failed';
                nextSeverity = 'fatal';
                eventType = 'recovery-failed';
            } else if (critical) {
                nextState = 'active';
                nextSeverity = nextSeverity === 'fatal' ? 'fatal' : 'critical';
                nextTrigger = 'trust-verdict-panic';
                eventType = 'state-transition';
            } else if (blocked && nextBlockedCount >= repeatedBlockThreshold) {
                nextState = 'active';
                nextSeverity = 'critical';
                nextTrigger = 'threshold-breached';
                eventType = 'state-transition';
            } else if (blocked && (panicSnapshot.state === 'none' || panicSnapshot.state === 'recovered')) {
                nextState = 'suspected';
                eventType = 'state-transition';
            }

            return rememberPanicTransition({
                state: nextState,
                severity: nextSeverity,
                trigger: nextTrigger,
                panicId: clampString(input.panicId, '') || panicSnapshot.panicId || (nextState === 'active' ? createPanicId(input) : null),
                correlationId: input.correlationId,
                sourceRef: input.sourceRef,
                scope: input.scope,
                sink: input.sink,
                reasonCode: input.reasonCode,
                diagnosticCode: input.diagnosticCode,
                blockedCommitCount: nextBlockedCount,
                criticalViolationCount: nextCriticalCount,
                recoveryFailureCount: panicSnapshot.recoveryFailureCount + (eventType === 'recovery-failed' ? 1 : 0),
                recoveryAction: input.recoveryAction || panicSnapshot.recoveryAction,
                affectedJobs: input.affectedJobs,
                lastVerdict: input.lastVerdict,
                metadata: redactRuntimePanicMetadata(input.metadata)
            }, eventType);
        }

        function recordTrustVerdict(verdict = {}) {
            const verdictKind = clampString(verdict.verdict, verdict.commitAllowed === false ? 'blocked' : 'trusted');
            if (verdictKind !== 'blocked' && verdictKind !== 'panic' && verdict.panicCandidate !== true) {
                return getPanicSnapshot();
            }
            return recordSignal({
                verdict: verdictKind,
                blocked: verdict.commitAllowed === false || verdictKind === 'blocked',
                critical: verdict.panicCandidate === true || verdictKind === 'panic',
                panicCandidate: verdict.panicCandidate === true,
                severity: verdict.severity,
                trigger: verdictKind === 'panic' || verdict.panicCandidate === true ? 'trust-verdict-panic' : 'trust-verdict-blocked',
                sourceRef: verdict.sourceRef,
                scope: verdict.scope,
                sink: verdict.sink,
                reasonCode: verdict.reasonCode,
                diagnosticCode: verdict.diagnosticCode,
                correlationId: verdict.correlationId,
                lastVerdict: {
                    schema: verdict.schema || RMT_KERNEL_TRUST_VERDICT_SCHEMA,
                    verdict: verdictKind,
                    scope: verdict.scope,
                    sink: verdict.sink,
                    severity: verdict.severity,
                    reasonCode: verdict.reasonCode,
                    diagnosticCode: verdict.diagnosticCode,
                    commitAllowed: verdict.commitAllowed,
                    panicCandidate: verdict.panicCandidate === true,
                    correlationId: verdict.correlationId
                },
                metadata: {
                    trustVerdict: verdictKind,
                    trustVerdictSchema: verdict.schema || RMT_KERNEL_TRUST_VERDICT_SCHEMA,
                    source: verdict.source || RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
                    workpackage: verdict.workpackage || RMT_KERNEL_TRUST_RUNTIME_WORKPACKAGE
                }
            });
        }

        function beginRecovery(input = {}) {
            return rememberPanicTransition({
                state: 'recovering',
                severity: 'warning',
                trigger: clampString(input.trigger, 'manual'),
                recoveryAttemptCount: panicSnapshot.recoveryAttemptCount + 1,
                recoveryAction: clampString(input.recoveryAction || input.action, 'quarantine-scope'),
                correlationId: input.correlationId,
                panicId: input.panicId,
                metadata: redactRuntimePanicMetadata(input.metadata)
            }, 'recovery-started');
        }

        function completeRecovery(input = {}) {
            return rememberPanicTransition({
                state: 'recovered',
                severity: 'info',
                trigger: clampString(input.trigger, 'manual'),
                recoveryAction: clampString(input.recoveryAction || input.action, panicSnapshot.recoveryAction || 'render-safe-fallback'),
                correlationId: input.correlationId,
                panicId: input.panicId,
                metadata: redactRuntimePanicMetadata(input.metadata)
            }, 'recovery-completed');
        }

        function failRecovery(input = {}) {
            return rememberPanicTransition({
                state: 'failed',
                severity: 'fatal',
                trigger: 'recovery-failure',
                recoveryFailureCount: panicSnapshot.recoveryFailureCount + 1,
                recoveryAction: clampString(input.recoveryAction || input.action, panicSnapshot.recoveryAction || 'manual-intervention'),
                reasonCode: clampString(input.reasonCode, 'rmt.kernel.panic.recovery_failed'),
                diagnosticCode: clampString(input.diagnosticCode, 'rmt.kernel.panic.recovery_failed'),
                correlationId: input.correlationId,
                panicId: input.panicId,
                metadata: redactRuntimePanicMetadata(input.metadata)
            }, 'recovery-failed');
        }

        return Object.freeze({
            schema: RMT_KERNEL_PANIC_MONITOR_SCHEMA,
            recordSignal,
            recordTrustVerdict,
            beginRecovery,
            completeRecovery,
            failRecovery,
            getSnapshot: getPanicSnapshot,
            listEvents: listPanicEvents
        });
    }

    function decodeRuntimeTrustedDomAttributeValue(value) {
        return String(value || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);?/gi, (match, entity) => {
            const normalizedEntity = String(entity || '').toLowerCase();
            if (normalizedEntity[0] === '#') {
                const radix = normalizedEntity[1] === 'x' ? 16 : 10;
                const digits = radix === 16 ? normalizedEntity.slice(2) : normalizedEntity.slice(1);
                const codePoint = parseInt(digits, radix);
                if (Number.isFinite(codePoint)) {
                    try {
                        return String.fromCodePoint(codePoint);
                    } catch (_) {
                        return match;
                    }
                }
                return match;
            }
            return ({
                amp: '&',
                apos: "'",
                colon: ':',
                gt: '>',
                lt: '<',
                newline: '\n',
                quot: '"',
                tab: '\t'
            })[normalizedEntity] || match;
        });
    }

    function isAllowedRuntimeTrustedDomUrl(value) {
        const normalized = decodeRuntimeTrustedDomAttributeValue(value).trim().replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();
        if (!normalized) return true;
        if (normalized.startsWith('#') || normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) return true;
        if (normalized.startsWith('data:')) return normalized.startsWith('data:image/');
        return !(
            normalized.startsWith('javascript:')
            || normalized.startsWith('data:text/html')
            || normalized.startsWith('data:text/javascript')
            || normalized.startsWith('data:application/javascript')
            || normalized.startsWith('data:application/ecmascript')
            || normalized.startsWith('vbscript:')
        );
    }

    function sanitizeRuntimeTrustedDomHtml(html) {
        let output = String(html || '');
        const removed = [];
        ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form'].forEach((tagName) => {
            const paired = new RegExp('<\\s*' + tagName + '\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*' + tagName + '\\s*>', 'gi');
            output = output.replace(paired, (match) => {
                removed.push({ type: 'element', name: tagName, sampleLength: match.length });
                return '';
            });

            const single = new RegExp('<\\s*' + tagName + '\\b[^>]*\\/?\\s*>', 'gi');
            output = output.replace(single, (match) => {
                removed.push({ type: 'element', name: tagName, sampleLength: match.length });
                return '';
            });
        });

        output = output.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (match) => {
            removed.push({ type: 'attribute', name: match.trim().split('=')[0] });
            return '';
        });

        output = output.replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, () => {
            removed.push({ type: 'attribute', name: 'srcdoc' });
            return '';
        });

        output = output.replace(/\s+(href|src|srcset|action|formaction|poster|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (match, name, rawValue) => {
            const unquoted = String(rawValue || '').replace(/^["']|["']$/g, '');
            if (!isAllowedRuntimeTrustedDomUrl(unquoted)) {
                removed.push({ type: 'url', name, valueLength: unquoted.length });
                return '';
            }
            return match;
        });

        return {
            schema: RMT_TRUSTED_DOM_SANITIZER_SCHEMA,
            ok: true,
            sanitized: true,
            boundary: RMT_TRUSTED_DOM_BOUNDARY,
            markupClass: 'htmlFragment',
            html: output,
            removed,
            removedCount: removed.length
        };
    }

    function toPlainObject(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        return value;
    }

    function isElementLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.addEventListener === 'function'
            && typeof value.removeEventListener === 'function';
    }

    function normalizeBindingKind(value, fallbackValue = '') {
        const safeValue = clampString(value, fallbackValue).toLowerCase();
        return SUPPORTED_BINDING_KINDS.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeSlotKind(value, fallbackValue = 'text') {
        const safeValue = clampString(value, fallbackValue).toLowerCase();
        return SUPPORTED_SLOT_KINDS.includes(safeValue) ? safeValue : fallbackValue;
    }

    function normalizeSourceNames(value, fallbackValues = []) {
        const rawValues = Array.isArray(value)
            ? value
            : (value === undefined || value === null || value === ''
                ? fallbackValues
                : [value]);
        const uniqueValues = new Set();
        rawValues.forEach((entry) => {
            const safeEntry = clampString(entry, '');
            if (safeEntry) uniqueValues.add(safeEntry);
        });
        return Array.from(uniqueValues);
    }

    function getObjectPathValue(source, path, fallbackValue = MISSING_VALUE) {
        const safePath = clampString(path, '');
        if (!safePath) {
            return source === undefined ? fallbackValue : source;
        }

        const segments = safePath.split('.').map((segment) => clampString(segment, ''));
        let currentValue = source;
        for (let index = 0; index < segments.length; index += 1) {
            const segment = segments[index];
            if (!segment) return fallbackValue;
            if (currentValue === null || currentValue === undefined) {
                return fallbackValue;
            }
            if (typeof currentValue !== 'object' && typeof currentValue !== 'function') {
                return fallbackValue;
            }
            if (!Object.prototype.hasOwnProperty.call(currentValue, segment)) {
                return fallbackValue;
            }
            currentValue = currentValue[segment];
        }
        return currentValue;
    }

    function tryResolvePathVariants(source, path, options = {}) {
        const safePath = clampString(path, '');
        const directValue = getObjectPathValue(source, safePath, MISSING_VALUE);
        if (directValue !== MISSING_VALUE) return directValue;
        if (!safePath || safePath.indexOf('.') === -1) return MISSING_VALUE;

        const segments = safePath.split('.');
        const bindingAlias = clampString(options.bindingAlias, '');
        if (bindingAlias && segments[0] === bindingAlias) {
            const strippedValue = getObjectPathValue(source, segments.slice(1).join('.'), MISSING_VALUE);
            if (strippedValue !== MISSING_VALUE) return strippedValue;
        }

        if (options.allowLeadingScopeStrip === true && segments.length > 1) {
            const strippedValue = getObjectPathValue(source, segments.slice(1).join('.'), MISSING_VALUE);
            if (strippedValue !== MISSING_VALUE) return strippedValue;
        }

        return MISSING_VALUE;
    }

    function toBoolean(value) {
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (!normalized) return false;
            if (
                normalized === 'false'
                || normalized === '0'
                || normalized === 'off'
                || normalized === 'no'
                || normalized === 'null'
                || normalized === 'undefined'
            ) {
                return false;
            }
            return true;
        }
        return !!value;
    }

    function updateClassNameFallback(element, className, enabled) {
        const safeClassName = clampString(className, '');
        if (!safeClassName || !element) return false;
        const currentTokens = clampString(element.className, '')
            .split(/\s+/)
            .filter(Boolean);
        const nextTokens = currentTokens.filter((token) => token !== safeClassName);
        if (enabled) nextTokens.push(safeClassName);
        element.className = nextTokens.join(' ');
        return true;
    }

    function cloneDataset(dataset) {
        const result = {};
        if (!dataset || typeof dataset !== 'object') return result;
        Object.keys(dataset).forEach((key) => {
            result[key] = dataset[key];
        });
        return result;
    }

    function normalizeInteractionRecord(value, fallbackValue = {}) {
        if (value === undefined || value === null) {
            return cloneSerializable(fallbackValue, {});
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return cloneSerializable(value, {});
        }
        return {
            value
        };
    }

    function stableBindingHash(value) {
        const source = String(value || '');
        let hash = 2166136261;
        for (let index = 0; index < source.length; index += 1) {
            hash ^= source.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    function normalizeBindingIdentifier(value, fallbackValue) {
        const candidate = clampString(value, '');
        if (candidate && /^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(candidate)) return candidate;
        return clampString(fallbackValue, 'rmt.template.binding');
    }

    appModules.createRmtTemplateRuntimeRenderer = function createRmtTemplateRuntimeRenderer(deps = {}) {
        const windowTarget = deps.windowTarget || global;
        const documentTarget = deps.documentTarget || (windowTarget && windowTarget.document) || null;
        const publicApi = deps.publicApi && typeof deps.publicApi === 'object'
            ? deps.publicApi
            : (typeof deps.getPublicApi === 'function' ? deps.getPublicApi() : null);
        const templateApi = deps.templateApi && typeof deps.templateApi === 'object'
            ? deps.templateApi
            : (publicApi && typeof publicApi.getTemplateApi === 'function'
                ? publicApi.getTemplateApi()
                : null);
        const rmtCore = deps.rmtCore && typeof deps.rmtCore === 'object'
            ? deps.rmtCore
            : (publicApi && typeof publicApi.getCore === 'function'
                ? publicApi.getCore()
                : null);
        const rmt = deps.rmt && typeof deps.rmt === 'object'
            ? deps.rmt
            : (rmtCore && typeof rmtCore.getRmt === 'function'
                ? rmtCore.getRmt()
                : (publicApi && typeof publicApi.getRmt === 'function'
                    ? publicApi.getRmt()
                    : null));
        const reactivity = deps.reactivity && typeof deps.reactivity === 'object'
            ? deps.reactivity
            : (rmtCore && typeof rmtCore.getReactivity === 'function'
                ? rmtCore.getReactivity()
                : (rmt && typeof rmt.getReactivity === 'function'
                    ? rmt.getReactivity()
                    : null));
        const now = typeof deps.now === 'function'
            ? deps.now
            : (() => Date.now());
        const maxSlotDepth = Number.isFinite(deps.maxSlotDepth) && deps.maxSlotDepth > 0
            ? Math.max(Math.floor(deps.maxSlotDepth), 1)
            : 8;
        const bindingScopes = new WeakMap();
        let bindingScopeSequence = 0;

        const diagnosticsHub = deps.diagnosticsHub && typeof deps.diagnosticsHub.publish === 'function'
            ? deps.diagnosticsHub
            : null;
        const kernelTrustAuthority = deps.kernelTrustAuthority && typeof deps.kernelTrustAuthority === 'object'
            ? deps.kernelTrustAuthority
            : null;
        const sanitizeHtmlOutput = typeof deps.sanitizeHtmlOutput === 'function'
            ? deps.sanitizeHtmlOutput
            : (typeof deps.sanitizeTrustedDomHtml === 'function'
                ? deps.sanitizeTrustedDomHtml
                : sanitizeRuntimeTrustedDomHtml);
        const runtimeTrustVerdicts = [];
        const runtimePanicMonitor = deps.panicMonitor && typeof deps.panicMonitor.recordTrustVerdict === 'function'
            ? deps.panicMonitor
            : createRuntimePanicMonitor({
                diagnosticsHub,
                now,
                repeatedBlockThreshold: deps.panicRepeatedBlockThreshold
            });

        function listTrustVerdicts() {
            return runtimeTrustVerdicts.map((verdict) => cloneSerializable(verdict, {}));
        }

        function getPanicSnapshot() {
            if (runtimePanicMonitor && typeof runtimePanicMonitor.getSnapshot === 'function') {
                return cloneSerializable(runtimePanicMonitor.getSnapshot(), {});
            }
            return {};
        }

        function listPanicEvents() {
            if (runtimePanicMonitor && typeof runtimePanicMonitor.listEvents === 'function') {
                return runtimePanicMonitor.listEvents().map((event) => cloneSerializable(event, {}));
            }
            if (runtimePanicMonitor && typeof runtimePanicMonitor.listPanicEvents === 'function') {
                return runtimePanicMonitor.listPanicEvents().map((event) => cloneSerializable(event, {}));
            }
            return [];
        }

        function recordRuntimePanicTrustVerdict(verdict) {
            if (!runtimePanicMonitor || typeof runtimePanicMonitor.recordTrustVerdict !== 'function') return null;
            try {
                return runtimePanicMonitor.recordTrustVerdict(verdict, {
                    source: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA
                });
            } catch (_error) {
                return null;
            }
        }

        function beginPanicRecovery(input = {}) {
            if (runtimePanicMonitor && typeof runtimePanicMonitor.beginRecovery === 'function') {
                return runtimePanicMonitor.beginRecovery(input);
            }
            return getPanicSnapshot();
        }

        function completePanicRecovery(input = {}) {
            if (runtimePanicMonitor && typeof runtimePanicMonitor.completeRecovery === 'function') {
                return runtimePanicMonitor.completeRecovery(input);
            }
            return getPanicSnapshot();
        }

        function failPanicRecovery(input = {}) {
            if (runtimePanicMonitor && typeof runtimePanicMonitor.failRecovery === 'function') {
                return runtimePanicMonitor.failRecovery(input);
            }
            return getPanicSnapshot();
        }

        const runtimeRecoveryOutcomes = [];
        const runtimeSafeSnapshots = new Map();
        const runtimeQuarantinedScopes = new Set();

        function createRuntimeRecoveryScope(input = {}) {
            const panicSnapshot = getPanicSnapshot();
            return clampString(
                input.scope
                || input.rootId
                || input.snapshotKey
                || input.templateQualifiedId
                || (panicSnapshot && (panicSnapshot.scope || panicSnapshot.sourceRef || panicSnapshot.panicId)),
                'kernel'
            );
        }

        function createRuntimeRecoverySnapshotKey(input = {}) {
            return clampString(
                input.snapshotKey
                || input.rootId
                || input.scope
                || input.templateQualifiedId,
                createRuntimeRecoveryScope(input)
            );
        }

        function publishRuntimeRecoveryOutcome(outcome) {
            if (!diagnosticsHub || typeof diagnosticsHub.publish !== 'function') return;
            try {
                diagnosticsHub.publish(RMT_RUNTIME_RECOVERY_DIAGNOSTIC_CHANNEL, outcome, {
                    source: RMT_KERNEL_RECOVERY_SCHEMA,
                    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
                    status: outcome.status,
                    scope: outcome.scope || undefined,
                    panicId: outcome.panicId || undefined,
                    correlationId: outcome.correlationId || undefined
                });
            } catch (_error) {}
        }

        function notifyRuntimeRecoveryHost(outcome) {
            try {
                if (deps.hostAdapter && typeof deps.hostAdapter.notifyRecoveryOutcome === 'function') {
                    deps.hostAdapter.notifyRecoveryOutcome(outcome);
                    return true;
                }
                if (deps.recoveryHostAdapter && typeof deps.recoveryHostAdapter.notifyRecoveryOutcome === 'function') {
                    deps.recoveryHostAdapter.notifyRecoveryOutcome(outcome);
                    return true;
                }
                if (typeof deps.onRecoveryOutcome === 'function') {
                    deps.onRecoveryOutcome(outcome);
                    return true;
                }
            } catch (_error) {}
            return false;
        }

        function createRuntimeRecoveryOutcome(input = {}) {
            return {
                schema: RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA,
                recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                policySchema: RMT_KERNEL_RECOVERY_POLICY_SCHEMA,
                safeSnapshotSchema: RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
                workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
                outcomeId: RMT_KERNEL_RECOVERY_OUTCOME_SCHEMA + ':' + String(runtimeRecoveryOutcomes.length + 1),
                status: clampString(input.status, 'planned'),
                scope: clampString(input.scope, null),
                rootId: clampString(input.rootId, null),
                panicId: clampString(input.panicId, null),
                correlationId: clampString(input.correlationId, null),
                quarantined: input.quarantined === true,
                restoredSnapshotId: clampString(input.restoredSnapshotId, null),
                fallbackRendered: input.fallbackRendered === true,
                hostNotified: input.hostNotified === true,
                failures: cloneSerializable(input.failures, []),
                panicState: cloneSerializable(input.panicState, null),
                completedAt: now(),
                metadata: cloneSerializable(input.metadata, {})
            };
        }

        function rememberSafeSnapshot(input = {}) {
            const element = input.element || input.rootElement || null;
            const scope = createRuntimeRecoveryScope(input);
            const snapshotKey = createRuntimeRecoverySnapshotKey({
                ...input,
                scope
            });
            const html = element && typeof element.innerHTML === 'string'
                ? element.innerHTML
                : clampString(input.html, '');
            const textContent = element && typeof element.textContent === 'string'
                ? element.textContent
                : clampString(input.textContent, '');
            const snapshot = {
                schema: RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA,
                recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
                snapshotId: RMT_KERNEL_RECOVERY_SAFE_SNAPSHOT_SCHEMA + ':' + snapshotKey,
                snapshotKey,
                rootId: clampString(input.rootId, null),
                scope,
                sourceRef: clampString(input.sourceRef, null),
                templateQualifiedId: clampString(input.templateQualifiedId, null),
                trustBoundary: clampString(input.trustBoundary, RMT_TRUSTED_DOM_BOUNDARY),
                sanitized: input.sanitized === true || input.trusted === true,
                html,
                textContent,
                modelSnapshot: cloneSerializable(input.modelSnapshot, {}),
                capturedAt: now(),
                metadata: cloneSerializable(input.metadata, {})
            };
            runtimeSafeSnapshots.set(snapshot.snapshotKey, snapshot);
            runtimeSafeSnapshots.set(scope, snapshot);
            if (snapshot.rootId) runtimeSafeSnapshots.set(snapshot.rootId, snapshot);
            return cloneSerializable(snapshot, {});
        }

        function getLastSafeSnapshot(input = {}) {
            const key = createRuntimeRecoverySnapshotKey(input);
            const scope = createRuntimeRecoveryScope(input);
            return cloneSerializable(
                runtimeSafeSnapshots.get(key)
                || runtimeSafeSnapshots.get(scope)
                || (input.rootId ? runtimeSafeSnapshots.get(clampString(input.rootId, '')) : null)
                || null,
                null
            );
        }

        function listSafeSnapshots() {
            return Array.from(new Set(Array.from(runtimeSafeSnapshots.values()))).map((snapshot) => cloneSerializable(snapshot, {}));
        }

        function quarantineScope(input = {}) {
            const scope = createRuntimeRecoveryScope(input);
            runtimeQuarantinedScopes.add(scope);
            return scope;
        }

        function listQuarantinedScopes() {
            return Array.from(runtimeQuarantinedScopes);
        }

        function isScopeQuarantined(input = {}) {
            return runtimeQuarantinedScopes.has(createRuntimeRecoveryScope(input));
        }

        function restoreLastSafeSnapshot(input = {}) {
            const element = input.element || input.rootElement || null;
            const snapshot = getLastSafeSnapshot(input);
            if (!element || !snapshot) return false;
            if (snapshot.html && 'innerHTML' in element) {
                return commitTrustedHtml(element, snapshot.html, {
                    scope: 'template',
                    sink: 'fallback.html',
                    sourceRef: 'recovery:restore-last-safe-snapshot:' + createRuntimeRecoveryScope(input),
                    metadata: {
                        recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                        workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
                        snapshotId: snapshot.snapshotId
                    }
                });
            }
            if ('textContent' in element) {
                element.textContent = snapshot.textContent || '';
                return true;
            }
            return false;
        }

        function renderSafeFallback(input = {}) {
            const element = input.element || input.rootElement || null;
            if (!element) return false;
            const fallbackHtml = clampString(input.safeFallbackHtml || input.fallbackHtml || input.html, '');
            const fallbackText = clampString(input.safeFallbackText || input.fallbackText || input.textContent, '');
            if (fallbackHtml) {
                return commitTrustedHtml(element, fallbackHtml, {
                    scope: 'template',
                    sink: 'fallback.html',
                    sourceRef: 'recovery:render-safe-fallback:' + createRuntimeRecoveryScope(input),
                    metadata: {
                        recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                        workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE,
                        fallbackLength: fallbackHtml.length
                    }
                });
            }
            if (fallbackText && 'textContent' in element) {
                element.textContent = fallbackText;
                return true;
            }
            return false;
        }

        function recoverFromPanic(input = {}) {
            const panicSnapshot = getPanicSnapshot();
            const scope = createRuntimeRecoveryScope(input);
            const rootId = clampString(input.rootId, null);
            const element = input.element || input.rootElement || null;
            beginPanicRecovery({
                recoveryAction: 'quarantine-scope',
                panicId: panicSnapshot && panicSnapshot.panicId,
                correlationId: panicSnapshot && panicSnapshot.correlationId,
                metadata: {
                    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                    scope
                }
            });
            quarantineScope({
                scope,
                rootId
            });
            let restoredSnapshotId = null;
            let fallbackRendered = false;
            const failures = [];

            if (input.restoreSnapshot !== false) {
                const snapshot = getLastSafeSnapshot({
                    ...input,
                    scope,
                    rootId
                });
                if (snapshot && restoreLastSafeSnapshot({
                    ...input,
                    scope,
                    rootId,
                    element
                })) {
                    restoredSnapshotId = snapshot.snapshotId;
                }
            }

            if (input.forceFallback === true || !restoredSnapshotId) {
                fallbackRendered = renderSafeFallback({
                    ...input,
                    scope,
                    rootId,
                    element
                });
            }

            if (!restoredSnapshotId && !fallbackRendered) {
                failures.push({
                    action: 'restore-last-safe-snapshot',
                    message: 'no-safe-restore-or-fallback'
                });
            }

            const panicState = failures.length > 0
                ? failPanicRecovery({
                    recoveryAction: 'manual-intervention',
                    panicId: panicSnapshot && panicSnapshot.panicId,
                    correlationId: panicSnapshot && panicSnapshot.correlationId,
                    metadata: {
                        recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                        failures
                    }
                })
                : completePanicRecovery({
                    recoveryAction: restoredSnapshotId ? 'rollback-last-safe-snapshot' : 'render-safe-fallback',
                    panicId: panicSnapshot && panicSnapshot.panicId,
                    correlationId: panicSnapshot && panicSnapshot.correlationId,
                    metadata: {
                        recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                        restoredSnapshotId,
                        fallbackRendered
                    }
                });
            const outcome = createRuntimeRecoveryOutcome({
                status: failures.length > 0 ? 'failed' : 'recovered',
                scope,
                rootId,
                panicId: panicSnapshot && panicSnapshot.panicId,
                correlationId: panicSnapshot && panicSnapshot.correlationId,
                quarantined: true,
                restoredSnapshotId,
                fallbackRendered,
                hostNotified: false,
                failures,
                panicState,
                metadata: {
                    recoverySchema: RMT_KERNEL_RECOVERY_SCHEMA,
                    workpackage: RMT_KERNEL_RECOVERY_WORKPACKAGE
                }
            });
            outcome.hostNotified = notifyRuntimeRecoveryHost(outcome);
            runtimeRecoveryOutcomes.push(outcome);
            publishRuntimeRecoveryOutcome(outcome);
            return cloneSerializable(outcome, {});
        }

        function listRecoveryOutcomes() {
            return runtimeRecoveryOutcomes.map((outcome) => cloneSerializable(outcome, {}));
        }

        function listPanicRecoveryRecords() {
            return [
                ...listTrustVerdicts().map((record) => ({
                    schema: 'xtend.rmt.kernel-panic-recovery-record.v1',
                    kind: 'trustVerdict',
                    lane: 'diagnostics',
                    status: record.commitAllowed === false ? 'blocked' : 'recorded',
                    scope: record.scope || null,
                    correlationId: record.correlationId || null,
                    record
                })),
                ...listPanicEvents().map((record) => ({
                    schema: 'xtend.rmt.kernel-panic-recovery-record.v1',
                    kind: 'panicEvent',
                    lane: 'diagnostics',
                    status: record.state || 'recorded',
                    scope: record.scope || null,
                    correlationId: record.correlationId || null,
                    record
                })),
                ...listSafeSnapshots().map((record) => ({
                    schema: 'xtend.rmt.kernel-panic-recovery-record.v1',
                    kind: 'safeSnapshot',
                    lane: 'diagnostics',
                    status: 'captured',
                    scope: record.scope || null,
                    correlationId: record.correlationId || null,
                    record
                })),
                ...listRecoveryOutcomes().map((record) => ({
                    schema: 'xtend.rmt.kernel-panic-recovery-record.v1',
                    kind: 'recoveryOutcome',
                    lane: 'diagnostics',
                    status: record.status || 'recorded',
                    scope: record.scope || null,
                    correlationId: record.correlationId || null,
                    record
                }))
            ];
        }

        function getPanicRecoverySnapshot() {
            const panicSnapshot = getPanicSnapshot();
            const trustVerdicts = listTrustVerdicts();
            const panicEvents = listPanicEvents();
            const safeSnapshots = listSafeSnapshots();
            const recoveryOutcomes = listRecoveryOutcomes();
            const quarantinedScopes = listQuarantinedScopes();
            return {
                schema: 'xtend.rmt.kernel-panic-recovery-snapshot.v1',
                lane: 'diagnostics',
                trustVerdictCount: trustVerdicts.length,
                blockedTrustVerdictCount: trustVerdicts.filter((record) => record && record.commitAllowed === false).length,
                panicEventCount: panicEvents.length,
                recoveryOutcomeCount: recoveryOutcomes.length,
                safeSnapshotCount: safeSnapshots.length,
                quarantineScopeCount: quarantinedScopes.length,
                panicState: panicSnapshot && panicSnapshot.state || 'none',
                recoveryStatus: recoveryOutcomes.length > 0 ? recoveryOutcomes[recoveryOutcomes.length - 1].status : 'none',
                quarantineScopes: quarantinedScopes,
                lastTrustVerdict: trustVerdicts.length > 0 ? trustVerdicts[trustVerdicts.length - 1] : null,
                lastPanicEvent: panicEvents.length > 0 ? panicEvents[panicEvents.length - 1] : null,
                lastRecoveryOutcome: recoveryOutcomes.length > 0 ? recoveryOutcomes[recoveryOutcomes.length - 1] : null,
                panicSnapshot
            };
        }

        function createRuntimeTrustCorrelationId(context = {}) {
            return [
                RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
                clampString(context.sourceRef, 'runtime-html'),
                clampString(context.scope, 'template'),
                clampString(context.sink, 'innerHTML'),
                String(runtimeTrustVerdicts.length + 1)
            ].join('#');
        }

        function normalizeSanitizerResult(rawHtml, sanitizerResult) {
            if (typeof sanitizerResult === 'string') {
                return {
                    ok: true,
                    html: sanitizerResult,
                    removed: [],
                    removedCount: sanitizerResult === rawHtml ? 0 : 1,
                    boundary: RMT_TRUSTED_DOM_BOUNDARY
                };
            }
            if (sanitizerResult && typeof sanitizerResult === 'object') {
                const hasHtml = Object.prototype.hasOwnProperty.call(sanitizerResult, 'html');
                const safeHtml = hasHtml ? String(sanitizerResult.html || '') : rawHtml;
                return {
                    ok: sanitizerResult.ok !== false,
                    html: safeHtml,
                    removed: cloneSerializable(sanitizerResult.removed, []),
                    removedCount: Number.isFinite(sanitizerResult.removedCount)
                        ? sanitizerResult.removedCount
                        : (safeHtml === rawHtml ? 0 : 1),
                    boundary: clampString(sanitizerResult.boundary, RMT_TRUSTED_DOM_BOUNDARY)
                };
            }
            return sanitizeRuntimeTrustedDomHtml(rawHtml);
        }

        function sanitizeTrustedRuntimeHtml(rawHtml, context = {}) {
            try {
                return normalizeSanitizerResult(rawHtml, sanitizeHtmlOutput(rawHtml, {
                    ...context,
                    boundary: RMT_TRUSTED_DOM_BOUNDARY,
                    markupClass: 'htmlFragment',
                    sinkAdapterSchema: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA
                }));
            } catch (error) {
                const fallback = sanitizeRuntimeTrustedDomHtml(rawHtml);
                fallback.sanitizerError = clampString(error && error.message, 'runtime-html-sanitizer-error');
                return fallback;
            }
        }

        function diagnosticCodeForRuntimeTrust(reasonCode, commitAllowed) {
            if (reasonCode === 'rmt.kernel.trust.attribute_refused') return 'rmt.kernel.trust.attribute_refused';
            if (reasonCode === 'rmt.kernel.trust.url_protocol_refused') return 'rmt.kernel.trust.url_protocol_refused';
            if (reasonCode === 'rmt.kernel.trust.property_refused') return 'rmt.kernel.trust.property_refused';
            if (reasonCode === 'rmt.kernel.trust.html_sanitizer_missing') return 'rmt.kernel.trust.html_sanitizer_missing';
            if (commitAllowed === false) return 'rmt.kernel.trust.sink_refused';
            return null;
        }

        function createRuntimeTrustVerdict(input = {}) {
            const commitAllowed = typeof input.commitAllowed === 'boolean' ? input.commitAllowed : true;
            const verdictKind = clampString(input.verdict, commitAllowed ? 'trusted' : 'blocked');
            const reasonCode = clampString(
                input.reasonCode,
                verdictKind === 'sanitized'
                    ? 'rmt.kernel.trust.html_sanitized'
                    : (commitAllowed ? 'rmt.kernel.trust.explicit_trust' : 'rmt.kernel.trust.sink_refused')
            );
            const verdictInput = {
                scope: clampString(input.scope, 'template'),
                sink: clampString(input.sink, 'innerHTML'),
                sourceRef: clampString(input.sourceRef, 'runtime-output'),
                ownerRef: clampString(input.ownerRef, ''),
                attributeName: clampString(input.attributeName || input.name, ''),
                propertyName: clampString(input.propertyName || input.property, ''),
                value: String(input.value || ''),
                verdict: verdictKind,
                severity: clampString(input.severity, commitAllowed ? 'info' : 'error'),
                reasonCode,
                commitAllowed,
                sanitized: input.sanitized === true || verdictKind === 'sanitized',
                trusted: input.trusted === true || verdictKind === 'trusted',
                propertyTrusted: input.propertyTrusted === true,
                trustBoundary: clampString(input.trustBoundary, verdictKind === 'sanitized' ? RMT_TRUSTED_DOM_BOUNDARY : ''),
                correlationId: clampString(input.correlationId, '') || createRuntimeTrustCorrelationId(input),
                workpackage: clampString(input.workpackage, RMT_KERNEL_TRUST_RUNTIME_WORKPACKAGE),
                metadata: cloneSerializable(input.metadata, {})
            };

            let authorityVerdict = null;
            try {
                if (kernelTrustAuthority && typeof kernelTrustAuthority.evaluateOutput === 'function') {
                    authorityVerdict = kernelTrustAuthority.evaluateOutput(verdictInput);
                } else if (kernelTrustAuthority && typeof kernelTrustAuthority.createVerdict === 'function') {
                    authorityVerdict = kernelTrustAuthority.createVerdict(verdictInput);
                }
            } catch (_error) {
                authorityVerdict = null;
            }

            const baseVerdict = authorityVerdict && authorityVerdict.schema === RMT_KERNEL_TRUST_VERDICT_SCHEMA
                ? cloneSerializable(authorityVerdict, {})
                : {
                    schema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
                    authoritySchema: RMT_KERNEL_TRUST_AUTHORITY_SCHEMA,
                    source: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
                    workpackage: verdictInput.workpackage,
                    verdict: verdictInput.verdict,
                    scope: verdictInput.scope,
                    sink: verdictInput.sink,
                    sourceRef: verdictInput.sourceRef,
                    ownerRef: verdictInput.ownerRef || null,
                    attributeName: verdictInput.attributeName || null,
                    propertyName: verdictInput.propertyName || null,
                    severity: verdictInput.severity,
                    reasonCode: verdictInput.reasonCode,
                    commitAllowed: verdictInput.commitAllowed,
                    sanitized: verdictInput.sanitized,
                    trustBoundary: verdictInput.trustBoundary || null,
                    panicCandidate: input.panicCandidate === true,
                    correlationId: verdictInput.correlationId,
                    diagnosticCode: diagnosticCodeForRuntimeTrust(verdictInput.reasonCode, verdictInput.commitAllowed),
                    metadata: cloneSerializable(verdictInput.metadata, {})
                };
            baseVerdict.workpackage = verdictInput.workpackage;
            baseVerdict.source = clampString(baseVerdict.source, RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA);
            baseVerdict.metadata = {
                ...cloneSerializable(baseVerdict.metadata, {}),
                sinkAdapterSchema: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
                workpackage: baseVerdict.workpackage
            };
            return Object.freeze(baseVerdict);
        }

        function recordRuntimeTrustVerdict(verdict) {
            const snapshot = cloneSerializable(verdict, {});
            runtimeTrustVerdicts.push(snapshot);
            if (diagnosticsHub && typeof diagnosticsHub.publish === 'function') {
                try {
                    diagnosticsHub.publish(RMT_RUNTIME_TRUST_DIAGNOSTIC_CHANNEL, {
                        schema: 'xtend.rmt.kernel-trust-runtime-diagnostic.v1',
                        trustDiagnosticSchema: RMT_KERNEL_TRUST_DIAGNOSTIC_SCHEMA,
                        verdictSchema: RMT_KERNEL_TRUST_VERDICT_SCHEMA,
                        sinkAdapterSchema: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
                        workpackage: snapshot.workpackage || RMT_KERNEL_TRUST_RUNTIME_WORKPACKAGE,
                        severity: snapshot.severity,
                        code: snapshot.diagnosticCode || snapshot.reasonCode,
                        scope: snapshot.scope,
                        sink: snapshot.sink,
                        sourceRef: snapshot.sourceRef,
                        correlationId: snapshot.correlationId,
                        verdict: snapshot.verdict,
                        commitAllowed: snapshot.commitAllowed,
                        sanitized: snapshot.sanitized,
                        panicCandidate: snapshot.panicCandidate === true,
                        metadata: cloneSerializable(snapshot.metadata, {})
                    }, {
                        source: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
                        workpackage: snapshot.workpackage || RMT_KERNEL_TRUST_RUNTIME_WORKPACKAGE
                    });
                } catch (_error) {}
            }
            recordRuntimePanicTrustVerdict(snapshot);
            return snapshot;
        }

        function createTrustedHtmlCommit(html, context = {}) {
            const rawHtml = String(html || '');
            const sanitizerResult = sanitizeTrustedRuntimeHtml(rawHtml, context);
            const trustedHtml = sanitizerResult.ok === false ? '' : String(sanitizerResult.html || '');
            const verdict = recordRuntimeTrustVerdict(createRuntimeTrustVerdict({
                ...context,
                value: trustedHtml,
                commitAllowed: sanitizerResult.ok !== false,
                verdict: sanitizerResult.ok !== false ? 'sanitized' : 'blocked',
                severity: sanitizerResult.ok !== false ? 'info' : 'error',
                reasonCode: sanitizerResult.ok !== false
                    ? 'rmt.kernel.trust.html_sanitized'
                    : 'rmt.kernel.trust.html_sanitizer_missing',
                sanitized: sanitizerResult.ok !== false,
                trustBoundary: clampString(sanitizerResult.boundary, RMT_TRUSTED_DOM_BOUNDARY),
                workpackage: RMT_KERNEL_TRUST_RUNTIME_WORKPACKAGE,
                metadata: {
                    sinkAdapterSchema: RMT_RUNTIME_TRUST_SINK_ADAPTER_SCHEMA,
                    sanitizerSchema: RMT_TRUSTED_DOM_SANITIZER_SCHEMA,
                    trustBoundary: clampString(sanitizerResult.boundary, RMT_TRUSTED_DOM_BOUNDARY),
                    rawLength: rawHtml.length,
                    trustedLength: trustedHtml.length,
                    changed: trustedHtml !== rawHtml,
                    removedCount: Number.isFinite(sanitizerResult.removedCount) ? sanitizerResult.removedCount : 0,
                    removed: cloneSerializable(sanitizerResult.removed, []),
                    sanitizerError: clampString(sanitizerResult.sanitizerError, '')
                }
            }));
            return {
                html: verdict.commitAllowed === false ? '' : trustedHtml,
                verdict
            };
        }

        /* <kernel-lab:rmt-trusted-dom-sink> */
        function createFragmentFromTrustedHtml(html) {
            if (!documentTarget || typeof documentTarget.createElement !== 'function') return null;
            const templateElement = documentTarget.createElement('template');
            if (!templateElement) return null;
            templateElement.innerHTML = String(html || '');
            if (templateElement.content && typeof templateElement.content.cloneNode === 'function') {
                return templateElement.content.cloneNode(true);
            }
            return null;
        }
        /* </kernel-lab:rmt-trusted-dom-sink> */

        function createFragmentFromHtml(html, context = {}) {
            const trusted = createTrustedHtmlCommit(html, {
                ...context,
                sink: clampString(context.sink, 'template.innerHTML')
            });
            return createFragmentFromTrustedHtml(trusted.html);
        }

        function clearElementHtml(element) {
            if (!element) return false;
            if (typeof element.replaceChildren === 'function') {
                element.replaceChildren();
                return true;
            }
            if ('textContent' in element) {
                element.textContent = '';
                return true;
            }
            return false;
        }

        function commitTrustedHtml(element, html, context = {}) {
            if (!element) return false;
            const trusted = createTrustedHtmlCommit(html, context);
            if (trusted.html === '') {
                return clearElementHtml(element) && trusted.verdict.commitAllowed !== false;
            }
            const fragment = createFragmentFromTrustedHtml(trusted.html);
            if (fragment && typeof element.replaceChildren === 'function') {
                element.replaceChildren(fragment);
                return trusted.verdict.commitAllowed !== false;
            }
            if (fragment && typeof element.appendChild === 'function' && clearElementHtml(element)) {
                element.appendChild(fragment);
                return trusted.verdict.commitAllowed !== false;
            }
            if ('textContent' in element) {
                element.textContent = trusted.html;
                return trusted.verdict.commitAllowed !== false;
            }
            return false;
        }

        function normalizeRuntimeBindingName(value) {
            return clampString(value, '').toLowerCase();
        }

        function isRuntimeEventBindingName(value) {
            return normalizeRuntimeBindingName(value).startsWith('on');
        }

        function isRuntimeUrlAttribute(attributeName) {
            return RMT_RUNTIME_URL_ATTRIBUTES.includes(normalizeRuntimeBindingName(attributeName));
        }

        function isRuntimeUrlProperty(propertyName) {
            return RMT_RUNTIME_URL_PROPERTIES.includes(normalizeRuntimeBindingName(propertyName));
        }

        function isRuntimeAllowedAttribute(attributeName) {
            const normalized = normalizeRuntimeBindingName(attributeName);
            if (!normalized) return false;
            if (normalized.startsWith('data-') || normalized.startsWith('aria-')) return true;
            return RMT_RUNTIME_SAFE_ATTRIBUTES.includes(normalized) || isRuntimeUrlAttribute(normalized);
        }

        function removeRuntimeAttribute(element, attributeName) {
            if (!element || !attributeName) return false;
            if (typeof element.removeAttribute === 'function') {
                element.removeAttribute(attributeName);
                return true;
            }
            if (element.attributes && typeof element.attributes === 'object') {
                delete element.attributes[attributeName];
                return true;
            }
            return false;
        }

        function setRuntimeAttribute(element, attributeName, serializedValue) {
            if (typeof element.setAttribute === 'function') {
                element.setAttribute(attributeName, serializedValue);
                return true;
            }
            if (!element.attributes || typeof element.attributes !== 'object') {
                element.attributes = {};
            }
            element.attributes[attributeName] = serializedValue;
            return true;
        }

        function createBindingTrustSourceRef(binding, sinkName) {
            return 'binding:'
                + clampString(binding && binding.kind, 'binding')
                + ':'
                + clampString(binding && binding.target, ':root')
                + ':'
                + sinkName;
        }

        function createRuntimeBindingVerdict(input = {}) {
            return recordRuntimeTrustVerdict(createRuntimeTrustVerdict({
                ...input,
                scope: 'binding',
                workpackage: RMT_KERNEL_BINDING_SECURITY_WORKPACKAGE
            }));
        }

        function commitTrustedAttribute(element, attributeName, value, binding = {}) {
            const safeAttributeName = clampString(attributeName, '');
            if (!element || !safeAttributeName) return false;
            const serializedValue = value === true ? '' : String(value);
            const normalizedAttribute = normalizeRuntimeBindingName(safeAttributeName);
            const isUrlAttribute = isRuntimeUrlAttribute(normalizedAttribute);
            let commitAllowed = true;
            let verdict = 'trusted';
            let reasonCode = 'rmt.kernel.trust.attribute_allowed';
            let severity = 'info';

            if (isRuntimeEventBindingName(normalizedAttribute) || normalizedAttribute === 'srcdoc' || normalizedAttribute === 'style') {
                commitAllowed = false;
                verdict = 'blocked';
                reasonCode = 'rmt.kernel.trust.attribute_refused';
                severity = 'error';
            } else if (isUrlAttribute && !isAllowedRuntimeTrustedDomUrl(serializedValue)) {
                commitAllowed = false;
                verdict = 'blocked';
                reasonCode = 'rmt.kernel.trust.url_protocol_refused';
                severity = 'error';
            } else if (!isRuntimeAllowedAttribute(normalizedAttribute)) {
                commitAllowed = false;
                verdict = 'blocked';
                reasonCode = 'rmt.kernel.trust.attribute_refused';
                severity = 'warning';
            }

            const trustVerdict = createRuntimeBindingVerdict({
                sink: isUrlAttribute ? 'url-attribute' : 'attribute',
                attributeName: safeAttributeName,
                value: serializedValue,
                verdict,
                severity,
                reasonCode,
                commitAllowed,
                trusted: commitAllowed,
                sourceRef: createBindingTrustSourceRef(binding, safeAttributeName),
                metadata: {
                    bindingKind: clampString(binding && binding.kind, ''),
                    bindingTarget: clampString(binding && binding.target, ''),
                    sourcePath: clampString(binding && binding.source, ''),
                    attributeName: safeAttributeName,
                    valueLength: serializedValue.length,
                    policy: 'attribute-url-allowlist'
                }
            });

            if (trustVerdict.commitAllowed !== true) {
                removeRuntimeAttribute(element, safeAttributeName);
                return false;
            }
            return setRuntimeAttribute(element, safeAttributeName, serializedValue);
        }

        function commitTrustedProperty(element, propertyName, value, binding = {}) {
            const safePropertyName = clampString(propertyName, '');
            if (!safePropertyName || !element || typeof element !== 'object') return false;
            const normalizedProperty = normalizeRuntimeBindingName(safePropertyName);
            const serializedValue = value === null || value === undefined ? '' : String(value);
            const isUrlProperty = isRuntimeUrlProperty(normalizedProperty);
            let commitAllowed = true;
            let verdict = 'trusted';
            let reasonCode = 'rmt.kernel.trust.property_allowed';
            let severity = 'info';

            if (RMT_RUNTIME_FORBIDDEN_PROPERTY_WRITES.includes(normalizedProperty) || isRuntimeEventBindingName(normalizedProperty)) {
                commitAllowed = false;
                verdict = 'blocked';
                reasonCode = 'rmt.kernel.trust.property_refused';
                severity = 'error';
            } else if (isUrlProperty && !isAllowedRuntimeTrustedDomUrl(serializedValue)) {
                commitAllowed = false;
                verdict = 'blocked';
                reasonCode = 'rmt.kernel.trust.url_protocol_refused';
                severity = 'error';
            } else if (!RMT_RUNTIME_SAFE_PROPERTY_WRITES.includes(normalizedProperty) && !isUrlProperty) {
                commitAllowed = false;
                verdict = 'blocked';
                reasonCode = 'rmt.kernel.trust.property_refused';
                severity = 'warning';
            }

            const trustVerdict = createRuntimeBindingVerdict({
                sink: 'property',
                propertyName: safePropertyName,
                value: serializedValue,
                verdict,
                severity,
                reasonCode,
                commitAllowed,
                trusted: commitAllowed,
                propertyTrusted: commitAllowed,
                sourceRef: createBindingTrustSourceRef(binding, safePropertyName),
                metadata: {
                    bindingKind: clampString(binding && binding.kind, ''),
                    bindingTarget: clampString(binding && binding.target, ''),
                    sourcePath: clampString(binding && binding.source, ''),
                    propertyName: safePropertyName,
                    valueLength: serializedValue.length,
                    policy: 'property-allowlist'
                }
            });

            if (trustVerdict.commitAllowed !== true) {
                return false;
            }
            element[safePropertyName] = value;
            return true;
        }

        function resolveElementRef(target, options = {}) {
            if (isElementLike(target)) return target;
            const rawTarget = target && typeof target === 'object'
                ? target
                : {};

            if (isElementLike(rawTarget.element)) return rawTarget.element;
            if (isElementLike(rawTarget.resolvedElement)) return rawTarget.resolvedElement;
            if (isElementLike(options.rootElement)) return options.rootElement;

            const elementId = clampString(
                options.elementId || rawTarget.elementId || rawTarget.id,
                ''
            );
            if (elementId && documentTarget && typeof documentTarget.getElementById === 'function') {
                const resolvedById = documentTarget.getElementById(elementId);
                if (resolvedById) return resolvedById;
            }

            const selector = clampString(options.selector || rawTarget.selector || target, '');
            if (selector && documentTarget && typeof documentTarget.querySelector === 'function') {
                const resolvedBySelector = documentTarget.querySelector(selector);
                if (resolvedBySelector) return resolvedBySelector;
            }

            return null;
        }

        function normalizeBinding(bindingInput = {}) {
            const rawBinding = toPlainObject(bindingInput);
            const kind = normalizeBindingKind(rawBinding.kind || rawBinding.type, '');
            if (!kind) return null;
            return Object.freeze({
                kind,
                target: clampString(
                    rawBinding.target || rawBinding.selector || rawBinding.elementSelector,
                    ':root'
                ),
                source: clampString(
                    rawBinding.source || rawBinding.path || rawBinding.modelPath || rawBinding.valuePath,
                    ''
                ),
                sourceName: clampString(
                    rawBinding.sourceName || rawBinding.reactivitySource || rawBinding.channel,
                    ''
                ),
                attribute: clampString(rawBinding.attribute || rawBinding.attributeName || rawBinding.name, ''),
                property: clampString(rawBinding.property || rawBinding.propertyName || rawBinding.name, ''),
                className: clampString(rawBinding.className || rawBinding.class || rawBinding.token || rawBinding.name, ''),
                bindingId: clampString(rawBinding.bindingId || rawBinding.id, ''),
                eventType: clampString(rawBinding.eventType || rawBinding.event, ''),
                commandName: clampString(rawBinding.commandName || rawBinding.command, ''),
                eventName: clampString(rawBinding.eventName || rawBinding.emit || rawBinding.rootEventName, ''),
                action: clampString(
                    rawBinding.action || rawBinding.rmAction || rawBinding.dataRmAction || rawBinding.dataAction,
                    ''
                ),
                actionAttribute: clampString(
                    rawBinding.actionAttribute || rawBinding.dataActionAttribute,
                    'data-rm-action'
                ),
                setActionAttribute: rawBinding.setActionAttribute === true
                    || (
                        rawBinding.setActionAttribute !== false
                        && !!clampString(
                            rawBinding.action || rawBinding.rmAction || rawBinding.dataRmAction || rawBinding.dataAction,
                            ''
                        )
                    ),
                payloadSource: clampString(rawBinding.payloadSource || rawBinding.detailSource, ''),
                payload: Object.prototype.hasOwnProperty.call(rawBinding, 'payload')
                    ? cloneSerializable(rawBinding.payload, null)
                    : null,
                detail: Object.prototype.hasOwnProperty.call(rawBinding, 'detail')
                    ? cloneSerializable(rawBinding.detail, null)
                    : null,
                hasExplicitFallback: rawBinding.hasExplicitFallback === true
                    || (
                        rawBinding.hasExplicitFallback === undefined
                        && Object.prototype.hasOwnProperty.call(rawBinding, 'fallback')
                    ),
                fallback: Object.prototype.hasOwnProperty.call(rawBinding, 'fallback')
                    ? rawBinding.fallback
                    : null,
                invert: rawBinding.invert === true,
                preventDefault: rawBinding.preventDefault === true,
                stopPropagation: rawBinding.stopPropagation === true,
                capture: rawBinding.capture === true,
                passive: rawBinding.passive === true,
                once: rawBinding.once === true,
                includeInteractionMeta: rawBinding.includeInteractionMeta === true,
                supersessionKey: clampString(rawBinding.supersessionKey, ''),
                payloadContract: cloneSerializable(rawBinding.payloadContract || rawBinding.contract, null),
                payloadAdapter: cloneSerializable(
                    rawBinding.payloadAdapter || rawBinding.adapter || rawBinding.payloadKind,
                    null
                ),
                closest: clampString(rawBinding.closest || rawBinding.closestSelector || rawBinding.delegate, ''),
                condition: cloneSerializable(rawBinding.condition || rawBinding.when, null),
                guard: cloneSerializable(rawBinding.guard || rawBinding.confirm, null),
                postAction: cloneSerializable(
                    rawBinding.postAction || rawBinding.after || rawBinding.afterAction,
                    []
                ),
                commandTarget: cloneSerializable(rawBinding.commandTarget, null),
                lane: clampString(rawBinding.lane, ''),
                templateRef: cloneSerializable(
                    rawBinding.template !== undefined
                        ? rawBinding.template
                        : (rawBinding.templateRef !== undefined
                            ? rawBinding.templateRef
                            : (rawBinding.templateId !== undefined
                                ? {
                                    id: rawBinding.templateId,
                                    namespace: rawBinding.namespace || ''
                                }
                                : null)),
                    null
                ),
                templateSource: clampString(
                    rawBinding.templateSource || rawBinding.templatePath || rawBinding.templateRefSource,
                    ''
                ),
                modelSource: clampString(
                    rawBinding.modelSource || rawBinding.outletModelSource || rawBinding.subtreeModelSource,
                    ''
                ),
                itemsSource: clampString(
                    rawBinding.itemsSource || rawBinding.collectionSource || rawBinding.listSource,
                    ''
                ),
                itemAlias: clampString(rawBinding.itemAlias || rawBinding.alias || rawBinding.as, 'item'),
                indexAlias: clampString(rawBinding.indexAlias || rawBinding.positionAlias, 'index'),
                wrapperTag: clampString(rawBinding.wrapperTag || rawBinding.itemContainerTag, 'div'),
                clearWhenMissing: rawBinding.clearWhenMissing !== false,
                removeWhenEmpty: rawBinding.removeWhenEmpty === true,
                emptyMarkup: String(
                    rawBinding.emptyMarkup !== undefined
                        ? rawBinding.emptyMarkup
                        : (rawBinding.emptyHtml !== undefined ? rawBinding.emptyHtml : '')
                ),
                metadata: cloneSerializable(rawBinding.metadata, {}),
                raw: cloneSerializable(rawBinding, {})
            });
        }

        function normalizeBindings(bindingsInput) {
            return (Array.isArray(bindingsInput) ? bindingsInput : [])
                .map((bindingInput) => normalizeBinding(bindingInput))
                .filter(Boolean);
        }

        function normalizeSlot(slotInput = {}) {
            const rawSlot = toPlainObject(slotInput);
            const inferredKind = rawSlot.template !== undefined
                || rawSlot.templateRef !== undefined
                || rawSlot.templateId !== undefined
                ? 'template'
                : (rawSlot.html !== undefined || rawSlot.markup !== undefined ? 'html_fragment' : 'text');
            const name = clampString(rawSlot.name || rawSlot.slot, '');
            return Object.freeze({
                name,
                kind: normalizeSlotKind(rawSlot.kind || rawSlot.type, inferredKind),
                target: clampString(rawSlot.target || rawSlot.selector || (name ? `[data-slot="${name}"]` : ':root'), ':root'),
                source: clampString(rawSlot.source || rawSlot.path || rawSlot.valuePath, ''),
                sourceName: clampString(rawSlot.sourceName || rawSlot.reactivitySource || rawSlot.channel, ''),
                modelSource: clampString(rawSlot.modelSource || rawSlot.slotModelSource, ''),
                hasExplicitFallback: rawSlot.hasExplicitFallback === true
                    || (
                        rawSlot.hasExplicitFallback === undefined
                        && Object.prototype.hasOwnProperty.call(rawSlot, 'fallback')
                    ),
                fallback: Object.prototype.hasOwnProperty.call(rawSlot, 'fallback')
                    ? rawSlot.fallback
                    : null,
                templateRef: cloneSerializable(
                    rawSlot.template !== undefined
                        ? rawSlot.template
                        : (rawSlot.templateRef !== undefined
                            ? rawSlot.templateRef
                            : (rawSlot.templateId !== undefined
                                ? {
                                    id: rawSlot.templateId,
                                    namespace: rawSlot.namespace || ''
                                }
                                : null)),
                    null
                ),
                staticMarkup: String(
                    rawSlot.markup !== undefined
                        ? rawSlot.markup
                        : (rawSlot.html !== undefined ? rawSlot.html : '')
                ),
                clearWhenMissing: rawSlot.clearWhenMissing !== false,
                emptyMarkup: String(
                    rawSlot.emptyMarkup !== undefined
                        ? rawSlot.emptyMarkup
                        : (rawSlot.emptyHtml !== undefined ? rawSlot.emptyHtml : '')
                ),
                metadata: cloneSerializable(rawSlot.metadata, {}),
                raw: cloneSerializable(rawSlot, {})
            });
        }

        function normalizeSlots(slotsInput) {
            return (Array.isArray(slotsInput) ? slotsInput : [])
                .map((slotInput) => normalizeSlot(slotInput))
                .filter(Boolean);
        }

        function createBindingStructureDescriptor(bindingInput = {}) {
            const binding = normalizeBinding(bindingInput);
            if (!binding) return null;
            return {
                kind: binding.kind,
                target: binding.target,
                source: binding.source,
                sourceName: binding.sourceName,
                attribute: binding.attribute,
                property: binding.property,
                className: binding.className,
                bindingId: binding.bindingId,
                eventType: binding.eventType,
                commandName: binding.commandName,
                eventName: binding.eventName,
                action: binding.action,
                actionAttribute: binding.actionAttribute,
                setActionAttribute: binding.setActionAttribute === true,
                payloadSource: binding.payloadSource,
                payload: cloneSerializable(binding.payload, null),
                detail: cloneSerializable(binding.detail, null),
                hasExplicitFallback: binding.hasExplicitFallback === true,
                fallback: cloneSerializable(binding.fallback, null),
                invert: binding.invert === true,
                preventDefault: binding.preventDefault === true,
                stopPropagation: binding.stopPropagation === true,
                capture: binding.capture === true,
                passive: binding.passive === true,
                once: binding.once === true,
                includeInteractionMeta: binding.includeInteractionMeta === true,
                supersessionKey: binding.supersessionKey,
                payloadContract: cloneSerializable(binding.payloadContract, null),
                payloadAdapter: cloneSerializable(binding.payloadAdapter, null),
                closest: binding.closest,
                condition: cloneSerializable(binding.condition, null),
                guard: cloneSerializable(binding.guard, null),
                postAction: cloneSerializable(binding.postAction, []),
                commandTarget: cloneSerializable(binding.commandTarget, null),
                lane: binding.lane,
                templateRef: cloneSerializable(binding.templateRef, null),
                templateSource: binding.templateSource,
                modelSource: binding.modelSource,
                itemsSource: binding.itemsSource,
                itemAlias: binding.itemAlias,
                indexAlias: binding.indexAlias,
                wrapperTag: binding.wrapperTag,
                clearWhenMissing: binding.clearWhenMissing !== false,
                emptyMarkup: binding.emptyMarkup
            };
        }

        function createSlotStructureDescriptor(slotInput = {}) {
            const slot = normalizeSlot(slotInput);
            if (!slot) return null;
            return {
                name: slot.name,
                kind: slot.kind,
                target: slot.target,
                source: slot.source,
                sourceName: slot.sourceName,
                modelSource: slot.modelSource,
                hasExplicitFallback: slot.hasExplicitFallback === true,
                fallback: cloneSerializable(slot.fallback, null),
                templateRef: cloneSerializable(slot.templateRef, null),
                staticMarkup: slot.staticMarkup,
                clearWhenMissing: slot.clearWhenMissing !== false,
                emptyMarkup: slot.emptyMarkup
            };
        }

        function createTemplateStructureSignature(bindingsInput = [], slotsInput = [], templateMode = 'html_fragment') {
            return JSON.stringify({
                mode: clampString(templateMode, 'html_fragment'),
                bindings: (Array.isArray(bindingsInput) ? bindingsInput : [])
                    .map((bindingInput) => createBindingStructureDescriptor(bindingInput))
                    .filter(Boolean),
                slots: (Array.isArray(slotsInput) ? slotsInput : [])
                    .map((slotInput) => createSlotStructureDescriptor(slotInput))
                    .filter(Boolean)
            });
        }

        function resolveBindingElement(rootElement, binding) {
            if (!rootElement || !binding) return null;
            const safeTarget = clampString(binding.target, ':root');
            if (
                safeTarget === ':root'
                || safeTarget === 'root'
                || safeTarget === 'self'
                || safeTarget === '.'
            ) {
                return rootElement;
            }
            if (typeof rootElement.querySelector === 'function') {
                const nestedElement = rootElement.querySelector(safeTarget);
                if (nestedElement) return nestedElement;
            }
            if (documentTarget && typeof documentTarget.querySelector === 'function') {
                return documentTarget.querySelector(safeTarget) || null;
            }
            return null;
        }

        function resolveSlotElement(rootElement, slot) {
            if (!rootElement || !slot) return null;
            const safeTarget = clampString(slot.target, ':root');
            if (
                safeTarget === ':root'
                || safeTarget === 'root'
                || safeTarget === 'self'
                || safeTarget === '.'
            ) {
                return rootElement;
            }
            if (typeof rootElement.querySelector === 'function') {
                const nestedElement = rootElement.querySelector(safeTarget);
                if (nestedElement) return nestedElement;
            }
            if (documentTarget && typeof documentTarget.querySelector === 'function') {
                return documentTarget.querySelector(safeTarget) || null;
            }
            return null;
        }

        function resolveDefaultSourceName(binding, reactivityHints = {}) {
            const explicitSourceName = clampString(binding && binding.sourceName, '');
            if (explicitSourceName) return explicitSourceName;

            const hintsObject = toPlainObject(reactivityHints);
            const candidateSources = normalizeSourceNames(
                hintsObject.sources,
                normalizeSourceNames(hintsObject.sourceNames, normalizeSourceNames(hintsObject.defaultSource, []))
            );
            if (candidateSources.length === 0) return '';

            const safeSourcePath = binding && (binding.kind === 'template_outlet' || binding.kind === 'template_repeat')
                ? clampString(
                    binding.kind === 'template_repeat'
                        ? (binding.itemsSource || binding.modelSource || binding.templateSource || binding.source)
                        : (binding.modelSource || binding.templateSource || binding.source),
                    ''
                )
                : clampString(binding && binding.source, '');
            if (safeSourcePath.indexOf('.') !== -1) {
                const sourceAlias = safeSourcePath.split('.')[0];
                const aliasCandidates = candidateSources.filter((sourceName) => (
                    sourceName === sourceAlias || sourceName.endsWith(`.${sourceAlias}`)
                ));
                if (aliasCandidates.length === 1) {
                    return aliasCandidates[0];
                }
            }

            return candidateSources.length === 1 ? candidateSources[0] : '';
        }

        function resolveDefaultSlotSourceName(slot, reactivityHints = {}) {
            const explicitSourceName = clampString(slot && slot.sourceName, '');
            if (explicitSourceName) return explicitSourceName;

            const hintsObject = toPlainObject(reactivityHints);
            const candidateSources = normalizeSourceNames(
                hintsObject.sources,
                normalizeSourceNames(hintsObject.sourceNames, normalizeSourceNames(hintsObject.defaultSource, []))
            );
            if (candidateSources.length === 0) return '';

            const safeSourcePath = clampString(slot && (slot.modelSource || slot.source), '');
            if (safeSourcePath.indexOf('.') !== -1) {
                const sourceAlias = safeSourcePath.split('.')[0];
                const aliasCandidates = candidateSources.filter((sourceName) => (
                    sourceName === sourceAlias || sourceName.endsWith(`.${sourceAlias}`)
                ));
                if (aliasCandidates.length === 1) {
                    return aliasCandidates[0];
                }
            }

            return candidateSources.length === 1 ? candidateSources[0] : '';
        }

        function resolveBindingValue(binding, modelSnapshot, options = {}) {
            const safeBinding = binding && typeof binding === 'object'
                ? binding
                : null;
            if (!safeBinding) return null;

            const safeSourcePath = clampString(safeBinding.source, '');
            const sourceName = clampString(options.sourceName, '');
            const bindingAlias = sourceName ? sourceName.split('.').pop() : '';
            const sourceSnapshot = Object.prototype.hasOwnProperty.call(options, 'sourceSnapshot')
                ? options.sourceSnapshot
                : MISSING_VALUE;

            let resolvedValue = MISSING_VALUE;
            if (sourceSnapshot !== MISSING_VALUE) {
                resolvedValue = tryResolvePathVariants(sourceSnapshot, safeSourcePath, {
                    bindingAlias,
                    allowLeadingScopeStrip: true
                });
            }

            if (resolvedValue === MISSING_VALUE) {
                resolvedValue = tryResolvePathVariants(modelSnapshot, safeSourcePath, {
                    bindingAlias,
                    allowLeadingScopeStrip: true
                });
            }

            if (resolvedValue === MISSING_VALUE && Object.prototype.hasOwnProperty.call(safeBinding.raw || {}, 'value')) {
                resolvedValue = safeBinding.raw.value;
            }

            if (resolvedValue === MISSING_VALUE) {
                return safeBinding.fallback;
            }
            return resolvedValue;
        }

        function resolveSlotValue(slot, modelSnapshot, options = {}) {
            const safeSlot = slot && typeof slot === 'object'
                ? slot
                : null;
            if (!safeSlot) return null;

            function resolveFromPath(path) {
                return resolvePathValueFromSnapshots(path, modelSnapshot, options);
            }

            if (safeSlot.kind === 'template') {
                const resolvedTemplateRef = cloneSerializable(safeSlot.templateRef, null);
                const modelPath = clampString(safeSlot.modelSource || safeSlot.source, '');
                let nestedModel = modelPath
                    ? resolveFromPath(modelPath)
                    : cloneSerializable(modelSnapshot, {});
                let shouldClear = false;
                if (nestedModel === MISSING_VALUE || nestedModel === null || nestedModel === undefined) {
                    if (safeSlot.hasExplicitFallback === true) {
                        nestedModel = safeSlot.fallback;
                    } else if (modelPath && safeSlot.clearWhenMissing !== false) {
                        shouldClear = true;
                        nestedModel = {};
                    } else {
                        nestedModel = {};
                    }
                }
                if (!resolvedTemplateRef && safeSlot.clearWhenMissing !== false) {
                    shouldClear = true;
                }
                if (!nestedModel || typeof nestedModel !== 'object' || Array.isArray(nestedModel)) {
                    nestedModel = nestedModel === null || nestedModel === undefined
                        ? {}
                        : {
                            value: nestedModel
                        };
                }
                return {
                    templateRef: resolvedTemplateRef,
                    modelSnapshot: cloneSerializable(nestedModel, {}),
                    clear: !!shouldClear,
                    emptyMarkup: safeSlot.emptyMarkup || '',
                    metadata: cloneSerializable(safeSlot.metadata, {})
                };
            }

            const resolvedValue = resolveFromPath(safeSlot.source);
            if (resolvedValue !== MISSING_VALUE) {
                return resolvedValue;
            }
            if (safeSlot.kind === 'html_fragment' && safeSlot.staticMarkup) {
                return safeSlot.staticMarkup;
            }
            return safeSlot.fallback;
        }

        function resolvePathValueFromSnapshots(path, modelSnapshot, options = {}) {
            const safePath = clampString(path, '');
            if (!safePath) return MISSING_VALUE;
            const sourceName = clampString(options.sourceName, '');
            const sourceSnapshot = Object.prototype.hasOwnProperty.call(options, 'sourceSnapshot')
                ? options.sourceSnapshot
                : MISSING_VALUE;
            const bindingAlias = sourceName ? sourceName.split('.').pop() : '';

            let resolvedValue = MISSING_VALUE;
            if (sourceSnapshot !== MISSING_VALUE) {
                resolvedValue = tryResolvePathVariants(sourceSnapshot, safePath, {
                    bindingAlias,
                    allowLeadingScopeStrip: true
                });
            }
            if (resolvedValue === MISSING_VALUE) {
                resolvedValue = tryResolvePathVariants(modelSnapshot, safePath, {
                    bindingAlias,
                    allowLeadingScopeStrip: true
                });
            }
            return resolvedValue;
        }

        function resolveTemplateOutletValue(binding, modelSnapshot, options = {}) {
            const safeBinding = binding && typeof binding === 'object'
                ? binding
                : null;
            if (!safeBinding) return null;

            let resolvedTemplateRef = safeBinding.templateRef;
            const dynamicTemplateRef = resolvePathValueFromSnapshots(
                safeBinding.templateSource,
                modelSnapshot,
                options
            );
            if (dynamicTemplateRef !== MISSING_VALUE && dynamicTemplateRef !== null && dynamicTemplateRef !== undefined && dynamicTemplateRef !== '') {
                resolvedTemplateRef = dynamicTemplateRef;
            }

            const modelPath = clampString(safeBinding.modelSource || safeBinding.source, '');
            let nestedModel = modelPath
                ? resolvePathValueFromSnapshots(modelPath, modelSnapshot, options)
                : cloneSerializable(modelSnapshot, {});
            let shouldClear = false;

            if (nestedModel === MISSING_VALUE || nestedModel === null || nestedModel === undefined) {
                if (safeBinding.hasExplicitFallback === true) {
                    nestedModel = safeBinding.fallback;
                } else if (modelPath && safeBinding.clearWhenMissing !== false) {
                    shouldClear = true;
                    nestedModel = {};
                } else {
                    nestedModel = {};
                }
            }

            if (!resolvedTemplateRef && safeBinding.clearWhenMissing !== false) {
                shouldClear = true;
            }

            if (!nestedModel || typeof nestedModel !== 'object' || Array.isArray(nestedModel)) {
                nestedModel = nestedModel === null || nestedModel === undefined
                    ? {}
                    : {
                        value: nestedModel
                    };
            }

            return {
                templateRef: cloneSerializable(resolvedTemplateRef, null),
                modelSnapshot: cloneSerializable(nestedModel, {}),
                clear: !!shouldClear,
                emptyMarkup: safeBinding.emptyMarkup || '',
                metadata: cloneSerializable(safeBinding.metadata, {})
            };
        }

        function normalizeRepeatedItemModel(binding, itemValue, index) {
            const safeBinding = binding && typeof binding === 'object'
                ? binding
                : {};
            const safeItemAlias = clampString(safeBinding.itemAlias, 'item');
            const safeIndexAlias = clampString(safeBinding.indexAlias, 'index');
            const baseModel = itemValue && typeof itemValue === 'object' && !Array.isArray(itemValue)
                ? cloneSerializable(itemValue, {})
                : {};

            if (!Object.prototype.hasOwnProperty.call(baseModel, safeItemAlias)) {
                baseModel[safeItemAlias] = cloneSerializable(itemValue, itemValue);
            }
            if (!Object.prototype.hasOwnProperty.call(baseModel, safeIndexAlias)) {
                baseModel[safeIndexAlias] = index;
            }
            if (!Object.prototype.hasOwnProperty.call(baseModel, 'item')) {
                baseModel.item = cloneSerializable(itemValue, itemValue);
            }
            if (!Object.prototype.hasOwnProperty.call(baseModel, 'index')) {
                baseModel.index = index;
            }
            if (
                (itemValue === null || itemValue === undefined || typeof itemValue !== 'object' || Array.isArray(itemValue))
                && !Object.prototype.hasOwnProperty.call(baseModel, 'value')
            ) {
                baseModel.value = itemValue;
            }

            return baseModel;
        }

        function resolveTemplateRepeatValue(binding, modelSnapshot, options = {}) {
            const safeBinding = binding && typeof binding === 'object'
                ? binding
                : null;
            if (!safeBinding) return null;

            let resolvedTemplateRef = safeBinding.templateRef;
            const dynamicTemplateRef = resolvePathValueFromSnapshots(
                safeBinding.templateSource,
                modelSnapshot,
                options
            );
            if (dynamicTemplateRef !== MISSING_VALUE && dynamicTemplateRef !== null && dynamicTemplateRef !== undefined && dynamicTemplateRef !== '') {
                resolvedTemplateRef = dynamicTemplateRef;
            }

            const itemsPath = clampString(safeBinding.itemsSource || safeBinding.modelSource || safeBinding.source, '');
            let resolvedItems = itemsPath
                ? resolvePathValueFromSnapshots(itemsPath, modelSnapshot, options)
                : MISSING_VALUE;
            let shouldClear = false;

            if (resolvedItems === MISSING_VALUE || resolvedItems === null || resolvedItems === undefined) {
                if (safeBinding.hasExplicitFallback === true) {
                    resolvedItems = safeBinding.fallback;
                } else if (itemsPath && safeBinding.clearWhenMissing !== false) {
                    shouldClear = true;
                    resolvedItems = [];
                } else {
                    resolvedItems = [];
                }
            }

            if (!resolvedTemplateRef && safeBinding.clearWhenMissing !== false) {
                shouldClear = true;
            }

            const itemList = Array.isArray(resolvedItems)
                ? resolvedItems.slice()
                : (resolvedItems && typeof resolvedItems[Symbol.iterator] === 'function'
                    ? Array.from(resolvedItems)
                    : (resolvedItems === null || resolvedItems === undefined ? [] : [resolvedItems]));

            const items = itemList.map((itemValue, index) => ({
                index,
                key: itemValue && typeof itemValue === 'object'
                    ? clampString(itemValue.id || itemValue.key || itemValue.uuid, String(index))
                    : String(index),
                modelSnapshot: normalizeRepeatedItemModel(safeBinding, itemValue, index)
            }));

            if (items.length === 0 && safeBinding.clearWhenMissing !== false) {
                shouldClear = true;
            }

            return {
                templateRef: cloneSerializable(resolvedTemplateRef, null),
                items,
                clear: !!shouldClear,
                emptyMarkup: safeBinding.emptyMarkup || '',
                wrapperTag: clampString(safeBinding.wrapperTag, 'div'),
                metadata: cloneSerializable(safeBinding.metadata, {})
            };
        }

        function applyBindingValue(element, binding, value) {
            if (!element || !binding) return false;

            if (binding.kind === 'text') {
                if ('textContent' in element) {
                    element.textContent = value === null || value === undefined ? '' : String(value);
                    return true;
                }
                if (typeof element.replaceChildren === 'function') {
                    element.replaceChildren(value === null || value === undefined ? '' : String(value));
                    return true;
                }
                return false;
            }

            if (binding.kind === 'attribute') {
                const attributeName = clampString(binding.attribute, '');
                if (!attributeName) return false;
                const shouldRemoveAttribute = (
                    value === false
                    || value === null
                    || value === undefined
                    || (
                        binding.removeWhenEmpty === true
                        && typeof value === 'string'
                        && value.trim() === ''
                    )
                );
                if (shouldRemoveAttribute) {
                    return removeRuntimeAttribute(element, attributeName);
                }
                return commitTrustedAttribute(element, attributeName, value, binding);
            }

            if (binding.kind === 'property') {
                const propertyName = clampString(binding.property, '');
                return commitTrustedProperty(element, propertyName, value, binding);
            }

            if (binding.kind === 'class_toggle') {
                const className = clampString(binding.className, '');
                if (!className) return false;
                const enabled = binding.invert ? !toBoolean(value) : toBoolean(value);
                if (element.classList && typeof element.classList.toggle === 'function') {
                    element.classList.toggle(className, enabled);
                    return true;
                }
                return updateClassNameFallback(element, className, enabled);
            }

            return false;
        }

        function reflectActionBindingAttributes(element, binding) {
            const safeAction = clampString(binding && binding.action, '');
            if (!element || !safeAction || binding.setActionAttribute === false) return false;
            const attributeName = clampString(binding.actionAttribute, 'data-rm-action');
            if (!attributeName) return false;
            return commitTrustedAttribute(element, attributeName, safeAction, {
                ...binding,
                kind: 'attribute',
                attribute: attributeName,
                source: binding && binding.source ? binding.source : 'action'
            });
        }

        function applySlotValue(element, slot, value) {
            if (!element || !slot) return false;

            if (slot.kind === 'text') {
                if ('textContent' in element) {
                    element.textContent = value === null || value === undefined ? '' : String(value);
                    return true;
                }
                if (typeof element.replaceChildren === 'function') {
                    element.replaceChildren(value === null || value === undefined ? '' : String(value));
                    return true;
                }
                return false;
            }

            if (slot.kind === 'html_fragment') {
                const html = value === null || value === undefined ? '' : String(value);
                return commitTrustedHtml(element, html, {
                    scope: 'slot',
                    sink: 'slot.html',
                    sourceRef: `slot:${slot.name || slot.target || 'html_fragment'}`,
                    metadata: {
                        slotKind: slot.kind,
                        slotName: slot.name || '',
                        slotTarget: slot.target || '',
                        sourcePath: slot.source || slot.modelSource || ''
                    }
                });
            }

            return false;
        }

        function createInteractionMeta(event, target) {
            return {
                eventType: event && event.type ? String(event.type || '').trim() : '',
                key: event && event.key ? String(event.key || '').trim() : '',
                targetId: target && target.id ? String(target.id || '').trim() : '',
                targetName: target && target.name ? String(target.name || '').trim() : '',
                targetValue: target && Object.prototype.hasOwnProperty.call(target, 'value')
                    ? target.value
                    : null,
                checked: !!(target && typeof target.checked === 'boolean' ? target.checked : false),
                dataset: cloneDataset(target && target.dataset ? target.dataset : null)
            };
        }

        function resolveInteractionValue(binding, modelSnapshot, options = {}) {
            const dynamicSourcePath = clampString(
                binding && (binding.payloadSource || binding.source),
                ''
            );
            if (!dynamicSourcePath) return MISSING_VALUE;
            return resolveBindingValue({
                ...binding,
                source: dynamicSourcePath,
                fallback: MISSING_VALUE,
                raw: {}
            }, modelSnapshot, options);
        }

        function createInteractionPayload(binding, modelSnapshot, options = {}) {
            const interactionMeta = createInteractionMeta(options.event, options.target);
            const sourceName = clampString(options.sourceName, '');
            const sourceSnapshot = Object.prototype.hasOwnProperty.call(options, 'sourceSnapshot')
                ? options.sourceSnapshot
                : MISSING_VALUE;
            const dynamicValue = resolveInteractionValue(binding, modelSnapshot, {
                sourceName,
                sourceSnapshot
            });
            const basePayload = binding.kind === 'command'
                ? normalizeInteractionRecord(binding.payload, {})
                : normalizeInteractionRecord(binding.detail, {});
            const dynamicPayload = dynamicValue === MISSING_VALUE
                ? {}
                : normalizeInteractionRecord(dynamicValue, {});
            const nextPayload = {
                ...basePayload,
                ...dynamicPayload
            };
            if (binding.includeInteractionMeta) {
                nextPayload.interaction = interactionMeta;
            }
            return nextPayload;
        }

        function clearNestedTemplateRecord(record, emptyMarkup = '') {
            if (!record || !record.element) return false;
            const safeEmptyMarkup = String(emptyMarkup || '');
            if (
                record.renderState === 'empty'
                && record.lastEmptyMarkup === safeEmptyMarkup
                && !record.nestedSession
                && (!Array.isArray(record.itemRecords) || record.itemRecords.length === 0)
            ) {
                return true;
            }
            if (record.nestedSession && typeof record.nestedSession.destroy === 'function') {
                try {
                    record.nestedSession.destroy();
                } catch (_error) {}
                record.nestedSession = null;
            }
            record.nestedChunk = null;
            if (Array.isArray(record.itemRecords)) {
                record.itemRecords.forEach((itemRecord) => destroyRepeatItemRecord(itemRecord));
                record.itemRecords = [];
            }

            if (safeEmptyMarkup) {
                if (!commitTrustedHtml(record.element, safeEmptyMarkup, {
                    scope: 'template',
                    sink: 'fallback.html',
                    sourceRef: `template:${record.lastTemplateQualifiedId || 'nested'}:empty`,
                    metadata: {
                        renderState: record.renderState || '',
                        templateQualifiedId: record.lastTemplateQualifiedId || ''
                    }
                })) {
                    return false;
                }
            } else if (!clearElementHtml(record.element)) {
                return false;
            }
            record.renderState = 'empty';
            record.lastEmptyMarkup = safeEmptyMarkup;
            record.lastTemplateQualifiedId = '';
            return true;
        }

        function createHostElement(tagName, contextElement) {
            const safeTagName = clampString(tagName, 'div');
            const ownerDocument = contextElement && contextElement.ownerDocument
                ? contextElement.ownerDocument
                : null;
            if (ownerDocument && typeof ownerDocument.createElement === 'function') {
                return ownerDocument.createElement(safeTagName);
            }
            if (documentTarget && typeof documentTarget.createElement === 'function') {
                return documentTarget.createElement(safeTagName);
            }
            return null;
        }

        function listElementChildren(element) {
            if (!element || !element.childNodes) return [];
            return Array.from(element.childNodes);
        }

        function assignDetachedParent(node, parentElement) {
            if (!node || typeof node !== 'object') return;
            try {
                if ('parentElement' in node) {
                    node.parentElement = parentElement || null;
                }
            } catch (_error) {}
        }

        function removeChildFromElement(element, node) {
            if (!element || !node) return false;
            if (typeof element.removeChild === 'function') {
                try {
                    element.removeChild(node);
                    return true;
                } catch (_error) {}
            }
            if (Array.isArray(element.childNodes)) {
                const index = element.childNodes.indexOf(node);
                if (index >= 0) {
                    element.childNodes.splice(index, 1);
                    assignDetachedParent(node, null);
                    return true;
                }
            }
            return false;
        }

        function detachFromCurrentParent(node) {
            if (!node || typeof node !== 'object') return;
            const parent = node.parentNode || node.parentElement || null;
            if (parent && parent !== node && typeof parent.removeChild === 'function') {
                try {
                    parent.removeChild(node);
                    return;
                } catch (_error) {}
            }
            if (parent && Array.isArray(parent.childNodes)) {
                const index = parent.childNodes.indexOf(node);
                if (index >= 0) parent.childNodes.splice(index, 1);
            }
            assignDetachedParent(node, null);
        }

        function insertChildBefore(element, node, referenceNode = null) {
            if (!element || !node) return false;
            if (typeof element.insertBefore === 'function') {
                try {
                    element.insertBefore(node, referenceNode || null);
                    return true;
                } catch (_error) {}
            }
            if (!Array.isArray(element.childNodes)) {
                if (!referenceNode && typeof element.appendChild === 'function') {
                    element.appendChild(node);
                    return true;
                }
                return false;
            }

            detachFromCurrentParent(node);
            const referenceIndex = referenceNode ? element.childNodes.indexOf(referenceNode) : -1;
            if (referenceIndex >= 0) {
                element.childNodes.splice(referenceIndex, 0, node);
            } else {
                element.childNodes.push(node);
            }
            assignDetachedParent(node, element);
            return true;
        }

        function reconcileElementChildren(element, nextNodes = []) {
            if (!element) return false;
            const desiredNodes = (Array.isArray(nextNodes) ? nextNodes : [])
                .filter((node) => node !== undefined && node !== null);
            if (desiredNodes.some((node) => node && node.nodeType === 11)) {
                return false;
            }
            const currentNodes = listElementChildren(element);
            if (
                currentNodes.length === desiredNodes.length
                && currentNodes.every((node, index) => node === desiredNodes[index])
            ) {
                return true;
            }

            const desiredSet = new Set(desiredNodes);
            let reconciled = true;
            currentNodes.forEach((node) => {
                if (!desiredSet.has(node)) {
                    reconciled = removeChildFromElement(element, node) && reconciled;
                }
            });

            desiredNodes.forEach((node, index) => {
                const latestNodes = listElementChildren(element);
                if (latestNodes[index] === node) return;
                const referenceNode = latestNodes[index] || null;
                reconciled = insertChildBefore(element, node, referenceNode) && reconciled;
            });

            const finalNodes = listElementChildren(element);
            return reconciled
                && finalNodes.length === desiredNodes.length
                && finalNodes.every((node, index) => node === desiredNodes[index]);
        }

        function replaceElementChildren(element, nodes = []) {
            if (!element) return false;
            if (reconcileElementChildren(element, nodes)) return true;
            if (typeof element.replaceChildren === 'function') {
                element.replaceChildren(...nodes);
                return true;
            }
            if (Array.isArray(nodes)) {
                element.childNodes = nodes.slice();
                nodes.forEach((node) => assignDetachedParent(node, element));
                return true;
            }
            return false;
        }

        function serializeRepeatChunk(chunk, wrapperTag, index, key) {
            const safeWrapperTag = clampString(wrapperTag, 'div');
            const safeIndex = Number.isFinite(index) ? index : 0;
            const safeKey = clampString(key, String(safeIndex));
            const innerMarkup = chunk && chunk.template && chunk.template.mode === 'text'
                ? String(chunk.markup && chunk.markup.html ? chunk.markup.html : '')
                : String(chunk && chunk.markup && chunk.markup.html ? chunk.markup.html : '');
            return `<${safeWrapperTag} data-rmt-repeat-item="${safeIndex}" data-rmt-repeat-key="${safeKey}">${innerMarkup}</${safeWrapperTag}>`;
        }

        function getChunkMarkupSignature(chunk) {
            if (!chunk || !chunk.template) return '';
            const mode = clampString(chunk.template.mode, 'html_fragment');
            if (mode === 'text') {
                return `text:${String(chunk.markup && chunk.markup.textContent ? chunk.markup.textContent : '')}`;
            }
            if (mode === 'dom_descriptor') {
                return `descriptor:${JSON.stringify(cloneSerializable(chunk.markup && chunk.markup.descriptor, {}))}`;
            }
            return `html:${String(chunk.markup && chunk.markup.html ? chunk.markup.html : '')}`;
        }

        function shouldRewriteHostForChunk(currentChunk, nextChunk) {
            if (!nextChunk || !nextChunk.template) return true;
            if (!currentChunk || !currentChunk.template) return true;
            if (clampString(currentChunk.template.mode, '') !== clampString(nextChunk.template.mode, '')) {
                return true;
            }
            return getChunkMarkupSignature(currentChunk) !== getChunkMarkupSignature(nextChunk);
        }

        function writeChunkToElement(element, chunk) {
            if (!element || !chunk || !chunk.template) return false;
            if (chunk.template.mode === 'text') {
                element.textContent = String(chunk.markup && chunk.markup.textContent ? chunk.markup.textContent : '');
                return true;
            }
            if (chunk.template.mode === 'dom_descriptor') {
                const descriptorText = JSON.stringify(cloneSerializable(chunk.markup && chunk.markup.descriptor, {}));
                if ('textContent' in element) {
                    element.textContent = descriptorText;
                    return true;
                }
                return false;
            }
            return commitTrustedHtml(element, String(chunk.markup && chunk.markup.html ? chunk.markup.html : ''), {
                scope: 'template',
                sink: 'prerender.html',
                sourceRef: `template:${chunk.template.qualifiedId || chunk.template.id || 'chunk'}:markup`,
                metadata: {
                    templateQualifiedId: chunk.template.qualifiedId || '',
                    templateMode: chunk.template.mode || ''
                }
            });
        }

        function setRepeatItemElementMetadata(element, itemState) {
            if (!element || !itemState) return false;
            const safeIndex = Number.isFinite(itemState.index) ? itemState.index : 0;
            const safeKey = clampString(itemState.key, String(safeIndex));
            if (typeof element.setAttribute === 'function') {
                element.setAttribute('data-rmt-repeat-item', String(safeIndex));
                element.setAttribute('data-rmt-repeat-key', safeKey);
                return true;
            }
            if (!element.attributes || typeof element.attributes !== 'object') {
                element.attributes = {};
            }
            element.attributes['data-rmt-repeat-item'] = String(safeIndex);
            element.attributes['data-rmt-repeat-key'] = safeKey;
            return true;
        }

        function destroyRepeatItemRecord(itemRecord) {
            if (!itemRecord) return false;
            if (itemRecord.nestedSession && typeof itemRecord.nestedSession.destroy === 'function') {
                try {
                    itemRecord.nestedSession.destroy();
                } catch (_error) {}
            }
            if (itemRecord.element && typeof itemRecord.element === 'object') {
                itemRecord.element.parentElement = null;
            }
            return true;
        }

        function indexRepeatItemRecords(records) {
            const recordBuckets = new Map();
            (Array.isArray(records) ? records : []).forEach((record) => {
                if (!record) return;
                const safeKey = clampString(record.key, '');
                const bucketKey = safeKey || String(record.index || 0);
                if (!recordBuckets.has(bucketKey)) {
                    recordBuckets.set(bucketKey, []);
                }
                recordBuckets.get(bucketKey).push(record);
            });
            return recordBuckets;
        }

        function claimRepeatItemRecord(recordBuckets, key, index) {
            const bucketKey = clampString(key, '') || String(index || 0);
            if (!recordBuckets || !recordBuckets.has(bucketKey)) return null;
            const bucket = recordBuckets.get(bucketKey);
            if (!Array.isArray(bucket) || bucket.length === 0) return null;
            const record = bucket.shift() || null;
            if (bucket.length === 0) {
                recordBuckets.delete(bucketKey);
            }
            return record;
        }

        function resolveTemplateQualifiedId(templateRef) {
            if (!templateRef || !templateApi || typeof templateApi.resolveTemplate !== 'function') {
                return '';
            }
            try {
                const templateRecord = templateApi.resolveTemplate(templateRef);
                return templateRecord && templateRecord.qualifiedId
                    ? String(templateRecord.qualifiedId)
                    : '';
            } catch (_error) {
                return '';
            }
        }

        function createRepeatedTemplateItemRecord(bindingRecord, bindingState, itemState, options = {}) {
            const nestedChunk = templateApi.prerenderTemplate({
                executionMode: 'prerender_only',
                template: bindingState.templateRef,
                rootId: bindingRecord.rootId
                    ? `${bindingRecord.rootId}::repeat:${bindingRecord.binding.target || bindingRecord.binding.kind}:${itemState.index}`
                    : '',
                model: itemState.modelSnapshot || {}
            });
            const wrapperElement = createHostElement(bindingState.wrapperTag, bindingRecord.element);
            if (!wrapperElement) {
                return {
                    itemRecord: null,
                    fallbackMarkup: serializeRepeatChunk(
                        nestedChunk,
                        bindingState.wrapperTag,
                        itemState.index,
                        itemState.key
                    )
                };
            }

            setRepeatItemElementMetadata(wrapperElement, itemState);
            writeChunkToElement(wrapperElement, nestedChunk);

            const nestedSession = createBindingSession({
                rootId: bindingRecord.rootId,
                element: wrapperElement,
                chunk: nestedChunk,
                modelSnapshot: nestedChunk.modelSnapshot,
                templateQualifiedId: nestedChunk.template.qualifiedId,
                reactivityHints: nestedChunk.hydration.reactivityHints
            }, {
                ...options,
                depth: (Number.isFinite(options.depth) ? options.depth : 0) + 1
            });

            return {
                itemRecord: {
                    key: itemState.key,
                    index: itemState.index,
                    element: wrapperElement,
                    nestedChunk,
                    nestedSession,
                    templateQualifiedId: clampString(nestedChunk && nestedChunk.template && nestedChunk.template.qualifiedId, '')
                },
                fallbackMarkup: ''
            };
        }

        function remountRepeatedTemplateItemRecord(existingRecord, bindingRecord, bindingState, itemState, options = {}) {
            if (!existingRecord || !existingRecord.element) return null;
            const nestedChunk = templateApi.prerenderTemplate({
                executionMode: 'prerender_only',
                template: bindingState.templateRef,
                rootId: bindingRecord.rootId
                    ? `${bindingRecord.rootId}::repeat:${bindingRecord.binding.target || bindingRecord.binding.kind}:${itemState.index}`
                    : '',
                model: itemState.modelSnapshot || {}
            });
            const shouldRewriteHost = shouldRewriteHostForChunk(existingRecord.nestedChunk, nestedChunk);
            if (
                !shouldRewriteHost
                && existingRecord.nestedSession
                && typeof existingRecord.nestedSession.rebindChunk === 'function'
                && existingRecord.nestedSession.rebindChunk(nestedChunk)
            ) {
                setRepeatItemElementMetadata(existingRecord.element, itemState);
                existingRecord.nestedChunk = nestedChunk;
                existingRecord.templateQualifiedId = clampString(nestedChunk && nestedChunk.template && nestedChunk.template.qualifiedId, '');
                existingRecord.key = itemState.key;
                existingRecord.index = itemState.index;
                return existingRecord;
            }

            if (shouldRewriteHost) {
                writeChunkToElement(existingRecord.element, nestedChunk);
            }

            if (existingRecord.nestedSession && typeof existingRecord.nestedSession.destroy === 'function') {
                try {
                    existingRecord.nestedSession.destroy();
                } catch (_error) {}
            }

            setRepeatItemElementMetadata(existingRecord.element, itemState);
            existingRecord.nestedChunk = nestedChunk;
            existingRecord.templateQualifiedId = clampString(nestedChunk && nestedChunk.template && nestedChunk.template.qualifiedId, '');
            existingRecord.key = itemState.key;
            existingRecord.index = itemState.index;
            existingRecord.nestedSession = createBindingSession({
                rootId: bindingRecord.rootId,
                element: existingRecord.element,
                chunk: nestedChunk,
                modelSnapshot: nestedChunk.modelSnapshot,
                templateQualifiedId: nestedChunk.template.qualifiedId,
                reactivityHints: nestedChunk.hydration.reactivityHints
            }, {
                ...options,
                depth: (Number.isFinite(options.depth) ? options.depth : 0) + 1
            });
            return existingRecord;
        }

        function reuseRepeatedTemplateItemRecord(existingRecord, bindingRecord, itemState) {
            if (!existingRecord || !existingRecord.element) return null;
            setRepeatItemElementMetadata(existingRecord.element, itemState);
            existingRecord.key = itemState.key;
            existingRecord.index = itemState.index;
            if (existingRecord.nestedSession && typeof existingRecord.nestedSession.updateModel === 'function') {
                try {
                    existingRecord.nestedSession.updateModel(itemState.modelSnapshot || {});
                } catch (_error) {
                    return null;
                }
            }
            if (existingRecord.nestedChunk && typeof existingRecord.nestedChunk === 'object') {
                existingRecord.nestedChunk = {
                    ...existingRecord.nestedChunk,
                    modelSnapshot: cloneSerializable(itemState.modelSnapshot, {})
                };
            }
            return existingRecord;
        }

        function patchNestedTemplateRecord(record, nextModelSnapshot, templateQualifiedId) {
            if (
                !record
                || !record.nestedSession
                || typeof record.nestedSession.updateModel !== 'function'
            ) {
                return false;
            }
            const currentTemplateQualifiedId = clampString(
                record.nestedChunk && record.nestedChunk.template && record.nestedChunk.template.qualifiedId,
                ''
            );
            const safeTemplateQualifiedId = clampString(templateQualifiedId, '');
            if (!safeTemplateQualifiedId || safeTemplateQualifiedId !== currentTemplateQualifiedId) {
                return false;
            }
            try {
                record.nestedSession.updateModel(nextModelSnapshot || {});
                if (record.nestedChunk && typeof record.nestedChunk === 'object') {
                    record.nestedChunk = {
                        ...record.nestedChunk,
                        modelSnapshot: cloneSerializable(nextModelSnapshot, {})
                    };
                }
                record.renderState = 'nested';
                record.lastEmptyMarkup = '';
                record.lastTemplateQualifiedId = safeTemplateQualifiedId;
                return true;
            } catch (_error) {
                return false;
            }
        }

        function renderNestedTemplateSlot(slotRecord, slotState, options = {}) {
            if (!slotRecord || !slotRecord.element || !slotState) return false;
            if (slotState.clear || !slotState.templateRef) {
                return clearNestedTemplateRecord(slotRecord, slotState && slotState.emptyMarkup);
            }
            if (!templateApi || typeof templateApi.prerenderTemplate !== 'function') return false;
            const currentDepth = Number.isFinite(options.depth) ? options.depth : 0;
            if (currentDepth >= maxSlotDepth) return false;
            const templateQualifiedId = resolveTemplateQualifiedId(slotState.templateRef);

            if (patchNestedTemplateRecord(slotRecord, slotState.modelSnapshot || {}, templateQualifiedId)) {
                return true;
            }

            try {
                const nestedChunk = templateApi.prerenderTemplate({
                    executionMode: 'prerender_only',
                    template: slotState.templateRef,
                    rootId: slotRecord.rootId ? `${slotRecord.rootId}::slot:${slotRecord.slot.name || slotRecord.slot.target}` : '',
                    model: slotState.modelSnapshot || {}
                });
                const shouldRewriteHost = shouldRewriteHostForChunk(slotRecord.nestedChunk, nestedChunk);
                if (
                    !shouldRewriteHost
                    && slotRecord.nestedSession
                    && typeof slotRecord.nestedSession.rebindChunk === 'function'
                    && slotRecord.nestedSession.rebindChunk(nestedChunk)
                ) {
                    slotRecord.nestedChunk = nestedChunk;
                    slotRecord.renderState = 'nested';
                    slotRecord.lastEmptyMarkup = '';
                    slotRecord.lastTemplateQualifiedId = clampString(nestedChunk.template && nestedChunk.template.qualifiedId, '');
                    return true;
                }
                if (shouldRewriteHost) {
                    writeChunkToElement(slotRecord.element, nestedChunk);
                }

                if (slotRecord.nestedSession && typeof slotRecord.nestedSession.destroy === 'function') {
                    slotRecord.nestedSession.destroy();
                }
                slotRecord.nestedChunk = nestedChunk;
                slotRecord.nestedSession = createBindingSession({
                    rootId: slotRecord.rootId,
                    element: slotRecord.element,
                    chunk: nestedChunk,
                    modelSnapshot: nestedChunk.modelSnapshot,
                    templateQualifiedId: nestedChunk.template.qualifiedId,
                    reactivityHints: nestedChunk.hydration.reactivityHints
                }, {
                    ...options,
                    depth: currentDepth + 1
                });
                slotRecord.renderState = 'nested';
                slotRecord.lastEmptyMarkup = '';
                slotRecord.lastTemplateQualifiedId = clampString(nestedChunk.template && nestedChunk.template.qualifiedId, '');
                return true;
            } catch (_error) {
                return false;
            }
        }

        function renderNestedTemplateBinding(bindingRecord, bindingState, options = {}) {
            if (!bindingRecord || !bindingRecord.element || !bindingRecord.binding) return false;
            if (!bindingState || bindingState.clear || !bindingState.templateRef) {
                return clearNestedTemplateRecord(bindingRecord, bindingState && bindingState.emptyMarkup);
            }
            if (!templateApi || typeof templateApi.prerenderTemplate !== 'function') return false;
            const currentDepth = Number.isFinite(options.depth) ? options.depth : 0;
            if (currentDepth >= maxSlotDepth) return false;
            const templateQualifiedId = resolveTemplateQualifiedId(bindingState.templateRef);

            if (patchNestedTemplateRecord(bindingRecord, bindingState.modelSnapshot || {}, templateQualifiedId)) {
                return true;
            }

            try {
                const nestedChunk = templateApi.prerenderTemplate({
                    executionMode: 'prerender_only',
                    template: bindingState.templateRef,
                    rootId: bindingRecord.rootId
                        ? `${bindingRecord.rootId}::binding:${bindingRecord.binding.target || bindingRecord.binding.kind}`
                        : '',
                    model: bindingState.modelSnapshot || {}
                });
                const shouldRewriteHost = shouldRewriteHostForChunk(bindingRecord.nestedChunk, nestedChunk);
                if (
                    !shouldRewriteHost
                    && bindingRecord.nestedSession
                    && typeof bindingRecord.nestedSession.rebindChunk === 'function'
                    && bindingRecord.nestedSession.rebindChunk(nestedChunk)
                ) {
                    bindingRecord.nestedChunk = nestedChunk;
                    bindingRecord.renderState = 'nested';
                    bindingRecord.lastEmptyMarkup = '';
                    bindingRecord.lastTemplateQualifiedId = clampString(nestedChunk.template && nestedChunk.template.qualifiedId, '');
                    return true;
                }
                if (shouldRewriteHost) {
                    writeChunkToElement(bindingRecord.element, nestedChunk);
                }

                if (bindingRecord.nestedSession && typeof bindingRecord.nestedSession.destroy === 'function') {
                    bindingRecord.nestedSession.destroy();
                }
                bindingRecord.nestedChunk = nestedChunk;
                bindingRecord.nestedSession = createBindingSession({
                    rootId: bindingRecord.rootId,
                    element: bindingRecord.element,
                    chunk: nestedChunk,
                    modelSnapshot: nestedChunk.modelSnapshot,
                    templateQualifiedId: nestedChunk.template.qualifiedId,
                    reactivityHints: nestedChunk.hydration.reactivityHints
                }, {
                    ...options,
                    depth: currentDepth + 1
                });
                bindingRecord.renderState = 'nested';
                bindingRecord.lastEmptyMarkup = '';
                bindingRecord.lastTemplateQualifiedId = clampString(nestedChunk.template && nestedChunk.template.qualifiedId, '');
                return true;
            } catch (_error) {
                return false;
            }
        }

        function renderRepeatedTemplateBinding(bindingRecord, bindingState, options = {}) {
            if (!bindingRecord || !bindingRecord.element || !bindingRecord.binding) return false;
            if (
                !bindingState
                || bindingState.clear
                || !bindingState.templateRef
                || !Array.isArray(bindingState.items)
            ) {
                return clearNestedTemplateRecord(bindingRecord, bindingState && bindingState.emptyMarkup);
            }
            if (bindingState.items.length === 0) {
                return bindingState.clear === true
                    ? clearNestedTemplateRecord(bindingRecord, bindingState && bindingState.emptyMarkup)
                    : true;
            }
            if (!templateApi || typeof templateApi.prerenderTemplate !== 'function') return false;
            const currentDepth = Number.isFinite(options.depth) ? options.depth : 0;
            if (currentDepth >= maxSlotDepth) return false;

            const nextItemRecords = [];
            const fallbackMarkup = [];
            const claimedRecords = [];
            const reusableRecordBuckets = indexRepeatItemRecords(bindingRecord.itemRecords);
            const resolvedTemplateQualifiedId = resolveTemplateQualifiedId(bindingState.templateRef);

            try {
                bindingState.items.forEach((itemState) => {
                    const claimedRecord = claimRepeatItemRecord(
                        reusableRecordBuckets,
                        itemState.key,
                        itemState.index
                    );
                    if (
                        claimedRecord
                        && claimedRecord.element
                        && clampString(claimedRecord.templateQualifiedId || (claimedRecord.nestedChunk && claimedRecord.nestedChunk.template && claimedRecord.nestedChunk.template.qualifiedId), '') === resolvedTemplateQualifiedId
                    ) {
                        const reusedRecord = reuseRepeatedTemplateItemRecord(
                            claimedRecord,
                            bindingRecord,
                            itemState
                        );
                        if (reusedRecord) {
                            claimedRecords.push(reusedRecord);
                            nextItemRecords.push(reusedRecord);
                            return;
                        }
                    }

                    if (claimedRecord && claimedRecord.element) {
                        const remountedRecord = remountRepeatedTemplateItemRecord(
                            claimedRecord,
                            bindingRecord,
                            bindingState,
                            itemState,
                            options
                        );
                        if (remountedRecord) {
                            claimedRecords.push(remountedRecord);
                            nextItemRecords.push(remountedRecord);
                            return;
                        }
                        destroyRepeatItemRecord(claimedRecord);
                    }

                    const created = createRepeatedTemplateItemRecord(
                        bindingRecord,
                        bindingState,
                        itemState,
                        options
                    );
                    if (created.fallbackMarkup) {
                        fallbackMarkup.push(created.fallbackMarkup);
                        return;
                    }
                    if (created.itemRecord) {
                        nextItemRecords.push(created.itemRecord);
                    }
                });

                reusableRecordBuckets.forEach((bucket) => {
                    (Array.isArray(bucket) ? bucket : []).forEach((record) => destroyRepeatItemRecord(record));
                });

                if (fallbackMarkup.length > 0) {
                    nextItemRecords.forEach((itemRecord) => {
                        if (!claimedRecords.includes(itemRecord)) {
                            destroyRepeatItemRecord(itemRecord);
                        }
                    });
                    claimedRecords.forEach((itemRecord) => destroyRepeatItemRecord(itemRecord));
                    bindingRecord.itemRecords = [];
                    return commitTrustedHtml(bindingRecord.element, fallbackMarkup.join(''), {
                        scope: 'binding',
                        sink: 'fallback.html',
                        sourceRef: `binding:${bindingRecord.binding.target || bindingRecord.binding.kind}:repeat-fallback`,
                        metadata: {
                            bindingKind: bindingRecord.binding.kind,
                            bindingTarget: bindingRecord.binding.target || '',
                            templateQualifiedId: resolvedTemplateQualifiedId || ''
                        }
                    });
                }

                if (nextItemRecords.length > 0) {
                    const nextElements = nextItemRecords
                        .map((itemRecord) => itemRecord.element)
                        .filter(Boolean);
                    if (nextElements.length > 0 && replaceElementChildren(bindingRecord.element, nextElements)) {
                        bindingRecord.itemRecords = nextItemRecords;
                        bindingRecord.renderState = 'repeat';
                        bindingRecord.lastEmptyMarkup = '';
                        bindingRecord.lastTemplateQualifiedId = resolvedTemplateQualifiedId;
                        return true;
                    }
                }

                return false;
            } catch (_error) {
                clearNestedTemplateRecord(bindingRecord, bindingState && bindingState.emptyMarkup);
                return false;
            }
        }

        function createSlotRecord(rootId, rootElement, templateQualifiedId, slot, reactivityHints, currentModelSnapshotRef, options = {}) {
            const element = resolveSlotElement(rootElement, slot);
            const sourceName = resolveDefaultSlotSourceName(slot, reactivityHints);

            if (sourceName && reactivity && typeof reactivity.ensureSource === 'function') {
                reactivity.ensureSource(sourceName, null, {
                    meta: {
                        source: 'rmt_template_runtime_renderer',
                        templateQualifiedId
                    }
                });
            }

            const slotRecord = {
                rootId,
                slot,
                element,
                sourceName,
                renderState: 'initial',
                lastEmptyMarkup: '',
                lastTemplateQualifiedId: '',
                nestedSession: null,
                nestedChunk: null
            };

            function applyState(nextState) {
                if (!slotRecord.element) return false;
                if (slot.kind === 'template') {
                    return renderNestedTemplateSlot(slotRecord, nextState, options);
                }
                return applySlotValue(slotRecord.element, slot, nextState);
            }

            const sourceSnapshot = sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                ? reactivity.getSourceSnapshot(sourceName, null)
                : MISSING_VALUE;
            applyState(resolveSlotValue(slot, currentModelSnapshotRef(), {
                sourceName,
                sourceSnapshot
            }));

            let unsubscribe = null;
            if (sourceName && slotRecord.element && reactivity) {
                unsubscribe = rootId && typeof reactivity.watchRoot === 'function'
                    ? reactivity.watchRoot(
                        rootId,
                        sourceName,
                        (snapshot) => resolveSlotValue(slot, currentModelSnapshotRef(), {
                            sourceName,
                            sourceSnapshot: snapshot
                        }),
                        (selectedValue) => {
                            applyState(selectedValue);
                        },
                        {
                            replayLatest: false,
                            selectorName: `template_slot:${slot.kind}:${slot.target}`
                        }
                    )
                    : (typeof reactivity.watch === 'function'
                        ? reactivity.watch(
                            sourceName,
                            (snapshot) => resolveSlotValue(slot, currentModelSnapshotRef(), {
                                sourceName,
                                sourceSnapshot: snapshot
                            }),
                            (selectedValue) => {
                                applyState(selectedValue);
                            },
                            {
                                replayLatest: false,
                                selectorName: `template_slot:${slot.kind}:${slot.target}`
                            }
                        )
                        : null);
            }

            slotRecord.destroy = () => {
                if (typeof unsubscribe === 'function') {
                    try {
                        unsubscribe();
                    } catch (_error) {}
                    unsubscribe = null;
                }
                if (slotRecord.nestedSession && typeof slotRecord.nestedSession.destroy === 'function') {
                    try {
                        slotRecord.nestedSession.destroy();
                    } catch (_error) {}
                    slotRecord.nestedSession = null;
                }
                return true;
            };

            return slotRecord;
        }

        function createApplicationBindingError(code, message) {
            const error = new Error(message);
            error.code = code;
            return error;
        }

        function createApplicationBindingPayload(binding, element, sourceName, currentModelSnapshotRef) {
            const sourceSnapshot = sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                ? reactivity.getSourceSnapshot(sourceName, null)
                : MISSING_VALUE;
            const payload = createInteractionPayload(binding, currentModelSnapshotRef(), {
                event: null,
                target: element,
                sourceName,
                sourceSnapshot
            });
            if (binding.includeInteractionMeta !== true) return payload;
            return {
                ...payload,
                interaction: {
                    eventType: '$event.type',
                    key: '$event.key',
                    targetId: '$target.id',
                    targetName: '$target.name',
                    targetValue: '$target.value',
                    checked: '$target.checked',
                    dataset: '$target.dataset'
                }
            };
        }

        function createApplicationBindingRecord(
            rootId,
            templateQualifiedId,
            binding,
            element,
            sourceName,
            bindingIndex,
            currentModelSnapshotRef
        ) {
            if (!element || typeof element.addEventListener !== 'function') return null;
            const event = clampString(binding.eventType, 'click') || 'click';
            if (!/^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(event) || event.toLowerCase().startsWith('on')) {
                throw createApplicationBindingError(
                    'rmt.template.binding.event-unsafe',
                    `Unsicherer Template-Eventname ${event}.`
                );
            }
            const command = clampString(
                binding.kind === 'root_event' ? binding.eventName : binding.commandName,
                ''
            );
            if (!command || !/^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(command)) {
                throw createApplicationBindingError(
                    'rmt.template.binding.command-invalid',
                    `Template-Binding ${binding.kind} benoetigt ein sicheres Command beziehungsweise Root-Event.`
                );
            }
            if (binding.bindingId && !/^[a-zA-Z][a-zA-Z0-9_.:-]*$/.test(binding.bindingId)) {
                throw createApplicationBindingError(
                    'rmt.template.binding.id-unsafe',
                    `Unsichere Template-Binding-ID ${binding.bindingId}.`
                );
            }
            const signature = [
                rootId,
                templateQualifiedId,
                bindingIndex,
                binding.kind,
                binding.target,
                event,
                command
            ].join('|');
            const id = normalizeBindingIdentifier(
                binding.bindingId,
                `rmt.template.binding.${stableBindingHash(signature)}`
            );
            const options = Object.freeze({
                capture: binding.capture === true,
                once: binding.once === true,
                passive: binding.passive === true
            });
            const governance = Object.freeze({
                ...options,
                preventDefault: binding.preventDefault === true,
                stopPropagation: binding.stopPropagation === true,
                stopImmediatePropagation: false,
                retarget: 'target'
            });
            const rawPostAction = binding.postAction;
            const postAction = Array.isArray(rawPostAction)
                ? rawPostAction.slice()
                : (rawPostAction === null || rawPostAction === undefined ? [] : [rawPostAction]);
            const rootEventTarget = binding.kind === 'root_event'
                ? Object.freeze({
                    kind: 'rmt-root-event',
                    rootId,
                    eventName: command
                })
                : binding.commandTarget;
            return Object.freeze({
                schema: RMT_DOM_APPLICATION_BINDING_SCHEMA,
                id,
                bindingId: id,
                kind: 'application',
                target: element,
                event,
                command: binding.kind === 'command' ? command.toLowerCase() : command,
                action: binding.kind === 'command' ? command.toLowerCase() : command,
                options,
                governance,
                owner: `template.${clampString(rootId || templateQualifiedId, 'anonymous')}`,
                component: clampString(templateQualifiedId, ''),
                payload: createApplicationBindingPayload(binding, element, sourceName, currentModelSnapshotRef),
                payloadContract: cloneSerializable(binding.payloadContract, null),
                payloadAdapter: cloneSerializable(binding.payloadAdapter, null),
                closest: binding.closest || null,
                condition: cloneSerializable(binding.condition, null),
                guard: cloneSerializable(binding.guard, null),
                postAction: Object.freeze(postAction),
                commandTarget: cloneSerializable(rootEventTarget, null),
                lane: binding.lane || null,
                scope: '',
                metadata: Object.freeze({
                    bindingKind: binding.kind,
                    rootId,
                    templateQualifiedId,
                    supersessionKey: binding.supersessionKey || null
                })
            });
        }

        function createInteractionBindingRecord(
            rootId,
            rootElement,
            templateQualifiedId,
            binding,
            reactivityHints,
            currentModelSnapshotRef,
            bindingIndex
        ) {
            const element = resolveBindingElement(rootElement, binding);
            const sourceName = resolveDefaultSourceName(binding, reactivityHints);
            const applicationBinding = createApplicationBindingRecord(
                rootId,
                templateQualifiedId,
                binding,
                element,
                sourceName,
                bindingIndex,
                currentModelSnapshotRef
            );
            if (applicationBinding) reflectActionBindingAttributes(element, binding);
            return {
                binding,
                element: applicationBinding ? element : null,
                sourceName,
                applicationBinding: true,
                bindingIndex,
                createApplicationBinding() {
                    return createApplicationBindingRecord(
                        rootId,
                        templateQualifiedId,
                        binding,
                        element,
                        sourceName,
                        bindingIndex,
                        currentModelSnapshotRef
                    );
                },
                destroy() {
                    return true;
                }
            };
        }

        function createTemplateOutletBindingRecord(rootId, rootElement, templateQualifiedId, binding, reactivityHints, currentModelSnapshotRef, options = {}) {
            const element = resolveBindingElement(rootElement, binding);
            const sourceName = resolveDefaultSourceName(binding, reactivityHints);

            if (sourceName && reactivity && typeof reactivity.ensureSource === 'function') {
                reactivity.ensureSource(sourceName, null, {
                    meta: {
                        source: 'rmt_template_runtime_renderer',
                        templateQualifiedId
                    }
                });
            }

            const bindingRecord = {
                rootId,
                binding,
                element,
                sourceName,
                renderState: 'initial',
                lastEmptyMarkup: '',
                lastTemplateQualifiedId: '',
                nestedSession: null,
                nestedChunk: null
            };

            function applyState(nextState) {
                if (!bindingRecord.element) return false;
                return renderNestedTemplateBinding(bindingRecord, nextState, options);
            }

            const sourceSnapshot = sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                ? reactivity.getSourceSnapshot(sourceName, null)
                : MISSING_VALUE;
            const initialState = resolveTemplateOutletValue(binding, currentModelSnapshotRef(), {
                sourceName,
                sourceSnapshot
            });
            applyState(initialState);

            let unsubscribe = null;
            if (sourceName && bindingRecord.element && reactivity) {
                unsubscribe = rootId && typeof reactivity.watchRoot === 'function'
                    ? reactivity.watchRoot(
                        rootId,
                        sourceName,
                        (snapshot) => resolveTemplateOutletValue(binding, currentModelSnapshotRef(), {
                            sourceName,
                            sourceSnapshot: snapshot
                        }),
                        (selectedValue) => {
                            applyState(selectedValue);
                        },
                        {
                            replayLatest: false,
                            selectorName: `template_binding:${binding.kind}:${binding.target}`
                        }
                    )
                    : (typeof reactivity.watch === 'function'
                        ? reactivity.watch(
                            sourceName,
                            (snapshot) => resolveTemplateOutletValue(binding, currentModelSnapshotRef(), {
                                sourceName,
                                sourceSnapshot: snapshot
                            }),
                            (selectedValue) => {
                                applyState(selectedValue);
                            },
                            {
                                replayLatest: false,
                                selectorName: `template_binding:${binding.kind}:${binding.target}`
                            }
                        )
                        : null);
            }

            bindingRecord.destroy = () => {
                if (typeof unsubscribe === 'function') {
                    try {
                        unsubscribe();
                    } catch (_error) {}
                    unsubscribe = null;
                }
                if (bindingRecord.nestedSession && typeof bindingRecord.nestedSession.destroy === 'function') {
                    try {
                        bindingRecord.nestedSession.destroy();
                    } catch (_error) {}
                    bindingRecord.nestedSession = null;
                }
                bindingRecord.nestedChunk = null;
                return true;
            };

            return bindingRecord;
        }

        function createTemplateRepeatBindingRecord(rootId, rootElement, templateQualifiedId, binding, reactivityHints, currentModelSnapshotRef, options = {}) {
            const element = resolveBindingElement(rootElement, binding);
            const sourceName = resolveDefaultSourceName(binding, reactivityHints);

            if (sourceName && reactivity && typeof reactivity.ensureSource === 'function') {
                reactivity.ensureSource(sourceName, null, {
                    meta: {
                        source: 'rmt_template_runtime_renderer',
                        templateQualifiedId
                    }
                });
            }

            const bindingRecord = {
                rootId,
                binding,
                element,
                sourceName,
                renderState: 'initial',
                lastEmptyMarkup: '',
                lastTemplateQualifiedId: '',
                itemRecords: []
            };

            function applyState(nextState) {
                if (!bindingRecord.element) return false;
                return renderRepeatedTemplateBinding(bindingRecord, nextState, options);
            }

            const sourceSnapshot = sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                ? reactivity.getSourceSnapshot(sourceName, null)
                : MISSING_VALUE;
            const initialState = resolveTemplateRepeatValue(binding, currentModelSnapshotRef(), {
                sourceName,
                sourceSnapshot
            });
            applyState(initialState);

            let unsubscribe = null;
            if (sourceName && bindingRecord.element && reactivity) {
                unsubscribe = rootId && typeof reactivity.watchRoot === 'function'
                    ? reactivity.watchRoot(
                        rootId,
                        sourceName,
                        (snapshot) => resolveTemplateRepeatValue(binding, currentModelSnapshotRef(), {
                            sourceName,
                            sourceSnapshot: snapshot
                        }),
                        (selectedValue) => {
                            applyState(selectedValue);
                        },
                        {
                            replayLatest: false,
                            selectorName: `template_binding:${binding.kind}:${binding.target}`
                        }
                    )
                    : (typeof reactivity.watch === 'function'
                        ? reactivity.watch(
                            sourceName,
                            (snapshot) => resolveTemplateRepeatValue(binding, currentModelSnapshotRef(), {
                                sourceName,
                                sourceSnapshot: snapshot
                            }),
                            (selectedValue) => {
                                applyState(selectedValue);
                            },
                            {
                                replayLatest: false,
                                selectorName: `template_binding:${binding.kind}:${binding.target}`
                            }
                        )
                        : null);
            }

            bindingRecord.destroy = () => {
                if (typeof unsubscribe === 'function') {
                    try {
                        unsubscribe();
                    } catch (_error) {}
                    unsubscribe = null;
                }
                if (Array.isArray(bindingRecord.itemRecords)) {
                    bindingRecord.itemRecords.forEach((itemRecord) => {
                        if (!itemRecord || !itemRecord.nestedSession || typeof itemRecord.nestedSession.destroy !== 'function') {
                            return;
                        }
                        try {
                            itemRecord.nestedSession.destroy();
                        } catch (_error) {}
                    });
                }
                bindingRecord.itemRecords = [];
                return true;
            };

            return bindingRecord;
        }

        function resolveApplicationBindingScopeId(rootElement, rootId, templateQualifiedId) {
            if (rootElement && typeof rootElement === 'object') {
                const existing = bindingScopes.get(rootElement);
                if (existing) return existing;
                bindingScopeSequence += 1;
                const id = `rmt.template.binding-scope.${stableBindingHash(
                    `${rootId}|${templateQualifiedId}|${bindingScopeSequence}`
                )}`;
                bindingScopes.set(rootElement, id);
                return id;
            }
            bindingScopeSequence += 1;
            return `rmt.template.binding-scope.${bindingScopeSequence}`;
        }

        function createBindingSession(sessionInput = {}, options = {}) {
            const rawSessionInput = sessionInput && typeof sessionInput === 'object'
                ? sessionInput
                : {};
            const rootId = clampString(rawSessionInput.rootId || options.rootId, '');
            const rootElement = resolveElementRef(
                rawSessionInput.element || rawSessionInput.rootElement || rawSessionInput.target,
                rawSessionInput
            );
            if (!rootElement) {
                throw new Error('RmtTemplateRuntimeRenderer konnte das Root-Element nicht aufloesen.');
            }

            const chunk = rawSessionInput.chunk && typeof rawSessionInput.chunk === 'object'
                ? rawSessionInput.chunk
                : null;
            const reactivityHints = cloneSerializable(
                rawSessionInput.reactivityHints !== undefined
                    ? rawSessionInput.reactivityHints
                    : (chunk && chunk.hydration && chunk.hydration.reactivityHints),
                {}
            );
            const bindings = normalizeBindings(
                rawSessionInput.bindings !== undefined
                    ? rawSessionInput.bindings
                    : (chunk && chunk.hydration && chunk.hydration.bindings)
            );
            const slots = normalizeSlots(
                rawSessionInput.slots !== undefined
                    ? rawSessionInput.slots
                    : (chunk && chunk.hydration && chunk.hydration.slots)
            );
            let currentTemplateQualifiedId = clampString(
                rawSessionInput.templateQualifiedId
                || (chunk && chunk.template && chunk.template.qualifiedId),
                ''
            );
            const sessionStructureSignature = createTemplateStructureSignature(
                bindings,
                slots,
                chunk && chunk.template ? chunk.template.mode : ''
            );
            const applicationBindingScopeId = resolveApplicationBindingScopeId(
                rootElement,
                rootId,
                currentTemplateQualifiedId
            );

            let currentModelSnapshot = cloneSerializable(
                rawSessionInput.modelSnapshot !== undefined
                    ? rawSessionInput.modelSnapshot
                    : (chunk && chunk.modelSnapshot),
                {}
            );
            let destroyed = false;
            let removedApplicationBindings = [];
            const disposers = [];
            const slotRecords = slots.map((slot) => {
                const slotRecord = createSlotRecord(
                    rootId,
                    rootElement,
                    currentTemplateQualifiedId,
                    slot,
                    reactivityHints,
                    () => currentModelSnapshot,
                    options
                );
                if (slotRecord && typeof slotRecord.destroy === 'function') {
                    disposers.push(() => slotRecord.destroy());
                }
                return slotRecord;
            });
            const records = bindings.map((binding, bindingIndex) => {
                if (binding.kind === 'template_outlet') {
                    const structuralRecord = createTemplateOutletBindingRecord(
                        rootId,
                        rootElement,
                        currentTemplateQualifiedId,
                        binding,
                        reactivityHints,
                        () => currentModelSnapshot,
                        options
                    );
                    if (structuralRecord && typeof structuralRecord.destroy === 'function') {
                        disposers.push(() => structuralRecord.destroy());
                    }
                    return structuralRecord;
                }

                if (binding.kind === 'template_repeat') {
                    const repeatRecord = createTemplateRepeatBindingRecord(
                        rootId,
                        rootElement,
                        currentTemplateQualifiedId,
                        binding,
                        reactivityHints,
                        () => currentModelSnapshot,
                        options
                    );
                    if (repeatRecord && typeof repeatRecord.destroy === 'function') {
                        disposers.push(() => repeatRecord.destroy());
                    }
                    return repeatRecord;
                }

                if (binding.kind === 'command' || binding.kind === 'root_event') {
                    const interactionSourceName = resolveDefaultSourceName(binding, reactivityHints);
                    if (interactionSourceName && reactivity && typeof reactivity.ensureSource === 'function') {
                        reactivity.ensureSource(interactionSourceName, null, {
                            meta: {
                                source: 'rmt_template_runtime_renderer',
                                templateQualifiedId: currentTemplateQualifiedId
                            }
                        });
                    }
                    const interactionRecord = createInteractionBindingRecord(
                        rootId,
                        rootElement,
                        currentTemplateQualifiedId,
                        binding,
                        reactivityHints,
                        () => currentModelSnapshot,
                        bindingIndex
                    );
                    if (interactionRecord && typeof interactionRecord.destroy === 'function') {
                        disposers.push(() => interactionRecord.destroy());
                    }
                    return interactionRecord;
                }

                const sourceName = resolveDefaultSourceName(binding, reactivityHints);
                if (sourceName && reactivity && typeof reactivity.ensureSource === 'function') {
                    reactivity.ensureSource(sourceName, null, {
                        meta: {
                            source: 'rmt_template_runtime_renderer',
                            templateQualifiedId: currentTemplateQualifiedId
                        }
                    });
                }
                const element = resolveBindingElement(rootElement, binding);
                const sourceSnapshot = sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                    ? reactivity.getSourceSnapshot(sourceName, null)
                    : null;
                applyBindingValue(
                    element,
                    binding,
                    resolveBindingValue(binding, currentModelSnapshot, {
                        sourceName,
                        sourceSnapshot
                    })
                );

                if (sourceName && element && reactivity) {
                    const dispose = rootId && typeof reactivity.watchRoot === 'function'
                        ? reactivity.watchRoot(
                            rootId,
                            sourceName,
                            (snapshot) => resolveBindingValue(binding, currentModelSnapshot, {
                                sourceName,
                                sourceSnapshot: snapshot
                            }),
                            (selectedValue) => {
                                applyBindingValue(element, binding, selectedValue);
                            },
                            {
                                replayLatest: false,
                                selectorName: `template_binding:${binding.kind}:${binding.target}`
                            }
                        )
                        : (typeof reactivity.watch === 'function'
                            ? reactivity.watch(
                                sourceName,
                                (snapshot) => resolveBindingValue(binding, currentModelSnapshot, {
                                    sourceName,
                                    sourceSnapshot: snapshot
                                }),
                                (selectedValue) => {
                                    applyBindingValue(element, binding, selectedValue);
                                },
                                {
                                    replayLatest: false,
                                    selectorName: `template_binding:${binding.kind}:${binding.target}`
                                }
                            )
                            : function disposeWatchNoop() {});
                    disposers.push(dispose);
                }

                return {
                    binding,
                    element,
                    sourceName
                };
            });

            function listApplicationBindings() {
                if (destroyed) return [];
                const bindingsById = new Map();
                const directBindings = records
                    .filter((record) => record && record.applicationBinding === true)
                    .map((record) => record.createApplicationBinding())
                    .filter(Boolean);
                const nestedBindings = [];
                records.forEach((record) => {
                    if (
                        record
                        && record.nestedSession
                        && typeof record.nestedSession.listApplicationBindings === 'function'
                    ) {
                        nestedBindings.push(...record.nestedSession.listApplicationBindings());
                    }
                    (Array.isArray(record && record.itemRecords) ? record.itemRecords : []).forEach((itemRecord) => {
                        if (
                            itemRecord
                            && itemRecord.nestedSession
                            && typeof itemRecord.nestedSession.listApplicationBindings === 'function'
                        ) {
                            nestedBindings.push(...itemRecord.nestedSession.listApplicationBindings());
                        }
                    });
                });
                const applicationBindings = directBindings
                    .concat(nestedBindings)
                    .map((binding) => Object.freeze({
                        ...binding,
                        scope: applicationBindingScopeId
                    }));
                applicationBindings.forEach((binding) => {
                    if (bindingsById.has(binding.id)) {
                        throw createApplicationBindingError(
                            'rmt.template.binding.id-duplicate',
                            `Template-Binding-ID ${binding.id} ist innerhalb des Scopes nicht eindeutig.`
                        );
                    }
                    bindingsById.set(binding.id, binding.target);
                });
                return applicationBindings;
            }

            function getApplicationBindingCommitResult() {
                const applicationBindings = listApplicationBindings();
                const removedBindings = destroyed
                    ? removedApplicationBindings.map((binding) => Object.freeze({
                        bindingId: binding.id,
                        target: binding.target
                    }))
                    : [];
                return Object.freeze({
                    schema: RMT_DOM_COMMIT_RESULT_SCHEMA,
                    operation: 'reconcile-element',
                    target: rootElement,
                    nodes: Object.freeze([rootElement]),
                    nodeCount: 1,
                    changed: false,
                    structural: false,
                    bindings: Object.freeze(applicationBindings),
                    bindingScope: Object.freeze({
                        schema: RMT_DOM_BINDING_SCOPE_SCHEMA,
                        id: applicationBindingScopeId,
                        target: rootElement,
                        roots: Object.freeze([rootElement]),
                        complete: true,
                        bindingIds: Object.freeze(applicationBindings.map((binding) => binding.id)),
                        removedBindings: Object.freeze(removedBindings)
                    }),
                    diagnostics: Object.freeze([]),
                    metadata: Object.freeze({
                        source: 'rmt.template.runtime-renderer',
                        rootId,
                        templateQualifiedId: currentTemplateQualifiedId
                    })
                });
            }

            function updateModel(nextModelSnapshot = {}) {
                currentModelSnapshot = cloneSerializable(nextModelSnapshot, {});
                let appliedCount = 0;
                records.forEach((record) => {
                    if (!record || !record.element) return;
                    if (record.binding.kind === 'command' || record.binding.kind === 'root_event') return;
                    if (record.binding.kind === 'template_outlet') {
                        const sourceSnapshot = record.sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                            ? reactivity.getSourceSnapshot(record.sourceName, null)
                            : MISSING_VALUE;
                        if (record.sourceName && sourceSnapshot !== MISSING_VALUE && sourceSnapshot !== null) {
                            return;
                        }
                        if (renderNestedTemplateBinding(
                            record,
                            resolveTemplateOutletValue(record.binding, currentModelSnapshot, {
                                sourceName: record.sourceName,
                                sourceSnapshot
                            }),
                            options
                        )) {
                            appliedCount += 1;
                        }
                        return;
                    }
                    if (record.binding.kind === 'template_repeat') {
                        const sourceSnapshot = record.sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                            ? reactivity.getSourceSnapshot(record.sourceName, null)
                            : MISSING_VALUE;
                        if (record.sourceName && sourceSnapshot !== MISSING_VALUE && sourceSnapshot !== null) {
                            return;
                        }
                        if (renderRepeatedTemplateBinding(
                            record,
                            resolveTemplateRepeatValue(record.binding, currentModelSnapshot, {
                                sourceName: record.sourceName,
                                sourceSnapshot
                            }),
                            options
                        )) {
                            appliedCount += 1;
                        }
                        return;
                    }
                    const sourceSnapshot = record.sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                        ? reactivity.getSourceSnapshot(record.sourceName, null)
                        : MISSING_VALUE;
                    if (sourceSnapshot !== MISSING_VALUE && sourceSnapshot !== null) {
                        return;
                    }
                    if (applyBindingValue(
                        record.element,
                        record.binding,
                        resolveBindingValue(record.binding, currentModelSnapshot, {
                            sourceName: record.sourceName,
                            sourceSnapshot
                        })
                    )) {
                        appliedCount += 1;
                    }
                });
                slotRecords.forEach((slotRecord) => {
                    if (!slotRecord || !slotRecord.element || !slotRecord.slot) return;
                    const sourceSnapshot = slotRecord.sourceName && reactivity && typeof reactivity.getSourceSnapshot === 'function'
                        ? reactivity.getSourceSnapshot(slotRecord.sourceName, null)
                        : MISSING_VALUE;
                    if (slotRecord.sourceName && sourceSnapshot !== MISSING_VALUE && sourceSnapshot !== null) {
                        return;
                    }
                    if (slotRecord.slot.kind === 'template') {
                        if (renderNestedTemplateSlot(
                            slotRecord,
                            resolveSlotValue(slotRecord.slot, currentModelSnapshot, {
                                sourceName: slotRecord.sourceName,
                                sourceSnapshot
                            }),
                            options
                        )) {
                            appliedCount += 1;
                        }
                        return;
                    }
                    if (applySlotValue(
                        slotRecord.element,
                        slotRecord.slot,
                        resolveSlotValue(slotRecord.slot, currentModelSnapshot, {
                            sourceName: slotRecord.sourceName,
                            sourceSnapshot
                        })
                    )) {
                        appliedCount += 1;
                    }
                });
                return appliedCount;
            }

            function rebindChunk(nextChunkInput = null) {
                if (!nextChunkInput || typeof nextChunkInput !== 'object') return false;
                const nextBindings = normalizeBindings(nextChunkInput.hydration && nextChunkInput.hydration.bindings);
                const nextSlots = normalizeSlots(nextChunkInput.hydration && nextChunkInput.hydration.slots);
                const nextStructureSignature = createTemplateStructureSignature(
                    nextBindings,
                    nextSlots,
                    nextChunkInput.template && nextChunkInput.template.mode
                );
                if (nextStructureSignature !== sessionStructureSignature) {
                    return false;
                }
                currentTemplateQualifiedId = clampString(
                    nextChunkInput.template && nextChunkInput.template.qualifiedId,
                    currentTemplateQualifiedId
                );
                updateModel(nextChunkInput.modelSnapshot || {});
                return true;
            }

            function destroy() {
                if (destroyed) return false;
                removedApplicationBindings = listApplicationBindings();
                destroyed = true;
                disposers.splice(0, disposers.length).forEach((dispose) => {
                    if (typeof dispose !== 'function') return;
                    try {
                        dispose();
                    } catch (_error) {
                        // Template binding disposers must not interrupt the runtime path.
                    }
                });
                return true;
            }

            return Object.freeze({
                appliedAt: now(),
                destroy,
                getBindingCount: () => records.length,
                getApplicationBindingCommitResult,
                getModelSnapshot: () => cloneSerializable(currentModelSnapshot, {}),
                getResolvedBindingCount: () => records.filter((record) => !!record.element).length,
                getResolvedSlotCount: () => slotRecords.filter((slotRecord) => !!(slotRecord && slotRecord.element)).length,
                getRootElement: () => rootElement,
                getRootId: () => rootId,
                getSlotCount: () => slotRecords.length,
                getTemplateQualifiedId: () => currentTemplateQualifiedId,
                listApplicationBindings,
                listBindings: () => records.map((record) => ({
                    bindingId: record.binding.bindingId || '',
                    kind: record.binding.kind,
                    target: record.binding.target,
                    source: record.binding.kind === 'template_outlet'
                        ? (record.binding.modelSource || record.binding.source || record.binding.templateSource || '')
                        : (record.binding.kind === 'template_repeat'
                            ? (record.binding.itemsSource || record.binding.modelSource || record.binding.source || record.binding.templateSource || '')
                            : record.binding.source),
                    sourceName: record.sourceName,
                    eventType: record.binding.eventType || '',
                    commandName: record.binding.commandName || '',
                    eventName: record.binding.eventName || '',
                    action: record.binding.action || '',
                    actionAttribute: record.binding.actionAttribute || '',
                    resolved: !!record.element
                })),
                listSlots: () => slotRecords.map((slotRecord) => ({
                    kind: slotRecord.slot.kind,
                    name: slotRecord.slot.name,
                    target: slotRecord.slot.target,
                    source: slotRecord.slot.source || slotRecord.slot.modelSource || '',
                    sourceName: slotRecord.sourceName,
                    templateQualifiedId: slotRecord.nestedChunk && slotRecord.nestedChunk.template
                        ? slotRecord.nestedChunk.template.qualifiedId
                        : '',
                    resolved: !!slotRecord.element
                })),
                listTrustVerdicts,
                getPanicSnapshot,
                listPanicEvents,
                beginPanicRecovery,
                completePanicRecovery,
                failPanicRecovery,
                rememberSafeSnapshot,
                getLastSafeSnapshot,
                listSafeSnapshots,
            restoreLastSafeSnapshot,
            renderSafeFallback,
            recoverFromPanic,
            listRecoveryOutcomes,
            listPanicRecoveryRecords,
            getPanicRecoverySnapshot,
            listQuarantinedScopes,
            isScopeQuarantined,
            rebindChunk,
                updateModel
            });
        }

        function applyBindings(sessionInput = {}, options = {}) {
            return createBindingSession(sessionInput, options);
        }

        return Object.freeze({
            applyBindings,
            commitTrustedHtml,
            createFragmentFromHtml,
            createTemplateStructureSignature,
            createBindingSession,
            listSupportedBindingKinds: () => SUPPORTED_BINDING_KINDS.slice(),
            listSupportedSlotKinds: () => SUPPORTED_SLOT_KINDS.slice(),
            listTrustVerdicts,
            getPanicSnapshot,
            listPanicEvents,
            beginPanicRecovery,
            completePanicRecovery,
            failPanicRecovery,
            rememberSafeSnapshot,
            getLastSafeSnapshot,
            listSafeSnapshots,
            quarantineScope,
            restoreLastSafeSnapshot,
            renderSafeFallback,
            recoverFromPanic,
            listRecoveryOutcomes,
            listPanicRecoveryRecords,
            getPanicRecoverySnapshot,
            listQuarantinedScopes,
            isScopeQuarantined,
            normalizeBinding,
            normalizeBindings,
            normalizeSlot,
            normalizeSlots,
            resolveBindingValue
        });
    };
})(__XTENDRMT_GLOBAL__);

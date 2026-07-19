<?php
declare(strict_types=1);

const XSCALER_PREFLIGHT_REQUEST_SCHEMA = 'xtend.xscaler.preflight-request.v1';
const XSCALER_PREFLIGHT_RESPONSE_SCHEMA = 'xtend.xscaler.preflight-response.v1';
const XSCALER_REMOTE_SURFACE_PLAN_SCHEMA = 'xtend.xscaler.remote-surface-plan.v1';
const XSCALER_XTENSION_DEPLOYMENT_SCHEMA = 'xtend.xscaler.xtension-deployment.v1';
const XSCALER_ATC_HANDOFF_SCHEMA = 'xtend.xscaler.atc-handoff.v1';
const XSCALER_PROTOCOL = 'xscaler';

const XSCALER_ORIGIN_BLOCKED_CODE = 'xscaler.preflight.origin_blocked';
const XSCALER_INTEGRITY_MISSING_CODE = 'xscaler.preflight.integrity_missing';
const XSCALER_SSR_NETWORK_DENIED_CODE = 'xscaler.preflight.ssr_network_denied';
const XSCALER_FALLBACK_MISSING_CODE = 'xscaler.preflight.fallback_missing';
const XSCALER_XTENSION_DENIED_CODE = 'xscaler.preflight.xtension_denied';
const XSCALER_CAPABILITY_MISMATCH_CODE = 'xscaler.preflight.capability_mismatch';

/** @return array<int, mixed> */
function xscalerToArray(mixed $value): array
{
    if (is_array($value)) return array_is_list($value) ? $value : [$value];
    if ($value === null) return [];
    return [$value];
}

function xscalerString(mixed $value, string $fallback = ''): string
{
    if (is_string($value)) {
        $trimmed = trim($value);
        return $trimmed !== '' ? $trimmed : $fallback;
    }
    if (is_bool($value)) return $value ? 'true' : 'false';
    if (is_int($value) || is_float($value)) return (string) $value;
    return $fallback;
}

/** @return array<string, mixed> */
function xscalerRecord(mixed $value): array
{
    return is_array($value) && !array_is_list($value) ? $value : [];
}

function xscalerValue(mixed $value, mixed $fallback = null): mixed
{
    if ($value === null) return $fallback;
    return $value;
}

/** @return array<int, string> */
function xscalerCapabilities(mixed $value): array
{
    $capabilities = [];
    foreach (xscalerToArray($value) as $capability) {
        if (is_string($capability)) {
            $normalized = xscalerString($capability);
        } else {
            $record = xscalerRecord($capability);
            $normalized = xscalerString($record['id'] ?? $record['name'] ?? $record['capability'] ?? null);
        }
        if ($normalized !== '') $capabilities[] = $normalized;
    }
    return $capabilities;
}

/** @return array<string, mixed> */
function xscalerDiagnostic(string $code, string $message, string $severity = 'error', array $extra = []): array
{
    return array_merge([
        'code' => $code,
        'severity' => $severity,
        'message' => $message,
    ], $extra);
}

/** @return array<string, mixed>|null */
function xscalerFirstRemoteSurface(mixed $remoteManifest): ?array
{
    $manifest = xscalerRecord($remoteManifest);
    if ($manifest === []) return null;
    $remoteSurface = xscalerRecord($manifest['remoteSurface'] ?? null);
    if ($remoteSurface !== []) return $remoteSurface;
    $remoteSurfaces = $manifest['remoteSurfaces'] ?? null;
    if (is_array($remoteSurfaces) && array_is_list($remoteSurfaces)) {
        $first = xscalerRecord($remoteSurfaces[0] ?? null);
        return $first !== [] ? $first : null;
    }
    if (($manifest['schema'] ?? null) === 'xtend.rmt.vnext-remote-surface.v1') return $manifest;
    return null;
}

function xscalerSurfaceName(array $source = []): string
{
    $surface = xscalerString(
        $source['surface'] ?? $source['name'] ?? $source['surfaceId'] ?? $source['rmtSurface'] ?? $source['id'] ?? null,
        'checkout.cart'
    );
    return preg_replace('/^remoteSurface:/u', '', $surface) ?? $surface;
}

function xscalerSurfaceId(array $source = []): string
{
    return xscalerString(
        $source['surfaceId'] ?? $source['rmtSurface'] ?? $source['surface'] ?? $source['name'] ?? $source['id'] ?? null,
        'checkout.cart'
    );
}

/** @return array{algorithm: string, digest: string} */
function xscalerIntegrity(array $source = []): array
{
    $remote = xscalerRecord($source['remote'] ?? null);
    $integrity = $source['integrity'] ?? $remote['integrity'] ?? [];
    if (is_string($integrity)) {
        $parts = explode('-', $integrity, 2);
        return ['algorithm' => xscalerString($parts[0] ?? null, 'sha256'), 'digest' => $integrity];
    }
    $record = xscalerRecord($integrity);
    if ($record !== []) {
        return [
            'algorithm' => xscalerString($record['algorithm'] ?? null, 'sha256'),
            'digest' => xscalerString($record['digest'] ?? $record['hash'] ?? null),
        ];
    }
    return ['algorithm' => '', 'digest' => ''];
}

function xscalerFallback(array $source = []): string
{
    $fallback = $source['fallbackSurface'] ?? $source['fallback'] ?? $source['fallbackRef'] ?? null;
    if (is_string($fallback)) return $fallback;
    $record = xscalerRecord($fallback);
    return xscalerString($record['ref'] ?? $record['id'] ?? $record['name'] ?? null);
}

/** @return array<int, array{lane: string, target: string}> */
function xscalerLanes(array $source = []): array
{
    $raw = $source['lanes'] ?? $source['shellBindings'] ?? $source['exposes'] ?? null;
    $lanes = xscalerToArray($raw);
    if ($lanes === []) return [['lane' => 'default', 'target' => 'shell.slot:default']];
    $normalized = [];
    foreach ($lanes as $entry) {
        if (is_string($entry)) {
            $normalized[] = ['lane' => 'default', 'target' => $entry];
            continue;
        }
        $record = xscalerRecord($entry);
        $target = $record['target'] ?? null;
        if (is_array($target)) {
            $targetRecord = xscalerRecord($target);
            $target = $targetRecord['ref'] ?? $targetRecord['id'] ?? null;
        }
        $normalized[] = [
            'lane' => xscalerString($record['lane'] ?? $record['name'] ?? null, 'default'),
            'target' => xscalerString($target ?? $record['ref'] ?? $record['id'] ?? null, 'shell.slot:default'),
        ];
    }
    return $normalized;
}

/** @return array<string, mixed> */
function createXScalerPreflightRequest(array $input = []): array
{
    $capabilities = xscalerCapabilities($input['capabilities'] ?? [
        'remote-surface-plan',
        'ssr-compatible',
        'xtension-deployment',
    ]);
    return [
        'schema' => XSCALER_PREFLIGHT_REQUEST_SCHEMA,
        'protocol' => XSCALER_PROTOCOL,
        'requestId' => xscalerString($input['requestId'] ?? null, 'xscaler-preflight-001'),
        'surface' => xscalerSurfaceName($input),
        'host' => xscalerValue($input['host'] ?? null, [
            'runtime' => 'xtend-rmt',
            'ssr' => true,
            'xtensions' => [],
        ]),
        'capabilities' => $capabilities,
        'constraints' => xscalerValue($input['constraints'] ?? null, [
            'allowNetworkDuringSsr' => false,
        ]),
    ];
}

/** @return array<string, mixed> */
function createXScalerRemoteSurfacePlan(array $input = []): array
{
    $source = xscalerFirstRemoteSurface($input['remoteManifest'] ?? null)
        ?? (xscalerRecord($input['remoteSurface'] ?? null) ?: null)
        ?? (is_array($input['surface'] ?? null) ? xscalerRecord($input['surface']) : null)
        ?? $input;
    $remote = xscalerRecord($source['remote'] ?? null);
    $owner = $source['owner'] ?? null;
    return [
        'schema' => XSCALER_REMOTE_SURFACE_PLAN_SCHEMA,
        'protocol' => XSCALER_PROTOCOL,
        'surface' => xscalerSurfaceName($source),
        'surfaceId' => xscalerString($source['surfaceId'] ?? $source['id'] ?? null),
        'owner' => is_string($owner)
            ? $owner
            : xscalerString(xscalerRecord($owner)['id'] ?? xscalerRecord($owner)['name'] ?? null, 'unknown-owner'),
        'origin' => xscalerString($source['origin'] ?? $remote['origin'] ?? null),
        'integrity' => xscalerIntegrity($source),
        'fallbackSurface' => xscalerFallback($source),
        'lanes' => xscalerLanes($source),
        'ssr' => [
            'mode' => xscalerString(xscalerRecord($source['ssr'] ?? null)['mode'] ?? null, 'preflight-only'),
            'networkDuringRender' => (xscalerRecord($source['ssr'] ?? null)['networkDuringRender'] ?? false) === true,
        ],
        'runtimeBoundary' => [
            'remoteRuntimeExecution' => false,
            'kernelRemoteExecution' => false,
            'networkRequiredByKernel' => false,
        ],
    ];
}

/** @return array<string, mixed> */
function createXScalerXtensionDeployment(array $input = []): array
{
    $accepted = ($input['accepted'] ?? true) !== false && ($input['ok'] ?? true) !== false;
    $ssr = xscalerRecord($input['ssr'] ?? null);
    return [
        'schema' => XSCALER_XTENSION_DEPLOYMENT_SCHEMA,
        'protocol' => XSCALER_PROTOCOL,
        'deploymentId' => xscalerString($input['deploymentId'] ?? null, 'xscaler-xtension-deployment'),
        'xtension' => xscalerString($input['xtension'] ?? null, 'host-controller'),
        'surface' => xscalerSurfaceName($input),
        'remoteSurfacePlan' => xscalerString($input['remoteSurfacePlan'] ?? null, 'xscaler-remote-surface-plan.json'),
        'rollout' => xscalerValue($input['rollout'] ?? null, ['strategy' => 'gated', 'percent' => $accepted ? 100 : 0]),
        'ssr' => [
            'hydrateAfterPreflight' => ($ssr['hydrateAfterPreflight'] ?? true) !== false,
            'requiresDom' => ($ssr['requiresDom'] ?? false) === true,
        ],
        'accepted' => $accepted,
    ];
}

/** @return array<string, mixed> */
function createXScalerAtcHandoff(array $input = []): array
{
    $defaultStatus = (($input['accepted'] ?? true) === false || ($input['ok'] ?? true) === false) ? 'refused' : 'ready';
    $status = xscalerString($input['status'] ?? null, $defaultStatus);
    $accepted = $status !== 'refused' && ($input['accepted'] ?? true) !== false && ($input['ok'] ?? true) !== false;
    $signal = xscalerString($input['handoffSignal'] ?? $input['action'] ?? null, $accepted ? 'attach' : 'refuse');
    $lifecycleState = xscalerString($input['lifecycleState'] ?? $input['state'] ?? null, $signal);
    $surfaceId = xscalerString($input['surfaceId'] ?? $input['surface'] ?? null, 'remoteSurface:unknown');
    $diagnostics = [];
    foreach (xscalerToArray($input['diagnostics'] ?? null) as $entry) {
        $diagnostics[] = xscalerRecord($entry);
    }
    return [
        'schema' => XSCALER_ATC_HANDOFF_SCHEMA,
        'protocol' => XSCALER_PROTOCOL,
        'surfaceId' => $surfaceId,
        'sessionId' => xscalerString($input['sessionId'] ?? null, 'xscaler:' . $surfaceId),
        'handoffSignal' => $signal,
        'lifecycleState' => $lifecycleState,
        'accepted' => $accepted,
        'ok' => $accepted,
        'status' => $accepted ? $status : 'refused',
        'fallback' => xscalerValue($input['fallback'] ?? null, null),
        'runtimeBoundary' => [
            'remoteRuntimeExecution' => false,
            'kernelRemoteExecution' => false,
            'networkRequiredByHandoff' => false,
        ],
        'diagnostics' => $diagnostics,
    ];
}

/** @return array<string, mixed> */
function createXScalerPreflightResponse(array $input = []): array
{
    $accepted = array_key_exists('accepted', $input) ? $input['accepted'] === true : ($input['ok'] ?? true) !== false;
    $diagnostics = [];
    foreach (xscalerToArray($input['diagnostics'] ?? null) as $entry) {
        $diagnostics[] = xscalerRecord($entry);
    }
    $rejection = null;
    if (!$accepted) {
        $fallback = [
            'code' => $diagnostics[0]['code'] ?? XSCALER_CAPABILITY_MISMATCH_CODE,
            'message' => $diagnostics[0]['message'] ?? 'XScaler preflight rejected the remote surface plan.',
        ];
        $rejection = xscalerRecord($input['rejection'] ?? null) ?: $fallback;
    }
    $requiredAnchors = [];
    foreach (xscalerToArray($input['requiredAnchors'] ?? null) as $anchor) {
        $normalized = xscalerString($anchor);
        if ($normalized !== '') $requiredAnchors[] = $normalized;
    }
    if ($requiredAnchors === []) {
        $requiredAnchors = ['#schemas', '#ssr-kompatibilitaet', '#xtensions-deployment'];
    }
    return [
        'schema' => XSCALER_PREFLIGHT_RESPONSE_SCHEMA,
        'protocol' => XSCALER_PROTOCOL,
        'requestId' => xscalerString($input['requestId'] ?? null, 'xscaler-preflight-001'),
        'accepted' => $accepted,
        'ok' => $accepted,
        'surface' => xscalerSurfaceName($input),
        'compatibility' => xscalerValue($input['compatibility'] ?? null, [
            'ssr' => $accepted ? 'compatible' : 'blocked',
            'remoteSurfacePlan' => $accepted ? 'required' : 'blocked',
            'xtensionDeployment' => $accepted ? 'allowed' : 'blocked',
        ]),
        'requiredAnchors' => $requiredAnchors,
        'remoteSurfacePlan' => xscalerValue($input['remoteSurfacePlan'] ?? null, null),
        'atc' => isset($input['atc'])
            ? xscalerRecord($input['atc'])
            : createXScalerAtcHandoff([
                'surfaceId' => $input['surfaceId'] ?? $input['surface'] ?? null,
                'accepted' => $accepted,
                'diagnostics' => $diagnostics,
            ]),
        'rejection' => $rejection,
        'diagnostics' => $diagnostics,
    ];
}

function xscalerHasCapability(array $request, string $capability): bool
{
    return in_array($capability, xscalerCapabilities($request['capabilities'] ?? null), true);
}

function xscalerHostAllowsOrigin(array $hostCapabilities, string $origin): bool
{
    $allowed = [];
    foreach (xscalerToArray($hostCapabilities['allowedOrigins'] ?? $hostCapabilities['origins'] ?? null) as $entry) {
        $normalized = xscalerString($entry);
        if ($normalized !== '') $allowed[] = $normalized;
    }
    return $allowed === [] || in_array($origin, $allowed, true);
}

function xscalerReportHasBlockingDiagnostic(mixed $report): bool
{
    $record = xscalerRecord($report);
    foreach (xscalerToArray($record['diagnostics'] ?? null) as $entry) {
        $diagnostic = xscalerRecord($entry);
        if (($diagnostic['severity'] ?? null) === 'error' || ($diagnostic['status'] ?? null) === 'blocked') return true;
    }
    return false;
}

/** @return array<string, mixed> */
function evaluateXScalerPreflight(array $input = []): array
{
    $request = createXScalerPreflightRequest(xscalerRecord($input['request'] ?? null));
    $planInput = xscalerRecord($input['remoteSurfacePlan'] ?? null);
    if ($planInput === []) $planInput = ['remoteManifest' => $input['remoteManifest'] ?? null];
    $plan = createXScalerRemoteSurfacePlan($planInput);
    $diagnostics = [];
    $hostCapabilities = xscalerRecord($input['hostCapabilities'] ?? null);
    $constraints = xscalerRecord($request['constraints'] ?? null);

    if (!xscalerHostAllowsOrigin($hostCapabilities, xscalerString($plan['origin'] ?? null))) {
        $origin = xscalerString($plan['origin'] ?? null);
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_ORIGIN_BLOCKED_CODE,
            'Remote origin "' . ($origin !== '' ? $origin : 'unknown') . '" is not allowed by host capabilities.',
            'error',
            ['origin' => $origin]
        );
    }
    $integrity = xscalerRecord($plan['integrity'] ?? null);
    if (xscalerString($integrity['digest'] ?? null) === '') {
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_INTEGRITY_MISSING_CODE,
            'Remote surface plan is missing integrity metadata.'
        );
    }
    $ssr = xscalerRecord($plan['ssr'] ?? null);
    if (($constraints['allowNetworkDuringSsr'] ?? null) === false && ($ssr['networkDuringRender'] ?? false) === true) {
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_SSR_NETWORK_DENIED_CODE,
            'Remote surface plan requested network access during SSR render.'
        );
    }
    if (xscalerString($plan['fallbackSurface'] ?? null) === '') {
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_FALLBACK_MISSING_CODE,
            'Remote surface plan is missing a fallback surface.'
        );
    }
    if (xscalerHasCapability($request, 'xtension-deployment') && ($hostCapabilities['allowXtensionDeployment'] ?? null) === false) {
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_XTENSION_DENIED_CODE,
            'Host capabilities deny XTension deployment for this surface.'
        );
    }
    if (!xscalerHasCapability($request, 'remote-surface-plan')) {
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_CAPABILITY_MISMATCH_CODE,
            'Preflight request did not ask for the remote-surface-plan capability.'
        );
    }
    if (xscalerReportHasBlockingDiagnostic($input['remoteSecurityReport'] ?? null)) {
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_ORIGIN_BLOCKED_CODE,
            'Remote security report contains blocking diagnostics.'
        );
    }
    if (xscalerReportHasBlockingDiagnostic($input['degradationReport'] ?? null)) {
        $diagnostics[] = xscalerDiagnostic(
            XSCALER_FALLBACK_MISSING_CODE,
            'Degradation report contains blocking diagnostics.'
        );
    }

    $accepted = $diagnostics === [];
    return createXScalerPreflightResponse([
        'requestId' => $request['requestId'],
        'surface' => $request['surface'],
        'surfaceId' => xscalerSurfaceId($plan),
        'accepted' => $accepted,
        'remoteSurfacePlan' => $plan,
        'diagnostics' => $diagnostics,
        'rejection' => $accepted ? null : [
            'code' => $diagnostics[0]['code'],
            'message' => $diagnostics[0]['message'],
        ],
    ]);
}

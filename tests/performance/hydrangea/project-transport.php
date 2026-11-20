<?php
declare(strict_types=1);
require __DIR__ . '/../../../tools/tooling-bridge-client.php';
$root = realpath(__DIR__ . '/../../..');
$bridge = $root . '/tools/tooling-bridge-cli.js';
$node = $argv[1] ?? 'node';
$classic = 'template transport { state value type number initial 1 }';
$cases = [
    [[], 1],
    [['schema' => 'xtend.compiler.tooling-bridge.v2'], 2],
    [['payload' => ['project' => true]], 2],
    [['payload' => ['options' => ['project' => true]]], 2],
    [['payload' => ['sourceSyntax' => 'rmt-vnext']], 2],
    [['payload' => ['sourceSyntax' => null]], 2],
    [['payload' => ['options' => ['sourceSyntax' => 'rmt-vnext']]], 2],
    [['payload' => ['rmtxProvidersFile' => 'registry.json']], 2],
    [['payload' => ['options' => ['rmtxProvidersFile' => 'registry.json']]], 2],
    [['payload' => ['filePath' => 'view.rmtx']], 2],
    [['payload' => ['filePath' => 'provider.tsx']], 1],
];
function checkProjectTransport(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
foreach ($cases as [$envelope, $version]) {
    $missing = xtendToolingBridgeRequest($bridge . '.missing', $root, $envelope, ['nodeBinary' => $node]);
    checkProjectTransport($missing['status'] === 'bridge-unavailable', 'Must exercise the actual local unavailable branch.');
    checkProjectTransport($missing['schema'] === 'xtend.compiler.tooling-bridge-response.v' . $version, 'Local schema routing differs from the JS project opt-in contract.');
}
$legacy = xtendToolingBridgeRequest($bridge, $root, ['operation' => 'compile', 'payload' => ['source' => $classic]], ['nodeBinary' => $node, 'timeoutSeconds' => 15]);
checkProjectTransport($legacy['schema'] === 'xtend.compiler.tooling-bridge-response.v1' && $legacy['ok'] && $legacy['exitCode'] === 0, 'Actual Legacy PHP/Node roundtrip failed.');
$project = xtendToolingBridgeRequest($bridge, $root, ['operation' => 'compile', 'payload' => ['source' => $classic, 'options' => ['project' => true]]], ['nodeBinary' => $node, 'timeoutSeconds' => 15]);
checkProjectTransport($project['schema'] === 'xtend.compiler.tooling-bridge-response.v2' && $project['ok'] && $project['exitCode'] === 0 && isset($project['result']['project']['identity']), 'Actual project PHP/Node roundtrip failed.');
$rejected = xtendToolingBridgeRequest($bridge, $root, ['schema' => 'xtend.compiler.tooling-bridge.v1', 'operation' => 'compile', 'payload' => ['source' => $classic, 'sourceSyntax' => 'rmt-vnext']], ['nodeBinary' => $node, 'timeoutSeconds' => 15]);
checkProjectTransport($rejected['schema'] === 'xtend.compiler.tooling-bridge-response.v2' && !$rejected['ok'] && $rejected['status'] === 'bridge-error' && $rejected['exitCode'] === 1, 'An explicit legacy envelope must reject project syntax with a consistent versioned failure.');
echo json_encode(['passed' => true, 'localRoutingCases' => count($cases), 'actualNodeRoundtrips' => 3], JSON_UNESCAPED_SLASHES) . PHP_EOL;

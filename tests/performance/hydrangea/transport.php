<?php
require __DIR__ . '/../../../tools/tooling-bridge-client.php';
$dir = sys_get_temp_dir() . '/hydrangea-transport-' . bin2hex(random_bytes(5));
mkdir($dir, 0700);
$node = $argv[1] ?? 'node';
function check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
try {
    $script = $dir . '/fixture.js';
    file_put_contents($script, "process.stdin.pause(); setInterval(()=>{},1000);");
    $start = microtime(true);
    $blocked = xtendToolingBridgeRequest($script, $dir, ['payload' => str_repeat('x', 4 * 1024 * 1024)], ['nodeBinary' => $node, 'timeoutSeconds' => 1]);
    check($blocked['status'] === 'bridge-timeout', 'Blocked stdin must time out');
    check(microtime(true) - $start < 2, 'stdin deadline must include writes');
    file_put_contents($script, "process.stdout.write('x'.repeat(200000));setInterval(()=>{},1000);");
    $large = xtendToolingBridgeRequest($script, $dir, [], ['nodeBinary' => $node, 'outputLimit' => 1024]);
    check($large['status'] === 'output-limit', 'Output limit must terminate a running process');
    file_put_contents($script, "process.stderr.write('x'.repeat(200000));setInterval(()=>{},1000);");
    $large = xtendToolingBridgeRequest($script, $dir, [], ['nodeBinary' => $node, 'outputLimit' => 1024]);
    check($large['status'] === 'output-limit', 'stderr must also be bounded');
    file_put_contents($script, "process.stdin.resume();process.stdin.on('end',()=>console.log(JSON.stringify({ok:true,status:'test'})));");
    for ($i = 0; $i < 4; $i++) {
        $valid = xtendToolingBridgeRequest($script, $dir, [], ['nodeBinary' => $node, 'concurrencyLimit' => 1]);
        check($valid['ok'] === true && $valid['exitCode'] === 0, 'Process and locks must be released');
    }
    echo "passed blocked stdin, stdout/stderr limits, successful drain and lock release\n";
} finally { unlink($dir . '/fixture.js'); rmdir($dir); }

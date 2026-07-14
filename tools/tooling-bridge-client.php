<?php
declare(strict_types=1);

function xtendToolingBridgeRequest(string $bridgePath, string $repoRoot, array $envelope, array $options = []): array
{
    $schema = 'xtend.compiler.tooling-bridge-response.v1';
    if (!function_exists('proc_open') || !is_readable($bridgePath)) return ['schema' => $schema, 'ok' => false, 'status' => 'bridge-unavailable', 'diagnostics' => []];
    $limit = max(1, min(8, (int) ($options['concurrencyLimit'] ?? 2)));
    $lockDir = sys_get_temp_dir() . '/xtend-tooling-bridge-locks';
    if (!is_dir($lockDir)) @mkdir($lockDir, 0700, true);
    $lock = null;
    for ($index = 0; $index < $limit; $index++) {
        $candidate = @fopen($lockDir . '/slot-' . $index . '.lock', 'c');
        if ($candidate && flock($candidate, LOCK_EX | LOCK_NB)) { $lock = $candidate; break; }
        if ($candidate) fclose($candidate);
    }
    if (!$lock) return ['schema' => $schema, 'ok' => false, 'status' => 'busy', 'diagnostics' => []];
    $spec = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $command = escapeshellcmd((string) ($options['nodeBinary'] ?? 'node')) . ' ' . escapeshellarg($bridgePath);
    $process = proc_open($command, $spec, $pipes, $repoRoot);
    if (!is_resource($process)) { flock($lock, LOCK_UN); fclose($lock); return ['schema' => $schema, 'ok' => false, 'status' => 'bridge-start-failed', 'diagnostics' => []]; }
    fwrite($pipes[0], json_encode($envelope, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) ?: '{}'); fclose($pipes[0]);
    stream_set_blocking($pipes[1], false); stream_set_blocking($pipes[2], false);
    $stdout = ''; $stderr = ''; $deadline = microtime(true) + max(1, (int) ($options['timeoutSeconds'] ?? 3)); $timedOut = false;
    do {
        $stdout .= stream_get_contents($pipes[1]); $stderr .= stream_get_contents($pipes[2]); $status = proc_get_status($process);
        if (!$status['running']) break;
        if (microtime(true) >= $deadline) { $timedOut = true; proc_terminate($process); usleep(100000); $status = proc_get_status($process); if ($status['running']) proc_terminate($process, 9); break; }
        usleep(10000);
    } while (true);
    $stdout .= stream_get_contents($pipes[1]); fclose($pipes[1]); $stderr .= stream_get_contents($pipes[2]); fclose($pipes[2]); $exitCode = proc_close($process);
    flock($lock, LOCK_UN); fclose($lock);
    if (strlen($stdout) > (int) ($options['outputLimit'] ?? 16777216)) return ['schema' => $schema, 'ok' => false, 'status' => 'output-limit', 'diagnostics' => []];
    if ($timedOut) return ['schema' => $schema, 'ok' => false, 'status' => 'bridge-timeout', 'diagnostics' => []];
    $decoded = json_decode($stdout, true);
    if (!is_array($decoded)) return ['schema' => $schema, 'ok' => false, 'status' => 'bridge-output-invalid', 'diagnostics' => [['code' => 'xtend.compiler.tooling_bridge.output_invalid', 'severity' => 'error', 'message' => trim($stderr) ?: 'Tooling bridge did not return JSON.']]];
    $decoded['exitCode'] = $exitCode;
    return $decoded;
}

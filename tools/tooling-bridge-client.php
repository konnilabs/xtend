<?php
declare(strict_types=1);

function xtendToolingBridgeRequest(string $bridgePath, string $repoRoot, array $envelope, array $options = []): array
{
    $schema = 'xtend.compiler.tooling-bridge-response.v1';
    $failure = static function (string $status, array $diagnostics = []) use ($schema): array {
        return ['schema' => $schema, 'ok' => false, 'status' => $status, 'diagnostics' => $diagnostics];
    };
    if (!function_exists('proc_open') || !is_readable($bridgePath)) return $failure('bridge-unavailable');
    $limit = max(1, min(8, (int) ($options['concurrencyLimit'] ?? 2)));
    $lockDir = sys_get_temp_dir() . '/xtend-tooling-bridge-locks';
    if (!is_dir($lockDir)) @mkdir($lockDir, 0700, true);
    $lock = null;
    for ($index = 0; $index < $limit; $index++) {
        $candidate = @fopen($lockDir . '/slot-' . $index . '.lock', 'c');
        if ($candidate && flock($candidate, LOCK_EX | LOCK_NB)) { $lock = $candidate; break; }
        if ($candidate) fclose($candidate);
    }
    if (!$lock) return $failure('busy');
    $process = null;
    $pipes = [];
    try {
        $body = json_encode($envelope, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) return $failure('bridge-input-invalid');
        // Direct invocation makes proc_terminate target Node, not an intermediate shell.
        $deadline = microtime(true) + max(1, (int) ($options['timeoutSeconds'] ?? 3));
        $process = proc_open([(string) ($options['nodeBinary'] ?? 'node'), $bridgePath], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $repoRoot);
        if (!is_resource($process)) return $failure('bridge-start-failed');
        foreach ($pipes as $pipe) stream_set_blocking($pipe, false);
        $stdout = ''; $stderr = ''; $offset = 0; $stopped = null; $exitCode = -1;
        $outputLimit = max(1, (int) ($options['outputLimit'] ?? 16777216));
        while (true) {
            if (microtime(true) >= $deadline) { $stopped = 'bridge-timeout'; break; }
            $status = proc_get_status($process);
            if (!$status['running'] && $status['exitcode'] >= 0) $exitCode = $status['exitcode'];
            if (isset($pipes[0]) && ($offset >= strlen($body) || !$status['running'])) {
                fclose($pipes[0]); unset($pipes[0]);
            }
            $read = [];
            foreach ([1, 2] as $channel) {
                if (isset($pipes[$channel])) {
                    if (feof($pipes[$channel])) { fclose($pipes[$channel]); unset($pipes[$channel]); }
                    else $read[] = $pipes[$channel];
                }
            }
            if (!$status['running'] && !$read) break;
            $write = isset($pipes[0]) ? [$pipes[0]] : [];
            $except = null;
            if (!$read && !$write) { usleep(1000); continue; }
            if (@stream_select($read, $write, $except, 0, 10000) === false) continue;
            foreach ($write as $pipe) {
                $written = @fwrite($pipe, substr($body, $offset, 8192));
                if ($written === false) { fclose($pipes[0]); unset($pipes[0]); }
                else $offset += $written;
            }
            foreach ($read as $pipe) {
                $chunk = fread($pipe, 8192);
                if ($chunk === false) continue;
                if (isset($pipes[1]) && $pipe === $pipes[1]) $stdout .= $chunk;
                else $stderr .= $chunk;
                if (strlen($stdout) + strlen($stderr) > $outputLimit) { $stopped = 'output-limit'; break 2; }
            }
        }
        if ($stopped !== null) return $failure($stopped);
        $decoded = json_decode($stdout, true);
        if (!is_array($decoded)) return $failure('bridge-output-invalid', [['code' => 'xtend.compiler.tooling_bridge.output_invalid', 'severity' => 'error', 'message' => trim($stderr) ?: 'Tooling bridge did not return JSON.']]);
        $decoded['exitCode'] = $exitCode;
        return $decoded;
    } finally {
        if (is_resource($process)) {
            $status = proc_get_status($process);
            if ($status['running']) {
                proc_terminate($process);
                usleep(100000);
                $status = proc_get_status($process);
                if ($status['running']) proc_terminate($process, 9);
            }
            foreach ($pipes as $pipe) if (is_resource($pipe)) fclose($pipe);
            proc_close($process);
        }
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

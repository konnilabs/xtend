<?php
declare(strict_types=1);
require $argv[1] . '/xtendrmt/rmt-portable-render.php';
require $argv[1] . '/xtendrmt/rmt-php-ssr-adapter.php';
require $argv[1] . '/xtendrmt/rmt-page-data.php';
$json = stream_get_contents(STDIN);
$input = RmtPortableRender::decodeJson($json);
if (isset($input['props'])) $input['props'] = (array)json_decode($json,false,512,JSON_THROW_ON_ERROR)->props;
if (($input['operation'] ?? '') === 'wire') {
    $page = (array)json_decode($json, false, 512, JSON_THROW_ON_ERROR)->page;
    echo json_encode(\Ccslabs\XTend\Data\PageWire::encode($page), JSON_THROW_ON_ERROR);
} elseif (($input['operation'] ?? '') === 'head') {
    try { $head = \Ccslabs\XTend\Data\PageView::head($input['layout'] ?? [], $input['head']); echo json_encode(['ok'=>true,'head'=>$head,'html'=>\Ccslabs\XTend\Data\PageView::renderHead($head, 'nonce')],JSON_THROW_ON_ERROR); }
    catch (\Throwable) { echo '{"ok":false}'; }
} elseif (($input['operation'] ?? '') === 'providers') {
    $calls = []; $values = [];
    foreach ($input['records'] as $key => $record) {
        $resolve = function() use (&$calls, $key, $record) { $calls[] = $key; return $record['value']; };
        $values[$key] = match ($record['kind']) {
            'lazy' => \Ccslabs\XTend\Data\Prop::lazy($resolve),
            'defer' => \Ccslabs\XTend\Data\Prop::defer($resolve, $record['group']),
            'once' => \Ccslabs\XTend\Data\Prop::once($resolve, $record['options'] ?? []),
            'merge' => \Ccslabs\XTend\Data\Prop::merge($resolve, $record['options'] ?? []),
            default => $record['value'],
        };
    }
    $data = \Ccslabs\XTend\Data\Prop::resolveAll($values, [], $input['selection'] ?? []);
    echo json_encode(['data' => $data, 'calls' => $calls], JSON_THROW_ON_ERROR);
} elseif (($input['operation'] ?? '') === 'stream') {
    $options = $input['throw'] ?? false ? ['resolveDataSource' => fn() => throw new RuntimeException('private exception')] : [];
    $adapter = createRmtPhpSsrAdapter($options);
    $frames = []; foreach ($adapter->streamJsonl($input['core']) as $line) $frames[] = json_decode($line, true, 512, JSON_THROW_ON_ERROR);
    echo json_encode($frames, JSON_THROW_ON_ERROR);
} else {
    $projected = RmtPortableRender::project($input['artifact'], $input['props']);
    $result = createRmtPhpSsrAdapter()->render(['descriptor' => $projected['descriptor']], ['model' => $projected['model']]);
    echo json_encode(['projected' => $projected, 'result' => $result], JSON_THROW_ON_ERROR);
}

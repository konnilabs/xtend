<?php
declare(strict_types=1);
require $argv[1] . '/xtendrmt/rmt-portable-render.php';
require $argv[1] . '/xtendrmt/rmt-php-ssr-adapter.php';
require $argv[1] . '/xtendrmt/rmt-page-data.php';
use Ccslabs\XTend\Data\Prop;
$providerExecutions=['initial'=>0,'partial'=>0,'deferred'=>0];
foreach(['initial'=>[], 'partial'=>['only'=>['lazy']], 'deferred'=>['deferred'=>['later']]] as $name=>$selection) {
    $resolve=function() use (&$providerExecutions,$name) {$providerExecutions[$name]++;return 'Measured';};
    Prop::resolveAll(['eager'=>$resolve,'lazy'=>Prop::lazy($resolve),'later'=>Prop::defer($resolve,'later'),'once'=>Prop::once($resolve)], [], $selection);
}
$raw=stream_get_contents(STDIN);$input=RmtPortableRender::decodeJson($raw);
$props=(array)json_decode($raw,false,512,JSON_THROW_ON_ERROR)->props;
$timings=[];$adapter=createRmtPhpSsrAdapter();
for($i=0;$i<$input['iterations'];$i++) {
    $start=hrtime(true);$projected=RmtPortableRender::project($input['artifact'],$props);
    $result=$adapter->render(['descriptor'=>$projected['descriptor']],['model'=>$projected['model']]);
    if(!$result['ok'])throw new RuntimeException('PHP measurement render failed.');
    $timings[]=(hrtime(true)-$start)/1e6;
}
$sorted=$timings;sort($sorted);
echo json_encode(['runtime'=>PHP_VERSION,'providerExecutions'=>$providerExecutions,'coldRenderMs'=>$timings[0],'medianRenderMs'=>$sorted[(int)floor(count($sorted)/2)],'p95RenderMs'=>$sorted[(int)floor(count($sorted)*.95)],'peakMemoryBytes'=>memory_get_peak_usage(true),'htmlBytes'=>strlen($result['html'])],JSON_THROW_ON_ERROR);

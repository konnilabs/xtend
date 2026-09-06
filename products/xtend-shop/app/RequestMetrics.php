<?php
namespace App;

/** Optional acceptance measurements contain no request bodies, cookies or user data. */
final class RequestMetrics {
    public function handle($request, \Closure $next) {
        $started=hrtime(true);
        try { return $next($request); }
        finally {
            $file=getenv('XTEND_STORE_REQUEST_METRICS_FILE');
            if($file) {
                $kind=$request->isMethod('GET')?($request->header('X-XTend-Page')?'page-data':'ssr'):'mutation';
                file_put_contents($file,json_encode(['kind'=>$kind,'durationMs'=>(hrtime(true)-$started)/1000000,'peakMemoryBytes'=>memory_get_peak_usage(true)],JSON_THROW_ON_ERROR)."\n",FILE_APPEND|LOCK_EX);
            }
        }
    }
}

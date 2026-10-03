<?php
namespace Ccslabs\XTend\Commands;
final class Install extends \Illuminate\Console\Command {
    protected $signature = 'xtend:install';
    protected $description = 'Publish XTend configuration and describe the web middleware integration';
    public function handle(): int {
        $this->call('vendor:publish', ['--tag' => 'xtend-config']);
        $this->components->info('Append Ccslabs\\XTend\\HandleXTendRequests to your web middleware group. Build your RMT pages with xt pages build.');
        return self::SUCCESS;
    }
}

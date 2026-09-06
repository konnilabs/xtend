<?php
namespace Ccslabs\XTend\Commands;
final class Doctor extends \Illuminate\Console\Command {
    protected $signature = 'xtend:doctor';
    protected $description = 'Verify the PHP runtime and deployed XTend page manifest';
    public function handle(): int {
        try {
            $manifest = app(\Ccslabs\XTend\PageManager::class)->manifest();
            foreach ($manifest['pages'] as $name => $page) {
                if (($page['artifact']['schema'] ?? '') !== \RmtPortableRender::SCHEMA || !in_array('php', $page['artifact']['targets'] ?? [], true)) throw new \RuntimeException("Page $name does not support PHP rendering.");
            }
            $receipt = json_decode(file_get_contents(__DIR__ . '/../../runtime/sources.json'), true, 512, JSON_THROW_ON_ERROR);
            foreach ($receipt['files'] as $file => $hash) if (hash_file('sha256', __DIR__ . '/../../runtime/' . $file) !== $hash) throw new \RuntimeException("Packaged runtime drift: $file");
            $this->components->info('XTend PHP runtime and page manifest are ready.');
            return self::SUCCESS;
        } catch (\Throwable $error) { $this->components->error($error->getMessage()); return self::FAILURE; }
    }
}

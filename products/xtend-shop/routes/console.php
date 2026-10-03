<?php
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Ccslabs\XTend\ResumeSigner;
Artisan::command('shop:install', function () {
    app(\App\Domain\StoreDatabase::class)->install();ResumeSigner::generate(storage_path('resume.pem'));
    $this->info('XTend.store eingerichtet; bestehende Daten bleiben erhalten.');
});
Artisan::command('shop:reset {--force : Warenkörbe und Demo-Bestellungen ausdrücklich löschen}', function () {
    if(!$this->option('force')){ $this->error('Zum Zurücksetzen ausdrücklich --force angeben.');return 1; }
    DB::transaction(function(){foreach(['order_items','orders','payment_attempts','checkout_drafts','carts','sessions','variants','products'] as $table)DB::table($table)->delete();});
    app(\App\Domain\StoreDatabase::class)->install();$this->info('Demo-Daten zurückgesetzt.');
});
Artisan::command('shop:public-key', function () { $this->line(json_encode(app(ResumeSigner::class)->publicKey(),JSON_THROW_ON_ERROR)); });
Artisan::command('shop:build-config', function () { $this->line(json_encode(['publicKey'=>app(ResumeSigner::class)->publicKey(),'providerOrigin'=>config('shop.provider_origin')],JSON_THROW_ON_ERROR)); });

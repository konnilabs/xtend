<?php
namespace App\Domain;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
final class StoreDatabase {
    public function install(): void {
        $database=config('database.connections.sqlite.database');
        if ($database!==':memory:'&&!file_exists($database)) touch($database);
        if (!Schema::hasTable('sessions')) Schema::create('sessions', function(Blueprint $t) {
            $t->string('id')->primary(); $t->unsignedBigInteger('user_id')->nullable()->index(); $t->string('ip_address',45)->nullable();
            $t->text('user_agent')->nullable(); $t->longText('payload'); $t->integer('last_activity')->index();
        });
        if (!Schema::hasTable('carts')) Schema::create('carts', function(Blueprint $t) { $t->string('id')->primary(); $t->integer('version')->default(0); $t->text('items')->default('{}'); });
        if (!Schema::hasTable('products')) Schema::create('products', function(Blueprint $t) { $t->string('id')->primary(); $t->string('slug')->unique(); $t->string('category')->index(); $t->text('data'); });
        if (!Schema::hasTable('variants')) Schema::create('variants', function(Blueprint $t) { $t->string('sku')->primary(); $t->string('product_id')->index(); $t->string('label'); $t->integer('price'); $t->integer('stock'); $t->string('image'); });
        if (!Schema::hasTable('checkout_drafts')) Schema::create('checkout_drafts', function(Blueprint $t) { $t->string('cart_id')->primary(); $t->text('data'); $t->integer('updated_at'); });
        if (!Schema::hasTable('payment_attempts')) Schema::create('payment_attempts', function(Blueprint $t) {
            $t->string('id')->primary(); $t->string('cart_id')->index(); $t->integer('cart_version'); $t->integer('amount'); $t->string('currency');
            $t->string('status'); $t->string('scenario'); $t->text('checkout'); $t->integer('expires_at'); $t->string('order_id')->nullable();
        });
        if (!Schema::hasTable('orders')) Schema::create('orders', function(Blueprint $t) {
            $t->string('id')->primary(); $t->string('cart_id')->index(); $t->string('payment_id')->unique(); $t->text('address');
            $t->integer('subtotal'); $t->integer('shipping'); $t->integer('total'); $t->string('shipping_method'); $t->integer('created_at');
        });
        if (!Schema::hasTable('order_items')) Schema::create('order_items', function(Blueprint $t) {
            $t->id(); $t->string('order_id')->index(); $t->string('sku'); $t->string('name'); $t->integer('price'); $t->integer('quantity');
        });
        foreach (json_decode(file_get_contents(database_path('catalog.json')),true,512,JSON_THROW_ON_ERROR) as $p) {
            DB::table('products')->insertOrIgnore(['id'=>$p['id'],'slug'=>$p['slug'],'category'=>$p['category'],'data'=>json_encode($p,JSON_THROW_ON_ERROR)]);
            foreach ($p['variants'] as $v) DB::table('variants')->insertOrIgnore($v+['product_id'=>$p['id']]);
        }
    }
}

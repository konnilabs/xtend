<?php
use App\Cart;
use App\Domain\Checkout;
return [
 'shop.cart.add'=>['kind'=>'command','invoke'=>fn(array $i,array $c)=>app(Cart::class)->change($c['laravelRequest'],$i,'add')],
 'shop.cart.set'=>['kind'=>'command','invoke'=>fn(array $i,array $c)=>app(Cart::class)->change($c['laravelRequest'],$i,'set')],
 'shop.cart.clear'=>['kind'=>'command','invoke'=>fn(array $i,array $c)=>app(Cart::class)->change($c['laravelRequest'],$i,'clear')],
 'shop.checkout.save'=>['kind'=>'command','invoke'=>function(array $i,array $c){$draft=app(Checkout::class)->save($c['laravelRequest'],$i);return ['draft'=>$draft,'stage'=>($i['next']??'')==='review'?'review':'shipping','cart'=>app(Cart::class)->read($c['laravelRequest'],$draft['shipping'])];}],
 'shop.payment.attempt'=>['kind'=>'command','invoke'=>fn(array $i,array $c)=>app(Checkout::class)->attempt($c['laravelRequest'],$i)],
 'shop.payment.complete'=>['kind'=>'command','invoke'=>fn(array $i,array $c)=>app(Checkout::class)->complete($c['laravelRequest'],(string)($i['proof']??''))],
 'shop.payment.cancel'=>['kind'=>'command','invoke'=>fn(array $i,array $c)=>app(Checkout::class)->cancel($c['laravelRequest'],(string)($i['id']??''))],
];

<?php
namespace App\Domain;
use App\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use XtendStore\Payment\PaymentProof;
final class Checkout {
    public function draft(Request $r):array { $row=DB::table('checkout_drafts')->where('cart_id',app(Cart::class)->id($r))->first();return $row?json_decode($row->data,true,512,JSON_THROW_ON_ERROR):['email'=>'','name'=>'','street'=>'','postal'=>'','city'=>'','country'=>'DE','shipping'=>'standard']; }
    public function save(Request $r,array $input):array {
        $data=validator($input,['email'=>'required|email|max:180','name'=>'required|string|min:2|max:100','street'=>'required|string|min:3|max:150','postal'=>'required|regex:/^[0-9]{5}$/','city'=>'required|string|min:2|max:100','country'=>'required|in:DE','shipping'=>'required|in:standard,express'])->validate();
        DB::table('checkout_drafts')->updateOrInsert(['cart_id'=>app(Cart::class)->id($r)],['data'=>json_encode($data,JSON_THROW_ON_ERROR),'updated_at'=>time()]);return $data;
    }
    private function signer():PaymentProof{return new PaymentProof((string)config('shop.payment_secret'));}
    public function attempt(Request $r,array $input):array {
        $data=validator($input,['version'=>'required|integer|min:0','scenario'=>'required|in:success,declined,timeout'])->validate();
        return DB::transaction(function()use($r,$data){$draft=$this->save($r,$this->draft($r));$cart=app(Cart::class)->read($r,$draft['shipping']);
            abort_if($cart['empty'],422,'Dein Warenkorb ist leer.');abort_if($cart['version']!==(int)$data['version'],409,'Dein Warenkorb wurde geändert.');foreach($cart['lines'] as $line)abort_unless($line['available'],409,'Ein Artikel ist nicht mehr verfügbar.');
            $id=bin2hex(random_bytes(24));$expires=time()+config('shop.payment_ttl');
            DB::table('payment_attempts')->insert(['id'=>$id,'cart_id'=>app(Cart::class)->id($r),'cart_version'=>$cart['version'],'amount'=>$cart['total'],'currency'=>'EUR','status'=>'pending','scenario'=>$data['scenario'],'checkout'=>json_encode($draft,JSON_THROW_ON_ERROR),'expires_at'=>$expires]);
            $claims=['purpose'=>'authorize','id'=>$id,'amount'=>$cart['total'],'currency'=>'EUR','version'=>$cart['version'],'scenario'=>$data['scenario'],'expires'=>$expires];
            return ['id'=>$id,'capability'=>$this->signer()->sign($claims),'amountText'=>$cart['totalText'],'expires'=>$expires,'origin'=>config('shop.provider_origin')];
        },3);
    }
    public function cancel(Request $r,string $id):array {DB::table('payment_attempts')->where('id',$id)->where('cart_id',app(Cart::class)->id($r))->where('status','pending')->update(['status'=>'cancelled']);return ['cancelled'=>true];}
    public function complete(Request $r,string $proof):array {
        try{$claims=$this->signer()->verify($proof,'authorized');}catch(\Throwable){abort(422,'Der Zahlungsnachweis ist ungültig oder abgelaufen.');}
        return DB::transaction(function()use($r,$claims){$a=DB::table('payment_attempts')->where('id',$claims['id']??'')->where('cart_id',app(Cart::class)->id($r))->first();abort_unless($a,404);
            abort_unless(($claims['amount']??null)===$a->amount&&($claims['currency']??'')===$a->currency&&($claims['version']??null)===$a->cart_version,422,'Der Zahlungsnachweis gehört nicht zu dieser Bestellung.');
            if($a->status==='ordered')return ['id'=>$a->order_id,'url'=>'/bestellung/'.$a->order_id];
            abort_if($a->status!=='pending'||$a->expires_at<time()||$a->scenario!=='success',409,'Der Zahlungsversuch ist nicht mehr gültig.');
            $draft=json_decode($a->checkout,true,512,JSON_THROW_ON_ERROR);$cart=app(Cart::class)->read($r,$draft['shipping']);abort_if($cart['version']!==$a->cart_version||$cart['total']!==$a->amount,409,'Dein Warenkorb wurde geändert. Bitte starte die Zahlung neu.');
            $id='XT-'.strtoupper(bin2hex(random_bytes(6)));
            DB::table('orders')->insert(['id'=>$id,'cart_id'=>$a->cart_id,'payment_id'=>$a->id,'address'=>$a->checkout,'subtotal'=>$cart['subtotal'],'shipping'=>$cart['shipping'],'total'=>$cart['total'],'shipping_method'=>$draft['shipping'],'created_at'=>time()]);
            foreach($cart['lines'] as $line){$ok=DB::table('variants')->where('sku',$line['sku'])->where('stock','>=',$line['quantity'])->decrement('stock',$line['quantity']);abort_unless($ok,409,'Ein Artikel ist nicht mehr verfügbar.');DB::table('order_items')->insert(['order_id'=>$id,'sku'=>$line['sku'],'name'=>$line['name'],'price'=>$line['price'],'quantity'=>$line['quantity']]);}
            $ok=DB::table('carts')->where('id',$a->cart_id)->where('version',$a->cart_version)->update(['items'=>'{}','version'=>$a->cart_version+1]);abort_unless($ok,409);
            DB::table('payment_attempts')->where('id',$a->id)->where('status','pending')->update(['status'=>'ordered','order_id'=>$id]);
            DB::table('payment_attempts')->where('cart_id',$a->cart_id)->where('status','pending')->update(['status'=>'superseded']);
            DB::table('checkout_drafts')->where('cart_id',$a->cart_id)->delete();return ['id'=>$id,'url'=>'/bestellung/'.$id];
        },3);
    }
    public function order(Request $r,string $id):array{
        $row=DB::table('orders')->where('id',$id)->where('cart_id',app(Cart::class)->id($r))->first();abort_unless($row,404);
        $lines=DB::table('order_items')->where('order_id',$id)->get()->map(fn($l)=>(array)$l+['totalText'=>Catalog::money($l->price*$l->quantity)])->all();
        return ['id'=>$id,'totalText'=>Catalog::money($row->total),'lines'=>$lines,'shipping'=>$row->shipping_method,'date'=>date('d.m.Y',$row->created_at)];
    }
}

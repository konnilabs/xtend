<?php
namespace App;
use App\Domain\Catalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
final class Cart {
    public function id(Request $request): string {
        if (!$request->session()->has('cart_id')) $request->session()->put('cart_id',bin2hex(random_bytes(24)));
        $id=$request->session()->get('cart_id');DB::table('carts')->insertOrIgnore(['id'=>$id,'version'=>0,'items'=>'{}']);return $id;
    }
    public function read(Request $request, string $shipping = 'standard'): array {
        $row=DB::table('carts')->where('id',$this->id($request))->first();$items=json_decode($row->items,true,512,JSON_THROW_ON_ERROR);$lines=[];$subtotal=0;
        foreach($items as $sku=>$quantity){$v=app(Catalog::class)->variant($sku);$total=$v['price']*$quantity;$subtotal+=$total;$lines[]=$v+['quantity'=>$quantity,'priceText'=>Catalog::money($v['price']),'totalText'=>Catalog::money($total),'available'=>$v['stock']>=$quantity];}
        $fee=$subtotal===0?0:($shipping==='express'?config('shop.shipping.express'):($subtotal>=config('shop.shipping.free_from')?0:config('shop.shipping.standard')));
        return ['version'=>(int)$row->version,'items'=>(object)$items,'lines'=>$lines,'count'=>array_sum($items),'subtotal'=>$subtotal,'shipping'=>$fee,'total'=>$subtotal+$fee,
            'subtotalText'=>Catalog::money($subtotal),'shippingText'=>$fee?Catalog::money($fee):'Kostenlos','totalText'=>Catalog::money($subtotal+$fee),'empty'=>!$items];
    }
    public function change(Request $request,array $input,string $operation): array {
        $rules=['version'=>'required|integer|min:0'];if($operation!=='clear')$rules+=['sku'=>'required|string','quantity'=>'required|integer|min:0|max:20'];
        $data=validator($input,$rules)->validate();
        return DB::transaction(function()use($request,$data,$operation){$cart=$this->read($request);abort_if($cart['version']!==(int)$data['version'],409,'Der Warenkorb wurde in einem anderen Tab geändert. Bitte aktualisieren.');
            $items=(array)$cart['items'];if($operation==='clear')$items=[];else{$v=app(Catalog::class)->variant($data['sku']);$quantity=$operation==='add'?($items[$data['sku']]??0)+(int)$data['quantity']:(int)$data['quantity'];
                abort_if($quantity>$v['stock']||$quantity>20,422,'Diese Menge ist nicht verfügbar.');if($quantity)$items[$data['sku']]=$quantity;else unset($items[$data['sku']]);}
            $ok=DB::table('carts')->where('id',$this->id($request))->where('version',$cart['version'])->update(['items'=>json_encode((object)$items,JSON_THROW_ON_ERROR),'version'=>$cart['version']+1]);abort_unless($ok,409);
            return $this->read($request);
        },3);
    }
    public function add(Request $request,array $input):array{return $this->change($request,$input,'add');}
}

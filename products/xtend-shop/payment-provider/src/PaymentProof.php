<?php
namespace XtendStore\Payment;
/** Demo-only, short-lived capabilities shared by the two PHP hosts. */
final class PaymentProof {
    public function __construct(private string $secret) { if(strlen($secret)<32)throw new \RuntimeException('DemoPay requires a secret of at least 32 bytes.'); }
    private static function encode(string $s):string{return rtrim(strtr(base64_encode($s),'+/','-_'),'=');}
    public function sign(array $claims):string{$body=self::encode(json_encode($claims,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));return $body.'.'.self::encode(hash_hmac('sha256',$body,$this->secret,true));}
    public function verify(string $token,string $purpose):array{
        if(strlen($token)>8192)throw new \InvalidArgumentException('Invalid DemoPay capability.');
        $parts=explode('.',$token);if(count($parts)!==2||!hash_equals(self::encode(hash_hmac('sha256',$parts[0],$this->secret,true)),$parts[1]))throw new \InvalidArgumentException('Invalid DemoPay signature.');
        $claims=json_decode(base64_decode(strtr($parts[0],'-_','+/'),true),true,32,JSON_THROW_ON_ERROR);
        if(!is_array($claims)||($claims['purpose']??'')!==$purpose||!is_int($claims['expires']??null)||$claims['expires']<time()||$claims['expires']>time()+300)throw new \InvalidArgumentException('Expired or incompatible DemoPay capability.');return $claims;
    }
}

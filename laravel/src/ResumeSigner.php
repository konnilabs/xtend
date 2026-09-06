<?php
declare(strict_types=1);
namespace Ccslabs\XTend;

/** P-256 signatures interoperable with WebCrypto; the private key stays at the host. */
final class ResumeSigner {
    public function __construct(private string $privateKey, private string $keyId) {}
    public static function generate(string $path): void {
        if (file_exists($path)) return;
        $key = openssl_pkey_new(['private_key_type'=>OPENSSL_KEYTYPE_EC,'curve_name'=>'prime256v1']);
        if (!$key || !openssl_pkey_export($key, $pem)) throw new \RuntimeException('Unable to generate resume key.');
        $handle = fopen($path, 'x');
        if (!$handle) throw new \RuntimeException('Unable to create resume key.');
        chmod($path, 0600); fwrite($handle, $pem); fclose($handle);
    }
    public function publicKey(): array {
        $key = openssl_pkey_get_private($this->privateKey);
        $details = $key ? openssl_pkey_get_details($key) : false;
        if (!$details || ($details['ec']['curve_name'] ?? '') !== 'prime256v1') throw new \RuntimeException('Expected a P-256 signing key.');
        return ['kty'=>'EC','crv'=>'P-256','x'=>self::base64($details['ec']['x']),'y'=>self::base64($details['ec']['y']),'key_ops'=>['verify'],'ext'=>true,'kid'=>$this->keyId];
    }
    public function sign(string $canonical): array {
        if (!openssl_sign($canonical, $der, $this->privateKey, OPENSSL_ALGO_SHA256)) throw new \RuntimeException('Resume signing failed.');
        if (ord($der[0]) !== 48 || ord($der[1]) > 127) throw new \RuntimeException('Invalid P-256 signature.');
        $offset = 2; $raw = '';
        for ($i=0;$i<2;$i++) {
            if (ord($der[$offset++]) !== 2) throw new \RuntimeException('Invalid ECDSA integer.');
            $length = ord($der[$offset++]); $part = ltrim(substr($der,$offset,$length), "\0"); $offset += $length;
            if (strlen($part)>32) throw new \RuntimeException('Invalid ECDSA integer length.');
            $raw .= str_pad($part,32,"\0",STR_PAD_LEFT);
        }
        return ['algorithm'=>'ECDSA-P256-SHA256','keyId'=>$this->keyId,'signature'=>self::base64($raw)];
    }
    private static function base64(string $value): string { return rtrim(strtr(base64_encode($value),'+/','-_'),'='); }
}

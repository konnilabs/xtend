import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createTinyIdentityOnnxModel } from './tiny-onnx-identity.mjs';

const first = createTinyIdentityOnnxModel();
const second = createTinyIdentityOnnxModel();
assert.ok(first instanceof Uint8Array);
assert.ok(first.byteLength > 64 && first.byteLength < 1024);
assert.deepEqual(first, second);
assert.equal(
  crypto.createHash('sha256').update(first).digest('hex'),
  '8742408ab27df6b40d2dbb36d88f5a3765186a55eb80dc9f0de6fee11810b2d4'
);
assert.match(new TextDecoder().decode(first), /Identity/u);
assert.match(new TextDecoder().decode(first), /xtend_llm_identity_graph/u);

console.log('ok - Tiny ONNX Identity ModelProto encoder is deterministic and offline');

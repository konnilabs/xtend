const textEncoder = new TextEncoder();

function concatenate(parts) {
  const length = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function varint(value) {
  let remaining = BigInt(value);
  if (remaining < 0n) throw new RangeError('Tiny ONNX protobuf varints must be non-negative.');
  const bytes = [];
  do {
    let byte = Number(remaining & 0x7fn);
    remaining >>= 7n;
    if (remaining !== 0n) byte |= 0x80;
    bytes.push(byte);
  } while (remaining !== 0n);
  return Uint8Array.from(bytes);
}

function key(fieldNumber, wireType) {
  return varint((BigInt(fieldNumber) << 3n) | BigInt(wireType));
}

function integerField(fieldNumber, value) {
  return concatenate([key(fieldNumber, 0), varint(value)]);
}

function bytesField(fieldNumber, value) {
  const bytes = value instanceof Uint8Array ? value : Uint8Array.from(value);
  return concatenate([key(fieldNumber, 2), varint(bytes.byteLength), bytes]);
}

function stringField(fieldNumber, value) {
  return bytesField(fieldNumber, textEncoder.encode(String(value)));
}

function tensorValueInfo(name) {
  const dimension = integerField(1, 1);
  const shape = bytesField(1, dimension);
  const tensorType = concatenate([
    integerField(1, 1), // TensorProto.FLOAT
    bytesField(2, shape)
  ]);
  const type = bytesField(1, tensorType);
  return concatenate([
    stringField(1, name),
    bytesField(2, type)
  ]);
}

export function createTinyIdentityOnnxModel() {
  const identityNode = concatenate([
    stringField(1, 'X'),
    stringField(2, 'Y'),
    stringField(3, 'identity'),
    stringField(4, 'Identity')
  ]);
  const graph = concatenate([
    bytesField(1, identityNode),
    stringField(2, 'xtend_llm_identity_graph'),
    bytesField(11, tensorValueInfo('X')),
    bytesField(12, tensorValueInfo('Y'))
  ]);
  const opset = integerField(2, 13);
  return concatenate([
    integerField(1, 8), // ONNX IR version 8
    stringField(2, 'xtend-llm-n26'),
    bytesField(7, graph),
    bytesField(8, opset)
  ]);
}

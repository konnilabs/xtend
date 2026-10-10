'use strict';
const {createLegacyScanner}=require('./engine.cjs');
exports.createScanner=options=>{const api=createLegacyScanner(options);return Object.freeze(Object.fromEntries(['scanSchemaInventory','validateInventoryDocument','authoritativeFingerprintSetHash','auditDuplicateCandidates','parseSchemaVersion','stableStringify'].map(key=>[key,api[key]])));};
Object.assign(exports,require('./ownership.cjs'));

exports.createSourceProvider=require('./source-provider.cjs').createSourceProvider;

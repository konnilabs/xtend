#!/usr/bin/env node
'use strict';
const scanner=require('../tools/schema-inventory/engine.cjs').createLegacyScanner({typescript:require('typescript'),defaultRootDir:require('node:path').resolve(__dirname,'..')});
if(require.main===module)scanner.main();
module.exports=scanner;

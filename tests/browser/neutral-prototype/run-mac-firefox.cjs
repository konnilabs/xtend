'use strict';
if(process.platform!=='darwin')throw Error('This entry point is macOS only');
require('./run-firefox.cjs').main().catch(error=>{console.error(error);process.exitCode=1;});


    if (
        __XTENDRMT_GLOBAL__.AppModules
        && typeof __XTENDRMT_GLOBAL__.AppModules.installRmtProductSurface === 'function'
    ) {
        __XTENDRMT_GLOBAL__.AppModules.installRmtProductSurface({
            windowTarget: __XTENDRMT_GLOBAL__,
            globalName: "xtend.rmt",
            replace: true
        });
    }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

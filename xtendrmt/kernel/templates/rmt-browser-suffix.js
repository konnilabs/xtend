
    const __XTENDRMT_BROWSER_FACTORIES__ = Object.freeze({ ...__XTENDRMT_GLOBAL__.AppModules });
    const __XTENDRMT_BROWSER_NAMESPACE__ = Object.freeze({
        version: typeof __XTENDRMT_BROWSER_FACTORIES__.getRmtApiVersion === 'function'
            ? __XTENDRMT_BROWSER_FACTORIES__.getRmtApiVersion()
            : "{{KERNEL_VERSION}}",
        ...__XTENDRMT_BROWSER_FACTORIES__
    });
    __XTENDRMT_PUBLIC_GLOBAL__.XTendRMT = __XTENDRMT_BROWSER_NAMESPACE__;
    __XTENDRMT_PUBLIC_GLOBAL__["xtend.rmt"] = __XTENDRMT_BROWSER_NAMESPACE__;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

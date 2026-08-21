# XTend Browser Hypervisor

The Browser Hypervisor is XTend's dependency-free W3C WebDriver boundary. Test consumers declare an engine, fixture, result key and evidence contract. Driver discovery, local process lifecycle, remote endpoints, browser capabilities, screenshots and cleanup remain inside the Hypervisor.

Supported adapters are Chromium/ChromeDriver, Firefox/GeckoDriver, WebKit/SafariDriver, Edge/EdgeDriver and a caller-provided remote WebDriver endpoint. A missing or broken adapter is an infrastructure failure. It must never be converted into browser support evidence or an owned residual.

Evidence uses `xtend.browser-hypervisor-evidence.v1`. Cross-engine matrices use `xtend.browser-hypervisor-evidence-matrix.v1` and bind all results to one run ID and one harness SHA-256.

(function () {
  class XRmtLifecycleDemoBuild extends HTMLElement {
    static get observedAttributes() {
      return ['variant', 'aria-label'];
    }

    static get xtendScaffoldWiring() {
      return {
        schema: 'xtend.scaffold.feature-wiring.v1',
        statePrefix: 'xtend.component.x-rmt-lifecycle-demo-build.<id>.',
        stateKeys: ["xtend.component.x-rmt-lifecycle-demo-build.<id>.ready", "xtend.component.x-rmt-lifecycle-demo-build.<id>.value"],
        events: ["rmt-lifecycle-demo-build-ready", "rmt-lifecycle-demo-build-changed"],
        apiNamespaces: ["window.XTend.components['x-rmt-lifecycle-demo-build']"],
        localUiPolicy: 'derived-render-cache-only'
      };
    }

    static get xtendScaffoldExtensionPoints() {
      return {
      "schema": "xtend.scaffold.component-extension-points.v1",
      "status": "prepared-extension-points-only",
      "rootLifecycle": {
            "schema": "xtend.scaffold.root-lifecycle.v1",
            "contractVersion": "xtend.rmt.root-handshake.v1",
            "rootRef": "rmt-lifecycle-demo-build.root.<id>",
            "componentRef": "rmt-lifecycle-demo-build.<id>",
            "templateRef": "rmt-lifecycle-demo-build.template",
            "host": "custom-element",
            "stateAttribute": "data-xtend-hydrated",
            "hooks": [
                  {
                        "name": "beforeHydrate",
                        "phase": "pre-hydration",
                        "defaultBehavior": "no-op",
                        "required": false
                  },
                  {
                        "name": "afterHydrate",
                        "phase": "post-hydration",
                        "defaultBehavior": "no-op",
                        "required": false
                  },
                  {
                        "name": "beforeRender",
                        "phase": "pre-render",
                        "defaultBehavior": "no-op",
                        "required": false
                  },
                  {
                        "name": "afterRender",
                        "phase": "post-render",
                        "defaultBehavior": "no-op",
                        "required": false
                  },
                  {
                        "name": "onDisconnect",
                        "phase": "disconnect-cleanup",
                        "defaultBehavior": "no-op",
                        "required": false
                  }
            ],
            "phaseSequence": [
                  "create",
                  "mount",
                  "hydrate",
                  "activate",
                  "update",
                  "unmount",
                  "diagnostics"
            ],
            "schedulerEndpointHints": [
                  {
                        "phase": "create",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.root.create",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "mount",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.mount",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "hydrate",
                        "schedule": "component.idle.hydrate",
                        "endpointName": "xtendrmt.component.hydrate",
                        "lane": "idle",
                        "preferIdle": true,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "activate",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.activate",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "update",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.update",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "unmount",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.unmount",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "diagnostics",
                        "schedule": "diagnostics.snapshot",
                        "endpointName": "xtendrmt.diagnostics.snapshot",
                        "lane": "diagnostics",
                        "preferIdle": true,
                        "owner": "xtend-host-adapter"
                  }
            ],
            "handoff": {
                  "planner": "rmt-scheduler",
                  "executor": "xtend-host-adapter",
                  "jobContext": [
                        "rootRef",
                        "componentRef",
                        "templateRef",
                        "phase",
                        "schedule",
                        "endpointName"
                  ],
                  "completionSignal": "xtend.rmt.root.lifecycle.completed",
                  "diagnosticsSignal": "xtend.rmt.root.lifecycle.diagnostics"
            },
            "stateKeys": {
                  "lifecycle": "xtend.component.x-rmt-lifecycle-demo-build.<id>.lifecycle",
                  "hydration": "xtend.component.x-rmt-lifecycle-demo-build.<id>.hydration",
                  "diagnostics": "xtend.component.x-rmt-lifecycle-demo-build.<id>.diagnostics"
            },
            "statePolicy": "digital-twin-ssot-classic-state",
            "sequence": [
                  "constructor",
                  "connectedCallback",
                  "beforeHydrate",
                  "hydrate",
                  "afterHydrate",
                  "beforeRender",
                  "render",
                  "afterRender",
                  "disconnectedCallback",
                  "onDisconnect"
            ],
            "stateBoundary": "hooks-may-read-derived-state-but-must-not-create-ssot",
            "schedulerBoundary": "rmt-schedules-host-work-via-endpoint-hints-only",
            "cleanupBoundary": "onDisconnect-cleans-local-subscriptions-only"
      },
      "templating": {
            "schema": "xtend.scaffold.template-extension.v1",
            "contractVersion": "xtend.rmt.template-authoring.v1",
            "adapter": "xtend.template",
            "templateRef": "rmt-lifecycle-demo-build.template",
            "componentRef": "rmt-lifecycle-demo-build.<id>",
            "allowedModes": [
                  "html_fragment",
                  "dom_descriptor"
            ],
            "slotBindingMode": "named-slot-to-template-ref",
            "eventBindingMode": "dom-event-to-rmt-command",
            "dataBindingMode": "explicit-props-attributes-and-slots-only",
            "hydrationMode": "runtime_render",
            "ownershipMode": "managed_subtree",
            "authoringBoundary": "no-template-runtime-in-scaffold",
            "kernelBoundary": "RMT templates contain XTend references as data; the kernel must not parse XTend component internals.",
            "compositionModel": {
                  "root": "RmtTemplateRootRef | RmtComponentRef | RmtDomFragment",
                  "componentRefs": "Record<string, RmtComponentRef>",
                  "props": "Record<string, unknown>",
                  "attributes": "Record<string, string | boolean | number | null>",
                  "slots": "Record<string, RmtTemplateRef | RmtTextRef | RmtComponentRef>",
                  "events": "Record<string, RmtCommandRef | RmtRootEventRef>"
            },
            "upstreamDslNeeds": [
                  "native top-level components domain",
                  "component_ref node shorthand",
                  "named slot children syntax",
                  "event command shorthand",
                  "authoring diagnostics"
            ],
            "supportedDomains": [
                  "templates",
                  "data",
                  "actions"
            ],
            "futureEpic": "development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md"
      },
      "rendering": {
            "schema": "xtend.scaffold.rendering-extension.v1",
            "mode": "custom-element-render-method",
            "renderTarget": "shadowRoot",
            "activation": "visible-ui-after-hydration",
            "scheduleHint": "component.visible.mount",
            "schedulerPolicyRef": "component.visible.mount",
            "delegationBoundary": "render-method-stays-local-until-Epic-04-runtime-decision",
            "hostBoundary": "framework-agnostic-host-adapter-contract"
      },
      "schedulerHandshake": {
            "contractVersion": "xtend.rmt.root-handshake.v1",
            "planner": "rmt-scheduler",
            "executor": "xtend-host-adapter",
            "scheduleRef": "component.visible.mount",
            "endpointHints": [
                  {
                        "phase": "create",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.root.create",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "mount",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.mount",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "hydrate",
                        "schedule": "component.idle.hydrate",
                        "endpointName": "xtendrmt.component.hydrate",
                        "lane": "idle",
                        "preferIdle": true,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "activate",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.activate",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "update",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.update",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "unmount",
                        "schedule": "component.visible.mount",
                        "endpointName": "xtendrmt.component.unmount",
                        "lane": "visible",
                        "preferIdle": false,
                        "owner": "xtend-host-adapter"
                  },
                  {
                        "phase": "diagnostics",
                        "schedule": "diagnostics.snapshot",
                        "endpointName": "xtendrmt.diagnostics.snapshot",
                        "lane": "diagnostics",
                        "preferIdle": true,
                        "owner": "xtend-host-adapter"
                  }
            ],
            "visibleActivation": "afterHydrate-afterRender-route-visible-render",
            "statePolicy": "digital-twin-ssot-classic-state",
            "diagnosticsRef": "xtend.component.x-rmt-lifecycle-demo-build.<id>.diagnostics",
            "boundaries": {
                  "schedulerOwns": [
                        "schedule-selection",
                        "lane",
                        "priority",
                        "budget",
                        "coalescing"
                  ],
                  "hostAdapterOwns": [
                        "root-resolution",
                        "custom-element-lifecycle",
                        "template-materialization",
                        "state-bridge",
                        "cleanup",
                        "diagnostics"
                  ],
                  "forbidden": [
                        "direct-classic-state-mutation-by-kernel",
                        "custom-element-callbacks-in-kernel",
                        "async-state-workarounds"
                  ]
            }
      },
      "hostCapabilities": {
            "contractVersion": "xtend.rmt.host-capabilities.v1",
            "adapterId": "xtend",
            "adapterKind": "host_adapter",
            "requiredCapabilities": [
                  "manifest",
                  "customElements",
                  "stateBridge",
                  "hydration",
                  "schedulerEndpoints"
            ],
            "optionalCapabilities": [
                  "theme",
                  "api",
                  "router",
                  "diagnostics"
            ],
            "capabilities": {
                  "manifest": {
                        "id": "xtend.manifest",
                        "source": "components/manifest.json",
                        "lookupBy": [
                              "tag",
                              "id"
                        ],
                        "loaderCompatibleWith": [
                              "xtend-loader.js",
                              "api.js",
                              "customElements.define"
                        ],
                        "localImportOnly": true,
                        "cdnAllowedByDefault": false,
                        "kernelVisible": false
                  },
                  "customElements": {
                        "id": "xtend.custom-elements",
                        "kind": "web-component-host",
                        "registration": "customElements.define",
                        "readiness": [
                              "customElements.get",
                              "customElements.whenDefined"
                        ],
                        "lifecycleCallbacks": [
                              "connectedCallback",
                              "attributeChangedCallback",
                              "disconnectedCallback"
                        ],
                        "kernelVisible": false
                  },
                  "stateBridge": {
                        "id": "xtend.state-projection.classic",
                        "source": "xtend-state",
                        "read": "xtend-state.get(key)",
                        "write": "xtend-state.set(key, value)",
                        "subscribe": "xtend-state.subscribe(fn, keyFilter?)",
                        "canonicalPrefix": "xtend.component.x-rmt-lifecycle-demo-build.<id>.",
                        "stateKeys": [
                              "xtend.component.x-rmt-lifecycle-demo-build.<id>.ready",
                              "xtend.component.x-rmt-lifecycle-demo-build.<id>.value"
                        ],
                        "localUiPolicy": "derived-render-cache-only",
                        "forbidden": [
                              "direct-classic-state-mutation-by-kernel",
                              "xtend-state.on",
                              "xtend-state.off"
                        ],
                        "kernelVisible": false
                  },
                  "hydration": {
                        "id": "xtend.hydration",
                        "mode": "custom-element",
                        "ownershipMode": "managed_subtree",
                        "stateAttribute": "data-xtend-hydrated",
                        "minimumMethods": [
                              "hydrate",
                              "render"
                        ],
                        "lifecycleCallbacks": [
                              "connectedCallback",
                              "attributeChangedCallback",
                              "disconnectedCallback"
                        ],
                        "schedulerEndpoint": "xtendrmt.component.hydrate",
                        "kernelVisible": false
                  },
                  "schedulerEndpoints": {
                        "id": "xtend.scheduler-endpoints",
                        "owner": "xtend-host-adapter",
                        "endpoints": [
                              "xtendrmt.root.create",
                              "xtendrmt.component.mount",
                              "xtendrmt.component.hydrate",
                              "xtendrmt.component.update",
                              "xtendrmt.component.unmount",
                              "xtendrmt.route.render",
                              "xtendrmt.diagnostics.snapshot"
                        ],
                        "endpointHintsOnly": true,
                        "kernelVisible": false
                  },
                  "theme": {
                        "id": "xtend.theme",
                        "optional": true,
                        "namespace": "window.XTend.theme",
                        "legacyFacade": "window.XTheme",
                        "stateKeys": [
                              "xtend.theme.current",
                              "xtend.theme.available"
                        ],
                        "cssCustomProperties": true,
                        "kernelVisible": false
                  },
                  "api": {
                        "id": "xtend.api",
                        "optional": true,
                        "namespaceRoot": "window.XTend",
                        "namespaces": [
                              "window.XTend.components['x-rmt-lifecycle-demo-build']"
                        ],
                        "complianceNamespace": "window.XTend.compliance",
                        "forbiddenGlobals": [
                              "unnamespaced-show-helper-pattern"
                        ],
                        "kernelVisible": false
                  },
                  "router": {
                        "id": "xtend.xrouter",
                        "optional": true,
                        "enabledByProfile": false,
                        "routeRecordAdapter": "xtend.xrouter",
                        "routeFields": [
                              "id",
                              "path",
                              "title",
                              "component",
                              "template",
                              "schedule",
                              "metadata"
                        ],
                        "stateKeys": [
                              "xtend.router.lastNavigated",
                              "xtend.router.current",
                              "xtend.router.lastRendered"
                        ],
                        "productiveBridge": "reserved-for-Epic-05",
                        "kernelVisible": false
                  },
                  "diagnostics": {
                        "id": "xtend.diagnostics",
                        "optional": true,
                        "stateSnapshotKey": "xtend.component.x-rmt-lifecycle-demo-build.<id>.diagnostics",
                        "eventNamespace": "xtend.rmt.host.rmt-lifecycle-demo-build",
                        "reportToRmt": true,
                        "errorBoundary": "host-adapter-reports-errors-without-changing-ui-truth",
                        "kernelVisible": false
                  }
            },
            "negotiation": {
                  "documentMayRequire": [
                        "manifest",
                        "customElements",
                        "stateBridge",
                        "hydration"
                  ],
                  "documentMayPrefer": [
                        "theme",
                        "api",
                        "router",
                        "diagnostics"
                  ],
                  "missingRequiredCapability": "diagnostic-fail-fast-before-mount",
                  "missingOptionalCapability": "degrade-or-skip-with-diagnostics",
                  "capabilityRecordBoundary": "RMT documents may reference capability IDs and versions only."
            },
            "boundaries": {
                  "kernelSees": [
                        "adapterId",
                        "contractVersion",
                        "requiredCapabilities",
                        "optionalCapabilities",
                        "capabilityRefs"
                  ],
                  "hostAdapterOwns": [
                        "manifest-lookup",
                        "custom-element-registration",
                        "classic-state-read-write-subscribe",
                        "theme-api",
                        "xtend-api",
                        "hydration",
                        "router-adapter",
                        "diagnostics"
                  ],
                  "forbidden": [
                        "kernel-imports-api-js",
                        "kernel-imports-classic-state",
                        "kernel-imports-xrouter",
                        "kernel-calls-window-XTend",
                        "capability-as-second-ssot"
                  ]
            },
            "kernelBoundary": "RMT kernel negotiates capability data only; XTend Host Adapter executes manifest, state, theme, API, hydration, router and diagnostics work."
      },
      "rmtCompatibilityBinding": {
            "schema": "xtend.scaffold.rmt-compatibility-binding.v1",
            "status": "extension-bound-to-rmt-compatibility",
            "contractRefs": {
                  "component": "xtend.rmt.component-contract.v1",
                  "templateAuthoring": "xtend.rmt.template-authoring.v1",
                  "rootHandshake": "xtend.rmt.root-handshake.v1",
                  "hostCapabilities": "xtend.rmt.host-capabilities.v1"
            },
            "adapterRefs": {
                  "component": "xtend.component",
                  "template": "xtend.template",
                  "router": "xtend.xrouter",
                  "host": "xtend"
            },
            "artifactBinding": {
                  "typing": "components/x-rmt-lifecycle-demo-build.d.ts",
                  "manifest": "components/manifest.json",
                  "preview": "docs/previews/rmt-lifecycle-demo-build.preview.md",
                  "extensions": "static-getter:xtendScaffoldExtensionPoints"
            },
            "dryRunSurfaces": [
                  "typing",
                  "manifest-plan",
                  "preview-plan",
                  "extension-points",
                  "component-files"
            ],
            "manifestPlanRequirements": {
                  "includeRmtAttachment": true,
                  "includeHostCapabilities": true,
                  "includeSchedulerHandshake": true,
                  "includePreviewReference": true,
                  "localImportOnly": true,
                  "cdnAllowed": false
            },
            "previewPlan": {
                  "schema": "xtend.scaffold.rmt-compatibility-binding.v1",
                  "previewRef": "docs/previews/rmt-lifecycle-demo-build.preview.md",
                  "localOnly": true,
                  "bridgeBoundary": "reserved-for-Epic-05"
            },
            "extensionPlanRequirements": {
                  "includeTemplateAuthoring": true,
                  "includeSchedulerHandshake": true,
                  "includeHostCapabilities": true,
                  "noRuntimeImports": true,
                  "noProductiveWrites": true
            },
            "verification": {
                  "minimumGate": "node scripts/run_xtend_tests.js rmt-compatibility --json",
                  "fullGate": "npm test",
                  "requiredSuites": [
                        "rmt-compatibility",
                        "references"
                  ],
                  "handoffSuites": [
                        "components",
                        "a11y-hydration",
                        "references",
                        "rmt-compatibility"
                  ]
            },
            "boundaries": {
                  "typesOnly": true,
                  "noRuntimeImports": true,
                  "noProductiveWrites": true,
                  "noRmtKernelCoupling": true,
                  "noRouterRegistration": true,
                  "noTemplateParsing": true,
                  "bridgeRuntime": "reserved-for-Epic-05"
            }
      },
      "rmtBridge": {
            "status": "bridge-contract-only",
            "componentAdapter": "xtend.component",
            "routerAdapter": "xtend.xrouter",
            "routeFields": [
                  "id",
                  "path",
                  "title",
                  "component",
                  "template",
                  "schedule",
                  "metadata"
            ],
            "kernelBoundary": "RMT kernel must not import XTend component types, XTend manifest records, Classic state keys or XRouter classes directly.",
            "bridgeEpic": "development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md"
      },
      "integration": {
            "sourceStaticGetter": "xtendScaffoldExtensionPoints",
            "manifestKey": "extensions",
            "typingSchema": "xtend.scaffold.component-typing.v1",
            "previewSchema": "xtend.scaffold.component-preview.v1",
            "stateSignals": [
                  "xtend.component.x-rmt-lifecycle-demo-build.<id>.ready",
                  "xtend.component.x-rmt-lifecycle-demo-build.<id>.value"
            ],
            "eventSignals": [
                  "rmt-lifecycle-demo-build-ready",
                  "rmt-lifecycle-demo-build-changed"
            ]
      },
      "boundaries": {
            "noRuntimeImports": true,
            "noProductiveWrites": true,
            "noRmtKernelCoupling": true,
            "noRouterRegistration": true,
            "noTemplateParsing": true,
            "outOfScope": [
                  "rendering-runtime",
                  "rmt-bridge-runtime",
                  "route-registration-runtime",
                  "template-parser-runtime"
            ]
      }
};
    }

    static get xtendScaffoldA11yProfile() {
      return {
      "schema": "xtend.a11y.profile.v1",
      "planSchema": "xtend.scaffold.a11y-profile-plan.v1",
      "componentContract": "xtend.a11y.component-contract.v1",
      "testContract": "xtend.a11y.test-contract.v1",
      "status": "scaffold-a11y-required",
      "mode": "dry-run-a11y-profile",
      "componentRef": "x-rmt-lifecycle-demo-build",
      "name": "rmt-lifecycle-demo-build",
      "profiles": [
            "display",
            "stateful"
      ],
      "primaryProfile": "stateful",
      "role": "region",
      "accessibleName": {
            "source": "aria-label",
            "required": true,
            "defaultText": "XRmtLifecycleDemoBuild component",
            "fallbackAttribute": "aria-label"
      },
      "focusStrategy": {
            "mode": "stable-host",
            "initial": "none",
            "trap": false,
            "restore": false,
            "focusVisible": "required"
      },
      "keyboard": [
            "Tab"
      ],
      "ariaStates": [
            "aria-label",
            "aria-busy"
      ],
      "screenreader": {
            "contract": "xtend.a11y.screenreader-signals.v1",
            "signalRecordContract": "xtend.a11y.screenreader-signal.v1",
            "liveRegion": "polite",
            "signals": [
                  "semantic-region",
                  "state-change-summary"
            ],
            "signalContract": {
                  "schema": "xtend.a11y.screenreader-signals.v1",
                  "status": "accepted-contract",
                  "componentRef": "x-rmt-lifecycle-demo-build",
                  "profileRef": "stateful",
                  "liveRegion": "polite",
                  "signals": [
                        {
                              "schema": "xtend.a11y.screenreader-signal.v1",
                              "contract": "xtend.a11y.screenreader-signals.v1",
                              "componentRef": "x-rmt-lifecycle-demo-build",
                              "signal": "semantic-region",
                              "kind": "semantic",
                              "region": "semantic",
                              "role": "region",
                              "liveRegion": "none",
                              "politeness": "off",
                              "required": true,
                              "announcement": {
                                    "mode": "focus-or-semantic-context",
                                    "source": "component-state",
                                    "textRequired": false,
                                    "emptyStringAllowed": false,
                                    "duplicateSuppression": "same-signal-and-text"
                              },
                              "aria": {
                                    "live": null,
                                    "atomic": null,
                                    "role": "region"
                              },
                              "fabric": {
                                    "lane": "a11y",
                                    "fiberKind": "a11y.announce",
                                    "scheduleRef": "a11y.user-blocking.announce",
                                    "scheduleContract": "xtend.fabric.rmt-lane-mapping.v1",
                                    "boundary": "fabric-adapter-schedules-announcement-rmt-kernel-remains-framework-agnostic"
                              },
                              "assertions": [
                                    "role-or-native-semantics",
                                    "accessible-name"
                              ]
                        },
                        {
                              "schema": "xtend.a11y.screenreader-signal.v1",
                              "contract": "xtend.a11y.screenreader-signals.v1",
                              "componentRef": "x-rmt-lifecycle-demo-build",
                              "signal": "state-change-summary",
                              "kind": "state",
                              "region": "status",
                              "role": "status",
                              "liveRegion": "polite",
                              "politeness": "polite",
                              "required": true,
                              "announcement": {
                                    "mode": "live-region-text",
                                    "source": "component-state",
                                    "textRequired": true,
                                    "emptyStringAllowed": false,
                                    "duplicateSuppression": "same-signal-and-text"
                              },
                              "aria": {
                                    "live": "polite",
                                    "atomic": true,
                                    "role": "status"
                              },
                              "fabric": {
                                    "lane": "a11y",
                                    "fiberKind": "a11y.announce",
                                    "scheduleRef": "a11y.user-blocking.announce",
                                    "scheduleContract": "xtend.fabric.rmt-lane-mapping.v1",
                                    "boundary": "fabric-adapter-schedules-announcement-rmt-kernel-remains-framework-agnostic"
                              },
                              "assertions": [
                                    "state-change-summary",
                                    "aria-busy-consistency"
                              ]
                        }
                  ],
                  "statusRegions": [
                        {
                              "id": "x-rmt-lifecycle-demo-build.state-change-summary.status-region",
                              "sourceSignal": "state-change-summary",
                              "kind": "status",
                              "role": "status",
                              "ariaLive": "polite",
                              "ariaAtomic": true,
                              "required": true
                        }
                  ],
                  "errorRegions": [],
                  "announcementPolicy": {
                        "required": true,
                        "noSilentStateChanges": true,
                        "emptyAnnouncementsRefused": true,
                        "duplicateSuppression": "same-signal-and-text",
                        "defaultLiveRegion": "polite"
                  },
                  "fabric": {
                        "lane": "a11y",
                        "fiberKind": "a11y.announce",
                        "scheduleRef": "a11y.user-blocking.announce",
                        "scheduleContract": "xtend.fabric.rmt-lane-mapping.v1",
                        "boundary": "fabric-adapter-schedules-announcement-rmt-kernel-remains-framework-agnostic"
                  },
                  "testRefs": [
                        "a11y-hydration",
                        "screenreader-signals",
                        "references"
                  ],
                  "requiredAssertions": [
                        "screenreader-signal-contract",
                        "aria-live-policy",
                        "status-region-policy",
                        "announcement-policy",
                        "fabric-a11y-lane"
                  ]
            },
            "statusRegions": [
                  {
                        "id": "x-rmt-lifecycle-demo-build.state-change-summary.status-region",
                        "sourceSignal": "state-change-summary",
                        "kind": "status",
                        "role": "status",
                        "ariaLive": "polite",
                        "ariaAtomic": true,
                        "required": true
                  }
            ],
            "errorRegions": [],
            "fabric": {
                  "lane": "a11y",
                  "fiberKind": "a11y.announce",
                  "scheduleRef": "a11y.user-blocking.announce",
                  "scheduleContract": "xtend.fabric.rmt-lane-mapping.v1",
                  "boundary": "fabric-adapter-schedules-announcement-rmt-kernel-remains-framework-agnostic"
            },
            "announcementRequired": true
      },
      "motion": {
            "contract": "xtend.a11y.motion-policy.v1",
            "reducedMotion": "required",
            "mediaQuery": "(prefers-reduced-motion: reduce)",
            "animationPolicy": "state-change-without-motion-only-feedback",
            "noMotionOnlyState": true,
            "requiredCss": [
                  "@media (prefers-reduced-motion: reduce)",
                  "animation: none",
                  "transition: none"
            ]
      },
      "contrast": {
            "contract": "xtend.a11y.contrast-policy.v1",
            "highContrast": "required",
            "mediaQuery": "(forced-colors: active)",
            "contrastPolicy": "non-color-state-and-focus",
            "forcedColorAdjust": "auto",
            "focusVisible": "required",
            "nonColorStatus": "required",
            "tokenAware": true,
            "systemColorTokens": {
                  "text": "CanvasText",
                  "surface": "Canvas",
                  "border": "CanvasText",
                  "focus": "Highlight",
                  "focusText": "HighlightText",
                  "status": "CanvasText",
                  "error": "Mark",
                  "errorText": "MarkText"
            },
            "requiredCss": [
                  "@media (forced-colors: active)",
                  "forced-color-adjust",
                  "CanvasText",
                  "Highlight"
            ]
      },
      "motionContrast": {
            "contract": "xtend.a11y.motion-contrast-policy.v1",
            "testContract": "xtend.a11y.motion-contrast-test.v1",
            "policy": {
                  "schema": "xtend.a11y.motion-contrast-policy.v1",
                  "componentRef": "x-rmt-lifecycle-demo-build",
                  "primaryProfile": "stateful",
                  "motion": {
                        "schema": "xtend.a11y.motion-policy.v1",
                        "reducedMotion": "required",
                        "mediaQuery": "(prefers-reduced-motion: reduce)",
                        "animationPolicy": "state-change-without-motion-only-feedback",
                        "disableAnimations": true,
                        "disableTransitions": true,
                        "noMotionOnlyState": true,
                        "allowedAnimatedProperties": [
                              "opacity",
                              "transform"
                        ],
                        "requiredCss": [
                              "@media (prefers-reduced-motion: reduce)",
                              "animation: none",
                              "transition: none"
                        ]
                  },
                  "contrast": {
                        "schema": "xtend.a11y.contrast-policy.v1",
                        "highContrast": "required",
                        "mediaQuery": "(forced-colors: active)",
                        "contrastPolicy": "non-color-state-and-focus",
                        "forcedColorAdjust": "auto",
                        "focusVisible": "required",
                        "nonColorStatus": "required",
                        "tokenAware": true,
                        "systemColorTokens": {
                              "text": "CanvasText",
                              "surface": "Canvas",
                              "border": "CanvasText",
                              "focus": "Highlight",
                              "focusText": "HighlightText",
                              "status": "CanvasText",
                              "error": "Mark",
                              "errorText": "MarkText"
                        },
                        "requiredCss": [
                              "@media (forced-colors: active)",
                              "forced-color-adjust",
                              "CanvasText",
                              "Highlight"
                        ]
                  },
                  "fabric": {
                        "lane": "a11y",
                        "fiberKind": "a11y.preference",
                        "scheduleRef": "a11y.user-blocking.preference",
                        "scheduleContract": "xtend.fabric.rmt-lane-mapping.v1",
                        "boundary": "fabric-adapter-observes-preferences-rmt-kernel-remains-framework-agnostic"
                  },
                  "testPlan": {
                        "schema": "xtend.a11y.motion-contrast-test.v1",
                        "requiredAssertions": [
                              "prefers-reduced-motion-css",
                              "forced-colors-css",
                              "focus-visible-preserved",
                              "non-color-status",
                              "theme-token-system-colors"
                        ]
                  },
                  "requiredCss": [
                        "@media (prefers-reduced-motion: reduce)",
                        "animation: none",
                        "transition: none",
                        "@media (forced-colors: active)",
                        "forced-color-adjust",
                        "CanvasText",
                        "Highlight"
                  ],
                  "testRefs": [
                        "motion-contrast",
                        "a11y-hydration",
                        "references"
                  ],
                  "boundaries": {
                        "runtimeAgnostic": true,
                        "noRmtKernelImport": true,
                        "noMotionOnlyState": true
                  }
            },
            "fabric": {
                  "lane": "a11y",
                  "fiberKind": "a11y.preference",
                  "scheduleRef": "a11y.user-blocking.preference",
                  "scheduleContract": "xtend.fabric.rmt-lane-mapping.v1",
                  "boundary": "fabric-adapter-observes-preferences-rmt-kernel-remains-framework-agnostic"
            }
      },
      "testRefs": [
            "components",
            "a11y-hydration",
            "screenreader-signals",
            "motion-contrast",
            "references"
      ],
      "testPlan": {
            "schema": "xtend.a11y.test-contract.v1",
            "requiredAssertions": [
                  "static-a11y-profile",
                  "role-or-native-semantics",
                  "accessible-name",
                  "keyboard-contract",
                  "focus-strategy",
                  "aria-state-list",
                  "screenreader-live-region-policy",
                  "screenreader-signals-contract",
                  "announcement-policy",
                  "reduced-motion-policy",
                  "motion-contrast-policy",
                  "forced-colors-policy",
                  "non-color-status-policy"
            ]
      },
      "scaffold": {
            "staticGetter": "xtendScaffoldA11yProfile",
            "manifestKey": "a11yProfile",
            "requiredFixtureAttributes": [
                  "aria-label"
            ],
            "requiredDocsSections": [
                  "A11y-Profil",
                  "Screenreader-Signale",
                  "Motion-und-Contrast-Policy",
                  "Accessibility und Hydration"
            ],
            "requiredGates": [
                  "components",
                  "a11y-hydration",
                  "screenreader-signals",
                  "motion-contrast",
                  "references"
            ]
      },
      "reviewRules": [
            "semantic-role",
            "accessible-name",
            "slot-content-readable",
            "state-change-announcement",
            "aria-busy-consistency",
            "focus-preservation"
      ]
};
    }

    static get xtendScaffoldPerformanceProfile() {
      return {
      "schema": "xtend.performance.component-profile.v1",
      "policySchema": "xtend.scaffold.performance-policy.v1",
      "budgetMatrix": "xtend.performance.budget-matrix.v1",
      "measurementContract": "xtend.performance.measurement.v1",
      "regressionGate": "xtend.performance.regression-gate.v1",
      "hydrationPolicyContract": "xtend.fabric.hydration-policy.v1",
      "status": "scaffold-performance-required",
      "mode": "dry-run-performance-profile",
      "componentRef": "x-rmt-lifecycle-demo-build",
      "name": "rmt-lifecycle-demo-build",
      "className": "XRmtLifecycleDemoBuild",
      "profiles": [
            "display",
            "stateful"
      ],
      "primaryProfile": "stateful",
      "budgetClass": "critical",
      "lane": "user-blocking",
      "hydrationPolicy": "visible",
      "budgetsMs": {
            "loadDefine": 40,
            "mount": 24,
            "hydrate": 32,
            "renderUpdate": 24,
            "stateSync": 12,
            "eventAction": 16
      },
      "criticalMeasurements": [
            "xtend.loader.module",
            "xtend.component.mount",
            "xtend.component.hydrate",
            "xtend.component.render",
            "xtend.component.update",
            "xtend.event.handler"
      ],
      "idleOrBackgroundAllowed": false,
      "requiresA11yFiber": false,
      "scaffold": {
            "staticGetter": "xtendScaffoldPerformanceProfile",
            "manifestKey": "performanceProfile",
            "authorGuide": "docs/performance.md",
            "budgetMatrix": "development/XTend-Performance-Budget-Matrix.md",
            "requiredDocsSections": [
                  "Performance-Profil",
                  "Performance-Regeln"
            ],
            "requiredGates": [
                  "fabric-performance-measurements",
                  "performance-regression",
                  "hydration-policy",
                  "references"
            ]
      },
      "reviewRules": [
            "scoped-dom-queries",
            "no-layout-thrashing",
            "event-handler-budget",
            "shadow-dom-style-cache",
            "observer-and-timer-cleanup",
            "reduced-motion-aware-animations",
            "idle-or-background-for-non-visible-work",
            "fabric-measurement-correlation",
            "scope DOM reads to host or shadowRoot",
            "avoid full shadow rebuilds for small state changes",
            "avoid unbounded state subscribers",
            "treat local UI state as derived render cache only"
      ]
};
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.__xtendHydrated = false;
    }

    connectedCallback() {
      this.hydrate();
    }

    disconnectedCallback() {
      this.onDisconnect();
      this.__xtendHydrated = false;
      this.removeAttribute('data-xtend-hydrated');
    }

    beforeHydrate() {}

    afterHydrate() {}

    beforeRender() {}

    afterRender() {}

    onDisconnect() {}

    _escapeAttribute(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    hydrate() {
      this.beforeHydrate();
      this.__xtendHydrated = true;
      this.setAttribute('data-xtend-hydrated', 'true');
      this.render();
      this.afterHydrate();
    }

    attributeChangedCallback() {
      if (this.isConnected) {
        this.hydrate();
        return;
      }

      this.render();
    }

    render() {
      this.beforeRender();
      const variant = this._escapeAttribute(this.getAttribute('variant') || 'default');
      const accessibleName = this.getAttribute('aria-label') || 'XRmtLifecycleDemoBuild component';
      const role = 'region';
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }

          .root {
            border: 1px solid var(--xt-color-border, #d5dbe3);
            border-radius: 8px;
            padding: 1rem;
            color: var(--xt-color-text, #172033);
            background: var(--xt-color-surface, #ffffff);
          }

          .root:focus-visible {
            outline: 2px solid var(--xt-color-focus, #2563eb);
            outline-offset: 2px;
          }

          @media (prefers-reduced-motion: reduce) {
            .root {
              animation: none !important;
              transition: none !important;
              scroll-behavior: auto !important;
            }
          }

          @media (forced-colors: active) {
            .root {
              forced-color-adjust: auto;
              color: CanvasText;
              background: Canvas;
              border-color: CanvasText;
            }

            .root:focus-visible {
              outline-color: Highlight;
            }
          }
        </style>
        <section class="root" data-variant="${variant}" part="root" role="${role}" aria-label="${this._escapeAttribute(accessibleName)}">
          <slot>XRmtLifecycleDemoBuild</slot>
        </section>
      `;
      this.afterRender();
    }
  }

  if (!customElements.get('x-rmt-lifecycle-demo-build')) {
    customElements.define('x-rmt-lifecycle-demo-build', XRmtLifecycleDemoBuild);
  }
})();

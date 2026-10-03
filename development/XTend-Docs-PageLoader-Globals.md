# PageLoader global API inventory

This inventory records the globals that predated the Docs controller services. New
code must use `docs-app-services.mjs`; none of these names is a supported public API.

## Input configuration

`xtendInitialDocsSlug`, `xtendInitialDocsLocale`, `xtendDocsLocales`,
`xtendMenuConfig`, `xtendDocsNavigation`, `xtendDocsSlugAliases`,
`xtendDocsBasePath`, `xtendDocsPageEndpoint`, `xtendDocsRmtDocument`,
`xtendDocsSsrPrehydration`, `xtendDocsRmtPilot`,
`xtendDocsRmtProductionHardening`, and `xtendDocsAssetUrls` were untyped inputs.
They are replaced by the immutable `xtend.docs.boot.v1` descriptor.

## Product state

`xtendDocsCurrentLocale`, `__xtendDocsLocaleTransition`,
`__xtendDocsLocaleTransitionToken`, `__xtendDocsLocaleLastTransition`,
`__xtendDocsPendingLocaleRoute`, `xtendDocsPages`, `xtendDocsLocalizedPages`,
`xtendDocsPagesMeta`, `xtendDocsLocalizedPagesMeta`, and `xtendDocsTitles` were
mutable state containers. Locale and content now belong to explicit services.

## Diagnostic snapshots

`xtendDocsTrustedDomLastSanitize`, `xtendDocsLastCodeHydration`,
`xtendDocsLastComponentDemoHydration`, `xtendDocsRmtPlaygroundLastMaraca`,
`xtendDocsRmtPlaygroundLastDiagnostics`, `xtendDocsRmtPlaygroundLastCompile`,
`xtendDocsInitialRouteReplay`, `xtendDocsRmtLastRender`,
`xtendDocsRmtProductionLastRender`, and `xtendDocsRouteExecution` were writable
snapshots. Diagnostics are now published as frozen values through `snapshot()` and
the `xtend-docs-diagnostics-snapshot` lifecycle event.

## Public actions

`xtendShowToast`, `xtendDocsI18n`, and `xtendDocsTrustedDomBoundary` exposed
actions directly on `window`. Toasts use the `docs.toast.show` XTend command/event;
locale behavior is importable from `docs-locale-service.mjs`. Trusted DOM remains
an injected controller service rather than an ambient action.

No compatibility adapter is loaded by the production Docs app. A test harness
that temporarily needs one must explicitly import `docs-legacy-bridge.mjs`.

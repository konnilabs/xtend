# {{tag}}

- Status: scaffolded draft
- Profile: {{profilesCsv}}
- Source: `components/{{tag}}.js`
- Fixture: `tests/components/fixtures/{{tag}}.component.html`
- Types: `components/{{tag}}.d.ts`

## Zweck

`{{tag}}` ist eine scaffolded XTend-Komponente nach dem Component-Level-Teststandard.

## Attribute

| Attribut | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `variant` | string | `default` | Steuert die visuelle Variante des Root-Elements. |

## Slots

| Slot | Beschreibung |
|------|--------------|
| default | sichtbarer Inhalt der Komponente |

## Events

Die Scaffold-Ausgabe bereitet profilbasierte Events vor. Die Basiskomponente emittiert sie erst, wenn die jeweilige Feature-Implementierung ergaenzt wird.

| Event | Contract |
|-------|----------|
{{featureEventRows}}

## State

Kanonischer State-Prefix: `{{featureStatePrefix}}`

Der Basistemplate schreibt keinen State. Feature-Implementierungen muessen die folgenden Keys als SSOT-Ziele nutzen und duerfen lokale UI-Felder nur als abgeleitete Render-Caches fuehren.

| Key | Contract |
|-----|----------|
{{featureStateRows}}

## API- und Feature-Wiring

Schema: `{{featureWiringSchema}}`

| Namespace | Contract |
|-----------|----------|
{{featureApiRows}}

Review-Regeln:

{{featureReviewRules}}

Verbotene State-Fassaden: `{{featureStateForbiddenCsv}}`

Verbotene globale Helper: `{{featureForbiddenGlobalsCsv}}`

## Typisierung und RMT-Anschluss

Typing-Schema: `{{typeContractSchema}}`

Runtime-Grenze: `{{typeRuntimeBoundary}}`

| Attribut | Typ | Contract |
|----------|-----|----------|
{{typeAttributeRows}}

| Property | Typ | Contract |
|----------|-----|----------|
{{typePropertyRows}}

Review-Regeln fuer Typ-Artefakte:

{{typeReviewRules}}

Typ-Ausnahmeprozess: `{{typeExceptionPolicy}}`

## A11y-Profil

Profil-Schema: `{{a11yProfileSchema}}`

Komponenten-Contract: `{{a11yComponentContractSchema}}`

Test-Contract: `{{a11yTestContractSchema}}`

Das Scaffold erzeugt fuer jede neue Komponente ein A11y-Profil. Dieses Profil ist keine optionale Checkliste, sondern ein Bestandteil des Component Contracts und muss in Reviews, Fixtures und Tests sichtbar bleiben.

- Primaeres Profil: `{{a11yPrimaryProfile}}`
- Rolle/Semantik: `{{a11yRole}}`
- Zugaenglicher Name: `{{a11yAccessibleNameSource}}`, erforderlich: `{{a11yAccessibleNameRequired}}`
- Default-Name: `{{a11yAccessibleNameDefault}}`
- Fokusstrategie: `{{a11yFocusMode}}`, Initialfokus: `{{a11yFocusInitial}}`, Trap: `{{a11yFocusTrap}}`, Restore: `{{a11yFocusRestore}}`
- Screenreader: Live Region `{{a11yScreenreaderLiveRegion}}`, Signale `{{a11yScreenreaderSignalsCsv}}`
- Screenreader-Contract: `{{a11yScreenreaderContractSchema}}`
- Reduced Motion: `{{a11yMotionReducedMotion}}`
- Kontrast/Fokus: `{{a11yContrastFocusVisible}}`, Nicht-Farbstatus: `{{a11yContrastNonColorStatus}}`
- Motion/Contrast-Contract: `{{a11yMotionContrastContractSchema}}`
- Pflicht-Gates: `{{a11yTestRefsCsv}}`
- Fixture-Pflichtattribute: `{{a11yRequiredFixtureAttributesCsv}}`

Keyboard Contract:

| Taste | Pflicht |
|-------|---------|
{{a11yKeyboardRows}}

ARIA-State-Liste:

| State | Pflicht |
|-------|---------|
{{a11yAriaStateRows}}

Review-Regeln fuer A11y:

{{a11yReviewRules}}

## Screenreader-Signale

Contract: `{{a11yScreenreaderContractSchema}}`

Signal-Record-Contract: `{{a11yScreenreaderSignalRecordSchema}}`

| Signal | Live Region | Art |
|--------|-------------|-----|
{{a11yScreenreaderSignalRows}}

- Statusregionen: `{{a11yScreenreaderStatusRegionsCsv}}`
- Errorregionen: `{{a11yScreenreaderErrorRegionsCsv}}`
- Fabric-Lane: `{{a11yScreenreaderFabricLane}}`
- Fabric-Fiber: `{{a11yScreenreaderFabricFiberKind}}`
- Schedule: `{{a11yScreenreaderFabricScheduleRef}}`

## Motion-und-Contrast-Policy

Contract: `{{a11yMotionContrastContractSchema}}`

Motion-Contract: `{{a11yMotionContractSchema}}`

Contrast-Contract: `{{a11yContrastContractSchema}}`

- Reduced-Motion Media Query: `{{a11yMotionMediaQuery}}`
- Motion Policy: `{{a11yMotionAnimationPolicy}}`
- Motion CSS-Pflichten: `{{a11yMotionRequiredCssCsv}}`
- High-Contrast Media Query: `{{a11yContrastMediaQuery}}`
- Contrast Policy: `{{a11yContrastPolicy}}`
- Forced Color Adjust: `{{a11yContrastForcedColorAdjust}}`
- Contrast CSS-Pflichten: `{{a11yContrastRequiredCssCsv}}`
- Fabric-Lane: `{{a11yMotionContrastFabricLane}}`
- Fabric-Fiber: `{{a11yMotionContrastFabricFiberKind}}`
- Schedule: `{{a11yMotionContrastFabricScheduleRef}}`

## Performance-Profil

Profil-Schema: `{{performanceProfileSchema}}`

Performance Policy: `{{performancePolicySchema}}`

Budget-Matrix: `{{performanceBudgetMatrixSchema}}` in `{{performanceBudgetMatrixPath}}`

Measurement Contract: `{{performanceMeasurementContract}}`

Regression Gate: `{{performanceRegressionGate}}`

Hydration Policy Contract: `{{performanceHydrationPolicyContract}}`

Das Scaffold erzeugt fuer jede neue Komponente ein Performance-Profil. Dieses Profil ist Teil des Component Contracts und nutzt dieselbe Policy wie die offizielle Autorendokumentation unter `{{performanceAuthorGuide}}`.

- Primaeres Performance-Profil: `{{performancePrimaryProfile}}`
- Budgetklasse: `{{performanceBudgetClass}}`
- Fabric-Lane: `{{performanceLane}}`
- Hydration Policy: `{{performanceHydrationPolicy}}`
- Idle/Background erlaubt: `{{performanceIdleOrBackgroundAllowed}}`
- Eigene A11y-Fiber erwartet: `{{performanceRequiresA11yFiber}}`
- Pflicht-Gates: `{{performanceRequiredGatesCsv}}`

Kritische Messpunkte:

| Messpunkt | Pflicht |
|-----------|---------|
{{performanceCriticalMeasurementsRows}}

## Performance-Regeln

{{performanceReviewRules}}

Der vorbereitete RMT-Anschluss bleibt adapterbasiert:

- Component-Adapter: `{{typeRmtAdapter}}`
- Component-Contract: `{{typeRmtComponentContractVersion}}`
- Router-Adapter: `{{typeRmtRouterAdapter}}`
- RMT-Domains: `{{typeRmtDomainsCsv}}`
- Manifest Lookup: XTend Host Adapter, nicht RMT Kernel
- Hydration: Custom Element Lifecycle mit `{{hydrationStateAttribute}}`
- Kernel-Grenze: {{typeRmtKernelBoundary}}

## RMT Template Authoring

Template-Authoring nutzt RMT als XTend-Templating-DSL und fuehrt keine zweite XTend-Syntax ein.

- Template-Contract: `{{typeRmtTemplateAuthoringContractVersion}}`
- Template-Adapter: `{{typeRmtTemplateAdapter}}`
- Template-Ref: `{{typeRmtTemplateRef}}`
- Component-Ref: `{{typeRmtTemplateComponentRef}}`
- Erlaubte Modi: `{{typeRmtTemplateAllowedModesUnion}}`
- Kernel-Grenze: {{typeRmtTemplateKernelBoundary}}

Slots, Props, Attributes und Events bleiben RMT Records. Der XTend Host Adapter materialisiert daraus Custom Elements, Slot-Projektion und Event-Command-Bindings.

## Extension-Punkte

Extension-Schema: `{{extensionContractSchema}}`

Status: `{{extensionStatus}}`

Root-Lifecycle:

| Hook | Phase | Default |
|------|-------|---------|
{{extensionHookRows}}

Template-Anschluss:

- Adapter: `{{extensionTemplateAdapter}}`
- Template-Ref: `{{extensionTemplateRef}}`
- Grenze: `{{extensionTemplateBoundary}}`

Rendering-Anschluss:

- Modus: `{{extensionRenderingMode}}`
- Ziel: `{{extensionRenderTarget}}`
- Schedule-Hint: `{{extensionScheduleHint}}`

Root-Lifecycle- und Scheduler-Handschlag:

- Contract: `{{typeRmtRootHandshakeContractVersion}}`
- Root-Ref: `{{typeRmtRootRef}}`
- Phasen: `{{typeRmtRootPhasesUnion}}`
- Kernel-Grenze: {{typeRmtRootKernelBoundary}}

## XTend Host Capabilities

Host-Capabilities beschreiben, welche XTend-Faehigkeiten ein RMT-Dokument ueber Adapterdaten nutzen darf. Der RMT Kernel darf daraus keine XTend-Imports oder direkte `window.XTend` Aufrufe ableiten.

- Contract: `{{typeRmtHostCapabilitiesContractVersion}}`
- Erforderlich: `{{typeRmtHostRequiredCapabilitiesCsv}}`
- Optional: `{{typeRmtHostOptionalCapabilitiesCsv}}`
- Manifest: `{{typeRmtHostManifestSource}}`
- State-Bridge: `{{typeRmtHostStateBridge}}`
- API-Root: `{{typeRmtHostApiNamespaceRoot}}`
- Kernel-Grenze: {{typeRmtHostKernelBoundary}}

## RMT-Kompatibilitaets-Binding

Das Binding verbindet Typing, Manifest-Plan, Preview-Plan und Extension-Punkte zu einem reviewbaren RMT-Kompatibilitaetscontract. Es erzeugt keine Bridge-Runtime und fuehrt keine RMT Scheduler Jobs aus.

- Schema: `{{rmtCompatibilitySchema}}`
- Contract-Refs: `{{rmtCompatibilityContractRefsCsv}}`
- Artefakte: `{{rmtCompatibilityArtifactsCsv}}`
- Dry-Run-Oberflaechen: `{{rmtCompatibilityDryRunSurfacesCsv}}`
- Mindestgate: `{{rmtCompatibilityMinimumGate}}`
- Vollgate: `{{rmtCompatibilityFullGate}}`
- Grenze: {{rmtCompatibilityBoundary}}

Review-Regeln fuer Extension-Punkte:

{{extensionReviewRules}}

## Accessibility und Hydration

- Die Komponente rendert repo-lokal ohne CDN-Abhaengigkeit.
- `xtendScaffoldA11yProfile` macht `{{a11yProfileSchema}}` im Component Source statisch pruefbar.
- Die Fixture setzt `{{a11yAccessibleNameSource}}` und meldet Rolle, zugaenglichen Namen und A11y-Profil im Hydration-Ergebnis.
- Die Fixture meldet den Screenreader-Signal-Contract `{{a11yScreenreaderContractSchema}}` und dessen Status-/Errorregionen.
- Die Komponente deklariert `{{a11yMotionContrastContractSchema}}` fuer `prefers-reduced-motion`, `forced-colors`, Fokus und Nicht-Farbstatus.
- `connectedCallback`, `attributeChangedCallback` und `disconnectedCallback` bilden den Hydration-Mindestcontract.
- `hydrate()` ist der explizite Rehydration-Pfad und markiert Instanzen mit `{{hydrationStateAttribute}}`.
- Die Fixture legt ein Ergebnisobjekt fuer Hydration-Smokes offen und dokumentiert den lokalen Scriptpfad `{{fixtureScriptPath}}`.

## Manifest-Wiring

- Patch-Plan: `{{manifestPatchSchema}}`
- Quelle: `{{manifestSource}}`
- Importmodus: `{{manifestImportMode}}`
- Hydration: `{{manifestHydrationMode}}`
- CDN erlaubt: `{{manifestCdnAllowed}}`
- Feature-Wiring: `{{featureWiringSchema}}`

## Lokale Verifikation

```bash
node scripts/run_xtend_tests.js components
node scripts/run_xtend_tests.js a11y-hydration
node scripts/run_xtend_tests.js screenreader-signals
node scripts/run_xtend_tests.js motion-contrast
node scripts/run_xtend_tests.js fabric-performance-measurements
node scripts/run_xtend_tests.js performance-regression
node scripts/run_xtend_tests.js hydration-policy
node scripts/run_xtend_tests.js references
node scripts/run_xtend_tests.js rmt-compatibility
```

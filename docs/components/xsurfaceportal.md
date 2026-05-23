# xsurfaceportal - XTend Komponente

`x-surface-portal` beschreibt benannte Portal- und Layer-Policies fuer den
`x-surface-manager`. Die Komponente rendert selbst keine sichtbare UI, sondern
meldet `xtend.surface.portal-policy.v1` an die umgebende Surface-Orchestrierung.

## Attribute

- `portal-id`: stabile Portal-ID, standardmaessig die Element-ID
- `policy`: `stacked`, `modal`, `nonmodal`, `toast-region` oder `clipping-escape`
- `layer`: logischer Layer-Name fuer Stack- und Z-Index-Ableitung
- `for`: optionaler Ziel-Surface- oder Manager-Identifier
- `z-index-start`: Startwert fuer den Portal-Stack
- `z-step`: Abstand zwischen verwalteten Stack-Ebenen

## API

`toPortalPolicy()` gibt den serialisierbaren Policy Record fuer
SurfaceManager, RMT Materialisierung und Resource Graph Runtime zurueck.

Events: `surface-portal-policy`.

RMT: `xtend.rmt.component-contract.v1`,
`xtend.surface.type-capability-matrix.v1`,
`xtend.surface.portal-policy.v1`,
`no-rmt-kernel-import-of-xtend-types`.

## Accessibility und Performance

Die Komponente ist `aria-hidden`, weil die sichtbare und fokussierbare UI durch
die verwaltete Surface bereitgestellt wird. Das Performance-Profil ist
`xtend.performance.component-profile.v1` mit der Lane `surface.portal.policy`.

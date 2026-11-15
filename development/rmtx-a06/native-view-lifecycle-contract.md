# A06: Nativer Surface-/View-Lifecycle

Vertrag **1.0.0**, Stand **15. November 2026**. Dieser Vertrag schließt die im [vorherigen Headercheck](native-header-check.before-lifecycle-fix.md) beobachteten Kanten. Er ergänzt die angenommene [RMTX-Syntaxentscheidung](syntax-decision.md), ohne einen allgemeinen produktiven RMTX-Compiler einzuführen.

## Zuständigkeiten und Versionen

| Schicht | Vertrag |
| --- | --- |
| Maraca-Controller | Liest den vollständigen autoritativen Controller-Snapshot einschließlich Destroy-Tombstones, beendet Presentation-Lifetimes und delegiert native DOM-Projektion. Kein DOM-Lesen oder -Schreiben im Controller. Bestehende Planruntime-Wireformen bleiben erhalten. |
| View Projection Adapter | Modul-API **2.0.0**, Standardschema `xtend.rmt.maraca-view-projection-adapter.v2`; ergänzt `projectSurfaceLifecycle(snapshot, { renderer, ownership, context, phase })`. Das ausdrücklich gewählte Schema `.v1` behält seine bisherige Portform. |
| Lifecycle-Projektionsreport | `xtend.rmt.maraca-surface-lifecycle-projection.v1`, ein neuer versionierter Report für die native Viewprojektion. |
| Surface Resource Graph | Modul-API **2.2.1**; additive Option `materialize(..., { preserveDestroyed: true })`. Standalone-Aufrufer ohne Option behalten die bisherige Wiederherstellung durch Materialisierung. |
| Shared Descriptor Renderer | Modul-API **2.2.0**, bestehende Wireformen. Private Fremdrootreservierungen schützen auch gegen indirekten Detach über native Wrapper. |

Der Controller ist weiterhin die Lifecycleautorität. Weder Sourceattribute noch DOM-Marker oder ein Viewreport dürfen eine neue Generation, Capability oder einen Ressourcenlease erzeugen. Kernel, Fabric, Surface-Controller und Model bleiben auf ihren bisherigen Pfaden.

## Close und Resume

Close, Minimize und Collapse sperren die Präsentation und verbergen die betroffene native Ansicht. Bestehende native Nodes sowie unabhängige fremde Roots bleiben erhalten. Resume öffnet dieselbe zulässige Generation und bewahrt die DOM-Identität.

Die Sichtbarkeit ist eine zusätzliche Lifecyclegrenze zu Modell-, ARIA-, CSS- und Transitionregeln. Ein Open darf nicht blind `hidden`, `aria-hidden` oder einen ursprünglichen `display`-Wert löschen. Inline-CSS-Prioritäten werden erhalten. Der Viewport restauriert vor einem normalen Renderercommit ausschließlich seine eigenen Lifecycleüberlagerungen (`phase: "prepare"`). Danach übernimmt die normale Model-/Descriptorprojektion die aktuellen Werte. `phase: "project"` legt erforderliche Lifecyclegrenzen erneut darüber. Lifecycleevents selbst werden unmittelbar projiziert.

Modelupdates dürfen während Close weiterlaufen. Native Textprojektion darf den neuesten Modelwert innerhalb der verborgenen Ansicht übernehmen. Das bestehende Props-Staging der Framework-Hosts bleibt eigenständig; es wird nicht durch eine zweite Modelautorität ersetzt.

## Destroy und Wiederanlage

Destroy beendet die vorhandene Presentation-Boundary synchron aus dem vollständigen Controllerzustand. Fehlt eine zuvor bekannte Surface wegen der begrenzten Tombstone-Historie in einem vollständigen aktuellen Registry-Read, ist auch diese autoritative Abwesenheit eine Revokation. Der interne Projektionsstand ergänzt dafür die letzte bekannte Generation als beendet; der öffentliche Controllersnapshot bleibt unverändert. Das alte Signal wird abgebrochen. Ein Command mit einem solchen alten ownergebundenen Lifetime-Token muss vor jedem Reducer-/Model-/Viewcommit `superseded` liefern. Das gilt auch dann, wenn später eine neue Generation geöffnet wird.

Die native Ansicht wird über den Shared Renderer entfernt. Noch aktive, privat registrierte Fremdroots dürfen dabei nicht indirekt über einen nativen Elternknoten detached werden. Solange deren eigene Lifetime fortbesteht, darf eine geschützte Resthülle ohne eigene Lifecycle-Sichtbarkeitsüberlagerung erhalten bleiben. DOM- oder Deskriptormarker erzeugen dafür keine Berechtigung. Nach dem Ende der fremden Reservierung muss die normale Bereinigung wieder möglich sein.

Normale globale Modelupdates und View-Commits erteilen keine Erlaubnis zur Wiederanlage. Der Managed-Pfad setzt deshalb `preserveDestroyed: true` im Graph und entfernt zerstörte Owner aus der anstehenden View-/Bindingmaterialisierung. Beendete XTension-Bindings werden rechtzeitig aus der Zustellung genommen; die vorhandene Idle-Barriere entwässert die asynchrone Freigabe.

Eine neue Generation erfordert einen ausdrücklichen vertrauenswürdigen Lifecycleaufruf, etwa `openSurface(id, { recreate: true })`. Wurde der alte Controller-Tombstone bereits getrimmt, registriert der Graph beim ausdrücklichen Recreate atomar die privat gespeicherte kanonische Generation plus eins und öffnet sie. Ein folgender normaler Viewcommit darf diese neue Generation darstellen und neu binden. Native Surfacekeys unterscheiden autoritativ unterschiedliche Generationen, ohne bestehende dynamische Key-Ausdrücke in bloßen Text umzuwandeln. Alte Tokens und Callbacks bleiben ungültig.

## Abnahme

Die ursprünglichen 17 Headererwartungen bleiben erhalten. Akzeptanzprofil **1.1.0** ergänzt vier reale Rückwege: Modelupdate während Close, globaler Modelcommit nach Destroy ohne Wiederbelebung, explizite neue Generation und erneute Abweisung des alten Tokens. Beide unabhängigen Sourceformen laufen in Node 24, Node 26 und Chromium über denselben tatsächlichen Maraca-/Kernel-/Fabric-Pfad.

Die blockierenden Commit-Gates enthalten zusätzliche Graph-, Viewport-, Runtime- und Rendererregressionen. Die [Headerprüfung](native-header-check.md) und der [aktuelle Laufzeitnachweis](syntax-comparison/native-header-evidence.json) dokumentieren die finalen Ergebnisse. Der [alte rote Nachweis](syntax-comparison/native-header-evidence.before-lifecycle-fix.json) bleibt unverändert als historische Beobachtung erhalten. Vollständige allgemeine JSX-UI-, Editor-Semantik- und RMTX-Frontendabnahme sind davon weiterhin getrennt.

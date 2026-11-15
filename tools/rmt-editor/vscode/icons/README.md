# RMT and RMTX file icons

Original XTend assets, distributed under the extension's Apache-2.0 license.
The RMT Classic icon uses a solid **R**; the RMTX icon uses **angle brackets around an X**. Both are native 16×16 SVGs, with separate colors for light and dark workbench backgrounds. They contain no external resources, scripts, fonts or raster images.

These icons are registered as `contributes.languages[].icon`, using the respective `rmt` and `rmtx` language registrations. The extension does not install or select a file icon theme and does not change `workbench.iconTheme`. Other file and folder icons remain owned by the user's selected theme.

VS Code uses language default icons when the active file icon theme has specific file icons, has no stronger association for the filename/extension/language, and does not set `showLanguageModeIcons: false`. A theme setting `showLanguageModeIcons: true` explicitly enables language icons. A theme can intentionally override these defaults. Themes such as Minimal, or an explicitly disabled file icon theme, do not automatically gain language icons. See the [official language default icon documentation](https://code.visualstudio.com/api/extension-guides/file-icon-theme#language-default-icons).

For the local installation inspected on 15 November 2026, no user/workspace/profile icon theme override was present. The built-in Seti theme has specific icons and no RMT/RMTX associations or `showLanguageModeIcons: false`; it can therefore use these language defaults without a settings change. This observation describes that installation, rather than imposing a global theme requirement.

The icon contribution is visual metadata. It does not claim RMTX semantic analysis, compilation or React runtime compatibility.

# Changelog

## 0.1.0 (release date: fill in on release day)

First release. `DocViewer` shows PDFs, images, plain text, code, JSON and markdown, and is built the
way Mantine builds its own compound components (`Lightbox`, `Pagination`).

Components

- `DocViewer` is the simple form: toolbar, document and thumbnails for the file type, configured
  with `toolbarControls`, `withToolbar`, `withOverlayControls` and the part props `toolbarProps`,
  `pagesProps`, `thumbnailsProps`, `searchProps`, `imageProps` and `textProps`. The part props are
  instance props of the part, so they win over theme `defaultProps`, and they also reach a part
  composed in children. Children replace the default layout.
- `DocViewer.Root` holds the shared state (`src`, `type`, `mimeType`, `fileName`, `keepView`,
  `locale`, `labels`, `store`, `extensions`, `size`, `radius`, `color`, `autosize`, `pageBackground`,
  `pageColorScheme`, `defaultThumbnailsOpened`, `defaultThumbnailsPosition`, and the value / default /
  on-change triads `page`, `zoom`, `pageLayout` and `fullscreen`, plus `onDocumentLoad` and
  `onDocumentError`). Parts read it from context and throw a clear error outside a Root.
- Toolbar parts: `Toolbar`, `Title`, `PageControls`, `ZoomControls`, `ThumbnailsButton`,
  `RotateButton`, `LayoutMenu`, `OutlineButton`, `InfoButton`, `PresentationButton`, `SearchButton`,
  `PrintButton`, `DownloadButton`, `FullscreenButton`, `WrapButton`, `ViewModeControl`. The toolbar
  always shows the title (`title` and `subtitle` props, `title={false}` hides it) before its controls,
  which are the defaults for the document type or its children. It is a single row; the title
  truncates first. `leftSection`, `rightSection`, `toggleOnTap` and `tooltipProps` are its slot props.
- Document parts: `Main`, `Body`, `Pages`, `Thumbnails`, `Search`, `Outline`, `DocumentInfo`,
  `PresentationControls`, `OverlayControls`, `Image`, `Text`, `Code`, `Markdown`, `Message`,
  `Loading`. Each is also exported under its own name (`DocViewerPages`, ...), with `Props`,
  `StylesNames` and `Factory` types.
- Styles API on every part (including `attributes`), `variant="plain"`, dark pages, CSS variables,
  `DocViewer.Props`, `DocViewer.StylesNames`, `DocViewer.CssVariables`, `DocViewer.Factory` and
  `DocViewer.Variant`

Adapters

- PDFs and markdown go through adapters in `DocViewerAdapterProvider`, so the package imports no
  engine: `createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc, options })` and
  `createReactMarkdownAdapter(() => Promise.all([import('react-markdown'), import('remark-gfm')]))`.
  `pdfjs-dist`, `react-markdown`, `remark-gfm` and `@cantoo/pdf-lib` are optional peer dependencies
  and are loaded only when a document needs them. Without an adapter a PDF shows a message that
  names it, with a console warning in development.

State and control

- Every viewer has a store (`@mantine/store`): `useDocViewer()` / `createDocViewer()` return
  `[store, actions]`, `useDocViewerStore(store)` reads state, `createDocViewerStore` creates a
  bare store. Pass it as `store` to read or drive a viewer from outside: `goToPage`, `goToSpread`,
  `nextSpread` / `previousSpread({ loop })`, `setZoom`, `zoomIn`, `zoomOut`, `setPageLayout`, `rotate`, `openSearch`, `closeSearch`, `toggleThumbnails`,
  `setThumbnailsPosition`, `togglePresentation`, `highlight`, `clearHighlight`, `getOutline`,
  `getBytes`, `getPageCanvas`, `print`, `download`, `toggleFullscreen`, `resetReadingProgress`.
  State includes `type`, `status`, `canPrint`, `spread`, `thumbnailsOpened` and
  `thumbnailsPosition`. `useDocViewerView` and `useDocViewerContext` serve custom parts: the
  context hook returns `src`, `type`, `fileName`, `title`, `labels`, `store`, `getStyles` and
  `controlProps` (`UseDocViewerContextReturnValue`).
- `onZoomChange(zoom, { scale })` fires for every request, also when `zoom` is controlled.

Subpaths

- `mantine-doc-viewer/editor`: page editing (reorder, remove, extract, rotate, save), as
  `createPageEditorExtension({ compact, onDocumentChange, onExtract })`, `DocViewerPageEditor`,
  `DocViewerPageEditorButton`, `openPageEditor(store)` and `closePageEditor(store)`. Only this entry
  imports `@cantoo/pdf-lib`.
- `mantine-doc-viewer/markup`: markup tools that save into the PDF (highlight, text box, shapes,
  signature), as `createMarkupExtension({ tools, tool, defaultTool, onToolChange, value,
  defaultValue, onChange, color, width, fontSize, onDocumentChange })`, `DocViewerMarkupBar`,
  `DocViewerMarkupButton`, `setMarkupTool(tool, store)` and `saveMarkup(store)`.
- Extensions are passed to `Root` as `extensions`. Their labels are exported as `DEFAULT_LABELS` of
  each subpath and merged with `labels`.

Reading

- PDF: search (match case, whole words, accents), thumbnails on any side, outline, clickable
  links, document info, attachments, layers, password protected files, zoom including `fit-page`,
  anchored zoom, rotation, page layouts and spreads, built-in page turning, scroll snap,
  presentation mode, reading progress (`onReadingProgress`, `onReachEnd` on `Pages`),
  `renderPageOverlay({ page, width, height, scale, rotation })`, `onTextSelect(text, { page, rects })`,
  `onLinkClick`
- Images: fit, zoom, pinch, rotate, drag to pan
- Text, code, JSON and markdown (`maxSize`, `language`, `codeHighlightProps`)
- Print, download, full screen, `keepView`, `autosize` for a viewer that grows with its content
- Accessible: named regions, listbox thumbnails, announcements, keyboard shortcuts, high contrast

Removed props (the old flat `DocViewer`)

- `pdfWorkerSrc`, `pdfOptions`: `createPdfJsAdapter` options
- `controllerRef`: `store` and its actions; `controller.canPrint` and `.type`: store state
- `thumbnailsOpened`, `onThumbnailsOpenedChange`, `thumbnailsPosition`, `onThumbnailsPositionChange`:
  `defaultThumbnailsOpened`, `defaultThumbnailsPosition`, store state and `toggleThumbnails`,
  `setThumbnailsPosition`
- `renderers`: children. `withFullscreen`: omit `FullscreenButton` or `toolbarControls={{ fullscreen: false }}`
- `withPageEditing`, `compactPageEditor`, `onSave`: the editor extension and its
  `onDocumentChange` and `onExtract`
- `withMarkup` and the `markup*` props: the markup extension and its options
- `idleTimeout`, `onIdle`, `autoAdvance`: Mantine's `useIdle` and `useInterval` with `nextSpread`
- `onDocumentLoadStart`, `onSpreadChange`: store state (`status`, `spread`)
- `height`: `autosize` and `h`. Breakpoint objects for `size`, `pageLayout`, `pageGap`,
  `thumbnailWidth`: use `useMatches`
- Renamed: `toolbarSection` is `Toolbar rightSection`, `toolbarStartSection` is `leftSection`,
  `tapToggleToolbar` is `toggleOnTap`, `thumbnailWidth` is `Thumbnails width`, `renderToolbarTitle`
  is the `title` node

Requirements: React 19.2 or newer, Mantine 9.7 or newer (`@mantine/core`, `@mantine/hooks`,
`@mantine/code-highlight`), and the optional peers `pdfjs-dist` 6.5 or newer (PDFs),
`@cantoo/pdf-lib` 2.11 or newer (the `/editor` and `/markup` subpaths), `react-markdown` 10.1 or
newer with `remark-gfm` 4 (markdown).

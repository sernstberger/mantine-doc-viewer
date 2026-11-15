# Changelog

## 0.1.0 (release date: fill in on release day)

First release.

Formats

- `DocViewer` for PDFs (pdf.js), images, plain text, code, JSON and markdown, with custom
  `renderers` (the `useDocViewer()` hook gives a renderer `onLoad` and `onError` helpers that report to
  `onDocumentLoad` and `onDocumentError`)
- Images: fit, zoom, pinch, rotate, drag to pan

PDF reading

- Search (match case, whole words, accents), thumbnails on any side (`thumbnailsPosition` is
  responsive), outline, clickable links, document info, attachments, layers, password protected
  files
- Zoom including `fit-page`; anchored zoom; rotation; page layouts and spreads (`goToSpread`,
  scroll snap, built-in page turning, a controlled and responsive `pageLayout`, `withScroll`)
- `height="auto"` (the viewer grows to its content), `keepView` (swap `src` and keep zoom,
  rotation and scroll), `locale` for numbers and dates
- Reading progress (`onReadingProgress`, `onReachEnd`), controlled full screen, presentation mode
- Kiosk props (`idleTimeout`, `onIdle`, `autoAdvance`), `tapToggleToolbar`, `withOverlayControls`

Annotation and editing

- `renderPageOverlay`: app content over each page, scaled and rotated with it
- Markup tools that save into the PDF (highlight, text box, shapes, signature), `onTextSelect`,
  `controller.highlight`, `goToPage` to a point or `behavior: 'instant'`, `controller.getPageCanvas`
- Page editing: reorder (drag with Mantine's `useDrag`), remove, extract, rotate, save, thumbnail
  delete, `controller.getBytes`, compact page editor

API and styling

- Toolbar built on Mantine's `Toolbar`, with slots (`toolbarSubtitle`, `toolbarStartSection`,
  `renderToolbarTitle`) and `toolbarControls`, the one switch for which toolbar buttons show
  (`print`, `download`, `fullscreen` and the rest); `withFullscreen={false}` turns off full screen
  buttons everywhere, the overlay one too
- Controlled state with Mantine's value / default / on-change triad: `page`, `pageLayout`,
  `thumbnailsPosition`, `thumbnailsOpened` (`onThumbnailsOpenedChange`), `zoom` (`defaultZoom`,
  `onZoomChange(zoom, { scale })`: the same zoom type in and out, with the scale it gives),
  `markupTool`, `markup`, `fullscreen`
- Exported types carry the `DocViewer` prefix (`DocViewerType`, `DocViewerDetectTypeInput`,
  `DocViewerPdfOptions`, `DocViewerTextState`, `useDocViewerText`), and `DocViewer.Props`,
  `DocViewer.StylesNames`, `DocViewer.CssVariables`, `DocViewer.Factory` and `DocViewer.Variant`
  like Mantine's components
- `controllerRef`, events (`onDocumentLoadStart`, `onDocumentLoad`, `onDocumentError`,
  `onFullscreenChange`), `controller.canPrint` and `controller.type`
- Styles API (including `attributes`), `variant="plain"`, dark pages, translatable `labels`
- Print, download, full screen
- Accessible: named regions, listbox thumbnails, announcements, keyboard shortcuts, high contrast

Requirements: React 19.2 or newer, Mantine 9.7 or newer (`@mantine/core`, `@mantine/hooks`,
`@mantine/code-highlight`), `pdfjs-dist` 6.5 or newer. Page edits use `@cantoo/pdf-lib`.

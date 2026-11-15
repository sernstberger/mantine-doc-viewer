# Roadmap to the next release

The next npm release waits until groups 1 to 4 are done. Each item comes from a `// MISSING:` note
in the app stories (`package/src/DocViewer/customized/`); the story names say where it was needed.
When an item lands, remove or rewrite those notes and use the new API in the story.

## 1. Annotations and page overlays

- [x] **Overlay slot per page** (`renderPageOverlay`) that scales and rotates with the page, for app content pinned to a
      position: resolved redlines (Clause), comment and risk pins (Dealroom), teacher's margin notes
      (Markbook), proof boxes for bleed, trim and safe area (Proofline)
- [x] **Markup tools** (`withMarkup`, `markupTool`, `markup`, `controller.saveMarkup`) saved into
      the PDF: highlight, text box, shapes, signature (Folio), clouds and RFI pins (Plan room; the
      pins are app content in `renderPageOverlay`), pencil marks for fingering (Stand)
- [x] **Signature placed on a page** (`markupTool="signature"`) and saved into the PDF (Haven)
- [x] **`onTextSelect(text, page, rects)`** (also `DocViewerPageRect`) so apps can comment on selected text (Dealroom)
- [x] **Highlight a passage from outside** the viewer, not only by searching for it: `controller.highlight` and
      `clearHighlight` (Dealroom)
- [x] **Scroll to a point in a page** (`goToPage(page, { top })`), not only its top (Clause)
- [x] **Slot beside or below a page** for slug text like "Front, page 1 of 2" (Proofline): overlay
      content can sit outside the page box

## 2. Layout props

- [x] **Toolbar slots** (`toolbarSubtitle`, `toolbarStartSection`, `renderToolbarTitle`): a subtitle under the
      title ("Edited", "Draft 4"), a left slot, and a title render prop so the title can be the current
      sheet (Folio, Dealroom, Plan room, Stand)
- [x] **Auto height** (`height="auto"`): the viewer grows to its pages and the page scrolls
      (Field Report). PDFs, text and code grow; images keep a minimum height
- [x] **Fit the whole page or spread** (`zoom: 'fit-page'`) (width and height), besides fit to width (Atrium, Stand)
- [x] **Controlled `fullscreen` prop** (Atrium): `fullscreen` and `onFullscreenChange`
- [x] **Responsive `thumbnailsPosition`**: left on desktop, bottom on phones (Gate): `thumbnailsPosition` takes `{ base, sm }` values
- [x] **Tap-to-toggle toolbar** (`tapToggleToolbar`) on touch screens, so a page can fill a phone (Gate)
- [x] **Overlay controls without a toolbar** (`withOverlayControls`): full screen and zoom for an
      embedded viewer (Field Report)
- [x] **Padding for the pages part that fit-to-width knows about**, so marks around pages never
      cause a horizontal scrollbar (Proofline): fit-to-width reads the padding of the `pages` element
- [x] **Spreads**: `goToSpread` and snapping by spread, plus built-in spread page turning (tap
      zones, swipe, pedal keys) (Stand, Atrium): `goToSpread`, `nextSpread`, `previousSpread`,
      `onSpreadChange`, `withScrollSnap`, `withPageTurning`
- [x] **Compact page editor bar** (`compactPageEditor`, `editorButton` Styles API part): a Styles API
      part for its buttons, and an icon-only variant for phones (Scanbox)

## 3. App hooks and controller

- [x] **`onDocumentLoadStart`** (Locker)
- [x] **`controller.canPrint` and `controller.type`** so apps can disable their own buttons (Locker)
- [x] **Richer `onDocumentLoad`**: `byteSize`, `mimeType`, `title` (Locker)
- [x] **`onLoad` and `onError` helpers for custom renderers** (from `useDocViewer`) instead of reaching into `events`
      (Locker)
- [x] **Delete pages from the sidebar**, with a trash button (`thumbnailDelete` part, `onSave`
      reason `'delete'`) or the Delete key (Folio, Scanbox). No swipe: it fights scrolling
- [x] **Get the bytes of the document as shown** (after edits) from the controller
      (`controller.getBytes()`), so an app's own Export button can save it (Scanbox)
- [ ] **Rotate one page and save it**; rotate only turns the view today (Folio) (partial: pdf.js
      `extractPages` cannot set a page's `/Rotate`, and it writes object streams, so the bytes cannot
      be patched without a PDF writer such as `pdf-lib`; needs a decision on that dependency)
- [x] **Swap the document without remounting** (`keepView`), keeping zoom and scroll (Markbook)
- [x] **Reading progress** (`onReadingProgress`, `onReachEnd`, `resetReadingProgress`): the fraction
      of each page seen, a reached-the-end signal, a reading position (Haven, Field Report)
- [x] **Kiosk** (`idleTimeout`, `onIdle`, `autoAdvance`): reset when idle, and an auto-advance attract
      mode (Atrium)
- [x] **Locale prop** (`locale`) for the number formats the viewer shows (Atrium)
- [x] **Responsive and controlled page layout** (`defaultPageLayout` per breakpoint, `pageLayout`,
      `onPageLayoutChange`): the page stays in view when it changes, so apps stop remounting the
      viewer at a breakpoint (Leaf, Stand, Proofline)
- [x] **Apps that turn pages themselves** (Leaf): `goToPage(page, { behavior: 'instant' })`,
      `controller.getPageCanvas(page)` to copy a drawn page, and `withScroll={false}`

## 4. Polish

- [x] Check search highlight colours in Safari and Firefox: WebKit and Firefox 159 (Playwright)
      draw default and custom `matchColor`/`activeMatchColor` like Chrome, active underline included
- [x] Swap the toolbar to Mantine's `Toolbar` (`controls` is now a `Toolbar`: one tab stop, arrow keys,
      Home and End), keeping soft-disabled buttons, per-control hiding and the `control` Styles API part
- [x] Documents open at the top of page 1: the first fit no longer scrolls into the page

## Probably out of scope (confirm before dropping)

- Keeping the screen awake at full brightness for a boarding pass: the host app's job (Gate)
- Crop, perspective correction and filters for scans (Scanbox)
- A measure tool calibrated to a sheet's scale, and overlaying two revisions of a sheet (Plan room)
- Reading a PDF's own tracked changes as data (Clause)

# Roadmap to the next release

The next npm release waits until groups 1 to 4 are done. Each item comes from a `// MISSING:` note
in the app stories (`package/src/DocViewer/customized/`); the story names say where it was needed.
When an item lands, remove or rewrite those notes and use the new API in the story.

## 1. Annotations and page overlays

- [x] **Overlay slot per page** (`renderPageOverlay`) that scales and rotates with the page, for app content pinned to a
      position: resolved redlines (Clause), comment and risk pins (Dealroom), teacher's margin notes
      (Markbook), proof boxes for bleed, trim and safe area (Proofline)
- [ ] **Markup tools** saved into the PDF: highlight, text box, shapes, signature (Folio), clouds
      and RFI pins (Plan room), pencil marks for fingering (Stand)
- [ ] **Signature placed on a page** and saved into the PDF (Haven)
- [ ] **`onTextSelect(text, page, rects)`** so apps can comment on selected text (Dealroom)
- [ ] **Highlight a passage from outside** the viewer, not only by searching for it (Dealroom)
- [ ] **Scroll to a point in a page** (`goToPage(page, { top })`), not only its top (Clause)
- [x] **Slot beside or below a page** for slug text like "Front, page 1 of 2" (Proofline): overlay
      content can sit outside the page box

## 2. Layout props

- [ ] **Toolbar slots**: a subtitle under the title ("Edited", "Draft 4"), a left slot, and a title
      render prop so the title can be the current sheet (Folio, Dealroom, Plan room, Stand)
- [ ] **Auto height** (`height="auto"`): the viewer grows to its pages and the page scrolls
      (Field Report)
- [ ] **Fit the whole page or spread** (width and height), besides fit to width (Atrium, Stand)
- [ ] **Controlled `fullscreen` prop** (Atrium)
- [ ] **Responsive `thumbnailsPosition`**: left on desktop, bottom on phones (Gate)
- [ ] **Tap-to-toggle toolbar** on touch screens, so a page can fill a phone (Gate)
- [ ] **Overlay controls without a toolbar** (`withOverlayControls`): full screen and zoom for an
      embedded viewer (Field Report)
- [ ] **Padding for the pages part that fit-to-width knows about**, so marks around pages never
      cause a horizontal scrollbar (Proofline)
- [ ] **Spreads**: `goToSpread` and snapping by spread, plus built-in spread page turning (tap
      zones, swipe, pedal keys) (Stand, Atrium)
- [ ] **Compact page editor bar**: a Styles API part for its buttons, and an icon-only variant for
      phones (Scanbox)

## 3. App hooks and controller

- [ ] **`onDocumentLoadStart`** (or a loading state) (Locker)
- [ ] **`controller.canPrint` and `controller.type`** so apps can disable their own buttons (Locker)
- [ ] **Richer `onDocumentLoad`**: byte size, MIME type, PDF title (Locker)
- [ ] **`onLoad` and `onError` helpers for custom renderers** instead of reaching into `events`
      (Locker)
- [ ] **Delete pages from the sidebar**, with a swipe or a trash button (Folio, Scanbox)
- [ ] **Get the bytes of the document as shown** (after edits) from the controller, so an app's
      own Export button can save it (Scanbox)
- [ ] **Rotate one page and save it**; rotate only turns the view today (Folio)
- [ ] **Swap the document without remounting**, keeping zoom and scroll (Markbook)
- [x] **Reading progress** (`onReadingProgress`, `onReachEnd`, `resetReadingProgress`): the fraction
      of each page seen, a reached-the-end signal, a reading position (Haven, Field Report)
- [x] **Kiosk** (`idleTimeout`, `onIdle`, `autoAdvance`): reset when idle, and an auto-advance attract
      mode (Atrium)
- [ ] **Locale prop** for the number formats the viewer shows (Atrium)

## 4. Polish

- [ ] Check search highlight colours in Safari and Firefox (only checked in Chrome)
- [ ] Swap the toolbar to Mantine's `Toolbar`, keeping soft-disabled buttons, per-control hiding
      and the `control` Styles API part

## Probably out of scope (confirm before dropping)

- Keeping the screen awake at full brightness for a boarding pass: the host app's job (Gate)
- Crop, perspective correction and filters for scans (Scanbox)
- A measure tool calibrated to a sheet's scale, and overlaying two revisions of a sheet (Plan room)
- Reading a PDF's own tracked changes as data (Clause)

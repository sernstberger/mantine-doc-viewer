# Restructure plan: mantine-doc-viewer in the shape of Mantine's official extensions

Status: decided, not started. Written before the first release; every change below is allowed to
break the current API. Reference: Mantine monorepo at 9.8.0 (`@mantine/lightbox` for the compound
shape and the store, `@mantine/code-highlight` for the engine adapter, `@mantine/core` Pagination
and Modal for part statics and `*Props` passthroughs, `@mantine-tests/core` for tests).

Owner decisions this plan takes as given:

| Decision | Source |
| --- | --- |
| Restructure now, before 0.1.0 | owner |
| Editor and markup become subpath entries `mantine-doc-viewer/editor`, `mantine-doc-viewer/markup` | owner |
| Kiosk/idle becomes a documented recipe with `useIdle` / `useInterval` | owner |
| Mantine's own code style: no inline logic comments, JSDoc on public API only | owner, Mantine AGENTS.md |
| Zero warnings (oxlint `--deny-warnings`, no console output in tests) | owner |
| Commits use Mantine's format: `[mantine-doc-viewer] Part: message`, `[docs] ...`, `[core] ...` | owner (lead, b0300e2) |
| Docs: no Markdown pipe tables, text before every demo | owner (lead, b0300e2), Mantine AGENTS.md |
| Each component ≤ about 30 own props (Lightbox Root 24, Pagination 30, CodeHighlight 22) | Mantine's measure |

Governing principle (owner): **match Mantine.** For every decision the pattern the Mantine monorepo
and its official extensions use for the same thing wins. Every place the design still differs is
listed in section 11 (Deviations) with the concrete reason the Mantine pattern cannot cover it;
a difference without such a reason is a bug in this plan. Every decision has a **Why** line.

---

## 0. Shape at a glance

```
<DocViewerAdapterProvider pdf={createPdfJsAdapter(() => import('pdfjs-dist'), { workerSrc })}>
  <DocViewer src="/contract.pdf" />                       simple, like <Lightbox /> (LightboxBase)

  <DocViewer.Root src="/contract.pdf" store={store} extensions={[markup]}>   compound, like Lightbox.Root
    <DocViewer.Toolbar>
      <DocViewer.Title subtitle="Draft 4" />
      <DocViewer.PageControls />
      <DocViewer.ZoomControls />
      <DocViewerMarkupButton />                            from mantine-doc-viewer/markup
      <DocViewer.DownloadButton />
    </DocViewer.Toolbar>
    <DocViewer.Search />
    <DocViewerMarkupBar />
    <DocViewer.Main>
      <DocViewer.Thumbnails />
      <DocViewer.Pages renderPageOverlay={...} />
    </DocViewer.Main>
  </DocViewer.Root>
</DocViewerAdapterProvider>

const [store, viewer] = useDocViewer();                    per-instance store + bound actions
const { page } = useDocViewerStore(store);
viewer.goToPage(3);
```

| Layer | Owns | Mantine analogue |
| --- | --- | --- |
| `DocViewerAdapterProvider` | engines (pdf.js, markdown) | `CodeHighlightAdapterProvider` |
| `DocViewer.Root` | file, Styles API, CSS vars, labels, shared state triads, the store, extensions | `Lightbox.Root`, `Pagination.Root` |
| parts (statics) | one piece of UI each, `compound: true`, read state through narrow store selectors | `Lightbox.Toolbar`, `Pagination.Control` |
| `DocViewer` | `Root` + `children ?? defaultLayout(type)` + a few composition props | `LightboxBase` |
| store | readable view state + actions | `createLightboxStore`, `createLightbox` |
| extensions | editor and markup, from subpaths, plugged into slots | `CodeHighlight` adapters (object handed in by the app) |

---

## 1. Target public API

### 1.1 `DocViewer.Root`

```ts
export interface DocViewerRootProps
  extends BoxProps, StylesApiProps<DocViewerRootFactory>, ElementProps<'div', 'color'> {
  /** Url of the document: a regular url, blob url or data url */
  src: string;
  /** Document type, detected from `mimeType`, `fileName` or `src` when not set */
  type?: DocViewerType;
  mimeType?: string;
  /** File name shown in the title and used for downloads, taken from `src` by default */
  fileName?: string;
  /** Keeps zoom, rotation, layout and scroll when `src` changes to a document of the same type, `false` by default */
  keepView?: boolean;
  /** BCP 47 tag for numbers and dates, the browser's language by default */
  locale?: string;
  labels?: Partial<DocViewerLabels>;
  /** Store created with `createDocViewer` / `useDocViewer`, an internal one by default */
  store?: DocViewerStore;
  /** Extensions from `mantine-doc-viewer/editor` and `mantine-doc-viewer/markup` */
  extensions?: DocViewerExtension[];
  /** Size of toolbar, buttons and text, `'sm'` by default */
  size?: MantineSize;
  radius?: MantineRadius;
  /** Accent colour of pressed buttons, current thumbnail and focus outlines, `theme.primaryColor` by default */
  color?: MantineColor;
  /** Makes the viewer as tall as its content so the window scrolls, `false` by default. Fixed heights use `h` */
  autosize?: boolean;
  /** Colour behind PDF pages and thumbnails, white by default */
  pageBackground?: MantineColor;
  /** `'light'` (default) | `'dark'` (inverted) | `'auto'` (follows the color scheme) */
  pageColorScheme?: 'light' | 'dark' | 'auto';
  /** PDF page thumbnails are shown when a PDF opens, `false` by default */
  defaultThumbnailsOpened?: boolean;
  /** Side the thumbnails start on, `'left'` by default */
  defaultThumbnailsPosition?: DocViewerThumbnailsPosition;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  zoom?: DocViewerZoom;
  defaultZoom?: DocViewerZoom;
  onZoomChange?: (zoom: DocViewerZoom, details: { scale: number }) => void;
  pageLayout?: DocViewerPageLayout;
  defaultPageLayout?: DocViewerPageLayout;
  onPageLayoutChange?: (layout: DocViewerPageLayout) => void;
  fullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  onDocumentLoad?: (info: DocViewerLoadInfo) => void;
  onDocumentError?: (error: Error) => void;
  /** Viewer content: parts. Required on Root, optional on DocViewer */
  children: React.ReactNode;
}
```

31 own props (Lightbox Root: 24 counting `children`; "about 30"). Root renders a `Box` with `root` and the
`data-size`, `data-fullscreen`, `data-auto-height`, `data-doc-type`, `data-page-color-scheme` mods,
the context provider and, for PDFs, the internal PDF session provider (section 3.4).

**Why state stays on Root:** page, zoom, page layout and thumbnails are read and changed by several
sibling parts (toolbar controls, pages, thumbnails, keyboard), and Mantine keeps shared state on
the root (Tabs `value`, Pagination `value`, Lightbox `currentIndex` and thumbnails visibility).
**Why no responsive (breakpoint object) props at all:** Mantine core never takes breakpoint objects
for `size`, `gap` or component state; apps use `useMatches` from `@mantine/core`. `DocViewerResponsive`
and `use-resolved-props.ts` are deleted. The old "responsive default layout that follows the screen
until the reader picks one" becomes the documented recipe
`const auto = useMatches({ base: 'single', sm: 'two-page' }); const [picked, setPicked] = useState<DocViewerPageLayout | null>(null);`
`pageLayout={picked ?? auto} onPageLayoutChange={setPicked}`.
**Why `tooltipProps` left Root:** Mantine propagates shared child settings from the container that
holds the children (core `Toolbar` propagates `size`, `radius`, `color` to its toggles), so
`tooltipProps` lives on `DocViewer.Toolbar` (propagated to the controls inside it through the toolbar
context), `DocViewer.OverlayControls` and `DocViewer.Search`.
**Why `autosize` replaces `height`:** `height` duplicated the `h` style prop; only the `'auto'`
mode was new. Mantine's name for "grow with the content" is Textarea's `autosize`; fixed sizes use `h`/`mih`/`mah` like any Box.

`DocViewerRootStylesNames` = the full `DocViewerStylesNames` union (section 1.6), like
`LightboxRootStylesNames`, so `classNames` on Root or on `DocViewer` reaches every part.

### 1.2 `DocViewer` (simple, `LightboxBase`-style)

```ts
export interface DocViewerProps extends Omit<DocViewerRootProps, 'children'> {
  /** Custom layout, replaces the default layout for the document type */
  children?: React.ReactNode;
  /** `true` by default */
  withToolbar?: boolean;
  /** Toolbar and overlay controls to hide, for example `{ print: false, rotate: false }` */
  toolbarControls?: Partial<Record<DocViewerControl, boolean>>;
  /** Zoom and full screen buttons floating over the document, `false` by default */
  withOverlayControls?: boolean;
  toolbarProps?: Omit<DocViewerToolbarProps, 'controls' | 'children'>;
  pagesProps?: DocViewerPagesProps;
  thumbnailsProps?: DocViewerThumbnailsProps;
  searchProps?: DocViewerSearchProps;
  imageProps?: DocViewerImageProps;
  /** Applied to whichever of Text, Code or Markdown is shown */
  textProps?: DocViewerTextViewProps;
}

export type DocViewerFactory = Factory<{
  props: DocViewerProps;
  ref: HTMLDivElement;
  stylesNames: DocViewerStylesNames;
  vars: DocViewerCssVariables;
  variant: DocViewerVariant;
  staticComponents: { Root; Toolbar; Title; PageControls; ZoomControls; ThumbnailsButton;
    RotateButton; LayoutMenu; OutlineButton; InfoButton; PresentationButton; SearchButton;
    PrintButton; DownloadButton; FullscreenButton; WrapButton; ViewModeControl; Main; Body; Pages;
    Thumbnails; Search; Outline; DocumentInfo; PresentationControls; OverlayControls; Image; Text;
    Code; Markdown; Message; Loading };
}>;
```

10 own props on top of Root's (Lightbox adds 3; the extra are Mantine `*Props` passthroughs like
Modal's `closeButtonProps`). Render: `<DocViewerRoot {...rootProps}>{children ?? <DefaultLayout/>}</DocViewerRoot>`;
`null`/`undefined` children fall back to the default layout, so `children={isCsv ? <Csv/> : null}` works.

Default layout by type (internal `DocViewerDefaultLayout`, reads `type` from context):

| Type | Layout |
| --- | --- |
| pdf | `Toolbar` (default PDF controls) · `Search` · extension bars · `Main` (`Thumbnails`, `Pages`, `PresentationControls`) · `OverlayControls`? |
| image | `Toolbar` (zoom, rotate) · `Image` · `OverlayControls`? |
| text | `Toolbar` (wrap) · `Text` |
| code | `Toolbar` (view mode for JSON) · `Code` |
| markdown | `Toolbar` (view mode) · `Markdown` |
| unknown, or pdf/markdown without an adapter | `Toolbar` · `Body` > `Message withDownload` (`labels.unsupported`) |

Displayed name `'mantine-doc-viewer/DocViewer'`; each part `'mantine-doc-viewer/DocViewer<Part>'`.
**Why:** official extensions prefix displayName with the package (`'@mantine/lightbox/Lightbox'`).

### 1.3 Toolbar parts

All parts: `factory<…Factory>` with `compound: true`, `CompoundStylesApiProps`, `useProps('DocViewer<Part>', defaultProps, props)`,
`ctx.getStyles(selector, { className, style, classNames, styles })`, `ref` as a prop (React 19, no
forwardRef), `...others` spread onto the root element (so `data-*`, `aria-*`, ActionIcon props pass through).
**Why:** exactly `LightboxToolbar` / `PaginationControl`; also replaces the requested
`getControlProps` passthrough (api-shape-4): each button is its own component, so apps set `variant`,
`data-testid`, `aria-*` on it directly.

```ts
interface DocViewerToolbarProps extends BoxProps, CompoundStylesApiProps<…>, ElementProps<'div'> {
  /** Toolbar content; without children the default controls for the document type are rendered */
  children?: React.ReactNode;
  /** Default controls to hide (ignored with children) */
  controls?: Partial<Record<DocViewerControl, boolean>>;
  /** Content before the title, for example a menu button */
  leftSection?: React.ReactNode;
  /** Content after the document controls, before print, download and full screen */
  rightSection?: React.ReactNode;
  /** Replaces the file name in the default title */
  title?: React.ReactNode;
  /** Small text under the title */
  subtitle?: React.ReactNode;
  /** Tapping the document with a finger hides and shows the toolbar, `false` by default */
  toggleOnTap?: boolean;
  /** Props passed to the tooltip of every control inside the toolbar */
  tooltipProps?: Omit<TooltipProps, 'label' | 'children'>;
}
// stylesNames: 'toolbar' | 'toolbarSection' | 'controls'   (8 own props)

interface DocViewerTitleProps { title?: React.ReactNode; subtitle?: React.ReactNode }
// stylesNames: 'heading' | 'title' | 'subtitle'

// Controls: each is an ActionIcon-based factory; own props listed, ActionIcon props pass through.
DocViewer.PageControls      {}                                  'pageIndicator' | 'control'
DocViewer.ZoomControls      { withMenu?: boolean }              'zoomLevel' | 'dropdown' | 'control'   (pdf and image)
DocViewer.ThumbnailsButton  { withPositionMenu?: boolean }      'control' | 'dropdown'
DocViewer.RotateButton      {}                                  'control'                              (pdf and image)
DocViewer.LayoutMenu        { layouts?: DocViewerPageLayout[] } 'control' | 'dropdown'
DocViewer.OutlineButton     {}                                  'control' | 'dropdown'  (popover with DocViewer.Outline)
DocViewer.InfoButton        {}                                  'control' | 'dropdown'  (popover with DocViewer.DocumentInfo)
DocViewer.PresentationButton{}                                  'control'
DocViewer.SearchButton      {}                                  'control'
DocViewer.PrintButton       {}                                  'control'
DocViewer.DownloadButton    {}                                  'control'
DocViewer.FullscreenButton  {}                                  'control'
DocViewer.WrapButton        {}                                  'control'               (text)
DocViewer.ViewModeControl   {}                                  'viewMode'              (markdown, JSON)
```

Every control renders `null` when it does not apply to the current document (a `PageControls` in an
image viewer, a `FullscreenButton` where the browser has no full screen), so one custom toolbar works
for every type. Controls read state with narrow selectors and act through store actions, never
through props from the toolbar.
**Why:** the five toolbar slot props and `toolbarControls` become plain composition; Lightbox
`toolbarItems` was considered and rejected because our controls are not uniform icon buttons
(page input, zoom menu, layout menu), so item objects would need render functions anyway.

`DocViewerControl` keeps its union (`'title' | 'thumbnails' | 'pages' | 'zoom' | 'rotate' | 'layout' |
'outline' | 'info' | 'presentation' | 'editPages' | 'markup' | 'search' | 'print' | 'download' |
'fullscreen' | 'wrap' | 'viewMode'`); `editPages` and `markup` hide the extensions' buttons.

### 1.4 Document parts

```ts
DocViewer.Main         { children?: React.ReactNode }
  // the row under the toolbar; without children: Thumbnails + Pages + PresentationControls in the
  // DOM order the thumbnails position needs. While an extension mode is active (page editor) it
  // renders that extension's screen instead.            stylesNames: 'main'

DocViewer.Body         { focusable?: boolean; children?: React.ReactNode }
  // generic named, focusable scroll region for custom views (was DocViewerBody)   'body'

interface DocViewerPagesProps {             // PDF pages inside a Body; 15 own props
  gap?: MantineSpacing;                       // was pageGap, 'md' by default
  maxCanvasPixels?: number;                   // 16_777_216 by default
  withScroll?: boolean;                       // true by default
  withScrollSnap?: boolean;
  withPageTurning?: boolean | DocViewerPageTurning;
  renderPageOverlay?: DocViewerRenderPageOverlay;
  matchColor?: MantineColor;
  activeMatchColor?: MantineColor;
  passwordInputProps?: DocViewerPasswordInputProps;
  onLinkClick?: (url: string, event: MouseEvent) => void;
  onTextSelect?: (text: string, details: { page: number; rects: DocViewerPageRect[] }) => void;
  onReadingProgress?: (progress: DocViewerReadingProgress) => void;
  onReachEnd?: () => void;
}
// stylesNames: 'body' | 'pages' | 'page' | 'canvas' | 'textLayer' | 'linkLayer' | 'pageOverlay'
//   | 'highlightLayer' | 'highlight' | 'empty' | 'password' | 'passwordInput' | 'passwordSubmit'
// sets --doc-viewer-page-gap, --doc-viewer-match-color, --doc-viewer-active-match-color with __vars

interface DocViewerThumbnailsProps {        // 1 own prop
  width?: number;                             // was thumbnailWidth, 112 by default
}
// stylesNames: 'thumbnails' | 'thumbnail' | 'thumbnailImage' | 'thumbnailLabel'
//   (+ 'thumbnailDelete' | 'dragHandle' rendered by the editor extension's slot)
// sets --doc-viewer-thumbnails-width with __vars

DocViewer.Search       { inputProps?: DocViewerSearchInputProps; tooltipProps?: … }   // shown while search is open
  // 'search' | 'searchInput' | 'searchCount' | 'searchOption' | 'control'
DocViewer.Outline      { }                  // outline tree; standalone (sidebar) or inside OutlineButton
  // 'outline' | 'outlineList' | 'outlineItem'
DocViewer.DocumentInfo { }                  // properties, attachments, layers
  // 'documentInfo' | 'documentHeading' | 'documentLayer' | 'properties'
DocViewer.PresentationControls { }          // shown while presenting      'presentationControls' | 'control'
DocViewer.OverlayControls { controls?: Partial<Record<DocViewerControl, boolean>>; tooltipProps?: … }
  // 'overlayControls' | 'overlayControl'
DocViewer.Image        { alt?: string }     // 'image' | 'imageStage' | 'imageCanvas' | 'imageFrame' | 'imageOverlay'
DocViewer.Text         { maxSize?: number } // 'body' | 'text' | 'empty'
DocViewer.Code         { maxSize?: number; language?: string; codeHighlightProps?: … }  // 'body' | 'code' | 'empty'
DocViewer.Markdown     { maxSize?: number; codeHighlightProps?: … }                     // 'body' | 'markdown' | 'code' | 'empty'
DocViewer.Message      { children; withDownload?: boolean; error?: boolean }            // 'empty'
DocViewer.Loading      { }                                                              // 'empty'
```

`DocViewerTextViewProps = Partial<DocViewerTextProps & DocViewerCodeProps & DocViewerMarkdownProps>` (the simple component's `textProps`).

**Why no `DocViewer.Csv`:** the viewer has no CSV view today (CSV is `text`); the Locker story's
table is an app view. Adding a parser during a restructure is scope creep; CSV stays the documented
custom-view recipe (`children` + `DocViewer.Body` + `useDocViewerText`).
**Why `alt` moved to `Image`:** images are its only reader; it frees a Root slot. It still
defaults to `fileName`.
**Why thumbnails have only defaults on Root, no controlled pair:** Lightbox keeps thumbnails
visibility as Root-internal state with no controlled prop; the store makes opened/position readable
and settable (`toggleThumbnails`, `setThumbnailsPosition`). The `ThumbnailsButton` renders `null`
when no `Thumbnails` part is mounted, like Lightbox's toolbar omits the thumbnails item without
`withThumbnails`.
**Why `__vars`:** part-level CSS variables from part props are set exactly as `Tabs.Tab` sets
`--tabs-color` (`__vars={{ '--tabs-color': … }}`).

### 1.5 Extensions (subpaths)

```ts
// mantine-doc-viewer/editor
createPageEditorExtension(options?: {
  /** Buttons show only icons, labels in tooltips, `false` by default (was compactPageEditor) */
  compact?: boolean;
  /** Thumbnails can be dragged to reorder and deleted, `true` by default */
  withThumbnailEditing?: boolean;
  /** Bytes of the changed document; without it the edit only changes what is shown (save downloads) */
  onDocumentChange?: (bytes: Uint8Array, details: { reason: 'save' | 'reorder' | 'delete'; pages: number[] }) => void | Promise<void>;
  /** Bytes of extracted pages; without it they are downloaded */
  onExtract?: (bytes: Uint8Array, details: { pages: number[] }) => void | Promise<void>;
  labels?: Partial<DocViewerPageEditorLabels>;
}): DocViewerExtension;
DocViewerPageEditor        // the editor screen (part; Main shows it automatically)   'editor' | 'editorBar' | 'editorTitle' | 'editorCount' | 'editorPages' | 'editorPage' | 'editorButton'
DocViewerPageEditorButton  // toolbar control (control key 'editPages')
openPageEditor(store), closePageEditor(store)
DEFAULT_LABELS, types DocViewerPageEditorLabels, DocViewerPageEditorOptions

// mantine-doc-viewer/markup
createMarkupExtension(options?: {
  tools?: DocViewerMarkupTool[];
  tool?: DocViewerMarkupTool | null; defaultTool?: DocViewerMarkupTool | null;
  onToolChange?: (tool: DocViewerMarkupTool | null) => void;
  value?: DocViewerMark[]; defaultValue?: DocViewerMark[]; onChange?: (marks: DocViewerMark[]) => void;
  color?: MantineColor; width?: number; fontSize?: number;
  onDocumentChange?: (bytes: Uint8Array, details: { reason: 'annotate'; pages: number[] }) => void | Promise<void>;
  labels?: Partial<DocViewerMarkupLabels>;
}): DocViewerExtension;                                   // 12 options
DocViewerMarkupBar     // 'markupBar' | 'markupDivider' | 'markupSave' | 'control'
DocViewerMarkupButton  // toolbar control (control key 'markup')
setMarkupTool(tool, store), saveMarkup(store)
DEFAULT_LABELS, types DocViewerMark*, DocViewerMarkupTool, DocViewerMarkupLabels, DocViewerMarkupOptions
// page layer selectors 'markupLayer' | 'markupText' | 'markupInput' are rendered through the Pages slot
```

`create*Extension` is called during render, like Lightbox's `createFullscreenToolbarItem`; options may
change every render (controlled `value`, callbacks). The core reads options through the extension
context with the same memoisation `useMarkup` has today, so a new options object does not re-render
pages (render-count test, section 6).

**Why extensions instead of children:** the simple `DocViewer` needs editor and markup in its
default layout without the core importing them. An object the app hands in is the code-highlight
pattern (`createShikiAdapter` → provider). Custom layouts still place the subpath parts explicitly.

### 1.6 Styles API and CSS variables

`DocViewerStylesNames` (full union, on Root): the current 63 names, with these changes:

| Current | New | Why |
| --- | --- | --- |
| `toolbarStart` | `toolbarSection` + `data-position="left"`/`"right"` | Mantine's `section` + `data-position` (Button, Input); `rightSection` now has a selector too |
| (none) | `heading` kept, `main` kept | unchanged |
| all others | unchanged | no reason to churn |

`DocViewerCssVariables`:

```ts
{ root: '--doc-viewer-radius' | '--doc-viewer-color' | '--doc-viewer-font-size'
      | '--doc-viewer-toolbar-height' | '--doc-viewer-page-background' }
```

Set by parts with `__vars` (the `Tabs.Tab` pattern; documented on the Styles API page):
`--doc-viewer-page-gap`, `--doc-viewer-match-color`, `--doc-viewer-active-match-color` (Pages),
`--doc-viewer-thumbnails-width` (Thumbnails, renamed from `--doc-viewer-thumbnail-width` to match the part).

### 1.6b Labels

Lightbox's pattern exactly: `labels?: Partial<DocViewerLabels>` on Root, every key ends in `Label`
(`downloadLabel`, `enterFullscreenLabel`, `pageLabel: (page, total) => string`), exported as
`DEFAULT_LABELS` from each entry (core, `/editor`, `/markup`), like `@mantine/lightbox`'s
`DEFAULT_LABELS`. The ~80 current keys get the suffix by codemod in lane 1a (`document` →
`documentLabel`, `zoomIn` → `zoomInLabel`, …); nested records (property names, tool names) stay
records under a `…Labels` key and are merged one level deep (api-shape-11a).

Behaviour classes (`DocViewer.behavior.module.css`, kept even with `unstyled`) stay as they are.

### 1.7 The five pending renames

| Current | Decision | Mantine convention it follows |
| --- | --- | --- |
| `thumbnailWidth` | `DocViewer.Thumbnails width` (`thumbnailsProps.width`) | a part's props drop the part name (`Lightbox.Thumbnails`, `Pagination.Control`); one noun per feature |
| `toolbarSection` | `DocViewer.Toolbar rightSection` (and `toolbarStartSection` → `leftSection`) | `leftSection`/`rightSection` on Button, Input, Badge |
| `tapToggleToolbar` | `DocViewer.Toolbar toggleOnTap` | `<verb>On<Event>` booleans: `closeOnEscape`, `closeOnClickOutside` |
| `onSave` | editor `onDocumentChange` (reasons `save`/`reorder`/`delete`) + `onExtract`; markup `onDocumentChange` (reason `annotate`) | `on<Noun>Change` for a changed value; extract makes a new document, so it is its own event |
| `detectDocType` | `getDocViewerType` (input type `DocViewerTypeInput`) | pure derivations are `get*` (`getThemeColor`, `getRadius`); every export carries the `DocViewer` prefix |

### 1.8 Mapping: all 84 current props

Current count: 62 own + 11 `DocViewerEvents` + 11 `DocViewerMarkupProps` = 84 (the brief's 82
predates `searchInputProps` and `passwordInputProps`).

| # | Current prop | New home | Why |
| --- | --- | --- | --- |
| 1 | `src` | Root | document identity |
| 2 | `type` | Root | detection override |
| 3 | `mimeType` | Root | detection input |
| 4 | `fileName` | Root | title + download name |
| 5 | `alt` | `Image alt` | only images read it |
| 6 | `keepView` | Root | applies to every type |
| 7 | `locale` | Root | all number/date formatting |
| 8 | `labels` | Root (core keys); editor/markup keys move to extension `labels` | each entry owns its text |
| 9 | `pdfWorkerSrc` | `createPdfJsAdapter(…, { workerSrc })` | engine setup belongs to the adapter |
| 10 | `pdfOptions` | `createPdfJsAdapter(…, { options })`, object or `(src) => options` | per-document headers still possible |
| 11 | `maxCanvasPixels` | `Pages` | drawing pages |
| 12 | `defaultPageLayout` | Root, plain value | shared state; no breakpoint objects (1.1) |
| 13 | `pageLayout` | Root, plain value | same |
| 14 | `defaultThumbnailsOpened` | Root | Root-owned state, like Lightbox thumbnails |
| 15 | `thumbnailsOpened` | removed → `state.thumbnailsOpened` + `toggleThumbnails(opened)` | Lightbox has no controlled thumbnails; store covers read/write |
| 16 | `onThumbnailsOpenedChange` | removed → `useDocViewerStore(store).thumbnailsOpened` | as above |
| 17 | `thumbnailsPosition` | removed → `defaultThumbnailsPosition` + `setThumbnailsPosition` | as above; no story vetoes a move |
| 18 | `defaultThumbnailsPosition` | Root, plain value | Root-owned state |
| 19 | `onThumbnailsPositionChange` | removed → `state.thumbnailsPosition` | as above |
| 20 | `maxTextSize` | `Text/Code/Markdown maxSize` | text family only |
| 21 | `language` | `Code language` | code only |
| 22 | `radius` | Root | vars |
| 23 | `size` | Root, plain `MantineSize` | core never takes breakpoint objects for size; use `useMatches` |
| 24 | `color` | Root | accent for all parts |
| 25 | `matchColor` | `Pages` | highlights are drawn in pages |
| 26 | `activeMatchColor` | `Pages` | same |
| 27 | `pageGap` | `Pages gap`, plain `MantineSpacing` | part prop; `useMatches` for responsive |
| 28 | `thumbnailWidth` | `Thumbnails width`, plain number | rename (1.7) |
| 29 | `tooltipProps` | `Toolbar` (propagated to its controls), `OverlayControls`, `Search` | core `Toolbar` propagates child settings from the container |
| 30 | `searchInputProps` | `Search inputProps` | part prop |
| 31 | `passwordInputProps` | `Pages passwordInputProps` | the prompt renders in the pages body |
| 32 | `codeHighlightProps` | `Code` / `Markdown` | text family |
| 33 | `controllerRef` | removed → `store` + actions (section 3) | refs are for DOM nodes in Mantine |
| 34 | `page` | Root | shared state |
| 35 | `defaultPage` | Root | shared state |
| 36 | `defaultZoom` | Root | shared by pdf and image |
| 37 | `zoom` | Root | same |
| 38 | `withPageTurning` | `Pages` | body behaviour |
| 39 | `withScrollSnap` | `Pages` | body behaviour |
| 40 | `withScroll` | `Pages` (name kept) | body behaviour; rename had low value (api-shape-12) |
| 41 | `withPageEditing` | `extensions={[createPageEditorExtension()]}` | subpath |
| 42 | `compactPageEditor` | editor option `compact` | subpath; prefix dropped |
| 43 | `onSave` | editor `onDocumentChange` + `onExtract`; markup `onDocumentChange` | rename (1.7) |
| 44 | `withFullscreen` | removed: omit `FullscreenButton`; simple: `toolbarControls={{ fullscreen: false }}` hides toolbar and overlay buttons | composition replaces the switch |
| 45 | `fullscreen` | Root | shared state |
| 46 | `onFullscreenChange` | Root | shared state |
| 47 | `renderers` | removed → `children` (`children ?? default`) | Lightbox `children` override; no test/render indirection |
| 48 | `toolbarSection` | `Toolbar rightSection` | rename (1.7) |
| 49 | `toolbarStartSection` | `Toolbar leftSection` | rename (1.7) |
| 50 | `toolbarSubtitle` | `Toolbar subtitle` / `Title subtitle` | part prop |
| 51 | `renderToolbarTitle` | `Toolbar title` / `Title title` (ReactNode) | the app knows the file name; a node is simpler than a callback |
| 52 | `renderPageOverlay` | `Pages` | drawn per page |
| 53 | `tapToggleToolbar` | `Toolbar toggleOnTap` | rename (1.7) |
| 54 | `withOverlayControls` | `DocViewer` composition prop; `DocViewer.OverlayControls` part | composition |
| 55 | `idleTimeout` | removed → `useIdle` recipe | owner decision |
| 56 | `onIdle` | removed → `useIdle` recipe | owner decision |
| 57 | `autoAdvance` | removed → `useInterval` + `nextSpread({ loop: true })` recipe | owner decision |
| 58 | `toolbarControls` | `DocViewer toolbarControls`; `Toolbar controls`; `OverlayControls controls` | hide map for default content only |
| 59 | `pageBackground` | Root | pages and thumbnails both use it |
| 60 | `pageColorScheme` | Root | same |
| 61 | `withToolbar` | `DocViewer` composition prop | compound users omit the part |
| 62 | `height` | Root `autosize` + `h` style prop | api-shape-5 |
| 63 | `onDocumentLoadStart` | removed → `state.status === 'loading'` | readable state beats a reset event |
| 64 | `onDocumentLoad` | Root | Mantine `onLoad`-style event |
| 65 | `onDocumentError` | Root | same |
| 66 | `onPageChange` | Root | triad |
| 67 | `onSpreadChange` | removed → `state.spread` (`{ index, pages }`, stable object) | readable state; Atrium and Stand get shorter |
| 68 | `onZoomChange` | Root | triad; fires for every request in controlled mode (api-shape-1 fix in lane 1) |
| 69 | `onPageLayoutChange` | Root | triad |
| 70 | `onReadingProgress` | `Pages` | computed from page observers |
| 71 | `onReachEnd` | `Pages` | same |
| 72 | `onLinkClick` | `Pages` | links live in pages |
| 73 | `onTextSelect` | `Pages`, `(text, { page, rects })` | api-shape-7: room to grow |
| 74 | `withMarkup` | `extensions={[createMarkupExtension()]}` | subpath |
| 75 | `markupTools` | markup option `tools` | prefix dropped inside the extension |
| 76 | `markupTool` | markup `tool` | same |
| 77 | `defaultMarkupTool` | markup `defaultTool` | same |
| 78 | `onMarkupToolChange` | markup `onToolChange` | same |
| 79 | `markup` | markup `value` | Mantine value/defaultValue/onChange |
| 80 | `defaultMarkup` | markup `defaultValue` | same |
| 81 | `onMarkupChange` | markup `onChange` | same |
| 82 | `markupColor` | markup `color` | prefix dropped |
| 83 | `markupWidth` | markup `width` | prefix dropped |
| 84 | `markupFontSize` | markup `fontSize` | prefix dropped |

### 1.9 Mapping: controller methods → store state / actions

| `DocViewerController` | New | Notes |
| --- | --- | --- |
| `goToPage(page, options)` | `actions.goToPage(page, options)` | same options |
| `highlight(target)` / `clearHighlight()` | `actions.highlight` / `actions.clearHighlight` | |
| `goToSpread(spread)` | `actions.goToSpread` | |
| `nextSpread()` / `previousSpread()` | `actions.nextSpread({ loop? })` / `actions.previousSpread({ loop? })` | `loop` absorbs `autoAdvance.loop` (uses `getNextPage`) |
| `setZoom`, `zoomIn`, `zoomOut` | same names | pdf and image |
| `setPageLayout` | same | |
| `rotate` | same | |
| `openSearch(query?)` / `closeSearch()` | same | |
| `toggleThumbnails(opened?)` | same | plus new `setThumbnailsPosition(position)` |
| `togglePresentation()` | same | |
| `editPages()` | `openPageEditor(store)` from `/editor` | subpath |
| `setMarkupTool(tool)` | `setMarkupTool(tool, store)` from `/markup` | subpath |
| `saveMarkup()` | `saveMarkup(store)` from `/markup` | subpath |
| `getOutline()` | `actions.getOutline()` | async data, stays an action |
| `getBytes()` | `actions.getBytes()` | |
| `getPageCanvas(page)` | `actions.getPageCanvas(page)` | |
| `print()` / `download()` | same | |
| `toggleFullscreen()` | same | |
| `canPrint` (getter) | `state.canPrint` | readable + subscribable |
| `type` (getter) | `state.type` | |
| `resetReadingProgress()` | same | |

### 1.10 Mapping: current exports

| Export | New | Why |
| --- | --- | --- |
| `DocViewer` | kept: simple component with statics | LightboxBase |
| `DocViewerProps`, `DocViewerFactory`, `DocViewerStylesNames`, `DocViewerCssVariables`, `DocViewerVariant` | kept (new shapes) | |
| `DocViewerThumbnailsPosition`, `DocViewerPageLayout`, `DocViewerControl`, `DocViewerZoom` | kept | |
| `DocViewerSearchInputProps`, `DocViewerPasswordInputProps` | kept | used by Search / Pages props |
| `DocViewerAutoAdvance` | removed | recipe |
| `DocViewerResponsive` | removed | `useMatches` (1.1) |
| `detectDocType` / `DocViewerDetectTypeInput` | `getDocViewerType` / `DocViewerTypeInput` | 1.7 |
| `DocViewerType` | kept | |
| `DOC_VIEWER_DEFAULT_LABELS`, `DocViewerLabels` | `DEFAULT_LABELS` (keys suffixed `Label`), `DocViewerLabels` core keys only | Lightbox `DEFAULT_LABELS` (1.6b) |
| `DocViewerToolbar`, `DocViewerToolbarProps` | kept as factory part (+ static) | |
| `DocViewerTooltip` | removed from exports | Lightbox exports no helper components; custom controls use Mantine `Tooltip` and `getStyles('control')` from `useDocViewerContext()` |
| `DocViewerMessage`, `DocViewerLoading`, `DocViewerMessageProps` | kept as factory parts | |
| `DocViewerBody`, `DocViewerBodyProps` | kept as factory part | |
| `useDocViewer` (context reader) | renamed `useDocViewerContext`; `useDocViewer` now creates `[store, actions]` | Mantine: `useX` creates, `useXContext` reads (finding 4) |
| `DocViewerFile`, `DocViewerRenderer` | removed | `children` replaces renderers |
| `useDocViewerText`, `DocViewerTextState` | kept | custom text views (CSV recipe) |
| `DocViewerPdfOptions` | `DocViewerPdfJsOptions` (adapter options) | |
| `DocViewerPageTurning`, `DocViewerRenderPageOverlay`, `DocViewerPageOverlayInfo`, `DocViewerPageRect` | kept | |
| `DocViewerRenderToolbarTitle`, `DocViewerToolbarTitleInfo` | removed | `title` is a node |
| `DocViewerMark*`, `DocViewerMarkupTool`, `DocViewer*Mark` | moved to `/markup` | |
| `DocViewerMarkupProps` | `DocViewerMarkupOptions` in `/markup` | |
| `DocViewerController` | `DocViewerActions` | |
| `DocViewerEvents` | removed (events are props of Root / Pages) | |
| `DocViewerLoadStartInfo` | removed | `state.status` |
| `DocViewerGoToPageOptions`, `DocViewerHighlightTarget`, `DocViewerLoadInfo`, `DocViewerOutlineItem`, `DocViewerReadingProgress` | kept | |
| new | `DocViewerRoot` + every part and its `*Props`, `*StylesNames`; `createDocViewer`, `createDocViewerStore`, `useDocViewer`, `useDocViewerStore`, `DocViewerStore`, `DocViewerState`, `DocViewerActions`; `DocViewerAdapterProvider`, `createPdfJsAdapter`, `createReactMarkdownAdapter`, `DocViewerPdfAdapter`, `DocViewerMarkdownAdapter`; `DocViewerExtension` | |

`export namespace DocViewer { … namespace Root { Props; StylesNames } namespace Toolbar {…} … }` for every part, as in Lightbox's index.

---

## 2. Engine adapters

```ts
export interface DocViewerPdfAdapter {
  /** Loads the engine once; resolved value is cached by the provider */
  load: () => Promise<DocViewerPdfEngine>;
  /** getDocument options for a document */
  getOptions?: (src: string) => Record<string, unknown>;
}
export function createPdfJsAdapter(
  load: () => Promise<unknown>,              // () => import('pdfjs-dist')
  options?: { workerSrc?: string; options?: DocViewerPdfJsOptions | ((src: string) => DocViewerPdfJsOptions) }
): DocViewerPdfAdapter;

export interface DocViewerMarkdownAdapter { load: () => Promise<DocViewerMarkdownEngine> }
export function createReactMarkdownAdapter(
  load: () => Promise<[unknown, unknown]>   // () => Promise.all([import('react-markdown'), import('remark-gfm')])
): DocViewerMarkdownAdapter;

export function DocViewerAdapterProvider(props: {
  pdf?: DocViewerPdfAdapter;
  markdown?: DocViewerMarkdownAdapter;
  children: React.ReactNode;
}): React.JSX.Element;
```

- `createPdfJsAdapter` sets `GlobalWorkerOptions.workerSrc` once after `load` resolves (what
  `load-pdfjs.ts` does today) and keeps the `disableAutoFetch`/`disableStream` defaults.
- The provider loads lazily on first use (like `CodeHighlightAdapterProvider`'s `loadContext`), so
  an app that wraps everything in the provider pays nothing until a PDF opens.
- Public types never name `pdfjs-dist` or `react-markdown`: `DocViewerPdfJsOptions` is a local
  structural type (`password`, `withCredentials`, `httpHeaders`, `cMapUrl`, `cMapPacked`,
  `disableRange`, `disableStream`, `disableAutoFetch` plus an index signature). Internal files keep
  `import type` from pdfjs-dist. Lane 1 adds a check: `grep -L "pdfjs-dist\|react-markdown\|@cantoo" package/dist/types/index.d.ts`.
- **Without an adapter:** a PDF renders the default layout's unsupported branch: `Body` >
  `Message withDownload` with `labels.pdfNotConfigured` ("This PDF cannot be shown here.
  Download it instead."), `state.status = 'unsupported'`; `onDocumentError` is not called (it is a
  setup gap, not a document error). In development (`getEnv() === 'development'`) a single
  `console.warn('[mantine-doc-viewer] PDF files need DocViewerAdapterProvider with createPdfJsAdapter …')`
  per page load, mirroring code-highlight's unavailable-language warning. Markdown without an adapter
  shows the source through `Code` (language `markdown`), the view-mode control hidden, no warning
  (graceful, like `plainTextAdapter`).
- `package/package.json`:

```json
"peerDependencies": {
  "@mantine/code-highlight": "^9.7.0", "@mantine/core": "^9.7.0", "@mantine/hooks": "^9.7.0",
  "pdfjs-dist": ">=6.5.0", "react-markdown": ">=10.1.0", "remark-gfm": ">=4.0.1",
  "@cantoo/pdf-lib": ">=2.11.1", "react": "^19.2.0", "react-dom": "^19.2.0"
},
"peerDependenciesMeta": {
  "pdfjs-dist": { "optional": true }, "react-markdown": { "optional": true },
  "remark-gfm": { "optional": true }, "@cantoo/pdf-lib": { "optional": true }
},
"dependencies": { "@mantine/store": "9.8.0" }
```

**Why:** code-highlight has zero engine peers and takes the engine through the adapter; the app's
own `import('pdfjs-dist')` is what bundlers see, so a missing optional module never breaks a build.
**Why `@mantine/code-highlight` stays a required peer:** it is a Mantine package from the same
release train, small, and the text/code views are core features; making it optional would need a
third adapter for no install-size gain worth the API.
**Why `@mantine/store` is a pinned dependency:** Lightbox ships it exactly so (`"@mantine/store": "9.8.0"`);
it has no coupling to the installed core version. `html-entities` leaves `dependencies` (only
pdf-lib's peer, which pdf-lib users install with it; README says so).
Tests: the jest `moduleNameMapper` mocks for `import-pdfjs`/`import-markdown`/`import-views` go;
`test-utils/adapters.tsx` exports `createTestPdfAdapter(mockPdf)` and a test markdown adapter, and the
test wrapper puts them in a provider.

---

## 3. State and control: per-instance store

Decision: **per-instance `@mantine/store`**, not a hook-held controller.

| Criterion | Store (Lightbox) | Hook controller (useTree/useCombobox) |
| --- | --- | --- |
| Several viewers on a page | one store each | one hook each |
| Read page/zoom outside the viewer without re-rendering the app on every scroll | yes, selector subscriptions | no, state lives in the app component, which re-renders on every page change |
| Actions from outside React (module code, other trees) | yes | no |
| Precedent for a viewer with toolbar and thumbnails | Lightbox | — |

```ts
export interface DocViewerState {
  type: DocViewerType;
  status: 'loading' | 'ready' | 'error' | 'password' | 'unsupported';
  info: DocViewerLoadInfo | null;
  error: Error | null;
  numPages: number;
  page: number;
  spread: { index: number; pages: number[] };
  zoom: DocViewerZoom;
  scale: number;
  rotation: number;
  pageLayout: DocViewerPageLayout;
  thumbnailsAvailable: boolean;     // a Thumbnails part is mounted
  thumbnailsOpened: boolean;
  thumbnailsPosition: DocViewerThumbnailsPosition;
  searchOpened: boolean;
  presenting: boolean;
  fullscreen: boolean;
  canPrint: boolean;
  textWrap: boolean;
  viewMode: 'preview' | 'source';
  mode: 'read' | (string & {});     // 'edit-pages' from the editor extension
  markupTool: string | null;        // written by the markup extension
}
export type DocViewerStore = MantineStore<DocViewerState>;
export function createDocViewerStore(): DocViewerStore;
export const useDocViewerStore = (store: DocViewerStore) => useStore(store);   // exactly useLightboxStore
const docViewerActions: { goToPage(page, options, store) …; };   // store-last and internal, as lightboxActions: Lightbox and Spotlight export only bound actions
export function createDocViewer(): readonly [DocViewerStore, DocViewerActions];
export function useDocViewer(): readonly [DocViewerStore, DocViewerActions];  // useState(createDocViewer)[0], the useCombobox pattern for a store owned by a component
```

Rules:

1. Root uses `props.store ?? useState(createDocViewerStore)[0]`; a store belongs to one mounted Root
   at a time (dev-only error if two Roots share one).
2. **Two kinds of state.** Simple UI state with no controlled prop (`thumbnails*`, `searchOpened`,
   `presenting`, `rotation`, `textWrap`, `viewMode`) has the store as its source of truth. PDF
   session state (page, spread, zoom/scale, layout, numPages, status) stays in the existing hook
   cascade, which is correct and tested, and is **projected** into the store in one
   `useIsomorphicEffect` per session; controlled props keep working exactly as now. **Why:** moving
   the session's source of truth is the riskiest change in the plan and buys nothing users see.
3. **Actions** dispatch into a per-store registry (`WeakMap<DocViewerStore, Registry>`, internal),
   which views fill with `useRegisterController` as today. Calls before a view registers do nothing
   (documented, as now). State-only actions (`toggleThumbnails`, `setThumbnailsPosition`, `openSearch`)
   write the store directly.
4. The store is read-only for apps by contract (documented: "change it through actions");
   `setState` stays technically reachable because `MantineStore` exposes it.
5. **Parts subscribe narrowly** (internal only; the public hook is `useLightboxStore`'s shape): an
   internal `useDocViewerState(selector)` over `useSyncExternalStore`; selectors return primitives or objects the projection keeps stable
   (`spread` is replaced only when it changes). Static config (getStyles, labels, sizes) comes from
   the Root context, whose value stays stable as today (`stable: true` getStyles).
6. **Render-count guarantees** (`pdf/render-counts.test.tsx`) are kept and extended:
   `PdfPage` keeps receiving memoised props from `Pages` and never subscribes to `page`, `spread`,
   `searchOpened` or `thumbnails*`. New tests: a store write of `page` (scrolling) does not render
   any `PdfPage`; a new `createMarkupExtension({...})` object with equal options does not render
   pages; toolbar controls re-render only for their own slice (counted with a `renderPageOverlay`
   spy and a `jest.fn` inside a test control).

### 3.4 Where the PDF session lives

`PdfView.tsx`'s hook cascade moves unchanged in order into `DocViewerRoot/PdfSession.tsx`: a provider
Root renders around its children when `type === 'pdf'` and a pdf adapter is present. It exposes an
internal `PdfSessionContext` (loaded document, geometry, position, content, turns, actions) to the
PDF parts and projects state into the store. `Pages` registers its body/pages nodes through the
existing `setBodyNode`/`setPagesNode` callbacks and its config (gap, turning, scroll) through a
layout-effect ref the session reads; callbacks (`onReadingProgress`, `onLinkClick`, `onTextSelect`,
`onReachEnd`) go through latest-refs (`useCallbackRef`). **Why:** the cascade's order matters
("effects run in call order"); moving it whole keeps behaviour, and parts become views onto it.

---

## 4. Subpath entries

### 4.1 Extension slot contract (core, internal fields)

```ts
export interface DocViewerExtension {
  readonly name: 'page-editor' | 'markup' | (string & {});
  /** @internal */ readonly setup?: React.ComponentType;               // mounted inside PdfSession: hooks, registry, store writes
  /** @internal */ readonly toolbarControls?: { control: DocViewerControl; after: DocViewerControl; Component: React.ComponentType }[];
  /** @internal */ readonly bar?: React.ComponentType;                 // under the toolbar (markup bar)
  /** @internal */ readonly pageLayer?: React.ComponentType<DocViewerPageLayerProps>; // per page (markup layer)
  /** @internal */ readonly thumbnail?: { action?: React.ComponentType<{ page: number }>; reorder?: DocViewerReorderSlot };
  /** @internal */ readonly screen?: { mode: string; Component: React.ComponentType }; // replaces Main content
  /** @internal */ readonly options: unknown;
}
```

Core keeps, without pdf-lib: replacing the shown document with bytes (`useEditedDocument` →
`session.showBytes(bytes)`), `getBytes`, print. Moves to `/editor`: `PdfPageEditor`, `PdfEditorBar`,
`PdfPageTile`, `PdfThumbnailDelete`, `use-page-editor-*`, `use-page-selection`, `use-page-focus`,
`use-reorder-drag`, `reorder.ts`, `rotate-pages.ts`, `page-edits.ts`, `editor-keys.ts`,
`page-selection.ts`, `import-pdf-lib.ts`. Moves to `/markup`: `PdfMarkupBar`, `PdfMarkupLayer`,
`PdfMarkupText`, `markup*.ts`, `use-markup*.ts`, `use-mark-commit.ts`, `use-text-draft.ts`,
`markup-layer-input.ts`, and the pdf-lib save path of `markup.ts`.

How they plug in:

| Slot | Default layout | Custom layout |
| --- | --- | --- |
| toolbar control | default `Toolbar` inserts it after its anchor control | place `<DocViewerPageEditorButton/>` / `<DocViewerMarkupButton/>` |
| bar | default layout renders `ext.bar` under `Search` | place `<DocViewerMarkupBar/>` |
| page layer | `Pages` renders every `ext.pageLayer` per page | automatic (pages are not composed per page) |
| thumbnail action/reorder | `Thumbnails` renders them | automatic |
| screen | `Main` swaps to it while `state.mode === screen.mode` | automatic, or place `<DocViewerPageEditor/>` yourself |

`extensions` on a Root without a PDF session: setup components are not mounted; buttons render `null`.

### 4.2 Package wiring

- Entry files at the source root: `package/src/index.ts`, `package/src/editor.ts`, `package/src/markup.ts`.
  **Why:** `scripts/generate-dts.ts` maps an exports `types` path `./dist/types/<entry>.d.ts` to
  `<tscDir>/<entry>.d.ts`; root-level entry files make that work with no script change (the template
  already anticipates `markdown.d.mts`-style entries).
- `rollup.config.mjs`: `input: { index, editor, markup }` with `preserveModules`; output
  `esm/editor.mjs`, `cjs/editor.cjs`, … The banner plugin skips `'use client'` for entry chunks via
  `chunk.isEntry` (today it checks `index.js`/`index.mjs` only, so `cjs/index.cjs` gets the banner by accident).
- `package.json` `exports`: add `"./editor"` and `"./markup"`, each `{ import: { types: "./dist/types/editor.d.mts", default: "./dist/esm/editor.mjs" }, require: { types: "./dist/types/editor.d.ts", default: "./dist/cjs/editor.cjs" } }`;
  add `"typesVersions": { "*": { "editor": ["./dist/types/editor.d.ts"], "markup": ["./dist/types/markup.d.ts"] } }`
  so node10 resolution (attw) finds subpath types. `check:exports` stays green for all three.
- One `styles.css` for everything (editor and markup rules included, a few KB). **Why:** Root's
  `classes` must contain every selector for root-level `classNames`, and the build has one postcss
  extract; separate `editor.css` would add a second import for one feature.
- The core entry no longer imports: `@cantoo/pdf-lib`, `react-markdown`, `remark-gfm`, `pdfjs-dist`
  (runtime), the markup and page-editor code. Lane 5/6 done-criteria include
  `grep -r "pdf-lib\|PdfMarkup\|PdfPageEditor" package/dist/esm/index.mjs` → only `export` re-exports none.

---

## 5. File layout

Lightbox's layout, file for file (`packages/@mantine/lightbox/src`: `Lightbox.tsx`, `LightboxBase.tsx`,
`lightbox.context.ts`, `lightbox.store.ts`, `lightbox.types.ts`, `default-labels.ts`, `test-utils.tsx`,
`Lightbox.module.css`, `Lightbox.story.tsx`, `hooks/`, one folder per part with `<Part>.tsx` and
`<Part>.test.tsx`), and code-highlight's `CodeHighlightProvider/adapters/` for engines:

```
package/src/
  index.ts  editor.ts  markup.ts                 entries, `.js` specifiers
  DocViewer.tsx                 statics + displayName + classes (like Lightbox.tsx)
  DocViewerBase.tsx             simple component (like LightboxBase.tsx)
  DocViewer.module.css          every core selector (one family module, like Lightbox.module.css)
  DocViewer.behavior.module.css classes kept with `unstyled` (no Mantine equivalent, section 11)
  DocViewer.story.tsx           the component stories (one story file, like Lightbox.story.tsx)
  DocViewer.test.tsx            itSupportsSystemProps + axe + statics
  doc-viewer.context.ts         createSafeContext, useDocViewerContext
  doc-viewer.store.ts           createDocViewerStore, createDocViewer, docViewerActions, useDocViewerStore, useDocViewer
  doc-viewer.types.ts           DocViewerStylesNames, DocViewerControl, layouts, zoom, positions, extension type
  default-labels.ts             DEFAULT_LABELS
  test-utils.tsx                DocViewerWrapper (Root + adapter provider + fake adapters), like Lightbox's
  DocViewerAdapterProvider/     DocViewerAdapterProvider.tsx (+ test), adapters/pdfjs-adapter.ts, adapters/react-markdown-adapter.ts
  DocViewerRoot/                DocViewerRoot.tsx, PdfSession.tsx, DefaultLayout.tsx, DocViewerRoot.test.tsx
  DocViewerToolbar/             DocViewerToolbar.tsx, DocViewerToolbar.test.tsx, default-controls.tsx
  DocViewerTitle/  DocViewerPageControls/  DocViewerZoomControls/  DocViewerThumbnailsButton/
  DocViewerRotateButton/  DocViewerLayoutMenu/  DocViewerOutlineButton/  DocViewerInfoButton/
  DocViewerPresentationButton/  DocViewerSearchButton/  DocViewerPrintButton/  DocViewerDownloadButton/
  DocViewerFullscreenButton/  DocViewerWrapButton/  DocViewerViewModeControl/
  DocViewerMain/  DocViewerBody/  DocViewerPages/  DocViewerThumbnails/  DocViewerSearch/  DocViewerOutline/
  DocViewerDocumentInfo/  DocViewerPresentationControls/  DocViewerOverlayControls/
  DocViewerImage/  DocViewerText/  DocViewerCode/  DocViewerMarkdown/  DocViewerMessage/  DocViewerLoading/
  hooks/                        use-* hooks (like lightbox/src/hooks), grouped: hooks/pdf/, hooks/image/, hooks/text/
  utils/                        pure modules with their unit tests: geometry, spreads, search, zoom, print, a11y, format, get-doc-viewer-type …
  customized/                   the 14 showcase app stories (outside Mantine's pattern, section 11)
  DocViewerPageEditor/          editor subpath: DocViewerPageEditor.tsx, DocViewerPageEditorButton/, page-editor-extension.ts, hooks/, utils/, default-labels.ts
  DocViewerMarkup/              markup subpath: DocViewerMarkupBar/, DocViewerMarkupButton/, DocViewerMarkupLayer/, markup-extension.ts, hooks/, utils/, default-labels.ts
```

CSS: one `DocViewer.module.css` for every selector, editor and markup included (Lightbox keeps one
module for Root and all parts; Root's `classes` must hold every selector). Lane 1a owns it; lanes 2–6
send CSS changes to the lead, who commits them on main (the restructure itself needs almost none:
`toolbarStart` → `toolbarSection`, thumbnails var rename). One `styles.css` is built (section 4.2).

`.js` specifiers: **in the three entry files only**, like Mantine (lightbox `index.ts` uses `.js`,
inner files mostly do not). Checked: `rollup-plugin-esbuild` 6.2.1 `resolveId` strips `.js` and tries
`.ts`/`.tsx`; tsc `moduleResolution: "bundler"` accepts them; `rollup-plugin-dts` resolves `.js` to
`.d.ts`; Vite (Storybook) maps them. Jest needs one mapper line: `'^(\\.{1,2}/.*)\\.js$': '$1'`.

Index exports per entry: components, `*Props`, `*StylesNames`, `*Factory`, `DocViewerCssVariables`,
factories (`createDocViewer`, `createPdfJsAdapter`, `create*Extension`), actions, labels, types —
grouped like Lightbox's `index.ts` (types first, then values, then the namespace).

Existing modules → new home:

| Today | New home |
| --- | --- |
| `DocViewer.tsx` (factory, vars, renderView) | `DocViewerRoot/DocViewerRoot.tsx` (vars, mods), `DocViewer.tsx` (simple), `DefaultLayout.tsx` |
| `doc-viewer-context-value.ts`, `doc-viewer-root-props.ts`, `use-doc-viewer-session.ts`, `use-doc-viewer-events.ts`, `use-shallow-stable.ts`, `use-behavior-styles.ts` | `DocViewerRoot/` |
| `controller.ts` | `doc-viewer.store.ts` (types → `DocViewerActions`), `hooks/use-controller-registry.ts` |
| `DocViewerToolbar.tsx`, `ToolbarParts.tsx`, `controls.tsx`, `ZoomControls.tsx`, `use-tap-toggle.ts` | `DocViewerToolbar/`, `DocViewerTitle/`, `DocViewerPrintButton/`, `DocViewerDownloadButton/`, `DocViewerFullscreenButton/`, `DocViewerZoomControls/`, `DocViewerToolbar/DocViewerTooltip.tsx` (internal) |
| `OverlayControls.tsx` | `DocViewerOverlayControls/` |
| `renderers.tsx` | `DocViewerBody/` + `doc-viewer.context.ts` (`useDocViewerContext`) |
| `kiosk.ts` | `getNextPage` → `utils/spreads.ts`; `useIdleTimeout` deleted |
| `responsive.ts`, `use-resolved-props.ts` | deleted (no breakpoint props) |
| `detect-doc-type.ts` | `utils/get-doc-viewer-type.ts` |
| `labels.ts` | `default-labels.ts` (core) + editor/markup label files |
| `pdf/PdfView.tsx` + `use-pdf-*` cascade | `DocViewerRoot/PdfSession.tsx`; hooks → `hooks/pdf/` |
| `pdf/PdfReader.tsx`, `PdfPageList.tsx`, `PdfPage.tsx`, `PdfStatus.tsx`, `PdfPassword.tsx`, `PdfHighlightLayer.tsx` | `DocViewerPages/` |
| `pdf/PdfMain.tsx` | `DocViewerMain/` (+ `DocViewerThumbnails/` panel logic) |
| `pdf/PdfThumbnails.tsx` | `DocViewerThumbnails/` |
| `pdf/PdfBars.tsx`, `PdfControls.tsx` | dissolved: default controls in `DocViewerToolbar/default-controls.tsx`, bars in `DefaultLayout.tsx` |
| `pdf/PdfNavigationControls.tsx` | `DocViewerThumbnailsButton/`, `DocViewerPageControls/`, `DocViewerZoomControls/`, `DocViewerRotateButton/`, `DocViewerLayoutMenu/` |
| `pdf/PdfPanelControls.tsx` | `DocViewerOutlineButton/`, `DocViewerInfoButton/`, `DocViewerPresentationButton/`, `DocViewerSearchButton/` (editPages → editor) |
| `pdf/PdfSearchBar.tsx` | `DocViewerSearch/` |
| `pdf/PdfOutline.tsx` | `DocViewerOutline/` |
| `pdf/PdfDocumentInfo.tsx` | `DocViewerDocumentInfo/` |
| `pdf/PdfPresentationControls.tsx` | `DocViewerPresentationControls/` |
| `pdf/load-pdfjs.ts`, `import-pdfjs.ts` | `DocViewerAdapterProvider/adapters/pdfjs-adapter.ts` |
| editor and markup files | subpaths (section 4.1) |
| `views/ImageView.tsx`, `ImageControls.tsx`, `ImageOverlay.tsx` | `DocViewerImage/` (controls → ZoomControls/RotateButton) |
| `views/use-image-*`, `use-drag-to-pan.ts` / `image-fit.ts`, `image-zoom.ts` | `hooks/image/` / `utils/` |
| `views/MessageView.tsx`, `UnsupportedView.tsx` | `DocViewerMessage/`, `DocViewerLoading/`, DefaultLayout |
| `text/TextView.tsx`, `CodeView.tsx`, `MarkdownView.tsx`, `TextStatus.tsx`, `ViewModeToggle.tsx` | `DocViewerText/`, `DocViewerCode/`, `DocViewerMarkdown/`, `DocViewerViewModeControl/`, `DocViewerWrapButton/` |
| `text/import-markdown.ts`, `lazy-views.tsx`, `import-views.ts` | `DocViewerAdapterProvider/adapters/react-markdown-adapter.ts`; Code/Markdown stay lazy (`React.lazy`) for code-highlight |
| other `text/*`, `pdf/*` modules | hooks → `hooks/pdf/`, `hooks/text/`; pure modules → `utils/` (unit tests beside them) |

---

## 6. Tests

Per part, following `PaginationControl.test.tsx` and Lightbox:

```tsx
const TestContainer = createContextContainer(DocViewerPrintButton, DocViewerRoot, ROOT_TEST_PROPS);
tests.itSupportsSystemProps<DocViewerPrintButtonProps, DocViewerPrintButtonStylesNames>({
  component: TestContainer, props: {}, displayName: 'mantine-doc-viewer/DocViewerPrintButton',
  stylesApiSelectors: ['control'], stylesApiName: 'DocViewer', compound: true,
  providerStylesApi: false, selector: '.mantine-DocViewer-control',
});
tests.itThrowsContextError({ component: DocViewerPrintButton, props: {}, error: 'DocViewer.Root component was not found in the tree' });
```

- Root: `tests.itSupportsSystemProps` with all selectors present for a PDF fixture, plus
  `tests.axe([...])` for pdf, image, text and markdown (finding 18). Simple `DocViewer`: statics test
  (`expect(DocViewer.Toolbar).toBe(DocViewerToolbar)` for every static), displayName, default layout per type.
- `package/src/test-utils.tsx` `DocViewerWrapper` (Lightbox's `LightboxWrapper`): Root inside `DocViewerAdapterProvider` with the fake pdf and
  markdown adapters (replaces the jest moduleNameMapper mocks).
- **Migration aid:** lane 1 adds `test-utils/render-legacy.tsx`, a helper that takes the old flat
  props and renders the new API (the mapping table, executable). All 75 existing test files switch to
  it mechanically in lane 1 so every merge stays green at 100% coverage. Part lanes move each test
  into its part folder, rewrite it against the part, and drop the helper; the final lane deletes the
  helper (it must have no users left).
- `*.coverage.test.*` files (root, pdf, pdf-units, hooks, image, text, print) are folded into the
  test of the part or module whose behaviour they cover, named for behaviour (finding 11).
- Kept as they are (pure modules): geometry, spreads, page-edits (→ editor), search, highlights,
  current-page, link-service, render-page, document-info, markup-* (→ markup), image-fit, image-zoom,
  markdown-utils, zoom, a11y. `kiosk.test.tsx` keeps only the `getNextPage` cases (→ spreads.test.ts).
- New: store tests (actions with no view registered, selectors stable, two stores isolated,
  projection after load), adapter tests (missing adapter message, dev warning asserted with a spy and
  absent in test/production, lazy load once), extension tests (slots render, no pages re-render),
  render-count additions (section 3, rule 6).
- 100% coverage threshold and `jest-console.cjs` (any console output fails) stay; the only allowed
  console call is the asserted dev warning.
- e2e (`e2e/*.spec.ts`): story ids stay where story titles and export names stay (`docviewer--pdf`,
  `docviewer--image`, `docviewer--page-editing`, the Folio app id). `errors.spec.ts`
  `docviewer--pdf-without-worker` → `docviewer--pdf-without-adapter`, asserting the message (the
  warning only in dev mode, `E2E_DEV=1`). `page-editor.spec.ts` and `markup.spec.ts` unchanged in
  behaviour; their stories import from the subpath source. `smoke.spec.ts` unchanged (iterates the index).

---

## 7. Docs and stories

### 7.1 Docs (`docs/docs.mdx`, demos)

- Rewritten in mantine.dev style: every section is prose first, then its `<Demo />`; no demo
  without text above it.
- **No Markdown pipe tables** (mantine.dev has no remark-gfm). The 22 table rows today (keyboard keys,
  events/props, toolbar controls) become `<DataTable head={[…]} data={[…]} />`, a new
  `docs/components/DataTable` (Mantine `Table` with `data={{ head, body }}`) registered in
  `mdx-components.tsx`, or lists where a table is overkill. The props table stays the docgen
  `PropsTable`, now one per part (docgen `componentsPaths` lists every part file).
- **remark-gfm in the docs app:** the docs lane greps `docs/**/*.mdx` after the conversion for other
  GFM features (strikethrough `~~`, task lists, bare autolinks, footnotes). If none remain it removes
  `remark-gfm` from `docs/next.config.mjs` and `docs/package.json`; otherwise it keeps it and records
  which feature needs it in the commit message. (The package's own `remark-gfm` is unrelated: it is
  the markdown adapter's optional peer, and a devDependency for tests.)
- Sections and demos (one `docs/demos/DocViewer.demo.<name>.tsx` each, ~14 demos like Lightbox):
  usage (simple), adapters (pdf.js setup, worker), compound layout, custom toolbar, store and actions,
  controlled page/zoom, page layouts, thumbnails, search + highlight, page overlay, custom view (CSV),
  editor extension, markup extension, kiosk recipe (`useIdle` + `useInterval`), Styles API, labels.
- Styles API data (`docs/styles-api/`) split per part like Lightbox's styles-api file.

Kiosk recipe (docs and Atrium):

```tsx
const [store, viewer] = useDocViewer();
const idle = useIdle(60_000);
const attract = useInterval(() => viewer.nextSpread({ loop: true }), 9_000);
useEffect(() => {
  if (idle) { viewer.goToPage(1); viewer.setZoom('fit-page'); attract.start(); } else { attract.stop(); }
}, [idle]);
```

### 7.2 Stories

Mantine keeps one `<Component>.story.tsx` (Lightbox.story.tsx covers root and parts); `DocViewer.story.tsx` gets one story per type and per compound layout, no per-part story files. The 14
showcase apps stay (they are the proof of the API) and move to the new API idiomatically:

| Story | Main changes | Result |
| --- | --- | --- |
| Atrium (kiosk) | `idleTimeout/onIdle/autoAdvance` → recipe (8 lines); `controllerRef` → `useDocViewer`; `onSpreadChange`+state → `useDocViewerStore(store).spread` | **harder by ~5 lines** for the kiosk part, simpler elsewhere; adjusted design: `nextSpread({ loop })` keeps the paging rule in the library so the app writes timing only. Net about equal. |
| Clause | `toolbarControls` hide map → compound toolbar with the controls it wants | simpler |
| Dealroom | `renderToolbarTitle`, `toolbarSubtitle`, `toolbarStartSection`, `toolbarSection` → JSX in `Toolbar`; outline list → `DocViewer.Outline` in its sidebar or `viewer.getOutline()` | simpler |
| FieldReport | `withToolbar={false}` + `withOverlayControls` → `<Root><Image/><OverlayControls/></Root>`; `height="auto"` → `autosize` | equal |
| Folio | `withPageEditing`, `withMarkup`, `markupTools`, `onSave` reason switch → two extensions with `onDocumentChange`/`onExtract` | simpler (no switch on `reason === 'extract'`) |
| Gate | ten `false` entries → toolbar with `PageControls` only; responsive `size/pageGap/thumbnailWidth` → one `useMatches`; `tapToggleToolbar` → `toggleOnTap` | simpler |
| Haven | eleven hidden controls → compound toolbar; markup props → `createMarkupExtension({ tool, value, onChange, color, width })`; `controller.saveMarkup` → `saveMarkup(store)` | simpler |
| Leaf | `controllerRef` (goToPage, getOutline, getPageCanvas) → actions; `withToolbar={false}` → no Toolbar part | equal |
| Locker | `renderers` + `useDocViewer()` renderer → `children={isCsv ? <CsvView/> : null}`; `onDocumentLoadStart` reset → `state.status` | simpler |
| Markbook | `renderPageOverlay` → `Pages`; `keepView` unchanged | equal |
| PlanRoom | toolbar slots → JSX; markup + editor → extensions | simpler |
| Proofline | responsive `defaultPageLayout` → `useMatches` + `picked` recipe (1.1) | **harder by 2 lines**; accepted under the match-Mantine rule (no breakpoint-object props in Mantine) |
| Scanbox | editor extension; `getBytes` → action; responsive sizes → `useMatches` | equal |
| Stand | toolbar slots → JSX; controlled markup → extension; `onSpreadChange` → store; responsive default layout → recipe (+2 lines) | simpler overall |

No story may get harder except Atrium and Proofline as stated; a lane that finds another harder case stops and
reports it to the lead instead of working around it (the design changes, not the story).

---

## 8. Comments pass

- Remove every `//` and `{/* */}` comment that narrates logic (155 + 9 today). Keep: JSDoc on
  exported types, props, functions; `eslint-disable`/`oxlint-disable` lines; and short notes that
  explain a browser or library workaround (Mantine keeps those too, e.g. Lightbox's empty-gallery
  counter note) — rewritten as JSDoc on the function when they describe a contract.
- Add `scripts/check-comments.ts` (run in `npm test` after lint): fails on `^\s*//` or `{/*` lines in
  `package/src/**/*.{ts,tsx}` outside tests and stories, except lint pragmas and lines starting
  `// Workaround:`. **Why:** a sweep without a guard regresses in the next feature.
- Other mechanical alignments in the same lane: named React imports instead of `import React`
  (finding 14), `defaultProps … satisfies Partial<…Props>` (finding 13).

---

## 9. Build plan

Every lane brief contains, verbatim:

> Commit format: `[mantine-doc-viewer] Part: message` for package code (Part = component or area,
> e.g. `DocViewerToolbar`, `store`, `editor`), `[docs] …` for docs, `[core] …` for tooling and
> scripts. End each message with the attribution line.
> Docs rules: no Markdown pipe tables (DataTable or lists), text before every demo.
> Only touch the files you own (listed below). A shared tool change (codemod, script) is its own commit.
> Checks before each commit: typecheck, `npm run oxlint`, the tests of what you touched,
> `npm run build`. Before reporting: `npm run build && npm run docgen && npm test`,
> `npm run check:exports`, the `mantine-lib-harness` check, `crap-audit` (no function > 80 lines,
> cc ≤ 15, cog ≤ 20), and `npm run e2e` when you touched pages, thumbnails, editor or markup.
> At 400k tokens, finish what is in hand, commit, report what is left.

The lead merges one lane at a time and runs the full suite (`npm test`, `npm run e2e`) in the
background after each merge.

| Lane | Model | Runs | Owns (only these files) | Done when |
| --- | --- | --- | --- | --- |
| **1a Root, store, adapters, build** | Opus | alone, first | `package/src/index.ts`, `editor.ts`, `markup.ts` (stub exports), `DocViewer.tsx`, `DocViewerBase.tsx`, `doc-viewer.types.ts`, `doc-viewer.context.ts`, `doc-viewer.store.ts`, `default-labels.ts`, `test-utils.tsx`, `DocViewerAdapterProvider/`, `DocViewerRoot/` (minus `PdfSession.tsx`, `DefaultLayout.tsx`), `utils/` and `hooks/` moves (git mv only), `DocViewerBody/`, `DocViewerMessage/`, `DocViewerLoading/`, every part folder as a **thin stub** (factory + Styles API wrapping the current internal component), `DocViewer.module.css`, `test-utils/*`, `jest.config.cjs`, `rollup.config.mjs`, `scripts/generate-dts.ts` (only if needed), `package/package.json`, root `package.json`, `docs/data.ts`, `scripts/docgen.ts`, all existing `*.test.*` (switched to `render-legacy`) | the whole public API of section 1 exists and typechecks; old behaviour passes through the legacy helper; 100% coverage; `check:exports` green for `.`, `./editor`, `./markup`; no `pdfjs-dist`/`react-markdown`/`@cantoo` in `dist/types/index.d.ts`; api-shape-1 zoom fix |
| **1b PDF session + slots** | Opus | alone, after 1a | `DocViewerRoot/PdfSession.tsx`, `DocViewerRoot/DefaultLayout.tsx`, the old `PdfView`/`PdfReader`/`PdfBars`/`PdfControls`/`PdfMain` (deleted), the extension slot wiring in `hooks/pdf/use-pdf-page-content.ts`, `use-pdf-view-actions.ts`, `use-pdf-edits.ts`, store projection, render-count tests | PDF parts are views on the session; editor and markup still live in core but reach pages/thumbnails/toolbar only through the slot contract (so lanes 5/6 just move files); render-count tests green and extended |
| **1c Stories compile** | Sonnet | alone, after 1b | `DocViewer.story.tsx`, `customized/*.story.tsx`, `docs/demos/*` | every story and demo compiles and renders on the new simple API (mechanical, from table 1.8); `npm run e2e` green |
| **2 Toolbar parts** | Sonnet | parallel | `DocViewerToolbar/`, `DocViewerTitle/`, the 14 control folders, `DocViewerOverlayControls/` | each part real (not a stub), own tests (itSupportsSystemProps compound + itThrowsContextError + behaviour); legacy-helper tests for these parts moved in |
| **3 PDF panels** | Sonnet | parallel | `DocViewerMain/`, `DocViewerPages/`, `DocViewerThumbnails/`, `DocViewerSearch/`, `DocViewerOutline/`, `DocViewerDocumentInfo/`, `DocViewerPresentationControls/`, `hooks/pdf/` and the pdf `utils/` (except files lanes 5/6 move out) | same as lane 2 for these parts; render-count tests pass; `e2e/pdf-reading.spec.ts` green |
| **4 Views** | Sonnet | parallel | `DocViewerImage/`, `DocViewerText/`, `DocViewerCode/`, `DocViewerMarkdown/`, `hooks/image/`, `hooks/text/`, image and text `utils/` | same as lane 2; markdown through the adapter with source fallback; `e2e/image.spec.ts` green |
| **5 Editor subpath** | Opus | parallel | `package/src/editor.ts`, `package/src/DocViewerPageEditor/**`, the editor files listed in 4.1 (moved out of `hooks/pdf/`, `utils/`), editor labels | `/editor` exports per 1.5; core `dist/esm/index.mjs` graph has no pdf-lib or editor module; `e2e/page-editor.spec.ts` green |
| **6 Markup subpath** | Opus | parallel | `package/src/markup.ts`, `package/src/DocViewerMarkup/**`, the markup files listed in 4.1, markup labels | `/markup` exports per 1.5; core graph has no markup module; `e2e/markup.spec.ts` green; pages do not re-render on new options objects |
| **7a Stories + e2e** | Sonnet (frontend-design skill for the apps) | after 2–6, parallel with 7b/7c | `customized/**`, `DocViewer.story.tsx`, `e2e/**` | the 14 apps rewritten idiomatically per table 7.2, none harder except Atrium as recorded; e2e green in light and dark |
| **7b Docs** | Sonnet | after 2–6 | `docs/**`, `scripts/docgen.ts` | section 7.1: text before every demo, no pipe tables (DataTable component), remark-gfm decision made and recorded, ~14 demos, per-part props and Styles API tables; `npm run docs:build` green |
| **7c Sweep + release notes** | Sonnet | after 2–6 (and after 7a/7b merge for the comment guard) | `scripts/check-comments.ts`, root `package.json` (test script), comment-only edits in non-story, non-test source files, `test-utils/render-legacy.tsx` (delete), `CHANGELOG.md`, `README.md`, `PUBLISHING.md` | section 8 done and guarded; legacy helper deleted with no users; CHANGELOG 0.1.0 describes the compound API, subpaths, adapters, store, removed props (and drops the nonexistent `onLoad`/`onError`, api-shape-8); README install lines for pdfjs-dist, pdf-lib, react-markdown + remark-gfm |

Ownership checks: lanes 2–6 never edit `doc-viewer.types.ts`, `index.ts`, `DocViewerRoot/`, `DocViewer.module.css` or
another lane's folder; anything they need there is a request to the lead, who makes it on main as a
one-file commit before merging the lane. Lane 1a writes the full `index.ts`, statics and type union
so later lanes add no exports. Lanes 5 and 6 only move files out of `hooks/pdf/` and `utils/`; lane 3 does not edit
files on their move lists (the lead hands lane 3 the list).

Order: 1a → 1b → 1c → (2 ∥ 3 ∥ 4 ∥ 5 ∥ 6) → (7a ∥ 7b) → 7c.

---

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Lane 1a/1b are large (stubs for ~30 parts, session extraction, legacy test helper); either may pass 300k tokens | 1a and 1b are split; stubs wrap existing components so they are mechanical; the 400k stop rule applies |
| PDF session extraction changes effect order and breaks scroll/zoom anchoring subtly | the cascade moves whole and in order; render-count, fit-page, page-turning, zoom-anchor tests and `pdf-reading.spec.ts` run on 1b |
| Projection into the store lags session state by one commit (toolbar shows the old page for a frame) | write in a layout effect; a test asserts the page indicator updates in the same `act` |
| Pages config read by the session through a layout-effect ref (gap, turning) is one render late on mount | session reads defaults until registered; fit tests cover first paint |
| Extension slot contract is wrong for one of the two extensions | 1b routes today's in-core editor/markup through the slots before lanes 5/6 start, so the contract is proven before anything moves |
| `typesVersions` + `exports` mismatch fails attw for node10 | `check:exports` in lane 1a done-criteria |
| Atrium (kiosk) and Proofline get longer | accepted and recorded; owner decisions; `nextSpread({ loop })` keeps Atrium short |
| Optional peers: an app imports `/editor` without `@cantoo/pdf-lib` | static import makes the build fail loudly with the package name; README lists it |

---

## 11. Deviations from Mantine

Everything not listed here follows the Mantine monorepo / official extensions pattern for the same
thing (part structure and statics, `compound: true` factories, store shape and `useXStore`, adapter
+ provider, `DEFAULT_LABELS` with `…Label` keys, `__vars` on parts, file layout, one family CSS
module, one story file, `@mantine-tests/core` helpers, `.js` in entry files only, displayName
prefix, commit format, docs style). Each remaining difference has a reason the Mantine pattern
cannot cover; anything without one was removed from this plan (breakpoint-object props, per-part
CSS files, per-part story files, a selector overload on `useDocViewerStore`, `DocViewerTooltip`
export, `height`, `DOC_VIEWER_DEFAULT_LABELS`, part-owned thumbnails defaults).

| # | Deviation | Mantine pattern | Why the pattern cannot cover it |
| --- | --- | --- | --- |
| D1 | `extensions` prop on Root taking objects from subpaths | no component in the monorepo has a plugin slot; features are props or children | editor and markup must stay out of the core bundle (they pull in pdf-lib) yet appear inside the simple component's default layout and inside every page and thumbnail; `children` replaces the default layout instead of adding to it, and page layers are not composed by the app. The object handed in follows code-highlight's adapter-object shape. |
| D2 | Two entries as subpaths (`/editor`, `/markup`) instead of separate packages | official features ship as separate `@mantine/*` packages | owner decision; both need the PDF session internals, which separate packages could only reach through a public internal API |
| D3 | Internal narrow subscriptions (`useDocViewerState(selector)`) and a PDF-session projection into the store | Lightbox parts read the whole context; `useLightboxStore` returns the whole state | the current page changes on every scroll step in documents of up to 1000 pages; whole-state subscriptions would re-render every part and page on scroll (the render-count guarantees). The public hook is still `useDocViewerStore(store)` exactly like `useLightboxStore`. |
| D4 | `toolbarControls` / `controls` hide map instead of Lightbox's `toolbarItems` | `toolbarItems: ToolbarItem[] \| (payload) => ToolbarItem[]` of `{ key, icon, label, onClick }` | our controls are not uniform icon buttons (page number input, zoom menu, layout menu, popovers); an item object cannot describe them without render functions, which is composition again |
| D5 | `tooltipProps` on Toolbar, OverlayControls and Search | Lightbox's icon buttons have no tooltips | the viewer has ~15 icon-only controls; tooltips (also on focus) give sighted keyboard and mouse users their names, and the prop is how apps tune or disable them |
| D6 | Optional peers `pdfjs-dist`, `react-markdown`, `remark-gfm`, `@cantoo/pdf-lib` in `peerDependenciesMeta` | code-highlight lists no engine peers at all | our adapter and parts call pdf.js APIs directly (`getDocument`, `TextLayer`, annotation layers) whose shapes change across majors; the supported range has to be stated, and optional peers state it without forcing an install. Shiki's adapter only needs a string highlighter, so code-highlight has nothing to state. |
| D7 | Two engines in one provider (`DocViewerAdapterProvider pdf markdown`) | `CodeHighlightAdapterProvider adapter` (one engine) | two independent engines; one provider with a prop per engine keeps one wrapper instead of two nested providers |
| D8 | `DocViewer.behavior.module.css`: classes kept with `unstyled` | `unstyled` removes all library classes | pdf.js text, link and annotation layers must sit exactly over the canvas; without these rules text selection and links land in the wrong place, which is broken behaviour, not missing looks |
| D9 | CSS scope prefix `me_` (hash-css-selector) | monorepo builds use `m_` | the extension template's default; a community package is outside the monorepo's hash namespace, so `me_` avoids collisions with Mantine's own `m_` classes in the same app |
| D10 | `customized/` showcase app stories (14) | one plain story file per component | owner requirement: they are the proof the API carries real products; they are not built into the package |
| D11 | Docs app is the extension template's Next site, not mantine.dev | `apps/mantine.dev` pages + `@docs/demos` | a community package hosts its own docs; the page follows mantine.dev's writing rules (text before demos, `DataTable`, no pipe tables) |
| D12 | Root has 31 own props | ≈30 or fewer | 31 is "about 30"; every candidate for removal is shared state (Mantine keeps it on Root) or a document identity prop |


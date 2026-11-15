import type { DocViewerFactory } from 'mantine-doc-viewer';
import type { StylesApiData } from '../components/styles-api.types';

export const DocViewerStylesApi: StylesApiData<DocViewerFactory> = {
  selectors: {
    root: 'Root element',
    toolbar: 'Toolbar above the document',
    title: 'File name in the toolbar',
    body: 'Scrollable area that contains the document',
    image: 'Image element, rendered for image documents',
    imageStage:
      'Scrollable area around an image, can be dragged to pan when the image is zoomed in',
    imageCanvas: 'Centers the image inside the stage',
    imageFrame: 'Box with the size of the zoomed and rotated image',
    imageOverlay: 'Loading and error message for images',
    controls: 'Wrapper around toolbar buttons',
    control: 'Toolbar button and search close button, an ActionIcon',
    empty:
      'Message displayed while loading, on errors and when the document type cannot be previewed',
    pageIndicator: 'Current page and page count in the PDF toolbar',
    zoomLevel: 'Zoom percentage button in the PDF toolbar, resets zoom to 100%',
    pages: 'Wrapper around PDF pages',
    page: 'PDF page, sized before the page is drawn',
    canvas: 'Canvas that a PDF page is drawn on',
    textLayer: 'Transparent, selectable text over a PDF page',
    linkLayer: 'Clickable links over a PDF page',
    search: 'PDF search bar below the toolbar',
    searchInput: 'Search input in the PDF search bar',
    searchCount: 'Match count in the PDF search bar',
    searchOption: 'Glyph inside the match case, whole words and match accents buttons',
    main: 'Row that holds the PDF thumbnails and the body',
    thumbnails: 'PDF page thumbnails, a listbox',
    thumbnail: 'Option for one page in the thumbnails',
    thumbnailImage: 'Page preview inside a thumbnail',
    thumbnailLabel: 'Page number below a thumbnail',
    text: 'Plain text file content',
    code: 'CodeHighlight or JsonViewer that shows code files and markdown source',
    markdown: 'Rendered markdown',
    outline: 'PDF outline (bookmarks) in the outline popover',
    outlineList: 'List of outline items, nested for sub-items',
    outlineItem: 'Button or link for one outline item',
    password: 'Password form for protected PDFs',
  },

  vars: {
    root: {
      '--doc-viewer-radius': 'Controls root element `border-radius`',
      '--doc-viewer-color':
        'Pressed toolbar buttons, the current thumbnail and focus outlines, set by `color`',
      '--doc-viewer-font-size': 'Toolbar text size, set by `size`',
      '--doc-viewer-toolbar-height': 'Smallest toolbar height, set by `size`',
      '--doc-viewer-page-gap': 'Space between PDF pages, set by `pageGap`',
      '--doc-viewer-page-background': 'Background of PDF pages and thumbnails, white by default',
      '--doc-viewer-thumbnail-width':
        'Width of thumbnails in the side rail, set by `thumbnailWidth`',
      '--doc-viewer-match-color': 'Colour of PDF search matches, set by `matchColor`',
      '--doc-viewer-active-match-color':
        'Colour of the selected PDF search match, set by `activeMatchColor`',
    },
  },

  modifiers: [
    { modifier: 'data-wrap', selector: 'text', condition: 'Long lines are wrapped' },
    {
      modifier: 'data-active',
      selector: 'thumbnail',
      condition: 'Thumbnail of the current page, also `aria-selected`',
    },
    {
      modifier: 'data-pannable',
      selector: 'imageStage',
      condition: 'Zoomed image is larger than the view',
    },
    { modifier: 'data-panning', selector: 'imageStage', condition: 'Image is being dragged' },
    { modifier: 'data-rendered', selector: 'page', condition: 'Page is drawn' },
    { modifier: 'data-pressed', selector: 'control', condition: 'Toggle button is on' },
    { modifier: 'data-disabled', selector: 'control', condition: 'Button is not available' },
    { modifier: 'data-size', selector: 'root', value: 'Value of `size` prop' },
    {
      modifier: 'data-thumbnails-position',
      selector: 'main',
      value: 'left | right | top | bottom',
    },
    { modifier: 'data-orientation', selector: 'thumbnails', value: 'vertical | horizontal' },
    { modifier: 'data-layout', selector: 'pages', value: 'single | two-page | two-page-cover' },
    { modifier: 'data-fullscreen', selector: 'root', condition: 'Viewer is full screen' },
    {
      modifier: 'data-doc-type',
      selector: 'root',
      value: 'pdf | image | markdown | code | text | unknown',
    },
  ],
};

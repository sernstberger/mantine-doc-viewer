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
    empty:
      'Message displayed while loading, on errors and when the document type cannot be previewed',
    pageIndicator: 'Current page and page count in the PDF toolbar',
    zoomLevel: 'Zoom percentage button in the PDF toolbar, resets zoom to 100%',
    pages: 'Wrapper around PDF pages',
    page: 'PDF page, sized before the page is drawn',
    canvas: 'Canvas that a PDF page is drawn on',
    textLayer: 'Transparent, selectable text over a PDF page',
    search: 'PDF search bar below the toolbar',
    searchInput: 'Search input in the PDF search bar',
    searchCount: 'Match count in the PDF search bar',
    main: 'Row that holds the PDF thumbnails and the body',
    thumbnails: 'PDF page thumbnails sidebar',
    thumbnail: 'Button for one page in the thumbnails sidebar',
    thumbnailImage: 'Page preview inside a thumbnail',
    thumbnailLabel: 'Page number below a thumbnail',
  },

  vars: {
    root: {
      '--doc-viewer-radius': 'Controls root element `border-radius`',
    },
  },

  modifiers: [
    { modifier: 'data-active', selector: 'thumbnail', condition: 'Thumbnail of the current page' },
    {
      modifier: 'data-pannable',
      selector: 'imageStage',
      condition: 'Zoomed image is larger than the view',
    },
    { modifier: 'data-panning', selector: 'imageStage', condition: 'Image is being dragged' },
    { modifier: 'data-rendered', selector: 'page', condition: 'Page has been drawn' },
    {
      modifier: 'data-doc-type',
      selector: 'root',
      value: 'pdf | image | markdown | code | text | unknown',
    },
  ],
};

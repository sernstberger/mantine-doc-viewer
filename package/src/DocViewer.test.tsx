import type { ReactNode } from 'react';
import { render, screen, tests } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestPdfAdapter, testMarkdownAdapter } from '../../test-utils/adapters';
import { mockFetch } from '../../test-utils/mock-fetch';
import { getDocument, mockPdf } from '../../test-utils/mock-pdf';
import { DocViewer } from './DocViewer';
import { DocViewerBody } from './DocViewerBody/DocViewerBody';
import { DocViewerCode } from './DocViewerCode/DocViewerCode';
import { DocViewerDocumentInfo } from './DocViewerDocumentInfo/DocViewerDocumentInfo';
import { DocViewerDownloadButton } from './DocViewerDownloadButton/DocViewerDownloadButton';
import { DocViewerFullscreenButton } from './DocViewerFullscreenButton/DocViewerFullscreenButton';
import { DocViewerImage } from './DocViewerImage/DocViewerImage';
import { DocViewerInfoButton } from './DocViewerInfoButton/DocViewerInfoButton';
import { DocViewerLayoutMenu } from './DocViewerLayoutMenu/DocViewerLayoutMenu';
import { DocViewerLoading } from './DocViewerLoading/DocViewerLoading';
import { DocViewerMain } from './DocViewerMain/DocViewerMain';
import { DocViewerMarkdown } from './DocViewerMarkdown/DocViewerMarkdown';
import { DocViewerMessage } from './DocViewerMessage/DocViewerMessage';
import { DocViewerOutline } from './DocViewerOutline/DocViewerOutline';
import { DocViewerOutlineButton } from './DocViewerOutlineButton/DocViewerOutlineButton';
import { DocViewerOverlayControls } from './DocViewerOverlayControls/DocViewerOverlayControls';
import { DocViewerPageControls } from './DocViewerPageControls/DocViewerPageControls';
import { DocViewerPages } from './DocViewerPages/DocViewerPages';
import { DocViewerPresentationButton } from './DocViewerPresentationButton/DocViewerPresentationButton';
import { DocViewerPresentationControls } from './DocViewerPresentationControls/DocViewerPresentationControls';
import { DocViewerPrintButton } from './DocViewerPrintButton/DocViewerPrintButton';
import { DocViewerRoot } from './DocViewerRoot/DocViewerRoot';
import { DocViewerRotateButton } from './DocViewerRotateButton/DocViewerRotateButton';
import { DocViewerSearch } from './DocViewerSearch/DocViewerSearch';
import { DocViewerSearchButton } from './DocViewerSearchButton/DocViewerSearchButton';
import { DocViewerText } from './DocViewerText/DocViewerText';
import { DocViewerThumbnails } from './DocViewerThumbnails/DocViewerThumbnails';
import { DocViewerThumbnailsButton } from './DocViewerThumbnailsButton/DocViewerThumbnailsButton';
import { DocViewerTitle } from './DocViewerTitle/DocViewerTitle';
import { DocViewerToolbar } from './DocViewerToolbar/DocViewerToolbar';
import { DocViewerViewModeControl } from './DocViewerViewModeControl/DocViewerViewModeControl';
import { DocViewerWrapButton } from './DocViewerWrapButton/DocViewerWrapButton';
import { DocViewerZoomControls } from './DocViewerZoomControls/DocViewerZoomControls';
import { DocViewerAdapterProvider } from './DocViewerAdapterProvider/DocViewerAdapterProvider';
import { DocViewerPageEditorButton } from './DocViewerPageEditor/DocViewerPageEditorButton/DocViewerPageEditorButton';
import { DocViewerPageEditor } from './DocViewerPageEditor/DocViewerPageEditor';
import { DocViewerMarkupBar } from './DocViewerMarkup/DocViewerMarkupBar/DocViewerMarkupBar';
import { DocViewerMarkupButton } from './DocViewerMarkup/DocViewerMarkupButton/DocViewerMarkupButton';
import * as editorEntry from './editor';
import * as markupEntry from './markup';
import * as coreEntry from './index';
import type { DocViewerProps } from './DocViewerBase';
import type { DocViewerStylesNames } from './doc-viewer.types';
import { createDocViewer } from './doc-viewer.store';

const pdfAdapter = createTestPdfAdapter('/worker.mjs');

function Providers({ children }: { children: ReactNode }) {
  return (
    <DocViewerAdapterProvider pdf={pdfAdapter} markdown={testMarkdownAdapter}>
      {children}
    </DocViewerAdapterProvider>
  );
}

const STATICS = {
  Root: DocViewerRoot,
  Toolbar: DocViewerToolbar,
  Title: DocViewerTitle,
  PageControls: DocViewerPageControls,
  ZoomControls: DocViewerZoomControls,
  ThumbnailsButton: DocViewerThumbnailsButton,
  RotateButton: DocViewerRotateButton,
  LayoutMenu: DocViewerLayoutMenu,
  OutlineButton: DocViewerOutlineButton,
  InfoButton: DocViewerInfoButton,
  PresentationButton: DocViewerPresentationButton,
  SearchButton: DocViewerSearchButton,
  PrintButton: DocViewerPrintButton,
  DownloadButton: DocViewerDownloadButton,
  FullscreenButton: DocViewerFullscreenButton,
  WrapButton: DocViewerWrapButton,
  ViewModeControl: DocViewerViewModeControl,
  Main: DocViewerMain,
  Body: DocViewerBody,
  Pages: DocViewerPages,
  Thumbnails: DocViewerThumbnails,
  Search: DocViewerSearch,
  Outline: DocViewerOutline,
  DocumentInfo: DocViewerDocumentInfo,
  PresentationControls: DocViewerPresentationControls,
  OverlayControls: DocViewerOverlayControls,
  Image: DocViewerImage,
  Text: DocViewerText,
  Code: DocViewerCode,
  Markdown: DocViewerMarkdown,
  Message: DocViewerMessage,
  Loading: DocViewerLoading,
} as const;

/** Every part that works without a document of its own type, for compound layouts */
function AllParts() {
  return (
    <>
      <DocViewerToolbar />
      <DocViewerTitle />
      <DocViewerPageControls />
      <DocViewerZoomControls />
      <DocViewerThumbnailsButton />
      <DocViewerRotateButton />
      <DocViewerLayoutMenu />
      <DocViewerOutlineButton />
      <DocViewerInfoButton />
      <DocViewerPresentationButton />
      <DocViewerSearchButton />
      <DocViewerPrintButton />
      <DocViewerDownloadButton />
      <DocViewerFullscreenButton />
      <DocViewerWrapButton />
      <DocViewerViewModeControl />
      <DocViewerMain />
      <DocViewerPages />
      <DocViewerThumbnails />
      <DocViewerSearch />
      <DocViewerOutline />
      <DocViewerDocumentInfo />
      <DocViewerPresentationControls />
      <DocViewerOverlayControls />
      <DocViewerPageEditor />
      <DocViewerPageEditorButton />
      <DocViewerMarkupBar />
      <DocViewerMarkupButton />
      <DocViewerMessage>Note</DocViewerMessage>
      <DocViewerLoading />
    </>
  );
}

describe('DocViewer', () => {
  tests.itSupportsSystemProps<DocViewerProps, DocViewerStylesNames>({
    component: DocViewer,
    props: { src: 'https://example.com/photo.png' },
    styleProps: true,
    extend: true,
    variant: true,
    size: true,
    classes: true,
    refType: HTMLDivElement,
    displayName: 'mantine-doc-viewer/DocViewer',
    stylesApiSelectors: ['root', 'toolbar', 'title', 'body', 'image'],
  });

  it('has every part as a static', () => {
    Object.entries(STATICS).forEach(([name, part]) => {
      expect(DocViewer[name as keyof typeof STATICS]).toBe(part);
      expect(part.displayName).toBe(`mantine-doc-viewer/DocViewer${name}`);
    });
  });

  it('exports the parts, the store and the adapters from each entry', () => {
    Object.entries(STATICS).forEach(([name, part]) => {
      expect(coreEntry[`DocViewer${name}` as keyof typeof coreEntry]).toBe(part);
    });
    expect(coreEntry.createDocViewer).toBe(createDocViewer);
    expect(editorEntry.DocViewerPageEditor).toBe(DocViewerPageEditor);
    expect(editorEntry.DEFAULT_LABELS.editPagesLabel).toBe('Edit pages');
    expect(markupEntry.DocViewerMarkupBar).toBe(DocViewerMarkupBar);
    expect(markupEntry.DEFAULT_LABELS.markupToolLabels.pen).toBe('Pen');
  });

  it('renders custom children in place of the default layout', () => {
    render(
      <DocViewer src="/files/report.csv">
        <DocViewerBody>Custom view</DocViewerBody>
      </DocViewer>
    );
    expect(screen.getByText('Custom view')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });
});

describe('DocViewer.Root', () => {
  it('renders its parts, which render nothing where they do not apply', () => {
    render(
      <DocViewerRoot src="/files/archive.zip" fileName="archive.zip">
        <AllParts />
      </DocViewerRoot>
    );
    expect(screen.getAllByText('archive.zip').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Download' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  it('throws when a part is used outside of DocViewer.Root', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DocViewerPrintButton />)).toThrow(
      'DocViewer.Root component was not found in the tree'
    );
    error.mockRestore();
  });

  it('renders the views of each type as parts', async () => {
    mockFetch('hello');
    render(
      <Providers>
        <DocViewerRoot src="/files/photo.png">
          <DocViewerImage />
        </DocViewerRoot>
        <DocViewerRoot src="/files/notes.txt">
          <DocViewerText />
        </DocViewerRoot>
        <DocViewerRoot src="/files/app.ts">
          <DocViewerCode language="typescript" />
        </DocViewerRoot>
        <DocViewerRoot src="/files/readme.md">
          <DocViewerMarkdown />
        </DocViewerRoot>
      </Providers>
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(await screen.findByTestId('markdown')).toBeInTheDocument();
  });

  it('shows the toolbar and title parts with their own props', () => {
    render(
      <DocViewerRoot src="/files/archive.zip">
        <DocViewerToolbar
          leftSection="Left"
          rightSection="Right"
          title="Contract"
          subtitle="Draft 4"
          controls={{ download: false }}
          tooltipProps={{ disabled: true }}
        />
        <DocViewerToolbar>
          <span>Child</span>
        </DocViewerToolbar>
        <DocViewerTitle title="Other" subtitle="Sub" />
      </DocViewerRoot>
    );
    expect(screen.getByText('Left')).toHaveAttribute('data-position', 'left');
    expect(screen.getByText('Right')).toHaveAttribute('data-position', 'right');
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Draft 4')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('has no print button for a document that cannot be printed', () => {
    render(
      <DocViewerRoot src="/files/archive.zip">
        <DocViewerToolbar />
        <DocViewerPrintButton />
      </DocViewerRoot>
    );
    expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
  });
});

describe('PDF parts', () => {
  beforeEach(() => getDocument.mockReset());

  it('are views on the PDF session', async () => {
    mockPdf({ outline: [{ title: 'Costs', dest: 'costs', items: [] }] });
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    render(
      <Providers>
        <DocViewerRoot
          src="/files/report.pdf"
          extensions={[editorEntry.createPageEditorExtension()]}
        >
          <AllParts />
        </DocViewerRoot>
      </Providers>
    );
    expect(await screen.findAllByRole('button', { name: 'Rotate' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Edit pages' }).length).toBeGreaterThan(0);
    expect(await screen.findAllByRole('navigation', { name: 'Outline' })).not.toHaveLength(0);

    await userEvent.click(screen.getAllByRole('button', { name: 'Page thumbnails' })[1]);
    await userEvent.click(screen.getAllByRole('button', { name: 'Search' })[1]);
    expect(screen.getByRole('textbox', { name: 'Search document' })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Search' })[1]);
    expect(screen.queryByRole('textbox', { name: 'Search document' })).not.toBeInTheDocument();
    delete (document as any).fullscreenEnabled;
  });

  it('render nothing before the document is loaded', async () => {
    getDocument.mockImplementation(() => ({
      promise: new Promise(() => {}),
      destroy: jest.fn(() => Promise.resolve()),
    }));
    render(
      <Providers>
        <DocViewer src="/files/report.pdf" toolbarProps={{ rightSection: <AllParts /> }} />
      </Providers>
    );
    await act(async () => {});
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument();
  });

  it('lets Main take custom content', async () => {
    mockPdf();
    render(
      <Providers>
        <DocViewer
          src="/files/report.pdf"
          toolbarProps={{
            rightSection: (
              <DocViewerMain>
                <span>Custom main</span>
              </DocViewerMain>
            ),
          }}
        />
      </Providers>
    );
    expect(await screen.findByText('Custom main')).toBeInTheDocument();
  });

  it('keeps thumbnails without drag and delete when the editor turns thumbnail editing off', async () => {
    mockPdf();
    render(
      <Providers>
        <DocViewer
          src="/files/report.pdf"
          defaultThumbnailsOpened
          extensions={[editorEntry.createPageEditorExtension({ withThumbnailEditing: false })]}
        />
      </Providers>
    );
    expect(await screen.findByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryAllByRole('button', { name: /Delete page/ })).toHaveLength(0)
    );
  });
});

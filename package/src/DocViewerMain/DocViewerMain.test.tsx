import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { createDocViewer, updateDocViewerStateAction } from '../doc-viewer.store';
import type { DocViewerExtension } from '../doc-viewer.types';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';
import {
  LoadedPdfRoot,
  pagesLoaded,
  PdfPartsRoot,
  PENDING_PDF_ADAPTER,
} from '../../../test-utils/pdf-parts';
import {
  DocViewerMain,
  type DocViewerMainProps,
  type DocViewerMainStylesNames,
} from './DocViewerMain';

const NUM_PAGES = 3;
const TestContainer = createContextContainer(DocViewerMain, PdfPartsRoot);
const defaultProps: DocViewerMainProps = {};

const editorExtension: DocViewerExtension = {
  name: 'editor',
  options: {},
  screen: { mode: 'edit-pages', Component: () => <p>Editor screen</p> },
};

beforeEach(() => {
  getDocument.mockReset();
  mockPdf({ numPages: NUM_PAGES });
});

describe('mantine-doc-viewer/DocViewerMain', () => {
  tests.itSupportsSystemProps<DocViewerMainProps, DocViewerMainStylesNames>({
    component: TestContainer,
    props: defaultProps,
    displayName: 'mantine-doc-viewer/DocViewerMain',
    stylesApiSelectors: ['main'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-main',
    refType: HTMLDivElement,
  });

  tests.itThrowsContextError({
    component: DocViewerMain,
    props: defaultProps,
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing for a document that is not a PDF, or when no PDF adapter is given', () => {
    const { unmount } = render(
      <DocViewerRoot src="/files/notes.txt">
        <DocViewerMain />
      </DocViewerRoot>
    );
    expect(document.querySelector('.mantine-DocViewer-main')).not.toBeInTheDocument();
    unmount();

    render(
      <DocViewerRoot src="/files/report.pdf">
        <DocViewerMain />
      </DocViewerRoot>
    );
    expect(document.querySelector('.mantine-DocViewer-main')).not.toBeInTheDocument();
  });

  it('puts the thumbnails first on the left and top, last on the right and bottom', async () => {
    const [store] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store} defaultThumbnailsOpened>
        <DocViewerMain />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, NUM_PAGES);
    const main = document.querySelector('.mantine-DocViewer-main')!;
    expect(main).toHaveAttribute('data-thumbnails-position', 'left');
    expect(main.firstElementChild).toHaveAttribute('role', 'listbox');

    await act(async () => updateDocViewerStateAction({ thumbnailsPosition: 'right' }, store));
    expect(main).toHaveAttribute('data-thumbnails-position', 'right');
    expect(main.lastElementChild).toHaveAttribute('role', 'listbox');
  });

  it('shows the presentation controls and marks itself while presenting', async () => {
    const [store] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store}>
        <DocViewerMain />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, NUM_PAGES);
    expect(screen.queryByRole('button', { name: 'Exit presentation' })).not.toBeInTheDocument();

    act(() => updateDocViewerStateAction({ presenting: true }, store));
    expect(screen.getByRole('button', { name: 'Exit presentation' })).toBeInTheDocument();
    expect(document.querySelector('.mantine-DocViewer-main')).toHaveAttribute('data-presenting');
  });

  it('shows its children in place of the thumbnails, pages and presentation controls', () => {
    render(
      <PdfPartsRoot adapter={PENDING_PDF_ADAPTER} defaultThumbnailsOpened>
        <DocViewerMain>
          <p>Custom content</p>
        </DocViewerMain>
      </PdfPartsRoot>
    );
    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(document.querySelector('.mantine-DocViewer-body')).not.toBeInTheDocument();
  });

  it('shows the screen of the extension whose mode is on, once the document is loaded', async () => {
    const [store] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store} extensions={[editorExtension]}>
        <DocViewerMain />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, NUM_PAGES);
    act(() => updateDocViewerStateAction({ mode: 'edit-pages' }, store));
    expect(screen.getByText('Editor screen')).toBeInTheDocument();
    expect(document.querySelector('.mantine-DocViewer-main')).not.toBeInTheDocument();
  });

  it('renders again for what it shows, not for the page, zoom or layout', async () => {
    const [store] = createDocViewer();
    const renders = jest.fn();
    const { container } = render(
      <LoadedPdfRoot store={store}>
        <DocViewerMain
          style={() => {
            renders();
            return {};
          }}
        >
          <i />
        </DocViewerMain>
      </LoadedPdfRoot>
    );
    await act(async () => {});
    expect(container.querySelector('.mantine-DocViewer-main')).toBeInTheDocument();
    const before = renders.mock.calls.length;

    act(() =>
      updateDocViewerStateAction({ page: 2, zoom: 1.5, scale: 1.5, pageLayout: 'two-page' }, store)
    );
    expect(renders.mock.calls.length).toBe(before);

    act(() => updateDocViewerStateAction({ presenting: true }, store));
    expect(renders.mock.calls.length).toBeGreaterThan(before);
  });
});

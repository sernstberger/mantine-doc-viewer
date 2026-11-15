import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockPdf } from '../../../test-utils/mock-pdf';
import { DocViewer } from '../DocViewer';
import { createDocViewer, updateDocViewerStateAction } from '../doc-viewer.store';
import { DocViewerAdapterProvider } from '../DocViewerAdapterProvider/DocViewerAdapterProvider';
import {
  createReadyPdfRoot,
  loadReadyState,
  PdfPartsRoot,
  TEST_PDF_ADAPTER,
} from '../../../test-utils/pdf-parts';
import {
  DocViewerThumbnails,
  type DocViewerThumbnailsProps,
  type DocViewerThumbnailsStylesNames,
} from './DocViewerThumbnails';

const NUM_PAGES = 4;
let ready: Awaited<ReturnType<typeof loadReadyState>>;
const ReadyRoot = createReadyPdfRoot(() => ready);

beforeAll(async () => {
  ready = await loadReadyState({ numPages: NUM_PAGES });
});

const TestContainer = createContextContainer(DocViewerThumbnails, ReadyRoot, {
  defaultThumbnailsOpened: true,
});

const defaultProps: DocViewerThumbnailsProps = {};

describe('mantine-doc-viewer/DocViewerThumbnails', () => {
  tests.itSupportsSystemProps<DocViewerThumbnailsProps, DocViewerThumbnailsStylesNames>({
    component: TestContainer,
    props: defaultProps,
    displayName: 'mantine-doc-viewer/DocViewerThumbnails',
    stylesApiSelectors: ['thumbnails', 'thumbnail', 'thumbnailImage', 'thumbnailLabel'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-thumbnails',
    refType: HTMLDivElement,
  });

  tests.itThrowsContextError({
    component: DocViewerThumbnails,
    props: defaultProps,
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('is not rendered until the thumbnails are opened', () => {
    const { rerender } = render(
      <ReadyRoot>
        <DocViewerThumbnails />
      </ReadyRoot>
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    rerender(
      <ReadyRoot defaultThumbnailsOpened>
        <DocViewerThumbnails />
      </ReadyRoot>
    );
    expect(screen.getByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(NUM_PAGES);
  });

  it('renders nothing before the document is loaded, and while presenting', () => {
    const [store] = createDocViewer();
    const { unmount } = render(
      <PdfPartsRoot defaultThumbnailsOpened>
        <DocViewerThumbnails />
      </PdfPartsRoot>
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    unmount();

    render(
      <ReadyRoot store={store} defaultThumbnailsOpened>
        <DocViewerThumbnails />
      </ReadyRoot>
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    act(() => updateDocViewerStateAction({ presenting: true }, store));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks itself as available in the store while mounted', () => {
    const [store] = createDocViewer();
    const { rerender } = render(
      <ReadyRoot store={store}>
        <DocViewerThumbnails />
      </ReadyRoot>
    );
    expect(store.getState().thumbnailsAvailable).toBe(true);

    rerender(<ReadyRoot store={store}>{null}</ReadyRoot>);
    expect(store.getState().thumbnailsAvailable).toBe(false);
  });

  it('sets the thumbnail width from its own prop and from the layout of DocViewer', () => {
    const { rerender } = render(
      <ReadyRoot defaultThumbnailsOpened>
        <DocViewerThumbnails width={80} />
      </ReadyRoot>
    );
    const thumbnails = screen.getByRole('listbox');
    expect(thumbnails.style.getPropertyValue('--doc-viewer-thumbnails-width')).toBe(
      'calc(5rem * var(--mantine-scale))'
    );
    expect(thumbnails.querySelector<HTMLElement>('.mantine-DocViewer-thumbnailImage')).toHaveStyle({
      width: '80px',
    });

    rerender(
      <ReadyRoot defaultThumbnailsOpened>
        <DocViewerThumbnails />
      </ReadyRoot>
    );
    expect(
      screen.getByRole('listbox').style.getPropertyValue('--doc-viewer-thumbnails-width')
    ).toBe('calc(7rem * var(--mantine-scale))');
  });

  it('lays thumbnails out sideways, at half the width, in a strip', () => {
    const [store] = createDocViewer();
    render(
      <ReadyRoot store={store} defaultThumbnailsOpened defaultThumbnailsPosition="bottom">
        <DocViewerThumbnails width={80} />
      </ReadyRoot>
    );
    expect(screen.getByRole('listbox')).toHaveAttribute('data-orientation', 'horizontal');
    expect(document.querySelector<HTMLElement>('.mantine-DocViewer-thumbnailImage')).toHaveStyle({
      width: '40px',
    });
  });

  it('calls a keydown handler passed to it, and keeps the thumbnail keys', async () => {
    const onKeyDown = jest.fn();
    render(
      <ReadyRoot defaultThumbnailsOpened>
        <DocViewerThumbnails onKeyDown={onKeyDown} />
      </ReadyRoot>
    );
    const [first] = screen.getAllByRole('option');
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('option')[1]).toHaveFocus();
  });
});

describe('DocViewerThumbnails in a loaded viewer', () => {
  beforeEach(() => {
    mockPdf({ numPages: NUM_PAGES });
  });

  it('shows the page of the thumbnail that is clicked, and marks the current one', async () => {
    const [store] = createDocViewer();
    render(
      <DocViewerAdapterProvider pdf={TEST_PDF_ADAPTER}>
        <DocViewer.Root
          src="/files/report.pdf"
          store={store}
          defaultThumbnailsOpened
          defaultZoom={1}
        >
          <DocViewer.Thumbnails />
          <DocViewer.Pages />
        </DocViewer.Root>
      </DocViewerAdapterProvider>
    );
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(NUM_PAGES);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(options[2]);
    await act(async () => {});
    expect(store.getState().page).toBe(3);
    expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('takes the width of the thumbnails from thumbnailsProps of DocViewer', async () => {
    render(
      <DocViewerAdapterProvider pdf={TEST_PDF_ADAPTER}>
        <DocViewer
          src="/files/report.pdf"
          defaultZoom={1}
          thumbnailsProps={{ width: 90 }}
          defaultThumbnailsOpened
        />
      </DocViewerAdapterProvider>
    );
    const thumbnails = await screen.findByRole('listbox');
    expect(thumbnails.style.getPropertyValue('--doc-viewer-thumbnails-width')).toBe(
      'calc(5.625rem * var(--mantine-scale))'
    );
  });
});

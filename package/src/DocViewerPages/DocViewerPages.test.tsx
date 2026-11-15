import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { createDocViewer } from '../doc-viewer.store';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';
import {
  DocViewerPages,
  type DocViewerPagesProps,
  type DocViewerPagesStylesNames,
} from './DocViewerPages';
import {
  createReadyPdfRoot,
  LoadedPdfRoot as LoadedRoot,
  loadReadyState,
  pagesLoaded as loaded,
} from '../../../test-utils/pdf-parts';

const NUM_PAGES = 3;
let ready: Awaited<ReturnType<typeof loadReadyState>>;
const ReadyRoot = createReadyPdfRoot(() => ready);

beforeAll(async () => {
  ready = await loadReadyState({ numPages: NUM_PAGES });
});

const TestContainer = createContextContainer(DocViewerPages, ReadyRoot);

const defaultProps: DocViewerPagesProps = {
  renderPageOverlay: ({ pageNumber }) => <span>Overlay {pageNumber}</span>,
};

const pagesLoaded = (container: HTMLElement) => loaded(container, NUM_PAGES);

describe('mantine-doc-viewer/DocViewerPages', () => {
  tests.itSupportsSystemProps<DocViewerPagesProps, DocViewerPagesStylesNames>({
    component: TestContainer,
    props: defaultProps,
    displayName: 'mantine-doc-viewer/DocViewerPages',
    stylesApiSelectors: ['body', 'pages', 'page', 'textLayer', 'linkLayer', 'pageOverlay', 'empty'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-body',
    refType: HTMLDivElement,
  });

  tests.itThrowsContextError({
    component: DocViewerPages,
    props: defaultProps,
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing for a document that is not a PDF', () => {
    render(
      <DocViewerRoot src="/files/report.txt">
        <DocViewerPages />
      </DocViewerRoot>
    );
    expect(document.querySelector('.mantine-DocViewer-body')).not.toBeInTheDocument();
  });
});

describe('DocViewerPages props', () => {
  beforeEach(() => {
    getDocument.mockReset();
    mockPdf({ numPages: NUM_PAGES });
  });

  it('sets the gap and the colours of matches as CSS variables on the body', () => {
    const { rerender } = render(
      <ReadyRoot>
        <DocViewerPages gap="xl" matchColor="grape" activeMatchColor="red" />
      </ReadyRoot>
    );
    const body = document.querySelector<HTMLElement>('.mantine-DocViewer-body')!;
    expect(body.style.getPropertyValue('--doc-viewer-page-gap')).toBe('var(--mantine-spacing-xl)');
    expect(body.style.getPropertyValue('--doc-viewer-match-color')).toBe(
      'var(--mantine-color-grape-filled)'
    );
    expect(body.style.getPropertyValue('--doc-viewer-active-match-color')).toBe(
      'var(--mantine-color-red-filled)'
    );

    rerender(
      <>
        <ReadyRoot>
          <DocViewerPages />
        </ReadyRoot>
      </>
    );
    const rerendered = document.querySelector<HTMLElement>('.mantine-DocViewer-body')!;
    expect(rerendered).toBe(body);
    expect(rerendered.style.getPropertyValue('--doc-viewer-page-gap')).toBe('');
    expect(rerendered.style.getPropertyValue('--doc-viewer-match-color')).toBe('');
  });

  it('turns the scroll modes on the body from withScrollSnap and withScroll', async () => {
    const { container } = render(
      <LoadedRoot>
        <DocViewerPages withScrollSnap withScroll={false} />
      </LoadedRoot>
    );
    await pagesLoaded(container);
    const body = screen.getByRole('region', { name: 'report.pdf' });
    expect(body).toHaveAttribute('data-scroll-snap', 'y');
    expect(body).toHaveAttribute('data-no-scroll');
  });

  it('turns pages with the keys when withPageTurning is on, and leaves them out with the options', async () => {
    const { container, rerender } = render(
      <LoadedRoot>
        <DocViewerPages withPageTurning />
      </LoadedRoot>
    );
    await pagesLoaded(container);
    const body = screen.getByRole('region', { name: 'report.pdf' });
    expect(body.getAttribute('aria-keyshortcuts')).toContain('ArrowRight');

    rerender(
      <>
        <LoadedRoot>
          <DocViewerPages withPageTurning={{ keys: false }} />
        </LoadedRoot>
      </>
    );
    await act(async () => {});
    expect(body.getAttribute('aria-keyshortcuts')).not.toContain('ArrowRight');
  });

  it('draws page overlays and passes the password props to the password field', async () => {
    getDocument.mockReset();
    mockPdf({ numPages: NUM_PAGES, password: 'secret' });
    render(
      <LoadedRoot>
        <DocViewerPages passwordInputProps={{ placeholder: 'Ask the sender' }} />
      </LoadedRoot>
    );
    expect(await screen.findByPlaceholderText('Ask the sender')).toBeInTheDocument();
  });

  it('shows the overlay of each page', async () => {
    const { container } = render(
      <LoadedRoot>
        <DocViewerPages renderPageOverlay={({ pageNumber }) => <b>Overlay {pageNumber}</b>} />
      </LoadedRoot>
    );
    await pagesLoaded(container);
    expect(screen.getByText('Overlay 3')).toBeInTheDocument();
  });

  it('applies classNames and styles to the elements it renders', async () => {
    const { container } = render(
      <LoadedRoot>
        <DocViewerPages
          classNames={{ page: 'my-page', canvas: 'my-canvas' }}
          styles={{ pages: { opacity: 0.5 } }}
        />
      </LoadedRoot>
    );
    await pagesLoaded(container);
    expect(container.querySelectorAll('.my-page')).toHaveLength(NUM_PAGES);
    expect(container.querySelector('.mantine-DocViewer-pages')).toHaveStyle({ opacity: '0.5' });
  });

  it('calls the onClick and onKeyDown it is given next to its own handlers', async () => {
    const onClick = jest.fn();
    const onKeyDown = jest.fn();
    const { container } = render(
      <LoadedRoot>
        <DocViewerPages onClick={onClick} onKeyDown={onKeyDown} />
      </LoadedRoot>
    );
    await pagesLoaded(container);
    const body = screen.getByRole('region', { name: 'report.pdf' });
    await userEvent.click(body);
    fireEvent.keyDown(body, { key: 'x' });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('shows the next page on a click while presenting', async () => {
    const [store, actions] = createDocViewer();
    const { container } = render(
      <LoadedRoot store={store}>
        <DocViewerPages />
      </LoadedRoot>
    );
    await pagesLoaded(container);
    act(() => actions.togglePresentation());
    await act(async () => {});
    expect(store.getState().presenting).toBe(true);
    await userEvent.click(screen.getByRole('region', { name: 'report.pdf' }));
    await act(async () => {});
    expect(store.getState().page).toBe(2);
  });
});

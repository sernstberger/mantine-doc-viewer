import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { createDocViewer } from '../doc-viewer.store';
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import {
  createReadyPdfRoot,
  LoadedPdfRoot,
  loadReadyState,
  pagesLoaded,
  PdfPartsRoot,
} from '../DocViewerPages/pdf-test-kit';
import {
  DocViewerOutline,
  type DocViewerOutlineProps,
  type DocViewerOutlineStylesNames,
} from './DocViewerOutline';

const OUTLINE = [
  {
    title: 'Costs',
    dest: 'costs',
    url: null,
    bold: true,
    italic: true,
    items: [
      { title: 'Nested costs', dest: 'costs', url: null, items: [] },
      { title: 'Mantine', dest: null, url: 'https://mantine.dev', items: [] },
    ],
  },
];

let ready: Awaited<ReturnType<typeof loadReadyState>>;
const ReadyRoot = createReadyPdfRoot(() => ready);

beforeAll(async () => {
  ready = await loadReadyState({ numPages: 3 });
  ready.document.getOutline = (() => ({
    then: (resolve: (items: unknown) => void) => resolve(OUTLINE),
  })) as never;
});

const TestContainer = createContextContainer(DocViewerOutline, ReadyRoot);
const defaultProps: DocViewerOutlineProps = {};

describe('mantine-doc-viewer/DocViewerOutline', () => {
  tests.itSupportsSystemProps<DocViewerOutlineProps, DocViewerOutlineStylesNames>({
    component: TestContainer,
    props: defaultProps,
    displayName: 'mantine-doc-viewer/DocViewerOutline',
    stylesApiSelectors: ['outline'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-outline',
    refType: HTMLElement,
  });

  tests.itThrowsContextError({
    component: DocViewerOutline,
    props: defaultProps,
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing before the document is loaded', () => {
    render(
      <PdfPartsRoot>
        <DocViewerOutline />
      </PdfPartsRoot>
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});

describe('DocViewerOutline in a loaded viewer', () => {
  beforeEach(() => getDocument.mockReset());

  it('lists the bookmarks, styled and linked, and moves to the page of one', async () => {
    mockPdf({ numPages: 3, outline: OUTLINE });
    const [store] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store}>
        <DocViewerOutline classNames={{ outlineItem: 'my-item', outlineList: 'my-list' }} />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);

    const outline = await screen.findByRole('navigation', { name: 'Outline' });
    expect(
      within(outline).getByRole('link', { name: 'Mantine (opens in new tab)' })
    ).toHaveAttribute('href', 'https://mantine.dev');
    expect(outline.querySelector('ul')).toHaveClass('my-list');
    expect(within(outline).getByRole('button', { name: 'Costs' })).toHaveClass('my-item');

    await userEvent.click(within(outline).getByRole('button', { name: 'Nested costs' }));
    await act(async () => {});
    expect(store.getState().page).toBe(2);
  });

  it('renders nothing for a document without bookmarks', async () => {
    mockPdf({ numPages: 3 });
    const { container } = render(
      <LoadedPdfRoot>
        <DocViewerOutline />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});

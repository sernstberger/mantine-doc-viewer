import { type ReactNode, useEffect } from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { useDocViewerContext } from '../doc-viewer.context';
import { createDocViewer, updateDocViewerStateAction } from '../doc-viewer.store';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import { LoadedPdfRoot, pagesLoaded, PdfPartsRoot } from '../../../test-utils/pdf-parts';
import {
  DocViewerSearch,
  type DocViewerSearchProps,
  type DocViewerSearchStylesNames,
} from './DocViewerSearch';

function OpenSearch() {
  const { store } = useDocViewerContext();
  useEffect(() => {
    updateDocViewerStateAction({ searchOpened: true }, store);
  }, [store]);
  return null;
}

function OpenedRoot({ children }: { children?: ReactNode }) {
  return (
    <PdfPartsRoot>
      <OpenSearch />
      {children}
    </PdfPartsRoot>
  );
}

const TestContainer = createContextContainer(DocViewerSearch, OpenedRoot);
const defaultProps: DocViewerSearchProps = {};

beforeEach(() => {
  getDocument.mockReset();
  mockPdf({ numPages: 3 });
});

describe('mantine-doc-viewer/DocViewerSearch', () => {
  tests.itSupportsSystemProps<DocViewerSearchProps, DocViewerSearchStylesNames>({
    component: TestContainer,
    props: defaultProps,
    displayName: 'mantine-doc-viewer/DocViewerSearch',
    stylesApiSelectors: ['search', 'searchInput', 'searchCount', 'searchOption', 'control'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-search',
    refType: HTMLDivElement,
  });

  tests.itThrowsContextError({
    component: DocViewerSearch,
    props: defaultProps,
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('is shown only while search is open', () => {
    const [store] = createDocViewer();
    render(
      <PdfPartsRoot store={store}>
        <DocViewerSearch />
      </PdfPartsRoot>
    );
    expect(screen.queryByRole('search')).not.toBeInTheDocument();

    act(() => updateDocViewerStateAction({ searchOpened: true }, store));
    expect(screen.getByRole('search')).toBeInTheDocument();

    act(() => updateDocViewerStateAction({ searchOpened: false }, store));
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('renders nothing outside a PDF, even when search is open', () => {
    const [store] = createDocViewer();
    updateDocViewerStateAction({ searchOpened: true }, store);
    render(
      <DocViewerRoot src="/files/notes.txt" store={store}>
        <DocViewerSearch />
      </DocViewerRoot>
    );
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('passes inputProps to the search box', () => {
    render(
      <OpenedRoot>
        <DocViewerSearch inputProps={{ placeholder: 'Find in contract' }} />
      </OpenedRoot>
    );
    expect(screen.getByPlaceholderText('Find in contract')).toBeInTheDocument();
  });

  it('sets the tooltips of the buttons from tooltipProps, next to the viewer ones', async () => {
    const { rerender } = render(
      <OpenedRoot>
        <DocViewerSearch />
      </OpenedRoot>
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Match case' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Match case');

    rerender(
      <>
        <OpenedRoot>
          <DocViewerSearch tooltipProps={{ disabled: true }} />
        </OpenedRoot>
      </>
    );
    await userEvent.unhover(screen.getByRole('button', { name: 'Match case' }));
    await userEvent.hover(screen.getByRole('button', { name: 'Whole words' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('finds text, steps through the matches and closes with Escape', async () => {
    const [store, actions] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store}>
        <DocViewerSearch />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);
    act(() => actions.openSearch('quarter'));
    expect(await screen.findByText(/^1 of \d$/)).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Search document' });
    await userEvent.type(input, '{Enter}');
    expect(screen.getByText(/^2 of \d$/)).toBeInTheDocument();
    await userEvent.type(input, '{Shift>}{Enter}{/Shift}');
    expect(screen.getByText(/^1 of \d$/)).toBeInTheDocument();

    await userEvent.type(input, '{Escape}');
    expect(store.getState().searchOpened).toBe(false);
  });

  it('applies classNames to the buttons, the options and the box inside it', () => {
    render(
      <OpenedRoot>
        <DocViewerSearch
          classNames={{ searchOption: 'my-option', control: 'my-control', searchInput: 'my-input' }}
        />
      </OpenedRoot>
    );
    expect(document.querySelectorAll('.my-option')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Close search' })).toHaveClass('my-control');
    expect(document.querySelector('.my-input')).toBeInTheDocument();
  });
});

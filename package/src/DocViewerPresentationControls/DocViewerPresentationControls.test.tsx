import { type ReactNode, useEffect } from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { useDocViewerContext } from '../doc-viewer.context';
import { createDocViewer, updateDocViewerStateAction } from '../doc-viewer.store';
import { DocViewerPages } from '../DocViewerPages/DocViewerPages';
import { LoadedPdfRoot, pagesLoaded, PdfPartsRoot } from '../../../test-utils/pdf-parts';
import {
  DocViewerPresentationControls,
  type DocViewerPresentationControlsProps,
  type DocViewerPresentationControlsStylesNames,
} from './DocViewerPresentationControls';

function Present() {
  const { store } = useDocViewerContext();
  useEffect(() => {
    updateDocViewerStateAction({ presenting: true }, store);
  }, [store]);
  return null;
}

function PresentingRoot({ children }: { children?: ReactNode }) {
  return (
    <PdfPartsRoot>
      <Present />
      {children}
    </PdfPartsRoot>
  );
}

const TestContainer = createContextContainer(DocViewerPresentationControls, PresentingRoot);
const defaultProps: DocViewerPresentationControlsProps = {};

describe('mantine-doc-viewer/DocViewerPresentationControls', () => {
  tests.itSupportsSystemProps<
    DocViewerPresentationControlsProps,
    DocViewerPresentationControlsStylesNames
  >({
    component: TestContainer,
    props: defaultProps,
    displayName: 'mantine-doc-viewer/DocViewerPresentationControls',
    stylesApiSelectors: ['presentationControls'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-presentationControls',
    refType: HTMLDivElement,
  });

  tests.itThrowsContextError({
    component: DocViewerPresentationControls,
    props: defaultProps,
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('is shown only while presenting, with the page and the page count', async () => {
    getDocument.mockReset();
    mockPdf({ numPages: 3 });
    const [store, actions] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store}>
        <DocViewerPresentationControls />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);
    expect(screen.queryByRole('button', { name: 'Exit presentation' })).not.toBeInTheDocument();

    act(() => actions.togglePresentation());
    await act(async () => actions.goToPage(2));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit presentation' })).toBeInTheDocument();
  });

  it('applies classNames to the controls', () => {
    render(
      <PresentingRoot>
        <DocViewerPresentationControls classNames={{ presentationControls: 'my-controls' }} />
      </PresentingRoot>
    );
    expect(document.querySelector('.my-controls')).toBeInTheDocument();
  });

  it('applies classNames to the page count and the exit button, which has no inline colour', () => {
    render(
      <PresentingRoot>
        <DocViewerPresentationControls
          classNames={{ pageIndicator: 'my-count', control: 'my-exit' }}
        />
      </PresentingRoot>
    );
    const exit = screen.getByRole('button', { name: 'Exit presentation' });
    expect(exit).toHaveClass('my-exit');
    expect(exit.style.color).toBe('');
    expect(document.querySelector('.my-count')).toBeInTheDocument();
  });

  it('ends the presentation with the exit button', async () => {
    getDocument.mockReset();
    mockPdf({ numPages: 3 });
    const [store, actions] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store}>
        <DocViewerPresentationControls />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);
    act(() => actions.togglePresentation());
    expect(store.getState().presenting).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Exit presentation' }));
    expect(store.getState().presenting).toBe(false);
    expect(screen.queryByRole('button', { name: 'Exit presentation' })).not.toBeInTheDocument();
  });

  it('goes back and forward with the previous and next page buttons', async () => {
    getDocument.mockReset();
    mockPdf({ numPages: 3 });
    const [store, actions] = createDocViewer();
    const { container } = render(
      <LoadedPdfRoot store={store}>
        <DocViewerPresentationControls />
        <DocViewerPages />
      </LoadedPdfRoot>
    );
    await pagesLoaded(container, 3);
    act(() => actions.togglePresentation());
    await act(async () => actions.goToPage(2));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    await waitFor(() => expect(screen.getByText('1 / 3')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument());
  });
});

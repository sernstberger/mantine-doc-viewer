import type { ReactNode } from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { DocViewerPages } from '../../DocViewerPages/DocViewerPages';
import { DocViewerRoot } from '../../DocViewerRoot/DocViewerRoot';
import type { PdfMarkup } from '../hooks/use-markup';
import { DEFAULT_LABELS } from '../default-labels';
import { MarkupContext, type MarkupContextValue } from '../markup-setup';
import { MarkupViewer } from '../test-utils';
import { MARKUP_TOOLS } from '../utils/markup';
import {
  DocViewerMarkupBar,
  type DocViewerMarkupBarProps,
  type DocViewerMarkupBarStylesNames,
} from './DocViewerMarkupBar';

const markup = {
  tools: MARKUP_TOOLS,
  tool: 'pen',
  marks: [],
  saving: false,
} as unknown as PdfMarkup;

const value = {
  markup,
  labels: DEFAULT_LABELS,
  ready: true,
  opened: true,
} as MarkupContextValue;

function MarkupRoot({ children }: { children: ReactNode }) {
  return (
    <DocViewerRoot src="/files/photo.png">
      <MarkupContext value={value}>{children}</MarkupContext>
    </DocViewerRoot>
  );
}

const TestContainer = createContextContainer(DocViewerMarkupBar, MarkupRoot, {});

describe('mantine-doc-viewer/DocViewerMarkupBar', () => {
  tests.itSupportsSystemProps<DocViewerMarkupBarProps, DocViewerMarkupBarStylesNames>({
    component: TestContainer,
    props: {},
    refType: HTMLDivElement,
    displayName: 'mantine-doc-viewer/DocViewerMarkupBar',
    stylesApiSelectors: ['markupBar', 'markupDivider', 'markupSave', 'control'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-markupBar',
  });

  tests.itThrowsContextError({
    component: DocViewerMarkupBar,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing without the markup extension', () => {
    const { container } = render(
      <DocViewerRoot src="/files/photo.png">
        <DocViewerMarkupBar />
      </DocViewerRoot>
    );
    expect(container.querySelector('.mantine-DocViewer-markupBar')).toBeNull();
  });

  describe('in a viewer', () => {
    beforeEach(() => getDocument.mockReset());

    it('shows the tools of the extension under its labels, and is hidden with the markup control', async () => {
      mockPdf();
      const { rerender } = render(
        <MarkupViewer
          markup={{
            defaultTool: 'pen',
            tools: ['pen', 'cloud'],
            labels: { saveMarkupLabel: 'Keep', markupToolLabels: { pen: 'Ink' } },
          }}
        />
      );
      const bar = await screen.findByRole('toolbar', { name: 'Markup' });
      expect(bar).toHaveClass('mantine-DocViewer-markupBar');
      expect(screen.getByRole('button', { name: 'Ink' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Cloud' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Highlight' })).toBeNull();

      rerender(
        <MarkupViewer markup={{ defaultTool: 'pen' }} toolbarControls={{ markup: false }} />
      );
      await waitFor(() => expect(screen.queryByRole('toolbar', { name: 'Markup' })).toBeNull());
    });

    it('places the bar in a custom layout with its own Styles API props', async () => {
      mockPdf();
      render(
        <MarkupViewer markup={{ defaultTool: 'text' }}>
          <DocViewerMarkupBar
            data-testid="bar"
            classNames={{ markupSave: 'app-save', control: 'app-control' }}
          />
          <DocViewerPages />
        </MarkupViewer>
      );
      const bar = await screen.findByTestId('bar');
      expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('app-save');
      expect(screen.getByRole('button', { name: 'Text box' })).toHaveClass('app-control');
      expect(bar).toHaveAttribute('aria-label', 'Markup');
    });

    it('logs a save that fails', async () => {
      const { document: pdf } = mockPdf();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      pdf.saveDocument.mockImplementationOnce(() => Promise.reject(new Error('Worker gone')));
      render(
        <MarkupViewer
          markup={{
            defaultTool: 'pen',
            onDocumentChange: jest.fn(),
            defaultValue: [
              { type: 'pen', id: 'p', page: 1, color: '#000', width: 1, strokes: [[[1, 1]]] },
            ],
          }}
        />
      );
      await userEvent.click(await screen.findByRole('button', { name: 'Save' }));
      await waitFor(() => expect(consoleError).toHaveBeenCalledWith(new Error('Worker gone')));
      consoleError.mockRestore();
    });
  });
});

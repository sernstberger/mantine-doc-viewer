import React from 'react';
import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { DocViewerPages } from '../../DocViewerPages/DocViewerPages';
import { DocViewerRoot } from '../../DocViewerRoot/DocViewerRoot';
import { DEFAULT_LABELS } from '../default-labels';
import type { PdfMarkup } from '../hooks/use-markup';
import { MarkupContext, type MarkupContextValue } from '../markup-setup';
import { MarkupViewer } from '../test-utils';
import {
  DocViewerMarkupButton,
  type DocViewerMarkupButtonProps,
  type DocViewerMarkupButtonStylesNames,
} from './DocViewerMarkupButton';

const value = {
  markup: { tool: null } as PdfMarkup,
  labels: DEFAULT_LABELS,
  ready: true,
  opened: false,
} as MarkupContextValue;

function MarkupRoot({ children }: { children: React.ReactNode }) {
  return (
    <DocViewerRoot src="/files/photo.png">
      <MarkupContext value={value}>{children}</MarkupContext>
    </DocViewerRoot>
  );
}

const TestContainer = createContextContainer(DocViewerMarkupButton, MarkupRoot, {});

describe('mantine-doc-viewer/DocViewerMarkupButton', () => {
  tests.itSupportsSystemProps<DocViewerMarkupButtonProps, DocViewerMarkupButtonStylesNames>({
    component: TestContainer,
    props: {},
    refType: HTMLButtonElement,
    displayName: 'mantine-doc-viewer/DocViewerMarkupButton',
    stylesApiSelectors: ['control'],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerMarkupButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing without the markup extension', () => {
    render(
      <DocViewerRoot src="/files/photo.png">
        <DocViewerMarkupButton />
      </DocViewerRoot>
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  describe('in a viewer', () => {
    beforeEach(() => getDocument.mockReset());

    it('shows once the PDF is loaded, and opens and closes the markup bar', async () => {
      mockPdf();
      const onClick = jest.fn();
      const onToolChange = jest.fn();
      render(
        <MarkupViewer markup={{ onToolChange, labels: { markupLabel: 'Annotate' } }}>
          <DocViewerMarkupButton onClick={onClick} aria-describedby="hint" />
          <DocViewerPages />
        </MarkupViewer>
      );
      expect(screen.queryByRole('button', { name: 'Annotate' })).toBeNull();
      const button = await screen.findByRole('button', { name: 'Annotate' });
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('aria-describedby', 'hint');

      await userEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(onToolChange).not.toHaveBeenCalled();

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(onToolChange).toHaveBeenLastCalledWith(null);
    });

    it('is placed after the search button in the default toolbar', async () => {
      mockPdf();
      render(<MarkupViewer />);
      const markup = await screen.findByRole('button', { name: 'Markup' });
      const buttons = screen.getAllByRole('button');
      expect(buttons[buttons.indexOf(markup) - 1]).toHaveAccessibleName('Search');
    });
  });
});

import { render, screen, tests } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockPdf } from '../../../test-utils/mock-pdf';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerInfoButton,
  DocViewerInfoButtonProps,
  DocViewerInfoButtonStylesNames,
} from './DocViewerInfoButton';

const layers = [{ id: 'notes', name: 'Notes', visible: true }];

function createHarness(options: { viewerProps?: Record<string, unknown> } = {}) {
  const setVisible = jest.fn();
  const { document } = mockPdf({ layers });
  document.getAttachments = jest.fn(() => ({
    then: (resolve: (value: null) => void) => {
      resolve(null);
      return { catch: () => {} };
    },
  })) as never;
  const harness = createPartHarness(DocViewerInfoButton, {
    state: { type: 'pdf' },
    session: {
      loaded: { ready: { document } },
      content: { pdfLayers: { layers, setVisible } },
    },
    viewerProps: options.viewerProps,
  });
  return { ...harness, setVisible };
}

describe('mantine-doc-viewer/DocViewerInfoButton', () => {
  const { Harness } = createHarness();

  tests.itSupportsSystemProps<DocViewerInfoButtonProps, DocViewerInfoButtonStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerInfoButton',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerInfoButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('opens the properties and layers of the PDF in a dropdown', async () => {
    const { Harness: Info, setVisible } = createHarness();
    render(<Info classNames={{ dropdown: 'app-dropdown' }} />);
    const button = screen.getByRole('button', { name: 'Document info' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);
    expect(document.querySelector('.app-dropdown')).toBeInTheDocument();
    expect(await screen.findByText('Quarterly report')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Notes' }));
    expect(setVisible).toHaveBeenCalledWith('notes', false);
  });

  it('renders nothing before the PDF is loaded, and when hidden by toolbarControls', () => {
    const { Harness: Loading } = createPartHarness(DocViewerInfoButton, {
      state: { type: 'pdf' },
    });
    const { Harness: Hidden } = createHarness({
      viewerProps: { toolbarControls: { info: false } },
    });
    render(
      <>
        <Harness />
        <Loading />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Document info' })).toHaveLength(1);
  });
});

import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerPrintButton,
  DocViewerPrintButtonProps,
  DocViewerPrintButtonStylesNames,
} from './DocViewerPrintButton';

const state = { type: 'pdf', canPrint: true } as const;
const { Harness } = createPartHarness(DocViewerPrintButton, { state });

describe('mantine-doc-viewer/DocViewerPrintButton', () => {
  tests.itSupportsSystemProps<DocViewerPrintButtonProps, DocViewerPrintButtonStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerPrintButton',
    refType: HTMLButtonElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['control'],
    selector: '.mantine-DocViewer-control',
  });

  tests.itThrowsContextError({
    component: DocViewerPrintButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('renders nothing until the document can be printed', () => {
    const { Harness: NotPrintable } = createPartHarness(DocViewerPrintButton, {
      state: { type: 'pdf', canPrint: false },
    });
    render(<NotPrintable />);
    expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
  });

  it('prints through the store, ignoring clicks while printing', async () => {
    let finish!: () => void;
    const print = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { Harness: Printing } = createPartHarness(DocViewerPrintButton, {
      state,
      actions: { print },
    });
    render(<Printing />);
    const button = screen.getByRole('button', { name: 'Print' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(print).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(button).not.toHaveAttribute('data-loading'));
  });

  it('opens the file in a new tab when printing fails', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    const { Harness: Failing } = createPartHarness(DocViewerPrintButton, {
      src: '/files/report.pdf',
      state,
      actions: { print: () => Promise.reject(new Error('no')) },
    });
    render(<Failing />);
    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    await waitFor(() =>
      expect(open).toHaveBeenCalledWith('/files/report.pdf', '_blank', 'noopener,noreferrer')
    );
    open.mockRestore();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerPrintButton, {
      ...{ state },
      viewerProps: { toolbarControls: { print: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Print' })).toHaveLength(1);
  });
});

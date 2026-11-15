import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerViewModeControl,
  DocViewerViewModeControlProps,
  DocViewerViewModeControlStylesNames,
} from './DocViewerViewModeControl';

const markdown = {
  src: '/docs/NOTES.md',
  state: { type: 'markdown', viewModeAvailable: true },
} as const;
const { Harness } = createPartHarness(DocViewerViewModeControl, markdown);

describe('mantine-doc-viewer/DocViewerViewModeControl', () => {
  tests.itSupportsSystemProps<DocViewerViewModeControlProps, DocViewerViewModeControlStylesNames>({
    component: Harness,
    props: {},
    displayName: 'mantine-doc-viewer/DocViewerViewModeControl',
    refType: HTMLDivElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['viewMode'],
    selector: '.mantine-DocViewer-viewMode',
  });

  tests.itThrowsContextError({
    component: DocViewerViewModeControl,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('switches markdown between its preview and its source in the store', () => {
    const { Harness: Mode, store } = createPartHarness(DocViewerViewModeControl, markdown);
    render(<Mode />);
    expect(screen.getByRole('radio', { name: 'Preview' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Source' }));
    expect(store.getState().viewMode).toBe('source');
    expect(screen.getByRole('radio', { name: 'Source' })).toBeChecked();
  });

  it('switches JSON between its tree and its code', () => {
    const { Harness: Json, store } = createPartHarness(DocViewerViewModeControl, {
      src: '/data/config.json',
      state: { type: 'code', viewModeAvailable: true },
    });
    render(<Json />);
    fireEvent.click(screen.getByRole('radio', { name: 'Code' }));
    expect(store.getState().viewMode).toBe('source');
    expect(screen.getByRole('radio', { name: 'Tree' })).toBeInTheDocument();
  });

  it('renders nothing while the view shown has no preview, like code that is not JSON', () => {
    const { Harness: Code } = createPartHarness(DocViewerViewModeControl, {
      src: '/src/app.ts',
      state: { type: 'code' },
    });
    const { Harness: Pdf } = createPartHarness(DocViewerViewModeControl, {
      state: { type: 'pdf' },
    });
    render(
      <>
        <Code />
        <Pdf />
      </>
    );
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerViewModeControl, {
      ...markdown,
      viewerProps: { toolbarControls: { viewMode: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
  });
});

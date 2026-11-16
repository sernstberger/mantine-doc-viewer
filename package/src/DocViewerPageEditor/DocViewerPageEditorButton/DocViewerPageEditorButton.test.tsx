import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';
import { DocViewerRoot } from '../../DocViewerRoot/DocViewerRoot';
import {
  createEditorContext,
  EditorPartsProvider,
  EditorViewer,
} from '../../../../test-utils/page-editor';
import {
  DocViewerPageEditorButton,
  type DocViewerPageEditorButtonProps,
  type DocViewerPageEditorButtonStylesNames,
} from './DocViewerPageEditorButton';

const TestContainer = createContextContainer(DocViewerPageEditorButton, EditorPartsProvider, {});

describe('mantine-doc-viewer/DocViewerPageEditorButton', () => {
  tests.itSupportsSystemProps<DocViewerPageEditorButtonProps, DocViewerPageEditorButtonStylesNames>(
    {
      component: TestContainer,
      props: {},
      displayName: 'mantine-doc-viewer/DocViewerPageEditorButton',
      refType: HTMLButtonElement,
      stylesApiSelectors: ['control'],
      stylesApiName: 'DocViewer',
      compound: true,
      providerStylesApi: false,
      selector: '.mantine-DocViewer-control',
    }
  );

  tests.itThrowsContextError({
    component: DocViewerPageEditorButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('opens the editor and calls its own onClick', async () => {
    const editor = createEditorContext();
    const onClick = jest.fn();
    render(
      <EditorPartsProvider editor={editor}>
        <DocViewerPageEditorButton onClick={onClick} />
      </EditorPartsProvider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit pages' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(editor.open).toHaveBeenCalledTimes(1);
  });

  it('passes the ref on and keeps it for the editor to give focus back', () => {
    const editor = createEditorContext();
    const ref = createRef<HTMLButtonElement>();
    render(
      <EditorPartsProvider editor={editor}>
        <DocViewerPageEditorButton ref={ref} />
      </EditorPartsProvider>
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Edit pages' }));
    expect(editor.editPagesRef).toHaveBeenCalledWith(ref.current);
  });

  it('allows overriding aria-label directly', () => {
    render(
      <EditorPartsProvider>
        <DocViewerPageEditorButton aria-label="Arrange pages" />
      </EditorPartsProvider>
    );
    expect(screen.getByRole('button', { name: 'Arrange pages' })).toBeInTheDocument();
  });

  it('renders nothing without the editor extension or outside a PDF', () => {
    render(
      <DocViewerRoot src="/files/report.pdf">
        <DocViewerPageEditorButton />
      </DocViewerRoot>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is hidden with the editPages toolbar control off', async () => {
    getDocument.mockReset();
    mockPdf();
    render(<EditorViewer toolbarControls={{ editPages: false }} />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    expect(screen.queryByRole('button', { name: 'Edit pages' })).not.toBeInTheDocument();
  });
});

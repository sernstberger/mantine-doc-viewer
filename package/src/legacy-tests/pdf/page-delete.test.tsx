import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import { mockFetch } from '../../../../test-utils/mock-fetch';
import { mockPdf } from '../../../../test-utils/mock-pdf';
import type { DocViewerController } from '../../hooks/use-controller-registry';
import { DocViewer } from '../../DocViewerRoot/DocViewerRoot';

type Props = Partial<React.ComponentProps<typeof DocViewer>>;

async function openThumbnails(props: Props = {}, numPages = 3) {
  mockPdf({ numPages });
  const onSave = jest.fn();
  render(
    <DocViewer
      src="/files/report.pdf"
      pdfWorkerSrc="/worker.mjs"
      defaultThumbnailsOpened
      withPageEditing
      onSave={onSave}
      {...props}
    />
  );
  const listbox = await screen.findByRole('listbox', { name: 'Pages' });
  await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(numPages));
  return { listbox, onSave };
}

describe('delete pages from the sidebar', () => {
  it('has a delete button on each thumbnail, and deleting shows the shorter document', async () => {
    const { onSave } = await openThumbnails();
    expect(screen.getAllByRole('button', { name: /^Delete page/ })).toHaveLength(3);

    await userEvent.click(screen.getByRole('button', { name: 'Delete page 2' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70, 45]), {
        reason: 'delete',
        pages: [1, 3],
      })
    );
    expect(await screen.findByText(/1 page removed/)).toBeInTheDocument();
  });

  it('deletes the focused thumbnail with the Delete key', async () => {
    const { listbox, onSave } = await openThumbnails();
    const thumbnail = within(listbox).getAllByRole('option')[2];
    thumbnail.focus();
    fireEvent.keyDown(thumbnail, { key: 'Delete' });

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.any(Uint8Array), {
        reason: 'delete',
        pages: [1, 2],
      })
    );
  });

  it('deletes with Backspace too', async () => {
    const { listbox, onSave } = await openThumbnails();
    fireEvent.keyDown(within(listbox).getAllByRole('option')[0], { key: 'Backspace' });
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.any(Uint8Array), {
        reason: 'delete',
        pages: [2, 3],
      })
    );
  });

  it('keeps the last page: no delete button, and Delete does nothing', async () => {
    const { listbox, onSave } = await openThumbnails({}, 1);
    expect(screen.queryByRole('button', { name: /^Delete page/ })).not.toBeInTheDocument();
    fireEvent.keyDown(within(listbox).getAllByRole('option')[0], { key: 'Delete' });
    // Give a delete time to run: nothing is saved and the page stays
    await act(async () => {});
    expect(onSave).not.toHaveBeenCalled();
    expect(within(listbox).getAllByRole('option')).toHaveLength(1);
  });

  it('is off without withPageEditing', async () => {
    await openThumbnails({ withPageEditing: false });
    expect(screen.queryByRole('button', { name: /^Delete page/ })).not.toBeInTheDocument();
  });

  it('shows the edited document without an onSave', async () => {
    await openThumbnails({ onSave: undefined });
    await userEvent.click(screen.getByRole('button', { name: 'Delete page 1' }));
    expect(await screen.findByText(/1 page removed/)).toBeInTheDocument();
  });
});

describe('get the bytes of the document as shown', () => {
  it('reads them through the controller', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });

    let bytes: Uint8Array | null = null;
    await act(async () => {
      bytes = await controller.current!.getBytes();
    });
    expect(bytes).toEqual(new Uint8Array([37, 80, 68, 70]));
  });

  it('gives null while a PDF is still loading', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    expect(await controller.current!.getBytes()).toBeNull();
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
  });

  it('gives null before a PDF is loaded and for other documents', async () => {
    const controller = createRef<DocViewerController>();
    mockFetch('hi');
    render(<DocViewer src="data:text/plain,hi" fileName="a.txt" controllerRef={controller} />);
    expect(await controller.current!.getBytes()).toBeNull();
    // Let the text finish loading inside the test
    expect(await screen.findByText('hi')).toBeInTheDocument();
  });
});

describe('compact page editor', () => {
  async function openEditor(props: Props = {}) {
    mockPdf();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" withPageEditing {...props} />
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Edit pages' }));
  }

  it('shows icon-only buttons that keep their names', async () => {
    await openEditor({
      compactPageEditor: true,
      classNames: { editorButton: 'my-editor-button' },
    });
    [
      'Move earlier',
      'Move later',
      'Delete',
      'Extract selected',
      'Reset',
      'Cancel',
      'Done',
      'Save',
    ].forEach((name) => {
      const button = screen.getByRole('button', { name });
      expect(button).not.toHaveTextContent(name);
      expect(button).toHaveClass('my-editor-button');
    });
  });

  it('shows labelled buttons by default, with the editorButton Styles API part', async () => {
    await openEditor({ classNames: { editorButton: 'my-editor-button' } });
    expect(screen.getByRole('button', { name: 'Move earlier' })).toHaveTextContent('Move earlier');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('my-editor-button');
  });
});

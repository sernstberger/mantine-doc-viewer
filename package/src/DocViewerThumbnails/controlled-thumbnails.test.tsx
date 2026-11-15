import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useEffect } from 'react';
import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';
import { TestDocViewer } from '../../../test-utils/viewer';
import { useDocViewer, type DocViewerActions } from '../doc-viewer.store';

let actions: DocViewerActions;

/** A viewer whose store the app holds, with its own button that opens the thumbnails */
function App({ onChange, defaultOpened }: { onChange: jest.Mock; defaultOpened?: boolean }) {
  const [store, own] = useDocViewer();
  actions = own;
  useEffect(() => {
    let last = store.getState().thumbnailsOpened;
    return store.subscribe((state) => {
      if (state.thumbnailsOpened !== last) {
        last = state.thumbnailsOpened;
        onChange(last);
      }
    });
  }, [store, onChange]);
  return (
    <>
      <button type="button" onClick={() => own.toggleThumbnails(true)}>
        App pages
      </button>
      <TestDocViewer
        src="/files/report.pdf"
        store={store}
        defaultThumbnailsOpened={defaultOpened}
      />
    </>
  );
}

const strip = () => screen.queryByRole('listbox', { name: 'Pages' });

describe('thumbnails held by the app through the store', () => {
  beforeEach(() => getDocument.mockReset());

  it('opens the strip from the app, and reports the toolbar button and the actions', async () => {
    mockPdf();
    const onChange = jest.fn();
    render(<App onChange={onChange} />);
    const toggle = await screen.findByRole('button', { name: 'Page thumbnails' });
    expect(strip()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'App pages' }));
    expect(strip()).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(strip()).not.toBeInTheDocument();

    await act(async () => actions.toggleThumbnails(true));
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(strip()).toBeInTheDocument();

    const calls = onChange.mock.calls.length;
    await act(async () => actions.toggleThumbnails(true));
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it('reports the change for thumbnails opened by default too', async () => {
    mockPdf();
    const onChange = jest.fn();
    render(<App onChange={onChange} defaultOpened />);
    expect(await screen.findByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Page thumbnails' }));
    expect(onChange).toHaveBeenCalledWith(false);
    expect(strip()).not.toBeInTheDocument();
  });
});

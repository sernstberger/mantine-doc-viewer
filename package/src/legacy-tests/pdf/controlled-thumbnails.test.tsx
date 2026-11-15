import { render, screen } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef, useState } from 'react';
import { type DocViewerController, DocViewer } from '../../../../test-utils/render-legacy';

import { getDocument, mockPdf } from '../../../../test-utils/mock-pdf';

/** A viewer whose thumbnails the app holds, with its own button that opens them */
function App({
  onChange,
  controllerRef,
  follow = true,
}: {
  onChange: (opened: boolean) => void;
  controllerRef?: React.Ref<DocViewerController>;
  /** The app takes the reader's choice */
  follow?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpened(true)}>
        App pages
      </button>
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        controllerRef={controllerRef}
        thumbnailsOpened={opened}
        onThumbnailsOpenedChange={(next) => {
          onChange(next);
          follow && setOpened(next);
        }}
      />
    </>
  );
}

const strip = () => screen.queryByRole('listbox', { name: 'Pages' });

describe('controlled thumbnails', () => {
  beforeEach(() => getDocument.mockReset());

  it('opens the strip from the app, and reports the toolbar button and the controller', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    const onChange = jest.fn();
    render(<App onChange={onChange} controllerRef={controller} />);
    const toggle = await screen.findByRole('button', { name: 'Page thumbnails' });
    expect(strip()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'App pages' }));
    expect(strip()).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(true);

    await userEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(strip()).not.toBeInTheDocument();

    await act(async () => controller.current!.toggleThumbnails(true));
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(strip()).toBeInTheDocument();

    const calls = onChange.mock.calls.length;
    await act(async () => controller.current!.toggleThumbnails(true));
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it('lets readers toggle the strip: the store holds it, not the app', async () => {
    mockPdf();
    const onChange = jest.fn();
    render(<App onChange={onChange} follow={false} />);
    const toggle = await screen.findByRole('button', { name: 'Page thumbnails' });

    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(strip()).toBeInTheDocument();
  });

  it('reports the change for uncontrolled thumbnails too', async () => {
    mockPdf();
    const onChange = jest.fn();
    render(
      <DocViewer
        src="/files/report.pdf"
        pdfWorkerSrc="/worker.mjs"
        defaultThumbnailsOpened
        onThumbnailsOpenedChange={onChange}
      />
    );
    expect(await screen.findByRole('listbox', { name: 'Pages' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Page thumbnails' }));
    expect(onChange).toHaveBeenCalledWith(false);
    expect(strip()).not.toBeInTheDocument();
  });
});

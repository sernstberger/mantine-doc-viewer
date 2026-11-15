import { render, screen } from '@mantine-tests/core';
import { act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import { type DocViewerController, DocViewer } from '../../../test-utils/render-legacy';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';

const status = () => screen.getByRole('status');

/** What the status region says, without the invisible character that makes repeats heard */
const said = () => status().textContent!.replace(/​/g, '');

describe('zoom announcements', () => {
  beforeEach(() => getDocument.mockReset());

  it('reads out PDF zoom from the buttons and keys once it settles', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Zoom in' }));

    // Not straight away: a run of steps is read out once
    expect(said()).toBe('');
    await waitFor(() => expect(said()).toBe('Zoom 125%'));

    act(() => screen.getByRole('region', { name: 'report.pdf' }).focus());
    await userEvent.keyboard('0');
    await waitFor(() => expect(said()).toBe('Zoom 100%'));
  });

  it('says a wheel or pinch gesture once, at the zoom it ends on', async () => {
    mockPdf();
    render(<DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" defaultZoom={1} />);
    const region = await screen.findByRole('region', { name: 'report.pdf' });
    const zoomLevel = () => screen.getByRole('button', { name: /^Zoom \d/ }).textContent;
    const spoken: string[] = [];
    const observer = new MutationObserver(() => spoken.push(said()));
    observer.observe(status(), { childList: true, characterData: true, subtree: true });

    fireEvent.wheel(region, { deltaY: -100, ctrlKey: true });
    fireEvent.wheel(region, { deltaY: -100, ctrlKey: true });
    await waitFor(() => expect(zoomLevel()).not.toBe('100%'));
    await waitFor(() => expect(said()).toBe(`Zoom ${zoomLevel()}`));
    observer.disconnect();
    expect(spoken).toHaveLength(1);
  });

  it('reads out zoom the app sets through the controller', async () => {
    mockPdf();
    const controller = createRef<DocViewerController>();
    render(
      <DocViewer src="/files/report.pdf" pdfWorkerSrc="/worker.mjs" controllerRef={controller} />
    );
    await screen.findByRole('region', { name: 'report.pdf' });
    act(() => controller.current!.setZoom(2));
    await waitFor(() => expect(said()).toBe('Zoom 200%'));
  });

  it('reads out image zoom in a status region of its own', async () => {
    render(<DocViewer src="/files/photo.png" />);
    const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
    Object.defineProperty(image, 'naturalWidth', { value: 800 });
    Object.defineProperty(image, 'naturalHeight', { value: 400 });
    fireEvent.load(image);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    await waitFor(() => expect(said()).toBe('Zoom 75%'));
  });
});

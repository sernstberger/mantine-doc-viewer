import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { mockPdf } from '../../../test-utils/mock-pdf';
import { createPartHarness } from '../../../test-utils/toolbar-parts';
import { DocViewerFullscreenButton } from '../DocViewerFullscreenButton/DocViewerFullscreenButton';
import { DocViewerLayoutMenu } from '../DocViewerLayoutMenu/DocViewerLayoutMenu';
import { DocViewerInfoButton } from '../DocViewerInfoButton/DocViewerInfoButton';
import { DocViewerOutlineButton } from '../DocViewerOutlineButton/DocViewerOutlineButton';
import { DocViewerPresentationButton } from '../DocViewerPresentationButton/DocViewerPresentationButton';
import { DocViewerPrintButton } from '../DocViewerPrintButton/DocViewerPrintButton';
import { DocViewerRotateButton } from '../DocViewerRotateButton/DocViewerRotateButton';
import { DocViewerSearchButton } from '../DocViewerSearchButton/DocViewerSearchButton';
import { DocViewerThumbnailsButton } from '../DocViewerThumbnailsButton/DocViewerThumbnailsButton';
import { DocViewerWrapButton } from '../DocViewerWrapButton/DocViewerWrapButton';

const pdf = { type: 'pdf' } as const;

function readySession() {
  const { document } = mockPdf({ outline: [{ title: 'Costs', dest: 'costs', items: [] }] });
  document.getOutline = jest.fn(() => ({
    then: (resolve: (value: unknown) => void) =>
      resolve([{ title: 'Costs', dest: 'costs', items: [] }]),
  })) as never;
  document.getAttachments = jest.fn(() => ({
    then: (resolve: (value: null) => void) => {
      resolve(null);
      return { catch: () => {} };
    },
  })) as never;
  return {
    loaded: { ready: { document } },
    content: { pdfLayers: { layers: [], setVisible: jest.fn() } },
  };
}

describe('toolbar buttons compose onClick with their action', () => {
  beforeEach(() =>
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true })
  );
  afterEach(() =>
    Object.defineProperty(document, 'fullscreenEnabled', { value: undefined, configurable: true })
  );

  const cases = [
    ['Rotate', DocViewerRotateButton, { state: pdf, actions: { rotate: jest.fn() } }, 'rotate'],
    [
      'Print',
      DocViewerPrintButton,
      { state: { ...pdf, canPrint: true }, actions: { print: jest.fn() } },
      'print',
    ],
    [
      'Presentation',
      DocViewerPresentationButton,
      { state: pdf, actions: { togglePresentation: jest.fn() } },
      'togglePresentation',
    ],
    [
      'Search',
      DocViewerSearchButton,
      { state: { ...pdf, searchAvailable: true }, actions: { openSearch: jest.fn() } },
      'openSearch',
    ],
  ] as const;

  it.each(cases)('%s', async (name, Part, options, action) => {
    const onClick = jest.fn();
    const { Harness } = createPartHarness(
      Part as ComponentType<{ onClick: () => void }>,
      options as never
    );
    render(<Harness onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name }));
    expect((options.actions as Record<string, jest.Mock>)[action]).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Full screen', async () => {
    const onClick = jest.fn();
    const requestFullscreen = jest.fn(() => Promise.resolve());
    Element.prototype.requestFullscreen = requestFullscreen;
    const { Harness } = createPartHarness(DocViewerFullscreenButton);
    render(<Harness onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(requestFullscreen).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Page thumbnails', async () => {
    const onClick = jest.fn();
    const { Harness, store } = createPartHarness(DocViewerThumbnailsButton, {
      state: { ...pdf, thumbnailsAvailable: true },
    });
    render(<Harness onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page thumbnails' }));
    expect(store.getState().thumbnailsOpened).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Wrap lines', async () => {
    const onClick = jest.fn();
    const { Harness, store } = createPartHarness(DocViewerWrapButton, {
      src: '/files/notes.txt',
      state: { type: 'text' },
    });
    render(<Harness onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Wrap lines' }));
    expect(store.getState().textWrap).toBe(false);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Document info and Outline open their popover and call onClick', async () => {
    const onInfo = jest.fn();
    const onOutline = jest.fn();
    const { Harness: Info } = createPartHarness(DocViewerInfoButton, {
      state: pdf,
      session: readySession(),
    });
    const { Harness: Outline } = createPartHarness(DocViewerOutlineButton, {
      state: pdf,
      session: readySession(),
    });
    render(
      <>
        <Info onClick={onInfo} />
        <Outline onClick={onOutline} />
      </>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Document info' }));
    expect(screen.getByRole('button', { name: 'Document info' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(onInfo).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Outline' }));
    expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(onOutline).toHaveBeenCalledTimes(1);
  });

  it('Page layout opens its menu and calls onClick', async () => {
    const onClick = jest.fn();
    const { Harness } = createPartHarness(DocViewerLayoutMenu, { state: pdf });
    render(<Harness onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page layout' }));
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepts ActionIcon props', () => {
    const { Harness } = createPartHarness(DocViewerRotateButton, { state: pdf });
    render(<Harness variant="filled" color="red" size="xl" radius="xl" />);
    expect(screen.getByRole('button', { name: 'Rotate' })).toHaveAttribute(
      'data-variant',
      'filled'
    );
  });
});

describe('toolbar buttons that open a popover', () => {
  const expectPopupButton = async (name: string) => {
    const button = screen.getByRole('button', { name });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');

    await userEvent.click(button);
    const dialog = screen.getByRole('dialog');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', dialog.id);
    expect(dialog).toHaveAttribute('aria-labelledby', button.id);
    expect(document.querySelector('[role="tooltip"][aria-expanded]')).toBeNull();
  };

  it('Page layout', async () => {
    const { Harness } = createPartHarness(DocViewerLayoutMenu, { state: pdf });
    render(<Harness />);
    await userEvent.hover(screen.getByRole('button', { name: 'Page layout' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Page layout');
    await expectPopupButton('Page layout');
  });

  it('Pages panel position', async () => {
    const { Harness } = createPartHarness(DocViewerThumbnailsButton, {
      state: { ...pdf, thumbnailsAvailable: true, thumbnailsOpened: true },
    });
    render(<Harness />);
    await expectPopupButton('Pages panel position');
  });

  it('Document info', async () => {
    const { Harness } = createPartHarness(DocViewerInfoButton, {
      state: pdf,
      session: readySession(),
    });
    render(<Harness />);
    await expectPopupButton('Document info');
  });

  it('Outline', async () => {
    const { Harness } = createPartHarness(DocViewerOutlineButton, {
      state: pdf,
      session: readySession(),
    });
    render(<Harness />);
    await expectPopupButton('Outline');
  });
});

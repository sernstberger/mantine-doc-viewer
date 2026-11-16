import { MantineProvider } from '@mantine/core';
import { render, screen, tests } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import {
  DocViewerThumbnailsButton,
  DocViewerThumbnailsButtonProps,
  DocViewerThumbnailsButtonStylesNames,
} from './DocViewerThumbnailsButton';

const { Harness } = createPartHarness(DocViewerThumbnailsButton, {
  state: { type: 'pdf', thumbnailsAvailable: true },
});

describe('mantine-doc-viewer/DocViewerThumbnailsButton', () => {
  tests.itSupportsSystemProps<DocViewerThumbnailsButtonProps, DocViewerThumbnailsButtonStylesNames>(
    {
      component: Harness,
      props: {},
      displayName: 'mantine-doc-viewer/DocViewerThumbnailsButton',
      refType: HTMLButtonElement,
      ...PART_TEST_OPTIONS,
      stylesApiSelectors: ['control'],
      selector: '.mantine-DocViewer-control',
    }
  );

  tests.itThrowsContextError({
    component: DocViewerThumbnailsButton,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('shows and hides the thumbnails through the store', () => {
    const { Harness: Toggle, store } = createPartHarness(DocViewerThumbnailsButton, {
      state: { type: 'pdf', thumbnailsAvailable: true },
    });
    render(<Toggle />);
    const button = screen.getByRole('button', { name: 'Page thumbnails' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);
    expect(store.getState().thumbnailsOpened).toBe(true);
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('colours the pressed button with the theme primary colour, or the color of the viewer', () => {
    const pressedColor = (rootProps?: Record<string, unknown>) => {
      const { Harness: Pressed } = createPartHarness(DocViewerThumbnailsButton, {
        state: { type: 'pdf', thumbnailsAvailable: true, thumbnailsOpened: true },
        rootProps,
      });
      const { unmount } = render(
        <MantineProvider theme={{ primaryColor: 'grape' }}>
          <Pressed />
        </MantineProvider>
      );
      const color = screen
        .getByRole('button', { name: 'Page thumbnails' })
        .style.getPropertyValue('--ai-color');
      unmount();
      return color;
    };
    expect(pressedColor()).toContain('grape');
    expect(pressedColor({ color: 'teal' })).toContain('teal');
  });

  it('moves the thumbnails with the position menu while they are shown', async () => {
    const { Harness: Opened, store } = createPartHarness(DocViewerThumbnailsButton, {
      state: { type: 'pdf', thumbnailsAvailable: true, thumbnailsOpened: true },
    });
    render(<Opened classNames={{ dropdown: 'app-dropdown' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pages panel position' }));
    expect(document.querySelector('.app-dropdown')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Right' }));
    expect(store.getState().thumbnailsPosition).toBe('right');
  });

  it('has no position menu with withPositionMenu false, or while the thumbnails are hidden', () => {
    const { Harness: Opened } = createPartHarness(DocViewerThumbnailsButton, {
      state: { type: 'pdf', thumbnailsAvailable: true, thumbnailsOpened: true },
    });
    render(
      <>
        <Harness />
        <Opened withPositionMenu={false} />
      </>
    );
    expect(screen.queryByRole('button', { name: 'Pages panel position' })).not.toBeInTheDocument();
  });

  it('renders nothing for other documents', () => {
    const { Harness: Image } = createPartHarness(DocViewerThumbnailsButton, {
      src: '/files/photo.png',
      state: { type: 'image' },
    });
    render(<Image />);
    expect(screen.queryByRole('button', { name: 'Page thumbnails' })).not.toBeInTheDocument();
  });

  it('renders nothing while no thumbnails part is mounted', () => {
    const { Harness: Bare } = createPartHarness(DocViewerThumbnailsButton, {
      state: { type: 'pdf' },
    });
    render(<Bare />);
    expect(screen.queryByRole('button', { name: 'Page thumbnails' })).not.toBeInTheDocument();
  });

  it('is hidden by toolbarControls of DocViewer', () => {
    const { Harness: Hidden } = createPartHarness(DocViewerThumbnailsButton, {
      ...{ state: { type: 'pdf', thumbnailsAvailable: true } },
      viewerProps: { toolbarControls: { thumbnails: false } },
    });
    render(
      <>
        <Harness />
        <Hidden />
      </>
    );
    expect(screen.getAllByRole('button', { name: 'Page thumbnails' })).toHaveLength(1);
  });
});

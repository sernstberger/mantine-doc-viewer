import { render, screen, tests } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { createPartHarness, PART_TEST_OPTIONS } from '../../../test-utils/toolbar-parts';
import { DocViewer } from '../DocViewer';
import type { DocViewerExtension } from '../doc-viewer.types';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';
import {
  DocViewerToolbar,
  DocViewerToolbarProps,
  DocViewerToolbarStylesNames,
} from './DocViewerToolbar';

const pdf = { state: { type: 'pdf', numPages: 3, thumbnailsAvailable: true } } as const;
const { Harness } = createPartHarness(DocViewerToolbar, pdf);

const quietExtension: DocViewerExtension = { name: 'quiet', options: {} };

const markupExtension: DocViewerExtension = {
  name: 'markup',
  options: {},
  toolbarControls: [
    { control: 'markup', after: 'search', Component: () => <button type="button">Markup</button> },
  ],
};

describe('mantine-doc-viewer/DocViewerToolbar', () => {
  tests.itSupportsSystemProps<DocViewerToolbarProps, DocViewerToolbarStylesNames>({
    component: Harness,
    props: { leftSection: 'Menu', rightSection: 'More' },
    displayName: 'mantine-doc-viewer/DocViewerToolbar',
    refType: HTMLDivElement,
    ...PART_TEST_OPTIONS,
    stylesApiSelectors: ['toolbar', 'toolbarSection', 'controls'],
    selector: '.mantine-DocViewer-toolbar',
  });

  tests.itThrowsContextError({
    component: DocViewerToolbar,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  describe('default controls', () => {
    it('are the controls of a PDF, then download', () => {
      render(<Harness />);
      for (const name of [
        'Page thumbnails',
        'Next page',
        'Zoom in',
        'Rotate',
        'Page layout',
        'Presentation',
        'Search',
      ]) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      }
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
    });

    it('are the controls of an image, a text file, a code file and markdown', () => {
      const { Harness: Image } = createPartHarness(DocViewerToolbar, {
        src: '/files/photo.png',
        state: { type: 'image' },
      });
      const { Harness: Text } = createPartHarness(DocViewerToolbar, {
        src: '/files/notes.txt',
        state: { type: 'text' },
      });
      const { Harness: Markdown } = createPartHarness(DocViewerToolbar, {
        src: '/docs/NOTES.md',
        state: { type: 'markdown', viewModeAvailable: true },
      });
      const { Harness: Archive } = createPartHarness(DocViewerToolbar, {
        src: '/files/archive.zip',
        state: { type: 'unknown' },
      });
      const { unmount } = render(<Image />);
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rotate' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
      unmount();

      const text = render(<Text />);
      expect(screen.getByRole('button', { name: 'Wrap lines' })).toBeInTheDocument();
      text.unmount();

      const markdown = render(<Markdown />);
      expect(screen.getByRole('radio', { name: 'Preview' })).toBeInTheDocument();
      markdown.unmount();

      render(<Archive />);
      expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('end with print once the document can be printed, and full screen where there is any', () => {
      Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
      const { Harness: Printable } = createPartHarness(DocViewerToolbar, {
        state: { ...pdf.state, canPrint: true },
      });
      render(<Printable />);
      expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: undefined,
        configurable: true,
      });
    });

    it('are hidden one by one with controls', () => {
      const { Harness: Custom } = createPartHarness(DocViewerToolbar, {
        state: { ...pdf.state, canPrint: true },
        rootProps: { extensions: [markupExtension] },
      });
      render(
        <Custom
          controls={{
            title: false,
            thumbnails: false,
            pages: false,
            print: false,
            download: false,
            fullscreen: false,
            markup: false,
          }}
        />
      );
      expect(screen.getByRole('toolbar')).not.toHaveTextContent('report.pdf');
      for (const name of ['Page thumbnails', 'Next page', 'Print', 'Markup']) {
        expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
      }
      expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });

    it('include the controls of extensions after their anchor control', () => {
      const { Harness: Extended } = createPartHarness(DocViewerToolbar, {
        ...pdf,
        rootProps: { extensions: [quietExtension, markupExtension] },
      });
      render(<Extended />);
      const search = screen.getByRole('button', { name: 'Search' });
      const markup = screen.getByRole('button', { name: 'Markup' });
      expect(search.compareDocumentPosition(markup)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('are none while an extension screen is on, and print is not offered either', () => {
      const { Harness: Editing } = createPartHarness(DocViewerToolbar, {
        state: { ...pdf.state, mode: 'edit-pages', canPrint: true },
      });
      render(<Editing />);
      expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Print' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
    });
  });

  it('shows the sections around the controls, and a title and subtitle of its own', () => {
    render(
      <Harness
        leftSection="Menu"
        rightSection="More"
        title="Contract"
        subtitle="Draft 4"
        controls={{ download: false }}
      />
    );
    expect(screen.getByText('Menu')).toHaveAttribute('data-position', 'left');
    expect(screen.getByText('More')).toHaveAttribute('data-position', 'right');
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Draft 4')).toBeInTheDocument();
    expect(screen.getByRole('toolbar')).toContainElement(screen.getByText('More'));
  });

  it('shows its children in place of the default controls and title', () => {
    render(
      <Harness rightSection="More">
        <button type="button">Mine</button>
      </Harness>
    );
    expect(screen.getByRole('button', { name: 'Mine' })).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
  });

  it('is named with the toolbar label of the viewer', () => {
    const { Harness: French } = createPartHarness(DocViewerToolbar, {
      rootProps: { labels: { toolbarLabel: 'Barre' } },
    });
    render(<French />);
    expect(screen.getByRole('toolbar', { name: 'Barre' })).toBeInTheDocument();
  });

  it('is not shown while a PDF is presented', () => {
    const { Harness: Presenting } = createPartHarness(DocViewerToolbar, {
      state: { ...pdf.state, presenting: true },
    });
    render(<Presenting />);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('passes tooltipProps to the tooltip of every control inside it', async () => {
    render(
      <>
        <Harness />
        <Harness tooltipProps={{ disabled: true }} />
      </>
    );
    const [shown, disabled] = screen.getAllByRole('button', { name: 'Zoom in' });
    await userEvent.hover(disabled);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await userEvent.hover(shown);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Zoom in');
  });

  describe('in a viewer', () => {
    it('is a named toolbar whose buttons are reached with the arrow keys', async () => {
      const { Harness: Image } = createPartHarness(DocViewerToolbar, {
        src: '/files/photo.png',
        state: { type: 'image' },
      });
      render(<Image />);
      const toolbar = screen.getByRole('toolbar', { name: 'Document toolbar' });
      const buttons = Array.from(toolbar.querySelectorAll<HTMLElement>('[data-toolbar-toggle]'));

      await waitFor(() =>
        expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1)
      );
      await userEvent.tab();
      expect(buttons[0]).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(buttons[1]).toHaveFocus();
      await userEvent.keyboard('{End}');
      expect(buttons[buttons.length - 1]).toHaveFocus();
    });

    it('keeps one tab stop when a button is disabled', async () => {
      const { Harness: Image } = createPartHarness(DocViewerToolbar, {
        src: '/files/photo.png',
        state: { type: 'image', scale: 0.1, zoom: 0.1 },
      });
      render(<Image />);
      const toolbar = screen.getByRole('toolbar', { name: 'Document toolbar' });
      const zoomOut = screen.getByRole('button', { name: 'Zoom out' });

      expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
      expect(zoomOut.tabIndex).toBe(-1);
      await waitFor(() =>
        expect(
          Array.from(toolbar.querySelectorAll<HTMLElement>('[data-toolbar-toggle]')).filter(
            (button) => button.tabIndex === 0
          )
        ).toHaveLength(1)
      );
    });
  });

  it('is what the default layout of DocViewer shows, with the sections of toolbarProps', () => {
    render(
      <DocViewer
        src="/files/archive.zip"
        toolbarProps={{
          leftSection: <button type="button">Menu</button>,
          rightSection: <button type="button">More</button>,
          subtitle: 'Draft 4',
        }}
      />
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
    expect(screen.getByText('Draft 4')).toBeInTheDocument();
  });

  describe('toggleOnTap', () => {
    interface PointerOptions {
      pointerType?: string;
      pointerId?: number;
      isPrimary?: boolean;
      x?: number;
      time?: number;
    }

    function pointer(target: Element, type: string, options: PointerOptions = {}) {
      const {
        pointerType = 'touch',
        pointerId = 1,
        isPrimary = true,
        x = 100,
        time = 1000,
      } = options;
      const event = new PointerEvent(type, {
        bubbles: true,
        pointerType,
        pointerId,
        isPrimary,
        clientX: x,
        clientY: 50,
      });
      Object.defineProperty(event, 'timeStamp', { value: time });
      act(() => {
        target.dispatchEvent(event);
      });
    }

    function tap(target: Element, up: PointerOptions = {}, down: PointerOptions = {}) {
      pointer(target, 'pointerdown', down);
      pointer(target, 'pointerup', up);
    }

    function setup(props: DocViewerToolbarProps = { toggleOnTap: true }) {
      render(
        <DocViewerRoot src="/files/archive.zip">
          <DocViewerToolbar {...props} />
          <div data-testid="content">Content</div>
        </DocViewerRoot>
      );
      return {
        root: document.querySelector('[data-doc-type]')!,
        toolbar: screen.getByRole('toolbar', { hidden: true }).parentElement!,
      };
    }

    it('hides and shows the toolbar when a finger taps the viewer', () => {
      const { root, toolbar } = setup();
      expect(toolbar).not.toHaveAttribute('data-hidden');

      tap(root);
      expect(toolbar).toHaveAttribute('data-hidden', 'true');

      tap(root);
      expect(toolbar).not.toHaveAttribute('data-hidden');
    });

    it('does nothing without the prop', () => {
      const { root, toolbar } = setup({});
      tap(root);
      expect(toolbar).not.toHaveAttribute('data-hidden');
    });

    it('ignores mouse clicks and a second finger', () => {
      const { root, toolbar } = setup();
      tap(root, { pointerType: 'mouse' }, { pointerType: 'mouse' });
      tap(root, {}, { isPrimary: false });
      expect(toolbar).not.toHaveAttribute('data-hidden');
    });

    it('ignores drags, long presses and taps that end on another pointer', () => {
      const { root, toolbar } = setup();
      tap(root, { x: 160 });
      tap(root, { time: 1900 });
      tap(root, { pointerId: 2 });
      pointer(root, 'pointerup');
      expect(toolbar).not.toHaveAttribute('data-hidden');
    });

    it('ignores a tap that scrolling cancelled', () => {
      const { root, toolbar } = setup();
      pointer(root, 'pointerdown');
      pointer(root, 'pointercancel');
      pointer(root, 'pointerup');
      expect(toolbar).not.toHaveAttribute('data-hidden');
    });

    it('ignores taps on buttons and the toolbar', () => {
      const { toolbar } = setup();
      tap(screen.getByRole('link', { name: 'Download' }));
      tap(screen.getByText('archive.zip'));
      expect(toolbar).not.toHaveAttribute('data-hidden');
    });
  });
});

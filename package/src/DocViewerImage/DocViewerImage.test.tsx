import { createContextContainer, render, screen, tests } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createDocViewer } from '../doc-viewer.store';
import { DocViewer } from '../DocViewer';
import { DocViewerToolbar } from '../DocViewerToolbar/DocViewerToolbar';
import { DocViewerRoot } from '../DocViewerRoot/DocViewerRoot';
import {
  DocViewerImage,
  type DocViewerImageProps,
  type DocViewerImageStylesNames,
} from './DocViewerImage';

const TestContainer = createContextContainer(DocViewerImage, DocViewerRoot, {
  src: '/files/photo.png',
});

/** The part with the toolbar the default layout gives it */
function Viewer(props: DocViewerImageProps) {
  return (
    <DocViewerRoot src="/files/photo.png">
      <DocViewerToolbar />
      <DocViewerImage {...props} />
    </DocViewerRoot>
  );
}

/** jsdom does not load images, so the natural size is set and load fired by hand */
function loadImage(width = 800, height = 400) {
  const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: width });
  Object.defineProperty(image, 'naturalHeight', { value: height });
  fireEvent.load(image);
  return image;
}

const getStage = () => screen.getByRole('img', { hidden: true }).closest('[tabindex]')!;

function setLayout(element: Element, layout: Record<string, number>) {
  Object.entries(layout).forEach(([name, value]) => {
    Object.defineProperty(element, name, { value, configurable: true, writable: true });
  });
}

function pointerEvent(
  type: string,
  { button = 0, pointerType = 'mouse', clientX = 0, clientY = 0 } = {}
) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button, clientX, clientY });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  return event;
}

function capturePrints() {
  const printed: string[] = [];
  const append = document.body.append.bind(document.body);
  jest.spyOn(document.body, 'append').mockImplementation((...nodes: (Node | string)[]) => {
    nodes.forEach((node) => {
      if (node instanceof HTMLIFrameElement) {
        printed.push(node.srcdoc);
        Object.defineProperty(node, 'contentWindow', {
          value: { addEventListener: jest.fn(), focus: jest.fn(), print: jest.fn() },
        });
        node.onload?.(new Event('load'));
      } else {
        append(node);
      }
    });
  });
  return printed;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('@mantine/doc-viewer/DocViewerImage', () => {
  tests.itSupportsSystemProps<DocViewerImageProps, DocViewerImageStylesNames>({
    component: TestContainer,
    props: {},
    refType: HTMLDivElement,
    displayName: 'mantine-doc-viewer/DocViewerImage',
    stylesApiSelectors: [
      'body',
      'image',
      'imageStage',
      'imageCanvas',
      'imageFrame',
      'imageOverlay',
    ],
    stylesApiName: 'DocViewer',
    compound: true,
    providerStylesApi: false,
    selector: '.mantine-DocViewer-body',
    size: false,
    variant: false,
  });

  tests.itThrowsContextError({
    component: DocViewerImage,
    props: {},
    error: 'DocViewer.Root component was not found in the tree',
  });

  it('shows a loader until the image has loaded', () => {
    render(<Viewer />);
    expect(screen.getByText('Loading document')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();

    loadImage();
    expect(screen.queryByText('Loading document')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fit to view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('uses the alt prop, then the file name, then a generic name', () => {
    const { rerender } = render(<Viewer alt="A red bicycle" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('alt', 'A red bicycle');

    rerender(<Viewer />);
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('alt', 'photo.png');

    rerender(
      <DocViewerRoot src="data:image/png;base64,AAAA">
        <DocViewerToolbar />
        <DocViewerImage />
      </DocViewerRoot>
    );
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('alt', 'Image');
  });

  it('takes the alt of the simple component imageProps', () => {
    render(<DocViewer src="/files/photo.png" imageProps={{ alt: 'From the layout' }} />);
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('alt', 'From the layout');
  });

  it('zooms in steps, resets to 100% and returns to fit', async () => {
    render(<Viewer />);
    const image = loadImage();
    expect(screen.getByText('100%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();
    expect(image).toHaveStyle({ width: '1000px', height: '500px' });
    expect(screen.getByRole('button', { name: 'Fit to view' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Zoom 125%' }));
    await userEvent.click(screen.getByRole('menuitem', { name: '100%' }));
    expect(image).toHaveStyle({ width: '800px' });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(screen.getByText('75%')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fit to view' }));
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('rotates in quarter turns and swaps the frame size', async () => {
    const [store] = createDocViewer();
    render(
      <DocViewerRoot src="/files/photo.png" store={store}>
        <DocViewerToolbar />
        <DocViewerImage />
      </DocViewerRoot>
    );
    const image = loadImage();
    const frame = image.parentElement!;

    expect(frame).toHaveStyle({ width: '800px', height: '400px' });
    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    expect(image.style.transform).toContain('rotate(90deg)');
    expect(frame).toHaveStyle({ width: '400px', height: '800px' });
    expect(store.getState().rotation).toBe(90);
  });

  it('supports keyboard shortcuts on the focused image and ignores other keys', () => {
    render(<Viewer />);
    const image = loadImage();
    const stage = getStage();

    expect(fireEvent.keyDown(stage, { key: 'a' })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: '+', ctrlKey: true })).toBe(true);
    expect(screen.getByText('100%')).toBeInTheDocument();

    expect(fireEvent.keyDown(stage, { key: '+' })).toBe(false);
    expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: '-' });
    fireEvent.keyDown(stage, { key: '-' });
    expect(screen.getByText('75%')).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: '0' });
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: 'r' });
    expect(image.style.transform).toContain('rotate(90deg)');
  });

  it('zooms with Ctrl+wheel and Meta+wheel and leaves other wheel events alone', () => {
    render(<Viewer />);
    loadImage();
    const stage = getStage();

    expect(fireEvent.wheel(stage, { deltaY: -50 })).toBe(true);
    expect(screen.getByText('100%')).toBeInTheDocument();

    expect(fireEvent.wheel(stage, { deltaY: -50, ctrlKey: true })).toBe(false);
    const afterCtrl = screen.getByText(/%$/).textContent;
    expect(afterCtrl).not.toBe('100%');

    expect(fireEvent.wheel(stage, { deltaY: 50, metaKey: true, clientX: 10, clientY: 10 })).toBe(
      false
    );
    expect(screen.getByText(/%$/).textContent).not.toBe(afterCtrl);
  });

  it('offers a download and an alert when the image cannot be loaded', () => {
    const onDocumentError = jest.fn();
    render(
      <DocViewerRoot src="/files/missing.png" onDocumentError={onDocumentError}>
        <DocViewerToolbar />
        <DocViewerImage />
      </DocViewerRoot>
    );
    fireEvent.error(screen.getByRole('img', { hidden: true }));

    expect(screen.getByRole('alert')).toHaveTextContent('This image could not be loaded');
    expect(screen.getByRole('link', { name: 'Download file' })).toHaveAttribute(
      'href',
      '/files/missing.png'
    );
    expect(onDocumentError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  it('resets zoom when the image changes', async () => {
    const App = ({ src }: { src: string }) => (
      <DocViewerRoot src={src}>
        <DocViewerToolbar />
        <DocViewerImage />
      </DocViewerRoot>
    );
    const { rerender } = render(<App src="/files/one.png" />);
    loadImage();
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();

    rerender(<App src="/files/two.png" />);
    expect(screen.getByText('Loading document')).toBeInTheDocument();
    loadImage();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('hides zoom and rotate when the toolbar controls are off', () => {
    render(<DocViewer src="/files/photo.png" toolbarControls={{ zoom: false, rotate: false }} />);
    loadImage();
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument();
  });

  it('reports the natural size and writes the load into the store', () => {
    const [store] = createDocViewer();
    const onDocumentLoad = jest.fn();
    render(
      <DocViewerRoot src="/files/photo.png" store={store} onDocumentLoad={onDocumentLoad}>
        <DocViewerToolbar />
        <DocViewerImage />
      </DocViewerRoot>
    );
    expect(store.getState().status).toBe('loading');
    loadImage(640, 480);
    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'image', width: 640, height: 480 });
    expect(store.getState()).toMatchObject({ status: 'ready', canPrint: true });
  });

  it('takes a zoom request made before the stage has mounted', () => {
    const [store, actions] = createDocViewer();
    function ZoomOnMount() {
      useEffect(() => actions.setZoom(2), []);
      return null;
    }
    render(
      <DocViewerRoot src="/files/photo.png" store={store}>
        <DocViewerToolbar />
        <DocViewerImage />
        <ZoomOnMount />
      </DocViewerRoot>
    );
    loadImage();

    expect(screen.getByText('200%')).toBeInTheDocument();
  });

  it('zooms, rotates and prints through the store actions', async () => {
    const printed = capturePrints();
    const [store, actions] = createDocViewer();
    const onZoomChange = jest.fn();
    render(
      <DocViewerRoot src="/files/photo.png" store={store} onZoomChange={onZoomChange}>
        <DocViewerToolbar />
        <DocViewerImage />
      </DocViewerRoot>
    );
    const image = loadImage();

    act(() => actions.setZoom(2));
    expect(screen.getByText('200%')).toBeInTheDocument();
    act(() => actions.zoomIn());
    expect(screen.queryByText('200%')).not.toBeInTheDocument();
    act(() => actions.zoomOut());
    expect(screen.getByText('200%')).toBeInTheDocument();
    act(() => actions.rotate());
    expect(image.style.transform).toContain('rotate(90deg)');
    await act(async () => {
      await actions.print();
    });

    expect(printed[0]).toContain('src="/files/photo.png"');
    expect(onZoomChange).toHaveBeenCalledWith(2, { scale: 2 });
  });

  it('uses the natural size of an image that is already complete', () => {
    jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    jest.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(600);
    jest.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(300);
    const onDocumentLoad = jest.fn();
    render(
      <DocViewerRoot src="/files/photo.png" onDocumentLoad={onDocumentLoad}>
        <DocViewerToolbar />
        <DocViewerImage />
      </DocViewerRoot>
    );

    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'image', width: 600, height: 300 });
    expect(screen.queryByText('Loading document')).not.toBeInTheDocument();
  });

  it('keeps waiting for a complete image without a size', () => {
    jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    render(<Viewer />);
    expect(screen.getByText('Loading document')).toBeInTheDocument();
  });

  describe('drag to pan', () => {
    function setup(layout: Record<string, number>) {
      render(<Viewer />);
      loadImage();
      const stage = getStage() as HTMLElement;
      setLayout(stage, { clientWidth: 100, clientHeight: 100, scrollLeft: 0, scrollTop: 0 });
      setLayout(stage, layout);
      return stage;
    }

    it('scrolls while the mouse is dragged over an overflowing stage', () => {
      const stage = setup({ scrollWidth: 400, scrollHeight: 100 });
      act(() => {
        stage.dispatchEvent(pointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
      });
      expect(stage).toHaveAttribute('data-panning', 'true');

      act(() => {
        stage.dispatchEvent(pointerEvent('pointermove', { clientX: 30, clientY: 40 }));
      });
      expect(stage.scrollLeft).toBe(20);
      expect(stage.scrollTop).toBe(10);

      act(() => {
        stage.dispatchEvent(pointerEvent('pointerup'));
      });
      expect(stage).not.toHaveAttribute('data-panning');

      act(() => {
        stage.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
      });
      expect(stage.scrollLeft).toBe(20);
    });

    it('pans a right-to-left stage along its negative scrollLeft', () => {
      const stage = setup({ scrollWidth: 400, scrollHeight: 100 });
      stage.style.direction = 'rtl';
      stage.scrollLeft = -100;
      act(() => {
        stage.dispatchEvent(pointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
      });
      act(() => {
        stage.dispatchEvent(pointerEvent('pointermove', { clientX: 70, clientY: 50 }));
      });
      expect(stage.scrollLeft).toBe(-120);
      act(() => {
        stage.dispatchEvent(pointerEvent('pointermove', { clientX: 40, clientY: 50 }));
      });
      expect(stage.scrollLeft).toBe(-90);
    });

    it('pans when only the height overflows', () => {
      const stage = setup({ scrollWidth: 100, scrollHeight: 400 });
      act(() => {
        stage.dispatchEvent(pointerEvent('pointerdown'));
      });
      expect(stage).toHaveAttribute('data-panning', 'true');

      act(() => {
        stage.dispatchEvent(pointerEvent('pointercancel'));
      });
      expect(stage).not.toHaveAttribute('data-panning');
    });

    it('does not pan for other buttons, touch input or a stage that fits', () => {
      const stage = setup({ scrollWidth: 400, scrollHeight: 400 });
      act(() => {
        stage.dispatchEvent(pointerEvent('pointerdown', { button: 2 }));
        stage.dispatchEvent(pointerEvent('pointerdown', { pointerType: 'touch' }));
      });
      expect(stage).not.toHaveAttribute('data-panning');

      setLayout(stage, { scrollWidth: 100, scrollHeight: 100 });
      act(() => {
        stage.dispatchEvent(pointerEvent('pointerdown'));
      });
      expect(stage).not.toHaveAttribute('data-panning');

      act(() => {
        stage.dispatchEvent(pointerEvent('pointermove', { clientX: 20, clientY: 20 }));
      });
      expect(stage.scrollLeft).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('names the focusable stage and lists its shortcuts', () => {
      render(<Viewer />);
      loadImage();

      const region = screen.getByRole('region', { name: 'photo.png' });
      expect(region).toHaveAttribute('tabindex', '0');
      expect(region).toHaveAttribute('aria-keyshortcuts', 'Plus Minus 0 R');
    });

    it('has no axe violations', async () => {
      const { container } = render(<Viewer />);
      loadImage();
      expect((await axe(container)).violations).toEqual([]);
    });
  });
});

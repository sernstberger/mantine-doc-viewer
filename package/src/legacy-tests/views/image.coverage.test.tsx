import { render, screen } from '@mantine-tests/core';
import { act, fireEvent } from '@testing-library/react';
import React from 'react';
import { DocViewer, type DocViewerController } from '../../../../test-utils/render-legacy';

afterEach(() => {
  jest.restoreAllMocks();
});

function loadImage(width = 800, height = 400) {
  const image = screen.getByRole('img', { hidden: true }) as HTMLImageElement;
  Object.defineProperty(image, 'naturalWidth', { value: width });
  Object.defineProperty(image, 'naturalHeight', { value: height });
  fireEvent.load(image);
  return image;
}

const getStage = () =>
  screen.getByRole('img', { hidden: true }).closest('[data-pannable], [tabindex]')!;

function defineLayout(stage: Element, layout: Record<string, number>) {
  Object.entries(layout).forEach(([name, value]) => {
    Object.defineProperty(stage, name, { value, configurable: true, writable: true });
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

describe('controller', () => {
  it('zooms, rotates and prints through the controller', async () => {
    const printed: string[] = [];
    const append = document.body.append.bind(document.body);
    jest.spyOn(document.body, 'append').mockImplementation((...nodes: any[]) => {
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
    const ref = React.createRef<DocViewerController>();
    const onZoomChange = jest.fn();
    render(<DocViewer src="/files/photo.png" controllerRef={ref} onZoomChange={onZoomChange} />);
    const image = loadImage();

    act(() => ref.current!.setZoom(2));
    expect(screen.getByText('200%')).toBeInTheDocument();
    act(() => ref.current!.zoomIn());
    expect(screen.queryByText('200%')).not.toBeInTheDocument();
    act(() => ref.current!.zoomOut());
    expect(screen.getByText('200%')).toBeInTheDocument();
    act(() => ref.current!.rotate());
    expect(image.style.transform).toContain('rotate(90deg)');
    await act(async () => {
      await ref.current!.print();
    });

    expect(printed[0]).toContain('src="/files/photo.png"');
    expect(onZoomChange).toHaveBeenCalledWith(2, { scale: 2 });
  });
});

describe('keyboard', () => {
  it('ignores keys that are not shortcuts and keeps default behaviour', () => {
    render(<DocViewer src="/files/photo.png" />);
    loadImage();
    const stage = getStage();

    expect(fireEvent.keyDown(stage, { key: 'a' })).toBe(true);
    expect(fireEvent.keyDown(stage, { key: '+', ctrlKey: true })).toBe(true);
    expect(screen.getByText('100%')).toBeInTheDocument();

    expect(fireEvent.keyDown(stage, { key: '=' })).toBe(false);
    expect(screen.getByText('125%')).toBeInTheDocument();
  });
});

describe('image that finished loading before React attached', () => {
  it('uses the natural size of an image that is already complete', () => {
    jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    jest.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(600);
    jest.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(300);
    const onDocumentLoad = jest.fn();
    render(<DocViewer src="/files/photo.png" onDocumentLoad={onDocumentLoad} />);

    expect(onDocumentLoad).toHaveBeenCalledWith({ type: 'image', width: 600, height: 300 });
    expect(screen.queryByText('Loading document')).not.toBeInTheDocument();
  });

  it('keeps waiting for a complete image without a size', () => {
    jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    render(<DocViewer src="/files/photo.png" />);
    expect(screen.getByText('Loading document')).toBeInTheDocument();
  });
});

describe('toolbar controls', () => {
  it('hides zoom and rotate when asked to', () => {
    render(<DocViewer src="/files/photo.png" toolbarControls={{ zoom: false, rotate: false }} />);
    loadImage();
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rotate' })).not.toBeInTheDocument();
  });
});

describe('Ctrl and Meta wheel zoom', () => {
  it('zooms with Ctrl+wheel and Meta+wheel and leaves other wheel events alone', () => {
    render(<DocViewer src="/files/photo.png" />);
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
});

describe('drag to pan', () => {
  function setup(layout: Record<string, number>) {
    render(<DocViewer src="/files/photo.png" />);
    loadImage();
    const stage = getStage() as HTMLElement;
    defineLayout(stage, { clientWidth: 100, clientHeight: 100, scrollLeft: 0, scrollTop: 0 });
    defineLayout(stage, layout);
    return stage;
  }

  it('scrolls while the mouse is dragged over an overflowing stage', () => {
    const stage = setup({ scrollWidth: 400, scrollHeight: 100 });
    const down = pointerEvent('pointerdown', { clientX: 50, clientY: 50 });
    act(() => {
      stage.dispatchEvent(down);
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

    // After release, moving does not scroll
    act(() => {
      stage.dispatchEvent(pointerEvent('pointermove', { clientX: 0, clientY: 0 }));
    });
    expect(stage.scrollLeft).toBe(20);
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
    const overflowing = setup({ scrollWidth: 400, scrollHeight: 400 });
    const right = pointerEvent('pointerdown', { button: 2 });
    const touch = pointerEvent('pointerdown', { pointerType: 'touch' });
    act(() => {
      overflowing.dispatchEvent(right);
      overflowing.dispatchEvent(touch);
    });
    expect(overflowing).not.toHaveAttribute('data-panning');

    defineLayout(overflowing, { scrollWidth: 100, scrollHeight: 100 });
    const fits = pointerEvent('pointerdown');
    act(() => {
      overflowing.dispatchEvent(fits);
    });
    expect(overflowing).not.toHaveAttribute('data-panning');

    // Moving without a drag in progress does nothing
    act(() => {
      overflowing.dispatchEvent(pointerEvent('pointermove', { clientX: 20, clientY: 20 }));
    });
    expect(overflowing.scrollLeft).toBe(0);
  });
});

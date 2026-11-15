import { act, renderHook } from '@testing-library/react';
import { useControlledFullscreen } from './use-controlled-fullscreen';

function setup(value: boolean | undefined, onChange?: (fullscreen: boolean) => void) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  root.requestFullscreen = jest.fn().mockResolvedValue(undefined);
  const hook = renderHook(
    ({ value: v }) => {
      const result = useControlledFullscreen(v, onChange);
      result.ref(root);
      return result;
    },
    { initialProps: { value } }
  );
  return { root, ...hook };
}

function setFullscreenElement(root: Element, element: Element | undefined) {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: element });
  act(() => {
    root.dispatchEvent(new Event('fullscreenchange'));
  });
}

describe('useControlledFullscreen', () => {
  afterEach(() => {
    delete (document as any).fullscreenElement;
    delete (document as any).exitFullscreen;
  });

  it('asks the browser for full screen when value turns true', () => {
    const { root, rerender } = setup(false);
    expect(root.requestFullscreen).not.toHaveBeenCalled();
    rerender({ value: true });
    expect(root.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('leaves full screen when value turns false', () => {
    const exitFullscreen = jest.fn().mockResolvedValue(undefined);
    (document as any).exitFullscreen = exitFullscreen;
    const { root, rerender } = setup(undefined);
    setFullscreenElement(root, root);
    rerender({ value: false });
    expect(exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('reports changes made by the browser, and not again when nothing changed', () => {
    const onChange = jest.fn();
    const { root, rerender } = setup(undefined, onChange);
    rerender({ value: undefined });
    expect(onChange).not.toHaveBeenCalled();
    setFullscreenElement(root, root);
    expect(onChange).toHaveBeenCalledWith(true);
    setFullscreenElement(root, undefined);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not enter full screen again when the browser leaves it', () => {
    const { root, rerender } = setup(true);
    expect(root.requestFullscreen).toHaveBeenCalledTimes(1);
    setFullscreenElement(root, root);
    setFullscreenElement(root, undefined);
    rerender({ value: true });
    expect(root.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('reports the real state when the browser refuses', async () => {
    const onChange = jest.fn();
    const { root, rerender } = setup(false, onChange);
    root.requestFullscreen = jest.fn().mockRejectedValue(new Error('denied'));
    await act(async () => {
      rerender({ value: true });
    });
    expect(root.requestFullscreen).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

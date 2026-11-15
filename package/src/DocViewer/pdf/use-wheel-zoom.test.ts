import { fireEvent, renderHook } from '@testing-library/react';
import { getWheelScale } from '../views/image-zoom';
import { useWheelZoom } from './use-wheel-zoom';

describe('useWheelZoom', () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  const runFrames = () => frames.splice(0).forEach((callback) => callback(0));

  it('sets the zoom once per frame, from all the pinch events of that frame', () => {
    const root = document.createElement('div');
    const setZoom = jest.fn();
    renderHook(() => useWheelZoom(root, true, 1, setZoom));

    fireEvent.wheel(root, { deltaY: -10, ctrlKey: true });
    fireEvent.wheel(root, { deltaY: -10, ctrlKey: true });
    fireEvent.wheel(root, { deltaY: -10, metaKey: true });
    expect(setZoom).not.toHaveBeenCalled();
    expect(frames).toHaveLength(1);

    runFrames();
    expect(setZoom).toHaveBeenCalledTimes(1);
    expect(setZoom.mock.calls[0][0]).toBeCloseTo(getWheelScale(1, -30));

    // The next frame starts from the scale the viewer has then
    fireEvent.wheel(root, { deltaY: 10, ctrlKey: true });
    runFrames();
    expect(setZoom).toHaveBeenCalledTimes(2);
    expect(setZoom.mock.calls[1][0]).toBeCloseTo(getWheelScale(1, 10));
  });

  it('drops a frame that is still waiting when the viewer goes', () => {
    const root = document.createElement('div');
    const setZoom = jest.fn();
    const { unmount } = renderHook(() => useWheelZoom(root, true, 1, setZoom));
    fireEvent.wheel(root, { deltaY: -10, ctrlKey: true });
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});

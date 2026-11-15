import {
  applyAnchor,
  getAnchor,
  getImageKeyAction,
  getWheelScale,
  isOverflowing,
  nextImageRotation,
} from './image-zoom';

function stage(sizes: Partial<Record<string, number>>) {
  const node = document.createElement('div');
  Object.entries(sizes).forEach(([key, value]) =>
    Object.defineProperty(node, key, { value, writable: true, configurable: true })
  );
  node.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
  return node;
}

describe('image zoom helpers', () => {
  it('maps keys to actions, and ignores them with modifiers', () => {
    expect(getImageKeyAction({ key: '+' })).toBe('zoom-in');
    expect(getImageKeyAction({ key: '=' })).toBe('zoom-in');
    expect(getImageKeyAction({ key: '-' })).toBe('zoom-out');
    expect(getImageKeyAction({ key: '0' })).toBe('fit');
    expect(getImageKeyAction({ key: 'r' })).toBe('rotate');
    expect(getImageKeyAction({ key: 'x' })).toBeNull();
    expect(getImageKeyAction({ key: '+', ctrlKey: true })).toBeNull();
  });

  it('rotates and scales from the wheel', () => {
    expect(nextImageRotation(270)).toBe(0);
    expect(getWheelScale(1, 0)).toBe(1);
    expect(getWheelScale(1, -100)).toBeGreaterThan(1);
  });

  it('keeps the point under the pointer in place', () => {
    const node = stage({
      clientWidth: 200,
      clientHeight: 100,
      scrollWidth: 400,
      scrollHeight: 200,
      scrollLeft: 100,
      scrollTop: 50,
    });
    const anchor = getAnchor(node, 60, 70);
    expect(anchor).toEqual({ x: 50, y: 50, ratioX: 0.375, ratioY: 0.5 });

    Object.assign(node, { scrollWidth: 800, scrollHeight: 400 });
    applyAnchor(node, anchor);
    expect(node.scrollLeft).toBe(250);
    expect(node.scrollTop).toBe(150);
  });

  it('anchors on the middle without a pointer, and in empty stages', () => {
    const node = stage({
      clientWidth: 200,
      clientHeight: 100,
      scrollWidth: 0,
      scrollHeight: 0,
      scrollLeft: 0,
      scrollTop: 0,
    });
    expect(getAnchor(node)).toEqual({ x: 100, y: 50, ratioX: 0.5, ratioY: 0.5 });
  });

  it('knows when the image is larger than the view', () => {
    expect(
      isOverflowing(
        stage({ clientWidth: 200, clientHeight: 100, scrollWidth: 201, scrollHeight: 100 })
      )
    ).toBe(false);
    expect(
      isOverflowing(
        stage({ clientWidth: 200, clientHeight: 100, scrollWidth: 300, scrollHeight: 100 })
      )
    ).toBe(true);
  });
});

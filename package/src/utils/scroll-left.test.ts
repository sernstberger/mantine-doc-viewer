import { getScrollLeft, getScrollStart, setScrollLeft } from './scroll-left';

function scroller(direction: 'ltr' | 'rtl') {
  const node = document.createElement('div');
  node.style.direction = direction;
  Object.defineProperty(node, 'scrollWidth', { value: 1000 });
  Object.defineProperty(node, 'clientWidth', { value: 400 });
  document.body.append(node);
  return node;
}

describe('scroll-left', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reads and writes scrollLeft as it is in a left-to-right container', () => {
    const node = scroller('ltr');
    setScrollLeft(node, 250);
    expect(node.scrollLeft).toBe(250);
    expect(getScrollLeft(node)).toBe(250);
  });

  it('counts from the left edge in a right-to-left container, where scrollLeft is 0 or negative', () => {
    const node = scroller('rtl');
    node.scrollLeft = 0;
    expect(getScrollLeft(node)).toBe(600);
    node.scrollLeft = -600;
    expect(getScrollLeft(node)).toBe(0);
    setScrollLeft(node, 250);
    expect(node.scrollLeft).toBe(-350);
    expect(getScrollLeft(node)).toBe(250);
  });

  it('counts scrolling from where reading starts: the left edge, or the right edge in right-to-left', () => {
    const ltr = scroller('ltr');
    ltr.scrollLeft = 250;
    expect(getScrollStart(ltr)).toBe(250);
    const rtl = scroller('rtl');
    rtl.scrollLeft = -250;
    expect(getScrollStart(rtl)).toBe(250);
    rtl.scrollLeft = 0;
    expect(getScrollStart(rtl)).toBe(0);
  });
});

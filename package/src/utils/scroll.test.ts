import { getScrollBehavior, prefersReducedMotion } from './scroll';

describe('scroll behavior', () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  it('reads reduced motion', () => {
    window.matchMedia = jest.fn(() => ({ matches: true })) as any;
    expect(prefersReducedMotion()).toBe(true);
    expect(getScrollBehavior()).toBe('auto');
    window.matchMedia = jest.fn(() => ({ matches: false })) as any;
    expect(getScrollBehavior()).toBe('smooth');
    (window as any).matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
  });
});

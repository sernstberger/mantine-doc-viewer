import { renderHook } from '@testing-library/react';
import { computeScale } from './geometry';
import { usePagesGutter } from './use-pages-gutter';
import { DEFAULT_PAGES_GUTTER } from './zoom';

function pagesWithPadding(padding: Partial<CSSStyleDeclaration>) {
  const node = document.createElement('div');
  Object.assign(node.style, padding);
  document.body.appendChild(node);
  return node;
}

describe('usePagesGutter', () => {
  it('keeps the default gutter without a pages element', () => {
    const { result } = renderHook(() => usePagesGutter(null, 800));
    expect(result.current).toBe(DEFAULT_PAGES_GUTTER);
  });

  it('keeps the default gutter when the padding cannot be read', () => {
    const node = pagesWithPadding({});
    const { result } = renderHook(() => usePagesGutter(node, 800));
    expect(result.current).toEqual(DEFAULT_PAGES_GUTTER);
  });

  it('adds the padding of both sides, and reads it again when the view is resized', () => {
    const node = pagesWithPadding({
      paddingLeft: '48px',
      paddingRight: '40px',
      paddingTop: '40px',
      paddingBottom: '56px',
    });
    const { result, rerender } = renderHook(({ width }) => usePagesGutter(node, width), {
      initialProps: { width: 800 },
    });
    expect(result.current).toEqual({ x: 88, y: 96 });

    const settled = result.current;
    rerender({ width: 800 });
    expect(result.current).toBe(settled);

    node.style.paddingLeft = '8px';
    node.style.paddingRight = '8px';
    rerender({ width: 600 });
    expect(result.current).toEqual({ x: 16, y: 96 });
  });
});

describe('computeScale with a gutter', () => {
  const base = {
    bodyWidth: 832,
    bodyHeight: 632,
    columnGap: 16,
    pageWidth: 400,
    pageHeight: 300,
    zoom: 'fit-width' as const,
  };

  it('leaves the padding free when fitting the width', () => {
    expect(computeScale({ ...base, layout: 'single', gutter: { x: 32, y: 32 } })).toBe(2);
    expect(computeScale({ ...base, layout: 'single', gutter: { x: 132, y: 32 } })).toBe(1.75);
    expect(computeScale({ ...base, layout: 'two-page', gutter: { x: 132, y: 32 } })).toBeCloseTo(
      0.855
    );
  });

  it('leaves the vertical padding free when fitting the height', () => {
    expect(computeScale({ ...base, layout: 'wrapped', gutter: { x: 32, y: 132 } })).toBeCloseTo(
      (632 - 132) / 300
    );
  });
});

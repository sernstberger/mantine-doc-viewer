import { render, screen } from '@mantine-tests/core';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TestDocViewer, type TestDocViewerProps } from '../../../test-utils/viewer';
import { createDocViewer } from '../doc-viewer.store';
import { getPageRects, getPointOffset } from '../utils/page-points';
import { ACTIVE_MATCH_HIGHLIGHT } from '../utils/highlights';

import { getDocument, mockPdf } from '../../../test-utils/mock-pdf';

const PAGE_BOX = { left: 100, top: 1000, width: 612, height: 792 };

describe('getPointOffset', () => {
  it.each([
    [0, 40, 1.5, 60],
    [90, 40, 1.5, 0],
    [180, 40, 1.5, 1188 - 60],
    [270, 40, 1.5, 1188],
  ] as const)('places a point of a page turned %i degrees', (rotation, top, scale, expected) => {
    expect(getPointOffset(top, scale, rotation, 1188)).toBe(expected);
  });

  it('stays on the page', () => {
    expect(getPointOffset(5000, 1, 0, 792)).toBe(792);
    expect(getPointOffset(-50, 1, 0, 792)).toBe(0);
  });
});

describe('getPageRects', () => {
  const box = { left: 120, top: 1060, width: 60, height: 12 };

  it('gives boxes in page points, whatever the zoom', () => {
    expect(getPageRects([box], PAGE_BOX, 1, 0)).toEqual([{ x: 20, y: 60, width: 60, height: 12 }]);
    const zoomed = { ...PAGE_BOX, width: 918, height: 1188 };
    expect(
      getPageRects([{ ...box, left: 130, top: 1090, width: 90, height: 18 }], zoomed, 1.5, 0)
    ).toEqual([{ x: 20, y: 60, width: 60, height: 12 }]);
  });

  it('turns boxes back onto the page as it was before the reader rotated it', () => {
    // A page of 612 x 792 turned a quarter is shown 792 wide and 612 high
    const quarter = { ...PAGE_BOX, width: 792, height: 612 };
    const same = { left: 100 + 60, top: 1000 + 20, width: 12, height: 60 };
    // Shown at (60, 20): the page's own (20, 792 - 60 - 12 = 720 .. 732 is the top edge going down)
    expect(getPageRects([same], quarter, 1, 90)).toEqual([
      { x: 20, y: 720, width: 60, height: 12 },
    ]);

    const half = { ...PAGE_BOX };
    expect(
      getPageRects([{ left: 100 + 512, top: 1000 + 720, width: 60, height: 12 }], half, 1, 180)
    ).toEqual([{ x: 40, y: 60, width: 60, height: 12 }]);

    expect(
      getPageRects([{ left: 100 + 60, top: 1000 + 532, width: 12, height: 60 }], quarter, 1, 270)
    ).toEqual([{ x: 20, y: 60, width: 60, height: 12 }]);
  });

  it('leaves out boxes with no size', () => {
    expect(
      getPageRects(
        [
          { ...box, width: 0 },
          { ...box, height: 0 },
        ],
        PAGE_BOX,
        1,
        0
      )
    ).toEqual([]);
  });
});

function layout(restore: (() => void)[]) {
  const define = (name: string, get: (this: HTMLElement) => number) => {
    // Put jsdom's own getter back afterwards: deleting it leaves the property undefined, and
    // tooltips in later tests then place themselves at NaN
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)!;
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get });
    restore.push(() => Object.defineProperty(HTMLElement.prototype, name, original));
  };
  define('offsetTop', function () {
    return Number(this.dataset.pageNumber ?? 0) * 1000;
  });
  define('offsetHeight', () => 792);
}

describe('goToPage with a point', () => {
  const restore: (() => void)[] = [];
  beforeEach(() => getDocument.mockReset());
  afterEach(() => {
    restore.splice(0).forEach((fn) => fn());
    jest.restoreAllMocks();
  });

  async function setup() {
    mockPdf();
    layout(restore);
    const scrollTo = jest.spyOn(Element.prototype, 'scrollTo');
    const [store, controller] = createDocViewer();
    render(<TestDocViewer src="/files/report.pdf" defaultZoom={1} store={store} />);
    await screen.findAllByRole('group', { name: /^Page \d of 3$/ });
    return { scrollTo, controller };
  }

  it('scrolls to the point, in page points from the top of the page', async () => {
    const { scrollTo, controller } = await setup();

    act(() => controller.goToPage(2, { top: 100 }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 2000 - 12 + 100 }));

    act(() => controller.goToPage(2));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 2000 - 12 }));

    act(() => controller.goToPage(3, { top: -40 }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 3000 - 12 }));
  });

  it('jumps without scrolling smoothly when asked to', async () => {
    const { scrollTo, controller } = await setup();
    act(() => controller.goToPage(3, { behavior: 'instant' }));
    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ top: 3000 - 12, behavior: 'instant' })
    );
  });

  it('gives the canvas a page is drawn on, for apps that copy it', async () => {
    const { controller } = await setup();

    await waitFor(() => expect(controller.getPageCanvas(2)).toBeInstanceOf(HTMLCanvasElement));
    expect(controller.getPageCanvas(2)!.closest('[data-page-number]')).toHaveAttribute(
      'data-page-number',
      '2'
    );
    expect(controller.getPageCanvas(9)).toBeNull();
  });

  it('follows the zoom and the rotation of the page', async () => {
    const { scrollTo, controller } = await setup();

    act(() => controller.setZoom(2));
    act(() => controller.goToPage(2, { top: 100 }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 2000 - 12 + 200 }));

    act(() => controller.rotate());
    act(() => controller.rotate());
    act(() => controller.goToPage(2, { top: 100 }));
    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ top: 2000 - 12 + 792 - 200 })
    );
  });
});

describe('highlight', () => {
  const restore: (() => void)[] = [];
  const registry = new Map<string, Set<Range> & { priority: number }>();

  beforeAll(() => {
    (globalThis as any).Highlight = class extends Set<Range> {
      priority = 0;
    };
    (CSS as any).highlights = registry;
  });

  afterAll(() => {
    delete (globalThis as any).Highlight;
    delete (CSS as any).highlights;
  });

  beforeEach(() => {
    getDocument.mockReset();
    registry.clear();
  });

  afterEach(() => {
    restore.splice(0).forEach((fn) => fn());
    jest.restoreAllMocks();
  });

  async function setup(props: Partial<TestDocViewerProps> = {}) {
    mockPdf();
    layout(restore);
    const scrollTo = jest.spyOn(Element.prototype, 'scrollTo');
    const [store, controller] = createDocViewer();
    const utils = render(
      <TestDocViewer src="/files/report.pdf" defaultZoom={1} store={store} {...props} />
    );
    await screen.findByText('Next quarter outlook');
    const marked = () =>
      Array.from(registry.get(ACTIVE_MATCH_HIGHLIGHT) ?? []).map(
        (range) => `${range}@${range.startContainer.textContent}`
      );
    return { ...utils, scrollTo, controller, marked };
  }

  it('highlights the first place a text is found, ignoring case, and scrolls to it', async () => {
    const { controller, marked, scrollTo } = await setup();

    act(() => controller.highlight({ text: 'costs' }));
    await waitFor(() => expect(marked()).toEqual(['Costs@Costs fell']));
    // First to the page, then to the text itself
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 2000 - 12 }));
    expect(scrollTo.mock.calls.length).toBeGreaterThan(1);
  });

  it('paints the passage again when its page draws its text again', async () => {
    const { controller, marked } = await setup();

    act(() => controller.highlight({ text: 'costs' }));
    await waitFor(() => expect(marked()).toEqual(['Costs@Costs fell']));
    const before = Array.from(registry.get(ACTIVE_MATCH_HIGHLIGHT) ?? []);

    // Rotating draws every text layer again: the old spans go, so do their ranges
    await userEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await waitFor(() =>
      expect(Array.from(registry.get(ACTIVE_MATCH_HIGHLIGHT) ?? [])[0]).not.toBe(before[0])
    );
    const after = Array.from(registry.get(ACTIVE_MATCH_HIGHLIGHT) ?? []);
    expect(marked()).toEqual(['Costs@Costs fell']);
    expect(after[0].startContainer.isConnected).toBe(true);
  });

  it('keeps the painted passage when zooming, which only resizes the text layer', async () => {
    const { controller, marked } = await setup();

    act(() => controller.highlight({ text: 'costs' }));
    await waitFor(() => expect(marked()).toEqual(['Costs@Costs fell']));
    const before = Array.from(registry.get(ACTIVE_MATCH_HIGHLIGHT) ?? []);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await act(async () => {});
    expect(Array.from(registry.get(ACTIVE_MATCH_HIGHLIGHT) ?? [])).toEqual(before);
    expect(before[0].startContainer.isConnected).toBe(true);
  });

  it('scrolls the window to the text when the viewer grows with its pages', async () => {
    const windowScrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { controller, marked } = await setup({ autosize: true });

    act(() => controller.highlight({ text: 'costs' }));
    await waitFor(() => expect(marked()).toEqual(['Costs@Costs fell']));
    // Once to the page, once to the text in it
    await waitFor(() => expect(windowScrollTo.mock.calls.length).toBeGreaterThan(1));
  });

  it('can be limited to a page and to matching case', async () => {
    const { controller, marked } = await setup();

    act(() => controller.highlight({ text: 'quarter' }));
    await waitFor(() => expect(marked()).toEqual(['Quarter@Quarterly report']));

    act(() => controller.highlight({ text: 'quarter', page: 3 }));
    await waitFor(() => expect(marked()).toEqual(['quarter@Next quarter outlook']));

    act(() => controller.highlight({ text: 'quarter', matchCase: true }));
    await waitFor(() => expect(marked()).toEqual(['quarter@Revenue grew this quarter.']));
  });

  it('marks nothing when the text is not there', async () => {
    const { controller, marked } = await setup();

    act(() => controller.highlight({ text: 'invoice' }));
    await act(async () => {});
    expect(marked()).toEqual([]);

    act(() => controller.highlight({ text: 'costs', page: 1 }));
    await act(async () => {});
    expect(marked()).toEqual([]);
  });

  it('removes the highlight with clearHighlight', async () => {
    const { controller, marked } = await setup();

    act(() => controller.highlight({ text: 'costs' }));
    await waitFor(() => expect(marked()).toEqual(['Costs@Costs fell']));
    act(() => controller.clearHighlight());
    expect(marked()).toEqual([]);
  });

  it('draws boxes on a page and scrolls to them', async () => {
    const { controller, scrollTo, container } = await setup();

    act(() =>
      controller.highlight({
        page: 2,
        rects: [
          { x: 72, y: 300, width: 200, height: 14 },
          { x: 72, y: 314, width: 120, height: 14 },
        ],
      })
    );

    const boxes = container.querySelectorAll('.mantine-DocViewer-highlight');
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toHaveStyle({ left: '72px', top: '300px', width: '200px', height: '14px' });
    expect(boxes[0].closest('[data-page-number]')).toHaveAttribute('data-page-number', '2');
    expect(container.querySelector('.mantine-DocViewer-highlightLayer')).toHaveStyle({
      width: '612px',
      height: '792px',
    });
    // The first box is left a margin below the top of the view
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 2000 - 12 + 252 }));

    act(() => controller.setZoom(2));
    await waitFor(() =>
      expect(container.querySelector('.mantine-DocViewer-highlight')).toHaveStyle({ left: '144px' })
    );

    act(() => controller.clearHighlight());
    expect(container.querySelector('.mantine-DocViewer-highlight')).toBeNull();
  });

  it('marks boxes near the top of a page without scrolling above it, and no boxes at all', async () => {
    const { controller, scrollTo, container } = await setup();

    act(() => controller.highlight({ page: 1, rects: [{ x: 10, y: 20, width: 30, height: 10 }] }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 1000 - 12 }));

    scrollTo.mockClear();
    act(() => controller.highlight({ page: 1, rects: [] }));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.mantine-DocViewer-highlight')).toHaveLength(0);
  });
});

describe('onTextSelect', () => {
  beforeEach(() => getDocument.mockReset());
  afterEach(() => {
    window.getSelection()!.removeAllRanges();
    delete (Range.prototype as any).getClientRects;
    jest.restoreAllMocks();
  });

  async function setup() {
    mockPdf();
    const onTextSelect = jest.fn();
    const utils = render(
      <TestDocViewer
        src="/files/report.pdf"
        defaultZoom={1}
        pagesProps={{ onTextSelect: (text, { page, rects }) => onTextSelect(text, page, rects) }}
      />
    );
    const page = await screen.findByRole('group', { name: 'Page 1 of 3' });
    const span = await screen.findByText('Revenue grew this quarter.');
    page.getBoundingClientRect = () =>
      ({ ...PAGE_BOX, right: 712, bottom: 1792, x: 100, y: 1000 }) as DOMRect;
    return { ...utils, onTextSelect, page, span };
  }

  const box = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  });

  function select(range: Range) {
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  }

  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 350)));

  it('reports the text, its page and its boxes on that page in page points', async () => {
    const { span, onTextSelect } = await setup();
    (Range.prototype as any).getClientRects = () => [
      box(172, 1100, 150, 12),
      // The same spot again: the span's own box beside its text
      box(172, 1100, 150, 12),
      box(172, 1112, 80, 12),
      // Zero size, the page itself, and a box on the page below
      box(172, 1124, 0, 0),
      box(100, 1000, 612, 792),
      box(172, 1800, 80, 12),
    ];

    const range = document.createRange();
    range.selectNodeContents(span.firstChild!);
    select(range);
    select(range);
    await waitFor(() => expect(onTextSelect).toHaveBeenCalledTimes(1));
    expect(onTextSelect).toHaveBeenCalledWith('Revenue grew this quarter.', 1, [
      { x: 72, y: 100, width: 150, height: 12 },
      { x: 72, y: 112, width: 80, height: 12 },
    ]);
  });

  it('works from a selection that starts on an element, and accounts for the zoom', async () => {
    const { page, onTextSelect } = await setup();
    page.getBoundingClientRect = () =>
      ({ ...PAGE_BOX, width: 765, height: 990, right: 865, bottom: 1990 }) as DOMRect;
    (Range.prototype as any).getClientRects = () => [box(225, 1125, 250, 25)];
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    const range = document.createRange();
    // The text layer is drawn again at the new zoom
    range.selectNode(await screen.findByText('Revenue grew this quarter.'));
    select(range);
    await waitFor(() => expect(onTextSelect).toHaveBeenCalled());
    expect(onTextSelect.mock.calls[0][2]).toEqual([{ x: 100, y: 100, width: 200, height: 20 }]);
  });

  it('ignores a cleared selection, blank text, text outside the pages and other viewers', async () => {
    const { span, onTextSelect } = await setup();

    window.getSelection()!.removeAllRanges();
    document.dispatchEvent(new Event('selectionchange'));
    await settle();

    const collapsed = document.createRange();
    collapsed.setStart(span.firstChild!, 3);
    select(collapsed);
    await settle();

    const blank = document.createElement('p');
    blank.textContent = '   ';
    document.body.append(blank);
    const blankRange = document.createRange();
    blankRange.selectNodeContents(blank);
    select(blankRange);
    await settle();

    // Text of the page around the viewer
    const outside = document.createElement('p');
    outside.textContent = 'Not in a PDF';
    document.body.append(outside);
    const outsideRange = document.createRange();
    outsideRange.selectNodeContents(outside);
    select(outsideRange);
    await settle();

    // A page of another viewer
    const other = document.createElement('div');
    other.dataset.pageNumber = '1';
    other.textContent = 'Other viewer';
    document.body.append(other);
    const otherRange = document.createRange();
    otherRange.selectNodeContents(other);
    select(otherRange);
    await settle();
    expect(onTextSelect).not.toHaveBeenCalled();
    blank.remove();
    outside.remove();
    other.remove();
  });

  it('stops listening when the viewer goes away', async () => {
    const { span, onTextSelect, unmount } = await setup();
    const range = document.createRange();
    range.selectNodeContents(span.firstChild!);
    (Range.prototype as any).getClientRects = () => [box(172, 1100, 150, 12)];
    select(range);
    unmount();
    await settle();
    expect(onTextSelect).not.toHaveBeenCalled();
  });
});

import React, { use } from 'react';
import { render } from '@mantine-tests/core';
import { act } from '@testing-library/react';
import { useDocViewerContext } from '../../doc-viewer.context';
import { DocViewer } from '../../DocViewer';
import { DocViewerPages } from '../../DocViewerPages/DocViewerPages';
import { PdfPartsRoot } from '../../../../test-utils/pdf-parts';
import {
  PdfPagesRegistryContext,
  usePagesContext,
  type PdfPagesContextValue,
} from './use-pages-config';

function Probe({ onContext }: { onContext: (context: PdfPagesContextValue) => void }) {
  onContext(usePagesContext(useDocViewerContext(), use(PdfPagesRegistryContext)!));
  return null;
}

function setup(pages: React.ReactNode) {
  const seen: { context?: PdfPagesContextValue } = {};
  const onContext = (value: PdfPagesContextValue) => {
    seen.context = value;
  };
  const tree = (content: React.ReactNode) => (
    <PdfPartsRoot>
      <Probe onContext={onContext} />
      {content}
    </PdfPartsRoot>
  );
  const view = render(tree(pages));
  return {
    seen,
    rerender: (content: React.ReactNode) => view.rerender(<>{tree(content)}</>),
  };
}

describe('usePagesContext', () => {
  it('gives the session the page turning, scroll and reading handlers of the mounted Pages', () => {
    const onLinkClick = jest.fn();
    const onTextSelect = jest.fn();
    const onReadingProgress = jest.fn();
    const onReachEnd = jest.fn();
    const { seen } = setup(
      <DocViewerPages
        withPageTurning={{ swipe: false }}
        withScrollSnap
        withScroll={false}
        onLinkClick={onLinkClick}
        onTextSelect={onTextSelect}
        onReadingProgress={onReadingProgress}
        onReachEnd={onReachEnd}
      />
    );
    const { context } = seen;
    expect(context!.withPageTurning).toEqual({ swipe: false });
    expect(context!.withScrollSnap).toBe(true);
    expect(context!.withScroll).toBe(false);

    const event = new MouseEvent('click');
    const progress = { seen: [1], position: 1, reachedEnd: false };
    context!.events.onLinkClick('https://example.com', event);
    context!.events.onTextSelect('text', { page: 1, rects: [] });
    context!.events.onReadingProgress(progress as never);
    context!.events.onReachEnd();
    expect(onLinkClick).toHaveBeenCalledWith('https://example.com', event);
    expect(onTextSelect).toHaveBeenCalledWith('text', { page: 1, rects: [] });
    expect(onReadingProgress).toHaveBeenCalledWith(progress);
    expect(onReachEnd).toHaveBeenCalledTimes(1);
  });

  it('keeps the same events while the registered options are the same', () => {
    const view = setup(<DocViewerPages withPageTurning={{ swipe: false }} />);
    const first = view.seen.context!;
    act(() => view.rerender(<DocViewerPages withPageTurning={{ swipe: false }} />));
    expect(view.seen.context!.events).toBe(first.events);
    expect(view.seen.context!.withPageTurning).toEqual({ swipe: false });
  });

  it('follows a change of the turning options and falls back to Root when Pages unmounts', () => {
    const view = setup(<DocViewerPages withPageTurning />);
    expect(view.seen.context!.withPageTurning).toBe(true);
    act(() => view.rerender(<DocViewerPages withPageTurning={false} />));
    expect(view.seen.context!.withPageTurning).toBe(false);

    act(() => view.rerender(null));
    expect(view.seen.context!.withPageTurning).toBeUndefined();
    expect(() => view.seen.context!.events.onReachEnd()).not.toThrow();
  });

  it('uses the handlers DocViewer gives its pages through pagesProps', () => {
    const handlers = {
      onLinkClick: jest.fn(),
      onTextSelect: jest.fn(),
      onReadingProgress: jest.fn(),
      onReachEnd: jest.fn(),
    };
    const seen: { context?: PdfPagesContextValue } = {};
    render(
      <PdfPartsRoot>
        <DocViewer src="/files/report.pdf" pagesProps={handlers}>
          <Probe
            onContext={(context) => {
              seen.context = context;
            }}
          />
          <DocViewerPages />
        </DocViewer>
      </PdfPartsRoot>
    );
    const { events } = seen.context!;
    const event = new MouseEvent('click');
    events.onLinkClick('https://example.com', event);
    events.onTextSelect('text', { page: 1, rects: [] });
    events.onReadingProgress({ seen: [1], position: 1, reachedEnd: false } as never);
    events.onReachEnd();
    expect(handlers.onLinkClick).toHaveBeenCalledWith('https://example.com', event);
    expect(handlers.onTextSelect).toHaveBeenCalledTimes(1);
    expect(handlers.onReadingProgress).toHaveBeenCalledTimes(1);
    expect(handlers.onReachEnd).toHaveBeenCalledTimes(1);
  });
});

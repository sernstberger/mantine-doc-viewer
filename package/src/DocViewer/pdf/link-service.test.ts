import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  createLinkService,
  getDestinationY,
  getTopOffset,
  isSafeLinkUrl,
  resolveDestination,
} from './link-service';

// Built from parts so the linter does not read the test data as a script url
const SCRIPT_URL = ['java', 'script:alert(1)'].join('');

const pageRef = { num: 12, gen: 0 };

function mockDocument() {
  return {
    getDestination: jest.fn((name: string) =>
      Promise.resolve(name === 'chapter-2' ? [pageRef, { name: 'XYZ' }, 0, 600, null] : null)
    ),
    getPageIndex: jest.fn(() => Promise.resolve(4)),
    getPage: jest.fn(() => Promise.resolve({ view: [0, 0, 612, 792] })),
  } as unknown as PDFDocumentProxy;
}

describe('resolveDestination', () => {
  it('resolves named destinations with a position on the page', async () => {
    expect(await resolveDestination(mockDocument(), 'chapter-2')).toEqual({ page: 5, top: 192 });
  });

  it('resolves explicit destinations by page reference or page index', async () => {
    const document = mockDocument();
    expect(await resolveDestination(document, [pageRef, { name: 'Fit' }])).toEqual({ page: 5 });
    expect(await resolveDestination(document, [2, { name: 'FitH' }, 792])).toEqual({
      page: 3,
      top: 0,
    });
  });

  it('returns null for missing or broken destinations', async () => {
    const document = mockDocument();
    expect(await resolveDestination(document, 'missing')).toBeNull();
    expect(await resolveDestination(document, [])).toBeNull();
    expect(await resolveDestination(document, ['not a page', { name: 'Fit' }])).toBeNull();
    expect(await resolveDestination(document, null)).toBeNull();
  });
});

describe('isSafeLinkUrl', () => {
  it('allows web, mail and phone links only', () => {
    expect(isSafeLinkUrl('https://mantine.dev')).toBe(true);
    expect(isSafeLinkUrl('http://example.com')).toBe(true);
    expect(isSafeLinkUrl('mailto:team@example.com')).toBe(true);
    expect(isSafeLinkUrl('tel:+15550100')).toBe(true);
    expect(isSafeLinkUrl(SCRIPT_URL)).toBe(false);
    expect(isSafeLinkUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeLinkUrl('not a url')).toBe(false);
  });
});

describe('createLinkService', () => {
  const setup = () => {
    const handlers = {
      numPages: 10,
      getCurrentPage: () => 4,
      goToDestination: jest.fn(),
      onLinkClick: jest.fn(),
    };
    return { handlers, service: createLinkService(mockDocument(), handlers) };
  };

  it('opens web links in a new tab and lets the app stop them', () => {
    const { handlers, service } = setup();
    const link = document.createElement('a');
    service.addLinkAttributes(link, 'https://mantine.dev/');

    expect(link).toHaveAttribute('href', 'https://mantine.dev/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.rel).toContain('noopener');

    const event = new MouseEvent('click', { cancelable: true });
    link.onclick!(event as PointerEvent);
    expect(handlers.onLinkClick).toHaveBeenCalledWith('https://mantine.dev/', event);
  });

  it('leaves unsafe links without an address', () => {
    const { service } = setup();
    const link = document.createElement('a');
    service.addLinkAttributes(link, SCRIPT_URL);
    expect(link).not.toHaveAttribute('href');
  });

  it('goes to destinations and named pages', async () => {
    const { handlers, service } = setup();

    await service.goToDestination('chapter-2');
    expect(handlers.goToDestination).toHaveBeenCalledWith({ page: 5, top: 192 });

    service.executeNamedAction('NextPage');
    service.executeNamedAction('PrevPage');
    service.executeNamedAction('FirstPage');
    service.executeNamedAction('LastPage');
    service.executeNamedAction('Print');
    expect(handlers.goToDestination.mock.calls.slice(1).map(([value]) => value.page)).toEqual([
      5, 3, 1, 10,
    ]);
  });

  it('ignores missing destinations and unsupported link types', async () => {
    const { handlers, service } = setup();
    await service.goToDestination('missing');
    service.executeSetOCGState();
    expect(await service.getAttachmentContent()).toBeNull();
    expect(service.getDestinationHash()).toBe('#');
    expect(service.getAnchorUrl('top')).toBe('#top');
    expect(handlers.goToDestination).not.toHaveBeenCalled();
  });
});

describe('destination positions', () => {
  it('reads the top of XYZ, FitH and FitBH destinations', () => {
    expect(getDestinationY('XYZ', [10, 700, null])).toBe(700);
    expect(getDestinationY('FitH', [500])).toBe(500);
    expect(getDestinationY('FitBH', [400])).toBe(400);
    expect(getDestinationY('Fit', [])).toBeNull();
    expect(getDestinationY(undefined, [1])).toBeNull();
    expect(getDestinationY('XYZ', [0, null])).toBeNull();
  });

  it('counts from the top of the page box, never above it', () => {
    expect(getTopOffset([0, 0, 612, 792], 700)).toBe(92);
    expect(getTopOffset([0, 0, 612, 792], 900)).toBe(0);
  });
});

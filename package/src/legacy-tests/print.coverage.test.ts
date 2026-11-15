import { printImage, printPdfBytes, printText } from '../utils/print';
import { saveBytes } from '../utils/files';

const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

function lastFrame() {
  const frames = document.querySelectorAll('iframe');
  return frames[frames.length - 1] as HTMLIFrameElement;
}

/** Stubs what the print frame's window offers, then fires its load event */
function loadFrame(frame: HTMLIFrameElement, view: Partial<Window> | null) {
  Object.defineProperty(frame, 'contentWindow', { configurable: true, value: view });
  frame.onload?.(new Event('load'));
}

describe('print', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    URL.createObjectURL = jest.fn(() => 'blob:print');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
    document.body.innerHTML = '';
  });

  it('prints text through a hidden frame and removes it after a minute', async () => {
    const promise = printText('a <b> & "c"', 'Notes');
    const frame = lastFrame();
    expect(frame).toHaveAttribute('aria-hidden', 'true');
    expect(frame.srcdoc).toContain('<title>Notes</title>');
    expect(frame.srcdoc).toContain('&#60;b&#62; &#38; &#34;c&#34;');

    const view = { addEventListener: jest.fn(), focus: jest.fn(), print: jest.fn() };
    loadFrame(frame, view);
    await promise;

    expect(view.focus).toHaveBeenCalled();
    expect(view.print).toHaveBeenCalled();
    expect(document.body).toContainElement(frame);
    jest.advanceTimersByTime(60_000);
    expect(document.body).not.toContainElement(frame);
  });

  it('removes the frame when the print dialog closes', async () => {
    const promise = printText('text');
    const frame = lastFrame();
    const view = { addEventListener: jest.fn(), focus: jest.fn(), print: jest.fn() };
    loadFrame(frame, view);
    await promise;

    expect(view.addEventListener).toHaveBeenCalledWith('afterprint', expect.any(Function), {
      once: true,
    });
    view.addEventListener.mock.calls[0][1]();
    expect(document.body).not.toContainElement(frame);
  });

  it('prints an image with an escaped source and alt text', async () => {
    const promise = printImage('/a.png?x="1"', 'A "photo"', 'Photo');
    const frame = lastFrame();
    expect(frame.srcdoc).toContain('src="/a.png?x=&#34;1&#34;"');
    expect(frame.srcdoc).toContain('alt="A &#34;photo&#34;"');
    loadFrame(frame, { addEventListener: jest.fn(), focus: jest.fn(), print: jest.fn() });
    await promise;
  });

  it('uses an empty title when none is given', async () => {
    const promise = printText('x');
    expect(lastFrame().srcdoc).toContain('<title></title>');
    loadFrame(lastFrame(), { addEventListener: jest.fn(), focus: jest.fn(), print: jest.fn() });
    await promise;
  });

  it('rejects and removes the frame when it has no window', async () => {
    const promise = printText('x');
    const frame = lastFrame();
    loadFrame(frame, null);
    await expect(promise).rejects.toThrow('Print frame has no window');
    expect(document.body).not.toContainElement(frame);
  });

  it('rejects when printing throws', async () => {
    const promise = printText('x');
    const frame = lastFrame();
    loadFrame(frame, {
      addEventListener: jest.fn(),
      focus: jest.fn(),
      print: () => {
        throw new Error('blocked');
      },
    });
    await expect(promise).rejects.toThrow('blocked');
    expect(document.body).not.toContainElement(frame);
  });

  it('prints PDF bytes from an object url that is revoked later', async () => {
    const promise = printPdfBytes(new Uint8Array([1, 2, 3]));
    const frame = lastFrame();
    expect(frame.getAttribute('src')).toBe('blob:print');
    loadFrame(frame, { addEventListener: jest.fn(), focus: jest.fn(), print: jest.fn() });
    await promise;

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:print');
  });

  it('revokes the object url even when printing fails', async () => {
    const promise = printPdfBytes(new Uint8Array([1]));
    loadFrame(lastFrame(), null);
    await expect(promise).rejects.toThrow();
    jest.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:print');
  });
});

describe('saveBytes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    URL.createObjectURL = jest.fn(() => 'blob:save');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  });

  it('downloads the bytes under the file name and revokes the url later', () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    saveBytes(new Uint8Array([1]), 'out.pdf', 'application/pdf');
    expect(click).toHaveBeenCalled();
    expect(click.mock.contexts[0]).toMatchObject({ download: 'out.pdf' });
    jest.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:save');
    click.mockRestore();
  });

  it('defaults to a binary type', () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    saveBytes(new Uint8Array([1]), 'out.bin');
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});

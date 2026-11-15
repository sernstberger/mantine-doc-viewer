import { saveBytes } from './files';

const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

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

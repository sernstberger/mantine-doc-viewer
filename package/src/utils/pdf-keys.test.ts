import { getPdfKeyAction } from './pdf-keys';

const reading = {
  ready: true,
  presenting: false,
  currentPage: 2,
  numPages: 5,
  searchAvailable: true,
};
const presenting = { ...reading, presenting: true };

describe('getPdfKeyAction', () => {
  it('turns pages and exits in a presentation', () => {
    expect(getPdfKeyAction({ key: 'ArrowRight' }, presenting)).toEqual({ type: 'page', page: 3 });
    expect(getPdfKeyAction({ key: 'Escape' }, presenting)).toEqual({ type: 'exit' });
  });

  it('leaves presentation keys alone while reading', () => {
    expect(getPdfKeyAction({ key: 'ArrowRight' }, reading)).toBeNull();
  });

  it('zooms with + - and 0, but leaves r to its button', () => {
    expect(getPdfKeyAction({ key: '+' }, reading)).toEqual({ type: 'zoom-in' });
    expect(getPdfKeyAction({ key: '-' }, reading)).toEqual({ type: 'zoom-out' });
    expect(getPdfKeyAction({ key: '0' }, reading)).toEqual({ type: 'fit' });
    expect(getPdfKeyAction({ key: 'r' }, reading)).toBeNull();
  });

  it('opens search with Ctrl+F or Cmd+F', () => {
    expect(getPdfKeyAction({ key: 'f', ctrlKey: true }, reading)).toEqual({ type: 'search' });
    expect(getPdfKeyAction({ key: 'F', metaKey: true }, reading)).toEqual({ type: 'search' });
    expect(getPdfKeyAction({ key: 'f' }, reading)).toBeNull();
  });

  it('leaves Ctrl+F to the browser without a search bar', () => {
    const state = { ...reading, searchAvailable: false };
    expect(getPdfKeyAction({ key: 'f', ctrlKey: true }, state)).toBeNull();
  });

  it('does nothing before the document is loaded', () => {
    expect(getPdfKeyAction({ key: '+' }, { ...reading, ready: false })).toBeNull();
    expect(getPdfKeyAction({ key: 'f', ctrlKey: true }, { ...reading, ready: false })).toBeNull();
  });
});

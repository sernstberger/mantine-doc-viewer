import { createMarkupExtension } from '../DocViewerMarkup/markup-extension';
import { createPageEditorExtension } from '../DocViewerPageEditor/page-editor-extension';
import { getSaveHandler } from './get-save-handler';

const bytes = new Uint8Array([1]);

describe('getSaveHandler', () => {
  it('has no handler without an editor or markup extension', () => {
    expect(getSaveHandler({ editor: undefined, markup: undefined, fileName: 'a.pdf' })).toBe(
      undefined
    );
  });

  it('hands each reason to its extension callback', async () => {
    const onDocumentChange = jest.fn();
    const onExtract = jest.fn();
    const onAnnotate = jest.fn();
    const save = getSaveHandler({
      editor: createPageEditorExtension({ onDocumentChange, onExtract }).options as never,
      markup: createMarkupExtension({ onDocumentChange: onAnnotate }).options as never,
      fileName: 'a.pdf',
    })!;
    await save(bytes, { reason: 'save', pages: [1] });
    await save(bytes, { reason: 'reorder', pages: [2, 1] });
    await save(bytes, { reason: 'extract', pages: [2] });
    await save(bytes, { reason: 'annotate', pages: [1] });
    expect(onDocumentChange).toHaveBeenCalledWith(bytes, { reason: 'save', pages: [1] });
    expect(onDocumentChange).toHaveBeenCalledWith(bytes, { reason: 'reorder', pages: [2, 1] });
    expect(onExtract).toHaveBeenCalledWith(bytes, { pages: [2] });
    expect(onAnnotate).toHaveBeenCalledWith(bytes, { reason: 'annotate', pages: [1] });
  });

  it('downloads saved, extracted and marked up documents without a callback', async () => {
    const createObjectURL = jest.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL, revokeObjectURL: jest.fn() });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const save = getSaveHandler({
      editor: createPageEditorExtension().options as never,
      markup: createMarkupExtension().options as never,
      fileName: 'a.pdf',
    })!;
    await save(bytes, { reason: 'save', pages: [1] });
    await save(bytes, { reason: 'extract', pages: [1] });
    await save(bytes, { reason: 'annotate', pages: [1] });
    await save(bytes, { reason: 'delete', pages: [1] });
    expect(click).toHaveBeenCalledTimes(3);
    click.mockRestore();
  });
});
